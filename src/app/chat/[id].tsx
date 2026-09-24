import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Avatar, colors } from '@/components/ui';
import { useSession } from '@/lib/session';
import { requireClient } from '@/lib/supabase';
import { decryptMyMessage, encryptForMembers, fingerprint } from '@/lib/crypto';
import { translateOnDevice } from '@/lib/translation';
import type { Envelope, Message, Profile } from '@/lib/types';

type Visible = Message & { plain?: string; language?: string; translated?: string; translatedTo?: string; warning?: string };
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { session, profile } = useSession();
  const [messages, setMessages] = useState<Visible[]>([]); const [names, setNames] = useState<Record<string, Profile>>({});
  const [others, setOthers] = useState<Profile[]>([]); const [members, setMembers] = useState<string[]>([]);
  const [title, setTitle] = useState('Gesprek'); const [body, setBody] = useState(''); const [sending, setSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({}); const [error, setError] = useState('');
  const scroll = useRef<ScrollView>(null); const cache = useRef<Record<string, Visible>>({});
  const translating = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!id || !session || !profile) return;
    const client = requireClient();
    const [memberResult, conversation, messageResult] = await Promise.all([
      client.from('conversation_members').select('user_id').eq('conversation_id', id),
      client.from('conversations').select('title').eq('id', id).single(),
      client.from('encrypted_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }).limit(200),
    ]);
    if (memberResult.error || conversation.error || messageResult.error) { setError('Dit gesprek kon niet worden geopend.'); return; }
    const ids = (memberResult.data ?? []).map(m => m.user_id); setMembers(ids);
    const people = await client.from('profiles').select('*').in('id', ids);
    if (people.error) { setError(people.error.message); return; }
    const ps = (people.data ?? []) as Profile[]; setNames(Object.fromEntries(ps.map(p => [p.id, p])));
    const peers = ps.filter(p => p.id !== session.user.id); setOthers(peers);
    setTitle(conversation.data.title || peers.map(p => p.display_name).join(', ') || 'Gesprek');
    const list = (messageResult.data ?? []) as Message[];
    if (!list.length) { setMessages([]); setError(''); return; }
    const encrypted = await client.from('message_envelopes').select('*').eq('recipient_id', session.user.id).in('message_id', list.map(m => m.id));
    if (encrypted.error) { setError(encrypted.error.message); return; }
    const byMessage = new Map(((encrypted.data ?? []) as Envelope[]).map(e => [e.message_id, e]));
    const visible: Visible[] = [];
    for (const message of list) {
      const previous = cache.current[message.id];
      if (previous && (previous.language === profile.language || previous.translatedTo === profile.language || translating.current.has(message.id))) { visible.push(previous); continue; }
      const envelope = byMessage.get(message.id);
      if (!envelope) { visible.push({ ...message, warning: 'Versleutelde kopie nog niet beschikbaar' }); continue; }
      try {
        const plain = await decryptMyMessage(session.user.id, message, envelope);
        const item: Visible = { ...message, plain: plain.text, language: plain.language };
        cache.current[message.id] = item; visible.push(item);
      } catch (e) { visible.push({ ...message, warning: e instanceof Error ? e.message : 'Ontsleutelen mislukt' }); }
    }
    setMessages(visible); setError('');
    for (const item of visible) {
      if (!item.plain || item.sender_id === session.user.id || item.language === profile.language || item.translatedTo === profile.language || translating.current.has(item.id)) continue;
      translating.current.add(item.id);
      void translateOnDevice(item.plain, item.language!, profile.language).then(translated => {
        const updated = { ...item, translated, translatedTo: profile.language, warning: undefined };
        cache.current[item.id] = updated;
        setMessages(xs => xs.map(x => x.id === item.id ? updated : x));
      }).catch(() => {
        const updated = { ...item, warning: 'Vertaling op dit toestel niet beschikbaar. Origineel zichtbaar.' };
        cache.current[item.id] = updated;
        setMessages(xs => xs.map(x => x.id === item.id ? updated : x));
      }).finally(() => translating.current.delete(item.id));
    }
  }, [id, session?.user.id, profile?.language]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!id || !session) return;
    const client = requireClient();
    const channel = client.channel(`encrypted-chat:${id}:${session.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_envelopes', filter: `recipient_id=eq.${session.user.id}` }, () => void load()).subscribe();
    return () => { void client.removeChannel(channel); };
  }, [id, session?.user.id, load]);

  async function send() {
    if (!body.trim() || !profile || !session || sending || !members.length) return;
    const text = body.trim(); if (text.length > 2000) return;
    setSending(true);
    try {
      const encrypted = await encryptForMembers(session.user.id, text, profile.language, members);
      const { data, error: sendError } = await requireClient().functions.invoke('send-message', { body: { conversation_id: id, ...encrypted } });
      if (sendError || data?.error) throw new Error(data?.error || sendError?.message || 'Bericht verzenden mislukt.');
      setBody(''); await load();
    } catch (e) { Alert.alert('Bericht niet verzonden', e instanceof Error ? e.message : 'Probeer het opnieuw.'); }
    finally { setSending(false); }
  }
  async function showPeer(p: Profile) {
    const { data } = await requireClient().from('user_keys').select('public_key').eq('user_id', p.id).maybeSingle();
    const code = data ? await fingerprint(data.public_key) : 'Geen sleutel';
    Alert.alert(p.display_name, `@${p.username} · ${p.country || 'Wereldwijd'}\n\nBeveiligingscode: ${code}\nVergelijk deze code rechtstreeks met ${p.display_name}.`, [
      { text: 'Sluiten' }, { text: 'Rapporteren', onPress: () => report(p) }, { text: 'Blokkeren', onPress: () => block(p), style: 'destructive' },
    ]);
  }
  function block(p: Profile) {
    Alert.alert('Gebruiker blokkeren', `Wil je ${p.display_name} blokkeren?`, [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Blokkeren', style: 'destructive', onPress: async () => {
        const { error: err } = await requireClient().from('blocks').insert({ blocker_id: session!.user.id, blocked_id: p.id });
        Alert.alert(err ? 'Blokkeren mislukt' : 'Geblokkeerd', err?.message ?? 'Er kunnen geen nieuwe berichten meer worden verzonden in dit gesprek.');
      } },
    ]);
  }
  function report(p: Profile) {
    Alert.alert('Gebruiker rapporteren', 'De beheerder kan je versleutelde berichtinhoud niet lezen. Deze melding bevat alleen het profiel en de reden.', [
      { text: 'Annuleren', style: 'cancel' }, { text: 'Spam', onPress: () => void submitReport(p, 'spam') },
      { text: 'Ongewenst gedrag', onPress: () => void submitReport(p, 'abuse') },
    ]);
  }
  async function submitReport(p: Profile, reason: string) {
    const { error: err } = await requireClient().from('reports').insert({ reporter_id: session!.user.id, reported_id: p.id, reason });
    Alert.alert(err ? 'Melden mislukt' : 'Melding ontvangen', err?.message ?? 'Bedankt voor je melding.');
  }
  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
    <Stack.Screen options={{ title }} />
    <ScrollView ref={scroll} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 13, flexGrow: 1 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
      <View style={{ padding: 15, backgroundColor: colors.pale, borderRadius: 16, gap: 5 }}><Text style={{ color: colors.sea, fontWeight: '700' }}>🔒 Alleen gesprekspartners kunnen berichten lezen</Text><Text style={{ color: colors.muted }}>Vertaling gebeurt op je telefoon. De eerste keer downloadt je telefoon taalmodellen via wifi. Tik op een bericht om het origineel te zien.</Text></View>
      {others.map(p => <Pressable key={p.id} onPress={() => void showPeer(p)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Avatar name={p.display_name} size={26} /><Text style={{ color: colors.muted }}>{p.display_name} · tik voor beveiligingscode</Text></Pressable>)}
      {error ? <Text style={{ color: '#A32235' }}>{error}</Text> : null}
      {!error && !messages.length ? <Text style={{ color: colors.muted, textAlign: 'center', padding: 28 }}>Zeg hallo! Je bericht wordt versleuteld voordat het je telefoon verlaat.</Text> : null}
      {messages.map(m => {
        const mine = m.sender_id === session?.user.id; const translated = !mine && m.translated && !showOriginal[m.id];
        return <Pressable key={m.id} onPress={() => setShowOriginal(prev => ({ ...prev, [m.id]: !prev[m.id] }))} style={{ maxWidth: '85%', alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: mine ? colors.sea : 'white', borderRadius: 18, padding: 13, gap: 5 }}>
          {!mine ? <Text style={{ fontWeight: '700', color: colors.sea }}>{names[m.sender_id]?.display_name ?? 'Gebruiker'}</Text> : null}
          <Text selectable style={{ color: mine ? 'white' : colors.ink, fontSize: 16, lineHeight: 23 }}>{translated ? m.translated : m.plain ?? '🔒 Bericht niet leesbaar'}</Text>
          {m.warning ? <Text style={{ color: mine ? '#FFE1E1' : '#A32235', fontSize: 12 }}>{m.warning}</Text> : null}
          <Text style={{ color: mine ? '#CDEAE7' : colors.muted, fontSize: 11 }}>{m.translated ? translated ? 'Op toestel vertaald · tik voor origineel' : 'Origineel · tik voor vertaling' : 'Origineel'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </Pressable>;
      })}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-end', padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderColor: colors.border }}>
      <TextInput accessibilityLabel="Bericht" value={body} onChangeText={setBody} multiline maxLength={2000} placeholder="Typ je bericht…" placeholderTextColor={colors.muted} style={{ flex: 1, maxHeight: 120, minHeight: 43, color: colors.ink, padding: 11, borderRadius: 15, backgroundColor: colors.background, fontSize: 16 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Versturen" disabled={!body.trim() || sending || Boolean(error)} onPress={send} style={{ borderRadius: 15, padding: 12, backgroundColor: colors.sea, opacity: !body.trim() || sending ? .5 : 1 }}><Text style={{ color: 'white', fontWeight: '700' }}>{sending ? '…' : 'Verstuur'}</Text></Pressable>
    </View>
  </KeyboardAvoidingView>;
}
