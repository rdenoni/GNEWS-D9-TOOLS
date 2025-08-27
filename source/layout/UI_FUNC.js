/*

---------------------------------------------------------------
> 📟 ui and layout
---------------------------------------------------------------

*/

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

function D9T_UI_EVENTS(uiObj) {
  function D9T_RUN_SCRIPT(scriptFileName) {
    try {
      var scriptPath = scriptMainPath + "source/SCRIPTS/" + scriptFileName;
      var scriptFile = new File(scriptPath);

      if (scriptFile.exists) {
        scriptFile.open("r");
        var scriptContent = scriptFile.read();
        scriptFile.close();
        eval(scriptContent);
      } else {
        alert(
          'Erro: O script "' +
            scriptFileName +
            '" não foi encontrado no caminho:\n' +
            scriptPath
        );
      }
    } catch (err) {
      alert(
        'Erro ao executar o script "' + scriptFileName + '":\n' + err.message
      );
    }
  }

  uiObj.buscar.leftClick.onClick = function () {
    findDialog();
  };

  uiObj.buscar.rightClick.onClick = function () {
    D9TFindProjectDialog();
  };

  uiObj.templates.leftClick.onClick = function () {
    if (!netAccess()) {
      alert(lol + "#D9T_003 - sem acesso a rede...");
      return;
    }
    d9TemplateDialog();
  };

  uiObj.link.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_CopyLinks.jsx");
  };

  uiObj.mailMaker.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_MailMaker.jsx");
  };

  uiObj.layerOrganizer.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_Layers.jsx");
  };

  uiObj.layerOrganizer.rightClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS LayerToLasy_config_ui.jsx");
  };

  uiObj.icons4U.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_Library.jsx");
  };

  uiObj.icons4U.rightClick.onClick = function () {
    D9T_RUN_SCRIPT("LibraryLive_config_ui.jsx");
  };

  uiObj.renCompSave.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_Renamer.jsx");
  };

  uiObj.killBoxText.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_TextBox.jsx");
  };

  uiObj.cropComp.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_CropComp.jsx");
  };

  uiObj.centerAnchor.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_AnchorAlign.jsx");
  };

  uiObj.NormalizeMyLife.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_Normalize.jsx");
  };

  uiObj.colorChange.leftClick.onClick = function () {
    D9T_RUN_SCRIPT("GNEWS_Colors.jsx");
  };
}

function changeIcon(imageIndex, imagesGrp) {
  for (var i = 0; i < imagesGrp.children.length; i++) {
    imagesGrp.children[i].visible = i == imageIndex;
  }
}
// --- FUNÇÃO CORRIGIDA ---
function populateMainIcons(imagesGrp, dropdownList) { // Aceita o dropdown como parâmetro
  while (imagesGrp.children.length > 0) {
    imagesGrp.remove(imagesGrp.children[0]);
  }
  for (var i = 0; i < D9T_prodArray.length; i++) {
    var newIcon = imagesGrp.add("image", undefined, undefined);
    try {
      newIcon.image = eval(D9T_prodArray[i].icon);
    } catch (err) {
      newIcon.image = defaultProductionDataObj.PRODUCTIONS[0].icon;
    }
    newIcon.helpTip =
      D9T_prodArray[0].name +
      "\n\n" +
      dClick +
      " para editar a lista de produções";
    newIcon.preferredSize = [24, 24];
    newIcon.visible = i == 0;
    
    // Evento de duplo-clique CORRIGIDO
    newIcon.addEventListener("click", function (c) {
      if (c.detail == 2) {
        d9ProdFoldersDialog(D9T_prodArray);
        
        // Atualiza a lista de produções a partir do arquivo
        D9T_prodArray = updateProdData(configFile);
        
        // Se um dropdown foi passado, atualiza-o
        if (dropdownList) {
            dropdownList.removeAll();
            populateDropdownList(getProdNames(D9T_prodArray), dropdownList);
            dropdownList.selection = 0;
            // Dispara o evento onChange manualmente para recarregar a árvore de templates
            dropdownList.onChange(); 
        }

        // Repopula os ícones
        populateMainIcons(imagesGrp, dropdownList);
        imagesGrp.layout.layout(true);
      }
    });
  }
}

