import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppHeader } from '@/components/ui/AppHeader';
import { AlertModal } from '@/components/ui/AlertModal';
import { api, ManagerAttendanceItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function ManagerAttendanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ManagerAttendanceItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Decision Modals
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success/Error Feedback Modal
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    async function loadItem() {
      try {
        const list = await api.getManagerAttendanceReviews();
        const found = list.find((i) => String(i.attendance_id) === String(id)) || list[0];
        setItem(found || null);
      } catch (e) {
        console.warn('Error fetching detail:', e);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  const handleApprove = async () => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      await api.decideAttendanceReview(item.attendance_id, 'approve', reviewNote.trim() || undefined);
      setIsSubmitting(false);
      setApproveModalVisible(false);
      setFeedbackTitle('Presensi Disetujui');
      setFeedbackMessage('Catatan review presensi berhasil disimpan dan disetujui.');
      setFeedbackVisible(true);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Gagal menyetujui presensi.');
    }
  };

  const handleReject = async () => {
    if (!item) return;
    if (!rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.decideAttendanceReview(item.attendance_id, 'reject', rejectReason.trim());
      setIsSubmitting(false);
      setRejectModalVisible(false);
      setFeedbackTitle('Presensi Ditolak');
      setFeedbackMessage('Presensi telah ditolak dan alasan penolakan dicatat.');
      setFeedbackVisible(true);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Gagal menolak presensi.');
    }
  };

  if (loading || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Detail Review Presensi" showBack />
        <View style={styles.loadingBox}>
          <Text style={{ color: Palette.muted }}>Memuat data presensi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDecided = item.review_status !== 'pending';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Detail Review Presensi" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Employee Header Card */}
        <Card style={styles.card}>
          <View style={styles.employeeHeader}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={24} color={Palette.primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.employeeName}>{item.employee.full_name}</Text>
              <Text style={styles.employeeCode}>{item.employee.employee_code}</Text>
              <Text style={styles.dateText}>Tanggal: {item.attendance_date}</Text>
            </View>
            <StatusBadge status={item.review_status} />
          </View>
        </Card>

        {/* Selfie Captured Photo Preview */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>Foto Selfie Saat Presensi</Text>
          <View style={styles.photoContainer}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.selfieImage} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoBox}>
                <Ionicons name="image-outline" size={48} color={Palette.muted} />
                <Text style={{ color: Palette.muted, marginTop: 4 }}>Foto tidak tersedia</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Biometric & Geolocation Verification Metrics */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>Hasil Validasi Sistem AI & Lokasi</Text>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="scan" size={18} color={Palette.primary} />
              <Text style={styles.metricLabel}>Kecocokan Wajah AI</Text>
            </View>
            <View style={styles.badgeSuccess}>
              <Text style={styles.badgeSuccessText}>{item.face_score}% (Cocok)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="location" size={18} color={Palette.success} />
              <Text style={styles.metricLabel}>Jarak dari Kantor</Text>
            </View>
            <Text style={styles.metricValueBold}>{item.distance_meters || 18} Meter</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="time" size={18} color={Palette.muted} />
              <Text style={styles.metricLabel}>Jam Masuk</Text>
            </View>
            <Text style={styles.metricValueBold}>{item.check_in_time || '--:--'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="flag" size={18} color={Palette.muted} />
              <Text style={styles.metricLabel}>Status Kehadiran</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        </Card>

        {/* Action Controls for Manager */}
        {!isDecided ? (
          <View style={styles.actionButtonsRow}>
            <Button
              title="Tolak Presensi"
              variant="outline"
              icon="close-circle-outline"
              size="lg"
              textStyle={{ color: Palette.danger }}
              style={{ ...styles.actionBtn, borderColor: Palette.dangerBorder }}
              onPress={() => setRejectModalVisible(true)}
            />
            <Button
              title="Setujui Presensi"
              icon="checkmark-circle-outline"
              size="lg"
              style={styles.actionBtn}
              onPress={() => setApproveModalVisible(true)}
            />
          </View>
        ) : (
          <Card style={styles.alreadyDecidedCard}>
            <Ionicons name="checkmark-done-circle" size={20} color={Palette.success} />
            <Text style={styles.alreadyDecidedText}>
              Presensi ini sudah diproses ({item.review_status.toUpperCase()}).
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Approve Modal with Optional Note */}
      <AlertModal
        visible={approveModalVisible}
        type="input"
        title="Setujui Presensi"
        message="Apakah Anda yakin ingin menyetujui presensi karyawan ini? Anda dapat menambahkan catatan opsional."
        inputPlaceholder="Catatan persetujuan (opsional)..."
        inputValue={reviewNote}
        onInputChange={setReviewNote}
        primaryButtonText="Ya, Setujui"
        onPrimaryPress={handleApprove}
        secondaryButtonText="Batal"
        onSecondaryPress={() => setApproveModalVisible(false)}
        loading={isSubmitting}
      />

      {/* Reject Modal with Mandatory Rejection Reason */}
      <AlertModal
        visible={rejectModalVisible}
        type="input"
        title="Tolak Presensi"
        message="Masukkan alasan penolakan presensi. Alasan ini akan dapat dilihat oleh karyawan bersangkutan."
        inputPlaceholder="Alasan penolakan (wajib diisi)..."
        inputValue={rejectReason}
        onInputChange={setRejectReason}
        primaryButtonText="Tolak Presensi"
        onPrimaryPress={handleReject}
        secondaryButtonText="Batal"
        onSecondaryPress={() => setRejectModalVisible(false)}
        loading={isSubmitting}
      />

      {/* Feedback Modal */}
      <AlertModal
        visible={feedbackVisible}
        type="success"
        title={feedbackTitle}
        message={feedbackMessage}
        primaryButtonText="Kembali ke Daftar"
        onPrimaryPress={() => {
          setFeedbackVisible(false);
          router.back();
        }}
      />
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeName: {
    ...Typography.h3,
    color: Palette.ink,
  },
  employeeCode: {
    ...Typography.caption,
    color: Palette.muted,
  },
  dateText: {
    ...Typography.tiny,
    color: Palette.muted,
    marginTop: 2,
  },
  sectionHeader: {
    ...Typography.captionBold,
    color: Palette.ink,
    marginBottom: Spacing.three,
  },
  photoContainer: {
    height: 240,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  noPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  metricLabel: {
    ...Typography.bodyMedium,
    color: Palette.ink,
  },
  metricValueBold: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  badgeSuccess: {
    backgroundColor: Palette.successSurface,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Palette.successBorder,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.successText,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginVertical: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionBtn: {
    flex: 1,
  },
  alreadyDecidedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.successSurface,
    borderColor: Palette.successBorder,
  },
  alreadyDecidedText: {
    ...Typography.captionBold,
    color: Palette.successText,
  },
});
