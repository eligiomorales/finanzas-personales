#!/usr/bin/env bash
# Deploy Finanzas Pareja a Vercel (producción).
# Usa las variables VITE_* ya guardadas en Vercel. No lee ni modifica .env.local.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCOPE="${VERCEL_SCOPE:-eligiomorales-1082s-projects}"
VERCEL_ARGS=(--scope "$SCOPE")
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL_ARGS+=(--token "$VERCEL_TOKEN")
fi

echo "→ Deploy a producción (variables desde Vercel, no desde .env.local)…"
npx vercel deploy --prod --yes "${VERCEL_ARGS[@]}"

echo ""
echo "Listo: https://finanzas-personales-ebon.vercel.app"
