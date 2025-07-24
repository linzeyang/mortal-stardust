import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Circle
} from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'pending' | 'error' | 'warning' | 'loading' | 'inactive';
  text?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  showIcon = true,
  variant = 'default',
  size = 'md'
}) => {
  const config = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
      outlineClassName: 'border-green-300 text-green-700',
      defaultText: 'Success'
    },
    pending: {
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      outlineClassName: 'border-yellow-300 text-yellow-700',
      defaultText: 'Pending'
    },
    error: {
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
      outlineClassName: 'border-red-300 text-red-700',
      defaultText: 'Error'
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      outlineClassName: 'border-orange-300 text-orange-700',
      defaultText: 'Warning'
    },
    loading: {
      icon: Loader2,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      outlineClassName: 'border-blue-300 text-blue-700',
      defaultText: 'Loading'
    },
    inactive: {
      icon: Circle,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      outlineClassName: 'border-gray-300 text-gray-700',
      defaultText: 'Inactive'
    }
  };

  const statusConfig = config[status];
  const Icon = statusConfig.icon;
  const displayText = text || statusConfig.defaultText;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium',
        variant === 'outline' 
          ? statusConfig.outlineClassName 
          : statusConfig.className
      )}
    >
      {showIcon && (
        <Icon 
          className={cn(
            iconSizes[size],
            status === 'loading' && 'animate-spin'
          )} 
        />
      )}
      {displayText}
    </Badge>
  );
};

export default StatusBadge;