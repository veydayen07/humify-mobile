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

export default function CheckOutScreen() {
  const { user, refreshTodayStatus } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [locationResult, setLocationResult] = useState<LocationValidationResult | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [forceSimulateOffice, setForceSimulateOffice] = useState(true);

  const [isVerifying, setIsVerifying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'error' | 'warning'>('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    checkLocation();
  }, [forceSimulateOffice]);

  const checkLocation = async () => {
    setIsCheckingLocation(true);
    const result = await LocationService.validateGeofence(forceSimulateOffice);
    setLocationResult(result);
    setIsCheckingLocation(false);
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

    if (cameraRef.current && permission?.granted) {
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
          {permission?.granted ? (
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
              <Button title="Beri Izin Kamera" onPress={requestPermission} size="sm" />
            </View>
          )}
        </View>

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
                    ? 'Memeriksa GPS...'
                    : locationResult?.inRange
                    ? `Dalam Area Kantor (${locationResult.distanceMeters}m)`
                    : `Di Luar Area Kantor (${locationResult?.distanceMeters}m)`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={checkLocation} style={styles.refreshLocBtn}>
              <Ionicons name="refresh" size={16} color={Palette.primary} />
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 200,
    height: 250,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#F87171',
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
  },
  refreshLocBtn: {
    padding: Spacing.two,
  },
  bottomBar: {
    marginTop: Spacing.two,
  },
});

