import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function AttendanceResultScreen() {
  const params = useLocalSearchParams<{
    action?: string;
    status?: string;
    lateMinutes?: string;
    faceScore?: string;
    time?: string;
    distance?: string;
  }>();

  const isCheckIn = params.action === 'check-in';
  const status = params.status || 'hadir';
  const lateMinutes = Number(params.lateMinutes || 0);
  const faceScore = params.faceScore || '96.5';
  const distance = params.distance || '18';
  const timeStr = params.time || new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <Ionicons name="checkmark-circle" size={80} color={Palette.primary} />
          </View>
          <Text style={styles.title}>Presensi Berhasil Tercatat</Text>
          <Text style={styles.subtitle}>
            {isCheckIn
              ? 'Selamat bekerja! Kehadiran Anda telah diverifikasi oleh AI Biometrik.'
              : 'Terima kasih atas dedikasi dan kerja keras Anda hari ini!'}
          </Text>
        </View>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardHeader}>Ringkasan Presensi</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Jenis Aksi</Text>
            <Text style={styles.valueBold}>
              {isCheckIn ? 'Check-in (Masuk)' : 'Check-out (Pulang)'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Waktu Tercatat</Text>
            <Text style={styles.value}>{timeStr} WIB</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Status Kehadiran</Text>
            <StatusBadge status={status} />
          </View>

          {lateMinutes > 0 && (
            <View style={[styles.row, { marginTop: Spacing.two }]}>
              <Text style={styles.label}>Keterlambatan</Text>
              <Text style={[styles.valueBold, { color: Palette.warningText }]}>
                {lateMinutes} Menit
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Status Tinjauan</Text>
            <StatusBadge status="Menunggu Tinjauan" />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>AI Wajah Biometrik</Text>
            <View style={styles.metricBadge}>
              <Ionicons name="scan" size={14} color={Palette.primary} />
              <Text style={styles.metricText}>{faceScore}% Cocok</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Validasi Geofence</Text>
            <View style={styles.metricBadge}>
              <Ionicons name="navigate" size={14} color={Palette.success} />
              <Text style={[styles.metricText, { color: Palette.successText }]}>
                {distance}m dari Kantor
              </Text>
            </View>
          </View>
        </Card>

        {/* Note */}
        <Text style={styles.footerNote}>
          Status review akan diverifikasi oleh atasan langsung Anda sesuai prosedur operasional.
        </Text>

        {/* Action Button */}
        <Button
          title="Kembali ke Beranda"
          size="lg"
          onPress={() => router.replace('/(tabs)')}
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    padding: Spacing.four,
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  iconGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Palette.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  summaryCard: {
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  cardHeader: {
    ...Typography.h3,
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginVertical: Spacing.two,
  },
  label: {
    ...Typography.bodyMedium,
    color: Palette.muted,
  },
  value: {
    ...Typography.bodyMedium,
    color: Palette.ink,
  },
  valueBold: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  footerNote: {
    ...Typography.tiny,
    color: Palette.muted,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  btn: {
    width: '100%',
  },
});

