/**
 * Solutions Data Fetching Hook
 *
 * Custom React hook for fetching and managing AI-generated solutions data.
 * Provides loading states, error handling, and automatic refetching capabilities.
 */

import { useState, useEffect } from 'react';

export interface Solution {
  id: string;
  title: string;
  content: string;
  rating?: number;
  stage: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'needs_regeneration';
  aiModel: string;
  experienceType: string;
  experienceId: string;
}

export interface UseSolutionsReturn {
  solutions: Solution[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching user's AI solutions
 */
export function useSolutions(): UseSolutionsReturn {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching solutions...');
      const response = await fetch('/api/solutions', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('请先登录');
        }
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('获取解决方案失败');
      }

      const data = await response.json();
      console.log('✅ Solutions fetched successfully:', data.length, 'solutions');
      setSolutions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取数据时发生错误';
      setError(errorMessage);
      console.error('Error fetching solutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, []);

  return {
    solutions,
    loading,
    error,
    refetch: fetchSolutions,
  };
}
