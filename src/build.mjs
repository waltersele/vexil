import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  contact,
  extraPages,
  home,
  homeCatalog,
  legalPages,
  navServices,
  nextStepText,
  nosotros,
  profesionales,
  redirects,
  services,
  site,
  thanksPage,
} from "./content.mjs";
import { icon } from "./icons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const assetsDir = join(pub, "assets");

const PHONE = contact.phoneDisplay;
const TEL = contact.phoneTel;
const MAIL = contact.email;
const ADDRESS_LINE = [contact.streetAddress, [contact.postalCode, contact.addressLocality].filter(Boolean).join(" "), contact.addressRegion]
  .filter(Boolean)
  .join(", ");
const NAP = [contact.name, ADDRESS_LINE].filter(Boolean).join(" · ");
const AREA = contact.areaServed.join(", ");

function rel(depth, path) {
  if (!path) return depth === 0 ? "./" : "../".repeat(depth);
  const prefix = depth === 0 ? "" : "../".repeat(depth);
  return `${prefix}${path}`;
}

function asset(depth, file) {
  return rel(depth, `assets/${file}`);
}

function absUrl(path = "") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${site.origin}${clean === "/" ? "/" : clean}`;
}

function waUrl(message) {
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function resolveLinks(html = "", depth) {
  return html.replace(/data-rel="([^"]+)"/g, (_, href) => `href="${rel(depth, href)}"`);
}

function collectFaqs(page) {
  const list = [...(page.faqs || [])];
  for (const t of page.types || []) {
    if (t.faqs?.length) list.push(...t.faqs);
  }
  return list;
}

function faqJsonLd(faqs) {
  if (!faqs?.length) return "";
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q.replace(/<[^>]+>/g, ""),
      acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") },
    })),
  })}</script>`;
}

function localBusinessJsonLd() {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: contact.name,
    image: absUrl("assets/og.jpg"),
    url: absUrl(""),
    telephone: TEL,
    email: MAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: contact.addressLocality,
      addressRegion: contact.addressRegion,
      addressCountry: contact.addressCountry,
      ...(contact.streetAddress ? { streetAddress: contact.streetAddress } : {}),
      ...(contact.postalCode ? { postalCode: contact.postalCode } : {}),
    },
    areaServed: contact.areaServed.map((name) => ({ "@type": "City", name })),
    logo: absUrl("assets/logo.png"),
  })}</script>`;
}

function breadcrumbJsonLd(crumbs) {
  if (!crumbs?.length) return "";
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  })}</script>`;
}

function picture(depth, file, alt, { eager = false, cls = "w-full h-full object-cover", w = 1200, h = 800 } = {}) {
  const base = file.replace(/\.(jpe?g|png)$/i, "");
  const webp = asset(depth, `${base}.webp`);
  const fallback = asset(depth, file);
  const lazy = eager ? "" : ` loading="lazy"`;
  return `<picture>
<source type="image/webp" srcset="${webp}"/>
<img class="${cls}" alt="${alt}" src="${fallback}" width="${w}" height="${h}"${lazy}/>
</picture>`;
}

function head({ title, description, path, depth, faqs = [], crumbs = [], localBusiness = false, ogImage = "og.jpg" }) {
  const canonical = absUrl(path);
  const og = absUrl(`assets/${ogImage}`);
  const ga = site.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.gaId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.gaId}',{anonymize_ip:true});</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${og}"/>
<meta property="og:locale" content="es_ES"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonical}"/>
<link rel="icon" type="image/png" sizes="32x32" href="${asset(depth, "favicon-32.png")}"/>
<link rel="apple-touch-icon" sizes="180x180" href="${asset(depth, "apple-touch-icon.png")}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="${asset(depth, "app.css")}"/>
${faqJsonLd(faqs)}
${localBusiness ? localBusinessJsonLd() : ""}
${breadcrumbJsonLd(crumbs)}
${ga}
</head>`;
}

function serviceHref(depth, slug) {
  return rel(depth, `servicios/${slug}/`);
}

function header(depth, active) {
  const homeHref = rel(depth, "");
  const pro = rel(depth, "profesionales/");
  const about = rel(depth, "nosotros/");
  const serviceNavActive = active && !["home", "profesionales", "nosotros", "legal", "gracias"].includes(active);
  const megaItems = navServices
    .map(
      (s) => `<a class="flex items-start gap-3 p-space-md hover:bg-surface-container transition-colors ${active === s.slug ? "bg-surface-container" : ""}" href="${serviceHref(depth, s.slug)}">
