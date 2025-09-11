$.encoding = "UTF-8";

// =============================================================================
// GNEWS TEMPLATES - V4.0 COMPLETE & FIXED
// Versão completa com todas as correções e otimizações
// =============================================================================

// === VERIFICAÇÃO DE DEPENDÊNCIAS ===
function checkDependencies() {
    var missing = [];
    
    if (typeof scriptMainPath === "undefined") {
        try {
            if ($.fileName && $.fileName !== '') {
                var currentFile = new File($.fileName);
                scriptMainPath = currentFile.parent.parent.fullName + '/';
            } else {
                scriptMainPath = Folder.userData.fullName + '/GNEWS_TOOLS/';
                var scriptFolder = new Folder(scriptMainPath);
                if (!scriptFolder.exists) scriptFolder.create();
            }
        } catch (e) {
            missing.push("scriptMainPath");
        }
    }
    
    return missing;
}

// === SISTEMA DE LOGS MELHORADO ===
var Logger = {
    levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
    currentLevel: 2,
    logFile: null,
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        
        try {
            var logFolder = new Folder(scriptMainPath + "source/logs");
            if (!logFolder.exists) logFolder.create();
            this.logFile = new File(logFolder.fullName + "/gnews_templates.log");
            this.initialized = true;
        } catch (e) {
            this.initialized = false;
        }
    },
    
    log: function(level, message, data) {
        if (!this.initialized) this.init();
        if (level > this.currentLevel) return;
        
        try {
            var timestamp = new Date().toISOString();
            var levelName = Object.keys(this.levels)[level];
            var logEntry = timestamp + " [" + levelName + "] " + message;
            
            if (data) {
                logEntry += " | Data: " + JSON.stringify(data);
            }
            
            if (level === this.levels.ERROR) {
                $.writeln("ERROR: " + message);
            }
            
            if (this.logFile) {
                this.logFile.open("a");
                this.logFile.writeln(logEntry);
                this.logFile.close();
            }
        } catch (e) {
            // Fallback silencioso
        }
    },
    
    error: function(msg, data) { this.log(this.levels.ERROR, msg, data); },
    warn: function(msg, data) { this.log(this.levels.WARN, msg, data); },
    info: function(msg, data) { this.log(this.levels.INFO, msg, data); },
    debug: function(msg, data) { this.log(this.levels.DEBUG, msg, data); }
};

// === SISTEMA DE PERFORMANCE ===
var PerformanceMonitor = {
    config: {
        CHUNK_SIZE: 100,
        DEBOUNCE_TIME: 300,
        CACHE_TIMEOUT: 300000,
        MAX_PREVIEW_SIZE: 400
    },
    
    detectSystemPerformance: function() {
        try {
            Logger.info("Detectando performance do sistema...");
            
            var testStart = new Date().getTime();
            for (var i = 0; i < 50000; i++) {
                var temp = Math.sqrt(i) * Math.random();
            }
            var testDuration = new Date().getTime() - testStart;
            
            if (testDuration > 100) {
                Logger.warn("Sistema lento detectado");
                this.config.CHUNK_SIZE = 50;
                this.config.DEBOUNCE_TIME = 500;
            } else {
                Logger.info("Sistema com boa performance");
                this.config.CHUNK_SIZE = 150;
                this.config.DEBOUNCE_TIME = 200;
            }
            
            return this.config;
        } catch (e) {
            Logger.error("Erro na detecção de performance", { error: e.message });
            return this.config;
        }
    }
};

// === SISTEMA DE RECUPERAÇÃO ===
var ErrorRecovery = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackMode: false,
    
    retryOperation: function(operation, context, onSuccess, onFailure) {
        var attempts = 0;
        var self = this;
        
        function attempt() {
            attempts++;
            
            try {
                var result = operation();
                if (onSuccess) onSuccess(result);
                Logger.info("Operação bem-sucedida", { context: context, attempts: attempts });
                return result;
            } catch (error) {
                Logger.warn("Tentativa " + attempts + " falhou", { context: context, error: error.message });
                
                if (attempts < self.maxRetries) {
                    $.sleep(self.retryDelay / 1000);
                    return attempt();
                } else {
                    Logger.error("Todas as tentativas falharam", { context: context, error: error.message });
                    if (onFailure) onFailure(error);
                    return null;
                }
            }
        }
        
        return attempt();
    },
    
    enableFallbackMode: function() {
        this.fallbackMode = true;
        Logger.warn("Modo fallback ativado");
    },
    
    isFallbackMode: function() {
        return this.fallbackMode;
    }
};

// === CACHE GLOBAL ===
var GLOBAL_CACHE = {
    templatesData: {},
    previewCache: {},
    lastLoadTime: {},
    isLoading: false,
    version: "4.0",
    arteSearchCache: {},
    servidorCache: {}
};

function createStatusWindow(title) {
    var win = new Window("palette", title, undefined, { closeButton: false });
    win.orientation = "column";
    win.alignChildren = "fill";
    win.preferredSize.width = 300;
    
    var statusLabel = win.add("statictext", undefined, "Iniciando...");
    statusLabel.characters = 40;
    
    var progressBar = win.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize.width = 280;
    
    var progressLabel = win.add("statictext", undefined, "0 arquivos");
    progressLabel.characters = 40;
    progressLabel.alignment = "center";
    
    win.update = function(statusText, current, total) {
        try {
            if (statusText) statusLabel.text = statusText;
            if (current !== undefined && total !== undefined) {
                progressBar.value = total > 0 ? (current / total) * 100 : 0;
                progressLabel.text = current + " / " + total + " arquivos";
            }
            win.layout.layout(true);
            if (win.visible) win.update();
        } catch (e) {
            // Evita erros de UI
        }
    };
    
    return win;
}

function flattenDataOptimized(dataArray) {
    var flatList = [];
    var stack = [];
    
    try {
        for (var i = dataArray.length - 1; i >= 0; i--) {
            stack.push(dataArray[i]);
        }
        
        while (stack.length > 0) {
            var node = stack.pop();
            
            if (node && node.type === "item") {
                flatList.push(node);
            } else if (node && node.type === "node" && node.children && node.children.length > 0) {
                for (var j = node.children.length - 1; j >= 0; j--) {
                    stack.push(node.children[j]);
                }
            }
        }
    } catch (e) {
        Logger.error("Erro ao achatar dados", { error: e.message });
    }
    
    return flatList;
}

