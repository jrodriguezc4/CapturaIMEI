package co.com.palmastumaco.dispositivos;

import android.content.ContentResolver;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.net.Uri;

import androidx.exifinterface.media.ExifInterface;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.io.File;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lector de etiquetas de celulares (funciona sin internet, con ML Kit de Google incluido en la APK).
 * - Lee todo el TEXTO de la foto con su posición ("IMEI1", "IMEI 2", "S/N", números...).
 * - Lee los CÓDIGOS DE BARRAS de la foto completa y además de recortes ampliados
 *   (2 columnas x 3 filas, que se solapan), porque en la foto completa los códigos pequeños se pierden.
 * La APK (apk/www/index.html, clasificarEtiqueta) usa las posiciones para saber cuál es IMEI 1, IMEI 2 y SN.
 */
@CapacitorPlugin(name = "LectorEtiqueta")
public class LectorEtiquetaPlugin extends Plugin {

    @PluginMethod
    public void analizar(PluginCall call) {
        final String ruta = call.getString("ruta");
        if (ruta == null || ruta.isEmpty()) { call.reject("Falta la foto"); return; }
        new Thread(() -> {
            TextRecognizer textos = null;
            BarcodeScanner codigos = null;
            try {
                Bitmap foto = cargar(ruta);
                int ancho = foto.getWidth(), alto = foto.getHeight();
                textos = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
                codigos = BarcodeScanning.getClient(new BarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS).build());

                // 1. Texto con posición
                JSArray lineas = new JSArray();
                Text t = Tasks.await(textos.process(InputImage.fromBitmap(foto, 0)));
                for (Text.TextBlock bloque : t.getTextBlocks()) {
                    for (Text.Line linea : bloque.getLines()) {
                        Rect r = linea.getBoundingBox();
                        if (r == null) continue;
                        JSObject o = caja(r.left, r.top, r.width(), r.height());
                        o.put("texto", linea.getText());
                        lineas.put(o);
                    }
                }

                // 2. Códigos de barras: foto completa + recortes ampliados
                Map<String, JSObject> vistos = new LinkedHashMap<>();
                agregar(vistos, Tasks.await(codigos.process(InputImage.fromBitmap(foto, 0))), 0, 0, 1f);
                int cols = 2, filas = 3;
                float solape = 0.3f;
                int tw = Math.round(ancho / (cols - (cols - 1) * solape));
                int th = Math.round(alto / (filas - (filas - 1) * solape));
                for (int i = 0; i < filas; i++) {
                    for (int j = 0; j < cols; j++) {
                        int x = Math.min(Math.round(j * tw * (1 - solape)), Math.max(0, ancho - tw));
                        int y = Math.min(Math.round(i * th * (1 - solape)), Math.max(0, alto - th));
                        int w = Math.min(tw, ancho - x), h = Math.min(th, alto - y);
                        if (w < 50 || h < 50) continue;
                        Bitmap recorte = Bitmap.createBitmap(foto, x, y, w, h);
                        float escala = 1f;
                        if (w < 1400) {
                            escala = 1400f / w;
                            recorte = Bitmap.createScaledBitmap(recorte, Math.round(w * escala), Math.round(h * escala), true);
                        }
                        agregar(vistos, Tasks.await(codigos.process(InputImage.fromBitmap(recorte, 0))), x, y, escala);
                    }
                }
                JSArray lista = new JSArray();
                for (JSObject o : vistos.values()) lista.put(o);

                JSObject res = new JSObject();
                res.put("ancho", ancho);
                res.put("alto", alto);
                res.put("lineas", lineas);
                res.put("codigos", lista);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("No se pudo leer la foto: " + e.getMessage(), e);
            } finally {
                if (textos != null) textos.close();
                if (codigos != null) codigos.close();
            }
        }).start();
    }

    private static JSObject caja(int x, int y, int w, int h) {
        JSObject o = new JSObject();
        o.put("x", x); o.put("y", y); o.put("w", w); o.put("h", h);
        return o;
    }

    // Guarda cada código una sola vez, con su posición en la foto completa
    private static void agregar(Map<String, JSObject> vistos, List<Barcode> lista, int dx, int dy, float escala) {
        for (Barcode b : lista) {
            String v = b.getRawValue();
            if (v == null || v.trim().isEmpty() || vistos.containsKey(v)) continue;
            Rect r = b.getBoundingBox();
            JSObject o = r == null ? caja(0, 0, 0, 0)
                    : caja(dx + Math.round(r.left / escala), dy + Math.round(r.top / escala), Math.round(r.width() / escala), Math.round(r.height() / escala));
            o.put("valor", v.trim());
            o.put("formato", b.getFormat());
            vistos.put(v, o);
        }
    }

    // Abre la foto (respetando el giro de la cámara) sin pasarse de memoria
    private Bitmap cargar(String ruta) throws Exception {
        Uri uri = (ruta.startsWith("file:") || ruta.startsWith("content:")) ? Uri.parse(ruta) : Uri.fromFile(new File(ruta));
        ContentResolver cr = getContext().getContentResolver();
        BitmapFactory.Options medidas = new BitmapFactory.Options();
        medidas.inJustDecodeBounds = true;
        try (InputStream in = cr.openInputStream(uri)) { BitmapFactory.decodeStream(in, null, medidas); }
        int lado = Math.max(medidas.outWidth, medidas.outHeight), muestra = 1;
        while (lado / muestra > 4200) muestra *= 2;
        BitmapFactory.Options op = new BitmapFactory.Options();
        op.inSampleSize = muestra;
        Bitmap b;
        try (InputStream in = cr.openInputStream(uri)) { b = BitmapFactory.decodeStream(in, null, op); }
        if (b == null) throw new Exception("formato de imagen no reconocido");
        int giro = 0;
        try (InputStream in = cr.openInputStream(uri)) {
            int o = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            if (o == ExifInterface.ORIENTATION_ROTATE_90) giro = 90;
            else if (o == ExifInterface.ORIENTATION_ROTATE_180) giro = 180;
            else if (o == ExifInterface.ORIENTATION_ROTATE_270) giro = 270;
        } catch (Exception ignorar) { }
        if (giro != 0) {
            Matrix m = new Matrix();
            m.postRotate(giro);
            b = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
        }
        return b;
    }
}
