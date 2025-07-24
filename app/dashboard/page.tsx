import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/mongodb-queries';
import DashboardContent from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              欢迎回来，{user.firstName}！
            </h1>
            <p className="text-muted-foreground mt-2">
              管理您的人生经历和AI辅导方案
            </p>
          </div>
          
          <DashboardContent user={user} />
        </div>
      </div>
    </main>
  );
}