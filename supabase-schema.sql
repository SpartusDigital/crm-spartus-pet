-- =====================================================================
-- SPARTUS PET — Database Schema
-- =====================================================================
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run".
-- Cria todas as tabelas, Row Level Security, triggers e bucket de logos.
-- =====================================================================

-- ===== 1) PROFILES (extende auth.users) =====
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text,
  empresa_nome text,
  empresa_telefone text,
  empresa_endereco text,
  empresa_cnpj text,
  empresa_logo_url text,
  config_horario_abertura time default '08:00',
  config_horario_fechamento time default '18:00',
  plano text,
  plano_data_inicio date,
  plano_data_expiracao date,
  plano_ativo boolean default false,
  stripe_customer_id text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: cria profile automaticamente quando user é criado.
-- Marca o gustavoponteslopes@gmail.com como admin automaticamente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    case when lower(new.email) = 'gustavoponteslopes@gmail.com' then true else false end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== 2) TUTORES =====
create table if not exists public.tutores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  nome text not null,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  criado_em date default current_date,
  created_at timestamptz default now()
);
create index if not exists idx_tutores_user on public.tutores(user_id);

-- ===== 3) PETS =====
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  tutor_id uuid references public.tutores on delete cascade not null,
  nome text not null,
  especie text,
  raca text,
  porte text,
  idade numeric,
  peso numeric,
  pelagem text,
  temperamento text,
  ultimo_banho date,
  ultima_tosa date,
  recorrencia_dias int default 21,
  valor_padrao numeric,
  alergias text,
  observacoes text,
  created_at timestamptz default now()
);
create index if not exists idx_pets_user on public.pets(user_id);
create index if not exists idx_pets_tutor on public.pets(tutor_id);

-- ===== 4) SERVIÇOS =====
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  nome text not null,
  categoria text,
  preco_pequeno numeric default 0,
  preco_medio numeric default 0,
  preco_grande numeric default 0,
  duracao int default 60,
  created_at timestamptz default now()
);
create index if not exists idx_servicos_user on public.servicos(user_id);

-- ===== 5) AGENDAMENTOS =====
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  pet_id uuid references public.pets on delete set null,
  servico_nome text,
  servicos jsonb,
  categoria text,
  data date not null,
  horario time not null,
  duracao int default 60,
  status text default 'confirmado',
  valor numeric default 0,
  observacoes text,
  profissional text,
  created_at timestamptz default now()
);
create index if not exists idx_agend_user on public.agendamentos(user_id);
create index if not exists idx_agend_data on public.agendamentos(data);

-- ===== 6) PRODUTOS =====
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  codigo text,
  nome text not null,
  categoria text,
  preco_custo numeric default 0,
  preco_venda numeric default 0,
  estoque int default 0,
  estoque_minimo int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_produtos_user on public.produtos(user_id);

-- ===== 7) VENDAS =====
create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  cliente_id uuid references public.tutores on delete set null,
  cliente_nome text,
  itens jsonb,
  total numeric default 0,
  pagamento text,
  data date default current_date,
  created_at timestamptz default now()
);
create index if not exists idx_vendas_user on public.vendas(user_id);

-- ===== 8) FINANCEIRO =====
create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  tipo text,
  categoria text,
  valor numeric default 0,
  data date,
  descricao text,
  created_at timestamptz default now()
);
create index if not exists idx_fin_user on public.financeiro(user_id);

-- =====================================================================
-- ROW LEVEL SECURITY (cada user só vê os próprios dados; admin vê tudo)
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.tutores enable row level security;
alter table public.pets enable row level security;
alter table public.servicos enable row level security;
alter table public.agendamentos enable row level security;
alter table public.produtos enable row level security;
alter table public.vendas enable row level security;
alter table public.financeiro enable row level security;

-- Função helper: descobre se o user logado é admin
create or replace function public.is_admin_user()
returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- PROFILES policies
drop policy if exists "select own or admin" on public.profiles;
create policy "select own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin_user());

drop policy if exists "update own" on public.profiles;
create policy "update own" on public.profiles
  for update using (auth.uid() = id or public.is_admin_user());

-- Cria policies em todas as tabelas de dados (somente o dono ou admin acessam)
do $$
declare t text;
begin
  for t in select unnest(array['tutores','pets','servicos','agendamentos','produtos','vendas','financeiro']) loop
    execute format('drop policy if exists "select own" on public.%I', t);
    execute format('drop policy if exists "insert own" on public.%I', t);
    execute format('drop policy if exists "update own" on public.%I', t);
    execute format('drop policy if exists "delete own" on public.%I', t);
    execute format('create policy "select own" on public.%I for select using (auth.uid() = user_id or public.is_admin_user())', t);
    execute format('create policy "insert own" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "update own" on public.%I for update using (auth.uid() = user_id or public.is_admin_user())', t);
    execute format('create policy "delete own" on public.%I for delete using (auth.uid() = user_id or public.is_admin_user())', t);
  end loop;
end $$;

-- =====================================================================
-- STORAGE — bucket público para logos das empresas
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos public read" on storage.objects;
create policy "logos public read" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "users upload own logos" on storage.objects;
create policy "users upload own logos" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users update own logos" on storage.objects;
create policy "users update own logos" on storage.objects
  for update using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users delete own logos" on storage.objects;
create policy "users delete own logos" on storage.objects
  for delete using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- FIM DO SCRIPT — se rodou sem erros, o banco está pronto.
-- =====================================================================
