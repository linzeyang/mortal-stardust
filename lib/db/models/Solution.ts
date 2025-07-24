import mongoose, { Schema, Document, Model } from 'mongoose';
import { encryptData, decryptData } from '../../utils/encryption';

export interface ISolution extends Document {
  _id: string;
  userId: string;
  experienceId: string;
  stage: 1 | 2 | 3; // Three-stage AI processing
  content: {
    title: string; // Encrypted
    description: string; // Encrypted
    recommendations: string[]; // Encrypted array
    actionSteps?: string[]; // Encrypted array
    resources?: {
      type: 'article' | 'book' | 'video' | 'podcast' | 'professional';
      title: string;
      url?: string;
      description?: string;
    }[];
  };
  aiMetadata: {
    model: string;
    prompt: string; // Encrypted
    parameters: any; // Encrypted
    processingTime: number;
    confidence: number; // 0-1 scale
    version: string;
  };
  userFeedback: {
    rating: 30 | 50 | 70 | 100; // Percentage rating
    isHelpful: boolean;
    improvementSuggestions?: string; // Encrypted
    positiveAspects?: string[]; // Encrypted array
    ratedAt: Date;
  };
  status: 'generated' | 'reviewed' | 'approved' | 'regenerating' | 'archived';
  analytics: {
    viewCount: number;
    shareCount: number;
    effectivenessScore?: number;
  };
  followUp?: {
    scheduledDate: Date;
    completed: boolean;
    notes?: string; // Encrypted
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema({
  type: {
    type: String,
    enum: ['article', 'book', 'video', 'podcast', 'professional'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  url: String,
  description: String
});

const SolutionSchema = new Schema<ISolution>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  experienceId: {
    type: String,
    required: true,
    index: true
  },
  stage: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  content: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    recommendations: [{
      type: String,
      required: true
    }],
    actionSteps: [String],
    resources: [ResourceSchema]
  },
  aiMetadata: {
    model: {
      type: String,
      required: true,
      default: 'gpt-4'
    },
    prompt: {
      type: String,
      required: true
    },
    parameters: mongoose.Schema.Types.Mixed,
    processingTime: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    version: {
      type: String,
      required: true,
      default: '1.0'
    }
  },
  userFeedback: {
    rating: {
      type: Number,
      enum: [30, 50, 70, 100]
    },
    isHelpful: {
      type: Boolean,
      default: false
    },
    improvementSuggestions: String,
    positiveAspects: [String],
    ratedAt: Date
  },
  status: {
    type: String,
    enum: ['generated', 'reviewed', 'approved', 'regenerating', 'archived'],
    default: 'generated'
  },
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    effectivenessScore: Number
  },
  followUp: {
    scheduledDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for performance
SolutionSchema.index({ userId: 1, stage: 1 });
SolutionSchema.index({ experienceId: 1, stage: 1 });
SolutionSchema.index({ 'userFeedback.rating': 1 });
SolutionSchema.index({ status: 1 });
SolutionSchema.index({ createdAt: -1 });

// Encrypt sensitive data before saving
SolutionSchema.pre('save', function(next) {
  try {
    // Encrypt content
    if (this.isModified('content.title')) {
      this.content.title = encryptData(this.content.title);
    }
    
    if (this.isModified('content.description')) {
      this.content.description = encryptData(this.content.description);
    }
    
    if (this.isModified('content.recommendations')) {
      this.content.recommendations = this.content.recommendations.map(rec => encryptData(rec));
    }
    
    if (this.content.actionSteps && this.isModified('content.actionSteps')) {
      this.content.actionSteps = this.content.actionSteps.map(step => encryptData(step));
    }
    
    // Encrypt AI metadata
    if (this.isModified('aiMetadata.prompt')) {
      this.aiMetadata.prompt = encryptData(this.aiMetadata.prompt);
    }
    
    if (this.isModified('aiMetadata.parameters')) {
      this.aiMetadata.parameters = encryptData(JSON.stringify(this.aiMetadata.parameters));
    }
    
    // Encrypt user feedback
    if (this.userFeedback?.improvementSuggestions && this.isModified('userFeedback.improvementSuggestions')) {
      this.userFeedback.improvementSuggestions = encryptData(this.userFeedback.improvementSuggestions);
    }
    
    if (this.userFeedback?.positiveAspects && this.isModified('userFeedback.positiveAspects')) {
      this.userFeedback.positiveAspects = this.userFeedback.positiveAspects.map(aspect => encryptData(aspect));
    }
    
    // Encrypt follow-up notes
    if (this.followUp?.notes && this.isModified('followUp.notes')) {
      this.followUp.notes = encryptData(this.followUp.notes);
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to decrypt sensitive data for display
SolutionSchema.methods.decryptSensitiveData = function(): void {
  try {
    // Decrypt content
    if (this.content.title) {
      this.content.title = decryptData(this.content.title);
    }
    
    if (this.content.description) {
      this.content.description = decryptData(this.content.description);
    }
    
    if (this.content.recommendations) {
      this.content.recommendations = this.content.recommendations.map((rec: string) => decryptData(rec));
    }
    
    if (this.content.actionSteps) {
      this.content.actionSteps = this.content.actionSteps.map((step: string) => decryptData(step));
    }
    
    // Decrypt AI metadata
    if (this.aiMetadata.prompt) {
      this.aiMetadata.prompt = decryptData(this.aiMetadata.prompt);
    }
    
    if (this.aiMetadata.parameters && typeof this.aiMetadata.parameters === 'string') {
      this.aiMetadata.parameters = JSON.parse(decryptData(this.aiMetadata.parameters));
    }
    
    // Decrypt user feedback
    if (this.userFeedback?.improvementSuggestions) {
      this.userFeedback.improvementSuggestions = decryptData(this.userFeedback.improvementSuggestions);
    }
    
    if (this.userFeedback?.positiveAspects) {
      this.userFeedback.positiveAspects = this.userFeedback.positiveAspects.map((aspect: string) => decryptData(aspect));
    }
    
    // Decrypt follow-up notes
    if (this.followUp?.notes) {
      this.followUp.notes = decryptData(this.followUp.notes);
    }
  } catch (error) {
    console.error('Error decrypting solution data:', error);
  }
};

const Solution: Model<ISolution> = mongoose.models.Solution || mongoose.model<ISolution>('Solution', SolutionSchema);

export default Solution;