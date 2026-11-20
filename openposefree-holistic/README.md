# OpenPoseFree Holistic Edition ✨

**OpenPoseFree Holistic Edition** es una suite completa, moderna y 100% web para la extracción, edición y generación de poses humanas integrales en formato **OpenPose Full** utilizando **Google MediaPipe Holistic** en JavaScript.

A diferencia de los modelos básicos de cuerpo que solo detectan 17 puntos generales, esta versión extrae **543 puntos anatómicos simultáneamente**:
* 🖐 **Manos completas (42 puntos):** 21 articulaciones en cada mano (pulgar, índice, medio, anular, meñique, falanges y nudillos).
* 👤 **Malla facial completa (468 puntos):** Contornos de ojos, cejas, labios externos/internos, puente nasal y contorno de mandíbula.
* 🏃 **Cuerpo y Pies (33 puntos):** Cabeza, hombros, codos, muñecas, caderas, rodillas, tobillos, **talones y dedos de los pies**.

---

### ✨ Características Principales

| Característica | Descripción |
| --- | --- |
| 🤖 **MediaPipe Holistic (Google)** | Inferencia integral de 543 puntos en tiempo real directamente en el navegador con aceleración WebAssembly / WebGL. |
| 🎚 **Capas Anatómicas Seleccionables** | Activa o desactiva a demanda la detección y renderizado de: **Cuerpo**, **Manos (42 pts)**, **Rostro (Face Mesh)** y **Pies**. |
| ⚙️ **Complejidad del Modelo** | Elige entre **Lite (0)** para velocidad máxima, **Full (1)** para equilibrio óptimo o **Heavy (2)** para máxima precisión en poses complejas. |
| 🎬 **Generador de Video OpenPose Full** | Convierte videos completos o secciones (rango Inicio - Fin) a video OpenPose Full con fondo negro puro (`#000000`) a tasa constante de cuadros (15, 24, 30 FPS). |
| 📦 **Exportación Multiformato** | Descarga directa en **MP4 (H.264)**, **MKV (Matroska)** o **WebM (VP9)**. |
| 📋 **Secuencia Completa JSON** | Exporta la secuencia de todas las poses, manos y rostro en JSON estructurado para análisis biomecánico o animación. |
| 🦴 **Modo Hueso y Transformaciones** | Cinemática inversa/directa para mover extremidades en bloque, selección por recuadro y escalado elástico tirando de las orillas del rectángulo. |
| 🌐 **100% Client-Side & Multilingüe** | Funciona en cualquier navegador moderno sin necesidad de servidores backend (compatible con GitHub Pages, Netlify, Vercel o directamente con doble clic en local). |

---

### 🚀 Cómo Empezar

1. Abre el archivo **`index.html`** dentro de la carpeta `openposefree-holistic` en tu navegador favorito (Chrome, Edge, Firefox, Brave, Safari).
2. Sube una fotografía o un archivo de video (`.mp4`, `.webm`, `.mov`).
3. Elige la complejidad del modelo (por defecto **Full**) y las capas deseadas (Cuerpo, Manos, Rostro, Pies).
4. **Para imágenes:** Haz clic en **✨ Detectar Pose Completa (Holistic)**.
5. **Para videos:**
   - Selecciona **Todo el video** o define un rango con **📍 Inicio** / **📍 Fin**.
   - Elige el formato (**MP4**, **MKV**, **WebM**) y los FPS (**15**, **24**, **30**).
   - Presiona **🎬 Procesar y Descargar Video OpenPose Full**.

---

### 🎬 Conversión a Apple ProRes (.mov)

Para flujos de trabajo profesionales en DaVinci Resolve, Premiere Pro o Final Cut Pro:
```bash
# Convertir a Apple ProRes 422 HQ:
ffmpeg -i openpose-holistic.mp4 -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le openpose-holistic-prores.mov

# Convertir a Apple ProRes 4444 (con soporte de canal alfa):
ffmpeg -i openpose-holistic.mp4 -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le openpose-holistic-prores4444.mov
```

---

### 💖 Agradecimientos y Créditos

* **Google MediaPipe**: Por el desarrollo y liberación en código abierto de la arquitectura MediaPipe Holistic (Apache 2.0).
* **Rock Stevens**: Por la concepción y estructura original de nodos OpenPose en JavaScript de *Rock's Simple OpenPose Editor* (MIT License).

---

### 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

## ☕ Apoyar el Proyecto / Donaciones

¿Te gusta esta edición Holistic de 543 puntos? Apoya su mantenimiento y nuevas funciones invitándome un café en:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-HumbertoCisneros-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/humbertocisneros)

👉 **[https://buymeacoffee.com/humbertocisneros](https://buymeacoffee.com/humbertocisneros)**