${icon(s.icon, "w-[22px] h-[22px] text-primary-container mt-0.5 shrink-0")}
<span class="min-w-0">
<span class="block font-label-md text-label-md uppercase tracking-wider ${active === s.slug ? "text-primary-container" : "text-on-surface"}">${s.name}</span>
<span class="block font-body-sm text-body-sm text-on-surface-variant mt-1">${s.short}</span>
</span>
</a>`
    )
    .join("");
  const mobileServices = navServices
    .map(
      (s) =>
        `<a class="flex items-center gap-2 py-2 font-label-md text-label-md uppercase ${active === s.slug ? "text-primary-container" : "text-on-surface"}" href="${serviceHref(depth, s.slug)}">${icon(s.icon, "w-[18px] h-[18px] text-primary-container")}${s.name}</a>`
    )
    .join("");
  return `<header class="fixed top-0 left-0 w-full z-[60] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
<div class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between">
<a class="flex items-center shrink-0" href="${homeHref}">
<img alt="Vexil" class="h-10 md:h-12 w-auto object-contain object-left" src="${asset(depth, "logo.png")}" width="160" height="48"/>
</a>
<nav class="hidden lg:flex items-center gap-space-lg h-full">
<div class="mega-wrap static h-full flex items-center">
<a class="inline-flex items-center h-full font-label-md text-label-md uppercase tracking-wider ${serviceNavActive ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}" href="${homeHref}#servicios">Servicios</a>
<div class="mega-panel absolute left-0 right-0 top-full z-[100] border-t border-surface-container" style="background:#ffffff; box-shadow:0 16px 48px rgba(0,0,0,0.12);">
<div class="max-w-7xl mx-auto px-margin-desktop py-space-lg">
<div class="flex items-end justify-between pb-space-md">
<div>
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container">Servicios</span>
<p class="font-headline-sm text-headline-sm text-on-surface mt-1">Del diseño al montaje, con el mismo equipo</p>
</div>
<a class="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant hover:text-primary-container" href="${homeHref}#servicios">Ver todos</a>
</div>
<div class="grid grid-cols-3 gap-1">${megaItems}</div>
<div class="mt-space-md pt-space-md border-t border-surface-container flex items-center justify-between">
<p class="font-body-sm text-body-sm text-on-surface-variant">¿Eres estudio, constructora o rotulista?</p>
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
<a class="hidden xl:flex items-center gap-space-xs font-label-technical text-label-technical tracking-widest text-on-surface-variant hover:text-on-surface" href="tel:${TEL}" data-track="tel" aria-label="Llamar al ${PHONE}">${icon("call", "w-4 h-4 text-primary-container")}${PHONE}</a>
<a class="hidden sm:inline-flex items-center justify-center px-space-md py-space-sm bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md uppercase tracking-wider" href="#contacto">Solicitar presupuesto</a>
<button id="menu-btn" class="lg:hidden w-10 h-10 flex items-center justify-center" type="button" aria-label="Abrir menú">${icon("menu", "w-6 h-6")}</button>
</div>
</div>
<div id="mobile-menu" class="lg:hidden bg-surface-container-lowest border-t border-surface-container px-margin-mobile py-space-md">
<a class="block py-2 font-label-md text-label-md uppercase" href="${homeHref}">Inicio</a>
<p class="font-label-technical text-label-technical uppercase text-primary-container pt-2">Servicios</p>
${mobileServices}
<a class="block py-2 font-label-md text-label-md uppercase ${active === "nosotros" ? "text-primary-container" : ""}" href="${about}">Nosotros</a>
<a class="block py-2 font-label-md text-label-md uppercase ${active === "profesionales" ? "text-primary-container" : ""}" href="${pro}">Profesionales</a>
<a class="block py-2 font-label-md text-label-md uppercase" href="#contacto">Contacto</a>
<a class="block py-2 font-label-technical text-label-technical" href="tel:${TEL}" data-track="tel">${PHONE}</a>
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
<img alt="Vexil" class="h-7 w-auto max-w-full self-start object-contain object-left" src="${asset(depth, "logo.png")}" width="101" height="28"/>
<p class="font-body-sm text-body-sm text-on-surface-variant">Rotulación, fachadas, interiores y señalética. Diseñado y fabricado en El Campello, montado en toda el área de Alicante.</p>
<p class="font-body-sm text-body-sm text-on-surface">${NAP}</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">${AREA}</p>
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
<a class="font-label-technical text-label-technical uppercase text-primary-container hover:underline" href="#contacto">Pedir presupuesto</a>
<a class="font-body-sm text-body-sm text-on-surface" href="mailto:${MAIL}">${MAIL}</a>
</div>
<div class="flex flex-col gap-space-sm">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-on-surface">Contacto</span>
<div class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
<span>${contact.name}</span>
<span>${ADDRESS_LINE}</span>
<a href="tel:${TEL}" data-track="tel">Teléfono / WhatsApp: ${PHONE}</a>
<a href="${rel(depth, "aviso-legal/")}">Aviso legal</a>
<a href="${rel(depth, "privacidad/")}">Política de privacidad</a>
<a href="${rel(depth, "cookies/")}">Política de cookies</a>
</div>
</div>
</div>
<div class="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-technical text-label-technical text-on-surface-variant">
<span>Vexil © ${new Date().getFullYear()} · vexil.es</span>
<div class="flex gap-space-md"><a href="mailto:${MAIL}">${MAIL}</a><a href="tel:${TEL}" data-track="tel">${PHONE}</a></div>
</div>
</div>
</footer>`;
}

function scripts(depth, page) {
  const thanks = rel(depth, "gracias/");
  const key = site.formAccessKey;
  const cookie = site.gaId
    ? `if(!localStorage.getItem('vexil-cookies')){var b=document.getElementById('cookie-banner');if(b)b.hidden=false;}
