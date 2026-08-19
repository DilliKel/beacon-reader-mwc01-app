import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import BleManager, { BleState } from 'react-native-ble-manager';
import { requestBlePermissions } from '../ble/permissions';
import { BATTERY_SERVICE_UUID, BATTERY_LEVEL_CHAR_UUID, shortUuid } from '../ble/uuid';
import { DEFAULT_BADGE_SIGNATURES, matchesBadgeSignature } from '../ble/badgeSignature';
import { addBadgeSignature, loadBadgeSignatures } from '../storage/appStorage';

const SCAN_SECONDS = 8;

// Toda a lógica de BLE mora aqui — a tela só consome estado e chama ações.
// Fluxo: init() pede permissão, sobe o BleManager e assina os eventos de scan;
// startScan() dispara uma busca; readDeviceDetail() conecta num crachá específico
// pra ler a bateria (só quando o usuário toca nele, não em todos de uma vez,
// pra não brigar por conexão BLE com vários devices ao mesmo tempo).
export function useBleScanner() {
  const [devicesById, setDevicesById] = useState({});
  const [scanning, setScanning] = useState(false);
  const [bleState, setBleState] = useState(null);
  const [initError, setInitError] = useState(null);
  const [signatures, setSignatures] = useState(DEFAULT_BADGE_SIGNATURES);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'badges'
  const startedRef = useRef(false);

  useEffect(() => {
    const subscriptions = [];
    let cancelled = false;

    (async () => {
      try {
        const savedSignatures = await loadBadgeSignatures();
        if (cancelled) return;
        if (savedSignatures.length > 0) {
          setSignatures((prev) => Array.from(new Set([...prev, ...savedSignatures])));
          setFilterMode('badges');
        }

        const permission = await requestBlePermissions();
        if (cancelled) return;
        if (!permission.granted) {
          setInitError('Permissão de Bluetooth negada. Ative nas configurações do app.');
          return;
        }

        await BleManager.start({ showAlert: false });
        startedRef.current = true;

        const state = await BleManager.checkState();
        if (!cancelled) setBleState(state);

        subscriptions.push(
          BleManager.onDidUpdateState((event) => setBleState(event.state))
        );

        subscriptions.push(
          BleManager.onDiscoverPeripheral((peripheral) => {
            setDevicesById((prev) => {
              const existing = prev[peripheral.id];
              return {
                ...prev,
                [peripheral.id]: {
                  id: peripheral.id,
                  name:
                    peripheral.name ||
                    peripheral.advertising?.localName ||
                    existing?.name ||
                    null,
                  rssi: peripheral.rssi,
                  advertising: peripheral.advertising,
                  lastSeenAt: Date.now(),
                  status: existing?.status ?? 'idle',
                  battery: existing?.battery ?? null,
                  hasBatteryService: existing?.hasBatteryService ?? null,
                  errorMsg: existing?.errorMsg ?? null,
                },
              };
            });
          })
        );

        subscriptions.push(BleManager.onStopScan(() => setScanning(false)));
      } catch (err) {
        if (!cancelled) setInitError(err?.message ?? String(err));
      }
    })();

    return () => {
      cancelled = true;
      subscriptions.forEach((sub) => sub.remove());
      if (startedRef.current) BleManager.stopScan().catch(() => {});
    };
  }, []);

  const startScan = useCallback(async () => {
    if (!startedRef.current) return;
    try {
      if (Platform.OS === 'android' && bleState === BleState.Off) {
        await BleManager.enableBluetooth();
      }
      setInitError(null);
      setScanning(true);
      await BleManager.scan({ seconds: SCAN_SECONDS });
    } catch (err) {
      setScanning(false);
      setInitError(err?.message ?? String(err));
    }
  }, [bleState]);

  // Conecta num crachá específico, lê a bateria (Battery Service padrão BLE)
  // e desconecta em seguida — não fica com a conexão presa depois de ler.
  const readDeviceDetail = useCallback(async (id) => {
    setDevicesById((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'connecting', errorMsg: null },
    }));
    try {
      await BleManager.connect(id);
      setDevicesById((prev) => ({ ...prev, [id]: { ...prev[id], status: 'reading' } }));

      const info = await BleManager.retrieveServices(id);
      const batteryChar = info.characteristics?.find(
        (c) =>
          shortUuid(c.service) === BATTERY_SERVICE_UUID &&
          shortUuid(c.characteristic) === BATTERY_LEVEL_CHAR_UUID
      );

      let battery = null;
      if (batteryChar) {
        const bytes = await BleManager.read(id, batteryChar.service, batteryChar.characteristic);
        battery = bytes?.[0] ?? null;
      }

      setDevicesById((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'done',
          battery,
          hasBatteryService: Boolean(batteryChar),
        },
      }));
    } catch (err) {
      setDevicesById((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: 'error', errorMsg: err?.message ?? String(err) },
      }));
    } finally {
      BleManager.disconnect(id).catch(() => {});
    }
  }, []);

  // Marca o nome desse device como assinatura de crachá reconhecido,
  // persistindo pra próximas sessões e ligando o filtro "só crachás".
  const markAsBadge = useCallback(async (device) => {
    const name = device.name || device.advertising?.localName;
    if (!name) return;
    const token = name.trim().toLowerCase().split(/\s+/)[0];
    if (!token) return;
    const next = await addBadgeSignature(token);
    setSignatures((prev) => Array.from(new Set([...prev, ...next])));
    setFilterMode('badges');
  }, []);

  const devices = useMemo(() => {
    const all = Object.values(devicesById).map((d) => ({
      ...d,
      isKnownBadge: matchesBadgeSignature(d, signatures),
    }));
    const filtered = filterMode === 'badges' ? all.filter((d) => d.isKnownBadge) : all;
    return filtered.sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
  }, [devicesById, filterMode, signatures]);

  return {
    devices,
    scanning,
    bleState,
    initError,
    filterMode,
    setFilterMode,
    startScan,
    readDeviceDetail,
    markAsBadge,
  };
}
