import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

interface StatsGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  description,
  actions,
  className
}) => {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || description || actions) && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                )}
                {description && (
                  <p className="text-gray-600 mt-2">{description}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  children,
  className,
  headerActions
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-3">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  cols = 4,
  className
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  return (
    <div className={cn(
      "grid gap-6",
      gridCols[cols],
      className
    )}>
      {children}
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
  onClick
}) => {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-sm text-gray-500 ml-2">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Compound component exports
DashboardLayout.Section = DashboardSection;
DashboardLayout.StatsGrid = StatsGrid;
DashboardLayout.StatCard = StatCard;

export default DashboardLayout;
export { DashboardSection, StatsGrid, StatCard };