-- =====================================================================
-- SPARTUS PET — Trial gratuito de 3 dias
-- Cole este script no SQL Editor do Supabase e rode (Run / Ctrl+Enter)
-- =====================================================================

-- 1) Atualiza o trigger de criação de novo usuário para já dar trial
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id, nome, is_admin,
    plano, plano_ativo, plano_data_inicio, plano_data_expiracao
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    case when lower(new.email) = 'gustavoponteslopes@gmail.com' then true else false end,
    'trial',
    true,
    current_date,
    current_date + interval '3 days'
  );
  return new;
end;
$$;

-- 2) (Opcional) Concede trial para usuários já cadastrados que não têm plano
update public.profiles
set plano = 'trial',
    plano_data_inicio = current_date,
    plano_data_expiracao = current_date + interval '3 days',
    plano_ativo = true
where (plano is null or plano = '')
  and is_admin = false;

-- 3) Função utilitária para verificar se trial expirou (usada por triggers/views se quiser)
create or replace function public.trial_expirou(p_id uuid)
returns boolean language sql security definer stable as $$
  select coalesce(
    (select plano = 'trial' and plano_data_expiracao < current_date
     from public.profiles where id = p_id), false);
$$;

-- =====================================================================
-- FIM. O trial fica ativo por 3 dias após o cadastro.
-- Após esse prazo, o CRM bloqueia o acesso e exibe a tela de planos.
-- =====================================================================
