import nacl from 'tweetnacl';
import * as base64 from 'base64-js';

export type Identity = { secretKey: Uint8Array; publicKey: Uint8Array };
export type CipherEnvelope = { recipient_id: string; nonce: string; ciphertext: string };
export const encode = (bytes: Uint8Array) => base64.fromByteArray(bytes);
export const decode = (value: string) => {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Ongeldige base64');
  return base64.toByteArray(value);
};
function toUtf8(value: string) {
  const escaped = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let i = 0; i < escaped.length; i++) {
    if (escaped[i] === '%') { bytes.push(parseInt(escaped.slice(i + 1, i + 3), 16)); i += 2; }
    else bytes.push(escaped.charCodeAt(i));
  }
  return new Uint8Array(bytes);
}
function fromUtf8(bytes: Uint8Array) {
  let escaped = '';
  for (const byte of bytes) escaped += `%${byte.toString(16).padStart(2, '0')}`;
  return decodeURIComponent(escaped);
}

export function identityFromSecret(secret: Uint8Array): Identity {
  if (secret.length !== nacl.box.secretKeyLength) throw new Error('Ongeldige privésleutel');
  return nacl.box.keyPair.fromSecretKey(secret);
}

export function seal(text: string, language: string, recipientId: string, recipientKey: string, identity: Identity, nonce: Uint8Array): CipherEnvelope {
  const publicKey = decode(recipientKey);
  if (publicKey.length !== nacl.box.publicKeyLength || nonce.length !== nacl.box.nonceLength) throw new Error('Ongeldige sleutel of nonce');
  const payload = toUtf8(JSON.stringify({ v: 1, text, language }));
  return { recipient_id: recipientId, nonce: encode(nonce), ciphertext: encode(nacl.box(payload, nonce, publicKey, identity.secretKey)) };
}

export function unseal(envelope: Pick<CipherEnvelope, 'nonce' | 'ciphertext'>, senderKey: string, identity: Identity): { text: string; language: string } {
  const nonce = decode(envelope.nonce); const publicKey = decode(senderKey); const ciphertext = decode(envelope.ciphertext);
  if (nonce.length !== nacl.box.nonceLength || publicKey.length !== nacl.box.publicKeyLength) throw new Error('Ongeldig versleuteld bericht');
  const plain = nacl.box.open(ciphertext, nonce, publicKey, identity.secretKey);
  if (!plain) throw new Error('Bericht kon niet worden ontsleuteld');
  const data = JSON.parse(fromUtf8(plain));
  if (data.v !== 1 || typeof data.text !== 'string' || typeof data.language !== 'string') throw new Error('Ongeldig berichtformaat');
  return { text: data.text, language: data.language };
}
