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
 * "Normalizadores" e "Sincronizadores". Todas as ferramentas estão funcionais novamente.
 * - CONFIABILIDADE: As lógicas de correção das versões anteriores foram restauradas
 * e estão corretamente atribuídas a cada botão.
 *
 **********************************************************************************/

(function createUltimateToolkit_v13(thisObj) {
    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Kit de Ferramentas Definitivo v13.1", undefined, { resizeable: true });
    if (pal === null) return;
    pal.orientation = "column";
    pal.alignChildren = ["fill", "top"];
    pal.spacing = 5;
    pal.margins = 10;

    var mainTabbedPanel = pal.add("tabbedpanel");
    mainTabbedPanel.alignChildren = "fill";
    mainTabbedPanel.margins = 0;
    mainTabbedPanel.preferredSize.width = 320;

    // =======================================
    // --- ABA 1: NORMALIZADORES ---
    // =======================================
    var normTab = mainTabbedPanel.add("tab", undefined, "Normalizadores");
    normTab.alignChildren = ["fill", "top"];
    normTab.spacing = 10;
    normTab.margins = 10;
    
    var scalePanel = normTab.add("panel", undefined, "Escala");
    scalePanel.alignChildren = 'fill';
    var cbIncludeStrokeScale = scalePanel.add("checkbox", undefined, "Ajustar Largura do Stroke");
    cbIncludeStrokeScale.value = true;
    var normalizeScaleBtn = scalePanel.add("button", undefined, "\u21F2 Normalizar 100%");
    
    var otherNormsPanel = normTab.add("panel", undefined, "Rotação e Âncora");
    otherNormsPanel.alignChildren = 'fill';
    var rotBtnsGroup = otherNormsPanel.add("group");
    rotBtnsGroup.alignment = 'fill';
    var normalizeRotShapesBtn = rotBtnsGroup.add("button", [0,0,140,25], "\u21BB Rotação (Shapes)");
    var normalizeRotOtherBtn = rotBtnsGroup.add("button", [0,0,140,25], "\u21BB Rotação (Outras)");
    var normalizeAnchorBtn = otherNormsPanel.add("button", undefined, "\u2295 Âncora [0,0]");

    var strokeNormPanel = normTab.add("panel", undefined, "Largura do Stroke");
    strokeNormPanel.alignChildren = 'fill';
    var strokeNormGroup = strokeNormPanel.add("group");
    strokeNormGroup.add("statictext", undefined, "Definir Largura para:");
    var strokeWidthInput = strokeNormGroup.add("edittext", [0, 0, 60, 20], "5");
    var setStrokeWidthBtn = strokeNormGroup.add("button", undefined, "Aplicar");

    // =======================================
    // --- ABA 2: UTILITÁRIOS ---
    // =======================================
    var utilTab = mainTabbedPanel.add("tab", undefined, "Utilitários");
    utilTab.alignChildren = ["fill", "top"];
    utilTab.spacing = 10;
    utilTab.margins = 10;

    var lockUnlockPanel = utilTab.add("panel", undefined, "Bloqueio e Desbloqueio");
    lockUnlockPanel.alignChildren = 'fill';
    var lockBtn = lockUnlockPanel.add("button", undefined, "\uD83D\uDD12 Bloquear Transformações");
    var unlockBtn = lockUnlockPanel.add("button", undefined, "🔓 Desbloquear Transformações");
    var unlockLayersBtn = lockUnlockPanel.add("button", undefined, "🔓 Desbloquear Camadas (Cadeado)");

    var parentPanel = utilTab.add("panel", undefined, "Parentesco");
    parentPanel.alignChildren = 'fill';
    var unparentBtn = parentPanel.add("button", undefined, "\uD83D\uDD17 Desparentear");
    
    // =======================================
    // --- ABA 3: SINCRONIZADORES ---
    // =======================================
    var syncTab = mainTabbedPanel.add("tab", undefined, "Sincronizadores");
    syncTab.alignChildren = ["fill", "top"];
    syncTab.spacing = 10;
    syncTab.margins = 10;
    
    var syncPanel = syncTab.add("panel", undefined, "Sincronizador de Efeitos");
    syncPanel.alignChildren = 'fill';
    syncPanel.add("statictext", undefined, "Selecione a camada mestre ou deixe em branco para o modo global.");
    var fxDropdownGroup = syncPanel.add("group");
    var effectsDropdown = fxDropdownGroup.add("dropdownlist", undefined, ["- Atualize a Lista -"]);
    effectsDropdown.size = [220, 25];
    var updateFxListBtn = fxDropdownGroup.add("button", undefined, "\u21BB");
    updateFxListBtn.size = [30, 25];
    updateFxListBtn.helpTip = "Atualizar lista de efeitos";
    var cbCreateController = syncPanel.add("checkbox", undefined, "Criar Camada Controladora");
    cbCreateController.value = true;
    cbCreateController.helpTip = "Se desmarcado, linca diretamente ao efeito da camada mestre.";
    var linkEffectsBtn = syncPanel.add("button", undefined, "Sincronizar Efeito");
    
    // --- CAMPO DE FEEDBACK VISUAL ---
    var feedbackGroup = pal.add('group');
    feedbackGroup.orientation = 'row';
    feedbackGroup.alignment = 'fill';
    var feedbackTxt = feedbackGroup.add("statictext", [0, 0, 300, 40], "Pronto.", {multiline: true});
    
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