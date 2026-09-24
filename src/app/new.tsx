import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button, colors, Field } from '@/components/ui';
import { requireClient } from '@/lib/supabase';
import { useSession } from '@/lib/session';
import type { Profile } from '@/lib/types';
import { ensureIdentity } from '@/lib/crypto';
export default function NewConversation() {
  const { session } = useSession(); const [query, setQuery] = useState(''); const [results, setResults] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile[]>([]); const [title, setTitle] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!session || query.trim().length < 2) { setResults([]); return; }
    let live = true;
    const timer = setTimeout(async () => {
      const safe = query.trim().replace(/[%_,()]/g, '');
      const { data, error } = await requireClient().from('profiles').select('*').ilike('username', `%${safe}%`).neq('id', session.user.id).limit(20);
      if (live) { if (error) Alert.alert('Zoeken mislukt', error.message); else setResults((data ?? []) as Profile[]); }
    }, 300);
    return () => { live = false; clearTimeout(timer); };
  }, [query, session?.user.id]);
  function toggle(p: Profile) { setSelected(xs => xs.some(x => x.id === p.id) ? xs.filter(x => x.id !== p.id) : [...xs, p]); }
  async function create() {
    if (!session || !selected.length) return;
    setBusy(true);
    try {
      await ensureIdentity(session.user.id);
      const { data, error } = await requireClient().rpc('start_conversation', { other_ids: selected.map(p => p.id), group_title: selected.length > 1 ? title.trim() || null : null });
      if (error) throw error;
      router.replace({ pathname: '/chat/[id]', params: { id: data as string } });
    } catch (e) { Alert.alert('Gesprek starten mislukt', e instanceof Error ? e.message : 'Probeer het opnieuw.'); }
    finally { setBusy(false); }
  }
  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16 }}>
    <Text style={{ color: colors.ink, fontSize: 24, fontWeight: '800' }}>Wie wil je spreken?</Text>
    <Text style={{ color: colors.muted }}>Zoek op gebruikersnaam. Kies meerdere mensen voor een groep.</Text>
    <Field value={query} onChangeText={setQuery} placeholder="Zoek gebruikersnaam" autoCapitalize="none" />
    {results.map(p => <Pressable key={p.id} onPress={() => toggle(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'white', borderRadius: 15 }}><Avatar name={p.display_name} /><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '700' }}>{p.display_name}</Text><Text style={{ color: colors.muted }}>@{p.username} · {p.country || 'Wereldwijd'}</Text></View><Text style={{ color: colors.sea, fontSize: 22 }}>{selected.some(x => x.id === p.id) ? '☑' : '□'}</Text></Pressable>)}
    {selected.length ? <View style={{ gap: 12 }}><Text style={{ color: colors.sea, fontWeight: '700' }}>Gekozen: {selected.map(p => p.display_name).join(', ')}</Text>{selected.length > 1 ? <Field value={title} onChangeText={setTitle} placeholder="Groepsnaam (optioneel)" /> : null}<Button title={busy ? 'Gesprek maken…' : selected.length > 1 ? 'Groep starten' : 'Gesprek starten'} disabled={busy} onPress={create} /></View> : null}
  </ScrollView>;
}
