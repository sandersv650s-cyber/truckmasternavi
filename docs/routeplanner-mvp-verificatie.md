# Routeplanner MVP-verificatie

Deze checklist is de laatste functionele controle vóór afronding van issue #4.

## Voorwaarden

- `HERE_API_KEY` is aanwezig in de productieomgeving.
- De gebruiker is ingelogd.
- Een vrachtwagenprofiel is ingevuld.
- De controle wordt zowel op mobiel als desktop uitgevoerd.

## Route-invoer

- [ ] Vertrek en bestemming kunnen via adreszoeker worden gekozen.
- [ ] Een handmatig aangepast adres wist de eerder gekozen coördinaten.
- [ ] Een lege vertrekplaats, tussenstop of bestemming blokkeert berekenen.
- [ ] Ongeldige coördinaten uit opgeslagen gegevens worden geweigerd.
- [ ] Omkeren en verwijderen van tussenstops behoudt de juiste volgorde.

## HERE en foutafhandeling

- [ ] Een geldige truckroute wordt berekend.
- [ ] Offline gebruik toont een begrijpelijke melding.
- [ ] Een ongeldige API-sleutel toont een beheerbare foutmelding.
- [ ] Tijdelijke netwerk- of serverfouten kunnen opnieuw worden geprobeerd.
- [ ] Meerdere snelle klikken starten niet meerdere routeberekeningen tegelijk.
- [ ] Geen beschikbare route geeft een duidelijke melding zonder vastloper.

## Opgeslagen routes

- [ ] Een berekende route kan worden opgeslagen.
- [ ] Een opgeslagen route kan opnieuw worden geladen en berekend.
- [ ] Hernoemen werkt en blijft zichtbaar na verversen.
- [ ] Verwijderen werkt en de route verdwijnt na verversen.
- [ ] Voertuigprofiel, vervoersmodus en vermijdingen worden correct hersteld.

## Navigatie

- [ ] Huidige locatie kan als vertrekpunt worden ingesteld.
- [ ] Navigatiemodus start vanuit de geselecteerde route.
- [ ] Afwijken van de route start maximaal één herberekening tegelijk.
- [ ] Stoppen met navigeren geeft de routeplanner weer bruikbaar terug.

## Technische acceptatie

- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] GitHub Actions is groen.

Bevindingen worden vastgelegd in issue #4. Blokkerende fouten krijgen een afzonderlijk issue met reproduceerstappen.