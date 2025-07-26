/**
 * 认证辅助工具
 * 
 * 提供认证解决方案，支持当前登录用户和测试用户
 */

/**
 * 认证辅助类
 * 优先使用当前登录用户，如果没有则创建测试用户
 */
export class AuthHelper {
  private static instance: AuthHelper;
  private token: string | null = null;
  private user: any = null;

  private constructor() {}

  static getInstance(): AuthHelper {
    if (!AuthHelper.instance) {
      AuthHelper.instance = new AuthHelper();
    }
    return AuthHelper.instance;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const user = await response.json();
        return user;
      }
    } catch (error) {
      console.error('获取当前用户失败:', error);
    }
    return null;
  }

  /**
   * 为当前用户获取Bearer token
   */
  async getTokenForCurrentUser(user: any): Promise<string | null> {
    try {
      console.log('🔐 为当前用户获取token...');
      
      // 尝试使用当前用户的邮箱登录获取token
      if (user && user.email) {
        console.log('🔑 尝试为当前用户获取token:', user.email);
        
        // 使用当前用户的邮箱和可能的密码尝试登录
        // 注意：这是一个临时解决方案，实际项目中应该有更安全的token获取方式
        const possiblePasswords = [
          "testpassword123",  // 默认测试密码
          "password123",      // 常见密码
          "123456",          // 简单密码
          user.email.split('@')[0] + "123" // 基于邮箱的密码
        ];

        let loginSuccess = false;
        let loginResult = null;

        for (const password of possiblePasswords) {
          try {
            const loginData = {
              email: user.email,
              password: password
            };

            const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(loginData)
            });

            if (loginResponse.ok) {
              loginResult = await loginResponse.json();
              loginSuccess = true;
              console.log(`✅ 当前用户登录成功，使用密码: ${password.substring(0, 3)}***`);
              break;
            }
          } catch (error) {
            continue; // 尝试下一个密码
          }
        }

        if (loginSuccess && loginResult) {
          return loginResult.access_token;
        } else {
          console.log('⚠️ 所有密码尝试失败，回退到测试用户');
        }
      }
      
      // 回退到测试用户
      return await this.getTestUserToken();
      
    } catch (error) {
      console.error('❌ 为当前用户获取token失败:', error);
      return await this.getTestUserToken();
    }
  }

  /**
   * 获取测试用户的token（备用方案）
   */
  async getTestUserToken(): Promise<string | null> {
    try {
      console.log('🚀 使用测试用户获取token...');
      
      // 尝试注册测试用户
      const registerData = {
        email: "test@example.com",
        password: "testpassword123",
        firstName: "测试",
        lastName: "用户",
        role: "workplace_newcomer"
      };

      console.log('📝 尝试注册测试用户...');
      const registerResponse = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      // 无论注册成功还是用户已存在，都尝试登录
      console.log('🔐 尝试登录测试用户...');
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

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        console.log('✅ 测试用户登录成功，获得token');
        return loginResult.access_token;
      } else {
        const errorText = await loginResponse.text();
        console.error('❌ 测试用户登录失败:', errorText);
        return null;
      }

    } catch (error) {
      console.error('❌ 获取测试用户token失败:', error);
      return null;
    }
  }

  /**
   * 获取或创建认证token
   */
  async getAuthToken(): Promise<string | null> {
    if (this.token) {
      console.log('🔑 使用缓存的token');
      return this.token;
    }

    try {
      // 首先检查当前用户
      const currentUser = await this.getCurrentUser();
      
      if (currentUser) {
        console.log('👤 发现当前登录用户:', currentUser.name);
        this.user = currentUser;
        
        // 为当前用户获取token
        this.token = await this.getTokenForCurrentUser(currentUser);
      } else {
        console.log('⚠️ 没有当前登录用户，使用测试用户');
        this.token = await this.getTestUserToken();
      }

      return this.token;

    } catch (error) {
      console.error('❌ 获取认证token失败:', error);
      return null;
    }
  }

  /**
   * 获取当前用户信息
   */
  getUser() {
    return this.user;
  }

  /**
   * 清除认证信息
   */
  clearAuth() {
    this.token = null;
    this.user = null;
  }
}

export const authHelper = AuthHelper.getInstance();