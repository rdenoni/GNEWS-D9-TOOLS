/*
---------------------------------------------------------------
> main_ui_functions.js - Interface e Layout Completo
> Versao: 3.0 - Logica responsiva aprimorada
> Data: 2025
---------------------------------------------------------------
*/

// ============================================
// MOTOR DE TEMA - MAPEAMENTO DE VARI??VEIS GLOBAIS
// ============================================

var D9T_COLOR_FALLBACKS = {
  bgColor1: '#161616FF',
  bgColor2: '#1B1B1BFF',
  divColor1: '#1D1D1FFF',
  divColor2: '#080808FF',
  monoColor0: '#F2F2F2FF',
  monoColor1: '#C7C8CAFF',
  monoColor2: '#302B2BFF',
  monoColor3: '#1A1919FF',
  normalColor1: '#FFFFFFFF',
  normalColor2: '#E6E6E6FF',
  highlightColor1: '#FF0046FF'
};

function D9T_SAFE_COLOR(name) {
  if (typeof this[name] !== 'undefined') { return this[name]; }
  return D9T_COLOR_FALLBACKS[name];
}

if (typeof bgColor1 === 'undefined') { this.bgColor1 = D9T_COLOR_FALLBACKS.bgColor1; }
if (typeof bgColor2 === 'undefined') { this.bgColor2 = D9T_COLOR_FALLBACKS.bgColor2; }
if (typeof divColor1 === 'undefined') { this.divColor1 = D9T_COLOR_FALLBACKS.divColor1; }
if (typeof divColor2 === 'undefined') { this.divColor2 = D9T_COLOR_FALLBACKS.divColor2; }
if (typeof monoColor0 === 'undefined') { this.monoColor0 = D9T_COLOR_FALLBACKS.monoColor0; }
if (typeof monoColor1 === 'undefined') { this.monoColor1 = D9T_COLOR_FALLBACKS.monoColor1; }
if (typeof monoColor2 === 'undefined') { this.monoColor2 = D9T_COLOR_FALLBACKS.monoColor2; }
if (typeof monoColor3 === 'undefined') { this.monoColor3 = D9T_COLOR_FALLBACKS.monoColor3; }
if (typeof normalColor1 === 'undefined') { this.normalColor1 = D9T_COLOR_FALLBACKS.normalColor1; }
if (typeof normalColor2 === 'undefined') { this.normalColor2 = D9T_COLOR_FALLBACKS.normalColor2; }
if (typeof highlightColor1 === 'undefined') { this.highlightColor1 = D9T_COLOR_FALLBACKS.highlightColor1; }

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
    compactModeHeight: 80,              // Altura para ativar o modo compacto
    searchModeHeight: 44,               // Altura limite para o modo busca
    iconOnlySpacing: 18,                // Espacamento quando os labels estao ocultos
    showLabels: true                    // Controla a exibicao dos textos nos modulos
  },
  // Texto e Strings
  text: {
    lineBreak: lol,
    click: lClick,
    rightClick: rClick,
    doubleClick: dClick
  }
};

try { ScriptUI.toolTipDelay = 4000; } catch (toolTipErr) {}

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
  D9T_ENSURE_BASE_CONFIG_FILES();
}

function loadProductionData() {
  try {
    var configFile = new File(scriptMainPath + '/source/config/TEMPLATES_config.json');
    if (configFile.exists) {
      configFile.open('r');
      var content = configFile.read();
      configFile.close();
      var data = JSON.parse(content);
      D9T_prodArray = data.PRODUCTIONS || [];
    } else {
      D9T_prodArray = [{ name: "GNEWS", paths: ["T:/JORNALISMO/GLOBONEWS/TEMPLATES"], icon: "GNEWS_ICON" }];
    }
  } catch (e) {
    D9T_prodArray = [{ name: "GNEWS", paths: ["T:/JORNALISMO/GLOBONEWS/TEMPLATES"], icon: "GNEWS_ICON" }];
  }
}

function D9T_ENSURE_BASE_CONFIG_FILES() {
  function ensureJsonFile(targetPath, defaultObj) {
    try {
      var file = new File(targetPath);
      if (file.exists) { return; }
      var parentFolder = file.parent;
      if (parentFolder && !parentFolder.exists) { parentFolder.create(); }
      file.encoding = "UTF-8";
      if (file.open('w')) {
        try {
          file.write(JSON.stringify(defaultObj, null, 2));
        } catch (jsonErr) {
          file.write('{}');
        }
        file.close();
      }
    } catch (writeErr) {
      $.writeln(lol + "#CONFIG_INIT - Falha ao criar " + targetPath + ": " + writeErr.message);
    }
  }

  var defaultUserPrefs = (typeof defaultScriptPreferencesObj !== 'undefined')
    ? JSON.parse(JSON.stringify(defaultScriptPreferencesObj))
    : {
        color: {},
        labels: [],
        folders: { projPath: '~/Desktop' },
        uiSettings: { iconSize: [36, 36], iconSpacing: 20, labelSpacing: 8, compactIconSize: [28, 28], compactIconSpacing: 12, showLabels: true, iconOnlySpacing: 18 },
        selection: { nullType: 0, adjType: 0, projectMode: 0 },
        ignoreMissing: true,
        devMode: false,
        homeOffice: false,
        iconTheme: 'dark',
        themeColors: {
          bgColor1: '#161616FF',
          bgColor2: '#1B1B1BFF',
          divColor1: '#1D1D1FFF',
          monoColor0: '#F2F2F2FF',
          monoColor1: '#C7C8CAFF',
          monoColor2: '#302B2BFF',
          monoColor3: '#1A1919FF',
          normalColor1: '#FFFFFFFF',
          normalColor2: '#E6E6E6FF',
          highlightColor1: '#FF0046FF'
        }
      };

  var defaultSystemSettings = {
    COPYLINKS_Settings: {
      configuracao: {
        layout_grupos: {},
        layout_geral: {
          name_btn_width: 580,
          text_width_normal: 520,
          btn_width: 0,
          name_btn_height: 42,
          text_width_catalogos: 580,
          bottom_row_height: 24
        }
      }
    },
    TEMPLATES_Settings: {
      PRODUCTIONS: [],
      gnews_templates: { lastProductionIndex: 0 }
    },
    LIBRARYLIVE_Settings: {
      icon_root_paths: [],
      image_root_paths: [],
      tool_settings: {}
    }
  };

  var defaultDadosConfig = {
    ARTES_GNEWS: { arte: [] },
    PROGRAMACAO_GNEWS: { programacao: [] },
    EQUIPE_GNEWS: { equipe: [] },
    CAMINHOS_REDE: { caminhos: [] },
    COPYLINKS: { grupos: [] }
  };

  var userPrefsPath = scriptPreferencesPath + '/User_Preferences.json';
  var systemSettingsPath = scriptPreferencesPath + '/System_Settings.json';
  var dadosConfigUserPath = scriptPreferencesPath + '/Dados_Config.json';
  var dadosConfigMainPath = scriptMainPath + '/Dados_Config.json';

  ensureJsonFile(userPrefsPath, defaultUserPrefs);
  ensureJsonFile(systemSettingsPath, defaultSystemSettings);
  ensureJsonFile(dadosConfigUserPath, defaultDadosConfig);
  if (dadosConfigMainPath !== dadosConfigUserPath) {
    ensureJsonFile(dadosConfigMainPath, defaultDadosConfig);
  }
}

initializeGlobalVariables();


// ============================================
// CONSTRUÇÃO DA INTERFACE
// ============================================

