# Worldchat: versleutelde berichten met vertaling op het toestel

Een mobiele MVP voor iPhone en Android: accounts, profielen, zoeken op gebruikersnaam, privé- en groepsgesprekken. Berichten worden **op het toestel versleuteld**, krijgen voor iedere deelnemer een eigen versleutelde kopie en worden pas op het toestel van de ontvanger ontsleuteld. ML Kit vertaalt ze vervolgens lokaal. De server bewaart geen leesbare berichttekst en DeepL wordt niet gebruikt.

## Installatie op Windows

Je hebt Node.js, npm, een Supabase-project en voor een iPhone-ontwikkelbuild een Expo-account en Apple Developer-account nodig. Een eigen ontwikkelbuild is nodig voor de ingebouwde vertaalmodule. Expo Go kan de app wel openen, maar kan niet op het toestel vertalen.

1. Maak een **leeg** project op [Supabase](https://supabase.com/). Voer `supabase/schema.sql` uit in **SQL Editor**. Had je al het vorige plaintext schema geïnstalleerd? Gebruik **in plaats daarvan** `supabase/migrations/20260924_e2ee.sql`. Die migratie wist de oude leesbare berichten en vertalingen uit de actieve database; bewaar eerst gegevens die je nodig hebt. Oude backups/logs kunnen nog plaintext bevatten.
2. Kopieer uit **Project Settings → API** de project-URL en de publishable/anon sleutel. Kopieer `.env.example` naar `.env` en vul de twee waarden in. Plaats nooit een service role sleutel in de app of op GitHub.
3. Installeer de app en publiceer de serverfunctie:

   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref JOUW_PROJECT_REF
   npx supabase functions deploy send-message
   ```

4. Maak op Windows een iPhone-ontwikkelbuild via Expo's cloudbouw. Volg de stappen voor een Apple-account en registratie van je eigen iPhone die EAS toont:

   ```bash
   npx eas-cli login
   npx eas-cli build:configure
   npx eas-cli device:create
   npx eas-cli build --profile development --platform ios
   npx expo start --dev-client
   ```

   Installeer de voltooide build via de EAS-link op je iPhone en open daarna de ontwikkelserver. Voor Android vervang je `ios` door `android`. Bij native codewijzigingen is opnieuw bouwen nodig.

5. Maak twee accounts met verschillende ingestelde talen. Zoek elkaar op gebruikersnaam en stuur een bericht. Taalmodellen worden op het toestel via wifi gedownload; zonder model toont de chat het originele, ontsleutelde bericht en een melding.

## Wat de versleuteling wel en niet beschermt

- Alleen de telefoons van deelnemers bezitten privésleutels. Supabase en de serverfunctie zien versleutelde tekst, afzender, ontvangers, tijdstip en groepsnaam. Profielen en deelnemerslijsten zijn niet versleuteld.
- De privésleutel staat in de beveiligde opslag van het toestel. De publieke sleutel wordt bij eerste gebruik vastgelegd in de database en mag daarna niet worden gewijzigd. De app onthoudt de eerste sleutel die hij van een gesprekspartner ziet en stopt bij een onverwachte wijziging. Vergelijk de beveiligingscode **buiten de app om** met die persoon: eerste sleutelcontact is anders gevoelig voor sleutelvervanging door een kwaadwillende server.
- Dit prototype gebruikt TweetNaCl `box` met vaste sleutels per account. Het heeft **geen forward secrecy, sleutelherstel, multi-device synchronisatie of onafhankelijke beveiligingsaudit**. Wie zijn privésleutel verliest, kan oude berichten niet op een nieuw toestel herstellen. Een gestolen privésleutel kan oude onderschepte berichten ontsleutelen. Voor een publieke messenger is een doorgelicht protocol zoals Signal met veilige sleutelrotatie en herstel nodig.
- De app kan een melding over een profiel doorgeven, maar de beheerder kan de inhoud van het versleutelde gesprek niet inzien. Werk een moderatie- en misbruikproces uit voor een publieke lancering.
- Deel geen gevoelige gegevens voordat het native iOS- en Android-gedrag en de databasebeveiliging op echte toestellen zijn getest. Dit project is een bouwbare basis, geen gecertificeerde beveiligde messenger.

## Controle

`npm run check` controleert TypeScript en test lokaal dat alleen de juiste privésleutel de tekst kan ontsleutelen en dat wijzigingen in het versleutelde bericht worden afgewezen. Een bundelcontrole vervangt geen test van de native vertaling, Supabase-migratie of gesprekken tussen echte telefoons.
