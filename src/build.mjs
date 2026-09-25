import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contact, navServices, services, profesionales, nosotros, homeCatalog, homeFaqH2, homeFaqs } from "./content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const PHONE = contact.phoneDisplay;
const TEL = contact.phoneTel;
const MAIL = contact.email;
const WA = contact.whatsapp;

function rel(depth, path) {
  const prefix = depth === 0 ? "" : "../".repeat(depth);
  return `${prefix}${path}`;
}

function asset(depth, file) {
  return rel(depth, `assets/${file}`);
}

const TAILWIND = `tailwind.config = { darkMode: "class", theme: { extend: { colors: { surface: "#f8f9fa", "inverse-on-surface": "#f0f1f2", "on-primary-fixed-variant": "#8e004b", "surface-dim": "#d9dadb", "surface-container": "#edeeef", "on-surface-variant": "#5a3f47", "surface-container-high": "#e7e8e9", "surface-bright": "#f8f9fa", "on-error-container": "#93000a", "surface-variant": "#e1e3e4", "on-secondary": "#ffffff", "tertiary-fixed-dim": "#bcc7dd", "inverse-surface": "#2e3132", "on-secondary-fixed": "#1c1b1b", "on-tertiary-fixed-variant": "#3c475a", tertiary: "#535e72", "surface-container-lowest": "#ffffff", "outline-variant": "#e2bdc7", "on-error": "#ffffff", "secondary-fixed": "#e5e2e1", "on-primary-fixed": "#3e001e", "surface-container-low": "#f3f4f5", "surface-tint": "#b90064", "inverse-primary": "#ffb0c9", "on-tertiary": "#ffffff", "on-primary-container": "#ffffff", "on-tertiary-fixed": "#111c2c", "surface-container-highest": "#e1e3e4", error: "#ba1a1a", "on-secondary-fixed-variant": "#474746", "secondary-fixed-dim": "#c8c6c5", "on-primary": "#ffffff", "primary-fixed": "#ffd9e2", "primary-fixed-dim": "#ffb0c9", "on-secondary-container": "#636262", "error-container": "#ffdad6", "primary-container": "#e6007e", "on-tertiary-container": "#ffffff", "on-surface": "#191c1d", "secondary-container": "#e2dfde", "on-background": "#191c1d", primary: "#b90064", "tertiary-container": "#6c778b", background: "#f8f9fa", secondary: "#5f5e5e", "tertiary-fixed": "#d8e3fa", outline: "#8e6f77" }, borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" }, spacing: { "space-xs": "0.25rem", "space-sm": "0.5rem", "gutter-lg": "2rem", "gutter-sm": "1rem", margin: "2rem", "margin-desktop": "3rem", "space-lg": "1.5rem", "space-xl": "2.5rem", "margin-mobile": "1rem", "space-md": "1rem", gutter: "1.5rem" }, fontFamily: { "body-sm": ["Hanken Grotesk"], "headline-sm": ["Montserrat"], "display-lg": ["Montserrat"], "headline-xl-mobile": ["Montserrat"], "body-md": ["Hanken Grotesk"], "headline-lg": ["Montserrat"], "label-technical": ["Hanken Grotesk"], "label-md": ["Hanken Grotesk"], "body-lg": ["Hanken Grotesk"], "headline-xl": ["Montserrat"], "display-lg-mobile": ["Montserrat"] }, fontSize: { "body-sm": ["13px", { lineHeight: "20px", fontWeight: "400" }], "headline-sm": ["18px", { lineHeight: "26px", letterSpacing: "0.03em", fontWeight: "600" }], "display-lg": ["56px", { lineHeight: "64px", letterSpacing: "-0.02em", fontWeight: "700" }], "headline-xl-mobile": ["28px", { lineHeight: "36px", letterSpacing: "0em", fontWeight: "700" }], "body-md": ["15px", { lineHeight: "24px", fontWeight: "400" }], "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "0.02em", fontWeight: "600" }], "label-technical": ["11px", { lineHeight: "14px", letterSpacing: "0.12em", fontWeight: "700" }], "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.08em", fontWeight: "600" }], "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }], "headline-xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "700" }], "display-lg-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "700" }] } } } };`;

function collectFaqs(page) {
  const list = [...(page.faqs || [])];
  for (const t of page.types || []) {
    if (t.faqs?.length) list.push(...t.faqs);
  }
  return list;
}

