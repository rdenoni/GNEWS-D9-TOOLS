/*
---------------------------------------------------------------
> ARQUIVO: theme_api.js
> DESCRIÇÃO: API central de tema, aplica cores e ajustes de layout.
> VERSÃO: 1.0 (Atualizado em 2025)
> MÓDULOS USADOS:
>   - globals.js (fonte das cores e strings)
>   - ScriptUI (API nativa utilizada para manipular controles)
---------------------------------------------------------------
*/

// ============================================
// MOTOR DE TEMA - MAPEAMENTO DE VARIÁVEIS GLOBAIS
// ============================================

var D9T_Theme = {
  // Mapeia qual variável do globals.js será usada para cada elemento.
  colors: {
    background: bgColor1,
    textNormal: monoColor1,
    textHighlight: highlightColor1,
    divider: divColor1,
    mono0: monoColor0,
    mono1: monoColor1,
    mono2: monoColor2,
    mono3: monoColor3,
    white: normalColor1
  },
  // Layout e Espaçamento (valores diretos)
  layout: {
    iconSize: [36, 36],
    iconSizeCompact: [28, 28],          // Tamanho dos ícones no modo compacto
    logoSize: [70, 24],                 // Tamanho padrão da logo no cabeçalho
    logoSizeCompact: [52, 18],          // Tamanho reduzido para cabeçalho vertical
    iconSpacingCompact: 15,
    textSpacingNormal: 5,
    iconSpacingNormal: 20,
    labelSpacing: 0,
    sectionSpacing: 30,
    sectionSpacingCompact: 10,          // Espaçamento entre seções no modo compacto
    mainMargins: [15, 15, 15, 15],
    infoMargins: [15, 0, 0, 15],        // Margens do grupo de logo/versão
    breakpointSafetyMargin: 150,        // breakpoint do grupo de logo/versão
    verticalBreakpoint: 80,             // Força layout HORIZONTAL se altura for MENOR que este valor
    horizontalBreakpoint: 200,          // Força layout VERTICAL se largura for MENOR que este valor
    compactModeWidth: 100,              // Largura para ativar o modo compacto
    compactModeHeight: 80,              // Altura para ativar o modo compacto
    verticalCompactWidth: 120,          // Largura alvo para modo compacto quando a barra esta vertical
    searchModeHeight: 44                // Altura limite para o modo busca
  },
  buttonTheme: null,
  // Texto e Strings
  text: {
    lineBreak: lol,
    click: lClick,
    rightClick: rClick,
    doubleClick: dClick
  }
};

function D9T_REFRESH_THEME_COLORS() {
  if (!D9T_Theme || !D9T_Theme.colors) { return; }
  D9T_Theme.colors.background = bgColor1;
  D9T_Theme.colors.textNormal = monoColor1;
  D9T_Theme.colors.textHighlight = highlightColor1;
  D9T_Theme.colors.divider = divColor1;
  D9T_Theme.colors.mono0 = monoColor0;
  D9T_Theme.colors.mono1 = monoColor1;
  D9T_Theme.colors.mono2 = monoColor2;
  D9T_Theme.colors.mono3 = monoColor3;
  D9T_Theme.colors.white = normalColor1;
}
D9T_REFRESH_THEME_COLORS();

var D9T_TOOLTIP_DEFAULT_DELAY = 1500;
function D9T_getTooltipRegistry() {
    if (!$.global.__D9T_tooltips) {
        $.global.__D9T_tooltips = { list: {}, counter: 0 };
    }
    return $.global.__D9T_tooltips;
}

function D9T_registerTooltipControl(ctrl) {
    var registry = D9T_getTooltipRegistry();
    if (ctrl.__d9tTipId === undefined) {
        ctrl.__d9tTipId = registry.counter++;
        registry.list[ctrl.__d9tTipId] = ctrl;
    }
    return ctrl.__d9tTipId;
}

function D9T_clearTooltipTask(ctrl) {
    if (ctrl && ctrl.__d9tTipTask) {
        try { app.cancelTask(ctrl.__d9tTipTask); } catch (err) {}
        ctrl.__d9tTipTask = null;
    }
}

