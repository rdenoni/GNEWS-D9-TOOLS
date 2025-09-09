/**
 * GNEWS Templates v2.7 - COM SISTEMA DE PRÉ-CARREGAMENTO
 * Modificações para eliminar delays durante troca de produções
 */

// Backup da função original
var d9TemplateDialogOriginal = d9TemplateDialog;

// Nova função principal com pré-carregamento
function d9TemplateDialog() {
    var scriptName = 'GNEWS TEMPLATES';
    var scriptVersion = '2.7'; // Atualizada para incluir pré-carregamento
    
    // === NOVA IMPLEMENTAÇÃO COM PRÉ-CARREGAMENTO ===
    
    // Mostra tela de carregamento
    var loadingScreen = showAdvancedLoadingScreen();
    loadingScreen.show();
    
    var totalLoadingSteps = D9T_prodArray.length + 1; // +1 para dados das artes
    var currentStep = 0;
    
    // Inicia pré-carregamento
    PreloadManager.init(function(type, progress, detail) {
        updateLoadingProgress(loadingScreen, type, progress, detail);
        
        if (type === 'complete') {
            // Fecha tela de carregamento e abre interface principal
            loadingScreen.hide();
            loadingScreen.close();
            
            // Chama interface principal otimizada
            showMainInterfaceOptimized();
        }
    });
}

// Tela de carregamento aprimorada e temática GNEWS
function showAdvancedLoadingScreen() {
    var loadingWin = new Window("dialog", "GNEWS Templates", undefined, {closeButton: false});
    loadingWin.orientation = "column";
    loadingWin.alignChildren = ["fill", "center"];
    loadingWin.spacing = 15;
    loadingWin.margins = 25;
    loadingWin.preferredSize = [450, 300];
    
    // Aplica estilo GNEWS
    if (typeof bgColor1 !== 'undefined') {
        setBgColor(loadingWin, bgColor1);
    }
    
    // Header com logo/branding
    var headerGroup = loadingWin.add("group");
    headerGroup.orientation = "column";
    headerGroup.alignChildren = ["center", "center"];
    headerGroup.spacing = 10;
    headerGroup.margins = [0, 10, 0, 20];
    
    var logoText = headerGroup.add("statictext", undefined, "GNEWS");
    logoText.graphics.font = ScriptUI.newFont("Arial", "Bold", 24);
    if (typeof highlightColor1 !== 'undefined') {
        setFgColor(logoText, highlightColor1);
    }
    
    var templateText = headerGroup.add("statictext", undefined, "TEMPLATES SYSTEM");
    templateText.graphics.font = ScriptUI.newFont("Arial", "Regular", 14);
    if (typeof normalColor1 !== 'undefined') {
        setFgColor(templateText, normalColor1);
    }
    
    var versionText = headerGroup.add("statictext", undefined, "v2.7 - Sistema Inteligente de Cache");
    versionText.graphics.font = ScriptUI.newFont("Arial", "Regular", 10);
    if (typeof monoColor1 !== 'undefined') {
        setFgColor(versionText, monoColor1);
    }
    
    // Área de progresso
    var progressPanel = loadingWin.add("panel", undefined, "");
    progressPanel.orientation = "column";
    progressPanel.alignChildren = ["fill", "center"];
    progressPanel.spacing = 12;
    progressPanel.margins = 20;
    progressPanel.alignment = ["fill", "center"];
    
    // Status principal
    var mainStatusText = progressPanel.add("statictext", undefined, "Inicializando sistema...");
    mainStatusText.alignment = ["center", "center"];
    mainStatusText.graphics.font = ScriptUI.newFont("Arial", "Regular", 12);
    if (typeof normalColor2 !== 'undefined') {
        setFgColor(mainStatusText, normalColor2);
    }
    
    // Barra de progresso principal
    var mainProgressBar = progressPanel.add("progressbar", undefined, 0, 100);
    mainProgressBar.preferredSize = [380, 14];
    
    // Progresso detalhado
    var detailGroup = progressPanel.add("group");
    detailGroup.orientation = "column";
    detailGroup.alignChildren = ["center", "center"];
    detailGroup.spacing = 5;
    
    var detailText = detailGroup.add("statictext", undefined, "");
    detailText.alignment = ["center", "center"];
    detailText.graphics.font = ScriptUI.newFont("Arial", "Regular", 10);
    if (typeof monoColor0 !== 'undefined') {
        setFgColor(detailText, monoColor0);
    }
    
    var subProgressBar = detailGroup.add("progressbar", undefined, 0, 100);
    subProgressBar.preferredSize = [300, 8];
    subProgressBar.visible = false;
    
    // Contador de recursos
    var statsGroup = progressPanel.add("group");
    statsGroup.orientation = "row";
    statsGroup.alignment = ["center", "center"];
    statsGroup.spacing = 20;
    statsGroup.margins = [0, 10, 0, 0];
    
    var templatesCountText = statsGroup.add("statictext", undefined, "Templates: 0");
    templatesCountText.graphics.font = ScriptUI.newFont("Arial", "Regular", 9);
    if (typeof monoColor1 !== 'undefined') {
        setFgColor(templatesCountText, monoColor1);
    }
    
    var productionsCountText = statsGroup.add("statictext", undefined, "Produções: 0");
    productionsCountText.graphics.font = ScriptUI.newFont("Arial", "Regular", 9);
    if (typeof monoColor1 !== 'undefined') {
        setFgColor(productionsCountText, monoColor1);
    }
    
    var cacheStatusText = statsGroup.add("statictext", undefined, "Cache: Inicializando");
    cacheStatusText.graphics.font = ScriptUI.newFont("Arial", "Regular", 9);
    if (typeof monoColor1 !== 'undefined') {
        setFgColor(cacheStatusText, monoColor1);
    }
    
    // Armazena referências para atualização
    loadingWin.components = {
        mainStatusText: mainStatusText,
        mainProgressBar: mainProgressBar,
        detailText: detailText,
        subProgressBar: subProgressBar,
        templatesCountText: templatesCountText,
        productionsCountText: productionsCountText,
        cacheStatusText: cacheStatusText
    };
    
    return loadingWin;
}

