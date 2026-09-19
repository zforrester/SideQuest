import { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { GlassBarChart } from './src/chart/GlassBarChart';
import { INITIAL_SERIES, shuffleSeries, type Datum } from './src/data';
import { BACKDROP_GRADIENT, FINISHES, UI, type Finish } from './src/theme';
import { FinishPicker } from './src/ui/FinishPicker';
import { GhostButton } from './src/ui/GhostButton';
import { Legend } from './src/ui/Legend';
import { Readout } from './src/ui/Readout';

function tap() {
  // expo-haptics is a no-op target on web; don't even ask.
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function Demo() {
  const insets = useSafeAreaInsets();
  const [series, setSeries] = useState<Datum[]>(INITIAL_SERIES);
  const [finish, setFinish] = useState<Finish>('hybrid');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealKey, setRevealKey] = useState(0);

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

  const activeFinish = FINISHES.find((f) => f.id === finish);
  const selected = selectedIndex === null ? null : series[selectedIndex];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={BACKDROP_GRADIENT as [string, string, ...string[]]}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>Net revenue · FY26</Text>
        <Text style={styles.title}>Six months, in glass</Text>
        <Text style={styles.subtitle}>{activeFinish?.blurb}</Text>
      </View>

      <View style={styles.canvas}>
        <GlassBarChart
          series={series}
          finish={finish}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          revealKey={revealKey}
        />
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Legend series={series} selectedIndex={selectedIndex} onSelect={handleSelect} />
        <Readout series={series} selected={selected} />
        <FinishPicker value={finish} onChange={setFinish} />
        <View style={styles.buttonRow}>
          <GhostButton
            label="Shuffle data"
            accessibilityHint="Generates a new set of values and animates the bars to them"
            onPress={handleShuffle}
          />
          <GhostButton
            label="Replay build"
            accessibilityHint="Replays the grow-in animation"
            onPress={handleReplay}
          />
        </View>
      </View>

      <StatusBar style="light" />
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
    backgroundColor: '#05060e',
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  eyebrow: {
    color: UI.textFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: UI.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 5,
  },
  subtitle: {
    color: UI.textDim,
    fontSize: 13,
    marginTop: 4,
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
