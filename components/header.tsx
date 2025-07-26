/**
 * @fileoverview Global Header Component
 *
 * The main navigation header component that appears on all pages of the application.
 * This component provides user authentication controls, navigation menu, theme switching,
 * and responsive design for both authenticated and unauthenticated users.
 *
 * Key Features:
 * - Dynamic navigation menu based on authentication status
 * - User avatar dropdown with profile and sign-out options
 * - Theme toggle controls for light/dark mode
 * - Responsive design that adapts to different screen sizes
 * - Integration with SWR for real-time user data fetching
 *
 * Dependencies:
 * - Next.js Link for client-side navigation
 * - SWR for data fetching and caching
 * - Lucide React for consistent iconography
 * - shadcn/ui components for dropdown and avatar
 * - Custom theme controls component
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, FileText, Brain, BarChart3, Star, Shield, Sparkles, UserCheck, Settings } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
// User type definition for API responses
type User = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  preferences: any;
  security: any;
  createdAt: Date;
  updatedAt: Date;
};
import useSWR, { mutate } from 'swr';
import ThemeControls from './theme-controls';
import { siteConfig } from '@/lib/config';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-foreground">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span className="truncate">{user.name || user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex items-center"
            aria-label="访问账户设置页面"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>账户设置</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavigationMenu() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  // Active state detection for navigation items
  const isSettingsActive = pathname === '/settings';

  return (
    <nav className="hidden md:flex items-center space-x-6">
      <Link
        href="/experience"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span>经历收集</span>
      </Link>
      <Link
        href="/ai-solutions"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <Brain className="h-4 w-4" />
        <span>AI方案</span>
      </Link>
      <Link
        href="/analytics"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <BarChart3 className="h-4 w-4" />
        <span>数据分析</span>
      </Link>
      <Link
        href="/rating-demo"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <Star className="h-4 w-4" />
        <span>评价系统</span>
      </Link>
      <Link
        href="/experience-summary"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        <span>经历总结</span>
      </Link>
      <Link
        href="/security"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <Shield className="h-4 w-4" />
        <span>安全中心</span>
      </Link>
      <Link
        href="/privacy"
        className="flex items-center space-x-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <UserCheck className="h-4 w-4" />
        <span>隐私中心</span>
      </Link>
      <Link
        href="/settings"
        className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isSettingsActive
            ? 'text-white font-semibold'
            : 'text-white/80 hover:text-white'
          }`}
        aria-label="访问设置页面管理账户偏好"
        aria-current={isSettingsActive ? 'page' : undefined}
      >
        <Settings className="h-4 w-4" />
        <span>设置</span>
      </Link>
    </nav>
  );
}

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/negative.png"
              alt="Negative Logo"
              width={64}
              height={64}
              className="opacity-90"
            />
          </Link>
          <NavigationMenu />
        </div>
        <div className="flex items-center space-x-4">
          <ThemeControls />
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
