// =============================================================================
// TEMPLATES_configWin.js - v3.2 (Modificado)
// DESCRICAO:
//   - ADICIONADO: Janela de progresso e botao de "Cancelar"
//     ao gerar o cache.
//   - Le e Salva configuracoes DIRETAMENTE do System_Settings.json.
// =============================================================================

function d9ProdFoldersDialog() { // REMOVIDO: "prodArray" como argumento
    var scriptName = 'CONFIGURACAO DE CAMINHOS';
    
    // --- Funcoes de Leitura/Escrita do System_Settings.json ---
    // Validacao do caminho principal de preferencias
    if (typeof scriptPreferencesPath === 'undefined') {
        alert("ERRO CRITICO: A variavel 'scriptPreferencesPath' nao esta definida. Impossivel carregar ou salvar configuracoes.");
        return;
    }
    var systemSettingsFile = new File(scriptPreferencesPath + "/System_Settings.json");
    var cacheFolder = new Folder(scriptPreferencesPath + '/cache');
    if (!cacheFolder.exists) cacheFolder.create();

    var logsFolder = new Folder(scriptPreferencesPath + '/logs');
    if (!logsFolder.exists) { try { logsFolder.create(); } catch (logErr) {} }
    var cacheLogFile = new File(logsFolder.fullName + '/templates_cache.log');

    function writeLogLine(level, message) {
        if (!cacheLogFile) { return; }
        var stamp = new Date().toUTCString();
        var line = '[' + stamp + '][' + level + '] ' + message + '\n';
        try {
            cacheLogFile.open('a');
            cacheLogFile.encoding = 'UTF-8';
            cacheLogFile.write(line);
            cacheLogFile.close();
        } catch (logWriteErr) {}
    }

    function logInfo(message) { writeLogLine('INFO', message); }
    function logWarn(message) { writeLogLine('WARN', message); }
    function logError(message) { writeLogLine('ERROR', message); }

    var manifestFile = new File(cacheFolder.fullName + '/templates_cache_manifest.json');

    function readCacheManifest() {
        if (!manifestFile.exists) { return {}; }
        try {
            manifestFile.open('r');
            manifestFile.encoding = 'UTF-8';
            var raw = manifestFile.read();
            manifestFile.close();
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            try { manifestFile.close(); } catch (closeErr) {}
            logWarn('Falha ao ler templates_cache_manifest.json: ' + e.message);
            return {};
        }
    }

    function writeCacheManifest(data) {
        try {
            manifestFile.open('w');
            manifestFile.encoding = 'UTF-8';
            manifestFile.write(JSON.stringify(data, null, 2));
            manifestFile.close();
        } catch (e) {
            try { manifestFile.close(); } catch (closeErr) {}
            logWarn('Nao foi possivel salvar templates_cache_manifest.json: ' + e.message);
        }
    }

    function computeTreeHash(treeData) {
        var hash = 0;
        function walk(entries) {
            if (!(entries instanceof Array)) { return; }
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (!entry || typeof entry !== 'object') { continue; }
                var base = (entry.text || '') + '|' + (entry.filePath || '') + '|' + (entry.signature || '');
                for (var j = 0; j < base.length; j++) {
                    hash = ((hash << 5) - hash) + base.charCodeAt(j);
                    hash = hash & hash;
                }
                if (entry.children) { walk(entry.children); }
            }
        }
        walk(treeData);
        return (hash >>> 0).toString(16);
    }

    function readSystemSettings() {
        if (systemSettingsFile.exists) {
            try {
                systemSettingsFile.open('r');
                systemSettingsFile.encoding = 'UTF-8';
                var content = systemSettingsFile.read();
                systemSettingsFile.close();
                return JSON.parse(content);
            } catch (e) {
                alert("Erro ao ler ou processar 'System_Settings.json'.\n" + e.toString());
                return {}; // Retorna objeto vazio em vez de null
            }
        }
        return {}; // Retorna objeto vazio se o arquivo nao existir
    }

    function writeSystemSettings(data) {
        try {
            systemSettingsFile.open('w');
            systemSettingsFile.encoding = 'UTF-8';
            systemSettingsFile.write(JSON.stringify(data, null, 4));
            systemSettingsFile.close();
            return true;
        } catch (e) {
            alert("Falha ao salvar 'System_Settings.json'.\n" + e.toString());
            return false;
        }
    }
    // --- Fim das Funcoes de Leitura/Escrita ---

    function setupButtonClick(btn, func) {
        if (!btn || typeof func !== 'function') {
            return;
        }
        if (btn.leftClick) {
            btn.leftClick.onClick = func;
        } else {
            btn.onClick = func;
        }
    }

    function hasPath(pathArray, candidate) {
        if (!pathArray || !candidate) {
            return false;
        }
        var candidateLower = candidate.toLowerCase();
        for (var i = 0; i < pathArray.length; i++) {
            var current = pathArray[i];
            if (typeof current === 'string' && current.toLowerCase() === candidateLower) {
                return true;
            }
        }
        return false;
    }

    var fileFilter = ['.aep', '.aet'];
    var allowedExtensions = ['.aep', '.aet'];
    var MAX_SCAN_DEPTH = -1; // -1 = sem limite de profundidade

    // Lista de categorias que a janela ira exibir.
    var categorias = [
        { nome: 'JORNAIS',       key: 'jornais',      caminhos: [] },
        { nome: 'ILUSTRACOES',   key: 'ilustracoes',  caminhos: [] },
        { nome: 'BASE TEMATICA', key: 'basetematica', caminhos: [] },
        { nome: 'PROGRAMAS',     key: 'programas',    caminhos: [] }, // Corrigido
        { nome: 'EVENTOS',       key: 'eventos',      caminhos: [] },
        { nome: 'MARKETING',     key: 'marketing',    caminhos: [] },
        { nome: 'PROMO',         key: 'promo',        caminhos: [] }
    ];
    
    // --- LeGICA DE LEITURA (Modificada para ler System_Settings.json) ---
    try {
        var settings = readSystemSettings();
        var prodArray = [];

        if (settings && settings.TEMPLATES_Settings && settings.TEMPLATES_Settings.PRODUCTIONS) {
            prodArray = settings.TEMPLATES_Settings.PRODUCTIONS;
        } else {
             throw new Error("A chave 'TEMPLATES_Settings.PRODUCTIONS' nao foi encontrada no System_Settings.json.");
        }

        if (typeof prodArray !== 'undefined' && prodArray.length > 0) {
            // Loop em cada categoria da UI (JORNALISMO, ILUSTRACOES, etc.)
            for (var i = 0; i < categorias.length; i++) {
                var found = false;
                // Loop nos dados de producao carregados do JSON
                for (var j = 0; j < prodArray.length; j++) {
                    // Compara se o nome do JSON corresponde ao nome da categoria
                    if (prodArray[j].name.toUpperCase() === categorias[i].nome.toUpperCase()) {
                        // Se corresponder, carrega os caminhos
                        categorias[i].caminhos = prodArray[j].paths || [Folder.desktop.fullName];
                        found = true;
                        break;
                    }
                }
                // Se nao encontrar correspondencia no JSON, usa o caminho padrao
                if (!found) {
                    categorias[i].caminhos = [Folder.desktop.fullName];
                }
            }
        } else {
            throw new Error("O array de producoes esta vazio ou indefinido.");
        }
    } catch (e) {
        alert("ERRO AO PROCESSAR DADOS DE CONFIGURACAO:\n" + e.message + "\n\nCarregando caminhos padrao.");
        var desktopPath = Folder.desktop.fullName;
        for (var k = 0; k < categorias.length; k++) {
            categorias[k].caminhos = [desktopPath];
        }
    }
    
    var D9T_CONFIG_w = new Window('palette', scriptName + (typeof scriptVersion !== 'undefined' ? ' ' + scriptVersion : ''));
    D9T_CONFIG_w.orientation = 'column';
    D9T_CONFIG_w.alignChildren = ['center', 'top'];
    D9T_CONFIG_w.spacing = 12;
    D9T_CONFIG_w.margins = 16;
    
    var headerGrp = D9T_CONFIG_w.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'column';
    headerGrp.alignChildren = ['left', 'top'];
    headerGrp.spacing = 2;


    var subtitleTxt = headerGrp.add('statictext', undefined, 'Gerencie os diretorios das categorias e gere caches atualizados.');
    if (typeof setFgColor === 'function') { setFgColor(subtitleTxt, '#D4003C'); }
    
    var mainGrp = D9T_CONFIG_w.add('group', undefined);
    mainGrp.orientation = 'column';
    mainGrp.spacing = 16;
    
    for (var c = 0; c < categorias.length; c++) {
        var categoria = categorias[c];
        var newDiv;
        try { newDiv = themeDivider(mainGrp); newDiv.alignment = ['fill', 'center']; } catch (e) { newDiv = mainGrp.add('panel'); newDiv.alignment = ['fill', 'center']; newDiv.preferredSize.height = 1; }
        
        var catHeaderGrp = mainGrp.add('group', undefined);
        catHeaderGrp.alignment = ['fill', 'center'];
        catHeaderGrp.spacing = 8;
        
        var catLab = catHeaderGrp.add('statictext', undefined, categoria.nome + ':');
        catLab.preferredSize.width = 150;
        catLab.properties = { categoryKey: categoria.key };
        try { setFgColor(catLab, normalColor1); } catch (e) {}
        
        var catAddBtn;
        try { catAddBtn = new themeIconButton(catHeaderGrp, { icon: D9T_MAIS_ICON, tips: [lClick + 'adicionar caminho(s)'] }); } catch (e) { catAddBtn = catHeaderGrp.add('button', undefined, '+'); catAddBtn.preferredSize = [24, 24]; catAddBtn.helpTip = 'adicionar caminho(s)'; }
        
        var catPathsGrp = mainGrp.add('group', undefined);
        catPathsGrp.orientation = 'column';
        catPathsGrp.alignChildren = 'fill';
        catPathsGrp.spacing = 4;
        catPathsGrp.margins = [20, 0, 0, 0];
        
        (function(grp, cat) {
            for (var p = 0; p < cat.caminhos.length; p++) {
                addPathLine(grp, cat.caminhos[p], cat.nome, cat.key);
            }
            
            setupButtonClick(catAddBtn, function() {
                var keepAdding = true;
                do {
                    var newFolder = Folder.selectDialog('Selecione uma pasta para ' + cat.nome);
                    if (newFolder) {
                        addPathLine(grp, newFolder.fullName, cat.nome, cat.key);
                        keepAdding = confirm('Deseja adicionar outro caminho para esta categoria?');
                    } else {
                        keepAdding = false;
                    }
                } while (keepAdding);
                D9T_CONFIG_w.layout.layout(true);
            });
        })(catPathsGrp, categoria);
    }
    
    function getPathLabelValue(labelCtrl) {
        if (!labelCtrl) {
            return '';
        }
        if (typeof labelCtrl.d9PathValue === 'string' && labelCtrl.d9PathValue.length > 0) {
            return labelCtrl.d9PathValue;
        }
        if (labelCtrl.properties && typeof labelCtrl.properties.pathValue === 'string' && labelCtrl.properties.pathValue.length > 0) {
            return labelCtrl.properties.pathValue;
        }
        return labelCtrl.text || '';
    }

    function setPathLabelValue(labelCtrl, newValue) {
        if (!labelCtrl) {
            return;
        }
        labelCtrl.d9PathValue = newValue;
        try {
            if (labelCtrl.properties) {
                labelCtrl.properties.pathValue = newValue;
            }
        } catch (e) {}
        if (typeof newValue === 'string') {
            labelCtrl.text = newValue;
            labelCtrl.helpTip = 'caminho da pasta (clique para alterar):\n\n' + newValue;
        }
    }

    function validateConfiguredPath(labelCtrl, showDialog) {
        if (!labelCtrl) { return false; }
        var pathStr = getPathLabelValue(labelCtrl);
        var folder = pathStr ? new Folder(pathStr) : null;
        var exists = (folder && folder.exists);
        try { setFgColor(labelCtrl, exists ? '#2E8B57' : '#DC143C'); } catch (colorErr) {}
        if (showDialog) {
            if (exists) {
                alert("Sucesso! O caminho e valido e a pasta existe.");
            } else {
                alert("Falha! O caminho nao existe ou esta inacessivel.");
            }
        }
        return exists;
    }

    function generateFolderTreeAsync(rootFolder, filterArray, progressObject, onComplete) {
        if (!(rootFolder instanceof Folder)) {
            if (typeof onComplete === 'function') { onComplete({ tree: [], metadata: [] }, false, "Pasta invalida."); }
            return;
        }
        if (!rootFolder.exists) {
            if (typeof onComplete === 'function') { onComplete({ tree: [], metadata: [] }, false, "A pasta nao existe."); }
            return;
        }

        var effectiveFilters = (filterArray instanceof Array && filterArray.length) ? filterArray.slice(0) : allowedExtensions.slice(0);
        for (var ef = 0; ef < effectiveFilters.length; ef++) {
            if (typeof effectiveFilters[ef] === 'string') { effectiveFilters[ef] = effectiveFilters[ef].toLowerCase(); }
        }

        var ignoreFolderNames = [
            'auto-save',
            'old',
            'adobe after effects auto-save',
            'versoes antigas',
            'backup',
            'old versions',
            '__macosx'
        ];
        for (var ifn = 0; ifn < ignoreFolderNames.length; ifn++) {
            ignoreFolderNames[ifn] = ignoreFolderNames[ifn].toLowerCase();
        }

        var ignoreNameContains = ['auto-save', 'tmpaetoame'];
        var ignoreFileNames = ['thumbs.db'];
        for (var ign = 0; ign < ignoreFileNames.length; ign++) {
            ignoreFileNames[ign] = ignoreFileNames[ign].toLowerCase();
        }

        var MAX_ITEMS_PER_FOLDER_PASS = 40;
        var SLOW_FOLDER_THRESHOLD_MS = 2000;
        var MAX_SLOW_FOLDER_ATTEMPTS = 1;
        var slowFolderTracker = {};
        var skippedProblemFolders = [];

        function decodePercentString(value) {
            if (typeof value !== 'string' || value === '') { return ''; }
            var result = value;
            if (result.indexOf('%') !== -1) {
                try { result = decodeURIComponent(result); } catch (decodeErr) {}
                try { result = Folder.decode(result); } catch (decodeErr2) {}
            }
            return result;
        }

        function fileMatchesFilter(fileName) {
            if (!fileName || typeof fileName !== 'string') { return false; }
            if (!effectiveFilters.length) { return true; }
            var lower = fileName.toLowerCase();
            for (var i = 0; i < effectiveFilters.length; i++) {
                var filter = effectiveFilters[i];
                if (typeof filter === 'string' && filter.length > 0 && lower.indexOf(filter) !== -1) {
                    return true;
                }
            }
            return false;
        }

        function hasIgnoredSubstring(valueLower) {
            if (!valueLower) { return false; }
            for (var i = 0; i < ignoreNameContains.length; i++) {
                if (valueLower.indexOf(ignoreNameContains[i]) !== -1) { return true; }
            }
            return false;
        }

        function shouldIgnoreFolder(folderNameLower) {
            if (!folderNameLower) { return false; }
            if (hasIgnoredSubstring(folderNameLower)) { return true; }
            for (var i = 0; i < ignoreFolderNames.length; i++) {
                if (folderNameLower === ignoreFolderNames[i]) { return true; }
            }
            return false;
        }

        function shouldIgnoreFile(fileNameLower) {
            if (!fileNameLower) { return true; }
            if (hasIgnoredSubstring(fileNameLower)) { return true; }
            for (var i = 0; i < ignoreFileNames.length; i++) {
                if (fileNameLower === ignoreFileNames[i]) { return true; }
            }
            return false;
        }

        function computeEntrySignature(name, filePath, modDate, size) {
            var base = (name || '') + '|' + (filePath || '') + '|' + (modDate || '') + '|' + (size || 0);
            var hash = 0;
            for (var i = 0; i < base.length; i++) {
                hash = ((hash << 5) - hash) + base.charCodeAt(i);
                hash = hash & hash;
            }
            return (hash >>> 0).toString(16);
        }

        var MAX_FOLDER_ITERATIONS_PER_CHUNK = 4;

        function ensureProgressWindowVisible(progressWindow) {
            if (!progressWindow) { return; }
            try { progressWindow.active = true; } catch (focusErr0) {}
            try {
                if (typeof progressWindow.bringToFront === 'function') { progressWindow.bringToFront(); }
            } catch (focusErr1) {}
            try { progressWindow.update(); } catch (focusErr2) {}
        }

        var rootFolderPath = rootFolder.fsName || rootFolder.fullName || rootFolder.displayName || '';
        var pending = [];
        var visited = {};
        var treeResult = [];
        var metadataResult = [];

        function enqueueFolder(folder, targetArray, depth, parents) {
            if (!(folder instanceof Folder)) { return; }
            var folderKey = folder.fsName || folder.fullName || '';
            if (!folderKey) { return; }
            if (visited[folderKey]) { return; }
            visited[folderKey] = true;
            pending.push({
                folder: folder,
                folderKey: folderKey,
                targetArray: targetArray,
                depth: depth || 0,
                parents: parents ? parents.slice(0) : [],
                items: null,
                nextIndex: 0
            });
        }

        enqueueFolder(rootFolder, treeResult, 0, []);

        if (!pending.length) {
            if (typeof onComplete === 'function') { onComplete({ tree: [], metadata: [] }, false); }
            return;
        }

        var taskName = '__d9tCacheTask_' + (new Date().getTime()) + '_' + Math.floor(Math.random() * 1000);
        if (progressObject) {
            progressObject.asyncTaskName = taskName;
            progressObject.asyncTaskId = null;
        }

        function finalize(cancelled, errorMessage) {
            if (cancelled) {
                logWarn("Escaneamento cancelado para " + rootFolderPath);
            } else if (errorMessage) {
                logError("Falha ao escanear " + rootFolderPath + ": " + errorMessage);
            } else {
                logInfo("Escaneamento concluido para " + rootFolderPath + " (itens=" + treeResult.length + ")");
            }
            if (skippedProblemFolders.length) {
                logWarn("Pastas ignoradas em " + rootFolderPath + ": " + skippedProblemFolders.join(', '));
            }
            if (progressObject) {
                progressObject.asyncTaskId = null;
                progressObject.asyncTaskName = null;
            }
            try { delete $.global[taskName]; } catch (deleteErr) {}
            if (typeof onComplete === 'function') {
                var resultPayload = {
                    tree: treeResult,
                    metadata: metadataResult,
                    skippedFolders: skippedProblemFolders.slice(0)
                };
                onComplete(resultPayload, cancelled, errorMessage);
            }
        }

        function processChunk() {
            if (progressObject) { progressObject.asyncTaskId = null; }
            if (progressObject && progressObject.window && progressObject.window.__keepFocus) {
                ensureProgressWindowVisible(progressObject.window);
            }
            if (progressObject && progressObject.isCancelled) {
                finalize(true);
                return;
            }

            var iterations = 0;
            while (pending.length > 0 && iterations < MAX_FOLDER_ITERATIONS_PER_CHUNK) {
                var entry = pending.pop();
                if (!entry || !(entry.folder instanceof Folder) || !entry.folder.exists) {
                    continue;
                }

                var folder = entry.folder;
                var targetArray = entry.targetArray;
                var depth = entry.depth || 0;
                var parents = entry.parents || [];
                var folderKey = entry.folderKey || folder.fsName || folder.fullName || '';

                if (progressObject && progressObject.text) {
                    try {
                        progressObject.text.text = 'Lendo: ' + decodePercentString(folder.displayName || folder.name || folder.fsName);
                    } catch (uiErr) {}
                }

                if (!entry.items) {
                    var enumerateStart = $.hiresTimer;
                    try { entry.items = folder.getFiles(); } catch (fsErr) { entry.items = []; }
                    entry.nextIndex = 0;
                    var elapsedMs = ($.hiresTimer - enumerateStart) / 1000;
                    if (elapsedMs > SLOW_FOLDER_THRESHOLD_MS) {
                        var slowCount = (slowFolderTracker[folderKey] || 0) + 1;
                        slowFolderTracker[folderKey] = slowCount;
                        if (slowCount > MAX_SLOW_FOLDER_ATTEMPTS) {
                            var skippedName = folder.fsName || folder.displayName || folder.name || folderKey;
                            skippedProblemFolders.push(skippedName);
                            logWarn("Ignorando pasta lenta/permissao: " + skippedName);
                            entry.items = [];
                        }
                    }
                }

                var items = entry.items || [];
                var processedFiles = 0;
                var reachedLimit = false;
                while (entry.nextIndex < items.length) {
                    var item = items[entry.nextIndex++];
                    if (!item) { continue; }

                    if (item instanceof Folder) {
                        var rawName = item.name || item.displayName || '';
                        var folderNameLower = (rawName || '').toLowerCase();
                        if (!folderNameLower) {
                            folderNameLower = (item.fsName || '').toLowerCase();
                        }
                        if (shouldIgnoreFolder(folderNameLower)) { continue; }

                        var decodedFolderName = decodePercentString(rawName || item.fsName);
                        var nodeData = { type: 'node', text: decodedFolderName, children: [] };
                        targetArray.push(nodeData);

                        var nextDepth = depth + 1;
                        if (MAX_SCAN_DEPTH < 0 || nextDepth <= MAX_SCAN_DEPTH) {
                            var nextParents = parents.slice(0);
                            nextParents.push(decodedFolderName);
                            enqueueFolder(item, nodeData.children, nextDepth, nextParents);
                        }
                    } else if (item instanceof File) {
                        var fileName = item.name || '';
                        var fileNameLower = fileName.toLowerCase();
                        if (shouldIgnoreFile(fileNameLower)) { continue; }
                        if (!fileMatchesFilter(fileName)) { continue; }

                        var decodedName = decodePercentString(fileName);
                        var decodedPath = decodePercentString(item.fsName);
                        var modDate = item.modified ? item.modified.toUTCString() : '';
                        var size = item.length || 0;

                        var signature = computeEntrySignature(decodedName, decodedPath, modDate, size);
                        var fileEntry = {
                            type: 'item',
                            text: decodedName,
                            filePath: decodedPath,
                            modDate: modDate,
                            size: size,
                            signature: signature
                        };
                        targetArray.push(fileEntry);

                        metadataResult.push({
                            text: decodedName,
                            filePath: decodedPath,
                            modDate: modDate,
                            size: size,
                            parents: parents.slice(0),
                            signature: signature
                        });
                    }

                    processedFiles++;
                    if (processedFiles >= MAX_ITEMS_PER_FOLDER_PASS) {
                        reachedLimit = true;
                        break;
                    }
                }

                if (reachedLimit && entry.nextIndex < items.length) {
                    pending.push(entry);
                    break;
                } else {
                    entry.items = null;
                    entry.nextIndex = 0;
                    iterations++;
                }
            }

            if (progressObject && progressObject.isCancelled) {
                finalize(true);
                return;
            }

            if (pending.length > 0) {
                var taskCall = taskName + '()';
                if (progressObject) { progressObject.asyncTaskName = taskName; }
                try {
                    var scheduledId = app.scheduleTask(taskCall, 30, false);
                    if (progressObject) { progressObject.asyncTaskId = scheduledId; }
                } catch (scheduleErr) {
                    finalize(false, scheduleErr && scheduleErr.message ? scheduleErr.message : 'Falha ao agendar tarefa.');
                }
            } else {
                finalize(false);
            }
        }

        $.global[taskName] = processChunk;
        processChunk();
    }

    function countItemsInTree(treeData) {
        if (!(treeData instanceof Array)) { return 0; }
        var total = 0;
        for (var i = 0; i < treeData.length; i++) {
            var entry = treeData[i];
            if (!entry || typeof entry !== 'object') { continue; }
            if (entry.type === 'item') {
                total++;
            } else if (entry.type === 'node' && entry.children) {
                total += countItemsInTree(entry.children);
            }
        }
        return total;
    }
    function addPathLine(parentGrp, pathTxt, categoryName, categoryKey) {
        var pathLineGrp = parentGrp.add('group', undefined);
        pathLineGrp.orientation = 'row';
        pathLineGrp.alignChildren = ['left', 'center'];
        pathLineGrp.spacing = 4;
        
        var openBtn;
        try { openBtn = new themeIconButton(pathLineGrp, { icon: D9T_PASTA_ICON, tips: [lClick + 'abrir pasta configurada'] }); } catch (e) { openBtn = pathLineGrp.add('button', undefined, 'Abrir'); openBtn.preferredSize = [60, 24]; openBtn.helpTip = 'abrir pasta configurada'; }

        var pathLab = pathLineGrp.add('statictext', undefined, pathTxt, { pathValue: pathTxt, truncate: 'middle' });
        setPathLabelValue(pathLab, pathTxt);
        pathLab.preferredSize = [350, 24];
        // Mantem a cor definida pela validacao; sem highlight para nao sobrescrever o verde/vermelho.
        
        var testBtn = pathLineGrp.add('button', undefined, 'Testar');
        testBtn.preferredSize = [80, 24];
        
        var cacheBtn = pathLineGrp.add('button', undefined, 'Gerar Cache');
        cacheBtn.preferredSize = [100, 24];

        var deletePathBtn;
        try { deletePathBtn = new themeIconButton(pathLineGrp, { icon: D9T_FECHAR_ICON, tips: [lClick + 'deletar caminho'] }); } catch (e) { deletePathBtn = pathLineGrp.add('button', undefined, 'X'); deletePathBtn.preferredSize = [24, 24]; deletePathBtn.helpTip = 'deletar caminho'; }
        
        setupButtonClick(openBtn, function () {
            var pathStr = getPathLabelValue(pathLab);
            if (!pathStr) {
                alert('Nenhum caminho configurado para abrir.');
                return;
            }
            var targetFolder = new Folder(pathStr);
            if (targetFolder.exists) {
                targetFolder.execute();
            } else {
                try { setFgColor(pathLab, '#DC143C'); } catch(e) {}
                alert("Falha! O caminho configurado nao existe ou esta inacessivel:\n" + pathStr);
            }
        });

        var handlePathSelection = function () {
            if (pathLab.enabled === false) { return; }
            var currentPath = getPathLabelValue(pathLab);
            var startFolder = currentPath ? new Folder(currentPath) : null;
            var newFolder = Folder.selectDialog('Selecione a pasta', startFolder);
            if (newFolder) {
                setPathLabelValue(pathLab, newFolder.fullName);
                try { setFgColor(pathLab, normalColor2); } catch(e) {}
                validateConfiguredPath(pathLab, false);
            }
        };
        if (typeof pathLab.addEventListener === 'function') {
            pathLab.addEventListener('click', handlePathSelection);
        } else {
            pathLab.onClick = handlePathSelection;
        }
        
        function setPathLineBusyState(isBusy) {
            if (cacheBtn) { cacheBtn.enabled = !isBusy; }
            if (testBtn) { testBtn.enabled = !isBusy; }
            if (pathLab && typeof pathLab.enabled !== 'undefined') { pathLab.enabled = !isBusy; }
            if (isBusy) {
                try { setCtrlHighlight(pathLab, normalColor2 || '#e6e6e6ff', highlightColor1 || '#d4003cff'); } catch (busyErr) {}
            } else {
                validateConfiguredPath(pathLab, false);
            }
        }
        
        testBtn.onClick = function() {
            validateConfiguredPath(pathLab, true);
        };

        validateConfiguredPath(pathLab, false);

        // ===================================================================
        // --- INICIO DA ALTERACAO: cacheBtn.onClick ---
        // ===================================================================
        cacheBtn.onClick = function() {
            var pathStr = getPathLabelValue(pathLab);
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                try { setFgColor(pathLab, '#DC143C'); } catch(e) {}
                alert("Falha! O caminho nao existe ou esta inacessivel. Impossivel gerar cache.");
                return;
            }
            setPathLineBusyState(true);

            var cacheFileName = 'templates_' + categoryKey + '_cache.json';
            var cacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);
            var metadataFileName = cacheFileName.replace('_cache', '_metadata');
            var metadataFile = new File(cacheFolder.fullName + '/' + metadataFileName);
            var manifestData = readCacheManifest();
            if (!manifestData[cacheFileName]) { manifestData[cacheFileName] = { file: cacheFileName, paths: {} }; }
            var manifestEntry = manifestData[cacheFileName];
            manifestEntry.paths = manifestEntry.paths || {};
            var folderTimestamp = (folder.modified && folder.modified.getTime) ? folder.modified.getTime() : null;

            var masterCacheData = {};
            var metadataCacheData = {};
            var oldCount = 0;
            var oldMetadataCount = 0;

            var PROGRESS_WINDOW_THEME = {
                title: 'Gerando Cache...',
                width: 360,
                height: 120,
                bgColor: (typeof bgColor1 !== 'undefined') ? bgColor1 : '#000000ff',
                txtColor: (typeof normalColor2 !== 'undefined') ? normalColor2 : '#e6e6e6ff'
            };

            function createProgressWindow() {
                var win = new Window('palette', PROGRESS_WINDOW_THEME.title, undefined, { closeButton: false });
                win.orientation = 'column';
                win.alignChildren = 'fill';
                win.spacing = 12;
                win.margins = 16;
                win.__keepFocus = true;
                win.onShow = function () {
                    if (!this.__keepFocus) { return; }
                    try { this.active = true; } catch (focusErr) {}
                    try { if (typeof this.bringToFront === 'function') { this.bringToFront(); } } catch (focusErr2) {}
                };
                win.onDeactivate = function () {
                    if (!this.visible || !this.__keepFocus) { return; }
                    try { this.active = true; } catch (focusErr3) {}
                    try { if (typeof this.bringToFront === 'function') { this.bringToFront(); } } catch (focusErr4) {}
                };

                if (typeof setBgColor === 'function') {
                    try { setBgColor(win, PROGRESS_WINDOW_THEME.bgColor); } catch (bgErr) {}
                }

                var headerGrp = win.add('group');
                headerGrp.alignment = ['fill', 'top'];
                headerGrp.orientation = 'column';
                headerGrp.spacing = 4;

                var titleTxt = headerGrp.add('statictext', undefined, 'Analisando pasta:');
                titleTxt.alignment = 'left';
                titleTxt.preferredSize.width = PROGRESS_WINDOW_THEME.width;
                if (typeof setFgColor === 'function') {
                    try { setFgColor(titleTxt, PROGRESS_WINDOW_THEME.txtColor); } catch (titleErr) {}
                }

                var progTxt = headerGrp.add('statictext', undefined, 'Iniciando...', { truncate: 'middle' });
                progTxt.alignment = 'left';
                progTxt.preferredSize = [PROGRESS_WINDOW_THEME.width, 22];
                if (typeof setCtrlHighlight === 'function') {
                    try { setCtrlHighlight(progTxt, PROGRESS_WINDOW_THEME.txtColor, highlightColor1 || '#d4003cff'); } catch (txtErr) {}
                } else if (typeof setFgColor === 'function') {
                    try { setFgColor(progTxt, PROGRESS_WINDOW_THEME.txtColor); } catch (txtErr2) {}
                }

                var btnGrp = win.add('group');
                btnGrp.alignment = ['right', 'bottom'];
                btnGrp.orientation = 'row';
                btnGrp.spacing = 8;

                var cancelBtn = btnGrp.add('button', undefined, 'Cancelar', { name: 'cancel' });
                cancelBtn.preferredSize = [100, 28];

                return { window: win, text: progTxt, cancelButton: cancelBtn };
            }

            var progressUI = createProgressWindow();
            progressUI.window.center();

            var progressObject = {
                window: progressUI.window,
                text: progressUI.text,
                isCancelled: false,
                asyncTaskId: null,
                asyncTaskName: null
            };

            progressUI.cancelButton.onClick = function() {
                progressObject.isCancelled = true;
                if (progressUI && progressUI.window) { progressUI.window.__keepFocus = false; }
                if (progressObject.asyncTaskId) {
                    try { app.cancelTask(progressObject.asyncTaskId); } catch (cancelErr) {}
                    progressObject.asyncTaskId = null;
                }
                if (progressObject.asyncTaskName && $.global[progressObject.asyncTaskName]) {
                    try { delete $.global[progressObject.asyncTaskName]; } catch (delErr) {}
                    progressObject.asyncTaskName = null;
                }
            };

            progressUI.window.show();
            if (progressUI.window.__keepFocus) {
                try { progressUI.window.active = true; } catch (activateErr) {}
                try {
                    if (typeof progressUI.window.bringToFront === 'function') { progressUI.window.bringToFront(); }
                } catch (bringErr) {}
                try { progressUI.window.update(); } catch (updErr) {}
            }
            $.global.__d9tProgressWindow = progressUI.window;
            try {
                app.scheduleTask("if ($.global.__d9tProgressWindow) { try { $.global.__d9tProgressWindow.active = true; if (typeof $.global.__d9tProgressWindow.bringToFront === 'function') { $.global.__d9tProgressWindow.bringToFront(); } } catch (e) { } }", 50, false);
            } catch (scheduleFocusErr) { }

            function closeProgressWindow() {
                if (progressObject) {
                    progressObject.asyncTaskId = null;
                    progressObject.asyncTaskName = null;
                }
                if (progressUI && progressUI.window) {
                    progressUI.window.__keepFocus = false;
                    try { progressUI.window.close(); } catch (closeErr) {
                        try { progressUI.window.hide(); } catch (hideErr) {}
                    }
                }
                $.global.__d9tProgressWindow = null;
                progressObject.window = null;
                progressUI = null;
            }

            function finalizeFeedback(message) {
                setPathLineBusyState(false);
                if (message) { logInfo("Feedback: " + message.replace(/\n/g, ' | ')); }
                closeProgressWindow();
                if (message) { alert(message); }
            }

            function startCacheGenerationJob() {
                if (progressObject.isCancelled) {
                    finalizeFeedback("Geracao de cache cancelada pelo usuario.");
                    return;
                }

                try {
                    if (cacheFile.exists) {
                        cacheFile.open('r');
                        cacheFile.encoding = "UTF-8";
                        var cacheRaw = cacheFile.read();
                        cacheFile.close();
                        if (cacheRaw && cacheRaw.length) {
                            masterCacheData = JSON.parse(cacheRaw);
                            if (masterCacheData[pathStr]) {
                                oldCount = countItemsInTree(masterCacheData[pathStr]);
                            }
                        }
                    }
                } catch (readErr) {
                    logError("Falha ao ler cache existente (" + cacheFile.fsName + "): " + readErr.message);
                    masterCacheData = {};
                    try { cacheFile.close(); } catch (closeErr0) {}
                }

                try {
                    if (metadataFile.exists) {
                        metadataFile.open('r');
                        metadataFile.encoding = "UTF-8";
                        var metadataRaw = metadataFile.read();
                        metadataFile.close();
                        if (metadataRaw && metadataRaw.length) {
                            metadataCacheData = JSON.parse(metadataRaw);
                            if (metadataCacheData[pathStr] instanceof Array) {
                                oldMetadataCount = metadataCacheData[pathStr].length;
                            }
                        }
                    }
                } catch (metaReadErr) {
                    logError("Falha ao ler metadata existente (" + metadataFile.fsName + "): " + metaReadErr.message);
                    metadataCacheData = {};
                    try { metadataFile.close(); } catch (closeErr1) {}
                }

                if (progressObject.isCancelled) {
                    finalizeFeedback("Geracao de cache cancelada pelo usuario.");
                    return;
                }

                var existingManifestInfo = manifestEntry.paths[pathStr];
                if (existingManifestInfo && folderTimestamp !== null && existingManifestInfo.lastModified === folderTimestamp && masterCacheData[pathStr]) {
                    var reusedTree = masterCacheData[pathStr] || [];
                    var reusedMeta = metadataCacheData[pathStr] || [];
                    var reuseCount = countItemsInTree(reusedTree);
                    var reuseMetaCount = reusedMeta.length;
                    var manifestTimestamp = folderTimestamp !== null ? folderTimestamp : existingManifestInfo.lastModified;
                    manifestEntry.paths[pathStr] = {
                        lastModified: manifestTimestamp,
                        lastScan: new Date().toUTCString(),
                        itemCount: reuseCount,
                        metadataCount: reuseMetaCount,
                        cacheHash: computeTreeHash(reusedTree)
                    };
                    manifestData[cacheFileName] = manifestEntry;
                    writeCacheManifest(manifestData);
                    try { setFgColor(pathLab, '#2E8B57'); } catch (reuseFgErr) {}
                    finalizeFeedback("Nenhuma alteracao detectada para '" + categoryName + "'.\n\nTotal mantido: " + reuseCount + " arquivos.");
                    return;
                }

                generateFolderTreeAsync(folder, fileFilter, progressObject, function(resultData, wasCancelled, errorMessage) {
                    if (wasCancelled) {
                        finalizeFeedback("Geracao de cache cancelada pelo usuario.");
                        return;
                    }

                    if (errorMessage) {
                        try { setFgColor(pathLab, '#DC143C'); } catch (fgErr0) {}
                        finalizeFeedback("Erro ao processar o cache:\n" + errorMessage);
                        return;
                    }

                    var treeData = (resultData && resultData.tree instanceof Array) ? resultData.tree : [];
                    var metadataEntries = (resultData && resultData.metadata instanceof Array) ? resultData.metadata : [];
                    var skippedFolders = (resultData && resultData.skippedFolders instanceof Array) ? resultData.skippedFolders : [];

                    var newCount = countItemsInTree(treeData);
                    var newMetadataCount = metadataEntries.length;

                    try {
                        masterCacheData[pathStr] = treeData;
                        cacheFile.open('w');
                        cacheFile.encoding = "UTF-8";
                        cacheFile.write(JSON.stringify(masterCacheData, null, 2));
                        cacheFile.close();

                        metadataCacheData[pathStr] = metadataEntries;
                        metadataFile.open('w');
                        metadataFile.encoding = "UTF-8";
                        metadataFile.write(JSON.stringify(metadataCacheData, null, 2));
                        metadataFile.close();
                    } catch (writeErr) {
                        try { setFgColor(pathLab, '#DC143C'); } catch (fgErr2) {}
                        logError("Erro ao salvar cache para '" + categoryName + "' (" + pathStr + "): " + writeErr.message);
                        finalizeFeedback("Erro critico ao gerar o cache:\n" + writeErr.message);
                        return;
                    }

                    manifestEntry.paths[pathStr] = {
                        lastModified: folderTimestamp,
                        lastScan: new Date().toUTCString(),
                        itemCount: newCount,
                        metadataCount: newMetadataCount,
                        cacheHash: computeTreeHash(treeData)
                    };
                    manifestData[cacheFileName] = manifestEntry;
                    writeCacheManifest(manifestData);

                    try { setFgColor(pathLab, '#2E8B57'); } catch (fgErr) {}
                    var feedbackMsg = "Sucesso! Cache para '" + categoryName + "' foi atualizado.\n\n" +
                        "Total de " + newCount + " arquivos encontrados neste caminho.\n" +
                        "Metadados enxutos gerados: " + newMetadataCount + " entradas.\n" +
                        "(Contagem anterior: " + oldCount + " arquivos | " + oldMetadataCount + " metadados)";
                    if (skippedFolders.length) {
                        feedbackMsg += "\n\nPastas ignoradas por lentidao/permissao:\n- " + skippedFolders.join("\n- ");
                    }

                    finalizeFeedback(feedbackMsg);
                });
            }

            var asyncStartTask = '__d9tStartCache_' + new Date().getTime();
            $.global[asyncStartTask] = function () {
                try {
                    startCacheGenerationJob();
                } catch (startErr) {
                    try { setFgColor(pathLab, '#DC143C'); } catch (fgErr3) {}
                    finalizeFeedback("Erro ao iniciar a geracao do cache:\n" + (startErr && startErr.message ? startErr.message : startErr));
                }
                try { delete $.global[asyncStartTask]; } catch (cleanupErr) {}
            };
            try {
                app.scheduleTask('if ($.global["' + asyncStartTask + '"]) { $.global["' + asyncStartTask + '"](); }', 25, false);
            } catch (startScheduleErr) {
                $.global[asyncStartTask]();
            }
        };
        // --- FIM DA ALTERACAO: cacheBtn.onClick ---
        // ===================================================================

        setupButtonClick(deletePathBtn, function () {
            if (parentGrp.children.length > 1) {
                parentGrp.remove(pathLineGrp);
                D9T_CONFIG_w.layout.layout(true);
            } else { alert('Cada categoria deve ter pelo menos um caminho.'); }
        });
    }
    
    // --- BOTOES DE ACAO (Importar, Exportar, Salvar) ---
    var BtnGrp = D9T_CONFIG_w.add('group', undefined);
    BtnGrp.orientation = 'stack';
    BtnGrp.alignment = 'fill';
    BtnGrp.margins = [0, 32, 0, 0];
    var bGrp1 = BtnGrp.add('group');
    bGrp1.alignment = 'left';
    var bGrp2 = BtnGrp.add('group');
    bGrp2.alignment = 'right';
    var defaultTextColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E';
    var grayButtonColor = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#7A7A7A';
    var whiteButtonColor = '#F2F2F2';
    function createButton(parent, config) {
        var themeConfig = {
            width: config.width,
            height: config.height,
            labelTxt: config.labelTxt,
            tips: config.tips || [''],
            buttonColor: config.buttonColor,
            textColor: config.textColor
        };
        var btn;
        if (typeof themeButton === 'function') {
            try {
                btn = new themeButton(parent, themeConfig);
                return btn;
            } catch (e) {}
        }
        if (typeof themeAltButton === 'function') {
            try {
                btn = new themeAltButton(parent, {
                    width: config.width,
                    height: config.height,
                    labelTxt: config.labelTxt,
                    tips: config.tips || [''],
                    buttonColor: config.buttonColor,
                    textColor: config.textColor,
                    hoverButtonColor: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003cff',
                    hoverTextColor: '#FFFFFF'
                });
                return btn;
            } catch (e2) {}
        }
        btn = parent.add('button', undefined, config.labelTxt);
        btn.preferredSize = [config.width, config.height];
        btn.helpTip = (config.tips && config.tips[0]) ? config.tips[0] : '';
        if (config.buttonColor && typeof setBgColor === 'function') {
            try { setBgColor(btn, config.buttonColor); } catch (bgErr) {}
        }
        if (config.textColor && typeof setFgColor === 'function') {
            try { setFgColor(btn, config.textColor); } catch (fgErr) {}
        }
        return btn;
    }
    var importBtn = createButton(bGrp1, { width: 80, height: 32, labelTxt: 'importar', tips: ['importar configuracao ou caches'], buttonColor: grayButtonColor, textColor: defaultTextColor });
    var exportBtn = createButton(bGrp1, { width: 80, height: 32, labelTxt: 'exportar', tips: ['exportar configuracao'], buttonColor: grayButtonColor, textColor: defaultTextColor });
    var saveBtn = createButton(bGrp2, { width: 120, height: 32, labelTxt: 'salvar', tips: ['salvar configuracao'], buttonColor: whiteButtonColor, textColor: defaultTextColor });
    try { setBgColor(D9T_CONFIG_w, bgColor1); } catch (e) {}
    
    setupButtonClick(exportBtn, function() {
        var productionsArray = collectConfigData();
        var configToExport = { PRODUCTIONS: productionsArray }; 
        var configFile = File.saveDialog('Salvar arquivo de configuracao', 'GND9TOOLS_PRODUCTIONS_Backup.json');
        if (configFile) {
            try {
                configFile.open('w');
                configFile.write(JSON.stringify(configToExport, null, '\t'));
                configFile.close();
                alert('Configuracao exportada com sucesso para:\n' + configFile.fsName);
            } catch (err) {
                alert('Erro ao exportar o arquivo: ' + err.message);
            }
        }
    });

    setupButtonClick(importBtn, function() {
        var selectedFiles = File.openDialog('Selecione arquivo(s) de configuracao ou cache', '*.json', true);
        if (!selectedFiles) return;
        var currentProductions = collectConfigData();
        var legacyKeyMap = { 'pecas': 'jornais', 'ilustra': 'ilustracoes', 'base': 'basetematica' };
        var nameMap = {
            'jornais': 'JORNAIS', 'ilustracoes': 'ILUSTRACOES', 'basetematica': 'BASE TEMATICA',
            'programas': 'PROGRAMAS', 'eventos': 'EVENTOS', 'marketing': 'MARKETING', 'promo': 'PROMO'
        };

        try {
            for (var i = 0; i < selectedFiles.length; i++) {
                var currentFile = selectedFiles[i];
                currentFile.open('r');
                var content = currentFile.read();
                currentFile.close();
                var data = JSON.parse(content);
                var fileName = currentFile.name;

                if (fileName.indexOf('templates_') === 0 && fileName.indexOf('_cache.json') > -1) {
                    var keyMatch = fileName.match(/templates_(.*?)_cache\.json/);
                    if (keyMatch && keyMatch[1]) {
                        var rawKey = keyMatch[1];
                        var categoryKey = legacyKeyMap[rawKey] || rawKey;
                        var categoryName = nameMap[categoryKey];
                        if (categoryName) {
                            var pathsFromCache = [];
                            for (var key in data) { if (data.hasOwnProperty(key)) { pathsFromCache.push(key); } }
                            var targetProd = null;
                            for(var j=0; j<currentProductions.length; j++) {
                                if(currentProductions[j].name.toUpperCase() === categoryName.toUpperCase()) {
                                    targetProd = currentProductions[j];
                                    break;
                                }
                            }
                            if (targetProd) { 
                                for(var p=0; p<pathsFromCache.length; p++) {
                                    var newPath = pathsFromCache[p];
                                    if(!hasPath(targetProd.paths, newPath)) { 
                                        targetProd.paths.push(newPath);
                                    }
                                }
                            }
                        }
                    }
                } else { 
                    var importedProductions = data.PRODUCTIONS || [];
                    for(var j=0; j<importedProductions.length; j++) {
                        var importedProd = importedProductions[j];
                        var targetProd = null;
                        for(var k=0; k<currentProductions.length; k++) {
                            if(currentProductions[k].name.toUpperCase() === importedProd.name.toUpperCase()) {
                                targetProd = currentProductions[k];
                                break;
                            }
                        }
                        if(targetProd && importedProd.paths) {
                            for(var p=0; p<importedProd.paths.length; p++) {
                                var newPath = importedProd.paths[p];
                                    if(!hasPath(targetProd.paths, newPath)) { 
                                    targetProd.paths.push(newPath);
                                }
                            }
                        } else if (!targetProd) {
                            currentProductions.push(importedProd);
                        }
                    }
                }
            }
            updateUIWithConfig(currentProductions);
            alert(selectedFiles.length + ' arquivo(s) importado(s) e mesclado(s) com sucesso!');
        } catch (err) {
            alert('Erro ao importar e mesclar arquivo(s): ' + err.message + (err.line ? ' (linha: ' + err.line + ')' : ''));
        }
    });
    
    // Legica de Salvamento (Salva no System_Settings.json)
    setupButtonClick(saveBtn, function () {
        try {
            var newProductionsArray = collectConfigData();
            var fullConfig = readSystemSettings();

            if (!fullConfig.TEMPLATES_Settings) {
                fullConfig.TEMPLATES_Settings = {};
            }
            
            fullConfig.TEMPLATES_Settings.PRODUCTIONS = newProductionsArray;
            var success = writeSystemSettings(fullConfig);

            if (success) {
                if (typeof D9T_prodArray !== 'undefined') {
                    D9T_prodArray = newProductionsArray;
                }
                alert('Configuracao salva com sucesso no System_Settings.json!\n\nUse o botao "Atualizar" (icone Atualizar) na janela de Templates para aplicar as mudancas.');
                D9T_CONFIG_w.close();
            } else {
                 throw new Error("A funcao writeSystemSettings falhou.");
            }
        } catch (err) { 
            alert('Erro critico ao salvar a configuracao:\n' + err.message); 
        }
    });
    
    // --- FUNCAO DE COLETA DE DADOS ---
    function collectConfigData() {
        var newProdArray = [];
        var dataMap = {
            'jornais': { name: 'JORNAIS', icon: 'D9T_TEMPPECAS_ICON' },
            'ilustracoes': { name: 'ILUSTRACOES', icon: 'D9T_TILUSTRA_ICON' },
            'basetematica': { name: 'BASE TEMATICA', icon: 'D9T_TBASE_ICON' },
            'programas': { name: 'PROGRAMAS', icon: 'D9T_PROGRAMAS_ICON' },
            'eventos': { name: 'EVENTOS', icon: 'D9T_EVENTOS_ICON' },
            'marketing': { name: 'MARKETING', icon: 'D9T_MARKETING_ICON' },
            'promo': { name: 'PROMO', icon: 'D9T_PROMO_ICON' }
        };

        var allCatGrps = mainGrp.children;
        for (var i = 0; i < allCatGrps.length; i++) {
            if (allCatGrps[i] instanceof Group && allCatGrps[i].children.length > 0 && allCatGrps[i].children[0] instanceof StaticText) {
                var catKey = allCatGrps[i].children[0].properties.categoryKey;
                if (catKey && dataMap[catKey]) {
                    var pathsGrp = allCatGrps[i+1];
                    var caminhos = [];
                    if (pathsGrp && pathsGrp.children) {
                        for(var p = 0; p < pathsGrp.children.length; p++){
                            var pathLine = pathsGrp.children[p];
                            if (pathLine && pathLine.children && pathLine.children.length > 1) {
                                var pathLabel = pathLine.children[1];
                                var pathValue = getPathLabelValue(pathLabel);
                                if (typeof pathValue === 'undefined' || pathValue === null) {
                                    pathValue = '';
                                }
                                caminhos.push(pathValue);
                            }
                        }
                    }
                    var fileBase = 'templates_' + catKey;
                    var prodObject = {
                        name: dataMap[catKey].name,
                        icon: dataMap[catKey].icon,
                        paths: caminhos,
                        cacheFile: (dataMap[catKey].cacheFile || (fileBase + '_cache.json')),
                        metadataFile: (dataMap[catKey].metadataFile || (fileBase + '_metadata.json'))
                    };
                    newProdArray.push(prodObject);
                }
            }
        }
        return newProdArray;
    }

    // --- FUNCAO DE ATUALIZACAO DA UI ---
    function updateUIWithConfig(productionsArray) {
        var allCatGrps = mainGrp.children;
        for (var i = 0; i < allCatGrps.length; i++) {
            if (allCatGrps[i] instanceof Group && allCatGrps[i].children.length > 0 && allCatGrps[i].children[0] instanceof StaticText) {
                var catKey = allCatGrps[i].children[0].properties.categoryKey;
                var catName = allCatGrps[i].children[0].text.replace(':', '');
                var pathsGrp = allCatGrps[i+1];
                var foundProd = null;
                for(var j=0; j<productionsArray.length; j++) {
                    if (productionsArray[j].name.toUpperCase() === catName.toUpperCase()) {
                        foundProd = productionsArray[j];
                        break;
                    }
                }
                while (pathsGrp.children.length > 0) { pathsGrp.remove(pathsGrp.children[0]); }
                if (foundProd && foundProd.paths) {
                    for (var p = 0; p < foundProd.paths.length; p++) {
                        addPathLine(pathsGrp, foundProd.paths[p], catName, catKey);
                    }
                }
            }
        }
        D9T_CONFIG_w.layout.layout(true);
    }
    
    D9T_CONFIG_w.show();
}
