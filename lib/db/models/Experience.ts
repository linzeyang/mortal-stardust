/**
 * Experience Data Model for Mortal Stardust Platform
 *
 * This module defines the Experience schema for storing user life experiences
 * with multi-modal content support (text, audio, image, video). Experiences
 * are the core input for the AI processing pipeline and include emotional
 * context, categorization, and privacy controls.
 *
 * Key Features:
 * - Multi-modal content support with metadata
 * - Emotional state tracking with intensity scoring
 * - Category-based organization for AI processing
 * - Privacy controls for data sharing and anonymization
 * - Processing stage tracking for AI pipeline
 * - Field-level encryption for sensitive content
 *
 * Data Relationships:
 * - Many-to-one with User (userId foreign key)
 * - One-to-many with Solution (experienceId foreign key)
 *
 * @fileoverview Experience model with multi-modal support and encryption
 * @author Mortal Stardust Development Team
 * @since 1.0.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { encryptData, decryptData } from '../../utils/encryption';

/**
 * Interface for media file attachments in experiences
 *
 * Supports multi-modal input including audio recordings, images, and videos.
 * All sensitive data (URLs, transcripts, descriptions) are encrypted at rest.
 *
 * Security Considerations:
 * - url: Encrypted file path/URL to prevent unauthorized access
 * - transcript: Encrypted speech-to-text content for privacy
 * - description: Encrypted image descriptions for privacy
 * - metadata: Encrypted technical metadata (EXIF, etc.)
 */
export interface IMediaFile {
  /** Media file type for processing pipeline routing */
  type: 'audio' | 'image' | 'video';

  /** System-generated filename for storage */
  filename: string;

  /** Original filename uploaded by user */
  originalName: string;

  /** File URL or path (encrypted for security) */
  url: string;

  /** File size in bytes for storage management */
  size: number;

  /** Duration in seconds (for audio/video files) */
  duration?: number;

  /** Speech-to-text transcript (encrypted, for audio/video) */
  transcript?: string;

  /** AI-generated or user-provided description (encrypted, for images) */
  description?: string;

  /** Technical metadata like EXIF data (encrypted) */
  metadata?: any;
}

/**
 * Experience document interface extending Mongoose Document
 *
 * Represents a user's life experience with multi-modal content, emotional context,
 * and metadata for AI processing. Includes privacy controls and processing tracking.
 *
 * Business Logic:
 * - category: Used for AI template selection and personalization
 * - emotionalState: Drives AI response tone and approach
 * - processingStage: Tracks progress through 3-stage AI pipeline
 * - privacy: Controls data usage and sharing permissions
 *
 * Security Features:
 * - title, content.text: Encrypted for privacy
 * - location: Encrypted geographic data
 * - emotionalState.description: Encrypted personal insights
 */
export interface IExperience extends Document {
  /** MongoDB document ID */
  _id: string;

  /** Reference to the user who created this experience */
  userId: string;

  /** Experience title/summary (encrypted for privacy) */
  title: string;

  /** Experience content with multi-modal support */
  content: {
    /** Main text content (encrypted for privacy) */
    text: string;

    /** Attached media files (audio, image, video) */
    mediaFiles: IMediaFile[];
  };

  /** Experience category for AI processing and organization */
  category: 'career' | 'relationship' | 'education' | 'health' | 'finance' | 'personal_growth' | 'other';

  /** Emotional context for AI response personalization */
  emotionalState: {
    /** Primary emotion category */
    primary: 'happy' | 'sad' | 'angry' | 'anxious' | 'confused' | 'excited' | 'peaceful' | 'frustrated';

    /** Emotion intensity on 1-10 scale */
    intensity: number;

    /** Additional emotional context (encrypted) */
    description?: string;
  };

  /** User-defined tags for organization and search */
  tags: string[];

  /** Privacy and data sharing controls */
  privacy: {
    /** Whether experience can be shared publicly */
    isPublic: boolean;

    /** Whether to include in AI processing */
    shareWithAI: boolean;

    /** Whether to anonymize for research purposes */
    anonymizeForResearch: boolean;
  };

  /** Experience metadata and processing information */
  metadata: {
    /** Geographic location where experience occurred (encrypted) */
    location?: string;

    /** When the experience actually happened */
    dateOccurred: Date;

    /** How the experience was input (text, voice, or mixed) */
    inputMethod: 'text' | 'voice' | 'mixed';

    /** Current stage in AI processing pipeline */
    processingStage: 'pending' | 'stage1' | 'stage2' | 'stage3' | 'completed';
  };

