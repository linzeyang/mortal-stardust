'use client';

import React, { useState } from 'react';
import MultimodalInput from '@/components/multimodal/multimodal-input';
import MediaGallery from '@/components/multimodal/media-gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MediaFile {
  id: string;
  file: File;
  type: 'audio' | 'image' | 'video';
  preview?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  metadata?: any;
  transcription?: string;
}

export default function TestMultimodalPage() {
  const [submittedExperiences, setSubmittedExperiences] = useState<any[]>([]);

  const handleExperienceSubmit = async (data: {
    text: string;
    mediaFiles: MediaFile[];
    description?: string;
  }) => {
    console.log('Submitting experience:', data);

    // Create experience object
    const experience = {
      id: Date.now().toString(),
      text: data.text,
      description: data.description,
      mediaFiles: data.mediaFiles.map(f => ({
        id: f.id,
        name: f.file.name,
        type: f.type,
        size: f.file.size,
        metadata: f.metadata
      })),
      submittedAt: new Date().toISOString()
    };

    setSubmittedExperiences(prev => [experience, ...prev]);

    // Here you would normally send to your API
    // await fetch('/api/experiences', { method: 'POST', body: ... });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">多模态输入系统测试</h1>
        <p className="text-muted-foreground">
          测试文字、音频、图片和视频的多模态输入功能
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <MultimodalInput
            onSubmit={handleExperienceSubmit}
            placeholder="在这里分享您的经历..."
            maxFiles={5}
            allowedTypes={['audio', 'image', 'video']}
          />

          {/* Submitted Experiences */}
          {submittedExperiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>已提交的经历</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submittedExperiences.map((exp) => (
                    <Card key={exp.id} className="p-4">
                      <div className="space-y-3">
                        {exp.text && (
                          <div>
                            <h4 className="font-medium mb-2">文字内容：</h4>
                            <p className="text-sm text-muted-foreground">{exp.text}</p>
                          </div>
                        )}

                        {exp.description && (
                          <div>
                            <h4 className="font-medium mb-2">描述：</h4>
                            <p className="text-sm text-muted-foreground">{exp.description}</p>
                          </div>
                        )}

                        {exp.mediaFiles.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">媒体文件：</h4>
                            <div className="flex flex-wrap gap-2">
                              {exp.mediaFiles.map((file: any) => (
                                <Badge key={file.id} variant="secondary">
                                  {file.type}: {file.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          提交时间: {new Date(exp.submittedAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Media Gallery Section */}
        <div>
          <MediaGallery
            showControls={true}
            onFileSelect={(file) => {
              console.log('Selected file:', file);
            }}
            onFileDelete={(fileId) => {
              console.log('Deleted file:', fileId);
            }}
          />
        </div>
      </div>

      {/* Feature Information */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>多模态输入功能说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">文</span>
                </div>
                <h3 className="font-medium mb-2">文字输入</h3>
                <p className="text-sm text-muted-foreground">
                  支持长文本输入，自动加密存储
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">音</span>
                </div>
                <h3 className="font-medium mb-2">音频录制</h3>
                <p className="text-sm text-muted-foreground">
                  实时录音，自动语音转文字
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">图</span>
                </div>
                <h3 className="font-medium mb-2">图片上传</h3>
                <p className="text-sm text-muted-foreground">
                  支持拍照和文件上传，图像分析
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 font-bold">视</span>
                </div>
                <h3 className="font-medium mb-2">视频处理</h3>
                <p className="text-sm text-muted-foreground">
                  视频上传，音轨提取，关键帧分析
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">技术特性：</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 端到端数据加密保护</li>
                <li>• 智能媒体文件处理</li>
                <li>• 自动语音转文字</li>
                <li>• 图像质量评估</li>
                <li>• 视频关键帧提取</li>
                <li>• 文件安全存储管理</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
