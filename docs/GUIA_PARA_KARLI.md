# Guía para Karli — pasar el proyecto a Claude Code con push automático a GitHub

Objetivo: que Claude Code trabaje directo sobre el repo, corra las pruebas y haga el push a GitHub por vos, así dejás de copiar y pegar archivos en la web de GitHub.
(Los pasos de instalación pueden cambiar; ante cualquier diferencia, mandan las instrucciones actuales en https://docs.claude.com.)

## Paso 0 — Qué tenés que tener a mano
- El link del repo de GitHub donde está publicada la webapp (`https://github.com/<USUARIO>/<REPO>`) y un usuario con permiso de escritura.
- Los 4 PDFs de prueba (Jose Olmedo, Oficina Ayacucho, Santiago Bunge, Oficina Pringles). **No se suben a GitHub**: quedan solo en tu compu en `tests/fixtures/`.

## Paso 1 — Dejar el repo con estos archivos (una sola vez)
Subí al repo (podés arrastrarlos en la web de GitHub: "Add file → Upload files"), respetando carpetas:
`CLAUDE.md`, `package.json`, `.gitignore`, `.claude/settings.json`, `docs/` (los 5 .md), `tests/regression.js`, `tests/fixtures/README.md`.
`index.html`, `app.js`, `styles.css` y `assets.js` ya están en el repo; la versión incluida acá es la última entregada (09/10, "c"). Si no la subiste todavía, reemplazá esas dos: `app.js` e `index.html`.

## Paso 2 — Abrir Claude Code sobre el repo
Elegí UNA de estas opciones:
- **A. Claude Code en la app de escritorio / web:** abrí una sesión nueva, conectá GitHub (te pide autorizar la app de Claude en tu cuenta) y elegí el repo `<REPO>`. Claude trabaja en una copia del repo y hace los commits/push por vos.
- **B. Claude Code en tu terminal:** instalá Claude Code (instrucciones oficiales en docs.claude.com), abrí la terminal, `git clone https://github.com/<USUARIO>/<REPO>.git`, `cd <REPO>` y ejecutá `claude`. El primer `git push` te pide iniciar sesión en GitHub (o configurar una clave SSH / `gh auth login`).

Con cualquiera de las dos, Claude lee solo `CLAUDE.md` y `.claude/settings.json` al arrancar: ahí están las reglas, los comandos permitidos (git add/commit/push, node, npm test) y los bloqueos (no force-push, no reset --hard, no subir los PDFs).

## Paso 3 — Poner los PDFs de prueba
Copiá los 4 PDFs en la carpeta `tests/fixtures/` de tu copia local (en la opción A, subilos en la conversación y pedile a Claude que los deje ahí, sin commitearlos). Después: `npm install` y `npm test` → debe decir "Todo OK".

## Paso 4 — Primer mensaje para Claude Code (copiá y pegá)
> Leé `CLAUDE.md` y todo `docs/`. Corré `npm install` y `npm test` para confirmar que todo está verde y decime el resultado. No cambies nada todavía. Después resumime en 10 líneas cómo vas a trabajar (cómo probás, cuándo hacés push a main y cuándo a una rama) y cuáles son los pendientes abiertos de `docs/PENDIENTES.md`, en orden de prioridad.

## Cómo se trabaja a partir de ahí
1. Le pedís el cambio en español, como hasta ahora (podés adjuntar capturas/PDFs).
2. Claude modifica, corre `npm test`, y te cuenta en pocas líneas qué cambió.
3. Cuando vos lo aprobás ("dale", "pusheá"), hace commit + push a `main`; en 1-2 minutos GitHub Pages lo publica (hard refresh con Ctrl+F5 si no lo ves).
   Para cambios grandes (parsers, estructura del mail) primero sube a una rama para que lo pruebes.
4. Si algo salió mal: "revertí el último cambio" → `git revert` + push. No se pierde nada.
5. Los cambios avanzados (automatizaciones, lectura directa desde Drive, mail como borrador de Gmail, etc.) están listados como ideas en `docs/PENDIENTES.md` §6: Claude te los propone y se hacen solo si los aprobás.

## Cuidado con
- **No subir PDFs ni capturas con datos de clientes al repo** (si el repo es público, es público para todos). El `.gitignore` ya bloquea `tests/fixtures/*.pdf`.
- Tu borrador, el directorio de sociedades y la imagen de header "de siempre" viven en el `localStorage` de cada navegador: no se pierden por hacer un push, pero tampoco se comparten entre compus.
- Datos que Claude no tiene (ej. "tropas operadas", "No concretadas" por comercial): te los va a pedir en vez de inventarlos.
