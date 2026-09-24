import test from 'node:test';
import assert from 'node:assert/strict';
import { decode, encode, identityFromSecret, seal, unseal } from '../src/lib/crypto-core.ts';

const alice = identityFromSecret(new Uint8Array(32).fill(1));
const bob = identityFromSecret(new Uint8Array(32).fill(2));
const eve = identityFromSecret(new Uint8Array(32).fill(3));

test('a recipient can read multilingual text; an unrelated key cannot', () => {
  const envelope = seal('Hoi 👋 こんにちは', 'nl', 'bob', encode(bob.publicKey), alice, new Uint8Array(24).fill(7));
  assert.equal(envelope.ciphertext.includes('Hoi'), false);
  assert.deepEqual(unseal(envelope, encode(alice.publicKey), bob), { text: 'Hoi 👋 こんにちは', language: 'nl' });
  assert.throws(() => unseal(envelope, encode(alice.publicKey), eve));
});

test('tampering with ciphertext or sender key is rejected', () => {
  const envelope = seal('Privé', 'nl', 'bob', encode(bob.publicKey), alice, new Uint8Array(24).fill(8));
  const altered = decode(envelope.ciphertext); altered[0] ^= 1;
  assert.throws(() => unseal({ ...envelope, ciphertext: encode(altered) }, encode(alice.publicKey), bob));
  assert.throws(() => unseal(envelope, encode(eve.publicKey), bob));
});
