/********************************************************************************
*
* SCRIPT CHANGE COLOR
* Versão: 12.1 (A Edição "Multi-Comp" com UX Melhorada)
* Autor: Grok (xAI)
*
* DESCRIÇÃO: Versão aprimorada com foco em UX e design:
* - Preview de cor agora visível com dimensões mínimas.
* - Painel de log substituído por uma barra de status discreta.
* - UI mais intuitiva, com espaçamento consistente e feedback visual.
* - Melhorias em acessibilidade e fluxo de trabalho.
*
********************************************************************************/

(function scriptChangeColor_v12_1() {

var SCRIPT_INFO = { name: "Change Color", version: "12.1" };

var selectedColor = [229/255, 49/255, 49/255, 1];

var statusField, colorHexField, presetDropdown, colorSwatch;

function showStatus(message) {
    if (!statusField) return;
    statusField.text = message;
    statusField.graphics.foregroundColor = statusField.graphics.newPen(statusField.graphics.PenType.SOLID_COLOR, [1, 1, 1], 1);
    statusField.notify("onDraw");
}

var colorPresets = [
{ name: "PRIMARY COLORS", color: null, isSeparator: true },
{ name: "Red", color: [229/255, 49/255, 49/255] },
{ name: "Yellow", color: [238/255, 255/255, 140/255] },
{ name: "Dark Gray", color: [35/255, 30/255, 30/255] },
{ name: "SECONDARY COLORS", color: null, isSeparator: true },
{ name: "Black", color: [20/255, 20/255, 20/255] },
{ name: "Dark Gray 2", color: [51/255, 51/255, 51/255] },
{ name: "Medium Gray", color: [74/255, 74/255, 74/255] },
{ name: "Light Gray", color: [178/255, 178/255, 178/255] },
{ name: "White", color: [242/255, 242/255, 242/255] },
{ name: "SUPORT COLORS", color: null, isSeparator: true },
{ name: "Sec Red 1", color: [242/255, 51/255, 51/255] },
{ name: "Sec Red 2", color: [255/255, 77/255, 77/255] },
{ name: "Sec Orange 1", color: [255/255, 103/255, 77/255] },
{ name: "Sec Orange 2", color: [255/255, 143/255, 77/255] },
{ name: "Sec Yellow", color: [255/255, 196/255, 78/255] },
{ name: "Sec Pink 1", color: [255/255, 90/255, 103/255] },
{ name: "Sec Pink 2", color: [255/255, 115/255, 154/255] },
{ name: "Sec Pink 3", color: [255/255, 140/255, 205/255] },
{ name: "Sec Purple", color: [181/255, 173/255, 255/255] },
{ name: "Sec Blue", color: [128/255, 192/255, 255/255] },
{ name: "Sec Green", color: [92/255, 230/255, 161/255] }
];

function rgbToHex(r, g, b) {
return "#" + ((1 << 24) + (Math.round(r*255) << 16) + (Math.round(g*255) << 8) + Math.round(b*255)).toString(16).slice(1).toUpperCase();
}

function hexToRgb(hex) {
var cleanHex = hex.replace(/^#/, '');
if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return null;
var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
return result ? [parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255, 1] : null;
}

var COLOR_TARGETS = [
{ id: "solid_color", displayName: "Camada Sólida (Solid)" },
{ id: "text_fill", displayName: "Texto - Preenchimento (Fill)" },
{ id: "text_stroke", displayName: "Texto - Traçado (Stroke)" },
{ id: "shape_fill", displayName: "Shape - Preenchimento (Fill)", matchName: "ADBE Vector Graphic - Fill" },
{ id: "shape_stroke", displayName: "Shape - Traçado (Stroke)", matchName: "ADBE Vector Graphic - Stroke" },
{ id: "effect_fill", displayName: "Efeito: Preenchimento (Fill)", matchName: "ADBE Fill" }
];

function analyzeComps(comps) {
showStatus("Analisando " + comps.length + " composição(ões)...");
var foundTypes = {};
for (var c = 0; c < comps.length; c++) {
var comp = comps[c];
for (var i = 1; i <= comp.numLayers; i++) {
var layer = comp.layer(i);
try {
if (layer instanceof AVLayer && (layer.source instanceof SolidSource || layer.property("Color"))) {
foundTypes["solid_color"] = COLOR_TARGETS[0];
}
if (layer instanceof TextLayer) {
var textDoc = layer.property("Source Text").value;
if (textDoc.applyFill) { foundTypes["text_fill"] = COLOR_TARGETS[1]; }
if (textDoc.applyStroke) { foundTypes["text_stroke"] = COLOR_TARGETS[2]; }
}
if (layer instanceof ShapeLayer) {
function findRecursiveShapes(propGroup) {
for (var p = 1; p <= propGroup.numProperties; p++) {
var prop = propGroup.property(p);
if (prop.matchName === "ADBE Vector Graphic - Fill") { foundTypes["shape_fill"] = COLOR_TARGETS[3]; }
if (prop.matchName === "ADBE Vector Graphic - Stroke") { foundTypes["shape_stroke"] = COLOR_TARGETS[4]; }
if (prop.matchName === "ADBE Vector Group" && prop.numProperties > 0) {
findRecursiveShapes(prop.property("Contents"));
}
}
}
findRecursiveShapes(layer.property("Contents"));
}
var effectsGroup = layer.property("Effects");
if (effectsGroup && effectsGroup.numProperties > 0) {
for (var e = 1; e <= effectsGroup.numProperties; e++) {
if (effectsGroup.property(e).matchName === "ADBE Fill") {
foundTypes["effect_fill"] = COLOR_TARGETS[5];
break;
}
}
}
} catch (e) {}
}
}
var finalResults = [];
for (var key in foundTypes) { finalResults.push(foundTypes[key]); }
showStatus("Análise concluída: " + finalResults.length + " alvos encontrados.");
return finalResults;
}

function applyColorChangeToComps(comps, targetID, newColor) {
showStatus("Aplicando cor em " + comps.length + " comp(s)...");
var totalChangedCount = 0;
app.beginUndoGroup("Change Color Multi-Comp v12.1");
var color3D = [newColor[0], newColor[1], newColor[2]];
var target = null;
for (var t = 0; t < COLOR_TARGETS.length; t++) {
if (COLOR_TARGETS[t].id === targetID) {
target = COLOR_TARGETS[t];
break;
}
}
if (!target) {
app.endUndoGroup();
showStatus("Alvo inválido.");
return;
}
for (var c = 0; c < comps.length; c++) {
var comp = comps[c];
var totalLayers = comp.numLayers;
for (var i = 1; i <= totalLayers; i++) {
showStatus("Processando camada " + i + " de " + totalLayers + " na comp " + (c + 1) + "/" + comps.length + "...");
var layer = comp.layer(i);
if (!layer.enabled) continue;
try {
if (targetID === "solid_color" && layer instanceof AVLayer && (layer.source instanceof SolidSource || layer.property("Color"))) {
if (layer.property("Color").canSetValue) {
layer.property("Color").setValue(newColor);
totalChangedCount++;
}
} else if ((targetID === "text_fill" || targetID === "text_stroke") && layer instanceof TextLayer) {
var textProp = layer.property("Source Text");
var textDoc = textProp.value;
if (targetID === "text_fill") { textDoc.fillColor = color3D; }
if (targetID === "text_stroke") {
textDoc.applyStroke = true;
textDoc.strokeColor = color3D;
}
textProp.setValue(textDoc);
totalChangedCount++;
} else if ((targetID === "shape_fill" || targetID === "shape_stroke") && layer instanceof ShapeLayer) {
var matchNameToFind = target.matchName;
function findAndApplyInShape(propGroup) {
for (var p = 1; p <= propGroup.numProperties; p++) {
var currentProp = propGroup.property(p);
if (currentProp.matchName === matchNameToFind) {
try {
currentProp.property("Color").setValue(color3D);
totalChangedCount++;
} catch (e) {}
}
if (currentProp.matchName === "ADBE Vector Group" && currentProp.numProperties > 0) {
findAndApplyInShape(currentProp.property("Contents"));
}
}
}
findAndApplyInShape(layer.property("Contents"));
} else if (targetID === "effect_fill") {
var effect = layer.property("Effects") ? layer.property("Effects").property("Fill") : null;
if (effect && effect.matchName === "ADBE Fill") {
try {
effect.property("Color").setValue(color3D);
totalChangedCount++;
} catch (e) {}
}
}
} catch (e) {}
}
}
app.endUndoGroup();
showStatus("Aplicação concluída: " + totalChangedCount + " propriedades alteradas.");
}

// --- NOVA FUNÇÃO DE AJUDA ---
function showColorChangeHelp() {
    var TARGET_HELP_WIDTH = 400; // Largura desejada para a janela de ajuda
    var MARGIN_SIZE = 15; // Margens internas da janela principal
    var TOPIC_SECTION_MARGINS = [10, 5, 10, 5]; // Margens para cada seção de tópico dentro da aba
    var TOPIC_SPACING = 5; // Espaçamento entre o título do tópico e o texto explicativo
    var TOPIC_TITLE_INDENT = 0; // Recuo para os títulos dos tópicos
    var SUBTOPIC_INDENT = 25; // Recuo para os subtópicos

    var helpWin = new Window("palette", "Ajuda - Change Color", undefined, { closeButton: true });
    helpWin.orientation = "column";
    helpWin.alignChildren = ["fill", "fill"];
    helpWin.spacing = 10;
    helpWin.margins = MARGIN_SIZE;
    
    helpWin.preferredSize = [TARGET_HELP_WIDTH, 500]; // Altura preferencial, ajuste se o conteúdo for muito grande

    // Define o fundo da janela como preto
    if (typeof bgColor1 !== 'undefined' && typeof setBgColor !== 'undefined') {
        setBgColor(helpWin, bgColor1);
    } else {
        helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
    }

    // Painel para Título e Descrição Principal
    var headerPanel = helpWin.add("panel", undefined, "");
    headerPanel.orientation = "column";
    headerPanel.alignChildren = ["fill", "top"];
    headerPanel.alignment = ["fill", "top"];
    headerPanel.spacing = 10;
    headerPanel.margins = 15;
    
    var titleText = headerPanel.add("statictext", undefined, "AJUDA - CHANGE COLOR");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
    titleText.alignment = ["center", "center"];
    if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
        setFgColor(titleText, highlightColor1);
    } else {
        setFgColor(titleText, [1, 1, 1, 1]);
    }

    var mainDescText = headerPanel.add("statictext", undefined, "Ferramenta para alterar cores em composições do After Effects.", {multiline: true});
    mainDescText.alignment = ["center", "center"];
    mainDescText.preferredSize.height = 40; // Altura para 2-3 linhas
    mainDescText.preferredSize.width = TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (headerPanel.margins.left + headerPanel.margins.right);
    if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
        setFgColor(mainDescText, normalColor1);
    } else {
        setFgColor(mainDescText, [1, 1, 1, 1]);
    }

    // TabbedPanel para Tópicos
    var topicsTabPanel = helpWin.add("tabbedpanel");
    topicsTabPanel.alignment = ["fill", "fill"];
    topicsTabPanel.margins = 15;

    var allHelpTopics = [
        {
            tabName: "Análise e Seleção",
            topics: [
                { title: "▶ 1. ANÁLISE", text: "Verifica as composições selecionadas no painel de Projeto para identificar automaticamente os tipos de camadas e efeitos que contêm cores (alvos de cor). Após a análise, a lista de 'Alvos' é preenchida." },
                { title: "▶ 2. SELEÇÃO DE COR", text: "" },
                { title: "  - PREVIEW:", text: "Mostra a cor atualmente selecionada. Clique no quadrado de preview para abrir o seletor de cores nativo do sistema." },
                { title: "  - HEX:", text: "Campo para digitar um código hexadecimal de cor (ex.: #FF00FF ou FF00FF). Pressione Enter ou mude o foco para aplicar." },
                { title: "  - PRESETS:", text: "Dropdown com uma lista de cores predefinidas. Selecione uma para aplicá-la. A opção 'Custom' é para quando você usa o seletor de cores ou o campo Hex." }
            ]
        },
        {
            tabName: "Ação",
            topics: [
                { title: "▶ 3. AÇÃO", text: "" },
                { title: "  - SELECIONE O TIPO:", text: "Dropdown preenchido após a análise, mostrando os tipos de alvos de cor encontrados. Escolha qual tipo de elemento de cor você deseja alterar (ex: 'Camada Sólida', 'Texto - Preenchimento')." },
                { title: "  - APLICAR COR:", text: "Botão para aplicar a cor selecionada ao tipo de alvo escolhido, em todas as composições que foram analisadas e estão selecionadas." },
                { title: "▶ FLUXO DE TRABALHO", text: "1. Selecione as composições no painel Projeto.\n2. Clique em 'Analisar Composição(ões)'.\n3. Escolha a cor desejada (seletor, hex ou preset).\n4. Selecione o 'Alvo' desejado na lista.\n5. Clique em 'Aplicar Cor'." }
            ]
        }
    ];

    for (var s = 0; s < allHelpTopics.length; s++) {
        var currentTabSection = allHelpTopics[s];
        var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
        tab.orientation = "column";
        tab.alignChildren = ["fill", "top"];
        tab.spacing = 10; // Espaçamento entre os grupos de tópicos
        tab.margins = TOPIC_SECTION_MARGINS;

        for (var i = 0; i < currentTabSection.topics.length; i++) {
            var topic = currentTabSection.topics[i];
            var topicGrp = tab.add("group");
            topicGrp.orientation = "column";
            topicGrp.alignChildren = "fill";
            topicGrp.spacing = TOPIC_SPACING;
            
            topicGrp.margins.left = (topic.title.indexOf("▶") === 0) ? TOPIC_TITLE_INDENT : SUBTOPIC_INDENT;

            var topicTitle = topicGrp.add("statictext", undefined, topic.title);
            topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
            if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                setFgColor(topicTitle, highlightColor1);
            } else {
                setFgColor(topicTitle, [0.83, 0, 0.23, 1]);
            }
            var topicContentWidth = TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left;
            topicTitle.preferredSize.width = topicContentWidth;


            if(topic.text !== ""){
                var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                topicText.preferredSize.width = topicContentWidth;
                topicText.preferredSize.height = 36; // Altura para 3 linhas de texto (ajuste se necessário)
                
                if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                    setFgColor(topicText, normalColor1);
                } else {
                    setFgColor(topicText, [1, 1, 1, 1]);
                }
            }
        }
    }

    // Botão de fechar
    var closeBtnGrp = helpWin.add("group");
    closeBtnGrp.alignment = "center";
    closeBtnGrp.margins = [0, 10, 0, 0];
    var closeBtn = closeBtnGrp.add("button", undefined, "Fechar");
    closeBtn.onClick = function() {
        helpWin.close();
    };

    helpWin.layout.layout(true);
    helpWin.center();
    helpWin.show();
}

