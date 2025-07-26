'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Database,
  Clock,
  Eye,
  Archive,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Key,
  Activity,
  FileText,
  BarChart3,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 安全的日期格式化函数，避免水合错误
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD 格式
  } catch {
    return '未知日期';
  }
};

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:mm 格式
  } catch {
    return '未知时间';
  }
};

interface DataInventory {
  user_id: string;
  total_records: number;
  categories: Record<string, {
    record_count: number;
    total_size_bytes: number;
    oldest_record: string;
    newest_record: string;
    sensitivity_levels: string[];
  }>;
  generated_at: string;
}

interface SecurityStats {
  user_id: string;
  security_score: number;
  total_encrypted_records: number;
  recent_access_stats: Array<{
    _id: {
      access_type: string;
      success: boolean;
    };
    count: number;
  }>;
  data_categories: number;
  last_updated: string;
  recommendations: string[];
}

interface AccessLog {
  _id: string;
  userId: string;
  dataId: string;
  dataCategory: string;
  accessType: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function DataSecurityDashboard() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<DataInventory | null>(null);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load data inventory
      const inventoryResponse = await fetch('/api/secure-data/inventory', {
        credentials: 'include'
      });

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);
      }

      // Load security statistics
      const statsResponse = await fetch('/api/secure-data/statistics', {
        credentials: 'include'
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSecurityStats(statsData);
      }

      // Load recent access logs
      const logsResponse = await fetch('/api/secure-data/access-logs?limit=50', {
        credentials: 'include'
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAccessLogs(logsData.logs);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "加载失败",
        description: "无法加载安全仪表板数据",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSecurityScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal_info': return <Key className="h-4 w-4" />;
      case 'experience_data': return <FileText className="h-4 w-4" />;
      case 'solution_data': return <Database className="h-4 w-4" />;
      case 'rating_data': return <BarChart3 className="h-4 w-4" />;
      case 'media_files': return <Archive className="h-4 w-4" />;
      case 'activity_logs': return <Activity className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'personal_info': '个人信息',
      'experience_data': '经历数据',
      'solution_data': '解决方案',
      'rating_data': '评价数据',
      'media_files': '媒体文件',
      'activity_logs': '活动日志'
    };
    return labels[category] || category;
  };

  if (!isClient || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-white/80" />
          <p className="text-white/80">加载安全仪表板...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">数据安全中心</h1>
              <p className="text-white/90">
                管理和监控您的加密数据安全
              </p>
            </div>
          </div>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      {securityStats && (
        <div className="mb-6">
          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                安全评分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getSecurityScoreColor(securityStats.security_score)}`}>
                    {securityStats.security_score}
                  </div>
                  <div className="text-sm text-white/80">安全评分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {securityStats.total_encrypted_records}
                  </div>
                  <div className="text-sm text-white/80">加密记录数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {securityStats.data_categories}
                  </div>
                  <div className="text-sm text-white/80">数据类别</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    100%
                  </div>
                  <div className="text-sm text-white/80">加密覆盖率</div>
                </div>
              </div>

              <div className="mt-4">
                <Progress value={securityStats.security_score} className="h-2" />
              </div>

              {securityStats.recommendations.length > 0 && (
                <Alert className="mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>安全建议：</strong>
                    <ul className="mt-2 list-disc list-inside">
                      {securityStats.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/80 backdrop-blur-md border-gray-600/50">
          <TabsTrigger value="overview">数据概览</TabsTrigger>
          <TabsTrigger value="access-logs">访问日志</TabsTrigger>
          <TabsTrigger value="compliance">合规管理</TabsTrigger>
        </TabsList>

        {/* Data Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {inventory && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(inventory.categories).map(([category, data]) => (
                <Card key={category} className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                      {getCategoryIcon(category)}
                      {getCategoryLabel(category)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/80">记录数量</span>
                      <Badge variant="secondary">{data.record_count}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/80">数据大小</span>
                      <span className="text-sm font-medium text-white">{formatBytes(data.total_size_bytes)}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-white/80">敏感级别</div>
                      <div className="flex flex-wrap gap-1">
                        {data.sensitivity_levels.map((level) => (
                          <Badge key={level} variant="outline" className="text-xs">
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-white/80">
                      最新: {formatDate(data.newest_record)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="access-logs" className="space-y-4">
          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5" />
                最近访问记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessLogs.length > 0 ? (
                  accessLogs.slice(0, 20).map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${log.success ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {log.accessType.toUpperCase()} - {getCategoryLabel(log.dataCategory)}
                          </div>
                          <div className="text-xs text-white/80">
                            {formatDateTime(log.timestamp)}
                            {log.ipAddress && ` • ${log.ipAddress}`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? "成功" : "失败"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/80">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>暂无访问记录</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5" />
                  数据保护合规
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-400/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">GDPR 合规</span>
                  </div>
                  <Badge className="bg-green-400/30 text-green-300">已启用</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-400/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">数据加密</span>
                  </div>
                  <Badge className="bg-green-400/30 text-green-300">AES-256</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-400/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">访问审计</span>
                  </div>
                  <Badge className="bg-green-400/30 text-green-300">完整记录</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-400/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">数据保留</span>
                  </div>
                  <Badge className="bg-green-400/30 text-green-300">自动管理</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/80 backdrop-blur-md border-gray-600/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  安全操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  导出我的数据
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  查看数据保留策略
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  设置数据过期时间
                </Button>

                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除所有数据
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
