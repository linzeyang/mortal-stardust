'use client';

import { useCallback } from 'react';

/**
 * 评价处理 Hook
 * 提供标准化的评价事件处理函数
 */
export function useRatingHandlers() {
  // 评价完成处理函数
  const handleRatingComplete = useCallback((solutionId: string, rating: number, regenerated?: boolean) => {
    console.log(`Solution ${solutionId} rated: ${rating}%, regenerated: ${regenerated}`);
    
    // 可以在这里添加更多的处理逻辑：
    // - 发送分析数据到后端
    // - 更新本地缓存
    // - 显示用户反馈
    
    // 示例：发送评价事件到分析系统
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'solution_rated', {
        solution_id: solutionId,
        rating: rating,
        regenerated: regenerated || false
      });
    }
  }, []);

  // 重新生成请求处理函数
  const handleRegenerateRequest = useCallback((originalSolutionId: string, newSolutionId: string) => {
    console.log(`Solution ${originalSolutionId} regenerated: ${newSolutionId}`);
    
    // 可以在这里添加更多的处理逻辑：
    // - 刷新解决方案列表
    // - 显示新方案通知
    // - 更新UI状态
    
    // 示例：发送重新生成事件到分析系统
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'solution_regenerated', {
        original_solution_id: originalSolutionId,
        new_solution_id: newSolutionId
      });
    }
  }, []);

  return {
    handleRatingComplete,
    handleRegenerateRequest
  };
}

// 类型定义
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}