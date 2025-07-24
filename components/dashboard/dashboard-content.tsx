'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Settings, 
  Plus,
  Heart,
  MessageSquare,
  Clock
} from 'lucide-react';

interface DashboardUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  preferences: any;
  createdAt: Date;
}

interface DashboardContentProps {
  user: DashboardUser;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'default';
      case 'workplace_newcomer': return 'secondary';
      case 'entrepreneur': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return '学生';
      case 'workplace_newcomer': return '职场新人';
      case 'entrepreneur': return '创业者';
      default: return '其他';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>{user.firstName} {user.lastName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            <Badge variant={getRoleBadgeColor(user.role)}>
              {getRoleDisplayName(user.role)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">注册时间</span>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">语言偏好</span>
              <p className="font-medium">{user.preferences?.language || 'zh-CN'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">通知设置</span>
              <p className="font-medium">
                {user.preferences?.notifications ? '已开启' : '已关闭'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">数据共享</span>
              <p className="font-medium">
                {user.preferences?.dataSharing ? '已同意' : '未同意'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="experiences">我的经历</TabsTrigger>
          <TabsTrigger value="solutions">AI方案</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总经历数</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  还没有添加任何经历
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI方案数</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  等待您的第一个经历
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">成长指数</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">
                  开始您的成长之旅
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>
                选择一个操作来开始您的AI辅导之旅
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Plus className="h-6 w-6 text-primary" />
                <span>添加新经历</span>
              </Button>
              
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Heart className="h-6 w-6 text-primary" />
                <span>心理疗愈</span>
              </Button>
              
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span>AI咨询</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="experiences" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">我的人生经历</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加经历
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">还没有经历记录</h3>
              <p className="text-muted-foreground text-center mb-4">
                开始记录您的人生经历，让AI为您提供个性化的指导和建议
              </p>
              <Button>添加您的第一个经历</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="solutions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI解决方案</h3>
            <div className="flex space-x-2">
              <Badge variant="outline">
                <Heart className="w-3 h-3 mr-1" />
                心理疗愈
              </Badge>
              <Badge variant="outline">
                <Brain className="w-3 h-3 mr-1" />
                实用方案
              </Badge>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                后续支持
              </Badge>
            </div>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">等待AI分析</h3>
              <p className="text-muted-foreground text-center mb-4">
                添加您的人生经历后，AI将为您生成个性化的解决方案
              </p>
              <Button variant="outline">查看样例方案</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>账户设置</CardTitle>
              <CardDescription>
                管理您的账户信息和偏好设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <p className="text-muted-foreground">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">邮箱</label>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">角色</label>
                  <p className="text-muted-foreground">{getRoleDisplayName(user.role)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">语言</label>
                  <p className="text-muted-foreground">简体中文</p>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
                <Button variant="outline">修改密码</Button>
                <Button variant="destructive">删除账户</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}