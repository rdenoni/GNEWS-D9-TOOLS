// Auto Layer Organize Script para After Effects
// Versão 2.6.13 (Adicionado alerta para camadas não modificadas com ajustes de formatação)
// Compatível com ExtendScript do After Effects 2025 (ECMAScript 3)


(function() {
    // START - FUNÇÕES AUXILIARES E CONFIGURAÇÕES DO SCRIPT
    var DEBUG_MODE = true;
    var undoStack = []; // Pilha para armazenar estados para desfazer
    
    function debugLog(message) {
        if (DEBUG_MODE) $.writeln("[DEBUG] " + message);
    }

    var config = {
        language: "PT",
        prefixes: {
            ShapeLayer: "Shp_",
            TextLayer: "Txt_",
            SolidLayer: "Sld_",
            AdjustmentLayer: "Ajust_",
            CompItem: "Comp_",
            CameraLayer: "Cam_",
            NullLayer: "Null_",
            VideoLayer: "Vid_",
            ImageLayer: "Img_"
        }
    };

    // Definindo cores para consistência, se não vierem de um arquivo global
    // Presumindo que estas cores são definidas em 'globals.js' ou similar,
    // mas as definimos aqui como fallback caso não estejam disponíveis
    var bgColor1 = '#0B0D0E'; // Cor de fundo principal
    var normalColor1 = '#C7C8CA'; // Cor de texto normal
    var highlightColor1 = '#E0003A'; // Cor de destaque para títulos de tópico
    // Funções de cor necessárias para o tema
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }


    function getLocalizedString(key) {
        var strings = {
            PT: {
                windowTitle: "Auto Layer Organizer v1.0",
                automateBtn: "▶  EXECUTAR",
                undoBtn: "↩",
                undoBtnTip: "Desfazer última ação do script",
                settingsBtnTip: "Configurações",
                optionsPanel: "Opções",
                applyColorsCheck: "Aplicar cores",
                renameLayersCheck: "Renomear camadas",
                reorderLayersCheck: "Reordenar por tipo",
                reorderLayersTip: "Agrupa por tipo mantendo ordem temporal",
                reorderByTimeCheck: "Reordenar por tempo",
                reorderByTimeTip: "Camadas mais tardias ficam no topo",
                deleteHiddenCheck: "Deletar ocultas",
                statusWaiting: "Aguardando...",
                settingsTitle: "Configurações",
                languageLabel: "Idioma: ",
                prefixesTab: "Prefixos",
                colorsTab: "Cores",
                saveBtn: "Salvar",
                cancelBtn: "Cancelar",
                statusOpeningSettings: "Abrindo configurações...",
                statusSettingsSaved: "Configurações salvas!",
                statusStarting: "Iniciando...",
                statusNoComp: "ERRO: Nenhuma comp selecionada!",
                statusCompFound: "Comp encontrada: ",
                statusSearchingHidden: "Buscando ocultas...",
                statusDeletingHidden: "Excluindo {0} ocultas...",
                statusNoHiddenToDelete: "Nenhuma oculta para deletar.",
                statusCheckingExpressions: "Verificando expressões...",
                statusIndexWarning: "AVISO: Expressões com índice detectadas",
                statusReordering: "Reordenando...",
                statusReordered: "Reordenação concluída! {0} camadas",
                statusNoOrderChange: "Ordem já conforme solicitado.",
                statusNoLayersLeft: "Nenhuma camada restante.",
                statusCompleted: "Concluído!\nTotal: {0} | Visíveis: {1} | Ocultas: {2}\nShapes: {3} | Textos: {4} | Sólidos: {5}\nAjustes: {6} | Comps: {7} | Câmeras: {8}",
                statusActions: "\nAções: ",
                statusRenamed: "Renomeadas: {0}",
                statusColored: "Coloridas: {0}",
                statusDeleted: "Deletadas: {0}",
                statusReorderedAction: "Reordenadas: {0}",
                statusIndexCancelled: "Reordenação parcial (índice)",
                statusUndoSuccess: "Ação desfeita com sucesso!",
                statusNothingToUndo: "Nada para desfazer.",
                statusProcessing: "Processando...",
                statusError: "ERRO: ",
                statusNoActions: "Nenhuma ação selecionada!",
                popupTitle: "Reordenação Parcial",
                popupMessage: "Algumas camadas não foram reordenadas devido a expressões dependentes de índice:\n\n{0}",
                popupLayerInfo: "Camada: {0} (Índice: {1})\nMotivo: Expressão com referência a índice\n",
                reorderConflictTitle: "Conflito de Reordenação",
                reorderConflictMessage: "Apenas uma opção de reordenação pode estar ativa por vez.",
                skippedLayersTitle: "Camadas Não Modificadas",
                skippedLayersMessage: "As seguintes camadas não foram modificadas:\n\n{0}",
                skippedLayerInfo: "Camada: {0} (Índice: {1})\nMotivo: {2}\n",
                reasonIndex: "Expressão com referência a índice",
                reasonLinked: "Vínculo com outra camada (parent, track matte ou máscara)"
            },
            EN: {
                windowTitle: "Auto Layer Organizer v1.0",
                automateBtn: "▶  EXECUTE",
                undoBtn: "↩",
                undoBtnTip: "Undo last script action",
                settingsBtnTip: "Settings",
                optionsPanel: "Options",
                applyColorsCheck: "Apply colors",
                renameLayersCheck: "Rename layers",
                reorderLayersCheck: "Reorder by type",
                reorderLayersTip: "Groups by type keeping temporal order",
                reorderByTimeCheck: "Reorder by time",
                reorderByTimeTip: "Later layers go to the top",
                deleteHiddenCheck: "Delete hidden",
                statusWaiting: "Waiting...",
                settingsTitle: "Settings",
                languageLabel: "Language: ",
                prefixesTab: "Prefixes",
                colorsTab: "Colors",
                saveBtn: "Save",
                cancelBtn: "Cancel",
                statusOpeningSettings: "Opening settings...",
                statusSettingsSaved: "Settings saved!",
                statusStarting: "Starting...",
                statusNoComp: "ERROR: No comp selected!",
                statusCompFound: "Comp found: ",
                statusSearchingHidden: "Searching hidden...",
                statusDeletingHidden: "Deleting {0} hidden...",
                statusNoHiddenToDelete: "No hidden layers to delete.",
                statusCheckingExpressions: "Checking expressions...",
                statusIndexWarning: "WARNING: Index-dependent expressions detected",
                statusReordering: "Reordering...",
                statusReordered: "Reordering done! {0} layers",
                statusNoOrderChange: "Order already as requested.",
                statusNoLayersLeft: "No layers remaining.",
                statusCompleted: "Completed!\nTotal: {0} | Visible: {1} | Hidden: {2}\nShapes: {3} | Texts: {4} | Solids: {5}\nAdjustments: {6} | Comps: {7} | Cameras: {8}",
                statusActions: "\nActions: ",
                statusRenamed: "Renamed: {0}",
                statusColored: "Colored: {0}",
                statusDeleted: "Deleted: {0}",
                statusReorderedAction: "Reordered: {0}",
                statusIndexCancelled: "Partial reordering (index)",
                statusUndoSuccess: "Action undone successfully!",
                statusNothingToUndo: "Nothing to undo.",
                statusProcessing: "Processing...",
                statusError: "ERROR: ",
                statusNoActions: "No actions selected!",
                popupTitle: "Partial Reordering",
                popupMessage: "Some layers were not reordered due to index-dependent expressions:\n\n{0}",
                popupLayerInfo: "Layer: {0} (Index: {1})\nReason: Expression with index reference\n",
                reorderConflictTitle: "Reordering Conflict",
                reorderConflictMessage: "Only one reordering option can be active at a time.",
                skippedLayersTitle: "Unmodified Layers",
                skippedLayersMessage: "The following layers were not modified:\n\n{0}",
                skippedLayerInfo: "Layer: {0} (Index: {1})\nReason: {2}\n",
                reasonIndex: "Expression with index reference",
                reasonLinked: "Linked to another layer (parent, track matte, or mask)"
            }
        };
        return strings[config.language][key] || key;
    }

    function saveCurrentState() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return null;

        var state = {
            layerNames: [],
            layerColors: [],
            layerOrder: [],
            layerVisibility: [],
            timestamp: new Date()
        };

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            state.layerNames.push(layer.name);
            state.layerColors.push(layer.label);
            state.layerOrder.push(layer.index);
            state.layerVisibility.push(layer.enabled);
        }

        undoStack.push(state);
        debugLog("Estado salvo para desfazer. Total de estados: " + undoStack.length);
        return state;
    }

    function undoLastAction() {
        if (undoStack.length === 0) {
            updateStatus("statusNothingToUndo");
            return false;
        }

        var stateToRestore = undoStack.pop();
        var comp = app.project.activeItem;

        if (!comp || !(comp instanceof CompItem)) {
            updateStatus("statusNoComp");
            return false;
        }

        app.beginUndoGroup("Auto Layer Organize - Desfazer");

        try {
            for (var i = 1; i <= comp.numLayers && i <= stateToRestore.layerNames.length; i++) {
                var layer = comp.layer(i);
                try {
                    if (layer.name !== stateToRestore.layerNames[i-1]) {
                        layer.name = stateToRestore.layerNames[i-1];
                    }
                    if (layer.label !== stateToRestore.layerColors[i-1]) {
                        layer.label = stateToRestore.layerColors[i-1];
                    }
                    if (layer.enabled !== stateToRestore.layerVisibility[i-1]) {
                        layer.enabled = stateToRestore.layerVisibility[i-1];
                    }
                } catch (e) {
                    debugLog("Erro ao restaurar layer " + i + ": " + e.toString());
                }
            }
            updateStatus("statusUndoSuccess");
            return true;
        } catch (e) {
            updateStatus("statusError" + e.toString());
            debugLog("Erro ao desfazer: " + e.toString());
            return false;
        } finally {
            app.endUndoGroup();
        }
    }

    // START - FUNÇÃO DE AJUDA PADRONIZADA (showLayersOrganizeHelp)
    function showLayersOrganizeHelp() {
        var TARGET_HELP_WIDTH = 450;
        var MARGIN_SIZE = 15;
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
        var TOPIC_SPACING = 5;
        var TOPIC_TITLE_INDENT = 0;
        var SUBTOPIC_INDENT = 25;

        var helpWin = new Window("palette", getLocalizedString("windowTitle") + " - Ajuda", undefined, { closeButton: true });
        helpWin.orientation = "column";
        helpWin.alignChildren = ["fill", "fill"];
        helpWin.spacing = 10;
        helpWin.margins = MARGIN_SIZE;
        
        helpWin.preferredSize = [TARGET_HELP_WIDTH, 600];

        if (typeof bgColor1 !== 'undefined' && typeof setBgColor !== 'undefined') {
            setBgColor(helpWin, bgColor1);
        } else {
            helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
        }

        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column";
        headerPanel.alignChildren = ["fill", "top"];
        headerPanel.alignment = ["fill", "top"];
        headerPanel.spacing = 10;
        headerPanel.margins = 15;
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - AUTO LAYER ORGANIZER");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta automatiza a organização de camadas em suas composições.", {multiline: true});
        mainDescText.alignment = ["fill", "fill"];
        mainDescText.preferredSize.height = 40;
        if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(mainDescText, normalColor1);
        } else {
            mainDescText.graphics.foregroundColor = mainDescText.graphics.newPen(mainDescText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"];
        topicsTabPanel.margins = 15;

        var allHelpTopics = [
            {
                tabName: "FUNCIONALIDADES",
                topics: [
                    { title: "▶ RENOMEAR CAMADAS:", text: "Adiciona prefixos padrão (ex: 'Shp_', 'Txt_') aos nomes das camadas com base em seu tipo. Isso padroniza a identificação visual no painel Timeline." },
                    { title: "▶ APLICAR CORES:", text: "Atribui cores de rótulo padrão a cada tipo de camada (ex: Shapes Azul, Textos Vermelho) para melhor distinção visual." },
                    { title: "▶ REORDENAR POR TIPO:", text: "Agrupa as camadas na Timeline por tipo (ex: todos os Ajustes primeiro, depois Câmeras, Nulos, Textos, etc.), mantendo a ordem temporal original dentro de cada grupo de tipo. " },
                    { title: "▶ REORDENAR POR TEMPO:", text: "Reorganiza as camadas de modo que as que começam mais tarde na Timeline apareçam no topo da pilha. Útil para fluxos de trabalho que priorizam o tempo de início." },
                    { title: "▶ DELETAR OCULTAS:", text: "Remove permanentemente as camadas que estão atualmente desativadas (visibilidade desabilitada). " }
                ]
            },
            {
                tabName: "COMPORTAMENTO",
                topics: [
                    { title: "▶ EXPRESSÕES COM ÍNDICE:", text: "Camadas com expressões que referenciam outras camadas por seu número de índice (ex: `thisComp.layer(1)`) não serão reordenadas para evitar quebrar as animações. Uma notificação aparecerá se isso ocorrer." },
                    { title: "▶ CAMADAS VINCULADAS:", text: "Camadas que são pais/filhos, track mattes ou têm máscaras aplicadas NÃO serão deletadas quando 'Deletar Ocultas' for usado, para proteger a integridade do projeto." },
                    { title: "▶ BOTÃO DESFAZER (↩):", text: "Permite reverter a última ação realizada pelo script, restaurando os nomes, cores e ordem das camadas ao estado anterior à execução do script." },
                    { title: "▶ BOTÃO CONFIGURAÇÕES (⚙️):", text: "Abre uma nova janela para personalizar os prefixos de renomeação e as cores padrão para cada tipo de camada, bem como o idioma da interface do script." }
                ]
            }
        ];

        for (var s = 0; s < allHelpTopics.length; s++) {
            var currentTabSection = allHelpTopics[s];
            var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
            tab.orientation = "column";
            tab.alignChildren = ["fill", "top"];
            tab.spacing = 10;
            tab.margins = TOPIC_SECTION_MARGINS;

            for (var i = 0; i < currentTabSection.topics.length; i++) {
                var topic = currentTabSection.topics[i];
                var topicGrp = tab.add("group");
                topicGrp.orientation = "column";
                topicGrp.alignChildren = "fill";
                topicGrp.spacing = TOPIC_SPACING;
                
                if (topic.title.indexOf("▶") === 0) {
                    topicGrp.margins.left = TOPIC_TITLE_INDENT;
                } else {
                    topicGrp.margins.left = SUBTOPIC_INDENT;
                }

                var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                    setFgColor(topicTitle, highlightColor1);
                } else {
                    topicTitle.graphics.foregroundColor = topicTitle.graphics.newPen(topicTitle.graphics.PenType.SOLID_COLOR, [0.83, 0, 0.23, 1], 1);
                }
                topicTitle.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);


                if(topic.text !== ""){
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    topicText.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);
                    topicText.preferredSize.height = 50;
                    
                    if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                        setFgColor(topicText, normalColor1);
                    } else {
                        topicText.graphics.foregroundColor = topicText.graphics.newPen(topicText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
                    }
                }
            }
        }

        var closeBtnGrp = helpWin.add("group");
        closeBtnGrp.alignment = "center";
        closeBtnGrp.margins = [0, 10, 0, 0];
        var closeBtn = closeBtnGrp.add("button", undefined, "OK");
        closeBtn.onClick = function() {
            helpWin.close();
        };

        helpWin.layout.layout(true);
        helpWin.center();
        helpWin.show();
    };
    // END - FUNÇÃO DE AJUDA PADRONIZADA (showLayersOrganizeHelp)

    // START - FUNÇÕES DE LÓGICA DO SCRIPT
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function getAllProperties(obj, props) {
        props = props || [];
        if (obj.numProperties > 0) {
            for (var i = 1; i <= obj.numProperties; i++) {
                try {
                    var prop = obj.property(i);
                    props.push(prop);
                    if (prop.numProperties > 0) getAllProperties(prop, props);
                } catch (e) {
                    debugLog("Erro ao acessar propriedade " + i + ": " + e.toString());
                }
            }
        }
        return props;
    }
    
    function expressionReferencesLayer(expression, layer) {
        try {
            if (!expression || expression === "") return false;
            debugLog("Analisando expressão na layer " + layer.name);
            var layerNamePattern = new RegExp('(thisComp\\.layer\\("?' + escapeRegExp(layer.name) + '"?\\)|comp\\(\\s*"?' + escapeRegExp(layer.name) + '"?\\s*\\))', 'i');
            var layerIndexPattern = new RegExp('(thisComp\\.layer\\(' + layer.index + '\\)|comp\\(\\s*' + layer.index + '\\s*\\))', 'i');
            var result = layerNamePattern.test(expression) || layerIndexPattern.test(expression);
            if (result) debugLog("Expressão referencia layer " + layer.name + ": " + expression);
            return result;
        } catch (e) {
            debugLog("Erro ao verificar expressão: " + e.toString());
            return false;
        }
    }
    
    function hasIndexDependentExpressions(layer) {
        try {
            debugLog("Verificando expressões dependentes de índice em " + layer.name);
            var props = getAllProperties(layer);
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                if (prop.canSetExpression && prop.expression !== "") {
                    if (/(thisComp\s*\.\s*layer\s*\(\s*\d+\s*\)|comp\s*\(\s*\d+\s*\))/i.test(prop.expression)) {
                        debugLog("Expressão depende de índice: " + prop.expression);
                        return true;
                    }
                }
            }
            return false;
        } catch (e) {
            debugLog("Erro ao verificar expressões dependentes de índice: " + e.toString());
            return true;
        }
    }
    
    function findIndex(array, value) {
        for (var i = 0; i < array.length; i++) if (array[i] === value) return i;
        return -1;
    }
    
    function setLayerColor(layer, colorIndex) {
        try {
            layer.label = colorIndex;
            debugLog("Cor definida para layer " + layer.name + ": " + colorNames[config.language][colorIndex]);
            return true;
        } catch (e) {
            debugLog("Erro ao definir cor para layer " + layer.name + ": " + e.toString());
            return false;
        }
    }
    
    function updateStatus(message, params) {
        var text = getLocalizedString(message);
        if (params) {
            for (var i = 0; i < params.length; i++) {
                text = text.replace("{" + i + "}", params[i]);
            }
        }
        statusText.text = text;
        debugLog("Status: " + text);
    }
    
    function updateProgress(current, total) {
        var progress = Math.round((current / total) * 100);
        progressBar.value = progress;
        debugLog("Progresso: " + progress + "% (" + current + "/" + total + ")");
        updateStatus("statusProcessing");
    }
    
    function isLayerLinked(comp, layer) {
        try {
            debugLog("Verificando vínculos para layer " + layer.name);
            for (var i = 1; i <= comp.numLayers; i++) {
                var otherLayer = comp.layer(i);
                if (otherLayer !== layer && otherLayer.parent === layer) {
                    debugLog("Layer " + layer.name + " é pai de " + otherLayer.name);
                    return true;
                }
            }
            if (layer.property("ADBE Mask Parade") && layer.property("ADBE Mask Parade").numProperties > 0) {
                debugLog("Layer " + layer.name + " tem máscaras");
                return true;
            }
            for (var i = 1; i <= comp.numLayers; i++) {
                var otherLayer = comp.layer(i);
                debugLog("Verificando expressões em " + otherLayer.name);
                var props = getAllProperties(otherLayer);
                for (var j = 0; j < props.length; j++) {
                    var prop = props[j];
                    if (prop.canSetExpression && prop.expression !== "") {
                        if (expressionReferencesLayer(prop.expression, layer)) return true;
                    }
                }
            }
            debugLog("Nenhum vínculo encontrado para layer " + layer.name);
            return false;
        } catch (e) {
            debugLog("Erro ao verificar vínculos: " + e.toString());
            return true;
        }
    }

    function showSkippedLayersFeedback(skippedLayers) {
        if (skippedLayers.length === 0) return;
        
        var message = "";
        for (var i = 0; i < skippedLayers.length; i++) {
            message += (i > 0 ? "\n" : "") + "\n" + getLocalizedString("skippedLayerInfo")
                .replace("{0}", skippedLayers[i].layer.name)
                .replace("{1}", skippedLayers[i].index)
                .replace("{2}", skippedLayers[i].reason);
        }
        
        var popup = new Window("dialog", getLocalizedString("skippedLayersTitle"));
        popup.orientation = "column";
        popup.spacing = 10;
        popup.margins = 15;
        popup.preferredSize = [300, Math.min(150 + skippedLayers.length * 50, 400)];
        popup.add("statictext", undefined, getLocalizedString("skippedLayersMessage").replace("{0}", message), {multiline: true});
        var okBtn = popup.add("button", undefined, "OK", {name: "ok"});
        okBtn.onClick = function() { popup.close(); };
        popup.center();
        popup.show();
    }

    function showReorderConflictAlert() {
        var alertWin = new Window("dialog", getLocalizedString("reorderConflictTitle"));
        alertWin.orientation = "column";
        alertWin.spacing = 10;
        alertWin.margins = 20;
        alertWin.preferredSize = [250,100];
        alertWin.add("statictext", undefined, getLocalizedString("reorderConflictMessage"), {multiline: true});
        var okBtn = alertWin.add("button", undefined, "OK", {name: "ok"});
        okBtn.onClick = function() { alertWin.close(); };
        alertWin.center();
        alertWin.show();
    }
    
    // Funções auxiliares para identificação de tipos de camada
    function isTextLayer(layer) {
        try { return layer.property("ADBE Text Properties") !== null; } catch (e) { debugLog("Erro ao verificar text layer: " + e.toString()); return false; }
    }
    
    function isShapeLayer(layer) {
        try { return layer.property("ADBE Root Vectors Group") !== null; } catch (e) { debugLog("Erro ao verificar shape layer: " + e.toString()); return false; }
    }
    
    function isSolidLayer(layer) {
        try {
            if (layer.source && layer.source.typeName == "Solid" && !layer.adjustmentLayer) return true;
            if (layer.source && layer.source.mainSource && layer.source.mainSource.color && !layer.adjustmentLayer) return true;
            if (layer.source && (layer.source.name.indexOf("Solid") === 0 || layer.name.indexOf("Solid") === 0) && !layer.adjustmentLayer) return true;
            if (layer.source && layer.source instanceof FootageItem && layer.source.footageMissing === false && layer.source.file === null && !layer.adjustmentLayer) return true;
            return false;
        } catch (e) {
            debugLog("Erro ao verificar solid layer: " + e.toString());
            return false;
        }
    }
    // END - FUNÇÕES AUXILIARES E CONFIGURAÇÕES DO SCRIPT


    // START - OBJETO PRINCIPAL DO SCRIPT
    var LayersOrganizer = {
        ui: {},
        layerColorIndices: {
            "ShapeLayer": 8, "TextLayer": 1, "SolidLayer": 14, "AdjustmentLayer": 2,
            "CompItem": 12, "CameraLayer": 2, "NullLayer": 2, "VideoLayer": 14, "ImageLayer": 11
        },
        layerTypeOrder: ["AdjustmentLayer", "CameraLayer", "NullLayer", "TextLayer", "ShapeLayer",
                         "SolidLayer", "ImageLayer", "CompItem", "VideoLayer"],
        colorNames: {
            PT: ["Nenhuma", "Vermelho", "Amarelo", "Aqua", "Rosa", "Lavanda", "Pêssego",
                 "Verde Água", "Azul", "Verde", "Roxo", "Laranja", "Marrom", "Fúcsia", "Ciano", "Arenito"],
            EN: ["None", "Red", "Yellow", "Aqua", "Pink", "Lavender", "Peach",
                 "Teal", "Blue", "Green", "Purple", "Orange", "Brown", "Fuchsia", "Cyan", "Sandstone"]
        },
        layerTypeDisplayNames: {
            PT: {
                "ShapeLayer": "Shapes", "TextLayer": "Textos", "SolidLayer": "Sólidos", "AdjustmentLayer": "Ajustes",
                "CompItem": "Comps", "CameraLayer": "Câmeras", "NullLayer": "Nulos",
                "VideoLayer": "Vídeos", "ImageLayer": "Imagens"
            },
            EN: {
                "ShapeLayer": "Shapes", "TextLayer": "Texts", "SolidLayer": "Solids", "AdjustmentLayer": "Adjustments",
                "CompItem": "Comps", "CameraLayer": "Cameras", "NullLayer": "Nulls",
                "VideoLayer": "Videos", "ImageLayer": "Images"
            }
        },
        colorPreviews: [
            [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 1], [1, 0.41, 0.71], [0.9, 0.9, 0.98],
            [1, 0.85, 0.73], [0, 0.5, 0.5], [0, 0, 1], [0, 1, 0], [0.5, 0, 0.5], [1, 0.65, 0],
            [0.65, 0.16, 0.16], [1, 0, 1], [0, 1, 1], [0.96, 0.96, 0.86]
        ],
        isProcessing: false,


        // Função principal de organização
        executeOrganize: function() {
            var self = this; // Manter referência ao objeto LayersOrganizer
            var logMessage = "Organização iniciada em: " + new Date().toLocaleString() + "\n";
            if (self.isProcessing) {
                debugLog("Processamento já em andamento");
                logMessage += "Já em andamento - ignorado.";
                return;
            }

            // Verifica se alguma ação está ativa
            if (!self.ui.applyColorsCheck.value && !self.ui.renameLayersCheck.value && !self.ui.reorderLayersCheck.value && 
                !self.ui.reorderByTimeCheck.value && !self.ui.deleteHiddenCheck.value) {
                updateStatus("statusNoActions");
                debugLog("Nenhuma ação selecionada");
                logMessage += "Erro: Nenhuma ação selecionada.";
                return;
            }

            self.isProcessing = true;
            updateStatus("statusStarting");
            self.ui.organizeBtn.enabled = false;
            self.ui.undoBtn.enabled = false;
            self.ui.settingsBtn.enabled = false;
            self.ui.helpBtn.enabled = false; // Desabilitar o botão de ajuda durante o processamento
            
            saveCurrentState();
            app.beginUndoGroup("Auto Layer Organize");
            
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    updateStatus("statusNoComp");
                    debugLog("Nenhuma composição ativa");
                    logMessage += "Erro: Nenhuma comp selecionada.";
                    return;
                }
                
                debugLog("Processando: " + comp.name);
                updateStatus("statusCompFound", [comp.name]);
                logMessage += "Comp: " + comp.name + "\n";
                
                function getPrefixList() {
                    var prefixes = [];
                    for (var key in config.prefixes) {
                        prefixes.push(config.prefixes[key]);
                    }
                    return prefixes;
                }
                
                function removePrefix(name) {
                    var prefixes = getPrefixList().join("|");
                    var regex = new RegExp("^(" + prefixes + ")", "i");
                    return name.replace(regex, "");
                }
                
                var stats = { total: comp.numLayers, enabled: 0, disabled: 0, locked: 0, renamed: 0, colored: 0, deleted: 0, reordered: 0,
                              shapes: 0, texts: 0, solids: 0, adjustments: 0, comps: 0, cameras: 0, nulls: 0, images: 0, videos: 0, unknown: 0,
                              skippedIndexDependent: 0 };
                
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer.enabled) stats.enabled++; else stats.disabled++;
                    if (layer.locked) stats.locked++;
                }
                debugLog("Total inicial: " + stats.total + ", Ativas: " + stats.enabled + ", Ocultas: " + stats.disabled);
                logMessage += "Total: " + stats.total + " | Visíveis: " + stats.enabled + " | Ocultas: " + stats.disabled + "\n";
                
                var skippedLayers = []; // Lista geral de camadas não modificadas

                if (self.ui.deleteHiddenCheck.value) {
                    updateStatus("statusSearchingHidden");
                    var layerIndicesToDelete = [];
                    for (var i = comp.numLayers; i >= 1; i--) {
                        var layer = comp.layer(i);
                        if (!layer.enabled) {
                            if (isLayerLinked(comp, layer)) {
                                skippedLayers.push({
                                    layer: layer,
                                    index: layer.index,
                                    reason: getLocalizedString("reasonLinked")
                                });
                            } else {
                                layerIndicesToDelete.push(i);
                            }
                        }
                    }
                    if (layerIndicesToDelete.length > 0) {
                        updateStatus("statusDeletingHidden", [layerIndicesToDelete.length]);
                        layerIndicesToDelete.sort(function(a, b) { return b - a; });
                        for (var j = 0; j < layerIndicesToDelete.length; j++) {
                            var layer = comp.layer(layerIndicesToDelete[j]);
                            if (layer) {
                                var wasLocked = layer.locked;
                                if (wasLocked) layer.locked = false;
                                layer.remove();
                                stats.deleted++;
                                updateProgress(j + 1, layerIndicesToDelete.length);
                            }
                        }
                        logMessage += "Deletadas: " + stats.deleted + "\n";
                    } else {
                        updateStatus("statusNoHiddenToDelete");
                        logMessage += "Nenhuma oculta para deletar.\n";
                    }
                    stats.total = comp.numLayers;
                }
                
                if (comp.numLayers > 0) {
                    var currentCameraCount = 0;
                    var layerInfos = [];
                    
                    // Coleta informações das camadas
                    for (var i = 1; i <= comp.numLayers; i++) {
                        updateProgress(i, comp.numLayers);
                        var layer = comp.layer(i);
                        var originalName = layer.name;
                        var newName = originalName;
                        var layerType = "Unknown";
                        var wasLocked = layer.locked;
                        
                        if (wasLocked) layer.locked = false;
                        
                        if (layer instanceof CameraLayer) {
                            currentCameraCount++;
                            newName = config.prefixes["CameraLayer"] + currentCameraCount;
                            layerType = "CameraLayer";
                            stats.cameras++;
                        } else if (layer.nullLayer) {
                            newName = config.prefixes["NullLayer"] + removePrefix(originalName);
                            layerType = "NullLayer";
                            stats.nulls++;
                        } else if (layer.adjustmentLayer) {
                            newName = config.prefixes["AdjustmentLayer"] + removePrefix(originalName);
                            layerType = "AdjustmentLayer";
                            stats.adjustments++;
                        } else if (isTextLayer(layer)) {
                            newName = config.prefixes["TextLayer"] + removePrefix(originalName);
                            layerType = "TextLayer";
                            stats.texts++;
                        } else if (isShapeLayer(layer)) {
                            newName = config.prefixes["ShapeLayer"] + removePrefix(originalName);
                            layerType = "ShapeLayer";
                            stats.shapes++;
                        } else if (isSolidLayer(layer)) {
                            newName = config.prefixes["SolidLayer"] + removePrefix(originalName);
                            layerType = "SolidLayer";
                            stats.solids++;
                        } else if (layer.source && layer.source instanceof CompItem) {
                            newName = config.prefixes["CompItem"] + removePrefix(originalName);
                            layerType = "CompItem";
                            stats.comps++;
                        } else if (layer.source && layer.source.file && /\.(psd|ai|jpg|jpeg|png|gif|tiff|tif|bmp)$/i.test(layer.source.file.name)) {
                            newName = config.prefixes["ImageLayer"] + removePrefix(originalName);
                            layerType = "ImageLayer";
                            stats.images++;
                        } else if (layer.source && layer.source.file && /\.(mov|mp4|avi|mkv|wmv|mpg|mpeg|mxf|r3d|braw)$/i.test(layer.source.file.name)) {
                            newName = config.prefixes["VideoLayer"] + removePrefix(originalName);
                            layerType = "VideoLayer";
                            stats.videos++;
                        } else {
                            stats.unknown++;
                        }
                        
                        if (layerType !== "Unknown") {
                            if (self.ui.renameLayersCheck.value && layer.name !== newName) {
                                layer.name = newName;
                                stats.renamed++;
                            }
                            if (self.ui.applyColorsCheck.value && self.layerColorIndices[layerType] !== undefined) {
                                if (setLayerColor(layer, self.layerColorIndices[layerType])) stats.colored++;
                            }
                        }
                        
                        layerInfos.push({ 
                            layer: layer, 
                            type: layerType, 
                            isLocked: wasLocked, 
                            index: i,
                            startTime: layer.startTime
                        });
                        
                        if (wasLocked) layer.locked = true;
                    }

                    // Reordenação por tipo ou tempo
                    if ((self.ui.reorderLayersCheck.value || self.ui.reorderByTimeCheck.value) && layerInfos.length > 0) {
                        // Verifica conflito de opções de reordenação
                        if (self.ui.reorderLayersCheck.value && self.ui.reorderByTimeCheck.value) {
                            showReorderConflictAlert();
                            updateStatus("statusWaiting");
                            logMessage += "Conflito: Ambas as opções de reordenação ativas.\n";
                            return; // Interrompe a execução
                        }

                        updateStatus("statusCheckingExpressions");
                        var hasIndexDependentLayers = false;

                        // Verifica expressões dependentes de índice
                        for (var i = 0; i < layerInfos.length; i++) {
                            if (hasIndexDependentExpressions(layerInfos[i].layer)) {
                                hasIndexDependentLayers = true;
                                stats.skippedIndexDependent++;
                                skippedLayers.push({
                                    layer: layerInfos[i].layer,
                                    index: layerInfos[i].index,
                                    reason: getLocalizedString("reasonIndex")
                                });
                            }
                        }

                        if (hasIndexDependentLayers) {
                            updateStatus("statusIndexWarning");
                            logMessage += "Reordenação parcial: Expressões com índice detectadas.\n";
                        }

                        updateStatus("statusReordering");
                        var sortedInfos = layerInfos.slice();

                        // Função de ordenação
                        sortedInfos.sort(function(a, b) {
                            if (self.ui.reorderLayersCheck.value) {
                                // Reordena por tipo, mantendo ordem temporal original dentro do tipo
                                var typeIndexA = findIndex(self.layerTypeOrder, a.type);
                                var typeIndexB = findIndex(self.layerTypeOrder, b.type);
                                if (typeIndexA === typeIndexB) return a.startTime - b.startTime || a.index - b.index;
                                if (typeIndexA === -1) typeIndexA = 999;
                                if (typeIndexB === -1) typeIndexB = 999;
                                return typeIndexA - typeIndexB;
                            } else if (self.ui.reorderByTimeCheck.value) {
                                // Reordena por tempo, com camadas mais tardias no topo
                                return b.startTime - a.startTime || b.index - a.index;
                            }
                            return a.index - b.index;
                        });

                        // Verifica se a ordem atual já está correta
                        var currentOrder = [];
                        for (var i = 1; i <= comp.numLayers; i++) {
                            currentOrder.push({ layer: comp.layer(i), startTime: comp.layer(i).startTime, type: layerInfos[i-1].type });
                        }
                        var orderChanged = false;
                        for (var i = 0; i < sortedInfos.length; i++) {
                            if (currentOrder[i].layer !== sortedInfos[i].layer || 
                                currentOrder[i].startTime !== sortedInfos[i].startTime || 
                                currentOrder[i].type !== sortedInfos[i].type) {
                                orderChanged = true;
                                break;
                            }
                        }

                        if (!orderChanged) {
                            updateStatus("statusNoOrderChange");
                            logMessage += "Sem mudanças na ordem.\n";
                        } else {
                            // Reordena as camadas de forma simplificada
                            for (var i = 0; i < sortedInfos.length; i++) {
                                var layerInfo = sortedInfos[i];
                                var layer = layerInfo.layer;
                                if (!hasIndexDependentExpressions(layer)) {
                                    var wasLocked = layer.locked;
                                    if (wasLocked) layer.locked = false;
                                    // Move a camada para a posição correta
                                    if (layer.index !== (i + 1)) {
                                        try {
                                            if (i === 0) {
                                                layer.moveToBeginning();
                                            } else {
                                                layer.moveAfter(comp.layer(i));
                                            }
                                            stats.reordered++;
                                        } catch (e) {
                                            debugLog("Erro ao mover camada " + layer.name + ": " + e.toString());
                                        }
                                    }
                                    if (layerInfo.isLocked) layer.locked = true;
                                    updateProgress(i + 1, sortedInfos.length);
                                }
                            }
                            updateStatus("statusReordered", [stats.reordered]);
                            logMessage += "Reordenadas: " + stats.reordered + "\n";
                        }
                    }
                } else {
                    updateStatus("statusNoLayersLeft");
                    logMessage += "Nenhuma camada restante.\n";
                }
                
                // Exibe o alerta se houver camadas não modificadas
                if (skippedLayers.length > 0) {
                    showSkippedLayersFeedback(skippedLayers);
                }

                var statusMessage = getLocalizedString("statusCompleted")
                    .replace("{0}", stats.total)
                    .replace("{1}", stats.enabled)
                    .replace("{2}", stats.disabled)
                    .replace("{3}", stats.shapes)
                    .replace("{4}", stats.texts)
                    .replace("{5}", stats.solids)
                    .replace("{6}", stats.adjustments)
                    .replace("{7}", stats.comps)
                    .replace("{8}", stats.cameras);
                if (self.ui.renameLayersCheck.value || self.ui.applyColorsCheck.value || self.ui.deleteHiddenCheck.value || self.ui.reorderLayersCheck.value || self.ui.reorderByTimeCheck.value) {
                    statusMessage += getLocalizedString("statusActions");
                    var actions = [];
                    if (self.ui.renameLayersCheck.value) actions.push(getLocalizedString("statusRenamed").replace("{0}", stats.renamed));
                    if (self.ui.applyColorsCheck.value) actions.push(getLocalizedString("statusColored").replace("{0}", stats.colored));
                    if (self.ui.deleteHiddenCheck.value) actions.push(getLocalizedString("statusDeleted").replace("{0}", stats.deleted));
                    if ((self.ui.reorderLayersCheck.value || self.ui.reorderByTimeCheck.value)) {
                        if (stats.reordered > 0) actions.push(getLocalizedString("statusReorderedAction").replace("{0}", stats.reordered));
                        if (stats.skippedIndexDependent > 0) actions.push(getLocalizedString("statusIndexCancelled"));
                    }
                    statusMessage += actions.join(" | ");
                }
                updateStatus(statusMessage);
                self.ui.progressBar.value = 100;
                logMessage += "Resultado:\n" + statusMessage;
            } catch (err) {
                debugLog("ERRO: " + err.toString() + "\nLinha: " + err.line);
                updateStatus("statusError" + err.toString());
                self.ui.progressBar.value = 0;
                logMessage += "Erro: " + err.toString() + " (Linha: " + err.line + ")";
            } finally {
                self.isProcessing = false;
                self.ui.organizeBtn.enabled = true;
                self.ui.undoBtn.enabled = true;
                self.ui.settingsBtn.enabled = true;
                self.ui.helpBtn.enabled = true; // Reabilitar o botão de ajuda
                app.endUndoGroup();
                logMessage += "\nFinalizado em: " + new Date().toLocaleString();
            }
        },

        // Função para abrir as configurações
        openSettings: function() {
            var self = this;
            var logMessage = "Configurações abertas em: " + new Date().toLocaleString() + "\n";
            try {
                updateStatus("statusOpeningSettings");
                var settingsWin = new Window("dialog", getLocalizedString("settingsTitle"), undefined);
                settingsWin.orientation = "column";
                settingsWin.spacing = 2;
                settingsWin.margins = 6;
                settingsWin.preferredSize = [220, 200];
                settingsWin.alignChildren = ["center", "center"];

                var languageGroup = settingsWin.add("group");
                languageGroup.orientation = "row";
                languageGroup.spacing = 6;
                languageGroup.alignChildren = ["center", "center"];
                var languageLabel = languageGroup.add("statictext", undefined, getLocalizedString("languageLabel"));
                languageLabel.preferredSize = [60, 20];
                var languageDropdown = languageGroup.add("dropdownlist", undefined, ["PT", "EN"]);
                languageDropdown.selection = config.language === "PT" ? 0 : 1;
                languageDropdown.preferredSize = [50, 20];

                var tabbedPanel = settingsWin.add("tabbedpanel");
                tabbedPanel.preferredSize = [200, 120];
                tabbedPanel.alignChildren = ["center", "center"];

                var prefixesTab = tabbedPanel.add("tab", undefined, getLocalizedString("prefixesTab"));
                prefixesTab.orientation = "column";
                prefixesTab.alignChildren = ["center", "center"];
                prefixesTab.spacing = 5;
                prefixesTab.margins = 10;

                var prefixInputs = {};
                for (var layerType in config.prefixes) {
                    var prefixGroup = prefixesTab.add("group");
                    prefixGroup.orientation = "row";
                    prefixGroup.spacing = 4;
                    prefixGroup.alignChildren = ["center", "center"];
                    var label = prefixGroup.add("statictext", undefined, self.layerTypeDisplayNames[config.language][layerType] + ":");
                    label.preferredSize = [60, 20];
                    label.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
                    prefixInputs[layerType] = prefixGroup.add("edittext", undefined, config.prefixes[layerType]);
                    prefixInputs[layerType].preferredSize = [50, 20];
                }

                var colorsTab = tabbedPanel.add("tab", undefined, getLocalizedString("colorsTab"));
                colorsTab.orientation = "column";
                colorsTab.alignChildren = ["center", "center"];
                colorsTab.spacing = 5;
                colorsTab.margins = 10;

                var colorDropdowns = {};
                for (var layerType in self.layerColorIndices) {
                    var group = colorsTab.add("group");
                    group.orientation = "row";
                    group.spacing = 4;
                    group.alignChildren = ["center", "center"];
                    var label = group.add("statictext", undefined, self.layerTypeDisplayNames[config.language][layerType] + ":");
                    label.preferredSize = [60, 20];
                    label.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
                    var preview = group.add("group");
                    preview.preferredSize = [10, 10];
                    var colorIndex = self.layerColorIndices[layerType];
                    var initialColor = self.colorPreviews[colorIndex];
                    preview.graphics.backgroundColor = preview.graphics.newBrush(preview.graphics.BrushType.SOLID_COLOR, 
                        [initialColor[0], initialColor[1], initialColor[2], 1]);
                    var dropdown = group.add("dropdownlist", undefined, self.colorNames[config.language]);
                    dropdown.selection = (colorIndex >= 0 && colorIndex < self.colorNames[config.language].length) ? colorIndex : 0;
                    dropdown.preferredSize = [80, 20];
                    colorDropdowns[layerType] = dropdown;

                    dropdown.onChange = (function(preview) {
                        return function() {
                            var idx = this.selection.index;
                            var newColor = self.colorPreviews[idx];
                            preview.graphics.backgroundColor = preview.graphics.newBrush(preview.graphics.BrushType.SOLID_COLOR, 
                                [newColor[0], newColor[1], newColor[2], 1]);
                            preview.notify("onDraw");
                        };
                    })(preview);
                }

                var btnGroup = settingsWin.add("group");
                btnGroup.spacing = 5;
                btnGroup.alignment = ["center", "bottom"];
                var saveBtn = btnGroup.add("button", undefined, getLocalizedString("saveBtn"));
                saveBtn.preferredSize = [50, 30];
                var cancelBtn = btnGroup.add("button", undefined, getLocalizedString("cancelBtn"));
                cancelBtn.preferredSize = [65, 30];

                saveBtn.onClick = function() {
                    logMessage += "Salvamento iniciado em: " + new Date().toLocaleString() + "\n";
                    var oldLanguage = config.language;
                    config.language = languageDropdown.selection.index === 0 ? "PT" : "EN";
                    if (oldLanguage !== config.language) {
                        logMessage += "Idioma de " + oldLanguage + " para " + config.language + "\n";
                    }

                    for (var layerType in prefixInputs) {
                        var oldPrefix = config.prefixes[layerType];
                        config.prefixes[layerType] = prefixInputs[layerType].text;
                        if (oldPrefix !== config.prefixes[layerType]) {
                            logMessage += self.layerTypeDisplayNames[config.language][layerType] + ": '" + oldPrefix + "' -> '" + config.prefixes[layerType] + "'\n";
                        }
                    }

                    for (var layerType in colorDropdowns) {
                        var oldColorIndex = self.layerColorIndices[layerType];
                        var newColorIndex = colorDropdowns[layerType].selection.index;
                        self.layerColorIndices[layerType] = newColorIndex;
                        if (oldColorIndex !== newColorIndex) {
                            logMessage += self.layerTypeDisplayNames[config.language][layerType] + " cor: " + 
                                        self.colorNames[config.language][oldColorIndex] + " -> " + self.colorNames[config.language][newColorIndex] + "\n";
                        }
                    }

                    updateStatus("statusSettingsSaved");
                    logMessage += "Salvo com sucesso!";
                    settingsWin.close();
                    self.ui.win.title = getLocalizedString("windowTitle"); // Atualizar título da janela principal
                    // Atualizar textos dos elementos da UI principal
                    self.ui.organizeBtn.text = getLocalizedString("automateBtn");
                    self.ui.undoBtn.text = getLocalizedString("undoBtn");
                    self.ui.undoBtn.helpTip = getLocalizedString("undoBtnTip");
                    self.ui.settingsBtn.helpTip = getLocalizedString("settingsBtnTip");
                    self.ui.optionsPanel.text = getLocalizedString("optionsPanel"); // Título do painel de opções
                    self.ui.applyColorsCheck.text = getLocalizedString("applyColorsCheck");
                    self.ui.renameLayersCheck.text = getLocalizedString("renameLayersCheck");
                    self.ui.reorderLayersCheck.text = getLocalizedString("reorderLayersCheck");
                    self.ui.reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");
                    self.ui.reorderByTimeCheck.text = getLocalizedString("reorderByTimeCheck");
                    self.ui.reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");
                    self.ui.deleteHiddenCheck.text = getLocalizedString("deleteHiddenCheck");
                };

                cancelBtn.onClick = function() { 
                    settingsWin.close();
                    logMessage += "Cancelado.";
                };

                settingsWin.center();
                settingsWin.show();
                logMessage += "Aberto com sucesso.";
            } catch (err) {
                debugLog("Erro nas configurações: " + err.toString());
                logMessage += "Erro: " + err.toString();
            }
        },

        // Construção da UI principal
        buildUI: function(thisObj) {
            var self = this; // Manter referência ao objeto LayersOrganizer
            self.ui.win = (thisObj instanceof Panel) ? thisObj : new Window("palette", getLocalizedString("windowTitle"), undefined);
            self.ui.win.orientation = "column";
            self.ui.win.spacing = 15;
            self.ui.win.margins = 15;
            self.ui.win.preferredSize.width = 250;
            
            setBgColor(self.ui.win, bgColor1);

            // --- Grupo de Cabeçalho com Título e Botão de Ajuda ---
            var headerGrp = self.ui.win.add("group");
            headerGrp.orientation = "row";
            headerGrp.alignChildren = ["fill", "center"];
            headerGrp.alignment = "fill";
            headerGrp.spacing = 10;

            var titleText = headerGrp.add("statictext", undefined, "Auto Layer Organizer");
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
            titleText.preferredSize.width = 0; // Faz com que o texto ocupe o espaço restante
            
            // Botão de Ajuda
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
                var helpBtnGroup = headerGrp.add('group');
                helpBtnGroup.alignment = ['right', 'center'];
                self.ui.helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
                self.ui.helpBtn.leftClick.onClick = showLayersOrganizeHelp;
            } else {
                self.ui.helpBtn = headerGrp.add("button", undefined, "?");
                self.ui.helpBtn.preferredSize = [24, 24];
                self.ui.helpBtn.helpTip = "Ajuda sobre o Auto Layer Organizer";
                self.ui.helpBtn.alignment = ['right', 'center'];
                self.ui.helpBtn.onClick = showLayersOrganizeHelp;
            }
            // --- Fim do Grupo de Título e Ajuda ---
            

            self.ui.optionsPanel = self.ui.win.add("panel", undefined, getLocalizedString("optionsPanel"), {borderStyle: "etched"});
            self.ui.optionsPanel.orientation = "column";
            self.ui.optionsPanel.alignment = ["fill", "top"];
            self.ui.optionsPanel.alignChildren = ["left", "top"];
            self.ui.optionsPanel.margins = 8;
            self.ui.optionsPanel.spacing = 4;
            
            self.ui.applyColorsCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("applyColorsCheck"));
            self.ui.applyColorsCheck.value = false;
            
            self.ui.renameLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("renameLayersCheck"));
            self.ui.renameLayersCheck.value = false;
            
            self.ui.reorderLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersCheck"));
            self.ui.reorderLayersCheck.value = false;
            self.ui.reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");
            
            self.ui.reorderByTimeCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderByTimeCheck"));
            self.ui.reorderByTimeCheck.value = false;
            self.ui.reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");
            
            self.ui.deleteHiddenCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("deleteHiddenCheck"));
            self.ui.deleteHiddenCheck.value = false;

            // Grupo de botões (agora abaixo do painel de opções)
            var mainBtnPanel = self.ui.win.add("group");
            mainBtnPanel.orientation = "row";
            mainBtnPanel.spacing = 4;
            mainBtnPanel.alignment = ["fill", "top"];

            self.ui.organizeBtn = mainBtnPanel.add("button", undefined, getLocalizedString("automateBtn"));
            self.ui.organizeBtn.preferredSize = [120, 25];
            
            self.ui.undoBtn = mainBtnPanel.add("button", undefined, getLocalizedString("undoBtn"));
            self.ui.undoBtn.preferredSize = [25, 25];
            self.ui.undoBtn.helpTip = getLocalizedString("undoBtnTip");

            // Botão de Configurações (mantido para testes, mas sua lógica foi movida para openSettings)
            self.ui.settingsBtn = mainBtnPanel.add("button", undefined, "⚙️");
            self.ui.settingsBtn.preferredSize = [25, 25];
            self.ui.settingsBtn.helpTip = getLocalizedString("settingsBtnTip");
            
            // Event Listeners para os botões
            self.ui.organizeBtn.onClick = function() { self.executeOrganize(); };
            self.ui.undoBtn.onClick = undoLastAction;
            self.ui.settingsBtn.onClick = function() { self.openSettings(); };
            
            var statusBar = self.ui.win.add("group");
            statusBar.orientation = "column";
            statusBar.alignment = ["fill", "center"];
            statusBar.spacing = 5;
            
            self.ui.statusText = statusBar.add("statictext", undefined, getLocalizedString("statusWaiting"));
            self.ui.statusText.alignment = ["fill", "center"];
            
            self.ui.progressBar = statusBar.add("progressbar", undefined, 0, 100);
            self.ui.progressBar.preferredSize = [210, 5];
            
            self.ui.win.onResizing = self.ui.win.onResize = function() { if(this.layout) this.layout.resize(); };
            if (self.ui.win instanceof Window) { self.ui.win.center(); self.ui.win.show(); } else { self.ui.win.layout.layout(true); }
        }
    };
    // END - OBJETO PRINCIPAL DO SCRIPT

    LayersOrganizer.buildUI(this);
})();