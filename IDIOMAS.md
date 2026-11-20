# Sistema de Idiomas / Multilingual Support - OpenPoseFree

OpenPoseFree cuenta con un sistema de internacionalización (i18n) ligero, modular y 100% independiente (funciona offline sin necesidad de conexión a internet ni servidores).

---

## 🌐 Idiomas incluidos por defecto

1. **Español (`es`)** - Interfaz completamente adaptada al español.
2. **Inglés (`en`)** - Interfaz en inglés.

La aplicación detecta automáticamente el idioma de tu navegador o carga la última preferencia seleccionada por el usuario (almacenada en `localStorage`). Además, puedes cambiar de idioma en cualquier momento usando el menú desplegable en la barra de navegación superior.

---

## 🚀 Cómo agregar más idiomas

Puedes agregar tantos idiomas como desees de dos formas sencillas:

### Método 1: Agregando el idioma directamente en `rkopenpose.html`

Abre `rkopenpose.html` con un editor de texto (o bloc de notas), localiza la sección de idiomas y agrega tu nuevo idioma con `i18n.registerLanguage`:

```javascript
i18n.registerLanguage('de', 'Deutsch', {
  title: "OpenPoseFree",
  languageLabel: "🌐 Sprache / Language:",
  instructions: {
    step1: "Schritt 1. Leinwandgröße wählen (Größe des ausgegebenen PNG-Bildes).",
    step2: "Schritt 2. Voreinstellung wählen oder gespeicherte JSON-Datei laden.",
    step3: "Schritt 3. Pose anpassen (Gelenke ziehen).",
    step4: "Schritt 4. PNG-Datei für OpenPose ControlNet exportieren."
  },
  canvasSize: {
    label: "Leinwandgröße wählen (Größe des OpenPose PNG-Bildes)"
  },
  presets: {
    label: "Posen-Voreinstellungen",
    loadBtn: "Laden",
    options: {
      "Set 1": "Offene Arme - Frontansicht",
      // ... otras opciones
    }
  },
  json: {
    loadLabel: "JSON-Datei laden",
    saveLabel: "JSON-Datei speichern",
    saveBtn: "JSON speichern",
    invalidJson: "Ungültige JSON-Datei."
  },
  joystick: {
    shiftLabel: "Verschieben:",
    up: "Nach oben",
    left: "Nach links",
    right: "Nach rechts",
    down: "Nach unten"
  },
  export: {
    label: "PNG-Datei für OpenPose speichern",
    exportBtn: "PNG exportieren"
  },
  footer: {
    text: "Laden Sie eine eigenständige Offline-Version herunter unter"
  }
});
```

El menú desplegable detectará automáticamente el nuevo idioma y estará disponible de inmediato.

---

### Método 2: Incluyendo un archivo externo (por ejemplo, `languages.example.js`)

Si prefieres mantener tus idiomas en un archivo separado, puedes crear un archivo `.js` y enlazarlo en `rkopenpose.html`:

```html
<script src="languages.example.js"></script>
```

Hemos incluido el archivo `languages.example.js` con traducciones de ejemplo en **Francés (`fr`)** y **Portugués (`pt`)**.
