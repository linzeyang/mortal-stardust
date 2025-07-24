import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getSession } from './session';

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session) return null;

    await connectDB();
    
    const user = await User.findById(session.user.id);
    if (!user) return null;

    // Decrypt sensitive data for display
    user.decryptSensitiveData();

    return {
      id: user._id.toString(),
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.profile.role,
      avatar: user.profile.avatar,
      phoneNumber: user.profile.phoneNumber,
      dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
      preferences: user.preferences,
      security: {
        twoFactorEnabled: user.security.twoFactorEnabled,
        lastLogin: user.security.lastLogin?.toISOString() || null
      },
      createdAt: user.createdAt?.toISOString() || null,
      updatedAt: user.updatedAt?.toISOString() || null
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserById(userId: string) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) return null;

    // Decrypt sensitive data for display
    user.decryptSensitiveData();

    return {
      id: user._id.toString(),
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.profile.role,
      avatar: user.profile.avatar,
      phoneNumber: user.profile.phoneNumber,
      dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
      preferences: user.preferences,
      security: {
        twoFactorEnabled: user.security.twoFactorEnabled,
        lastLogin: user.security.lastLogin?.toISOString() || null
      },
      createdAt: user.createdAt?.toISOString() || null,
      updatedAt: user.updatedAt?.toISOString() || null
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    if (!user) return null;

    // Update profile fields
    if (updates.firstName) user.profile.firstName = updates.firstName;
    if (updates.lastName) user.profile.lastName = updates.lastName;
    if (updates.role) user.profile.role = updates.role;
    if (updates.avatar) user.profile.avatar = updates.avatar;
    if (updates.phoneNumber) user.profile.phoneNumber = updates.phoneNumber;
    if (updates.dateOfBirth) user.profile.dateOfBirth = updates.dateOfBirth;

    // Update preferences
    if (updates.preferences) {
      Object.assign(user.preferences, updates.preferences);
    }

    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.profile.role,
      avatar: user.profile.avatar,
      preferences: user.preferences,
      updatedAt: user.updatedAt?.toISOString() || null
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}