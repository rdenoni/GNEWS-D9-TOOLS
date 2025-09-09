/**
 * GNEWS Templates v2.7 - VERSÃO COM TRATAMENTO ROBUSTO DE ERROS
 * Solução para "file or folder does not exist"
 */

// ======================= SISTEMA DE VERIFICAÇÃO DE ARQUIVOS =======================

var FileSystemChecker = {
    // Verificações de paths críticos
    criticalPaths: {
        scriptMainPath: null,
        configFile: null,
        artesDataFile: null,
        iconsPath: null,
        tempPath: null
    },
    
    // Inicializa e verifica todos os caminhos
    init: function() {
        this.verifyCriticalPaths();
        this.createMissingDirectories();
        return this.getAllPathsStatus();
    },
    
    // Verifica se todos os caminhos críticos existem
    verifyCriticalPaths: function() {
        try {
            // Verifica scriptMainPath
            if (typeof scriptMainPath !== 'undefined' && scriptMainPath) {
                var scriptFolder = new Folder(scriptMainPath);
                this.criticalPaths.scriptMainPath = scriptFolder.exists ? scriptMainPath : null;
            }
            
            // Verifica arquivo de configuração
            if (this.criticalPaths.scriptMainPath) {
                var configPath = this.criticalPaths.scriptMainPath + 'source/config/TEMPLATES_config.json';
                var configFile = new File(configPath);
                this.criticalPaths.configFile = configFile.exists ? configPath : null;
            }
            
            // Verifica dados das artes
            if (this.criticalPaths.scriptMainPath) {
                var artesPath = this.criticalPaths.scriptMainPath + 'source/libraries/dados_json/DADOS_artes_gnews.json';
                var artesFile = new File(artesPath);
                this.criticalPaths.artesDataFile = artesFile.exists ? artesPath : null;
            }
            
            // Verifica pasta de ícones
            if (this.criticalPaths.scriptMainPath) {
                var iconsPath = this.criticalPaths.scriptMainPath + 'source/icons/';
                var iconsFolder = new Folder(iconsPath);
                this.criticalPaths.iconsPath = iconsFolder.exists ? iconsPath : null;
            }
            
            // Verifica pasta temporária
            var userPath = Folder.userData.fullName;
            var tempPath = userPath + '/GNEWS D9 TOOLS script/temp';
            var tempFolder = new Folder(tempPath);
            this.criticalPaths.tempPath = tempFolder.exists ? tempPath : null;
            
        } catch (e) {
            // Se der erro, define paths como null
            this.criticalPaths.scriptMainPath = null;
        }
    },
    
    // Cria diretórios que estão faltando
    createMissingDirectories: function() {
        try {
            // Cria pasta temporária se não existir
            if (!this.criticalPaths.tempPath) {
                var userPath = Folder.userData.fullName;
                var gnewsPath = userPath + '/GNEWS D9 TOOLS script';
                var gnewsFolder = new Folder(gnewsPath);
                if (!gnewsFolder.exists) gnewsFolder.create();
                
                var tempPath = gnewsPath + '/temp';
                var tempFolder = new Folder(tempPath);
                if (!tempFolder.exists) tempFolder.create();
                
                this.criticalPaths.tempPath = tempPath;
            }
            
            // Cria cache se o scriptMainPath existir
            if (this.criticalPaths.scriptMainPath) {
                var cachePath = this.criticalPaths.scriptMainPath + 'source/cache';
                var cacheFolder = new Folder(cachePath);
                if (!cacheFolder.exists) cacheFolder.create();
            }
            
        } catch (e) {
            // Se não conseguir criar, continua sem as pastas
        }
    },
    
    // Retorna status de todos os paths
    getAllPathsStatus: function() {
        var status = {
            ready: true,
            issues: [],
            warnings: [],
            paths: this.criticalPaths
        };
        
        if (!this.criticalPaths.scriptMainPath) {
            status.ready = false;
            status.issues.push("Pasta principal do script não encontrada");
        }
        
        if (!this.criticalPaths.configFile) {
            status.warnings.push("Arquivo de configuração não encontrado - usando configuração padrão");
        }
        
        if (!this.criticalPaths.artesDataFile) {
            status.warnings.push("Dados das artes GNEWS não encontrados - informações limitadas");
        }
        
        if (!this.criticalPaths.iconsPath) {
            status.warnings.push("Pasta de ícones não encontrada - usando ícones padrão do sistema");
        }
        
        return status;
    },
    
    // Função segura para ler arquivos
    safeReadFile: function(filePath, encoding) {
        try {
            if (!filePath) return null;
            
            var file = new File(filePath);
            if (!file.exists) return null;
            
            file.encoding = encoding || 'UTF-8';
            file.open('r');
            var content = file.read();
            file.close();
            
            return content;
        } catch (e) {
            return null;
        }
    },
    
    // Função segura para verificar pastas
    safeFolderExists: function(folderPath) {
        try {
            if (!folderPath) return false;
            var folder = new Folder(folderPath);
            return folder.exists;
        } catch (e) {
            return false;
        }
    },
    
    // Função segura para listar arquivos
    safeGetFiles: function(folderPath, filter) {
        try {
            if (!folderPath) return [];
            
            var folder = new Folder(folderPath);
            if (!folder.exists) return [];
            
            var files = folder.getFiles(filter);
            return files || [];
        } catch (e) {
            return [];
        }
    }
};

