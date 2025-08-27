/**********************************************************************************
 *
 * Kit de Ferramentas - Utilitários
 * © 2025
 *
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 1.0
 *
 * DESCRIÇÃO:
 * - Este script cria um painel dedicado para as funcionalidades de Utilitários,
 * extraído do "Kit de Ferramentas Definitivo".
 *
 **********************************************************************************/

(function createUtilitiesToolkit(thisObj) {
    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Kit de Ferramentas - Utilitários v1.0", undefined, { resizeable: true });
    if (pal === null) return;
    pal.orientation = "column";
    pal.alignChildren = ["fill", "top"];
    pal.spacing = 10;
    pal.margins = 15;

    // --- FUNÇÕES HELPER ---
    function getLayers(needsSelection) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            if (feedbackTxt) feedbackTxt.text = "ERRO: Nenhuma composição ativa.";
            return null;
        }
        var layers = [];
        var sel = comp.selectedLayers;
        if (sel.length > 0) {
            for (var i = 0; i < sel.length; i++) layers.push(sel[i]);
        } else if (!needsSelection) {
            for (var i = 1; i <= comp.numLayers; i++) layers.push(comp.layer(i));
        } else {
            if (feedbackTxt) feedbackTxt.text = "ERRO: Por favor, selecione pelo menos uma camada.";
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

    // --- UI ---
    var titleText = pal.add("statictext", undefined, "Kit de Ferramentas - Utilitários");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
    
    var lockUnlockPanel = pal.add("panel", undefined, "Bloqueio e Desbloqueio");
    lockUnlockPanel.alignChildren = 'fill';
    lockUnlockPanel.spacing = 10;
    lockUnlockPanel.margins = 15;
    var lockBtn = lockUnlockPanel.add("button", undefined, "\uD83D\uDD12 Bloquear Transformações");
    var unlockBtn = lockUnlockPanel.add("button", undefined, "🔓 Desbloquear Transformações");
    var unlockLayersBtn = lockUnlockPanel.add("button", undefined, "🔓 Desbloquear Camadas (Cadeado)");

    var parentPanel = pal.add("panel", undefined, "Parentesco");
    parentPanel.alignChildren = 'fill';
    parentPanel.spacing = 10;
    parentPanel.margins = 15;
    var unparentBtn = parentPanel.add("button", undefined, "\uD83D\uDD17 Desparentear");

    var statusPanel = pal.add('panel', undefined, "Status");
    statusPanel.alignment = 'fill';
    statusPanel.margins = 10;
    var feedbackTxt = statusPanel.add("statictext", undefined, "Pronto.", {multiline: true});
    feedbackTxt.alignment = ["fill", "center"];
    feedbackTxt.preferredSize.height = 30;

    pal.layout.layout(true);
    pal.onResizing = pal.onResize = function() { this.layout.resize(); }

    // --- LÓGICA DOS BOTÕES ---
    lockBtn.onClick = function() {
        var layersToProcess = getLayers(true);
        if (!layersToProcess) return;
        var time = app.project.activeItem.time;
        app.beginUndoGroup("Bloquear Transformações");
        var processedCount = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            try {
                var props = layersToProcess[i].transform;
                var propArray = [props.position, props.scale, props.rotation, props.anchorPoint, props.opacity];
                for (var j = 0; j < propArray.length; j++) {
                    var p = propArray[j];
                    if (p && p.canSetExpression) p.expression = p.valueAtTime(time, false).toSource();
                }
                processedCount++;
            } catch(e){}
        }
        app.endUndoGroup();
        feedbackTxt.text = "Transformações bloqueadas em " + processedCount + " camada(s).";
    };

    unlockBtn.onClick = function() {
        var layersToProcess = getLayers(true);
        if (!layersToProcess) return;
        app.beginUndoGroup("Desbloquear Transformações");
        var processedCount = 0;
        for (var i = 0; i < layersToProcess.length; i++) {
            try {
                var props = layersToProcess[i].transform;
                var propArray = [props.position, props.scale, props.rotation, props.anchorPoint, props.opacity];
                for (var j = 0; j < propArray.length; j++) {
                    var p = propArray[j];
                     if (p && p.canSetExpression) p.expression = "";
                }
                processedCount++;
            } catch(e){}
        }
        app.endUndoGroup();
        feedbackTxt.text = "Transformações desbloqueadas em " + processedCount + " camada(s).";
    };
    
    unlockLayersBtn.onClick = function() {
        var layersToProcess = getLayers(false);
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
        var layersToProcess = getLayers(true);
        if (!layersToProcess) return;
        app.beginUndoGroup("Desparentear");
        var processedCount = 0;
        for(var i = 0; i < layersToProcess.length; i++){
            try {
                if (flattenLayerTransform(layersToProcess[i])) {
                    processedCount++;
                }
            } catch(e){}
        }
        app.endUndoGroup();
        feedbackTxt.text = processedCount + " camada(s) desvinculadas.";
    };

    if (pal instanceof Window) {
        pal.center();
        pal.show();
    }
})(this);