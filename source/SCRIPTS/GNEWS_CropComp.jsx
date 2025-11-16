/*
GNEWS CropComp v9.4 - PRÉ-COMPOSIÇÃO E REDIMENSIONAMENTO INTELIGENTES

MODULOS USADOS:
source/globals.js
source/libraries/HELP lib.js
source/layout/main_ui_functions.js
source/libraries/ICON lib.js

ATUALIZAÇÃO:
- CORREÇÃO DEFINITIVA (CRÍTICO): Lógica de tempo e posicionamento do Crop Inteligente
  foi completamente reescrita para ser explícita e robusta, garantindo que a nova
  pré-composição ocupe o lugar exato da camada original na timeline.
- MANTIDO: Todas as outras melhorias de estabilidade e interface das versões recentes.
*/

$.encoding = "UTF-8";
function launchCropComp(thisObj) {
    if (typeof this.CropComp === 'undefined') { this.CropComp = {}; }
    var CropComp = this.CropComp;

    CropComp.Theme = {
        colors: { success: successColor, error: highlightColor1, warning: warningColor, neutral: monoColor1, background: bgColor1, placeholderText: '#777777', normalText: monoColor1 },
        text: { readyMessage: "Pronto para uso...", namePlaceholder: "Personalizar nome" }
    };

    CropComp.NAME = "GNEWS CROPCOMP";
    CropComp.SUBTITLE = "Cropa layers e Redimensiona Comps";
    CropComp.VERSION = "9.4";
    CropComp.BUTTON_SIZE = { width: 260, height: 40 }; // Ajuste rápido da largura/altura dos botões temáticos
    
    CropComp.ui = {};
    CropComp.autoUpdateTask = null;
    CropComp.isUpdatingAspectRatio = false;

    CropComp.CREATE_PRESETS = { 
        "Personalizado": null, 
        "Quadrado 1:1 (300x300)": { w: 300, h: 300, fps: 29.97, dur: 10 }, 
        "Paisagem 2:1 (600x300)": { w: 600, h: 300, fps: 29.97, dur: 10 }, 
        "Vertical 1:2 (300x600)": { w: 300, h: 600, fps: 29.97, dur: 10 } 
    };
    CropComp.RESIZE_PRESETS = { 
        "Personalizado": null, 
        "4K (3840x2160)": { w: 3840, h: 2160, fps: 29.97, dur: 10 }, 
        "FullHD (1920x1080)": { w: 1920, h: 1080, fps: 29.97, dur: 10 }, 
        "Web Story (1080x1920)": { w: 1080, h: 1920, fps: 30, dur: 10 } 
    };

    // Funções auxiliares (sem alteração)
    CropComp.hexToRgb = function(hex) { if (typeof hex !== 'string') return [0.9, 0.9, 0.9]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16) / 255; var g = parseInt(hex.substring(2, 4), 16) / 255; var b = parseInt(hex.substring(4, 6), 16) / 255; return [r, g, b]; };
    CropComp.setStatusColor = function(element, color) { try { if (element && element.graphics) { var rgbColor = this.hexToRgb(color); element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, rgbColor, 1); } } catch (e) {} };
    CropComp.updateStatus = function(message, type) { var self = this; if (!self.ui.statusText) return; var color = self.Theme.colors.neutral; var prefix = ""; switch(type) { case "success": color = self.Theme.colors.success; prefix = "? "; break; case "error": color = self.Theme.colors.error; prefix = "ERRO: "; break; case "warning": color = self.Theme.colors.warning; prefix = "AVISO: "; break; case "info": color = self.Theme.colors.neutral; prefix = ""; break; } self.ui.statusText.text = prefix + message; self.setStatusColor(self.ui.statusText, color); if (type === "success") { app.setTimeout(function () { if (self.ui.statusText.text === (prefix + message)) { self.ui.statusText.text = self.Theme.text.readyMessage; self.setStatusColor(self.ui.statusText, self.Theme.colors.neutral); } }, 3000); } };
    CropComp.applyFixedSize = function(target, width, height) { if (!target || typeof width !== 'number' || typeof height !== 'number') { return; } var sizeArr = [width, height]; target.preferredSize = sizeArr; target.minimumSize = sizeArr; target.maximumSize = sizeArr; target.size = sizeArr; };
    CropComp.enforceThemeButtonSize = function(button) {
        if (!button) { return; }
        var width = this.BUTTON_SIZE.width;
        var height = this.BUTTON_SIZE.height;
        if (typeof width === 'number' && typeof height === 'number') {
            this.applyFixedSize(button, width, height);
            if (button.parent && button.parent.type === "group") {
                this.applyFixedSize(button.parent, width + 8, height + 8);
                button.parent.margins = [4, 4, 4, 4];
                button.parent.alignment = ['center','center'];
            }
        }
        button.__buttonThemeOverrides = button.__buttonThemeOverrides || {};
        if (typeof width === 'number') { button.__buttonThemeOverrides.width = width; }
        if (typeof height === 'number') { button.__buttonThemeOverrides.height = height; }
        var self = this;
        var relock = function() { self.applyFixedSize(button, width, height); };
        if (typeof button.addEventListener === 'function') {
            var events = ["mouseover", "mouseout", "mousedown", "mouseup"];
            for (var i = 0; i < events.length; i++) {
                try { button.addEventListener(events[i], relock); } catch (evtErr) {}
            }
        }
        if (typeof button.onDraw === 'function') {
            var originalDraw = button.onDraw;
            button.onDraw = function() {
                relock();
                originalDraw.apply(this, arguments);
            };
        } else {
            button.onDraw = relock;
        }
        if (typeof D9T_applyThemeToButtonControl === 'function') {
            try {
                var baseTheme = button.__buttonThemeSource;
                if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') { baseTheme = D9T_getActiveButtonTheme(); }
                D9T_applyThemeToButtonControl(button, baseTheme);
            } catch (e) {}
        }
    };
    CropComp.createThemedButton = function(parent, label, tip, options) {
        options = options || {};
        var cfgWidth = (typeof options.width === 'number') ? options.width : this.BUTTON_SIZE.width;
        var cfgHeight = (typeof options.height === 'number') ? options.height : this.BUTTON_SIZE.height;
        var ctrl;
        if (typeof themeButton === 'function') {
            try {
                var cfg = { labelTxt: label, tips: tip ? [tip] : [] };
                if (cfgWidth) { cfg.width = cfgWidth; }
                if (cfgHeight) { cfg.height = cfgHeight; }
                if (options.alignment) { cfg.alignment = options.alignment; }
                var wrapper = new themeButton(parent, cfg);
                ctrl = wrapper.label;
            } catch (err) { ctrl = null; }
        }
        if (!ctrl) {
            ctrl = parent.add("button", undefined, label);
            if (cfgWidth) { ctrl.preferredSize.width = cfgWidth; }
            if (cfgHeight) { ctrl.preferredSize.height = cfgHeight; }
        }
        if (tip) { ctrl.helpTip = tip; }
        this.enforceThemeButtonSize(ctrl);
        return ctrl;
    };

    CropComp.buildUI = function (thisObj) {
        var self = this;
        this.ui.pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", this.NAME + " v" + this.VERSION, undefined, { resizeable: false });
        var pal = this.ui.pal;
        if (pal.graphics) { pal.graphics.backgroundColor = pal.graphics.newBrush(pal.graphics.BrushType.SOLID_COLOR, self.hexToRgb(self.Theme.colors.background)); }
        pal.orientation = 'column'; pal.alignment = ['fill', 'top']; pal.margins = 8; pal.spacing = 6;
        var headerGroup = pal.add("group"); headerGroup.orientation = 'stack'; headerGroup.alignment = 'fill'; headerGroup.margins = [0,0,0,10];
        var titleGroup = headerGroup.add('group'); titleGroup.alignment = 'left';
        var subtitleText = titleGroup.add("statictext", undefined, this.SUBTITLE);
        subtitleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
        if (typeof setFgColor !== 'undefined') { try { setFgColor(subtitleText, self.Theme.colors.error); } catch(e){} }
        var helpBtnGroup = headerGroup.add('group'); helpBtnGroup.alignment = 'right';
        var helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
        helpBtn.leftClick.onClick = function() { showCropCompHelp(); };
        this.ui.tabPanel = pal.add('tabbedpanel'); this.ui.tabPanel.alignment = 'fill';
        this.ui.precompTab = this.ui.tabPanel.add('tab', undefined, 'Crop Inteligente');
        var precompTab = this.ui.precompTab; precompTab.alignChildren = ['fill', 'top']; precompTab.margins = 10;
        var precompControls = precompTab.add('panel'); precompControls.text = "Configurações do Crop"; precompControls.alignChildren = ['fill', 'top']; precompControls.spacing = 8; precompControls.margins = 15;
        this.ui.precompName = precompControls.add("group { o: 'row', s: StaticText { text: 'Nome:', preferredSize:[80, -1] }, e: EditText { text: '" + self.Theme.text.namePlaceholder + "', alignment:['fill','center'] } }").e;
        this.ui.precompName.helpTip = "Nome utilizado para a nova pre-comp.";
        this.ui.precompReveal = precompControls.add("checkbox { text: 'Revelar no Projeto', value: false, alignment:['fill','center'] }");
        this.ui.precompReveal.helpTip = "Mantem a comp criada visivel no painel de projeto.";
        this.ui.precompIndividual = precompControls.add("checkbox { text: 'Converter camadas individualmente', value: false, alignment:['fill','center'] }");
        this.ui.precompIndividual.helpTip = "Cria uma pre-comp para cada layer selecionada.";
        var precompBtnRow = precompControls.add("group");
        precompBtnRow.alignment = ['fill','center'];
        precompBtnRow.alignChildren = ['center','center'];
        this.ui.precompBtn = this.createThemedButton(precompBtnRow, "Executar Crop Inteligente", "Executa o Crop Inteligente com as opcoes acima.", { alignment: ['center','center'], width: this.BUTTON_SIZE.width, height: this.BUTTON_SIZE.height });
        this.enforceThemeButtonSize(this.ui.precompBtn);
        this.ui.precompBtn.helpTip = "Executa o Crop Inteligente com as opcoes acima.";
        var precompNameField = this.ui.precompName;
        self.setStatusColor(precompNameField, self.Theme.colors.placeholderText);
        precompNameField.onActivate = function() { if (this.text === self.Theme.text.namePlaceholder) { this.text = ""; self.setStatusColor(this, self.Theme.colors.normalText); } };
        precompNameField.onDeactivate = function() { if (this.text === "") { this.text = self.Theme.text.namePlaceholder; self.setStatusColor(this, self.Theme.colors.placeholderText); } };
        this.ui.createTab = this.ui.tabPanel.add('tab', undefined, 'Footage para Comp'); var createTab = this.ui.createTab; createTab.alignChildren = ['fill', 'top']; createTab.margins = 10; var createControls = createTab.add('panel'); createControls.text = "Propriedades da Nova Composição"; createControls.alignChildren = ['fill', 'top']; createControls.spacing = 8; createControls.margins = 15; this.ui.createPreset = createControls.add("group { o: 'row', s: StaticText { text: 'Presets:', preferredSize:[80, -1] }, d: DropDownList { alignment:['fill','center'] } }").d;
        this.ui.createPreset.helpTip = "Presets com dimensoes e fps prontos."; var createDimsGroup = createControls.add("group { orientation: 'row', alignment: ['fill', 'center'] }"); this.ui.createWidth = createDimsGroup.add("group { o:'row', s: StaticText { text: 'Largura:' }, e: EditText { text: '1920', characters:6 } }").e;
        this.ui.createWidth.helpTip = "Largura desejada para a nova comp."; this.ui.createHeight = createDimsGroup.add("group { o:'row', s: StaticText { text: '  Altura:' }, e: EditText { text: '1080', characters:6 } }").e;
        this.ui.createHeight.helpTip = "Altura desejada para a nova comp."; this.ui.createLockAspect = createControls.add("checkbox { text: 'Manter Proporção', value: false, alignment:['fill','center'] }");
        this.ui.createLockAspect.helpTip = "Mantem proporção ao alterar largura/altura."; var createTimeGroup = createControls.add("group { orientation: 'row' }"); this.ui.createFps = createTimeGroup.add("group { o:'row', s: StaticText { text: 'FPS:' }, e: EditText { text: '29.97', characters:6 } }").e;
        this.ui.createFps.helpTip = "Define a taxa de quadros."; this.ui.createDuration = createTimeGroup.add("group { o:'row', s: StaticText { text: '  Duração:' }, e: EditText { text: '10', characters:6 } }").e;
        this.ui.createDuration.helpTip = "Duracao em segundos."; this.ui.createAutoScale = createControls.add("checkbox { text: 'Auto-escala Inteligente', value: true, alignment:['fill','center'] }");
        this.ui.createAutoScale.helpTip = "Redimensiona o conteudo automaticamente.";
        var createBtnRow = createControls.add("group");
        createBtnRow.alignment = ['fill','center'];
        createBtnRow.alignChildren = ['center','center'];
        this.ui.createBtn = this.createThemedButton(createBtnRow, "Transformar Footage em Comp", "Transforma o footage em comp usando as configuracoes acima.", { alignment: ['center','center'], width: this.BUTTON_SIZE.width, height: this.BUTTON_SIZE.height });
        this.enforceThemeButtonSize(this.ui.createBtn);
        this.ui.createBtn.helpTip = "Transforma o footage em comp usando as configuracoes acima.";
        this.ui.resizeTab = this.ui.tabPanel.add('tab', undefined, 'Redimensionar'); var resizeTab = this.ui.resizeTab; resizeTab.alignChildren = ['fill', 'top']; resizeTab.margins = 10; var resizeControls = resizeTab.add('panel'); resizeControls.text = "Novas Propriedades da Composição"; resizeControls.alignChildren = ['fill', 'top']; resizeControls.spacing = 8; resizeControls.margins = 15; this.ui.resizePreset = resizeControls.add("group { o:'row', s: StaticText { text: 'Presets:', preferredSize:[80, -1] }, d: DropDownList { alignment:['fill','center'] } }").d;
        this.ui.resizePreset.helpTip = "Selecione um preset para redimensionar comps."; var resizeDimsGroup = resizeControls.add("group { o:'row', alignment: ['fill', 'center'] }"); this.ui.resizeWidth = resizeDimsGroup.add("group { o:'row', s: StaticText { text: 'Nova Largura:' }, e: EditText { text: '1080', characters:6 } }").e;
        this.ui.resizeWidth.helpTip = "Nova largura em pixels."; this.ui.resizeHeight = resizeDimsGroup.add("group { o:'row', s: StaticText { text: '  Nova Altura:' }, e: EditText { text: '1920', characters:6 } }").e;
        this.ui.resizeHeight.helpTip = "Nova altura em pixels."; this.ui.resizeLockAspect = resizeControls.add("checkbox { text: 'Manter Proporção', value: false, alignment:['fill','center'] }");
        this.ui.resizeLockAspect.helpTip = "Bloqueia proporção durante ajustes."; this.ui.resizeScaleContent = resizeControls.add("checkbox { text: 'Redimensionar conteúdo para ajustar', value: true, alignment:['fill','center'] }");
        this.ui.resizeScaleContent.helpTip = "Escala layers para caber no novo tamanho."; var resizeFpsGroup = resizeControls.add("group { o:'row' }"); this.ui.resizeChangeFpsCheck = resizeFpsGroup.add("checkbox { text: 'Alterar FPS para:' }");
        this.ui.resizeChangeFpsCheck.helpTip = "Habilita alteracao de FPS."; this.ui.resizeFps = resizeFpsGroup.add("edittext { text: '29.97', characters: 6, enabled: false }");
        this.ui.resizeFps.helpTip = "Valor usado quando alterar FPS estiver ativo."; var resizeDurGroup = resizeControls.add("group { orientation: 'row' }"); this.ui.resizeChangeDurationCheck = resizeControls.add("checkbox { text: 'Alterar Duração para:' }");
        this.ui.resizeChangeDurationCheck.helpTip = "Habilita alteracao de duracao."; this.ui.resizeDuration = resizeDurGroup.add("edittext { text: '10', characters: 6, enabled: false }");
        this.ui.resizeDuration.helpTip = "Nova duracao em segundos.";
        var resizeBtnRow = resizeControls.add("group");
        resizeBtnRow.alignment = ['fill','center'];
        resizeBtnRow.alignChildren = ['center','center'];
        this.ui.resizeBtn = this.createThemedButton(resizeBtnRow, "Redimensionar Comp(s)", "Aplica o redimensionamento nas comps selecionadas.", { alignment:['center','center'], width: this.BUTTON_SIZE.width, height: this.BUTTON_SIZE.height });
        this.enforceThemeButtonSize(this.ui.resizeBtn);
        this.ui.resizeBtn.helpTip = "Aplica o redimensionamento nas comps selecionadas.";
        var statusPanel = pal.add("panel", undefined, "Status"); statusPanel.alignment = "fill"; statusPanel.margins = [8, 6, 8, 8]; this.ui.statusText = statusPanel.add("statictext", [0, 0, 200, 20], "", {multiline: false, truncate: "end"});
        this.ui.statusText.helpTip = "Mensagens de status do CropComp aparecem aqui."; this.ui.statusText.alignment = ['fill', 'center'];
        this.updateStatus(this.Theme.text.readyMessage, "info");
        this.ui.precompBtn.onClick = function() { self.runLayerMode(); };
        this.ui.createBtn.onClick = function() { self.runProjectMode(); };
        this.ui.resizeBtn.onClick = function() { self.runResizeCompsMode(); };
        this.populatePresets(this.ui.createPreset, self.CREATE_PRESETS); 
        this.populatePresets(this.ui.resizePreset, self.RESIZE_PRESETS);
        this.ui.createPreset.onChange = function() { self.applyPreset("create", this.selection.text); };
        this.ui.resizePreset.onChange = function() { self.applyPreset("resize", this.selection.text); };
        this.ui.resizeChangeFpsCheck.onClick = function() { self.ui.resizeFps.enabled = this.value; };
        this.ui.resizeChangeDurationCheck.onClick = function() { self.ui.resizeDuration.enabled = this.value; };
        this.addAspectRatioEvents('create'); this.addAspectRatioEvents('resize');
        pal.onResizing = pal.onResize = function () { this.layout.resize(); };
        if (pal instanceof Window) { pal.center(); pal.show(); }
    };
    
    // As funções auxiliares e as outras abas não precisam de alteração
    CropComp.populatePresets = function(dropdown, presetsObject) { for (var p in presetsObject) { dropdown.add('item', p); } dropdown.selection = 0; };
    CropComp.applyPreset = function(mode, presetName) { var presetsObject = (mode === "create") ? this.CREATE_PRESETS : this.RESIZE_PRESETS; var preset = presetsObject[presetName]; if (!preset) return; var widthInput = this.ui[mode + 'Width']; var heightInput = this.ui[mode + 'Height']; var fpsInput = this.ui[mode + 'Fps']; var durationInput = this.ui[mode + 'Duration']; widthInput.text = preset.w; heightInput.text = preset.h; if(fpsInput) fpsInput.text = preset.fps; if(durationInput) durationInput.text = preset.dur; this.updateStatus("Preset '" + presetName + "' aplicado.", "info"); };
    CropComp.addAspectRatioEvents = function(mode) { var self = this; var widthInput = self.ui[mode + 'Width']; var heightInput = self.ui[mode + 'Height']; var lockCheck = self.ui[mode + 'LockAspect']; var aspectRatio = 1; function updateDimensions(source) { if (self.isUpdatingAspectRatio || !lockCheck.value) return; self.isUpdatingAspectRatio = true; try { var w = parseFloat(widthInput.text); var h = parseFloat(heightInput.text); if (isNaN(w) || isNaN(h)) { self.isUpdatingAspectRatio = false; return; } if (source === 'width' && w > 0) { heightInput.text = Math.round(w / aspectRatio); } else if (source === 'height' && h > 0) { widthInput.text = Math.round(h * aspectRatio); } } catch(e){} self.isUpdatingAspectRatio = false; } widthInput.onChanging = function() { updateDimensions('width'); }; heightInput.onChanging = function() { updateDimensions('height'); }; lockCheck.onClick = function() { if (this.value) { var w = parseFloat(widthInput.text); var h = parseFloat(heightInput.text); if (!isNaN(w) && !isNaN(h) && h > 0) { aspectRatio = w / h; } else { aspectRatio = 16/9; } } }; };
    CropComp.updateCropName = function() { if (!this.ui.pal || !this.ui.pal.visible) return; var comp = app.project.activeItem; var precompNameField = this.ui.precompName; if (comp && comp instanceof CompItem && comp.selectedLayers.length === 1) { var layerName = comp.selectedLayers[0].name; var newName = "Crop_" + layerName; if (precompNameField.text !== newName) { precompNameField.text = newName; this.setStatusColor(precompNameField, this.Theme.colors.normalText); } } };

    CropComp.runLayerMode = function () {
        var self = this;
        this.updateStatus("Iniciando Crop Inteligente...", "info");
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) { this.updateStatus("Abra uma composição primeiro.", "error"); return; }
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) { this.updateStatus("Selecione pelo menos uma layer.", "error"); return; }
        
        app.beginUndoGroup("CropComp: Crop Inteligente");
        try {
            var convertIndividually = this.ui.precompIndividual.value;

            if (convertIndividually) {
                var createdCount = 0;
                var layersToProcess = [];
                for(var i = 0; i < selectedLayers.length; i++) { layersToProcess.push(selectedLayers[i]); }

                for (var i = layersToProcess.length - 1; i >= 0; i--) {
                    var currentLayer = layersToProcess[i];
                    
                    var minInPoint = currentLayer.inPoint;
                    var maxOutPoint = currentLayer.outPoint;
                    var newDuration = maxOutPoint - minInPoint;
                    var precompName = "Crop_" + currentLayer.name;

                    var bounds = self.calculateBounds(comp, [currentLayer]);
                    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
                        self.updateStatus("Não foi possível calcular os limites da layer '" + currentLayer.name + "'.", "warning");
                        continue;
                    }
                    
                    self.deselectAllLayers(comp);
                    currentLayer.selected = true;

                    var precompLayer = comp.layers.precompose([currentLayer.index], precompName, true);
                    var precompItem = precompLayer.source;

                    if (precompLayer) {
                        // CORREÇÃO DEFINITIVA: Lógica de 3 passos para sincronia de tempo.
                        if (newDuration > 0) {
                            // 1. Ajusta a duração da composição interna.
                            precompItem.duration = newDuration;
                            // 2. Desloca as camadas internas para começar em tempo 0.
                            for (var j = 1; j <= precompItem.numLayers; j++) {
                                precompItem.layer(j).startTime = precompItem.layer(j).startTime - minInPoint;
                            }
                            // 3. Sincroniza a camada externa na timeline principal.
                            precompLayer.startTime = 0;
                            precompLayer.inPoint = minInPoint;
                            precompLayer.outPoint = minInPoint + newDuration;
                        }
                        self.adjustPrecomp(precompItem, bounds);
                        var finalPosition = [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 0];
                        precompLayer.transform.position.setValue(finalPosition);
                    }
                    createdCount++;
                }
                if (createdCount > 0) self.updateStatus(createdCount + " camada(s) convertida(s).", "success");

            } else { // MODO GRUPO
                var precompName = this.ui.precompName.text;
                if (precompName === this.Theme.text.namePlaceholder) { precompName = "Crop_Inteligente"; }

                var minInPoint = Infinity;
                var maxOutPoint = -Infinity;
                for (var i = 0; i < selectedLayers.length; i++) {
                    if (selectedLayers[i].inPoint < minInPoint) minInPoint = selectedLayers[i].inPoint;
                    if (selectedLayers[i].outPoint > maxOutPoint) maxOutPoint = selectedLayers[i].outPoint;
                }
                
                var bounds = self.calculateBounds(comp, selectedLayers);
                if (!bounds || bounds.width <= 0 || bounds.height <= 0) { throw new Error("Não foi possível calcular os limites das layers."); }
                
                var selectedIndices = []; for (var i = 0; i < selectedLayers.length; i++) { selectedIndices.push(selectedLayers[i].index); }
                var precompLayer = comp.layers.precompose(selectedIndices, precompName, true);
                var precompItem = precompLayer.source;
                
                if (precompLayer) {
                    // CORREÇÃO DEFINITIVA: Lógica de 3 passos para sincronia de tempo.
                    var newDuration = maxOutPoint - minInPoint;
                    if (newDuration > 0) {
                        // 1. Ajusta a duração da composição interna.
                        precompItem.duration = newDuration;
                        // 2. Desloca as camadas internas para começar em tempo 0.
                        for (var j = 1; j <= precompItem.numLayers; j++) {
                            precompItem.layer(j).startTime = precompItem.layer(j).startTime - minInPoint;
                        }
                        // 3. Sincroniza a camada externa na timeline principal.
                        precompLayer.startTime = 0;
                        precompLayer.inPoint = minInPoint;
                        precompLayer.outPoint = minInPoint + newDuration;
                    }

                    self.adjustPrecomp(precompItem, bounds);
                    var finalPosition = [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 0];
                    precompLayer.transform.position.setValue(finalPosition);
                }
                
                if (this.ui.precompReveal.value) { precompItem.openInViewer(); }
                self.updateStatus("Crop em grupo '" + precompName + "' concluído.", "success");
            }

        } catch (error) { this.updateStatus(error.message, "error"); } finally { app.endUndoGroup(); }
    };
    
    // O resto das funções (calculateBounds, runProjectMode, etc) permanecem sem alteração
    CropComp.calculateBounds = function(comp, layers) { var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; var hasValidBounds = false; for (var i = 0; i < layers.length; i++) { var layer = layers[i]; if (!layer.enabled) continue; var timeToSample = layer.inPoint; if ((layer instanceof AVLayer) && layer.hasVideo) { timeToSample += comp.frameDuration; } try { var layerBounds = this.getLayerBoundsAtTime(layer, timeToSample); if (layerBounds) { minX = Math.min(minX, layerBounds.left); minY = Math.min(minY, layerBounds.top); maxX = Math.max(maxX, layerBounds.right); maxY = Math.max(maxY, layerBounds.bottom); hasValidBounds = true; } } catch (e) {} } if (!hasValidBounds) return null; return { left: minX, top: minY, width: maxX - minX, height: maxY - minY, right: maxX, bottom: maxY }; };
    CropComp.runProjectMode = function() { try { var width = parseInt(this.ui.createWidth.text, 10); var height = parseInt(this.ui.createHeight.text, 10); var fps = parseFloat(this.ui.createFps.text); var duration = parseFloat(this.ui.createDuration.text); if (isNaN(width) || isNaN(height) || isNaN(fps) || isNaN(duration)) throw new Error("Valores de dimensão, FPS ou duração são inválidos."); var projectItems = app.project.selection; if (projectItems.length === 0) throw new Error("Nenhum item selecionado no painel de Projeto."); app.beginUndoGroup("CropComp: Transformar Footage"); var createdCount = 0; for (var i = 0; i < projectItems.length; i++) { var item = projectItems[i]; if (!(item instanceof FootageItem)) continue; try { this.updateStatus("Transformando '" + item.name + "'...", "info"); var newComp = app.project.items.addComp(item.name + " Comp", width, height, 1.0, duration, (item.frameRate > 0 ? item.frameRate : fps)); var newLayer = newComp.layers.add(item); if (this.ui.createAutoScale.value && newLayer.width > 0 && newLayer.height > 0) { var scaleFactor = Math.min(width / newLayer.width, height / newLayer.height); newLayer.property("Scale").setValue([scaleFactor * 100, scaleFactor * 100]); newLayer.property("Position").setValue([width / 2, height / 2]); } createdCount++; } catch(e) { this.updateStatus("Falha ao transformar '" + item.name + "'.", "error"); } } app.endUndoGroup(); if (createdCount > 0) this.updateStatus(createdCount + " comp(s) criada(s) com sucesso!", "success"); else this.updateStatus("Nenhum footage válido foi selecionado.", "warning"); } catch(e) { this.updateStatus(e.message, "error"); } };
    CropComp.runResizeCompsMode = function() { try { var compsToResize = []; var activeComp = app.project.activeItem; if (activeComp instanceof CompItem && activeComp.selectedLayers.length === 0 && app.project.selection.length === 0) { compsToResize.push(activeComp); } else { for (var i = 0; i < app.project.selection.length; i++){ if (app.project.selection[i] instanceof CompItem) { compsToResize.push(app.project.selection[i]); } } } if (compsToResize.length === 0) throw new Error("Nenhuma comp selecionada para redimensionar."); var newWidth = parseInt(this.ui.resizeWidth.text, 10); var newHeight = parseInt(this.ui.resizeHeight.text, 10); if (isNaN(newWidth) || isNaN(newHeight)) throw new Error("Novas dimensões são inválidas."); app.beginUndoGroup("CropComp: Redimensionar Comps"); var resizedCount = 0; for (var i = 0; i < compsToResize.length; i++) { var comp = compsToResize[i]; try { this.updateStatus("Redimensionando '" + comp.name + "'...", "info"); var oldWidth = comp.width; var oldHeight = comp.height; comp.width = newWidth; comp.height = newHeight; if (this.ui.resizeChangeFpsCheck.value) comp.frameRate = parseFloat(this.ui.resizeFps.text); if (this.ui.resizeChangeDurationCheck.value) comp.duration = parseFloat(this.ui.resizeDuration.text); if (this.ui.resizeScaleContent.value && oldWidth > 0 && oldHeight > 0) { var scaleX = newWidth / oldWidth; var scaleY = newHeight / oldHeight; for (var j = 1; j <= comp.numLayers; j++) { var layer = comp.layer(j); if (layer instanceof CameraLayer || layer instanceof LightLayer) continue; this.rescaleLayer(layer, scaleX, scaleY); } } resizedCount++; } catch(e) { this.updateStatus("Falha ao redimensionar a comp '" + comp.name + "'.", "error"); } } app.endUndoGroup(); if (resizedCount > 0) this.updateStatus(resizedCount + " comp(s) redimensionada(s)!", "success"); } catch(e) { this.updateStatus(e.message, "error"); } };
    CropComp.rescaleLayer = function(layer, scaleX, scaleY){ var pos = layer.property("Position"); if(pos && pos.value.length >= 2) { if (pos.numKeys === 0) { var p = pos.value; pos.setValue([p[0] * scaleX, p[1] * scaleY, p[2] || 0]); } else { for (var k=1; k<=pos.numKeys; k++){ var p = pos.keyValue(k); pos.setValueAtKey(k, [p[0] * scaleX, p[1] * scaleY, p[2] || 0]); } } } var scale = layer.property("Scale"); if(scale) { if (scale.numKeys === 0) { var s = scale.value; scale.setValue([s[0] * scaleX, s[1] * scaleY, s[2] || 100]); } else { for (var k=1; k<=scale.numKeys; k++){ var s = scale.keyValue(k); scale.setValueAtKey(k, [s[0] * scaleX, s[1] * scaleY, s[2] || 100]); } } } };
    CropComp.adjustPrecomp = function(precomp, boundsInMainComp) { var layersInPrecomp = this.getAllLayersFromComp(precomp); var time = 0; precomp.width = Math.ceil(boundsInMainComp.width); precomp.height = Math.ceil(boundsInMainComp.height); for (var i = 0; i < layersInPrecomp.length; i++) { var layer = layersInPrecomp[i]; if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) { try { var rect = layer.sourceRectAtTime(time, true); if (rect.width === 0 && rect.height === 0) continue; var anchorProp = layer.transform.anchorPoint; var posProp = layer.transform.position; var currentAnchor = anchorProp.value; var targetAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2]; var dAnchorX = targetAnchor[0] - currentAnchor[0]; var dAnchorY = targetAnchor[1] - currentAnchor[1]; if (Math.abs(dAnchorX) < 0.01 && Math.abs(dAnchorY) < 0.01) continue; var scale = layer.transform.scale.valueAtTime(time, false); var rotation = layer.transform.rotation.valueAtTime(time, false); var sx = scale[0] / 100.0; var sy = scale[1] / 100.0; var r = rotation * Math.PI / 180.0; var compVec_x = (dAnchorX * sx * Math.cos(r)) - (dAnchorY * sy * Math.sin(r)); var compVec_y = (dAnchorX * sx * Math.sin(r)) + (dAnchorY * sy * Math.cos(r)); anchorProp.setValue(targetAnchor); this.applyOffsetToProperty(posProp, [compVec_x, compVec_y]); } catch (e) {} } } var boundsInPrecomp = this.calculateBounds(precomp, layersInPrecomp); if (!boundsInPrecomp) return; var precompCenterX = precomp.width / 2; var precompCenterY = precomp.height / 2; var contentCenterX = boundsInPrecomp.left + (boundsInPrecomp.width / 2); var contentCenterY = boundsInPrecomp.top + (boundsInPrecomp.height / 2); var internalOffset = [precompCenterX - contentCenterX, precompCenterY - contentCenterY]; for (var i = 0; i < layersInPrecomp.length; i++) { this.applyOffsetToProperty(layersInPrecomp[i].transform.position, internalOffset); } };
    CropComp.getLayerBoundsAtTime = function(layer, time) { var rect; if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) { try { rect = layer.sourceRectAtTime(time, true); } catch (e) { rect = { top: 0, left: 0, width: 0, height: 0 }; } } else if (layer.source) { rect = { top: 0, left: 0, width: layer.source.width, height: layer.source.height }; } else { return null; } if (rect.width <= 0 || rect.height <= 0) return null; var corners = [ [rect.left, rect.top], [rect.left + rect.width, rect.top], [rect.left + rect.width, rect.top + rect.height], [rect.left, rect.top + rect.height] ]; var position = layer.transform.position.valueAtTime(time, false); var anchorPoint = layer.transform.anchorPoint.valueAtTime(time, false); var scale = layer.transform.scale.valueAtTime(time, false); var rotation = layer.transform.rotation.valueAtTime(time, false); var rad = -rotation * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad), sx = scale[0] / 100, sy = scale[1] / 100; var transformedCorners = []; for (var i = 0; i < 4; i++) { var corner = corners[i], x = corner[0] - anchorPoint[0], y = corner[1] - anchorPoint[1]; x *= sx; y *= sy; var rotatedX = x * cos - y * sin, rotatedY = x * sin + y * cos; transformedCorners.push([rotatedX + position[0], rotatedY + position[1]]); } var minX = transformedCorners[0][0], maxX = transformedCorners[0][0], minY = transformedCorners[0][1], maxY = transformedCorners[0][1]; for (var i = 1; i < 4; i++) { minX = Math.min(minX, transformedCorners[i][0]); maxX = Math.max(maxX, transformedCorners[i][0]); minY = Math.min(minY, transformedCorners[i][1]); maxY = Math.max(maxY, transformedCorners[i][1]); } return { left: minX, top: minY, right: maxX, bottom: maxY }; };
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
}
