"""Completa la plantilla de la UTPL con los entregables de las actividades 1, 2 y 3.

Uso:  python docs/informe/generar_informe.py
"""
import sys
from pathlib import Path

import docx
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parents[2]
IMG = RAIZ / "docs" / "diagramas"
PLANTILLA = RAIZ / "docs" / "informe" / "plantilla.docx"
SALIDA = RAIZ / "docs" / "informe" / "Tarea_MVC_CiudadanIA_Jhonatan_Jara.docx"

ESTUDIANTE = "Jhonatan Alexander Jara Masa"
FECHA = "17 de noviembre de 2026"
ANIO = "2026"
ENTREGA = "Entrega 1"
REPO = "https://github.com/jhonatanJJ2006/fundamentos---software"
URL_APP = "https://fundamentos-software.vercel.app/es/portafolios"

AZUL = RGBColor(0x08, 0x3D, 0x77)
d = docx.Document(PLANTILLA)
ANCHO = Cm(16)


# ---------------- utilidades ----------------
class Cursor:
    """Inserta bloques en orden, inmediatamente después de un párrafo ancla."""

    def __init__(self, ancla):
        self.ultimo = ancla._p

    def _mover(self, elemento):
        self.ultimo.addnext(elemento)
        self.ultimo = elemento

    def parrafo(self, texto="", negrita=False, tam=None, color=None, alinear=None, cursiva=False, estilo=None):
        p = d.add_paragraph(style=estilo)
        if texto:
            r = p.add_run(texto)
            r.bold = negrita
            r.italic = cursiva
            if tam:
                r.font.size = Pt(tam)
            if color:
                r.font.color.rgb = color
        if alinear:
            p.alignment = alinear
        self._mover(p._p)
        return p

    def titulo(self, texto, tam=12):
        return self.parrafo(texto, negrita=True, tam=tam, color=AZUL)

    def vinetas(self, items):
        for it in items:
            p = self.parrafo(estilo="List Paragraph" if "List Paragraph" in [s.name for s in d.styles] else None)
            if isinstance(it, tuple):
                r = p.add_run("• " + it[0]); r.bold = True
                p.add_run(it[1])
            else:
                p.add_run("• " + it)
            p.paragraph_format.left_indent = Cm(0.6)

    def imagen(self, archivo, pie, ancho=ANCHO):
        ruta = archivo if Path(archivo).is_absolute() else IMG / archivo
        p = self.parrafo(alinear=WD_ALIGN_PARAGRAPH.CENTER)
        if Path(ruta).exists():
            p.add_run().add_picture(str(ruta), width=ancho)
        else:
            p.add_run(f"[Falta imagen: {Path(ruta).name}]").italic = True
        self.parrafo(pie, cursiva=True, tam=9, alinear=WD_ALIGN_PARAGRAPH.CENTER)

    def tabla(self, encabezados, filas, anchos=None):
        t = d.add_table(rows=1, cols=len(encabezados))
        t.style = "Table Grid"
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, h in enumerate(encabezados):
            c = t.rows[0].cells[i]
            c.text = ""
            r = c.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = RGBColor(255, 255, 255)
            sombra = OxmlElement("w:shd"); sombra.set(qn("w:val"), "clear"); sombra.set(qn("w:fill"), "083D77")
            c._tc.get_or_add_tcPr().append(sombra)
        for fila in filas:
            celdas = t.add_row().cells
            for i, v in enumerate(fila):
                celdas[i].text = ""
                celdas[i].paragraphs[0].add_run(str(v)).font.size = Pt(9)
        if anchos:
            for fila in t.rows:
                for i, a in enumerate(anchos):
                    fila.cells[i].width = Cm(a)
        self._mover(t._tbl)
        self.parrafo()
        return t

    def codigo(self, texto):
        for linea in texto.strip("\n").split("\n"):
            p = self.parrafo()
            r = p.add_run(linea or " ")
            r.font.name = "Consolas"; r.font.size = Pt(8.5)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.left_indent = Cm(0.5)
        self.parrafo()


def reemplazar_parrafo(p, texto="", **kw):
    for r in p.runs[1:]:
        r._r.getparent().remove(r._r)
    if p.runs:
        p.runs[0].text = texto
    else:
        p.add_run(texto)
    return p


def parrafo_que_contiene(texto):
    for p in d.paragraphs:
        if texto in p.text:
            return p
    raise ValueError(texto)


