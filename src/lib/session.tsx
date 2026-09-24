import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
type State = { session: Session | null; profile: Profile | null; loading: boolean; refresh: () => Promise<void> };
const Context = createContext<State>({ session: null, profile: null, loading: true, refresh: async () => {} });
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(configured);
  async function refresh() {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getSession();
    setSession(auth.session);
    if (auth.session) { const { data } = await supabase.from('profiles').select('*').eq('id', auth.session.user.id).single(); setProfile(data as Profile | null); }
    else setProfile(null);
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setTimeout(() => { void refresh(); }, 0); });
    return () => data.subscription.unsubscribe();
  }, []);
  return <Context.Provider value={{ session, profile, loading, refresh }}>{children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