function D9T_BUILD_UI(structureObj, uiObj) {
  if (typeof loadScriptPreferences === "function" && !scriptPreferencesObj.__uiLoaded) {
    loadScriptPreferences();
    scriptPreferencesObj.__uiLoaded = true;
  }
  D9T_REFRESH_THEME_COLORS();
  D9T_APPLY_ICON_SETTINGS(D9T_GET_ICON_SETTINGS(), { refresh: false, deferLayout: true });

  if (uiObj.window) {
    D9T_LOCK_WINDOW_RESIZE(uiObj.window);
  }

  uiObj.window.margins = 4;
  uiObj.window.orientation = "stack";
  uiObj.headerGrp = uiObj.window.add("group");
  uiObj.headerGrp.orientation = "row";
  uiObj.headerGrp.alignment = ["fill", "top"];
  uiObj.headerGrp.alignChildren = ["left", "center"];
  uiObj.headerGrp.spacing = 8;
  uiObj.headerGrp.margins = [10, 6, 10, 4];
  uiObj.infoGrp = uiObj.headerGrp.add("group");
  uiObj.infoGrp.alignment = ["left", "center"];
  uiObj.infoGrp.spacing = 6;
  uiObj.mainLogo = uiObj.infoGrp.add("image", undefined, LOGO_IMG.light);
  uiObj.mainLogo.maximumSize = [70, 24];
  uiObj.mainLogo.minimumSize = [50, 24];
  uiObj.mainLogo.helpTip = [scriptName, scriptVersion, "| D9"].join(" ");
  uiObj.vLab = uiObj.infoGrp.add("statictext", undefined, scriptVersion, {
    truncate: "end",
  });
  uiObj.vLab.justify = "center";
  uiObj.vLab.helpTip = "ajuda | DOCS";
  uiObj.headerSpacer = uiObj.headerGrp.add("group");
  uiObj.headerSpacer.alignment = ["fill", "center"];
  uiObj.menuBtnGrp = uiObj.headerGrp.add("group");
  uiObj.menuBtnGrp.alignment = ["right", "center"];
  uiObj.menuBtnGrp.margins = [0, 0, 8, 0];
  uiObj.hamburgerBtn = uiObj.menuBtnGrp.add("button", undefined, "\u2630");
  uiObj.hamburgerBtn.preferredSize = [32, 24];
  uiObj.hamburgerBtn.helpTip = "Ações e configurações";
  uiObj.hamburgerBtn.onClick = function () { D9T_SHOW_ACTION_MENU(uiObj); };
  uiObj.mainGrp = uiObj.window.add("group");
  uiObj.mainGrp.alignment = ["fill", "top"];
  uiObj.mainGrp.alignChildren = ["center", "top"];
  uiObj.mainGrp.spacing = 12;
  uiObj.sectionGrpArray.push(uiObj.mainGrp);
  uiObj.pinGrp = uiObj.window.add("group");
  uiObj.pinGrp.alignment = ["fill", "top"];
  uiObj.pinGrp.alignChildren = ["center", "top"];
  uiObj.pinGrp.spacing = 16;
  uiObj.sectionGrpArray.push(uiObj.pinGrp);
  uiObj.moduleIndex = [];
  uiObj.searchGrp = uiObj.window.add("group");
  uiObj.searchGrp.orientation = "row";
  uiObj.searchGrp.alignment = ["center", "top"];
  uiObj.searchGrp.alignChildren = ["center", "center"];
  uiObj.searchGrp.spacing = 6;
  uiObj.searchGrp.margins = [8, 4, 8, 4];
  uiObj.searchGrp.visible = false;
  uiObj.searchIcon = null;
  try {
    if (typeof D9T_FINDER_ICON !== "undefined") {
      uiObj.searchIcon = uiObj.searchGrp.add("image", undefined, D9T_FINDER_ICON);
      uiObj.searchIcon.preferredSize = [18, 18];
    }
  } catch (iconErr) {}
  if (!uiObj.searchIcon) {
    uiObj.searchIcon = uiObj.searchGrp.add("statictext", undefined, "[?]");
    setFgColor(uiObj.searchIcon, D9T_Theme.colors.textNormal);
  }
  uiObj.searchLabel = uiObj.searchGrp.add("statictext", undefined, "BUSCAR:");
  uiObj.searchLabel.helpTip = "Filtra modulos por nome, descricao ou palavra-chave.";
  setFgColor(uiObj.searchLabel, D9T_Theme.colors.textNormal);
  uiObj.searchField = uiObj.searchGrp.add("edittext", undefined, "");
  uiObj.searchField.characters = 16;
  uiObj.searchField.preferredSize = [200, 22];
  uiObj.searchField.helpTip = "Digite para localizar modulos rapidamente.";
  uiObj.searchDropdown = uiObj.searchGrp.add("dropdownlist", undefined, []);
  uiObj.searchDropdown.preferredSize = [170, 22];
  uiObj.searchDropdown.helpTip = "Lista de modulos compativeis com o termo digitado.";
  uiObj.searchButton = uiObj.searchGrp.add("button", undefined, "OK");
  uiObj.searchButton.preferredSize = [40, 22];
  uiObj.searchButton.helpTip = "Executa o modulo selecionado ou a busca ativa";
  
  uiObj.iconBtnMainGrp = uiObj.pinGrp.add("group");
  uiObj.iconBtnMainGrp.alignment = ["center", "top"];
  uiObj.iconBtnMainGrp.alignChildren = ["center", "top"];
  uiObj.iconBtnMainGrp.spacing = 12;
  uiObj.iconBtnGrp0 = uiObj.iconBtnMainGrp.add("group");
  uiObj.iconBtnGrp0.alignment = ["center", "top"];
  uiObj.iconBtnGrp0.alignChildren = ["center", "top"];
  uiObj.sectionGrpArray.push(uiObj.iconBtnGrp0);
  uiObj.iconBtnGrp1 = uiObj.iconBtnMainGrp.add("group");
  uiObj.iconBtnGrp1.alignment = ["center", "top"];
  uiObj.iconBtnGrp1.alignChildren = ["center", "top"];
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
        D9T_REGISTER_MODULE(uiObj, pinCtrl, pinCtrlProperties, pinSec);
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
        D9T_REGISTER_MODULE(uiObj, ctrl, ctrlProperties, sec);
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
  D9T_SETUP_SEARCH(uiObj);
  D9T_APPLY_THEME_TO_ROOT(uiObj);
}

function D9T_APPLY_THEME_TO_ROOT(uiObj) {
  uiObj = uiObj || D9T_ui;
  if (!uiObj || !uiObj.window) { return; }
  try { setBgColor(uiObj.window, bgColor1); } catch (e) {}
  if (uiObj.headerGrp) {
    try { setBgColor(uiObj.headerGrp, bgColor2); } catch (headerErr) {}
  }
  if (uiObj.searchGrp) {
    try { setBgColor(uiObj.searchGrp, bgColor2); } catch (searchErr) {}
  }
  if (uiObj.searchLabel) { setFgColor(uiObj.searchLabel, D9T_Theme.colors.textNormal); }
  if (uiObj.vLab) { setFgColor(uiObj.vLab, D9T_Theme.colors.textNormal); }
}