function faqJsonLd(faqs) {
  if (!faqs?.length) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>
`;
}

function faqItems(faqs) {
  return faqs
    .map(
      (f) => `<details class="faq group bg-surface-container-lowest p-space-md">
<summary class="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface uppercase cursor-pointer list-none gap-space-sm"><span>${f.q}</span><span class="material-symbols-outlined text-primary-container shrink-0">expand_more</span></summary>
<p class="pt-space-md font-body-md text-body-md text-on-surface-variant">${f.a}</p>
</details>`
    )
    .join("");
}

function head(title, description, depth, faqs = []) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<link rel="icon" href="${asset(depth, "logo.png")}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>${TAILWIND}</script>
${faqJsonLd(faqs)}
<style>
@layer base { html, body { margin: 0; padding: 0; } body { overscroll-behavior: none; } }
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
details.faq summary::-webkit-details-marker { display: none; }
#mobile-menu:not(.open) { display: none; }
html { scroll-behavior: smooth; }
[id] { scroll-margin-top: 6rem; }
.mega-panel { display: none; }
.mega-wrap:hover .mega-panel,
.mega-wrap:focus-within .mega-panel,
.mega-wrap.is-open .mega-panel { display: block; }
</style>
</head>`;
}

function serviceHref(depth, slug) {
  return rel(depth, `servicios/${slug}/`);
}

function header(depth, active) {
  const home = rel(depth, "");
  const pro = rel(depth, "profesionales/");
  const about = rel(depth, "nosotros/");
  const serviceNavActive = active && !["home", "profesionales", "nosotros"].includes(active);
  const megaItems = navServices
    .map(
      (s) =>
        `<a class="flex items-start gap-3 p-space-md hover:bg-surface-container transition-colors ${active === s.slug ? "bg-surface-container" : ""}" href="${serviceHref(depth, s.slug)}">
<span class="material-symbols-outlined text-primary-container text-[22px] mt-0.5">${s.icon}</span>
<span class="min-w-0">
<span class="block font-label-md text-label-md uppercase tracking-wider ${active === s.slug ? "text-primary-container" : "text-on-surface"}">${s.name}</span>
<span class="block font-body-sm text-body-sm text-on-surface-variant mt-1">${s.short}</span>
</span>
</a>`
    )
    .join("");
  const mobileServices = navServices
    .map((s) => `<a class="flex items-center gap-2 py-2 font-label-md text-label-md uppercase ${active === s.slug ? "text-primary-container" : "text-on-surface"}" href="${serviceHref(depth, s.slug)}"><span class="material-symbols-outlined text-[18px] text-primary-container">${s.icon}</span>${s.name}</a>`)
    .join("");
  return `<header class="fixed top-0 left-0 w-full z-[60] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
<div class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between">
<a class="flex items-center shrink-0" href="${home}">
<img alt="Vexil Rotulación" class="h-10 md:h-12 w-auto object-contain object-left" src="${asset(depth, "logo.png")}"/>
</a>
<nav class="hidden lg:flex items-center gap-space-lg h-full">
<div class="mega-wrap static h-full flex items-center">
<a class="inline-flex items-center h-full font-label-md text-label-md uppercase tracking-wider ${serviceNavActive ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}" href="${home}#servicios">Servicios</a>
<div class="mega-panel absolute left-0 right-0 top-full z-[100] border-t border-surface-container" style="background:#ffffff; box-shadow:0 16px 48px rgba(0,0,0,0.12);">
<div class="max-w-7xl mx-auto px-margin-desktop py-space-lg">
<div class="flex items-end justify-between pb-space-md">
<div>
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container">Catálogo de taller</span>
<p class="font-headline-sm text-headline-sm text-on-surface uppercase mt-1">Diez servicios, un solo interlocutor</p>
</div>
<a class="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant hover:text-primary-container" href="${home}#servicios">Ver todos</a>
</div>
<div class="grid grid-cols-3 gap-1">${megaItems}</div>
<div class="mt-space-md pt-space-md border-t border-surface-container flex items-center justify-between">
<p class="font-body-sm text-body-sm text-on-surface-variant">¿Eres empresa de rotulación, montador, agencia o estudio?</p>
<a class="font-label-md text-label-md uppercase tracking-wider text-primary-container hover:underline" href="${pro}">Página profesionales</a>
</div>
</div>
</div>
</div>
<a class="font-label-md text-label-md uppercase tracking-wider ${active === "nosotros" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}" href="${about}">Nosotros</a>
<a class="font-label-md text-label-md uppercase tracking-wider ${active === "profesionales" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}" href="${pro}">Profesionales</a>
<a class="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-on-surface" href="#contacto">Contacto</a>
</nav>
<div class="flex items-center gap-space-md">
<a class="hidden xl:flex items-center gap-space-xs font-label-technical text-label-technical tracking-widest text-on-surface-variant hover:text-on-surface" href="tel:${TEL}"><span class="w-2 h-2 rounded-full bg-primary-container inline-block"></span>${PHONE}</a>
<a class="hidden sm:inline-flex items-center justify-center px-space-md py-space-sm bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md uppercase tracking-wider" href="#contacto">Solicitar presupuesto</a>
<button id="menu-btn" class="lg:hidden w-10 h-10 flex items-center justify-center" type="button" aria-label="Abrir menú"><span class="material-symbols-outlined">menu</span></button>
</div>
</div>
<div id="mobile-menu" class="lg:hidden bg-surface-container-lowest border-t border-surface-container px-margin-mobile py-space-md">
<a class="block py-2 font-label-md text-label-md uppercase" href="${home}">Inicio</a>
<p class="font-label-technical text-label-technical uppercase text-primary-container pt-2">Servicios</p>
${mobileServices}
<a class="block py-2 font-label-md text-label-md uppercase ${active === "nosotros" ? "text-primary-container" : ""}" href="${about}">Nosotros</a>
<a class="block py-2 font-label-md text-label-md uppercase ${active === "profesionales" ? "text-primary-container" : ""}" href="${pro}">Profesionales</a>
<a class="block py-2 font-label-md text-label-md uppercase" href="#contacto">Contacto</a>
<a class="block py-2 font-label-technical text-label-technical" href="tel:${TEL}">${PHONE}</a>
<a class="block py-2 font-label-technical text-label-technical" href="mailto:${MAIL}">${MAIL}</a>
</div>
</header>`;
}

