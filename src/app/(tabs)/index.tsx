import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography, OfficeLocationConfig } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const { user, todayStatus, refreshTodayStatus, faceRegistered, isManager } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshTodayStatus();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTodayStatus();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatClock = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  const hasCheckedIn = todayStatus?.has_checked_in ?? false;
  const hasCheckedOut = todayStatus?.has_checked_out ?? false;
  const attendance = todayStatus?.attendance;
  const assignedShift = todayStatus?.assigned_shift;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Palette.primary]} />}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.employee?.full_name || user?.username || 'Karyawan'}</Text>
            <Text style={styles.userRole}>
              {user?.employee?.position?.name || 'Staff'} • {user?.employee?.department?.name || 'Humify'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-circle" size={46} color={Palette.primary} />
          </TouchableOpacity>
        </View>

        {/* First Time Face Registration Alert Banner */}
        {!faceRegistered && (
          <TouchableOpacity
            style={styles.faceAlertBanner}
            activeOpacity={0.85}
            onPress={() => router.push('/face-registration')}>
            <View style={styles.faceAlertIconWrap}>
              <Ionicons name="scan" size={24} color={Palette.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.faceAlertTitle}>Wajah Acuan Belum Terdaftar</Text>
              <Text style={styles.faceAlertDesc}>
                Anda belum dapat melakukan presensi. Daftarkan foto wajah acuan terlebih dahulu.
              </Text>
              <Text style={styles.faceAlertLink}>Daftarkan Sekarang →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Digital Clock & Date Card */}
        <Card style={styles.clockCard}>
          <View style={styles.clockRow}>
            <View>
              <Text style={styles.dateLabel}>{formatDate(currentTime)}</Text>
              <Text style={styles.liveClock}>{formatClock(currentTime)} WIB</Text>
            </View>
            <View style={styles.gpsIndicator}>
              <Ionicons name="location" size={14} color={Palette.primary} />
              <Text style={styles.gpsText}>Radius 100m Kantor</Text>
            </View>
          </View>
        </Card>

        {/* Shift Card */}
        <Card style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftTag}>
              <Ionicons name="time-outline" size={16} color={Palette.primaryDark} />
              <Text style={styles.shiftTagText}>
                {assignedShift?.name || 'Regular'} ({assignedShift?.category === 'shifting' ? 'Shifting' : 'Jadwal Kantor'})
              </Text>
            </View>
            <Text style={styles.shiftHours}>
              {assignedShift?.start_time ? assignedShift.start_time.substring(0, 5) : '08:00'} -{' '}
              {assignedShift?.end_time ? assignedShift.end_time.substring(0, 5) : '17:00'}
            </Text>
          </View>

          {/* Attendance Status Summary */}
          <View style={styles.attendanceGrid}>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxLabel}>Jam Masuk</Text>
              <Text style={styles.timeBoxValue}>
                {attendance?.check_in_time
                  ? attendance.check_in_time.split(' ')[1]?.substring(0, 5) || attendance.check_in_time.substring(11, 16)
                  : '--:--'}
              </Text>
            </View>
            <View style={styles.timeBoxDivider} />
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxLabel}>Jam Pulang</Text>
              <Text style={styles.timeBoxValue}>
                {attendance?.check_out_time
                  ? attendance.check_out_time.split(' ')[1]?.substring(0, 5) || attendance.check_out_time.substring(11, 16)
                  : '--:--'}
              </Text>
            </View>
          </View>

          {/* Status Chips */}
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusMetaLabel}>Kehadiran:</Text>
              {attendance?.status ? (
                <StatusBadge status={attendance.status} />
              ) : (
                <Text style={styles.unrecordedText}>Belum tercatat</Text>
              )}
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusMetaLabel}>Tinjauan:</Text>
              {attendance?.review_status ? (
                <StatusBadge status={attendance.review_status} />
              ) : (
                <Text style={styles.unrecordedText}>-</Text>
              )}
            </View>
          </View>

          {/* Primary Action Button */}
          <View style={styles.actionSection}>
            {!hasCheckedIn ? (
              <Button
                title="Check-in Sekarang"
                icon="camera"
                size="lg"
                onPress={() => {
                  if (!faceRegistered) {
                    router.push('/face-registration');
                  } else {
                    router.push('/attendance/check-in');
                  }
                }}
              />
            ) : !hasCheckedOut ? (
              <Button
                title="Check-out Pulang"
                icon="log-out-outline"
                size="lg"
                variant="primary"
                style={{ backgroundColor: '#B91C1C', borderColor: '#B91C1C' }}
                onPress={() => router.push('/attendance/check-out')}
              />
            ) : (
              <View style={styles.completedNotice}>
                <Ionicons name="checkmark-done-circle" size={24} color={Palette.success} />
                <Text style={styles.completedText}>Presensi Hari Ini Selesai</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Menu Shortcuts */}
        <Text style={styles.sectionTitle}>Menu Cepat</Text>
        <View style={styles.shortcutsGrid}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(tabs)/history')}>
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.shortcutLabel}>Riwayat Presensi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/(tabs)/leaves')}>
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text-outline" size={22} color="#059669" />
            </View>
            <Text style={styles.shortcutLabel}>Izin & Cuti</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => router.push('/leave/new')}>
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="add-circle-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.shortcutLabel}>Ajukan Cuti</Text>
          </TouchableOpacity>

          {isManager && (
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/manager-attendance')}>
              <View style={[styles.shortcutIconWrap, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Palette.primary} />
              </View>
              <Text style={styles.shortcutLabel}>Review Tim</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Office Location Info Card */}
        <Card style={styles.officeCard}>
          <View style={styles.officeHeader}>
            <Ionicons name="business" size={20} color={Palette.primary} />
            <Text style={styles.officeName}>{OfficeLocationConfig.name}</Text>
          </View>
          <Text style={styles.officeAddress}>{OfficeLocationConfig.address}</Text>
          <View style={styles.geofenceBadge}>
            <Ionicons name="radio" size={14} color={Palette.primary} />
            <Text style={styles.geofenceBadgeText}>
              Batas Maksimal Radius: {OfficeLocationConfig.radiusMeters} Meter
            </Text>
          </View>
        </Card>
      </ScrollView>
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
    paddingBottom: Spacing.ten,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  greeting: {
    ...Typography.caption,
    color: Palette.muted,
  },
  userName: {
    ...Typography.h2,
    color: Palette.ink,
  },
  userRole: {
    ...Typography.captionMedium,
    color: Palette.primaryDark,
    marginTop: 2,
  },
  avatarBtn: {
    padding: Spacing.one,
  },
  faceAlertBanner: {
    flexDirection: 'row',
    backgroundColor: Palette.warningSurface,
    borderColor: Palette.warningBorder,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  faceAlertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceAlertTitle: {
    ...Typography.bodyBold,
    color: Palette.warningText,
  },
  faceAlertDesc: {
    ...Typography.caption,
    color: Palette.warningText,
    marginTop: 2,
  },
  faceAlertLink: {
    ...Typography.captionBold,
    color: Palette.primary,
    marginTop: 4,
  },
  clockCard: {
    marginBottom: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: Palette.surface,
  },
  clockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    ...Typography.caption,
    color: Palette.muted,
  },
  liveClock: {
    ...Typography.h2,
    color: Palette.ink,
    letterSpacing: 0.5,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Radii.full,
    gap: 4,
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  shiftCard: {
    marginBottom: Spacing.four,
    padding: Spacing.four,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  shiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  shiftTagText: {
    ...Typography.bodyBold,
    color: Palette.primaryDark,
  },
  shiftHours: {
    ...Typography.captionBold,
    color: Palette.muted,
  },
  attendanceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxDivider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.border,
  },
  timeBoxLabel: {
    ...Typography.tiny,
    color: Palette.muted,
    marginBottom: 2,
  },
  timeBoxValue: {
    ...Typography.h3,
    color: Palette.ink,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  statusItem: {
    gap: 4,
  },
  statusMetaLabel: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  unrecordedText: {
    ...Typography.captionMedium,
    color: Palette.muted,
  },
  actionSection: {
    marginTop: Spacing.one,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.successSurface,
    borderColor: Palette.successBorder,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
    gap: Spacing.two,
  },
  completedText: {
    ...Typography.bodyBold,
    color: Palette.successText,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.three,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  shortcutCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  shortcutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    ...Typography.captionBold,
    color: Palette.ink,
  },
  officeCard: {
    backgroundColor: Palette.surface,
    padding: Spacing.four,
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  officeName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  officeAddress: {
    ...Typography.caption,
    color: Palette.muted,
    marginBottom: Spacing.two,
  },
  geofenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
  },
  geofenceBadgeText: {
    ...Typography.tiny,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
});

