// Formata o array de bytes que o react-native-ble-manager devolve nos reads,
// em hex e decimal lado a lado — útil pra comparar com o valor de bateria
// mostrado no app proprietário e descobrir a codificação certa.
export function formatBytes(bytes) {
  if (!bytes || bytes.length === 0) return { hex: '(vazio)', decimal: '(vazio)' };
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const decimal = bytes.join(', ');
  return { hex, decimal };
}

// Converte o texto digitado pelo usuário num array de bytes pra escrever
// numa characteristic. Modo 'text': cada caractere vira seu código ASCII
// (ex: senha "minew123"). Modo 'hex': tokens separados por espaço/vírgula,
// cada um um byte em hexadecimal (ex: "01 0a ff").
export function parseBytesInput(input, mode) {
  const trimmed = (input || '').trim();
  if (!trimmed) return { bytes: null, error: 'Digite algo antes de enviar.' };

  if (mode === 'hex') {
    const tokens = trimmed.split(/[\s,]+/);
    const bytes = [];
    for (const token of tokens) {
      const value = parseInt(token, 16);
      if (Number.isNaN(value) || value < 0 || value > 255) {
        return { bytes: null, error: `"${token}" não é um byte hex válido (00-ff).` };
      }
      bytes.push(value);
    }
    return { bytes, error: null };
  }

  return { bytes: Array.from(trimmed).map((c) => c.charCodeAt(0) & 0xff), error: null };
}