# ---------------- portada ----------------
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
for caja in d.paragraphs[0]._p.iter(W + "txbxContent"):
    for par in caja.findall(W + "p"):
        textos = list(par.iter(W + "t"))
        contenido = "".join(t.text or "" for t in textos).strip()
        nuevo = {
            "Nombres y apellidos completos del estudiante": ESTUDIANTE,
            "Fecha": FECHA,
            "Año": ANIO,
            "Número de Entrega": ENTREGA,
        }.get(contenido)
        if nuevo:
            textos[0].text = nuevo
            for t in textos[1:]:
                t.text = ""

# ---------------- selección de RNF ----------------
c = Cursor(parrafo_que_contiene("Requisitos no funcionales"))
c.ultimo = d.tables[1]._tbl  # insertar justo después de la tabla de RNF
c.parrafo()
p = c.parrafo()
p.add_run("RNF seleccionados: ").bold = True
p.add_run("se implementaron los cuatro (RNF01 Internacionalización, RNF02 Control de acceso, "
          "RNF03 Integridad de datos y RNF04 Diseño adaptable). Su verificación se detalla en la Actividad 3.")

# ---------------- Actividad 1 ----------------
ph_general = parrafo_que_contiene("Diagrama de Caso de Uso General")
ph_especificos = parrafo_que_contiene("Diagrama de Casos de Uso Específicos")

reemplazar_parrafo(ph_general, "")
c = Cursor(ph_general)
c.parrafo("Los diagramas se elaboraron en Enterprise Architect 17 (modelo docs/ea/CiudadanIA.qea del repositorio). "
          "El único actor del módulo es el Investigador; el inicio de sesión se simula. Cada caso de uso lleva en su nombre "
          "el requisito funcional que realiza, y además se modeló la relación «trace» entre cada caso de uso y su RF.")
c.titulo("1.1 Diagrama de casos de uso general")
c.imagen("01-cu-general.png", "Figura 1. Diagrama de casos de uso general del módulo Gestión de Formularios.")

reemplazar_parrafo(ph_especificos, "")
c = Cursor(ph_especificos)
c.titulo("1.2 Diagramas de casos de uso específicos")
c.imagen("02-cu-portafolios.png", "Figura 2. CU específico 1: Gestionar portafolios (RF01–RF04).")
c.imagen("03-cu-formularios.png", "Figura 3. CU específico 2: Gestionar formularios (RF05–RF09).")
c.imagen("04-cu-preguntas.png", "Figura 4. CU específico 3: Gestionar preguntas (RF10–RF12).")
c.titulo("1.3 Matriz de trazabilidad caso de uso → requisito funcional")
c.tabla(
    ["Caso de uso", "Nombre", "RF", "Relaciones «include» / «extend»"],
    [
        ["CU01.1", "Registrar portafolio", "RF01", "«include» Validar nombre obligatorio y único"],
        ["CU01.2", "Consultar portafolios", "RF02", "«extend» Buscar portafolio por nombre"],
        ["CU01.3", "Modificar portafolio", "RF03", "«include» Validar nombre obligatorio y único"],
        ["CU01.4", "Eliminar portafolio", "RF04", "«include» Confirmar eliminación, Verificar que no tenga formularios"],
        ["CU02.1", "Registrar formulario", "RF05", "«include» Validar título, descripción y consentimiento"],
        ["CU02.2", "Consultar formularios", "RF06", "«extend» Filtrar por estado, Ver detalle con preguntas"],
        ["CU02.3", "Modificar formulario", "RF07", "«include» Validar título, descripción y consentimiento"],
        ["CU02.4", "Eliminar formulario", "RF08", "«extend» Cerrar formulario con reportes"],
        ["CU02.5", "Cambiar estado del formulario", "RF09", "«include» Validar al menos 1 pregunta"],
        ["CU03.1", "Agregar pregunta", "RF10", "«include» Verificar Borrador; «extend» Registrar opciones (mín. 2)"],
        ["CU03.2", "Modificar pregunta", "RF11", "«include» Verificar Borrador; «extend» Registrar opciones (mín. 2)"],
        ["CU03.3", "Eliminar pregunta", "RF12", "«include» Verificar Borrador, Reordenar, Confirmar eliminación"],
    ],
    anchos=[1.8, 4.2, 1.3, 8.7],
)
c.imagen("05-trazabilidad-cu-rf.png", "Figura 5. Trazabilidad «trace» de casos de uso a requisitos en Enterprise Architect.", ancho=Cm(11))

