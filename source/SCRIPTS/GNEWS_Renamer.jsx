/**********************************************************************************
 * GNEWS Renamer.jsx
 * Autor: D9
 * Verso: 15.2.0 (Restaurao de Funes e Feedback)
 *
 * DESCRIO:
 * - CORREO (v15.2.0): Restaurada a lgica de feedback. Mensagens de sucesso
 * agora so exibidas no painel de status/preview, em vez de alertas pop-up.
 * - CORREO (v15.2.0): Restaurada a lgica completa do boto 'Organizar Projeto'
 * que havia sido perdida. Todas as funes esto completas.
 * - UI (v15.1.0): Boto "Salvar" em vermelho, "Correo" alinhado e painel de
 * status na parte inferior.
 * - UI (v15.0.0): Implementados os botes temticos (themeButton).
 * - LGICA (v13.0.0): Refatorado para ler dados do 'Dados_Config.json'.
 * - LGICA (v12.2.0): Correo definitiva da prioridade do usurio.
 *
 * MDULOS USADOS:
 * - globals.js: (Cores e variveis globais)
 * - main_ui_functions.js: (Funo 'themeButton' para os botes customizados)
 * - Dados_Config.json: (Dados da equipe, programas, artes)
 * - func_getPathDayByDay.js: (Lgica de caminho de salvamento)
 *
 **********************************************************************************/

// Garante que o script seja lido com a codificao correta para acentos.
$.encoding = "UTF-8";

