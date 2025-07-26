/**
 * @fileoverview Home Page Component
 *
 * 人间星尘主页 - 星空主题设计
 * 使用背景图片和星空元素，营造梦幻的宇宙氛围
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      // 清除之前的超时
      clearTimeout(scrollTimeout);

      // 如果向下滚动
      if (e.deltaY > 0) {
        scrollTimeout = setTimeout(() => {
          router.push('/social');
        }, 300); // 300ms 延迟，避免误触
      }
    };

    // 添加滚轮事件监听
    window.addEventListener('wheel', handleWheel, { passive: true });

    // 清理函数
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [router]);
  return (
    <main className="relative min-h-screen overflow-hidden select-none">
      {/* 背景图片层 - 使用 firstpage.png */}
      <div className="absolute inset-0">
        <Image
          src="/images/firstpage.png"
          alt="星空背景"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* 深色遮罩层，确保文字可读性 */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* 左上角装饰图标 */}
      <div className="absolute top-8 left-8 z-20 flex items-center space-x-4">
        {/* 对话框图标 */}
        <div className="relative">
          <Image
            src="/images/Vector.png"
            alt="对话框"
            width={32}
            height={32}
            className="opacity-80"
          />
        </div>

        {/* 人间星尘 Logo */}
        <div className="relative">
          <Image
            src="/images/humanicdust.png"
            alt="人间星尘"
            width={120}
            height={40}
            className="opacity-90"
          />
        </div>
      </div>

      {/* 主要内容层 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 主内容区域 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* 主要内容可以在这里添加 */}
          </div>
        </div>

        {/* 底部 Starash logo 和向下箭头 */}
        <div className="relative z-20 pb-8 flex flex-col items-center">
          {/* Starash Logo */}
          <div className="mb-4">
            <Image
              src="/images/Starash.png"
              alt="Starash"
              width={80}
              height={80}
              className="opacity-90"
            />
          </div>

          {/* 向下箭头 - 可点击跳转到社交页面 */}
          <Link href="/social" className="group cursor-pointer">
            <div className="flex flex-col items-center">
              <ChevronDown className="w-8 h-8 text-white/80 animate-bounce group-hover:text-white transition-colors duration-300" />
              <div className="mt-2 text-white/60 text-sm group-hover:text-white/80 transition-colors duration-300">
                探索更多
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 浮动星光效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 可以添加一些CSS动画的星光点缀 */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse delay-3000"></div>
      </div>
    </main>
  );
}