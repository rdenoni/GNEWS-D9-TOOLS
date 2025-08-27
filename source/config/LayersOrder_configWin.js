// Auto Layer Organizer - Script de Configurações
// Versão 3.4 (Tema de UI aplicado)
// Execute este script para alterar as configurações de prefixos, cores e idioma.
// As configurações serão salvas e usadas pelo script principal.

(function() {

    // --- LÓGICA DE TEMA ADICIONADA ---
    var bgColor1 = '#0B0D0E';
    var normalColor1 = '#C7C8CA';
    var highlightColor1 = '#E0003A';
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }
    // --- FIM DA LÓGICA DE TEMA ---

    // Função para carregar a configuração de um arquivo JSON.
    function loadConfig() {
        var configFile = new File(Folder.userData.fsName + "/organizer_config.json");
        var defaultConfig = {
            language: "PT",
            prefixes: {
                ShapeLayer: "Shp_", TextLayer: "Txt_", SolidLayer: "Sld_",
                AdjustmentLayer: "Ajust_", CompItem: "Comp_", CameraLayer: "Cam_",
                NullLayer: "Null_", VideoLayer: "Vid_", ImageLayer: "Img_"
            },
            layerColorIndices: {
                ShapeLayer: 8, TextLayer: 1, SolidLayer: 14, AdjustmentLayer: 2,
                CompItem: 12, CameraLayer: 2, NullLayer: 2, VideoLayer: 14, ImageLayer: 11
            }
        };

        if (configFile.exists) {
            try {
                configFile.open("r");
                var config = JSON.parse(configFile.read());
                configFile.close();
                return config;
            } catch (e) {
                return defaultConfig;
            }
        } else {
            return defaultConfig;
        }
    }

    // Função para salvar a configuração em um arquivo JSON.
    function saveConfig(configObject) {
        var configFile = new File(Folder.userData.fsName + "/organizer_config.json");
        try {
            configFile.open("w");
            configFile.write(JSON.stringify(configObject, null, 2));
            configFile.close();
            return true;
        } catch (e) {
            alert("Erro ao salvar o arquivo de configuração:\n" + e.toString());
            return false;
        }
    }
    
    // Dados necessários para a janela de configurações
    var colorNames = {
        PT: ["Nenhuma", "Vermelho", "Amarelo", "Aqua", "Rosa", "Lavanda", "Pêssego", "Verde Água", "Azul", "Verde", "Roxo", "Laranja", "Marrom", "Fúcsia", "Ciano", "Arenito"],
        EN: ["None", "Red", "Yellow", "Aqua", "Pink", "Lavender", "Peach", "Teal", "Blue", "Green", "Purple", "Orange", "Brown", "Fuchsia", "Cyan", "Sandstone"]
    };
    var layerTypeDisplayNames = {
        PT: { "ShapeLayer": "Shapes", "TextLayer": "Textos", "SolidLayer": "Sólidos", "AdjustmentLayer": "Ajustes", "CompItem": "Comps", "CameraLayer": "Câmeras", "NullLayer": "Nulos", "VideoLayer": "Vídeos", "ImageLayer": "Imagens" },
        EN: { "ShapeLayer": "Shapes", "TextLayer": "Texts", "SolidLayer": "Solids", "AdjustmentLayer": "Adjustments", "CompItem": "Comps", "CameraLayer": "Cameras", "NullLayer": "Nulls", "VideoLayer": "Videos", "ImageLayer": "Images" }
    };
    var colorPreviews = [ [0,0,0], [1,0,0], [1,1,0], [0,1,1], [1,0.41,0.71], [0.9,0.9,0.98], [1,0.85,0.73], [0,0.5,0.5], [0,0,1], [0,1,0], [0.5,0,0.5], [1,0.65,0], [0.65,0.16,0.16], [1,0,1], [0,1,1], [0.96,0.96,0.86] ];

    function getLocalizedString(key, lang) {
        var strings = {
            PT: { settingsTitle: "Configurações do Organizador", languageLabel: "Idioma: ", prefixesTab: "Prefixos", colorsTab: "Cores", saveBtn: "Salvar", cancelBtn: "Cancelar", settingsSaved: "Configurações salvas!" },
            EN: { settingsTitle: "Organizer Settings", languageLabel: "Language: ", prefixesTab: "Prefixes", colorsTab: "Colors", saveBtn: "Save", cancelBtn: "Cancel", settingsSaved: "Settings saved!" }
        };
        return strings[lang][key] || key;
    }
    
    // Função que cria e exibe a janela de configurações
    function createSettingsWindow(config) {
        var currentLang = config.language;
        
        var settingsWin = new Window("dialog", getLocalizedString("settingsTitle", currentLang));
        settingsWin.orientation = "column";
        settingsWin.alignChildren = ["fill", "top"];
        settingsWin.spacing = 10;
        settingsWin.margins = 15;
        
        setBgColor(settingsWin, bgColor1); // Aplica cor de fundo na janela

        var languageGroup = settingsWin.add("group");
        languageGroup.orientation = "row";
        var languageLabel = languageGroup.add("statictext", undefined, getLocalizedString("languageLabel", currentLang));
        setFgColor(languageLabel, normalColor1); // Aplica cor no texto
        
        var languageDropdown = languageGroup.add("dropdownlist", undefined, ["PT", "EN"]);
        languageDropdown.selection = config.language === "PT" ? 0 : 1;

        var tabbedPanel = settingsWin.add("tabbedpanel");
        tabbedPanel.alignChildren = ["fill", "top"];
        tabbedPanel.margins = 5;
        setBgColor(tabbedPanel, bgColor1);
        
        // Aba de Prefixos
        var prefixesTab = tabbedPanel.add("tab", undefined, getLocalizedString("prefixesTab", currentLang));
        prefixesTab.orientation = "column";
        prefixesTab.spacing = 5;
        setBgColor(prefixesTab, bgColor1);
        var prefixInputs = {};
        for (var layerType in config.prefixes) {
            var prefixGroup = prefixesTab.add("group");
            prefixGroup.orientation = "row";
            var label = prefixGroup.add("statictext", undefined, layerTypeDisplayNames[currentLang][layerType] + ":");
            label.preferredSize = [80, 20];
            setFgColor(label, normalColor1);
            
            prefixInputs[layerType] = prefixGroup.add("edittext", undefined, config.prefixes[layerType]);
            prefixInputs[layerType].preferredSize = [80, 20];
        }

        // Aba de Cores
        var colorsTab = tabbedPanel.add("tab", undefined, getLocalizedString("colorsTab", currentLang));
        colorsTab.orientation = "column";
        colorsTab.spacing = 5;
        setBgColor(colorsTab, bgColor1);
        var colorDropdowns = {};
        for (var layerType in config.layerColorIndices) {
            var group = colorsTab.add("group");
            group.orientation = "row";
            var colorLabel = group.add("statictext", undefined, layerTypeDisplayNames[currentLang][layerType] + ":");
            colorLabel.preferredSize = [70, 20];
            setFgColor(colorLabel, normalColor1);

            var preview = group.add("panel", undefined, "");
            preview.preferredSize = [15, 15];
            var colorIndex = config.layerColorIndices[layerType];
            var initialColor = colorPreviews[colorIndex];
            preview.graphics.backgroundColor = preview.graphics.newBrush(preview.graphics.BrushType.SOLID_COLOR, initialColor);
            
            var dropdown = group.add("dropdownlist", undefined, colorNames[currentLang]);
            dropdown.selection = colorIndex;
            dropdown.preferredSize = [80, 20];
            colorDropdowns[layerType] = dropdown;

            dropdown.onChange = (function(p) {
                return function() {
                    var newColor = colorPreviews[this.selection.index];
                    p.graphics.backgroundColor = p.graphics.newBrush(p.graphics.BrushType.SOLID_COLOR, newColor);
                };
            })(preview);
        }

        var btnGroup = settingsWin.add("group");
        btnGroup.alignment = ["fill", "bottom"];
        btnGroup.alignChildren = ["right", "center"];
        var saveBtn = btnGroup.add("button", undefined, getLocalizedString("saveBtn", currentLang));
        var cancelBtn = btnGroup.add("button", undefined, getLocalizedString("cancelBtn", currentLang));

        saveBtn.onClick = function() {
            var newConfig = {
                language: languageDropdown.selection.index === 0 ? "PT" : "EN",
                prefixes: {},
                layerColorIndices: {}
            };
            
            for (var pType in prefixInputs) { newConfig.prefixes[pType] = prefixInputs[pType].text; }
            for (var cType in colorDropdowns) { newConfig.layerColorIndices[cType] = colorDropdowns[cType].selection.index; }

            if (saveConfig(newConfig)) {
                alert(getLocalizedString("settingsSaved", newConfig.language));
                settingsWin.close();
            }
        };

        cancelBtn.onClick = function() { settingsWin.close(); };

        settingsWin.layout.layout(true);
        settingsWin.center();
        settingsWin.show();
    }

    // Iniciar o processo
    var currentConfig = loadConfig();
    createSettingsWindow(currentConfig);

})();