function createRenamerUI(thisObj) {
    // =================================================================================
    // --- VARIVEIS DE CONFIGURAO RPIDA DE UI ---
    // =================================================================================
    var SCRIPT_NAME = "GNEWS Renamer";
    var SCRIPT_VERSION = "v15.2.0";
    var JANELA_TITULO = SCRIPT_NAME + " " + SCRIPT_VERSION;
    var TITULO_UI = "Construtor de Nomes:";
    var LARGURA_JANELA = 120;
    var ALTURA_JANELA = 250;
    var LARGURA_BOTAO = 128;
    var ALTURA_BOTAO = 40;
    var LARGURA_MENU_NOME = 80;
    var LARGURA_MENU_PRODUCAO = 142;
    var LARGURA_MENU_TIPO = 137;
    var LARGURA_MENU_VERSAO = 85;
    var LARGURA_CAMPO_DESCRICAO = 297;
    var LARGURA_CAMPO_EDITOR = 297;
    var MARGENS_JANELA = 15;
    var ESPACAMENTO_ELEMENTOS = 5;

    // =================================================================================
    // --- PATHS PADRO (GARANTE scriptMainPath) ---
    // =================================================================================
    if (typeof scriptMainPath === 'undefined' || !scriptMainPath) {
        // pasta raiz do projeto (2 niveis acima de /source/SCRIPTS)
        var __thisFile = new File($.fileName);
        scriptMainPath = __thisFile.parent.parent.fsName;
    }

    // Logger simples
    function logRenamer(msg) {
        try {
            var rt = Folder.userData.fsName + "/GND9TOOLS script/runtime";
            var lf = new Folder(rt + "/logs"); if (!lf.exists) lf.create();
            var logFile = new File(lf.fsName + "/renamer.log");
            logFile.open("a"); logFile.writeln(new Date().toUTCString() + " [RENAMER] " + msg); logFile.close();
        } catch (e) {}
        try { $.writeln("[RENAMER] " + msg); } catch (e2) {}
    }
    // =================================================================================
    // --- DADOS INTERNOS DO SCRIPT ---
    // =================================================================================
    var versionsList_internal = [
        "Nenhuma", "Arte 01", "Arte 02", "Arte 03", "Arte 04",
        "Arte 05", "Arte 06", "Arte 07", "Arte 08"
    ];

    // =================================================================================
    // --- FUNES AUXILIARES DE TEMA E ARQUIVOS ---
    // =================================================================================
    function hexToRgb(hex) { if (typeof hex !== 'string') return [0.1, 0.1, 0.1]; hex = hex.replace("#", ""); return [parseInt(hex.substring(0, 2), 16) / 255, parseInt(hex.substring(2, 4), 16) / 255, parseInt(hex.substring(4, 6), 16) / 255]; }
    function setBgColor(element, hexColor) { try { if (typeof hexColor !== 'undefined') element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, hexToRgb(hexColor)); } catch (e) {} }
    function setFgColor(element, hexColor) { try { if (typeof hexColor !== 'undefined') element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, hexToRgb(hexColor), 1); } catch (e) {} }
    
    // Alerta pop-up para erros ou avisos importantes
    function themedAlert(title, message, alertType) {
        var d = new Window("dialog", title); d.orientation="column"; d.alignChildren=["center","center"]; d.spacing=10; d.margins=15;
        setBgColor(d, typeof bgColor1 !== 'undefined' ? bgColor1 : '#282828');
        var titleColor = typeof normalColor1 !== 'undefined' ? normalColor1 : '#FFFFFF';
        if (alertType === "error") { titleColor = typeof highlightColor1 !== 'undefined' ? highlightColor1 : '#D4003C'; } 
        else if (alertType === "success") { titleColor = typeof successColor !== 'undefined' ? successColor : '#97E341'; } 
        else if (alertType === "warning") { titleColor = typeof warningColor !== 'undefined' ? warningColor : '#fba524'; }
        var m = d.add('group'); m.orientation = 'column'; var l = message.split('\n');
        for (var i = 0; i < l.length; i++) { var t = m.add('statictext', undefined, l[i]); setFgColor(t, (i === 0) ? titleColor : (typeof normalColor1 !== 'undefined' ? normalColor1 : '#FFFFFF')); }
        var b = d.add("button", undefined, "OK", { name: 'ok' }); b.size = [100, 25]; d.center(); d.show();
    }

    // Feedback visual no painel de status (para sucesso ou falhas menores)
    function showStatusMessage(message, type) {
        if (!previewText) return;
        var color = normalColor1;
        if (type === "success") {
            color = typeof successColor !== 'undefined' ? successColor : '#97E341';
        } else if (type === "error") {
            color = typeof highlightColor1 !== 'undefined' ? highlightColor1 : '#D4003C';
        }
        setFgColor(previewText, color);
        previewText.text = message;
    }
    
    function readJsonFile(filePath) {
        logRenamer("Lendo JSON: " + filePath);
        var file = new File(filePath);
        if (!file.exists) { throw new Error("Arquivo de configuracao nao encontrado em: " + filePath); }
        try {
            file.open("r"); var content = file.read(); file.close();
            return JSON.parse(content);
        } catch (e) { throw new Error("Erro ao ler ou processar o arquivo JSON: " + filePath + "\n" + e.toString()); }
    }

    // =======================================================================
    // --- ETAPA 1: CARREGAMENTO DE DADOS (NOVA ARQUITETURA) ---
    // =======================================================================
        function loadAllData() {
        try {
            var dadosConfigPath = (typeof runtimeDadosConfigPath !== 'undefined') ? runtimeDadosConfigPath : null;
            if (!dadosConfigPath && typeof runtimeConfigPath !== 'undefined') {
                dadosConfigPath = runtimeConfigPath + "/Dados_Config.json";
            }
            if (!dadosConfigPath) {
                dadosConfigPath = Folder.userData.fsName + "/GND9TOOLS script/runtime/config/Dados_Config.json";
            }
            logRenamer("Path Dados_Config usado: " + dadosConfigPath);
            var dadosConfigData = readJsonFile(dadosConfigPath);
            var equipeData = dadosConfigData.EQUIPE_GNEWS; if (!equipeData || !equipeData.equipe) throw new Error("'EQUIPE_GNEWS' nao encontrado em Dados_Config.json.");
            var namesList = [], tagsMap = {};
            for (var i = 0; i < equipeData.equipe.length; i++) { namesList.push(equipeData.equipe[i].apelido); tagsMap[equipeData.equipe[i].apelido] = equipeData.equipe[i].tag; }
            var programacaoData = dadosConfigData.PROGRAMACAO_GNEWS; if (!programacaoData || !programacaoData.programacao) throw new Error("'PROGRAMACAO_GNEWS' nao encontrado em Dados_Config.json.");
            var productionsList = [];
            for (var i = 0; i < programacaoData.programacao.length; i++) { var p = programacaoData.programacao[i]; if (p && p.tagName) { productionsList.push(p.tagName.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,function(l){return l.toUpperCase();})); } }
            var artesData = dadosConfigData.ARTES_GNEWS; if (!artesData || !artesData.arte) throw new Error("'ARTES_GNEWS' nao encontrado em Dados_Config.json.");
            var artsList = [], tempArtes = {};
            for (var i = 0; i < artesData.arte.length; i++) { var a = artesData.arte[i], n = a.arte || a.arts; if (n && !tempArtes[n]) { artsList.push(n); tempArtes[n] = true; } }
            artsList.sort();
            return { names: namesList, tags: tagsMap, productions: productionsList, arts: artsList, versions: versionsList_internal, programacaoRaw: { programacao_globonews: programacaoData.programacao }, equipe: equipeData.equipe };
        } catch (e) { logRenamer("Falha loadAllData: " + e.toString()); themedAlert("Erro Critico de Dados", e.toString(), "error"); return null; }
    }

    var loadedData = loadAllData();
    if (!loadedData) return;
    var names = loadedData.names, tags = loadedData.tags, productions = loadedData.productions,
        arts = loadedData.arts, versions = loadedData.versions, programacaoData = loadedData.programacaoRaw,
        equipe = loadedData.equipe;
    
    // =======================================================================
    // --- LGICA DO SCRIPT E FUNES AUXILIARES ---
    // =======================================================================
    function getLoggedInUserIndex() { var u=system.userName.toLowerCase(),a=null; for(var i=0;i<equipe.length;i++){var s=equipe[i].email?equipe[i].email.toLowerCase():(equipe[i].apelido?equipe[i].apelido.toLowerCase():""); if(s.indexOf(u)>-1){a=equipe[i].apelido;break;}} return a?names.indexOf(a):-1; }
    function setDefaultValuesWithTimeLogic() {
        descInput.text = ""; editorInput.text = ""; alterCheck.value = false;
        var userIndex = getLoggedInUserIndex();
        nameDrop.selection = (userIndex > -1) ? userIndex : (names.indexOf("D9") > -1 ? names.indexOf("D9") : 0);
        artDrop.selection = arts.indexOf("Base Caracter") > -1 ? arts.indexOf("Base Caracter") : 0;
        versionDrop.selection = 0; prodDrop.selection = 0;
        try {
            var t=function(s){var p=s.split(":");return parseInt(p[0],10)*60+parseInt(p[1],10);}; var n=new Date(),m=["dom","seg","ter","qua","qui","sex","sab"],d=m[n.getDay()],c=n.getHours()*60+n.getMinutes();
            for (var i=0;i<programacaoData.programacao_globonews.length;i++){var p=programacaoData.programacao_globonews[i]; if(p.horario&&p.dias_exibicao){var h=p.horario.split(" - "); if(c>=t(h[0])&&c<t(h[1])&&isDayInSchedule(p.dias_exibicao,d)){var e=p.tagName.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,function(l){return l.toUpperCase();}); var x=productions.indexOf(e); if(x>-1){prodDrop.selection=x;return;}}}}
        } catch(e){ themedAlert("Aviso de Horrio", "No foi possvel detectar o programa pelo horrio:\n" + e.toString(), "warning"); }
    }
    function isDayInSchedule(s, d) { s = s.toLowerCase(); return s.indexOf("diariamente")>-1||s.indexOf("segunda a domingo")>-1||(s.indexOf("segunda a sexta")>-1&&d!=="sab"&&d!=="dom")||(s.indexOf("sbados e domingos")>-1&&(d==="sab"||d==="dom"))||s.indexOf(d)>-1; }
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    var lastSavedPath; try { if (typeof getPathDayByDay === 'function') { lastSavedPath = getPathDayByDay(); } else if (typeof scriptMainPath !== 'undefined') { var f=new File(scriptMainPath + "/source/libraries/functions/func_getPathDayByDay.js"); if(f.exists){eval(File(f).read());lastSavedPath=getPathDayByDay();}else{throw new Error("func_getPathDayByDay.js no encontrado.");} } else { throw new Error("'scriptMainPath' no encontrada."); } } catch(e) { lastSavedPath = Folder.desktop.fsName; $.writeln("AVISO: " + e.toString()); }
    function getAlterationNumber(c) { if(!c)return"01";var m=0;for(var i=1;i<=app.project.numItems;i++){var t=app.project.item(i);if(t instanceof CompItem&&t.name.toUpperCase().indexOf(c.toUpperCase())>-1){var h=t.name.match(/C(\d+)/i);if(h&&parseInt(h[1],10)>m){m=parseInt(h[1],10);}}}return pad(m+1);}
    
    function parseCompNameToUI(compName) {
        var result = { prodIdx: -1, artIdx: -1, versionIdx: -1, desc: "", editor: "", alter: false };
        if (!compName) return result;
        var nameUpper = compName.toUpperCase(); var parts = nameUpper.split(" - ");
        var mainPart = parts.shift().trim(); result.editor = parts.join(" - ").trim();
        var alterMatch = result.editor.match(/C(\d+)/);
        if (alterMatch) { result.alter = true; result.editor = result.editor.replace(alterMatch[0], "").trim(); }
        var tempDesc = mainPart; var foundKeywords = [];
        for (var i=0;i<productions.length;i++){if (tempDesc.indexOf(productions[i].toUpperCase()) > -1){result.prodIdx=i;foundKeywords.push(productions[i].toUpperCase());break;}}
        for (var i=0;i<arts.length;i++){if (tempDesc.indexOf(arts[i].toUpperCase()) > -1){result.artIdx=i;foundKeywords.push(arts[i].toUpperCase());break;}}
        var versionMatch = mainPart.match(/ARTE\s?(\d+)/i);
        if (versionMatch) { var v = "Arte "+pad(parseInt(versionMatch[1],10)), x=versions.indexOf(v); if(x>-1){result.versionIdx=x;foundKeywords.push(versionMatch[0].toUpperCase());}}
        for (var apelido in tags) { if(tags.hasOwnProperty(apelido)){var t=tags[apelido].toUpperCase(); if(mainPart.indexOf(t)>-1){foundKeywords.push(t);break;}}}
        foundKeywords.push("GNEWS");
        for (var k=0;k<foundKeywords.length;k++){tempDesc=tempDesc.replace(new RegExp(foundKeywords[k].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),"");}
        result.desc = tempDesc.replace(/\s+/g, ' ').trim();
        return result;
    }

    function applyParsedDataToUI(parsed) {
        if (parsed.prodIdx > -1) prodDrop.selection = parsed.prodIdx;
        if (parsed.artIdx > -1) artDrop.selection = parsed.artIdx;
        if (parsed.versionIdx > -1) versionDrop.selection = parsed.versionIdx; else versionDrop.selection = 0;
        descInput.text = parsed.desc; editorInput.text = parsed.editor; alterCheck.value = parsed.alter;
    }

    function sanitizeInput(t) { return t.replace(/[\/\\:*?"<>|]/g, ""); }
    function removeAccents(s){if(!s)return"";var a="",r="aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN",n="";for(var i=0;i<s.length;i++){var t=false;for(var j=0;j<a.length;j++){if(s.substr(i,1)==a.substr(j,1)){n+=r.substr(j,1);t=true;break;}}if(!t){n+=s.substr(i,1);}}return n;}

    // =================================================================================
    // --- FUNES AUXILIARES DE BOTES TEMTICOS ---
    // =================================================================================
    function applyFixedSize(target, width, height) {
        if (!target || typeof width !== 'number' || typeof height !== 'number') { return; }
        var sizeArr = [width, height];
        target.preferredSize = sizeArr;
        target.minimumSize = sizeArr;
        target.maximumSize = sizeArr;
        target.size = sizeArr;
    }

    function enforceThemeButtonSize(ctrl) {
        if (!ctrl) { return; }
        applyFixedSize(ctrl, LARGURA_BOTAO, ALTURA_BOTAO);
        ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
        ctrl.__buttonThemeOverrides.width = LARGURA_BOTAO;
        ctrl.__buttonThemeOverrides.height = ALTURA_BOTAO;
        var relock = function () { applyFixedSize(ctrl, LARGURA_BOTAO, ALTURA_BOTAO); };
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
                if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') {
                    baseTheme = D9T_getActiveButtonTheme();
                }
                D9T_applyThemeToButtonControl(ctrl, baseTheme);
            } catch(themeErr){}
        }
    }

    function createActionButton(parent, label, tip, colorOptions) {
        var btnBgColor = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#DDDDDD';
        var btnTextColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#000000';
        var hoverBg = (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#D4003C';
        var hoverText = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF';
        if (colorOptions) { if(colorOptions.bg)btnBgColor=colorOptions.bg; if(colorOptions.text)btnTextColor=colorOptions.text; if(colorOptions.hoverBg)hoverBg=colorOptions.hoverBg; if(colorOptions.hoverText)hoverText=colorOptions.hoverText; }
        var buttonObj;
        if (typeof themeButton === 'function') {
            var config = { labelTxt: label, tips: [tip], width: LARGURA_BOTAO, height: ALTURA_BOTAO };
            if (btnTextColor) { config.textColor = btnTextColor; }
            if (btnBgColor) { config.buttonColor = btnBgColor; }
            buttonObj = new themeButton(parent, config);
            if (buttonObj && buttonObj.label) { enforceThemeButtonSize(buttonObj.label); }
        } else {
            buttonObj = parent.add('button', undefined, label);
            applyFixedSize(buttonObj, LARGURA_BOTAO, ALTURA_BOTAO);
            buttonObj.helpTip = tip;
            if(!(thisObj instanceof Panel)) { themedAlert("Erro de Mdulo", "A biblioteca 'main_ui_functions.js' no foi carregada.", "error"); }
        }
        return buttonObj;
    }

    function assignClick(buttonObj, clickFunction) {
        if (buttonObj && buttonObj.leftClick) { buttonObj.leftClick.onClick = clickFunction; } 
        else if (buttonObj) { buttonObj.onClick = clickFunction; }
    }

    // =================================================================================
    // --- CONSTRUO DA INTERFACE GRFICA (UI) ---
    // =================================================================================
    
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", JANELA_TITULO, undefined, { resizeable: false });
    win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = ESPACAMENTO_ELEMENTOS; win.margins = MARGENS_JANELA;
    win.preferredSize.width = LARGURA_JANELA;
    // Fundo com fallback
    try { setBgColor(win, (typeof bgColor1 !== 'undefined') ? bgColor1 : '#282828'); }
    catch (eBg) { try { win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0.16,0.16,0.16]); } catch (eBg2) {} }
    var headerGrp = win.add('group'); headerGrp.orientation = 'row'; headerGrp.alignChildren = ["fill", "center"];
    var title = headerGrp.add('statictext', undefined, TITULO_UI); title.alignment = 'left';
    try { setFgColor(title, (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003c'); }
    catch (eFg) { try { title.graphics.foregroundColor = title.graphics.newPen(title.graphics.PenType.SOLID_COLOR, [0.83,0,0.24], 1); } catch (ePen) {} }
    var helpBtnGroup = headerGrp.add('group'); helpBtnGroup.alignment = ['right', 'center'];
    var helpBtn; var showHelpFunction = function() { if (typeof showRenamerHelp === 'function') { showRenamerHelp(); } else { themedAlert("Ajuda", "A biblioteca de ajuda (HELP lib.js) no foi encontrada.", "warning"); } };
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') { try { helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: ['Ajuda sobre o GNEWS Renamer'] }); if (helpBtn.leftClick) { helpBtn.leftClick.onClick = showHelpFunction; } } catch (e) { helpBtn = helpBtnGroup.add("button", undefined, "?"); helpBtn.preferredSize = [25, 25]; helpBtn.onClick = showHelpFunction; } } else { helpBtn = helpBtnGroup.add("button", undefined, "?"); helpBtn.preferredSize = [25, 25]; helpBtn.onClick = showHelpFunction; }
    var fieldsPanel = win.add("panel"); fieldsPanel.alignChildren = ["left", "top"]; fieldsPanel.spacing = 10; fieldsPanel.margins = 12; setFgColor(fieldsPanel, monoColor1);
    
    function createDropdown(p, l, i, w) { var g=p.add("group"); g.alignChildren=['left','center']; var a=g.add("statictext",undefined,l+":"); setFgColor(a,monoColor1); a.preferredSize.width=55; var c=g.add("dropdownlist",undefined,i); if(i.length>0)c.selection=0; c.preferredSize.width=w; return c; }
    
    var row1 = fieldsPanel.add("group"); var nameDrop = createDropdown(row1, "Nome", names, LARGURA_MENU_NOME); var prodDrop = createDropdown(row1, "Produo", productions, LARGURA_MENU_PRODUCAO);
    var row2 = fieldsPanel.add("group"); var artDrop = createDropdown(row2, "Tipo", arts, LARGURA_MENU_TIPO); var versionDrop = createDropdown(row2, "Verso", versions, LARGURA_MENU_VERSAO);
    var descGroup = fieldsPanel.add("group"); descGroup.alignChildren=['left','center']; var descLabel = descGroup.add("statictext",undefined,"Descrio:"); setFgColor(descLabel,monoColor1); descLabel.preferredSize.width=55; var descInput=descGroup.add("edittext",undefined,""); descInput.preferredSize.width=LARGURA_CAMPO_DESCRICAO;
    var editorGroup = fieldsPanel.add("group"); editorGroup.alignChildren=['left','center']; var editorLabel = editorGroup.add("statictext",undefined,"Editor:"); setFgColor(editorLabel,monoColor1); editorLabel.preferredSize.width=55; var editorInput=editorGroup.add("edittext",undefined,""); editorInput.preferredSize.width=LARGURA_CAMPO_EDITOR;
    var alterGroup = fieldsPanel.add("group"); alterGroup.alignChildren=['left','center']; var alterLabel = alterGroup.add("statictext",undefined,"Correo:"); setFgColor(alterLabel,monoColor1); alterLabel.preferredSize.width=55; var alterCheck=alterGroup.add("checkbox");
    
    var mainBtnPanel=win.add("group"); mainBtnPanel.alignment="center"; mainBtnPanel.spacing=5;
    var renameBtn = createActionButton(mainBtnPanel, "Renomear", "Renomeia a(s) composio(es) selecionada(s)");
    var duplicarBtn = createActionButton(mainBtnPanel, "Duplicar", "Duplica a composio selecionada e sua hierarquia");
    var captureBtn = createActionButton(mainBtnPanel, "Capturar", "Captura os dados da composio selecionada");
    
    var bottomBtnRow=win.add("group"); bottomBtnRow.alignment="center"; bottomBtnRow.spacing=5; 
    var copyBtn = createActionButton(bottomBtnRow, "Copiar", "Copia o nome da composio para a rea de transferncia");
    var organizeBtn = createActionButton(bottomBtnRow, "Organizar", "Limpa e organiza todo o projeto");
    var saveBtn = createActionButton(bottomBtnRow, "Salvar", "Salva o arquivo .aep com o nome do preview", {
        bg: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#D4003C', text: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF',
        hoverBg: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF', hoverText: (typeof bgColor1 !== 'undefined') ? bgColor1 : '#000000'
    });
    
    var previewPanel = win.add("panel"); previewPanel.alignChildren = ["center", "center"]; setFgColor(previewPanel, monoColor1); previewPanel.preferredSize.height = 40;
    var previewText = previewPanel.add("statictext", undefined, ""); previewText.preferredSize.width = LARGURA_JANELA * 2.5; setFgColor(previewText, normalColor1);
    
    // =================================================================================
    // --- EVENTOS E ATUALIZAES DA UI ---
    // =================================================================================
    function updatePreview() {
        setFgColor(previewText, normalColor1); // Reseta a cor do preview para a padro
        var prodText=prodDrop.selection?prodDrop.selection.text.toUpperCase():""; var artText=artDrop.selection?artDrop.selection.text.toUpperCase():""; var versionText=(versionDrop.selection&&versionDrop.selection.text!=="Nenhuma")?" "+versionDrop.selection.text.toUpperCase():""; var descStr=descInput.text?" "+descInput.text.toUpperCase():""; var editorStr=editorInput.text?" - "+editorInput.text.toUpperCase():""; var alterStr=alterCheck.value?" C"+getAlterationNumber("GNEWS "+prodText+" "+artText+descStr):"";
        var finalArtText=artText; var finalString="GNEWS "+prodText+" "+finalArtText+descStr+versionText+editorStr+alterStr; var maxChars=70;
        if(finalString.length>maxChars&&artText.length>8){var overflow=finalString.length-maxChars;var newArtLength=artText.length-overflow-3;if(newArtLength<5){newArtLength=5;}finalArtText=artText.substring(0,newArtLength)+"...";}
        previewText.text="GNEWS "+prodText+" "+finalArtText+descStr+versionText+editorStr+alterStr;
    }
    
    nameDrop.onChange=prodDrop.onChange=artDrop.onChange=versionDrop.onChange=updatePreview;
    descInput.onChanging=function(){this.text=sanitizeInput(this.text); updatePreview();};
    editorInput.onChanging=function(){this.text=sanitizeInput(this.text); updatePreview();};
    alterCheck.onClick=updatePreview;
    
    // --- Aes dos Botes ---
    assignClick(captureBtn, function() { var a=app.project.activeItem; if(!(a instanceof CompItem)){themedAlert("Aviso","Nenhuma comp selecionada.", "warning");return;} var p=parseCompNameToUI(a.name); applyParsedDataToUI(p); updatePreview(); });
    assignClick(renameBtn, function() {
        var s=app.project.selection, c=[]; for(var i=0;i<s.length;i++){if(s[i]instanceof CompItem){c.push(s[i]);}} if(c.length===0){themedAlert("Aviso","Selecione uma comp.", "warning");return;}
        if (!prodDrop.selection || !artDrop.selection) { themedAlert("Erro","Dados no carregados (Dados_Config?).", "error"); return; }
        app.beginUndoGroup("Renomear Composies"); try{
        var b="GNEWS "+(prodDrop.selection.text.toUpperCase())+" "+(artDrop.selection.text.toUpperCase())+(descInput.text?" "+descInput.text.toUpperCase():""); var e=editorInput.text?" - "+editorInput.text.toUpperCase():"";
        if(c.length>1){var v=(versionDrop.selection&&versionDrop.selection.text!=="Nenhuma")?" "+versionDrop.selection.text.toUpperCase():""; if(alterCheck.value){var n=parseInt(getAlterationNumber(b),10); for(var i=0;i<c.length;i++){c[i].name=removeAccents(b+v+e+" C"+pad(n+i));}}else{var t=(versionDrop.selection&&versionDrop.selection.text!=="Nenhuma")?(parseInt(versionDrop.selection.text.match(/(\d+)/)[1],10)||1):1; for(var i=0;i<c.length;i++){c[i].name=removeAccents(b+" ARTE "+pad(t+i)+e);}}}else{updatePreview();c[0].name=removeAccents(previewText.text);}
        showStatusMessage(c.length+" comp(s) renomeada(s)!", "success");}catch(e){themedAlert("Erro","Erro ao renomear:\n"+e.toString(), "error");}finally{app.endUndoGroup();}
    });
    assignClick(duplicarBtn, function() { app.beginUndoGroup("Duplicar Comp"); var a=app.project.activeItem; if(!(a instanceof CompItem)){themedAlert("Erro","Selecione uma comp.", "error");return;} var p={}; function r(c){if(p[c.id])return p[c.id];var n=c.duplicate();n.name=c.name+"_2";p[c.id]=n;for(var j=1;j<=n.numLayers;j++){var l=n.layer(j);if(l.source instanceof CompItem){var s=r(l.source);if(s)l.replaceSource(s,false);}}return n;} var f=r(a); for(var k in p){if(p.hasOwnProperty(k)){var o=app.project.itemByID(parseInt(k));if(o)p[k].parentFolder=o.parentFolder;}} if(f){showStatusMessage("Duplicada: "+f.name, "success");} app.endUndoGroup(); });
    assignClick(copyBtn, function() { var a=app.project.activeItem; if(a instanceof CompItem){var c=($.os.indexOf("Windows")>-1)?'cmd.exe /c cmd.exe /c "echo '+a.name+' | clip"':'echo "'+a.name+'" | pbcopy'; system.callSystem(c); showStatusMessage("Nome copiado!", "success");}else{themedAlert("Aviso","Selecione uma comp.", "warning");}});
    
    assignClick(organizeBtn, function() {
        app.beginUndoGroup("Organizar Projeto");
        try {
            if (!app.project || app.project.numItems === 0) { themedAlert("Aviso", "Abra um projeto para organizar.", "warning"); return; }
            function getFootage() {
                var footage = { stillArray: [], videoArray: [], sonoArray: [], solidArray: [], missingArray: [] };
                for (var i = 1; i <= app.project.numItems; i++) {
                    var aItem = app.project.item(i);
                    if (!(aItem instanceof FootageItem)) continue;
                    if (aItem.footageMissing) { footage.missingArray.push(aItem); continue; }
                    if (aItem.mainSource instanceof SolidSource) { footage.solidArray.push(aItem); continue; }
                    if (!(aItem.mainSource instanceof FileSource)) continue;
                    if (aItem.mainSource.isStill) { footage.stillArray.push(aItem); }
                    else if (aItem.hasVideo) { footage.videoArray.push(aItem); }
                    else if (aItem.hasAudio) { footage.sonoArray.push(aItem); }
                }
                return footage;
            }
            function getComps() {
                var compArray = [];
                for (var i = 1; i <= app.project.numItems; i++) { var comp = app.project.item(i); if (comp instanceof CompItem) { compArray.push(comp); } }
                return compArray;
            }
            function projectTemplateFolders() {
                var folderCache = {};
                function getOrCreate(name, parent) {
                    parent = parent || app.project.rootFolder;
                    var cacheKey = (parent === app.project.rootFolder) ? name : parent.id + "_" + name;
                    if (folderCache[cacheKey]) return folderCache[cacheKey];
                    for (var i = 1; i <= parent.numItems; i++) { var item = parent.item(i); if (item instanceof FolderItem && item.name === name) { folderCache[cacheKey] = item; return item; } }
                    var newFolder = parent.items.addFolder(name);
                    folderCache[cacheKey] = newFolder;
                    return newFolder;
                }
                var materialFolder = getOrCreate('_MATERIAL');
                return { 
                    comps: getOrCreate('Comps', materialFolder), 
                    videos: getOrCreate('Videos', materialFolder), 
                    imagens: getOrCreate('Imagens', materialFolder), 
                    audio: getOrCreate('Audio', materialFolder), 
                    solidos: getOrCreate('Solidos', materialFolder), 
                    missing: getOrCreate('!MISSING') 
                };
            }
            function deleteEmptyProjectFolders() {
                var foundEmpty = true;
                while (foundEmpty) {
                    foundEmpty = false;
                    for (var i = app.project.numItems; i >= 1; i--) { var item = app.project.item(i); if (item instanceof FolderItem && item.numItems === 0) { try { item.remove(); foundEmpty = true; } catch (e) {} } }
                }
            }
            app.executeCommand(app.findMenuCommandId("Reduce Project"));
            for (var i = app.project.numItems; i >= 1; i--) { var item = app.project.item(i); if (!(item instanceof FolderItem) && item.parentFolder !== app.project.rootFolder) { item.parentFolder = app.project.rootFolder; } }
            deleteEmptyProjectFolders();
            var allFootage = getFootage();
            var allComps = getComps();
            var folders = projectTemplateFolders();
            for (var i=0; i < allFootage.stillArray.length; i++) { allFootage.stillArray[i].parentFolder = folders.imagens; }
            for (var i=0; i < allFootage.videoArray.length; i++) { allFootage.videoArray[i].parentFolder = folders.videos; }
            for (var i=0; i < allFootage.sonoArray.length; i++) { allFootage.sonoArray[i].parentFolder = folders.audio; }
            for (var i=0; i < allFootage.solidArray.length; i++) { allFootage.solidArray[i].parentFolder = folders.solidos; }
            for (var i=0; i < allFootage.missingArray.length; i++) { allFootage.missingArray[i].parentFolder = folders.missing; }
            for (var i=0; i < allComps.length; i++) { var comp = allComps[i]; if (comp.name.toUpperCase().indexOf("GNEWS ") === 0) { comp.parentFolder = app.project.rootFolder; } else { comp.parentFolder = folders.comps; } }
            deleteEmptyProjectFolders();
            showStatusMessage("Projeto totalmente reorganizado!", "success");
        } catch (e) {
            themedAlert("Erro", "Erro ao organizar: " + e.toString(), "error");
        } finally {
            app.endUndoGroup();
        }
    });
    assignClick(saveBtn, function() { updatePreview(); var b=previewText.text.replace(/\sC\d+$/,""); var t=tags[nameDrop.selection.text]||""; var p=(t?t+" ":"")+removeAccents(b)+".aep"; var f=new File(lastSavedPath+"/"+p).saveDlg("Salvar Projeto Como"); if(f){app.project.save(f);lastSavedPath=f.parent.fsName;showStatusMessage("Projeto salvo: "+f.name, "success");} });
    
    // =================================================================================
    // --- INICIALIZAO DA UI ---
    // =================================================================================
    if (win instanceof Window) { win.center(); win.show(); }
    setDefaultValuesWithTimeLogic(); 
    var activeItem = app.project.activeItem;
    if (activeItem && activeItem instanceof CompItem) {
        var parsed = parseCompNameToUI(activeItem.name);
        applyParsedDataToUI(parsed);
    }
    updatePreview();
}




