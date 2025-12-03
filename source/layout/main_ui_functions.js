/*
---------------------------------------------------------------
> ARQUIVO: main_ui_functions.js
> DESCRIÇÃO: Constrói a interface principal (UI) do GND9TOOLS,
>            gerencia o layout responsivo e os eventos de clique.
> VERSÃO: 3.4 (Correção de Layout - Logo como Menu)
> DATA: 2025
>
> MÓDULOS USADOS:
> - globals.js (para variáveis de tema e preferências)
> - theme_api.js (para funções de cor e utilitários de tema)
> - ICON lib.js (para as variáveis de ícone, ex: LOGO_IMG)
> - Vários scripts de ferramentas (ex: GNEWS_Templates.jsx)
---------------------------------------------------------------
*/


// ============================================
// INICIALIZAÇÃO E CARREGAMENTO DE DADOS
// ============================================

// Define caminhos essenciais e carrega dados de produção.
function initializeGlobalVariables() {
  // Tenta definir o 'scriptMainPath' (caminho raiz do script)
  if (typeof scriptMainPath === 'undefined' || !scriptMainPath) {
    try {
      // Se executando de um arquivo .jsx, encontra o caminho pai
      if ($.fileName && $.fileName !== '') {
        var currentFile = new File($.fileName);
        scriptMainPath = currentFile.parent.parent.fullName + '/';
      } else {
        throw new Error("Caminho do script não encontrado");
      }
    } catch (e) {
      // Fallback para a pasta de dados do usuário (ex: em .jsxbin)
      scriptMainPath = Folder.userData.fullName + '/GND9TOOLS script/';
      var scriptFolder = new Folder(scriptMainPath);
      if (!scriptFolder.exists) scriptFolder.create();
    }
  }
  
  // Carrega os dados de produção (lista de templates) se ainda não foram carregados
  if (typeof D9T_prodArray === 'undefined') {
    D9T_prodArray = [];
    loadProductionData();
  }
  
  // Garante que os arquivos de configuração JSON básicos existam
  D9T_ENSURE_BASE_CONFIG_FILES();
}

// Carrega a lista de produções (templates) do arquivo JSON.
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
      // Fallback se o arquivo não existir
      D9T_prodArray = [{ name: "GNEWS", paths: ["T:/JORNALISMO/GLOBONEWS/TEMPLATES"], icon: "GNEWS_ICON" }];
    }
  } catch (e) {
    // Fallback em caso de erro de leitura ou parse
    D9T_prodArray = [{ name: "GNEWS", paths: ["T:/JORNALISMO/GLOBONEWS/TEMPLATES"], icon: "GNEWS_ICON" }];
  }
}

