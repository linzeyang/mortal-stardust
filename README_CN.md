# 人间星尘 (Mortal Stardust)

**人间星尘** 是一个基于AI的个人成长咨询平台，通过多模态输入和智能分析帮助用户处理生活经历并获得个性化指导。

## 🌟 核心功能

### 多模态体验收集

- **文本输入**：通过详细的文字描述分享体验
- **语音录制**：通过音频表达情感和想法
- **图片上传**：为体验和情况提供视觉背景
- **视频内容**：全面的多媒体体验分享

### 三阶段AI处理

1. **第一阶段 - 心理疗愈**：情感支持和治疗指导
2. **第二阶段 - 解决方案生成**：实用的、可操作的步骤和建议
3. **第三阶段 - 跟进追踪**：进度监控和体验补充

### 智能功能

- **基于角色的模板**：为学生、专业人士、企业家提供个性化指导
- **体验总结**：7维度的用户体验分析
- **解决方案评分系统**：用户反馈驱动AI持续改进
- **隐私优先设计**：企业级加密和GDPR合规
- **分析仪表板**：个人成长模式洞察

## 🎯 目标用户

- **学生**：学业压力、考试焦虑、职业规划
- **年轻专业人士**：职场适应、职业发展
- **企业家**：商业挑战、团队管理、决策制定
- **普通用户**：人生指导、情感支持、个人成长

## 🛠 技术栈

### 前端

- **框架**：[Next.js 15](https://nextjs.org/) 配合 App Router 和 TypeScript
- **样式**：[Tailwind CSS v4](https://tailwindcss.com/) 配合 [shadcn/ui](https://ui.shadcn.com/) 组件
- **状态管理**：React Hooks + Context API + SWR 数据获取
- **身份验证**：存储在HTTP-only cookies中的JWT令牌
- **图表**：[Recharts](https://recharts.org/) 数据可视化

### 后端

- **框架**：[Python FastAPI](https://fastapi.tiangolo.com/) 配合 async/await
- **数据库**：[MongoDB](https://www.mongodb.com/) 配合 Motor 异步驱动
- **AI集成**：OpenAI兼容的API端点
- **文件处理**：Pillow 图片处理，多部分上传
- **安全**：Cryptography 库提供 AES-256 加密

## 🚀 快速开始

### 前置要求

- Node.js 18+ 和 npm
- Python 3.8+ 和 pip
- MongoDB 实例（本地或云端）

### 安装

1. **克隆仓库**

```bash
git clone <repository-url>
cd mortal-stardust
```

2. **安装前端依赖**

```bash
npm install
```

3. **安装后端依赖**

```bash
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
cd backend
pip install -r requirements-media.txt
```

4. **环境设置**

```bash
# 复制环境变量模板
cp .env.example .env
cp backend/.env.example backend/.env
```

5. Prepare MongoDB

- option 1: Install MongoDB locally (may refer to the [documentation](https://www.mongodb.com/docs/manual/administration/install-community/))
- option 2: Use cloud MongoDB service (eg. MongoDB Atlas)

6. **配置环境变量**

   - 在 `.env` 中更新你的 MongoDB 连接字符串
   - 设置 OpenAI API 密钥用于AI处理
   - 配置文件上传路径和安全密钥

## 🏃‍♂️ 本地运行

### 数据库设置
```bash
# 设置 MongoDB 连接
npm run db:setup

# 测试数据库连接
npm run db:test

# 用测试数据填充数据库
npm run db:seed
```

### 开发服务器

1. **启动前端开发服务器**

```bash
npm run dev
```

2. **启动后端API服务器**

```bash
cd backend
python run.py
# 或者使用
uvicorn app.main:app --reload
```

3. **访问应用程序**

   - 前端：[http://localhost:3000](http://localhost:3000)
   - 后端API：[http://localhost:8000](http://localhost:8000)
   - API文档：[http://localhost:8000/docs](http://localhost:8000/docs)

### 默认测试用户

- 邮箱：`test@test.com`
- 密码：`admin123`

## 📁 项目结构

```text
├── app/                    # Next.js App Router 页面和布局
├── backend/               # Python FastAPI 后端应用
├── components/            # 可复用的 React 组件
│   ├── ai/               # AI 处理组件
│   ├── experience/       # 体验相关 UI
│   ├── multimodal/       # 媒体输入组件
│   └── ui/               # shadcn/ui 基础组件
├── lib/                   # 共享工具和配置
├── contexts/              # React 上下文提供者
└── .kiro/                 # Kiro AI 助手配置
```

## 🎨 主题

内置主题支持，具有明暗模式切换功能。使用主题系统的设计令牌：

- CSS 变量：`var(--color-primary)`
- Tailwind 类：`bg-primary text-primary-foreground`
- 自定义主题：在 `contexts/theme-context.tsx` 中定义

## 🔒 安全功能

- **字段级加密**：敏感数据使用 AES-256 加密
- **JWT 身份验证**：安全的基于令牌的身份验证
- **GDPR 合规**：隐私控制和数据保留政策
- **输入验证**：Zod（前端）和 Pydantic（后端）验证
- **CORS 配置**：安全的跨域资源共享

## 🧪 开发工具

### 代码质量

```bash
# 代码检查和格式化（配置了预提交钩子）
ruff check backend/
black backend/
```

### 测试

```bash
# 后端测试
cd backend
pytest

# 集成测试
python integration_tests.py

# 安全验证
python security_validation.py
```

## 📚 API 文档

FastAPI 后端自动生成交互式 API 文档：
- Swagger UI：`http://localhost:8000/docs`
- ReDoc：`http://localhost:8000/redoc`

## 🤝 贡献

1. 遵循既定的代码风格和检查规则
2. 使用预提交钩子确保代码质量
3. 为新功能编写测试
4. 根据需要更新文档

## 📄 许可证

本项目根据 LICENSE 文件中指定的条款获得许可。
