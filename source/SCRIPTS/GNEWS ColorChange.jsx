/********************************************************************************
*
* SCRIPT CHANGE COLOR
* Versão: 13.6 (Regra de UI "Custom" implementada)
* Autor: Grok (xAI)
*
* DESCRIÇÃO: Versão final com ajustes finos de usabilidade.
* - Ao digitar um código Hex ou usar o seletor, o preset muda para "Custom".
* - Lógica de atualização de UI estável e sincronizada.
*
********************************************************************************/

(function scriptChangeColor_v13_6() {

var SCRIPT_INFO = { name: "Change Color", version: "13.6" };

// --- LÓGICA DE STATUS UNIFICADA ---
var COLORS = { 
    success: [0.2, 0.8, 0.2], error: [0.8, 0.2, 0.2], warning: [0.9, 0.7, 0.2], info: [0.2, 0.6, 0.9], neutral: [0.9, 0.9, 0.9],
};

var statusField, colorHexField, presetDropdown, colorSwatch;

function setStatusColor(element, color) {
    try {
        if (element && element.graphics) {
            element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
        }
    } catch (e) { /* silent error */ }
}

function updateStatus(message, type) {
    if (!statusField) return;

    var color = COLORS[type] || COLORS.neutral;
    statusField.text = message;
    setStatusColor(statusField, color);

    if (type === "success") { 
        app.setTimeout(function () {
            if (statusField.text === message) { 
                statusField.text = "Pronto para uso...";
                setStatusColor(statusField, COLORS.neutral);
            }
        }, 3000);
    }
}
// --- FIM DA LÓGICA DE STATUS ---

var selectedColor = [229/255, 49/255, 49/255, 1];

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
updateStatus("Analisando " + comps.length + " composição(ões)...", "info");
var foundTypes = {};
for (var c = 0; c < comps.length; c++) { var comp = comps[c]; for (var i = 1; i <= comp.numLayers; i++) { var layer = comp.layer(i); try { if (layer instanceof AVLayer && (layer.source instanceof SolidSource || layer.property("Color"))) { foundTypes["solid_color"] = COLOR_TARGETS[0]; } if (layer instanceof TextLayer) { var textDoc = layer.property("Source Text").value; if (textDoc.applyFill) { foundTypes["text_fill"] = COLOR_TARGETS[1]; } if (textDoc.applyStroke) { foundTypes["text_stroke"] = COLOR_TARGETS[2]; } } if (layer instanceof ShapeLayer) { function findRecursiveShapes(propGroup) { for (var p = 1; p <= propGroup.numProperties; p++) { var prop = propGroup.property(p); if (prop.matchName === "ADBE Vector Graphic - Fill") { foundTypes["shape_fill"] = COLOR_TARGETS[3]; } if (prop.matchName === "ADBE Vector Graphic - Stroke") { foundTypes["shape_stroke"] = COLOR_TARGETS[4]; } if (prop.matchName === "ADBE Vector Group" && prop.numProperties > 0) { findRecursiveShapes(prop.property("Contents")); } } } findRecursiveShapes(layer.property("Contents")); } var effectsGroup = layer.property("Effects"); if (effectsGroup && effectsGroup.numProperties > 0) { for (var e = 1; e <= effectsGroup.numProperties; e++) { if (effectsGroup.property(e).matchName === "ADBE Fill") { foundTypes["effect_fill"] = COLOR_TARGETS[5]; break; } } } } catch (e) {} } }
var finalResults = [];
for (var key in foundTypes) { finalResults.push(foundTypes[key]); }
updateStatus("Análise concluída: " + finalResults.length + " alvos encontrados.", "success");
return finalResults;
}

function applyColorChangeToComps(comps, targetID, newColor, win) {
updateStatus("Aplicando cor...", "info");
var totalChangedCount = 0;
app.beginUndoGroup("Change Color Multi-Comp v13.6");
var color3D = [newColor[0], newColor[1], newColor[2]];
var target = null;
for (var t = 0; t < COLOR_TARGETS.length; t++) { if (COLOR_TARGETS[t].id === targetID) { target = COLOR_TARGETS[t]; break; } }
if (!target) { app.endUndoGroup(); updateStatus("Alvo inválido.", "error"); return; }

function forceUIUpdate() { if (win && typeof win.update === 'function') { win.update(); } }

for (var c = 0; c < comps.length; c++) { var comp = comps[c]; var totalLayers = comp.numLayers; for (var i = 1; i <= totalLayers; i++) { updateStatus("Processando Comp " + (c + 1) + "/" + comps.length + " (" + i + "/" + totalLayers + ")", "info"); forceUIUpdate(); var layer = comp.layer(i); if (!layer.enabled) continue; try { if (targetID === "solid_color" && layer instanceof AVLayer && (layer.source instanceof SolidSource || layer.property("Color"))) { if (layer.property("Color").canSetValue) { layer.property("Color").setValue(newColor); totalChangedCount++; } } else if ((targetID === "text_fill" || targetID === "text_stroke") && layer instanceof TextLayer) { var textProp = layer.property("Source Text"); var textDoc = textProp.value; if (targetID === "text_fill") { textDoc.fillColor = color3D; } if (targetID === "text_stroke") { textDoc.applyStroke = true; textDoc.strokeColor = color3D; } textProp.setValue(textDoc); totalChangedCount++; } else if ((targetID === "shape_fill" || targetID === "shape_stroke") && layer instanceof ShapeLayer) { var matchNameToFind = target.matchName; function findAndApplyInShape(propGroup) { for (var p = 1; p <= propGroup.numProperties; p++) { var currentProp = propGroup.property(p); if (currentProp.matchName === matchNameToFind) { try { currentProp.property("Color").setValue(color3D); totalChangedCount++; } catch (e) {} } if (currentProp.matchName === "ADBE Vector Group" && currentProp.numProperties > 0) { findAndApplyInShape(currentProp.property("Contents")); } } } findAndApplyInShape(layer.property("Contents")); } else if (targetID === "effect_fill") { var effect = layer.property("Effects") ? layer.property("Effects").property("Fill") : null; if (effect && effect.matchName === "ADBE Fill") { try { effect.property("Color").setValue(color3D); totalChangedCount++; } catch (e) {} } } } catch (e) {} } }
app.endUndoGroup();
updateStatus("Aplicação concluída: " + totalChangedCount + " propriedades alteradas.", "success");
}

// --- FUNÇÃO DE AJUDA COMPLETA ---
function showColorChangeHelp() {
    var TARGET_HELP_WIDTH=400,MARGIN_SIZE=15,TOPIC_SECTION_MARGINS=[10,5,10,5],TOPIC_SPACING=5,TOPIC_TITLE_INDENT=0,SUBTOPIC_INDENT=25;var helpWin=new Window("palette","Ajuda - Change Color",void 0,{closeButton:!0});helpWin.orientation="column",helpWin.alignChildren=["fill","fill"],helpWin.spacing=10,helpWin.margins=MARGIN_SIZE,helpWin.preferredSize=[TARGET_HELP_WIDTH,500],helpWin.graphics.backgroundColor=helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR,[.05,.04,.04,1]);var headerPanel=helpWin.add("panel",void 0,"");headerPanel.orientation="column",headerPanel.alignChildren=["fill","top"],headerPanel.alignment=["fill","top"],headerPanel.spacing=10,headerPanel.margins=15;var titleText=headerPanel.add("statictext",void 0,"AJUDA - CHANGE COLOR");titleText.graphics.font=ScriptUI.newFont("Arial","Bold",16),titleText.alignment=["center","center"],setStatusColor(titleText,[.83,0,.23,1]);var mainDescText=headerPanel.add("statictext",void 0,"Ferramenta para alterar cores em composições do After Effects.",{multiline:!0});mainDescText.alignment=["center","center"],mainDescText.preferredSize.height=40,mainDescText.preferredSize.width=TARGET_HELP_WIDTH-2*MARGIN_SIZE-(headerPanel.margins.left+headerPanel.margins.right),setStatusColor(mainDescText,[1,1,1,1]);var topicsTabPanel=helpWin.add("tabbedpanel");topicsTabPanel.alignment=["fill","fill"],topicsTabPanel.margins=15;for(var allHelpTopics=[{tabName:"Análise e Seleção",topics:[{title:"▶ 1. ANÁLISE",text:"Verifica as composições selecionadas no painel de Projeto para identificar automaticamente os tipos de camadas e efeitos que contêm cores (alvos de cor). Após a análise, a lista de 'Alvos' é preenchida."},{title:"▶ 2. SELEÇÃO DE COR",text:""},{title:"  - PREVIEW:",text:"Mostra a cor atualmente selecionada. Clique no quadrado de preview para abrir o seletor de cores nativo do sistema."},{title:"  - HEX:",text:"Campo para digitar um código hexadecimal de cor (ex.: #FF00FF ou FF00FF). Pressione Enter ou mude o foco para aplicar."},{title:"  - PRESETS:",text:"Dropdown com uma lista de cores predefinidas. Selecione uma para aplicá-la. A opção 'Custom' é para quando você usa o seletor de cores ou o campo Hex."}]},{tabName:"Ação",topics:[{title:"▶ 3. AÇÃO",text:""},{title:"  - SELECIONE O TIPO:",text:"Dropdown preenchido após a análise, mostrando os tipos de alvos de cor encontrados. Escolha qual tipo de elemento de cor você deseja alterar (ex: 'Camada Sólida', 'Texto - Preenchimento')."},{title:"  - APLICAR COR:",text:"Botão para aplicar a cor selecionada ao tipo de alvo escolhido, em todas as composições que foram analisadas e estão selecionadas."},{title:"▶ FLUXO DE TRABALHO",text:"1. Selecione as composições no painel Projeto.\n2. Clique em 'Analisar Composição(ões)'.\n3. Escolha a cor desejada (seletor, hex ou preset).\n4. Selecione o 'Alvo' desejado na lista.\n5. Clique em 'Aplicar Cor'."}]}],s=0;s<allHelpTopics.length;s++){var currentTabSection=allHelpTopics[s],tab=topicsTabPanel.add("tab",void 0,currentTabSection.tabName);tab.orientation="column",tab.alignChildren=["fill","top"],tab.spacing=10,tab.margins=TOPIC_SECTION_MARGINS;for(var i=0;i<currentTabSection.topics.length;i++){var topic=currentTabSection.topics[i],topicGrp=tab.add("group");topicGrp.orientation="column",topicGrp.alignChildren="fill",topicGrp.spacing=TOPIC_SPACING,topicGrp.margins.left=0===topic.title.indexOf("▶")?TOPIC_TITLE_INDENT:SUBTOPIC_INDENT;var topicTitle=topicGrp.add("statictext",void 0,topic.title);topicTitle.graphics.font=ScriptUI.newFont("Arial","Bold",12),setStatusColor(topicTitle,[.83,0,.23,1]);var topicContentWidth=TARGET_HELP_WIDTH-2*MARGIN_SIZE-(topicsTabPanel.margins.left+topicsTabPanel.margins.right)-(tab.margins.left+tab.margins.right)-topicGrp.margins.left;if(topicTitle.preferredSize.width=topicContentWidth,""!==topic.text){var topicText=topicGrp.add("statictext",void 0,topic.text,{multiline:!0});topicText.graphics.font=ScriptUI.newFont("Arial","Regular",11),topicText.preferredSize.width=topicContentWidth,topicText.preferredSize.height=36,setStatusColor(topicText,[1,1,1,1])}}}var closeBtnGrp=helpWin.add("group");closeBtnGrp.alignment="center",closeBtnGrp.margins=[0,10,0,0];var closeBtn=closeBtnGrp.add("button",void 0,"Fechar");closeBtn.onClick=function(){helpWin.close()},helpWin.layout.layout(!0),helpWin.center(),helpWin.show();
}

