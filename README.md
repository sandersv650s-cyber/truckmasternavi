# Worldchat

Een eerste mobiele berichtenapp voor iPhone en Android: accounts, profielen, zoeken op gebruikersnaam, privé- en groepsgesprekken en vertaling naar de taal van de ontvanger. De originele tekst blijft opvraagbaar. Dit is een MVP, nog geen publieke productieversie.

## Wat je nodig hebt

- Windows, Node.js en npm
- Expo Go op je iPhone (of Android)
- Een Supabase-project
- Een DeepL API-sleutel voor automatische vertaling

## Stap voor stap

1. Maak een nieuw project op [Supabase](https://supabase.com/). Open **SQL Editor**, plak `supabase/schema.sql` en voer het uit op een leeg project.
2. Open **Project Settings → API**. Kopieer de project-URL en de **publishable/anon** sleutel. Gebruik hier nooit de service role sleutel.
3. Kopieer `.env.example` naar `.env` en vervang de twee voorbeeldwaarden. `.env` hoort niet op GitHub.
4. Installeer [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), log in en koppel je project:

   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref JOUW_PROJECT_REF
   npx supabase secrets set DEEPL_AUTH_KEY=JOUW_DEEPL_SLEUTEL
   npx supabase functions deploy send-message
   ```

   De Supabase-omgeving levert `SUPABASE_URL`, `SUPABASE_ANON_KEY` en `SUPABASE_SERVICE_ROLE_KEY` aan de serverfunctie. Gebruik je een betaalde DeepL API-sleutel, zet ook `DEEPL_API_URL=https://api.deepl.com/v2/translate` via `supabase secrets set`. De gratis sleutel gebruikt standaard `api-free.deepl.com`.

5. In Supabase **Authentication → Providers → Email** kun je e-mailbevestiging aan laten staan. Een nieuw account moet dan eerst op de link in de e-mail klikken.
6. Start de app:

   ```bash
   npx expo start
   ```

7. Scan de QR-code met Expo Go op je iPhone. De pc en telefoon moeten elkaar kunnen bereiken; gebruik zo nodig `npx expo start --tunnel`. Maak twee accounts, stel in **Mijn profiel** voor ieder een andere leestaal in, zoek de andere gebruiker op gebruikersnaam en begin een gesprek.

## Veiligheid en grenzen

- De DeepL-sleutel en service role sleutel staan alleen op de server; nooit in `.env` van de app.
- Databasebeveiliging beperkt het lezen van gesprekken tot deelnemers. Alleen de serverfunctie kan berichten toevoegen. Gebruikers kunnen anderen blokkeren en rapporteren.
- Berichten worden als leesbare tekst opgeslagen en naar DeepL verzonden om te vertalen. Dit is geen end-to-end versleutelde messenger. Zet een privacybeleid, moderatieproces, verwijdermogelijkheid en limieten op gebruik en API-kosten op voordat je de app openbaar maakt.
- De profieltaal is tevens de veronderstelde schrijftaal. Typ je een bericht in een andere taal, dan kan de vertaling onjuist zijn. Een taalwijziging vertaalt oude berichten nog niet opnieuw.
- Er zijn in deze eerste versie geen foto's, spraakgesprekken, pushberichten of videogesprekken.
