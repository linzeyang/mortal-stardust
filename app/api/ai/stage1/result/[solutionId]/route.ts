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
    const response = await fetch(`${backendUrl}/api/ai/stage1/result/${solutionId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Result fetch failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('AI result proxy error:', error);
    return NextResponse.json(
      { detail: 'Result fetch failed' },
      { status: 500 }
    );
  }
}