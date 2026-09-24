import { Pressable, Text, TextInput, View } from 'react-native';
export const colors = { ink: '#142736', muted: '#6B7C8A', sea: '#0A8E8A', pale: '#EDF8F6', background: '#F6F8F8', border: '#DFE7E8' };
export function Button({ title, onPress, secondary, disabled }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ padding: 15, borderRadius: 16, backgroundColor: secondary ? colors.pale : colors.sea, opacity: disabled ? 0.5 : 1, alignItems: 'center' }}><Text style={{ color: secondary ? colors.sea : 'white', fontSize: 16, fontWeight: '700' }}>{title}</Text></Pressable>;
}
export function Field({ value, onChangeText, placeholder, secureTextEntry, autoCapitalize, multiline }: { value: string; onChangeText: (v: string) => void; placeholder: string; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences'; multiline?: boolean }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} multiline={multiline} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: 'white', padding: 14, fontSize: 16, color: colors.ink, minHeight: multiline ? 90 : 52 }} />;
}
export function Avatar({ name, size = 48 }: { name: string; size?: number }) { return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#D4EFE9', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.sea, fontWeight: '800', fontSize: size / 2.4 }}>{name.charAt(0).toUpperCase()}</Text></View>; }
