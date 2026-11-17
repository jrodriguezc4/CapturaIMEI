# CapturaIMEI · Palmas de Tumaco

Asignación de celulares a trabajadores de campo: APK Android + página web + base de datos.

## Qué hay en cada carpeta

| Ubicación | Qué es |
|---|---|
| `index.html` y `config.js` (raíz) | Página web (dashboard). GitHub Pages la publica gratis. |
| `apk/` | Aplicación Android. GitHub la convierte en un archivo `.apk` automáticamente. |
| `firebase/` | Reglas y datos iniciales de la base de datos (se usan solo en la etapa 3). |
| `.github/workflows/build-apk.yml` | Las instrucciones que GitHub sigue para construir el APK. |

## Etapa 1: el APK en el celular (modo demo)
1. Pestaña **Actions** → **Construir APK** → espera el círculo verde (unos 8 minutos).
2. Entra a esa ejecución → al final, en **Artifacts**, descarga **CapturaIMEI-apk**.
3. Descomprime el zip: adentro está `app-debug.apk`. Pásalo al celular (WhatsApp, Drive o cable).
4. Ábrelo en el celular y acepta "Instalar apps de origen desconocido". Código de ingreso demo: `4521`.

## Etapa 2: la página web (modo demo)
**Settings → Pages → Source: Deploy from a branch → main / (root) → Save.**
En 1 o 2 minutos queda en `https://TU-USUARIO.github.io/CapturaIMEI/`. Usuario demo `jrodriguezc`, código `Palmas2026`.

## Etapa 3: versión oficial (datos reales y sincronización)
1. Crea el proyecto en https://console.firebase.google.com
2. **Authentication → Método de acceso → Anónimo → Habilitar.**
3. **Realtime Database → Crear base de datos** (modo bloqueado).
4. Pestaña **Reglas**: pega `firebase/reglas.json` → **Publicar**.
5. Pestaña **Datos**: ⋮ → **Importar JSON** → `firebase/datos-iniciales.json`.
6. Engranaje → **Configuración del proyecto → Tus apps → Web (</>)**. Copia `apiKey` y `databaseURL`.
7. En GitHub edita (ícono del lápiz) `config.js` y `apk/www/config.js`, pega esos dos valores y guarda (**Commit changes**).
8. GitHub construye un APK nuevo solo (repite la etapa 1 para instalarlo) y la web se actualiza sola.
9. Entra a la web con `jrodriguezc` / `Palmas2026`, cambia ese código y crea los usuarios de campo (códigos de 6 o más caracteres).

Valor del equipo, adicionales y quien entrega en el acta PDF se cambian en `config.js`.

## Cómo funciona en el celular
- **Sincronizar IMEI**: marca y modelo salen solos. Para IMEI, ICCID y línea: *Abrir \*#06#* → captura de pantalla → *Leer captura*. Android 10 o superior no deja leer el IMEI directamente a ninguna app que no sea del sistema.
- **Asignar dispositivo** (NOMBRE y CÉDULA) → **Asignar labor** → **Asignar a otro**. Cada cambio queda como una fila nueva con su fecha.
- Sin internet todo se guarda en el teléfono y se envía solo cuando hay WiFi o datos.
