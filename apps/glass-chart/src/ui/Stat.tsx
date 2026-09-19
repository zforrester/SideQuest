import { StyleSheet, Text, View } from 'react-native';

import { UI } from '../theme';

type Props = {
  label: string;
  value: string;
  unit?: string;
  /** Slightly smaller, for stats that sit inside a panel. */
  compact?: boolean;
};

/**
 * Label above, hairline-thin figure below, unit trailing in grey — the
 * readout block the whole layout is built from.
 */
export function Stat({ label, value, unit, compact }: Props) {
  return (
    <View style={styles.block}>
      <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.unit, compact && styles.unitCompact]}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    // minWidth 0 lets the row shrink these instead of overflowing the screen.
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: UI.textDim,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  labelCompact: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 1,
  },
  value: {
    color: UI.text,
    fontSize: 32,
    // The reference leans on very light weights; these map to the system
    // Light/Thin faces on iOS, Android and the web alike.
    fontWeight: '200',
    letterSpacing: -0.8,
  },
  valueCompact: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  unit: {
    color: UI.textFaint,
    fontSize: 14,
    fontWeight: '300',
  },
  unitCompact: {
    fontSize: 11,
  },
});
