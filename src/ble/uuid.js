// UUIDs padrão Bluetooth SIG (Battery Service) — confirmados corretos no doc original.
export const BATTERY_SERVICE_UUID = '180f';
export const BATTERY_LEVEL_CHAR_UUID = '2a19';

const FULL_UUID_PATTERN = /^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/;

// O Android/iOS costuma devolver o UUID de 128 bits completo
// (ex: "00002a19-0000-1000-8000-00805f9b34fb"); isso reduz pra forma curta
// ("2a19") pra facilitar comparação com as constantes acima.
export function shortUuid(uuid) {
  if (!uuid) return '';
  const cleaned = uuid.toLowerCase();
  const match = cleaned.match(FULL_UUID_PATTERN);
  return match ? match[1] : cleaned;
}
