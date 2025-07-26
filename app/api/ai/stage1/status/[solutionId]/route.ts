import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { solutionId: string } }
) {
  try {
    const { solutionId } = params;
    
    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');
    
    // 转发请求到后端
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/ai/stage1/status/${solutionId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Status check failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('AI status proxy error:', error);
    return NextResponse.json(
      { detail: 'Status check failed' },
      { status: 500 }
    );
  }
}