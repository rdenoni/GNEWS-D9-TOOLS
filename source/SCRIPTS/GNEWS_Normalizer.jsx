/**********************************************************************************
 *
 * Kit de Ferramentas - Normalizadores
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 15.6.0 (Correção de Deslocamento)
 *
 * DESCRIÇÃO:
 * - CORREÇÃO CRÍTICA (Âncora): A função "Normalizar Âncora" foi novamente
 * reconstruída para corrigir um bug que deslocava a camada. A nova lógica
 * usa 'toWorldVec' para garantir que a camada permaneça visualmente estática.
 * - CORREÇÃO (Escala): A função "Normalizar Escala" agora funciona para todos
 * os tipos de camada (Sólidos, Imagens, etc.), criando pré-composições
 * conforme descrito na ajuda.
 *
 **********************************************************************************/

function launchNormalizerUI(thisObj) { // O 'thisObj' foi movido para a função principal

    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Kit de Ferramentas - Normalizadores v15.6", undefined, { resizeable: true });
    if (pal === null) return;
    pal.orientation = "column";
    pal.alignChildren = ["fill", "top"];
    pal.spacing = 10;
    pal.margins = 15;

    pal.graphics.backgroundColor = pal.graphics.newBrush(pal.graphics.BrushType.SOLID_COLOR, [0, 0, 0]);

    // --- FUNÇÃO DE AJUDA ---
    function showHelp() {
        var LARGURA_JANELA = 550;
        var ALTURA_JANELA = 500;
        var helpWin = new Window("palette", "Ajuda - Normalizadores", undefined, { closeButton: true });
        helpWin.orientation = "column"; helpWin.alignChildren = ["fill", "fill"]; helpWin.spacing = 10; helpWin.margins = 15;
        helpWin.preferredSize = [LARGURA_JANELA, ALTURA_JANELA];

        helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
        var titleText = helpWin.add("statictext", undefined, "AJUDA - NORMALIZADORES");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16); titleText.alignment = ["center", "center"];
        var mainDescText = helpWin.add("statictext", undefined, "Esta ferramenta oferece um conjunto de funções para Escala as propriedades de transformação das camadas.", { multiline: true });
        mainDescText.margins = [15, 0, 15, 15];
        var topics = [
            {
                title: "▶ Escala 100%:",
                text: "Ajusta a escala de camadas para 100%. Para Textos/Shapes, a escala é incorporada nos atributos. Para outras camadas, cria uma pré-composição.",
            },
            {
                title: "▶ Centralizar Âncora:",
                text: "Move o Ponto de Âncora para o centro geométrico da camada, mantendo a posição visual.",
            },
            {
                title: "▶ Âncora [0,0]:",
                text: "Move o ponto de âncora para a posição [0,0] da camada, mantendo a posição visual.",
            },
            {
                title: "▶ Centralizar Objeto:",
                text: "Move as camadas selecionadas para o centro exato da composição.",
            },
            {
                title: "▶ Posição [0,0] (via Âncora):",
                text: "Move a posição da camada para as coordenadas [0,0], compensando o deslocamento no Ponto de Âncora. AVISO: Isso quebra o comportamento de Rotação e Escala.",
            },
            {
                title: "▶ Resetar Rotação:",
                text: "Define a Rotação (e Orientação em 3D) da camada para 0.",
            },
            {
                title: "▶ Normalizar Rotação:",
                text: "Função universal. Para Shape Layers, transfere a rotação para os grupos internos. Para outras camadas, pré-compõe com crop inteligente.",
            },
            {
                title: "▶ Resetar Transformações:",
                text: "Função universal. Para Shape Layers, reseta as transformações internas. Para outras camadas, reseta as transformações principais, remove Layer Styles e desativa o Stroke de Texto.",
            },
        ];
        for (var i = 0; i < topics.length; i++) {
            var topic = topics[i];
            var topicGrp = helpWin.add("group"); topicGrp.margins = [15, 0, 15, 0]; topicGrp.orientation = "column"; topicGrp.alignChildren = "fill"; topicGrp.spacing = 4;
            var topicTitle = topicGrp.add("statictext", undefined, topic.title);
            topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12); topicTitle.graphics.foregroundColor = topicTitle.graphics.newPen(topicTitle.graphics.PenType.SOLID_COLOR, [0.83, 0, 0.23, 1], 1);
            var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
            topicText.preferredSize.height = 40;
        }
        var closeBtn = helpWin.add("button", undefined, "Fechar");
        closeBtn.alignment = "center"; closeBtn.margins = [0, 15, 0, 0];
        closeBtn.onClick = function () { helpWin.close(); };
        helpWin.center(); helpWin.show();
    }

    // --- UI ---
    var headerGroup = pal.add("group");
    headerGroup.orientation = "row";
    headerGroup.alignChildren = ["fill", "center"];
    var titleText = headerGroup.add("statictext", undefined, "Kit de Ferramentas - Normalizadores v15.6");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
    var helpBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
        try {
            var helpBtnGroup = headerGroup.add('group'); helpBtnGroup.alignment = ['right', 'center'];
            helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
            helpBtn.leftClick.onClick = showHelp;
        } catch (e) {
            helpBtn = headerGroup.add("button", undefined, "?"); helpBtn.preferredSize = [25, 25]; helpBtn.alignment = ['right', 'center']; helpBtn.onClick = showHelp;
        }
    } else {
        helpBtn = headerGroup.add("button", undefined, "?"); helpBtn.preferredSize = [25, 25]; helpBtn.alignment = ['right', 'center']; helpBtn.onClick = showHelp;
    }

    var scalePanel = pal.add("panel", undefined, "Escala");
    scalePanel.alignChildren = 'fill';
    var cbIncludeStrokeScale = scalePanel.add("checkbox", undefined, "Ajustar Largura do Stroke"); cbIncludeStrokeScale.value = true;
    var normalizeScaleBtn = scalePanel.add("button", undefined, "\u21F2 Normalizar Escala 100%");

    var anchorPanel = pal.add("panel", undefined, "Âncora");
    anchorPanel.alignChildren = 'fill';
    var anchorBtnsGroup = anchorPanel.add("group"); anchorBtnsGroup.orientation = "row";
    var normalizeAnchorBtn = anchorBtnsGroup.add("button", undefined, "\u2295 Normalizar Ancora");
    var AnchorAlignBtn = anchorBtnsGroup.add("button", undefined, "\u29BF Centralizar Ancora");


    var posPanel = pal.add("panel", undefined, "Posição");
    posPanel.alignChildren = 'fill';
    var posGroup = posPanel.add("group"); posGroup.orientation = "row";
    var positionZeroBtn = posGroup.add("button", undefined, "\u2295 Posição [0,0] via Âncora");
    var centerObjectBtn = posGroup.add("button", undefined, "\u25CE Centralizar Objeto");


    var rotPanel = pal.add("panel", undefined, "Rotação");
    rotPanel.alignChildren = 'fill';
    var rotBtnsGroup = rotPanel.add("group"); rotBtnsGroup.orientation = "row";
    var normalizeRotBtn = rotBtnsGroup.add("button", undefined, "\u21BB Normalizar Rotação");
    var zeroRotationBtn = rotBtnsGroup.add("button", undefined, "\u21BB Resetar Rotação");


    var shapePanel = pal.add("panel", undefined, "Resetar Propriedades");
    shapePanel.alignChildren = 'fill';
    var resetShapeTransformsBtn = shapePanel.add("button", undefined, "Resetar Transformações");

    var statusPanel = pal.add('panel', undefined, "Status");
    statusPanel.alignment = 'fill';
    var feedbackTxt = statusPanel.add("statictext", undefined, "Pronto.", { multiline: true });
    feedbackTxt.alignment = ['fill', 'center'];
    feedbackTxt.preferredSize.height = 30;

    pal.layout.layout(true);
    pal.onResizing = pal.onResize = function () { this.layout.resize(); }

    // =================================================================================
    // --- FUNÇÕES HELPER ---
    // =================================================================================

    function getLayers(needsSelection) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) { feedbackTxt.text = "ERRO: Nenhuma composição ativa."; return null; }
        var layers = []; var sel = comp.selectedLayers;
        if (sel.length > 0) { for (var i = 0; i < sel.length; i++) layers.push(sel[i]); }
        else if (!needsSelection) { for (var i = 1; i <= comp.numLayers; i++) layers.push(comp.layer(i)); }
        else { feedbackTxt.text = "ERRO: Selecione pelo menos uma camada."; return null; }
        return layers;
    }

    function deselectAllLayers(comp) { for (var i = 1; i <= comp.numLayers; i++) { comp.layer(i).selected = false; } }

    function runAnchorAlignCommand() {
        var commandID = 0;
        try { commandID = app.findMenuCommandId("Center Anchor Point in Layer Content"); } catch (e) { }
        if (commandID === 0) { try { commandID = app.findMenuCommandId("Centralizar ponto de ancoragem no conteúdo da camada"); } catch (e) { } }
        if (commandID !== 0) { app.executeCommand(commandID); return true; }
        return false;
    }

    function getLayerBoundsAtTime(layer, time) {
        var rect;
        if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) {
            try { rect = layer.sourceRectAtTime(time, true); } catch (e) { rect = { top: 0, left: 0, width: 0, height: 0 }; }
        } else if (layer.source) {
            rect = { top: 0, left: 0, width: layer.source.width, height: layer.source.height };
        } else {
            rect = { top: 0, left: 0, width: 0, height: 0 };
        }
        if (rect.width <= 0 || rect.height <= 0) return null;
        var corners = [[rect.left, rect.top], [rect.left + rect.width, rect.top], [rect.left + rect.width, rect.top + rect.height], [rect.left, rect.top + rect.height]];
        var position = layer.transform.position.valueAtTime(time, false);
        var anchorPoint = layer.transform.anchorPoint.valueAtTime(time, false);
        var scale = layer.transform.scale.valueAtTime(time, false);
        var rotation = layer.transform.rotation.valueAtTime(time, false);
        var rad = -rotation * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad), sx = scale[0] / 100, sy = scale[1] / 100;
        var transformedCorners = [];
        for (var i = 0; i < 4; i++) {
            var corner = corners[i], x = corner[0] - anchorPoint[0], y = corner[1] - anchorPoint[1];
            x *= sx; y *= sy;
            var rotatedX = x * cos - y * sin, rotatedY = x * sin + y * cos;
            transformedCorners.push([rotatedX + position[0], rotatedY + position[1]]);
        }
        var minX = transformedCorners[0][0], maxX = transformedCorners[0][0], minY = transformedCorners[0][1], maxY = transformedCorners[0][1];
        for (var i = 1; i < 4; i++) {
            minX = Math.min(minX, transformedCorners[i][0]);
            maxX = Math.max(maxX, transformedCorners[i][0]);
            minY = Math.min(minY, transformedCorners[i][1]);
            maxY = Math.max(maxY, transformedCorners[i][1]);
        }
        return { left: minX, top: minY, right: maxX, bottom: maxY };
    }

    function calculateBounds(comp, layers) {
        var time = comp.time;
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        var hasValidBounds = false;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (!layer.enabled || (time < layer.inPoint || time > layer.outPoint)) continue;
            try {
                var layerBounds = getLayerBoundsAtTime(layer, time);
                if (layerBounds) {
                    minX = Math.min(minX, layerBounds.left);
                    minY = Math.min(minY, layerBounds.top);
                    maxX = Math.max(maxX, layerBounds.right);
                    maxY = Math.max(maxY, layerBounds.bottom);
                    hasValidBounds = true;
                }
            } catch (e) { }
        }
        if (!hasValidBounds) return null;
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    }


    function getToWorldVec(layer, vec) {
        var tempEffect = layer.Effects.addProperty("ADBE 3D Point Control");
        var tempPoint = tempEffect.property(1);
        // Usa toWorldVec para transformar um VETOR (direção), ignorando a posição da camada.
        tempPoint.expression = 'thisLayer.toWorldVec([' + vec[0] + ',' + vec[1] + (vec.length > 2 ? ',' + vec[2] : ',0') + '])';
        var worldVec = tempPoint.value;
        tempEffect.remove();
        return worldVec;
    }

    // =================================================================================
    // --- LÓGICA DOS BOTÕES ---
    // =================================================================================

    normalizeScaleBtn.onClick = function () {
        var layers = getLayers(true); if (!layers) return;
        var comp = app.project.activeItem;
        app.beginUndoGroup("Normalizar Escala 100%");
        var c = 0;

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            try {
                var scale = layer.transform.scale.value;
                if (scale[0] === 100 && scale[1] === 100) continue;

                if (layer instanceof TextLayer) {
                    var textProp = layer.property("Source Text"); var textDoc = textProp.value;
                    textDoc.fontSize *= (scale[0] / 100);
                    if (cbIncludeStrokeScale.value && textDoc.applyStroke) {
                        var avgS = (Math.abs(scale[0]) + Math.abs(scale[1])) / 200;
                        if (avgS > 0) textDoc.strokeWidth *= avgS;
                    }
                    textProp.setValue(textDoc);
                    layer.transform.scale.setValue([100, 100, 100]);
                    c++;
                } else if (layer instanceof ShapeLayer) {
                    for (var j = 1; j <= layer.property("Contents").numProperties; j++) {
                        var group = layer.property("Contents").property(j);
                        if (group.matchName === "ADBE Vector Group") {
                            var gs = group.property("Transform").scale;
                            gs.setValue([gs.value[0] * scale[0] / 100, gs.value[1] * scale[1] / 100]);
                        }
                    }
                    layer.transform.scale.setValue([100, 100, 100]);
                    c++;
                } else if (layer instanceof AVLayer) {
                    var layerIndex = layer.index;
                    comp.layers.precompose([layerIndex], layer.name + " (Escala Normalizada)", true);
                    c++;
                }
            } catch (e) { }
        }
        app.endUndoGroup();
        feedbackTxt.text = "Escala normalizada em " + c + " camada(s).";
    };

    centerObjectBtn.onClick = function () {
        var layers = getLayers(true); if (!layers) return;
        app.beginUndoGroup("Centralizar Objeto"); var c = 0;
        var comp = app.project.activeItem; var compCenter = [comp.width / 2, comp.height / 2];
        for (var i = 0; i < layers.length; i++) {
            try { var p = layers[i].transform.position; var v = p.value; p.setValue((v.length === 3) ? [compCenter[0], compCenter[1], v[2]] : compCenter); c++; } catch (e) { }
        }
        feedbackTxt.text = c + " camada(s) centralizada(s)."; app.endUndoGroup();
    };

    positionZeroBtn.onClick = function () {
        var layers = getLayers(true);
        if (!layers) return;

        app.beginUndoGroup("Zerar Posição via Ponto de Ancoragem");
        var c = 0;

        for (var i = 0; i < layers.length; i++) {
            var targetLayer = layers[i];
            try {
                var originalPosition = targetLayer.transform.position.value;
                var originalAnchorPoint = targetLayer.transform.anchorPoint.value;

                var newAnchorPoint = [
                    originalAnchorPoint[0] - originalPosition[0],
                    originalAnchorPoint[1] - originalPosition[1]
                ];

                if (originalPosition.length > 2) {
                    var originalAnchorZ = (originalAnchorPoint.length > 2) ? originalAnchorPoint[2] : 0;
                    newAnchorPoint.push(originalAnchorZ - originalPosition[2]);
                }

                targetLayer.transform.position.setValue([0, 0, 0]);
                targetLayer.transform.anchorPoint.setValue(newAnchorPoint);
                c++;
            } catch (e) { }
        }

        app.endUndoGroup();
        feedbackTxt.text = "Posição de " + c + " camada(s) zerada via Âncora.";
    };

    normalizeRotBtn.onClick = function () {
        var comp = app.project.activeItem;
        var layers = getLayers(true);
        if (!layers) return;

        app.beginUndoGroup("Normalizar Rotação");

        var shapeLayers = [];
        var otherLayers = [];
        var otherLayerIndices = [];

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layer.matchName === "ADBE Vector Layer") {
                shapeLayers.push(layer);
            } else {
                var hasRotation = false;
                if (layer.transform.rotation && layer.transform.rotation.value !== 0) hasRotation = true;
                if (layer.threeDLayer) {
                    if (layer.transform.xRotation.value !== 0 || layer.transform.yRotation.value !== 0 || layer.transform.orientation.value.toString() !== "0,0,0") hasRotation = true;
                }
                if (hasRotation) {
                    otherLayers.push(layer);
                    otherLayerIndices.push(layer.index);
                }
            }
        }

        var processedShapes = 0;
        if (shapeLayers.length > 0) {
            function traverse(propGroup, r) {
                for (var i = 1; i <= propGroup.numProperties; i++) {
                    var prop = propGroup.property(i);
                    if (prop.matchName === "ADBE Vector Group") {
                        try { prop.property("Transform").rotation.setValue(prop.property("Transform").rotation.value + r); } catch (e) { }
                        traverse(prop.property("Contents"), r);
                    }
                }
            }
            for (var i = 0; i < shapeLayers.length; i++) {
                try {
                    var r = shapeLayers[i].transform.rotation;
                    var v = r.value;
                    if (v !== 0) {
                        traverse(shapeLayers[i].property("Contents"), v);
                        r.setValue(0);
                        processedShapes++;
                    }
                } catch (e) { }
            }
        }

        var processedOthers = 0;
        if (otherLayerIndices.length > 0) {
            try {
                var bounds = calculateBounds(comp, otherLayers);
                if (!bounds) throw new Error("Não foi possível calcular os limites das camadas.");

                var newComp = comp.layers.precompose(otherLayerIndices, "Rot-Norm_Crop", true);
                var newCompLayer = comp.layer(otherLayerIndices[0]);

                newComp.width = Math.max(1, Math.ceil(bounds.width));
                newComp.height = Math.max(1, Math.ceil(bounds.height));
                var internalOffset = [-bounds.left, -bounds.top];
                for (var i = 1; i <= newComp.numLayers; i++) {
                    var layerInPrecomp = newComp.layer(i);
                    var prop = layerInPrecomp.transform.position;
                    var oldVal = prop.value;
                    prop.setValue([oldVal[0] + internalOffset[0], oldVal[1] + internalOffset[1], oldVal[2] || 0]);
                }

                var finalPosition = [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2];
                if (newCompLayer.transform.position.value.length > 2) {
                    finalPosition.push(newCompLayer.transform.position.value[2]);
                }
                newCompLayer.transform.position.setValue(finalPosition);
                processedOthers = otherLayerIndices.length;
            } catch (e) {
                feedbackTxt.text = "ERRO: " + e.message;
            }
        }

        var totalProcessed = processedShapes + processedOthers;
        if (totalProcessed > 0) {
            feedbackTxt.text = "Rotação normalizada em " + totalProcessed + " camada(s).";
        } else {
            feedbackTxt.text = "Nenhuma camada com rotação selecionada.";
        }

        app.endUndoGroup();
    };

    zeroRotationBtn.onClick = function () {
        app.beginUndoGroup("Zerar Rotação"); var layers = getLayers(true); if (!layers) { app.endUndoGroup(); return; }
        var processedCount = 0;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            try {
                if (layer.threeDLayer) {
                    layer.transform.xRotation.setValue(0); layer.transform.yRotation.setValue(0); layer.transform.zRotation.setValue(0); layer.transform.orientation.setValue([0, 0, 0]);
                } else { layer.transform.rotation.setValue(0); }
                processedCount++;
            } catch (e) { }
        }
        app.endUndoGroup(); feedbackTxt.text = "Rotação zerada em " + processedCount + " camada(s).";
    };

    normalizeAnchorBtn.onClick = function () {
        app.beginUndoGroup("Zerar Anchor Point e Compensar Posição");
        var layers = getLayers(true);
        if (!layers) { app.endUndoGroup(); return; }
        var processedCount = 0;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layer.transform) {
                try {
                    if (layer.toComp !== undefined) {
                        var targetPosition = layer.toComp([0, 0, 0]);
                        layer.transform.anchorPoint.setValue([0, 0, 0]);
                        layer.transform.position.setValue(targetPosition);
                    } else {
                        var initialPosition = layer.transform.position.value;
                        var initialAnchorPoint = layer.transform.anchorPoint.value;
                        var newPosition = [initialPosition[0] - initialAnchorPoint[0], initialPosition[1] - initialAnchorPoint[1]];
                        if (initialPosition.length > 2) {
                            newPosition[2] = initialPosition[2] - (initialAnchorPoint.length > 2 ? initialAnchorPoint[2] : 0);
                        }
                        layer.transform.anchorPoint.setValue([0, 0, 0]);
                        layer.transform.position.setValue(newPosition);
                    }
                    processedCount++;
                } catch (e) { }
            }
        }
        feedbackTxt.text = "Âncora de " + processedCount + " camada(s) zerada e compensada.";
        app.endUndoGroup();
    };

    AnchorAlignBtn.onClick = function () {
        app.beginUndoGroup("Centralizar Âncora");
        var layers = getLayers(true); if (!layers) { app.endUndoGroup(); return; }
        var comp = app.project.activeItem; var processedCount = 0;
        var originalSelection = []; for (var i = 0; i < layers.length; i++) { originalSelection.push(layers[i]); }
        deselectAllLayers(comp);
        for (var i = 0; i < originalSelection.length; i++) {
            var layer = originalSelection[i];
            if (layer instanceof AVLayer || layer instanceof ShapeLayer || layer instanceof TextLayer) {
                try {
                    layer.selected = true;
                    if (runAnchorAlignCommand()) { processedCount++; }
                    layer.selected = false;
                } catch (e) { }
            }
        }
        for (var i = 0; i < originalSelection.length; i++) { originalSelection[i].selected = true; }
        feedbackTxt.text = "Âncora de " + processedCount + " camada(s) centralizada.";
        app.endUndoGroup();
    };

    resetShapeTransformsBtn.onClick = function () {
        app.beginUndoGroup("Resetar Propriedades");
        var layers = getLayers(true);
        if (!layers) { app.endUndoGroup(); return; }
        var processedCount = 0;
        var comp = app.project.activeItem;

        function resetTransformRecursive(propGroup) {
            for (var i = 1; i <= propGroup.numProperties; i++) {
                var prop = propGroup.property(i);
                var matchName = prop.matchName;
                try {
                    if (matchName === "ADBE Vector Group") {
                        var transform = prop.property("Transform");
                        transform.property("Anchor Point").setValue([0, 0]);
                        transform.property("Position").setValue([0, 0]);
                        transform.property("Scale").setValue([100, 100]);
                        transform.property("Rotation").setValue(0);
                        transform.property("Opacity").setValue(100);
                        resetTransformRecursive(prop.property("Contents"));
                    } else if (matchName === "ADBE Vector Shape - Rect") {
                        prop.property("Size").setValue([100, 100]);
                        prop.property("Position").setValue([0, 0]);
                        prop.property("Roundness").setValue(0);
                    } else if (matchName === "ADBE Vector Shape - Ellipse") {
                        prop.property("Size").setValue([100, 100]);
                        prop.property("Position").setValue([0, 0]);
                    }
                } catch (e) { }
            }
        }

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            try {
                if (layer.matchName === "ADBE Vector Layer") {
                    resetTransformRecursive(layer.property("Contents"));
                } else if (layer.property("transform")) {
                    var transform = layer.transform;
                    transform.anchorPoint.setValue([0, 0]);
                    transform.position.setValue([comp.width / 2, comp.height / 2]);
                    transform.scale.setValue([100, 100]);
                    transform.opacity.setValue(100);
                    if (transform.property("Rotation")) transform.rotation.setValue(0);
                    if (layer.threeDLayer) {
                        transform.xRotation.setValue(0);
                        transform.yRotation.setValue(0);
                        transform.orientation.setValue([0, 0, 0]);
                    }
                    if (layer.property("Layer Styles")) {
                        var layerStyles = layer.property("Layer Styles");
                        while (layerStyles.numProperties > 0) {
                            layerStyles.property(1).remove();
                        }
                    }
                    if (layer.property("Source Text")) {
                        var textProp = layer.property("Source Text");
                        var textDoc = textProp.value;
                        textDoc.applyStroke = false;
                        textProp.setValue(textDoc);
                    }
                }
                processedCount++;
            } catch (e) { }
        }
        feedbackTxt.text = "Propriedades resetadas em " + processedCount + " camada(s).";
        app.endUndoGroup();
    };

    if (pal instanceof Window) { pal.center(); pal.show(); }
}