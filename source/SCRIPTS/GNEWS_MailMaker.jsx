/**********************************************************************************
 *
 * GNEWS MailMaker - VERSÃO 46.1 (Lógica de Unicode Refinada)
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 46.1.0
 *
 * DESCRIÇÃO:
 * - COMPATIBILIDADE (v46.1): A função que lida com versões antigas do After
 * Effects foi refinada. Agora, em vez de substituir todos os ícones por
 * texto, ela oculta os ícones da interface (deixando-os em branco) e
 * mantém os emojis de despedida como texto simples (ex: ":)").
 *
 **********************************************************************************/
$.encoding = "UTF-8";

function launchMailMaker() {

    // === CONFIGURAÇÕES BÁSICAS E DE SÍMBOLOS ===
    var config = {
        windowTitle: "GNEWS MailMaker v46.1",
        userPreferencesFile: "User_Preferences.json",
        dataConfigFile: "Dados_Config.json"
    };
    
    var themeButtonSize = { width: 100, height: 40 }; // Ajuste rápido para largura/altura dos botões temáticos

    var symbols = {
        folder: "\uD83D\uDCC2", email: "\uD83D\uDCE9", config: "\u2699", preview: "\uD83D\uDD0D",
        capture: "\uD83D\uDCF7", detect: "\uD83D\uDD0E", image: "\uD83C\uDFDE", copy: "\uD83D\uDCCB",
        success: "\u2705", warning: "\u26A0", error: "\u274C", info: "\u2139",
        celebration: "\uD83C\uDF89", lightning: "\u26A1", fire: "\uD83D\uDD25", sparkles: "\u2728",
        target: "\uD83C\uDFAF", camera: "\uD83D\uDCF7", thumbsUp: "\uD83D\uDC4D", peace: "\u270C",
        smile: "\uD83D\uDE0A", slightSmile: "\uD83D\uDE42", muscle: "\uD83D\uDCAA", rocket: "\uD83D\uDE80",
        metalHorn: "\uD83E\uDD18"
    };

    // === ATUALIZAÇÃO DE COMPATIBILIDADE (v46.1) ===
    function stripUnicodeForLegacyAE() {
        if (parseFloat(app.version) < 25.0) {
            logDebug("Versão legada do AE detectada. Ajustando símbolos.");

            // Define os substitutos em texto APENAS para os emojis
            var emojiFallbacks = {
                metalHorn: "\\m/", thumbsUp: ":)", peace: "v", smile: ":)",
                slightSmile: ":)", muscle: "++", rocket: ">>", lightning: "!",
                fire: "*", sparkles: "*", target: "*", camera: "[CAM]"
            };

            // Itera através de todos os símbolos
            for (var key in symbols) {
                if (symbols.hasOwnProperty(key)) {
                    // Se o símbolo for um emoji da lista, usa o texto substituto
                    if (emojiFallbacks.hasOwnProperty(key)) {
                        symbols[key] = emojiFallbacks[key];
                    } else {
                        // Caso contrário (ícone de UI), define como vazio para ocultá-lo
                        symbols[key] = "";
                    }
                }
            }
        }
    }
    stripUnicodeForLegacyAE(); // Executa a verificação
    
    var fontConfig = { defaultFont: "Arial", size: 10, titleSize: 15 };
    
    // === DADOS E VARIÁVEIS GLOBAIS ===
    var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
    var appData = { capturedCompNames: [], capturedEditorName: "", emailMessage: "", selectedSaudacao: "Oi", selectedDespedida: "Abs,", selectedEmoji: symbols.metalHorn, selectedTemplate: "Padrão Simples", selectedDestination: null, customDestinationName: "", customDestinationPath: "", showFullPath: true, showTeamData: false };
    var ui = {};
    var caminhosData = {};
    var loadedCaminhosJSON = {};
    var programacaoData = {};
    var destinationNames = [];
    var mainPath = "";

    // === TEMPLATES E OPÇÕES ===
    var templates = { "Padrão Simples": "Segue arte.", "Detalhado": "Segue arte finalizada conforme briefing.\n\nQualquer dúvida, me avise!", "Revisão": "Segue arte com as correções solicitadas.\n\nPor favor, confirme se está tudo ok agora.", "Final": "Arte finalizada! " + symbols.celebration + "\n\nArquivos prontos para produção.", "Urgente": symbols.lightning + " ARTE URGENTE " + symbols.lightning + "\n\nSegue arte para aprovação imediata.", "Personalizado": "" };
    var templateNames = getObjectKeys(templates);
    var saudacoes = ["Oi", "Olá", "E aí", "Fala", "Salve", "Eae"];
    var despedidas = ["Abs,", "Abraços,", "Valeu,", "Falou,", "Até mais,", "Grande abraço,", "Att,", "Atenciosamente,"];
    // Este array agora será preenchido corretamente com texto ou unicode, dependendo da versão do AE
    var emojis = [symbols.metalHorn, symbols.thumbsUp, symbols.peace, symbols.smile, symbols.slightSmile, symbols.muscle, symbols.rocket, symbols.lightning, symbols.fire, symbols.sparkles, symbols.target, symbols.camera];

    // === FUNÇÕES UTILITÁRIAS ===
    function getObjectKeys(obj) { var keys = []; for (var key in obj) { if (obj.hasOwnProperty(key)) keys.push(key); } return keys; }
    function logDebug(message) { $.writeln("[MailMaker] " + message); }

    function updateStatus(message, type) {
        if (!ui.statusText) return;
        var colorHex, symbolPrefix = "";
        var colors = { success: '#00FF00', error: '#FF0000', warning: '#FFFF00', info: '#FFFFFF', 'default': '#CCCCCC' };
        if(typeof successColor !== 'undefined') {
            colors.success = successColor; colors.error = bgColor1; colors.warning = warningColor;
            colors.info = normalColor1; colors['default'] = monoColor1;
        }
        switch(type) {
            case "success": symbolPrefix = symbols.success + " "; colorHex = colors.success; break;
            case "error": symbolPrefix = symbols.error + " "; colorHex = colors.error; break;
            case "warning": symbolPrefix = symbols.warning + " "; colorHex = colors.warning; break;
            case "info": symbolPrefix = symbols.info + " "; colorHex = colors.info; break;
            default: colorHex = colors['default']; break;
        }
        ui.statusText.text = symbolPrefix + message;
        if(typeof setFgColor === 'function') setFgColor(ui.statusText, colorHex);
        if (type === "success" || type === "info" || type === "warning") {
            app.setTimeout(function () {
                if (ui.statusText.text === symbolPrefix + message) { 
                    ui.statusText.text = "Pronto";
                    if(typeof setFgColor === 'function') setFgColor(ui.statusText, colors['default']);
                }
            }, 5000);
        }
    }
    
    function setClipboard(str) {
        var isWindows = $.os.indexOf('Windows') !== -1;
        var tempFile = new File(Folder.temp.fsName + "/aemail_" + Date.now() + ".txt");
        try {
            tempFile.encoding = "UTF-8";
            if (!tempFile.open("w")) throw new Error("Não foi possível criar o arquivo temporário.");
            if (isWindows) tempFile.write('\ufeff' + str); else tempFile.write(str);
            tempFile.close();
            var cmd;
            if (isWindows) {
                var tempFilePath = tempFile.fsName.replace(/\\/g, '\\\\');
                cmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText([System.IO.File]::ReadAllText(\'' + tempFilePath + '\', [System.Text.Encoding]::UTF8))"';
                system.callSystem(cmd);
            } else {
                cmd = 'cat "' + tempFile.fsName + '" | pbcopy';
                system.callSystem(cmd);
            }
        } catch (e) { logDebug("ERRO em setClipboard: " + e.toString()); throw e;
        } finally { if (tempFile && tempFile.exists) tempFile.remove(); }
    }
    
    function findScriptMainPath() {
        try {
            var scriptFile = new File($.fileName);
            var scriptFolder = scriptFile.parent;
            if (scriptFolder.name === "SCRIPTS" && scriptFolder.parent.name === "source") { return scriptFolder.parent.parent.fsName; }
            while (scriptFolder && scriptFolder.name !== "GND9TOOLS script") { scriptFolder = scriptFolder.parent; }
            if (scriptFolder && scriptFolder.exists) { return scriptFolder.fsName; }
        } catch (e) { logDebug("Erro em findScriptMainPath: " + e.toString()); }
        return new File($.fileName).parent.fsName;
    }

    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) { return null; }
        try {
            file.encoding = "UTF-8"; 
            file.open("r"); 
            var content = file.read(); 
            file.close();
            if (content.replace(/\s/g, '').length === 0) return null;
            return JSON.parse(content);
        } catch (e) { 
            alert("Erro de SINTAXE no arquivo JSON:\n" + decodeURI(filePath) + "\n\n" + e.toString()); 
            return null; 
        }
    }
    
    function getGreeting() { var h = new Date().getHours(); if (h < 12) return "bom dia"; if (h < 18) return "boa tarde"; return "boa noite"; }
    function toTitleCase(str) { return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }); }
    function findDropdownItem(dropdown, text) { for(var i = 0; i < dropdown.items.length; i++) { if (dropdown.items[i].text === text) return i; } return -1; }
    function isSecurityPrefEnabled() { try { return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY") === 1; } catch(e) { return false; } }

    function saveSettings() {
        var mailMakerPrefs = {
            saudacao: appData.selectedSaudacao,
            despedida: appData.selectedDespedida,
            emoji: appData.selectedEmoji,
            template: appData.selectedTemplate,
            emailMessage: appData.emailMessage,
            showFullPath: appData.showFullPath,
            showTeamData: appData.showTeamData
        };
        if (prefsApi && prefsApi.set) {
            prefsApi.set('MAILMAKER_config', mailMakerPrefs, true);
            return;
        }
        var prefsFile = new File(mainPath + config.userPreferencesFile);
        try {
            var allPreferences = readJsonFile(prefsFile.fsName) || {};
            allPreferences.MAILMAKER_config = mailMakerPrefs;
            prefsFile.encoding = "UTF-8";
            if (prefsFile.open("w")) {
                prefsFile.write(JSON.stringify(allPreferences, null, 2));
                prefsFile.close();
            }
        } catch(e) { logDebug("Erro ao salvar configurações: " + e.toString()); }
    }

    function loadSettings() {
        var loaded = null;
        if (prefsApi && prefsApi.get) {
            loaded = prefsApi.get('MAILMAKER_config', null);
        } else {
            var prefsFile = new File(mainPath + config.userPreferencesFile);
            try {
                if (prefsFile.exists) {
                    var allPreferences = readJsonFile(prefsFile.fsName);
                    if (allPreferences && allPreferences.MAILMAKER_config) {
                        loaded = allPreferences.MAILMAKER_config;
                    }
                }
            } catch(e) { logDebug("Erro ao carregar configurações: " + e.toString()); }
        }
        if (loaded) {
            appData.selectedSaudacao = loaded.saudacao || appData.selectedSaudacao;
            appData.selectedDespedida = loaded.despedida || appData.selectedDespedida;
            appData.selectedEmoji = loaded.emoji || appData.selectedEmoji;
            appData.selectedTemplate = loaded.template || appData.selectedTemplate;
            appData.emailMessage = loaded.emailMessage || templates[appData.selectedTemplate] || "";
            appData.showFullPath = (loaded.showFullPath !== undefined) ? loaded.showFullPath : true;
            appData.showTeamData = (loaded.showTeamData !== undefined) ? loaded.showTeamData : false;
            if (appData.selectedTemplate === "Personalizado" && !loaded.emailMessage) {
                appData.emailMessage = "";
            } else if (appData.selectedTemplate !== "Personalizado" && loaded.emailMessage !== templates[appData.selectedTemplate]) {
                appData.selectedTemplate = "Personalizado";
            }
        }
    }

    // === LÓGICA PRINCIPAL ===
    function chooseEditorDialog(editorNames) {
        var dialog = new Window("dialog", "Selecionar Editor");
        dialog.add("statictext", undefined, "Múltiplos editores detectados. Escolha um:");
        var list = dialog.add("dropdownlist", undefined, editorNames);
        list.selection = 0;
        var okButton = dialog.add("button", undefined, "OK");
        var selectedEditor = "";
        okButton.onClick = function() { selectedEditor = list.selection.text; dialog.close(); };
        dialog.show();
        return selectedEditor;
    }
    
    function setDestination(name, path) {
        appData.customDestinationName = name; appData.customDestinationPath = path;
        ui.manualDestinoInput.text = name; ui.manualCaminhoInput.text = path;
        var idx = findDropdownItem(ui.destinationDropdown, name);
        var oldOnChange = ui.destinationDropdown.onChange; ui.destinationDropdown.onChange = null;
        if (idx > -1) { ui.destinationDropdown.selection = idx; appData.selectedDestination = name;
        } else { if (ui.destinationDropdown.selection) ui.destinationDropdown.selection = null; appData.selectedDestination = null; }
        ui.destinationDropdown.onChange = oldOnChange; 
        updateEmailPreview();
    }

    function processTemplateVariables(template) { return (template || "").replace(/\{editor\}/g, appData.capturedEditorName || ""); }
    
    function extractEditorName(compName) {
        var parts = compName.split("-");
        if (parts.length >= 2) { var rawName = parts[1].replace(/C\d+$/i, "").replace(/\d+/g, "").trim(); if (rawName) return toTitleCase(rawName); }
        return "";
    }

    function generateTeamData() {
        var teamData = "";
        try {
            if (app.project && app.project.file) {
                teamData += "Dados para equipe:\nPROJETO SALVO:\n" + decodeURI(app.project.file.fsName) + "\n\n";
                var renderQueue = app.project.renderQueue;
                var renderPaths = [];
                if (renderQueue.numItems > 0) {
                    for (var i = 1; i <= renderQueue.numItems; i++) {
                        var item = renderQueue.item(i);
                        if (item.numOutputModules > 0 && item.outputModule(1).file) {
                            renderPaths.push(decodeURI(item.outputModule(1).file.fsName));
                        }
                    }
                }
                if (renderPaths.length > 0) teamData += "RENDER QUEUE:\n" + renderPaths.join("\n") + "\n";
            } else { teamData += "Dados para equipe:\nPROJETO SALVO:\n[Projeto não salvo]\n"; }
        } catch (e) { teamData = "Dados para equipe:\n[Erro ao obter informações]"; }
        return teamData;
    }

    function updateEmailPreview() {
        if (!ui.previewText) return;
        var saudacao = (appData.capturedEditorName) ? appData.selectedSaudacao + " " + appData.capturedEditorName + ", " + getGreeting() + "." : appData.selectedSaudacao + ", " + getGreeting() + ".";
        var mensagem = processTemplateVariables(appData.emailMessage);
        var destNome = appData.customDestinationName || "Nenhum Destino";
        var destCaminho = appData.customDestinationPath || "Selecione um preset ou detecte.";
        var destFormatado = appData.showFullPath ? (symbols.folder ? symbols.folder + " " : "") + destNome.toUpperCase() + "\n    " + destCaminho : (symbols.folder ? symbols.folder + " " : "") + destNome.toUpperCase();
        var compsLimpas = [];
        for (var i = 0; i < appData.capturedCompNames.length; i++) { compsLimpas.push(appData.capturedCompNames[i].replace(/_/g, " ")); }
        var compsFormatado = (compsLimpas.length === 0) ? (symbols.error ? symbols.error + " " : "") + "NENHUMA COMP CAPTURADA" : (compsLimpas.length === 1) ? compsLimpas[0] : "    " + compsLimpas.join("\n    ");
        var email = saudacao + "\n\n" + mensagem + "\n\n" + "Artes prontas no:\n" + destFormatado + "\n" + compsFormatado;
        if (appData.showTeamData) { email += "\n\n" + generateTeamData(); }
        email += "\n\n" + appData.selectedDespedida + " " + appData.selectedEmoji;
        ui.previewText.text = email;
    }

    function captureCompositions() {
        if (!app.project) { updateStatus("Nenhum projeto aberto", "error"); return false; }
        var sel = app.project.selection; var comps = []; var editores = {};
        for (var i = 0; i < sel.length; i++) { if (sel[i] instanceof CompItem) { comps.push(sel[i].name); var ed = extractEditorName(sel[i].name); if (ed && editores[ed] === undefined) editores[ed] = true; } }
        if (comps.length === 0 && app.project.activeItem instanceof CompItem) { var active = app.project.activeItem; comps.push(active.name); var edActive = extractEditorName(active.name); if (edActive && editores[edActive] === undefined) editores[edActive] = true; }
        if (comps.length === 0) { updateStatus("Nenhuma comp selecionada ou ativa", "error"); return false; }
        appData.capturedCompNames = comps;
        var nomesEditores = getObjectKeys(editores);
        if (nomesEditores.length > 1) { appData.capturedEditorName = chooseEditorDialog(nomesEditores) || nomesEditores[0];
        } else if (nomesEditores.length === 1) { appData.capturedEditorName = nomesEditores[0];
        } else { appData.capturedEditorName = ""; }
        updateStatus(appData.capturedCompNames.length + " comp(s) capturada(s)", "success");
        return true;
    }

    function runAutoDetectionAndUpdateUI() {
        if (appData.capturedCompNames.length === 0) { updateStatus("Capture uma comp primeiro.", "warning"); return; }
        if (!$.global.MailMakerAutoPath) { updateStatus("Erro: Lógica de detecção não foi carregada.", "error"); return; }
        var compName = appData.capturedCompNames[0];
        updateStatus("Analisando '" + compName + "'...", "info");
        var detectionResult = $.global.MailMakerAutoPath.regrasGNews(compName, loadedCaminhosJSON, programacaoData, false) || $.global.MailMakerAutoPath.regrasFant(compName, loadedCaminhosJSON, programacaoData, false);
        if (detectionResult && detectionResult.nome) { setDestination(detectionResult.nome, detectionResult.caminho); updateStatus("Destino detectado: " + detectionResult.nome, "success"); }
        else { setDestination("", ""); updateStatus("Nenhum destino automático encontrado", "warning"); }
    }
    
    function renderPreviewFrame() {
        if (!app.project) { updateStatus("Nenhum projeto aberto.", "error"); return; }
        var compsToPreview = [];
        if (appData.capturedCompNames.length > 0) { for (var i = 0; i < appData.capturedCompNames.length; i++) { var compName = appData.capturedCompNames[i]; for (var j = 1; j <= app.project.numItems; j++) { var item = app.project.item(j); if (item instanceof CompItem && item.name === compName) { compsToPreview.push(item); break; } } } }
        else { var activeComp = app.project.activeItem; if (!(activeComp && activeComp instanceof CompItem)) { updateStatus("Nenhuma composição ativa. Capture uma.", "warning"); return; } compsToPreview.push(activeComp); }
        if (compsToPreview.length === 0) { updateStatus("Nenhuma composição encontrada para preview.", "warning"); return; }
        app.beginUndoGroup("Render Preview Frames");
        var successCount = 0; var errorCount = 0;
        try {
            if (!isSecurityPrefEnabled()) { alert("A função de preview precisa de permissão.\nHabilite 'Allow Scripts to Write Files and Access Network' nas preferências."); updateStatus("Preview desabilitado por segurança.", "error"); app.endUndoGroup(); return; }
            if (typeof getPathDayByDay !== 'function') { updateStatus("Erro: 'func_getPathDayByDay.js' não carregado.", "error"); app.endUndoGroup(); return; }
            var basePath; var isGnewsProgram = false;
            if ($.global.MailMakerAutoPath && $.global.MailMakerAutoPath.regrasGNews) { var detectionResult = $.global.MailMakerAutoPath.regrasGNews(compsToPreview[0].name, loadedCaminhosJSON, programacaoData, false); if (detectionResult) { isGnewsProgram = true; } }
            if (isGnewsProgram) {
                updateStatus("Programa GNEWS detectado. Salvando preview na pasta do projeto.", "info");
                if (!app.project.file) { updateStatus("Para programas GNEWS, salve o projeto primeiro.", "warning"); app.endUndoGroup(); return; }
                basePath = app.project.file.path;
            } else {
                var primaryPath = getPathDayByDay(); var primaryFolder = new Folder(primaryPath);
                if (!primaryFolder.exists) {
                    updateStatus("Caminho do dia não encontrado. Usando pasta do projeto como alternativa.", "warning");
                    if (!app.project.file) { alert("O projeto atual ainda não foi salvo. Salve o projeto para gerar o preview na mesma pasta."); updateStatus("Salve o projeto para criar um preview.", "error"); app.endUndoGroup(); return; }
                    basePath = app.project.file.path;
                } else { basePath = primaryPath; }
            }
            var previewFolder = new Folder(basePath + "/_PREVIEWS");
            if (!previewFolder.exists && !previewFolder.create()) { updateStatus("Não foi possível criar a pasta _PREVIEWS.", "error"); app.endUndoGroup(); return; }
            for (var c = 0; c < compsToPreview.length; c++) {
                var comp = compsToPreview[c];
                try {
                    updateStatus("Renderizando preview " + (c + 1) + "/" + compsToPreview.length + ": " + comp.name, "info");
                    var safeName = comp.name.replace(/_/g, ' ').replace(/[^\w\s\.\-]/g, ' ').replace(/\s+/g, ' ').trim();
                    var outputFile = new File(previewFolder.fsName + "/" + safeName + " PREVIEW.png");
                    comp.saveFrameToPng(comp.time, outputFile);
                    successCount++;
                } catch (compError) { errorCount++; }
            }
            if (successCount > 0 && errorCount === 0) { updateStatus(successCount + " previews salvos!", "success"); }
            else if (successCount > 0 && errorCount > 0) { updateStatus(successCount + " salvos, " + errorCount + " falharam", "warning"); }
            else { updateStatus("Falha ao salvar todos os previews", "error"); }
            if (successCount > 0) { previewFolder.execute(); }
        } catch (e) { updateStatus("Erro ao renderizar previews: " + e.message, "error"); }
        finally { app.endUndoGroup(); }
    }
    
    // === UI E EVENTOS (COM LAYOUT CORRIGIDO) ===
    function createUI() {
        ui.window = new Window("palette", config.windowTitle, undefined, { resizeable: false });
        var w = ui.window;
        w.orientation = "column"; w.alignChildren = ["fill", "fill"]; w.spacing = 5; w.margins = 15;
        if(typeof setBgColor === 'function') setBgColor(w, typeof bgColor1 !== 'undefined' ? bgColor1 : '#222222');
        
        var mainColumnsGroup = w.add("group"); mainColumnsGroup.orientation = "row"; mainColumnsGroup.alignChildren = ["top", "top"]; mainColumnsGroup.spacing = 10; mainColumnsGroup.alignment = "fill";
        var leftColumn = mainColumnsGroup.add("group"); leftColumn.orientation = "column"; leftColumn.alignChildren = ["fill", "fill"]; leftColumn.spacing = 10; leftColumn.preferredSize.width = 100;
        var rightColumn = mainColumnsGroup.add("group"); rightColumn.orientation = "column"; rightColumn.alignChildren = ["fill", "fill"]; rightColumn.spacing = 10; rightColumn.alignment = ["fill", "fill"]; rightColumn.preferredSize.width = 400; 
        
        var leftHeaderGroup = leftColumn.add("group"); leftHeaderGroup.orientation = "row"; leftHeaderGroup.alignChildren = ["left", "center"]; leftHeaderGroup.margins = [0, 0, 0, 10];
        var titleText = leftHeaderGroup.add("statictext", undefined, "GNEWS MailMaker", {truncate: 'end'});
        try { titleText.graphics.font = ScriptUI.newFont(fontConfig.defaultFont, "Bold", fontConfig.titleSize); } catch (e) {}
        if(typeof setFgColor === 'function') setFgColor(titleText, typeof highlightColor1 !== 'undefined' ? highlightColor1 : '#FFFFFF');
        
        var rightHeaderGroup = rightColumn.add("group"); rightHeaderGroup.orientation = "row"; rightHeaderGroup.alignChildren = ["right", "center"]; rightHeaderGroup.alignment = "fill"; rightHeaderGroup.margins = [0, 0, 0, 10];
        var helpBtn;
        try {
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
                helpBtn = new themeIconButton(rightHeaderGroup, { icon: D9T_INFO_ICON, tips: ["Ajuda"] });
                helpBtn.leftClick.onClick = function() { if (typeof showMailMakerHelp === 'function') showMailMakerHelp(); else alert("Função de ajuda não encontrada."); };
            } else { throw new Error("Theme button not available"); }
        } catch(e) {
            helpBtn = rightHeaderGroup.add("button", undefined, "?", { preferredSize: [25, 25], helpTip: "Ajuda sobre o MailMaker" });
            helpBtn.onClick = function() { if (typeof showMailMakerHelp === 'function') showMailMakerHelp(); else alert("Função de ajuda não encontrada."); };
        }

        var allStaticLabels = [];
        var configPanel = leftColumn.add("panel", undefined, (symbols.config ? symbols.config + " " : "") + "PERSONALIZAÇÃO DE EMAIL"); allStaticLabels.push(configPanel);
        configPanel.alignChildren = "fill"; configPanel.margins = 15; configPanel.spacing = 15; configPanel.alignment = 'fill'; 
        
        var greetingGroup = configPanel.add("group"); greetingGroup.orientation = "row";
        var saudacaoSubGroup = greetingGroup.add("group");
        var saudacaoLabel = saudacaoSubGroup.add("statictext", undefined, "Saudação:"); allStaticLabels.push(saudacaoLabel);
        ui.saudacaoDropdown = saudacaoSubGroup.add("dropdownlist", undefined, saudacoes); ui.saudacaoDropdown.preferredSize.width = 80;
        ui.saudacaoDropdown.helpTip = "Escolha como o email será iniciado.";
        greetingGroup.add("group").preferredSize.width = 10;
        var despedidaSubGroup = greetingGroup.add("group");
        var despedidaLabel = despedidaSubGroup.add("statictext", undefined, "Despedida:"); allStaticLabels.push(despedidaLabel);
        ui.despedidaDropdown = despedidaSubGroup.add("dropdownlist", undefined, despedidas); ui.despedidaDropdown.preferredSize.width = 100;
        ui.despedidaDropdown.helpTip = "Selecione o encerramento do email.";
        greetingGroup.add("group").preferredSize.width = 10;
        var emojiSubGroup = greetingGroup.add("group");
        var emojiLabel = emojiSubGroup.add("statictext", undefined, "Emoji:"); allStaticLabels.push(emojiLabel);
        ui.emojiDropdown = emojiSubGroup.add("dropdownlist", undefined, emojis); ui.emojiDropdown.preferredSize.width = 60;
        ui.emojiDropdown.helpTip = "Complemento visual usado nas saudações ou despedidas.";
        
        var messagePanel = leftColumn.add("panel", undefined, (symbols.email ? symbols.email + " " : "") + "DESCRIÇÃO DO EMAIL"); allStaticLabels.push(messagePanel);
        messagePanel.alignChildren = "fill"; messagePanel.margins = 15; messagePanel.spacing = 8; messagePanel.alignment = 'fill'; 
        var templateLine = messagePanel.add("group"); templateLine.orientation = "row"; templateLine.spacing = 10;
        var templateLabel = templateLine.add("statictext", undefined, "Template:"); allStaticLabels.push(templateLabel);
        ui.templateDropdown = templateLine.add("dropdownlist", undefined, templateNames); ui.templateDropdown.alignment = "fill";
        ui.templateDropdown.helpTip = "Modelos de mensagem prontos; escolha para preencher o corpo automaticamente.";
        ui.showPathCheckbox = templateLine.add("checkbox", undefined, "Caminho"); allStaticLabels.push(ui.showPathCheckbox); ui.showPathCheckbox.value = true;
        ui.showPathCheckbox.helpTip = "Inclui o caminho completo dos arquivos no texto final.";
        ui.messageInput = messagePanel.add("edittext", undefined, "", { multiline: true, scrollable: true }); ui.messageInput.alignment = "fill"; ui.messageInput.preferredSize.height = 100;
        ui.messageInput.helpTip = "Edite o corpo do email. Alterações são salvas automaticamente.";
        
        var destPanel = leftColumn.add("panel", undefined, (symbols.folder ? symbols.folder + " " : "") + "CONFIGURAÇÃO DE DESTINO"); allStaticLabels.push(destPanel);
        destPanel.alignChildren = "left"; destPanel.margins = 15; destPanel.spacing = 8; destPanel.alignment = 'fill';
        var presetLine = destPanel.add("group"); presetLine.orientation = "row"; presetLine.spacing = 10;
        var presetLabel = presetLine.add("statictext", undefined, "Preset de Destino:"); allStaticLabels.push(presetLabel);
        ui.destinationDropdown = presetLine.add("dropdownlist", undefined, destinationNames); ui.destinationDropdown.alignment = "fill"; ui.destinationDropdown.preferredSize.width = 150;
        ui.destinationDropdown.helpTip = "Escolha um destino predefinido para anexos e links.";
        ui.showTeamDataCheckbox = presetLine.add("checkbox", undefined, "Dados para Equipe"); allStaticLabels.push(ui.showTeamDataCheckbox); ui.showTeamDataCheckbox.value = false;
        ui.showTeamDataCheckbox.helpTip = "Exibe informações adicionais destinadas ao time interno.";
        var manualDestLine = destPanel.add("group"); manualDestLine.orientation = "row"; manualDestLine.spacing = 17; 
        var manualDestLabel = manualDestLine.add("statictext", undefined, "Destino Manual:"); allStaticLabels.push(manualDestLabel);
        ui.manualDestinoInput = manualDestLine.add("edittext", undefined, ""); ui.manualDestinoInput.alignment = "fill"; ui.manualDestinoInput.preferredSize.width = 298;
        ui.manualDestinoInput.helpTip = "Nome alternativo para o destino (caso o preset não atenda).";
        var manualPathLine = destPanel.add("group"); manualPathLine.orientation = "row";
        var manualPathLabel = manualPathLine.add("statictext", undefined, "Caminho Manual:"); allStaticLabels.push(manualPathLabel);
        ui.manualCaminhoInput = manualPathLine.add("edittext", undefined, ""); ui.manualCaminhoInput.alignment = "fill"; ui.manualCaminhoInput.preferredSize.width = 298;
        ui.manualCaminhoInput.helpTip = "Informe um caminho completo personalizado para salvar ou compartilhar.";
        
        var previewPanel = rightColumn.add("panel", undefined, (symbols.preview ? symbols.preview + " " : "") + "Pré-Visualização do Email"); allStaticLabels.push(previewPanel);
        previewPanel.alignChildren = "fill"; previewPanel.margins = 15; previewPanel.alignment = ["fill", "fill"];
        ui.previewText = previewPanel.add("edittext", undefined, "", { multiline: true, readonly: true, scrollable: true }); ui.previewText.alignment = "fill"; ui.previewText.preferredSize.height = 263;
        ui.previewText.helpTip = "Prévia do email final. Atualiza conforme as opções acima.";
        try { ui.previewText.graphics.font = ScriptUI.newFont(fontConfig.defaultFont, undefined, fontConfig.size); } catch (e) {}
        
        var buttonGroup = previewPanel.add("group"); buttonGroup.orientation = "row"; buttonGroup.alignChildren = ["fill", "center"]; buttonGroup.spacing = 5;

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
            applyFixedSize(ctrl, themeButtonSize.width, themeButtonSize.height);
            ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
            ctrl.__buttonThemeOverrides.width = themeButtonSize.width;
            ctrl.__buttonThemeOverrides.height = themeButtonSize.height;
            var relock = function () { applyFixedSize(ctrl, themeButtonSize.width, themeButtonSize.height); };
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

        function createActionButton(parent, label, tip) {
            var ctrl;
            if (typeof themeButton === 'function') {
                var btnObj = new themeButton(parent, { labelTxt: label, tips: tip ? [tip] : [], width: themeButtonSize.width, height: themeButtonSize.height });
                ctrl = btnObj.label;
                ctrl.alignment = ['fill', 'center'];
                enforceThemeButtonSize(ctrl);
            } else {
                ctrl = parent.add("button", undefined, label);
                applyFixedSize(ctrl, themeButtonSize.width, themeButtonSize.height);
            }
            if (ctrl && tip) { ctrl.helpTip = tip; }
            return ctrl;
        }
        ui.captureBtn = createActionButton(buttonGroup, (symbols.capture ? symbols.capture + " " : "") + "Capturar", "Lê as comps selecionadas e preenche dados para o email.");
        ui.detectBtn = createActionButton(buttonGroup, (symbols.detect ? symbols.detect + " " : "") + "Detectar", "Detecta automaticamente caminhos/destinos com base na programação.");
        ui.previewBtn = createActionButton(buttonGroup, (symbols.image ? symbols.image + " " : "") + "Preview", "Gera previews e atualiza a mensagem com os arquivos salvos.");
        ui.copyBtn = createActionButton(buttonGroup, (symbols.copy ? symbols.copy + " " : "") + "Copiar", "Copia o texto completo do email para a área de transferência.");
        
        var statusPanel = w.add("panel", undefined, "Status"); allStaticLabels.push(statusPanel); statusPanel.alignment = "fill"; statusPanel.margins = 10;
        var statusGroup = statusPanel.add("group"); statusGroup.alignment = "fill"; statusGroup.orientation = "row";
        ui.statusText = statusGroup.add("statictext", undefined, "Inicializando...", {truncate: 'end'}); ui.statusText.alignment = ['fill', 'center']; ui.statusText.justify = 'center';
        ui.statusText.helpTip = "Mostra o último status ou alerta gerado pelo MailMaker.";
        
        if(typeof setFgColor === 'function') { var defaultTextColor = typeof monoColor1 !== 'undefined' ? monoColor1 : '#CCCCCC'; for (var i = 0; i < allStaticLabels.length; i++) { setFgColor(allStaticLabels[i], defaultTextColor); } }

        w.onClose = function() { saveSettings(); };
        var onSettingsChange = function() { if (this.selection) { appData.selectedSaudacao = ui.saudacaoDropdown.selection.text; appData.selectedDespedida = ui.despedidaDropdown.selection.text; appData.selectedEmoji = ui.emojiDropdown.selection.text; updateEmailPreview(); saveSettings(); } };
        ui.saudacaoDropdown.onChange = ui.despedidaDropdown.onChange = ui.emojiDropdown.onChange = onSettingsChange;
        ui.templateDropdown.onChange = function() { if (this.selection) { appData.selectedTemplate = this.selection.text; if (appData.selectedTemplate !== "Personalizado") { appData.emailMessage = templates[appData.selectedTemplate]; ui.messageInput.text = appData.emailMessage; } updateEmailPreview(); saveSettings(); } };
        ui.messageInput.onChanging = function() { appData.emailMessage = this.text; if (appData.selectedTemplate !== "Personalizado" && this.text !== templates[appData.selectedTemplate]) { var idx = findDropdownItem(ui.templateDropdown, "Personalizado"); if (idx > -1) { ui.templateDropdown.selection = idx; appData.selectedTemplate = "Personalizado"; } } updateEmailPreview(); if (ui.messageInput.saveTimer) clearTimeout(ui.messageInput.saveTimer); ui.messageInput.saveTimer = app.setTimeout(saveSettings, 1000); };
        var onCheckboxClick = function() { appData.showFullPath = ui.showPathCheckbox.value; appData.showTeamData = ui.showTeamDataCheckbox.value; updateEmailPreview(); saveSettings(); };
        ui.showPathCheckbox.onClick = ui.showTeamDataCheckbox.onClick = onCheckboxClick;
        ui.destinationDropdown.onChange = function() { if (this.selection) { var sel = this.selection.text; setDestination(sel, caminhosData[sel] || ""); } else { setDestination("", ""); } };
        var manualInputHandler = function() { setDestination(ui.manualDestinoInput.text, ui.manualCaminhoInput.text); };
        ui.manualDestinoInput.onChanging = manualInputHandler;
        ui.manualCaminhoInput.onChanging = manualInputHandler;
        ui.captureBtn.onClick = function() { if (captureCompositions()) updateEmailPreview(); };
        ui.detectBtn.onClick = function() { if (captureCompositions()) runAutoDetectionAndUpdateUI(); };
        ui.previewBtn.onClick = renderPreviewFrame;
        ui.copyBtn.onClick = function() { try { if (!isSecurityPrefEnabled()) { alert("Função de cópia requer permissão de acesso à rede nas preferências."); updateStatus("Cópia desabilitada por segurança.", "error"); return; } var txt = ui.previewText.text; if (!txt || txt.trim() === "") { updateStatus("Nada para copiar.", "warning"); return; } setClipboard(txt); updateStatus("Email copiado!", "success"); } catch (e) { alert("Falha ao copiar:\n" + e.toString()); updateStatus("Falha ao copiar", "error"); } };
        w.onShow = function() { if (captureCompositions()) runAutoDetectionAndUpdateUI(); else updateStatus("Pronto.", "info"); };
    }
    
    // === INICIALIZAÇÃO ===
    function init() {
        logDebug("=== INICIANDO MailMaker - v46.1 ===");
        var tempPath = "";
        if (typeof scriptMainPath !== 'undefined' && scriptMainPath !== "" && new Folder(scriptMainPath).exists) { tempPath = scriptMainPath; } else { tempPath = findScriptMainPath(); }
        if (tempPath.charAt(tempPath.length - 1) !== '/' && tempPath.charAt(tempPath.length - 1) !== '\\') { mainPath = tempPath + '/'; } else { mainPath = tempPath; }
        if (!mainPath || !new Folder(mainPath).exists) { alert("ERRO CRÍTICO: Não foi possível determinar a pasta raiz do script 'GND9TOOLS script'."); return; }
        var dataFile = new File(mainPath + config.dataConfigFile); var allData = readJsonFile(dataFile.fsName);
        if (!allData) { alert("ERRO CRÍTICO: Não foi possível carregar ou ler o arquivo de dados.\n\nVerifique se o arquivo '" + config.dataConfigFile + "' existe e não tem erros de sintaxe.\n\nCaminho Procurado:\n" + decodeURI(dataFile.fsName)); return; }
        loadedCaminhosJSON = allData.CAMINHOS_REDE; programacaoData = allData.PROGRAMACAO_GNEWS;
        var autoPathScript = new File(mainPath + "source/libraries/functions/func_auto_path_servers.js");
        if (autoPathScript.exists) $.evalFile(autoPathScript); else { alert("ERRO CRÍTICO: 'func_auto_path_servers.js' não encontrado."); return; }
        var getPathDayByDayScript = new File(mainPath + "source/libraries/functions/func_getPathDayByDay.js");
        if (getPathDayByDayScript.exists) $.evalFile(getPathDayByDayScript); else logDebug("AVISO: 'func_getPathDayByDay.js' não encontrado.");
        if (loadedCaminhosJSON && loadedCaminhosJSON.caminhos && loadedCaminhosJSON.caminhos.grupos) {
            var grupos = loadedCaminhosJSON.caminhos.grupos;
            for (var g = 0; g < grupos.length; g++) {
                var subgrupos = grupos[g].subgrupos;
                for (var s = 0; s < subgrupos.length; s++) {
                    var links = subgrupos[s].links;
                    for (var l = 0; l < links.length; l++) {
                        var linkInfo = links[l];
                        if (linkInfo.nome && linkInfo.caminho) {
                            var finalPath = linkInfo.caminho;
                            if (finalPath.toLowerCase().indexOf("catalogos/") === 0) { finalPath = mainPath + finalPath; }
                            caminhosData[linkInfo.nome] = finalPath;
                        }
                    }
                }
            }
            destinationNames = getObjectKeys(caminhosData).sort();
        }
        createUI(); 
        loadSettings(); 
        ui.saudacaoDropdown.selection = findDropdownItem(ui.saudacaoDropdown, appData.selectedSaudacao);
        ui.despedidaDropdown.selection = findDropdownItem(ui.despedidaDropdown, appData.selectedDespedida);
        ui.emojiDropdown.selection = findDropdownItem(ui.emojiDropdown, appData.selectedEmoji);
        ui.templateDropdown.selection = findDropdownItem(ui.templateDropdown, appData.selectedTemplate);
        ui.messageInput.text = appData.emailMessage;
        ui.showPathCheckbox.value = appData.showFullPath;
        ui.showTeamDataCheckbox.value = appData.showTeamData;
        if (destinationNames.length > 0 && ui.destinationDropdown.items.length > 0) {
            ui.destinationDropdown.selection = 0;
            if(ui.destinationDropdown.onChange) ui.destinationDropdown.onChange();
        }
        updateEmailPreview();
        ui.window.center();
        ui.window.show();
        logDebug("=== INICIALIZAÇÃO COMPLETA ===");
    }

    init();
}