function footer(depth) {
  const serviceLinks = navServices
    .map((s) => `<a class="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface" href="${serviceHref(depth, s.slug)}">${s.name}</a>`)
    .join("");
  return `<footer class="w-full bg-surface-container-low pt-space-xl pb-space-lg">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-lg pb-space-xl">
<div class="flex flex-col gap-space-sm">
<div class="flex items-center gap-space-xs"><img alt="vexil.es" class="h-7 w-auto" src="${asset(depth, "logo.png")}"/></div>
<p class="font-body-sm text-body-sm text-on-surface-variant">Especialistas en rotulación comercial, fachadas, rótulos, vehículos e iluminación. Taller en El Campello, zona de Alicante.</p>
<div class="flex gap-space-xs pt-space-xs"><span class="font-label-technical text-label-technical uppercase bg-surface-container px-2 py-1">Taller propio</span><span class="font-label-technical text-label-technical uppercase bg-surface-container px-2 py-1">El Campello</span></div>
</div>
<div class="flex flex-col gap-space-sm">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-on-surface">Servicios</span>
<div class="flex flex-col gap-space-xs">${serviceLinks}
<a class="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface" href="${rel(depth, "nosotros/")}">Nosotros</a>
<a class="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface" href="${rel(depth, "profesionales/")}">Profesionales</a>
</div>
</div>
<div class="flex flex-col gap-space-sm">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-on-surface">Presupuestos</span>
<p class="font-body-sm text-body-sm text-on-surface-variant">Escríbenos o llámanos. Te asesoramos sin compromiso.</p>
<a class="font-label-technical text-label-technical uppercase text-primary-container hover:underline" href="#contacto">Pedir presupuesto gratis</a>
<a class="font-body-sm text-body-sm text-on-surface" href="mailto:${MAIL}">${MAIL}</a>
</div>
<div class="flex flex-col gap-space-sm">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-on-surface">Contacto</span>
<div class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
<a href="tel:${TEL}">Teléfono / WhatsApp: ${PHONE}</a>
<a href="${WA}">WhatsApp directo</a>
<span class="font-label-technical text-label-technical text-tertiary pt-space-xs">Taller en El Campello · Alicante, San Juan, San Vicente, Mutxamel, Jijona, Villajoyosa y Benidorm</span>
</div>
</div>
</div>
<div class="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-technical text-label-technical text-on-surface-variant">
<span>vexil.es © Todos los derechos reservados.</span>
<div class="flex gap-space-md"><a href="mailto:${MAIL}">${MAIL}</a><a href="tel:${TEL}">${PHONE}</a></div>
</div>
</div>
</footer>
<script>
document.getElementById('menu-btn')?.addEventListener('click', function () {
  document.getElementById('mobile-menu')?.classList.toggle('open');
});
document.querySelectorAll('form[data-vexil-form]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var lines = [];
    fd.forEach(function (v, k) { if (String(v).trim()) lines.push(k + ': ' + v); });
    var body = encodeURIComponent(lines.join('\\n'));
    var subject = encodeURIComponent(fd.get('servicio') ? 'Presupuesto: ' + fd.get('servicio') : 'Presupuesto vexil.es');
    window.location.href = 'mailto:${MAIL}?subject=' + subject + '&body=' + body;
  });
});
</script>
</body></html>`;
}

