import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { requireClient } from '@/lib/supabase';
import { decode, encode, identityFromSecret, seal, unseal, type CipherEnvelope, type Identity } from '@/lib/crypto-core';
import type { Envelope, Message } from '@/lib/types';

const secretName = (userId: string) => `worldchat.identity.${userId}`;
const pinName = (me: string, peer: string) => `worldchat.pin.${me}.${peer}`;
export class LostKeyError extends Error { constructor() { super('Dit account heeft al een sleutel op een ander toestel. Oude berichten zijn hier niet te lezen. Sleutelherstel is nog niet beschikbaar.'); } }

const pending = new Map<string, Promise<Identity>>();
export function ensureIdentity(userId: string): Promise<Identity> {
  const existing = pending.get(userId);
  if (existing) return existing;
  const task = initializeIdentity(userId).finally(() => pending.delete(userId));
  pending.set(userId, task);
  return task;
}

async function initializeIdentity(userId: string): Promise<Identity> {
  const client = requireClient();
  const { data, error } = await client.from('user_keys').select('public_key').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const stored = await SecureStore.getItemAsync(secretName(userId));
  if (!stored && data) throw new LostKeyError();
  const secret = stored ? decode(stored) : await Crypto.getRandomBytesAsync(32);
  const identity = identityFromSecret(secret);
  const publicKey = encode(identity.publicKey);
  if (data && data.public_key !== publicKey) throw new LostKeyError();
  if (!stored) await SecureStore.setItemAsync(secretName(userId), encode(secret), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  if (!data) {
    const { error: insertError } = await client.from('user_keys').insert({ user_id: userId, public_key: publicKey });
    if (insertError) {
      const { data: retry } = await client.from('user_keys').select('public_key').eq('user_id', userId).maybeSingle();
      if (retry?.public_key !== publicKey) throw insertError;
    }
  }
  return identity;
}

export async function checkPeerKey(me: string, peer: string, publicKey: string) {
  if (me === peer) return;
  const name = pinName(me, peer);
  const previous = await SecureStore.getItemAsync(name);
  if (previous && previous !== publicKey) throw new Error('De beveiligingssleutel van een deelnemer is veranderd. Verzenden/ontsleutelen is gestopt.');
  if (!previous) await SecureStore.setItemAsync(name, publicKey, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

export async function encryptForMembers(me: string, text: string, language: string, memberIds: string[]) {
  const client = requireClient(); const identity = await ensureIdentity(me);
  const { data, error } = await client.from('user_keys').select('user_id,public_key').in('user_id', memberIds);
  if (error) throw error;
  if (data?.length !== memberIds.length) throw new Error('Een deelnemer heeft nog geen versleuteling ingesteld.');
  const envelopes: CipherEnvelope[] = [];
  for (const member of data) {
    await checkPeerKey(me, member.user_id, member.public_key);
    envelopes.push(seal(text, language, member.user_id, member.public_key, identity, await Crypto.getRandomBytesAsync(24)));
  }
  return { sender_public_key: encode(identity.publicKey), envelopes };
}

export async function decryptMyMessage(me: string, message: Message, envelope: Envelope) {
  const identity = await ensureIdentity(me);
  if (message.sender_id !== me) await checkPeerKey(me, message.sender_id, message.sender_public_key);
  else if (message.sender_public_key !== encode(identity.publicKey)) throw new Error('Eigen sleutel is gewijzigd');
  return unseal(envelope, message.sender_public_key, identity);
}

export async function fingerprint(key: string) {
  return (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key)).slice(0, 32).match(/.{1,4}/g)?.join(' ') ?? '';
}
