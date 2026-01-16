import { View, Animated, StyleSheet, useColorScheme, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";

interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
}

export function ShimmerSkeleton({
  width = "100%",
  height,
  borderRadius = 8,
}: ShimmerSkeletonProps) {
  const translateX = useRef(new Animated.Value(-1)).current;
  const colorScheme = useColorScheme();

  const baseColor = colorScheme === "dark" ? "#2a2a2a" : "#e5e7eb";
  const highlightColor = colorScheme === "dark" ? "#3a3a3a" : "#f3f4f6";

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translate = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: translate }] },
        ]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
