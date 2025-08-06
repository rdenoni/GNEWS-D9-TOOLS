/*
GNEWS KillBoxText v1.1
Desenvolvido por Gemini (Google AI) com base nas especificações do usuário.
Data: 23/07/2025

Script de painel para o Adobe After Effects que oferece ferramentas avançadas para converter camadas de texto.
Desmembra camadas de texto do tipo Box Text ou Point Text em novas camadas individuais por linha ou por palavra, preservando o layout original.

v1.1 Changelog:
- FIX: Corrigido erro "Can't get color, this text has no stroke" ao verificar se o texto de origem possui traçado antes de copiar suas propriedades.
- FIX: Modo "POR LINHA" agora captura corretamente a última linha do texto em caixas (Box Text).
- REFACTOR: Modo "POR PALAVRA" foi reescrito para ser mais robusto, garantindo que todas as palavras sejam capturadas e o layout recriado com mais precisão.
*/

(function (thisObj) {

    // Função principal que constrói a interface e contém toda a lógica.
    function buildUI(thisObj) {
        var SCRIPT_NAME = "GNEWS KillBoxText";
        var SCRIPT_VERSION = "v1.1"; // Versão atualizada

        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", SCRIPT_NAME + " " + SCRIPT_VERSION, undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 15;

        // --- Grupo do Cabeçalho ---
        var headerGroup = win.add("group", undefined, { name: "headerGroup" });
        headerGroup.orientation = "row";
        headerGroup.alignChildren = ["left", "center"];
        headerGroup.spacing = 10;

        var titleText = headerGroup.add("statictext", undefined, "GNEWS KillBoxText");
        titleText.graphics.font = "Arial-Bold:18";

        var helpButton = headerGroup.add("button", undefined, "?");
        helpButton.preferredSize.width = 25;
        helpButton.onClick = function () {
            alert(
                "Ajuda - GNEWS KillBoxText v1.1\n\n" +
                "Selecione uma ou mais camadas de texto e escolha um modo de conversão:\n\n" +
                "INTEIRO:\nConverte uma camada de Box Text (caixa de texto) em uma única camada de Point Text (texto de ponto). Mantém toda a formatação.\n\n" +
                "POR LINHA:\nSepara o texto em novas camadas, uma para cada linha. Reconhece quebras de linha automáticas em Box Text.\n\n" +
                "POR PALAVRA:\nSepara o texto em novas camadas, uma para cada palavra, recriando o layout original (incluindo quebras de linha)."
            );
        };

        // --- Grupo de Opções de Conversão ---
        var optionsPanel = win.add("panel", undefined, "Modo de Conversão");
        optionsPanel.orientation = "column";
        optionsPanel.alignChildren = ["left", "top"];
        optionsPanel.spacing = 10;
        optionsPanel.margins = 10;

        var radioInteiro = optionsPanel.add("radiobutton", undefined, "INTEIRO");
        radioInteiro.value = true;
        var radioPorLinha = optionsPanel.add("radiobutton", undefined, "POR LINHA");
        var radioPorPalavra = optionsPanel.add("radiobutton", undefined, "POR PALAVRA");

        // --- Botão de Ação ---
        var convertButton = win.add("button", undefined, "Converter");
        convertButton.preferredSize.height = 30;
        
        convertButton.onClick = function () {
            var selectedMode = "";
            if (radioInteiro.value) {
                selectedMode = "INTEIRO";
            } else if (radioPorLinha.value) {
                selectedMode = "POR LINHA";
            } else {
                selectedMode = "POR PALAVRA";
            }
            processLayers(selectedMode);
        };

        // --- Lógica Principal de Processamento ---
        function processLayers(mode) {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Por favor, selecione uma composição.");
                return;
            }
            
            var selectedLayers = [];
            for (var i = 0; i < comp.selectedLayers.length; i++) {
                if (comp.selectedLayers[i].matchName === "ADBE Text Layer") {
                    selectedLayers.push(comp.selectedLayers[i]);
                }
            }

            if (selectedLayers.length === 0) {
                alert("Por favor, selecione uma ou mais camadas de texto.");
                return;
            }

            app.beginUndoGroup("GNEWS KillBoxText: " + mode);

            try {
                var progressBar = new Window("palette", "Processando...", [150, 150, 650, 270]);
                progressBar.pbar = progressBar.add("progressbar", [20, 35, 480, 60], 0, selectedLayers.length);
                progressBar.text = progressBar.add("statictext", [20, 10, 480, 30], "Processando camada 0 de " + selectedLayers.length);
                if (mode !== "INTEIRO") {
                    progressBar.show();
                }

                for (var i = 0; i < selectedLayers.length; i++) {
                    var currentLayer = selectedLayers[i];
                    progressBar.text.text = "Processando camada " + (i + 1) + " de " + selectedLayers.length + ": " + currentLayer.name;
                    
                    if (!currentLayer.property("Source Text")) continue; // Pula se a camada foi deletada ou não é mais válida

                    if (mode === "INTEIRO") {
                        processInteiro(currentLayer);
                    } else if (mode === "POR LINHA") {
                        processPorLinha(currentLayer);
                    } else if (mode === "POR PALAVRA") {
                        processPorPalavra(currentLayer);
                    }
                    progressBar.pbar.value = i + 1;
                }

                if (mode !== "INTEIRO") {
                    progressBar.close();
                }

            } catch (e) {
                alert("Ocorreu um erro: " + e.toString() + "\nLinha: " + e.line);
            } finally {
                app.endUndoGroup();
            }
        }

        function processInteiro(layer) {
            var textProp = layer.property("Source Text");
            var textDocument = textProp.value;

            if (!textDocument.boxText) {
                alert("A camada '" + layer.name + "' já é uma camada Point Text. Nenhuma ação foi realizada.");
                return;
            }

            var newLayer = layer.duplicate();
            var newTextProp = newLayer.property("Source Text");
            var newTextDocument = newTextProp.value;

            newTextDocument.boxText = false;
            newTextProp.setValue(newTextDocument);

            newLayer.name = layer.name + " (Point)";
            layer.remove();
        }

        function processPorLinha(layer) {
            var comp = layer.containingComp;
            var textProp = layer.property("Source Text");
            var textDocument = textProp.value;
            var originalText = textDocument.text;
            
            var lines = [];

            if (textDocument.boxText) {
                var words = originalText.replace(/(\r\n|\r|\n)/g, " \r ").split(/\s+/);
                var boxWidth = textDocument.boxTextSize[0];
                var tempLayer = comp.layers.addText("temp");
                var tempTextProp = tempLayer.property("Source Text");
                var tempDoc = tempTextProp.value;
                copyTextProperties(textDocument, tempDoc);
                
                var currentLine = "";
                for (var i = 0; i < words.length; i++) {
                    var word = words[i];
                    if (word === "" && currentLine === "") continue;
                    
                    if (word === "\r") {
                        lines.push(currentLine.trim());
                        currentLine = "";
                        continue;
                    }
                    
                    var testLine = currentLine === "" ? word : currentLine + " " + word;
                    tempDoc.text = testLine;
                    tempTextProp.setValue(tempDoc);
                    var currentWidth = tempLayer.sourceRectAtTime(comp.time, false).width;

                    if (currentWidth > boxWidth && currentLine !== "") {
                        lines.push(currentLine.trim());
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                // FIX: Adiciona a última linha que restou no buffer
                if (currentLine.trim() !== "") {
                    lines.push(currentLine.trim());
                }
                tempLayer.remove();

            } else {
                lines = originalText.split(/\r\n|\r|\n/);
            }

            createLayersFromLines(layer, lines);
            layer.remove();
        }
        
        // REFACTORED: Lógica "POR PALAVRA" completamente reescrita para maior robustez.
        function processPorPalavra(layer) {
            var comp = layer.containingComp;
            var textProp = layer.property("Source Text");
            var textDocument = textProp.value;
            var originalText = textDocument.text;

            var leading = textDocument.leading || textDocument.fontSize;
            var textRect = layer.sourceRectAtTime(comp.time, false);
            var layerPos = layer.property("Position").value;
            var startX = layerPos[0] + textRect.left;
            var currentY = layerPos[1] + textRect.top;

            // Medir a largura do espaço
            var spaceLayer = comp.layers.addText(" ");
            var spaceDoc = spaceLayer.property("Source Text").value;
            copyTextProperties(textDocument, spaceDoc);
            spaceLayer.property("Source Text").setValue(spaceDoc);
            var spaceWidth = spaceLayer.sourceRectAtTime(comp.time, false).width;
            spaceLayer.remove();

            var hardLines = originalText.split(/\r\n|\r|\n/);

            for (var i = 0; i < hardLines.length; i++) {
                var lineText = hardLines[i];
                var words = lineText.split(' ');
                var currentX = startX;

                if (textDocument.boxText) {
                    var lineWordsBuffer = [];
                    for (var j = 0; j < words.length; j++) {
                        var word = words[j];
                        if (word === "") continue;

                        lineWordsBuffer.push(word);
                        var tempLineText = lineWordsBuffer.join(" ");
                        
                        var measureLayer = comp.layers.addText(tempLineText);
                        var measureDoc = measureLayer.property("Source Text").value;
                        copyTextProperties(textDocument, measureDoc);
                        measureLayer.property("Source Text").setValue(measureDoc);
                        var lineWidth = measureLayer.sourceRectAtTime(comp.time, false).width;
                        measureLayer.remove();

                        if (lineWidth > textDocument.boxTextSize[0] && lineWordsBuffer.length > 1) {
                            lineWordsBuffer.pop(); // remove a última palavra
                            var wordsToPlace = lineWordsBuffer;
                            placeWordsOnLine(wordsToPlace, currentX, currentY, spaceWidth, layer);
                            
                            currentY += leading;
                            currentX = startX;
                            lineWordsBuffer = [word]; // A nova linha começa com a palavra atual
                        }
                    }
                    if (lineWordsBuffer.length > 0) {
                       placeWordsOnLine(lineWordsBuffer, currentX, currentY, spaceWidth, layer);
                    }
                } else { // Point Text - mais simples
                    placeWordsOnLine(words, currentX, currentY, spaceWidth, layer);
                }

                currentY += leading;
            }
            
            layer.remove();
        }

        function placeWordsOnLine(words, lineStartX, lineY, spaceW, originalLayer) {
             var currentX = lineStartX;
             var comp = originalLayer.containingComp;
             var textDocument = originalLayer.property("Source Text").value;

             for(var k=0; k < words.length; k++) {
                var word = words[k];
                if (word === "") continue;

                var wordLayer = comp.layers.addText(word);
                var newDoc = wordLayer.property("Source Text").value;
                copyTextProperties(textDocument, newDoc);
                wordLayer.property("Source Text").setValue(newDoc);
                
                var wordRect = wordLayer.sourceRectAtTime(comp.time, false);
                
                wordLayer.property("Position").setValue([currentX - wordRect.left, lineY - wordRect.top]);
                wordLayer.name = word;
                copyLayerProperties(originalLayer, wordLayer);
                
                currentX += wordLayer.sourceRectAtTime(comp.time, false).width + spaceW;
             }
        }
        
        function createLayersFromLines(originalLayer, lines) {
            var comp = originalLayer.containingComp;
            var textProp = originalLayer.property("Source Text");
            var textDocument = textProp.value;
            var leading = textDocument.leading || textDocument.fontSize;
            
            var textRect = originalLayer.sourceRectAtTime(comp.time, false);
            var layerPos = originalLayer.property("Position").value;
            var startY = layerPos[1] + textRect.top;

            for (var i = 0; i < lines.length; i++) {
                if (lines[i].trim() === "") continue;

                var newLineLayer = comp.layers.addText(lines[i]);
                var newDoc = newLineLayer.property("Source Text").value;
                copyTextProperties(textDocument, newDoc);
                newLineLayer.property("Source Text").setValue(newDoc);
                
                var newRect = newLineLayer.sourceRectAtTime(comp.time, false);
                var newY = startY + (i * leading) - newRect.top;
                
                newLineLayer.property("Position").setValue([layerPos[0], newY]);
                newLineLayer.name = "Linha " + (i + 1);

                copyLayerProperties(originalLayer, newLineLayer);
            }
        }

        // FIX: Adicionada verificação para evitar erro de traçado (stroke)
        function copyTextProperties(sourceDoc, targetDoc) {
            targetDoc.font = sourceDoc.font;
            targetDoc.fontSize = sourceDoc.fontSize;
            targetDoc.fillColor = sourceDoc.fillColor;
            targetDoc.applyFill = sourceDoc.applyFill;
            targetDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
            targetDoc.tracking = sourceDoc.tracking;

            if (sourceDoc.applyStroke) {
                targetDoc.applyStroke = true;
                targetDoc.strokeColor = sourceDoc.strokeColor;
                targetDoc.strokeWidth = sourceDoc.strokeWidth;
                targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
            } else {
                targetDoc.applyStroke = false;
            }
        }

        function copyLayerProperties(sourceLayer, targetLayer) {
             targetLayer.property("Anchor Point").setValue(sourceLayer.property("Anchor Point").value);
             targetLayer.property("Scale").setValue(sourceLayer.property("Scale").value);
             targetLayer.property("Rotation").setValue(sourceLayer.property("Rotation").value);
             targetLayer.property("Opacity").setValue(sourceLayer.property("Opacity").value);
             targetLayer.inPoint = sourceLayer.inPoint;
             targetLayer.outPoint = sourceLayer.outPoint;
        }

        win.layout.layout(true);
        win.onResizing = win.onResize = function () { this.layout.resize(); };

        return win;
    }
    
    var myPanel = buildUI(thisObj);
    if (myPanel !== null && myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    }

})(this);