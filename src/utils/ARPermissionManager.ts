import AsyncStorage from '@react-native-async-storage/async-storage';

const AR_PREWARMED_KEY = 'ar_webview_prewarmed';

export class ARPermissionManager {
  private static instance: ARPermissionManager;

  static getInstance(): ARPermissionManager {
    if (!ARPermissionManager.instance) {
      ARPermissionManager.instance = new ARPermissionManager();
    }
    return ARPermissionManager.instance;
  }

  // Optimize AR URL with autoplay and permission parameters
  buildOptimizedARURL(baseURL: string): string {
    try {
      // Add https:// if no protocol is present
      let urlString = baseURL;
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);

      // Add parameters that help with permission handling and autoplay
      url.searchParams.set('autoplay', 'true');
      url.searchParams.set('muted', 'false');

      // Add parameters that might help with camera permission handling
      url.searchParams.set('allowCamera', 'true');
      url.searchParams.set('permissions', 'camera');

      // Add timestamp to prevent caching issues
      url.searchParams.set('t', Date.now().toString());

      console.log('🎯 Optimized AR URL:', url.toString());
      return url.toString();
    } catch (error) {
      console.error('❌ Error building optimized AR URL, using original:', error);
      // If URL parsing still fails, try adding https:// to original
      if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
        return 'https://' + baseURL;
      }
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

  // Reset prewarmed state for testing
  async resetPrewarmed(): Promise<void> {
    await AsyncStorage.removeItem(AR_PREWARMED_KEY);
  }
}

export default ARPermissionManager.getInstance();