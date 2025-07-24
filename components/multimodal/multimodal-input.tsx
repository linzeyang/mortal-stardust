'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Mic, 
  MicOff, 
  Camera, 
  Video, 
  Image as ImageIcon, 
  FileText,
  X,
  Play,
  Pause,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface MultimodalInputProps {
  onSubmit: (data: {
    text: string;
    mediaFiles: MediaFile[];
    description?: string;
  }) => Promise<void>;
  placeholder?: string;
  maxFiles?: number;
  allowedTypes?: ('audio' | 'image' | 'video')[];
}

export default function MultimodalInput({ 
  onSubmit, 
  placeholder = "分享您的经历...", 
  maxFiles = 5,
  allowedTypes = ['audio', 'image', 'video']
}: MultimodalInputProps) {
  const [textContent, setTextContent] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [activeTab, setActiveTab] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();

  // File handling
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];
    
    for (let i = 0; i < files.length && mediaFiles.length + newFiles.length < maxFiles; i++) {
      const file = files[i];
      const fileType = getFileType(file.type);
      
      if (!allowedTypes.includes(fileType)) {
        toast({
          title: "不支持的文件类型",
          description: `${file.name} 不是支持的文件格式`,
          variant: "destructive"
        });
        continue;
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: `${file.name} 超过50MB大小限制`,
          variant: "destructive"
        });
        continue;
      }

      const mediaFile: MediaFile = {
        id: generateId(),
        file,
        type: fileType,
        status: 'uploading',
        progress: 0
      };

      // Generate preview for images and videos
      if (fileType === 'image' || fileType === 'video') {
        mediaFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(mediaFile);
    }

    if (newFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...newFiles]);
      
      // Upload files
      for (const mediaFile of newFiles) {
        await uploadFile(mediaFile);
      }
    }
  }, [mediaFiles.length, maxFiles, allowedTypes, toast]);

  const uploadFile = async (mediaFile: MediaFile) => {
    try {
      const formData = new FormData();
      formData.append('file', mediaFile.file);
      formData.append('media_type', mediaFile.type);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update file status
      setMediaFiles(prev => prev.map(file => 
        file.id === mediaFile.id 
          ? { 
              ...file, 
              status: 'completed',
              progress: 100,
              metadata: result.metadata
            }
          : file
      ));

      toast({
        title: "文件上传成功",
        description: `${mediaFile.file.name} 已成功上传并处理`,
      });

    } catch (error) {
      console.error('File upload failed:', error);
      
      setMediaFiles(prev => prev.map(file => 
        file.id === mediaFile.id 
          ? { ...file, status: 'error', progress: 0 }
          : file
      ));

      toast({
        title: "上传失败",
        description: `${mediaFile.file.name} 上传失败`,
        variant: "destructive"
      });
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        
        const mediaFile: MediaFile = {
          id: generateId(),
          file,
          type: 'audio',
          status: 'uploading',
          progress: 0
        };

        setMediaFiles(prev => [...prev, mediaFile]);
        uploadFile(mediaFile);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "开始录音",
        description: "正在录制您的音频...",
      });

    } catch (error) {
      console.error('Recording failed:', error);
      toast({
        title: "录音失败",
        description: "无法访问麦克风",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      toast({
        title: "录音完成",
        description: "音频录制完成，正在处理...",
      });
    }
  };

  // Photo capture
  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Capture frame
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')!;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            const mediaFile: MediaFile = {
              id: generateId(),
              file,
              type: 'image',
              status: 'uploading',
              progress: 0,
              preview: URL.createObjectURL(file)
            };

            setMediaFiles(prev => [...prev, mediaFile]);
            uploadFile(mediaFile);
          }
        }, 'image/jpeg', 0.8);

        // Stop camera
        stream.getTracks().forEach(track => track.stop());
      }

    } catch (error) {
      console.error('Photo capture failed:', error);
      toast({
        title: "拍照失败",
        description: "无法访问摄像头",
        variant: "destructive"
      });
    }
  };

  // File removal
  const removeFile = (fileId: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Form submission
  const handleSubmit = async () => {
    if (!textContent.trim() && mediaFiles.length === 0) {
      toast({
        title: "内容不能为空",
        description: "请输入文字内容或上传媒体文件",
        variant: "destructive"
      });
      return;
    }

    const pendingFiles = mediaFiles.filter(f => f.status === 'uploading' || f.status === 'processing');
    if (pendingFiles.length > 0) {
      toast({
        title: "请等待文件处理完成",
        description: "还有文件正在上传或处理中",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        text: textContent,
        mediaFiles: mediaFiles.filter(f => f.status === 'completed'),
        description
      });

      // Reset form
      setTextContent('');
      setDescription('');
      setMediaFiles([]);
      
      toast({
        title: "提交成功",
        description: "您的经历已成功提交",
      });

    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: "提交失败",
        description: "提交时发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility functions
  const getFileType = (mimeType: string): 'audio' | 'image' | 'video' => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'image'; // default
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>分享您的经历</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text">
              <FileText className="w-4 h-4 mr-2" />
              文字
            </TabsTrigger>
            <TabsTrigger value="audio">
              <Mic className="w-4 h-4 mr-2" />
              音频
            </TabsTrigger>
            <TabsTrigger value="image">
              <ImageIcon className="w-4 h-4 mr-2" />
              图片
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4 mr-2" />
              视频
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div>
              <Label htmlFor="text-content">文字内容</Label>
              <Textarea
                id="text-content"
                placeholder={placeholder}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="w-32"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    停止录音
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    开始录音
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                {isRecording ? "正在录音中，点击停止录音按钮结束" : "点击开始录音按钮录制您的声音"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  选择图片
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={capturePhoto}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  拍照
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "video/*";
                  fileInputRef.current.click();
                }
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              选择视频
            </Button>
          </TabsContent>
        </Tabs>

        {/* Media files display */}
        {mediaFiles.length > 0 && (
          <div className="space-y-4">
            <Label>已上传的文件</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediaFiles.map((mediaFile) => (
                <Card key={mediaFile.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">
                        {mediaFile.file.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(mediaFile.status)}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(mediaFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {mediaFile.status === 'uploading' && (
                      <Progress value={mediaFile.progress} className="mb-2" />
                    )}
                    
                    {mediaFile.preview && (
                      <div className="mt-2">
                        {mediaFile.type === 'image' ? (
                          <img
                            src={mediaFile.preview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : mediaFile.type === 'video' ? (
                          <video
                            src={mediaFile.preview}
                            className="w-full h-32 object-cover rounded"
                            controls
                          />
                        ) : null}
                      </div>
                    )}
                    
                    {mediaFile.metadata?.hasTranscript && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ✓ 包含语音转文字
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <Label htmlFor="description">补充描述 (可选)</Label>
          <Input
            id="description"
            placeholder="为您的经历添加一些补充说明..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Submit button */}
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              正在提交...
            </>
          ) : (
            "提交经历"
          )}
        </Button>

        {/* Hidden elements for camera functionality */}
        <video ref={videoRef} className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}