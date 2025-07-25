/**
 * @fileoverview Settings Context Provider
 *
 * A React context provider that manages global settings state including user profile,
 * notification preferences, privacy settings, security configuration, and UI preferences.
 * This context provides centralized settings management with API integration and error handling.
 *
 * Key Features:
 * - Centralized state management for all user settings
 * - API integration with loading states and error handling
 * - Form state management with unsaved changes tracking
 * - Real-time updates with optimistic UI updates
 * - Type-safe settings context with TypeScript interfaces
 *
 * Settings Categories:
 * - Profile: Personal information, avatar, contact details
 * - Notifications: Communication preferences and timing
 * - Privacy: Data sharing and retention settings
 * - Security: Password, 2FA, and session management
 * - Preferences: Theme, language, and AI assistant settings
 *
 * Dependencies:
 * - React context API for global state management
 * - SWR for data fetching and caching
 * - Custom API client for settings operations
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';

// Type definitions for settings data structures
export type UserRole = 'student' | 'workplace_newcomer' | 'entrepreneur' | 'other';

export interface UserProfile {
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  bio?: string;
}

export interface NotificationPreferences {
  aiSolutionComplete: boolean;
  emailReminders: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  featureUpdates: boolean;
  morningTime: string;
  eveningTime: string;
}

export interface PrivacySettings {
  dataSharing: boolean;
  personalizedRecommendations: boolean;
  marketingCommunications: boolean;
  thirdPartyIntegrations: boolean;
  dataRetentionPeriod: 'never' | '1year' | '2years' | '5years';
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: Date;
  sessionTimeout: number;
}

export interface UIPreferences {
  theme: string;
  language: string;
  dateFormat: string;
  timezone: string;
  aiAssistantStyle: string;
  detailedAnalysis: boolean;
  quickResponse: boolean;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  current: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // ISO string from API
  preferences: {
    language: string;
    notifications: boolean;
    dataSharing: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    lastLogin?: string | null; // ISO string from API
  };
  createdAt?: string; // ISO string from API
  updatedAt?: string; // ISO string from API
}

// Loading states for different settings sections
export interface LoadingStates {
  profile: boolean;
  notifications: boolean;
  privacy: boolean;
  security: boolean;
  preferences: boolean;
  sessions: boolean;
}

// Error states for different settings sections
export interface ErrorStates {
  profile?: string;
  notifications?: string;
  privacy?: string;
  security?: string;
  preferences?: string;
  sessions?: string;
}

// Settings context interface
interface SettingsContextType {
  // Data
  user: User | null;
  loading: LoadingStates;
  errors: ErrorStates;
  unsavedChanges: boolean;

  // Profile methods
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;

  // Notification methods
  updateNotifications: (data: Partial<NotificationPreferences>) => Promise<void>;

  // Privacy methods
  updatePrivacy: (data: Partial<PrivacySettings>) => Promise<void>;
  requestDataDeletion: () => Promise<void>;

  // Security methods
  updateSecurity: (data: Partial<SecuritySettings>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  toggleTwoFactor: (enable: boolean) => Promise<void>;
  terminateSession: (sessionId: string) => Promise<void>;
  terminateAllSessions: () => Promise<void>;

  // Preferences methods
  updatePreferences: (data: Partial<UIPreferences>) => Promise<void>;

  // Utility methods
  refreshData: () => Promise<void>;
  resetChanges: () => void;
  clearErrors: () => void;
}

// API client for settings operations
class SettingsAPI {
  static async getProfile(): Promise<User> {
    const response = await fetch('/api/user');
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }
    return response.json();
  }

  static async updateProfile(data: any): Promise<void> {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  static async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    const result = await response.json();
    return result.url;
  }

  static async updateNotifications(data: Partial<NotificationPreferences>): Promise<void> {
    const response = await fetch('/api/settings/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to update notification settings');
    }
  }

  static async updatePrivacy(data: Partial<PrivacySettings>): Promise<void> {
    const response = await fetch('/api/settings/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to update privacy settings');
    }
  }

  static async updateSecurity(data: Partial<SecuritySettings>): Promise<void> {
    const response = await fetch('/api/settings/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to update security settings');
    }
  }

  static async updatePreferences(data: Partial<UIPreferences>): Promise<void> {
    const response = await fetch('/api/settings/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
  }

  static async getSessions(): Promise<Session[]> {
    const response = await fetch('/api/settings/sessions');
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    return response.json();
  }

  static async terminateSession(sessionId: string): Promise<void> {
    const response = await fetch(`/api/settings/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to terminate session');
    }
  }
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Settings provider component
interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // State management
  const [loading, setLoading] = useState<LoadingStates>({
    profile: false,
    notifications: false,
    privacy: false,
    security: false,
    preferences: false,
    sessions: false
  });

  const [errors, setErrors] = useState<ErrorStates>({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Fetch user data with SWR
  const { data: user, error, mutate: mutateUser } = useSWR<User>('/api/user', SettingsAPI.getProfile);

  // Helper function to update loading state
  const setLoadingState = useCallback((section: keyof LoadingStates, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [section]: isLoading }));
  }, []);

  // Helper function to set error state
  const setErrorState = useCallback((section: keyof ErrorStates, error?: string) => {
    setErrors(prev => ({ ...prev, [section]: error }));
  }, []);

  // Profile methods
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    setLoadingState('profile', true);
    setErrorState('profile');

    try {
      await SettingsAPI.updateProfile(data);
      await mutateUser(); // Refresh user data
      setUnsavedChanges(false);
    } catch (error) {
      setErrorState('profile', error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    } finally {
      setLoadingState('profile', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  const uploadAvatar = useCallback(async (file: File) => {
    setLoadingState('profile', true);
    setErrorState('profile');

    try {
      const avatarUrl = await SettingsAPI.uploadAvatar(file);
      await updateProfile({ avatar: avatarUrl });
    } catch (error) {
      setErrorState('profile', error instanceof Error ? error.message : 'Failed to upload avatar');
      throw error;
    } finally {
      setLoadingState('profile', false);
    }
  }, [updateProfile, setLoadingState, setErrorState]);

  // Notification methods
  const updateNotifications = useCallback(async (data: Partial<NotificationPreferences>) => {
    setLoadingState('notifications', true);
    setErrorState('notifications');

    try {
      await SettingsAPI.updateNotifications(data);
      await mutateUser();
      setUnsavedChanges(false);
    } catch (error) {
      setErrorState('notifications', error instanceof Error ? error.message : 'Failed to update notifications');
      throw error;
    } finally {
      setLoadingState('notifications', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  // Privacy methods
  const updatePrivacy = useCallback(async (data: Partial<PrivacySettings>) => {
    setLoadingState('privacy', true);
    setErrorState('privacy');

    try {
      await SettingsAPI.updatePrivacy(data);
      await mutateUser();
      setUnsavedChanges(false);
    } catch (error) {
      setErrorState('privacy', error instanceof Error ? error.message : 'Failed to update privacy settings');
      throw error;
    } finally {
      setLoadingState('privacy', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  const requestDataDeletion = useCallback(async () => {
    setLoadingState('privacy', true);
    setErrorState('privacy');

    try {
      const response = await fetch('/api/settings/delete-data', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to delete data');
      }
      // User will be logged out after data deletion
    } catch (error) {
      setErrorState('privacy', error instanceof Error ? error.message : 'Failed to delete data');
      throw error;
    } finally {
      setLoadingState('privacy', false);
    }
  }, [setLoadingState, setErrorState]);

  // Security methods
  const updateSecurity = useCallback(async (data: Partial<SecuritySettings>) => {
    setLoadingState('security', true);
    setErrorState('security');

    try {
      await SettingsAPI.updateSecurity(data);
      await mutateUser();
      setUnsavedChanges(false);
    } catch (error) {
      setErrorState('security', error instanceof Error ? error.message : 'Failed to update security settings');
      throw error;
    } finally {
      setLoadingState('security', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setLoadingState('security', true);
    setErrorState('security');

    try {
      await SettingsAPI.changePassword(currentPassword, newPassword);
      await mutateUser();
    } catch (error) {
      setErrorState('security', error instanceof Error ? error.message : 'Failed to change password');
      throw error;
    } finally {
      setLoadingState('security', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  const toggleTwoFactor = useCallback(async (enable: boolean) => {
    setLoadingState('security', true);
    setErrorState('security');

    try {
      const response = await fetch('/api/auth/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle 2FA');
      }

      await mutateUser();
    } catch (error) {
      setErrorState('security', error instanceof Error ? error.message : 'Failed to toggle 2FA');
      throw error;
    } finally {
      setLoadingState('security', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  const terminateSession = useCallback(async (sessionId: string) => {
    setLoadingState('sessions', true);
    setErrorState('sessions');

    try {
      await SettingsAPI.terminateSession(sessionId);
      await mutateUser();
    } catch (error) {
      setErrorState('sessions', error instanceof Error ? error.message : 'Failed to terminate session');
      throw error;
    } finally {
      setLoadingState('sessions', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  const terminateAllSessions = useCallback(async () => {
    setLoadingState('sessions', true);
    setErrorState('sessions');

    try {
      const response = await fetch('/api/settings/sessions/terminate-all', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to terminate all sessions');
      }

      await mutateUser();
    } catch (error) {
      setErrorState('sessions', error instanceof Error ? error.message : 'Failed to terminate sessions');
      throw error;
    } finally {
      setLoadingState('sessions', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  // Preferences methods
  const updatePreferences = useCallback(async (data: Partial<UIPreferences>) => {
    setLoadingState('preferences', true);
    setErrorState('preferences');

    try {
      await SettingsAPI.updatePreferences(data);
      await mutateUser();
      setUnsavedChanges(false);
    } catch (error) {
      setErrorState('preferences', error instanceof Error ? error.message : 'Failed to update preferences');
      throw error;
    } finally {
      setLoadingState('preferences', false);
    }
  }, [mutateUser, setLoadingState, setErrorState]);

  // Utility methods
  const refreshData = useCallback(async () => {
    await mutateUser();
  }, [mutateUser]);

  const resetChanges = useCallback(() => {
    setUnsavedChanges(false);
    setErrors({});
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Context value
  const contextValue: SettingsContextType = {
    user: user || null,
    loading,
    errors,
    unsavedChanges,

    updateProfile,
    uploadAvatar,

    updateNotifications,

    updatePrivacy,
    requestDataDeletion,

    updateSecurity,
    changePassword,
    toggleTwoFactor,
    terminateSession,
    terminateAllSessions,

    updatePreferences,

    refreshData,
    resetChanges,
    clearErrors
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
