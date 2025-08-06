/*
GNEWS KillBoxText v7.1 - Final (Themed)

- Lógica 100% original preservada.
- Interface redesenhada com o tema do Padeiro.
*/

function GNEWS_KillBoxText_UI() {

    // --- LÓGICA ORIGINAL COMPLETA DO SCRIPT (INTACTA) ---

    var progressWin = null, progressBar = null;

    function runConversion(mode) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Selecione uma composição."); return; }
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) { alert("Selecione pelo menos uma camada de texto."); return; }

        app.beginUndoGroup("GNEWS KillBoxText");
        try {
            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];
                if (!(layer instanceof TextLayer)) continue;

                if (mode === "POR_LETRA") {
                    var charData = analyzeTextByChar(layer);
                    if (charData.length > 0) processByChar(layer, charData);
                } else if (mode === "INTEIRO") {
                    processInteiro(layer);
                } else {
                    processByRebuild(layer, mode);
                }
            }
        } catch (err) {
            alert("Erro: " + err.toString() + "\nLinha: " + err.line);
        } finally {
            app.endUndoGroup();
        }
    }

    function processByRebuild(layer, mode) {
        var lines = getLinesFromLayer(layer);
        
        createProgressBar("Processando " + mode + "...", lines.length);

        for (var i = 0; i < lines.length; i++) {
            if (mode === "POR_LINHA") {
                if (lines[i].trim() !== "") createLineLayer(layer, lines[i], i);
            } else { // POR_PALAVRA
                createWordLayersForLine(layer, lines[i], i);
            }
            updateProgressBar(i + 1);
        }

        closeProgressBar();
        layer.remove();
    }
    
    function createLineLayer(originalLayer, lineText, lineIndex) {
        var comp = originalLayer.containingComp;
        var textDoc = originalLayer.sourceText.value;
        var leading = textDoc.leading || textDoc.fontSize;
        var newLayer = comp.layers.addText(lineText);
        newLayer.name = "Linha " + (lineIndex + 1);

        var newTextProp = newLayer.property("Source Text");
        copyTextProperties(textDoc, newTextProp.value);
        newTextProp.setValue(newTextProp.value);

        copyVisualProperties(originalLayer, newLayer);
        
        var yPos = originalLayer.transform.position.value[1] + (lineIndex * leading);
        var xPos = originalLayer.transform.position.value[0];
        
        newLayer.transform.position.setValue([xPos, yPos]);
    }

    function createWordLayersForLine(originalLayer, lineText, lineIndex) {
        var comp = originalLayer.containingComp;
        var textDoc = originalLayer.sourceText.value;

        var allWords = lineText.split(' ');
        var words = [];
        for(var w = 0; w < allWords.length; w++){
            if(allWords[w].length > 0){
                words.push(allWords[w]);
            }
        }

        if (words.length === 0) return;

        var spaceWidth = measureSpace(textDoc, comp);
        var leading = textDoc.leading || textDoc.fontSize;

        var tempLineLayer = comp.layers.addText(lineText);
        var tempLineProp = tempLineLayer.property("Source Text");
        copyTextProperties(textDoc, tempLineProp.value);
        tempLineProp.setValue(tempLineProp.value);
        var lineRect = tempLineLayer.sourceRectAtTime(comp.time, false);
        tempLineLayer.remove();

        var justification = textDoc.justification;
        var currentX;
        
        var lineVisualLeft = originalLayer.transform.position.value[0] + lineRect.left - originalLayer.transform.anchorPoint.value[0];

        if (justification === ParagraphJustification.LEFT_JUSTIFY) {
            currentX = lineVisualLeft;
        } else if (justification === ParagraphJustification.RIGHT_JUSTIFY) {
            currentX = lineVisualLeft + lineRect.width;
        } else { // Center
            currentX = lineVisualLeft + (lineRect.width / 2);
        }
        
        if (justification === ParagraphJustification.CENTER_JUSTIFY) {
             var totalWordsWidth = 0;
             var tempWordLayers = [];
             for(var k=0; k<words.length; k++) {
                 var wLayer = comp.layers.addText(words[k]);
                 copyTextProperties(textDoc, wLayer.property("Source Text").value);
                 wLayer.property("Source Text").setValue(wLayer.property("Source Text").value);
                 totalWordsWidth += wLayer.sourceRectAtTime(comp.time, false).width;
                 tempWordLayers.push(wLayer);
             }
             totalWordsWidth += Math.max(0, words.length - 1) * spaceWidth;
             for(var k=0; k<tempWordLayers.length; k++){ tempWordLayers[k].remove(); }
             currentX -= totalWordsWidth / 2;
        }

        if (justification === ParagraphJustification.RIGHT_JUSTIFY) {
            for (var i = words.length - 1; i >= 0; i--) {
                var wordLayer = createSingleWordLayer(words[i], originalLayer, lineIndex, leading, currentX, "right");
                currentX -= (wordLayer.sourceRectAtTime(comp.time, false).width + spaceWidth);
            }
        } else {
            for (var i = 0; i < words.length; i++) {
                var wordLayer = createSingleWordLayer(words[i], originalLayer, lineIndex, leading, currentX, "left");
                currentX += (wordLayer.sourceRectAtTime(comp.time, false).width + spaceWidth);
            }
        }
    }
    
    function createSingleWordLayer(word, originalLayer, lineIndex, leading, currentX, align) {
        var comp = originalLayer.containingComp;
        var textDoc = originalLayer.sourceText.value;
        var newLayer = comp.layers.addText(word);
        newLayer.name = word;
        
        var newTextProp = newLayer.property("Source Text");
        copyTextProperties(textDoc, newTextProp.value);
        newTextProp.setValue(newTextProp.value);
        copyVisualProperties(originalLayer, newLayer);

        var newRect = newLayer.sourceRectAtTime(comp.time, false);
        var yPos = originalLayer.transform.position.value[1] + (lineIndex * leading);
        var anchorX = (align === "right") ? newRect.left + newRect.width : newRect.left;

        newLayer.transform.anchorPoint.setValue([anchorX, newRect.top]);
        newLayer.transform.position.setValue([currentX, yPos]);
        return newLayer;
    }

    function analyzeTextByChar(textLayer) {
        var textDoc = textLayer.sourceText.value, originalText = textDoc.text, charData = [], comp = textLayer.containingComp;
        if(originalText.length === 0) return [];
        createProgressBar("Analisando Caracteres...", originalText.length);
        var tempLayer = comp.layers.addText("T");
        tempLayer.property("Source Text").setValue(textDoc);
        for (var i = 0; i < originalText.length; i++) {
            var character = originalText.charAt(i);
            tempLayer.property("Source Text").setValue(character);
            var rect = tempLayer.sourceRectAtTime(comp.time, false);
            var compPos = textLayer.sourcePointToComp([rect.left, rect.top]);
            charData.push({ character: character, position: compPos });
            updateProgressBar(i + 1);
        }
        tempLayer.remove();
        closeProgressBar();
        return charData;
    }

    function processByChar(layer, charData) {
        var originalTextDoc = layer.sourceText.value;
        for (var i = 0; i < charData.length; i++) {
            var data = charData[i];
            if (data.character.trim() === "") continue;
            var newLayer = layer.containingComp.layers.addText(data.character);
            newLayer.name = data.character;
            var newTextProp = newLayer.property("Source Text");
            copyTextProperties(originalTextDoc, newTextProp.value);
            newTextProp.setValue(newTextProp.value);
            copyVisualProperties(layer, newLayer);
            var newRect = newLayer.sourceRectAtTime(layer.containingComp.time, false);
            newLayer.transform.anchorPoint.setValue([newRect.left, newRect.top]);
            newLayer.transform.position.setValue(data.position);
        }
        layer.remove();
    }
    
    function processInteiro(layer) {
        var textDoc = layer.sourceText.value;
        if (!textDoc.boxText && layer.sourceText.value.pointText) return;
        var newLayer = layer.containingComp.layers.addText(textDoc.text);
        newLayer.name = layer.name;
        var newTextProp = newLayer.property("Source Text");
        copyTextProperties(textDoc, newTextProp.value);
        newTextProp.setValue(newTextProp.value);
        copyVisualProperties(layer, newLayer);
        var sourceRect = layer.sourceRectAtTime(layer.containingComp.time, false);
        var visualTopLeft = layer.sourcePointToComp([sourceRect.left, sourceRect.top]);
        var newRect = newLayer.sourceRectAtTime(layer.containingComp.time, false);
        newLayer.transform.anchorPoint.setValue([newRect.left, newRect.top]);
        newLayer.transform.position.setValue(visualTopLeft);
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
            var tempLayer = comp.layers.addText("temp");
            var tempTextProp = tempLayer.property("Source Text");
            copyTextProperties(textDoc, tempTextProp.value);
            tempTextProp.setValue(tempTextProp.value);
            var currentLine = "";
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                if (word === "" && currentLine === "") continue;
                if (word === "\r") { lines.push(currentLine.trim()); currentLine = ""; continue; }
                var testLine = currentLine === "" ? word : currentLine + " " + word;
                tempTextProp.setValue(testLine);
                var currentWidth = tempLayer.sourceRectAtTime(comp.time, false).width;
                if (currentWidth > boxWidth && currentLine !== "") {
                    lines.push(currentLine.trim());
                    currentLine = word;
                } else { currentLine = testLine; }
            }
            if (currentLine.trim() !== "") { lines.push(currentLine.trim()); }
            tempLayer.remove();
        } else { lines = originalText.split(/\r\n|\r|\n/); }
        return lines;
    }
    
    function measureSpace(textDocument, comp) {
        var spaceLayer = comp.layers.addText(" ");
        copyTextProperties(textDocument, spaceLayer.property("Source Text").value);
        spaceLayer.property("Source Text").setValue(spaceLayer.property("Source Text").value);
        var spaceWidth = spaceLayer.sourceRectAtTime(comp.time, false).width;
        spaceLayer.remove();
        return spaceWidth;
    }

    function copyTextProperties(sourceDoc, targetDoc) {
        var safeProps = ["font", "fontSize", "fillColor", "applyFill", "justification", "tracking", "leading"];
        for (var i = 0; i < safeProps.length; i++) {
            var prop = safeProps[i];
            if (sourceDoc[prop] !== undefined) targetDoc[prop] = sourceDoc[prop];
        }
        if (sourceDoc.applyStroke) {
            targetDoc.applyStroke = true;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            targetDoc.strokeWidth = sourceDoc.strokeWidth;
            targetDoc.strokeOverFill = sourceDoc.strokeOverFill;
        } else { targetDoc.applyStroke = false; }
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

    // --- INTERFACE GRÁFICA REDESENHADA ---
    
    var SCRIPT_NAME = "GNEWS KillBoxText", SCRIPT_VERSION = "v7.1";
    var win = new Window("palette", SCRIPT_NAME + " " + SCRIPT_VERSION);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;
    
    setBgColor(win, bgColor1);

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    
    var title = headerGrp.add('statictext', undefined, 'Converter Texto em Camadas');
    title.alignment = 'left';
    setFgColor(title, normalColor1);

    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    var helpBtn = new themeIconButton(helpGrp, { 
        icon: D9T_INFO_ICON, 
        tips: [lClick + 'Ajuda'] 
    });

    var optionsPanel = win.add("panel", undefined, "Modo de Conversão");
    optionsPanel.alignChildren = "left";
    setFgColor(optionsPanel, monoColor1);
    
    var radioInteiro = optionsPanel.add("radiobutton", undefined, "INTEIRO");
    var radioPorLinha = optionsPanel.add("radiobutton", undefined, "POR LINHA");
    var radioPorPalavra = optionsPanel.add("radiobutton", undefined, "POR PALAVRA");
    var radioPorLetra = optionsPanel.add("radiobutton", undefined, "POR LETRA");
    radioInteiro.value = true;
    
    var allRadios = [radioInteiro, radioPorLinha, radioPorPalavra, radioPorLetra];
    for (var i = 0; i < allRadios.length; i++) {
        setFgColor(allRadios[i], monoColor1);
    }

    var actionGrp = win.add('group');
    actionGrp.alignment = 'center';

    var convertButton = new themeButton(actionGrp, {
		width: 180,
		height: 32,
		textColor: bgColor1,
		buttonColor: normalColor1,
		labelTxt: 'Converter',
		tips: [lClick + 'Converte as camadas de texto selecionadas.']
	});

    // --- EVENTOS ---
    convertButton.leftClick.onClick = function() {
        var mode = "INTEIRO";
        if (radioPorLinha.value) mode = "POR_LINHA";
        else if (radioPorPalavra.value) mode = "POR_PALAVRA";
        else if (radioPorLetra.value) mode = "POR_LETRA";
        runConversion(mode);
    };

    helpBtn.leftClick.onClick = function() {
        alert("GNEWS KillBoxText v7.1\n\nEsta ferramenta converte camadas de texto que usam 'Box Text' (texto de parágrafo) em camadas de 'Point Text' (texto de ponto), que são mais fáceis de animar.\n\nMODOS:\n- INTEIRO: Converte a caixa de texto em uma única camada de texto de ponto.\n- POR LINHA: Cria uma nova camada de texto para cada linha.\n- POR PALAVRA: Cria uma nova camada de texto para cada palavra.\n- POR LETRA: Cria uma nova camada de texto para cada letra.");
    };

    win.center();
    win.show();
}

GNEWS_KillBoxText_UI();