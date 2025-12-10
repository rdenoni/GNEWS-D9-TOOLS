
// Logger de configuracoes (para diagnostico de UI/tema)
function D9T_WRITE_CONFIG_TRACE(msg) {
    try {
        var basePath = (typeof runtimeLogsPath === "string" && runtimeLogsPath.length) ? runtimeLogsPath : null;
        if (!basePath) { return; }
        var logFile = new File(basePath + "/config_debug.log");
        if (!logFile.exists && logFile.parent && !logFile.parent.exists) {
            try { logFile.parent.create(); } catch (mkdirErr) {}
        }
        var stamp = new Date().toUTCString();
        if (logFile.open("a")) {
            logFile.encoding = "UTF-8";
            logFile.write("[" + stamp + "] " + (msg || "") + "\n");
            logFile.close();
        }
    } catch (e) {
        try { $.writeln("[CONFIG_LOG_FAIL] " + e); } catch (ignoreErr) {}
    }
}

// ============================================
// 1. MOTOR DE TEMA - DEFINIÇÕES
// ============================================

// Objeto Global de Tema (Inicialização segura)
if (typeof D9T_Theme === 'undefined') {
    D9T_Theme = {
        colors: {},
        layout: {
            iconSize: [36, 36],
            iconSizeCompact: [28, 28],
            logoSize: [70, 24],
            logoSizeCompact: [52, 18],
            iconSpacingCompact: 15,
            iconSpacingNormal: 20,
            labelSpacing: 8,
            sectionSpacing: 30,
            sectionSpacingCompact: 10,
            mainMargins: [15, 15, 15, 15],
            infoMargins: [15, 0, 0, 15],
            verticalBreakpoint: 80,
            horizontalBreakpoint: 200,
            compactModeWidth: 100,
            compactModeHeight: 80,
            verticalCompactWidth: 120,
            searchModeHeight: 44,
            showLabels: true,
            iconOnlySpacing: 18
        },
        buttonTheme: null,
        text: {
            doubleClick: "Clique duplo"
        }
    };
}

// Atualiza as cores globais com base nas preferências carregadas
function D9T_REFRESH_THEME_COLORS() {
    // Carrega preferências se necessário
    if (typeof loadScriptPreferences === "function" && (typeof scriptPreferencesObj === "undefined" || !scriptPreferencesObj.themeColors)) {
        try { loadScriptPreferences(); } catch(e) {}
    }

    var defaults = {
        bgColor1: "#161616", bgColor2: "#1B1B1B", divColor1: "#1D1D1F",
        monoColor0: "#F2F2F2", monoColor1: "#C7C8CA", monoColor2: "#302B2B", monoColor3: "#1A1919",
        normalColor1: "#FFFFFF", normalColor2: "#E6E6E6", highlightColor1: "#FF0046"
    };

    // Pega do objeto de preferência ou do default
    var userColors = (typeof scriptPreferencesObj !== "undefined" && scriptPreferencesObj.themeColors) ? scriptPreferencesObj.themeColors : {};
    
    function getC(k) { return (userColors[k] && userColors[k].length > 4) ? userColors[k] : defaults[k]; }

    // Atualiza objeto D9T_Theme
    D9T_Theme.colors = {
        background: getC("bgColor1"),
        textNormal: getC("monoColor1"),
        textHighlight: getC("highlightColor1"),
        divider: getC("divColor1"),
        mono0: getC("monoColor0"), mono1: getC("monoColor1"), mono2: getC("monoColor2"), mono3: getC("monoColor3"),
        white: getC("normalColor1"),
        bgMain: getC("bgColor1"), bgSec: getC("bgColor2"),
        textLight: getC("normalColor1")
    };

    // Atualiza variáveis globais (Legacy Support)
    $.global.bgColor1 = D9T_Theme.colors.background;
    $.global.bgColor2 = getC("bgColor2");
    $.global.divColor1 = D9T_Theme.colors.divider;
    $.global.normalColor1 = D9T_Theme.colors.white;
    $.global.normalColor2 = getC("normalColor2");
    $.global.highlightColor1 = D9T_Theme.colors.textHighlight;
    $.global.monoColor0 = D9T_Theme.colors.mono0;
    $.global.monoColor1 = D9T_Theme.colors.mono1;
    $.global.monoColor2 = D9T_Theme.colors.mono2;
    $.global.monoColor3 = D9T_Theme.colors.mono3;
}
D9T_REFRESH_THEME_COLORS();

// ============================================
// 2. SISTEMA DE REGISTRO DE JANELAS
// ============================================

function D9T_getThemeRootRegistry() {
  if (!$.global.__D9T_THEME_ROOTS) { $.global.__D9T_THEME_ROOTS = []; }
  return $.global.__D9T_THEME_ROOTS;
}

