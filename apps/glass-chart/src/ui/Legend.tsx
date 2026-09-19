import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Datum } from '../data';
import type { MaterialSpec } from '../chart/materials';
import { UI } from '../theme';

type Props = {
  series: Datum[];
  materials: MaterialSpec[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
};

/**
 * Month chips carrying a swatch of the stock each bar is cast in. Selection
 * stays in sync with the 3D scene both ways.
 */
export function Legend({ series, materials, selectedIndex, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {series.map((datum, index) => {
        const material = materials[index];
        const active = selectedIndex === index;
        return (
          <Pressable
            key={datum.id}
            accessibilityRole="button"
            accessibilityLabel={`${datum.caption}, ${datum.value} thousand dollars, ${material.name}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(active ? null : index)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: material.swatch },
                active && styles.swatchActive,
              ]}
            />
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
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  chipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(27, 29, 30, 0.28)',
  },
  pressed: {
    opacity: 0.55,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(27, 29, 30, 0.18)',
  },
  swatchActive: {
    width: 10,
    height: 10,
  },
  label: {
    color: UI.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    color: UI.text,
    fontWeight: '600',
  },
});