document.getElementById('cookie-ok')?.addEventListener('click',function(){localStorage.setItem('vexil-cookies','1');document.getElementById('cookie-banner').hidden=true;});
document.getElementById('cookie-no')?.addEventListener('click',function(){localStorage.setItem('vexil-cookies','0');document.getElementById('cookie-banner').hidden=true;});`
    : "";
  return `<script>
document.getElementById('menu-btn')?.addEventListener('click', function () {
  document.getElementById('mobile-menu')?.classList.toggle('open');
});
function track(name){ if(window.gtag) gtag('event', name); }
document.querySelectorAll('[data-track="tel"]').forEach(function(el){ el.addEventListener('click', function(){ track('click_telefono'); }); });
document.querySelectorAll('[data-track="wa"]').forEach(function(el){ el.addEventListener('click', function(){ track('click_whatsapp'); }); });
document.querySelectorAll('form[data-vexil-form]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    track('envio_formulario');
    ${
      key
        ? `fd.append('access_key', ${JSON.stringify(key)});
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
      .then(function(r){ return r.json(); })
      .then(function(){ window.location.href = ${JSON.stringify(thanks)}; })
      .catch(function(){ window.location.href = ${JSON.stringify(thanks)}; });`
        : `var lines = [];
    fd.forEach(function (v, k) { if (String(v).trim()) lines.push(k + ': ' + v); });
    var msg = ${JSON.stringify(page.waMessage || "Hola, os escribo para pedir presupuesto.")} + '\\n\\n' + lines.join('\\n');
    window.location.href = 'https://wa.me/${contact.whatsappNumber}?text=' + encodeURIComponent(msg);`
    }
  });
});
${cookie}
</script>`;
}

function cookieBanner(depth) {
  if (!site.gaId) return "";
  return `<div id="cookie-banner" hidden class="fixed bottom-0 inset-x-0 z-[70] bg-inverse-surface text-inverse-on-surface p-space-md">
<div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-space-md items-start md:items-center justify-between">
<p class="font-body-sm text-body-sm">Usamos cookies de medición si las aceptas. Más información en la <a class="underline" href="${rel(depth, "cookies/")}">política de cookies</a>.</p>
<div class="flex gap-space-sm">
<button id="cookie-ok" type="button" class="px-space-md py-2 bg-primary-container text-on-primary-container font-label-md text-label-md uppercase">Aceptar</button>
<button id="cookie-no" type="button" class="px-space-md py-2 bg-surface-container text-on-surface font-label-md text-label-md uppercase">Rechazar</button>
</div>
</div>
</div>`;
}

function waButton(message) {
  return `<a class="fixed bottom-4 right-4 z-[65] lg:hidden inline-flex items-center gap-2 px-space-md py-3 bg-primary-container text-on-primary-container shadow-lg" href="${waUrl(message)}" data-track="wa" aria-label="Escribir por WhatsApp">${icon("chat", "w-5 h-5")}<span class="font-label-md text-label-md uppercase">WhatsApp</span></a>`;
}

function closeHtml(depth, page) {
  return `${footer(depth)}
${waButton(page.waMessage || home.waMessage)}
${cookieBanner(depth)}
${scripts(depth, page)}
</body></html>`;
}

function pills(page) {
  return `<div class="grid grid-cols-2 gap-space-sm">${page.pills
    .map(
      (p) => `<div class="bg-surface-container p-space-sm">
<div class="text-primary-container mb-1">${icon(p.icon, "w-5 h-5")}</div>
<span class="block font-label-md text-label-md uppercase text-on-surface">${p.title}</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">${p.sub}</span>
</div>`
    )
    .join("")}</div>`;
}

function faqItems(faqs, depth) {
  return faqs
    .map(
      (f) => `<details class="faq group bg-surface-container-lowest p-space-md">
