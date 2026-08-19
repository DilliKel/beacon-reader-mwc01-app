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
    markAsBadge,
    renameDevice,
  } = useBleScanner();

  const [selectedId, setSelectedId] = useState(null);
  const selectedDevice = devices.find((d) => d.id === selectedId) || null;

  const bluetoothOff = bleState === BleState.Off;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>📡 Beacon Reader MWC01</Text>
        <Text style={styles.subtitle}>Leitor de crachás Minew — bateria, sinal e distância</Text>

        <View style={styles.headerControls}>
          <FilterToggle value={filterMode} onChange={setFilterMode} />
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
        onMarkAsBadge={markAsBadge}
        onSaveNickname={renameDevice}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  scanButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  scanButtonPressed: { opacity: 0.85 },
  scanButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
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
