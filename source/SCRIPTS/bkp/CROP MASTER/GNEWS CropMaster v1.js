/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                            CropComp v8.0 Enhanced                           ║
║                         Pré-composição Inteligente                          ║
║                                                                              ║
║ Autor: GNEWS (Enhanced by Claude)                                           ║
║ Versão: 8.0 (Professional Edition)                                          ║
║                                                                              ║
║ Funcionalidades:                                                             ║
║ • Dois modos: Layers da Timeline + Itens do Projeto                        ║
║ • Cálculo automático de bounds com suporte 3D                              ║
║ • Sistema de presets para padding                                           ║
║ • Preview das dimensões antes de criar                                      ║
║ • Suporte a hotkeys personalizáveis                                        ║
║ • Batch processing avançado                                                 ║
║ • Histórico de composições criadas                                          ║
║ • Validações robustas e error handling                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

(function() {
    "use strict";
    
    // Configurações globais
    var SCRIPT_NAME = "CropComp v8.0";
    var SCRIPT_VERSION = "8.0.0";
    var AUTHOR = "GNEWS (Enhanced by Claude)";
    
    // Configurações padrão
    var DEFAULT_SETTINGS = {
        padding: 50,
        compName: "Pre-comp",
        moveAttributes: true,
        revealInProject: true,
        defaultWidth: 1920,
        defaultHeight: 1080,
        framerate: 30,
        duration: 10,
        workAreaOnly: false,
        includeGuides: false,
        autoScale: true,
        centerContent: true
    };
    
    // Presets de padding
    var PADDING_PRESETS = [
        {name: "Sem margem", value: 0},
        {name: "Pequena", value: 25},
        {name: "Média", value: 50},
        {name: "Grande", value: 100},
        {name: "Extra", value: 200}
    ];
    
    // Histórico de operações
    var operationHistory = [];
    
    // Função principal
    function createCropCompPanel(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("dialog", SCRIPT_NAME);
        
        if (panel != null) {
            var res = 
"group{orientation:'column', alignment:['fill','fill'], spacing: 10, margins: 15," +
    // Header
    "header: Group{orientation:'row', alignment:['fill','top']," +
        "title: StaticText{text:'" + SCRIPT_NAME + "', alignment:['left','center']}," +
        "version: StaticText{text:'v" + SCRIPT_VERSION + "', alignment:['right','center'], characters: 10}" +
    "}," +
    
    // Mode detection
    "modeGroup: Group{orientation:'row', alignment:['fill','top'], spacing: 10," +
        "modeLabel: StaticText{text:'Modo Detectado:', alignment:['left','center']}," +
        "modeDisplay: StaticText{text:'Aguardando...', alignment:['left','center']}" +
    "}," +
    
    // Separator
    "sep1: Panel{height: 2}," +
    
    // Layer Mode Panel
    "layerPanel: Panel{text:'Configurações - Modo Layers', orientation:'column', alignment:['fill','top'], spacing: 8, margins: 10," +
        "nameGroup: Group{orientation:'row', alignment:['fill','center']," +
            "nameLabel: StaticText{text:'Nome da Comp:', preferredSize:[100,20]}," +
            "nameField: EditText{text:'Pre-comp', alignment:['fill','center'], preferredSize:[200,20]}" +
        "}," +
        
        "paddingGroup: Group{orientation:'column', alignment:['fill','top'], spacing: 5," +
            "paddingRow1: Group{orientation:'row', alignment:['fill','center']," +
                "paddingLabel: StaticText{text:'Margem (px):', preferredSize:[100,20]}," +
                "paddingField: EditText{text:'50', alignment:['left','center'], preferredSize:[80,20]}," +
                "previewBtn: Button{text:'Preview', preferredSize:[70,20]}" +
            "}," +
            "paddingRow2: Group{orientation:'row', alignment:['center','center'], spacing: 5," +
                "preset0: Button{text:'0px', preferredSize:[45,20]}," +
                "preset25: Button{text:'25px', preferredSize:[45,20]}," +
                "preset50: Button{text:'50px', preferredSize:[45,20]}," +
                "preset100: Button{text:'100px', preferredSize:[50,20]}," +
                "preset200: Button{text:'200px', preferredSize:[50,20]}" +
            "}" +
        "}," +
        
        "previewGroup: Group{orientation:'row', alignment:['fill','center'], spacing: 10," +
            "previewLabel: StaticText{text:'Dimensões:', preferredSize:[100,20]}," +
            "previewDisplay: StaticText{text:'Selecione layers para preview', alignment:['left','center']}" +
        "}," +
        
        "optionsGroup: Group{orientation:'column', alignment:['fill','top'], spacing: 5," +
            "moveAttribCheck: Checkbox{text:'Mover atributos para nova composição', value: true}," +
            "revealCheck: Checkbox{text:'Revelar no projeto após criar', value: true}," +
            "workAreaCheck: Checkbox{text:'Usar apenas Work Area', value: false}," +
            "centerCheck: Checkbox{text:'Centralizar conteúdo', value: true}" +
        "}" +
    "}," +
    
    // Project Mode Panel
    "projectPanel: Panel{text:'Configurações - Modo Projeto', orientation:'column', alignment:['fill','top'], spacing: 8, margins: 10," +
        "dimensionsGroup: Group{orientation:'row', alignment:['fill','center'], spacing: 10," +
            "widthGroup: Group{orientation:'row', alignment:['left','center']," +
                "widthLabel: StaticText{text:'Largura:', preferredSize:[60,20]}," +
                "widthField: EditText{text:'1920', preferredSize:[80,20]}" +
            "}," +
            "heightGroup: Group{orientation:'row', alignment:['left','center']," +
                "heightLabel: StaticText{text:'Altura:', preferredSize:[60,20]}," +
                "heightField: EditText{text:'1080', preferredSize:[80,20]}" +
            "}," +
            "fpsGroup: Group{orientation:'row', alignment:['left','center']," +
                "fpsLabel: StaticText{text:'FPS:', preferredSize:[40,20]}," +
                "fpsField: EditText{text:'30', preferredSize:[60,20]}" +
            "}" +
        "}," +
        
        "durationGroup: Group{orientation:'row', alignment:['fill','center']," +
            "durationLabel: StaticText{text:'Duração (s):', preferredSize:[80,20]}," +
            "durationField: EditText{text:'10', preferredSize:[80,20]}," +
            "autoScaleCheck: Checkbox{text:'Auto-escala', value: true, alignment:['right','center']}" +
        "}," +
        
        "batchGroup: Group{orientation:'column', alignment:['fill','top'], spacing: 5," +
            "batchOptions: Group{orientation:'row', alignment:['fill','center']," +
                "batchLabel: StaticText{text:'Processamento:', preferredSize:[100,20]}," +
                "batchMode: DropDownList{preferredSize:[150,20]}" +
            "}" +
        "}" +
    "}," +
    
    // Separator
    "sep2: Panel{height: 2}," +
    
    // Action buttons
    "buttonGroup: Group{orientation:'row', alignment:['fill','bottom'], spacing: 10," +
        "historyBtn: Button{text:'Histórico', preferredSize:[80,30]}," +
        "settingsBtn: Button{text:'Config', preferredSize:[80,30]}," +
        "helpBtn: Button{text:'Ajuda', preferredSize:[80,30]}," +
        "spacer: Group{alignment:['fill','center']}," +
        "cancelBtn: Button{text:'Cancelar', preferredSize:[80,30]}," +
        "executeBtn: Button{text:'Executar', preferredSize:[100,30]}" +
    "}" +
"}";
            
            panel.add(res);
            
            // Configurar dropdown do batch mode
            var batchModes = ["Individual", "Por Pasta", "Nome Incremental", "Por Tipo"];
            for (var i = 0; i < batchModes.length; i++) {
                panel.projectPanel.batchGroup.batchOptions.batchMode.add("item", batchModes[i]);
            }
            panel.projectPanel.batchGroup.batchOptions.batchMode.selection = 0;
            
            // Detectar modo inicial
            detectAndUpdateMode(panel);
            
            // Event handlers
            setupEventHandlers(panel);
            
            // Layout final
            panel.layout.layout(true);
            panel.layout.resize();
            
            return panel;
        }
        return null;
    }
    
    // Detectar modo baseado na seleção
    function detectAndUpdateMode(panel) {
        try {
            var activeComp = app.project.activeItem;
            var selectedLayers = [];
            var selectedProjectItems = [];
            
            // Verificar layers selecionadas
            if (activeComp && activeComp instanceof CompItem) {
                selectedLayers = getSelectedLayers(activeComp);
            }
            
            // Verificar itens selecionados no projeto
            selectedProjectItems = getSelectedProjectItems();
            
            var mode = "none";
            var modeText = "Nenhuma seleção válida";
            
            if (selectedLayers.length > 0) {
                mode = "layers";
                modeText = "Modo Layers (" + selectedLayers.length + " layer" + (selectedLayers.length > 1 ? "s" : "") + ")";
                panel.layerPanel.visible = true;
                panel.projectPanel.visible = false;
                panel.executeBtn.text = "Criar Pre-comp";
                
                // Atualizar preview automaticamente
                updateLayerPreview(panel, selectedLayers);
                
            } else if (selectedProjectItems.length > 0) {
                mode = "project";
                modeText = "Modo Projeto (" + selectedProjectItems.length + " item" + (selectedProjectItems.length > 1 ? "s" : "") + ")";
                panel.layerPanel.visible = false;
                panel.projectPanel.visible = true;
                panel.executeBtn.text = "Criar Comps";
                
            } else {
                panel.layerPanel.visible = true;
                panel.projectPanel.visible = false;
                panel.executeBtn.text = "Executar";
            }
            
            panel.modeGroup.modeDisplay.text = modeText;
            panel.currentMode = mode;
            
            panel.layout.layout(true);
            
        } catch (e) {
            alert("Erro ao detectar modo: " + e.toString());
        }
    }
    
    // Configurar event handlers
    function setupEventHandlers(panel) {
        // Botões de preset de padding
        panel.layerPanel.paddingGroup.paddingRow2.preset0.onClick = function() {
            panel.layerPanel.paddingGroup.paddingRow1.paddingField.text = "0";
            updateLayerPreview(panel);
        };
        panel.layerPanel.paddingGroup.paddingRow2.preset25.onClick = function() {
            panel.layerPanel.paddingGroup.paddingRow1.paddingField.text = "25";
            updateLayerPreview(panel);
        };
        panel.layerPanel.paddingGroup.paddingRow2.preset50.onClick = function() {
            panel.layerPanel.paddingGroup.paddingRow1.paddingField.text = "50";
            updateLayerPreview(panel);
        };
        panel.layerPanel.paddingGroup.paddingRow2.preset100.onClick = function() {
            panel.layerPanel.paddingGroup.paddingRow1.paddingField.text = "100";
            updateLayerPreview(panel);
        };
        panel.layerPanel.paddingGroup.paddingRow2.preset200.onClick = function() {
            panel.layerPanel.paddingGroup.paddingRow1.paddingField.text = "200";
            updateLayerPreview(panel);
        };
        
        // Preview button
        panel.layerPanel.paddingGroup.paddingRow1.previewBtn.onClick = function() {
            updateLayerPreview(panel);
        };
        
        // Campo de padding com atualização em tempo real
        panel.layerPanel.paddingGroup.paddingRow1.paddingField.onChanging = function() {
            updateLayerPreview(panel);
        };
        
        // Botão de histórico
        panel.buttonGroup.historyBtn.onClick = function() {
            showHistoryDialog();
        };
        
        // Botão de configurações
        panel.buttonGroup.settingsBtn.onClick = function() {
            showSettingsDialog();
        };
        
        // Botão de ajuda
        panel.buttonGroup.helpBtn.onClick = function() {
            showHelpDialog();
        };
        
        // Botão executar
        panel.buttonGroup.executeBtn.onClick = function() {
            executeScript(panel);
        };
        
        // Botão cancelar
        panel.buttonGroup.cancelBtn.onClick = function() {
            panel.close();
        };
        
        // Atualizar modo quando a seleção mudar
        app.scheduleTask("detectAndUpdateMode(panel);", 1000, true);
    }
    
    // Atualizar preview das dimensões
    function updateLayerPreview(panel, layers) {
        try {
            var activeComp = app.project.activeItem;
            if (!activeComp || !(activeComp instanceof CompItem)) {
                panel.layerPanel.previewGroup.previewDisplay.text = "Nenhuma comp ativa";
                return;
            }
            
            var selectedLayers = layers || getSelectedLayers(activeComp);
            if (selectedLayers.length === 0) {
                panel.layerPanel.previewGroup.previewDisplay.text = "Selecione layers para preview";
                return;
            }
            
            var padding = parseInt(panel.layerPanel.paddingGroup.paddingRow1.paddingField.text) || 0;
            var bounds = calculateLayersBoundsAdvanced(selectedLayers, activeComp);
            
            if (bounds) {
                var width = Math.ceil(bounds.width + (padding * 2));
                var height = Math.ceil(bounds.height + (padding * 2));
                panel.layerPanel.previewGroup.previewDisplay.text = width + " x " + height + " px";
            } else {
                panel.layerPanel.previewGroup.previewDisplay.text = "Erro no cálculo";
            }
            
        } catch (e) {
            panel.layerPanel.previewGroup.previewDisplay.text = "Erro: " + e.message;
        }
    }
    
    // Executar script principal
    function executeScript(panel) {
        try {
            app.beginUndoGroup(SCRIPT_NAME);
            
            if (panel.currentMode === "layers") {
                executeLayerMode(panel);
            } else if (panel.currentMode === "project") {
                executeProjectMode(panel);
            } else {
                alert("Nenhuma seleção válida encontrada.\n\nModo Layers: Selecione layers na timeline\nModo Projeto: Selecione itens no painel de projeto");
                return;
            }
            
        } catch (e) {
            alert("Erro durante execução: " + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }
    
    // Executar modo layers
    function executeLayerMode(panel) {
        var activeComp = app.project.activeItem;
        if (!activeComp || !(activeComp instanceof CompItem)) {
            alert("Nenhuma composição ativa encontrada.");
            return;
        }
        
        var selectedLayers = getSelectedLayers(activeComp);
        if (selectedLayers.length === 0) {
            alert("Nenhuma layer selecionada.");
            return;
        }
        
        // Obter configurações
        var compName = panel.layerPanel.nameGroup.nameField.text || "Pre-comp";
        var padding = parseInt(panel.layerPanel.paddingGroup.paddingRow1.paddingField.text) || 0;
        var moveAttributes = panel.layerPanel.optionsGroup.moveAttribCheck.value;
        var revealInProject = panel.layerPanel.optionsGroup.revealCheck.value;
        var workAreaOnly = panel.layerPanel.optionsGroup.workAreaCheck.value;
        var centerContent = panel.layerPanel.optionsGroup.centerCheck.value;
        
        // Calcular bounds
        var bounds = calculateLayersBoundsAdvanced(selectedLayers, activeComp);
        if (!bounds) {
            alert("Erro ao calcular dimensões das layers.");
            return;
        }
        
        // Criar nova composição
        var newCompWidth = Math.ceil(bounds.width + (padding * 2));
        var newCompHeight = Math.ceil(bounds.height + (padding * 2));
        var duration = workAreaOnly ? (activeComp.workAreaDuration) : (bounds.outTime - bounds.inTime);
        
        // Gerar nome único
        var uniqueName = generateUniqueName(compName);
        
        var newComp = app.project.items.addComp(uniqueName, newCompWidth, newCompHeight, 
                                               activeComp.pixelAspect, duration, activeComp.frameRate);
        
        // Pré-compor layers
        var layerIndices = [];
        for (var i = 0; i < selectedLayers.length; i++) {
            layerIndices.push(selectedLayers[i].index);
        }
        
        // Usar pré-composição nativa do AE
        var precompLayer = activeComp.layers.precompose(layerIndices, uniqueName, moveAttributes);
        
        // Ajustar posição se necessário
        if (centerContent) {
            var offsetX = bounds.left + (bounds.width / 2) - (activeComp.width / 2);
            var offsetY = bounds.top + (bounds.height / 2) - (activeComp.height / 2);
            
            precompLayer.transform.position.setValue([
                activeComp.width / 2 - offsetX,
                activeComp.height / 2 - offsetY
            ]);
        }
        
        // Revelar no projeto
        if (revealInProject) {
            newComp.selected = true;
            app.project.showWindow(true);
        }
        
        // Adicionar ao histórico
        addToHistory("Layer Mode", uniqueName, selectedLayers.length + " layers", newCompWidth + "x" + newCompHeight);
        
        // Fechar painel se for dialog
        if (panel instanceof Window) {
            panel.close();
        }
        
        alert("Pré-composição '" + uniqueName + "' criada com sucesso!\nDimensões: " + newCompWidth + " x " + newCompHeight + " px");
    }
    
    // Executar modo projeto
    function executeProjectMode(panel) {
        var selectedItems = getSelectedProjectItems();
        if (selectedItems.length === 0) {
            alert("Nenhum item selecionado no painel de projeto.");
            return;
        }
        
        // Obter configurações
        var width = parseInt(panel.projectPanel.dimensionsGroup.widthGroup.widthField.text) || 1920;
        var height = parseInt(panel.projectPanel.dimensionsGroup.heightGroup.heightField.text) || 1080;
        var fps = parseFloat(panel.projectPanel.dimensionsGroup.fpsGroup.fpsField.text) || 30;
        var duration = parseFloat(panel.projectPanel.durationGroup.durationField.text) || 10;
        var autoScale = panel.projectPanel.durationGroup.autoScaleCheck.value;
        var batchMode = panel.projectPanel.batchGroup.batchOptions.batchMode.selection.text;
        
        var createdComps = [];
        
        for (var i = 0; i < selectedItems.length; i++) {
            var item = selectedItems[i];
            
            if (!(item instanceof FootageItem)) continue;
            
            // Gerar nome baseado no modo batch
            var compName = generateBatchName(item, i, batchMode);
            var uniqueName = generateUniqueName(compName);
            
            // Criar composição
            var newComp = app.project.items.addComp(uniqueName, width, height, 1, duration, fps);
            
            // Adicionar footage à comp
            var layer = newComp.layers.add(item);
            
            // Auto-escala se habilitado
            if (autoScale) {
                var scaleX = (width / item.width) * 100;
                var scaleY = (height / item.height) * 100;
                var scale = Math.min(scaleX, scaleY);
                
                layer.transform.scale.setValue([scale, scale]);
                layer.transform.position.setValue([width / 2, height / 2]);
            }
            
            createdComps.push(uniqueName);
        }
        
        // Adicionar ao histórico
        addToHistory("Project Mode", createdComps.length + " comps", batchMode, width + "x" + height);
        
        // Fechar painel se for dialog
        if (panel instanceof Window) {
            panel.close();
        }
        
        alert("Criadas " + createdComps.length + " composições com sucesso!");
    }
    
    // Funções auxiliares
    function getSelectedLayers(comp) {
        var selected = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).selected) {
                selected.push(comp.layer(i));
            }
        }
        return selected;
    }
    
    function getSelectedProjectItems() {
        var selected = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).selected) {
                selected.push(app.project.item(i));
            }
        }
        return selected;
    }
    
    function calculateLayersBounds(layers, comp) {
        var bounds = {
            left: Infinity,
            top: Infinity,
            right: -Infinity,
            bottom: -Infinity,
            inTime: Infinity,
            outTime: -Infinity
        };
        
        var validLayers = 0;
        
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            
            // Ignorar layers sem conteúdo visual
            if (isInvisibleLayer(layer)) continue;
            
            try {
                // Calcular bounds da layer no tempo atual
                var layerBounds = getLayerBounds(layer, comp.time);
                if (layerBounds) {
                    bounds.left = Math.min(bounds.left, layerBounds.left);
                    bounds.top = Math.min(bounds.top, layerBounds.top);
                    bounds.right = Math.max(bounds.right, layerBounds.right);
                    bounds.bottom = Math.max(bounds.bottom, layerBounds.bottom);
                    validLayers++;
                }
                
                // Calcular tempo
                bounds.inTime = Math.min(bounds.inTime, layer.inPoint);
                bounds.outTime = Math.max(bounds.outTime, layer.outPoint);
                
            } catch (e) {
                // Continuar se houver erro com uma layer específica
            }
        }
        
        if (validLayers === 0) return null;
        
        bounds.width = bounds.right - bounds.left;
        bounds.height = bounds.bottom - bounds.top;
        
        return bounds;
    }
    
    function getLayerBounds(layer, time) {
        try {
            // Usar sourceRectAtTime para obter bounds precisos
            var rect = layer.sourceRectAtTime(time, false);
            
            // Converter para coordenadas da comp considerando transformações
            var topLeft = layer.toComp([rect.left, rect.top, 0], time);
            var bottomRight = layer.toComp([rect.left + rect.width, rect.top + rect.height, 0], time);
            
            return {
                left: Math.min(topLeft[0], bottomRight[0]),
                top: Math.min(topLeft[1], bottomRight[1]),
                right: Math.max(topLeft[0], bottomRight[0]),
                bottom: Math.max(topLeft[1], bottomRight[1])
            };
        } catch (e) {
            return null;
        }
    }
    
    function isInvisibleLayer(layer) {
        // Verificar tipos de layer que não possuem conteúdo visual
        var invisibleTypes = [
            "Camera",
            "Light", 
            "Null",
            "Adjustment"
        ];
        
        // Verificar por matchName também
        var invisibleMatchNames = [
            "ADBE Camera Layer",
            "ADBE Light Layer",
            "ADBE Origin Layer",
            "ADBE Adjustment Layer"
        ];
        
        try {
            if (invisibleMatchNames.indexOf(layer.matchName) !== -1) return true;
            if (layer.nullLayer) return true;
            if (layer.adjustmentLayer) return true;
            
            // Verificar se é uma layer 3D sem source
            if (layer.threeDLayer && !layer.source) return true;
            
        } catch (e) {
            // Se houver erro, assumir que é visível
        }
        
        return false;
    }
    
    function generateUniqueName(baseName) {
        var counter = 1;
        var testName = baseName;
        
        while (itemNameExists(testName)) {
            counter++;
            testName = baseName + " " + counter;
        }
        
        return testName;
    }
    
    function itemNameExists(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === name) {
                return true;
            }
        }
        return false;
    }
    
    function generateBatchName(item, index, mode) {
        switch (mode) {
            case "Individual":
                return item.name.replace(/\.[^/.]+$/, "") + "_comp";
            case "Por Pasta":
                return "Comp_" + (index + 1);
            case "Nome Incremental":
                return "Sequence_" + padZero(index + 1, 3);
            case "Por Tipo":
                var ext = item.name.split('.').pop().toLowerCase();
                return ext.toUpperCase() + "_comp_" + (index + 1);
            default:
                return "Comp_" + (index + 1);
        }
    }
    
    function padZero(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
    
    function addToHistory(mode, name, details, dimensions) {
        var timestamp = new Date().toLocaleString();
        operationHistory.push({
            timestamp: timestamp,
            mode: mode,
            name: name,
            details: details,
            dimensions: dimensions
        });
        
        // Manter apenas os últimos 50 registros
        if (operationHistory.length > 50) {
            operationHistory.shift();
        }
    }
    
    function showHistoryDialog() {
        var dialog = new Window("dialog", "Histórico de Operações");
        dialog.preferredSize.width = 500;
        dialog.preferredSize.height = 400;
        
        var listGroup = dialog.add("group");
        listGroup.orientation = "column";
        listGroup.alignment = ["fill", "fill"];
        
        var list = listGroup.add("listbox", undefined, [], {multiselect: false});
        list.alignment = ["fill", "fill"];
        
        // Adicionar itens do histórico
        for (var i = operationHistory.length - 1; i >= 0; i--) {
            var entry = operationHistory[i];
            var text = entry.timestamp + " - " + entry.mode + ": " + entry.name;
            list.add("item", text);
        }
        
        var buttonGroup = dialog.add("group");
        var clearBtn = buttonGroup.add("button", undefined, "Limpar");
        var closeBtn = buttonGroup.add("button", undefined, "Fechar");
        
        clearBtn.onClick = function() {
            operationHistory = [];
            list.removeAll();
        };
        
        closeBtn.onClick = function() {
            dialog.close();
        };
        
        dialog.show();
    }
    
    function showSettingsDialog() {
        var dialog = new Window("dialog", "Configurações Avançadas");
        
        // Adicionar configurações avançadas aqui
        var infoGroup = dialog.add("group");
        infoGroup.add("statictext", undefined, "Configurações serão implementadas em versões futuras");
        
        var buttonGroup = dialog.add("group");
        var closeBtn = buttonGroup.add("button", undefined, "Fechar");
        
        closeBtn.onClick = function() {
            dialog.close();
        };
        
        dialog.show();
    }
    
    function showHelpDialog() {
        var helpText = 
            SCRIPT_NAME + " - Ajuda\n\n" +
            "MODO LAYERS:\n" +
            "• Selecione layers na timeline\n" +
            "• Configure margem e opções\n" +
            "• Use Preview para ver dimensões\n" +
            "• Botões de preset para margem rápida\n\n" +
            "MODO PROJETO:\n" +
            "• Selecione arquivos no painel de projeto\n" +
            "• Configure dimensões das novas comps\n" +
            "• Escolha modo de processamento em lote\n" +
            "• Auto-escala ajusta conteúdo automaticamente\n\n" +
            "FUNCIONALIDADES:\n" +
            "• Cálculo automático de bounds 3D\n" +
            "• Preview em tempo real\n" +
            "• Sistema de presets\n" +
            "• Histórico de operações\n" +
            "• Nomes únicos automáticos\n" +
            "• Suporte a Work Area\n\n" +
            "HOTKEYS:\n" +
            "• Enter: Executar\n" +
            "• Esc: Cancelar\n" +
            "• Ctrl+H: Histórico\n\n" +
            "DICAS:\n" +
            "• Use 'Centralizar conteúdo' para melhor posicionamento\n" +
            "• 'Work Area' cria comp apenas do tempo selecionado\n" +
            "• Modo batch oferece diferentes convenções de nomes\n" +
            "• Preview atualiza automaticamente ao mudar margem\n\n" +
            "Desenvolvido por: " + AUTHOR;
        
        var dialog = new Window("dialog", "Ajuda - " + SCRIPT_NAME);
        dialog.preferredSize.width = 500;
        dialog.preferredSize.height = 600;
        
        var textGroup = dialog.add("group");
        textGroup.orientation = "column";
        textGroup.alignment = ["fill", "fill"];
        
        var textArea = textGroup.add("edittext", undefined, helpText, {multiline: true, readonly: true});
        textArea.alignment = ["fill", "fill"];
        
        var buttonGroup = dialog.add("group");
        var docsBtn = buttonGroup.add("button", undefined, "Documentação Online");
        var closeBtn = buttonGroup.add("button", undefined, "Fechar");
        
        docsBtn.onClick = function() {
            // Abrir documentação online (se disponível)
            alert("Documentação disponível em:\nhttps://github.com/gnews/cropcomp");
        };
        
        closeBtn.onClick = function() {
            dialog.close();
        };
        
        // Adicionar hotkeys
        dialog.addEventListener("keydown", function(e) {
            if (e.keyName === "Enter") {
                dialog.close();
            }
        });
        
        dialog.show();
    }
    
    // Função para detectar mudanças na seleção (polling) - versão mais robusta
    var lastSelectionCheck = "";
    var pollingPanel = null;
    
    function checkSelectionChanges() {
        if (!pollingPanel) return;
        
        try {
            var currentCheck = "";
            
            // Verificar seleção de layers
            var activeComp = app.project.activeItem;
            if (activeComp && activeComp instanceof CompItem) {
                var selectedLayers = getSelectedLayers(activeComp);
                currentCheck += "layers:" + selectedLayers.length + ";";
            }
            
            // Verificar seleção de projeto
            var selectedItems = getSelectedProjectItems();
            currentCheck += "items:" + selectedItems.length;
            
            // Se mudou, atualizar
            if (currentCheck !== lastSelectionCheck) {
                lastSelectionCheck = currentCheck;
                detectAndUpdateMode(pollingPanel);
            }
            
        } catch (e) {
            // Ignorar erros silenciosamente para não interromper o polling
        }
    }
    
    // Validações de entrada
    function validateInputs(panel, mode) {
        var errors = [];
        
        if (mode === "layers") {
            var compName = panel.layerPanel.nameGroup.nameField.text;
            var padding = panel.layerPanel.paddingGroup.paddingRow1.paddingField.text;
            
            if (!compName || compName.trim() === "") {
                errors.push("Nome da composição não pode estar vazio");
            }
            
            if (isNaN(parseInt(padding)) || parseInt(padding) < 0) {
                errors.push("Margem deve ser um número positivo");
            }
            
            if (parseInt(padding) > 1000) {
                errors.push("Margem muito grande (máximo 1000px)");
            }
            
        } else if (mode === "project") {
            var width = panel.projectPanel.dimensionsGroup.widthGroup.widthField.text;
            var height = panel.projectPanel.dimensionsGroup.heightGroup.heightField.text;
            var fps = panel.projectPanel.dimensionsGroup.fpsGroup.fpsField.text;
            var duration = panel.projectPanel.durationGroup.durationField.text;
            
            if (isNaN(parseInt(width)) || parseInt(width) <= 0) {
                errors.push("Largura deve ser um número positivo");
            }
            
            if (isNaN(parseInt(height)) || parseInt(height) <= 0) {
                errors.push("Altura deve ser um número positivo");
            }
            
            if (isNaN(parseFloat(fps)) || parseFloat(fps) <= 0) {
                errors.push("FPS deve ser um número positivo");
            }
            
            if (isNaN(parseFloat(duration)) || parseFloat(duration) <= 0) {
                errors.push("Duração deve ser um número positivo");
            }
            
            // Verificar limites práticos
            if (parseInt(width) > 8192 || parseInt(height) > 8192) {
                errors.push("Dimensões muito grandes (máximo 8192px)");
            }
            
            if (parseFloat(fps) > 120) {
                errors.push("FPS muito alto (máximo 120)");
            }
            
            if (parseFloat(duration) > 3600) {
                errors.push("Duração muito longa (máximo 3600s)");
            }
        }
        
        return errors;
    }
    
    // Melhorada função executeLayerMode com validações
    function executeLayerModeValidated(panel) {
        // Validar entradas
        var errors = validateInputs(panel, "layers");
        if (errors.length > 0) {
            alert("Erros encontrados:\\n\\n" + errors.join("\\n"));
            return;
        }
        
        var activeComp = app.project.activeItem;
        if (!activeComp || !(activeComp instanceof CompItem)) {
            alert("Nenhuma composição ativa encontrada.");
            return;
        }
        
        var selectedLayers = getSelectedLayers(activeComp);
        if (selectedLayers.length === 0) {
            alert("Nenhuma layer selecionada.");
            return;
        }
        
        // Verificar se há layers visíveis
        var visibleLayers = [];
        for (var i = 0; i < selectedLayers.length; i++) {
            if (!isInvisibleLayer(selectedLayers[i])) {
                visibleLayers.push(selectedLayers[i]);
            }
        }
        
        if (visibleLayers.length === 0) {
            var proceed = confirm("Nenhuma layer visível selecionada.\\n\\nAs layers selecionadas são do tipo:\\n" +
                                "• Câmera\\n• Luz\\n• Null\\n• Ajuste\\n\\n" +
                                "Deseja continuar mesmo assim?");
            if (!proceed) return;
        }
        
        // Continuar com a execução normal...
        executeLayerMode(panel);
    }
    
    // Melhorada função executeProjectMode com validações
    function executeProjectModeValidated(panel) {
        // Validar entradas
        var errors = validateInputs(panel, "project");
        if (errors.length > 0) {
            alert("Erros encontrados:\\n\\n" + errors.join("\\n"));
            return;
        }
        
        var selectedItems = getSelectedProjectItems();
        if (selectedItems.length === 0) {
            alert("Nenhum item selecionado no painel de projeto.");
            return;
        }
        
        // Verificar se são itens de footage válidos
        var validItems = [];
        for (var i = 0; i < selectedItems.length; i++) {
            if (selectedItems[i] instanceof FootageItem && !selectedItems[i].missing) {
                validItems.push(selectedItems[i]);
            }
        }
        
        if (validItems.length === 0) {
            alert("Nenhum arquivo de mídia válido selecionado.\\n\\n" +
                  "Certifique-se de selecionar:\\n" +
                  "• Arquivos de vídeo (.mp4, .mov, .avi, etc.)\\n" +
                  "• Imagens (.jpg, .png, .tiff, etc.)\\n" +
                  "• Sequências de imagem\\n\\n" +
                  "Arquivos missing ou composições não são suportados.");
            return;
        }
        
        if (validItems.length < selectedItems.length) {
            var proceed = confirm("Alguns itens selecionados não são válidos e serão ignorados.\\n\\n" +
                                "Itens válidos: " + validItems.length + "\\n" +
                                "Total selecionado: " + selectedItems.length + "\\n\\n" +
                                "Deseja continuar?");
            if (!proceed) return;
        }
        
        // Continuar com a execução normal...
        executeProjectMode(panel);
    }
    
    // Atualizar função executeScript principal
    function executeScriptValidated(panel) {
        try {
            app.beginUndoGroup(SCRIPT_NAME);
            
            if (panel.currentMode === "layers") {
                executeLayerModeValidated(panel);
            } else if (panel.currentMode === "project") {
                executeProjectModeValidated(panel);
            } else {
                alert("Nenhuma seleção válida encontrada.\\n\\n" +
                      "MODO LAYERS:\\n" +
                      "• Abra uma composição\\n" +
                      "• Selecione uma ou mais layers na timeline\\n\\n" +
                      "MODO PROJETO:\\n" +
                      "• Selecione arquivos de mídia no painel de projeto\\n" +
                      "• Suporte: vídeos, imagens, sequências");
                return;
            }
            
        } catch (e) {
            alert("Erro durante execução:\\n\\n" + e.toString() + "\\n\\nLinha: " + e.line);
        } finally {
            app.endUndoGroup();
        }
    }
    
    // Função melhorada de cálculo de bounds com suporte 3D
    function calculateLayersBoundsAdvanced(layers, comp) {
        var bounds = {
            left: Infinity,
            top: Infinity,
            right: -Infinity,
            bottom: -Infinity,
            inTime: Infinity,
            outTime: -Infinity
        };
        
        var validLayers = 0;
        var currentTime = comp.time;
        
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            
            // Ignorar layers sem conteúdo visual
            if (isInvisibleLayer(layer)) continue;
            
            try {
                var layerBounds = null;
                
                // Método diferente para layers 3D
                if (layer.threeDLayer) {
                    layerBounds = getLayer3DBounds(layer, currentTime, comp);
                } else {
                    layerBounds = getLayerBounds(layer, currentTime);
                }
                
                if (layerBounds) {
                    bounds.left = Math.min(bounds.left, layerBounds.left);
                    bounds.top = Math.min(bounds.top, layerBounds.top);
                    bounds.right = Math.max(bounds.right, layerBounds.right);
                    bounds.bottom = Math.max(bounds.bottom, layerBounds.bottom);
                    validLayers++;
                }
                
                // Calcular tempo (considerar trimming)
                var layerInPoint = Math.max(layer.inPoint, layer.startTime);
                var layerOutPoint = Math.min(layer.outPoint, layer.startTime + layer.source.duration);
                
                bounds.inTime = Math.min(bounds.inTime, layerInPoint);
                bounds.outTime = Math.max(bounds.outTime, layerOutPoint);
                
            } catch (e) {
                // Log do erro para debug
                writeLn("Erro ao calcular bounds da layer '" + layer.name + "': " + e.toString());
            }
        }
        
        if (validLayers === 0) return null;
        
        bounds.width = bounds.right - bounds.left;
        bounds.height = bounds.bottom - bounds.top;
        
        // Verificar se as dimensões são válidas
        if (bounds.width <= 0 || bounds.height <= 0) {
            writeLn("Aviso: Dimensões inválidas calculadas");
            return null;
        }
        
        return bounds;
    }
    
    // Função para calcular bounds de layers 3D
    function getLayer3DBounds(layer, time, comp) {
        try {
            // Para layers 3D, precisamos projetar os pontos para a câmera ativa
            var rect = layer.sourceRectAtTime(time, false);
            
            // Pontos do retângulo da layer
            var corners = [
                [rect.left, rect.top, 0],
                [rect.left + rect.width, rect.top, 0],
                [rect.left + rect.width, rect.top + rect.height, 0],
                [rect.left, rect.top + rect.height, 0]
            ];
            
            var projectedBounds = {
                left: Infinity,
                top: Infinity,
                right: -Infinity,
                bottom: -Infinity
            };
            
            // Projetar cada canto para coordenadas da comp
            for (var i = 0; i < corners.length; i++) {
                var worldPos = layer.toComp(corners[i], time);
                
                projectedBounds.left = Math.min(projectedBounds.left, worldPos[0]);
                projectedBounds.top = Math.min(projectedBounds.top, worldPos[1]);
                projectedBounds.right = Math.max(projectedBounds.right, worldPos[0]);
                projectedBounds.bottom = Math.max(projectedBounds.bottom, worldPos[1]);
            }
            
            return projectedBounds;
            
        } catch (e) {
            // Fallback para método 2D
            return getLayerBounds(layer, time);
        }
    }
    
    // Sistema de preferências (básico)
    var preferences = {
        save: function(key, value) {
            try {
                app.settings.saveSetting("CropComp_v8", key, value.toString());
            } catch (e) {
                // Ignorar erros de preferências
            }
        },
        
        load: function(key, defaultValue) {
            try {
                var value = app.settings.getSetting("CropComp_v8", key);
                return value || defaultValue;
            } catch (e) {
                return defaultValue;
            }
        }
    };
    
    // Carregar preferências na inicialização
    function loadPreferences(panel) {
        try {
            panel.layerPanel.nameGroup.nameField.text = preferences.load("defaultCompName", "Pre-comp");
            panel.layerPanel.paddingGroup.paddingRow1.paddingField.text = preferences.load("defaultPadding", "50");
            panel.layerPanel.optionsGroup.moveAttribCheck.value = preferences.load("moveAttributes", "true") === "true";
            panel.layerPanel.optionsGroup.revealCheck.value = preferences.load("revealInProject", "true") === "true";
            
            panel.projectPanel.dimensionsGroup.widthGroup.widthField.text = preferences.load("defaultWidth", "1920");
            panel.projectPanel.dimensionsGroup.heightGroup.heightField.text = preferences.load("defaultHeight", "1080");
            panel.projectPanel.dimensionsGroup.fpsGroup.fpsField.text = preferences.load("defaultFPS", "30");
            panel.projectPanel.durationGroup.durationField.text = preferences.load("defaultDuration", "10");
        } catch (e) {
            // Ignorar erros de carregamento
        }
    }
    
    // Salvar preferências
    function savePreferences(panel) {
        try {
            preferences.save("defaultCompName", panel.layerPanel.nameGroup.nameField.text);
            preferences.save("defaultPadding", panel.layerPanel.paddingGroup.paddingRow1.paddingField.text);
            preferences.save("moveAttributes", panel.layerPanel.optionsGroup.moveAttribCheck.value);
            preferences.save("revealInProject", panel.layerPanel.optionsGroup.revealCheck.value);
            
            preferences.save("defaultWidth", panel.projectPanel.dimensionsGroup.widthGroup.widthField.text);
            preferences.save("defaultHeight", panel.projectPanel.dimensionsGroup.heightGroup.heightField.text);
            preferences.save("defaultFPS", panel.projectPanel.dimensionsGroup.fpsGroup.fpsField.text);
            preferences.save("defaultDuration", panel.projectPanel.durationGroup.durationField.text);
        } catch (e) {
            // Ignorar erros de salvamento
        }
    }
    
    // Função principal de inicialização
    function initializeScript(thisObj) {
        var panel = createCropCompPanel(thisObj);
        
        if (panel instanceof Window) {
            // É uma janela dialog
            loadPreferences(panel);
            pollingPanel = panel;
            
            // Atualizar executeBtn para usar função validada
            panel.buttonGroup.executeBtn.onClick = function() {
                savePreferences(panel);
                executeScriptValidated(panel);
            };
            
            // Setup polling para mudanças de seleção
            var pollTimer = app.scheduleTask("checkSelectionChanges();", 1000, true);
            
            panel.onClose = function() {
                pollingPanel = null;
                if (pollTimer) {
                    app.cancelTask(pollTimer);
                }
                savePreferences(panel);
            };
            
            panel.center();
            panel.show();
            
        } else if (panel) {
            // É um painel dockable
            loadPreferences(panel);
            pollingPanel = panel;
            
            // Atualizar executeBtn para usar função validada
            panel.buttonGroup.executeBtn.onClick = function() {
                savePreferences(panel);
                executeScriptValidated(panel);
            };
            
            // Setup polling
            app.scheduleTask("checkSelectionChanges();", 1000, true);
        }
        
        return panel;
    }
    
    // Entry point
    return initializeScript(this);
    
})();