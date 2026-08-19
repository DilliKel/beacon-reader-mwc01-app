import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatDistance } from '../ble/distance';
import BatteryBadge from './BatteryBadge';

export default function DeviceCard({ device, isKnownBadge, onReadBattery, onMarkAsBadge }) {
  const isBusy = device.status === 'connecting' || device.status === 'reading';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {device.name || 'Dispositivo sem nome'}
          </Text>
          <Text style={styles.mac} numberOfLines={1}>
            {device.id}
          </Text>
        </View>
        <BatteryBadge level={device.battery} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📶 {device.rssi ?? '—'} dBm</Text>
        <Text style={styles.metaText}>📏 {formatDistance(device.rssi)}</Text>
      </View>

      {device.status === 'error' && (
        <Text style={styles.errorText} numberOfLines={2}>
          {device.errorMsg || 'Falha ao conectar.'}
        </Text>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            isBusy && styles.primaryButtonDisabled,
            pressed && !isBusy && styles.primaryButtonPressed,
          ]}
          disabled={isBusy}
          onPress={() => onReadBattery(device.id)}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {device.status === 'done' ? 'Ler de novo' : 'Ler bateria'}
            </Text>
          )}
        </Pressable>

        {!isKnownBadge && (
          <Pressable style={styles.secondaryButton} onPress={() => onMarkAsBadge(device)}>
            <Text style={styles.secondaryButtonText}>Marcar como crachá</Text>
          </Pressable>
        )}
      </View>
    </View>
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
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  secondaryButton: { paddingVertical: spacing.sm },
  secondaryButtonText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
