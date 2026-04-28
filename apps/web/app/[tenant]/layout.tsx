import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchTenantConfig, themeToCSS } from '@/lib/tenant';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface Props {
  children: React.ReactNode;
  params: { tenant: string };
}

export default async function TenantLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?tenant=${params.tenant}`);

  const config = await fetchTenantConfig(params.tenant);
  if (!config) redirect('/login');

  const cssVars = config.theme ? themeToCSS(config.theme) : '';

  return (
    <>
      {cssVars && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar tenant={params.tenant} config={config} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header tenant={params.tenant} config={config} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
