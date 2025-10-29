import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import logo from '../../assets/logo.png';
import showPasswordIcon from '../../assets/showpassword.png';
import hidePasswordIcon from '../../assets/hidePassword.png';
import { COLORS, spacing, borderRadius, fontSize, fontWeight, shadow, commonStyles } from '../../utils/styles';
import { authAPI } from '../../utils/api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: request, 2: verify, 3: reset
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const togglePassword = () => setShowPassword((p) => !p);

  async function requestReset() {
    setError('');
    setSubmitting(true);
    const { ok, data } = await authAPI.requestPasswordReset(email);
    setSubmitting(false);
    if (!ok) {
      setError(data?.message || 'Unable to request reset');
      return;
    }
    Alert.alert('OTP sent', 'Check your email for the reset code.');
    setStep(2);
  }

  async function verifyOtp() {
    setError('');
    setSubmitting(true);
    const { ok, data } = await authAPI.verifyPasswordResetOTP(email, otp);
    setSubmitting(false);
    if (!ok || !data?.success) {
      setError(data?.message || 'Invalid OTP');
      return;
    }
    setStep(3);
  }

  async function resetPassword() {
    setError('');
    setSubmitting(true);
    const { ok, data } = await authAPI.resetPassword(email, otp, newPassword);
    setSubmitting(false);
    if (!ok || !data?.success) {
      setError(data?.message || 'Reset failed');
      return;
    }
    Alert.alert('Password reset', 'You can now log in with your new password.');
    navigation.navigate('LoginSelection');
  }

  return (
    <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.heading}>Forgot Password</Text>
          <Text style={styles.subtitle}>Follow steps to reset your password.</Text>

          {!!error && <Text style={commonStyles.errorText}>{error}</Text>}

          {step === 1 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={commonStyles.input} />
              </View>
              <TouchableOpacity style={[commonStyles.button, submitting && commonStyles.buttonDisabled]} onPress={requestReset} disabled={submitting}>
                <Text style={commonStyles.buttonText}>{submitting ? 'Submitting...' : 'Request Reset'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OTP</Text>
                <TextInput value={otp} onChangeText={setOtp} placeholder="Enter OTP" style={commonStyles.input} />
              </View>
              <TouchableOpacity style={[commonStyles.button, submitting && commonStyles.buttonDisabled]} onPress={verifyOtp} disabled={submitting}>
                <Text style={commonStyles.buttonText}>{submitting ? 'Verifying...' : 'Verify OTP'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPassword} placeholder="••••••••" style={[commonStyles.input, { flex: 1 }]} />
                  <TouchableOpacity onPress={togglePassword} style={styles.iconButton}>
                    <Image source={showPassword ? hidePasswordIcon : showPasswordIcon} style={styles.icon} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[commonStyles.button, submitting && commonStyles.buttonDisabled]} onPress={resetPassword} disabled={submitting}>
                <Text style={commonStyles.buttonText}>{submitting ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('LoginSelection')} style={{ marginTop: spacing.md }}>
            <Text style={styles.link}>Back to Login Selection</Text>
          </TouchableOpacity>
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
  link: {
    color: COLORS.primary,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});