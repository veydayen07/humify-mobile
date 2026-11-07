import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api, ManagerAttendanceItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

export default function ManagerAttendanceScreen() {
  const [items, setItems] = useState<ManagerAttendanceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.getManagerAttendanceReviews(searchQuery);
      setItems(data);
    } catch (e) {
      console.warn('Error fetching manager reviews:', e);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery]);

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
        <Text style={styles.headerTitle}>Review Presensi Tim</Text>
        <Text style={styles.headerSubtitle}>
          Verifikasi keabsahan presensi dan biometrik bawahan langsung
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={Palette.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama karyawan atau NIP..."
            placeholderTextColor={Palette.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Palette.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Palette.primary]} />}>
        <Text style={styles.sectionTitle}>
          Menunggu Tinjauan ({items.filter((i) => i.review_status === 'pending').length})
        </Text>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={Palette.muted} />
            <Text style={styles.emptyText}>Semua presensi telah selesai ditinjau.</Text>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.attendance_id}
              activeOpacity={0.8}
              onPress={() => router.push(`/manager/attendance/${item.attendance_id}` as any)}>
              <Card style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.employeeInfo}>
                    {item.photo_url ? (
                      <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Ionicons name="person" size={20} color={Palette.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.employeeName}>{item.employee.full_name}</Text>
                      <Text style={styles.employeeCode}>{item.employee.employee_code}</Text>
                    </View>
                  </View>
                  <StatusBadge status={item.review_status} size="sm" />
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Waktu Masuk</Text>
                    <Text style={styles.infoValue}>
                      {item.check_in_time ? item.check_in_time.substring(0, 5) : '--:--'}
                    </Text>
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>AI Face Score</Text>
                    <View style={styles.scoreBadge}>
                      <Ionicons name="scan" size={12} color={Palette.primary} />
                      <Text style={styles.scoreText}>{item.face_score}%</Text>
                    </View>
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Status Kehadiran</Text>
                    <StatusBadge status={item.status} size="sm" />
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{item.attendance_date}</Text>
                  <Text style={styles.actionPrompt}>Tinjau Presensi →</Text>
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
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.background,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.ink,
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  employeeCode: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Palette.background,
    borderRadius: Radii.md,
    padding: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  infoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: Palette.muted,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.captionBold,
    color: Palette.ink,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scoreText: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  actionPrompt: {
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

