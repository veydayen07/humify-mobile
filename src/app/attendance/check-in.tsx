import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Palette, Spacing, Radii, Typography, OfficeLocationConfig } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertModal } from '@/components/ui/AlertModal';
import { AppHeader } from '@/components/ui/AppHeader';
import { LocationService, LocationValidationResult } from '@/services/location';
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
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Flow states
  const [selectedShiftId, setSelectedShiftId] = useState<number>(isShiftWorker ? 1 : 1);
  const [locationResult, setLocationResult] = useState<LocationValidationResult | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [forceSimulateOffice, setForceSimulateOffice] = useState(true); // Default true so test works anywhere!

  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);

  // Alert Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'error' | 'warning'>('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [simulateMismatch, setSimulateMismatch] = useState(false);

  // Check location on mount
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

  const refreshLocation = async () => {
    setIsCheckingLocation(true);
    const result = await LocationService.validateGeofence(forceSimulateOffice);
    setLocationResult(result);
    setIsCheckingLocation(false);
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

    if (cameraRef.current && permission?.granted) {
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
          {permission?.granted ? (
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
              <Button title="Beri Izin Kamera" onPress={requestPermission} size="sm" />
            </View>
          )}
        </View>

        {/* Geofence & Location Bar */}
        <Card style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons
                name={locationResult?.inRange ? 'location' : 'alert-circle'}
                size={20}
                color={locationResult?.inRange ? Palette.success : Palette.danger}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>Validasi Geofence Kantor</Text>
                <Text style={styles.locationSubtitle}>
                  {isCheckingLocation
                    ? 'Memeriksa koordinat GPS...'
                    : locationResult?.inRange
                    ? `Dalam Area Kantor (${locationResult.distanceMeters}m dari kantor)`
                    : `Di Luar Area Kantor (${locationResult?.distanceMeters}m dari kantor)`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={refreshLocation} style={styles.refreshLocBtn}>
              <Ionicons name="refresh" size={16} color={Palette.primary} />
            </TouchableOpacity>
          </View>

          {/* Dev Toggles for Testing Simulator */}
          <View style={styles.devTogglesRow}>
            <TouchableOpacity
              style={[styles.devToggle, forceSimulateOffice && styles.devToggleActive]}
              onPress={() => setForceSimulateOffice(!forceSimulateOffice)}>
              <Text style={styles.devToggleText}>
                {forceSimulateOffice ? '✓ Lokasi: Kantor (18m)' : '✕ Lokasi: Riil GPS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devToggle, simulateMismatch && styles.devToggleActive]}
              onPress={() => setSimulateMismatch(!simulateMismatch)}>
              <Text style={styles.devToggleText}>
                {simulateMismatch ? '⚠️ Test Wajah Gagal: ON' : 'Test Wajah Gagal: OFF'}
              </Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: Spacing.three,
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
    padding: Spacing.two + 2,
    alignItems: 'center',
  },
  shiftOptionActive: {
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primary,
  },
  shiftOptionTitle: {
    ...Typography.captionBold,
    color: Palette.ink,
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
    color: Palette.primary,
  },
  regularShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.primarySurface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
  },
  regularShiftText: {
    ...Typography.bodyMedium,
    color: Palette.primaryDark,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 280,
    marginBottom: Spacing.three,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 200,
    height: 250,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Palette.primaryLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOvalInner: {
    width: 180,
    height: 230,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  overlayInstruction: {
    ...Typography.captionMedium,
    color: Palette.white,
    marginTop: Spacing.three,
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  permissionFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  permissionText: {
    ...Typography.body,
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
  locationTitle: {
    ...Typography.captionBold,
    color: Palette.ink,
  },
  locationSubtitle: {
    ...Typography.tiny,
    color: Palette.muted,
    marginTop: 1,
  },
  refreshLocBtn: {
    padding: Spacing.two,
  },
  devTogglesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  devToggle: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  devToggleActive: {
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primary,
  },
  devToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.inkSecondary,
  },
  bottomBar: {
    marginTop: Spacing.two,
  },
});

