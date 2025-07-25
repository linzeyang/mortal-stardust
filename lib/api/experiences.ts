/**
 * 经历管理API服务
 * 
 * 提供与经历相关的所有API调用功能
 * 包括创建、获取、更新经历等操作
 */

import { apiClient } from './client';
import { authHelper } from './auth-helper';

/**
 * 经历数据接口定义
 */
export interface ExperienceData {
  templateId?: string;
  role: string;
  data: Record<string, any>;
  submittedAt?: string;
  isDraft?: boolean;
  currentSection?: number;
  lastModified?: string;
}

/**
 * 创建经历请求的数据结构
 * 需要匹配后端的ExperienceCreate模型
 */
export interface CreateExperienceRequest {
  title: string;
  content: {
    text: string;
    mediaFiles?: string[];
  };
  category: string;
  emotionalState: {
    primary: string;
    intensity: number;
    description: string;
  };
  tags: string[];
  privacy: {
    isPublic: boolean;
    allowAnalytics: boolean;
  };
  metadata: {
    location?: string;
    dateOccurred: string;
    inputMethod: string;
    processingStage: string;
  };
}

/**
 * 经历API服务类
 */
export class ExperienceService {
  /**
   * 创建新的经历记录
   * @param experienceData 经历数据
   * @returns Promise<{id: string, message: string}>
   */
  async createExperience(experienceData: ExperienceData): Promise<{id: string, message: string}> {
    console.log('🎯 开始创建经历:', experienceData);
    
    try {
      // 获取认证token
      console.log('🔑 获取认证token...');
      const token = await authHelper.getAuthToken();
      
      if (!token) {
        throw new Error('无法获取认证token，请检查登录状态');
      }

      // 将前端的经历数据转换为后端期望的格式
      const requestData = this.transformToBackendFormat(experienceData);
      
      console.log('🔄 转换后的请求数据:', requestData);
      
      // 使用Bearer token进行认证
      const response = await fetch('http://localhost:8000/api/experiences/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ 经历创建成功:', result);
      return result;
    } catch (error) {
      console.error('❌ 创建经历失败:', error);
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        const enhancedError = new Error(`创建经历失败: ${error.message}`);
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      
      throw new Error('创建经历时发生未知错误');
    }
  }

