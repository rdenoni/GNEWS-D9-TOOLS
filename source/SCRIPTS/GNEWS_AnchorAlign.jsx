/*
    Script: Anchor Align v1.2.1 (Módulo para GND9TOOLS)
    Data: 12/10/2025
    Update: 14/10/2025 - Padronizado com a lógica de UI e chamadas do GNEWS_Templates.
    Fix: 14/10/2025 - Removido Object.create incompatível com ExtendScript.
*/

// Objeto principal que encapsula toda a lógica do script.
var AnchorMaster = {
    // Objeto para armazenar referências aos elementos da interface gráfica (UI).
    ui: {},

    // --- Configurações da Interface ---
    config: {
        windowTitle: "GNEWS ANCHOR ALIGN",
        headerTitle: "GNEWS ANCHOR ALIGN",
        subtitleText: "Alinha pontos âncora de camadas e shapes.",
        version: "v1.2.1",
        windowSize: [200, 380],
        buttonSize: [58, 46], // Ajuste rápido da largura/altura dos botões temáticos
        helpButtonSize: [24, 24], 
        panelMargins: 12,
        panelSpacing: 7,
        buttonRowSpacing: 7,
        colors: {
            background: (typeof bgColor1 !== 'undefined') ? bgColor1 : '#191919',
            highlight: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#D4003C',
            text: (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA'
        }
    },
    
    // --- Constantes Internas do After Effects ---
    constants: {
        MATCH_VECTOR_GROUP: "ADBE Vector Group",
        MATCH_VECTOR_SHAPE: "ADBE Vector Shape",
        MATCH_TRANSFORM_GROUP: "ADBE Vector Transform Group",
        PROGRESS_THRESHOLD: 10
    },

    handleButtonClick: function(posicao) {
        if (this.ui.chkSincronizarContents.value) {
            this.executeSync(posicao);
        } else {
            this.executeReposition(posicao);
        }
    },
    
    executeReposition: function(posicao) {
        app.beginUndoGroup(this.config.headerTitle + ": Reposicionar Âncora");
        var itemsToProcess = [];
        var mode = "";
        var comp = app.project.activeItem;
        if (!comp) { app.endUndoGroup(); return; }
        var selectedProps = comp.selectedProperties;
        if (selectedProps && selectedProps.length > 0) {
            for (var i = 0; i < selectedProps.length; i++) {
                var prop = selectedProps[i];
                if (!prop || !prop.matchName) continue;
                if (prop.matchName === this.constants.MATCH_VECTOR_GROUP) {
                    mode = "ShapeGroup"; itemsToProcess.push(prop);
                } else if (prop.matchName === this.constants.MATCH_TRANSFORM_GROUP) {
                    if (prop.parentProperty.matchName === "ADBE Root Vectors Group") {
                       mode = "ShapeContentsTransform"; itemsToProcess.push(prop);
                    } else {
                       mode = "ShapeGroup"; itemsToProcess.push(prop.parentProperty);
                    }
                }
            }
        }
        if (itemsToProcess.length === 0 && comp.selectedLayers.length > 0) {
            mode = "Layer"; itemsToProcess = comp.selectedLayers;
        }
        if (itemsToProcess.length === 0 && comp.selectedLayers.length === 0) {
            mode = "Layer";
            for (var i = 1; i <= comp.numLayers; i++) { itemsToProcess.push(comp.layer(i)); }
        }
        if (itemsToProcess.length === 0) {
            this.ui.statusText.text = "ERRO: Selecione camadas ou propriedades.";
            app.endUndoGroup(); return;
        }
        var processed = 0, skipped = 0;
        for (var j = 0; j < itemsToProcess.length; j++) {
            var item = itemsToProcess[j];
            if (!item) { skipped++; continue; }
            var containingLayer = (mode === 'Layer') ? item : this.getContainingLayer(item);
            var shouldSkip = containingLayer && ((this.ui.chkIgnorarBloqueadas.value && containingLayer.locked) || (this.ui.chkIgnorarAnimadas.value && this.hasAnimation(containingLayer)));
            if (shouldSkip) {
                skipped++;
                continue;
            }
            var processedThisItem = false;
            switch (mode) {
                case "Layer":
                    if (item instanceof AVLayer || item instanceof ShapeLayer || item instanceof TextLayer) {
                        this.repositionLayerAnchor(item, posicao);
                        processedThisItem = true;
                    }
                    break;
                case "ShapeGroup":
                    this.repositionShapeGroupAnchor(item, posicao);
                    processedThisItem = true;
                    break;
                case "ShapeContentsTransform":
                    this.repositionShapeContentsTransform(item, posicao);
                    processedThisItem = true;
                    break;
            }
            if (processedThisItem) { processed++; } else { skipped++; }
        }
        this.ui.statusText.text = "Concluído: " + processed + " ajustado(s), " + skipped + " ignorado(s).";
        app.endUndoGroup();
    },

    executeSync: function(posicao) {
        app.beginUndoGroup(this.config.headerTitle + ": Sincronizar Âncora");
        var comp = app.project.activeItem;
        if (!comp) { app.endUndoGroup(); return; }
        var layersToProcess = comp.selectedLayers;
        if (layersToProcess.length === 0) {
            layersToProcess = [];
            for (var i = 1; i <= comp.numLayers; i++) { layersToProcess.push(comp.layer(i)); }
        }
        if (layersToProcess.length === 0) {
            this.ui.statusText.text = "ERRO: Nenhuma camada na composição.";
            app.endUndoGroup(); return;
        }
        var processed = 0, skipped = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            var layer = layersToProcess[i];
            if ((this.ui.chkIgnorarBloqueadas.value && layer.locked) || (this.ui.chkIgnorarAnimadas.value && this.hasAnimation(layer))) {
                skipped++;
                continue;
            }
            if (!(layer instanceof AVLayer || layer instanceof ShapeLayer || layer instanceof TextLayer)) {
                skipped++;
                continue;
            }
            this.repositionLayerAnchor(layer, posicao);
            if (layer instanceof ShapeLayer) {
                var mainTransform = layer.property("Transform");
                var contentsTransform = this.findTargetTransformInLayer(layer);
                if (contentsTransform) {
                    this.alignAndCompensate(mainTransform, contentsTransform);
                }
            }
            processed++;
        }
        this.ui.statusText.text = "Sincronizado: " + processed + " alinhada(s), " + skipped + " ignorada(s).";
        app.endUndoGroup();
    },
    
    findTargetTransformInLayer: function(layer) {
        var selectedProps = layer.containingComp.selectedProperties;
        for (var i = 0; i < selectedProps.length; i++) {
            var prop = selectedProps[i];
            if (this.isPropertyOfLayer(prop, layer)) {
                if (prop.matchName === "ADBE Vector Transform Group" && prop.parentProperty.matchName === "ADBE Vector Group") {
                    return prop;
                }
            }
        }
        var contents = layer.property("Contents");
        if (contents && contents.numProperties === 1) {
            try {
                var transform = contents.property(1).property("Transform");
                if (transform && transform.matchName === "ADBE Vector Transform Group") return transform;
            } catch (e) {}
        }
        return null;
    },
    alignAndCompensate: function(mainTransform, contentsTransform) {
        var mainAnchorProp = mainTransform.property("Anchor Point");
        var contentsAnchorProp = contentsTransform.property("Anchor Point");
        var contentsPositionProp = contentsTransform.property("Position");
        var mainAnchorValue = mainAnchorProp.value;
        var oldContentsAnchor = contentsAnchorProp.value;
        var oldContentsPosition = contentsPositionProp.value;
        var targetAnchorValue;
        if (mainAnchorValue.length === 3) {
            targetAnchorValue = [mainAnchorValue[0], mainAnchorValue[1]];
        } else {
            targetAnchorValue = mainAnchorValue;
        }
        var deltaX = targetAnchorValue[0] - oldContentsAnchor[0];
        var deltaY = targetAnchorValue[1] - oldContentsAnchor[1];
        var newContentsPosition = [ oldContentsPosition[0] + deltaX, oldContentsPosition[1] + deltaY ];
        contentsAnchorProp.setValue(targetAnchorValue);
        contentsPositionProp.setValue(newContentsPosition);
    },
    isPropertyOfLayer: function(prop, layer) {
        var parent = prop;
        while (parent) {
            if (parent === layer) return true;
            if (!parent.parentProperty) return false;
            parent = parent.parentProperty;
        }
        return false;
    },
    repositionLayerAnchor: function(layer, posicao) {
        var bounds = this.getLayerBounds(layer, this.ui.chkConsiderarMascaras.value);
        if (!bounds) return;
        var transform = layer.property("Transform");
        var anchorProp = transform.property("Anchor Point");
        var positionProp = transform.property("Position");
        var scaleProp = transform.property("Scale");
        var oldAnchor = anchorProp.value;
        var oldPosition = positionProp.value;
        var scale = scaleProp.value;
        var rotation = 0;
        if (transform.property("Rotation")) {
            rotation = transform.property("Rotation").value;
        }
        var rotationRadians = this.degreesToRadians(rotation);
        var newAnchor = this.calculateNewAnchor(bounds, posicao, layer.threeDLayer);
        anchorProp.setValue(newAnchor);
        var delta = [newAnchor[0] - oldAnchor[0], newAnchor[1] - oldAnchor[1]];
        var scaledDelta = [delta[0] * (scale[0] / 100), delta[1] * (scale[1] / 100)];
        var cosR = Math.cos(rotationRadians);
        var sinR = Math.sin(rotationRadians);
        var rotatedDelta = [
            scaledDelta[0] * cosR - scaledDelta[1] * sinR,
            scaledDelta[0] * sinR + scaledDelta[1] * cosR
        ];
        var newPosition = [oldPosition[0] + rotatedDelta[0], oldPosition[1] + rotatedDelta[1]];
        if (oldPosition.length === 3) newPosition.push(oldPosition[2]);
        positionProp.setValue(newPosition);
    },
    degreesToRadians: function(degrees) { return degrees * (Math.PI / 180); },
    repositionShapeGroupAnchor: function(group, posicao) {
        var transformGroup = group.property(this.constants.MATCH_TRANSFORM_GROUP); if (!transformGroup) return;
        var bounds = this.getShapeGroupBounds(group); if (!bounds) return;
        var anchorProp = transformGroup.property("Anchor Point");
        var positionProp = transformGroup.property("Position");
        var newAnchor = this.calculateNewAnchor(bounds, posicao, false);
        this.applyTransform(anchorProp, positionProp, newAnchor);
    },
    repositionShapeContentsTransform: function(transformGroup, posicao) {
        var layer = this.getContainingLayer(transformGroup); if (!layer) return;
        var bounds = layer.sourceRectAtTime(layer.containingComp.time, false);
        if (!bounds || bounds.width === 0 || bounds.height === 0) {
             this.ui.statusText.text = "Aviso: Shape vazia."; return;
        }
        var anchorProp = transformGroup.property("Anchor Point");
        var positionProp = transformGroup.property("Position");
        var newAnchor = this.calculateNewAnchor(bounds, posicao, false);
        this.applyTransform(anchorProp, positionProp, newAnchor);
    },
    applyTransform: function(anchorProp, positionProp, newAnchor) {
        if (!anchorProp || !positionProp || !newAnchor) return;
        var layer = this.getContainingLayer(anchorProp);
        if (!layer) return;
        try {
            var oldAnchorInComp = layer.toComp(anchorProp.value);
            anchorProp.setValue(newAnchor);
            var newAnchorInComp = layer.toComp(newAnchor);
            var deltaPos = [oldAnchorInComp[0] - newAnchorInComp[0], oldAnchorInComp[1] - newAnchorInComp[1]];
            var currentPosition = positionProp.value;
            var newPos = (currentPosition.length === 3) ?
                [currentPosition[0] + deltaPos[0], currentPosition[1] + deltaPos[1], currentPosition[2]] :
                [currentPosition[0] + deltaPos[0], currentPosition[1] + deltaPos[1]];
            positionProp.setValue(newPos);
        } catch(e) {}
    },
    getLayerBounds: function(layer, useMasks) {
        if (useMasks && layer.property("Masks").numProperties > 0) {
            return this.getMasksBounds(layer);
        }
        return layer.sourceRectAtTime(layer.containingComp.time, false);
    },
    getMasksBounds: function(layer) {
        var masks = layer.property("Masks"), minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, hasBounds = false;
        for (var i = 1; i <= masks.numProperties; i++) {
            var mask = masks.property(i);
            if (mask.maskMode === MaskMode.ADD || mask.maskMode === MaskMode.INTERSECT) {
                var path = mask.property("Mask Path").value;
                if (!path || !path.vertices || path.vertices.length === 0) continue;
                for (var v = 0; v < path.vertices.length; v++) {
                    var point = path.vertices[v]; minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
                    minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]); hasBounds = true;
                }
            }
        }
        if (!hasBounds) return null;
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    },
    getShapeGroupBounds: function(group) {
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, hasBounds = false, self = this;
        function findBoundsRecursive(currentGroup) {
            var container = currentGroup.property("Contents") || currentGroup; if (!container) return;
            for (var i = 1; i <= container.numProperties; i++) {
                var prop = container.property(i);
                if (prop.matchName === self.constants.MATCH_VECTOR_GROUP) { findBoundsRecursive(prop);
                } else if (prop.matchName === self.constants.MATCH_VECTOR_SHAPE) {
                    var pathProp = prop.property("Path");
                    if (!pathProp) continue;
                    var path = pathProp.value;
                    if (!path || !path.vertices || path.vertices.length === 0) continue;
                    for (var v = 0; v < path.vertices.length; v++) {
                        var point = path.vertices[v]; minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]); hasBounds = true;
                    }
                }
            }
        }
        findBoundsRecursive(group);
        if (!hasBounds) return null;
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    },
    calculateNewAnchor: function(rect, posicao, is3D) {
        var novoAncora;
        switch (posicao) {
            case "left": novoAncora = [rect.left, rect.top + rect.height / 2]; break;
            case "right": novoAncora = [rect.left + rect.width, rect.top + rect.height / 2]; break;
            case "up": novoAncora = [rect.left + rect.width / 2, rect.top]; break;
            case "down": novoAncora = [rect.left + rect.width / 2, rect.top + rect.height]; break;
            case "topLeft": novoAncora = [rect.left, rect.top]; break;
            case "topRight": novoAncora = [rect.left + rect.width, rect.top]; break;
            case "bottomLeft": novoAncora = [rect.left, rect.top + rect.height]; break;
            case "bottomRight": novoAncora = [rect.left + rect.width, rect.top + rect.height]; break;
            default: novoAncora = [rect.left + rect.width / 2, rect.top + rect.height / 2]; break;
        }
        if (is3D) novoAncora.push(0);
        return novoAncora;
    },
    getContainingLayer: function(prop) {
        var parent = prop;
        while (parent) {
            if (parent.containingLayer) { return parent.containingLayer; }
            parent = parent.parentProperty;
        }
        return null;
    },
    hasAnimation: function(layer) {
        try {
            var transform = layer.property("Transform"); if (!transform) return false;
            for (var i = 1; i <= transform.numProperties; i++) {
                var prop = transform.property(i);
                if (prop && (prop.numKeys > 0 || (prop.expressionEnabled && prop.expression !== ""))) { return true; }
            }
        } catch (e) { return false; }
        return false;
    },

    showHelp: function() {
        if (typeof showAnchorAlignHelp === 'function') {
            showAnchorAlignHelp();
        } else {
            alert("A função de ajuda 'showAnchorAlignHelp' não foi encontrada.\nVerifique se a 'HELP lib.js' está carregada.");
        }
    },

    buildUI: function(thisObj) {
        var self = this;
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", self.config.windowTitle + " " + self.config.version, undefined, { resizeable: false });
        self.ui.win = win;
        win.preferredSize = self.config.windowSize;
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 5;
        win.margins = 10;
        
        if (typeof setBgColor === 'function') { setBgColor(win, self.config.colors.background); } 

        var headerGrp = win.add("group");
        headerGrp.orientation = "row";
        headerGrp.alignChildren = ["left", "center"];
        headerGrp.alignment = ["fill", "top"];
        
        var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
        var PREFS_KEY = "AnchorAlign";
        var defaultPrefs = {
            syncContents: false,
            considerMasks: false,
            ignoreLocked: true,
            ignoreAnimated: true
        };
        var modulePrefs = prefsApi ? prefsApi.getModulePrefs(PREFS_KEY) : {};
        if (typeof modulePrefs !== 'object' || modulePrefs === null) { modulePrefs = {}; }
        function getPrefValue(key) {
            return modulePrefs.hasOwnProperty(key) ? modulePrefs[key] : defaultPrefs[key];
        }
        function setPrefValue(key, value, persist) {
            modulePrefs[key] = value;
            if (prefsApi) { prefsApi.setModulePref(PREFS_KEY, key, value, !!persist); }
        }

        var subtitleText = headerGrp.add("statictext", undefined, self.config.subtitleText);
        subtitleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 13);
        subtitleText.alignment = ["left", "center"];
        if (typeof setFgColor === 'function') { setFgColor(subtitleText, self.config.colors.highlight); }
        
        var helpButton;
        var helpBtnGrp = headerGrp.add('group');
        helpBtnGrp.alignment = ['right', 'center'];
        if (typeof themeIconButton === 'function' && typeof D9T_INFO_ICON !== 'undefined') {
            helpButton = new themeIconButton(helpBtnGrp, { icon: D9T_INFO_ICON, tips: ['Ajuda | Documentação'] });
        } else {
            helpButton = helpBtnGrp.add('button', undefined, '?');
            helpButton.preferredSize = self.config.helpButtonSize;
        }


        function lockButtonSize(ctrl, width, height) {
            if (!ctrl) { return; }
            if (typeof width === 'number' && typeof height === 'number') {
                var sizeArray = [width, height];
                ctrl.preferredSize = sizeArray;
                ctrl.minimumSize = sizeArray;
                ctrl.maximumSize = sizeArray;
                ctrl.size = sizeArray;
            }
            ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
            if (typeof width === 'number') { ctrl.__buttonThemeOverrides.width = width; }
            if (typeof height === 'number') { ctrl.__buttonThemeOverrides.height = height; }
        }

        function enforceButtonSizeGuards(ctrl, width, height) {
            if (!ctrl) { return; }
            lockButtonSize(ctrl, width, height);
            if (typeof ctrl.onDraw === 'function') {
                var originalDraw = ctrl.onDraw;
                ctrl.onDraw = function() {
                    lockButtonSize(this, width, height);
                    originalDraw.apply(this, arguments);
                };
            } else {
                ctrl.onDraw = function() { lockButtonSize(this, width, height); };
            }
            if (typeof ctrl.addEventListener === 'function') {
                var relock = function() { lockButtonSize(this, width, height); };
                var events = ["mouseover", "mouseout", "mousedown", "mouseup"];
                for (var e = 0; e < events.length; e++) {
                    try { ctrl.addEventListener(events[e], relock); } catch (evtErr) {}
                }
            }
            if (typeof D9T_applyThemeToButtonControl === 'function') {
                try {
                    var baseTheme = ctrl.__buttonThemeSource;
                    if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') {
                        baseTheme = D9T_getActiveButtonTheme();
                    }
                    D9T_applyThemeToButtonControl(ctrl, baseTheme);
                } catch (themeErr) {}
            }
        }

        function createAnchorButton(parent, glyph, tip, key) {
            var buttonCtrl;
            var btnWidth = self.config.buttonSize[0];
            var btnHeight = self.config.buttonSize[1];
            if (typeof themeButton === 'function') {
                var btnWrapper = new themeButton(parent, { labelTxt: glyph, width: btnWidth, height: btnHeight });
                buttonCtrl = btnWrapper.label;
            } else {
                buttonCtrl = parent.add("button", undefined, glyph);
            }
            enforceButtonSizeGuards(buttonCtrl, btnWidth, btnHeight);
            buttonCtrl.alignment = ['center','center'];
            buttonCtrl.helpTip = tip;
            buttonCtrl.onClick = function() { self.handleButtonClick(key); };
            return buttonCtrl;
        }

        var panel = win.add("panel", undefined);
        panel.orientation = "column"; panel.alignChildren = ["center", "center"]; panel.spacing = self.config.panelSpacing; panel.margins = self.config.panelMargins;
        
        var btnRow1 = panel.add("group"); btnRow1.spacing = self.config.buttonRowSpacing; btnRow1.alignChildren = ['center','center'];
        var btnTL = createAnchorButton(btnRow1, "↖", "Âncora no canto superior esquerdo", "topLeft");
        var btnUp = createAnchorButton(btnRow1, "↑", "Âncora no topo", "up");
        var btnTR = createAnchorButton(btnRow1, "↗", "Âncora no canto superior direito", "topRight");
        
        var btnRow2 = panel.add("group"); btnRow2.spacing = self.config.buttonRowSpacing; btnRow2.alignChildren = ['center','center'];
        var btnLeft = createAnchorButton(btnRow2, "←", "Âncora à esquerda", "left");
        var btnCenter = createAnchorButton(btnRow2, "•", "Âncora central", "center");
        var btnRight = createAnchorButton(btnRow2, "→", "Âncora à direita", "right");

        var btnRow3 = panel.add("group"); btnRow3.spacing = self.config.buttonRowSpacing; btnRow3.alignChildren = ['center','center'];
        var btnBL = createAnchorButton(btnRow3, "↙", "Âncora no canto inferior esquerdo", "bottomLeft");
        var btnDown = createAnchorButton(btnRow3, "↓", "Âncora na parte inferior", "down");
        var btnBR = createAnchorButton(btnRow3, "↘", "Âncora no canto inferior direito", "bottomRight");
        var optionsGroup = win.add("panel", undefined, "Opções");
        optionsGroup.orientation = "column"; optionsGroup.alignChildren = ["left", "top"];
        
        var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
        var PREFS_KEY = "AnchorAlign";
        var defaultPrefs = {
            syncContents: false,
            considerMasks: false,
            ignoreLocked: true,
            ignoreAnimated: true
        };
        var modulePrefs = prefsApi ? prefsApi.getModulePrefs(PREFS_KEY) : {};
        if (typeof modulePrefs !== 'object' || modulePrefs === null) { modulePrefs = {}; }
        function getPrefValue(key) {
            return modulePrefs.hasOwnProperty(key) ? modulePrefs[key] : defaultPrefs[key];
        }
        function setPrefValue(key, value, persist) {
            modulePrefs[key] = value;
            if (prefsApi) { prefsApi.setModulePref(PREFS_KEY, key, value, !!persist); }
        }

        self.ui.chkSincronizarContents = optionsGroup.add("checkbox", undefined, "Sincronizar Contents");
        self.ui.chkSincronizarContents.helpTip = "Se marcado, alinha a âncora da camada e do Contents simultaneamente.";
        self.ui.chkSincronizarContents.value = getPrefValue("syncContents");
        
        self.ui.chkConsiderarMascaras = optionsGroup.add("checkbox", undefined, "Considerar máscaras");
        self.ui.chkIgnorarBloqueadas = optionsGroup.add("checkbox", undefined, "Ignorar bloqueadas");
        self.ui.chkIgnorarAnimadas = optionsGroup.add("checkbox", undefined, "Ignorar com animação");
        self.ui.chkConsiderarMascaras.value = getPrefValue("considerMasks"); self.ui.chkIgnorarBloqueadas.value = getPrefValue("ignoreLocked"); self.ui.chkIgnorarAnimadas.value = getPrefValue("ignoreAnimated");
        
        if (typeof setFgColor === 'function') {
            setFgColor(self.ui.chkSincronizarContents, self.config.colors.text);
            setFgColor(self.ui.chkConsiderarMascaras, self.config.colors.text);
            setFgColor(self.ui.chkIgnorarBloqueadas, self.config.colors.text);
            setFgColor(self.ui.chkIgnorarAnimadas, self.config.colors.text);
        }

        self.ui.chkSincronizarContents.onClick = function () { setPrefValue("syncContents", !!this.value, true); };
        self.ui.chkConsiderarMascaras.onClick = function () { setPrefValue("considerMasks", !!this.value, true); };
        self.ui.chkIgnorarBloqueadas.onClick = function () { setPrefValue("ignoreLocked", !!this.value, true); };
        self.ui.chkIgnorarAnimadas.onClick = function () { setPrefValue("ignoreAnimated", !!this.value, true); };

        var statusGroup = win.add("panel", undefined, "Status");
        statusGroup.alignChildren = ["fill", "fill"];
        self.ui.statusText = statusGroup.add("statictext", undefined, "Pronto para a ação!", {multiline:false});
        if (typeof setFgColor === 'function') { setFgColor(self.ui.statusText, self.config.colors.text); }

        if (helpButton.leftClick) {
            helpButton.leftClick.onClick = function() { self.showHelp(); };
        } else {
            helpButton.onClick = function() { self.showHelp(); };
        }
        

        win.onResizing = win.onResize = function() { if(this.layout) this.layout.resize(); };
        if (win instanceof Window) { win.center(); win.show(); } else { win.layout.layout(true); }
    }
};

/**
 * Ponto de entrada global para o After Effects.
 * @param {Object} thisObj - O contexto do painel (geralmente 'this').
 */
function launchAnchorAlign(thisObj) {
    AnchorMaster.buildUI(thisObj);
}
