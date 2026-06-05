#!/usr/bin/env bash
# Sincroniza VITE_SUPABASE_* de .env.local → Vercel (production).
# Solo cuando cambiás credenciales de Supabase. Uso habitual: npm run deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Falta .env.local. Copiá .env.example y completá las credenciales de Supabase."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env.local
set +a

for var in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "Falta $var en .env.local"
    exit 1
  fi
done

SCOPE="${VERCEL_SCOPE:-eligiomorales-1082s-projects}"
VERCEL_ARGS=(--scope "$SCOPE")
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL_ARGS+=(--token "$VERCEL_TOKEN")
fi

echo "→ Subiendo variables a Vercel (production)…"
printf '%s' "$VITE_SUPABASE_URL" | npx vercel env add VITE_SUPABASE_URL production --force "${VERCEL_ARGS[@]}"
printf '%s' "$VITE_SUPABASE_ANON_KEY" | npx vercel env add VITE_SUPABASE_ANON_KEY production --force "${VERCEL_ARGS[@]}"

echo "Listo. Corré npm run deploy para reconstruir con las nuevas variables."
