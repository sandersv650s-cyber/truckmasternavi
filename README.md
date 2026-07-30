# TruckMate Connect

TruckMate Connect is een mobiele webapp voor vrachtwagenchauffeurs met trucknavigatie, voertuigprofielen, ritregistratie en communityfuncties.

De applicatie draait zelfstandig op basis van open webtechnologie en is niet afhankelijk van Lovable voor ontwikkeling, builds of hosting.

## Benodigdheden

- Node.js 20 of nieuwer
- npm
- Een Supabase-project
- Een HERE API-sleutel voor Maps en Routing

## Lokaal starten

```sh
git clone https://github.com/sandersv650s-cyber/truckmasternavi.git
cd truckmasternavi
npm install
cp .env.example .env.local
npm run dev
```

Vul daarna in `.env.local` minimaal deze waarden in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
VITE_HERE_API_KEY=your-here-api-key
```

Plaats nooit een Supabase service-role key of andere geheime beheerderssleutel in een `VITE_*` variabele. `VITE_*` waarden worden naar de browser gestuurd.

## Controle en productiebuild

```sh
npm run typecheck
npm run lint
npm run build
```

Of voer alles achter elkaar uit:

```sh
npm run check
```

De productie-uitvoer wordt door TanStack Start en Nitro opgebouwd in `.output`. De app kan daardoor worden uitgerold naar onder meer een Node-host, Vercel, Netlify of Cloudflare, afhankelijk van de gekozen Nitro-configuratie van het hostingplatform.

## Omgevingsvariabelen

| Variabele | Gebruik |
| --- | --- |
| `VITE_SUPABASE_URL` | Publieke URL van het Supabase-project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-veilige publishable/anon key |
| `VITE_SUPABASE_ANON_KEY` | Ondersteunde alternatieve naam |
| `VITE_HERE_API_KEY` | Browser-key voor HERE Maps en Routing |
| `SUPABASE_URL` | Optionele server-side alias |
| `SUPABASE_PUBLISHABLE_KEY` | Optionele server-side alias |
| `HERE_API_KEY` | Optionele server-side alias voor HERE |

## Technologie

- TanStack Start
- React 19
- TypeScript
- Vite
- Nitro
- Tailwind CSS
- Supabase
- HERE Technologies