function D9T_LAYOUT(uiObj) {
  var isRow = uiObj.window.size.width > uiObj.window.size.height;
  var grpOrientation = isRow ? "row" : "column";
  var btnOrientation = isRow ? "column" : "row";
  var iconOrientation = uiObj.window.size.width < 70 ? "column" : "row";
  var searchModeHeight = (typeof D9T_Theme.layout.searchModeHeight === "number") ? D9T_Theme.layout.searchModeHeight : 44;
  var useSearchMode = uiObj.window.size.height <= searchModeHeight;
  var normalSpacing = D9T_Theme.layout.iconSpacingNormal || 20;
  var compactSpacing = D9T_Theme.layout.iconSpacingCompact || Math.max(4, Math.round(normalSpacing * 0.6));
  var compactModeWidth = D9T_Theme.layout.compactModeWidth || 950;
  var compactModeHeight = D9T_Theme.layout.compactModeHeight || 80;
  var useCompactMode = !useSearchMode && (uiObj.window.size.width <= compactModeWidth || uiObj.window.size.height <= compactModeHeight);
  var activeSpacing = useCompactMode ? compactSpacing : normalSpacing;
  var labelSpacing = (typeof D9T_Theme.layout.labelSpacing === "number") ? D9T_Theme.layout.labelSpacing : 8;
  var showLabelsPref = D9T_Theme.layout.showLabels !== false;
  var iconOnlySpacingValue = (typeof D9T_Theme.layout.iconOnlySpacing === "number") ? D9T_Theme.layout.iconOnlySpacing : Math.max(4, Math.round(normalSpacing * 0.7));
  var manualIconOnly = !useSearchMode && !useCompactMode && !showLabelsPref;
  var labelsVisible = !useSearchMode && !useCompactMode && showLabelsPref;
  var spacingBaseline = manualIconOnly ? iconOnlySpacingValue : activeSpacing;
  var normalIconSize = D9T_Theme.layout.iconSize || [32, 32];
  var compactIconSize = D9T_Theme.layout.iconSizeCompact || normalIconSize;
  var activeIconSize = useCompactMode ? compactIconSize : normalIconSize;

  if (uiObj.searchGrp) {
    uiObj.searchGrp.visible = useSearchMode;
  }
  if (uiObj.menuBtnGrp) { uiObj.menuBtnGrp.visible = true; }
  if (uiObj.mainGrp) { uiObj.mainGrp.visible = !useSearchMode; }
  if (uiObj.pinGrp) { uiObj.pinGrp.visible = !useSearchMode; }
  if (uiObj.infoGrp) { uiObj.infoGrp.visible = true; }

  if (uiObj.__searchModeActive !== useSearchMode) {
    uiObj.__searchModeActive = useSearchMode;
    if (useSearchMode) {
      D9T_ENTER_SEARCH_MODE(uiObj);
      if (uiObj.searchField) {
        try { uiObj.searchField.active = true; } catch (focusErr) {}
      }
    } else {
      D9T_EXIT_SEARCH_MODE(uiObj);
    }
  }

  var pinGap = 0;
  var infoGap = isRow ? 110 : 56;
  var leftSpacing = Math.max(4, spacingBaseline / 2);
  var rightSpacing = Math.max(4, spacingBaseline / 2);
  try {
    for (var s = 0; s < uiObj.sectionGrpArray.length; s++) {
      var sectionGrp = uiObj.sectionGrpArray[s];
      sectionGrp.orientation = grpOrientation;
      sectionGrp.spacing = useSearchMode ? 8 : Math.max(8, spacingBaseline / 2);
    }
    for (var d = 0; d < uiObj.divArray.length; d++) {
      var div = uiObj.divArray[d];
      div.size = [1, 1];
      div.alignment = isRow ? ["center", "fill"] : ["fill", "center"];
    }
    for (var b = 0; b < uiObj.imageButtonArray.length; b++) {
      var btn = uiObj.imageButtonArray[b];
      if (btn && btn.btnGroup) { btn.btnGroup.alignment = ["center", "top"]; }
      btn.btnGroup.orientation = btnOrientation;
      if (useSearchMode || !labelsVisible) {
        btn.btnGroup.spacing = 0;
      } else {
        btn.btnGroup.spacing = labelSpacing;
      }
      btn.normalImg.size = btn.hoverImg.size = [activeIconSize[0], activeIconSize[1]];
      btn.label.justify = isRow ? "center" : "left";
      if (useSearchMode) {
        btn.hoverImg.size = btn.normalImg.size = [0, 0];
        btn.label.size = btn.label.preferredSize;
        btn.label.visible = true;
      } else if (!labelsVisible) {
        btn.label.visible = false;
        btn.label.size = [0, 0];
      } else {
        btn.label.visible = true;
        btn.label.size = [uiObj.window.size.width - 60, 18];
      }
    }
    if (!useSearchMode && uiObj.mainGrp.visible) {
      uiObj.mainGrp.margins = isRow
      ? [leftSpacing, 0, leftSpacing, 0]
      : [4, pinGap, 4, infoGap];
      uiObj.mainGrp.alignment = ["fill", "top"];
      uiObj.mainGrp.spacing = useCompactMode ? 20 : (labelsVisible ? 16 : Math.max(10, iconOnlySpacingValue));
    }
    if (uiObj.pinGrp) {
      uiObj.pinGrp.alignment = ["center", "top"];
      uiObj.pinGrp.spacing = Math.max(12, spacingBaseline);
    }
    if (uiObj.iconBtnMainGrp) {
      uiObj.iconBtnMainGrp.alignment = ["center", "top"];
      uiObj.iconBtnMainGrp.orientation = iconOrientation;
      uiObj.iconBtnMainGrp.spacing = Math.max(2, spacingBaseline / 3);
    }
    if (uiObj.iconBtnGrp0) uiObj.iconBtnGrp0.spacing = Math.max(2, spacingBaseline / 3);
    if (uiObj.iconBtnGrp1) uiObj.iconBtnGrp1.spacing = Math.max(2, spacingBaseline / 3);
    if (uiObj.headerGrp) {
      uiObj.headerGrp.alignment = ["fill", "top"];
      uiObj.headerGrp.orientation = "row";
    }
    if (uiObj.infoGrp) {
      uiObj.infoGrp.alignment = ["left", "center"];
      uiObj.infoGrp.spacing = 6;
    }
    if (uiObj.menuBtnGrp) {
      uiObj.menuBtnGrp.alignment = ["right", "center"];
    }
  } catch (err) {
    $.writeln(lol + "#D9T_LAYOUT - " + "" + err.message);
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
        $.writeln(errorMsg);
      }
    }
  
    if (uiObj.templates) {
      if (uiObj.templates.leftClick) uiObj.templates.leftClick.onClick = function () { safeExecute('d9TemplateDialog', d9TemplateDialog); };
      if (uiObj.templates.rightClick) uiObj.templates.rightClick.onClick = function () { safeExecute('d9ProdFoldersDialog', d9ProdFoldersDialog); };
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
    var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
    if (ctrlProperties.icon.hover == undefined) ctrlProperties.icon.hover = ctrlProperties.icon.normal;
    var btnGroup = sectionGrp.add("group");
    btnGroup.helpTip = tipTxt;
    var iconGroup = btnGroup.add("group");
    iconGroup.helpTip = tipTxt;
    iconGroup.orientation = "stack";
    newUiCtrlObj.leftClick = iconGroup.add("button", undefined, "");
    newUiCtrlObj.leftClick.size = [0, 0];
    newUiCtrlObj.leftClick.visible = false;
    newUiCtrlObj.leftClick.helpTip = tipTxt;
    newUiCtrlObj.rightClick = iconGroup.add("button", undefined, "");
    newUiCtrlObj.rightClick.size = [0, 0];
    newUiCtrlObj.rightClick.visible = false;
    newUiCtrlObj.rightClick.helpTip = tipTxt;
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
    var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
    if (ctrlProperties.icon.hover == undefined) ctrlProperties.icon.hover = ctrlProperties.icon.normal;
    newBtn.btnGroup = sectionGrp.add("group");
    newBtn.btnGroup.helpTip = tipTxt;
    newBtn.iconGroup = newBtn.btnGroup.add("group");
    newBtn.iconGroup.helpTip = tipTxt;
    newBtn.iconGroup.orientation = "stack";
    newBtn.leftClick = newBtn.iconGroup.add("button", undefined, "");
    newBtn.leftClick.size = [0, 0];
    newBtn.leftClick.visible = false;
    newBtn.leftClick.helpTip = tipTxt;
    newBtn.rightClick = newBtn.iconGroup.add("button", undefined, "");
    newBtn.rightClick.size = [0, 0];
    newBtn.rightClick.visible = false;
    newBtn.rightClick.helpTip = tipTxt;
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

function D9T_GET_CTRL_LABEL(ctrlProperties) {
    if (!ctrlProperties) { return ""; }
    if (ctrlProperties.labelTxt) { return ctrlProperties.labelTxt; }
    if (ctrlProperties.key) {
        var friendly = ctrlProperties.key.replace(/_/g, " ");
        if (typeof friendly.toTitleCase === "function") {
            return friendly.toTitleCase();
        }
        return friendly;
    }
    return "";
}

function D9T_NORMALIZE_TIPS(tips) {
    var list = [];
    if (!tips) { return list; }
    var tipArray = Array.isArray(tips) ? tips.slice(0) : [tips];
    for (var i = 0; i < tipArray.length; i++) {
        var entry = tipArray[i];
        if (!entry) { continue; }
        if (typeof entry === "string") {
            var cleaned = entry.replace(/\s+/g, " ").trim();
            if (cleaned) { list.push(cleaned); }
            continue;
        }
        if (typeof entry === "object") {
            var actionKey = "";
            if (entry.action) { actionKey = entry.action.toLowerCase(); }
            else if (entry.type) { actionKey = entry.type.toLowerCase(); }
            var prefix = "";
            if (actionKey === "left" || actionKey === "click" || actionKey === "primary") {
                prefix = (typeof lClick === "string" && lClick.length) ? lClick : "Clique esquerdo";
            } else if (actionKey === "right" || actionKey === "secondary") {
                prefix = (typeof rClick === "string" && rClick.length) ? rClick : "Clique direito";
            } else if (actionKey === "double") {
                prefix = (typeof dClick === "string" && dClick.length) ? dClick : "Duplo clique";
            } else if (actionKey === "hover") {
                prefix = "Passe o mouse";
            } else if (actionKey === "keyboard") {
                prefix = entry.shortcut ? entry.shortcut.toUpperCase() : "Atalho";
            }
            var text = entry.text || entry.label || entry.description || "";
            text = (text || "").toString().trim();
            if (!text && entry.shortcut) {
                text = entry.shortcut;
            }
            if (!text) { continue; }
            var tipLine = prefix ? (prefix + " " + text) : text;
            tipLine = tipLine.replace(/\s+/g, " ").trim();
            if (tipLine) { list.push(tipLine); }
        }
    }
    return list;
}

function D9T_BUILD_TIP_LINES(ctrlProperties) {
    var lines = D9T_NORMALIZE_TIPS(ctrlProperties ? ctrlProperties.tips : null);
    if (!lines.length) {
        var autoLabel = D9T_GET_CTRL_LABEL(ctrlProperties);
        if (autoLabel) { lines.push(autoLabel); }
        var leftMsg = (typeof lClick === "string" && lClick.length) ? lClick : "Clique esquerdo";
        lines.push(leftMsg + " para executar.");
        if (typeof rClick === "string" && rClick.length) {
            lines.push(rClick + " para ver opções adicionais.");
        }
    }
    return lines;
}

function D9T_BUILD_TIP_TEXT(ctrlProperties) {
    var lines = D9T_BUILD_TIP_LINES(ctrlProperties);
    return lines.join("\n\n");
}

function D9T_REGISTER_MODULE(uiObj, ctrlKey, ctrlProperties, sectionKey) {
    if (!uiObj.moduleIndex) { uiObj.moduleIndex = []; }
    var displayName = D9T_GET_CTRL_LABEL(ctrlProperties) || ctrlKey;
    var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
    var sectionText = sectionKey ? sectionKey.replace(/_/g, ' ') : '';
    var description = [tipTxt.replace(/\s+/g, ' '), sectionText].join(' ').trim();
    var searchBlob = (displayName + ' ' + ctrlKey + ' ' + description).toLowerCase();
    uiObj.moduleIndex.push({
        key: ctrlKey,
        keyLower: ctrlKey.toLowerCase(),
        labelLower: displayName.toLowerCase(),
        descriptionLower: description.toLowerCase(),
        searchBlob: searchBlob,
        displayName: displayName,
        ctrlRef: uiObj[ctrlKey]
    });
}

function D9T_NORMALIZE_TERM(value) {
    return (value || "").toString().toLowerCase();
}

function D9T_SETUP_SEARCH(uiObj) {
    if (!uiObj.searchField || !uiObj.searchDropdown) { return; }
    var placeholder = "Buscar modulos...";
    uiObj.searchPlaceholderText = placeholder;
    uiObj.searchField.text = placeholder;
    uiObj.searchField.__placeholder = true;
    setFgColor(uiObj.searchField, D9T_Theme.colors.mono2);

    uiObj.searchField.onActivate = function () {
        if (this.__placeholder) {
            this.text = "";
            this.__placeholder = false;
            setFgColor(this, D9T_Theme.colors.textNormal);
        }
    };

    uiObj.searchField.onChanging = function () {
        if (this.__placeholder) {
            this.__placeholder = false;
            this.text = "";
            setFgColor(this, D9T_Theme.colors.textNormal);
        }
        D9T_UPDATE_SEARCH_RESULTS(uiObj, this.text);
    };

    uiObj.searchField.onDeactivate = function () {
        if (!this.text.length) {
            this.__placeholder = true;
            this.text = placeholder;
            setFgColor(this, D9T_Theme.colors.mono2);
            if (!uiObj.__searchModeActive && uiObj.searchDropdown) {
                uiObj.searchDropdown.removeAll();
            }
        }
    };

    uiObj.searchField.addEventListener("keydown", function (evt) {
        if (evt.keyName === "Enter") {
            D9T_TRIGGER_SEARCH_ACTION(uiObj);
        } else if (evt.keyName === "Down") {
            if (uiObj.searchDropdown.items.length) {
                try { uiObj.searchDropdown.active = true; } catch (focusErr) {}
                uiObj.searchDropdown.selection = 0;
            }
        }
    });

    if (uiObj.searchButton) {
        uiObj.searchButton.onClick = function () {
            if (uiObj.searchDropdown && uiObj.searchDropdown.selection) {
                D9T_LAUNCH_SEARCH_SELECTION(uiObj);
            } else {
                D9T_TRIGGER_SEARCH_ACTION(uiObj);
            }
        };
    }

    uiObj.searchDropdown.addEventListener("keydown", function (evt) {
        if (evt.keyName === "Enter") {
            D9T_LAUNCH_SEARCH_SELECTION(uiObj);
        }
    });
}

function D9T_UPDATE_SEARCH_RESULTS(uiObj, term) {
    if (!uiObj.moduleIndex || !uiObj.searchDropdown) { return; }
    var dropdown = uiObj.searchDropdown;
    dropdown.removeAll();
    var cleanTerm = D9T_NORMALIZE_TERM(term);
    var modules = uiObj.moduleIndex.slice(0);
    var scored = [];
    for (var i = 0; i < modules.length; i++) {
        var entry = modules[i];
        if (!entry) { continue; }
        var score = 5;
        if (cleanTerm.length) {
            if (entry.labelLower.indexOf(cleanTerm) === 0) {
                score = 0;
            } else if (entry.labelLower.indexOf(cleanTerm) > -1) {
                score = 1;
            } else if (entry.keyLower.indexOf(cleanTerm) > -1) {
                score = 1.5;
            } else if (entry.descriptionLower && entry.descriptionLower.indexOf(cleanTerm) > -1) {
                score = 2;
            } else if (entry.searchBlob && entry.searchBlob.indexOf(cleanTerm) > -1) {
                score = 2.5;
            } else {
                continue;
            }
        }
        scored.push({ entry: entry, score: score });
    }
    scored.sort(function (a, b) {
        if (a.score !== b.score) { return a.score - b.score; }
        var aName = a.entry.displayName.toLowerCase();
        var bName = b.entry.displayName.toLowerCase();
        if (aName < bName) { return -1; }
        if (aName > bName) { return 1; }
        return 0;
    });

    var maxResults = 12;
    for (var j = 0; j < scored.length && dropdown.items.length < maxResults; j++) {
        var itemEntry = scored[j].entry;
        var item = dropdown.add("item", itemEntry.displayName);
        item.entryRef = itemEntry;
    }
    if (dropdown.items.length) {
        dropdown.selection = 0;
    }
}

function D9T_LAUNCH_SEARCH_SELECTION(uiObj) {
    if (!uiObj.searchDropdown || !uiObj.searchDropdown.items.length) { return; }
    var selection = uiObj.searchDropdown.selection;
    if (!selection) { selection = uiObj.searchDropdown.items[0]; }
    if (selection && selection.entryRef) {
        D9T_EXECUTE_MODULE(selection.entryRef);
    }
}

function D9T_EXECUTE_MODULE(entry) {
    if (!entry || !entry.ctrlRef) { return; }
    try {
        if (entry.ctrlRef.leftClick) {
            entry.ctrlRef.leftClick.notify();
            return;
        }
        if (entry.ctrlRef.rightClick) {
            entry.ctrlRef.rightClick.notify();
        }
    } catch (err) {
        $.writeln("Falha ao executar modulo '" + entry.displayName + "': " + err);
    }
}

function D9T_CLEAR_SEARCH(uiObj, keepDropdown) {
    if (!uiObj || !uiObj.searchField) { return; }
    if (uiObj.searchDropdown && keepDropdown !== true) { uiObj.searchDropdown.removeAll(); }
    if (!uiObj.searchPlaceholderText) { return; }
    uiObj.searchField.__placeholder = true;
    uiObj.searchField.text = uiObj.searchPlaceholderText;
    setFgColor(uiObj.searchField, D9T_Theme.colors.mono2);
}

function D9T_TRIGGER_SEARCH_ACTION(uiObj) {
    if (!uiObj || !uiObj.searchField) { return; }
    D9T_UPDATE_SEARCH_RESULTS(uiObj, uiObj.searchField.__placeholder ? "" : uiObj.searchField.text);
    D9T_LAUNCH_SEARCH_SELECTION(uiObj);
}

function D9T_ENTER_SEARCH_MODE(uiObj) {
    if (!uiObj) { return; }
    if (uiObj.searchField) {
        if (uiObj.searchField.__placeholder) {
            uiObj.searchField.text = "";
            uiObj.searchField.__placeholder = false;
            setFgColor(uiObj.searchField, D9T_Theme.colors.textNormal);
        }
        try { uiObj.searchField.active = true; } catch (e) {}
    }
    D9T_UPDATE_SEARCH_RESULTS(uiObj, "");
}

function D9T_EXIT_SEARCH_MODE(uiObj) {
    if (!uiObj) { return; }
    D9T_CLEAR_SEARCH(uiObj);
}

function D9T_SHOW_ACTION_MENU(uiObj) {
    uiObj = uiObj || D9T_ui;
    var menuWin = new Window("palette", "Configurações");
    menuWin.orientation = "column";
    menuWin.alignChildren = "fill";
    menuWin.margins = 18;
    menuWin.spacing = 10;
    try { setBgColor(menuWin, bgColor1); } catch (e) {}

    var headerGrp = menuWin.add("group");
    headerGrp.alignment = ["fill", "top"];
    headerGrp.alignChildren = ["left", "center"];
    headerGrp.spacing = 8;
    var title = headerGrp.add("statictext", undefined, "Ferramentas e configurações");
    title.justify = "left";
    setFgColor(title, D9T_Theme.colors.textHighlight);
    var headerSpacer = headerGrp.add("group");
    headerSpacer.alignment = ["fill", "center"];
    var helpBtnGrp = headerGrp.add("group");
    helpBtnGrp.alignment = ["right", "center"];
    var helpBtn;
    if (typeof themeIconButton === "function" && typeof D9T_INFO_ICON !== "undefined") {
        try {
            helpBtn = new themeIconButton(helpBtnGrp, { icon: D9T_INFO_ICON, tips: ["Ajuda sobre este painel"] });
        } catch (err0) {}
    }
    if (!helpBtn) {
        helpBtn = helpBtnGrp.add("button", undefined, "?");
        helpBtn.preferredSize = [24, 24];
    }
    var attachHelp = function(btn) {
        if (!btn) { return; }
        var handler = function() {
            D9T_SHOW_ACTION_MENU_HELP();
        };
        if (btn.leftClick) { btn.leftClick.onClick = handler; }
        else { btn.onClick = handler; }
    };
    attachHelp(helpBtn);

    var sections = [
        {
            title: "Ferramentas",
            description: "Configurações para manutenção e layout.",
            column: 0,
            items: [
                { label: "Alterar cores globais", desc: "Abre o painel ColorChange para redefinir o tema.", action: D9T_OPEN_COLOR_GLOBALS },
                { label: "Atualizar script (GitHub)", desc: "Executa git pull no diretório do script.", action: D9T_PULL_FROM_GITHUB },
                { label: "Configurar ícones", desc: "Abre a janela para ajustar tamanho e espaçamentos.", action: function () { D9T_OPEN_ICON_SETTINGS_WINDOW(uiObj); } }
            ]
        },
        {
            title: "Configurações",
            description: "Arquivos principais e ajustes que afetam todo o GND9TOOLS.",
            column: 1,
            items: [
                { label: "Configuração de usuários", desc: "Edita o User_Preferences.json.", action: function () { D9T_OPEN_JSON_CONFIG("User_Preferences.json"); } },
                { label: "Configuração de sistema", desc: "Gerencia System_Settings.json.", action: function () { D9T_OPEN_JSON_CONFIG("System_Settings.json"); } },
                { label: "Biblioteca de dados", desc: "Acessa o Dados_Config.json.", action: function () { D9T_OPEN_JSON_CONFIG("Dados_Config.json"); } }
            ]
        }
    ];

    var bodyGrp = menuWin.add("group");
    bodyGrp.orientation = "row";
    bodyGrp.alignChildren = ["fill", "top"];
    bodyGrp.spacing = 12;
    var colLeft = bodyGrp.add("group");
    colLeft.orientation = "column";
    colLeft.alignChildren = ["fill", "top"];
    colLeft.spacing = 10;
    var colRight = bodyGrp.add("group");
    colRight.orientation = "column";
    colRight.alignChildren = ["fill", "top"];
    colRight.spacing = 10;
    var columns = [colLeft, colRight];

    function createSection(section) {
        var card = columns[Math.min(section.column || 0, columns.length - 1)].add("panel", undefined, section.title.toUpperCase());
        card.alignment = ["fill", "top"];
        card.margins = [12, 18, 12, 12];
        card.spacing = 10;
        try { setBgColor(card, bgColor2); } catch (cardErr) {}
        var desc = card.add("statictext", undefined, section.description || "", { multiline: true });
        desc.maximumSize.width = 240;
        setFgColor(desc, D9T_Theme.colors.textNormal);

        for (var i = 0; i < section.items.length; i++) {
            (function(entry) {
                var entryGrp = card.add("group");
                entryGrp.orientation = "column";
                entryGrp.alignChildren = ["fill", "top"];
                entryGrp.spacing = 4;
                var btn = entryGrp.add("button", undefined, entry.label);
                btn.preferredSize = [260, 26];
                try { setBgColor(btn, D9T_Theme.colors.divider); } catch (bgErr) {}
                setFgColor(btn, D9T_Theme.colors.textNormal);
                if (typeof setCtrlHighlight === "function") {
                    setCtrlHighlight(btn, D9T_Theme.colors.textNormal, D9T_Theme.colors.textHighlight);
                }
                btn.onClick = function () {
                    try { entry.action(uiObj); }
                    catch (err) { alert("Falha ao executar '" + entry.label + "': " + err); }
                };
                if (entry.desc) {
                    var hint = entryGrp.add("statictext", undefined, entry.desc, { multiline: true });
                    hint.maximumSize.width = 260;
                    setFgColor(hint, D9T_Theme.colors.mono2);
                }
            })(section.items[i]);
        }
    }

    for (var s = 0; s < sections.length; s++) {
        createSection(sections[s]);
    }

    var footerGrp = menuWin.add("group");
    footerGrp.alignment = ["fill", "top"];
    var tipTxt = footerGrp.add("statictext", undefined, "Use o ícone ? para consultar a ajuda completa deste menu.");
    setFgColor(tipTxt, D9T_Theme.colors.mono2);

    menuWin.show();
}

function D9T_OPEN_COLOR_GLOBALS() {
    D9T_OPEN_THEME_DIALOG(D9T_ui);
}

function D9T_SHOW_ACTION_MENU_HELP() {
    if (typeof showActionMenuHelp === "function") {
        showActionMenuHelp();
        return;
    }
    if (typeof createHelpWindow !== "function") {
        alert("Ajuda indisponível (createHelpWindow não encontrado).");
        return;
    }
    var fallbackData = [
        {
            tabName: "Configurações",
            topics: [
                { title: "Alterar cores globais", text: "Abre o módulo de alteração de tema (ColorChange)." },
                { title: "Configuração de usuários", text: "Abre User_Preferences.json." },
                { title: "Configuração de sistema", text: "Abre System_Settings.json." },
                { title: "Biblioteca de dados", text: "Abre Dados_Config.json." }
            ]
        },
        {
            tabName: "Ferramentas",
            topics: [
                { title: "Atualizar script (GitHub)", text: "Executa git pull no diretório atual." },
                { title: "Configurar ícones", text: "Abre o painel de ajuste de ícones." }
            ]
        }
    ];
    createHelpWindow(
        "Configurações - Ajuda",
        "Painel de Configurações",
        "Visão geral das ações disponíveis para ajustes globais e manutenção do GND9TOOLS.",
        fallbackData
    );
}


function D9T_OPEN_THEME_DIALOG(uiObj) {
  uiObj = uiObj || D9T_ui;
  var defaults = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.themeColors) ? defaultScriptPreferencesObj.themeColors : {};
  var current = (scriptPreferencesObj && scriptPreferencesObj.themeColors) ? scriptPreferencesObj.themeColors : defaults;
  var colorEntries = [
    { label: "Fundo principal (bgColor1)", key: "bgColor1" },
    { label: "Fundo secundário (bgColor2)", key: "bgColor2" },
    { label: "Divisores (divColor1)", key: "divColor1" },
    { label: "Mono claro (monoColor0)", key: "monoColor0" },
    { label: "Mono texto (monoColor1)", key: "monoColor1" },
    { label: "Mono destaque (monoColor2)", key: "monoColor2" },
    { label: "Mono escuro (monoColor3)", key: "monoColor3" },
    { label: "Texto claro (normalColor1)", key: "normalColor1" },
    { label: "Texto padrão (normalColor2)", key: "normalColor2" },
    { label: "Highlight (highlightColor1)", key: "highlightColor1" }
  ];

  var win = new Window("dialog", "Cores globais");
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

  function setFieldValue(field, value) {
    if (!field) { return; }
    field.text = value || "";
    updateSwatch(field);
  }

  function openColorPicker(baseValue) {
    var parsed = tryParseHex(baseValue) || "#000000";
    var clean = parsed.replace("#", "");
    if (clean.length < 6) {
      clean = ("000000" + clean).slice(-6);
    }
    var rgbPart = clean.substring(0, 6);
    var alphaPart = clean.length === 8 ? clean.substring(6, 8) : "";
    var seed = parseInt(rgbPart, 16);
    if (isNaN(seed)) { seed = 0; }
    var result = $.colorPicker(seed);
    if (result < 0 || isNaN(result)) { return null; }
    var rgbHex = ("000000" + result.toString(16)).slice(-6).toUpperCase();
    return "#" + rgbHex + alphaPart.toUpperCase();
  }

  for (var i = 0; i < colorEntries.length; i++) {
    var entry = colorEntries[i];
    var row = win.add("group");
    row.alignment = ["fill", "top"];
    row.spacing = 6;
    var label = row.add("statictext", undefined, entry.label + ":");
    label.preferredSize = [190, 18];
    label.helpTip = entry.label;
    setFgColor(label, D9T_Theme.colors.textNormal);
    var field = row.add("edittext", undefined, current[entry.key] || defaults[entry.key] || "#000000");
    field.characters = 10;
    field.helpTip = "Informe o valor HEX (#RRGGBB ou #RRGGBBAA).";
    var swatch = row.add("panel");
    swatch.preferredSize = [26, 16];
    swatch.helpTip = "Clique para abrir o seletor de cores.";
    field.__swatch = swatch;
    fieldMap[entry.key] = field;
    (function(refField, refSwatch) {
      var refresh = function () { updateSwatch(refField); };
      refField.onChanging = refresh;
      refField.onChange = refresh;
      refresh();
      var launchPicker = function () {
        var choice = openColorPicker(refField.text);
        if (!choice) { return; }
        refField.text = choice;
        updateSwatch(refField);
        var previewValues = collectValues();
        if (previewValues) {
          applyTheme(previewValues, false);
        }
      };
      refSwatch.addEventListener("click", launchPicker);
    })(field, swatch);
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
    D9T_APPLY_THEME_TO_ROOT(uiObj);
    if (persist && typeof saveScriptPreferences === "function") {
      saveScriptPreferences();
    }
    if (uiObj && uiObj.window) {
      D9T_LAYOUT(uiObj);
    }
  }

  var btnGrp = win.add("group");
  btnGrp.alignment = ["fill", "top"];
  btnGrp.spacing = 8;
  var resetBtn = btnGrp.add("button", undefined, "Resetar");
  var saveBtn = btnGrp.add("button", undefined, "Aplicar");

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

  win.show();
}


