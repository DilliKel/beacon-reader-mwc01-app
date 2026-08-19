import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import BleManager, { BleState } from 'react-native-ble-manager';
import { requestBlePermissions } from '../ble/permissions';
import { BATTERY_SERVICE_UUID, BATTERY_LEVEL_CHAR_UUID, shortUuid } from '../ble/uuid';
import { DEFAULT_BADGE_SIGNATURES, matchesBadgeSignature } from '../ble/badgeSignature';
import { addBadgeSignature, loadBadgeSignatures, loadNicknames, setNickname } from '../storage/appStorage';
import { estimateBatteryPercent, extractEddystoneTlm } from '../ble/eddystoneTlm';

// 12s em vez de 8s: o frame Eddystone-TLM (bateria) não vem em todo
// advertising, os beacons revezam entre frames — precisa de uma janela um
// pouco maior pra ter boa chance de capturar um TLM de cada crachá por perto.
const SCAN_SECONDS = 12;

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
  const [nicknames, setNicknames] = useState({});
  const startedRef = useRef(false);

  useEffect(() => {
    const subscriptions = [];
    let cancelled = false;

    (async () => {
      try {
        const [savedSignatures, savedNicknames] = await Promise.all([
          loadBadgeSignatures(),
          loadNicknames(),
        ]);
        if (cancelled) return;
        if (savedSignatures.length > 0) {
          setSignatures((prev) => Array.from(new Set([...prev, ...savedSignatures])));
          setFilterMode('badges');
        }
        setNicknames(savedNicknames);

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
            // A Minew manda a bateria real no próprio advertising (frame
            // Eddystone-TLM), sem precisar conectar. Só chega de vez em
            // quando (o beacon revezaria entre frames), então preserva o
            // último valor visto em vez de apagar quando esse pacote
            // específico não trouxer um TLM novo.
            const tlm = extractEddystoneTlm(peripheral.advertising);

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
                  rawServices: existing?.rawServices ?? null,
                  rawCharacteristics: existing?.rawCharacteristics ?? null,
                  rawReads: existing?.rawReads ?? {},
                  batteryMv: tlm?.batteryMv ?? existing?.batteryMv ?? null,
                  temperatureC: tlm?.temperatureC ?? existing?.temperatureC ?? null,
                  uptimeSeconds: tlm?.uptimeSeconds ?? existing?.uptimeSeconds ?? null,
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
  // Guarda também a lista crua de services/characteristics encontrados: quando
  // o crachá não expõe o Battery Service padrão (muito comum em firmware
  // proprietário), isso é o que permite descobrir onde a bateria real mora.
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
          rawServices: info.services ?? [],
          rawCharacteristics: info.characteristics ?? [],
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

  // Lê o valor bruto de UMA characteristic específica — ferramenta de
  // exploração pra quando o crachá não segue os UUIDs padrão (caso do MWC01).
  // Reconecta a cada chamada (a conexão já foi fechada por readDeviceDetail),
  // então é mais lento que um read único, mas serve pra testar characteristic
  // por characteristic até achar onde a bateria de verdade mora.
  const [pendingCharRead, setPendingCharRead] = useState(null); // `${deviceId}:${characteristicUUID}`

  const readCharacteristic = useCallback(async (deviceId, serviceUUID, characteristicUUID) => {
    const key = `${deviceId}:${characteristicUUID}`;
    setPendingCharRead(key);
    try {
      await BleManager.connect(deviceId);
      await BleManager.retrieveServices(deviceId);
      const bytes = await BleManager.read(deviceId, serviceUUID, characteristicUUID);
      setDevicesById((prev) => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          rawReads: {
            ...(prev[deviceId]?.rawReads || {}),
            [characteristicUUID]: { bytes, error: null, readAt: Date.now() },
          },
        },
      }));
    } catch (err) {
      setDevicesById((prev) => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          rawReads: {
            ...(prev[deviceId]?.rawReads || {}),
            [characteristicUUID]: { bytes: null, error: err?.message ?? String(err), readAt: Date.now() },
          },
        },
      }));
    } finally {
      BleManager.disconnect(deviceId).catch(() => {});
      setPendingCharRead(null);
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

  // Salva um apelido local pro crachá (ex: "Capacete 12 - João"), persistido
  // por MAC, pra identificar fácil quem é quem depois de colar uma etiqueta nele.
  const renameDevice = useCallback(async (id, nickname) => {
    const next = await setNickname(id, nickname);
    setNicknames(next);
  }, []);

  const devices = useMemo(() => {
    const all = Object.values(devicesById).map((d) => {
      const batteryPercentEstimate = estimateBatteryPercent(d.batteryMv);
      return {
        ...d,
        isKnownBadge: matchesBadgeSignature(d, signatures),
        nickname: nicknames[d.id] || null,
        batteryPercentEstimate,
        // Prioriza um valor exato (se algum dia vier de GATT); na prática
        // pro MWC01 quem preenche isso é sempre a estimativa por voltagem.
        displayBattery:
          d.battery !== null && d.battery !== undefined
            ? { value: d.battery, exact: true }
            : batteryPercentEstimate !== null
            ? { value: batteryPercentEstimate, exact: false }
            : null,
      };
    });
    const filtered = filterMode === 'badges' ? all.filter((d) => d.isKnownBadge) : all;
    return filtered.sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
  }, [devicesById, filterMode, signatures, nicknames]);

  return {
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
  };
}
