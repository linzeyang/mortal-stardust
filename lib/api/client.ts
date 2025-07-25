/**
 * API客户端配置
 * 
 * 提供与后端FastAPI服务器通信的基础配置和工具函数
 * 包括请求拦截、错误处理、认证管理等功能
 */

/**
 * API基础配置
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * API客户端类
 * 封装所有与后端API的通信逻辑
 */
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * 通用请求方法
   * @param endpoint API端点路径
   * @param options fetch请求选项
   * @returns Promise<Response>
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('🚀 API请求开始:', {
      url,
      method: options.method || 'GET',
      baseURL: this.baseURL,
      endpoint
    });
    
    // 默认请求头
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // 重要：包含cookies以便后端可以读取session
      credentials: 'include',
    };

    console.log('📤 请求配置:', {
      headers: config.headers,
      method: config.method,
      hasBody: !!config.body,
      credentials: config.credentials
    });

    try {
      const response = await fetch(url, config);
      
      console.log('📥 API响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      return response;
    } catch (error) {
      console.error('❌ API请求网络错误:', error);
      throw new Error(`网络请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * GET请求
   */
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST请求
   */
  async post(endpoint: string, data?: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT请求
   */
  async put(endpoint: string, data?: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * 获取认证token（从cookie中）
   * 注意：由于使用HTTP-only cookie，客户端JavaScript无法直接访问
   * 我们依赖fetch的credentials: 'include'来自动发送cookie
   */
  private getAuthToken(): string | null {
    // 由于使用HTTP-only cookie，这里返回null
    // 实际的认证通过credentials: 'include'自动处理
    return null;
  }

  /**
   * 处理API响应
   * @param response fetch响应对象
   * @returns 解析后的JSON数据
   */
  async handleResponse<T>(response: Response): Promise<T> {
    console.log('🔍 处理API响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `HTTP错误: ${response.status} ${response.statusText}`;
      let errorDetails = null;
      
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.error('❌ API错误响应:', errorData);
      } catch (parseError) {
        console.error('❌ 无法解析错误响应:', parseError);
        // 尝试获取文本响应
        try {
          const errorText = await response.text();
          console.error('❌ 错误响应文本:', errorText);
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch {
          // 忽略文本解析错误
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).details = errorDetails;
      (error as any).status = response.status;
      throw error;
    }

    try {
      const data = await response.json();
      console.log('✅ API响应数据:', data);
      return data;
    } catch (error) {
      console.error('❌ 响应JSON解析失败:', error);
      throw new Error('响应数据格式错误');
    }
  }
}

// 导出默认API客户端实例
export const apiClient = new ApiClient();