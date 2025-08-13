/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function D9TFindProjectDialog() {
    var scriptName = 'BUSCAR PROJETOS';
    var SETTINGS_SECTION = "D9TSearch"; // Seção para salvar as preferências

    // --- PRESETS DE CAMINHOS ---
    var searchPresets = {
        'DIA DIA': 'T:\\JORNALISMO\\GLOBONEWS\\DIARIOS\\RJ\\2025\\',
        'TEMPLATES': 'T:\\JORNALISMO\\GLOBONEWS\\JORNAIS\\_PECAS_GRAFICAS',
        'PROGRAMAS': 'T:\\JORNALISMO\\GLOBONEWS\\PROGRAMAS',
        'JORNAIS': 'T:\\JORNALISMO\\GLOBONEWS\\JORNAIS',
        'EVENTOS': 'T:\\JORNALISMO\\GLOBONEWS\\EVENTOS',
        'MARKETING': 'T:\\JORNALISMO\\GLOBONEWS\\MARKETING'
    };

    // --- Cores e Funções de Estilo ---
    var bgColor1 = '#0B0D0E';
    var normalColor1 = '#C7C8CA';
    var highlightColor1 = '#E0003A';

    // FUNÇÃO HELPER PARA COMPATIBILIDADE (SUBSTITUI Object.keys)
    function getObjectKeys(obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
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

    // --- Lógica da Busca ---
    var searchResults = [];
    var cancelSearch = false;

    // --- Interface Gráfica ---
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
        helpBtn = new themeIconButton(helpBtnGroup, {
            icon: D9T_INFO_ICON,
            tips: [(lClick || 'Clique') + ' Ajuda']
        });
    } else {
        helpBtn = headerGrp.add("button", undefined, "?");
        helpBtn.preferredSize = [24, 24];
        helpBtn.alignment = ['right', 'center'];
    }

var searchCancelIcon = {
    inactive: D9T_CLOSE32_ICON.null,    // Estado inativo (antes da pesquisa)
    normal: D9T_CLOSE32_ICON.normal,    // Estado normal (durante a pesquisa)
    hover: D9T_CLOSE32_ICON.hover       // Estado hover
};
    
    // --- GRUPO DE PRESETS ---
    var presetGrp = win.add('group');
    presetGrp.orientation = 'row';
    presetGrp.alignChildren = ['left', 'center'];
    presetGrp.add('statictext', undefined, 'Presets:');
    
    var presetNames = getObjectKeys(searchPresets); // USA A NOVA FUNÇÃO
    presetNames.unshift('— CAMINHO PERSONALIZADO —'); // Adiciona opção para caminho manual
    var presetDropdown = presetGrp.add('dropdownlist', undefined, presetNames);
    presetDropdown.preferredSize.width = 265;

    var folderGrp = win.add('group');
    folderGrp.alignment = 'fill';
    var selectFolderBtn = new themeIconButton(folderGrp, {
        icon: D9T_PASTA_ICON || undefined,
        tips: [(lClick || 'Clique') + ' Selecionar pasta para busca']
    });

    var defaultPath = searchPresets['DIA DIA']; // Define o caminho padrão
    var folderPathTxt = folderGrp.add('edittext', undefined, defaultPath);
    folderPathTxt.preferredSize.width = 280;

    presetDropdown.selection = presetDropdown.find('DIA DIA'); // Define o preset padrão na UI

    var searchGrp = win.add('group');
    searchGrp.alignment = 'fill';
    
    var searchInput = searchGrp.add('edittext'); 
    searchInput.preferredSize.width = 280; 

    var searchBtn = new themeIconButton(searchGrp, {
        icon: D9T_LENS_ICON || undefined,
        tips: [(lClick || 'Clique') + ' Buscar projetos']
        
    });

searchInput.text = '⌕  Digite para buscar...';
searchInput.active = false; // Para que não apareça selecionado

// Eventos para comportamento de placeholder:
searchInput.onActivate = function() {
    if (this.text === '⌕  Digite para buscar...') {
        this.text = '';
    }
};

searchInput.onDeactivate = function() {
    if (this.text === '') {
        this.text = '⌕  Digite para buscar...';
    }
};
    var resultTree = win.add('treeview', [0, 0, 320, 0]);
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

    // --- Aplicar Tema ---
    setBgColor(win, bgColor1);
    setFgColor(titleText, normalColor1);
    setFgColor(folderPathTxt, normalColor1);
    setFgColor(statusTxt, normalColor1);

    // --- Eventos da Interface ---

    // Evento para o dropdown de presets
    presetDropdown.onChange = function() {
        if (this.selection.index === 0) { // Se for "CAMINHO PERSONALIZADO"
            return; // Não faz nada, espera a seleção manual
        }
        var selectedName = this.selection.text;
        var newPath = searchPresets[selectedName];
        folderPathTxt.text = newPath;
        folderPathTxt.helpTip = newPath;
        app.settings.saveSetting(SETTINGS_SECTION, "lastProjectPath", newPath); // Salva para persistência
    };

    // Evento para o botão de selecionar pasta manualmente
    selectFolderBtn.leftClick.onClick = function() {
        var selectedFolder = Folder.selectDialog("Selecione a pasta raiz para a busca", folderPathTxt.text);
        if (selectedFolder) {
            var newPath = Folder.decode(selectedFolder.fsName);
            folderPathTxt.text = newPath;
            folderPathTxt.helpTip = newPath;
            app.settings.saveSetting(SETTINGS_SECTION, "lastProjectPath", newPath);
            presetDropdown.selection = 0; // Define o dropdown para "CAMINHO PERSONALIZADO"
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
                    if(cancelSearch) break;
                    var file = files[i];
                    if (file instanceof Folder) {
                        searchQueue.push(file);
                    } else {
                        if ((file.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) && (file.name.match(/\.(aep|aet)$/i))) {
                            searchResults.push(file);
                        }
                    }
                }
            }
            app.setTimeout(processQueue, 10);
        }
        processQueue();
    }

    function populateResults() {
        var resultsByFolder = {};
        for (var i = 0; i < searchResults.length; i++) {
            var file = searchResults[i];
            var path = Folder.decode(file.path);
            if (!resultsByFolder[path]) {
                resultsByFolder[path] = [];
            }
            resultsByFolder[path].push(file);
        }

        for (var path in resultsByFolder) {
            if (resultsByFolder.hasOwnProperty(path)) {
                var folderNode = resultTree.add('node', path);
                if (typeof D9T_FOLDER_AE_ICON !== 'undefined') folderNode.image = D9T_FOLDER_AE_ICON;

                for (var j = 0; j < resultsByFolder[path].length; j++) {
                    var file = resultsByFolder[path][j];
                    var modDate = file.modified;
                    var dateStr = modDate.getDate() + "/" + (modDate.getMonth() + 1) + "/" + modDate.getFullYear();
                    var itemText = file.displayName + "   [" + dateStr + "]";
                    var item = folderNode.add('item', itemText);
                    item.file = file;
                    if (typeof D9T_AE_ICON !== 'undefined') item.image = D9T_AE_ICON;
                }
            }
        }

        var count = expandNodes(resultTree);

        if (count < 1 && !cancelSearch) {
            statusTxt.text = 'Nenhum projeto encontrado.';
        } else if (cancelSearch) {
            statusTxt.text = 'Busca cancelada. ' + searchResults.length + ' resultado(s) parcial(is).';
        } else {
             resultTree.visible = true;
            resultTree.size.height = count >= 16 ? 320 : count * 21 + 5;
            statusTxt.text = searchResults.length + ' projeto(s) encontrado(s). Duplo-clique para abrir.';
        }
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
    
    var helpFunction = function() {
        var TARGET_HELP_WIDTH = 450;
        var MARGIN_SIZE = 15;
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
        var TOPIC_SPACING = 5;
        var TOPIC_TITLE_INDENT = 0;
        var SUBTOPIC_INDENT = 25;

        var helpWin = new Window("palette", "Ajuda - " + scriptName, undefined, { closeButton: true });
        helpWin.orientation = "column";
        helpWin.alignChildren = ["fill", "fill"];
        helpWin.spacing = 10;
        helpWin.margins = MARGIN_SIZE;
        
        helpWin.preferredSize = [TARGET_HELP_WIDTH, -1];

        setBgColor(helpWin, bgColor1);
        
        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column";
        headerPanel.alignChildren = ["fill", "top"];
        headerPanel.alignment = ["fill", "top"];
        headerPanel.spacing = 10;
        headerPanel.margins = 15;
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - BUSCAR PROJETOS");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        setFgColor(titleText, highlightColor1);

        var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta localiza arquivos de projeto do After Effects (.aep, .aet) recursivamente a partir de uma pasta inicial.", {multiline: true});
        mainDescText.alignment = ["fill", "fill"];
        setFgColor(mainDescText, normalColor1);

        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"];
        topicsTabPanel.margins = 15;

        var allHelpTopics = [
            {
                tabName: "COMO USAR",
                topics: [
                    { title: "▶ PRESETS:", text: "Use o menu 'Presets' para selecionar rapidamente um caminho de busca comum. O caminho será preenchido automaticamente."},
                    { title: "▶ CAMINHO MANUAL:", text: "Clique no ícone de pasta para escolher um diretório que não está na lista de presets. O menu mudará para 'CAMINHO PERSONALIZADO'."},
                    { title: "▶ BUSCA E RESULTADOS:", text: "Digite o termo de busca e clique na lupa. Dê um duplo-clique em um item na lista de resultados para abri-lo." }
                ]
            },
            {
                tabName: "FUNCIONALIDADES",
                topics: [
                    { title: "▶ BUSCA RECURSIVA:", text: "A busca não se limita à pasta selecionada, ela se estende a todas as subpastas contidas nela." },
                    { title: "▶ CANCELAMENTO:", text: "Durante uma busca longa, o botão 'Cancelar' fica visível. Clicá-lo interrompe o processo e exibe os resultados parciais encontrados até aquele momento." },
                    { title: "▶ MEMÓRIA DE PASTA:", text: "O script memoriza a última pasta utilizada (seja de um preset ou manual), mas sempre iniciará com o preset 'DIA DIA' selecionado." }
                ]
            }
        ];

        for (var s = 0; s < allHelpTopics.length; s++) {
            var currentTabSection = allHelpTopics[s];
            var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
            tab.orientation = "column";
            tab.alignChildren = ["fill", "top"];
            tab.spacing = 10;
            tab.margins = TOPIC_SECTION_MARGINS;

            for (var i = 0; i < currentTabSection.topics.length; i++) {
                var topic = currentTabSection.topics[i];
                var topicGrp = tab.add("group");
                topicGrp.orientation = "column";
                topicGrp.alignChildren = "fill";
                topicGrp.spacing = TOPIC_SPACING;
                
                topicGrp.margins.left = (topic.title.indexOf("▶") === 0) ? TOPIC_TITLE_INDENT : SUBTOPIC_INDENT;

                var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                setFgColor(topicTitle, highlightColor1);

                if(topic.text !== ""){
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    setFgColor(topicText, normalColor1);
                }
            }
        }

        var closeBtnGrp = helpWin.add("group");
        closeBtnGrp.alignment = "center";
        closeBtnGrp.margins = [0, 10, 0, 0];
        var closeBtn = closeBtnGrp.add("button", undefined, "Fechar");
        closeBtn.onClick = function() {
            helpWin.close();
        };

        helpWin.layout.layout(true);
        helpWin.center();
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
                count += expandNodes(branches[i]);
            }
            count++;
        }
        return count;
    }
}
