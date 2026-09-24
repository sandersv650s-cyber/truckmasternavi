import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { Avatar, Button, colors } from '@/components/ui';
import { configured, requireClient } from '@/lib/supabase';
import { useSession } from '@/lib/session';
import type { Profile } from '@/lib/types';
import { ensureIdentity } from '@/lib/crypto';

type Row = { id: string; name: string; others: Profile[]; last?: string; at?: string };
export default function Home() {
  const { session, profile, loading } = useSession();
  const [rows, setRows] = useState<Row[]>([]); const [busy, setBusy] = useState(false);
  const [keyError, setKeyError] = useState('');
  useEffect(() => { if (session) void ensureIdentity(session.user.id).then(() => setKeyError('')).catch(e => setKeyError(e instanceof Error ? e.message : 'Sleutel instellen mislukt')); }, [session?.user.id]);
  const load = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      const client = requireClient();
      const { data: mine, error } = await client.from('conversation_members').select('conversation_id').eq('user_id', session.user.id);
      if (error) throw error;
      const ids = (mine ?? []).map(x => x.conversation_id);
      if (!ids.length) { setRows([]); return; }
      const [cs, ms, msgs] = await Promise.all([
        client.from('conversations').select('id,title,created_at').in('id', ids),
        client.from('conversation_members').select('conversation_id,user_id').in('conversation_id', ids),
        client.from('encrypted_messages').select('id,conversation_id,created_at').in('conversation_id', ids).order('created_at', { ascending: false }).limit(200),
      ]);
      if (cs.error || ms.error || msgs.error) throw cs.error ?? ms.error ?? msgs.error;
      const peopleIds = [...new Set((ms.data ?? []).map(m => m.user_id))];
      const profiles = peopleIds.length ? await client.from('profiles').select('*').in('id', peopleIds) : { data: [], error: null };
      if (profiles.error) throw profiles.error;
      const byId = new Map((profiles.data ?? []).map(p => [p.id, p as Profile]));
      setRows((cs.data ?? []).map(c => {
        const others = (ms.data ?? []).filter(m => m.conversation_id === c.id && m.user_id !== session.user.id).map(m => byId.get(m.user_id)).filter((p): p is Profile => Boolean(p));
        const last = (msgs.data ?? []).find(m => m.conversation_id === c.id);
        return { id: c.id, name: c.title || others.map(p => p.display_name).join(', ') || 'Gesprek', others, last: last ? '🔒 Versleuteld bericht' : undefined, at: last?.created_at ?? c.created_at };
      }).sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')));
    } catch (e) { Alert.alert('Gesprekken laden mislukt', e instanceof Error ? e.message : 'Probeer het opnieuw.'); }
    finally { setBusy(false); }
  }, [session?.user.id, profile?.language]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    if (!session) return;
    const client = requireClient();
    const channel = client.channel(`home:${session.user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_envelopes', filter: `recipient_id=eq.${session.user.id}` }, () => void load()).subscribe();
    return () => { void client.removeChannel(channel); };
  }, [session?.user.id, load]);
  if (!configured) return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 24, gap: 14 }}><Text style={{ fontSize: 38 }}>🌍</Text><Text style={{ fontSize: 27, fontWeight: '800', color: colors.ink }}>Worldchat is klaar voor configuratie</Text><Text style={{ fontSize: 16, color: colors.muted, lineHeight: 24 }}>Maak een Supabase-project, voer het SQL-bestand uit en vul .env in. De instructies staan in README.md. Daarna kun je met twee accounts een echt gesprek voeren.</Text></ScrollView>;
  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.sea} />;
  if (!session) return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 24, gap: 18 }}><Text style={{ fontSize: 48 }}>🌐</Text><Text style={{ fontSize: 30, fontWeight: '800', color: colors.ink }}>De wereld spreekt jouw taal.</Text><Text style={{ fontSize: 17, color: colors.muted, lineHeight: 25 }}>Begin een gesprek met iemand aan de andere kant van de wereld. Jij schrijft in jouw taal, de ander leest in de eigen taal.</Text><Button title="Aanmelden of account maken" onPress={() => router.push('/auth')} /></ScrollView>;
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, gap: 16 }}>
    <View style={{ backgroundColor: colors.pale, padding: 20, borderRadius: 22, gap: 8 }}><Text style={{ color: colors.sea, fontWeight: '800' }}>🌍  WORLDCHAT</Text><Text style={{ color: colors.ink, fontSize: 23, fontWeight: '800' }}>Hoi {profile?.display_name ?? 'daar'}!</Text><Text style={{ color: colors.muted }}>Met wie wil je praten?</Text></View>
    {keyError ? <Text style={{ color: '#A32235' }}>🔒 {keyError}</Text> : null}
    <Button title="＋  Nieuw gesprek of groep" disabled={Boolean(keyError)} onPress={() => router.push('/new')} />
    <Link href="/profile" asChild><Pressable style={{ alignSelf: 'flex-end', padding: 8 }}><Text style={{ color: colors.sea, fontWeight: '700' }}>Mijn profiel beheren →</Text></Pressable></Link>
    <Text style={{ color: colors.ink, fontSize: 21, fontWeight: '800' }}>Gesprekken</Text>
    {busy && !rows.length ? <ActivityIndicator color={colors.sea} /> : null}
    {!busy && !rows.length ? <Text style={{ color: colors.muted, lineHeight: 23 }}>Nog geen gesprekken. Zoek op gebruikersnaam en stuur je eerste bericht.</Text> : null}
    {rows.map(row => <Link key={row.id} href={{ pathname: '/chat/[id]', params: { id: row.id } }} asChild><Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'white', borderRadius: 18 }}><Avatar name={row.name} /><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{row.name}</Text><Text numberOfLines={1} style={{ color: colors.muted }}>{row.last ?? 'Begin een gesprek'}</Text></View><Text style={{ color: colors.sea, fontSize: 20 }}>›</Text></Pressable></Link>)}
  </ScrollView>;
}
