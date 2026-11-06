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
import { api, ManagerLeaveApprovalItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function ManagerLeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ManagerLeaveApprovalItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback modal
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    async function loadItem() {
      try {
        const list = await api.getManagerLeaveApprovals();
        const found = list.find((i) => String(i.request_id) === String(id)) || list[0];
        setItem(found || null);
      } catch (e) {
        console.warn('Error loading leave detail:', e);
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
      await api.decideLeaveApproval(item.request_id, 'approve');
      setIsSubmitting(false);
      setApproveModalVisible(false);
      setFeedbackTitle('Pengajuan Disetujui');
      setFeedbackMessage('Pengajuan izin/cuti karyawan telah berhasil disetujui.');
      setFeedbackVisible(true);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Gagal memproses persetujuan cuti.');
    }
  };

  const handleReject = async () => {
    if (!item) return;
    if (!rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.decideLeaveApproval(item.request_id, 'reject', rejectionReason.trim());
      setIsSubmitting(false);
      setRejectModalVisible(false);
      setFeedbackTitle('Pengajuan Ditolak');
      setFeedbackMessage('Pengajuan izin/cuti telah ditolak dan alasan penolakan dicatat.');
      setFeedbackVisible(true);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Gagal menolak pengajuan.');
    }
  };

  if (loading || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Detail Persetujuan Cuti" showBack />
        <View style={styles.loadingBox}>
          <Text style={{ color: Palette.muted }}>Memuat data pengajuan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = item.status === 'pending';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Detail Persetujuan Cuti" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Subordinate Employee Card */}
        <Card style={styles.card}>
          <View style={styles.employeeHeader}>
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={24} color={Palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.employeeName}>{item.employee.full_name}</Text>
              <Text style={styles.employeeCode}>{item.employee.employee_code}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        </Card>

        {/* Leave Details Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>Rincian Permohonan Cuti</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jenis Cuti/Izin</Text>
            <Text style={styles.detailValueBold}>{item.leave_type_name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal Mulai</Text>
            <Text style={styles.detailValue}>{item.start_date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal Selesai</Text>
            <Text style={styles.detailValue}>{item.end_date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Hari Diajukan</Text>
            <Text style={styles.detailValueBold}>{item.total_days} Hari Kerja</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sisa Kuota Cuti Karyawan</Text>
            <View style={styles.balancePill}>
              <Text style={styles.balancePillText}>{item.remaining_balance} Hari</Text>
            </View>
          </View>
        </Card>

        {/* Reason Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>Alasan Permohonan</Text>
          <Text style={styles.reasonBody}>{item.reason}</Text>
        </Card>

        {/* Attachment Card if available */}
        {item.attachment_url && (
          <Card style={styles.card}>
            <Text style={styles.sectionHeader}>Lampiran Surat / Dokumen</Text>
            <View style={styles.attachmentImageContainer}>
              <Image source={{ uri: item.attachment_url }} style={styles.attachmentImage} resizeMode="cover" />
            </View>
          </Card>
        )}

        {/* Actions for Manager */}
        {isPending ? (
          <View style={styles.actionButtonsRow}>
            <Button
              title="Tolak Pengajuan"
              variant="outline"
              icon="close-circle-outline"
              size="lg"
              textStyle={{ color: Palette.danger }}
              style={{ ...styles.actionBtn, borderColor: Palette.dangerBorder }}
              onPress={() => setRejectModalVisible(true)}
            />
            <Button
              title="Setujui Cuti"
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
              Permohonan ini telah selesai diproses ({item.status.toUpperCase()}).
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Approve Confirmation Modal */}
      <AlertModal
        visible={approveModalVisible}
        type="confirm"
        title="Setujui Permohonan Cuti?"
        message={`Apakah Anda yakin ingin menyetujui permohonan ${item.leave_type_name} untuk ${item.employee.full_name} selama ${item.total_days} hari? Saldo cuti karyawan akan dikurangi.`}
        primaryButtonText="Ya, Setujui"
        onPrimaryPress={handleApprove}
        secondaryButtonText="Batal"
        onSecondaryPress={() => setApproveModalVisible(false)}
        loading={isSubmitting}
      />

      {/* Reject Modal with Required Reason */}
      <AlertModal
        visible={rejectModalVisible}
        type="input"
        title="Tolak Permohonan Cuti"
        message="Masukkan alasan penolakan permohonan cuti. Alasan ini wajib diisi dan akan diteruskan ke karyawan."
        inputPlaceholder="Contoh: Beban kerja tim sedang tinggi pada minggu tersebut..."
        inputValue={rejectionReason}
        onInputChange={setRejectionReason}
        primaryButtonText="Tolak Permohonan"
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
        primaryButtonText="Kembali ke Antrean"
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
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  sectionHeader: {
    ...Typography.captionBold,
    color: Palette.ink,
    marginBottom: Spacing.three,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    ...Typography.caption,
    color: Palette.muted,
  },
  detailValue: {
    ...Typography.captionMedium,
    color: Palette.ink,
  },
  detailValueBold: {
    ...Typography.captionBold,
    color: Palette.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginVertical: 4,
  },
  balancePill: {
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  balancePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  reasonBody: {
    ...Typography.body,
    color: Palette.inkSecondary,
    lineHeight: 22,
  },
  attachmentImageContainer: {
    height: 200,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Palette.background,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
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
