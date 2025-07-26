import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { solutionId: string } }
) {
  try {
    const { solutionId } = params;
    
    // 获取认证头
    const authorization = request.headers.get('authorization');
    
    // 转发到后端
    const backendResponse = await fetch(`http://localhost:8000/api/ai/stage2/status/${solutionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    const responseData = await backendResponse.json();

    return NextResponse.json(responseData, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Stage 2 status proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}