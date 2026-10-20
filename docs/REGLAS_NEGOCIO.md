# Reglas de negocio y de diseño del mail

## 1. Tipos de destinatario
- **Oficina**: incluye tabla "Resultado comercial por asociado" y tarjeta de SACs (si hay hoja). Muestra Rendimiento.
- **Asociado comercial individual** (ej. Jose Olmedo, Santiago Bunge, Pablo Cieri): sin tabla de asociados. Muestra Rendimiento. Se distingue de la oficina por el título del PDF
  ("Oficina X" vs nombre y apellido).
- **Representante** (ej. Franco Barrionuevo): sin tabla de asociados, **sin recuadro de Rendimiento** (solo "% CCC" a ancho completo). Si es ambiguo si es representante o asociado → preguntar a Karli.

## 2. Secciones condicionales
- SACs: si el PDF no tiene hoja de SACs, la tarjeta se omite y las otras dos se ensanchan (48,5% c/u). **Sin hoja de SACs todo es vacío/0, nunca un valor por defecto.**
- Faltantes: tag gris "—", jamás un valor inventado. MAG solo si aparece explícitamente en el PDF.
- Barras de la tabla de actividad: proporcionales a la unidad de mayor volumen.
- Periodicidad: Mensual → "vs Sep 25"; Trimestral/Cuatrimestral → "vs mismo período 25'". Tarjeta de Sociedades: "Vs YTD 25'".
- Hero: junto a las variaciones va la descripción ("vs target", "vs {mes} {año-1}").

## 3. Contenido
- Comentarios de Karli literales. Si "Pendientes" es el contenido, poner esa palabra tal cual.
- Marcar inconsistencias del PDF en vez de resolverlas en silencio; confirmar con Karli ante datos ambiguos.
- Recuadros: Producción (verde), Resumen del mes (navy), Tareas del mes (celeste `#EAF2FB` borde azul), Mermas y CIs habilitadas (colores propios), más los personalizados.
- Oficinas con link de Google Sheets de CIs habilitadas: botón "⬇️ Listado de Socs con CI habilitadas" con URL de exportación directa (`/export?format=xlsx`). El recuadro "CIs habilitadas"
  es **opcional** (botón "+ Agregar recuadro de CIs habilitadas"), no viene por defecto.
- Algunas oficinas (ej. Bs As Central) reemplazan Producción/Resumen por cajas propias: limitar esa desviación a esa oficina.
- Autolink de sociedades mencionadas en los textos → `https://vademecum.dcac.ar/?cuit=…`.

## 4. Tabla "Resultado comercial por asociado" (reglas especiales)
- Columnas (orden vigente desde el 09/10/2026): **Asociado · Operadas · Ofrecidas · %CCC · Vendidas · Compradas · Soc.** (Soc. siempre última). El orden cambió varias veces a pedido de
  Karli (Operadas primero → Ofrecidas primero → Operadas primero); no cambiarlo sin pedido explícito.
- Se incluyen **todos** los asociados de todas las hojas "Resultado Comercial" (la tabla puede paginarse).
- Fila **TOTAL** al final: suma Operadas, Ofrecidas, Vendidas, Compradas, Soc.; el %CCC del total se calcula hoy como Operadas/Ofrecidas (ver aviso abajo).
- **"Total−resto"** (casilla por fila): para alguien que funciona como oficina con representantes a cargo (caso Alan García) sus valores = Total de la oficina − suma de los demás asociados
  (en todas las columnas). Karli lo confirmó explícitamente.
- Variaciones por fila (vs año anterior de Ofrecidas/Operadas/Soc., y "vs target" de Operadas) salen del PDF; se pueden ocultar con la casilla "Omitir variaciones vs año anterior" (no oculta "vs target").
- Cuando una persona es **nueva este año** (sin dato del año anterior) NO debe mostrarse un % de variación (hoy puede aparecer un % incorrecto — ver PENDIENTES #2).

### ⚠ Definición real de %CCC (fórmula DAX del Power BI, aportada por Karli el 05/10/2026)
```
CCC' por Comercial =
VAR Vendidas = [Cabezas Vendidas por Comercial]
VAR NoConcretadas = [Cabezas No Concretadas' por Comercial]
VAR Denominador = Vendidas + NoConcretadas
RETURN IF( ISBLANK(Vendidas) && ISBLANK(NoConcretadas), BLANK(),
           IF( ISBLANK(Vendidas), 0, DIVIDE(Vendidas, Denominador) ) )
```
→ **%CCC = Vendidas / (Vendidas + No Concretadas)**, NO Operadas/Ofrecidas. Verificado: Andoni (Vendidas en blanco → 0%), Javier (ambos en blanco → "--%"), Dario (100% ⇒ No Concretadas 0).
Consecuencias: (a) el %CCC por asociado debe tomarse **tal cual del PDF**, nunca recalcularse con Operadas/Ofrecidas; (b) en la fila "Total−resto" y en la fila TOTAL el %CCC se calcula hoy con
Operadas/Ofrecidas, que **no es la definición del sistema** → para Alan García el valor que muestra el PDF en esa celda es el total de la oficina (el resto de sus columnas sí son suyas); para calcular el suyo
hace falta "Cabezas No Concretadas" por comercial (no está en la tabla). Ver PENDIENTES #1.

## 5. Diseño
- Paleta: navy `#152C42`, celeste de marca `#2E6DA4`, fondos `#EAF2FB` / `#F5F9FD` / `#FAFBFC`, grises `#8A97A3` / `#33424F`. Color del %CCC según umbrales (`cccColor()`).
- Footer: CTA "Ver reporte completo" (degradé) + tarjetas Pulso Comercial (verde `#1a6b3c`, logo `pulse.dcac.ar/logo.png`) y Vademécum (`vademecum.dcac.ar`).
- Compatibilidad de email: estilos inline, tablas, sin `background-image` ni `position:absolute`, sin CSS posicional. Ancho 640px.
