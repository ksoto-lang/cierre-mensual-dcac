# Historial de cambios (resumen del chat de desarrollo)

Orden cronológico aproximado. Hasta la entrega `2026-10-09c` no había control de versiones (Karli copiaba archivos a GitHub a mano); desde que se use Claude Code, cada cambio aprobado = un commit
y este archivo se actualiza en el mismo commit.

## Base y construcción de la webapp
1. Corrección de un cierre manual (Jose Olmedo) con PDF actualizado, respetando literalmente los comentarios de Karli.
2. Comentarios de Producción detallados (SACs pendientes, Mermas, Variación de ofrecimientos, No concretadas) literales; Mermas en caja propia; caja "CIs habilitadas" con link al listado.
3. Webapp estática (GitHub Pages): carga del PDF, autocompletado, cajas de comentario, generación del HTML.
4. Autocompletado robusto contra PDFs reales de distintas oficinas: formatos agrupado/interlineado, guion largo, "Cria" sin tilde, MAG con menos campos, signo de deltas, SACs (enviados/aprobados/JD).
5. Recuadros dinámicos (cantidad y títulos libres) en lugar de 4 fijos.
6. Directorio sociedad→CUIT (desde la hoja "Comportamiento CIs") con autolink a Vademécum; alta manual; localStorage.
7. Borradores + autoguardado. Un solo campo de link de Drive (sirve para leer y para el botón final).
8. Header: 3 iteraciones hasta la versión segura para Gmail (img + bloque en flujo normal); imagen propia y "guardar como la de siempre".
9. Hubo confusión de deploy (zip; un archivo equivocado pegado en `index.html`): desde entonces se entregan archivos sueltos indicando cuáles cambiaron.

## Cambios recientes (sept–oct 2026)
10. Columna **Rendimiento** en "Actividad por unidad de negocio" (luego movida a la última posición).
11. Etiquetas "vs target" / "vs {mes} {año-1}" junto a las variaciones del hero; tarjeta Sociedades: "Vs YTD 25'".
12. Fix: los **representantes** no muestran el recuadro de Rendimiento (solo %CCC a ancho completo).
13. Fix: oficinas tomaban máximo 3 asociados → ahora concatena todas las hojas "Resultado Comercial" y deduplica.
14. **"Total−resto"** para quien funciona como oficina (Alan García): sus valores = total oficina − suma de los demás (casilla por fila).
15. Columnas **Vendidas y Compradas** en la tabla de asociados (Soc. última).
16. Recuadro **"CIs habilitadas"** de nuevo, pero **opcional** (botón propio).
17. Fix crítico: sin hoja de SACs, "JD Solicitadas" salía "1" (regex global). Ahora solo se busca en páginas de SACs y solo se aplica si la tarjeta de SACs está activa. *(Falta confirmación de Karli con el PDF original; ver PENDIENTES.)*
18. Fila **TOTAL** al final de "Resultado comercial por asociado" (entrega 05/10). Orden de columnas probado en las dos direcciones; vigente desde el 09/10: Operadas · Ofrecidas · %CCC · Vendidas · Compradas · Soc.
19. Casillas para **omitir variaciones vs año anterior** (flecha, % y texto) en "Actividad por unidad de negocio" y/o "Resultado comercial por asociado" (entrega 09/10 "c"; la versión "b" ocultaba solo el texto "vs …" y Karli pidió ocultar todo).
20. Armado del paquete de traspaso a Claude Code: `CLAUDE.md`, docs, test de regresión (`tests/regression.js`), `.claude/settings.json`.
21. Se suben al repo `CLAUDE.md`, `docs/`, el test de regresión y `package.json` (antes vivían fuera de GitHub).
22. Tarjeta **"Gestión de cuentas" (CRM)** con Cuentas Autogeneradas, Cuentas Enviadas y Silencio Comercial (mes + histórico), leída de la hoja nueva de CRM del Power BI.
    Solo aparece si el PDF trae esa hoja; casilla para quitarla. Test de regresión ampliado. Fixtures nuevos: Oficina Tandil y Oficina Bs As Central (sep 2026).