// ======================= PRELOAD MANAGER ROBUSTO =======================

var PreloadManagerRobust = {
    // Cache e configurações
    cache: {
        templates: {},
        previews: {},
        metadata: {},
        artesData: null
    },
    
    loadingStates: {
        systemCheck: false,
        templates: false,
        complete: false
    },
    
    config: {
        maxConcurrentLoads: 3,  // Reduzido para evitar problemas
        previewCacheLimit: 50,   // Reduzido para economia de memória
        templateCacheLimit: 30,  // Reduzido para economia de memória
        chunkSize: 5            // Reduzido para processamento mais suave
    },
    
    progressCallback: null,
    systemStatus: null,
    
    // Inicialização robusta
    init: function(progressCallback) {
        this.progressCallback = progressCallback || null;
        this.updateProgress('init', 0, 'Verificando sistema...');
        
        // Verifica sistema de arquivos
        this.systemStatus = FileSystemChecker.init();
        this.loadingStates.systemCheck = true;
        
        if (!this.systemStatus.ready) {
            this.handleSystemIssues();
            return;
        }
        
        this.updateProgress('init', 20, 'Sistema verificado');
        
        // Carrega dados críticos
        this.loadCriticalData();
    },
    
    // Trata problemas do sistema
    handleSystemIssues: function() {
        var errorMsg = "PROBLEMAS DETECTADOS:\n\n";
        
        for (var i = 0; i < this.systemStatus.issues.length; i++) {
            errorMsg += "• " + this.systemStatus.issues[i] + "\n";
        }
        
        errorMsg += "\nO script continuará em modo limitado.";
        
        if (this.progressCallback) {
            this.progressCallback('error', 0, errorMsg);
        }
        
        // Continua em modo limitado
        this.initLimitedMode();
    },
    
    // Modo limitado sem dependências externas
    initLimitedMode: function() {
        this.updateProgress('limited', 50, 'Iniciando modo limitado...');
        
        // Usa apenas D9T_prodArray se existir
        if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray) {
            this.loadProductionsLimited();
        } else {
            // Cria configuração mínima
            this.createMinimalConfig();
        }
        
        this.loadingStates.complete = true;
        this.updateProgress('complete', 100, 'Sistema pronto (modo limitado)');
    },
    
    // Carrega dados críticos de forma segura
    loadCriticalData: function() {
        this.updateProgress('data', 30, 'Carregando dados das artes...');
        
        // Tenta carregar dados das artes GNEWS
        if (this.systemStatus.paths.artesDataFile) {
            var artesContent = FileSystemChecker.safeReadFile(this.systemStatus.paths.artesDataFile);
            if (artesContent) {
                try {
                    this.cache.artesData = JSON.parse(artesContent);
                } catch (e) {
                    this.cache.artesData = { artes_codificadas: [] };
                }
            } else {
                this.cache.artesData = { artes_codificadas: [] };
            }
        } else {
            this.cache.artesData = { artes_codificadas: [] };
        }
        
        this.updateProgress('data', 50, 'Dados carregados');
        
        // Carrega produções
        this.loadAllProductionsSafe();
    },
    
    // Carrega produções de forma segura
    loadAllProductionsSafe: function() {
        if (typeof D9T_prodArray === 'undefined' || !D9T_prodArray) {
            this.createMinimalConfig();
            return;
        }
        
        this.updateProgress('productions', 60, 'Verificando produções...');
        
        var validProductions = [];
        for (var i = 0; i < D9T_prodArray.length; i++) {
            var prod = D9T_prodArray[i];
            if (prod && prod.templatesPath && FileSystemChecker.safeFolderExists(prod.templatesPath)) {
                validProductions.push(prod);
            }
        }
        
        if (validProductions.length === 0) {
            this.createMinimalConfig();
            return;
        }
        
        // Carrega templates das produções válidas
        this.loadValidProductions(validProductions);
    },
    
    // Carrega apenas produções válidas
    loadValidProductions: function(validProductions) {
        var totalProds = validProductions.length;
        var loadedProds = 0;
        
        for (var i = 0; i < validProductions.length; i++) {
            var prod = validProductions[i];
            var prodKey = this.getProductionKey(prod);
            
            this.updateProgress('templates', 60 + (loadedProds / totalProds) * 30, 
                              'Carregando: ' + prod.name);
            
            this.loadProductionTemplatesSafe(prod, function() {
                loadedProds++;
                if (loadedProds >= totalProds) {
                    self.loadingStates.templates = true;
                    self.loadingStates.complete = true;
                    self.updateProgress('complete', 100, 'Carregamento concluído!');
                }
            });
        }
    },
    
    // Carrega templates de uma produção de forma segura
    loadProductionTemplatesSafe: function(production, callback) {
        var self = this;
        var prodKey = this.getProductionKey(production);
        
        if (!this.cache.templates[prodKey]) {
            this.cache.templates[prodKey] = {};
        }
        
        var templateFiles = this.getAllTemplateFilesSafe(production.templatesPath);
        var totalFiles = templateFiles.length;
        
        if (totalFiles === 0) {
            if (callback) callback();
            return;
        }
        
        // Processa em chunks pequenos para não travar
        var processedFiles = 0;
        var chunkSize = Math.min(this.config.chunkSize, totalFiles);
        
        var processChunk = function(startIndex) {
            var endIndex = Math.min(startIndex + chunkSize, totalFiles);
            
            for (var i = startIndex; i < endIndex; i++) {
                var file = templateFiles[i];
                if (file && file.exists) {
                    var fileKey = self.getFileKey(file);
                    
                    self.cache.templates[prodKey][fileKey] = {
                        file: file,
                        name: file.displayName || file.name,
                        path: file.fullName,
                        modified: file.modified || new Date(),
                        size: file.length || 0,
                        loaded: false
                    };
                }
                processedFiles++;
            }
            
            if (endIndex < totalFiles) {
                // Pequeno delay para não travar a UI
                app.scheduleTask("processChunk(" + endIndex + ");", 50, false);
            } else {
                if (callback) callback();
            }
        };
        
        processChunk(0);
    },
    
    // Busca arquivos de template de forma segura
    getAllTemplateFilesSafe: function(folderPath) {
        var files = [];
        var fileExtensions = ['.aep', '.aet'];
        
        var processFolder = function(currentPath) {
            var folderContents = FileSystemChecker.safeGetFiles(currentPath);
            
            for (var i = 0; i < folderContents.length; i++) {
                var item = folderContents[i];
                
                try {
                    if (item instanceof Folder && item.exists) {
                        processFolder(item.fullName);
                    } else if (item instanceof File && item.exists) {
                        var ext = item.name.toLowerCase().substr(item.name.lastIndexOf('.'));
                        if (fileExtensions.indexOf(ext) !== -1) {
                            files.push(item);
                        }
                    }
                } catch (e) {
                    // Ignora itens com problemas
                    continue;
                }
            }
        };
        
        try {
            processFolder(folderPath);
        } catch (e) {
            // Retorna lista vazia em caso de erro
        }
        
        return files;
    },
    
    // Cria configuração mínima quando não há dados
    createMinimalConfig: function() {
        // Cria produção local mínima
        var localPath = Folder.userData.fullName + '/GNEWS Templates Local';
        var localFolder = new Folder(localPath);
        if (!localFolder.exists) {
            try {
                localFolder.create();
            } catch (e) {
                localPath = Folder.userData.fullName;
            }
        }
        
        // Define array mínimo se não existir
        if (typeof D9T_prodArray === 'undefined' || !D9T_prodArray) {
            window.D9T_prodArray = [{
                name: 'Local',
                templatesPath: localPath,
                icon: null
            }];
        }
        
        this.loadingStates.complete = true;
        this.updateProgress('complete', 100, 'Configuração mínima criada');
    },
    
    // Atualiza progresso
    updateProgress: function(type, progress, detail) {
        if (this.progressCallback) {
            this.progressCallback(type, progress, detail);
        }
    },
    
    // Funções auxiliares seguras
    getProductionKey: function(production) {
        if (!production || !production.name) return 'DEFAULT';
        return production.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    },
    
    getFileKey: function(file) {
        if (!file || !file.name) return 'default_' + Math.random();
        return file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    },
    
    // Busca segura de dados da arte
    getArteData: function(codigo) {
        if (!this.cache.artesData || !this.cache.artesData.artes_codificadas || !codigo) {
            return null;
        }
        
        try {
            for (var i = 0; i < this.cache.artesData.artes_codificadas.length; i++) {
                if (this.cache.artesData.artes_codificadas[i].codigo === codigo.toUpperCase()) {
                    return this.cache.artesData.artes_codificadas[i];
                }
            }
        } catch (e) {
            return null;
        }
        
        return null;
    },
    
    // Carrega metadados de forma segura
    loadTemplateMetadataSafe: function(prodKey, fileKey) {
        try {
            if (!this.cache.templates[prodKey] || !this.cache.templates[prodKey][fileKey]) {
                return null;
            }
            
            var templateData = this.cache.templates[prodKey][fileKey];
            if (templateData.loaded && templateData.metadata) {
                return templateData.metadata;
            }
            
            var file = templateData.file;
            if (!file || !file.exists) {
                return null;
            }
            
            var metadata = {
                version: this.getAepVersionSafe(file),
                codigo: this.generateCodigoSafe(file.displayName || file.name),
                servidor: this.determineServidorSafe(file.displayName || file.name, file.fullName),
                lastModified: (file.modified || new Date()).toLocaleString()
            };
            
            // Busca dados da arte
            var arteData = this.getArteData(metadata.codigo);
            if (arteData) {
                metadata.nomeArte = arteData.nome_arte || '';
                metadata.servidorDestino = arteData.servidor_destino || '';
                metadata.ultimaAtualizacao = arteData.ultima_atualizacao || '';
            }
            
            templateData.metadata = metadata;
            templateData.loaded = true;
            
            return metadata;
        } catch (e) {
            return null;
        }
    },
    
    // Versão segura do getAepVersion
    getAepVersionSafe: function(file) {
        try {
            if (!file || !file.exists) return "N/A";
            
            file.encoding = "BINARY";
            file.open('r');
            var content = file.read(200000); // Lê menos para ser mais rápido
            file.close();
            
            var version = "After Effects";
            
            if (content.indexOf("23.2") > -1) {
                version = "After Effects 2023";
            } else if (content.indexOf("24.") > -1) {
                version = "After Effects 2024";
            } else if (content.indexOf("25.") > -1) {
                version = "After Effects 2025";
            }
            
            return version;
        } catch (e) {
            return "N/A";
        }
    },
    
    // Geração segura de código
    generateCodigoSafe: function(templateName) {
        try {
            if (!templateName) return 'AUTO2025';
            
            var name = templateName.replace(/\.(aep|aet)$/i, '').toUpperCase();
            var year = new Date().getFullYear().toString();
            var cleanName = name.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            
            if (cleanName.length < 4) {
                return cleanName + year;
            }
            
            var words = cleanName.split(' ');
            var codigo = '';
            
            if (words.length >= 2) {
                codigo = words[0].substring(0, 2) + words[1].substring(0, 2) + year;
            } else {
                codigo = cleanName.substring(0, 4) + year;
            }
            
            return codigo.toUpperCase();
        } catch (e) {
            return 'AUTO' + new Date().getFullYear();
        }
    },
    
    // Determinação segura do servidor
    determineServidorSafe: function(name, path) {
        try {
            var nameUpper = (name || '').toUpperCase();
            var pathUpper = (path || '').toUpperCase();
            
            if (nameUpper.indexOf('VIZ') > -1 || pathUpper.indexOf('VIZ') > -1) {
                return 'FTP VIZ';
            }
            if (nameUpper.indexOf('HARDNEWS') > -1 || pathUpper.indexOf('HARDNEWS') > -1) {
                return 'PAM HARDNEWS';
            }
            if (nameUpper.indexOf('ECONOMIA') > -1 || pathUpper.indexOf('ECONOMIA') > -1) {
                return 'FTP ECONOMIA';
            }
            
            return 'SERVIDOR PADRÃO';
        } catch (e) {
            return 'N/A';
        }
    }
};

