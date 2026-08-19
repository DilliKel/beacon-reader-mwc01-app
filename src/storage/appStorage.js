import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNATURES_KEY = '@beacon-reader/badge-signatures';
const NICKNAMES_KEY = '@beacon-reader/nicknames';
const KNOWN_MACS_KEY = '@beacon-reader/known-badge-macs';

// MACs marcados manualmente como crachá — mecanismo principal de
// reconhecimento. Ao contrário do nome anunciado (que o MWC01 pode não
// transmitir), o MAC sempre existe, então "Marcar como crachá" nunca falha
// silenciosamente por falta de dado.
export async function loadKnownBadgeMacs() {
  try {
    const raw = await AsyncStorage.getItem(KNOWN_MACS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addKnownBadgeMac(mac) {
  const normalized = (mac || '').trim().toLowerCase();
  const current = await loadKnownBadgeMacs();
  if (!normalized || current.includes(normalized)) return current;
  const next = [...current, normalized];
  await AsyncStorage.setItem(KNOWN_MACS_KEY, JSON.stringify(next));
  return next;
}

export async function loadBadgeSignatures() {
  try {
    const raw = await AsyncStorage.getItem(SIGNATURES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Salva um novo trecho de nome como assinatura de crachá reconhecido
// (ex: primeira palavra do nome anunciado por um MWC01 real já identificado).
export async function addBadgeSignature(signature) {
  const normalized = signature.trim().toLowerCase();
  const current = await loadBadgeSignatures();
  if (!normalized || current.includes(normalized)) return current;
  const next = [...current, normalized];
  await AsyncStorage.setItem(SIGNATURES_KEY, JSON.stringify(next));
  return next;
}

export async function loadNicknames() {
  try {
    const raw = await AsyncStorage.getItem(NICKNAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setNickname(deviceId, nickname) {
  const current = await loadNicknames();
  const next = { ...current, [deviceId]: nickname.trim() };
  await AsyncStorage.setItem(NICKNAMES_KEY, JSON.stringify(next));
  return next;
}
