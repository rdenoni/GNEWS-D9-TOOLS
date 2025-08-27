// Auto Layer Organizer - Script Principal
// Versão 4.1 (Correções aplicadas)
// Este script lê as configurações de um arquivo JSON externo.
// Execute o script AutoLayerOrder_Settings.jsx para alterar as configurações.

(function() {
    // START - FUNÇÕES DE CONFIGURAÇÃO E AUXILIARES
    var DEBUG_MODE = true;
    
    var COLORS = { 
        success: [0.2, 0.8, 0.2], error: [0.8, 0.2, 0.2], warning: [0.9, 0.7, 0.2], info: [0.2, 0.6, 0.9], neutral: [0.9, 0.9, 0.9],
    };

    function debugLog(message) {
        if (DEBUG_MODE) $.writeln("[DEBUG] " + message);
    }

    function loadConfig() {
        var configFile = new File(Folder.userData.fsName + "/organizer_config.json");
        var defaultConfig = {
            language: "PT",
            prefixes: {
                ShapeLayer: "Shp_", TextLayer: "Txt_", SolidLayer: "Sld_",
                AdjustmentLayer: "Ajust_", CompItem: "Comp_", CameraLayer: "Cam_",
                NullLayer: "Null_", VideoLayer: "Vid_", ImageLayer: "Img_"
            },
            layerColorIndices: {
                ShapeLayer: 8, TextLayer: 1, SolidLayer: 14, AdjustmentLayer: 2,
                CompItem: 12, CameraLayer: 2, NullLayer: 2, VideoLayer: 14, ImageLayer: 11
            }
        };

        if (configFile.exists) {
            try {
                configFile.open("r");
                var config = JSON.parse(configFile.read());
                configFile.close();
                return config;
            } catch (e) {
                return defaultConfig;
            }
        } else {
            return defaultConfig;
        }
    }

    var config = loadConfig();

    var bgColor1 = '#0B0D0E', normalColor1 = '#C7C8CA', highlightColor1 = '#E0003A';
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    function setStatusColor(element, color) {
        try {
            if (element && element.graphics) {
                element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
            }
        } catch (e) { debugLog("Erro ao definir cor do status: " + e.toString()); }
    }

    function getLocalizedString(key) {
        var strings = {
            PT: {
                windowTitle: "Auto Layer Organizer v4.1",
                automateBtn: "\u2728 ORGANIZAR", 
                organizeBtnTip: "Executa as ações de organização selecionadas na composição ativa.",
                helpBtnTip: "Ajuda sobre o Auto Layer Organizer",
                helpBtnShortTip: "Ajuda",
                optionsPanel: "Opções",
                applyColorsCheck: "Aplicar cores",
                applyColorsTip: "Aplica um esquema de cores pré-definido às camadas com base no seu tipo.",
                renameLayersCheck: "Renamer camadas",
                renameLayersTip: "Renomeia as camadas adicionando um prefixo padrão (ex: Shp_, Txt_).",
                reorderLayersCheck: "Reordenar por tipo",
                reorderLayersTip: "Agrupa as camadas por tipo, mantendo a ordem temporal original dentro de cada grupo.",
                reorderByTimeCheck: "Reordenar por tempo",
                reorderByTimeTip: "Organiza as camadas de modo que as que começam mais tarde na timeline fiquem no topo.",
                deleteHiddenCheck: "Deletar ocultas",
                deleteHiddenTip: "Remove permanentemente todas as camadas com a visibilidade desativada (olho desligado).",
                statusWaiting: "Aguardando...",
                statusReady: "Pronto para uso...",
                statusStarting: "Iniciando...",
                statusNoComp: "ERRO: Nenhuma comp selecionada!",
                statusCompFound: "Comp encontrada: ",
                statusSearchingHidden: "Buscando ocultas...",
                statusDeletingHidden: "Excluindo camadas ocultas...",
                statusNoHiddenToDelete: "Nenhuma oculta para deletar.",
                statusCheckingExpressions: "Verificando expressões...",
                statusIndexWarning: "AVISO: Expressões com índice detectadas",
                statusReordering: "Reordenando...",
                statusReordered: "Reordenação concluída! {0} camadas",
                statusNoOrderChange: "Ordem já conforme solicitado.",
                statusNoLayersLeft: "Nenhuma camada restante.",
                statusCompleted: "Concluído!\nTotal: {0} | Visíveis: {1}\nShapes: {2} | Textos: {3} | Sólidos: {4}\nAjustes: {5} | Comps: {6} | Câmeras: {7}",
                statusActions: "\nAções: ",
                statusRenamed: "Renomeadas: {0}",
                statusColored: "Coloridas: {0}",
                statusDeleted: "Deletadas: {0}",
                statusReorderedAction: "Reordenadas: {0}",
                statusIndexCancelled: "Reordenação parcial (índice)",
                statusProcessing: "Processando...",
                statusError: "ERRO: ",
                statusNoActions: "Nenhuma ação selecionada!",
                reorderConflictTitle: "Conflito de Reordenação",
                reorderConflictMessage: "Apenas uma opção de reordenação pode estar ativa por vez.",
                skippedLayersTitle: "Camadas Não Modificadas",
                skippedLayersMessage: "As seguintes camadas não foram modificadas:\n\n{0}",
                skippedLayerInfo: "Camada: {0} (Índice: {1})\nMotivo: {2}\n",
                reasonIndex: "Expressão com referência a índice",
                reasonLinked: "Vínculo com outra camada (parent, track matte ou máscara)",
                reasonLocked: "Camada bloqueada"
            },
            EN: { 
                windowTitle: "Auto Layer Organizer v4.1",
                automateBtn: "\u2728 ORGANIZE",
                organizeBtnTip: "Executes the selected organization actions on the active composition.",
                helpBtnTip: "Help for Auto Layer Organizer",
                helpBtnShortTip: "Help",
                optionsPanel: "Options",
                applyColorsCheck: "Apply colors",
                applyColorsTip: "Applies a predefined color scheme to layers based on their type.",
                renameLayersCheck: "Rename layers",
                renameLayersTip: "Renames layers by adding a standard prefix (e.g., Shp_, Txt_).",
                reorderLayersCheck: "Reorder by type",
                reorderLayersTip: "Groups layers by type, keeping the original temporal order within each group.",
                reorderByTimeCheck: "Reorder by time",
                reorderByTimeTip: "Organizes layers so that those that start later in the timeline are at the top.",
                deleteHiddenCheck: "Delete hidden",
                deleteHiddenTip: "Permanently removes all layers with visibility turned off (eyeball off).",
                statusWaiting: "Waiting...",
                statusReady: "Ready to use...",
                statusStarting: "Starting...",
                statusNoComp: "ERROR: No comp selected!",
                statusCompFound: "Comp found: ",
                statusSearchingHidden: "Searching for hidden layers...",
                statusDeletingHidden: "Deleting hidden layers...",
                statusNoHiddenToDelete: "No hidden layers to delete.",
                statusCheckingExpressions: "Checking expressions...",
                statusIndexWarning: "WARNING: Index-dependent expressions detected",
                statusReordering: "Reordering...",
                statusReordered: "Reordering complete! {0} layers",
                statusNoOrderChange: "Order is already as requested.",
                statusNoLayersLeft: "No layers remaining.",
                statusCompleted: "Completed!\nTotal: {0} | Visible: {1}\nShapes: {2} | Texts: {3} | Solids: {4}\nAdjustments: {5} | Comps: {6} | Cameras: {7}",
                statusActions: "\nActions: ",
                statusRenamed: "Renamed: {0}",
                statusColored: "Colored: {0}",
                statusDeleted: "Deleted: {0}",
                statusReorderedAction: "Reordered: {0}",
                statusIndexCancelled: "Partial reordering (index)",
                statusProcessing: "Processing...",
                statusError: "ERROR: ",
                statusNoActions: "No actions selected!",
                reorderConflictTitle: "Reordering Conflict",
                reorderConflictMessage: "Only one reordering option can be active at a time.",
                skippedLayersTitle: "Unmodified Layers",
                skippedLayersMessage: "The following layers were not modified:\n\n{0}",
                skippedLayerInfo: "Layer: {0} (Index: {1})\nReason: {2}\n",
                reasonIndex: "Expression with index reference",
                reasonLinked: "Linked to another layer (parent, track matte, or mask)",
                reasonLocked: "Layer locked"
            }
        };
        return strings[config.language][key] || key;
    }

    // START - FUNÇÃO DE AJUDA PADRONIZADA
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

        setBgColor(helpWin, bgColor1);

        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column";
        headerPanel.alignChildren = ["fill", "top"];
        headerPanel.alignment = ["fill", "top"];
        headerPanel.spacing = 10;
        headerPanel.margins = 15;
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - AUTO LAYER ORGANIZER");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        setFgColor(titleText, highlightColor1);

        var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta automatiza a organização de camadas em suas composições.", {multiline: true});
        mainDescText.alignment = ["fill", "fill"];
        mainDescText.preferredSize.height = 40;
        setFgColor(mainDescText, normalColor1);

        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"];
        topicsTabPanel.margins = 15;

        var allHelpTopics = [
            {
                tabName: "FUNCIONALIDADES",
                topics: [
                    { title: "▶ Renamer CAMADAS:", text: "Adiciona prefixos padrão (ex: 'Shp_', 'Txt_') aos nomes das camadas com base em seu tipo. Remove prefixos duplicados automaticamente." },
                    { title: "▶ APLICAR CORES:", text: "Atribui cores de rótulo padrão a cada tipo de camada (ex: Shapes Azul, Textos Vermelho) para melhor distinção visual." },
                    { title: "▶ REORDENAR POR TIPO:", text: "Agrupa as camadas na Timeline por tipo (ex: todos os Ajustes primeiro, depois Câmeras, Nulos, Textos, etc.), mantendo a ordem temporal original dentro de cada grupo de tipo. " },
                    { title: "▶ REORDENAR POR TEMPO:", text: "Reorganiza as camadas de modo que as que começam mais tarde na Timeline apareçam no topo da pilha. Útil para fluxos de trabalho que priorizam o tempo de início." },
                    { title: "▶ DELETAR OCULTAS:", text: "Remove permanentemente as camadas que estão atualmente desativadas (visibilidade desabilitada). " }
                ]
            },
            {
                tabName: "COMPORTAMENTO",
                topics: [
                    { title: "▶ EXPRESSÕES COM ÍNDICE:", text: "Camadas com expressões que referenciam outras camadas por seu número de índice (ex: `thisComp.layer(1)`) não serão reordenadas para evitar quebrar as animações." },
                    { title: "▶ CAMADAS VINCULADAS:", text: "Camadas que são pais/filhos, track mattes ou têm máscaras aplicadas NÃO serão deletadas quando 'Deletar Ocultas' for usado, para proteger a integridade do projeto." },
                    { title: "▶ CAMADAS BLOQUEADAS:", text: "Camadas com cadeado ativado não serão renomeadas, preservando nomes importantes manualmente definidos." },
                    { title: "▶ BOTÃO CONFIGURAÇÕES (Script separado):", text: "Para personalizar prefixos, cores e idioma, execute o script 'AutoLayerOrder_Settings.jsx' separadamente." }
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
                setFgColor(topicTitle, highlightColor1);
                topicTitle.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);

                if(topic.text !== ""){
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    topicText.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);
                    topicText.preferredSize.height = 50;
                    setFgColor(topicText, normalColor1);
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
    // END - FUNÇÃO DE AJUDA PADRONIZADA

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
            var layerNamePattern = new RegExp('(thisComp\\.layer\\("?' + escapeRegExp(layer.name) + '"?\\)|comp\\(\\s*"?' + escapeRegExp(layer.name) + '"?\\s*\\))', 'i');
            var layerIndexPattern = new RegExp('(thisComp\\.layer\\(' + layer.index + '\\)|comp\\(\\s*' + layer.index + '\\s*\\))', 'i');
            return layerNamePattern.test(expression) || layerIndexPattern.test(expression);
        } catch (e) {
            return false;
        }
    }
    
    function hasIndexDependentExpressions(layer) {
        var props = getAllProperties(layer);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            if (prop.canSetExpression && prop.expression !== "") {
                if (/(thisComp\s*\.\s*layer\s*\(\s*\d+\s*\)|comp\s*\(\s*\d+\s*\))/i.test(prop.expression)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function findIndex(array, value) {
        for (var i = 0; i < array.length; i++) if (array[i] === value) return i;
        return -1;
    }
    
    function setLayerColor(layer, colorIndex) {
        try {
            layer.label = colorIndex;
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // CORREÇÃO: Variável statusText movida para escopo global da closure
    var statusText = null;
    
    function updateStatus(messageOrKey, type, params) {
        if (!statusText) return;
    
        var text = getLocalizedString(messageOrKey);
        if (text === messageOrKey && messageOrKey.indexOf('status') !== 0) {
            text = messageOrKey; 
        }

        if (params) {
            for (var i = 0; i < params.length; i++) {
                text = text.replace("{" + i + "}", params[i]);
            }
        }
        
        var color = COLORS[type] || COLORS.neutral;
        statusText.text = text;
        setStatusColor(statusText, color);
        
        if (type === "success") { 
            app.setTimeout(function () {
                if (statusText && statusText.text === text) { 
                    statusText.text = getLocalizedString("statusReady");
                    setStatusColor(statusText, COLORS.neutral);
                }
            }, 3000);
        }
    }

    function isLayerLinked(comp, layer) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var otherLayer = comp.layer(i);
            if (otherLayer !== layer && otherLayer.parent === layer) {
                return true;
            }
        }
        if (layer.property("ADBE Mask Parade") && layer.property("ADBE Mask Parade").numProperties > 0) {
            return true;
        }
        for (var i = 1; i <= comp.numLayers; i++) {
            var otherLayer = comp.layer(i);
            var props = getAllProperties(otherLayer);
            for (var j = 0; j < props.length; j++) {
                var prop = props[j];
                if (prop.canSetExpression && prop.expression !== "") {
                    if (expressionReferencesLayer(prop.expression, layer)) return true;
                }
            }
        }
        return false;
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
        popup.add("statictext", undefined, getLocalizedString("skippedLayersMessage").replace("{0}", message), {multiline: true});
        popup.add("button", undefined, "OK", {name: "ok"}).onClick = function() { popup.close(); };
        popup.center();
        popup.show();
    }

    function showReorderConflictAlert() {
        var alertWin = new Window("dialog", getLocalizedString("reorderConflictTitle"));
        alertWin.add("statictext", undefined, getLocalizedString("reorderConflictMessage"), {multiline: true});
        alertWin.add("button", undefined, "OK", {name: "ok"}).onClick = function() { alertWin.close(); };
        alertWin.center();
        alertWin.show();
    }
    
    function isTextLayer(layer) { try { return layer.property("ADBE Text Properties") !== null; } catch (e) { return false; } }
    function isShapeLayer(layer) { try { return layer.property("ADBE Root Vectors Group") !== null; } catch (e) { return false; } }
    function isSolidLayer(layer) {
        try {
            if (layer.source && layer.source.typeName == "Solid" && !layer.adjustmentLayer) return true;
            if (layer.source && layer.source.mainSource && layer.source.mainSource.color && !layer.adjustmentLayer) return true;
            if (layer.source && (layer.source.name.indexOf("Solid") === 0 || layer.name.indexOf("Solid") === 0) && !layer.adjustmentLayer) return true;
            if (layer.source && layer.source instanceof FootageItem && layer.source.footageMissing === false && layer.source.file === null && !layer.adjustmentLayer) return true;
            return false;
        } catch (e) {
            return false;
        }
    }
    
    // NOVA FUNÇÃO: Remove prefixos duplicados e palavras repetidas
    function cleanLayerName(name, prefix) {
        if (!name) return "";
        
        // Remove todos os prefixos conhecidos primeiro
        var allPrefixes = [];
        for (var key in config.prefixes) {
            allPrefixes.push(config.prefixes[key]);
        }
        
        // Remove prefixos repetidos (ex: "Null_Null_" -> "")
        var cleanName = name;
        for (var i = 0; i < allPrefixes.length; i++) {
            var prefixPattern = new RegExp("^(" + escapeRegExp(allPrefixes[i]) + ")+", "gi");
            cleanName = cleanName.replace(prefixPattern, "");
        }
        
        // Remove underscores duplos ou no início
        cleanName = cleanName.replace(/^_+/, "").replace(/__+/g, "_");
        
        // Remove palavras duplicadas como "null null" (case insensitive)
        var words = ["null", "text", "txt", "shape", "shp", "solid", "sld", "comp", "camera", "cam", "adjustment", "ajust", "video", "vid", "image", "img"];
        for (var j = 0; j < words.length; j++) {
            var wordPattern = new RegExp("^(" + words[j] + "[_\\s]*)+" + words[j], "gi");
            cleanName = cleanName.replace(wordPattern, words[j]);
        }
        
        // Se após limpar ficou vazio, usa um nome padrão
        if (cleanName === "" || cleanName === "_") {
            cleanName = "Layer";
        }
        
        // Adiciona o novo prefixo
        return prefix + cleanName;
    }
    
    // NOVA FUNÇÃO: Verifica se a layer é referenciada por expressões
    function isLayerReferencedByExpressions(comp, targetLayer) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer !== targetLayer) {
                var props = getAllProperties(layer);
                for (var j = 0; j < props.length; j++) {
                    var prop = props[j];
                    if (prop.canSetExpression && prop.expression !== "") {
                        if (expressionReferencesLayer(prop.expression, targetLayer)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
    // END - FUNÇÕES DE LÓGICA DO SCRIPT

    // START - OBJETO PRINCIPAL DO SCRIPT
    var LayersOrganizer = {
        ui: {},
        layerTypeOrder: ["AdjustmentLayer", "CameraLayer", "NullLayer", "TextLayer", "ShapeLayer",
                         "SolidLayer", "ImageLayer", "CompItem", "VideoLayer"],
        isProcessing: false,

        executeOrganize: function() {
            var self = this;
            if (self.isProcessing) {
                return;
            }

            if (!self.ui.applyColorsCheck.value && !self.ui.renameLayersCheck.value && !self.ui.reorderLayersCheck.value && 
                !self.ui.reorderByTimeCheck.value && !self.ui.deleteHiddenCheck.value) {
                updateStatus("statusNoActions", "warning");
                return;
            }

            self.isProcessing = true;
            updateStatus("statusStarting", "info");
            self.ui.organizeBtn.enabled = false;
            self.ui.helpBtn.enabled = false;
            
            app.beginUndoGroup("Auto Layer Organize");
            
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    updateStatus("statusNoComp", "error");
                    self.isProcessing = false; 
                    self.ui.organizeBtn.enabled = true; 
                    self.ui.helpBtn.enabled = true;
                    app.endUndoGroup();
                    return;
                }
                
                updateStatus("statusCompFound", "info", [comp.name]);
                
                function forceUIUpdate() {
                    if (self.ui.win && typeof self.ui.win.update === 'function') {
                        self.ui.win.update();
                    }
                }
                
                // NOVO: Verifica se há layers selecionadas
                var selectedLayers = comp.selectedLayers;
                var processOnlySelected = selectedLayers && selectedLayers.length > 0;
                
                var stats = { 
                    total: processOnlySelected ? selectedLayers.length : comp.numLayers, 
                    enabled: 0, disabled: 0, renamed: 0, colored: 0, deleted: 0, reordered: 0,
                    shapes: 0, texts: 0, solids: 0, adjustments: 0, comps: 0, cameras: 0, nulls: 0, images: 0, videos: 0,
                    skippedIndexDependent: 0, skippedReferenced: 0 
                };
                
                // Conta layers habilitadas/desabilitadas
                if (processOnlySelected) {
                    for (var i = 0; i < selectedLayers.length; i++) {
                        if (selectedLayers[i].enabled) stats.enabled++; else stats.disabled++;
                    }
                } else {
                    for (var i = 1; i <= comp.numLayers; i++) {
                        var layer = comp.layer(i);
                        if (layer.enabled) stats.enabled++; else stats.disabled++;
                    }
                }
                
                var skippedLayers = [];

                if (self.ui.deleteHiddenCheck.value && !processOnlySelected) {
                    updateStatus("statusSearchingHidden", "info");
                    var layerIndicesToDelete = [];
                    for (var i = comp.numLayers; i >= 1; i--) {
                        var layer = comp.layer(i);
                        if (!layer.enabled) {
                            if (isLayerLinked(comp, layer)) {
                                skippedLayers.push({ layer: layer, index: layer.index, reason: getLocalizedString("reasonLinked") });
                            } else {
                                layerIndicesToDelete.push(i);
                            }
                        }
                    }
                    if (layerIndicesToDelete.length > 0) {
                        var totalToDelete = layerIndicesToDelete.length;
                        updateStatus("statusDeletingHidden", "info");
                        forceUIUpdate();
                        
                        // Processa em lotes para melhor performance
                        var batchSize = 10;
                        for (var j = 0; j < totalToDelete; j++) {
                            if (j % batchSize === 0) {
                                var progressText = getLocalizedString("statusDeletingHidden") + " (" + (j + 1) + "/" + totalToDelete + ")";
                                updateStatus(progressText, "info");
                                forceUIUpdate();
                            }
                            
                            var layerToDelete = comp.layer(layerIndicesToDelete[j]);
                            // Desbloqueia se necessário
                            var wasLocked = layerToDelete.locked;
                            if (wasLocked) layerToDelete.locked = false;
                            
                            layerToDelete.remove();
                            stats.deleted++;
                        }
                    } else {
                        updateStatus("statusNoHiddenToDelete", "info");
                    }
                }
                
                if (comp.numLayers > 0) {
                    var layerInfos = [];
                    var layersToProcess = processOnlySelected ? selectedLayers : [];
                    
                    // Se não há seleção, processa todas as layers
                    if (!processOnlySelected) {
                        for (var i = 1; i <= comp.numLayers; i++) {
                            layersToProcess.push(comp.layer(i));
                        }
                    }
                    
                    var totalLayersToProcess = layersToProcess.length;
                    var updateInterval = Math.max(1, Math.floor(totalLayersToProcess / 20)); // Atualiza UI a cada 5% do progresso

                    for (var i = 0; i < totalLayersToProcess; i++) {
                        // Atualiza status apenas em intervalos para melhor performance
                        if (i % updateInterval === 0 || i === totalLayersToProcess - 1) {
                            var progressText = getLocalizedString("statusProcessing") + " (" + (i + 1) + "/" + totalLayersToProcess + ")";
                            updateStatus(progressText, "info");
                            if (totalLayersToProcess > 100) {
                                // Só força atualização da UI para grandes quantidades
                                if (i % (updateInterval * 5) === 0) {
                                    forceUIUpdate();
                                }
                            } else {
                                forceUIUpdate();
                            }
                        }

                        var layer = layersToProcess[i];
                        var originalName = layer.name;
                        var newName = originalName;
                        var layerType = "Unknown";
                        
                        // Determina o tipo de layer e define o prefixo apropriado
                        var prefix = "";
                        if (layer instanceof CameraLayer) { 
                            layerType = "CameraLayer"; 
                            stats.cameras++; 
                            prefix = config.prefixes.CameraLayer;
                        }
                        else if (layer.nullLayer) { 
                            layerType = "NullLayer"; 
                            stats.nulls++; 
                            prefix = config.prefixes.NullLayer;
                        }
                        else if (layer.adjustmentLayer) { 
                            layerType = "AdjustmentLayer"; 
                            stats.adjustments++; 
                            prefix = config.prefixes.AdjustmentLayer;
                        }
                        else if (isTextLayer(layer)) { 
                            layerType = "TextLayer"; 
                            stats.texts++; 
                            prefix = config.prefixes.TextLayer;
                        }
                        else if (isShapeLayer(layer)) { 
                            layerType = "ShapeLayer"; 
                            stats.shapes++; 
                            prefix = config.prefixes.ShapeLayer;
                        }
                        else if (isSolidLayer(layer)) { 
                            layerType = "SolidLayer"; 
                            stats.solids++; 
                            prefix = config.prefixes.SolidLayer;
                        }
                        else if (layer.source instanceof CompItem) { 
                            layerType = "CompItem"; 
                            stats.comps++; 
                            prefix = config.prefixes.CompItem;
                        }
                        else if (layer.source && layer.source.file && /\.(psd|ai|jpg|jpeg|png|gif)$/i.test(layer.source.file.name)) { 
                            layerType = "ImageLayer"; 
                            stats.images++; 
                            prefix = config.prefixes.ImageLayer;
                        }
                        else if (layer.source && layer.source.file && /\.(mov|mp4|avi|mkv)$/i.test(layer.source.file.name)) { 
                            layerType = "VideoLayer"; 
                            stats.videos++; 
                            prefix = config.prefixes.VideoLayer;
                        }
                        
                        if (layerType !== "Unknown") {
                            // Renamer layers
                            if (self.ui.renameLayersCheck.value) {
                                // Só verifica expressões se não for uma grande quantidade de layers
                                var skipRename = false;
                                if (totalLayersToProcess < 50) {
                                    skipRename = isLayerReferencedByExpressions(comp, layer);
                                    if (skipRename) {
                                        stats.skippedReferenced++;
                                        skippedLayers.push({ 
                                            layer: layer, 
                                            index: layer.index, 
                                            reason: "Referenciada por expressões em outras layers" 
                                        });
                                    }
                                }
                                
                                if (!skipRename) {
                                    newName = cleanLayerName(originalName, prefix);
                                    if (layer.name !== newName) {
                                        // Desbloqueia temporariamente se necessário
                                        var wasLocked = layer.locked;
                                        if (wasLocked) layer.locked = false;
                                        
                                        layer.name = newName;
                                        stats.renamed++;
                                        
                                        // Rebloqueia se estava bloqueada
                                        if (wasLocked) layer.locked = true;
                                    }
                                }
                            }
                            
                            // Aplicar cores
                            if (self.ui.applyColorsCheck.value && config.layerColorIndices[layerType]) {
                                // Para layers travadas, destrava temporariamente
                                var wasLocked = layer.locked;
                                if (wasLocked) layer.locked = false;
                                
                                if (setLayerColor(layer, config.layerColorIndices[layerType])) {
                                    stats.colored++;
                                }
                                
                                if (wasLocked) layer.locked = true;
                            }
                        }
                        
                        layerInfos.push({ layer: layer, type: layerType, index: layer.index, startTime: layer.startTime });
                    }

                    // Reordenação de layers
                    if (self.ui.reorderLayersCheck.value || self.ui.reorderByTimeCheck.value) {
                        // Se ambos estiverem marcados, usa apenas o mais recente clicado
                        if (self.ui.reorderLayersCheck.value && self.ui.reorderByTimeCheck.value) {
                            self.ui.reorderByTimeCheck.value = false;
                        }
                        
                        // Só reordena se não estamos processando apenas layers selecionadas
                        if (!processOnlySelected) {
                            updateStatus("statusCheckingExpressions", "info");
                            var layersToReorder = [];
                            var lockedStates = {}; // Armazena estados de travamento
                            
                            // Verifica expressões apenas para pequenas quantidades
                            var checkExpressions = totalLayersToProcess < 50;
                            
                            for (var k = 0; k < layerInfos.length; k++) {
                                var shouldSkip = false;
                                
                                if (checkExpressions && hasIndexDependentExpressions(layerInfos[k].layer)) {
                                    stats.skippedIndexDependent++;
                                    skippedLayers.push({ 
                                        layer: layerInfos[k].layer, 
                                        index: layerInfos[k].index, 
                                        reason: getLocalizedString("reasonIndex") 
                                    });
                                    shouldSkip = true;
                                }
                                
                                if (!shouldSkip) {
                                    // Armazena estado de travamento e destrava se necessário
                                    lockedStates[k] = layerInfos[k].layer.locked;
                                    if (layerInfos[k].layer.locked) {
                                        layerInfos[k].layer.locked = false;
                                    }
                                    layersToReorder.push(layerInfos[k]);
                                }
                            }

                            updateStatus("statusReordering", "info");
                            forceUIUpdate();

                            if (self.ui.reorderLayersCheck.value) {
                                // Ordena por tipo
                                layersToReorder.sort(function(a, b) {
                                    var typeIndexA = findIndex(self.layerTypeOrder, a.type);
                                    var typeIndexB = findIndex(self.layerTypeOrder, b.type);
                                    if (typeIndexA === typeIndexB) return a.startTime - b.startTime;
                                    return typeIndexA - typeIndexB;
                                });
                                
                                var totalToReorder = layersToReorder.length;
                                var updateInterval = Math.max(1, Math.floor(totalToReorder / 10));
                                
                                for (var m = totalToReorder - 1; m >= 0; m--) {
                                    if (m % updateInterval === 0) {
                                        var progressText = getLocalizedString("statusReordering") + " (" + (totalToReorder - m) + "/" + totalToReorder + ")";
                                        updateStatus(progressText, "info");
                                        if (totalToReorder > 100 && m % (updateInterval * 2) === 0) {
                                            forceUIUpdate();
                                        }
                                    }
                                    layersToReorder[m].layer.moveToBeginning();
                                }

                            } else if (self.ui.reorderByTimeCheck.value) {
                                // Ordena por tempo
                                layersToReorder.sort(function(a, b) {
                                    return b.startTime - a.startTime; 
                                });
                                
                                var totalToReorder = layersToReorder.length;
                                var updateInterval = Math.max(1, Math.floor(totalToReorder / 10));
                                
                                if (totalToReorder > 0) {
                                    layersToReorder[0].layer.moveToBeginning();
                                    
                                    for (var m = 1; m < totalToReorder; m++) {
                                        if (m % updateInterval === 0) {
                                            var progressText = getLocalizedString("statusReordering") + " (" + (m + 1) + "/" + totalToReorder + ")";
                                            updateStatus(progressText, "info");
                                            if (totalToReorder > 100 && m % (updateInterval * 2) === 0) {
                                                forceUIUpdate();
                                            }
                                        }
                                        layersToReorder[m].layer.moveAfter(layersToReorder[m - 1].layer);
                                    }
                                }
                            }
                            
                            // Restaura estados de travamento
                            for (var n = 0; n < layersToReorder.length; n++) {
                                var originalIndex = layerInfos.indexOf(layersToReorder[n]);
                                if (lockedStates[originalIndex]) {
                                    layersToReorder[n].layer.locked = true;
                                }
                            }
                            
                            stats.reordered = layersToReorder.length;
                        }
                    }
                } else {
                    updateStatus("statusNoLayersLeft", "warning");
                }
                
                if (skippedLayers.length > 0) {
                    showSkippedLayersFeedback(skippedLayers);
                }
                
                var visibleCount = (stats.enabled + stats.disabled) - stats.deleted;
                var statusMessage = getLocalizedString("statusCompleted")
                    .replace("{0}", comp.numLayers).replace("{1}", visibleCount)
                    .replace("{2}", stats.shapes).replace("{3}", stats.texts).replace("{4}", stats.solids)
                    .replace("{5}", stats.adjustments).replace("{6}", stats.comps).replace("{7}", stats.cameras);
                
                var actions = [];
                if (stats.renamed > 0) actions.push(getLocalizedString("statusRenamed").replace("{0}", stats.renamed));
                if (stats.colored > 0) actions.push(getLocalizedString("statusColored").replace("{0}", stats.colored));
                if (stats.deleted > 0) actions.push(getLocalizedString("statusDeleted").replace("{0}", stats.deleted));
                if (stats.reordered > 0) actions.push(getLocalizedString("statusReorderedAction").replace("{0}", stats.reordered));
                if (stats.skippedIndexDependent > 0) actions.push(getLocalizedString("statusIndexCancelled"));
                
                if (actions.length > 0) {
                    statusMessage += getLocalizedString("statusActions") + actions.join("  •  ");
                }
                updateStatus(statusMessage, "success");
                
            } catch (err) {
                updateStatus(getLocalizedString("statusError") + err.toString(), "error");
            } finally {
                self.isProcessing = false;
                self.ui.organizeBtn.enabled = true;
                self.ui.helpBtn.enabled = true;
                app.endUndoGroup();
            }
        },

        buildUI: function(thisObj) {
            var self = this;
            self.ui.win = (thisObj instanceof Panel) ? thisObj : new Window("palette", getLocalizedString("windowTitle"), undefined);
            self.ui.win.orientation = "column";
            self.ui.win.spacing = 10;
            self.ui.win.margins = 15;
            self.ui.win.preferredSize.width = 20;  // CORREÇÃO: Mantém largura original
            
            setBgColor(self.ui.win, bgColor1);

            var headerGrp = self.ui.win.add("group");
            headerGrp.orientation = "row";
            headerGrp.alignChildren = ["fill", "center"];
            headerGrp.alignment = "fill";
            headerGrp.spacing = 10;

            var titleText = headerGrp.add("statictext", undefined, "Auto Layer Organizer");
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
            titleText.preferredSize.width = 180;
            setFgColor(titleText, highlightColor1);
            
            // CORREÇÃO: Restaura o botão temático de ajuda
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
                var helpBtnGroup = headerGrp.add('group');
                helpBtnGroup.alignment = ['right', 'center'];
                self.ui.helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + getLocalizedString("helpBtnShortTip")] });
                self.ui.helpBtn.leftClick.onClick = showLayersOrganizeHelp;
            } else {
                self.ui.helpBtn = headerGrp.add("button", undefined, "?");
                self.ui.helpBtn.preferredSize = [24, 24];
                self.ui.helpBtn.helpTip = getLocalizedString("helpBtnTip");
                self.ui.helpBtn.alignment = ['right', 'center'];
                self.ui.helpBtn.onClick = showLayersOrganizeHelp;
            }

            self.ui.optionsPanel = self.ui.win.add("panel", undefined, getLocalizedString("optionsPanel"), {borderStyle: "etched"});
            self.ui.optionsPanel.orientation = "column";
            self.ui.optionsPanel.alignment = ["fill", "top"];
            self.ui.optionsPanel.alignChildren = ["left", "top"];
            self.ui.optionsPanel.margins = 15;
            self.ui.optionsPanel.spacing = 5;
            
            self.ui.applyColorsCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("applyColorsCheck"));
            self.ui.applyColorsCheck.helpTip = getLocalizedString("applyColorsTip");
            
            self.ui.renameLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("renameLayersCheck"));
            self.ui.renameLayersCheck.helpTip = getLocalizedString("renameLayersTip");

            self.ui.reorderLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersCheck"));
            self.ui.reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");

            self.ui.reorderByTimeCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderByTimeCheck"));
            self.ui.reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");

            self.ui.deleteHiddenCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("deleteHiddenCheck"));
            self.ui.deleteHiddenCheck.helpTip = getLocalizedString("deleteHiddenTip");
            
            // CORREÇÃO: Adiciona lógica para desabilitar checkbox conflitante
            self.ui.reorderLayersCheck.onClick = function() {
                if (self.ui.reorderLayersCheck.value) {
                    self.ui.reorderByTimeCheck.enabled = false;
                    self.ui.reorderByTimeCheck.value = false;
                } else {
                    self.ui.reorderByTimeCheck.enabled = true;
                }
            };
            
            self.ui.reorderByTimeCheck.onClick = function() {
                if (self.ui.reorderByTimeCheck.value) {
                    self.ui.reorderLayersCheck.enabled = false;
                    self.ui.reorderLayersCheck.value = false;
                } else {
                    self.ui.reorderLayersCheck.enabled = true;
                }
            };

            var mainBtnPanel = self.ui.win.add("group");
            mainBtnPanel.orientation = "row";
            mainBtnPanel.alignment = ["fill", "fill"];

            self.ui.organizeBtn = mainBtnPanel.add("button", undefined, getLocalizedString("automateBtn"));
            self.ui.organizeBtn.alignment = 'fill'; 
            self.ui.organizeBtn.preferredSize.height = 40;
            self.ui.organizeBtn.preferredSize.width = 200;
            self.ui.organizeBtn.helpTip = getLocalizedString("organizeBtnTip");
            self.ui.organizeBtn.onClick = function() { self.executeOrganize(); };
            
            var statusPanel = self.ui.win.add("panel", undefined, "Status");
            statusPanel.alignment = "fill";
            statusPanel.margins = 10;
            statusPanel.preferredSize.height = 20;  // CORREÇÃO: Mantém altura original
            var statusGroup = statusPanel.add("group");
            statusGroup.alignment = "fill";
            statusGroup.orientation = "row";
            
            // CORREÇÃO: Inicializa statusText corretamente
            statusText = statusGroup.add("statictext", undefined, getLocalizedString("statusReady"), {multiline: true});
            statusText.alignment = ['fill', 'fill']; 
            statusText.justify = 'left';
            setStatusColor(statusText, COLORS.neutral);
            
            self.ui.win.onResizing = self.ui.win.onResize = function() { 
                if(this.layout) this.layout.resize(); 
            };
            
            if (self.ui.win instanceof Window) { 
                self.ui.win.center(); 
                self.ui.win.show(); 
            } else { 
                self.ui.win.layout.layout(true); 
            }
        }
    };

    LayersOrganizer.buildUI(this);
})();