'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrivacyCenter from '@/components/privacy/PrivacyCenter';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('authToken');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading privacy center...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PrivacyCenter userId={user.id} />
    </div>
  );
};

export default PrivacyPage;
