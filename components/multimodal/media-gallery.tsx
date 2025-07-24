'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Eye,
  Clock,
  HardDrive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mediaType: 'audio' | 'image' | 'video';
  mimeType: string;
  fileSize: number;
  description?: string;
  uploadedAt: string;
  metadata: {
    duration?: number;
    dimensions?: { width: number; height: number };
    hasTranscript?: boolean;
    processingNote?: string;
  };
}

interface MediaGalleryProps {
  userId?: string;
  onFileSelect?: (file: MediaFile) => void;
  onFileDelete?: (fileId: string) => void;
  showControls?: boolean;
}

export default function MediaGallery({
  userId,
  onFileSelect,
  onFileDelete,
  showControls = true
}: MediaGalleryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadMediaFiles();
  }, [selectedType]);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.append('media_type', selectedType);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/media/files?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load media files');
      }

      const files = await response.json();
      setMediaFiles(files);
    } catch (error) {
      console.error('Failed to load media files:', error);
      toast({
        title: "加载失败",
        description: "无法加载媒体文件",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/media/files/${fileId}/download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "下载成功",
        description: `${filename} 已开始下载`
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "下载失败",
        description: "无法下载文件",
        variant: "destructive"
      });
    }
  };

  const handleFileDelete = async (fileId: string, filename: string) => {
    if (!confirm(`确定要删除 ${filename} 吗？此操作无法撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/media/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setMediaFiles(prev => prev.filter(f => f.id !== fileId));
      onFileDelete?.(fileId);

      toast({
        title: "删除成功",
        description: `${filename} 已被删除`
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "删除失败",
        description: "无法删除文件",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'audio': return <Music className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredFiles = mediaFiles.filter(file =>
    selectedType === 'all' || file.mediaType === selectedType
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            加载媒体文件中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>媒体库</span>
          <Badge variant="outline">
            {filteredFiles.length} 个文件
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="image">图片</TabsTrigger>
            <TabsTrigger value="audio">音频</TabsTrigger>
            <TabsTrigger value="video">视频</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-4">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无{selectedType === 'all' ? '' : selectedType === 'image' ? '图片' : selectedType === 'audio' ? '音频' : '视频'}文件</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getMediaIcon(file.mediaType)}
                          <span className="text-sm font-medium truncate">
                            {file.originalName}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {file.mediaType}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>大小:</span>
                          <span>{formatFileSize(file.fileSize)}</span>
                        </div>

                        {file.metadata.duration && (
                          <div className="flex justify-between">
                            <span>时长:</span>
                            <span>{Math.round(file.metadata.duration)}秒</span>
                          </div>
                        )}

                        {file.metadata.dimensions && (
                          <div className="flex justify-between">
                            <span>尺寸:</span>
                            <span>{file.metadata.dimensions.width}x{file.metadata.dimensions.height}</span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span>上传时间:</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {file.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {file.description}
                        </p>
                      )}

                      {showControls && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onFileSelect?.(file)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            查看
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileDownload(file.id, file.originalName)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            下载
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileDelete(file.id, file.originalName)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
