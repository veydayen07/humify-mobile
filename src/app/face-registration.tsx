import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Palette, Spacing, Radii, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppHeader } from '@/components/ui/AppHeader';
import { AlertModal } from '@/components/ui/AlertModal';
import { biometricService } from '@/services/biometric';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function FaceRegistrationScreen() {
  const { user, faceRegistered, updateUser } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'error' | 'success'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handleCapture = async () => {
    if (cameraRef.current && permission?.granted) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        if (photo?.uri) {
          setPreviewUri(photo.uri);
        }
      } catch {
        setPreviewUri('mock-face-ref-uri');
      }
    } else {
      setPreviewUri('mock-face-ref-uri');
    }
  };

  const handleSaveReference = async () => {
    if (!previewUri) return;
    setIsProcessing(true);

    try {
      const bioRes = await biometricService.registerFace(previewUri);
      if (!bioRes.success) {
        setIsProcessing(false);
        setModalType('error');
        setModalTitle('Registrasi Gagal');
        setModalMessage(bioRes.message);
        setModalVisible(true);
        return;
      }

      await api.registerFacePhoto(previewUri);
      if (user) {
        updateUser({
          ...user,
          employee: {
            ...user.employee,
            face_registered: true,
            photo_url: previewUri,
          },
        });
      }

      setIsProcessing(false);
      setModalType('success');
      setModalTitle('Wajah Berhasil Didaftarkan');
      setModalMessage(
        'Foto wajah acuan Anda telah tersimpan dan siap digunakan untuk check-in/check-out harian.'
      );
      setModalVisible(true);
    } catch (e: any) {
      setIsProcessing(false);
      setModalType('error');
      setModalTitle('Gagal Menyimpan');
      setModalMessage(e.message || 'Terjadi kesalahan teknis.');
      setModalVisible(true);
    }
  };

  // If already registered, display the locked state with "Contact HR" notice
  if (faceRegistered) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Daftarkan Wajah" showBack />
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIconCircle}>
            <Ionicons name="shield-checkmark" size={48} color={Palette.primary} />
          </View>
          <Text style={styles.lockedTitle}>Wajah Acuan Sudah Aktif</Text>
          <Text style={styles.lockedDesc}>
            Wajah acuan Anda telah terdaftar dalam sistem Humify dan digunakan untuk validasi biometrik setiap presensi.
          </Text>

          <Card style={styles.hrNoticeCard}>
            <Ionicons name="information-circle" size={24} color={Palette.infoText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hrNoticeTitle}>Perubahan Foto Wajah</Text>
              <Text style={styles.hrNoticeText}>
                Untuk alasan keamanan dan integritas presensi, karyawan tidak dapat mengubah foto wajah secara mandiri. Silakan hubungi tim Admin HRD apabila memerlukan pembaruan foto wajah.
              </Text>
            </View>
          </Card>

          <Button
            title="Kembali ke Profil"
            variant="outline"
            size="lg"
            onPress={() => router.back()}
            style={{ width: '100%', marginTop: Spacing.four }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Registrasi Wajah Pertama Kali" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Guidelines Card */}
        <Card style={styles.guidelinesCard}>
          <Text style={styles.guidelinesHeader}>Petunjuk Pengambilan Foto Wajah:</Text>
          <View style={styles.guideItem}>
            <Ionicons name="sunny-outline" size={16} color={Palette.primary} />
            <Text style={styles.guideText}>Pastikan pencahayaan terang dan merata di wajah.</Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="glasses-outline" size={16} color={Palette.primary} />
            <Text style={styles.guideText}>Lepaskan masker, kacamata hitam, dan penutup kepala.</Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="scan-outline" size={16} color={Palette.primary} />
            <Text style={styles.guideText}>Posisikan wajah tepat di tengah bingkai dan tatap kamera.</Text>
          </View>
        </Card>

        {/* Camera or Preview View */}
        <View style={styles.cameraFrame}>
          {previewUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.retakeFloatingBtn}
                onPress={() => setPreviewUri(null)}>
                <Ionicons name="refresh" size={18} color={Palette.white} />
                <Text style={styles.retakeText}>Ambil Ulang</Text>
              </TouchableOpacity>
            </View>
          ) : permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" autofocus="on">
              <View style={styles.overlay}>
                <View style={styles.faceOval} />
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={44} color={Palette.muted} />
              <Text style={styles.permissionLabel}>Izin kamera diperlukan untuk mendaftarkan wajah</Text>
              <Button title="Beri Izin Kamera" onPress={requestPermission} size="sm" />
            </View>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          {!previewUri ? (
            <Button
              title="Ambil Foto Wajah Acuan"
              icon="camera"
              size="lg"
              onPress={handleCapture}
            />
          ) : (
            <Button
              title="Simpan Sebagai Wajah Acuan"
              icon="checkmark-circle"
              size="lg"
              loading={isProcessing}
              onPress={handleSaveReference}
            />
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryButtonText="Mengerti"
        onPrimaryPress={() => {
          setModalVisible(false);
          if (modalType === 'success') {
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
  },
  guidelinesCard: {
    padding: Spacing.three,
    marginBottom: Spacing.four,
    backgroundColor: Palette.primarySurface,
    borderColor: Palette.primaryBorder,
  },
  guidelinesHeader: {
    ...Typography.captionBold,
    color: Palette.primaryDark,
    marginBottom: Spacing.two,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 6,
  },
  guideText: {
    ...Typography.caption,
    color: Palette.ink,
    flex: 1,
  },
  cameraFrame: {
    height: 360,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: Spacing.four,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 220,
    height: 270,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: Palette.primaryLight,
    borderStyle: 'dashed',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  retakeFloatingBtn: {
    position: 'absolute',
    bottom: Spacing.three,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radii.full,
  },
  retakeText: {
    color: Palette.white,
    fontWeight: '600',
    fontSize: 13,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  permissionLabel: {
    ...Typography.body,
    color: Palette.muted,
    textAlign: 'center',
  },
  actions: {
    marginTop: Spacing.two,
  },
  lockedContainer: {
    flex: 1,
    padding: Spacing.six,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Palette.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  lockedTitle: {
    ...Typography.h2,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  lockedDesc: {
    ...Typography.body,
    color: Palette.muted,
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  hrNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    backgroundColor: Palette.infoSurface,
    borderColor: Palette.infoBorder,
    padding: Spacing.four,
    width: '100%',
  },
  hrNoticeTitle: {
    ...Typography.captionBold,
    color: Palette.infoText,
    marginBottom: 4,
  },
  hrNoticeText: {
    ...Typography.caption,
    color: Palette.infoText,
    lineHeight: 18,
  },
});
