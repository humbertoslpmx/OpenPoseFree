/**
 * OpenPoseFree - AI Pose Detection & Video Generation Module
 * Detector y generador de poses y video basado en TensorFlow.js y MoveNet (Open Source)
 * Soporta imágenes y video completo con renderizado a fondo negro y exportación MP4/MKV/WebM.
 */

class OpenPoseDetector {
  constructor() {
    this.detector = null;
    this.isModelLoading = false;
    this.isDetecting = false;
    this.modelType = 'thunder'; // 'thunder' (precisión) o 'lightning' (velocidad)
    this.currentMedia = null; // { type: 'image' | 'video', element, file, url }
    this.keyframes = []; // Lista de { id, time, canvas, nodes, lines }
    this.rangeStart = 0;
    this.rangeEnd = 0;
  }

  /**
   * Inicializa el modelo MoveNet de TensorFlow.js
   */
  async loadModel(type = this.modelType) {
    if (this.detector && this.modelType === type) return this.detector;

    if (typeof poseDetection === 'undefined' || typeof tf === 'undefined') {
      throw new Error(
        typeof i18n !== 'undefined'
          ? i18n.t('ai.tfNotLoaded')
          : 'TensorFlow.js o pose-detection no están disponibles. Comprueba tu conexión a internet.'
      );
    }

    this.isModelLoading = true;
    this.modelType = type;
    this.updateStatus(
      typeof i18n !== 'undefined' ? i18n.t('ai.loadingModel') : 'Cargando modelo MoveNet...',
      'loading'
    );

    try {
      await tf.ready();
      const modelConfig = {
        modelType:
          type === 'lightning'
            ? poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            : poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        enableSmoothing: true
      };

      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        modelConfig
      );
      this.isModelLoading = false;
      this.updateStatus(
        typeof i18n !== 'undefined' ? i18n.t('ai.modelReady') : 'Modelo IA listo para detección',
        'ready'
      );
      return this.detector;
    } catch (err) {
      this.isModelLoading = false;
      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.errorLoadingModel') : 'Error al cargar modelo:') +
          ' ' +
          err.message,
        'error'
      );
      throw err;
    }
  }

  /**
   * Actualiza el texto y clase del indicador de estado en la UI
   */
  updateStatus(message, state = 'info') {
    const statusEl = document.getElementById('aiStatus');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'badge badge-status state-' + state;
  }

  /**
   * Procesa la carga de un archivo de imagen o video
   */
  async handleFile(file) {
    if (!file) return;

    if (this.currentMedia && this.currentMedia.url) {
      URL.revokeObjectURL(this.currentMedia.url);
    }

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    const imgContainer = document.getElementById('aiImageContainer');
    const videoContainer = document.getElementById('aiVideoContainer');
    const previewImg = document.getElementById('aiPreviewImage');
    const previewVideo = document.getElementById('aiPreviewVideo');
    const convertBtn = document.getElementById('btnConvertPose');

    this.keyframes = [];
    this.renderKeyframes();

    if (isImage) {
      if (imgContainer) imgContainer.style.display = 'block';
      if (videoContainer) videoContainer.style.display = 'none';

      previewImg.src = objectUrl;
      await new Promise(res => { previewImg.onload = res; });

      this.currentMedia = {
        type: 'image',
        element: previewImg,
        file: file,
        url: objectUrl,
        width: previewImg.naturalWidth,
        height: previewImg.naturalHeight
      };

      if (convertBtn) {
        convertBtn.disabled = false;
        convertBtn.textContent = typeof i18n !== 'undefined' ? i18n.t('ai.convertImageBtn') : '⚡ Convertir Imagen a OpenPose';
      }

      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.imageLoaded') : 'Imagen cargada:') +
          ` ${file.name} (${this.currentMedia.width}x${this.currentMedia.height})`,
        'ready'
      );

      // Asignar como imagen de guía en el canvas principal
      if (typeof setGuideMedia === 'function') {
        setGuideMedia(previewImg);
      }
    } else if (isVideo) {
      if (imgContainer) imgContainer.style.display = 'none';
      if (videoContainer) videoContainer.style.display = 'block';

      previewVideo.src = objectUrl;
      await new Promise(res => {
        previewVideo.onloadedmetadata = () => {
          previewVideo.currentTime = 0;
          res();
        };
      });

      this.currentMedia = {
        type: 'video',
        element: previewVideo,
        file: file,
        url: objectUrl,
        width: previewVideo.videoWidth || 640,
        height: previewVideo.videoHeight || 480,
        duration: previewVideo.duration || 0
      };

      this.rangeStart = 0;
      this.rangeEnd = previewVideo.duration || 0;
      this.updateVideoTimelineUI();

      if (convertBtn) {
        convertBtn.disabled = false;
        convertBtn.textContent = typeof i18n !== 'undefined' ? i18n.t('ai.convertFrameBtn') : '⚡ Convertir Frame Actual a OpenPose';
      }

      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.videoLoaded') : 'Video cargado:') +
          ` ${file.name} (${this.formatTime(this.currentMedia.duration)})`,
        'ready'
      );

      // Asignar frame de video como guía
      this.updateGuideFromVideoFrame();
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }

  updateVideoTimelineUI() {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || !this.currentMedia || this.currentMedia.type !== 'video') return;

    const timeDisplay = document.getElementById('aiVideoTimeDisplay');
    const rangeSlider = document.getElementById('aiVideoSlider');
    const startInput = document.getElementById('aiRangeStart');
    const endInput = document.getElementById('aiRangeEnd');

    if (timeDisplay) {
      timeDisplay.textContent = `${this.formatTime(video.currentTime)} / ${this.formatTime(video.duration)}`;
    }
    if (rangeSlider) {
      rangeSlider.max = video.duration || 100;
      rangeSlider.value = video.currentTime || 0;
    }
    if (startInput && document.activeElement !== startInput) {
      startInput.value = this.rangeStart.toFixed(2);
    }
    if (endInput && document.activeElement !== endInput) {
      endInput.value = this.rangeEnd.toFixed(2);
    }
  }

  updateGuideFromVideoFrame() {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || !video.videoWidth) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    if (typeof setGuideMedia === 'function') {
      setGuideMedia(tempCanvas);
    }
  }

  /**
   * Captura un frame del video en un canvas
   */
  captureCurrentFrame() {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /**
   * Añade el frame actual del video a la lista de keyframes
   */
  addCurrentKeyframe() {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || this.currentMedia?.type !== 'video') return;

    const frameCanvas = this.captureCurrentFrame();
    if (!frameCanvas) return;

    const keyframe = {
      id: Date.now() + Math.random(),
      time: video.currentTime,
      formattedTime: this.formatTime(video.currentTime),
      canvas: frameCanvas,
      thumbnail: frameCanvas.toDataURL('image/jpeg', 0.7),
      poseData: null
    };

    this.keyframes.push(keyframe);
    this.renderKeyframes();
    this.updateStatus(
      (typeof i18n !== 'undefined' ? i18n.t('ai.keyframeAdded') : 'Keyframe guardado en:') +
        ' ' +
        keyframe.formattedTime,
      'ready'
    );
  }

  /**
   * Extrae N keyframes distribuidos uniformemente en el rango [rangeStart, rangeEnd]
   */
  async extractRangeKeyframes(count = 5) {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || this.currentMedia?.type !== 'video') return;

    const start = Math.max(0, Math.min(this.rangeStart, video.duration));
    const end = Math.max(start, Math.min(this.rangeEnd, video.duration));
    if (end <= start) {
      alert(
        typeof i18n !== 'undefined'
          ? i18n.t('ai.invalidRange')
          : 'El rango seleccionado no es válido. Asegúrate de que el frame final sea mayor al inicial.'
      );
      return;
    }

    const step = (end - start) / Math.max(1, count - 1);
    this.updateStatus(
      (typeof i18n !== 'undefined' ? i18n.t('ai.extractingKeyframes') : 'Extrayendo keyframes...') +
        ` (0/${count})`,
      'loading'
    );

    const originalTime = video.currentTime;
    for (let i = 0; i < count; i++) {
      const targetTime = start + step * i;
      video.currentTime = targetTime;
      await new Promise(r => {
        const onSeek = () => {
          video.removeEventListener('seeked', onSeek);
          r();
        };
        video.addEventListener('seeked', onSeek);
      });

      const frameCanvas = this.captureCurrentFrame();
      if (frameCanvas) {
        this.keyframes.push({
          id: Date.now() + Math.random(),
          time: targetTime,
          formattedTime: this.formatTime(targetTime),
          canvas: frameCanvas,
          thumbnail: frameCanvas.toDataURL('image/jpeg', 0.7),
          poseData: null
        });
      }
      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.extractingKeyframes') : 'Extrayendo keyframes...') +
          ` (${i + 1}/${count})`,
        'loading'
      );
    }

    video.currentTime = originalTime;
    this.renderKeyframes();
    this.updateStatus(
      (typeof i18n !== 'undefined' ? i18n.t('ai.rangeExtracted') : 'Keyframes extraídos con éxito:') +
        ` ${count}`,
      'ready'
    );
  }

  /**
   * Renderiza la tira visual de keyframes en el DOM
   */
  renderKeyframes() {
    const container = document.getElementById('aiKeyframeStrip');
    if (!container) return;

    container.innerHTML = '';
    if (this.keyframes.length === 0) {
      container.innerHTML = `<span style="font-size:0.8rem; color:#888;">${
        typeof i18n !== 'undefined' ? i18n.t('ai.noKeyframes') : 'No hay keyframes seleccionados aún.'
      }</span>`;
      return;
    }

    this.keyframes.forEach((kf, index) => {
      const card = document.createElement('div');
      card.className = 'keyframe-card';
      card.title = `${typeof i18n !== 'undefined' ? i18n.t('ai.keyframeClick') : 'Click para detectar y cargar este frame'}`;

      const img = document.createElement('img');
      img.src = kf.thumbnail;

      const label = document.createElement('span');
      label.textContent = `#${index + 1} (${kf.formattedTime})`;

      const btnDelete = document.createElement('button');
      btnDelete.textContent = '×';
      btnDelete.style.cssText = 'background:none; border:none; color:#f55; font-size:12px; cursor:pointer; float:right;';
      btnDelete.onclick = (e) => {
        e.stopPropagation();
        this.keyframes.splice(index, 1);
        this.renderKeyframes();
      };

      card.appendChild(btnDelete);
      card.appendChild(img);
      card.appendChild(label);

      card.onclick = async () => {
        // Mover video a ese tiempo y detectar
        const video = document.getElementById('aiPreviewVideo');
        if (video) {
          video.currentTime = kf.time;
        }
        await this.detectAndApplyPose(kf.canvas);
      };

      container.appendChild(card);
    });
  }

  /**
   * Ejecuta la detección en la media actual o en un canvas específico y aplica el OpenPose resultante al editor
   */
  async detectAndApplyPose(sourceElement = null) {
    if (this.isDetecting) return;

    try {
      await this.loadModel();
    } catch (e) {
      return;
    }

    let input = sourceElement;
    let sourceWidth = 512;
    let sourceHeight = 512;

    if (!input) {
      if (!this.currentMedia) {
        alert(
          typeof i18n !== 'undefined'
            ? i18n.t('ai.noMediaAlert')
            : 'Por favor, carga primero una imagen o un video.'
        );
        return;
      }

      if (this.currentMedia.type === 'image') {
        input = this.currentMedia.element;
        sourceWidth = this.currentMedia.width;
        sourceHeight = this.currentMedia.height;
      } else if (this.currentMedia.type === 'video') {
        input = this.captureCurrentFrame();
        sourceWidth = this.currentMedia.width;
        sourceHeight = this.currentMedia.height;
      }
    } else {
      sourceWidth = input.width || input.videoWidth || input.naturalWidth || 512;
      sourceHeight = input.height || input.videoHeight || input.naturalHeight || 512;
    }

    if (!input) return;

    this.isDetecting = true;
    this.updateStatus(
      typeof i18n !== 'undefined' ? i18n.t('ai.detecting') : 'Analizando postura humana con MoveNet...',
      'loading'
    );

    const convertBtn = document.getElementById('btnConvertPose');
    if (convertBtn) convertBtn.disabled = true;

    try {
      const poses = await this.detector.estimatePoses(input);

      if (!poses || poses.length === 0 || !poses[0].keypoints) {
        this.updateStatus(
          typeof i18n !== 'undefined'
            ? i18n.t('ai.noPoseFound')
            : 'No se detectó ninguna persona en la imagen/frame. Intenta con otra pose más visible.',
          'error'
        );
        this.isDetecting = false;
        if (convertBtn) convertBtn.disabled = false;
        return;
      }

      const mainPose = poses[0];
      const targetCanvas = document.getElementById('canvas');
      const targetWidth = targetCanvas ? targetCanvas.width : 512;
      const targetHeight = targetCanvas ? targetCanvas.height : 512;

      const openPoseData = this.mapMoveNetToOpenPose(
        mainPose.keypoints,
        sourceWidth,
        sourceHeight,
        targetWidth,
        targetHeight
      );

      // Aplicar al editor principal
      if (typeof applyData === 'function') {
        applyData(openPoseData);
      }

      // Si es un canvas de video o imagen, actualizar la imagen de guía
      if (typeof setGuideMedia === 'function') {
        setGuideMedia(input);
      }

      const scoreAvg = (
        mainPose.keypoints.reduce((acc, k) => acc + (k.score || 0), 0) / mainPose.keypoints.length
      ).toFixed(2);

      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.poseApplied') : '¡Pose OpenPose generada con éxito!') +
          ` (Score: ${Math.round(scoreAvg * 100)}%)`,
        'ready'
      );
    } catch (err) {
      console.error(err);
      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.detectionError') : 'Error al procesar pose:') +
          ' ' +
          err.message,
        'error'
      );
    } finally {
      this.isDetecting = false;
      if (convertBtn) convertBtn.disabled = false;
    }
  }

  /**
   * Mapea los 17 puntos de MoveNet a los 18 nodos y líneas del formato OpenPose COCO-18
   */
  mapMoveNetToOpenPose(keypoints, sourceW, sourceH, targetW, targetH) {
    // Escala para ajustar proporcionalmente al canvas (contain)
    const scale = Math.min(targetW / sourceW, targetH / sourceH);
    const scaleX = scale;
    const scaleY = scale;
    const offsetX = (targetW - sourceW * scale) / 2;
    const offsetY = (targetH - sourceH * scale) / 2;

    const getPt = (idx) => {
      const kp = keypoints[idx];
      if (!kp) return null;
      return {
        x: kp.x * scaleX + offsetX,
        y: kp.y * scaleY + offsetY,
        score: kp.score || 0
      };
    };

    const nose = getPt(0);
    const leftEye = getPt(1);
    const rightEye = getPt(2);
    const leftEar = getPt(3);
    const rightEar = getPt(4);
    const leftShoulder = getPt(5);
    const rightShoulder = getPt(6);
    const leftElbow = getPt(7);
    const rightElbow = getPt(8);
    const leftWrist = getPt(9);
    const rightWrist = getPt(10);
    const leftHip = getPt(11);
    const rightHip = getPt(12);
    const leftKnee = getPt(13);
    const rightKnee = getPt(14);
    const leftAnkle = getPt(15);
    const rightAnkle = getPt(16);

    // 1: Cuello (Neck) = punto medio entre hombro izquierdo y hombro derecho
    let neck = null;
    if (leftShoulder && rightShoulder && leftShoulder.score > 0.1 && rightShoulder.score > 0.1) {
      neck = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
        score: (leftShoulder.score + rightShoulder.score) / 2
      };
    } else if (nose) {
      neck = { x: nose.x, y: nose.y + 35 * scaleY, score: nose.score * 0.7 };
    }

    // 18 nodos de OpenPose COCO-18 con sus colores exactos
    const openPosePoints = [
      { pt: nose, color: "#FF0000" },          // 0: Nariz
      { pt: neck, color: "#FF5500" },          // 1: Cuello
      { pt: rightShoulder, color: "#FFAA00" }, // 2: Hombro derecho
      { pt: rightElbow, color: "#FFFF00" },    // 3: Codo derecho
      { pt: rightWrist, color: "#AAFF00" },    // 4: Muñeca derecha
      { pt: leftShoulder, color: "#55FF00" },  // 5: Hombro izquierdo
      { pt: leftElbow, color: "#00FF00" },     // 6: Codo izquierdo
      { pt: leftWrist, color: "#00FF55" },     // 7: Muñeca izquierda
      { pt: rightHip, color: "#00FFAA" },      // 8: Cadera derecha
      { pt: rightKnee, color: "#00FFFF" },     // 9: Rodilla derecha
      { pt: rightAnkle, color: "#00AAFF" },    // 10: Tobillo derecho
      { pt: leftHip, color: "#0055FF" },       // 11: Cadera izquierda
      { pt: leftKnee, color: "#0000FF" },      // 12: Rodilla izquierda
      { pt: leftAnkle, color: "#5500FF" },     // 13: Tobillo izquierdo
      { pt: rightEye, color: "#AA00FF" },      // 14: Ojo derecho
      { pt: leftEye, color: "#FF00FF" },       // 15: Ojo izquierdo
      { pt: rightEar, color: "#FF00AA" },      // 16: Oreja derecha
      { pt: leftEar, color: "#FF0055" }        // 17: Oreja izquierda
    ];

    const nodes = openPosePoints.map((item, index) => {
      let x = item.pt ? item.pt.x : targetW / 2;
      let y = item.pt ? item.pt.y : targetH / 2;
      return {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        color: item.color
      };
    });

    // 17 conexiones exactas de OpenPose
    const lines = [
      { start: 0, end: 1, color: "#FF0000" },
      { start: 1, end: 2, color: "#FF5500" },
      { start: 2, end: 3, color: "#FFAA00" },
      { start: 3, end: 4, color: "#FFFF00" },
      { start: 1, end: 5, color: "#FF5500" },
      { start: 5, end: 6, color: "#55FF00" },
      { start: 6, end: 7, color: "#00FF00" },
      { start: 1, end: 8, color: "#00FFAA" },
      { start: 8, end: 9, color: "#00FFFF" },
      { start: 9, end: 10, color: "#00AAFF" },
      { start: 1, end: 11, color: "#0055FF" },
      { start: 11, end: 12, color: "#0000FF" },
      { start: 12, end: 13, color: "#5500FF" },
      { start: 0, end: 14, color: "#AA00FF" },
      { start: 0, end: 15, color: "#FF00FF" },
      { start: 14, end: 16, color: "#FF00AA" },
      { start: 15, end: 17, color: "#FF0055" }
    ];

    return { nodes, lines };
  }

  /**
   * Dibuja el esqueleto de OpenPose limpio sobre fondo negro puro para video
   */
  renderCleanOpenPoseFrame(ctx, poseData, width, height) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (!poseData) return;

    // Líneas
    if (poseData.lines && poseData.lines.length > 0) {
      poseData.lines.forEach(line => {
        if (!line.start || !line.end) return;
        ctx.save();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(line.start.x, line.start.y);
        ctx.lineTo(line.end.x, line.end.y);
        ctx.stroke();
        ctx.restore();
      });
    }

    // Nodos
    if (poseData.nodes && poseData.nodes.length > 0) {
      poseData.nodes.forEach(node => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  /**
   * Obtiene el tipo MIME y la extensión adecuada según el formato solicitado (mp4, mkv, webm)
   * comprobando los codecs soportados por el navegador (H.264 / AVC, VP9, etc.).
   */
  getOptimalMimeType(targetFormat = 'mp4') {
    const format = (targetFormat || 'mp4').toLowerCase();

    const candidates = {
      mp4: [
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        'video/mp4; codecs="avc1.42E01E"',
        'video/mp4; codecs=avc1',
        'video/mp4; codecs=h264',
        'video/mp4'
      ],
      mkv: [
        'video/x-matroska; codecs=avc1',
        'video/x-matroska; codecs=vp9',
        'video/x-matroska',
        'video/webm; codecs=vp9',
        'video/webm'
      ],
      webm: [
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8',
        'video/webm'
      ]
    };

    const targetCandidates = candidates[format] || candidates.mp4;
    for (const mime of targetCandidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        let ext = format;
        if (format === 'mp4' && !mime.includes('mp4')) ext = 'webm';
        return { mimeType: mime, extension: ext };
      }
    }

    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        return { mimeType: 'video/mp4', extension: 'mp4' };
      }
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        return { mimeType: 'video/webm; codecs=vp9', extension: format === 'mkv' ? 'mkv' : 'webm' };
      }
      if (MediaRecorder.isTypeSupported('video/webm')) {
        return { mimeType: 'video/webm', extension: format === 'mkv' ? 'mkv' : 'webm' };
      }
    }

    return { mimeType: '', extension: format === 'mp4' ? 'mp4' : 'webm' };
  }

  /**
   * Procesa el video completo cuadro a cuadro, detecta la pose en cada frame
   * y genera un video en formato OpenPose (fondo negro) descargable.
   */
  async processFullVideo({ fps = 24, useRange = false, format = 'mp4' } = {}) {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || this.currentMedia?.type !== 'video') {
      alert(typeof i18n !== 'undefined' ? i18n.t('ai.noMediaAlert') : 'Por favor, carga primero un video.');
      return;
    }

    try {
      await this.loadModel('lightning'); // Lightning para procesar video de forma óptima
    } catch (e) {
      return;
    }

    this.isVideoProcessing = true;
    this.cancelRequested = false;
    this.lastPoseSequence = [];

    const progressBox = document.getElementById('aiVideoProgressBox');
    const resultBox = document.getElementById('aiVideoResultBox');
    const stageEl = document.getElementById('aiVideoProgressStage');
    const percentEl = document.getElementById('aiVideoProgressPercent');
    const barEl = document.getElementById('aiVideoProgressBar');
    const countEl = document.getElementById('aiVideoProgressCount');
    const startBtn = document.getElementById('btnStartVideoProcessing');

    if (progressBox) progressBox.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';
    if (startBtn) startBtn.disabled = true;

    const originalTime = video.currentTime;
    video.pause();

    const duration = video.duration || 1;
    const startTime = useRange ? Math.max(0, Math.min(this.rangeStart, duration)) : 0;
    const endTime = useRange ? Math.max(startTime, Math.min(this.rangeEnd, duration)) : duration;

    const step = 1 / fps;
    const totalFrames = Math.max(1, Math.floor((endTime - startTime) / step));

    const targetCanvas = document.getElementById('canvas');
    const outWidth = targetCanvas ? targetCanvas.width : 512;
    const outHeight = targetCanvas ? targetCanvas.height : 512;

    this.updateStatus(
      typeof i18n !== 'undefined' ? i18n.t('ai.analyzingFrames') : 'Analizando fotogramas con IA...',
      'loading'
    );

    // ==========================================
    // FASE 1: Inferencia IA Frame por Frame
    // ==========================================
    for (let i = 0; i < totalFrames; i++) {
      if (this.cancelRequested) {
        break;
      }

      const targetTime = startTime + i * step;
      video.currentTime = targetTime;

      await new Promise(r => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          r();
        };
        video.addEventListener('seeked', onSeeked);
      });

      const frameCanvas = this.captureCurrentFrame();
      let openPoseData = null;

      if (frameCanvas) {
        try {
          const poses = await this.detector.estimatePoses(frameCanvas);
          if (poses && poses.length > 0 && poses[0].keypoints) {
            openPoseData = this.mapMoveNetToOpenPose(
              poses[0].keypoints,
              frameCanvas.width,
              frameCanvas.height,
              outWidth,
              outHeight
            );
          }
        } catch (e) {
          console.warn('Error estimating frame ' + i, e);
        }
      }

      this.lastPoseSequence.push({
        frameIndex: i,
        time: targetTime,
        poseData: openPoseData
      });

      // Actualizar vista previa en el canvas principal
      if (openPoseData && typeof applyData === 'function') {
        applyData(openPoseData);
      }

      // Actualizar barra de progreso (Fase 1: 0% a 70%)
      const pct = Math.round(((i + 1) / totalFrames) * 70);
      if (percentEl) percentEl.textContent = `${pct}%`;
      if (barEl) barEl.style.width = `${pct}%`;
      if (countEl) countEl.textContent = `Frame ${i + 1} / ${totalFrames}`;
      if (stageEl) stageEl.textContent = typeof i18n !== 'undefined' ? i18n.t('ai.analyzingFrames') : 'Analizando frames con IA...';
    }

    if (this.cancelRequested) {
      video.currentTime = originalTime;
      this.isVideoProcessing = false;
      if (progressBox) progressBox.style.display = 'none';
      if (startBtn) startBtn.disabled = false;
      this.updateStatus(
        typeof i18n !== 'undefined' ? i18n.t('ai.cancelled') : 'Procesamiento cancelado.',
        'info'
      );
      return;
    }

    // ==========================================
    // FASE 2: Renderizado y Grabación del Video
    // ==========================================
    if (stageEl) stageEl.textContent = typeof i18n !== 'undefined' ? i18n.t('ai.encodingVideo') : 'Codificando video OpenPose...';

    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = outWidth;
    renderCanvas.height = outHeight;
    const rCtx = renderCanvas.getContext('2d');

    const stream = renderCanvas.captureStream(fps);
    const { mimeType, extension } = this.getOptimalMimeType(format);
    this.lastGeneratedExtension = extension;

    const recorderOptions = {
      videoBitsPerSecond: 8000000
    };
    if (mimeType) {
      recorderOptions.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(stream, recorderOptions);

    const chunks = [];
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const completionPromise = new Promise(resolve => {
      recorder.onstop = () => {
        const finalType = mimeType || 'video/' + extension;
        const blob = new Blob(chunks, { type: finalType });
        resolve(blob);
      };
    });

    recorder.start();

    // Renderizar secuencialmente cada pose sobre fondo negro puro
    const frameInterval = 1000 / fps;
    for (let f = 0; f < this.lastPoseSequence.length; f++) {
      if (this.cancelRequested) break;
      const frameItem = this.lastPoseSequence[f];

      this.renderCleanOpenPoseFrame(rCtx, frameItem.poseData, outWidth, outHeight);

      // Progreso de codificación (70% a 100%)
      const pct = 70 + Math.round(((f + 1) / this.lastPoseSequence.length) * 30);
      if (percentEl) percentEl.textContent = `${pct}%`;
      if (barEl) barEl.style.width = `${pct}%`;
      if (countEl) countEl.textContent = `Encoding ${f + 1} / ${this.lastPoseSequence.length}`;

      await new Promise(res => setTimeout(res, frameInterval));
    }

    recorder.stop();
    const finalVideoBlob = await completionPromise;

    video.currentTime = originalTime;
    this.isVideoProcessing = false;

    if (this.lastGeneratedVideoUrl) {
      URL.revokeObjectURL(this.lastGeneratedVideoUrl);
    }
    this.lastGeneratedVideoBlob = finalVideoBlob;
    this.lastGeneratedVideoUrl = URL.createObjectURL(finalVideoBlob);

    // Actualizar texto del botón de descarga según formato
    const dlBtnText = document.getElementById('btnDownloadVideoText');
    if (dlBtnText) {
      dlBtnText.textContent = `📥 Descargar Video (.${this.lastGeneratedExtension})`;
    }

    // Mostrar reproductor con el resultado
    if (progressBox) progressBox.style.display = 'none';
    if (resultBox) {
      resultBox.style.display = 'block';
      const previewEl = document.getElementById('aiOutputVideoPreview');
      if (previewEl) {
        previewEl.src = this.lastGeneratedVideoUrl;
        previewEl.play().catch(() => {});
      }
    }
    if (startBtn) startBtn.disabled = false;

    this.updateStatus(
      typeof i18n !== 'undefined' ? i18n.t('ai.videoSuccess') : '¡Video OpenPose generado con éxito!',
      'ready'
    );

    // Descarga automática inmediata
    this.downloadGeneratedVideo();
  }

  downloadGeneratedVideo() {
    if (!this.lastGeneratedVideoBlob) return;
    const a = document.createElement('a');
    a.href = this.lastGeneratedVideoUrl;
    const ext = this.lastGeneratedExtension || 'mp4';
    a.download = `openpose-video-${Date.now()}.${ext}`;
    a.click();
  }

  downloadPoseSequenceJSON() {
    if (!this.lastPoseSequence || this.lastPoseSequence.length === 0) return;
    const jsonStr = JSON.stringify(this.lastPoseSequence, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openpose-sequence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Instancia global
window.openPoseDetector = new OpenPoseDetector();
