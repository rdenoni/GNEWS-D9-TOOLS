// =============================================================================
// GNEWS TEMPLATES - v9.1 - Completa e Funcional
// >> DESCRICAO:
//    Restauradas todas as funcoes auxiliares que foram omitidas na
//    versao anterior. O carregamento de cache, busca, paginacao e todas
//    as outras funcionalidades estao novamente presentes e operacionais.
// =============================================================================
$.encoding = "UTF-8";

function d9TemplateDialog(thisObj) {
    #include '../libraries/JSON lib.js';

    var scriptName = 'GNEWS TEMPLATES';
    var scriptVersion = '9.1';

        // Variaveis de escopo
    var searchDebounceTimer = null;
    var GLOBAL_CACHE_KEY = '__GNEWS_SHARED_CACHE';
    var sharedCacheStore = ensureSharedCacheStore(false);
    var warmupState = ensureWarmupState(false);
    var templatesCache = sharedCacheStore.templates;
    var metadataCache = sharedCacheStore.metadata;
    var productionQuickIndex = sharedCacheStore.index;
    var productionCodeIndex = sharedCacheStore.codeIndex;
    var previewInfoCache = sharedCacheStore.previewInfo || {};
    sharedCacheStore.previewInfo = previewInfoCache;
    var lazyMetadataEnabled = true;
    var productions = [];
    var filteredDataCache = [];
    var treeFlatCache = [];
    var itemsPerPage = 50;
    var currentPage = 0;
    var productionLoadHealth = {};
    var productionBaseNames = [];
    var productionStatus = [];
    var productionStatusMessage = [];
    var loadingAnimationTaskId = null;
    var loadingAnimationFrame = 0;
    var loadingAnimationBaseText = 'Carregando, por favor aguarde...';
    var loadingPlaceholders = [];
    var templatesLogFile = null;
    var manifestFileHandle = null;
    var manifestCacheData = null;
    var manifestCacheTimestamp = 0;
    var MANIFEST_REFRESH_INTERVAL = 4000;
    var CONFIG_CACHE_TTL = 15000;
    var pendingPopulateProduction = null;
    var pendingInitTaskName = '__gnewsTemplatesInitTask';
    var pendingPreloadRegistry = {};
    var pendingPrefetchQueue = [];
    var PREFETCH_INTERVAL = 900;
    var PREFETCH_TASK_NAME = '__gnewsPrefetchCycle';
    var pendingPrefetchTaskId = null;
    var pendingListRenderTaskId = null;
    var pendingTreeRenderTaskId = null;
    var LIST_RENDER_TASK_NAME = '__gnewsListRenderTask';
    var TREE_RENDER_TASK_NAME = '__gnewsTreeRenderTask';
    var LIST_RENDER_CHUNK_SIZE = 10;
    var TREE_RENDER_CHUNK_SIZE = 20;
    var previewTaskQueue = [];
    var previewTaskName = '__gnewsPreviewPipeline';
    var previewTaskId = null;
    var currentPreviewFile = null;
    (function initTemplatesLog() {
        try {
            if (typeof scriptPreferencesPath === 'string' && scriptPreferencesPath.length) {
                var logsFolder = new Folder(scriptPreferencesPath + '/logs');
                if (!logsFolder.exists) { logsFolder.create(); }
                templatesLogFile = new File(logsFolder.fullName + '/gnews_templates.log');
            }
        } catch (logInitErr) {}
    })();
    startCachePipelineWarmup();

    function appendLogLine(level, message) {
        if (!templatesLogFile) { return; }
        try {
            templatesLogFile.open('a');
            templatesLogFile.encoding = 'UTF-8';
            var stamp = new Date().toUTCString();
            templatesLogFile.write('[' + stamp + '][' + level + '] ' + message + '\n');
            templatesLogFile.close();
        } catch (logErr) {}
    }
    function logInfo(message) { appendLogLine('INFO', message); }
    function logWarn(message) { appendLogLine('WARN', message); }
    function logError(message) { appendLogLine('ERROR', message); }

    function startTelemetrySpan(label) {
        return { label: label || 'telemetry', start: new Date().getTime() };
    }

    function endTelemetrySpan(span, meta) {
        if (!span || typeof span.start !== 'number') { return; }
        var duration = new Date().getTime() - span.start;
        var message = '[telemetry] ' + (span.label || 'event') + ' ' + duration + 'ms';
        if (meta && typeof meta === 'object') {
            var parts = [];
            for (var key in meta) {
                if (!meta.hasOwnProperty(key)) { continue; }
                var value = meta[key];
                if (value === undefined || value === null) { continue; }
                parts.push(key + '=' + value);
            }
            if (parts.length) { message += ' | ' + parts.join(' '); }
        }
        logInfo(message);
    }

    function getManifestFileHandle() {
        if (!scriptPreferencesPath || typeof scriptPreferencesPath !== 'string') { return null; }
        if (!manifestFileHandle) {
            manifestFileHandle = new File(scriptPreferencesPath + '/cache/templates_cache_manifest.json');
        }
        return manifestFileHandle;
    }

    function invalidateManifestCache() {
        manifestCacheData = null;
        manifestCacheTimestamp = 0;
    }

    function ensureSharedCacheStore(forceReset) {
        if (forceReset || !$.global[GLOBAL_CACHE_KEY]) {
            $.global[GLOBAL_CACHE_KEY] = {
                templates: {},
                metadata: {},
                index: {},
                codeIndex: {},
                timestamps: {}
            };
        }
        return $.global[GLOBAL_CACHE_KEY];
    }

    function ensureWarmupState(forceReset) {
        var key = '__GNEWS_PIPELINE_WARMUP';
        if (forceReset || !$.global[key]) {
            $.global[key] = {
                status: 'idle',
                system: null,
                data: null,
                manifest: null,
                timestamp: 0,
                error: null
            };
        }
        return $.global[key];
    }

    function resetSharedCaches() {
        sharedCacheStore = ensureSharedCacheStore(true);
        templatesCache = sharedCacheStore.templates;
        metadataCache = sharedCacheStore.metadata;
        productionQuickIndex = sharedCacheStore.index;
        productionCodeIndex = sharedCacheStore.codeIndex;
        previewInfoCache = sharedCacheStore.previewInfo = {};
    }

    function rebuildPrefetchQueue(skipIndex) {
        pendingPrefetchQueue = [];
        if (!productions || !productions.length) { return; }
        for (var i = 0; i < productions.length; i++) {
            if (i === skipIndex) { continue; }
            pendingPrefetchQueue.push(i);
        }
    }

    function startCachePipelineWarmup() {
        if (!scriptPreferencesPath || typeof scriptPreferencesPath !== 'string') { return; }
        if (warmupState.status === 'running' || warmupState.status === 'done') { return; }
        warmupState.status = 'running';
        var taskName = '__gnewsPipelineWarmup';
        $.global[taskName] = function () {
            delete $.global[taskName];
            runCachePipelineWarmup();
        };
        try {
            app.scheduleTask('if ($.global.__gnewsPipelineWarmup) { $.global.__gnewsPipelineWarmup(); }', 20, false);
        } catch (warmErr) {
            runCachePipelineWarmup();
        }
    }

    function stopPrefetchCycle() {
        if (pendingPrefetchTaskId) {
            try { app.cancelTask(pendingPrefetchTaskId); } catch (cancelErr) {}
            pendingPrefetchTaskId = null;
        }
        try { if ($.global[PREFETCH_TASK_NAME]) { delete $.global[PREFETCH_TASK_NAME]; } } catch (delErr) {}
    }

    function cancelListRenderTask() {
        if (pendingListRenderTaskId) {
            try { app.cancelTask(pendingListRenderTaskId); } catch (cancelErr) {}
            pendingListRenderTaskId = null;
        }
        try {
            if ($.global.__gnewsListRenderTask) { delete $.global.__gnewsListRenderTask; }
            if ($.global.__gnewsListRenderState) { delete $.global.__gnewsListRenderState; }
        } catch (cleanupErr) {}
    }

    function cancelTreeRenderTask() {
        if (pendingTreeRenderTaskId) {
            try { app.cancelTask(pendingTreeRenderTaskId); } catch (cancelErr) {}
            pendingTreeRenderTaskId = null;
        }
        try {
            if ($.global.__gnewsTreeRenderTask) { delete $.global.__gnewsTreeRenderTask; }
            if ($.global.__gnewsTreeRenderState) { delete $.global.__gnewsTreeRenderState; }
        } catch (cleanupErr) {}
    }

    function schedulePrefetchCycle(delay) {
        stopPrefetchCycle();
        $.global[PREFETCH_TASK_NAME] = function () {
            pendingPrefetchTaskId = null;
            runPrefetchCycle();
        };
        try {
            pendingPrefetchTaskId = app.scheduleTask('if ($.global.' + PREFETCH_TASK_NAME + ') { $.global.' + PREFETCH_TASK_NAME + '(); }', delay || PREFETCH_INTERVAL, false);
        } catch (prefetchErr) {
            try { if ($.global[PREFETCH_TASK_NAME]) { $.global[PREFETCH_TASK_NAME](); } } catch (prefetchRunErr) {}
        }
    }

    function runPrefetchCycle() {
        var nextIndex = -1;
        while (pendingPrefetchQueue.length > 0) {
            var candidate = pendingPrefetchQueue.shift();
            if (candidate === undefined || candidate === null) { continue; }
            if (candidate < 0 || (productions && candidate >= productions.length)) { continue; }
            nextIndex = candidate;
            break;
        }
        if (nextIndex === -1) { stopPrefetchCycle(); return; }
        if (!productions || !productions[nextIndex]) { schedulePrefetchCycle(PREFETCH_INTERVAL); return; }
        if (!isProductionHealthy(productions[nextIndex])) {
            queueProductionPreload(nextIndex, 80);
        } else {
            schedulePrefetchCycle(PREFETCH_INTERVAL / 2);
            return;
        }
        schedulePrefetchCycle(PREFETCH_INTERVAL);
    }

    function runCachePipelineWarmup() {
        var telemetry = startTelemetrySpan('pipelineWarmup');
        try {
            var systemSettingsFile = new File(scriptPreferencesPath + "/System_Settings.json");
            var dadosConfigFile = new File(scriptPreferencesPath + "/Dados_Config.json");
            var systemData = readJsonFile(systemSettingsFile);
            var dataConfig = readJsonFile(dadosConfigFile);
            var manifestSnapshot = {};
            var manifestFile = getManifestFileHandle();
            if (manifestFile && manifestFile.exists) {
                try {
                    manifestFile.open('r');
                    manifestFile.encoding = 'UTF-8';
                    var raw = manifestFile.read();
                    manifestFile.close();
                    manifestSnapshot = (raw && raw.length) ? JSON.parse(raw) : {};
                } catch (manifestErr) {
                    try { manifestFile.close(); } catch (closeErr) {}
                    manifestSnapshot = {};
                }
            }
            warmupState.system = systemData;
            warmupState.data = dataConfig;
            warmupState.manifest = manifestSnapshot;
            warmupState.timestamp = new Date().getTime();
            warmupState.status = 'done';
            warmupState.error = null;
            endTelemetrySpan(telemetry, { status: 'ok' });
        } catch (warmErr) {
            warmupState.status = 'error';
            warmupState.error = warmErr && warmErr.message ? warmErr.message : warmErr;
            endTelemetrySpan(telemetry, { status: 'error', message: warmupState.error });
        }
    }

    function runListRenderChunk() {
        var state = $.global.__gnewsListRenderState;
        if (!state || !state.listBox || !state.items) { cancelListRenderTask(); return; }
        var count = 0;
        while (state.nextIndex < state.items.length && count < LIST_RENDER_CHUNK_SIZE) {
            var itemData = state.items[state.nextIndex++];
            var listItem = state.listBox.add('item', itemData.text);
            listItem.filePath = itemData.filePath;
            listItem.modDate = itemData.modDate;
            listItem.size = itemData.size;
            if (typeof D9T_AE_ICON !== 'undefined') { listItem.image = D9T_AE_ICON; }
            count++;
        }
        if (state.nextIndex >= state.items.length) {
            cancelListRenderTask();
            return;
        }
        if (!$.global.__gnewsListRenderTask) {
            $.global.__gnewsListRenderTask = function () { runListRenderChunk(); };
        }
        try {
            pendingListRenderTaskId = app.scheduleTask('if ($.global.__gnewsListRenderTask) { $.global.__gnewsListRenderTask(); }', 25, false);
        } catch (renderErr) {
            runListRenderChunk();
        }
    }

    function runTreeRenderChunk() {
        var state = $.global.__gnewsTreeRenderState;
        if (!state || !state.stack || !state.treeView) { cancelTreeRenderTask(); return; }
        var iterations = 0;
        while (state.stack.length > 0 && iterations < TREE_RENDER_CHUNK_SIZE) {
            var current = state.stack.pop();
            var entry = current.entry;
            var parentNode = current.parent;
            if (!entry || !parentNode) { continue; }
            if (entry.type === 'node') {
                var node;
                if (state.mode === 'lazy') {
                    node = createLazyTreeNode(parentNode, entry);
                } else {
                    node = parentNode.add('node', entry.text);
                    if (typeof D9T_FOLDER_AE_ICON !== 'undefined') { node.image = D9T_FOLDER_AE_ICON; }
                }
                if (state.mode !== 'lazy' && entry.children && entry.children.length) {
                    for (var j = entry.children.length - 1; j >= 0; j--) {
                        state.stack.push({ entry: entry.children[j], parent: node, mode: state.mode });
                    }
                }
            } else if (entry.type === 'item') {
                var itemNode;
                if (state.mode === 'lazy') {
                    itemNode = createLazyTreeItem(parentNode, entry);
                } else {
                    itemNode = parentNode.add('item', entry.text);
                    if (typeof D9T_AE_ICON !== 'undefined') { itemNode.image = D9T_AE_ICON; }
                    itemNode.filePath = entry.filePath;
                    itemNode.modDate = entry.modDate;
                    itemNode.size = entry.size;
                }
            }
            iterations++;
        }
        if (state.stack.length === 0) {
            if (state.mode === 'search') { expandAllNodes(state.treeView); }
            cancelTreeRenderTask();
            return;
        }
        if (!$.global.__gnewsTreeRenderTask) {
            $.global.__gnewsTreeRenderTask = function () { runTreeRenderChunk(); };
        }
        try {
            pendingTreeRenderTaskId = app.scheduleTask('if ($.global.__gnewsTreeRenderTask) { $.global.__gnewsTreeRenderTask(); }', 25, false);
        } catch (treeErr) {
            runTreeRenderChunk();
        }
    }

    function queuePreviewComputation(filePath, templateName, selectionMeta) {
        if (!filePath) { return; }
        for (var i = 0; i < previewTaskQueue.length; i++) {
            if (previewTaskQueue[i].filePath === filePath) { return; }
        }
        previewTaskQueue.push({
            filePath: filePath,
            templateName: templateName,
            selectionMeta: selectionMeta || {}
        });
        if (!previewTaskId) {
            schedulePreviewTask(20);
        }
    }

    function schedulePreviewTask(delay) {
        if (previewTaskId) { try { app.cancelTask(previewTaskId); } catch (cancelErr) {} previewTaskId = null; }
        $.global[previewTaskName] = function () {
            previewTaskId = null;
            runPreviewPipeline();
        };
        try {
            previewTaskId = app.scheduleTask('if ($.global.' + previewTaskName + ') { $.global.' + previewTaskName + '(); }', delay || 25, false);
        } catch (scheduleErr) {
            runPreviewPipeline();
        }
    }

    function runPreviewPipeline() {
        if (!previewTaskQueue.length) { previewTaskId = null; return; }
        var job = previewTaskQueue.shift();
        if (!job || !job.filePath) {
            schedulePreviewTask(25);
            return;
        }
        var telemetry = startTelemetrySpan('previewPipeline');
        try {
            var info = computePreviewInfo(job.filePath, job.templateName);
            previewInfoCache[job.filePath] = info;
            endTelemetrySpan(telemetry, { status: 'ok', file: job.filePath });
            if (currentPreviewFile === job.filePath) {
                applyPreviewInfo(info);
            }
        } catch (previewErr) {
            logWarn('Falha no pipeline de preview: ' + previewErr);
            endTelemetrySpan(telemetry, { status: 'error', file: job.filePath });
        }
        if (previewTaskQueue.length) {
            schedulePreviewTask(30);
        }
    }

    function computePreviewInfo(filePath, templateName) {
        var fileObj = new File(filePath);
        var info = {
            filePath: filePath,
            templateName: templateName || extractFileNameFromPath(filePath),
            codigo: '',
            destino: '',
            versao: '',
            modDate: null
        };
        var nameWithExt = info.templateName || fileObj.name || '';
        info.codigo = generateCodigoFromTemplate(nameWithExt);
        info.destino = determineServidorDestino(nameWithExt, filePath);
        info.versao = getAepVersion(fileObj);
        if (fileObj.exists && fileObj.modified) {
            info.modDate = new Date(fileObj.modified);
        }
        return info;
    }

    function applyPreviewInfo(info) {
        if (!info) { return; }
        if (info.templateName) {
            var templateName = (typeof deleteFileExt === 'function' ? deleteFileExt(info.templateName) : info.templateName.replace(/\.[^\.]+$/, ''));
            infoValues[0].text = templateName.toUpperCase();
        }
        codigoTxt.text = info.codigo || '';
        infoValues[1].text = info.destino || '---';
        if (info.modDate instanceof Date) {
            var d = info.modDate;
            infoValues[2].text = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
        } else {
            infoValues[2].text = '---';
        }
        infoValues[3].text = info.versao || '---';
        infoValues[4].text = decodeURI(info.filePath || '');
    }

    function readCacheManifest(force) {
        if (!force) {
            var warmManifest = warmupState && warmupState.manifest;
            if (warmManifest && warmupState.timestamp && (new Date().getTime() - warmupState.timestamp) < MANIFEST_REFRESH_INTERVAL) {
                return warmManifest;
            }
        }
        var manifestFile = getManifestFileHandle();
        if (!manifestFile) { return {}; }
        var now = new Date().getTime();
        if (!force && manifestCacheData && (now - manifestCacheTimestamp) < MANIFEST_REFRESH_INTERVAL) {
            return manifestCacheData;
        }
        if (!manifestFile.exists) {
            manifestCacheData = {};
            manifestCacheTimestamp = now;
            return manifestCacheData;
        }
        try {
            manifestFile.open('r');
            manifestFile.encoding = 'UTF-8';
            var raw = manifestFile.read();
            manifestFile.close();
            manifestCacheData = (raw && raw.length) ? JSON.parse(raw) : {};
            warmupState.manifest = manifestCacheData;
            warmupState.timestamp = now;
        } catch (manifestErr) {
            try { manifestFile.close(); } catch (closeErr) {}
            logWarn('Falha ao ler templates_cache_manifest.json: ' + manifestErr);
            manifestCacheData = {};
        }
        manifestCacheTimestamp = now;
        return manifestCacheData;
    }

    function getCachedSystemConfigs() {
        if (!$.global.__GNEWS_CONFIG_CACHE) { return null; }
        var cache = $.global.__GNEWS_CONFIG_CACHE;
        if (!cache.system || !cache.data) { return null; }
        var now = new Date().getTime();
        if (cache.timestamp && (now - cache.timestamp) < CONFIG_CACHE_TTL) {
            return cache;
        }
        return null;
    }

    function storeCachedSystemConfigs(systemData, dataConfig) {
        $.global.__GNEWS_CONFIG_CACHE = {
            system: systemData,
            data: dataConfig,
            timestamp: new Date().getTime()
        };
    }

    function invalidateConfigCache() {
        $.global.__GNEWS_CONFIG_CACHE = null;
    }

    function parseManifestDate(value) {
        if (!value) { return null; }
        try {
            var parsed = Date.parse(value);
            if (!isNaN(parsed)) { return new Date(parsed); }
        } catch (parseErr) {}
        return null;
    }

    function compareManifestDates(a, b) {
        var dateA = parseManifestDate(a);
        var dateB = parseManifestDate(b);
        if (!dateA && !dateB) { return 0; }
        if (!dateA) { return -1; }
        if (!dateB) { return 1; }
        var timeA = dateA.getTime();
        var timeB = dateB.getTime();
        if (timeA === timeB) { return 0; }
        return (timeA > timeB) ? 1 : -1;
    }

    function formatManifestDate(value) {
        var dateObj = parseManifestDate(value);
        if (!dateObj) { return value || 'desconhecido'; }
        function pad(num) { return (num < 10 ? '0' : '') + num; }
        return pad(dateObj.getDate()) + '/' + pad(dateObj.getMonth() + 1) + ' ' + pad(dateObj.getHours()) + ':' + pad(dateObj.getMinutes());
    }

    function pushUniqueValue(list, value) {
        if (!(list instanceof Array)) { return; }
        for (var i = 0; i < list.length; i++) {
            if (list[i] === value) { return; }
        }
        list.push(value);
    }

    function getOrderedCacheKeysForProduction(productionObject, cacheData) {
        var orderedKeys = [];
        if (!cacheData || typeof cacheData !== 'object') { return orderedKeys; }
        var configuredPaths = (productionObject && productionObject.paths) ? productionObject.paths : [];
        for (var i = 0; i < configuredPaths.length; i++) {
            var configuredPath = configuredPaths[i];
            if (cacheData.hasOwnProperty && cacheData.hasOwnProperty(configuredPath)) {
                pushUniqueValue(orderedKeys, configuredPath);
            }
        }
        for (var key in cacheData) {
            if (!cacheData.hasOwnProperty || !cacheData.hasOwnProperty(key)) { continue; }
            pushUniqueValue(orderedKeys, key);
        }
        return orderedKeys;
    }

    function summarizeManifestForProduction(productionObject, manifestSnapshot) {
        if (!productionObject) { return null; }
        ensureProductionFileReferences(productionObject, false);
        var snapshot = manifestSnapshot || readCacheManifest(false);
        if (!snapshot) { return null; }
        var cacheFileName = productionObject.cacheFile;
        if (!cacheFileName || !snapshot[cacheFileName] || !snapshot[cacheFileName].paths) { return null; }
        var manifestEntry = snapshot[cacheFileName];
        var summary = { itemCount: 0, metadataCount: 0, paths: [], lastScan: null };
        var orderedKeys = getOrderedCacheKeysForProduction(productionObject, manifestEntry.paths);
        for (var i = 0; i < orderedKeys.length; i++) {
            var pathKey = orderedKeys[i];
            var info = manifestEntry.paths[pathKey];
            if (!info) { continue; }
            summary.itemCount += info.itemCount || 0;
            summary.metadataCount += info.metadataCount || 0;
            summary.paths.push({ path: pathKey, itemCount: info.itemCount || 0, metadataCount: info.metadataCount || 0, lastScan: info.lastScan });
            if (!summary.lastScan || compareManifestDates(info.lastScan, summary.lastScan) > 0) {
                summary.lastScan = info.lastScan;
            }
        }
        if (summary.paths.length === 0) { return null; }
        return summary;
    }

    function formatManifestSummary(summary) {
        if (!summary) { return ''; }
        var parts = [];
        parts.push(summary.itemCount + (summary.itemCount === 1 ? ' item' : ' itens'));
        if (summary.paths.length > 1) {
            parts.push(summary.paths.length + ' caminhos');
        }
        if (summary.lastScan) {
            parts.push('scan ' + formatManifestDate(summary.lastScan));
        }
        return parts.join(' · ');
    }

    var D9T_TEMPLATES_w = (thisObj instanceof Panel) ? thisObj : new Window('palette', scriptName + ' ' + scriptVersion);
    if (!(thisObj instanceof Panel)) {
                // Aplica cor de fundo apenas se nao for um painel, para nao sobrescrever o tema do app
        var bgColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E';
        var color = hexToRgb(bgColor);
        D9T_TEMPLATES_w.graphics.backgroundColor = D9T_TEMPLATES_w.graphics.newBrush(D9T_TEMPLATES_w.graphics.BrushType.SOLID_COLOR, color);
    }
    
    // =============================================================================
        // --- MODULO DE CONFIGURACAO CENTRALIZADA ---
    // =============================================================================
    var GNEWS_TEMPLATES_CONFIG = { system: null, data: null };

    function readJsonFile(file) {
        if (!file || !file.exists) return null;
        try {
            file.open("r", "TEXT", "????");
            file.encoding = "UTF-8";
            var content = file.read();
            file.close();
            if (content.charCodeAt(0) === 0xFEFF) { content = content.substring(1); }
            return JSON.parse(content);
        } catch (e) {
             showThemedAlert("ERRO: Falha ao processar o arquivo JSON:\n" + file.fsName, 'Erro de leitura');
            return null;
        }
    }

    function loadCentralConfigs(forceReload) {
        var telemetry = startTelemetrySpan('loadCentralConfigs');
        if (typeof scriptPreferencesPath === 'undefined') { return false; }
        if (forceReload !== true) {
            if (warmupState && warmupState.status === 'done' && warmupState.system && warmupState.data) {
                GNEWS_TEMPLATES_CONFIG.system = warmupState.system;
                GNEWS_TEMPLATES_CONFIG.data = warmupState.data;
                endTelemetrySpan(telemetry, { cached: true, warm: true, success: true });
                return true;
            }
            var cached = getCachedSystemConfigs();
            if (cached) {
                GNEWS_TEMPLATES_CONFIG.system = cached.system;
                GNEWS_TEMPLATES_CONFIG.data = cached.data;
                endTelemetrySpan(telemetry, { cached: true, warm: false, success: true });
                return true;
            }
        }
        var systemSettingsFile = new File(scriptPreferencesPath + "/System_Settings.json");
        var dadosConfigFile = new File(scriptPreferencesPath + "/Dados_Config.json");
        GNEWS_TEMPLATES_CONFIG.system = readJsonFile(systemSettingsFile);
        GNEWS_TEMPLATES_CONFIG.data = readJsonFile(dadosConfigFile);
        if (GNEWS_TEMPLATES_CONFIG.system && GNEWS_TEMPLATES_CONFIG.data) {
            storeCachedSystemConfigs(GNEWS_TEMPLATES_CONFIG.system, GNEWS_TEMPLATES_CONFIG.data);
            if (warmupState) {
                warmupState.system = GNEWS_TEMPLATES_CONFIG.system;
                warmupState.data = GNEWS_TEMPLATES_CONFIG.data;
                warmupState.status = 'done';
                warmupState.timestamp = new Date().getTime();
            }
            endTelemetrySpan(telemetry, { cached: false, success: true });
        }
        var success = GNEWS_TEMPLATES_CONFIG.system && GNEWS_TEMPLATES_CONFIG.data;
        if (!success) { endTelemetrySpan(telemetry, { success: false }); }
        return success;
    }

    function saveSystemConfigs() {
        if (!GNEWS_TEMPLATES_CONFIG.system) return;
        var systemSettingsFile = new File(scriptPreferencesPath + "/System_Settings.json");
        try {
            systemSettingsFile.open("w");
            systemSettingsFile.encoding = "UTF-8";
            systemSettingsFile.write(JSON.stringify(GNEWS_TEMPLATES_CONFIG.system, null, 4));
            systemSettingsFile.close();
            if (GNEWS_TEMPLATES_CONFIG.system && GNEWS_TEMPLATES_CONFIG.data) {
                storeCachedSystemConfigs(GNEWS_TEMPLATES_CONFIG.system, GNEWS_TEMPLATES_CONFIG.data);
            }
        } catch (e) { /* falha silenciosa */ }
    }

    function showThemedAlert(message, title) {
        var dialogTitle = title || scriptName;
        try {
            var alertWin = new Window('dialog', dialogTitle, undefined, { closeButton: true });
            alertWin.orientation = 'column';
            alertWin.alignChildren = 'fill';
            alertWin.spacing = 12;
            alertWin.margins = 16;

            if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
                try { setBgColor(alertWin, bgColor1); } catch (setBgErr) {}
            }

            var msgTxt = alertWin.add('statictext', undefined, message || '', { multiline: true });
            msgTxt.maximumSize.width = 360;
            if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
                try { setFgColor(msgTxt, normalColor1); } catch (setFgErr) {}
            }

            var btnGrp = alertWin.add('group');
            btnGrp.alignment = ['right', 'bottom'];
            var okBtn = btnGrp.add('button', undefined, 'OK', { name: 'ok' });
            if (typeof setCtrlHighlight === 'function' && typeof highlightColor1 !== 'undefined' && typeof normalColor2 !== 'undefined') {
                try { setCtrlHighlight(okBtn, highlightColor1, normalColor2); } catch (setBtnErr) {}
            }

            alertWin.center();
            alertWin.show();
        } catch (alertErr) {
            alert(message);
        }
    }

    // =============================================================================
        // ===== CONSTRUCAO DA INTERFACE =====
    // =============================================================================
    var topHeaderGrp = D9T_TEMPLATES_w.add('group'); topHeaderGrp.orientation = 'row'; topHeaderGrp.alignment = ['fill', 'top']; topHeaderGrp.margins = [0, 5, 10, 0];
    topHeaderGrp.add('statictext', undefined, '');
    var helpBtnGrp = topHeaderGrp.add('group'); helpBtnGrp.alignment = ['right', 'center'];
    var infoBtn;
    if (typeof themeIconButton === 'function' && typeof D9T_INFO_ICON !== 'undefined') {
        infoBtn = new themeIconButton(helpBtnGrp, { icon: D9T_INFO_ICON, tips: [(typeof lClick !== 'undefined' ? lClick : '') + 'ajuda | DOCS'] });
    } else {
        infoBtn = helpBtnGrp.add('button', undefined, '?'); infoBtn.preferredSize = [24, 24];
    }
    var mainGrp = D9T_TEMPLATES_w.add('group'); mainGrp.orientation = 'stack';
    var templatesMainGrp = mainGrp.add('group'); templatesMainGrp.spacing = 12;
    var vGrp1 = templatesMainGrp.add('group'); vGrp1.orientation = 'column'; vGrp1.alignment = ['center', 'top']; vGrp1.alignChildren = 'left'; vGrp1.spacing = 12;
    var vGrp2 = templatesMainGrp.add('group'); vGrp2.orientation = 'column'; vGrp2.alignment = ['center', 'top']; vGrp2.alignChildren = 'left'; vGrp2.spacing = 12; vGrp2.visible = false;
    var prodHeaderGrp = vGrp1.add('group'); prodHeaderGrp.alignment = 'fill';
    var prodLab = prodHeaderGrp.add('statictext', undefined, 'PRODUCAO:'); setFgColor(prodLab, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF');
    var prodGrp = vGrp1.add('group'); prodGrp.spacing = 4; prodGrp.alignment = 'fill';
    prodGrp.add('group');
    var prodDrop = prodGrp.add('dropdownlist', undefined, ['Carregando...']); prodDrop.alignment = ['fill', 'center']; prodDrop.enabled = false;
    var statusInfoGrp = vGrp1.add('group'); statusInfoGrp.alignment = ['fill', 'top']; statusInfoGrp.spacing = 6; statusInfoGrp.margins = [0, -4, 0, 4];
    var prodStatusLab = statusInfoGrp.add('statictext', undefined, ''); prodStatusLab.alignment = ['fill', 'top']; prodStatusLab.visible = false; setFgColor(prodStatusLab, (typeof normalColor2 !== 'undefined') ? normalColor2 : '#e6e6e6ff');
    var divProd; if (typeof themeDivider === 'function') { divProd = themeDivider(vGrp1); divProd.alignment = ['fill', 'center']; }
    var templatesHeaderGrp = vGrp1.add('group'); templatesHeaderGrp.alignment = 'fill'; templatesHeaderGrp.orientation = 'row';
    var templateLab = templatesHeaderGrp.add('statictext', undefined, 'BUSCA:'); templateLab.alignment = ['left', 'center']; setFgColor(templateLab, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF');
    var itemCounterLab = templatesHeaderGrp.add('statictext', undefined, '', { justify: 'left' }); itemCounterLab.alignment = ['fill', 'center']; setFgColor(itemCounterLab, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA');
    var listViewChk = templatesHeaderGrp.add('checkbox', undefined, 'Exibir em lista'); listViewChk.alignment = ['right', 'center']; listViewChk.value = true; listViewChk.enabled = false; setFgColor(listViewChk, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF');
    var treeGrp = vGrp1.add('group'); treeGrp.orientation = 'column'; treeGrp.spacing = 4;
    var placeholderText = '>>  Digite para Buscar...';
    var searchBox = treeGrp.add('edittext', [0, 0, 320, 24], placeholderText); searchBox.isPlaceholderActive = true; searchBox.enabled = false; setFgColor(searchBox, (typeof monoColor0 !== 'undefined') ? monoColor0 : '#F2F2F2');
    var treeContainerGrp = treeGrp.add('group', [0, 0, 320, 390]); treeContainerGrp.orientation = 'stack'; treeContainerGrp.alignment = ['fill', 'fill'];
    var templateTree = treeContainerGrp.add('treeview', [0, 0, 320, 390]); setFgColor(templateTree, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA'); templateTree.visible = false;
    var templateList = treeContainerGrp.add('listbox', [0, 0, 320, 390]); setFgColor(templateList, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA'); templateList.visible = true;
    var loadingGrp = treeContainerGrp.add('group'); loadingGrp.alignChildren = ['center', 'center']; loadingGrp.add('statictext', undefined, 'Carregando, por favor aguarde...'); loadingGrp.visible = true;
    
    var paginationGrp = vGrp1.add('group'); paginationGrp.orientation = 'row'; paginationGrp.alignment = 'fill'; paginationGrp.alignChildren = 'center'; paginationGrp.spacing = 10; paginationGrp.margins.top = 5;
    var prevBtn = paginationGrp.add('button', undefined, '<< Anterior'); prevBtn.preferredSize.width = 80;
    var pageInfo = paginationGrp.add('statictext', undefined, 'Pagina 1 de 1'); pageInfo.alignment = 'fill'; pageInfo.justify = 'center'; setFgColor(pageInfo, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA');
    var nextBtn = paginationGrp.add('button', undefined, 'Proximo >>'); nextBtn.preferredSize.width = 80;
    paginationGrp.visible = false;

    var mainBtnGrp1 = vGrp1.add('group'); mainBtnGrp1.orientation = 'stack'; mainBtnGrp1.alignment = 'fill'; mainBtnGrp1.margins = [0, 8, 0, 0];
    var lBtnGrp1 = mainBtnGrp1.add('group'); lBtnGrp1.alignment = 'left'; lBtnGrp1.spacing = 16;
    var refreshBtn, openFldBtn;
    if (typeof themeIconButton === 'function' && typeof D9T_ATUALIZAR_ICON !== 'undefined') {
        refreshBtn = new themeIconButton(lBtnGrp1, { icon: D9T_ATUALIZAR_ICON, tips: ['Forcar recarga do cache'] });
        openFldBtn = new themeIconButton(lBtnGrp1, { icon: D9T_PASTA_ICON, tips: ['Abrir pasta de templates'] });
    } else {
        refreshBtn = new themeIconButton(lBtnGrp1, { icon: D9T_ATUALIZAR_ICON, tips: ['Forcar recarga do cache'] });
    }
    var previewHeaderGrp = vGrp2.add('group'); previewHeaderGrp.alignment = 'fill';
    var previewLab = previewHeaderGrp.add('statictext', undefined, 'PREVIEW:'); setFgColor(previewLab, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF');
    var previewGrp = vGrp2.add('group'); previewGrp.orientation = 'column'; previewGrp.alignChildren = 'left';
    var previewImg; if (typeof no_preview !== 'undefined') { previewImg = previewGrp.add('image', [0, 0, 600, 338], no_preview); } else { previewImg = previewGrp.add('image', [0, 0, 600, 338]); }
    var newDiv; if (typeof themeDivider === 'function') { newDiv = themeDivider(vGrp2); newDiv.alignment = ['fill', 'center']; }
    var infoArteMainGrp = vGrp2.add('group'); infoArteMainGrp.alignment = ['left', 'top']; infoArteMainGrp.spacing = 12;
    var arteInfoGrp = infoArteMainGrp.add('group'); arteInfoGrp.orientation = 'column'; arteInfoGrp.alignment = ['left', 'top']; arteInfoGrp.alignChildren = 'left';
    
    var codigoGrp = arteInfoGrp.add('group'); codigoGrp.margins = [0, 8, 0, 0];
    var codigoLab = codigoGrp.add('statictext', undefined, 'Codigo:'); codigoLab.preferredSize.width = 100; setFgColor(codigoLab, (typeof monoColor0 !== 'undefined') ? monoColor0 : '#F2F2F2');
    var codigoTxt = codigoGrp.add('edittext', [0, 0, 120, 24], ''); codigoTxt.helpTip = 'Digite o codigo da arte (ex: GNVZ036)';
    var infoRows = [{ label: 'Nome da Arte:', value: '---' }, { label: 'Servidor Destino:', value: '---' }, { label: 'Ultima Atualizacao:', value: '---' }, { label: 'Versao:', value: '---' }, { label: 'Caminho:', value: '---' }];
    var infoValues = [];
    for (var r = 0; r < infoRows.length; r++) {
        var infoRow = arteInfoGrp.add('group'); infoRow.margins = [0, 2, 0, 0];
        var label = infoRow.add('statictext', undefined, infoRows[r].label); label.preferredSize.width = 100; setFgColor(label, (typeof monoColor0 !== 'undefined') ? monoColor0 : '#F2F2F2');
        var value = infoRow.add('statictext', undefined, infoRows[r].value, { truncate: 'middle' }); value.preferredSize.width = 480; setFgColor(value, (typeof normalColor2 !== 'undefined') ? normalColor2 : '#e6e6e6ff');
        infoValues.push(value);
    }
    var rBtnGrp2 = vGrp2.add('group'); rBtnGrp2.alignment = 'right'; rBtnGrp2.spacing = 16;
    var openBtn, importBtn;
    if (typeof themeButton === 'function') {
        openBtn = new themeButton(rBtnGrp2, { width: 120, height: 32, labelTxt: 'abrir', tips: ['Abrir o projeto selecionado'] });
        importBtn = new themeButton(rBtnGrp2, { width: 120, height: 32, textColor: (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E', buttonColor: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF', labelTxt: 'importar', tips: ['Importar o template selecionado'] });
    } else {
        openBtn = rBtnGrp2.add('button', undefined, 'Abrir'); importBtn = rBtnGrp2.add('button', undefined, 'Importar');
    }

    // =============================================================================
        // ===== FUNCOES E LOGICA DE EVENTOS (Completas) =====
    // =============================================================================
    var initializeUIAndData = function () {
        setLoadingState(true, 'Preparando categorias...');
        if (!loadCentralConfigs()) { showThemedAlert("Erro fatal: Nao foi possivel carregar os arquivos de configuracao.", 'Erro critico'); D9T_TEMPLATES_w.close(); return; }
        productions = GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.PRODUCTIONS;
        var templateSettings = (GNEWS_TEMPLATES_CONFIG.system && GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings) ? GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings : {};
        var runtimeTemplatePrefs = templateSettings.gnews_templates || {};
        if (runtimeTemplatePrefs.hasOwnProperty('lazyMetadata')) {
            lazyMetadataEnabled = runtimeTemplatePrefs.lazyMetadata !== false;
        } else {
            lazyMetadataEnabled = true;
        }
        for (var prodIdx = 0; prodIdx < productions.length; prodIdx++) {
            ensureProductionFileReferences(productions[prodIdx], false);
        }
        var storedIndex = GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates.lastProductionIndex;
        var lastIndex = (typeof storedIndex === "number" && storedIndex >= 0) ? storedIndex : 0;
        productionBaseNames = [];
        productionStatus = [];
        productionStatusMessage = [];
        prodDrop.removeAll();
        for (var j = 0; j < productions.length; j++) {
            productionBaseNames[j] = productions[j].name;
            productionStatus[j] = 'pending';
            productionStatusMessage[j] = 'Aguardando carregamento...';
            prodDrop.add('item', formatProductionLabel(productionBaseNames[j], productionStatus[j]));
        }
        prodDrop.selection = (lastIndex >= 0 && lastIndex < prodDrop.items.length) ? lastIndex : 0;
        hydrateProductionStatusesFromManifest();
        var requestedIndex = (prodDrop.selection && prodDrop.selection.index >= 0) ? prodDrop.selection.index : 0;
        var healthyIndex = ensureHealthySelection(requestedIndex);
        if (healthyIndex !== requestedIndex && healthyIndex > -1) {
            prodDrop.selection = healthyIndex;
            GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates.lastProductionIndex = healthyIndex;
            notifyCacheIssue("O ultimo cache selecionado apresentou erro e foi substituido por '" + productions[healthyIndex].name + "'.");
        }
        var currentSelectionIndex = (prodDrop.selection && prodDrop.selection.index >= 0) ? prodDrop.selection.index : 0;
        var currentProduction = productions[currentSelectionIndex] || null;
        pendingPopulateProduction = currentProduction ? currentProduction.name : null;
        queueProductionPreload(currentSelectionIndex, 200);
        var priorityProductions = ['JORNAIS', 'BASE TEMATICA', 'ILUSTRACOES'];
        var staggerDelay = 800;
        for (var k = 0; k < productions.length; k++) {
            if (k === currentSelectionIndex) { continue; }
            if (priorityProductions.indexOf(productions[k].name.toUpperCase()) > -1) {
                queueProductionPreload(k, staggerDelay);
                staggerDelay += 400;
            }
        }
        rebuildPrefetchQueue(currentSelectionIndex);
        schedulePrefetchCycle(staggerDelay + 600);
        updateProductionStatusLabel(prodDrop.selection ? prodDrop.selection.index : -1);
        vGrp2.visible = true; if (newDiv) newDiv.visible = true;
        D9T_TEMPLATES_w.layout.layout(true);
        currentPage = 0;
        filteredDataCache = [];
        templateTree.removeAll();
        templateList.removeAll();
        updateItemCounter(0);
        searchBox.active = false;
        searchBox.text = placeholderText;
        searchBox.isPlaceholderActive = true;
        updateArteInfo(null);
        prodDrop.enabled = true; searchBox.enabled = true; listViewChk.enabled = true;
    };
    function scheduleInitializationRun(delay) {
        try { delete $.global[pendingInitTaskName]; } catch (clearErr) {}
        $.global[pendingInitTaskName] = function () {
            try { initializeUIAndData(); }
            catch (initErr) { showThemedAlert('Erro ao preparar os dados: ' + initErr, 'Inicializacao'); }
            try { delete $.global[pendingInitTaskName]; } catch (delErr) {}
        };
        var taskCode = 'if ($.global["' + pendingInitTaskName + '"]) { $.global["' + pendingInitTaskName + '"](); }';
        app.scheduleTask(taskCode, delay || 10, false);
    }
    function kickoffInitialization() {
        pendingPopulateProduction = null;
        clearPendingPreloads();
        setLoadingState(true, 'Carregando configuracoes...');
        scheduleInitializationRun(20);
    }
    $.global.runInitialization = kickoffInitialization;

    function decodeCacheText(value) {
        if (typeof value !== 'string' || value.indexOf('%') === -1) { return value; }
        try { return decodeURIComponent(value); } catch (decodeErr) { return value; }
    }

    var IGNORE_FOLDER_NAMES = [
        'auto-save',
        'old',
        'adobe after effects auto-save',
        'versoes antigas',
        'backup',
        'old versions',
        '__macosx'
    ];
    var IGNORE_NAME_CONTAINS = ['auto-save', 'tmpaetoame'];
    var IGNORE_FILE_NAMES = ['thumbs.db'];
    (function normalizeIgnoreLists() {
        for (var i = 0; i < IGNORE_FOLDER_NAMES.length; i++) {
            IGNORE_FOLDER_NAMES[i] = IGNORE_FOLDER_NAMES[i].toLowerCase();
        }
        for (var j = 0; j < IGNORE_NAME_CONTAINS.length; j++) {
            IGNORE_NAME_CONTAINS[j] = IGNORE_NAME_CONTAINS[j].toLowerCase();
        }
        for (var k = 0; k < IGNORE_FILE_NAMES.length; k++) {
            IGNORE_FILE_NAMES[k] = IGNORE_FILE_NAMES[k].toLowerCase();
        }
    })();

    function toLowerSafe(value) {
        return (typeof value === 'string') ? value.toLowerCase() : '';
    }

    function containsIgnoredFragment(lowerValue) {
        if (!lowerValue) { return false; }
        for (var i = 0; i < IGNORE_NAME_CONTAINS.length; i++) {
            if (lowerValue.indexOf(IGNORE_NAME_CONTAINS[i]) !== -1) { return true; }
        }
        return false;
    }

    function shouldIgnoreFolderText(value) {
        var lower = toLowerSafe(value);
        if (!lower) { return false; }
        if (containsIgnoredFragment(lower)) { return true; }
        for (var i = 0; i < IGNORE_FOLDER_NAMES.length; i++) {
            if (lower === IGNORE_FOLDER_NAMES[i]) { return true; }
        }
        return false;
    }

    function shouldIgnoreFileName(value) {
        var lower = toLowerSafe(value);
        if (!lower) { return false; }
        if (containsIgnoredFragment(lower)) { return true; }
        for (var i = 0; i < IGNORE_FILE_NAMES.length; i++) {
            if (lower === IGNORE_FILE_NAMES[i]) { return true; }
        }
        return false;
    }

    function shouldIgnorePathValue(value) {
        if (typeof value !== 'string' || value === '') { return false; }
        var normalized = value.replace(/\\/g, '/');
        var segments = normalized.split('/');
        for (var i = 0; i < segments.length; i++) {
            var segment = segments[i];
            if (!segment) { continue; }
            var lower = segment.toLowerCase();
            if (containsIgnoredFragment(lower)) { return true; }
            for (var j = 0; j < IGNORE_FOLDER_NAMES.length; j++) {
                if (lower === IGNORE_FOLDER_NAMES[j]) { return true; }
            }
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

    function ensureItemSignature(item) {
        if (!item || item.signature) { return; }
        item.signature = computeEntrySignature(item.text || '', item.filePath || '', item.modDate || '', item.size || 0);
    }

    function extractFileNameFromPath(pathValue) {
        if (typeof pathValue !== 'string' || pathValue === '') { return ''; }
        var parts = pathValue.split(/[\/\\]/);
        if (parts.length === 0) { return pathValue; }
        return parts[parts.length - 1];
    }

    function metadataEntryShouldBeIgnored(entry) {
        if (!entry || typeof entry !== 'object') { return true; }
        var fileName = extractFileNameFromPath(entry.filePath || entry.text || '');
        if (shouldIgnoreFileName(fileName)) { return true; }
        if (shouldIgnorePathValue(entry.filePath)) { return true; }
        return false;
    }

    function sanitizeMetadataEntries(entries) {
        if (!(entries instanceof Array)) { return []; }
        var clean = [];
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!metadataEntryShouldBeIgnored(entry)) {
                ensureItemSignature(entry);
                clean.push(entry);
            }
        }
        return clean;
    }

    function ensureMetadataBucket(prodName) {
        var bucket = metadataCache[prodName];
        if (!bucket) { return null; }
        if (bucket instanceof Array) {
            bucket = { raw: null, sanitized: bucket.slice(0) };
            metadataCache[prodName] = bucket;
        }
        return bucket;
    }

    function getSanitizedMetadataEntries(prodName) {
        var bucket = ensureMetadataBucket(prodName);
        if (!bucket) { return []; }
        if (bucket.sanitized) { return bucket.sanitized; }
        var rawMap = bucket.raw;
        if (!rawMap) {
            bucket.sanitized = [];
            return bucket.sanitized;
        }
        var orderedKeys = bucket.orderedKeys || [];
        if (!orderedKeys.length) {
            for (var key in rawMap) {
                if (!rawMap.hasOwnProperty(key)) { continue; }
                orderedKeys.push(key);
            }
            bucket.orderedKeys = orderedKeys;
        }
        var sanitized = [];
        for (var i = 0; i < orderedKeys.length; i++) {
            var currentKey = orderedKeys[i];
            var entries = rawMap[currentKey];
            if (!(entries instanceof Array)) { continue; }
            var cleaned = sanitizeMetadataEntries(entries);
            for (var j = 0; j < cleaned.length; j++) { sanitized.push(cleaned[j]); }
        }
        bucket.sanitized = sanitized;
        return sanitized;
    }

    function setSanitizedMetadataEntries(prodName, entries) {
        metadataCache[prodName] = {
            raw: null,
            sanitized: entries || [],
            orderedKeys: []
        };
    }

    function normalizeCacheEntries(entries) {
        if (!(entries instanceof Array)) { return []; }
        var normalized = [];
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!entry || typeof entry !== 'object') { continue; }
            if (entry.text) { entry.text = decodeCacheText(entry.text); }
            if (entry.filePath) { entry.filePath = decodeCacheText(entry.filePath); }
            var entryText = entry.text || '';
            if (entry.type === 'node') {
                if (shouldIgnoreFolderText(entryText)) { continue; }
                var normalizedChildren = normalizeCacheEntries(entry.children || []);
                if (normalizedChildren.length > 0) {
                    entry.children = normalizedChildren;
                    normalized.push(entry);
                }
            } else if (entry.type === 'item') {
                var fileNameFromPath = extractFileNameFromPath(entry.filePath);
                if (shouldIgnoreFileName(fileNameFromPath) || shouldIgnorePathValue(entry.filePath)) { continue; }
                ensureItemSignature(entry);
                normalized.push(entry);
            }
        }
        return normalized;
    }

    function cacheErrorPlaceholder(prodName, message) {
        var placeholder = [{ type: 'item', text: message }];
        placeholder.__error = true;
        templatesCache[prodName] = placeholder;
    }

    function getProductionIndexByName(prodName) {
        if (!prodName) { return -1; }
        for (var i = 0; i < productionBaseNames.length; i++) {
            if (productionBaseNames[i] === prodName) {
                return i;
            }
        }
        return -1;
    }

    function getProductionIndexFromObject(productionObject) {
        if (!productionObject || !productionObject.name) { return -1; }
        return getProductionIndexByName(productionObject.name);
    }

    function formatProductionLabel(baseName, state) {
        return baseName || '';
    }

    function getStatusColor(state) {
        if (state === 'error') { return '#DC143C'; }
        if (state === 'ok') { return '#2E8B57'; }
        if (state === 'loading') { return (typeof normalColor2 !== 'undefined') ? normalColor2 : '#e6e6e6ff'; }
        return (typeof monoColor0 !== 'undefined') ? monoColor0 : '#bfbfbf';
    }

    function defaultStatusMessage(state, index) {
        var baseName = productionBaseNames[index] || '';
        if (state === 'loading') { return 'Carregando ' + baseName + '...'; }
        if (state === 'ok') { return baseName + ' pronto.'; }
        if (state === 'error') { return 'Falha ao carregar ' + baseName + '.'; }
        return 'Aguardando carregamento...';
    }

    function updateDropdownItemLabel(index) {
        if (!prodDrop || !prodDrop.items || !prodDrop.items.length) { return; }
        if (index < 0 || index >= prodDrop.items.length) { return; }
        if (index >= productionBaseNames.length) { return; }
        prodDrop.items[index].text = productionBaseNames[index] || '';
    }

    function updateProductionStatusLabel(index) {
        if (!prodStatusLab) { return; }
        if (typeof index !== 'number' || index < 0 || index >= productionStatusMessage.length) {
            prodStatusLab.visible = false;
            return;
        }
        var message = productionStatusMessage[index] || '';
        var color = getStatusColor(productionStatus[index]);
        prodStatusLab.text = message;
        prodStatusLab.visible = !!message;
        try { setFgColor(prodStatusLab, color); } catch (e) {}
    }

    function setProductionStatus(index, state, message) {
        if (index < 0 || index >= productionBaseNames.length) { return; }
        productionStatus[index] = state || productionStatus[index] || 'pending';
        productionStatusMessage[index] = message || defaultStatusMessage(productionStatus[index], index);
        updateDropdownItemLabel(index);
        if (prodDrop && prodDrop.selection && prodDrop.selection.index === index) {
            updateProductionStatusLabel(index);
        }
    }

    function hydrateProductionStatusesFromManifest() {
        if (!productions || !productions.length) { return; }
        var manifestSnapshot = readCacheManifest(false);
        if (!manifestSnapshot) { return; }
        for (var idx = 0; idx < productions.length; idx++) {
            var summary = summarizeManifestForProduction(productions[idx], manifestSnapshot);
            if (!summary) { continue; }
            var summaryText = formatManifestSummary(summary);
            if (summaryText) {
                setProductionStatus(idx, productionStatus[idx] || 'pending', summaryText);
            }
        }
    }

    function normalizeDiacritics(text) {
        if (typeof text !== 'string') { return ''; }
        var normalized = text.toLowerCase();
        var replacements = {
            '�': 'a', '�': 'a', '�': 'a', '�': 'a', '�': 'a',
            '�': 'e', '�': 'e', '�': 'e', '�': 'e',
            '�': 'i', '�': 'i', '�': 'i', '�': 'i',
            '�': 'o', '�': 'o', '�': 'o', '�': 'o', '�': 'o',
            '�': 'u', '�': 'u', '�': 'u', '�': 'u',
            '�': 'c'
        };
        normalized = normalized.replace(/[�����������������������]/g, function(match) {
            return replacements[match] || match;
        });
        return normalized;
    }

    function slugifyProductionName(name) {
        var normalized = normalizeDiacritics(name || '');
        return normalized.replace(/[^a-z0-9]+/g, '').trim();
    }

    function deriveCacheFileFromName(name) {
        var slug = slugifyProductionName(name);
        if (!slug) { return null; }
        return 'templates_' + slug + '_cache.json';
    }

    function deriveMetadataFileFromName(name) {
        var cacheFile = deriveCacheFileFromName(name);
        if (!cacheFile) { return null; }
        return cacheFile.replace('_cache', '_metadata');
    }

    function ensureProductionFileReferences(productionObject, persist) {
        if (!productionObject) { return; }
        var changed = false;
        if (!productionObject.cacheFile) {
            var derivedCache = deriveCacheFileFromName(productionObject.name);
            if (derivedCache) {
                productionObject.cacheFile = derivedCache;
                changed = true;
            }
        }
        if (!productionObject.metadataFile) {
            var derivedMeta = deriveMetadataFileFromName(productionObject.name);
            if (derivedMeta) {
                productionObject.metadataFile = derivedMeta;
                changed = true;
            }
        }
        if (changed && persist === true) {
            saveSystemConfigs();
        }
    }

    function setProductionHealthFlag(prodName, isHealthy) {
        if (!prodName) { return; }
        productionLoadHealth[prodName] = (isHealthy === true);
    }

    function markProductionFailure(prodName, message) {
        setProductionHealthFlag(prodName, false);
        var idx = getProductionIndexByName(prodName);
        if (idx > -1) {
            setProductionStatus(idx, 'error', message);
            if (prodDrop && prodDrop.selection && prodDrop.selection.index === idx) {
                pendingPopulateProduction = null;
                setLoadingState(false, message);
            }
        }
    }

    function markProductionSuccess(prodName, message) {
        setProductionHealthFlag(prodName, true);
        var idx = getProductionIndexByName(prodName);
        if (idx > -1) {
            setProductionStatus(idx, 'ok', message);
            if (prodDrop && prodDrop.selection && prodDrop.selection.index === idx) {
                setLoadingState(false);
                if (pendingPopulateProduction === prodName) {
                    pendingPopulateProduction = null;
                    var term = (searchBox && !searchBox.isPlaceholderActive) ? searchBox.text : '';
                    safePerformSearch(term);
                    if (searchBox) {
                        try { searchBox.active = true; } catch (focusErr) {}
                    }
                }
            }
        }
    }

    function isProductionHealthy(productionObject) {
        if (!productionObject || !productionObject.name) { return false; }
        var prodName = productionObject.name;
        if (productionLoadHealth.hasOwnProperty(prodName)) {
            return productionLoadHealth[prodName] === true;
        }
        var cachedTree = templatesCache[prodName];
        if (cachedTree && cachedTree.length && cachedTree.__error !== true) {
            productionLoadHealth[prodName] = true;
            return true;
        }
        return false;
    }

    function clearPendingPreloads() {
        for (var key in pendingPreloadRegistry) {
            if (!pendingPreloadRegistry.hasOwnProperty(key)) { continue; }
            var taskName = pendingPreloadRegistry[key];
            if (taskName && $.global[taskName]) {
                try { delete $.global[taskName]; } catch (delErr) {}
            }
        }
        pendingPreloadRegistry = {};
    }

    function queueProductionPreload(index, delay) {
        if (!productions || index < 0 || index >= productions.length) { return; }
        if (pendingPreloadRegistry[index]) { return; }
        var taskName = '__gnewsPreloadTask_' + index;
        pendingPreloadRegistry[index] = taskName;
        $.global[taskName] = function () {
            try {
                if (productions[index]) { preloadProductionData(productions[index]); }
            } catch (preloadErr) {
                logWarn('Falha ao processar preload da categoria #' + index + ': ' + preloadErr);
            }
            pendingPreloadRegistry[index] = null;
            try { delete $.global[taskName]; } catch (delErr) {}
        };
        var taskCode = 'if ($.global["' + taskName + '"]) { $.global["' + taskName + '"](); }';
        app.scheduleTask(taskCode, delay || 150, false);
    }

    function preloadProductionData(productionObject) {
        if (!productionObject) { return; }
        var prodIndex = getProductionIndexFromObject(productionObject);
        if (prodIndex > -1) {
            setProductionStatus(prodIndex, 'loading', 'Carregando ' + productionObject.name + '...');
        }
        if (!lazyMetadataEnabled) {
            safeLoadMetadata(productionObject);
        }
        safeLoadCache(productionObject);
    }

    function ensureHealthySelection(preferredIndex) {
        if (!productions || productions.length === 0) { return -1; }
        var baseIndex = (typeof preferredIndex === 'number' && preferredIndex >= 0 && preferredIndex < productions.length) ? preferredIndex : 0;
        var baseProd = productions[baseIndex];
        if (isProductionHealthy(baseProd)) { return baseIndex; }
        for (var idx = 0; idx < productions.length; idx++) {
            if (idx === baseIndex) { continue; }
            if (isProductionHealthy(productions[idx])) { return idx; }
        }
        return baseIndex;
    }

    function getMetadataFileName(productionObject) {
        if (!productionObject) { return null; }
        if (productionObject.metadataFile) { return productionObject.metadataFile; }
        if (productionObject.cacheFile) { return productionObject.cacheFile.replace('_cache', '_metadata'); }
        return null;
    }

    function loadMetadataInBackground(productionObject) {
        var prodName = productionObject.name;
        if (metadataCache[prodName] || !productionObject) { return; }
        var telemetry = startTelemetrySpan('loadMetadata:' + prodName);
        var metadataFileName = getMetadataFileName(productionObject);
        if (!metadataFileName) {
            metadataCache[prodName] = { raw: null, sanitized: [] };
            endTelemetrySpan(telemetry, { entries: 0, prod: prodName, status: 'noFilename' });
            return;
        }
        var metadataFile = new File(scriptPreferencesPath + '/cache/' + metadataFileName);
        if (!metadataFile || !metadataFile.exists) {
            var derivedMetaName = deriveMetadataFileFromName(prodName);
            if (derivedMetaName && derivedMetaName !== metadataFileName) {
                var fallbackMeta = new File(scriptPreferencesPath + '/cache/' + derivedMetaName);
                if (fallbackMeta.exists) {
                    productionObject.metadataFile = derivedMetaName;
                    metadataFile = fallbackMeta;
                    saveSystemConfigs();
                    logInfo('Atualizei referencia de metadata para ' + prodName + ': ' + derivedMetaName);
                }
            }
        }
        if (!metadataFile || !metadataFile.exists) {
            metadataCache[prodName] = { raw: null, sanitized: [] };
            logWarn('Metadados nao encontrados para ' + prodName + ' (' + metadataFileName + ')');
            endTelemetrySpan(telemetry, { entries: 0, prod: prodName, status: 'missing' });
            return;
        }
        var metadataData = readJsonFile(metadataFile);
        if (metadataData && typeof metadataData === 'object') {
            var mergedEntries = [];
            var orderedMetaKeys = getOrderedCacheKeysForProduction(productionObject, metadataData);
            for (var m = 0; m < orderedMetaKeys.length; m++) {
                var metaKey = orderedMetaKeys[m];
                var pathEntries = metadataData[metaKey];
                if (!(pathEntries instanceof Array)) { continue; }
                for (var e = 0; e < pathEntries.length; e++) {
                    mergedEntries.push(pathEntries[e]);
                }
            }
            metadataCache[prodName] = {
                raw: metadataData,
                orderedKeys: orderedMetaKeys,
                sanitized: null
            };
            endTelemetrySpan(telemetry, { entries: mergedEntries.length, prod: prodName });
        } else {
            metadataCache[prodName] = { raw: null, sanitized: [] };
            logWarn('Falha ao interpretar metadados de ' + prodName + ' (' + metadataFileName + ')');
            endTelemetrySpan(telemetry, { entries: 0, prod: prodName, status: 'parseError' });
        }
    }

    function safeLoadMetadata(productionObject) {
        if (!productionObject) { return; }
        var prodName = productionObject.name;
        if (metadataCache[prodName]) { return; }
        try {
            loadMetadataInBackground(productionObject);
        } catch (metadataErr) {
            metadataCache[prodName] = { raw: null, sanitized: [] };
            notifyCacheIssue('Erro ao carregar metadados de ' + prodName + ': ' + (metadataErr && metadataErr.message ? metadataErr.message : metadataErr));
            logError('Erro ao carregar metadados de ' + prodName + ': ' + metadataErr);
        }
    }

    function normalizeSearchText(value) {
        var result = (typeof value === 'string') ? value.toUpperCase() : '';
        if (typeof String.prototype.replaceSpecialCharacters === 'function') {
            try { result = result.replaceSpecialCharacters(); } catch (normErr) {}
        }
        return result;
    }

    function extractCodesFromValue(value) {
        var codes = [];
        if (!value || typeof value !== 'string') { return codes; }
        var upper = value.toUpperCase();
        var regex = /[A-Z]{3,}[0-9]{2,}/g;
        var match;
        while ((match = regex.exec(upper)) !== null) {
            if (codes.indexOf(match[0]) === -1) { codes.push(match[0]); }
        }
        return codes;
    }

    function detectCodeFromTerm(term) {
        if (!term) { return null; }
        var upper = term.toUpperCase();
        var regex = /[A-Z]{3,}[0-9]{2,}/;
        var match = upper.match(regex);
        return match ? match[0] : null;
    }

    function collectItemsFromTree(treeArray, results) {
        if (!(treeArray instanceof Array)) { return; }
        for (var i = 0; i < treeArray.length; i++) {
            var entry = treeArray[i];
            if (!entry) { continue; }
            if (entry.type === 'item') {
                if (metadataEntryShouldBeIgnored(entry)) { continue; }
                results.push(entry);
            } else if (entry.type === 'node' && entry.children) {
                collectItemsFromTree(entry.children, results);
            }
        }
    }

    function notifyCacheIssue(message) {
        if (!message) { return; }
        logWarn(message);
        try {
            if ($.global.__gnewsTemplatesLastAlert !== message) {
                $.global.__gnewsTemplatesLastAlert = message;
                showThemedAlert(message, scriptName);
            }
        } catch (alertErr) { /* silencioso */ }
    }

    function safeLoadCache(productionObject) {
        if (!productionObject || !productionObject.name) { return; }
        try {
            loadCacheInBackground(productionObject);
        } catch (loadErr) {
            var prodNameSafe = productionObject.name;
            var errText = 'Erro inesperado ao carregar o cache de ' + prodNameSafe + ': ' + (loadErr && loadErr.message ? loadErr.message : loadErr);
            cacheErrorPlaceholder(prodNameSafe, errText);
            markProductionFailure(prodNameSafe, errText);
            logError(errText);
            notifyCacheIssue(errText);
        }
    }

    function safePerformSearch(searchTerm) {
        var startedLoading = false;
        if (!loadingGrp.visible) {
            setLoadingState(true, 'Atualizando resultados');
            startedLoading = true;
        }
        var completed = true;
        try {
            completed = performSearch(searchTerm) === true;
        } catch (searchErr) {
            completed = true;
            notifyCacheIssue('Erro ao atualizar a lista de templates: ' + (searchErr && searchErr.message ? searchErr.message : searchErr));
        }
        if (startedLoading && completed) {
            setLoadingState(false);
        }
    }

    function flattenTreeForPagination(treeArray, parentChain, sink, parentKey) {
        if (!(treeArray instanceof Array)) { return; }
        var baseChain = parentChain || [];
        for (var i = 0; i < treeArray.length; i++) {
            var entry = treeArray[i];
            if (!entry) { continue; }
            var nodeKey = (parentKey || '') + '/' + i + ':' + (entry.text || '');
            if (entry.type === 'node') {
                var nextChain = baseChain.slice(0);
                nextChain.push({ text: entry.text, key: nodeKey, ref: entry });
                flattenTreeForPagination(entry.children || [], nextChain, sink, nodeKey);
            } else if (entry.type === 'item') {
                if (metadataEntryShouldBeIgnored(entry)) { continue; }
                sink.push({
                    item: entry,
                    parents: baseChain.slice(0)
                });
            }
        }
    }

    function collectIndexEntries(treeArray, parentChain, sink) {
        if (!(treeArray instanceof Array)) { return; }
        var baseChain = parentChain || [];
        for (var i = 0; i < treeArray.length; i++) {
            var entry = treeArray[i];
            if (!entry) { continue; }
            if (entry.type === 'node') {
                var nextChain = baseChain.slice(0);
                nextChain.push({
                    text: entry.text || '',
                    key: baseChain.length + ':' + i,
                    ref: entry
                });
                collectIndexEntries(entry.children || [], nextChain, sink);
            } else if (entry.type === 'item') {
                if (metadataEntryShouldBeIgnored(entry)) { continue; }
                var parentsInfo = [];
                for (var p = 0; p < baseChain.length; p++) {
                    parentsInfo.push({
                        text: baseChain[p].text,
                        key: baseChain[p].key,
                        ref: baseChain[p].ref
                    });
                }
                var searchSource = (entry.text || '') + ' ' + ((parentsInfo.length ? parentsInfo[parentsInfo.length - 1].text : '') || '');
                if (entry.filePath) { searchSource += ' ' + entry.filePath; }
                var entryInfo = {
                    item: entry,
                    parents: parentsInfo,
                    searchText: searchSource.toUpperCase()
                };
                var codes = extractCodesFromValue(entry.text || '');
                if (entry.filePath) {
                    var pathCodes = extractCodesFromValue(entry.filePath);
                    for (var c = 0; c < pathCodes.length; c++) {
                        if (codes.indexOf(pathCodes[c]) === -1) { codes.push(pathCodes[c]); }
                    }
                }
                entryInfo.codes = codes;
                sink.push(entryInfo);
            }
        }
    }

    function buildProductionIndex(prodName, treeData) {
        if (!prodName) { return; }
        var indexEntries = [];
        collectIndexEntries(treeData, [], indexEntries);
        productionQuickIndex[prodName] = indexEntries;
        var codeMap = {};
        for (var i = 0; i < indexEntries.length; i++) {
            var entryInfo = indexEntries[i];
            if (!entryInfo || !entryInfo.codes) { continue; }
            for (var c = 0; c < entryInfo.codes.length; c++) {
                var codeVal = entryInfo.codes[c];
                if (!codeMap[codeVal]) { codeMap[codeVal] = []; }
                codeMap[codeVal].push(entryInfo);
            }
        }
        productionCodeIndex[prodName] = codeMap;
    }

    function buildTreeFromFlatSlice(flatItems) {
        var root = [];
        var nodeIndex = {};

        function ensureNode(parentMap, targetList, parentInfo) {
            var key = parentInfo.key;
            if (!parentMap[key]) {
                var newNode = {
                    type: 'node',
                    text: parentInfo.text,
                    children: [],
                    nodePathKey: key
                };
                if (parentInfo.ref) {
                    if (parentInfo.ref.image) { newNode.image = parentInfo.ref.image; }
                    if (parentInfo.ref.icon) { newNode.icon = parentInfo.ref.icon; }
                }
                parentMap[key] = { node: newNode, children: {} };
                targetList.push(newNode);
            }
            return parentMap[key];
        }

        for (var i = 0; i < flatItems.length; i++) {
            var flatEntry = flatItems[i];
            if (!flatEntry || !flatEntry.item) { continue; }
            var targetList = root;
            var parentMap = nodeIndex;
            var parents = flatEntry.parents || [];
            for (var p = 0; p < parents.length; p++) {
                var ensured = ensureNode(parentMap, targetList, parents[p]);
                targetList = ensured.node.children;
                parentMap = ensured.children;
            }
            targetList.push(flatEntry.item);
        }
        return root;
    }

    function populateTreePage(treeView, flatItems, pageIndex) {
        cancelTreeRenderTask();
        treeView.removeAll();
        if (!flatItems || flatItems.length === 0) { return; }
        var start = pageIndex * itemsPerPage;
        var end = Math.min(start + itemsPerPage, flatItems.length);
        var slice = flatItems.slice(start, end);
        var subsetTree = buildTreeFromFlatSlice(slice);
        var stack = [];
        for (var i = subsetTree.length - 1; i >= 0; i--) {
            stack.push({ entry: subsetTree[i], parent: treeView, mode: 'search' });
        }
        $.global.__gnewsTreeRenderState = {
            stack: stack,
            treeView: treeView,
            mode: 'search'
        };
        runTreeRenderChunk();
    }

    function loadCacheInBackground(productionObject) {
        var prodName = productionObject.name;
        ensureProductionFileReferences(productionObject, false);
        if ((templatesCache[prodName] && templatesCache[prodName].__error !== true) || !productionObject.cacheFile) return;
        var telemetry = startTelemetrySpan('loadCache:' + prodName);
        var cacheFile = new File(scriptPreferencesPath + '/cache/' + productionObject.cacheFile);
        if (!cacheFile || !cacheFile.exists) {
            var derivedCacheName = deriveCacheFileFromName(prodName);
            if (derivedCacheName && derivedCacheName !== productionObject.cacheFile) {
                var fallbackCache = new File(scriptPreferencesPath + '/cache/' + derivedCacheName);
                if (fallbackCache.exists) {
                    productionObject.cacheFile = derivedCacheName;
                    var derivedMetaName = deriveMetadataFileFromName(prodName);
                    if (derivedMetaName) { productionObject.metadataFile = derivedMetaName; }
                    cacheFile = fallbackCache;
                    saveSystemConfigs();
                    logInfo('Atualizei referencia de cache para ' + prodName + ': ' + derivedCacheName);
                }
            }
        }
        if (!cacheFile || !cacheFile.exists) {
            var missingMsg = 'Cache para ' + prodName + ' nao encontrado (' + productionObject.cacheFile + ').';
            cacheErrorPlaceholder(prodName, missingMsg);
            markProductionFailure(prodName, missingMsg);
            logWarn(missingMsg);
            notifyCacheIssue(missingMsg);
            endTelemetrySpan(telemetry, { status: 'missing', prod: prodName });
            return;
        }
        var masterCacheData = readJsonFile(cacheFile);
        if (!masterCacheData || typeof masterCacheData !== 'object') {
            var readMsg = 'Falha ao ler o cache de ' + prodName + '.';
            cacheErrorPlaceholder(prodName, readMsg);
            markProductionFailure(prodName, readMsg);
            logError(readMsg);
            notifyCacheIssue(readMsg);
            endTelemetrySpan(telemetry, { status: 'readError', prod: prodName });
            return;
        }
        try {
            var aggregatedTree = [];
            var orderedCacheKeys = getOrderedCacheKeysForProduction(productionObject, masterCacheData);
            if (!orderedCacheKeys.length) {
                for (var fallbackKey in masterCacheData) {
                    if (masterCacheData.hasOwnProperty(fallbackKey)) {
                        pushUniqueValue(orderedCacheKeys, fallbackKey);
                    }
                }
            }
            for (var i = 0; i < orderedCacheKeys.length; i++) {
                var cacheKey = orderedCacheKeys[i];
                var normalizedBranch = normalizeCacheEntries(masterCacheData[cacheKey]);
                if (!normalizedBranch || !normalizedBranch.length) { continue; }
                for (var c = 0; c < normalizedBranch.length; c++) {
                    aggregatedTree.push(normalizedBranch[c]);
                }
            }
            if (!aggregatedTree.length) {
                var emptyMsg = 'Nenhum template valido encontrado para ' + prodName + '.';
                cacheErrorPlaceholder(prodName, emptyMsg);
                markProductionFailure(prodName, emptyMsg);
                logWarn(emptyMsg);
                notifyCacheIssue(emptyMsg);
                return;
            }
            templatesCache[prodName] = aggregatedTree;
            buildProductionIndex(prodName, aggregatedTree);
            if (templatesCache[prodName].__error) { delete templatesCache[prodName].__error; }
            var manifestSummary = summarizeManifestForProduction(productionObject, readCacheManifest(true));
            var successMsg = manifestSummary ? formatManifestSummary(manifestSummary) : (aggregatedTree.length + (aggregatedTree.length === 1 ? ' item carregado' : ' itens carregados'));
            markProductionSuccess(prodName, successMsg);
            logInfo('Cache carregado para ' + prodName + ' (' + aggregatedTree.length + ' itens)');
            endTelemetrySpan(telemetry, { status: 'ok', prod: prodName, items: aggregatedTree.length });
        } catch (cacheErr) {
            var processMsg = 'Erro ao processar o cache de ' + prodName + ': ' + (cacheErr && cacheErr.message ? cacheErr.message : cacheErr);
            cacheErrorPlaceholder(prodName, processMsg);
            markProductionFailure(prodName, processMsg);
            logError(processMsg);
            notifyCacheIssue(processMsg);
            endTelemetrySpan(telemetry, { status: 'exception', prod: prodName });
            return;
        }
    }

    function populateListPage(listBox, allItems) {
        listBox.removeAll();
        var startIndex = currentPage * itemsPerPage;
        var endIndex = startIndex + itemsPerPage;
        var itemsToDisplay = allItems.slice(startIndex, endIndex);
        for (var j = 0; j < itemsToDisplay.length; j++) {
            var itemData = itemsToDisplay[j];
            var listItem = listBox.add('item', itemData.text);
            listItem.filePath = itemData.filePath; listItem.modDate = itemData.modDate; listItem.size = itemData.size;
            if (typeof D9T_AE_ICON !== 'undefined') listItem.image = D9T_AE_ICON;
        }
    }
    
    function populateTreeFromDataIterative(rootNode, dataArray) {
        rootNode.removeAll();
        var stack = [];
        for (var i = (dataArray || []).length - 1; i >= 0; i--) { stack.push({ data: dataArray[i], parent: rootNode }); }
        while (stack.length > 0) {
            var current = stack.pop(); var itemData = current.data; var parentUINode = current.parent; var newUINode = null;
            if (itemData.type === 'node') {
                newUINode = parentUINode.add('node', itemData.text);
                if (typeof D9T_FOLDER_AE_ICON !== 'undefined') newUINode.image = D9T_FOLDER_AE_ICON;
                if (itemData.children && itemData.children.length > 0) {
                    for (var j = itemData.children.length - 1; j >= 0; j--) { stack.push({ data: itemData.children[j], parent: newUINode }); }
                }
            } else if (itemData.type === 'item') {
                newUINode = parentUINode.add('item', itemData.text);
                if (typeof D9T_AE_ICON !== 'undefined') newUINode.image = D9T_AE_ICON;
                newUINode.filePath = itemData.filePath; newUINode.modDate = itemData.modDate; newUINode.size = itemData.size;
            }
        }
    }

    function createLazyTreeItem(parentNode, itemData) {
        var newItem = parentNode.add('item', itemData.text);
        if (typeof D9T_AE_ICON !== 'undefined') { newItem.image = D9T_AE_ICON; }
        newItem.filePath = itemData.filePath;
        newItem.modDate = itemData.modDate;
        newItem.size = itemData.size;
        return newItem;
    }

    function createLazyTreeNode(parentNode, entryData) {
        var node = parentNode.add('node', entryData.text);
        if (typeof D9T_FOLDER_AE_ICON !== 'undefined') { node.image = D9T_FOLDER_AE_ICON; }
        node.__dataRef = entryData;
        if (entryData.children && entryData.children.length) {
            node.__childState = 'pending';
            node.__placeholder = node.add('item', '...');
        } else {
            node.__childState = 'empty';
        }
        node.onExpand = function () { ensureNodeChildrenLoaded(this); };
        return node;
    }

    function ensureNodeChildrenLoaded(treeNode) {
        if (!treeNode || treeNode.__childState !== 'pending' || !treeNode.__dataRef) { return; }
        treeNode.__childState = 'loading';
        var entry = treeNode.__dataRef;
        treeNode.removeAll();
        var children = entry.children || [];
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!child) { continue; }
            if (child.type === 'node') {
                createLazyTreeNode(treeNode, child);
            } else if (child.type === 'item') {
                createLazyTreeItem(treeNode, child);
            }
        }
        treeNode.__childState = 'loaded';
        treeNode.expanded = true;
    }

    function populateTreeLazy(treeView, dataArray) {
        cancelTreeRenderTask();
        treeView.removeAll();
        if (!(dataArray instanceof Array) || dataArray.length === 0) { return; }
        var stack = [];
        for (var i = dataArray.length - 1; i >= 0; i--) {
            stack.push({ entry: dataArray[i], parent: treeView, mode: 'lazy' });
        }
        $.global.__gnewsTreeRenderState = {
            stack: stack,
            treeView: treeView,
            mode: 'lazy'
        };
        runTreeRenderChunk();
    }

    function quickCountItemsFromTree(entries) {
        if (!(entries instanceof Array)) { return 0; }
        var total = 0;
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (!entry) { continue; }
            if (entry.type === 'item') {
                total++;
            } else if (entry.type === 'node' && entry.children) {
                total += quickCountItemsFromTree(entry.children);
            }
        }
        return total;
    }

    function getAepVersion(aepFile) {
        if (!aepFile || !aepFile.exists) { return "N/A"; }
        try {
            aepFile.encoding = "BINARY"; aepFile.open('r'); var fileContent = aepFile.read(4000000); aepFile.close();
            var version = "Desconhecida";
            var lastCreatorToolIndex = fileContent.lastIndexOf("<xmp:CreatorTool>");
            var lastAgentIndex = fileContent.lastIndexOf("<stEvt:softwareAgent>");
            var searchIndex = -1; var regexToUse = null;
            if (lastCreatorToolIndex > lastAgentIndex) { searchIndex = lastCreatorToolIndex; regexToUse = /<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i; }
            else if (lastAgentIndex > -1) { searchIndex = lastAgentIndex; regexToUse = /<stEvt:softwareAgent>(.*?)<\/stEvt:softwareAgent>/i; }
            if (searchIndex > -1) {
                var match = regexToUse.exec(fileContent.substring(searchIndex));
                if (match && match[1]) { version = match[1].replace(/^\s+|\s+$/g, ''); }
            }
            if (version === "Desconhecida") {
                 var genericMatch = fileContent.match(/Adobe After Effects \d{2,4}\.\d/);
                 if (genericMatch) { version = genericMatch[0]; }
            }
            if (version.indexOf("Photoshop") > -1) { version = version.replace("Photoshop", "After Effects"); }
            if (version.match(/24\.\d/)) return "After Effects 2024";
            if (version.match(/23\.\d/)) return "After Effects 2023";
            if (version.match(/22\.\d/)) return "After Effects 2022";
            if (version.match(/18\.\d/)) return "After Effects 2021";
            if (version.match(/17\.\d/)) return "After Effects 2020";
            return version;
        } catch (e) { return "Erro de leitura"; }
    }

    function generateCodigoFromTemplate(templateName) {
        try {
            var name = (typeof deleteFileExt === 'function' ? deleteFileExt(templateName) : templateName.replace(/\.[^\.]+$/, '')).toUpperCase();
            var currentYear = new Date().getFullYear().toString();
            var cleanName = name.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            var words = cleanName.split(' ');
            var lettersOnly = cleanName.replace(/[^A-Z]/g, '');
            var codigo = '';
            if (words.length >= 3) {
                codigo = lettersOnly.substring(0, 2) + words[1].charAt(0) + words[2].charAt(0) + currentYear;
            } else if (words.length === 2) {
                codigo = lettersOnly.substring(0, 3) + words[1].charAt(0) + currentYear;
            } else {
                codigo = lettersOnly.substring(0, 4) + currentYear;
            }
            return codigo.toUpperCase();
        } catch (e) { return 'AUTO' + new Date().getFullYear(); }
    }

    function determineServidorDestino(templateName, templatePath) {
        try {
            var fullText = (templateName + ' ' + (templatePath || '')).toUpperCase();
            var ilhaTerms = ['PESQUISA', 'DATAFOLHA', 'QUAEST', 'IPEC', 'CREDITO', 'INSERT', 'ALPHA'];
            for (var i = 0; i < ilhaTerms.length; i++) { if (fullText.indexOf(ilhaTerms[i]) !== -1) return 'PARA ILHA'; }
            var vizTerms = ['CABECALHO', 'QR CODE', 'VIRTUAL', 'TOTEM'];
            for (var j = 0; j < vizTerms.length; j++) { if (fullText.indexOf(vizTerms[j]) !== -1) return 'VIZ'; }
                        var magazineTerms = ['ESTUDIO I', 'STUDIO I', 'GLOBONEWS INTERNACIONAL', 'BALAIO'];
            for (var k = 0; k < magazineTerms.length; k++) { if (fullText.indexOf(magazineTerms[k]) !== -1) return 'PAM MAGAZINE'; }
            return 'PAM HARDNEWS';
        } catch (e) { return '---'; }
    }

    function updateArteInfo(selectedTemplate) {
        if (selectedTemplate && selectedTemplate.filePath) {
            currentPreviewFile = selectedTemplate.filePath;
            var cachedInfo = previewInfoCache[currentPreviewFile];
            if (cachedInfo) {
                applyPreviewInfo(cachedInfo);
                return;
            }
            infoValues[0].text = (typeof deleteFileExt === 'function' ? deleteFileExt(selectedTemplate.text) : selectedTemplate.text.replace(/\.[^\.]+$/, '')).toUpperCase();
            codigoTxt.text = '...';
            infoValues[1].text = '...';
            infoValues[2].text = '...';
            infoValues[3].text = '...';
            infoValues[4].text = decodeURI(selectedTemplate.filePath);
            queuePreviewComputation(selectedTemplate.filePath, selectedTemplate.text);
        } else {
            currentPreviewFile = null;
            codigoTxt.text = '';
            infoValues[0].text = '---'; infoValues[1].text = '---'; infoValues[2].text = '---'; infoValues[3].text = '---'; infoValues[4].text = '---';
        }
    }
    
    function expandAllNodes(tree) {
        if (!tree || !tree.items) return;
        var stack = []; for (var i = 0; i < tree.items.length; i++) { stack.push(tree.items[i]); }
        while (stack.length > 0) {
            var node = stack.pop();
            if (node.type === 'node') {
                node.expanded = true;
                if (node.items) { for (var j = 0; j < node.items.length; j++) { stack.push(node.items[j]); } }
            }
        }
    }

    function stopLoadingAnimation() {
        if (loadingAnimationTaskId) {
            try { app.cancelTask(loadingAnimationTaskId); } catch (cancelErr) {}
            loadingAnimationTaskId = null;
        }
        if ($.global.__gnewsLoadingAnimation) {
            try { delete $.global.__gnewsLoadingAnimation; } catch (delErr) {}
        }
    }

    function startLoadingAnimation(baseText) {
        stopLoadingAnimation();
        loadingAnimationBaseText = baseText || 'Carregando, por favor aguarde';
        loadingAnimationFrame = 0;
        $.global.__gnewsLoadingAnimation = function () {
            if (!loadingGrp || !loadingGrp.visible) {
                stopLoadingAnimation();
                return;
            }
            loadingAnimationFrame = (loadingAnimationFrame + 1) % 4;
            var dots = '';
            for (var i = 0; i < loadingAnimationFrame; i++) { dots += '.'; }
            loadingGrp.children[0].text = loadingAnimationBaseText + dots;
            try { loadingGrp.update(); } catch (updErr) {}
            loadingAnimationTaskId = app.scheduleTask('$.global.__gnewsLoadingAnimation()', 250, false);
        };
        $.global.__gnewsLoadingAnimation();
    }

    function setLoadingState(isLoading, message) {
        loadingGrp.children[0].text = message || 'Carregando, por favor aguarde...';
        loadingGrp.visible = isLoading;
        templateTree.visible = !isLoading && !listViewChk.value;
        templateList.visible = !isLoading && listViewChk.value;
        if (isLoading) {
            startLoadingAnimation(message || 'Carregando, por favor aguarde');
        } else {
            stopLoadingAnimation();
        }
    }
    
    function updatePaginationControls(totalItems) {
        var totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            paginationGrp.visible = false;
            return;
        }
        paginationGrp.visible = true;
        pageInfo.text = "Pagina " + (currentPage + 1) + " de " + totalPages;
        prevBtn.enabled = (currentPage > 0);
        nextBtn.enabled = (currentPage < totalPages - 1);
    }
    
    function updateItemCounter(totalItems) {
        itemCounterLab.text = '  ' + totalItems + (totalItems === 1 ? ' item encontrado' : ' itens encontrados');
    }

    function performSearch(searchTerm) {
        var telemetry = startTelemetrySpan('performSearch');
        var isSearch = searchTerm !== '';
        var prodName = (prodDrop.selection) ? prodDrop.selection.text : "";
        if (!prodName) {
            endTelemetrySpan(telemetry, { status: 'noProduction' });
            return false;
        }

        var productionObject = (prodDrop.selection && productions[prodDrop.selection.index]) ? productions[prodDrop.selection.index] : null;
        if (!productionObject) {
            endTelemetrySpan(telemetry, { status: 'invalidProduction' });
            return false;
        }
        if (!templatesCache[prodName]) {
            pendingPopulateProduction = productionObject.name;
            queueProductionPreload(prodDrop.selection ? prodDrop.selection.index : 0, 50);
            templateTree.removeAll();
            templateList.removeAll();
            updateItemCounter(0);
            setLoadingState(true, 'Carregando ' + productionObject.name + '...');
            endTelemetrySpan(telemetry, { status: 'pendingLoad', prod: prodName });
            return false;
        }

        if (listViewChk.value) {
            safeLoadMetadata(productionObject);
            var metadataItems = getSanitizedMetadataEntries(prodName);
            if (!metadataItems || !metadataItems.length) {
                if (!templatesCache[prodName]) { safeLoadCache(productionObject); }
                var fallbackTree = templatesCache[prodName] || [];
                metadataItems = [];
                collectItemsFromTree(fallbackTree, metadataItems);
                setSanitizedMetadataEntries(prodName, metadataItems);
            }
            metadataItems = metadataItems || [];
            var cleanTerm = normalizeSearchText(searchTerm);
            for (var metaIndex = 0; metaIndex < metadataItems.length; metaIndex++) {
                var metaItem = metadataItems[metaIndex];
                if (metaItem && !metaItem.searchText) {
                    var metaSource = (metaItem.text || '') + ' ' + ((metaItem.parents || []).join(' '));
                    metaItem.searchText = normalizeSearchText(metaSource);
                }
            }

            var listItems = metadataItems.slice(0);
            if (isSearch) {
                listItems = [];
                for (var m = 0; m < metadataItems.length; m++) {
                    var meta = metadataItems[m];
                    var searchSource = meta.searchText || normalizeSearchText((meta.text || '') + ' ' + ((meta.parents || []).join(' ')));
                    if (searchSource.indexOf(cleanTerm) !== -1) { listItems.push(meta); }
                }
            }

            paginationGrp.visible = true;
            filteredDataCache = listItems;
            updateItemCounter(filteredDataCache.length);
            updatePaginationControls(filteredDataCache.length);
            populateListPage(templateList, filteredDataCache);
            setLoadingState(false);
            endTelemetrySpan(telemetry, { mode: 'list', results: filteredDataCache.length, search: isSearch, prod: prodName });
            return true;
        }

        var masterData = templatesCache[prodName];
        if (!masterData) {
            templateTree.removeAll();
            updateItemCounter(0);
            endTelemetrySpan(telemetry, { mode: 'tree', results: 0, status: 'noCache', prod: prodName });
            return false;
        }

        if (!isSearch) {
            treeFlatCache = [];
            paginationGrp.visible = false;
            var manifestSummary = summarizeManifestForProduction(productionObject, readCacheManifest(false));
            if (manifestSummary && manifestSummary.itemCount) {
                updateItemCounter(manifestSummary.itemCount);
            } else {
                updateItemCounter(quickCountItemsFromTree(masterData));
            }
            populateTreeLazy(templateTree, masterData);
            setLoadingState(false);
            endTelemetrySpan(telemetry, { mode: 'tree', search: false, prod: prodName });
            return true;
        }

        treeFlatCache = [];
        var cleanSearchTerm = normalizeSearchText(searchTerm);
        var indexEntries = productionQuickIndex[prodName];
        if ((!indexEntries || !indexEntries.length) && masterData) {
            buildProductionIndex(prodName, masterData);
            indexEntries = productionQuickIndex[prodName];
        }
        var codeKey = detectCodeFromTerm(searchTerm);
        if (codeKey && productionCodeIndex[prodName] && productionCodeIndex[prodName][codeKey]) {
            var codeMatches = productionCodeIndex[prodName][codeKey];
            treeFlatCache = [];
            for (var cm = 0; cm < codeMatches.length; cm++) {
                var matchEntry = codeMatches[cm];
                treeFlatCache.push({
                    item: matchEntry.item,
                    parents: matchEntry.parents
                });
            }
        } else if (indexEntries && indexEntries.length) {
            for (var idx = 0; idx < indexEntries.length; idx++) {
                var entryInfo = indexEntries[idx];
                if (!entryInfo || !entryInfo.item) { continue; }
                var entrySearchText = entryInfo.searchText || normalizeSearchText(entryInfo.item.text || '');
                if (entrySearchText.indexOf(cleanSearchTerm) !== -1) {
                    treeFlatCache.push({
                        item: entryInfo.item,
                        parents: entryInfo.parents || []
                    });
                }
            }
        }

        if (treeFlatCache.length === 0) {
            function filterTreeData(data) {
                var filteredList = [];
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    if (!item) { continue; }
                    var itemText = normalizeSearchText(item.text || '');
                    if (item.type === 'item') {
                        if (itemText.indexOf(cleanSearchTerm) !== -1) { filteredList.push(item); }
                    } else if (item.type === 'node') {
                        var filteredChildren = filterTreeData(item.children || []);
                        if (itemText.indexOf(cleanSearchTerm) !== -1 || filteredChildren.length > 0) {
                            var nodeCopy = JSON.parse(JSON.stringify(item));
                            nodeCopy.children = filteredChildren;
                            filteredList.push(nodeCopy);
                        }
                    }
                }
                return filteredList;
            }
            var fallbackResults = filterTreeData(masterData || []);
            treeFlatCache = [];
            flattenTreeForPagination(fallbackResults, [], treeFlatCache, '');
        }

        var totalTreeItems = treeFlatCache.length;
        updateItemCounter(totalTreeItems);
        templateTree.removeAll();
        if (totalTreeItems > 0) {
            populateTreePage(templateTree, treeFlatCache, currentPage);
        }
        updatePaginationControls(totalTreeItems);
        setLoadingState(false);
        endTelemetrySpan(telemetry, { mode: 'tree', search: true, results: totalTreeItems, prod: prodName });
        return true;
    }



    function getSelectedFile() {
        var view = listViewChk.value ? templateList : templateTree;
        return (view.selection && view.selection.filePath) ? new File(view.selection.filePath) : null;
    }
    
    function executeOpen() {
        var fileToOpen = getSelectedFile();
        if (fileToOpen && fileToOpen.exists) { D9T_TEMPLATES_w.close(); app.open(fileToOpen); } 
        else { showThemedAlert("Arquivo nao encontrado ou nenhum template selecionado.", 'Aviso'); }
    }
    
    function executeImport() {
        var fileToImport = getSelectedFile();
        if (!fileToImport) { showThemedAlert("Selecione um template.", 'Aviso'); return; }
        if (!fileToImport.exists) { showThemedAlert("Arquivo nao encontrado.", 'Aviso'); return; }
        try {
            app.project.importFile(new ImportOptions(fileToImport));
            D9T_TEMPLATES_w.close();
        } catch (e) { showThemedAlert("Erro ao importar template: " + e.message, 'Erro ao importar'); }
    }
    
        // --- LIGACAO DOS EVENTOS ---
    prodDrop.onChange = function () {
        GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates.lastProductionIndex = this.selection.index;
        var selectedIndex = (this.selection) ? this.selection.index : -1;
        if (selectedIndex > -1 && productions[selectedIndex]) {
            pendingPopulateProduction = productions[selectedIndex].name;
            queueProductionPreload(selectedIndex, 50);
            rebuildPrefetchQueue(selectedIndex);
            schedulePrefetchCycle(PREFETCH_INTERVAL);
        }
        updateProductionStatusLabel(selectedIndex);
        saveSystemConfigs(); 
        currentPage = 0;
        safePerformSearch(searchBox.isPlaceholderActive ? "" : searchBox.text);
    };
    searchBox.onActivate = function () { if (this.isPlaceholderActive) { this.text = ''; this.isPlaceholderActive = false; setFgColor(this, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF'); } };
    searchBox.onDeactivate = function () { if (this.text === '') { this.text = placeholderText; this.isPlaceholderActive = true; setFgColor(this, (typeof monoColor0 !== 'undefined') ? monoColor0 : '#F2F2F2'); currentPage = 0; safePerformSearch(''); } };
    searchBox.onChanging = function () {
        if (searchDebounceTimer) { try { app.cancelTask(searchDebounceTimer); } catch (e) { } }
        var thisSearchBox = this;
        $.global.executeScheduledSearch = function () { 
            currentPage = 0;
            if (!thisSearchBox.isPlaceholderActive) { safePerformSearch(thisSearchBox.text); }
        };
        searchDebounceTimer = app.scheduleTask('$.global.executeScheduledSearch()', 350, false);
    };
    listViewChk.onClick = function () {
        templateList.visible = this.value; 
        templateTree.visible = !this.value; 
        currentPage = 0;
        safePerformSearch(searchBox.isPlaceholderActive ? "" : searchBox.text);
    };
    
    prevBtn.onClick = function() {
        if (currentPage > 0) {
            currentPage--;
            if (listViewChk.value) {
                populateListPage(templateList, filteredDataCache);
                updatePaginationControls(filteredDataCache.length);
            } else {
                populateTreePage(templateTree, treeFlatCache, currentPage);
                updatePaginationControls(treeFlatCache.length);
            }
        }
    };
    nextBtn.onClick = function() {
        var totalItems = listViewChk.value ? filteredDataCache.length : treeFlatCache.length;
        var totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages - 1) {
            currentPage++;
            if (listViewChk.value) {
                populateListPage(templateList, filteredDataCache);
                updatePaginationControls(filteredDataCache.length);
            } else {
                populateTreePage(templateTree, treeFlatCache, currentPage);
                updatePaginationControls(treeFlatCache.length);
            }
        }
    };

    var handleRefresh = function () {
        resetSharedCaches();
        pendingPopulateProduction = null;
        stopPrefetchCycle();
        invalidateManifestCache();
        invalidateConfigCache();
        warmupState = ensureWarmupState(true);
        startCachePipelineWarmup();
        setLoadingState(true, 'Recarregando caches...');
        D9T_TEMPLATES_w.update();
        kickoffInitialization();
    };
    if (refreshBtn.leftClick) { refreshBtn.leftClick.onClick = handleRefresh; } else { refreshBtn.onClick = handleRefresh; }
    var openTemplatesFolder = function () {
        var selectedProduction = productions[prodDrop.selection.index];
        var folderToShow = new Folder(selectedProduction.paths[0]); 
        if (folderToShow.exists) { folderToShow.execute(); } else { showThemedAlert("O caminho nao foi encontrado:\n" + folderToShow.fsName, 'Aviso'); }
    };
    if (openFldBtn.leftClick) { openFldBtn.leftClick.onClick = openTemplatesFolder; } else { openFldBtn.onClick = openTemplatesFolder; }
    var onSelectionChange = function (selection) { updateArteInfo(selection); };
    templateTree.onChange = function () {
        var selection = this.selection;
        if (!selection) { return; }
        if (selection.type === 'node') {
            if (selection.__childState === 'pending') {
                ensureNodeChildrenLoaded(selection);
            }
            this.selection = null;
            return;
        }
        onSelectionChange(selection);
    };
    templateList.onChange = function () { onSelectionChange(this.selection); };
    codigoTxt.onChanging = function() {
        var codeToFind = this.text.trim().toUpperCase();
        var arteInfo = null;
        var artesArray = GNEWS_TEMPLATES_CONFIG.data.ARTES_GNEWS.arte;
        for (var i = 0; i < artesArray.length; i++) {
            if (artesArray[i].codigo === codeToFind) {
                arteInfo = artesArray[i];
                break;
            }
        }
        if (arteInfo) {
            infoValues[0].text = arteInfo.arte;
            infoValues[1].text = arteInfo.servidor_destino; 
        }
    };
    var onActivateItem = function () { var view = listViewChk.value ? templateList : templateTree; if (view.selection != null && view.selection.filePath) { executeOpen(); } };
    templateTree.onDoubleClick = onActivateItem; templateList.onDoubleClick = onActivateItem;
    if (openBtn.leftClick) { openBtn.leftClick.onClick = executeOpen; } else { openBtn.onClick = executeOpen; }
    if (importBtn.leftClick) { importBtn.leftClick.onClick = executeImport; } else { importBtn.onClick = executeImport; }
    
    var showHelp = function () { if (typeof showTemplatesHelp === 'function') { showTemplatesHelp(); } else { showThemedAlert("Funcao de ajuda 'showTemplatesHelp' nao encontrada.", 'Ajuda indisponivel'); }};
    if (infoBtn.leftClick) { infoBtn.leftClick.onClick = showHelp; } else { infoBtn.onClick = showHelp; }
    
        // --- INICIALIZACAO ---
    if (D9T_TEMPLATES_w instanceof Window) {
        D9T_TEMPLATES_w.center();
        D9T_TEMPLATES_w.show();
    }
    app.scheduleTask('$.global.runInitialization()', 50, false);

    return D9T_TEMPLATES_w;
}

















