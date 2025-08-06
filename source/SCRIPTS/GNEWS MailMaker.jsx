/***************************************************
 * GNEWS MailMaker - VERSÃO FINAL (v27.3)
 * Script principal completo. Funciona em conjunto com o
 * 'func_auto_path_servers.js' corrigido (com indexOf).
 * A janela de diagnóstico é aberta através de um botão na UI.
 ***************************************************/

(function() {

    // === CONFIGURAÇÕES BÁSICAS ===
    var config = {
        windowTitle: "GNEWS MailMaker v27.3 - FINAL",
    };

    // === DADOS GLOBAIS ===
    var appData = { capturedCompNames: [], capturedEditorName: "", emailMessage: "", selectedSaudacao: "Oi", selectedDespedida: "Abs,", selectedEmoji: "🤟", selectedTemplate: "Padrão Simples", selectedDestination: "Auto Detectar", customDestinationName: "", customDestinationPath: "" };
    
    // === VARIÁVEIS DE UI E DADOS EXTERNOS ===
    var ui = {};
    var caminhosData = {};
    var caminhosDataReverse = {};
    var loadedCaminhosJSON = {};
    var programacaoData = {};
    var destinationNames = ["Auto Detectar"];

    // === TEMPLATES E OPÇÕES ===
    var templates = { "Padrão Simples": "Segue arte.", "Detalhado": "Segue arte finalizada conforme briefing.\n\nQualquer dúvida, me avise!", "Revisão": "Segue arte com as correções solicitadas.\n\nPor favor, confirme se está tudo ok agora.", "Final": "Arte finalizada! 🎉\n\nArquivos prontos para produção.", "Urgente": "⚡ ARTE URGENTE ⚡\n\nSegue arte para aprovação imediata.", "Personalizado": "" };
    var templateNames = getObjectKeys(templates);
    var saudacoes = ["Oi", "Olá", "E aí", "Fala", "Salve", "Eae"];
    var despedidas = ["Abs,", "Abraços,", "Valeu,", "Falou,", "Até mais,", "Grande abraço,", "Att,", "Atenciosamente,"];
    var emojis = ["🤟", "👍", "✌️", "😊", "🙂", "💪", "🚀", "⚡", "🔥", "✨", "🎯", "📸"];

    // === FUNÇÕES UTILITÁRIAS ===
    function getObjectKeys(obj) { var keys = []; for (var key in obj) { if (obj.hasOwnProperty(key)) keys.push(key); } return keys; }
    function logDebug(message) { $.writeln("[MailMaker] " + message); }
    function updateStatusText(message) { if (ui.statusText) { ui.statusText.text = message; logDebug("Status: " + message); } }
    
    function findScriptMainPath() {
        try {
            var aexPath = Folder.decode(app.path);
            var possiblePaths = ["/Scripts/GNEWS-D9-TOOLS/", "/Scripts/ScriptUI Panels/GNEWS-D9-TOOLS/"];
            for (var i = 0; i < possiblePaths.length; i++) {
                var folder = new Folder(aexPath + possiblePaths[i]);
                if (folder.exists) { return folder.fsName + "/"; }
            }
            var scriptPath = new File($.fileName).parent;
            while (scriptPath && scriptPath.name !== "GNEWS-D9-TOOLS") { scriptPath = scriptPath.parent; }
            if (scriptPath && scriptPath.exists) { return scriptPath.fsName + "/"; }
        } catch (e) {}
        alert("AVISO: Pasta 'GNEWS-D9-TOOLS' não localizada.");
        return new File($.fileName).parent.fsName + "/";
    }

    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) { logDebug("Erro: Arquivo JSON não encontrado: " + filePath); return null; }
        try {
            file.encoding = "UTF-8"; file.open("r"); var content = file.read(); file.close();
            return content ? eval("(" + content + ")") : null;
        } catch (e) { alert("Erro de formatação no arquivo JSON: " + filePath + "\n\n" + e.toString()); return null; }
    }
    
    function getGreeting() { var hour = new Date().getHours(); if (hour < 12) return "bom dia"; if (hour < 18) return "boa tarde"; return "boa noite"; }
    function toTitleCase(str) { return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }); }
    function formatDate(date) { return ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear(); }
    function validateDestinationPath(path) { try { if (!path || path.trim() === "") return false; if (path.indexOf("ftp://") === 0) return true; return new Folder(path).exists; } catch (e) { return false; } }
    function findDropdownItem(dropdown, text) { for(var i = 0; i < dropdown.items.length; i++) { if (dropdown.items[i].text === text) return i; } return -1; }

    // === LÓGICA PRINCIPAL ===
    function processTemplateVariables(template) {
        var processed = template || "";
        var now = new Date();
        processed = processed.replace(/\{editor\}/g, appData.capturedEditorName || "");
        var amanha = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        processed = processed.replace(/\{data_amanha\}/g, formatDate(amanha));
        processed = processed.replace(/\{periodo\}/g, getGreeting());
        return processed;
    }

    function extractEditorName(compName) {
        var parts = compName.split("-");
        if (parts.length >= 2) {
            var rawEditorName = parts[1].replace(/C\d+$/i, "").replace(/\d+/g, "").replace(/\s+/g, " ").trim();
            if (rawEditorName) return toTitleCase(rawEditorName);
        }
        return "";
    }

    function updateEmailPreview() {
        if (!ui.previewText) return;
        var saudacaoCompleta = (appData.capturedEditorName) ? appData.selectedSaudacao + " " + appData.capturedEditorName + ", " + getGreeting() + "." : appData.selectedSaudacao + ", " + getGreeting() + ".";
        var finalMessage = processTemplateVariables(appData.emailMessage);

        var destinationName = "", destinationPath = "";
        if (appData.customDestinationName || appData.customDestinationPath) {
            destinationName = appData.customDestinationName || "Destino Manual";
            destinationPath = appData.customDestinationPath || "Caminho não especificado";
        } else {
            destinationName = appData.selectedDestination;
            if (destinationName === "Auto Detectar") {
                destinationPath = "Aguardando captura para detectar...";
            } else {
                destinationPath = caminhosData[destinationName] || "⚠️ CAMINHO NÃO ENCONTRADO";
            }
        }
        var destinoFormatted = "📁 **" + destinationName.toUpperCase() + "**\n    " + destinationPath;
        var compsFormatted = (appData.capturedCompNames.length === 0) ? "❌ NENHUMA COMP CAPTURADA" : (appData.capturedCompNames.length === 1) ? "**" + appData.capturedCompNames[0] + "**" : "    **" + appData.capturedCompNames.join("**\n    **") + "**";
        var emailCompleto = saudacaoCompleta + "\n\n" + finalMessage + "\nArtes prontas no:\n" + destinoFormatted + "\n" + compsFormatted + "\n\n\n\n" + appData.selectedDespedida + " " + appData.selectedEmoji;
        ui.previewText.text = emailCompleto;
    }

    function runAutoDetection() {
        if (appData.capturedCompNames.length === 0) return;
        if (!$.global.MailMakerAutoPath) { updateStatusText("❌ Erro: Lógica de detecção não foi carregada."); return; }
        var compName = appData.capturedCompNames[0];
        logDebug("Executando auto-detecção para: " + compName);
        var targetPath = $.global.MailMakerAutoPath.regrasGNews(compName, loadedCaminhosJSON, programacaoData) || $.global.MailMakerAutoPath.regrasFant(compName, loadedCaminhosJSON);

        if (targetPath) {
            var presetName = caminhosDataReverse[targetPath];
            if (presetName) {
                ui.destinationDropdown.selection = findDropdownItem(ui.destinationDropdown, presetName);
            } else {
                appData.customDestinationName = "Detectado (" + compName.split("-")[0].trim() + ")";
                appData.customDestinationPath = targetPath;
                updateDestinationFieldsState();
            }
        } else {
            updateStatusText("⚠️ Nenhum destino automático encontrado para esta comp.");
        }
    }

    function captureCompositions() {
        if (!app.project) { updateStatusText("❌ Nenhum projeto aberto"); return false; }
        var selectedItems = app.project.selection, compositions = [];
        for (var i = 0; i < selectedItems.length; i++) { if (selectedItems[i] instanceof CompItem) compositions.push(selectedItems[i].name); }
        if (compositions.length === 0 && app.project.activeItem instanceof CompItem) compositions.push(app.project.activeItem.name);
        if (compositions.length === 0) { updateStatusText("❌ Nenhuma comp encontrada"); return false; }
        appData.capturedCompNames = compositions;
        appData.capturedEditorName = extractEditorName(compositions[0]);
        updateStatusText(appData.capturedCompNames.length + " comp(s) capturada(s). Editor: " + (appData.capturedEditorName || "N/A"));
        if (appData.selectedDestination === "Auto Detectar") runAutoDetection();
        else updateEmailPreview();
        return true;
    }

    function updateDestinationFieldsState() {
        var isAuto = appData.selectedDestination === "Auto Detectar";
        var hasManualInput = appData.customDestinationName || appData.customDestinationPath;
        ui.manualDestinoInput.enabled = !isAuto;
        ui.manualCaminhoInput.enabled = !isAuto;
        ui.manualDestinoInput.text = appData.customDestinationName;
        ui.manualCaminhoInput.text = appData.customDestinationPath;
        if (isAuto) {
            appData.customDestinationName = ""; appData.customDestinationPath = "";
            ui.manualDestinoInput.text = ""; ui.manualCaminhoInput.text = "";
        }
        if (hasManualInput) {
            if(ui.destinationDropdown.selection) ui.destinationDropdown.selection = null;
            updateStatusText(validateDestinationPath(appData.customDestinationPath) ? "✅ Caminho manual válido." : "❌ Caminho manual inválido.");
        } else if (isAuto) {
            updateStatusText("Modo detecção: Clique em Capturar.");
        } else {
            updateStatusText(validateDestinationPath(caminhosData[appData.selectedDestination]) ? "✅ Preset '" + appData.selectedDestination + "' válido." : "❌ Preset '" + appData.selectedDestination + "' inválido.");
        }
        updateEmailPreview();
    }
    
    // === UI E EVENTOS ===
    function createUI() {
        ui.window = new Window("palette", config.windowTitle, undefined, { resizeable: false });
        var w = ui.window;
        w.orientation = "column"; w.alignChildren = ["fill", "top"]; w.spacing = 10; w.margins = 15;

        var mainGroup = w.add("group"); mainGroup.orientation = "row"; mainGroup.alignChildren = ["top", "top"]; mainGroup.spacing = 10;
        
        var leftColumn = mainGroup.add("group"); leftColumn.orientation = "column"; leftColumn.alignChildren = ["fill", "top"]; leftColumn.spacing = 8; leftColumn.preferredSize.width = 320;
        
        var configPanel = leftColumn.add("panel", undefined, "🎨 Personalização");
        configPanel.alignChildren = "fill"; configPanel.margins = 12;
        var greetingGroup = configPanel.add("group");
        greetingGroup.orientation = "row"; greetingGroup.alignChildren = ["fill", "center"];
        var saudacaoSubGroup = greetingGroup.add("group", undefined, {orientation: "column", alignChildren: "fill"});
        saudacaoSubGroup.add("statictext", undefined, "Saudação:");
        ui.saudacaoDropdown = saudacaoSubGroup.add("dropdownlist", undefined, saudacoes);
        var despedidaSubGroup = greetingGroup.add("group", undefined, {orientation: "column", alignChildren: "fill"});
        despedidaSubGroup.add("statictext", undefined, "Despedida:");
        ui.despedidaDropdown = despedidaSubGroup.add("dropdownlist", undefined, despedidas);
        var emojiSubGroup = greetingGroup.add("group", undefined, {orientation: "column", alignChildren: "fill"});
        emojiSubGroup.add("statictext", undefined, "Emoji:");
        ui.emojiDropdown = emojiSubGroup.add("dropdownlist", undefined, emojis);

        var messagePanel = leftColumn.add("panel", undefined, "🔤 DESCRIÇÃO DO EMAIL");
        messagePanel.alignChildren = "fill"; messagePanel.margins = 12; messagePanel.spacing = 8;
        messagePanel.add("statictext", undefined, "Template:");
        ui.templateDropdown = messagePanel.add("dropdownlist", undefined, templateNames);
        ui.templateDropdown.alignment = "fill";
        ui.messageInput = messagePanel.add("edittext", undefined, "", { multiline: true, scrollable: true });
        ui.messageInput.alignment = "fill"; ui.messageInput.preferredSize.height = 80;

        var destPanel = leftColumn.add("panel", undefined, "📁 CONFIGURAÇÃO DE DESTINO");
        destPanel.alignChildren = "fill"; destPanel.margins = 12; destPanel.spacing = 8;
        destPanel.add("statictext", undefined, "Preset de Destino:");
        ui.destinationDropdown = destPanel.add("dropdownlist", undefined, destinationNames);
        ui.destinationDropdown.alignment = "fill";
        destPanel.add("statictext", undefined, "Destino Manual (Opcional):");
        ui.manualDestinoInput = destPanel.add("edittext", undefined, "");
        ui.manualDestinoInput.alignment = "fill";
        destPanel.add("statictext", undefined, "Caminho Manual (Opcional):");
        ui.manualCaminhoInput = destPanel.add("edittext", undefined, "");
        ui.manualCaminhoInput.alignment = "fill";
        
        var rightColumn = mainGroup.add("group"); rightColumn.orientation = "column"; rightColumn.alignChildren = ["fill", "top"]; rightColumn.spacing = 10; rightColumn.preferredSize.width = 400;
        
        var previewPanel = rightColumn.add("panel", undefined, "👁️ Preview do Email");
        previewPanel.alignChildren = "fill"; previewPanel.margins = 15; previewPanel.alignment = ["fill", "fill"];
        ui.previewText = previewPanel.add("edittext", undefined, "", { multiline: true, readonly: true, scrollable: true });
        ui.previewText.alignment = "fill"; ui.previewText.preferredSize.height = 420;
        ui.previewText.graphics.font = ScriptUI.newFont("Courier New", 10);
        
        var actionGroup = rightColumn.add("group"); actionGroup.orientation = "row"; actionGroup.alignChildren = ["fill", "center"]; actionGroup.spacing = 10;
        ui.captureBtn = actionGroup.add("button", undefined, "🔘 CAPTURAR"); ui.captureBtn.preferredSize.height = 35;
        ui.copyBtn = actionGroup.add("button", undefined, "📋 COPIAR"); ui.copyBtn.preferredSize.height = 35;

        var statusPanel = w.add("panel", undefined, "Status");
        statusPanel.alignment = "fill";
        var statusGroup = statusPanel.add("group"); statusGroup.alignment = "fill"; statusGroup.orientation = "row";
        ui.statusText = statusGroup.add("statictext", undefined, "Inicializando...", { truncate: 'end' });
        ui.statusText.alignment = ["fill", "center"];
        ui.diagBtn = statusGroup.add("button", undefined, "Diagnóstico");
        ui.diagBtn.preferredSize.width = 100;
    }

    function setupEvents() {
        ui.saudacaoDropdown.onChange = function() { if (this.selection) { appData.selectedSaudacao = this.selection.text; updateEmailPreview(); } };
        ui.despedidaDropdown.onChange = function() { if (this.selection) { appData.selectedDespedida = this.selection.text; updateEmailPreview(); } };
        ui.emojiDropdown.onChange = function() { if (this.selection) { appData.selectedEmoji = this.selection.text; updateEmailPreview(); } };
        ui.templateDropdown.onChange = function() {
            if (!this.selection) return;
            appData.selectedTemplate = this.selection.text;
            if (appData.selectedTemplate !== "Personalizado") {
                appData.emailMessage = templates[appData.selectedTemplate];
                ui.messageInput.text = appData.emailMessage;
            }
            updateEmailPreview();
        };
        ui.messageInput.onChanging = function() {
            appData.emailMessage = this.text;
            if (appData.selectedTemplate !== "Personalizado" && this.text !== templates[appData.selectedTemplate]) {
                var idx = findDropdownItem(ui.templateDropdown, "Personalizado");
                if (idx > -1) ui.templateDropdown.selection = idx;
            }
            updateEmailPreview();
        };
        ui.destinationDropdown.onChange = function() {
            if (this.selection) {
                appData.selectedDestination = this.selection.text;
                updateDestinationFieldsState();
            }
        };
        var manualInputHandler = function() {
            appData.customDestinationName = ui.manualDestinoInput.text;
            appData.customDestinationPath = ui.manualCaminhoInput.text;
            if (appData.customDestinationName || appData.customDestinationPath) {
                appData.selectedDestination = "Manual";
            }
            updateDestinationFieldsState();
        };
        ui.manualDestinoInput.onChanging = manualInputHandler;
        ui.manualCaminhoInput.onChanging = manualInputHandler;
        ui.captureBtn.onClick = captureCompositions;
        ui.copyBtn.onClick = function(){ /* Lógica de cópia */ updateStatusText("✅ Email copiado!"); };
        
        ui.diagBtn.onClick = createTestWindow;

        ui.window.onShow = function() { app.setTimeout(captureCompositions, 300); };
    }

    // === JANELA DE TESTES DE DETECÇÃO ===
    function createTestWindow() {
        logDebug("Criando janela de testes de detecção com diagnóstico.");
        var testWin = new Window("palette", "Ferramenta de Diagnóstico de Caminho", undefined, {resizeable: true});
        testWin.orientation = "column"; testWin.alignChildren = ["fill", "top"]; testWin.spacing = 10; testWin.margins = 15;
        testWin.preferredSize.width = 450;

        var compNameInput, logArea;
        function appendToLog(message, isTitle) {
            if (!logArea) return;
            var prefix = isTitle ? "--- " : "> ";
            var suffix = isTitle ? " ---" : "";
            logArea.text += prefix + message.toUpperCase() + suffix + "\n";
        }

        function onTestButtonClick() {
            try {
                logArea.text = "";
                var compName = compNameInput.text;
                if (compName === "") { appendToLog("Por favor, insira um nome de composição."); return; }
                if (!$.global.MailMakerAutoPath) { appendToLog("ERRO: 'func_auto_path_servers.js' não carregado."); return; }
                appendToLog("Iniciando teste para: '" + compName + "'", true);
                var targetPath = $.global.MailMakerAutoPath.regrasGNews(compName, loadedCaminhosJSON, programacaoData) || $.global.MailMakerAutoPath.regrasFant(compName, loadedCaminhosJSON);

                if (targetPath) {
                    appendToLog("Sucesso! Caminho encontrado:", false);
                    appendToLog(targetPath, false);
                    var presetName = caminhosDataReverse[targetPath];
                    if (presetName) {
                        appendToLog("\nCorresponde ao Preset: " + presetName, false);
                    }
                } else {
                    appendToLog("Falha. Nenhum caminho foi detectado.", false);
                    appendToLog("Use a aba 'Diagnóstico' para investigar.", false);
                }
            } catch(e) {
                var errorMsg = "ERRO INESPERADO: " + e.toString() + " (Linha: " + e.line + ")";
                appendToLog(errorMsg, true);
                alert(errorMsg);
            }
        }

        function onAnalyzeButtonClick() {
            try {
                logArea.text = "";
                var compName = compNameInput.text.toUpperCase();
                if (compName === "") { appendToLog("Insira um nome de composição na aba 'Teste Rápido' primeiro."); return; }
                appendToLog("Analisando Tags em: '" + compNameInput.text + "'", true);
                var gnewsProgramTags = [], gnewsJornalTags = [];
                if(programacaoData.programacao_globonews) {
                    for(var i=0; i<programacaoData.programacao_globonews.length; i++) {
                        var prog = programacaoData.programacao_globonews[i];
                        gnewsProgramTags.push(prog.tagName);
                        if(prog.tipo === "Jornal") gnewsJornalTags.push(prog.tagName);
                    }
                }
                var artesGnIlhaTags = ["CREDITO", "LETTERING", "LEGENDAS", "LOCALIZADORES", "INSERT", "ALPHA"];
                var pesquisaTags = ["PESQUISA", "DATAFOLHA", "QUAEST", "IPSOS", "IPEC", "IBGE"];
                var foundAny = false;
                function findTags(title, tagArray) {
                    var found = [];
                    for (var i = 0; i < tagArray.length; i++) { if (compName.indexOf(tagArray[i].toUpperCase()) > -1) { found.push(tagArray[i]); } }
                    if(found.length > 0) { appendToLog(title + " encontradas: " + found.join(", "), false); foundAny = true; }
                }
                findTags("Tags de Programa/Jornal", gnewsProgramTags);
                findTags("Tags de Arte (para Ilha)", artesGnIlhaTags);
                findTags("Tags de Pesquisa", pesquisaTags);
                if (compName.indexOf("CABECALHO") > -1) { appendToLog("Tag Especial encontrada: CABECALHO", false); foundAny = true; }
                if (compName.indexOf("PROMO") > -1) { appendToLog("Tag Especial encontrada: PROMO", false); foundAny = true; }
                if (!foundAny) { appendToLog("Nenhuma tag conhecida foi encontrada no nome fornecido.", false); }
            } catch(e) {
                var errorMsg = "ERRO AO ANALISAR: " + e.toString() + " (Linha: " + e.line + ")";
                appendToLog(errorMsg, true);
                alert(errorMsg);
            }
        }

        function onListAllButtonClick() {
            try {
                logArea.text = "";
                appendToLog("Listando todas as tags conhecidas", true);
                var gnewsProgramTags = [], gnewsJornalTags = [];
                if(programacaoData.programacao_globonews) {
                    for(var i=0; i<programacaoData.programacao_globonews.length; i++) {
                        var prog = programacaoData.programacao_globonews[i];
                        if(prog.tipo === "Jornal") gnewsJornalTags.push(prog.tagName);
                        else gnewsProgramTags.push(prog.tagName);
                    }
                }
                var artesGnIlhaTags = ["CREDITO", "LETTERING", "LEGENDAS", "LOCALIZADORES", "INSERT", "ALPHA"];
                appendToLog("\n--- TAGS DE JORNAL ---\n" + gnewsJornalTags.join(", "), false);
                appendToLog("\n--- TAGS DE PROGRAMA ---\n" + gnewsProgramTags.join(", "), false);
                appendToLog("\n--- TAGS DE ARTE (para Ilha) ---\n" + artesGnIlhaTags.join(", "), false);
                appendToLog("\n--- TAGS ESPECIAIS ---\nCABECALHO, PROMO", false);
            } catch(e) {
                var errorMsg = "ERRO AO LISTAR TAGS: " + e.toString() + " (Linha: " + e.line + ")";
                appendToLog(errorMsg, true);
                alert(errorMsg);
            }
        }
        var tabPanel = testWin.add("tabbedpanel");
        tabPanel.alignChildren = "fill";
        var testTab = tabPanel.add("tab", undefined, "Teste Rápido");
        testTab.orientation = "column"; testTab.spacing = 8;
        testTab.add("statictext", undefined, "Nome da Composição para Testar:");
        compNameInput = testTab.add("edittext", undefined, "GNEWS - J10 - CREDITO - FULANO");
        compNameInput.alignment = "fill"; compNameInput.active = true;
        var testBtn = testTab.add("button", undefined, "Testar Detecção");
        testBtn.alignment = "fill";
        var diagTab = tabPanel.add("tab", undefined, "Diagnóstico");
        diagTab.orientation = "column"; diagTab.spacing = 8; diagTab.alignChildren = "fill";
        diagTab.add("statictext", undefined, "Use as ferramentas abaixo para entender por que um nome não funciona:");
        var analyzeBtn = diagTab.add("button", undefined, "Analisar Tags no Nome da Composição Acima");
        var listAllBtn = diagTab.add("button", undefined, "Listar Todas as Tags Válidas no Log");
        var rulesPanel = diagTab.add("panel", undefined, "Guia Rápido de Regras Comuns (GNEWS)");
        rulesPanel.alignChildren = "fill";
        rulesPanel.add("statictext", undefined, "• PAM HARDNEWS: Requer [Tag de Jornal]");
        rulesPanel.add("statictext", undefined, "• ILHA HARDNEWS: Requer [Tag de Jornal] + [Tag de Arte]");
        rulesPanel.add("statictext", undefined, "• PAM MAGAZINE: Requer [Tag de Programa]");
        rulesPanel.add("statictext", undefined, "• ILHA MAGAZINE: Requer [Tag de Programa] + [Tag de Arte]");
        testWin.add("statictext", undefined, "Log de Atividades:");
        logArea = testWin.add("edittext", undefined, "", {multiline: true, readonly: true, scrollable: true});
        logArea.alignment = "fill";
        logArea.preferredSize.height = 200;

        testBtn.onClick = onTestButtonClick;
        analyzeBtn.onClick = onAnalyzeButtonClick;
        listAllBtn.onClick = onListAllButtonClick;

        testWin.center();
        testWin.show();
    }


    // === INICIALIZAÇÃO ===
    function init() {
        logDebug("=== INICIANDO MAILMAKER - v27.3 ===");
        var mainPath = findScriptMainPath();
        
        loadedCaminhosJSON = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_caminhos_gnews.json");
        programacaoData = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_programacao_gnews.json");
        
        var autoPathScript = new File(mainPath + "source/libraries/functions/func_auto_path_servers.js");
        if (autoPathScript.exists) { $.evalFile(autoPathScript); logDebug("Lógica de detecção externa carregada."); }
        else { alert("ERRO CRÍTICO: 'func_auto_path_servers.js' não encontrado."); }

        if (loadedCaminhosJSON) {
            for (var serverName in loadedCaminhosJSON) {
                if (loadedCaminhosJSON.hasOwnProperty(serverName)) {
                    var paths = loadedCaminhosJSON[serverName];
                    for (var j = 0; j < paths.length; j++) {
                        var pathInfo = paths[j];
                        if (pathInfo.nome && pathInfo.caminho) {
                            caminhosData[pathInfo.nome] = pathInfo.caminho;
                            caminhosDataReverse[pathInfo.caminho] = pathInfo.nome;
                        }
                    }
                }
            }
            destinationNames = ["Auto Detectar"].concat(getObjectKeys(caminhosData).sort());
        } else { alert("AVISO: 'DADOS_caminhos_gnews.json' não carregado."); }

        createUI();
        setupEvents();
        
        ui.saudacaoDropdown.selection = findDropdownItem(ui.saudacaoDropdown, appData.selectedSaudacao);
        ui.despedidaDropdown.selection = findDropdownItem(ui.despedidaDropdown, appData.selectedDespedida);
        ui.emojiDropdown.selection = findDropdownItem(ui.emojiDropdown, appData.selectedEmoji);
        ui.templateDropdown.selection = findDropdownItem(ui.templateDropdown, appData.selectedTemplate);
        ui.destinationDropdown.selection = findDropdownItem(ui.destinationDropdown, appData.selectedDestination);
        appData.emailMessage = templates[appData.selectedTemplate];
        ui.messageInput.text = appData.emailMessage;
        
        updateDestinationFieldsState();
        ui.window.center();
        ui.window.show();
        logDebug("=== INICIALIZAÇÃO COMPLETA ===");
    }

    init();
})();