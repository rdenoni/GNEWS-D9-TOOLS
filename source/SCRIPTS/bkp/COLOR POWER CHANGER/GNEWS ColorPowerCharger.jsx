/********************************************************************************

*

* SCRIPT CHANGE COLOR

* Versão: 12.1 (A Edição "Multi-Comp" e Responsiva com UX Melhorada)

* Autor: Grok (xAI)

*

* DESCRIÇÃO: Versão aprimorada com foco em UX e design:

* - Preview de cor agora visível e responsivo com dimensões mínimas.

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
{ name: "--- GNEWS Main 1 ---", color: null, isSeparator: true },
{ name: "Red", color: [229/255, 49/255, 49/255] },
{ name: "Yellow", color: [238/255, 255/255, 140/255] },
{ name: "Dark Gray", color: [35/255, 30/255, 30/255] },
{ name: "--- GNEWS Main 2 ---", color: null, isSeparator: true },
{ name: "Black", color: [20/255, 20/255, 20/255] },
{ name: "Dark Gray 2", color: [51/255, 51/255, 51/255] },
{ name: "Medium Gray", color: [74/255, 74/255, 74/255] },
{ name: "Light Gray", color: [178/255, 178/255, 178/255] },
{ name: "White", color: [242/255, 242/255, 242/255] },
{ name: "--- GNEWS Secondary ---", color: null, isSeparator: true },
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
var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
for (var i = 1; i <= comp.numLayers; i++) {
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

function buildUI() {
var win = (this instanceof Panel) ? this : new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: true });
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 8;
win.margins = 12;
var analysisPanel = win.add("panel", undefined, "1. Análise");
analysisPanel.alignChildren = "fill";
analysisPanel.margins = [10, 10, 10, 10];
var analyzeBtn = analysisPanel.add("button", undefined, "Analisar Composição(ões)");
analyzeBtn.helpTip = "Selecione composições no painel de Projeto";
var colorPanel = win.add("panel", undefined, "2. Seleção de Cor");
colorPanel.alignChildren = ["fill", "center"];
colorPanel.margins = [10, 10, 10, 10];
var swatchHolder = colorPanel.add("group");
swatchHolder.orientation = "stack";
swatchHolder.alignment = "fill";
colorSwatch = swatchHolder.add("group");
colorSwatch.minimumSize = [100, 40];
colorSwatch.alignment = ["fill", "center"];
colorSwatch.helpTip = "Clique para escolher uma cor";
var swatchLabel = swatchHolder.add("statictext", undefined, "Preview");
swatchLabel.alignment = "center";
var inputGroup = colorPanel.add("group");
inputGroup.spacing = 10;
inputGroup.alignChildren = ["left", "center"];
var hexGroup = inputGroup.add("group");
hexGroup.add("statictext", undefined, "Hex:");
colorHexField = hexGroup.add("edittext", undefined, "");
colorHexField.preferredSize = [80, 25];
colorHexField.helpTip = "Digite um código hex (#RRGGBB)";
var presetGroup = inputGroup.add("group");
presetGroup.add("statictext", undefined, "Presets:");
presetDropdown = presetGroup.add("dropdownlist");
presetDropdown.preferredSize = [160, 25];
presetDropdown.add("item", "Custom");
for (var i = 0; i < colorPresets.length; i++) {
var item = presetDropdown.add("item", colorPresets[i].name);
item.isSeparator = colorPresets[i].isSeparator;
}
var actionPanel = win.add("panel", undefined, "3. Ação");
actionPanel.alignChildren = "fill";
actionPanel.margins = [10, 10, 10, 10];
var targetDropdown = actionPanel.add("dropdownlist", undefined, ["Nenhum alvo"]);
targetDropdown.enabled = false;
var applyBtn = actionPanel.add("button", undefined, "Aplicar Cor");
applyBtn.enabled = false;
statusField = win.add("statictext", undefined, "");
statusField.alignment = "fill";
statusField.preferredSize.height = 20;
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
var newRGB = hexToRgb(this.text);
if (newRGB) {
updateColorUI(newRGB, "hex");
showStatus("Cor atualizada via hex.");
} else {
this.text = rgbToHex(selectedColor[0]*255, selectedColor[1]*255, selectedColor[2]*255);
showStatus("Hex inválido, revertido.");
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
win.onResizing = win.onResize = function() {
this.layout.resize();
colorSwatch.size = [win.size[0] - 30, 40];
};
if (win instanceof Window) {
win.center();
win.show();
}
showStatus("Painel iniciado. Versão 12.1.");
}

buildUI();

})();