import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const fail = (message: string, status = 400) => new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
type Envelope = { recipient_id: string; nonce: string; ciphertext: string };

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Methode niet toegestaan', 405);
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return fail('Aanmelden vereist', 401);
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) return fail('Server is nog niet geconfigureerd', 503);

  const caller = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return fail('Ongeldige sessie', 401);
  let body: { conversation_id?: unknown; sender_public_key?: unknown; envelopes?: unknown };
  try { body = await req.json(); } catch { return fail('Ongeldige aanvraag'); }
  if (typeof body.conversation_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.conversation_id)) return fail('Gesprek ongeldig');
  if (typeof body.sender_public_key !== 'string' || body.sender_public_key.length !== 44) return fail('Sleutel ongeldig');
  const envelopes = body.envelopes;
  if (!Array.isArray(envelopes) || envelopes.length < 1 || envelopes.length > 20 || !envelopes.every((e: Envelope) =>
    e && typeof e.recipient_id === 'string' && typeof e.nonce === 'string' && e.nonce.length === 32 && typeof e.ciphertext === 'string' && e.ciphertext.length > 0 && e.ciphertext.length <= 16000)) return fail('Versleutelde kopieën ongeldig');

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc('store_encrypted_message', {
    cid: body.conversation_id, sender: user.id, sender_key: body.sender_public_key, envelopes,
  });
  if (error) return fail(error.message, 400);
  return new Response(JSON.stringify({ id: data }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