// ======================= TELA DE CARREGAMENTO ROBUSTA =======================

function showRobustLoadingScreen() {
    var loadingWin = new Window("dialog", "GNEWS Templates", undefined, {closeButton: false});
    loadingWin.orientation = "column";
    loadingWin.alignChildren = ["fill", "center"];
    loadingWin.spacing = 15;
    loadingWin.margins = 25;
    loadingWin.preferredSize = [400, 280];
    
    // Estilo básico sem dependências
    try {
        if (typeof bgColor1 !== 'undefined') {
            loadingWin.graphics.backgroundColor = loadingWin.graphics.newBrush(
                loadingWin.graphics.BrushType.SOLID_COLOR, 
                [0.05, 0.04, 0.04, 1]
            );
        }
    } catch (e) {
        // Usa estilo padrão se der erro
    }
    
    // Header
    var titleText = loadingWin.add("statictext", undefined, "GNEWS TEMPLATES");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
    titleText.alignment = ["center", "center"];
    
    var versionText = loadingWin.add("statictext", undefined, "v2.7 - Sistema Robusto");
    versionText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
    versionText.alignment = ["center", "center"];
    
    // Status
    var statusText = loadingWin.add("statictext", undefined, "Inicializando...");
    statusText.alignment = ["center", "center"];
    statusText.graphics.font = ScriptUI.newFont("Arial", "Regular", 12);
    statusText.preferredSize.height = 30;
    
    // Progress bar
    var progressBar = loadingWin.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize = [350, 12];
    
    // Detail text
    var detailText = loadingWin.add("statictext", undefined, "");
    detailText.alignment = ["center", "center"];
    detailText.graphics.font = ScriptUI.newFont("Arial", "Regular", 10);
    detailText.preferredSize.height = 40;
    
    // System status
    var systemText = loadingWin.add("statictext", undefined, "");
    systemText.alignment = ["center", "center"];
    systemText.graphics.font = ScriptUI.newFont("Arial", "Regular", 9);
    systemText.preferredSize.height = 30;
    
    // Update function
    loadingWin.updateProgress = function(type, progress, detail) {
        try {
            progressBar.value = Math.max(0, Math.min(100, progress));
            
            var statusMessages = {
                'init': 'Verificando sistema...',
                'data': 'Carregando dados...',
                'productions': 'Verificando produções...',
                'templates': 'Carregando templates...',
                'limited': 'Modo limitado...',
                'error': 'Problemas detectados...',
                'complete': 'Sistema pronto!'
            };
            
            statusText.text = statusMessages[type] || 'Processando...';
            
            if (detail) {
                if (type === 'error') {
                    detailText.text = "Verifique os caminhos dos arquivos";
                    systemText.text = "O sistema continuará em modo limitado";
                } else {
                    detailText.text = detail;
                    systemText.text = Math.round(progress) + "% concluído";
                }
            }
            
            loadingWin.update();
        } catch (e) {
            // Ignora erros de UI
        }
    };
    
    return loadingWin;
}

