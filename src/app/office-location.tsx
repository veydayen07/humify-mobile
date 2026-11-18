import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Palette, Spacing, Radii } from "@/constants/theme";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api, OfficeLocation } from "@/services/api";
import { setCustomOfficeLocation } from "@/services/location";
import * as Location from "expo-location";

export default function OfficeLocationScreen() {
  const { isHR } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Form states
  const [officeName, setOfficeName] = useState("Humify Head Office");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load current office location from database via API on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchOfficeLocation() {
      try {
        const data: OfficeLocation = await api.getOfficeLocation();
        if (isMounted && data) {
          setOfficeName(data.name || "Humify Head Office");
          setAddress(data.address || "");
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          setRadiusMeters(data.radius_meters || 100);
          setLastUpdated(data.updated_at || null);
        }
      } catch (e: any) {
        console.warn("Error loading office location:", e);
        if (isMounted) {
          Alert.alert(
            "Perhatian",
            "Gagal memuat konfigurasi lokasi kantor dari server.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOfficeLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Use mobile phone GPS location directly
  const detectCurrentLocation = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Lokasi Diperlukan",
          "Mohon izinkan akses lokasi pada perangkat HP Anda agar sistem dapat membaca titik koordinat kantor secara otomatis.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      setGpsAccuracy(
        position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
      );

      // Reverse geocode to get street address automatically
      try {
        const reverseResults = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (reverseResults && reverseResults.length > 0) {
          const r = reverseResults[0];
          const parts = [
            r.name,
            r.street,
            r.district || r.subregion,
            r.city,
            r.region,
          ].filter(Boolean);
          const fullAddr = parts.join(", ");
          if (fullAddr) {
            setAddress(fullAddr);
          }
        }
      } catch {
        // reverse geocoding is optional, ignore if offline
      }

      Alert.alert(
        "Sukses",
        "Titik koordinat berhasil diambil langsung dari GPS ponsel Anda!",
      );
    } catch (e: any) {
      Alert.alert(
        "Gagal Membaca GPS",
        e.message || "Pastikan GPS HP Anda aktif.",
      );
    } finally {
      setDetectingGps(false);
    }
  };

  // Submit and duplicate to all departments in 1 single database query
  const handleSave = async () => {
    if (latitude === null || longitude === null) {
      Alert.alert(
        "Validasi",
        'Koordinat lokasi belum terisi. Tekan tombol "Ambil Lokasi GPS HP" terlebih dahulu.',
      );
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateOfficeLocation({
        name: officeName.trim() || "Kantor Pusat",
        address: address.trim() || "Lokasi Terdaftar",
        latitude,
        longitude,
        radius_meters: radiusMeters,
      });

      setLastUpdated(res.data?.updated_at || new Date().toISOString());
      setCustomOfficeLocation(
        latitude,
        longitude,
        officeName.trim() || "Kantor Pusat",
        radiusMeters,
      );
      Alert.alert(
        "Berhasil Disimpan",
        "Titik lokasi kantor telah berhasil diperbarui dan disinkronkan ke SELURUH departemen dalam 1 kali query database.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert(
        "Gagal Menyimpan",
        e.message || "Terjadi kesalahan saat menyimpan lokasi ke server.",
      );
    } finally {
      setSaving(false);
    }
  };

  // If user is not HR, restrict access
  if (!isHR) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          title="Pengaturan Lokasi"
          showBack
          onBack={() => router.back()}
        />
        <View style={styles.restrictedContainer}>
          <Ionicons name="shield-outline" size={64} color={Palette.danger} />
          <Text style={styles.restrictedTitle}>Akses Dibatasi</Text>
          <Text style={styles.restrictedDesc}>
            Fitur pengaturan lokasi kantor hanya dapat diakses oleh
            Administrator HR atau Super Admin.
          </Text>
          <Button
            title="Kembali ke Beranda"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.four }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Pengaturan Lokasi Kantor"
        subtitle="Khusus Administrator HR"
        showBack
        onBack={() => router.back()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>
            Memuat konfigurasi lokasi dari database...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Info Banner: Cara Ke-2 (Sinkron ke seluruh departemen) */}
          <Card style={styles.infoBanner}>
            <View style={styles.infoBannerRow}>
              <Ionicons name="information-circle" size={24} color="#1D4ED8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBannerTitle}>
                  Konfigurasi Kantor Terpusat
                </Text>
                <Text style={styles.infoBannerDesc}>
                  Anda cukup mengatur lokasi ini{" "}
                  <Text style={{ fontWeight: "700" }}>satu kali</Text>. Saat
                  disimpan, koordinat akan otomatis diterapkan ke seluruh
                  departemen di perusahaan.
                </Text>
              </View>
            </View>
          </Card>

          {/* Action Button: GPS Mobile Phone */}
          <Card style={styles.gpsActionCard}>
            <Text style={styles.cardSectionTitle}>
              Deteksi Lokasi Melalui HP
            </Text>
            <Text style={styles.gpsHelpText}>
              Berdirilah di area kantor Anda, lalu tekan tombol di bawah ini.
              Ponsel akan mendeteksi koordinat latitude & longitude secara
              akurat dan otomatis.
            </Text>

            <TouchableOpacity
              style={[
                styles.detectBtn,
                detectingGps && styles.detectBtnDisabled,
              ]}
              onPress={detectCurrentLocation}
              disabled={detectingGps}
              activeOpacity={0.85}
            >
              {detectingGps ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.detectBtnText}>
                    Membaca Sinyal Satelit GPS...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={22} color="#FFFFFF" />
                  <Text style={styles.detectBtnText}>
                    📍 Ambil Lokasi GPS HP Saat Ini
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {gpsAccuracy !== null && (
              <View style={styles.accuracyPill}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Palette.success}
                />
                <Text style={styles.accuracyText}>
                  Akurasi sinyal GPS: ±{gpsAccuracy} meter
                </Text>
              </View>
            )}
          </Card>

          {/* Form Fields Card */}
          <Card style={styles.formCard}>
            <Text style={styles.cardSectionTitle}>Detail Titik Koordinat</Text>

            {/* Nama Kantor */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lokasi / Kantor</Text>
              <TextInput
                style={styles.textInput}
                value={officeName}
                onChangeText={setOfficeName}
                placeholder="Contoh: Kantor Pusat Humify"
                placeholderTextColor={Palette.muted}
              />
            </View>

            {/* Koordinat Display */}
            <View style={styles.coordRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <View style={styles.readOnlyInput}>
                  <Text
                    style={
                      latitude !== null
                        ? styles.coordValue
                        : styles.coordPlaceholder
                    }
                  >
                    {latitude !== null
                      ? latitude.toFixed(7)
                      : "Belum terdeteksi"}
                  </Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <View style={styles.readOnlyInput}>
                  <Text
                    style={
                      longitude !== null
                        ? styles.coordValue
                        : styles.coordPlaceholder
                    }
                  >
                    {longitude !== null
                      ? longitude.toFixed(7)
                      : "Belum terdeteksi"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Alamat Hasil Geocode */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Otomatis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Alamat akan terisi otomatis dari GPS, atau ketik manual..."
                placeholderTextColor={Palette.muted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Radius Geofence Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Radius Batas Presensi (Geofence)
              </Text>
              <Text style={styles.inputSubLabel}>
                Jarak maksimal karyawan dari titik kantor saat melakukan
                check-in:
              </Text>

              <View style={styles.radiusPillsRow}>
                {[50, 100, 150, 200, 300].map((r) => {
                  const selected = radiusMeters === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.radiusPill,
                        selected && styles.radiusPillSelected,
                      ]}
                      onPress={() => setRadiusMeters(r)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.radiusPillText,
                          selected && styles.radiusPillTextSelected,
                        ]}
                      >
                        {r} m {r === 100 ? "⭐" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {lastUpdated && (
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={Palette.muted} />
                <Text style={styles.metaText}>
                  Terakhir diperbarui:{" "}
                  {new Date(lastUpdated).toLocaleString("id-ID")}
                </Text>
              </View>
            )}
          </Card>

          {/* Submit Button */}
          <Button
            title={
              saving
                ? "Menyinkronkan ke Database..."
                : "💾 Simpan & Terapkan ke Seluruh Departemen"
            }
            size="lg"
            variant="primary"
            onPress={handleSave}
            loading={saving}
            disabled={saving || latitude === null}
            style={styles.saveBtn}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
  },
  loadingText: {
    fontSize: 14,
    color: Palette.muted,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
    gap: Spacing.four,
  },
  infoBanner: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
  },
  infoBannerRow: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "flex-start",
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  infoBannerDesc: {
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 18,
  },
  gpsActionCard: {
    gap: Spacing.three,
    borderColor: "#C7D2FE",
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
  },
  gpsHelpText: {
    fontSize: 13,
    color: Palette.muted,
    lineHeight: 19,
  },
  detectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: Spacing.three,
    borderRadius: Radii.md,
    gap: Spacing.two,
    elevation: 2,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  detectBtnDisabled: {
    opacity: 0.6,
  },
  detectBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  accuracyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: "#ECFDF5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    alignSelf: "flex-start",
  },
  accuracyText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
  },
  formCard: {
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  inputSubLabel: {
    fontSize: 12,
    color: Palette.muted,
    marginBottom: Spacing.one,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === "ios" ? Spacing.two : 8,
    fontSize: 14,
    color: Palette.ink,
    backgroundColor: Palette.surface,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  coordRow: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  coordValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  coordPlaceholder: {
    fontSize: 12,
    color: Palette.muted,
    fontStyle: "italic",
  },
  radiusPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  radiusPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  radiusPillSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  radiusPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  radiusPillTextSelected: {
    color: "#FFFFFF",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  metaText: {
    fontSize: 11,
    color: Palette.muted,
  },
  saveBtn: {
    marginTop: Spacing.two,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.six,
    gap: Spacing.three,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Palette.danger,
  },
  restrictedDesc: {
    fontSize: 14,
    color: Palette.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
