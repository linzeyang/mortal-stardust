import mongoose, { Schema, Document, Model } from 'mongoose';
import { encryptData, decryptData } from '../../utils/encryption';

export interface IMediaFile {
  type: 'audio' | 'image' | 'video';
  filename: string;
  originalName: string;
  url: string; // Encrypted
  size: number;
  duration?: number; // For audio/video
  transcript?: string; // Encrypted, for audio/video
  description?: string; // Encrypted, for images
  metadata?: any; // Encrypted
}

export interface IExperience extends Document {
  _id: string;
  userId: string;
  title: string; // Encrypted
  content: {
    text: string; // Encrypted
    mediaFiles: IMediaFile[];
  };
  category: 'career' | 'relationship' | 'education' | 'health' | 'finance' | 'personal_growth' | 'other';
  emotionalState: {
    primary: 'happy' | 'sad' | 'angry' | 'anxious' | 'confused' | 'excited' | 'peaceful' | 'frustrated';
    intensity: number; // 1-10 scale
    description?: string; // Encrypted
  };
  tags: string[];
  privacy: {
    isPublic: boolean;
    shareWithAI: boolean;
    anonymizeForResearch: boolean;
  };
  metadata: {
    location?: string; // Encrypted
    dateOccurred: Date;
    inputMethod: 'text' | 'voice' | 'mixed';
    processingStage: 'pending' | 'stage1' | 'stage2' | 'stage3' | 'completed';
  };
  createdAt: Date;
  updatedAt: Date;
}

const MediaFileSchema = new Schema<IMediaFile>({
  type: {
    type: String,
    enum: ['audio', 'image', 'video'],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: Number,
  transcript: String, // Encrypted
  description: String, // Encrypted
  metadata: mongoose.Schema.Types.Mixed // Encrypted
});

const ExperienceSchema = new Schema<IExperience>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    text: {
      type: String,
      required: true
    },
    mediaFiles: [MediaFileSchema]
  },
  category: {
    type: String,
    enum: ['career', 'relationship', 'education', 'health', 'finance', 'personal_growth', 'other'],
    required: true
  },
  emotionalState: {
    primary: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'anxious', 'confused', 'excited', 'peaceful', 'frustrated'],
      required: true
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    description: String // Encrypted
  },
  tags: [String],
  privacy: {
    isPublic: {
      type: Boolean,
      default: false
    },
    shareWithAI: {
      type: Boolean,
      default: true
    },
    anonymizeForResearch: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    location: String, // Encrypted
    dateOccurred: {
      type: Date,
      required: true
    },
    inputMethod: {
      type: String,
      enum: ['text', 'voice', 'mixed'],
      default: 'text'
    },
    processingStage: {
      type: String,
      enum: ['pending', 'stage1', 'stage2', 'stage3', 'completed'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
ExperienceSchema.index({ userId: 1, createdAt: -1 });
ExperienceSchema.index({ category: 1 });
ExperienceSchema.index({ 'metadata.processingStage': 1 });
ExperienceSchema.index({ tags: 1 });

// Encrypt sensitive data before saving
ExperienceSchema.pre('save', function(next) {
  try {
    // Encrypt title
    if (this.isModified('title')) {
      this.title = encryptData(this.title);
    }
    
    // Encrypt content text
    if (this.isModified('content.text')) {
      this.content.text = encryptData(this.content.text);
    }
    
    // Encrypt emotional state description
    if (this.emotionalState.description && this.isModified('emotionalState.description')) {
      this.emotionalState.description = encryptData(this.emotionalState.description);
    }
    
    // Encrypt location
    if (this.metadata.location && this.isModified('metadata.location')) {
      this.metadata.location = encryptData(this.metadata.location);
    }
    
    // Encrypt media file sensitive data
    if (this.isModified('content.mediaFiles')) {
      this.content.mediaFiles.forEach(file => {
        if (file.url) file.url = encryptData(file.url);
        if (file.transcript) file.transcript = encryptData(file.transcript);
        if (file.description) file.description = encryptData(file.description);
        if (file.metadata) file.metadata = encryptData(JSON.stringify(file.metadata));
      });
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to decrypt sensitive data for display
ExperienceSchema.methods.decryptSensitiveData = function(): void {
  try {
    if (this.title) {
      this.title = decryptData(this.title);
    }
    
    if (this.content.text) {
      this.content.text = decryptData(this.content.text);
    }
    
    if (this.emotionalState.description) {
      this.emotionalState.description = decryptData(this.emotionalState.description);
    }
    
    if (this.metadata.location) {
      this.metadata.location = decryptData(this.metadata.location);
    }
    
    // Decrypt media files
    this.content.mediaFiles.forEach((file: any) => {
      if (file.url) file.url = decryptData(file.url);
      if (file.transcript) file.transcript = decryptData(file.transcript);
      if (file.description) file.description = decryptData(file.description);
      if (file.metadata) file.metadata = JSON.parse(decryptData(file.metadata));
    });
  } catch (error) {
    console.error('Error decrypting experience data:', error);
  }
};

const Experience: Model<IExperience> = mongoose.models.Experience || mongoose.model<IExperience>('Experience', ExperienceSchema);

export default Experience;