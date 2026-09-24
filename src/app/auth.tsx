import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Field } from '@/components/ui';
import { requireClient } from '@/lib/supabase';
export default function Auth() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [register, setRegister] = useState(false); const [busy, setBusy] = useState(false);
  async function submit() {
    if (!email.trim() || password.length < 8) return Alert.alert('Controleer je gegevens', 'Gebruik een e-mailadres en een wachtwoord van minstens 8 tekens.');
    setBusy(true);
    try {
      const client = requireClient();
      const { data, error } = register ? await client.auth.signUp({ email: email.trim(), password }) : await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (register && !data.session) Alert.alert('Controleer je e-mail', 'Bevestig je account via de link in je e-mail en meld je daarna aan.');
      else router.replace('/');
    } catch (e) { Alert.alert('Aanmelden mislukt', e instanceof Error ? e.message : 'Probeer het opnieuw.'); }
    finally { setBusy(false); }
  }
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
    <Text style={{ fontSize: 44 }}>🌍</Text><Text style={{ fontSize: 27, fontWeight: '800', color: colors.ink }}>Praat met iedereen, in je eigen taal.</Text>
    <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 24 }}>Berichten worden automatisch vertaald voor de mensen met wie je praat.</Text>
    <Field value={email} onChangeText={setEmail} placeholder="E-mailadres" autoCapitalize="none" />
    <Field value={password} onChangeText={setPassword} placeholder="Wachtwoord" secureTextEntry />
    <Button title={busy ? 'Even wachten…' : register ? 'Account maken' : 'Aanmelden'} onPress={submit} disabled={busy} />
    <Button title={register ? 'Ik heb al een account' : 'Nieuw account maken'} onPress={() => setRegister(!register)} secondary />
    <View style={{ padding: 14, backgroundColor: colors.pale, borderRadius: 14 }}><Text style={{ color: colors.ink }}>Je berichten worden voor vertaling verwerkt door een externe vertaaldienst. Deel geen gevoelige informatie in gesprekken.</Text></View>
  </ScrollView>;
}
