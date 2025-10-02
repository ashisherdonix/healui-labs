// PhysioHub Theme Configuration
export const theme = {
  colors: {
    // Primary theme colors
    primary: {
      50: '#eff8ff',    // Light blue background
      100: '#c9ebeb',   // Teal accent
      600: '#145e7a',   // Dark blue
      700: '#0f4c61',   // Darker blue
      900: '#000000',   // Black
    },
    // Complementary colors that match the theme
    secondary: {
      50: '#f0fdfa',    // Very light teal
      100: '#ccfbf1',   // Light teal
      200: '#99f6e4',   // Medium teal
      300: '#5eead4',   // Bright teal
      400: '#2dd4bf',   // Vibrant teal
      500: '#14b8a6',   // Strong teal
      600: '#0f766e',   // Deep teal
      700: '#0d5d56',   // Darker teal
      800: '#134e4a',   // Very dark teal
      900: '#042f2e',   // Almost black teal
    },
    // Gray scale matching the theme
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Status colors that complement the theme
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#eff8ff',
      100: '#c9ebeb',
      500: '#145e7a',
      600: '#0f4c61',
      700: '#0a3a48',
    }
  },
  
  // Category colors matching the theme
  categories: {
    muscles: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      accent: '#dc2626',
    },
    joints: {
      bg: '#eff8ff',
      border: '#c9ebeb',
      text: '#145e7a',
      accent: '#0f4c61',
    },
    ligaments: {
      bg: '#ecfdf5',
      border: '#bbf7d0',
      text: '#047857',
      accent: '#059669',
    },
    tendons: {
      bg: '#fff7ed',
      border: '#fed7aa',
      text: '#c2410c',
      accent: '#ea580c',
    },
    neural: {
      bg: '#faf5ff',
      border: '#e9d5ff',
      text: '#7c2d12',
      accent: '#9333ea',
    },
    exercises: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      accent: '#d97706',
    }
  },

  // Shadow variations
  shadows: {
    primary: 'shadow-[#145e7a]/10',
    secondary: 'shadow-[#c9ebeb]/20',
    dark: 'shadow-black/10',
  }
}

// Utility functions for theme usage
export const getThemeColor = (path: string) => {
  return path.split('.').reduce((obj: any, key) => obj?.[key], theme.colors)
}

export const getCategoryTheme = (category: string) => {
  return theme.categories[category as keyof typeof theme.categories] || theme.categories.joints
}