function D9T_OPEN_JSON_CONFIG(fileName) {
    var basePaths = [];
    if (typeof scriptPreferencesPath === "string") { basePaths.push(scriptPreferencesPath); }
    if (typeof scriptMainPath !== "undefined") { basePaths.push(scriptMainPath); }
    for (var i = 0; i < basePaths.length; i++) {
        var target = new File(basePaths[i] + "/" + fileName);
        if (target.exists) {
            target.execute();
            return;
        }
    }
    alert("Arquivo nao encontrado em nenhum caminho conhecido:\n" + fileName);
}

function D9T_PULL_FROM_GITHUB() {
    try {
        app.system("cmd /c \"cd \"" + scriptMainPath + "\" && git pull\"");
        alert("Repositorio atualizado (git pull).");
    } catch (err) {
        alert("Falha ao atualizar repositorio: " + err);
    }
}

function D9T_OPEN_ICON_SETTINGS_WINDOW(uiObj) {
    uiObj = uiObj || D9T_ui;
    var current = D9T_GET_ICON_SETTINGS();
    var defaults = D9T_GET_DEFAULT_ICON_SETTINGS();

    var win = new Window("palette", "Configuração de ícones");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.margins = 20;
    win.spacing = 12;
    try { setBgColor(win, bgColor1); } catch (e) {}

    var title = win.add("statictext", undefined, "Tamanho e espaçamento dos módulos");
    setFgColor(title, D9T_Theme.colors.textNormal);

    var sizeGrp = win.add("group");
    sizeGrp.alignment = ["fill", "top"];
    sizeGrp.spacing = 8;
    sizeGrp.add("statictext", undefined, "Largura:").helpTip = "Define a largura do ícone padrão exibido nos módulos.";
    var widthField = sizeGrp.add("edittext", undefined, current.iconSize[0]);
    widthField.characters = 4;
    widthField.helpTip = "Informe a largura (em pixels) dos ícones principais.";
    sizeGrp.add("statictext", undefined, "Altura:").helpTip = "Define a altura do ícone padrão exibido nos módulos.";
    var heightField = sizeGrp.add("edittext", undefined, current.iconSize[1]);
    heightField.characters = 4;
    heightField.helpTip = "Informe a altura (em pixels) dos ícones principais.";

    var iconSpacingGrp = win.add("group");
    iconSpacingGrp.alignment = ["fill", "top"];
    iconSpacingGrp.spacing = 8;
    iconSpacingGrp.add("statictext", undefined, "Espaçamento dos ícones (px):").helpTip = "Controle a distância horizontal/vertical padrão entre os módulos.";
    var iconSpacingField = iconSpacingGrp.add("edittext", undefined, current.iconSpacing);
    iconSpacingField.characters = 4;
    iconSpacingField.helpTip = "Distância, em pixels, entre os ícones em layout normal.";
    var iconSpacingSlider = win.add("slider", undefined, current.iconSpacing, 0, 60);
    iconSpacingSlider.alignment = ["fill", "top"];
    iconSpacingSlider.helpTip = "Arraste para ajustar rapidamente o espaçamento entre ícones.";

    var labelSpacingGrp = win.add("group");
    labelSpacingGrp.alignment = ["fill", "top"];
    labelSpacingGrp.spacing = 8;
    labelSpacingGrp.add("statictext", undefined, "Espaçamento do label (px):").helpTip = "Define a folga entre o ícone e o texto do módulo.";
    var labelSpacingField = labelSpacingGrp.add("edittext", undefined, current.labelSpacing);
    labelSpacingField.characters = 4;
    labelSpacingField.helpTip = "Distância, em pixels, entre ícone e legenda.";
    var labelSpacingSlider = win.add("slider", undefined, current.labelSpacing, 0, 40);
    labelSpacingSlider.alignment = ["fill", "top"];
    labelSpacingSlider.helpTip = "Ajuste visual do respiro entre ícones e labels.";

    var showLabelsGrp = win.add("group");
    showLabelsGrp.alignment = ["fill", "top"];
    showLabelsGrp.alignChildren = ["left", "center"];
    showLabelsGrp.spacing = 6;
    var showLabelsCheckbox = showLabelsGrp.add("checkbox", undefined, "Exibir textos nos módulos");
    showLabelsCheckbox.value = current.showLabels !== false;
    showLabelsCheckbox.helpTip = "Alterna a exibição dos nomes abaixo dos ícones quando houver espaço disponível.";
    try { setFgColor(showLabelsCheckbox, D9T_Theme.colors.textNormal); } catch (fgErr) {}

    var iconOnlySpacingGrp = win.add("group");
    iconOnlySpacingGrp.alignment = ["fill", "top"];
    iconOnlySpacingGrp.spacing = 8;
    iconOnlySpacingGrp.add("statictext", undefined, "Espaçamento só ícones (px):").helpTip = "Define o espaçamento utilizado quando os labels estão ocultos.";
    var iconOnlySpacingField = iconOnlySpacingGrp.add("edittext", undefined, current.iconOnlySpacing);
    iconOnlySpacingField.characters = 4;
    iconOnlySpacingField.helpTip = "Valor em pixels para o layout compacto sem labels.";
    var iconOnlySpacingSlider = win.add("slider", undefined, current.iconOnlySpacing, 0, 60);
    iconOnlySpacingSlider.alignment = ["fill", "top"];
    iconOnlySpacingSlider.helpTip = "Arraste para definir a distância entre ícones quando não há texto.";

    var compactGrp = win.add("panel", undefined, "Modo compacto");
    compactGrp.alignment = ["fill", "top"];
    compactGrp.margins = [12, 16, 12, 12];
    compactGrp.orientation = "column";
    compactGrp.spacing = 6;
    compactGrp.helpTip = "Configurações aplicadas quando o painel entra em modo compacto.";
    var compactSizeGrp = compactGrp.add("group");
    compactSizeGrp.alignment = ["fill", "top"];
    compactSizeGrp.spacing = 8;
    compactSizeGrp.add("statictext", undefined, "Ícones compactos (LxA):").helpTip = "Dimensões usadas quando o layout entra no modo compacto.";
    var compactWidthField = compactSizeGrp.add("edittext", undefined, current.compactIconSize[0]);
    compactWidthField.characters = 4;
    compactWidthField.helpTip = "Largura dos ícones no modo compacto.";
    var compactHeightField = compactSizeGrp.add("edittext", undefined, current.compactIconSize[1]);
    compactHeightField.characters = 4;
    compactHeightField.helpTip = "Altura dos ícones no modo compacto.";
    var compactSpacingGrp = compactGrp.add("group");
    compactSpacingGrp.alignment = ["fill", "top"];
    compactSpacingGrp.spacing = 8;
    compactSpacingGrp.add("statictext", undefined, "Espaçamento compacto (px):").helpTip = "Folga entre os módulos quando o modo compacto está ativo.";
    var compactSpacingField = compactSpacingGrp.add("edittext", undefined, current.compactIconSpacing);
    compactSpacingField.characters = 4;
    compactSpacingField.helpTip = "Distância, em pixels, entre módulos no modo compacto.";
    var compactSpacingSlider = compactGrp.add("slider", undefined, current.compactIconSpacing, 0, Math.max(60, current.compactIconSpacing));
    compactSpacingSlider.alignment = ["fill", "top"];
    compactSpacingSlider.helpTip = "Arraste para ajustar rapidamente o espaçamento do modo compacto.";

    var presetGrp = win.add("group");
    presetGrp.alignment = ["fill", "top"];
    presetGrp.spacing = 10;
    var hdBtn = presetGrp.add("button", undefined, "Preset HD");
    var kBtn = presetGrp.add("button", undefined, "Preset 4K");
    hdBtn.helpTip = "Aplica um conjunto de valores ideal para telas 1080p.";
    kBtn.helpTip = "Aplica um conjunto de valores ideal para telas 4K.";

    var infoText = win.add("statictext", undefined, "Os valores são aplicados como preview automático.\nUse Aplicar para testar e Salvar para gravar nas preferências.", { multiline: true });
    infoText.maximumSize.width = 280;
    setFgColor(infoText, D9T_Theme.colors.textNormal);

    var buttonsGrp = win.add("group");
    buttonsGrp.alignment = ["right", "top"];
    buttonsGrp.spacing = 10;
    var resetBtn = buttonsGrp.add("button", undefined, "Resetar");
    var applyBtn = buttonsGrp.add("button", undefined, "Aplicar");
    resetBtn.helpTip = "Restaura todos os parâmetros para os valores padrão.";
    applyBtn.helpTip = "Aplica as alterações e salva nas preferências.";

    function styleBtn(btn) {
        if (!btn) { return; }
        try { setBgColor(btn, D9T_Theme.colors.divider); } catch (err) {}
        setFgColor(btn, D9T_Theme.colors.textNormal);
        if (typeof setCtrlHighlight === "function") {
            setCtrlHighlight(btn, D9T_Theme.colors.textNormal, D9T_Theme.colors.textHighlight);
        }
    }

    styleBtn(hdBtn);
    styleBtn(kBtn);
    styleBtn(resetBtn);
    styleBtn(applyBtn);

    function clamp(value, min, max, fallback) {
        var parsed = parseInt(value, 10);
        if (isNaN(parsed)) { parsed = fallback; }
        return Math.min(max, Math.max(min, parsed));
    }

    function syncSliderValue(slider, value) {
        if (slider.maxvalue < value) {
            slider.maxvalue = value;
        }
        slider.value = value;
    }

    function setIconOnlySpacingUI(value, fallback) {
        var normalized = clamp(value, 0, 60, fallback);
        iconOnlySpacingField.text = normalized;
        syncSliderValue(iconOnlySpacingSlider, normalized);
        return normalized;
    }

    function readSettingsFromFields() {
        var width = clamp(widthField.text, 24, 96, current.iconSize[0]);
        var height = clamp(heightField.text, 24, 96, current.iconSize[1]);
        var iconSpacing = clamp(iconSpacingField.text, 0, 60, current.iconSpacing);
        var labelSpacing = clamp(labelSpacingField.text, 0, 40, current.labelSpacing);
        var compactWidth = clamp(compactWidthField.text, 20, 64, current.compactIconSize[0]);
        var compactHeight = clamp(compactHeightField.text, 20, 64, current.compactIconSize[1]);
        var compactSpacing = clamp(compactSpacingField.text, 0, 80, current.compactIconSpacing);
        var iconOnlySpacing = setIconOnlySpacingUI(iconOnlySpacingField.text, current.iconOnlySpacing);
        widthField.text = width;
        heightField.text = height;
        iconSpacingField.text = iconSpacing;
        labelSpacingField.text = labelSpacing;
        compactWidthField.text = compactWidth;
        compactHeightField.text = compactHeight;
        compactSpacingField.text = compactSpacing;
        syncSliderValue(iconSpacingSlider, iconSpacing);
        syncSliderValue(labelSpacingSlider, labelSpacing);
        syncSliderValue(compactSpacingSlider, compactSpacing);
        return {
            iconSize: [width, height],
            iconSpacing: iconSpacing,
            labelSpacing: labelSpacing,
            compactIconSize: [compactWidth, compactHeight],
            compactIconSpacing: compactSpacing,
            showLabels: showLabelsCheckbox.value !== false,
            iconOnlySpacing: iconOnlySpacing
        };
    }

    function applyPreview() {
        var settings = readSettingsFromFields();
        if (!settings) { return; }
        D9T_APPLY_ICON_SETTINGS(settings, { uiObj: uiObj });
    }

    widthField.onChange = applyPreview;
    heightField.onChange = applyPreview;
    iconSpacingField.onChange = applyPreview;
    labelSpacingField.onChange = applyPreview;
    compactWidthField.onChange = applyPreview;
    compactHeightField.onChange = applyPreview;
    compactSpacingField.onChange = applyPreview;
    iconOnlySpacingField.onChange = applyPreview;
    showLabelsCheckbox.onClick = applyPreview;
    iconSpacingSlider.onChanging = function () {
        iconSpacingField.text = Math.round(this.value);
        applyPreview();
    };
    labelSpacingSlider.onChanging = function () {
        labelSpacingField.text = Math.round(this.value);
        applyPreview();
    };
    compactSpacingSlider.onChanging = function () {
        compactSpacingField.text = Math.round(this.value);
        applyPreview();
    };
    iconOnlySpacingSlider.onChanging = function () {
        iconOnlySpacingField.text = Math.round(this.value);
        applyPreview();
    };

    hdBtn.onClick = function () {
        widthField.text = 30;
        heightField.text = 30;
        iconSpacingField.text = 12;
        labelSpacingField.text = 8;
        compactWidthField.text = 24;
        compactHeightField.text = 24;
        compactSpacingField.text = 8;
        setIconOnlySpacingUI(10, current.iconOnlySpacing);
        showLabelsCheckbox.value = true;
        syncSliderValue(iconSpacingSlider, 12);
        syncSliderValue(labelSpacingSlider, 8);
        syncSliderValue(compactSpacingSlider, 8);
        applyPreview();
    };
    kBtn.onClick = function () {
        widthField.text = 40;
        heightField.text = 40;
        iconSpacingField.text = 25;
        labelSpacingField.text = 5;
        compactWidthField.text = 32;
        compactHeightField.text = 32;
        compactSpacingField.text = 12;
        setIconOnlySpacingUI(15, current.iconOnlySpacing);
        showLabelsCheckbox.value = true;
        syncSliderValue(iconSpacingSlider, 25);
        syncSliderValue(labelSpacingSlider, 5);
        syncSliderValue(compactSpacingSlider, 12);
        applyPreview();
    };

    resetBtn.onClick = function () {
        widthField.text = defaults.iconSize[0];
        heightField.text = defaults.iconSize[1];
        iconSpacingField.text = defaults.iconSpacing;
        labelSpacingField.text = defaults.labelSpacing;
        compactWidthField.text = defaults.compactIconSize[0];
        compactHeightField.text = defaults.compactIconSize[1];
        compactSpacingField.text = defaults.compactIconSpacing;
        showLabelsCheckbox.value = defaults.showLabels !== false;
        setIconOnlySpacingUI(defaults.iconOnlySpacing, defaults.iconOnlySpacing);
        syncSliderValue(iconSpacingSlider, defaults.iconSpacing);
        syncSliderValue(labelSpacingSlider, defaults.labelSpacing);
        syncSliderValue(compactSpacingSlider, defaults.compactIconSpacing);
        var settings = readSettingsFromFields();
        if (settings) {
            D9T_APPLY_ICON_SETTINGS(settings, { uiObj: uiObj });
            D9T_SAVE_ICON_SETTINGS(settings);
        }
    };

    applyBtn.onClick = function () {
        var settings = readSettingsFromFields();
        if (!settings) {
            alert("Valores inválidos.");
            return;
        }
        D9T_APPLY_ICON_SETTINGS(settings, { uiObj: uiObj });
        D9T_SAVE_ICON_SETTINGS(settings);
    };
    win.show();
}
function D9T_GET_DEFAULT_ICON_SETTINGS() {
    var defaults = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.uiSettings) ? defaultScriptPreferencesObj.uiSettings : null;
    if (!defaults) { return { iconSize: [36, 36], iconSpacing: 20, labelSpacing: 8, compactIconSize: [28, 28], compactIconSpacing: 12, showLabels: true, iconOnlySpacing: 18 }; }
    return {
        iconSize: defaults.iconSize ? defaults.iconSize.slice(0) : [36, 36],
        iconSpacing: typeof defaults.iconSpacing === "number" ? defaults.iconSpacing : 20,
        labelSpacing: typeof defaults.labelSpacing === "number" ? defaults.labelSpacing : 8,
        compactIconSize: defaults.compactIconSize ? defaults.compactIconSize.slice(0) : [28, 28],
        compactIconSpacing: typeof defaults.compactIconSpacing === "number" ? defaults.compactIconSpacing : 12,
        showLabels: defaults.showLabels !== false,
        iconOnlySpacing: typeof defaults.iconOnlySpacing === "number" ? defaults.iconOnlySpacing : 18
    };
}

