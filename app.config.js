/**
 * Injects the ReactVision API key into the @reactvision/react-viro plugin
 * config at evaluation time, so the key never sits in `app.json` (backlog 2.2,
 * Gaps #2).
 *
 * Expo reads `app.json` first and hands it to this function as `config`, so
 * everything static stays in `app.json` and only the secret is applied here.
 *
 * **What this does and does not buy.** The key is baked into the native project
 * at prebuild, so it still ships inside the binary — this does not hide it from
 * anyone determined to read an IPA. What it removes is the key sitting in source
 * control, which is the actual leak. **The old key remains in git history, so
 * moving it here is only half the job: rotate the key in the ReactVision
 * dashboard, or nothing has been protected.**
 *
 * Not an `EXPO_PUBLIC_*` var on purpose: this is consumed at build time by a
 * config plugin, never read from JS at runtime, and the `EXPO_PUBLIC_` prefix
 * would inline it into the JS bundle as well for no benefit.
 */

const RV_PLUGIN = "@reactvision/react-viro";

module.exports = ({ config }) => {
  const rvApiKey = process.env.RV_API_KEY;

  // Fail the build loudly rather than shipping an app whose AR silently does
  // not work. Local prebuilds only warn, so day-to-day work on non-AR screens
  // does not require the secret to be present.
  if (!rvApiKey) {
    const message =
      "RV_API_KEY is not set — the ReactVision plugin will be configured without an API key and AR will not work.";

    if (process.env.EAS_BUILD_PROFILE === "production") {
      throw new Error(
        `${message} Set it as an EAS environment variable on the production profile.`
      );
    }

    console.warn(`⚠️  ${message}`);
  }

  const plugins = (config.plugins ?? []).map((plugin) => {
    // Plugin entries are either a bare string or a [name, options] tuple; only
    // the tuple form carries the options object we need to extend.
    if (!rvApiKey || !Array.isArray(plugin) || plugin[0] !== RV_PLUGIN) {
      return plugin;
    }

    const [name, options] = plugin;
    return [name, { ...options, rvApiKey }];
  });

  // NOTE: a `withTrimmedIosPermissions` plugin used to be appended here to strip
  // the photo-library / microphone / location usage strings the Viro plugin
  // injects. It was **removed 2026-08-06** after App Store delivery of build
  // 1.0.52 was rejected with ITMS-90683 for the missing photo-library and
  // microphone strings. Apple's check is static analysis over *linked* code —
  // ViroKit references those APIs — so the strings are mandatory regardless of
  // whether the app calls them. All five are now declared explicitly in
  // `app.json` so we control the wording instead of shipping Viro's defaults.
  // **Do not reintroduce the trim.** See Gaps #22.

  return { ...config, plugins };
};
