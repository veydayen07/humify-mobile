import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Radii } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export type StatusType =
  | 'hadir'
  | 'terlambat'
  | 'pulang_cepat'
  | 'izin'
  | 'sakit'
  | 'cuti'
  | 'alpha'
  | 'libur'
  | 'pending'
  | 'disetujui'
  | 'ditolak'
  | 'dibatalkan'
  | 'Menunggu Tinjauan'
  | 'Menunggu Persetujuan';

interface Props {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const norm = (status || '').toLowerCase().trim();

  let label = status;
  let bg: string = Palette.borderLight;
  let text: string = Palette.inkSecondary;
  let border: string = Palette.border;
  let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

  switch (norm) {
    case 'hadir':
    case 'disetujui':
      label = norm === 'hadir' ? 'Hadir Tepat Waktu' : 'Disetujui';
      bg = Palette.successSurface;
      text = Palette.successText;
      border = Palette.successBorder;
      iconName = 'checkmark-circle';
      break;

    case 'terlambat':
      label = 'Terlambat';
      bg = Palette.warningSurface;
      text = Palette.warningText;
      border = Palette.warningBorder;
      iconName = 'time';
      break;

    case 'pulang_cepat':
      label = 'Pulang Cepat';
      bg = '#FEF3C7';
      text = '#B45309';
      border = '#FCD34D';
      iconName = 'warning-outline';
      break;

    case 'pending':
    case 'menunggu tinjauan':
    case 'menunggu persetujuan':
      label = norm.includes('persetujuan') ? 'Menunggu Persetujuan' : 'Menunggu Tinjauan';
      bg = Palette.infoSurface;
      text = Palette.infoText;
      border = Palette.infoBorder;
      iconName = 'hourglass-outline';
      break;

    case 'ditolak':
      label = 'Ditolak';
      bg = Palette.dangerSurface;
      text = Palette.dangerText;
      border = Palette.dangerBorder;
      iconName = 'close-circle';
      break;

    case 'dibatalkan':
      label = 'Dibatalkan';
      bg = '#F1F5F9';
      text = Palette.muted;
      border = Palette.border;
      iconName = 'ban';
      break;

    case 'sakit':
      label = 'Sakit';
      bg = '#F5F3FF';
      text = '#6D28D9';
      border = '#DDD6FE';
      iconName = 'medkit';
      break;

    case 'izin':
      label = 'Izin';
      bg = '#EFF6FF';
      text = '#1D4ED8';
      border = '#BFDBFE';
      iconName = 'document-text';
      break;

    case 'cuti':
      label = 'Cuti';
      bg = '#ECFDF5';
      text = '#047857';
      border = '#A7F3D0';
      iconName = 'calendar';
      break;

    default:
      label = status;
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, isSmall && styles.badgeSm]}>
      <Ionicons name={iconName} size={isSmall ? 11 : 13} color={text} style={styles.icon} />
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '600',
  },
});