function D9T_GET_ICON_SETTINGS() {
    if (!scriptPreferencesObj.uiSettings) {
        scriptPreferencesObj.uiSettings = D9T_GET_DEFAULT_ICON_SETTINGS();
    }
    var current = scriptPreferencesObj.uiSettings || {};
    var size = current.iconSize ? current.iconSize.slice(0) : [36, 36];
    if (size.length < 2) { size = [36, 36]; }
    size[0] = Math.min(96, Math.max(24, parseInt(size[0], 10) || 36));
    size[1] = Math.min(96, Math.max(24, parseInt(size[1], 10) || 36));
    var spacing = current.iconSpacing;
    if (typeof spacing !== "number" || isNaN(spacing)) { spacing = 20; }
    spacing = Math.min(60, Math.max(0, spacing));
    var labelSpacing = current.labelSpacing;
    if (typeof labelSpacing !== "number" || isNaN(labelSpacing)) { labelSpacing = 8; }
    labelSpacing = Math.min(60, Math.max(0, labelSpacing));
    var compactSize = current.compactIconSize ? current.compactIconSize.slice(0) : [28, 28];
    if (compactSize.length < 2) { compactSize = [28, 28]; }
    compactSize[0] = Math.min(64, Math.max(20, parseInt(compactSize[0], 10) || 28));
    compactSize[1] = Math.min(64, Math.max(20, parseInt(compactSize[1], 10) || 28));
    var compactSpacing = current.compactIconSpacing;
    if (typeof compactSpacing !== "number" || isNaN(compactSpacing)) { compactSpacing = 12; }
    compactSpacing = Math.max(0, compactSpacing);
    var showLabels = current.showLabels;
    if (typeof showLabels !== "boolean") { showLabels = true; }
    var iconOnlySpacing = current.iconOnlySpacing;
    if (typeof iconOnlySpacing !== "number" || isNaN(iconOnlySpacing)) { iconOnlySpacing = 18; }
    iconOnlySpacing = Math.min(60, Math.max(0, iconOnlySpacing));
    return { iconSize: size, iconSpacing: spacing, labelSpacing: labelSpacing, compactIconSize: compactSize, compactIconSpacing: compactSpacing, showLabels: showLabels, iconOnlySpacing: iconOnlySpacing };
}