23. Fix: **JD Solicitadas** sumaba el número equivocado cuando la fila de la tabla de detalle de SACs tenía CIs (Tandil sep 26: 1357 → 17, confirmado por Karli).
    Ahora toma siempre el primer número después del Estado (= JD Pedidas).
24. Fix: **%CCC por asociado** exportado como fracción por un error del Power BI ("0,79" → 79%, confirmado por Karli). Solo se convierte "0,xx"/"1,xx" sin signo %.
    El test ahora verifica valores esperados por PDF (JD Solicitadas de Tandil, %CCC de Bs As Central) y que ningún %CCC por asociado quede como fracción o > 100.
25. Nuevo diseño de la webapp estilo **cowboy boho** (cuero, terracota, arena, turquesa; costuras punteadas, flecos en el encabezado, tipografías Rye y Lora).
    Solo cambia el formulario (`styles.css` + fuentes en `index.html`); el HTML del mail queda igual.
26. **Foto de arriba del mail** nueva (vacas, elegida por Karli), fija en `assets.js` y recortada a banner 640x220. Las imágenes que se suben a mano
    (y las "de siempre" guardadas antes) se recortan solas al centro a ese formato. Fix celular: el mail ya no tiene ancho fijo de 640 px (ahora 100% con
    máximo 642 px) y la foto ya no usa max-height (se deformaba/cortaba en el celu). Se agregó meta viewport.
27. Botón **"📋 Copiar vista previa"** arriba de la vista previa: copia el mail ya armado (como se ve, text/html + texto plano) para pegarlo
    directo en el cuerpo de Gmail. "Copiar HTML" sigue copiando el código.
28. La **barra de volumen** de "Actividad por unidad de negocio" pasa de la columna Operadas a la columna Categoría, debajo del nombre de cada unidad
    (antes parecía parte del "vs año anterior"). El nombre de la unidad ya no se parte en dos renglones.
29. Se saca "· Reporte generado automáticamente" del pie del mail (queda solo "deCampoaCampo").
30. **Bloque azul** (navy #152C42) detrás del encabezado (logo, "Cierre Mensual", nombre, mes) y del hero (cabezas operadas, Rendimiento, %CCC),
    a pedido de Karli tras ver las propuestas de diseño. Logo blanco, textos blancos/celeste claro y variaciones en verde/rojo claros (`varSmallOnDark`)
    para que se lean sobre azul; chips del hero con verde/rojo un poco más oscuros (contraste ≥ 4,5:1). El resto del mail no cambia.
31. El texto "vs {mes} {año-1}" de las variaciones en "Actividad por unidad de negocio" y "Resultado comercial por asociado" va en su propio renglón,
    debajo del % (antes se cortaba "vs Sep / 25").
32. En "Resultado comercial por asociado" el "vs target" también va debajo del %. En las dos tablas, si la variación viene vacía no se muestra nada
    (antes salía "—" con "vs Sep 25"). El test lo controla.
33. Tarjeta **Sociedades operando**: la variación va arriba y "vs Sep 25" / "Vs YTD 25'" en el renglón de abajo, sin cortarse (antes quedaba
    "Vs YTD" en un renglón y "25'" en otro). Si la variación está vacía no se muestra nada; si es negativa sale en rojo (antes siempre verde).

## Análisis sin cambio de código
- Sobre el %CCC (05/10): la definición real es Vendidas/(Vendidas+No Concretadas), no Operadas/Ofrecidas (ver REGLAS_NEGOCIO §4). No se pudo calcular el %CCC propio de Alan García sin "Cabezas No Concretadas" por comercial.
- "Tropas operadas": no existe en ninguno de los 4 PDFs de referencia (ver PENDIENTES #3).

## Entregas (carpetas de salida de las sesiones previas)
`entrega_2026-10-05` (columnas + TOTAL) → `entrega_2026-10-09` (Operadas primero) → `entrega_2026-10-09b` (omitir texto "vs") → `entrega_2026-10-09c` (omitir variación completa). La última es la base de este repo.
