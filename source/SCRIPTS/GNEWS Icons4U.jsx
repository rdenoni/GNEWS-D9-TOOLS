

(function () {

    var EASY_CONFIG = {
        ICON_ROOT_PATH: "D:\\PROJETOS\\SCRIPTS AFTER\\GNEWS-D9-TOOLS\\icons",
        THUMBNAIL_SIZE: 69, THUMBNAIL_PADDING: 8, GRID_COLUMNS: 5, GRID_ROWS: 6, PREVIEW_PADDING: 5
    };
    var UI_METRICS = {
        DETAILS_PANEL_WIDTH: 220, SEARCH_BOX_WIDTH: 130, DROPDOWN_WIDTH: 70,
        SORT_DROPDOWN_WIDTH: 147,
        BIG_FONT: ScriptUI.newFont("Arial", "Bold", 14),
        PLACEHOLDER_FONT: ScriptUI.newFont("Arial", "Bold", 24)
    };
    var CONFIG = { CACHE_FILENAME: "IconBrowser_v34_Cache.json" };
    var THEME = {
        bgColor: '#0D0A0Aff', panelBgColor: '#0D0A0Aff', detailsBgColor: '#0D0A0Aff',
        statusPanelBgColor: '#0D0A0Aff',
        normalColor: '#efefefff', highlightColor: '#D3003Aff', slotBgColor: '#181818ff'
    };

    function showIconBrowserHelp() { /* ... Lógica de Ajuda (inalterada) ... */ }
    function hexToRgb(hex) { if (typeof hex !== 'string') return [1, 1, 1, 1]; var cleanHex = hex.replace('#', ''); var r = parseInt(cleanHex.substring(0, 2), 16) / 255; var g = parseInt(cleanHex.substring(2, 4), 16) / 255; var b = parseInt(cleanHex.substring(4, 6), 16) / 255; var a = (cleanHex.length === 8) ? (parseInt(cleanHex.substring(6, 8), 16) / 255) : 1; return [r, g, b, a]; }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1); } catch (e) { } }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color); } catch (e) { } }
    function simpleButton(parent, options) { var btn = parent.add('button', undefined, options.labelTxt); btn.preferredSize.width = options.width || 80; btn.preferredSize.height = options.height || 24; btn.leftClick = btn; return btn; }
    function addClickHandler(element, handler) { if (!element) return; if (element.leftClick) { element.leftClick.onClick = handler; } else { element.onClick = handler; } }
    function getObjectKeys(obj) { if (typeof obj !== 'object' || obj === null) return []; var keys = []; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { keys.push(key); } } return keys; }
    function formatFileSize(bytes) { if (bytes === null || isNaN(bytes)) return "-"; if (bytes === 0) return '0 Bytes'; if (bytes < 1024) return bytes + ' Bytes'; else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'; else return (bytes / 1048576).toFixed(1) + ' MB'; }
    function getFileType(filename) { return 'Imagem PNG'; }

    var SCRIPT_INFO = { name: "Icons4u", version: "1.1" };
    var UI_CONFIG = { grid: { columns: EASY_CONFIG.GRID_COLUMNS, rows: EASY_CONFIG.GRID_ROWS, thumbSize: EASY_CONFIG.THUMBNAIL_SIZE, gap: 5, padding: EASY_CONFIG.THUMBNAIL_PADDING } };


    var SUPPORTED_EXTENSIONS = /\.png$/i;

    var State = { allIcons: [], filteredIcons: [], selectedIconData: null, lastClickTime: 0, lastClickedSlotId: -1, doubleClickDelay: 500, currentPage: 0 };
    var UI = { elements: {}, gridSlots: [], activeSlot: null, win: null };

    var Logic = { /* ... Lógica Principal (inalterada) ... */ };
    Logic.stringify = function (obj) { try { return obj.toSource(); } catch (e) { return "[]"; } };
    Logic.saveCache = function () { try { var cacheFile = new File(Folder.userData.fsName + "/" + CONFIG.CACHE_FILENAME); cacheFile.encoding = "UTF-8"; cacheFile.open("w"); cacheFile.write(Logic.stringify(State.allIcons)); cacheFile.close(); } catch (e) { UI.logMessage("Não foi possível salvar o cache.", true); } };
    Logic.loadCache = function () { var cacheFile = new File(Folder.userData.fsName + "/" + CONFIG.CACHE_FILENAME); if (!cacheFile.exists) return false; try { cacheFile.open("r"); var content = cacheFile.read(); cacheFile.close(); State.allIcons = eval(content); if (typeof State.allIcons !== 'object' || State.allIcons.length === undefined) { State.allIcons = []; return false; } return true; } catch (e) { UI.logMessage("Cache corrompido ou inválido.", true); return false; } };
    Logic.scanFolder = function (folder, category) { var icons = []; var files = folder.getFiles(); for (var i = 0; i < files.length; i++) { var file = files[i]; if (file instanceof File && SUPPORTED_EXTENSIONS.test(file.name)) { var modifiedDate = new Date(0); try { if (file.modified instanceof Date) { modifiedDate = file.modified; } } catch (e) { } icons.push({ nome: decodeURI(file.name).replace(/\.[^.]+$/, "").replace(/[-_]/g, ' '), fullPath: file.fsName, categoria: category, modified: modifiedDate, size: file.length }); if (i % 10 === 0 && UI.win) { UI.logMessage("Buscando ícones: " + (State.allIcons.length + icons.length) + " encontrados...", false); try { UI.win.update(); } catch (e) { } } } } return icons; };
    Logic.rescanAndLoadDatabase = function () { if (UI.win) { UI.win.enabled = false; UI.logMessage("Buscando ícones...", false); } try { State.allIcons = []; var rootFolder = new Folder(EASY_CONFIG.ICON_ROOT_PATH); if (!rootFolder.exists) { throw new Error("A pasta raiz não foi encontrada!"); } State.allIcons = State.allIcons.concat(Logic.scanFolder(rootFolder, "Raiz")); var subFolders = rootFolder.getFiles(function (f) { return f instanceof Folder; }); for (var i = 0; i < subFolders.length; i++) { State.allIcons = State.allIcons.concat(Logic.scanFolder(subFolders[i], subFolders[i].name)); } UI.logMessage(State.allIcons.length + " ícones encontrados e cacheados.", false); Logic.saveCache(); UI.updateCategoryDropdown(); State.currentPage = 0; UI.updateGrid(); } catch (e) { UI.logMessage("ERRO: " + e.message, true); } finally { if (UI.win) { UI.win.enabled = true; } } };
    Logic.importIcon = function (iconData) { if (!UI.win || !UI.win.enabled) return; if (!iconData) return; if (!app.project) { alert("Nenhum projeto aberto."); return; } try { UI.win.enabled = false; UI.logMessage("Importando '" + iconData.nome + "'...", false); try { UI.win.update(); } catch (e) { } app.beginUndoGroup("Importar Ícone: " + iconData.nome); var iconFile = new File(iconData.fullPath); if (!iconFile.exists) { throw new Error("Arquivo não encontrado: " + iconData.fullPath); } var importOptions = new ImportOptions(iconFile); var importedItem = app.project.importFile(importOptions); importedItem.name = iconData.nome; if (app.project.activeItem && app.project.activeItem instanceof CompItem) { var comp = app.project.activeItem; var newLayer = comp.layers.add(importedItem); newLayer.position.setValue([comp.width / 2, comp.height / 2]); } UI.logMessage("Ícone '" + iconData.nome + "' importado.", false); app.endUndoGroup(); } catch (e) { UI.logMessage("Falha ao importar: " + e.toString(), true); if (app.undoInProgress) app.endUndoGroup(); } finally { if (UI.win) { UI.win.enabled = true; } } };


    UI.handleIconClick = function () { var clickedSlot = this.parent; if (!clickedSlot.iconData) return; var currentTime = new Date().getTime(); if (State.lastClickedSlotId === clickedSlot.uniqueId && (currentTime - State.lastClickTime) < State.doubleClickDelay) { Logic.importIcon(clickedSlot.iconData); State.lastClickTime = 0; State.lastClickedSlotId = -1; return; } UI.updateDetailsPanel(clickedSlot.iconData, clickedSlot); State.lastClickTime = currentTime; State.lastClickedSlotId = clickedSlot.uniqueId; };
    UI.build = function () {
        this.win = new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: false });
        this.win.orientation = "column"; this.win.alignChildren = ["fill", "top"]; this.win.spacing = 5; this.win.margins = 10;
        setBgColor(this.win, THEME.bgColor);

        var headerGroup = this.win.add("group"); headerGroup.orientation = "stack"; headerGroup.alignment = 'fill';
        var titleGroup = headerGroup.add("group"); titleGroup.alignment = 'left';
        var titleText = titleGroup.add("statictext", undefined, SCRIPT_INFO.name); titleText.graphics.font = UI_METRICS.BIG_FONT; setFgColor(titleText, THEME.highlightColor);
        var helpBtnGroup = headerGroup.add('group'); helpBtnGroup.alignment = 'right';

        try {
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') {
                this.elements.helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: ["Ajuda sobre o Icon Browser"] });
                addClickHandler(this.elements.helpBtn, showIconBrowserHelp);
            } else {
                throw new Error("themeIconButton não definido");
            }
        } catch (e) {
            this.elements.helpBtn = helpBtnGroup.add("button", undefined, "?");
            this.elements.helpBtn.preferredSize = [25, 25];
            this.elements.helpBtn.helpTip = "Ajuda";
            this.elements.helpBtn.onClick = showIconBrowserHelp;
        }

        var mainGroup = this.win.add("group"); mainGroup.orientation = "row"; mainGroup.alignChildren = ["top", "top"];
        var leftColumn = mainGroup.add("group"); leftColumn.orientation = "column"; leftColumn.alignChildren = ["fill", "top"];
        var controlsPanel = leftColumn.add("panel", undefined, "Controles"); controlsPanel.orientation = "column"; controlsPanel.alignChildren = ["fill", "top"]; setFgColor(controlsPanel, THEME.normalColor); setBgColor(controlsPanel, THEME.panelBgColor);

        var controlsGroup = controlsPanel.add('group'); controlsGroup.orientation = 'row'; controlsGroup.alignChildren = ["left", "center"]; controlsGroup.spacing = 10;
        controlsGroup.add("statictext", undefined, "Buscar:");
        this.elements.searchBox = controlsGroup.add("edittext", undefined, ""); this.elements.searchBox.preferredSize.width = UI_METRICS.SEARCH_BOX_WIDTH;
        var spacer1 = controlsGroup.add('group'); spacer1.preferredSize.width = 5;
        controlsGroup.add("statictext", undefined, "Categoria:");
        this.elements.categoryDropdown = controlsGroup.add("dropdownlist", undefined, ["Todas"]); this.elements.categoryDropdown.selection = 0; this.elements.categoryDropdown.preferredSize.width = UI_METRICS.DROPDOWN_WIDTH;

        var row3 = controlsPanel.add('group'); row3.orientation = 'row'; row3.alignChildren = ["left", "center"]; row3.spacing = 10;
        row3.add("statictext", undefined, "Ordenar por:");
        this.elements.sortFilter = row3.add("dropdownlist", undefined, ["Nome (A-Z)", "Nome (Z-A)", "Data (Recentes)", "Data (Mais Antigos)", "Tamanho (Maior)", "Tamanho (Menor)"]);
        this.elements.sortFilter.selection = 0;
        this.elements.sortFilter.preferredSize.width = UI_METRICS.SORT_DROPDOWN_WIDTH;
        var spacer2 = row3.add('group'); spacer2.preferredSize.width = 5;
        this.elements.refreshBtn = simpleButton(row3, { labelTxt: "Atualizar ↻", width: 85, height: 25 });

        var gridStack = leftColumn.add('group'); gridStack.orientation = 'stack'; gridStack.alignment = 'left';
        var gridAndPaginationWrapper = gridStack.add('group'); gridAndPaginationWrapper.orientation = 'column';
        this.elements.gridContainer = gridAndPaginationWrapper.add("group");
        this.elements.gridContainer.orientation = 'column';
        this.elements.gridContainer.spacing = UI_CONFIG.grid.gap;

        this.elements.noResultsText = gridStack.add('statictext', undefined, 'Nenhum ícone encontrado');
        this.elements.noResultsText.graphics.font = UI_METRICS.PLACEHOLDER_FONT;
        setFgColor(this.elements.noResultsText, THEME.normalColor);
        this.elements.noResultsText.justify = 'center';
        this.elements.noResultsText.visible = false;

        var g = UI_CONFIG.grid; var paddedThumbSize = g.thumbSize - (g.padding * 2);
        for (var r = 0; r < g.rows; r++) {
            var rowGroup = this.elements.gridContainer.add('group'); rowGroup.orientation = 'row'; rowGroup.spacing = g.gap; rowGroup.alignChildren = ['left', 'center'];
            for (var c = 0; c < g.columns; c++) {
                var slot = rowGroup.add('group'); slot.orientation = 'stack'; slot.minimumSize = [g.thumbSize, g.thumbSize]; slot.maximumSize = [g.thumbSize, g.thumbSize]; slot.margins = 0; slot.uniqueId = this.gridSlots.length;
                setBgColor(slot, THEME.slotBgColor);
                slot.thumb = slot.add("image", [g.padding, g.padding, g.padding + paddedThumbSize, g.padding + paddedThumbSize]);
                slot.placeholder = slot.add("statictext", undefined, '📄'); slot.placeholder.alignment = ['fill', 'fill']; slot.placeholder.graphics.font = ScriptUI.newFont("Arial", "Regular", 40); slot.placeholder.justify = 'center'; setFgColor(slot.placeholder, THEME.normalColor);
                slot.clickCatcher = slot.add('group'); slot.clickCatcher.alignment = ['fill', 'fill']; slot.clickCatcher.onDraw = function () { }; slot.clickCatcher.addEventListener('click', this.handleIconClick);
                slot.thumb.visible = false; slot.placeholder.visible = false; slot.iconData = null; slot.visible = false;
                this.gridSlots.push(slot);
            }
        }

        this.elements.paginationGroup = gridAndPaginationWrapper.add('group');
        var pg = this.elements.paginationGroup;
        pg.orientation = 'row'; pg.alignChildren = ['center', 'center']; pg.alignment = 'fill'; pg.margins.top = 5; pg.spacing = 10;
        this.elements.prevPageBtn = simpleButton(pg, { labelTxt: '◄', width: 40 });
        this.elements.pageInfo = pg.add('statictext', undefined, 'Página 0 de 0'); this.elements.pageInfo.alignment = 'fill'; setFgColor(this.elements.pageInfo, THEME.normalColor);
        this.elements.nextPageBtn = simpleButton(pg, { labelTxt: '►', width: 40 });

        var detailsPanel = mainGroup.add("panel", undefined, "Detalhes"); detailsPanel.orientation = "column"; detailsPanel.alignChildren = ["fill", "top"]; detailsPanel.alignment = ["right", "fill"]; detailsPanel.preferredSize.width = UI_METRICS.DETAILS_PANEL_WIDTH; setFgColor(detailsPanel, THEME.normalColor); setBgColor(detailsPanel, THEME.detailsBgColor);
        var previewGroup = detailsPanel.add('group'); previewGroup.orientation = 'stack'; previewGroup.alignment = ['center', 'top']; previewGroup.preferredSize = [150, 150]; setBgColor(previewGroup, THEME.slotBgColor);
        var previewPadding = EASY_CONFIG.PREVIEW_PADDING; var paddedPreviewSize = 150 - (previewPadding * 2); var previewBounds = [previewPadding, previewPadding, previewPadding + paddedPreviewSize, previewPadding + paddedPreviewSize];
        this.elements.previewImage = previewGroup.add("image", previewBounds); this.elements.previewPlaceholder = previewGroup.add("statictext", undefined, '📄'); this.elements.previewPlaceholder.alignment = ['fill', 'fill']; this.elements.previewPlaceholder.graphics.font = ScriptUI.newFont("Arial", "Bold", 80); this.elements.previewPlaceholder.justify = 'center'; setFgColor(this.elements.previewPlaceholder, THEME.normalColor);
        var detailsTextGroup = detailsPanel.add("group"); detailsTextGroup.orientation = "column"; detailsTextGroup.alignChildren = ["fill", "top"]; detailsTextGroup.alignment = ["fill", "fill"]; detailsTextGroup.spacing = 5; detailsTextGroup.margins.top = 10;
        this.elements.nameText = detailsTextGroup.add("statictext", undefined, "Nenhum Ícone", { multiline: true }); this.elements.nameText.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
        function addDetailRow(label, parent) { parent.add('statictext', undefined, label).graphics.font = ScriptUI.newFont("Arial", "Italic", 9); var textElement = parent.add('statictext', undefined, '-', { multiline: true, truncate: 'end' }); textElement.preferredSize.height = 14; return textElement; }
        this.elements.categoryText = addDetailRow("Categoria:", detailsTextGroup); this.elements.typeText = addDetailRow("Tipo:", detailsTextGroup);
        this.elements.sizeText = addDetailRow("Tamanho:", detailsTextGroup);
        this.elements.modifiedText = addDetailRow("Modificado:", detailsTextGroup);
        this.elements.pathText = addDetailRow("Pasta:", detailsTextGroup); this.elements.pathText.preferredSize.height = 28;
        var statusPanel = this.win.add("panel", undefined, "Status"); statusPanel.alignment = 'fill'; setFgColor(statusPanel, THEME.normalColor); setBgColor(statusPanel, THEME.statusPanelBgColor);
        this.elements.statusBar = statusPanel.add('statictext', undefined, 'Pronto.', { truncate: 'end' }); this.elements.statusBar.alignment = 'fill';
    };
    UI.updateGrid = function () { var searchTerm = this.elements.searchBox.text.toLowerCase(); var selectedCategory = this.elements.categoryDropdown.selection.text; var selectedSort = this.elements.sortFilter.selection.text; State.filteredIcons = []; for (var i = 0; i < State.allIcons.length; i++) { var icon = State.allIcons[i]; var matchesSearch = searchTerm === "" || icon.nome.toLowerCase().indexOf(searchTerm) > -1; var matchesCategory = selectedCategory === "Todas" || icon.categoria === selectedCategory; if (matchesSearch && matchesCategory) { State.filteredIcons.push(icon); } } switch (selectedSort) { case "Nome (A-Z)": State.filteredIcons.sort(function (a, b) { return a.nome.toLowerCase().localeCompare(b.nome.toLowerCase()); }); break; case "Nome (Z-A)": State.filteredIcons.sort(function (a, b) { return b.nome.toLowerCase().localeCompare(a.nome.toLowerCase()); }); break; case "Data (Recentes)": State.filteredIcons.sort(function (a, b) { return b.modified.getTime() - a.modified.getTime(); }); break; case "Data (Mais Antigos)": State.filteredIcons.sort(function (a, b) { return a.modified.getTime() - b.modified.getTime(); }); break; case "Tamanho (Maior)": State.filteredIcons.sort(function (a, b) { return b.size - a.size; }); break; case "Tamanho (Menor)": State.filteredIcons.sort(function (a, b) { return a.size - b.size; }); break; } if (State.filteredIcons.length === 0) { this.elements.gridContainer.parent.visible = false; this.elements.noResultsText.visible = true; } else { this.elements.gridContainer.parent.visible = true; this.elements.noResultsText.visible = false; } var itemsPerPage = UI_CONFIG.grid.columns * UI_CONFIG.grid.rows; var totalPages = Math.ceil(State.filteredIcons.length / itemsPerPage) || 1; if (State.currentPage >= totalPages) State.currentPage = totalPages - 1; if (State.currentPage < 0) State.currentPage = 0; this.elements.pageInfo.text = "Página " + (State.currentPage + 1) + " de " + totalPages; this.elements.prevPageBtn.enabled = (State.currentPage > 0); this.elements.nextPageBtn.enabled = (State.currentPage < totalPages - 1); var startIndex = State.currentPage * itemsPerPage; for (var j = 0; j < this.gridSlots.length; j++) { var slot = this.gridSlots[j]; slot.iconData = null; slot.visible = false; slot.thumb.visible = false; slot.placeholder.visible = false; setBgColor(slot, THEME.slotBgColor); } for (var j = 0; j < this.gridSlots.length; j++) { var slot = this.gridSlots[j]; var iconIndex = startIndex + j; if (iconIndex < State.filteredIcons.length) { var iconData = State.filteredIcons[iconIndex]; slot.iconData = iconData; setBgColor(slot, (this.activeSlot === slot) ? THEME.highlightColor : THEME.slotBgColor); try { slot.thumb.image = new File(iconData.fullPath); if (slot.thumb.image != null) { slot.placeholder.visible = false; slot.thumb.visible = true; } else { throw new Error("Imagem nula"); } } catch (e) { slot.thumb.visible = false; slot.placeholder.visible = true; UI.logMessage("Erro ao carregar: " + iconData.nome + ".png", true); } slot.visible = true; } } if (!this.activeSlot || !this.activeSlot.visible) { var firstVisibleSlot = null; for (var k = 0; k < this.gridSlots.length; k++) { if (this.gridSlots[k].visible) { firstVisibleSlot = this.gridSlots[k]; break; } } if (firstVisibleSlot) { this.updateDetailsPanel(firstVisibleSlot.iconData, firstVisibleSlot); } else { this.updateDetailsPanel(null, null); } } if (this.win) { this.win.layout.layout(true); } };
    UI.updateDetailsPanel = function (iconData, slot) { State.selectedIconData = iconData; this.highlightSelection(slot); if (iconData) { var iconFile = new File(iconData.fullPath); this.elements.previewImage.image = iconFile.exists ? iconFile : null; if (this.elements.previewImage.image != null) { this.elements.previewPlaceholder.visible = false; this.elements.previewPlaceholder.text = ''; this.elements.previewImage.visible = true; } else { this.elements.previewImage.visible = false; this.elements.previewPlaceholder.text = '📄'; } this.elements.nameText.text = iconData.nome; this.elements.categoryText.text = iconData.categoria; this.elements.typeText.text = getFileType(iconFile.name); this.elements.sizeText.text = formatFileSize(iconFile.length); this.elements.modifiedText.text = (iconData.modified) ? new Date(iconData.modified).toLocaleString() : "N/A"; this.elements.pathText.text = decodeURI(iconFile.path); } else { this.elements.previewImage.image = null; this.elements.previewPlaceholder.text = ''; this.elements.nameText.text = "Nenhum Ícone"; this.elements.categoryText.text = "-"; this.elements.typeText.text = "-"; this.elements.sizeText.text = "-"; this.elements.modifiedText.text = "-"; this.elements.pathText.text = "-"; } };
    UI.highlightSelection = function (selectedSlot) { if (this.activeSlot && this.activeSlot !== selectedSlot) { try { setBgColor(this.activeSlot, THEME.slotBgColor); } catch (e) { } } if (selectedSlot && selectedSlot.iconData) { setBgColor(selectedSlot, THEME.highlightColor); } this.activeSlot = selectedSlot; };
    UI.updateCategoryDropdown = function () { var dropdown = this.elements.categoryDropdown; var currentSelection = dropdown.selection ? dropdown.selection.text : "Todas"; while (dropdown.items.length > 0) { dropdown.remove(0); } dropdown.add("item", "Todas"); var categories = {}; for (var i = 0; i < State.allIcons.length; i++) { categories[State.allIcons[i].categoria] = true; } var sortedCategories = getObjectKeys(categories).sort(); for (var i = 0; i < sortedCategories.length; i++) { var cat = sortedCategories[i]; if (cat !== "Todas") { dropdown.add("item", cat); } } for (var i = 0; i < dropdown.items.length; i++) { if (dropdown.items[i].text === currentSelection) { dropdown.selection = i; return; } } dropdown.selection = 0; };
    UI.logMessage = function (message, isError) { if (!this.elements.statusBar) { return; } var prefix = isError ? "[ERRO] " : ""; this.elements.statusBar.text = prefix + message; if (isError) { setFgColor(this.elements.statusBar, THEME.highlightColor); } else { setFgColor(this.elements.statusBar, THEME.normalColor); } };
    UI.assignEventHandlers = function () { var onFilterChange = function () { State.currentPage = 0; UI.updateGrid(); }; this.elements.searchBox.onChanging = onFilterChange; this.elements.categoryDropdown.onChange = onFilterChange; this.elements.sortFilter.onChange = onFilterChange; addClickHandler(this.elements.refreshBtn, function () { Logic.rescanAndLoadDatabase(); }); addClickHandler(this.elements.nextPageBtn, function () { State.currentPage++; UI.updateGrid(); }); addClickHandler(this.elements.prevPageBtn, function () { State.currentPage--; UI.updateGrid(); }); };

    var App = {
        run: function () {
            try {
                UI.build();
                UI.assignEventHandlers();
                if (!Logic.loadCache()) { Logic.rescanAndLoadDatabase(); }
                else { UI.logMessage(State.allIcons.length + " ícones carregados do cache.", false); UI.updateCategoryDropdown(); UI.updateGrid(); }
                UI.win.onClose = function () { UI.activeSlot = null; }
                UI.win.show();
            } catch (e) { alert("Erro ao iniciar a aplicação: " + e.toString() + "\nLinha: " + e.line); }
        }
    };

    App.run();

})();