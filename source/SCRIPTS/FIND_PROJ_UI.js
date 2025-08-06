/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function D9TFindProjectDialog() {
    var scriptName = 'BUSCAR PROJETOS';
    var SETTINGS_SECTION = "D9TSearch"; // Seção para salvar as preferências

    // --- Cores e Funções de Estilo ---
    var bgColor1 = '#0B0D0E';
    var normalColor1 = '#C7C8CA';
    var highlightColor1 = '#E0003A';
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    // --- Lógica da Busca ---
    var searchResults = [];
    var cancelSearch = false;

    function findProjectsRecursively(folder, searchTerm) {
        if (cancelSearch) return; // Ponto de verificação para o cancelamento

        var files = folder.getFiles();
        if (!files) return;

        for (var i = 0; i < files.length; i++) {
            if (cancelSearch) return;

            var file = files [i];
            if (file instanceof Folder) {
                findProjectsRecursively(file, searchTerm);
            } else {
                if ((file.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) && (file.name.match(/\.(aep|aet)$/i))) {
                    searchResults.push(file);
                }
            }
        }
    }

    // --- Interface Gráfica ---
    var win = new Window('palette', scriptName);
    win.spacing = 4;
    win.margins = 8;
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];

    var headerGrp = win.add("group");
    headerGrp.orientation = "row";
    headerGrp.alignChildren = ["fill", "center"];
    headerGrp.alignment = "fill";
    headerGrp.spacing = 10;

    var titleText = headerGrp.add("statictext", undefined, scriptName);
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);

    var helpBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && (typeof lClick !== 'undefined' || typeof lClick === 'string')) {
        var helpBtnGroup = headerGrp.add('group');
        helpBtnGroup.alignment = ['right', 'center'];
        helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [(lClick || 'Clique') + ' Ajuda'] });
    } else {
        helpBtn = headerGrp.add("button", undefined, "?");
        helpBtn.preferredSize = [24, 24];
        helpBtn.alignment = ['right', 'center'];
    }

    var folderGrp = win.add('group');
    folderGrp.alignment = 'fill';
    var selectFolderBtn = new themeIconButton(folderGrp, {
        icon: D9T_PASTA_ICON || undefined,
        tips: [(lClick || 'Clique') + ' Selecionar pasta para busca']
    });

    var lastFolderPath = app.settings.haveSetting(SETTINGS_SECTION, "lastProjectPath") ? app.settings.getSetting(SETTINGS_SECTION, "lastProjectPath") : Folder.myDocuments.fsName;
    var folderPathTxt = folderGrp.add('edittext', undefined, lastFolderPath);
    folderPathTxt.preferredSize.width = 240;

    var searchGrp = win.add('group');
    searchGrp.alignment = 'fill';
    var searchInput = searchGrp.add('edittext', [0, 0, 260, 32]);
    var searchBtn = new themeIconButton(searchGrp, {
        icon: D9T_BUSCAR_ICON || undefined,
        tips: [(lClick || 'Clique') + ' Buscar projetos']
    });

    var resultTree = win.add('treeview', [0, 0, 320, 0]);
    resultTree.visible = false;

    var statusGrp = win.add('group');
    statusGrp.orientation = 'row'; // Alterado para row para alinhar status e cancelar
    statusGrp.alignment = 'fill';
    statusGrp.spacing = 10;

    var statusTxt = statusGrp.add('statictext', undefined, 'Selecione uma pasta e busque um projeto.');
    statusTxt.alignment = 'left';
    statusTxt.preferredSize.width = 200; // Ajuste de largura para o botão caber

    var cancelBtn = statusGrp.add('button', undefined, 'Cancelar');
    cancelBtn.visible = false;
    cancelBtn.alignment = ['right', 'center'];
    cancelBtn.preferredSize = [80, 24]; // Tamanho padrão de botão

    // --- Aplicar Tema ---
    setBgColor(win, bgColor1);
    setFgColor(titleText, normalColor1);
    setFgColor(folderPathTxt, normalColor1);
    setFgColor(statusTxt, normalColor1);

    // --- Eventos da Interface ---
    selectFolderBtn.leftClick.onClick = function() {
        var selectedFolder = Folder.selectDialog("Selecione a pasta raiz para a busca", folderPathTxt.text);
        if (selectedFolder) {
            var newPath = Folder.decode(selectedFolder.fsName);
            folderPathTxt.text = newPath;
            folderPathTxt.helpTip = newPath;
            app.settings.saveSetting(SETTINGS_SECTION, "lastProjectPath", newPath);
        }
    };

    cancelBtn.onClick = function() {
        cancelSearch = true;
        statusTxt.text = 'Cancelando a busca...';
        win.update(); // Força a atualização da UI para mostrar a mensagem
    };

    function doSearch() {
        win.text = scriptName + ' (Buscando...)';
        statusTxt.text = 'Iniciando busca...';
        resultTree.visible = false;
        resultTree.size.height = 0;
        win.layout.layout(true);

        searchResults = [];
        resultTree.removeAll();
        cancelSearch = false;
        cancelBtn.visible = true;
        searchBtn.enabled = false;
        selectFolderBtn.enabled = false;
        win.update();

        var rootFolder = new Folder(folderPathTxt.text);
        var searchTerm = searchInput.text;

        if (!rootFolder.exists || searchTerm === "") {
            alert("Pasta inválida ou termo de busca vazio.");
            endSearch();
            return;
        }

        var foldersToScan = [rootFolder];

        function processFolders() {
            if (cancelSearch || foldersToScan.length === 0) {
                populateResults();
                endSearch();
                return;
            }

            var currentFolder = foldersToScan.shift();
            statusTxt.text = 'Buscando em: ' + Folder.decode(currentFolder.name);
            win.update();

            var files = currentFolder.getFiles();
            if (!files) {
                processFolders(); // Continua para a próxima pasta mesmo se não houver arquivos
                return;
            }

            for (var i = 0; i < files.length; i++) {
                var file = files [i];
                if (file instanceof Folder) {
                    foldersToScan.push(file);
                } else {
                    if ((file.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) && (file.name.match(/\.(aep|aet)$/i))) {
                        searchResults.push(file);
                    }
                }
                if (cancelSearch) break; // Permite sair do loop de arquivos também
            }
            processFolders(); // Chama a si mesma para processar a próxima pasta
        }

        processFolders();
    }

    function populateResults() {
        var resultsByFolder = {};
        for (var i = 0; i < searchResults.length; i++) {
            var file = searchResults [i];
            var path = Folder.decode(file.path);
            if (!resultsByFolder [path]) {
                resultsByFolder [path] = [];
            }
            resultsByFolder [path].push(file);
        }

        for (var path in resultsByFolder) {
            if (resultsByFolder.hasOwnProperty(path)) {
                var folderNode = resultTree.add('node', path);
                if (typeof D9T_PASTAS_ICON !== 'undefined') folderNode.image = D9T_PASTAS_ICON.normal;

                for (var j = 0; j < resultsByFolder [path].length; j++) {
                    var file = resultsByFolder [path] [j];
                    var modDate = file.modified;
                    var dateStr = modDate.getDate() + "/" + (modDate.getMonth() + 1) + "/" + modDate.getFullYear();
                    var itemText = file.displayName + "   [" + dateStr + "]";

                    var item = folderNode.add('item', itemText);
                    item.file = file;
                    if (typeof D9T_AE_ICON !== 'undefined') item.image = D9T_AE_ICON;
                }
            }
        }

        cleanHierarchy(resultTree);
        var count = expandNodes(resultTree);

        if (count < 1 && !cancelSearch) {
            statusTxt.text = 'Nenhum projeto encontrado.';
            return;
        } else if (cancelSearch) {
            statusTxt.text = 'Busca cancelada pelo usuário. ' + searchResults.length + ' resultado(s) parciais encontrados.';
            return;
        }

        resultTree.visible = true;
        resultTree.size.height = count >= 16 ? 320 : count * 21 + 5;
        statusTxt.text = searchResults.length + ' projeto(s) encontrado(s). Duplo-clique para abrir.';
        win.layout.layout(true);
    }

    function endSearch() {
        win.text = scriptName;
        cancelBtn.visible = false;
        searchBtn.enabled = true;
        selectFolderBtn.enabled = true;
        win.update();
    }

    searchBtn.leftClick.onClick = searchInput.onEnterKey = doSearch;

    resultTree.onDoubleClick = function() {
        if (resultTree.selection && resultTree.selection.type === 'item') {
            try {
                app.open(resultTree.selection.file);
                win.close();
            } catch (e) {
                alert("Não foi possível abrir o projeto.\n" + e.toString());
            }
        }
    };

    if (helpBtn.leftClick) { // Verifica se é um themeIconButton
        helpBtn.leftClick.onClick = function() { /* ...código da ajuda... */ };
    } else { // Fallback para botão normal
        helpBtn.onClick = function() { /* ...código da ajuda... */ };
    }

    win.center();
    win.show();

    // --- FUNÇÕES AUXILIARES PARA O TREEVIEW ---
    function cleanHierarchy(nodeTree) {
        var branches = nodeTree.items;
        for (var i = branches.length - 1; i >= 0; i--) {
            if (branches [i].type != 'node') continue;
            var wasEmpty = cleanHierarchy(branches [i]);
            if (wasEmpty) {
                nodeTree.remove(branches [i]);
            }
        }
        return nodeTree.items.length == 0 && nodeTree.parent != null;
    }

    function expandNodes(nodeTree) {
        var count = 0;
        var branches = nodeTree.items;
        nodeTree.expanded = true;
        for (var i = 0; i < branches.length; i++) {
            if (branches [i].type == 'node') count += expandNodes(branches [i]);
            count++;
        }
        return count;
    }
}