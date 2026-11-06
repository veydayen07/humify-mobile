import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

interface HistoryItem {
  id: number;
  date: string;
  shift_name: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  late_minutes: number;
  review_status: string;
  review_note: string | null;
}

interface SummaryData {
  total_present: number;
  total_late: number;
  total_leave: number;
  total_sick: number;
}

export default function AttendanceHistoryScreen() {
  const [selectedMonth, setSelectedMonth] = useState(11);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [summary, setSummary] = useState<SummaryData>({
    total_present: 18,
    total_late: 2,
    total_leave: 1,
    total_sick: 0,
  });
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await api.getAttendanceHistory(selectedMonth, selectedYear);
      if (data) {
        setSummary(data.summary || summary);
        setHistoryList(data.history || []);
      }
    } catch (e) {
      console.warn('Error fetching history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [selectedMonth, selectedYear])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getMonthName = (m: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return months[m - 1] || 'Bulan';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Presensi</Text>
        <Text style={styles.headerSubtitle}>Pantau rekapitulasi kehadiran harian Anda</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Palette.primary]} />}>
        {/* Month Selector Bar */}
        <View style={styles.monthSelectorBar}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => setSelectedMonth((m) => (m === 1 ? 12 : m - 1))}>
            <Ionicons name="chevron-back" size={20} color={Palette.ink} />
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Ionicons name="calendar-outline" size={16} color={Palette.primary} />
            <Text style={styles.monthTitle}>
              {getMonthName(selectedMonth)} {selectedYear}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => setSelectedMonth((m) => (m === 12 ? 1 : m + 1))}>
            <Ionicons name="chevron-forward" size={20} color={Palette.ink} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Statistics Grid */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
            </View>
            <Text style={styles.summaryNumber}>{summary.total_present}</Text>
            <Text style={styles.summaryLabel}>Tepat Waktu</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIconBadge, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time" size={18} color="#D97706" />
            </View>
            <Text style={styles.summaryNumber}>{summary.total_late}</Text>
            <Text style={styles.summaryLabel}>Terlambat</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text" size={18} color="#2563EB" />
            </View>
            <Text style={styles.summaryNumber}>{summary.total_leave}</Text>
            <Text style={styles.summaryLabel}>Izin/Cuti</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIconBadge, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="medkit" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.summaryNumber}>{summary.total_sick}</Text>
            <Text style={styles.summaryLabel}>Sakit</Text>
          </Card>
        </View>

        {/* History List Header */}
        <Text style={styles.listSectionTitle}>Daftar Kehadiran Harian</Text>

        {/* History List Cards */}
        {historyList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={48} color={Palette.muted} />
            <Text style={styles.emptyText}>Belum ada catatan presensi pada periode ini.</Text>
          </View>
        ) : (
          historyList.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setSelectedItem(item)}>
              <Card style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyShift}>{item.shift_name}</Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </View>

                <View style={styles.historyTimesRow}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Masuk</Text>
                    <Text style={styles.timeValue}>{item.check_in_time || '--:--'}</Text>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Pulang</Text>
                    <Text style={styles.timeValue}>{item.check_out_time || '--:--'}</Text>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Tinjauan</Text>
                    <StatusBadge status={item.review_status} size="sm" />
                  </View>
                </View>

                {item.review_note && (
                  <View style={styles.noteSnippet}>
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color={Palette.muted} />
                    <Text style={styles.noteSnippetText} numberOfLines={1}>
                      Catatan: {item.review_note}
                    </Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Attendance Detail Modal */}
      {selectedItem && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detail Presensi</Text>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close" size={24} color={Palette.ink} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tanggal</Text>
                <Text style={styles.detailValueBold}>{selectedItem.date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shift Kerja</Text>
                <Text style={styles.detailValue}>{selectedItem.shift_name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waktu Masuk</Text>
                <Text style={styles.detailValue}>{selectedItem.check_in_time || '--:--'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waktu Pulang</Text>
                <Text style={styles.detailValue}>{selectedItem.check_out_time || '--:--'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status Kehadiran</Text>
                <StatusBadge status={selectedItem.status} />
              </View>

              {selectedItem.late_minutes > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Keterlambatan</Text>
                  <Text style={[styles.detailValueBold, { color: Palette.warningText }]}>
                    {selectedItem.late_minutes} Menit
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status Tinjauan</Text>
                <StatusBadge status={selectedItem.review_status} />
              </View>

              {selectedItem.review_note ? (
                <View style={styles.reviewerNoteBox}>
                  <Text style={styles.reviewerNoteLabel}>Catatan Peninjau / Manager:</Text>
                  <Text style={styles.reviewerNoteText}>{selectedItem.review_note}</Text>
                </View>
              ) : null}

              <Button
                title="Tutup"
                variant="outline"
                size="md"
                onPress={() => setSelectedItem(null)}
                style={{ marginTop: Spacing.four }}
              />
            </Card>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
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
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
  },
  monthNavBtn: {
    padding: Spacing.one,
  },
  monthCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  monthTitle: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.two + 2,
    alignItems: 'center',
  },
  summaryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryNumber: {
    ...Typography.h3,
    color: Palette.ink,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.muted,
    marginTop: 2,
  },
  listSectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.three,
  },
  historyCard: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  historyDate: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  historyShift: {
    ...Typography.tiny,
    color: Palette.muted,
    marginTop: 2,
  },
  historyTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: Radii.md,
    padding: Spacing.two,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.border,
  },
  timeLabel: {
    fontSize: 10,
    color: Palette.muted,
    marginBottom: 2,
  },
  timeValue: {
    ...Typography.captionBold,
    color: Palette.ink,
  },
  noteSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.two,
    backgroundColor: Palette.borderLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  noteSnippetText: {
    ...Typography.tiny,
    color: Palette.muted,
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    padding: Spacing.five,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  modalTitle: {
    ...Typography.h3,
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
  reviewerNoteBox: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primaryBorder,
    borderWidth: 1,
    borderRadius: Radii.md,
  },
  reviewerNoteLabel: {
    ...Typography.tiny,
    color: Palette.primaryDark,
    fontWeight: '700',
    marginBottom: 2,
  },
  reviewerNoteText: {
    ...Typography.caption,
    color: Palette.ink,
  },
});

