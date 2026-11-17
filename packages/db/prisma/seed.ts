/**
 * Datos de demostración del módulo Gestión de Formularios.
 * Ejecutar: pnpm db:seed   (borra y vuelve a crear los datos).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reporte.deleteMany();
  await prisma.opcion.deleteMany();
  await prisma.pregunta.deleteMany();
  await prisma.formulario.deleteMany();
  await prisma.portafolio.deleteMany();
  await prisma.usuario.deleteMany();

  // Usuarios simulados (el inicio de sesión está fuera del alcance del módulo).
  await prisma.usuario.createMany({
    data: [
      { id: "usr-investigador", nombre: "Ana Torres", correo: "investigador@utpl.edu.ec", rol: "INVESTIGADOR" },
      { id: "usr-participante", nombre: "Luis Jaramillo", correo: "participante@ciudadania.ec", rol: "PARTICIPANTE" },
    ],
  });

  const consentimiento =
    "Acepto participar voluntariamente en CiudadanIA. Mis respuestas, fotografías y ubicación serán usadas por la UTPL " +
    "y el GAD Municipal solo con fines de planificación de obras. El panel público no mostrará mis datos personales " +
    "ni mi ubicación GPS exacta. Puedo retirarme en cualquier momento.";

  // Portafolio 1: Movilidad segura
  const movilidad = await prisma.portafolio.create({
    data: {
      nombre: "Movilidad segura",
      descripcion: "Problemas de vías, veredas, señalización y alumbrado que afectan la movilidad en los barrios.",
      creadorId: "usr-investigador",
    },
  });

  // Formulario PUBLICADO con reportes (demuestra: no se elimina, se cierra)
  const baches = await prisma.formulario.create({
    data: {
      titulo: "Reporte de problemas en la vía pública",
      descripcion: "Reporta baches, basura acumulada, alumbrado dañado o alcantarillas tapadas en tu barrio.",
      consentimiento,
      estado: "PUBLICADO",
      portafolioId: movilidad.id,
      preguntas: {
        create: [
          {
            enunciado: "¿Qué tipo de problema observa?",
            tipo: "OPCION_MULTIPLE",
            orden: 1,
            obligatoria: true,
            opciones: {
              create: [
                { texto: "Bache", orden: 1 },
                { texto: "Basura acumulada", orden: 2 },
                { texto: "Alumbrado dañado", orden: 3 },
                { texto: "Alcantarilla tapada", orden: 4 },
              ],
            },
          },
          { enunciado: "Tome una foto del problema", tipo: "IMAGEN", orden: 2, obligatoria: true },
          { enunciado: "Marque la ubicación del problema", tipo: "UBICACION_GPS", orden: 3, obligatoria: true },
          { enunciado: "¿El problema representa un peligro inmediato?", tipo: "SI_NO", orden: 4, obligatoria: false },
          { enunciado: "Describa brevemente el problema", tipo: "TEXTO", orden: 5, obligatoria: false },
        ],
      },
    },
  });
  await prisma.reporte.createMany({ data: Array.from({ length: 4 }, () => ({ formularioId: baches.id })) });

  // Formulario BORRADOR (editable)
  await prisma.formulario.create({
    data: {
      titulo: "Señalización y pasos peatonales",
      descripcion: "Identifica cruces peligrosos y señales de tránsito faltantes cerca de escuelas.",
      consentimiento,
      portafolioId: movilidad.id,
      preguntas: {
        create: [
          {
            enunciado: "¿Qué falta en el cruce?",
            tipo: "OPCION_MULTIPLE",
            orden: 1,
            obligatoria: true,
            opciones: { create: [{ texto: "Paso cebra", orden: 1 }, { texto: "Semáforo", orden: 2 }, { texto: "Señal de pare", orden: 3 }] },
          },
          { enunciado: "Marque la ubicación del cruce", tipo: "UBICACION_GPS", orden: 2, obligatoria: true },
        ],
      },
    },
  });

  // Formulario CERRADO
  await prisma.formulario.create({
    data: {
      titulo: "Diagnóstico de alumbrado 2025",
      descripcion: "Levantamiento de luminarias dañadas realizado el año anterior.",
      consentimiento,
      estado: "CERRADO",
      portafolioId: movilidad.id,
      preguntas: { create: [{ enunciado: "¿La luminaria funciona?", tipo: "SI_NO", orden: 1, obligatoria: true }] },
    },
  });

  // Portafolio 2: Ambiente y residuos (un borrador sin preguntas: demuestra "no se publica sin preguntas")
  const ambiente = await prisma.portafolio.create({
    data: {
      nombre: "Ambiente y residuos",
      descripcion: "Puntos críticos de basura, quebradas contaminadas y áreas verdes descuidadas.",
      creadorId: "usr-investigador",
    },
  });
  await prisma.formulario.create({
    data: {
      titulo: "Puntos críticos de basura",
      descripcion: "Ayúdanos a ubicar los lugares donde se acumula basura fuera del horario de recolección.",
      consentimiento,
      portafolioId: ambiente.id,
    },
  });

  // Portafolio 3: vacío (demuestra que sí se puede eliminar)
  await prisma.portafolio.create({
    data: { nombre: "Espacios públicos", descripcion: "Parques, canchas y plazas del cantón.", creadorId: "usr-investigador" },
  });

  console.log("✔ Datos de demostración creados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
