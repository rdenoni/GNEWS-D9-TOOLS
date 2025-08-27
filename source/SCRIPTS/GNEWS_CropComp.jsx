/**
 * GNEWS CropComp.jsx
 *
 * Título: CropComp
 * Descrição: Pré-composição, Criação e Redimensionamento de Comps Inteligentes.
 * Autor: GNEWS Design Team (Lógica de Crop por Gemini AI)
 * Versão: 7.4 (Versão de Correção Final - Janela de Ajuda Temática restaurada)
 * Compatibilidade: Adobe After Effects 2023, 2024, 2025
 *
 * HISTÓRICO DE MUDANÇAS (v7.4):
 * - BUG FIX: Restaurada a janela de Ajuda temática completa da v5.4, corrigindo a regressão da v7.3.
 * - VERIFICAÇÃO: Garantido que todas as funções (populatePresets, etc.) e lógicas das 3 abas estão completas.
 */

(function (thisObj) {
    if (typeof this.CropComp === 'undefined') { this.CropComp = {}; }
    var CropComp = this.CropComp;

    CropComp.NAME = "CropComp";
    CropComp.VERSION = "7.4 (Correção Final)";
    
    CropComp.ui = {};
    CropComp.autoUpdateTask = null;

    CropComp.COLORS = { success: [0.2, 0.8, 0.2], error: [0.8, 0.2, 0.2], warning: [0.9, 0.7, 0.2], info: [0.2, 0.6, 0.9], neutral: [0.9, 0.9, 0.9] };

    CropComp.setStatusColor = function(element, color) {
        try { if (element && element.graphics) { element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1); } } catch (e) {}
    };

    CropComp.updateStatus = function(message, type) {
        var self = this;
        if (!self.ui.logText) return;
        var color = self.COLORS[type] || self.COLORS.neutral;
        self.ui.logText.text = message;
        self.setStatusColor(self.ui.logText, color);
        if (type === "success") { 
            app.setTimeout(function () {
                if (self.ui.logText.text === message) { 
                    self.ui.logText.text = "Pronto para uso...";
                    self.setStatusColor(self.ui.logText, self.COLORS.neutral);
                }
            }, 3000);
        }
    };

    CropComp.PRESETS = { "Personalizado": null, "4K (3840x2160)": { w: 3840, h: 2160, fps: 29.97, dur: 10 }, "FullHD (1920x1080)": { w: 1920, h: 1080, fps: 29.97, dur: 10 }, "Web Story (1080x1920)": { w: 1080, h: 1920, fps: 30, dur: 10 } };

    CropComp.showHelp = function() {
        var helpWin = new Window("palette", "Ajuda - CropComp", undefined, { closeButton: true });
        helpWin.orientation = "column"; helpWin.alignChildren = ["fill", "fill"]; helpWin.margins = 15;
        if (typeof setBgColor !== 'undefined' && typeof bgColor1 !== 'undefined') { try{ setBgColor(helpWin, bgColor1); } catch(e){} } else { helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.1, 0.1, 0.1, 1]); }
        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column"; headerPanel.alignChildren = ["fill", "top"]; headerPanel.margins = 15;
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - CROPCOMP");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16); titleText.alignment = ["center", "center"];
        if (typeof setFgColor !== 'undefined' && typeof highlightColor1 !== 'undefined') { try{ setFgColor(titleText, highlightColor1); } catch(e){} }
        var mainDescText = headerPanel.add("statictext", undefined, "Ferramenta para pré-composição, criação e redimensionamento inteligente de composições.", {multiline: true});
        mainDescText.alignment = ["center", "center"];
        if (typeof setFgColor !== 'undefined' && typeof normalColor1 !== 'undefined') { try{ setFgColor(mainDescText, normalColor1); } catch(e){} }
        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"]; topicsTabPanel.margins = 15;
        var helpInfo = {
            "Crop Inteligente": [
                { title: "▶ FUNCIONALIDADE", text: "Pré-compõe camadas baseado em seus limites visuais. A redução de borda é automática para layers com Stroke. Efeitos são sempre movidos para a pré-comp." },
                { title: "▶ NOME DO CROP", text: "Define o nome da nova pré-comp. O nome da camada selecionada é sugerido." },
                { title: "▶ REVELAR NO PROJETO", text: "Seleciona e abre a nova pré-comp na timeline." }
            ],
            "Transformar Footage": [ { title: "▶ FUNCIONALIDADE", text: "Cria uma nova comp e importa os footages selecionados." } ],
            "Redimensionar": [ { title: "▶ FUNCIONALIDADE", text: "Redimensiona comps existentes, com opção de escalar o conteúdo." } ]
        };
        for (var tabName in helpInfo) {
            var tab = topicsTabPanel.add("tab", undefined, tabName);
            tab.orientation = "column"; tab.alignChildren = ["fill", "top"]; tab.spacing = 10;
            var topics = helpInfo[tabName];
            for (var i = 0; i < topics.length; i++) {
                var topic = topics[i];
                var topicGrp = tab.add("group"); topicGrp.orientation = "column"; topicGrp.alignChildren = "fill";
                var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                if (typeof setFgColor !== 'undefined' && typeof highlightColor1 !== 'undefined') { try{ setFgColor(topicTitle, highlightColor1); } catch(e){} }
                var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                if (typeof setFgColor !== 'undefined' && typeof normalColor1 !== 'undefined') { try{ setFgColor(topicText, normalColor1); } catch(e){} }
            }
        }
        var closeBtn = helpWin.add("button", undefined, "Fechar");
        closeBtn.alignment = "center";
        closeBtn.onClick = function() { helpWin.close(); };
        helpWin.center(); helpWin.show();
    };

    CropComp.buildUI = function (thisObj) {
        var self = this;
        this.ui.pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", this.NAME + " v" + this.VERSION, undefined, { resizeable: true });
        var pal = this.ui.pal;
        if (pal.graphics) { pal.graphics.backgroundColor = pal.graphics.newBrush(pal.graphics.BrushType.SOLID_COLOR, [0, 0, 0]); }
        pal.orientation = 'column'; pal.alignment = ['fill', 'top']; pal.margins = 8; pal.spacing = 6;
        var headerGroup = pal.add("group");
        headerGroup.orientation = "row"; headerGroup.alignChildren = ["fill", "center"]; headerGroup.alignment = "fill"; headerGroup.spacing = 10; headerGroup.margins = [0, 0, 0, 10];
        var titleText = headerGroup.add("statictext", undefined, this.NAME + " v" + this.VERSION);
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
        if (typeof setFgColor !== 'undefined' && typeof highlightColor1 !== 'undefined') { try { setFgColor(titleText, highlightColor1); } catch(e){} }
        if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
            var helpBtnGroup = headerGroup.add('group'); helpBtnGroup.alignment = ['right', 'center'];
            var helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
            helpBtn.leftClick.onClick = function() { self.showHelp(); };
        } else {
            var helpBtn = headerGroup.add("button", undefined, "?"); helpBtn.preferredSize = [24, 24]; helpBtn.alignment = ['right', 'center'];
            helpBtn.onClick = function() { self.showHelp(); };
        }
        this.ui.tabPanel = pal.add('tabbedpanel'); this.ui.tabPanel.alignment = 'fill';
        this.ui.precompTab = this.ui.tabPanel.add('tab', undefined, 'Crop Inteligente');
        var precompTab = this.ui.precompTab; precompTab.alignChildren = ['fill', 'top']; precompTab.margins = 10;
        var precompControls = precompTab.add('panel'); precompControls.text = "Configurações do Crop"; precompControls.alignChildren = ['fill', 'top']; precompControls.spacing = 8; precompControls.margins = 15;
        this.ui.precompName = precompControls.add("group { o: 'row', s: StaticText { text: 'Nome:', preferredSize:[80, -1] }, e: EditText { text: 'Crop_Inteligente', alignment:['fill','center'] } }").e;
        this.ui.precompReveal = precompControls.add("checkbox { text: 'Revelar no Projeto', value: true, alignment:['fill','center'] }");
        this.ui.precompBtn = precompControls.add("button { text: 'Executar Crop Inteligente', alignment:['fill','center'] }");
        this.ui.createTab = this.ui.tabPanel.add('tab', undefined, 'Transformar Footage');
        var createTab = this.ui.createTab; createTab.alignChildren = ['fill', 'top']; createTab.margins = 10;
        var createControls = createTab.add('panel'); createControls.text = "Propriedades da Nova Composição"; createControls.alignChildren = ['fill', 'top']; createControls.spacing = 8; createControls.margins = 15;
        this.ui.createPreset = createControls.add("group { o: 'row', s: StaticText { text: 'Presets:', preferredSize:[80, -1] }, d: DropDownList { alignment:['fill','center'] } }").d;
        var createDimsGroup = createControls.add("group { orientation: 'row' }");
        this.ui.createWidth = createDimsGroup.add("group { o:'row', s: StaticText { text: 'Largura:' }, e: EditText { text: '1920', characters:6 } }").e;
        this.ui.createHeight = createDimsGroup.add("group { o:'row', s: StaticText { text: '  Altura:' }, e: EditText { text: '1080', characters:6 } }").e;
        var createTimeGroup = createControls.add("group { orientation: 'row' }");
        this.ui.createFps = createTimeGroup.add("group { o:'row', s: StaticText { text: 'FPS:' }, e: EditText { text: '29.97', characters:6 } }").e;
        this.ui.createDuration = createTimeGroup.add("group { o:'row', s: StaticText { text: '  Duração:' }, e: EditText { text: '10', characters:6 } }").e;
        this.ui.createAutoScale = createControls.add("checkbox { text: 'Auto-escala Inteligente', value: true, alignment:['fill','center'] }");
        this.ui.createBtn = createControls.add("button { text: 'Transformar Footage em Comp', alignment:['fill','center'] }");
        this.ui.resizeTab = this.ui.tabPanel.add('tab', undefined, 'Redimensionar');
        var resizeTab = this.ui.resizeTab; resizeTab.alignChildren = ['fill', 'top']; resizeTab.margins = 10;
        var resizeControls = resizeTab.add('panel'); resizeControls.text = "Novas Propriedades da Composição"; resizeControls.alignChildren = ['fill', 'top']; resizeControls.spacing = 8; resizeControls.margins = 15;
        this.ui.resizePreset = resizeControls.add("group { o:'row', s: StaticText { text: 'Presets:', preferredSize:[80, -1] }, d: DropDownList { alignment:['fill','center'] } }").d;
        var resizeDimsGroup = resizeControls.add("group { o:'row' }");
        this.ui.resizeWidth = resizeDimsGroup.add("group { o:'row', s: StaticText { text: 'Nova Largura:' }, e: EditText { text: '1080', characters:6 } }").e;
        this.ui.resizeHeight = resizeDimsGroup.add("group { o:'row', s: StaticText { text: '  Nova Altura:' }, e: EditText { text: '1920', characters:6 } }").e;
        this.ui.resizeScaleContent = resizeControls.add("checkbox { text: 'Redimensionar conteúdo para ajustar', value: true, alignment:['fill','center'] }");
        var resizeFpsGroup = resizeControls.add("group { o:'row' }");
        this.ui.resizeChangeFpsCheck = resizeFpsGroup.add("checkbox { text: 'Alterar FPS para:' }");
        this.ui.resizeFps = resizeFpsGroup.add("edittext { text: '29.97', characters: 6, enabled: false }");
        var resizeDurGroup = resizeControls.add("group { o:'row' }");
        this.ui.resizeChangeDurationCheck = resizeControls.add("checkbox { text: 'Alterar Duração para:' }");
        this.ui.resizeDuration = resizeDurGroup.add("edittext { text: '10', characters: 6, enabled: false }");
        this.ui.resizeBtn = resizeControls.add("button { text: 'Redimensionar Comp(s)', alignment:['fill','center'] }");
        var statusPanel = pal.add("panel", undefined, "Status");
        statusPanel.alignment = "fill"; statusPanel.margins = [8, 6, 8, 8];
        this.ui.logText = statusPanel.add("statictext", [0, 0, 200, 20], "", {multiline: false});
        this.ui.logText.alignment = ['fill', 'center'];
        self.updateStatus("Pronto para uso...", "neutral");
        this.ui.precompBtn.onClick = function() { self.runLayerMode(); };
        this.ui.createBtn.onClick = function() { self.runProjectMode(); };
        this.ui.resizeBtn.onClick = function() { self.runResizeCompsMode(); };
        this.populatePresets(this.ui.createPreset); this.populatePresets(this.ui.resizePreset);
        this.ui.createPreset.onChange = function() { self.applyPreset("create", this.selection.text); };
        this.ui.resizePreset.onChange = function() { self.applyPreset("resize", this.selection.text); };
        this.ui.resizeChangeFpsCheck.onClick = function() { self.ui.resizeFps.enabled = this.value; };
        this.ui.resizeChangeDurationCheck.onClick = function() { self.ui.resizeDuration.enabled = this.value; };
        pal.onResizing = pal.onResize = function () { this.layout.resize(); };
        if (pal instanceof Window) { pal.center(); pal.show(); }
    };
    
    CropComp.populatePresets = function(dropdown) { for (var p in this.PRESETS) { dropdown.add('item', p); } dropdown.selection = 0; };
    CropComp.applyPreset = function(mode, presetName) { var preset = this.PRESETS[presetName]; if (!preset) return; var widthInput = (mode === "create") ? this.ui.createWidth : this.ui.resizeWidth; var heightInput = (mode === "create") ? this.ui.createHeight : this.ui.resizeHeight; var fpsInput = (mode === "create") ? this.ui.createFps : this.ui.resizeFps; var durationInput = (mode === "create") ? this.ui.createDuration : this.ui.resizeDuration; widthInput.text = preset.w; heightInput.text = preset.h; if(fpsInput) fpsInput.text = preset.fps; if(durationInput) durationInput.text = preset.dur; this.updateStatus("Preset '" + presetName + "' aplicado.", "info"); };
    CropComp.updateCropName = function() { if (!this.ui.pal || !this.ui.pal.visible) return; var comp = app.project.activeItem; if (comp && comp instanceof CompItem && comp.selectedLayers.length === 1) { var layerName = comp.selectedLayers[0].name; if (this.ui.precompName.text !== "Crop_" + layerName) { this.ui.precompName.text = "Crop_" + layerName; } } else { if (this.ui.precompName.text.substring(0, 5) === "Crop_") { this.ui.precompName.text = "Crop_Inteligente"; } } };

    CropComp.runLayerMode = function () {
        this.updateStatus("Iniciando Crop...", "info");
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) { this.updateStatus("ERRO: Abra uma composição.", "error"); return; }
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) { this.updateStatus("ERRO: Selecione pelo menos uma layer.", "error"); return; }
        var precompCount = 0;
        for (var i = 0; i < selectedLayers.length; i++) { if (selectedLayers[i].source && selectedLayers[i].source instanceof CompItem) { precompCount++; } }
        if (selectedLayers.length === 1 && precompCount === 1) { this.updateStatus("Aviso: Nenhuma ação em 1 precomp.", "warning"); return; }
        app.beginUndoGroup("CropComp: Crop Inteligente (v7.4)");
        try {
            var selectedIndices = []; for (var i = 0; i < selectedLayers.length; i++) { selectedIndices.push(selectedLayers[i].index); }
            var precompName = this.ui.precompName.text || "Precomp_CROP";
            var shouldReveal = this.ui.precompReveal.value;
            var moveEffects = true;
            var boundsInMainComp = this.calculateBounds(comp, selectedLayers);
            if (!boundsInMainComp || boundsInMainComp.width <= 0 || boundsInMainComp.height <= 0) { throw new Error("Não foi possível calcular os limites das layers."); }
            var originalWidth = boundsInMainComp.width; var originalHeight = boundsInMainComp.height; var reductionFactor = 1.0; 
            var hasStroke = false;
            for (var i = 0; i < selectedLayers.length; i++) { if (this.getMaxStrokeWidth(selectedLayers[i], comp.time) > 0) { hasStroke = true; break; } }
            if (hasStroke) {
                var reductionPercent = 0;
                if (selectedLayers.length === 1) { reductionFactor = 0.80; reductionPercent = 20; } 
                else if (selectedLayers.length === 2) { reductionFactor = 0.90; reductionPercent = 10; } 
                else if (selectedLayers.length >= 3) { reductionFactor = 0.95; reductionPercent = 5; }
                this.updateStatus("Stroke detectado. Aplicando redução de " + reductionPercent + "%.", "info");
            }
            if (reductionFactor < 1.0) {
                boundsInMainComp.width *= reductionFactor; boundsInMainComp.height *= reductionFactor;
                var deltaWidth = originalWidth - boundsInMainComp.width; var deltaHeight = originalHeight - boundsInMainComp.height;
                boundsInMainComp.left += deltaWidth / 2; boundsInMainComp.top += deltaHeight / 2;
            }
            var precomp = comp.layers.precompose(selectedIndices, precompName, moveEffects);
            this.adjustPrecomp(precomp, boundsInMainComp);
            var precompLayer = this.findLayerBySource(comp, precomp);
            if (precompLayer) {
                var finalPosition = [boundsInMainComp.left + boundsInMainComp.width / 2, boundsInMainComp.top + boundsInMainComp.height / 2, precompLayer.transform.position.value[2] || 0];
                precompLayer.transform.position.setValue(finalPosition);
            }
            this.deselectAllLayers(comp);
            if (precompLayer) precompLayer.selected = true;
            if (shouldReveal) {
                 if (precomp.parentFolder) { try { precomp.parentFolder.selected = true; } catch(e) {} }
                 precomp.selected = true;
                 precomp.openInViewer();
            }
            this.updateStatus("Crop concluído: '" + precompName + "' (" + Math.ceil(boundsInMainComp.width) + "x" + Math.ceil(boundsInMainComp.height) + "px).", "success");
        } catch (error) { this.updateStatus("ERRO: " + error.toString(), "error"); } finally { app.endUndoGroup(); }
    };
    
    CropComp.runProjectMode = function() { 
        try { 
            var width = parseInt(this.ui.createWidth.text, 10); var height = parseInt(this.ui.createHeight.text, 10);
            var fps = parseFloat(this.ui.createFps.text); var duration = parseFloat(this.ui.createDuration.text);
            var shouldAutoScale = this.ui.createAutoScale.value; 
            if (isNaN(width) || isNaN(height) || isNaN(fps) || isNaN(duration)) throw new Error("Todos os campos devem ser números válidos.");
            var projectItems = app.project.selection; 
            if (projectItems.length === 0) throw new Error("Nenhum item selecionado no projeto.");
            app.beginUndoGroup("CropComp: Transformar Footage"); 
            var createdCount = 0; 
            for (var i = 0; i < projectItems.length; i++) { 
                var item = projectItems[i]; if (!(item instanceof FootageItem)) continue; 
                this.updateStatus("Transformando '" + item.name + "'...", "info"); 
                var frameRateToUse = item.frameRate;
                if (frameRateToUse <= 0) { 
                    if (app.project.activeItem && app.project.activeItem instanceof CompItem) { frameRateToUse = app.project.activeItem.frameRate; } 
                    else { frameRateToUse = parseFloat(this.ui.createFps.text) || 29.97; }
                }
                var newComp = app.project.items.addComp(item.name + " Comp", width, height, 1.0, duration, frameRateToUse); 
                var newLayer = newComp.layers.add(item); createdCount++; 
                if (shouldAutoScale && newLayer.width > 0 && newLayer.height > 0) { 
                    var scaleFactor = Math.min(width / newLayer.width, height / newLayer.height); 
                    newLayer.property("Scale").setValue([scaleFactor * 100, scaleFactor * 100]); 
                    newLayer.property("Position").setValue([width / 2, height / 2]); 
                } 
            } 
            app.endUndoGroup(); 
            if (createdCount > 0) this.updateStatus(createdCount + " comp(s) criada(s) com sucesso!", "success"); 
            else this.updateStatus("Nenhum footage válido selecionado.", "warning"); 
        } catch(e) { this.updateStatus("ERRO: " + e.message, "error"); } 
    };

    CropComp.runResizeCompsMode = function() { 
        try { 
            var compsToResize = []; var activeComp = app.project.activeItem; 
            if (activeComp instanceof CompItem && activeComp.selectedLayers.length === 0 && app.project.selection.length === 0) { compsToResize.push(activeComp); } 
            else { for (var i = 0; i < app.project.selection.length; i++){ if (app.project.selection[i] instanceof CompItem) { compsToResize.push(app.project.selection[i]); } } }
            if (compsToResize.length === 0) throw new Error("Nenhuma comp selecionada.");
            var newWidth = parseInt(this.ui.resizeWidth.text, 10); var newHeight = parseInt(this.ui.resizeHeight.text, 10); 
            var shouldScaleContent = this.ui.resizeScaleContent.value; var shouldChangeFps = this.ui.resizeChangeFpsCheck.value; 
            var newFps = parseFloat(this.ui.resizeFps.text); var shouldChangeDuration = this.ui.resizeChangeDurationCheck.value; 
            var newDuration = parseFloat(this.ui.resizeDuration.text); 
            if (isNaN(newWidth) || isNaN(newHeight)) throw new Error("Dimensões devem ser números."); 
            app.beginUndoGroup("CropComp: Redimensionar Comps"); 
            var resizedCount = 0; 
            for (var i = 0; i < compsToResize.length; i++) { 
                var comp = compsToResize[i]; this.updateStatus("Redimensionando '" + comp.name + "'...", "info"); 
                var oldWidth = comp.width; var oldHeight = comp.height; 
                comp.width = newWidth; comp.height = newHeight; 
                if (shouldChangeFps && !isNaN(newFps)) comp.frameRate = newFps; 
                if (shouldChangeDuration && !isNaN(newDuration)) comp.duration = newDuration; 
                if (shouldScaleContent && oldWidth > 0 && oldHeight > 0) { 
                    var scaleX = newWidth / oldWidth; var scaleY = newHeight / oldHeight;
                    for (var j = 1; j <= comp.numLayers; j++) { 
                        var layer = comp.layer(j); if (layer instanceof CameraLayer || layer instanceof LightLayer) continue; 
                        this.rescaleLayer(layer, scaleX, scaleY);
                    } 
                } 
                resizedCount++; 
            } 
            app.endUndoGroup(); 
            if (resizedCount > 0) this.updateStatus(resizedCount + " comp(s) redimensionada(s)!", "success"); 
        } catch(e) { this.updateStatus("ERRO: " + e.message, "error"); } 
    };
    
    CropComp.rescaleLayer = function(layer, scaleX, scaleY){
        var pos = layer.property("Position");
        if(pos && pos.value.length >= 2) {
            if (pos.numKeys === 0) { var p = pos.value; pos.setValue([p[0] * scaleX, p[1] * scaleY, p[2] || 0]); }
            else { for (var k=1; k<=pos.numKeys; k++){ var p = pos.keyValue(k); pos.setValueAtKey(k, [p[0] * scaleX, p[1] * scaleY, p[2] || 0]); } }
        }
        var scale = layer.property("Scale");
        if(scale) {
            if (scale.numKeys === 0) { var s = scale.value; scale.setValue([s[0] * scaleX, s[1] * scaleY, s[2] || 100]); }
            else { for (var k=1; k<=scale.numKeys; k++){ var s = scale.keyValue(k); scale.setValueAtKey(k, [s[0] * scaleX, s[1] * scaleY, s[2] || 100]); } }
        }
    };

    CropComp.adjustPrecomp = function(precomp, boundsInMainComp) { var layersInPrecomp = this.getAllLayersFromComp(precomp); var time = precomp.time; precomp.width = Math.ceil(boundsInMainComp.width); precomp.height = Math.ceil(boundsInMainComp.height); for (var i = 0; i < layersInPrecomp.length; i++) { var layer = layersInPrecomp[i]; if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) { try { var rect = layer.sourceRectAtTime(time, true); if (rect.width === 0 && rect.height === 0) continue; var anchorProp = layer.transform.anchorPoint; var posProp = layer.transform.position; var currentAnchor = anchorProp.value; var targetAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2]; var dAnchorX = targetAnchor[0] - currentAnchor[0]; var dAnchorY = targetAnchor[1] - currentAnchor[1]; if (Math.abs(dAnchorX) < 0.01 && Math.abs(dAnchorY) < 0.01) continue; var scale = layer.transform.scale.valueAtTime(time, false); var rotation = layer.transform.rotation.valueAtTime(time, false); var sx = scale[0] / 100.0; var sy = scale[1] / 100.0; var r = rotation * Math.PI / 180.0; var compVec_x = (dAnchorX * sx * Math.cos(r)) - (dAnchorY * sy * Math.sin(r)); var compVec_y = (dAnchorX * sx * Math.sin(r)) + (dAnchorY * sy * Math.cos(r)); anchorProp.setValue(targetAnchor); this.applyOffsetToProperty(posProp, [compVec_x, compVec_y]); } catch (e) {} } } var boundsInPrecomp = this.calculateBounds(precomp, layersInPrecomp); if (!boundsInPrecomp) return; var precompCenterX = precomp.width / 2; var precompCenterY = precomp.height / 2; var contentCenterX = boundsInPrecomp.left + (boundsInPrecomp.width / 2); var contentCenterY = boundsInPrecomp.top + (boundsInPrecomp.height / 2); var internalOffset = [precompCenterX - contentCenterX, precompCenterY - contentCenterY]; for (var i = 0; i < layersInPrecomp.length; i++) { this.applyOffsetToProperty(layersInPrecomp[i].transform.position, internalOffset); } };
    CropComp.calculateBounds = function(comp, layers) { var time = comp.time; var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; var hasValidBounds = false; for (var i = 0; i < layers.length; i++) { var layer = layers[i]; if (!layer.enabled || (time < layer.inPoint || time > layer.outPoint)) continue; try { var layerBounds = this.getLayerBoundsAtTime(layer, time); if (layerBounds) { minX = Math.min(minX, layerBounds.left); minY = Math.min(minY, layerBounds.top); maxX = Math.max(maxX, layerBounds.right); maxY = Math.max(maxY, layerBounds.bottom); hasValidBounds = true; } } catch (e) {} } if (!hasValidBounds) return null; return { left: minX, top: minY, width: maxX - minX, height: maxY - minY, right: maxX, bottom: maxY }; };
    CropComp.getLayerBoundsAtTime = function(layer, time) { var rect; if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) { try { rect = layer.sourceRectAtTime(time, true); } catch (e) { rect = { top: 0, left: 0, width: 0, height: 0 }; } } else if (layer.source) { rect = { top: 0, left: 0, width: layer.source.width, height: layer.source.height }; } else { rect = { top: 0, left: 0, width: 0, height: 0 }; } if (rect.width <= 0 || rect.height <= 0) return null; var corners = [ [rect.left, rect.top], [rect.left + rect.width, rect.top], [rect.left + rect.width, rect.top + rect.height], [rect.left, rect.top + rect.height] ]; var position = layer.transform.position.valueAtTime(time, false); var anchorPoint = layer.transform.anchorPoint.valueAtTime(time, false); var scale = layer.transform.scale.valueAtTime(time, false); var rotation = layer.transform.rotation.valueAtTime(time, false); var rad = -rotation * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad), sx = scale[0] / 100, sy = scale[1] / 100; var transformedCorners = []; for (var i = 0; i < 4; i++) { var corner = corners[i], x = corner[0] - anchorPoint[0], y = corner[1] - anchorPoint[1]; x *= sx; y *= sy; var rotatedX = x * cos - y * sin, rotatedY = x * sin + y * cos; transformedCorners.push([rotatedX + position[0], rotatedY + position[1]]); } var minX = transformedCorners[0][0], maxX = transformedCorners[0][0], minY = transformedCorners[0][1], maxY = transformedCorners[0][1]; for (var i = 1; i < 4; i++) { minX = Math.min(minX, transformedCorners[i][0]); maxX = Math.max(maxX, transformedCorners[i][0]); minY = Math.min(minY, transformedCorners[i][1]); maxY = Math.max(maxY, transformedCorners[i][1]); } return { left: minX, top: minY, right: maxX, bottom: maxY }; };
    CropComp.getMaxStrokeWidth = function(layer, time) { var maxWidth = 0; try { var lsStroke = layer.property("Layer Styles").property("Stroke"); if (lsStroke && lsStroke.enabled) { var lsSize = lsStroke.property("Size").valueAtTime(time, false); if (lsSize > maxWidth) maxWidth = lsSize; } } catch (e) {} try { if (layer instanceof ShapeLayer && layer.property("Contents")) { var shapeStroke = this.findMaxStrokeInShape(layer.property("Contents"), time); if (shapeStroke > maxWidth) maxWidth = shapeStroke; } } catch(e) {} return maxWidth; };
    CropComp.findMaxStrokeInShape = function(propGroup, time) { var maxStroke = 0; for (var i = 1; i <= propGroup.numProperties; i++) { var prop = propGroup.property(i); if (prop.matchName === "ADBE Vector Graphic - Stroke" && prop.enabled) { var strokeWidthProp = prop.property("ADBE Vector Stroke Width"); if (strokeWidthProp) { var strokeWidth = strokeWidthProp.valueAtTime(time, false); if (strokeWidth > maxStroke) maxStroke = strokeWidth; } } else if (prop.matchName === "ADBE Vector Group" || prop.matchName === "ADBE Vector Shape - Group") { var nestedStroke = this.findMaxStrokeInShape(prop.property("Contents"), time); if (nestedStroke > maxStroke) maxStroke = nestedStroke; } } return maxStroke; };
    CropComp.applyOffsetToProperty = function(prop, offset) { if (prop.numKeys > 0) { for (var k = 1; k <= prop.numKeys; k++) { var oldVal = prop.keyValue(k); prop.setValueAtKey(k, [oldVal[0] + offset[0], oldVal[1] + offset[1], oldVal[2] || 0]); } } else { var oldVal = prop.value; prop.setValue([oldVal[0] + offset[0], oldVal[1] + offset[1], oldVal[2] || 0]); } };
    CropComp.findLayerBySource = function(comp, source) { for (var i = 1; i <= comp.numLayers; i++) { if (comp.layer(i).source === source) return comp.layer(i); } return null; };
    CropComp.deselectAllLayers = function(comp) { for (var i = 1; i <= comp.numLayers; i++) { comp.layer(i).selected = false; } };
    CropComp.getAllLayersFromComp = function(comp) { var layers = []; for (var i = 1; i <= comp.numLayers; i++) { layers.push(comp.layer(i)); } return layers; };

    CropComp.buildUI(thisObj);
    if (CropComp.autoUpdateTask === null) {
        CropComp.autoUpdateTask = app.scheduleTask("if(typeof CropComp !== 'undefined' && CropComp && CropComp.updateCropName) { try { CropComp.updateCropName(); } catch(e) {} }", 500, true);
    }
})(this);