/**********************************************************************************
 *
 * GNEWS CopyLinks
 * Versão: 3.2 (Visual Unificado)
 *
 * DESCRIÇÃO:
 * Fornece uma interface de acesso rápido para pastas de rede, arquivos e links.
 *
 * MUDANÇAS v3.2:
 * - Botão de Pin (Acesso Rápido) agora aparece para TODOS os itens no Windows
 * (garantindo alinhamento visual em grupos como Links e Catálogos).
 * - Adicionada validação ao clicar: se não for pasta, avisa o usuário.
 *
 **********************************************************************************/

// Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

function launchCopyLinks() {

    // =================================================================================
    // --- VARIÁVEIS DE CONFIGURAÇÃO ---
    // =================================================================================
    var SCRIPT_NAME = "GNEWS CopyLinks";
    var SCRIPT_VERSION = "3.2";
    var SCRIPT_WINDOW_TITLE = SCRIPT_NAME + " v" + SCRIPT_VERSION;
    var SCRIPT_SUBTITLE = "Acesso Rápido a Pastas e Links";
    
    // Configurações de dimensão fixas da UI
    var ICON_WIDTH = 30; // Largura exata dos ícones laterais
    var SPACING = 5;     // Espaçamento entre elementos
    var HEIGHT_ROW = 26; // Altura da linha de input
    var BTN_HEIGHT = 32; // Altura do botão de título

    var GNEWS_D9_TOOLS_ROOT = new File($.fileName).parent.parent.parent;

    // =================================================================================
    // --- FUNÇÕES AUXILIARES ---
    // =================================================================================

    function hexToRgb(hex) { if (hex == undefined) return [0,0,0]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { if (typeof hexColor !== 'undefined') element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, hexToRgb(hexColor)); } catch (e) {} }
    function setFgColor(element, hexColor) { try { if (typeof hexColor !== 'undefined') element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, hexToRgb(hexColor), 1); } catch (e) {} }

    function applyFixedSize(target, width, height) {
        if (!target || typeof width !== 'number' || typeof height !== 'number') { return; }
        target.minimumSize = [width, height];
        target.maximumSize = [width, height];
        target.preferredSize = [width, height];
        target.size = [width, height];
    }

    // Função especial para o botão que deve esticar (FILL)
    function applyFlexibleSize(target, height) {
        if (!target) return;
        target.minimumSize = [50, height]; 
        target.maximumSize = [30000, height]; 
        target.preferredSize = [-1, height];
    }

    function enforceThemeButtonSize(ctrl, width, height) {
        if (!ctrl) { return; }
        
        if (width === -1) {
            applyFlexibleSize(ctrl, height);
        } else {
            applyFixedSize(ctrl, width, height);
        }
        
        ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
        if (width !== -1) ctrl.__buttonThemeOverrides.width = width;
        ctrl.__buttonThemeOverrides.height = height;
        
        if (typeof D9T_applyThemeToButtonControl === 'function') {
            try {
                var baseTheme = ctrl.__buttonThemeSource;
                if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') { baseTheme = D9T_getActiveButtonTheme(); }
                D9T_applyThemeToButtonControl(ctrl, baseTheme);
            } catch (themeErr) {}
        }
    }

    function createThemeButtonCtrl(parent, label, width, height, tip) {
        var ctrl = null;
        var wrapper = null;
        if (typeof themeButton === 'function') {
            try {
                var cfg = { labelTxt: label, width: (width === -1 ? 200 : width), height: height };
                wrapper = new themeButton(parent, cfg);
                ctrl = (wrapper && wrapper.label) ? wrapper.label : null;
                
                if (wrapper) {
                    applyFixedSize(wrapper, width, height);
                    try { wrapper.alignment = ["fill", "top"]; } catch (_w) {}
                }
                
                if (ctrl && ctrl.parent) {
                    ctrl.__wrapper = wrapper;
                    try { ctrl.alignment = ["fill", "top"]; } catch (_c) {}
                    
                    // SEGURANÇA: Trava tamanho interno
                    if (width !== -1) {
                        applyFixedSize(ctrl, width, height);
                    }
                }
            } catch (e) { ctrl = null; }
        }
        
        if (!ctrl) {
            ctrl = parent.add("button", undefined, label);
            if (width !== -1) { applyFixedSize(ctrl, width, height); }
            try { ctrl.alignment = ["fill", "top"]; } catch (_ignore) {}
        }
        
        if (tip && ctrl) { ctrl.helpTip = tip; }
        enforceThemeButtonSize(ctrl, width, height);
        return ctrl;
    }

    function themedAlert(title, message) { var d = new Window("dialog", title); d.orientation="column"; d.alignChildren=["center","center"]; d.spacing=10; d.margins=15; setBgColor(d,typeof bgColor1!='undefined'?bgColor1:'#282828'); var m=d.add('group'); m.orientation='column'; var l=message.split('\n'); for(var i=0;i<l.length;i++){var t=m.add('statictext',undefined,l[i]); setFgColor(t,typeof normalColor1!='undefined'?normalColor1:'#FFFFFF');} var b=d.add("button",undefined,"OK",{name:'ok'}); b.size=[100,25]; d.center(); d.show(); }

    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) { throw new Error("Arquivo não encontrado: " + filePath); }
        try {
            file.open("r"); var content = file.read(); file.close();
            return JSON.parse(content);
        } catch (e) { throw new Error("Erro JSON: " + filePath + "\n" + e.toString()); }
    }

    // =======================================================================
    // --- CARREGAMENTO DE DADOS ---
    // =======================================================================
    var layoutConfig, linkData;
    var baseFieldWidth = 0; 
    
    function loadCopyLinksData() {
        try {
            if (typeof scriptMainPath === 'undefined' || scriptMainPath === null) {
                throw new Error("Variável 'scriptMainPath' não encontrada.");
            }
            var settingsPath = (typeof runtimeConfigPath !== 'undefined') ? (runtimeConfigPath + "/System_Settings.json") : (scriptMainPath + "/System_Settings.json");
            var systemSettingsData = readJsonFile(settingsPath);
            var dadosConfigPath = (typeof runtimeDadosConfigPath !== 'undefined') ? runtimeDadosConfigPath : (scriptMainPath + "/runtime/config/Dados_Config.json");
            var dadosConfigData = readJsonFile(dadosConfigPath);

            var layoutConfig = systemSettingsData.COPYLINKS_Settings;
            var linkData = dadosConfigData.CAMINHOS_REDE.caminhos;
            return { layout: layoutConfig, links: linkData };
        } catch (e) {
            themedAlert("Erro Crítico (CopyLinks)", e.toString());
            return null;
        }
    }

    var loadedData = loadCopyLinksData();
    if (!loadedData) return; 

    layoutConfig = loadedData.layout;
    linkData = loadedData.links;

    // Define a largura base única usando 'text_width_normal'
    (function computeBaseWidth() {
        try {
            var lg = layoutConfig && layoutConfig.configuracao && layoutConfig.configuracao.layout_geral;
            baseFieldWidth = (lg && lg.text_width_normal) || 460; 
        } catch (_e) {
            baseFieldWidth = 532;
        }
    })();

    // =================================================================================
    // --- FUNÇÕES DE SISTEMA ---
    // =================================================================================
    var isWindows = ($.os.indexOf("Windows") !== -1);
    function hasWriteAccess() { return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY"); }
    
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
            themedAlert("Erro ao Copiar", e.toString());
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
            if (absolutePath.exists) path = absolutePath.fsName; 
            else { themedAlert("Erro", "PDF não encontrado:\n" + absolutePath.fsName); return; }
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
            themedAlert("Erro", "Caminho não encontrado:\n" + path);
        }
    }

