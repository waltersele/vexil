# Spec: Vexil como taller + partner y asesor

**Fecha:** 2026-10-13  
**Estado:** pendiente de revisión del usuario  
**Alcance:** solo copy en Home + Nosotros (`src/content.mjs`)  
**Fuera de alcance:** fichas de servicios, layout, CSS, SEO técnico nuevo, FAQs salvo si se tocan por coherencia mínima

## Objetivo

Mantener la promesa de **diseño · fabricación · instalación** y sumar la capa de **partner y asesor**: empatía, acompañamiento y objetivo común con el cliente. No sustituir el taller; ampliar la percepción.

## Enfoque aprobado

**Doble promesa en el mismo aliento** (enfoque 1 del brainstorming): el hero y Nosotros dicen las dos cosas a la vez.

## Cambios — Home (`export const home`)

| Campo | Nuevo texto |
|--------|-------------|
| `eyebrow` | Diseño · Fabricación · Instalación · Compañeros de proyecto |
| `h1` | Rotulación a medida. Y un partner que va contigo. |
| `lead` | Diseñamos, fabricamos e instalamos rótulos, vinilos, señalética e iluminación LED. También te asesoramos: escuchamos tu idea, te orientamos en materiales y tomamos decisiones contigo. Mismo objetivo: que tu negocio se vea como merece. |
| `trust` | Taller propio en El Campello · Alicante y provincia · Te acompañamos de principio a fin |
| `ctaPrimary` | Cuéntanos tu idea *(sin cambio)* |
| `whyEyebrow` | Contigo en el proyecto |
| `whyH2` | No solo fabricamos: te acompañamos |
| `whyLead` | No hace falta llegar con todo decidido. Empatizamos con lo que quieres comunicar, te explicamos opciones con claridad y avanzamos juntos hasta el montaje o la entrega. |
| `contactH2` | Tu próximo proyecto empieza con una conversación. *(sin cambio)* |
| `contactLead` | ¿Abres local, renuevas imagen o necesitas una pieza? Cuéntanoslo. Somos taller y también compañeros de camino: fotos y medidas aproximadas ayudan a orientarte mejor. |

### Home — `benefits` (4 pasos)

1. **Te escuchamos de verdad** — Qué necesitas, dónde irá y qué imagen quieres transmitir. Empezamos por entenderte.  
2. **Te asesoramos con criterio** — Materiales, tamaño, acabados e iluminación. Elegimos contigo, no por ti.  
3. **Lo fabricamos en el taller** — Preparamos las piezas a partir del diseño acordado, cuidando su lectura y sus acabados.  
4. **Cerramos juntos la entrega o el montaje** — Puedes encargarnos la fabricación y la instalación, o recibir las piezas listas para tu proyecto. Lo acordamos contigo.

### Home — metadatos SEO

- `title` / `description`: **no cambiar** en esta iteración (siguen anclados a rotulación e iluminación en Alicante). El H1 visible puede diferir del title sin problema.

## Cambios — Nosotros (`export const nosotros`)

| Campo | Nuevo texto |
|--------|-------------|
| `title` | Taller de rotulación y partner de proyecto \| Vexil |
| `description` | Taller de rotulación en El Campello: diseño, fabricación e instalación. También partner y asesor para negocios en Alicante. |
| `h1` | Taller propio. Y compañeros de tu rotulación. |
| `lead` | Somos un taller de rotulación en El Campello: diseño, fabricación e instalación. También somos tu partner y asesor: nos preocupamos por tu proyecto, empatizamos con tu negocio y trabajamos hacia el mismo objetivo. |
| `trust` | Diseño, taller e instalación · Partner de proyecto |
| `whyH2` | Cercanía para decidir. Taller para hacerlo. Compañeros hasta el final. |
| `whyLead` | Empezamos por lo concreto: qué necesitas, dónde irá y cómo quieres que se vea. Te explicamos opciones sin prisa y acordamos diseño y alcance antes de producir. No eres un encargo más: vamos a por el mismo resultado. |

### Nosotros — pills

| Antes | Después |
|--------|---------|
| Te orientamos / Material, tamaño y luz | **Partner y asesor** / Material, tamaño, luz y decisión compartida |
| Taller propio / CNC… | sin cambio |
| Todo o una pieza / … | sin cambio |

### Nosotros — benefits

| Antes | Después |
|--------|---------|
| Te orientamos / Material, tamaño y luz… | **Partner y asesor** / Material, tamaño y luz según el espacio y el presupuesto. Decidimos contigo. |
| Hablas con el taller / Quien te atiende… | **Mismo equipo, mismo objetivo** / Quien te atiende es quien fabrica y monta, o quien te deja la pieza lista. Vamos a por el mismo resultado. |
| Producción en taller | sin cambio de fondo |

## Criterios de aceptación

1. Home y Nosotros muestran taller **y** partner/asesor sin eliminar “diseño / fabricación / instalación”.  
2. No se reescriben páginas de servicio.  
3. `npm run build` y `npm run check` pasan.  
4. Tras deploy, portada y `/nosotros/` reflejan los textos en vivo.

## No hacer

- No inventar claims (años, nº de clientes, premios).  
- No tono comercial hinchado ni “somos la mejor empresa”.  
- No tocar `.env` ni credenciales.