// Verifica se os arquivos JSON de configuração existem na pasta de preferências do usuário.
// Se não existirem, cria-os usando um arquivo base ou um objeto padrão.
function D9T_ENSURE_BASE_CONFIG_FILES() {
  
  // Função auxiliar para criar um arquivo JSON se ele não existir
  function ensureJsonFile(targetPath, basePath, defaultObj) {
    try {
      var file = new File(targetPath);
      if (file.exists) { return; } // Já existe, não faz nada
      
      // Cria a pasta pai se necessário
      var parentFolder = file.parent;
      if (parentFolder && !parentFolder.exists) { parentFolder.create(); }
      
      file.encoding = "UTF-8";
      var payload = null;
      
      // Tenta ler de um arquivo base (template)
      if (basePath) {
        var baseFile = new File(basePath);
        if (baseFile.exists) {
          baseFile.encoding = "UTF-8";
          if (baseFile.open('r')) {
            payload = baseFile.read();
            baseFile.close();
          }
        }
      }
      
      // Se não houver arquivo base, usa o objeto padrão
      if (payload === null && defaultObj) {
        try {
          payload = JSON.stringify(defaultObj, null, 2);
        } catch (jsonErr) {
          payload = "{}"; // Fallback
        }
      }
      
      if (payload === null) { payload = "{}"; } // Fallback final
      
      // Escreve o arquivo
      if (file.open('w')) {
        file.write(payload);
        file.close();
      }
    } catch (writeErr) {
      $.writeln(lol + "#CONFIG_INIT - Falha ao criar " + targetPath + ": " + writeErr.message);
    }
  }

  // Objeto padrão para as preferências do usuário
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

  // Objeto padrão para configurações do sistema (específicas de cada módulo)
  var defaultSystemSettings = {
    COPYLINKS_Settings: {
      configuracao: {
        layout_grupos: {},
        layout_geral: {
          name_btn_width: 580,
          text_width_normal: 460,
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

  // Objeto padrão para a biblioteca de dados (listas, etc.)
  var defaultDadosConfig = {
    ARTES_GNEWS: { arte: [] },
    PROGRAMACAO_GNEWS: { programacao: [] },
    EQUIPE_GNEWS: { equipe: [] },
    CAMINHOS_REDE: { caminhos: [] },
    COPYLINKS: { grupos: [] }
  };

  // Caminhos dos arquivos de configuração
  var userPrefsPath = runtimePrefsPath + '/User_Preferences.json';
  var systemSettingsPath = runtimeConfigPath + '/System_Settings.json';
  var dadosConfigUserPath = runtimeConfigPath + '/Dados_Config.json';
  var dadosConfigMainPath = runtimeConfigPath + '/Dados_Config.json';

  // Garante que todos os arquivos existam
  ensureJsonFile(userPrefsPath, userPrefsPath, defaultUserPrefs);
  ensureJsonFile(systemSettingsPath, systemSettingsPath, defaultSystemSettings);
  ensureJsonFile(dadosConfigUserPath, dadosConfigUserPath, defaultDadosConfig);
}

// Inicializa as variáveis globais e configurações
initializeGlobalVariables();

// Logger global de erros para capturar origem (arquivo/linha) em execuções parciais
if (!$.global.D9T_trapErrors) {
    $.global.D9T_trapErrors = true;
    $.global.__old_on_error__ = $.global.onError;
    $.global.onError = function (msg, fn, ln) {
        try {
            var baseLogPath = (typeof runtimeLogsPath !== "undefined" && runtimeLogsPath) ? runtimeLogsPath :
                              (typeof scriptLogsPath !== "undefined" && scriptLogsPath) ? scriptLogsPath :
                              Folder.temp.fsName;
            var f = new File(baseLogPath + "/errors.log");
            f.encoding = "UTF-8";
            f.open("a");
            f.writeln(new Date().toUTCString() + " [ERROR] " + msg + " @ " + (fn || "unknown") + ":" + (ln || 0));
            f.close();
        } catch (_) {}
        if ($.global.__old_on_error__) { return $.global.__old_on_error__(msg, fn, ln); }
        alert(msg);
    };
}

function D9T_COMMIT_PREFERENCES() {
    if (typeof D9T_Preferences !== "undefined" && typeof D9T_Preferences.save === "function") {
        try { D9T_PREF_LOG("D9T_COMMIT_PREFERENCES -> D9T_Preferences.save"); D9T_Preferences.save(); return; }
        catch (prefsErr) { $.writeln("[main_ui_functions] Falha ao salvar via D9T_Preferences: " + prefsErr); }
    }
    if (typeof saveScriptPreferences === "function") {
        try {
            D9T_PREF_LOG("D9T_COMMIT_PREFERENCES -> saveScriptPreferences");
            saveScriptPreferences();
            return;
        } catch (legacyErr) { $.writeln("[main_ui_functions] Falha ao salvar via saveScriptPreferences: " + legacyErr); }
    }
}



// ============================================
// CONSTRUÇÃO DA INTERFACE (UI)
// ============================================

/**
 * Constrói a interface gráfica principal.
 * @param {Object} structureObj - Objeto que define a estrutura dos módulos (pinGrp, mainGrp).
 * @param {Object} uiObj - O objeto D9T_ui que armazenará os elementos da UI.
 */
function D9T_BUILD_UI(structureObj, uiObj) {
  // Carrega as preferências do usuário (se ainda não carregadas)
  if (typeof loadScriptPreferences === "function" && !scriptPreferencesObj.__uiLoaded) {
    loadScriptPreferences();
    scriptPreferencesObj.__uiLoaded = true;
  }
  // Atualiza as cores do tema com base nas preferências
  D9T_REFRESH_THEME_COLORS();
  // Aplica as configurações de tamanho/espaçamento de ícones
  D9T_APPLY_ICON_SETTINGS(D9T_GET_ICON_SETTINGS(), { refresh: false, deferLayout: true });
  if (typeof D9T_applyActiveButtonTheme === "function") {
    D9T_applyActiveButtonTheme(false);
  }

  // Trava o redimensionamento da janela (se for uma paleta)
  if (uiObj.window) {
    D9T_LOCK_WINDOW_RESIZE(uiObj.window);
  }

  // --- 1. Definições da Janela Principal ---
  uiObj.window.margins = 4;
  uiObj.window.orientation = "stack"; // Orientação "stack" para sobrepor o modo de busca
  uiObj.window.spacing = 0;

  // --- NOVO: Grupo de Conteúdo Principal ---
  // Este grupo conterá o cabeçalho E os ícones.
  // Fica na camada inferior do "stack".
  uiObj.contentGrp = uiObj.window.add("group");
  uiObj.contentGrp.orientation = "column"; // Começa como coluna
  uiObj.contentGrp.alignment = ["fill", "fill"];
  uiObj.contentGrp.spacing = 0;
  uiObj.contentGrp.margins = 0;

  // --- 2. Grupo do Cabeçalho (Header) ---
  // Adicionado ao 'contentGrp'
  uiObj.headerGrp = uiObj.contentGrp.add("group");
  uiObj.headerGrp.orientation = "row";
  uiObj.headerGrp.alignment = ["fill", "top"];
  uiObj.headerGrp.alignChildren = ["left", "center"]; // Corrigido para alinhar menu à direita
  uiObj.headerGrp.spacing = 8;
  uiObj.headerGrp.margins = [10, 6, 10, 4];

  // --- 2a. Grupo de Informação (Logo + Versão) ---
  uiObj.infoGrp = uiObj.headerGrp.add("group");
  uiObj.infoGrp.orientation = "row"; 
  uiObj.infoGrp.alignChildren = ["left", "center"]; 
  uiObj.infoGrp.alignment = ["left", "center"];
  uiObj.infoGrp.spacing = 6;
  uiObj.mainLogo = uiObj.infoGrp.add("image", undefined, LOGO_IMG.light);
  uiObj.mainLogo.maximumSize = [70, 24];
  uiObj.mainLogo.minimumSize = [50, 24];
  uiObj.mainLogo.helpTip = "Abrir Ações e Configurações"; // Dica

  
  // Trocado .onClick por .addEventListener("click", ...)
  uiObj.mainLogo.addEventListener("click", function () { 
      D9T_SHOW_ACTION_MENU(uiObj); 
  });
  

  uiObj.vLab = uiObj.infoGrp.add("statictext", undefined, scriptVersion, {
    truncate: "end",
  });
  uiObj.vLab.justify = "center";
  uiObj.vLab.helpTip = [scriptName, scriptVersion, "| D9"].join(" "); // Dica de versão

  // --- 2b. Espaçador (Empurra o menu para a direita) ---
  uiObj.headerSpacer = uiObj.headerGrp.add("group");
  uiObj.headerSpacer.alignment = ["fill", "center"];

  // --- 2c. Grupo do Menu (Botão Hamburger) ---
  uiObj.menuBtnGrp = uiObj.headerGrp.add("group");
  uiObj.menuBtnGrp.orientation = "row";
  uiObj.menuBtnGrp.alignChildren = ["right", "center"];
  uiObj.menuBtnGrp.alignment = ["right", "center"];
  uiObj.menuBtnGrp.margins = [0, 0, 8, 0];
  uiObj.menuBtnGrp.visible = false; // Botão de menu removido
  
  uiObj.hamburgerBtn = uiObj.menuBtnGrp.add("button", undefined, "\u2630"); 
  uiObj.hamburgerBtn.preferredSize = [32, 24];
  uiObj.hamburgerBtn.helpTip = "Ações e configurações";

  // --- 3. Grupo Principal de Módulos (mainGrp) ---
  // Adicionado ao 'contentGrp'
  uiObj.mainGrp = uiObj.contentGrp.add("group");
  uiObj.mainGrp.alignment = ["fill", "top"];
  uiObj.mainGrp.alignChildren = ["center", "top"];
  uiObj.mainGrp.spacing = 12;
  uiObj.sectionGrpArray.push(uiObj.mainGrp); 
  
  uiObj.pinGrp = uiObj.contentGrp.add("group"); 
  uiObj.pinGrp.visible = false; 
  
  uiObj.moduleIndex = []; 

  // --- 5. Grupo de Busca (searchGrp) ---
  // Adicionado à 'window' (camada superior do "stack")
  uiObj.searchGrp = uiObj.window.add("group");
  uiObj.searchGrp.orientation = "row";
  uiObj.searchGrp.alignment = ["fill", "top"];
  uiObj.searchGrp.alignChildren = ["left", "center"];
  uiObj.searchGrp.spacing = 12;
  uiObj.searchGrp.margins = [10, 4, 10, 6];
  uiObj.searchGrp.visible = false; 
  
  // --- 5a. Subgrupo de Logo/Menu para o modo busca ---
  uiObj.searchInfoGrp = uiObj.searchGrp.add("group");
  uiObj.searchInfoGrp.orientation = "row";
  uiObj.searchInfoGrp.alignChildren = ["left", "center"];
  uiObj.searchInfoGrp.alignment = ["left", "center"];
  uiObj.searchInfoGrp.spacing = 6;
  uiObj.searchInfoGrp.margins = [0, 0, 8, 0];

  uiObj.searchLogo = uiObj.searchInfoGrp.add("image", undefined, LOGO_IMG.light);
  uiObj.searchLogo.maximumSize = [64, 22];
  uiObj.searchLogo.minimumSize = [48, 22];
  uiObj.searchLogo.helpTip = "Abrir Acoes e Configuracoes";
  uiObj.searchLogo.addEventListener("click", function () {
    D9T_SHOW_ACTION_MENU(uiObj);
  });

  uiObj.searchVersionLab = uiObj.searchInfoGrp.add("statictext", undefined, scriptVersion, {
    truncate: "end",
  });
  uiObj.searchVersionLab.justify = "center";
  uiObj.searchVersionLab.helpTip = [scriptName, scriptVersion, "| D9"].join(" ");
  setFgColor(uiObj.searchVersionLab, D9T_Theme.colors.textNormal);

  // --- 5b. Elementos da Busca ---
  uiObj.searchControlsGrp = uiObj.searchGrp.add("group");
  uiObj.searchControlsGrp.orientation = "row";
  uiObj.searchControlsGrp.alignChildren = ["center", "center"];
  uiObj.searchControlsGrp.alignment = ["fill", "center"];
  uiObj.searchControlsGrp.spacing = 6;

  uiObj.searchIcon = null;
  try {
    if (typeof D9T_FINDER_ICON !== "undefined") {
      uiObj.searchIcon = uiObj.searchControlsGrp.add("image", undefined, D9T_FINDER_ICON);
      uiObj.searchIcon.preferredSize = [18, 18];
    }
  } catch (iconErr) {}
  if (!uiObj.searchIcon) {
    uiObj.searchIcon = uiObj.searchControlsGrp.add("statictext", undefined, "[?]");
    setFgColor(uiObj.searchIcon, D9T_Theme.colors.textNormal);
  }
  uiObj.searchLabel = uiObj.searchControlsGrp.add("statictext", undefined, "BUSCAR:");
  uiObj.searchLabel.helpTip = "Filtra modulos por nome, descricao ou palavra-chave.";
  setFgColor(uiObj.searchLabel, D9T_Theme.colors.textNormal);
  uiObj.searchField = uiObj.searchControlsGrp.add("edittext", undefined, "");
  uiObj.searchField.characters = 16;
  uiObj.searchField.preferredSize = [200, 22];
  uiObj.searchField.helpTip = "Digite para localizar modulos rapidamente.";
  uiObj.searchDropdown = uiObj.searchControlsGrp.add("dropdownlist", undefined, []);
  uiObj.searchDropdown.preferredSize = [170, 22];
  uiObj.searchDropdown.helpTip = "Lista de modulos compativeis com o termo digitado.";
  uiObj.searchButton = uiObj.searchControlsGrp.add("button", undefined, "OK");
  uiObj.searchButton.preferredSize = [40, 22];
  uiObj.searchButton.helpTip = "Executa o modulo selecionado ou a busca ativa";
  
  // --- 7. Loop de Construção dos Módulos ---
  var sectionCounter = 0;
  var ctrlCounter = 0;
  
  // Loop para módulos fixados (pinGrp)
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
  
  // Loop para módulos principais (mainGrp)
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
  
  // --- 8. Finalização e Eventos ---
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

/**
 * Aplica as cores de fundo principais à janela e cabeçalho.
 * @param {Object} uiObj - O objeto D9T_ui.
 */
function D9T_APPLY_THEME_TO_ROOT(uiObj) {
  uiObj = uiObj || D9T_ui;
  if (!uiObj || !uiObj.window) { return; }
  
  // Cor de fundo da janela
  try { setBgColor(uiObj.window, bgColor1); } catch (e) {}
  
  // ALTERADO: A cor de fundo do cabeçalho é necessária novamente
  if (uiObj.headerGrp) {
    try { setBgColor(uiObj.headerGrp, bgColor2); } catch (headerErr) {}
  }

  // Cor de fundo do grupo de busca (continua correto)
  if (uiObj.searchGrp) {
    try { setBgColor(uiObj.searchGrp, bgColor2); } catch (searchErr) {}
  }

  if (uiObj.infoGrp && D9T_Theme.layout) {
    D9T_APPLY_GROUP_MARGINS(uiObj.infoGrp, D9T_Theme.layout.infoMargins);
  }
  if (uiObj.mainGrp && D9T_Theme.layout) {
    D9T_APPLY_GROUP_MARGINS(uiObj.mainGrp, D9T_Theme.layout.mainMargins);
  }

  // Cor do texto dos labels
    if (uiObj.searchLabel) { setFgColor(uiObj.searchLabel, D9T_Theme.colors.textNormal); }
    if (uiObj.searchVersionLab) { setFgColor(uiObj.searchVersionLab, D9T_Theme.colors.textNormal); }
    if (uiObj.vLab) { setFgColor(uiObj.vLab, D9T_Theme.colors.textNormal); }

  // Atualiza divisores existentes para refletir a nova cor global
  if (uiObj.divArray && uiObj.divArray.length) {
    for (var d = 0; d < uiObj.divArray.length; d++) {
      var divider = uiObj.divArray[d];
      try {
        setUiCtrlColor(divider, D9T_Theme.colors.divider);
        if (divider.onDraw) { divider.notify("onDraw"); }
      } catch (divErr) {}
    }
  }
  }


/**
 * Função principal de layout responsivo.
 * Chamada sempre que a janela é redimensionada ou exibida.
 * @param {Object} uiObj - O objeto D9T_ui.
 */
function D9T_LAYOUT(uiObj) {
  // Atalhos para o tema e dimensões da janela
  var theme = D9T_Theme.layout;
  var winSize = uiObj.window.size || [];
  var w = (typeof winSize.width === "number") ? winSize.width : (winSize.length > 0 ? winSize[0] : null);
  var h = (typeof winSize.height === "number") ? winSize.height : (winSize.length > 1 ? winSize[1] : null);
  if ((w === null || h === null) && uiObj.window.bounds) {
      var b = uiObj.window.bounds;
      if (w === null) { w = (typeof b.width === "number") ? b.width : (b.right - b.left); }
      if (h === null) { h = (typeof b.height === "number") ? b.height : (b.bottom - b.top); }
  }
  w = (typeof w === "number" && !isNaN(w)) ? w : 0;
  h = (typeof h === "number" && !isNaN(h)) ? h : 0;

  // --- 1. Determinar Orientação (Row vs Column) ---
  var isRow;
  if (h <= theme.verticalBreakpoint) {
      isRow = true; // Forçar horizontal (row) se for muito baixo
  } else if (w <= theme.horizontalBreakpoint) {
      isRow = false; // Forçar vertical (column) se for muito estreito
  } else {
      isRow = (w > h); // Lógica padrão para painéis maiores
  }

  // Orientação dos grupos de seção (dentro do mainGrp)
  var grpOrientation = isRow ? "row" : "column";
  // Orientação do botão (ícone + texto)
  var btnOrientation = isRow ? "column" : "row"; 
  var iconOrientation = w < 70 ? "column" : "row"; 
  
  // --- 2. Determinar Modo (Search, Compact, Normal) ---
  var searchModeHeight = (typeof theme.searchModeHeight === "number") ? theme.searchModeHeight : 44;
  var useSearchMode = h <= searchModeHeight;
  
  var normalSpacing = theme.iconSpacingNormal || 20;
  var verticalSpacingPref = (typeof theme.iconSpacingVertical === "number") ? theme.iconSpacingVertical : normalSpacing;
  var compactSpacing = theme.iconSpacingCompact || Math.max(4, Math.round(normalSpacing * 0.6));
  var compactModeHeight = theme.compactModeHeight || 80;
  var compactModeWidthPref = (typeof theme.compactModeWidth === "number") ? theme.compactModeWidth : 0;
  var normalIconSize = theme.iconSize || [32, 32];
  var verticalIconSizePref = theme.iconSizeVertical || normalIconSize;
  var compactIconSize = theme.iconSizeCompact || normalIconSize;
  var autoCompactWidth = Math.max(320, (normalIconSize[0] + normalSpacing) * 4 + 160);
  var widthThreshold = compactModeWidthPref > 0 ? compactModeWidthPref : autoCompactWidth;
  var verticalCompactLimit = (typeof theme.verticalCompactWidth === "number" && theme.verticalCompactWidth > 0)
    ? theme.verticalCompactWidth
    : Math.min(widthThreshold, Math.max(240, (theme.horizontalBreakpoint || widthThreshold) - 120));
  var compactByWidth = isRow ? (w <= widthThreshold) : (w <= verticalCompactLimit);
  var useCompactMode = !useSearchMode && (compactByWidth || h <= compactModeHeight);
  
  // --- 3. Definir Espaçamentos e Tamanhos Ativos ---
  var activeSpacing = useCompactMode ? compactSpacing : (isRow ? normalSpacing : verticalSpacingPref);
  var labelSpacing = (typeof theme.labelSpacing === "number") ? theme.labelSpacing : 8;
  var showLabelsPref = theme.showLabels !== false; 
  var iconOnlySpacingValue = (typeof theme.iconOnlySpacing === "number") ? theme.iconOnlySpacing : Math.max(4, Math.round(normalSpacing * 0.7));
  
  var manualIconOnly = !useSearchMode && !useCompactMode && !showLabelsPref;
  var labelsVisible = !useSearchMode && !useCompactMode && showLabelsPref; 
  
  var spacingBaseline = manualIconOnly ? iconOnlySpacingValue : activeSpacing;
  
  var activeIconSize = useCompactMode ? compactIconSize : (isRow ? normalIconSize : verticalIconSizePref);

  // --- 4. Aplicar Visibilidade dos Grupos Principais ---
  // ALTERADO: Controla a visibilidade do 'contentGrp' e 'searchGrp'
  if (uiObj.searchGrp) {
    uiObj.searchGrp.visible = useSearchMode; 
  }
  if (uiObj.contentGrp) {
    uiObj.contentGrp.visible = !useSearchMode;
  }

  // --- 5. Lógica de Entrada/Saída do Modo Busca ---
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

  // --- 6. Aplicar Layout aos Elementos ---
  var infoGap = isRow ? 110 : 56;
  var halfSpacing = Math.max(0, spacingBaseline / 2);
  var leftSpacing = halfSpacing;
  var rightSpacing = halfSpacing;
  
  try {
    // *** NOVA LÓGICA DE LAYOUT PRINCIPAL ***
    if (uiObj.contentGrp) {
      if (isRow) {
        // MODO HORIZONTAL: Cabeçalho e Ícones lado a lado
        uiObj.contentGrp.orientation = "row";
        uiObj.contentGrp.alignChildren = ["left", "center"];
        uiObj.headerGrp.alignment = ["left", "center"];
        uiObj.mainGrp.alignment = ["fill", "center"];
      } else {
        // MODO VERTICAL: Cabeçalho acima dos Ícones
        uiObj.contentGrp.orientation = "column";
        uiObj.contentGrp.alignChildren = ["fill", "top"];
        uiObj.headerGrp.alignment = ["fill", "top"];
        uiObj.mainGrp.alignment = ["fill", "top"];
      }
      if (uiObj.mainLogo) {
        var logoNormalSize = (D9T_Theme.layout && D9T_Theme.layout.logoSize) ? D9T_Theme.layout.logoSize : [70, 24];
        var logoCompactSize = (D9T_Theme.layout && D9T_Theme.layout.logoSizeCompact) ? D9T_Theme.layout.logoSizeCompact : [52, 18];
        var targetLogoSize = isRow ? logoNormalSize : logoCompactSize;
        try {
          uiObj.mainLogo.minimumSize = targetLogoSize.slice(0);
          uiObj.mainLogo.maximumSize = targetLogoSize.slice(0);
          uiObj.mainLogo.preferredSize = targetLogoSize.slice(0);
        } catch (logoErr) {}
      }
    }
    // ***************************************

    // Aplica orientação aos grupos de seção (dentro do mainGrp)
    for (var s = 0; s < uiObj.sectionGrpArray.length; s++) {
      var sectionGrp = uiObj.sectionGrpArray[s];
      // 'grpOrientation' define se as seções (section1, section2)
      // ficam lado a lado (row) ou uma sobre a outra (column)
      sectionGrp.orientation = grpOrientation; 
      var minSectionSpacing = useSearchMode ? 8 : 0;
      sectionGrp.spacing = Math.max(minSectionSpacing, halfSpacing);
    }
    
    // Aplica orientação aos divisores
    for (var d = 0; d < uiObj.divArray.length; d++) {
      var div = uiObj.divArray[d];
      div.size = [1, 1];
      div.alignment = grpOrientation === "row" ? ["center", "fill"] : ["fill", "center"];
    }
    
    // Loop principal: aplica layout a cada botão de módulo
    for (var b = 0; b < uiObj.imageButtonArray.length; b++) {
      var btn = uiObj.imageButtonArray[b];
      if (btn && btn.btnGroup) { btn.btnGroup.alignment = ["center", "top"]; }
      
      // 'btnOrientation' define se o ícone fica acima (column) ou ao lado (row) do texto
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
        btn.label.size = [w - 60, 18];
      }
    }
    
    // Aplica margens e espaçamento ao grupo principal de módulos
    if (!useSearchMode && uiObj.mainGrp.visible) {
      // REMOVIDO: Margem superior 'headerHeight' não é mais necessária
      if (isRow) {
          // Se for linha, os ícones ficam ao lado do cabeçalho
          uiObj.mainGrp.margins = [leftSpacing, 0, leftSpacing, 0];
          uiObj.mainGrp.alignment = ["fill", "center"];
      } else {
          // Se for coluna, os ícones ficam abaixo do cabeçalho
          uiObj.mainGrp.margins = [4, 0, 4, infoGap]; 
          uiObj.mainGrp.alignment = ["fill", "top"];
      }
      
      var baseModuleSpacing;
      if (useCompactMode) {
        baseModuleSpacing = Math.max(0, compactSpacing);
      } else if (manualIconOnly) {
        baseModuleSpacing = Math.max(0, iconOnlySpacingValue);
      } else {
        baseModuleSpacing = Math.max(0, spacingBaseline);
      }
      uiObj.mainGrp.spacing = baseModuleSpacing;
    }
    
    // (A lógica de 'pinGrp' e 'iconBtnMainGrp' é mantida,
    // embora 'pinGrp' pareça não ser usado para adicionar módulos)
    if (uiObj.pinGrp) {
      uiObj.pinGrp.alignment = ["center", "top"];
      uiObj.pinGrp.spacing = Math.max(0, spacingBaseline);
    }
    if (uiObj.iconBtnMainGrp) {
      uiObj.iconBtnMainGrp.alignment = ["center", "top"];
      uiObj.iconBtnMainGrp.orientation = iconOrientation;
      uiObj.iconBtnMainGrp.spacing = Math.max(0, spacingBaseline / 3);
    }
    if (uiObj.iconBtnGrp0) uiObj.iconBtnGrp0.spacing = Math.max(0, spacingBaseline / 3);
    if (uiObj.iconBtnGrp1) uiObj.iconBtnGrp1.spacing = Math.max(0, spacingBaseline / 3);
    
  } catch (err) {
    $.writeln(lol + "#D9T_LAYOUT - " + "" + err.message);
  }
  
  // --- 7. Renderiza o Layout ---
  uiObj.window.layout.layout(true);
  uiObj.window.layout.resize();
}

// ============================================
// EVENTOS DA INTERFACE
// ============================================

/**
 * Anexa as funções de clique (vindas dos arquivos de script) aos botões da UI.
 * @param {Object} uiObj - O objeto D9T_ui.
 */
function D9T_UI_EVENTS(uiObj) {
    
    // Função auxiliar segura para executar funções, tratando erros.
    function safeExecute(functionName, func) {
      var logName = functionName || 'modulo';
      if (typeof D9T_logInfo === 'function') {
        try { D9T_logInfo(logName, 'Execução iniciada'); } catch (logErrStart) {}
      }
      try {
        if (typeof func === 'function') {
          func();
          if (typeof D9T_logInfo === 'function') {
            try { D9T_logInfo(logName, 'Execução concluída'); } catch (logErrDone) {}
          }
        } else {
          var missingMsg = 'A função "' + functionName + '" não está disponível.';
          if (typeof D9T_logWarn === 'function') {
            try { D9T_logWarn(logName, missingMsg); } catch (logWarnErr) {}
          }
          alert(missingMsg);
        }
      } catch (err) {
        var errorMsg = 'Erro ao executar ' + functionName + ':\n\n' + err.toString();
        if (err.line) errorMsg += '\nLinha: ' + err.line;
        if (typeof D9T_logError === 'function') {
          try { D9T_logError(logName, errorMsg); } catch (logErr) {}
        }
        $.writeln(errorMsg);
        alert(errorMsg);
      }
    }
  
    // Anexa eventos para cada módulo
    // (O objeto uiObj[nomeDoModulo] é criado em D9T_BUILD_UI)
    
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
// COMPONENTES DE INTERFACE (FÁBRICAS)
// ============================================

/**
 * Cria um divisor gráfico (linha).
 * @param {Group} sectionGrp - O grupo pai onde o divisor será adicionado.
 * @returns {Button} - Um customButton usado como divisor.
 */
function themeDivider(sectionGrp) {
    var newDiv = sectionGrp.add("customButton", [0, 0, 1, 1]); // Tamanho mínimo
    setUiCtrlColor(newDiv, D9T_Theme.colors.divider); // Define a cor
    newDiv.onDraw = customDraw; // Função de desenho customizada
    return newDiv;
}

/**
 * Cria um botão de ícone (sem texto).
 * @param {Group} sectionGrp - O grupo pai.
 * @param {Object} ctrlProperties - Propriedades (ícone, tips).
 * @returns {Object} - Objeto contendo leftClick e rightClick.
 */
function themeIconButton(sectionGrp, ctrlProperties) {
    var newUiCtrlObj = {};
    var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
    if (ctrlProperties.icon.hover == undefined) ctrlProperties.icon.hover = ctrlProperties.icon.normal; // Fallback de ícone hover

    function logIcon(msg) {
        try {
            var logDir = Folder.userData.fsName + "/GND9TOOLS script/runtime/logs";
            var lf = new Folder(logDir); if (!lf.exists) lf.create();
            var f = new File(logDir + "/icons.log");
            f.open("a"); f.writeln(new Date().toUTCString() + " [ICONS] " + msg); f.close();
        } catch (e) {}
    }

    // Grupo principal do botão
    var btnGroup = sectionGrp.add("group");
    btnGroup.helpTip = tipTxt;
    
    // Grupo de ícone (empilhado)
    var iconGroup = btnGroup.add("group");
    iconGroup.helpTip = tipTxt;
    iconGroup.orientation = "stack";
    
    // Botões invisíveis para capturar cliques (hack do ScriptUI)
    newUiCtrlObj.leftClick = iconGroup.add("button", undefined, "");
    newUiCtrlObj.leftClick.size = [0, 0];
    newUiCtrlObj.leftClick.visible = false;
    newUiCtrlObj.leftClick.helpTip = tipTxt;
    newUiCtrlObj.rightClick = iconGroup.add("button", undefined, "");
    newUiCtrlObj.rightClick.size = [0, 0];
    newUiCtrlObj.rightClick.visible = false;
    newUiCtrlObj.rightClick.helpTip = tipTxt;
    
    // Imagens (Hover e Normal) com fallback
    var iconOk = true, hoverImg = null, normalImg = null;
    try {
        hoverImg = iconGroup.add("image", undefined, ctrlProperties.icon.hover);
        hoverImg.helpTip = tipTxt;
        hoverImg.visible = false; // começa invisível
        normalImg = iconGroup.add("image", undefined, ctrlProperties.icon.normal);
        normalImg.helpTip = tipTxt;
    } catch (iconErr) {
        iconOk = false;
        logIcon("Falha ao criar icone: " + iconErr.toString());
    }

    if (!iconOk || !hoverImg || !normalImg) {
        while (iconGroup.children.length > 0) { iconGroup.remove(iconGroup.children[0]); }
        while (btnGroup.children.length > 0) { btnGroup.remove(btnGroup.children[0]); }
        var fallbackLabel = ctrlProperties.labelTxt ? ctrlProperties.labelTxt : "?";
        var fallbackBtn = btnGroup.add("button", undefined, fallbackLabel);
        fallbackBtn.helpTip = tipTxt;
        newUiCtrlObj.leftClick = fallbackBtn;
        newUiCtrlObj.rightClick = fallbackBtn;
        logIcon("Fallback acionado para: " + fallbackLabel);
        return newUiCtrlObj;
    }
    
    // Eventos de Mouseover/Mouseout para trocar as imagens
    btnGroup.addEventListener("mouseover", function () {
        this.children[0].children[3].visible = false; // Esconde normalImg (Índice 3)
        this.children[0].children[2].visible = true;  // Mostra hoverImg (Índice 2)
    });
    btnGroup.addEventListener("mouseout", function () {
        this.children[0].children[2].visible = false; // Esconde hoverImg
        this.children[0].children[3].visible = true;  // Mostra normalImg
    });
    
    // Evento de clique na imagem (que notifica os botões invisíveis)
    hoverImg.addEventListener("click", function (c) {
        if (c.button == 0) this.parent.children[0].notify(); // Notifica leftClick (Índice 0)
        if (c.button == 2) this.parent.children[1].notify(); // Notifica rightClick (Índice 1)
    });
    
    return newUiCtrlObj;
}
/**
 * Cria um botão de módulo (ícone + texto).
 * @param {Group} sectionGrp - O grupo pai.
 * @param {Object} ctrlProperties - Propriedades (ícone, labelTxt, tips).
 * @returns {Object} - Objeto contendo o botão (btnGroup, iconGroup, etc.).
 */
function themeImageButton(sectionGrp, ctrlProperties) {
    var newUiCtrlObj = {};
    var newBtn = (newUiCtrlObj[ctrlProperties.key] = {}); // Armazena o botão no objeto
    var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
    if (ctrlProperties.icon.hover == undefined) ctrlProperties.icon.hover = ctrlProperties.icon.normal; // Fallback

    // Grupo principal (botão + texto)
    newBtn.btnGroup = sectionGrp.add("group");
    newBtn.btnGroup.helpTip = tipTxt;
    
    // Grupo do Ícone (empilhado)
    newBtn.iconGroup = newBtn.btnGroup.add("group");
    newBtn.iconGroup.helpTip = tipTxt;
    newBtn.iconGroup.orientation = "stack";
    
    // Botões invisíveis de clique
    newBtn.leftClick = newBtn.iconGroup.add("button", undefined, "");
    newBtn.leftClick.size = [0, 0];
    newBtn.leftClick.visible = false;
    newBtn.leftClick.helpTip = tipTxt;
    newBtn.rightClick = newBtn.iconGroup.add("button", undefined, "");
    newBtn.rightClick.size = [0, 0];
    newBtn.rightClick.visible = false;
    newBtn.rightClick.helpTip = tipTxt;
    
    // Imagens
    newBtn.hoverImg = newBtn.iconGroup.add("image", undefined, ctrlProperties.icon.hover);
    newBtn.hoverImg.helpTip = tipTxt;
    newBtn.hoverImg.visible = false;
    newBtn.normalImg = newBtn.iconGroup.add("image", undefined, ctrlProperties.icon.normal);
    newBtn.normalImg.helpTip = tipTxt;
    
    // Label de Texto
    newBtn.label = newBtn.btnGroup.add("statictext", undefined, ctrlProperties.labelTxt, { truncate: "end" });
    newBtn.label.maximumSize = [70, 18];
    newBtn.label.helpTip = tipTxt;
    setFgColor(newBtn.label, D9T_Theme.colors.textNormal); // Cor normal
    
    // Eventos de Mouseover/Mouseout (troca imagem E cor do texto)
    newBtn.btnGroup.addEventListener("mouseover", function () {
        setFgColor(this.children[1], D9T_Theme.colors.textHighlight); // Texto (índice 1)
        this.children[0].children[3].visible = false; // Imagem normal (índice 0, 3)
        this.children[0].children[2].visible = true;  // Imagem hover (índice 0, 2)
    });
    newBtn.btnGroup.addEventListener("mouseout", function () {
        setFgColor(this.children[1], D9T_Theme.colors.textNormal); // Restaura cor do texto
        this.children[0].children[2].visible = false; // Esconde hover
        this.children[0].children[3].visible = true;  // Mostra normal
    });
    
    // Eventos de clique (no texto ou na imagem)
    newBtn.label.addEventListener("click", function (c) {
        if (c.button == 0) this.parent.children[0].children[0].notify(); // Notifica leftClick
        if (c.button == 2) this.parent.children[0].children[1].notify(); // Notifica rightClick
    });
    newBtn.hoverImg.addEventListener("click", function (c) {
        if (c.button == 0) this.parent.children[0].notify(); // Notifica leftClick
        if (c.button == 2) this.parent.children[1].notify(); // Notifica rightClick
    });
    
    return newBtn;
}


// ============================================
// FUNÇÕES DE TOOLTIP (HELPTIP)
// ============================================

// Obtém o label de exibição de um módulo.
function D9T_GET_CTRL_LABEL(ctrlProperties) {
    if (!ctrlProperties) { return ""; }
    if (ctrlProperties.labelTxt) { return ctrlProperties.labelTxt; } // Usa o label definido
    if (ctrlProperties.key) {
        // Se não, formata o nome da chave (ex: "Finders")
        var friendly = ctrlProperties.key.replace(/_/g, " ");
        if (typeof friendly.toTitleCase === "function") {
            return friendly.toTitleCase();
        }
        return friendly;
    }
    return "";
}

// Normaliza o array de 'tips' (dicas) para um formato consistente.
function D9T_NORMALIZE_TIPS(tips) {
    var list = [];
    if (!tips) { return list; }
    var tipArray = Array.isArray(tips) ? tips.slice(0) : [tips];
    
    for (var i = 0; i < tipArray.length; i++) {
        var entry = tipArray[i];
        if (!entry) { continue; }
        
        // Se for string, apenas limpa e adiciona
        if (typeof entry === "string") {
            var cleaned = entry.replace(/\s+/g, " ").trim();
            if (cleaned) { list.push(cleaned); }
            continue;
        }
        
        // Se for objeto (formato avançado)
        if (typeof entry === "object") {
            var actionKey = "";
            if (entry.action) { actionKey = entry.action.toLowerCase(); }
            else if (entry.type) { actionKey = entry.type.toLowerCase(); }
            
            // Adiciona prefixos (ex: "Clique esquerdo")
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

// Constrói as linhas do helpTip (usando fallbacks se 'tips' não for definido).
function D9T_BUILD_TIP_LINES(ctrlProperties) {
    var lines = D9T_NORMALIZE_TIPS(ctrlProperties ? ctrlProperties.tips : null);
    
    // Se nenhuma dica foi definida, cria dicas padrão
    if (!lines.length) {
        var autoLabel = D9T_GET_CTRL_LABEL(ctrlProperties);
        if (autoLabel) { lines.push(autoLabel); } // "Finders"
        var leftMsg = (typeof lClick === "string" && lClick.length) ? lClick : "Clique esquerdo";
        lines.push(leftMsg + " para executar."); // "Clique esquerdo para executar."
        if (typeof rClick === "string" && rClick.length) {
            lines.push(rClick + " para ver opções adicionais."); // "Clique direito para..."
        }
    }
    return lines;
}

// Constrói o texto final do helpTip, juntando as linhas com quebra de linha dupla.
function D9T_BUILD_TIP_TEXT(ctrlProperties) {
    var lines = D9T_BUILD_TIP_LINES(ctrlProperties);
    return lines.join("\n\n"); // Duas quebras de linha para espaçamento
}


// ============================================
// LÓGICA DE BUSCA
// ============================================

var D9T_DEFAULT_SEARCH_CONTEXT = "modules";
var D9T_SEARCH_CONTEXTS = {
    modules: {
        labelText: "BUSCAR | modulos",
        placeholder: "Buscar modulos...",
        labelHelpTip: "Filtra modulos por nome, descricao, tags ou seccao.",
        fieldHelpTip: "Digite um termo ou varias palavras para localizar modulos rapidamente."
    },
    projects: {
        labelText: "BUSCAR | projetos",
        placeholder: "Buscar arquivos e projetos...",
        labelHelpTip: "Modo focado em buscas por projetos e arquivos mapeados.",
        fieldHelpTip: "Pesquise por nome de projeto, pasta ou servidor."
    },
    network: {
        labelText: "BUSCAR | rede",
        placeholder: "Buscar atalhos de rede...",
        labelHelpTip: "Modo dedicado para localizar caminhos de rede favoritos.",
        fieldHelpTip: "Digite parte do caminho, servidor ou apelido salvo."
    }
};

function D9T_GET_SEARCH_CONTEXT(uiObj) {
    var key = (uiObj && uiObj.currentSearchContext) || D9T_DEFAULT_SEARCH_CONTEXT;
    if (!D9T_SEARCH_CONTEXTS[key]) { key = D9T_DEFAULT_SEARCH_CONTEXT; }
    return { key: key, data: D9T_SEARCH_CONTEXTS[key] };
}

function D9T_REFRESH_SEARCH_CONTEXT_UI(uiObj, preserveInput) {
    if (!uiObj) { return; }
    var context = D9T_GET_SEARCH_CONTEXT(uiObj);
    var data = context.data;

    if (uiObj.searchLabel && data.labelText) {
        uiObj.searchLabel.text = data.labelText;
        if (data.labelHelpTip) { uiObj.searchLabel.helpTip = data.labelHelpTip; }
    }

    if (uiObj.searchField) {
        uiObj.searchPlaceholderText = data.placeholder || "Buscar...";
        var shouldResetPlaceholder = uiObj.searchField.__placeholder || preserveInput !== true;
        if (shouldResetPlaceholder) {
            uiObj.searchField.__placeholder = true;
            uiObj.searchField.text = uiObj.searchPlaceholderText;
            setFgColor(uiObj.searchField, D9T_Theme.colors.mono2);
        }
        if (data.fieldHelpTip) { uiObj.searchField.helpTip = data.fieldHelpTip; }
    }
}

function D9T_SET_SEARCH_CONTEXT(uiObj, contextKey, preserveInput) {
    if (!uiObj) { return; }
    if (contextKey && D9T_SEARCH_CONTEXTS[contextKey]) {
        uiObj.currentSearchContext = contextKey;
    } else if (!uiObj.currentSearchContext) {
        uiObj.currentSearchContext = D9T_DEFAULT_SEARCH_CONTEXT;
    }
    D9T_REFRESH_SEARCH_CONTEXT_UI(uiObj, preserveInput === true);
}

/**
 * Registra um módulo no índice de busca.
 * @param {Object} uiObj - O objeto D9T_ui.
 * @param {String} ctrlKey - A chave do controle (ex: "Finders").
 * @param {Object} ctrlProperties - O objeto de propriedades do módulo.
 * @param {String} sectionKey - A chave da seção (ex: "section1").
 */

function D9T_REGISTER_MODULE(uiObj, ctrlKey, ctrlProperties, sectionKey) {
    if (!uiObj.moduleIndex) { uiObj.moduleIndex = []; }
    
    var displayName = D9T_GET_CTRL_LABEL(ctrlProperties) || ctrlKey;
    var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
    var sectionText = sectionKey ? sectionKey.replace(/_/g, ' ') : '';
    var description = [tipTxt.replace(/\s+/g, ' '), sectionText].join(' ').trim();
    var tagList = [];

    function D9T_PUSH_TAG_VALUE(value) {
        if (value === null || value === undefined) { return; }
        if (value instanceof Array) {
            for (var t = 0; t < value.length; t++) {
                D9T_PUSH_TAG_VALUE(value[t]);
            }
        } else if (typeof value === "string" && value.length) {
            tagList.push(value);
        }
    }

    D9T_PUSH_TAG_VALUE(ctrlProperties.searchTags);
    D9T_PUSH_TAG_VALUE(ctrlProperties.tags);
    D9T_PUSH_TAG_VALUE(ctrlProperties.keywords);
    
    var tagBlob = tagList.join(' ');
    // Cria um blob de texto (tudo em minusculas) para facilitar a busca
    var searchBlob = (displayName + ' ' + ctrlKey + ' ' + description + ' ' + tagBlob).toLowerCase();
    
    // Adiciona ao indice
    uiObj.moduleIndex.push({
        key: ctrlKey,
        keyLower: ctrlKey.toLowerCase(),
        labelLower: displayName.toLowerCase(),
        descriptionLower: description.toLowerCase(),
        tagsLower: tagBlob.toLowerCase(),
        searchBlob: searchBlob,
        searchBlobNormalized: D9T_NORMALIZE_TERM(searchBlob),
        labelNormalized: D9T_NORMALIZE_TERM(displayName),
        keyNormalized: D9T_NORMALIZE_TERM(ctrlKey),
        descriptionNormalized: D9T_NORMALIZE_TERM(description),
        tagsNormalized: D9T_NORMALIZE_TERM(tagBlob),
        displayName: displayName,
        ctrlRef: uiObj[ctrlKey] // Referencia direta ao botao
    });
}

// Normaliza um termo de busca (converte para string, minusculas e remove acentos)
function D9T_NORMALIZE_TERM(value) {
    var normalized = (value || "").toString().toLowerCase();
    if (!normalized.length) { return ""; }
    try {
        normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (normErr) {}
    return normalized;
}


/**
 * Configura os eventos e o placeholder do campo de busca.
 * @param {Object} uiObj - O objeto D9T_ui.
 */
function D9T_SETUP_SEARCH(uiObj) {
    if (!uiObj.searchField || !uiObj.searchDropdown) { return; }
    
    uiObj.searchField.__placeholder = true; // Flag para controlar o placeholder
    if (!uiObj.currentSearchContext) { uiObj.currentSearchContext = D9T_DEFAULT_SEARCH_CONTEXT; }
    D9T_SET_SEARCH_CONTEXT(uiObj, uiObj.currentSearchContext);

    // Evento: Ao clicar no campo
    uiObj.searchField.onActivate = function () {
        if (this.__placeholder) {
            this.text = ""; // Limpa
            this.__placeholder = false;
            setFgColor(this, D9T_Theme.colors.textNormal); // Cor normal
        }
    };

    // Evento: Ao digitar
    uiObj.searchField.onChanging = function () {
        if (this.__placeholder) {
            // Se começar a digitar sem clicar, limpa o placeholder
            this.__placeholder = false;
            this.text = "";
            setFgColor(this, D9T_Theme.colors.textNormal);
        }
        D9T_UPDATE_SEARCH_RESULTS(uiObj, this.text); // Atualiza a lista dropdown
    };

    // Evento: Ao sair do campo
    uiObj.searchField.onDeactivate = function () {
        if (!this.text.length) {
            // Se sair e estiver vazio, restaura o placeholder
            this.__placeholder = true;
            this.text = uiObj.searchPlaceholderText || "";
            setFgColor(this, D9T_Theme.colors.mono2);
            if (!uiObj.__searchModeActive && uiObj.searchDropdown) {
                uiObj.searchDropdown.removeAll(); // Limpa resultados se não estiver no modo busca
            }
        }
    };

    // Eventos de teclado no campo de busca
    uiObj.searchField.addEventListener("keydown", function (evt) {
        if (evt.keyName === "Enter") {
            D9T_TRIGGER_SEARCH_ACTION(uiObj); // Executa a busca/módulo
        } else if (evt.keyName === "Down") {
            // Seta para baixo foca no dropdown
            if (uiObj.searchDropdown.items.length) {
                try { uiObj.searchDropdown.active = true; } catch (focusErr) {}
                uiObj.searchDropdown.selection = 0;
            }
        }
    });

    // Evento de clique no botão OK da busca
    if (uiObj.searchButton) {
        uiObj.searchButton.onClick = function () {
            if (uiObj.searchDropdown && uiObj.searchDropdown.selection) {
                D9T_LAUNCH_SEARCH_SELECTION(uiObj); // Lança o item selecionado
            } else {
                D9T_TRIGGER_SEARCH_ACTION(uiObj); // Lança o primeiro item
            }
        };
    }

    // Evento de teclado no dropdown
    uiObj.searchDropdown.addEventListener("keydown", function (evt) {
        if (evt.keyName === "Enter") {
            D9T_LAUNCH_SEARCH_SELECTION(uiObj); // Lança o item selecionado
        }
    });
}

/**
 * Filtra e pontua os módulos com base no termo de busca e atualiza o dropdown.
 * @param {Object} uiObj - O objeto D9T_ui.
 * @param {String} term - O termo de busca.
 */
function D9T_UPDATE_SEARCH_RESULTS(uiObj, term) {
    if (!uiObj.moduleIndex || !uiObj.searchDropdown) { return; }
    
    var dropdown = uiObj.searchDropdown;
    dropdown.removeAll();
    var cleanTerm = D9T_NORMALIZE_TERM(term).replace(/\s+/g, ' ');
    cleanTerm = cleanTerm.replace(/^\s+|\s+$/g, '');
    var tokens = cleanTerm.length ? cleanTerm.split(' ') : [];
    var modules = uiObj.moduleIndex.slice(0);
    var scored = [];

    for (var i = 0; i < modules.length; i++) {
        var entry = modules[i];
        if (!entry) { continue; }

        var score = 5;
        if (tokens.length) {
            var totalScore = 0;
            var matchedTokens = 0;
            var tokenMismatch = false;
            for (var t = 0; t < tokens.length; t++) {
                var tokenScore = D9T_SCORE_ENTRY_TOKEN(entry, tokens[t]);
                if (tokenScore === null) {
                    tokenMismatch = true;
                    break;
                }
                totalScore += tokenScore;
                matchedTokens++;
            }
            if (tokenMismatch) { continue; }
            score = totalScore / Math.max(matchedTokens, 1);
        } else if (cleanTerm.length) {
            var fallbackScore = D9T_SCORE_ENTRY_TOKEN(entry, cleanTerm);
            if (fallbackScore === null) { continue; }
            score = fallbackScore;
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
        var item = dropdown.add('item', itemEntry.displayName);
        item.entryRef = itemEntry;
    }
    
    if (dropdown.items.length) {
        dropdown.selection = 0;
    }
}

function D9T_SCORE_ENTRY_TOKEN(entry, token) {
    if (!entry || !token) { return null; }
    if (entry.labelNormalized && entry.labelNormalized.indexOf(token) === 0) { return 0; }
    if (entry.labelNormalized && entry.labelNormalized.indexOf(token) > -1) { return 0.5; }
    if (entry.keyNormalized && entry.keyNormalized.indexOf(token) === 0) { return 0.75; }
    if (entry.keyNormalized && entry.keyNormalized.indexOf(token) > -1) { return 1; }
    if (entry.tagsNormalized && entry.tagsNormalized.indexOf(token) > -1) { return 1.25; }
    if (entry.descriptionNormalized && entry.descriptionNormalized.indexOf(token) > -1) { return 1.5; }
    if (entry.searchBlobNormalized && entry.searchBlobNormalized.indexOf(token) > -1) { return 2; }
    return null;
}

// Executa o módulo selecionado no dropdown.
function D9T_LAUNCH_SEARCH_SELECTION(uiObj) {
    if (!uiObj.searchDropdown || !uiObj.searchDropdown.items.length) { return; }
    var selection = uiObj.searchDropdown.selection;
    if (!selection) { selection = uiObj.searchDropdown.items[0]; } // Fallback
    if (selection && selection.entryRef) {
        D9T_EXECUTE_MODULE(selection.entryRef);
    }
}

// Dispara o evento de clique no módulo.
function D9T_EXECUTE_MODULE(entry) {
    if (!entry || !entry.ctrlRef) { return; }
    try {
        if (entry.ctrlRef.leftClick) {
            entry.ctrlRef.leftClick.notify(); // Simula clique esquerdo
            return;
        }
        // Fallback (raro)
        if (entry.ctrlRef.rightClick) {
            entry.ctrlRef.rightClick.notify();
        }
    } catch (err) {
        $.writeln("Falha ao executar modulo '" + entry.displayName + "': " + err);
    }
}

// Limpa o campo de busca e restaura o placeholder.
function D9T_CLEAR_SEARCH(uiObj, keepDropdown) {
    if (!uiObj || !uiObj.searchField) { return; }
    if (uiObj.searchDropdown && keepDropdown !== true) { uiObj.searchDropdown.removeAll(); }
    if (!uiObj.searchPlaceholderText) { return; }
    
    uiObj.searchField.__placeholder = true;
    uiObj.searchField.text = uiObj.searchPlaceholderText;
    setFgColor(uiObj.searchField, D9T_Theme.colors.mono2);
}

// Usado para executar a ação (Enter)
function D9T_TRIGGER_SEARCH_ACTION(uiObj) {
    if (!uiObj || !uiObj.searchField) { return; }
    // Atualiza os resultados (caso o usuário tenha digitado e apertado Enter sem esperar)
    D9T_UPDATE_SEARCH_RESULTS(uiObj, uiObj.searchField.__placeholder ? "" : uiObj.searchField.text);
    // Lança o primeiro resultado
    D9T_LAUNCH_SEARCH_SELECTION(uiObj);
}

// Chamado ao entrar no modo busca (foca e limpa o campo)
function D9T_ENTER_SEARCH_MODE(uiObj) {
    if (!uiObj) { return; }
    if (uiObj.searchField) {
        if (uiObj.searchField.__placeholder) {
            uiObj.searchField.text = "";
            uiObj.searchField.__placeholder = false;
            setFgColor(uiObj.searchField, D9T_Theme.colors.textNormal);
        }
        try { uiObj.searchField.active = true; } catch (e) {} // Foca no campo
    }
    D9T_UPDATE_SEARCH_RESULTS(uiObj, ""); // Popula a lista com todos os módulos
}

// Chamado ao sair do modo busca (limpa o campo)
function D9T_EXIT_SEARCH_MODE(uiObj) {
    if (!uiObj) { return; }
    D9T_CLEAR_SEARCH(uiObj);
}

// ============================================
// JANELA DE AÇÕES E CONFIGURAÇÕES (MENU)
// ============================================

/**
 * Constrói e exibe a janela do menu "hamburger".
 * @param {Object} uiObj - O objeto D9T_ui.
 */
function D9T_SHOW_ACTION_MENU(uiObj) {
    uiObj = uiObj || D9T_ui;
    var menuWin = new Window("palette", "Configurações");
    menuWin.orientation = "column";
    menuWin.alignChildren = "fill";
    menuWin.margins = 18;
    menuWin.spacing = 10;
    try { setBgColor(menuWin, bgColor1); } catch (e) {}

    // --- 1. Cabeçalho do Menu ---
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
    
    // Botão de Ajuda (?)
    if (typeof themeIconButton === "function" && typeof D9T_INFO_ICON !== "undefined") {
        try {
            helpBtn = new themeIconButton(helpBtnGrp, { icon: D9T_INFO_ICON, tips: ["Ajuda sobre este painel"] });
        } catch (err0) {}
    }
    if (!helpBtn) { // Fallback
        helpBtn = helpBtnGrp.add("button", undefined, "?");
        helpBtn.preferredSize = [24, 24];
    }
    // Anexa o evento ao botão de ajuda
    var attachHelp = function(btn) {
        if (!btn) { return; }
        var handler = function() {
            D9T_SHOW_ACTION_MENU_HELP(); // Chama a janela de ajuda específica
        };
        if (btn.leftClick) { btn.leftClick.onClick = handler; }
        else { btn.onClick = handler; }
    };
    attachHelp(helpBtn);

    // --- 2. Definição da Estrutura do Menu ---
    var sections = [
        {
            title: "Ferramentas",
            description: "Configurações para manutenção e layout.",
            column: 0, // Coluna da esquerda
            items: [
                { label: "Alterar cores globais", desc: "Abre o painel ColorChange para redefinir o tema.", action: D9T_OPEN_COLOR_GLOBALS },
                { label: "Atualizar script (GitHub)", desc: "Executa git pull no diretório do script.", action: D9T_PULL_FROM_GITHUB },
                { label: "Configurar ícones", desc: "Abre a janela para ajustar tamanho e espaçamentos.", action: function () { D9T_OPEN_ICON_SETTINGS_WINDOW(uiObj); } },
                { label: "Tema dos botões", desc: "Define largura, cores e arredondamento dos presets reutilizáveis.", action: function () { D9T_OPEN_BUTTON_THEME_WINDOW(uiObj); } }
            ]
        },
        {
            title: "Configurações",
            description: "Arquivos principais e ajustes que afetam todo o GND9TOOLS.",
            column: 1, // Coluna da direita
            items: [
                { label: "Configuração de usuários", desc: "Edita runtime/config/User_Preferences.json.", action: function () { D9T_OPEN_JSON_CONFIG(runtimePrefsPath + "/User_Preferences.json"); } },
                { label: "Configuração de sistema", desc: "Gerencia runtime/config/System_Settings.json.", action: function () { D9T_OPEN_JSON_CONFIG(runtimeConfigPath + "/System_Settings.json"); } },
                { label: "Biblioteca de dados", desc: "Acessa runtime/config/Dados_Config.json.", action: function () { D9T_OPEN_JSON_CONFIG(runtimeConfigPath + "/Dados_Config.json"); } }
            ]
        }
    ];

    // --- 3. Construção do Corpo (Colunas) ---
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
    var columns = [colLeft, colRight]; // Array de colunas

    // Função auxiliar para criar uma seção (card)
    function createSection(section) {
        var card = columns[Math.min(section.column || 0, columns.length - 1)].add("panel", undefined, section.title.toUpperCase());
        card.alignment = ["fill", "top"];
        card.margins = [12, 18, 12, 12];
        card.spacing = 10;
        try { setBgColor(card, bgColor2); } catch (cardErr) {} // Cor de fundo do painel
        
        // Descrição da seção
        var desc = card.add("statictext", undefined, section.description || "", { multiline: true });
        desc.maximumSize.width = 240;
        setFgColor(desc, D9T_Theme.colors.textNormal);

        // Loop pelos itens (botões) da seção
        for (var i = 0; i < section.items.length; i++) {
            (function(entry) {
                var entryGrp = card.add("group");
                entryGrp.orientation = "column";
                entryGrp.alignChildren = ["fill", "top"];
                entryGrp.spacing = 4;
                
                // Botao estilizado
                var themedWrapper = null;
                var btn = null;
                if (typeof themeButton === "function") {
                    try {
                        themedWrapper = new themeButton(entryGrp, { labelTxt: entry.label, width: 260 });
                        btn = (themedWrapper && themedWrapper.label) ? themedWrapper.label : null;
                    } catch (themeErr) {
                        btn = null;
                    }
                }
                if (!btn) {
                    btn = entryGrp.add("button", undefined, entry.label);
                    btn.preferredSize = [260, 26];
                    try { setBgColor(btn, D9T_Theme.colors.divider); } catch (bgErr) {}
                    setFgColor(btn, D9T_Theme.colors.textNormal);
                    if (typeof setCtrlHighlight === "function") {
                        setCtrlHighlight(btn, D9T_Theme.colors.textNormal, D9T_Theme.colors.textHighlight);
                    }
                }
                var triggerAction = function () {
                    try { entry.action(uiObj); }
                    catch (err) { alert("Falha ao executar '" + entry.label + "': " + err); }
                };
                if (themedWrapper && themedWrapper.leftClick) {
                    themedWrapper.leftClick.onClick = triggerAction;
                }
                if (btn) {
                    btn.helpTip = entry.desc || entry.label;
                    btn.onClick = triggerAction;
                }
                // Descrição do botão (hint)
                if (entry.desc) {
                    var hint = entryGrp.add("statictext", undefined, entry.desc, { multiline: true });
                    hint.maximumSize.width = 260;
                    setFgColor(hint, D9T_Theme.colors.mono2); // Cor cinza
                }
            })(section.items[i]);
        }
    }

    // Cria as seções definidas no array 'sections'
    for (var s = 0; s < sections.length; s++) {
        createSection(sections[s]);
    }

    // --- 4. Rodapé ---
    var footerGrp = menuWin.add("group");
    footerGrp.alignment = ["fill", "top"];
    var tipTxt = footerGrp.add("statictext", undefined, "Use o ícone ? para consultar a ajuda completa deste menu.");
    setFgColor(tipTxt, D9T_Theme.colors.mono2);

    menuWin.show(); // Exibe a janela de menu
}

// Atalho para a janela de cores (chamado pelo menu)
function D9T_OPEN_COLOR_GLOBALS() {
    D9T_OPEN_THEME_DIALOG(D9T_ui);
}

function D9T_PICK_COLOR(baseValue) {
    var seed = 0;
    if (typeof baseValue === "string" && baseValue.length) {
        var clean = baseValue.replace(/[^0-9a-fA-F]/g, "");
        if (clean.length >= 6) {
            var parsed = parseInt(clean.substring(0, 6), 16);
            if (!isNaN(parsed)) { seed = parsed; }
        }
    }
    var result = $.colorPicker(seed);
    if (result < 0 || isNaN(result)) { return null; }
    return "#" + ("000000" + result.toString(16)).slice(-6).toUpperCase();
}

// Exibe a janela de ajuda do menu (usando HELP lib.js)
function D9T_SHOW_ACTION_MENU_HELP() {
    // Tenta usar a função específica
    if (typeof showActionMenuHelp === "function") {
        showActionMenuHelp();
        return;
    }
    // Fallback se a função de ajuda não for encontrada
    if (typeof createHelpWindow !== "function") {
        alert("Ajuda indisponível (createHelpWindow não encontrado).");
        return;
    }
    // Dados de ajuda padrão
    var fallbackData = [
        {
            tabName: "Configurações",
            topics: [
                { title: "Alterar cores globais", text: "Abre o módulo de alteração de tema (ColorChange)." },
                { title: "Configuração de usuários", text: "Abre runtime/config/User_Preferences.json." },
                { title: "Configuração de sistema", text: "Abre runtime/config/System_Settings.json." },
                { title: "Biblioteca de dados", text: "Abre runtime/config/Dados_Config.json." }
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

/**
 * Constrói e exibe a janela de personalização de cores.
 * @param {Object} uiObj - O objeto D9T_ui (para aplicar o tema ao vivo).
 */
function D9T_OPEN_THEME_DIALOG(uiObj) {
  uiObj = uiObj || D9T_ui;
  // Carrega as cores padrão e as atuais
  var defaults = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.themeColors) ? defaultScriptPreferencesObj.themeColors : {};
  var current = (scriptPreferencesObj && scriptPreferencesObj.themeColors) ? scriptPreferencesObj.themeColors : defaults;
  
  // Lista de cores editáveis
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

  // --- 1. Criação da Janela ---
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

  var fieldMap = {}; // Armazena os campos de texto por chave

  // --- 2. Funções Auxiliares de Cor ---
  
  // Valida e formata um string HEX
  function tryParseHex(value) {
    if (typeof value !== "string") { return null; }
    var clean = value.replace(/[^0-9a-fA-F]/g, "");
    if (clean.length === 6 || clean.length === 8) {
      return ("#" + clean).toUpperCase();
    }
    return null;
  }

  // Atualiza a cor do 'swatch' (amostra) ao lado do campo
  function updateSwatch(field) {
    if (!field || !field.__swatch) { return; }
    var parsed = tryParseHex(field.text);
    if (parsed) {
      try { setBgColor(field.__swatch, parsed); } catch (e) {}
    }
  }

  // Define o valor de um campo
  function setFieldValue(field, value) {
    if (!field) { return; }
    field.text = value || "";
    updateSwatch(field);
  }

  // --- 3. Loop de Criação dos Campos ---
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
    
    var swatch = row.add("panel"); // Amostra de cor
    swatch.preferredSize = [26, 16];
    swatch.helpTip = "Clique para abrir o seletor de cores.";
    
    field.__swatch = swatch; // Associa a amostra ao campo
    fieldMap[entry.key] = field; // Salva a referência do campo
    
    // Eventos para este campo e amostra
    (function(refField, refSwatch) {
      var refresh = function () { updateSwatch(refField); };
      refField.onChanging = refresh; // Atualiza amostra ao digitar
      refField.onChange = refresh;
      refresh(); // Atualiza na criação
      
      var launchPicker = function () {
        var choice = D9T_PICK_COLOR(refField.text); // Abre o seletor
        if (!choice) { return; }
        refField.text = choice;
        updateSwatch(refField);
        
        // Aplica preview ao vivo
        var previewValues = collectValues();
        if (previewValues) {
          applyTheme(previewValues, false); // false = não salvar
        }
      };
      refSwatch.addEventListener("click", launchPicker); // Clique na amostra
    })(field, swatch);
  }

  // --- 4. Funções de Ação (Aplicar, Coletar) ---
  
  // Lê todos os campos e valida
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

  // Aplica os valores ao tema global e salva (opcional)
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
        $.writeln("[main_ui_functions] Falha ao aplicar tema via D9T_Preferences: " + prefsErr);
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
      if (persist) { D9T_COMMIT_PREFERENCES(); }
    }
    if (typeof D9T_APPLY_THEME_TO_ROOT === "function") {
      try { D9T_APPLY_THEME_TO_ROOT(uiObj); } catch (applyErr) {
        $.writeln("[main_ui_functions] Falha ao aplicar tema na UI principal: " + applyErr);
      }
    }
    if (uiObj && uiObj.window && typeof D9T_LAYOUT === "function") {
      try { D9T_LAYOUT(uiObj); } catch (layoutErr) {
        $.writeln("[main_ui_functions] Falha ao redesenhar UI principal: " + layoutErr);
      }
    }
  }

  // --- 5. Botões de Ação (Resetar, Aplicar) ---
  var btnGrp = win.add("group");
  btnGrp.alignment = ["fill", "top"];
  btnGrp.spacing = 8;
  var resetBtn = btnGrp.add("button", undefined, "Resetar");
  var saveBtn = btnGrp.add("button", undefined, "Aplicar");

  // Restaura os padrões
  resetBtn.onClick = function () {
    for (var r = 0; r < colorEntries.length; r++) {
      var entry = colorEntries[r];
      setFieldValue(fieldMap[entry.key], defaults[entry.key]);
    }
    applyTheme(defaults, true); // true = salvar
  };

  // Salva os valores atuais
  saveBtn.onClick = function () {
    var values = collectValues();
    if (!values) { return; } // Aborta se houver valor inválido
    applyTheme(values, true); // true = salvar
  };

  win.show();
}

/**
 * Abre um arquivo de configuração JSON no editor padrão do sistema.
 * @param {String} fileName - O nome do arquivo (ex: "User_Preferences.json").
 */
function D9T_OPEN_JSON_CONFIG(fileName) {
    // Se vier um caminho absoluto ou relativo completo, tenta direto
    var direct = new File(fileName);
    if (direct.exists) {
        direct.execute();
        return;
    }

    var basePaths = [];
    // Caminhos onde o arquivo pode estar
    if (typeof runtimePrefsPath === "string") { basePaths.push(runtimePrefsPath); }
    if (typeof runtimeConfigPath === "string") { basePaths.push(runtimeConfigPath); }
    if (typeof scriptPreferencesPath === "string") { basePaths.push(scriptPreferencesPath); }
    
    // Procura e executa
    for (var i = 0; i < basePaths.length; i++) {
        var target = new File(basePaths[i] + "/" + fileName);
        if (target.exists) {
            target.execute(); // Abre no editor padrão (ex: VS Code, Bloco de Notas)
            return;
        }
    }
    alert("Arquivo nao encontrado em nenhum caminho conhecido:\n" + fileName);
}

function D9T_PULL_FROM_GITHUB() {
    // ==========================================================
    // 1. CONFIGURAÇÃO (PREENCHA SEUS DADOS AQUI)
    // ==========================================================
    var githubUser = "rdenoni";  // Ex: rdenoni
    var repoName   = "GNEWS-D9-TOOLS";    // O nome exato do repositório
    var branch     = "main";         // Geralmente 'main' ou 'master'
    
    // Cole seu Token abaixo, DENTRO das aspas.
    // Ex: "ghp_xxXYyy..."
    var token      = "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"; 
    // ==========================================================

    var isWin = ($.os.indexOf("Win") !== -1);
    if (!isWin) {
        alert("O update automático sem Git foi configurado apenas para Windows.");
        return;
    }

    // Monta a URL do ZIP
    var zipUrl = "https://github.com/" + githubUser + "/" + repoName + "/archive/refs/heads/" + branch + ".zip";
    
    // Define caminhos locais
    var installPath = new Folder(scriptMainPath).fsName; 
    var tempPath = Folder.temp.fsName;
    var zipFile = tempPath + "\\update_temp.zip";
    var extractFolder = tempPath + "\\update_extracted";
    
    // O GitHub extrai numa pasta com nome "Repo-Branch", ex: "GND9TOOLS-main"
    var sourceFolder = extractFolder + "\\" + repoName + "-" + branch;

    // Lógica de Autenticação para o PowerShell
    // Se houver token, cria o parâmetro de cabeçalho para o Invoke-WebRequest
    var headerCmd = "";
    if (token && token.length > 5) {
        headerCmd = " -Headers @{Authorization = 'token " + token + "'}";
    }

    // Confirmação de segurança para o usuário
    if (!confirm("Isso vai baixar a versão mais recente do GitHub e substituir os arquivos locais.\n\nDeseja continuar?")) {
        return;
    }

    // ==========================================================
    // 2. COMANDO POWERSHELL
    // ==========================================================
    // Este comando roda em uma linha só (encapsulado) para evitar problemas de sessão
    var psCommand = 'powershell -Command "& { ' +
        '$ProgressPreference = \'SilentlyContinue\'; ' + // Esconde barra de progresso do terminal
        'try { ' +
            // A. Permite conexão segura (TLS 1.2) exigida pelo GitHub
            '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ' +
            
            // B. Baixa o arquivo ZIP (Com autenticação se tiver token)
            'Write-Host \'Baixando...\'; ' +
            'Invoke-WebRequest -Uri \'' + zipUrl + '\'' + headerCmd + ' -OutFile \'' + zipFile + '\'; ' +
            
            // C. Extrai o ZIP
            'Write-Host \'Extraindo...\'; ' +
            'if (Test-Path \'' + extractFolder + '\') { Remove-Item \'' + extractFolder + '\' -Recurse -Force }; ' +
            'Expand-Archive -Path \'' + zipFile + '\' -DestinationPath \'' + extractFolder + '\' -Force; ' +
            
            // D. Copia os arquivos novos para a pasta do script (Sobrescrevendo tudo)
            'Write-Host \'Instalando...\'; ' +
            'Copy-Item -Path \'' + sourceFolder + '\\*\' -Destination \'' + installPath + '\' -Recurse -Force; ' +
            
            // E. Limpeza dos arquivos temporários
            'Remove-Item \'' + zipFile + '\' -Force; ' +
            'Remove-Item \'' + extractFolder + '\' -Recurse -Force; ' +
            
            'Write-Host \'SUCESSO\'; ' +
        '} catch { ' +
            'Write-Host \'ERRO: \' $_.Exception.Message; ' +
        '}' +
    '}"';

    // Prepara o comando para o CMD do Windows
    var cmdCall = 'cmd /c "' + psCommand + '"';
    
    // Janela visual de "Aguarde" (ScriptUI)
    var w = new Window("palette", "Atualizando...", undefined, {closeButton: false});
    w.add("statictext", undefined, "Baixando atualizações do GitHub...");
    w.add("statictext", undefined, "O After Effects pode travar por alguns segundos.");
    w.show();
    w.update(); // Força o desenho da janela antes de travar o processo

    var result = "";
    try {
        // Tenta executar o comando
        if (system && system.callSystem) {
            result = system.callSystem(cmdCall);
        } else {
            // Fallback para versões antigas do AE
            app.system(cmdCall);
            result = "SUCESSO (Modo compatibilidade)"; 
        }
        
        w.close(); // Fecha a janelinha

        // Verifica o resultado do texto retornado pelo PowerShell
        if (result.indexOf("SUCESSO") !== -1) {
            alert("✅ Script Atualizado com Sucesso!\n\nPor favor, feche e abra o painel novamente para ver as mudanças.");
        } else {
            // Tratamento de erros comuns
            if (result.indexOf("404") !== -1) {
                alert("❌ Erro 404: Repositório não encontrado.\nVerifique se o nome do usuário e do repositório estão corretos no script.");
            } else if (result.indexOf("403") !== -1) {
                alert("❌ Erro 403: Acesso Negado.\nVerifique se o seu TOKEN está correto e tem permissão de leitura ('repo').");
            } else {
                alert("❌ Erro na atualização:\n" + result);
            }
        }

    } catch (e) {
        w.close();
        alert("Erro crítico ao tentar executar o sistema: " + e.toString());
    }
}
function D9T_OPEN_ICON_SETTINGS_WINDOW(uiObj) {
    uiObj = uiObj || D9T_ui;
    var current = D9T_GET_ICON_SETTINGS(); // Configurações atuais
    var defaults = D9T_GET_DEFAULT_ICON_SETTINGS(); // Padrões

    // --- 1. Criação da Janela ---
    var win = new Window("palette", "Configuração de ícones");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.margins = 20;
    win.spacing = 12;
    try { setBgColor(win, bgColor1); } catch (e) {}

    var title = win.add("statictext", undefined, "Tamanho e espaçamento dos módulos");
    setFgColor(title, D9T_Theme.colors.textNormal);

    var modeSelectorGrp = win.add("group");
    modeSelectorGrp.alignment = ["fill", "top"];
    modeSelectorGrp.spacing = 8;
    var modeLabel = modeSelectorGrp.add("statictext", undefined, "Editar versão:");
    modeLabel.helpTip = "Escolha se deseja ajustar os parâmetros do layout horizontal ou vertical.";
    try { setFgColor(modeLabel, D9T_Theme.colors.textNormal); } catch (modeErr) {}
    var modeDropdown = modeSelectorGrp.add("dropdownlist", undefined, ["Horizontal", "Vertical"]);
    modeDropdown.alignment = ["left", "top"];
    modeDropdown.minimumSize = [160, 22];
    modeDropdown.selection = 0;
    modeDropdown.helpTip = "Alterne entre as configurações exibidas para cada orientação.";

    var suppressModeEvent = false;
    var activeModeKey = "horizontal";
    var pendingSettings = null;
    var settingsDirty = false;

    var modeStack = win.add("group");
    modeStack.alignment = ["fill", "top"];
    modeStack.orientation = "stack";
    modeStack.alignChildren = ["fill", "top"];

// O containerWrapper foi removido. Os painéis são adicionados diretamente ao 'modeStack'.
    var horizontalContainer = modeStack.add("group");
    horizontalContainer.orientation = "column";
    horizontalContainer.alignChildren = ["fill", "top"];
    horizontalContainer.spacing = 8;

    var verticalContainer = modeStack.add("group");
    verticalContainer.orientation = "column";
    verticalContainer.alignChildren = ["fill", "top"];
    verticalContainer.spacing = 8;

    horizontalContainer.visible = true;
    verticalContainer.visible = false;

    function setModeView(modeKey) {
        activeModeKey = modeKey === "vertical" ? "vertical" : "horizontal";
        var showVertical = (activeModeKey === "vertical");
        horizontalContainer.visible = !showVertical;
        verticalContainer.visible = showVertical;
        if (modeDropdown.selection && modeDropdown.selection.index !== (showVertical ? 1 : 0)) {
            suppressModeEvent = true;
            modeDropdown.selection = showVertical ? 1 : 0;
            suppressModeEvent = false;
        }
        try {
            modeStack.layout.layout(true);
            win.layout.layout(true);
            try { win.layout.resize(); } catch (resizeErr) {}
        } catch (layoutErr) {}
    }

    // --- 2. Campos de Configuração (Modo Normal) ---
    
    // Tamanho (Largura, Altura) - visível apenas no modo horizontal
    var sizeGrp = horizontalContainer.add("group");
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
    var verticalSizeGrp = verticalContainer.add("group");
    verticalSizeGrp.alignment = ["fill", "top"];
    verticalSizeGrp.spacing = 8;
    verticalSizeGrp.add("statictext", undefined, "Largura (vertical):").helpTip = "Largura dos ícones quando o layout muda para coluna.";
    var verticalWidthField = verticalSizeGrp.add("edittext", undefined, current.verticalIconSize ? current.verticalIconSize[0] : current.iconSize[0]);
    verticalWidthField.characters = 4;
    verticalWidthField.helpTip = "Informe a largura usada no layout vertical.";
    verticalSizeGrp.add("statictext", undefined, "Altura (vertical):").helpTip = "Altura dos ícones na versão vertical.";
    var verticalHeightField = verticalSizeGrp.add("edittext", undefined, current.verticalIconSize ? current.verticalIconSize[1] : current.iconSize[1]);
    verticalHeightField.characters = 4;
    verticalHeightField.helpTip = "Informe a altura usada no layout vertical.";

    // Espaçamento (Entre ícones)
    var iconSpacingGrp = horizontalContainer.add("group");
    iconSpacingGrp.alignment = ["fill", "top"];
    iconSpacingGrp.spacing = 8;
    iconSpacingGrp.add("statictext", undefined, "Espaçamento dos ícones (px):").helpTip = "Controle a distância horizontal/vertical padrão entre os módulos.";
    var iconSpacingField = iconSpacingGrp.add("edittext", undefined, current.iconSpacing);
    iconSpacingField.characters = 4;
    iconSpacingField.helpTip = "Distância, em pixels, entre os ícones em layout normal.";
    var iconSpacingSlider = horizontalContainer.add("slider", undefined, current.iconSpacing, 0, 60);
    iconSpacingSlider.alignment = ["fill", "top"];
    iconSpacingSlider.helpTip = "Arraste para ajustar rapidamente o espaçamento entre ícones.";

    var verticalSpacingGrp = verticalContainer.add("group");
    verticalSpacingGrp.alignment = ["fill", "top"];
    verticalSpacingGrp.spacing = 8;
    verticalSpacingGrp.add("statictext", undefined, "Espaçamento vertical (px):").helpTip = "Controle específico para o layout em coluna.";
    var verticalSpacingField = verticalSpacingGrp.add("edittext", undefined, current.verticalIconSpacing);
    verticalSpacingField.characters = 4;
    verticalSpacingField.helpTip = "Distância entre módulos quando o painel está em modo vertical.";
    var verticalSpacingSlider = verticalContainer.add("slider", undefined, current.verticalIconSpacing, 0, 60);
    verticalSpacingSlider.alignment = ["fill", "top"];
    verticalSpacingSlider.helpTip = "Arraste para ajustar o espaçamento da versão vertical.";

    // Espaçamento (Ícone para Label)
    var labelSpacingGrp = horizontalContainer.add("group");
    labelSpacingGrp.alignment = ["fill", "top"];
    labelSpacingGrp.spacing = 8;
    labelSpacingGrp.add("statictext", undefined, "Espaçamento do label (px):").helpTip = "Define a folga entre o ícone e o texto do módulo.";
    var labelSpacingField = labelSpacingGrp.add("edittext", undefined, current.labelSpacing);
    labelSpacingField.characters = 4;
    labelSpacingField.helpTip = "Distância, em pixels, entre ícone e legenda.";
    var labelSpacingSlider = horizontalContainer.add("slider", undefined, current.labelSpacing, 0, 40);
    labelSpacingSlider.alignment = ["fill", "top"];
    labelSpacingSlider.helpTip = "Ajuste visual do respiro entre ícones e labels.";

    // Tamanho da fonte do label

    // Checkbox (Mostrar Labels)
    var showLabelsGrp = horizontalContainer.add("group");
    showLabelsGrp.alignment = ["fill", "top"];
    showLabelsGrp.alignChildren = ["left", "center"];
    showLabelsGrp.spacing = 6;
    var showLabelsCheckbox = showLabelsGrp.add("checkbox", undefined, "Exibir textos nos módulos");
    showLabelsCheckbox.value = current.showLabels !== false;
    showLabelsCheckbox.helpTip = "Alterna a exibição dos nomes abaixo dos ícones quando houver espaço disponível.";
    try { setFgColor(showLabelsCheckbox, D9T_Theme.colors.textNormal); } catch (fgErr) {}

    // Espaçamento (Modo "Icon Only")
    var iconOnlySpacingGrp = horizontalContainer.add("group");
    iconOnlySpacingGrp.alignment = ["fill", "top"];
    iconOnlySpacingGrp.spacing = 8;
    iconOnlySpacingGrp.add("statictext", undefined, "Espaçamento só ícones (px):").helpTip = "Define o espaçamento utilizado quando os labels estão ocultos.";
    var iconOnlySpacingField = iconOnlySpacingGrp.add("edittext", undefined, current.iconOnlySpacing);
    iconOnlySpacingField.characters = 4;
    iconOnlySpacingField.helpTip = "Valor em pixels para o layout compacto sem labels.";
    var iconOnlySpacingSlider = horizontalContainer.add("slider", undefined, current.iconOnlySpacing, 0, 60);
    iconOnlySpacingSlider.alignment = ["fill", "top"];
    iconOnlySpacingSlider.helpTip = "Arraste para definir a distância entre ícones quando não há texto.";

    setModeView("horizontal");
    win.onShow = function () {
        setModeView(activeModeKey);
    };
    modeDropdown.onChange = function () {
        if (suppressModeEvent) { return; }
        var key = (this.selection && this.selection.index === 1) ? "vertical" : "horizontal";
        setModeView(key);
    };

    // --- 3. Painel de Configuração (Modo Compacto) ---
    var compactGrp = win.add("panel", undefined, "Modo compacto");
    compactGrp.alignment = ["fill", "top"];
    compactGrp.margins = [12, 16, 12, 12];
    compactGrp.orientation = "column";
    compactGrp.spacing = 6;
    compactGrp.helpTip = "Configurações aplicadas quando o painel entra em modo compacto.";
    
    // Tamanho Compacto
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
    
    // Espaçamento Compacto
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

    // --- 4. Presets e Botões de Ação ---
    
    // Presets (HD, 4K)
    var presetGrp = win.add("group");
    presetGrp.alignment = ["fill", "top"];
    presetGrp.spacing = 10;
    var hdBtn = presetGrp.add("button", undefined, "Preset HD");
    var kBtn = presetGrp.add("button", undefined, "Preset 4K");
    hdBtn.helpTip = "Aplica um conjunto de valores ideal para telas 1080p.";
    kBtn.helpTip = "Aplica um conjunto de valores ideal para telas 4K.";

    // Texto de ajuda
    var infoText = win.add("statictext", undefined, "Os valores são aplicados como preview automático.\nUse Aplicar para testar e Salvar para gravar nas preferências.", { multiline: true });
    infoText.maximumSize.width = 280;
    setFgColor(infoText, D9T_Theme.colors.textNormal);

    // Botões (Resetar, Aplicar)
    var buttonsGrp = win.add("group");
    buttonsGrp.alignment = ["right", "top"];
    buttonsGrp.spacing = 10;
    var resetBtn = buttonsGrp.add("button", undefined, "Resetar");
    var applyBtn = buttonsGrp.add("button", undefined, "Aplicar");
    resetBtn.helpTip = "Restaura todos os parâmetros para os valores padrão.";
    applyBtn.helpTip = "Aplica as alterações e salva nas preferências.";

    // Estiliza os botões
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

    // --- 5. Funções Auxiliares e Eventos da Janela ---
    
    // Garante que o valor esteja dentro de um range
    function clamp(value, min, max, fallback) {
        var parsed = parseInt(value, 10);
        if (isNaN(parsed)) { parsed = fallback; }
        return Math.min(max, Math.max(min, parsed));
    }

    // Sincroniza um slider com um valor (ajustando o max se necessário)
    function syncSliderValue(slider, value) {
        if (slider.maxvalue < value) {
            slider.maxvalue = value;
        }
        slider.value = value;
    }

    // Define o valor do campo "Icon Only Spacing" e seu slider
    function setIconOnlySpacingUI(value, fallback) {
        var normalized = clamp(value, 0, 60, fallback);
        iconOnlySpacingField.text = normalized;
        syncSliderValue(iconOnlySpacingSlider, normalized);
        return normalized;
    }

    function cloneSettings(settingsObj) {
        if (!settingsObj) { return null; }
        return {
            iconSize: settingsObj.iconSize ? settingsObj.iconSize.slice(0) : [36, 36],
            iconSpacing: settingsObj.iconSpacing,
            verticalIconSize: settingsObj.verticalIconSize ? settingsObj.verticalIconSize.slice(0) : (settingsObj.iconSize ? settingsObj.iconSize.slice(0) : [36, 36]),
            verticalIconSpacing: settingsObj.verticalIconSpacing,
            labelSpacing: settingsObj.labelSpacing,
            compactIconSize: settingsObj.compactIconSize ? settingsObj.compactIconSize.slice(0) : [28, 28],
            compactIconSpacing: settingsObj.compactIconSpacing,
            showLabels: settingsObj.showLabels !== false,
            iconOnlySpacing: settingsObj.iconOnlySpacing
        };
    }

    // Lê todos os campos da janela e retorna um objeto de configurações
    function readSettingsFromFields() {
        var width = clamp(widthField.text, 24, 96, current.iconSize[0]);
        var height = clamp(heightField.text, 24, 96, current.iconSize[1]);
        var iconSpacing = clamp(iconSpacingField.text, 0, 60, current.iconSpacing);
        var verticalWidth = clamp(verticalWidthField.text, 24, 96, current.verticalIconSize[0]);
        var verticalHeight = clamp(verticalHeightField.text, 24, 96, current.verticalIconSize[1]);
        var verticalSpacing = clamp(verticalSpacingField.text, 0, 60, current.verticalIconSpacing);
        var labelSpacing = clamp(labelSpacingField.text, 0, 40, current.labelSpacing);
        var compactWidth = clamp(compactWidthField.text, 20, 64, current.compactIconSize[0]);
        var compactHeight = clamp(compactHeightField.text, 20, 64, current.compactIconSize[1]);
        var compactSpacing = clamp(compactSpacingField.text, 0, 80, current.compactIconSpacing);
        var iconOnlySpacing = setIconOnlySpacingUI(iconOnlySpacingField.text, current.iconOnlySpacing);
        
        // Atualiza os campos (caso o usuário tenha digitado valor fora do range)
        widthField.text = width;
        heightField.text = height;
        iconSpacingField.text = iconSpacing;
        verticalWidthField.text = verticalWidth;
        verticalHeightField.text = verticalHeight;
        verticalSpacingField.text = verticalSpacing;
        labelSpacingField.text = labelSpacing;
        compactWidthField.text = compactWidth;
        compactHeightField.text = compactHeight;
        compactSpacingField.text = compactSpacing;
        
        // Sincroniza os sliders
        syncSliderValue(iconSpacingSlider, iconSpacing);
        syncSliderValue(verticalSpacingSlider, verticalSpacing);
        syncSliderValue(labelSpacingSlider, labelSpacing);
        syncSliderValue(compactSpacingSlider, compactSpacing);
        
        return {
            iconSize: [width, height],
            iconSpacing: iconSpacing,
            verticalIconSize: [verticalWidth, verticalHeight],
            verticalIconSpacing: verticalSpacing,
            labelSpacing: labelSpacing,
            compactIconSize: [compactWidth, compactHeight],
            compactIconSpacing: compactSpacing,
            showLabels: showLabelsCheckbox.value !== false,
            iconOnlySpacing: iconOnlySpacing
        };
    }

    // Aplica as configurações lidas (sem salvar)
    function applyPreview() {
        var settings = readSettingsFromFields();
        if (!settings) { return; }
        D9T_APPLY_ICON_SETTINGS(settings, { uiObj: uiObj });
        pendingSettings = cloneSettings(settings);
        settingsDirty = true;
    }

    // Anexa eventos de "preview ao vivo"
    widthField.onChange = applyPreview;
    heightField.onChange = applyPreview;
    iconSpacingField.onChange = applyPreview;
    verticalWidthField.onChange = applyPreview;
    verticalHeightField.onChange = applyPreview;
    verticalSpacingField.onChange = applyPreview;
    labelSpacingField.onChange = applyPreview;
    compactWidthField.onChange = applyPreview;
    compactHeightField.onChange = applyPreview;
    compactSpacingField.onChange = applyPreview;
    iconOnlySpacingField.onChange = applyPreview;
    showLabelsCheckbox.onClick = applyPreview;
    
    // Eventos dos sliders
    iconSpacingSlider.onChanging = function () {
        iconSpacingField.text = Math.round(this.value);
        applyPreview();
    };
    verticalSpacingSlider.onChanging = function () {
        verticalSpacingField.text = Math.round(this.value);
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

    // Eventos dos botões de Preset
    hdBtn.onClick = function () {
        widthField.text = 30;
        heightField.text = 30;
        verticalWidthField.text = 30;
        verticalHeightField.text = 30;
        iconSpacingField.text = 1;
        verticalSpacingField.text = 25;
        labelSpacingField.text = 3;
        compactWidthField.text = 28;
        compactHeightField.text = 28;
        compactSpacingField.text = 28;
        setIconOnlySpacingUI(50, current.iconOnlySpacing);
        showLabelsCheckbox.value = true;
        syncSliderValue(iconSpacingSlider, 1);
        syncSliderValue(verticalSpacingSlider, 25);
        syncSliderValue(labelSpacingSlider, 3);
        syncSliderValue(compactSpacingSlider, 28);
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

    // Evento: Resetar (Restaura e Salva os padrões)
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
            D9T_SAVE_ICON_SETTINGS(settings); // Salva
            pendingSettings = null;
            settingsDirty = false;
        }
    };

    // Evento: Aplicar (Aplica e Salva)
    applyBtn.onClick = function () {
        var settings = readSettingsFromFields();
        if (!settings) {
            alert("Valores inválidos.");
            return;
        }
        D9T_APPLY_ICON_SETTINGS(settings, { uiObj: uiObj });
        D9T_SAVE_ICON_SETTINGS(settings); // Salva
        pendingSettings = null;
        settingsDirty = false;
    };
    
    win.onClose = function () {
        if (settingsDirty && pendingSettings) {
            D9T_APPLY_ICON_SETTINGS(pendingSettings, { uiObj: uiObj });
            D9T_SAVE_ICON_SETTINGS(pendingSettings);
            settingsDirty = false;
            pendingSettings = null;
        }
    };

    win.show();
}

/**
 * Obtém as configurações de ícone PADRÃO (do objeto defaultScriptPreferencesObj).
 * @returns {Object}
 */
function D9T_GET_DEFAULT_ICON_SETTINGS() {
    var defaults = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.uiSettings) ? defaultScriptPreferencesObj.uiSettings : null;
    if (!defaults) { 
        // Fallback rígido
        return { iconSize: [36, 36], iconSpacing: 20, verticalIconSize: [36, 36], verticalIconSpacing: 20, labelSpacing: 8, compactIconSize: [28, 28], compactIconSpacing: 12, showLabels: true, iconOnlySpacing: 18 }; 
    }
    // Retorna uma cópia dos padrões
    return {
        iconSize: defaults.iconSize ? defaults.iconSize.slice(0) : [36, 36],
        iconSpacing: typeof defaults.iconSpacing === "number" ? defaults.iconSpacing : 20,
        verticalIconSize: defaults.verticalIconSize ? defaults.verticalIconSize.slice(0) : (defaults.iconSize ? defaults.iconSize.slice(0) : [36, 36]),
        verticalIconSpacing: typeof defaults.verticalIconSpacing === "number" ? defaults.verticalIconSpacing : (typeof defaults.iconSpacing === "number" ? defaults.iconSpacing : 20),
        labelSpacing: typeof defaults.labelSpacing === "number" ? defaults.labelSpacing : 8,
        compactIconSize: defaults.compactIconSize ? defaults.compactIconSize.slice(0) : [28, 28],
        compactIconSpacing: typeof defaults.compactIconSpacing === "number" ? defaults.compactIconSpacing : 12,
        showLabels: defaults.showLabels !== false,
        iconOnlySpacing: typeof defaults.iconOnlySpacing === "number" ? defaults.iconOnlySpacing : 18
    };
}

/**
 * Obtém as configurações de ícone ATUAIS (do scriptPreferencesObj) e as valida/limpa.
 * @returns {Object}
 */
function D9T_GET_ICON_SETTINGS() {
    var defaultsObj = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.uiSettings) ? defaultScriptPreferencesObj.uiSettings : {};
    if (!scriptPreferencesObj.uiSettings) {
        // Se não houver, clona o objeto completo de uiSettings padrão (preserva temas de botão/tema ativo)
        scriptPreferencesObj.uiSettings = (defaultsObj && typeof defaultsObj === "object") ? JSON.parse(JSON.stringify(defaultsObj)) : D9T_GET_DEFAULT_ICON_SETTINGS();
    } else {
        // Garante que temas de botão e tema ativo existam
        if (!(scriptPreferencesObj.uiSettings.buttonThemes instanceof Array) || !scriptPreferencesObj.uiSettings.buttonThemes.length) {
            if (defaultsObj.buttonThemes) {
                scriptPreferencesObj.uiSettings.buttonThemes = JSON.parse(JSON.stringify(defaultsObj.buttonThemes));
            }
        }
        if (!scriptPreferencesObj.uiSettings.activeButtonTheme && defaultsObj.activeButtonTheme) {
            scriptPreferencesObj.uiSettings.activeButtonTheme = defaultsObj.activeButtonTheme;
        }
    }
    var current = scriptPreferencesObj.uiSettings || {};
    var defaults = D9T_GET_DEFAULT_ICON_SETTINGS(); // Pega os padrões para usar como fallback
    
    // Validação e limpeza de cada propriedade
    var size = current.iconSize ? current.iconSize.slice(0) : defaults.iconSize.slice(0);
    if (size.length < 2) { size = defaults.iconSize.slice(0); }
    size[0] = Math.min(96, Math.max(24, parseInt(size[0], 10) || defaults.iconSize[0]));
    size[1] = Math.min(96, Math.max(24, parseInt(size[1], 10) || defaults.iconSize[1]));
    
    var spacing = current.iconSpacing;
    if (typeof spacing !== "number" || isNaN(spacing)) { spacing = defaults.iconSpacing; }
    spacing = Math.min(60, Math.max(0, spacing));
    
    var verticalSize = current.verticalIconSize ? current.verticalIconSize.slice(0) : (defaults.verticalIconSize ? defaults.verticalIconSize.slice(0) : defaults.iconSize.slice(0));
    var verticalDefaults = defaults.verticalIconSize ? defaults.verticalIconSize.slice(0) : defaults.iconSize.slice(0);
    if (verticalSize.length < 2) { verticalSize = verticalDefaults.slice(0); }
    verticalSize[0] = Math.min(96, Math.max(24, parseInt(verticalSize[0], 10) || verticalDefaults[0]));
    verticalSize[1] = Math.min(96, Math.max(24, parseInt(verticalSize[1], 10) || verticalDefaults[1]));

    var verticalSpacing = current.verticalIconSpacing;
    if (typeof verticalSpacing !== "number" || isNaN(verticalSpacing)) { verticalSpacing = (typeof defaults.verticalIconSpacing === "number") ? defaults.verticalIconSpacing : defaults.iconSpacing; }
    verticalSpacing = Math.min(60, Math.max(0, verticalSpacing));
    
    var labelSpacing = current.labelSpacing;
    if (typeof labelSpacing !== "number" || isNaN(labelSpacing)) { labelSpacing = defaults.labelSpacing; }
    labelSpacing = Math.min(60, Math.max(0, labelSpacing));
    
    
    var compactSize = current.compactIconSize ? current.compactIconSize.slice(0) : defaults.compactIconSize.slice(0);
    if (compactSize.length < 2) { compactSize = defaults.compactIconSize.slice(0); }
    compactSize[0] = Math.min(64, Math.max(20, parseInt(compactSize[0], 10) || defaults.compactIconSize[0]));
    compactSize[1] = Math.min(64, Math.max(20, parseInt(compactSize[1], 10) || defaults.compactIconSize[1]));
    
    var compactSpacing = current.compactIconSpacing;
    if (typeof compactSpacing !== "number" || isNaN(compactSpacing)) { compactSpacing = defaults.compactIconSpacing; }
    compactSpacing = Math.max(0, compactSpacing);
    
    var showLabels = current.showLabels;
    if (typeof showLabels !== "boolean") { showLabels = defaults.showLabels; }
    
    var iconOnlySpacing = current.iconOnlySpacing;
    if (typeof iconOnlySpacing !== "number" || isNaN(iconOnlySpacing)) { iconOnlySpacing = defaults.iconOnlySpacing; }
    iconOnlySpacing = Math.min(60, Math.max(0, iconOnlySpacing));
    
    return {
        iconSize: size,
        iconSpacing: spacing,
        verticalIconSize: verticalSize,
        verticalIconSpacing: verticalSpacing,
        labelSpacing: labelSpacing,
        compactIconSize: compactSize,
        compactIconSpacing: compactSpacing,
        showLabels: showLabels,
        iconOnlySpacing: iconOnlySpacing
    };
}

/**
 * Constrói e exibe a janela de personalização de botões (CORRIGIDA).
 * @param {Object} uiObj - O objeto D9T_ui.
 */
function D9T_OPEN_BUTTON_THEME_WINDOW(uiObj) {
    uiObj = uiObj || D9T_ui;
    D9T_requirePrefsLoaded();
    var uiSettings = D9T_getUiSettingsSafe(); // Assegura estruturas
    D9T_PREF_STATE("open_button_theme_window", scriptPreferencesObj && scriptPreferencesObj.uiSettings);

    var win = new Window("palette", "Tema dos botões");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.margins = 18;
    win.spacing = 10;
    try { setBgColor(win, bgColor1); } catch (bgErr) {}

    var desc = win.add("statictext", undefined, "Ajuste largura, altura, cores e arredondamento dos presets reutilizáveis.");
    desc.maximumSize.width = 320;
    setFgColor(desc, D9T_Theme.colors.textNormal);

    // --- Dropdown de Seleção ---
    var dropdownRow = win.add("group");
    dropdownRow.alignment = ["fill", "top"];
    dropdownRow.spacing = 8;
    var dropdownLabel = dropdownRow.add("statictext", undefined, "Preset disponível:");
    try { setFgColor(dropdownLabel, D9T_Theme.colors.textNormal); } catch (presetErr) {}
    
    var dropdown = dropdownRow.add("dropdownlist", undefined, []);
    dropdown.alignment = ["fill", "center"];
    
    var activeInfo = win.add("statictext", undefined, "");
    setFgColor(activeInfo, D9T_Theme.colors.mono1);

    // --- Formulário ---
    var formGrp = win.add("group");
    formGrp.orientation = "column";
    formGrp.alignChildren = ["fill", "top"];
    formGrp.spacing = 6;

    var fieldMap = {};
    
    // --- Funções Auxiliares de UI ---
    
    function updateDropdownSelectionLabel(nameText) {
        if (!dropdown || !dropdown.selection) { return; }
        var labelTxt = nameText && nameText.length ? nameText : dropdown.selection.themeId;
        dropdown.selection.text = labelTxt + " (" + dropdown.selection.themeId + ")";
    }

    function requestPreviewRefresh() {
        var snapshot = collectThemeFromFields();
        // Se a leitura falhar (ex: inicialização), tenta usar o tema do dropdown como fallback
        if (!snapshot) {
            // ForA�a seleAA�o inicial se o ScriptUI ainda nA�o tiver aplicado
            if (dropdown && !dropdown.selection && dropdown.items && dropdown.items.length) {
                dropdown.selection = dropdown.items[0];
            }
            if (dropdown && dropdown.selection) {
                var rawTheme = getThemeById(dropdown.selection.themeId) || D9T_getActiveButtonTheme();
                if (rawTheme) snapshot = D9T_sanitizeButtonTheme(rawTheme);
            }
        }
        if (!snapshot) return;
        applyPreviewTheme(snapshot);
    }

    function bindSliderToField(field, slider, minValue, maxValue) {
        if (!field || !slider) { return; }
        
        slider.minvalue = minValue;
        slider.maxvalue = maxValue;
        // Importante: Inicializa valores para evitar NaN
        if (slider.value === undefined) slider.value = minValue;

        slider.onChanging = function () {
            var val = Math.round(this.value);
            // Atualiza texto e força refresh
            field.text = String(val); 
            requestPreviewRefresh();
        };
        slider.onChange = slider.onChanging;

        // Sync reverso (Texto -> Slider)
        field.onChanging = function () {
            var val = parseInt(this.text, 10);
            if (!isNaN(val)) {
                slider.value = Math.max(minValue, Math.min(maxValue, val));
                requestPreviewRefresh();
            }
        };
        field.__slider = slider;
    }

    function createNumericField(key, label, minValue, maxValue, parent) {
        var target = parent || formGrp;
        var row = target.add("group");
        row.alignment = ["fill", "top"];
        row.spacing = 8;
        
        var lab = row.add("statictext", undefined, label);
        lab.preferredSize = [150, 20];
        try { setFgColor(lab, D9T_Theme.colors.textNormal); } catch (fgErr) {}
        
        var slider = row.add("slider", undefined, minValue, minValue, maxValue);
        slider.preferredSize = [150, 16];
        
        var field = row.add("edittext", undefined, "");
        field.characters = 6;
        field.preferredSize = [56, 20];
        
        bindSliderToField(field, slider, minValue, maxValue);
        fieldMap[key] = field;
        return field;
    }

    function createTextField(key, label, chars, parent) {
        var target = parent || formGrp;
        var row = target.add("group");
        row.alignment = ["fill", "top"];
        row.spacing = 8;
        var lab = row.add("statictext", undefined, label);
        lab.preferredSize = [150, 20];
        try { setFgColor(lab, D9T_Theme.colors.textNormal); } catch (fgErr) {}
        var field = row.add("edittext", undefined, "");
        field.characters = chars || 10;
        field.alignment = ["fill", "center"];
        field.onChanging = function () { 
            requestPreviewRefresh(); 
            if (key === "name") updateDropdownSelectionLabel(this.text);
        };
        fieldMap[key] = field;
        return field;
    }

    function updateColorPreview(field, fallback) {
        if (!field || !field.__swatch) return;
        var sanitized = D9T_sanitizeHexColor(field.text, null);
        var colorToUse = sanitized || fallback || "#2E343B";
        try { setBgColor(field.__swatch, colorToUse); } catch (swErr) {}
    }

    function createColorField(key, label, parent) {
        var target = parent || formGrp;
        var row = target.add("group");
        row.alignment = ["fill", "top"];
        row.spacing = 8;
        var lab = row.add("statictext", undefined, label);
        lab.preferredSize = [150, 20];
        try { setFgColor(lab, D9T_Theme.colors.textNormal); } catch (fgErr) {}
        
        var field = row.add("edittext", undefined, "");
        field.characters = 10;
        field.alignment = ["fill", "center"];
        
        var swatch = row.add("panel");
        swatch.preferredSize = [32, 18];
        swatch.helpTip = "Clique para escolher uma cor";
        field.__swatch = swatch;
        
        swatch.addEventListener("click", function() {
            var selected = D9T_PICK_COLOR(field.text);
            if (selected) {
                field.text = selected.toUpperCase();
                updateColorPreview(field);
                requestPreviewRefresh();
            }
        });
        
        field.onChanging = function () { updateColorPreview(field); requestPreviewRefresh(); };
        fieldMap[key] = field;
        return field;
    }

    function createTransformField(key, label, parent) {
        var target = parent || formGrp;
        var row = target.add("group");
        row.alignment = ["fill", "top"];
        row.spacing = 8;
        var lab = row.add("statictext", undefined, label);
        lab.preferredSize = [150, 20];
        try { setFgColor(lab, D9T_Theme.colors.textNormal); } catch (fgErr) {}
        var dd = row.add("dropdownlist", undefined, ["Manter texto original", "Forçar MAIÚSCULAS", "Forçar minúsculas"]);
        dd.alignment = ["fill", "center"];
        dd.__values = ["none", "uppercase", "lowercase"];
        dd.selection = 0;
        dd.onChange = function () { requestPreviewRefresh(); };
        fieldMap[key] = dd;
        return dd;
    }

    function createSectionPanel(title, subtitle) {
        var panel = formGrp.add("panel", undefined, title);
        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.margins = [12, 18, 12, 10];
        panel.spacing = 6;
        try { setBgColor(panel, bgColor2); } catch (panelErr) {}
        if (subtitle) {
            var infoTxt = panel.add("statictext", undefined, subtitle, { multiline: true });
            infoTxt.alignment = ["fill", "top"];
            try { setFgColor(infoTxt, D9T_Theme.colors.mono1); } catch (infoErr) {}
        }
        return panel;
    }

    // --- Construção dos Campos ---
    var identityPanel = createSectionPanel("Identificação", "Escolha um nome amigável para localizar o preset rapidamente.");
    createTextField("name", "Nome do preset", 18, identityPanel);

    var sizePanel = createSectionPanel("Dimensões e alinhamento", "Ajuste o tamanho geral e os offsets finos do texto.");
    createNumericField("width", "Largura (px)", 40, 250, sizePanel);
    createNumericField("height", "Altura (px)", 24, 120, sizePanel);
    createNumericField("cornerRadius", "Arredondamento", 0, 120, sizePanel);
    createNumericField("labelOffset", "Ajuste vertical (px)", -40, 40, sizePanel);
    createNumericField("labelOffsetX", "Ajuste horizontal (px)", -80, 80, sizePanel);

    var textPanel = createSectionPanel("Tipografia", "Controle tamanho da fonte e transformação automática.");
    createNumericField("labelFontSize", "Fonte (px)", 8, 48, textPanel);
    createTransformField("textTransform", "Texto (formatação)", textPanel);

    var colorPanel = createSectionPanel("Cores", "Defina as tonalidades para os estados normal e hover.");
    createColorField("background", "Cor base (#HEX)", colorPanel);
    createColorField("hoverBackground", "Cor hover (#HEX)", colorPanel);
    createColorField("textColor", "Texto base (#HEX)", colorPanel);
    createColorField("hoverTextColor", "Texto hover (#HEX)", colorPanel);

    // --- Área de Preview ---
    var previewPanel = win.add("panel", undefined, "Pré-visualização");
    previewPanel.alignChildren = ["fill", "top"];
    previewPanel.spacing = 6;
    
    var previewButtonsGrp = previewPanel.add("group");
    previewButtonsGrp.orientation = "row";
    previewButtonsGrp.alignChildren = ["center", "center"];
    previewButtonsGrp.spacing = 10;
    
    // Botões de exemplo
    var previewNormalWrapper = null;
    var previewHoverWrapper = null;
    if (typeof themeButton === "function") {
        previewNormalWrapper = new themeButton(previewButtonsGrp, { labelTxt: "Exemplo normal" });
        if(previewNormalWrapper.label) previewNormalWrapper.label.enabled = false;
        
        previewHoverWrapper = new themeButton(previewButtonsGrp, { labelTxt: "Hover ativo" });
        if(previewHoverWrapper.label) previewHoverWrapper.label.enabled = false;
    } else {
        previewButtonsGrp.add("statictext", undefined, "Preview indisponível (falta themeButton)");
    }

    var previewInfo = previewPanel.add("statictext", undefined, "", { multiline: true });
    previewInfo.alignment = ["fill", "top"];
    try { setFgColor(previewInfo, D9T_Theme.colors.mono1); } catch (infoErr) {}

    // --- Botões de Ação ---
    var buttonRow = win.add("group");
    buttonRow.alignment = ["fill", "top"];
    buttonRow.spacing = 8;
    
    var leftBtnGroup = buttonRow.add("group");
    leftBtnGroup.alignment = ["left", "center"];
    leftBtnGroup.spacing = 6;
    var saveBtn = leftBtnGroup.add("button", undefined, "Salvar");
    var useBtn = leftBtnGroup.add("button", undefined, "Aplicar preset");
    
    var closeBtn = buttonRow.add("button", undefined, "Fechar");
    closeBtn.alignment = ["right", "center"];

    // --- Lógica Interna ---
    function getThemeById(id) {
        var list = D9T_getButtonThemeList();
        var idx = D9T_findButtonThemeIndex(id);
        return (idx > -1) ? list[idx] : null;
    }

    function updateActiveInfo() {
        var activeId = uiSettings.activeButtonTheme;
        var active = getThemeById(activeId);
        var name = active ? active.name : activeId;
        activeInfo.text = "Preset ativo: " + (name || "Nenhum");
    }

    function loadThemeFromSelection() {
        if (!dropdown.selection) return;
        
        var theme = getThemeById(dropdown.selection.themeId);
        if (!theme) return;

        var clean = D9T_sanitizeButtonTheme(theme);
        
        // Atualização segura dos campos (bypass para eventos)
        fieldMap.name.text = clean.name || "";
        updateDropdownSelectionLabel(clean.name);

        function setNum(k, v) {
            if(fieldMap[k]) {
                fieldMap[k].text = String(v);
                if(fieldMap[k].__slider) fieldMap[k].__slider.value = v;
            }
        }
        setNum("width", clean.width);
        setNum("height", clean.height);
        setNum("cornerRadius", clean.cornerRadius);
        setNum("labelOffset", clean.labelOffset);
        setNum("labelOffsetX", clean.labelOffsetX);
        setNum("labelFontSize", clean.labelFontSize);
        
        fieldMap.background.text = clean.background;
        updateColorPreview(fieldMap.background, clean.background);
        
        fieldMap.hoverBackground.text = clean.hoverBackground;
        updateColorPreview(fieldMap.hoverBackground, clean.hoverBackground);
        
        fieldMap.textColor.text = clean.textColor;
        updateColorPreview(fieldMap.textColor, clean.textColor);
        
        fieldMap.hoverTextColor.text = clean.hoverTextColor;
        updateColorPreview(fieldMap.hoverTextColor, clean.hoverTextColor);

        // Dropdown de transform
        var dd = fieldMap.textTransform;
        var tVal = (clean.textTransform || "none").toLowerCase();
        for(var i=0; i<dd.items.length; i++) {
            if(dd.__values[i] === tVal) { dd.selection = i; break; }
        }

        // Aplica preview diretamente com os dados limpos (não depende da UI)
        applyPreviewTheme(clean);
    }

    function collectThemeFromFields() {
        // CORREÇÃO CRÍTICA: Fallback se dropdown.selection for nulo
        var sel = dropdown.selection;
        if (!sel && dropdown.items.length > 0) sel = dropdown.items[0];
        if (!sel) return null;

        var tTransform = "none";
        if (fieldMap.textTransform.selection) {
            tTransform = fieldMap.textTransform.__values[fieldMap.textTransform.selection.index];
        }

        var data = {
            id: sel.themeId,
            name: fieldMap.name.text,
            width: fieldMap.width.text,
            height: fieldMap.height.text,
            cornerRadius: fieldMap.cornerRadius.text,
            labelOffset: fieldMap.labelOffset.text,
            labelOffsetX: fieldMap.labelOffsetX.text,
            labelFontSize: fieldMap.labelFontSize.text,
            background: fieldMap.background.text,
            hoverBackground: fieldMap.hoverBackground.text,
            textColor: fieldMap.textColor.text,
            hoverTextColor: fieldMap.hoverTextColor.text,
            textTransform: tTransform
        };
        return D9T_sanitizeButtonTheme(data);
    }

    function applyPreviewTheme(clean) {
        if (!clean) return;
        
        if (previewNormalWrapper && previewNormalWrapper.label) {
            var nCtrl = previewNormalWrapper.label;
            nCtrl.__buttonThemeOverrides = {}; // Limpa overrides
            nCtrl.__buttonBaseText = "Exemplo normal";
            nCtrl.__buttonHover = false;
            nCtrl.__buttonActive = false;
            D9T_applyThemeToButtonControl(nCtrl, clean);
        }

        if (previewHoverWrapper && previewHoverWrapper.label) {
            var hCtrl = previewHoverWrapper.label;
            hCtrl.__buttonThemeOverrides = {};
            hCtrl.__buttonBaseText = "Hover ativo";
            hCtrl.__buttonHover = true; // Simula hover
            hCtrl.__buttonActive = false;
            D9T_applyThemeToButtonControl(hCtrl, clean);
        }

        var tLabel = (clean.textTransform === "uppercase") ? "MAIÚSCULAS" : 
                     (clean.textTransform === "lowercase" ? "minúsculas" : "original");
                     
        previewInfo.text = "Info: " + clean.width + "x" + clean.height + "px | Canto: " + clean.cornerRadius + 
                           " | Fonte: " + clean.labelFontSize + "px (" + tLabel + ")";
                           
        win.layout.layout(true);
        // Propaga preview ao vivo para outros controles registrados fora desta janela
        if (typeof D9T_previewThemeOnTargets === "function") {
            try { D9T_previewThemeOnTargets(clean); } catch (previewErr) {}
        }
    }

    function populateDropdown(selectedId) {
        var list = D9T_getButtonThemeList();
        dropdown.removeAll();
        
        if (!list || !list.length) {
            var def = D9T_getDefaultButtonTheme("classic");
            list = [def];
        }

        for (var i = 0; i < list.length; i++) {
            var item = dropdown.add("item", list[i].name + " (" + list[i].id + ")");
            item.themeId = list[i].id;
            if (selectedId && selectedId === list[i].id) {
                dropdown.selection = item;
            }
        }
        
        if (!dropdown.selection && dropdown.items.length > 0) {
            dropdown.selection = dropdown.items[0];
        }
        
        updateActiveInfo();
        loadThemeFromSelection();
    }

    // --- Eventos Finais ---
    dropdown.onChange = loadThemeFromSelection;

    saveBtn.onClick = function() {
        var data = collectThemeFromFields();
        if(!data) return;
        
        // Salva na lista
        var list = uiSettings.buttonThemes;
        var idx = D9T_findButtonThemeIndex(data.id);
        if(idx > -1) list[idx] = data;
        else list.push(data);
        
        // Se for o ativo, atualiza globalmente
        if(uiSettings.activeButtonTheme === data.id) {
            D9T_applyActiveButtonTheme(false);
        }
        
        D9T_saveButtonThemesState(list, uiSettings.activeButtonTheme);
        populateDropdown(data.id);
    };

    useBtn.onClick = function() {
        var data = collectThemeFromFields();
        if(data) {
            // Salva alterações antes de aplicar
            var list = uiSettings.buttonThemes;
            var idx = D9T_findButtonThemeIndex(data.id);
            if(idx > -1) list[idx] = data;
            
            uiSettings.activeButtonTheme = data.id;
            D9T_applyActiveButtonTheme(true);
            D9T_saveButtonThemesState(list, data.id);
            updateActiveInfo();
            // Re-popula para garantir consistência visual do dropdown
            populateDropdown(data.id);
        }
    };

    closeBtn.onClick = function() { win.close(); };

    // Inicialização
    populateDropdown(uiSettings.activeButtonTheme);
    
    // Força layout e exibição
    win.onShow = function() {
        win.layout.layout(true);
        // Garante que o load aconteça visualmente
        loadThemeFromSelection(); 
    };

    D9T_LOCK_WINDOW(win);
    win.show();
}

function D9T_APPLY_ICON_SETTINGS(settings, options) {
    settings = settings || D9T_GET_ICON_SETTINGS();
    options = options || {};
    
    // Sanitiza os valores (mesmo já tendo sido limpos, é uma segurança)
    var size = settings.iconSize ? settings.iconSize.slice(0) : [36, 36];
    var spacing = typeof settings.iconSpacing === "number" ? settings.iconSpacing : 20;
    var compactSize = settings.compactIconSize ? settings.compactIconSize.slice(0) : [28, 28];
    var compactSpacing = typeof settings.compactIconSpacing === "number" ? settings.compactIconSpacing : Math.max(4, Math.round(Math.max(0, spacing) * 0.6));
    var labelSpacing = typeof settings.labelSpacing === "number" ? settings.labelSpacing : 8;
    var showLabels = settings.showLabels !== false;
    var iconOnlySpacing = typeof settings.iconOnlySpacing === "number" ? settings.iconOnlySpacing : Math.max(4, Math.round(Math.max(0, spacing) * 0.7));
    var verticalSize = settings.verticalIconSize ? settings.verticalIconSize.slice(0) : size.slice(0);
    var verticalSpacing = typeof settings.verticalIconSpacing === "number" ? settings.verticalIconSpacing : spacing;
    
    // Atualiza o objeto D9T_Theme.layout (usado por D9T_LAYOUT)
    D9T_Theme.layout.iconSize = size.slice(0);
    D9T_Theme.layout.iconSizeVertical = verticalSize.slice(0);
    D9T_Theme.layout.iconSizeCompact = compactSize.slice(0);
    D9T_Theme.layout.iconSpacingNormal = spacing;
    D9T_Theme.layout.iconSpacingVertical = verticalSpacing;
    D9T_Theme.layout.iconSpacingCompact = Math.max(2, compactSpacing);
    D9T_Theme.layout.labelSpacing = labelSpacing;
    D9T_Theme.layout.showLabels = showLabels;
    D9T_Theme.layout.iconOnlySpacing = Math.max(0, iconOnlySpacing);
    
    if (options.deferLayout) { return; } // Usado na inicialização (D9T_BUILD_UI)
    
    var targetUI = options.uiObj || D9T_ui;
    
    // Aplica o tamanho do ícone diretamente às imagens (preview ao vivo)
    if (targetUI && targetUI.imageButtonArray && targetUI.imageButtonArray.length) {
        for (var i = 0; i < targetUI.imageButtonArray.length; i++) {
            var ctrl = targetUI.imageButtonArray[i];
            try {
                ctrl.hoverImg.size = size.slice(0);
                ctrl.normalImg.size = size.slice(0);
            } catch (err) {}
        }
    }
    
    // Redesenha a UI
    if (targetUI && targetUI.window) {
        if (options.refresh !== false) {
            targetUI.window.layout.layout(true);
        }
        if (options.forceLayout !== false && typeof D9T_LAYOUT === "function") {
            D9T_LAYOUT(targetUI); // Força o recalculo do layout responsivo
        }
    }
}

/**
 * Salva as configurações de ícone no objeto scriptPreferencesObj e chama saveScriptPreferences().
 * @param {Object} settings - O objeto de configurações validado.
 */
function D9T_SAVE_ICON_SETTINGS(settings) {
    // Garante que apenas dados limpos sejam salvos
    var safe = {
        iconSize: settings.iconSize ? settings.iconSize.slice(0) : [36, 36],
        iconSpacing: settings.iconSpacing,
        verticalIconSize: settings.verticalIconSize ? settings.verticalIconSize.slice(0) : (settings.iconSize ? settings.iconSize.slice(0) : [36, 36]),
        verticalIconSpacing: typeof settings.verticalIconSpacing === "number" ? settings.verticalIconSpacing : settings.iconSpacing,
        labelSpacing: settings.labelSpacing,
        compactIconSize: settings.compactIconSize ? settings.compactIconSize.slice(0) : [28, 28],
        compactIconSpacing: settings.compactIconSpacing,
        showLabels: settings.showLabels !== false,
        iconOnlySpacing: typeof settings.iconOnlySpacing === "number" ? settings.iconOnlySpacing : 18
    };
    try { D9T_PREF_LOG("icon_settings begin " + JSON.stringify(safe)); } catch (logErr0) {}

    // Preserve outras entradas (ex: temas de botão) sem sobrescrever temas customizados.
    var currentUiSettings = D9T_getUiSettingsSafe();
    var merged = JSON.parse(JSON.stringify(currentUiSettings || {}));
    var defaultUiSettings = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.uiSettings) ? defaultScriptPreferencesObj.uiSettings : {};

    if (!merged.buttonThemes) {
        merged.buttonThemes = defaultUiSettings.buttonThemes ? JSON.parse(JSON.stringify(defaultUiSettings.buttonThemes)) : [];
    }
    if (!merged.activeButtonTheme) {
        merged.activeButtonTheme = (defaultUiSettings && defaultUiSettings.activeButtonTheme) ? defaultUiSettings.activeButtonTheme : "classic";
    }
    try { D9T_PREF_STATE("icon_settings merged", merged); } catch (logErr1) {}

    // Sobrescreve apenas as chaves relacionadas a ícones
    for (var safeKey in safe) {
        merged[safeKey] = safe[safeKey];
    }

    scriptPreferencesObj.uiSettings = merged;

    // Salva direto no JSON (garante persistência mesmo se D9T_Preferences falhar)
    try {
        D9T_PREF_LOG("icon_settings commit -> saveScriptPreferences");
        if (typeof saveScriptPreferences === "function") {
            saveScriptPreferences();
        } else if (typeof D9T_Preferences !== "undefined" && typeof D9T_Preferences.save === "function") {
            D9T_Preferences.save();
        } else {
            D9T_COMMIT_PREFERENCES();
        }
    } catch (iconSaveErr) {
        D9T_PREF_LOG("icon_settings commit FAIL", iconSaveErr);
        try { D9T_COMMIT_PREFERENCES(); } catch (fallbackErr) { D9T_PREF_LOG("icon_settings fallback commit FAIL", fallbackErr); }
    }
    try { D9T_PREF_LOG("icon_settings commit done"); } catch (logErr2) {}
}

function D9T_ADJUST_ICON_SCALE(uiObj) {
    D9T_OPEN_ICON_SETTINGS_WINDOW(uiObj);
}

// Atalho para definir o tamanho do ícone (não usado)
function D9T_SET_ICON_SCALE(uiObj, size) {
    var current = D9T_GET_ICON_SETTINGS();
    current.iconSize = size.slice(0);
    D9T_APPLY_ICON_SETTINGS(current, { uiObj: uiObj });
    D9T_SAVE_ICON_SETTINGS(current);
}

var BUTTON_THEME_TARGETS = [];

function D9T_PREF_LOG(msg, err) {
    try {
        if (msg && typeof msg === "string" && msg.indexOf("ensureLoaded OK") === 0) { return; }
        var prefix = "[D9T_PREFS_TRACE] ";
        var extra = err ? (" :: " + (err.message || err)) : "";
        var full = prefix + msg + extra;
        try { $.writeln(full); } catch (e1) {}
        try {
            var logPath = (typeof runtimeLogsPath !== "undefined" && runtimeLogsPath) ? (runtimeLogsPath + "/prefs_trace.log") : (Folder.temp.fsName + "/prefs_trace.log");
            var f = new File(logPath);
            if (!f.parent.exists) { f.parent.create(); }
            if (f.open("a")) {
                f.encoding = "UTF-8";
                f.writeln(new Date().toUTCString() + " " + full);
                f.close();
            }
        } catch (e3) {}
    } catch (e) {}
}

function D9T_PREF_STATE(label, uiSettings) {
    try {
        var info = (uiSettings && uiSettings.buttonThemes) ? ("themes=" + uiSettings.buttonThemes.length) : "themes=undefined";
        var active = (uiSettings && uiSettings.activeButtonTheme) ? uiSettings.activeButtonTheme : "none";
        D9T_PREF_LOG(label + " | " + info + " | active=" + active);
    } catch (e) {}
}

function D9T_requirePrefsLoaded() {
    try {
        if (typeof D9T_Preferences !== "undefined" && typeof D9T_Preferences.ensureLoaded === "function") {
            try { D9T_Preferences.ensureLoaded(); return; }
            catch (prefLoadErr) { D9T_PREF_LOG("ensureLoaded FAIL", prefLoadErr); }
        }
        if (typeof loadScriptPreferences === "function" && !scriptPreferencesObj.__uiLoaded) {
            try { loadScriptPreferences(); scriptPreferencesObj.__uiLoaded = true; }
            catch (legacyLoadErr) { D9T_PREF_LOG("legacy loadScriptPreferences FAIL", legacyLoadErr); }
        }
    } catch (err) { D9T_PREF_LOG("D9T_requirePrefsLoaded outer FAIL", err); }
}

function D9T_getUiSettingsSafe() {
    try {
        D9T_requirePrefsLoaded();
        var defaultsUi = (defaultScriptPreferencesObj && defaultScriptPreferencesObj.uiSettings) ? defaultScriptPreferencesObj.uiSettings : {};
        if (!scriptPreferencesObj.uiSettings) {
            scriptPreferencesObj.uiSettings = JSON.parse(JSON.stringify(defaultsUi || {}));
            D9T_PREF_LOG("uiSettings created from defaults");
        }
        var uiSettings = scriptPreferencesObj.uiSettings;
        if (!(uiSettings.buttonThemes instanceof Array) || !uiSettings.buttonThemes.length) {
            uiSettings.buttonThemes = JSON.parse(JSON.stringify((defaultsUi && defaultsUi.buttonThemes) ? defaultsUi.buttonThemes : []));
            D9T_PREF_LOG("buttonThemes fallback to defaults");
        }
        if (!uiSettings.activeButtonTheme && defaultsUi.activeButtonTheme) {
            uiSettings.activeButtonTheme = defaultsUi.activeButtonTheme;
            D9T_PREF_LOG("activeButtonTheme fallback to defaults");
        }
        if (!(uiSettings.buttonThemes instanceof Array)) {
            uiSettings.buttonThemes = [];
            D9T_PREF_LOG("buttonThemes forced to array");
        }
        return uiSettings;
    } catch (err) {
        D9T_PREF_LOG("D9T_getUiSettingsSafe FAIL", err);
        // fallback mínimo
        return { buttonThemes: [], activeButtonTheme: "classic" };
    }
}

function D9T_saveButtonThemesState(buttonThemes, activeId) {
    try {
        var uiSettings = D9T_getUiSettingsSafe();
        if (buttonThemes) { uiSettings.buttonThemes = buttonThemes; }
        if (activeId) { uiSettings.activeButtonTheme = activeId; }
        D9T_PREF_STATE("pre-saveButtonThemesState", uiSettings);
        try {
            var activeThemeObj = null;
            var list = uiSettings.buttonThemes || [];
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].id === uiSettings.activeButtonTheme) { activeThemeObj = list[i]; break; }
            }
            if (activeThemeObj) {
                D9T_PREF_LOG("activeTheme snapshot " + activeThemeObj.id + " " + JSON.stringify(activeThemeObj));
            }
        } catch (snapErr) {}
        // Salva diretamente o objeto completo para evitar dependência de Object.keys
        try {
            if (typeof saveScriptPreferences === "function") {
                saveScriptPreferences();
                D9T_PREF_LOG("saveScriptPreferences direct OK");
            } else if (typeof D9T_Preferences !== "undefined" && typeof D9T_Preferences.save === "function") {
                D9T_Preferences.save();
                D9T_PREF_LOG("D9T_Preferences.save OK");
            } else {
                D9T_COMMIT_PREFERENCES();
                D9T_PREF_LOG("D9T_COMMIT_PREFERENCES save");
            }
        } catch (directErr) {
            D9T_PREF_LOG("D9T_Preferences.save FAIL, fallback commit", directErr);
            try { D9T_COMMIT_PREFERENCES(); } catch (commitErr) { D9T_PREF_LOG("D9T_COMMIT_PREFERENCES FAIL", commitErr); }
        }
        D9T_PREF_STATE("post-saveButtonThemesState", uiSettings);
    } catch (err) {
        D9T_PREF_LOG("D9T_saveButtonThemesState FAIL", err);
    }
}

function D9T_getButtonThemeList() {
    try {
        var uiSettings = D9T_getUiSettingsSafe();
        return uiSettings.buttonThemes || [];
    } catch (err) {
        D9T_PREF_LOG("D9T_getButtonThemeList FAIL", err);
        return [];
    }
}

function D9T_findButtonThemeIndex(id) {
    var list = D9T_getButtonThemeList();
    for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id) { return i; }
    }
    return -1;
}

function D9T_getDefaultButtonTheme(id) {
    if (!defaultScriptPreferencesObj || !defaultScriptPreferencesObj.uiSettings) { return null; }
    var defaults = defaultScriptPreferencesObj.uiSettings.buttonThemes;
    if (!(defaults instanceof Array)) { return null; }
    for (var i = 0; i < defaults.length; i++) {
        if (defaults[i] && defaults[i].id === id) {
            return JSON.parse(JSON.stringify(defaults[i]));
        }
    }
    // Fallback seguro caso o tema pedido nao exista nos defaults
    return {
        id: id || "classic",
        name: "Classic",
        width: 120,
        height: 36,
        cornerRadius: 18,
        background: "#2E343B",
        hoverBackground: "#4E5560",
        textColor: "#FFFFFF",
        hoverTextColor: "#FFFFFF",
        labelOffset: 0,
        labelOffsetX: 0,
        labelFontSize: 14,
        textTransform: "none"
    };
}

function D9T_sanitizeHexColor(value, fallback) {
    if (typeof value !== "string") { return fallback; }
    var cleaned = value.replace(/[^0-9a-fA-F]/g, "");
    if (cleaned.length === 3) {
        cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
    }
    if (cleaned.length !== 6) { return fallback; }
    return ("#" + cleaned).toUpperCase();
}

function D9T_sanitizeButtonTheme(theme) {
    if (!theme) { return null; }
    var sanitized = {};
    sanitized.id = theme.id || ("theme_" + new Date().getTime());
    sanitized.name = theme.name || "Personalizado";
    sanitized.width = Math.max(40, Math.min(5000, parseInt(theme.width, 10) || 120));
    sanitized.height = Math.max(24, Math.min(120, parseInt(theme.height, 10) || 36));
    sanitized.cornerRadius = Math.max(0, Math.min(50, parseInt(theme.cornerRadius, 10) || Math.round(sanitized.height / 2)));
    sanitized.background = D9T_sanitizeHexColor(theme.background, "#2E343B");
    sanitized.hoverBackground = D9T_sanitizeHexColor(theme.hoverBackground, "#4E5560");
    sanitized.textColor = D9T_sanitizeHexColor(theme.textColor || "#FFFFFF", "#FFFFFF");
    sanitized.hoverTextColor = D9T_sanitizeHexColor(theme.hoverTextColor || theme.textColor || "#FFFFFF", "#FFFFFF");
    sanitized.labelOffset = Math.max(-40, Math.min(40, parseInt(theme.labelOffset, 10) || 0));
    sanitized.labelOffsetX = Math.max(-80, Math.min(80, parseInt(theme.labelOffsetX, 10) || 0));
    var parsedFont = parseInt(theme.labelFontSize, 10);
    if (isNaN(parsedFont) || parsedFont <= 0) {
        sanitized.labelFontSize = Math.max(8, Math.min(40, Math.round(sanitized.height * 0.42)));
    } else {
        sanitized.labelFontSize = Math.max(8, Math.min(60, parsedFont));
    }
    var transform = (theme.textTransform || "none").toString().toLowerCase();
    if (transform !== "uppercase" && transform !== "lowercase") { transform = "none"; }
    sanitized.textTransform = transform;
    return sanitized;
}

function D9T_getActiveButtonTheme() {
    try {
        var uiSettings = D9T_getUiSettingsSafe();
        var themes = uiSettings.buttonThemes || [];
        if (!themes.length) { return D9T_sanitizeButtonTheme(D9T_getDefaultButtonTheme("classic")); }
        var activeId = uiSettings.activeButtonTheme;
        var activeTheme = null;
        if (activeId) {
            var idx = D9T_findButtonThemeIndex(activeId);
            if (idx > -1) { activeTheme = themes[idx]; }
        }
        if (!activeTheme) { activeTheme = themes[0]; }
        return D9T_sanitizeButtonTheme(activeTheme);
    } catch (err) {
        D9T_PREF_LOG("D9T_getActiveButtonTheme FAIL", err);
        return D9T_sanitizeButtonTheme(D9T_getDefaultButtonTheme("classic"));
    }
}

function D9T_applyActiveButtonTheme(savePrefs) {
    try {
        var theme = D9T_getActiveButtonTheme();
        if (!theme) { return; }
        D9T_Theme.buttonTheme = theme;
        D9T_refreshRegisteredThemeButtons();
        if (savePrefs === true) {
            D9T_saveButtonThemesState(scriptPreferencesObj.uiSettings.buttonThemes, scriptPreferencesObj.uiSettings.activeButtonTheme);
        }
        D9T_PREF_STATE("applyActiveButtonTheme", scriptPreferencesObj && scriptPreferencesObj.uiSettings);
    } catch (err) {
        D9T_PREF_LOG("D9T_applyActiveButtonTheme FAIL", err);
    }
}

function D9T_registerThemeButton(control) {
    if (!control) { return; }
    if (!control.__buttonThemeRegistered) {
        BUTTON_THEME_TARGETS.push(control);
        control.__buttonThemeRegistered = true;
    }
    D9T_applyThemeToButtonControl(control, D9T_getActiveButtonTheme());
}

function D9T_refreshRegisteredThemeButtons() {
    var theme = D9T_getActiveButtonTheme();
    for (var i = BUTTON_THEME_TARGETS.length - 1; i >= 0; i--) {
        var ctrl = BUTTON_THEME_TARGETS[i];
        if (!ctrl || !ctrl.graphics) {
            BUTTON_THEME_TARGETS.splice(i, 1);
            continue;
        }
        D9T_applyThemeToButtonControl(ctrl, theme);
    }
}

function D9T_previewThemeOnTargets(themeData) {
    if (!themeData) { return; }
    var previewTheme = D9T_sanitizeButtonTheme(themeData);
    for (var i = BUTTON_THEME_TARGETS.length - 1; i >= 0; i--) {
        var ctrl = BUTTON_THEME_TARGETS[i];
        if (!ctrl || !ctrl.graphics) {
            BUTTON_THEME_TARGETS.splice(i, 1);
            continue;
        }
        D9T_applyThemeToButtonControl(ctrl, previewTheme);
    }
}

  function D9T_applyThemeToButtonControl(control, theme) {
      if (!control) { return; }
      var overrideId = (control.__buttonThemeOverrides && control.__buttonThemeOverrides.themeId) ? control.__buttonThemeOverrides.themeId : null;
      var baseTheme = theme || D9T_getActiveButtonTheme();
      if (overrideId) {
          var list = D9T_getButtonThemeList();
          var idx = D9T_findButtonThemeIndex(overrideId);
          if (idx > -1 && list[idx]) {
              baseTheme = list[idx];
          }
      }
      var resolvedTheme = D9T_sanitizeButtonTheme(baseTheme);
      if (!resolvedTheme) { return; }
      var appliedTheme = {
          id: resolvedTheme.id,
          name: resolvedTheme.name,
          width: resolvedTheme.width,
          height: resolvedTheme.height,
          cornerRadius: resolvedTheme.cornerRadius,
          background: resolvedTheme.background,
          hoverBackground: resolvedTheme.hoverBackground,
          textColor: resolvedTheme.textColor,
          hoverTextColor: resolvedTheme.hoverTextColor,
          labelOffset: resolvedTheme.labelOffset,
          labelOffsetX: resolvedTheme.labelOffsetX,
          labelFontSize: resolvedTheme.labelFontSize,
          textTransform: resolvedTheme.textTransform
      };
      var overrides = control.__buttonThemeOverrides;
      if (overrides) {
          if (overrides.name) { appliedTheme.name = overrides.name; }
          if (overrides.width !== undefined) {
              var ow = parseInt(overrides.width, 10);
              if (!isNaN(ow)) { appliedTheme.width = Math.max(40, Math.min(5000, ow)); }
          }
          if (overrides.height !== undefined) {
              var oh = parseInt(overrides.height, 10);
              if (!isNaN(oh)) { appliedTheme.height = Math.max(24, Math.min(120, oh)); }
          }
          if (overrides.cornerRadius !== undefined) {
              var or = parseInt(overrides.cornerRadius, 10);
              if (!isNaN(or)) { appliedTheme.cornerRadius = Math.max(0, Math.min(60, or)); }
          }
          if (overrides.background) {
              appliedTheme.background = D9T_sanitizeHexColor(overrides.background, appliedTheme.background);
          }
          if (overrides.hoverBackground) {
              appliedTheme.hoverBackground = D9T_sanitizeHexColor(overrides.hoverBackground, appliedTheme.hoverBackground);
          }
          if (overrides.textColor) {
              appliedTheme.textColor = D9T_sanitizeHexColor(overrides.textColor, appliedTheme.textColor);
          }
          if (overrides.hoverTextColor) {
              appliedTheme.hoverTextColor = D9T_sanitizeHexColor(overrides.hoverTextColor, appliedTheme.hoverTextColor);
          }
          if (overrides.labelOffset !== undefined) {
              var ol = parseInt(overrides.labelOffset, 10);
              if (!isNaN(ol)) { appliedTheme.labelOffset = Math.max(-40, Math.min(40, ol)); }
          }
          if (overrides.labelOffsetX !== undefined) {
              var olx = parseInt(overrides.labelOffsetX, 10);
              if (!isNaN(olx)) { appliedTheme.labelOffsetX = Math.max(-80, Math.min(80, olx)); }
          }
          if (overrides.labelFontSize !== undefined) {
              var ofs = parseInt(overrides.labelFontSize, 10);
              if (!isNaN(ofs)) { appliedTheme.labelFontSize = Math.max(8, Math.min(60, ofs)); }
          }
          if (overrides.textTransform) {
              var ot = overrides.textTransform.toString().toLowerCase();
              if (ot === "uppercase" || ot === "lowercase" || ot === "none") { appliedTheme.textTransform = ot; }
          }
      }
      control.__buttonThemeSource = resolvedTheme;
      control.__buttonThemeData = appliedTheme;
      control.__buttonHover = control.__buttonHover === true;
      control.__buttonActive = control.__buttonActive === true;
      var isHover = (control.__buttonHover === true) || (control.__buttonActive === true);
      var currentBg = isHover ? appliedTheme.hoverBackground : appliedTheme.background;
      var currentText = isHover ? appliedTheme.hoverTextColor : appliedTheme.textColor;
      control.preferredSize = [appliedTheme.width, appliedTheme.height];
      control.size = [appliedTheme.width, appliedTheme.height];
      control.minimumSize = [appliedTheme.width, appliedTheme.height];
      control.__buttonCornerRadius = appliedTheme.cornerRadius;
      control.buttonColor = hexToRgb(currentBg);
      control.hoverButtonColor = hexToRgb(appliedTheme.hoverBackground);
      control.textColor = hexToRgb(currentText);
      control.hoverTextColor = hexToRgb(appliedTheme.hoverTextColor);
      control.__buttonLabelOffset = appliedTheme.labelOffset;
      control.__buttonLabelOffsetX = appliedTheme.labelOffsetX;
      control.__buttonLabelFontSize = appliedTheme.labelFontSize;
      control.__buttonTextTransform = appliedTheme.textTransform;
      if (!control.__buttonDisplayedText) { control.__buttonDisplayedText = control.text || ""; }
      if (!control.__buttonBaseText) { control.__buttonBaseText = control.__buttonDisplayedText; }
      if (typeof control.text === "string" && control.text !== control.__buttonDisplayedText) {
          control.__buttonBaseText = control.text;
      }
      var baseLabel = control.__buttonBaseText || "";
      var displayLabel = baseLabel;
      if (appliedTheme.textTransform === "uppercase") { displayLabel = baseLabel.toUpperCase(); }
      else if (appliedTheme.textTransform === "lowercase") { displayLabel = baseLabel.toLowerCase(); }
      control.__buttonDisplayedText = displayLabel;
      if (typeof control.text === "string" && control.text !== displayLabel) {
          control.text = displayLabel;
      }
      if (typeof control.notify === "function") {
          try { control.notify("onDraw"); } catch (drawErr) {}
      }
  }

// ============================================
// COMPONENTES DE BOTÃO LEGADOS (themeButton)
// ============================================
// Estas funções parecem ser de uma versão anterior do tema.

function themeButton(sectionGrp, ctrlProperties) {
    try {
        ctrlProperties = ctrlProperties || {};
        var newUiCtrlObj = {};
        var tipTxt = D9T_BUILD_TIP_TEXT(ctrlProperties);
        
        var newBtnGrp = sectionGrp.add("group");
        newBtnGrp.orientation = "stack";
        
        // Botões de clique invisíveis
        newUiCtrlObj.leftClick = newBtnGrp.add("button", undefined, "");
        newUiCtrlObj.leftClick.size = [0, 0];
        newUiCtrlObj.leftClick.visible = false;
        newUiCtrlObj.rightClick = newBtnGrp.add("button", undefined, "");
        newUiCtrlObj.rightClick.size = [0, 0];
        newUiCtrlObj.rightClick.visible = false;
        
        // O botão visível (customButton)
        newUiCtrlObj.label = newBtnGrp.add("customButton");
        newUiCtrlObj.label.text = ctrlProperties.labelTxt || "";
        newUiCtrlObj.label.__buttonBaseText = newUiCtrlObj.label.text;
        newUiCtrlObj.label.__buttonDisplayedText = newUiCtrlObj.label.text;
        var initialTheme = D9T_getActiveButtonTheme();
        if (initialTheme) {
            newUiCtrlObj.label.minimumSize = [initialTheme.width, initialTheme.height];
            newUiCtrlObj.label.preferredSize = [initialTheme.width, initialTheme.height];
            newUiCtrlObj.label.maximumSize = [initialTheme.width, initialTheme.height];
        } else {
            newUiCtrlObj.label.minimumSize = [68, 34];
        }
        newUiCtrlObj.label.helpTip = tipTxt;
        var overrides = {};
        var overrideCount = 0;
        if (ctrlProperties.width !== undefined) { overrides.width = ctrlProperties.width; overrideCount++; }
        if (ctrlProperties.height !== undefined) { overrides.height = ctrlProperties.height; overrideCount++; }
        if (ctrlProperties.cornerRadius !== undefined) { overrides.cornerRadius = ctrlProperties.cornerRadius; overrideCount++; }
        if (ctrlProperties.buttonColor !== undefined) { overrides.background = ctrlProperties.buttonColor; overrideCount++; }
        if (ctrlProperties.hoverButtonColor !== undefined) { overrides.hoverBackground = ctrlProperties.hoverButtonColor; overrideCount++; }
        if (ctrlProperties.textColor !== undefined) { overrides.textColor = ctrlProperties.textColor; overrideCount++; }
        if (ctrlProperties.hoverTextColor !== undefined) { overrides.hoverTextColor = ctrlProperties.hoverTextColor; overrideCount++; }
        if (ctrlProperties.labelOffset !== undefined) { overrides.labelOffset = ctrlProperties.labelOffset; overrideCount++; }
        if (ctrlProperties.labelOffsetX !== undefined) { overrides.labelOffsetX = ctrlProperties.labelOffsetX; overrideCount++; }
        if (ctrlProperties.labelFontSize !== undefined) { overrides.labelFontSize = ctrlProperties.labelFontSize; overrideCount++; }
        if (ctrlProperties.textTransform) { overrides.textTransform = ctrlProperties.textTransform; overrideCount++; }
        if (ctrlProperties.themeId) { overrides.themeId = ctrlProperties.themeId; }
        if (ctrlProperties.labelOffset !== undefined) { overrides.labelOffset = ctrlProperties.labelOffset; overrideCount++; }
        if (ctrlProperties.labelOffsetX !== undefined) { overrides.labelOffsetX = ctrlProperties.labelOffsetX; overrideCount++; }
        if (ctrlProperties.labelFontSize !== undefined) { overrides.labelFontSize = ctrlProperties.labelFontSize; overrideCount++; }
        if (ctrlProperties.textTransform) { overrides.textTransform = ctrlProperties.textTransform; overrideCount++; }
        if (ctrlProperties.themeId) { overrides.themeId = ctrlProperties.themeId; }
        if (ctrlProperties.labelOffset !== undefined) { overrides.labelOffset = ctrlProperties.labelOffset; overrideCount++; }
        if (ctrlProperties.labelFontSize !== undefined) { overrides.labelFontSize = ctrlProperties.labelFontSize; overrideCount++; }
        if (ctrlProperties.textTransform) { overrides.textTransform = ctrlProperties.textTransform; overrideCount++; }
        if (ctrlProperties.themeId) { overrides.themeId = ctrlProperties.themeId; }
        if (overrideCount > 0) {
            newUiCtrlObj.label.__buttonThemeOverrides = overrides;
        }
        drawThemeButton(newUiCtrlObj.label);
        D9T_registerThemeButton(newUiCtrlObj.label);
        
        var refreshState = function (ctrl) {
            if (!ctrl) { return; }
            D9T_applyThemeToButtonControl(ctrl, ctrl.__buttonThemeSource || D9T_getActiveButtonTheme());
        };
        newUiCtrlObj.label.addEventListener("mouseover", function () {
            this.__buttonHover = true;
            refreshState(this);
        });
        newUiCtrlObj.label.addEventListener("mouseout", function () {
            this.__buttonHover = false;
            this.__buttonActive = false;
            refreshState(this);
        });
        newUiCtrlObj.label.addEventListener("mousedown", function () {
            this.__buttonActive = true;
            this.__buttonHover = true;
            refreshState(this);
        });
        newUiCtrlObj.label.addEventListener("mouseup", function () {
            this.__buttonActive = false;
            refreshState(this);
        });
        
        // Eventos de clique
        newUiCtrlObj.label.onClick = function () { this.parent.children[0].notify(); }; // Click esquerdo
        newUiCtrlObj.label.addEventListener("click", function (c) {
            if (c.button == 2) this.parent.children[1].notify(); // Click direito
        });
        
        return newUiCtrlObj;
    } catch (err) { alert(err.message); }
}


function themeAltButton(sectionGrp, ctrlProperties) {
    try {
        ctrlProperties = ctrlProperties || {};
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
        newUiCtrlObj.label.text = ctrlProperties.labelTxt || "Botão";
        newUiCtrlObj.label.__buttonBaseText = newUiCtrlObj.label.text;
        newUiCtrlObj.label.__buttonDisplayedText = newUiCtrlObj.label.text;
        newUiCtrlObj.label.helpTip = tipTxt;
        var overrides = {};
        var overrideCount = 0;
        if (ctrlProperties.width !== undefined) { overrides.width = ctrlProperties.width; overrideCount++; }
        if (ctrlProperties.height !== undefined) { overrides.height = ctrlProperties.height; overrideCount++; }
        if (ctrlProperties.cornerRadius !== undefined) { overrides.cornerRadius = ctrlProperties.cornerRadius; overrideCount++; }
        if (ctrlProperties.buttonColor !== undefined) { overrides.background = ctrlProperties.buttonColor; overrideCount++; }
        if (ctrlProperties.hoverButtonColor !== undefined) { overrides.hoverBackground = ctrlProperties.hoverButtonColor; overrideCount++; }
        if (ctrlProperties.textColor !== undefined) { overrides.textColor = ctrlProperties.textColor; overrideCount++; }
        if (ctrlProperties.hoverTextColor !== undefined) { overrides.hoverTextColor = ctrlProperties.hoverTextColor; overrideCount++; }
        if (overrideCount > 0) {
            newUiCtrlObj.label.__buttonThemeOverrides = overrides;
        }
        drawThemeAltButton(newUiCtrlObj.label);
        D9T_registerThemeButton(newUiCtrlObj.label);
        
        var refreshAltState = function (ctrl) {
            if (!ctrl) { return; }
            D9T_applyThemeToButtonControl(ctrl, ctrl.__buttonThemeSource || D9T_getActiveButtonTheme());
        };
        newUiCtrlObj.label.addEventListener("mouseover", function () {
            this.__buttonHover = true;
            refreshAltState(this);
        });
        newUiCtrlObj.label.addEventListener("mouseout", function () {
            this.__buttonHover = false;
            this.__buttonActive = false;
            refreshAltState(this);
        });
        newUiCtrlObj.label.addEventListener("mousedown", function () {
            this.__buttonActive = true;
            this.__buttonHover = true;
            refreshAltState(this);
        });
        newUiCtrlObj.label.addEventListener("mouseup", function () {
            this.__buttonActive = false;
            refreshAltState(this);
        });
        
        // Eventos de clique
        newUiCtrlObj.label.onClick = function () { this.parent.children[0].notify(); };
        newUiCtrlObj.label.addEventListener("click", function (c) { if (c.button == 2) this.parent.children[1].notify(); });
        
        return newUiCtrlObj;
    } catch (err) { alert("Erro no themeAltButton: " + err.message); return null; }
}


function drawThemeButton(button) {
        button.onDraw = function () {
            var g = this.graphics;
            var w = this.size.width;
            var h = this.size.height;
            var radius = this.__buttonCornerRadius;
            if (typeof radius !== 'number' || isNaN(radius)) { radius = Math.round(h / 2); }
            var maxRadius = Math.min(w, h) / 2;
            radius = Math.max(0, Math.min(maxRadius, radius));
            var fillBrush = g.newBrush(g.BrushType.SOLID_COLOR, this.buttonColor);
            var textPen = g.newPen(g.PenType.SOLID_COLOR, this.textColor, 1);
            g.newPath();
            if (radius <= 0) {
                g.rectPath(0, 0, w, h);
            } else {
                var diameter = radius * 2;
                g.ellipsePath(0, 0, diameter, diameter);
                g.ellipsePath(w - diameter, 0, diameter, diameter);
                g.ellipsePath(0, h - diameter, diameter, diameter);
                g.ellipsePath(w - diameter, h - diameter, diameter, diameter);
                g.rectPath(radius, 0, w - (2 * radius), h);
                g.rectPath(0, radius, w, h - (2 * radius));
            }
            g.fillPath(fillBrush);
            
            var textLinesArray = this.text.split("\n");
            var themeFontSize = (typeof this.__buttonLabelFontSize === "number" && !isNaN(this.__buttonLabelFontSize)) ? this.__buttonLabelFontSize : null;
            var fontSize = themeFontSize ? themeFontSize : Math.max(10, Math.min(16, Math.round(h * 0.45)));
            try {
                var drawFont = ScriptUI.newFont("Arial", "Bold", fontSize);
                if (drawFont) { g.font = drawFont; }
            } catch (fontErr) {}
            var lineSpacing = Math.max(2, Math.round(fontSize * 0.25));
            var metrics = [];
            var totalHeight = 0;
            for (var i = 0; i < textLinesArray.length; i++) {
                var txt = textLinesArray[i] || "";
                var measured = g.measureString(txt);
                var height = Math.max(fontSize, (measured && measured.height) ? measured.height : fontSize);
                metrics.push({ text: txt, size: measured, height: height });
                totalHeight += height;
                if (i < textLinesArray.length - 1) { totalHeight += lineSpacing; }
            }
            var offsetY = (typeof this.__buttonLabelOffset === "number" && !isNaN(this.__buttonLabelOffset)) ? this.__buttonLabelOffset : 0;
            var startY = (h - totalHeight) / 2 + offsetY;
            var cursorY = startY;
            for (var l = 0; l < metrics.length; l++) {
                var data = metrics[l];
                var textSize = data.size;
                var baseWidth = textSize ? textSize.width : 0;
                var offsetX = (typeof this.__buttonLabelOffsetX === "number" && !isNaN(this.__buttonLabelOffsetX)) ? this.__buttonLabelOffsetX : 0;
                var px = ((w - baseWidth) / 2) + offsetX;
                var height = data.height;
                var ascent = (textSize && typeof textSize.ascent === "number")
                    ? textSize.ascent
                    : Math.max(1, height * 0.75);
                var baseline = cursorY + ascent;
                g.drawString(data.text, textPen, px, baseline);
                cursorY += height + lineSpacing;
            }
        };
    }
  
  // Função de desenho para themeAltButton (parece idêntica a drawThemeButton)
  function drawThemeAltButton(button) {
      drawThemeButton(button);
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
// FUNÇÕES AUXILIARES DE COR E ESTILO
// ============================================

/**
 * Converte um string HEX (#RRGGBB) para um array RGB normalizado [r, g, b] (0.0 a 1.0).
 * @param {String} hex - A cor em formato hexadecimal.
 * @returns {Array} - [r, g, b]
 */
function hexToRgb(hex) {
    if (typeof hex !== 'string') return [1, 1, 1]; // Fallback para branco
    hex = hex.replace('#', '');
    if (hex.length > 6) hex = hex.substring(0, 6); // Ignora alpha
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
}

// Define a cor de FUNDO (backgroundColor) de um elemento da UI.
function setBgColor(w, hex) {
    var color = hexToRgb(hex);
    var bType = w.graphics.BrushType.SOLID_COLOR;
    w.graphics.backgroundColor = w.graphics.newBrush(bType, color);
}

// Define a cor de PREENCHIMENTO (fillBrush) de um customButton.
function setUiCtrlColor(ctrl, hex) {
    var color = hexToRgb(hex);
    var bType = ctrl.graphics.BrushType.SOLID_COLOR;
    ctrl.fillBrush = ctrl.graphics.newBrush(bType, color);
}

// Define a cor do TEXTO (foregroundColor) de um elemento da UI.
function setFgColor(ctrl, hex) {
    var color = hexToRgb(hex);
    var pType = ctrl.graphics.PenType.SOLID_COLOR;
    ctrl.graphics.foregroundColor = ctrl.graphics.newPen(pType, color, 1);
}

/**
 * Aplica um efeito de hover (troca de cor do texto) a um controle.
 * @param {Object} ctrl - O controle (ex: statictext).
 * @param {String} normalColor - Cor HEX normal.
 * @param {String} highlightColor - Cor HEX no hover.
 */
function setCtrlHighlight(ctrl, normalColor, highlightColor) {
    setFgColor(ctrl, normalColor); // Define cor inicial
    ctrl.addEventListener("mouseover", function () {
        setFgColor(ctrl, highlightColor); // Cor de hover
    });
    ctrl.addEventListener("mouseout", function () {
        setFgSColor(ctrl, normalColor); // Restaura cor normal
    });
}

// Função de desenho customizada para 'customButton' (usada por themeDivider).
function customDraw() {
    with(this) {
        graphics.drawOSControl(); // Desenha o fundo padrão
        graphics.rectPath(0, 0, size[0], size[1]); // Desenha um retângulo
        graphics.fillPath(fillBrush); // Preenche com a cor definida (fillBrush)
    }
}

// ============================================
// FUNÇÕES AUXILIARES (DIVERSAS)
// ============================================

function D9T_NORMALIZE_MARGINS(margins) {
    var normalized = [0, 0, 0, 0];
    if (!(margins instanceof Array)) { return normalized; }
    for (var i = 0; i < 4; i++) {
        var value = parseFloat(margins[i]);
        normalized[i] = isNaN(value) ? 0 : value;
    }
    return normalized;
}

function D9T_ADD_MARGINS(baseMargins, extraMargins) {
    var base = D9T_NORMALIZE_MARGINS(baseMargins);
    var extra = D9T_NORMALIZE_MARGINS(extraMargins);
    for (var i = 0; i < 4; i++) {
        base[i] += extra[i];
    }
    return base;
}

function D9T_APPLY_GROUP_MARGINS(group, margins) {
    if (!group) { return; }
    group.margins = D9T_NORMALIZE_MARGINS(margins);
}

// Troca o ícone visível em um grupo de imagens (stack)
function changeIcon(imageIndex, imagesGrp) {
    for (var i = 0; i < imagesGrp.children.length; i++) {
        imagesGrp.children[i].visible = (i == imageIndex);
    }
}

// Popula os ícones de produção (ex: GNEWS) (usado pelo GNEWS_Templates)
function populateMainIcons(imagesGrp, prodArray, dropdownList) {
    while (imagesGrp.children.length > 0) {
        imagesGrp.remove(imagesGrp.children[0]);
    }
    if (!prodArray || prodArray.length === 0) return;
    
    for (var i = 0; i < prodArray.length; i++) {
        var newIcon = imagesGrp.add("image", undefined, undefined);
        try {
            newIcon.image = eval(prodArray[i].icon); // 'eval' para converter string (ex: "GNEWS_ICON") na variável
        } catch (err) {}
        
        newIcon.helpTip = prodArray[i].name + "\n\n" + D9T_Theme.text.doubleClick + " para editar a lista de produções";
        newIcon.preferredSize = [24, 24];
        newIcon.visible = (i == 0); // Só o primeiro é visível
        
        // Evento de duplo clique para abrir a configuração
        newIcon.addEventListener("click", function (c) {
            if (c.detail == 2) { // Duplo clique
                if (typeof d9ProdFoldersDialog === 'function') {
                    d9ProdFoldersDialog(D9T_prodArray); // Abre a janela de config
                    loadProductionData(); // Recarrega os dados
                    
                    // Atualiza o dropdown associado
                    if (dropdownList) {
                        dropdownList.removeAll();
                        if (typeof populateDropdownList === 'function' && typeof getProdNames === 'function') {
                            populateDropdownList(getProdNames(D9T_prodArray), dropdownList);
                        }
                        dropdownList.selection = 0;
                        if (dropdownList.onChange) dropdownList.onChange();
                    }
                    
                    // Recarrega os ícones
                    populateMainIcons(imagesGrp, D9T_prodArray, dropdownList);
                    imagesGrp.layout.layout(true);
                }
            }
        });
    }
}

// Trava o redimensionamento da janela, botões de maximizar/minimizar.
function D9T_LOCK_WINDOW_RESIZE(win) {
    if (!win) { return; }
    try {
        if (typeof win.resizeable !== "undefined") { win.resizeable = false; }
        if (typeof win.maximizeButton !== "undefined") { win.maximizeButton = false; }
        if (typeof win.minimizeButton !== "undefined") { win.minimizeButton = false; }
    } catch (e) {} // Ignora erros (ex: se for painel dockado)
}