function addPin(path) {
        if (!isWindows) { themedAlert("Aviso", "Acesso Rápido disponível apenas no Windows."); return false; }
        
        // Limpeza inicial
        path = path.replace(/^\s+|\s+$/g, '');
        
        // --- CORREÇÃO: Resolver caminhos relativos (igual ao openPath) ---
        // Se o caminho não tem ':', '\\' ou 'http', assume-se que é relativo à raiz do script
        var isRelative = path.indexOf(":") === -1 && path.indexOf("\\\\") !== 0 && path.indexOf("http") !== 0;
        
        if (isRelative) {
             var cleanRelativePath = path.replace(/^[\\\/]+/, "");
             var absolutePath = new File(GNEWS_D9_TOOLS_ROOT.fsName + "/" + cleanRelativePath);
             // Se o arquivo relativo existe, usamos o caminho completo dele
             if (absolutePath.exists) {
                 path = absolutePath.fsName;
             }
        }
        // -----------------------------------------------------------------

        var targetPath = path;
        var file = new File(path);
        
        // Lógica inteligente: Se for um arquivo (ex: PDF), fixa a PASTA PAI dele.
        if (file.exists) { 
            targetPath = file.parent.fsName; 
        }
        
        var folder = new Folder(targetPath);
        
        // Verificação final de existência
        if (!folder.exists) { 
            themedAlert("Erro", "A pasta ou arquivo não foi encontrado no disco:\n" + targetPath); 
            return false; 
        }
        
        try {
            // Comando PowerShell para fixar no Quick Access (retorna __OK__ em caso de sucesso)
            var safePath = folder.fsName.replace(/\\/g, '\\\\');
            var cmd = 'powershell.exe -NoProfile -Command "$s=New-Object -ComObject Shell.Application; $f=$s.Namespace(\\\"' + safePath + '\\\"); if($f){$f.Self.InvokeVerb(\\\"pintohome\\\"); Write-Output \\\"__OK__\\\" } else { Write-Output \\\"__FAIL__\\\" }"';
            var out = system.callSystem(cmd) || "";
            var low = out.toLowerCase();

            // Sucesso se retornou __OK__ ou se não houve mensagem de erro
            if (low.indexOf("__ok__") !== -1 || low.trim() === "") {
                return true;
            }
            if (low.indexOf("exception") !== -1 || low.indexOf("__fail__") !== -1) {
                throw new Error("Falha ao fixar: " + out);
            }
            // Fallback otimista: considerar sucesso se nao encontramos falha explícita
            return true;
        } catch (e) {
            themedAlert("Erro", "Não foi possível fixar no Acesso Rápido.\n" + e.toString());
            return false;
        }
    }

    // =================================================================================
    // --- UI PRINCIPAL ---
    // =================================================================================
    var win = new Window("palette", SCRIPT_WINDOW_TITLE, undefined, { resizeable: false });
    win.orientation = "column"; win.spacing = 10; win.margins = 15;
    
    try { setBgColor(win, (typeof bgColor1 !== 'undefined') ? bgColor1 : '#282828'); }
    catch (eBg) { try { win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0.16,0.16,0.16]); } catch (eBg2) {} }

    // --- HEADER ---
    var headerGrp = win.add('group');
    headerGrp.orientation = 'stack';
    headerGrp.alignment = 'fill';

    var titleGroup = headerGrp.add('group');
    titleGroup.alignment = 'left';
    var title = titleGroup.add('statictext', undefined, SCRIPT_SUBTITLE);
    try { setFgColor(title, (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003c'); } catch (eFg) {}

    var helpBtnGroup = headerGrp.add('group');
    helpBtnGroup.alignment = 'right';
    var helpBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
        helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
    } else {
        helpBtn = helpBtnGroup.add("button", undefined, "?");
        helpBtn.preferredSize = [24, 24];
        helpBtn.helpTip = "Ajuda";
    }

    // --- SELEÇÃO ---
    var line2Grp = win.add("group");
    line2Grp.orientation = 'row'; line2Grp.alignment = 'left'; line2Grp.spacing = 10;
    var mainGroupLabel = line2Grp.add("statictext", undefined, "Grupo:");
    setFgColor(mainGroupLabel, monoColor1); 
    
    var mainGroups = linkData.grupos;
    var mainGroupNames = [];
    for (var i = 0; i < mainGroups.length; i++) { mainGroupNames.push(mainGroups[i].titulo); } 
    
    var mainDropdown = line2Grp.add("dropdownlist", undefined, mainGroupNames);
    mainDropdown.preferredSize.width = 150;
    mainDropdown.selection = 0;

    var subgroupDropdown = line2Grp.add("dropdownlist", undefined, []);
    subgroupDropdown.preferredSize.width = 150;
    
    // --- ÁREA DE LINKS ---
    var content = win.add("group");
    content.orientation = "column";
    content.spacing = 15;
    content.alignment = 'fill';
    content.alignChildren = 'left';

    // =================================================================================
    // --- RENDERIZAÇÃO ---
    // =================================================================================

    function updateContent(mainGroupIndex, subGroupIndex) {
        while (content.children.length > 0) { content.remove(content.children[0]); }
        if (mainGroupIndex < 0 || subGroupIndex < 0) { win.layout.layout(true); return; }
        
        var group = mainGroups[mainGroupIndex].subgrupos[subGroupIndex];

        // --- LARGURA UNIFICADA ---
        var fieldWidth = baseFieldWidth; 

        for (var i = 0; i < group.links.length; i++) {
            (function() {
                var link = group.links[i];
                var rowTotalWidth = ICON_WIDTH + SPACING + fieldWidth + SPACING + ICON_WIDTH;
                var rowWidth = rowTotalWidth;
                
                var linkGroup = content.add("group");
                linkGroup.orientation = "column"; 
                linkGroup.spacing = SPACING;
                linkGroup.alignChildren = ["fill", "top"]; 
                linkGroup.margins = 0;
                linkGroup.preferredSize.width = rowTotalWidth;

                // BOTÃO DE TÍTULO
                var mainBtn = createThemeButtonCtrl(linkGroup, "  " + link.nome, rowWidth, BTN_HEIGHT, link.nome);
                mainBtn.alignment = ["fill", "top"]; 
                if (mainBtn.__wrapper) {
                    applyFixedSize(mainBtn.__wrapper, rowWidth, BTN_HEIGHT);
                }
                applyFixedSize(mainBtn, rowWidth, BTN_HEIGHT);

                // CONTROLES
                var controls = linkGroup.add("group");
                controls.orientation = "row"; 
                controls.spacing = SPACING; 
                controls.alignment = ["fill", "top"];

                var isFolder = link.tipo === "folder" && link.caminho.indexOf("http") !== 0;
                
                // --- REGRA DE PIN: SEMPRE EXIBIR NO WINDOWS ---
                // Se for Windows, o botão aparece (seja link, pasta ou arquivo).
                // Isso garante o alinhamento visual em todos os grupos.
                var showPin = isWindows; 
                var pinBtnIcon = null;

                if (showPin) {
                    // Texto do tooltip varia dependendo se é pasta ou não, para educar o usuário
                    var pinTip = isFolder ? (lClick + 'Adicionar ao Acesso Rápido') : 'Apenas pastas podem ser fixadas';
                    pinBtnIcon = new themeIconButton(controls, { icon: D9T_ATALHO_ICON, tips: [pinTip] });
                } else {
                    var spacer = controls.add("group");
                    applyFixedSize(spacer, ICON_WIDTH, HEIGHT_ROW);
                }
                
                var field = controls.add("edittext", undefined, link.caminho);
                field.helpTip = "Caminho editável"; 
                applyFixedSize(field, fieldWidth, HEIGHT_ROW);

                var copyBtnIcon = new themeIconButton(controls, { icon: D9T_COPY_ICON, tips: [lClick + 'Copiar caminho'] });
            
                mainBtn.onClick = function() { openPath(field.text); };
                
                if (copyBtnIcon) {
                    copyBtnIcon.leftClick.onClick = function() {
                        if (!hasWriteAccess()) { themedAlert("Permissão Negada", "Requer permissão de escrita."); return; }
                        if (copyText(field.text)) { 
                            mainBtn.text = "  Copiado!"; 
                            app.setTimeout(function() { mainBtn.text = "  " + link.nome; }, 1500); 
                        }
                    };
                }
                
                if (pinBtnIcon) {
                    pinBtnIcon.leftClick.onClick = function() { 
                        // Verificação ao clicar: Se não for pasta válida, avisa e cancela.
                        if (!isFolder) {
                            themedAlert("Ação não disponível", "Apenas pastas locais ou de rede podem ser adicionadas ao Acesso Rápido do Windows.\n\nLinks web e arquivos não são suportados.");
                            return;
                        }
                        
                        if (addPin(field.text)) { 
                            mainBtn.text = "  Adicionado!"; 
                            app.setTimeout(function() { mainBtn.text = "  " + link.nome; }, 1500); 
                        } 
                    };
                }
            })();
        }

        win.layout.layout(true); 
        
        try {
            if (!group || group.links === undefined) { return; }
            var calculatedHeight = 130 + (group.links.length * 85);
            var globalMaxHeight = 900;
            try {
                var gLayout = layoutConfig.configuracao.layout_geral;
                if (gLayout && typeof gLayout.max_height === 'number') {
                    globalMaxHeight = gLayout.max_height;
                }
            } catch (_h) {}
            win.size.height = Math.min(calculatedHeight + 20, globalMaxHeight);
            win.layout.layout(true);
        } catch(e) {}
    }

    // --- HANDLERS ---
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

    helpBtn.leftClick.onClick = function() { 
        if (typeof showCopyLinksHelp === 'function') showCopyLinksHelp();
        else themedAlert("Erro", "Ajuda indisponível.");
    };
    
    // --- INICIO ---
    mainDropdown.onChange();
    
    var layout = layoutConfig.configuracao.layout_geral;
    var baseWinWidth = ((layout && layout.name_btn_width) ? layout.name_btn_width : 580) + 120;
    
    var minWinWidth = ICON_WIDTH + SPACING + baseFieldWidth + SPACING + ICON_WIDTH + 80;
    win.size.width = Math.max(baseWinWidth, minWinWidth); 
    
    win.layout.layout(true);
    win.center();
    win.show();
}