  /**
   * 获取用户的经历列表
   * @param skip 跳过的记录数
   * @param limit 返回的记录数限制
   * @returns Promise<any[]>
   */
  async getUserExperiences(skip: number = 0, limit: number = 20): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/experiences/?skip=${skip}&limit=${limit}`);
      return await apiClient.handleResponse<any[]>(response);
    } catch (error) {
      console.error('获取经历列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取特定的经历详情
   * @param experienceId 经历ID
   * @returns Promise<any>
   */
  async getExperience(experienceId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/experiences/${experienceId}`);
      return await apiClient.handleResponse<any>(response);
    } catch (error) {
      console.error('获取经历详情失败:', error);
      throw error;
    }
  }

  /**
   * 将前端经历数据转换为后端API期望的格式
   * @param experienceData 前端经历数据
   * @returns CreateExperienceRequest
   */
  private transformToBackendFormat(experienceData: ExperienceData): CreateExperienceRequest {
    // 从表单数据中提取关键信息
    const formData = experienceData.data || {};
    
    // 生成标题（如果没有提供的话）
    const title = formData.title || 
                 formData.main_challenge || 
                 `${this.getRoleDisplayName(experienceData.role)}的经历` ||
                 '我的生活经历';

    // 生成内容文本
    const contentText = this.generateContentText(formData);

    // 确定分类
    const category = this.mapRoleToCategory(experienceData.role);

    // 生成情绪状态
    const emotionalState = this.generateEmotionalState(formData);

    // 生成标签
    const tags = this.generateTags(experienceData.role, formData);

    return {
      title: title.substring(0, 200), // 限制标题长度
      content: {
        text: contentText,
        mediaFiles: [] // 暂时不处理媒体文件
      },
      category,
      emotionalState,
      tags,
      privacy: {
        isPublic: false, // 默认私有
        allowAnalytics: true // 允许分析以改进AI
      },
      metadata: {
        location: formData.location || '',
        dateOccurred: new Date().toISOString().split('T')[0], // 今天的日期
        inputMethod: 'text', // 使用后端期望的枚举值：'text', 'voice', 'mixed'
        processingStage: 'pending' // 待处理
      }
    };
  }

  /**
   * 生成内容文本
   */
  private generateContentText(formData: Record<string, any>): string {
    const parts: string[] = [];

    // 主要挑战或问题
    if (formData.main_challenge) {
      parts.push(`主要挑战: ${formData.main_challenge}`);
    }

    // 公司类型和职位信息
    if (formData.company_type) {
      parts.push(`公司类型: ${this.getOptionLabel('company_type', formData.company_type)}`);
    }
    
    if (formData.position_level) {
      parts.push(`职位级别: ${this.getOptionLabel('position_level', formData.position_level)}`);
    }

    if (formData.work_duration) {
      parts.push(`工作时长: ${this.getOptionLabel('work_duration', formData.work_duration)}`);
    }

    if (formData.industry) {
      parts.push(`行业: ${formData.industry}`);
    }

    // 挑战类型
    if (formData.challenge_category && Array.isArray(formData.challenge_category)) {
      const categories = formData.challenge_category.map((cat: string) => 
        this.getOptionLabel('challenge_category', cat)
      ).join(', ');
      parts.push(`挑战类型: ${categories}`);
    }

    // 压力程度
    if (formData.stress_level) {
      parts.push(`压力程度: ${formData.stress_level}/10`);
    }

    // 其他字段
    Object.entries(formData).forEach(([key, value]) => {
      if (!['main_challenge', 'company_type', 'position_level', 'work_duration', 
            'industry', 'challenge_category', 'stress_level'].includes(key) && value) {
        if (typeof value === 'string' && value.trim()) {
          parts.push(`${key}: ${value}`);
        } else if (typeof value === 'number') {
          parts.push(`${key}: ${value}`);
        }
      }
    });

    return parts.join('\n\n');
  }

  /**
   * 生成情绪状态
   */
  private generateEmotionalState(formData: Record<string, any>) {
    const stressLevel = formData.stress_level || 5;
    
    // 根据压力程度确定主要情绪，使用后端期望的枚举值
    let primary = 'confused'; // 默认值
    if (stressLevel >= 8) {
      primary = 'anxious';
    } else if (stressLevel >= 6) {
      primary = 'frustrated';
    } else if (stressLevel <= 3) {
      primary = 'peaceful';
    } else if (stressLevel <= 5) {
      primary = 'confused';
    } else {
      primary = 'excited';
    }

    return {
      primary,
      intensity: Math.min(Math.max(stressLevel, 1), 10),
      description: `基于用户填写的压力程度${stressLevel}/10生成的情绪状态`
    };
  }

  /**
   * 生成标签
   */
  private generateTags(role: string, formData: Record<string, any>): string[] {
    const tags = [this.getRoleDisplayName(role)];

    // 添加挑战类型作为标签
    if (formData.challenge_category && Array.isArray(formData.challenge_category)) {
      tags.push(...formData.challenge_category.map((cat: string) => 
        this.getOptionLabel('challenge_category', cat)
      ));
    }

    // 添加行业标签
    if (formData.industry) {
      tags.push(formData.industry);
    }

    // 添加公司类型标签
    if (formData.company_type) {
      tags.push(this.getOptionLabel('company_type', formData.company_type));
    }

    return [...new Set(tags)]; // 去重
  }

  /**
   * 将角色映射到分类
   */
  private mapRoleToCategory(role: string): string {
    const roleToCategory: Record<string, string> = {
      'workplace_newcomer': 'career',
      'student': 'education', 
      'entrepreneur': 'career',
      'other': 'other'
    };
    return roleToCategory[role] || 'other';
  }

  /**
   * 获取角色显示名称
   */
  private getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'workplace_newcomer': '职场新人',
      'student': '学生',
      'entrepreneur': '创业者',
      'other': '其他'
    };
    return roleNames[role] || role;
  }

  /**
   * 获取选项标签
   */
  private getOptionLabel(fieldType: string, value: string): string {
    const options: Record<string, Record<string, string>> = {
      company_type: {
        'startup': '初创公司',
        'sme': '中小企业',
        'large_corp': '大型企业',
        'government': '政府机关',
        'ngo': '非营利组织',
        'other': '其他'
      },
      position_level: {
        'intern': '实习生',
        'entry': '初级职位',
        'junior': '初中级职位',
        'associate': '专员级别'
      },
      work_duration: {
        'less_1month': '不到1个月',
        '1_3months': '1-3个月',
        '3_6months': '3-6个月',
        '6_12months': '6个月-1年',
        'over_1year': '1年以上'
      },
      challenge_category: {
        'technical_skills': '技能不足',
        'communication': '沟通困难',
        'time_management': '时间管理',
        'workplace_relations': '人际关系',
        'work_pressure': '工作压力',
        'career_direction': '职业方向',
        'work_life_balance': '工作生活平衡',
        'other': '其他'
      }
    };

    return options[fieldType]?.[value] || value;
  }
}

// 导出服务实例
export const experienceService = new ExperienceService();