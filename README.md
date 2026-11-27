# CapturaIMEI · Palmas de Tumaco

Asignación de celulares a trabajadores de campo: APK Android + página web. Los datos se guardan en un repositorio **privado** de GitHub (`jrodriguezc4/CapturaIMEI-datos`), sin Firebase.

## Descargar la APK (código QR)
![QR de descarga](docs/qr-descarga.png)

- Enlace fijo, siempre a la última versión: https://github.com/jrodriguezc4/CapturaIMEI/releases/latest/download/CapturaIMEI.apk
- Página para compartir: https://jrodriguezc4.github.io/CapturaIMEI/descargar.html
- Página web (panel): https://jrodriguezc4.github.io/CapturaIMEI/

## Qué hay en cada carpeta
| Ubicación | Qué es |
|---|---|
| `index.html`, `config.js` | Página web (GitHub Pages). |
| `apk/www/` | La APK: `index.html` (pantallas), `datos.js` (base de datos en GitHub, también la usa la web), `valores.js` (tabla de valores de los equipos), `lib/` (PDF sin internet). |
| `apk/native/` | Lector de etiquetas propio (Java): lee texto y códigos de barras de la foto, sin internet. |
| `.github/workflows/build-apk.yml` | GitHub construye y publica la APK sola cada vez que cambia `apk/`. |

Los archivos Excel (`*.xlsx`) **nunca** se suben a este repositorio (es público): están en `.gitignore`.

## Puesta en marcha (una sola vez)
1. **Token de GitHub** (lo creas tú): github.com → foto → *Settings* → *Developer settings* → *Personal access tokens* → *Fine-grained tokens* → *Generate new token*.
   - *Repository access*: **Only select repositories** → `CapturaIMEI-datos`.
   - *Permissions* → *Repository permissions* → **Contents: Read and write**.
   - Vencimiento: el más largo que permita. Cuando venza, se crea otro y se repite el paso 2.
2. **Configuración inicial** en la web: *Configuración inicial (administrador)* → pega el token, tu usuario (`jrodriguezc`), tu nombre y tu contraseña (la del Excel). El token queda cifrado con tu contraseña.
3. Entra a la web → **Usuarios** → **Crear usuarios desde Excel** → sube `Credenciales Usuarios.xlsx`. Se abre una hoja con el **QR de activación** de cada persona (sin contraseñas). Imprímela o envía a cada uno su QR.
4. Cada persona instala la APK (QR de arriba) → **Activar este teléfono** → escanea su QR → entra con su usuario y contraseña.

El personal de campo (347 personas de `Personal Palmaco.xlsx`) ya está cargado. Para actualizarlo: web → *Personal de campo* → *Subir Excel*.

## Inventario y novedades
- Cada equipo está en un estado: **Activo (asignado)**, **En bodega**, **Dañado**, **Perdido** o **En reparación**. La web (arriba de la tabla) y la APK (en el resumen) muestran cuántos hay en cada uno; al tocar uno se filtra la lista.
- **Buscar**: por nombre, cédula, IMEI, SN, marca o modelo (web: cuadro de búsqueda; APK: "Buscar equipo o trabajador").
- **Novedad**: dañado, perdido en campo, enviado a reparación, devuelto a bodega, reparado o recuperado (web: botón *Novedad* en la fila; APK: abrir el equipo → *Reportar novedad*). Las opciones dependen del estado actual.

## Firmas guardadas
- Cada responsable puede tener su firma guardada (web → Usuarios → *Subir firma*: se limpia el fondo sola). Se pone automáticamente en "QUIEN ENTREGA" de sus actas. Se guarda en el repositorio **privado** (`firmas/usuarios/`).

## Roles
- **Jefe y coordinador**: administradores (crean y desactivan usuarios).
- **Jefe, coordinador, analistas e ingeniero de métodos**: pueden **entregar actas**. En la APK se elige quién entrega; su nombre y cargo salen en "QUIEN ENTREGA", con su firma opcional, y el trabajador firma en "QUIEN RECIBE".
- Auxiliares: registran y asignan, pero el acta la entrega uno de los responsables.

## Tabla de valores
`apk/www/valores.js` (de `Tabla de valores dispositivos.xlsx`). En la APK se elige el equipo de la lista y su valor sale en el acta, junto con los adicionales marcados (Forro, Vidrio, Estuche, Piernera). Para cambiar precios se edita ese archivo.

## Funciones de la APK
- **Foto de la etiqueta**: el lector propio lee el texto ("IMEI1", "IMEI 2", "S/N", "Model") y los códigos de barras (también en recortes ampliados) y empareja cada número con su etiqueta. Los IMEI se validan con el dígito de control. Revisa siempre lo leído.
- **Resumen de hoy**, **lote** (varios equipos seguidos), **firma y acta PDF** en el celular, **devolución / daño / pérdida** con foto, historial del equipo.
- Sin internet todo se guarda en el teléfono y se envía solo cuando hay señal. Cada versión nueva se avisa sola (franja naranja).

## Seguridad
- Desactivar un usuario en la web le cierra el acceso en su próxima sincronización.
- Si se pierde un teléfono o alguien sale de la empresa: desactívalo y, para cortar todo acceso, crea un token nuevo (paso 1–3 otra vez) y borra el anterior en GitHub.
- Llave de firma de la APK: `Documentos\CapturaIMEI-firma` (no borrar).
