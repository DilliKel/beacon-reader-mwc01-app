// RSSI -> distância aproximada em metros.
// distance = 10 ^ ((txPower - RSSI) / 20)
// txPower é a força de sinal esperada a 1m do transmissor (varia por hardware/ambiente).
// Fórmula padrão de path-loss log-distância; erro típico de ±10-20%, serve como
// referência de proximidade, não como medição precisa.
const DEFAULT_TX_POWER = -59;

export function estimateDistanceMeters(rssi, txPower = DEFAULT_TX_POWER) {
  if (rssi === undefined || rssi === null || rssi === 0) return null;
  const distance = Math.pow(10, (txPower - rssi) / 20);
  return Math.round(distance * 10) / 10;
}

export function formatDistance(rssi) {
  const distance = estimateDistanceMeters(rssi);
  if (distance === null) return '—';
  return `~${distance}m`;
}
