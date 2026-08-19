import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNATURES_KEY = '@beacon-reader/badge-signatures';
const NICKNAMES_KEY = '@beacon-reader/nicknames';

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