# ---------------- Actividad 2 ----------------
ph_clases = parrafo_que_contiene("Diagrama de Clases}")
reemplazar_parrafo(ph_clases, "")
c = Cursor(ph_clases)
c.titulo("2.1 Diagrama de clases")
c.imagen("06-diagrama-clases.png", "Figura 6. Diagrama de clases del modelo, derivado de las tarjetas CRC.")
c.parrafo("Correspondencia CRC → diagrama de clases:", negrita=True)
c.vinetas([
    ("Usuario: ", "atributos id, nombre, correo, rol; método esInvestigador(). Asociación 1 — 0..* con Portafolio (creador)."),
    ("Portafolio: ", "id, nombre, descripción, fechaCreacion; agregarFormulario(), quitarFormulario(), listarFormularios(), "
                     "validar() (nombre obligatorio y único) y puedeEliminarse(). Composición 1 — 0..* con Formulario."),
    ("Formulario: ", "id, título, descripción, consentimiento, estado; agregarPregunta(), quitarPregunta(), ordenarPreguntas(), "
                     "publicar() (≥ 1 pregunta), cerrar() y esEditable() (solo Borrador). Composición 1 — 1..* con Pregunta."),
    ("Pregunta: ", "id, enunciado, tipo, orden, obligatoria; agregarOpcion(), quitarOpcion() y validar() (opción múltiple ≥ 2 "
                   "opciones). Composición 1 — 0..* con Opcion."),
    ("Opcion: ", "id, texto, orden; validar() (texto no vacío)."),
    ("Enumeraciones: ", "EstadoFormulario {BORRADOR, PUBLICADO, CERRADO} y TipoPregunta {OPCION_MULTIPLE, TEXTO, SI_NO, "
                        "UBICACION_GPS, IMAGEN}; se añadió Rol para el control de acceso (RNF02)."),
])
c.parrafo("Estas clases se implementaron tal cual en packages/model/src/domain del repositorio, de modo que el diseño y "
          "el código coinciden uno a uno.")

