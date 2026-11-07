import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('alex.morgan');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
      setErrorMessage('Username wajib diisi.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Password wajib diisi.');
      return;
    }

    setErrorMessage('');
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setErrorMessage(e.message || 'Login gagal. Periksa username dan password Anda.');
    }
  };

  const handleQuickFill = (demoUser: string) => {
    setUsername(demoUser);
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo & Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="finger-print" size={36} color={Palette.white} />
            </View>
            <Text style={styles.brandTitle}>Humify</Text>
            <Text style={styles.brandSubtitle}>Sistem Presensi & Manajemen HRIS</Text>
          </View>

          {/* Login Card */}
          <Card style={styles.loginCard}>
            <Text style={styles.cardHeader}>Masuk ke Akun Anda</Text>
            <Text style={styles.cardDesc}>
              Gunakan kredensial yang telah diberikan oleh tim HRD.
            </Text>

            {/* Error banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Palette.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username / NIP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={Palette.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: alex.morgan"
                  placeholderTextColor={Palette.muted}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kata Sandi</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Palette.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor={Palette.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Palette.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              title="Masuk"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={styles.submitBtn}
            />

            <Text style={styles.footerNote}>
              Belum memiliki akun? Hubungi Admin HRD untuk pembuatan akun karyawan baru.
            </Text>
          </Card>

          {/* Quick Demo Accounts for Testing */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>Akun Uji Coba Cepat (1-Tap):</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={[styles.demoPill, username === 'alex.morgan' && styles.demoPillActive]}
                onPress={() => handleQuickFill('alex.morgan')}>
                <Text style={styles.demoPillText}>Alex (Karyawan)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoPill, username === 'budi.santoso' && styles.demoPillActive]}
                onPress={() => handleQuickFill('budi.santoso')}>
                <Text style={styles.demoPillText}>Budi (Shifting/No Face)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoPill, username === 'maya.chen' && styles.demoPillActive]}
                onPress={() => handleQuickFill('maya.chen')}>
                <Text style={styles.demoPillText}>Maya (Manager)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoPill, username === 'admin.hr' && styles.demoPillActive]}
                onPress={() => handleQuickFill('admin.hr')}>
                <Text style={styles.demoPillText}>Dewi (Admin HR)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: Spacing.four,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    ...Typography.h1,
    color: Palette.ink,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Palette.muted,
    marginTop: 2,
  },
  loginCard: {
    padding: Spacing.five,
  },
  cardHeader: {
    ...Typography.h2,
    marginBottom: Spacing.one,
  },
  cardDesc: {
    ...Typography.caption,
    color: Palette.muted,
    marginBottom: Spacing.four,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.dangerSurface,
    borderColor: Palette.dangerBorder,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  errorText: {
    ...Typography.captionMedium,
    color: Palette.dangerText,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  inputLabel: {
    ...Typography.captionBold,
    marginBottom: Spacing.two,
    color: Palette.ink,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.three,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Palette.ink,
  },
  eyeBtn: {
    padding: Spacing.two,
  },
  submitBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  footerNote: {
    ...Typography.tiny,
    color: Palette.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  demoSection: {
    marginTop: Spacing.six,
    alignItems: 'center',
  },
  demoSectionTitle: {
    ...Typography.captionBold,
    color: Palette.muted,
    marginBottom: Spacing.two,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  demoPill: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  demoPillActive: {
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primary,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
});