function themeDivider(sectionGrp) {
  var newDiv = sectionGrp.add("customButton", [0, 0, 1, 1]);
  setUiCtrlColor(newDiv, divColor1);
  newDiv.onDraw = customDraw;
  return newDiv;
}
function themeIconButton(sectionGrp, ctrlProperties) {
  var newUiCtrlObj = {};
  var tipTxt = ctrlProperties.tips.join("\n\n");
  if (ctrlProperties.icon.hover == undefined)
    ctrlProperties.icon.hover = ctrlProperties.icon.normal;
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
  var tipTxt =
    ctrlProperties.labelTxt + ":\n\n" + ctrlProperties.tips.join("\n\n");
  if (ctrlProperties.icon.hover == undefined)
    ctrlProperties.icon.hover = ctrlProperties.icon.normal;
  newBtn.btnGroup = sectionGrp.add("group");
  newBtn.iconGroup = newBtn.btnGroup.add("group");
  newBtn.iconGroup.orientation = "stack";
  newBtn.leftClick = newBtn.iconGroup.add("button", undefined, "");
  newBtn.leftClick.size = [0, 0];
  newBtn.leftClick.visible = false;
  newBtn.rightClick = newBtn.iconGroup.add("button", undefined, "");
  newBtn.rightClick.size = [0, 0];
  newBtn.rightClick.visible = false;
  newBtn.hoverImg = newBtn.iconGroup.add(
    "image",
    undefined,
    ctrlProperties.icon.hover
  );
  newBtn.hoverImg.helpTip = tipTxt;
  newBtn.hoverImg.visible = false;
  newBtn.normalImg = newBtn.iconGroup.add(
    "image",
    undefined,
    ctrlProperties.icon.normal
  );
  newBtn.normalImg.helpTip = tipTxt;
  newBtn.label = newBtn.btnGroup.add(
    "statictext",
    undefined,
    ctrlProperties.labelTxt,
    { truncate: "end" }
  );
  newBtn.label.maximumSize = [60, 18];
  newBtn.label.helpTip = tipTxt;
  setFgColor(newBtn.label, normalColor1);
  newBtn.btnGroup.addEventListener("mouseover", function () {
    setFgColor(this.children[1], highlightColor1);
    this.children[0].children[3].visible = false;
    this.children[0].children[2].visible = true;
  });
  newBtn.btnGroup.addEventListener("mouseout", function () {
    setFgColor(this.children[1], normalColor1);
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

// --- BOTÃO TEMA 1 "THEME BUTTON" FUNDO PRETO HOVER VERMELHO --- //
function themeButton(sectionGrp, ctrlProperties) {
  try {
    if (ctrlProperties.buttonColor === undefined)
      ctrlProperties.buttonColor = divColor1;
    if (ctrlProperties.textColor === undefined)
      ctrlProperties.textColor = normalColor1;
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
      this.textColor = [1, 1, 1, 1];
      this.buttonColor = hexToRgb(highlightColor1);
      drawThemeButton(this);
    });
    newUiCtrlObj.label.addEventListener("mouseout", function () {
      this.textColor = hexToRgb(ctrlProperties.textColor);
      this.buttonColor = hexToRgb(ctrlProperties.buttonColor);
      drawThemeButton(this);
    });
    newUiCtrlObj.label.onClick = function () {
      this.parent.children[0].notify();
    };
    newUiCtrlObj.label.addEventListener("click", function (c) {
      if (c.button == 2) this.parent.children[1].notify();
    });
    return newUiCtrlObj;
  } catch (err) {
    alert(err.message);
  }
}
function drawThemeButton(button) {
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
      var py =
        l == 0 ? (-(textLinesArray.length - 1) / 2) * pyInc : (py += pyInc);
      if (appV > 24 && l == 0) py += 8;
      g.drawString(textLinesArray[l], textPen, px, py);
    }
  };
}

// --- BOTÃO TEMA 2 "THEME ALT BUTTON" FUNDO VERMELHO HOVER VERMELHO --- //

