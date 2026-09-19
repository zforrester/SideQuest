import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { UI } from '../theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  padding?: number;
  raised?: boolean;
};

/**
 * The 2D counterpart to the glass in the scene: a blurred, hairline-bordered
 * slab. The tint underneath keeps it legible on platforms where the blur is
 * unavailable or disabled.
 */
export function GlassPanel({
  children,
  style,
  intensity = 24,
  radius = 24,
  padding = 16,
  raised,
}: Props) {
  return (
    <View style={[styles.clip, { borderRadius: radius }, style]}>
      <BlurView
        intensity={intensity}
        tint="light"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: raised ? UI.panelStrong : UI.panel },
        ]}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
  },
});
