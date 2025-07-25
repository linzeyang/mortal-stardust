import { Metadata } from 'next';
import { ClientOnly } from '@/components/ui/client-only';
import DataSecurityDashboard from '@/components/security/data-security-dashboard';
import { RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: '数据安全中心 - LifePath AI',
  description: '管理和监控您的加密数据安全，查看访问日志和合规状态'
};

export default function SecurityPage() {
  return (
    <ClientOnly 
      fallback={
        <div className="p-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">加载安全仪表板...</p>
          </div>
        </div>
      }
    >
      <DataSecurityDashboard />
    </ClientOnly>
  );
}
