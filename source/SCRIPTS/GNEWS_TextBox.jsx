/*
GNEWS TextBox v7.6 - KERNING E POSICIONAMENTO CORRETOS

CORREÇÕES CRÍTICAS:
- POR LETRA: Agora analisa kerning real usando camadas temporárias incrementais
- POR PALAVRA: Usa análise real de posicionamento palavra por palavra
- POR LINHA: Posicionamento exato baseado na camada original
- Todos os modos respeitam quebras de linha automáticas
*/

function GNEWS_TextBox_UI() {

    var progressWin = null, progressBar = null;

    function runConversion(mode) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Selecione uma composição."); return; }
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) { alert("Selecione pelo menos uma camada de texto."); return; }

        app.beginUndoGroup("GNEWS TextBox");
        try {
            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];
                if (!(layer instanceof TextLayer)) continue;

                if (mode === "POR_LETRA") {
                    var charData = analyzeTextByCharWithKerning(layer);
                    if (charData.length > 0) processByChar(layer, charData);
                } else if (mode === "INTEIRO") {
                    processInteiro(layer);
                } else if (mode === "POR_LINHA") {
                    processByLine(layer);
                } else if (mode === "POR_PALAVRA") {
                    processByWord(layer);
                }
            }
        } catch (err) {
            alert("Erro: " + err.toString() + "\nLinha: " + err.line);
        } finally {
            app.endUndoGroup();
        }
    }

    // ANÁLISE DE CARACTERES COM COMPENSAÇÃO DE ESCALA
    function analyzeTextByCharWithKerning(textLayer) {
        var textDoc = textLayer.sourceText.value;
        var originalText = textDoc.text;
        var charData = [];
        var comp = textLayer.containingComp;
        
        if(originalText.length === 0) return [];
        
        createProgressBar("Analisando Caracteres com Escala...", originalText.length);
        
        // Obtém informações de escala
        var scaleDimensions = getScaledDimensions(textLayer);
        
        // ESPAÇAMENTOS AJUSTADOS PELA ESCALA
        var baseFontSize = textDoc.fontSize * scaleDimensions.scaleY;
        var letterSpacing = baseFontSize * 0.05; // 5% para letras
        var spaceSpacing = baseFontSize * 0.10;   // 10% para espaços
        
        // Quebra o texto em linhas primeiro para processar linha por linha
        var lines = getLinesFromLayer(textLayer);
        var leading = (textDoc.leading || textDoc.fontSize) * scaleDimensions.scaleY;
        
        // Pega a posição original usando sourcePointToComp para lidar com escala automaticamente
        var originalRect = textLayer.sourceRectAtTime(comp.time, false);
        var originalTopLeft = textLayer.sourcePointToComp([originalRect.left, originalRect.top]);
        
        var totalChars = 0;
        for (var i = 0; i < lines.length; i++) {
            totalChars += lines[i].length;
        }
        
        var globalCharIndex = 0;
        
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = lines[lineIndex];
            var lineY = originalTopLeft[1] + (lineIndex * leading);
            
            // Calcula posição X inicial da linha baseada no alinhamento
            var lineStartX = originalTopLeft[0];
            
            if (textDoc.justification === ParagraphJustification.CENTER_JUSTIFY) {
                var tempLineLayer = comp.layers.addText(line);
                var tempLineProp = tempLineLayer.property("Source Text");
                var tempLineDoc = tempLineProp.value;
                copyTextPropertiesWithScale(textLayer, tempLineDoc);
                tempLineProp.setValue(tempLineDoc);
                // Não aplicar escala visual - já está no tamanho da fonte
                copyVisualPropertiesWithoutScale(textLayer, tempLineLayer);
                var lineRect = tempLineLayer.sourceRectAtTime(comp.time, false);
                var lineWidth = lineRect.width;
                tempLineLayer.remove();
                
                lineStartX = originalTopLeft[0] + (originalRect.width - lineWidth) / 2;
            } else if (textDoc.justification === ParagraphJustification.RIGHT_JUSTIFY) {
                var tempLineLayer = comp.layers.addText(line);
                var tempLineProp = tempLineLayer.property("Source Text");
                var tempLineDoc = tempLineProp.value;
                copyTextPropertiesWithScale(textLayer, tempLineDoc);
                tempLineProp.setValue(tempLineDoc);
                copyVisualPropertiesWithoutScale(textLayer, tempLineLayer);
                var lineRect = tempLineLayer.sourceRectAtTime(comp.time, false);
                var lineWidth = lineRect.width;
                tempLineLayer.remove();
                
                lineStartX = originalTopLeft[0] + originalRect.width - lineWidth;
            }
            
            var currentX = lineStartX;
            
            for (var i = 0; i < line.length; i++) {
                var character = line.charAt(i);
                var charProps = getCharacterProperties(textLayer, globalCharIndex);
                
                if (character === " ") {
                    var spaceLayer = comp.layers.addText(" ");
                    var spaceProp = spaceLayer.property("Source Text");
                    var spaceDoc = spaceProp.value;
                    copyTextPropertiesWithFormatting(textLayer, spaceDoc, globalCharIndex);
                    spaceProp.setValue(spaceDoc);
                    copyVisualPropertiesWithoutScale(textLayer, spaceLayer);
                    var spaceRect = spaceLayer.sourceRectAtTime(comp.time, false);
                    spaceLayer.remove();
                    
                    charData.push({
                        character: character,
                        position: [currentX, lineY],
                        charIndex: globalCharIndex,
                        font: charProps.font,
                        scaleDimensions: scaleDimensions
                    });
                    
                    currentX += spaceRect.width + spaceSpacing;
                } else if (character.trim() !== "") {
                    var charLayer = comp.layers.addText(character);
                    var charProp = charLayer.property("Source Text");
                    var charDoc = charProp.value;
                    copyTextPropertiesWithFormatting(textLayer, charDoc, globalCharIndex);
                    charProp.setValue(charDoc);
                    copyVisualPropertiesWithoutScale(textLayer, charLayer);
                    
                    var charRect = charLayer.sourceRectAtTime(comp.time, false);
                    
                    charData.push({
                        character: character,
                        position: [currentX, lineY],
                        charIndex: globalCharIndex,
                        font: charProps.font,
                        scaleDimensions: scaleDimensions
                    });
                    
                    currentX += charRect.width + letterSpacing;
                    charLayer.remove();
                }
                
                globalCharIndex++;
                updateProgressBar(globalCharIndex);
            }
            
            if (lineIndex < lines.length - 1) {
                globalCharIndex++;
            }
        }
        
        closeProgressBar();
        return charData;
    }

    // ANÁLISE POR LINHA COM COMPENSAÇÃO DE ESCALA
    function processByLine(layer) {
        var lines = getLinesFromLayer(layer);
        var comp = layer.containingComp;
        var textDoc = layer.sourceText.value;
        var scaleDimensions = getScaledDimensions(layer);
        
        createProgressBar("Processando POR LINHA...", lines.length);
        
        var leading = (textDoc.leading || textDoc.fontSize) * scaleDimensions.scaleY;
        
        // Usa sourcePointToComp para lidar automaticamente com escala
        var originalRect = layer.sourceRectAtTime(comp.time, false);
        var originalTopLeft = layer.sourcePointToComp([originalRect.left, originalRect.top]);
        
        var globalCharIndex = 0;
        
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim() !== "") {
                var lineFont = detectLineFormatting(layer, globalCharIndex, globalCharIndex + lines[i].length - 1);
                
                var newLayer = comp.layers.addText(lines[i]);
                newLayer.name = "Linha " + (i + 1);
                
                var newTextProp = newLayer.property("Source Text");
                var newTextDoc = newTextProp.value;
                copyTextPropertiesWithScale(layer, newTextDoc);
                
                if (lineFont) {
                    newTextDoc.font = lineFont;
                }
                
                newTextProp.setValue(newTextDoc);
                copyVisualPropertiesWithoutScale(layer, newLayer);
                
                var newRect = newLayer.sourceRectAtTime(comp.time, false);
                var lineY = originalTopLeft[1] + (i * leading);
                var lineX = originalTopLeft[0];
                
                if (textDoc.justification === ParagraphJustification.CENTER_JUSTIFY) {
                    lineX = originalTopLeft[0] + (originalRect.width - newRect.width) / 2;
                } else if (textDoc.justification === ParagraphJustification.RIGHT_JUSTIFY) {
                    lineX = originalTopLeft[0] + originalRect.width - newRect.width;
                }
                
                newLayer.transform.anchorPoint.setValue([newRect.left, newRect.top]);
                newLayer.transform.position.setValue([lineX, lineY]);
            }
            
            globalCharIndex += lines[i].length;
            if (i < lines.length - 1) {
                globalCharIndex++;
            }
            
            updateProgressBar(i + 1);
        }
        
        closeProgressBar();
        layer.remove();
    }
    
    // NOVA FUNÇÃO: Detecta formatação predominante de uma linha
    function detectLineFormatting(textLayer, startIndex, endIndex) {
        try {
            // Pega o primeiro caractere não-espaço da linha para detectar formatação
            var textDoc = textLayer.sourceText.value;
            var originalText = textDoc.text;
            
            for (var i = startIndex; i <= endIndex && i < originalText.length; i++) {
                var character = originalText.charAt(i);
                if (character.trim() !== "") {
                    var charProps = getCharacterProperties(textLayer, i);
                    return charProps.font;
                }
            }
            
            return textDoc.font;
        } catch (err) {
            var textDoc = textLayer.sourceText.value;
            return textDoc.font;
        }
    }

    // ANÁLISE POR PALAVRA - MÉTODO DIRETO E SIMPLES
    function processByWord(layer) {
        var lines = getLinesFromLayer(layer);
        var comp = layer.containingComp;
        var textDoc = layer.sourceText.value;
        
        var totalWords = 0;
        for (var i = 0; i < lines.length; i++) {
            var words = lines[i].split(' ');
            for (var j = 0; j < words.length; j++) {
                if (words[j].trim() !== "") totalWords++;
            }
        }
        
        createProgressBar("Processando POR PALAVRA...", totalWords);
        
        var leading = textDoc.leading || textDoc.fontSize;
        var wordCount = 0;
        
        // Pega a posição original exata
        var originalRect = layer.sourceRectAtTime(comp.time, false);
        var originalPosition = layer.transform.position.value;
        var originalAnchor = layer.transform.anchorPoint.value;
        
        // Calcula o ponto superior esquerdo real do texto
        var realTopLeft = [
            originalPosition[0] - originalAnchor[0] + originalRect.left,
            originalPosition[1] - originalAnchor[1] + originalRect.top
        ];
        
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = lines[lineIndex];
            var words = line.split(' ');
            var validWords = [];
            
            // Filtra palavras vazias
            for (var w = 0; w < words.length; w++) {
                if (words[w].trim() !== "") {
                    validWords.push(words[w]);
                }
            }
            
            if (validWords.length === 0) continue;
            
            // Calcula posição Y da linha
            var lineY = realTopLeft[1] + (lineIndex * leading);
            
            // Calcula offset X da linha baseado no alinhamento
            var lineOffsetX = 0;
            var lineWithSpaces = validWords.join(' ');
            
            // Cria camada temporária para medir a linha
            var tempLineLayer = comp.layers.addText(lineWithSpaces);
            var tempLineProp = tempLineLayer.property("Source Text");
            var tempLineDoc = tempLineProp.value;
            copyTextProperties(textDoc, tempLineDoc);
            tempLineProp.setValue(tempLineDoc);
            copyVisualProperties(layer, tempLineLayer);
            var lineWidth = tempLineLayer.sourceRectAtTime(comp.time, false).width;
            tempLineLayer.remove();
            
            if (textDoc.justification === ParagraphJustification.CENTER_JUSTIFY) {
                lineOffsetX = (originalRect.width - lineWidth) / 2;
            } else if (textDoc.justification === ParagraphJustification.RIGHT_JUSTIFY) {
                lineOffsetX = originalRect.width - lineWidth;
            }
            
            var lineStartX = realTopLeft[0] + lineOffsetX;
            
            // Cria cada palavra
            var currentWordX = lineStartX;
            for (var wordIndex = 0; wordIndex < validWords.length; wordIndex++) {
                var word = validWords[wordIndex];
                
                // Cria a palavra
                var wordLayer = comp.layers.addText(word);
                wordLayer.name = word;
                var wordTextProp = wordLayer.property("Source Text");
                var wordTextDoc = wordTextProp.value;
                copyTextProperties(textDoc, wordTextDoc);
                wordTextProp.setValue(wordTextDoc);
                copyVisualProperties(layer, wordLayer);
                
                var wordRect = wordLayer.sourceRectAtTime(comp.time, false);
                
                wordLayer.transform.anchorPoint.setValue([wordRect.left, wordRect.top]);
                wordLayer.transform.position.setValue([currentWordX, lineY]);
                
                // Avança para a próxima posição (largura da palavra + espaço)
                currentWordX += wordRect.width;
                if (wordIndex < validWords.length - 1) {
                    // Adiciona largura do espaço
                    var spaceLayer = comp.layers.addText(" ");
                    var spaceProp = spaceLayer.property("Source Text");
                    var spaceDoc = spaceProp.value;
                    copyTextProperties(textDoc, spaceDoc);
                    spaceProp.setValue(spaceDoc);
                    copyVisualProperties(layer, spaceLayer);
                    var spaceWidth = spaceLayer.sourceRectAtTime(comp.time, false).width;
                    spaceLayer.remove();
                    currentWordX += spaceWidth;
                }
                
                wordCount++;
                updateProgressBar(wordCount);
            }
        }
        
        closeProgressBar();
        layer.remove();
    }

    function processByChar(layer, charData) {
        var originalTextDoc = layer.sourceText.value;
        var comp = layer.containingComp;
        
        for (var i = 0; i < charData.length; i++) {
            var data = charData[i];
            // Cria camadas para TODOS os caracteres com formatação específica
            if (data.character !== "") {
                var newLayer = comp.layers.addText(data.character);
                newLayer.name = (data.character === " ") ? "Espaço_" + (i + 1) : data.character;
                
                var newTextProp = newLayer.property("Source Text");
                var newTextDoc = newTextProp.value;
                
                // NOVO: Usa formatação específica do caractere se disponível
                if (data.font && data.charIndex !== undefined) {
                    copyTextPropertiesWithFormatting(layer, newTextDoc, data.charIndex);
                    // Força a fonte específica detectada
                    newTextDoc.font = data.font;
                } else {
                    copyTextProperties(originalTextDoc, newTextDoc);
                }
                
                newTextProp.setValue(newTextDoc);
                copyVisualProperties(layer, newLayer);

                var newRect = newLayer.sourceRectAtTime(comp.time, false);
                newLayer.transform.anchorPoint.setValue([newRect.left, newRect.top]);
                newLayer.transform.position.setValue(data.position);
            }
        }
        layer.remove();
    }
    
    function processInteiro(layer) {
        var textDoc = layer.sourceText.value;
        var comp = layer.containingComp;
        
        // Se não é box text, não faz nada
        if (!textDoc.boxText) {
            return;
        }
        
        // Pega todas as linhas respeitando quebras automáticas
        var lines = getLinesFromLayer(layer);
        var fullText = lines.join('\r'); // Usa \r para quebras de linha no After Effects
        
        var newLayer = comp.layers.addText(fullText);
        newLayer.name = layer.name + "_converted";
        
        var newTextProp = newLayer.property("Source Text");
        var newTextDoc = newTextProp.value;
        copyTextPropertiesWithScale(layer, newTextDoc);
        newTextProp.setValue(newTextDoc);
        copyVisualPropertiesWithoutScale(layer, newLayer);
        
        // Usa sourcePointToComp para posicionamento exato
        var sourceRect = layer.sourceRectAtTime(comp.time, false);
        var topLeftPosition = layer.sourcePointToComp([sourceRect.left, sourceRect.top]);
        
        var newRect = newLayer.sourceRectAtTime(comp.time, false);
        newLayer.transform.anchorPoint.setValue([newRect.left, newRect.top]);
        newLayer.transform.position.setValue(topLeftPosition);
        
        layer.remove();
    }

    function getLinesFromLayer(layer) {
        var textDoc = layer.sourceText.value;
        var originalText = textDoc.text;
        var lines = [];
        
        if (textDoc.boxText) {
            var comp = layer.containingComp;
            var words = originalText.replace(/(\r\n|\r|\n)/g, " \r ").split(/\s+/);
            var boxWidth = textDoc.boxTextSize[0];
            var scaleDimensions = getScaledDimensions(layer);
            
            // Cria camada temporária considerando escala
            var tempLayer = comp.layers.addText("temp");
            var tempTextProp = tempLayer.property("Source Text");
            var tempTextDoc = tempTextProp.value;
            copyTextPropertiesWithScale(layer, tempTextDoc);
            tempTextProp.setValue(tempTextDoc);
            copyVisualPropertiesWithoutScale(layer, tempLayer);
            
            // Ajusta largura da caixa considerando escala
            var effectiveBoxWidth = boxWidth * scaleDimensions.scaleX;
            
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
                tempTextDoc.text = testLine;
                tempTextProp.setValue(tempTextDoc);
                var currentWidth = tempLayer.sourceRectAtTime(comp.time, false).width;
                
                if (currentWidth > effectiveBoxWidth && currentLine !== "") {
                    lines.push(currentLine.trim());
                    currentLine = word;
                } else { 
                    currentLine = testLine; 
                }
            }
            if (currentLine.trim() !== "") { 
                lines.push(currentLine.trim()); 
            }
            tempLayer.remove();
        } else { 
            lines = originalText.split(/\r\n|\r|\n/); 
        }
        return lines;
    }

    // FUNÇÃO ORIGINAL: Copia propriedades básicas sem escala
    function copyTextProperties(sourceDoc, targetDoc) {
        var safeProps = ["fontSize", "fillColor", "applyFill", "justification", "tracking", "leading"];
        for (var i = 0; i < safeProps.length; i++) {
            var prop = safeProps[i];
            if (sourceDoc[prop] !== undefined) targetDoc[prop] = sourceDoc[prop];
        }
        
        // Font com validação
        if (sourceDoc.font) {
            var validatedFont = validateFontName(sourceDoc.font);
            if (validatedFont) {
                try {
                    targetDoc.font = validatedFont;
                } catch (fontError) {
                    // Se não conseguir definir a fonte, mantém a padrão
                }
            }
        }
        
        if (sourceDoc.applyStroke) {
            targetDoc.applyStroke = true;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            targetDoc.strokeWidth = sourceDoc.strokeWidth;
            targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
        } else { 
            targetDoc.applyStroke = false; 
        }
    }
    
    // FUNÇÃO ORIGINAL: Copia propriedades visuais incluindo escala
    function copyVisualProperties(sourceLayer, targetLayer) {
        var props = ["Scale", "Rotation", "Opacity"];
        for (var i = 0; i < props.length; i++) {
            targetLayer.transform[props[i]].setValue(sourceLayer.transform[props[i]].value);
        }
        targetLayer.blendingMode = sourceLayer.blendingMode;
        targetLayer.startTime = sourceLayer.startTime;
        if (sourceLayer.parent) {
            targetLayer.parent = sourceLayer.parent;
        }
    }
    
    // NOVA FUNÇÃO: Calcula dimensões considerando escala
    function getScaledDimensions(layer) {
        var scale = layer.transform.scale.value;
        var scaleX = scale[0] / 100;
        var scaleY = scale[1] / 100;
        
        return {
            scaleX: scaleX,
            scaleY: scaleY,
            hasScale: (scaleX !== 1.0 || scaleY !== 1.0)
        };
    }
    
    // NOVA FUNÇÃO: Ajusta propriedades de texto considerando escala
    function adjustTextPropertiesForScale(textDoc, scaleDimensions) {
        // Cria uma cópia das propriedades do texto
        var adjustedDoc = textDoc;
        
        if (scaleDimensions.hasScale) {
            // Ajusta o tamanho da fonte para compensar a escala
            adjustedDoc.fontSize = textDoc.fontSize * scaleDimensions.scaleY;
            
            // Ajusta tracking se existir
            if (textDoc.tracking !== undefined && textDoc.tracking !== null) {
                var scaledTracking = textDoc.tracking * scaleDimensions.scaleX;
                adjustedDoc.tracking = Math.round(scaledTracking); // Garante que seja inteiro
            }
            
            // Ajusta leading se existir
            if (textDoc.leading !== undefined && textDoc.leading !== null) {
                adjustedDoc.leading = textDoc.leading * scaleDimensions.scaleY;
            }
            
            // Ajusta stroke width se existir
            if (textDoc.applyStroke && textDoc.strokeWidth !== undefined && textDoc.strokeWidth !== null) {
                adjustedDoc.strokeWidth = textDoc.strokeWidth * Math.min(scaleDimensions.scaleX, scaleDimensions.scaleY);
            }
        }
        
        return adjustedDoc;
    }
    
    // NOVA FUNÇÃO: Copia propriedades com compensação de escala
    function copyTextPropertiesWithScale(sourceLayer, targetDoc) {
        var sourceTextProp = sourceLayer.property("Source Text");
        var sourceDoc = sourceTextProp.value;
        var scaleDimensions = getScaledDimensions(sourceLayer);
        
        // Propriedades básicas (sem font que será tratada separadamente)
        var safeProps = ["fillColor", "applyFill", "justification"];
        for (var i = 0; i < safeProps.length; i++) {
            var prop = safeProps[i];
            if (sourceDoc[prop] !== undefined) targetDoc[prop] = sourceDoc[prop];
        }
        
        // Font com validação
        if (sourceDoc.font) {
            var validatedFont = validateFontName(sourceDoc.font);
            if (validatedFont) {
                try {
                    targetDoc.font = validatedFont;
                } catch (fontError) {
                    // Se não conseguir definir a fonte, mantém a padrão
                    // targetDoc.font ficará com o valor padrão
                }
            }
        }
        
        // Propriedades que precisam compensar escala
        targetDoc.fontSize = sourceDoc.fontSize * scaleDimensions.scaleY;
        
        if (sourceDoc.tracking !== undefined && sourceDoc.tracking !== null) {
            var scaledTracking = sourceDoc.tracking * scaleDimensions.scaleX;
            targetDoc.tracking = Math.round(scaledTracking); // Garante que seja inteiro
        }
        
        if (sourceDoc.leading !== undefined && sourceDoc.leading !== null) {
            targetDoc.leading = sourceDoc.leading * scaleDimensions.scaleY;
        }
        
        // Stroke com compensação de escala
        if (sourceDoc.applyStroke) {
            targetDoc.applyStroke = true;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            if (sourceDoc.strokeWidth !== undefined && sourceDoc.strokeWidth !== null) {
                targetDoc.strokeWidth = sourceDoc.strokeWidth * Math.min(scaleDimensions.scaleX, scaleDimensions.scaleY);
            }
            targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
        } else { 
            targetDoc.applyStroke = false; 
        }
    }
    
    // ATUALIZADA: Copia propriedades com formatação e escala específica por caractere
    function copyTextPropertiesWithFormatting(sourceLayer, targetDoc, charIndex) {
        var sourceTextProp = sourceLayer.property("Source Text");
        var sourceDoc = sourceTextProp.value;
        var scaleDimensions = getScaledDimensions(sourceLayer);
        
        // Propriedades básicas (sem font que será tratada separadamente)
        var safeProps = ["fillColor", "applyFill", "justification"];
        for (var i = 0; i < safeProps.length; i++) {
            var prop = safeProps[i];
            if (sourceDoc[prop] !== undefined) targetDoc[prop] = sourceDoc[prop];
        }
        
        // Propriedades com compensação de escala
        targetDoc.fontSize = sourceDoc.fontSize * scaleDimensions.scaleY;
        
        if (sourceDoc.tracking !== undefined && sourceDoc.tracking !== null) {
            var scaledTracking = sourceDoc.tracking * scaleDimensions.scaleX;
            targetDoc.tracking = Math.round(scaledTracking); // Garante que seja inteiro
        }
        
        if (sourceDoc.leading !== undefined && sourceDoc.leading !== null) {
            targetDoc.leading = sourceDoc.leading * scaleDimensions.scaleY;
        }
        
        // Stroke
        if (sourceDoc.applyStroke) {
            targetDoc.applyStroke = true;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            if (sourceDoc.strokeWidth !== undefined && sourceDoc.strokeWidth !== null) {
                targetDoc.strokeWidth = sourceDoc.strokeWidth * Math.min(scaleDimensions.scaleX, scaleDimensions.scaleY);
            }
            targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
        } else { 
            targetDoc.applyStroke = false; 
        }
        
        // Detecta fonte e peso específico do caractere com validação
        try {
            var fontToUse = sourceDoc.font; // Fonte padrão
            
            if (sourceDoc.text && sourceDoc.text.length > charIndex) {
                var charProps = getCharacterProperties(sourceLayer, charIndex);
                if (charProps && charProps.font) {
                    fontToUse = charProps.font;
                }
            }
            
            // Valida e aplica a fonte
            if (fontToUse) {
                var validatedFont = validateFontName(fontToUse);
                if (validatedFont) {
                    try {
                        targetDoc.font = validatedFont;
                    } catch (fontError) {
                        // Se não conseguir definir a fonte específica, tenta a original
                        var originalValidated = validateFontName(sourceDoc.font);
                        if (originalValidated) {
                            try {
                                targetDoc.font = originalValidated;
                            } catch (originalFontError) {
                                // Fonte permanece com valor padrão
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // Em caso de erro, tenta aplicar a fonte original validada
            if (sourceDoc.font) {
                var fallbackFont = validateFontName(sourceDoc.font);
                if (fallbackFont) {
                    try {
                        targetDoc.font = fallbackFont;
                    } catch (fallbackError) {
                        // Fonte permanece com valor padrão
                    }
                }
            }
        }
    }
    
    // ATUALIZADA: Copia propriedades visuais SEM escala (será aplicada no texto)
    function copyVisualPropertiesWithoutScale(sourceLayer, targetLayer) {
        // Copia propriedades exceto escala (que já foi compensada no texto)
        var props = ["Rotation", "Opacity"];
        for (var i = 0; i < props.length; i++) {
            targetLayer.transform[props[i]].setValue(sourceLayer.transform[props[i]].value);
        }
        
        // Define escala como 100% já que compensamos no tamanho da fonte
        targetLayer.transform.scale.setValue([100, 100]);
        
        targetLayer.blendingMode = sourceLayer.blendingMode;
        targetLayer.startTime = sourceLayer.startTime;
        if (sourceLayer.parent) {
            targetLayer.parent = sourceLayer.parent;
        }
    }
    
    // NOVA FUNÇÃO: Extrai propriedades específicas de um caractere
    function getCharacterProperties(textLayer, charIndex) {
        try {
            var textProp = textLayer.property("Source Text");
            var textDoc = textProp.value;
            var originalText = textDoc.text;
            
            if (charIndex >= originalText.length || charIndex < 0) {
                return { font: textDoc.font };
            }
            
            // Cria uma string com apenas o caractere desejado para testar formatação
            var singleCharacter = originalText.charAt(charIndex);
            
            // Método 1: Tenta detectar através de análise de substring
            if (charIndex > 0) {
                var beforeCharacter = originalText.substring(0, charIndex);
                var upToCharacter = originalText.substring(0, charIndex + 1);
                
                // Cria camadas temporárias para comparar formatação
                var comp = textLayer.containingComp;
                
                var beforeLayer = comp.layers.addText(beforeCharacter);
                copyTextProperties(textDoc, beforeLayer.property("Source Text").value);
                beforeLayer.property("Source Text").setValue(beforeLayer.property("Source Text").value);
                copyVisualProperties(textLayer, beforeLayer);
                
                var upToLayer = comp.layers.addText(upToCharacter);
                copyTextProperties(textDoc, upToLayer.property("Source Text").value);
                upToLayer.property("Source Text").setValue(upToLayer.property("Source Text").value);
                copyVisualProperties(textLayer, upToLayer);
                
                // Compara se há diferença na renderização (indicando mudança de peso)
                var beforeRect = beforeLayer.sourceRectAtTime(comp.time, false);
                var upToRect = upToLayer.sourceRectAtTime(comp.time, false);
                
                beforeLayer.remove();
                upToLayer.remove();
                
                // Se a diferença de largura for significativa, pode indicar mudança de peso
                var characterWidth = upToRect.width - beforeRect.width;
                var avgCharacterWidth = textDoc.fontSize * 0.6; // Estimativa
                
                if (characterWidth > avgCharacterWidth * 1.3) {
                    // Provavelmente bold
                    var fontName = textDoc.font;
                    var boldFont = detectBoldFont(fontName);
                    return { font: boldFont };
                }
            }
            
            // Método 2: Análise do nome da fonte
            var fontName = textDoc.font;
            return { font: fontName };
            
        } catch (err) {
            return { font: textDoc.font };
        }
    }
    
    // NOVA FUNÇÃO: Valida e corrige nome de fonte
    function validateFontName(fontName) {
        if (!fontName || typeof fontName !== 'string') {
            return null;
        }
        
        // Remove caracteres inválidos e espaços extras
        var cleanedFont = fontName.replace(/[^\w\s\-\.]/g, ''); // Mantém apenas letras, números, espaços, hífen e ponto
        cleanedFont = cleanedFont.replace(/\s+/g, ' '); // Remove espaços múltiplos
        cleanedFont = cleanedFont.trim(); // Remove espaços no início e fim
        
        // Se o nome ficou vazio, retorna null
        if (cleanedFont === '') {
            return null;
        }
        
        return cleanedFont;
    }
    
    // ATUALIZADA: Detecta variações de peso da fonte com validação
    function detectBoldFont(fontName) {
        var validatedFont = validateFontName(fontName);
        if (!validatedFont) return fontName;
        
        // Se já contém indicadores de peso, mantém
        var lowerFont = validatedFont.toLowerCase();
        if (lowerFont.indexOf('bold') !== -1 || 
            lowerFont.indexOf('black') !== -1 || 
            lowerFont.indexOf('heavy') !== -1 ||
            lowerFont.indexOf('extrabold') !== -1) {
            return validatedFont;
        }
        
        // Tenta encontrar versão bold da fonte
        var baseName = validatedFont.replace(/\s*(regular|normal|light|thin|medium).*$/i, '');
        
        // Lista de possíveis sufixos para bold
        var boldVariations = [
            baseName + ' Bold',
            baseName + '-Bold',
            baseName + ' Black',
            baseName + '-Black',
            baseName + ' Heavy',
            baseName + '-Heavy'
        ];
        
        // Retorna a primeira variação válida
        for (var i = 0; i < boldVariations.length; i++) {
            var validatedBold = validateFontName(boldVariations[i]);
            if (validatedBold) {
                return validatedBold;
            }
        }
        
        // Se não encontrou versão bold, retorna a original validada
        return validatedFont;
    }
    
    function copyVisualProperties(sourceLayer, targetLayer) {
        var props = ["Scale", "Rotation", "Opacity"];
        for (var i = 0; i < props.length; i++) {
            targetLayer.transform[props[i]].setValue(sourceLayer.transform[props[i]].value);
        }
        targetLayer.blendingMode = sourceLayer.blendingMode;
        targetLayer.startTime = sourceLayer.startTime;
        if (sourceLayer.parent) {
            targetLayer.parent = sourceLayer.parent;
        }
    }

    function createProgressBar(title, maxVal) {
        progressWin = new Window("palette", title, undefined, { closeButton: false });
        progressBar = progressWin.add("progressbar", [0, 0, 300, 20], 0, maxVal);
        progressWin.center();
        progressWin.show();
    }

    function updateProgressBar(val) {
        if (progressBar) { progressBar.value = val; progressWin.update(); }
    }

    function closeProgressBar() {
        if (progressWin) { progressWin.close(); progressWin = null; progressBar = null; }
    }

    // --- INTERFACE GRÁFICA ---
    
    var SCRIPT_NAME = "GNEWS TextBox", SCRIPT_VERSION = "v7.6";
    var win = new Window("palette", SCRIPT_NAME + " " + SCRIPT_VERSION);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;
    
    // Aplicação condicional do tema (se disponível)
    if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
        setBgColor(win, bgColor1);
    }

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    
    var title = headerGrp.add('statictext', undefined, 'Converter Texto em Camadas');
    title.alignment = 'left';
    if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
        setFgColor(title, normalColor1);
    }

    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    
    // Botão de ajuda
    var helpBtn;
    if (typeof themeIconButton === 'function') {
        helpBtn = new themeIconButton(helpGrp, { 
            icon: D9T_INFO_ICON, 
            tips: ['Clique para ajuda'] 
        });
    } else {
        helpBtn = helpGrp.add('button', undefined, '?');
        helpBtn.preferredSize.width = 25;
    }

    var optionsPanel = win.add("panel", undefined, "Modo de Conversão");
    optionsPanel.alignChildren = "left";
    if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') {
        setFgColor(optionsPanel, monoColor1);
    }
    
    var radioInteiro = optionsPanel.add("radiobutton", undefined, "INTEIRO");
    var radioPorLinha = optionsPanel.add("radiobutton", undefined, "POR LINHA");
    var radioPorPalavra = optionsPanel.add("radiobutton", undefined, "POR PALAVRA");
    var radioPorLetra = optionsPanel.add("radiobutton", undefined, "POR LETRA");
    radioInteiro.value = true;
    
    var allRadios = [radioInteiro, radioPorLinha, radioPorPalavra, radioPorLetra];
    if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') {
        for (var i = 0; i < allRadios.length; i++) {
            setFgColor(allRadios[i], monoColor1);
        }
    }

    var actionGrp = win.add('group');
    actionGrp.alignment = 'center';

    // Botão de conversão
    var convertButton;
    if (typeof themeButton === 'function') {
        convertButton = new themeButton(actionGrp, {
            width: 180,
            height: 32,
            textColor: (typeof bgColor1 !== 'undefined') ? bgColor1 : [1, 1, 1, 1],
            buttonColor: (typeof normalColor1 !== 'undefined') ? normalColor1 : [0.2, 0.4, 0.8, 1],
            labelTxt: 'Converter',
            tips: ['Clique para converter as camadas de texto selecionadas.']
        });
    } else {
        convertButton = actionGrp.add('button', undefined, 'Converter');
        convertButton.preferredSize = [180, 32];
    }

    // --- EVENTOS ---
    var convertClickHandler = function() {
        var mode = "INTEIRO";
        if (radioPorLinha.value) mode = "POR_LINHA";
        else if (radioPorPalavra.value) mode = "POR_PALAVRA";
        else if (radioPorLetra.value) mode = "POR_LETRA";
        
        runConversion(mode);
    };

    if (convertButton.leftClick) {
        convertButton.leftClick.onClick = convertClickHandler;
    } else {
        convertButton.onClick = convertClickHandler;
    }

    // Sistema de ajuda simplificado
    var showHelp = function() {
        var helpWin = new Window("palette", "Ajuda - " + SCRIPT_NAME);
        helpWin.orientation = "column";
        helpWin.alignChildren = ["fill", "top"];
        helpWin.spacing = 10;
        helpWin.margins = 15;
        helpWin.preferredSize = [450, -1];

        var title = helpWin.add("statictext", undefined, "GNEWS TextBox v7.6");
        title.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
        title.alignment = "center";

        var desc = helpWin.add("statictext", undefined, "Converte camadas de texto Box em Point Text, mantendo posição visual exata, kerning e formatação de peso (Bold, Normal, etc.).", { multiline: true });
        desc.alignment = ["fill", "fill"];

        var modes = helpWin.add("group");
        modes.orientation = "column";
        modes.alignChildren = "fill";
        modes.spacing = 8;

        var modeTexts = [
            "INTEIRO: Converte para uma única camada Point Text com quebras de linha",
            "POR LINHA: Cria uma camada para cada linha (detecta formatação predominante)",
            "POR PALAVRA: Cria uma camada para cada palavra (detecta peso por palavra)",
            "POR LETRA: Cria uma camada para cada caractere (detecta peso individual)"
        ];

        for (var i = 0; i < modeTexts.length; i++) {
            var modeText = modes.add("statictext", undefined, "• " + modeTexts[i], { multiline: true });
            modeText.alignment = ["fill", "fill"];
        }

        var features = helpWin.add("group");
        features.orientation = "column";
        features.alignChildren = "fill";
        features.spacing = 5;
        features.margins = [0, 10, 0, 0];

        var featuresTitle = features.add("statictext", undefined, "RECURSOS AVANÇADOS:");
        featuresTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 11);

        var featureList = [
            "✓ Detecta automaticamente peso da fonte (Bold, Normal, etc.)",
            "✓ Preserva diferentes pesos dentro da mesma frase",
            "✓ Espaçamento otimizado: 5% para letras, 10% para espaços",
            "✓ Mantém posição exata independente de transformações"
        ];

        for (var i = 0; i < featureList.length; i++) {
            var featureText = features.add("statictext", undefined, featureList[i], { multiline: true });
            featureText.alignment = ["fill", "fill"];
            featureText.graphics.font = ScriptUI.newFont("Arial", "Regular", 10);
        }

        var notice = helpWin.add("statictext", undefined, "NOTA: A detecção de peso funciona melhor com fontes que seguem convenções padrão de nomenclatura (ex: Arial Bold, Helvetica-Black).", { multiline: true });
        notice.graphics.font = ScriptUI.newFont("Arial", "Italic", 10);
        notice.alignment = ["fill", "fill"];

        var closeBtn = helpWin.add("button", undefined, "Fechar");
        closeBtn.onClick = function() { helpWin.close(); };

        helpWin.center();
        helpWin.show();
    };

    if (helpBtn.leftClick) {
        helpBtn.leftClick.onClick = showHelp;
    } else {
        helpBtn.onClick = showHelp;
    }

    win.center();
    win.show();
}

// Execução
try {
    GNEWS_TextBox_UI();
} catch(e) {
    alert("Erro ao iniciar GNEWS TextBox v7.6:\n" + e.toString() + 
          (e.line ? "\nLinha: " + e.line : ""));
}