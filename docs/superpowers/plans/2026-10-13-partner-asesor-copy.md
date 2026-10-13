# Partner + asesor copy Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Actualizar copy de Home y Nosotros según `docs/superpowers/specs/2026-10-13-partner-asesor-copy-design.md`.

**Architecture:** Solo textos en `src/content.mjs`; rebuild SSG genera `public/`.

**Tech Stack:** Node ESM SSG (`content.mjs` + `build.mjs`).

## Global Constraints

- No tocar páginas de servicios.
- Mantener diseño · fabricación · instalación junto a partner/asesor.
- Textos literales de la spec.

---

### Task 1: Actualizar `home` y `nosotros` en content.mjs

**Files:**
- Modify: `src/content.mjs` (bloques `home` y `nosotros`)

- [ ] Aplicar campos hero, why*, benefits, contactLead (home)
- [ ] Aplicar title, description, h1, lead, trust, pills, why*, benefits (nosotros)
- [ ] `npm run build && npm run check`
- [ ] Commit
- [ ] `npm run deploy` si el usuario lo pide
