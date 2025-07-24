import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Forward request to FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Forward auth headers if they exist
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Media upload proxy error:', error);
    return NextResponse.json(
      { detail: 'Media upload failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    // Forward request to FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/media/files?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Fetch failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Media fetch proxy error:', error);
    return NextResponse.json(
      { detail: 'Media fetch failed' },
      { status: 500 }
    );
  }
}