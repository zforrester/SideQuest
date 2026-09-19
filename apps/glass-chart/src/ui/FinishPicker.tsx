import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FINISHES, UI, type Finish } from '../theme';

type Props = {
  value: Finish;
  onChange: (finish: Finish) => void;
};

/** Segmented control over the three material treatments. */
export function FinishPicker({ value, onChange }: Props) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {FINISHES.map((finish) => {
        const active = finish.id === value;
        return (
          <Pressable
            key={finish.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityHint={finish.blurb}
            onPress={() => onChange(finish.id)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && !active && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{finish.label}</Text>
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
    backgroundColor: 'rgba(8, 10, 24, 0.55)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  pressed: {
    opacity: 0.55,
  },
  label: {
    color: UI.textDim,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: UI.text,
  },
});
