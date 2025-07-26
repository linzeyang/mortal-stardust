import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');

    console.log('🔄 前端代理转发experiences请求:', {
      body: { ...body, formData: body.formData ? '[FORM_DATA]' : undefined },
      authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'null'
    });

    // 转发请求到后端
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const backendEndpoint = `${backendUrl}/api/experiences`;

    console.log('📤 向后端发送experiences请求:', backendEndpoint);

    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body)
    });

    console.log('📥 后端experiences响应:', {
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
        console.error('❌ 后端experiences错误详情:', errorData);
      } catch (parseError) {
        try {
          const errorText = await response.text();
          console.error('❌ 后端experiences错误文本:', errorText);
          errorData = { detail: `Backend error: ${response.status} ${response.statusText}`, raw_error: errorText };
        } catch (textError) {
          console.error('❌ 无法读取experiences错误响应:', textError);
          errorData = { detail: `Backend error: ${response.status} ${response.statusText}` };
        }
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ 后端experiences成功响应:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ 前端experiences代理错误:', error);
    return NextResponse.json(
      {
        detail: 'Experiences proxy failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');

    // 转发请求到后端
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const backendEndpoint = `${backendUrl}/api/experiences`;

    const response = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ 前端experiences GET代理错误:', error);
    return NextResponse.json(
      {
        detail: 'Experiences GET proxy failed',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}