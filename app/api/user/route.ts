import { getCurrentUser } from '@/lib/auth/mongodb-queries';

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user);
}
