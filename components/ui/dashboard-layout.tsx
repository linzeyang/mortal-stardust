/**
 * 仪表板布局组件
 * 为仪表板页面提供统一的布局结构
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  title,
  description,
  actions,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className="container mx-auto px-4 py-8">
        {(title || description || actions) && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                )}
                {description && (
                  <p className="text-gray-600 mt-2">{description}</p>
                )}
              </div>
              {actions && (
                <div className="flex gap-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}