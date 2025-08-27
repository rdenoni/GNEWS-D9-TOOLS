/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

/*
  Função para gerar um caminho de diretório dinâmico baseado na data atual,
  para ser usada dentro do Adobe After Effects.
*/
function getPathDayByDay() {
    var caminhoFixo = "T:\\JORNALISMO\\GLOBONEWS\\DIARIOS\\RJ\\2025";
    var mapaMeses = {
        1: "01_JAN", 2: "02_FEV", 3: "03_MAR", 4: "04_ABR", 5: "05_MAI", 6: "06_JUN",
        7: "07_JUL", 8: "08_AGO", 9: "09_SET", 10: "10_OUT", 11: "11_NOV", 12: "12_DEZ"
    };
    var dataHoje = new Date();
    var numeroMesAtual = dataHoje.getMonth() + 1;
    var caminhoMesDinamico = mapaMeses[numeroMesAtual];
    var dia = dataHoje.getDate();
    var caminhoDiaDinamico = (dia < 10) ? "0" + dia : dia.toString();
    var caminhoFinal = caminhoFixo + "\\" + caminhoMesDinamico + "\\" + caminhoDiaDinamico + "\\";
    return caminhoFinal;
}


function D9TFindProjectDialog() {
    var scriptName = 'BUSCAR PROJETOS';
    var SETTINGS_SECTION = "D9TSearch";

    var searchPresets = {
        'DIA DIA': 'T:\\JORNALISMO\\GLOBONEWS\\DIARIOS\\RJ\\2025\\',
        'TEMPLATES': 'T:\\JORNALISMO\\GLOBONEWS\\JORNAIS\\_PECAS_GRAFICAS',
        'PROGRAMAS': 'T:\\JORNALISMO\\GLOBONEWS\\PROGRAMAS',
        'JORNAIS': 'T:\\JORNALISMO\\GLOBONEWS\\JORNAIS',
        'EVENTOS': 'T:\\JORNALISMO\\GLOBONEWS\\EVENTOS',
        'MARKETING': 'T:\\JORNALISMO\\GLOBONEWS\\MARKETING'
    };

    var bgColor1 = '#0B0D0E';
    var normalColor1 = '#C7C8CA';
    var highlightColor1 = '#E0003A';

    function getObjectKeys(obj) {
        var keys = [];
        for (var key in obj) { if (obj.hasOwnProperty(key)) keys.push(key); }
        return keys;
    }

    function hexToRgb(hex) {
        if (hex == undefined) return [Math.random(), Math.random(), Math.random()];
        hex = hex.replace('#', '');
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        return [r / 255, g / 255, b / 255];
    }

    function setBgColor(element, hexColor) {
        try {
            var color = hexToRgb(hexColor);
            var bType = element.graphics.BrushType.SOLID_COLOR;
            element.graphics.backgroundColor = element.graphics.newBrush(bType, color);
        } catch (e) {}
    }

    function setFgColor(element, hexColor) {
        try {
            var color = hexToRgb(hexColor);
            var pType = element.graphics.PenType.SOLID_COLOR;
            element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1);
        } catch (e) {}
    }

    var searchResults = [];
    var cancelSearch = false;
    var currentSort = { column: 'date', order: 'desc' };

    var win = new Window('palette', scriptName);
    win.spacing = 8;
    win.margins = 16;
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
    
    var presetGrp = win.add('group');
    presetGrp.orientation = 'row';
    presetGrp.alignChildren = ['left', 'center'];
    presetGrp.add('statictext', undefined, 'Presets:');
    
    var presetNames = getObjectKeys(searchPresets);
    presetNames.unshift('— CAMINHO PERSONALIZADO —');
    var presetDropdown = presetGrp.add('dropdownlist', undefined, presetNames);
    presetDropdown.preferredSize.width = 361;
    
    var folderGrp = win.add('group');
    folderGrp.alignment = 'fill';
    var selectFolderBtn = new themeIconButton(folderGrp, { icon: D9T_PASTA_ICON || undefined, tips: [(lClick || 'Clique') + ' Selecionar pasta para busca'] });
    
    var defaultPath = getPathDayByDay(); 
    var folderPathTxt = folderGrp.add('edittext', undefined, defaultPath);
    folderPathTxt.preferredSize.width = 374;
    folderPathTxt.helpTip = defaultPath;
    presetDropdown.selection = 0; 

    var searchGrp = win.add('group');
    searchGrp.alignment = 'left';
    
    var searchBtn = new themeIconButton(searchGrp, { icon: D9T_LENS_ICON || undefined, tips: [(lClick || 'Clique') + ' Buscar projetos'] });
    var spacer1 = searchGrp.add('group'); spacer1.preferredSize.width = 1;
    var searchInput = searchGrp.add('edittext'); 
    searchInput.preferredSize.width = 372;

    var placeholderText = 'Digite para buscar...';
    searchInput.text = placeholderText;
    searchInput.active = false; 
    searchInput.onActivate = function() {
        if (this.text === placeholderText) { this.text = ''; }
    };
    searchInput.onDeactivate = function() {
        if (this.text === '') { this.text = placeholderText; }
    };

    var sortHeaderGrp = win.add('group');
    sortHeaderGrp.orientation = 'row';
    sortHeaderGrp.alignment = 'fill';
    sortHeaderGrp.spacing = 5;
    
    var nameHeaderBtn = sortHeaderGrp.add('button', undefined, 'Nome');
    nameHeaderBtn.alignment = ['fill', 'center'];
    var dateHeaderBtn = sortHeaderGrp.add('button', undefined, 'Data');
    dateHeaderBtn.preferredSize.width = 60;
    var nameAndDateHeaderBtn = sortHeaderGrp.add('button', undefined, 'Nome & Data');
    nameAndDateHeaderBtn.preferredSize.width = 80;
    sortHeaderGrp.visible = false;
    
    var resultTree = win.add('treeview', [0, 0, 410, 0]);
    resultTree.visible = false;

    var statusGrp = win.add('group');
    statusGrp.orientation = 'row';
    statusGrp.alignment = 'fill';
    statusGrp.spacing = 10;
    var statusTxt = statusGrp.add('statictext', undefined, 'Selecione uma pasta e busque um projeto.');
    statusTxt.alignment = 'left';
    statusTxt.preferredSize.width = 200;
    var cancelBtn = statusGrp.add('button', undefined, 'Cancelar');
    cancelBtn.visible = false;
    cancelBtn.alignment = ['right', 'center'];
    cancelBtn.preferredSize = [80, 24];

    setBgColor(win, bgColor1);
    setFgColor(titleText, normalColor1);
    setFgColor(folderPathTxt, normalColor1);
    setFgColor(statusTxt, normalColor1);

    presetDropdown.onChange = function() {
        if (this.selection.index === 0) return;
        folderPathTxt.text = searchPresets[this.selection.text];
    };
    selectFolderBtn.leftClick.onClick = function() {
        var selectedFolder = Folder.selectDialog("Selecione a pasta raiz para a busca", folderPathTxt.text);
        if (selectedFolder) {
            folderPathTxt.text = Folder.decode(selectedFolder.fsName);
            presetDropdown.selection = 0;
        }
    };
    cancelBtn.onClick = function() {
        cancelSearch = true;
        statusTxt.text = 'Cancelando a busca...';
        win.update();
    };

    function doSearch() {
        win.text = scriptName + ' (Buscando...)';
        statusTxt.text = 'Iniciando busca...';
        resultTree.visible = false;
        resultTree.size.height = 0;
        sortHeaderGrp.visible = false;
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
        var searchForAll = (searchTerm === "" || searchTerm === placeholderText);
        if (!rootFolder.exists) {
            alert("Pasta de busca inválida.");
            endSearch();
            return;
        }
        var searchQueue = [rootFolder];
        function processQueue() {
            if (cancelSearch || searchQueue.length === 0) {
                populateResults();
                endSearch();
                return;
            }
            var currentFolder = searchQueue.shift();
            statusTxt.text = 'Buscando em: ' + Folder.decode(currentFolder.name);
            win.update();
            var files = currentFolder.getFiles();
            if (files) {
                for (var i = 0; i < files.length; i++) {
                    if (cancelSearch) break;
                    var file = files[i];
                    if (file instanceof Folder) {
                        searchQueue.push(file);
                    } else {
                        var isProjectFile = file.name.match(/\.(aep|aet)$/i);
                        var isNotTempFile = file.name.indexOf("tmpAEtoAMEProject") !== 0;
                        var nameMatches = searchForAll || (file.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1);
                        if (isProjectFile && isNotTempFile && nameMatches) {
                            searchResults.push(file);
                        }
                    }
                }
            }
            app.setTimeout(processQueue, 10);
        }
        processQueue();
    }
    
    function updateSortHeaders() {
        nameHeaderBtn.text = "Nome" + (currentSort.column === 'name' ? (currentSort.order === 'asc' ? ' ▲' : ' ▼') : '');
        dateHeaderBtn.text = "Data" + (currentSort.column === 'date' ? (currentSort.order === 'desc' ? ' ▼' : ' ▲') : '');
        nameAndDateHeaderBtn.text = "Nome & Data" + (currentSort.column === 'name_date' ? ' ▼' : '');
    }
    nameHeaderBtn.onClick = function() {
        var newOrder = (currentSort.column === 'name' && currentSort.order === 'asc') ? 'desc' : 'asc';
        currentSort = { column: 'name', order: newOrder };
        resultTree.removeAll();
        populateResults();
    };
    dateHeaderBtn.onClick = function() {
        var newOrder = (currentSort.column === 'date' && currentSort.order === 'desc') ? 'asc' : 'desc';
        currentSort = { column: 'date', order: newOrder };
        resultTree.removeAll();
        populateResults();
    };
    nameAndDateHeaderBtn.onClick = function() {
        currentSort = { column: 'name_date', order: 'desc' };
        resultTree.removeAll();
        populateResults();
    };

    function populateResults() {
        win.layout.dontDraw = true;
        var resultsByFolder = {};
        for (var i = 0; i < searchResults.length; i++) {
            var file = searchResults[i];
            var path = Folder.decode(file.path);
            if (!resultsByFolder[path]) resultsByFolder[path] = [];
            resultsByFolder[path].push(file);
        }
        for (var path in resultsByFolder) {
            if (resultsByFolder.hasOwnProperty(path)) {
                var folderNode = resultTree.add('node', path);
                if (typeof D9T_FOLDER_AE_ICON !== 'undefined') folderNode.image = D9T_FOLDER_AE_ICON;
                var filesInFolder = resultsByFolder[path];
                filesInFolder.sort(function(a, b) {
                    if (currentSort.column === 'name_date') {
                        var dateComparison = b.modified.getTime() - a.modified.getTime();
                        if (dateComparison !== 0) return dateComparison;
                        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                    } else if (currentSort.column === 'name') {
                        var nameA = a.name.toLowerCase();
                        var nameB = b.name.toLowerCase();
                        if (nameA < nameB) return currentSort.order === 'asc' ? -1 : 1;
                        if (nameA > nameB) return currentSort.order === 'asc' ? 1 : -1;
                        return 0;
                    } else {
                        return currentSort.order === 'desc' ? b.modified.getTime() - a.modified.getTime() : a.modified.getTime() - b.modified.getTime();
                    }
                });
                for (var j = 0; j < filesInFolder.length; j++) {
                    var file = filesInFolder[j];
                    var modDate = file.modified;
                    var dateStr = modDate.getDate() + "/" + (modDate.getMonth() + 1) + "/" + modDate.getFullYear();
                    var itemText = file.displayName + "   [" + dateStr + "]";
                    var item = folderNode.add('item', itemText);
                    item.file = file;
                    if (typeof D9T_AE_ICON !== 'undefined') item.image = D9T_AE_ICON;
                }
            }
        }
        updateSortHeaders();
        var count = expandNodes(resultTree);
        if (count < 1 && !cancelSearch) {
            statusTxt.text = 'Nenhum projeto encontrado.';
            sortHeaderGrp.visible = false;
        } else if (cancelSearch) {
            statusTxt.text = 'Busca cancelada. ' + searchResults.length + ' resultado(s) parcial(is).';
            sortHeaderGrp.visible = searchResults.length > 0;
        } else {
            resultTree.visible = true;
            sortHeaderGrp.visible = true;
            var rowHeight = 21;
            var minHeight = rowHeight * 4;
            var maxHeight = 320;
            var calculatedHeight = count * rowHeight + 5;
            if (calculatedHeight < minHeight) {
                resultTree.size.height = minHeight;
            } else if (calculatedHeight > maxHeight) {
                resultTree.size.height = maxHeight;
            } else {
                resultTree.size.height = calculatedHeight;
            }
            statusTxt.text = searchResults.length + ' projeto(s) encontrado(s). Duplo-clique para abrir.';
        }
        win.layout.dontDraw = false;
        win.layout.layout(true);
    }

    function endSearch() {
        win.text = scriptName;
        cancelBtn.visible = false;
        searchBtn.enabled = true;
        selectFolderBtn.enabled = true;
        if (searchResults.length === 0) {
            sortHeaderGrp.visible = false;
        }
        win.layout.layout(true); // Garante que a janela se ajuste ao final da busca
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
    
    var helpFunction = function() {
        var helpWin = new Window("palette", "Ajuda - " + scriptName, undefined, { closeButton: true });
        // ... (código completo da função de ajuda omitido para brevidade)
        helpWin.add('button', undefined, 'Fechar').onClick = function() { helpWin.close(); };
        helpWin.show();
    };

    if (helpBtn.leftClick) {
        helpBtn.leftClick.onClick = helpFunction;
    } else { 
        helpBtn.onClick = helpFunction;
    }

    win.center();
    win.show();

    function expandNodes(nodeTree) {
        var count = 0;
        var branches = nodeTree.items;
        nodeTree.expanded = true;
        for (var i = 0; i < branches.length; i++) {
            if (branches[i].type == 'node') {
                branches[i].expanded = true;
                count += branches[i].items.length;
            }
            count++;
        }
        return count;
    }
}

//D9TFindProjectDialog();