function themeAltButton(sectionGrp, ctrlProperties) {
  try {
    // Cores padrão se não especificadas
    var defaultButtonColor = ctrlProperties.buttonColor || divColor1;
    var defaultTextColor = ctrlProperties.textColor || normalColor1;
    var hoverButtonColor = ctrlProperties.hoverButtonColor || monoColor0; // F2F2F2
    var hoverTextColor = ctrlProperties.hoverTextColor || monoColor3; // 19191aff

    var newUiCtrlObj = {};
    var tipTxt = ctrlProperties.tips ? ctrlProperties.tips.join("\n\n") : "";

    var newBtnGrp = sectionGrp.add("group");
    newBtnGrp.orientation = "stack";

    // Botões invisíveis para capturar cliques
    newUiCtrlObj.leftClick = newBtnGrp.add("button", undefined, "");
    newUiCtrlObj.leftClick.size = [0, 0];
    newUiCtrlObj.leftClick.visible = false;

    newUiCtrlObj.rightClick = newBtnGrp.add("button", undefined, "");
    newUiCtrlObj.rightClick.size = [0, 0];
    newUiCtrlObj.rightClick.visible = false;

    // Botão customizado principal
    newUiCtrlObj.label = newBtnGrp.add("customButton");

    // CORREÇÃO: Define a largura corretamente
    var buttonWidth = ctrlProperties.width || 120;
    var buttonHeight = ctrlProperties.height || 32;
    newUiCtrlObj.label.size = [buttonWidth, buttonHeight];
    newUiCtrlObj.label.preferredSize = [buttonWidth, buttonHeight];
    newUiCtrlObj.label.minimumSize = [buttonWidth, buttonHeight];
    newUiCtrlObj.label.maximumSize = [buttonWidth, buttonHeight];

    newUiCtrlObj.label.text = ctrlProperties.labelTxt || "Botão";
    newUiCtrlObj.label.helpTip = tipTxt;

    // Propriedades de cor
    newUiCtrlObj.label.buttonColor = hexToRgb(defaultButtonColor);
    newUiCtrlObj.label.textColor = hexToRgb(defaultTextColor);
    newUiCtrlObj.label.hoverButtonColor = hexToRgb(hoverButtonColor);
    newUiCtrlObj.label.hoverTextColor = hexToRgb(hoverTextColor);
    newUiCtrlObj.label.isHovered = false;

    // Função de desenho
    newUiCtrlObj.label.onDraw = function () {
      var g = this.graphics;
      var w = this.size.width;
      var h = this.size.height;

      // Determina as cores baseado no estado hover
      var currentButtonColor = this.isHovered
        ? this.hoverButtonColor
        : this.buttonColor;
      var currentTextColor = this.isHovered
        ? this.hoverTextColor
        : this.textColor;

      // Cria os pincéis
      var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, currentButtonColor);
      var textPen = g.newPen(g.PenType.SOLID_COLOR, currentTextColor, 1);

      // Desenha o botão com bordas arredondadas
      g.ellipsePath(0, 0, h, h);
      g.ellipsePath(w - h, 0, h, h);
      g.rectPath(h / 2, 0, w - h, h);
      g.fillPath(fillBrush);

      // Desenha o texto centralizado
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

    // CORREÇÃO: Eventos de mouse funcionais
    newUiCtrlObj.label.addEventListener("mouseover", function () {
      this.isHovered = true;
      this.notify("onDraw");
    });

    newUiCtrlObj.label.addEventListener("mouseout", function () {
      this.isHovered = false;
      this.notify("onDraw");
    });

    // Eventos de clique
    newUiCtrlObj.label.onClick = function () {
      this.parent.children[0].notify();
    };

    newUiCtrlObj.label.addEventListener("click", function (c) {
      if (c.button == 2) this.parent.children[1].notify();
    });

    return newUiCtrlObj;
  } catch (err) {
    alert("Erro no themeAltButton: " + err.message);
    return null;
  }
}

/**
 * FUNÇÃO DE DESENHO: drawThemeAltButton
 * @param {Object} button O objeto 'customButton' a ser desenhado.
 */
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
      var py =
        l == 0 ? (-(textLinesArray.length - 1) / 2) * pyInc : (py += pyInc);
      if (typeof appV !== "undefined" && appV > 24 && l == 0) py += 8;
      g.drawString(textLinesArray[l], textPen, px, py);
    }
  };
}

function customDraw() {
  with (this) {
    graphics.drawOSControl();
    graphics.rectPath(0, 0, size[0], size[1]);
    graphics.fillPath(fillBrush);
  }
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
  var coords = [
    x,
    y + radius / 2,
    x + radius / 2,
    y,
    width - x - radius / 2,
    y,
    width - x,
    y + radius / 2,
    width - x,
    height - y - radius / 2,
    width - x - radius / 2,
    height - y,
    x + radius / 2,
    height - y,
    x,
    height - y - radius / 2,
  ];
  for (var i = 0; i <= coords.length - 1; i += 2) {
    if (i == 0) {
      g.moveTo(coords[i], coords[i + 1]);
    } else {
      g.lineTo(coords[i], coords[i + 1]);
    }
  }
  g.fillPath(brush);
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
function setCtrlHighlight(ctrl, normalColor1, highlightColor1) {
  setFgColor(ctrl, normalColor1);
  ctrl.addEventListener("mouseover", function () {
    setFgColor(ctrl, highlightColor1);
  });
  ctrl.addEventListener("mouseout", function () {
    setFgColor(ctrl, normalColor1);
  });
}