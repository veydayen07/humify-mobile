import { AlertModal } from "@/components/ui/AlertModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Palette, Radii, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, faceRegistered, logout, switchDemoAccount, updateUser } =
    useAuth();

  // Edit contact modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [phone, setPhone] = useState(user?.employee?.phone || "");
  const [email, setEmail] = useState(user?.employee?.email || "");
  const [address, setAddress] = useState(user?.employee?.address || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Logout modal
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const emp = user?.employee;

  const handleOpenEdit = () => {
    setPhone(emp?.phone || "");
    setEmail(emp?.email || "");
    setAddress(emp?.address || "");
    setEditModalVisible(true);
  };

  const handleSaveContact = async () => {
    setIsUpdating(true);
    try {
      await api.updateProfile({
        phone,
        email,
        address,
      });
      if (user && user.employee) {
        updateUser({
          ...user,
          employee: {
            ...user.employee,
            phone,
            email,
            address,
          },
        });
      }
      setIsUpdating(false);
      setEditModalVisible(false);
    } catch (e: any) {
      setIsUpdating(false);
      alert(e.message || "Gagal memperbarui profil.");
    }
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <Text style={styles.headerSubtitle}>
          Data kepegawaian dan informasi akun
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.card}>
          <View style={styles.avatarRow}>
            {emp?.photo_url ? (
              <Image
                source={{ uri: emp.photo_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color={Palette.primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {emp?.full_name || user?.username || "Karyawan"}
              </Text>
              <Text style={styles.empCode}>
                {emp?.employee_code || "EMP-001"}
              </Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>
                  {user?.role === "manager"
                    ? "Manager"
                    : user?.role === "admin_hr"
                      ? "Admin HRD"
                      : "Karyawan"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Reference Face Status Card (PRD M06 / M13 Rule) */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Status Wajah Acuan Biometrik</Text>
          {faceRegistered ? (
            <View style={styles.faceRegisteredBox}>
              <View style={styles.faceRegisteredHeader}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Palette.success}
                />
                <Text style={styles.faceRegisteredTitle}>
                  Wajah Acuan Terdaftar & Aktif
                </Text>
              </View>
              <Text style={styles.faceRegisteredNote}>
                Untuk menjaga integritas presensi, foto wajah acuan tidak dapat
                diubah sendiri. Untuk memperbarui foto wajah, silakan hubungi
                tim HRD.
              </Text>
            </View>
          ) : (
            <View style={styles.faceUnregisteredBox}>
              <View style={styles.faceRegisteredHeader}>
                <Ionicons name="warning" size={20} color={Palette.warning} />
                <Text style={styles.faceUnregisteredTitle}>
                  Wajah Acuan Belum Terdaftar
                </Text>
              </View>
              <Text style={styles.faceRegisteredNote}>
                Anda belum dapat melakukan presensi. Silakan daftarkan wajah
                acuan Anda terlebih dahulu.
              </Text>
              <Button
                title="Daftarkan Wajah Sekarang"
                icon="camera"
                size="sm"
                onPress={() => router.push("/face-registration")}
                style={{ marginTop: Spacing.two }}
              />
            </View>
          )}
        </Card>

        {/* Employment Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Kepegawaian</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departemen</Text>
            <Text style={styles.infoValue}>
              {emp?.department?.name || "Product Design"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jabatan</Text>
            <Text style={styles.infoValue}>
              {emp?.position?.name || "Product Designer"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Atasan Langsung</Text>
            <Text style={styles.infoValue}>
              {emp?.supervisor?.full_name || "Maya Chen"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Kerja</Text>
            <Text style={styles.infoValueBold}>
              {emp?.employment_type === "tetap" ? "Karyawan Tetap" : "Kontrak"}{" "}
              ({emp?.employee_status || "Aktif"})
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kategori Jadwal</Text>
            <Text style={styles.infoValue}>
              {emp?.is_shift_worker
                ? "Shifting Worker"
                : "Regular Office Hours"}
            </Text>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.card}>
          <View style={styles.contactHeader}>
            <Text style={styles.sectionTitle}>Data Kontak Personal</Text>
            <TouchableOpacity onPress={handleOpenEdit} style={styles.editBtn}>
              <Ionicons
                name="create-outline"
                size={16}
                color={Palette.primary}
              />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Telepon</Text>
            <Text style={styles.infoValue}>{emp?.phone || "081234567001"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {emp?.email || "alex.morgan@humify.test"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat Domisili</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: "right" }]}>
              {emp?.address || "Jl. Nakula 6"}
            </Text>
          </View>
        </Card>

        {/* Switch Account (Demo Simulator) */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>
            Ganti Akun Demo (Uji Coba Cepat)
          </Text>
          <View style={styles.demoButtonsGrid}>
            <Button
              title="Alex (Karyawan Regular)"
              variant="outline"
              size="sm"
              onPress={() => switchDemoAccount("alex.morgan")}
            />
            <Button
              title="Budi (Shifting / No Face)"
              variant="outline"
              size="sm"
              onPress={() => switchDemoAccount("budi.santoso")}
            />
            <Button
              title="Maya (Manager)"
              variant="outline"
              size="sm"
              onPress={() => switchDemoAccount("maya.chen")}
            />
            <Button
              title="Dewi (Admin HR)"
              variant="outline"
              size="sm"
              onPress={() => switchDemoAccount("admin.hr")}
            />
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Keluar dari Akun"
          variant="outline"
          icon="log-out-outline"
          size="lg"
          textStyle={{ color: Palette.danger }}
          style={{ borderColor: Palette.dangerBorder, marginTop: Spacing.two }}
          onPress={() => setLogoutModalVisible(true)}
        />
      </ScrollView>

      {/* Edit Contact Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Perbarui Kontak Personal</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Palette.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Nomor Telepon</Text>
              <TextInput
                style={styles.modalInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Alamat Domisili</Text>
              <TextInput
                style={[styles.modalInput, { height: 70 }]}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Simpan"
                loading={isUpdating}
                onPress={handleSaveContact}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <AlertModal
        visible={logoutModalVisible}
        type="confirm"
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari aplikasi Humify?"
        primaryButtonText="Ya, Keluar"
        onPrimaryPress={handleLogout}
        secondaryButtonText="Batal"
        onSecondaryPress={() => setLogoutModalVisible(false)}
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
  card: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.four,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...Typography.h3,
    color: Palette.ink,
  },
  empCode: {
    ...Typography.caption,
    color: Palette.muted,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: "flex-start",
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    marginTop: 6,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.primaryDark,
  },
  sectionTitle: {
    ...Typography.captionBold,
    color: Palette.ink,
    marginBottom: Spacing.three,
  },
  faceRegisteredBox: {
    backgroundColor: Palette.successSurface,
    borderColor: Palette.successBorder,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
  },
  faceRegisteredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  faceRegisteredTitle: {
    ...Typography.captionBold,
    color: Palette.successText,
  },
  faceRegisteredNote: {
    ...Typography.tiny,
    color: Palette.muted,
    lineHeight: 16,
  },
  faceUnregisteredBox: {
    backgroundColor: Palette.warningSurface,
    borderColor: Palette.warningBorder,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
  },
  faceUnregisteredTitle: {
    ...Typography.captionBold,
    color: Palette.warningText,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    ...Typography.caption,
    color: Palette.muted,
  },
  infoValue: {
    ...Typography.captionMedium,
    color: Palette.ink,
  },
  infoValueBold: {
    ...Typography.captionBold,
    color: Palette.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginVertical: 4,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editText: {
    ...Typography.captionBold,
    color: Palette.primary,
  },
  demoButtonsGrid: {
    gap: Spacing.two,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    padding: Spacing.five,
  },
  modalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  modalTitle: {
    ...Typography.h3,
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  modalLabel: {
    ...Typography.captionBold,
    color: Palette.ink,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    padding: Spacing.three,
    fontSize: 14,
    color: Palette.ink,
    backgroundColor: Palette.background,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
});
