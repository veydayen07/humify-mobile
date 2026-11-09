import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Palette, Spacing, Radii, Typography, OfficeLocationConfig } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertModal } from '@/components/ui/AlertModal';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  LocationService,
  LocationValidationResult,
  setCustomOfficeLocation,
  resetOfficeLocation,
  getEffectiveOfficeLocation,
} from '@/services/location';
import { biometricService } from '@/services/biometric';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SHIFT_OPTIONS = [
  { id: 1, name: 'Shift 1 (Pagi)', hours: '07:00 - 15:00' },
  { id: 2, name: 'Shift 2 (Siang)', hours: '15:00 - 23:00' },
  { id: 3, name: 'Shift 3 (Malam)', hours: '23:00 - 07:00' },
];

export default function CheckInScreen() {
  const { user, isShiftWorker, refreshTodayStatus } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Flow states
  const [selectedShiftId, setSelectedShiftId] = useState<number>(isShiftWorker ? 1 : 1);
  const [locationResult, setLocationResult] = useState<LocationValidationResult | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [forceSimulateOffice, setForceSimulateOffice] = useState(false); // Default to REAL GPS
  const [isCustomOfficeActive, setIsCustomOfficeActive] = useState(false);

  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);

  // Alert Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'error' | 'warning'>('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [simulateMismatch, setSimulateMismatch] = useState(false);

  const fetchLocation = async (simulate = forceSimulateOffice) => {
    setIsCheckingLocation(true);
    const result = await LocationService.validateGeofence(simulate);
    setLocationResult(result);
    setIsCheckingLocation(false);
  };

  // Check real GPS on mount
  useEffect(() => {
    let isMounted = true;
    LocationService.validateGeofence(forceSimulateOffice).then((result) => {
      if (isMounted) {
        setLocationResult(result);
        setIsCheckingLocation(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [forceSimulateOffice]);

  const handleRequestLocationPermission = async () => {
    setIsCheckingLocation(true);
    await LocationService.requestPermissions();
    await fetchLocation();
  };

  const handleSetCurrentAsOffice = () => {
    if (locationResult && locationResult.latitude !== 0) {
      setCustomOfficeLocation(locationResult.latitude, locationResult.longitude, 'Lokasi Uji Presensi Anda');
      setIsCustomOfficeActive(true);
      fetchLocation(false);
    }
  };

  const handleResetOffice = () => {
    resetOfficeLocation();
    setIsCustomOfficeActive(false);
    fetchLocation(false);
  };

  const handleCaptureAndVerify = async () => {
    // 1. Verify location first
    if (!locationResult?.inRange) {
      setModalTitle('Di Luar Area Presensi');
      setModalMessage(
        locationResult?.errorMessage ||
          `Anda berada di luar area kantor yang diizinkan (Radius maksimal ${OfficeLocationConfig.radiusMeters}m).`
      );
      setModalType('error');
      setModalVisible(true);
      return;
    }

    // 2. Camera snap
    setIsVerifying(true);
    let photoUri = 'mock-selfie-uri';

    if (cameraRef.current && cameraPermission?.granted) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        if (photo?.uri) {
          photoUri = photo.uri;
        }
      } catch (camErr) {
        console.warn('Camera takePicture note, using fallback photo:', camErr);
      }
    }

    // 3. TensorFlow Face Biometric Verification
    try {
      const bioResult = await biometricService.verifyFace(
        photoUri,
        user?.employee?.photo_url,
        simulateMismatch
      );

      if (!bioResult.verified) {
        setIsVerifying(false);
        setModalTitle('Verifikasi Wajah Gagal');
        setModalMessage(bioResult.message);
        setModalType('error');
        setModalVisible(true);
        return;
      }

      // 4. API Check-in call
      const checkInRes = await api.checkIn({
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        shift_id: isShiftWorker ? selectedShiftId : 1,
        face_photo_uri: photoUri,
        face_score: bioResult.score,
      });

      await refreshTodayStatus();
      setIsVerifying(false);

      // Navigate to result screen with details
      router.replace({
        pathname: '/attendance/result',
        params: {
          action: 'check-in',
          status: checkInRes.data.status,
          lateMinutes: checkInRes.data.late_minutes || 0,
          faceScore: bioResult.score,
          time: checkInRes.data.check_in_time,
          distance: locationResult.distanceMeters,
        },
      });
    } catch (apiErr: any) {
      setIsVerifying(false);
      setModalTitle('Presensi Belum Berhasil');
      setModalMessage(
        apiErr.message || 'Status presensi belum dapat dipastikan. Periksa koneksi dan coba lagi.'
      );
      setModalType('warning');
      setModalVisible(true);
    }
  };

  const currentOffice = getEffectiveOfficeLocation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Check-in Presensi" showBack />

      <View style={styles.container}>
        {/* Shift Selection (Regular vs Shifting) */}
        <View style={styles.shiftSection}>
          <Text style={styles.sectionHeader}>
            {isShiftWorker ? 'Pilih Shift Anda Hari Ini' : 'Shift Kerja'}
          </Text>
          {isShiftWorker ? (
            <View style={styles.shiftSelectorRow}>
              {SHIFT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.shiftOption,
                    selectedShiftId === s.id && styles.shiftOptionActive,
                  ]}
                  onPress={() => setSelectedShiftId(s.id)}>
                  <Text
                    style={[
                      styles.shiftOptionTitle,
                      selectedShiftId === s.id && styles.shiftOptionTitleActive,
                    ]}>
                    {s.name}
                  </Text>
                  <Text
                    style={[
                      styles.shiftOptionHours,
                      selectedShiftId === s.id && styles.shiftOptionHoursActive,
                    ]}>
                    {s.hours}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.regularShiftBadge}>
              <Ionicons name="briefcase" size={16} color={Palette.primary} />
              <Text style={styles.regularShiftText}>Regular Shift (08:00 - 17:00 WIB)</Text>
            </View>
          )}
        </View>

        {/* Camera View with Face Oval Guide */}
        <View style={styles.cameraContainer}>
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              autofocus="on">
              <View style={styles.cameraOverlay}>
                {/* Face Oval Guide */}
                <View style={styles.faceOval}>
                  <View style={styles.faceOvalInner} />
                </View>
                <Text style={styles.overlayInstruction}>
                  Posisikan wajah Anda tepat di dalam bingkai oval
                </Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionFallback}>
              <Ionicons name="camera-outline" size={48} color={Palette.muted} />
              <Text style={styles.permissionText}>Izin kamera diperlukan untuk verifikasi wajah</Text>
              <Button title="Beri Izin Kamera" onPress={requestCameraPermission} size="sm" />
            </View>
          )}
        </View>

        {/* Geofence & Location Card with Real GPS & Permission Controls */}
        <Card style={styles.locationCard}>
          {/* Permission Not Granted State */}
          {locationResult && !locationResult.permissionGranted ? (
            <View style={styles.permissionDeniedBox}>
              <Ionicons name="warning" size={24} color={Palette.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.permDeniedTitle}>Izin Lokasi Belum Aktif</Text>
                <Text style={styles.permDeniedText}>
                  Humify membutuhkan izin lokasi untuk memvalidasi radius kantor ({OfficeLocationConfig.radiusMeters} meter).
                </Text>
              </View>
              <Button
                title="Beri Izin"
                size="sm"
                variant="danger"
                onPress={handleRequestLocationPermission}
              />
            </View>
          ) : (
            <>
              <View style={styles.locationHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={[styles.statusDot, { backgroundColor: locationResult?.inRange ? Palette.success : Palette.danger }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>
                      {isCheckingLocation
                        ? 'Mencari Koordinat GPS...'
                        : locationResult?.inRange
                        ? 'Lokasi Dalam Radius Kantor'
                        : 'Di Luar Radius Kantor'}
                    </Text>
                    <Text style={styles.locationSubtitle}>
                      {isCheckingLocation
                        ? 'Menghubungkan sensor GPS perangkat...'
                        : `Jarak: ${
                            locationResult?.distanceMeters !== undefined
                              ? locationResult.distanceMeters >= 1000
                                ? (locationResult.distanceMeters / 1000).toFixed(2) + ' km'
                                : `${locationResult.distanceMeters} meter`
                              : '-'
                          } ke ${currentOffice.name} (Maks. ${currentOffice.radiusMeters}m)`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => fetchLocation()} style={styles.refreshLocBtn}>
                  <Ionicons name="refresh" size={18} color={Palette.primary} />
                </TouchableOpacity>
              </View>

              {/* Exact Real GPS Coordinates */}
              {locationResult && locationResult.latitude !== 0 && (
                <View style={styles.coordsRow}>
                  <Ionicons name="navigate-circle-outline" size={14} color={Palette.inkSecondary} />
                  <Text style={styles.coordsText}>
                    GPS: {locationResult.latitude.toFixed(6)}, {locationResult.longitude.toFixed(6)}
                    {locationResult.accuracy ? ` (±${locationResult.accuracy}m)` : ''}
                  </Text>
                </View>
              )}

              {/* Quick Testing Actions (Live Desk as Office or Simulation) */}
              <View style={styles.devTogglesRow}>
                <TouchableOpacity
                  style={[styles.devToggle, isCustomOfficeActive && styles.devToggleActive]}
                  onPress={isCustomOfficeActive ? handleResetOffice : handleSetCurrentAsOffice}>
                  <Ionicons
                    name={isCustomOfficeActive ? 'checkbox' : 'locate-outline'}
                    size={14}
                    color={isCustomOfficeActive ? '#FFF' : Palette.inkSecondary}
                  />
                  <Text style={[styles.devToggleText, isCustomOfficeActive && styles.devToggleTextActive]}>
                    {isCustomOfficeActive ? 'Titik Ini: Kantor' : 'Set Lokasi Saya = Kantor'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devToggle, forceSimulateOffice && styles.devToggleActive]}
                  onPress={() => setForceSimulateOffice(!forceSimulateOffice)}>
                  <Ionicons
                    name={forceSimulateOffice ? 'checkmark-circle' : 'business-outline'}
                    size={14}
                    color={forceSimulateOffice ? '#FFF' : Palette.inkSecondary}
                  />
                  <Text style={[styles.devToggleText, forceSimulateOffice && styles.devToggleTextActive]}>
                    {forceSimulateOffice ? 'Simulasi: Aktif' : 'Simulasi Kantor'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devToggle, simulateMismatch && styles.devToggleDanger]}
                  onPress={() => setSimulateMismatch(!simulateMismatch)}>
                  <Text style={[styles.devToggleText, simulateMismatch && styles.devToggleTextActive]}>
                    {simulateMismatch ? '⚠️ Fail Test' : 'Test Gagal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        {/* Action Button */}
        <View style={styles.bottomBar}>
          <Button
            title={isVerifying ? 'Memverifikasi Wajah...' : 'Ambil Foto & Check-in'}
            icon="scan-outline"
            size="lg"
            loading={isVerifying}
            disabled={isCheckingLocation || !locationResult?.inRange}
            onPress={handleCaptureAndVerify}
          />
        </View>
      </View>

      {/* Alert Modal for Failures */}
      <AlertModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryButtonText="Ambil Ulang"
        onPrimaryPress={() => {
          setModalVisible(false);
          setSimulateMismatch(false);
        }}
        secondaryButtonText="Kembali"
        onSecondaryPress={() => {
          setModalVisible(false);
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
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  shiftSection: {
    marginBottom: Spacing.two,
  },
  sectionHeader: {
    ...Typography.captionBold,
    color: Palette.ink,
    marginBottom: Spacing.two,
  },
  shiftSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shiftOption: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.two,
    alignItems: 'center',
  },
  shiftOptionActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primarySurface,
  },
  shiftOptionTitle: {
    ...Typography.captionBold,
    color: Palette.inkSecondary,
  },
  shiftOptionTitleActive: {
    color: Palette.primaryDark,
  },
  shiftOptionHours: {
    ...Typography.tiny,
    color: Palette.muted,
    marginTop: 2,
  },
  shiftOptionHoursActive: {
    color: Palette.primaryDark,
  },
  regularShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.md,
    borderColor: Palette.primaryBorder,
    borderWidth: 1,
  },
  regularShiftText: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 260,
    marginBottom: Spacing.three,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 200,
    height: 270,
    borderRadius: 135,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOvalInner: {
    width: 190,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.primaryLight,
  },
  overlayInstruction: {
    ...Typography.captionMedium,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radii.full,
    marginTop: Spacing.three,
  },
  permissionFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  permissionText: {
    ...Typography.caption,
    color: Palette.muted,
    textAlign: 'center',
  },
  locationCard: {
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Palette.ink,
  },
  locationSubtitle: {
    ...Typography.caption,
    color: Palette.inkSecondary,
    marginTop: 2,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    marginTop: 6,
  },
  coordsText: {
    ...Typography.tiny,
    color: Palette.inkSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  permissionDeniedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  permDeniedTitle: {
    ...Typography.captionBold,
    color: Palette.danger,
  },
  permDeniedText: {
    ...Typography.tiny,
    color: Palette.inkSecondary,
    marginTop: 2,
  },
  refreshLocBtn: {
    padding: Spacing.two,
    backgroundColor: Palette.primarySurface,
    borderRadius: Radii.full,
  },
  devTogglesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  devToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.borderLight,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  devToggleActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  devToggleDanger: {
    backgroundColor: Palette.danger,
    borderColor: Palette.danger,
  },
  devToggleText: {
    ...Typography.tiny,
    color: Palette.inkSecondary,
    fontWeight: '600',
  },
  devToggleTextActive: {
    color: '#FFF',
  },
  bottomBar: {
    marginTop: Spacing.two,
  },
});
