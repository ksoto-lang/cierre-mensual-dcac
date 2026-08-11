// ============================================================================
// Generador de Cierre Mensual — dCaC
// Todo corre en el navegador. No hay backend: los links de Drive y el PDF
// se procesan localmente (o se descargan directo desde Drive si el CORS lo
// permite; si no, hay que subir el PDF a mano — ver panel "2. Leer el PDF").
// ============================================================================

let lastGeneratedHtml = "";

// ---- arranque -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("headerLogo").src = "data:image/png;base64," + window.DCAC_ASSETS.logo;

  renderUnidades();
  renderAsociadoRow(); // arranca con una fila vacía
  renderRecuadros(DEFAULT_RECUADROS); // arranca con 4 recuadros de ejemplo, editables/borrables

  document.getElementById("tipo").addEventListener("change", onTipoChange);
  document.getElementById("sacsEnabled").addEventListener("change", (e) => {
    document.getElementById("sacsFields").style.display = e.target.checked ? "block" : "none";
  });
  document.getElementById("btnAddAsociado").addEventListener("click", () => renderAsociadoRow());
  document.getElementById("btnAddRecuadro").addEventListener("click", () => addRecuadroCard());
  document.getElementById("btnReadDrive").addEventListener("click", readFromDriveLink);
  document.getElementById("filePdf").addEventListener("change", (e) => {
    if (e.target.files[0]) readPdfFile(e.target.files[0]);
  });
  document.getElementById("btnGenerate").addEventListener("click", onGenerate);
  document.getElementById("btnCopy").addEventListener("click", onCopy);
  document.getElementById("btnDownload").addEventListener("click", onDownload);

  onTipoChange();

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
});

function onTipoChange() {
  const tipo = document.getElementById("tipo").value;
  document.getElementById("asociadosStep").style.display = tipo === "oficina" ? "block" : "none";
}

// ---- unidades de negocio ----------------------------------------------------
const UNIDADES = [
  { key: "cria", label: "Cría", color: "#E8B93E" },
  { key: "faena", label: "Faena", color: "#6FA8DC" },
  { key: "invernada", label: "Invernada", color: "#8B1E1E" },
  { key: "mag", label: "MAG", color: "#2E7D32" },
];

function renderUnidades() {
  const wrap = document.getElementById("unidadesWrap");
  wrap.innerHTML = UNIDADES.map((u) => `
    <div class="unit-grid" id="unit_${u.key}">
      <h4><span style="display:inline-block;width:9px;height:9px;background:${u.color};border-radius:2px;margin-right:6px;"></span>${u.label}</h4>
      <div style="grid-column:1/-1;" class="checkbox-row">
        <input type="checkbox" id="${u.key}_sin"> <label style="margin:0;text-transform:none;font-weight:600;">Sin actividad este mes (no había diapositiva)</label>
      </div>
      <div><label>Operadas</label><input type="text" id="${u.key}_operadas"></div>
      <div><label>Var. operadas (%)</label><input type="text" id="${u.key}_opVar" placeholder="ej: 73 (dejar vacío = sin dato)"></div>
      <div><label>Ofrecidas</label><input type="text" id="${u.key}_ofrecidas"></div>
      <div><label>Var. ofrecidas (%)</label><input type="text" id="${u.key}_ofVar"></div>
      <div><label>% CCC</label><input type="text" id="${u.key}_ccc" placeholder="-- si no aplica"></div>
      <div><label>Vendidas</label><input type="text" id="${u.key}_vendidas"></div>
      <div><label>Compradas</label><input type="text" id="${u.key}_compradas" placeholder="-- si no compra"></div>
    </div>
  `).join("");

  UNIDADES.forEach((u) => {
    document.getElementById(`${u.key}_sin`).addEventListener("change", (e) => {
      const disabled = e.target.checked;
      ["operadas", "opVar", "ofrecidas", "ofVar", "ccc", "vendidas", "compradas"].forEach((f) => {
        document.getElementById(`${u.key}_${f}`).disabled = disabled;
      });
    });
  });
}

