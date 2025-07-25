'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HydrationBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 水合错误边界组件
 * 用于捕获和处理客户端水合过程中的错误
 */
export class HydrationBoundary extends React.Component<
  HydrationBoundaryProps,
  HydrationBoundaryState
> {
  constructor(props: HydrationBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): HydrationBoundaryState {
    // 检查是否是水合错误
    const isHydrationError = 
      error.message.includes('Hydration') ||
      error.message.includes('hydration') ||
      error.message.includes('server rendered HTML') ||
      error.message.includes('client');

    return {
      hasError: true,
      error: isHydrationError ? error : undefined
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('Hydration Boundary caught an error:', error, errorInfo);
    
    // 如果是水合错误，尝试重新渲染
    if (error.message.includes('Hydration') || error.message.includes('hydration')) {
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <Card className="m-4">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">页面加载出现问题</h3>
              <p className="text-muted-foreground mb-4">
                {this.state.error?.message.includes('Hydration') 
                  ? '页面正在重新加载，请稍候...'
                  : '遇到了一个临时问题，请尝试刷新页面'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button onClick={() => window.location.reload()}>
                  刷新页面
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook版本的水合错误处理
 */
export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}