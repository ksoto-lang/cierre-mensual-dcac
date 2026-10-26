# Pendientes y decisiones abiertas

Regla: nada de esto se implementa sin confirmar con Karli lo que falta (nunca inventar datos).

## 1. %CCC por asociado / Alan García (alta prioridad, bloqueado por un dato)
- La definición del Power BI es `Vendidas / (Vendidas + No Concretadas)` (ver REGLAS_NEGOCIO §4).
- Hoy, en la fila "Total−resto" y en la fila TOTAL, el %CCC se calcula como Operadas/Ofrecidas → **no coincide con la definición real**.
- Para Alan García el PDF muestra en la celda %CCC el valor de toda la oficina; sus otras columnas son propias.
- Falta saber si "Cabezas No Concretadas" por comercial existe en el PDF (hojas de No concretadas / columnas "Motivo NC" y "Q" de las tablas de detalle) o si hay que pedirla al Power BI.
  Opciones a proponerle a Karli: (a) parsear No Concretadas por comercial si está en el PDF y calcular el %CCC con la fórmula real; (b) dejar el %CCC de esa fila vacío ("--") hasta tener el dato; (c) permitir cargarlo a mano en el paso 6.
- Verificar el caso "0,21%" de Ezequiel Tarchetti (probable error de formato en la fuente: ¿21%?).

## 2. % "random" en personas nuevas este año
Si no hay dato del año anterior (la persona empezó a trabajar este año) no debe mostrarse ningún % de variación. Karli dijo "lo vemos después"; **falta un PDF o captura donde ocurra** para reproducirlo.
Revisar los lugares donde se muestran variaciones vs año anterior: hero, unidades de negocio, asociados, Sociedades, y el parser que lee los deltas.

## 3. "Cantidad de tropas operadas" en el hero
Pedido: mostrarla debajo del número de cabezas operadas, igual que "vs año anterior" y "vs target". **No existe en ninguno de los 4 PDFs de referencia** (solo hay "ID lote" en tablas de detalle).
Preguntas para Karli: ¿en qué hoja del PDF aparece (si es que sale de ahí)? ¿es carga manual? ¿lleva variaciones vs año anterior y target (de dónde salen)? Necesitamos un PDF/captura con ese dato.

## 4. Confirmaciones pendientes de Karli
- Fix del SACs "fantasma" (JD Solicitadas = 1 sin hoja de SACs): probarlo con el PDF original donde ocurrió. En el test de regresión, los PDFs sin hoja de SACs quedan sin SACs.
- Fila TOTAL: en un momento se pidió que cada total se contrastara contra el total de "Actividad por unidad de negocio" y marcara "?" si no coincide. La versión entregada **no** tiene ese chequeo
  (el pedido posterior fue solo sumar). Preguntar si lo quiere; ojo: depende de resolver el punto 1 para el %CCC.

## 4b. Datos nuevos detectados con los PDFs de sep 2026
- "Resultado Comercial" de oficina ahora trae por asociado Rendim., Cab. Operadas YTD, Soc. Operando YTD y variaciones en p.p. de %CCC/Rendim. Preguntar a Karli cuáles van a la tabla.
- En la hoja de CRM la leyenda del gráfico dice "Cuentas Autogestionadas" y las tarjetas "Cuentas Autogeneradas": avisar para unificar en el Power BI.

## 4c. Mail en celular
- Con el ancho fluido, todo entra en 375px salvo las tablas de 7 columnas (Actividad por unidad de negocio y Resultado comercial por asociado), que piden ~575px.
  Gmail achica el mail para que entre. Si se quiere que se lea grande en el celu, habría que rediseñar esas tablas (propuesta pendiente de OK de Karli).

## 5. Housekeeping
- Reconciliar la plantilla del Proyecto de claude.ai (`diseno_entre_rios_junio2026_v6.html` en las instrucciones vs `diseno_entre_rios_julio2026_v7.html` en los documentos). Si la webapp es el camino oficial, actualizar el Proyecto con el orden de columnas vigente.
- Guardar los 4 PDFs de referencia como fixtures locales (`tests/fixtures/`, no se suben al repo).
- `reconstructRotatedName()` (nombres rotados letra por letra en el PDF) nunca se probó con un caso real.
- La imagen de header no se comprime: si es pesada solo se avisa.

## 6. Ideas "avanzadas" para proponer más adelante (NO implementar sin OK de Karli)
- Test de regresión en GitHub Actions: requiere fixtures sintéticos o anonimizados (los PDFs reales no pueden estar en el repo).
- Lectura automática del PDF desde Drive (hoy bloqueada por CORS): requeriría un backend mínimo o un flujo vía conector de Drive.
- Borradores compartidos entre PCs (hoy son locales al navegador).
- Generar el mail directamente como borrador de Gmail vía conector, en vez de copiar y pegar.
