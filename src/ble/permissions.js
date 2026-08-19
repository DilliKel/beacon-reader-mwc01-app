import { PermissionsAndroid, Platform } from 'react-native';

// Android 12+ (API 31+) usa BLUETOOTH_SCAN/BLUETOOTH_CONNECT em vez de localização.
// Versões mais antigas exigem ACCESS_FINE_LOCATION pra poder escanear BLE.
// iOS não precisa de nada aqui — a permissão é pedida automaticamente pelo
// CoreBluetooth na primeira vez que o app usa Bluetooth (texto vem do Info.plist,
// configurado via plugin do react-native-ble-manager no app.json).
export async function requestBlePermissions() {
  if (Platform.OS !== 'android') {
    return { granted: true };
  }

  const apiLevel = Platform.constants?.Version ?? Platform.Version;

  if (apiLevel >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    const granted = Object.values(result).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED
    );
    return { granted, result };
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Permissão de localização',
      message:
        'No Android antigo, o Bluetooth Low Energy exige acesso à localização pra escanear dispositivos próximos.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Cancelar',
    }
  );
  return { granted: result === PermissionsAndroid.RESULTS.GRANTED, result };
}