function D9T_APPLY_ICON_SETTINGS(settings, options) {
    settings = settings || D9T_GET_ICON_SETTINGS();
    options = options || {};
    var size = settings.iconSize ? settings.iconSize.slice(0) : [36, 36];
    var spacing = typeof settings.iconSpacing === "number" ? settings.iconSpacing : 20;
    var compactSize = settings.compactIconSize ? settings.compactIconSize.slice(0) : [28, 28];
    var compactSpacing = typeof settings.compactIconSpacing === "number" ? settings.compactIconSpacing : Math.max(4, Math.round(Math.max(0, spacing) * 0.6));
    var labelSpacing = typeof settings.labelSpacing === "number" ? settings.labelSpacing : 8;
    var showLabels = settings.showLabels !== false;
    var iconOnlySpacing = typeof settings.iconOnlySpacing === "number" ? settings.iconOnlySpacing : Math.max(4, Math.round(Math.max(0, spacing) * 0.7));
    D9T_Theme.layout.iconSize = size.slice(0);
    D9T_Theme.layout.iconSizeCompact = compactSize.slice(0);
    D9T_Theme.layout.iconSpacingNormal = spacing;
    D9T_Theme.layout.iconSpacingCompact = Math.max(2, compactSpacing);
    D9T_Theme.layout.labelSpacing = labelSpacing;
    D9T_Theme.layout.showLabels = showLabels;
    D9T_Theme.layout.iconOnlySpacing = Math.max(0, iconOnlySpacing);
    if (options.deferLayout) { return; }
    var targetUI = options.uiObj || D9T_ui;
    if (targetUI && targetUI.imageButtonArray && targetUI.imageButtonArray.length) {
        for (var i = 0; i < targetUI.imageButtonArray.length; i++) {
            var ctrl = targetUI.imageButtonArray[i];
            try {
                ctrl.hoverImg.size = size.slice(0);
                ctrl.normalImg.size = size.slice(0);
            } catch (err) {}
        }
    }
    if (targetUI && targetUI.window) {
        if (options.refresh !== false) {
            targetUI.window.layout.layout(true);
        }
        if (options.forceLayout !== false && typeof D9T_LAYOUT === "function") {
            D9T_LAYOUT(targetUI);
        }
    }
}

