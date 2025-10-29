import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, spacing, borderRadius, fontSize, fontWeight, shadow, commonStyles } from '../../utils/styles';
import logo from '../../assets/logo.png';

// SVG icons converted to React Native components
function ContractorIcon({ size = 24, color = '#000' }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>🔧</Text>
    </View>
  );
}

function TechnicianIcon({ size = 24, color = '#000' }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>👨‍🔧</Text>
    </View>
  );
}

function SupplierIcon({ size = 24, color = '#000' }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>📦</Text>
    </View>
  );
}

function ConsultantIcon({ size = 24, color = '#000' }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>💼</Text>
    </View>
  );
}

function AdminIcon({ size = 24, color = '#000' }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>👤</Text>
    </View>
  );
}

function ArrowIcon({ size = 16, color = '#000' }) {
  return (
    <Text style={{ color, fontSize: size }}>→</Text>
  );
}

export default function LoginSelectionScreen() {
  const navigation = useNavigation();

  function goToLogin(role) {
    navigation.navigate('Login', { role });
  }

  const RoleButton = ({ icon: Icon, label, onPress, isLast = false }) => {
    const [pressed, setPressed] = React.useState(false);
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        activeOpacity={0.7}
        style={[
          styles.roleButton,
          isLast && styles.roleButtonLast,
          pressed && styles.roleButtonPressed,
        ]}
      >
        <View style={styles.roleButtonContent}>
          <Icon size={24} color={pressed ? COLORS.primary : '#000'} />
          <Text style={[styles.roleButtonText, pressed && styles.roleButtonTextPressed]}>
            {label}
          </Text>
        </View>
        <ArrowIcon size={16} color={pressed ? COLORS.primary : '#000'} />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        
        <Text style={styles.heading}>Login/Signup</Text>
        <Text style={styles.subtitle}>
          Enter your login details below to access your account.
        </Text>

        <View style={styles.roleButtonsContainer}>
          <RoleButton
            icon={ContractorIcon}
            label="Login As Contractor"
            onPress={() => goToLogin('contractor')}
          />
          <RoleButton
            icon={TechnicianIcon}
            label="Login As Technician"
            onPress={() => goToLogin('technician')}
          />
          <RoleButton
            icon={SupplierIcon}
            label="Login As Supplier"
            onPress={() => goToLogin('supplier')}
          />
          <RoleButton
            icon={ConsultantIcon}
            label="Login As Consultant"
            onPress={() => goToLogin('consultant')}
          />
          <RoleButton
            icon={AdminIcon}
            label="Login As Admin"
            onPress={() => goToLogin('admin')}
            isLast={true}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 350,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...commonStyles.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  roleButtonsContainer: {
    gap: spacing.md,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  roleButtonLast: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  roleButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: COLORS.text,
  },
  roleButtonTextPressed: {
    color: COLORS.primary,
  },
  roleButtonPressed: {
    // Additional pressed styles if needed
  },
});

