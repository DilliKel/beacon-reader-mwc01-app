import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BleState } from 'react-native-ble-manager';
import { colors, spacing, typography } from '../theme';
import { useBleScanner } from '../hooks/useBleScanner';
import DeviceCard from '../components/DeviceCard';
import DeviceDetailModal from '../components/DeviceDetailModal';
import EmptyState from '../components/EmptyState';
import FilterToggle from '../components/FilterToggle';
import NfcReadModal from '../components/NfcReadModal';
import { normalizeIdForComparison } from '../nfc/nfcManager';

const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function ScanScreen() {
  const {
    devices,
    scanning,
    bleState,
    initError,
    filterMode,
    setFilterMode,
    startScan,
    readDeviceDetail,
    readCharacteristic,
    pendingCharRead,
    markAsBadge,
    renameDevice,
  } = useBleScanner();

  const [selectedId, setSelectedId] = useState(null);
  const [nfcModalVisible, setNfcModalVisible] = useState(false);
  const selectedDevice = devices.find((d) => d.id === selectedId) || null;

  const bluetoothOff = bleState === BleState.Off;

  // Compara o UID lido por NFC com os MACs já vistos no scan BLE, ignorando
  // separadores/caixa — usado pra "pular" direto pro crachá certo.
  const findDeviceByNormalizedId = (normalizedId) =>
    devices.find((d) => normalizeIdForComparison(d.id) === normalizedId) || null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>📡 Beacon Reader MWC01</Text>
        <Text style={styles.subtitle}>Leitor de crachás Minew — bateria, sinal e distância</Text>

        <View style={styles.headerControls}>
          <FilterToggle value={filterMode} onChange={setFilterMode} />
        </View>

        <View style={styles.headerButtons}>
          <Pressable
            style={({ pressed }) => [styles.nfcButton, pressed && styles.scanButtonPressed]}
            onPress={() => setNfcModalVisible(true)}
          >
            <Text style={styles.nfcButtonText}>📇 NFC</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.scanButton, pressed && styles.scanButtonPressed]}
            onPress={startScan}
            disabled={scanning}
          >
            <Text style={styles.scanButtonText}>
              {scanning ? 'Escaneando…' : 'Escanear'}
            </Text>
          </Pressable>
        </View>

        {bluetoothOff && (
          <Text style={styles.warningText}>Bluetooth está desligado.</Text>
        )}
        {initError && <Text style={styles.warningText}>{initError}</Text>}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DeviceCard device={item} onPress={() => setSelectedId(item.id)} />}
        ListEmptyComponent={<EmptyState scanning={scanning} filterMode={filterMode} />}
      />

      <DeviceDetailModal
        device={selectedDevice}
        isKnownBadge={selectedDevice?.isKnownBadge}
        onClose={() => setSelectedId(null)}
        onReadBattery={readDeviceDetail}
        onReadCharacteristic={readCharacteristic}
        pendingCharRead={pendingCharRead}
        onMarkAsBadge={markAsBadge}
        onSaveNickname={renameDevice}
      />

      <NfcReadModal
        visible={nfcModalVisible}
        onClose={() => setNfcModalVisible(false)}
        matchDeviceById={findDeviceByNormalizedId}
        onOpenDevice={(device) => setSelectedId(device.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: ANDROID_STATUS_BAR_HEIGHT,
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { ...typography.title, color: colors.surface },
  subtitle: { ...typography.subtitle, color: colors.headerSubtitle, marginTop: 4 },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  scanButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  scanButtonPressed: { opacity: 0.85 },
  scanButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  nfcButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  nfcButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  warningText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