// Função para atualizar o progresso da tela de carregamento
function updateLoadingProgress(loadingWin, type, progress, detail) {
    try {
        var comp = loadingWin.components;
        
        // Atualiza barra principal
        comp.mainProgressBar.value = progress;
        
        // Mensagens de status baseadas no tipo
        var statusMessages = {
            'init': 'Inicializando sistema de cache...',
            'productions': 'Carregando produções...',
            'templates': 'Escaneando templates...',
            'metadata': 'Processando metadados...',
            'previews': 'Carregando previews...',
            'cache': 'Organizando cache...',
            'complete': 'Sistema pronto!'
        };
        
        comp.mainStatusText.text = statusMessages[type] || 'Processando...';
        
        // Detalhes adicionais
        if (detail) {
            comp.detailText.text = detail;
            comp.subProgressBar.visible = true;
        } else {
            comp.detailText.text = Math.round(progress) + '%';
        }
        
        // Atualiza estatísticas
        if (PreloadManager.cache.templates) {
            var templateCount = 0;
            for (var prod in PreloadManager.cache.templates) {
                for (var template in PreloadManager.cache.templates[prod]) {
                    templateCount++;
                }
            }
            comp.templatesCountText.text = "Templates: " + templateCount;
        }
        
        comp.productionsCountText.text = "Produções: " + D9T_prodArray.length;
        
        var cacheStatuses = {
            'init': 'Inicializando',
            'loading': 'Carregando',
            'templates': 'Processando',
            'complete': 'Otimizado'
        };
        
        comp.cacheStatusText.text = "Cache: " + (cacheStatuses[type] || 'Ativo');
        
        loadingWin.update();
    } catch (e) {
        // Ignora erros de atualização da UI durante carregamento
    }
}

