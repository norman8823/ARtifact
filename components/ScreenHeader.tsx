import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useGoBack } from "@/src/hooks/useGoBack";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The app's header for pushed screens, rendered entirely in React.
 *
 * WHY NOT THE NATIVE NAVIGATION BAR
 * ---------------------------------
 * Two problems, and this solves both:
 *
 * 1. The system back button stopped popping on iOS 27 beta while still
 *    highlighting on press — UIKit draws and highlights it itself, so it looked
 *    alive while the action never reached the navigator, and JS cannot
 *    intervene in that path (Gaps #23, confirmed by a reporter).
 * 2. Supplying our own `headerLeft` fixed that but iOS 26+ wraps navigation-bar
 *    items in a Liquid Glass circle with NO opt-out — no glass/liquid prop
 *    exists in react-native-screens 4.16 or @react-navigation/native-stack — so
 *    the button rendered inside a heavy dark disc that read as broken.
 *
 * Owning the header removes the system container entirely and takes
 * react-native-screens' navigation bar out of the path, so a future iOS release
 * cannot break the back button the same way. The cost is that we handle the
 * safe-area inset ourselves, which UIKit was doing for free.
 */
export function ScreenHeader({ title }: { title?: string }) {
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable
        onPress={goBack}
        // The system button carried a 44pt target for free; ours has to ask.
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <FontAwesome name="chevron-left" size={20} color={Colors.darkGray} />
      </Pressable>

      {title ? (
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
      ) : null}

      {/* Balances the back button so a title sits optically centred. */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.lightGray,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.5,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: Colors.darkGray,
  },
  spacer: {
    width: 40,
  },
});