function D9T_registerThemeRoot(uiObj) {
  if (!uiObj) { return; }
  var refWin = uiObj.window ? uiObj.window : uiObj;
  if (!refWin) { return; }
  var registry = D9T_getThemeRootRegistry();
  for (var i = 0; i < registry.length; i++) {
    var entry = registry[i];
    try {
      if (!entry || typeof entry !== "object") { registry.splice(i,1); i--; continue; }
      var entryWin = entry.window ? entry.window : entry;
      if (!entryWin) { registry.splice(i,1); i--; continue; }
      if (entryWin.visible !== undefined) { /* touch check */ }
      if (entry === uiObj || entry === refWin || entryWin === refWin) { return; }
    } catch (errEntry) { registry.splice(i,1); i--; }
  }
  registry.push(uiObj);
}

function D9T_touchThemeWindow(win) {
  if (!win) { return; }
  try { D9T_applyThemeFallback(win); } catch (e) {}
  try {
    if (win.layout && typeof win.layout.layout === "function") { win.layout.layout(true); }
    if (typeof win.update === "function") { win.update(); }
  } catch (refreshErr) {}
}

function D9T_registerWindowForTheme(win) {
  if (!win) { return; }
  D9T_registerThemeRoot(win);
  D9T_touchThemeWindow(win);
}
$.global.D9T_registerWindowForTheme = D9T_registerWindowForTheme;

// Aplica cores recursivamente em elementos padrão (fallback)
function D9T_applyThemeFallback(win) {
  if (!win) { return; }
  function applyCtrl(ctrl) {
    if (!ctrl) { return; }
    try {
      if (ctrl.type === "panel" || ctrl.type === "group" || ctrl.type === "window") {
        setBgColor(ctrl, bgColor1);
      } else if (ctrl.type === "button" || ctrl.type === "dropdownlist" || ctrl.type === "listbox" || ctrl.type === "edittext") {
        setBgColor(ctrl, bgColor2);
      }
    } catch (e0) {}
    try {
      if (ctrl.graphics) {
        setFgColor(ctrl, D9T_Theme.colors.textNormal);
        if (ctrl.type === "checkbox" || ctrl.type === "radiobutton" || ctrl.type === "statictext") {
          setFgColor(ctrl, D9T_Theme.colors.textNormal);
        }
      }
    } catch (e1) {}
    if (ctrl.children && ctrl.children.length) {
      for (var j = 0; j < ctrl.children.length; j++) {
        applyCtrl(ctrl.children[j]);
      }
    }
  }
  applyCtrl(win);
}

function D9T_refreshAllThemeRoots(targetUI) {
  var registry = D9T_getThemeRootRegistry();
  if (targetUI) { D9T_registerThemeRoot(targetUI); }
  
  // Auto-registra janelas ScriptUI soltas
  try {
    if (typeof ScriptUI !== "undefined" && ScriptUI.windows && ScriptUI.windows.length) {
      for (var w = 0; w < ScriptUI.windows.length; w++) {
        var winObj = ScriptUI.windows[w];
        if (winObj) { D9T_registerWindowForTheme(winObj); }
      }
    }
  } catch (scanErr) {}

  for (var i = registry.length - 1; i >= 0; i--) {
    var root = registry[i];
    if (!root) { registry.splice(i, 1); continue; }
    var refWin = null;
    try { refWin = root.window ? root.window : root; } catch (errRef) { registry.splice(i, 1); continue; }
    if (!refWin) { registry.splice(i, 1); continue; }
    
    try {
      if (root.window && typeof D9T_APPLY_THEME_TO_ROOT === "function") {
        D9T_APPLY_THEME_TO_ROOT(root); // Usa a funcao principal se disponivel
      } else {
        D9T_applyThemeFallback(refWin);
      }
      D9T_touchThemeWindow(refWin);
    } catch (applyErr) {}
    
    if (typeof D9T_LAYOUT === "function" && root.window) {
      try { D9T_LAYOUT(root); } catch (layoutErr) {}
    }
  }
}


// ============================================
// 3. SISTEMA DE TOOLTIPS
// ============================================

