# Fixtures (PDFs de prueba) — NO se suben a GitHub

Poné acá (localmente) los PDFs reales de referencia. Están en `.gitignore` a propósito:
tienen datos comerciales reales. Archivos esperados (cualquier nombre, terminando en .pdf):

| Caso                              | Qué valida                                                   |
|-----------------------------------|--------------------------------------------------------------|
| Asociado individual (Jose Olmedo) | Sin tabla de asociados, sin SACs                             |
| Oficina Ayacucho                  | Oficina con 2 asociados, formato "interlineado", sin SACs    |
| Representante (Santiago Bunge)    | Con SACs, sin target, sin tabla de asociados                 |
| Oficina Pringles                  | Oficina con 3+ asociados, MAG, SACs, fila Total              |

Si Karli manda un PDF nuevo con formato raro, agregarlo acá y sumar su caso a `tests/regression.js`.
