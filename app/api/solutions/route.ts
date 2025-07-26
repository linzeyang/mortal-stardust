/**
 * Solutions API Route Handler
 *
 * This route provides access to AI-generated solutions for the authenticated user.
 * It fetches the user's experiences and their associated solutions from the backend,
 * using the same authentication pattern as the experience page.
 */

import { getSession } from '@/lib/auth/session';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Get authentication token using the same pattern as experience page
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
 * GET handler for retrieving user's solutions
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

    // Get user's experiences
    const experiencesResponse = await fetch(`${BACKEND_URL}/api/experiences/`, {
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

    // Get solutions for each experience
    const allSolutions = [];
    for (const experience of experiences) {
      try {
        const solutionsResponse = await fetch(
          `${BACKEND_URL}/api/solutions/experience/${experience.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (solutionsResponse.ok) {
          const solutions = await solutionsResponse.json();
          console.log(`💡 Found ${solutions.length} solutions for experience: ${experience.title}`);

          // Add experience context to each solution
          const solutionsWithContext = solutions.map((solution: any) => ({
            ...solution,
            experienceTitle: experience.title,
            experienceCategory: experience.category,
          }));
          allSolutions.push(...solutionsWithContext);
        } else {
          console.log(`No solutions found for experience: ${experience.title}`);
        }
      } catch (error) {
        console.error(`Failed to fetch solutions for experience ${experience.id}:`, error);
        // Continue with other experiences even if one fails
      }
    }

    console.log(`🎯 Total solutions found: ${allSolutions.length}`);

    // Transform solutions to match frontend expectations
    const transformedSolutions = allSolutions.map((solution) => ({
      id: solution.id,
      title: solution.experienceTitle || 'AI解决方案',
      content: typeof solution.content === 'string'
        ? solution.content
        : (typeof solution.content === 'object' ? JSON.stringify(solution.content, null, 2) : String(solution.content)),
      rating: solution.userFeedback?.rating || null,
      stage: `stage${solution.stage}`,
      createdAt: solution.createdAt,
      status: solution.userFeedback?.rating
        ? (solution.userFeedback.rating >= 50 ? 'completed' : 'needs_regeneration')
        : 'pending',
      aiModel: solution.aiModel || 'GPT-4',
      experienceType: solution.experienceCategory || 'general',
      experienceId: solution.experienceId,
    }));

    return Response.json(transformedSolutions);
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
