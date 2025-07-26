"""
Mortal Stardust (人间星尘) - AI-Powered Personal Growth Counseling Platform

This module serves as the main entry point for the FastAPI backend application.
It configures the web server, middleware, database connections, and API routing
for the three-stage AI processing system that helps users process life experiences
and receive personalized guidance.

The application follows a modular architecture with:
- Feature-based API routers organized by domain (auth, experiences, solutions, AI processing)
- Async MongoDB operations with Motor driver for scalable data persistence
- JWT-based authentication with HTTP Bearer token security
- CORS middleware configured for frontend integration
- Comprehensive error handling and logging throughout the request lifecycle

Key Components:
- Three-stage AI processing pipeline (emotional support, practical solutions, follow-up)
- Multi-modal experience collection (text, audio, image, video)
- User role-based templates and personalized recommendations
- Solution rating system for continuous AI improvement
- Privacy-first design with field-level encryption and GDPR compliance

Dependencies:
- FastAPI: Modern async web framework for building APIs
- Motor: Async MongoDB driver for database operations
- Pydantic: Data validation and settings management
- OpenAI: AI model integration for experience processing
- Cryptography: AES-256 encryption for sensitive data protection
"""

import uvicorn
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

from .api import (
    ai_processing,
    ai_stage1,
    ai_stage2,
    ai_stage3,
    auth,
    experience_summarization,
    experiences,
    media,
    privacy_compliance,
    secure_data,
    settings,
    solution_analytics,
    solution_rating,
    solutions,
    users,
)
from .core.database import close_db, connect_db
from .routers import role_templates

# Load environment variables from .env file for local development
# This must be called before importing any modules that depend on environment variables
load_dotenv()

# Create FastAPI application instance with comprehensive API documentation
# The auto-generated docs provide interactive testing interface for all endpoints
app = FastAPI(
    title="LifePath AI Backend",
    description="AI-Powered Life Experience Counseling Platform API",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI documentation endpoint
    redoc_url="/redoc",  # ReDoc alternative documentation endpoint
)

# Configure Cross-Origin Resource Sharing (CORS) middleware
# This enables the Next.js frontend to make API requests from different origins
# Essential for development (localhost:3000) and production (*.clackypaas.com) environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*.clackypaas.com",
    ],  # Allowed frontend origins
    allow_credentials=True,  # Enable cookies and authorization headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly list methods
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],  # Explicitly list headers
    expose_headers=["*"],  # Expose all response headers
)

# Configure HTTP Bearer token security scheme for JWT authentication
# This enables automatic token extraction from Authorization header: "Bearer <token>"
security = HTTPBearer()


# Application lifecycle event handlers
# These events ensure proper database connection management throughout the app lifecycle


