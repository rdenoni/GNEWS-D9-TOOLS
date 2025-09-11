$.encoding = "UTF-8";

// =============================================================================
// GNEWS TEMPLATES - V3.9 OPTIMIZED
// Melhorias de performance e correções de bugs
// =============================================================================

// Cache global para evitar recriações desnecessárias
var GLOBAL_CACHE = {
    templatesData: {},
    previewCache: {},
    lastLoadTime: {},
    isLoading: false
};

// Pool de workers para operações pesadas
var WORKER_POOL = {
    maxWorkers: 3,
    activeWorkers: 0,
    queue: []
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
    
    var progressLabel = win.add("statictext", undefined, "0 / 0 arquivos");
    progressLabel.characters = 40;
    progressLabel.alignment = "center";
    
    win.update = function(statusText, current, total) {
        if (statusText) statusLabel.text = statusText;
        if (current !== undefined && total !== undefined) {
            progressBar.value = total > 0 ? (current / total) * 100 : 0;
            progressLabel.text = current + " / " + total + " arquivos";
        }
        win.layout.layout(true);
        if (win.visible) win.update();
    };
    
    return win;
}

// Versão otimizada da função flattenData usando iteração em vez de recursão
function flattenDataOptimized(dataArray) {
    var flatList = [];
    var stack = [];
    
    // Inicializa a pilha com os dados originais
    for (var i = dataArray.length - 1; i >= 0; i--) {
        stack.push(dataArray[i]);
    }
    
    while (stack.length > 0) {
        var node = stack.pop();
        
        if (node.type === "item") {
            flatList.push(node);
        } else if (node.type === "node" && node.children && node.children.length > 0) {
            // Adiciona os filhos na pilha em ordem reversa para manter a ordem original
            for (var j = node.children.length - 1; j >= 0; j--) {
                stack.push(node.children[j]);
            }
        }
    }
    
    return flatList;
}

// Worker virtual para processamento assíncrono
function processInBackground(task, callback) {
    if (WORKER_POOL.activeWorkers >= WORKER_POOL.maxWorkers) {
        WORKER_POOL.queue.push({ task: task, callback: callback });
        return;
    }
    
    WORKER_POOL.activeWorkers++;
    
    try {
        // Simula processamento assíncrono
        $.sleep(1);
        var result = task();
        if (callback) callback(result);
    } catch (e) {
        if (callback) callback(null, e);
    } finally {
        WORKER_POOL.activeWorkers--;
        
        // Processa próximo item da fila
        if (WORKER_POOL.queue.length > 0) {
            var next = WORKER_POOL.queue.shift();
            processInBackground(next.task, next.callback);
        }
    }
}

