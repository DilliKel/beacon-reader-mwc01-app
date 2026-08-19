import { shortUuid } from './uuid';

// Eddystone-TLM (telemetria) — frame público do padrão Eddystone (Google),
// documentado em https://github.com/google/eddystone/blob/master/eddystone-tlm/tlm-plain.md
// O SDK oficial da Minew (BeaconSET Plus) lê a bateria exatamente daqui: do
// Service Data do advertising, frame tipo 0x20 — SEM precisar conectar no
// crachá. É por isso que "Ler bateria" via GATT nunca funcionava: a Minew
// não usa o Battery Service padrão (0x180F), usa este frame no broadcast.
export const EDDYSTONE_SERVICE_UUID = 'feaa';
const TLM_FRAME_TYPE = 0x20;

export function parseEddystoneTlm(bytes) {
  if (!bytes || bytes.length < 14 || bytes[0] !== TLM_FRAME_TYPE) return null;

  const batteryMv = (bytes[2] << 8) | bytes[3];

  const rawTemp = (bytes[4] << 8) | bytes[5];
  const signedTemp = rawTemp & 0x8000 ? rawTemp - 0x10000 : rawTemp;
  const temperatureC = rawTemp === 0x8000 ? null : signedTemp / 256;

  const pduCount =
    ((bytes[6] << 24) | (bytes[7] << 16) | (bytes[8] << 8) | bytes[9]) >>> 0;
  const uptimeSeconds =
    (((bytes[10] << 24) | (bytes[11] << 16) | (bytes[12] << 8) | bytes[13]) >>> 0) / 10;

  return {
    batteryMv: batteryMv || null,
    temperatureC,
    pduCount,
    uptimeSeconds,
  };
}

// Acha o frame TLM dentro do serviceData do advertising, se o crachá tiver
// transmitido um nesse ciclo de scan (beacons Eddystone alternam entre
// frames UID/TLM, então pode levar alguns segundos até aparecer).
export function extractEddystoneTlm(advertising) {
  const serviceData = advertising?.serviceData;
  if (!serviceData) return null;

  for (const [uuid, data] of Object.entries(serviceData)) {
    if (shortUuid(uuid) === EDDYSTONE_SERVICE_UUID) {
      const parsed = parseEddystoneTlm(data?.bytes);
      if (parsed) return parsed;
    }
  }
  return null;
}

// Estimativa de % a partir da voltagem — NÃO é oficial (a Minew não publica
// a curva de descarga da bateria do MWC01). Assume uma curva linear típica
// de pilha tipo moeda (~3.0V cheia, ~2.0V vazia), que é a referência mais
// comum usada por ferramentas de beacon quando a curva real não é conhecida.
// Sempre exibir a voltagem crua junto — ela é o dado real, isso aqui é só
// uma leitura de bolso.
const EMPTY_MV = 2000;
const FULL_MV = 3000;

export function estimateBatteryPercent(batteryMv) {
  if (!batteryMv) return null;
  const clamped = Math.min(Math.max(batteryMv, EMPTY_MV), FULL_MV);
  return Math.round(((clamped - EMPTY_MV) / (FULL_MV - EMPTY_MV)) * 100);
}
