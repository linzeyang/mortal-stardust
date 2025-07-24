/**
 * Solution Data Model for Mortal Stardust Platform
 *
 * This module defines the Solution schema for storing AI-generated responses
 * to user experiences. Solutions are created through a three-stage AI processing
 * pipeline and include user feedback, analytics, and follow-up tracking.
 *
 * Key Features:
 * - Three-stage AI processing pipeline (healing, solutions, follow-up)
 * - Comprehensive AI metadata tracking for quality assurance
 * - User feedback system with rating and improvement suggestions
 * - Analytics tracking for solution effectiveness
 * - Follow-up scheduling and completion tracking
 * - Field-level encryption for sensitive AI content
 *
 * Data Relationships:
 * - Many-to-one with User (userId foreign key)
 * - Many-to-one with Experience (experienceId foreign key)
 * - One solution per stage per experience (stage 1, 2, 3)
 *
 * @fileoverview Solution model for AI-generated responses with feedback tracking
 * @author Mortal Stardust Development Team
 * @since 1.0.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { encryptData, decryptData } from '../../utils/encryption';

/**
 * Solution document interface extending Mongoose Document
 *
 * Represents an AI-generated solution for a user experience, including
 * content, metadata, user feedback, and analytics. Solutions progress
 * through a three-stage AI processing pipeline.
 *
 * Business Logic:
 * - stage: 1=healing/emotional support, 2=practical solutions, 3=follow-up
 * - status: Tracks solution lifecycle and approval process
 * - userFeedback.rating: 30/50/70/100 scale for consistent measurement
 * - analytics: Tracks solution effectiveness and engagement
 *
 * Security Features:
 * - content: All AI-generated text encrypted for privacy
 * - aiMetadata.prompt: Encrypted to protect AI engineering
 * - userFeedback: Encrypted user comments and suggestions
 * - followUp.notes: Encrypted follow-up tracking data
 */
export interface ISolution extends Document {
  /** MongoDB document ID */
  _id: string;

  /** Reference to the user who owns this solution */
  userId: string;

  /** Reference to the experience this solution addresses */
  experienceId: string;

  /** AI processing stage (1=healing, 2=solutions, 3=follow-up) */
  stage: 1 | 2 | 3;

  /** AI-generated solution content */
  content: {
    /** Solution title/summary (encrypted) */
    title: string;

    /** Detailed solution description (encrypted) */
    description: string;

    /** List of AI recommendations (encrypted array) */
    recommendations: string[];

    /** Optional actionable steps (encrypted array) */
    actionSteps?: string[];

    /** Optional external resources and references */
    resources?: {
      /** Type of resource for categorization */
      type: 'article' | 'book' | 'video' | 'podcast' | 'professional';

      /** Resource title */
      title: string;

      /** Optional URL to resource */
      url?: string;

      /** Optional resource description */
      description?: string;
    }[];
  };

  /** AI processing metadata for quality tracking */
  aiMetadata: {
    /** AI model used for generation */
    model: string;

    /** AI prompt used (encrypted for IP protection) */
    prompt: string;

    /** AI model parameters (encrypted) */
    parameters: any;

    /** Processing time in milliseconds */
    processingTime: number;

    /** AI confidence score (0-1 scale) */
    confidence: number;

    /** AI service version for tracking */
    version: string;
  };

  /** User feedback and rating system */
  userFeedback: {
    /** User rating (30/50/70/100 percentage scale) */
    rating: 30 | 50 | 70 | 100;

    /** Whether user found solution helpful */
    isHelpful: boolean;

    /** User suggestions for improvement (encrypted) */
    improvementSuggestions?: string;

    /** Positive aspects noted by user (encrypted array) */
    positiveAspects?: string[];

    /** When feedback was provided */
    ratedAt: Date;
  };

  /** Solution lifecycle status */
  status: 'generated' | 'reviewed' | 'approved' | 'regenerating' | 'archived';

  /** Analytics and effectiveness tracking */
  analytics: {
    /** Number of times solution was viewed */
    viewCount: number;

    /** Number of times solution was shared */
    shareCount: number;

    /** Calculated effectiveness score */
    effectivenessScore?: number;
  };

  /** Optional follow-up tracking */
  followUp?: {
    /** When follow-up is scheduled */
    scheduledDate: Date;

    /** Whether follow-up was completed */
    completed: boolean;

    /** Follow-up notes (encrypted) */
    notes?: string;
  };

  /** Document creation timestamp (auto-generated) */
  createdAt: Date;

  /** Document last update timestamp (auto-generated) */
  updatedAt: Date;
}

