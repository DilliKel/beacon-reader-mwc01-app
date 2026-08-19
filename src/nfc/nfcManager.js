import NfcManager, { NfcTech } from 'react-native-nfc-manager';

let started = false;

export async function ensureNfcStarted() {
  const supported = await NfcManager.isSupported();
  if (!supported) return false;
  if (!started) {
    await NfcManager.start();
    started = true;
  }
  return true;
}

// Fica esperando até um crachá ser encostado no celular (bloqueia até isso
// acontecer ou o pedido ser cancelado). Pede tanto Ndef quanto NfcA — não
// sabemos se a tag do MWC01 é formatada como NDEF, mas o UID costuma vir de
// qualquer jeito via NfcA.
export async function readNfcTagOnce() {
  try {
    await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
    return await NfcManager.getTag();
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export function cancelNfcRead() {
  return NfcManager.cancelTechnologyRequest().catch(() => {});
}

// Compara um UID de tag NFC com um MAC de BLE ignorando separadores/caixa —
// pra saber se o crachá encostado é o mesmo já visto no scan.
export function normalizeIdForComparison(value) {
  return (value || '').replace(/[^0-9a-f]/gi, '').toLowerCase();
}
