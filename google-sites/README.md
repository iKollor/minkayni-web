# Plantilla de Google Sites · Novedades Minkayni (news.minkayni.org)

Kit para montar en Google Sites el sitio de **novedades, posts y newsletter** de la fundación
(`news.minkayni.org`), con la misma identidad que [minkayni.org](https://minkayni.org) y conectado
al CMS (Strapi) que ya alimenta la web.
Colores, tipografías, logotipos y el **footer original** salen directamente del código del sitio
(`src/styles/global.css`, `src/components/Footer.astro`, `src/assets/`). No hay nada reinterpretado.

Google Sites no deja subir tipografías ni cambiar su propio HTML, así que el kit tiene dos partes:

1. **Tema de Google Sites.** Colores, logo, favicon y fuente de los bloques nativos (texto, botones, secciones).
2. **Bloques «Insertar código».** Las piezas que el tema no puede reproducir (el hero, los títulos en
   Aristotelica, el botón animado, **el listado de novedades conectado a Strapi** y el footer completo).
   Se pegan tal cual.

> **Sobre «subir la plantilla».** Google Sites no tiene un gestor que acepte archivos (ni ZIP, ni HTML, ni temas).
> Este ZIP es el material para montar el Site una vez a mano (paso 2 y 3). Hecho eso, ese Site ya es la plantilla:
> - Cuenta de Gmail personal: menú ⋮ → **Hacer una copia** para duplicarlo.
> - Google Workspace: desde la página principal de Sites → **Galería de plantillas** → *Enviar plantilla*, y el Site
>   queda como plantilla de la organización (si el administrador tiene activada la galería).

```
google-sites/
├── embeds/              ← bloques listos para pegar (fuentes Aristotelica incrustadas)
│   ├── footer.html      ← footer original completo
│   ├── hero.html        ← cabecera de página con el fondo de burbujas
│   ├── encabezado.html  ← antetítulo + título de sección
│   ├── boton.html       ← botón «mágico» celeste
│   ├── novedades.html   ← posts desde Strapi (tarjetas + lectura completa)
│   └── ligero/          ← los mismos bloques con Nunito (si Sites rechaza el tamaño)
├── logos/               ← PNG transparentes para el tema, el logo y el favicon
├── vista-previa.html    ← simulación de una página del Site con todo aplicado
├── fuente/              ← plantillas editables (de aquí se generan los embeds)
├── build.mjs            ← regenera embeds/ (node google-sites/build.mjs)
└── exportar-logos.mjs   ← regenera logos/ desde los SVG del sitio
```

---

## 1. Identidad de marca

### Colores

| Uso | Nombre en el código | HEX |
| --- | --- | --- |
| Morado de marca: títulos, secciones destacadas, footer | `--primary` | `#6E00A3` |
| Morado profundo (final del degradado) | `--color-primary-deep` | `#410063` |
| Celeste: botones, iconos sociales, franja de créditos | `--secondary` | `#3FA9F5` |
| Celeste para texto pequeño sobre crema | `--color-secondary-deep` | `#166FB0` |
| Ámbar: acento y hover de botones | `--accent` | `#F3A20B` |
| Crema: fondo de todas las páginas | `--bg-white` | `#FFF6E5` |
| Tinta: texto | `--text` | `#0A0801` |
| Piedra: tarjetas y secciones «isla» | `--color-surface` | `#DEDBD4` |

El texto sobre el celeste va en **negro**, no en blanco (el blanco no llega al contraste AA). Así está en la web.

### Tipografías

| Uso | Fuente de la web | En Google Sites |
| --- | --- | --- |
| Títulos (peso 900, Fat) | Aristotelica Pro Display | Incrustada en los bloques de `embeds/`. En texto nativo: **Nunito** |
| Texto corrido | Aristotelica Pro Text | Incrustada en los bloques. En texto nativo: **Nunito** |
| Batucada Popular | Special Gothic Expanded One | **Special Gothic Expanded One** (está en Google Fonts) |

Aristotelica es una fuente comercial y no está en Google Fonts. **Nunito** es la fuente de respaldo que la propia web
declara (`--font-display` en `global.css`), así que es la equivalente oficial para los textos que escribas con el
editor de Google Sites.

### Logotipos (`logos/`)

| Archivo | Para qué |
| --- | --- |
| `minkayni-logo-color.png` | Logo del Site (cabecera sobre crema) |
| `minkayni-logo-blanco.png` | Sobre morado o fotos oscuras |
| `minkayni-nombre-color.png` / `minkayni-nombre-blanco.png` | Solo el nombre, sin el lema |
| `minkayni-isotipo-degradado.png` | Isotipo (la «M») con el degradado morado→celeste |
| `minkayni-isotipo-blanco.png` | Isotipo en blanco |
| `minkayni-favicon.png` | Favicon (512 × 512) |
| `minkayni-flor.png` | La flor decorativa de la cúpula |

---

## 2. Configurar el tema (una sola vez)

En el editor del Site: **Temas** → elige cualquier tema base → **Personalizar** (o **Crear tema**) y ponle de nombre «Minkayni».

1. **Colores:** color del tema `#6E00A3`. Si deja añadir más, agrega `#3FA9F5`, `#F3A20B` y `#FFF6E5`.
2. **Fondo de página:** crema `#FFF6E5`.
3. **Estilos de sección:**
   - Normal: fondo `#FFF6E5`, texto `#0A0801`.
   - Énfasis 1: fondo `#6E00A3`, texto `#FFF6E5` (el morado de las secciones destacadas).
   - Énfasis 2: fondo `#DEDBD4`, texto `#0A0801`.
4. **Fuentes:** Nunito en título, encabezado, subtítulo, texto y botones.
5. **Botones:** color `#3FA9F5`, forma redondeada (píldora) si el tema lo permite.

Después:

- **Logo:** menú ⋮ → *Imágenes de marca* → Logo → `logos/minkayni-logo-color.png`.
  Favicon → `logos/minkayni-favicon.png`.
- **Cabecera:** tipo *Solo título* (el hero va como bloque, ver abajo). Navegación: *Superior*.
- **Pie del Site nativo:** déjalo vacío. El footer de la web va como bloque (paso 3).

---

## 3. Pegar los bloques

En cada página: **Insertar → Insertar → Insertar código**, pega el archivo **completo** de `embeds/`
(ábrelo con un editor de texto, selecciona todo y copia) → *Siguiente* → *Insertar*.
Luego estira el bloque a todo el ancho y ajústale el alto:

| Bloque | Dónde | Alto recomendado |
| --- | --- | --- |
| `hero.html` | Primer bloque de cada página | 420–520 px |
| `encabezado.html` | Al inicio de cada sección | 180–220 px (según líneas) |
| `boton.html` | Donde quieras un CTA | 72 px (ancho ~280 px) |
| `novedades.html` | Portada y páginas por tema | 850 px con 3 posts · 1550 px con 6 |
| `footer.html` | Último bloque de cada página | **1440 px** |

El footer rellena solo el alto que le des: si sobra espacio, se lo queda la franja morada y los créditos siguen al fondo.
1440 px cubre desde escritorio hasta móvil.

**Consejo:** monta una página completa (hero + footer), y para crear el resto usa **⋮ → Duplicar página** sobre ella.
Google Sites no tiene un footer global que acepte código, así que el footer va en cada página.

### Qué editar en cada bloque

- **Hero:** el texto del `<h1>` (marcado con ✏️).
- **Encabezado:** antetítulo y título. Lo que va entre `<em>…</em>` sale en morado, como el `*texto*` del CMS.
  `data-align="center"` lo centra.
- **Botón:** el `href` y los dos textos (normal y al pasar el cursor).
- **Footer:** el bloque `CONFIGURACIÓN`, al final del archivo:
  - `SITIO`: a dónde llevan los enlaces. Por defecto van a `https://minkayni.org`. Si pones la dirección del
    Google Site, los enlaces apuntarán a sus páginas con las mismas rutas (`/about`, `/impact`, `/projects`…).
  - `ALIADOS`: logos del carrusel «Nuestros Aliados», con este formato: `{ src: "https://…/logo.png", alt: "Nombre" },`.
    Los logos actuales viven en el CMS (Footer → partnersGallery). Si la lista está vacía, el carrusel no aparece,
    igual que en la web.
  - El año del copyright se actualiza solo.

- **Novedades:** el bloque `CONFIGURACIÓN` del final (ver sección 4).

### Si Google Sites no acepta el bloque

Los bloques de `embeds/` llevan las fuentes incrustadas (el footer pesa ~195 KB). Si el editor da error al insertarlo,
usa el mismo archivo de `embeds/ligero/`: el diseño es idéntico, pero con Nunito en lugar de Aristotelica.

Si un enlace del footer se abre dentro del recuadro en vez de en la página completa, cambia `target="_top"` por
`target="_blank"` en ese enlace.

---

## 4. Novedades conectadas al CMS

`novedades.html` lee la colección **`posts`** del Strapi de la fundación (`https://strapi.minkayni.org`), la misma que
pinta minkayni.org/novedades. Publicas en Strapi y el Site se actualiza solo, sin tocar Google Sites.

Cada tarjeta muestra la foto, la fecha, el titular (la primera línea del pie de foto, igual que en la web), un
extracto y las etiquetas. «Leer más» abre el post completo encima del bloque; «Ver original» lleva a Instagram o Facebook.
En móvil las tarjetas pasan a un carrusel horizontal para que el bloque no necesite más alto.

### Activarlo (una vez, en Strapi)

El bloque corre en el navegador de cada visitante, así que **no puede llevar el token de Strapi** (quedaría a la vista de
cualquiera). Necesita lectura pública de los posts:

1. Strapi → **Configuración → Usuarios y permisos → Roles → Public**.
2. En **Post**, marca `find` (y `findOne` si quieres). Guarda.
3. Comprueba abriendo `https://strapi.minkayni.org/api/posts?pagination[pageSize]=1` en el navegador: debe devolver JSON.

Ten en cuenta que con eso **cualquiera puede leer todos los campos de los posts publicados**, incluido `raw`
(los datos originales importados de la red social). Los borradores siguen privados. Si `raw` guarda algo que no deba
ser público, conviene limpiarlo antes de activar el permiso.

Si el permiso no está activo o el CMS no responde, el bloque no se rompe: muestra «Las novedades no se pudieron cargar
ahora» con un enlace a minkayni.org/novedades.

### Opciones del bloque (`CONFIGURACIÓN`)

| Variable | Qué hace |
| --- | --- |
| `CMS` | Dirección pública de Strapi |
| `CANTIDAD` | Cuántos posts mostrar (3 por fila en escritorio) |
| `IDIOMA` | `"es"` o `"en"` (la colección es bilingüe) |
| `ETIQUETA` | Solo posts con esa etiqueta, sin `#` (p. ej. `"BatucadaPopular"`). Sirve para páginas por tema |
| `ENLACE_TODAS` | Destino del botón final; `""` lo oculta |

### Estructura sugerida del Site

- **Novedades** (portada): hero «Novedades» + encabezado + `novedades.html` con 6 posts + suscripción + footer.
- **Batucada Popular**, **Comunidad**, … : la misma página duplicada con `ETIQUETA` distinta.
- **Newsletter**: formulario de suscripción. Lo más simple es **Insertar → Formularios** (Google Forms, las respuestas
  quedan en una hoja de cálculo). Si usan Brevo, Mailchimp o similar, su formulario se pega con «Insertar código».

---

## 5. Dominio news.minkayni.org

En el editor: ⚙ **Configuración → Dominios personalizados → Iniciar configuración**, escribe `news.minkayni.org` y
sigue los pasos. Google pide verificar que el dominio es vuestro (Google Search Console) y añadir en el DNS de
minkayni.org un registro **CNAME** `news` → `ghs.googlehosted.com.`. El cambio de DNS puede tardar unas horas.

---

## 6. Límites de Google Sites para un sitio de noticias

Conviene saberlos antes de decidir:

- **Buscadores:** lo que carga el bloque de novedades vive dentro de un iframe y Google no lo indexa como parte de
  news.minkayni.org. Los posts no tendrán una URL propia que aparezca en buscadores ni que se pueda compartir.
- **Un post = una página a mano.** Si quieres una página propia para un post, hay que crearla en Google Sites y copiar
  el contenido; eso ya no sale del CMS.
- **Alto fijo:** cada bloque de código tiene un alto fijo; por eso la cantidad de posts se elige de antemano.

Si esos puntos pesan, la alternativa es servir news.minkayni.org con el mismo stack de la web (Astro + Strapi): cada
post tendría su URL, se indexaría y se publicaría desde Strapi sin ningún paso en Google Sites.

---

## 7. Qué es igual y qué cambia respecto a la web

**Igual:** paleta, tipografías en los bloques, logotipos, cúpulas con la flor, títulos «¿Quieres ser nuestro aliado?» y
«Nuestros Aliados», botones «Quiero unirme 💜 / a cambiar vidas ✨» y «Aporta hoy 💜», navegación principal y de
proyectos, redes (Facebook, Instagram, TikTok), línea legal (razón social, RUC, resolución MIES, ciudad) y franja de créditos.

**Cambia, por límites de Google Sites:**

- El texto que escribes con el editor nativo usa Nunito, no Aristotelica.
- Los bloques de código no llegan al borde de la pantalla: Google Sites deja un margen lateral.
- La animación del botón y el carrusel son versiones en CSS (sin GSAP).
- El botón de «Preferencias de cookies» no está, porque en Google Sites no hay aviso de cookies propio que reabrir.
- «Hecho con Astro» pasa a «Hecho con Google Sites», porque el Site no está hecho con Astro.

---

## 8. Regenerar el kit

Si cambian los colores, las fuentes o el footer de la web, edita `fuente/` y ejecuta:

```bash
node google-sites/build.mjs                                   # embeds/ y embeds/ligero/
NODE_PATH=$(npm root -g) node google-sites/exportar-logos.mjs # logos/ (requiere Playwright)
```

Para revisar el resultado, sirve la carpeta y abre `vista-previa.html`:

```bash
npx http-server google-sites -p 8765   # → http://localhost:8765/vista-previa.html
```
