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
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api, ManagerLeaveApprovalItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

export default function ManagerLeavesScreen() {
  const [items, setItems] = useState<ManagerLeaveApprovalItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.getManagerLeaveApprovals();
      setItems(data);
    } catch (e) {
      console.warn('Error fetching leave approvals:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Persetujuan Cuti Tim</Text>
        <Text style={styles.headerSubtitle}>
          Tinjau dan putuskan pengajuan izin/cuti bawahan langsung
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Palette.primary]} />}>
        <Text style={styles.sectionTitle}>
          Menunggu Keputusan ({items.filter((i) => i.status === 'pending').length})
        </Text>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Palette.muted} />
            <Text style={styles.emptyText}>Tidak ada antrean pengajuan cuti yang menunggu persetujuan.</Text>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.request_id}
              activeOpacity={0.8}
              onPress={() => router.push(`/manager/leave/${item.request_id}` as any)}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.employeeName}>{item.employee.full_name}</Text>
                    <Text style={styles.employeeCode}>{item.employee.employee_code}</Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </View>

                <View style={styles.leaveTypeRow}>
                  <Ionicons name="calendar-outline" size={16} color={Palette.primary} />
                  <Text style={styles.leaveTypeName}>
                    {item.leave_type_name} • {item.total_days} Hari
                  </Text>
                </View>

                <Text style={styles.dateRange}>
                  {item.start_date} s/d {item.end_date}
                </Text>

                <Text style={styles.reasonText} numberOfLines={2}>
                  Alasan: {item.reason}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.balancePill}>
                    <Text style={styles.balancePillText}>
                      Sisa Cuti: {item.remaining_balance} Hari
                    </Text>
                  </View>
                  <Text style={styles.detailPrompt}>Putuskan →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  employeeName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  employeeCode: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  leaveTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  leaveTypeName: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
  },
  dateRange: {
    ...Typography.caption,
    color: Palette.muted,
    marginBottom: Spacing.two,
  },
  reasonText: {
    ...Typography.caption,
    color: Palette.inkSecondary,
    marginBottom: Spacing.three,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  balancePill: {
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  balancePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  detailPrompt: {
    ...Typography.captionBold,
    color: Palette.primary,
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

