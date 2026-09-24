# QA y entregables - Punta Cana Academy

Fecha de revision: 2026-09-23

## Validaciones ejecutadas

- `npm run build`: exitoso.
- 22 rutas de App Router generadas correctamente.
- Diagnostico del editor en las rutas nuevas de cursos: sin errores de compilacion.
- El flujo activo de contenido usa `course_units -> unit_topics -> topic_resources`.
- El progreso activo del estudiante usa `topic_progress`.
- La ruta legacy del profesor `/dashboard/teacher/course/[id]/modules` redirige al editor canonico.
- La ruta legacy del estudiante `/dashboard/student/course/[courseId]/lesson/[lessonId]` redirige al overview del curso.

## Resultado del lint

`npm run lint` sigue fallando por deuda tecnica existente en el repositorio:

- 313 errores y 158 advertencias en el proyecto completo.
- La mayoria son usos de `any`, dependencias de hooks y reglas de React.
- La validacion acotada de las paginas modificadas reporta 35 errores y 12 advertencias, principalmente heredados de esas mismas reglas.
- Se corrigio la combinacion conflictiva `block flex` en el formulario de retroalimentacion del profesor.

No se recomienda mezclar una refactorizacion global de tipos/hooks con esta entrega visual y de flujo.

## Pruebas manuales pendientes

### Autenticacion

- Registrar un estudiante nuevo y verificar el correo.
- Iniciar sesion como estudiante y como profesor.
- Confirmar que cada rol llega a su dashboard correcto.
- Confirmar que una sesion expirada redirige a login sin dejar pantallas bloqueadas.

### Flujo del estudiante

- Inscribirse en un curso publicado.
- Abrir el overview del curso.
- Expandir unidades y abrir varios temas.
- Marcar introduccion, video, PDF y tema como completados.
- Confirmar que el porcentaje se actualiza en sidebar y dashboard.
- Completar un quiz y comprobar que el intento queda guardado.
- Verificar tareas, examenes y notificaciones recibidas.

### Flujo del profesor

- Crear un curso y publicarlo.
- Crear unidades, temas y recursos desde el editor canonico.
- Editar un recurso de video, PDF y enlace.
- Publicar una tarea para todos los estudiantes.
- Publicar una tarea para estudiantes seleccionados.
- Crear un examen con preguntas y limite de tiempo.
- Revisar una entrega y guardar calificacion y retroalimentacion.
- Confirmar que el estudiante ve los contenidos asignados.

### Seguridad y datos

- Probar lecturas y escrituras con RLS usando cuentas de estudiante y profesor.
- Confirmar que un estudiante no puede consultar cursos no publicados o de otro profesor.
- Confirmar que un profesor no puede modificar cursos ajenos.
- Probar estados vacios: sin cursos, sin temas, sin recursos, sin tareas y sin notificaciones.
- Probar viewport movil en login, registro, dashboards, overview y visor de temas.

## Riesgos abiertos

1. Existen scripts y rutas antiguas que todavia mencionan `course_lessons`, `course_modules` y `lesson_progress`. Ya no participan en el recorrido principal, pero deben eliminarse despues de confirmar que no hay datos historicos que migrar.
2. El endpoint `/api/lessons/[lessonId]/complete` se conserva por compatibilidad, aunque el visor activo registra en `topic_progress`.
3. Supabase, RLS, correo y datos reales no pueden validarse completamente desde la build local.
4. La convencion `middleware` de Next.js 16 aparece como deprecated y debe migrarse a `proxy` en una tarea independiente.
5. El lint global necesita una fase separada de saneamiento tipado y de hooks.

## Orden recomendado para el siguiente ciclo

1. Ejecutar las pruebas manuales con un estudiante y un profesor reales de Supabase.
2. Revisar logs de navegador y respuestas REST durante crear curso, crear tarea, crear examen y completar tema.
3. Confirmar politicas RLS con una matriz de permisos por rol.
4. Migrar o retirar tablas legacy cuando los datos antiguos esten respaldados.
5. Abordar el lint por carpetas, empezando por hooks y utilidades compartidas.
6. Migrar `middleware` a `proxy` despues de confirmar el comportamiento en produccion.

## Estado de entrega

La base visual, los dashboards y el flujo canonico de cursos estan implementados y compilan correctamente. La academia esta lista para una ronda de QA funcional con datos reales; no debe declararse lista para produccion hasta completar las pruebas manuales y de RLS anteriores.