function contactSection(depth, page) {
  const serviceName = page.breadcrumb || "Proyecto";
  const options = navServices
    .map((s) => `<option${s.slug === page.slug ? " selected" : ""}>${s.name}</option>`)
    .join("");
  return `<section class="w-full bg-inverse-surface text-inverse-on-surface py-space-xl relative overflow-hidden" id="contacto">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
<div class="lg:col-span-6 space-y-space-md">
<div class="inline-flex items-center gap-2 bg-primary-container text-on-primary-container font-label-technical text-label-technical px-3 py-1 uppercase font-bold tracking-widest">Presupuesto en 24 h</div>
<h2 class="font-headline-xl text-headline-xl text-inverse-on-surface uppercase tracking-tight leading-tight">${page.contactH2}</h2>
<p class="font-body-lg text-body-lg text-surface-dim">${page.contactLead}</p>
<div class="bg-inverse-surface/80 p-space-md flex flex-wrap items-center justify-between gap-space-md">
<div>
<span class="font-label-technical text-label-technical uppercase tracking-wider text-surface-dim block">Teléfono y WhatsApp</span>
<a class="font-headline-sm text-headline-sm text-inverse-on-surface hover:text-inverse-primary flex items-center gap-2" href="tel:${TEL}"><span class="material-symbols-outlined text-primary-container">call</span>${PHONE}</a>
<a class="font-body-sm text-body-sm text-inverse-primary" href="${WA}">Abrir WhatsApp</a>
</div>
<div>
<span class="font-label-technical text-label-technical uppercase text-inverse-primary font-bold block">Email</span>
<a class="font-body-md text-body-md text-inverse-on-surface" href="mailto:${MAIL}">${MAIL}</a>
</div>
</div>
</div>
<div class="lg:col-span-6 bg-surface-container-lowest text-on-surface p-space-lg">
<span class="font-headline-sm text-headline-sm uppercase block">Solicitar presupuesto</span>
<span class="font-body-sm text-body-sm text-tertiary block mb-space-md">Se abre tu correo con los datos hacia ${MAIL}</span>
<form class="space-y-space-sm" data-vexil-form>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<div><label class="block font-label-technical text-label-technical uppercase text-on-surface-variant mb-1">Nombre o empresa *</label><input name="nombre" required class="w-full bg-surface-container-low px-space-sm py-2.5 font-body-md text-body-md border-0" type="text"/></div>
<div><label class="block font-label-technical text-label-technical uppercase text-on-surface-variant mb-1">Teléfono o WhatsApp *</label><input name="telefono" required class="w-full bg-surface-container-low px-space-sm py-2.5 font-body-md text-body-md border-0" type="tel"/></div>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<div><label class="block font-label-technical text-label-technical uppercase text-on-surface-variant mb-1">Email *</label><input name="email" required class="w-full bg-surface-container-low px-space-sm py-2.5 font-body-md text-body-md border-0" type="email"/></div>
<div><label class="block font-label-technical text-label-technical uppercase text-on-surface-variant mb-1">Servicio</label><select name="servicio" class="w-full bg-surface-container-low px-space-sm py-2.5 font-body-md text-body-md border-0">${options}<option${page.slug === "profesionales" ? " selected" : ""}>Profesionales / producción B2B</option><option${page.slug === "nosotros" ? " selected" : ""}>Consulta general</option></select></div>
</div>
<div><label class="block font-label-technical text-label-technical uppercase text-on-surface-variant mb-1">Ciudad / provincia</label><input name="ciudad" class="w-full bg-surface-container-low px-space-sm py-2.5 font-body-md text-body-md border-0" type="text"/></div>
<div><label class="block font-label-technical text-label-technical uppercase text-on-surface-variant mb-1">Cuéntanos el proyecto</label><textarea name="mensaje" rows="3" class="w-full bg-surface-container-low px-space-sm py-2 font-body-md text-body-md border-0 resize-none" placeholder="Medidas, fotos, plazos…"></textarea></div>
<button class="w-full py-4 bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-2" type="submit">Enviar a ${MAIL}</button>
</form>
</div>
</div>
</div>
</section>`;
}

