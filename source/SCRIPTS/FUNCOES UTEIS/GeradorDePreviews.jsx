// Gerador de Previews Interativo para After Effects v2.1
// CORREÇÃO: O projeto não é mais fechado após gerar o preview.
// MELHORIA: Avisa sobre alterações não salvas antes de trocar de projeto.
(function () {
    var aepFiles = [];

    var mainWindow = new Window("palette", "Gerador de Previews v2.1", undefined, { resizeable: true });
    mainWindow.orientation = "column";
    mainWindow.alignChildren = ["fill", "top"];
    mainWindow.spacing = 10;

    // -- PAINEL DE PROJETOS --
    var filePanel = mainWindow.add("panel", undefined, "1. Lista de Projetos");
    filePanel.orientation = "column";
    filePanel.alignChildren = ["fill", "top"];
    
    var fileListbox = filePanel.add("listbox", [0, 0, 400, 200], [], { multiselect: false });

    var buttonGroup = filePanel.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    var addFilesButton = buttonGroup.add("button", undefined, "Adicionar Projeto(s)");
    var removeFileButton = buttonGroup.add("button", undefined, "Remover Selecionado");

    // -- PAINEL DE CONFIGURAÇÃO --
    var configPanel = mainWindow.add("panel", undefined, "2. Configuração do Preview");
    configPanel.orientation = "column";
    configPanel.alignChildren = ["fill", "top"];
    configPanel.spacing = 10;

    var compGroup = configPanel.add("group");
    compGroup.add("statictext", undefined, "Composição:");
    var compDropdown = compGroup.add("dropdownlist", [0, 0, 250, 25], ["- selecione um projeto na lista -"]);
    compDropdown.selection = 0;

    var positionGroup = configPanel.add("group");
    positionGroup.add("statictext", undefined, "Posição do Frame:");
    var radioInicio = positionGroup.add("radiobutton", undefined, "Início");
    var radioMeio = positionGroup.add("radiobutton", undefined, "Meio");
    var radioFim = positionGroup.add("radiobutton", undefined, "Fim");
    radioMeio.value = true;

    // -- PAINEL DE AÇÃO --
    var actionPanel = mainWindow.add("panel", undefined, "3. Ação");
    actionPanel.alignChildren = "fill";
    var generateButton = actionPanel.add("button", undefined, "Gerar Preview do Projeto Aberto");
    var statusText = actionPanel.add("statictext", undefined, "Adicione projetos para começar.");
    statusText.justify = "center";


    // --- LÓGICA DA INTERFACE ---

    addFilesButton.onClick = function () {
        var selectedFiles = File.openDialog("Selecione os arquivos .aep ou .aet", "Adobe After Effects:*.aep;*.aet", true);
        if (selectedFiles) {
            for (var i = 0; i < selectedFiles.length; i++) {
                var isDuplicate = false;
                for (var j = 0; j < aepFiles.length; j++) {
                    if (aepFiles[j].fsName === selectedFiles[i].fsName) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    aepFiles.push(selectedFiles[i]);
                    fileListbox.add("item", selectedFiles[i].displayName);
                }
            }
        }
        statusText.text = "Pronto.";
    };

    removeFileButton.onClick = function () {
        var selectedIndex = fileListbox.selection ? fileListbox.selection.index : -1;
        if (selectedIndex > -1) {
            aepFiles.splice(selectedIndex, 1);
            fileListbox.remove(selectedIndex);
            compDropdown.removeAll();
            compDropdown.add("item", "- selecione um projeto na lista -");
            compDropdown.selection = 0;
            statusText.text = "Projeto removido da lista.";
        } else {
            alert("Selecione um projeto na lista para remover.");
        }
    };

    fileListbox.onChange = function () {
        var selectedIndex = fileListbox.selection ? fileListbox.selection.index : -1;
        if (selectedIndex > -1) {
            // **NOVA VERIFICAÇÃO DE SEGURANÇA**
            // Verifica se o projeto atual tem alterações não salvas
            if (app.project && app.project.file && !app.project.saved) {
                if (confirm("O projeto atual tem alterações não salvas. Deseja salvá-lo antes de abrir o próximo?")) {
                    app.project.save();
                }
            }

            var selectedFile = aepFiles[selectedIndex];
            statusText.text = "Abrindo " + selectedFile.displayName + "...";
            mainWindow.update();
            try {
                app.open(selectedFile);
                
                compDropdown.removeAll();
                var foundComps = false;
                for (var i = 1; i <= app.project.numItems; i++) {
                    if (app.project.item(i) instanceof CompItem) {
                        compDropdown.add("item", app.project.item(i).name);
                        foundComps = true;
                    }
                }

                if (foundComps) {
                    compDropdown.selection = 0;
                    statusText.text = "Projeto '" + selectedFile.displayName + "' carregado. Escolha a composição.";
                } else {
                    compDropdown.add("item", "- Nenhuma composição encontrada -");
                    compDropdown.selection = 0;
                    statusText.text = "Projeto carregado, mas nenhuma composição foi encontrada.";
                }

            } catch (e) {
                alert("Erro ao abrir o projeto: " + selectedFile.displayName + "\n" + e.toString());
                statusText.text = "Erro ao carregar o projeto.";
            }
        }
    };
    
    generateButton.onClick = function () {
        var listSelection = fileListbox.selection;
        var compSelection = compDropdown.selection;

        if (!app.project.file) {
            alert("Por favor, abra um projeto primeiro (clicando na lista).");
            return;
        }
        if (!compSelection || compSelection.text.indexOf("-") === 0) {
            alert("Por favor, selecione uma composição válida.");
            return;
        }

        app.beginUndoGroup("Gerar Preview");

        try {
            // O script agora usa o projeto que já está aberto
            var currentProjFile = app.project.file; 
            var compName = compSelection.text;
            var targetComp = null;

            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i) instanceof CompItem && app.project.item(i).name === compName) {
                    targetComp = app.project.item(i);
                    break;
                }
            }

            if (targetComp) {
                var compTime = 0;
                if (radioInicio.value) { compTime = 0; } 
                else if (radioMeio.value) { compTime = targetComp.duration / 2; } 
                else if (radioFim.value) { compTime = targetComp.duration - targetComp.frameDuration; }

                var fileName = decodeURI(currentProjFile.name).replace(/\.[^.]+$/, "");
                var outputName = fileName + "_PREVIEW.png";
                var outputFile = new File(currentProjFile.path + "/" + outputName);

                statusText.text = "Gerando preview para '" + targetComp.name + "'...";
                mainWindow.update();
                targetComp.saveFrameToPng(compTime, outputFile);
                
                statusText.text = "Preview gerado com sucesso! Projeto continua aberto.";
                alert("Preview gerado com sucesso!\nSalvo em: " + outputFile.fsName);
            } else {
                throw new Error("Não foi possível encontrar a composição '" + compName + "' no projeto atual.");
            }

        } catch (e) {
            alert("Ocorreu um erro durante a geração do preview:\n" + e.toString());
            statusText.text = "Ocorreu um erro.";
        } finally {
            app.endUndoGroup();
        }
    };

    mainWindow.onResizing = mainWindow.onResize = function () { this.layout.resize(); };
    mainWindow.center();
    mainWindow.show();
})();