// Common style utilities
// Helps convert Tailwind-like classes to React Native StyleSheet
import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/config';

// Re-export COLORS for convenience
export { COLORS };

const { width, height } = Dimensions.get('window');

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Common border radius
export const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
};

// Font sizes (approximate Tailwind equivalents)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Font weights
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Common shadow styles
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Common flex utilities
export const flex = {
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  between: {
    justifyContent: 'space-between',
  },
  around: {
    justifyContent: 'space-around',
  },
  wrap: {
    flexWrap: 'wrap',
  },
};

// Screen dimensions
export const screenWidth = width;
export const screenHeight = height;

// Common component styles
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.sm,
    backgroundColor: COLORS.white,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  text: {
    color: COLORS.text,
    fontSize: fontSize.base,
  },
  textSecondary: {
    color: COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
  heading: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontSize.sm,
  },
  successText: {
    color: COLORS.success,
    fontSize: fontSize.sm,
  },
});

