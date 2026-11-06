import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AlertModal } from '@/components/ui/AlertModal';
import { api, LeaveBalance, LeaveRequest } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

export default function LeavesScreen() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'disetujui' | 'ditolak' | 'dibatalkan'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Cancellation modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelingItem, setCancelingItem] = useState<LeaveRequest | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchData = async () => {
    try {
      const [balRes, reqRes] = await Promise.all([
        api.getLeaveBalances(),
        api.getLeaveRequests(activeFilter === 'all' ? undefined : activeFilter),
      ]);
      setBalances(balRes);
      setRequests(reqRes);
    } catch (e) {
      console.warn('Error fetching leaves data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleConfirmCancel = async () => {
    if (!cancelingItem) return;
    setIsCanceling(true);
    try {
      await api.cancelLeaveRequest(cancelingItem.id);
      setCancelModalVisible(false);
      setCancelingItem(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan permohonan.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Izin & Cuti</Text>
          <Text style={styles.headerSubtitle}>Kelola saldo dan permohonan izin karyawan</Text>
        </View>
        <Button
          title="Ajukan"
          icon="add"
          size="sm"
          onPress={() => router.push('/leave/new')}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Palette.primary]} />}>
        {/* Balances Carousel */}
        <Text style={styles.sectionTitle}>Saldo Cuti Tahun 2026</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.balanceList}>
          {balances.map((b) => (
            <Card key={b.leave_type_id} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Ionicons name="calendar" size={16} color={Palette.primary} />
                <Text style={styles.balanceTypeName}>{b.leave_type_name}</Text>
              </View>
              <View style={styles.balanceCountRow}>
                <Text style={styles.remainingDays}>{b.remaining_days}</Text>
                <Text style={styles.remainingLabel}>Hari Tersisa</Text>
              </View>
              <View style={styles.balanceMetaRow}>
                <Text style={styles.balanceMetaText}>Terpakai: {b.used_days} Hari</Text>
                <Text style={styles.balanceMetaText}>Total: {b.total_days} Hari</Text>
              </View>
            </Card>
          ))}
        </ScrollView>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Riwayat Pengajuan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'disetujui', label: 'Disetujui' },
              { id: 'ditolak', label: 'Ditolak' },
              { id: 'dibatalkan', label: 'Dibatalkan' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.id as any)}>
                <Text style={[styles.filterChipText, activeFilter === f.id && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Requests List */}
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Palette.muted} />
            <Text style={styles.emptyText}>Tidak ada riwayat permohonan dengan filter ini.</Text>
          </View>
        ) : (
          requests.map((item) => (
            <Card key={item.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.requestTypeName}>{item.leave_type.name}</Text>
                  <Text style={styles.requestDate}>
                    {item.start_date} s/d {item.end_date} ({item.total_days} Hari)
                  </Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              <Text style={styles.requestReason} numberOfLines={2}>
                Alasan: {item.reason}
              </Text>

              {item.rejection_reason && (
                <View style={styles.rejectionNotice}>
                  <Ionicons name="alert-circle" size={14} color={Palette.danger} />
                  <Text style={styles.rejectionNoticeText}>
                    Alasan Ditolak: {item.rejection_reason}
                  </Text>
                </View>
              )}

              {/* Cancel Button only for pending requests */}
              {item.status === 'pending' && (
                <View style={styles.requestFooter}>
                  <Text style={styles.submittedAt}>Diajukan: {item.created_at}</Text>
                  <Button
                    title="Batalkan Pengajuan"
                    variant="outline"
                    size="sm"
                    textStyle={{ color: Palette.danger, fontSize: 12 }}
                    style={{ borderColor: Palette.dangerBorder }}
                    onPress={() => {
                      setCancelingItem(item);
                      setCancelModalVisible(true);
                    }}
                  />
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <AlertModal
        visible={cancelModalVisible}
        type="warning"
        title="Batalkan Pengajuan?"
        message={`Apakah Anda yakin ingin membatalkan pengajuan ${cancelingItem?.leave_type.name} untuk tanggal ${cancelingItem?.start_date}? Tindakan ini tidak dapat diurungkan.`}
        primaryButtonText="Ya, Batalkan"
        onPrimaryPress={handleConfirmCancel}
        secondaryButtonText="Kembali"
        onSecondaryPress={() => {
          setCancelModalVisible(false);
          setCancelingItem(null);
        }}
        loading={isCanceling}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Palette.ink,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Palette.muted,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.three,
  },
  balanceList: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  balanceCard: {
    width: 170,
    padding: Spacing.three,
    backgroundColor: Palette.surface,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.two,
  },
  balanceTypeName: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
  },
  balanceCountRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
    marginVertical: Spacing.one,
  },
  remainingDays: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.ink,
  },
  remainingLabel: {
    ...Typography.caption,
    color: Palette.muted,
  },
  balanceMetaRow: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    gap: 2,
  },
  balanceMetaText: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  filterSection: {
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterChipsRow: {
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  filterChipActive: {
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
  },
  filterChipTextActive: {
    color: Palette.primaryDark,
  },
  requestCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  requestTypeName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  requestDate: {
    ...Typography.caption,
    color: Palette.muted,
    marginTop: 2,
  },
  requestReason: {
    ...Typography.caption,
    color: Palette.inkSecondary,
    marginBottom: Spacing.two,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.dangerSurface,
    padding: Spacing.two,
    borderRadius: Radii.sm,
    marginBottom: Spacing.two,
  },
  rejectionNoticeText: {
    ...Typography.tiny,
    color: Palette.dangerText,
    flex: 1,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  submittedAt: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.eight,
    gap: Spacing.two,
  },
  emptyText: {
    ...Typography.body,
    color: Palette.muted,
    textAlign: 'center',
  },
});

