/***************************************************
 * GNEWS MailMaker - VERSÃO (v37.7) - COPY FIXED
 * - Implementado método de cópia robusto para textos multilinhas
 * - Suporte aprimorado para caracteres especiais e Unicode
 * - Melhor tratamento de erros e fallbacks
 * - Sistema de salvamento e carregamento de preferências do usuário
 ***************************************************/

function launchMailMaker() {

    // === CONFIGURAÇÕES BÁSICAS ===
    var config = {
        windowTitle: "GNEWS MailMaker v37.7 - COPY FIXED",
        settingsFileName: "MailMaker_settings.json"
    };

    // === DETECÇÃO DE VERSÃO DO AFTER EFFECTS ===
    var aeVersion = parseFloat(app.version);
    var isLegacyAE = aeVersion < 22.0;
    
    // === CONFIGURAÇÃO DE UNICODE BASEADA NA VERSÃO ===
    var unicodeSymbols = {
        modern: {
            folder: "📂",
            email: "💬",
            config: "🔧",
            preview: "👁️",
            capture: "🔘",
            detect: "🔍",
            image: "🖼️",
            copy: "📋",
            success: "✅",
            warning: "⚠️",
            error: "❌",
            info: "ℹ️",
            celebration: "🎉",
            lightning: "⚡",
            fire: "🔥",
            sparkles: "✨",
            target: "🎯",
            camera: "📸",
            thumbsUp: "👍",
            peace: "✌️",
            smile: "😊",
            slightSmile: "🙂",
            muscle: "💪",
            rocket: "🚀",
            metalHorn: "🤟"
        },
        legacy: {
            folder: "[PASTA]",
            email: "[EMAIL]",
            config: "[CONFIG]",
            preview: "[PREVIEW]",
            capture: "[CAPTURAR]",
            detect: "[DETECTAR]",
            image: "[IMAGEM]",
            copy: "[COPIAR]",
            success: "[OK]",
            warning: "[AVISO]",
            error: "[ERRO]",
            info: "[INFO]",
            celebration: "*",
            lightning: "!",
            fire: "*",
            sparkles: "*",
            target: "*",
            camera: "[CAM]",
            thumbsUp: ":)",
            peace: "v",
            smile: ":)",
            slightSmile: ":)",
            muscle: "++",
            rocket: ">>",
            metalHorn: "\\m/"
        }
    };

    var symbols = isLegacyAE ? unicodeSymbols.legacy : unicodeSymbols.modern;
    
    // === CONFIGURAÇÃO DE FONTES ===
    var fontConfig = {
        modern: {
            defaultFont: "Arial Unicode MS",
            fallbackFont: "Segoe UI",
            size: 10,
            titleSize: 15
        },
        legacy: {
            defaultFont: "Arial",
            fallbackFont: "Times New Roman", 
            size: 9,
            titleSize: 14
        }
    };

    var currentFontConfig = isLegacyAE ? fontConfig.legacy : fontConfig.modern;
    
    // === DADOS GLOBAIS ===
    var appData = { 
        capturedCompNames: [], 
        capturedEditorName: "", 
        emailMessage: "", 
        selectedSaudacao: "Oi", 
        selectedDespedida: "Abs,", 
        selectedEmoji: symbols.metalHorn, 
        selectedTemplate: "Padrão Simples", 
        selectedDestination: null, 
        customDestinationName: "", 
        customDestinationPath: "", 
        showFullPath: true, 
        showTeamData: false 
    };
    
    // === VARIÁVEIS DE UI E DADOS EXTERNOS ===
    var ui = {};
    var caminhosData = {};
    var loadedCaminhosJSON = {};
    var programacaoData = {};
    var destinationNames = [];

    // === TEMPLATES E OPÇÕES ===
    var templates = { 
        "Padrão Simples": "Segue arte.", 
        "Detalhado": "Segue arte finalizada conforme briefing.\n\nQualquer dúvida, me avise!", 
        "Revisão": "Segue arte com as correções solicitadas.\n\nPor favor, confirme se está tudo ok agora.", 
        "Final": "Arte finalizada! " + symbols.celebration + "\n\nArquivos prontos para produção.", 
        "Urgente": symbols.lightning + " ARTE URGENTE " + symbols.lightning + "\n\nSegue arte para aprovação imediata.", 
        "Personalizado": "" 
    };
    var templateNames = getObjectKeys(templates);
    var saudacoes = ["Oi", "Olá", "E aí", "Fala", "Salve", "Eae"];
    var despedidas = ["Abs,", "Abraços,", "Valeu,", "Falou,", "Até mais,", "Grande abraço,", "Att,", "Atenciosamente,"];
    var emojis = [symbols.metalHorn, symbols.thumbsUp, symbols.peace, symbols.smile, symbols.slightSmile, symbols.muscle, symbols.rocket, symbols.lightning, symbols.fire, symbols.sparkles, symbols.target, symbols.camera];

    // === CORES E TEMAS ===
    var COLORS = { 
        success: [0.2, 0.8, 0.2], 
        error: [0.8, 0.2, 0.2], 
        warning: [0.9, 0.7, 0.2], 
        info: [0.2, 0.6, 0.9], 
        neutral: [0.9, 0.9, 0.9]
    };
    var theme = {
        bgColor: [0.05, 0.04, 0.04, 1], 
        normalColor: [1, 1, 1, 1], 
        highlightColor: [0.83, 0, 0.23, 1]
    };

    // === FUNÇÕES UTILITÁRIAS ===
    function getObjectKeys(obj) { 
        var keys = []; 
        for (var key in obj) { 
            if (obj.hasOwnProperty(key)) keys.push(key); 
        } 
        return keys; 
    }
    
    function logDebug(message) { 
        $.writeln("[MailMaker] " + message); 
    }

    function setStatusColor(element, color) {
        try {
            if (element && element.graphics) {
                element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
            }
        } catch (e) { 
            logDebug("Erro ao definir cor do status: " + e.toString()); 
        }
    }

    function updateStatus(message, type) {
        if (!ui.statusText) return;
        var color = COLORS[type] || COLORS.neutral;
        
        var symbolPrefix = "";
        switch(type) {
            case "success": symbolPrefix = symbols.success + " "; break;
            case "error": symbolPrefix = symbols.error + " "; break;
            case "warning": symbolPrefix = symbols.warning + " "; break;
            case "info": symbolPrefix = symbols.info + " "; break;
        }
        
        ui.statusText.text = symbolPrefix + message;
        setStatusColor(ui.statusText, color);
        
        if (type === "success" || type === "info" || type === "warning") {
            app.setTimeout(function () {
                if (ui.statusText.text === symbolPrefix + message) { 
                    ui.statusText.text = "Pronto";
                    setStatusColor(ui.statusText, COLORS.neutral);
                }
            }, 5000);
        }
    }

function setClipboard(str) {
    var isWindows = $.os.indexOf('Windows') !== -1;
    var tempFile = new File(Folder.temp.fsName + "/aemail_" + Date.now() + ".txt");

    try {
        // 1. Cria o arquivo temporário com o conteúdo do e-mail
        tempFile.encoding = "UTF-8";
        if (!tempFile.open("w")) {
            throw new Error("Não foi possível criar o arquivo temporário.");
        }
        
        // Adiciona BOM (Byte Order Mark) no Windows para garantir a leitura correta de UTF-8
        if (isWindows) {
            tempFile.write('\ufeff' + str);
        } else {
            tempFile.write(str);
        }
        tempFile.close();
        
        var cmd;
        var result;
        
        if (isWindows) {
            // 2. Utiliza exclusivamente o método PowerShell com .NET Framework.
            logDebug("Usando método de cópia dedicado via PowerShell + .NET");
            
            // Escapa as barras invertidas do caminho para o comando PowerShell
            var tempFilePath = tempFile.fsName.replace(/\\/g, '\\\\');
            
            // Comando único que carrega a biblioteca .NET e usa a área de transferência nativa do Windows
            cmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText([System.IO.File]::ReadAllText(\'' + tempFilePath + '\', [System.Text.Encoding]::UTF8))"';
            
            result = system.callSystem(cmd);
            
            // No Windows, um retorno vazio ("") ou nulo significa sucesso. Qualquer outra coisa é erro.
            if (result !== "" && result !== null) {
                 throw new Error("O comando PowerShell falhou. Causa provável: antivírus ou permissões de segurança do sistema.");
            }

        } else {
            // Método padrão para macOS é mantido
            logDebug("Usando método de cópia via pbcopy para macOS");
            cmd = 'cat "' + tempFile.fsName + '" | pbcopy';
            result = system.callSystem(cmd);
            
            if (result !== 0) {
                throw new Error("O comando 'pbcopy' falhou no macOS.");
            }
        }
        
        logDebug("Texto copiado com sucesso!");
        
    } catch (e) {
        logDebug("ERRO em setClipboard: " + e.toString());
        throw e; // Propaga o erro para ser exibido na UI
        
    } finally {
        // 3. Garante que o arquivo temporário seja sempre removido
        try {
            if (tempFile && tempFile.exists) {
                tempFile.remove();
            }
        } catch (cleanupError) {
            logDebug("Aviso: Não foi possível remover o arquivo temporário: " + cleanupError.toString());
        }
    }
}
    // === FUNÇÕES AUXILIARES ===
    function findScriptMainPath() {
        try {
            var aexPath = Folder.decode(app.path);
            var possiblePaths = ["/Scripts/GNEWS-D9-TOOLS/", "/Scripts/ScriptUI Panels/GNEWS-D9-TOOLS/"];
            for (var i = 0; i < possiblePaths.length; i++) {
                var folder = new Folder(aexPath + possiblePaths[i]);
                if (folder.exists) { return folder.fsName + "/"; }
            }
            var scriptPath = new File($.fileName).parent;
            while (scriptPath && scriptPath.name !== "GNEWS-D9-TOOLS") { 
                scriptPath = scriptPath.parent; 
            }
            if (scriptPath && scriptPath.exists) { 
                return scriptPath.fsName + "/"; 
            }
        } catch (e) {}
        return new File($.fileName).parent.fsName + "/";
    }

    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) { 
            logDebug("Erro: Arquivo JSON não encontrado: " + filePath); 
            return null; 
        }
        try {
            file.encoding = "UTF-8"; 
            file.open("r"); 
            var content = file.read(); 
            file.close();
            return content ? eval("(" + content + ")") : null;
        } catch (e) { 
            alert("Erro de formatação no arquivo JSON: " + filePath + "\n\n" + e.toString()); 
            return null; 
        }
    }
    
    function getGreeting() { 
        var hour = new Date().getHours(); 
        if (hour < 12) return "bom dia"; 
        if (hour < 18) return "boa tarde"; 
        return "boa noite"; 
    }
    
    function toTitleCase(str) { 
        return str.replace(/\w\S*/g, function(txt) { 
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); 
        }); 
    }
    
    function findDropdownItem(dropdown, text) { 
        for(var i = 0; i < dropdown.items.length; i++) { 
            if (dropdown.items[i].text === text) return i; 
        } 
        return -1; 
    }

    function isSecurityPrefEnabled() {
        try {
            var securitySetting = app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY");
            return (securitySetting === 1);
        } catch(e) {
            return false;
        }
    }

    // === LÓGICA DE PREFERÊNCIAS ===
    function getSettingsFilePath() {
        var settingsFolder = new Folder(Folder.userData.fsName + "/After Effects/ScriptUI Panels/GNEWS-D9-TOOLS/");
        if (!settingsFolder.exists) settingsFolder.create();
        return new File(settingsFolder.fsName + "/" + config.settingsFileName);
    }

    function saveSettings() {
        try {
            var settingsFile = getSettingsFilePath();
            var settingsObj = {
                saudacao: appData.selectedSaudacao,
                despedida: appData.selectedDespedida,
                emoji: appData.selectedEmoji,
                template: appData.selectedTemplate,
                emailMessage: appData.emailMessage,
                showFullPath: appData.showFullPath,
                showTeamData: appData.showTeamData
            };

            settingsFile.encoding = "UTF-8";
            if (settingsFile.open("w")) {
                settingsFile.write(JSON.stringify(settingsObj, null, 2));
                settingsFile.close();
                logDebug("Preferências salvas com sucesso: " + JSON.stringify(settingsObj));
                updateStatus("Preferências salvas", "success");
            } else {
                logDebug("Erro: Não foi possível abrir o arquivo de configurações para escrita.");
                updateStatus("Erro ao salvar preferências", "warning");
            }
        } catch(e) { 
            logDebug("Erro ao salvar configurações: " + e.toString()); 
            updateStatus("Erro ao salvar preferências", "error");
        }
    }

    function loadSettings() {
        try {
            var settingsFile = getSettingsFilePath();
            if (settingsFile.exists) {
                settingsFile.encoding = "UTF-8";
                settingsFile.open("r");
                var content = settingsFile.read();
                settingsFile.close();
                if (content) {
                    var loaded = JSON.parse(content);
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
                    logDebug("Preferências carregadas: " + JSON.stringify(loaded));
                }
            }
        } catch(e) { 
            logDebug("Erro ao carregar configurações: " + e.toString()); 
        }
    }

    // === LÓGICA PRINCIPAL ===
    function showMailMakerHelp() {
        var helpWin = new Window("dialog", "Ajuda - GNEWS MailMaker");
        helpWin.add("statictext", undefined, "Esta ferramenta automatiza a criação de e-mails para envio de artes.");
        helpWin.add("button", undefined, "Fechar", {name: "ok"});
        helpWin.show();
    }
    
    function chooseEditorDialog(editorNames) {
        var dialog = new Window("dialog", "Selecionar Editor Prioritário");
        dialog.orientation = "column"; 
        dialog.alignChildren = "fill";
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
        };
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
            if (ui.destinationDropdown.selection) { 
                ui.destinationDropdown.selection = null; 
            }
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

    function generateTeamData() {
        var teamDataText = "";
        var hasProject = false;
        var hasRenderQueue = false;
        var hasMediaEncoder = false;
        
        try {
            if (app.project && app.project.file) {
                var projectPath = app.project.file.fsName;
                var projectName = app.project.file.name.replace(/\.(aep|aet)$/i, "");
                hasProject = true;
                
                teamDataText += "Dados para equipe:\n";
                teamDataText += "PROJETO SALVO:\n";
                teamDataText += projectPath + "\n";
                teamDataText += projectName + "\n";
                
                var renderQueue = app.project.renderQueue;
                var renderPaths = [];
                
                if (renderQueue.numItems > 0) {
                    for (var i = 1; i <= renderQueue.numItems; i++) {
                        var item = renderQueue.item(i);
                        if (item.numOutputModules > 0) {
                            var outputModule = item.outputModule(1);
                            var outputPath = outputModule.file;
                            if (outputPath) {
                                renderPaths.push(outputPath.fsName);
                            }
                        }
                    }
                }
                
                if (renderPaths.length > 0) {
                    hasRenderQueue = true;
                    teamDataText += "RENDER QUEUE:\n";
                    for (var r = 0; r < renderPaths.length; r++) {
                        teamDataText += renderPaths[r] + "\n";
                    }
                } else {
                    teamDataText += "RENDER QUEUE:\n";
                    teamDataText += "[Nenhum item na fila de render]\n";
                }
                
                try {
                    var bt = new BridgeTalk();
                    bt.target = "ame";
                    
                    var ameScript = '(function() {' +
                        'try {' +
                            'var encoder = app.encoder;' +
                            'var queueItems = [];' +
                            'for (var i = 0; i < encoder.getQueuedItemCount(); i++) {' +
                                'var item = encoder.getQueuedItem(i);' +
                                'if (item && item.outputPath) {' +
                                    'queueItems.push(item.outputPath);' +
                                '}' +
                            '}' +
                            'return queueItems.join("|");' +
                        '} catch(e) {' +
                            'return "ERROR:" + e.toString();' +
                        '}' +
                    '})()';
                    
                    bt.body = ameScript;
                    bt.onResult = function(result) {
                        if (result.body && result.body !== "" && !result.body.indexOf("ERROR:") === 0) {
                            var amePaths = result.body.split("|");
                            if (amePaths.length > 0 && amePaths[0] !== "") {
                                hasMediaEncoder = true;
                                teamDataText += "MEDIA ENCODER:\n";
                                for (var a = 0; a < amePaths.length; a++) {
                                    if (amePaths[a].trim() !== "") {
                                        teamDataText += amePaths[a] + "\n";
                                    }
                                }
                            } else {
                                teamDataText += "MEDIA ENCODER:\n";
                                teamDataText += "[Nenhum item na fila do Media Encoder]\n";
                            }
                        } else {
                            teamDataText += "MEDIA ENCODER:\n";
                            teamDataText += "[Não foi possível verificar o Media Encoder]\n";
                        }
                        updateEmailPreview();
                    };
                    
                    bt.onError = function(error) {
                        teamDataText += "MEDIA ENCODER:\n";
                        teamDataText += "[Media Encoder não disponível ou fechado]\n";
                        updateEmailPreview();
                    };
                    
                    bt.timeout = 3000;
                    bt.send();
                    
                } catch (ameError) {
                    teamDataText += "MEDIA ENCODER:\n";
                    teamDataText += "[Media Encoder não disponível]\n";
                }
                
            } else {
                teamDataText += "Dados para equipe:\n";
                teamDataText += "PROJETO SALVO:\n";
                teamDataText += "[Projeto não foi salvo]";
            }
            
            if (!hasProject) {
                updateStatus("Projeto não foi salvo - dados da equipe incompletos", "warning");
            } else if (!hasRenderQueue && !hasMediaEncoder) {
                updateStatus("Nenhum render encontrado - verifique Render Queue e Media Encoder", "warning");
            } else if (!hasRenderQueue) {
                updateStatus("Render Queue vazio - verificando apenas Media Encoder", "info");
            }
            
        } catch (e) {
            logDebug("Erro ao gerar dados da equipe: " + e.toString());
            teamDataText = "Dados para equipe:\n[Erro ao obter informações do projeto]";
            updateStatus("Erro ao obter dados da equipe", "error");
        }
        
        return teamDataText;
    }

    function updateEmailPreview() {
        if (!ui.previewText) return;
        var saudacaoCompleta = (appData.capturedEditorName) ? appData.selectedSaudacao + " " + appData.capturedEditorName + ", " + getGreeting() + "." : appData.selectedSaudacao + ", " + getGreeting() + ".";
        var finalMessage = processTemplateVariables(appData.emailMessage);
        var destinationName = appData.customDestinationName || "Nenhum Destino";
        var destinationPath = appData.customDestinationPath || "Selecione um preset ou use a detecção.";
        
        var destinoFormatted;
        if (appData.showFullPath) {
            destinoFormatted = symbols.folder + " " + destinationName.toUpperCase() + "\n    " + destinationPath;
        } else {
            destinoFormatted = symbols.folder + " " + destinationName.toUpperCase();
        }
        
        var cleanedCompNames = [];
        for (var i = 0; i < appData.capturedCompNames.length; i++) {
            var cleanName = appData.capturedCompNames[i].replace(/_/g, " ");
            cleanedCompNames.push(cleanName);
        }
        
        var compsFormatted = (cleanedCompNames.length === 0) ? symbols.error + " NENHUMA COMP CAPTURADA" : (cleanedCompNames.length === 1) ? cleanedCompNames[0] : "    " + cleanedCompNames.join("\n    ");
        
        var emailCompleto = saudacaoCompleta + "\n\n" + finalMessage + "\n\n" + "Artes prontas no:\n" + destinoFormatted + "\n" + compsFormatted + "\n\n";
        
        if (appData.showTeamData) {
            var teamData = generateTeamData();
            emailCompleto += teamData + "\n\n";
        }
        
        emailCompleto += "\n\n" + appData.selectedDespedida + " " + appData.selectedEmoji;
        
        ui.previewText.text = emailCompleto;
    }

    function captureCompositions() {
        if (!app.project) { 
            updateStatus("Nenhum projeto aberto", "error"); 
            return false; 
        }
        
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
        
        if (compositions.length === 0) { 
            updateStatus("Nenhuma composição selecionada", "error"); 
            return false; 
        }
        
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
        if (appData.capturedCompNames.length === 0) { 
            updateStatus("Capture uma comp primeiro.", "warning"); 
            return; 
        }
        if (!$.global.MailMakerAutoPath) { 
            updateStatus("Erro: Lógica de detecção não foi carregada.", "error"); 
            return; 
        }
        
        var compName = appData.capturedCompNames[0];
        updateStatus("Analisando '" + compName + "'...", "info");
        var detectionResult = $.global.MailMakerAutoPath.regrasGNews(compName, loadedCaminhosJSON, programacaoData, false) || $.global.MailMakerAutoPath.regrasFant(compName, loadedCaminhosJSON, programacaoData, false);

        if (detectionResult && detectionResult.nome) {
            setDestination(detectionResult.nome, detectionResult.caminho);
            updateStatus("Destino detectado: " + detectionResult.nome, "success");
        } else {
            setDestination("", "");
            updateStatus("Nenhum destino automático encontrado", "warning");
        }
    }

    function renderPreviewFrame() {
        if (!app.project) { 
            updateStatus("Nenhum projeto aberto.", "error"); 
            return; 
        }

        // Verifica se há composições capturadas para preview múltiplo
        var compsToPreview = [];
        if (appData.capturedCompNames.length > 0) {
            // Usa as composições capturadas
            for (var i = 0; i < appData.capturedCompNames.length; i++) {
                var compName = appData.capturedCompNames[i];
                for (var j = 1; j <= app.project.numItems; j++) {
                    var item = app.project.item(j);
                    if (item instanceof CompItem && item.name === compName) {
                        compsToPreview.push(item);
                        break;
                    }
                }
            }
        } else {
            // Se não há composições capturadas, usa apenas a ativa
            var activeComp = app.project.activeItem;
            if (!(activeComp && activeComp instanceof CompItem)) { 
                updateStatus("Nenhuma composição ativa. Capture composições ou selecione uma.", "warning"); 
                return; 
            }
            compsToPreview.push(activeComp);
        }

        if (compsToPreview.length === 0) {
            updateStatus("Nenhuma composição encontrada para preview.", "warning");
            return;
        }

        app.beginUndoGroup("Render Preview Frames");
        var successCount = 0;
        var errorCount = 0;
        
        try {
            if (!isSecurityPrefEnabled()) {
                alert("A função de preview precisa de permissão para salvar arquivos.\n\nPor favor, habilite a opção 'Allow Scripts to Write Files and Access Network' nas preferências de 'Scripting & Expressions'.");
                updateStatus("Preview desabilitado por segurança.", "error");
                app.endUndoGroup();
                return;
            }

            if (typeof getPathDayByDay !== 'function') {
                updateStatus("Erro: 'func_getPathDayByDay.js' não foi carregado.", "error");
                app.endUndoGroup();
                return;
            }

            updateStatus("Verificando caminhos...", "info");
            var basePath;
            var primaryPath = getPathDayByDay();
            var primaryFolder = new Folder(primaryPath);

            if (!primaryFolder.exists) {
                updateStatus("Caminho do dia não encontrado. Usando pasta do projeto.", "warning");
                if (!app.project.file) {
                    alert("O projeto atual ainda não foi salvo. Por favor, salve o projeto para que o preview possa ser gerado na mesma pasta.");
                    updateStatus("Salve o projeto para criar um preview.", "error");
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
                    updateStatus("Não foi possível criar a pasta _PREVIEWS.", "error");
                    app.endUndoGroup();
                    return;
                }
            }
            
            // Processa cada composição
            for (var c = 0; c < compsToPreview.length; c++) {
                var comp = compsToPreview[c];
                
                try {
                    updateStatus("Renderizando preview " + (c + 1) + "/" + compsToPreview.length + ": " + comp.name, "info");
                    
                    // Remove underscores e caracteres especiais, substitui por espaços
                    var safeName = comp.name
                        .replace(/_/g, ' ')                    // Underscores viram espaços
                        .replace(/[^\w\s\.\-]/g, ' ')          // Caracteres especiais viram espaços
                        .replace(/\s+/g, ' ')                  // Múltiplos espaços viram um só
                        .trim();                               // Remove espaços das bordas
                    
                    var outputFile = new File(previewFolder.fsName + "/" + safeName + " PREVIEW.png");
                    
                    // Salva o frame atual da composição
                    comp.saveFrameToPng(comp.time, outputFile);
                    successCount++;
                    
                } catch (compError) {
                    logDebug("Erro ao renderizar preview da composição '" + comp.name + "': " + compError.toString());
                    errorCount++;
                }
            }
            
            // Status final baseado nos resultados
            if (successCount > 0 && errorCount === 0) {
                updateStatus("Todos os " + successCount + " previews salvos com sucesso!", "success");
            } else if (successCount > 0 && errorCount > 0) {
                updateStatus(successCount + " previews salvos, " + errorCount + " falharam", "warning");
            } else {
                updateStatus("Falha ao salvar todos os previews", "error");
            }
            
            // Abre a pasta se houver pelo menos um sucesso
            if (successCount > 0 && previewFolder.exists) {
                previewFolder.execute();
            }

        } catch (e) {
            updateStatus("Erro ao renderizar previews: " + e.message, "error");
            alert("Ocorreu um erro inesperado ao renderizar os previews:\n" + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }
    
    // === UI E EVENTOS ===
    function createUI() {
        ui.window = new Window("palette", config.windowTitle, undefined, { resizeable: true });
        var w = ui.window;
        w.orientation = "column"; 
        w.alignChildren = ["fill", "fill"]; 
        w.spacing = 5; 
        w.margins = 15;
        w.graphics.backgroundColor = w.graphics.newBrush(w.graphics.BrushType.SOLID_COLOR, theme.bgColor);
        
        var mainColumnsGroup = w.add("group");
        mainColumnsGroup.orientation = "row"; 
        mainColumnsGroup.alignChildren = ["top", "top"]; 
        mainColumnsGroup.spacing = 10; 
        mainColumnsGroup.alignment = "fill";
        
        var leftColumn = mainColumnsGroup.add("group");
        leftColumn.orientation = "column"; 
        leftColumn.alignChildren = ["fill", "fill"]; 
        leftColumn.spacing = 10;
        leftColumn.preferredSize.width = 100;
        
        var rightColumn = mainColumnsGroup.add("group");
        rightColumn.orientation = "column"; 
        rightColumn.alignChildren = ["fill", "fill"]; 
        rightColumn.spacing = 10; 
        rightColumn.alignment = ["fill", "fill"];
        rightColumn.preferredSize.width = 400; 
        
        var leftHeaderGroup = leftColumn.add("group");
        leftHeaderGroup.orientation = "row"; 
        leftHeaderGroup.alignChildren = ["left", "center"]; 
        leftHeaderGroup.margins = [0, 0, 0, 10];
        
        var titleText = leftHeaderGroup.add("statictext", undefined, "GNEWS MailMaker", {truncate: 'end'});
        try {
            titleText.graphics.font = ScriptUI.newFont(currentFontConfig.defaultFont, "Bold", currentFontConfig.titleSize);
        } catch (e) {
            titleText.graphics.font = ScriptUI.newFont(currentFontConfig.fallbackFont, "Bold", currentFontConfig.titleSize);
        }
        setStatusColor(titleText, theme.highlightColor);
        
        var rightHeaderGroup = rightColumn.add("group");
        rightHeaderGroup.orientation = "row"; 
        rightHeaderGroup.alignChildren = ["right", "center"]; 
        rightHeaderGroup.alignment = "fill"; 
        rightHeaderGroup.margins = [0, 0, 0, 10];
        
        var helpBtn;
        try {
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
                helpBtn = new themeIconButton(rightHeaderGroup, { icon: D9T_INFO_ICON, tips: ["Ajuda"] });
                helpBtn.leftClick.onClick = showMailMakerHelp;
            } else { 
                throw new Error("Theme button not available"); 
            }
        } catch(e) {
            helpBtn = rightHeaderGroup.add("button", undefined, "?");
            helpBtn.preferredSize = [25, 25]; 
            helpBtn.helpTip = "Ajuda sobre o MailMaker";
            helpBtn.onClick = showMailMakerHelp;
        }

        var configPanel = leftColumn.add("panel", undefined, symbols.config + " PERSONALIZAÇÃO DE EMAIL");
        configPanel.alignChildren = "fill"; 
        configPanel.margins = 15; 
        configPanel.spacing = 15; 
        configPanel.alignment = 'fill'; 
        
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
        
        var messagePanel = leftColumn.add("panel", undefined, symbols.email + " DESCRIÇÃO DO EMAIL");
        messagePanel.alignChildren = "fill"; 
        messagePanel.margins = 15; 
        messagePanel.spacing = 8;
        messagePanel.alignment = 'fill'; 
        messagePanel.preferredSize.width = 30; 
        
        var templateLine = messagePanel.add("group");
        templateLine.orientation = "row"; 
        templateLine.spacing = 10;
        templateLine.add("statictext", undefined, "Template:");
        ui.templateDropdown = templateLine.add("dropdownlist", undefined, templateNames);
        ui.templateDropdown.alignment = "fill";
        
        // Adiciona checkbox para exibir caminho completo ao lado do template
        ui.showPathCheckbox = templateLine.add("checkbox", undefined, "Caminho");
        ui.showPathCheckbox.value = true; // Padrão: ligado
        ui.showPathCheckbox.helpTip = "Exibe o caminho completo na pré-visualização do email";
        
        ui.messageInput = messagePanel.add("edittext", undefined, "", { multiline: true, scrollable: true });
        ui.messageInput.alignment = "fill"; 
        ui.messageInput.preferredSize.height = 60;
        
        var destPanel = leftColumn.add("panel", undefined, symbols.folder + " CONFIGURAÇÃO DE DESTINO");
        destPanel.alignChildren = "left"; 
        destPanel.margins = 15; 
        destPanel.spacing = 8;
        destPanel.alignment = 'fill';
        
        var presetLine = destPanel.add("group");
        presetLine.orientation = "row"; 
        presetLine.spacing = 10;
        presetLine.add("statictext", undefined, "Preset de Destino:");
        ui.destinationDropdown = presetLine.add("dropdownlist", undefined, destinationNames);
        ui.destinationDropdown.alignment = "fill"; 
        ui.destinationDropdown.preferredSize.width = 150;
        
        // Adiciona checkbox para dados da equipe ao lado do preset
        ui.showTeamDataCheckbox = presetLine.add("checkbox", undefined, "Dados para Equipe");
        ui.showTeamDataCheckbox.value = false; // Padrão: desligado
        ui.showTeamDataCheckbox.helpTip = "Inclui informações do projeto e render no email";
        
        var manualDestLine = destPanel.add("group");
        manualDestLine.orientation = "row"; 
        manualDestLine.spacing = 17; 
        manualDestLine.add("statictext", undefined, "Destino Manual:");
        ui.manualDestinoInput = manualDestLine.add("edittext", undefined, "");
        ui.manualDestinoInput.alignment = "fill"; 
        ui.manualDestinoInput.preferredSize.width = 298;
        
        var manualPathLine = destPanel.add("group");
        manualPathLine.orientation = "row";
        manualPathLine.add("statictext", undefined, "Caminho Manual:");
        ui.manualCaminhoInput = manualPathLine.add("edittext", undefined, "");
        ui.manualCaminhoInput.alignment = "fill"; 
        ui.manualCaminhoInput.preferredSize.width = 298;
        
        var previewPanel = rightColumn.add("panel", undefined, symbols.preview + " Pré-Visualização do Email");
        previewPanel.alignChildren = "fill"; 
        previewPanel.margins = 15; 
        previewPanel.alignment = ["fill", "fill"];
        
        ui.previewText = previewPanel.add("edittext", undefined, "", { multiline: true, readonly: true, scrollable: true });
        ui.previewText.alignment = "fill"; 
        ui.previewText.preferredSize.height = 263;
        try {
            ui.previewText.graphics.font = ScriptUI.newFont(currentFontConfig.defaultFont, currentFontConfig.size);
        } catch (e) {
            ui.previewText.graphics.font = ScriptUI.newFont(currentFontConfig.fallbackFont, currentFontConfig.size);
        }
        
        var buttonGroup = previewPanel.add("group");
        buttonGroup.orientation = "row"; 
        buttonGroup.alignChildren = ["fill", "center"]; 
        buttonGroup.spacing = 5;
        
        ui.captureBtn = buttonGroup.add("button", undefined, symbols.capture + " Capturar");
        ui.detectBtn = buttonGroup.add("button", undefined, symbols.detect + " Detectar");
        ui.previewBtn = buttonGroup.add("button", undefined, symbols.image + " Preview");
        ui.copyBtn = buttonGroup.add("button", undefined, symbols.copy + " Copiar");
        ui.captureBtn.preferredSize.height = ui.detectBtn.preferredSize.height = ui.previewBtn.preferredSize.height = ui.copyBtn.preferredSize.height = 35;
        
        var statusPanel = w.add("panel", undefined, "Status");
        statusPanel.alignment = "fill"; 
        statusPanel.margins = 10;
        
        var statusGroup = statusPanel.add("group");
        statusGroup.alignment = "fill"; 
        statusGroup.orientation = "row";
        
        ui.statusText = statusGroup.add("statictext", undefined, "Inicializando...", {truncate: 'end'});
        ui.statusText.alignment = ['fill', 'center']; 
        ui.statusText.justify = 'center';
        setStatusColor(ui.statusText, COLORS.neutral);

        w.onClose = function() {
            saveSettings();
        };

        // === EVENTOS DOS DROPDOWNS COM SALVAMENTO AUTOMÁTICO ===
        ui.saudacaoDropdown.onChange = function() { 
            if (this.selection) { 
                appData.selectedSaudacao = this.selection.text; 
                updateEmailPreview(); 
                saveSettings(); // Salva automaticamente
            } 
        };
        
        ui.despedidaDropdown.onChange = function() { 
            if (this.selection) { 
                appData.selectedDespedida = this.selection.text; 
                updateEmailPreview(); 
                saveSettings(); // Salva automaticamente
            } 
        };
        
        ui.emojiDropdown.onChange = function() { 
            if (this.selection) { 
                appData.selectedEmoji = this.selection.text; 
                updateEmailPreview(); 
                saveSettings(); // Salva automaticamente
            } 
        };
        
        ui.templateDropdown.onChange = function() {
            if (!this.selection) return;
            appData.selectedTemplate = this.selection.text;
            if (appData.selectedTemplate !== "Personalizado") { 
                appData.emailMessage = templates[appData.selectedTemplate]; 
                ui.messageInput.text = appData.emailMessage; 
            }
            updateEmailPreview();
            saveSettings(); // Salva automaticamente
        };
        
        // Evento para o campo de mensagem personalizada
        ui.messageInput.onChanging = function() {
            appData.emailMessage = this.text;
            if (appData.selectedTemplate !== "Personalizado" && this.text !== templates[appData.selectedTemplate]) {
                var idx = findDropdownItem(ui.templateDropdown, "Personalizado");
                if (idx > -1) {
                    ui.templateDropdown.selection = idx;
                    appData.selectedTemplate = "Personalizado";
                }
            }
            updateEmailPreview();
            // Delay para salvar após parar de digitar
            if (ui.messageInput.saveTimer) {
                clearTimeout(ui.messageInput.saveTimer);
            }
            ui.messageInput.saveTimer = app.setTimeout(function() {
                saveSettings();
            }, 1000); // Salva 1 segundo após parar de digitar
        };

        // Evento para o checkbox de caminho
        ui.showPathCheckbox.onClick = function() {
            appData.showFullPath = this.value;
            updateEmailPreview();
            saveSettings(); // Salva automaticamente
        };

        // Evento para o checkbox de dados da equipe
        ui.showTeamDataCheckbox.onClick = function() {
            appData.showTeamData = this.value;
            updateEmailPreview();
            saveSettings(); // Salva automaticamente
        };

        ui.destinationDropdown.onChange = function() {
            if (this.selection) {
                var selectedPreset = this.selection.text;
                var presetPath = caminhosData[selectedPreset] || "";
                setDestination(selectedPreset, presetPath);
            } else { 
                setDestination("", ""); 
            }
        };
        
        var manualInputHandler = function() { 
            setDestination(ui.manualDestinoInput.text, ui.manualCaminhoInput.text); 
        };
        ui.manualDestinoInput.onChanging = manualInputHandler;
        ui.manualCaminhoInput.onChanging = manualInputHandler;
        
        ui.captureBtn.onClick = function() { 
            if (captureCompositions()) { 
                updateEmailPreview(); 
            } 
        };
        
        ui.detectBtn.onClick = function() {
            if (captureCompositions()) {
                runAutoDetectionAndUpdateUI();
                updateEmailPreview();
            }
        };
        
        ui.previewBtn.onClick = renderPreviewFrame;
        
        ui.copyBtn.onClick = function() {
            try {
                // Verifica se a permissão de segurança está habilitada
                if (!isSecurityPrefEnabled()) {
                    var errorMsg = "A função de cópia automática requer uma permissão do After Effects.\n\n" + 
                                  "Por favor, vá em:\n" + 
                                  "1. Edit > Preferences > Scripting & Expressions...\n" + 
                                  "2. Marque a opção 'Allow Scripts to Write Files and Access Network'\n" + 
                                  "3. Clique OK e tente novamente.";
                    alert(errorMsg, "Permissão Necessária");
                    updateStatus("Cópia desabilitada por segurança.", "error");
                    return;
                }
                
                // Verifica se existe conteúdo para copiar
                if (!ui || !ui.previewText) { 
                    throw new Error("Componente de texto não encontrado."); 
                }

                var textToCopy = ui.previewText.text;
                if (!textToCopy || textToCopy.trim() === "") {
                    updateStatus("Nada para copiar.", "warning");
                    return;
                }
                
                // Tenta copiar o texto
                updateStatus("Copiando texto...", "info");
                setClipboard(textToCopy);
                
                updateStatus("Email copiado para a área de transferência!", "success");

            } catch (e) {
                var detailedError = "Falha ao copiar o texto:\n" + e.toString();
                alert(detailedError, "Erro de Cópia");
                updateStatus("Falha ao copiar: " + e.message, "error");
                logDebug("Erro detalhado na cópia: " + e.toString());
            }
        };
        
        w.onShow = function() {
            var hasComps = captureCompositions();
            if (hasComps) {
                runAutoDetectionAndUpdateUI();
            } else {
                updateStatus("Pronto. Capture uma composição.", "info");
            }
        };
    }

    // === INICIALIZAÇÃO ===
    function init() {
        logDebug("=== INICIANDO MailMaker - v37.6 FIXED ===");
        var mainPath = findScriptMainPath();
        try {
            var globalsFile = new File(mainPath + "source/globals.js");
            if(globalsFile.exists) $.evalFile(globalsFile);
            var iconLibFile = new File(mainPath + "source/libraries/ICON lib.js");
            if(iconLibFile.exists) $.evalFile(iconLibFile);
            var uiFuncFile = new File(mainPath + "source/libraries/functions/UI_FUNC.js");
            if(uiFuncFile.exists) $.evalFile(uiFuncFile);
        } catch(e) { 
            logDebug("Libs de UI não encontradas. Erro: " + e.toString()); 
        }
        
        loadedCaminhosJSON = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_caminhos_gnews.json");
        programacaoData = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_programacao_gnews.json");
        
        var autoPathScript = new File(mainPath + "source/libraries/functions/func_auto_path_servers.js");
        if (autoPathScript.exists) { 
            $.evalFile(autoPathScript); 
        } else { 
            alert("ERRO CRÍTICO: 'func_auto_path_servers.js' não encontrado."); 
            return; 
        }
        
        var getPathDayByDayScript = new File(mainPath + "source/libraries/functions/func_getPathDayByDay.js");
        if (getPathDayByDayScript.exists) { 
            $.evalFile(getPathDayByDayScript); 
        } else { 
            logDebug("AVISO: 'func_getPathDayByDay.js' não encontrado."); 
        }
        
        if (loadedCaminhosJSON) {
            for (var serverName in loadedCaminhosJSON) {
                if (loadedCaminhosJSON.hasOwnProperty(serverName)) {
                    var paths = loadedCaminhosJSON[serverName];
                    for (var j = 0; j < paths.length; j++) {
                        var pathInfo = paths[j];
                        if (pathInfo.nome && pathInfo.caminho) { 
                            caminhosData[pathInfo.nome] = pathInfo.caminho; 
                        }
                    }
                }
            }
            destinationNames = getObjectKeys(caminhosData).sort();
        }
        
        // --- CARREGA CONFIGURAÇÕES ANTES DE CRIAR A UI ---
        loadSettings(); 
        
        createUI();
        
        // --- APLICA AS CONFIGURAÇÕES CARREGADAS NA UI ---
        ui.saudacaoDropdown.selection = findDropdownItem(ui.saudacaoDropdown, appData.selectedSaudacao);
        ui.despedidaDropdown.selection = findDropdownItem(ui.despedidaDropdown, appData.selectedDespedida);
        ui.emojiDropdown.selection = findDropdownItem(ui.emojiDropdown, appData.selectedEmoji);
        ui.templateDropdown.selection = findDropdownItem(ui.templateDropdown, appData.selectedTemplate);
        ui.messageInput.text = appData.emailMessage;
        ui.showPathCheckbox.value = appData.showFullPath;
        ui.showTeamDataCheckbox.value = appData.showTeamData;

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
}