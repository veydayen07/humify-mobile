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

export default function CheckOutScreen() {
  const { user, refreshTodayStatus } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [locationResult, setLocationResult] = useState<LocationValidationResult | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [forceSimulateOffice, setForceSimulateOffice] = useState(false);
  const [isCustomOfficeActive, setIsCustomOfficeActive] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'error' | 'warning'>('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const fetchLocation = async (simulate = forceSimulateOffice) => {
    setIsCheckingLocation(true);
    const result = await LocationService.validateGeofence(simulate);
    setLocationResult(result);
    setIsCheckingLocation(false);
  };

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

  const handleCaptureAndCheckOut = async () => {
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

    setIsVerifying(true);
    let photoUri = 'mock-selfie-checkout-uri';

    if (cameraRef.current && cameraPermission?.granted) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        if (photo?.uri) photoUri = photo.uri;
      } catch (camErr) {
        console.warn('Camera takePicture note:', camErr);
      }
    }

    try {
      const bioResult = await biometricService.verifyFace(
        photoUri,
        user?.employee?.photo_url
      );

      if (!bioResult.verified) {
        setIsVerifying(false);
        setModalTitle('Verifikasi Wajah Gagal');
        setModalMessage(bioResult.message);
        setModalType('error');
        setModalVisible(true);
        return;
      }

      const checkOutRes = await api.checkOut({
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        face_photo_uri: photoUri,
        face_score: bioResult.score,
      });

      await refreshTodayStatus();
      setIsVerifying(false);

      router.replace({
        pathname: '/attendance/result',
        params: {
          action: 'check-out',
          status: 'disetujui',
          time: checkOutRes.data.check_out_time,
          faceScore: bioResult.score,
          distance: locationResult.distanceMeters,
        },
      });
    } catch (apiErr: any) {
      setIsVerifying(false);
      setModalTitle('Check-out Belum Berhasil');
      setModalMessage(apiErr.message || 'Gagal menyimpan check-out.');
      setModalType('warning');
      setModalVisible(true);
    }
  };

  const currentOffice = getEffectiveOfficeLocation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Check-out Presensi" showBack />

      <View style={styles.container}>
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={18} color="#B91C1C" />
          <Text style={styles.noticeText}>
            Pastikan pekerjaan hari ini telah diselesaikan sebelum melakukan absen pulang.
          </Text>
        </View>

        <View style={styles.cameraContainer}>
          {cameraPermission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" autofocus="on">
              <View style={styles.cameraOverlay}>
                <View style={styles.faceOval}>
                  <View style={styles.faceOvalInner} />
                </View>
                <Text style={styles.overlayInstruction}>Posisikan wajah Anda di dalam bingkai</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionFallback}>
              <Ionicons name="camera-outline" size={48} color={Palette.muted} />
              <Text style={styles.permissionText}>Izin kamera diperlukan</Text>
              <Button title="Beri Izin Kamera" onPress={requestCameraPermission} size="sm" />
            </View>
          )}
        </View>

        <Card style={styles.locationCard}>
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

              {/* Quick Testing Actions */}
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
              </View>
            </>
          )}
        </Card>

        <View style={styles.bottomBar}>
          <Button
            title={isVerifying ? 'Memverifikasi...' : 'Ambil Foto & Check-out Pulang'}
            icon="log-out-outline"
            size="lg"
            variant="danger"
            loading={isVerifying}
            disabled={isCheckingLocation || !locationResult?.inRange}
            onPress={handleCaptureAndCheckOut}
          />
        </View>
      </View>

      <AlertModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryButtonText="Coba Lagi"
        onPrimaryPress={() => setModalVisible(false)}
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  noticeText: {
    ...Typography.captionMedium,
    color: '#991B1B',
    flex: 1,
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
