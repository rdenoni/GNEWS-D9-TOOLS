/***************************************************
 * Ilustra_Saver_v4.3
 *
 * Autor: Gemini
 * Versão: 4.3
 *
 * Descrição: Ferramenta para arquivar e converter ilustrações.
 *
 * Alterações v4.3 (Correção de Bug):
 * - Adicionado o carregamento das bibliotecas 'FUNC lib.js',
 * 'UI_FUNC.js' e 'FOLDER_UI.js' para resolver o erro de
 * dependência indireta da função 'd9ProdFoldersDialog'.
 ***************************************************/

(function ilustraSaverV4_3() {

    // --- ETAPA 1: Encontrar o caminho principal e carregar bibliotecas ---
    var scriptMainPath = findScriptMainPath();
    if (!scriptMainPath || !loadLibraries(scriptMainPath)) {
        return; // Aborta a execução se as bibliotecas essenciais não forem encontradas
    }

    // --- ETAPA 2: Definições do Script ---
    var SCRIPT_NAME = "Ilustra Saver";
    var SCRIPT_VERSION = "4.3";

    var state = {
        selectedComp: null,
        frameTime: 0,
        baseName: "Nova_Ilustra",
        uniqueCode: "",
        finalName: ""
    };
    var ui = {};

    // --- FUNÇÕES DE INICIALIZAÇÃO (PADRÃO DO SEU ECOSSISTEMA) ---
    function findScriptMainPath() {
        try {
            var scriptFile = new File($.fileName);
            var parentFolder = scriptFile.parent;
            for (var i = 0; i < 5; i++) {
                var sourceFolder = new Folder(parentFolder.fsName + "/source");
                if (sourceFolder.exists) {
                    return parentFolder.fsName;
                }
                if (parentFolder.parent === null) {
                    break;
                }
                parentFolder = parentFolder.parent;
            }
            return new File($.fileName).parent.fsName;
        } catch (e) {
            alert("Erro ao tentar encontrar o caminho principal dos scripts (scriptMainPath):\n" + e.toString());
            return null;
        }
    }

    function loadLibraries(path) {
        // --- ATUALIZAÇÃO: Lista de bibliotecas completa e na ordem correta ---
        var libFiles = [
            "/source/libraries/functions/file system lib.js",
            "/source/libraries/ICON lib.js",
            "/source/globals.js",
            "/source/libraries/functions/FUNC lib.js",
            "/source/libraries/functions/UI_FUNC.js",
            "/source/libraries/ui/FOLDER_UI.js"
        ];
        try {
            for (var i = 0; i < libFiles.length; i++) {
                var file = new File(path + libFiles[i]);
                if (file.exists) {
                    $.evalFile(file);
                } else {
                    // Tenta um caminho alternativo para UI (alguns scripts podem ter estruturas diferentes)
                    var altFile = new File(path + libFiles[i].replace("/ui/", "/"));
                    if(altFile.exists){
                        $.evalFile(altFile);
                    } else {
                        throw new Error("Biblioteca necessária não encontrada:\n" + file.fsName);
                    }
                }
            }
            return true;
        } catch (e) {
            alert("Erro fatal ao carregar bibliotecas:\n" + e.toString());
            return false;
        }
    }
    
    // --- LÓGICA DO SCRIPT ---
    function generateUniqueCode() {
        var configFolder = new Folder(scriptMainPath + '/source/config');
        createFolderPath(configFolder.fsName);
        var jsonConfigFile = new File(configFolder.fsName + '/ilustra_config.json');
        var history = [];
        if (jsonConfigFile.exists) {
            try {
                var content = readFileContent(jsonConfigFile);
                if (content) history = JSON.parse(content);
            } catch (e) { history = []; }
        }
        if (!Array.isArray(history)) history = [];
        var date = new Date();
        var hours = ("0" + date.getHours()).slice(-2);
        var minutes = ("0" + date.getMinutes()).slice(-2);
        var timeString = hours + minutes;
        var numericBase = parseInt(timeString, 10);
        var finalCode;
        var counter = 0;
        var isUnique = false;
        while (!isUnique) {
            var currentNumericCode = numericBase + counter;
            finalCode = "GNILT" + currentNumericCode;
            var found = false;
            for (var i = 0; i < history.length; i++) {
                if (history[i].uniqueCode === finalCode) {
                    found = true;
                    break;
                }
            }
            isUnique = !found;
            if (!isUnique) counter++;
        }
        return finalCode;
    }

    function updateGeneratedInfo() {
        if (!ui.finalNameText || !ui.codeText) return;
        state.uniqueCode = generateUniqueCode();
        state.finalName = state.baseName + "_" + state.uniqueCode;
        ui.finalNameText.text = state.finalName;
        ui.codeText.text = state.uniqueCode;
    }

    function updatePreview() {
        var activeComp = app.project.activeItem;
        if (!(activeComp instanceof CompItem)) {
            alert("Por favor, selecione uma composição e abra-a no visualizador.");
            return;
        }
        if (ui.compDropdown.selection === null || ui.compDropdown.selection.text !== activeComp.name) {
            for (var i = 0; i < ui.compDropdown.items.length; i++) {
                if (ui.compDropdown.items[i].text === activeComp.name) {
                    var onChangeHandler = ui.compDropdown.onChange;
                    ui.compDropdown.onChange = null;
                    ui.compDropdown.selection = i;
                    ui.compDropdown.onChange = onChangeHandler;
                    state.selectedComp = activeComp;
                    break;
                }
            }
        }
        state.selectedComp = activeComp;
        state.frameTime = activeComp.time;
        try {
            var frameImage = state.selectedComp.frame(state.frameTime);
            ui.previewImage.image = frameImage;
            ui.previewPlaceholder.visible = false;
            ui.previewImage.visible = true;
            ui.frameTimeText.text = state.frameTime.toFixed(2) + "s";
        } catch (e) {
            alert("Não foi possível gerar o preview. Verifique a composição.");
            ui.previewPlaceholder.visible = true;
            ui.previewImage.visible = false;
        }
    }

    function runConverter() {
        if (!state.selectedComp) {
            alert("Por favor, selecione uma composição primeiro.");
            return;
        }
        app.beginUndoGroup("Converter Composição");
        var originalComp = state.selectedComp;
        var newCompName = state.baseName + "_1920x1080";
        var newDuration = originalComp.duration;
        var newComp = app.project.items.addComp(newCompName, 1920, 1080, 1, newDuration, 29.97);
        var newLayer = newComp.layers.add(originalComp);
        newLayer.transform.scale.setValue([100 * (1920 / originalComp.width), 100 * (1080 / originalComp.height)]);
        newLayer.transform.position.setValue([960, 540]);
        var onChangeHandler = ui.compDropdown.onChange;
        ui.compDropdown.onChange = null;
        ui.compDropdown.removeAll();
        var projectComps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof CompItem) {
                projectComps.push(app.project.item(i).name);
            }
        }
        projectComps.sort();
        var newCompIndex = -1;
        for (var c = 0; c < projectComps.length; c++) {
            ui.compDropdown.add("item", projectComps[c]);
            if (projectComps[c] === newCompName) {
                newCompIndex = c;
            }
        }
        if (newCompIndex > -1) {
            ui.compDropdown.selection = newCompIndex;
            state.selectedComp = newComp;
        }
        ui.compDropdown.onChange = onChangeHandler;
        newComp.openInViewer();
        app.endUndoGroup();
        alert("Composição convertida para '" + newCompName + "' e selecionada automaticamente!");
    }

    function runArchiver() {
        if (!state.selectedComp) {
            alert("Por favor, selecione uma composição primeiro.");
            return;
        }
        if (!state.baseName) {
            alert("Por favor, digite um nome base.");
            return;
        }
        app.beginUndoGroup("Arquivar Ilustração");
        if (app.project.file) { app.project.save(); }
        else {
            alert("É recomendado salvar seu projeto principal antes de continuar.");
            app.endUndoGroup();
            return;
        }
        var saveFolder = new Folder(scriptMainPath + '/ilustracoes');
        var configFolder = new Folder(scriptMainPath + '/source/config');
        updateGeneratedInfo();
        var finalAETFile = new File(saveFolder.fsName + '/' + state.finalName + '.aet');
        var jsonConfigFile = new File(configFolder.fsName + '/ilustra_config.json');
        var compToIsolate = state.selectedComp;
        var tempFolder = app.project.items.addFolder("_TEMP_PARA_REDUCAO_");
        compToIsolate.parentFolder = tempFolder;
        app.project.reduceProject(tempFolder.item(1));
        var reducedComp = app.project.rootFolder.item(1);
        populateProjectFolders(reducedComp);
        reducedComp.name = state.baseName;
        reducedComp.displayStartTime = state.frameTime;
        reducedComp.workAreaStart = state.frameTime;
        reducedComp.workAreaDuration = reducedComp.frameDuration;
        if (!createFolderPath(saveFolder.fsName) || !createFolderPath(configFolder.fsName)) {
            app.endUndoGroup();
            return;
        }
        app.project.save(finalAETFile);
        var logData = {
            "fileName": state.finalName + '.aet',
            "savedPath": finalAETFile.fsName,
            "originalCompName": state.selectedComp.name,
            "savedCompName": state.baseName,
            "frameTimeInSeconds": state.frameTime,
            "baseName": state.baseName,
            "uniqueCode": state.uniqueCode,
            "timestampUTC": new Date().toUTCString()
        };
        var history = [];
        if (jsonConfigFile.exists) {
            try {
                var content = readFileContent(jsonConfigFile);
                if (content) history = JSON.parse(content);
            } catch (e) { history = []; }
        }
        if (!Array.isArray(history)) history = [];
        history.push(logData);
        saveTextFile(JSON.stringify(history, null, 4), jsonConfigFile.fsName);
        app.endUndoGroup();
        alert("Projeto arquivado com sucesso!\n\nSalvo em: " + decodeURI(finalAETFile.fsName) + "\n\nIMPORTANTE: Para retornar ao projeto completo, use 'File > Revert'.");
    }

    function populateProjectFolders(mainComp) {
        var compFolder = app.project.items.addFolder("[COMP]");
        var precompFolder = app.project.items.addFolder("[PRE-COMPS]");
        var footageFolder = app.project.items.addFolder("[FOOTAGE]");
        var solidFolder = app.project.items.addFolder("[SOLIDS]");
        for (var i = app.project.numItems; i >= 1; i--) {
            var item = app.project.item(i);
            if (item.parentFolder !== app.project.rootFolder) continue;
            if (item === mainComp) item.parentFolder = compFolder;
            else if (item instanceof CompItem) item.parentFolder = precompFolder;
            else if (item instanceof FootageItem) {
                if (item.mainSource instanceof SolidSource) item.parentFolder = solidFolder;
                else item.parentFolder = footageFolder;
            }
        }
    }

    function createMainWindow() {
        var win = new Window("palette", SCRIPT_NAME + " v" + SCRIPT_VERSION, undefined, { resizeable: true });
        setBgColor(win, bgColor1);
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        var mainGroup = win.add("group");
        mainGroup.orientation = "row";
        mainGroup.alignChildren = ["top", "top"];
        mainGroup.spacing = 10;
        mainGroup.margins = 15;
        var leftColumn = mainGroup.add("group");
        leftColumn.orientation = "column";
        leftColumn.alignChildren = ["fill", "top"];
        leftColumn.spacing = 10;
        leftColumn.preferredSize.width = 250;
        var compPanel = leftColumn.add("panel", undefined, "1. Seleção");
        setFgColor(compPanel, normalColor1);
        compPanel.add("statictext", undefined, "Composição de Origem:");
        ui.compDropdown = compPanel.add("dropdownlist", undefined, []);
        var namePanel = leftColumn.add("panel", undefined, "2. Nomenclatura");
        setFgColor(namePanel, normalColor1);
        namePanel.add("statictext", undefined, "Nome Base:");
        ui.baseNameInput = namePanel.add("edittext", undefined, state.baseName);
        var framePanel = leftColumn.add("panel", undefined, "3. Captura de Frame");
        setFgColor(framePanel, normalColor1);
        framePanel.alignment = "fill";
        ui.refreshPreviewButton = framePanel.add("button", undefined, "Atualizar Preview da Timeline");
        ui.frameTimeText = framePanel.add("statictext", undefined, "0.00s");
        ui.frameTimeText.alignment = "center";
        var generatedInfoPanel = leftColumn.add("panel", undefined, "Informações Finais");
        setFgColor(generatedInfoPanel, normalColor1);
        generatedInfoPanel.add("statictext", undefined, "Nome do Arquivo:");
        ui.finalNameText = generatedInfoPanel.add("statictext", undefined, "-");
        setFgColor(ui.finalNameText, monoColor2);
        generatedInfoPanel.add("statictext", undefined, "Código Único (Tag):");
        ui.codeText = generatedInfoPanel.add("statictext", undefined, "-");
        setFgColor(ui.codeText, monoColor2);
        var actionsPanel = leftColumn.add("panel", undefined, "4. Ações");
        setFgColor(actionsPanel, normalColor1);
        ui.convertButton = actionsPanel.add("button", undefined, "Converter para 16:9");
        ui.archiveButton = actionsPanel.add("button", undefined, "Arquivar Ilustração (.aet)");
        var rightColumn = mainGroup.add("group");
        rightColumn.orientation = "column";
        rightColumn.alignChildren = ["fill", "fill"];
        rightColumn.minimumSize.width = 600;
        var previewPanel = rightColumn.add("panel", undefined, "Preview do Frame");
        previewPanel.alignment = ["fill", "fill"];
        setFgColor(previewPanel, normalColor1);
        var previewStack = previewPanel.add("group");
        previewStack.orientation = "stack";
        previewStack.alignment = ["fill", "fill"];
        previewStack.minimumSize.height = 338;
        ui.previewImage = previewStack.add("image", undefined, no_preview); 
        ui.previewImage.alignment = ["fill", "fill"];
        ui.previewPlaceholder = previewStack.add("statictext", undefined, "Posicione a agulha na timeline e clique em 'Atualizar Preview'");
        ui.previewPlaceholder.alignment = ["center", "center"];
        
        if (typeof no_preview !== 'undefined' && no_preview !== null) {
            ui.previewPlaceholder.visible = false;
            ui.previewImage.visible = true;
        } else {
            ui.previewPlaceholder.visible = true;
            ui.previewImage.visible = false;
        }
        ui.compDropdown.onChange = function() {
            if (this.selection) { state.selectedComp = findCompByName(this.selection.text); }
            else { state.selectedComp = null; }
        };
        ui.baseNameInput.onChanging = function() {
            state.baseName = this.text;
            updateGeneratedInfo();
        };
        ui.refreshPreviewButton.onClick = updatePreview;
        ui.convertButton.onClick = runConverter;
        ui.archiveButton.onClick = runArchiver;
        win.onShow = function() {
            var projectComps = [];
            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i) instanceof CompItem) {
                    projectComps.push(app.project.item(i).name);
                }
            }
            projectComps.sort();
            var activeItemIndex = 0;
            for (var c = 0; c < projectComps.length; c++) {
                ui.compDropdown.add("item", projectComps[c]);
                if (app.project.activeItem instanceof CompItem && projectComps[c] === app.project.activeItem.name) {
                    activeItemIndex = c;
                }
            }
            if (ui.compDropdown.items.length > 0) {
                ui.compDropdown.selection = activeItemIndex;
            }
            updateGeneratedInfo();
            win.layout.layout(true);
        };
        win.onResizing = win.onResize = function() { this.layout.resize(); }
        win.layout.layout(true);
        win.center();
        win.show();
    }

    // --- PONTO DE ENTRADA ---
    if (app.project) {
        createMainWindow();
    } else {
        alert("Nenhum projeto aberto. Por favor, abra um projeto para usar este script.");
    }

})();