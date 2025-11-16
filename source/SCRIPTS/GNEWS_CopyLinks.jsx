/**********************************************************************************
 *
 * GNEWS CopyLinks
 * Versão: 2.3 (Correção de Layout do Cabeçalho)
 *
 * DESCRIÇÃO:
 * Fornece uma interface de acesso rápido para pastas de rede, arquivos (como PDFs)
 * e links web, organizados em grupos e subgrupos.
 *
 * MODULOS USADOS:
 * - source/globals.js (para variáveis de tema e cores globais)
 * - source/libraries/HELP lib.js (para a janela de ajuda)
 * - source/libraries/JSON lib.js (para a função JSON.parse())
 * - source/libraries/ICON lib.js (fornece os ícones para os botões da UI)
 * - source/layout/main_ui_functions.js (para os componentes 'themeIconButton')
 * - System_Settings.json (para as configurações de layout da janela)
 * - Dados_Config.json (para os dados de grupos, subgrupos e links)
 *
 * ATUALIZAÇÃO (v2.3):
 * - CORREÇÃO DE LAYOUT: O cabeçalho foi reconstruído para usar 'orientation = stack'
 * com grupos filhos alinhados à 'left' e 'right', corrigindo o alinhamento
 * do subtítulo e do botão de ajuda para espelhar o GNEWS_Normalizer.jsx
 * e GNEWS_CropComp.jsx.
 *
 **********************************************************************************/

// Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

    function launchCopyLinks() {

    // =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// =================================================================================
    var SCRIPT_NAME = "GNEWS CopyLinks";
    var SCRIPT_VERSION = "2.3";
    var SCRIPT_WINDOW_TITLE = SCRIPT_NAME + " v" + SCRIPT_VERSION;
    var SCRIPT_SUBTITLE = "Acesso Rápido a Pastas e Links"; // Subtítulo padronizado
    var LARGURA_BOTAO_TEMATICO = 460; // Ajuste rápido da largura padrão dos botões temáticos
    var ALTURA_BOTAO_TEMATICO = 32;   // Ajuste rápido da altura padrão dos botões temáticos
    
    var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
    var PREFS_KEY = "CopyLinks";
    var defaultPrefs = { quickAccess: true };
    var modulePrefs = prefsApi ? prefsApi.getModulePrefs(PREFS_KEY) : {};
    if (typeof modulePrefs !== 'object' || modulePrefs === null) { modulePrefs = {}; }
    function getPrefValue(key) {
        return modulePrefs.hasOwnProperty(key) ? modulePrefs[key] : defaultPrefs[key];
    }
    function setPrefValue(key, value, persist) {
        modulePrefs[key] = value;
        if (prefsApi) { prefsApi.setModulePref(PREFS_KEY, key, value, !!persist); }
    }

    var ATIVAR_ACESSO_RAPIDO = getPrefValue("quickAccess"); // Habilita/desabilita o botão "Adicionar ao Acesso Rápido"
    // Define a pasta raiz do script principal para resolver caminhos relativos
    var GNEWS_D9_TOOLS_ROOT = new File($.fileName).parent.parent.parent;

    // =================================================================================
    // --- FUNÇÕES AUXILIARES DE TEMA E ARQUIVOS (Padrão Renamer) ---
    // =================================================================================

    function hexToRgb(hex) { if (hex == undefined) return [0,0,0]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { if (typeof hexColor !== 'undefined') element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, hexToRgb(hexColor)); } catch (e) {} }
    function setFgColor(element, hexColor) { try { if (typeof hexColor !== 'undefined') element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, hexToRgb(hexColor), 1); } catch (e) {} }

    function applyFixedSize(target, width, height) {
        if (!target || typeof width !== 'number' || typeof height !== 'number') { return; }
        var sizeArr = [width, height];
        target.minimumSize = sizeArr;
        target.maximumSize = sizeArr;
        target.preferredSize = sizeArr;
        target.size = sizeArr;
    }

    function enforceThemeButtonSize(ctrl, width, height) {
        if (!ctrl) { return; }
        if (typeof width === 'number' && typeof height === 'number') {
            applyFixedSize(ctrl, width, height);
            if (ctrl.parent && ctrl.parent.type === "group") {
                ctrl.parent.alignment = ['fill','center'];
            }
        }
        ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
        if (typeof width === 'number') { ctrl.__buttonThemeOverrides.width = width; }
        if (typeof height === 'number') { ctrl.__buttonThemeOverrides.height = height; }
        var relock = function () { applyFixedSize(ctrl, width, height); };
        if (typeof ctrl.onDraw === 'function') {
            var prevDraw = ctrl.onDraw;
            ctrl.onDraw = function () { relock(); prevDraw.apply(this, arguments); };
        } else {
            ctrl.onDraw = relock;
        }
        if (typeof ctrl.addEventListener === 'function') {
            var events = ["mouseover","mouseout","mousedown","mouseup"];
            for (var i = 0; i < events.length; i++) {
                try { ctrl.addEventListener(events[i], relock); } catch (evtErr) {}
            }
        }
        if (typeof D9T_applyThemeToButtonControl === 'function') {
            try {
                var baseTheme = ctrl.__buttonThemeSource;
                if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') { baseTheme = D9T_getActiveButtonTheme(); }
                D9T_applyThemeToButtonControl(ctrl, baseTheme);
            } catch (themeErr) {}
        }
    }

    function createThemeButtonCtrl(parent, label, width, height, tip) {
        var targetWidth = (typeof width === 'number') ? width : LARGURA_BOTAO_TEMATICO;
        var targetHeight = (typeof height === 'number') ? height : ALTURA_BOTAO_TEMATICO;
        var ctrl = null;
        if (typeof themeButton === 'function') {
            try {
                var cfg = { labelTxt: label, width: targetWidth, height: targetHeight };
                var wrapper = new themeButton(parent, cfg);
                ctrl = (wrapper && wrapper.label) ? wrapper.label : null;
            } catch (e) { ctrl = null; }
        }
        if (!ctrl) {
            ctrl = parent.add("button", undefined, label);
            applyFixedSize(ctrl, targetWidth, targetHeight);
        }
        if (tip && ctrl) { ctrl.helpTip = tip; }
        enforceThemeButtonSize(ctrl, targetWidth, targetHeight);
        return ctrl;
    }
    function themedAlert(title, message) { var d = new Window("dialog", title); d.orientation="column"; d.alignChildren=["center","center"]; d.spacing=10; d.margins=15; setBgColor(d,typeof bgColor1!='undefined'?bgColor1:'#282828'); var m=d.add('group'); m.orientation='column'; var l=message.split('\n'); for(var i=0;i<l.length;i++){var t=m.add('statictext',undefined,l[i]); setFgColor(t,typeof normalColor1!='undefined'?normalColor1:'#FFFFFF');} var b=d.add("button",undefined,"OK",{name:'ok'}); b.size=[100,25]; d.center(); d.show(); }

    // Função para ler JSON, copiada do GNEWS_Renamer.jsx.
    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) { throw new Error("Arquivo de configuração não encontrado em: " + filePath); }
        try {
            file.open("r"); var content = file.read(); file.close();
            return JSON.parse(content);
        } catch (e) { throw new Error("Erro ao ler ou processar o arquivo JSON: " + filePath + "\n" + e.toString()); }
    }

    // =======================================================================
    // --- ETAPA 1: CARREGAMENTO DE DADOS (Lógica Autônoma) ---
    // =======================================================================
    var layoutConfig, linkData;
    
    function loadCopyLinksData() {
        try {
            if (typeof scriptMainPath === 'undefined' || scriptMainPath === null) {
                throw new Error("A variável global 'scriptMainPath' não foi encontrada. O script principal (GND9TOOLS.jsx) pode ter falhado ao carregar.");
            }
            
            var systemSettingsData = readJsonFile(scriptMainPath + "/System_Settings.json"); //
            var dadosConfigData = readJsonFile(scriptMainPath + "/Dados_Config.json"); //

            var layoutConfig = systemSettingsData.COPYLINKS_Settings; //
            if (!layoutConfig) throw new Error("'COPYLINKS_Settings' não encontrado em System_Settings.json.");

            var linkData = dadosConfigData.CAMINHOS_REDE.caminhos; //
            if (!linkData || !linkData.grupos) throw new Error("'CAMINHOS_REDE.caminhos' não encontrado ou inválido em Dados_Config.json.");

            return {
                layout: layoutConfig,
                links: linkData
            };
        } catch (e) {
            themedAlert("Erro Crítico de Dados (CopyLinks)", e.toString());
            return null;
        }
    }

    var loadedData = loadCopyLinksData();
    if (!loadedData) return; 

    layoutConfig = loadedData.layout;
    linkData = loadedData.links;

    // =================================================================================
    // --- FUNÇÕES PRINCIPAIS DO SCRIPT ---
    // =================================================================================
    var isWindows = ($.os.indexOf("Windows") !== -1);

    function hasWriteAccess() { return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY"); }
    function toggleQuickAccess(enabled) {
        ATIVAR_ACESSO_RAPIDO = !!enabled;
        setPrefValue("quickAccess", ATIVAR_ACESSO_RAPIDO, true);
    }

    function copyText(text) {
        try {
            var tempFile = new File(Folder.temp.fsName + "/gnews_copy_temp.txt");
            tempFile.encoding = "UTF-8";
            tempFile.open("w"); tempFile.write(text); tempFile.close();
            var command = isWindows ? 'cmd.exe /c powershell.exe -NoProfile -Command "Get-Content \'' + tempFile.fsName + '\' | Set-Clipboard"' : "pbcopy < " + tempFile.fsName;
            system.callSystem(command);
            $.sleep(50); 
            tempFile.remove();
            return true;
        } catch (e) {
            themedAlert("Erro ao Copiar", "Falha ao copiar para a área de transferência:\n" + e.toString());
            return false;
        }
    }

    function openPath(path) {
        path = path.replace(/^\s+|\s+$/g, ''); 
        var isPdf = path.toLowerCase().lastIndexOf(".pdf") === path.length - 4;
        var isRelative = path.indexOf(":") === -1 && path.indexOf("\\\\") !== 0 && path.indexOf("http") !== 0;

        if (isPdf && isRelative) {
            var cleanRelativePath = path.replace(/^[\\\/]+/, "");
            var absolutePath = new File(GNEWS_D9_TOOLS_ROOT.fsName + "/" + cleanRelativePath);
            if (absolutePath.exists) { 
                path = absolutePath.fsName; 
            } else { 
                themedAlert("Erro", "❌ PDF não encontrado:\n" + absolutePath.fsName); 
                return; 
            }
        }

        if (path.indexOf("http") === 0) {
            isWindows ? system.callSystem('cmd.exe /c "start ' + path + '"') : system.callSystem('open "' + path + '"');
            return;
        }

        var file = new File(path);
        var folder = new Folder(path);
        if (file.exists) {
            isWindows ? system.callSystem('cmd.exe /c "start "" "' + file.fsName + '"') : system.callSystem('open "' + file.fsName + '"');
        } else if (folder.exists) {
            folder.execute();
        } else {
            themedAlert("Erro", "❌ Arquivo/pasta não encontrado:\n" + path);
        }
    }

    function addPin(path) {
        if (!isWindows) { themedAlert("Aviso", "Acesso Rápido disponível apenas no Windows."); return false; }
        var targetPath = path;
        var file = new File(path);
        if (file.exists) { targetPath = file.parent.fsName; } 
        var folder = new Folder(targetPath);
        if (!folder.exists) { themedAlert("Erro", "Pasta não existe: " + targetPath); return false; }
        try {
            var cmd = 'powershell.exe -Command "$s=New-Object -ComObject Shell.Application;$f=$s.Namespace(\'' + folder.fsName.replace(/\\/g, '\\\\') + '\');$f.Self.InvokeVerb(\'pintohome\')"';
            return (system.callSystem(cmd) === 0);
        } catch (e) { return false; }
    }

    // =================================================================================
    // --- CONSTRUÇÃO DA INTERFACE GRÁFICA (UI) ---
    // =================================================================================
    var win = new Window("palette", SCRIPT_WINDOW_TITLE, undefined, { resizeable: false });
    win.orientation = "column"; win.spacing = 10; win.margins = 15;
    setBgColor(win, bgColor1); 

    // --- CABEÇALHO (TÍTULO E AJUDA) ---
    // CORRIGIDO: Usa 'stack' com grupos alinhados para 'left' e 'right'
    var headerGrp = win.add('group');
    headerGrp.orientation = 'stack'; // Usa 'stack' para sobrepor os grupos
    headerGrp.alignment = 'fill'; // Faz o grupo preencher a largura
    
    // Grupo do Título (Alinhado à Esquerda)
    var titleGroup = headerGrp.add('group');
    titleGroup.alignment = 'left'; // Alinha este grupo à esquerda do 'stack'
    var title = titleGroup.add('statictext', undefined, SCRIPT_SUBTITLE);
    if (typeof setFgColor === 'function' && typeof highlightColor1 !== 'undefined') {
        setFgColor(title, highlightColor1);
    }

    // Grupo do Botão de Ajuda (Alinhado à Direita)
    var helpBtnGroup = headerGrp.add('group');
    helpBtnGroup.alignment = 'right'; // Alinha este grupo à direita do 'stack'
    var helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });

    var quickAccessToggle = win.add("checkbox", undefined, "Habilitar 'Adicionar ao Acesso Rápido'");
    quickAccessToggle.alignment = ['left', 'top'];
    quickAccessToggle.value = ATIVAR_ACESSO_RAPIDO;
    quickAccessToggle.onClick = function () { toggleQuickAccess(!!this.value); };
    
    // --- GRUPO DE SELEÇÃO (DROPDOWNS) ---
    var line2Grp = win.add("group");
    line2Grp.orientation = 'row'; line2Grp.alignment = 'left'; line2Grp.spacing = 10;
    var mainGroupLabel = line2Grp.add("statictext", undefined, "Grupo:");
    setFgColor(mainGroupLabel, monoColor1); 
    
    var mainGroups = linkData.grupos; //
    var mainGroupNames = [];
    for (var i = 0; i < mainGroups.length; i++) { mainGroupNames.push(mainGroups[i].titulo); } //
    
    var mainDropdown = line2Grp.add("dropdownlist", undefined, mainGroupNames);
    mainDropdown.preferredSize.width = 150;
    mainDropdown.selection = 0;

    var subgroupDropdown = line2Grp.add("dropdownlist", undefined, []);
    subgroupDropdown.preferredSize.width = 150;
    
    // --- GRUPO DE CONTEÚDO (LINKS) ---
    var content = win.add("group");
    content.orientation = "column";
    content.spacing = 15;
    content.alignment = 'fill';
    content.alignChildren = 'left';

    // =================================================================================
    // --- FUNÇÕES DE ATUALIZAÇÃO DA UI E EVENTOS ---
    // =================================================================================

    function updateContent(mainGroupIndex, subGroupIndex) {
        while (content.children.length > 0) { content.remove(content.children[0]); }
        if (mainGroupIndex < 0 || subGroupIndex < 0) { win.layout.layout(true); return; }
        
        var layout = layoutConfig.configuracao.layout_geral; //
        var NAME_BTN_HEIGHT = layout.name_btn_height || ALTURA_BOTAO_TEMATICO;
        var NAME_BTN_WIDTH = layout.name_btn_width || LARGURA_BOTAO_TEMATICO;
        var BOTTOM_ROW_HEIGHT = layout.bottom_row_height || 25;
        var TEXT_WIDTH_NORMAL = layout.text_width_normal || 300;
        var TEXT_WIDTH_CATALOGOS = layout.text_width_catalogos || 590;
        
        var group = mainGroups[mainGroupIndex].subgrupos[subGroupIndex];
        var isCatalogos = (group.titulo === "CATÁLOGOS" || group.titulo === "GUIAS");

        for (var i = 0; i < group.links.length; i++) {
            (function() {
                var link = group.links[i]; //
                var linkGroup = content.add("group");
                linkGroup.orientation = "column"; linkGroup.spacing = 5; linkGroup.alignChildren = "left";
                
                var mainBtn = createThemeButtonCtrl(linkGroup, "  " + link.nome, NAME_BTN_WIDTH, NAME_BTN_HEIGHT, link.nome);
                mainBtn.alignment = 'left';

                var controls = linkGroup.add("group");
                controls.orientation = "row"; controls.spacing = 5; controls.alignment = 'left';

                var pinBtnIcon = null;
                var quickToggleIcon = null;
                if (!isCatalogos && isWindows && link.tipo === "folder" && link.caminho.indexOf("http") !== 0) {
                    pinBtnIcon = new themeIconButton(controls, { icon: D9T_ATALHO_ICON, tips: [lClick + 'Adicionar ao Acesso Rápido'] });
                } else {
                    var spacer = controls.add('group'); spacer.preferredSize.width = 30; 
                }
                
                var field = controls.add("edittext", undefined, link.caminho);
                field.helpTip = "Caminho editável"; field.preferredSize.height = BOTTOM_ROW_HEIGHT;
                field.preferredSize.width = isCatalogos ? (TEXT_WIDTH_CATALOGOS + 35) : TEXT_WIDTH_NORMAL; 

                var copyBtnIcon = null;
                if (!isCatalogos) { 
                     copyBtnIcon = new themeIconButton(controls, { icon: D9T_COPY_ICON, tips: [lClick + 'Copiar caminho'] });
                }
            
                // --- ATRIBUIÇÃO DE EVENTOS ---
                mainBtn.onClick = function() { openPath(field.text); };
                
                if (copyBtnIcon) {
                    copyBtnIcon.leftClick.onClick = function() {
                        if (!hasWriteAccess()) { themedAlert("Permissão Negada", "Ação de copiar requer permissão de escrita."); return; }
                        if (copyText(field.text)) { 
                            mainBtn.text = "✓ Copiado!"; 
                            app.setTimeout(function() { mainBtn.text = "  " + link.nome; }, 1500); 
                        }
                    };
                }
                
                if (pinBtnIcon) {
                    pinBtnIcon.leftClick.onClick = function() { 
                        if (addPin(field.text)) { 
                            mainBtn.text = "✓ Adicionado!"; 
                            app.setTimeout(function() { mainBtn.text = "  " + link.nome; }, 1500); 
                        } 
                    };
                }
            })();
        }

        win.layout.layout(true); 
        
        try {
            if (!group || group.links === undefined) { return; }
            var calculatedHeight = 130 + (group.links.length * 80); 
            var groupLayout = layoutConfig.configuracao.layout_grupos[group.titulo]; //
            var maxHeight = (groupLayout && typeof groupLayout.altura === 'number') ? groupLayout.altura : 900; 
            win.size.height = Math.min(calculatedHeight + 20, maxHeight);
            win.layout.layout(true);
        } catch(e) { /* Ignora erros de layout se algo der errado */ }
    }
    
    // --- EVENTOS DOS DROPDOWNS ---
    
    mainDropdown.onChange = function() {
        if (!this.selection) return;
        var selectedMainGroup = mainGroups[this.selection.index];
        subgroupDropdown.removeAll(); 
        
        if (selectedMainGroup && selectedMainGroup.subgrupos) {
            for (var i = 0; i < selectedMainGroup.subgrupos.length; i++) {
                subgroupDropdown.add("item", selectedMainGroup.subgrupos[i].titulo);
            }
            if(subgroupDropdown.items.length > 0) { 
                subgroupDropdown.selection = 0; 
            } else { 
                updateContent(-1, -1); 
            }
        } else {
            updateContent(-1, -1);
        }
    };

    subgroupDropdown.onChange = function() {
        if (this.selection) {
            updateContent(mainDropdown.selection.index, this.selection.index); 
        } else {
             updateContent(-1, -1); 
        }
    };

    // Evento para o botão de Ajuda
    helpBtn.leftClick.onClick = function() { 
        if (typeof showCopyLinksHelp === 'function') { 
            showCopyLinksHelp(); 
        } else { 
            themedAlert("Erro de Módulo", "A biblioteca de ajuda (HELP lib.js) não foi encontrada."); 
        } 
    };
    
    // --- INICIALIZAÇÃO E EXIBIÇÃO DA JANELA ---
    
    mainDropdown.onChange();
    
    var layout = layoutConfig.configuracao.layout_geral; //
    win.size.width = (layout.name_btn_width || LARGURA_BOTAO_TEMATICO) + 60; 
    
    win.layout.layout(true);
    win.center();
    win.show();
}

// A função 'launchCopyLinks()' é chamada pelo script principal 'GND9TOOLS.jsx'