function d9TemplateDialog() {
    // Verificação de dependências
    var missingDeps = checkDependencies();
    if (missingDeps.length > 0) {
        alert("Dependências não encontradas: " + missingDeps.join(", "));
        return;
    }
    
    // Inicialização
    Logger.init();
    Logger.info("Iniciando GNEWS Templates v4.0");
    
    var perfConfig = PerformanceMonitor.detectSystemPerformance();
    
    if (GLOBAL_CACHE.isLoading) {
        alert("Uma instância já está carregando. Aguarde...");
        return;
    }
    
    GLOBAL_CACHE.isLoading = true;
    
    var initialStatusWin = createStatusWindow("GNEWS Templates");
    initialStatusWin.show();
    initialStatusWin.update("Inicializando...", 0, 100);
    
    try {
        var scriptName = "GNEWS TEMPLATES";
        var scriptVersion = "4.0";
        var fileFilter = [".aep", ".aet"];
        var projectFile;
        var lClick = "Clique: ";
        
        // Cache
        var cacheFolder = new Folder(scriptMainPath + "source/cache");
        if (!cacheFolder.exists) cacheFolder.create();
        
        var templatesCache = GLOBAL_CACHE.templatesData;
        var previewCache = GLOBAL_CACHE.previewCache;
        
        // Configuração central
        var userConfigFile = null;
        try {
            var centralConfigFolder = new Folder(scriptMainPath + "source/config");
            if (!centralConfigFolder.exists) centralConfigFolder.create();
            userConfigFile = new File(centralConfigFolder.fullName + "/TEMPLATES_config.json");
        } catch (e) {
            Logger.warn("Erro ao acessar configuração central", { error: e.message });
        }
        
        // Dados das artes
        var artesData = null;
        var artesDataLoaded = false;
        
        function loadArtesData() {
            if (artesDataLoaded) return artesData;
            
            try {
                var artesDataFile = new File(scriptMainPath + "source/libraries/dados_json/DADOS_artes_gnews.json");
                if (artesDataFile.exists) {
                    artesDataFile.open("r");
                    artesData = JSON.parse(artesDataFile.read());
                    artesDataFile.close();
                    artesDataLoaded = true;
                    Logger.info("Dados das artes carregados");
                }
            } catch (e) {
                Logger.error("Erro ao carregar dados das artes", { error: e.message });
                artesData = null;
            }
            
            return artesData;
        }
        
        function getArteData(codigo) {
            var data = loadArtesData();
            if (!data || !data.artes_codificadas) return null;
            
            if (GLOBAL_CACHE.arteSearchCache[codigo]) {
                return GLOBAL_CACHE.arteSearchCache[codigo];
            }
            
            for (var i = 0; i < data.artes_codificadas.length; i++) {
                if (data.artes_codificadas[i].codigo === codigo) {
                    GLOBAL_CACHE.arteSearchCache[codigo] = data.artes_codificadas[i];
                    return data.artes_codificadas[i];
                }
            }
            
            GLOBAL_CACHE.arteSearchCache[codigo] = null;
            return null;
        }
        
        // Cores
        var bgColor1 = "#0B0D0E", normalColor1 = "#C7C8CA", monoColor0 = "#686F75",
            monoColor1 = "#9CA0A5", normalColor2 = "#ffffffff", highlightColor1 = "#E0003A";
        
        var colorCache = {};
        
        function hexToRgb(hex) {
            if (colorCache[hex]) return colorCache[hex];
            
            if (!hex) return [0.5, 0.5, 0.5];
            hex = hex.replace("#", "");
            var r = parseInt(hex.substring(0, 2), 16);
            var g = parseInt(hex.substring(2, 4), 16);
            var b = parseInt(hex.substring(4, 6), 16);
            var result = [r / 255, g / 255, b / 255];
            
            colorCache[hex] = result;
            return result;
        }
        
        function setBgColor(element, hexColor) {
            try {
                if (!element || !element.graphics) return;
                var color = hexToRgb(hexColor);
                var bType = element.graphics.BrushType.SOLID_COLOR;
                element.graphics.backgroundColor = element.graphics.newBrush(bType, color);
            } catch (e) {
                Logger.warn("Erro ao definir cor de fundo", { error: e.message });
            }
        }
        
        function setFgColor(element, hexColor) {
            try {
                if (!element || !element.graphics) return;
                var color = hexToRgb(hexColor);
                var pType = element.graphics.PenType.SOLID_COLOR;
                element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1);
            } catch (e) {
                Logger.warn("Erro ao definir cor de primeiro plano", { error: e.message });
            }
        }
        
        initialStatusWin.update("Criando interface...", 20, 100);
        
        // Interface principal
        var D9T_TEMPLATES_w = new Window("palette", scriptName + " " + scriptVersion);
        D9T_TEMPLATES_w.preferredSize = [800, 600];
        
        // Header
        var topHeaderGrp = D9T_TEMPLATES_w.add("group");
        topHeaderGrp.orientation = "row";
        topHeaderGrp.alignment = ["fill", "top"];
        
        var titlePlaceholder = topHeaderGrp.add("statictext", undefined, "");
        titlePlaceholder.alignment = ["fill", "center"];
        
        var helpBtnGrp = topHeaderGrp.add("group");
        helpBtnGrp.alignment = ["right", "center"];
        
        var infoBtn = helpBtnGrp.add("button", undefined, "?");
        infoBtn.helpTip = "ajuda | DOCS";
        infoBtn.preferredSize = [24, 24];
        
        // Grupo principal
        var mainGrp = D9T_TEMPLATES_w.add("group");
        mainGrp.orientation = "row";
        mainGrp.spacing = 12;
        mainGrp.alignment = ["fill", "fill"];
        
        // Painel esquerdo
        var leftPanel = mainGrp.add("panel", undefined, "TEMPLATES");
        leftPanel.orientation = "column";
        leftPanel.alignment = ["left", "fill"];
        leftPanel.preferredSize.width = 350;
        leftPanel.margins = 10;
        
        // Painel direito
        var rightPanel = mainGrp.add("panel", undefined, "PREVIEW & INFO");
        rightPanel.orientation = "column";
        rightPanel.alignment = ["fill", "fill"];
        rightPanel.margins = 10;
        
        initialStatusWin.update("Configurando controles...", 40, 100);
        
        // Produção
        var prodHeaderGrp = leftPanel.add("group");
        var prodLab = prodHeaderGrp.add("statictext", undefined, "PRODUÇÃO:");
        setFgColor(prodLab, normalColor1);
        
        var prodGrp = leftPanel.add("group");
        prodGrp.spacing = 4;
        prodGrp.alignment = "fill";
        
        var prodDropItems = ["JORNAIS", "PROMO", "PROGRAMAS", "EVENTOS", "MARKETING", "BASE TEMÁTICA", "ILUSTRAÇÕES"];
        
        var validProductions = [
            { name: "JORNAIS", key: "jornais", paths: [] },
            { name: "PROMO", key: "promo", paths: [] },
            { name: "PROGRAMAS", key: "programas", paths: [] },
            { name: "EVENTOS", key: "eventos", paths: [] },
            { name: "MARKETING", key: "marketing", paths: [] },
            { name: "BASE TEMÁTICA", key: "basetematica", paths: [] },
            { name: "ILUSTRAÇÕES", key: "ilustracoes", paths: [] }
        ];
        
        // Carrega dados de produção
        if (typeof D9T_prodArray !== "undefined" && D9T_prodArray && D9T_prodArray.length > 0) {
            var prodData = D9T_prodArray[0];
            for (var i = 0; i < validProductions.length; i++) {
                var prod = validProductions[i];
                if (prod.key === "jornais" && prodData.pecasGraficas) {
                    prod.paths = prodData.pecasGraficas || [];
                } else if (prodData[prod.key]) {
                    prod.paths = prodData[prod.key] || [];
                }
            }
        }
        
        var prodDrop = prodGrp.add("dropdownlist", undefined, prodDropItems);
        prodDrop.selection = 0;
        prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
        
        // Busca
        var searchGrp = leftPanel.add("group");
        searchGrp.orientation = "column";
        searchGrp.spacing = 4;
        searchGrp.alignment = "fill";
        
        var searchHeaderGrp = searchGrp.add("group");
        searchHeaderGrp.orientation = "row";
        searchHeaderGrp.alignment = "fill";
        
        var templateLab = searchHeaderGrp.add("statictext", undefined, "BUSCA:");
        setFgColor(templateLab, normalColor1);
        
        var searchOptionsGrp = searchHeaderGrp.add("group");
        searchOptionsGrp.orientation = "row";
        searchOptionsGrp.alignment = ["right", "center"];
        searchOptionsGrp.spacing = 8;
        
        var itemCounterLab = searchOptionsGrp.add("statictext", undefined, "");
        setFgColor(itemCounterLab, monoColor1);
        
        var flatViewCheckbox = searchOptionsGrp.add("checkbox", undefined, "Lista");
        setFgColor(flatViewCheckbox, normalColor1);
        flatViewCheckbox.value = true;
        
        var placeholderText = "⌕ Digite para Buscar...";
        var searchBox = searchGrp.add("edittext", [0, 0, 300, 24], "");
        searchBox.text = placeholderText;
        searchBox.isPlaceholderActive = true;
        setFgColor(searchBox, monoColor0);
        
        // TreeView
        var treeContainer = searchGrp.add("group");
        treeContainer.orientation = "stack";
        treeContainer.alignment = ["fill", "fill"];
        treeContainer.preferredSize.height = 350;
        
        var templateTree = treeContainer.add("treeview", [0, 0, 300, 350]);
        setFgColor(templateTree, monoColor1);
        
        var loadingGrp = treeContainer.add("group");
        loadingGrp.alignChildren = ["center", "center"];
        loadingGrp.add("statictext", undefined, "Carregando...");
        loadingGrp.visible = false;
        
        // Botões
        var buttonGrp = leftPanel.add("group");
        buttonGrp.orientation = "row";
        buttonGrp.alignment = "fill";
        buttonGrp.spacing = 8;
        
        var refreshBtn = buttonGrp.add("button", undefined, "Atualizar");
        var openFldBtn = buttonGrp.add("button", undefined, "Pasta");
        
        // Preview
        var previewHeaderGrp = rightPanel.add("group");
        var previewLab = previewHeaderGrp.add("statictext", undefined, "PREVIEW:");
        setFgColor(previewLab, normalColor1);
        
        var previewImg = rightPanel.add("image", [0, 0, 400, 225]);
        previewImg.alignment = ["center", "top"];
        
        // Info da arte
        var infoPanel = rightPanel.add("panel", undefined, "INFORMAÇÕES DA ARTE");
        infoPanel.orientation = "column";
        infoPanel.alignment = ["fill", "top"];
        infoPanel.margins = 10;
        
        var codigoGrp = infoPanel.add("group");
        codigoGrp.orientation = "row";
        codigoGrp.spacing = 8;
        
        var codigoLab = codigoGrp.add("statictext", undefined, "Código:");
        codigoLab.preferredSize.width = 60;
        setFgColor(codigoLab, monoColor0);
        
        var codigoTxt = codigoGrp.add("edittext", [0, 0, 120, 24], "");
        
        var infoRows = [
            { label: "Nome:", value: "---" },
            { label: "Servidor:", value: "---" },
            { label: "Atualização:", value: "---" },
            { label: "Versão:", value: "---" }
        ];
        
        var infoValues = [];
        for (var r = 0; r < infoRows.length; r++) {
            var infoRow = infoPanel.add("group");
            infoRow.orientation = "row";
            infoRow.spacing = 8;
            
            var label = infoRow.add("statictext", undefined, infoRows[r].label);
            label.preferredSize.width = 80;
            setFgColor(label, monoColor0);
            
            var value = infoRow.add("statictext", undefined, infoRows[r].value);
            value.preferredSize.width = 200;
            setFgColor(value, normalColor2);
            infoValues.push(value);
        }
        
        // Botões de ação
        var actionGrp = rightPanel.add("group");
        actionGrp.orientation = "row";
        actionGrp.alignment = ["right", "bottom"];
        actionGrp.spacing = 8;
        
        var openBtn = actionGrp.add("button", undefined, "Abrir");
        openBtn.preferredSize = [80, 32];
        var importBtn = actionGrp.add("button", undefined, "Importar");
        importBtn.preferredSize = [80, 32];
        
        initialStatusWin.update("Configurando funcionalidades...", 80, 100);
        
        // === FUNÇÕES ===
        
        function generateCodigoFromTemplate(templateName) {
            try {
                var name = templateName.replace(/\.[^\.]+$/, "").toUpperCase();
                var currentYear = new Date().getFullYear().toString();
                var cleanName = name.replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
                var words = cleanName.split(" ");
                var lettersOnly = cleanName.replace(/[^A-Z]/g, "");
                
                var codigo = "";
                if (words.length >= 3) {
                    codigo = lettersOnly.substring(0, 2) + words[1].charAt(0) + words[2].charAt(0) + currentYear;
                } else if (words.length === 2) {
                    codigo = lettersOnly.substring(0, 3) + words[1].charAt(0) + currentYear;
                } else {
                    codigo = lettersOnly.substring(0, 4) + currentYear;
                }
                
                return codigo.toUpperCase();
            } catch (e) {
                Logger.warn("Erro ao gerar código", { error: e.message });
                return "AUTO" + new Date().getFullYear();
            }
        }
        
        function determineServidorDestino(templateName, templatePath) {
            try {
                var name = templateName.toUpperCase();
                var path = templatePath ? templatePath.toUpperCase() : "";
                var fullText = name + " " + path;
                
                if (GLOBAL_CACHE.servidorCache[fullText]) {
                    return GLOBAL_CACHE.servidorCache[fullText];
                }
                
                var result = "PAM HARDNEWS";
                
                var ilhaTerms = ["PESQUISA", "DATAFOLHA", "QUAEST", "IPEC", "CREDITO", "INSERT", "ALPHA"];
                var vizTerms = ["CABECALHO", "QR CODE", "VIRTUAL", "TOTEM"];
                var magazineTerms = ["ESTUDIO I", "ESTÚDIO I", "STUDIO I", "STÚDIO I", "GLOBONEWS INTERNACIONAL", "BALAIO"];
                
                for (var i = 0; i < ilhaTerms.length; i++) {
                    if (fullText.indexOf(ilhaTerms[i]) !== -1) {
                        result = "PARA ILHA";
                        break;
                    }
                }
                
                if (result === "PAM HARDNEWS") {
                    for (var i = 0; i < vizTerms.length; i++) {
                        if (fullText.indexOf(vizTerms[i]) !== -1) {
                            result = "VIZ";
                            break;
                        }
                    }
                }
                
                if (result === "PAM HARDNEWS") {
                    for (var i = 0; i < magazineTerms.length; i++) {
                        if (fullText.indexOf(magazineTerms[i]) !== -1) {
                            result = "PAM MAGAZINE";
                            break;
                        }
                    }
                }
                
                GLOBAL_CACHE.servidorCache[fullText] = result;
                return result;
            } catch (e) {
                Logger.warn("Erro ao determinar servidor", { error: e.message });
                return "PAM HARDNEWS";
            }
        }
        
        var updateArteInfoTimer = null;
        
        function updateArteInfo() {
            if (updateArteInfoTimer) clearTimeout(updateArteInfoTimer);
            
            updateArteInfoTimer = setTimeout(function() {
                try {
                    var selectedTemplate = templateTree.selection;
                    if (selectedTemplate && selectedTemplate.type === "item" && selectedTemplate.filePath) {
                        var templateNameWithExt = selectedTemplate.text;
                        var nomeDaArte = templateNameWithExt.replace(/\.[^\.]+$/, "").toUpperCase();
                        
                        infoValues[0].text = nomeDaArte;
                        
                        var generatedCodigo = generateCodigoFromTemplate(templateNameWithExt);
                        codigoTxt.text = generatedCodigo;
                        
                        var templatePath = selectedTemplate.filePath;
                        var servidorDestino = determineServidorDestino(templateNameWithExt, templatePath);
                        infoValues[1].text = servidorDestino;
                        
                        if (selectedTemplate.modDate) {
                            var modDate = new Date(selectedTemplate.modDate);
                            var dateStr = ("0" + modDate.getDate()).slice(-2) + "/" + 
                                         ("0" + (modDate.getMonth() + 1)).slice(-2) + "/" + 
                                         modDate.getFullYear();
                            infoValues[2].text = dateStr;
                        }
                        
                        infoValues[3].text = "Adobe After Effects";
                        
                    } else {
                        codigoTxt.text = "";
                        for (var i = 0; i < infoValues.length; i++) {
                            infoValues[i].text = "---";
                        }
                    }
                } catch (e) {
                    Logger.error("Erro ao atualizar informações", { error: e.message });
                    for (var i = 0; i < infoValues.length; i++) {
                        infoValues[i].text = "Erro";
                    }
                }
            }, perfConfig.DEBOUNCE_TIME / 2);
        }
        
        function loadCacheInBackground(prodName) {
            try {
                var cacheKey = prodName + "_cache";
                var currentTime = new Date().getTime();
                
                if (templatesCache[prodName] && 
                    GLOBAL_CACHE.lastLoadTime[cacheKey] && 
                    (currentTime - GLOBAL_CACHE.lastLoadTime[cacheKey]) < perfConfig.CACHE_TIMEOUT) {
                    return templatesCache[prodName];
                }
                
                Logger.info("Carregando cache para " + prodName);
                
                var cacheFileName = getCacheFileName(prodName);
                var templatesCacheFile = new File(cacheFolder.fullName + "/" + cacheFileName);
                
                if (templatesCacheFile.exists) {
                    templatesCacheFile.open("r");
                    var cacheContent = templatesCacheFile.read();
                    templatesCacheFile.close();
                    
                    var masterCacheData = JSON.parse(cacheContent);
                    var combinedTreeData = [];
                    
                    for (var path in masterCacheData) {
                        if (masterCacheData.hasOwnProperty(path)) {
                            combinedTreeData = combinedTreeData.concat(masterCacheData[path]);
                        }
                    }
                    
                    templatesCache[prodName] = combinedTreeData;
                    GLOBAL_CACHE.lastLoadTime[cacheKey] = currentTime;
                    
                    Logger.info("Cache carregado", { production: prodName, items: combinedTreeData.length });
                } else {
                    templatesCache[prodName] = [];
                    Logger.warn("Cache não encontrado para " + prodName);
                }
                
                return templatesCache[prodName];
            } catch (e) {
                Logger.error("Erro ao carregar cache", { production: prodName, error: e.message });
                templatesCache[prodName] = [];
                return [];
            }
        }
        
        function getCacheFileName(prodName) {
            switch (prodName) {
                case "JORNAIS": return "templates_jornais_cache.json";
                case "PROMO": return "templates_promo_cache.json";
                case "PROGRAMAS": return "templates_programas_cache.json";
                case "EVENTOS": return "templates_eventos_cache.json";
                case "MARKETING": return "templates_marketing_cache.json";
                case "BASE TEMÁTICA": return "templates_base_cache.json";
                case "ILUSTRAÇÕES": return "templates_ilustra_cache.json";
                default: return "templates_" + prodName.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_cache.json";
            }
        }
        
        function populateTreeOptimized(treeNode, dataArray, isFlat) {
            try {
                if (!dataArray || dataArray.length === 0) {
                    treeNode.add("item", "Nenhum item encontrado.");
                    updateItemCounter();
                    return;
                }
                
                treeNode.removeAll();
                treeNode.visible = false;
                
                var items = isFlat ? flattenDataOptimized(dataArray) : dataArray;
                var chunkSize = perfConfig.CHUNK_SIZE;
                var currentIndex = 0;
                
                function processChunk() {
                    var endIndex = Math.min(currentIndex + chunkSize, items.length);
                    
                    for (var i = currentIndex; i < endIndex; i++) {
                        var itemData = items[i];
                        
                        if (isFlat || itemData.type === "item") {
                            var item = treeNode.add("item", itemData.text);
                            item.filePath = itemData.filePath;
                            item.modDate = itemData.modDate;
                            item.size = itemData.size;
                        } else if (itemData.type === "node") {
                            var node = treeNode.add("node", itemData.text);
                            if (itemData.children && itemData.children.length > 0) {
                                populateNodeRecursive(node, itemData.children);
                            }
                        }
                    }
                    
                    currentIndex = endIndex;
                    
                    if (currentIndex < items.length) {
                        $.sleep(1);
                        processChunk();
                    } else {
                        finishPopulation();
                    }
                }
                
                function populateNodeRecursive(node, children) {
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (child.type === "item") {
                            var item = node.add("item", child.text);
                            item.filePath = child.filePath;
                            item.modDate = child.modDate;
                            item.size = child.size;
                        } else if (child.type === "node") {
                            var subNode = node.add("node", child.text);
                            if (child.children && child.children.length > 0) {
                                populateNodeRecursive(subNode, child.children);
                            }
                        }
                    }
                }
                
                function finishPopulation() {
                    if (!isFlat) {
                        expandAllNodes(treeNode);
                    }
                    treeNode.visible = true;
                    updateItemCounter();
                    Logger.info("Árvore populada", { items: items.length });
                }
                
                processChunk();
                
            } catch (e) {
                Logger.error("Erro ao popular árvore", { error: e.message });
                treeNode.visible = true;
                treeNode.add("item", "Erro ao carregar dados.");
                updateItemCounter();
            }
        }
        
        function loadTemplatesFromCache() {
            var prodName = validProductions[prodDrop.selection.index].name;
            
            setLoadingState(true, "Carregando " + prodName + "...");
            
            try {
                if (!templatesCache[prodName]) {
                    loadCacheInBackground(prodName);
                }
                
                var data = templatesCache[prodName] || [];
                
                if (data.length > 0) {
                    populateTreeOptimized(templateTree, data, flatViewCheckbox.value);
                } else {
                    templateTree.removeAll();
                    templateTree.add("item", 'Nenhum template encontrado para "' + prodName + '".');
                    updateItemCounter();
                }
            } catch (e) {
                Logger.error("Erro ao carregar templates", { error: e.message });
                templateTree.removeAll();
                templateTree.add("item", "Erro ao carregar templates.");
                updateItemCounter();
            } finally {
                setLoadingState(false);
            }
        }
        
        function updateItemCounter() {
            try {
                var count = 0;
                
                function countItems(node) {
                    var total = 0;
                    if (!node.items) return 0;
                    
                    for (var i = 0; i < node.items.length; i++) {
                        var item = node.items[i];
                        if (item.type === "item") {
                            total++;
                        } else if (item.type === "node") {
                            total += countItems(item);
                        }
                    }
                    return total;
                }
                
                count = countItems(templateTree);
                itemCounterLab.text = count + (count === 1 ? " item" : " itens");
            } catch (e) {
                Logger.warn("Erro ao contar itens", { error: e.message });
                itemCounterLab.text = "? itens";
            }
        }
        
        function setLoadingState(isLoading, message) {
            try {
                if (isLoading) {
                    loadingGrp.children[0].text = message || "Carregando...";
                    loadingGrp.visible = true;
                    templateTree.visible = false;
                    searchBox.enabled = false;
                    prodDrop.enabled = false;
                    flatViewCheckbox.enabled = false;
                } else {
                    loadingGrp.visible = false;
                    templateTree.visible = true;
                    searchBox.enabled = true;
                    prodDrop.enabled = true;
                    flatViewCheckbox.enabled = true;
                }
            } catch (e) {
                Logger.warn("Erro ao definir estado de carregamento", { error: e.message });
            }
        }
        
        function expandAllNodes(tree) {
            if (!tree || !tree.items) return;
            
            try {
                tree.visible = false;
                
                function expandRecursive(node) {
                    for (var i = 0; i < node.items.length; i++) {
                        var item = node.items[i];
                        if (item.type === "node") {
                            item.expanded = true;
                            if (item.items && item.items.length > 0) {
                                expandRecursive(item);
                            }
                        }
                    }
                }
                expandRecursive(tree);
            } catch (e) {
                Logger.warn("Erro ao expandir nós", { error: e.message });
            } finally {
                tree.visible = true;
            }
        }
        
        var searchTimer = null;
        
        function performSearch(searchTerm) {
            if (searchTimer) clearTimeout(searchTimer);
            
            searchTimer = setTimeout(function() {
                try {
                    var prodName = validProductions[prodDrop.selection.index].name;
                    var masterData = templatesCache[prodName];
                    
                    if (!masterData) {
                        Logger.warn("Dados não encontrados para busca", { production: prodName });
                        return;
                    }
                    
                    setLoadingState(true, "Buscando...");
                    
                    var filteredData;
                    if (searchTerm === "") {
                        filteredData = masterData;
                    } else {
                        filteredData = performLinearSearch(masterData, searchTerm);
                    }
                    
                    populateTreeOptimized(templateTree, filteredData, flatViewCheckbox.value);
                    setLoadingState(false);
                    
                } catch (e) {
                    Logger.error("Erro na busca", { error: e.message });
                    setLoadingState(false);
                }
            }, perfConfig.DEBOUNCE_TIME);
        }
        
        function performLinearSearch(data, searchTerm) {
            try {
                var cleanSearchTerm = searchTerm.toUpperCase();
                if (typeof String.prototype.replaceSpecialCharacters === "function") {
                    cleanSearchTerm = cleanSearchTerm.replaceSpecialCharacters();
                }
                
                var filteredList = [];
                var stack = [];
                
                for (var i = data.length - 1; i >= 0; i--) {
                    stack.push(data[i]);
                }
                
                while (stack.length > 0) {
                    var item = stack.pop();
                    
                    if (item.type === "item") {
                        var itemText = item.text.toUpperCase();
                        if (typeof String.prototype.replaceSpecialCharacters === "function") {
                            itemText = itemText.replaceSpecialCharacters();
                        }
                        
                        if (itemText.indexOf(cleanSearchTerm) !== -1) {
                            filteredList.push(item);
                        }
                    } else if (item.type === "node") {
                        var nodeText = item.text.toUpperCase();
                        if (typeof String.prototype.replaceSpecialCharacters === "function") {
                            nodeText = nodeText.replaceSpecialCharacters();
                        }
                        
                        if (item.children) {
                            for (var j = item.children.length - 1; j >= 0; j--) {
                                stack.push(item.children[j]);
                            }
                        }
                        
                        if (nodeText.indexOf(cleanSearchTerm) !== -1) {
                            var nodeCopy = JSON.parse(JSON.stringify(item));
                            filteredList.push(nodeCopy);
                        }
                    }
                }
                
                return filteredList;
            } catch (e) {
                Logger.error("Erro na busca linear", { error: e.message });
                return [];
            }
        }
        
        function updatePreview(templateFile) {
            try {
                if (!templateFile || !templateFile.exists) {
                    if (typeof no_preview !== "undefined") {
                        previewImg.image = no_preview;
                    }
                    return;
                }
                
                var cacheKey = templateFile.fsName + "_preview";
                if (previewCache[cacheKey]) {
                    previewImg.image = previewCache[cacheKey];
                    return;
                }
                
                var previewBaseName = templateFile.displayName.replace(/\.[^\.]+$/, "");
                
                var previewPaths = [
                    templateFile.path + "/" + previewBaseName + "_preview.png",
                    templateFile.path + "/_PREVIEWS/" + previewBaseName + "_preview.png",
                    templateFile.path + "/_PREVIEWS/" + previewBaseName + ".png",
                    templateFile.path + "/_PREVIEWS/" + previewBaseName + ".jpg"
                ];
                
                var foundPreview = false;
                for (var i = 0; i < previewPaths.length; i++) {
                    var previewFile = new File(previewPaths[i]);
                    if (previewFile.exists) {
                        previewImg.image = previewFile;
                        previewCache[cacheKey] = previewFile;
                        foundPreview = true;
                        break;
                    }
                }
                
                if (!foundPreview && typeof no_preview !== "undefined") {
                    previewImg.image = no_preview;
                    previewCache[cacheKey] = no_preview;
                }
                
            } catch (e) {
                Logger.warn("Erro ao atualizar preview", { error: e.message });
                if (typeof no_preview !== "undefined") {
                    previewImg.image = no_preview;
                }
            }
        }
        
        initialStatusWin.update("Configurando eventos...", 90, 100);
        
        // === EVENTOS ===
        
        setBgColor(D9T_TEMPLATES_w, bgColor1);
        
        prodDrop.onChange = function() {
            try {
                var i = this.selection.index;
                Logger.info("Produção alterada", { index: i, name: validProductions[i].name });
                
                // Salva a seleção
                if (userConfigFile) {
                    var userConfig = {};
                    if (userConfigFile.exists) {
                        userConfigFile.open("r");
                        var configContent = userConfigFile.read();
                        userConfigFile.close();
                        if (configContent) {
                            userConfig = JSON.parse(configContent);
                        }
                    }
                    if (!userConfig.gnews_templates) {
                        userConfig.gnews_templates = {};
                    }
                    userConfig.gnews_templates.lastProductionIndex = i;
                    userConfigFile.open("w");
                    userConfigFile.write(JSON.stringify(userConfig, null, "\t"));
                    userConfigFile.close();
                }
                
                loadTemplatesFromCache();
            } catch (e) {
                Logger.error("Erro na mudança de produção", { error: e.message });
            }
        };
        
        flatViewCheckbox.onClick = function() {
            try {
                Logger.debug("Modo de visualização alterado", { flatView: this.value });
                performSearch(searchBox.isPlaceholderActive ? "" : searchBox.text);
            } catch (e) {
                Logger.error("Erro ao alterar visualização", { error: e.message });
            }
        };
        
        searchBox.onActivate = function() {
            try {
                if (this.isPlaceholderActive) {
                    this.text = "";
                    this.isPlaceholderActive = false;
                    setFgColor(this, normalColor1);
                }
            } catch (e) {
                Logger.warn("Erro no foco da busca", { error: e.message });
            }
        };
        
        searchBox.onDeactivate = function() {
            try {
                if (this.text === "") {
                    this.text = placeholderText;
                    this.isPlaceholderActive = true;
                    setFgColor(this, monoColor0);
                    performSearch("");
                }
            } catch (e) {
                Logger.warn("Erro ao desfocar busca", { error: e.message });
            }
        };
        
        searchBox.onChanging = function() {
            try {
                if (!this.isPlaceholderActive) {
                    performSearch(this.text);
                }
            } catch (e) {
                Logger.warn("Erro durante digitação", { error: e.message });
            }
        };
        
        templateTree.onChange = function() {
            try {
                if (this.selection != null && this.selection.type == "node") {
                    this.selection = null;
                    return;
                }
                
                updateArteInfo();
                
                if (this.selection == null || !this.selection.filePath) {
                    openBtn.enabled = false;
                    importBtn.enabled = false;
                    return;
                }
                
                projectFile = new File(this.selection.filePath);
                
                if (this.selection.modDate && this.selection.size) {
                    var fileSize = (this.selection.size / (1024 * 1024)).toFixed(2) + " MB";
                    var modDate = new Date(this.selection.modDate);
                    var formattedDate = ("0" + modDate.getDate()).slice(-2) + "/" + 
                                       ("0" + (modDate.getMonth() + 1)).slice(-2) + "/" + 
                                       modDate.getFullYear();
                    this.selection.helpTip = "Arquivo: " + this.selection.text + 
                                            "\nTamanho: " + fileSize + 
                                            "\nModificado: " + formattedDate;
                }
                
                updatePreview(projectFile);
                
                openBtn.enabled = true;
                importBtn.enabled = true;
            } catch (e) {
                Logger.warn("Erro na seleção da árvore", { error: e.message });
            }
        };
        
        var codigoTimer = null;
        codigoTxt.onChanging = function() {
            try {
                if (codigoTimer) clearTimeout(codigoTimer);
                
                codigoTimer = setTimeout(function() {
                    var codigo = codigoTxt.text.trim().toUpperCase();
                    if (codigo.length >= 3) {
                        var arteInfo = getArteData(codigo);
                        if (arteInfo) {
                            infoValues[0].text = arteInfo.nome || "";
                            infoValues[1].text = arteInfo.servidor || "";
                            infoValues[2].text = arteInfo.ultima_atualizacao || "";
                            infoValues[3].text = "";
                        } else {
                            infoValues[0].text = "---";
                            infoValues[1].text = "---";
                            infoValues[2].text = "---";
                            infoValues[3].text = "---";
                        }
                    }
                }, 200);
            } catch (e) {
                Logger.warn("Erro na mudança do código", { error: e.message });
            }
        };
        
        templateTree.onDoubleClick = function() {
            try {
                if (this.selection != null && this.selection.filePath) {
                    Logger.info("Duplo clique - importando", { file: this.selection.text });
                    executeImport();
                }
            } catch (e) {
                Logger.error("Erro no duplo clique", { error: e.message });
            }
        };
        
        D9T_TEMPLATES_w.onShow = function() {
            try {
                Logger.info("Janela exibida");
                
                if (userConfigFile && userConfigFile.exists) {
                    userConfigFile.open("r");
                    var configContent = userConfigFile.read();
                    userConfigFile.close();
                    if (configContent && configContent.trim() !== "") {
                        var centralConfig = JSON.parse(configContent);
                        if (centralConfig.gnews_templates && 
                            typeof centralConfig.gnews_templates.lastProductionIndex !== "undefined") {
                            var lastIndex = parseInt(centralConfig.gnews_templates.lastProductionIndex);
                            if (!isNaN(lastIndex) && lastIndex >= 0 && lastIndex < prodDrop.items.length) {
                                prodDrop.selection = lastIndex;
                            }
                        }
                    }
                }
                
                // Pré-carrega todos os caches
                for (var i = 0; i < validProductions.length; i++) {
                    loadCacheInBackground(validProductions[i].name);
                }
                
                loadTemplatesFromCache();
                searchBox.active = true;
                updateArteInfo();
                
                D9T_TEMPLATES_w.layout.layout(true);
            } catch (e) {
                Logger.error("Erro no show da janela", { error: e.message });
            }
        };
        
        D9T_TEMPLATES_w.onClose = function() {
            try {
                Logger.info("Janela fechada");
                
                if (updateArteInfoTimer) clearTimeout(updateArteInfoTimer);
                if (searchTimer) clearTimeout(searchTimer);
                if (codigoTimer) clearTimeout(codigoTimer);
                
                GLOBAL_CACHE.isLoading = false;
            } catch (e) {
                Logger.warn("Erro ao fechar janela", { error: e.message });
            }
        };
        
        // === FUNÇÕES DE AÇÃO ===
        
        function handleRefresh() {
            try {
                Logger.info("Iniciando refresh");
                
                GLOBAL_CACHE.templatesData = {};
                GLOBAL_CACHE.previewCache = {};
                GLOBAL_CACHE.lastLoadTime = {};
                GLOBAL_CACHE.arteSearchCache = {};
                GLOBAL_CACHE.servidorCache = {};
                colorCache = {};
                
                setLoadingState(true, "Recarregando...");
                
                for (var i = 0; i < validProductions.length; i++) {
                    loadCacheInBackground(validProductions[i].name);
                }
                
                loadTemplatesFromCache();
            } catch (e) {
                Logger.error("Erro durante refresh", { error: e.message });
                alert("Erro ao recarregar: " + e.message);
            }
        }
        
        function openTemplatesFolder() {
            try {
                if (!prodDrop.selection) {
                    alert("Nenhuma produção selecionada.");
                    return;
                }
                
                var selectedProduction = validProductions[prodDrop.selection.index];
                var availablePaths = selectedProduction.paths;
                
                if (!availablePaths || availablePaths.length === 0) {
                    alert("Nenhum caminho configurado para '" + selectedProduction.name + "'.");
                    return;
                }
                
                function openPath(pathString) {
                    var folderToShow = new Folder(pathString);
                    if (!folderToShow.exists) {
                        alert("Pasta não encontrada: " + folderToShow.fsName);
                        return;
                    }
                    folderToShow.execute();
                    Logger.info("Pasta aberta", { path: pathString });
                }
                
                if (availablePaths.length === 1) {
                    openPath(availablePaths[0]);
                } else {
                    var pathWin = new Window("dialog", "Selecionar Pasta");
                    pathWin.add("statictext", undefined, "Escolha um caminho:");
                    var list = pathWin.add("listbox", undefined, availablePaths);
                    list.selection = 0;
                    var btnGrp = pathWin.add("group");
                    btnGrp.add("button", undefined, "Cancelar", { name: "cancel" });
                    var okBtn = btnGrp.add("button", undefined, "Abrir", { name: "ok" });
                    okBtn.onClick = function() {
                        if (list.selection) {
                            openPath(list.selection.text);
                            pathWin.close();
                        }
                    };
                    pathWin.show();
                }
            } catch (e) {
                Logger.error("Erro ao abrir pasta", { error: e.message });
                alert("Erro ao abrir pasta: " + e.message);
            }
        }
        
        function executeOpen() {
            try {
                if (templateTree.selection && templateTree.selection.filePath) {
                    var fileToOpen = new File(templateTree.selection.filePath);
                    if (!fileToOpen.exists) {
                        alert("Arquivo não encontrado.");
                        return;
                    }
                    
                    D9T_TEMPLATES_w.close();
                    app.open(fileToOpen);
                    Logger.info("Arquivo aberto", { file: templateTree.selection.text });
                }
            } catch (e) {
                Logger.error("Erro ao abrir arquivo", { error: e.message });
                alert("Erro ao abrir arquivo: " + e.message);
            }
        }
        
        function executeImport() {
            try {
                if (!templateTree.selection || !templateTree.selection.filePath) {
                    alert("Selecione um template.");
                    return;
                }
                
                var fileToImport = new File(templateTree.selection.filePath);
                if (!fileToImport.exists) {
                    alert("Arquivo não encontrado.");
                    return;
                }
                
                app.project.bitsPerChannel = 8;
                app.project.expressionEngine = "javascript-1.0";
                app.project.linearBlending = true;
                app.project.timeDisplayType = TimeDisplayType.TIMECODE;
                
                var importOptions = new ImportOptions(fileToImport);
                app.project.importFile(importOptions);
                
                var templateName = fileToImport.name.replace(/\.[^\.]+$/, "");
                logGNewsImport(templateName);
                
                D9T_TEMPLATES_w.close();
                Logger.info("Template importado", { file: templateTree.selection.text });
            } catch (e) {
                Logger.error("Erro ao importar", { error: e.message });
                alert("Erro ao importar: " + e.message);
            }
        }
        
        function logGNewsImport(templateName) {
            try {
                var logPath = validProductions[prodDrop.selection.index].paths[0] || 
                             (scriptMainPath + "source/logs");
                var logFile = new File(logPath + "/log padeiro.csv");
                
                var dt = new Date();
                var dateStr = ("0" + dt.getDate()).slice(-2) + "/" + 
                             ("0" + (dt.getMonth() + 1)).slice(-2) + "/" + 
                             dt.getFullYear();
                var timeStr = ("0" + dt.getHours()).slice(-2) + ":" + 
                             ("0" + dt.getMinutes()).slice(-2);
                
                var logData = [
                    templateName, "1", system.userName, dateStr, timeStr,
                    codigoTxt.text.trim().toUpperCase(),
                    infoValues[0].text, infoValues[1].text
                ].join(",");
                
                if (!logFile.exists) {
                    logFile.open("w");
                    logFile.writeln("Template,Quantidade,Designer,Data,Hora,Codigo_Arte,Nome_Arte,Servidor_Destino");
                    logFile.close();
                }
                
                logFile.open("a");
                logFile.writeln(logData);
                logFile.close();
                
                Logger.info("Log salvo", { template: templateName });
            } catch (e) {
                Logger.warn("Erro ao salvar log", { error: e.message });
            }
        }
        
        // === CONFIGURAÇÃO DOS BOTÕES ===
        
        refreshBtn.onClick = handleRefresh;
        openFldBtn.onClick = openTemplatesFolder;
        openBtn.onClick = executeOpen;
        importBtn.onClick = executeImport;
        
        infoBtn.onClick = function() {
            try {
                if (typeof showTemplatesHelp === "function") {
                    showTemplatesHelp();
                } else {
                    alert("Sistema de ajuda não disponível.");
                }
            } catch (e) {
                Logger.warn("Erro ao abrir ajuda", { error: e.message });
                alert("Erro ao abrir ajuda.");
            }
        };
        
        initialStatusWin.update("Finalizando...", 100, 100);
        initialStatusWin.close();
        
        Logger.info("Inicialização concluída");
        
        // === FINALIZAÇÃO ===
        D9T_TEMPLATES_w.center();
        D9T_TEMPLATES_w.show();
        
    } catch (e) {
        Logger.error("Erro crítico", { error: e.message, line: e.line });
        if (initialStatusWin) initialStatusWin.close();
        
        if (!ErrorRecovery.isFallbackMode()) {
            ErrorRecovery.enableFallbackMode();
            alert("Erro durante inicialização:\n\n" + e.message);
            
            try {
                var simpleWin = new Window("dialog", "GNEWS Templates - Modo Simples");
                simpleWin.add("statictext", undefined, "Erro no modo avançado.");
                var reopenBtn = simpleWin.add("button", undefined, "Tentar Novamente");
                reopenBtn.onClick = function() {
                    simpleWin.close();
                    ErrorRecovery.fallbackMode = false;
                    d9TemplateDialog();
                };
                var closeBtn = simpleWin.add("button", undefined, "Fechar");
                closeBtn.onClick = function() { simpleWin.close(); };
                simpleWin.show();
            } catch (fallbackError) {
                alert("Erro crítico: " + e.message + "\nFallback: " + fallbackError.message);
            }
        } else {
            alert("Erro persistente: " + e.message);
        }
    } finally {
        GLOBAL_CACHE.isLoading = false;
    }
}

