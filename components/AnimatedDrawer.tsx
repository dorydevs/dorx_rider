import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const DRAWER_HEIGHT = 350;

type Props = {
  visible: boolean;
  children: React.ReactNode;
};

export default function AnimatedDrawer({ visible, children }: Props) {
  const translateY = useSharedValue(DRAWER_HEIGHT);
  const keyboard = useAnimatedKeyboard();

  // 🔓 Open / Close ONLY when button changes `visible`
  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : DRAWER_HEIGHT, {
      duration: 250,
    });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    // ⛔ if drawer is closed, ignore keyboard completely
    if (!visible) {
      return {
        transform: [{ translateY: DRAWER_HEIGHT }],
      };
    }

    return {
      transform: [
        {
          translateY: translateY.value - Math.min(keyboard.height.value, 250),
        },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[styles.drawer, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 12,
  },
});