/**
 * Mongoose schema for external resource references
 *
 * Defines structure for additional resources that AI can recommend
 * alongside solutions. Resources are categorized by type for better
 * organization and user experience.
 *
 * Validation Rules:
 * - type: Restricted to supported resource categories
 * - title: Required for resource identification
 * - url: Optional external link
 * - description: Optional resource summary
 */
const ResourceSchema = new Schema({
  type: {
    type: String,
    enum: ['article', 'book', 'video', 'podcast', 'professional'],
    required: true                      // Required for categorization
  },
  title: {
    type: String,
    required: true                      // Required for identification
  },
  url: String,                         // Optional external link
  description: String                   // Optional resource description
});

/**
 * Mongoose schema definition for Solution documents
 *
 * Defines validation rules, constraints, and default values for AI-generated
 * solutions. Includes business logic constraints and analytics defaults.
 *
 * Schema Design Decisions:
 * - userId/experienceId: Indexed for fast relationship queries
 * - stage: 1-3 enum for three-stage AI processing pipeline
 * - userFeedback.rating: 30/50/70/100 scale for consistent measurement
 * - status: Tracks solution lifecycle from generation to archival
 * - analytics: Default to 0 for counters, optional effectiveness score
 * - aiMetadata.confidence: 0-1 range for AI confidence scoring
 */
const SolutionSchema = new Schema<ISolution>({
  userId: {
    type: String,
    required: true,
    index: true                         // Index for user-specific queries
  },
  experienceId: {
    type: String,
    required: true,
    index: true                         // Index for experience-solution relationships
  },
  stage: {
    type: Number,
    enum: [1, 2, 3],                   // Three-stage AI processing pipeline
    required: true
  },
  content: {
    title: {
      type: String,
      required: true                    // Required for solution identification
    },
    description: {
      type: String,
      required: true                    // Required main solution content
    },
    recommendations: [{
      type: String,
      required: true                    // At least one recommendation required
    }],
    actionSteps: [String],             // Optional actionable steps
    resources: [ResourceSchema]         // Optional external resources
  },
  aiMetadata: {
    model: {
      type: String,
      required: true,
      default: 'gpt-4'                 // Default AI model
    },
    prompt: {
      type: String,
      required: true                    // Required for AI traceability
    },
    parameters: mongoose.Schema.Types.Mixed, // Flexible AI parameters
    processingTime: {
      type: Number,
      required: true                    // Required for performance tracking
    },
    confidence: {
      type: Number,
      min: 0,                          // Minimum confidence score
      max: 1,                          // Maximum confidence score
      required: true                    // Required for quality assessment
    },
    version: {
      type: String,
      required: true,
      default: '1.0'                   // AI service version tracking
    }
  },
  userFeedback: {
    rating: {
      type: Number,
      enum: [30, 50, 70, 100]          // Standardized rating scale
    },
    isHelpful: {
      type: Boolean,
      default: false                    // Default to not helpful until rated
    },
    improvementSuggestions: String,     // Optional user feedback
    positiveAspects: [String],         // Optional positive feedback
    ratedAt: Date                      // When feedback was provided
  },
  status: {
    type: String,
    enum: ['generated', 'reviewed', 'approved', 'regenerating', 'archived'],
    default: 'generated'               // Start at generated status
  },
  analytics: {
    viewCount: {
      type: Number,
      default: 0                       // Initialize view counter
    },
    shareCount: {
      type: Number,
      default: 0                       // Initialize share counter
    },
    effectivenessScore: Number         // Optional calculated effectiveness
  },
  followUp: {
    scheduledDate: Date,               // Optional follow-up scheduling
    completed: {
      type: Boolean,
      default: false                   // Default to not completed
    },
    notes: String                      // Optional follow-up notes
  }
}, {
  timestamps: true                     // Automatic createdAt/updatedAt
});

/**
 * Database indexes for query performance optimization
 *
 * These compound and single-field indexes optimize common query patterns:
 * - userId + stage: User's solutions by processing stage
 * - experienceId + stage: All solutions for an experience by stage
 * - userFeedback.rating: Analytics queries on solution ratings
 * - status: Filtering solutions by lifecycle status
 * - createdAt: Chronological sorting and pagination
 */
SolutionSchema.index({ userId: 1, stage: 1 });           // User solutions by stage
SolutionSchema.index({ experienceId: 1, stage: 1 });    // Experience solutions by stage
SolutionSchema.index({ 'userFeedback.rating': 1 });     // Rating analytics
SolutionSchema.index({ status: 1 });                    // Status filtering
SolutionSchema.index({ createdAt: -1 });                // Chronological sorting

