import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { formatBytes, parseBytesInput } from '../ble/bytes';
import { shortUuid } from '../ble/uuid';

// Characteristic que é nosso palpite de canal de senha do serviço
// proprietário da Minew (única write-only do grupo a3c8750x) — mostra um
// atalho pra preencher a senha padrão documentada ("minew123").
const PASSWORD_CANDIDATE_UUID = 'a3c8750b';
const DEFAULT_PASSWORD = 'minew123';

export default function CharacteristicRow({ device, characteristic: c, isBusy, pendingCharRead, onRead, onWrite }) {
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeText, setWriteText] = useState('');
  const [writeMode, setWriteMode] = useState('text');

  const canRead = Boolean(c.properties?.Read);
  const canWrite = Boolean(c.properties?.Write || c.properties?.WriteWithoutResponse);
  const readKey = `${device.id}:${c.characteristic}`;
  const isPending = pendingCharRead === readKey;
  const readResult = device.rawReads?.[c.characteristic];
  const writeResult = device.writeResults?.[c.characteristic];
  const isPasswordCandidate = shortUuid(c.characteristic) === PASSWORD_CANDIDATE_UUID;

  const handleSend = () => {
    const { bytes, error } = parseBytesInput(writeText, writeMode);
    if (error) {
      Alert.alert('Não deu pra enviar', error);
      return;
    }
    Alert.alert(
      'Confirmar escrita',
      `Vai escrever ${bytes.length} byte(s) em ${shortUuid(c.characteristic)}. Isso pode alterar a configuração do crachá de forma irreversível. Confirma?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Escrever',
          style: 'destructive',
          onPress: () => onWrite(device.id, c.service, c.characteristic, bytes),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.line}>
            · {shortUuid(c.characteristic)}{' '}
            <Text style={styles.props}>({Object.keys(c.properties || {}).join(', ') || '—'})</Text>
          </Text>
          {readResult && !readResult.error && (
            <Text style={styles.result}>
              lido: hex {formatBytes(readResult.bytes).hex} · dec {formatBytes(readResult.bytes).decimal}
            </Text>
          )}
          {readResult?.error && <Text style={styles.resultError}>{readResult.error}</Text>}
          {writeResult && (
            <Text style={writeResult.ok ? styles.result : styles.resultError}>
              {writeResult.ok ? 'escrito: ' : 'falha ao escrever: '}
              {writeResult.ok ? formatBytes(writeResult.bytes).hex : writeResult.error}
            </Text>
          )}
        </View>

        <View style={styles.buttonsCol}>
          {canRead && (
            <Pressable style={[styles.actionButton, isBusy && styles.actionButtonDisabled]} disabled={isBusy} onPress={() => onRead(device.id, c.service, c.characteristic)}>
              {isPending ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={styles.actionButtonText}>Ler</Text>}
            </Pressable>
          )}
          {canWrite && (
            <Pressable
              style={[styles.actionButton, styles.writeButton, isBusy && styles.actionButtonDisabled]}
              disabled={isBusy}
              onPress={() => setWriteOpen((v) => !v)}
            >
              <Text style={styles.writeButtonText}>Escrever</Text>
            </Pressable>
          )}
        </View>
      </View>

      {writeOpen && (
        <View style={styles.writePanel}>
          {isPasswordCandidate && (
            <Text style={styles.hintText}>
              Suspeita: canal de senha do serviço proprietário. Senha padrão documentada da
              Minew: "{DEFAULT_PASSWORD}".
            </Text>
          )}
          <View style={styles.writeInputRow}>
            <TextInput
              style={styles.writeInput}
              placeholder={writeMode === 'hex' ? 'ex: 01 0a ff' : 'ex: minew123'}
              placeholderTextColor={colors.textMuted}
              value={writeText}
              onChangeText={setWriteText}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setWriteMode((m) => (m === 'text' ? 'hex' : 'text'))}>
              <Text style={styles.modeToggle}>{writeMode === 'text' ? 'Texto' : 'Hex'}</Text>
            </Pressable>
          </View>
          <View style={styles.writeActionsRow}>
            {isPasswordCandidate && (
              <Pressable onPress={() => { setWriteMode('text'); setWriteText(DEFAULT_PASSWORD); }}>
                <Text style={styles.quickFillText}>Preencher senha padrão</Text>
              </Pressable>
            )}
            <Pressable style={[styles.sendButton, isBusy && styles.actionButtonDisabled]} disabled={isBusy} onPress={handleSend}>
              <Text style={styles.sendButtonText}>Enviar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBlock: { flex: 1, marginRight: spacing.sm },
  line: { fontSize: 12, color: colors.textSecondary },
  props: { color: colors.textMuted },
  result: { fontSize: 11, color: colors.accent, marginTop: 2 },
  resultError: { fontSize: 11, color: colors.danger, marginTop: 2 },
  buttonsCol: { flexDirection: 'row', gap: spacing.xs },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  actionButtonDisabled: { opacity: 0.4 },
  actionButtonText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  writeButton: { borderColor: colors.danger },
  writeButtonText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  writePanel: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
  },
  hintText: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs },
  writeInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  writeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  modeToggle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  writeActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  quickFillText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  sendButton: {
    backgroundColor: colors.danger,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
