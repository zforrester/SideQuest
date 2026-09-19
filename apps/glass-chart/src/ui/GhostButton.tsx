import { Pressable, StyleSheet, Text } from 'react-native';

import { INK, UI } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  /** The near-black pill from the reference chrome. */
  primary?: boolean;
};

export function GhostButton({ label, onPress, accessibilityHint, primary }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.ghost,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, primary ? styles.labelPrimary : styles.labelGhost]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: INK,
  },
  ghost: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.hairline,
  },
  pressed: {
    opacity: 0.62,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  labelPrimary: {
    color: '#f4f5f1',
  },
  labelGhost: {
    color: UI.text,
  },
});
