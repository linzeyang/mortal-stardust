import mongoose, { Schema, Document, Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { encryptData, decryptData } from '../../utils/encryption';

export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName: string;
    role: 'workplace_newcomer' | 'entrepreneur' | 'student' | 'other';
    avatar?: string;
    phoneNumber?: string; // Encrypted
    dateOfBirth?: Date; // Encrypted
  };
  preferences: {
    language: string;
    notifications: boolean;
    dataSharing: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    lastLogin: Date;
    loginAttempts: number;
    lockUntil?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  encryptSensitiveData(): void;
  decryptSensitiveData(): void;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['workplace_newcomer', 'entrepreneur', 'student', 'other'],
      required: true
    },
    avatar: String,
    phoneNumber: String, // Will be encrypted
    dateOfBirth: Date // Will be encrypted
  },
  preferences: {
    language: {
      type: String,
      default: 'zh-CN'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    dataSharing: {
      type: Boolean,
      default: false
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  }
}, {
  timestamps: true
});

// Email index is already created by unique: true, so we don't need an additional index
UserSchema.index({ 'profile.role': 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(12);
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Encrypt sensitive data before saving
UserSchema.pre('save', function(next) {
  try {
    if (this.profile.phoneNumber && this.isModified('profile.phoneNumber')) {
      this.profile.phoneNumber = encryptData(this.profile.phoneNumber);
    }
    
    if (this.profile.dateOfBirth && this.isModified('profile.dateOfBirth')) {
      this.profile.dateOfBirth = encryptData(this.profile.dateOfBirth.toISOString()) as any;
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcryptjs.compare(candidatePassword, this.passwordHash);
};

// Decrypt sensitive data method
UserSchema.methods.decryptSensitiveData = function(): void {
  try {
    if (this.profile.phoneNumber) {
      this.profile.phoneNumber = decryptData(this.profile.phoneNumber);
    }
    
    if (this.profile.dateOfBirth && typeof this.profile.dateOfBirth === 'string') {
      this.profile.dateOfBirth = new Date(decryptData(this.profile.dateOfBirth));
    }
  } catch (error) {
    console.error('Error decrypting user data:', error);
  }
};

// Export model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;