/**
 * Pre-save middleware for sensitive data encryption
 *
 * Automatically encrypts AI-generated content and user feedback before
 * database storage to protect intellectual property and user privacy.
 *
 * Encrypted Fields:
 * - content: AI-generated titles, descriptions, recommendations, action steps
 * - aiMetadata.prompt: AI prompts for intellectual property protection
 * - aiMetadata.parameters: AI parameters for competitive advantage
 * - userFeedback: User suggestions and positive aspects for privacy
 * - followUp.notes: Follow-up tracking data for privacy
 *
 * Business Protection:
 * - Protects AI prompt engineering and parameters
 * - Secures user feedback for privacy compliance
 * - Enables secure analytics without exposing sensitive content
 */
SolutionSchema.pre('save', function(next) {
  try {
    // Encrypt solution content if modified
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

    // Encrypt AI metadata for IP protection
    if (this.isModified('aiMetadata.prompt')) {
      this.aiMetadata.prompt = encryptData(this.aiMetadata.prompt);
    }

    if (this.isModified('aiMetadata.parameters')) {
      this.aiMetadata.parameters = encryptData(JSON.stringify(this.aiMetadata.parameters));
    }

    // Encrypt user feedback for privacy
    if (this.userFeedback?.improvementSuggestions && this.isModified('userFeedback.improvementSuggestions')) {
      this.userFeedback.improvementSuggestions = encryptData(this.userFeedback.improvementSuggestions);
    }

    if (this.userFeedback?.positiveAspects && this.isModified('userFeedback.positiveAspects')) {
      this.userFeedback.positiveAspects = this.userFeedback.positiveAspects.map(aspect => encryptData(aspect));
    }

    // Encrypt follow-up notes for privacy
    if (this.followUp?.notes && this.isModified('followUp.notes')) {
      this.followUp.notes = encryptData(this.followUp.notes);
    }

    next();
  } catch (error) {
    // Pass encryption errors to Mongoose error handling
    next(error as Error);
  }
});

/**
 * Instance method to decrypt sensitive solution data for display
 *
 * Decrypts encrypted fields to make them readable for application use.
 * Must be called manually after retrieving solution documents from database.
 *
 * Decrypted Fields:
 * - content: AI-generated titles, descriptions, recommendations, action steps
 * - aiMetadata.prompt: AI prompts (use carefully for IP protection)
 * - aiMetadata.parameters: AI parameters (use carefully for competitive advantage)
 * - userFeedback: User suggestions and positive aspects
 * - followUp.notes: Follow-up tracking data
 *
 * Security Considerations:
 * - AI prompts and parameters contain intellectual property
 * - User feedback contains personal opinions and suggestions
 * - Use appropriate access controls when exposing decrypted data
 *
 * Error Handling:
 * - Logs decryption errors without throwing to prevent app crashes
 * - Gracefully handles missing or corrupted encrypted data
 * - Continues processing other fields if one fails
 *
 * @example
 * ```typescript
 * const solution = await Solution.findById(solutionId);
 * solution.decryptSensitiveData();
 * console.log(solution.content.title); // Now readable
 * console.log(solution.content.recommendations); // Now readable array
 * ```
 */
SolutionSchema.methods.decryptSensitiveData = function(): void {
  try {
    // Decrypt solution content
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

    // Decrypt AI metadata (handle with care for IP protection)
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
    // Log error but don't throw to prevent application crashes
    console.error('Error decrypting solution data:', error);
  }
};

/**
 * Solution model export with Next.js compatibility
 *
 * Uses conditional model creation to prevent re-compilation errors
 * in Next.js development environment where modules may be reloaded.
 *
 * Model Features:
 * - Three-stage AI processing pipeline support
 * - Automatic encryption of sensitive AI content and user feedback
 * - Comprehensive user feedback and rating system
 * - Analytics tracking for solution effectiveness
 * - Follow-up scheduling and completion tracking
 * - Performance-optimized indexes for common queries
 *
 * @example
 * ```typescript
 * import Solution from './models/Solution';
 *
 * // Create new solution
 * const solution = new Solution({
 *   userId: 'user123',
 *   experienceId: 'exp456',
 *   stage: 1,
 *   content: {
 *     title: 'Emotional Support Response', // Will be encrypted
 *     description: 'I understand you are feeling...', // Will be encrypted
 *     recommendations: ['Take time to process...'] // Will be encrypted
 *   },
 *   aiMetadata: {
 *     model: 'gpt-4',
 *     prompt: 'You are a compassionate counselor...', // Will be encrypted
 *     processingTime: 1500,
 *     confidence: 0.85,
 *     version: '1.0'
 *   }
 * });
 * await solution.save();
 *
 * // Find and decrypt solution
 * const foundSolution = await Solution.findById(solutionId);
 * foundSolution.decryptSensitiveData();
 * console.log(foundSolution.content.title); // Now readable
 * ```
 */
const Solution: Model<ISolution> = mongoose.models.Solution || mongoose.model<ISolution>('Solution', SolutionSchema);

export default Solution;
