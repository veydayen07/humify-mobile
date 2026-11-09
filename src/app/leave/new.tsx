import { AlertModal } from "@/components/ui/AlertModal";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { Palette, Radii, Spacing, Typography } from "@/constants/theme";
import { api, LeaveBalance, LeaveType } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${MONTH_NAMES_ID[m] || ""} ${y}`;
  }
  return dateStr;
}

function calculateDayDiff(startStr: string, endStr: string): string {
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const diffMs = e.getTime() - s.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      return `${Math.max(1, diffDays)}.0`;
    }
  } catch {
    // fallback
  }
  return "1.0";
}

export default function NewLeaveScreen() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(1);

  // Form states
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [totalDays, setTotalDays] = useState("1.0");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<{
    uri: string;
    name: string;
  } | null>(null);

  // Date picker modals
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"error" | "success">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [t, b] = await Promise.all([
          api.getLeaveTypes(),
          api.getLeaveBalances(),
        ]);
        setTypes(t);
        setBalances(b);
        if (t.length > 0) setSelectedTypeId(t[0].id);
      } catch (e) {
        console.warn("Error loading master data:", e);
      }
    }
    loadMasterData();
  }, []);

  const selectedType = types.find((t) => t.id === selectedTypeId);
  const currentBalance = balances.find(
    (b) => b.leave_type_id === selectedTypeId,
  );

  const handlePickAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAttachment({
          uri: res.assets[0].uri,
          name: res.assets[0].name,
        });
      }
    } catch (e) {
      console.warn("Document picker note:", e);
    }
  };

  const handleSelectStartDate = (selected: string) => {
    setStartDate(selected);
    setShowStartPicker(false);
    if (new Date(selected) > new Date(endDate)) {
      setEndDate(selected);
      setTotalDays("1.0");
    } else {
      setTotalDays(calculateDayDiff(selected, endDate));
    }
  };

  const handleSelectEndDate = (selected: string) => {
    setEndDate(selected);
    setShowEndPicker(false);
    setTotalDays(calculateDayDiff(startDate, selected));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setModalType("error");
      setModalTitle("Validasi Gagal");
      setModalMessage("Alasan pengajuan wajib diisi.");
      setModalVisible(true);
      return;
    }

    if (selectedType?.requires_attachment && !attachment) {
      setModalType("error");
      setModalTitle("Lampiran Diperlukan");
      setModalMessage(
        `Pengajuan jenis ${selectedType.name} wajib menyertakan surat dokter atau bukti lampiran.`,
      );
      setModalVisible(true);
      return;
    }

    const daysNum = parseFloat(totalDays) || 1;
    if (currentBalance && daysNum > currentBalance.remaining_days) {
      setModalType("error");
      setModalTitle("Saldo Tidak Mencukupi");
      setModalMessage(
        `Sisa saldo ${selectedType?.name} Anda (${currentBalance.remaining_days} hari) tidak mencukupi untuk ${daysNum} hari yang diajukan.`,
      );
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.submitLeaveRequest({
        leave_type_id: selectedTypeId,
        start_date: startDate,
        end_date: endDate,
        total_days: daysNum,
        reason: reason.trim(),
        attachment_uri: attachment?.uri,
      });

      setIsSubmitting(false);
      setModalType("success");
      setModalTitle("Pengajuan Berhasil");
      setModalMessage(
        res.message ||
          "Pengajuan cuti berhasil diajukan dan sedang menunggu persetujuan atasan.",
      );
      setModalVisible(true);
    } catch (err: any) {
      setIsSubmitting(false);
      setModalType("error");
      setModalTitle("Pengajuan Gagal");
      setModalMessage(
        err.message || "Terjadi kesalahan saat mengirim pengajuan.",
      );
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Ajukan Izin / Cuti" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Leave Type Selector */}
          <Text style={styles.inputLabel}>Jenis Pengajuan</Text>
          <View style={styles.typeOptionsRow}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.typeOption,
                  selectedTypeId === t.id && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedTypeId(t.id)}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedTypeId === t.id && styles.typeOptionTextActive,
                  ]}
                >
                  {t.name}
                </Text>
                {t.requires_attachment && (
                  <Text style={styles.requiredBadge}>Lampiran Wajib</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Balance info banner */}
          {currentBalance && (
            <View style={styles.balanceInfoBox}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Palette.primary}
              />
              <Text style={styles.balanceInfoText}>
                Sisa saldo Anda:{" "}
                <Text style={{ fontWeight: "700" }}>
                  {currentBalance.remaining_days} hari
                </Text>{" "}
                dari kuota {currentBalance.total_days} hari.
              </Text>
            </View>
          )}

          {/* Interactive Date Range Pickers */}
          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.inputLabel}>Tanggal Mulai</Text>
              <TouchableOpacity
                style={styles.datePickerCard}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Palette.primary}
                />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.datePrimaryText}>
                    {formatDisplayDate(startDate)}
                  </Text>
                  <Text style={styles.dateSecondaryText}>{startDate}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.dateCol}>
              <Text style={styles.inputLabel}>Tanggal Selesai</Text>
              <TouchableOpacity
                style={styles.datePickerCard}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Palette.primary}
                />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.datePrimaryText}>
                    {formatDisplayDate(endDate)}
                  </Text>
                  <Text style={styles.dateSecondaryText}>{endDate}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Days */}
          <View style={styles.inputGroup}>
            <View style={styles.totalDaysHeader}>
              <Text style={styles.inputLabel}>Total Hari Kerja</Text>
              <Text style={styles.autoCalcBadge}>Dihitung otomatis</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color={Palette.muted} />
              <TextInput
                style={styles.textInput}
                value={totalDays}
                onChangeText={setTotalDays}
                keyboardType="numeric"
                placeholder="Contoh: 2.0"
                placeholderTextColor={Palette.muted}
              />
              <Text style={styles.inputSuffix}>Hari</Text>
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alasan / Keterangan</Text>
            <TextInput
              style={styles.textArea}
              value={reason}
              onChangeText={setReason}
              placeholder="Jelaskan keperluan atau alasan pengajuan secara jelas..."
              placeholderTextColor={Palette.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Attachment Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Lampiran Pendukung{" "}
              {selectedType?.requires_attachment ? "(Wajib)" : "(Opsional)"}
            </Text>
            {attachment ? (
              <View style={styles.attachmentPreview}>
                <Ionicons
                  name="document-attach"
                  size={20}
                  color={Palette.primary}
                />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <TouchableOpacity onPress={() => setAttachment(null)}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={Palette.danger}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handlePickAttachment}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={28}
                  color={Palette.primary}
                />
                <Text style={styles.uploadText}>
                  Unggah Berkas / Foto Surat Dokter
                </Text>
                <Text style={styles.uploadSubtext}>
                  Format PDF, JPG, PNG (Maks. 5MB)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title="Kirimkan Pengajuan"
            size="lg"
            loading={isSubmitting}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Interactive Calendar Modals */}
      <DatePickerModal
        visible={showStartPicker}
        value={startDate}
        title="Pilih Tanggal Mulai Cuti"
        onSelect={handleSelectStartDate}
        onClose={() => setShowStartPicker(false)}
      />

      <DatePickerModal
        visible={showEndPicker}
        value={endDate}
        minDate={startDate}
        title="Pilih Tanggal Selesai Cuti"
        onSelect={handleSelectEndDate}
        onClose={() => setShowEndPicker(false)}
      />

      {/* Confirmation & Result Alert */}
      <AlertModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryButtonText={
          modalType === "success" ? "Lihat Riwayat" : "Perbaiki"
        }
        onPrimaryPress={() => {
          setModalVisible(false);
          if (modalType === "success") {
            router.back();
          }
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
  inputLabel: {
    ...Typography.captionBold,
    color: Palette.ink,
    marginBottom: Spacing.two,
  },
  typeOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  typeOption: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
    alignItems: "center",
  },
  typeOptionActive: {
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primary,
  },
  typeOptionText: {
    ...Typography.captionBold,
    color: Palette.inkSecondary,
  },
  typeOptionTextActive: {
    color: Palette.primaryDark,
  },
  requiredBadge: {
    fontSize: 9,
    color: Palette.danger,
    marginTop: 2,
    fontWeight: "600",
  },
  balanceInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Palette.primarySurface,
    borderRadius: Radii.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  balanceInfoText: {
    ...Typography.caption,
    color: Palette.primaryDark,
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  dateCol: {
    flex: 1,
  },
  datePickerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    height: 54,
  },
  dateTextContainer: {
    flex: 1,
  },
  datePrimaryText: {
    ...Typography.bodyMedium,
    fontWeight: "600",
    color: Palette.ink,
  },
  dateSecondaryText: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  totalDaysHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  autoCalcBadge: {
    ...Typography.tiny,
    color: Palette.primary,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: Palette.ink,
  },
  inputSuffix: {
    ...Typography.captionMedium,
    color: Palette.muted,
  },
  textArea: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    padding: Spacing.three,
    height: 100,
    fontSize: 14,
    color: Palette.ink,
  },
  uploadBox: {
    backgroundColor: Palette.surface,
    borderColor: Palette.primaryBorder,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radii.lg,
    padding: Spacing.five,
    alignItems: "center",
    gap: 4,
  },
  uploadText: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
  },
  uploadSubtext: {
    ...Typography.tiny,
    color: Palette.muted,
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Palette.primarySurface,
    padding: Spacing.three,
    borderRadius: Radii.md,
    borderColor: Palette.primaryBorder,
    borderWidth: 1,
  },
  attachmentName: {
    flex: 1,
    ...Typography.captionMedium,
    color: Palette.primaryDark,
  },
  submitBtn: {
    marginTop: Spacing.two,
  },
});
