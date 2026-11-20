/**
 * OpenPoseFree Holistic Edition - MediaPipe Holistic AI Module
 * Detector y generador integral de poses humanas:
 * - Cuerpo completo (Pose 33 landmarks con talones y dedos de pies)
 * - Manos de alta fidelidad (42 landmarks: 21 por mano, todas las falanges)
 * - Malla facial completa (Face Mesh 468 landmarks: ojos, labios, cejas, contorno)
 * - Renderizado limpio OpenPose Full sobre fondo negro puro (#000000)
 * - Exportación de video frame a frame en MP4 (H.264), MKV y WebM
 */

class OpenPoseHolisticDetector {
  constructor() {
    this.holistic = null;
    this.isModelLoading = false;
    this.isDetecting = false;
    this.modelComplexity = 1; // 0: Lite, 1: Full, 2: Heavy

    // Capas activas de detección y renderizado
    this.detectBody = true;
    this.detectHands = true;
    this.detectFace = true;
    this.detectFeet = true;

    this.currentMedia = null; // { type: 'image' | 'video', element, file, url }
    this.keyframes = []; // Lista de keyframes
    this.rangeStart = 0;
    this.rangeEnd = 0;

    // Último resultado integral capturado
    this.lastHolisticResult = null; // { pose, face, leftHand, rightHand }
    this.lastPoseSequence = []; // Secuencia temporal para video
    this.lastGeneratedVideoBlob = null;
    this.lastGeneratedVideoUrl = null;
    this.lastGeneratedExtension = 'mp4';
    this.isVideoProcessing = false;
    this.cancelRequested = false;

    // Configuración canónica de dedos de la mano (21 puntos)
    this.handConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8],       // Índice
      [0, 9], [9, 10], [10, 11], [11, 12],  // Medio
      [0, 13], [13, 14], [14, 15], [15, 16],// Anular
      [0, 17], [17, 18], [18, 19], [19, 20] // Meñique
    ];

    // Colores canónicos OpenPose para dedos de la mano
    this.fingerColors = [
      '#FF0055', '#FF0055', '#FF0055', '#FF0055', // Pulgar
      '#0055FF', '#0055FF', '#0055FF', '#0055FF', // Índice
      '#00FF55', '#00FF55', '#00FF55', '#00FF55', // Medio
      '#FFFF00', '#FFFF00', '#FFFF00', '#FFFF00', // Anular
      '#FF5500', '#FF5500', '#FF5500', '#FF5500'  // Meñique
    ];

    // Contornos canónicos faciales para OpenPose / Face Mesh
    this.faceContours = {
      jawline: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
      leftEyebrow: [70, 63, 105, 66, 107],
      rightEyebrow: [336, 296, 334, 293, 300],
      noseBridge: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
      leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
      rightEye: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263],
      outerLips: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 61],
      innerLips: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78]
    };
  }

  /**
   * Carga dinámica de la librería @mediapipe/holistic si aún no está presente en el DOM.
   */
  async ensureMediaPipeLoaded() {
    if (typeof Holistic !== 'undefined') return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar la librería MediaPipe Holistic desde CDN. Verifica tu conexión.'));
      document.head.appendChild(script);
    });
  }

  /**
   * Inicializa el modelo MediaPipe Holistic con la complejidad elegida.
   */
  async loadModel(complexity = 1) {
    if (this.holistic && this.modelComplexity === complexity) {
      return this.holistic;
    }

    this.isModelLoading = true;
    this.updateStatus(
      typeof i18n !== 'undefined' ? i18n.t('ai.loadingHolistic') : 'Cargando MediaPipe Holistic (Cuerpo, Manos y Rostro)...',
      'loading'
    );

    try {
      await this.ensureMediaPipeLoaded();

      this.modelComplexity = complexity;
      this.holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
      });

      this.holistic.setOptions({
        modelComplexity: this.modelComplexity,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Calentamiento inicial de la canalización
      await this.holistic.initialize();

      this.isModelLoading = false;
      this.updateStatus(
        typeof i18n !== 'undefined' ? i18n.t('ai.holisticReady') : 'MediaPipe Holistic listo (543 puntos)',
        'ready'
      );
      return this.holistic;
    } catch (err) {
      this.isModelLoading = false;
      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.errorLoadingModel') : 'Error al cargar modelo:') + ' ' + err.message,
        'error'
      );
      throw err;
    }
  }

  /**
   * Ejecuta una inferencia integral asíncrona sobre un elemento imagen, canvas o video.
   */
  async estimateHolistic(sourceElement) {
    if (!this.holistic) {
      await this.loadModel(this.modelComplexity);
    }

    return new Promise((resolve) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
      }, 8000);

      this.holistic.onResults((results) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(results);
        }
      });

      this.holistic.send({ image: sourceElement }).catch((err) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          console.error('Error en Holistic send:', err);
          resolve(null);
        }
      });
    });
  }

  /**
   * Actualiza el badge visual de estado en la UI.
   */
  updateStatus(message, state = 'info') {
    const el = document.getElementById('aiStatus');
    if (!el) return;
    el.textContent = message;
    el.className = 'badge badge-status state-' + state;
  }

  // Aliases para máxima compatibilidad
  async handleFile(file) {
    return this.loadMediaFile(file);
  }

  async detectAndApplyPose() {
    return this.detectCurrentFrame();
  }

  addCurrentKeyframe() {
    return this.captureCurrentKeyframe();
  }

  updateVideoTimelineUI() {
    return this.updateTimeDisplay();
  }

  /**
   * Carga y procesa un archivo multimedia (imagen o video).
   */
  async loadMediaFile(file) {
    if (!file) return;

    if (this.currentMedia && this.currentMedia.url) {
      URL.revokeObjectURL(this.currentMedia.url);
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Formato no soportado. Por favor sube una imagen o video válido.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const mediaType = isVideo ? 'video' : 'image';

    this.currentMedia = {
      type: mediaType,
      file: file,
      url: objectUrl,
      width: 0,
      height: 0
    };

    const imgContainer = document.getElementById('aiImageContainer');
    const vidContainer = document.getElementById('aiVideoContainer');
    const previewImg = document.getElementById('aiPreviewImage');
    const previewVid = document.getElementById('aiPreviewVideo');
    const convertBtn = document.getElementById('btnConvertPose');

    if (isImage) {
      if (imgContainer) imgContainer.style.display = 'block';
      if (vidContainer) vidContainer.style.display = 'none';

      previewImg.src = objectUrl;
      await new Promise((res) => { previewImg.onload = res; });
      this.currentMedia.width = previewImg.naturalWidth;
      this.currentMedia.height = previewImg.naturalHeight;
      this.currentMedia.element = previewImg;

      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.imageLoaded') : 'Imagen cargada:') + ' ' + file.name + ` (${this.currentMedia.width}x${this.currentMedia.height})`,
        'ready'
      );
      if (typeof setGuideMedia === 'function') {
        setGuideMedia(previewImg);
      }
    } else {
      if (imgContainer) imgContainer.style.display = 'none';
      if (vidContainer) vidContainer.style.display = 'block';

      previewVid.src = objectUrl;
      if (typeof previewVid.load === 'function') {
        previewVid.load();
      }

      await new Promise((res) => {
        previewVid.onloadeddata = async () => {
          this.currentMedia.width = previewVid.videoWidth;
          this.currentMedia.height = previewVid.videoHeight;
          this.rangeStart = 0;
          this.rangeEnd = previewVid.duration;

          const rStartEl = document.getElementById('aiRangeStart');
          const rEndEl = document.getElementById('aiRangeEnd');
          if (rStartEl) rStartEl.value = '0';
          if (rEndEl) rEndEl.value = previewVid.duration.toFixed(2);

          this.updateTimeDisplay();
          this.updateGuideFromVideoFrame();
          // Detectar y transferir la primera pose inmediatamente al lienzo del editor
          await this.detectCurrentFrame();
          res();
        };
      });

      this.currentMedia.element = previewVid;
      this.updateStatus(
        (typeof i18n !== 'undefined' ? i18n.t('ai.videoLoaded') : 'Video cargado:') + ' ' + file.name + ` (${previewVid.videoWidth}x${previewVid.videoHeight}, ${previewVid.duration.toFixed(1)}s)`,
        'ready'
      );
    }

    if (convertBtn) convertBtn.disabled = false;
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

  updateTimeDisplay() {
    const vid = document.getElementById('aiPreviewVideo');
    const display = document.getElementById('aiVideoTimeDisplay');
    const slider = document.getElementById('aiVideoSlider');
    if (!vid || !display) return;

    const cur = vid.currentTime || 0;
    const dur = vid.duration || 0;

    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const sec = (s % 60).toFixed(2);
      return `${m.toString().padStart(2, '0')}:${sec.padStart(5, '0')}`;
    };

    display.textContent = `${fmt(cur)} / ${fmt(dur)}`;
    if (slider && dur > 0) {
      slider.value = (cur / dur) * 100;
    }
  }

  /**
   * Mapea los resultados de MediaPipe Holistic a coordenadas del canvas
   * para cuerpo, manos, rostro y pies.
   */
  mapHolisticToCanvas(results, sourceW, sourceH, targetW, targetH) {
    if (!results) return null;

    const scale = Math.min(targetW / sourceW, targetH / sourceH);
    const offsetX = (targetW - sourceW * scale) / 2;
    const offsetY = (targetH - sourceH * scale) / 2;

    const transformPt = (lm) => {
      if (!lm) return null;
      return {
        x: lm.x * sourceW * scale + offsetX,
        y: lm.y * sourceH * scale + offsetY,
        z: lm.z || 0,
        visibility: lm.visibility !== undefined ? lm.visibility : 1
      };
    };

    // 1. Cuerpo (33 landmarks)
    const poseLandmarks = results.poseLandmarks ? results.poseLandmarks.map(transformPt) : null;

    // 2. Mano Izquierda (21 landmarks)
    const leftHandLandmarks = results.leftHandLandmarks ? results.leftHandLandmarks.map(transformPt) : null;

    // 3. Mano Derecha (21 landmarks)
    const rightHandLandmarks = results.rightHandLandmarks ? results.rightHandLandmarks.map(transformPt) : null;

    // 4. Rostro (468 landmarks)
    const faceLandmarks = results.faceLandmarks ? results.faceLandmarks.map(transformPt) : null;

    return {
      pose: poseLandmarks,
      leftHand: leftHandLandmarks,
      rightHand: rightHandLandmarks,
      face: faceLandmarks
    };
  }

  /**
   * Detecta la pose en la imagen o fotograma actual y la transfiere al editor interactivo.
   */
  async detectCurrentFrame() {
    if (!this.currentMedia || !this.currentMedia.element) return;

    this.isDetecting = true;
    this.updateStatus(
      typeof i18n !== 'undefined' ? i18n.t('ai.detectingHolistic') : 'Detectando cuerpo, manos y rostro con MediaPipe Holistic...',
      'loading'
    );

    try {
      let sourceElement = this.currentMedia.element;
      if (this.currentMedia.type === 'video') {
        const video = this.currentMedia.element;
        if (video.seeking || video.readyState < 2) {
          await new Promise((res) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              res();
            };
            video.addEventListener('seeked', onSeeked, { once: true });
            setTimeout(res, 350);
          });
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth || this.currentMedia.width || 640;
        tempCanvas.height = video.videoHeight || this.currentMedia.height || 480;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        sourceElement = tempCanvas;
      }

      const results = await this.estimateHolistic(sourceElement);

      if (!results || (!results.poseLandmarks && !results.leftHandLandmarks && !results.rightHandLandmarks && !results.faceLandmarks)) {
        this.updateStatus(
          typeof i18n !== 'undefined' ? i18n.t('ai.noPoseFound') : 'No se detectó figura humana en este cuadro.',
          'error'
        );
        this.isDetecting = false;
        return;
      }

      const canvas = document.getElementById('canvas');
      const targetW = canvas ? canvas.width : 512;
      const targetH = canvas ? canvas.height : 512;

      const holisticData = this.mapHolisticToCanvas(
        results,
        this.currentMedia.width || sourceElement.width || 640,
        this.currentMedia.height || sourceElement.height || 480,
        targetW,
        targetH
      );

      this.lastHolisticResult = holisticData;
      this.applyHolisticToEditor(holisticData);

      // Actualizar imagen guía de fondo en el lienzo principal
      const setGuide = (typeof window !== 'undefined' && window.setGuideMedia) || (typeof setGuideMedia === 'function' ? setGuideMedia : null);
      if (setGuide) {
        setGuide(sourceElement);
      }

      this.updateStatus(
        typeof i18n !== 'undefined' ? i18n.t('ai.poseApplied') : '¡Esqueleto OpenPose Full generado con éxito!',
        'ready'
      );
    } catch (err) {
      console.error(err);
      this.updateStatus('Error en detección: ' + err.message, 'error');
    } finally {
      this.isDetecting = false;
    }
  }

  /**
   * Aplica los nodos detectados de cuerpo, manos y cara al lienzo del editor interactivo.
   */
  applyHolisticToEditor(holisticData) {
    if (!holisticData) return;

    this.lastHolisticResult = holisticData;

    const editorNodes = [];
    const editorLines = [];

    // 1. Mapeo del Cuerpo (Estándar OpenPose COCO-18 + Pies)
    if (this.detectBody && holisticData.pose) {
      const p = holisticData.pose;
      const p11 = p[11] || { x: 256, y: 200 };
      const p12 = p[12] || { x: 256, y: 200 };
      const neck = {
        x: (p11.x + p12.x) / 2,
        y: (p11.y + p12.y) / 2
      };

      const bodyPoints = [
        { pt: p[0] || neck, color: '#FF0000', name: 'Nose' },          // 0
        { pt: neck, color: '#FF5500', name: 'Neck' },                  // 1
        { pt: p[12] || neck, color: '#FFAA00', name: 'RShoulder' },    // 2
        { pt: p[14] || p[12] || neck, color: '#FFFF00', name: 'RElbow' }, // 3
        { pt: p[16] || p[14] || neck, color: '#AAFF00', name: 'RWrist' }, // 4
        { pt: p[11] || neck, color: '#55FF00', name: 'LShoulder' },    // 5
        { pt: p[13] || p[11] || neck, color: '#00FF00', name: 'LElbow' }, // 6
        { pt: p[15] || p[13] || neck, color: '#00FF55', name: 'LWrist' }, // 7
        { pt: p[24] || neck, color: '#00FFAA', name: 'RHip' },         // 8
        { pt: p[26] || p[24] || neck, color: '#00FFFF', name: 'RKnee' },  // 9
        { pt: p[28] || p[26] || neck, color: '#00AAFF', name: 'RAnkle' }, // 10
        { pt: p[23] || neck, color: '#0055FF', name: 'LHip' },         // 11
        { pt: p[25] || p[23] || neck, color: '#0000FF', name: 'LKnee' },  // 12
        { pt: p[27] || p[25] || neck, color: '#5500FF', name: 'LAnkle' }, // 13
        { pt: p[5] || p[0] || neck, color: '#AA00FF', name: 'REye' },   // 14
        { pt: p[2] || p[0] || neck, color: '#FF00FF', name: 'LEye' },   // 15
        { pt: p[8] || p[5] || neck, color: '#FF00AA', name: 'REar' },   // 16
        { pt: p[7] || p[2] || neck, color: '#AA0055', name: 'LEar' }    // 17
      ];

      // Opcional: Pies (Talones y Puntas)
      if (this.detectFeet && p[30] && p[32] && p[29] && p[31]) {
        bodyPoints.push({ pt: p[30], color: '#0088CC', name: 'RHeel' });    // 18
        bodyPoints.push({ pt: p[32], color: '#00AAEE', name: 'RBigToe' });  // 19
        bodyPoints.push({ pt: p[29], color: '#4400CC', name: 'LHeel' });    // 20
        bodyPoints.push({ pt: p[31], color: '#6600EE', name: 'LBigToe' });  // 21
      }

      bodyPoints.forEach((bp) => {
        editorNodes.push({
          x: Math.round(bp.pt.x),
          y: Math.round(bp.pt.y),
          color: bp.color,
          name: bp.name
        });
      });

      // Conexiones de extremidades del cuerpo con formato index-based
      const bodyLines = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [1, 5], [5, 6], [6, 7],
        [1, 8], [8, 9], [9, 10],
        [1, 11], [11, 12], [12, 13],
        [0, 14], [14, 16],
        [0, 15], [15, 17]
      ];

      if (this.detectFeet && editorNodes.length >= 22) {
        bodyLines.push([10, 18], [18, 19]);
        bodyLines.push([13, 20], [20, 21]);
      }

      bodyLines.forEach(([n1, n2]) => {
        if (editorNodes[n1] && editorNodes[n2]) {
          editorLines.push({
            start: n1,
            end: n2,
            color: editorNodes[n2].color || '#FFFFFF'
          });
        }
      });
    }

    // 2. Mapeo de Manos (21 nodos por mano)
    if (this.detectHands) {
      const addHand = (handLms, isLeft) => {
        if (!handLms) return;
        const startIndex = editorNodes.length;

        handLms.forEach((lm, idx) => {
          editorNodes.push({
            x: Math.round(lm.x),
            y: Math.round(lm.y),
            color: this.fingerColors[Math.max(0, idx - 1)] || '#FFFFFF',
            radius: 3,
            isHand: true,
            isLeftHand: isLeft
          });
        });

        this.handConnections.forEach(([from, to], idx) => {
          editorLines.push({
            start: startIndex + from,
            end: startIndex + to,
            color: this.fingerColors[idx] || '#FFFFFF',
            lineWidth: 2.5
          });
        });
      };

      addHand(holisticData.leftHand, true);
      addHand(holisticData.rightHand, false);
    }

    // Transferir datos al editor interactivo mediante window.applyData o directamente a window.nodes
    const applyFn = (typeof window !== 'undefined' && window.applyData) || (typeof applyData === 'function' ? applyData : null);
    if (applyFn) {
      applyFn({ nodes: editorNodes, lines: editorLines });
    } else {
      const targetNodes = (typeof window !== 'undefined' && window.nodes) || (typeof nodes !== 'undefined' ? nodes : null);
      const targetLines = (typeof window !== 'undefined' && window.lines) || (typeof lines !== 'undefined' ? lines : null);
      if (targetNodes && targetLines) {
        targetNodes.length = 0;
        targetLines.length = 0;
        editorNodes.forEach(n => targetNodes.push(n));
        editorLines.forEach(l => {
          if (targetNodes[l.start] && targetNodes[l.end]) {
            targetLines.push({
              start: targetNodes[l.start],
              end: targetNodes[l.end],
              color: l.color,
              lineWidth: l.lineWidth
            });
          }
        });
        if (typeof originalNodes !== 'undefined') {
          originalNodes = targetNodes.map(n => ({ ...n }));
        } else if (typeof window !== 'undefined' && window.originalNodes) {
          window.originalNodes = targetNodes.map(n => ({ ...n }));
        }
        if (typeof window !== 'undefined' && typeof window.draw === 'function') {
          window.draw();
        } else if (typeof draw === 'function') {
          draw();
        }
      }
    }
  }

  /**
   * Renderizado limpio y puro sobre lienzo negro (#000000)
   * Diseñado exclusivamente para exportación de video e imágenes OpenPose Full.
   */
  renderCleanOpenPoseFrame(ctx, holisticData, width, height) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (!holisticData) return;

    // ----------------------------------------------------
    // 1. CUERPO (Limbs & Joint Nodes)
    // ----------------------------------------------------
    if (this.detectBody && holisticData.pose) {
      const p = holisticData.pose;
      const neck = {
        x: (p[11].x + p[12].x) / 2,
        y: (p[11].y + p[12].y) / 2
      };

      const bPts = [
        p[0], neck, p[12], p[14], p[16], p[11], p[13], p[15],
        p[24], p[26], p[28], p[23], p[25], p[27],
        p[5], p[2], p[8], p[7]
      ];

      if (this.detectFeet) {
        bPts.push(p[30], p[32], p[29], p[31]);
      }

      const bColors = [
        '#FF0000', '#FF5500', '#FFAA00', '#FFFF00', '#AAFF00',
        '#55FF00', '#00FF00', '#00FF55', '#00FFAA', '#00FFFF',
        '#00AAFF', '#0055FF', '#0000FF', '#5500FF', '#AA00FF',
        '#FF00FF', '#FF00AA', '#AA0055', '#0088CC', '#00AAEE',
        '#4400CC', '#6600EE'
      ];

      const bLines = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [1, 5], [5, 6], [6, 7],
        [1, 8], [8, 9], [9, 10],
        [1, 11], [11, 12], [12, 13],
        [0, 14], [14, 16],
        [0, 15], [15, 17]
      ];

      if (this.detectFeet) {
        bLines.push([10, 18], [18, 19], [13, 20], [20, 21]);
      }

      ctx.save();
      ctx.globalAlpha = 0.65;
      bLines.forEach(([n1, n2]) => {
        const pt1 = bPts[n1];
        const pt2 = bPts[n2];
        if (pt1 && pt2) {
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle = bColors[n2] || '#FFFFFF';
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });
      ctx.restore();

      // Articulaciones del cuerpo
      bPts.forEach((pt, i) => {
        if (!pt) return;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = bColors[i] || '#FFFFFF';
        ctx.fill();
      });
    }

    // ----------------------------------------------------
    // 2. MANOS (Left & Right - 21 keypoints cada una)
    // ----------------------------------------------------
    if (this.detectHands) {
      const drawHand = (handLms) => {
        if (!handLms) return;

        ctx.save();
        ctx.globalAlpha = 0.85;
        this.handConnections.forEach(([from, to], idx) => {
          const pt1 = handLms[from];
          const pt2 = handLms[to];
          if (pt1 && pt2) {
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.strokeStyle = this.fingerColors[idx] || '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        });
        ctx.restore();

        handLms.forEach((pt, idx) => {
          if (!pt) return;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = this.fingerColors[Math.max(0, idx - 1)] || '#FFFFFF';
          ctx.fill();
        });
      };

      drawHand(holisticData.leftHand);
      drawHand(holisticData.rightHand);
    }

    // ----------------------------------------------------
    // 3. ROSTRO (Face Mesh Contours)
    // ----------------------------------------------------
    if (this.detectFace && holisticData.face) {
      const fLms = holisticData.face;
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.fillStyle = '#FFFFFF';

      const drawPath = (indices, close = false, color = '#FFFFFF') => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        let first = true;
        indices.forEach((idx) => {
          const pt = fLms[idx];
          if (!pt) return;
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
        if (close) ctx.closePath();
        ctx.stroke();
      };

      // Dibujar contornos faciales canónicos
      drawPath(this.faceContours.jawline, false, '#00FFFF');
      drawPath(this.faceContours.leftEyebrow, false, '#00FF00');
      drawPath(this.faceContours.rightEyebrow, false, '#00FF00');
      drawPath(this.faceContours.noseBridge, false, '#FFFF00');
      drawPath(this.faceContours.leftEye, true, '#FF00FF');
      drawPath(this.faceContours.rightEye, true, '#FF00FF');
      drawPath(this.faceContours.outerLips, true, '#FF0000');
      drawPath(this.faceContours.innerLips, true, '#FFAA00');

      ctx.restore();
    }
  }

  /**
   * Genera el MIME type óptimo según formato (.mp4 con H.264, .mkv, .webm).
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
   * PROCESAMIENTO FRAME A FRAME DEL VIDEO COMPLETO CON MEDIAPIPE HOLISTIC
   */
  async processFullVideo({ fps = 24, useRange = false, format = 'mp4' } = {}) {
    const video = document.getElementById('aiPreviewVideo');
    if (!video || this.currentMedia?.type !== 'video') {
      alert(typeof i18n !== 'undefined' ? i18n.t('ai.noMediaAlert') : 'Por favor, carga primero un video.');
      return;
    }

    try {
      await this.loadModel(this.modelComplexity);
    } catch (e) {
      return;
    }

    this.isVideoProcessing = true;
    this.cancelRequested = false;

    const progressBox = document.getElementById('aiVideoProgressBox');
    const progressBar = document.getElementById('aiVideoProgressBar');
    const progressStage = document.getElementById('aiVideoProgressStage');
    const progressPercent = document.getElementById('aiVideoProgressPercent');
    const progressCount = document.getElementById('aiVideoProgressCount');
    const startBtn = document.getElementById('btnStartVideoProcessing');
    const resultBox = document.getElementById('aiVideoResultBox');

    if (progressBox) progressBox.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';
    if (startBtn) startBtn.disabled = true;

    const duration = video.duration;
    let startTime = 0;
    let endTime = duration;

    if (useRange) {
      startTime = Math.max(0, this.rangeStart || 0);
      endTime = Math.min(duration, this.rangeEnd || duration);
      if (endTime <= startTime) endTime = duration;
    }

    const totalSeconds = endTime - startTime;
    const totalFrames = Math.max(1, Math.round(totalSeconds * fps));
    const stepSeconds = totalSeconds / totalFrames;

    const outWidth = 512;
    const outHeight = 512;

    this.lastPoseSequence = [];
    const originalTime = video.currentTime;

    // Canvas temporal para inferencia
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = video.videoWidth || 640;
    frameCanvas.height = video.videoHeight || 480;
    const fCtx = frameCanvas.getContext('2d');

    // ==========================================
    // FASE 1: Inferencia MediaPipe Holistic Frame a Frame
    // ==========================================
    for (let i = 0; i < totalFrames; i++) {
      if (this.cancelRequested) break;

      const targetTime = startTime + i * stepSeconds;
      video.currentTime = targetTime;

      await new Promise((res) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          res();
        };
        video.addEventListener('seeked', onSeeked);
      });

      fCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      const results = await this.estimateHolistic(frameCanvas);

      let holisticMapped = null;
      if (results) {
        holisticMapped = this.mapHolisticToCanvas(
          results,
          frameCanvas.width,
          frameCanvas.height,
          outWidth,
          outHeight
        );
      }

      this.lastPoseSequence.push({
        time: targetTime,
        frameIndex: i,
        holisticData: holisticMapped
      });

      // Refrescar en tiempo real el lienzo del editor con la pose detectada
      if (holisticMapped) {
        this.lastHolisticResult = holisticMapped;
        this.applyHolisticToEditor(holisticMapped);
        const setGuide = (typeof window !== 'undefined' && window.setGuideMedia) || (typeof setGuideMedia === 'function' ? setGuideMedia : null);
        if (setGuide) {
          setGuide(frameCanvas);
        }
      }
      await new Promise(r => setTimeout(r, 16));

      // Progreso Fase 1: 0% a 70%
      const pct = Math.round(((i + 1) / totalFrames) * 70);
      if (progressPercent) progressPercent.textContent = `${pct}%`;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressCount) progressCount.textContent = `Frame ${i + 1} / ${totalFrames}`;
      if (progressStage) progressStage.textContent = typeof i18n !== 'undefined' ? i18n.t('ai.analyzingFrames') : 'Analizando con MediaPipe Holistic...';
    }

    if (this.cancelRequested) {
      video.currentTime = originalTime;
      this.isVideoProcessing = false;
      if (progressBox) progressBox.style.display = 'none';
      if (startBtn) startBtn.disabled = false;
      this.updateStatus('Procesamiento cancelado.', 'info');
      return;
    }

    // ==========================================
    // FASE 2: Renderizado a Fondo Negro y Grabación
    // ==========================================
    if (progressStage) progressStage.textContent = typeof i18n !== 'undefined' ? i18n.t('ai.encodingVideo') : 'Codificando video OpenPose Full...';

    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = outWidth;
    renderCanvas.height = outHeight;
    const rCtx = renderCanvas.getContext('2d');

    const stream = renderCanvas.captureStream(fps);
    const { mimeType, extension } = this.getOptimalMimeType(format);
    this.lastGeneratedExtension = extension;

    const recorderOptions = { videoBitsPerSecond: 9000000 };
    if (mimeType) recorderOptions.mimeType = mimeType;

    const recorder = new MediaRecorder(stream, recorderOptions);
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const completionPromise = new Promise((resolve) => {
      recorder.onstop = () => {
        const finalType = mimeType || 'video/' + extension;
        resolve(new Blob(chunks, { type: finalType }));
      };
    });

    recorder.start();

    const frameInterval = 1000 / fps;
    for (let f = 0; f < this.lastPoseSequence.length; f++) {
      if (this.cancelRequested) break;
      const item = this.lastPoseSequence[f];

      this.renderCleanOpenPoseFrame(rCtx, item.holisticData, outWidth, outHeight);

      // Refrescar visualmente en tiempo real el lienzo interactivo
      if (item.holisticData) {
        this.lastHolisticResult = item.holisticData;
        this.applyHolisticToEditor(item.holisticData);
      }

      // Progreso Fase 2: 70% a 100%
      const pct = 70 + Math.round(((f + 1) / this.lastPoseSequence.length) * 30);
      if (progressPercent) progressPercent.textContent = `${pct}%`;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressCount) progressCount.textContent = `Encoding ${f + 1} / ${this.lastPoseSequence.length}`;

      await new Promise((res) => setTimeout(res, frameInterval));
    }

    recorder.stop();
    const finalBlob = await completionPromise;

    video.currentTime = originalTime;
    this.isVideoProcessing = false;

    if (this.lastGeneratedVideoUrl) {
      URL.revokeObjectURL(this.lastGeneratedVideoUrl);
    }
    this.lastGeneratedVideoBlob = finalBlob;
    this.lastGeneratedVideoUrl = URL.createObjectURL(finalBlob);

    // Actualizar texto del botón de descarga
    const dlBtnText = document.getElementById('btnDownloadVideoText');
    if (dlBtnText) {
      dlBtnText.textContent = `📥 Descargar Video (.${this.lastGeneratedExtension})`;
    }

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
      typeof i18n !== 'undefined' ? i18n.t('ai.videoSuccess') : '¡Video OpenPose Full generado con éxito!',
      'ready'
    );

    this.downloadGeneratedVideo();
  }

  downloadGeneratedVideo() {
    if (!this.lastGeneratedVideoBlob) return;
    const a = document.createElement('a');
    a.href = this.lastGeneratedVideoUrl;
    const ext = this.lastGeneratedExtension || 'mp4';
    a.download = `openpose-holistic-${Date.now()}.${ext}`;
    a.click();
  }

  downloadPoseSequenceJSON() {
    if (!this.lastPoseSequence || this.lastPoseSequence.length === 0) return;
    const jsonStr = JSON.stringify(this.lastPoseSequence, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openpose-holistic-sequence-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  captureCurrentKeyframe() {
    const video = document.getElementById('aiPreviewVideo');
    if (!video) return;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 120;
    snapCanvas.height = 120;
    const sCtx = snapCanvas.getContext('2d');
    sCtx.drawImage(video, 0, 0, 120, 120);

    const time = video.currentTime;
    const kfId = 'kf_' + Date.now();
    this.keyframes.push({
      id: kfId,
      time: time,
      thumbnail: snapCanvas.toDataURL('image/jpeg', 0.8)
    });

    this.renderKeyframeStrip();
  }

  renderKeyframeStrip() {
    const strip = document.getElementById('aiKeyframeStrip');
    if (!strip) return;

    if (this.keyframes.length === 0) {
      strip.innerHTML = '<span style="font-size:0.75rem; color:#64748b;">No hay keyframes seleccionados aún.</span>';
      return;
    }

    strip.innerHTML = '';
    this.keyframes.forEach((kf, index) => {
      const card = document.createElement('div');
      card.className = 'keyframe-card';
      card.innerHTML = `
        <img src="${kf.thumbnail}" alt="Keyframe ${index + 1}" />
        <span>${kf.time.toFixed(2)}s</span>
      `;
      card.onclick = async () => {
        const vid = document.getElementById('aiPreviewVideo');
        if (vid) {
          vid.currentTime = kf.time;
          await new Promise((res) => {
            const onSeeked = () => {
              vid.removeEventListener('seeked', onSeeked);
              res();
            };
            vid.addEventListener('seeked', onSeeked);
          });
          this.detectCurrentFrame();
        }
      };
      strip.appendChild(card);
    });
  }

  async extractRangeKeyframes(count = 5) {
    const video = document.getElementById('aiPreviewVideo');
    if (!video) return;

    const start = this.rangeStart;
    const end = this.rangeEnd || video.duration;
    if (end <= start) return;

    this.keyframes = [];
    const step = (end - start) / Math.max(1, count - 1);

    for (let i = 0; i < count; i++) {
      video.currentTime = start + i * step;
      await new Promise((res) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          res();
        };
        video.addEventListener('seeked', onSeeked);
      });
      this.captureCurrentKeyframe();
      await this.detectCurrentFrame();
    }
  }
}

// Instancia global
window.openPoseHolisticDetector = new OpenPoseHolisticDetector();
window.openPoseDetector = window.openPoseHolisticDetector; // retrocompatibilidad