// ======================= FUNÇÃO PRINCIPAL ROBUSTA =======================

function d9TemplateDialogRobust() {
    // Mostra tela de carregamento
    var loadingScreen = showRobustLoadingScreen();
    loadingScreen.show();
    
    // Inicia sistema robusto
    PreloadManagerRobust.init(function(type, progress, detail) {
        loadingScreen.updateProgress(type, progress, detail);
        
        if (type === 'complete' || type === 'error') {
            // Pequeno delay para mostrar o status final
            app.scheduleTask(
                "loadingScreen.hide(); loadingScreen.close(); showSimpleTemplateInterface();", 
                1500, 
                false
            );
        }
    });
}

// ======================= INTERFACE SIMPLES E ROBUSTA =======================

function showSimpleTemplateInterface() {
    var win = new Window("dialog", "GNEWS Templates v2.7", undefined, { resizeable: true });
    win.orientation = "row";
    win.alignChildren = ["fill", "fill"];
    win.spacing = 10;
    win.margins = 15;
    win.preferredSize = [600, 450];
    
    // Painel esquerdo - seleção
    var leftPanel = win.add("panel", undefined, "TEMPLATES");
    leftPanel.orientation = "column";
    leftPanel.alignChildren = ["fill", "fill"];
    leftPanel.alignment = ["fill", "fill"];
    leftPanel.preferredSize = [300, -1];
    leftPanel.margins = 10;
    leftPanel.spacing = 10;
    
    // Dropdown de produções
    var prodGroup = leftPanel.add("group");
    prodGroup.orientation = "row";
    prodGroup.alignChildren = ["fill", "center"];
    
    var prodLabel = prodGroup.add("statictext", undefined, "Produção:");
    prodLabel.preferredSize.width = 60;
    
    var prodDropdown = prodGroup.add("dropdownlist", undefined, []);
    prodDropdown.alignment = ["fill", "center"];
    
    // Popula produções disponíveis
    var validProductions = [];
    if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray) {
        for (var i = 0; i < D9T_prodArray.length; i++) {
            var prod = D9T_prodArray[i];
            if (FileSystemChecker.safeFolderExists(prod.templatesPath)) {
                validProductions.push(prod);
                prodDropdown.add("item", prod.name);
            }
        }
    }
    
    if (validProductions.length === 0) {
        prodDropdown.add("item", "Nenhuma produção válida");
    }
    
    prodDropdown.selection = 0;
    
    // Lista de templates
    var templatesList = leftPanel.add("listbox", undefined, []);
    templatesList.alignment = ["fill", "fill"];
    templatesList.preferredSize = [-1, 250];
    
    // Botões de controle
    var controlGroup = leftPanel.add("group");
    controlGroup.orientation = "row";
    controlGroup.alignment = ["fill", "bottom"];
    
    var refreshBtn = controlGroup.add("button", undefined, "Atualizar");
    var openBtn = controlGroup.add("button", undefined, "Abrir Pasta");
    
    // Painel direito - informações
    var rightPanel = win.add("panel", undefined, "INFORMAÇÕES");
    rightPanel.orientation = "column";
    rightPanel.alignChildren = ["fill", "top"];
    rightPanel.alignment = ["fill", "fill"];
    rightPanel.margins = 10;
    rightPanel.spacing = 10;
    
    // Informações do template
    var infoGroup = rightPanel.add("group");
    infoGroup.orientation = "column";
    infoGroup.alignChildren = ["fill", "top"];
    infoGroup.spacing = 8;
    
    var templateNameText = infoGroup.add("statictext", undefined, "Template: ---");
    templateNameText.preferredSize.width = 250;
    
    var pathText = infoGroup.add("statictext", undefined, "Caminho: ---");
    pathText.preferredSize.width = 250;
    
    var sizeText = infoGroup.add("statictext", undefined, "Tamanho: ---");
    var dateText = infoGroup.add("statictext", undefined, "Modificado: ---");
    
    // Código GNEWS
    var codigoGroup = rightPanel.add("group");
    codigoGroup.orientation = "row";
    codigoGroup.alignChildren = ["left", "center"];
    
    var codigoLabel = codigoGroup.add("statictext", undefined, "Código:");
    codigoLabel.preferredSize.width = 50;
    
    var codigoText = codigoGroup.add("edittext", undefined, "");
    codigoText.preferredSize = [120, 24];
    
    // Botões de ação
    var actionGroup = rightPanel.add("group");
    actionGroup.orientation = "row";
    actionGroup.alignment = ["fill", "bottom"];
    actionGroup.spacing = 10;
    
    var importBtn = actionGroup.add("button", undefined, "IMPORTAR");
    importBtn.preferredSize = [100, 35];
    importBtn.enabled = false;
    
    var helpBtn = actionGroup.add("button", undefined, "AJUDA");
    helpBtn.preferredSize = [80, 35];
    
    var closeBtn = actionGroup.add("button", undefined, "FECHAR");
    closeBtn.preferredSize = [80, 35];
    
    // Variáveis de estado
    var currentProduction = null;
    var currentTemplate = null;
    
    // === FUNÇÕES DA INTERFACE ===
    
    // Atualiza lista de templates
    function updateTemplatesList() {
        templatesList.removeAll();
        currentTemplate = null;
        updateTemplateInfo();
        
        if (!currentProduction) return;
        
        var templates = getTemplatesSafe(currentProduction);
        
        for (var i = 0; i < templates.length; i++) {
            var template = templates[i];
            var displayName = template.name;
            
            // Remove extensão para exibição mais limpa
            displayName = displayName.replace(/\.(aep|aet)$/i, '');
            
            var item = templatesList.add("item", displayName);
            item.templateData = template;
        }
        
        if (templates.length === 0) {
            templatesList.add("item", "Nenhum template encontrado");
        }
    }
    
    // Atualiza informações do template selecionado
    function updateTemplateInfo() {
        if (!currentTemplate) {
            templateNameText.text = "Template: ---";
            pathText.text = "Caminho: ---";
            sizeText.text = "Tamanho: ---";
            dateText.text = "Modificado: ---";
            codigoText.text = "";
            importBtn.enabled = false;
            return;
        }
        
        try {
            templateNameText.text = "Template: " + currentTemplate.name;
            pathText.text = "Caminho: " + currentTemplate.path.substring(0, 60) + "...";
            
            var sizeKB = Math.round(currentTemplate.size / 1024);
            sizeText.text = "Tamanho: " + sizeKB + " KB";
            
            var dateStr = currentTemplate.modified.toLocaleDateString();
            dateText.text = "Modificado: " + dateStr;
            
            // Gera código automaticamente
            var codigo = PreloadManagerRobust.generateCodigoSafe(currentTemplate.name);
            codigoText.text = codigo;
            
            importBtn.enabled = true;
        } catch (e) {
            templateNameText.text = "Template: " + (currentTemplate.name || "Erro");
            pathText.text = "Caminho: ---";
            sizeText.text = "Tamanho: ---";
            dateText.text = "Modificado: ---";
            codigoText.text = "";
            importBtn.enabled = false;
        }
    }
    
    // Obtém templates de forma segura
    function getTemplatesSafe(production) {
        try {
            var prodKey = PreloadManagerRobust.getProductionKey(production);
            var cachedTemplates = PreloadManagerRobust.cache.templates[prodKey];
            
            if (cachedTemplates) {
                var templates = [];
                for (var fileKey in cachedTemplates) {
                    var template = cachedTemplates[fileKey];
                    if (template.file && template.file.exists) {
                        templates.push(template);
                    }
                }
                return templates;
            }
            
            // Se não há cache, faz busca direta
            return getTemplatesDirectly(production);
        } catch (e) {
            return [];
        }
    }
    
    // Busca direta de templates (fallback)
    function getTemplatesDirectly(production) {
        try {
            var templates = [];
            var files = FileSystemChecker.safeGetFiles(production.templatesPath);
            
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File && file.exists) {
                    var ext = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
                    if (ext === '.aep' || ext === '.aet') {
                        templates.push({
                            file: file,
                            name: file.displayName || file.name,
                            path: file.fullName,
                            modified: file.modified || new Date(),
                            size: file.length || 0
                        });
                    }
                }
            }
            
            return templates;
        } catch (e) {
            return [];
        }
    }
    
    // Importa template de forma segura
    function importTemplateSafe() {
        if (!currentTemplate || !currentTemplate.file) {
            alert("Nenhum template selecionado!");
            return;
        }
        
        try {
            var file = currentTemplate.file;
            
            // Verifica se arquivo ainda existe
            if (!file.exists) {
                alert("Arquivo não encontrado: " + file.name + "\n\nO arquivo pode ter sido movido ou excluído.");
                return;
            }
            
            // Tenta importar
            var importOptions = new ImportOptions(file);
            var item = app.project.importFile(importOptions);
            
            if (item) {
                // Log de sucesso
                var logInfo = {
                    template: file.name,
                    codigo: codigoText.text,
                    production: currentProduction ? currentProduction.name : 'N/A',
                    timestamp: new Date().toLocaleString(),
                    size: currentTemplate.size,
                    path: file.fullName
                };
                
                writeln("GNEWS IMPORT SUCCESS: " + JSON.stringify(logInfo));
                
                var successMsg = "Template importado com sucesso!\n\n" +
                               "Arquivo: " + file.name + "\n" +
                               "Código: " + codigoText.text + "\n" +
                               "Produção: " + (currentProduction ? currentProduction.name : 'N/A');
                
                alert(successMsg);
                
                // Fecha janela após importação bem-sucedida
                win.close();
            } else {
                alert("Falha ao importar o template.\n\nVerifique se o arquivo é um projeto válido do After Effects.");
            }
        } catch (e) {
            var errorMsg = "Erro ao importar template:\n\n" + e.message;
            
            if (e.message.indexOf("file format") > -1) {
                errorMsg += "\n\nO arquivo pode estar corrompido ou ser de uma versão incompatível.";
            }
            
            alert(errorMsg);
        }
    }
    
    // === EVENTOS DA INTERFACE ===
    
    // Mudança de produção
    prodDropdown.onChange = function() {
        if (this.selection && validProductions[this.selection.index]) {
            currentProduction = validProductions[this.selection.index];
            updateTemplatesList();
        }
    };
    
    // Seleção de template
    templatesList.onChange = function() {
        if (this.selection && this.selection.templateData) {
            currentTemplate = this.selection.templateData;
            updateTemplateInfo();
        }
    };
    
    // Duplo clique para importar
    templatesList.onDoubleClick = function() {
        if (this.selection && this.selection.templateData) {
            currentTemplate = this.selection.templateData;
            updateTemplateInfo();
            importTemplateSafe();
        }
    };
    
    // Botão atualizar
    refreshBtn.onClick = function() {
        if (currentProduction) {
            // Limpa cache da produção atual
            var prodKey = PreloadManagerRobust.getProductionKey(currentProduction);
            if (PreloadManagerRobust.cache.templates[prodKey]) {
                delete PreloadManagerRobust.cache.templates[prodKey];
            }
            
            updateTemplatesList();
            alert("Lista de templates atualizada!");
        }
    };
    
    // Botão abrir pasta
    openBtn.onClick = function() {
        if (currentProduction && FileSystemChecker.safeFolderExists(currentProduction.templatesPath)) {
            try {
                var folder = new Folder(currentProduction.templatesPath);
                folder.execute();
            } catch (e) {
                alert("Não foi possível abrir a pasta:\n" + currentProduction.templatesPath);
            }
        } else {
            alert("Pasta da produção não encontrada!");
        }
    };
    
    // Botão importar
    importBtn.onClick = function() {
        importTemplateSafe();
    };
    
    // Botão ajuda
    helpBtn.onClick = function() {
        showHelpDialogSimple();
    };
    
    // Botão fechar
    closeBtn.onClick = function() {
        win.close();
    };
    
    // Busca por código GNEWS
    codigoText.onChanging = function() {
        if (this.text.length >= 3) {
            var arteData = PreloadManagerRobust.getArteData(this.text);
            if (arteData) {
                // Atualiza informações baseadas no código
                templateNameText.text = "Arte: " + (arteData.nome_arte || "---");
                
                var serverInfo = arteData.servidor_destino || "---";
                pathText.text = "Servidor: " + serverInfo;
                
                var updateInfo = arteData.ultima_atualizacao || "---";
                dateText.text = "Última Atualização: " + updateInfo;
            }
        }
    };
    
    // === INICIALIZAÇÃO DA INTERFACE ===
    
    // Define produção inicial
    if (validProductions.length > 0) {
        currentProduction = validProductions[0];
        updateTemplatesList();
    }
    
    // Mostra janela
    win.show();
}

