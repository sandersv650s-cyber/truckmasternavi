export type Profile = { id: string; username: string; display_name: string; language: string; country: string | null; bio: string | null };
export type Message = { id: string; conversation_id: string; sender_id: string; sender_public_key: string; created_at: string };
export type Envelope = { message_id: string; recipient_id: string; nonce: string; ciphertext: string };
export const LANGUAGES: Record<string, string> = { nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português', it: 'Italiano', ja: '日本語', ko: '한국어', zh: '中文', tr: 'Türkçe', pl: 'Polski', uk: 'Українська', id: 'Bahasa Indonesia', ar: 'العربية' };
