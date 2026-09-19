import { Pressable, StyleSheet, Text } from 'react-native';

import { UI } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
};

export function GhostButton({ label, onPress, accessibilityHint }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
  },
  pressed: {
    opacity: 0.55,
  },
  label: {
    color: UI.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
