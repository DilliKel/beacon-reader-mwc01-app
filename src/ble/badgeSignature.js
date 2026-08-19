// Assinaturas usadas pra reconhecer um crachá MWC01 em meio a outros
// dispositivos BLE ao redor. "MWC"/"Minew" são um chute razoável (mesmo do
// doc original), mas não confirmado — por isso o app deixa aprender novas
// assinaturas na hora (ver markAsBadge no useBleScanner), a partir do nome
// real que aparecer no scan de um crachá físico.
export const DEFAULT_BADGE_SIGNATURES = ['mwc', 'minew'];

export function matchesNameSignature(device, signatures) {
  const name = (device.name || device.advertising?.localName || '').toLowerCase();
  if (!name) return false;
  return signatures.some((signature) => name.includes(signature));
}

// Mecanismo principal: reconhece pelo MAC marcado manualmente via "Marcar
// como crachá". Funciona mesmo quando o crachá não anuncia nome nenhum no
// BLE (caso do MWC01) — diferente do matchesNameSignature acima, que
// silenciosamente nunca reconhece nada sem um nome pra comparar.
export function matchesKnownMac(device, knownMacs) {
  return knownMacs.has(device.id.toLowerCase());
}

export function isRecognizedBadge(device, signatures, knownMacs) {
  return matchesKnownMac(device, knownMacs) || matchesNameSignature(device, signatures);
}
