import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';

const AR_PERMISSIONS_KEY = 'ar_permissions_granted';
const AR_PREWARMED_KEY = 'ar_webview_prewarmed';

export interface ARPermissionStatus {
  camera: boolean;
  location: boolean;
  allGranted: boolean;
}

export class ARPermissionManager {
  private static instance: ARPermissionManager;
  private permissionStatus: ARPermissionStatus = {
    camera: false,
    location: false,
    allGranted: false
  };

  static getInstance(): ARPermissionManager {
    if (!ARPermissionManager.instance) {
      ARPermissionManager.instance = new ARPermissionManager();
    }
    return ARPermissionManager.instance;
  }

  // Request camera permission for AR
  async requestAllPermissions(): Promise<ARPermissionStatus> {
    try {
      console.log('🎯 ARPermissionManager: Requesting AR permissions...');

      // Request camera permission (only permission needed for AR)
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      this.permissionStatus.camera = cameraStatus.status === 'granted';

      // Set location to true since we're not requesting it
      this.permissionStatus.location = true;
      this.permissionStatus.allGranted = this.permissionStatus.camera;

      // Store permission status
      await AsyncStorage.setItem(AR_PERMISSIONS_KEY, JSON.stringify(this.permissionStatus));

      console.log('🎯 AR Permissions Status:', this.permissionStatus);
      return this.permissionStatus;
    } catch (error) {
      console.error('❌ Error requesting AR permissions:', error);
      return this.permissionStatus;
    }
  }

  // Check current permission status
  async checkPermissions(): Promise<ARPermissionStatus> {
    try {
      // Check stored permissions
      const stored = await AsyncStorage.getItem(AR_PERMISSIONS_KEY);
      if (stored) {
        this.permissionStatus = JSON.parse(stored);
      }

      // Also check current system permissions
      const cameraStatus = await Camera.getCameraPermissionsAsync();

      this.permissionStatus.camera = cameraStatus.status === 'granted';
      this.permissionStatus.location = true; // Not requesting location
      this.permissionStatus.allGranted = this.permissionStatus.camera;

      return this.permissionStatus;
    } catch (error) {
      console.error('❌ Error checking AR permissions:', error);
      return this.permissionStatus;
    }
  }

  // Get cached permission status
  getPermissionStatus(): ARPermissionStatus {
    return this.permissionStatus;
  }

  // Optimize AR URL with autoplay parameters
  buildOptimizedARURL(baseURL: string): string {
    try {
      const url = new URL(baseURL);

      // Add minimal parameters that are more likely to work
      url.searchParams.set('autoplay', 'true');
      url.searchParams.set('muted', 'false');

      console.log('🎯 Optimized AR URL:', url.toString());
      return url.toString();
    } catch (error) {
      console.error('❌ Error building optimized AR URL, using original:', error);
      return baseURL;
    }
  }

  // Mark AR as pre-warmed
  async markAsPrewarmed(): Promise<void> {
    await AsyncStorage.setItem(AR_PREWARMED_KEY, 'true');
  }

  // Check if AR is pre-warmed
  async isPrewarmed(): Promise<boolean> {
    const prewarmed = await AsyncStorage.getItem(AR_PREWARMED_KEY);
    return prewarmed === 'true';
  }

  // Reset permissions for testing
  async resetPermissions(): Promise<void> {
    await AsyncStorage.removeItem(AR_PERMISSIONS_KEY);
    await AsyncStorage.removeItem(AR_PREWARMED_KEY);
    this.permissionStatus = {
      camera: false,
      location: false,
      allGranted: false
    };
  }
}

export default ARPermissionManager.getInstance();