function D9T_activateHelpTip(id) {
    var registry = $.global.__D9T_tooltips;
    if (!registry || !registry.list) { return; }
    var ctrl = registry.list[id];
    if (!ctrl) { return; }
    ctrl.__d9tTipTask = null;
    if (!ctrl.visible) { return; }
    ctrl.helpTip = ctrl.__d9tTipText || "";
}

// Alias mantido por compatibilidade com scripts antigos.
function D9T_activeHelpTip(id) {
    D9T_activateHelpTip(id);
}

function D9T_setDelayedHelpTip(ctrl, text, delayMs) {
    if (!ctrl) { return; }
    ctrl.__d9tTipText = text || "";
    ctrl.__d9tTipDelay = (typeof delayMs === "number") ? delayMs : D9T_TOOLTIP_DEFAULT_DELAY;
    ctrl.helpTip = "";
    var tipId = D9T_registerTooltipControl(ctrl);
    if (ctrl.__d9tTipConfigured) { return; }
    ctrl.__d9tTipConfigured = true;
    ctrl.addEventListener("mouseover", function () {
        var target = this;
        D9T_clearTooltipTask(target);
        target.__d9tTipTask = app.scheduleTask("D9T_activateHelpTip(" + tipId + ")", target.__d9tTipDelay, false);
    });
    ctrl.addEventListener("mouseout", function () {
        var target = this;
        D9T_clearTooltipTask(target);
        target.helpTip = "";
    });
}

$.global.D9T_activateHelpTip = D9T_activateHelpTip;
$.global.D9T_activeHelpTip = D9T_activateHelpTip;

function D9T_OPEN_COLOR_GLOBALS() {
    D9T_OPEN_THEME_DIALOG(D9T_ui);
}

function D9T_APPLY_THEME_TO_ROOT(uiObj) {
  uiObj = uiObj || D9T_ui;
  if (!uiObj || !uiObj.window) { return; }
  try { setBgColor(uiObj.window, bgColor1); } catch (e) {}
  if (uiObj.headerGrp) {
    try { setBgColor(uiObj.headerGrp, bgColor1); } catch (headerErr) {}
  }
  if (uiObj.searchGrp) {
    try { setBgColor(uiObj.searchGrp, bgColor1); } catch (searchErr) {}
  }
  if (uiObj.searchLabel) { setFgColor(uiObj.searchLabel, D9T_Theme.colors.textNormal); }
  if (uiObj.vLab) { setFgColor(uiObj.vLab, D9T_Theme.colors.textNormal); }
}

function D9T_LOCK_WINDOW(win) {
  if (!win) { return; }
  try {
    var fixedSize = win.size;
    win.minimumSize = fixedSize;
    win.maximumSize = fixedSize;
    win.onResizing = win.onResize = function () {
      try { this.size = this.minimumSize; } catch (resizeErr) {}
    };
  } catch (err) {}
}

function D9T_OPEN_COLOR_GLOBALS() {
    D9T_OPEN_THEME_DIALOG(D9T_ui);
}

