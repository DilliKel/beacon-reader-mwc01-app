import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, batteryTone } from '../theme';

const TONE_STYLES = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  muted: { bg: colors.surfaceMuted, fg: colors.textMuted },
};

export default function BatteryBadge({ level }) {
  const tone = TONE_STYLES[batteryTone(level)];
  const label = level === null || level === undefined ? 'Bateria: —' : `🔋 ${level}%`;

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