function pills(page) {
  return `<div class="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">${page.pills
    .map(
      (p) => `<div class="p-space-sm bg-surface-container-low flex flex-col">
<span class="material-symbols-outlined text-primary-container mb-1 text-[22px]">${p.icon}</span>
<span class="font-label-technical text-label-technical uppercase text-on-surface">${p.title}</span>
<span class="font-body-sm text-body-sm text-tertiary">${p.sub}</span>
</div>`
    )
    .join("")}</div>`;
}

function benefits(page) {
  return `<section class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="max-w-3xl mb-space-xl">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container block mb-1">${page.whyEyebrow}</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">${page.whyH2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant pt-2">${page.whyLead}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
${page.benefits
  .map(
    (b) => `<div class="bg-surface-container-lowest p-space-lg flex flex-col justify-between">
<div>
<div class="w-12 h-12 bg-surface-container flex items-center justify-center text-primary-container mb-space-md"><span class="material-symbols-outlined text-[28px]">${b.icon}</span></div>
<span class="font-label-technical text-label-technical uppercase text-primary-container font-bold block mb-1">${b.kicker}</span>
<h3 class="font-headline-sm text-headline-sm text-on-surface uppercase mb-space-sm">${b.title}</h3>
<p class="font-body-md text-body-md text-on-surface-variant">${b.text}</p>
</div>
<div class="pt-space-md"><span class="font-label-technical text-label-technical uppercase bg-surface-container px-2 py-1 inline-block">${b.tag}</span></div>
</div>`
  )
  .join("")}
</div></div></section>`;
}

function solutions(depth, page) {
  if (page.variant === "types") {
    const jump = page.types
      .map((t) => `<a class="font-label-technical text-label-technical uppercase bg-surface-container px-3 py-1 hover:bg-primary-container hover:text-on-primary-container" href="#${t.id}">${t.h2}</a>`)
      .join("");
    const blocks = page.types
      .map(
        (t) => `<article class="bg-surface-container-low" id="${t.id}">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
<div class="lg:col-span-7 p-space-lg">
<span class="font-label-technical text-label-technical uppercase text-primary-container">${t.kicker}</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight mt-2">${t.h2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant pt-space-sm">${t.text}</p>
<ul class="mt-space-md space-y-1">${t.specs.map((s) => `<li class="font-body-sm text-body-sm text-on-surface">— ${s}</li>`).join("")}</ul>
</div>
<div class="lg:col-span-5 h-64 lg:h-full min-h-[16rem] overflow-hidden">
<img class="w-full h-full object-cover" alt="${t.h2}" src="${asset(depth, t.img)}"/>
</div>
</div>
${t.faqs?.length ? `<div class="px-space-lg pb-space-lg space-y-space-sm">${faqItems(t.faqs)}</div>` : ""}
</article>`
      )
      .join("");
    return `<section class="w-full bg-surface-container-lowest py-space-xl" id="catalogo">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container">${page.typesH2Intro}</span>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-2 mb-space-md">${page.typesLead}</p>
<div class="flex flex-wrap gap-2 mb-space-xl">${jump}</div>
<div class="flex flex-col gap-gutter-lg">${blocks}</div>
</div></section>`;
  }
  const cards = page.solutions
    .map(
      (s) => `<div class="bg-surface-container-low flex flex-col justify-between group">
<div class="p-space-lg">
<div class="flex items-center justify-between pb-space-md gap-2">
<span class="font-label-technical text-label-technical bg-inverse-surface text-inverse-on-surface px-2 py-1 uppercase">${s.tag}</span>
<span class="font-label-technical text-label-technical text-primary font-bold text-right">${s.tech}</span>
</div>
<h3 class="font-headline-lg text-headline-lg text-on-surface uppercase mb-space-sm">${s.title}</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-space-md">${s.text}</p>
<div class="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-sm">
<div><span class="font-label-technical text-label-technical text-tertiary block">${s.a}</span><span class="font-body-sm text-body-sm text-on-surface font-semibold">${s.av}</span></div>
<div><span class="font-label-technical text-label-technical text-tertiary block">${s.b}</span><span class="font-body-sm text-body-sm text-on-surface font-semibold">${s.bv}</span></div>
</div>
</div>
<div class="h-60 w-full overflow-hidden relative">
<img class="w-full h-full object-cover" alt="${s.title}" src="${asset(depth, s.img)}"/>
<div class="absolute bottom-2 right-2 bg-surface-container-lowest/90 px-2 py-1 font-label-technical text-label-technical uppercase">${s.cap}</div>
</div>
</div>`
    )
    .join("");
  return `<section class="w-full bg-surface-container-lowest py-space-xl" id="catalogo">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div>
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container block mb-1">Catálogo Vexil</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">${page.solutionsH2}</h2>
</div>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">${page.solutionsLead}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg">${cards}</div>
</div></section>`;
}