function D9T_OPEN_THEME_DIALOG(uiObj) {
    uiObj = uiObj || D9T_ui;
    var defaults = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.themeColors) ? defaultScriptPreferencesObj.themeColors : {};
    var current = (scriptPreferencesObj && scriptPreferencesObj.themeColors) ? scriptPreferencesObj.themeColors : defaults;
    var colorEntries = [
        { label: "Fundo principal (bgColor1)", key: "bgColor1" },
        { label: "Fundo secundario (bgColor2)", key: "bgColor2" },
        { label: "Divisores (divColor1)", key: "divColor1" },
        { label: "Mono claro (monoColor0)", key: "monoColor0" },
        { label: "Mono texto (monoColor1)", key: "monoColor1" },
        { label: "Mono destaque (monoColor2)", key: "monoColor2" },
        { label: "Mono escuro (monoColor3)", key: "monoColor3" },
        { label: "Texto claro (normalColor1)", key: "normalColor1" },
        { label: "Texto padrao (normalColor2)", key: "normalColor2" },
        { label: "Highlight (highlightColor1)", key: "highlightColor1" }
    ];

    var win = new Window("palette", "Cores globais");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.margins = 18;
    win.spacing = 10;
    try { setBgColor(win, bgColor1); } catch (e) {}

    var title = win.add("statictext", undefined, "Personalize o tema do GND9TOOLS");
    title.justify = "left";
    setFgColor(title, D9T_Theme.colors.textNormal);
    var info = win.add("statictext", undefined, "Use valores HEX (#RRGGBB ou #RRGGBBAA).", { multiline: true });
    info.maximumSize.width = 280;
    setFgColor(info, D9T_Theme.colors.textNormal);

    var fieldMap = {};

    function tryParseHex(value) {
        if (typeof value !== "string") { return null; }
        var clean = value.replace(/[^0-9a-fA-F]/g, "");
        if (clean.length === 6 || clean.length === 8) {
            return ("#" + clean).toUpperCase();
        }
        return null;
    }

    function updateSwatch(field) {
        if (!field || !field.__swatch) { return; }
        var parsed = tryParseHex(field.text);
        if (parsed) {
            try { setBgColor(field.__swatch, parsed); } catch (e) {}
        }
    }

    function decimalToHex(dec) {
        if (typeof dec !== "number" || dec < 0) { return null; }
        var hex = dec.toString(16);
        while (hex.length < 6) { hex = "0" + hex; }
        return ("#" + hex).toUpperCase();
    }

    function setFieldValue(field, value) {
        if (!field) { return; }
        field.text = value || "";
        updateSwatch(field);
    }

    for (var i = 0; i < colorEntries.length; i++) {
        var entry = colorEntries[i];
        var row = win.add("group");
        row.alignment = ["fill", "top"];
        row.spacing = 6;
        var label = row.add("statictext", undefined, entry.label + ":");
        label.preferredSize.width = 190;
        setFgColor(label, D9T_Theme.colors.textNormal);
        var field = row.add("edittext", undefined, current[entry.key] || defaults[entry.key] || "#000000");
        field.characters = 10;
        field.helpTip = "Valor HEX para " + entry.label;
        var swatch = row.add("panel");
        swatch.preferredSize = [26, 16];
        swatch.margins = 0;
        swatch.helpTip = "Clique para escolher " + entry.label;
        field.__swatch = swatch;
        fieldMap[entry.key] = field;
        (function(refField) {
            function hexToDecimal(hexValue) {
                var clean = (hexValue || "").replace('#', '');
                if (clean.length !== 6 && clean.length !== 8) { return null; }
                clean = clean.length === 8 ? clean.substring(0, 6) : clean;
                var dec = parseInt(clean, 16);
                if (isNaN(dec)) { return null; }
                return dec;
            }
            function openPicker() {
                if (typeof $.colorPicker !== "function") {
                    alert("Color picker nao disponivel neste host.");
                    return;
                }
                var parsedHex = tryParseHex(refField.text);
                var initialDec = hexToDecimal(parsedHex);
                var result = (initialDec !== null) ? $.colorPicker(initialDec) : $.colorPicker();
                if (result < 0) { return; }
                var hex = decimalToHex(result);
                if (hex) {
                    refField.text = hex;
                    updateSwatch(refField);
                }
            }
            swatch.addEventListener("click", openPicker);
            refField.onChanging = function () { updateSwatch(refField); };
            refField.onChange = function () { updateSwatch(refField); };
            refField.addEventListener("keydown", function (evt) {
                if (evt.keyName === "Enter") { openPicker(); }
            });
            updateSwatch(refField);
        })(field);
    }

    function collectValues() {
        var data = {};
        for (var j = 0; j < colorEntries.length; j++) {
            var entry = colorEntries[j];
            var parsed = tryParseHex(fieldMap[entry.key].text);
            if (!parsed) {
                alert("Valor invalido para " + entry.label + ". Use formato #RRGGBB ou #RRGGBBAA.");
                return null;
            }
            data[entry.key] = parsed;
        }
        return data;
    }

    function applyTheme(values, persist) {
        if (!values) { return; }
        var usedCentralHelper = (typeof D9T_Preferences !== "undefined" && typeof D9T_Preferences.updateThemeSettings === "function");
        if (usedCentralHelper) {
            try {
                D9T_Preferences.updateThemeSettings(values, persist);
                if (typeof D9T_Preferences.get === "function") {
                    scriptPreferencesObj.themeColors = D9T_Preferences.get('themeColors', scriptPreferencesObj.themeColors || {});
                }
            } catch (prefsErr) {
                $.writeln('[theme_api] Falha ao atualizar tema via D9T_Preferences: ' + prefsErr);
                usedCentralHelper = false;
            }
        }
        if (!usedCentralHelper) {
            scriptPreferencesObj.themeColors = {};
            for (var key in values) {
                if (values.hasOwnProperty(key)) {
                    scriptPreferencesObj.themeColors[key] = values[key];
                }
            }
            if (typeof applyThemeColorOverrides === "function") {
                applyThemeColorOverrides(scriptPreferencesObj.themeColors);
            }
            D9T_REFRESH_THEME_COLORS();
            if (persist) {
                // Prefer salvamento direto do JSON de usuário
                if (typeof saveScriptPreferences === "function") {
                    try { saveScriptPreferences(); }
                    catch (prefsErr2) { $.writeln('[theme_api] Falha ao salvar via saveScriptPreferences: ' + prefsErr2); }
                } else if (typeof D9T_Preferences !== "undefined" && typeof D9T_Preferences.save === "function") {
                    try { D9T_Preferences.save(); }
                    catch (prefsErr3) { $.writeln('[theme_api] Falha ao salvar via D9T_Preferences: ' + prefsErr3); }
                }
            }
        }
        if (typeof D9T_APPLY_THEME_TO_ROOT === "function") {
            try { D9T_APPLY_THEME_TO_ROOT(uiObj); } catch (applyErr) {
                $.writeln('[theme_api] Falha ao aplicar tema na UI: ' + applyErr);
            }
        }
        if (uiObj && uiObj.window && typeof D9T_LAYOUT === "function") {
            try { D9T_LAYOUT(uiObj); } catch (layoutErr) {
                $.writeln('[theme_api] Falha ao redesenhar UI: ' + layoutErr);
            }
        }
    }

    var btnGrp = win.add("group");
    btnGrp.alignment = ["right", "top"];
    btnGrp.orientation = "row";
    btnGrp.spacing = 8;

    var resetBtn = btnGrp.add("button", undefined, "Resetar");
    resetBtn.helpTip = "Restaura os valores padrão de tema";
    var saveBtn = btnGrp.add("button", undefined, "Aplicar");
    saveBtn.helpTip = "Aplica e salva as cores escolhidas";

    resetBtn.onClick = function () {
        for (var r = 0; r < colorEntries.length; r++) {
            var entry = colorEntries[r];
            setFieldValue(fieldMap[entry.key], defaults[entry.key]);
        }
        applyTheme(defaults, true);
    };

    saveBtn.onClick = function () {
        var values = collectValues();
        if (!values) { return; }
        applyTheme(values, true);
    };

    try { win.layout.layout(true); } catch (layoutErrColor) {}
    try { win.center(); } catch (centerErr) {}
    D9T_LOCK_WINDOW(win);
    win.show();
}

