'use client';

// React hooks导入
import { useState } from 'react';
// UI组件导入
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// 图标组件导入
import {
  User,        // 用户图标
  BookOpen,    // 书本图标 - 代表经历
  Brain,       // 大脑图标 - 代表AI方案
  TrendingUp,  // 趋势上升图标 - 代表成长指数
  Settings,    // 设置图标
  Plus,        // 加号图标 - 代表添加操作
  Heart,       // 心形图标 - 代表心理疗愈
  MessageSquare, // 消息框图标 - 代表AI咨询
  Clock        // 时钟图标 - 代表后续支持
} from 'lucide-react';

// 用户数据接口定义
interface DashboardUser {
  id: string;                    // 用户唯一标识
  email: string;                 // 用户邮箱
  firstName: string;             // 用户名字
  lastName: string;              // 用户姓氏
  role: string;                  // 用户角色（学生/职场新人/创业者）
  preferences: any;              // 用户偏好设置
  createdAt: string | null;      // 账户创建时间
  updatedAt?: string | null;     // 账户更新时间
  name?: string;                 // 用户全名（可选）
  avatar?: string | null;        // 用户头像URL（可选）
  phoneNumber?: string | null;   // 用户手机号（可选）
}

// 仪表板内容组件的属性接口
interface DashboardContentProps {
  user: DashboardUser;           // 传入的用户数据
}

// 仪表板内容主组件
export default function DashboardContent({ user }: DashboardContentProps) {
  // 当前激活的标签页状态管理
  const [activeTab, setActiveTab] = useState('overview');

  // 根据用户角色返回对应的徽章颜色
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'default';           // 学生 - 默认颜色
      case 'workplace_newcomer': return 'secondary'; // 职场新人 - 次要颜色
      case 'entrepreneur': return 'destructive';     // 创业者 - 强调颜色
      default: return 'outline';                     // 其他 - 轮廓颜色
    }
  };

  // 根据用户角色返回中文显示名称
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
      {/* 用户信息卡片 - 显示用户基本信息和设置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* 用户头像和基本信息区域 */}
            <div className="flex items-center space-x-4">
              {/* 用户头像占位符 */}
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              {/* 用户姓名和邮箱 */}
              <div>
                <CardTitle>{user.firstName} {user.lastName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            {/* 用户角色徽章 */}
            <Badge variant={getRoleBadgeColor(user.role)}>
              {getRoleDisplayName(user.role)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* 用户详细信息网格布局 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {/* 注册时间信息 */}
            <div>
              <span className="text-muted-foreground">注册时间</span>
              <p className="font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
              </p>
            </div>
            {/* 语言偏好设置 */}
            <div>
              <span className="text-muted-foreground">语言偏好</span>
              <p className="font-medium">{user.preferences?.language || 'zh-CN'}</p>
            </div>
            {/* 通知设置状态 */}
            <div>
              <span className="text-muted-foreground">通知设置</span>
              <p className="font-medium">
                {user.preferences?.notifications ? '已开启' : '已关闭'}
              </p>
            </div>
            {/* 数据共享同意状态 */}
            <div>
              <span className="text-muted-foreground">数据共享</span>
              <p className="font-medium">
                {user.preferences?.dataSharing ? '已同意' : '未同意'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要仪表板标签页导航 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* 标签页导航栏 - 四个主要功能模块 */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>           {/* 数据概览页面 */}
          <TabsTrigger value="experiences">我的经历</TabsTrigger>    {/* 用户经历管理 */}
          <TabsTrigger value="solutions">AI方案</TabsTrigger>        {/* AI生成的解决方案 */}
          <TabsTrigger value="settings">设置</TabsTrigger>           {/* 账户设置 */}
        </TabsList>

        {/* 概览标签页内容 - 显示用户数据统计和快速操作 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 数据统计卡片网格布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 总经历数统计卡片 */}
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

            {/* AI方案数统计卡片 */}
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

            {/* 成长指数统计卡片 */}
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

          {/* 快速操作区域 - 提供主要功能的快捷入口 */}
          <Card>
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>
                选择一个操作来开始您的AI辅导之旅
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 添加新经历按钮 */}
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Plus className="h-6 w-6 text-primary" />
                <span>添加新经历</span>
              </Button>

              {/* 心理疗愈功能按钮 */}
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Heart className="h-6 w-6 text-primary" />
                <span>心理疗愈</span>
              </Button>

              {/* AI咨询功能按钮 */}
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span>AI咨询</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 我的经历标签页内容 - 管理用户的人生经历记录 */}
        <TabsContent value="experiences" className="space-y-6">
          {/* 经历页面标题和添加按钮 */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">我的人生经历</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加经历
            </Button>
          </div>

          {/* 空状态卡片 - 当用户还没有添加经历时显示 */}
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

        {/* AI方案标签页内容 - 显示AI生成的解决方案 */}
        <TabsContent value="solutions" className="space-y-6">
          {/* 方案页面标题和类型标签 */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI解决方案</h3>
            {/* AI处理的三个阶段标签 */}
            <div className="flex space-x-2">
              <Badge variant="outline">
                <Heart className="w-3 h-3 mr-1" />
                心理疗愈                {/* 第一阶段：心理支持 */}
              </Badge>
              <Badge variant="outline">
                <Brain className="w-3 h-3 mr-1" />
                实用方案                {/* 第二阶段：实际解决方案 */}
              </Badge>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                后续支持                {/* 第三阶段：跟进支持 */}
              </Badge>
            </div>
          </div>

          {/* 空状态卡片 - 当还没有AI方案时显示 */}
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

        {/* 设置标签页内容 - 账户管理和偏好设置 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>账户设置</CardTitle>
              <CardDescription>
                管理您的账户信息和偏好设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 账户信息网格显示 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 用户姓名显示 */}
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <p className="text-muted-foreground">{user.firstName} {user.lastName}</p>
                </div>
                {/* 用户邮箱显示 */}
                <div>
                  <label className="text-sm font-medium">邮箱</label>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                {/* 用户角色显示 */}
                <div>
                  <label className="text-sm font-medium">角色</label>
                  <p className="text-muted-foreground">{getRoleDisplayName(user.role)}</p>
                </div>
                {/* 语言设置显示 */}
                <div>
                  <label className="text-sm font-medium">语言</label>
                  <p className="text-muted-foreground">简体中文</p>
                </div>
              </div>

              {/* 账户操作按钮组 */}
              <div className="flex space-x-2 pt-4">
                {/* 编辑资料按钮 */}
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
                {/* 修改密码按钮 */}
                <Button variant="outline">修改密码</Button>
                {/* 删除账户按钮 - 危险操作 */}
                <Button variant="destructive">删除账户</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
