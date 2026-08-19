import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, batteryTone } from '../theme';

const TONE_STYLES = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  muted: { bg: colors.surfaceMuted, fg: colors.textMuted },
};

// `battery` é `{ value, exact }` ou null. `exact: false` quer dizer que o
// valor veio de uma estimativa por voltagem (frame Eddystone-TLM), não de
// uma leitura de % oficial — mostra com "~" pra deixar isso claro.
export default function BatteryBadge({ battery }) {
  const level = battery?.value ?? null;
  const tone = TONE_STYLES[batteryTone(level)];
  const label =
    level === null
      ? 'Bateria: —'
      : battery.exact
      ? `🔋 ${level}%`
      : `🔋 ~${level}%`;

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
