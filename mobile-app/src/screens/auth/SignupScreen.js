import React, { useEffect, useMemo, useState } from 'react';
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

export default function SignupScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const roleParam = (route.params?.role || '').toLowerCase();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState(roleParam || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');

  const togglePassword = () => setShowPassword((p) => !p);

  async function submitSignup() {
    setError('');
    setSubmitting(true);
    try {
      const { ok, data } = await authAPI.requestOTP(name, email, password, userType);
      if (!ok) throw new Error(data?.message || 'Signup failed');
      setOtpModalOpen(true);
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verifyOtpAndComplete() {
    setOtpError('');
    try {
      const { ok, data } = await authAPI.verifyOTP(email, otp);
      if (!ok || !data?.success) throw new Error(data?.message || 'Invalid OTP');
      Alert.alert('Signup successful', 'You can now log in.');
      setOtpModalOpen(false);
      navigation.navigate('Login', { role: userType || 'contractor' });
    } catch (err) {
      setOtpError(err.message);
    }
  }

  async function resendOtp() {
    if (cooldown > 0) return;
    const { ok } = await authAPI.resendOTP(email);
    if (ok) setCooldown(60);
  }

  return (
    <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.heading}>Create an account</Text>
          <Text style={styles.subtitle}>Fill in details to sign up.</Text>

          {!!error && <Text style={commonStyles.errorText}>{error}</Text>}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" style={commonStyles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={commonStyles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="••••••••" style={[commonStyles.input, { flex: 1 }]} />
              <TouchableOpacity onPress={togglePassword} style={styles.iconButton}>
                <Image source={showPassword ? hidePasswordIcon : showPasswordIcon} style={styles.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <TextInput value={userType} onChangeText={setUserType} placeholder="contractor/admin/technician/supplier/consultant" style={commonStyles.input} />
          </View>

          <TouchableOpacity style={[commonStyles.button, submitting && commonStyles.buttonDisabled]} onPress={submitSignup} disabled={submitting}>
            <Text style={commonStyles.buttonText}>{submitting ? 'Submitting...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('LoginSelection')} style={{ marginTop: spacing.md }}>
            <Text style={styles.link}>Back to Login Selection</Text>
          </TouchableOpacity>
        </View>

        {/* OTP Modal substitute */}
        {otpModalOpen && (
          <View style={styles.otpContainer}>
            <View style={styles.otpCard}>
              <Text style={styles.heading}>Verify OTP</Text>
              {!!otpError && <Text style={commonStyles.errorText}>{otpError}</Text>}
              <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" style={commonStyles.input} />
              <TouchableOpacity style={[commonStyles.button, { marginTop: spacing.md }]} onPress={verifyOtpAndComplete}>
                <Text style={commonStyles.buttonText}>Verify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: spacing.sm }} onPress={resendOtp} disabled={cooldown > 0}>
                <Text style={[styles.link, cooldown > 0 && { color: COLORS.textLight }]}>Resend OTP {cooldown > 0 ? `in ${cooldown}s` : ''}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  link: {
    color: COLORS.primary,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  otpContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  otpCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.md,
    gap: spacing.sm,
  },
});