// Auto Layer Organize Script para After Effects
// Versão 2.6.13 (Adicionado alerta para camadas não modificadas com ajustes de formatação)
// Compatível com ExtendScript do After Effects 2025 (ECMAScript 3)

function showWindow() {
    // --- INTERFACE GRÁFICA REDESENHADA USANDO O TEMA DGNEWS D9 TOOLS ---
    var win = new Window("palette", getLocalizedString("windowTitle"));
    win.spacing = 10;
    win.margins = 16;
    win.orientation = 'column';
    win.alignChildren = 'fill';
    
    setBgColor(win, bgColor1);

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    var title = headerGrp.add('statictext', undefined, 'Organizar Camadas:');
    title.alignment = 'left';
    setFgColor(title, normalColor1);
    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    var helpBtn = new themeIconButton(helpGrp, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });

    var optionsPanel = win.add("panel", undefined, getLocalizedString("optionsPanel"));
    optionsPanel.alignChildren = "left";
    setFgColor(optionsPanel, monoColor1);

    // Checkbox "Agrupar em Nulos" foi removida
    var applyColorsCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("applyColorsCheck"));
    applyColorsCheck.value = true;
    var renameLayersCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("renameLayersCheck"));
    renameLayersCheck.value = true;
    var reorderLayersCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersCheck"));
    reorderLayersCheck.value = true;
    var reorderLayersByTimeCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersByTimeCheck"));
    reorderLayersByTimeCheck.value = false;
    var deleteHiddenLayersCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("deleteHiddenLayersCheck"));
    deleteHiddenLayersCheck.value = false;
    
    var allChecks = [applyColorsCheck, renameLayersCheck, reorderLayersCheck, reorderLayersByTimeCheck, deleteHiddenLayersCheck];
    for (var i = 0; i < allChecks.length; i++) {
        setFgColor(allChecks[i], monoColor1);
    }
    
    // Grupo "Selecionar grupo" foi removido

    var btnGroup = win.add("group");
    btnGroup.alignment = "center";
    
    var settingsBtn = new themeButton(btnGroup, { width: 100, height: 32, labelTxt: "Config.", tips: [getLocalizedString("settingsBtnTip")]});
    var undoBtn = new themeButton(btnGroup, { width: 100, height: 32, labelTxt: getLocalizedString("undoBtn"), tips: [getLocalizedString("undoBtnTip")]});
    var automateBtn = new themeButton(btnGroup, { width: 120, height: 32, labelTxt: getLocalizedString("automateBtn"), tips: ['Aplica a organização na comp ativa.'], textColor: bgColor1, buttonColor: normalColor1});

    // --- CONECTANDO EVENTOS À LÓGICA ORIGINAL ---
    settingsBtn.leftClick.onClick = function() {
        showSettingsWindow();
    };

    automateBtn.leftClick.onClick = function() {
        // Objeto de opções atualizado sem as propriedades removidas
        var options = {
            applyColors: applyColorsCheck.value,
            renameLayers: renameLayersCheck.value,
            reorderLayers: reorderLayersCheck.value,
            groupLayers: false, // Desativado permanentemente
            reorderLayersByTime: reorderLayersByTimeCheck.value,
            deleteHiddenLayers: deleteHiddenLayersCheck.value,
            groupSelection: "All" // Assume "All" já que a seleção foi removida
        };
        if (!automateOrganization(options)) {
            if (undoStack.length > 0) undoStack.pop();
        }
    };

    undoBtn.leftClick.onClick = function() {
        undoLastAction();
    };
    
    helpBtn.leftClick.onClick = function() {
        alert("Esta ferramenta automatiza a organização das camadas na sua composição.\n\n- Marque as opções desejadas.\n- Clique em 'EXECUTAR' para aplicar as mudanças.\n- O botão '↩' desfaz a última organização feita pelo script.");
    }

    win.center();
    win.show();
}



