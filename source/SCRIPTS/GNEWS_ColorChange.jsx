/********************************************************************************
*
* GNEWS CHANGE COLOR
* Autor: Gemini (Google AI) & Usuário
* Versão: 15.2 (Adicionado Modo de Compatibilidade para Versões Antigas)
*
* MODULOS USADOS:
* source/globals.js (para variáveis de tema e cores, incluindo a versão do AE)
* source/libraries/HELP lib.js (para a janela de ajuda)
* source/layout/main_ui_functions.js (para o componente themeIconButton)
* source/libraries/ICON lib.js (para o ícone de ajuda D9T_INFO_ICON)
*
* ATUALIZAÇÃO:
* - MODO DE COMPATIBILIDADE: Adicionada uma função que verifica a versão do
* After Effects ('appV' de globals.js). Em versões anteriores a 2025 (v25),
* os ícones Unicode dos títulos dos painéis são removidos para evitar
* erros de exibição.
* - LÓGICA DE APLICAÇÃO: O botão 'Aplicar Cor' agora considera a composição
* ativa na timeline como alvo se nenhuma composição estiver selecionada no
* painel de Projeto.
* - REESTRUTURAÇÃO UI: A interface foi redesenhada para seguir o padrão visual
* do GNEWS, utilizando as variáveis de cores e tema do 'globals.js'.
* - INTEGRAÇÃO DE AJUDA: A chamada para a janela de ajuda utiliza a função
* global 'showColorChangeHelp' da 'HELP lib.js'.
*
********************************************************************************/
$.encoding = "UTF-8";

