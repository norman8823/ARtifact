const { withInfoPlist } = require("expo/config-plugins");

/**
 * Strips permission usage strings the ReactVision plugin injects but this app
 * never exercises (backlog 0.7).
 *
 * `@reactvision/react-viro`'s `withDefaultInfoPlist` sets photo-library,
 * microphone and — when a geospatial provider is configured — location strings
 * unconditionally, using `infoPlist.X = infoPlist.X || <default>`. Because that
 * runs while plugins are being applied, deleting the keys from `app.json` or
 * from the plugin's own options does not stop it; the values reappear in the
 * generated Info.plist. That is why the 2026-07-27 permissions pass looked done
 * and wasn't.
 *
 * This runs as an Info.plist *mod*, which executes after all plugin resolution,
 * so it is the last writer and the keys stay gone.
 *
 * Verified safe to remove: nothing in the app calls Viro's `recordVideo` or
 * `takeScreenshot`, imports MediaLibrary/CameraRoll, or touches audio, so no
 * code path can trigger these prompts. A usage string is only ever needed when
 * the matching API is actually called.
 *
 * **If any of those features are ever added, remove the corresponding key from
 * the list below first** — requesting a permission with no usage string is an
 * immediate crash, not a denied prompt.
 */
const KEYS_TO_REMOVE = [
  "NSLocationWhenInUseUsageDescription",
  "NSLocationAlwaysAndWhenInUseUsageDescription",
  "NSMicrophoneUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "NSPhotoLibraryAddUsageDescription",
];

module.exports = function withTrimmedIosPermissions(config) {
  return withInfoPlist(config, (cfg) => {
    for (const key of KEYS_TO_REMOVE) {
      delete cfg.modResults[key];
    }
    return cfg;
  });
};
