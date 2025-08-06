/**
 * CropComp.jsx
 *
 * Título: CropComp
 * Descrição: Pré-composição, Criação e Redimensionamento de Comps Inteligentes.
 * Autor: Seu Nome/Empresa (Adaptado por IA Gemini)
 * Versão: 5.4 (Final Polished - UI refinada e estável)
 * Compatibilidade: Adobe After Effects 2023, 2024, 2025
 *
 */

(function (thisObj) {
    // Garante que o objeto principal exista no escopo global deste script
    if (typeof this.CropComp === 'undefined') {
        this.CropComp = {};
    }
    var CropComp = this.CropComp;

    CropComp.NAME = "CropComp";
    CropComp.VERSION = "5.4 (Final)";
    
    CropComp.ui = {};
    CropComp.autoUpdateTask = null;

    CropComp.PRESETS = {
        "Personalizado":      null,
        "4K (3840x2160)":      { w: 3840, h: 2160, fps: 29.97, dur: 10 },
        "2K (2048x1080)":      { w: 2048, h: 1080, fps: 29.97, dur: 10 },
        "FullHD (1920x1080)":  { w: 1920, h: 1080, fps: 29.97, dur: 10 },
        "Web Story (1080x1920)": { w: 1080, h: 1920, fps: 30,    dur: 10 }
    };

    // ===================================================================================
    // FUNÇÃO DE AJUDA
    // ===================================================================================
    CropComp.showHelp = function() {
        var TARGET_HELP_WIDTH = 400; // Largura desejada para a janela de ajuda
        var MARGIN_SIZE = 15; // Margens internas da janela principal
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5]; // Margens para cada seção de tópico dentro da aba
        var TOPIC_SPACING = 5; // Espaçamento entre o título do tópico e o texto explicativo
        var TOPIC_TITLE_INDENT = 0; // Recuo para os títulos dos tópicos
        var SUBTOPIC_INDENT = 25; // Recuo para os subtópicos

        var helpWin = new Window("palette", "Ajuda - CropComp", undefined, { closeButton: true });
        helpWin.orientation = "column";
        helpWin.alignChildren = ["fill", "fill"];
        helpWin.spacing = 10;
        helpWin.margins = MARGIN_SIZE;
        
        helpWin.preferredSize = [TARGET_HELP_WIDTH, 500]; // Altura preferencial, ajuste se o conteúdo for muito grande

        // Define o fundo da janela como preto ou uma cor padrão se a função não estiver disponível
        if (typeof bgColor1 !== 'undefined' && typeof setBgColor !== 'undefined') {
            setBgColor(helpWin, bgColor1);
        } else {
            helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
        }

        // Painel para Título e Descrição Principal
        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column";
        headerPanel.alignChildren = ["fill", "top"];
        headerPanel.alignment = ["fill", "top"];
        headerPanel.spacing = 10;
        headerPanel.margins = 15;
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - CROPCOMP");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            // Cor padrão se as funções/variáveis de tema não estiverem definidas
            titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Ferramenta para pré-composição, criação e redimensionamento inteligente de composições.", {multiline: true});
        mainDescText.alignment = ["center", "center"];
        mainDescText.preferredSize.height = 40;
        // Ajusta a largura do texto principal
        mainDescText.preferredSize.width = TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (headerPanel.margins.left + headerPanel.margins.right);
        if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') { // Corrigido '1' para 'undefined'
            setFgColor(mainDescText, normalColor1);
        } else {
            // Cor padrão se as funções/variáveis de tema não estiverem definidas
            mainDescText.graphics.foregroundColor = mainDescText.graphics.newPen(mainDescText.graphics.PenType.SOLID_COLOR, [0.8, 0.8, 0.8, 1], 1);
        }

        // TabbedPanel para Tópicos
        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"];
        topicsTabPanel.margins = 15;

        var allHelpTopics = [
            {
                tabName: "Crop Inteligente",
                topics: [
                    { title: "▶ FUNCIONALIDADE", text: "Pré-compõe as camadas selecionadas com base nos limites visíveis dos pixels, adicionando um padding opcional. Ideal para otimizar comps com conteúdo solto." },
                    { title: "▶ NOME DO CROP", text: "Define o nome da nova pré-composição." },
                    { title: "▶ PADDING (PX)", text: "Adiciona um espaçamento em pixels ao redor dos limites detectados." },
                    { title: "▶ REVELAR NO PROJETO", text: "Seleciona a nova pré-comp no painel Projeto após a criação." },
                    { title: "▶ USO", text: "Selecione as camadas na Timeline e clique 'Executar Crop Inteligente'." }
                ]
            },
            {
                tabName: "Transformar Footage",
                topics: [
                    { title: "▶ FUNCIONALIDADE", text: "Cria uma nova composição com base nas configurações de largura, altura, FPS e duração, e importa o(s) item(ns) de footage selecionado(s) no painel Projeto para essa comp." },
                    { title: "▶ PRESETS", text: "Define rapidamente as dimensões e taxas de quadro para formatos comuns (4K, FullHD, Web Story, etc.)." },
                    { title: "▶ AUTO-ESCALA INTELIGENTE", text: "Redimensiona automaticamente o footage importado para caber na nova comp, mantendo a proporção." },
                    { title: "▶ USO", text: "Selecione um ou mais footages no painel Projeto e clique 'Transformar Footage em Comp'." }
                ]
            },
            {
                tabName: "Redimensionar",
                topics: [
                    { title: "▶ FUNCIONALIDADE", text: "Redimensiona composições existentes para novas dimensões, podendo escalar o conteúdo para ajustar." },
                    { title: "▶ NOVAS PROPRIEDADES", text: "Defina a nova largura e altura, e opcionalmente o novo FPS e duração da composição." },
                    { title: "▶ REDIMENSIONAR CONTEÚDO", text: "Escala as camadas dentro da comp para se ajustarem às novas dimensões da comp. Câmeras e luzes são ignoradas." },
                    { title: "▶ USO", text: "Selecione uma comp na Timeline (para a ativa) ou no painel Projeto (para múltiplas comps) e clique 'Redimensionar Comp(s)'." }
                ]
            }
        ];

        for (var s = 0; s < allHelpTopics.length; s++) {
            var currentTabSection = allHelpTopics[s];
            var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
            tab.orientation = "column";
            tab.alignChildren = ["fill", "top"];
            tab.spacing = 10; // Espaçamento entre os grupos de tópicos
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
                if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                    setFgColor(topicTitle, highlightColor1);
                } else {
                    // Cor padrão se as funções/variáveis de tema não estiverem definidas
                    topicTitle.graphics.foregroundColor = topicTitle.graphics.newPen(topicTitle.graphics.PenType.SOLID_COLOR, [0.83, 0, 0.23, 1], 1);
                }
                var topicContentWidth = TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left;
                topicTitle.preferredSize.width = topicContentWidth;


                if(topic.text !== ""){
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    topicText.preferredSize.width = topicContentWidth;
                    // topicText.preferredSize.height = 36; // Comentado para permitir altura automática ou ajustar conforme o conteúdo
                    
                    if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                        setFgColor(topicText, normalColor1);
                    } else {
                        // Cor padrão se as funções/variáveis de tema não estiverem definidas
                        topicText.graphics.foregroundColor = topicText.graphics.newPen(topicText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
                    }
                }
            }
        }

        // Botão de fechar
        var closeBtnGrp = helpWin.add("group");
        closeBtnGrp.alignment = "center";
        closeBtnGrp.margins = [0, 10, 0, 0];
        var closeBtn = closeBtnGrp.add("button", undefined, "Fechar");
        closeBtn.onClick = function() {
            // Fechar a janela. Nenhuma operação deve ocorrer em helpWin após esta linha
            helpWin.close();
        };

        helpWin.layout.layout(true);
        helpWin.center();
        helpWin.show();
    };


        // ===================================================================================
        // CONTRUCÃO DE A INTERFACE DO USUÁRIO
        // ===================================================================================


    CropComp.buildUI = function (thisObj) {
        var self = this;
        this.ui.pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", this.NAME + " v" + this.VERSION, undefined, { resizeable: false });
        var pal = this.ui.pal;
        pal.orientation = 'column';
        pal.alignment = ['fill', 'top'];
        pal.margins = 8;
        pal.spacing = 6;

        // Tenta garantir que o objeto graphics esteja pronto antes de usá-lo
        if (pal.graphics) {
            pal.graphics.backgroundColor = pal.graphics.newBrush(
                pal.graphics.BrushType.SOLID_COLOR,
                [0, 0, 0] // RGB para preto
            );
        } else {
            self.log("ERRO: pal.graphics não disponível na construção da UI.");
        }
        
        // --- GRUPO DE CABEÇALHO (Título e Botão de Ajuda) ---
        var headerGroup = pal.add("group");
        headerGroup.orientation = "row";
        headerGroup.alignChildren = ["fill", "center"];
        headerGroup.alignment = "fill";
        headerGroup.spacing = 10;
        headerGroup.margins = [0, 0, 0, 10]; // Margem inferior para separar do próximo painel

        var titleText = headerGroup.add("statictext", undefined, this.NAME + " v" + this.VERSION);
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
        titleText.preferredSize.width = 0; // Faz com que o texto ocupe o espaço restante

        // Adiciona o botão de ajuda
        // Se as funções/variáveis de tema não estiverem definidas, usa um botão simples.
        if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
            var helpBtnGroup = headerGroup.add('group'); // Adiciona um grupo para o botão de ajuda DENTRO do headerGroup
            helpBtnGroup.alignment = ['right', 'center'];
            var helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
            helpBtn.leftClick.onClick = function() { self.showHelp(); }; // Chama a função de ajuda do CropComp
        } else {
            var helpBtn = headerGroup.add("button", undefined, "?"); // Adiciona o BOTÃO DENTRO do headerGroup
            helpBtn.preferredSize = [24, 24];
            helpBtn.helpTip = "Ajuda sobre " + this.NAME;
            helpBtn.alignment = ['right', 'center'];
            helpBtn.onClick = function() { self.showHelp(); }; // Chama a função de ajuda do CropComp
        }
        // --- Fim do Grupo de Cabeçalho ---


        this.ui.tabPanel = pal.add('tabbedpanel');
        this.ui.tabPanel.alignment = 'fill';
        this.ui.tabPanel.margins = 0;


        
        // ===================================================================================
        // ABA 1: CROP INTELIGENTE
        // ===================================================================================
        this.ui.precompTab = this.ui.tabPanel.add('tab', undefined, 'Crop Inteligente');
        var precompTab = this.ui.precompTab;
        precompTab.alignChildren = ['fill', 'top'];
        precompTab.margins = 10;
        
        var precompControls = precompTab.add('panel');
        precompControls.text = "Configurações do Crop";
        precompControls.alignChildren = ['fill', 'top'];
        precompControls.spacing = 8;
        precompControls.margins = 15;
        this.ui.precompName = precompControls.add("group { o: 'row', s: StaticText { text: 'Nome:', preferredSize:[80, -1] }, e: EditText { text: 'Crop_Inteligente', alignment:['fill','center'] } }").e;
        this.ui.precompPadding = precompControls.add("group { o: 'row', s: StaticText { text: 'Padding (px):', preferredSize:[80, -1] }, e: EditText { text: '10', characters: 6 } }").e;
        this.ui.precompReveal = precompControls.add("checkbox { text: 'Revelar no Projeto', value: true, alignment:['fill','center'] }");
        this.ui.precompBtn = precompControls.add("button { text: 'Executar Crop Inteligente', alignment:['fill','center'] }");

        // ===================================================================================
        // ABA 2: TRANSFORMAR FOOTAGE
        // ===================================================================================
        this.ui.createTab = this.ui.tabPanel.add('tab', undefined, 'Transformar Footage');
        var createTab = this.ui.createTab;
        createTab.alignChildren = ['fill', 'top'];
        createTab.margins = 10;
        
        var createControls = createTab.add('panel');
        createControls.text = "Propriedades da Nova Composição";
        createControls.alignChildren = ['fill', 'top'];
        createControls.spacing = 8;
        createControls.margins = 15;
        this.ui.createPreset = createControls.add("group { o: 'row', s: StaticText { text: 'Presets:', preferredSize:[80, -1] }, d: DropDownList { alignment:['fill','center'] } }").d;
        
        var createDimsGroup = createControls.add("group { orientation: 'row' }");
        this.ui.createWidth = createDimsGroup.add("group { o:'row', s: StaticText { text: 'Largura:' }, e: EditText { text: '1920', characters:6 } }").e;
        this.ui.createHeight = createDimsGroup.add("group { o:'row', s: StaticText { text: '  Altura:' }, e: EditText { text: '1080', characters:6 } }").e;
        
        var createTimeGroup = createControls.add("group { orientation: 'row' }");
        this.ui.createFps = createTimeGroup.add("group { o:'row', s: StaticText { text: 'FPS:' }, e: EditText { text: '29.97', characters:6 } }").e;
        this.ui.createDuration = createTimeGroup.add("group { o:'row', s: StaticText { text: '  Duração:' }, e: EditText { text: '10', characters:6 } }").e;

        this.ui.createAutoScale = createControls.add("checkbox { text: 'Auto-escala Inteligente', value: true, alignment:['fill','center'] }");
        this.ui.createBtn = createControls.add("button { text: 'Transformar Footage em Comp', alignment:['fill','center'] }");

        // ===================================================================================
        // ABA 3: REDIMENSIONAR
        // ===================================================================================
        this.ui.resizeTab = this.ui.tabPanel.add('tab', undefined, 'Redimensionar');
        var resizeTab = this.ui.resizeTab;
        resizeTab.alignChildren = ['fill', 'top'];
        resizeTab.margins = 10;

        var resizeControls = resizeTab.add('panel');
        resizeControls.text = "Novas Propriedades da Composição";
        resizeControls.alignChildren = ['fill', 'top'];
        resizeControls.spacing = 8;
        resizeControls.margins = 15;
        this.ui.resizePreset = resizeControls.add("group { o:'row', s: StaticText { text: 'Presets:', preferredSize:[80, -1] }, d: DropDownList { alignment:['fill','center'] } }").d;

        var resizeDimsGroup = resizeControls.add("group { o:'row' }");
        this.ui.resizeWidth = resizeDimsGroup.add("group { o:'row', s: StaticText { text: 'Nova Largura:' }, e: EditText { text: '1080', characters:6 } }").e;
        this.ui.resizeHeight = resizeDimsGroup.add("group { o:'row', s: StaticText { text: '  Nova Altura:' }, e: EditText { text: '1920', characters:6 } }").e;
        
        this.ui.resizeScaleContent = resizeControls.add("checkbox { text: 'Redimensionar conteúdo para ajustar', value: true, alignment:['fill','center'] }");
        
        var resizeFpsGroup = resizeControls.add("group { o:'row' }");
        this.ui.resizeChangeFpsCheck = resizeFpsGroup.add("checkbox { text: 'Alterar FPS para:' }");
        this.ui.resizeFps = resizeFpsGroup.add("edittext { text: '29.97', characters: 6, enabled: false }");
        
        var resizeDurGroup = resizeControls.add("group { o:'row' }");
        this.ui.resizeChangeDurationCheck = resizeDurGroup.add("checkbox { text: 'Alterar Duração para:' }");
        this.ui.resizeDuration = resizeDurGroup.add("edittext { text: '10', characters: 6, enabled: false }");
        
        this.ui.resizeBtn = resizeControls.add("button { text: 'Redimensionar Comp(s)', alignment:['fill','center'] }");

        // ===================================================================================
        // GRUPO DE STATUS (INTEGRADO)
        // ===================================================================================
        var statusGroup = pal.add("group");
        statusGroup.alignment = 'fill';
        statusGroup.margins = [0, 6, 0, 0];
        statusGroup.add("statictext", undefined, "Status:");
        this.ui.logText = statusGroup.add("statictext", undefined, "Painel iniciado.", {multiline: true});
        this.ui.logText.alignment = ['fill', 'center'];

        // --- LÓGICA DE EVENTOS ---
        this.ui.precompBtn.onClick = function() { self.runLayerMode(); };
        this.ui.createBtn.onClick = function() { self.runProjectMode(); };
        this.ui.resizeBtn.onClick = function() { self.runResizeCompsMode(); };
        
        this.populatePresets(this.ui.createPreset);
        this.populatePresets(this.ui.resizePreset);
        this.ui.createPreset.onChange = function() { self.applyPreset("create", this.selection.text); };
        this.ui.resizePreset.onChange = function() { self.applyPreset("resize", this.selection.text); };

        var createInputs = [this.ui.createWidth, this.ui.createHeight, this.ui.createFps, this.ui.createDuration];
        for(var i=0; i<createInputs.length; i++) { createInputs[i].onChanging = function() { if(self.ui.createPreset.selection.index != 0) self.ui.createPreset.selection = 0; }; }
        var resizeInputs = [this.ui.resizeWidth, this.ui.resizeHeight, this.ui.resizeFps, this.ui.resizeDuration];
        for(var i=0; i<resizeInputs.length; i++) { resizeInputs[i].onChanging = function() { if(self.ui.resizePreset.selection.index != 0) self.ui.resizePreset.selection = 0; }; }
        
        this.ui.resizeChangeFpsCheck.onClick = function() { self.ui.resizeFps.enabled = this.value; };
        this.ui.resizeChangeDurationCheck.onClick = function() { self.ui.resizeDuration.enabled = this.value; };

        pal.onResizing = pal.onResize = function () { this.layout.resize(); };
        pal.onActivate = function() { self.updateUI(); };
        this.ui.tabPanel.onChange = function() { self.updateUI(); };
        
        this.updateUI();
        if (pal instanceof Window) { pal.center(); pal.show(); }
    };
    
    // --- FUNÇÕES PRINCIPAIS ---
    CropComp.log = function(message) { if (this.ui.logText) this.ui.logText.text = message; };
    CropComp.populatePresets = function(dropdown) { for (var p in this.PRESETS) { dropdown.add('item', p); } dropdown.selection = 0; };
    CropComp.applyPreset = function(mode, presetName) { var preset = this.PRESETS[presetName]; if (!preset) return; var widthInput = (mode === "create") ? this.ui.createWidth : this.ui.resizeWidth; var heightInput = (mode === "create") ? this.ui.createHeight : this.ui.resizeHeight; var fpsInput = (mode === "create") ? this.ui.createFps : this.ui.resizeFps; var durationInput = (mode === "create") ? this.ui.createDuration : this.ui.resizeDuration; widthInput.text = preset.w; heightInput.text = preset.h; fpsInput.text = preset.fps; if(durationInput) durationInput.text = preset.dur; this.log("Preset '" + presetName + "' aplicado."); };
    CropComp.updateUI = function () { this.ui.tabPanel.enabled = true; var activeComp = app.project.activeItem; if (activeComp && activeComp instanceof CompItem && activeComp.selectedLayers.length > 0) { if (this.ui.tabPanel.selection !== this.ui.precompTab) { this.log("Modo 'Crop Inteligente' ativado para " + activeComp.selectedLayers.length + " layer(s)."); this.ui.tabPanel.selection = this.ui.precompTab; } return; } if (activeComp && activeComp instanceof CompItem) { if (this.ui.tabPanel.selection !== this.ui.resizeTab) { this.log("Modo 'Redimensionar' ativado para a comp atual: " + activeComp.name); this.ui.tabPanel.selection = this.ui.resizeTab; } return; } var selectedProjectItems = app.project.selection; if (selectedProjectItems.length > 0) { var allAreComps = true; var allAreFootage = true; for (var i = 0; i < selectedProjectItems.length; i++) { if (!(selectedProjectItems[i] instanceof CompItem)) allAreComps = false; if (!(selectedProjectItems[i] instanceof FootageItem)) allAreFootage = false; } if (allAreComps) { if (this.ui.tabPanel.selection !== this.ui.resizeTab) { this.log("Modo 'Redimensionar' ativado para " + selectedProjectItems.length + " comp(s) do projeto."); this.ui.tabPanel.selection = this.ui.resizeTab; } } else if (allAreFootage) { if (this.ui.tabPanel.selection !== this.ui.createTab) { this.log("Modo 'Transformar Footage' ativado para " + selectedProjectItems.length + " item(ns)."); this.ui.tabPanel.selection = this.ui.createTab; } } return; } this.log("Aguardando seleção..."); this.ui.tabPanel.enabled = false; };

    CropComp.runLayerMode = function () { var progressWin = new Window("palette", "Processando...", undefined, { borderless: true }); try { this.log("Iniciando Crop Inteligente..."); progressWin.add("statictext", undefined, "Calculando limites por expressão..."); progressWin.center(); progressWin.show(); app.beginUndoGroup("CropComp: Crop Inteligente"); var comp = app.project.activeItem; var layers = comp.selectedLayers; var name = this.ui.precompName.text; var padding = parseFloat(this.ui.precompPadding.text); var shouldReveal = this.ui.precompReveal.value; this.log("Calculando limites... (Pode demorar)"); progressWin.update(); var bounds = this.getBoundsByExpression(comp, layers); if (bounds.left === Infinity) throw new Error("Não foram encontrados pixels visíveis."); var compW = Math.round(bounds.right - bounds.left); var compH = Math.round(bounds.bottom - bounds.top); this.log("Limites encontrados: " + compW + "x" + compH + "px."); var finalW = compW + padding * 2; var finalH = compH + padding * 2; if (finalW <= 1 || finalH <= 1) throw new Error("Dimensões calculadas inválidas."); this.log("Criando nova pré-composição..."); var newComp = app.project.items.addComp(name, finalW, finalH, comp.pixelAspect, comp.duration, comp.frameRate); var layerMap = []; for (var i = 0; i < layers.length; i++) { layerMap.push({ newLayer: layers[i].copyToComp(newComp), oldIndex: layers[i].index }); } layerMap.sort(function(a,b) { return a.oldIndex - b.oldIndex; }); var precompLayer = comp.layers.add(newComp); precompLayer.name = name; precompLayer.moveTo(layerMap[0].oldIndex); precompLayer.property("Position").setValue([bounds.left + finalW / 2 - padding, bounds.top + finalH / 2 - padding]); for (var i = layers.length - 1; i >= 0; i--) { layers[i].remove(); } for (var i = 0; i < layerMap.length; i++) { var newLayer = layerMap[i].newLayer; var oldPos = newLayer.property("Position").value; newLayer.property("Position").setValue([oldPos[0] - bounds.left + padding, oldPos[1] - bounds.top + padding]); } if (shouldReveal && newComp.parentFolder) { newComp.parentFolder.selected = true; newComp.selected = true; } this.log("Crop Inteligente concluído com sucesso!"); } catch (e) { this.log("ERRO: " + e.message); } finally { app.endUndoGroup(); if (progressWin && progressWin.close) progressWin.close(); // Adicionado verificação antes de fechar a janela de progresso
    } };

    CropComp.getBoundsByExpression = function(comp, layers) { var bounds = { left: Infinity, top: Infinity, Infinity: -Infinity, bottom: -Infinity }; var tempLayer = null; var soloStates = []; var expressionString = "function findBounds(){var b={l:Infinity,t:Infinity,r:-Infinity,b:-Infinity};var step=Math.max(4,Math.floor(thisComp.width/150));for(var y=0;y<thisComp.height;y+=step){for(var x=0;x<thisComp.width;x+=step){try{var s=thisLayer.sampleImage([x,y],[.5,.5],true,time)}catch(e){var s=[0,0,0,0]}if(s[3]>.005){b.l=Math.min(b.l,x);b.r=Math.max(b.r,x);b.t=Math.min(b.t,y);b.b=Math.max(b.b,y)}}}if(b.l===Infinity)return[0,0,0,0];return[b.l/thisComp.width,b.t/thisComp.height,b.r/thisComp.width,b.b/thisComp.height]}findBounds();"; try { for (var i = 1; i <= comp.numLayers; i++) { var currentLayer = comp.layer(i); soloStates.push(currentLayer.solo); var isSelected = false; for (var j = 0; j < layers.length; j++) { if (currentLayer.index == layers[j].index) { isSelected = true; break; } } currentLayer.solo = isSelected; } tempLayer = comp.layers.addSolid([0,0,0], "temp_sampler", comp.width, comp.height, 1); tempLayer.adjustmentLayer = true; var effect = tempLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control"); effect.property("Color").expression = expressionString; var originalTime = comp.time; if (comp.duration > comp.frameDuration) { comp.time = originalTime + comp.frameDuration; } comp.time = originalTime; var result = effect.property("Color").valueAtTime(comp.time, false); if (result.join() == "0,0,0,0") { result = effect.property("Color").value; } bounds.left = result[0] * comp.width; bounds.top = result[1] * comp.height; bounds.right = result[2] * comp.width; bounds.bottom = result[3] * comp.height; } finally { if (tempLayer) tempLayer.remove(); for (var i = 0; i < soloStates.length; i++) { if (comp.layer(i + 1)) { comp.layer(i + 1).solo = soloStates[i]; } } } return bounds; };
    CropComp.runProjectMode = function() { try { var width = parseInt(this.ui.createWidth.text, 10); var height = parseInt(this.ui.createHeight.text, 10); var fps = parseFloat(this.ui.createFps.text); var duration = parseFloat(this.ui.createDuration.text); var shouldAutoScale = this.ui.createAutoScale.value; if (isNaN(width) || isNaN(height) || isNaN(fps) || isNaN(duration)) throw new Error("Todos os campos devem ser números válidos."); var projectItems = app.project.selection; app.beginUndoGroup("CropComp: Transformar Footage"); var createdCount = 0; for (var i = 0; i < projectItems.length; i++) { var item = projectItems[i]; if (!(item instanceof FootageItem)) continue; this.log("Transformando '" + item.name + "'..."); var newComp = app.project.items.addComp(item.name + " Comp", width, height, 1.0, duration, fps); var newLayer = newComp.layers.add(item); createdCount++; if (shouldAutoScale && newLayer.width > 0 && newLayer.height > 0) { var scaleFactor = Math.min(width / newLayer.width, height / newLayer.height); newLayer.property("Scale").setValue([scaleFactor * 100, scaleFactor * 100]); newLayer.property("Position").setValue([width / 2, height / 2]); } } app.endUndoGroup(); if (createdCount > 0) this.log(createdCount + " comp(s) criada(s) com sucesso!"); else this.log("Nenhum footage selecionado."); } catch(e) { this.log("ERRO: " + e.message); } };
    CropComp.runResizeCompsMode = function() { try { var compsToResize = []; var activeComp = app.project.activeItem; if (activeComp instanceof CompItem && activeComp.selectedLayers.length === 0) { compsToResize.push(activeComp); this.log("Alvo: comp ativa na timeline."); } else { compsToResize = app.project.selection; this.log("Alvo: " + compsToResize.length + " comp(s) do projeto."); } if (compsToResize.length === 0) throw new Error("Nenhuma composição selecionada como alvo."); var newWidth = parseInt(this.ui.resizeWidth.text, 10); var newHeight = parseInt(this.ui.resizeHeight.text, 10); var shouldScaleContent = this.ui.resizeScaleContent.value; var shouldChangeFps = this.ui.resizeChangeFpsCheck.value; var newFps = parseFloat(this.ui.resizeFps.text); var shouldChangeDuration = this.ui.resizeChangeDurationCheck.value; var newDuration = parseFloat(this.ui.resizeDuration.text); if (isNaN(newWidth) || isNaN(newHeight)) throw new Error("Dimensões devem ser números."); if (shouldChangeFps && isNaN(newFps)) throw new Error("FPS deve ser um número."); if (shouldChangeDuration && isNaN(newDuration)) throw new Error("Duração deve ser um número."); app.beginUndoGroup("CropComp: Redimensionar Comps"); var resizedCount = 0; for (var i = 0; i < compsToResize.length; i++) { var comp = compsToResize[i]; if (!(comp instanceof CompItem)) continue; this.log("Redimensionando '" + comp.name + "'..."); var oldWidth = comp.width; var oldHeight = comp.height; comp.width = newWidth; comp.height = newHeight; if (shouldChangeFps) comp.frameRate = newFps; if (shouldChangeDuration) comp.duration = newDuration; if (shouldScaleContent) { var scaleFactor = Math.min(newWidth / oldWidth, newHeight / oldHeight); for (var j = 1; j <= comp.numLayers; j++) { var layer = comp.layer(j); if (layer instanceof CameraLayer || layer instanceof LightLayer) continue; this.rescaleProperty(layer.property("Position"), scaleFactor, true); this.rescaleProperty(layer.property("Scale"), scaleFactor, false); } } resizedCount++; } app.endUndoGroup(); if (resizedCount > 0) this.log(resizedCount + " comp(s) redimensionada(s) com sucesso!"); } catch(e) { this.log("ERRO: " + e.message); } };
    CropComp.rescaleProperty = function(prop, scaleFactor, isPosition) { if (!prop) return; if (prop.numKeys === 0) { var cVal = prop.value; var nVal = isPosition ? [cVal[0] * scaleFactor, cVal[1] * scaleFactor] : [cVal[0] * scaleFactor, cVal[1] * scaleFactor]; if (cVal.length > 2) nVal.push(isPosition ? cVal[2] : cVal[2] * scaleFactor); prop.setValue(nVal); } else { for (var k = 1; k <= prop.numKeys; k++) { var cVal = prop.keyValue(k); var nVal = isPosition ? [cVal[0] * scaleFactor, cVal[1] * scaleFactor] : [cVal[0] * scaleFactor, cVal[1] * scaleFactor]; if (cVal.length > 2) nVal.push(isPosition ? cVal[2] : cVal[2] * scaleFactor); prop.setKeyValue(k, nVal); } } };

    CropComp.buildUI(thisObj);
    
})(this);