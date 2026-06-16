# Feature brief: [nombre corto]

**Fecha:** YYYY-MM-DD  
**Sesión:** [1 de N — estimar al inicio]  
**Rama sugerida:** `feature/nombre-corto`

---

## 1. Problema



---

## 2. Objetivo de la sesión



---

## 3. Alcance

### Incluido (MVP)

- 

- 

### Fuera de alcance (explícito)

- 

- 

### Anti-goals



- No agregar dependencias nuevas
- No refactorizar módulos adyacentes
- No 
- 

---

## 4. Criterios de done



- 
- `npm run ci` verde
- Smoke manual: [listar solo si aplica — auth / import / UI móvil]
- `NEXT.md` actualizado (+ ADR en `docs/decisions/` si hubo decisión)

---

## 5. Contexto para el agente

### Leer primero

- `AGENTS.md`
- `PLAYBOOK.md`
- `NEXT.md`
- 

### Archivos probables

```
<!-- Rutas concretas; el agente puede ampliar en Explore -->
src/lib/
src/pages/
supabase/migrations/   <!-- solo si hay schema nuevo -->
```

### Patrones a seguir



### Riesgos / sensibilidad



- 

---

## 6. Plan (completar después de Explore)







**Tradeoffs considerados:**

---

## 7. Prompt listo para pegar

```text
Quiero implementar: [nombre corto]

Lee AGENTS.md, PLAYBOOK.md, NEXT.md y este brief.

Fase Explore + Plan primero. No implementes hasta que apruebe el plan.

Objetivo: [copiar §2]
Alcance: [copiar §3 Incluido]
Anti-goals: [copiar §3 Anti-goals]
Done: [copiar §4]

Al final: npm run ci + actualizar NEXT.md
```

---

## 8. Post-sesión (Capture)




| Campo                      | Valor   |
| -------------------------- | ------- |
| Tiempo humano activo (min) |         |
| Iteraciones hasta merge    |         |
| ¿Brief respetado?          | sí / no |
| Líneas corregidas a mano   | ~       |
| Aprendizaje (1–3 líneas)   |         |
| ¿Regla/skill nueva?        |         |


**PR / commit:**  
**Pendiente para próxima sesión:**