/**
 * GNEWS Auto Crop to Precomp
 * Script para Adobe After Effects
 * * Descrição: Cria uma precomp cropada com as layers selecionadas.
 * MODIFICADO: Centraliza o anchor point de cada layer de texto/shape individualmente.
 * Autor: GNEWS Design Team
 * Versão: 25.3 (Redução aplicada apenas em layers com Stroke)
 * * Instruções de uso:
 * 1. Selecione uma ou mais layers na timeline
 * 2. Execute o script (File > Scripts > Run Script File...)
 * 3. As layers selecionadas serão movidas para uma precomp cropada com anchor points centralizados.
 * * Regras de Redução:
 * - A redução de borda só é aplicada se UMA OU MAIS layers selecionadas tiverem Stroke.
 * - Layers sem stroke não terão redução na precomp.
 * * Regras de Precomp:
 * - 1 Precomp selecionada: Nenhuma ação é executada.
 * - 2 ou mais Precomps selecionadas: Agrupa sem redução de borda.
 */

(function() {
    // Função principal
    function createCroppedPrecomp() {
        var comp = app.project.activeItem;

        if (!comp || !(comp instanceof CompItem)) {
            alert("Por favor, abra uma composição antes de executar o script.");
            return;
        }

        var selectedLayers = comp.selectedLayers;

        if (selectedLayers.length === 0) {
            alert("Por favor, selecione pelo menos uma layer.");
            return;
        }
        
        var precompCount = 0;
        for (var i = 0; i < selectedLayers.length; i++) {
            if (selectedLayers[i].source instanceof CompItem) {
                precompCount++;
            }
        }
        
        if (selectedLayers.length === 1 && precompCount === 1) {
            alert("O script não executa ações em uma única precomp selecionada.");
            return;
        }

        app.beginUndoGroup("GNEWS - Criar Precomp Cropada e Centralizada");

        try {
            var selectedIndices = [];
            for (var i = 0; i < selectedLayers.length; i++) {
                selectedIndices.push(selectedLayers[i].index);
            }

            var precompName = "Precomp_" + selectedLayers[0].name.replace(/[^\w\s]/gi, '') + "_CROP";

            var boundsInMainComp = calculateBounds(comp, selectedLayers);
            if (!boundsInMainComp || boundsInMainComp.width <= 0 || boundsInMainComp.height <= 0) {
                alert("Não foi possível calcular os limites das layers.\nVerifique se as layers estão visíveis.");
                app.endUndoGroup();
                return;
            }

            // --- LÓGICA ATUALIZADA (v25.3) ---
            var originalWidth = boundsInMainComp.width;
            var originalHeight = boundsInMainComp.height;
            var reductionFactor = 1.0; // Padrão: sem redução

            // --- INÍCIO DA VERIFICAÇÃO DE STROKE ---
            var hasStroke = false;
            for (var i = 0; i < selectedLayers.length; i++) {
                if (getMaxStrokeWidth(selectedLayers[i], comp.time) > 0) {
                    hasStroke = true;
                    break; // Se encontrou um, não precisa procurar mais
                }
            }
            // --- FIM DA VERIFICAÇÃO DE STROKE ---

            // A lógica de redução só é aplicada se uma das layers tiver stroke.
            // As regras de precomp (que não têm stroke detectável aqui) são respeitadas implicitamente.
            if (hasStroke) {
                if (selectedLayers.length === 1) {
                    reductionFactor = 0.80; // Reduz para 80% (corte de 20%)
                } else if (selectedLayers.length === 2) {
                    reductionFactor = 0.90; // Reduz para 90% (corte de 10%)
                } else if (selectedLayers.length >= 3) {
                    reductionFactor = 0.95; // Reduz para 95% (corte de 5%)
                }
            }
            // Se 'hasStroke' for falso, 'reductionFactor' permanece 1.0 (sem redução).

            if (reductionFactor < 1.0) {
                boundsInMainComp.width *= reductionFactor;
                boundsInMainComp.height *= reductionFactor;

                var deltaWidth = originalWidth - boundsInMainComp.width;
                var deltaHeight = originalHeight - boundsInMainComp.height;
                boundsInMainComp.left += deltaWidth / 2;
                boundsInMainComp.top += deltaHeight / 2;
            }
            // --- FIM DA LÓGICA ATUALIZADA ---

            var precomp = comp.layers.precompose(selectedIndices, precompName, true);

            adjustPrecomp(precomp, boundsInMainComp);

            var precompLayer = findLayerBySource(comp, precomp);

            if (precompLayer) {
                var finalPosition = [
                    boundsInMainComp.left + boundsInMainComp.width / 2,
                    boundsInMainComp.top + boundsInMainComp.height / 2,
                    precompLayer.transform.position.value[2] || 0
                ];
                precompLayer.transform.position.setValue(finalPosition);
            }

            deselectAllLayers(comp);
            if (precompLayer) precompLayer.selected = true;

            alert("Precomp cropada criada com sucesso!\n\n" +
                "Nome: " + precompName + "\n" +
                "Dimensões: " + Math.ceil(boundsInMainComp.width) + " x " + Math.ceil(boundsInMainComp.height) + "px\n" +
                "Layers movidas: " + selectedIndices.length);

        } catch (error) {
            alert("Erro ao criar precomp: " + error.toString() + "\n\nLinha: " + error.line);
        } finally {
            app.endUndoGroup();
        }
    }

    function adjustPrecomp(precomp, boundsInMainComp) {
        var layersInPrecomp = getAllLayersFromComp(precomp);
        var time = precomp.time;

        precomp.width = Math.ceil(boundsInMainComp.width);
        precomp.height = Math.ceil(boundsInMainComp.height);

        for (var i = 0; i < layersInPrecomp.length; i++) {
            var layer = layersInPrecomp[i];
            if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) {
                try {
                    var rect = layer.sourceRectAtTime(time, true);
                    if (rect.width === 0 && rect.height === 0) continue;

                    var anchorProp = layer.transform.anchorPoint;
                    var posProp = layer.transform.position;
                    var currentAnchor = anchorProp.value;
                    var targetAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2];
                    var dAnchorX = targetAnchor[0] - currentAnchor[0];
                    var dAnchorY = targetAnchor[1] - currentAnchor[1];

                    if (Math.abs(dAnchorX) < 0.01 && Math.abs(dAnchorY) < 0.01) continue;

                    var scale = layer.transform.scale.valueAtTime(time, false);
                    var rotation = layer.transform.rotation.valueAtTime(time, false);
                    var sx = scale[0] / 100.0;
                    var sy = scale[1] / 100.0;
                    var r = rotation * Math.PI / 180.0;
                    
                    var compVec_x = (dAnchorX * sx * Math.cos(r)) - (dAnchorY * sy * Math.sin(r));
                    var compVec_y = (dAnchorX * sx * Math.sin(r)) + (dAnchorY * sy * Math.cos(r));

                    anchorProp.setValue(targetAnchor);
                    applyOffsetToProperty(posProp, [compVec_x, compVec_y]);

                } catch (e) {}
            }
        }

        var boundsInPrecomp = calculateBounds(precomp, layersInPrecomp);
        if (!boundsInPrecomp) return;

        var precompCenterX = precomp.width / 2;
        var precompCenterY = precomp.height / 2;
        var contentCenterX = boundsInPrecomp.left + (boundsInPrecomp.width / 2);
        var contentCenterY = boundsInPrecomp.top + (boundsInPrecomp.height / 2);
        var internalOffset = [precompCenterX - contentCenterX, precompCenterY - contentCenterY];

        for (var i = 0; i < layersInPrecomp.length; i++) {
            var layer = layersInPrecomp[i];
            applyOffsetToProperty(layer.transform.position, internalOffset);
        }
    }

    // --- FUNÇÕES AUXILIARES ---

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
            } catch (e) {}
        }
        if (!hasValidBounds) return null;
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY, right: maxX, bottom: maxY };
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
        var corners = [ [rect.left, rect.top], [rect.left + rect.width, rect.top], [rect.left + rect.width, rect.top + rect.height], [rect.left, rect.top + rect.height] ];
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
    
    function getMaxStrokeWidth(layer, time) {
        var maxWidth = 0;
        try {
            var lsStroke = layer.property("Layer Styles").property("Stroke");
            if (lsStroke && lsStroke.enabled) {
                var lsSize = lsStroke.property("Size").valueAtTime(time, false);
                if (lsSize > maxWidth) maxWidth = lsSize;
            }
        } catch (e) {}
        try {
            if (layer instanceof ShapeLayer && layer.property("Contents")) {
                var shapeStroke = findMaxStrokeInShape(layer.property("Contents"), time);
                if (shapeStroke > maxWidth) maxWidth = shapeStroke;
            }
        } catch(e) {}
        return maxWidth;
    }

    function findMaxStrokeInShape(propGroup, time) {
        var maxStroke = 0;
        for (var i = 1; i <= propGroup.numProperties; i++) {
            var prop = propGroup.property(i);
            if (prop.matchName === "ADBE Vector Graphic - Stroke" && prop.enabled) {
                var strokeWidthProp = prop.property("ADBE Vector Stroke Width");
                if (strokeWidthProp) {
                    var strokeWidth = strokeWidthProp.valueAtTime(time, false);
                    if (strokeWidth > maxStroke) maxStroke = strokeWidth;
                }
            } else if (prop.matchName === "ADBE Vector Group" || prop.matchName === "ADBE Vector Shape - Group") {
                var nestedStroke = findMaxStrokeInShape(prop, time);
                if (nestedStroke > maxStroke) maxStroke = nestedStroke;
            }
        }
        return maxStroke;
    }

    function applyOffsetToProperty(prop, offset) {
        if (prop.numKeys > 0) {
            for (var k = 1; k <= prop.numKeys; k++) {
                var oldVal = prop.keyValue(k);
                prop.setValueAtKey(k, [oldVal[0] + offset[0], oldVal[1] + offset[1], oldVal[2] || 0]);
            }
        } else {
            var oldVal = prop.value;
            prop.setValue([oldVal[0] + offset[0], oldVal[1] + offset[1], oldVal[2] || 0]);
        }
    }

    function findLayerBySource(comp, source) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).source === source) return comp.layer(i);
        }
        return null;
    }

    function deselectAllLayers(comp) {
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }
    }

    function getAllLayersFromComp(comp) {
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            layers.push(comp.layer(i));
        }
        return layers;
    }

    createCroppedPrecomp();

})();