/**
 * APP COLORS & TYPOGRAPHY CONFIGURATION
 * This file centralizes the visual theme for all 5 roles in the ecosystem.
 * Brand Identity: 
 * - School: Indigo (#4f46e5)
 * - Shop: Emerald (#059669) 
 * - Student: Blue (#1e40af)
 * - Admin: Navy (#0f172a)
 * - Normal User: Violet (#6366f1)
 */

import { Platform } from 'react-native';

// Standard Brand Base Colors
const brandSchool = '#4f46e5';
const brandShop = '#059669';
const brandAdmin = '#0f172a';
const brandStudent = '#1e40af';
const brandUser = '#6366f1';

const error = '#ef4444';
const success = '#10b981';
const warning = '#f59e0b';

export const Colors = {
  light: {
    // General UI
    text: '#1e293b', // Slate 800
    background: '#f8fafc', // Slate 50
    tint: brandSchool,
    icon: '#64748b', // Slate 500
    tabIconDefault: '#94a3b8',
    tabIconSelected: brandSchool,
    card: '#ffffff',
    border: '#e2e8f0',

    // Role Specific Branding
    schoolPrimary: brandSchool,
    shopPrimary: brandShop,
    adminPrimary: brandAdmin,
    studentPrimary: brandStudent,
    userPrimary: brandUser,

    // Functional Colors
    error: error,
    success: success,
    warning: warning,
    surface: '#ffffff',
  },
  dark: {
    // General UI
    text: '#f1f5f9', // Slate 100
    background: '#020617', // Slate 950 (Deep Navy)
    tint: '#fff',
    icon: '#94a3b8',
    tabIconDefault: '#475569',
    tabIconSelected: '#fff',
    card: '#0f172a', // Slate 900
    border: '#1e293b',

    // Role Specific Branding (Lighter versions for dark mode)
    schoolPrimary: '#818cf8',
    shopPrimary: '#34d399',
    adminPrimary: '#1e293b',
    studentPrimary: '#60a5fa',
    userPrimary: '#a5b4fc',

    // Functional Colors
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    surface: '#1e293b',
  },
};

export const Fonts = {
  family: Platform.select({
    ios: {
      regular: 'System',
      bold: 'System',
      semiBold: 'System',
      medium: 'System',
    },
    android: {
      regular: 'sans-serif',
      bold: 'sans-serif-condensed',
      semiBold: 'sans-serif-medium',
      medium: 'sans-serif-medium',
    },
    default: {
      regular: 'normal',
      bold: 'bold',
      semiBold: 'normal',
    },
  }),
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '900' as const,
  }
};

/**
 * UTILITY: Get Theme based on Role
 * Useful for dynamic components that need to change color based on logged-in user.
 */
export const getRoleColor = (role: string | undefined) => {
  switch (role) {
    case 'school': return brandSchool;
    case 'shop': return brandShop;
    case 'admin': return brandAdmin;
    case 'student': return brandStudent;
    case 'user': return brandUser;
    default: return brandUser;
  }
};