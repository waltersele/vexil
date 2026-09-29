# Revisión de Vexil

## Cambios incluidos

- VEXIL como título principal; actividad y ubicación en el subtítulo.
- Textos más claros para los diez servicios, con títulos y descripciones SEO específicos, contexto local y llamadas a contacto.
- Fotografías reales de referencia, con procedencia en FOTOGRAFIAS.md. No se presentan como trabajos propios.
- Catálogo visual en portada, estructura de páginas simplificada y ajustes para móvil, teclado y lectores de pantalla.
- Formulario que prepara un mensaje de WhatsApp y explica que el visitante debe enviarlo. El formulario externo, si se configura, solo muestra éxito cuando el proveedor lo confirma.
- Analítica condicionada al consentimiento, revisión de enlaces internos y exclusión de la página de agradecimiento del sitemap.

## Comprobación

Ejecutar `npm ci`, `npm run build` y `npm run check`. La comprobación cubre 21 páginas: enlaces, anclas, imágenes, datos estructurados, sintaxis de scripts y preparación del mensaje de WhatsApp. No sustituye la revisión visual en navegador; no se ha completado una prueba visual de esta versión en móvil.

## Próximas mejoras recomendadas

1. Sustituir progresivamente las fotos de referencia por trabajos reales de Vexil, con permiso del cliente, localidad, necesidad inicial y solución instalada.
2. Confirmar el dominio definitivo antes de cambiar URLs canónicas y sitemap. La configuración conserva GitHub Pages.
3. Completar la revisión de los datos comerciales y legales antes de publicar; no se han inventado años de experiencia, clientes, garantías ni certificados.
4. Revisar la ficha de Google del negocio y conectar Search Console cuando se confirme el dominio; evaluar consultas y solicitudes recibidas sin prometer posiciones.

## Publicación

Los archivos de `public/` se generan desde `src/`. Editar primero las fuentes y volver a compilar. El flujo existente publica GitHub Pages cuando los cambios llegan a `main`; la rama de revisión permite comprobarlos antes de esa publicación.