function d9TemplateDialog() {
    // Evita múltiplas instâncias
    if (GLOBAL_CACHE.isLoading) {
        alert("Uma instância já está carregando. Aguarde...");
        return;
    }
    
    GLOBAL_CACHE.isLoading = true;
    
    var initialStatusWin = createStatusWindow("GNEWS Templates");
    initialStatusWin.show();
    initialStatusWin.update("Inicializando interface...", 0, 100);
    
    try {
        var scriptName = "GNEWS TEMPLATES";
        var scriptVersion = "3.9";
        var fileFilter = [".aep", ".aet"];
        var projectFile;
        var lClick = typeof lClick !== "undefined" ? lClick : "Clique: ";
        
        // Cache otimizado
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
            userConfigFile = null;
        }
        
        // Dados das artes com lazy loading
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
                }
            } catch (err) {
                artesData = null;
            }
            
            return artesData;
        }
        
        function getArteData(codigo) {
            var data = loadArtesData();
            if (!data || !data.artes_codificadas) return null;
            
            // Cache de busca para códigos já pesquisados
            if (!GLOBAL_CACHE.arteSearchCache) {
                GLOBAL_CACHE.arteSearchCache = {};
            }
            
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
        
        // Cores e funções de UI otimizadas
        var bgColor1 = "#0B0D0E", normalColor1 = "#C7C8CA", monoColor0 = "#686F75",
            monoColor1 = "#9CA0A5", normalColor2 = "#ffffffff", highlightColor1 = "#E0003A";
        
        // Cache para conversões de cor
        var colorCache = {};
        
        function hexToRgb(hex) {
            if (colorCache[hex]) return colorCache[hex];
            
            if (hex == undefined) return [0.5, 0.5, 0.5];
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
                var color = hexToRgb(hexColor);
                var bType = element.graphics.BrushType.SOLID_COLOR;
                element.graphics.backgroundColor = element.graphics.newBrush(bType, color);
            } catch (e) {}
        }
        
        function setFgColor(element, hexColor) {
            try {
                var color = hexToRgb(hexColor);
                var pType = element.graphics.PenType.SOLID_COLOR;
                element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1);
            } catch (e) {}
        }
        
        initialStatusWin.update("Criando interface...", 20, 100);
        
        // Criação da interface principal
        var D9T_TEMPLATES_w = new Window("palette", scriptName + " " + scriptVersion);
        D9T_TEMPLATES_w.preferredSize = [800, 600]; // Define tamanho inicial
        
        // Header otimizado
        var topHeaderGrp = D9T_TEMPLATES_w.add("group");
        topHeaderGrp.orientation = "row";
        topHeaderGrp.alignment = ["fill", "top"];
        topHeaderGrp.margins = [0, 5, 10, 0];
        
        var titlePlaceholder = topHeaderGrp.add("statictext", undefined, "");
        titlePlaceholder.alignment = ["fill", "center"];
        
        var helpBtnGrp = topHeaderGrp.add("group");
        helpBtnGrp.alignment = ["right", "center"];
        
        var infoBtn;
        if (typeof themeIconButton === "function" && typeof D9T_INFO_ICON !== "undefined") {
            infoBtn = new themeIconButton(helpBtnGrp, {
                icon: D9T_INFO_ICON,
                tips: [lClick + "ajuda | DOCS"],
            });
        } else {
            infoBtn = helpBtnGrp.add("button", undefined, "?");
            infoBtn.helpTip = "ajuda | DOCS";
            infoBtn.preferredSize = [24, 24];
        }
        
        // Grupo principal com layout otimizado
        var mainGrp = D9T_TEMPLATES_w.add("group");
        mainGrp.orientation = "row"; // Mudança para row para melhor performance
        mainGrp.spacing = 12;
        mainGrp.alignment = ["fill", "fill"];
        
        // Painel esquerdo (lista de templates)
        var leftPanel = mainGrp.add("panel", undefined, "TEMPLATES");
        leftPanel.orientation = "column";
        leftPanel.alignment = ["left", "fill"];
        leftPanel.preferredSize.width = 350;
        leftPanel.margins = 10;
        
        // Painel direito (preview e informações)
        var rightPanel = mainGrp.add("panel", undefined, "PREVIEW & INFO");
        rightPanel.orientation = "column";
        rightPanel.alignment = ["fill", "fill"];
        rightPanel.margins = 10;
        
        initialStatusWin.update("Configurando controles...", 40, 100);
        
        // Configuração de produção otimizada
        var prodHeaderGrp = leftPanel.add("group");
        prodHeaderGrp.alignment = "fill";
        var prodLab = prodHeaderGrp.add("statictext", undefined, "PRODUÇÃO:");
        setFgColor(prodLab, normalColor1);
        
        var prodGrp = leftPanel.add("group");
        prodGrp.spacing = 4;
        prodGrp.alignment = "fill";
        
        var prodIconGrp = prodGrp.add("group");
        prodIconGrp.orientation = "stack";
        
        var prodDropItems = ["JORNAIS", "PROMO", "PROGRAMAS", "EVENTOS", "MARKETING", "BASE TEMÁTICA", "ILUSTRAÇÕES"];
        
        var validProductions = [
            { name: "JORNAIS", key: "jornais", icon: "D9T_TEMPPECAS_ICON", paths: [] },
            { name: "PROMO", key: "promo", icon: "D9T_TBASE_ICON", paths: [] },
            { name: "PROGRAMAS", key: "programas", icon: "D9T_TBASE_ICON", paths: [] },
            { name: "EVENTOS", key: "eventos", icon: "D9T_TBASE_ICON", paths: [] },
            { name: "MARKETING", key: "marketing", icon: "D9T_TBASE_ICON", paths: [] },
            { name: "BASE TEMÁTICA", key: "basetematica", icon: "D9T_TBASE_ICON", paths: [] },
            { name: "ILUSTRAÇÕES", key: "ilustracoes", icon: "D9T_TILUSTRA_ICON", paths: [] }
        ];
        
        // Carregamento otimizado dos dados de produção
        if (typeof D9T_prodArray !== "undefined" && D9T_prodArray.length > 0) {
            var prodData = D9T_prodArray[0];
            for (var i = 0; i < validProductions.length; i++) {
                var prod = validProductions[i];
                if (prod.key === "jornais" && prodData["pecasGraficas"]) {
                    prod.paths = prodData["pecasGraficas"] || [];
                } else if (prodData[prod.key]) {
                    prod.paths = prodData[prod.key] || [];
                }
            }
        }
        
        if (typeof populateMainIcons === "function") {
            populateMainIcons(prodIconGrp, validProductions);
        }
        
        var prodDrop = prodGrp.add("dropdownlist", undefined, prodDropItems, {
            alignment: ["fill", "center"],
        });
        prodDrop.selection = 0;
        prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
        
        // Seção de busca otimizada
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
        
        var itemCounterLab = searchOptionsGrp.add("statictext", undefined, "", { justify: "right" });
        setFgColor(itemCounterLab, monoColor1);
        
        var flatViewCheckbox = searchOptionsGrp.add("checkbox", undefined, "Lista");
        setFgColor(flatViewCheckbox, normalColor1);
        flatViewCheckbox.helpTip = "Exibir em lista plana";
        flatViewCheckbox.value = true;
        
        // Caixa de busca com debounce
        var placeholderText = "⌕ Digite para Buscar...";
        var searchBox = searchGrp.add("edittext", [0, 0, 300, 24], "");
        searchBox.text = placeholderText;
        searchBox.isPlaceholderActive = true;
        setFgColor(searchBox, monoColor0);
        
        // TreeView otimizada
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
        
        initialStatusWin.update("Configurando botões...", 60, 100);
        
        // Botões de ação otimizados
        var buttonGrp = leftPanel.add("group");
        buttonGrp.orientation = "row";
        buttonGrp.alignment = "fill";
        buttonGrp.spacing = 8;
        
        var refreshBtn, openFldBtn;
        
        if (typeof themeIconButton === "function" && typeof D9T_ATUALIZAR_ICON !== "undefined") {
            refreshBtn = new themeIconButton(buttonGrp, {
                icon: D9T_ATUALIZAR_ICON,
                tips: [lClick + "Recarregar cache"],
            });
        } else {
            refreshBtn = buttonGrp.add("button", undefined, "Atualizar");
            refreshBtn.helpTip = "Recarregar cache";
        }
        
        if (typeof themeIconButton === "function" && typeof D9T_PASTA_ICON !== "undefined") {
            openFldBtn = new themeIconButton(buttonGrp, {
                icon: D9T_PASTA_ICON,
                tips: [lClick + "Abrir pasta"],
            });
        } else {
            openFldBtn = buttonGrp.add("button", undefined, "Pasta");
            openFldBtn.helpTip = "Abrir pasta";
        }
        
        // Painel direito - Preview otimizado
        var previewHeaderGrp = rightPanel.add("group");
        previewHeaderGrp.alignment = "fill";
        var previewLab = previewHeaderGrp.add("statictext", undefined, "PREVIEW:");
        setFgColor(previewLab, normalColor1);
        
        var previewImg;
        if (typeof no_preview !== "undefined") {
            previewImg = rightPanel.add("image", [0, 0, 400, 225], no_preview);
        } else {
            previewImg = rightPanel.add("image", [0, 0, 400, 225]);
        }
        previewImg.alignment = ["center", "top"];
        
        // Informações da arte otimizadas
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
        codigoTxt.helpTip = "Digite o código da arte";
        
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
        
        // Botões de ação final
        var actionGrp = rightPanel.add("group");
        actionGrp.orientation = "row";
        actionGrp.alignment = ["right", "bottom"];
        actionGrp.spacing = 8;
        
        var openBtn, importBtn;
        
        if (typeof themeButton === "function") {
            openBtn = new themeButton(actionGrp, {
                width: 80,
                height: 32,
                labelTxt: "Abrir",
                tips: ["Abrir projeto"],
            });
            importBtn = new themeButton(actionGrp, {
                width: 80,
                height: 32,
                textColor: bgColor1,
                buttonColor: normalColor1,
                labelTxt: "Importar",
                tips: ["Importar template"],
            });
        } else {
            openBtn = actionGrp.add("button", undefined, "Abrir");
            openBtn.preferredSize = [80, 32];
            importBtn = actionGrp.add("button", undefined, "Importar");
            importBtn.preferredSize = [80, 32];
        }
        
        initialStatusWin.update("Configurando funcionalidades...", 80, 100);
        
        // === FUNÇÕES OTIMIZADAS ===
        
        // Cache otimizado para versão do AEP
        var aepVersionCache = {};
        
        function getAepVersion(aepFile) {
            if (!aepFile || !aepFile.exists) return "N/A";
            
            var cacheKey = aepFile.fsName + "_" + aepFile.modified.getTime();
            if (aepVersionCache[cacheKey]) {
                return aepVersionCache[cacheKey];
            }
            
            try {
                aepFile.encoding = "BINARY";
                aepFile.open("r");
                var fileContent = aepFile.read(1000000); // Reduzido para 1MB
                aepFile.close();
                
                var version = "Adobe After Effects 2020";
                var creatorMatch = fileContent.match(/<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i);
                var agentMatch = fileContent.match(/<stEvt:softwareAgent>(.*?)<\/stEvt:softwareAgent>/i);
                
                if (creatorMatch && creatorMatch[1]) {
                    version = creatorMatch[1].replace(/^\s+|\s+$/g, "");
                } else if (agentMatch && agentMatch[1]) {
                    version = agentMatch[1].replace(/^\s+|\s+$/g, "");
                }
                
                if (version.indexOf("Photoshop") > -1) {
                    version = version.replace("Photoshop", "After Effects");
                }
                if (version.indexOf("23.2") > -1) {
                    version = "Adobe After Effects 2023";
                }
                
                aepVersionCache[cacheKey] = version;
                return version;
            } catch (e) {
                return "Erro de leitura";
            }
        }
        
        // Geração otimizada de código
        function generateCodigoFromTemplate(templateName) {
            try {
                var name = (typeof deleteFileExt === "function" 
                    ? deleteFileExt(templateName) 
                    : templateName.replace(/\.[^\.]+$/, "")).toUpperCase();
                
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
                return "AUTO" + new Date().getFullYear();
            }
        }
        
        // Determinação otimizada do servidor
        function determineServidorDestino(templateName, templatePath) {
            var name = templateName.toUpperCase();
            var path = templatePath ? templatePath.toUpperCase() : "";
            var fullText = name + " " + path;
            
            // Cache para termos já pesquisados
            if (!GLOBAL_CACHE.servidorCache) {
                GLOBAL_CACHE.servidorCache = {};
            }
            
            if (GLOBAL_CACHE.servidorCache[fullText]) {
                return GLOBAL_CACHE.servidorCache[fullText];
            }
            
            var result = "PAM HARDNEWS"; // Default
            
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
        }
        
        // Atualização otimizada das informações da arte
        var updateArteInfoTimer = null;
        
        function updateArteInfo() {
            // Debounce para evitar múltiplas chamadas
            if (updateArteInfoTimer) {
                clearTimeout(updateArteInfoTimer);
            }
            
            updateArteInfoTimer = setTimeout(function() {
                try {
                    var selectedTemplate = templateTree.selection;
                    if (selectedTemplate && selectedTemplate.type === "item" && selectedTemplate.filePath) {
                        var templateNameWithExt = selectedTemplate.text;
                        var nomeDaArte = (typeof deleteFileExt === "function" 
                            ? deleteFileExt(templateNameWithExt) 
                            : templateNameWithExt.replace(/\.[^\.]+$/, "")).toUpperCase();
                        
                        infoValues[0].text = nomeDaArte;
                        
                        var generatedCodigo = generateCodigoFromTemplate(templateNameWithExt);
                        codigoTxt.text = generatedCodigo;
                        
                        var templatePath = selectedTemplate.filePath;
                        var servidorDestino = determineServidorDestino(templateNameWithExt, templatePath);
                        infoValues[1].text = servidorDestino;
                        
                        var modDate = new Date(selectedTemplate.modDate);
                        var dateStr = ("0" + modDate.getDate()).slice(-2) + "/" + 
                                     ("0" + (modDate.getMonth() + 1)).slice(-2) + "/" + 
                                     modDate.getFullYear();
                        infoValues[2].text = dateStr;
                        
                        // Versão do AEP em background
                        processInBackground(function() {
                            var aepFile = new File(selectedTemplate.filePath);
                            return getAepVersion(aepFile);
                        }, function(version) {
                            if (version) infoValues[3].text = version;
                        });
                        
                    } else {
                        codigoTxt.text = "";
                        for (var i = 0; i < infoValues.length; i++) {
                            infoValues[i].text = "---";
                        }
                    }
                } catch (e) {
                    for (var i = 0; i < infoValues.length; i++) {
                        infoValues[i].text = "Erro";
                    }
                }
            }, 100); // Debounce de 100ms
        }
        
        // Carregamento otimizado do cache
        function loadCacheInBackground(prodName) {
            var cacheKey = prodName + "_cache";
            var currentTime = new Date().getTime();
            
            // Verifica se o cache ainda é válido (5 minutos)
            if (templatesCache[prodName] && 
                GLOBAL_CACHE.lastLoadTime[cacheKey] && 
                (currentTime - GLOBAL_CACHE.lastLoadTime[cacheKey]) < 300000) {
                return;
            }
            
            var cacheFileName = getCacheFileName(prodName);
            var templatesCacheFile = new File(cacheFolder.fullName + "/" + cacheFileName);
            
            if (templatesCacheFile.exists) {
                try {
                    templatesCacheFile.open("r");
                    var cacheContent = templatesCacheFile.read();
                    templatesCacheFile.close();
                    
                    var masterCacheData = JSON.parse(cacheContent);
                    var combinedTreeData = [];
                    
                    for (var path in masterCacheData) {
                        if (masterCacheData.hasOwnProperty(path)) {
                            combinedTreeData = combinedTreeData.concat(masterCacheData[path]);