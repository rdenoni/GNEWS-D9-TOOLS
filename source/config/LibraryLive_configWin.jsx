(function() {

    // --- PARTE 1: TEMA E FUNÇÕES AUXILIARES ---
    var THEME = {
        bgColor: '#0B0D0E',
        normalColor: '#C7C8CA'
    };
    function hexToRgb(hex) { if(!hex) return [0,0,0]; hex = hex.replace('#', ''); return [parseInt(hex.substring(0,2), 16)/255, parseInt(hex.substring(2,4), 16)/255, parseInt(hex.substring(4,6), 16)/255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1); } catch (e) {} }
    
    function addClickHandler(element, handler) {
        if (!element) return;
        if (element.leftClick) {
            element.leftClick.onClick = handler;
        } else {
            element.onClick = handler;
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
    setFgColor(iconsPanel, THEME.normalColor);
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
    setFgColor(imagesPanel, THEME.normalColor);
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

    // --- Grupo de Importar/Exportar ---
    var ioGroup = win.add("group");
    ioGroup.orientation = "row";
    ioGroup.alignment = "left";
    var importBtn = ioGroup.add("button", undefined, "Importar JSON");
    var exportBtn = ioGroup.add("button", undefined, "Exportar JSON");
    
    // --- Botões de Ação ---
    var btnGroup = win.add("group");
    btnGroup.alignment = "right";
    var closeBtn = btnGroup.add("button", undefined, "Fechar");
    var okBtn = btnGroup.add("button", undefined, "Salvar");

    closeBtn.onClick = function() {
        win.close();
    }

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

    okBtn.onClick = function() {
        var paths = collectPathsFromUI();
        centralConfig.tool_settings.LibraryLive.icon_root_paths = paths.icon_root_paths;
        centralConfig.tool_settings.LibraryLive.image_root_paths = paths.image_root_paths;
        delete centralConfig.tool_settings.LibraryLive.icon_root_path;
        delete centralConfig.tool_settings.LibraryLive.image_root_path;
        
        if (saveCentralConfig(centralConfig)) {
            alert("Configurações salvas com sucesso em:\n" + CENTRAL_CONFIG_FILE.fsName);
        }
    };
    
    win.layout.layout(true);
    win.center();
    win.show();

})();