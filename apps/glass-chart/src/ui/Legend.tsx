import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Datum } from '../data';
import { UI } from '../theme';

type Props = {
  series: Datum[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
};

/** Tappable month chips. Selection stays in sync with the 3D scene both ways. */
export function Legend({ series, selectedIndex, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {series.map((datum, index) => {
        const active = selectedIndex === index;
        return (
          <Pressable
            key={datum.id}
            accessibilityRole="button"
            accessibilityLabel={`${datum.caption}, ${datum.value} thousand dollars`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(active ? null : index)}
            style={({ pressed }) => [
              styles.chip,
              active && { backgroundColor: `${datum.color}2e`, borderColor: datum.color },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: datum.color }]} />
            <Text style={[styles.label, active && styles.labelActive]}>{datum.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    // Equal shares keeps all six on one line at any phone width.
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pressed: {
    opacity: 0.6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    color: UI.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: UI.text,
  },
});
