# Generador de Cierre Mensual — dCaC

Webapp estática (sin backend) para armar el HTML del mail de cierre mensual.
Corre 100% en el navegador — no manda nada a ningún servidor.

## Cómo publicarla en GitHub Pages (una sola vez)

1. Entrá a github.com, creá un repo nuevo (puede ser público o privado si tenés plan pago). Ej: `cierre-mensual-dcac`.
2. Subí estos 4 archivos a la raíz del repo: `index.html`, `app.js`, `assets.js`, `styles.css`.
   - Más fácil: en la página del repo vacío, "uploading an existing file" → arrastrás los 4 archivos → Commit.
3. Andá a **Settings → Pages**.
4. En "Source" elegí **Deploy from a branch**, branch `main`, carpeta `/root`. Guardar.
5. Esperá 1-2 minutos. GitHub te va a dar una URL tipo `https://tu-usuario.github.io/cierre-mensual-dcac/`.
6. Listo — esa URL es tu app. La podés guardar como favorito.

Cada vez que quieras cambiar algo (colores, textos por defecto, etc.), editás el archivo en GitHub directo (lápiz ✏️ en la página del archivo) y hacés commit; se actualiza solo.

## Cómo se usa

1. **Paso 1**: nombre, tipo (oficina o asociado individual), mes/año, y los 3 links de Drive (presentación, listado de CIs, reporte).
2. **Paso 2**: tocá "Intentar leer desde el link de Drive". **Ojo**: Google Drive normalmente bloquea que una página externa lea el PDF directo (es una protección de Drive, no un bug de la app) — si falla, te va a avisar y ahí simplemente **descargás el PDF y lo subís** con el botón de abajo. Con el archivo subido a mano, la lectura funciona siempre.
3. Una vez leído, aparece el texto completo del PDF abajo — sirve para copiar valores a mano a los campos del formulario. La app intenta autocompletar algunos campos del hero, pero **siempre conviene revisar todo antes de generar**, porque el texto que se extrae de un PDF no siempre viene en el mismo orden que se ve en la diapositiva.
4. **Pasos 3 a 6**: completás los números (hero, unidades de negocio, sociedades, nuevas sociedades, SACs si aplica, y — solo para oficinas — la tabla de asociados).
5. **Paso 7**: los comentarios que nunca salen del PDF — Producción, SACs pendientes, CIs habilitadas, Mermas, Variación de ofrecimientos, No concretadas, y Resumen del mes. Cualquier caja que dejes vacía, simplemente no aparece en el mail (no genera bloques vacíos).
6. Tocás **Generar HTML** → aparece la vista previa a la derecha, igual a como se ve el mail.
7. **Copiar HTML** lo manda al portapapeles (para pegar directo en el editor del mailing), o **Descargar .html** te da el archivo.

## Por qué no lee el PDF 100% solo

Para leer un PDF automáticamente y que la interpretación sea confiable (entender qué número corresponde a qué campo, aplicar los umbrales de color, etc.) hace falta algo con criterio — hoy eso lo hace Claude a mano. Una webapp puramente estática (sin backend) puede *extraer el texto* del PDF con la librería `pdf.js`, pero no puede *interpretarlo* con la misma confiabilidad: el texto de un PDF exportado no siempre sale en el mismo orden que se ve visualmente, así que un autocompletado 100% automático corre el riesgo de mezclar números entre secciones sin que se note a simple vista — arriesgado para un mail que se manda a asociados.

Por eso esta versión prioriza confiabilidad: lee el texto y ayuda a ubicarlo, pero la carga final de los números la hace la persona, revisando contra el PDF. Si en algún momento quieren un parseo más automático y confiable, la forma correcta es agregar un backend chiquito (ej. una función serverless) que le pase el PDF a un modelo con capacidad de leer PDFs — eso ya no entra en "solo GitHub Pages sin backend", así que lo dejamos para una v2 si hace falta.

## Estructura de archivos

- `index.html` — la página y el formulario.
- `styles.css` — estilos.
- `app.js` — toda la lógica: lectura de PDF, formulario, generación del HTML del mail.
- `assets.js` — el logo y el fondo del header de dCaC en base64 (se usan tal cual salen del template oficial, no tocar a mano).
