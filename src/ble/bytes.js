// Formata o array de bytes que o react-native-ble-manager devolve nos reads,
// em hex e decimal lado a lado — útil pra comparar com o valor de bateria
// mostrado no app proprietário e descobrir a codificação certa.
export function formatBytes(bytes) {
  if (!bytes || bytes.length === 0) return { hex: '(vazio)', decimal: '(vazio)' };
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const decimal = bytes.join(', ');
  return { hex, decimal };
}