// Interface principal otimizada (versão sem delays)
function showMainInterfaceOptimized() {
    var compactWidth = 420, extendedWidth = 720;
    var fileFilter = ['.aep', '.aet'];
    var projectFile, previewFile, templateData;
    var newCompsArray = [], newOutputsArray = [];
    
    // Cache local para interface rápida
    var uiCache = {
        selectedProduction: null,
        selectedTemplate: null,
        currentPreview: null,
        templatesList: [],
        lastUpdate: null
    };
    
    // Janela principal
    var win = new Window("dialog", "GNEWS TEMPLATES v2.7", undefined, { resizeable: true });
    win.orientation = "row";
    win.alignChildren = ["fill", "fill"];
    win.spacing = 0;
    win.margins = 0;
    win.preferredSize = [extendedWidth, 600];
    
    if (typeof bgColor1 !== 'undefined') {
        setBgColor(win, bgColor1);
    }
    
    // === PAINEL ESQUERDO - NAVEGAÇÃO OTIMIZADA ===
    var leftPanel = win.add("panel", undefined, "");
    leftPanel.orientation = "column";
    leftPanel.alignChildren = ["fill", "fill"];
    leftPanel.alignment = ["fill", "fill"];
    leftPanel.preferredSize = [300, -1];
    leftPanel.margins = 10;
    leftPanel.spacing = 10;
    
    // Seleção de produção com cache
    var prodGroup = leftPanel.add("group");
    prodGroup.orientation = "row";
    prodGroup.alignChildren = ["fill", "center"];
    prodGroup.spacing = 8;
    
    var prodLabel = prodGroup.add("statictext", undefined, "Produção:");
    prodLabel.preferredSize.width = 60;
    if (typeof normalColor1 !== 'undefined') {
        setFgColor(prodLabel, normalColor1);
    }
    
    var prodDropdown = prodGroup.add("dropdownlist", undefined, []);
    prodDropdown.alignment = ["fill", "center"];
    
    // Popula dropdown com produções pré-carregadas
    for (var i = 0; i < D9T_prodArray.length; i++) {
        prodDropdown.add("item", D9T_prodArray[i].name);
    }
    prodDropdown.selection = 0;
    uiCache.selectedProduction = D9T_prodArray[0];
    
    // TreeView otimizada para templates
    var templatesTree = leftPanel.add("treeview", undefined, []);
    templatesTree.alignment = ["fill", "fill"];
    templatesTree.preferredSize = [-1, 350];
    
    // Botões de controle
    var controlsGroup = leftPanel.add("group");
    controlsGroup.orientation = "row";
    controlsGroup.alignment = ["fill", "bottom"];
    controlsGroup.spacing = 5;
    
    var refreshBtn = controlsGroup.add("button", undefined, "🔄");
    refreshBtn.preferredSize = [40, 30];
    refreshBtn.helpTip = "Atualizar lista";
    
    var openFolderBtn = controlsGroup.add("button", undefined, "📁");
    openFolderBtn.preferredSize = [40, 30];
    openFolderBtn.helpTip = "Abrir pasta";
    
    var cacheBtn = controlsGroup.add("button", undefined, "⚡");
    cacheBtn.preferredSize = [40, 30];
    cacheBtn.helpTip = "Limpar cache";
    
    // === PAINEL DIREITO - PREVIEW E INFORMAÇÕES ===
    var rightPanel = win.add("panel", undefined, "");
    rightPanel.orientation = "column";
    rightPanel.alignChildren = ["fill", "fill"];
    rightPanel.alignment = ["fill", "fill"];
    rightPanel.margins = 10;
    rightPanel.spacing = 10;
    
    // Preview otimizado
    var previewGroup = rightPanel.add("group");
    previewGroup.orientation = "column";
    previewGroup.alignChildren = ["fill", "top"];
    previewGroup.spacing = 8;
    
    var previewLabel = previewGroup.add("statictext", undefined, "PREVIEW:");
    if (typeof normalColor1 !== 'undefined') {
        setFgColor(previewLabel, normalColor1);
    }
    
    var previewImg = previewGroup.add("image", undefined, File(scriptMainPath + "source/icons/no-preview.png"));
    previewImg.preferredSize = [300, 200];
    previewImg.alignment = ["center", "top"];
    
    // Informações da arte com cache
    var infoPanel = rightPanel.add("panel", undefined, "INFORMAÇÕES DA ARTE");
    infoPanel.orientation = "column";
    infoPanel.alignChildren = ["fill", "top"];
    infoPanel.alignment = ["fill", "top"];
    infoPanel.spacing = 8;
    infoPanel.margins = 15;
    
    // Campo de código
    var codigoGroup = infoPanel.add("group");
    codigoGroup.orientation = "row";
    codigoGroup.alignChildren = ["left", "center"];
    codigoGroup.spacing = 8;
    
    var codigoLabel = codigoGroup.add("statictext", undefined, "Código:");
    codigoLabel.preferredSize.width = 60;
    if (typeof monoColor0 !== 'undefined') {
        setFgColor(codigoLabel, monoColor0);
    }
    
    var codigoText = codigoGroup.add("edittext", undefined, "");
    codigoText.preferredSize = [120, 24];
    codigoText.helpTip = "Digite o código da arte (ex: GNVZ036)";
    
    // Informações dinâmicas
    var infoFields = [
        { label: "Nome da Arte:", key: "nomeArte" },
        { label: "Servidor Destino:", key: "servidorDestino" },
        { label: "Última Atualização:", key: "ultimaAtualizacao" },
        { label: "Versão:", key: "version" }
    ];
    
    var infoLabels = [], infoValues = [];
    for (var f = 0; f < infoFields.length; f++) {
        var infoRow = infoPanel.add("group");
        infoRow.orientation = "row";
        infoRow.alignChildren = ["left", "center"];
        infoRow.spacing = 8;
        
        var label = infoRow.add("statictext", undefined, infoFields[f].label);
        label.preferredSize.width = 100;
        if (typeof monoColor0 !== 'undefined') {
            setFgColor(label, monoColor0);
        }
        infoLabels.push(label);
        
        var value = infoRow.add("statictext", undefined, "---");
        value.preferredSize.width = 200;
        if (typeof normalColor2 !== 'undefined') {
            setFgColor(value, normalColor2);
        }
        infoValues.push(value);
    }
    
    // Botões de ação
    var actionGroup = rightPanel.add("group");
    actionGroup.orientation = "row";
    actionGroup.alignment = ["fill", "bottom"];
    actionGroup.spacing = 10;
    actionGroup.margins = [0, 20, 0, 0];
    
    var importBtn = actionGroup.add("button", undefined, "IMPORTAR");
    importBtn.preferredSize = [100, 35];
    importBtn.enabled = false;
    
    var infoBtn = actionGroup.add("button", undefined, "AJUDA");
    infoBtn.preferredSize = [80, 35];
    
    var closeBtn = actionGroup.add("button", undefined, "FECHAR");
    closeBtn.preferredSize = [80, 35];
    
    // === FUNÇÕES OTIMIZADAS COM CACHE ===
    
    // Atualiza lista de templates instantaneamente (usa cache)
    function updateTemplatesList(production) {
        templatesTree.removeAll();
        uiCache.templatesList = [];
        
        if (!production) return;
        
        var templates = getTemplatesCached(production);
        var folderStructure = {};
        
        // Organiza em estrutura de pastas
        for (var i = 0; i < templates.length; i++) {
            var template = templates[i];
            var relativePath = template.path.replace(production.templatesPath, "");
            var pathParts = relativePath.split(/[\\/]/);
            
            var currentLevel = folderStructure;
            for (var p = 0; p < pathParts.length - 1; p++) {
                if (pathParts[p] && !currentLevel[pathParts[p]]) {
                    currentLevel[pathParts[p]] = {};
                }
                currentLevel = currentLevel[pathParts[p]] || {};
            }
            
            if (!currentLevel._files) currentLevel._files = [];
            currentLevel._files.push(template);
        }
        
        // Cria nós na árvore
        function createTreeNodes(parentNode, structure) {
            for (var key in structure) {
                if (key === '_files') {
                    // Adiciona arquivos
                    for (var f = 0; f < structure[key].length; f++) {
                        var template = structure[key][f];
                        var fileNode = parentNode.add("item", template.name);
                        fileNode.templateData = template;
                        uiCache.templatesList.push(template);
                    }
                } else {
                    // Adiciona pasta
                    var folderNode = parentNode.add("node", key);
                    createTreeNodes(folderNode, structure[key]);
                    folderNode.expanded = true;
                }
            }
        }
        
        createTreeNodes(templatesTree, folderStructure);
    }
    
    // Atualiza preview instantaneamente (usa cache)
    function updatePreview(template) {
        if (!template) {
            previewImg.image = File(scriptMainPath + "source/icons/no-preview.png");
            return;
        }
        
        var preview = getTemplatePreviewCached(uiCache.selectedProduction, template.file);
        if (preview && preview.exists) {
            try {
                previewImg.image = preview;
                uiCache.currentPreview = preview;
            } catch (e) {
                previewImg.image = File(scriptMainPath + "source/icons/no-preview.png");
            }
        } else {
            previewImg.image = File(scriptMainPath + "source/icons/no-preview.png");
        }
    }
    
    // Atualiza informações instantaneamente (usa cache)
    function updateTemplateInfo(template) {
        if (!template) {
            // Limpa informações
            for (var i = 0; i < infoValues.length; i++) {
                infoValues[i].text = "---";
            }
            codigoText.text = "";
            importBtn.enabled = false;
            return;
        }
        
        var metadata = getTemplateMetadataCached(uiCache.selectedProduction, template.file);
        
        if (metadata) {
            codigoText.text = metadata.codigo || "";
            infoValues[0].text = metadata.nomeArte || "---";
            infoValues[1].text = metadata.servidorDestino || metadata.servidor || "---";
            infoValues[2].text = metadata.ultimaAtualizacao || metadata.lastModified || "---";
            infoValues[3].text = metadata.version || "---";
        } else {
            // Usa dados básicos do template
            codigoText.text = PreloadManager.generateCodigoFromTemplate(template.name);
            infoValues[0].text = template.name.replace(/\.(aep|aet)$/i, "");
            infoValues[1].text = PreloadManager.determineServidorDestino(template.name, template.path);
            infoValues[2].text = template.modified ? template.modified.toLocaleString() : "---";
            infoValues[3].text = "Carregando...";
            
            // Carrega metadados em background
            app.scheduleTask("updateTemplateInfo(uiCache.selectedTemplate);", 100, false);
        }
        
        importBtn.enabled = true;
    }
    
    // === EVENTOS OTIMIZADOS ===
    
    // Mudança de produção - instantânea
    prodDropdown.onChange = function() {
        if (this.selection) {
            uiCache.selectedProduction = D9T_prodArray[this.selection.index];
            updateTemplatesList(uiCache.selectedProduction);
            updatePreview(null);
            updateTemplateInfo(null);
        }
    };
    
    // Seleção de template - instantânea
    templatesTree.onChanging = function() {
        if (this.selection && this.selection.templateData) {
            uiCache.selectedTemplate = this.selection.templateData;
            updatePreview(uiCache.selectedTemplate);
            updateTemplateInfo(uiCache.selectedTemplate);
        }
    };
    
    // Duplo clique para importar
    templatesTree.onDoubleClick = function() {
        if (this.selection && this.selection.templateData) {
            importTemplate(this.selection.templateData);
        }
    };
    
    // Atualização manual (força reload do cache)
    refreshBtn.onClick = function() {
        // Recarrega cache da produção atual
        if (uiCache.selectedProduction) {
            var prodKey = PreloadManager.getProductionKey(uiCache.selectedProduction);
            delete PreloadManager.cache.templates[prodKey];
            
            PreloadManager.preloadProductionTemplates(uiCache.selectedProduction, function() {
                updateTemplatesList(uiCache.selectedProduction);
            });
        }
    };
    
    // Abrir pasta
    openFolderBtn.onClick = function() {
        if (uiCache.selectedProduction) {
            var folder = new Folder(uiCache.selectedProduction.templatesPath);
            if (folder.exists) {
                folder.execute();
            }
        }
    };
    
    // Limpar cache
    cacheBtn.onClick = function() {
        PreloadManager.cleanCache();
        alert("Cache limpo com sucesso!");
    };
    
    // Busca por código
    codigoText.onChanging = function() {
        if (this.text.length >= 3) {
            var arteData = PreloadManager.getArteData(this.text.toUpperCase());
            if (arteData) {
                infoValues[0].text = arteData.nome_arte || "---";
                infoValues[1].text = arteData.servidor_destino || "---";
                infoValues[2].text = arteData.ultima_atualizacao || "---";
            }
        }
    };
    
    // Importar template
    importBtn.onClick = function() {
        if (uiCache.selectedTemplate) {
            importTemplate(uiCache.selectedTemplate);
        }
    };
    
    // Função de importação otimizada
    function importTemplate(template) {
        try {
            var file = template.file;
            if (!file.exists) {
                alert("Arquivo não encontrado: " + file.name);
                return;
            }
            
            // Importa o arquivo
            var importOptions = new ImportOptions(file);
            var item = app.project.importFile(importOptions);
            
            if (item) {
                // Log GNEWS
                var metadata = getTemplateMetadataCached(uiCache.selectedProduction, file);
                var logInfo = {
                    template: file.name,
                    codigo: metadata ? metadata.codigo : codigoText.text,
                    production: uiCache.selectedProduction.name,
                    timestamp: new Date().toLocaleString()
                };
                
                writeln("GNEWS IMPORT LOG: " + JSON.stringify(logInfo));
                
                alert("Template importado com sucesso!\n\n" + 
                      "Arquivo: " + file.name + "\n" +
                      "Código: " + (metadata ? metadata.codigo : codigoText.text));
                      
                win.close();
            }
        } catch (e) {
            alert("Erro ao importar template:\n" + e.message);
        }
    }
    
    // Ajuda
    infoBtn.onClick = function() {
        showHelpDialog();
    };
    
    // Fechar
    closeBtn.onClick = function() {
        win.close();
    };
    
    // === INICIALIZAÇÃO ===
    
    // Carrega lista inicial
    updateTemplatesList(uiCache.selectedProduction);
    
    // Mostra janela
    win.show();
}

