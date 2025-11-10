/**********************************************************************************
 *
 * GNEWS LayerOrder - JANELA DE CONFIGURAÇÕES
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 3.5.0 (Módulo Puro com Tema)

 **********************************************************************************/
// ADICIONADO: Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";
function launchLayerOrderConfigWinUI() {

    // =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// =================================================================================
    var JANELA_TITULO = "Configurações do Organizador de Camadas";

    // As variáveis de CORES e a LÓGICA DE TEMA (setBgColor, setFgColor, hexToRgb)
	// são carregadas pelo script principal (GND9TOOLS.jsx). Este script apenas as consome.

    // =================================================================================
	// --- LÓGICA DE CONFIGURAÇÃO (CARREGAR E SALVAR) ---
	// =================================================================================

    // Carrega a configuração a partir de um arquivo JSON na pasta de dados do usuário.
    // Se o arquivo não existir ou estiver corrompido, retorna um objeto com as configurações padrão.
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
                // Garante que todas as chaves padrão existam no arquivo carregado
                for (var key in defaultConfig) {
                    if (!config.hasOwnProperty(key)) {
                        config[key] = defaultConfig[key];
                    }
                }
                return config;
            } catch (e) {
                return defaultConfig; // Retorna padrão em caso de erro de leitura do JSON
            }
        } else {
            return defaultConfig; // Retorna padrão se o arquivo não existe
        }
    }

    // Salva o objeto de configuração fornecido em um arquivo JSON.
    function saveConfig(configObject) {
        var configFile = new File(Folder.userData.fsName + "/LAYERSORDER_config.json");
        try {
            configFile.open("w");
            configFile.encoding = "UTF-8";
            configFile.write(JSON.stringify(configObject, null, 2)); // Formata o JSON para melhor legibilidade
            configFile.close();
            return true;
        } catch (e) {
            alert("Erro ao salvar o arquivo de configuração:\n" + e.toString());
            return false;
        }
    }

    // =================================================================================
	// --- DADOS E STRINGS PARA A UI ---
	// =================================================================================

    // Mapeamento dos nomes de cores para exibição na UI, por idioma.
    var colorNames = {
        PT: ["Nenhuma", "Vermelho", "Amarelo", "Verde (Padrão)", "Rosa", "Lavanda", "Pêssego", "Verde Água", "Azul", "Verde Musgo", "Roxo", "Laranja", "Marrom", "Fúcsia", "Ciano", "Arenito"],
        EN: ["None", "Red", "Yellow", "Green (Default)", "Pink", "Lavender", "Peach", "Teal", "Blue", "Moss Green", "Purple", "Orange", "Brown", "Fuchsia", "Cyan", "Sandstone"]
    };
    // Nomes de exibição para os tipos de camada na UI.
    var layerTypeDisplayNames = {
        PT: { "ShapeLayer": "Shapes", "TextLayer": "Textos", "SolidLayer": "Sólidos", "AdjustmentLayer": "Ajustes", "CompItem": "Comps", "CameraLayer": "Câmeras", "NullLayer": "Nulos", "VideoLayer": "Vídeos", "ImageLayer": "Imagens" },
        EN: { "ShapeLayer": "Shapes", "TextLayer": "Texts", "SolidLayer": "Solids", "AdjustmentLayer": "Adjustments", "CompItem": "Comps", "CameraLayer": "Cameras", "NullLayer": "Nulls", "VideoLayer": "Videos", "ImageLayer": "Images" }
    };
    // Cores RGB (0-1) para a pré-visualização na UI, correspondendo ao índice do After Effects.
    var colorPreviews = [ [0,0,0], [1,0,0], [1,1,0], [0.54, 0.76, 0.28], [1,0.41,0.71], [0.9,0.9,0.98], [1,0.85,0.73], [0,0.5,0.5], [0,0,1], [0.2,0.8,0.2], [0.5,0,0.5], [1,0.65,0], [0.65,0.16,0.16], [1,0,1], [0,1,1], [0.96,0.96,0.86] ];

    // Retorna o texto localizado com base na chave e no idioma.
    function getLocalizedString(key, lang) {
        var strings = {
            PT: { settingsTitle: JANELA_TITULO, languageLabel: "Idioma: ", prefixesTab: "Prefixos", colorsTab: "Cores", saveBtn: "Salvar", cancelBtn: "Cancelar", settingsSaved: "Configurações salvas com sucesso!" },
            EN: { settingsTitle: "Layer Organizer Settings", languageLabel: "Language: ", prefixesTab: "Prefixes", colorsTab: "Colors", saveBtn: "Save", cancelBtn: "Cancel", settingsSaved: "Settings saved successfully!" }
        };
        return strings[lang][key] || key;
    }

    // =================================================================================
	// --- CONSTRUÇÃO DA INTERFACE GRÁFICA (UI) ---
	// =================================================================================
    function createSettingsWindow(config) {
        var currentLang = config.language;

        // Cria a janela principal do tipo 'dialog'.
        var settingsWin = new Window("dialog", getLocalizedString("settingsTitle", currentLang));
        settingsWin.orientation = "column";
        settingsWin.alignChildren = ["fill", "top"];
        settingsWin.spacing = 10;
        settingsWin.margins = 15;

        // Aplica a cor de fundo global, se a função e a variável estiverem disponíveis.
        if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
            setBgColor(settingsWin, bgColor1);
        }

        // --- Grupo para seleção de Idioma ---
        var languageGroup = settingsWin.add("group");
        languageGroup.orientation = "row";
        var languageLabel = languageGroup.add("statictext", undefined, getLocalizedString("languageLabel", currentLang));
        if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
            setFgColor(languageLabel, normalColor1);
        }
        var languageDropdown = languageGroup.add("dropdownlist", undefined, ["PT", "EN"]);
        languageDropdown.selection = config.language === "PT" ? 0 : 1;

        // --- Painel com Abas para Prefixos e Cores ---
        var tabbedPanel = settingsWin.add("tabbedpanel");
        tabbedPanel.alignChildren = ["fill", "top"];
        tabbedPanel.margins = 5;

        // --- Aba de Prefixos ---
        var prefixesTab = tabbedPanel.add("tab", undefined, getLocalizedString("prefixesTab", currentLang));
        prefixesTab.orientation = "column";
        prefixesTab.spacing = 8;
        prefixesTab.margins = 10;
        var prefixInputs = {}; // Objeto para armazenar as caixas de texto de prefixo
        for (var layerType in config.prefixes) {
            var prefixGroup = prefixesTab.add("group");
            prefixGroup.orientation = "row";
            var label = prefixGroup.add("statictext", undefined, layerTypeDisplayNames[currentLang][layerType] + ":");
            label.preferredSize = [80, 20];
            if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
                setFgColor(label, normalColor1);
            }
            prefixInputs[layerType] = prefixGroup.add("edittext", undefined, config.prefixes[layerType]);
            prefixInputs[layerType].preferredSize = [100, 20];
        }

        // --- Aba de Cores ---
        var colorsTab = tabbedPanel.add("tab", undefined, getLocalizedString("colorsTab", currentLang));
        colorsTab.orientation = "column";
        colorsTab.spacing = 8;
        colorsTab.margins = 10;
        var colorDropdowns = {}; // Objeto para armazenar os dropdowns de cores
        for (var layerTypeColor in config.layerColorIndices) {
            var group = colorsTab.add("group");
            group.orientation = "row";
            group.alignChildren = ["left", "center"];
            var colorLabel = group.add("statictext", undefined, layerTypeDisplayNames[currentLang][layerTypeColor] + ":");
            colorLabel.preferredSize = [70, 20];
             if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
                setFgColor(colorLabel, normalColor1);
            }

            // Painel de pré-visualização da cor
            var preview = group.add("panel", undefined, "");
            preview.preferredSize = [15, 15];
            var colorIndex = config.layerColorIndices[layerTypeColor];
            var initialColor = colorPreviews[colorIndex];
            preview.graphics.backgroundColor = preview.graphics.newBrush(preview.graphics.BrushType.SOLID_COLOR, initialColor);

            var dropdown = group.add("dropdownlist", undefined, colorNames[currentLang]);
            dropdown.selection = colorIndex;
            dropdown.preferredSize = [120, 20];
            colorDropdowns[layerTypeColor] = dropdown;

            // Evento para atualizar a cor de pré-visualização quando o dropdown muda
            dropdown.onChange = (function(p) {
                return function() {
                    var newColor = colorPreviews[this.selection.index];
                    p.graphics.backgroundColor = p.graphics.newBrush(p.graphics.BrushType.SOLID_COLOR, newColor);
                };
            })(preview);
        }

        // --- Grupo de Botões (Salvar e Cancelar) ---
        var btnGroup = settingsWin.add("group");
        btnGroup.alignment = ["fill", "bottom"];
        btnGroup.alignChildren = ["right", "center"];
        var cancelBtn = btnGroup.add("button", undefined, getLocalizedString("cancelBtn", currentLang));
        var saveBtn = btnGroup.add("button", undefined, getLocalizedString("saveBtn", currentLang));

        // Lógica do botão Salvar: coleta os dados da UI, cria um novo objeto de configuração e o salva.
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

        // Lógica do botão Cancelar: apenas fecha a janela.
        cancelBtn.onClick = function() { settingsWin.close(); };

        // Finaliza a configuração e exibe a janela.
        settingsWin.layout.layout(true);
        settingsWin.center();
        settingsWin.show();
    }

    // --- Ponto de Entrada do Script ---
    // Inicia o processo carregando a configuração atual e criando a janela.
    var currentConfig = loadConfig();
    createSettingsWindow(currentConfig);
}