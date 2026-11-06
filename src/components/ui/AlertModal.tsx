import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

export interface AlertModalProps {
  visible: boolean;
  type?: 'error' | 'warning' | 'success' | 'confirm' | 'input';
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (text: string) => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
}

export function AlertModal({
  visible,
  type = 'error',
  title,
  message,
  primaryButtonText = 'Ambil Ulang',
  onPrimaryPress,
  secondaryButtonText = 'Kembali',
  onSecondaryPress,
  inputPlaceholder,
  inputValue,
  onInputChange,
  iconName,
  loading = false,
}: AlertModalProps) {
  let icon = iconName;
  let iconBg: string = Palette.dangerSurface;
  let iconColor: string = Palette.danger;

  if (!icon) {
    if (type === 'error') {
      icon = 'alert-circle';
      iconBg = Palette.dangerSurface;
      iconColor = Palette.danger;
    } else if (type === 'warning') {
      icon = 'warning';
      iconBg = Palette.warningSurface;
      iconColor = Palette.warning;
    } else if (type === 'success') {
      icon = 'checkmark-circle';
      iconBg = Palette.successSurface;
      iconColor = Palette.success;
    } else {
      icon = 'help-circle';
      iconBg = Palette.infoSurface;
      iconColor = Palette.primary;
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={32} color={iconColor} />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Optional text input for rejection notes */}
          {type === 'input' && (
            <TextInput
              style={styles.input}
              placeholder={inputPlaceholder || 'Tuliskan alasan...'}
              placeholderTextColor={Palette.muted}
              value={inputValue}
              onChangeText={onInputChange}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {onPrimaryPress && (
              <Button
                title={primaryButtonText}
                onPress={onPrimaryPress}
                variant={type === 'error' ? 'danger' : 'primary'}
                loading={loading}
                style={styles.actionBtn}
              />
            )}
            {onSecondaryPress && (
              <Button
                title={secondaryButtonText}
                onPress={onSecondaryPress}
                variant="outline"
                disabled={loading}
                style={styles.actionBtn}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalBox: {
    backgroundColor: Palette.surface,
    borderRadius: Radii.xl,
    padding: Spacing.six,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  message: {
    ...Typography.body,
    color: Palette.muted,
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    padding: Spacing.three,
    minHeight: 80,
    color: Palette.ink,
    fontSize: 14,
    marginBottom: Spacing.four,
    backgroundColor: Palette.background,
  },
  actions: {
    width: '100%',
    gap: Spacing.two,
  },
  actionBtn: {
    width: '100%',
  },
});
