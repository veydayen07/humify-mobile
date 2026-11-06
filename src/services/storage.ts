import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: 'humify_auth_token',
  AUTH_USER: 'humify_auth_user',
  API_URL: 'humify_api_url',
  DEMO_MODE: 'humify_demo_mode',
  FACE_REFERENCE: 'humify_face_reference',
};

export const StorageService = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.warn('Storage setToken error', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (e) {
      console.warn('Storage removeToken error', e);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
    } catch (e) {
      console.warn('Storage setUser error', e);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_USER);
    } catch (e) {
      console.warn('Storage removeUser error', e);
    }
  },

  async getApiUrl(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.API_URL);
    } catch {
      return null;
    }
  },

  async setApiUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.API_URL, url);
    } catch (e) {
      console.warn('Storage setApiUrl error', e);
    }
  },

  async getFaceReference(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.FACE_REFERENCE);
    } catch {
      return null;
    }
  },

  async setFaceReference(photoUri: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.FACE_REFERENCE, photoUri);
    } catch (e) {
      console.warn('Storage setFaceReference error', e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.AUTH_TOKEN, KEYS.AUTH_USER, KEYS.FACE_REFERENCE]);
    } catch (e) {
      console.warn('Storage clearAll error', e);
    }
  },
};

