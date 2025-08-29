(function() {

    // --- PARTE 1: TEMA E FUNÇÕES AUXILIARES ---
    var THEME = {
        bgColor: '#0B0D0E',
        normalColor: '#C7C8CA'
    };
    function hexToRgb(hex) { if(!hex) return [0,0,0,1]; hex = hex.replace('#', ''); return [parseInt(hex.substring(0,2), 16)/255, parseInt(hex.substring(2,4), 16)/255, parseInt(hex.substring(4,6), 16)/255, 1]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color.slice(0,3)); } catch (e) {} }
    function setFgColor(element, colorArray) { try { element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, colorArray, 1); } catch (e) {} }
    
    function addClickHandler(element, handler) {
        if (!element) return;
        if (element.leftClick) {
            element.leftClick.onClick = handler;
        } else {
            element.onClick = handler;
        }
    }

    // --- PARTE 1.5: LÓGICA DE STATUS E CACHE (NOVO) ---
    var COLORS = { success: [0.2, 0.8, 0.2], error: [0.8, 0.2, 0.2], warning: [0.9, 0.7, 0.2], info: [0.2, 0.6, 0.9], neutral: [0.9, 0.9, 0.9] };
    var isCancelled = false;
    var ui = {}; // Para armazenar elementos da UI

    function updateStatus(message, type) {
        if (!ui.statusText) return;
        var color = COLORS[type] || COLORS.neutral;
        ui.statusText.text = message;
        setFgColor(ui.statusText, color);
    }
    
    // Função de escaneamento adaptada de GNEWS_LibraryLive.jsx
    function scanFolder(folder, category, extensionRegex) {
        var items = [];
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            if (isCancelled) break; // Permite o cancelamento
            var file = files[i];
            if (file instanceof File && extensionRegex.test(file.name)) {
                var modifiedDate = new Date(0);
                try { if (file.modified instanceof Date) { modifiedDate = file.modified; } } catch (e) {}
                items.push({
                    nome: decodeURI(file.name).replace(/\.[^.]+$/, "").replace(/[-_]/g, ' '),
                    fullPath: file.fsName,
                    categoria: category,
                    modified: modifiedDate,
                    size: file.length
                });
            }
        }
        return items;
    }
    
    // Processo principal de geração para um tipo de asset (ícone ou imagem)
    function runCacheProcess(pathList, cacheFile, extensionRegex, assetType) {
        if (cacheFile.exists) {
            updateStatus("Cache de " + assetType + " já existe. Pulando.", "info");
            win.update();
            return;
        }
    
        var allItems = [];
        updateStatus("Iniciando escaneamento de " + assetType + "...", "info");
        win.update(); 
    
        for (var i = 0; i < pathList.length; i++) {
            if (isCancelled) break;
            var currentPath = pathList[i];
            if (currentPath && currentPath.replace(/\s/g, '') !== '') {
                var testFolder = new Folder(currentPath);
                if (testFolder.exists) {
                    updateStatus("Escaneando: " + testFolder.name, "info");
                    win.update();
    
                    allItems = allItems.concat(scanFolder(testFolder, "Raiz", extensionRegex));
                    var subFolders = testFolder.getFiles(function (f) { return f instanceof Folder; });
                    
                    for (var j = 0; j < subFolders.length; j++) {
                        if (isCancelled) break;
                        updateStatus("Escaneando subpasta: " + subFolders[j].name, "info");
                        win.update();
                        allItems = allItems.concat(scanFolder(subFolders[j], subFolders[j].name, extensionRegex));
                    }
                }
            }
        }
    
        if (!isCancelled && allItems.length > 0) {
            try {
                updateStatus("Salvando cache de " + assetType + "...", "info");
                win.update();
                cacheFile.encoding = "UTF-8";
                cacheFile.open("w");
                cacheFile.write(allItems.toSource());
                cacheFile.close();
            } catch (e) {
                updateStatus("Erro ao salvar cache de " + assetType + ": " + e.toString(), "error");
            }
        }
    }
    
    function startCacheGeneration() {
        isCancelled = false;
        ui.generateCacheBtn.enabled = false;
        ui.okBtn.enabled = false;
        ui.cancelBtn.visible = true;
    
        try {
            var paths = collectPathsFromUI();
            var rootPath = CENTRAL_CONFIG_FILE.parent.parent.parent.fsName + "/";
            var cacheFolder = new Folder(rootPath + "source/cache/");
            if (!cacheFolder.exists) cacheFolder.create();
            
            var iconCacheFile = new File(cacheFolder.fsName + "/libraryLive_Icons_Cache.json");
            var imageCacheFile = new File(cacheFolder.fsName + "/libraryLive_Images_Cache.json");
            
            // Processa Ícones
            runCacheProcess(paths.icon_root_paths, iconCacheFile, /\.png$/i, "Ícones");
            
            if (isCancelled) {
                updateStatus("Geração de cache cancelada.", "warning");
            } else {
                // Processa Imagens
                runCacheProcess(paths.image_root_paths, imageCacheFile, /\.(png|jpg|jpeg)$/i, "Imagens");
            }
    
            if (!isCancelled) {
                updateStatus("Geração de cache concluída.", "success");
            }
    
        } catch(e) {
            updateStatus("ERRO: " + e.toString(), "error");
        } finally {
            isCancelled = false;
            ui.generateCacheBtn.enabled = true;
            ui.okBtn.enabled = true;
            ui.cancelBtn.visible = false;
        }
    }

    // --- PARTE 2: LÓGICA DE CONFIGURAÇÃO CENTRAL ---
    var CENTRAL_CONFIG_FILE = new File(scriptMainPath + 'source/config/LIBRARYLIVE_config.json');

    function loadCentralConfig() {
        if (CENTRAL_CONFIG_FILE.exists) {
            try {
                CENTRAL_CONFIG_FILE.open('r');
                var content = CENTRAL_CONFIG_FILE.read();
                CENTRAL_CONFIG_FILE.close();
                return JSON.parse(content);
            } catch (e) {
                alert("Erro ao ler o arquivo de configuração central (LIBRARYLIVE_config.json):\n" + e.toString());
                return null;
            }
        }
        alert("Arquivo de configuração central não encontrado:\n" + CENTRAL_CONFIG_FILE.fsName);
        return null;
    }

    function saveCentralConfig(configObject) {
        try {
            CENTRAL_CONFIG_FILE.open('w');
            CENTRAL_CONFIG_FILE.write(JSON.stringify(configObject, null, 2));
            CENTRAL_CONFIG_FILE.close();
            return true;
        } catch (e) {
            alert("Erro ao salvar o arquivo de configuração central:\n" + e.toString());
            return false;
        }
    }

    // --- PARTE 3: CONSTRUÇÃO DA JANELA ---
    var centralConfig = loadCentralConfig();
    if (!centralConfig) return;

    if (!centralConfig.tool_settings) centralConfig.tool_settings = {};
    if (!centralConfig.tool_settings.LibraryLive) centralConfig.tool_settings.LibraryLive = { icon_root_paths: [""], image_root_paths: [""] };
    
    var LibraryLiveConfig = centralConfig.tool_settings.LibraryLive;

    // Retrocompatibilidade
    if (LibraryLiveConfig.icon_root_path && !LibraryLiveConfig.icon_root_paths) {
        LibraryLiveConfig.icon_root_paths = [LibraryLiveConfig.icon_root_path];
        delete LibraryLiveConfig.icon_root_path;
    }
    if (LibraryLiveConfig.image_root_path && !LibraryLiveConfig.image_root_paths) {
        LibraryLiveConfig.image_root_paths = [LibraryLiveConfig.image_root_path];
        delete LibraryLiveConfig.image_root_path;
    }
     if (!LibraryLiveConfig.icon_root_paths) LibraryLiveConfig.icon_root_paths = [""];
     if (!LibraryLiveConfig.image_root_paths) LibraryLiveConfig.image_root_paths = [""];

    var win = new Window("palette", "Configurações - LibraryLive");
    setBgColor(win, THEME.bgColor);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 15;
    win.margins = 15;

    // --- Função para adicionar uma linha de caminho ---
    function addPathLine(parent, path) {
        var group = parent.add("group");
        group.orientation = "row";
        group.alignChildren = ["left", "center"];
        group.spacing = 5;

        var browseBtn = new themeIconButton(group, { icon: D9T_PASTA_ICON, tips: ["Selecionar pasta"] });
        var pathText = group.add("edittext", undefined, path || "");
        pathText.preferredSize.width = 380;
        var deleteBtn = new themeIconButton(group, { icon: D9T_FECHAR_ICON, tips: ["Remover este caminho"] });

        addClickHandler(browseBtn, function() {
            var f = Folder.selectDialog("Selecione a pasta");
            if (f) pathText.text = f.fsName;
        });

        addClickHandler(deleteBtn, function() {
            parent.remove(group);
            win.layout.layout(true);
        });
    }

    // --- Grupo de Caminhos dos Ícones ---
    var iconsPanel = win.add("panel", undefined, "Pastas de Ícones (todas as válidas serão usadas)");
    setFgColor(iconsPanel, THEME.normalColor.slice(0,3)); // setFgColor espera array [r,g,b]
    iconsPanel.alignChildren = ["fill", "top"];
    var iconListGroup = iconsPanel.add("group");
    iconListGroup.orientation = "column";
    iconListGroup.spacing = 5;
    
    var addIconBtn = iconsPanel.add("button", undefined, "+ Adicionar Caminho");
    addIconBtn.alignment = "right";
    addIconBtn.onClick = function() { 
        addPathLine(iconListGroup, ""); 
        win.layout.layout(true);
    };

    for (var i = 0; i < LibraryLiveConfig.icon_root_paths.length; i++) {
        addPathLine(iconListGroup, LibraryLiveConfig.icon_root_paths[i]);
    }
    
    // --- Grupo de Caminhos das Imagens ---
    var imagesPanel = win.add("panel", undefined, "Pastas de Imagens (todas as válidas serão usadas)");
    setFgColor(imagesPanel, THEME.normalColor.slice(0,3));
    imagesPanel.alignChildren = ["fill", "top"];
    var imageListGroup = imagesPanel.add("group");
    imageListGroup.orientation = "column";
    imageListGroup.spacing = 5;

    var addImageBtn = imagesPanel.add("button", undefined, "+ Adicionar Caminho");
    addImageBtn.alignment = "right";
    addImageBtn.onClick = function() { 
        addPathLine(imageListGroup, ""); 
        win.layout.layout(true);
    };

    for (var j = 0; j < LibraryLiveConfig.image_root_paths.length; j++) {
        addPathLine(imageListGroup, LibraryLiveConfig.image_root_paths[j]);
    }
    
    // =============================================================================
    // --- ALTERAÇÃO AQUI: Botões de Ação Unificados ---
    // =============================================================================
    var actionBtnGroup = win.add("group");
    actionBtnGroup.orientation = "row";
    actionBtnGroup.alignment = "fill"; // Alinha o grupo para preencher o espaço

    // Grupo para Importar/Exportar à esquerda
    var ioGroup = actionBtnGroup.add("group");
    ioGroup.orientation = "row";
    ioGroup.alignment = "left";
    var importBtn = ioGroup.add("button", undefined, "Importar JSON");
    var exportBtn = ioGroup.add("button", undefined, "Exportar JSON");

    // Grupo para outros botões à direita
    var mainActionsGroup = actionBtnGroup.add("group");
    mainActionsGroup.orientation = "row";
    mainActionsGroup.alignment = "right";
    ui.generateCacheBtn = mainActionsGroup.add("button", undefined, "Gerar Cache");
    ui.cancelBtn = mainActionsGroup.add("button", undefined, "Cancelar");
    ui.cancelBtn.visible = false;
    ui.okBtn = mainActionsGroup.add("button", undefined, "Salvar");
    // =============================================================================
    
    // --- Barra de Status ---
    var statusPanel = win.add("panel", undefined, "Status");
    statusPanel.alignment = 'fill';
    statusPanel.margins = 10;
    ui.statusText = statusPanel.add('statictext', undefined, 'Pronto.', { truncate: 'end' });
    ui.statusText.alignment = 'fill';
    updateStatus("Pronto.", "neutral");

    // --- Lógica dos botões ---
    function collectPathsFromUI() {
        var iconPaths = [];
        for (var i = 0; i < iconListGroup.children.length; i++) {
            var path = iconListGroup.children[i].children[1].text; 
            if (path && path.replace(/\s/g, '') !== '') iconPaths.push(path);
        }
        var imagePaths = [];
        for (var j = 0; j < imageListGroup.children.length; j++) {
            var path = imageListGroup.children[j].children[1].text;
            if (path && path.replace(/\s/g, '') !== '') imagePaths.push(path);
        }
        return { icon_root_paths: iconPaths, image_root_paths: imagePaths };
    }

    function populateUIFromData(data) {
        while(iconListGroup.children.length > 0) iconListGroup.remove(iconListGroup.children[0]);
        while(imageListGroup.children.length > 0) imageListGroup.remove(imageListGroup.children[0]);
        var iconPaths = data.icon_root_paths || [];
        var imagePaths = data.image_root_paths || [];
        for (var i = 0; i < iconPaths.length; i++) addPathLine(iconListGroup, iconPaths[i]);
        for (var j = 0; j < imagePaths.length; j++) addPathLine(imageListGroup, imagePaths[j]);
        win.layout.layout(true);
    }

    exportBtn.onClick = function() {
        var saveFile = File.saveDialog("Exportar Configuração", "LIBRARYLIVE_config.json");
        if (saveFile) {
            var paths = collectPathsFromUI();
            try {
                saveFile.open('w');
                saveFile.write(JSON.stringify(paths, null, 2));
                saveFile.close();
                alert("Configuração exportada com sucesso para:\n" + saveFile.fsName);
            } catch (e) { alert("Erro ao exportar arquivo:\n" + e.toString()); }
        }
    };
    
    importBtn.onClick = function() {
        var loadFile = File.openDialog("Selecione o arquivo JSON de configuração", "*.json");
        if (loadFile && loadFile.exists) {
            try {
                loadFile.open('r');
                var content = loadFile.read();
                loadFile.close();
                var data = JSON.parse(content);
                if (data.icon_root_paths || data.image_root_paths) {
                    populateUIFromData(data);
                } else { alert("Arquivo JSON inválido. As chaves 'icon_root_paths' ou 'image_root_paths' não foram encontradas."); }
            } catch (e) { alert("Erro ao importar arquivo:\n" + e.toString()); }
        }
    };

    ui.okBtn.onClick = function() {
        var paths = collectPathsFromUI();
        centralConfig.tool_settings.LibraryLive.icon_root_paths = paths.icon_root_paths;
        centralConfig.tool_settings.LibraryLive.image_root_paths = paths.image_root_paths;
        delete centralConfig.tool_settings.LibraryLive.icon_root_path;
        delete centralConfig.tool_settings.LibraryLive.image_root_path;
        
        if (saveCentralConfig(centralConfig)) {
            updateStatus("Configurações salvas. É necessário reabrir o LibraryLive.", "success");
            win.close(); // Fecha a janela automaticamente
        } else {
            updateStatus("Falha ao salvar o arquivo de configuração.", "error");
        }
    };
    
    ui.generateCacheBtn.onClick = startCacheGeneration;
    ui.cancelBtn.onClick = function() {
        isCancelled = true;
    };
    
    win.layout.layout(true);
    win.center();
    win.show();

})();