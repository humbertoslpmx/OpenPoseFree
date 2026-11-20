# ⚡ OpenPoseFree — AI Pose Editor & Video Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%2F%20HTML5%20%2F%20JS-brightgreen.svg)](#)
[![AI Engine](https://img.shields.io/badge/AI-MediaPipe%20Holistic%20%26%20MoveNet-purple.svg)](#)
[![ControlNet Compatible](https://img.shields.io/badge/ControlNet-OpenPose%20Full%20%26%20Body-orange.svg)](#)

**OpenPoseFree** es una suite completa, moderna, gratuita y de código abierto para la creación, edición y generación de poses humanas en formato **OpenPose** para imágenes estáticas y **videos completos frame a frame con Inteligencia Artificial**.

Diseñado para ejecutarse 100% en el navegador web (del lado del cliente y sin servidores externos), produce esqueletos limpios sobre fondo negro puro (`#000000`) compatibles con **ControlNet**, **Stable Diffusion**, **AnimateDiff**, **ComfyUI** y **Automatic1111**.

---

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-HumbertoCisneros-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/humbertocisneros)

## 🎭 Dos Ediciones Incluidas

El repositorio incluye dos versiones según la profundidad anatómica que necesites:

| Edición | Archivo Principal | Modelo de IA | Puntos Anatómicos Detectados | Ideal para |
| :--- | :--- | :---: | :---: | :--- |
| **OpenPoseFree Holistic** | `openposefree-holistic/index.html` | **Google MediaPipe Holistic** | **543 puntos en simultáneo**<br>• Cuerpo (33 pts)<br>• Manos completas (42 pts, todas las falanges)<br>• Malla facial (468 pts, ojos, labios, cejas)<br>• Pies (talones y dedos) | ControlNet OpenPose Full, animación de baile, gesticulación de manos, expresiones faciales. |
| **OpenPoseFree Standard** | `rkopenpose.html` | **Google MoveNet**<br>(Thunder / Lightning) | **18 puntos OpenPose COCO**<br>• Torso, cabeza y extremidades principales | Poses corporales rápidas, baja carga de CPU/GPU, equipos modestos. |

---

## 📥 Instrucciones de Descarga

Puedes descargar el proyecto a tu computadora de dos formas sencillas:

### Método 1: Descarga directa en archivo ZIP (Sin instalar programas)
1. En la página principal del repositorio en GitHub, haz clic en el botón verde **Code** (esquina superior derecha).
2. Selecciona **Download ZIP**.
3. Descomprime el archivo `.zip` en cualquier carpeta de tu equipo (por ejemplo, en tus Documentos o Escritorio).

### Método 2: Clonando con Git (Para desarrolladores)
Abre tu terminal o consola de comandos y ejecuta:
```bash
git clone https://github.com/TU-USUARIO/openposefree.git
cd openposefree
```

---

## 🚀 Instrucciones de Ejecución en Local

OpenPoseFree está construido exclusivamente con **HTML5, CSS3 y JavaScript moderno**. No requiere compilación, ni `npm install`, ni bases de datos.

### Opción A: Ejecución Directa (Doble Clic)
1. Abre la carpeta donde descargaste el proyecto.
2. Haz doble clic en el archivo que deseas utilizar:
   * **Edición Holistic (Recomendada con Manos y Cara):** entra a la carpeta `openposefree-holistic` y abre `index.html`.
   * **Edición Estándar (Cuerpo):** abre directamente `rkopenpose.html`.
3. Tu navegador web predeterminado abrirá la aplicación al instante.

---

### Opción B: Ejecución con Servidor Local Ligero (Recomendada)
> **💡 ¿Por qué se recomienda un servidor local?**  
> Algunos navegadores aplican restricciones de seguridad estrictas al protocolo `file:///` con videos locales pesados y llamadas WebAssembly. Iniciar un servidor local de una sola línea garantiza el 100% de rendimiento, fluidez y aceleración WebGL sin bloqueos de sandbox.

Elige **cualquiera** de estas alternativas en tu terminal dentro de la carpeta del proyecto:

#### Con Python (Disponible por defecto en Windows, Mac y Linux):
```bash
# Python 3
python -m http.server 8080
```
> Luego abre en tu navegador: [http://localhost:8080](http://localhost:8080)  
> (O para la versión Holistic: `http://localhost:8080/openposefree-holistic/`)

#### Con Node.js / npx:
```bash
npx serve .
# o también:
npx http-server -p 8080
```

#### Con VS Code:
Instala la extensión **Live Server** de *Ritwick Dey*, haz clic derecho sobre `rkopenpose.html` o `openposefree-holistic/index.html` y selecciona **Open with Live Server**.

#### Con PHP:
```bash
php -S localhost:8080
```

---

## ✨ Características y Herramientas

* 🤖 **Detección con IA en Foto y Video:** Carga fotos o videos para detectar y extraer la pose humana de manera automática.
* 🎬 **Generador de Video OpenPose:** Procesa frame a frame videos completos o rangos seleccionados (Inicio / Fin) y exporta el video resultante a framerate constante (15, 24 o 30 FPS) en:
  * **`.mp4`** (H.264 / AVC nativo de alta compatibilidad).
  * **`.mkv`** (Matroska).
  * **`.webm`** (VP9).
* 👁 **Visualización en Vivo en el Canvas:** Mientras el video se procesa fotograma a fotograma, el lienzo interactivo actualiza y baila en tiempo real con las poses obtenidas.
* 🦴 **Modo Hueso (Cinemática):** Activa este modo para mover extremidades en cadena conservando la proporción anatómica al desplazar articulaciones como hombros o caderas.
* 🔲 **Selección por Zona y Escalado:** Dibuja un rectángulo con el puntero para agrupar articulaciones y tira de las manijas de la caja para agrandar o achicar el esqueleto a resoluciones altas (512x512, 768x768, 1024x1024).
* 🖼 **Guía Traslúcida:** Superpone el fotograma del video original con control de opacidad ajustable para calcar o perfeccionar articulaciones.
* 📋 **Exportación JSON:** Guarda poses individuales o secuencias temporales completas con coordenadas normalizadas.
* 🌐 **Soporte Multilingüe:** Interfaz bilingüe en Español e Inglés por defecto, con arquitectura modular para agregar más idiomas.

---

## 🎬 Conversión a Apple ProRes (.mov) con FFmpeg

Los navegadores web no cuentan con codificadores de Apple ProRes debido a restricciones de licencias comerciales. Si trabajas con **DaVinci Resolve**, **Adobe Premiere Pro** o **Final Cut Pro**, puedes generar tu video en formato **MP4** y convertirlo en 1 segundo con **FFmpeg**:

```bash
# Convertir a Apple ProRes 422 HQ (Profile 3):
ffmpeg -i openpose-video.mp4 -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le openpose-prores.mov

# Convertir a Apple ProRes 4444 (Profile 4 - Máxima fidelidad y canal alfa):
ffmpeg -i openpose-video.mp4 -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le openpose-prores4444.mov
```

---

## 📁 Estructura del Proyecto

```text
openposefree/
├── rkopenpose.html               # Aplicación principal OpenPoseFree (Standard - MoveNet)
├── pose_detector.js              # Módulo de detección MoveNet (Thunder/Lightning)
├── openposefree-holistic/        # Suite Completa MediaPipe Holistic
│   ├── index.html                # Aplicación Holistic (Cuerpo, 42 Manos, Rostro, Pies)
│   ├── holistic_detector.js      # Motor MediaPipe Holistic (543 landmarks)
│   ├── README.md                 # Documentación técnica de Holistic Edition
│   └── LICENSE                   # Licencia MIT de la edición Holistic
├── IDIOMAS.md                    # Documentación para agregar nuevos idiomas
├── languages.example.js          # Ejemplos de paquetes de idiomas adicionales
├── LICENSE                       # Licencia MIT de OpenPoseFree
└── README.md                     # Guía principal del repositorio
```

---

## 🌐 Compatibilidad con Navegadores

| Navegador | Estado | Notas |
| :--- | :---: | :--- |
| **Google Chrome / Chromium** | 🟢 Excelente | Soporte nativo para WebGL, WebAssembly y exportación directa en MP4 (H.264), MKV y WebM. |
| **Microsoft Edge** | 🟢 Excelente | Rendimiento pleno idéntico a Chrome. |
| **Brave** | 🟢 Excelente | Funcionamiento fluido completo. |
| **Mozilla Firefox** | 🟢 Bueno | Compatible con WebM y MKV (exportación MP4 puede variar según versión). |
| **Apple Safari (macOS / iOS)** | 🟢 Bueno | Compatible con MediaPipe y exportación MP4. |

---

## 💖 Agradecimientos y Créditos

* **Rock Stevens:** Agradecemos sinceramente al autor de *Rock's Simple OpenPose Editor* (2025) por la estructura inicial de nodos y extremidades en Javascript que sirvió como base para la creación de OpenPoseFree.
* **Google MediaPipe:** Por la tecnología abierta de seguimiento holístico humano en tiempo real (MediaPipe Holistic, Apache 2.0).
* **Google TensorFlow.js:** Por la infraestructura de inferencia en navegador y el modelo MoveNet (Apache 2.0).

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.  
Eres libre de utilizar las imágenes y videos generados con esta herramienta en proyectos personales, artísticos y comerciales sin ninguna restricción.

---


---

## 👨‍💻 Autor y Desarrollador

<div align="center">
  <img src="humberto_cisneros.jpg" alt="Juan Humberto Cisneros Rodríguez" width="110" style="border-radius: 50%; border: 3px solid #7c3aed; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);" />
  <br>
  <h3>Juan Humberto Cisneros Rodríguez</h3>
  <p>
    <a href="https://humbertocisneros.myportfolio.com/">🌐 Portafolio Profesional</a> &nbsp;|&nbsp; 
    <a href="https://buymeacoffee.com/humbertocisneros">☕ Invitar un café (Buy Me a Coffee)</a>
  </p>
  <p><i>OpenPoseFree es una herramienta de software libre creada para la comunidad de creadores digitales, artistas de IA y animadores. Siéntete libre de utilizarla en tus proyectos personales y comerciales. Si te ha sido de utilidad, ¡considera apoyar su desarrollo continuo con una donación!</i></p>
</div>

## ☕ Apoyar el Proyecto / Donaciones

Si **OpenPoseFree** te ha sido de utilidad para tus proyectos de animación, inteligencia artificial o generación con ControlNet, ¡puedes apoyar el desarrollo continuo invitándome un café!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-HumbertoCisneros-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/humbertocisneros)

👉 **Enlace directo:** [buymeacoffee.com/humbertocisneros](https://buymeacoffee.com/humbertocisneros)
