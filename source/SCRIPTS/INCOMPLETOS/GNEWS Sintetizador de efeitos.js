/**********************************************************************************
 *
 * Sincronizador de Efeitos
 * © 2025
 *
 * Autor: Gemini (Google AI)
 * Versão: 1.0
 *
 * DESCRIÇÃO:
 * - Este script cria um painel dedicado para a funcionalidade de sincronizar
 * efeitos entre camadas, extraído do "Kit de Ferramentas Definitivo".
 *
 **********************************************************************************/

(function createEffectSynchronizer(thisObj) {
    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Sincronizador de Efeitos v1.0", undefined, { resizeable: true });
    if (pal === null) return;
    pal.orientation = "column";
    pal.alignChildren = ["fill", "fill"];
    pal.spacing = 10;
    pal.margins = 15;

    // --- FUNÇÕES HELPER ---
    function getLayers(comp, needsSelection) {
        if (!comp || !(comp instanceof CompItem)) {
            if (feedbackTxt) feedbackTxt.text = "ERRO: Nenhuma composição ativa.";
            return null;
        }
        var layers = [];
        if (comp.selectedLayers.length > 0) {
            for (var i = 0; i < comp.selectedLayers.length; i++) layers.push(comp.selectedLayers[i]);
        } else if (!needsSelection) {
            for (var i = 1; i <= comp.numLayers; i++) layers.push(comp.layer(i));
        } else {
            if (feedbackTxt) feedbackTxt.text = "ERRO: Por favor, selecione pelo menos uma camada.";
            return null;
        }
        return layers;
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

    // --- UI ---
    var syncPanel = pal.add("panel", undefined, "Sincronizador de Efeitos");
    syncPanel.alignChildren = 'fill';
    syncPanel.spacing = 10;
    syncPanel.margins = 15;
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
    
    var statusPanel = pal.add('panel', undefined, "Status");
    statusPanel.alignment = 'fill';
    statusPanel.margins = 10;
    var feedbackTxt = statusPanel.add("statictext", undefined, "Pronto.", {multiline: true});
    feedbackTxt.alignment = ["fill", "center"];
    feedbackTxt.preferredSize.height = 30;

    pal.layout.layout(true);
    pal.onResizing = pal.onResize = function() { this.layout.resize(); }

    // --- LÓGICA DOS BOTÕES ---
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
    
    if (pal instanceof Window) {
        pal.center();
        pal.show();
    }
})(this);