// Test de regresión: corre TODOS los PDFs de tests/fixtures contra el autocompletado + generación del mail.
// Uso: npm install && npm test        (o: node tests/regression.js [carpeta_de_pdfs])
// Sale con código 1 si algo falla. No hay navegador: usa jsdom + pdfjs-dist (el mismo extractor que el browser).
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const ROOT = path.join(__dirname, "..");
const FIX = process.argv[2] || path.join(__dirname, "fixtures");

async function extractPages(file) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push({ text: c.items.map((it) => it.str).join(" ").replace(/\s+/g, " ") });
  }
  return pages;
}

function makeWindow() {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), { runScripts: "outside-only", url: "http://localhost/", virtualConsole: new VirtualConsole() }); // consola muda: el app.js intenta configurar pdf.js (CDN) al cargar, acá no existe y tira un ReferenceError inocuo
  const w = dom.window;
  w.eval(fs.readFileSync(path.join(ROOT, "assets.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(ROOT, "app.js"), "utf8"));
  try { w.document.dispatchEvent(new w.Event("DOMContentLoaded")); } catch (e) {}
  return w;
}

const balanced = (h) => ["table", "tr", "td"].map((t) => {
  const o = (h.match(new RegExp("<" + t + "[ >]", "g")) || []).length;
  const c = (h.match(new RegExp("</" + t + ">", "g")) || []).length;
  return o === c ? null : `<${t}> abre ${o} / cierra ${c}`;
}).filter(Boolean);

(async () => {
  if (!fs.existsSync(FIX)) { console.log("No existe " + FIX); process.exit(1); }
  const pdfs = fs.readdirSync(FIX).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (!pdfs.length) { console.log("No hay PDFs en tests/fixtures (ver README ahí)."); process.exit(1); }
  let fails = 0;
  for (const f of pdfs) {
    const w = makeWindow();
    const pages = await extractPages(path.join(FIX, f));
    const res = w.autofillFromPages(pages);
    const state = w.readState();
    const problems = [];

    // Regresión 1: nunca un SACs "fantasma" cuando el PDF no tiene hoja de SACs
    const hasSacsPage = pages.some((p) => /sacs/i.test(p.text.slice(0, 120)));
    if (!hasSacsPage && (state.sacs.jdSol || state.sacs.env || state.sacs.apr || state.sacs.jdOtor || w.document.getElementById("sacsEnabled").checked))
      problems.push("SACs con datos pero el PDF no tiene hoja de SACs");

    // Regresión 2: las 4 combinaciones de las opciones de omitir variaciones deben dar HTML balanceado
    for (const [u, a] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      w.document.getElementById("omitVsUnidades").checked = !!u;
      w.document.getElementById("omitVsAsociados").checked = !!a;
      const html = w.buildEmailHtml(w.readState());
      const bad = balanced(html);
      if (bad.length) problems.push(`tags desbalanceados (omitUnidades=${u}, omitAsoc=${a}): ${bad.join("; ")}`);
      if (u && a && /<td[^>]*>vs [A-Za-z]{3} \d\d<\/td>/.test(html)) problems.push("quedó un texto 'vs Mes AA' con las dos opciones de omitir tildadas");
    }
    w.document.getElementById("omitVsUnidades").checked = false;
    w.document.getElementById("omitVsAsociados").checked = false;
    const html = w.buildEmailHtml(w.readState());

    // Regresión 3: tabla de asociados (solo oficinas): orden de columnas y fila TOTAL
    if (state.tipo === "oficina" && state.asociados.length) {
      const blk = html.slice(html.indexOf("Resultado comercial por asociado"));
      const hdr = ["OPERADAS", "OFRECIDAS", "% CCC", "VENDIDAS", "COMPRADAS", "SOC."].map((t) => blk.indexOf(">" + t + "</td>"));
      if (hdr.some((i) => i < 0) || hdr.some((v, i) => i && v < hdr[i - 1])) problems.push("orden de columnas de 'Resultado comercial por asociado' incorrecto (debe ser Operadas, Ofrecidas, %CCC, Vendidas, Compradas, Soc.)");
      if (!/>TOTAL<\/td>/.test(html)) problems.push("falta la fila TOTAL en la tabla de asociados");
    } else if (/Resultado comercial por asociado/.test(html)) {
      problems.push("aparece la tabla de asociados en un cierre que no es de oficina");
    }

    // Regresión 4: tarjeta "Gestión de cuentas" (CRM) solo si el PDF trae esa hoja, con los valores tal cual,
    // y se puede quitar destildando la casilla
    const crmPage = pages.find((p) => /Cuentas\s+Autogeneradas/i.test(p.text) && /Silencio\s+Comercial/i.test(p.text));
    const hasCrmCard = (h) => /Gestión de cuentas/.test(h);
    if (crmPage) {
      if (!w.document.getElementById("crmEnabled").checked || !hasCrmCard(html)) problems.push("el PDF tiene hoja de CRM pero no aparece la tarjeta de Gestión de cuentas");
      const autoMes = (crmPage.text.match(/Cuentas\s+Autogeneradas\s+([\d.,]+)/i) || [])[1];
      if (autoMes && state.crm.auto !== autoMes) problems.push(`Cuentas autogeneradas del mes: leyó "${state.crm.auto}", el PDF dice "${autoMes}"`);
      w.document.getElementById("crmEnabled").checked = false;
      if (hasCrmCard(w.buildEmailHtml(w.readState()))) problems.push("destildar la casilla de CRM no quita la tarjeta");
      w.document.getElementById("crmEnabled").checked = true;
    } else if (hasCrmCard(html) || state.crmEnabled) {
      problems.push("aparece la tarjeta de Gestión de cuentas pero el PDF no tiene hoja de CRM");
    }

    // Regresión 5: %CCC por asociado nunca como fracción ("0,79" debe quedar 79) ni mayor a 100
    state.asociados.forEach((a, i) => {
      const v = parseFloat(String(a.ccc || "").replace(",", "."));
      if (/^[01],\d+$/.test(a.ccc || "") || v > 100) problems.push(`%CCC del asociado #${i + 1} con formato raro: "${a.ccc}"`);
    });

    // Regresión 6: valores confirmados por Karli en PDFs puntuales (por parte del nombre del archivo)
    const ESPERADOS = [
      { archivo: /tandil/i, campo: "JD Solicitadas", valor: (s) => s.sacs.jdSol, esperado: "17" },
      { archivo: /bs as central/i, campo: "%CCC asociado #1", valor: (s) => (s.asociados[0] || {}).ccc, esperado: "79" },
    ];
    ESPERADOS.filter((e) => e.archivo.test(f)).forEach((e) => {
      const got = e.valor(state);
      if (got !== e.esperado) problems.push(`${e.campo}: leyó "${got}", debería ser "${e.esperado}"`);
    });

    // Regresión 7: el mail se adapta al celular (sin tablas de ancho fijo) y la foto de arriba no se deforma
    if (/<table[^>]*width="64[02]"/.test(html)) problems.push("el mail tiene una tabla de ancho fijo (640/642): en el celu se corta");
    const headerImg = (html.match(/<img[^>]*width="640"[^>]*>/) || [""])[0];
    if (/max-height/.test(headerImg)) problems.push("la foto de arriba tiene max-height: se deforma o se corta");

    const missing = (res && res.missing) || [];
    console.log(`${problems.length ? "FAIL" : "ok  "}  ${f}  [tipo=${state.tipo}, asociados=${state.asociados.length}, missing=${missing.length}]`);
    missing.forEach((m) => console.log("        missing: " + m));
    problems.forEach((p) => { console.log("        PROBLEMA: " + p); });
    if (problems.length) fails++;
  }
  console.log(fails ? `\n${fails} caso(s) con problemas` : "\nTodo OK");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