@app.on_event("startup")
async def startup_event():
    """
    Initialize application resources on startup.

    This event handler runs once when the FastAPI application starts up.
    It establishes the MongoDB connection, creates necessary database indexes,
    and initializes any required collections or data structures.

    The startup process includes:
    - Connecting to MongoDB using the configured connection string
    - Testing the database connection with a ping command
    - Creating optimized indexes for all collections to improve query performance
    - Initializing experience summary database components
    - Setting up any background tasks or scheduled jobs

    If the database connection fails, the application will not start properly
    and will raise a ConnectionFailure exception.
    """
    await connect_db()
    print("✅ FastAPI backend started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Clean up application resources on shutdown.

    This event handler runs when the FastAPI application is shutting down.
    It ensures graceful cleanup of database connections and any other resources
    to prevent connection leaks and ensure data integrity.

    The shutdown process includes:
    - Closing the MongoDB connection pool
    - Canceling any running background tasks
    - Flushing any pending database operations
    - Cleaning up temporary files and cache

    This is critical for production deployments where the application
    may be restarted or scaled down frequently.
    """
    await close_db()
    print("📴 FastAPI backend stopped")


# Health check endpoint for monitoring and load balancer probes
@app.get("/health")
async def health_check():
    """
    Application health check endpoint.

    This endpoint provides a simple way for monitoring systems, load balancers,
    and container orchestration platforms to verify that the application is
    running and responsive.

    Returns:
        dict: Health status information including service name and status

    Example:
        GET /health
        Response: {"status": "healthy", "service": "LifePath AI Backend"}
    """
    return {"status": "healthy", "service": "LifePath AI Backend"}


@app.options("/api/ai/stage1/process")
async def cors_preflight():
    """Handle CORS preflight for AI processing endpoint."""
    return {"message": "CORS preflight OK"}


@app.get("/cors-test")
async def cors_test():
    """Test CORS configuration."""
    return {
        "message": "CORS test successful",
        "timestamp": datetime.utcnow().isoformat(),
        "origin": "backend"
    }


@app.get("/api/ai/stage1/test")
async def test_ai_stage1_get():
    """Simple GET test endpoint for AI Stage 1 without authentication."""
    try:
        return {
            "message": "AI Stage 1 GET test endpoint working",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success"
        }
    except Exception as e:
        return {
            "message": "AI Stage 1 GET test failed",
            "error": str(e),
            "status": "error"
        }


@app.post("/api/ai/stage1/test")
async def test_ai_stage1_post():
    """Simple POST test endpoint for AI Stage 1 without authentication."""
    try:
        return {
            "message": "AI Stage 1 POST test endpoint working",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success"
        }
    except Exception as e:
        return {
            "message": "AI Stage 1 POST test failed",
            "error": str(e),
            "status": "error"
        }


@app.post("/api/ai/stage1/test-auth")
async def test_ai_stage1_with_auth():
    """Test AI Stage 1 endpoint with authentication simulation."""
    try:
        # 尝试导入依赖
        from .dependencies import get_current_user
        from .core.database import get_database
        
        return {
            "message": "AI Stage 1 dependencies loaded successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success"
        }
    except Exception as e:
        return {
            "message": "AI Stage 1 dependency loading failed",
            "error": str(e),
            "status": "error"
        }


@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all registered routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, 'name', 'unknown')
            })
    return {"routes": routes}


@app.post("/api/ai/stage1/simple-test")
async def simple_ai_test():
    """Simple AI test without authentication or complex dependencies."""
    try:
        from .core.config import settings
        
        # Test basic configuration
        config_info = {
            "openai_api_key_configured": bool(settings.OPENAI_API_KEY),
            "openai_api_url": settings.OPENAI_API_URL,
            "openai_model_name": settings.OPENAI_MODEL_NAME,
            "mongo_uri_configured": bool(settings.MONGO_URI),
        }
        
        return {
            "message": "Simple AI test successful",
            "timestamp": datetime.utcnow().isoformat(),
            "config": config_info,
            "status": "success"
        }
    except Exception as e:
        return {
            "message": "Simple AI test failed",
            "error": str(e),
            "status": "error"
        }


@app.post("/kimi-api-test")
async def test_kimi_api():
    """专门测试Kimi API连接的端点"""
    try:
        from .core.config import settings
        import openai
        import httpx
        import json
        
        print(f"🧪 开始Kimi API测试...")
        print(f"   API密钥: {settings.OPENAI_API_KEY[:20]}..." if settings.OPENAI_API_KEY else "   API密钥: 未配置")
        print(f"   API端点: {settings.OPENAI_API_URL}")
        print(f"   模型名称: {settings.OPENAI_MODEL_NAME}")
        
        # 验证配置
        if not settings.OPENAI_API_KEY:
            return {
                "status": "error",
                "error_type": "configuration_error",
                "message": "API密钥未配置",
                "error": "OPENAI_API_KEY环境变量未设置"
            }
        
        if not settings.OPENAI_API_URL or settings.OPENAI_API_URL == "https://api.openai.com/v1":
            return {
                "status": "error", 
                "error_type": "configuration_error",
                "message": "API端点配置错误",
                "error": f"当前配置: {settings.OPENAI_API_URL}, 应该是: https://api.moonshot.cn/v1"
            }
        
        # 先尝试直接HTTP请求测试
        print(f"🔄 尝试直接HTTP请求...")
        async with httpx.AsyncClient() as http_client:
            test_data = {
                "model": settings.OPENAI_MODEL_NAME,
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个AI助手，请用中文简短回复。"
                    },
                    {
                        "role": "user", 
                        "content": "请说'测试成功'"
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
            }
            
            http_response = await http_client.post(
                f"{settings.OPENAI_API_URL}/chat/completions",
                json=test_data,
                headers=headers,
                timeout=30.0
            )
            
            print(f"📥 HTTP响应状态: {http_response.status_code}")
            
            if http_response.status_code == 200:
                http_data = http_response.json()
                return {
                    "status": "success",
                    "message": "Kimi API连接测试成功 (HTTP直接请求)",
                    "timestamp": datetime.utcnow().isoformat(),
                    "method": "direct_http",
                    "config": {
                        "api_url": settings.OPENAI_API_URL,
                        "model": settings.OPENAI_MODEL_NAME,
                        "api_key_configured": bool(settings.OPENAI_API_KEY)
                    },
                    "test_response": {
                        "content": http_data["choices"][0]["message"]["content"],
                        "model": http_data["model"],
                        "usage": http_data.get("usage", {})
                    }
                }
            else:
                error_text = http_response.text
                print(f"❌ HTTP请求失败: {error_text}")
        
        # 如果HTTP直接请求失败，尝试OpenAI客户端
        print(f"🔄 尝试OpenAI客户端...")
        
        # 创建异步OpenAI客户端
        client = openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_URL,
            timeout=30.0,  # 增加超时时间
            max_retries=2   # 设置重试次数
        )
        
        # 测试简单的API调用
        test_messages = [
            {
                "role": "system",
                "content": "你是一个AI助手，请用中文简短回复。"
            },
            {
                "role": "user", 
                "content": "请说'测试成功'"
            }
        ]
        
        print(f"🔄 发送测试请求到Kimi API (OpenAI客户端)...")
        
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL_NAME,
            messages=test_messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        print(f"✅ Kimi API响应成功!")
        
        result_content = response.choices[0].message.content
        
        return {
            "status": "success",
            "message": "Kimi API连接测试成功 (OpenAI客户端)",
            "timestamp": datetime.utcnow().isoformat(),
            "method": "openai_client",
            "config": {
                "api_url": settings.OPENAI_API_URL,
                "model": settings.OPENAI_MODEL_NAME,
                "api_key_configured": bool(settings.OPENAI_API_KEY)
            },
            "test_response": {
                "content": result_content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0
                }
            }
        }
        
    except openai.AuthenticationError as e:
        print(f"❌ Kimi API认证错误: {e}")
        return {
            "status": "error",
            "error_type": "authentication_error",
            "message": "API密钥认证失败",
            "error": str(e),
            "suggestions": [
                "检查API密钥是否正确",
                "确认API密钥是否有效且未过期",
                "验证API密钥权限设置"
            ]
        }
    except openai.APIConnectionError as e:
        print(f"❌ Kimi API连接错误: {e}")
        return {
            "status": "error", 
            "error_type": "connection_error",
            "message": "无法连接到Kimi API服务器",
            "error": str(e),
            "suggestions": [
                "检查网络连接",
                "验证API端点URL是否正确",
                "确认防火墙设置允许访问"
            ]
        }
    except openai.RateLimitError as e:
        print(f"❌ Kimi API速率限制: {e}")
        return {
            "status": "error",
            "error_type": "rate_limit_error", 
            "message": "API调用频率超限",
            "error": str(e),
            "suggestions": [
                "等待一段时间后重试",
                "检查API配额使用情况",
                "考虑升级API套餐"
            ]
        }
    except openai.APIError as e:
        print(f"❌ Kimi API错误: {e}")
        print(f"   错误详情: {e.__dict__}")
        return {
            "status": "error",
            "error_type": "api_error",
            "message": "Kimi API返回错误",
            "error": str(e),
            "error_details": str(e.__dict__) if hasattr(e, '__dict__') else "无详细信息",
            "suggestions": [
                "检查请求参数是否正确",
                "验证模型名称是否支持",
                "查看API文档确认请求格式"
            ]
        }
    except Exception as e:
        print(f"❌ 未知错误: {type(e).__name__}: {e}")
        return {
            "status": "error",
            "error_type": "unknown_error",
            "message": "测试过程中发生未知错误",
            "error": str(e),
            "error_class": type(e).__name__,
            "suggestions": [
                "检查后端日志获取详细错误信息",
                "确认所有依赖包已正确安装",
                "验证环境变量配置"
            ]
        }
    """Direct test of Kimi API without complex processing."""
    try:
        import openai
        from .core.config import settings
        
        # Create async OpenAI client
        client = openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_URL
        )
        
        # 也尝试备用端点
        backup_client = openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url="https://api.moonshot.cn/v1"  # 确保端点正确
        )
        
        print(f"🧪 测试Kimi API直接调用")
        print(f"🧪 API端点: {settings.OPENAI_API_URL}")
        print(f"🧪 模型: {settings.OPENAI_MODEL_NAME}")
        print(f"🧪 API密钥前10位: {settings.OPENAI_API_KEY[:10]}...")
        print(f"🧪 API密钥长度: {len(settings.OPENAI_API_KEY)}")
        
        # 测试API端点连通性
        import httpx
        try:
            async with httpx.AsyncClient() as http_client:
                test_response = await http_client.get(f"{settings.OPENAI_API_URL.rstrip('/v1')}/v1/models")
                print(f"🧪 API端点连通性测试: {test_response.status_code}")
        except Exception as conn_error:
            print(f"🧪 API端点连通性测试失败: {conn_error}")
        
        # Simple test call - 先尝试主要客户端
        try:
            print("🧪 尝试主要API端点...")
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL_NAME,
                messages=[
                    {"role": "user", "content": "你好，请简单回复一句话测试API连接。"}
                ],
                max_tokens=50,
                temperature=0.7
            )
        except Exception as primary_error:
            print(f"🧪 主要端点失败: {primary_error}")
            print("🧪 尝试备用API端点...")
            response = await backup_client.chat.completions.create(
                model=settings.OPENAI_MODEL_NAME,
                messages=[
                    {"role": "user", "content": "你好，请简单回复一句话测试API连接。"}
                ],
                max_tokens=50,
                temperature=0.7
            )
        
        content = response.choices[0].message.content
        print(f"✅ Kimi API测试成功: {content}")
        
        return {
            "message": "Kimi API direct test successful",
            "timestamp": datetime.utcnow().isoformat(),
            "api_response": content,
            "model_used": settings.OPENAI_MODEL_NAME,
            "status": "success"
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Kimi API测试失败: {type(e).__name__}: {error_msg}")
        
        return {
            "message": "Kimi API direct test failed",
            "error": error_msg,
            "error_type": type(e).__name__,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "error"
        }


# Register API routers with the FastAPI application
# Each router handles a specific domain of functionality and is organized by feature area
# The routers are grouped with tags for better API documentation organization

# Core user management and authentication
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

# Experience and solution management - core business logic
app.include_router(experiences.router, prefix="/api/experiences", tags=["experiences"])
app.include_router(solutions.router, prefix="/api/solutions", tags=["solutions"])

# AI processing pipeline - three-stage system for experience analysis
app.include_router(ai_processing.router, prefix="/api/ai", tags=["ai-processing"])
app.include_router(
    ai_stage1.router, prefix="/api/ai/stage1", tags=["ai-stage1"]
)  # Emotional support and healing
app.include_router(
    ai_stage2.router
)  # Practical solution generation
app.include_router(
    ai_stage3.router
)  # Follow-up and supplementation

# Media handling for multi-modal experience collection
app.include_router(media.router, prefix="/api/media", tags=["media"])

# Analytics and feedback systems
app.include_router(solution_rating.router, tags=["solution-rating"])
app.include_router(
    experience_summarization.router, prefix="/api", tags=["experience-summarization"]
)
app.include_router(
    solution_analytics.router, prefix="/api", tags=["solution-analytics"]
)

# Security and privacy features
app.include_router(secure_data.router, tags=["secure-data"])
app.include_router(
    privacy_compliance.router, prefix="/api", tags=["privacy-compliance"]
)

# User role templates and personalization
app.include_router(role_templates.router, tags=["role-templates"])


# Root endpoint providing API information and navigation
@app.get("/")
async def root():
    """
    API root endpoint with service information.

    Provides basic information about the API service including version,
    documentation links, and welcome message. This serves as the entry
    point for API discovery and can be used by monitoring systems.

    Returns:
        dict: Service information including message, version, and documentation URL

    Example:
        GET /
        Response: {
            "message": "Welcome to LifePath AI Backend API",
            "version": "1.0.0",
            "docs": "/docs"
        }
    """
    return {
        "message": "Welcome to LifePath AI Backend API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# Development server configuration
# This block only runs when the script is executed directly (not imported)
if __name__ == "__main__":
    # Start the Uvicorn ASGI server with development-friendly settings
    # - host="0.0.0.0": Accept connections from any IP address
    # - port=8000: Default development port
    # - reload=True: Auto-restart server when code changes (development only)
    # - log_level="info": Detailed logging for debugging and monitoring
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
