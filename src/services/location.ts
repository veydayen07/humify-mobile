import * as Location from 'expo-location';
import { OfficeLocationConfig } from '@/constants/theme';

export interface LocationValidationResult {
  success: boolean;
  inRange: boolean;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  permissionGranted: boolean;
  gpsEnabled: boolean;
  errorMessage?: string;
  errorCode?: 'PERMISSION_DENIED' | 'LOCATION_DISABLED' | 'GEOFENCE_OUT_OF_RANGE' | 'TIMEOUT' | 'UNKNOWN';
}

// Configurable office coordinates for developer / live testing
let customOfficeCoords: { latitude: number; longitude: number; name?: string } | null = null;

export function setCustomOfficeLocation(lat: number, lon: number, name = 'Lokasi Kustom Anda') {
  customOfficeCoords = { latitude: lat, longitude: lon, name };
}

export function resetOfficeLocation() {
  customOfficeCoords = null;
}

export function getEffectiveOfficeLocation() {
  if (customOfficeCoords) {
    return {
      name: customOfficeCoords.name || 'Lokasi Kustom Anda',
      latitude: customOfficeCoords.latitude,
      longitude: customOfficeCoords.longitude,
      radiusMeters: OfficeLocationConfig.radiusMeters,
    };
  }
  return OfficeLocationConfig;
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
   * Check current location permissions status
   */
  async getPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Request foreground location permissions directly from device
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
   * Check if location services (GPS) are enabled on device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return true; // Default true on simulator/web
    }
  },

  /**
   * Fetches real device coordinates with fallback hierarchy
   */
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number | null } | null> {
    try {
      let isGranted = await this.getPermissionStatus();
      if (!isGranted) {
        isGranted = await this.requestPermissions();
        if (!isGranted) return null;
      }

      // 1. Try balanced accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
      };
    } catch (err) {
      console.warn('getCurrentPosition primary attempt, fallback to last known:', err);
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy ? Math.round(lastKnown.coords.accuracy) : null,
          };
        }
      } catch {
        // ignore
      }
      return null;
    }
  },

  /**
   * Validates device current location against the office geofence
   * @param simulateWithinOffice If true, marks as within range for testing convenience
   */
  async validateGeofence(simulateWithinOffice = false): Promise<LocationValidationResult> {
    let isGranted = await this.getPermissionStatus();
    if (!isGranted) {
      // Auto prompt on first check
      isGranted = await this.requestPermissions();
    }

    const isEnabled = await this.isLocationEnabled();
    const targetOffice = getEffectiveOfficeLocation();

    // 1. Check permissions
    if (!isGranted) {
      return {
        success: false,
        inRange: false,
        distanceMeters: 0,
        latitude: 0,
        longitude: 0,
        accuracy: null,
        permissionGranted: false,
        gpsEnabled: isEnabled,
        errorMessage: 'Izin akses lokasi belum diberikan. Silakan ketuk tombol "Beri Izin Lokasi".',
        errorCode: 'PERMISSION_DENIED',
      };
    }

    // 2. Check GPS enabled
    if (!isEnabled) {
      return {
        success: false,
        inRange: false,
        distanceMeters: 0,
        latitude: 0,
        longitude: 0,
        accuracy: null,
        permissionGranted: true,
        gpsEnabled: false,
        errorMessage: 'Layanan GPS pada perangkat Anda nonaktif. Mohon aktifkan GPS.',
        errorCode: 'LOCATION_DISABLED',
      };
    }

    // 3. Get real position
    const pos = await this.getCurrentPosition();

    if (!pos) {
      // If position could not be fetched (e.g. Android emulator without mock location),
      // we supply the office coordinates or a mock coordinate if simulated
      if (simulateWithinOffice) {
        return {
          success: true,
          inRange: true,
          distanceMeters: 15,
          latitude: targetOffice.latitude,
          longitude: targetOffice.longitude,
          accuracy: 10,
          permissionGranted: true,
          gpsEnabled: true,
        };
      }

      return {
        success: false,
        inRange: false,
        distanceMeters: 0,
        latitude: 0,
        longitude: 0,
        accuracy: null,
        permissionGranted: true,
        gpsEnabled: true,
        errorMessage: 'Gagal mendeteksi koordinat GPS. Pastikan GPS aktif dan Anda berada di area dengan sinyal baik.',
        errorCode: 'TIMEOUT',
      };
    }

    // Calculate real Haversine distance from effective office
    const realDistance = calculateHaversineDistance(
      pos.latitude,
      pos.longitude,
      targetOffice.latitude,
      targetOffice.longitude
    );

    const inRange = simulateWithinOffice ? true : realDistance <= targetOffice.radiusMeters;
    const distanceMeters = simulateWithinOffice ? Math.min(realDistance, 15) : realDistance;

    return {
      success: true,
      inRange,
      distanceMeters,
      latitude: pos.latitude,
      longitude: pos.longitude,
      accuracy: pos.accuracy,
      permissionGranted: true,
      gpsEnabled: true,
      errorMessage: inRange
        ? undefined
        : `Anda berada di luar area kantor yang diizinkan (Maksimal ${targetOffice.radiusMeters}m). Jarak Anda saat ini: ${
            realDistance >= 1000 ? (realDistance / 1000).toFixed(2) + ' km' : realDistance + ' meter'
          }.`,
      errorCode: inRange ? undefined : 'GEOFENCE_OUT_OF_RANGE',
    };
  },
};