// === CONFIGURAÇÃO OTIMIZADA (ConfigWin) ===
function d9ProdFoldersDialog(prodArray) {
    Logger.init();
    Logger.info("Iniciando configuração de caminhos");
    
    var scriptName = 'CONFIGURAÇÃO DE CAMINHOS';
    var cacheFolder = new Folder(scriptMainPath + 'source/cache');
    if (!cacheFolder.exists) cacheFolder.create();
    
    var fileFilter = ['.aep', '.aet'];
    
    var categorias = [
        { nome: 'JORNAIS', key: 'jornais', caminhos: [] },
        { nome: 'PROMO', key: 'promo', caminhos: [] },
        { nome: 'PROGRAMAS', key: 'programas', caminhos: [] },
        { nome: 'EVENTOS', key: 'eventos', caminhos: [] },
        { nome: 'MARKETING', key: 'marketing', caminhos: [] },
        { nome: 'BASE TEMÁTICA', key: 'basetematica', caminhos: [] },
        { nome: 'ILUSTRAÇÕES', key: 'ilustracoes', caminhos: [] }
    ];
    
    // Carrega dados existentes
    try {
        if (prodArray && prodArray.length > 0 && prodArray[0]) {
            var prodData = prodArray[0];
            for (var i = 0; i < categorias.length; i++) {
                var cat = categorias[i];
                if (cat.key === 'jornais' && prodData.pecasGraficas) {
                     cat.caminhos = prodData.pecasGraficas || [Folder.desktop.fullName];
                } else if (prodData[cat.key] && prodData[cat.key].length > 0) {
                    cat.caminhos = prodData[cat.key];
                } else {
                    cat.caminhos = [Folder.desktop.fullName];
                }
            }
        } else {
            throw new Error("Dados de produção inválidos");
        }
    } catch (e) {
        Logger.warn("Usando caminhos padrão", { error: e.message });
        var desktopPath = Folder.desktop.fullName;
        for (var j = 0; j < categorias.length; j++) {
            categorias[j].caminhos = [desktopPath];
        }
    }
    
    var D9T_CONFIG_w = new Window('dialog', scriptName + ' v4.0');
    D9T_CONFIG_w.orientation = 'column';
    D9T_CONFIG_w.alignChildren = ['center', 'top'];
    D9T_CONFIG_w.spacing = 12;
    D9T_CONFIG_w.margins = 16;
    D9T_CONFIG_w.preferredSize = [600, 500];
    
    var headerGrp = D9T_CONFIG_w.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'row';
    
    var listLabTxt = headerGrp.add('statictext', undefined, 'CONFIGURAÇÃO DE CAMINHOS:');
    try { 
        var color = [0.8, 0.8, 0.8];
        var pType = listLabTxt.graphics.PenType.SOLID_COLOR;
        listLabTxt.graphics.foregroundColor = listLabTxt.graphics.newPen(pType, color, 1);
    } catch (e) {}
    
    var mainGrp = D9T_CONFIG_w.add('group', undefined);
    mainGrp.orientation = 'column';
    mainGrp.spacing = 16;
    mainGrp.alignment = 'fill';
    
    var pathLabsToCheck = [];
    
    function checkPathValidity(pathStr) {
        try {
            var folder = new Folder(pathStr);
            return folder.exists;
        } catch (e) {
            return false;
        }
    }
    
    function addPathLine(parentGrp, pathTxt, categoryName) {
        var pathLineGrp = parentGrp.add('group', undefined);
        pathLineGrp.orientation = 'row';
        pathLineGrp.alignChildren = ['left', 'center'];
        pathLineGrp.spacing = 4;
        
        var openBtn = pathLineGrp.add('button', undefined, '📁');
        openBtn.preferredSize = [24, 24];
        openBtn.helpTip = 'selecionar pasta';
        
        var pathLab = pathLineGrp.add('statictext', undefined, pathTxt, { pathValue: pathTxt, truncate: 'middle' });
        pathLab.helpTip = 'caminho da pasta:\n\n' + pathTxt;
        pathLab.preferredSize = [350, 24];
        try {
            var color = [1, 1, 1];
            var pType = pathLab.graphics.PenType.SOLID_COLOR;
            pathLab.graphics.foregroundColor = pathLab.graphics.newPen(pType, color, 1);
        } catch (e) {}
        pathLabsToCheck.push(pathLab);
        
        var upBtn = pathLineGrp.add('button', undefined, '▲');
        upBtn.preferredSize = [24, 24];
        upBtn.helpTip = "Mover para cima";
        
        var downBtn = pathLineGrp.add('button', undefined, '▼');
        downBtn.preferredSize = [24, 24];
        downBtn.helpTip = "Mover para baixo";
        
        var testBtn = pathLineGrp.add('button', undefined, '✓');
        testBtn.preferredSize = [24, 24];
        testBtn.helpTip = "Testar caminho";
        
        var cacheBtn = pathLineGrp.add('button', undefined, '⚡');
        cacheBtn.preferredSize = [24, 24];
        cacheBtn.helpTip = "Gerar Cache";
        
        var deletePathBtn = pathLineGrp.add('button', undefined, 'X');
        deletePathBtn.preferredSize = [24, 24];
        deletePathBtn.helpTip = 'deletar caminho';
        
        // Eventos
        openBtn.onClick = function () {
            try {
                var newFolder = Folder.selectDialog('selecione a pasta');
                if (newFolder) {
                    pathLab.properties.pathValue = newFolder.fullName;
                    pathLab.text = newFolder.fullName;
                    pathLab.helpTip = newFolder.fullName;
                    var redColor = [1, 0, 0];
                    var pType = pathLab.graphics.PenType.SOLID_COLOR;
                    pathLab.graphics.foregroundColor = pathLab.graphics.newPen(pType, redColor, 1);
                }
            } catch (e) {
                Logger.error("Erro ao selecionar pasta", { error: e.message });
            }
        };
        
        upBtn.onClick = function() {
            try {
                movePath(pathLineGrp, 'up');
            } catch (e) {
                Logger.error("Erro ao mover para cima", { error: e.message });
            }
        };
        
        downBtn.onClick = function() {
            try {
                movePath(pathLineGrp, 'down');
            } catch (e) {
                Logger.error("Erro ao mover para baixo", { error: e.message });
            }
        };
        
        testBtn.onClick = function() {
            try {
                var isValid = checkPathValidity(pathLab.properties.pathValue);
                var color = isValid ? [1, 1, 1] : [1, 0, 0];
                var pType = pathLab.graphics.PenType.SOLID_COLOR;
                pathLab.graphics.foregroundColor = pathLab.graphics.newPen(pType, color, 1);
                alert(isValid ? "Caminho válido e acessível." : "Caminho inválido ou inacessível.");
            } catch (e) {
                Logger.error("Erro ao testar caminho", { error: e.message });
            }
        };
        
        cacheBtn.onClick = function() {
            try {
                generateCacheForPath(pathLab.properties.pathValue, categoryName, pathLab);
            } catch (e) {
                Logger.error("Erro ao gerar cache", { error: e.message });
            }
        };
        
        deletePathBtn.onClick = function () {
            try {
                if (parentGrp.children.length > 1) {
                    parentGrp.remove(pathLineGrp);
                    D9T_CONFIG_w.layout.layout(true);
                } else {
                    alert('Cada categoria deve ter pelo menos um caminho.');
                }
            } catch (e) {
                Logger.error("Erro ao deletar caminho", { error: e.message });
            }
        };
    }
    
    function movePath(pathLineGrp, direction) {
        try {
            var parent = pathLineGrp.parent;
            var children = [];
            for (var i = 0; i < parent.children.length; i++) {
                children.push(parent.children[i]);
            }
            
            var index = -1;
            for (var j = 0; j < children.length; j++) {
                if (children[j] === pathLineGrp) {
                    index = j;
                    break;
                }
            }
            
            if (index === -1) return;
            
            if (direction === 'up' && index > 0) {
                var temp = children[index];
                children[index] = children[index - 1];
                children[index - 1] = temp;
            } else if (direction === 'down' && index < children.length - 1) {
                var temp = children[index];
                children[index] = children[index + 1];
                children[index + 1] = temp;
            } else {
                return;
            }
            
            while (parent.children.length > 0) {
                parent.remove(parent.children[0]);
            }
            
            for (var k = 0; k < children.length; k++) {
                parent.add(children[k]);
            }
            
            parent.layout.layout(true);
        } catch (e) {
            Logger.error("Erro ao mover path", { error: e.message });
        }
    }
    
    function generateCacheForPath(pathStr, categoryName, pathLabel) {
        try {
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                var redColor = [1, 0, 0];
                var pType = pathLabel.graphics.PenType.SOLID_COLOR;
                pathLabel.graphics.foregroundColor = pathLabel.graphics.newPen(pType, redColor, 1);
                alert("Falha! O caminho não existe ou está inacessível.");
                return;
            }
            
            var statusWin = createStatusWindow("Gerando Cache...");
            statusWin.show();
            statusWin.update("Iniciando escaneamento...");
            
            var progress = { count: 0, win: statusWin };
            var treeData = getFolderStructureAsData(folder, fileFilter, categoryName, progress);
            var newCount = progress.count;
            
            statusWin.update("Salvando arquivo de cache...", newCount);
            
            var cacheFileName = getCacheFileNameForCategory(categoryName);
            var cacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);
            
            var masterCacheData = {};
            if (cacheFile.exists) {
                try {
                    cacheFile.open('r');
                    var content = cacheFile.read();
                    if (content) masterCacheData = JSON.parse(content);
                    cacheFile.close();
                } catch (e) {
                    masterCacheData = {};
                }
            }
            
            if (masterCacheData === null || typeof masterCacheData !== 'object') {
                masterCacheData = {};
            }
            
            masterCacheData[pathStr] = treeData;
            
            cacheFile.open('w');
            cacheFile.write(JSON.stringify(masterCacheData, null, 2));
            cacheFile.close();
            
            var greenColor = [0.18, 0.55, 0.34];
            var pType = pathLabel.graphics.PenType.SOLID_COLOR;
            pathLabel.graphics.foregroundColor = pathLabel.graphics.newPen(pType, greenColor, 1);
            
            statusWin.close();
            alert("Sucesso! Cache para '" + categoryName + "' foi atualizado.\n\n" + newCount + " arquivos encontrados.");
            
        } catch (e) {
            Logger.error("Erro ao gerar cache", { error: e.message });
            var redColor = [1, 0, 0];
            var pType = pathLabel.graphics.PenType.SOLID_COLOR;
            pathLabel.graphics.foregroundColor = pathLabel.graphics.newPen(pType, redColor, 1);
            alert("Erro crítico ao gerar o cache:\n" + e.message);
        }
    }
    
    function getCacheFileNameForCategory(categoryName) {
        switch (categoryName) {
            case 'JORNAIS': return 'templates_jornais_cache.json';
            case 'PROMO': return 'templates_promo_cache.json';
            case 'PROGRAMAS': return 'templates_programas_cache.json';
            case 'EVENTOS': return 'templates_eventos_cache.json';
            case 'MARKETING': return 'templates_marketing_cache.json';
            case 'BASE TEMÁTICA': return 'templates_base_cache.json';
            case 'ILUSTRAÇÕES': return 'templates_ilustra_cache.json';
            default: return 'templates_' + categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json';
        }
    }
    
    function getFolderStructureAsData(rootFolder, fileFilter, categoryName, progress) {
        if (!rootFolder.exists) return [];
        
        var allItems = null;
        try {
            allItems = rootFolder.getFiles();
        } catch (e) {
            Logger.warn("Erro ao ler pasta", { path: rootFolder.fsName, error: e.message });
            return [];
        }
        
        if (allItems === null) {
            Logger.warn("Pasta retornou nulo", { path: rootFolder.fsName });
            return [];
        }
        
        var folders = [];
        var files = [];
        var jornaisExclusions = [
            'ICONES', 'ILUSTRACOES', 'FOTOS PARA ABERTURAS', 'BAGUNCA ALHEIA', 
            '_OLD', 'BACKUP', 'VERSOES ANTERIORES', 'PARA_SCRIPT', '_PREVIEWS', 
            '_BASES_TEMATICAS', 'TESTE', 'REFERENCIAS', 'OLD'
        ];
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            
            if (item instanceof Folder) {
                var upperCaseDisplayName = item.displayName.toUpperCase();
                if (upperCaseDisplayName === "ADOBE AFTER EFFECTS AUTO-SAVE" || 
                    upperCaseDisplayName.slice(-4) === '_AME') continue;
                
                if (categoryName === 'JORNAIS' && jornaisExclusions.indexOf(upperCaseDisplayName) > -1) continue;
                
                var subItems = getFolderStructureAsData(item, fileFilter, categoryName, progress);
                if (subItems.length > 0) {
                    folders.push({
                        type: 'node',
                        text: item.displayName,
                        children: subItems
                    });
                }
            } else if (item instanceof File) {
                if (item.displayName.toLowerCase().indexOf("auto-save") > -1 || 
                    item.displayName.slice(0, 7) === 'tmpAEto') continue;
                
                var fileExt = item.name.substr(item.name.lastIndexOf('.')).toLowerCase();
                if (fileFilter.indexOf(fileExt) > -1) {
                    files.push({
                        type: 'item',
                        text: item.displayName,
                        filePath: item.fsName,
                        size: item.length,
                        modDate: item.modified.toUTCString()
                    });
                    
                    if (progress) {
                        progress.count++;
                        if (progress.win && progress.count % 10 === 0) {
                            progress.win.update("Processando...", progress.count);
                        }
                    }
                }
            }
        }
        
        folders.sort(function(a, b) { return a.text.localeCompare(b.text); });
        files.sort(function(a, b) { return a.text.localeCompare(b.text); });
        
        return folders.concat(files);
    }
    
    // Criação das categorias na interface
    for (var c = 0; c < categorias.length; c++) {
        var categoria = categorias[c];
        
        var catHeaderGrp = mainGrp.add('group', undefined);
        catHeaderGrp.alignment = ['fill', 'center'];
        catHeaderGrp.spacing = 8;
        
        var catLab = catHeaderGrp.add('statictext', undefined, categoria.nome + ':');
        catLab.preferredSize.width = 150;
        try {
            var color = [0.8, 0.8, 0.8];
            var pType = catLab.graphics.PenType.SOLID_COLOR;
            catLab.graphics.foregroundColor = catLab.graphics.newPen(pType, color, 1);
        } catch (e) {}
        
        var catAddBtn = catHeaderGrp.add('button', undefined, '+');
        catAddBtn.preferredSize = [24, 24];
        catAddBtn.helpTip = 'adicionar caminho';
        
        var catPathsGrp = mainGrp.add('group', undefined);
        catPathsGrp.orientation = 'column';
        catPathsGrp.alignChildren = 'fill';
        catPathsGrp.spacing = 4;
        catPathsGrp.margins = [20, 0, 0, 0];
        
        // Closure para manter referência correta
        (function(grp, cat) {
            cat.uiGroup = grp;
            
            for (var p = 0; p < cat.caminhos.length; p++) {
                addPathLine(grp, cat.caminhos[p], cat.nome);
            }
            
            catAddBtn.onClick = function() {
                try {
                    addPathLine(grp, Folder.desktop.fullName, cat.nome);
                    D9T_CONFIG_w.layout.layout(true);
                } catch (e) {
                    Logger.error("Erro ao adicionar caminho", { error: e.message });
                }
            };
        })(catPathsGrp, categoria);
    }
    
    // Botões inferiores
    var BtnGrp = D9T_CONFIG_w.add('group', undefined);
    BtnGrp.orientation = 'stack';
    BtnGrp.alignment = 'fill';
    BtnGrp.margins = [0, 32, 0, 0];
    
    var bGrp1 = BtnGrp.add('group');
    bGrp1.alignment = 'left';
    var bGrp2 = BtnGrp.add('group');
    bGrp2.alignment = 'right';
    
    var importBtn = bGrp1.add('button', undefined, 'Importar');
    importBtn.preferredSize = [80, 32];
    var exportBtn = bGrp1.add('button', undefined, 'Exportar');
    exportBtn.preferredSize = [80, 32];
    
    var saveBtn = bGrp2.add('button', undefined, 'Salvar');
    saveBtn.preferredSize = [120, 32];
    
    // Aplicação de cor de fundo
    try {
        var bgColorRgb = [0.043, 0.043, 0.055];
        var bType = D9T_CONFIG_w.graphics.BrushType.SOLID_COLOR;
        D9T_CONFIG_w.graphics.backgroundColor = D9T_CONFIG_w.graphics.newBrush(bType, bgColorRgb);
    } catch (e) {}
    
    // Evento de inicialização
    D9T_CONFIG_w.onShow = function() {
        try {
            for (var i = 0; i < pathLabsToCheck.length; i++) {
                var pathLab = pathLabsToCheck[i];
                var isValid = checkPathValidity(pathLab.properties.pathValue);
                var color = isValid ? [1, 1, 1] : [1, 0, 0];
                var pType = pathLab.graphics.PenType.SOLID_COLOR;
                pathLab.graphics.foregroundColor = pathLab.graphics.newPen(pType, color, 1);
            }
        } catch (e) {
            Logger.error("Erro na inicialização da janela", { error: e.message });
        }
    };
    
    // Funções auxiliares
    function saveProdData(dataToSave) {
        try {
            var configFile = new File(scriptMainPath + 'source/config/TEMPLATES_config.json');
            configFile.encoding = "UTF-8";
            configFile.open('w');
            var configContainer = { "PRODUCTIONS": [dataToSave] };
            configFile.write(JSON.stringify(configContainer, null, 2));
            configFile.close();
            return true;
        } catch (e) {
            Logger.error("Erro ao salvar configuração", { error: e.message });
            alert("Erro ao salvar o arquivo de configuração:\n" + e.message);
            return false;
        }
    }
    
    function collectConfigData() {
        try {
            var configOutput = {};
            
            for (var i = 0; i < categorias.length; i++) {
                var cat = categorias[i];
                var caminhos = [];
                
                if (cat.uiGroup && cat.uiGroup.children) {
                    for (var j = 0; j < cat.uiGroup.children.length; j++) {
                        caminhos.push(cat.uiGroup.children[j].children[1].properties.pathValue);
                    }
                }
                
                configOutput[cat.key] = caminhos;
            }
            
            configOutput.name = 'Configuração GNEWS';
            configOutput.templatesPath = configOutput.jornais && configOutput.jornais.length > 0 ? 
                                        configOutput.jornais[0] : '';
            
            return configOutput;
        } catch (e) {
            Logger.error("Erro ao coletar dados de configuração", { error: e.message });
            throw e;
        }
    }
    
    function repopulateUI(configData) {
        try {
            pathLabsToCheck = [];
            
            for (var i = 0; i < categorias.length; i++) {
                var cat = categorias[i];
                var paths = configData[cat.key] || [];
                
                while (cat.uiGroup.children.length > 0) {
                    cat.uiGroup.remove(cat.uiGroup.children[0]);
                }
                
                for (var p = 0; p < paths.length; p++) {
                    addPathLine(cat.uiGroup, paths[p], cat.nome);
                }
            }
            
            D9T_CONFIG_w.layout.layout(true);
            D9T_CONFIG_w.onShow();
        } catch (e) {
            Logger.error("Erro ao repopular UI", { error: e.message });
        }
    }
    
    // Eventos dos botões
    saveBtn.onClick = function () {
        try {
            var configData = collectConfigData();
            if (saveProdData(configData)) {
                if (typeof D9T_prodArray !== 'undefined') {
                    D9T_prodArray = [configData];
                }
                alert('Configuração salva com sucesso!\n\nUse o botão "Atualizar" na janela de Templates para aplicar as mudanças.');
                D9T_CONFIG_w.close();
            }
        } catch (e) {
            Logger.error("Erro ao salvar", { error: e.message });
            alert('Erro ao coletar dados para salvar: ' + e.message);
        }
    };
    
    exportBtn.onClick = function() {
        try {
            var configData = collectConfigData();
            var saveFile = File.saveDialog("Salvar configuração como...", "D9T_Templates_Config_*.json");
            if (saveFile) {
                saveFile.encoding = "UTF-8";
                saveFile.open('w');
                saveFile.write(JSON.stringify(configData, null, 2));
                saveFile.close();
                alert("Configuração exportada com sucesso para:\n" + decodeURI(saveFile.fsName));
            }
        } catch (e) {
            Logger.error("Erro ao exportar", { error: e.message });
            alert("Erro ao exportar o arquivo:\n" + e.message);
        }
    };
    
    importBtn.onClick = function() {
        try {
            var configFile = File.openDialog("Selecione um arquivo de configuração (.json)", "*.json");
            if (configFile) {
                configFile.encoding = "UTF-8";
                configFile.open('r');
                var content = configFile.read();
                configFile.close();
                
                var rawData = JSON.parse(content);
                var importedData = rawData;
                
                if (rawData.PRODUCTIONS && rawData.PRODUCTIONS.length > 0) {
                    importedData = rawData.PRODUCTIONS[0];
                }
                
                repopulateUI(importedData);
                alert("Configuração importada com sucesso!");
            }
        } catch (e) {
            Logger.error("Erro ao importar", { error: e.message });
            alert("Erro ao importar o arquivo de configuração:\n" + e.message);
        }
    };
    
    D9T_CONFIG_w.center();
    D9T_CONFIG_w.show();
}