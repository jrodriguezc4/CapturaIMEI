# Proyecto CapturaIMEI · Palmas de Tumaco

Responde siempre en español. El usuario no es programador: explica en lenguaje sencillo qué cambiaste.

## Qué es
Registro de qué celular de la empresa tiene cada trabajador de campo. Sin Firebase: los datos viven en el repositorio PRIVADO `jrodriguezc4/CapturaIMEI-datos`.
- `apk/` → APK Android (Capacitor 6, HTML + JS sin bundler, plugins por `window.Capacitor.Plugins`). Interfaz en `apk/www/index.html`.
- `apk/www/datos.js` → acceso a GitHub (REST, `Repo`, `enviarEventos`, `traerCambios`, `Acceso` = códigos de activación AES-GCM/PBKDF2). Lo cargan la APK y la web (`index.html` incluye `apk/www/datos.js`).
- `apk/www/valores.js` → tabla de valores de equipos y adicionales (`VALORES.buscar(marca, modelo)`); también la usa la web.
- `apk/native/` → `LectorEtiquetaPlugin.java` (ML Kit texto + códigos por recortes, incluido en la APK) y `MainActivity.java` que lo registra; `apk/scripts/patch-android.js` los copia y agrega las dependencias. `clasificarEtiqueta()` en la APK decide IMEI1/IMEI2/SN por etiquetas y posición.
- `index.html` y `config.js` (raíz) → web en GitHub Pages: Asignaciones, Personal de campo, Usuarios (crear desde Excel → hoja de QR de activación), Configuración inicial.

## Datos en el repositorio privado
- `usuarios.json` → `{usuarios:{usuario:{nombre, cedula, cargo, rol, entrega, activo, ...}}}` (sin contraseñas).
- `registros/AAAA-MM/<usuario>.json` → lista de eventos, nunca se borra: `k:"asig"` (asignaciones: tipo, fecha_ingreso, nombre, cedula, labor, entrega_por, valor_equipo, adicionales, firma, firma_entrega, estado, con_foto...), `k:"disp"` (imei2, serial, marca, modelo), `k:"pers"` (personal). `registros/2026-11/carga-inicial.json` = personal inicial.
- `firmas/<id>.png`, `evidencias/<id>.jpg`.
- Tipos: ASIGNACION, REASIGNACION, EDICION, CAMBIO_LABOR, DEVOLUCION, DANO, PERDIDA (DEVOLUCION y PERDIDA dejan el equipo libre).
- Acceso: el token fine-grained (solo ese repo, Contents RW) va cifrado con la contraseña de cada usuario en su código de activación (QR). Nunca poner un token en el código ni en `config.js`.

## Reglas importantes
- NUNCA subir Excel ni datos personales a este repositorio (es público). `*.xlsx` está en `.gitignore`. Nunca mostrar contraseñas en la conversación.
- Funciona sin internet: cola local `E.cola` (cada op con id, fecha y usuario), copias locales; sincronización incremental por sha de archivos. No romper eso.
- Labores válidas: Aplicador, Sanidad, Mantenimiento, Cosecha, Fertilización, Reubicado, Supervisor, Administrativo (cambiar en los dos HTML).
- Solo jefe, coordinador y analistas entregan actas (`entrega:true` en usuarios.json). El texto del acta está en `index.html` y en `apk/www/index.html`: cambiar los dos.
- `.github/workflows/build-apk.yml` publica Release `v1.0.<run_number>` con `CapturaIMEI.apk`; firma fija con el secreto `ANDROID_DEBUG_KEYSTORE`. La APK avisa versiones nuevas (`buscarVersion()`).
- Git: `%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe`; GitHub CLI: `%LOCALAPPDATA%\Programs\gh\bin\gh.exe` (no están en el PATH).

## Al terminar un cambio
1. Probar lo posible en el navegador (simulando GitHub si hace falta).
2. Commit con mensaje claro en español y `git push` a main.
3. Decirle al usuario: en unos 8 minutos la APK nueva queda publicada (el QR ya apunta a ella) y los celulares verán el aviso; la web se actualiza sola.
