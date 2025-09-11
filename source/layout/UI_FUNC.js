// ADICIONADO: Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

/*
---------------------------------------------------------------
> UI_FUNC.js - Interface e Layout Completo
> Versão: 3.0 - Lógica responsiva aprimorada
> Data: 2025
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
    horizontalBreakpoint: 550,          // Força layout VERTICAL se largura for MENOR que este valor
    compactModeWidth: 950,              // Largura para ativar o modo compacto
    compactModeHeight: 80               // Altura para ativar o modo compacto
  },
  // Texto e Strings
  text: {
    lineBreak: lol,
    click: lClick,
    rightClick: rClick,
    doubleClick: dClick
  }
};


// ============================================
// INICIALIZAÇÃO E CARREGAMENTO DE DADOS
// ============================================

function initializeGlobalVariables() {
  if (typeof scriptMainPath === 'undefined' || !scriptMainPath) {
    try {
      if ($.fileName && $.fileName !== '') {
        var currentFile = new File($.fileName);
        scriptMainPath = currentFile.parent.parent.fullName + '/';
      } else {
        throw new Error("Caminho do script não encontrado");
      }
    } catch (e) {
      scriptMainPath = Folder.userData.fullName + '/GND9TOOLS script/';
      var scriptFolder = new Folder(scriptMainPath);
      if (!scriptFolder.exists) scriptFolder.create();
    }
  }
  if (typeof D9T_prodArray === 'undefined') {
    D9T_prodArray = [];
    loadProductionData();
  }
}

function loadProductionData() {
  try {
    var configFile = new File(scriptMainPath + 'source/config/TEMPLATES_config.json');
    if (configFile.exists) {
      configFile.open('r');
      var content = configFile.read();
      configFile.close();
      var data = JSON.parse(content);
      D9T_prodArray = data.PRODUCTIONS || [];
    } else {
      D9T_prodArray = [{ name: "GNEWS", paths: ["T:\\JORNALISMO\\GLOBONEWS\\TEMPLATES"], icon: "GNEWS_ICON" }];
    }
  } catch (e) {
    D9T_prodArray = [{ name: "GNEWS", paths: ["T:\\JORNALISMO\\GLOBONEWS\\TEMPLATES"], icon: "GNEWS_ICON" }];
  }
}

initializeGlobalVariables();


// ============================================
// CONSTRUÇÃO DA INTERFACE
// ============================================

function D9T_BUILD_UI(structureObj, uiObj) {
  uiObj.window.margins = 4;
  uiObj.window.orientation = "stack";
  uiObj.mainGrp = uiObj.window.add("group");
  uiObj.sectionGrpArray.push(uiObj.mainGrp);
  uiObj.infoGrp = uiObj.window.add("group");
  uiObj.infoGrp.spacing = 0;
  uiObj.sectionGrpArray.push(uiObj.infoGrp);
  uiObj.mainLogo = uiObj.infoGrp.add("image", undefined, LOGO_IMG.light);
  uiObj.mainLogo.maximumSize = [70, 24];
  uiObj.mainLogo.minimumSize = [50, 24];
  uiObj.mainLogo.helpTip = [scriptName, scriptVersion, "| D9"].join(" ");
  uiObj.vLab = uiObj.infoGrp.add("statictext", undefined, scriptVersion, {
    truncate: "end",
  });
  uiObj.vLab.justify = "center";
  uiObj.vLab.helpTip = "ajuda | DOCS";
  uiObj.pinGrp = uiObj.window.add("group");
  uiObj.pinGrp.alignment = ["center", "top"];
  uiObj.pinGrp.spacing = 16;
  uiObj.sectionGrpArray.push(uiObj.pinGrp);
  
  uiObj.iconBtnMainGrp = uiObj.pinGrp.add("group");
  uiObj.iconBtnGrp0 = uiObj.iconBtnMainGrp.add("group");
  uiObj.sectionGrpArray.push(uiObj.iconBtnGrp0);
  uiObj.iconBtnGrp1 = uiObj.iconBtnMainGrp.add("group");
  uiObj.sectionGrpArray.push(uiObj.iconBtnGrp1);
  var sectionCounter = 0;
  var ctrlCounter = 0;
  for (var pinSec in structureObj.pinGrp) {
    var pinSection = structureObj["pinGrp"][pinSec];
    if (sectionCounter > 0)
      uiObj.divArray.push(new themeDivider(uiObj.mainGrp));
    var pinSectionGrp = uiObj.mainGrp.add("group", undefined, {
      name: "sectionGrp",
    });
    pinSectionGrp.alignment = ["center", "top"];
    uiObj.sectionGrpArray.push(pinSectionGrp);
    for (var pinCtrl in pinSection) {
      var pinCtrlProperties = pinSection[pinCtrl];
      pinCtrlProperties.key = pinCtrl;
      if (pinCtrlProperties.labelTxt == undefined)
        pinCtrlProperties.labelTxt = pinCtrl.replace(/_/g, " ").toTitleCase();
      if (pinCtrlProperties.type == "imageButton") {
        uiObj[pinCtrl] = new themeImageButton(pinSectionGrp, pinCtrlProperties);
        uiObj.imageButtonArray.push(uiObj[pinCtrl]);
      }
      ctrlCounter++;
    }
    sectionCounter++;
  }
  sectionCounter = 0;
  for (var sec in structureObj.mainGrp) {
    var section = structureObj["mainGrp"][sec];
    if (sectionCounter > 0)
      uiObj.divArray.push(new themeDivider(uiObj.mainGrp));
    var sectionGrp = uiObj.mainGrp.add("group", undefined, {
      name: "sectionGrp",
    });
    sectionGrp.alignment = ["center", "top"];
    uiObj.sectionGrpArray.push(sectionGrp);
    for (var ctrl in section) {
      var ctrlProperties = section[ctrl];
      ctrlProperties.key = ctrl;
      if (ctrlProperties.labelTxt == undefined)
        ctrlProperties.labelTxt = ctrl.replace(/_/g, " ").toTitleCase();
      if (ctrlProperties.type == "imageButton") {
        uiObj[ctrl] = new themeImageButton(sectionGrp, ctrlProperties);
        uiObj.imageButtonArray.push(uiObj[ctrl]);
      }
    }
    sectionCounter++;
  }
  uiObj.window.layout.layout(true);
  setCtrlHighlight(uiObj.vLab, monoColor0, highlightColor1);
  setBgColor(uiObj.window, bgColor1);
  uiObj.window.onShow = function () {
    for (var b = 0; b < uiObj.imageButtonArray.length; b++) {
      var btn = uiObj.imageButtonArray[b];
      btn.label.preferredSize = btn.label.size;
    }
    D9T_LAYOUT(uiObj);
  };
  uiObj.window.onResizing = uiObj.window.onResize = function () {
    D9T_LAYOUT(uiObj);
  };
  D9T_UI_EVENTS(uiObj);
}

function D9T_LAYOUT(uiObj) {
  var isRow = uiObj.window.size.width > uiObj.window.size.height;
  var grpOrientation = isRow ? "row" : "column";
  var btnOrientation = isRow ? "column" : "row";
  var iconOrientation = uiObj.window.size.width < 70 ? "column" : "row";
  
  var pinGap = isRow ? 50 : 50; 
  var infoGap = isRow ? 110 : 56;
  var iconGap = uiObj.iconButtonArray.length * 28;
  if (!isRow && uiObj.window.size.width >= 70)
    iconGap = Math.ceil(uiObj.iconButtonArray.length / 2) * 28;
  pinGap += iconGap;
  try {
    for (var s = 0; s < uiObj.sectionGrpArray.length; s++) {
      var sectionGrp = uiObj.sectionGrpArray[s];
      sectionGrp.orientation = grpOrientation;
      sectionGrp.spacing = uiObj.window.size.height < 72 ? 24 : 8;
    }
    for (var d = 0; d < uiObj.divArray.length; d++) {
      var div = uiObj.divArray[d];
      div.size = [1, 1];
      div.alignment = isRow ? ["center", "fill"] : ["fill", "center"];
    }
    for (var b = 0; b < uiObj.imageButtonArray.length; b++) {
      var btn = uiObj.imageButtonArray[b];
      btn.btnGroup.orientation = btnOrientation;
      btn.btnGroup.spacing = isRow ? 0 : 8;
      btn.normalImg.size = btn.hoverImg.size = [32, 32];
      btn.label.justify = isRow ? "center" : "left";
      btn.label.size = [uiObj.window.size.width - 60, 18];
      if (uiObj.window.size.width < 88 || uiObj.window.size.height < 72) {
        btn.btnGroup.spacing = 0;
        btn.label.size = [0, 0];
      }
      if (uiObj.window.size.height < 44) {
        btn.btnGroup.spacing = 0;
        btn.hoverImg.size = btn.normalImg.size = [0, 0];
        btn.label.size = btn.label.preferredSize;
      }
    }
    uiObj.mainGrp.margins = isRow
      ? [pinGap, 0, infoGap, 0]
      : [4, pinGap, 4, infoGap];
    uiObj.mainGrp.spacing = uiObj.window.size.height < 44 ? 24 : 16;
    uiObj.pinGrp.alignment = isRow ? "left" : "top";
    uiObj.pinGrp.spacing = 20;
    uiObj.iconBtnMainGrp.orientation = iconOrientation;
    uiObj.iconBtnMainGrp.spacing = 4;
    uiObj.iconBtnGrp0.spacing = 4;
    uiObj.iconBtnGrp1.spacing = 4;
    uiObj.infoGrp.alignment = isRow ? "right" : "bottom";
    uiObj.infoGrp.spacing = 0;
    uiObj.mainLogo.size.width = uiObj.window.size.width - 10;
  } catch (err) {
    alert(lol + "#D9T_LAYOUT - " + "" + err.message);
  }
  uiObj.window.layout.layout(true);
  uiObj.window.layout.resize();
}

// ============================================
// EVENTOS DA INTERFACE
// ============================================

function D9T_UI_EVENTS(uiObj) {
    function safeExecute(functionName, func) {
      try {
        if (typeof func === 'function') func();
        else alert('A função "' + functionName + '" não está disponível.');
      } catch (err) {
        var errorMsg = 'Erro ao executar ' + functionName + ':\n\n' + err.toString();
        if (err.line) errorMsg += '\nLinha: ' + err.line;
        alert(errorMsg);
      }
    }
  
    if (uiObj.templates) {
      if (uiObj.templates.leftClick) uiObj.templates.leftClick.onClick = function () { safeExecute('d9TemplateDialog', d9TemplateDialog); };
      if (uiObj.templates.rightClick) uiObj.templates.rightClick.onClick = function () { safeExecute('d9ProdFoldersDialog', function(){ d9ProdFoldersDialog(D9T_prodArray); }); };
    }
    if (uiObj.Finders) {
      if (uiObj.Finders.leftClick) uiObj.Finders.leftClick.onClick = function () { safeExecute('findDialog', findDialog); };
      if (uiObj.Finders.rightClick) uiObj.Finders.rightClick.onClick = function () { safeExecute('D9TFindProjectDialog', D9TFindProjectDialog); };
    }
    if (uiObj.LibraryLive) {
      if (uiObj.LibraryLive.leftClick) uiObj.LibraryLive.leftClick.onClick = function () { safeExecute('launchLibraryLiveUI', launchLibraryLiveUI); };
      if (uiObj.LibraryLive.rightClick) uiObj.LibraryLive.rightClick.onClick = function () { safeExecute('launchLibraryLiveConfigWinUI', launchLibraryLiveConfigWinUI); };
    }
    if (uiObj.Links) {
      if (uiObj.Links.leftClick) uiObj.Links.leftClick.onClick = function () { safeExecute('launchCopyLinks', launchCopyLinks); };
    }
    if (uiObj.Renamer) {
      if (uiObj.Renamer.leftClick) uiObj.Renamer.leftClick.onClick = function () { var ctx = this; safeExecute('createRenamerUI', function() { createRenamerUI(ctx); }); };
    }
    if (uiObj.MailMaker) {
      if (uiObj.MailMaker.leftClick) uiObj.MailMaker.leftClick.onClick = function () { safeExecute('launchMailMaker', launchMailMaker); };
    }
    if (uiObj.LayerOrder) {
      if (uiObj.LayerOrder.leftClick) uiObj.LayerOrder.leftClick.onClick = function () { var ctx = this; safeExecute('launchLayerOrderUI', function() { launchLayerOrderUI(ctx); }); };
      if (uiObj.LayerOrder.rightClick) uiObj.LayerOrder.rightClick.onClick = function () { safeExecute('launchLayerOrderConfigWinUI', launchLayerOrderConfigWinUI); };
    }
    if (uiObj.TextBox) {
      if (uiObj.TextBox.leftClick) uiObj.TextBox.leftClick.onClick = function () { var ctx = this; safeExecute('createUI', function() { createUI(ctx); }); };
    }
    if (uiObj.AnchorAlign) {
      if (uiObj.AnchorAlign.leftClick) uiObj.AnchorAlign.leftClick.onClick = function () { var ctx = this; safeExecute('launchAnchorAlign', function() { launchAnchorAlign(ctx); }); };
    }
    if (uiObj.colorChange) {
      if (uiObj.colorChange.leftClick) uiObj.colorChange.leftClick.onClick = function () { safeExecute('launchColorChange', launchColorChange); };
    }
    if (uiObj.Normalizer) {
      if (uiObj.Normalizer.leftClick) uiObj.Normalizer.leftClick.onClick = function () { var ctx = this; safeExecute('launchNormalizerUI', function() { launchNormalizerUI(ctx); }); };
    }
    if (uiObj.cropComp) {
      if (uiObj.cropComp.leftClick) uiObj.cropComp.leftClick.onClick = function () { var ctx = this; safeExecute('launchCropComp', function() { launchCropComp(ctx); }); };
    }
}


// ============================================
// COMPONENTES DE INTERFACE - TODOS
// ============================================

function themeDivider(sectionGrp) {
    var newDiv = sectionGrp.add("customButton", [0, 0, 1, 1]);
    setUiCtrlColor(newDiv, D9T_Theme.colors.divider);
    newDiv.onDraw = customDraw;
    return newDiv;
}

function themeIconButton(sectionGrp, ctrlProperties) {
    var newUiCtrlObj = {};
    var tipTxt = ctrlProperties.tips.join("\n\n");
    if (ctrlProperties.icon.hover == undefined) ctrlProperties.icon.hover = ctrlProperties.icon.normal;
    var btnGroup = sectionGrp.add("group");
    var iconGroup = btnGroup.add("group");
    iconGroup.orientation = "stack";
    newUiCtrlObj.leftClick = iconGroup.add("button", undefined, "");
    newUiCtrlObj.leftClick.size = [0, 0];
    newUiCtrlObj.leftClick.visible = false;
    newUiCtrlObj.rightClick = iconGroup.add("button", undefined, "");
    newUiCtrlObj.rightClick.size = [0, 0];
    newUiCtrlObj.rightClick.visible = false;
    var hoverImg = iconGroup.add("image", undefined, ctrlProperties.icon.hover);
    hoverImg.helpTip = tipTxt;
    hoverImg.visible = false;
    var normalImg = iconGroup.add("image", undefined, ctrlProperties.icon.normal);
    normalImg.helpTip = tipTxt;
    btnGroup.addEventListener("mouseover", function () {
        this.children[0].children[3].visible = false;
        this.children[0].children[2].visible = true;
    });
    btnGroup.addEventListener("mouseout", function () {
        this.children[0].children[2].visible = false;
        this.children[0].children[3].visible = true;
    });
    hoverImg.addEventListener("click", function (c) {
        if (c.button == 0) this.parent.children[0].notify();
        if (c.button == 2) this.parent.children[1].notify();
    });
    return newUiCtrlObj;
}

function themeImageButton(sectionGrp, ctrlProperties) {
    var newUiCtrlObj = {};
    var newBtn = (newUiCtrlObj[ctrlProperties.key] = {});
    var tipTxt = ctrlProperties.labelTxt + ":\n\n" + ctrlProperties.tips.join("\n\n");
    if (ctrlProperties.icon.hover == undefined) ctrlProperties.icon.hover = ctrlProperties.icon.normal;
    newBtn.btnGroup = sectionGrp.add("group");
    newBtn.iconGroup = newBtn.btnGroup.add("group");
    newBtn.iconGroup.orientation = "stack";
    newBtn.leftClick = newBtn.iconGroup.add("button", undefined, "");
    newBtn.leftClick.size = [0, 0];
    newBtn.leftClick.visible = false;
    newBtn.rightClick = newBtn.iconGroup.add("button", undefined, "");
    newBtn.rightClick.size = [0, 0];
    newBtn.rightClick.visible = false;
    newBtn.hoverImg = newBtn.iconGroup.add("image", undefined, ctrlProperties.icon.hover);
    newBtn.hoverImg.helpTip = tipTxt;
    newBtn.hoverImg.visible = false;
    newBtn.normalImg = newBtn.iconGroup.add("image", undefined, ctrlProperties.icon.normal);
    newBtn.normalImg.helpTip = tipTxt;
    newBtn.label = newBtn.btnGroup.add("statictext", undefined, ctrlProperties.labelTxt, { truncate: "end" });
    newBtn.label.maximumSize = [70, 18];
    newBtn.label.helpTip = tipTxt;
    setFgColor(newBtn.label, D9T_Theme.colors.textNormal);
    newBtn.btnGroup.addEventListener("mouseover", function () {
        setFgColor(this.children[1], D9T_Theme.colors.textHighlight);
        this.children[0].children[3].visible = false;
        this.children[0].children[2].visible = true;
    });
    newBtn.btnGroup.addEventListener("mouseout", function () {
        setFgColor(this.children[1], D9T_Theme.colors.textNormal);
        this.children[0].children[2].visible = false;
        this.children[0].children[3].visible = true;
    });
    newBtn.label.addEventListener("click", function (c) {
        if (c.button == 0) this.parent.children[0].children[0].notify();
        if (c.button == 2) this.parent.children[0].children[1].notify();
    });
    newBtn.hoverImg.addEventListener("click", function (c) {
        if (c.button == 0) this.parent.children[0].notify();
        if (c.button == 2) this.parent.children[1].notify();
    });
    return newBtn;
}

function themeButton(sectionGrp, ctrlProperties) {
    try {
        if (ctrlProperties.buttonColor === undefined) ctrlProperties.buttonColor = D9T_Theme.colors.divider;
        if (ctrlProperties.textColor === undefined) ctrlProperties.textColor = D9T_Theme.colors.textNormal;
        var newUiCtrlObj = {};
        var tipTxt = ctrlProperties.tips.join("\n\n");
        var newBtnGrp = sectionGrp.add("group");
        newBtnGrp.orientation = "stack";
        newUiCtrlObj.leftClick = newBtnGrp.add("button", undefined, "");
        newUiCtrlObj.leftClick.size = [0, 0];
        newUiCtrlObj.leftClick.visible = false;
        newUiCtrlObj.rightClick = newBtnGrp.add("button", undefined, "");
        newUiCtrlObj.rightClick.size = [0, 0];
        newUiCtrlObj.rightClick.visible = false;
        newUiCtrlObj.label = newBtnGrp.add("customButton");
        newUiCtrlObj.label.size = [ctrlProperties.width, ctrlProperties.height];
        newUiCtrlObj.label.text = ctrlProperties.labelTxt;
        newUiCtrlObj.label.buttonColor = hexToRgb(ctrlProperties.buttonColor);
        newUiCtrlObj.label.textColor = hexToRgb(ctrlProperties.textColor);
        newUiCtrlObj.label.minimumSize = [68, 34];
        newUiCtrlObj.label.helpTip = tipTxt;
        drawThemeButton(newUiCtrlObj.label);
        newUiCtrlObj.label.addEventListener("mouseover", function () {
            this.textColor = [1, 1, 1];
            this.buttonColor = hexToRgb(D9T_Theme.colors.textHighlight);
            drawThemeButton(this);
        });
        newUiCtrlObj.label.addEventListener("mouseout", function () {
            this.textColor = hexToRgb(ctrlProperties.textColor);
            this.buttonColor = hexToRgb(ctrlProperties.buttonColor);
            drawThemeButton(this);
        });
        newUiCtrlObj.label.onClick = function () { this.parent.children[0].notify(); };
        newUiCtrlObj.label.addEventListener("click", function (c) {
            if (c.button == 2) this.parent.children[1].notify();
        });
        return newUiCtrlObj;
    } catch (err) { alert(err.message); }
}

function themeAltButton(sectionGrp, ctrlProperties) {
    try {
        var defaultButtonColor = ctrlProperties.buttonColor || D9T_Theme.colors.divider;
        var defaultTextColor = ctrlProperties.textColor || D9T_Theme.colors.textNormal;
        var hoverButtonColor = ctrlProperties.hoverButtonColor || D9T_Theme.colors.mono0;
        var hoverTextColor = ctrlProperties.hoverTextColor || D9T_Theme.colors.mono3;
        var newUiCtrlObj = {};
        var tipTxt = ctrlProperties.tips ? ctrlProperties.tips.join("\n\n") : "";
        var newBtnGrp = sectionGrp.add("group");
        newBtnGrp.orientation = "stack";
        newUiCtrlObj.leftClick = newBtnGrp.add("button", undefined, "");
        newUiCtrlObj.leftClick.size = [0, 0];
        newUiCtrlObj.leftClick.visible = false;
        newUiCtrlObj.rightClick = newBtnGrp.add("button", undefined, "");
        newUiCtrlObj.rightClick.size = [0, 0];
        newUiCtrlObj.rightClick.visible = false;
        newUiCtrlObj.label = newBtnGrp.add("customButton");
        var buttonWidth = ctrlProperties.width || 120;
        var buttonHeight = ctrlProperties.height || 32;
        newUiCtrlObj.label.size = [buttonWidth, buttonHeight];
        newUiCtrlObj.label.text = ctrlProperties.labelTxt || "Botão";
        newUiCtrlObj.label.helpTip = tipTxt;
        newUiCtrlObj.label.buttonColor = hexToRgb(defaultButtonColor);
        newUiCtrlObj.label.textColor = hexToRgb(defaultTextColor);
        newUiCtrlObj.label.hoverButtonColor = hexToRgb(hoverButtonColor);
        newUiCtrlObj.label.hoverTextColor = hexToRgb(hoverTextColor);
        newUiCtrlObj.label.isHovered = false;
        newUiCtrlObj.label.onDraw = function () {
            var g = this.graphics;
            var w = this.size.width;
            var h = this.size.height;
            var currentButtonColor = this.isHovered ? this.hoverButtonColor : this.buttonColor;
            var currentTextColor = this.isHovered ? this.hoverTextColor : this.textColor;
            var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, currentButtonColor);
            var textPen = g.newPen(g.PenType.SOLID_COLOR, currentTextColor, 1);
            g.ellipsePath(0, 0, h, h);
            g.ellipsePath(w - h, 0, h, h);
            g.rectPath(h / 2, 0, w - h, h);
            g.fillPath(fillBrush);
            var textLinesArray = this.text.split("\n");
            var totalTextHeight = textLinesArray.length * 12;
            var startY = (h - totalTextHeight) / 2 + 12;
            for (var l = 0; l < textLinesArray.length; l++) {
                var textSize = g.measureString(textLinesArray[l]);
                var px = (w - textSize.width) / 2;
                var py = startY + l * 12;
                g.drawString(textLinesArray[l], textPen, px, py);
            }
        };
        newUiCtrlObj.label.addEventListener("mouseover", function () { this.isHovered = true; this.notify("onDraw"); });
        newUiCtrlObj.label.addEventListener("mouseout", function () { this.isHovered = false; this.notify("onDraw"); });
        newUiCtrlObj.label.onClick = function () { this.parent.children[0].notify(); };
        newUiCtrlObj.label.addEventListener("click", function (c) { if (c.button == 2) this.parent.children[1].notify(); });
        return newUiCtrlObj;
    } catch (err) { alert("Erro no themeAltButton: " + err.message); return null; }
}

// ======================================================================
// >>>>>>>>>>>>>>>> FUNÇÃO drawThemeButton - VERSÃO CORRIGIDA <<<<<<<<<<<<<<<<
// ======================================================================
function drawThemeButton(button) {
    button.onDraw = function() {
        var g = this.graphics;
        var w = this.size.width;
        var h = this.size.height;
        var textPen = g.newPen(g.PenType.SOLID_COLOR, this.textColor, 1);
        var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, this.buttonColor);

        // 1. Desenha a forma do botão (esta parte está correta)
        g.ellipsePath(0, 0, h, h);
        g.ellipsePath(w - h, 0, h, h);
        g.rectPath(h / 2, 0, w - h, h);
        g.fillPath(fillBrush);

        // --- LÓGICA DE CENTRALIZAÇÃO DE TEXTO (VERSÃO MELHORADA) ---
        var textLinesArray = this.text.split("\n");
        
        // 2. Parâmetros do texto
        var fontHeight = 12; // Altura aproximada da fonte
        var totalTextHeight = textLinesArray.length * fontHeight;

        // 3. Calcula a posição Y inicial para o bloco de texto
        // Isso encontra a "margem superior" para que o bloco de texto fique centrado
        var startY = (h - totalTextHeight) / 2;

        // 4. Desenha cada linha de texto
        for (var l = 0; l < textLinesArray.length; l++) {
            var lineText = textLinesArray[l];
            var textSize = g.measureString(lineText);

            // Posição X: Centraliza o texto horizontalmente
            var px = (w - textSize.width) / 2;

            // Posição Y: Calcula a posição da 'baseline' (linha de base da fonte)
            // O valor '10' é um ajuste para alinhar a baseline corretamente no centro vertical
            var baselineOffset = 10;
            var py = startY + (l * fontHeight) + baselineOffset;

            g.drawString(lineText, textPen, px, py);
        }
    };
}


function drawThemeAltButton(button) {
    var g = button.graphics;
    var textPen = g.newPen(g.PenType.SOLID_COLOR, button.textColor, 1);
    var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, button.buttonColor);
    button.onDraw = function () {
        var h = this.size.height;
        var w = this.size.width;
        g.ellipsePath(0, 0, h, h);
        g.ellipsePath(w - h, 0, h, h);
        g.rectPath(h / 2, 0, w - h, h);
        g.fillPath(fillBrush);
        var textLinesArray = this.text.split("\n");
        var pyInc = 12;
        for (var l = 0; l < textLinesArray.length; l++) {
            var textSize = g.measureString(textLinesArray[l]);
            var px = (w - textSize.width) / 2;
            var py = l == 0 ? (-(textLinesArray.length - 1) / 2) * pyInc : (py += pyInc);
            if (typeof appV !== "undefined" && appV > 24 && l == 0) py += 8;
            g.drawString(textLinesArray[l], textPen, px, py);
        }
    };
}


function drawRoundedRect(g, brush, width, height, radius, x, y) {
    g.newPath();
    g.ellipsePath(x, y, radius, radius);
    g.fillPath(brush);
    g.ellipsePath(width - x - radius, y, radius, radius);
    g.fillPath(brush);
    g.ellipsePath(width - x - radius, height - y - radius, radius, radius);
    g.fillPath(brush);
    g.ellipsePath(x, height - y - radius, radius, radius);
    g.fillPath(brush);
    g.newPath();
    var coords = [x, y + radius / 2, x + radius / 2, y, width - x - radius / 2, y, width - x, y + radius / 2, width - x, height - y - radius / 2, width - x - radius / 2, height - y, x + radius / 2, height - y, x, height - y - radius / 2];
    for (var i = 0; i <= coords.length - 1; i += 2) {
        if (i == 0) { g.moveTo(coords[i], coords[i + 1]); } 
        else { g.lineTo(coords[i], coords[i + 1]); }
    }
    g.fillPath(brush);
}


// ============================================
// FUNÇÕES AUXILIARES
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

function changeIcon(imageIndex, imagesGrp) {
    for (var i = 0; i < imagesGrp.children.length; i++) {
        imagesGrp.children[i].visible = i == imageIndex;
    }
}

function populateMainIcons(imagesGrp, prodArray, dropdownList) {
    while (imagesGrp.children.length > 0) {
        imagesGrp.remove(imagesGrp.children[0]);
    }
    if (!prodArray || prodArray.length === 0) return;
    for (var i = 0; i < prodArray.length; i++) {
        var newIcon = imagesGrp.add("image", undefined, undefined);
        try {
            newIcon.image = eval(prodArray[i].icon);
        } catch (err) {}
        newIcon.helpTip = prodArray[i].name + "\n\n" + D9T_Theme.text.doubleClick + " para editar a lista de produções";
        newIcon.preferredSize = [24, 24];
        newIcon.visible = i == 0;
        newIcon.addEventListener("click", function (c) {
            if (c.detail == 2) {
                if (typeof d9ProdFoldersDialog === 'function') {
                    d9ProdFoldersDialog(D9T_prodArray);
                    loadProductionData();
                    if (dropdownList) {
                        dropdownList.removeAll();
                        if (typeof populateDropdownList === 'function' && typeof getProdNames === 'function') {
                            populateDropdownList(getProdNames(D9T_prodArray), dropdownList);
                        }
                        dropdownList.selection = 0;
                        if (dropdownList.onChange) dropdownList.onChange();
                    }
                    populateMainIcons(imagesGrp, D9T_prodArray, dropdownList);
                    imagesGrp.layout.layout(true);
                }
            }
        });
    }
}