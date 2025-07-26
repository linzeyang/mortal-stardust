import { Metadata } from 'next';
import { ClientOnly } from '@/components/ui/client-only';
import DataSecurityDashboard from '@/components/security/data-security-dashboard';
import { RefreshCw } from 'lucide-react';
import Image from 'next/image';

export const metadata: Metadata = {
  title: '数据安全中心 - LifePath AI',
  description: '管理和监控您的加密数据安全，查看访问日志和合规状态'
};

export default function SecurityPage() {
  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 - 使用 tianmen.png */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/tianmen.png"
          alt="安全中心背景"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* 深色遮罩层，确保内容可读性 */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* 内容层 */}
      <div className="relative z-10">
        <ClientOnly 
          fallback={
            <div className="p-6">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-white/80" />
                <p className="text-white/80">加载安全仪表板...</p>
              </div>
            </div>
          }
        >
          <DataSecurityDashboard />
        </ClientOnly>
      </div>
    </div>
  );
}
