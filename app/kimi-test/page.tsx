'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { aiProcessingService } from '@/lib/api/ai-processing';
import { authHelper } from '@/lib/api/auth-helper';

export default function KimiTestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [experienceId, setExperienceId] = useState('');
  const [createdExperienceId, setCreatedExperienceId] = useState('');

  const testKimiConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setResult(`后端连接成功: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`后端连接失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestExperience = async () => {
    setLoading(true);
    try {
      setResult('正在创建测试experience...\n');

      // 直接获取测试用户token，确保用户匹配
      const token = await authHelper.getTestUserToken();

      // 创建测试experience - 使用正确的数据格式
      const testExperienceData = {
        title: "测试AI处理功能的工作挑战经历",
        content: {
          text: "这是一个测试experience，用于验证AI处理功能。我最近在工作中遇到了一些挑战，希望能够得到一些指导和建议。作为一个职场新人，我感到压力很大，特别是在时间管理和工作优先级方面。",
          mediaFiles: []
        },
        category: "career",
        emotionalState: {
          primary: "anxious",
          intensity: 7,
          description: "对工作挑战感到焦虑和不确定"
        },
        tags: ["工作压力", "时间管理", "职场新人"],
        metadata: {
          dateOccurred: new Date().toISOString(),
          inputMethod: "text",
          processingStage: "pending"
        }
      };

      console.log('📤 发送experience创建请求:', testExperienceData);

      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testExperienceData)
      });

      console.log('📥 收到experience创建响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ Experience创建错误详情:', errorData);
        throw new Error(`创建experience失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const experienceData = await response.json();
      const newExperienceId = experienceData.id || experienceData._id;

      setCreatedExperienceId(newExperienceId);
      setExperienceId(newExperienceId);
      setResult(prev => prev + `✅ 测试experience创建成功!\nExperience ID: ${newExperienceId}\n\n`);

      // 自动清空输入框并设置新的ID
      const experienceInput = document.getElementById('experienceId') as HTMLInputElement;
      if (experienceInput) {
        experienceInput.value = newExperienceId;
      }

    } catch (error) {
      setResult(prev => prev + `❌ 创建测试experience失败: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testCORS = async () => {
    setLoading(true);
    let results = 'CORS测试结果:\n\n';

    try {
      // 测试1: 简单的CORS测试端点
      results += '1. 测试简单CORS端点:\n';
      const corsResponse = await fetch('http://localhost:8000/cors-test');
      const corsData = await corsResponse.json();
      results += `状态: ${corsResponse.status} ${corsResponse.statusText}\n`;
      results += `响应: ${JSON.stringify(corsData, null, 2)}\n\n`;

      // 测试2: OPTIONS预检请求
      results += '2. 测试OPTIONS预检请求:\n';
      const optionsResponse = await fetch('http://localhost:8000/api/ai/stage1/process', {
        method: 'OPTIONS'
      });
      results += `状态: ${optionsResponse.status} ${optionsResponse.statusText}\n`;
      results += `头信息: ${JSON.stringify(Object.fromEntries(optionsResponse.headers.entries()), null, 2)}\n\n`;

      // 测试3: 前端代理端点
      results += '3. 测试前端代理端点:\n';
      const proxyResponse = await fetch('/api/ai/stage1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          experience_id: 'test-id',
          priority: 'normal'
        })
      });
      results += `状态: ${proxyResponse.status} ${proxyResponse.statusText}\n`;
      const proxyText = await proxyResponse.text();
      results += `响应: ${proxyText}\n`;

    } catch (error) {
      results += `CORS测试失败: ${error}\n`;
    }

    setResult(results);
    setLoading(false);
  };

  const testBackendAIEndpoint = async () => {
    setLoading(true);
    try {
      // 先测试后端AI端点是否存在
      const response = await fetch('http://localhost:8000/api/ai/stage1/process', {
        method: 'OPTIONS'  // 预检请求
      });

      setResult(`后端AI端点测试:
状态: ${response.status} ${response.statusText}
头信息: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

    } catch (error) {
      setResult(`后端AI端点测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectBackendAPI = async () => {
    if (!experienceId.trim()) {
      setResult('请先输入经历ID');
      return;
    }

    setLoading(true);
    try {
      setResult('正在直接测试后端AI处理端点...\n');

      // 获取token
      const token = await authHelper.getAuthToken();
      setResult(prev => prev + `获取到token: ${token ? token.substring(0, 20) + '...' : 'null'}\n`);

      // 直接调用后端API
      const response = await fetch('http://localhost:8000/api/ai/stage1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          experience_id: experienceId.trim(),
          priority: 'normal'
        })
      });

      setResult(prev => prev + `后端响应状态: ${response.status} ${response.statusText}\n`);

      const responseText = await response.text();
      setResult(prev => prev + `后端响应内容: ${responseText}\n`);

    } catch (error) {
      setResult(prev => prev + `\n❌ 直接后端API测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testStage2Processing = async () => {
    if (!experienceId.trim()) {
      setResult('请先输入经历ID');
      return;
    }

    setLoading(true);
    try {
      setResult('正在启动Stage 2 AI处理...\n');

      // 获取token
      const token = await authHelper.getAuthToken();
      setResult(prev => prev + `获取到token: ${token ? token.substring(0, 20) + '...' : 'null'}\n`);

      // 启动Stage 2处理
      console.log('🚀 启动Stage 2处理...');
      const stage2Response = await aiProcessingService.startStage2Processing({
        experience_id: experienceId.trim(),
        priority: 'normal'
      });

      setResult(prev => prev + `Stage 2处理启动成功:\n${JSON.stringify(stage2Response, null, 2)}\n\n正在轮询状态...\n`);

      // 轮询处理状态
      const stage2Result = await aiProcessingService.pollUntilComplete(
        stage2Response.solution_id,
        2, // Stage 2
        (status) => {
          setResult(prev => prev + `状态更新: ${status.status} (${Math.round(status.confidence_score * 100)}%)\n`);
        }
      );

      setResult(prev => prev + `\n✅ Stage 2 AI处理完成!\n\n完整结果:\n${JSON.stringify(stage2Result, null, 2)}\n\n`);

      setResult(prev => prev + `结果预览:\n`);
      setResult(prev => prev + `标题: ${stage2Result.content?.title || '无标题'}\n`);
      setResult(prev => prev + `描述长度: ${stage2Result.content?.description?.length || 0} 字符\n`);
      setResult(prev => prev + `行动步骤: ${stage2Result.content?.actionSteps?.length || 0} 条\n`);
      setResult(prev => prev + `建议数量: ${stage2Result.content?.recommendations?.length || 0} 条\n`);
      setResult(prev => prev + `置信度: ${Math.round((stage2Result.metadata?.confidence_score || 0) * 100)}%\n`);
      setResult(prev => prev + `处理时间: ${stage2Result.metadata?.processing_time || 0} 秒\n`);

      // 显示部分内容
      if (stage2Result.content?.description) {
        const contentPreview = stage2Result.content.description.substring(0, 200) + '...';
        setResult(prev => prev + `\n内容预览:\n${contentPreview}\n`);
      } else {
        setResult(prev => prev + `\n⚠️ 内容为空，可能AI处理失败\n`);
      }

    } catch (error) {
      setResult(prev => prev + `\n❌ Stage 2 AI处理失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testStage3Processing = async () => {
    if (!experienceId.trim()) {
      setResult('请先输入经历ID');
      return;
    }

    setLoading(true);
    try {
      setResult('正在启动Stage 3 AI处理...\n');

      // 获取token
      const token = await authHelper.getAuthToken();
      setResult(prev => prev + `获取到token: ${token ? token.substring(0, 20) + '...' : 'null'}\n`);

      // 启动Stage 3处理，包含模拟的follow-up数据
      console.log('🚀 启动Stage 3处理...');
      const stage3Response = await aiProcessingService.startStage3Processing({
        experience_id: experienceId.trim(),
        priority: 'normal',
        follow_up_data: {
          progress_rating: 7,
          implemented_actions: ['开始使用时间管理工具', '与同事建立更好的沟通'],
          challenges_faced: ['仍然感到工作压力', '时间安排不够合理'],
          success_stories: ['完成了一个重要项目', '得到了上司的认可'],
          additional_concerns: '希望能够进一步提升工作效率',
          satisfaction_level: 6
        }
      });

      setResult(prev => prev + `Stage 3处理启动成功:\n${JSON.stringify(stage3Response, null, 2)}\n\n正在轮询状态...\n`);

      // 轮询处理状态
      const stage3Result = await aiProcessingService.pollUntilComplete(
        stage3Response.solution_id,
        3, // Stage 3
        (status) => {
          setResult(prev => prev + `状态更新: ${status.status} (${Math.round(status.confidence_score * 100)}%)\n`);
        }
      );

      setResult(prev => prev + `\n✅ Stage 3 AI处理完成!\n\n完整结果:\n${JSON.stringify(stage3Result, null, 2)}\n\n`);

      setResult(prev => prev + `结果预览:\n`);
      setResult(prev => prev + `标题: ${stage3Result.content?.title || '无标题'}\n`);
      setResult(prev => prev + `描述长度: ${stage3Result.content?.description?.length || 0} 字符\n`);
      setResult(prev => prev + `跟进计划: ${stage3Result.content?.follow_up_plan?.length || 0} 条\n`);
      setResult(prev => prev + `适应建议: ${stage3Result.content?.adaptation_suggestions?.length || 0} 条\n`);
      setResult(prev => prev + `长期目标: ${stage3Result.content?.long_term_goals?.length || 0} 条\n`);
      setResult(prev => prev + `置信度: ${Math.round((stage3Result.metadata?.confidence_score || 0) * 100)}%\n`);
      setResult(prev => prev + `处理时间: ${stage3Result.metadata?.processing_time || 0} 秒\n`);

      // 显示部分内容
      if (stage3Result.content?.description) {
        const contentPreview = stage3Result.content.description.substring(0, 200) + '...';
        setResult(prev => prev + `\n内容预览:\n${contentPreview}\n`);
      } else {
        setResult(prev => prev + `\n⚠️ 内容为空，可能AI处理失败\n`);
      }

    } catch (error) {
      setResult(prev => prev + `\n❌ Stage 3 AI处理失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testKimiAPI = async () => {
    if (!experienceId.trim()) {
      setResult('请先输入经历ID');
      return;
    }

    setLoading(true);
    try {
      setResult('正在启动Kimi AI处理...\n');

      // 先测试前端代理是否工作
      console.log('🔍 测试前端代理连接...');
      try {
        const proxyTestResponse = await fetch('/api/ai/stage1/process', {
          method: 'OPTIONS'
        });
        console.log('🔍 前端代理OPTIONS测试:', {
          status: proxyTestResponse.status,
          statusText: proxyTestResponse.statusText,
          ok: proxyTestResponse.ok
        });
      } catch (proxyError) {
        console.error('❌ 前端代理连接失败:', proxyError);
      }

      // 获取token
      const token = await authHelper.getAuthToken();

      // 显示调试信息
      console.log('🔍 调试信息:');
      console.log('   Experience ID:', experienceId.trim());
      console.log('   Token (前20字符):', token ? token.substring(0, 20) + '...' : 'null');

      // 跳过experience验证，直接测试AI处理
      console.log('⏭️ 跳过experience验证，直接测试AI处理...');

      // 先检查后端路由
      console.log('🔍 检查后端路由注册...');
      try {
        const routesResponse = await fetch('http://localhost:8000/debug/routes');
        const routesData = await routesResponse.json();
        console.log('📋 后端注册的路由:', routesData);

        // 查找AI相关路由
        const aiRoutes = routesData.routes.filter(route =>
          route.path.includes('ai') || route.path.includes('stage1')
        );
        console.log('🤖 AI相关路由:', aiRoutes);

        // 详细显示每个AI路由
        aiRoutes.forEach((route, index) => {
          console.log(`${index + 1}. ${route.methods.join(',')} ${route.path} (${route.name})`);
        });

        // 特别查找我们需要的路由
        const processRoutes = routesData.routes.filter(route =>
          route.path === '/api/ai/stage1/process'
        );
        console.log('🎯 所有 /api/ai/stage1/process 路由:', processRoutes);

        processRoutes.forEach(route => {
          console.log(`   - 方法: ${route.methods.join(',')} 名称: ${route.name}`);
        });
      } catch (routeError) {
        console.error('❌ 无法获取后端路由:', routeError);
      }

      // 先测试简单的测试端点
      console.log('🧪 测试简单的AI测试端点...');
      try {
        const testResponse = await fetch('http://localhost:8000/api/ai/stage1/simple-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('🧪 简单测试响应:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok
        });
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('🧪 简单测试数据:', testData);
        }
      } catch (testError) {
        console.error('❌ 简单测试失败:', testError);
      }

      // 先测试不带认证的请求
      console.log('🔄 测试不带认证的AI处理请求...');
      try {
        const noAuthResponse = await fetch('http://localhost:8000/api/ai/stage1/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            experience_id: experienceId.trim(),
            priority: 'normal'
          })
        });
        console.log('🔄 不带认证的响应:', {
          status: noAuthResponse.status,
          statusText: noAuthResponse.statusText,
          ok: noAuthResponse.ok
        });
        if (!noAuthResponse.ok) {
          const errorData = await noAuthResponse.json().catch(() => ({ detail: 'Unknown error' }));
          console.log('🔄 不带认证的错误:', errorData);
        }
      } catch (noAuthError) {
        console.error('❌ 不带认证的请求失败:', noAuthError);
      }

      // 直接调用后端AI处理API，绕过前端代理
      console.log('🔄 直接调用后端AI处理API (带认证)...');
      const backendResponse = await fetch('http://localhost:8000/api/ai/stage1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          experience_id: experienceId.trim(),
          priority: 'normal'
        })
      });

      console.log('📥 后端直接响应:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        ok: backendResponse.ok
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ 后端直接调用错误:', errorData);
        throw new Error(`后端AI处理失败: ${backendResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const aiResponse = await backendResponse.json();

      setResult(prev => prev + `AI处理启动成功:\n${JSON.stringify(aiResponse, null, 2)}\n\n正在轮询状态...\n`);

      // 轮询处理状态
      const aiResult = await aiProcessingService.pollUntilComplete(
        aiResponse.solution_id,
        1,
        (status) => {
          setResult(prev => prev + `状态更新: ${status.status} (${Math.round(status.confidence_score * 100)}%)\n`);
        }
      );

      setResult(prev => prev + `\n✅ Kimi AI处理完成!\n\n结果预览:\n`);
      setResult(prev => prev + `标题: ${aiResult.content?.title || '无标题'}\n`);
      setResult(prev => prev + `内容长度: ${aiResult.content?.content?.length || 0} 字符\n`);
      setResult(prev => prev + `建议数量: ${aiResult.content?.recommendations?.length || 0} 条\n`);
      setResult(prev => prev + `应对策略: ${aiResult.content?.coping_strategies?.length || 0} 条\n`);
      setResult(prev => prev + `情感支持: ${aiResult.content?.emotional_support?.length || 0} 条\n`);
      setResult(prev => prev + `置信度: ${Math.round((aiResult.metadata?.confidence_score || 0) * 100)}%\n`);
      setResult(prev => prev + `处理时间: ${aiResult.metadata?.processing_time || 0} 秒\n`);

      // 显示部分内容
      if (aiResult.content?.content) {
        const contentPreview = aiResult.content.content.substring(0, 200) + '...';
        setResult(prev => prev + `\n内容预览:\n${contentPreview}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `\n❌ Kimi AI处理失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testKimiDirectAPI = async () => {
    setLoading(true);
    try {
      setResult('正在测试Kimi API直接连接...\n');

      const response = await fetch('http://localhost:8000/kimi-api-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      console.log('🧪 Kimi API测试响应:', data);

      if (data.status === 'success') {
        setResult(prev => prev + `✅ Kimi API连接测试成功!\n模型: ${data.test_response.model}\n响应内容: ${data.test_response.content}\n用量统计: ${JSON.stringify(data.test_response.usage)}\n\n`);
      } else {
        setResult(prev => prev + `❌ Kimi API连接测试失败!\n错误类型: ${data.error_type}\n错误信息: ${data.message}\n详细错误: ${data.error}\n建议: ${data.suggestions?.join(', ')}\n\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ 测试请求失败: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectKimiCall = async () => {
    setLoading(true);
    try {
      const testData = {
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "system",
            content: "你是一位专业的心理咨询师，请用中文回复。"
          },
          {
            role: "user",
            content: "我最近工作压力很大，经常失眠，该怎么办？"
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      };

      // 使用当前配置的API密钥
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer sk-vaZfytprAC91TgsbahrjI2rksRWjMksJh4xKyfsONrXFFAoQ`
        },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();

      setResult(`直接Kimi API调用结果:
状态: ${response.status} ${response.statusText}
头信息: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}
响应: ${responseText}`);

    } catch (error) {
      setResult(`直接Kimi API调用失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAlternativeUrls = async () => {
    setLoading(true);
    const urlsToTest = [
      'https://api.moonshot.cn/v1/chat/completions',
      'https://api.moonshot.ai/v1/chat/completions',
      'https://kimi.moonshot.cn/api/v1/chat/completions',
      'https://platform.moonshot.cn/api/v1/chat/completions'
    ];

    let results = '测试多个可能的API端点:\n\n';

    for (const url of urlsToTest) {
      try {
        results += `测试: ${url}\n`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sk-vaZfytprAC91TgsbahrjI2rksRWjMksJh4xKyfsONrXFFAoQ`
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [{ role: "user", content: "测试" }],
            max_tokens: 10
          })
        });

        results += `状态: ${response.status} ${response.statusText}\n`;

        if (response.ok) {
          const data = await response.json();
          results += `✅ 成功! 响应: ${JSON.stringify(data, null, 2)}\n`;
          break;
        } else {
          const errorText = await response.text();
          results += `❌ 失败: ${errorText}\n`;
        }

      } catch (error) {
        results += `❌ 网络错误: ${error}\n`;
      }

      results += '\n---\n\n';
    }

    setResult(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Kimi API连接测试
            <Badge variant="outline">月之暗面</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 测试按钮 */}
          <div className="flex flex-wrap gap-4">
            <Button onClick={testKimiConnection} disabled={loading}>
              测试后端连接
            </Button>
            <Button onClick={createTestExperience} disabled={loading} variant="default">
              创建测试Experience
            </Button>
            <Button onClick={testKimiDirectAPI} disabled={loading} variant="secondary">
              测试后端Kimi API
            </Button>
            <Button onClick={testDirectKimiCall} disabled={loading} variant="outline">
              直接测试Kimi API
            </Button>
            <Button onClick={testStage2Processing} disabled={loading || !experienceId.trim()} variant="default">
              测试Stage 2处理
            </Button>
            <Button onClick={testStage3Processing} disabled={loading || !experienceId.trim()} variant="secondary">
              测试Stage 3处理
            </Button>
            <Button onClick={testAlternativeUrls} disabled={loading} variant="secondary">
              测试多个API端点
            </Button>
            <Button onClick={testCORS} disabled={loading} variant="destructive">
              测试CORS配置
            </Button>
            <Button onClick={testBackendAIEndpoint} disabled={loading} variant="outline">
              测试后端AI端点
            </Button>
          </div>

          {/* 经历ID输入 */}
          <div className="space-y-2">
            <Label htmlFor="experienceId">经历ID (用于测试AI处理)</Label>
            <div className="flex gap-2">
              <Input
                id="experienceId"
                value={experienceId}
                onChange={(e) => setExperienceId(e.target.value)}
                placeholder="输入已保存的经历ID..."
                className="flex-1"
              />
              <Button onClick={testDirectBackendAPI} disabled={loading || !experienceId.trim()} variant="destructive">
                直接测试后端(会有CORS问题)
              </Button>
              <Button onClick={testKimiAPI} disabled={loading || !experienceId.trim()}>
                测试AI处理
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              提示：先在经历页面提交一个经历，然后复制返回的ID到这里测试
            </p>
          </div>

          {/* 结果显示 */}
          <div>
            <Label className="font-semibold mb-2 block">测试结果:</Label>
            <Textarea
              value={result}
              readOnly
              className="min-h-[400px] font-mono text-sm"
              placeholder="点击按钮开始测试..."
            />
          </div>

          {/* 配置说明 */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">配置说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>1. 获取Kimi API密钥:</strong></p>
              <p className="ml-4">• 访问 <a href="https://platform.moonshot.cn/" target="_blank" className="text-blue-600 underline">https://platform.moonshot.cn/</a></p>
              <p className="ml-4">• 注册账号并获取API密钥</p>

              <p><strong>2. 可能的API端点URL:</strong></p>
              <div className="ml-4 space-y-1 text-xs">
                <p>• <code>https://api.moonshot.cn/v1</code> (官方文档)</p>
                <p>• <code>https://api.moonshot.ai/v1</code> (备用域名)</p>
                <p>• <code>https://kimi.moonshot.cn/api/v1</code> (Kimi域名)</p>
                <p>• <code>https://platform.moonshot.cn/api/v1</code> (平台域名)</p>
              </div>

              <p><strong>3. 配置后端环境变量:</strong></p>
              <p className="ml-4">• 在 <code>backend/.env</code> 文件中设置:</p>
              <pre className="ml-4 bg-gray-100 p-2 rounded text-xs">
                {`OPENAI_API_KEY=sk-vaZfytprAC91TgsbahrjI2rksRWjMksJh4xKyfsONrXFFAoQ
OPENAI_API_URL=https://api.moonshot.cn/v1
OPENAI_MODEL_NAME=moonshot-v1-8k`}
              </pre>

              <p><strong>3. 重启后端服务:</strong></p>
              <p className="ml-4">• 修改环境变量后需要重启后端服务才能生效</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}