# CLAUDE.md — Generador de Cierre Mensual (dCaC)

Leé esto primero, siempre. Contexto largo: `docs/CONTEXTO_PROYECTO.md` · reglas de negocio: `docs/REGLAS_NEGOCIO.md` ·
historial: `docs/HISTORIAL_CAMBIOS.md` · temas abiertos: `docs/PENDIENTES.md`.
Todo en **español rioplatense** (Karli habla y lee español; los mensajes de commit también).

## Qué es y quién la usa
Webapp **estática** (sin backend, sin build) en GitHub Pages que genera el HTML del mail "Cierre Mensual" de dCaC
(deCampoaCampo, mercado digital de hacienda) leyendo un PDF exportado de Metabase/Power BI. Usuaria: **Karli**
(desarrolladora comercial, NO programadora: no usa git ni terminal; todo el código lo tocás vos). Ella usa el
formulario, copia el HTML generado y lo pega en un editor de correo (Gmail).

## Archivos (todos en la raíz; GitHub Pages sirve desde `main`, carpeta raíz)
- `index.html` — formulario/UI · `app.js` — parsers del PDF + `buildEmailHtml` + borradores/directorio/header ·
  `styles.css` — estilos de la webapp (no del mail) · `assets.js` — blobs base64 (logo, foto de header). **No tocar `assets.js` a mano.**
- `tests/regression.js` — test de regresión (jsdom + pdfjs-dist). `tests/fixtures/*.pdf` = PDFs reales, **gitignored, jamás commitearlos**.

## Flujo de trabajo (obligatorio)
1. Karli pide un cambio en el chat. Si es ambiguo o falta un dato, **preguntá antes** (regla del proyecto: nunca inventar datos).
2. Hacé el cambio tocando el mínimo de archivos. Verificá sintaxis: `node -c app.js`.
3. **Corré `npm test`** (primero `npm install` si falta `node_modules`). Debe dar "Todo OK" contra TODOS los PDFs de `tests/fixtures`.
   Si en esta máquina no están los fixtures, pedíselos a Karli antes de tocar parsers.
4. Resumile a Karli, en 3-6 líneas, qué cambió y en qué archivos. **Si ella ya aprobó el cambio** (o lo pidió explícitamente):
   `git add <archivos puntuales>` → `git commit` (un commit por cambio, mensaje en español, imperativo, explicando el porqué) → `git push origin main`.
   Si el cambio es grande/riesgoso (parsers, estructura del mail) o todavía no lo aprobó: pusheá a una rama `cambio/<tema>`
   y pedile que lo pruebe antes de pasar a `main`.
5. Después del push: avisá el hash del commit y recordale que GitHub Pages tarda 1-2 min y puede hacer falta hard refresh (Ctrl+F5) o ventana de incógnito.
6. Rollback: `git revert <hash>` + push. Nunca `reset --hard` ni force push (bloqueados en `.claude/settings.json`).
7. Actualizá `docs/HISTORIAL_CAMBIOS.md` (y `docs/PENDIENTES.md` / `docs/REGLAS_NEGOCIO.md` si cambió algo ahí) en el mismo commit.

## Reglas duras (romperlas rompió cosas antes)
- **Nunca inventes ni rellenes datos que no estén en el PDF.** Faltante = "--" / "—" gris, o preguntale a Karli.
- **Comentarios de Karli: texto literal, sin parafrasear.**
- **HTML del mail: nada de `background-image` ni `position:absolute`** (Gmail los rompe al pegar). Header = `<img>` + bloque en flujo normal.
  Estilos siempre inline, tablas anidadas.
- **Un fix para un PDF rompió el parseo de otro más de una vez** → regresión contra todos los fixtures antes de cada push.
- Extraer texto con `pdfjs-dist` (igual que el navegador): `content.items.map(it=>it.str).join(" ").replace(/\s+/g," ")`.
  No validar parsers con `pdfplumber` (da otro orden de texto).
- Buscar patrones de una hoja **solo en las páginas de esa hoja** (por título). Un regex global generó un "1" fantasma de SACs.
- No hay secretos en este repo y no debe haberlos. No subir PDFs ni capturas con datos de clientes.
- La tabla "Resultado comercial por asociado" y el %CCC tienen lógica especial: leer `docs/REGLAS_NEGOCIO.md` §4 antes de tocarlos.
- Los cambios "avanzados" (automatizaciones, nuevas fuentes de datos, conectores) se **proponen primero** y se implementan solo con OK de Karli.

## Comandos
`npm install` · `npm test` · `node -c app.js` · `git status` · `git push origin main`
