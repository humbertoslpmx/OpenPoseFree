/**
 * Ejemplo de cómo agregar más idiomas a OpenPoseFree
 * Example of how to add more languages to OpenPoseFree
 * 
 * Puedes incluir este script en rkopenpose.html o copiar el bloque dentro de la etiqueta <script>
 * You can include this script in rkopenpose.html or copy this block into the <script> tag:
 * 
 * <script src="languages.example.js"></script>
 */

// Ejemplo 1: Francés (French / Français)
if (typeof i18n !== 'undefined') {
  i18n.registerLanguage('fr', 'Français', {
    title: "OpenPoseFree",
    languageLabel: "🌐 Langue / Language:",
    instructions: {
      step1: "Étape 1. Sélectionnez la taille du canevas (taille de l'image PNG de sortie).",
      step2: "Étape 2. Sélectionnez un préréglage intégré ou chargez un fichier JSON précédemment '<b>enregistré par cette application</b>'.",
      step3: "Étape 3. Ajustez la pose. (Remarque: <i>Saisissez les 'articulations', pas les 'membres'. Vous pouvez aussi utiliser le 'Contrôle de décalage' pour déplacer la pose entière, haut/bas/gauche/droite.</i>)",
      step4: "Étape 4. Une fois l'ajustement terminé, enregistrez le fichier PNG pour l'utiliser avec OpenPose ControlNet."
    },
    canvasSize: {
      label: "Sélectionner la taille du canevas (Taille de l'image PNG OpenPose)"
    },
    presets: {
      label: "Préréglages de pose (Intégrés)",
      loadBtn: "Charger la pose",
      options: {
        "Set 1": "Bras ouverts - Vue de face",
        "Set 2": "Bras ouverts - Vue de gauche",
        "Set 3": "Regard vers la gauche (512x512)",
        "Set 4": "Regard vers la droite - Jambe gauche levée (512x512)",
        "Set 5": "Regard vers la droite - Jambe droite levée (512x512)",
        "Set 6": "Regard vers la droite (512x512)",
        "Set 7": "Main gauche sur la hanche (512x512)",
        "Set 8": "Squat - Vue de face",
        "Set 9": "Squat - Vue latérale gauche",
        "Set 10": "Squat - Vue latérale droite",
        "Set 11": "Debout - Bras écartés",
        "Set 12": "Debout - Vue de face (512x512)",
        "Set 13": "Debout - Vue de face (512x512) Gauche",
        "Set 14": "Debout - Vue de face (512x512) Gauche/Droite",
        "Set 15": "Debout - Vue de face (512x512) Droite",
        "Set 16": "Debout - Vue de face (512x768)",
        "Set 17": "Debout - Vue de face (1024x1024)",
        "Set 18": "Debout - Main droite sur la hanche (512x512)",
        "Set 19": "Debout - Main droite sur la hanche 2 (512x512)",
        "Set 20": "Marche - Vue latérale gauche"
      }
    },
    json: {
      loadLabel: "Charger un fichier JSON de pose",
      saveLabel: "Enregistrer un fichier JSON de pose",
      saveBtn: "Enregistrer JSON",
      invalidJson: "Fichier JSON invalide."
    },
    joystick: {
      shiftLabel: "Décalage:",
      up: "Déplacer vers le haut",
      left: "Déplacer vers la gauche",
      right: "Déplacer vers la droite",
      down: "Déplacer vers le bas"
    },
    export: {
      label: "Enregistrer le fichier PNG pour OpenPose",
      exportBtn: "Exporter PNG"
    },
    tools: {
      boneModeOff: "🦴 Mode Os: DÉSACTIVÉ",
      boneModeOn: "🦴 Mode Os: ACTIVÉ",
      selectAll: "Tous",
      clearSelection: "Effacer",
      selectedCount: "{count} sélectionné(s)",
      canvasTip: "💡 Glissez un rectangle dans le fond pour sélectionner un groupe de points. Activez le Mode Os pour déplacer des membres entiers."
    },
    ai: {
      panelTitle: "Détection de Pose sur Image ou Vidéo (MoveNet IA)",
      selectMediaLabel: "Charger Image ou Vidéo:",
      modelTypeLabel: "Modèle IA:",
      modelThunder: "MoveNet Thunder (Haute Précision)",
      modelLightning: "MoveNet Lightning (Ultra Rapide)",
      statusReady: "Prêt à charger un fichier",
      convertBtn: "⚡ Détecter la pose et charger dans l'éditeur",
      convertImageBtn: "⚡ Convertir l'image en OpenPose",
      convertFrameBtn: "⚡ Convertir l'image vidéo en OpenPose",
      prevFrame: "⏮ -1 Image",
      nextFrame: "+1 Image ⏭",
      captureKeyframeBtn: "📸 Enregistrer l'image clé",
      rangeLabel: "Sélectionner la plage vidéo (Début / Fin):",
      setStartBtn: "📍 Début",
      setEndBtn: "📍 Fin",
      extractRangeBtn: "✂ Extraire 5 images clés",
      keyframesListTitle: "Images clés sélectionnées:",
      noKeyframes: "Aucune image clé capturée pour le moment.",
      showGuideLabel: "Afficher l'image/vidéo d'arrière-plan comme guide",
      guideOpacityLabel: "Opacité:"
    },
    footer: {
      text: "Téléchargez une version autonome et hors ligne de Rock's Simple OpenPose Editor sur"
    }
  });

  // Ejemplo 2: Portugués (Português)
  i18n.registerLanguage('pt', 'Português', {
    title: "OpenPoseFree",
    languageLabel: "🌐 Idioma / Language:",
    instructions: {
      step1: "Passo 1. Selecione o tamanho da tela (tamanho da imagem PNG de saída).",
      step2: "Passo 2. Selecione uma pose pré-definida ou carregue um arquivo JSON previamente '<b>salvo por este aplicativo</b>'.",
      step3: "Passo 3. Ajuste a pose. (Nota: <i>Arraste as 'articulações', não os 'membros'. Você também pode usar o 'Controle de deslocamento' para mover toda a pose, cima/baixo/esquerda/direita.</i>)",
      step4: "Passo 4. Quando terminar de ajustar a pose, salve o arquivo PNG para usar com o OpenPose ControlNet."
    },
    canvasSize: {
      label: "Selecionar tamanho da tela (Tamanho da imagem PNG do OpenPose)"
    },
    presets: {
      label: "Poses predefinidas (Integradas)",
      loadBtn: "Carregar pose",
      options: {
        "Set 1": "Braços abertos - Vista frontal",
        "Set 2": "Braços abertos - Vista lateral esquerda",
        "Set 3": "Olhando para a esquerda (512x512)",
        "Set 4": "Olhando para a direita - Perna esq. levantada (512x512)",
        "Set 5": "Olhando para a direita - Perna dir. levantada (512x512)",
        "Set 6": "Olhando para a direita (512x512)",
        "Set 7": "Mão esquerda na cintura (512x512)",
        "Set 8": "Agachamento - Vista frontal",
        "Set 9": "Agachamento - Vista lateral esquerda",
        "Set 10": "Agachamento - Vista lateral direita",
        "Set 11": "De pé - Braços abertos",
        "Set 12": "De pé - Vista frontal (512x512)",
        "Set 13": "De pé - Vista frontal (512x512) Esquerda",
        "Set 14": "De pé - Vista frontal (512x512) Esq./Dir.",
        "Set 15": "De pé - Vista frontal (512x512) Direita",
        "Set 16": "De pé - Vista frontal (512x768)",
        "Set 17": "De pé - Vista frontal (1024x1024)",
        "Set 18": "De pé - Mão direita na cintura (512x512)",
        "Set 19": "De pé - Mão direita na cintura 2 (512x512)",
        "Set 20": "Caminhando - Vista lateral esquerda"
      }
    },
    json: {
      loadLabel: "Carregar arquivo JSON de pose",
      saveLabel: "Salvar arquivo JSON de pose",
      saveBtn: "Salvar JSON",
      invalidJson: "Arquivo JSON inválido."
    },
    joystick: {
      shiftLabel: "Mover:",
      up: "Mover para cima",
      left: "Mover para a esquerda",
      right: "Mover para a direita",
      down: "Mover para baixo"
    },
    export: {
      label: "Salvar arquivo PNG para OpenPose",
      exportBtn: "Exportar PNG"
    },
    tools: {
      boneModeOff: "🦴 Modo Osso: DESATIVADO",
      boneModeOn: "🦴 Modo Osso: ATIVADO",
      selectAll: "Todos",
      clearSelection: "Limpar",
      selectedCount: "{count} selecionado(s)",
      canvasTip: "💡 Arraste um retângulo no fundo para selecionar um grupo de pontos. Ative o Modo Osso para mover membros inteiros."
    },
    ai: {
      panelTitle: "Detectar Pose em Imagem ou Vídeo (MoveNet IA)",
      selectMediaLabel: "Carregar Imagem ou Vídeo:",
      modelTypeLabel: "Modelo IA:",
      modelThunder: "MoveNet Thunder (Alta Precisão)",
      modelLightning: "MoveNet Lightning (Ultra Rápido)",
      statusReady: "Pronto para carregar arquivo",
      convertBtn: "⚡ Detectar Pose e Carregar no Editor",
      convertImageBtn: "⚡ Converter Imagem para OpenPose",
      convertFrameBtn: "⚡ Converter Frame do Vídeo para OpenPose",
      prevFrame: "⏮ -1 Frame",
      nextFrame: "+1 Frame ⏭",
      captureKeyframeBtn: "📸 Salvar Keyframe",
      rangeLabel: "Selecionar Intervalo do Vídeo (Início / Fim):",
      setStartBtn: "📍 Início",
      setEndBtn: "📍 Fim",
      extractRangeBtn: "✂ Extrair 5 Keyframes no Intervalo",
      keyframesListTitle: "Keyframes Selecionados:",
      noKeyframes: "Nenhum keyframe capturado ainda.",
      showGuideLabel: "Exibir imagem/vídeo de fundo como guia",
      guideOpacityLabel: "Opacidade:"
    },
    footer: {
      text: "Baixe uma versão independente e offline do Rock's Simple OpenPose Editor em"
    }
  });
}
