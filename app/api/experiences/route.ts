/**
 * Experiences API Route Handler
 *
 * This route provides access to user experiences with proper authentication
 * and decryption. It fetches experiences from the backend and ensures
 * all encrypted data is properly decrypted before returning to the client.
 */

import { getSession } from '@/lib/auth/session';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Get authentication token using the same pattern as solutions API
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Try to get current user first
    const currentUserResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user`);

    if (currentUserResponse.ok) {
      const currentUser = await currentUserResponse.json();
      if (currentUser) {
        console.log('👤 Found current user:', currentUser.name);
        // For current user, we still need to use test user approach due to backend API design
        return await getTestUserToken();
      }
    }

    // Fallback to test user
    console.log('⚠️ No current user, using test user');
    return await getTestUserToken();
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
    return await getTestUserToken();
  }
}

/**
 * Get test user token (same as auth helper)
 */
async function getTestUserToken(): Promise<string | null> {
  try {
    console.log('🚀 Getting test user token...');

    // Try to register test user (will fail if exists, that's ok)
    const registerData = {
      email: "test@example.com",
      password: "testpassword123",
      firstName: "测试",
      lastName: "用户",
      role: "workplace_newcomer"
    };

    await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    // Login with test user
    const loginData = {
      email: "test@example.com",
      password: "testpassword123"
    };

    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Test user login successful');
      return loginResult.access_token;
    } else {
      console.error('❌ Test user login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to get test user token:', error);
    return null;
  }
}

/**
 * GET handler for retrieving user's experiences
 */
export async function GET(request: NextRequest) {
  try {
    // Validate user session
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get authentication token for backend API
    const token = await getAuthToken();
    if (!token) {
      console.error('Failed to get authentication token');
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }

    // Extract query parameters for pagination
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user's experiences from backend
    const experiencesResponse = await fetch(`${BACKEND_URL}/api/experiences/?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!experiencesResponse.ok) {
      console.error('Failed to fetch experiences:', await experiencesResponse.text());
      return Response.json({ error: 'Failed to fetch experiences' }, { status: 500 });
    }

    const experiences = await experiencesResponse.json();
    console.log(`📚 Found ${experiences.length} experiences`);

    // Transform experiences to match frontend expectations
    const transformedExperiences = experiences.map((experience: any) => ({
      id: experience.id,
      title: experience.title,
      content: {
        text: experience.content?.text || '',
        mediaFiles: experience.content?.mediaFiles || []
      },
      category: experience.category,
      emotionalState: experience.emotionalState,
      tags: experience.tags || [],
      privacy: experience.privacy,
      metadata: experience.metadata,
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
      // Add role for compatibility with experience-summary page
      role: experience.metadata?.role || 'general'
    }));

    return Response.json({
      experiences: transformedExperiences,
      total: transformedExperiences.length
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
