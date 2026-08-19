// Assinaturas usadas pra reconhecer um crachá MWC01 em meio a outros
// dispositivos BLE ao redor. "MWC"/"Minew" são um chute razoável (mesmo do
// doc original), mas não confirmado — por isso o app deixa aprender novas
// assinaturas na hora (ver markAsBadge no useBleScanner), a partir do nome
// real que aparecer no scan de um crachá físico.
export const DEFAULT_BADGE_SIGNATURES = ['mwc', 'minew'];

export function matchesBadgeSignature(device, signatures) {
  const name = (device.name || device.advertising?.localName || '').toLowerCase();
  if (!name) return false;
  return signatures.some((signature) => name.includes(signature));
}
