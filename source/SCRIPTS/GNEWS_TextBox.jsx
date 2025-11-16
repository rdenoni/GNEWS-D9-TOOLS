/**********************************************************************************
 *
 * GNEWS TextBox
 * Versão: 9.8 (Correção de Eventos de Botão e Hover)
 *
 * DESCRIÇÃO:
 * Converte camadas de texto 'Box Text' para 'Point Text' e oferece ferramentas
 * de formatação de texto.
 *
 * MODULOS USADOS:
 * source/globals.js (para variáveis de tema e cores)
 * source/libraries/HELP lib.js (para a janela de ajuda)
 * source/layout/main_ui_functions.js (para os componentes 'themeButton' e 'themeIconButton')
 *
 * ATUALIZAÇÃO (v9.8):
 * - CORREÇÃO DE FUNCIONALIDADE: Corrigido um erro que impedia o funcionamento
 * dos cliques nos botões temáticos.
 * - CORREÇÃO DE HOVER: Restaurado o efeito de hover (mudança de cor ao passar
 * o mouse) para todos os botões, incluindo as cores personalizadas para os
 * botões de formatação de texto.
 * --------------------------------------------A FUNÇÃO DE COPIAR AS PROPRIEDADES DOS EFEITOS NA CONVERSÃO AINDA NAO ESTA FUNCIONANDO---------------------------
 * Esta carregando a função duas vezes.
 *
 **********************************************************************************/

// Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

