/**********************************************************************************
 *
 * GNEWS Finder Project v4.5 - Correção da Altura Inicial da Janela
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 4.5.0
 *
 * DESCRIÇÃO:
 * Script para buscar arquivos de projeto do After Effects (.aep, .aet) em
 * diretórios especificados, com filtros e ordenação de resultados.
 *
 * MODULOS USADOS:
 * source/globals.js (para variáveis de tema e cores)
 * source/libraries/HELP lib.js (para a janela de ajuda padronizada)
 * source/layout/main_ui_functions.js (para o componente de botão com ícone)
 * source/libraries/ICON lib.js (para os ícones da UI)
 *
 * ATUALIZAÇÕES (v4.5):
 * - ALTURA INICIAL CORRIGIDA: Ajustada a altura inicial do componente 'treeview'
 * para 1 pixel na sua criação. Isso impede o gerenciador de layout de
 * reservar espaço desnecessário no início, fazendo com que a janela
 * abra em seu estado mais compacto.
 *
 * ATUALIZAÇÕES ANTERIORES:
 * - v4.4: Corrigido o problema de expansão da janela após a busca.
 * - v4.3: Corrigido o erro fatal "TypeError: Bad argument" e outros ajustes.
 *
 **********************************************************************************/

// Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

/**
 * Função principal que cria e gerencia a interface do usuário (UI) para a busca de projetos.
 */