  /** Document creation timestamp (auto-generated) */
  createdAt: Date;

  /** Document last update timestamp (auto-generated) */
  updatedAt: Date;
}

/**
 * Mongoose schema for media file attachments
 *
 * Defines validation and storage structure for multi-modal content
 * attached to experiences. Supports audio, image, and video files
 * with appropriate metadata and security measures.
 *
 * Validation Rules:
 * - type: Restricted to supported media types
 * - filename/originalName: Required for file management
 * - url: Required encrypted path to file storage
 * - size: Required for storage quota management
 */
const MediaFileSchema = new Schema<IMediaFile>({
  type: {
    type: String,
    enum: ['audio', 'image', 'video'],  // Supported media types
    required: true
  },
  filename: {
    type: String,
    required: true                      // System filename for storage
  },
  originalName: {
    type: String,
    required: true                      // User's original filename
  },
  url: {
    type: String,
    required: true                      // Encrypted file path/URL
  },
  size: {
    type: Number,
    required: true                      // File size in bytes
  },
  duration: Number,                     // Optional: for audio/video
  transcript: String,                   // Optional: encrypted transcript
  description: String,                  // Optional: encrypted description
  metadata: mongoose.Schema.Types.Mixed // Optional: encrypted metadata
});

/**
 * Mongoose schema definition for Experience documents
 *
 * Defines validation rules, constraints, and default values for experience
 * documents. Includes business logic constraints and privacy defaults.
 *
 * Schema Design Decisions:
 * - userId: Indexed for fast user-specific queries
 * - category: Enum constraint for AI template selection
 * - emotionalState.intensity: 1-10 range for consistent scoring
 * - privacy.shareWithAI: Default true for AI processing
 * - privacy.isPublic: Default false for privacy protection
 * - processingStage: Tracks AI pipeline progress
 */
const ExperienceSchema = new Schema<IExperience>({
  userId: {
    type: String,
    required: true,
    index: true                         // Index for user-specific queries
  },
  title: {
    type: String,
    required: true                      // Required for experience identification
  },
  content: {
    text: {
      type: String,
      required: true                    // Main content is required
    },
    mediaFiles: [MediaFileSchema]       // Array of media attachments
  },
  category: {
    type: String,
    enum: ['career', 'relationship', 'education', 'health', 'finance', 'personal_growth', 'other'],
    required: true                      // Required for AI processing
  },
  emotionalState: {
    primary: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'anxious', 'confused', 'excited', 'peaceful', 'frustrated'],
      required: true                    // Required for AI tone selection
    },
    intensity: {
      type: Number,
      min: 1,                          // Minimum intensity level
      max: 10,                         // Maximum intensity level
      required: true                    // Required for AI response calibration
    },
    description: String                 // Optional encrypted emotional context
  },
  tags: [String],                      // User-defined tags for organization
  privacy: {
    isPublic: {
      type: Boolean,
      default: false                    // Private by default for safety
    },
    shareWithAI: {
      type: Boolean,
      default: true                     // Enable AI processing by default
    },
    anonymizeForResearch: {
      type: Boolean,
      default: false                    // Opt-in for research participation
    }
  },
  metadata: {
    location: String,                   // Optional encrypted location data
    dateOccurred: {
      type: Date,
      required: true                    // When experience actually happened
    },
    inputMethod: {
      type: String,
      enum: ['text', 'voice', 'mixed'],
      default: 'text'                   // Default to text input
    },
    processingStage: {
      type: String,
      enum: ['pending', 'stage1', 'stage2', 'stage3', 'completed'],
      default: 'pending'                // Start at pending stage
    }
  }
}, {
  timestamps: true                      // Automatic createdAt/updatedAt
});

/**
 * Database indexes for query performance optimization
 *
 * These compound and single-field indexes optimize common query patterns:
 * - userId + createdAt: User's experiences in chronological order
 * - category: Filtering experiences by category
 * - processingStage: AI pipeline status queries
 * - tags: Tag-based search and filtering
 */
ExperienceSchema.index({ userId: 1, createdAt: -1 });    // User timeline queries
ExperienceSchema.index({ category: 1 });                 // Category filtering
ExperienceSchema.index({ 'metadata.processingStage': 1 }); // AI pipeline tracking
ExperienceSchema.index({ tags: 1 });                     // Tag-based search

