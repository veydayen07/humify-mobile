import * as Location from 'expo-location';
import { OfficeLocationConfig } from '@/constants/theme';

export interface LocationValidationResult {
  success: boolean;
  inRange: boolean;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  errorMessage?: string;
  errorCode?: 'PERMISSION_DENIED' | 'LOCATION_DISABLED' | 'GEOFENCE_OUT_OF_RANGE' | 'UNKNOWN';
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const LocationService = {
  /**
   * Request foreground location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('Error requesting location permissions:', e);
      return false;
    }
  },

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  },

  /**
   * Validates device current location against the office geofence
   * @param forceOfficeCoords If true, uses office coordinates (useful for demo/simulator)
   */
  async validateGeofence(forceOfficeCoords = false): Promise<LocationValidationResult> {
    try {
      if (forceOfficeCoords) {
        return {
          success: true,
          inRange: true,
          distanceMeters: 18,
          latitude: OfficeLocationConfig.latitude + 0.0001,
          longitude: OfficeLocationConfig.longitude + 0.0001,
          accuracy: 5,
        };
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          inRange: false,
          distanceMeters: 0,
          latitude: 0,
          longitude: 0,
          accuracy: null,
          errorMessage: 'Izin akses lokasi ditolak. Aktifkan izin lokasi pada pengaturan perangkat.',
          errorCode: 'PERMISSION_DENIED',
        };
      }

      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        return {
          success: false,
          inRange: false,
          distanceMeters: 0,
          latitude: 0,
          longitude: 0,
          accuracy: null,
          errorMessage: 'GPS perangkat tidak aktif. Mohon nyalakan GPS / Layanan Lokasi.',
          errorCode: 'LOCATION_DISABLED',
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy } = position.coords;
      const distance = calculateHaversineDistance(
        latitude,
        longitude,
        OfficeLocationConfig.latitude,
        OfficeLocationConfig.longitude
      );

      const inRange = distance <= OfficeLocationConfig.radiusMeters;

      if (!inRange) {
        return {
          success: false,
          inRange: false,
          distanceMeters: distance,
          latitude,
          longitude,
          accuracy: accuracy || null,
          errorMessage: `Anda berada di luar area kantor yang diizinkan (Radius maksimal ${OfficeLocationConfig.radiusMeters}m). Jarak Anda saat ini: ${distance} meter dari kantor.`,
          errorCode: 'GEOFENCE_OUT_OF_RANGE',
        };
      }

      return {
        success: true,
        inRange: true,
        distanceMeters: distance,
        latitude,
        longitude,
        accuracy: accuracy || null,
      };
    } catch (e: any) {
      return {
        success: false,
        inRange: false,
        distanceMeters: 0,
        latitude: 0,
        longitude: 0,
        accuracy: null,
        errorMessage: e?.message || 'Gagal memperoleh posisi koordinat GPS.',
        errorCode: 'UNKNOWN',
      };
    }
  },
};