function createUI(thisObj) {
	// =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// =================================================================================
	var SCRIPT_NAME = "GNEWS TextBox";
    var SCRIPT_VERSION = "9.8";
    var SCRIPT_WINDOW_TITLE = SCRIPT_NAME + " v" + SCRIPT_VERSION;
    var SCRIPT_SUBTITLE = "Converte e Formata Textos";

    var LARGURA_JANELA = 400;
    var MARGENS_JANELA = 16;
    var ESPACAMENTO_ELEMENTOS = 10;
    var LARGURA_BOTAO_AJUDA = 25;
    var LARGURA_BOTAO_ACAO = 180;
    var ALTURA_BOTAO_ACAO = 28;

	var progressWin = null, progressBar = null;

	// =================================================================================
	// --- FUNÇÕES AUXILIARES E PRINCIPAIS ---
	// =================================================================================

    function themedAlert(title, message) {
        var alertWin = new Window("dialog", title);
        alertWin.orientation = "column";
        alertWin.alignChildren = "center";
        alertWin.spacing = 15;
        alertWin.margins = 20;
        if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
            setBgColor(alertWin, bgColor1);
        }
        var msgText = alertWin.add("statictext", undefined, message, { multiline: true });
        msgText.preferredSize.width = 300;
        if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') {
            setFgColor(msgText, monoColor1);
        }
        var okBtn = alertWin.add("button", undefined, "OK");
        okBtn.onClick = function() { alertWin.close(); };
        alertWin.center();
        alertWin.show();
    }

    function getTargetTextLayers() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            themedAlert("Erro", "Por favor, selecione ou abra uma composição.");
            return null;
        }
        var layersToProcess = [];
        var selectedLayers = comp.selectedLayers;
        for (var i = 0; i < selectedLayers.length; i++) {
            if (selectedLayers[i] instanceof TextLayer) {
                layersToProcess.push(selectedLayers[i]);
            }
        }
        if (layersToProcess.length === 0) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j) instanceof TextLayer) {
                    layersToProcess.push(comp.layer(j));
                }
            }
        }
        if (layersToProcess.length === 0) {
            themedAlert("Aviso", "Nenhuma camada de texto encontrada na composição ativa.");
            return null;
        }
        return layersToProcess;
    }

    function changeCase(caseType) {
        var layersToProcess = getTargetTextLayers();
        if (!layersToProcess) return;
        var undoGroup = (caseType === 'upper') ? "Transformar em Maiúsculas" : "Transformar em Minúsculas";
        app.beginUndoGroup(undoGroup);
        try {
            for (var i = 0; i < layersToProcess.length; i++) {
                var textLayer = layersToProcess[i];
                var textProp = textLayer.property("Source Text");
                var textDoc = textProp.value;
                var currentText = textDoc.text;
                var newText = (caseType === 'upper') ? currentText.toUpperCase() : currentText.toLowerCase();
                textDoc.text = newText;
                textProp.setValue(textDoc);
            }
        } catch (err) {
            themedAlert("Erro ao Alterar Case", "Ocorreu um erro: " + err.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function runConversion(mode) {
        var layersToProcess = getTargetTextLayers();
        if (!layersToProcess) return;
        app.beginUndoGroup("GNEWS TextBox Conversion");
        try {
            for (var i = 0; i < layersToProcess.length; i++) {
                var layer = layersToProcess[i];
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
            themedAlert("Erro Durante a Conversão", "Ocorreu um erro: " + err.toString() + "\nLinha: " + err.line);
        } finally {
            app.endUndoGroup();
        }
    }

    function analyzeTextByCharWithKerning(textLayer) {
        var textDoc = textLayer.sourceText.value;
        var originalText = textDoc.text;
        var charData = [];
        var comp = textLayer.containingComp;
        if(originalText.length === 0) return [];
        createProgressBar("Analisando Caracteres com Escala...", originalText.length);
        var scaleDimensions = getScaledDimensions(textLayer);
        var baseFontSize = textDoc.fontSize * scaleDimensions.scaleY;
        var letterSpacing = baseFontSize * 0.05;
        var spaceSpacing = baseFontSize * 0.10;
        var lines = getLinesFromLayer(textLayer);
        var leading = (textDoc.leading || textDoc.fontSize) * scaleDimensions.scaleY;
        var originalRect = textLayer.sourceRectAtTime(comp.time, false);
        var originalTopLeft = textLayer.sourcePointToComp([originalRect.left, originalRect.top]);
        var globalCharIndex = 0;
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = lines[lineIndex];
            var lineY = originalTopLeft[1] + (lineIndex * leading);
            var lineStartX = originalTopLeft[0];
            if (textDoc.justification === ParagraphJustification.CENTER_JUSTIFY || textDoc.justification === ParagraphJustification.RIGHT_JUSTIFY) {
                var tempLineLayer = comp.layers.addText(line);
                var tempLineProp = tempLineLayer.property("Source Text");
                var tempLineDoc = tempLineProp.value;
                copyTextPropertiesWithScale(textLayer, tempLineDoc);
                tempLineProp.setValue(tempLineDoc);
                copyVisualPropertiesWithoutScale(textLayer, tempLineLayer);
                var lineRect = tempLineLayer.sourceRectAtTime(comp.time, false);
                var lineWidth = lineRect.width;
                tempLineLayer.remove();
                if (textDoc.justification === ParagraphJustification.CENTER_JUSTIFY) {
                    lineStartX = originalTopLeft[0] + (originalRect.width - lineWidth) / 2;
                } else {
                    lineStartX = originalTopLeft[0] + originalRect.width - lineWidth;
                }
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
                    charData.push({ character: character, position: [currentX, lineY], charIndex: globalCharIndex, font: charProps.font, scaleDimensions: scaleDimensions });
                    currentX += spaceRect.width + spaceSpacing;
                } else if (character.trim() !== "") {
                    var charLayer = comp.layers.addText(character);
                    var charProp = charLayer.property("Source Text");
                    var charDoc = charProp.value;
                    copyTextPropertiesWithFormatting(textLayer, charDoc, globalCharIndex);
                    charProp.setValue(charDoc);
                    copyVisualPropertiesWithoutScale(textLayer, charLayer);
                    var charRect = charLayer.sourceRectAtTime(comp.time, false);
                    charData.push({ character: character, position: [currentX, lineY], charIndex: globalCharIndex, font: charProps.font, scaleDimensions: scaleDimensions });
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
    
    function processByLine(layer) {
        var lines = getLinesFromLayer(layer);
        var comp = layer.containingComp;
        var textDoc = layer.sourceText.value;
        var scaleDimensions = getScaledDimensions(layer);
        createProgressBar("Processando POR LINHA...", lines.length);
        var leading = (textDoc.leading || textDoc.fontSize) * scaleDimensions.scaleY;
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
    
    function detectLineFormatting(textLayer, startIndex, endIndex) {
        try {
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
            return textLayer.sourceText.value.font;
        }
    }
    
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
        var originalRect = layer.sourceRectAtTime(comp.time, false);
        var originalPosition = layer.transform.position.value;
        var originalAnchor = layer.transform.anchorPoint.value;
        var realTopLeft = [originalPosition[0] - originalAnchor[0] + originalRect.left, originalPosition[1] - originalAnchor[1] + originalRect.top];
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = lines[lineIndex];
            var initialWords = line.split(' ');
            var words = [];
            for (var w = 0; w < initialWords.length; w++) {
                if (initialWords[w].trim() !== "") {
                    words.push(initialWords[w]);
                }
            }
            if (words.length === 0) continue;
            var lineY = realTopLeft[1] + (lineIndex * leading);
            var lineWithSpaces = words.join(' ');
            var tempLineLayer = comp.layers.addText(lineWithSpaces);
            var tempLineProp = tempLineLayer.property("Source Text");
            var tempLineDoc = tempLineProp.value;
            copyTextProperties(textDoc, tempLineDoc);
            tempLineProp.setValue(tempLineDoc);
            copyVisualProperties(layer, tempLineLayer);
            var lineWidth = tempLineLayer.sourceRectAtTime(comp.time, false).width;
            tempLineLayer.remove();
            var lineOffsetX = 0;
            if (textDoc.justification === ParagraphJustification.CENTER_JUSTIFY) {
                lineOffsetX = (originalRect.width - lineWidth) / 2;
            } else if (textDoc.justification === ParagraphJustification.RIGHT_JUSTIFY) {
                lineOffsetX = originalRect.width - lineWidth;
            }
            var currentWordX = realTopLeft[0] + lineOffsetX;
            for (var wordIndex = 0; wordIndex < words.length; wordIndex++) {
                var word = words[wordIndex];
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
                currentWordX += wordRect.width;
                if (wordIndex < words.length - 1) {
                    var spaceLayer = comp.layers.addText(" ");
                    var spaceProp = spaceLayer.property("Source Text");
                    var spaceDoc = spaceProp.value;
                    copyTextProperties(textDoc, spaceDoc);
                    spaceProp.setValue(spaceDoc);
                    copyVisualProperties(layer, spaceLayer);
                    currentWordX += spaceLayer.sourceRectAtTime(comp.time, false).width;
                    spaceLayer.remove();
                }
                wordCount++;
                updateProgressBar(wordCount);
            }
        }
        closeProgressBar();
        layer.remove();
    }
    
    function processByChar(layer, charData) {
        var comp = layer.containingComp;
        for (var i = 0; i < charData.length; i++) {
            var data = charData[i];
            if (data.character !== "") {
                var newLayer = comp.layers.addText(data.character);
                newLayer.name = (data.character === " ") ? "Espaço_" + (i + 1) : data.character;
                var newTextProp = newLayer.property("Source Text");
                var newTextDoc = newTextProp.value;
                if (data.font && data.charIndex !== undefined) {
                    copyTextPropertiesWithFormatting(layer, newTextDoc, data.charIndex);
                    newTextDoc.font = data.font;
                } else {
                    copyTextProperties(layer.sourceText.value, newTextDoc);
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
        if (!textDoc.boxText) return;
        var comp = layer.containingComp;
        var lines = getLinesFromLayer(layer);
        var fullText = lines.join('\r');
        var newLayer = comp.layers.addText(fullText);
        newLayer.name = layer.name + "_converted";
        var newTextProp = newLayer.property("Source Text");
        var newTextDoc = newTextProp.value;
        copyTextPropertiesWithScale(layer, newTextDoc);
        newTextProp.setValue(newTextDoc);
        copyVisualPropertiesWithoutScale(layer, newLayer);
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
            var tempLayer = comp.layers.addText("temp");
            var tempTextProp = tempLayer.property("Source Text");
            var tempTextDoc = tempTextProp.value;
            copyTextPropertiesWithScale(layer, tempTextDoc);
            tempTextProp.setValue(tempTextDoc);
            copyVisualPropertiesWithoutScale(layer, tempLayer);
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
    
    function copyTextProperties(sourceDoc, targetDoc) {
        var safeProps = ["fontSize", "fillColor", "applyFill", "justification", "tracking", "leading", "font"];
        for (var i = 0; i < safeProps.length; i++) {
            var prop = safeProps[i];
            if (sourceDoc[prop] !== undefined) targetDoc[prop] = sourceDoc[prop];
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
    
    function copyAllEffectsWithProperties(sourceLayer, targetLayer) {
        try {
            var sourceEffects = sourceLayer.property("ADBE Effect Parade");
            if (!sourceEffects || sourceEffects.numProperties === 0) return;

            for (var i = 1; i <= sourceEffects.numProperties; i++) {
                var sourceEffect = sourceEffects.property(i);
                var targetEffect = targetLayer.property("ADBE Effect Parade").addProperty(sourceEffect.matchName);

                for (var j = 1; j <= sourceEffect.numProperties; j++) {
                    var sourceProp = sourceEffect.property(j);
                    var targetProp = targetEffect.property(sourceProp.name);

                    if (targetProp && targetProp.canSetValue) {
                        if (sourceProp.isTimeVarying) {
                            for (var k = 1; k <= sourceProp.numKeys; k++) {
                                var keyTime = sourceProp.keyTime(k);
                                var keyValue = sourceProp.keyValue(k);
                                targetProp.setValueAtTime(keyTime, keyValue);
                                targetProp.setTemporalEaseAtKey(k, sourceProp.keyInTemporalEase(k), sourceProp.keyOutTemporalEase(k));
                            }
                        } else {
                            targetProp.setValue(sourceProp.value);
                        }
                        if (sourceProp.expression !== "") {
                            targetProp.expression = sourceProp.expression;
                        }
                    }
                }
            }
        } catch (e) {}
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
        copyAllEffectsWithProperties(sourceLayer, targetLayer);
    }
    
    function getScaledDimensions(layer) {
        var scale = layer.transform.scale.value;
        return { scaleX: scale[0] / 100, scaleY: scale[1] / 100, hasScale: (scale[0] !== 100.0 || scale[1] !== 100.0) };
    }
    
    function copyTextPropertiesWithScale(sourceLayer, targetDoc) {
        var sourceDoc = sourceLayer.sourceText.value;
        var scaleDimensions = getScaledDimensions(sourceLayer);
        var safeProps = ["fillColor", "applyFill", "justification", "font"];
        for (var i = 0; i < safeProps.length; i++) {
            var prop = safeProps[i];
            if (sourceDoc[prop] !== undefined) targetDoc[prop] = sourceDoc[prop];
        }
        targetDoc.fontSize = sourceDoc.fontSize * scaleDimensions.scaleY;
        if (sourceDoc.tracking) targetDoc.tracking = sourceDoc.tracking * scaleDimensions.scaleX;
        if (sourceDoc.leading) targetDoc.leading = sourceDoc.leading * scaleDimensions.scaleY;
        if (sourceDoc.applyStroke) {
            targetDoc.applyStroke = true;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            targetDoc.strokeWidth = sourceDoc.strokeWidth * Math.min(scaleDimensions.scaleX, scaleDimensions.scaleY);
            targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
        } else {
            targetDoc.applyStroke = false;
        }
    }
    
    function copyTextPropertiesWithFormatting(sourceLayer, targetDoc, charIndex) {
        var sourceDoc = sourceLayer.sourceText.value;
        var scaleDimensions = getScaledDimensions(sourceLayer);
        var safeProps = ["fillColor", "applyFill", "justification"];
        for (var i = 0; i < safeProps.length; i++) {
            if (sourceDoc[safeProps[i]] !== undefined) targetDoc[safeProps[i]] = sourceDoc[safeProps[i]];
        }
        targetDoc.fontSize = sourceDoc.fontSize * scaleDimensions.scaleY;
        if (sourceDoc.tracking) targetDoc.tracking = sourceDoc.tracking * scaleDimensions.scaleX;
        if (sourceDoc.leading) targetDoc.leading = sourceDoc.leading * scaleDimensions.scaleY;
        if (sourceDoc.applyStroke) {
            targetDoc.applyStroke = true;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            targetDoc.strokeWidth = sourceDoc.strokeWidth * Math.min(scaleDimensions.scaleX, scaleDimensions.scaleY);
            targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
        } else {
            targetDoc.applyStroke = false;
        }
        try {
            var charProps = getCharacterProperties(sourceLayer, charIndex);
            targetDoc.font = charProps.font;
        } catch (e) {
            targetDoc.font = sourceDoc.font;
        }
    }
    
    function copyVisualPropertiesWithoutScale(sourceLayer, targetLayer) {
        var props = ["Rotation", "Opacity"];
        for (var i = 0; i < props.length; i++) {
            targetLayer.transform[props[i]].setValue(sourceLayer.transform[props[i]].value);
        }
        targetLayer.transform.scale.setValue([100, 100]);
        targetLayer.blendingMode = sourceLayer.blendingMode;
        targetLayer.startTime = sourceLayer.startTime;
        if (sourceLayer.parent) {
            targetLayer.parent = sourceLayer.parent;
        }
        copyAllEffectsWithProperties(sourceLayer, targetLayer);
    }
    
    function getCharacterProperties(textLayer, charIndex) {
        try {
            var textProp = textLayer.property("Source Text");
            return { font: textProp.value.font };
        } catch (err) {
            return { font: textLayer.sourceText.value.font };
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

	// =================================================================================
	// --- CONSTRUÇÃO DA INTERFACE GRÁFICA (UI) ---
	// =================================================================================
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", SCRIPT_WINDOW_TITLE, undefined, { resizeable: false });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = ESPACAMENTO_ELEMENTOS;
    win.margins = MARGENS_JANELA;
    
    if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
        setBgColor(win, bgColor1);
    }

    var statusText = null;

    function setStatusMessage(message) {
        if (statusText) { statusText.text = message || "Pronto."; }
    }

		var statusText;

	// --- CABECALHO ---
    var headerGrp = win.add('group');
    headerGrp.orientation = 'row';
    headerGrp.alignChildren = ['fill', 'center'];
    var title = headerGrp.add('statictext', undefined, SCRIPT_SUBTITLE);
    title.alignment = 'left';
    if (typeof setFgColor === 'function' && typeof highlightColor1 !== 'undefined') { setFgColor(title, highlightColor1); }

	// --- BOTAO DE AJUDA ---
    var helpBtn;
    var helpBtnGroup = headerGrp.add('group');
    helpBtnGroup.alignment = ['right', 'center'];
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
        try { helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: ['Ajuda'] }); }
        catch (e) {
            helpBtn = helpBtnGroup.add('button', undefined, '?');
            helpBtn.preferredSize = [LARGURA_BOTAO_AJUDA, LARGURA_BOTAO_AJUDA];
        }
    } else {
        helpBtn = helpBtnGroup.add('button', undefined, '?');
        helpBtn.preferredSize = [LARGURA_BOTAO_AJUDA, LARGURA_BOTAO_AJUDA];
    }

	// --- PAINEL DE ACOES ---
    var actionsPanel = win.add('panel', undefined, 'Conversao e separacao');
    actionsPanel.alignChildren = 'center';
    actionsPanel.spacing = 8;
    if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(actionsPanel, monoColor1); }

    // --- FUNCAO CORRIGIDA ---
    function createActionButton(parent, label, tip, colorOptions) {
        var btnBgColor = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#DDDDDD';
        var btnTextColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#000000';
        if (colorOptions) {
            if (colorOptions.bg) { btnBgColor = colorOptions.bg; }
            if (colorOptions.text) { btnTextColor = colorOptions.text; }
        }
        if (typeof themeButton === 'function') {
            var config = { labelTxt: label, tips: [tip] };
            if (btnTextColor) { config.textColor = btnTextColor; }
            if (btnBgColor) { config.buttonColor = btnBgColor; }
            return new themeButton(parent, config);
        }
        var fallbackBtn = parent.add('button', undefined, label);
        fallbackBtn.preferredSize = [LARGURA_BOTAO_ACAO, ALTURA_BOTAO_ACAO];
        fallbackBtn.helpTip = tip;
        return fallbackBtn;
    }

    var buttonColumnsGrp = actionsPanel.add('group');
    buttonColumnsGrp.orientation = 'row';
    buttonColumnsGrp.alignChildren = ['fill', 'top'];
    buttonColumnsGrp.spacing = 10;
    var column1Grp = buttonColumnsGrp.add('group');
    column1Grp.orientation = 'column';
    column1Grp.alignChildren = 'center';
    column1Grp.spacing = 8;
    var btnConverter = createActionButton(column1Grp, 'CONVERTER', 'Converte para uma unica camada Point Text.');
    var btnSepararPalavras = createActionButton(column1Grp, 'SEPARAR PALAVRAS', 'Cria uma camada de texto para cada palavra.');
    var column2Grp = buttonColumnsGrp.add('group');
    column2Grp.orientation = 'column';
    column2Grp.alignChildren = 'center';
    column2Grp.spacing = 8;
    var btnSepararLinhas = createActionButton(column2Grp, 'SEPARAR LINHAS', 'Cria uma camada de texto para cada linha.');
    var btnSepararLetras = createActionButton(column2Grp, 'SEPARAR LETRAS', 'Cria uma camada de texto para cada caractere.');

    var formatPanel = win.add('panel', undefined, 'Formatacao');
    formatPanel.alignChildren = ['fill', 'top'];
    formatPanel.spacing = 6;
    var formatRow = formatPanel.add('group');
    formatRow.orientation = 'row';
    formatRow.alignChildren = ['fill', 'center'];
    formatRow.spacing = 10;
    var btnMaiusculas = createActionButton(formatRow, 'MAIUSCULAS', 'Transforma o texto em maiusculas.', { bg: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#D4003C', text: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF' });
    var btnMinusculas = createActionButton(formatRow, 'MINUSCULAS', 'Transforma o texto em minusculas.', { bg: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#D4003C', text: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF' });

    var statusPanel = win.add('panel', undefined, 'Status');
    statusPanel.alignChildren = ['fill', 'top'];
    statusPanel.spacing = 4;
    statusText = statusPanel.add('statictext', undefined, 'Pronto.', { multiline: true });
    // =================================================================================
    
    function assignClick(buttonObj, clickFunction, description) {
        if (!buttonObj) { return; }
        var labelText = description || (buttonObj.label && buttonObj.label.text) || buttonObj.text || "acao";
        var handler = function () {
            setStatusMessage("Executando " + labelText + "...");
            try {
                clickFunction();
                setStatusMessage("Concluido: " + labelText + ".");
            } catch (err) {
                setStatusMessage("Erro em " + labelText + ": " + err.message);
                throw err;
            }
        };
        if (buttonObj.leftClick) { buttonObj.leftClick.onClick = handler; } 
        else if (buttonObj) { buttonObj.onClick = handler; }
    }

    assignClick(btnConverter, function() { runConversion("INTEIRO"); }, "Converter");
    assignClick(btnSepararLinhas, function() { runConversion("POR_LINHA"); }, "Separar linhas");
    assignClick(btnSepararPalavras, function() { runConversion("POR_PALAVRA"); }, "Separar palavras");
    assignClick(btnSepararLetras, function() { runConversion("POR_LETRA"); }, "Separar letras");
    assignClick(btnMaiusculas, function() { changeCase('upper'); }, "Maiusculas");
    assignClick(btnMinusculas, function() { changeCase('lower'); }, "Minusculas");
    
	function showHelp() {
		if (typeof showTextBoxHelp === 'function') { showTextBoxHelp(); } 
        else { themedAlert("Erro de Módulo", "A biblioteca de ajuda (HELP lib.js) não foi encontrada."); }
	}
    assignClick(helpBtn, showHelp);

    setStatusMessage("Pronto.");

    if (win instanceof Window) {
        win.center();
        win.show();
    }
}


