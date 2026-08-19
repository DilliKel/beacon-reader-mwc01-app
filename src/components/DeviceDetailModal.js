import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatDistance } from '../ble/distance';
import { shortUuid } from '../ble/uuid';
import { formatBytes } from '../ble/bytes';
import BatteryBadge from './BatteryBadge';

export default function DeviceDetailModal({
  device,
  isKnownBadge,
  onClose,
  onReadBattery,
  onMarkAsBadge,
  onSaveNickname,
  onReadCharacteristic,
  pendingCharRead,
}) {
  const [nicknameDraft, setNicknameDraft] = useState('');

  // Recarrega o rascunho do apelido sempre que abre um crachá diferente.
  useEffect(() => {
    setNicknameDraft(device?.nickname || '');
  }, [device?.id]);

  if (!device) return null;

  const isBusy = device.status === 'connecting' || device.status === 'reading';
  const nicknameChanged = nicknameDraft.trim() !== (device.nickname || '');
  const showNoBatteryWarning = device.status === 'done' && device.hasBatteryService === false;

  return (
    <Modal visible={Boolean(device)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {device.nickname || device.name || 'Crachá sem nome'}
              </Text>
              <Text style={styles.mac} numberOfLines={1}>
                {device.id}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>📶 {device.rssi ?? '—'} dBm</Text>
              <Text style={styles.metaText}>📏 {formatDistance(device.rssi)}</Text>
            </View>

            <Text style={styles.sectionLabel}>Apelido</Text>
            <View style={styles.nicknameRow}>
              <TextInput
                style={styles.nicknameInput}
                placeholder="ex: Capacete 12 — João"
                placeholderTextColor={colors.textMuted}
                value={nicknameDraft}
                onChangeText={setNicknameDraft}
              />
              <Pressable
                style={[styles.smallButton, !nicknameChanged && styles.smallButtonDisabled]}
                disabled={!nicknameChanged}
                onPress={() => onSaveNickname(device.id, nicknameDraft)}
              >
                <Text style={styles.smallButtonText}>Salvar</Text>
              </Pressable>
            </View>
            <Text style={styles.helperText}>
              Fica salvo neste celular, associado ao MAC — sobrevive a reabrir o app.
            </Text>

            <Text style={styles.sectionLabel}>Bateria</Text>
            <View style={styles.batteryRow}>
              <BatteryBadge level={device.battery} />
              <Pressable
                style={[styles.primaryButton, isBusy && styles.primaryButtonDisabled]}
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
            </View>

            {device.status === 'error' && (
              <Text style={styles.errorText}>{device.errorMsg || 'Falha ao conectar.'}</Text>
            )}

            {showNoBatteryWarning && (
              <Text style={styles.warningText}>
                Esse crachá conectou, mas não expõe o Battery Service padrão (0x180F/0x2A19).
                Veja os serviços encontrados abaixo — a bateria real provavelmente está numa
                characteristic proprietária do firmware Minew.
              </Text>
            )}

            {device.rawServices && device.rawServices.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  Serviços encontrados ({device.rawServices.length})
                </Text>
                {device.rawServices.map((service) => (
                  <View key={service.uuid} style={styles.serviceBlock}>
                    <Text style={styles.serviceUuid}>{shortUuid(service.uuid)}</Text>
                    {(device.rawCharacteristics || [])
                      .filter((c) => c.service === service.uuid)
                      .map((c) => {
                        const canRead = Boolean(c.properties?.Read);
                        const readKey = `${device.id}:${c.characteristic}`;
                        const isPending = pendingCharRead === readKey;
                        const result = device.rawReads?.[c.characteristic];
                        return (
                          <View key={c.characteristic} style={styles.charRow}>
                            <View style={styles.charTextBlock}>
                              <Text style={styles.charLine}>
                                · {shortUuid(c.characteristic)}{' '}
                                <Text style={styles.charProps}>
                                  ({Object.keys(c.properties || {}).join(', ') || '—'})
                                </Text>
                              </Text>
                              {result && !result.error && (
                                <Text style={styles.charResult}>
                                  hex: {formatBytes(result.bytes).hex} · dec:{' '}
                                  {formatBytes(result.bytes).decimal}
                                </Text>
                              )}
                              {result?.error && (
                                <Text style={styles.charResultError}>{result.error}</Text>
                              )}
                            </View>
                            {canRead && (
                              <Pressable
                                style={styles.readCharButton}
                                disabled={isPending}
                                onPress={() =>
                                  onReadCharacteristic(device.id, c.service, c.characteristic)
                                }
                              >
                                {isPending ? (
                                  <ActivityIndicator size="small" color={colors.accent} />
                                ) : (
                                  <Text style={styles.readCharButtonText}>Ler</Text>
                                )}
                              </Pressable>
                            )}
                          </View>
                        );
                      })}
                  </View>
                ))}
              </>
            )}

            {!isKnownBadge && (
              <Pressable style={styles.secondaryButton} onPress={() => onMarkAsBadge(device)}>
                <Text style={styles.secondaryButtonText}>Marcar como crachá</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.title, color: colors.textPrimary },
  mac: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  closeButton: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingBottom: spacing.lg },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaText: { ...typography.body, color: colors.textSecondary },
  sectionLabel: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  nicknameRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  nicknameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  helperText: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  batteryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  smallButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  smallButtonDisabled: { opacity: 0.4 },
  smallButtonText: { color: colors.surface, fontWeight: '700', fontSize: 13 },
  errorText: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  warningText: {
    ...typography.small,
    color: colors.warning,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  serviceBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  serviceUuid: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  charTextBlock: { flex: 1, marginRight: spacing.sm },
  charLine: { fontSize: 12, color: colors.textSecondary },
  charProps: { color: colors.textMuted },
  charResult: { fontSize: 11, color: colors.accent, marginTop: 2 },
  charResultError: { fontSize: 11, color: colors.danger, marginTop: 2 },
  readCharButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  readCharButtonText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  secondaryButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