function process(page) {
  return `<section class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="max-w-3xl mb-space-xl">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container block mb-1">Metodología</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">${page.processH2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant pt-2">${page.processLead}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
${page.process
  .map(
    (s) => `<div class="bg-surface-container-lowest p-space-lg flex flex-col justify-between">
<div>
<div class="flex items-center justify-between pb-space-sm">
<span class="font-headline-lg text-headline-lg text-primary-container font-bold">${s.n}</span>
<span class="material-symbols-outlined text-tertiary text-[24px]">${s.icon}</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface uppercase mb-space-sm">${s.title}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">${s.text}</p>
</div>
<div class="pt-space-md"><span class="font-label-technical text-label-technical text-tertiary uppercase">${s.meta}</span></div>
</div>`
  )
  .join("")}
</div></div></section>`;
}

function cases(depth, page) {
  return `<section class="w-full bg-surface-container-lowest py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight mb-space-xl">${page.casesH2}</h2>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
${page.cases
  .map(
    (c) => `<div class="bg-surface-container-low">
<div class="h-56 overflow-hidden"><img class="w-full h-full object-cover" alt="${c.title}" src="${asset(depth, c.img)}"/></div>
<div class="p-space-md">
<span class="font-label-technical text-label-technical uppercase text-primary-container">${c.tag}</span>
<h3 class="font-headline-sm text-headline-sm text-on-surface uppercase">${c.title}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">${c.sub}</p>
</div></div>`
  )
  .join("")}
</div></div></section>`;
}

function faqs(page) {
  if (!page.faqs?.length) return "";
  return `<section class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight mb-space-xl">${page.faqH2}</h2>
<div class="space-y-space-sm">
${faqItems(page.faqs)}
</div></div></section>`;
}

