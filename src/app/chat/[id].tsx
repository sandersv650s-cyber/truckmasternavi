import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Avatar, colors } from '@/components/ui';
import { useSession } from '@/lib/session';
import { requireClient } from '@/lib/supabase';
import type { Message, Profile } from '@/lib/types';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useSession();
  const [messages, setMessages] = useState<Message[]>([]); const [translations, setTranslations] = useState<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, Profile>>({}); const [others, setOthers] = useState<Profile[]>([]);
  const [title, setTitle] = useState('Gesprek'); const [body, setBody] = useState(''); const [sending, setSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({}); const [error, setError] = useState('');
  const scroll = useRef<ScrollView>(null);
  const load = useCallback(async () => {
    if (!id || !session || !profile) return;
    const client = requireClient();
    const [members, conversation, msgs] = await Promise.all([
      client.from('conversation_members').select('user_id').eq('conversation_id', id),
      client.from('conversations').select('title').eq('id', id).single(),
      client.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }).limit(200),
    ]);
    if (members.error || conversation.error || msgs.error) { setError('Dit gesprek kon niet worden geopend.'); return; }
    const people = await client.from('profiles').select('*').in('id', (members.data ?? []).map(m => m.user_id));
    if (people.error) { setError(people.error.message); return; }
    const ps = (people.data ?? []) as Profile[];
    setNames(Object.fromEntries(ps.map(p => [p.id, p])));
    const peers = ps.filter(p => p.id !== session.user.id); setOthers(peers);
    setTitle(conversation.data.title || peers.map(p => p.display_name).join(', ') || 'Gesprek');
    const list = (msgs.data ?? []) as Message[]; setMessages(list);
    if (list.length) {
      const ts = await client.from('message_translations').select('message_id,translated_text').in('message_id', list.map(m => m.id)).eq('language', profile.language);
      if (!ts.error) setTranslations(Object.fromEntries((ts.data ?? []).map(t => [t.message_id, t.translated_text])));
    }
    setError('');
  }, [id, session?.user.id, profile?.language]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!id) return;
    const client = requireClient();
    const ch = client.channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, () => void load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_translations' }, () => void load())
      .subscribe();
    return () => { void client.removeChannel(ch); };
  }, [id, load]);
  async function send() {
    if (!body.trim() || !profile || sending) return;
    const text = body.trim(); setSending(true);
    try {
      const { data, error: sendError } = await requireClient().functions.invoke('send-message', { body: { conversation_id: id, text } });
      if (sendError || data?.error) throw new Error(data?.error || sendError?.message || 'Bericht verzenden mislukt.');
      setBody(''); await load();
    } catch (e) { Alert.alert('Bericht niet verzonden', e instanceof Error ? e.message : 'Probeer het opnieuw.'); }
    finally { setSending(false); }
  }
  async function block(p: Profile) {
    Alert.alert('Gebruiker blokkeren', `Wil je ${p.display_name} blokkeren?`, [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Blokkeren', style: 'destructive', onPress: async () => {
        const { error: err } = await requireClient().from('blocks').insert({ blocker_id: session!.user.id, blocked_id: p.id });
        Alert.alert(err ? 'Blokkeren mislukt' : 'Geblokkeerd', err?.message ?? 'Er kunnen geen nieuwe berichten meer worden verzonden in dit gesprek.');
      } },
    ]);
  }
  function report(p: Profile) {
    Alert.alert('Gebruiker rapporteren', `Meld het profiel van ${p.display_name} bij de beheerder.`, [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Spam', onPress: () => void submitReport(p, 'spam') },
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
      <View style={{ padding: 15, backgroundColor: colors.pale, borderRadius: 16, gap: 5 }}><Text style={{ color: colors.sea, fontWeight: '700' }}>🌍 Iedereen schrijft in de eigen taal</Text><Text style={{ color: colors.muted }}>Tik op een vertaald bericht om het origineel te zien. Vertalingen kunnen fouten bevatten.</Text></View>
      {others.map(p => <Pressable key={p.id} onPress={() => Alert.alert(p.display_name, `@${p.username} · ${p.country || 'Wereldwijd'}\n${p.bio || ''}`, [{ text: 'Sluiten' }, { text: 'Rapporteren', onPress: () => report(p) }, { text: 'Blokkeren', onPress: () => block(p), style: 'destructive' }])} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Avatar name={p.display_name} size={26} /><Text style={{ color: colors.muted }}>{p.display_name} · @{p.username}</Text></Pressable>)}
      {error ? <Text style={{ color: '#A32235' }}>{error}</Text> : null}
      {!error && !messages.length ? <Text style={{ color: colors.muted, textAlign: 'center', padding: 28 }}>Zeg hallo! Je bericht wordt automatisch vertaald.</Text> : null}
      {messages.map(m => {
        const mine = m.sender_id === session?.user.id;
        const translated = !mine && m.original_language !== profile?.language ? translations[m.id] : undefined;
        const text = translated && !showOriginal[m.id] ? translated : m.original_text;
        return <Pressable key={m.id} onPress={() => setShowOriginal(prev => ({ ...prev, [m.id]: !prev[m.id] }))} style={{ maxWidth: '85%', alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: mine ? colors.sea : 'white', borderRadius: 18, padding: 13, gap: 5 }}>
          {!mine ? <Text style={{ fontWeight: '700', color: colors.sea }}>{names[m.sender_id]?.display_name ?? 'Gebruiker'}</Text> : null}
          <Text selectable style={{ color: mine ? 'white' : colors.ink, fontSize: 16, lineHeight: 23 }}>{text}</Text>
          <Text style={{ color: mine ? '#CDEAE7' : colors.muted, fontSize: 11 }}>{translated ? showOriginal[m.id] ? 'Origineel · tik voor vertaling' : 'Automatisch vertaald · tik voor origineel' : 'Origineel'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </Pressable>;
      })}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-end', padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderColor: colors.border }}>
      <TextInput accessibilityLabel="Bericht" value={body} onChangeText={setBody} multiline maxLength={2000} placeholder="Typ je bericht…" placeholderTextColor={colors.muted} style={{ flex: 1, maxHeight: 120, minHeight: 43, color: colors.ink, padding: 11, borderRadius: 15, backgroundColor: colors.background, fontSize: 16 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Versturen" disabled={!body.trim() || sending || Boolean(error)} onPress={send} style={{ borderRadius: 15, padding: 12, backgroundColor: colors.sea, opacity: !body.trim() || sending ? .5 : 1 }}><Text style={{ color: 'white', fontWeight: '700' }}>{sending ? '…' : 'Verstuur'}</Text></Pressable>
    </View>
  </KeyboardAvoidingView>;
}