<summary class="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface cursor-pointer list-none gap-space-sm"><span>${resolveLinks(f.q, depth)}</span>${icon("expand_more", "w-5 h-5 text-primary-container shrink-0")}</summary>
<p class="pt-space-md font-body-md text-body-md text-on-surface-variant">${resolveLinks(f.a, depth)}</p>
</details>`
    )
    .join("");
}

function benefits(page, depth) {
  return `<section class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container block mb-1">${page.whyEyebrow}</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-space-md">${page.whyH2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-3xl mb-space-xl">${resolveLinks(page.whyLead, depth)}</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
${page.benefits
  .map(
    (b) => `<div class="bg-surface-container-lowest p-space-lg">
<div class="w-10 h-10 bg-surface-container-high flex items-center justify-center text-primary-container mb-4">${icon(b.icon)}</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-space-sm">${b.title}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">${b.text}</p>
${b.tag ? `<span class="inline-block mt-space-sm font-label-technical text-label-technical uppercase text-primary-container">${b.tag}</span>` : ""}
</div>`
  )
  .join("")}
</div>
</div></section>`;
}

function solutions(depth, page) {
  if (page.variant === "types") {
    return `<section class="w-full bg-surface-container-lowest py-space-xl" id="catalogo">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-2">${page.typesH2Intro}</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-3xl mb-space-xl">${resolveLinks(page.typesLead, depth)}</p>
<div class="space-y-space-xl">${page.types
      .map(
        (t) => `<article class="grid grid-cols-1 lg:grid-cols-2 gap-gutter-lg bg-surface-container-low" id="${t.id}">
<div class="h-64 lg:h-auto overflow-hidden">${picture(depth, t.img, t.alt || t.h2, { w: 900, h: 600 })}</div>
<div class="p-space-lg">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container">${t.kicker}</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface mt-2 mb-space-sm">${t.h2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-space-md">${resolveLinks(t.text, depth)}</p>
<ul class="font-body-sm text-body-sm text-on-surface-variant space-y-1 mb-space-md">${t.specs.map((s) => `<li>${s}</li>`).join("")}</ul>
${t.faqs?.length ? `<div class="space-y-space-sm">${faqItems(t.faqs, depth)}</div>` : ""}
</div>
</article>`
      )
      .join("")}</div>
</div></section>`;
  }
  if (!page.solutions?.length) return "";
  return `<section class="w-full bg-surface-container-lowest py-space-xl" id="catalogo">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-2">${page.solutionsH2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-3xl mb-space-xl">${resolveLinks(page.solutionsLead, depth)}</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg">${page.solutions
    .map(
      (s) => `<article class="bg-surface-container-low flex flex-col">
<div class="h-56 overflow-hidden">${picture(depth, s.img, s.alt || s.title, { w: 800, h: 500 })}</div>
<div class="p-space-lg flex-1">
<span class="font-label-technical text-label-technical uppercase tracking-widest text-primary-container">${s.tech}</span>
<h3 class="font-headline-lg text-headline-lg text-on-surface mt-2 mb-space-sm">${s.title}</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-space-md">${resolveLinks(s.text, depth)}</p>
${Array.isArray(s.specs) && s.specs.length ? `<ul class="font-body-sm text-body-sm text-on-surface-variant space-y-1">${s.specs.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
</div>
</article>`
    )
    .join("")}</div>
</div></section>`;
}

function spaces(depth, page) {
  if (!page.spaces?.length) return "";
  return `<section class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-space-xl">${page.spacesH2}</h2>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">${page.spaces
    .map(
      (s) => `<div class="bg-surface-container-lowest">
<div class="h-48 overflow-hidden">${picture(depth, s.img, s.alt, { w: 600, h: 400 })}</div>
<h3 class="font-headline-sm text-headline-sm p-space-md">${s.title}</h3>
</div>`
    )
    .join("")}</div>
</div></section>`;
}

function nextStep() {
  return `<section class="w-full bg-surface-container py-space-xl">
<div class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
<p class="font-body-lg text-body-lg text-on-surface">${nextStepText}</p>
</div></section>`;
}

function related(depth, page) {
  if (!page.related?.length) return "";
  return `<section class="w-full bg-surface-container-lowest py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-lg text-headline-lg text-on-surface mb-space-md">También te puede interesar</h2>
<ul class="flex flex-wrap gap-space-md">${page.related
    .map((r) => `<li><a class="font-body-md text-body-md text-primary-container hover:underline" href="${rel(depth, r.href)}">${r.anchor}</a></li>`)
    .join("")}</ul>
</div></section>`;
}

function faqs(page, depth) {
  if (!page.faqs?.length) return "";
  return `<section class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<h2 class="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-space-xl">${page.faqH2}</h2>
<div class="space-y-space-sm">${faqItems(page.faqs, depth)}</div>
</div></section>`;
}

function hero(depth, page) {
  const homeHref = rel(depth, "");
  const crumbs =
    page.slug === "profesionales" || page.slug === "nosotros" || extraPages[page.slug]
      ? `<a class="hover:text-primary" href="${homeHref}">Inicio</a><span>/</span><span class="text-on-surface font-semibold">${page.breadcrumb}</span>`
      : `<a class="hover:text-primary" href="${homeHref}">Inicio</a><span>/</span><a class="hover:text-primary" href="${homeHref}#servicios">Servicios</a><span>/</span><span class="text-on-surface font-semibold">${page.breadcrumb}</span>`;
  return `<section class="w-full bg-surface-container-lowest">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-space-xl">
<nav class="flex items-center gap-2 font-label-technical text-label-technical uppercase tracking-wider text-tertiary pb-space-lg">${crumbs}</nav>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-stretch">
<div class="lg:col-span-7 flex flex-col justify-between space-y-space-lg">
<div>
<div class="inline-flex items-center gap-2 px-space-sm py-1 bg-primary-fixed text-on-primary-fixed font-label-technical text-label-technical uppercase mb-space-md">${page.eyebrow}</div>
<h1 class="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">${page.h1}</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant pt-space-md max-w-2xl">${resolveLinks(page.lead, depth)}</p>
</div>
${pills(page)}
<div class="flex flex-col sm:flex-row gap-space-md">
<a class="inline-flex items-center justify-center px-space-lg py-4 bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider text-center" href="#contacto">${page.ctaPrimary}</a>
<a class="inline-flex items-center justify-center px-space-md py-4 bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-label-md text-label-md uppercase tracking-wider text-center" href="#catalogo">${page.ctaSecondary}</a>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">${page.trust}</p>
</div>
<div class="lg:col-span-5 bg-surface-container p-space-md">
<div class="relative w-full h-80 sm:h-96 overflow-hidden">${picture(depth, page.heroImg, page.heroAlt, { eager: true, w: 900, h: 700 })}</div>
</div>
</div>
</div>
</section>`;
}

function contactSection(depth, page) {
  const options = navServices
    .map((s) => `<option value="${s.name}"${s.slug === page.slug ? " selected" : ""}>${s.name}</option>`)
    .join("");
  return `<section class="w-full bg-inverse-surface text-inverse-on-surface py-space-xl" id="contacto">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
<div class="lg:col-span-6 space-y-space-md">
<div class="inline-flex items-center gap-2 bg-primary-container text-on-primary-container font-label-technical text-label-technical px-3 py-1 uppercase tracking-widest">Presupuesto sin compromiso</div>
<h2 class="font-headline-xl text-headline-xl text-inverse-on-surface tracking-tight">${page.contactH2}</h2>
<p class="font-body-lg text-body-lg text-surface-dim">${page.contactLead}</p>
<div class="p-space-md flex flex-wrap items-center justify-between gap-space-md bg-inverse-surface">
<div>
<span class="font-label-technical text-label-technical uppercase tracking-wider text-surface-dim block">Teléfono y WhatsApp</span>
<a class="font-headline-sm text-headline-sm text-inverse-on-surface hover:text-inverse-primary flex items-center gap-2" href="tel:${TEL}" data-track="tel">${icon("call", "w-5 h-5 text-primary-container")}${PHONE}</a>
<a class="font-body-sm text-body-sm text-inverse-primary" href="${waUrl(page.waMessage || home.waMessage)}" data-track="wa">Abrir WhatsApp</a>
</div>
<div>
<span class="font-label-technical text-label-technical uppercase text-inverse-primary block">Email</span>
<a class="font-body-md text-body-md text-inverse-on-surface" href="mailto:${MAIL}">${MAIL}</a>
</div>
</div>
<p class="font-body-sm text-body-sm text-surface-dim">${NAP}</p>
</div>
<div class="lg:col-span-6 bg-surface-container-lowest text-on-surface p-space-lg">
<span class="font-headline-sm text-headline-sm block">Solicitar presupuesto</span>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Te respondemos con una propuesta a medida.</p>
<form class="space-y-space-sm" data-vexil-form>
<input type="hidden" name="servicio_pagina" value="${page.breadcrumb || page.h1}"/>
<div>
<label class="block font-label-md text-label-md uppercase mb-1" for="nombre">Nombre</label>
<input class="w-full border border-outline px-3 py-2 bg-white text-on-surface" id="nombre" name="nombre" type="text" required autocomplete="name"/>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<div>
<label class="block font-label-md text-label-md uppercase mb-1" for="email">Email</label>
<input class="w-full border border-outline px-3 py-2 bg-white text-on-surface" id="email" name="email" type="email" required autocomplete="email"/>
</div>
<div>
<label class="block font-label-md text-label-md uppercase mb-1" for="telefono">Teléfono</label>
<input class="w-full border border-outline px-3 py-2 bg-white text-on-surface" id="telefono" name="telefono" type="tel" autocomplete="tel"/>
</div>
</div>
<div>
<label class="block font-label-md text-label-md uppercase mb-1" for="servicio">Servicio</label>
<select class="w-full border border-outline px-3 py-2 bg-white text-on-surface" id="servicio" name="servicio">${options}</select>
</div>
<div>
<label class="block font-label-md text-label-md uppercase mb-1" for="mensaje">Mensaje</label>
<textarea class="w-full border border-outline px-3 py-2 bg-white text-on-surface min-h-[8rem]" id="mensaje" name="mensaje" required></textarea>
</div>
<button class="w-full py-3 bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md uppercase" type="submit">Enviar</button>
<p class="font-body-sm text-body-sm text-on-surface-variant">Al enviar aceptas la <a class="underline" href="${rel(depth, "privacidad/")}">política de privacidad</a>.</p>
</form>
</div>
</div>
</div>
</section>`;
}

function pageShell(page, depth, path, crumbs, localBusiness = false) {
  return `${head({
    title: page.title,
    description: page.description,
    path,
    depth,
    faqs: collectFaqs(page),
    crumbs,
    localBusiness,
  })}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(depth, page.slug)}
<main class="w-full pt-20 bg-surface">
${hero(depth, page)}
${benefits(page, depth)}
${solutions(depth, page)}
${spaces(depth, page)}
${nextStep()}
${faqs(page, depth)}
${related(depth, page)}
${contactSection(depth, page)}
</main>
${closeHtml(depth, page)}`;
}

function homePage() {
  const cards = homeCatalog
    .map(
      (s) => `<a class="bg-surface-container-lowest p-space-md flex flex-col justify-between shadow-sm hover:shadow-lg transition-all" href="${serviceHref(0, s.slug)}">
<div class="text-primary-container mb-3">${icon(s.icon, "w-7 h-7")}</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface tracking-tight mb-2">${s.name}</h3>
<span class="font-label-technical text-label-technical text-on-surface-variant uppercase">${s.short}</span>
</a>`
    )
    .join("");
  return `${head({
    title: home.title,
    description: home.description,
    path: "/",
    depth: 0,
    faqs: home.faqs,
    localBusiness: true,
  })}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(0, "home")}
<main class="w-full pt-20 bg-surface">
<section class="relative w-full overflow-hidden bg-surface py-space-xl lg:py-24">
<div class="relative max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
<div class="lg:col-span-7 flex flex-col gap-space-md z-10">
<div class="inline-flex items-center gap-space-xs self-start px-3 py-1 bg-surface-container">
<span class="w-2 h-2 bg-primary-container inline-block"></span>
<span class="font-label-technical text-label-technical text-primary-container tracking-widest uppercase">${home.eyebrow}</span>
</div>
<h1 class="font-display-lg text-headline-xl lg:text-display-lg font-bold text-on-surface tracking-tight leading-none mt-2">${home.h1}</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">${home.lead}</p>
<div class="flex flex-wrap gap-space-md pt-space-sm">
<a class="inline-flex items-center justify-center px-8 py-4 bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md uppercase tracking-widest" href="#contacto">${home.ctaPrimary}</a>
<a class="inline-flex items-center justify-center px-8 py-4 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md uppercase tracking-widest" href="#servicios">${home.ctaSecondary}</a>
</div>
<p class="font-label-technical text-label-technical text-on-surface-variant">${home.trust}</p>
</div>
<div class="lg:col-span-5">
<div class="relative w-full h-[460px] overflow-hidden bg-surface-container-high">${picture(0, home.heroImg, home.heroAlt, { eager: true, w: 900, h: 700 })}</div>
</div>
</div>
</div>
</section>
<section class="w-full bg-surface py-space-xl lg:py-24" id="servicios">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div class="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
<span class="font-label-technical text-label-technical text-primary-container tracking-widest uppercase mb-2">${home.servicesEyebrow}</span>
<h2 class="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-4">${home.servicesH2}</h2>
<p class="font-body-md text-body-md text-on-surface-variant">${home.servicesLead}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
<div class="mt-10 text-center">
<a class="inline-flex px-space-lg py-3 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md uppercase tracking-wider" href="${rel(0, "profesionales/")}">¿Eres estudio, constructora o rotulista? Así trabajamos →</a>
</div>
</div>
</section>
<section class="w-full bg-surface-container py-space-xl" id="por-que-elegirnos">
<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
<div class="lg:col-span-5 bg-surface-container-lowest p-space-lg">
<span class="font-label-technical text-label-technical text-primary-container uppercase">${home.whyEyebrow}</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface mt-2">${home.whyH2}</h2>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-3">${home.whyLead}</p>
<a class="inline-flex mt-4 font-label-md text-label-md uppercase tracking-wider text-primary-container hover:underline" href="${rel(0, "nosotros/")}">Conoce el taller</a>
<div class="mt-6 h-64 overflow-hidden">${picture(0, home.whyImg, home.whyImgAlt, { w: 800, h: 500 })}</div>
</div>
<div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
${home.benefits
  .map(
    (b) => `<div class="bg-surface-container-lowest p-space-lg">
<div class="w-10 h-10 bg-surface-container-high flex items-center justify-center text-primary-container mb-4">${icon(b.icon)}</div>
<h3 class="font-headline-sm text-headline-sm mb-2">${b.title}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">${b.text}</p>
</div>`
  )
  .join("")}
</div>
</div>
</section>
${faqs(home, 0)}
${related(0, home)}
${contactSection(0, { ...home, slug: "home", breadcrumb: "Home" })}
</main>
${closeHtml(0, home)}`;
}

function legalHtml(page) {
  const depth = 1;
  const body = {
    "aviso-legal": `<p>Este sitio web es de ${contact.name}, taller de rotulación en ${contact.addressLocality} (${contact.addressRegion}).</p>
<p>Titular: ${contact.name}. NIF: ${contact.nif}.</p>
<p>Domicilio: ${ADDRESS_LINE}.</p>
<p>Contacto: <a href="mailto:${MAIL}">${MAIL}</a> · <a href="tel:${TEL}">${PHONE}</a>.</p>
<p>El sitio tiene carácter informativo sobre los servicios de rotulación. El envío de un formulario no implica la aceptación de un encargo.</p>`,
    privacidad: `<p>Responsable: ${contact.name}. NIF: ${contact.nif}. Domicilio: ${ADDRESS_LINE}. Contacto: ${MAIL}, ${PHONE}.</p>
<p>Tratamos los datos que nos envías por el formulario, el teléfono o WhatsApp para responder a tu solicitud de presupuesto y, si hay encargo, para gestionar el trabajo.</p>
<p>Base jurídica: tu consentimiento al enviar el formulario o al escribirnos, y la ejecución de medidas precontractuales.</p>
<p>Conservamos los datos el tiempo necesario para gestionar la consulta y las obligaciones legales. No los cedemos a terceros salvo prestadores técnicos necesarios (alojamiento o envío del formulario) o obligación legal.</p>
<p>Puedes pedir acceso, rectificación, supresión u oposición en ${MAIL}. También puedes reclamar ante la Agencia Española de Protección de Datos.</p>`,
    cookies: site.gaId
      ? `<p>Si aceptas el aviso, usamos cookies de Google Analytics 4 para medir visitas y conversiones (teléfono, WhatsApp y envío de formulario).</p>
<p>Puedes rechazarlas en el aviso o configurar el navegador. Más detalle en la <a href="${rel(depth, "privacidad/")}">política de privacidad</a>.</p>`
      : `<p>Esta web no instala cookies de analítica mientras no haya un identificador de medición configurado. Solo se usan cookies técnicas imprescindibles del servidor o del navegador.</p>`,
  }[page.slug];
  return `${head({ title: page.title, description: page.description, path: `/${page.path}`, depth, crumbs: [{ name: "Inicio", path: "/" }, { name: page.h1, path: `/${page.path}` }] })}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(depth, "legal")}
<main class="w-full pt-20 bg-surface">
<section class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-space-xl prose-legal">
<h1 class="font-headline-xl text-headline-xl text-on-surface mb-space-lg">${page.h1}</h1>
<div class="font-body-md text-body-md text-on-surface-variant">${body}</div>
</section>
</main>
${closeHtml(depth, { waMessage: home.waMessage })}`;
}

function thanksHtml() {
  const depth = 1;
  return `${head({ title: thanksPage.title, description: thanksPage.description, path: "/gracias/", depth })}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(depth, "gracias")}
<main class="w-full pt-20 bg-surface">
<section class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-space-xl">
<h1 class="font-headline-xl text-headline-xl text-on-surface mb-space-md">${thanksPage.h1}</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-space-lg">${thanksPage.lead}</p>
<a class="inline-flex px-space-lg py-3 bg-primary-container text-on-primary-container font-label-md text-label-md uppercase" href="${rel(depth, "")}">Volver al inicio</a>
</section>
</main>
${closeHtml(depth, thanksPage)}`;
}

function notFoundHtml() {
  const links = navServices.map((s) => `<li><a class="text-primary-container hover:underline" href="${serviceHref(0, s.slug)}">${s.name}</a></li>`).join("");
  return `${head({ title: "Página no encontrada | Vexil", description: "Esta página no existe. Vuelve a los servicios o contacta con Vexil.", path: "/404.html", depth: 0 })}
<body class="bg-surface font-body-md text-on-surface antialiased">
${header(0, "home")}
<main class="w-full pt-20 bg-surface">
<section class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-space-xl">
<h1 class="font-headline-xl text-headline-xl text-on-surface mb-space-md">No hemos encontrado esta página</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-space-lg">Puede que la URL haya cambiado. Elige un servicio o escríbenos.</p>
<ul class="space-y-2 font-body-md text-body-md mb-space-lg">${links}</ul>
<a class="inline-flex px-space-lg py-3 bg-primary-container text-on-primary-container font-label-md text-label-md uppercase" href="#contacto">Contacto</a>
</section>
${contactSection(0, home)}
</main>
${closeHtml(0, home)}`;
}

function redirectHtml(to) {
  const target = absUrl(to);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta http-equiv="refresh" content="0; url=${target}"/>
<link rel="canonical" href="${target}"/>
<title>Redirección | Vexil</title>
</head>
<body>
<p>Esta página se ha movido a <a href="${target}">${target}</a>.</p>
</body>
</html>`;
}

async function write(path, html) {
  const full = join(pub, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, html, "utf8");
}

function sitemapUrls() {
  const urls = ["/", "/nosotros/", "/profesionales/", "/materiales/", "/franquicias/", "/obra-nueva/", "/aviso-legal/", "/privacidad/", "/cookies/", "/gracias/"];
  for (const s of navServices) urls.push(`/servicios/${s.slug}/`);
  return urls;
}

async function optimizeImages() {
  await mkdir(assetsDir, { recursive: true });
  await copyFile(join(root, "src/assets/logo.png"), join(assetsDir, "logo.png"));
  const logo = sharp(join(root, "src/assets/logo.png"));
  await logo.clone().resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(join(assetsDir, "favicon-32.png"));
  await logo.clone().resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(join(assetsDir, "apple-touch-icon.png"));
  const files = (await readdir(assetsDir)).filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith("favicon") && !f.startsWith("apple") && f !== "logo.png");
  for (const file of files) {
    const src = join(assetsDir, file);
    const base = file.replace(/\.(jpe?g|png)$/i, "");
    await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(assetsDir, `${base}.webp`));
  }
  const ogSrc = join(assetsDir, "hero-taller.jpg");
  const ogJpg = join(assetsDir, "og.jpg");
  const ogWebp = join(assetsDir, "og.webp");
  try {
    await sharp(ogSrc).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 80 }).toFile(ogJpg);
    await sharp(ogSrc).resize(1200, 630, { fit: "cover" }).webp({ quality: 78 }).toFile(ogWebp);
  } catch {
    console.warn("No se pudo reescribir og.jpg/og.webp (archivo en uso). Se mantienen los existentes.");
  }
}

const pages = [];

await write("index.html", homePage());
pages.push("/");

const aboutCrumbs = [
  { name: "Inicio", path: "/" },
  { name: "Nosotros", path: "/nosotros/" },
];
await write("nosotros/index.html", pageShell(nosotros, 1, "/nosotros/", aboutCrumbs));
const proCrumbs = [
  { name: "Inicio", path: "/" },
  { name: "Profesionales", path: "/profesionales/" },
];
await write("profesionales/index.html", pageShell(profesionales, 1, "/profesionales/", proCrumbs, true));

for (const page of Object.values(services)) {
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Servicios", path: "/#servicios" },
    { name: page.breadcrumb, path: `/servicios/${page.slug}/` },
  ];
  await write(`servicios/${page.slug}/index.html`, pageShell(page, 2, `/servicios/${page.slug}/`, crumbs));
}

for (const page of Object.values(extraPages)) {
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: page.breadcrumb, path: `/${page.path}` },
  ];
  await write(`${page.path}index.html`, pageShell(page, 1, `/${page.path}`, crumbs));
}

for (const page of Object.values(legalPages)) {
  await write(`${page.path}index.html`, legalHtml(page));
}
await write("gracias/index.html", thanksHtml());
await write("404.html", notFoundHtml());

for (const r of redirects) {
  await write(`${r.from}/index.html`, redirectHtml(r.to));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls()
  .map((u) => `  <url><loc>${absUrl(u)}</loc></url>`)
  .join("\n")}
</urlset>
`;
await writeFile(join(pub, "sitemap.xml"), sitemap, "utf8");
await writeFile(join(pub, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${absUrl("/sitemap.xml")}\n`, "utf8");

await optimizeImages();
console.log("Built pages, sitemap, robots and optimized images");
