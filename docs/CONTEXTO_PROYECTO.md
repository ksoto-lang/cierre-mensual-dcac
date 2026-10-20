# Generador de Cierre Mensual — dCaC (deCampoaCampo) · Contexto del proyecto

Actualizado al 20/10/2026 (incluye todos los cambios hasta la entrega `2026-10-09c`). Para retomar el trabajo en Claude Code.
Complementos: `../CLAUDE.md` (reglas operativas) · `REGLAS_NEGOCIO.md` · `HISTORIAL_CAMBIOS.md` · `PENDIENTES.md`.

## 1. Qué es
Webapp estática (sin backend, sin build, GitHub Pages) que arma el HTML del mail **"Cierre Mensual"** que dCaC envía cada mes a
oficinas, asociados comerciales y representantes. Antes se armaba a mano leyendo un PDF exportado de Metabase/Power BI.
Usuaria: **Karli** (desarrolladora comercial de dCaC). No es programadora: usa el formulario, copia el HTML generado y lo pega
en el editor de Gmail. Todo el código lo toca Claude.

Hay además un **Proyecto de claude.ai** ("Mail cierres mensuales ACs, Oficinas y representantes") con la versión *manual* del
mismo trabajo (Claude arma el HTML a partir del PDF siguiendo una plantilla `diseno_entre_rios_*.html` y
`reglas_extraccion_mail_cierre.md`). La webapp es la automatización de ese flujo. Nota: las instrucciones del Proyecto nombran
`diseno_entre_rios_junio2026_v6.html` pero los documentos del Proyecto son la `…julio2026_v7.html` — sin reconciliar (ver PENDIENTES).

## 2. Arquitectura
- 4 archivos en la raíz: `index.html` (UI), `app.js` (toda la lógica), `styles.css` (estilos de la webapp, NO del mail), `assets.js`
  (`window.DCAC_ASSETS` con logo y foto de header en base64 — no editar a mano).
- Única dependencia externa: `pdf.js` desde cdnjs, para leer el PDF en el navegador.
- Persistencia solo en `localStorage` (por navegador/PC, no se comparte): `dcac_cierre_drafts_v1` (borradores),
  `dcac_cierre_autosave_v1` (autoguardado), `dcac_cuit_directory_v1` (directorio sociedad→CUIT), `dcac_default_header_image_v1` (imagen de header "de siempre").
- Funciones clave de `app.js`: `autofillFromPages(pages)` (orquesta los parsers según el título de cada página), `readState()` / `restoreState()`
  (serializan el formulario completo), `buildEmailHtml(state)` (genera el mail), `renderAsociadoRow()` (fila del paso 6),
  parsers `parseResultadoComercialOficina`, `parseCabezasOperadasPage`, `parseUnitOwnPage`, `parseSociedadesOperandoPage`,
  `parseNuevasSociedadesPage`, `parseSacsPage`, `sumJdPedidasFromDetailTable`, `parseComportamientoCIsPage`, `parseLabeledGroup`.

## 3. Flujo de uso
1. Karli sube el PDF (leer directo desde Drive casi siempre falla por CORS → siempre es "subir manualmente").
2. La app extrae el texto por página y los parsers completan el formulario (hero, unidades de negocio, sociedades, nuevas sociedades, SACs, asociados).
3. Karli completa lo que no sale del PDF: recuadros de comentarios (Producción, Mermas, Resumen del mes, etc.), links de Drive.
4. "Generar HTML" → copia → pega en el mail.

## 4. Estructura del mail generado (de arriba hacia abajo)
Header (imagen + logo + "Cierre Mensual" + nombre + píldora de fecha) → Hero (Cabezas operadas + tags vs año anterior / vs target; recuadros
Rendimiento y % CCC — **Rendimiento se oculta para representantes**) → Actividad por unidad de negocio (Categoría, **Operadas, Ofrecidas, CCC %,
Vendidas, Compradas, Rendim.**; filas Cría/Faena/Invernada/MAG según existan + fila total) → tarjetas Sociedades Operando / Nuevas Sociedades / SACs (SACs solo si hay
hoja de SACs) → tarjeta **Gestión de cuentas** (CRM, solo si hay hoja de CRM) → **Resultado comercial por asociado** (solo oficinas; columnas **Asociado, Operadas, Ofrecidas, %CCC, Vendidas, Compradas, Soc.** + fila **TOTAL**) →
recuadros dinámicos → footer (botón "Ver reporte completo", tarjetas Pulso Comercial y Vademécum).

