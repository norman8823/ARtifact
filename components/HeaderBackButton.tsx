import { Colors } from "@/constants/Colors";
import { useGoBack } from "@/src/hooks/useGoBack";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

/**
 * Back control for pushed screens, replacing UIKit's system back button.
 *
 * **Why we render our own.** A user on iOS 27 beta (iPhone SE, build 1.0.51 —
 * current code, not an old binary) recorded the system back button on
 * artDetail highlighting on press and never popping. UIKit draws and highlights
 * its own button, which is why it looked responsive; the action never reached
 * the navigator, and nothing in JS can intervene in that path. See Gaps #23.
 *
 * The rest of that header rendered normally — the blank title is `headerTitle:
 * ""` in `app/_layout.tsx`, not a symptom — so the failure looks specific to
 * the back button's action, not to the navigation bar as a whole.
 *
 * This button is rendered by React and its press goes through RN's responder
 * system instead, so it does not depend on that wiring.
 *
 * Always rendered, even with an empty stack: `useGoBack` falls back to `/home`
 * rather than no-op'ing, so the control is never a dead end. Screens that
 * should not offer back (index, the dashboard) set `headerShown: false`.
 */
export function HeaderBackButton() {
  const goBack = useGoBack();

  return (
    <Pressable
      onPress={goBack}
      // The system button carries a 44pt target for free; ours has to ask.
      hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {/* `chevron-left` has visual weight to the left of its glyph box, so a
          centred box still reads as off-centre. The 2pt nudge compensates. */}
      <FontAwesome
        name="chevron-left"
        size={18}
        color={Colors.darkGray}
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // iOS 26+ wraps navigation-bar items in a Liquid Glass container sized to the
  // view we hand it, and there is no way to opt out (no glass/liquid prop
  // exists in react-native-screens 4.16 or @react-navigation/native-stack).
  // So the view must be SQUARE and its content centred, or the circle the
  // system draws ends up with the arrow sitting off to one side — which is
  // exactly what shipped in 1.0.53, where asymmetric padding (paddingRight: 8,
  // no fixed size) gave the container a lopsided box to wrap.
  button: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.5,
  },
});