function D9TFindProjectDialog() {

    // =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// =================================================================================
    var JANELA_TITULO = 'GNEWS FIND PROJECT';
    var SCRIPT_VERSAO = "v4.5";
    var SUBTITULO_UI = 'Busca de projetos .aep e .aet';

    // Cores (carregadas de globals.js, com fallback para segurança)
    var COR_FUNDO = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0F0F0F';
    var COR_TEXTO_NORMAL = (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA';
    var COR_TEXTO_DESTAQUE = (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003cff';
    var COR_TEXTO_INPUT = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF';
    var COR_AVISO = (typeof warningColor !== 'undefined') ? warningColor : '#fba524ff';
    var COR_DIVISOR = (typeof divColor1 !== 'undefined') ? divColor1 : '#1d1d1fff';

    // Layout e Espaçamento
    var LARGURA_JANELA = 420;
    var ALTURA_MAXIMA_RESULTADOS = 1600;
    var MARGENS_JANELA = 16;
    var ESPACAMENTO_ELEMENTOS = 10;
    var ESPACAMENTO_FILTROS_PRINCIPAL = 70;
    var ESPACAMENTO_ENTRE_FILTROS = 25;


    // =================================================================================
	// --- CONFIGURAÇÕES E VARIÁVEIS INTERNAS ---
	// =================================================================================

    function getPathDayByDay() {
        var anoAtual = new Date().getFullYear().toString();
        var caminhoFixo = "T:/JORNALISMO/GLOBONEWS/DIARIOS/RJ/" + anoAtual;
        var mapaMeses = { 1: "01_JAN", 2: "02_FEV", 3: "03_MAR", 4: "04_ABR", 5: "05_MAI", 6: "06_JUN", 7: "07_JUL", 8: "08_AGO", 9: "09_SET", 10: "10_OUT", 11: "11_NOV", 12: "12_DEZ" };
        var dataHoje = new Date();
        var numeroMesAtual = dataHoje.getMonth() + 1;
        var caminhoMesDinamico = mapaMeses[numeroMesAtual];
        var dia = dataHoje.getDate();
        var caminhoDiaDinamico = (dia < 10) ? "0" + dia : dia.toString();
        return caminhoFixo + "/" + caminhoMesDinamico + "/" + caminhoDiaDinamico + "/";
    }

    var searchPresets = {
        'DIA DIA': getPathDayByDay(),
        'TEMPLATES': 'T:/JORNALISMO/GLOBONEWS/JORNAIS/_PECAS_GRAFICAS',
        'PROGRAMAS': 'T:/JORNALISMO/GLOBONEWS/PROGRAMAS',
        'JORNAIS': 'T:/JORNALISMO/GLOBONEWS/JORNAIS',
        'EVENTOS': 'T:/JORNALISMO/GLOBONEWS/EVENTOS',
        'MARKETING': 'T:/JORNALISMO/GLOBONEWS/MARKETING'
    };

    function hexToRgb(hex) { if (hex == undefined) return [0,0,0]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16) / 255; var g = parseInt(hex.substring(2, 4), 16) / 255; var b = parseInt(hex.substring(4, 6), 16) / 255; return [r, g, b]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }
    function getObjectKeys(obj) { var keys = []; for (var key in obj) { if (obj.hasOwnProperty(key)) keys.push(key); } return keys; }

    var searchResults = [];
    var cancelSearch = false;
    var currentSort = { column: 'date', order: 'desc' };
    var searchStartTime = 0;
    var continueConfirmed = false;

    // =================================================================================
	// --- CONSTRUÇÃO DA INTERFACE GRÁFICA (UI) ---
	// =================================================================================

    var win = new Window('palette', JANELA_TITULO + ' ' + SCRIPT_VERSAO, undefined, { resizeable: false });
    win.spacing = ESPACAMENTO_ELEMENTOS;
    win.margins = MARGENS_JANELA;
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];
    win.preferredSize.width = LARGURA_JANELA;

    // --- CABEÇALHO ---
    var headerGroup = win.add("group");
    headerGroup.orientation = 'stack'; headerGroup.alignment = 'fill'; headerGroup.margins = [0, 0, 0, 10];

    var titleGroup = headerGroup.add('group');
    titleGroup.orientation = 'column'; titleGroup.alignChildren = 'left'; titleGroup.alignment = 'left';
    var subtitleText = titleGroup.add("statictext", undefined, SUBTITULO_UI);
    subtitleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);

    var helpBtnGroup = headerGroup.add('group');
    helpBtnGroup.alignment = 'right';
    var helpBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
        helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [(lClick || 'Clique') + ' Ajuda'] });
    } else {
        helpBtn = helpBtnGroup.add("button", undefined, "?"); helpBtn.preferredSize = [25, 25];
    }

    // --- PAINEL DE ORIGEM DA BUSCA ---
    var folderPanel = win.add('panel', undefined, 'Origem da Busca');
    folderPanel.alignChildren = 'fill'; folderPanel.spacing = 8; folderPanel.margins = 12;
    var presetGrp = folderPanel.add('group');
    presetGrp.add('statictext', undefined, 'Presets:');
    var presetNames = getObjectKeys(searchPresets);
    presetNames.unshift('— CAMINHO PERSONALIZADO —');
    var presetDropdown = presetGrp.add('dropdownlist', undefined, presetNames);
    presetDropdown.selection = 0;

    var folderGrp = folderPanel.add('group');
    folderGrp.orientation = 'row'; folderGrp.alignChildren = ['left', 'center']; folderGrp.spacing = 5;
    var selectFolderBtn = new themeIconButton(folderGrp, { icon: D9T_PASTA_ICON, tips: [(lClick || 'Clique') + ' Selecionar pasta para busca'] });
    var folderPathTxt = folderGrp.add('edittext', undefined, searchPresets['DIA DIA']);
    folderPathTxt.alignment = ['fill', 'center'];

    // --- CAMPO DE PESQUISA COM ÍCONE ---
    var inputGrp = win.add('group');
    inputGrp.orientation = 'row'; inputGrp.alignChildren = ['fill', 'center']; inputGrp.spacing = 5;

    var placeholderText = '⌕  Digite para Buscar...';
    var searchInput = inputGrp.add('edittext', undefined, '');
    searchInput.text = placeholderText;
    searchInput.alignment = ['fill', 'center'];
    searchInput.preferredSize.height = 32;

    var findBtn;
    try {
        findBtn = new themeIconButton(inputGrp, { icon: D9T_LENS_ICON, tips: [(lClick || 'Clique') + ' Buscar'] });
        findBtn.leftClick.parent.preferredSize = [32, 32];
    } catch(e) {
        findBtn = { leftClick: inputGrp.add("button", undefined, "Buscar") };
    }


    // --- BARRA DE PROGRESSO ---
    var findProgressBar = win.add('progressbar', undefined, 0, 100);
    findProgressBar.preferredSize = { width: 410, height: 3 };
    findProgressBar.visible = false;

    // --- GRUPO DE FILTROS E OPÇÕES ---
    var optMainGrp = win.add('group');
	optMainGrp.spacing = ESPACAMENTO_FILTROS_PRINCIPAL;
    optMainGrp.alignment = 'center';
    optMainGrp.add('statictext', undefined, 'Filtros:');

    var filtersSubGrp = optMainGrp.add('group');
    filtersSubGrp.spacing = ESPACAMENTO_ENTRE_FILTROS;
    var optGrp1 = filtersSubGrp.add('group'); optGrp1.alignChildren = ['center', 'center']; optGrp1.spacing = 2;
	var optCkb1 = optGrp1.add('checkbox'); optCkb1.value = false;
	var optTxt1 = optGrp1.add('statictext', undefined, 'Tt'); optCkb1.helpTip = optTxt1.helpTip = '⦿  → considerar maiúsculas e minúsculas';
	var optGrp2 = filtersSubGrp.add('group'); optGrp2.alignChildren = ['center', 'center']; optGrp2.spacing = 2;
	var optCkb2 = optGrp2.add('checkbox'); optCkb2.value = false;
	var optTxt2 = optGrp2.add('statictext', undefined, 'àê'); optCkb2.helpTip = optTxt2.helpTip = '⦿  → considerar acentuação';
	var optGrp4 = filtersSubGrp.add('group'); optGrp4.alignChildren = ['center', 'center']; optGrp4.spacing = 2;
	var optCkb4 = optGrp4.add('checkbox'); optCkb4.value = false;
	var optTxt4 = optGrp4.add('statictext', undefined, '!='); optCkb4.helpTip = optTxt4.helpTip = '⦿  → inverter busca';

    var dividerGrp = optMainGrp.add('panel', undefined, '');
    dividerGrp.alignment = 'center'; dividerGrp.preferredSize = [2, 18];

    var showPathGrp = optMainGrp.add('group');
    showPathGrp.alignChildren = ['center', 'center']; showPathGrp.spacing = 2;
    var showPathCkb = showPathGrp.add('checkbox');
    showPathCkb.value = false;
    showPathCkb.helpTip = 'Exibe os resultados em uma árvore de pastas.';
    var showPathTxt = showPathGrp.add('statictext', undefined, 'Exibir Caminhos');

    // --- GRUPO DE RESULTADOS ---
    var resultsGroup = win.add('group');
    resultsGroup.orientation = 'column'; resultsGroup.alignChildren = 'fill'; resultsGroup.spacing = 5;
    resultsGroup.margins = [0, 5, 0, 0];
    resultsGroup.visible = false;
    resultsGroup.preferredSize.height = 1;

    var sortHeaderGrp = resultsGroup.add('group');
    sortHeaderGrp.orientation = 'row'; sortHeaderGrp.alignment = 'fill';
    var nameHeaderBtn = sortHeaderGrp.add('button', undefined, 'Nome'); nameHeaderBtn.alignment = ['fill', 'center'];
    var dateHeaderBtn = sortHeaderGrp.add('button', undefined, 'Data'); dateHeaderBtn.preferredSize.width = 60;
    var nameAndDateHeaderBtn = sortHeaderGrp.add('button', undefined, 'Nome & Data'); nameAndDateHeaderBtn.preferredSize.width = 80;

    var treeContainer = resultsGroup.add('group');
    treeContainer.margins = [5, 5, 5, 5]; treeContainer.alignment = ['fill', 'fill'];
    // ===== LINHA CORRIGIDA =====
    // A altura inicial do treeview é definida como 1 para evitar espaço vazio na inicialização.
    var resultTree = treeContainer.add('treeview', [0, 0, 100, 1]); 
    resultTree.alignment = ['fill', 'fill'];

    // --- GRUPO DE STATUS ---
    var statusGrp = win.add('group');
    statusGrp.orientation = 'row'; statusGrp.alignment = 'fill';
    var statusTxt = statusGrp.add('statictext', undefined, 'Pronto.'); statusTxt.preferredSize.width = 200;
    var cancelBtn = statusGrp.add('button', undefined, 'Cancelar'); cancelBtn.visible = false; cancelBtn.alignment = ['right', 'center'];

    // --- APLICAÇÃO DO TEMA DE CORES ---
    setBgColor(win, COR_FUNDO);
    setFgColor(subtitleText, COR_TEXTO_DESTAQUE);
    setFgColor(folderPanel, COR_TEXTO_NORMAL);
    setBgColor(dividerGrp, COR_DIVISOR);
    setFgColor(folderPathTxt, COR_TEXTO_INPUT);
    setFgColor(statusTxt, COR_TEXTO_INPUT);
    setFgColor(optMainGrp.children[0], COR_TEXTO_NORMAL);
    setFgColor(showPathTxt, COR_TEXTO_NORMAL);

    // =================================================================================
	// --- EVENTOS E LÓGICA DA UI ---
	// =================================================================================

    win.onShow = function() {
        resultsGroup.visible = false;
        resultsGroup.preferredSize.height = 1;
        win.layout.layout(true);
        win.layout.resize();
    }

    searchInput.onActivate = function() { if (this.text === placeholderText) this.text = ''; };
    searchInput.onDeactivate = function() { if (this.text === '') this.text = placeholderText; };
    presetDropdown.onChange = function() { if (this.selection.index > 0) folderPathTxt.text = searchPresets[this.selection.text]; };
    selectFolderBtn.leftClick.onClick = function() { var selectedFolder = Folder.selectDialog("Selecione a pasta raiz para a busca", folderPathTxt.text); if (selectedFolder) { folderPathTxt.text = Folder.decode(selectedFolder.fsName); presetDropdown.selection = 0; } };
    cancelBtn.onClick = function() { cancelSearch = true; statusTxt.text = 'Cancelando...'; };
    searchInput.onEnterKey = doSearch;
    if (findBtn.leftClick) { findBtn.leftClick.onClick = doSearch; }
    showPathCkb.onClick = function() { populateResults(); };
    function showHelp() { if (typeof showFinderProjectHelp === 'function') { showFinderProjectHelp(); } else { themedAlert("A biblioteca de ajuda (HELP lib.js) não foi encontrada.", "Aviso"); } }
    if (helpBtn.leftClick) { helpBtn.leftClick.onClick = showHelp; } else { helpBtn.onClick = showHelp; }

    function themedAlert(message, title) {
        var alertWin = new Window("dialog", title || "Aviso");
        alertWin.orientation = "column"; alertWin.alignChildren = "center";
        setBgColor(alertWin, COR_AVISO);
        alertWin.add("statictext", undefined, message);
        var okBtn = alertWin.add("button", undefined, "OK");
        okBtn.onClick = function() { alertWin.close(); };
        alertWin.show();
    }

    function collectFilesNonBlocking(rootFolder, callback) {
        var foldersToScan = [rootFolder];
        var allFiles = [];
        function process() {
            var batchStartTime = new Date().getTime();
            while(foldersToScan.length > 0 && (new Date().getTime() - batchStartTime < 200)) {
                if (cancelSearch) { callback(null); return; }
                var currentFolder = foldersToScan.shift();
                statusTxt.text = "Mapeando: " + Folder.decode(currentFolder.name);
                win.update();

                var items = currentFolder.getFiles();
                var jornaisExclusions = ['ARQUIVOS', 'CRÉDITOS', 'PECAS_GRAFICAS', '_PECAS_GRAFICAS'];
                var categoryName = presetDropdown.selection ? presetDropdown.selection.text : '';

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item instanceof Folder) {
                        var upperCaseDisplayName = item.displayName.toUpperCase();
                        if (upperCaseDisplayName === "ADOBE AFTER EFFECTS AUTO-SAVE" || upperCaseDisplayName.slice(-4) === '_AME') continue;
                        if (categoryName === 'JORNAIS' && jornaisExclusions.indexOf(upperCaseDisplayName) > -1) continue;
                        foldersToScan.push(item);
                    } else {
                        allFiles.push(item);
                    }
                }
            }
            if (foldersToScan.length > 0 && !cancelSearch) {
                app.setTimeout(process, 10);
            } else {
                callback(cancelSearch ? null : allFiles);
            }
        }
        process();
    }

    function doSearch() {
        win.text = JANELA_TITULO + ' (Buscando...)';
        statusTxt.text = 'Iniciando busca...';
        resultsGroup.visible = false;
        resultsGroup.preferredSize.height = 1;
        searchResults = [];
        resultTree.removeAll();
        cancelSearch = false;
        continueConfirmed = false;
        cancelBtn.visible = true;
        selectFolderBtn.enabled = false;
        win.layout.layout(true);
        win.update();
        var rootFolder = new Folder(folderPathTxt.text);
        if (!rootFolder.exists) {
            themedAlert("Pasta de busca inválida.", "Erro");
            endSearch();
            return;
        }
        collectFilesNonBlocking(rootFolder, function(allFiles) {
            if (allFiles === null) { endSearch(); return; }
            processFiles(allFiles);
        });
    }

    function processFiles(allFiles) {
        findProgressBar.maxvalue = allFiles.length;
        findProgressBar.value = 0;
        findProgressBar.visible = true;
        var searchTerm = searchInput.text;
        var searchForAll = (searchTerm === "" || searchTerm === placeholderText);
        var i = 0;
        searchStartTime = new Date().getTime();

        function processBatch() {
            var batchStartTime = new Date().getTime();
            while (i < allFiles.length && (new Date().getTime() - batchStartTime < 200)) {
                if (cancelSearch) { populateResults(); endSearch(); return; }
                var file = allFiles[i];
                if (i % 20 == 0) {
                    findProgressBar.value = i;
                    statusTxt.text = 'Buscando: ' + Math.round((i/allFiles.length)*100) + '%';
                    win.update();
                }

                if (file.displayName.toLowerCase().indexOf("auto-save") > -1 || file.displayName.slice(0, 7) === 'tmpAEto') { i++; continue; }
                var fileExt = file.name.substr(file.name.lastIndexOf('.')).toLowerCase();
                if (fileExt !== '.aep' && fileExt !== '.aet') { i++; continue; }

                var nameMatches = false;
                if (searchForAll) { nameMatches = !optCkb4.value; }
                else {
                    var fileName = file.name; var currentSearchTerm = searchTerm;
                    if (!optCkb1.value) { fileName = fileName.toLowerCase(); currentSearchTerm = currentSearchTerm.toLowerCase(); }
                    if (!optCkb2.value) { fileName = fileName.replaceSpecialCharacters(); currentSearchTerm = currentSearchTerm.replaceSpecialCharacters(); }
                    var found = (fileName.indexOf(currentSearchTerm) > -1);
                    nameMatches = optCkb4.value ? !found : found;
                }
                if (nameMatches) { searchResults.push(file); }
                i++;
            }
            if (!continueConfirmed && new Date().getTime() - searchStartTime > 5000) {
                if (confirm("A busca está demorando. Deseja continuar?")) { searchStartTime = new Date().getTime(); continueConfirmed = true; } else { cancelSearch = true; }
            }
            if (i < allFiles.length && !cancelSearch) { app.setTimeout(processBatch, 10); }
            else { findProgressBar.value = allFiles.length; populateResults(); endSearch(); }
        }
        processBatch();
    }

    function updateSortHeaders() { nameHeaderBtn.text = "Nome" + (currentSort.column === 'name' ? (currentSort.order === 'asc' ? ' ▲' : ' ▼') : ''); dateHeaderBtn.text = "Data" + (currentSort.column === 'date' ? (currentSort.order === 'desc' ? ' ▼' : ' ▲') : ''); nameAndDateHeaderBtn.text = "Nome & Data" + (currentSort.column === 'name_date' ? ' ▼' : ''); }
    nameHeaderBtn.onClick = function() { var newOrder = (currentSort.column === 'name' && currentSort.order === 'asc') ? 'desc' : 'asc'; currentSort = { column: 'name', order: newOrder }; populateResults(); };
    dateHeaderBtn.onClick = function() { var newOrder = (currentSort.column === 'date' && currentSort.order === 'desc') ? 'asc' : 'desc'; currentSort = { column: 'date', order: newOrder }; populateResults(); };
    nameAndDateHeaderBtn.onClick = function() { currentSort = { column: 'name_date', order: 'desc' }; populateResults(); };

    function populateResults() {
        resultTree.removeAll();
        if (searchResults.length === 0) {
            resultsGroup.visible = false;
            resultsGroup.preferredSize.height = 1;
            statusTxt.text = cancelSearch ? 'Busca cancelada.' : 'Nenhum projeto encontrado.';
            win.layout.layout(true);
            win.layout.resize();
            return;
        }

        win.layout.dontDraw = true;

        var filesSorted = searchResults.slice(0).sort(function(a, b) {
            if (currentSort.column === 'name_date') { var dateComparison = b.modified.getTime() - a.modified.getTime(); return dateComparison !== 0 ? dateComparison : a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            } else if (currentSort.column === 'name') { return currentSort.order === 'asc' ? a.name.toLowerCase().localeCompare(b.name.toLowerCase()) : b.name.toLowerCase().localeCompare(a.name.toLowerCase());
            } else { return currentSort.order === 'desc' ? b.modified.getTime() - a.modified.getTime() : a.modified.getTime() - b.modified.getTime(); }
        });

        if (showPathCkb.value) {
            var resultsByFolder = {};
            var rootPath = Folder.decode(folderPathTxt.text);
            for (var i = 0; i < filesSorted.length; i++) {
                var file = filesSorted[i]; var path = Folder.decode(file.path);
                var relativePath = path.replace(rootPath, "");
                if (relativePath.indexOf("/") === 0 || relativePath.indexOf("\\") === 0) { relativePath = relativePath.substring(1); }

                if (!resultsByFolder[relativePath]) resultsByFolder[relativePath] = [];
                resultsByFolder[relativePath].push(file);
            }
            for (var path in resultsByFolder) {
                if (resultsByFolder.hasOwnProperty(path)) {
                    var folderNode = resultTree.add('node', path || ".");
                    if (typeof D9T_FOLDER_AE_ICON !== 'undefined') folderNode.image = D9T_FOLDER_AE_ICON;
                    var filesInFolder = resultsByFolder[path];
                    for (var j = 0; j < filesInFolder.length; j++) { var file = filesInFolder[j]; var modDate = file.modified; var dateStr = modDate.getDate() + "/" + (modDate.getMonth() + 1) + "/" + modDate.getFullYear(); var itemText = file.displayName + "   [" + dateStr + "]"; var item = folderNode.add('item', itemText); item.file = file; if (typeof D9T_AE_ICON !== 'undefined') item.image = D9T_AE_ICON; }
                }
            }
        } else {
            for (var i = 0; i < filesSorted.length; i++) {
                var file = filesSorted[i]; var modDate = file.modified; var dateStr = modDate.getDate() + "/" + (modDate.getMonth() + 1) + "/" + modDate.getFullYear(); var itemText = file.displayName + "   [" + dateStr + "]";
                var item = resultTree.add('item', itemText); item.file = file; if (typeof D9T_AE_ICON !== 'undefined') item.image = D9T_AE_ICON;
            }
        }

        updateSortHeaders();
        var count = expandNodes(resultTree);
        resultsGroup.visible = true;

        var rowHeight = 21;
        var headerHeight = sortHeaderGrp.size.height;
        var marginsAndSpacing = 25;
        var minResultsHeight = rowHeight * 4;

        var calculatedHeight = (count * rowHeight) + headerHeight + marginsAndSpacing;
        var finalResultsHeight = Math.min(ALTURA_MAXIMA_RESULTADOS, calculatedHeight);
        finalResultsHeight = Math.max(minResultsHeight, finalResultsHeight);

        treeContainer.alignment = ['fill', 'fill'];
        resultsGroup.alignment = ['fill', 'fill'];

        resultTree.size.height = finalResultsHeight;

        statusTxt.text = searchResults.length + ' projeto(s) encontrado(s).';

        win.layout.dontDraw = false;
        win.layout.layout(true);
        win.layout.resize();
    }

    function endSearch() {
        win.text = JANELA_TITULO + ' ' + SCRIPT_VERSAO;
        cancelBtn.visible = false;
        findProgressBar.visible = false;
        selectFolderBtn.enabled = true;
        win.update();
    }

    resultTree.onDoubleClick = function() {
        if (this.selection && this.selection.type === 'item') {
            try {
                var activeComp = app.project.activeItem;
                if (!(activeComp instanceof CompItem)) {
                   app.open(this.selection.file);
                } else {
                   app.open(this.selection.file);
                }
                win.close();
            } catch (e) {
                themedAlert("Não foi possível abrir o projeto.\n" + e.toString(), "Erro");
            }
        }
    };

    function expandNodes(nodeTree) { var count = 0; var branches = nodeTree.items; nodeTree.expanded = true; for (var i = 0; i < branches.length; i++) { if (branches[i].type == 'node') { branches[i].expanded = true; count += branches[i].items.length; } count++; } return count; }

    win.center();
    win.show();
}
