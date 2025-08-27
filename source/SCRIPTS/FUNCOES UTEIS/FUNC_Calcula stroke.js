/********************************************************************************************************************************************************************************
 * *
 * Script:         Calculadora de Limites de Shape Layer (Versão Expandida)                                                                                                    *
 * Descrição:      Calcula os limites de uma camada de forma selecionada com e sem seu traçado usando QUATRO métodos diferentes e exibe os resultados para comparação.         *
 * Autor:          Gemini                                                                                                                                                     *
 * Versão:         2.0                                                                                                                                                        *
 * Data:           15/08/2025                                                                                                                                                   *
 * *
 ********************************************************************************************************************************************************************************/

(function calcularLimitesDeShapeExpandido() {
    app.beginUndoGroup("Calcular Limites do Shape (4 Métodos)");

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Por favor, selecione uma composição.");
        return;
    }

    var layer = comp.selectedLayers[0];
    if (!layer || !(layer instanceof ShapeLayer)) {
        alert("Por favor, selecione uma única camada de forma (Shape Layer).");
        return;
    }

    var currentTime = comp.time;
    var resultados = "";

    // --- FUNÇÃO AUXILIAR para encontrar o Stroke Width (usada nos métodos 2 e 4) ---
    var strokeWidth = 0;
    function encontrarStrokeWidth(propGroup) {
        for (var i = 1; i <= propGroup.numProperties; i++) {
            var prop = propGroup.property(i);
            if (prop.matchName === "ADBE Vector Graphic - Stroke") {
                var sw = prop.property("ADBE Vector Stroke Width");
                if (sw && sw.value > 0) {
                    strokeWidth = sw.value;
                    return;
                }
            } else if (prop.propertyType === PropertyType.GROUP) {
                encontrarStrokeWidth(prop);
            }
        }
    }
    encontrarStrokeWidth(layer.property("Contents"));


    // --- MÉTODO 1: sourceRectAtTime() Nativo (O mais direto) ---
    try {
        var rectSemStroke1 = layer.sourceRectAtTime(currentTime, false);
        var rectComStroke1 = layer.sourceRectAtTime(currentTime, true);
        
        resultados += "--- MÉTODO 1: sourceRectAtTime() Nativo ---\n";
        resultados += "Sem Stroke: " + rectSemStroke1.width.toFixed(2) + " x " + rectSemStroke1.height.toFixed(2) + " px\n";
        resultados += "Com Stroke: " + rectComStroke1.width.toFixed(2) + " x " + rectComStroke1.height.toFixed(2) + " px\n";
        resultados += "--------------------------------------------------\n\n";
    } catch (e) {
        resultados += "--- MÉTODO 1: FALHOU ---\n" + e.toString() + "\n\n";
    }


    // --- MÉTODO 2: Cálculo Manual (sourceRectAtTime + Stroke) ---
    try {
        var rectSemStroke2 = layer.sourceRectAtTime(currentTime, false);
        var larguraComStroke2 = rectSemStroke2.width + (strokeWidth * 2);
        var alturaComStroke2 = rectSemStroke2.height + (strokeWidth * 2);

        resultados += "--- MÉTODO 2: Cálculo Manual ---\n";
        resultados += "Sem Stroke: " + rectSemStroke2.width.toFixed(2) + " x " + rectSemStroke2.height.toFixed(2) + " px\n";
        resultados += "(Espessura do Stroke encontrada: " + strokeWidth.toFixed(2) + " px)\n";
        resultados += "Com Stroke: " + larguraComStroke2.toFixed(2) + " x " + alturaComStroke2.toFixed(2) + " px\n";
        resultados += "--------------------------------------------------\n\n";
    } catch (e) {
        resultados += "--- MÉTODO 2: FALHOU ---\n" + e.toString() + "\n\n";
    }


    // --- MÉTODO 3: Expressão Temporária ---
    try {
        var tempTextLayer = comp.layers.addText("temp");
        var textProp = tempTextLayer.property("Source Text");
        var expr = 'L = thisComp.layer("' + layer.name + '");\n' +
                   'rSem = L.sourceRectAtTime(time, false);\n' +
                   'rCom = L.sourceRectAtTime(time, true);\n' +
                   '"w1=" + rSem.width + ";h1=" + rSem.height + ";w2=" + rCom.width + ";h2=" + rCom.height;';
        textProp.expression = expr;
        
        var exprResult = textProp.value.toString();
        tempTextLayer.remove();

        var parsed = exprResult.match(/w1=([\d\.]+);h1=([\d\.]+);w2=([\d\.]+);h2=([\d\.]+)/);
        var larguraSemStroke3 = parseFloat(parsed[1]);
        var alturaSemStroke3 = parseFloat(parsed[2]);
        var larguraComStroke3 = parseFloat(parsed[3]);
        var alturaComStroke3 = parseFloat(parsed[4]);

        resultados += "--- MÉTODO 3: Expressão Temporária ---\n";
        resultados += "Sem Stroke: " + larguraSemStroke3.toFixed(2) + " x " + alturaSemStroke3.toFixed(2) + " px\n";
        resultados += "Com Stroke: " + larguraComStroke3.toFixed(2) + " x " + alturaComStroke3.toFixed(2) + " px\n";
        resultados += "--------------------------------------------------\n\n";
    } catch (e) {
        resultados += "--- MÉTODO 3: FALHOU ---\n" + e.toString() + "\n\n";
    }


    // --- MÉTODO 4: Conversão para Máscara ---
    try {
        var shapePath;
        // Tenta encontrar uma propriedade de caminho (path) para converter
        function encontrarPath(propGroup) {
            for (var i = 1; i <= propGroup.numProperties; i++) {
                var prop = propGroup.property(i);
                if (prop.matchName === "ADBE Vector Shape") {
                    shapePath = prop;
                    return;
                } else if (prop.propertyType === PropertyType.GROUP) {
                    encontrarPath(prop);
                }
            }
        }
        encontrarPath(layer.property("Contents"));

        if (shapePath) {
            var tempSolid = comp.layers.addSolid([0,0,0], "temp_solid", comp.width, comp.height, 1);
            tempSolid.enabled = false; // Oculta a camada
            var newMask = tempSolid.Masks.addProperty("Mask");
            newMask.maskShape.setValue(shapePath.value);

            var maskBounds = newMask.maskShape.value.bounds;
            var larguraSemStroke4 = maskBounds[2] - maskBounds[0]; // right - left
            var alturaSemStroke4 = maskBounds[3] - maskBounds[1]; // bottom - top
            
            var larguraComStroke4 = larguraSemStroke4 + (strokeWidth * 2);
            var alturaComStroke4 = alturaSemStroke4 + (strokeWidth * 2);
            
            tempSolid.remove();

            resultados += "--- MÉTODO 4: Conversão para Máscara ---\n";
            resultados += "Sem Stroke: " + larguraSemStroke4.toFixed(2) + " x " + alturaSemStroke4.toFixed(2) + " px\n";
            resultados += "Com Stroke: " + larguraComStroke4.toFixed(2) + " x " + alturaComStroke4.toFixed(2) + " px\n";
            resultados += "--------------------------------------------------";
        } else {
            throw new Error("Nenhum caminho (path) editável encontrado para converter em máscara.");
        }
    } catch (e) {
        resultados += "--- MÉTODO 4: FALHOU ---\n" + e.toString() + "\n\n";
    }


    // --- Exibe o Alerta Final ---
    alert("Resultados dos 4 Métodos:\n\n" + resultados);

    app.endUndoGroup();
})();