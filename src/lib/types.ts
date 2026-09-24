export type Profile = { id: string; username: string; display_name: string; language: string; country: string | null; bio: string | null };
export type Message = { id: string; conversation_id: string; sender_id: string; original_text: string; original_language: string; created_at: string };
export const LANGUAGES: Record<string, string> = { nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português', it: 'Italiano', ja: '日本語', ko: '한국어', zh: '中文', tr: 'Türkçe', pl: 'Polski', uk: 'Українська', id: 'Bahasa Indonesia', ar: 'العربية' };
