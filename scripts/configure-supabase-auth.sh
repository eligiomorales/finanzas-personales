#!/usr/bin/env bash
# Configura Site URL y redirect URLs en Supabase Auth para el dominio de producción.
#
# Opción A (dashboard): Authentication → URL Configuration
# Opción B (API): export SUPABASE_ACCESS_TOKEN desde https://supabase.com/dashboard/account/tokens
#
# Uso: ./scripts/configure-supabase-auth.sh https://finanzas-pareja.vercel.app

set -euo pipefail

PRODUCTION_URL="${1:-}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-nzerinfnrtycejptlypj}"

if [[ -z "$PRODUCTION_URL" ]]; then
  echo "Uso: $0 https://tu-app.vercel.app"
  exit 1
fi

PRODUCTION_URL="${PRODUCTION_URL%/}"

echo "Configuración recomendada en Supabase (proyecto: $PROJECT_REF):"
echo ""
echo "  Site URL:              $PRODUCTION_URL"
echo "  Redirect URLs:"
echo "    - $PRODUCTION_URL/**"
echo "    - http://localhost:5173/**"
echo ""
echo "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/auth/url-configuration"
echo ""

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Sin SUPABASE_ACCESS_TOKEN: aplicá los valores arriba en el dashboard."
  exit 0
fi

BODY=$(cat <<EOF
{
  "site_url": "$PRODUCTION_URL",
  "uri_allow_list": "$PRODUCTION_URL/**,http://localhost:5173/**"
}
EOF
)

echo "→ Actualizando auth config vía Management API…"
curl -sS -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" | head -c 500
echo ""
echo "Listo."
