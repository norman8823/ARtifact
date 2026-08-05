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
      <FontAwesome name="chevron-left" size={20} color={Colors.darkGray} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  pressed: {
    opacity: 0.5,
  },
});
