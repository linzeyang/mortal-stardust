/**
 * @fileoverview Social Page Component
 *
 * 社交互动页面 - 星空主题设计
 * 使用 pageseven.png 作为背景，展示离散圆点式经历分享
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import {
  Users,
  MessageCircle,
  Heart,
  Star,
  MapPin,
  X,
  Play,
  Pause,
  Volume2
} from 'lucide-react';

// 音频播放器组件
function AudioPlayer({ audioTitle = "经历录音分享" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // 3分钟模拟音频

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // 模拟播放进度
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-3 mb-3">
        <Volume2 className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-800">{audioTitle}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full p-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>
        
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SocialPage() {
  const [selectedExperience, setSelectedExperience] = useState<any>(null);

  // 模拟数据 - 增加位置信息用于圆点分布
  const experiences = [
    {
      id: 1,
      author: '小星',
      title: '职场新人的第一次挫折',
      content: '刚入职场的我，在第一个项目中犯了一个严重的错误，当时觉得天都要塌了。但现在回想起来，那次失败教会了我很多东西，让我学会了如何面对挫折，如何从错误中成长。每个人都会犯错，重要的是如何从中学习。',
      tags: ['职场', '成长', '反思'],
      likes: 23,
      comments: 8,
      time: '2小时前',
      location: '北京',
      // 圆点位置和大小
      position: { x: 15, y: 25 },
      size: 'large', // small, medium, large
      audioTitle: '我的职场成长心声'
    },
    {
      id: 2,
      author: '追梦者',
      title: '创业路上的艰难选择',
      content: '面临资金短缺，是坚持还是放弃？这是我最纠结的时刻。团队的信任、投资人的期待、家人的担忧，所有的压力都压在我身上。最终我选择了坚持，虽然路很难走，但我相信梦想的力量。',
      tags: ['创业', '决策', '坚持'],
      likes: 45,
      comments: 12,
      time: '5小时前',
      location: '上海',
      position: { x: 70, y: 35 },
      size: 'medium',
      audioTitle: '创业路上的心路历程'
    },
    {
      id: 3,
      author: '学习小能手',
      title: '考研失败后的重新出发',
      content: '第二次考研失败了，但我学会了如何面对失败。失败不是终点，而是新的起点。我重新审视了自己的目标，调整了学习方法，现在我更加坚定地走在自己选择的路上。',
      tags: ['学习', '考研', '重新开始'],
      likes: 67,
      comments: 15,
      time: '1天前',
      location: '广州',
      position: { x: 40, y: 60 },
      size: 'large',
      audioTitle: '失败后的反思与成长'
    },
    {
      id: 4,
      author: '夜行者',
      title: '深夜的思考',
      content: '每个深夜都是思考的时刻，在这个安静的时间里，我能听到内心最真实的声音。',
      tags: ['思考', '深夜', '内心'],
      likes: 12,
      comments: 3,
      time: '3天前',
      location: '深圳',
      position: { x: 80, y: 70 },
      size: 'small',
      audioTitle: '深夜独白'
    },
    {
      id: 5,
      author: '旅行家',
      title: '一个人的旅行',
      content: '独自旅行让我学会了与自己对话，在路上遇到的每个人都是生命中的老师。',
      tags: ['旅行', '独立', '成长'],
      likes: 34,
      comments: 7,
      time: '1周前',
      location: '成都',
      position: { x: 25, y: 80 },
      size: 'medium',
      audioTitle: '旅途中的感悟'
    },
    {
      id: 6,
      author: '艺术家',
      title: '创作的瓶颈期',
      content: '每个创作者都会遇到瓶颈期，那种感觉就像被困在黑暗中找不到出路。',
      tags: ['艺术', '创作', '瓶颈'],
      likes: 28,
      comments: 9,
      time: '2周前',
      location: '杭州',
      position: { x: 60, y: 20 },
      size: 'small',
      audioTitle: '创作路上的困惑'
    }
  ];

  // 根据大小返回圆点尺寸
  const getCircleSize = (size: string) => {
    switch (size) {
      case 'small': return 'w-12 h-12';
      case 'medium': return 'w-16 h-16';
      case 'large': return 'w-20 h-20';
      default: return 'w-16 h-16';
    }
  };

  // 根据大小返回星星尺寸
  const getStarSize = (size: string) => {
    switch (size) {
      case 'small': return 'w-5 h-5';
      case 'medium': return 'w-6 h-6';
      case 'large': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  return (
    <>
      {/* 导航栏会自动显示，因为这个页面在app目录下，会继承layout.tsx中的Header组件 */}
      
      <main className="relative min-h-screen overflow-auto">
        {/* 背景图片层 - 使用 pageseven.png，支持滚动查看完整背景 */}
        <div className="absolute inset-0 min-h-[200vh]">
          <Image
            src="/images/pageseven.png"
            alt="社交背景"
            fill
            className="object-cover object-top"
            priority
            quality={100}
          />
          {/* 深色遮罩层，确保内容可读性 */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* 主要内容层 */}
        <div className="relative z-10 min-h-[200vh]">
          {/* 顶部统计区域 */}
          <div className="pt-8 pb-16">
            <div className="container mx-auto px-4 max-w-6xl">
              {/* 统计数据卡片 */}
              <Card className="mb-8 bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    社交广场概览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">1,248</div>
                      <div className="text-white/70 text-sm">注册用户</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">356</div>
                      <div className="text-white/70 text-sm">今日活跃</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">27</div>
                      <div className="text-white/70 text-sm">今日分享</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">18-45</div>
                      <div className="text-white/70 text-sm">用户年龄</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 经历圆点分布区域 */}
          <div className="relative w-full h-[120vh] px-4">
            {experiences.map((experience) => (
              <div
                key={experience.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${experience.position.x}%`,
                  top: `${experience.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setSelectedExperience(experience)}
              >
                {/* 用户名和地点标签 */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                    <div className="font-medium">{experience.author}</div>
                    <div className="text-white/80 flex items-center justify-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {experience.location}
                    </div>
                  </div>
                </div>

                {/* 圆点 */}
                <div className={`
                  ${getCircleSize(experience.size)}
                  rounded-full 
                  bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500
                  flex items-center justify-center
                  shadow-lg
                  hover:shadow-xl
                  hover:scale-110
                  transition-all duration-300
                  border-2 border-white/30
                  backdrop-blur-sm
                `}>
                  <Star className={`${getStarSize(experience.size)} text-white`} />
                </div>

                {/* 光晕效果 */}
                <div className={`
                  ${getCircleSize(experience.size)}
                  rounded-full 
                  absolute top-0 left-0
                  bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500
                  opacity-20
                  animate-pulse
                  scale-150
                `}></div>
              </div>
            ))}
          </div>
        </div>

        {/* 经历详情模态框 */}
        {selectedExperience && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {selectedExperience.author[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{selectedExperience.author}</div>
                      <div className="text-gray-600 text-sm flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedExperience.location} · {selectedExperience.time}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedExperience(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">{selectedExperience.title}</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {selectedExperience.content}
                </p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedExperience.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* 音频播放器 */}
                <AudioPlayer audioTitle={selectedExperience.audioTitle} />

                {/* 互动区域 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-6">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                        <Heart className="w-4 h-4 mr-1" />
                        {selectedExperience.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {selectedExperience.comments}
                      </Button>
                    </div>
                  </div>
                  
                  {/* 评论区域 */}
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="写下你的想法和建议..."
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button size="sm">发表评论</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}