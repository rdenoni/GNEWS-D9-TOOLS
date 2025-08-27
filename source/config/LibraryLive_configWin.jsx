// Conteúdo FINAL (com ícones na esquerda) para: LibraryLive_config_ui.jsx

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

    // --- PARTE 3: CONSTRUÇÃO DA JANELA (com layout ajustado) ---
    var centralConfig = loadCentralConfig();
    if (!centralConfig) return;

    if (!centralConfig.tool_settings) centralConfig.tool_settings = {};
    if (!centralConfig.tool_settings.LibraryLive) centralConfig.tool_settings.LibraryLive = { icon_root_path: "", image_root_path: "" };
    
    var LibraryLiveConfig = centralConfig.tool_settings.LibraryLive;

    var win = new Window("dialog", "Configurações - LibraryLive");
    setBgColor(win, THEME.bgColor);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 15;

    // --- Grupo de Caminho dos Ícones ---
    var iconGroup = win.add("group");
    iconGroup.orientation = "row";
    iconGroup.alignChildren = ["left", "center"];
    
    // <<<< ALTERADO: Ícone adicionado PRIMEIRO >>>>
    var iconBtn = new themeIconButton(iconGroup, { icon: D9T_PASTA_ICON, tips: ["Selecionar pasta de ícones"] });
    
    var iconLabel = iconGroup.add("statictext", undefined, "Pasta de Ícones:");
    setFgColor(iconLabel, THEME.normalColor);
    var iconPath = iconGroup.add("edittext", undefined, LibraryLiveConfig.icon_root_path);
    iconPath.preferredSize.width = 350;
    
    addClickHandler(iconBtn, function() {
        var f = Folder.selectDialog("Selecione a pasta de ícones");
        if (f) iconPath.text = f.fsName;
    });

    // --- Grupo de Caminho das Imagens ---
    var imageGroup = win.add("group");
    imageGroup.orientation = "row";
    imageGroup.alignChildren = ["left", "center"];
    
    // <<<< ALTERADO: Ícone adicionado PRIMEIRO >>>>
    var imageBtn = new themeIconButton(imageGroup, { icon: D9T_PASTA_ICON, tips: ["Selecionar pasta de imagens"] });

    var imageLabel = imageGroup.add("statictext", undefined, "Pasta de Imagens:");
    setFgColor(imageLabel, THEME.normalColor);
    var imagePath = imageGroup.add("edittext", undefined, LibraryLiveConfig.image_root_path);
    imagePath.preferredSize.width = 350;
    
    addClickHandler(imageBtn, function() {
        var f = Folder.selectDialog("Selecione a pasta de imagens");
        if (f) imagePath.text = f.fsName;
    });
    
    // --- Botões de Ação ---
    var btnGroup = win.add("group");
    btnGroup.alignment = "right";
    btnGroup.add("button", undefined, "Cancelar", {name: "cancel"});
    var okBtn = btnGroup.add("button", undefined, "Salvar", {name: "ok"});

    okBtn.onClick = function() {
        centralConfig.tool_settings.LibraryLive.icon_root_path = iconPath.text;
        centralConfig.tool_settings.LibraryLive.image_root_path = imagePath.text;
        
        if (saveCentralConfig(centralConfig)) {
            alert("Configurações do LibraryLive salvas com sucesso!");
            win.close();
        }
    };
    
    win.show();

})();