// ======================= DIÁLOGO DE AJUDA SIMPLES =======================

function showHelpDialogSimple() {
    var helpWin = new Window("dialog", "GNEWS Templates - Ajuda", undefined, { closeButton: true });
    helpWin.orientation = "column";
    helpWin.alignChildren = ["fill", "fill"];
    helpWin.spacing = 15;
    helpWin.margins = 20;
    helpWin.preferredSize = [450, 500];
    
    var titleText = helpWin.add("statictext", undefined, "GNEWS TEMPLATES v2.7");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
    titleText.alignment = ["center", "center"];
    
    var subtitleText = helpWin.add("statictext", undefined, "Sistema Robusto com Tratamento de Erros");
    subtitleText.graphics.font = ScriptUI.newFont("Arial", "Regular", 12);
    subtitleText.alignment = ["center", "center"];
    
    var helpContent = helpWin.add("statictext", undefined, 
        "COMO USAR:\n\n" +
        "1. SELEÇÃO DE PRODUÇÃO\n" +
        "   • Use o dropdown para escolher a produção\n" +
        "   • Apenas produções válidas são mostradas\n\n" +
        "2. ESCOLHA DO TEMPLATE\n" +
        "   • Clique em um template na lista\n" +
        "   • Duplo clique importa diretamente\n" +
        "   • Informações aparecem à direita\n\n" +
        "3. CÓDIGO GNEWS\n" +
        "   • Gerado automaticamente\n" +
        "   • Pode ser editado manualmente\n" +
        "   • Busca informações da arte\n\n" +
        "4. IMPORTAÇÃO\n" +
        "   • Botão IMPORTAR ou duplo clique\n" +
        "   • Verificação de arquivo antes da importação\n" +
        "   • Log detalhado no console\n\n" +
        "5. CONTROLES\n" +
        "   • ATUALIZAR: Recarrega lista de templates\n" +
        "   • ABRIR PASTA: Abre diretório da produção\n\n" +
        "NOVIDADES v2.7:\n" +
        "• Sistema robusto anti-erros\n" +
        "• Verificação de arquivos\n" +
        "• Modo limitado para emergências\n" +
        "• Tratamento de caminhos inválidos\n" +
        "• Cache inteligente otimizado", 
        { multiline: true });
    
    helpContent.alignment = ["fill", "fill"];
    helpContent.graphics.font = ScriptUI.newFont("Arial", "Regular", 10);
    
    var problemsText = helpWin.add("statictext", undefined,
        "SOLUÇÃO DE PROBLEMAS:\n\n" +
        "• 'File not found': Verifique se os caminhos das produções estão corretos\n" +
        "• Lista vazia: Use ATUALIZAR ou verifique permissões da pasta\n" +
        "• Importação falha: Arquivo pode estar corrompido ou incompatível\n" +
        "• Modo limitado: Sistema detectou problemas nos caminhos",
        { multiline: true });
    
    problemsText.alignment = ["fill", "fill"];
    problemsText.graphics.font = ScriptUI.newFont("Arial", "Regular", 9);
    
    var okBtn = helpWin.add("button", undefined, "OK");
    okBtn.alignment = ["center", "bottom"];
    okBtn.preferredSize = [100, 30];
    okBtn.onClick = function() { helpWin.close(); };
    
    helpWin.show();
}

