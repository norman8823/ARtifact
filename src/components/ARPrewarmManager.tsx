import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import ARPermissionManager from '../utils/ARPermissionManager';

interface ARPrewarmManagerProps {
  enabled?: boolean;
  sampleARURL?: string;
}

// Hidden WebView that pre-warms AR engine and requests camera permission
export const ARPrewarmManager: React.FC<ARPrewarmManagerProps> = ({
  enabled = true,
  sampleARURL = 'https://apps.8thwall.com/8thwall/8thwall-hello-world'
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isPrewarming, setIsPrewarming] = React.useState(false);

  useEffect(() => {
    if (!enabled) return;

    const initializeARPrewarming = async () => {
      try {
        console.log('🔥 ARPrewarmManager: Starting AR pre-warming...');

        // Check if already prewarmed
        const isAlreadyPrewarmed = await ARPermissionManager.isPrewarmed();
        if (isAlreadyPrewarmed) {
          console.log('✅ AR already pre-warmed, skipping');
          return;
        }

        setIsPrewarming(true);

        // Request permissions first
        const permissions = await ARPermissionManager.requestAllPermissions();
        console.log('🎯 Pre-warm permissions result:', permissions);

        // Only pre-warm if we have necessary permissions
        if (permissions.camera) {
          console.log('🔥 Starting AR WebView pre-warming...');

          // Give permissions time to propagate
          setTimeout(() => {
            if (webViewRef.current) {
              console.log('🔥 Loading pre-warm WebView with optimized URL');
              webViewRef.current.reload();
            }
          }, 1000);
        }
      } catch (error) {
        console.error('❌ AR Pre-warming failed:', error);
        setIsPrewarming(false);
      }
    };

    // Start pre-warming after a short delay to not block app startup
    const timeoutId = setTimeout(initializeARPrewarming, 2000);

    return () => clearTimeout(timeoutId);
  }, [enabled, sampleARURL]);

  const handlePrewarmLoadEnd = async () => {
    try {
      console.log('✅ AR Pre-warming WebView loaded successfully');
      await ARPermissionManager.markAsPrewarmed();
      setIsPrewarming(false);
    } catch (error) {
      console.error('❌ Error marking AR as prewarmed:', error);
      setIsPrewarming(false);
    }
  };

  const handlePrewarmError = (error: any) => {
    console.warn('⚠️ AR Pre-warming WebView error (non-critical):', error?.nativeEvent?.description || 'Unknown error');
    // Don't disable prewarming completely on error - just log it
    // setIsPrewarming(false);
  };

  if (!enabled || !isPrewarming) {
    return null;
  }

  const optimizedURL = ARPermissionManager.buildOptimizedARURL(sampleARURL);

  return (
    <View style={{
      position: 'absolute',
      top: -1000,
      left: -1000,
      width: 1,
      height: 1,
      opacity: 0,
      pointerEvents: 'none'
    }}>
      <WebView
        ref={webViewRef}
        source={{ uri: optimizedURL }}
        style={{ width: 1, height: 1 }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        onLoadEnd={handlePrewarmLoadEnd}
        onError={handlePrewarmError}
        onHttpError={handlePrewarmError}
        // AR-specific settings
        allowsAirPlayForMediaPlayback={false}
        allowsBackForwardNavigationGestures={false}
        originWhitelist={['https://*']}
        mixedContentMode="compatibility"
        // Suppress console logs and reduce noise
        injectedJavaScript={`
          console.log('🔥 AR Pre-warm WebView initialized');
          // Suppress some logs to reduce noise
          const originalLog = console.log;
          console.log = function(...args) {
            if (!args.join(' ').includes('8thwall')) {
              originalLog.apply(console, args);
            }
          };
          true;
        `}
      />
    </View>
  );
};

export default ARPrewarmManager;