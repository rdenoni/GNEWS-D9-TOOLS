/***************************************************
 * FERRAMENTA DE DIAGNÓSTICO DE CAMINHO v2.2
 * Correção na listagem de todas as tags.
 ***************************************************/

(function() {

    var loadedCaminhosJSON = {};
    var programacaoData = {};
    var allTags = {};

    function logDebug(message) { $.writeln("[Diagnóstico] " + message); }
    
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
        if (!file.exists) { return null; }
        try {
            file.encoding = "UTF-8"; file.open("r"); var content = file.read(); file.close();
            return content ? eval("(" + content + ")") : null;
        } catch (e) { alert("Erro de formatação no arquivo JSON: " + filePath); return null; }
    }

    function createTestWindow() {
        var testWin = new Window("palette", "Ferramenta de Diagnóstico de Caminho v2.2", undefined, {resizeable: true});
        testWin.orientation = "column";
        testWin.alignChildren = ["fill", "top"];
        testWin.spacing = 10;
        testWin.margins = 15;
        testWin.preferredSize.width = 500;

        var compNameInput, logArea;
        
        function appendToLog(message, isTitle) {
            if (!logArea) return;
            var prefix = isTitle ? "\n--- " : "> ";
            var suffix = isTitle ? " ---\n" : "\n";
            logArea.text += prefix + message + suffix;
        }

        function onTestButtonClick() {
            try {
                logArea.text = "";
                var compName = compNameInput.text;
                if (compName === "") { appendToLog("Por favor, insira um nome de composição.", true); return; }
                if (!$.global.MailMakerAutoPath) { appendToLog("ERRO: 'func_auto_path_servers.js' não carregado.", true); return; }

                var detectionResult = $.global.MailMakerAutoPath.regrasGNews(compName, loadedCaminhosJSON, programacaoData, true) || $.global.MailMakerAutoPath.regrasFant(compName, loadedCaminhosJSON, programacaoData, true);

                if (detectionResult && detectionResult.trace) {
                    appendToLog("Trilha de Decisão da Lógica", true);
                    for (var i = 0; i < detectionResult.trace.length; i++) {
                        appendToLog(detectionResult.trace[i], false);
                    }
                }

                appendToLog("Resultado Final", true);
                if (detectionResult && detectionResult.result) {
                    appendToLog("NOME: " + detectionResult.result.nome, false);
                    appendToLog("CAMINHO: " + detectionResult.result.caminho, false);
                } else {
                    appendToLog("Nenhum caminho foi detectado.", false);
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
                if (compName === "") { appendToLog("Insira um nome de composição na aba 'Teste Rápido' primeiro.", true); return; }
                appendToLog("Análise de Tags para: '" + compNameInput.text + "'", true);
                var foundAny = false;
                function findTags(title, tagArray) {
                    var found = [];
                    for (var i = 0; i < tagArray.length; i++) {
                        var tag = tagArray[i];
                        var official = tag.replace(/_/g, " ");
                        var normalized = tag.replace(/_/g, "");
                        if (compName.indexOf(official) > -1 || compName.indexOf(tag) > -1 || (normalized !== "" && compName.replace(/[\s-]/g, "").indexOf(normalized) > -1) ) {
                             found.push(tag);
                        }
                    }
                    if(found.length > 0) { appendToLog(title + ": " + found.join(", "), false); foundAny = true; }
                }
                
                findTags("Programa/Jornal", allTags.programas);
                findTags("Arte (GNews)", allTags.artes);
                findTags("Pesquisa", allTags.pesquisa);
                findTags("Arte (Fant)", allTags.artesFant);
                findTags("Especial (Fant)", allTags.espFant);
                findTags("Viz (Fant)", allTags.vizFant);

                if (!foundAny) { appendToLog("Nenhuma tag conhecida foi encontrada.", false); }
            } catch (e) {
                alert("ERRO AO ANALISAR: " + e.toString());
            }
        }

        // CORREÇÃO: Lógica para listar todas as tags foi aprimorada
        function onListAllButtonClick() {
            logArea.text = "";
            appendToLog("Listando Todas as Tags Válidas", true);

            var programasPuros = [];
            for(var i = 0; i < allTags.programas.length; i++){
                var isJornal = false;
                for(var j = 0; j < allTags.jornais.length; j++){
                    if(allTags.programas[i] === allTags.jornais[j]){
                        isJornal = true;
                        break;
                    }
                }
                if(!isJornal) programasPuros.push(allTags.programas[i]);
            }

            appendToLog("\n--- GNEWS: JORNAIS ---\n" + allTags.jornais.join(", "), false);
            appendToLog("\n--- GNEWS: PROGRAMAS ---\n" + programasPuros.join(", "), false);
            appendToLog("\n--- GNEWS: ARTES (PARA ILHA) ---\n" + allTags.artes.join(", "), false);
            appendToLog("\n--- FANTÁSTICO: ARTES ---\n" + allTags.artesFant.join(", "), false);
            appendToLog("\n--- FANTÁSTICO: ESPECIAL ---\n" + allTags.espFant.join(", "), false);
        }

        function onCaptureButtonClick() {
            if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
                compNameInput.text = app.project.activeItem.name;
            } else {
                alert("Por favor, selecione uma composição no After Effects.");
            }
        }

        var inputGroup = testWin.add("group");
        inputGroup.orientation = "row";
        inputGroup.alignChildren = ["fill", "center"];
        inputGroup.add("statictext", undefined, "Nome da Composição:");
        compNameInput = inputGroup.add("edittext", undefined, "GNEWS BALAIO CREDITOS TRUMP ARTE 01 - JULIANO c01");
        compNameInput.alignment = ["fill", "center"];
        var captureBtn = inputGroup.add("button", undefined, "Capturar");
        captureBtn.preferredSize.width = 80;

        var tabPanel = testWin.add("tabbedpanel");
        tabPanel.alignChildren = "fill";
        var testTab = tabPanel.add("tab", undefined, "Teste Rápido");
        testTab.alignment = "fill";
        var testBtn = testTab.add("button", undefined, "Testar Detecção Completa");
        testBtn.alignment = "fill";

        var diagTab = tabPanel.add("tab", undefined, "Diagnóstico");
        diagTab.alignment = "fill";
        var analyzeBtn = diagTab.add("button", undefined, "Analisar Tags no Nome");
        analyzeBtn.alignment = "fill";
        var listAllBtn = diagTab.add("button", undefined, "Listar Todas as Tags Válidas");
        listAllBtn.alignment = "fill";

        logArea = testWin.add("edittext", undefined, "Pronto.", {multiline: true, readonly: true, scrollable: true});
        logArea.alignment = "fill";
        logArea.preferredSize.height = 300;

        captureBtn.onClick = onCaptureButtonClick;
        testBtn.onClick = onTestButtonClick;
        analyzeBtn.onClick = onAnalyzeButtonClick;
        listAllBtn.onClick = onListAllButtonClick;

        testWin.center();
        testWin.show();
    }

    function init() {
        var mainPath = findScriptMainPath();
        loadedCaminhosJSON = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_caminhos_gnews.json");
        programacaoData = readJsonFile(mainPath + "source/libraries/dados_json/DADOS_programacao_gnews.json");
        var autoPathScript = new File(mainPath + "source/libraries/functions/func_auto_path_servers.js");
        if (autoPathScript.exists) { $.evalFile(autoPathScript); } 
        else { alert("ERRO CRÍTICO: 'func_auto_path_servers.js' não encontrado."); return; }
        if ($.global.MailMakerAutoPath && $.global.MailMakerAutoPath.getTags) {
            allTags = $.global.MailMakerAutoPath.getTags(programacaoData);
        } else {
            alert("AVISO: A função getTags() não foi encontrada no arquivo de lógica.");
        }
        createTestWindow();
    }

    init();
})();