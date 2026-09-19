import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';

import {
  DEFAULT_DEV,
  DEV_GROUPS,
  type DevConfig,
  type DevSliderSpec,
} from '../devConfig';
import { INK, UI } from '../theme';

type Props = {
  config: DevConfig;
  onChange: (patch: Partial<DevConfig>) => void;
  onReset: () => void;
  onClose: () => void;
};

function format(value: number, spec: DevSliderSpec) {
  return value.toFixed(spec.precision ?? 1);
}

/** A tuning panel, not product chrome — plain, dense and quick to scan. */
export function DevSheet({ config, onChange, onReset, onClose }: Props) {
  // The sheet takes the place of the normal controls, so it can afford most
  // of the screen. A fixed height buried everything past the second group.
  const { height } = useWindowDimensions();
  const maxHeight = Math.max(240, Math.min(height * 0.62, 620));

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>Dev controls</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onReset}
            style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
          >
            <Text style={styles.smallButtonLabel}>Reset</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dev controls"
            onPress={onClose}
            style={({ pressed }) => [styles.smallButton, styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={[styles.smallButtonLabel, styles.closeLabel]}>Done</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ maxHeight }} contentContainerStyle={styles.scrollBody}>
        {DEV_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>

            {group.sliders.map((spec) => (
              <View key={spec.key} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>{spec.label}</Text>
                  <Text style={styles.rowValue}>
                    {format(config[spec.key] as number, spec)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={spec.min}
                  maximumValue={spec.max}
                  step={spec.step}
                  value={config[spec.key] as number}
                  onValueChange={(value) => onChange({ [spec.key]: value } as Partial<DevConfig>)}
                  minimumTrackTintColor={INK}
                  maximumTrackTintColor="rgba(27, 29, 30, 0.16)"
                  thumbTintColor={INK}
                />
              </View>
            ))}

            {group.toggles?.map((toggle) => (
              <View key={toggle.key} style={styles.toggleRow}>
                <Text style={styles.rowLabel}>{toggle.label}</Text>
                <Switch
                  value={config[toggle.key] as boolean}
                  onValueChange={(value) =>
                    onChange({ [toggle.key]: value } as Partial<DevConfig>)
                  }
                  trackColor={{ false: 'rgba(27, 29, 30, 0.18)', true: INK }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footnote}>
          Defaults: distance {DEFAULT_DEV.cameraDistance}, yaw {DEFAULT_DEV.yaw}, pitch{' '}
          {DEFAULT_DEV.pitch}. Dragging the chart moves yaw and pitch too.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(250, 250, 247, 0.97)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: UI.hairline,
  },
  title: {
    color: UI.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    backgroundColor: INK,
    borderColor: INK,
  },
  pressed: {
    opacity: 0.6,
  },
  smallButtonLabel: {
    color: UI.text,
    fontSize: 12,
    fontWeight: '600',
  },
  closeLabel: {
    color: '#f4f5f1',
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  group: {
    marginBottom: 14,
  },
  groupTitle: {
    color: UI.textFaint,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    marginBottom: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowLabel: {
    color: UI.text,
    fontSize: 13,
  },
  rowValue: {
    color: UI.textDim,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  footnote: {
    color: UI.textFaint,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
