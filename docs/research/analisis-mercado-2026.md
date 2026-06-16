# Análisis de mercado y viabilidad — Finanzas Pareja

**Fecha:** Junio 2026 · **Tipo:** research (punto en el tiempo)

Análisis honesto de mercado, factibilidad de escala y competitividad. Complementa el benchmark funcional (`benchmarking-monarch.md`).

---

## Qué es el producto (sin adornos)

Web app para **dos personas** con foco en: reparto pagado/asumido (50/50, 70/30…), liquidaciones, importación manual de extractos AR (Galicia/Santander + OCR Wallbit) y presupuesto colaborativo por categoría. **No** es PFM generalista: no conecta bancos, no tiene apps nativas, no tiene modelo de negocio definido.

## El mercado (tres categorías)

| Categoría | Ejemplos | Posición de Finanzas Pareja |
|-----------|----------|-----------------------------|
| Split / saldar cuentas | Splitwise, Tricount, Splid | Compite parcial; va más allá (asumido ≠ pagado) |
| Presupuesto compartido | Peggy, Honeydue, GoodShare, Buddy | Compite desde V1 de presupuestos |
| PFM completo | Monarch, YNAB, Rocket Money | **No compite** (ni debería) |

Nicho real: **parejas con cuentas separadas que quieren transparencia sin fusionar bancos**. Existe, pero es más chico que el PFM general.

## Ventajas reales

1. **Modelo pagado/asumido + liquidaciones** — más fiel que el split simple de Splitwise.
2. **Importación local AR** — parsers Galicia/Santander/OCR; moat geográfico y técnico (estrecho).
3. **Privacidad por diseño** — sin credenciales bancarias.
4. **Presupuesto + lógica de pareja** — combinación poco común.

## Brechas vs competencia

Pierde en: apps nativas, registro rápido, onboarding sin fricción, recurrentes, metas, notificaciones, marca/distribución, sync bancario. Frente a Tricount (gratis, masivo) y Peggy/Honeydue (más maduros en retención), está por detrás en adopción y completitud.

## Veredicto de escala

| Escenario | Usuarios (12–24m) | Probabilidad |
|-----------|-------------------|--------------|
| Hobby / uso propio + referidos | 10–500 parejas | Alta |
| Producto de nicho LATAM | 1.000–10.000 parejas | Media-baja |
| Competidor serio regional | 50k+ parejas | Baja hoy |
| "Monarch para Argentina" | — | Muy baja |

Escalable **solo** redefiniendo "público": parejas AR/LATAM con finanzas separadas que importan resúmenes. Techo de miles, no millones, sin inversión fuerte.

---

## Viabilidad como negocio (solo founder + AI)

**Veredicto:** como apuesta de rentabilidad pura, **mal mercado**. Como proyecto de aprendizaje + uso propio + opcionalidad, **vale la pena — no por la plata**.

### Por qué el mercado es difícil (estructural)

- Disposición a pagar bajísima (nadie paga por "anotar gastos").
- Competencia gratis y buena (Tricount total, Splitwise freemium).
- Churn alto (apps de presupuesto se abandonan; las de pareja dependen de 2 personas).
- Doble adopción: necesitás que **ambos** la usen.
- El 70% del dolor lo cubre Excel o Splitwise gratis.

### Restricciones específicas

- **Nicho AR = TAM chico en dólares.** Optimista: 1.000 parejas × USD 4/mes = USD 4k/mes (excelente para side project, insuficiente como negocio full-time).
- **AI abarata el código, no el cuello de botella real:** distribución, confianza, soporte, mantenimiento de parsers, decisiones de producto.
- **Es un mercado de retención**, y la retención no se programa: se gana con hábito + iteración con usuarios reales.

### Cuándo SÍ vale la pena

| Objetivo | ¿Vale? |
|----------|--------|
| Resolver tu propio problema | Sí, claramente |
| Aprender / portfolio técnico | Sí |
| Ingreso chico | Tal vez (lento, improbable) |
| Negocio serio full-time | No |
| Startup escalable / VC | No |

## Recomendación

1. Seguir construyéndola para uso propio y conocidos (ROI positivo hoy).
2. No casarse con la tesis comercial; checkpoint barato: si 2–3 parejas la usan 3 meses sin empuje, hay señal.
3. Usar el proyecto como **laboratorio solo founder + AI** (ver `PLAYBOOK.md`).
4. Si en algún momento se busca negocio, pivotear el **mercado** antes que el producto (roommates, grupos de viaje recurrentes, B2B chico de gastos compartidos).

**La señal que cambiaría el veredicto:** retención orgánica de conocidos.
