# Proyecto CapturaIMEI · Palmas de Tumaco

Responde siempre en español. El usuario no es programador: explica en lenguaje sencillo qué cambiaste.

## Qué es
Registro de qué celular de la empresa tiene cada trabajador de campo.
- `apk/` → APK Android (Capacitor 6, HTML + JS sin bundler, plugins por `window.Capacitor.Plugins`). Toda la interfaz está en `apk/www/index.html`. Es un **escáner** que usa el grupo de trabajo de jrodriguezc (usuario + código): lee IMEI 1, IMEI 2 y SN de los equipos (foto de la etiqueta con ML Kit `readBarcodesFromImage`, o `scan()` por campo) y los asigna a un trabajador (búsqueda en la base de personal o registro manual) con su labor.
- `index.html` y `config.js` (raíz) → Dashboard web en GitHub Pages: pestaña Asignaciones (tabla tipo Excel, filtros por labor, búsqueda, acta PDF con jsPDF, exportar Excel con SheetJS) y pestaña Personal de campo (agregar, editar, quitar, subir/descargar Excel).
- `firebase/` → Reglas de Firebase Realtime Database (JSON). Acceso por REST + sesión anónima validada con el código (sha256 de "palmas-tumaco:" + código, nodo `codigos/{hash}`).
- Nodos: `usuarios`, `codigos`, `sesiones`, `dispositivos/{imei}` (imei2, serial, marca, modelo), `asignaciones/{uuid}` (historial, nunca se sobrescribe), `personal/{cedula}` (nombre, cedula, labor, activo).
- `.github/workflows/build-apk.yml` → GitHub Actions construye el APK cuando cambia `apk/` y lo publica como Release `v1.0.<run_number>` con el archivo `CapturaIMEI.apk` (versionCode = run_number, lo pone `apk/scripts/patch-android.js`). Firma fija con el secreto `ANDROID_DEBUG_KEYSTORE`.
- La APK (`buscarVersion()` en `apk/www/index.html`) consulta `releases/latest` de GitHub y muestra la franja "Versión nueva disponible" si el número es mayor. No debe bloquear el modo sin internet.
- `descargar.html` (raíz, GitHub Pages) y `docs/qr-descarga.png` → QR al enlace fijo `releases/latest/download/CapturaIMEI.apk`. `docs/mejoras-futuras.html/.png` → diseños propuestos.
- Git en este equipo: `%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe`; GitHub CLI: `%LOCALAPPDATA%\Programs\gh\bin\gh.exe` (no están en el PATH).

## Reglas importantes
- Funciona sin internet: la APK guarda una cola local (`E.cola`) y copias de personal, dispositivos y asignación vigente; sincroniza de forma incremental (orderBy actualizado_en / registrado_en). No romper eso.
- Labores válidas: Aplicador, Sanidad, Mantenimiento, Cosecha, Fertilización, Reubicado, Supervisor, Administrativo. Si se agrega una, cambiarla en `index.html`, `apk/www/index.html` y `firebase/reglas.json`.
- Si un cambio toca `firebase/reglas.json`, recordar al usuario que debe pegarlas en la consola de Firebase (no se aplican solas).
- Nunca sobrescribir `config.js` ni `apk/www/config.js`: tienen las claves reales de Firebase.
- Mantener el modo demo (cuando `config.js` contiene TU_PROYECTO).

## Al terminar un cambio
1. Probar lo posible (abrir el HTML en el navegador en modo demo).
2. Commit con mensaje claro en español y `git push` a main.
3. Decirle al usuario: en unos 8 minutos el APK nuevo queda publicado en Releases (el QR ya apunta a él) y los celulares verán el aviso de versión nueva; la web se actualiza sola.
