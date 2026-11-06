import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Palette, Spacing, Radii } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: Props) {
  let btnBg: string = Palette.primary;
  let btnBorder: string = Palette.primary;
  let textColor: string = Palette.white;

  switch (variant) {
    case 'primary':
      btnBg = Palette.primary;
      btnBorder = Palette.primary;
      textColor = Palette.white;
      break;
    case 'secondary':
      btnBg = Palette.primarySurface;
      btnBorder = Palette.primaryBorder;
      textColor = Palette.primary;
      break;
    case 'outline':
      btnBg = Palette.surface;
      btnBorder = Palette.border;
      textColor = Palette.ink;
      break;
    case 'danger':
      btnBg = Palette.danger;
      btnBorder = Palette.danger;
      textColor = Palette.white;
      break;
    case 'ghost':
      btnBg = 'transparent';
      btnBorder = 'transparent';
      textColor = Palette.muted;
      break;
  }

  if (disabled) {
    btnBg = '#E2E8F0';
    btnBorder = '#E2E8F0';
    textColor = '#94A3B8';
  }

  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: btnBg,
          borderColor: btnBorder,
          height,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={fontSize + 2}
              color={textColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[styles.text, { color: textColor, fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});
