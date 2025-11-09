import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import logo from '../../assets/logo.png';
import showPasswordIcon from '../../assets/showpassword.png';
import hidePasswordIcon from '../../assets/hidePassword.png';
import { COLORS, spacing, borderRadius, fontSize, fontWeight, shadow, commonStyles } from '../../utils/styles';
import { authAPI } from '../../utils/api';
import { setUserEmail, setUserRole } from '../../utils/storage';

export default function LoginScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const roleParam = (route.params?.role || '').toLowerCase();
  const roleLabel = roleParam ? roleParam.charAt(0).toUpperCase() + roleParam.slice(1) : '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onTogglePassword = () => setShowPassword((p) => !p);

  async function handleLogin() {
    setError('');
    setSubmitting(true);
    try {
      const { ok, data } = await authAPI.login(email, password, roleParam);

      // Handle banned user
      if (data?.isBanned) {
        Alert.alert('Account Banned', 'Your account is banned. Please contact support.');
        setSubmitting(false);
        return;
      }

      if (!ok) throw new Error(data?.message || 'Login failed');

      // Persist user info
      await setUserEmail(email);
      await setUserRole(roleParam);

      // Update auth state and navigate
      if (typeof global !== 'undefined' && typeof global.updateAuthState === 'function') {
        await global.updateAuthState();
      }

      // Role-based redirect into MainNavigator (nested state)
      let targetScreen = 'AdminDashboard';
      switch (roleParam) {
        case 'contractor':
          targetScreen = 'ContractorDashboard';
          break;
        case 'technician':
          targetScreen = 'TechnicianDashboard';
          break;
        case 'supplier':
          targetScreen = 'SupplierDashboard';
          break;
        case 'consultant':
          targetScreen = 'ConsultantDashboard';
          break;
        case 'admin':
          targetScreen = 'AdminDashboard';
          break;
        default:
          // If role is unknown, send back to selection
          navigation.navigate('LoginSelection');
          setSubmitting(false);
          return;
      }

      // AppNavigator will re-render to Main based on auth state; MainNavigator
      // receives userRole and opens the correct dashboard synchronously.
      Alert.alert('Login successful');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function goToForgotPassword() {
    navigation.navigate('ForgotPassword');
  }

  function goToSignup() {
    navigation.navigate('Signup', { role: roleParam });
  }

  return (
    <KeyboardAvoidingView
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.heading}>Login As {roleLabel}</Text>
          <Text style={styles.subtitle}>Enter your credentials to continue.</Text>

          {!!error && <Text style={commonStyles.errorText}>{error}</Text>}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              style={commonStyles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                style={[commonStyles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={onTogglePassword} style={styles.iconButton}>
                <Image
                  source={showPassword ? hidePasswordIcon : showPasswordIcon}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[commonStyles.button, submitting && commonStyles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            <Text style={commonStyles.buttonText}>{submitting ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={goToForgotPassword}>
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToSignup}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: COLORS.background,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.md,
  },
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    ...commonStyles.heading,
    textAlign: 'center',
  },
  subtitle: {
    ...commonStyles.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: COLORS.textSecondary,
  },
  linksRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: COLORS.primary,
    fontWeight: fontWeight.medium,
  },
});