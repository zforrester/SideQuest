import { StyleSheet, Text, View } from 'react-native';

import type { Datum } from '../data';
import { UI } from '../theme';
import { GlassPanel } from './GlassPanel';

type Props = {
  series: Datum[];
  selected: Datum | null;
};

const currency = (thousands: number) => `$${thousands.toLocaleString('en-US')}k`;

export function Readout({ series, selected }: Props) {
  const total = series.reduce((sum, d) => sum + d.value, 0);

  if (!selected) {
    const best = series.reduce((a, b) => (b.value > a.value ? b : a));
    return (
      <GlassPanel raised>
        <Text style={styles.eyebrow}>Six months</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{currency(total)}</Text>
          <Text style={styles.unit}>total</Text>
        </View>
        <Text style={styles.hint}>
          Drag to turn the chart. Tap a bar — {best.label} is the peak at {currency(best.value)}.
        </Text>
      </GlassPanel>
    );
  }

  const share = total > 0 ? (selected.value / total) * 100 : 0;
  const rising = selected.delta >= 0;

  return (
    <GlassPanel raised>
      <View style={styles.headerRow}>
        <View style={[styles.swatch, { backgroundColor: selected.color }]} />
        <Text style={styles.eyebrow}>{selected.caption}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{currency(selected.value)}</Text>
        {selected.delta !== 0 && (
          <Text style={[styles.delta, { color: rising ? '#5ef2b0' : '#ff7a9c' }]}>
            {rising ? '▲' : '▼'} {Math.abs(selected.delta * 100).toFixed(1)}%
          </Text>
        )}
      </View>

      <View style={styles.meterTrack}>
        <View
          style={[styles.meterFill, { width: `${share}%`, backgroundColor: selected.color }]}
        />
      </View>
      <Text style={styles.hint}>{share.toFixed(1)}% of the six-month total</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  eyebrow: {
    color: UI.textDim,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 6,
  },
  value: {
    color: UI.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  unit: {
    color: UI.textFaint,
    fontSize: 14,
    fontWeight: '600',
  },
  delta: {
    fontSize: 14,
    fontWeight: '700',
  },
  meterTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  hint: {
    color: UI.textFaint,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
});
