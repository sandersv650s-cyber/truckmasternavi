import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const fail = (message: string, status = 400) => new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const deeplCodes: Record<string, string> = { nl: 'NL', en: 'EN-US', de: 'DE', fr: 'FR', es: 'ES', pt: 'PT-BR', it: 'IT', ja: 'JA', ko: 'KO', zh: 'ZH', tr: 'TR', pl: 'PL', uk: 'UK', id: 'ID', ar: 'AR' };

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Methode niet toegestaan', 405);
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return fail('Aanmelden vereist', 401);
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const key = Deno.env.get('DEEPL_AUTH_KEY');
  if (!url || !anon || !service || !key) return fail('Server is nog niet geconfigureerd', 503);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return fail('Ongeldige sessie', 401);
  const admin = createClient(url, service, { auth: { persistSession: false } });
  let payload: { conversation_id?: unknown; text?: unknown };
  try { payload = await req.json(); } catch { return fail('Ongeldige aanvraag'); }
  const id = payload.conversation_id;
  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !text || text.length > 2000) return fail('Gesprek of bericht ongeldig');
  const { data: members, error: memberError } = await admin.from('conversation_members').select('user_id').eq('conversation_id', id);
  if (memberError || !members?.some(m => m.user_id === user.id)) return fail('Geen toegang tot dit gesprek', 403);
  const ids = members.map(m => m.user_id);
  const { data: blocks, error: blockError } = await admin.from('blocks').select('blocker_id,blocked_id').in('blocker_id', ids).in('blocked_id', ids);
  if (blockError) return fail('Controle van blokkeringen mislukt', 500);
  if (blocks?.some(b => b.blocker_id === user.id || b.blocked_id === user.id)) return fail('Een gebruiker is geblokkeerd', 403);
  const { data: profiles, error: profileError } = await admin.from('profiles').select('id,language').in('id', ids);
  if (profileError || profiles?.length !== ids.length) return fail('Deelnemers niet gevonden', 500);
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error: quotaError } = await admin.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', user.id).gte('created_at', since);
  if (quotaError) return fail('Berichtlimiet controleren mislukt', 500);
  if ((count ?? 0) >= 15) return fail('Je verstuurt te snel berichten. Wacht een minuut.', 429);
  const source = profiles.find(p => p.id === user.id)?.language;
  if (!source || !deeplCodes[source]) return fail('Stel eerst je taal in');
  const targets = [...new Set(profiles.filter(p => p.id !== user.id && p.language !== source).map(p => p.language))];
  const translations: { language: string; translated_text: string }[] = [];
  // Translate before writing so a failed request does not leave an untranslated message.
  for (const language of targets) {
    if (!deeplCodes[language]) return fail('Taal wordt nog niet ondersteund');
    const response = await fetch(Deno.env.get('DEEPL_API_URL') || 'https://api-free.deepl.com/v2/translate', {
      method: 'POST', headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: [text], source_lang: source.toUpperCase(), target_lang: deeplCodes[language] }),
    });
    if (!response.ok) return fail('Vertaling tijdelijk niet beschikbaar', 503);
    const result = await response.json();
    const translated = result?.translations?.[0]?.text;
    if (typeof translated !== 'string' || !translated) return fail('Vertaling tijdelijk niet beschikbaar', 503);
    translations.push({ language, translated_text: translated });
  }
  const { data: message, error: insertError } = await admin.from('messages').insert({ conversation_id: id, sender_id: user.id, original_text: text, original_language: source }).select('id').single();
  if (insertError || !message) return fail('Bericht opslaan mislukt', 500);
  if (translations.length) {
    const { error: translationError } = await admin.from('message_translations').insert(translations.map(t => ({ ...t, message_id: message.id })));
    if (translationError) { await admin.from('messages').delete().eq('id', message.id); return fail('Vertaling opslaan mislukt', 500); }
  }
  return new Response(JSON.stringify({ id: message.id }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
