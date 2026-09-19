import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { MaterialSpec } from '../chart/materials';
import type { Datum } from '../data';
import { UI } from '../theme';

type Props = {
  series: Datum[];
  selected: Datum | null;
  material: MaterialSpec | null;
};

const currency = (thousands: number) => `$${thousands.toLocaleString('en-US')}k`;

/** The sage card, lifted from the reference's storage panel. */
export function Readout({ series, selected, material }: Props) {
  const total = series.reduce((sum, d) => sum + d.value, 0);

  return (
    <LinearGradient
      colors={UI.sage}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {selected && material ? (
        <Detail series={series} selected={selected} material={material} total={total} />
      ) : (
        <Summary series={series} total={total} />
      )}
    </LinearGradient>
  );
}

function Summary({ series, total }: { series: Datum[]; total: number }) {
  const best = series.reduce((a, b) => (b.value > a.value ? b : a));
  return (
    <>
      <Text style={styles.eyebrow}>Six months</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{currency(total)}</Text>
        <Text style={styles.unit}>total</Text>
      </View>
      <Text style={styles.hint}>
        Drag to turn the chart. Tap a bar — {best.label} is the peak at {currency(best.value)}.
      </Text>
    </>
  );
}

function Detail({
  selected,
  material,
  total,
}: {
  series: Datum[];
  selected: Datum;
  material: MaterialSpec;
  total: number;
}) {
  const share = total > 0 ? (selected.value / total) * 100 : 0;
  const rising = selected.delta >= 0;

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>{selected.caption}</Text>
        <View style={styles.materialTag}>
          <View style={[styles.swatch, { backgroundColor: material.swatch }]} />
          <Text style={styles.materialName}>{material.name}</Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{currency(selected.value)}</Text>
        {selected.delta !== 0 && (
          <Text style={[styles.delta, { color: rising ? UI.rise : UI.fall }]}>
            {rising ? '▲' : '▼'} {Math.abs(selected.delta * 100).toFixed(1)}%
          </Text>
        )}
      </View>

      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${share}%` }]} />
      </View>
      <Text style={styles.hint}>{share.toFixed(1)}% of the six-month total</Text>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34, 38, 27, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrow: {
    color: UI.sageInkDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  materialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 2.5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34, 38, 27, 0.2)',
  },
  materialName: {
    color: UI.sageInk,
    fontSize: 11,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 7,
  },
  value: {
    color: UI.sageInk,
    fontSize: 34,
    fontWeight: '200',
    letterSpacing: -1,
  },
  unit: {
    color: UI.sageInkDim,
    fontSize: 13,
    fontWeight: '400',
  },
  delta: {
    fontSize: 13,
    fontWeight: '600',
  },
  meterTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 13,
    backgroundColor: 'rgba(34, 38, 27, 0.14)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: UI.sageInk,
  },
  hint: {
    color: UI.sageInkDim,
    fontSize: 12,
    marginTop: 7,
    lineHeight: 16,
  },
});
