package co.com.palmastumaco.dispositivos;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

// Registra el lector de etiquetas propio de la app (LectorEtiquetaPlugin) antes de iniciar Capacitor
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LectorEtiquetaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