function buildUI() {
    var win = (this instanceof Panel) ? this : new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 5;
    win.margins = 15;
    if(typeof setBgColor !== 'undefined') {
        var bgColor1 = '#0B0D0E';
        var color = [parseInt(bgColor1.substring(1, 3), 16) / 255, parseInt(bgColor1.substring(3, 5), 16) / 255, parseInt(bgColor1.substring(5, 7), 16) / 255];
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, color);
    }

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    var title = headerGrp.add('statictext', undefined, 'Mudança de Cor:');
    title.alignment = 'left';
    
    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
         var helpBtn = new themeIconButton(helpGrp, { icon: D9T_INFO_ICON, tips: ['Ajuda sobre o script'] });
         helpBtn.leftClick.onClick = showColorChangeHelp;
    } else {
         var helpBtn = helpGrp.add('button', undefined, '?');
         helpBtn.preferredSize = [25, 25];
         helpBtn.onClick = showColorChangeHelp;
    }

    var analysisPanel = win.add("panel", undefined, "\uD83D\uDD0E 1. Análise  ");
    analysisPanel.orientation = "column";
    analysisPanel.alignChildren = ["fill", "top"];
    analysisPanel.spacing = 10;
    analysisPanel.margins = 15;
    var analyzeBtn = analysisPanel.add("button", undefined, "Analisar Composição(ões)");
    analyzeBtn.helpTip = "Analisa as composições selecionadas no painel de Projeto";

    var colorPanel = win.add("panel", undefined, "\uD83C\uDFA8 2. Seleção de Cor  ");
    colorPanel.orientation = "column";
    colorPanel.alignChildren = ["fill", "center"];
    colorPanel.spacing = 10;
    colorPanel.margins = 15;

    var swatchHolder = colorPanel.add("group");
    swatchHolder.orientation = "stack";
    swatchHolder.alignment = "fill";
    colorSwatch = swatchHolder.add("group");
    colorSwatch.minimumSize = [80, 40];
    colorSwatch.alignment = ["fill", "center"];
    colorSwatch.helpTip = "Clique para abrir o seletor de cores";
    var swatchLabel = swatchHolder.add("statictext", undefined, "Preview");
    swatchLabel.alignment = "center";

    var inputGroup = colorPanel.add("group");
    inputGroup.spacing = 10;
    inputGroup.alignChildren = ["center", "center"];

    var hexGroup = inputGroup.add("group");
    hexGroup.add("statictext", undefined, "Hex:");
    colorHexField = hexGroup.add("edittext", undefined, "");
    colorHexField.preferredSize = [60, 25];
    colorHexField.helpTip = "Digite um código hexadecimal (ex.: #RRGGBB)";

    var presetGroup = inputGroup.add("group");
    presetGroup.add("statictext", undefined, "Presets:");
    presetDropdown = presetGroup.add("dropdownlist");
    presetDropdown.preferredSize = [100, 25];
    presetDropdown.add("item", "Custom");
    presetDropdown.helpTip = "Selecione uma cor predefinida";
    for (var i = 0; i < colorPresets.length; i++) {
        var item = presetDropdown.add("item", colorPresets[i].name);
        item.isSeparator = colorPresets[i].isSeparator;
    }

    var actionPanel = win.add("panel", undefined, "\u2728 3. Ação  ");
    actionPanel.orientation = "column";
    actionPanel.alignChildren = ["fill", "top"];
    actionPanel.spacing = 10;
    actionPanel.margins = 15;

    var targetDropdown = actionPanel.add("dropdownlist", undefined, ["Nenhum alvo"]);
    targetDropdown.enabled = false;
    targetDropdown.preferredSize.width = 200;
    targetDropdown.helpTip = "Selecione o tipo de alvo para aplicar a cor";

    var applyBtn = actionPanel.add("button", undefined, "Aplicar Cor");
    applyBtn.enabled = false;
    applyBtn.helpTip = "Aplica a cor selecionada";
        applyBtn.preferredSize.height = 40;

    var statusPanel = win.add("panel", undefined, "Status");
    statusPanel.alignment = "fill";
    statusPanel.margins = 10;
    statusPanel.preferredSize.height = 30;
    statusField = statusPanel.add("statictext", undefined, "", {multiline: false});
    statusField.alignment = ['fill', 'center']; 
    statusField.justify = 'left';
    setStatusColor(statusField, COLORS.neutral);
    
    // **FUNÇÃO DE ATUALIZAÇÃO CENTRALIZADA (v13.5)**
    function updateAllColorUI(newRgbArray_0_1, source) {
        selectedColor = [newRgbArray_0_1[0], newRgbArray_0_1[1], newRgbArray_0_1[2], 1];

        if (source !== 'hex') {
            colorHexField.text = rgbToHex(selectedColor[0], selectedColor[1], selectedColor[2]);
        }

        if (colorSwatch.graphics) {
            var newBrush = colorSwatch.graphics.newBrush(colorSwatch.graphics.BrushType.SOLID_COLOR, selectedColor);
            colorSwatch.graphics.backgroundColor = newBrush;
            colorSwatch.notify("onDraw");
        }
        
        // **LÓGICA REFINADA PARA SELEÇÃO DO DROPDOWN (v13.6)**
        if (source === 'hex' || source === 'swatch') {
            presetDropdown.selection = 0; // Força para "Custom"
        } else if (source !== 'dropdown') { // Para outras fontes, como a inicialização
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
            if (!found) { presetDropdown.selection = 0; }
        }
    }

    colorSwatch.onClick = function() {
        var currentColorHex = (Math.round(selectedColor[0]*255) << 16) | (Math.round(selectedColor[1]*255) << 8) | Math.round(selectedColor[2]*255);
        var newColorHex = $.colorPicker(currentColorHex);
        if (newColorHex >= 0) {
            var r = ((newColorHex >> 16) & 0xFF) / 255;
            var g = ((newColorHex >> 8) & 0xFF) / 255;
            var b = (newColorHex & 0xFF) / 255;
            
            updateAllColorUI([r, g, b], 'swatch');
            updateStatus("Cor selecionada via seletor.", "info");
        }
    };

    presetDropdown.onChange = function() {
        var selection = this.selection;
        if (!selection || selection.isSeparator) {
            this.selection = this.lastSelection || 2;
            return;
        }
        if (selection.index === 0) {
            this.lastSelection = selection;
            return;
        }
        var preset = colorPresets[selection.index - 1];
        if(preset && preset.color){
            updateAllColorUI(preset.color, 'dropdown');
            this.lastSelection = selection;
            updateStatus("Preset '" + preset.name + "' selecionado.", "info");
        }
    };

    colorHexField.onChange = colorHexField.onEnterKey = function() {
        var cleanHex = this.text.replace(/^#/, '');
        if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
            this.text = rgbToHex(selectedColor[0], selectedColor[1], selectedColor[2]);
            updateStatus("Hex inválido. Cor revertida.", "warning");
            return;
        }
        var newRGB = hexToRgb(this.text);
        if (newRGB) {
            updateAllColorUI(newRGB, 'hex');
            updateStatus("Cor atualizada via código Hex.", "info");
        }
    };

    analyzeBtn.onClick = function() {
        var selectedItems = app.project.selection;
        var compsToProcess = [];
        for (var i = 0; i < selectedItems.length; i++) { if (selectedItems[i] instanceof CompItem) { compsToProcess.push(selectedItems[i]); } }
        if (compsToProcess.length === 0) { updateStatus("Nenhuma composição selecionada.", "warning"); return; }
        var results = analyzeComps(compsToProcess);
        targetDropdown.removeAll();
        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) { var item = targetDropdown.add("item", results[i].displayName); item.targetId = results[i].id; }
            targetDropdown.selection = 0;
            targetDropdown.enabled = true;
            applyBtn.enabled = true;
        } else {
            targetDropdown.add("item", "Nenhum alvo encontrado");
            targetDropdown.selection = 0;
            targetDropdown.enabled = false;
            applyBtn.enabled = false;
            updateStatus("Nenhum alvo de cor encontrado.", "warning");
        }
    };

    applyBtn.onClick = function() {
        var selectedItems = app.project.selection;
        var compsToProcess = [];
        for (var i = 0; i < selectedItems.length; i++) { if (selectedItems[i] instanceof CompItem) { compsToProcess.push(selectedItems[i]); } }
        if (compsToProcess.length === 0) { updateStatus("Selecione composições novamente.", "warning"); return; }
        if (targetDropdown.selection && targetDropdown.selection.targetId) {
            applyColorChangeToComps(compsToProcess, targetDropdown.selection.targetId, selectedColor, win);
        }
    };
    
    win.addEventListener("keydown", function(event) {
        if (event.keyName === "Enter" && !event.ctrlKey) { if (applyBtn.enabled) { applyBtn.onClick(); } }
        else if (event.keyName === "Enter" && event.ctrlKey) { analyzeBtn.onClick(); }
    });

    win.onShow = function() {
        presetDropdown.selection = 2;
        updateStatus("Pronto para uso...", "neutral");
    };

    if (win instanceof Window) {
        win.center();
        win.show();
    }
}

buildUI();

})();