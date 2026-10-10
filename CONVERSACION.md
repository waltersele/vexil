# Conversación con Cursor (septiembre 2026)

Registro de lo acordado y hecho en esta sesión, para no perder el contexto.

## Qué se pidió

Aplicar el documento «Vexil · Cambio de textos del site» a la web estática (`src/content.mjs` + `src/build.mjs` → `public/`). Alcance: todo el documento.

## Decisiones de producto

- **Vehículos:** rotulación de furgonetas de empresa (logo, teléfono y web). Sin wrapping completo ni cambio de color.
- **Iluminación decorativa:** se mantiene como página propia.
- **Profesionales:** arquitectos, interioristas y constructoras; y bloque aparte de corte a medida para empresas del sector (rotulistas, carpinterías, stands, franquicias), con tarifas bajo solicitud y marca blanca. Sin precios públicos ni mencionar láser/CNC/fresa en ese bloque.
- **Presupuesto:** «sin compromiso». Nunca «gratis» ni «24 h».
- **Veracidad:** no se escriben plazos, garantías, permisos, porcentajes ni materiales no confirmados (CNC aluminio, láser madera/cartón, lonas de andamio, vallas, buzones, montaje en altura, muestras físicas, mantenimiento de franquicias).

## Datos de contacto que se añadieron

- Teléfono / WhatsApp: 616 048 109
- Email: proyectos@vexil.es
- NIF: 48564088W
- Domicilio: Avda Pla de Messell, 1, Nave D2, 03560 El Campello, Alicante
- El CP 03560 es El Campello; Alicante queda como provincia.

El NIF solo va en aviso legal y privacidad (LSSI). No hace falta para que la web o el formulario funcionen.

## Qué se implementó

- Copy nuevo en home, 10 servicios, nosotros y profesionales.
- En `/profesionales/`: sección «Corte a medida para empresas del sector» (`#corte-empresas`), opción de formulario y enlace desde `/servicios/corte/`.
- Slugs nuevos: `/servicios/laminas-solares/` e `/servicios/interiorismo-comercial/`.
- Stubs de redirección en las URLs viejas (`lamina-solar`, `interiores`).
- Páginas nuevas: materiales, franquicias, obra-nueva, aviso legal, privacidad, cookies, gracias y 404.
- Title/meta por página, canonical, Open Graph, LocalBusiness, FAQ y breadcrumbs.
- Pie NAP idéntico; WhatsApp con mensaje distinto por página.
- Tailwind compilado (sin CDN), iconos SVG, imágenes WebP, favicon 32 y apple-touch 180.
- Formulario: si `formAccessKey` está vacío, abre WhatsApp con los campos. Si hay clave Web3Forms, envía y redirige a `/gracias/`.
- GA4 y banner de cookies solo si se rellena `gaId`.

Pendiente de configurar (placeholders): `formAccessKey` y `gaId` en `src/content.mjs`.

## Página de ejemplo Impeccable

Home de propuesta visual, **aparte** de la web publicada:

- URL local: `/ejemplo/`
- `noindex`, no está en el menú ni en el sitemap
- Copy real de Vexil, fotos del taller, magenta de marca
- Cinta superior: «Ejemplo visual. No sustituye la web publicada.»

Si se aprueba esa dirección visual, habría que aplicarla a las plantillas reales.

## Fuera de código (operativo)

Tras publicar: Search Console, ficha de Google Business, reseñas, directorios y fotos de proyectos reales cuando existan.

## Cómo regenerar

```
npm run build
npm start
```

GitHub Pages sirve `public/`. Hay que commitear el HTML generado.
