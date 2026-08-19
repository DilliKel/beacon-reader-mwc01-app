import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { formatBytes } from '../ble/bytes';
import { cancelNfcRead, ensureNfcStarted, normalizeIdForComparison, readNfcTagOnce } from '../nfc/nfcManager';
import { decodeNdefRecord } from '../nfc/ndef';

// status: 'checking' | 'unsupported' | 'waiting' | 'done' | 'error'
export default function NfcReadModal({ visible, onClose, matchDeviceById, onOpenDevice }) {
  const [status, setStatus] = useState('checking');
  const [tag, setTag] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const startReading = useCallback(async () => {
    setStatus('checking');
    setTag(null);
    setErrorMsg(null);
    try {
      const supported = await ensureNfcStarted();
      if (!supported) {
        setStatus('unsupported');
        return;
      }
      setStatus('waiting');
      const result = await readNfcTagOnce();
      setTag(result);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err?.message ?? String(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (visible) startReading();
    else cancelNfcRead();
  }, [visible, startReading]);

  const matchedDevice = tag?.id ? matchDeviceById(normalizeIdForComparison(tag.id)) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Ler crachá por NFC</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeButton}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {status === 'checking' && <Text style={styles.helperText}>Verificando NFC…</Text>}

            {status === 'unsupported' && (
              <Text style={styles.warningText}>
                Esse celular não tem NFC, ou está desligado nas configurações do Android.
              </Text>
            )}

            {status === 'waiting' && (
              <View style={styles.waitingBlock}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.waitingText}>Aproxime o crachá da parte de trás do celular…</Text>
              </View>
            )}

            {status === 'error' && (
              <>
                <Text style={styles.errorText}>{errorMsg || 'Falha ao ler a tag.'}</Text>
                <Pressable style={styles.retryButton} onPress={startReading}>
                  <Text style={styles.retryButtonText}>Tentar de novo</Text>
                </Pressable>
              </>
            )}

            {status === 'done' && tag && (
              <>
                <Text style={styles.sectionLabel}>UID da tag</Text>
                <Text style={styles.uidText}>{tag.id || '(sem UID)'}</Text>

                {matchedDevice && (
                  <Pressable
                    style={styles.matchButton}
                    onPress={() => {
                      onOpenDevice(matchedDevice);
                      onClose();
                    }}
                  >
                    <Text style={styles.matchButtonText}>
                      ✓ Bate com o crachá "{matchedDevice.nickname || matchedDevice.name || matchedDevice.id}" já visto no scan BLE — ver detalhes
                    </Text>
                  </Pressable>
                )}
                {!matchedDevice && (
                  <Text style={styles.helperText}>
                    Esse UID não bate com nenhum MAC já visto no scan BLE (pode ser um
                    identificador NFC diferente, sem relação com o MAC).
                  </Text>
                )}

                <Text style={styles.sectionLabel}>Tecnologias</Text>
                <Text style={styles.metaText}>{(tag.techTypes || []).join(', ') || '—'}</Text>

                <Text style={styles.sectionLabel}>
                  NDEF ({(tag.ndefMessage || []).length} record(s))
                </Text>
                {tag.ndefMessage && tag.ndefMessage.length > 0 ? (
                  tag.ndefMessage.map((record, idx) => {
                    const decoded = decodeNdefRecord(record);
                    return (
                      <View key={idx} style={styles.recordBlock}>
                        <Text style={styles.recordKind}>{decoded.kind}</Text>
                        <Text style={styles.recordValue}>{decoded.value}</Text>
                        <Text style={styles.recordRaw}>
                          bruto: {formatBytes(record.payload).hex}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.helperText}>Tag sem mensagem NDEF (ou não formatada).</Text>
                )}

                <Pressable style={styles.retryButton} onPress={startReading}>
                  <Text style={styles.retryButtonText}>Ler outro crachá</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
    minHeight: 260,
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.textPrimary },
  closeButton: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingBottom: spacing.lg },
  helperText: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  warningText: { ...typography.body, color: colors.warning },
  waitingBlock: { alignItems: 'center', paddingVertical: spacing.xl },
  waitingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorText: { ...typography.body, color: colors.danger },
  sectionLabel: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  uidText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  metaText: { ...typography.body, color: colors.textSecondary },
  matchButton: {
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  matchButtonText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  recordBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recordKind: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  recordValue: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  recordRaw: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  retryButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.md },
  retryButtonText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
