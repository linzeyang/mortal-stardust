/**
 * AI处理API服务
 * 
 * 提供三阶段AI处理的前端API调用功能
 * 支持启动处理、状态轮询、获取结果等操作
 */

import { apiClient } from './client';
import { authHelper } from './auth-helper';

/**
 * AI处理请求数据结构
 */
export interface AIProcessingRequest {
  experience_id: string;
  priority?: 'normal' | 'high';
  additional_context?: Record<string, any>;
}

/**
 * AI处理响应数据结构
 */
export interface AIProcessingResponse {
  solution_id: string;
  status: 'processing' | 'completed' | 'failed' | 'already_exists';
  stage: number;
  processing_time: number;
  confidence_score: number;
  message: string;
}

/**
 * AI处理状态数据结构
 */
export interface AIProcessingStatus {
  solution_id: string;
  status: 'processing' | 'completed' | 'failed';
  stage: number;
  created_at?: string;
  updated_at?: string;
  processing_started_at?: string;
  completed_at?: string;
  confidence_score: number;
  error_message?: string;
}

/**
 * AI处理结果数据结构
 */
export interface AIProcessingResult {
  solution_id: string;
  stage: number;
  stage_name: string;
  status: string;
  content: {
    title: string;
    content: string;
    recommendations: string[];
    coping_strategies?: string[];
    emotional_support?: string[];
    resources?: Array<{
      type: string;
      title: string;
      description: string;
      url: string;
      category: string;
    }>;
  };
  metadata: {
    confidence_score: number;
    processing_time: number;
    generated_at: string;
    user_role: string;
  };
  created_at: string;
  completed_at?: string;
}

/**
 * AI处理服务类
 */
export class AIProcessingService {
  /**
   * 启动Stage 1 AI处理（心理疗愈）
   */
  async startStage1Processing(request: AIProcessingRequest): Promise<AIProcessingResponse> {
    console.log('🚀 启动Stage 1 AI处理:', request);
    
    try {
      const token = await authHelper.getAuthToken();
      console.log('🔑 获取到的token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        throw new Error('无法获取认证token');
      }

      const url = '/api/ai/stage1/process';
      const requestBody = JSON.stringify(request);
      
      console.log('📤 发送请求:', {
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.substring(0, 20)}...`
        },
        body: requestBody
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });

      console.log('📥 收到响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: await response.text() };
        }
        console.error('❌ API响应错误:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: Stage 1处理启动失败`);
      }

      const result = await response.json();
      console.log('✅ Stage 1处理启动成功:', result);
      return result;
    } catch (error) {
      console.error('❌ Stage 1处理启动失败:', error);
      
      // 提供更详细的错误信息
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败：无法连接到后端服务器。请检查后端服务是否正在运行在 http://localhost:8000');
      }
      
      throw error;
    }
  }

  /**
   * 获取AI处理状态
   */
  async getProcessingStatus(solutionId: string, stage: number): Promise<AIProcessingStatus> {
    try {
      const token = await authHelper.getAuthToken();
      if (!token) {
        throw new Error('无法获取认证token');
      }

      const response = await fetch(`/api/ai/stage${stage}/status/${solutionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取处理状态失败');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 获取处理状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取AI处理结果
   */
  async getProcessingResult(solutionId: string, stage: number): Promise<AIProcessingResult> {
    try {
      const token = await authHelper.getAuthToken();
      if (!token) {
        throw new Error('无法获取认证token');
      }

      const response = await fetch(`/api/ai/stage${stage}/result/${solutionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取处理结果失败');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 获取处理结果失败:', error);
      throw error;
    }
  }

  /**
   * 轮询处理状态直到完成
   */
  async pollUntilComplete(
    solutionId: string, 
    stage: number, 
    onProgress?: (status: AIProcessingStatus) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<AIProcessingResult> {
    console.log(`🔄 开始轮询Stage ${stage}处理状态:`, solutionId);
    
    let attempts = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getProcessingStatus(solutionId, stage);
        console.log(`📊 轮询第${attempts + 1}次，状态:`, status.status);
        console.log('📊 完整状态信息:', status);
        
        // 重置连续错误计数
        consecutiveErrors = 0;
        
        // 调用进度回调
        onProgress?.(status);
        
        if (status.status === 'completed' || status.status === 'generated') {
          console.log('✅ AI处理完成，获取结果');
          return await this.getProcessingResult(solutionId, stage);
        }
        
        if (status.status === 'failed') {
          throw new Error(status.error_message || 'Kimi AI处理失败，可能是API密钥配置问题');
        }
        
        // 继续轮询
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ 轮询第${attempts + 1}次失败 (连续错误: ${consecutiveErrors}):`, error);
        
        // 如果连续错误太多，直接抛出异常
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`连续${maxConsecutiveErrors}次轮询失败，可能是网络问题或API配置错误: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        
        // 短暂等待后重试
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.min(intervalMs * consecutiveErrors, 10000)));
        }
      }
    }
    
    throw new Error('Kimi AI处理超时，请检查API配置或稍后重试');
  }

  /**
   * 启动Stage 2 AI处理（实用解决方案）
   */
  async startStage2Processing(request: AIProcessingRequest & { stage1_solution_id?: string }): Promise<AIProcessingResponse> {
    console.log('🚀 启动Stage 2 AI处理:', request);
    
    try {
      const token = await authHelper.getAuthToken();
      if (!token) {
        throw new Error('无法获取认证token');
      }

      const response = await fetch('/api/ai/stage2/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Stage 2处理启动失败');
      }

      const result = await response.json();
      console.log('✅ Stage 2处理启动成功:', result);
      return result;
    } catch (error) {
      console.error('❌ Stage 2处理启动失败:', error);
      throw error;
    }
  }

  /**
   * 启动Stage 3 AI处理（后续跟进）
   */
  async startStage3Processing(request: AIProcessingRequest & { 
    stage1_solution_id?: string;
    stage2_solution_id?: string;
    follow_up_data?: any;
  }): Promise<AIProcessingResponse> {
    console.log('🚀 启动Stage 3 AI处理:', request);
    
    try {
      const token = await authHelper.getAuthToken();
      if (!token) {
        throw new Error('无法获取认证token');
      }

      const response = await fetch('/api/ai/stage3/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Stage 3处理启动失败');
      }

      const result = await response.json();
      console.log('✅ Stage 3处理启动成功:', result);
      return result;
    } catch (error) {
      console.error('❌ Stage 3处理启动失败:', error);
      throw error;
    }
  }
}

// 导出服务实例
export const aiProcessingService = new AIProcessingService();