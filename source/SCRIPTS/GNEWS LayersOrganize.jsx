// Auto Layer Organizer - Script Principal
// Versão 3.4 (Ícone no botão principal)
// Este script lê as configurações de um arquivo JSON externo.
// Execute o script AutoLayerOrganizer_Settings.jsx para alterar as configurações.

(function() {
    // START - FUNÇÕES DE CONFIGURAÇÃO E AUXILIARES
    var DEBUG_MODE = true;
    
    function debugLog(message) {
        if (DEBUG_MODE) $.writeln("[DEBUG] " + message);
    }

    // Função para carregar a configuração de um arquivo JSON.
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

    // Funções de localização e estilo (essenciais para a UI)
    var bgColor1 = '#0B0D0E', normalColor1 = '#C7C8CA', highlightColor1 = '#E0003A';
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    function getLocalizedString(key) {
        var strings = {
            PT: {
                windowTitle: "Auto Layer Organizer v3.4",
                automateBtn: "\u2728 ORGANIZAR", // <-- ALTERADO AQUI
                helpBtnTip: "Ajuda sobre o Auto Layer Organizer",
                helpBtnShortTip: "Ajuda",
                optionsPanel: "Opções",
                applyColorsCheck: "Aplicar cores",
                renameLayersCheck: "Renomear camadas",
                reorderLayersCheck: "Reordenar por tipo",
                reorderLayersTip: "Agrupa por tipo mantendo ordem temporal",
                reorderByTimeCheck: "Reordenar por tempo",
                reorderByTimeTip: "Camadas mais tardias ficam no topo",
                deleteHiddenCheck: "Deletar ocultas",
                statusWaiting: "Aguardando...",
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
                statusProcessing: "Processando...",
                statusError: "ERRO: ",
                statusNoActions: "Nenhuma ação selecionada!",
                reorderConflictTitle: "Conflito de Reordenação",
                reorderConflictMessage: "Apenas uma opção de reordenação pode estar ativa por vez.",
                skippedLayersTitle: "Camadas Não Modificadas",
                skippedLayersMessage: "As seguintes camadas não foram modificadas:\n\n{0}",
                skippedLayerInfo: "Camada: {0} (Índice: {1})\nMotivo: {2}\n",
                reasonIndex: "Expressão com referência a índice",
                reasonLinked: "Vínculo com outra camada (parent, track matte ou máscara)"
            },
            EN: {
                windowTitle: "Auto Layer Organizer v3.4",
                automateBtn: "\u2728 ORGANIZE", // <-- CHANGED HERE
                helpBtnTip: "Help for Auto Layer Organizer",
                helpBtnShortTip: "Help",
                optionsPanel: "Options",
                applyColorsCheck: "Apply colors",
                renameLayersCheck: "Rename layers",
                reorderLayersCheck: "Reorder by type",
                reorderLayersTip: "Groups by type while keeping temporal order",
                reorderByTimeCheck: "Reorder by time",
                reorderByTimeTip: "Later layers go to the top",
                deleteHiddenCheck: "Delete hidden",
                statusWaiting: "Waiting...",
                statusStarting: "Starting...",
                statusNoComp: "ERROR: No comp selected!",
                statusCompFound: "Comp found: ",
                statusSearchingHidden: "Searching for hidden layers...",
                statusDeletingHidden: "Deleting {0} hidden layers...",
                statusNoHiddenToDelete: "No hidden layers to delete.",
                statusCheckingExpressions: "Checking expressions...",
                statusIndexWarning: "WARNING: Index-dependent expressions detected",
                statusReordering: "Reordering...",
                statusReordered: "Reordering complete! {0} layers",
                statusNoOrderChange: "Order is already as requested.",
                statusNoLayersLeft: "No layers remaining.",
                statusCompleted: "Completed!\nTotal: {0} | Visible: {1} | Hidden: {2}\nShapes: {3} | Texts: {4} | Solids: {5}\nAdjustments: {6} | Comps: {7} | Cameras: {8}",
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
                reasonLinked: "Linked to another layer (parent, track matte, or mask)"
            }
        };
        return strings[config.language][key] || key;
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
                    { title: "▶ BOTÃO CONFIGURAÇÕES (Script separado):", text: "Para personalizar prefixos, cores e idioma, execute o script 'AutoLayerOrganizer_Settings.jsx' separadamente." }
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
    
    function updateStatus(message, params) {
        var text = getLocalizedString(message);
        if (params) {
            for (var i = 0; i < params.length; i++) {
                text = text.replace("{" + i + "}", params[i]);
            }
        }
        statusText.text = text;
    }
    
    function updateProgress(current, total) {
        progressBar.value = Math.round((current / total) * 100);
        updateStatus("statusProcessing");
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
                updateStatus("statusNoActions");
                return;
            }

            self.isProcessing = true;
            updateStatus("statusStarting");
            self.ui.organizeBtn.enabled = false;
            self.ui.helpBtn.enabled = false;
            
            app.beginUndoGroup("Auto Layer Organize");
            
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    updateStatus("statusNoComp");
                    return;
                }
                
                updateStatus("statusCompFound", [comp.name]);
                
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
                
                var stats = { total: comp.numLayers, enabled: 0, disabled: 0, renamed: 0, colored: 0, deleted: 0, reordered: 0,
                              shapes: 0, texts: 0, solids: 0, adjustments: 0, comps: 0, cameras: 0, nulls: 0, images: 0, videos: 0,
                              skippedIndexDependent: 0 };
                
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer.enabled) stats.enabled++; else stats.disabled++;
                }
                
                var skippedLayers = [];

                if (self.ui.deleteHiddenCheck.value) {
                    updateStatus("statusSearchingHidden");
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
                        updateStatus("statusDeletingHidden", [layerIndicesToDelete.length]);
                        for (var j = 0; j < layerIndicesToDelete.length; j++) {
                            comp.layer(layerIndicesToDelete[j]).remove();
                            stats.deleted++;
                            updateProgress(j + 1, layerIndicesToDelete.length);
                        }
                    } else {
                        updateStatus("statusNoHiddenToDelete");
                    }
                }
                
                if (comp.numLayers > 0) {
                    var layerInfos = [];
                    
                    for (var i = 1; i <= comp.numLayers; i++) {
                        var layer = comp.layer(i);
                        var originalName = layer.name;
                        var newName = originalName;
                        var layerType = "Unknown";
                        
                        if (layer instanceof CameraLayer) { layerType = "CameraLayer"; stats.cameras++; newName = config.prefixes.CameraLayer + removePrefix(originalName); }
                        else if (layer.nullLayer) { layerType = "NullLayer"; stats.nulls++; newName = config.prefixes.NullLayer + removePrefix(originalName); }
                        else if (layer.adjustmentLayer) { layerType = "AdjustmentLayer"; stats.adjustments++; newName = config.prefixes.AdjustmentLayer + removePrefix(originalName); }
                        else if (isTextLayer(layer)) { layerType = "TextLayer"; stats.texts++; newName = config.prefixes.TextLayer + removePrefix(originalName); }
                        else if (isShapeLayer(layer)) { layerType = "ShapeLayer"; stats.shapes++; newName = config.prefixes.ShapeLayer + removePrefix(originalName); }
                        else if (isSolidLayer(layer)) { layerType = "SolidLayer"; stats.solids++; newName = config.prefixes.SolidLayer + removePrefix(originalName); }
                        else if (layer.source instanceof CompItem) { layerType = "CompItem"; stats.comps++; newName = config.prefixes.CompItem + removePrefix(originalName); }
                        else if (layer.source && layer.source.file && /\.(psd|ai|jpg|jpeg|png|gif)$/i.test(layer.source.file.name)) { layerType = "ImageLayer"; stats.images++; newName = config.prefixes.ImageLayer + removePrefix(originalName); }
                        else if (layer.source && layer.source.file && /\.(mov|mp4|avi|mkv)$/i.test(layer.source.file.name)) { layerType = "VideoLayer"; stats.videos++; newName = config.prefixes.VideoLayer + removePrefix(originalName); }
                        
                        if (layerType !== "Unknown") {
                            if (self.ui.renameLayersCheck.value && layer.name !== newName) { layer.name = newName; stats.renamed++; }
                            if (self.ui.applyColorsCheck.value && config.layerColorIndices[layerType]) { if (setLayerColor(layer, config.layerColorIndices[layerType])) stats.colored++; }
                        }
                        
                        layerInfos.push({ layer: layer, type: layerType, index: i, startTime: layer.startTime });
                    }

                    if (self.ui.reorderLayersCheck.value || self.ui.reorderByTimeCheck.value) {
                        if (self.ui.reorderLayersCheck.value && self.ui.reorderByTimeCheck.value) {
                            showReorderConflictAlert();
                        } else {
                            updateStatus("statusCheckingExpressions");
                            var layersToReorder = [];
                            for (var i = 0; i < layerInfos.length; i++) {
                                if (hasIndexDependentExpressions(layerInfos[i].layer)) {
                                    stats.skippedIndexDependent++;
                                    skippedLayers.push({ layer: layerInfos[i].layer, index: layerInfos[i].index, reason: getLocalizedString("reasonIndex") });
                                } else {
                                    layersToReorder.push(layerInfos[i]);
                                }
                            }

                            updateStatus("statusReordering");
                            layersToReorder.sort(function(a, b) {
                                if (self.ui.reorderLayersCheck.value) {
                                    var typeIndexA = findIndex(self.layerTypeOrder, a.type);
                                    var typeIndexB = findIndex(self.layerTypeOrder, b.type);
                                    if (typeIndexA === typeIndexB) return a.startTime - b.startTime;
                                    return typeIndexA - typeIndexB;
                                } else { // reorderByTimeCheck
                                    return b.startTime - a.startTime;
                                }
                            });

                            for (var i = layersToReorder.length - 1; i >= 0; i--) {
                                layersToReorder[i].layer.moveToBeginning();
                            }
                            stats.reordered = layersToReorder.length;
                            updateStatus("statusReordered", [stats.reordered]);
                        }
                    }
                } else {
                    updateStatus("statusNoLayersLeft");
                }
                
                if (skippedLayers.length > 0) {
                    showSkippedLayersFeedback(skippedLayers);
                }

                var statusMessage = getLocalizedString("statusCompleted")
                    .replace("{0}", comp.numLayers).replace("{1}", stats.enabled - stats.deleted).replace("{2}", stats.disabled - stats.deleted)
                    .replace("{3}", stats.shapes).replace("{4}", stats.texts).replace("{5}", stats.solids)
                    .replace("{6}", stats.adjustments).replace("{7}", stats.comps).replace("{8}", stats.cameras);
                
                var actions = [];
                if (stats.renamed > 0) actions.push(getLocalizedString("statusRenamed").replace("{0}", stats.renamed));
                if (stats.colored > 0) actions.push(getLocalizedString("statusColored").replace("{0}", stats.colored));
                if (stats.deleted > 0) actions.push(getLocalizedString("statusDeleted").replace("{0}", stats.deleted));
                if (stats.reordered > 0) actions.push(getLocalizedString("statusReorderedAction").replace("{0}", stats.reordered));
                if (stats.skippedIndexDependent > 0) actions.push(getLocalizedString("statusIndexCancelled"));
                
                if (actions.length > 0) {
                    statusMessage += getLocalizedString("statusActions") + actions.join(" | ");
                }
                updateStatus(statusMessage);
                self.ui.progressBar.value = 100;
                
            } catch (err) {
                updateStatus("statusError" + err.toString());
                self.ui.progressBar.value = 0;
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
            self.ui.win.preferredSize.width = 20;
            
            setBgColor(self.ui.win, bgColor1);

            var headerGrp = self.ui.win.add("group");
            headerGrp.orientation = "row";
            headerGrp.alignChildren = ["fill", "center"];
            headerGrp.alignment = "fill";
            headerGrp.spacing = 10;

            var titleText = headerGrp.add("statictext", undefined, "Auto Layer Organizer");
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
            titleText.preferredSize.width = 0;
            
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
            self.ui.renameLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("renameLayersCheck"));
            self.ui.reorderLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersCheck"));
            self.ui.reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");
            self.ui.reorderByTimeCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderByTimeCheck"));
            self.ui.reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");
            self.ui.deleteHiddenCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("deleteHiddenCheck"));
            
            var mainBtnPanel = self.ui.win.add("group");
            mainBtnPanel.orientation = "row";
            mainBtnPanel.alignment = ["fill", "fill"];

            self.ui.organizeBtn = mainBtnPanel.add("button", undefined, getLocalizedString("automateBtn"));
            self.ui.organizeBtn.alignment = 'fill'; 
            self.ui.organizeBtn.preferredSize.height = 40;
            self.ui.organizeBtn.preferredSize.width = 200;
            self.ui.organizeBtn.onClick = function() { self.executeOrganize(); };
            
            var statusBar = self.ui.win.add("group");
            statusBar.orientation = "column";
            statusBar.alignment = ["fill", "center"];
            statusBar.spacing = 5;
            
            statusText = statusBar.add("statictext", undefined, getLocalizedString("statusWaiting")); 
            statusText.alignment = ["fill", "center"];
            
            progressBar = statusBar.add("progressbar", undefined, 0, 100); 
            progressBar.alignment = 'fill';
            
            self.ui.win.onResizing = self.ui.win.onResize = function() { if(this.layout) this.layout.resize(); };
            if (self.ui.win instanceof Window) { self.ui.win.center(); self.ui.win.show(); } else { self.ui.win.layout.layout(true); }
        }
    };
    
    // Globals for status updates
    var statusText, progressBar;

    LayersOrganizer.buildUI(this);
})();