function hero(depth, page) {
  const home = rel(depth, "");
  const crumbs =
    page.slug === "profesionales"
      ? `<a class="hover:text-primary" href="${home}">Inicio</a><span>/</span><span class="text-on-surface font-semibold">Profesionales</span>`
      : page.slug === "nosotros"
        ? `<a class="hover:text-primary" href="${home}">Inicio</a><span>/</span><span class="text-on-surface font-semibold">Nosotros</span>`
        : `<a class="hover:text-primary" href="${home}">Inicio</a><span>/</span><a class="hover:text-primary" href="${home}#servicios">Servicios</a><span>/</span><span class="text-on-surface font-semibold">${page.breadcrumb}</span>`;
  return `<section class="w-full bg-surface-container-lowest">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-space-xl">
<div class="flex flex-wrap items-center justify-between gap-space-sm pb-space-lg">
<nav class="flex items-center gap-2 font-label-technical text-label-technical uppercase tracking-wider text-tertiary">
${crumbs}
</nav>
<div class="inline-flex items-center gap-space-xs font-label-technical text-label-technical bg-surface-container px-3 py-1 uppercase"><span class="w-2 h-2 bg-primary-container inline-block"></span>Taller en El Campello</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-stretch">
<div class="lg:col-span-7 flex flex-col justify-between space-y-space-lg">
<div>
<div class="inline-flex items-center gap-2 px-space-sm py-1 bg-primary-fixed text-on-primary-fixed font-label-technical text-label-technical uppercase mb-space-md">${page.eyebrow}</div>
<h1 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight leading-tight">${page.h1Before} <span class="text-primary-container bg-surface-container px-2">${page.h1Accent}</span></h1>
<p class="font-body-lg text-body-lg text-on-surface-variant pt-space-md max-w-2xl">${page.lead}</p>
</div>
${pills(page)}
<div class="flex flex-col sm:flex-row gap-space-md">
<a class="inline-flex items-center justify-center gap-space-xs px-space-lg py-4 bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider text-center" href="#contacto">${page.ctaPrimary}</a>
<a class="inline-flex items-center justify-center px-space-md py-4 bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-label-md text-label-md uppercase tracking-wider text-center" href="#catalogo">${page.ctaSecondary}</a>
</div>
<p class="font-body-sm text-body-sm text-tertiary">${page.trust}</p>
</div>
<div class="lg:col-span-5 flex flex-col bg-surface-container p-space-md">
<div class="flex items-center justify-between pb-space-sm">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-on-surface-variant">${page.heroBadge}</span>
</div>
<div class="relative w-full h-80 sm:h-96 overflow-hidden">
<img class="w-full h-full object-cover" alt="" src="${asset(depth, page.heroImg)}"/>
<div class="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 p-space-sm flex items-center justify-between">
<div><span class="block font-headline-sm text-headline-sm text-on-surface">${page.heroTitle}</span><span class="font-body-sm text-body-sm text-tertiary">${page.heroSub}</span></div>
<div class="text-right"><span class="block font-headline-sm text-headline-sm text-primary-container font-bold">${page.heroStat}</span><span class="font-label-technical text-label-technical uppercase text-on-surface-variant">${page.heroStatLabel}</span></div>
</div>
</div>
</div>
</div>
</div>
</section>`;
}

function servicePage(page, depth = 2) {
  const title = `${page.breadcrumb} · vexil.es`;
  return `${head(title, page.lead, depth, collectFaqs(page))}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(depth, page.slug)}
<main class="w-full pt-20 bg-surface">
${hero(depth, page)}
${benefits(page)}
${solutions(depth, page)}
${process(page)}
${cases(depth, page)}
${faqs(page)}
${contactSection(depth, page)}
</main>
${footer(depth)}`;
}

