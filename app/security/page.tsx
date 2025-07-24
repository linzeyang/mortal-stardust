import { Metadata } from 'next';
import DataSecurityDashboard from '@/components/security/data-security-dashboard';

export const metadata: Metadata = {
  title: '数据安全中心 - LifePath AI',
  description: '管理和监控您的加密数据安全，查看访问日志和合规状态'
};

export default function SecurityPage() {
  return <DataSecurityDashboard />;
}
