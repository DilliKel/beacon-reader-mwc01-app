// Decodifica os tipos de NDEF record mais comuns (Texto e URI) — o resto cai
// num fallback que só mostra os bytes crus, pra não escondermos nada
// desconhecido que apareça na tag do crachá.
const URI_PREFIXES = [
  '',
  'http://www.',
  'https://www.',
  'http://',
  'https://',
  'tel:',
  'mailto:',
  'ftp://anonymous:anonymous@',
  'ftp://ftp.',
  'ftps://',
  'sftp://',
  'smb://',
  'nfs://',
  'ftp://',
  'dav://',
  'news:',
  'telnet://',
  'imap:',
  'rtsp://',
  'urn:',
  'pop:',
  'sip:',
  'sips:',
  'tftp:',
  'btspp://',
  'btl2cap://',
  'btgoep://',
  'tcpobex://',
  'irdaobex://',
  'file://',
  'urn:epc:id:',
  'urn:epc:tag:',
  'urn:epc:pat:',
  'urn:epc:raw:',
  'urn:epc:',
  'urn:nfc:',
];

function bytesToUtf8(bytes) {
  try {
    return decodeURIComponent(
      bytes.map((b) => '%' + b.toString(16).padStart(2, '0')).join('')
    );
  } catch {
    return bytes.map((b) => String.fromCharCode(b)).join('');
  }
}

function decodeTextRecord(payload) {
  const statusByte = payload[0];
  const langLength = statusByte & 0x3f;
  const textBytes = payload.slice(1 + langLength);
  return bytesToUtf8(textBytes);
}

function decodeUriRecord(payload) {
  const prefix = URI_PREFIXES[payload[0]] || '';
  return prefix + bytesToUtf8(payload.slice(1));
}

// `type` no NdefRecord pode vir como array de bytes ou string, dependendo da
// plataforma/versão da lib — normaliza pros dois casos.
function typeToChar(type) {
  if (typeof type === 'string') return type;
  if (Array.isArray(type) && type.length === 1) return String.fromCharCode(type[0]);
  return null;
}

export function decodeNdefRecord(record) {
  const typeChar = typeToChar(record.type);
  const payload = record.payload || [];
  try {
    if (typeChar === 'T') return { kind: 'Texto', value: decodeTextRecord(payload) };
    if (typeChar === 'U') return { kind: 'URI', value: decodeUriRecord(payload) };
  } catch {
    // cai pro fallback abaixo
  }
  return { kind: 'Bruto', value: bytesToUtf8(payload) };
}