function homePage() {
  const depth = 0;
  const cards = homeCatalog
    .map(
      (s) => `<a class="bg-surface-container-lowest p-space-md flex flex-col justify-between shadow-sm hover:shadow-lg transition-all" href="${serviceHref(0, s.slug)}">
<div>
<div class="flex items-center justify-between pb-3 mb-3 bg-surface-container-low px-2 py-1">
<span class="font-label-technical text-label-technical text-primary-container font-bold">VEXIL // ${s.code}</span>
<span class="material-symbols-outlined text-tertiary text-lg">${s.icon}</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight mb-2">${s.name}</h3>
<span class="font-label-technical text-label-technical text-on-surface-variant uppercase block mb-3 font-semibold">${s.short}</span>
</div>
<div class="mt-6 pt-3 bg-surface-container px-2 py-1 text-center"><span class="font-label-technical text-label-technical uppercase font-bold">Ver servicio</span></div>
</a>`
    )
    .join("");
  return `${head("vexil.es · Rotulación comercial y publicidad exterior", "Fachadas, rótulos, vehículos, impresión, corte, stands, iluminación y señalética. Taller en El Campello. Presupuesto a medida.", 0, homeFaqs)}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(0, "home")}
<main class="w-full pt-20 bg-surface">
<section class="relative w-full overflow-hidden bg-surface py-space-xl lg:py-24">
<div class="relative max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
<div class="lg:col-span-7 flex flex-col gap-space-md z-10">
<div class="inline-flex items-center gap-space-xs self-start px-3 py-1 bg-surface-container">
<span class="w-2 h-2 bg-primary-container inline-block"></span>
<span class="font-label-technical text-label-technical text-primary-container tracking-widest uppercase font-bold">Rotulación profesional y publicidad exterior</span>
</div>
<h1 class="font-display-lg text-headline-xl lg:text-display-lg font-bold text-on-surface uppercase tracking-tight leading-none mt-2">Hacemos que tu marca <span class="text-primary-container">destaque y atraiga</span> a más clientes</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Diseñamos, fabricamos e instalamos fachadas, rótulos, rotulación de vehículos y vinilos de alta durabilidad. Taller propio, entrega puntual.</p>
<div class="flex flex-wrap gap-space-md pt-space-sm">
<a class="inline-flex items-center justify-center gap-space-xs px-8 py-4 bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md uppercase tracking-widest font-bold" href="#contacto">Pedir presupuesto gratis</a>
<a class="inline-flex items-center justify-center px-8 py-4 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md uppercase tracking-widest font-bold" href="#servicios">Ver servicios</a>
</div>
<p class="font-label-technical text-label-technical text-on-surface-variant">Asesoramiento personalizado · Taller en El Campello · ${PHONE}</p>
</div>
<div class="lg:col-span-5">
<div class="relative w-full h-[460px] overflow-hidden bg-surface-container-high">
<img class="w-full h-full object-cover" alt="Taller vexil.es" src="${asset(0, "hero-taller.jpg")}"/>
</div>
</div>
</div>
</div>
</section>
<section class="w-full bg-surface py-space-xl lg:py-24" id="servicios">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
<span class="font-label-technical text-label-technical text-primary-container tracking-widest uppercase font-bold mb-2">Catálogo de servicios</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight mb-4">Todo en rotulación, cartelería y publicidad visual</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Diez servicios de taller propio. Rótulos agrupa corpóreos, neón, luminosos y sin iluminación, más mantenimiento y reparación. Lámina solar cubre arquitectura, privacidad y vinilos ácidos.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
<div class="mt-10 text-center">
<a class="inline-flex px-space-lg py-3 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md uppercase tracking-wider" href="${rel(0, "profesionales/")}">¿Eres empresa de rotulación, montador, agencia o estudio? Página profesionales</a>
</div>
</div>
</section>
<section class="w-full bg-surface-container py-space-xl" id="por-que-elegirnos">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
<div class="lg:col-span-5 bg-surface-container-lowest p-space-lg">
<span class="font-label-technical text-label-technical text-primary-container uppercase">Confianza y resultados</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface uppercase mt-2">Cuidamos cada detalle para que tú solo disfrutes del resultado</h2>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-3">Asesoramos, diseñamos, fabricamos en taller propio e instalamos donde lo necesites.</p>
<a class="inline-flex mt-4 font-label-md text-label-md uppercase tracking-wider text-primary-container hover:underline" href="${rel(0, "nosotros/")}">Conoce el taller</a>
<div class="mt-6 h-64 overflow-hidden"><img class="w-full h-full object-cover" alt="" src="${asset(0, "plano-totem.jpg")}"/></div>
</div>
<div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
${[
  ["home_repair_service", "Fabricación directa", "Taller y maquinaria propia: precio de fábrica y control de calidad."],
  ["verified", "Materiales de primera", "Vinilos, metales y LED resistentes a sol y lluvia."],
  ["engineering", "Asesoramiento", "Te orientamos en material, tamaño e iluminación según tu local."],
  ["construction", "Instalación limpia", "Montadores profesionales que se adaptan a tus horarios."],
]
  .map(
    ([icon, t, d]) => `<div class="bg-surface-container-lowest p-space-lg">
<div class="w-10 h-10 bg-surface-container-high flex items-center justify-center text-primary-container mb-4"><span class="material-symbols-outlined">${icon}</span></div>
<h3 class="font-headline-sm text-headline-sm uppercase mb-2">${t}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">${d}</p>
</div>`
  )
  .join("")}
</div>
</div>
</section>
${faqs({ faqH2: homeFaqH2, faqs: homeFaqs })}
${contactSection(0, { slug: "fachadas", contactH2: "¿Tienes una idea o quieres renovar la imagen de tu negocio?", contactLead: "Envíanos tu logotipo, una foto del local o un boceto. Presupuesto sin compromiso en menos de 24 horas." })}
</main>
${footer(0)}`;
}

async function write(path, html) {
  const full = join(pub, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, html, "utf8");
}

await write("index.html", homePage());
await write("nosotros/index.html", servicePage({ ...nosotros, variant: undefined }, 1));
await write("profesionales/index.html", servicePage({ ...profesionales, variant: undefined }, 1));
for (const page of Object.values(services)) {
  await write(`servicios/${page.slug}/index.html`, servicePage(page, 2));
}
await mkdir(join(pub, "assets"), { recursive: true });
await copyFile(join(root, "src/assets/logo.png"), join(pub, "assets/logo.png"));
console.log("Built home, nosotros, profesionales and", Object.keys(services).length, "service pages");
