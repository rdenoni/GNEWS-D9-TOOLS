/* HISTÓRICO DE VERSÕES 
    ===================== 
    v4.7 (29/08/2025) - SOLICITADO PELO USUÁRIO
    - Alterado o local de salvamento e leitura do cache para a pasta 'source/cache/' dentro da estrutura do GNEWS-D9-TOOLS.
    - Adicionada criação automática da pasta de cache se ela não existir.

    v4.6 (17/08/2025)
    - Corrigido o redimensionamento da janela principal ao alternar entre as visões.
    - Janela de Ajuda alterada para "palette" para não bloquear a interface principal.
    - Removidos alertas de diagnóstico.

    v4.5 (17/08/2025)
    - Adicionados alertas de diagnóstico para o bug de redimensionamento do painel de detalhes.
    - Removido o bloqueio de tela (win.enabled) da janela de Ajuda.
*/

(function () {

    // =================================================================================
    // CONFIGURAÇÕES RÁPIDAS DE LAYOUT (EASY_CONFIG)
    // =================================================================================
    var EASY_CONFIG = {
        THUMBNAIL_SIZE: 69,
        THUMBNAIL_SIZE_16_9_WIDTH: 166,
        THUMBNAIL_PADDING: 8,
        GRID_COLUMNS_ICONS: 7,
        GRID_COLUMNS_IMAGES: 3,
        GRID_ROWS_ICONS: 5,
        GRID_ROWS_IMAGES: 4,
        PREVIEW_PADDING: 5,
        PREVIEW_SIZE_SQUARE: 170,
        PREVIEW_SIZE_16_9_WIDTH: 270,
        ICON_ROOT_PATH: [], // MODIFICADO: Agora um array
        IMAGE_ROOT_PATH: [] // MODIFICADO: Agora um array
    };

    // =================================================================================
    // CONFIGURAÇÕES INTERNAS
    // =================================================================================
    var UI_METRICS = {
        DETAILS_PANEL_WIDTH: 250, 
        SEARCH_BOX_WIDTH: 160, 
        DROPDOWN_WIDTH: 140,
        SORT_DROPDOWN_WIDTH: 100,
        BIG_FONT: ScriptUI.newFont("Arial", "Bold", 14),
        PLACEHOLDER_FONT: ScriptUI.newFont("Arial", "Bold", 24)
    };
    var CONFIG = {
        SETTINGS_FILENAME: "libraryLive_Settings.json",
        CACHE_FOLDER: "source/cache/", // ALTERADO: Caminho centralizado do cache
        CACHE_FILENAME_ICONS: "libraryLive_Icons_Cache.json",
        CACHE_FILENAME_IMAGES: "libraryLive_Images_Cache.json",
    };
    var THEME = {
        bgColor: '#0D0A0Aff', panelBgColor: '#0D0A0Aff', detailsBgColor: '#0D0A0Aff',
        statusPanelBgColor: '#0D0A0Aff',
        normalColor: '#efefefff', highlightColor: '#D3003Aff', slotBgColor: '#181818ff',
        buttonHoverColor: '#383838ff'
    };
    var SCRIPT_INFO = { name: "LibraryLive", version: "2.4" };
    
    // --- JANELA DE AJUDA ---
    function showIconBrowserHelp() {
        try {
            var helpTheme = { bgColor: [0.05, 0.04, 0.04, 1], normalColor: [0.93, 0.93, 0.93, 1], highlightColor: [0.83, 0, 0.23, 1] };
            function setHelpFgColor(element, color) { try { if (element && element.graphics) { element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1); } } catch (e) {} }
            
            var helpWin = new Window("palette", SCRIPT_INFO.name + " - Ajuda", undefined, { closeButton: true });
            helpWin.orientation = "column";
            helpWin.alignChildren = ["fill", "fill"];
            helpWin.spacing = 10;
            helpWin.margins = 15;
            helpWin.preferredSize.width = 500;
            helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, helpTheme.bgColor);

            var headerPanel = helpWin.add("panel", undefined, "");
            headerPanel.orientation = "column"; headerPanel.alignChildren = ["fill", "top"]; headerPanel.alignment = ["fill", "top"]; headerPanel.spacing = 10; headerPanel.margins = 15;
            
            var titleText = headerPanel.add("statictext", undefined, "Ajuda - " + SCRIPT_INFO.name);
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16); titleText.alignment = ["center", "center"];
            setHelpFgColor(titleText, helpTheme.highlightColor);

            var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta permite navegar, buscar e importar mídias (ícones e imagens) diretamente para o seu projeto.", {multiline: true});
            mainDescText.alignment = ["fill", "fill"]; mainDescText.preferredSize.height = 40; setHelpFgColor(mainDescText, helpTheme.normalColor);

            var topicsTabPanel = helpWin.add("tabbedpanel");
            topicsTabPanel.alignment = ["fill", "fill"]; topicsTabPanel.margins = 15;
            
            var allHelpTopics = [ { tabName: "FUNCIONALIDADES", topics: [ { title: "▶ Navegação e Visualização", text: "Use o menu 'Pasta' para alternar entre a visualização de 'Icones' (quadrados) e 'Imagens' (16:9). A grade e o painel de preview se ajustarão automaticamente." }, { title: "▶ Importar um Item (Duplo-Clique)", text: "Dê um duplo-clique em qualquer item para importá-lo para o seu projeto atual. Se uma composição estiver aberta, o item será adicionado como uma nova camada no centro." }, { title: "▶ Ver Detalhes (Clique Simples)", text: "Clique uma vez em um item para selecioná-lo. Isso exibirá uma pré-visualização maior e informações detalhadas como nome, tipo, tamanho e data no painel 'Detalhes' à direita." }, { title: "▶ Paginação", text: "Use as setas ◄ e ► abaixo da grade para navegar entre as páginas de resultados." } ] }, { tabName: "BUSCA E CONFIGURAÇÃO", topics: [ { title: "▶ Busca e Filtros", text: "Digite no campo 'Buscar' para filtrar os itens por nome. Use os menus 'Categoria' e 'Ordenar por' para refinar ainda mais os resultados." }, { title: "▶ Botão de Atualizar (↻)", text: "Clique neste botão para forçar o script a re-escanear suas pastas de origem. Use isso se você adicionou, removeu ou renomeou arquivos enquanto o painel estava aberto." }, { title: "▶ Definindo as Pastas", text: "IMPORTANTE: Para configurar quais pastas usar para 'Icones' e 'Imagens', clique com o BOTÃO DIREITO no ícone da ferramenta 'LibraryLive' na sua barra principal GND9TOOLS." } ] } ];

            for (var s = 0; s < allHelpTopics.length; s++) {
                var currentTabSection = allHelpTopics[s];
                var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
                tab.orientation = "column"; tab.alignChildren = ["fill", "top"]; tab.spacing = 10; tab.margins = [10, 15, 10, 10];
                for (var i = 0; i < currentTabSection.topics.length; i++) {
                    var topic = currentTabSection.topics[i];
                    var topicGrp = tab.add("group");
                    topicGrp.orientation = "column"; topicGrp.alignChildren = "fill"; topicGrp.spacing = 3;
                    var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                    topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                    setHelpFgColor(topicTitle, helpTheme.highlightColor);
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    setHelpFgColor(topicText, helpTheme.normalColor);
                }
            }
            
            var closeBtnGroup = helpWin.add("group");
            closeBtnGroup.alignment = "center"; closeBtnGroup.margins.top = 10;
            var closeBtn = closeBtnGroup.add("button", undefined, "OK");
            closeBtn.onClick = function() { helpWin.close(); };

            helpWin.center();
            helpWin.show();

        } catch(e) {
            alert("Erro ao abrir a janela de ajuda:\n" + e.toString() + "\nLinha: " + e.line);
        }
    }
    
    // --- Funções Auxiliares ---
    function hexToRgb(hex) { if (typeof hex !== 'string') return [1, 1, 1, 1]; var cleanHex = hex.replace('#', ''); var r = parseInt(cleanHex.substring(0, 2), 16) / 255; var g = parseInt(cleanHex.substring(2, 4), 16) / 255; var b = parseInt(cleanHex.substring(4, 6), 16) / 255; var a = (cleanHex.length === 8) ? (parseInt(cleanHex.substring(6, 8), 16) / 255) : 1; return [r, g, b, a]; }
    function setFgColor(element, hexColor) { try { if (element && element.graphics) { var color = hexToRgb(hexColor); element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1); } } catch (e) { } }
    function setBgColor(element, hexColor) { try { if (element && element.graphics) { var color = hexToRgb(hexColor); element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color); } } catch (e) { } }
    function addClickHandler(element, handler) { if (!element) return; if (element.leftClick) { element.leftClick.onClick = handler; } else { element.onClick = handler; } }
    function getObjectKeys(obj) { if (typeof obj !== 'object' || obj === null) return []; var keys = []; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { keys.push(key); } } return keys; }
    function formatFileSize(bytes) { if (bytes === null || isNaN(bytes)) return "-"; if (bytes === 0) return '0 Bytes'; if (bytes < 1024) return bytes + ' Bytes'; else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'; else return (bytes / 1048576).toFixed(1) + ' MB'; }
    function getFileType(filename) { var ext = ''; var dotIndex = filename.lastIndexOf('.'); if (dotIndex > -1) { ext = filename.substring(dotIndex + 1).toLowerCase(); } if (ext === 'png') return 'Imagem PNG'; if (ext === 'jpg' || ext === 'jpeg') return 'Imagem JPG'; return 'Arquivo'; }
    function simpleButton(parent, options) { var btn = parent.add('button', undefined, options.labelTxt); btn.preferredSize.width = options.width || 80; btn.preferredSize.height = options.height || 24; btn.leftClick = btn; return btn; }

    var State = { allIcons: [], filteredIcons: [], selectedIconData: null, lastClickTime: 0, lastClickedSlotId: -1, doubleClickDelay: 500, currentPage: 0, currentView: "Icones" };
    var UI = { elements: {}, gridSlots: [], activeSlot: null, win: null };
    var Logic = {};

    // ATUALIZADO: Lê a lista de caminhos (arrays) do arquivo de configuração.
    Logic.loadSettings = function () {
        var configFile = new File(scriptMainPath + 'source/config/LIBRARYLIVE_config.json');
        var defaultConfig = { icon_root_paths: [], image_root_paths: [] };
        var finalConfig = defaultConfig;
        
        if (configFile.exists) {
            try {
                configFile.open("r");
                var centralConfig = JSON.parse(configFile.read());
                configFile.close();
                if (centralConfig.tool_settings && centralConfig.tool_settings.LibraryLive) {
                    finalConfig = centralConfig.tool_settings.LibraryLive;
                }
            } catch (e) { /* Usa o default em caso de erro */ }
        }

        // Retrocompatibilidade: Converte string única para array se necessário
        if (finalConfig.icon_root_path && !finalConfig.icon_root_paths) {
            finalConfig.icon_root_paths = [finalConfig.icon_root_path];
        }
        if (finalConfig.image_root_path && !finalConfig.image_root_paths) {
            finalConfig.image_root_paths = [finalConfig.image_root_path];
        }

        // Carrega os arrays de caminhos
        EASY_CONFIG.ICON_ROOT_PATH = finalConfig.icon_root_paths || [];
        EASY_CONFIG.IMAGE_ROOT_PATH = finalConfig.image_root_paths || [];
    };

    Logic.stringify = function (obj) { try { return obj.toSource(); } catch (e) { return "{}"; } };
    
    // --- LÓGICA DE CACHE ATUALIZADA ---
    Logic.getCacheFile = function () {
        // Assume que scriptMainPath é uma variável global que termina com '/'
        var cacheFolderPath = scriptMainPath + CONFIG.CACHE_FOLDER;
        var cacheFolder = new Folder(cacheFolderPath);
        if (!cacheFolder.exists) {
            // Tenta criar a pasta de cache se ela não existir
            cacheFolder.create();
        }
        var filename = (State.currentView === "Icones") ? CONFIG.CACHE_FILENAME_ICONS : CONFIG.CACHE_FILENAME_IMAGES;
        return new File(cacheFolderPath + filename);
    };

    Logic.saveCache = function () { 
        try { 
            var cacheFile = Logic.getCacheFile();
            cacheFile.encoding = "UTF-8"; 
            cacheFile.open("w"); 
            cacheFile.write(Logic.stringify(State.allIcons)); 
            cacheFile.close(); 
        } catch (e) { 
            UI.logMessage("Não foi possível salvar o cache.", true); 
        } 
    };

    Logic.loadCache = function () { 
        var cacheFile = Logic.getCacheFile();
        if (!cacheFile.exists) return false; 
        try { 
            cacheFile.open("r"); 
            var content = cacheFile.read(); 
            cacheFile.close(); 
            if (content.length < 5) return false; 
            State.allIcons = eval("(" + content + ")"); 
            if (typeof State.allIcons !== 'object' || State.allIcons.length === undefined) { 
                State.allIcons = []; 
                return false; 
            } 
            return true; 
        } catch (e) { 
            UI.logMessage("Cache corrompido ou inválido.", true); 
            return false; 
        } 
    };
    
    Logic.scanFolder = function (folder, category) { var items = []; var extensionRegex = (State.currentView === "Imagens") ? /\.(png|jpg|jpeg)$/i : /\.png$/i; var files = folder.getFiles(); for (var i = 0; i < files.length; i++) { var file = files[i]; if (file instanceof File && extensionRegex.test(file.name)) { var modifiedDate = new Date(0); try { if (file.modified instanceof Date) { modifiedDate = file.modified; } } catch (e) { } items.push({ nome: decodeURI(file.name).replace(/\.[^.]+$/, "").replace(/[-_]/g, ' '), fullPath: file.fsName, categoria: category, modified: modifiedDate, size: file.length }); } } return items; };
    
    // ATUALIZADO: Escaneia todas as pastas válidas da lista.
    Logic.rescanAndLoadDatabase = function () {
        if (UI.win) { UI.logMessage("Buscando...", false); }
        try {
            State.allIcons = []; // Limpa a lista de itens antes de começar
            var pathList = (State.currentView === "Icones") ? EASY_CONFIG.ICON_ROOT_PATH : EASY_CONFIG.IMAGE_ROOT_PATH;
            
            if (!pathList || pathList.length === 0) {
                throw new Error("Nenhum caminho para '" + State.currentView + "' foi configurado.");
            }
    
            var validFoldersFound = 0;
            for (var i = 0; i < pathList.length; i++) {
                var currentPath = pathList[i];
                if (currentPath && currentPath.replace(/\s/g, '') !== '') {
                    var testFolder = new Folder(currentPath);
                    if (testFolder.exists) {
                        validFoldersFound++;
                        // Escaneia a pasta raiz e suas subpastas, adicionando ao resultado total
                        State.allIcons = State.allIcons.concat(Logic.scanFolder(testFolder, "Raiz"));
                        var subFolders = testFolder.getFiles(function (f) { return f instanceof Folder; });
                        for (var j = 0; j < subFolders.length; j++) {
                            State.allIcons = State.allIcons.concat(Logic.scanFolder(subFolders[j], subFolders[j].name));
                        }
                    }
                }
            }
            
            if (validFoldersFound === 0) {
                throw new Error("Nenhuma das pastas configuradas para '" + State.currentView + "' foi encontrada. Verifique as configurações.");
            }
            
            UI.logMessage(State.allIcons.length + " " + State.currentView.toLowerCase() + " encontrados em " + validFoldersFound + " pastas.", false);
            Logic.saveCache();
            UI.updateCategoryDropdown();
            State.currentPage = 0;
            UI.updateGrid();
    
        } catch (e) { 
            UI.logMessage("ERRO: " + e.message, true); 
        }
    };

    Logic.importIcon = function (iconData) { if (!UI.win || !UI.win.enabled) return; if (!iconData) return; if (!app.project) { alert("Nenhum projeto aberto."); return; } try { UI.win.enabled = false; UI.logMessage("Importando '" + iconData.nome + "'...", false); try { UI.win.update(); } catch (e) { } app.beginUndoGroup("Importar Ícone: " + iconData.nome); var iconFile = new File(iconData.fullPath); if (!iconFile.exists) { throw new Error("Arquivo não encontrado: " + iconData.fullPath); } var importOptions = new ImportOptions(iconFile); var importedItem = app.project.importFile(importOptions); importedItem.name = iconData.nome; if (app.project.activeItem && app.project.activeItem instanceof CompItem) { var comp = app.project.activeItem; var newLayer = comp.layers.add(importedItem); newLayer.position.setValue([comp.width / 2, comp.height / 2]); } UI.logMessage("'" + iconData.nome + "' importado.", false); app.endUndoGroup(); } catch (e) { UI.logMessage("Falha ao importar: " + e.toString(), true); if (app.undoInProgress) app.endUndoGroup(); } finally { if (UI.win) { UI.win.enabled = true; } } };

    // --- DEFINIÇÕES DE UI ---
    UI.handleIconClick = function () { var clickedSlot = this.parent; if (!clickedSlot.iconData) return; var currentTime = new Date().getTime(); if (State.lastClickedSlotId === clickedSlot.uniqueId && (currentTime - State.lastClickTime) < State.doubleClickDelay) { Logic.importIcon(clickedSlot.iconData); State.lastClickTime = 0; State.lastClickedSlotId = -1; return; } UI.updateDetailsPanel(clickedSlot.iconData, clickedSlot); State.lastClickTime = currentTime; State.lastClickedSlotId = clickedSlot.uniqueId; };
    UI.updatePreviewPanelLayout = function () {
        if (!this.win || !this.elements.previewGroup) return;
        var isImageView = (State.currentView === "Imagens");
        var previewWidth = isImageView ? EASY_CONFIG.PREVIEW_SIZE_16_9_WIDTH : EASY_CONFIG.PREVIEW_SIZE_SQUARE;
        var previewHeight = isImageView ? Math.round(previewWidth * 9 / 16) : EASY_CONFIG.PREVIEW_SIZE_SQUARE;
        var requiredPanelWidth = previewWidth + 20;
        var finalPanelWidth = Math.max(UI_METRICS.DETAILS_PANEL_WIDTH, requiredPanelWidth);
        this.elements.detailsPanel.preferredSize.width = finalPanelWidth;
        this.elements.previewGroup.preferredSize = [previewWidth, previewHeight];
        var p = EASY_CONFIG.PREVIEW_PADDING;
        var paddedWidth = previewWidth - (p * 2);
        var paddedHeight = previewHeight - (p * 2);
        this.elements.previewImage.bounds = [p, p, p + paddedWidth, p + paddedHeight];
        this.elements.previewPlaceholder.bounds = [p, p, p + paddedWidth, p + paddedHeight];
        this.win.layout.layout(true);
        this.win.size = this.win.preferredSize; 
    };
    UI.buildGrid = function (parent) {
        UI.gridSlots = [];
        var gridStack = parent.add('group'); gridStack.orientation = 'stack';
        var gridAndPaginationWrapper = gridStack.add('group'); gridAndPaginationWrapper.orientation = 'column';
        UI.elements.gridContainer = gridAndPaginationWrapper.add("group");
        UI.elements.gridContainer.orientation = 'column';
        UI.elements.gridContainer.spacing = EASY_CONFIG.THUMBNAIL_PADDING / 2;
        UI.elements.noResultsText = gridStack.add('statictext', undefined, 'Nenhum item encontrado');
        UI.elements.noResultsText.graphics.font = UI_METRICS.PLACEHOLDER_FONT;
        setFgColor(UI.elements.noResultsText, THEME.normalColor);
        UI.elements.noResultsText.justify = 'center';
        UI.elements.noResultsText.visible = false;
        var columns = (State.currentView === "Icones") ? EASY_CONFIG.GRID_COLUMNS_ICONS : EASY_CONFIG.GRID_COLUMNS_IMAGES;
        var rows = (State.currentView === "Icones") ? EASY_CONFIG.GRID_ROWS_ICONS : EASY_CONFIG.GRID_ROWS_IMAGES;
        var thumbWidth = (State.currentView === "Icones") ? EASY_CONFIG.THUMBNAIL_SIZE : EASY_CONFIG.THUMBNAIL_SIZE_16_9_WIDTH;
        var thumbHeight = (State.currentView === "Icones") ? EASY_CONFIG.THUMBNAIL_SIZE : Math.round(thumbWidth * 9 / 16);
        var paddedWidth = thumbWidth - (EASY_CONFIG.THUMBNAIL_PADDING * 2);
        var paddedHeight = thumbHeight - (EASY_CONFIG.THUMBNAIL_PADDING * 2);
        for (var r = 0; r < rows; r++) {
            var rowGroup = UI.elements.gridContainer.add('group');
            rowGroup.orientation = 'row';
            rowGroup.spacing = EASY_CONFIG.THUMBNAIL_PADDING / 2;
            rowGroup.alignChildren = ['left', 'center'];
            for (var c = 0; c < columns; c++) {
                var slot = rowGroup.add('group');
                var p = EASY_CONFIG.THUMBNAIL_PADDING;
                slot.orientation = 'stack';
                slot.minimumSize = [thumbWidth, thumbHeight];
                slot.maximumSize = [thumbWidth, thumbHeight];
                slot.margins = 0;
                slot.uniqueId = UI.gridSlots.length;
                slot.thumb = slot.add("image", [p, p, p + paddedWidth, p + paddedHeight]);
                slot.placeholder = slot.add("statictext", undefined, '📄');
                slot.placeholder.alignment = ['fill', 'fill'];
                slot.placeholder.graphics.font = ScriptUI.newFont("Arial", "Regular", 40);
                slot.placeholder.justify = 'center';
                setFgColor(slot.placeholder, THEME.normalColor);
                slot.clickCatcher = slot.add('group');
                slot.clickCatcher.alignment = ['fill', 'fill'];
                slot.clickCatcher.onDraw = function () { };
                slot.clickCatcher.addEventListener('click', UI.handleIconClick);
                slot.thumb.visible = false;
                slot.placeholder.visible = false;
                slot.iconData = null;
                slot.visible = false;
                UI.gridSlots.push(slot);
            }
        }
        UI.elements.paginationGroup = gridAndPaginationWrapper.add('group');
        var pg = UI.elements.paginationGroup;
        pg.orientation = 'row';
        pg.alignChildren = ['center', 'center'];
        pg.alignment = 'fill';
        pg.margins.top = 5;
        pg.spacing = 10;
        UI.elements.prevPageBtn = simpleButton(pg, { labelTxt: '◄', width: 40 });
        UI.elements.pageInfo = pg.add('statictext', undefined, 'Página 0 de 0');
        UI.elements.pageInfo.alignment = 'fill';
        setFgColor(UI.elements.pageInfo, THEME.normalColor);
        UI.elements.nextPageBtn = simpleButton(pg, { labelTxt: '►', width: 40 });
    };
    UI.build = function () {
        this.win = new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: false });
        this.win.orientation = "column"; this.win.alignChildren = ["fill", "top"]; this.win.spacing = 5; this.win.margins = 10;
        setBgColor(this.win, THEME.bgColor);
        var headerGroup = this.win.add("group"); headerGroup.orientation = "stack"; headerGroup.alignment = 'fill';
        var titleGroup = headerGroup.add("group"); titleGroup.alignment = 'left';
        var titleText = titleGroup.add("statictext", undefined, SCRIPT_INFO.name); titleText.graphics.font = UI_METRICS.BIG_FONT; setFgColor(titleText, THEME.highlightColor);
        var helpBtnGroup = headerGroup.add('group'); helpBtnGroup.alignment = 'right';
        try { if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') { this.elements.helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: ["Ajuda sobre o Icon Browser"] }); addClickHandler(this.elements.helpBtn, showIconBrowserHelp); } else { this.elements.helpBtn = helpBtnGroup.add("button", undefined, "?"); this.elements.helpBtn.preferredSize = [25, 25]; this.elements.helpBtn.helpTip = "Ajuda"; this.elements.helpBtn.onClick = showIconBrowserHelp; } } catch (e) { this.elements.helpBtn = helpBtnGroup.add("button", undefined, "?"); this.elements.helpBtn.preferredSize = [25, 25]; this.elements.helpBtn.helpTip = "Ajuda"; this.elements.helpBtn.onClick = showIconBrowserHelp; }
        var mainGroup = this.win.add("group"); mainGroup.orientation = "row"; mainGroup.alignChildren = ["top", "top"];
        var leftColumn = mainGroup.add("group"); leftColumn.orientation = "column"; leftColumn.alignChildren = ["fill", "top"];
        var controlsPanel = leftColumn.add("panel", undefined, "Controles"); controlsPanel.orientation = "column";
        controlsPanel.alignChildren = ["center", "top"];
        controlsPanel.preferredSize = [510, 85];
        setFgColor(controlsPanel, THEME.normalColor); setBgColor(controlsPanel, THEME.panelBgColor);
        var row1 = controlsPanel.add('group'); row1.orientation = 'row'; row1.alignChildren = ["left", "center"]; row1.spacing = 10;
        row1.add("statictext", undefined, "Buscar:");
        var searchBox = this.elements.searchBox = row1.add("edittext", undefined, "Digite para Buscar...");
        searchBox.preferredSize.width = UI_METRICS.SEARCH_BOX_WIDTH;
        searchBox.graphics.foregroundColor = searchBox.graphics.newPen(searchBox.graphics.PenType.SOLID_COLOR, [0.6, 0.6, 0.6], 1);
        searchBox.addEventListener('focus', function () { if (this.text === "Digite para Buscar...") { this.text = ""; this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, hexToRgb(THEME.normalColor).slice(0, 3), 1); } });
        searchBox.addEventListener('blur', function () { if (this.text === "") { this.text = "Digite para Buscar..."; this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, [0.6, 0.6, 0.6], 1); } });
        row1.add("statictext", undefined, "Pasta:");
        this.elements.viewDropdown = row1.add("dropdownlist", undefined, ["Icones", "Imagens"]);
        this.elements.viewDropdown.selection = 0;
        this.elements.viewDropdown.preferredSize.width = 80;
        this.elements.refreshBtn = new themeIconButton(row1, { icon: D9T_ATUALIZAR_ICON, tips: ["Atualizar lista"] });
        var row2 = controlsPanel.add('group'); row2.orientation = 'row'; row2.alignChildren = ["left", "center"]; row2.spacing = 10;
        row2.add("statictext", undefined, "Categoria:");
        this.elements.categoryDropdown = row2.add("dropdownlist", undefined, ["Todas"]);
        this.elements.categoryDropdown.selection = 0;
        this.elements.categoryDropdown.preferredSize.width = UI_METRICS.DROPDOWN_WIDTH;
        row2.add("statictext", undefined, "Ordenar por:");
        this.elements.sortFilter = row2.add("dropdownlist", undefined, ["Nome (A-Z)", "Nome (Z-A)", "Data (Recentes)", "Data (Mais Antigos)", "Tamanho (Maior)", "Tamanho (Menor)"]);
        this.elements.sortFilter.selection = 0;
        this.elements.sortFilter.preferredSize.width = UI_METRICS.SORT_DROPDOWN_WIDTH;
        this.elements.gridPlaceholder = leftColumn.add('group');
        this.elements.gridPlaceholder.orientation = 'stack';
        var detailsPanel = this.elements.detailsPanel = mainGroup.add("panel", undefined, "Detalhes");
        detailsPanel.orientation = "column"; detailsPanel.alignChildren = ["fill", "top"]; detailsPanel.alignment = ["right", "fill"];
        setFgColor(detailsPanel, THEME.normalColor); setBgColor(detailsPanel, THEME.detailsBgColor);
        var previewGroup = this.elements.previewGroup = detailsPanel.add('group');
        previewGroup.orientation = 'stack';
        previewGroup.alignment = ['center', 'top'];
        setBgColor(previewGroup, THEME.slotBgColor);
        this.elements.previewImage = previewGroup.add("image");
        this.elements.previewPlaceholder = previewGroup.add("statictext", undefined, '📄');
        this.elements.previewPlaceholder.alignment = ['fill', 'fill'];
        this.elements.previewPlaceholder.graphics.font = ScriptUI.newFont("Arial", "Bold", 80);
        this.elements.previewPlaceholder.justify = 'center';
        setFgColor(this.elements.previewPlaceholder, THEME.normalColor);
        this.updatePreviewPanelLayout();
        var detailsTextGroup = detailsPanel.add("group"); detailsTextGroup.orientation = "column"; detailsTextGroup.alignChildren = ["fill", "top"]; detailsTextGroup.alignment = ["fill", "fill"]; detailsTextGroup.spacing = 5; detailsTextGroup.margins.top = 10; this.elements.nameText = detailsTextGroup.add("statictext", undefined, "Nenhum Ícone", { multiline: true }); this.elements.nameText.graphics.font = ScriptUI.newFont("Arial", "Bold", 12); function addDetailRow(label, parent) { parent.add('statictext', undefined, label).graphics.font = ScriptUI.newFont("Arial", "Italic", 9); var textElement = parent.add('statictext', undefined, '-', { multiline: true, truncate: 'end' }); textElement.preferredSize.height = 14; return textElement; } this.elements.categoryText = addDetailRow("Categoria:", detailsTextGroup); this.elements.typeText = addDetailRow("Tipo:", detailsTextGroup); this.elements.sizeText = addDetailRow("Tamanho:", detailsTextGroup); this.elements.modifiedText = addDetailRow("Modificado:", detailsTextGroup); this.elements.pathText = addDetailRow("Pasta:", detailsTextGroup); this.elements.pathText.preferredSize.height = 28;
        var statusPanel = this.win.add("panel", undefined, "Status"); statusPanel.alignment = 'fill'; setFgColor(statusPanel, THEME.normalColor); setBgColor(statusPanel, THEME.statusPanelBgColor);
        this.elements.statusBar = statusPanel.add('statictext', undefined, 'Pronto.', { truncate: 'end' }); this.elements.statusBar.alignment = 'fill';
    };
    UI.updateGrid = function () {
        var currentSearchText = this.elements.searchBox.text;
        var searchTerm = (currentSearchText === "Digite para Buscar...") ? "" : currentSearchText.toLowerCase();
        var selectedCategory = this.elements.categoryDropdown.selection.text;
        var selectedSort = this.elements.sortFilter.selection.text;
        State.filteredIcons = [];
        for (var i = 0; i < State.allIcons.length; i++) { var icon = State.allIcons[i]; var matchesSearch = searchTerm === "" || icon.nome.toLowerCase().indexOf(searchTerm) > -1; var matchesCategory = selectedCategory === "Todas" || icon.categoria === selectedCategory; if (matchesSearch && matchesCategory) { State.filteredIcons.push(icon) } }
        switch (selectedSort) { case "Nome (A-Z)": State.filteredIcons.sort(function (a, b) { return a.nome.toLowerCase().localeCompare(b.nome.toLowerCase()) }); break; case "Nome (Z-A)": State.filteredIcons.sort(function (a, b) { return b.nome.toLowerCase().localeCompare(a.nome.toLowerCase()) }); break; case "Data (Recentes)": State.filteredIcons.sort(function (a, b) { return b.modified.getTime() - a.modified.getTime() }); break; case "Data (Mais Antigos)": State.filteredIcons.sort(function (a, b) { return a.modified.getTime() - b.modified.getTime() }); break; case "Tamanho (Maior)": State.filteredIcons.sort(function (a, b) { return b.size - a.size }); break; case "Tamanho (Menor)": State.filteredIcons.sort(function (a, b) { return a.size - b.size }); break } if (State.filteredIcons.length === 0) { this.elements.gridContainer.parent.visible = false; this.elements.noResultsText.visible = true; this.elements.noResultsText.text = "Nenhum " + State.currentView.toLowerCase() + " encontrado" } else { this.elements.gridContainer.parent.visible = true; this.elements.noResultsText.visible = false }
        var columns = (State.currentView === "Icones") ? EASY_CONFIG.GRID_COLUMNS_ICONS : EASY_CONFIG.GRID_COLUMNS_IMAGES;
        var rows = (State.currentView === "Icones") ? EASY_CONFIG.GRID_ROWS_ICONS : EASY_CONFIG.GRID_ROWS_IMAGES;
        var itemsPerPage = columns * rows;
        var totalPages = Math.ceil(State.filteredIcons.length / itemsPerPage) || 1;
        if (State.currentPage >= totalPages) State.currentPage = totalPages - 1; if (State.currentPage < 0) State.currentPage = 0; this.elements.pageInfo.text = "Página " + (State.currentPage + 1) + " de " + totalPages; this.elements.prevPageBtn.enabled = (State.currentPage > 0); this.elements.nextPageBtn.enabled = (State.currentPage < totalPages - 1); var startIndex = State.currentPage * itemsPerPage;
        for (var j = 0; j < this.gridSlots.length; j++) { var slot = this.gridSlots[j]; slot.iconData = null; slot.visible = false; slot.thumb.visible = false; slot.placeholder.visible = false; setBgColor(slot, THEME.slotBgColor); }
        for (var j = 0; j < itemsPerPage; j++) { var slotIndex = j; if (slotIndex < this.gridSlots.length) { var slot = this.gridSlots[slotIndex]; var iconIndex = startIndex + j; if (iconIndex < State.filteredIcons.length) { var iconData = State.filteredIcons[iconIndex]; slot.iconData = iconData; setBgColor(slot, (this.activeSlot === slot) ? THEME.highlightColor : THEME.slotBgColor); try { slot.thumb.image = new File(iconData.fullPath); if (slot.thumb.image != null) { slot.placeholder.visible = false; slot.thumb.visible = true } else { throw new Error("Imagem nula") } } catch (e) { slot.thumb.visible = false; slot.placeholder.visible = true; UI.logMessage("Erro ao carregar: " + iconData.nome, true) } slot.visible = true } } } if (!this.activeSlot || !this.activeSlot.visible) { var firstVisibleSlot = null; for (var k = 0; k < this.gridSlots.length; k++) { if (this.gridSlots[k].visible) { firstVisibleSlot = this.gridSlots[k]; break } } if (firstVisibleSlot) { this.updateDetailsPanel(firstVisibleSlot.iconData, firstVisibleSlot) } else { this.updateDetailsPanel(null, null) } } if (this.win) { this.win.layout.layout(true) }
    };
    UI.updateDetailsPanel = function (iconData, slot) { State.selectedIconData = iconData; this.highlightSelection(slot); var itemType = State.currentView === "Icones" ? "Ícone" : "Imagem"; if (iconData) { var iconFile = new File(iconData.fullPath); this.elements.previewImage.image = iconFile.exists ? iconFile : null; if (this.elements.previewImage.image != null) { this.elements.previewPlaceholder.visible = false; this.elements.previewPlaceholder.text = ''; this.elements.previewImage.visible = true; } else { this.elements.previewImage.visible = false; this.elements.previewPlaceholder.text = '📄'; } this.elements.nameText.text = iconData.nome; this.elements.categoryText.text = iconData.categoria; this.elements.typeText.text = getFileType(iconFile.name); this.elements.sizeText.text = formatFileSize(iconFile.length); this.elements.modifiedText.text = (iconData.modified) ? new Date(iconData.modified).toLocaleString() : "N/A"; this.elements.pathText.text = decodeURI(iconFile.path); } else { this.elements.previewImage.image = null; this.elements.previewPlaceholder.text = ''; this.elements.nameText.text = "Nenhum " + itemType; this.elements.categoryText.text = "-"; this.elements.typeText.text = "-"; this.elements.sizeText.text = "-"; this.elements.modifiedText.text = "-"; this.elements.pathText.text = "-"; } };
    UI.highlightSelection = function (selectedSlot) { if (this.activeSlot && this.activeSlot !== selectedSlot) { try { setBgColor(this.activeSlot, THEME.slotBgColor); } catch (e) { } } if (selectedSlot && selectedSlot.iconData) { setBgColor(selectedSlot, THEME.highlightColor); } this.activeSlot = selectedSlot; };
    UI.updateCategoryDropdown = function () { var dropdown = this.elements.categoryDropdown; var currentSelection = dropdown.selection ? dropdown.selection.text : "Todas"; while (dropdown.items.length > 0) { dropdown.remove(0) } dropdown.add("item", "Todas"); var categories = {}; for (var i = 0; i < State.allIcons.length; i++) { categories[State.allIcons[i].categoria] = true } var sortedCategories = getObjectKeys(categories).sort(); for (var i = 0; i < sortedCategories.length; i++) { var cat = sortedCategories[i]; if (cat !== "Todas") { dropdown.add("item", cat) } } for (var i = 0; i < dropdown.items.length; i++) { if (dropdown.items[i].text === currentSelection) { dropdown.selection = i; return } } dropdown.selection = 0 };
    UI.logMessage = function (message, isError) { if (!this.elements.statusBar) { return; } var prefix = isError ? "[ERRO] " : ""; this.elements.statusBar.text = prefix + message; if (isError) { setFgColor(this.elements.statusBar, THEME.highlightColor); } else { setFgColor(this.elements.statusBar, THEME.normalColor); } };
    UI.assignPaginationHandlers = function () { addClickHandler(this.elements.nextPageBtn, function () { State.currentPage++; UI.updateGrid(); }); addClickHandler(this.elements.prevPageBtn, function () { State.currentPage--; UI.updateGrid(); }); };
    UI.assignEventHandlers = function () {
        var onFilterChange = function () { State.currentPage = 0; UI.updateGrid(); };
        this.elements.searchBox.onChanging = onFilterChange;
        this.elements.categoryDropdown.onChange = onFilterChange;
        this.elements.sortFilter.onChange = onFilterChange;
        this.elements.viewDropdown.onChange = function () {
            UI.activeSlot = null;
            State.currentView = UI.elements.viewDropdown.selection.text;
            State.currentPage = 0;
            State.allIcons = [];
            if (UI.elements.gridPlaceholder.parent) {
                var leftColumn = UI.elements.gridPlaceholder.parent;
                leftColumn.remove(UI.elements.gridPlaceholder);
                UI.elements.gridPlaceholder = leftColumn.add('group');
                UI.elements.gridPlaceholder.orientation = 'stack';
            }
            UI.buildGrid(UI.elements.gridPlaceholder);
            UI.assignPaginationHandlers();
            UI.updatePreviewPanelLayout();
            var cacheLoaded = Logic.loadCache();
            if (!cacheLoaded) {
                Logic.rescanAndLoadDatabase();
            } else {
                UI.logMessage(State.allIcons.length + " " + State.currentView.toLowerCase() + " carregados do cache.", false);
                UI.updateCategoryDropdown();
                UI.updateGrid();
            }
        };
        addClickHandler(this.elements.refreshBtn, function () { Logic.rescanAndLoadDatabase(); });
    };

    // --- OBJETO PRINCIPAL DA APLICAÇÃO ---
    var App = {
        run: function () {
            try {
                Logic.loadSettings();
                UI.build();
                UI.assignEventHandlers();
                UI.elements.viewDropdown.notify("onChange");
                UI.win.onClose = function () { UI.activeSlot = null; };
                UI.win.show();
            } catch (e) { alert("Erro ao iniciar a aplicação: " + e.toString() + "\nLinha: " + e.line); }
        }
    };

    App.run();

})();