(function() {
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

    var win = new Window("palette", getLocalizedString("windowTitle"), undefined);
    win.orientation = "column";
    win.spacing = 15;
    win.margins = 15;
    win.preferredSize.width = 250;
    
    var btnPanel = win.add("group");
    btnPanel.orientation = "row";
    btnPanel.spacing = 4;
    btnPanel.alignment = ["fill", "top"];
    
    var organizeBtn = btnPanel.add("button", undefined, getLocalizedString("automateBtn"));
    organizeBtn.preferredSize = [120, 25];
    
    var undoBtn = btnPanel.add("button", undefined, getLocalizedString("undoBtn"));
    undoBtn.preferredSize = [25, 25];
    undoBtn.helpTip = getLocalizedString("undoBtnTip");
    
    var secondaryGroup = btnPanel.add("group");
    secondaryGroup.spacing = 2;
    var settingsBtn = secondaryGroup.add("button", undefined, "⚙️");
    settingsBtn.preferredSize = [25, 25];
    settingsBtn.helpTip = getLocalizedString("settingsBtnTip");
    
    var copyrightText = secondaryGroup.add("statictext", undefined, "©D9R");
    copyrightText.alignment = ["right", "center"];
    
    var optionsPanel = win.add("panel", undefined, getLocalizedString("optionsPanel"), {borderStyle: "etched"});
    optionsPanel.orientation = "column";
    optionsPanel.alignment = ["fill", "top"];
    optionsPanel.alignChildren = ["left", "top"];
    optionsPanel.margins = 8;
    optionsPanel.spacing = 4;
    
    var applyColorsCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("applyColorsCheck"));
    applyColorsCheck.value = false;
    
    var renameLayersCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("renameLayersCheck"));
    renameLayersCheck.value = false;
    
    var reorderLayersCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersCheck"));
    reorderLayersCheck.value = false;
    reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");
    
    var reorderByTimeCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("reorderByTimeCheck"));
    reorderByTimeCheck.value = false;
    reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");
    
    var deleteHiddenCheck = optionsPanel.add("checkbox", undefined, getLocalizedString("deleteHiddenCheck"));
    deleteHiddenCheck.value = false;
    
    var statusBar = win.add("group");
    statusBar.orientation = "column";
    statusBar.alignment = ["fill", "center"];
    statusBar.spacing = 5;
    
    var statusText = statusBar.add("statictext", undefined, getLocalizedString("statusWaiting"));
    statusText.alignment = ["fill", "center"];
    
    var progressBar = statusBar.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize = [210, 5];
    
    var layerColorIndices = {
        "ShapeLayer": 8, "TextLayer": 1, "SolidLayer": 14, "AdjustmentLayer": 2,
        "CompItem": 12, "CameraLayer": 2, "NullLayer": 2, "VideoLayer": 14, "ImageLayer": 11
    };
    
    var layerTypeOrder = ["AdjustmentLayer", "CameraLayer", "NullLayer", "TextLayer", "ShapeLayer",
                          "SolidLayer", "ImageLayer", "CompItem", "VideoLayer"];
    
    var colorNames = {
        PT: ["Nenhuma", "Vermelho", "Amarelo", "Aqua", "Rosa", "Lavanda", "Pêssego",
             "Verde Água", "Azul", "Verde", "Roxo", "Laranja", "Marrom", "Fúcsia", "Ciano", "Arenito"],
        EN: ["None", "Red", "Yellow", "Aqua", "Pink", "Lavender", "Peach",
             "Teal", "Blue", "Green", "Purple", "Orange", "Brown", "Fuchsia", "Cyan", "Sandstone"]
    };
    
    var layerTypeDisplayNames = {
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
    };

    var colorPreviews = [
        [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 1], [1, 0.41, 0.71], [0.9, 0.9, 0.98],
        [1, 0.85, 0.73], [0, 0.5, 0.5], [0, 0, 1], [0, 1, 0], [0.5, 0, 0.5], [1, 0.65, 0],
        [0.65, 0.16, 0.16], [1, 0, 1], [0, 1, 1], [0.96, 0.96, 0.86]
    ];

    var isProcessing = false;
    
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
                if (otherLayer !== layer && otherLayer.hasTrackMatte && otherLayer.trackMatteLayer === layer) {
                    debugLog("Layer " + layer.name + " é track matte para " + otherLayer.name);
                    return true;
                }
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
        popup.preferredSize = [300, Math.min(150 + skippedLayers.length * 50, 400)]; // Largura reduzida de 350 para 300
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
    
    settingsBtn.onClick = function() {
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
                var label = prefixGroup.add("statictext", undefined, layerTypeDisplayNames[config.language][layerType] + ":");
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
            for (var layerType in layerColorIndices) {
                var group = colorsTab.add("group");
                group.orientation = "row";
                group.spacing = 4;
                group.alignChildren = ["center", "center"];
                var label = group.add("statictext", undefined, layerTypeDisplayNames[config.language][layerType] + ":");
                label.preferredSize = [60, 20];
                label.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
                var preview = group.add("group");
                preview.preferredSize = [10, 10];
                var colorIndex = layerColorIndices[layerType];
                var initialColor = colorPreviews[colorIndex];
                preview.graphics.backgroundColor = preview.graphics.newBrush(preview.graphics.BrushType.SOLID_COLOR, 
                    [initialColor[0], initialColor[1], initialColor[2], 1]);
                var dropdown = group.add("dropdownlist", undefined, colorNames[config.language]);
                dropdown.selection = (colorIndex >= 0 && colorIndex < colorNames[config.language].length) ? colorIndex : 0;
                dropdown.preferredSize = [80, 20];
                colorDropdowns[layerType] = dropdown;

                dropdown.onChange = (function(preview) {
                    return function() {
                        var idx = this.selection.index;
                        var newColor = colorPreviews[idx];
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
                        logMessage += layerTypeDisplayNames[config.language][layerType] + ": '" + oldPrefix + "' -> '" + config.prefixes[layerType] + "'\n";
                    }
                }

                for (var layerType in colorDropdowns) {
                    var oldColorIndex = layerColorIndices[layerType];
                    var newColorIndex = colorDropdowns[layerType].selection.index;
                    layerColorIndices[layerType] = newColorIndex;
                    if (oldColorIndex !== newColorIndex) {
                        logMessage += layerTypeDisplayNames[config.language][layerType] + " cor: " + 
                                    colorNames[config.language][oldColorIndex] + " -> " + colorNames[config.language][newColorIndex] + "\n";
                    }
                }

                updateStatus("statusSettingsSaved");
                logMessage += "Salvo com sucesso!";
                settingsWin.close();
                win.title = getLocalizedString("windowTitle");
                organizeBtn.text = getLocalizedString("automateBtn");
                undoBtn.text = getLocalizedString("undoBtn");
                undoBtn.helpTip = getLocalizedString("undoBtnTip");
                settingsBtn.helpTip = getLocalizedString("settingsBtnTip");
                optionsPanel.title = getLocalizedString("optionsPanel");
                applyColorsCheck.text = getLocalizedString("applyColorsCheck");
                renameLayersCheck.text = getLocalizedString("renameLayersCheck");
                reorderLayersCheck.text = getLocalizedString("reorderLayersCheck");
                reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");
                reorderByTimeCheck.text = getLocalizedString("reorderByTimeCheck");
                reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");
                deleteHiddenCheck.text = getLocalizedString("deleteHiddenCheck");
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
    };
    
    organizeBtn.onClick = function() {
        var logMessage = "Organização iniciada em: " + new Date().toLocaleString() + "\n";
        if (isProcessing) {
            debugLog("Processamento já em andamento");
            logMessage += "Já em andamento - ignorado.";
            return;
        }

        // Verifica se alguma ação está ativa
        if (!applyColorsCheck.value && !renameLayersCheck.value && !reorderLayersCheck.value && 
            !reorderByTimeCheck.value && !deleteHiddenCheck.value) {
            updateStatus("statusNoActions");
            debugLog("Nenhuma ação selecionada");
            logMessage += "Erro: Nenhuma ação selecionada.";
            return;
        }

        isProcessing = true;
        updateStatus("statusStarting");
        organizeBtn.enabled = false;
        undoBtn.enabled = false;
        settingsBtn.enabled = false;
        
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

            if (deleteHiddenCheck.value) {
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
                        if (renameLayersCheck.value && layer.name !== newName) {
                            layer.name = newName;
                            stats.renamed++;
                        }
                        if (applyColorsCheck.value && layerColorIndices[layerType] !== undefined) {
                            if (setLayerColor(layer, layerColorIndices[layerType])) stats.colored++;
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
                if ((reorderLayersCheck.value || reorderByTimeCheck.value) && layerInfos.length > 0) {
                    // Verifica conflito de opções de reordenação
                    if (reorderLayersCheck.value && reorderByTimeCheck.value) {
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
                        if (reorderLayersCheck.value) {
                            // Reordena por tipo, mantendo ordem temporal original dentro do tipo
                            var typeIndexA = findIndex(layerTypeOrder, a.type);
                            var typeIndexB = findIndex(layerTypeOrder, b.type);
                            if (typeIndexA === typeIndexB) return a.startTime - b.startTime || a.index - b.index;
                            if (typeIndexA === -1) typeIndexA = 999;
                            if (typeIndexB === -1) typeIndexB = 999;
                            return typeIndexA - typeIndexB;
                        } else if (reorderByTimeCheck.value) {
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
            if (renameLayersCheck.value || applyColorsCheck.value || deleteHiddenCheck.value || reorderLayersCheck.value || reorderByTimeCheck.value) {
                statusMessage += getLocalizedString("statusActions");
                var actions = [];
                if (renameLayersCheck.value) actions.push(getLocalizedString("statusRenamed").replace("{0}", stats.renamed));
                if (applyColorsCheck.value) actions.push(getLocalizedString("statusColored").replace("{0}", stats.colored));
                if (deleteHiddenCheck.value) actions.push(getLocalizedString("statusDeleted").replace("{0}", stats.deleted));
                if ((reorderLayersCheck.value || reorderByTimeCheck.value)) {
                    if (stats.reordered > 0) actions.push(getLocalizedString("statusReorderedAction").replace("{0}", stats.reordered));
                    if (stats.skippedIndexDependent > 0) actions.push(getLocalizedString("statusIndexCancelled"));
                }
                statusMessage += actions.join(" | ");
            }
            updateStatus(statusMessage);
            progressBar.value = 100;
            logMessage += "Resultado:\n" + statusMessage;
        } catch (err) {
            debugLog("ERRO: " + err.toString() + "\nLinha: " + err.line);
            updateStatus("statusError" + err.toString());
            progressBar.value = 0;
            logMessage += "Erro: " + err.toString() + " (Linha: " + err.line + ")";
        } finally {
            isProcessing = false;
            organizeBtn.enabled = true;
            undoBtn.enabled = true;
            settingsBtn.enabled = true;
            app.endUndoGroup();
            logMessage += "\nFinalizado em: " + new Date().toLocaleString();
        }
    };
    
    undoBtn.onClick = function() {
        undoLastAction();
    };
    
    function isTextLayer(layer) {
        try {
            return layer.property("ADBE Text Properties") !== null;
        } catch (e) {
            debugLog("Erro ao verificar text layer: " + e.toString());
            return false;
        }
    }
    
    function isShapeLayer(layer) {
        try {
            return layer.property("ADBE Root Vectors Group") !== null;
        } catch (e) {
            debugLog("Erro ao verificar shape layer: " + e.toString());
            return false;
        }
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
    
    win.center();
    win.show();
    debugLog("UI inicializada com sucesso");
})();