# ---------------- Actividad 3 ----------------
ph_exp = parrafo_que_contiene("expone su solución")
reemplazar_parrafo(ph_exp, "")
c = Cursor(ph_exp)
c.titulo("3.1 Entregables")
c.tabla(
    ["Entregable", "Enlace / ubicación"],
    [
        ["Repositorio (Turborepo)", REPO],
        ["Aplicación desplegada (Vercel)", URL_APP],
        ["Base de datos en la nube", "PostgreSQL administrado en Neon (conectado a Vercel)"],
        ["Modelo UML (Enterprise Architect)", "docs/ea/CiudadanIA.qea"],
    ],
    anchos=[5, 11],
)
c.titulo("3.2 Tecnologías")
c.vinetas([
    ("Lenguaje: ", "TypeScript (modo estricto) en todo el proyecto."),
    ("Vista: ", "React 19 con Next.js 15 (App Router) y Tailwind CSS 4."),
    ("Controlador: ", "Server Actions de Next.js agrupadas en clases-módulo *Controller."),
    ("Modelo: ", "clases de dominio en TypeScript + Prisma ORM sobre PostgreSQL (Neon)."),
    ("Monorepo: ", "Turborepo con pnpm workspaces; despliegue continuo en Vercel desde GitHub."),
    ("Pruebas: ", "Vitest (20 pruebas unitarias de reglas de negocio y de internacionalización)."),
])
c.titulo("3.3 Arquitectura MVC")
c.imagen("07-arquitectura-mvc.png", "Figura 7. Capas Modelo, Vista y Controlador de la solución.")
c.codigo("""
fundamentos---software/            (Turborepo)
├─ apps/web/                       VISTA + CONTROLADOR (Next.js)
│  ├─ src/app/[locale]/...         Vistas: /es/... y /en/...
│  ├─ src/views/components/        FormPortafolio, FormFormulario, FormPregunta, BotonConfirmar...
│  └─ src/controllers/             PortafolioController, FormularioController,
│                                  PreguntaController, SesionController, base.ts
├─ packages/model/                 MODELO
│  ├─ src/domain/                  Usuario, Portafolio, Formulario, Pregunta, Opcion, enums
│  ├─ src/services/                PortafolioService, FormularioService, PreguntaService
│  └─ src/repositories/            Interfaces + implementación Prisma
├─ packages/db/                    Esquema Prisma, migraciones y datos de demostración
└─ packages/i18n/                  es.json / en.json
""")
c.parrafo("Flujo de una petición (ejemplo: agregar pregunta):", negrita=True)
c.vinetas([
    "La Vista (FormPregunta) envía los datos y el idioma elegido a PreguntaController.agregarPregunta().",
    "El Controlador verifica que el usuario en sesión sea Investigador (RNF02); si no, responde «acceso denegado» sin llamar al Modelo.",
    "El Controlador llama a PreguntaService.agregar(); el Modelo carga el Formulario, comprueba esEditable(), crea la Pregunta, "
    "la valida (≥ 2 opciones si es opción múltiple), la ubica en su orden y guarda en Neon dentro de una transacción.",
    "Si el Modelo lanza un ErrorDominio, el Controlador lo captura y devuelve a la Vista un mensaje por cada error (RNF03); "
    "si todo es correcto, redirige al detalle del formulario en el mismo idioma.",
])
c.titulo("3.4 Implementación de los requisitos funcionales")
c.tabla(
    ["RF", "Vista", "Controlador", "Regla en el Modelo"],
    [
        ["RF01", "/portafolios/nuevo", "registrarPortafolio", "Nombre obligatorio y único; fecha automática"],
        ["RF02", "/portafolios?q=", "listarPortafolios", "Conteo de formularios; búsqueda por nombre"],
        ["RF03", "/portafolios/[id]/editar", "modificarPortafolio", "Nombre único excluyendo el propio"],
        ["RF04", "Detalle + diálogo", "eliminarPortafolio", "puedeEliminarse(): sin formularios"],
        ["RF05", "/formularios/nuevo", "registrarFormulario", "Campos obligatorios; estado inicial BORRADOR"],
        ["RF06", "Detalle portafolio ?estado=", "listarFormularios / verFormulario", "Filtro por estado; preguntas por orden"],
        ["RF07", "/formularios/[id]/editar", "modificarFormulario", "Datos editables; estructura bloqueada si no es Borrador"],
        ["RF08", "Detalle + diálogo", "eliminarFormulario", "Solo Borrador; con reportes → CERRADO"],
        ["RF09", "Botones Publicar / Cerrar", "cambiarEstadoFormulario", "BORRADOR→PUBLICADO (≥1 pregunta)→CERRADO"],
        ["RF10", "/preguntas/nueva", "agregarPregunta", "esEditable(); opción múltiple ≥ 2 opciones"],
        ["RF11", "/preguntas/[id]/editar", "modificarPregunta", "Solo en Borrador; reubica el orden"],
        ["RF12", "Detalle + diálogo", "eliminarPregunta", "Solo en Borrador; reordena 1..n"],
    ],
    anchos=[1.3, 4.2, 4.5, 6],
)
c.titulo("3.5 Verificación de los requisitos no funcionales")
c.tabla(
    ["RNF", "Cómo se implementó", "Prueba realizada"],
    [
        ["RNF01 Internacionalización",
         "Vista sin textos fijos: todo sale de es.json / en.json. El idioma va en la URL (/es, /en) y el Controlador lo recibe y lo pasa a la Vista.",
         "Selector ES/EN conserva la misma pantalla y filtros; prueba automática que verifica que ambos archivos tienen las mismas claves y que toda clave usada existe."],
        ["RNF02 Control de acceso",
         "ejecutarAccion() del Controlador verifica usuario.esInvestigador() antes de llamar al Modelo.",
         "Seleccionar el usuario «Participante» e intentar eliminar un formulario: se muestra «Acceso denegado» y no se elimina."],
        ["RNF03 Integridad de datos",
         "Validaciones y reglas en las clases del Modelo (ErrorDominio con un código por error); el Controlador los captura y la Vista los muestra junto a cada campo.",
         "Portafolio sin nombre, pregunta de opción múltiple con 1 opción y publicar un formulario sin preguntas: los 3 muestran mensaje y no guardan."],
        ["RNF04 Diseño adaptable",
         "Tailwind CSS con diseño responsive (tarjetas, grid y flex que se apilan en móvil).",
         "Herramientas de desarrollador a 360 px y 1366 px: sin desplazamiento horizontal."],
    ],
    anchos=[3.2, 6.4, 6.4],
)

c.titulo("3.6 Exposición")
c.parrafo("La solución se expone en la clase del 17 de noviembre de 2026 mostrando: los diagramas en Enterprise Architect, "
          "el recorrido del CRUD en la aplicación desplegada (RF01–RF12) y las pruebas de los cuatro RNF descritas arriba.")

d.save(SALIDA)
print("Informe generado:", SALIDA)
