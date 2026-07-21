# Borrador de Política de Privacidad de En Obra

**Estado:** borrador operativo. No publicar sin revisión legal y aprobación del responsable del producto.

**Última actualización del borrador:** 2026-07-21

## Responsable

Pendiente de completar por el propietario del producto:

- Nombre legal del responsable:
- País y jurisdicción:
- Correo de privacidad:
- Correo de soporte:
- URL pública de esta política:
- URL de solicitud de eliminación de datos:

## Alcance

En Obra ayuda a prestadores de servicios pequeños a organizar trabajos, materiales y conversaciones con proveedores, y a preparar una actualización segura para el cliente que la persona puede copiar o enviar manualmente (por ejemplo, por WhatsApp).

En Obra no procesa pagos entre clientes, prestadores o proveedores; tampoco es banco, procesador de pagos ni asesor financiero, contable, fiscal o legal.

**Versión piloto actual:** la aplicación guarda datos **solo en el dispositivo**. No hay cuentas en la nube, sincronización remota, enlaces públicos para clientes, conexión activa a Google Drive ni suscripciones cobradas en esta versión.

## Datos del piloto actual

La aplicación puede guardar localmente:

- trabajos (nombre, cliente, teléfono y dirección opcional, servicio, fechas);
- proveedores (nombre, teléfono opcional, categoría, nota de último contacto);
- materiales (nombre, cantidad, estado de pedido/entrega/uso, fechas, notas de recepción, montos de referencia cuando la persona los registra).

**No se transmiten** estos registros a servidores de En Obra. El almacenamiento es local en el dispositivo mediante AsyncStorage. No debe presentarse como respaldo en la nube ni como almacenamiento cifrado de extremo a extremo. Una persona con acceso al dispositivo, copias de seguridad del sistema, herramientas de desarrollo o capturas de pantalla podría ver la información local.

### Claves de almacenamiento (referencia técnica)

- `en-obra-tracker-v2` — datos de usuario
- `en-obra-tracker-demo-v2` — datos de demostración aislados
- `en-obra-tracker-recovery` — copia de recuperación antes de migración/reparación
- `cuenta-obra-tracker-v1` — migración desde versión anterior (solo lectura)

## Permisos y copias de seguridad de Android

La configuración actual del manifiesto (`app.json`) declara **lista vacía de permisos** adicionales solicitados por la app. En Obra no solicita ubicación, contactos, cámara ni almacenamiento amplio en esta versión piloto.

Las copias de seguridad automáticas de Android (Google Backup) pueden incluir datos de aplicaciones según la configuración del dispositivo y del sistema operativo. En Obra **no afirma** controlar ni excluir esas copias en el piloto actual. Antes de producción, la política final debe alinearse con la configuración real de backup/restore en el manifiesto de release.

## Datos que el piloto no recopila ni transmite

La versión actual no recopila ni transmite desde la aplicación:

- ubicación precisa o aproximada;
- contactos del dispositivo;
- fotos, videos o archivos adjuntos;
- datos bancarios, tarjetas, CLABE o SPEI;
- identificadores publicitarios, analítica, publicidad ni rastreo de terceros.

Google Play, el sistema operativo y los servicios de distribución pueden tratar datos técnicos conforme a sus propias políticas. Ese tratamiento no lo define este piloto local.

## WhatsApp y compartir manualmente

Cuando la persona elige contactar a un proveedor o compartir un avance con un cliente, En Obra puede abrir WhatsApp u otra app instalada con un texto prefabricado. Ese envío ocurre **fuera** de En Obra y bajo las políticas del servicio de mensajería elegido.

## Uso de los datos locales

Los registros locales se usan exclusivamente para:

- mostrar el avance de un trabajo;
- recordar el siguiente material a pedir o recibir;
- conservar una nota del proveedor;
- preparar una actualización segura para el cliente.

## Futuras funciones que requieren actualización antes de activarse

Antes de lanzar cuentas, sincronización, soporte con acceso a datos, analítica, suscripciones o Google Drive, esta política deberá actualizarse para describir identidad de cuenta, autenticación, backend, región, medidas de seguridad, enlaces de clientes, metodatos de comprobantes, facturación, soporte, conservación, exportación, eliminación y copias de seguridad.

## Conservación y eliminación

En el piloto actual, los datos locales permanecen hasta que la persona borra datos de la aplicación en ajustes del sistema o desinstala la app. No hay eliminación remota porque no hay backend.

Antes de una versión con cuentas reales, En Obra debe ofrecer eliminación de cuenta desde la aplicación, una vía pública para solicitarla y un proceso verificable para eliminar datos remotos y revocar enlaces de clientes.

## Seguridad

Antes de lanzar servicios en la nube, En Obra debe implementar controles de acceso por prestador, transporte cifrado, manejo seguro de secretos, registros operativos minimizados, copias de seguridad, pruebas de restauración y revisión de seguridad. Esta lista no es una afirmación de que esos controles existan hoy.

## Menores

En Obra no está diseñada para recopilar intencionalmente datos de menores. La edad mínima aplicable debe confirmarse con asesoría legal antes de publicar.

## Pendiente antes de publicar

- Confirmar responsable legal, jurisdicción y contactos.
- Definir infraestructura, conservación, respaldo, eliminación y soporte.
- Actualizar este texto con cualquier SDK, backend, Drive o facturación real.
- Revisar con asesoría legal apropiada.
- Hospedar la política aprobada en una URL pública y alinear Google Play Data Safety con el comportamiento real de la aplicación.
- Regenerar activos visuales (splash/icon) si aún muestran marcas o textos de productos anteriores.
