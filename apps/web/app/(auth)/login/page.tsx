'use client';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({
  tenant: z.string().min(1, 'Informe o slug do seu pet shop'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenant: params.get('tenant') ?? '' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const res = await signIn('credentials', { ...data, redirect: false });
    if (res?.ok) {
      router.push(`/${data.tenant}/dashboard`);
    } else {
      setError('Email ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              🐾
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PetShop CRM</h1>
            <p className="text-gray-500 text-sm mt-1">Entre na sua conta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug do Pet Shop
              </label>
              <input
                {...register('tenant')}
                className="input"
                placeholder="meu-petshop"
              />
              {errors.tenant && <p className="text-red-500 text-xs mt-1">{errors.tenant.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="seu@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input {...register('password')} type="password" className="input" placeholder="••••••••" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Novo por aqui?{' '}
            <a href="/register" className="text-primary font-medium hover:underline">
              Criar conta grátis
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Demo: tenant=<strong>demo</strong> | admin@demo.com | admin123456
        </p>
      </div>
    </div>
  );
}