## 5. Lecciones de los parsers del PDF (lo más delicado)
- Existen dos formatos de tabla: "agrupado" (etiquetas, luego valores, luego deltas) e "interlineado" (etiqueta+valor+delta repetidos). `parseLabeledGroup()` prueba ambos.
- Guion normal `-` o largo `–` en los títulos. "Cria" a veces sin tilde.
- El título repite el nombre del campo ("… – Cabezas Operadas"): cortar el texto después del título (`stripTitle()`) antes de buscar.
- MAG a veces trae solo 2 tarjetas (Operadas + Soc Vendedoras): tolerar campos faltantes.
- "Resultado Comercial" de oficina puede **paginarse en varias hojas con el mismo título**: concatenar TODAS (antes solo tomaba la primera → máximo 3 asociados) y deduplicar por nombre normalizado.
- Preservar el signo de las variaciones (`cleanNum()`); quitarlo solo al mostrar (`varSmall()`).
- Buscar cada patrón solo en las páginas que corresponden por título (el "1" fantasma de SACs vino de un regex global).
- Extraer siempre con `pdfjs-dist` (no `pdfplumber`): el orden del texto cambia según la librería.

## 6. Header del mail — no volver a complicarlo
Gmail elimina `background-image` con base64 y rompe `position:absolute` al pegar en el editor. Solución final (3ª iteración): `<img>` normal
de ancho completo + bloque debajo en flujo normal (logo centrado, "Cierre Mensual", nombre, píldora de fecha). Nada de CSS posicional.

## 7. Funcionalidades ya construidas
Autocompletado del PDF · tipos de cierre (Asociado / Representante / Oficina) · periodicidad (Mensual / Trimestral / Cuatrimestral: cambia el texto "vs Sep 25"
por "vs mismo período 25'") · recuadros dinámicos ilimitados (título, ícono, 5 colores, texto libre: línea terminada en ":" = subtítulo, "- " = viñeta, link/botón opcional;
recuadro **"CIs habilitadas" opcional** con botón propio que precarga texto y toma el link de "listado CIs") · directorio sociedad→CUIT que autolinkea a
`vademecum.dcac.ar/?cuit=…` · borradores + autoguardado · imagen de header propia y "guardar como la de siempre" · indicadores "✓ completo" por paso ·
fila "Total−resto" por asociado (para quien funciona como oficina, ej. Alan García) · fila TOTAL en la tabla de asociados · opciones de **omitir variaciones vs año anterior**
(casillas separadas para "Actividad por unidad de negocio" y "Resultado comercial por asociado"; ocultan flecha, % y texto; no tocan "vs target", hero ni Sociedades).

## 7b. Datos de contexto del negocio
Vocabulario: mermas = cuentas perdidas · SACs = solicitudes de crédito · JD = líneas de crédito otorgadas (Otorgadas / Solicitadas-Pedidas) · CCC = concreción ·
Faena/Invernada/Cría/MAG = las 4 unidades de negocio · "tropas" = lotes de hacienda (dato todavía sin fuente, ver PENDIENTES).

## 8. Cómo probar
`npm install` y `npm test` (ver `tests/regression.js`). Requiere los 4 PDFs de referencia en `tests/fixtures/` (no versionados): asociado individual (Jose Olmedo),
oficinas Ayacucho y Pringles, representante Santiago Bunge. El test valida: tags `<table>/<tr>/<td>` balanceados (4 combinaciones de las casillas de omitir),
sin SACs fantasma, orden de columnas de la tabla de asociados, fila TOTAL presente. Si aparece un PDF con formato raro: agregarlo a fixtures y sumar su caso.

## 9. Deploy
GitHub Pages, rama `main`, raíz. Con Claude Code: commit + `git push origin main` (ver `CLAUDE.md`). Si "no toma los cambios": hard refresh / incógnito antes de asumir que el código está mal.

## 10. Preferencias de trabajo de Karli
Todo en español. Prefiere que se actúe cuando el contexto es claro (sin preguntar de más), pero que se pregunte ante datos ambiguos en vez de inventar. Trabaja de forma iterativa
con correcciones sobre la marcha: al corregir algo, actualizar todo lo dependiente (formulario + mail + test + docs). Siempre decir qué archivos cambiaron. Entregar archivos sueltos, no zips.
