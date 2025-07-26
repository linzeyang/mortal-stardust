import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');
    
    console.log('🔄 前端代理转发请求:', {
      body,
      authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'null'
    });
    
    // 转发请求到后端
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const backendEndpoint = `${backendUrl}/api/ai/stage1/process`;
    
    console.log('📤 向后端发送请求:', backendEndpoint);
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body)
    });

    console.log('📥 后端响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorData;
      try {
        // 克隆响应以避免Body已读取的问题
        const responseClone = response.clone();
        errorData = await responseClone.json();
        console.error('❌ 后端错误详情:', errorData);
      } catch (parseError) {
        try {
          // 使用原始响应读取文本
          const errorText = await response.text();
          console.error('❌ 后端错误文本:', errorText);
          errorData = { detail: `Backend error: ${response.status} ${response.statusText}`, raw_error: errorText };
        } catch (textError) {
          console.error('❌ 无法读取错误响应:', textError);
          errorData = { detail: `Backend error: ${response.status} ${response.statusText}` };
        }
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ 后端成功响应:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ 前端代理错误:', error);
    return NextResponse.json(
      { 
        detail: 'AI processing proxy failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}