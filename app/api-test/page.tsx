'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function ApiTestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealthEndpoint = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setResult(`Health Check Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Health Check Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testExperienceEndpoint = async () => {
    setLoading(true);
    try {
      const testData = {
        title: "测试经历",
        content: {
          text: "这是一个测试经历",
          mediaFiles: []
        },
        category: "work",
        emotionalState: {
          primary: "neutral",
          intensity: 5,
          description: "测试情绪状态"
        },
        tags: ["测试"],
        privacy: {
          isPublic: false,
          allowAnalytics: true
        },
        metadata: {
          location: "测试地点",
          dateOccurred: "2024-01-15",
          inputMethod: "form",
          processingStage: "pending"
        }
      };

      const response = await fetch('http://localhost:8000/api/experiences/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      
      setResult(`Experience API Response:
Status: ${response.status} ${response.statusText}
Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}
Body: ${responseText}`);
      
    } catch (error) {
      setResult(`Experience API Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithAuth = async () => {
    setLoading(true);
    try {
      // 先尝试注册一个测试用户（使用正确的字段）
      const registerData = {
        email: "test@example.com",
        password: "testpassword123",
        firstName: "测试",
        lastName: "用户",
        role: "workplace_newcomer"
      };

      const registerResponse = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      const registerResult = await registerResponse.text();
      
      let result = `Register Response:
Status: ${registerResponse.status} ${registerResponse.statusText}
Body: ${registerResult}

`;

      // 如果注册成功或用户已存在，尝试登录
      if (registerResponse.status === 201 || registerResponse.status === 400) {
        const loginData = {
          email: "test@example.com",
          password: "testpassword123"
        };

        const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData)
        });

        const loginResult = await loginResponse.text();
        
        result += `Login Response:
Status: ${loginResponse.status} ${loginResponse.statusText}
Body: ${loginResult}

`;

        // 如果登录成功，尝试用token调用experience API
        if (loginResponse.status === 200) {
          const loginData = JSON.parse(loginResult);
          const token = loginData.access_token;

          const testExperienceData = {
            title: "测试经历",
            content: {
              text: "这是一个带认证的测试经历",
              mediaFiles: []
            },
            category: "work",
            emotionalState: {
              primary: "neutral",
              intensity: 5,
              description: "测试情绪状态"
            },
            tags: ["测试", "认证"],
            privacy: {
              isPublic: false,
              allowAnalytics: true
            },
            metadata: {
              location: "测试地点",
              dateOccurred: "2024-01-15",
              inputMethod: "form",
              processingStage: "pending"
            }
          };

          const experienceResponse = await fetch('http://localhost:8000/api/experiences/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testExperienceData)
          });

          const experienceResult = await experienceResponse.text();
          
          result += `Authenticated Experience API Response:
Status: ${experienceResponse.status} ${experienceResponse.statusText}
Body: ${experienceResult}`;
        }
      }
      
      setResult(result);

    } catch (error) {
      setResult(`Auth Test Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>API连接测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testHealthEndpoint} disabled={loading}>
              测试Health端点
            </Button>
            <Button onClick={testExperienceEndpoint} disabled={loading}>
              测试Experience端点
            </Button>
            <Button onClick={testWithAuth} disabled={loading}>
              测试认证
            </Button>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">测试结果:</h3>
            <Textarea
              value={result}
              readOnly
              className="min-h-[400px] font-mono text-sm"
              placeholder="点击按钮开始测试..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}