// ---- fila de asociado (solo oficinas) --------------------------------------
function renderAsociadoRow() {
  const wrap = document.getElementById("asociadosWrap");
  const row = document.createElement("div");
  row.className = "assoc-row";
  row.innerHTML = `
    <input type="text" placeholder="Nombre" class="a_nombre">
    <input type="text" placeholder="Ofrecidas" class="a_ofrecidas">
    <input type="text" placeholder="Operadas" class="a_operadas">
    <input type="text" placeholder="% CCC" class="a_ccc">
    <input type="text" placeholder="Soc." class="a_soc">
    <button class="btn-danger" type="button" title="Quitar">✕</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  wrap.appendChild(row);
}

// ---- recuadros dinámicos (Producción, CIs, Mermas, Resumen del mes, etc.) --
const RECUADRO_COLORS = {
  teal: { label: "Verde azulado", bg: "#EAF6F4", border: "#1F8A7A", title: "#136B5E", text: "#2C3E50", btnBg: "#1F8A7A" },
  blue: { label: "Azul", bg: "#EAF2FB", border: "#2E6DA4", title: "#1B4F8C", text: "#2C3E50", btnBg: "#2E6DA4" },
  amber: { label: "Ámbar", bg: "#FDF6E3", border: "#B9770E", title: "#8A5A12", text: "#2C3E50", btnBg: "#B9770E" },
  green: { label: "Verde", bg: "#EAF7EE", border: "#1E8449", title: "#145C33", text: "#2C3E50", btnBg: "#1E8449" },
  dark: { label: "Oscuro (navy)", bg: "#152C42", border: null, title: "#8FB8DD", text: "#ffffff", btnBg: "#2E6DA4" },
};

const DEFAULT_RECUADROS = [
  { titulo: "Producción", icono: "📋", color: "teal", link: "", linkTexto: "",
    contenido: "SACs pendientes:\n- Agro Mauro SRL" },
  { titulo: "CIs habilitadas", icono: "✅", color: "blue", link: "", linkTexto: "⬇️  Listado de Socs con CI habilitadas",
    contenido: "Corroborar que las sociedades con CIs habilitadas tengan una buena interacción con las mismas. Y además, revisar aquellas que habría que desactivar del listado de abajo." },
  { titulo: "Novedades del mes", icono: "📊", color: "amber", link: "", linkTexto: "",
    contenido: "Mermas:\n- \nVariación de ofrecimientos:\n- \nNo concretadas de faena:\n- \nNo concretadas de invernada:\n- " },
  { titulo: "Resumen del mes", icono: "★", color: "dark", link: "", linkTexto: "",
    contenido: "" },
];

function renderRecuadros(list) {
  const wrap = document.getElementById("recuadrosWrap");
  wrap.innerHTML = "";
  list.forEach((r) => addRecuadroCard(r));
}

function addRecuadroCard(data) {
  data = data || { titulo: "", icono: "", color: "teal", contenido: "", link: "", linkTexto: "" };
  const wrap = document.getElementById("recuadrosWrap");
  const card = document.createElement("div");
  card.className = "recuadro-card";
  const colorOptions = Object.entries(RECUADRO_COLORS)
    .map(([k, v]) => `<option value="${k}" ${data.color === k ? "selected" : ""}>${v.label}</option>`).join("");
  card.innerHTML = `
    <div class="recuadro-top">
      <span class="recuadro-handle" title="Subir (click) / Bajar (shift+click)">⠿</span>
      <input type="text" class="r_icono recuadro-icon" placeholder="📋" value="${escapeAttr(data.icono || "")}">
      <input type="text" class="r_titulo" placeholder="Título del recuadro (ej: Producción)" value="${escapeAttr(data.titulo || "")}">
      <select class="r_color recuadro-color">${colorOptions}</select>
      <button type="button" class="btn-remove-recuadro" title="Quitar recuadro">✕</button>
    </div>
    <textarea class="r_contenido" placeholder="Texto libre. Una línea que termina en ':' es subtítulo. Una línea con '- ' es viñeta.">${escapeHtml(data.contenido || "")}</textarea>
    <div class="recuadro-link-row">
      <input type="url" class="r_link" placeholder="Link opcional (botón al pie del recuadro)" value="${escapeAttr(data.link || "")}">
      <input type="text" class="r_linkTexto" placeholder="Texto del botón" value="${escapeAttr(data.linkTexto || "")}" style="max-width:220px;">
    </div>
  `;
  card.querySelector(".btn-remove-recuadro").addEventListener("click", () => card.remove());
  const handle = card.querySelector(".recuadro-handle");
  wrap.appendChild(card);

  // reordenar: click en el handle sube una posición, shift+click baja una posición
  handle.addEventListener("click", (e) => {
    if (e.shiftKey) {
      const next = card.nextElementSibling;
      if (next) wrap.insertBefore(next, card);
    } else {
      const prev = card.previousElementSibling;
      if (prev) wrap.insertBefore(card, prev);
    }
  });
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function readRecuadros() {
  return Array.from(document.querySelectorAll("#recuadrosWrap .recuadro-card")).map((card) => ({
    titulo: card.querySelector(".r_titulo").value.trim(),
    icono: card.querySelector(".r_icono").value.trim(),
    color: card.querySelector(".r_color").value,
    contenido: card.querySelector(".r_contenido").value,
    link: card.querySelector(".r_link").value.trim(),
    linkTexto: card.querySelector(".r_linkTexto").value.trim(),
  })).filter((r) => r.titulo || r.contenido.trim());
}

// Convierte texto libre a HTML: "Algo:" -> subtítulo en negrita; "- item" -> viñeta; resto -> texto corrido.
function contentToHtml(text) {
  const lines = String(text || "").split("\n");
  let html = "";
  let inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) { closeList(); return; }
    if (line.startsWith("- ")) {
      if (!inList) { html += `<ul style="margin:6px 0 10px 18px;padding:0;">`; inList = true; }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
    } else if (line.endsWith(":")) {
      closeList();
      html += `<b>${escapeHtml(line)}</b><br>`;
    } else {
      closeList();
      html += `${escapeHtml(line)}<br>`;
    }
  });
  closeList();
  return html;
}

function buildRecuadroBlock(r) {
  const c = RECUADRO_COLORS[r.color] || RECUADRO_COLORS.teal;
  const borderStyle = c.border ? `border-left:4px solid ${c.border};` : "";
  const link = r.link ? (driveIdFromLink(r.link) ? driveExportXlsx(r.link) : r.link) : "";
  return `<tr><td style="padding:16px 28px 4px 28px;">
<table role="presentation" width="100%"><tr><td style="background-color:${c.bg};${borderStyle}border-radius:10px;padding:16px 18px;">
${r.titulo ? `<div style="color:${c.title};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;">${r.icono ? escapeHtml(r.icono) + " " : ""}${escapeHtml(r.titulo)}</div>` : ""}
<div style="font-size:${r.color === "dark" ? "14" : "13"}px;color:${c.text};margin-top:9px;line-height:${r.color === "dark" ? "1.65" : "1.6"};">
${contentToHtml(r.contenido)}
</div>
${link ? `<a href="${link}" target="_blank" style="display:block;text-align:center;background-color:${c.btnBg};color:#ffffff;text-decoration:none;font-size:12px;font-weight:bold;padding:10px 0;border-radius:9px;margin-top:12px;">${escapeHtml(r.linkTexto || "Ver más")}</a>` : ""}
</td></tr></table>
</td></tr>`;
}

// ---- lectura de PDF ---------------------------------------------------------
function driveIdFromLink(link) {
  if (!link) return null;
  const m = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function setPdfStatus(msg, type) {
  const el = document.getElementById("pdfStatus");
  el.innerHTML = `<div class="status-box status-${type}">${msg}</div>`;
}

async function readFromDriveLink() {
  const link = document.getElementById("linkPdf").value.trim();
  const id = driveIdFromLink(link);
  if (!id) {
    setPdfStatus("No pude reconocer el ID del archivo en ese link de Drive.", "err");
    return;
  }
  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  setPdfStatus("Intentando leer el PDF directo desde Drive...", "warn");
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = await res.arrayBuffer();
    await parsePdfBuffer(buf);
  } catch (err) {
    setPdfStatus(
      `No se pudo leer directo desde Drive (esto es normal: Drive suele bloquear la lectura entre dominios). ` +
      `Descargá el PDF y subilo con el botón de abajo — con eso siempre funciona.<br><small>Detalle técnico: ${err.message}</small>`,
      "err"
    );
  }
}

async function readPdfFile(file) {
  setPdfStatus("Leyendo " + file.name + "...", "warn");
  const buf = await file.arrayBuffer();
  await parsePdfBuffer(buf);
}

async function parsePdfBuffer(buf) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it) => it.str).join(" ").replace(/\s+/g, " ");
      pages.push({ num: i, text });
    }
    document.getElementById("pdfPagesWrap").style.display = "block";
    document.getElementById("pdfPagesText").textContent =
      pages.map((p) => `--- Página ${p.num} ---\n${p.text}`).join("\n\n");

    const report = autofillFromPages(pages);
    setPdfStatus(
      `Leídas ${pdf.numPages} páginas. Completé automáticamente: ${report.filled.join(", ") || "nada reconocible"}.` +
      (report.missing.length ? `<br>No encontré datos para: ${report.missing.join(", ")} — completalos a mano.` : "") +
      `<br><b>Revisá los valores antes de generar</b> — es un parseo por texto, puede fallar si cambió el formato del PDF.`,
      report.filled.length ? "ok" : "warn"
    );
  } catch (err) {
    setPdfStatus("No pude procesar ese PDF: " + err.message, "err");
  }
}

// ---- parsers específicos por tipo de diapositiva ---------------------------
// El PDF sale siempre del mismo dashboard (Metabase), pero el orden del texto
// puede venir en dos formatos según el reporte:
//  (a) "agrupado":     Label1 Label2 Label3 ... valor1 valor2 valor3 ... delta1 delta2 delta3 ...
//  (b) "entrelazado":  Label1 valor1 delta1 Label2 valor2 delta2 ...
// Estos parsers prueban los dos formatos, en ese orden.

function cleanNum(s) {
  if (s === undefined || s === null) return "";
  return s.replace(/\s+/g, "").replace("%", "").replace("p.p.", "");
}
function isDash(s) { return (s || "").trim() === "--"; }
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
// Corta el texto justo después del título de la diapositiva (para que la
// etiqueta del título, ej. "- Cabezas Operadas", no se confunda con el
// campo de datos del mismo nombre más adelante en la página).
function stripTitle(text, titleLabel) {
  const m = text.match(new RegExp("[-–—]\\s?" + escapeRegex(titleLabel) + "\\b"));
  return m ? text.slice(m.index + m[0].length) : text;
}
function signOf(deltaStr) {
  return deltaStr && deltaStr.trim().startsWith("-") ? "neg" : "pos";
}
function valOf(deltaStr) {
  if (!deltaStr || isDash(deltaStr)) return "";
  return cleanNum(deltaStr.replace(/^[+-]/, ""));
}

// Valor (+delta si está pegado) inmediatamente después de un label, para formato "entrelazado".
function afterLabelValue(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length);
  const m = after.match(/^\s*(--|[\d.,]+)\s*%?\s*((?:[+-][\d.,]+\s*%?\s*(?:p\.p\.)?)|--)?\s*(?:↗|↘|→)?/);
  if (!m) return null;
  return { value: m[1].trim(), delta: (m[2] || "").trim() };
}

// Parser genérico de un grupo de métricas con etiquetas conocidas.
// Devuelve { "Label": {value, delta}, ... } o null si no encontró nada usable.
function parseLabeledGroup(text, labels) {
  // 1) intento formato entrelazado
  const inter = {};
  let hits = 0;
  labels.forEach((label) => {
    const r = afterLabelValue(text, label);
    if (r) { inter[label] = r; hits++; }
  });
  if (hits >= Math.max(1, labels.length - 1)) return inter;

  // 2) intento formato agrupado
  const headerRe = new RegExp(labels.map(escapeRegex).join("\\s+"));
  const headerM = text.match(headerRe);
  if (!headerM) return hits ? inter : null;
  const after = text.slice(headerM.index + headerM[0].length);
  const valuesRe = new RegExp("^\\s*" + labels.map(() => "(--|[\\d.,]+)\\s*%?").join("\\s+"));
  const valuesM = after.match(valuesRe);
  if (!valuesM) return hits ? inter : null;
  const afterValues = after.slice(valuesM.index + valuesM[0].length);
  const deltaToken = "(--|[+-][\\d.,]+\\s*%?\\s*(?:p\\.p\\.)?)\\s*(?:↗|↘|→)?";
  const deltasRe = new RegExp("^\\s*" + labels.map(() => deltaToken).join("\\s+"));
  const deltasM = afterValues.match(deltasRe);
  const grouped = {};
  labels.forEach((label, i) => {
    grouped[label] = { value: (valuesM[i + 1] || "").trim(), delta: deltasM ? (deltasM[i + 1] || "").trim() : "" };
  });
  return grouped;
}

// "{Nombre} - Resultado Comercial" -> hero completo + sociedades operando totales (asociado individual)
function parseResultadoComercial(text) {
  const m = text.match(
    /([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s?%\s+([\d.,]+)\s?%\s+([\d.,]+)\s*Cab\.\s*Operadas\s*Soc\.\s*Operando/
  );
  const deltasM = text.match(
    /((?:[+-][\d.,]+%?\s*(?:p\.p\.)?\s*(?:↗|↘|→)\s*){8,10})/
  );
  if (!m) return null;
  const deltas = deltasM
    ? (deltasM[1].match(/[+-][\d.,]+%?\s*(?:p\.p\.)?/g) || []).map((s) => s.trim())
    : [];
  return {
    ofrecidas: m[1], operadas: m[2], target: m[3], vendidas: m[4], compradas: m[5],
    ccc: m[6], rendim: m[7], socOperando: m[8],
    deltas, // [ofrecidas,operadas,target,vendidas,compradas,ccc,rendim,socOperando,operadasYTD,socOperandoYTD]
  };
}

// "{Nombre} - Cabezas Operadas" -> total + desglose Faena/Invernada (venta/compra/rendim/ccc)
function parseCabezasOperadasPage(text) {
  const out = { total: null, units: {}, faena: {}, invernada: {} }; // faena/invernada quedan por compat. hacia atrás
  const totalLabels = ["Cabezas Ofrecidas", "Cabezas Vendidas", "Cabezas Compradas", "Cabezas Operadas", "Rendimiento", "%CCC"];
  const bodyText = stripTitle(text, "Cabezas Operadas");
  const totalG = parseLabeledGroup(bodyText, totalLabels);
  if (totalG) {
    out.total = {
      ofrecidas: totalG["Cabezas Ofrecidas"], vendidas: totalG["Cabezas Vendidas"],
      compradas: totalG["Cabezas Compradas"], operadas: totalG["Cabezas Operadas"],
      rendim: totalG["Rendimiento"], ccc: totalG["%CCC"],
    };
  }

  // Intento 1: formato con la etiqueta de la unidad AL FINAL del bloque de valores
  // (ej: "73 +66% ↗ -- -- 5,6 % +0,7 p.p. ↗ 65 % +18 p.p. ↗ Cria")
  const trailing = parseCabezasOperadasBreakdownTrailingLabel(text);
  if (Object.keys(trailing).length) {
    out.units = trailing;
    out.faena = trailing.faena || {};
    out.invernada = trailing.invernada || {};
    return out;
  }

  // Intento 2 (fallback): formato "Faena Invernada" con la etiqueta en el medio
  // (ej: "271 186 Cab. Venta +73% ↗ --")
  const breakdownIdx = text.indexOf("Faena Invernada");
  const breakdownText = breakdownIdx !== -1 ? text.slice(breakdownIdx) : text;
  ["Cab. Venta", "Cab. Compra", "Rendim", "%CCC"].forEach((label) => {
    const vals = pairBefore(breakdownText, label);
    const deltas = pairAfter(breakdownText, label);
    if (!vals) return;
    const key = label === "Cab. Venta" ? "venta" : label === "Cab. Compra" ? "compra" : label === "Rendim" ? "rendim" : "ccc";
    out.faena[key] = { val: vals[0], delta: deltas ? deltas[0] : "" };
    out.invernada[key] = { val: vals[1], delta: deltas ? deltas[1] : "" };
  });
  out.units = { faena: out.faena, invernada: out.invernada };
  return out;
}

// Variante donde, por cada unidad, el nombre de la unidad aparece AL FINAL del
// bloque de valores (venta/compra/rendim/ccc), en vez de en un header aparte.
// Ej: "73 +66% ↗ -- -- 5,6 % +0,7 p.p. ↗ 65 % +18 p.p. ↗ Cria"
function parseCabezasOperadasBreakdownTrailingLabel(text) {
  const num = "(--|[\\d.,]+)";
  const pct = "(--|[+-][\\d.,]+%?)\\s*(?:↗|↘|→)?";
  const pp = "(--|[+-][\\d.,]+\\s*p\\.p\\.)\\s*(?:↗|↘|→)?";
  const re = new RegExp(
    num + "\\s*" + pct + "\\s*" +
    num + "\\s*" + pct + "\\s*" +
    num + "\\s*%\\s*" + pp + "\\s*" +
    num + "\\s*%\\s*" + pp + "\\s*" +
    "(Cria|Cría|Faena|Invernada|MAG)\\b",
    "g"
  );
  const out = {};
  let m;
  while ((m = re.exec(text)) !== null) {
    const label = m[9];
    const key = label === "Cria" || label === "Cría" ? "cria" : label.toLowerCase();
    out[key] = {
      venta: { val: m[1], delta: m[2] },
      compra: { val: m[3], delta: m[4] },
      rendim: { val: m[5], delta: m[6] },
      ccc: { val: m[7], delta: m[8] },
    };
  }
  return out;
}

// Busca "labelText" en el string y devuelve [tokenAntes1, tokenAntes2] inmediatamente anteriores (formato agrupado).
function pairBefore(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const before = text.slice(0, idx);
  const m = before.match(/(--|[\d.,]+\s?%?)\s+(--|[\d.,]+\s?%?)\s*$/);
  return m ? [m[1].trim(), m[2].trim()] : null;
}
// Busca "labelText" y devuelve las 2 variaciones (con signo) inmediatamente posteriores (formato agrupado).
function pairAfter(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length);
  const m = after.match(/(--|[+\-][\d.,]+\s?(?:%|p\.p\.))\s*(?:↗|↘|→)?\s*(--|[+\-][\d.,]+\s?(?:%|p\.p\.))\s*(?:↗|↘|→)?/);
  return m ? [m[1].trim(), m[2].trim()] : null;
}

// "{Nombre} - Sociedades Operando" -> totales mes/YTD
function parseSociedadesOperandoPage(text) {
  const labels = ["Sociedades Operando", "Sociedades Vendedoras", "Sociedades Compradoras", "Sociedades Operando YTD"];
  const bodyText = stripTitle(text, "Sociedades Operando");
  const g = parseLabeledGroup(bodyText, labels);
  if (!g || !g["Sociedades Operando"]) return null;
  return {
    mes: g["Sociedades Operando"].value,
    vendedoras: g["Sociedades Vendedoras"] ? g["Sociedades Vendedoras"].value : "",
    compradoras: g["Sociedades Compradoras"] ? g["Sociedades Compradoras"].value : "",
    ytd: g["Sociedades Operando YTD"] ? g["Sociedades Operando YTD"].value : "",
    mesDelta: g["Sociedades Operando"].delta,
    ytdDelta: g["Sociedades Operando YTD"] ? g["Sociedades Operando YTD"].delta : "",
  };
}

// Diapositiva propia de una unidad de negocio: "{Nombre} - Faena" / "- Invernada" / "- Cría" / "- MAG"
function parseUnitOwnPage(text) {
  const labels = ["Cabezas Ofrecidas", "Cabezas Vendidas", "Cabezas Compradas", "Cabezas Operadas", "Soc Vendedoras", "Soc Compradoras"];
  const g = parseLabeledGroup(text, labels);
  if (!g || !g["Cabezas Ofrecidas"]) return null;
  return {
    ofrecidas: g["Cabezas Ofrecidas"].value,
    vendidas: g["Cabezas Vendidas"] ? g["Cabezas Vendidas"].value : "",
    compradas: g["Cabezas Compradas"] ? g["Cabezas Compradas"].value : "",
    operadas: g["Cabezas Operadas"] ? g["Cabezas Operadas"].value : "",
    socVend: g["Soc Vendedoras"] ? g["Soc Vendedoras"].value : "",
    socCompr: g["Soc Compradoras"] ? g["Soc Compradoras"].value : "",
    deltaOfrecidas: g["Cabezas Ofrecidas"].delta,
    deltaOperadas: g["Cabezas Operadas"] ? g["Cabezas Operadas"].delta : "",
  };
}

// "{Nombre} - Resumen del mes" -> solo se usa como respaldo de "vs Target" (que no
// aparece en ninguna otra diapositiva parseable de forma confiable para oficinas).
function parseResumenDelMesTarget(text) {
  const m = text.match(/Vs Target\s+(--|[+-][\d.,]+%?)\s*(?:↗|↘|→)?/);
  return m ? m[1] : null;
}

// "{Nombre} - Nuevas Sociedades Publicadoras" (sin sufijo Faena/Invernada)
function parseNuevasSociedadesPage(text) {
  const body = stripTitle(text, "Nuevas Sociedades Publicadoras");
  // patrón específico y más confiable: "Nuevas Sociedades 2 +0 → %CCC 17 % +9 p.p. ↗ Fae 1 Inv 1 Cria 1 MAG --"
  // (evita confundirse con la leyenda del gráfico "Nuevas Sociedades 2025/2024")
  const specific = body.match(
    /Nuevas Sociedades\s+(--|[\d.,]+)\s*((?:--|[+-][\d.,]+))?\s*(?:↗|↘|→)?\s*%CCC\s+(--|[\d.,]+)\s?%\s*((?:--|[+-][\d.,]+\s*p\.p\.))?\s*(?:↗|↘|→)?\s*Fae\s+(--|[\d.,]+)\s*Inv\s+(--|[\d.,]+)\s*Cria\s+(--|[\d.,]+)\s*MAG\s+(--|[\d.,]+)/
  );
  if (specific) {
    return {
      cant: specific[1], cantDelta: specific[2] || "",
      ccc: specific[3], cccDelta: specific[4] || "",
      fae: specific[5], inv: specific[6], cria: specific[7], mag: specific[8],
    };
  }
  // formato agrupado clásico
  const m = body.match(/Nuevas Sociedades %CCC\s+Fae Inv Cria MAG\s+([\d.,]+)\s+([\d.,]+)\s?%\s+(--|[\d.,]+)\s+(--|[\d.,]+)\s+(--|[\d.,]+)\s+(--|[\d.,]+)\s+((?:--|[+-][\d.,]+)\s*(?:↗|↘|→)?\s*(?:--|[+-][\d.,]+%?))/);
  if (m) {
    const deltas = (m[7].match(/--|[+-][\d.,]+%?/g) || []);
    return { cant: m[1], ccc: m[2], fae: m[3], inv: m[4], cria: m[5], mag: m[6], cantDelta: deltas[0] || "", cccDelta: deltas[1] || "" };
  }
  // formato entrelazado genérico (último recurso)
  const g = parseLabeledGroup(body, ["Nuevas Sociedades", "%CCC", "Fae", "Inv", "Cria", "MAG"]);
  if (g && g["Nuevas Sociedades"]) {
    return {
      cant: g["Nuevas Sociedades"].value, ccc: g["%CCC"] ? g["%CCC"].value : "",
      fae: g["Fae"] ? g["Fae"].value : "--", inv: g["Inv"] ? g["Inv"].value : "--",
      cria: g["Cria"] ? g["Cria"].value : "--", mag: g["MAG"] ? g["MAG"].value : "--",
      cantDelta: g["Nuevas Sociedades"].delta, cccDelta: g["%CCC"] ? g["%CCC"].delta : "",
    };
  }
  return null;
}

function firstLine(text) {
  return text.trim().split(/\s{2,}|(?<=\n)/)[0] || text.slice(0, 60);
}

function autofillFromPages(pages) {
  const filled = [];
  const missing = [];
  const setVal = (id, v) => { if (v !== undefined && v !== "" && v !== null) document.getElementById(id).value = v; };

  // Portada: nombre / tipo / mes / año (el orden "Cierre Mensual {nombre}" o "{nombre} Cierre Mensual" varía)
  const portada = pages[0] ? pages[0].text : "";
  const monthYearM = portada.match(/(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d{4})/);
  if (monthYearM) {
    const nombre = portada.replace("Cierre Mensual", "").replace(monthYearM[0], "").trim();
    if (nombre) {
      document.getElementById("nombre").value = nombre;
      document.getElementById("tipo").value = /^Oficina\b/i.test(nombre) ? "oficina" : "asociado";
      onTipoChange();
    }
    document.getElementById("mes").value = monthYearM[1];
    document.getElementById("anio").value = monthYearM[2];
    filled.push("nombre/tipo/mes/año");
  }

  let resultado = null, cabezasOp = null, sociedadesOp = null, nuevas = null, resumenTarget = null;
  const unitPages = {}; // label -> parsed

  pages.forEach((p) => {
    const title = p.text.slice(0, 120);
    if (/[-–—]\s?Resultado Comercial\b/.test(title) && !resultado) resultado = parseResultadoComercial(p.text);
    if (/[-–—]\s?Cabezas Operadas\b/.test(title) && !cabezasOp) cabezasOp = parseCabezasOperadasPage(p.text);
    if (/[-–—]\s?Sociedades Operando\b/.test(title) && !sociedadesOp) sociedadesOp = parseSociedadesOperandoPage(p.text);
    if (/[-–—]\s?Nuevas Sociedades Publicadoras\b(?!\s?(Faena|Invernada))/.test(title) && !nuevas) nuevas = parseNuevasSociedadesPage(p.text);
    if (/[-–—]\s?Resumen del mes\b/.test(title) && resumenTarget === null) resumenTarget = parseResumenDelMesTarget(p.text);

    // páginas propias de unidad: "<algo> - Faena" / "– Invernada" / "- Cría" / "- MAG" (guion normal o largo)
    const unitTitle = p.text.match(/[-–—]\s?(Faena|Invernada|Cria|Cría|MAG)\b/);
    const looksLikeUnitPage = /Cabezas Ofrecidas/.test(p.text) && /Cabezas Operadas/.test(p.text) && /Soc\s*Vendedoras/.test(p.text);
    if (unitTitle && looksLikeUnitPage) {
      const label = unitTitle[1];
      const key = label === "Cría" ? "cria" : label.toLowerCase();
      if (!unitPages[key]) unitPages[key] = parseUnitOwnPage(p.text);
    }

    // detectar tarjeta de SACs (si en algún momento aparece esa diapositiva)
    if (/SACS?\s*aprob|JD\s*[Ss]olicitadas|JD\s*[Oo]torgadas/.test(p.text)) {
      const envM = p.text.match(/(\d+)\s*\/\s*(\d+)\s*enviados/i) || p.text.match(/SACS?\s*[Aa]prob\.?\s*(\d+)\s*\/\s*(\d+)/);
      document.getElementById("sacsEnabled").checked = true;
      document.getElementById("sacsFields").style.display = "block";
      filled.push("SACs");
    }
  });

  // ---- hero + sociedades desde Resultado Comercial (o, si no está, desde Cabezas Operadas) ----
  if (resultado) {
    setVal("h_ofrecidas", resultado.ofrecidas);
    setVal("h_operadas", resultado.operadas);
    setVal("h_ccc", resultado.ccc);
    setVal("h_rendim", resultado.rendim);
    const d = resultado.deltas;
    if (d.length >= 8) {
      setVal("h_varAnio", valOf(d[1])); document.getElementById("h_varAnioSigno").value = signOf(d[1]);
      setVal("h_varTarget", valOf(d[2])); document.getElementById("h_varTargetSigno").value = signOf(d[2]);
      setVal("h_cccVar", valOf(d[5])); document.getElementById("h_cccSigno").value = signOf(d[5]);
      setVal("h_rendimVar", valOf(d[6])); document.getElementById("h_rendimSigno").value = signOf(d[6]);
      setVal("s_mes", resultado.socOperando);
      setVal("s_mesVar", (signOf(d[7]) === "neg" ? "-" : "+") + valOf(d[7]));
    }
    filled.push("hero (cabezas/rendimiento/%CCC)");
  } else if (cabezasOp && cabezasOp.total && cabezasOp.total.ofrecidas && cabezasOp.total.operadas) {
    const t = cabezasOp.total;
    setVal("h_ofrecidas", cleanNum(t.ofrecidas.value));
    setVal("h_operadas", cleanNum(t.operadas.value));
    if (t.ccc) setVal("h_ccc", cleanNum(t.ccc.value));
    if (t.rendim) setVal("h_rendim", cleanNum(t.rendim.value));
    if (t.operadas.delta) { setVal("h_varAnio", valOf(t.operadas.delta)); document.getElementById("h_varAnioSigno").value = signOf(t.operadas.delta); }
    if (t.rendim && t.rendim.delta) { setVal("h_rendimVar", valOf(t.rendim.delta)); document.getElementById("h_rendimSigno").value = signOf(t.rendim.delta); }
    if (t.ccc && t.ccc.delta) { setVal("h_cccVar", valOf(t.ccc.delta)); document.getElementById("h_cccSigno").value = signOf(t.ccc.delta); }
    if (resumenTarget && !isDash(resumenTarget)) {
      setVal("h_varTarget", valOf(resumenTarget));
      document.getElementById("h_varTargetSigno").value = signOf(resumenTarget);
      filled.push("hero (desde 'Cabezas Operadas' + 'Resumen del mes' para vs target)");
    } else {
      filled.push("hero (desde 'Cabezas Operadas' — revisá 'vs target', no lo encontré)");
      missing.push("vs target (no encontré la página 'Resultado Comercial' ni 'Resumen del mes')");
    }
  } else {
    missing.push("hero (no encontré ni 'Resultado Comercial' ni 'Cabezas Operadas')");
  }

  // ---- sociedades operando (preferimos esta página dedicada sobre Resultado Comercial) ----
  if (sociedadesOp) {
    setVal("s_mes", sociedadesOp.mes);
    setVal("s_mesVar", (signOf(sociedadesOp.mesDelta) === "neg" ? "-" : "+") + valOf(sociedadesOp.mesDelta));
    setVal("s_ytd", sociedadesOp.ytd);
    setVal("s_ytdVar", (signOf(sociedadesOp.ytdDelta) === "neg" ? "-" : "+") + valOf(sociedadesOp.ytdDelta));
    filled.push("sociedades operando");
  } else {
    missing.push("sociedades operando");
  }

  // ---- nuevas sociedades ----
  if (nuevas) {
    setVal("n_cant", nuevas.cant);
    setVal("n_ccc", nuevas.ccc);
    setVal("n_inv", isDash(nuevas.inv) ? "0" : nuevas.inv);
    setVal("n_cria", isDash(nuevas.cria) ? "0" : nuevas.cria);
    setVal("n_fae", isDash(nuevas.fae) ? "0" : nuevas.fae);
    setVal("n_var", (signOf(nuevas.cantDelta) === "neg" ? "-" : "+") + valOf(nuevas.cantDelta));
    filled.push("nuevas sociedades");
  } else {
    missing.push("nuevas sociedades");
  }

  // ---- unidades de negocio (Cría / Faena / Invernada / MAG) ----
  UNIDADES.forEach((u) => {
    const own = unitPages[u.key];
    const fromTotal = cabezasOp && cabezasOp.units ? cabezasOp.units[u.key] : null;

    if (!own) {
      // no había diapositiva propia de esta unidad este mes -> sin actividad
      document.getElementById(`${u.key}_sin`).checked = true;
      document.getElementById(`${u.key}_sin`).dispatchEvent(new Event("change"));
      return;
    }
    document.getElementById(`${u.key}_sin`).checked = false;
    document.getElementById(`${u.key}_sin`).dispatchEvent(new Event("change"));

    setVal(`${u.key}_operadas`, cleanNum(own.operadas));
    setVal(`${u.key}_ofrecidas`, cleanNum(own.ofrecidas));
    setVal(`${u.key}_vendidas`, cleanNum(own.vendidas));
    setVal(`${u.key}_compradas`, isDash(own.compradas) ? "--" : cleanNum(own.compradas));
    if (own.deltaOperadas) setVal(`${u.key}_opVar`, valOf(own.deltaOperadas));
    if (own.deltaOfrecidas) setVal(`${u.key}_ofVar`, valOf(own.deltaOfrecidas));
    if (fromTotal && fromTotal.ccc) {
      setVal(`${u.key}_ccc`, cleanNum(fromTotal.ccc.val));
    }
    filled.push(u.label);
  });

  return { filled, missing };
}


// ---- helpers de formato / color --------------------------------------------
function num(v) {
  return (v === undefined || v === null || v === "") ? "" : v;
}
function cccColor(pct) {
  if (pct === "" || pct === "--" || pct === undefined) return { bg: null, color: "#B4BEC7" };
  const p = parseFloat(String(pct).replace(",", "."));
  if (isNaN(p)) return { bg: null, color: "#B4BEC7" };
  if (p >= 70) return { color: "#1E8449" };
  if (p >= 40) return { color: "#B9770E" };
  return { color: "#C0392B" };
}
function varTagInline(value, sign) {
  // usado en las cajas grandes del hero (con fondo)
  if (value === "" || value === undefined) return "";
  const positive = sign !== "neg";
  const bg = positive ? "#EAF7EE" : "#FDECEA";
  const color = positive ? "#1E8449" : "#C0392B";
  const arrow = positive ? "▲" : "▼";
  return `<td style="background-color:${bg};color:${color};font-size:11px;font-weight:bold;padding:4px 10px;border-radius:10px;">${arrow} ${value}${String(value).includes("%") ? "" : "%"}</td>`;
}
function varSmall(value, sign, suffix) {
  if (value === "" || value === undefined) return `<span style="color:#B4BEC7;">—</span>`;
  const positive = sign !== "neg";
  const color = positive ? "#1E8449" : "#C0392B";
  const arrow = positive ? "▲" : "▼";
  const clean = String(value).replace(/^-/, "");
  return `<span style="font-weight:bold;color:${color};">${arrow}${clean}${suffix || "%"}</span>`;
}
function barWidth(operadas, maxOperadas) {
  const v = parseFloat(String(operadas).replace(/\./g, "").replace(",", "."));
  const max = parseFloat(String(maxOperadas).replace(/\./g, "").replace(",", "."));
  if (!v || !max) return 1;
  return Math.max(1, Math.round((v / max) * 60));
}
function linesToItems(text) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
function itemsToUl(items) {
  if (!items.length) return "";
  return `<ul style="margin:6px 0 10px 18px;padding:0;">` + items.map((i) => `<li>${escapeHtml(i)}</li>`).join("") + `</ul>`;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function driveExportXlsx(link) {
  const id = driveIdFromLink(link);
  if (!id) return link || "";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
}

// ---- lectura del formulario -------------------------------------------------
function readState() {
  const g = (id) => document.getElementById(id).value.trim();

  const unidades = {};
  UNIDADES.forEach((u) => {
    const sinActividad = document.getElementById(`${u.key}_sin`).checked;
    unidades[u.key] = {
      label: u.label,
      color: u.color,
      sinActividad,
      operadas: sinActividad ? "0" : g(`${u.key}_operadas`) || "0",
      opVar: sinActividad ? "" : g(`${u.key}_opVar`),
      opSign: document.getElementById(`${u.key}_opVar`).value.trim().startsWith("-") ? "neg" : "pos",
      ofrecidas: sinActividad ? "--" : (g(`${u.key}_ofrecidas`) || "--"),
      ofVar: sinActividad ? "" : g(`${u.key}_ofVar`),
      ofSign: document.getElementById(`${u.key}_ofVar`).value.trim().startsWith("-") ? "neg" : "pos",
      ccc: sinActividad ? "--" : (g(`${u.key}_ccc`) || "--"),
      vendidas: sinActividad ? "0" : (g(`${u.key}_vendidas`) || "0"),
      compradas: sinActividad ? "--" : (g(`${u.key}_compradas`) || "--"),
    };
  });

  const asociados = Array.from(document.querySelectorAll("#asociadosWrap .assoc-row")).map((row) => ({
    nombre: row.querySelector(".a_nombre").value.trim(),
    ofrecidas: row.querySelector(".a_ofrecidas").value.trim(),
    operadas: row.querySelector(".a_operadas").value.trim(),
    ccc: row.querySelector(".a_ccc").value.trim(),
    soc: row.querySelector(".a_soc").value.trim(),
  })).filter((a) => a.nombre);

  return {
    tipo: g("tipo") || document.getElementById("tipo").value,
    nombre: g("nombre"),
    mes: document.getElementById("mes").value,
    anio: g("anio"),
    linkPdf: g("linkPdf"),
    linkCis: g("linkCis"),
    linkReporte: g("linkReporte") || g("linkPdf"),
    hero: {
      operadas: g("h_operadas"),
      ofrecidas: g("h_ofrecidas"),
      varAnio: g("h_varAnio"),
      varAnioSigno: document.getElementById("h_varAnioSigno").value,
      varTarget: g("h_varTarget"),
      varTargetSigno: document.getElementById("h_varTargetSigno").value,
      rendim: g("h_rendim"),
      rendimVar: g("h_rendimVar"),
      rendimSigno: document.getElementById("h_rendimSigno").value,
      ccc: g("h_ccc"),
      cccVar: g("h_cccVar"),
      cccSigno: document.getElementById("h_cccSigno").value,
    },
    unidades,
    sociedades: {
      mes: g("s_mes"), mesVar: g("s_mesVar"),
      ytd: g("s_ytd"), ytdVar: g("s_ytdVar"),
    },
    nuevas: {
      cant: g("n_cant"), varr: g("n_var"), ccc: g("n_ccc"),
      inv: g("n_inv"), cria: g("n_cria"), fae: g("n_fae"),
    },
    sacsEnabled: document.getElementById("sacsEnabled").checked,
    sacs: {
      env: g("sacs_env"), apr: g("sacs_apr"), jdSol: g("jd_sol"), jdOtor: g("jd_otor"),
    },
    asociados,
    recuadros: readRecuadros().map((r) => {
      if (!r.link && document.getElementById("linkCis").value.trim() && /\bci\b/i.test(r.titulo)) {
        return { ...r, link: document.getElementById("linkCis").value.trim() };
      }
      return r;
    }),
  };
}

// ---- construcción del HTML del mail -----------------------------------------
function buildEmailHtml(s) {
  const A = window.DCAC_ASSETS;
  const isOficina = s.tipo === "oficina";
  const tituloHeader = s.nombre || (isOficina ? "Oficina" : "Asociado");
  const badge = `${s.mes.toUpperCase()} ${s.anio}`;

  // ---- unidades ----
  const maxOperadas = Math.max(
    ...Object.values(s.unidades).map((u) => parseFloat(String(u.operadas).replace(/\./g, "").replace(",", ".")) || 0),
    1
  );
  let totalOperadas = 0, totalOfrecidas = 0, totalVendidas = 0, totalCompradas = 0;

  const unidadRows = UNIDADES.map((uDef, idx) => {
    const u = s.unidades[uDef.key];
    const bgAlt = idx % 2 === 1 ? "background-color:#FAFBFC;" : "";
    const borderBottom = idx < UNIDADES.length - 1 ? "border-bottom:1px solid #EDEFF2;" : "";
    const cc = cccColor(u.ccc);
    const bw = u.sinActividad ? 1 : barWidth(u.operadas, maxOperadas);

    totalOperadas += parseFloat(String(u.operadas).replace(/\./g, "").replace(",", ".")) || 0;
    if (u.ofrecidas !== "--") totalOfrecidas += parseFloat(String(u.ofrecidas).replace(/\./g, "").replace(",", ".")) || 0;
    totalVendidas += parseFloat(String(u.vendidas).replace(/\./g, "").replace(",", ".")) || 0;
    if (u.compradas !== "--") totalCompradas += parseFloat(String(u.compradas).replace(/\./g, "").replace(",", ".")) || 0;

    return `<tr style="${bgAlt}"><td style="padding:12px 10px;font-size:14px;${borderBottom}${bgAlt}color:#33424F;"><span style="display:inline-block;width:9px;height:9px;background-color:${uDef.color};border-radius:2px;margin-right:7px;"></span>${uDef.label}</td>` +
      `<td align="center" style="padding:12px 10px;${borderBottom}background-color:#F5F9FD;">` +
      `<div style="font-size:15px;font-weight:800;color:#152C42;">${u.operadas}</div>` +
      `<div style="font-size:10px;margin-top:3px;">${varSmall(u.opVar, u.opSign)} <span style="color:#9AA7B2;">vs ${s.mes.slice(0,3)} ${String(s.anio).slice(-2)-1}</span></div>` +
      `<table cellpadding="0" cellspacing="0" style="margin:5px 0 0 0;"><tr><td style="width:60px;background-color:#E4E8EB;border-radius:4px;"><div style="width:${bw}px;height:6px;background-color:${uDef.color};border-radius:4px;"></div></td></tr></table>` +
      `</td>` +
      `<td align="center" style="padding:12px 10px;${borderBottom}">` +
      `<div style="font-size:14px;color:#33424F;">${u.ofrecidas}</div>` +
      (u.ofrecidas !== "--" ? `<div style="font-size:10px;margin-top:3px;">${varSmall(u.ofVar, u.ofSign)} <span style="color:#9AA7B2;">vs ${s.mes.slice(0,3)} ${String(s.anio).slice(-2)-1}</span></div>` : "") +
      `</td>` +
      `<td align="center" style="padding:12px 10px;font-size:13px;font-weight:bold;${borderBottom}color:${cc.color};">${u.ccc === "--" ? '<span style="color:#B4BEC7;">--</span>' : u.ccc + "%"}</td>` +
      `<td align="center" style="padding:12px 10px;font-size:14px;${borderBottom}color:#33424F;">${u.vendidas}</td>` +
      `<td align="center" style="padding:12px 10px;font-size:14px;${borderBottom}color:#33424F;">${u.compradas}</td></tr>`;
  }).join("");

  const totalRow = `<tr><td style="padding:13px 10px;font-size:14px;font-weight:bold;background-color:#152C42;color:#fff;">Total ${isOficina ? "oficina" : tituloHeader}</td>` +
    `<td align="center" style="padding:13px 10px;font-size:16px;font-weight:800;background-color:#152C42;color:#fff;">${s.hero.operadas || totalOperadas}</td>` +
    `<td align="center" style="padding:13px 10px;font-size:14px;font-weight:bold;background-color:#152C42;color:#fff;">${s.hero.ofrecidas || totalOfrecidas}</td>` +
    `<td align="center" style="padding:13px 10px;font-size:13px;font-weight:bold;background-color:#152C42;color:#9FD9B8;">${s.hero.ccc || "--"}%</td>` +
    `<td align="center" style="padding:13px 10px;font-size:14px;font-weight:bold;background-color:#152C42;color:#fff;">${totalVendidas}</td>` +
    `<td align="center" style="padding:13px 10px;font-size:14px;font-weight:bold;background-color:#152C42;color:#fff;">${totalCompradas}</td></tr>`;

  // ---- cards: sociedades / nuevas / sacs ----
  const cardsWidth = s.sacsEnabled ? "31.3%" : "48.5%";
  const nuevasBreakdown = ["inv", "cria", "fae"]
    .filter((k) => s.nuevas[k] && s.nuevas[k] !== "0")
    .map((k) => `${k.toUpperCase() === "CRIA" ? "CRÍA" : k.toUpperCase()} ${s.nuevas[k]}`)
    .join(" · ");

  const cardsBlock = `<tr><td style="padding:24px 28px 4px 28px;">
<table role="presentation" width="100%"><tr>
<td style="width:${cardsWidth};background-color:#EAF2FB;border-radius:10px;padding:14px;vertical-align:top;">
<div style="color:#1B4F8C;font-size:10px;text-transform:uppercase;font-weight:bold;letter-spacing:.03em;">Sociedades operando</div>
<table role="presentation" width="100%" style="margin-top:9px;"><tr>
<td style="width:50%;vertical-align:top;">
<div style="color:#6C8CAE;font-size:9px;text-transform:uppercase;font-weight:bold;letter-spacing:.03em;">Mes</div>
<div style="color:#152C42;font-size:18px;font-weight:800;margin-top:2px;">${s.sociedades.mes || "--"}</div>
<div style="font-size:10px;color:#1E8449;font-weight:bold;margin-top:1px;">(${s.sociedades.mesVar || "—"} vs ${s.mes.slice(0,3)} ${String(s.anio).slice(-2)-1})</div>
</td>
<td style="width:50%;vertical-align:top;border-left:1px solid #D7E3F0;padding-left:10px;">
<div style="color:#6C8CAE;font-size:9px;text-transform:uppercase;font-weight:bold;letter-spacing:.03em;">YTD</div>
<div style="color:#152C42;font-size:18px;font-weight:800;margin-top:2px;">${s.sociedades.ytd || "--"}</div>
<div style="font-size:10px;color:#1E8449;font-weight:bold;margin-top:1px;">(${s.sociedades.ytdVar || "—"} vs ${s.mes.slice(0,3)} ${String(s.anio).slice(-2)-1})</div>
</td>
</tr></table>
</td><td style="width:3%;"></td>
<td style="width:${cardsWidth};background-color:#EAF7EE;border-radius:10px;padding:14px;vertical-align:top;">
<div style="color:#1E8449;font-size:10px;text-transform:uppercase;font-weight:bold;letter-spacing:.03em;">Nuevas sociedades</div>
<div style="color:#152C42;font-size:23px;font-weight:800;margin-top:2px;">${s.nuevas.cant || "0"} <span style="font-size:12px;font-weight:bold;color:#1E8449;">CCC ${s.nuevas.ccc || "--"}%</span></div>
${nuevasBreakdown ? `<div style="font-size:11px;color:#3D7A55;margin-top:6px;">${nuevasBreakdown}</div>` : ""}
</td>${s.sacsEnabled ? `<td style="width:3%;"></td>
<td style="width:${cardsWidth};background-color:#FDF6E3;border-radius:10px;padding:14px;vertical-align:top;">
<div style="color:#B9770E;font-size:10px;text-transform:uppercase;font-weight:bold;letter-spacing:.03em;">SACS aprob.</div>
<div style="color:#152C42;font-size:20px;font-weight:800;margin-top:2px;">${s.sacs.apr || "0"}/${s.sacs.env || "0"} <span style="font-size:11px;color:#B9770E;font-weight:normal;">enviados</span></div>
<div style="color:#B9770E;font-size:10px;text-transform:uppercase;font-weight:bold;letter-spacing:.03em;margin-top:9px;">JD otorgadas</div>
<div style="color:#152C42;font-size:16px;font-weight:800;margin-top:2px;">${s.sacs.jdOtor || "0"} / ${s.sacs.jdSol || "0"} <span style="font-size:11px;color:#9C7A2E;font-weight:normal;">JD Solicitadas</span></div>
</td>` : ""}
</tr></table>
</td></tr>`;

  // ---- resultado comercial por asociado (solo oficina) ----
  let asociadosBlock = "";
  if (isOficina && s.asociados.length) {
    const rows = s.asociados.map((a, idx) => {
      const alt = idx % 2 === 1;
      const cc = cccColor(a.ccc);
      return `<tr${alt ? ' style="background-color:#FAFBFC;"' : ""}><td style="padding:12px 10px;font-size:14px;${idx < s.asociados.length - 1 ? "border-bottom:1px solid #EDEFF2;" : ""}${alt ? "background-color:#FAFBFC;" : ""}color:#33424F;">${escapeHtml(a.nombre)}</td>
<td align="center" style="padding:12px 10px;${idx < s.asociados.length - 1 ? "border-bottom:1px solid #EDEFF2;" : ""}background-color:#F5F9FD;">
<div style="font-size:15px;font-weight:800;color:#152C42;">${a.ofrecidas || "--"}</div>
</td>
<td align="center" style="padding:12px 10px;${idx < s.asociados.length - 1 ? "border-bottom:1px solid #EDEFF2;" : ""}background-color:#EAF2FB;">
<div style="font-size:15px;font-weight:800;color:#152C42;">${a.operadas || "--"}</div>
</td>
<td align="center" style="padding:12px 10px;font-size:15px;font-weight:800;${idx < s.asociados.length - 1 ? "border-bottom:1px solid #EDEFF2;" : ""}color:${cc.color};">${a.ccc ? a.ccc + "%" : "--"}</td>
<td align="center" style="padding:12px 10px;${idx < s.asociados.length - 1 ? "border-bottom:1px solid #EDEFF2;" : ""}">
<div style="font-size:15px;font-weight:800;color:#152C42;">${a.soc || "--"}</div>
</td></tr>`;
    }).join("");

    asociadosBlock = `<tr><td style="padding:20px 28px 4px 28px;">
<div style="color:#152C42;font-size:14px;font-weight:800;margin-bottom:12px;">Resultado comercial por asociado</div>
<table role="presentation" width="100%" style="border-collapse:collapse;border-radius:10px;overflow:hidden;background-color:#FAFBFC;border:1px solid #EEF1F3;">
<tr style="background-color:#F7F9FA;">
<td style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">ASOCIADO</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;background-color:#F5F9FD;">OFRECIDAS</td>
<td align="center" style="padding:10px;font-size:10px;color:#152C42;font-weight:bold;letter-spacing:.04em;background-color:#EAF2FB;">OPERADAS</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">% CCC</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">SOC.</td>
</tr>
${rows}
</table>
</td></tr>`;
  }

  // ---- recuadros dinámicos ----
  const recuadrosBlock = s.recuadros.map((r) => buildRecuadroBlock(r)).join("\n");

  // ---- ensamblado final ----
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cierre Mensual - ${escapeHtml(tituloHeader)} - ${s.mes} ${s.anio}</title></head>
<body style="margin:0;padding:0;background-color:#F1F3F6;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F3F6;padding:32px 0;"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(21,44,66,0.08);">

<tr><td style="background-color:#2E6DA4;">
<div style="background-image:url('data:image/jpeg;base64,${A.headerBg}');background-size:cover;background-position:center center;background-repeat:no-repeat;background-color:#2E6DA4;padding:28px 28px 24px 28px;text-align:center;">
<img src="data:image/png;base64,${A.logo}" width="40" height="41" alt="dCaC" style="display:block;margin:0 auto 12px auto;">
<div style="color:#CFE0F0;font-size:11px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,0.55);">Cierre Mensual</div>
<div style="color:#ffffff;font-size:23px;font-weight:800;margin-top:4px;text-shadow:0 1px 5px rgba(0,0,0,0.6);">${escapeHtml(tituloHeader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto 0 auto;"><tr>
<td style="background-color:#152C42;color:#fff;font-size:11px;font-weight:bold;padding:5px 14px;border-radius:12px;letter-spacing:.03em;">${badge}</td>
</tr></table>
</div>
</td></tr>

<tr><td style="padding:28px 28px 6px 28px;">
<table role="presentation" width="100%"><tr>
<td style="width:54%;vertical-align:top;">
<div style="color:#8A97A3;font-size:11px;font-weight:bold;letter-spacing:.05em;text-transform:uppercase;">Cabezas operadas</div>
<div style="color:#152C42;font-size:42px;font-weight:800;line-height:1.1;margin-top:3px;">${s.hero.operadas || "--"}</div>
<table cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr>
${varTagInline(s.hero.varAnio, s.hero.varAnioSigno)}
<td style="width:6px;"></td>
${varTagInline(s.hero.varTarget, s.hero.varTargetSigno)}
</tr></table>
</td>
<td style="width:2%;"></td>
<td style="width:44%;vertical-align:top;">
<table role="presentation" width="100%" style="background-color:#F5F9FD;border:1px solid #DCE8F5;border-radius:10px;"><tr>
<td style="width:50%;vertical-align:top;text-align:center;padding:12px 8px;">
<div style="color:#5C7A9A;font-size:10px;font-weight:bold;letter-spacing:.05em;text-transform:uppercase;">Rendimiento</div>
<div style="color:#152C42;font-size:24px;font-weight:800;margin-top:3px;">${s.hero.rendim || "--"}%</div>
<div style="font-size:11px;font-weight:bold;margin-top:2px;">${varSmall(s.hero.rendimVar, s.hero.rendimSigno, " p.p.")}</div>
</td>
<td style="width:1px;background-color:#DCE8F5;"></td>
<td style="width:50%;vertical-align:top;text-align:center;padding:12px 8px;">
<div style="color:#5C7A9A;font-size:10px;font-weight:bold;letter-spacing:.05em;text-transform:uppercase;">% CCC</div>
<div style="color:#152C42;font-size:24px;font-weight:800;margin-top:3px;">${s.hero.ccc || "--"}%</div>
<div style="font-size:11px;font-weight:bold;margin-top:2px;">${varSmall(s.hero.cccVar, s.hero.cccSigno, " p.p.")}</div>
</td>
</tr></table>
</td>
</tr></table>
</td></tr>

<tr><td style="padding:26px 28px 4px 28px;">
<div style="color:#152C42;font-size:14px;font-weight:800;margin-bottom:12px;">Actividad por unidad de negocio</div>
<table role="presentation" width="100%" style="border-collapse:collapse;border-radius:10px;overflow:hidden;background-color:#FAFBFC;border:1px solid #EEF1F3;">
<tr style="background-color:#F7F9FA;">
<td style="padding:10px;font-size:10px;color:#152C42;font-weight:bold;letter-spacing:.04em;background-color:#EAF2FB;">CATEGORÍA</td>
<td align="center" style="padding:10px;font-size:10px;color:#152C42;font-weight:bold;letter-spacing:.04em;background-color:#EAF2FB;">OPERADAS</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">OFRECIDAS</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">CCC %</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">VENDIDAS</td>
<td align="center" style="padding:10px;font-size:10px;color:#8A97A3;font-weight:bold;letter-spacing:.04em;">COMPRADAS</td>
</tr>
${unidadRows}
${totalRow}
</table>
</td></tr>

${cardsBlock}
${asociadosBlock}
${recuadrosBlock}

<tr><td style="padding:24px 28px 30px 28px;">
<a href="${s.linkReporte || "#"}" target="_blank" style="display:block;text-align:center;background-color:#2E6DA4;background-image:linear-gradient(135deg,#3E82C4,#1B4F8C);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:16px 0;border-radius:14px;letter-spacing:.01em;box-shadow:0 6px 16px rgba(27,79,140,0.32);">📄&nbsp;&nbsp;Ver reporte completo&nbsp;&nbsp;→</a>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
<td style="width:48.5%;vertical-align:top;">
<a href="https://pulse.dcac.ar/" target="_blank" style="display:block;text-decoration:none;background-color:#F1FAF5;border:1px solid #CDEBDA;border-radius:14px;padding:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="width:34px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#1a6b3c;border-radius:17px;width:34px;height:34px;"><tr>
<td align="center" valign="middle" style="width:34px;height:34px;">
<img src="https://pulse.dcac.ar/logo.png" width="17" height="17" alt="Pulso" style="display:block;">
</td></tr></table>
</td>
<td style="padding-left:9px;vertical-align:middle;">
<div style="color:#136B3F;font-size:12px;font-weight:800;line-height:1.2;">Pulso Comercial</div>
<div style="color:#5E9C7C;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;margin-top:1px;">Métricas en vivo</div>
</td>
<td align="right" style="vertical-align:middle;color:#1a6b3c;font-size:15px;font-weight:800;">›</td>
</tr></table>
</a>
</td>
<td style="width:3%;"></td>
<td style="width:48.5%;vertical-align:top;">
<a href="https://vademecum.dcac.ar/" target="_blank" style="display:block;text-decoration:none;background-color:#EFF5FC;border:1px solid #CFE1F3;border-radius:14px;padding:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="width:34px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#2E6DA4;border-radius:17px;width:34px;height:34px;"><tr>
<td align="center" valign="middle" style="width:34px;height:34px;color:#ffffff;font-size:15px;">📖</td>
</tr></table>
</td>
<td style="padding-left:9px;vertical-align:middle;">
<div style="color:#1B4F8C;font-size:12px;font-weight:800;line-height:1.2;">Vademécum</div>
<div style="color:#6C8CAE;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;margin-top:1px;">Guía de referencia</div>
</td>
<td align="right" style="vertical-align:middle;color:#2E6DA4;font-size:15px;font-weight:800;">›</td>
</tr></table>
</a>
</td>
</tr></table>

<div style="text-align:center;font-size:11px;color:#9AA7B2;margin-top:16px;">deCampoaCampo · Reporte generado automáticamente</div>
</td></tr>

</table></td></tr></table></body></html>`;
}

// ---- acciones de UI ---------------------------------------------------------
function onGenerate() {
  const state = readState();
  if (!state.nombre) {
    alert("Falta el nombre de la oficina/asociado (paso 1).");
    return;
  }
  lastGeneratedHtml = buildEmailHtml(state);
  const frame = document.getElementById("previewFrame");
  frame.style.display = "block";
  document.getElementById("previewEmpty").style.display = "none";
  frame.srcdoc = lastGeneratedHtml;
  document.getElementById("genStatus").textContent = "Generado " + new Date().toLocaleTimeString();
}

function onCopy() {
  if (!lastGeneratedHtml) { alert("Primero generá el HTML."); return; }
  navigator.clipboard.writeText(lastGeneratedHtml).then(() => {
    document.getElementById("genStatus").textContent = "Copiado al portapapeles ✓";
  });
}

function onDownload() {
  if (!lastGeneratedHtml) { alert("Primero generá el HTML."); return; }
  const state = readState();
  const safeName = (state.nombre || "cierre").replace(/[^a-zA-Z0-9]/g, "");
  const blob = new Blob([lastGeneratedHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cierre_${safeName}_${state.mes.toLowerCase()}${state.anio}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
