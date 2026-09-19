import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LIGHTING, UI, type Lighting } from '../theme';

type Props = {
  value: Lighting;
  onChange: (lighting: Lighting) => void;
};

/**
 * Swaps the reflection probe. Materials are mostly reflection, so this
 * changes the read of every bar at once — the metals most of all.
 */
export function LightingPicker({ value, onChange }: Props) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {LIGHTING.map((preset) => {
        const active = preset.id === value;
        return (
          <Pressable
            key={preset.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityHint={preset.blurb}
            onPress={() => onChange(preset.id)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && !active && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{preset.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
  },
  pressed: {
    opacity: 0.5,
  },
  label: {
    color: UI.textDim,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: UI.text,
    fontWeight: '600',
  },
});
