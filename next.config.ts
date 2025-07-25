/**
 * Next.js Configuration for Mortal Stardust Platform
 *
 * This configuration enables experimental features for improved performance
 * and development experience, while setting up allowed origins for CORS
 * in development environments.
 *
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Experimental features for enhanced performance and functionality
  experimental: {
    // Partial Prerendering (PPR) - enables static/dynamic content mixing
    // Improves performance by prerendering static parts while keeping dynamic parts interactive
    ppr: true,

    // Client-side segment caching - caches route segments on the client
    // Reduces network requests and improves navigation performance
    clientSegmentCache: true,

    // Node.js middleware support - enables server-side middleware execution
    // Required for our authentication and session management middleware
    nodeMiddleware: true
  },

  // Allowed development origins for CORS configuration
  // These domains are permitted to make requests during development
  allowedDevOrigins: [
    '*.clackypaas.com',  // ClackyPaaS deployment domains (wildcard for subdomains)
    'localhost',         // Local development server
    '127.0.0.1',        // IPv4 loopback address
    '0.0.0.0'           // All network interfaces (for Docker/container environments)
  ],

  // 防止水合错误的配置
  reactStrictMode: true,
  
  // 编译器配置
  compiler: {
    // 生产环境移除console.log
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 确保客户端和服务器端渲染一致性
  poweredByHeader: false,
  
  // 优化图片处理
  images: {
    formats: ['image/webp', 'image/avif'],
  }
};

export default nextConfig;