// === FUNÇÕES DE COMPATIBILIDADE ===

// Funções que usam o cache para compatibilidade com código existente
function getTemplatesCached(production) {
    var prodKey = PreloadManager.getProductionKey(production);
    var cachedTemplates = PreloadManager.cache.templates[prodKey];
    
    if (cachedTemplates) {
        var templates = [];
        for (var fileKey in cachedTemplates) {
            templates.push(cachedTemplates[fileKey]);
        }
        return templates;
    }
    
    return [];
}

function getTemplateMetadataCached(production, templateFile) {
    var prodKey = PreloadManager.getProductionKey(production);
    var fileKey = PreloadManager.getFileKey(templateFile);
    
    return PreloadManager.loadTemplateMetadata(prodKey, fileKey);
}

function getTemplatePreviewCached(production, templateFile) {
    var prodKey = PreloadManager.getProductionKey(production);
    var fileKey = PreloadManager.getFileKey(templateFile);
    
    return PreloadManager.loadTemplatePreview(prodKey, fileKey);
}

// Função de ajuda (mantida da versão original)
function showHelpDialog() {
    var helpWin = new Window("dialog", "GNEWS Templates - Ajuda v2.7", undefined, { closeButton: true });
    helpWin.orientation = "column";
    helpWin.alignChildren = ["fill", "fill"];
    helpWin.spacing = 10;
    helpWin.margins = 15;
    helpWin.preferredSize = [450, 600];
    
    if (typeof bgColor1 !== 'undefined') {
        setBgColor(helpWin, bgColor1);
    }
    
    var titleText = helpWin.add("statictext", undefined, "SISTEMA DE CACHE INTELIGENTE");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
    titleText.alignment = ["center", "center"];
    if (typeof highlightColor1 !== 'undefined') {
        setFgColor(titleText, highlightColor1);
    }
    
    var descText = helpWin.add("statictext", undefined, 
        "Esta versão inclui sistema de pré-carregamento que elimina delays " +
        "durante a troca entre produções. Todos os templates são carregados " +
        "no início para navegação instantânea.", { multiline: true });
    descText.alignment = ["fill", "fill"];
    descText.preferredSize.height = 60;
    if (typeof normalColor1 !== 'undefined') {
        setFgColor(descText, normalColor1);
    }
    
    var featuresText = helpWin.add("statictext", undefined,
        "NOVIDADES v2.7:\n\n" +
        "• Sistema de cache inteligente\n" +
        "• Carregamento em background\n" +
        "• Navegação instantânea entre produções\n" +
        "• Preview otimizado\n" +
        "• Metadados em cache\n" +
        "• Limpeza automática de memória\n\n" +
        "COMO USAR:\n\n" +
        "1. O sistema carrega automaticamente no início\n" +
        "2. Navegue normalmente - tudo é instantâneo\n" +
        "3. Use 🔄 para recarregar manualmente\n" +
        "4. Use ⚡ para limpar cache se necessário", 
        { multiline: true });
    featuresText.alignment = ["fill", "fill"];
    if (typeof normalColor2 !== 'undefined') {
        setFgColor(featuresText, normalColor2);
    }
    
    var closeBtn = helpWin.add("button", undefined, "OK");
    closeBtn.alignment = ["center", "bottom"];
    closeBtn.onClick = function() { helpWin.close(); };
    
    helpWin.show();
}