// ======================= FUNÇÕES DE COMPATIBILIDADE =======================

// Para manter compatibilidade com código existente
function getTemplatesCached(production) {
    return getTemplatesSafe(production);
}

function getTemplateMetadataCached(production, templateFile) {
    var prodKey = PreloadManagerRobust.getProductionKey(production);
    var fileKey = PreloadManagerRobust.getFileKey(templateFile);
    return PreloadManagerRobust.loadTemplateMetadataSafe(prodKey, fileKey);
}

// Função principal para chamada externa
function d9TemplateDialog() {
    d9TemplateDialogRobust();
}

// ======================= DIAGNÓSTICO DO SISTEMA =======================

function diagnosticGNEWS() {
    var diagnostic = [];
    
    diagnostic.push("=== DIAGNÓSTICO GNEWS TEMPLATES v2.7 ===\n");
    
    // Verifica variáveis globais
    diagnostic.push("VARIÁVEIS GLOBAIS:");
    diagnostic.push("• scriptMainPath: " + (typeof scriptMainPath !== 'undefined' ? "OK" : "INDEFINIDA"));
    diagnostic.push("• D9T_prodArray: " + (typeof D9T_prodArray !== 'undefined' ? "OK (" + D9T_prodArray.length + " itens)" : "INDEFINIDA"));
    diagnostic.push("");
    
    // Verifica sistema de arquivos
    var fsStatus = FileSystemChecker.init();
    diagnostic.push("SISTEMA DE ARQUIVOS:");
    diagnostic.push("• Status geral: " + (fsStatus.ready ? "OK" : "PROBLEMAS DETECTADOS"));
    diagnostic.push("• Pasta principal: " + (fsStatus.paths.scriptMainPath ? "OK" : "NÃO ENCONTRADA"));
    diagnostic.push("• Config file: " + (fsStatus.paths.configFile ? "OK" : "NÃO ENCONTRADO"));
    diagnostic.push("• Dados artes: " + (fsStatus.paths.artesDataFile ? "OK" : "NÃO ENCONTRADO"));
    diagnostic.push("• Pasta ícones: " + (fsStatus.paths.iconsPath ? "OK" : "NÃO ENCONTRADA"));
    diagnostic.push("• Pasta temp: " + (fsStatus.paths.tempPath ? "OK" : "NÃO ENCONTRADA"));
    diagnostic.push("");
    
    // Lista problemas
    if (fsStatus.issues.length > 0) {
        diagnostic.push("PROBLEMAS ENCONTRADOS:");
        for (var i = 0; i < fsStatus.issues.length; i++) {
            diagnostic.push("• " + fsStatus.issues[i]);
        }
        diagnostic.push("");
    }
    
    if (fsStatus.warnings.length > 0) {
        diagnostic.push("AVISOS:");
        for (var w = 0; w < fsStatus.warnings.length; w++) {
            diagnostic.push("• " + fsStatus.warnings[w]);
        }
        diagnostic.push("");
    }
    
    // Verifica produções
    diagnostic.push("PRODUÇÕES:");
    if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray) {
        var validProds = 0;
        for (var p = 0; p < D9T_prodArray.length; p++) {
            var prod = D9T_prodArray[p];
            var valid = FileSystemChecker.safeFolderExists(prod.templatesPath);
            diagnostic.push("• " + prod.name + ": " + (valid ? "OK" : "PASTA INVÁLIDA"));
            if (valid) validProds++;
        }
        diagnostic.push("• Total válidas: " + validProds + "/" + D9T_prodArray.length);
    } else {
        diagnostic.push("• Nenhuma produção configurada");
    }
    diagnostic.push("");
    
    // Cache status
    diagnostic.push("CACHE:");
    var cacheCount = 0;
    for (var cache in PreloadManagerRobust.cache.templates) {
        var templates = PreloadManagerRobust.cache.templates[cache];
        var count = 0;
        for (var t in templates) count++;
        diagnostic.push("• " + cache + ": " + count + " templates");
        cacheCount += count;
    }
    diagnostic.push("• Total em cache: " + cacheCount);
    diagnostic.push("");
    
    diagnostic.push("=== FIM DO DIAGNÓSTICO ===");
    
    var diagnosticText = diagnostic.join("\n");
    
    // Mostra em janela
    var diagWin = new Window("dialog", "Diagnóstico GNEWS", undefined, { closeButton: true });
    diagWin.orientation = "column";
    diagWin.alignChildren = ["fill", "fill"];
    diagWin.margins = 15;
    diagWin.spacing = 10;
    diagWin.preferredSize = [500, 600];
    
    var textArea = diagWin.add("edittext", undefined, diagnosticText, { multiline: true, readonly: true });
    textArea.alignment = ["fill", "fill"];
    textArea.graphics.font = ScriptUI.newFont("Courier New", "Regular", 9);
    
    var btnGroup = diagWin.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignment = ["center", "bottom"];
    
    var copyBtn = btnGroup.add("button", undefined, "Copiar");
    copyBtn.onClick = function() {
        system.callSystem("echo '" + diagnosticText.replace(/'/g, "\\'") + "' | pbcopy");
        alert("Diagnóstico copiado para área de transferência!");
    };
    
    var okBtn = btnGroup.add("button", undefined, "OK");
    okBtn.onClick = function() { diagWin.close(); };
    
    diagWin.show();
    
    return diagnosticText;
}