function D9T_SAVE_ICON_SETTINGS(settings) {
    var safe = {
        iconSize: settings.iconSize ? settings.iconSize.slice(0) : [36, 36],
        iconSpacing: settings.iconSpacing,
        labelSpacing: settings.labelSpacing,
        compactIconSize: settings.compactIconSize ? settings.compactIconSize.slice(0) : [28, 28],
        compactIconSpacing: settings.compactIconSpacing,
        showLabels: settings.showLabels !== false,
        iconOnlySpacing: typeof settings.iconOnlySpacing === "number" ? settings.iconOnlySpacing : 18
    };
    scriptPreferencesObj.uiSettings = safe;
    if (typeof saveScriptPreferences === "function") {
        saveScriptPreferences();
    }
}

function D9T_ADJUST_ICON_SCALE(uiObj) {
    D9T_OPEN_ICON_SETTINGS_WINDOW(uiObj);
}

function D9T_SET_ICON_SCALE(uiObj, size) {
    var current = D9T_GET_ICON_SETTINGS();
    current.iconSize = size.slice(0);
    D9T_APPLY_ICON_SETTINGS(current, { uiObj: uiObj });
    D9T_SAVE_ICON_SETTINGS(current);
}

function themeButton(sectionGrp, ctrlProperties) {
    try {
        if (ctrlProperties.buttonColor === undefined) ctrlProperties.buttonColor = D9T_Theme.colors.divider;
        if (ctrlProperties.textColor === undefined) ctrlProperties.textColor = D9T_Theme.colors.textNormal;
        var newUiCtrlObj = {};
        var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
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
        var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
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

function drawThemeButton(button) {
    button.onDraw = function () {
        var g = this.graphics;
        var textPen = g.newPen(g.PenType.SOLID_COLOR, this.textColor, 1);
        var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, this.buttonColor);
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


function D9T_LOCK_WINDOW_RESIZE(win) {
    if (!win) { return; }
    try {
        if (typeof win.resizeable !== "undefined") { win.resizeable = false; }
        if (typeof win.maximizeButton !== "undefined") { win.maximizeButton = false; }
        if (typeof win.minimizeButton !== "undefined") { win.minimizeButton = false; }
    } catch (e) {}
}


