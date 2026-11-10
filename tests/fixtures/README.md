# Fixtures (PDFs de prueba) — NO se suben a GitHub

Poné acá (localmente) los PDFs reales de referencia. Están en `.gitignore` a propósito:
tienen datos comerciales reales. Archivos esperados (cualquier nombre, terminando en .pdf):

| Caso                              | Qué valida                                                   |
|-----------------------------------|--------------------------------------------------------------|
| Asociado individual (Jose Olmedo) | Sin tabla de asociados, sin SACs                             |
| Oficina Ayacucho                  | Oficina con 2 asociados, formato "interlineado", sin SACs    |
| Representante (Santiago Bunge)    | Con SACs, sin target, sin tabla de asociados                 |
| Oficina Pringles                  | Oficina con 3+ asociados, MAG, SACs, fila Total              |
| Oficina Tandil (sep 2026)         | Hoja de CRM (Gestión de cuentas), SACs, Resultado Comercial vacío |
| Oficina Bs As Central (sep 2026)  | Formato nuevo de Resultado Comercial (%CCC "0,79", YTD), sin CRM |
| Franco Barrionuevo (jun 2026)     | Representante, sin SACs ni CRM                               |
| Santiago Bunge (oct 2026)         | Nuevas sociedades con %CCC vacío ("--") — no confundir con el año de la leyenda |
| Oficina Bavio / Oficina Maipú (oct 2026) | Exportados desde "Power BI Desktop" (texto pegado en cada hoja), sin Resultado Comercial |
| Oficina Entre Ríos (oct 2026)     | Tablas de CRM cortadas en el PDF (silencio 13, listado 0) — el formulario avisa |
| Enrique Von Wernich (oct 2026)    | Asociado sin target |
| Jose Olmedo (sep 2026, CRM con detalle) | Formato nuevo de SACs ("JDs", fecha antes de unidad), CRM + "Detalle cuentas mes actual" |

Si Karli manda un PDF nuevo con formato raro, agregarlo acá y sumar su caso a `tests/regression.js`.
