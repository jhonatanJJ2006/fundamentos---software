# CiudadanIA – Módulo de Gestión de Formularios (MVC)

Tarea individual · Fundamentos de Ingeniería de Software · UTPL
**Estudiante:** Jhonatan Alexander Jara Masa

CRUD web de **portafolios, formularios y preguntas** del estudio de caso *CiudadanIA, escuchar al barrio con datos*, construido con el patrón **Modelo – Vista – Controlador**.

## Stack
- Monorepo **Turborepo** + pnpm workspaces
- **TypeScript**, **React 19** (Next.js 15, App Router), **Tailwind CSS 4**
- **PostgreSQL en Neon** (nube) con **Prisma**
- Despliegue en **Vercel**

## Arquitectura MVC

```
apps/web/                 VISTA + CONTROLADOR
  src/app/[locale]/...      Vistas (páginas)  — /es/... y /en/...
  src/views/components/     Componentes de vista (formularios, diálogos, selectores)
  src/controllers/          Controladores: PortafolioController, FormularioController,
                            PreguntaController, SesionController
packages/model/           MODELO
  src/domain/               Usuario, Portafolio, Formulario, Pregunta, Opcion,
                            «enum» EstadoFormulario, «enum» TipoPregunta  (tarjetas CRC)
  src/services/             Servicios que orquestan dominio + persistencia
  src/repositories/         Interfaces + implementación Prisma
packages/db/              Esquema Prisma, migraciones y datos de demostración
packages/i18n/            Archivos de recursos es.json / en.json
```

Flujo: **Vista** (formulario) → **Controlador** (verifica rol, llama al Modelo, captura errores, decide la vista) → **Modelo** (reglas de negocio + BD) → **Vista**.

## Requisitos implementados
- **RF01–RF04** Portafolios: registrar (nombre único, fecha automática), consultar con nº de formularios y búsqueda, modificar, eliminar solo si está vacío (con confirmación).
- **RF05–RF09** Formularios: registrar en Borrador, listar/filtrar por estado y ver detalle con preguntas en orden, modificar datos, eliminar en Borrador (con reportes → se cierra), Borrador → Publicado (≥ 1 pregunta) → Cerrado.
- **RF10–RF12** Preguntas: agregar (opción múltiple ≥ 2 opciones), modificar y eliminar con reordenamiento, solo en Borrador.
- **RNF01** Español / inglés (sin textos fijos en la vista, el cambio conserva la pantalla).
- **RNF02** Solo el rol Investigador modifica (selector de usuario simulado en el encabezado).
- **RNF03** Validaciones en el Modelo con un mensaje claro por error.
- **RNF04** Diseño adaptable (360 px a escritorio, sin scroll horizontal).

## Ejecutar en local
```bash
pnpm install
cp .env.example .env          # pegar DATABASE_URL y DATABASE_URL_UNPOOLED de Neon
pnpm db:deploy                # crea las tablas
pnpm db:seed                  # datos de demostración
pnpm dev                      # http://localhost:3000
pnpm test                     # pruebas unitarias del Modelo e i18n
```

## Despliegue en Vercel
1. Importar este repositorio en Vercel, con **Root Directory = `apps/web`**.
2. *Storage → Create → Neon*: Vercel crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
3. Ejecutar localmente `pnpm db:deploy && pnpm db:seed` con esas variables.
