# Borrador de Politica de Privacidad

Producto: Cuentas Claras
Estado: borrador para revision legal y aprobacion humana.
Fecha del borrador: 2026-06-20

Este documento es un borrador operativo para preparar pruebas internas en
Android. No es asesoria legal y no debe publicarse como politica final hasta que
una persona autorizada confirme el responsable legal, datos de contacto,
jurisdiccion, URL publica y respuestas de Google Play Data Safety.

## Responsable

Pendiente de decision humana:

- Nombre legal del responsable.
- Pais o jurisdiccion.
- Correo de privacidad o soporte.
- URL publica de esta politica.

## Alcance

Cuentas Claras ayuda a grupos pequenos a registrar gastos compartidos, ver quien
debe pagar, quien debe recibir y marcar arreglos como pagados. En la version
actual la app funciona de forma local en el dispositivo.

La app actual no ejecuta pagos reales, transferencias, SPEI, cargos a tarjeta,
open banking ni servicios financieros regulados. Las acciones de liquidacion
solo registran estado local dentro de la app.

## Datos Que La App Guarda Localmente

La version actual puede guardar en el dispositivo:

- Grupos, nombres de integrantes y descripciones.
- Gastos, conceptos, montos en MXN, fechas, notas y quien pago.
- Sugerencias y registros locales de liquidaciones marcadas como pagadas.
- Historial de actividad derivado de gastos y liquidaciones.
- Datos de cuenta demo local, como nombre para mostrar y correo capturado por la
  interfaz demo.
- Identificadores locales para usuarios demo, membresias de grupo,
  participantes de gastos y cola local de sincronizacion pendiente. Estos
  identificadores preparan una arquitectura futura, pero no sincronizan datos en
  la version actual.
- Preferencias y estado necesario para restaurar la experiencia local.

Estos datos se guardan con almacenamiento local de la app. En la version actual
no se envian a un backend de Cuentas Claras.

## Datos Que La App No Recopila En La Version Actual

La version actual no recopila ni transmite a servidores de Cuentas Claras:

- Ubicacion precisa o aproximada.
- Contactos del dispositivo.
- Fotos, archivos o recibos.
- Informacion bancaria, tarjetas, CLABE, SPEI o credenciales financieras.
- Identificadores publicitarios.
- Datos de analitica, publicidad o rastreo de terceros.

Google Play, el sistema operativo o servicios de distribucion pueden procesar
datos tecnicos conforme a sus propias politicas. Ese procesamiento no lo define
esta app local.

## Finalidades

Los datos locales se usan para:

- Calcular balances y sugerencias de pago dentro del grupo.
- Mostrar historial de gastos y liquidaciones.
- Mantener datos de demo y cambios locales entre sesiones.
- Permitir pruebas internas sin backend ni cuentas reales.

## Comparticion

En la version actual Cuentas Claras no comparte datos de usuario con terceros
desde la app. Si una persona exporta, captura pantalla, comparte el dispositivo
o copia informacion fuera de la app, esa accion queda fuera del control de
Cuentas Claras.

## Conservacion Y Eliminacion

Los datos locales permanecen en el dispositivo hasta que la persona:

- borre los datos de la app desde Android,
- desinstale la app,
- use una futura funcion de reinicio o eliminacion local, si se mantiene en el
  producto,
- o reemplace los datos con datos demo.

Antes de lanzar cuentas reales o sincronizacion en la nube, Cuentas Claras debe
ofrecer un flujo de eliminacion de cuenta y datos, ademas de una URL publica de
solicitud de eliminacion si Google Play la requiere.

## Seguridad

La version actual evita secretos, backend y pagos reales. Aun asi, los datos
locales pueden ser visibles para quien tenga acceso al dispositivo, copias de
seguridad, herramientas de desarrollo o capturas de pantalla. La seguridad final
depende tambien de las protecciones del dispositivo, como bloqueo de pantalla y
actualizaciones del sistema.

Antes de habilitar backend, cuentas reales o sincronizacion, se requiere revision
de seguridad, politica de retencion, proceso de eliminacion y manejo de
incidentes.

## Menores

La app no esta disenada para recopilar datos de menores. La edad minima,
controles parentales y redaccion final deben definirse antes de publicacion.

## Cambios A Esta Politica

La politica final debe actualizarse cuando cambien las categorias de datos,
finalidades, terceros, backend, analitica, publicidad, pagos, cuentas reales o
procesos de eliminacion.

## Contacto

Pendiente de decision humana:

- Correo de privacidad:
- Correo de soporte:
- URL de eliminacion de datos:

## Pendiente Antes De Publicar

- Confirmar responsable legal y jurisdiccion.
- Confirmar correo de privacidad/soporte.
- Hospedar esta politica en una URL publica.
- Revisar el texto con asesoria legal.
- Confirmar respuestas de Google Play Data Safety.
- Actualizar el documento si se agregan cuentas reales, backend, analitica,
  publicidad, pagos o servicios de terceros.