function launchColorChange() {

    // =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// Aqui você pode ajustar facilmente a aparência e o comportamento do script.
	// =================================================================================
    var SCRIPT_NAME = "GNEWS Change Color";
    var SCRIPT_SUBTITLE = "Análise e aplicação de cores";
    var SCRIPT_VERSION = "15.2";
    var SCRIPT_WINDOW_TITLE = SCRIPT_NAME + " v" + SCRIPT_VERSION; // Título que aparece na barra da janela

    // Configurações de Tamanho da Interface
    var LARGURA_JANELA = 280;
    var ALTURA_BOTAO_APLICAR = 40;
    var ALTURA_PAINEL_STATUS = 30;
    var TAMANHO_BOTAO_AJUDA = 25;

    // Configurações de Layout
    var MARGENS_JANELA = 15;
    var ESPACAMENTO_ELEMENTOS = 5;

    // Definição de Cores para o status (padrão interno do script)
    var COLORS = {
        success: [0.2, 0.8, 0.2], // Verde para sucesso
        error: [0.8, 0.2, 0.2],   // Vermelho para erro
        warning: [0.9, 0.7, 0.2], // Laranja para aviso
        info: [0.2, 0.6, 0.9],    // Azul para informação
        neutral: [0.9, 0.9, 0.9], // Cinza para estado neutro/inicial
    };

    // Variáveis globais do escopo da função para os elementos de UI que precisam ser acessados por outras funções
    var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
    var PREFS_KEY = "ColorChange";
    var defaultPrefs = { lastColorHex: "#E53131", lastPreset: "Custom" };
    var modulePrefs = (prefsApi && prefsApi.getModulePrefs) ? prefsApi.getModulePrefs(PREFS_KEY) : {};
    if (typeof modulePrefs !== 'object' || modulePrefs === null) { modulePrefs = {}; }
    function getPrefValue(key) {
        return modulePrefs.hasOwnProperty(key) ? modulePrefs[key] : defaultPrefs[key];
    }
    function setPrefValue(key, value, persist) {
        modulePrefs[key] = value;
        if (prefsApi && prefsApi.setModulePref) {
            prefsApi.setModulePref(PREFS_KEY, key, value, !!persist);
        }
    }

    var statusField, colorHexField, presetDropdown, colorSwatch;

    /**
     * Define a cor da fonte (foregroundColor) de um elemento de UI.
     * Usado principalmente para colorir o texto de status.
     * @param {Object} element - O elemento de UI (ex: StaticText).
     * @param {Array<Number>} color - Um array RGB normalizado (ex: [1, 0, 0] para vermelho).
     */
    function setStatusColor(element, color) {
        try {
            if (element && element.graphics) {
                element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
            }
        } catch (e) { /* Erro silencioso para evitar interrupções caso o elemento não suporte a propriedade */ }
    }

    /**
     * Atualiza o texto e a cor do painel de status.
     * Se a mensagem for de sucesso, ela reverte para o estado neutro após 3 segundos.
     * @param {String} message - A mensagem a ser exibida.
     * @param {String} type - O tipo de mensagem ('success', 'error', 'warning', 'info', 'neutral').
     */
    function updateStatus(message, type) {
        if (!statusField) return; // Não faz nada se o campo de status não foi inicializado
        var color = COLORS[type] || COLORS.neutral; // Pega a cor correspondente ou a neutra como padrão
        statusField.text = message;
        setStatusColor(statusField, color);
        // Se for uma mensagem de sucesso, agenda uma limpeza após 3 segundos
        if (type === "success") {
            app.setTimeout(function () {
                // Só limpa se a mensagem ainda for a mesma (evita apagar uma nova mensagem que chegou no meio tempo)
                if (statusField.text === message) {
                    statusField.text = "Pronto para uso...";
                    setStatusColor(statusField, COLORS.neutral);
                }
            }, 3000);
        }
    }

    // Cor inicial padrão (Vermelho GNews)
    var selectedColor = [229/255, 49/255, 49/255, 1];
    // Array de objetos com cores predefinidas para o dropdown
    var colorPresets = [
        { name: "PRIMARY COLORS", color: null, isSeparator: true },
        { name: "Red", color: [229/255, 49/255, 49/255] },
        { name: "Yellow", color: [238/255, 255/255, 140/255] },
        { name: "Dark Gray", color: [35/255, 30/255, 30/255] },
        { name: "SECONDARY COLORS", color: null, isSeparator: true },
        { name: "Black", color: [20/255, 20/255, 20/255] },
        { name: "Dark Gray 2", color: [51/255, 51/255, 51/255] },
        { name: "Medium Gray", color: [74/255, 74/255, 74/255] },
        { name: "Light Gray", color: [178/255, 178/255, 178/255] },
        { name: "White", color: [242/255, 242/255, 242/255] },
        { name: "SUPORT COLORS", color: null, isSeparator: true },
        { name: "Sec Red 1", color: [242/255, 51/255, 51/255] },
        { name: "Sec Red 2", color: [255/255, 77/255, 77/255] },
        { name: "Sec Orange 1", color: [255/255, 103/255, 77/255] },
        { name: "Sec Orange 2", color: [255/255, 143/255, 77/255] },
        { name: "Sec Yellow", color: [255/255, 196/255, 78/255] },
        { name: "Sec Pink 1", color: [255/255, 90/255, 103/255] },
        { name: "Sec Pink 2", color: [255/255, 115/255, 154/255] },
        { name: "Sec Pink 3", color: [255/255, 140/255, 205/255] },
        { name: "Sec Purple", color: [181/255, 173/255, 255/255] },
        { name: "Sec Blue", color: [128/255, 192/255, 255/255] },
        { name: "Sec Green", color: [92/255, 230/255, 161/255] }
    ];

    /**
     * Converte valores RGB (0-1) para uma string hexadecimal (ex: #E53131).
     * @param {Number} r - Componente vermelho (0 a 1).
     * @param {Number} g - Componente verde (0 a 1).
     * @param {Number} b - Componente azul (0 a 1).
     * @returns {String} A cor em formato hexadecimal.
     */
    function rgbToHex(r, g, b) {
        // Multiplica por 255 e arredonda, depois converte para hexadecimal.
        return "#" + ((1 << 24) + (Math.round(r*255) << 16) + (Math.round(g*255) << 8) + Math.round(b*255)).toString(16).slice(1).toUpperCase();
    }

    /**
     * Converte uma string hexadecimal para um array RGB normalizado (0-1).
     * @param {String} hex - A cor em formato hexadecimal (ex: #E53131).
     * @returns {Array<Number>|null} Um array com [r, g, b, a] ou null se o formato for inválido.
     */
    function hexToRgb(hex) {
        var cleanHex = hex.replace(/^#/, '');
        // Valida se o hex tem 6 caracteres válidos.
        if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return null;
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec("#" + cleanHex);
        // Converte os pares hexadecimais para inteiros e normaliza para o intervalo 0-1.
        return result ? [parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255, 1] : null;
    }

    // Define os possíveis alvos de cor que o script pode encontrar e modificar.
    // 'id' é um identificador interno, 'displayName' é o que aparece na UI.
    // 'matchName' é o nome interno que o After Effects usa para a propriedade.
    var COLOR_TARGETS = [
        { id: "solid_color", displayName: "Camada Sólida (Solid)" },
        { id: "text_fill", displayName: "Texto - Preenchimento (Fill)" },
        { id: "text_stroke", displayName: "Texto - Traçado (Stroke)" },
        { id: "shape_fill", displayName: "Shape - Preenchimento (Fill)", matchName: "ADBE Vector Graphic - Fill" },
        { id: "shape_stroke", displayName: "Shape - Traçado (Stroke)", matchName: "ADBE Vector Graphic - Stroke" },
        { id: "effect_fill", displayName: "Efeito: Preenchimento (Fill)", matchName: "ADBE Fill" }
    ];

    /**
     * Analisa um array de camadas para encontrar todos os tipos de propriedades de cor existentes.
     * @param {Array<Layer>} layers - As camadas a serem analisadas.
     * @returns {Array<Object>} Um array de objetos 'COLOR_TARGETS' encontrados.
     */
    function analyzeLayers(layers) {
        var foundTypes = {}; // Usamos um objeto para evitar duplicatas
        for (var l = 0; l < layers.length; l++) {
            var layer = layers[l];
            try {
                // Verifica Sólidos
                if (layer instanceof AVLayer && (layer.source instanceof SolidSource || layer.property("Color"))) { foundTypes["solid_color"] = COLOR_TARGETS[0]; }
                // Verifica Textos
                if (layer instanceof TextLayer) { var textDoc = layer.property("Source Text").value; if (textDoc.applyFill) { foundTypes["text_fill"] = COLOR_TARGETS[1]; } if (textDoc.applyStroke) { foundTypes["text_stroke"] = COLOR_TARGETS[2]; } }
                // Verifica Shapes (recursivamente)
                if (layer instanceof ShapeLayer) { function findRecursiveShapes(propGroup) { for (var p = 1; p <= propGroup.numProperties; p++) { var prop = propGroup.property(p); if (prop.matchName === "ADBE Vector Graphic - Fill") { foundTypes["shape_fill"] = COLOR_TARGETS[3]; } if (prop.matchName === "ADBE Vector Graphic - Stroke") { foundTypes["shape_stroke"] = COLOR_TARGETS[4]; } if (prop.matchName === "ADBE Vector Group" && prop.numProperties > 0) { findRecursiveShapes(prop.property("Contents")); } } } findRecursiveShapes(layer.property("Contents")); }
                // Verifica Efeito Fill
                var effectsGroup = layer.property("Effects"); if (effectsGroup && effectsGroup.numProperties > 0) { for (var e = 1; e <= effectsGroup.numProperties; e++) { if (effectsGroup.property(e).matchName === "ADBE Fill") { foundTypes["effect_fill"] = COLOR_TARGETS[5]; break; } } }
            } catch (e) { /* Erro silencioso para camadas ou propriedades protegidas */ }
        }
        // Converte o objeto de volta para um array
        var finalResults = []; for (var key in foundTypes) { finalResults.push(foundTypes[key]); }
        return finalResults;
    }

    /**
     * Coleta todas as camadas de um array de composições e as envia para análise.
     * @param {Array<CompItem>} comps - As composições a serem analisadas.
     * @returns {Array<Object>} O resultado da função 'analyzeLayers'.
     */
    function analyzeComps(comps) {
        var layersToAnalyze = [];
        for (var c = 0; c < comps.length; c++) { var comp = comps[c]; for (var i = 1; i <= comp.numLayers; i++) { layersToAnalyze.push(comp.layer(i)); } }
        return analyzeLayers(layersToAnalyze);
    }

    /**
     * Aplica a cor selecionada a um tipo de alvo específico em um conjunto de composições.
     * @param {Array<CompItem>} comps - As composições onde a cor será aplicada.
     * @param {String} targetID - O 'id' do alvo de cor (ex: "shape_fill").
     * @param {Array<Number>} newColor - A nova cor como um array RGB normalizado.
     * @param {Object} win - A janela da UI, para forçar atualizações visuais.
     */
    function applyColorChangeToComps(comps, targetID, newColor, win) {
        updateStatus("Aplicando cor...", "info");
        var totalChangedCount = 0;
        app.beginUndoGroup("Change Color Multi-Comp");

        var color3D = [newColor[0], newColor[1], newColor[2]]; // Propriedades de cor não usam o alfa
        var target = null;
        // Encontra o objeto de alvo completo com base no ID
        for (var t = 0; t < COLOR_TARGETS.length; t++) { if (COLOR_TARGETS[t].id === targetID) { target = COLOR_TARGETS[t]; break; } }
        if (!target) { app.endUndoGroup(); updateStatus("Alvo inválido.", "error"); return; }
        
        // Função para forçar a UI a se redesenhar, mostrando o progresso
        function forceUIUpdate() { if (win && typeof win.update === 'function') { win.update(); } }
        
        // Loop principal através das composições e camadas
        for (var c = 0; c < comps.length; c++) {
            var comp = comps[c];
            var totalLayers = comp.numLayers;
            for (var i = 1; i <= totalLayers; i++) {
                // Atualiza o status para mostrar o progresso
                updateStatus("Processando Comp " + (c + 1) + "/" + comps.length + " (" + i + "/" + totalLayers + ")", "info");
                forceUIUpdate();
                var layer = comp.layer(i);
                if (!layer.enabled) continue; // Pula camadas desabilitadas

                try {
                    // Lógica para cada tipo de alvo
                    if (targetID === "solid_color" && layer instanceof AVLayer && (layer.source instanceof SolidSource || layer.property("Color"))) {
                        if (layer.property("Color").canSetValue) { layer.property("Color").setValue(newColor); totalChangedCount++; }
                    } else if ((targetID === "text_fill" || targetID === "text_stroke") && layer instanceof TextLayer) {
                        var textProp = layer.property("Source Text"); var textDoc = textProp.value;
                        if (targetID === "text_fill") { textDoc.fillColor = color3D; }
                        if (targetID === "text_stroke") { textDoc.applyStroke = true; textDoc.strokeColor = color3D; }
                        textProp.setValue(textDoc);
                        totalChangedCount++;
                    } else if ((targetID === "shape_fill" || targetID === "shape_stroke") && layer instanceof ShapeLayer) {
                        var matchNameToFind = target.matchName;
                        // Função recursiva para encontrar preenchimentos/traçados dentro de grupos de shapes
                        function findAndApplyInShape(propGroup) {
                            for (var p = 1; p <= propGroup.numProperties; p++) {
                                var currentProp = propGroup.property(p);
                                if (currentProp.matchName === matchNameToFind) { try { currentProp.property("Color").setValue(color3D); totalChangedCount++; } catch (e) {} }
                                if (currentProp.matchName === "ADBE Vector Group" && currentProp.numProperties > 0) { findAndApplyInShape(currentProp.property("Contents")); }
                            }
                        }
                        findAndApplyInShape(layer.property("Contents"));
                    } else if (targetID === "effect_fill") {
                        var effect = layer.property("Effects") ? layer.property("Effects").property("Fill") : null;
                        if (effect && effect.matchName === "ADBE Fill") { try { effect.property("Color").setValue(color3D); totalChangedCount++; } catch (e) {} }
                    }
                } catch (e) { /* Ignora erros em camadas individuais para não parar o script */ }
            }
        }
        app.endUndoGroup();
        updateStatus("Aplicação concluída: " + totalChangedCount + " propriedades alteradas.", "success");
    }
    
    // Função a ser chamada pelo botão de ajuda para carregar a janela de ajuda específica.
    function showHelp() {
        if (typeof showColorChangeHelp === 'function') {
            showColorChangeHelp();
        } else {
            // Este alerta é um fallback, caso a biblioteca de ajuda não seja carregada.
            // Não pode ser estilizado, pois é uma chamada de sistema.
            alert("A biblioteca de ajuda (HELP lib.js) não foi encontrada.");
        }
    }

    /**
     * Verifica a versão do After Effects e remove ícones Unicode dos títulos dos painéis
     * em versões antigas (anteriores a 2025) para garantir a compatibilidade visual.
     * @param {Object} panels - Um objeto contendo as referências aos painéis da UI (ex: {analysis: analysisPanel, ...}).
     */
    function applyCompatibilityMode(panels) {
        // A variável 'appV' é carregada globalmente a partir de 'globals.js' e contém o número da versão principal.
        // Se a variável existir e for menor que 25 (versão correspondente ao AE 2025), aplica o modo de compatibilidade.
        if (typeof appV !== 'undefined' && appV < 25) {
            // Substitui o texto dos títulos dos painéis por versões sem os caracteres Unicode (emojis).
            panels.analysis.text = "1. Análise";
            panels.color.text = "2. Seleção de Cor";
            panels.action.text = "3. Ação";

            // Informa ao usuário que o modo de compatibilidade foi ativado.
            // A mensagem desaparece sozinha, pois 'updateStatus' com tipo 'info' não é permanente.
            updateStatus("Modo de compatibilidade ativado para AE " + app.version, "info");
        }
    }

    /**
     * Constrói a interface gráfica do script.
     */
    function buildUI() {
        // Cria uma janela flutuante ('palette') ou usa o painel existente se o script for dockable.
        var win = (this instanceof Panel) ? this : new Window("palette", SCRIPT_WINDOW_TITLE, undefined, { resizeable: false });
        win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = ESPACAMENTO_ELEMENTOS; win.margins = MARGENS_JANELA;
        win.preferredSize.width = LARGURA_JANELA;

        function createThemedActionButton(parent, label, tip, options) {
            options = options || {};
            var finalBtn = null;
            if (typeof themeButton === 'function') {
                var config = { labelTxt: label };
                if (tip) { config.tips = [tip]; }
                if (options.buttonColor) { config.buttonColor = options.buttonColor; }
                if (options.textColor) { config.textColor = options.textColor; }
                var themedBtn = new themeButton(parent, config);
                finalBtn = themedBtn.label;
            } else {
                finalBtn = parent.add("button", undefined, label);
                if (options.width) { finalBtn.preferredSize.width = options.width; }
                if (options.height) { finalBtn.preferredSize.height = options.height; }
            }
            if (finalBtn && tip) { finalBtn.helpTip = tip; }
            if (finalBtn && options.alignment) { finalBtn.alignment = options.alignment; }
            return finalBtn;
        }

        // Aplica a cor de fundo global, se a função e a variável existirem
        if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
            setBgColor(win, bgColor1);
        }

        // --- CABEÇALHO ---
        // Grupo em 'stack' para sobrepor o título (esquerda) e o botão de ajuda (direita)
        var headerGrp = win.add('group'); headerGrp.orientation = 'stack'; headerGrp.alignment = 'fill';
        
        // Grupo para o subtítulo (alinhado à esquerda)
        var titleGrp = headerGrp.add('group');
        titleGrp.alignment = 'left';
        var subtitle = titleGrp.add('statictext', undefined, SCRIPT_SUBTITLE);
        subtitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
        if (typeof setFgColor === 'function' && typeof highlightColor1 !== 'undefined') { setFgColor(subtitle, highlightColor1); }
        
        // Grupo para o botão de ajuda (alinhado à direita)
        var helpGrp = headerGrp.add('group'); helpGrp.alignment = 'right';
        // Tenta usar o botão de ícone temático da biblioteca main_ui_functions.js
        if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined') { 
            var helpBtn = new themeIconButton(helpGrp, { icon: D9T_INFO_ICON, tips: ['Ajuda sobre o script'] }); 
            helpBtn.leftClick.onClick = showHelp;
        } else { // Se não encontrar, cria um botão de texto simples como alternativa
            var helpBtnFallback = helpGrp.add('button', undefined, '?'); 
            helpBtnFallback.preferredSize = [TAMANHO_BOTAO_AJUDA, TAMANHO_BOTAO_AJUDA]; 
            helpBtnFallback.onClick = showHelp; 
        }

        // --- PAINEL DE ANÁLISE ---
        var analysisPanel = win.add("panel", undefined, "\uD83D\uDD0E 1. Análise"); analysisPanel.orientation = "column"; analysisPanel.alignChildren = ["fill", "top"]; analysisPanel.spacing = 10; analysisPanel.margins = 15;
        if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(analysisPanel, monoColor1); }
        var analyzeBtn = createThemedActionButton(analysisPanel, "Analisar Composição(ões)", "Analisa as composições selecionadas no painel de Projeto");

        // --- PAINEL DE COR ---
        var colorPanel = win.add("panel", undefined, "\uD83C\uDFA8 2. Seleção de Cor"); colorPanel.orientation = "column"; colorPanel.alignChildren = ["fill", "center"]; colorPanel.spacing = 10; colorPanel.margins = 15;
        if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(colorPanel, monoColor1); }

        // Grupo para a amostra de cor (swatch)
        var swatchHolder = colorPanel.add("group"); swatchHolder.orientation = "stack"; swatchHolder.alignment = "fill";
        colorSwatch = swatchHolder.add("group"); colorSwatch.minimumSize = [80, 40]; colorSwatch.alignment = ["fill", "center"]; colorSwatch.helpTip = "Clique para abrir o seletor de cores";
        var swatchLabel = swatchHolder.add("statictext", undefined, "Preview"); swatchLabel.alignment = "center"; if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(swatchLabel, monoColor1); }

        // Grupo para os inputs de cor (Hex e Presets)
        var inputGroup = colorPanel.add("group"); inputGroup.spacing = 10; inputGroup.alignChildren = ["center", "center"];
        var hexGroup = inputGroup.add("group");
        var hexLabel = hexGroup.add("statictext", undefined, "Hex:"); if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(hexLabel, monoColor1); }
        colorHexField = hexGroup.add("edittext", undefined, ""); colorHexField.preferredSize = [60, 25]; colorHexField.helpTip = "Digite um código hexadecimal (ex.: #RRGGBB)";
        
        var presetGroup = inputGroup.add("group");
        var presetLabel = presetGroup.add("statictext", undefined, "Presets:"); if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(presetLabel, monoColor1); }
        presetDropdown = presetGroup.add("dropdownlist"); presetDropdown.preferredSize = [100, 25]; presetDropdown.add("item", "Custom"); presetDropdown.helpTip = "Selecione uma cor predefinida";
        // Popula o dropdown com os presets, marcando os separadores
        for (var i = 0; i < colorPresets.length; i++) { var item = presetDropdown.add("item", colorPresets[i].name); item.isSeparator = colorPresets[i].isSeparator; }

        // --- PAINEL DE AÇÃO ---
        var actionPanel = win.add("panel", undefined, "\u2728 3. Ação"); actionPanel.orientation = "column"; actionPanel.alignChildren = ["fill", "top"]; actionPanel.spacing = 10; actionPanel.margins = 15;
        if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(actionPanel, monoColor1); }
        
        var targetDropdown = actionPanel.add("dropdownlist", undefined, ["Nenhum alvo"]); targetDropdown.enabled = false; targetDropdown.preferredSize.width = 200; targetDropdown.helpTip = "Selecione o tipo de alvo para aplicar a cor";
        var applyBtn = createThemedActionButton(actionPanel, "Aplicar Cor", "Aplica a cor selecionada");
        if (typeof themeButton !== 'function' && applyBtn) { applyBtn.preferredSize.height = ALTURA_BOTAO_APLICAR; }
        applyBtn.enabled = false;

        // --- PAINEL DE STATUS ---
        var statusPanel = win.add("panel", undefined, "Status"); statusPanel.alignment = "fill"; statusPanel.margins = 10; statusPanel.preferredSize.height = ALTURA_PAINEL_STATUS;
        if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') { setFgColor(statusPanel, monoColor1); }
        statusField = statusPanel.add("statictext", undefined, "", {multiline: false}); statusField.alignment = ['fill', 'center']; statusField.justify = 'left';
        
        /**
         * Sincroniza todos os elementos da UI de cor (swatch, hex, dropdown) para refletir a nova cor.
         * @param {Array<Number>} newRgbArray_0_1 - A nova cor em RGB normalizado.
         * @param {String} source - De onde a mudança se originou ('hex', 'swatch', 'dropdown') para evitar loops infinitos.
         */
        function updateAllColorUI(newRgbArray_0_1, source) {
            selectedColor = [newRgbArray_0_1[0], newRgbArray_0_1[1], newRgbArray_0_1[2], 1];
            // Atualiza o campo de texto hexadecimal, exceto se a mudança veio dele mesmo
            if (source !== 'hex') { colorHexField.text = rgbToHex(selectedColor[0], selectedColor[1], selectedColor[2]); }
            // Atualiza a cor de fundo da amostra (swatch)
            if (colorSwatch.graphics) { 
                var newBrush = colorSwatch.graphics.newBrush(colorSwatch.graphics.BrushType.SOLID_COLOR, selectedColor);
                colorSwatch.graphics.backgroundColor = newBrush;
                if (typeof colorSwatch.notify === 'function') {
                    colorSwatch.notify("onDraw");
                } else if (typeof colorSwatch.onDraw === 'function') {
                    try { colorSwatch.onDraw(); } catch (drawErr) {}
                }
            }
            // Atualiza a seleção do dropdown
            if (source === 'hex' || source === 'swatch') { 
                presetDropdown.selection = 0; // Se a cor for customizada, seleciona "Custom"
            } else if (source !== 'dropdown') { 
                var found = false;
                // Procura se a cor corresponde a algum preset
                for (var i = 0; i < colorPresets.length; i++) { 
                    var pColor = colorPresets[i].color; 
                    if (pColor && Math.abs(pColor[0] - selectedColor[0]) < 0.01 && Math.abs(pColor[1] - selectedColor[1]) < 0.01 && Math.abs(pColor[2] - selectedColor[2]) < 0.01) { 
                        presetDropdown.selection = i + 1; found = true; break; 
                    } 
                } 
                if (!found) { presetDropdown.selection = 0; } 
            }
        }

        function persistColorSelection() {
            if (!prefsApi) { return; }
            var hexValue = colorHexField && colorHexField.text ? colorHexField.text : rgbToHex(selectedColor[0], selectedColor[1], selectedColor[2]);
            if (hexValue && hexValue.charAt(0) !== '#') { hexValue = "#" + hexValue; }
            setPrefValue("lastColorHex", hexValue, true);
            var presetName = "Custom";
            if (presetDropdown && presetDropdown.selection && !presetDropdown.selection.isSeparator && presetDropdown.selection.index > 0) {
                presetName = presetDropdown.selection.text;
            }
            setPrefValue("lastPreset", presetName, true);
        }

        // --- DEFINIÇÃO DOS EVENTOS DA UI ---

        // Evento de clique na amostra de cor (swatch)
        colorSwatch.onClick = function() {
            // Converte a cor atual para o formato esperado pelo color picker
            var currentColorHex = (Math.round(selectedColor[0]*255) << 16) | (Math.round(selectedColor[1]*255) << 8) | Math.round(selectedColor[2]*255);
            // Abre o seletor de cores nativo
            var newColorHex = $.colorPicker(currentColorHex);
            // Se o usuário escolheu uma cor (não cancelou)
            if (newColorHex >= 0) { 
                var r = ((newColorHex >> 16) & 0xFF) / 255; 
                var g = ((newColorHex >> 8) & 0xFF) / 255; 
                var b = (newColorHex & 0xFF) / 255; 
                updateAllColorUI([r, g, b], 'swatch'); 
                updateStatus("Cor selecionada via seletor.", "info"); 
                persistColorSelection();
            }
        };

        // Evento de mudança no dropdown de presets
        presetDropdown.onChange = function() {
            var selection = this.selection; 
            // Impede a seleção de um separador
            if (!selection || selection.isSeparator) { this.selection = this.lastSelection || 2; return; } 
            if (selection.index === 0) { this.lastSelection = selection; persistColorSelection(); return; } // Ignora se "Custom" for selecionado
            var preset = colorPresets[selection.index - 1]; 
            if(preset && preset.color){ updateAllColorUI(preset.color, 'dropdown'); this.lastSelection = selection; updateStatus("Preset '" + preset.name + "' selecionado.", "info"); persistColorSelection(); }
        };

        // Evento de mudança ou Enter no campo de texto hexadecimal
        colorHexField.onChange = colorHexField.onEnterKey = function() {
            var cleanHex = this.text.replace(/^#/, ''); 
            // Valida o formato do código
            if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) { 
                this.text = rgbToHex(selectedColor[0], selectedColor[1], selectedColor[2]); // Reverte para o valor anterior
                updateStatus("Hex inválido. Cor revertida.", "warning"); return; 
            } 
            var newRGB = hexToRgb(this.text); 
            if (newRGB) { updateAllColorUI(newRGB, 'hex'); updateStatus("Cor atualizada via código Hex.", "info"); persistColorSelection(); }
        };

        applyInitialColorFromPrefs();

        function applyInitialColorFromPrefs() {
            var storedPreset = getPrefValue("lastPreset");
            var storedHex = getPrefValue("lastColorHex");
            var applied = false;
            if (storedPreset && storedPreset !== "Custom") {
                for (var i = 0; i < colorPresets.length; i++) {
                    if (colorPresets[i].isSeparator) { continue; }
                    if (colorPresets[i].name === storedPreset) {
                        presetDropdown.selection = i + 1;
                        updateAllColorUI(colorPresets[i].color, 'dropdown');
                        applied = true;
                        break;
                    }
                }
            }
            if (!applied && typeof storedHex === 'string') {
                var rgb = hexToRgb(storedHex);
                if (rgb) {
                    presetDropdown.selection = 0;
                    updateAllColorUI(rgb, 'hex');
                    applied = true;
                }
            }
            if (!applied) {
                presetDropdown.selection = 0;
                updateAllColorUI(selectedColor, 'hex');
            }
        }

        // Evento de clique no botão de Análise
        analyzeBtn.onClick = function() {
            var results = []; var layersToAnalyze = []; var compsToProcess = [];
            var activeComp = app.project.activeItem;
            // Define o escopo da análise: camadas selecionadas, comp ativa, comps selecionadas no projeto ou todas as comps.
            if (activeComp && activeComp instanceof CompItem && activeComp.selectedLayers.length > 0) { 
                updateStatus("Analisando " + activeComp.selectedLayers.length + " camada(s) selecionada(s)...", "info"); layersToAnalyze = activeComp.selectedLayers; results = analyzeLayers(layersToAnalyze); 
            } else if (activeComp && activeComp instanceof CompItem) { 
                updateStatus("Analisando composição ativa: '" + activeComp.name + "'...", "info"); compsToProcess = [activeComp]; results = analyzeComps(compsToProcess); 
            } else { 
                var selectedItems = app.project.selection; 
                for (var i = 0; i < selectedItems.length; i++) { if (selectedItems[i] instanceof CompItem) { compsToProcess.push(selectedItems[i]); } } 
                if (compsToProcess.length > 0) { 
                    updateStatus("Analisando " + compsToProcess.length + " composição(ões) selecionada(s)...", "info"); results = analyzeComps(compsToProcess); 
                } else { 
                    updateStatus("Nenhuma comp selecionada. Analisando todas as comps do projeto...", "info"); 
                    for (var j = 1; j <= app.project.numItems; j++) { if (app.project.item(j) instanceof CompItem) { compsToProcess.push(app.project.item(j)); } } 
                    if (compsToProcess.length > 0) { results = analyzeComps(compsToProcess); } else { updateStatus("Nenhuma composição encontrada no projeto.", "warning"); } 
                } 
            }
            // Limpa e popula o dropdown de alvos com os resultados
            targetDropdown.removeAll();
            if (results && results.length > 0) { 
                for (var k = 0; k < results.length; k++) { var item = targetDropdown.add("item", results[k].displayName); item.targetId = results[k].id; } 
                targetDropdown.selection = 0; targetDropdown.enabled = true; applyBtn.enabled = true; 
                updateStatus("Análise concluída: " + results.length + " tipo(s) de alvo encontrado(s).", "success"); 
            } else { 
                targetDropdown.add("item", "Nenhum alvo encontrado"); targetDropdown.selection = 0; targetDropdown.enabled = false; applyBtn.enabled = false; 
                updateStatus("Nenhum alvo de cor encontrado no escopo analisado.", "warning"); 
            }
        };
        
        // Evento de clique no botão Aplicar
        applyBtn.onClick = function() {
            var selectedItems = app.project.selection;
            var compsToProcess = [];
        
            // Primeiro, tenta preencher a lista com as composições selecionadas no painel de Projeto.
            for (var i = 0; i < selectedItems.length; i++) {
                if (selectedItems[i] instanceof CompItem) {
                    compsToProcess.push(selectedItems[i]);
                }
            }
        
            // Se nenhuma composição foi selecionada no painel de Projeto, usa a composição ativa como fallback.
            if (compsToProcess.length === 0) {
                var activeComp = app.project.activeItem;
                if (activeComp && activeComp instanceof CompItem) {
                    compsToProcess.push(activeComp);
                }
            }
        
            // Se, depois de ambas as verificações, ainda não houver composições, exibe um aviso e encerra.
            if (compsToProcess.length === 0) {
                updateStatus("Selecione uma comp no projeto ou ative uma na timeline.", "warning");
                return;
            }
        
            // Se houver um alvo selecionado no dropdown, aplica a cor.
            if (targetDropdown.selection && targetDropdown.selection.targetId) {
                applyColorChangeToComps(compsToProcess, targetDropdown.selection.targetId, selectedColor, win);
            }
        };

        // Atalhos de teclado
        win.addEventListener("keydown", function(event) { 
            if (event.keyName === "Enter" && !event.ctrlKey) { // Enter aciona "Aplicar"
                if (applyBtn.enabled) { applyBtn.onClick(); } 
            } else if (event.keyName === "Enter" && event.ctrlKey) { // Ctrl+Enter aciona "Analisar"
                analyzeBtn.onClick(); 
            } 
        });
        
        // Função executada quando a janela é exibida pela primeira vez
        win.onShow = function() { 
            presetDropdown.selection = 2; // Seleciona o primeiro preset de cor (Red)
            updateStatus("Pronto para uso...", "neutral"); 
        };
        
        // Chama a função de compatibilidade para ajustar a UI se necessário
        applyCompatibilityMode({
            analysis: analysisPanel,
            color: colorPanel,
            action: actionPanel
        });

        // Se a UI for uma janela flutuante, centraliza e a exibe.
        if (win instanceof Window) { win.center(); win.show(); }
    }

    // Inicia a construção da UI
    buildUI();
}

