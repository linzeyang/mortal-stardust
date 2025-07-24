/**
 * Core Utility Functions
 *
 * This module provides essential utility functions used throughout the application.
 * Currently focused on CSS class name management for Tailwind CSS integration
 * with shadcn/ui components.
 *
 * The utilities here help maintain consistent styling and provide type-safe
 * class name composition for React components.
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names intelligently
 *
 * This utility function combines multiple class name inputs and resolves
 * Tailwind CSS conflicts by merging conflicting classes. It's essential
 * for building flexible, reusable components with conditional styling.
 *
 * The function uses:
 * - `clsx` for conditional class name composition
 * - `twMerge` for intelligent Tailwind CSS class conflict resolution
 *
 * @param inputs - Variable number of class name inputs (strings, objects, arrays)
 * @returns Merged and optimized class name string
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500', 'text-white')
 * // Returns: "px-4 py-2 bg-blue-500 text-white"
 *
 * // Conditional classes
 * cn('base-class', {
 *   'active-class': isActive,
 *   'disabled-class': isDisabled
 * })
 *
 * // Tailwind conflict resolution
 * cn('px-4 px-6', 'py-2 py-4')
 * // Returns: "px-6 py-4" (later classes override earlier ones)
 *
 * // Component usage
 * <Button className={cn(
 *   'px-4 py-2 rounded',
 *   variant === 'primary' && 'bg-blue-500 text-white',
 *   variant === 'secondary' && 'bg-gray-200 text-gray-800',
 *   disabled && 'opacity-50 cursor-not-allowed',
 *   className // Allow external class overrides
 * )}>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
