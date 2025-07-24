'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  GraduationCap,
  Target,
  User,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleOption {
  role: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  preview: {
    sectionCount: number;
    fieldCount: number;
    estimatedTime: string;
  };
}

interface RoleSelectionProps {
  onRoleSelected: (role: string) => void;
  selectedRole?: string;
}

const roleIcons = {
  workplace_newcomer: <Briefcase className=\"w-8 h-8\" />,
  entrepreneur: <Target className=\"w-8 h-8\" />,
  student: <GraduationCap className=\"w-8 h-8\" />,
  other: <User className=\"w-8 h-8\" />
};

const roleColors = {
  workplace_newcomer: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  entrepreneur: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  student: 'bg-green-50 border-green-200 hover:bg-green-100',
  other: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
};

export function RoleSelection({ onRoleSelected, selectedRole }: RoleSelectionProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load available roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call to /api/role-templates/roles/available
        // For now, we'll use mock data
        const mockRoles: RoleOption[] = [
          {
            role: 'workplace_newcomer',
            name: '职场新人',
            description: '刚入职场或工作经验较少，面临适应和成长挑战的专业人士',
            icon: 'briefcase',
            tags: ['职场适应', '技能提升', '人际关系', '压力管理'],
            preview: {
              sectionCount: 4,
              fieldCount: 15,
              estimatedTime: '15-20分钟'
            }
          },
          {
            role: 'entrepreneur',
            name: '创业者',
            description: '正在创业或计划创业，需要商业指导和决策支持的企业家',
            icon: 'target',
            tags: ['商业策略', '团队管理', '融资决策', '风险控制'],
            preview: {
              sectionCount: 5,
              fieldCount: 18,
              estimatedTime: '20-25分钟'
            }
          },
          {
            role: 'student',
            name: '学生',
            description: '在校学生或刚毕业，面临学业、生活或职业规划困扰',
            icon: 'graduation-cap',
            tags: ['学业压力', '职业规划', '人际关系', '心理健康'],
            preview: {
              sectionCount: 5,
              fieldCount: 20,
              estimatedTime: '18-22分钟'
            }
          },
          {
            role: 'other',
            name: '其他身份',
            description: '不属于以上类别，需要个性化支持和指导',
            icon: 'user',
            tags: ['个性化咨询', '多元化支持', '灵活模板'],
            preview: {
              sectionCount: 3,
              fieldCount: 12,
              estimatedTime: '12-15分钟'
            }
          }
        ];

        setRoles(mockRoles);
      } catch (error) {
        console.error('Failed to load roles:', error);
        toast({
          title: \"加载失败\",
          description: \"无法加载角色选项，请刷新页面重试\",
          variant: \"destructive\"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRoles();
  }, [toast]);

  const handleRoleSelect = (role: string) => {
    onRoleSelected(role);
    toast({
      title: \"角色已选择\",
      description: `您选择了：${roles.find(r => r.role === role)?.name}`,
    });
  };

  if (isLoading) {
    return (
      <div className=\"w-full max-w-4xl mx-auto p-8\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto\"></div>
          <p className=\"mt-4 text-gray-600\">加载角色选项中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"w-full max-w-6xl mx-auto space-y-8\">
      {/* Header */}
      <div className=\"text-center space-y-4\">
        <h1 className=\"text-3xl font-bold text-gray-900\">选择您的身份角色</h1>
        <p className=\"text-lg text-gray-600 max-w-2xl mx-auto\">
          请选择最符合您当前情况的身份角色，我们将为您提供个性化的经历收集模板和AI咨询方案
        </p>
      </div>

      {/* Role Cards */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        {roles.map((role) => (
          <Card
            key={role.role}
            className={`cursor-pointer transition-all duration-200 ${
              selectedRole === role.role
                ? 'ring-2 ring-blue-500 shadow-lg'
                : roleColors[role.role as keyof typeof roleColors]
            }`}
            onClick={() => handleRoleSelect(role.role)}
          >
            <CardHeader>
              <div className=\"flex items-start justify-between\">
                <div className=\"flex items-center space-x-3\">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === role.role
                      ? 'bg-blue-500 text-white'
                      : 'bg-white shadow-sm'
                  }`}>
                    {roleIcons[role.role as keyof typeof roleIcons]}
                  </div>
                  <div>
                    <CardTitle className=\"flex items-center gap-2\">
                      {role.name}
                      {selectedRole === role.role && (
                        <CheckCircle className=\"w-5 h-5 text-blue-500\" />
                      )}
                    </CardTitle>
                  </div>
                </div>
              </div>
              <CardDescription className=\"text-sm leading-relaxed\">
                {role.description}
              </CardDescription>
            </CardHeader>

            <CardContent className=\"space-y-4\">
              {/* Tags */}
              <div className=\"flex flex-wrap gap-2\">
                {role.tags.map((tag) => (
                  <Badge key={tag} variant=\"secondary\" className=\"text-xs\">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Preview Info */}
              <div className=\"bg-white/50 rounded-lg p-3 space-y-2\">
                <h4 className=\"text-sm font-medium text-gray-700\">模板预览</h4>
                <div className=\"grid grid-cols-3 gap-4 text-xs text-gray-600\">
                  <div className=\"text-center\">
                    <div className=\"font-medium text-gray-900\">{role.preview.sectionCount}</div>
                    <div>个部分</div>
                  </div>
                  <div className=\"text-center\">
                    <div className=\"font-medium text-gray-900\">{role.preview.fieldCount}</div>
                    <div>个字段</div>
                  </div>
                  <div className=\"text-center\">
                    <div className=\"font-medium text-gray-900\">{role.preview.estimatedTime}</div>
                    <div>预计用时</div>
                  </div>
                </div>
              </div>

              {/* Select Button */}
              <Button
                className=\"w-full\"
                variant={selectedRole === role.role ? \"default\" : \"outline\"}
              >
                {selectedRole === role.role ? (
                  <>
                    已选择
                    <CheckCircle className=\"w-4 h-4 ml-2\" />
                  </>
                ) : (
                  <>
                    选择此角色
                    <ArrowRight className=\"w-4 h-4 ml-2\" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className=\"bg-blue-50 border-blue-200\">
        <CardContent className=\"p-6\">
          <div className=\"flex items-start space-x-3\">
            <div className=\"bg-blue-500 text-white p-2 rounded-lg flex-shrink-0\">
              <User className=\"w-5 h-5\" />
            </div>
            <div className=\"space-y-2\">
              <h3 className=\"font-medium text-blue-900\">个性化AI咨询</h3>
              <p className=\"text-sm text-blue-700 leading-relaxed\">
                根据您选择的角色，我们的AI系统将为您提供三个阶段的专业咨询：
                <span className=\"font-medium\">心理疗愈支持</span>、
                <span className=\"font-medium\">实际解决方案</span>、
                <span className=\"font-medium\">后续跟进指导</span>。
                每个阶段都将结合您的具体情况和多模态输入进行个性化分析。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className=\"text-center text-sm text-gray-500\">
        <p>选择角色后，您可以随时在个人设置中修改身份信息</p>
      </div>
    </div>
  );
}
