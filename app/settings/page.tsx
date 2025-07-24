import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  Key,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Calendar,
  MapPin,
  Languages
} from 'lucide-react';

export const metadata: Metadata = {
  title: '设置 - 人生经历收集与AI辅导平台',
  description: '管理您的账户设置、隐私偏好和个性化配置',
};

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>个人信息</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              JD
            </div>
            <div className="flex-1">
              <Button variant="outline" size="sm">
                更换头像
              </Button>
              <p className="text-sm text-gray-500 mt-1">推荐尺寸: 200x200像素</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">姓</Label>
              <Input id="firstName" defaultValue="张" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">名</Label>
              <Input id="lastName" defaultValue="三" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <div className="flex space-x-2">
              <Input id="email" defaultValue="zhangsan@example.com" className="flex-1" />
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-1" />
                验证
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">手机号码</Label>
            <div className="flex space-x-2">
              <Input id="phone" defaultValue="+86 138****8888" className="flex-1" />
              <Button variant="outline" size="sm">
                <Smartphone className="h-4 w-4 mr-1" />
                验证
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">出生日期</Label>
              <Input id="birthDate" type="date" defaultValue="1995-06-15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">所在地区</Label>
              <Select defaultValue="beijing">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beijing">北京</SelectItem>
                  <SelectItem value="shanghai">上海</SelectItem>
                  <SelectItem value="guangzhou">广州</SelectItem>
                  <SelectItem value="shenzhen">深圳</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">当前角色</Label>
            <Select defaultValue="student">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">学生</SelectItem>
                <SelectItem value="workplace_newcomer">职场新人</SelectItem>
                <SelectItem value="entrepreneur">创业者</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">个人简介</Label>
            <Textarea 
              id="bio" 
              placeholder="简单介绍一下自己..."
              defaultValue="计算机专业大三学生，对AI和心理学很感兴趣，希望通过这个平台更好地了解自己并获得成长建议。"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>通知偏好</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">AI方案完成通知</Label>
                <p className="text-sm text-gray-500">当AI完成您的经历分析后立即通知</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">邮件提醒</Label>
                <p className="text-sm text-gray-500">接收重要更新和方案建议的邮件</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">手机推送</Label>
                <p className="text-sm text-gray-500">在移动设备上接收推送通知</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">每周总结</Label>
                <p className="text-sm text-gray-500">每周发送您的成长总结和分析报告</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">新功能提醒</Label>
                <p className="text-sm text-gray-500">当平台推出新功能时通知您</p>
              </div>
              <Switch />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">推送时间设置</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="morningTime">上午推送时间</Label>
                <Input id="morningTime" type="time" defaultValue="09:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eveningTime">晚间推送时间</Label>
                <Input id="eveningTime" type="time" defaultValue="20:00" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>隐私与安全</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">数据分析共享</Label>
                <p className="text-sm text-gray-500">允许匿名数据用于改进AI模型</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">个性化建议</Label>
                <p className="text-sm text-gray-500">基于您的历史数据提供个性化建议</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">营销通讯</Label>
                <p className="text-sm text-gray-500">接收产品更新和营销信息</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">第三方集成</Label>
                <p className="text-sm text-gray-500">允许与第三方服务集成</p>
              </div>
              <Switch />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">数据保留设置</h4>
            <div className="space-y-2">
              <Label htmlFor="dataRetention">自动删除数据</Label>
              <Select defaultValue="never">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">永不删除</SelectItem>
                  <SelectItem value="1year">1年后</SelectItem>
                  <SelectItem value="2years">2年后</SelectItem>
                  <SelectItem value="5years">5年后</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">设置数据自动删除时间，保护您的隐私</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>危险操作</span>
            </h4>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-red-900 mb-1">删除所有数据</h5>
                  <p className="text-sm text-red-700">
                    永久删除您的所有经历、AI方案和个人数据。此操作无法撤销。
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>账户安全</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <div className="relative">
                <Input id="currentPassword" type="password" placeholder="输入当前密码" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Input id="newPassword" type="password" placeholder="输入新密码" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input id="confirmPassword" type="password" placeholder="再次输入新密码" />
            </div>
            
            <Button className="w-full">
              <Key className="h-4 w-4 mr-2" />
              更新密码
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">两步验证</h4>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">短信验证已启用</p>
                  <p className="text-sm text-gray-500">验证码将发送至 +86 138****8888</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                管理
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">应用验证器</p>
                  <p className="text-sm text-gray-500">使用Google Authenticator或类似应用</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                设置
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">活跃会话</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">当前会话</p>
                    <p className="text-sm text-gray-500">Chrome on Windows • 北京 • 刚刚活跃</p>
                  </div>
                </div>
                <Badge variant="secondary">当前</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div>
                    <p className="font-medium">移动端会话</p>
                    <p className="text-sm text-gray-500">Safari on iPhone • 上海 • 2小时前</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  终止
                </Button>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              终止所有其他会话
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>界面偏好</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">主题模式</Label>
              <Select defaultValue="light">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色模式</SelectItem>
                  <SelectItem value="dark">深色模式</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">界面语言</Label>
              <Select defaultValue="zh-CN">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="en-US">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFormat">日期格式</Label>
              <Select defaultValue="YYYY-MM-DD">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                  <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                  <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">时区</Label>
              <Select defaultValue="Asia/Shanghai">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">日本标准时间 (UTC+9)</SelectItem>
                  <SelectItem value="America/New_York">美国东部时间 (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">AI助手偏好</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">详细分析</Label>
                  <p className="text-sm text-gray-500">提供更详细的经历分析和建议</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">快速响应</Label>
                  <p className="text-sm text-gray-500">优先速度，提供简洁的建议</p>
                </div>
                <Switch />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aiStyle">AI助手风格</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">专业正式</SelectItem>
                    <SelectItem value="friendly">友好亲切</SelectItem>
                    <SelectItem value="balanced">平衡适中</SelectItem>
                    <SelectItem value="encouraging">鼓励支持</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              账户设置
            </h1>
            <p className="text-gray-600">
              管理您的账户信息、隐私偏好和个性化设置
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">个人资料</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">通知</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">隐私</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">安全</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">偏好</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <ProfileSettings />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-6">
              <NotificationSettings />
            </TabsContent>
            
            <TabsContent value="privacy" className="mt-6">
              <PrivacySettings />
            </TabsContent>
            
            <TabsContent value="security" className="mt-6">
              <SecuritySettings />
            </TabsContent>
            
            <TabsContent value="preferences" className="mt-6">
              <PreferencesSettings />
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline">
              重置更改
            </Button>
            <Button>
              <CheckCircle className="h-4 w-4 mr-2" />
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}