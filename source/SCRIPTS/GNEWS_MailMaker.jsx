/***************************************************
 * GNEWS MailMaker - VERSÃO (v37.0)
 * - Implementado o método de cópia exato fornecido pelo usuário,
 * utilizando arquivo temporário com codificação UTF-16.
 ***************************************************/

(function() {

    // === CONFIGURAÇÕES BÁSICAS ===
    var config = {
        windowTitle: "GNEWS MailMaker v37.0 - FINAL",
    };
    
    // === DADOS GLOBAIS ===
    var appData = { capturedCompNames: [], capturedEditorName: "", emailMessage: "", selectedSaudacao: "Oi", selectedDespedida: "Abs,", selectedEmoji: "🤟", selectedTemplate: "Padrão Simples", selectedDestination: null, customDestinationName: "", customDestinationPath: "" };
    
    // === VARIÁVEIS DE UI E DADOS EXTERNOS ===
    var ui = {};
    var caminhosData = {};
    var loadedCaminhosJSON = {};
    var programacaoData = {};
    var destinationNames = [];

    // === TEMPLATES E OPÇÕES ===
    var templates = { "Padrão Simples": "Segue arte.", "Detalhado": "Segue arte finalizada conforme briefing.\n\nQualquer dúvida, me avise!", "Revisão": "Segue arte com as correções solicitadas.\n\nPor favor, confirme se está tudo ok agora.", "Final": "Arte finalizada! 🎉\n\nArquivos prontos para produção.", "Urgente": "⚡ ARTE URGENTE ⚡\n\nSegue arte para aprovação imediata.", "Personalizado": "" };
    var templateNames = getObjectKeys(templates);
    var saudacoes = ["Oi", "Olá", "E aí", "Fala", "Salve", "Eae"];
    var despedidas = ["Abs,", "Abraços,", "Valeu,", "Falou,", "Até mais,", "Grande abraço,", "Att,", "Atenciosamente,"];
    var emojis = ["🤟", "👍", "✌️", "😊", "🙂", "💪", "🚀", "⚡", "🔥", "✨", "🎯", "📸"];

    // === CORES E TEMAS ===
    var COLORS = { 
        success: [0.2, 0.8, 0.2], error: [0.8, 0.2, 0.2], warning: [0.9, 0.7, 0.2], info: [0.2, 0.6, 0.9], neutral: [0.9, 0.9, 0.9],
    };
    var theme = {
        bgColor: [0.05, 0.04, 0.04, 1], normalColor: [1, 1, 1, 1], highlightColor: [0.83, 0, 0.23, 1]
    };

    // === FUNÇÕES UTILITÁRIAS ===
    function getObjectKeys(obj) { var keys = []; for (var key in obj) { if (obj.hasOwnProperty(key)) keys.push(key); } return keys; }
    function logDebug(message) { $.writeln("[MailMaker] " + message); }

    function setStatusColor(element, color) {
        try {
            if (element && element.graphics) {
                element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
            }
        } catch (e) { logDebug("Erro ao definir cor do status: " + e.toString()); }
    }

    function updateStatus(message, type) {
        if (!ui.statusText) return;
        var color = COLORS[type] || COLORS.neutral;
        ui.statusText.text = message;
        setStatusColor(ui.statusText, color);
        
        if (type === "success" || type === "info" || type === "warning") {
            app.setTimeout(function () {
                if (ui.statusText.text === message) { 
                    ui.statusText.text = "Pronto";
                    setStatusColor(ui.statusText, COLORS.neutral);
                }
            }, 5000);
        }
    }
    
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
    function findDropdownItem(dropdown, text) { for(var i = 0; i < dropdown.items.length; i++) { if (dropdown.items[i].text === text) return i; } return -1; }

    function isSecurityPrefEnabled() {
        try {
            var securitySetting = app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY");
            return (securitySetting === 1);
        } catch(e) {
            return false;
        }
    }

    // === LÓGICA PRINCIPAL ===

    // *** FUNÇÃO DE CÓPIA FORNECIDA PELO USUÁRIO ***
    function copyToClipboard(text) {
        var isWindows = $.os.indexOf('Windows') !== -1;
        var tempFilePath = Folder.temp.fullName + "/ae_clipboard_temp.txt";
        var file = new File(tempFilePath);
        var cmd;
    
        try {
            if (isWindows) {
                file.encoding = "UTF-16"; // Clip no Windows exige UTF-16 LE
            } else {
                file.encoding = "UTF-8";  // Mac aceita UTF-8
            }
    
            file.open("w");
            file.write(text);
            file.close();
    
            if (isWindows) {
                // Usa type no arquivo pra garantir multilinhas
                cmd = 'cmd /c type "' + file.fsName + '" | clip';
            } else {
                // Mac usa pbcopy
                cmd = 'cat "' + file.fsName + '" | pbcopy';
            }
    
            // Executa o comando
            system.callSystem(cmd);
        } finally {
            // Garante que o arquivo temporário seja removido
            if(file.exists) {
                file.remove();
            }
        }
    }
    
    function showMailMakerHelp() {
        var helpWin = new Window("dialog", "Ajuda - GNEWS MailMaker");
        helpWin.add("statictext", undefined, "Esta ferramenta automatiza a criação de e-mails para envio de artes.");
        helpWin.add("button", undefined, "Fechar", {name: "ok"});
        helpWin.show();
    }
    
    function chooseEditorDialog(editorNames) {
        var dialog = new Window("dialog", "Selecionar Editor Prioritário");
        dialog.orientation = "column"; dialog.alignChildren = "fill";
        dialog.graphics.backgroundColor = dialog.graphics.newBrush(dialog.graphics.BrushType.SOLID_COLOR, theme.bgColor);
        var instruction = dialog.add("statictext", undefined, "Múltiplos editores detectados. Escolha um:");
        setStatusColor(instruction, theme.normalColor);
        var list = dialog.add("dropdownlist", undefined, editorNames);
        list.selection = 0;
        var okButton = dialog.add("button", undefined, "OK");
        var selectedEditor = "";
        okButton.onClick = function() {
            selectedEditor = list.selection.text;
            dialog.close();
        }
        dialog.center();
        dialog.show();
        return selectedEditor;
    }

    function setDestination(name, path) {
        appData.customDestinationName = name;
        appData.customDestinationPath = path;
        ui.manualDestinoInput.text = name;
        ui.manualCaminhoInput.text = path;
        
        var dropdownIndex = findDropdownItem(ui.destinationDropdown, name);
        
        var originalOnChange = ui.destinationDropdown.onChange;
        ui.destinationDropdown.onChange = null; 
        
        if (dropdownIndex > -1) {
            ui.destinationDropdown.selection = dropdownIndex;
            appData.selectedDestination = name;
        } else {
            if (ui.destinationDropdown.selection) { ui.destinationDropdown.selection = null; }
            appData.selectedDestination = null;
        }
        
        ui.destinationDropdown.onChange = originalOnChange; 
        updateEmailPreview();
    }

    function processTemplateVariables(template) {
        var processed = template || "";
        processed = processed.replace(/\{editor\}/g, appData.capturedEditorName || "");
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
        var destinationName = appData.customDestinationName || "Nenhum Destino";
        var destinationPath = appData.customDestinationPath || "Selecione um preset ou use a detecção.";
        var destinoFormatted = "📁 " + destinationName.toUpperCase() + "\n    " + destinationPath;
        var compsFormatted = (appData.capturedCompNames.length === 0) ? "❌ NENHUMA COMP CAPTURADA" : (appData.capturedCompNames.length === 1) ? appData.capturedCompNames[0] : "    " + appData.capturedCompNames.join("\n    ");
        var emailCompleto = saudacaoCompleta + "\n\n" + finalMessage + "\n\n" + "Artes prontas no:\n" + destinoFormatted + "\n" + compsFormatted + "\n\n\n\n" + appData.selectedDespedida + " " + appData.selectedEmoji;
        ui.previewText.text = emailCompleto;
    }

    function captureCompositions() {
        if (!app.project) { updateStatus("❌ Nenhum projeto aberto", "error"); return false; }
        
        var selectedComps = app.project.selection;
        var compositions = [];
        var editorNames = [];

        for (var i = 0; i < selectedComps.length; i++) {
            if (selectedComps[i] instanceof CompItem) {
                compositions.push(selectedComps[i].name);
                var editor = extractEditorName(selectedComps[i].name);
                if (editor && editorNames.indexOf(editor) === -1) editorNames.push(editor);
            }
        }

        if (compositions.length === 0 && app.project.activeItem instanceof CompItem) {
            compositions.push(app.project.activeItem.name);
            var editorFromActive = extractEditorName(app.project.activeItem.name);
            if (editorFromActive && editorNames.indexOf(editorFromActive) === -1) editorNames.push(editorFromActive);
        }
        
        if (compositions.length === 0) { updateStatus("❌ Nenhuma composição selecionada", "error"); return false; }
        
        appData.capturedCompNames = compositions;
        
        if (editorNames.length > 1) {
            appData.capturedEditorName = chooseEditorDialog(editorNames) || editorNames[0];
        } else if (editorNames.length === 1) {
            appData.capturedEditorName = editorNames[0];
        } else {
            appData.capturedEditorName = "";
        }
        
        updateStatus(appData.capturedCompNames.length + " comp(s) capturada(s)", "success");
        return true;
    }
    
    function runAutoDetectionAndUpdateUI() {
        if (appData.capturedCompNames.length === 0) { updateStatus("⚠️ Capture uma comp primeiro.", "warning"); return; }
        if (!$.global.MailMakerAutoPath) { updateStatus("❌ Erro: Lógica de detecção não foi carregada.", "error"); return; }
        
        var compName = appData.capturedCompNames[0];
        updateStatus("Analisando '" + compName + "'...", "info");
        var detectionResult = $.global.MailMakerAutoPath.regrasGNews(compName, loadedCaminhosJSON, programacaoData, false) || $.global.MailMakerAutoPath.regrasFant(compName, loadedCaminhosJSON, programacaoData, false);

        if (detectionResult && detectionResult.nome) {
            setDestination(detectionResult.nome, detectionResult.caminho);
            updateStatus("✅ Destino detectado: " + detectionResult.nome, "success");
        } else {
            setDestination("", "");
            updateStatus("⚠️ Nenhum destino automático encontrado", "warning");
        }
    }

    function renderPreviewFrame() {
        if (!app.project) { updateStatus("❌ Nenhum projeto aberto.", "error"); return; }
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) { updateStatus("⚠️ Nenhuma composição ativa. Selecione uma.", "warning"); return; }

        app.beginUndoGroup("Render Preview Frame");
        try {
            if (!isSecurityPrefEnabled()) {
                alert("A função de preview precisa de permissão para salvar arquivos.\n\nPor favor, habilite a opção 'Allow Scripts to Write Files and Access Network' nas preferências de 'Scripting & Expressions'.");
                updateStatus("❌ Preview desabilitado por segurança.", "error");
                app.endUndoGroup();
                return;
            }

            if (typeof getPathDayByDay !== 'function') {
                updateStatus("❌ Erro: 'func_getPathDayByDay.js' não foi carregado.", "error");
                app.endUndoGroup();
                return;
            }

            updateStatus("Verificando caminhos...", "info");
            var basePath;
            var primaryPath = getPathDayByDay();
            var primaryFolder = new Folder(primaryPath);

            if (!primaryFolder.exists) {
                updateStatus("⚠️ Caminho do dia não encontrado. Usando pasta do projeto.", "warning");
                if (!app.project.file) {
                    alert("O projeto atual ainda não foi salvo. Por favor, salve o projeto para que o preview possa ser gerado na mesma pasta.");
                    updateStatus("❌ Salve o projeto para criar um preview.", "error");
                    app.endUndoGroup();
                    return;
                }
                basePath = app.project.file.path;
            } else {
                basePath = primaryPath;
            }
            
            var previewFolder = new Folder(basePath + "/_PREVIEWS");
            if (!previewFolder.exists) {
                if (!previewFolder.create()) {
                    updateStatus("❌ Não foi possível criar a pasta _PREVIEWS.", "error");
                    app.endUndoGroup();
                    return;
                }
            }
            
            var safeName = comp.name.replace(/[^\w\.\-]/g, '_');
            var outputFile = new File(previewFolder.fsName + "/" + safeName + "_PREVIEW.png");

            updateStatus("Renderizando preview PNG...", "info");
            comp.saveFrameToPng(comp.time, outputFile);
            updateStatus("✅ Preview salvo: " + decodeURI(outputFile.name), "success");
            
            if (previewFolder.exists) {
                previewFolder.execute();
            }

        } catch (e) {
            updateStatus("❌ Erro ao renderizar preview: " + e.message, "error");
            alert("Ocorreu um erro inesperado ao renderizar o preview:\n" + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }
    
    // === UI E EVENTOS ===
    function createUI() {
        ui.window = new Window("palette", config.windowTitle, undefined, { resizeable: true });
        var w = ui.window;
        w.orientation = "column"; w.alignChildren = ["fill", "fill"]; w.spacing = 5; w.margins = 15;
        w.graphics.backgroundColor = w.graphics.newBrush(w.graphics.BrushType.SOLID_COLOR, theme.bgColor);
        
        var mainColumnsGroup = w.add("group");
        mainColumnsGroup.orientation = "row"; mainColumnsGroup.alignChildren = ["top", "top"]; mainColumnsGroup.spacing = 10; mainColumnsGroup.alignment = "fill";
        var leftColumn = mainColumnsGroup.add("group");
        leftColumn.orientation = "column"; leftColumn.alignChildren = ["fill", "fill"]; leftColumn.spacing = 10;
        leftColumn.preferredSize.width = 100;
        var rightColumn = mainColumnsGroup.add("group");
        rightColumn.orientation = "column"; rightColumn.alignChildren = ["fill", "fill"]; rightColumn.spacing = 10; rightColumn.alignment = ["fill", "fill"];
        rightColumn.preferredSize.width = 400; 
        var leftHeaderGroup = leftColumn.add("group");
        leftHeaderGroup.orientation = "row"; leftHeaderGroup.alignChildren = ["left", "center"]; leftHeaderGroup.margins = [0, 0, 0, 10];
        var titleText = leftHeaderGroup.add("statictext", undefined, "GNEWS MailMaker", {truncate: 'end'});
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 15);
        setStatusColor(titleText, theme.highlightColor);
        var rightHeaderGroup = rightColumn.add("group");
        rightHeaderGroup.orientation = "row"; rightHeaderGroup.alignChildren = ["right", "center"]; rightHeaderGroup.alignment = "fill"; rightHeaderGroup.margins = [0, 0, 0, 10];
        
        var helpBtn;
        try {
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
                helpBtn = new themeIconButton(rightHeaderGroup, { icon: D9T_INFO_ICON, tips: ["Ajuda"] });
                helpBtn.leftClick.onClick = showMailMakerHelp;
            } else { throw new Error("Theme button not available"); }
        } catch(e) {
            helpBtn = rightHeaderGroup.add("button", undefined, "?");
            helpBtn.preferredSize = [25, 25]; helpBtn.helpTip = "Ajuda sobre o MailMaker";
            helpBtn.onClick = showMailMakerHelp;
        }

        var configPanel = leftColumn.add("panel", undefined, "📩 PERSONALIZAÇÃO DE EMAIL");
        configPanel.alignChildren = "fill"; configPanel.margins = 15; configPanel.spacing = 15; configPanel.alignment = 'fill'; 
        var greetingGroup = configPanel.add("group");
        var saudacaoSubGroup = greetingGroup.add("group", undefined);
        saudacaoSubGroup.add("statictext", undefined, "Saudação:");
        ui.saudacaoDropdown = saudacaoSubGroup.add("dropdownlist", undefined, saudacoes);
        ui.saudacaoDropdown.preferredSize.width = 60;
        var spacer1 = greetingGroup.add("group");
        spacer1.preferredSize.width = 5;
        var despedidaSubGroup = greetingGroup.add("group", undefined, {orientation: "column", alignChildren: "right"});
        despedidaSubGroup.add("statictext", undefined, "Despedida:");
        ui.despedidaDropdown = despedidaSubGroup.add("dropdownlist", undefined, despedidas);
        ui.despedidaDropdown.preferredSize.width = 80;
        var emojiSubGroup = greetingGroup.add("group", undefined, {orientation: "column", alignChildren: "right"});
        emojiSubGroup.add("statictext", undefined, "Emoji:");
        ui.emojiDropdown = emojiSubGroup.add("dropdownlist", undefined, emojis);
        ui.emojiDropdown.preferredSize.width = 60;
        var messagePanel = leftColumn.add("panel", undefined, "🔤 DESCRIÇÃO DO EMAIL");
        messagePanel.alignChildren = "fill"; messagePanel.margins = 15; messagePanel.spacing = 8;
        messagePanel.alignment = 'fill'; messagePanel.preferredSize.width = 30; 
        var templateLine = messagePanel.add("group");
        templateLine.orientation = "row";
        templateLine.add("statictext", undefined, "Template:");
        ui.templateDropdown = templateLine.add("dropdownlist", undefined, templateNames);
        ui.templateDropdown.alignment = "fill";
        ui.messageInput = messagePanel.add("edittext", undefined, "", { multiline: true, scrollable: true });
        ui.messageInput.alignment = "fill"; ui.messageInput.preferredSize.height = 60;
        var destPanel = leftColumn.add("panel", undefined, "📁 CONFIGURAÇÃO DE DESTINO");
        destPanel.alignChildren = "left"; destPanel.margins = 15; destPanel.spacing = 8;
        destPanel.alignment = 'fill';
        var presetLine = destPanel.add("group");
        presetLine.orientation = "row";
        presetLine.add("statictext", undefined, "Preset de Destino:");
        ui.destinationDropdown = presetLine.add("dropdownlist", undefined, destinationNames);
        ui.destinationDropdown.alignment = "fill"; ui.destinationDropdown.preferredSize.width = 150;
        var manualDestLine = destPanel.add("group");
        manualDestLine.orientation = "row"; manualDestLine.spacing = 17; 
        manualDestLine.add("statictext", undefined, "Destino Manual:");
        ui.manualDestinoInput = manualDestLine.add("edittext", undefined, "");
        ui.manualDestinoInput.alignment = "fill"; ui.manualDestinoInput.preferredSize.width = 298;
        var manualPathLine = destPanel.add("group");
        manualPathLine.orientation = "row";
        manualPathLine.add("statictext", undefined, "Caminho Manual:");
        ui.manualCaminhoInput = manualPathLine.add("edittext", undefined, "");
        ui.manualCaminhoInput.alignment = "fill"; ui.manualCaminhoInput.preferredSize.width = 298;
        var previewPanel = rightColumn.add("panel", undefined, "👁️ Pré-Visualização do Email");
        previewPanel.alignChildren = "fill"; previewPanel.margins = 15; previewPanel.alignment = ["fill", "fill"];
        ui.previewText = previewPanel.add("edittext", undefined, "", { multiline: true, readonly: true, scrollable: true });
        ui.previewText.alignment = "fill"; ui.previewText.preferredSize.height = 263;
        ui.previewText.graphics.font = ScriptUI.newFont("Courier New", 10);
        var buttonGroup = previewPanel.add("group");
        buttonGroup.orientation = "row"; buttonGroup.alignChildren = ["fill", "center"]; buttonGroup.spacing = 5;
        ui.captureBtn = buttonGroup.add("button", undefined, "🔘 Capturar");
        ui.detectBtn = buttonGroup.add("button", undefined, "🔎 Detectar");
        ui.previewBtn = buttonGroup.add("button", undefined, "🖼️ Preview");
        ui.copyBtn = buttonGroup.add("button", undefined, "📋 Copiar");
        ui.captureBtn.preferredSize.height = ui.detectBtn.preferredSize.height = ui.previewBtn.preferredSize.height = ui.copyBtn.preferredSize.height = 35;
        var statusPanel = w.add("panel", undefined, "Status");
        statusPanel.alignment = "fill"; statusPanel.margins = 10;
        var statusGroup = statusPanel.add("group");
        statusGroup.alignment = "fill"; statusGroup.orientation = "row";
        ui.statusText = statusGroup.add("statictext", undefined, "Inicializando...", {truncate: 'end'});
        ui.statusText.alignment = ['fill', 'center']; ui.statusText.justify = 'center';
        setStatusColor(ui.statusText, COLORS.neutral);

        ui.saudacaoDropdown.onChange = function() { if (this.selection) { appData.selectedSaudacao = this.selection.text; updateEmailPreview(); } };
        ui.despedidaDropdown.onChange = function() { if (this.selection) { appData.selectedDespedida = this.selection.text; updateEmailPreview(); } };
        ui.emojiDropdown.onChange = function() { if (this.selection) { appData.selectedEmoji = this.selection.text; updateEmailPreview(); } };
        ui.templateDropdown.onChange = function() {
            if (!this.selection) return;
            appData.selectedTemplate = this.selection.text;
            if (appData.selectedTemplate !== "Personalizado") { appData.emailMessage = templates[appData.selectedTemplate]; ui.messageInput.text = appData.emailMessage; }
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
                var selectedPreset = this.selection.text;
                var presetPath = caminhosData[selectedPreset] || "";
                setDestination(selectedPreset, presetPath);
            } else { setDestination("", ""); }
        };
        var manualInputHandler = function() { setDestination(ui.manualDestinoInput.text, ui.manualCaminhoInput.text); };
        ui.manualDestinoInput.onChanging = manualInputHandler;
        ui.manualCaminhoInput.onChanging = manualInputHandler;
        ui.captureBtn.onClick = function() { if (captureCompositions()) { updateEmailPreview(); } };
        ui.detectBtn.onClick = function() {
            if (captureCompositions()) {
                runAutoDetectionAndUpdateUI();
                updateEmailPreview();
            }
        };
        ui.previewBtn.onClick = renderPreviewFrame;
        
        ui.copyBtn.onClick = function() {
            try {
                if (!isSecurityPrefEnabled()) {
                    var errorMsg = "A função de cópia automática requer uma permissão do After Effects.\n\n" + "Por favor, vá em:\n" + "1. Edit > Preferences > Scripting & Expressions...\n" + "2. Marque a opção 'Allow Scripts to Write Files and Access Network'\n" + "3. Clique OK e tente novamente.";
                    alert(errorMsg, "Permissão Necessária");
                    updateStatus("❌ Cópia desabilitada por segurança.", "error");
                    return;
                }
                
                if (!ui || !ui.previewText) { throw new Error("Componente de texto não encontrado."); }

                var textToCopy = ui.previewText.text;
                if (!textToCopy) {
                    updateStatus("⚠️ Nada para copiar.", "warning");
                    return;
                }
                
                // Chamando a função de cópia solicitada
                copyToClipboard(textToCopy);
                
                updateStatus("✅ Email copiado para a área de transferência!", "success");

            } catch (e) {
                var detailedError = "Falha ao copiar o texto: " + e.toString();
                alert(detailedError);
                updateStatus("❌ Falha ao copiar.", "error");
            }
        };

        w.onShow = function() {
            if (captureCompositions()) {
                updateEmailPreview();
            } else {
                updateStatus("Pronto. Capture uma composição.", "info");
            }
        };
    }

    // === INICIALIZAÇÃO ===
    function init() {
        logDebug("=== INICIANDO MailMaker - v36.0 ===");
        var mainPath = findScriptMainPath();
        try {
            var globalsFile = new File(mainPath + "source/globals.js");
            if(globalsFile.exists) $.evalFile(globalsFile);
            var iconLibFile = new File(mainPath + "source/libraries/ICON lib.js");
            if(iconLibFile.exists) $.evalFile(iconLibFile);
            var uiFuncFile = new File(mainPath + "source/libraries/functions/UI_FUNC.js");
            if(uiFuncFile.exists) $.evalFile(uiFuncFile);
        } catch(e) { logDebug("Libs de UI não encontradas. Erro: " + e.toString()); }
        loadedCaminhosJSON = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_caminhos_gnews.json");
        programacaoData = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_programacao_gnews.json");
        var autoPathScript = new File(mainPath + "source/libraries/functions/func_auto_path_servers.js");
        if (autoPathScript.exists) { $.evalFile(autoPathScript); }
        else { alert("ERRO CRÍTICO: 'func_auto_path_servers.js' não encontrado."); return; }
        var getPathDayByDayScript = new File(mainPath + "source/libraries/functions/func_getPathDayByDay.js");
        if (getPathDayByDayScript.exists) { $.evalFile(getPathDayByDayScript); } 
        else { logDebug("AVISO: 'func_getPathDayByDay.js' não encontrado."); }
        if (loadedCaminhosJSON) {
            for (var serverName in loadedCaminhosJSON) {
                if (loadedCaminhosJSON.hasOwnProperty(serverName)) {
                    var paths = loadedCaminhosJSON[serverName];
                    for (var j = 0; j < paths.length; j++) {
                        var pathInfo = paths[j];
                        if (pathInfo.nome && pathInfo.caminho) { caminhosData[pathInfo.nome] = pathInfo.caminho; }
                    }
                }
            }
            destinationNames = getObjectKeys(caminhosData).sort();
        }
        createUI();
        ui.saudacaoDropdown.selection = findDropdownItem(ui.saudacaoDropdown, appData.selectedSaudacao);
        ui.despedidaDropdown.selection = findDropdownItem(ui.despedidaDropdown, appData.selectedDespedida);
        ui.emojiDropdown.selection = findDropdownItem(ui.emojiDropdown, appData.selectedEmoji);
        ui.templateDropdown.selection = findDropdownItem(ui.templateDropdown, appData.selectedTemplate);
        appData.emailMessage = templates[appData.selectedTemplate];
        ui.messageInput.text = appData.emailMessage;
        if (destinationNames.length > 0) {
            ui.destinationDropdown.selection = 0;
            ui.destinationDropdown.onChange();
        }
        updateEmailPreview();
        ui.window.center();
        ui.window.show();
        logDebug("=== INICIALIZAÇÃO COMPLETA ===");
    }

    init();
})();