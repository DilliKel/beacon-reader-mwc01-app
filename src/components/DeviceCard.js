import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatDistance } from '../ble/distance';
import BatteryBadge from './BatteryBadge';

export default function DeviceCard({ device, onPress }) {
  const caption =
    device.status === 'error'
      ? device.errorMsg || 'Falha ao conectar.'
      : device.status === 'done' && device.hasBatteryService === false
      ? 'Sem Battery Service padrão — toque para ver detalhes'
      : device.status === 'connecting' || device.status === 'reading'
      ? 'Lendo…'
      : 'Toque para configurar';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(device)}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {device.nickname || device.name || 'Dispositivo sem nome'}
          </Text>
          <Text style={styles.mac} numberOfLines={1}>
            {device.nickname ? device.name || device.id : device.id}
          </Text>
        </View>
        <BatteryBadge level={device.battery} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📶 {device.rssi ?? '—'} dBm</Text>
        <Text style={styles.metaText}>📏 {formatDistance(device.rssi)}</Text>
      </View>

      <Text
        style={[styles.caption, device.status === 'error' && styles.captionError]}
        numberOfLines={2}
      >
        {caption}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: { opacity: 0.85 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: { ...typography.cardTitle, color: colors.textPrimary },
  mac: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  metaText: { ...typography.body, color: colors.textSecondary },
  caption: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  captionError: { color: colors.danger },
});