// ============================================
// FUNÇÕES DE ESTILO
// ============================================

function hexToRgb(hex) {
    if (typeof hex !== 'string') return [1, 1, 1];
    hex = hex.replace('#', '');
    if (hex.length > 6) hex = hex.substring(0, 6);
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
}

function setBgColor(w, hex) {
    var color = hexToRgb(hex);
    var bType = w.graphics.BrushType.SOLID_COLOR;
    w.graphics.backgroundColor = w.graphics.newBrush(bType, color);
}

function setUiCtrlColor(ctrl, hex) {
    var color = hexToRgb(hex);
    var bType = ctrl.graphics.BrushType.SOLID_COLOR;
    ctrl.fillBrush = ctrl.graphics.newBrush(bType, color);
}

function setFgColor(ctrl, hex) {
    var color = hexToRgb(hex);
    var pType = ctrl.graphics.PenType.SOLID_COLOR;
    ctrl.graphics.foregroundColor = ctrl.graphics.newPen(pType, color, 1);
}

function setCtrlHighlight(ctrl, normalColor, highlightColor) {
    setFgColor(ctrl, normalColor);
    ctrl.addEventListener("mouseover", function () {
        setFgColor(ctrl, highlightColor);
    });
    ctrl.addEventListener("mouseout", function () {
        setFgColor(ctrl, normalColor);
    });
}

function customDraw() {
    with(this) {
        graphics.drawOSControl();
        graphics.rectPath(0, 0, size[0], size[1]);
        graphics.fillPath(fillBrush);
    }
}
