import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, spacing, commonStyles, fontSize, fontWeight } from '../../utils/styles';

export default function UserManagementScreen() {
  return (
    <View style={[commonStyles.container, styles.container]}>
      <Text style={styles.title}>User Management</Text>
      <Text style={styles.subtitle}>This will adapt DynamicUserManagement from the web app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textSecondary,
  },
});