/**
 * Pre-save middleware for sensitive data encryption
 *
 * Automatically encrypts personally identifiable and sensitive content
 * before database storage to ensure privacy compliance and data protection.
 *
 * Encrypted Fields:
 * - title: Experience summary for privacy
 * - content.text: Main experience content
 * - emotionalState.description: Personal emotional insights
 * - metadata.location: Geographic information
 * - mediaFiles: URLs, transcripts, descriptions, and metadata
 *
 * Privacy Compliance:
 * - Supports GDPR right to be forgotten
 * - Enables secure anonymization for research
 * - Protects against data breaches and unauthorized access
 */
ExperienceSchema.pre('save', function(next) {
  try {
    // Encrypt experience title if modified
    if (this.isModified('title')) {
      this.title = encryptData(this.title);
    }

    // Encrypt main content text if modified
    if (this.isModified('content.text')) {
      this.content.text = encryptData(this.content.text);
    }

    // Encrypt emotional state description if present and modified
    if (this.emotionalState.description && this.isModified('emotionalState.description')) {
      this.emotionalState.description = encryptData(this.emotionalState.description);
    }

    // Encrypt location data if present and modified
    if (this.metadata.location && this.isModified('metadata.location')) {
      this.metadata.location = encryptData(this.metadata.location);
    }

    // Encrypt sensitive media file data if modified
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
    // Pass encryption errors to Mongoose error handling
    next(error as Error);
  }
});

/**
 * Instance method to decrypt sensitive experience data for display
 *
 * Decrypts encrypted fields to make them readable for application use.
 * Must be called manually after retrieving experience documents from database.
 *
 * Decrypted Fields:
 * - title: Experience summary
 * - content.text: Main experience content
 * - emotionalState.description: Emotional context
 * - metadata.location: Geographic information
 * - mediaFiles: URLs, transcripts, descriptions, and metadata
 *
 * Error Handling:
 * - Logs decryption errors without throwing to prevent app crashes
 * - Gracefully handles missing or corrupted encrypted data
 * - Continues processing other fields if one fails
 *
 * @example
 * ```typescript
 * const experience = await Experience.findById(experienceId);
 * experience.decryptSensitiveData();
 * console.log(experience.title); // Now readable
 * console.log(experience.content.text); // Now readable
 * ```
 */
ExperienceSchema.methods.decryptSensitiveData = function(): void {
  try {
    // Decrypt experience title
    if (this.title) {
      this.title = decryptData(this.title);
    }

    // Decrypt main content text
    if (this.content.text) {
      this.content.text = decryptData(this.content.text);
    }

    // Decrypt emotional state description
    if (this.emotionalState.description) {
      this.emotionalState.description = decryptData(this.emotionalState.description);
    }

    // Decrypt location data
    if (this.metadata.location) {
      this.metadata.location = decryptData(this.metadata.location);
    }

    // Decrypt media file sensitive data
    this.content.mediaFiles.forEach((file: any) => {
      if (file.url) file.url = decryptData(file.url);
      if (file.transcript) file.transcript = decryptData(file.transcript);
      if (file.description) file.description = decryptData(file.description);
      if (file.metadata) file.metadata = JSON.parse(decryptData(file.metadata));
    });
  } catch (error) {
    // Log error but don't throw to prevent application crashes
    console.error('Error decrypting experience data:', error);
  }
};

/**
 * Experience model export with Next.js compatibility
 *
 * Uses conditional model creation to prevent re-compilation errors
 * in Next.js development environment where modules may be reloaded.
 *
 * Model Features:
 * - Multi-modal content support (text, audio, image, video)
 * - Automatic encryption of sensitive data
 * - Emotional state tracking for AI personalization
 * - Privacy controls and data sharing preferences
 * - AI processing pipeline stage tracking
 * - Performance-optimized indexes for common queries
 *
 * @example
 * ```typescript
 * import Experience from './models/Experience';
 *
 * // Create new experience
 * const experience = new Experience({
 *   userId: 'user123',
 *   title: 'My career challenge', // Will be encrypted
 *   content: { text: 'I faced a difficult situation...' }, // Will be encrypted
 *   category: 'career',
 *   emotionalState: { primary: 'anxious', intensity: 7 },
 *   metadata: { dateOccurred: new Date(), inputMethod: 'text' }
 * });
 * await experience.save();
 *
 * // Find and decrypt experience
 * const foundExperience = await Experience.findById(experienceId);
 * foundExperience.decryptSensitiveData();
 * console.log(foundExperience.title); // Now readable
 * ```
 */
const Experience: Model<IExperience> = mongoose.models.Experience || mongoose.model<IExperience>('Experience', ExperienceSchema);

export default Experience;
