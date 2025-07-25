/**
 * 经历表单组件
 * 用于收集和编辑用户经历信息
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ExperienceFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  role?: string;
}

export function ExperienceForm({ onSubmit, initialData, role }: ExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    mood: initialData?.mood || 5,
    importance: initialData?.importance || 3,
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'student': '学生',
      'workplace_newcomer': '职场新人',
      'entrepreneur': '创业者'
    };
    return roleNames[role] || role;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          经历详情
          {role && (
            <Badge variant="outline">
              {getRoleDisplayName(role)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="为您的经历起个标题..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">详细描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="详细描述您的经历..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="例如：学习、工作、生活..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mood">心情评分 (1-10)</Label>
              <Input
                id="mood"
                type="number"
                min="1"
                max="10"
                value={formData.mood}
                onChange={(e) => handleInputChange('mood', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance">重要程度 (1-5)</Label>
              <Input
                id="importance"
                type="number"
                min="1"
                max="5"
                value={formData.importance}
                onChange={(e) => handleInputChange('importance', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline">
              保存草稿
            </Button>
            <Button type="submit">
              提交经历
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}