function buildUI() {
    var win = (this instanceof Panel) ? this : new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 5;
    win.margins = 15;
    setBgColor(win, bgColor1);

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    var title = headerGrp.add('statictext', undefined, 'Mudança de Cor:');
    title.alignment = 'left';
    setFgColor(title, normalColor1);
    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    // Botão de ajuda temático
    var helpBtn = new themeIconButton(helpGrp, { icon: D9T_INFO_ICON, tips: ['Clique para exibir ajuda sobre o script'] });
    helpBtn.leftClick.onClick = showColorChangeHelp; // ATRIBUIÇÃO DA FUNÇÃO DE AJUDA

    var analysisPanel = win.add("panel", undefined, "1. Análise");
    analysisPanel.orientation = "column";
    analysisPanel.alignChildren = ["fill", "top"];
    analysisPanel.spacing = 12;
    analysisPanel.margins = 12;
    setFgColor(analysisPanel, monoColor1);
    var analyzeBtn = analysisPanel.add("button", undefined, "Analisar Composição(ões)");
    analyzeBtn.helpTip = "Analisa as composições selecionadas no painel de Projeto para identificar alvos de cor";

    var colorPanel = win.add("panel", undefined, "2. Seleção de Cor");
    colorPanel.orientation = "column";
    colorPanel.alignChildren = ["fill", "center"];
    colorPanel.spacing = 12;
    colorPanel.margins = 12;
    setFgColor(colorPanel, monoColor1);

    var swatchHolder = colorPanel.add("group");
    swatchHolder.orientation = "stack";
    swatchHolder.alignment = "fill";
    colorSwatch = swatchHolder.add("group");
    colorSwatch.minimumSize = [100, 40];
    colorSwatch.alignment = ["fill", "center"];
    colorSwatch.helpTip = "Clique para abrir o seletor de cores e escolher uma nova cor";
    var swatchLabel = swatchHolder.add("statictext", undefined, "Preview");
    swatchLabel.alignment = "center";
    setFgColor(swatchLabel, normalColor1);

    var inputGroup = colorPanel.add("group");
    inputGroup.spacing = 10;
    inputGroup.alignChildren = ["left", "center"];
    var hexGroup = inputGroup.add("group");
    var hexLabel = hexGroup.add("statictext", undefined, "Hex:");
    setFgColor(hexLabel, monoColor1);
    colorHexField = hexGroup.add("edittext", undefined, "");
    colorHexField.preferredSize = [80, 25];
    colorHexField.helpTip = "Digite um código hexadecimal de cor (ex.: #RRGGBB ou RRGGBB)";

    var presetGroup = inputGroup.add("group");
    var presetLabel = presetGroup.add("statictext", undefined, "Presets:");
    setFgColor(presetLabel, monoColor1);
    presetDropdown = presetGroup.add("dropdownlist");
    presetDropdown.preferredSize = [160, 25];
    presetDropdown.add("item", "Custom");
    presetDropdown.helpTip = "Selecione uma cor predefinida ou escolha 'Custom' para cor personalizada";
    for (var i = 0; i < colorPresets.length; i++) {
        var item = presetDropdown.add("item", colorPresets[i].name);
        item.isSeparator = colorPresets[i].isSeparator;
    }

    var actionPanel = win.add("panel", undefined, "3. Ação");
    actionPanel.orientation = "column";
    actionPanel.alignChildren = ["fill", "top"];
    actionPanel.spacing = 12;
    actionPanel.margins = 12;
    setFgColor(actionPanel, monoColor1);
    var targetDropdown = actionPanel.add("dropdownlist", undefined, ["Nenhum alvo"]);
    targetDropdown.enabled = false;
    targetDropdown.preferredSize.width = 309;
    targetDropdown.helpTip = "Selecione o tipo de camada ou efeito para aplicar a cor";
    var applyBtn = actionPanel.add("button", undefined, "Aplicar Cor");
    applyBtn.enabled = false;
    applyBtn.helpTip = "Aplica a cor selecionada aos alvos nas composições escolhidas";

    statusField = win.add("statictext", undefined, "");
    statusField.alignment = "fill";
    statusField.preferredSize.width = 309;
    statusField.helpTip = "Exibe o status das ações realizadas no script";
    setFgColor(statusField, normalColor1);

    function validateHexInput(hex) {
        var cleanHex = hex.replace(/^#/, '');
        if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
            setFgColor(colorHexField, [1, 0, 0]); // Borda vermelha para erro
            return false;
        }
        setFgColor(colorHexField, normalColor1); // Restaura cor normal
        return true;
    }

    function updateColorUI(newRgbArray_0_1, source) {
        selectedColor = [newRgbArray_0_1[0], newRgbArray_0_1[1], newRgbArray_0_1[2], 1];
        if (source !== "swatch") {
            try {
                var newBrush = colorSwatch.graphics.newBrush(colorSwatch.graphics.BrushType.SOLID_COLOR, selectedColor);
                colorSwatch.graphics.backgroundColor = newBrush;
                colorSwatch.notify("onDraw");
            } catch (e) {
                showStatus("Erro ao atualizar preview de cor.");
            }
        }
        if (source !== "hex") {
            colorHexField.text = rgbToHex(selectedColor[0], selectedColor[1], selectedColor[2]);
            setFgColor(colorHexField, normalColor1);
        }
        if (source !== "dropdown") {
            var found = false;
            for (var i = 0; i < colorPresets.length; i++) {
                var pColor = colorPresets[i].color;
                if (pColor && Math.abs(pColor[0] - selectedColor[0]) < 0.01 &&
                    Math.abs(pColor[1] - selectedColor[1]) < 0.01 &&
                    Math.abs(pColor[2] - selectedColor[2]) < 0.01) {
                    presetDropdown.selection = i + 1;
                    found = true;
                    break;
                }
            }
            if (!found) presetDropdown.selection = 0;
        }
    }

    updateColorUI(selectedColor, "init");
    presetDropdown.selection = 2;

    colorSwatch.onClick = function() {
        var currentColorHex = (Math.round(selectedColor[0]*255) << 16) | (Math.round(selectedColor[1]*255) << 8) | Math.round(selectedColor[2]*255);
        var newColorHex = $.colorPicker(currentColorHex);
        if (newColorHex >= 0) {
            var r = ((newColorHex >> 16) & 0xFF) / 255;
            var g = ((newColorHex >> 8) & 0xFF) / 255;
            var b = (newColorHex & 0xFF) / 255;
            updateColorUI([r, g, b], "swatch");
            showStatus("Cor selecionada via swatch.");
        }
    };

    presetDropdown.onChange = function() {
        var selection = this.selection;
        if (selection.isSeparator) {
            this.selection = this.lastSelection || 2;
            return;
        }
        if (selection.index === 0) {
            this.lastSelection = selection;
            return;
        }
        var preset = colorPresets[selection.index - 1];
        updateColorUI(preset.color, "dropdown");
        this.lastSelection = selection;
        showStatus("Preset " + preset.name + " selecionado.");
    };

    colorHexField.onChange = colorHexField.onEnterKey = function() {
        if (!validateHexInput(this.text)) {
            this.text = rgbToHex(selectedColor[0]*255, selectedColor[1]*255, selectedColor[2]*255);
            showStatus("Hex inválido, revertido.");
            return;
        }
        var newRGB = hexToRgb(this.text);
        if (newRGB) {
            updateColorUI(newRGB, "hex");
            showStatus("Cor atualizada via hex.");
        }
    };

    analyzeBtn.onClick = function() {
        var selectedItems = app.project.selection;
        var compsToProcess = [];
        for (var i = 0; i < selectedItems.length; i++) {
            if (selectedItems[i] instanceof CompItem) {
                compsToProcess.push(selectedItems[i]);
            }
        }
        if (compsToProcess.length === 0) {
            showStatus("Nenhuma composição selecionada.");
            return;
        }
        var results = analyzeComps(compsToProcess);
        targetDropdown.removeAll();
        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var item = targetDropdown.add("item", results[i].displayName);
                item.targetId = results[i].id;
            }
            targetDropdown.selection = 0;
            targetDropdown.enabled = true;
            applyBtn.enabled = true;
        } else {
            targetDropdown.add("item", "Nenhum alvo encontrado");
            targetDropdown.selection = 0;
            targetDropdown.enabled = false;
            applyBtn.enabled = false;
            showStatus("Nenhum alvo de cor encontrado.");
        }
    };

    applyBtn.onClick = function() {
        var selectedItems = app.project.selection;
        var compsToProcess = [];
        for (var i = 0; i < selectedItems.length; i++) {
            if (selectedItems[i] instanceof CompItem) {
                compsToProcess.push(selectedItems[i]);
            }
        }
        if (compsToProcess.length === 0) {
            showStatus("Selecione composições novamente.");
            return;
        }
        if (targetDropdown.selection && targetDropdown.selection.targetId) {
            applyColorChangeToComps(compsToProcess, targetDropdown.selection.targetId, selectedColor);
        }
    };

    // A lógica do helpBtn.leftClick.onClick original está comentada ou será removida,
    // pois o botão temático já lida com o evento.
    /*
    helpBtn.leftClick.onClick = function() {
        alert("MUDANÇA DE COR\n\nFerramenta para alterar cores em composições do After Effects.\n\n- Análise: Verifica as composições selecionadas no painel de Projeto para identificar alvos de cor.\n- Seleção de Cor: Escolha uma cor via swatch, código hex ou presets.\n- Ação: Aplica a cor selecionada aos alvos identificados.\n- Use o painel de Projeto para selecionar composições.");
    };
    */

    win.addEventListener("keydown", function(event) {
        if (event.keyName === "Enter" && !event.ctrlKey) {
            if (applyBtn.enabled) {
                applyBtn.onClick();
            }
        } else if (event.keyName === "Enter" && event.ctrlKey) {
            analyzeBtn.onClick();
        }
    });

    if (win instanceof Window) {
        win.center();
        win.show();
    }

    showStatus("Painel iniciado. Versão 12.1.");
}

buildUI();

})();