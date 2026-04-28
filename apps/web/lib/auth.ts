import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'petshop-crm-dev-secret-2024',
  pages: { signIn: '/login' },
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        tenant: { label: 'Tenant', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[authorize] called with:', credentials?.email, credentials?.tenant);

        if (!credentials?.tenant || !credentials?.email || !credentials?.password) {
          console.log('[authorize] missing fields');
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant: credentials.tenant,
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log('[authorize] API response status:', response.status);

          if (!response.ok) {
            const body = await response.text();
            console.log('[authorize] API error body:', body);
            return null;
          }

          const data = await response.json();
          console.log('[authorize] success, user:', data.user?.email);

          return { ...data.user, accessToken: data.accessToken };
        } catch (err: any) {
          console.error('[authorize] fetch error:', err.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session.user as any).role = token.role;
      (session.user as any).tenantId = token.tenantId;
      return session;
    },
  },
};