var D9T_TOOLTIP_DEFAULT_DELAY = 1500;
function D9T_getTooltipRegistry() {
    if (!$.global.__D9T_tooltips) { $.global.__D9T_tooltips = { list: {}, counter: 0 }; }
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

function D9T_activeHelpTip(id) { D9T_activateHelpTip(id); } // Alias legacy

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

// ============================================
// 4. FUNÇÕES DE SUPORTE À UI (BRIDGE)
// ============================================

function D9T_APPLY_THEME_TO_ROOT(uiObj) {
  uiObj = uiObj || D9T_ui;
  if (!uiObj) { return; }
  var win = uiObj.window ? uiObj.window : uiObj;
  if (!win) { return; }

  D9T_registerThemeRoot(uiObj);
  D9T_applyThemeFallback(win); // Aplica base

  // Se for o layout principal, aplica cores específicas
  var isMainLayout = !!(uiObj.window && (uiObj.headerGrp || uiObj.mainGrp));
  if (isMainLayout) {
    try { setBgColor(uiObj.window, bgColor1); } catch (e) {}
    if (uiObj.headerGrp) { try { setBgColor(uiObj.headerGrp, bgColor2); } catch (e) {} }
    if (uiObj.searchGrp) { try { setBgColor(uiObj.searchGrp, bgColor2); } catch (e) {} }
    
    // Atualiza divisores
    if (uiObj.divArray && uiObj.divArray.length) {
      for (var d = 0; d < uiObj.divArray.length; d++) {
        var divider = uiObj.divArray[d];
        try {
          setUiCtrlColor(divider, D9T_Theme.colors.divider);
          if (divider.notify) { divider.notify("onDraw"); }
        } catch (divErr) {}
      }
    }
  }
  
  // Atualiza botões temáticos registrados
  if (typeof D9T_refreshRegisteredThemeButtons === "function") {
    try { D9T_refreshRegisteredThemeButtons(); } catch (btnErr) {}
  }
}

function D9T_LOCK_WINDOW(win) {
  if (!win) { return; }
  try {
    var fixedSize = win.size;
    win.minimumSize = fixedSize;
    win.maximumSize = fixedSize;
    win.onResizing = win.onResize = function () {
      try { this.size = this.minimumSize; } catch (e) {}
    };
  } catch (err) {}
}

// ============================================
// 5. HELPERS DE COR E DESENHO (BAIXO NÍVEL)
// ============================================

function hexToRgb(hex) {
    if (typeof hex !== 'string') return [0.5, 0.5, 0.5];
    hex = hex.replace('#', '').trim();
    if (hex.length < 6) return [0, 0, 0]; 
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
    ctrl.addEventListener("mouseover", function () { setFgColor(ctrl, highlightColor); });
    ctrl.addEventListener("mouseout", function () { setFgColor(ctrl, normalColor); });
}

function customDraw() {
    if (typeof D9T_drawThemedButton === "function") {
        try { D9T_drawThemedButton(this); return; } catch (_useLocal) {}
    }
    try {
        var g = this.graphics;
        var w = this.size ? this.size[0] : 0;
        var h = this.size ? this.size[1] : 0;

        var radius = (typeof this.__buttonCornerRadius === "number") ? this.__buttonCornerRadius : Math.round(h / 2);
        var maxR = Math.min(w, h) / 2;
        radius = Math.max(0, Math.min(maxR, radius));

        var fill = this.fillBrush ? this.fillBrush : g.newBrush(g.BrushType.SOLID_COLOR, this.buttonColor || [0.2, 0.2, 0.2]);
        g.newPath();
        if (radius <= 0) {
            g.rectPath(0, 0, w, h);
        } else {
            var d = radius * 2;
            g.ellipsePath(0, 0, d, d);
            g.ellipsePath(w - d, 0, d, d);
            g.ellipsePath(0, h - d, d, d);
            g.ellipsePath(w - d, h - d, d, d);
            g.rectPath(radius, 0, w - d, h);
            g.rectPath(0, radius, w, h - d);
        }
        g.fillPath(fill);

        var txt = (typeof this.__buttonDisplayedText !== "undefined") ? this.__buttonDisplayedText : ((typeof this.text !== "undefined") ? this.text : "");
        if (this.__buttonTextTransform === "uppercase") txt = txt.toUpperCase();
        else if (this.__buttonTextTransform === "lowercase") txt = txt.toLowerCase();
        txt = (txt || "").toString();

        if (txt.length) {
            var fSize = (typeof this.__buttonLabelFontSize === "number" && !isNaN(this.__buttonLabelFontSize)) ? this.__buttonLabelFontSize : Math.max(10, Math.min(16, Math.round(h * 0.45)));
            try { g.font = ScriptUI.newFont("Arial", "Bold", fSize); } catch (eFont) {}
            var lines = txt.split("\n");
            var lineSpacing = Math.max(2, Math.round(fSize * 0.25));
            var metrics = [];
            var totalHeight = 0;
            for (var i = 0; i < lines.length; i++) {
                var tLine = lines[i] || "";
                var m = g.measureString(tLine);
                var mH = Math.max(fSize, (m && m.height) ? m.height : fSize);
                metrics.push({ text: tLine, size: m, height: mH });
                totalHeight += mH;
                if (i < lines.length - 1) totalHeight += lineSpacing;
            }
            var offX = (typeof this.__buttonLabelOffsetX === "number") ? this.__buttonLabelOffsetX : 0;
            var offY = (typeof this.__buttonLabelOffset === "number") ? this.__buttonLabelOffset : 0;
            var startY = (h - totalHeight) / 2 + offY;
            var cursorY = startY;
            var textPen = g.newPen(g.PenType.SOLID_COLOR, this.textColor || [1, 1, 1], 1);
            for (var l = 0; l < metrics.length; l++) {
                var data = metrics[l];
                var mSize = data.size;
                var baseW = mSize ? (mSize.width || mSize[0] || 0) : 0;
                var px = ((w - baseW) / 2) + offX;
                var ascent = (mSize && typeof mSize.ascent === "number") ? mSize.ascent : Math.max(1, data.height * 0.75);
                var baseline = cursorY + ascent;
                g.drawString(data.text, textPen, px, baseline);
                cursorY += data.height + lineSpacing;
            }
        }
    } catch (err) {
        try {
            with (this) {
                graphics.drawOSControl();
                graphics.rectPath(0, 0, size[0], size[1]);
                if (fillBrush) graphics.fillPath(fillBrush);
            }
        } catch (_fallback) {}
    }
}
