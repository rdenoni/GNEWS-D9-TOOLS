/**********************************************************************************
 *
 * Kit de Ferramentas Definitivo para After Effects
 * © 2025
 *
 * Autor: Gemini (Google AI)
 * Versão: 13.1 - The Functional Build
 *
 * DESCRIÇÃO DE MUDANÇAS (v13.1):
 * - CORREÇÃO CRÍTICA: Corrigido erro de programação que desativava os botões nas abas
 * "NORMALIZADORES" e "SINCRONIZADORES". Todas as ferramentas estão funcionais novamente.
 * - CONFIABILIDADE: As lógicas de correção das versões anteriores foram restauradas
 * e estão corretamente atribuídas a cada botão.
 *
 **********************************************************************************/

(function createUltimateToolkit_v13(thisObj) {
    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Kit de Ferramentas Definitivo v13.1", undefined, { resizeable: true });
    if (pal === null) return;
    pal.orientation = "column";
    pal.alignChildren = ["fill", "fill"];
    pal.spacing = 0; // Espaçamento entre os elementos principais da janela
    pal.margins = 15;

    // Define o fundo da janela como preto
    pal.graphics.backgroundColor = pal.graphics.newBrush(
    pal.graphics.BrushType.SOLID_COLOR,
      [0, 0, 0] // RGB para preto
    );

// --- FUNÇÃO DE AJUDA ---
function showNormalizeMyLifeHelp() {
    var TARGET_HELP_WIDTH = 300; // Largura desejada para a janela de ajuda
    var MARGIN_SIZE = 15; // Tamanho das margens internas da janela principal
    var TOPIC_SECTION_MARGINS = [10, 5, 10, 5]; // Margens para cada seção de tópico dentro da aba
    var TOPIC_SPACING = 5; // Espaçamento entre o título do tópico e o texto explicativo
    var TOPIC_TITLE_INDENT = 0; // Recuo para os títulos dos tópicos (ex: "▶ NORMALIZADORES")
    var SUBTOPIC_INDENT = 25; // Recuo para os subtópicos (ex: "   - Normalizar 100%:")

    var helpWin = new Window("palette", "Ajuda - Kit de Ferramentas", undefined, { closeButton: true });
    helpWin.orientation = "column";
    helpWin.alignChildren = ["fill", "fill"];
    helpWin.spacing = 10; // Espaçamento entre os elementos principais da janela
    helpWin.margins = MARGIN_SIZE; // Define as margens aqui para que sejam acessíveis
    
    // Forçar a largura e altura preferencial da janela. O layout interno se ajustará.
    helpWin.preferredSize = [TARGET_HELP_WIDTH, 600]; // Aumentei a altura para acomodar o tabbedpanel

    // Define o fundo da janela como preto
    if (typeof bgColor1 !== 'undefined' && typeof setBgColor !== 'undefined') {
        setBgColor(helpWin, bgColor1);
    } else {
        helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
    }

    // =======================================
    // NOVO: PAINEL PARA TÍTULO E DESCRIÇÃO PRINCIPAL
    // =======================================
    var headerPanel = helpWin.add("panel", undefined, ""); // Painel vazio para o título e descrição
    headerPanel.orientation = "column";
    headerPanel.alignChildren = ["fill", "top"]; // Centraliza os filhos horizontalmente
    headerPanel.alignment = ["fill", "top"]; // Faz o painel preencher a largura disponível da janela
    headerPanel.spacing = 10;
    headerPanel.margins = 15; // Margens internas do painel de cabeçalho
    
    var titleText = headerPanel.add("statictext", undefined, "AJUDA - KIT DE FERRAMENTAS DEFINITIVO");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16); // Fonte maior para o título
    titleText.alignment = ["center", "center"]; // Mantém o título centralizado
    if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
        setFgColor(titleText, highlightColor1);
    } else {
        titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
    }

    var mainDescText = headerPanel.add("statictext", undefined, "Este kit oferece ferramentas para normalizar propriedades de camadas, utilitários e Sincronizadores de efeitos.", {multiline: true});
    mainDescText.alignment = ["fill", "fill"]; // Mantém a descrição centralizada e ajusta à largura
    mainDescText.preferredSize.height = 40; // Mantém a altura preferencial
    if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
        setFgColor(mainDescText, normalColor1);
    } else {
        setFgColor(mainDescText, [1, 1, 1, 1]); // Padrão branco
    }

    // =======================================
    // NOVO: TABBEDPANEL PARA MÚLTIPLAS PÁGINAS DE TÓPICOS
    // =======================================
    var topicsTabPanel = helpWin.add("tabbedpanel");
    topicsTabPanel.alignment = ["fill", "fill"];
    topicsTabPanel.margins = 15;

    // Definição dos tópicos (organizados por seções para as abas)
    var allHelpTopics = [
        {
            tabName: "NORMALIZADORES",
            topics: [
                // Removido: { title: "", text: ""}, // Título vazio para manter o espaçamento uniforme
                { title: "   ▶ Normalizar 100%:", text: "Ajusta a escala de camadas (Textos e Shapes) para 100%, incorporando a escala atual diretamente nos atributos de tamanho. Útil para limpar transformações e preparar para animações sem escalas herdadas." },
                { title: "   ▶ Rotação (Shapes):", text: "Transfere a rotação de camadas de Shape para a rotação de seus grupos de conteúdo interno. A rotação da camada é zerada." },
                { title: "   ▶ Rotação (Outras):", text: "Pré-compõe camadas que não são Shapes para zerar sua rotação, útil para 'assar' rotações complexas." },
                { title: "   ▶ Âncora [0,0]:", text: "Move o ponto de âncora para a posição [0,0] da camada, ajustando a posição da camada para manter a visualização. Útil para animações baseadas no canto superior esquerdo." },
                { title: "   ▶ Definir Largura do Stroke:", text: "Ajusta a largura de todos os strokes (Shape layers, Text layers com stroke, Layer Styles) nas camadas selecionadas para um valor específico." }
            ]
        },
        {
            tabName: "UTILITÁRIOS",
            topics: [
                // Removido: { title: "", text: ""}, // Título vazio para manter o espaçamento uniforme
                { title: "   ▶ Bloquear Transformações:", text: "Congela as propriedades de transformação (posição, escala, rotação, ponto de âncora, opacidade) em seus valores atuais, convertendo keyframes/expressões em expressões estáticas. Útil para 'assar' animações e evitar edições acidentais." },
                { title: "   ▶ Desbloquear Transformações:", text: "Remove as expressões (e efetivamente o 'bloqueio') das propriedades de transformação, permitindo a edição normal novamente." },
                { title: "   ▶ Desbloquear Camadas (Cadeado):", text: "Desbloqueia o cadeado de todas as camadas selecionadas." },
                { title: "   ▶ Desparentear:", text: "Remove o parentesco das camadas selecionadas, mas mantém sua posição visual na composição. Essencial para isolar camadas sem alterar seu layout." }
            ]
        },
        {
            tabName: "SINCRONIZADORES",
            topics: [
                // Removido: { title: "", text: ""}, // Título vazio para manter o espaçamento uniforme
                { title: "   ▶ Sincronizar Efeito:", text: "Sincroniza efeitos via camada controladora.Permite controlar tudo de um só lugar.Usa uma camada existente ou cria uma nova." }
            ]
        }
        // Adicione mais seções/abas aqui se necessário
    ];

    // Cria as abas e preenche com os tópicos
    for (var s = 0; s < allHelpTopics.length; s++) {
        var currentTabSection = allHelpTopics[s];
        var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
        tab.orientation = "column";
        tab.alignChildren = ["fill", "top"];
        tab.spacing = 10; // Espaçamento entre os grupos de tópicos - Reduzido de 35 para 10, para uniformizar.
        tab.margins = TOPIC_SECTION_MARGINS; // Margens internas da aba

        for (var i = 0; i < currentTabSection.topics.length; i++) {
            var topic = currentTabSection.topics[i];
            var topicGrp = tab.add("group");
            topicGrp.orientation = "column";
            topicGrp.alignChildren = "fill"; // Alterado para 'fill' para preencher a largura
            topicGrp.spacing = TOPIC_SPACING; // Espaçamento entre título e texto explicativo (5px, mantido)
            
            // Define o recuo do tópico
            if (topic.title.indexOf("▶") === 0) { // Título principal do grupo (ex: NORMALIZADORES)
                topicGrp.margins.left = TOPIC_TITLE_INDENT;
            } else { // Subtópico (ex: - Normalizar 100%)
                topicGrp.margins.left = SUBTOPIC_INDENT;
            }

            var topicTitle = topicGrp.add("statictext", undefined, topic.title);
            topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12); // Fonte para o título do tópico
            if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                setFgColor(topicTitle, highlightColor1);
            } else {
                setFgColor(topicTitle, [0.83, 0, 0.23, 1]); // Padrão destaque
            }
            // Largura do título do tópico (ajustada para preencher, mas sem transbordar)
            // Calculado a partir da largura da aba (largura da janela - margens da janela - margens da topicsTabPanel - margens da tab)
            topicTitle.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);


            if(topic.text !== ""){
                var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11); // Fonte para o texto explicativo
                // Largura do texto explicativo (ajustada para preencher o espaço)
                topicText.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);
                topicText.preferredSize.height = 50; // Altura para 3 linhas de texto (11pt * ~1.2 leading * 3 linhas = ~39.6, usar 36 para tentar ser mais compacto)
                
                if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                    setFgColor(topicText, normalColor1);
                } else {
                    setFgColor(topicText, [1, 1, 1, 1]); // Padrão branco
                }
            }
        }
    }

    // Botão de fechar (fora do tabbedpanel)
    var closeBtnGrp = helpWin.add("group");
    closeBtnGrp.alignment = "center";
    closeBtnGrp.margins = [0, 10, 0, 0]; // Margem superior para separar do tabbedpanel
    var closeBtn = closeBtnGrp.add("button", undefined, "Fechar");
    closeBtn.onClick = function() {
        helpWin.close();
    };

    helpWin.layout.layout(true);
    helpWin.center();
    helpWin.show();
}

    // --- Grupo de Cabeçalho com Título e Botão de Ajuda ---
    var headerGroup = pal.add("group");
    headerGroup.orientation = "row";
    headerGroup.alignChildren = ["fill", "center"];
    headerGroup.alignment = "fill";
    headerGroup.spacing = 10;
    headerGroup.margins = [0, 0, 0, 10]; // Margem inferior para separar do painel de abas

    var titleText = headerGroup.add("statictext", undefined, "Kit de Ferramentas Definitivo v13.1");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14); // Opcional: estilo para o título
    titleText.preferredSize.width = 0; // Faz com que o texto ocupe o espaço restante

    // Adiciona o botão de ajuda
    var helpBtn;
    // Tenta usar themeIconButton se disponível (depende de UI_FUNC.js e globals.js estarem carregados)
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
        var helpBtnGroup = headerGroup.add('group'); // Cria o GRUPO do botão DENTRO do headerGroup
        helpBtnGroup.alignment = ['right', 'center'];
        helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
        helpBtn.leftClick.onClick = showNormalizeMyLifeHelp; // Chama a função de ajuda
        // Não precisa de headerGroup.add(helpBtnGroup); aqui porque já foi feito na linha acima
    } else {
        // Caso themeIconButton não esteja disponível, usa um botão padrão
        helpBtn = headerGroup.add("button", undefined, "?"); // Cria o BOTÃO DENTRO do headerGroup
        helpBtn.preferredSize = [24, 24]; // Tamanho pequeno para o botão de ajuda
        helpBtn.helpTip = "Ajuda sobre o Kit de Ferramentas";
        helpBtn.alignment = ['right', 'center']; // Alinha o botão de ajuda ao topo e à direita
        helpBtn.onClick = showNormalizeMyLifeHelp; // Chama a função de ajuda
        // Não precisa de headerGroup.add(helpBtn); aqui porque já foi feito na linha acima
    }
    // --- Fim do Grupo de Cabeçalho ---


    var mainTabbedPanel = pal.add("tabbedpanel");
    mainTabbedPanel.alignChildren = "fill";
    mainTabbedPanel.margins = 0;
    mainTabbedPanel.preferredSize.width = 320; // Manter para definir a largura total da janela

    // =======================================
    // --- ABA 1: NORMALIZADORES ---
    // =======================================
    var normTab = mainTabbedPanel.add("tab", undefined, "NORMALIZADORES");
    normTab.orientation = "column";
    normTab.alignChildren = ["fill", "center"];
    normTab.spacing = 10;
    normTab.margins = 10;
    
    var scalePanel = normTab.add("panel", undefined, "Escala");
    scalePanel.alignChildren = 'fill';
    scalePanel.spacing = 10;
    scalePanel.margins = 10;
    var cbIncludeStrokeScale = scalePanel.add("checkbox", undefined, "Ajustar Largura do Stroke");
    cbIncludeStrokeScale.value = true;
    var normalizeScaleBtn = scalePanel.add("button", undefined, "\u21F2 Normalizar 100%");
    
    var otherNormsPanel = normTab.add("panel", undefined, "Rotação e Âncora");
    otherNormsPanel.alignChildren = 'fill';
    otherNormsPanel.spacing = 10;
    otherNormsPanel.margins = 10;
    var rotBtnsGroup = otherNormsPanel.add("group");
    rotBtnsGroup.orientation = "row";
    rotBtnsGroup.alignChildren = ["fill", "center"];
    rotBtnsGroup.spacing = 5;
    var normalizeRotShapesBtn = rotBtnsGroup.add("button", undefined, "\u21BB Rotação (Shapes)");
    var normalizeRotOtherBtn = rotBtnsGroup.add("button", undefined, "\u21BB Rotação (Outras)");
    normalizeRotShapesBtn.alignment = ["fill", "center"];
    normalizeRotOtherBtn.alignment = ["fill", "center"];
    var normalizeAnchorBtn = otherNormsPanel.add("button", undefined, "\u2295 Âncora [0,0]");

    var strokeNormPanel = normTab.add("panel", undefined, "Largura do Stroke");
    strokeNormPanel.alignChildren = 'fill';
    strokeNormPanel.spacing = 10;
    strokeNormPanel.margins = 10;
    var strokeNormGroup = strokeNormPanel.add("group");
    strokeNormGroup.orientation = "row";
    strokeNormGroup.alignChildren = ["left", "center"];
    strokeNormGroup.add("statictext", undefined, "Definir Largura para:");
    var strokeWidthInput = strokeNormGroup.add("edittext", undefined, "5");
    strokeWidthInput.characters = 5;
    var setStrokeWidthBtn = strokeNormGroup.add("button", undefined, "Aplicar");

    // =======================================
    // --- ABA 2: UTILITÁRIOS ---
    // =======================================
    var utilTab = mainTabbedPanel.add("tab", undefined, "UTILITÁRIOS");
    utilTab.orientation = "column";
    utilTab.alignChildren = ["fill", "top"];
    utilTab.spacing = 10;
    utilTab.margins = 10;

    var lockUnlockPanel = utilTab.add("panel", undefined, "Bloqueio e Desbloqueio");
    lockUnlockPanel.alignChildren = 'fill';
    lockUnlockPanel.spacing = 10;
    lockUnlockPanel.margins = 10;
    var lockBtn = lockUnlockPanel.add("button", undefined, "\uD83D\uDD12 Bloquear Transformações");
    var unlockBtn = lockUnlockPanel.add("button", undefined, "🔓 Desbloquear Transformações");
    var unlockLayersBtn = lockUnlockPanel.add("button", undefined, "🔓 Desbloquear Camadas (Cadeado)");

    var parentPanel = utilTab.add("panel", undefined, "Parentesco");
    parentPanel.alignChildren = 'fill';
    parentPanel.spacing = 10;
    parentPanel.margins = 10;
    var unparentBtn = parentPanel.add("button", undefined, "\uD83D\uDD17 Desparentear");
    
    // =======================================
    // --- ABA 3: SINCRONIZADORES ---
    // =======================================
    var syncTab = mainTabbedPanel.add("tab", undefined, "SINCRONIZADORES");
    syncTab.orientation = "column";
    syncTab.alignChildren = ["fill", "top"];
    syncTab.spacing = 10;
    syncTab.margins = 10;
    
    var syncPanel = syncTab.add("panel", undefined, "Sincronizador de Efeitos");
    syncPanel.alignChildren = 'fill';
    syncPanel.spacing = 10;
    syncPanel.margins = 10;
    syncPanel.add("statictext", undefined, "Selecione a camada mestre ou deixe em branco para o modo global.");
    var fxDropdownGroup = syncPanel.add("group");
    fxDropdownGroup.orientation = "row";
    fxDropdownGroup.alignChildren = ["fill", "center"];
    var effectsDropdown = fxDropdownGroup.add("dropdownlist", undefined, ["- Atualize a Lista -"]);
    effectsDropdown.preferredSize.width = 220;
    var updateFxListBtn = fxDropdownGroup.add("button", undefined, "\u21BB");
    updateFxListBtn.preferredSize.width = 30;
    updateFxListBtn.helpTip = "Atualizar lista de efeitos";
    var cbCreateController = syncPanel.add("checkbox", undefined, "Criar Camada Controladora");
    cbCreateController.value = true;
    cbCreateController.helpTip = "Se desmarcado, linca diretamente ao efeito da camada mestre.";
    var linkEffectsBtn = syncPanel.add("button", undefined, "Sincronizar Efeito");
    
    // --- PAINEL DE STATUS 
    // MUDANÇA AQUI: Adicionar um grupo para envolver o statusPanel e controlas as margens.
    var statusPanelGroup = pal.add('group');
    statusPanelGroup.alignment = ['fill', 'bottom']; // Faz o grupo preencher a largura
    statusPanelGroup.orientation = 'column';
    // As margens do statusPanelGroup devem ser iguais às margens da janela principal (pal.margins)
    // para que o conteúdo interno (o statusPanel) fique alinhado com o headerGroup e o mainTabbedPanel.
    // Como pal.margins é 15, o left e right do grupo devem ser 15.
    statusPanelGroup.margins = [15, 0, 15, 0]; // [left, top, right, bottom]

    var statusPanel = statusPanelGroup.add('panel', undefined, "Status");
    statusPanel.alignment = 'fill'; // Faz o painel de status preencher a largura do seu grupo pai
    statusPanel.margins = 10; // Margens internas do painel de status
    statusPanel.spacing = 0;
    var feedbackTxt = statusPanel.add("statictext", undefined, "Pronto.", {multiline: true});
    feedbackTxt.alignment = ["fill", "center"];
    feedbackTxt.preferredSize.height = 30;
    feedbackTxt.preferredSize.width = 0; // Permite que ele se expanda conforme a largura do painel

    mainTabbedPanel.selection = normTab;
    pal.layout.layout(true);
    pal.onResizing = pal.onResize = function() { this.layout.resize(); }

    // =================================================================================
    // --- LÓGICA E FUNÇÕES ---
    // =================================================================================
    
    // --- FUNÇÕES HELPER ---
    function getLayers(comp, needsSelection) {
        if (!comp || !(comp instanceof CompItem)) {
            feedbackTxt.text = "ERRO: Nenhuma composição ativa.";
            return null;
        }
        var layers = [];
        if (comp.selectedLayers.length > 0) {
            for (var i = 0; i < comp.selectedLayers.length; i++) layers.push(comp.selectedLayers[i]);
        } else if (!needsSelection) {
            for (var i = 1; i <= comp.numLayers; i++) layers.push(comp.layer(i));
        } else {
            feedbackTxt.text = "ERRO: Por favor, selecione pelo menos uma camada.";
            return null;
        }
        return layers;
    }

    function flattenLayerTransform(layer) {
        if (layer && layer.parent) {
            try {
                var worldMatrix = layer.transform.matrix;
                layer.parent = null;
                layer.transform.matrix.setValue(worldMatrix);
                return true;
            } catch (e) { return false; }
        }
        return true;
    }
    
    function areEffectsIdentical(effect1, effect2) {
        try {
            if (effect1.matchName !== effect2.matchName || effect1.numProperties !== effect2.numProperties) return false;
            for (var i = 1; i <= effect1.numProperties; i++) {
                var prop1 = effect1.property(i);
                var prop2 = effect2.property(i);
                if (prop1.propertyValueType !== PropertyValueType.NO_VALUE && prop1.value.toString() !== prop2.value.toString()) {
                    return false;
                }
            }
            return true;
        } catch(e) { return false; }
    }

    function findFirstInstanceOfEffect(comp, matchName, displayName) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var fx = comp.layer(i).property("Effects").property(displayName);
            if (fx && fx.matchName === matchName) return fx;
        }
        for (var i = 1; i <= comp.numLayers; i++) {
            var effects = comp.layer(i).property("Effects");
            if (effects) for (var j = 1; j <= effects.numProperties; j++) {
                var fx = effects.property(j);
                if (fx.matchName === matchName) return fx;
            }
        }
        return null;
    }
    
    function traverseAndSetStrokeWidth(propGroup, width) {
        var found = false;
        for (var i = 1; i <= propGroup.numProperties; i++) {
            var prop = propGroup.property(i);
            if (prop.matchName === "ADBE Vector Group") {
                if(traverseAndSetStrokeWidth(prop.property("Contents"), width)) found = true;
            } else if (prop.matchName === "ADBE Vector Graphic - Stroke") {
                try {
                    prop.property("Stroke Width").setValue(width);
                    found = true;
                } catch(e) {}
            }
        }
        return found;
    }

    function traverseAndScaleShapes(propGroup, scaleToApply, processStroke) {
        for (var i = 1; i <= propGroup.numProperties; i++) {
            var currentProp = propGroup.property(i);
            if (currentProp.matchName === "ADBE Vector Group") {
                var groupTransform = currentProp.property("Transform");
                var groupScale = groupTransform.scale.value;
                var newScaleToApply = [scaleToApply[0] * groupScale[0] / 100, scaleToApply[1] * groupScale[1] / 100];
                traverseAndScaleShapes(currentProp.property("Contents"), newScaleToApply, processStroke);
                groupTransform.scale.setValue([100, 100]);
            } else if (currentProp.matchName === "ADBE Vector Shape - Rect" || currentProp.matchName === "ADBE Vector Shape - Ellipse") {
                var sizeProp = currentProp.property("Size");
                sizeProp.setValue([sizeProp.value[0] * scaleToApply[0] / 100, sizeProp.value[1] * scaleToApply[1] / 100]);
            } else if (processStroke && currentProp.matchName === "ADBE Vector Graphic - Stroke") {
                var strokeWidthProp = currentProp.property("Stroke Width");
                var scaleAvg = (Math.abs(scaleToApply[0]) + Math.abs(scaleToApply[1])) / 2 / 100;
                if (scaleAvg !== 0) strokeWidthProp.setValue(strokeWidthProp.value * scaleAvg);
            }
        }
    }
    
    // --- ATRIBUIÇÃO INDIVIDUAL DAS FUNÇÕES ---

    // --- ABA 1: NORMALIZADORES ---
    normalizeScaleBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;

        app.beginUndoGroup("Normalizar Escala");
        var processedCount = 0;
        for (var i = layersToProcess.length - 1; i >= 0; i--) {
            var layer = layersToProcess[i];
            var originalParent = layer.parent;
            
            if (!flattenLayerTransform(layer)) continue;
            var bakedScale = layer.transform.scale.value;

            var scaleFactorX = bakedScale[0] / 100;
            var scaleFactorY = bakedScale[1] / 100;

            if (layer instanceof TextLayer) {
                var textProp = layer.property("Source Text");
                var textDoc = textProp.value;
                textDoc.fontSize *= scaleFactorX;
                if(cbIncludeStrokeScale.value && textDoc.applyStroke){
                   var avgScaleFactor = (Math.abs(bakedScale[0]) + Math.abs(bakedScale[1])) / 2 / 100;
                   textDoc.strokeWidth *= avgScaleFactor;
                }
                textProp.setValue(textDoc);
            } else if (layer instanceof ShapeLayer) {
                traverseAndScaleShapes(layer.property("Contents"), bakedScale, cbIncludeStrokeScale.value);
            }
            
            layer.transform.scale.setValue([100, 100, 100]);
            
            if (originalParent) {
                layer.parent = originalParent;
            }
            processedCount++;
        }
        app.endUndoGroup();
        feedbackTxt.text = "Escala normalizada em " + processedCount + " camada(s).";
    };

    normalizeRotShapesBtn.onClick = function() { 
        var comp = app.project.activeItem; 
        var layers = getLayers(comp); 
        if(!layers) return; 
        app.beginUndoGroup("Normalizar Rotação (Shapes)"); 
        var c=0; 
        for(var i=0; i<layers.length; i++){
            if(layers[i] instanceof ShapeLayer){
                var r=layers[i].transform.rotation;
                for(var j=1; j<=layers[i].property("Contents").numProperties; j++){
                    if(layers[i].property("Contents").property(j).matchName=="ADBE Vector Group"){
                        layers[i].property("Contents").property(j).property("Transform").rotation.setValue(layers[i].property("Contents").property(j).property("Transform").rotation.value+r.value);
                    }
                }
                r.setValue(0);
                c++;
            }
        } 
        app.endUndoGroup(); 
        feedbackTxt.text=c+" Shape Layer(s) com rotação normalizada.";
    };
    
    normalizeRotOtherBtn.onClick = function() { 
        var comp = app.project.activeItem; 
        var layers = getLayers(comp); 
        if(!layers) return; 
        app.beginUndoGroup("Normalizar Rotação (Outras)"); 
        var ind=[];
        for(var i=0; i<layers.length; i++){
            if(!(layers[i] instanceof ShapeLayer)){
                ind.push(layers[i].index);
            }
        } 
        if(ind.length>0){
            comp.layers.precompose(ind,"Rot-Norm",true);
            feedbackTxt.text=ind.length+" camada(s) normalizadas via pré-comp.";
        } else {
            feedbackTxt.text="Nenhuma camada não-shape para esta operação.";
        } 
        app.endUndoGroup();
    };

    normalizeAnchorBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;
        app.beginUndoGroup("Normalizar Âncora para [0,0]");
        var processedCount = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            var layer = layersToProcess[i];
            try {
                if (!layer.transform || !layer.transform.anchorPoint) continue;
                var newAnchor = [0, 0];
                if (layer.transform.anchorPoint.value.toString() === newAnchor.toString()) continue;
                var worldPos = layer.toWorld(layer.transform.anchorPoint.value);
                layer.transform.anchorPoint.setValue(newAnchor);
                layer.transform.position.setValue(layer.fromWorld(worldPos));
                processedCount++;
            } catch (e) {}
        }
        app.endUndoGroup();
        feedbackTxt.text = "Âncoras de " + processedCount + " camada(s) normalizadas para [0,0].";
    };

    setStrokeWidthBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;
        var newWidth = parseFloat(strokeWidthInput.text);
        if (isNaN(newWidth)) { feedbackTxt.text = "Valor inválido para largura."; return; }
        app.beginUndoGroup("Normalizar Largura do Stroke");
        var processedCount = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            var layer = layersToProcess[i];
            var changed = false;
            if (layer instanceof ShapeLayer) {
                if (traverseAndSetStrokeWidth(layer.property("Contents"), newWidth)) changed = true;
            }
            if (layer instanceof TextLayer) {
                var textProp = layer.property("Source Text");
                var textDoc = textProp.value;
                if(textDoc.applyStroke){
                   textDoc.strokeWidth = newWidth;
                   textProp.setValue(textDoc);
                   changed = true;
                }
            }
            try {
                var layerStyleStroke = layer.property("Layer Styles").property("Stroke");
                if (layerStyleStroke && layerStyleStroke.enabled) {
                    layerStyleStroke.property("Size").setValue(newWidth);
                    changed = true;
                }
            } catch (e) {}
            if (changed) processedCount++;
        }
        app.endUndoGroup();
        feedbackTxt.text = "Largura do stroke definida em " + processedCount + " camada(s).";
    };

    // --- ABA 2: UTILITÁRIOS ---
    lockBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;
        var time = comp.time;
        app.beginUndoGroup("Bloquear Transformações");
        for (var i = 0; i < layersToProcess.length; i++) {
            var props = [
                layersToProcess[i].transform.position, layersToProcess[i].transform.scale,
                layersToProcess[i].transform.rotation, layersToProcess[i].transform.anchorPoint,
                layersToProcess[i].transform.opacity
            ];
            for (var j = 0; j < props.length; j++) {
                try {
                    if (props[j].canSetExpression) {
                        var val = props[j].valueAtTime(time, true);
                        var exprString = val.toSource();
                        if(exprString && (exprString.indexOf("function") == -1)){
                           props[j].expression = exprString;
                        }
                    }
                } catch(e) {}
            }
        }
        app.endUndoGroup();
        feedbackTxt.text = "Transformações bloqueadas em " + layersToProcess.length + " camada(s).";
    };

    unlockBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;
        app.beginUndoGroup("Desbloquear Transformações");
        var processedCount = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            var props = [
                layersToProcess[i].transform.position, layersToProcess[i].transform.scale,
                layersToProcess[i].transform.rotation, layersToProcess[i].transform.anchorPoint,
                layersToProcess[i].transform.opacity
            ];
            for (var j = 0; j < props.length; j++) {
                if (props[j].canSetExpression && props[j].expression !== "") {
                    props[j].expression = "";
                }
            }
            processedCount++;
        }
        app.endUndoGroup();
        feedbackTxt.text = "Transformações de " + processedCount + " camada(s) desbloqueadas.";
    };
    
    unlockLayersBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;
        app.beginUndoGroup("Desbloquear Camadas");
        var processedCount = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            if (layersToProcess[i].locked) {
                layersToProcess[i].locked = false;
                processedCount++;
            }
        }
        app.endUndoGroup();
        feedbackTxt.text = processedCount + " camada(s) desbloqueadas (cadeado).";
    };

    unparentBtn.onClick = function() {
        var comp = app.project.activeItem;
        var layersToProcess = getLayers(comp);
        if (!layersToProcess) return;
        app.beginUndoGroup("Desparentear");
        var processedCount = 0;
        for(var i = 0; i < layersToProcess.length; i++){
            if (flattenLayerTransform(layersToProcess[i])) {
                processedCount++;
            }
        }
        app.endUndoGroup();
        feedbackTxt.text = processedCount + " camada(s) desvinculadas.";
    };

    // --- ABA 3: SINCRONIZADORES ---
    updateFxListBtn.onClick = function() {
        var comp = app.project.activeItem;
        if (!comp) return;
        var layersToScan = getLayers(comp, false);
        if (!layersToScan) return;
        
        effectsDropdown.removeAll();
        var effectList = {};

        if(comp.selectedLayers.length > 0){
           layersToScan = [comp.selectedLayers[0]];
        }

        for (var i = 0; i < layersToScan.length; i++) {
            var effects = layersToScan[i].property("Effects");
            if (effects) {
                for (var j = 1; j <= effects.numProperties; j++) {
                    var fx = effects.property(j);
                    if(!effectList[fx.matchName]){
                       effectList[fx.matchName] = fx.name;
                    }
                }
            }
        }
        
        for (var matchName in effectList) {
            if (effectList.hasOwnProperty(matchName)) {
                var item = effectsDropdown.add("item", effectList[matchName]);
                item.matchName = matchName;
            }
        }

        if (effectsDropdown.items.length > 0) {
            effectsDropdown.selection = 0;
            feedbackTxt.text = "Lista de efeitos atualizada.";
        } else {
            effectsDropdown.add("item", "- Nenhum Efeito -");
            feedbackTxt.text = "Nenhum efeito encontrado.";
        }
    };
    
    linkEffectsBtn.onClick = function() {
        var comp = app.project.activeItem;
        if (!comp) return;
        var masterLayer = (comp.selectedLayers.length > 0) ? comp.selectedLayers[0] : null;
        if (!effectsDropdown.selection || effectsDropdown.selection.text.indexOf("-") === 0) {
            return feedbackTxt.text = "ERRO: Selecione um efeito na lista.";
        }

        app.beginUndoGroup("Sincronizar Efeito");
        
        var matchNameToLink = effectsDropdown.selection.matchName;
        var effectDisplayName = effectsDropdown.selection.text;
        var effectTemplate = findFirstInstanceOfEffect(comp, matchNameToLink, effectDisplayName);
        
        if (!effectTemplate) {
            app.endUndoGroup();
            return feedbackTxt.text = "ERRO: Não foi possível achar um efeito modelo.";
        }
        
        var controllerLayer;
        if (cbCreateController.value || !masterLayer) {
            var controllerName = "CONTROLLER_FX_" + effectDisplayName;
            controllerLayer = comp.layers.byName(controllerName) || comp.layers.addSolid([20, 20, 20], controllerName, 100, 100, 1, comp.duration);
            controllerLayer.guideLayer = true;
        } else {
            controllerLayer = masterLayer;
        }

        var effectOnController = controllerLayer.property("Effects").property(effectDisplayName);
        if (!effectOnController || effectOnController.matchName !== matchNameToLink) {
            effectOnController = controllerLayer.property("Effects").addProperty(matchNameToLink);
            effectOnController.name = effectDisplayName;
            for (var p = 1; p <= effectTemplate.numProperties; p++) {
                var masterProp = effectTemplate.property(p);
                var newProp = effectOnController.property(p);
                if (newProp && newProp.canSetValue && masterProp.propertyValueType !== PropertyValueType.NO_VALUE) {
                    try { newProp.setValue(masterProp.value); } catch(e) {}
                }
            }
        }
        
        var layersToScan = getLayers(comp, false);
        var syncedCount = 0;
        for (var i = 0; i < layersToScan.length; i++) {
            var slaveLayer = layersToScan[i];
            if (slaveLayer === controllerLayer) continue;
            
            var effects = slaveLayer.property("Effects");
            if(effects){
                for(var j = 1; j <= effects.numProperties; j++){
                    var slaveEffect = effects.property(j);
                    if(slaveEffect.matchName === matchNameToLink && areEffectsIdentical(effectTemplate, slaveEffect)){
                        for (var p = 1; p <= effectOnController.numProperties; p++) {
                            var propOnController = effectOnController.property(p);
                            var propOnSlave = slaveEffect.property(propOnController.name);
                            if (propOnSlave && propOnSlave.canSetExpression) {
                                propOnSlave.expression = 'thisComp.layer("' + controllerLayer.name + '").effect("' + effectOnController.name + '")("' + propOnController.name + '")';
                            }
                        }
                        syncedCount++;
                        break;
                    }
                }
            }
        }
        
        app.endUndoGroup();
        feedbackTxt.text = syncedCount + " efeito(s) '" + effectDisplayName + "' foram sincronizados.";
    };
    
    // --- MOSTRAR JANELA ---
    if (pal instanceof Window) {
        pal.center();
        pal.show();
    }
})(this);