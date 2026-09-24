import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Field } from '@/components/ui';
import { LANGUAGES } from '@/lib/types';
import { requireClient } from '@/lib/supabase';
import { useSession } from '@/lib/session';
export default function ProfileScreen() {
  const { session, profile, refresh } = useSession();
  const [username, setUsername] = useState(''); const [name, setName] = useState(''); const [country, setCountry] = useState(''); const [bio, setBio] = useState(''); const [language, setLanguage] = useState('nl'); const [busy, setBusy] = useState(false);
  useEffect(() => { if (profile) { setUsername(profile.username); setName(profile.display_name); setCountry(profile.country ?? ''); setBio(profile.bio ?? ''); setLanguage(profile.language); } }, [profile]);
  async function save() {
    if (!session) return;
    if (!/^[a-z0-9_]{3,24}$/.test(username.toLowerCase()) || !name.trim() || !LANGUAGES[language]) return Alert.alert('Controleer je profiel', 'Gebruikersnaam: 3–24 letters, cijfers of _. Kies ook een naam en taal.');
    setBusy(true);
    try {
      const { error } = await requireClient().from('profiles').update({ username: username.toLowerCase(), display_name: name.trim(), country: country.trim() || null, bio: bio.trim() || null, language }).eq('id', session.user.id);
      if (error) throw error;
      await refresh(); Alert.alert('Opgeslagen', 'Je profiel is bijgewerkt.');
    } catch (e) { Alert.alert('Opslaan mislukt', e instanceof Error ? e.message : 'Probeer het opnieuw.'); }
    finally { setBusy(false); }
  }
  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
    <Text style={{ color: colors.muted }}>Anderen vinden je via je gebruikersnaam. Je taal bepaalt hoe jij berichten van anderen leest.</Text>
    <Field value={username} onChangeText={setUsername} placeholder="Gebruikersnaam" autoCapitalize="none" />
    <Field value={name} onChangeText={setName} placeholder="Naam" />
    <Field value={country} onChangeText={setCountry} placeholder="Land (optioneel)" />
    <Field value={bio} onChangeText={setBio} placeholder="Over mij (optioneel)" multiline />
    <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>Mijn leestaal: {LANGUAGES[language] ?? language}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{Object.entries(LANGUAGES).map(([code, label]) => <Text key={code} onPress={() => setLanguage(code)} style={{ padding: 11, borderRadius: 12, overflow: 'hidden', color: language === code ? 'white' : colors.sea, backgroundColor: language === code ? colors.sea : colors.pale }}>{label}</Text>)}</ScrollView>
    <Button title={busy ? 'Opslaan…' : 'Profiel opslaan'} onPress={save} disabled={busy} />
    <Button title="Afmelden" secondary onPress={() => { void requireClient().auth.signOut().then(() => router.replace('/')); }} />
  </ScrollView>;
}
