import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassBarChart } from './src/chart/GlassBarChart';
import { materialLibrary } from './src/chart/materials';
import { INITIAL_SERIES, shuffleSeries, type Datum } from './src/data';
import { DEFAULT_DEV, type DevConfig } from './src/devConfig';
import { BACKDROP_GRADIENT, INK, LIGHTING, UI, type Lighting } from './src/theme';
import { DevSheet } from './src/ui/DevSheet';
import { GhostButton } from './src/ui/GhostButton';
import { Legend } from './src/ui/Legend';
import { LightingPicker } from './src/ui/LightingPicker';
import { Readout } from './src/ui/Readout';
import { Stat } from './src/ui/Stat';
import { useTilt } from './src/useTilt';

function tap() {
  // expo-haptics is a no-op target on web; don't even ask.
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function Demo() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Three full-size stats need room; below these widths, step down and then
  // drop the least important one rather than letting the row clip.
  const compactStats = width < 400;
  const showThirdStat = width >= 360;
  const [series, setSeries] = useState<Datum[]>(INITIAL_SERIES);
  const [lighting, setLighting] = useState<Lighting>('studio');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [dev, setDev] = useState<DevConfig>(DEFAULT_DEV);
  const [devOpen, setDevOpen] = useState(false);

  // Feeds device tilt into the light aim; falls back to the pointer where
  // there is no motion sensor.
  useTilt();

  const library = useMemo(() => materialLibrary(), []);
  const materials = useMemo(
    () => series.map((datum) => library[datum.material]),
    [series, library],
  );

  const handleSelect = useCallback((index: number | null) => {
    setSelectedIndex((current) => {
      const next = current === index ? null : index;
      if (next !== null) tap();
      return next;
    });
  }, []);

  const handleShuffle = useCallback(() => {
    setSeries((current) => shuffleSeries(current));
    tap();
  }, []);

  const handleReplay = useCallback(() => {
    setSelectedIndex(null);
    setRevealKey((k) => k + 1);
    tap();
  }, []);

  const patchDev = useCallback((patch: Partial<DevConfig>) => {
    setDev((current) => ({ ...current, ...patch }));
  }, []);

  const resetDev = useCallback(() => setDev(DEFAULT_DEV), []);

  const total = series.reduce((sum, d) => sum + d.value, 0);
  const peak = series.reduce((a, b) => (b.value > a.value ? b : a));
  const average = Math.round(total / series.length);
  const activeLighting = LIGHTING.find((l) => l.id === lighting);
  const selected = selectedIndex === null ? null : series[selectedIndex];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={BACKDROP_GRADIENT as [string, string, ...string[]]}
        locations={[0, 0.34, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.statRow}>
          <Stat
            label="Net revenue"
            value={`$${total.toLocaleString('en-US')}`}
            unit="k"
            compact={compactStats}
          />
          <Stat
            label="Peak month"
            value={peak.label}
            unit={`$${peak.value}k`}
            compact={compactStats}
          />
          {showThirdStat && (
            <Stat label="Monthly average" value={`${average}`} unit="k" compact={compactStats} />
          )}
        </View>
        <View style={styles.captionRow}>
          <Text style={styles.caption} numberOfLines={1}>
            Six finishes · {activeLighting?.blurb}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={devOpen ? 'Hide dev controls' : 'Show dev controls'}
            accessibilityState={{ expanded: devOpen }}
            onPress={() => setDevOpen((open) => !open)}
            style={({ pressed }) => [
              styles.devToggle,
              devOpen && styles.devToggleOn,
              pressed && styles.devTogglePressed,
            ]}
          >
            <Text style={[styles.devToggleLabel, devOpen && styles.devToggleLabelOn]}>Dev</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.canvas}>
        <GlassBarChart
          series={series}
          lighting={lighting}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          revealKey={revealKey}
          dev={dev}
        />
      </View>

      {devOpen ? (
        <View style={{ paddingBottom: insets.bottom }}>
          <DevSheet
            config={dev}
            onChange={patchDev}
            onReset={resetDev}
            onClose={() => setDevOpen(false)}
          />
        </View>
      ) : (
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Legend
          series={series}
          materials={materials}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
        <Readout
          series={series}
          selected={selected}
          material={selectedIndex === null ? null : materials[selectedIndex]}
        />
        <LightingPicker value={lighting} onChange={setLighting} />
        <View style={styles.buttonRow}>
          <GhostButton
            label="Shuffle data"
            accessibilityHint="Generates a new set of values and animates the bars to them"
            onPress={handleShuffle}
          />
          <GhostButton
            primary
            label="Replay build"
            accessibilityHint="Replays the grow-in animation"
            onPress={handleReplay}
          />
        </View>
      </View>
      )}

      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Demo />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f1f2ed',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  caption: {
    flex: 1,
    color: UI.textFaint,
    fontSize: 12,
  },
  devToggle: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  devToggleOn: {
    backgroundColor: INK,
    borderColor: INK,
  },
  devTogglePressed: {
    opacity: 0.6,
  },
  devToggleLabel: {
    color: UI.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  devToggleLabelOn: {
    color: '#f4f5f1',
  },
  canvas: {
    flex: 1,
    // Low enough that the controls below still fit on a 320x568 phone.
    minHeight: 150,
  },
  controls: {
    paddingHorizontal: 18,
    paddingTop: 4,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
