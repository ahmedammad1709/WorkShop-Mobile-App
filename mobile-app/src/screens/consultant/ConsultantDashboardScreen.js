import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, spacing, borderRadius, commonStyles, fontSize, fontWeight } from '../../utils/styles';
import { clearUserData } from '../../utils/storage';
import { useNavigation } from '@react-navigation/native';

export default function ConsultantDashboardScreen() {
  const navigation = useNavigation();

  async function logout() {
    await clearUserData();
    if (typeof global !== 'undefined' && typeof global.updateAuthState === 'function') {
      await global.updateAuthState();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  return (
    <View style={[commonStyles.container, styles.container]}>
      <Text style={styles.title}>Consultant Dashboard</Text>
      <Text style={styles.subtitle}>This screen will mirror the web ConsultantDashboard UI.</Text>
      <TouchableOpacity style={commonStyles.button} onPress={logout}>
        <Text style={commonStyles.buttonText}>Logout</Text>
      </TouchableOpacity>
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