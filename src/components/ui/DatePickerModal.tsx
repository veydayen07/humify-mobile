import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  title?: string;
  minDate?: string; // YYYY-MM-DD
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function DatePickerModal({
  visible,
  value,
  title = 'Pilih Tanggal',
  minDate,
  onSelect,
  onClose,
}: Props) {
  // Parse initial date
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const parts = dStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const initial = parseDate(value);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState(value || new Date().toISOString().split('T')[0]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; disabled: boolean }[] = [];

  // Empty leading days
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false, disabled: true });
  }

  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let disabled = false;
    if (minDate && dStr < minDate) {
      disabled = true;
    }
    days.push({ dateStr: dStr, dayNum: d, isCurrentMonth: true, disabled });
  }

  const handleDayPress = (dateStr: string, disabled: boolean) => {
    if (!dateStr || disabled) return;
    setSelectedDate(dateStr);
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  const formatDisplayDate = (dStr: string) => {
    const d = parseDate(dStr);
    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
    return `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Palette.ink} />
            </TouchableOpacity>
          </View>

          {/* Current Selection Banner */}
          <View style={styles.selectionBanner}>
            <Ionicons name="calendar" size={18} color={Palette.primary} />
            <Text style={styles.selectionText}>{formatDisplayDate(selectedDate)}</Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={Palette.ink} />
            </TouchableOpacity>
            <Text style={styles.navMonthYear}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={Palette.ink} />
            </TouchableOpacity>
          </View>

          {/* Day Names Header */}
          <View style={styles.daysHeaderRow}>
            {DAY_NAMES.map((d, index) => (
              <Text key={index} style={[styles.dayHeaderCell, (index === 0 || index === 6) && styles.weekendHeader]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {days.map((item, index) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  disabled={!item.isCurrentMonth || item.disabled}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    item.disabled && styles.dayCellDisabled,
                  ]}
                  onPress={() => handleDayPress(item.dateStr, item.disabled)}>
                  {item.dayNum > 0 && (
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        item.disabled && styles.dayTextDisabled,
                      ]}>
                      {item.dayNum}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button title="Batal" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Pilih Tanggal" variant="primary" onPress={handleConfirm} style={{ flex: 1 }} />
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
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Palette.surface,
    borderRadius: Radii.xl,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    ...Typography.h3,
    color: Palette.ink,
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.md,
    marginBottom: Spacing.three,
  },
  selectionText: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  navBtn: {
    padding: Spacing.two,
    borderRadius: Radii.full,
    backgroundColor: Palette.background,
  },
  navMonthYear: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: Spacing.one,
  },
  dayHeaderCell: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
  },
  weekendHeader: {
    color: Palette.danger,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: Palette.primary,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: Palette.ink,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: Palette.white,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: Palette.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});

