const required = [
  ["VITE_SUPABASE_URL", "SUPABASE_URL"],
  [
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  ],
  ["VITE_HERE_API_KEY", "HERE_API_KEY"],
];

const missing = required.filter(
  (aliases) => !aliases.some((name) => process.env[name]?.trim()),
);

if (missing.length) {
  console.error("Ontbrekende omgevingsvariabelen:");
  for (const aliases of missing) console.error(`- ${aliases.join(" of ")}`);
  console.error("\nKopieer .env.example naar .env.local en vul de waarden in.");
  process.exit(1);
}

console.log("Omgevingsvariabelen zijn compleet.");
