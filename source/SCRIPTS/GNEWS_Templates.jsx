// =============================================================================
// GNEWS TEMPLATES - v9.1 - Completa e Funcional
// >> DESCRICAO:
//    Restauradas todas as funcoes auxiliares que foram omitidas na
//    versao anterior. O carregamento de cache, busca, paginacao e todas
//    as outras funcionalidades estao novamente presentes e operacionais.
// =============================================================================
#targetengine "GND9_GNEWS_TEMPLATES"
$.encoding = "UTF-8";

function d9TemplateDialog(thisObj) {
    #include '../libraries/JSON lib.js';

    var scriptName = 'GNEWS TEMPLATES';
    var scriptVersion = '9.1';
    var TEMPLATE_BUTTON_SIZE = { width: 150, height: 34 }; // Ajuste rápido da largura/altura dos botões temáticos

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
    var previewVersionCache = sharedCacheStore.previewVersionCache || {};
    sharedCacheStore.previewVersionCache = previewVersionCache;
    var previewInfoOrder = sharedCacheStore.previewInfoOrder || [];
    sharedCacheStore.previewInfoOrder = previewInfoOrder;
    var lazyMetadataEnabled = true;
    var forceNetworkLoading = false;
    var productions = [];
    var filteredDataCache = [];
    var itemsPerPage = 50;
    var currentPage = 0;
    var normalizationJobsByProduction = sharedCacheStore.normalizationJobs || {};
    sharedCacheStore.normalizationJobs = normalizationJobsByProduction;
    var activeProductionName = null;
    var CACHE_BRANCH_SLICE_SIZE = 12;
    var CACHE_PREFETCH_PADDING = 0;
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
    var forcedManifestSnapshot = null;
    var forcedManifestTimestamp = 0;
    var MANIFEST_REFRESH_INTERVAL = 4000;
    var MANIFEST_FORCE_BURST_TTL = 1000;
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
    var PREVIEW_CACHE_MAX = 60;
    var prefetchPaused = false;
    var PREFETCH_RESUME_TASK_NAME = '__gnewsPrefetchResume';
    var prefetchResumeTaskId = null;
    var cacheNormalizationQueue = [];
    var cacheNormalizationTaskId = null;
    var CACHE_NORMALIZE_TASK_NAME = '__gnewsCacheNormalize';
    var CACHE_NORMALIZE_NODE_BUDGET = 150;
    var SNAPSHOT_FOLDER_SUFFIX = '/cache/gnews_snapshots';
    var SNAPSHOT_FILE_EXTENSION = '.snapshot.json';
    var SNAPSHOT_WRITE_THRESHOLD = 250;
    var SNAPSHOT_MAX_AGE = 1000 * 60 * 60 * 72; // 72 horas
    var VIRTUAL_TREE_BUCKET_THRESHOLD = 150;
    var VIRTUAL_TREE_BUCKET_SIZE = 160;
    var SNAPSHOT_META_EXTENSION = '.meta.json';
    var snapshotSignatureRegistry = sharedCacheStore.snapshotSignatures || {};
    sharedCacheStore.snapshotSignatures = snapshotSignatureRegistry;
    // Referência do dropdown de produções (usado em vários handlers)
    var prodDrop = null;
    var backgroundWarmupQueue = sharedCacheStore.backgroundWarmupQueue || [];
    sharedCacheStore.backgroundWarmupQueue = backgroundWarmupQueue;
    var backgroundWarmupTaskId = null;
    var BACKGROUND_WARMUP_TASK_NAME = '__gnewsBackgroundWarmup';
    var BACKGROUND_WARMUP_INTERVAL = 800;
    var BACKGROUND_WARMUP_IDLE_DELAY = 2600;
    var backgroundWarmupPausedUntil = 0;
    var BACKGROUND_WARMUP_ENABLED = false;
    var productionItemCounts = [];
    var DEFAULT_MAX_AUTO_ITEMS = 1500;
    (function initTemplatesLog() {
        try {
            if (typeof scriptPreferencesPath === 'string' && scriptPreferencesPath.length) {
                var logsFolder = new Folder((typeof runtimeLogsPath !== 'undefined' ? runtimeLogsPath : scriptPreferencesPath + '/logs'));
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

    function safeParseJSON(raw, fallback, contextLabel) {
        if (!raw || !raw.length) { return fallback; }
        try {
            return JSON.parse(raw);
        } catch (parseErr) {
            var label = contextLabel ? (' [' + contextLabel + ']') : '';
            var msg = 'Falha ao interpretar JSON' + label + ': ' + parseErr;
            logWarn(msg);
            try { $.writeln('[GNEWS_Templates]' + label + ' ' + parseErr); } catch (logConsoleErr) {}
            return fallback;
        }
    }

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
            manifestFileHandle = new File(runtimeCachePath + '/templates_cache_manifest.json');
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
        snapshotSignatureRegistry = sharedCacheStore.snapshotSignatures = {};
        backgroundWarmupQueue = sharedCacheStore.backgroundWarmupQueue = [];
        stopBackgroundWarmupTask();
        normalizationJobsByProduction = sharedCacheStore.normalizationJobs = {};
        cacheNormalizationQueue = [];
        if (cacheNormalizationTaskId) {
            try { app.cancelTask(cacheNormalizationTaskId); } catch (normCancelErr) {}
            cacheNormalizationTaskId = null;
        }
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
        if (prefetchResumeTaskId) {
            try { app.cancelTask(prefetchResumeTaskId); } catch (resumeErr) {}
            prefetchResumeTaskId = null;
        }
        try { if ($.global[PREFETCH_RESUME_TASK_NAME]) { delete $.global[PREFETCH_RESUME_TASK_NAME]; } } catch (resumeDelErr) {}
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

    function resolveDynamicTreeChunkSize(nodeEstimate) {
        if (!nodeEstimate || nodeEstimate <= 0) { return TREE_RENDER_CHUNK_SIZE; }
        if (nodeEstimate > 2000) { return 60; }
        if (nodeEstimate > 1200) { return 45; }
        if (nodeEstimate > 600) { return 30; }
        return Math.max(TREE_RENDER_CHUNK_SIZE, 20);
    }

    function determinePrefetchDelay(delay) {
        if (typeof delay === 'number' && delay > 0) { return delay; }
        var backlog = pendingPrefetchQueue ? pendingPrefetchQueue.length : 0;
        if (backlog > 12) { return Math.max(180, Math.round(PREFETCH_INTERVAL * 0.25)); }
        if (backlog > 6) { return Math.max(260, Math.round(PREFETCH_INTERVAL * 0.45)); }
        if (backlog > 0) { return Math.max(360, Math.round(PREFETCH_INTERVAL * 0.65)); }
        return PREFETCH_INTERVAL;
    }

    function schedulePrefetchCycle(delay) {
        if (prefetchPaused) { return; }
        stopPrefetchCycle();
        $.global[PREFETCH_TASK_NAME] = function () {
            pendingPrefetchTaskId = null;
            runPrefetchCycle();
        };
        try {
            var resolvedDelay = determinePrefetchDelay(delay);
            pendingPrefetchTaskId = app.scheduleTask('if ($.global.' + PREFETCH_TASK_NAME + ') { $.global.' + PREFETCH_TASK_NAME + '(); }', resolvedDelay, false);
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

    function pausePrefetchCycle() {
        if (prefetchPaused) { return; }
        prefetchPaused = true;
        stopPrefetchCycle();
    }

    function resumePrefetchCycle(delay) {
        var resumeDelay = typeof delay === 'number' ? delay : PREFETCH_INTERVAL;
        if (!prefetchPaused) {
            if (!pendingPrefetchTaskId) {
                schedulePrefetchCycle(resumeDelay);
            }
            return;
        }
        prefetchPaused = false;
        if (prefetchResumeTaskId) {
            try { app.cancelTask(prefetchResumeTaskId); } catch (resumeErr) {}
            prefetchResumeTaskId = null;
        }
        $.global[PREFETCH_RESUME_TASK_NAME] = function () {
            try { delete $.global[PREFETCH_RESUME_TASK_NAME]; } catch (delErr) {}
            schedulePrefetchCycle();
        };
        try {
            prefetchResumeTaskId = app.scheduleTask('if ($.global.' + PREFETCH_RESUME_TASK_NAME + ') { $.global.' + PREFETCH_RESUME_TASK_NAME + '(); }', resumeDelay, false);
        } catch (resumeErr) {
            try {
                if ($.global[PREFETCH_RESUME_TASK_NAME]) { $.global[PREFETCH_RESUME_TASK_NAME](); }
            } catch (resumeRunErr) {}
        }
    }

    function createCacheSliceQueue(masterCacheData, orderedKeys, sliceSize) {
        var slices = [];
        if (!masterCacheData || !(orderedKeys instanceof Array)) { return slices; }
        var chunk = Math.max(1, sliceSize || CACHE_BRANCH_SLICE_SIZE);
        for (var i = 0; i < orderedKeys.length; i++) {
            var cacheKey = orderedKeys[i];
            if (!masterCacheData.hasOwnProperty(cacheKey)) { continue; }
            var branch = masterCacheData[cacheKey];
            if (!(branch instanceof Array) || branch.length === 0) { continue; }
            for (var start = 0; start < branch.length; start += chunk) {
                slices.push({
                    key: cacheKey,
                    start: start,
                    end: Math.min(branch.length, start + chunk)
                });
            }
        }
        return slices;
    }

    function registerNormalizationJob(job) {
        if (!job || !job.prodName) { return; }
        normalizationJobsByProduction[job.prodName] = job;
        cacheNormalizationQueue.push(job);
    }

    function removeNormalizationJob(job) {
        if (!job) { return; }
        for (var i = cacheNormalizationQueue.length - 1; i >= 0; i--) {
            if (cacheNormalizationQueue[i] === job) {
                cacheNormalizationQueue.splice(i, 1);
                break;
            }
        }
        if (job.prodName && normalizationJobsByProduction[job.prodName]) {
            delete normalizationJobsByProduction[job.prodName];
        }
    }

    function jobNeedsWork(job) {
        if (!job || job.finalized) { return false; }
        if (!job.remainingSlices || !job.remainingSlices.length) { return true; }
        if (job.desiredCount === Number.MAX_VALUE || job.requestedCount === Number.MAX_VALUE) { return true; }
        return job.aggregatedTree.length < job.desiredCount;
    }

    function hasPendingNormalizationWork() {
        for (var i = 0; i < cacheNormalizationQueue.length; i++) {
            if (jobNeedsWork(cacheNormalizationQueue[i])) { return true; }
        }
        return false;
    }

    function pickNormalizationJob() {
        for (var i = 0; i < cacheNormalizationQueue.length; i++) {
            var candidate = cacheNormalizationQueue[i];
            if (!jobNeedsWork(candidate)) { continue; }
            if (i !== 0) {
                cacheNormalizationQueue.splice(i, 1);
                cacheNormalizationQueue.unshift(candidate);
            }
            return candidate;
        }
        return null;
    }

    function requestAdditionalData(prodName, targetCount) {
        if (!prodName) { return; }
        var job = normalizationJobsByProduction[prodName];
        if (!job || job.finalized) { return; }
        if (targetCount === Number.MAX_VALUE) {
            job.desiredCount = Number.MAX_VALUE;
            job.requestedCount = Number.MAX_VALUE;
            job.lastSatisfiedDemand = 0;
            scheduleCacheNormalizationTask();
            return;
        }
        var normalizedTarget = Math.max(itemsPerPage, targetCount);
        var updated = false;
        if (!job.desiredCount || job.desiredCount < normalizedTarget) {
            job.desiredCount = normalizedTarget;
            updated = true;
        }
        if (job.requestedCount === Number.MAX_VALUE) { return; }
        var padded = job.desiredCount + (job.prefetchPadding || CACHE_PREFETCH_PADDING);
        if (job.requestedCount < padded) {
            job.requestedCount = padded;
        }
        if (updated && job.lastSatisfiedDemand && job.lastSatisfiedDemand >= job.desiredCount) {
            job.lastSatisfiedDemand = Math.max(0, job.desiredCount - 1);
        }
        scheduleCacheNormalizationTask();
    }

    function updateProductionLoadingStatus(job) {
        if (!job || !productionStatus || !productionStatus.length) { return; }
        if (typeof job.prodIndex !== 'number' || job.prodIndex < 0) { return; }
        var currentCount = job.aggregatedTree.length;
        var progressText = job.expectedTotal ? (currentCount + '/' + job.expectedTotal) : (currentCount + ' itens');
        setProductionStatus(job.prodIndex, 'loading', 'Carregando ' + job.prodName + ' (' + progressText + ')');
    }

    function requestActiveRefreshFor(prodName) {
        if (!prodName || prodName !== activeProductionName) { return; }
        if ($.global.__gnewsPendingViewRefresh) { return; }
        $.global.__gnewsPendingViewRefresh = function () {
            if (!isTemplatesUIReady()) {
                try { delete $.global.__gnewsPendingViewRefresh; } catch (cleanupErr) {}
                return;
            }
            try { delete $.global.__gnewsPendingViewRefresh; } catch (delErr) {}
            var term = (searchBox && !searchBox.isPlaceholderActive) ? searchBox.text : '';
            safePerformSearch(term);
        };
        try {
            app.scheduleTask('if ($.global.__gnewsPendingViewRefresh) { $.global.__gnewsPendingViewRefresh(); }', 40, false);
        } catch (refreshErr) {
            try {
                if ($.global.__gnewsPendingViewRefresh) { $.global.__gnewsPendingViewRefresh(); }
            } catch (refreshRunErr) {}
        }
    }

    function ensureActiveProductionBudgetForPage(pageIndex) {
        if (!activeProductionName) { return; }
        var required = Math.max(1, (pageIndex + 1) * itemsPerPage);
        requestAdditionalData(activeProductionName, required);
    }

    function requestFullNormalization(prodName) {
        var job = normalizationJobsByProduction[prodName];
        if (!job || job.finalized) { return; }
        job.desiredCount = Number.MAX_VALUE;
        job.requestedCount = Number.MAX_VALUE;
        job.prefetchPadding = 0;
        job.lastSatisfiedDemand = 0;
        scheduleCacheNormalizationTask();
    }

    function pauseBackgroundWarmup(duration) {
        var pauseMs = typeof duration === 'number' ? duration : BACKGROUND_WARMUP_IDLE_DELAY;
        backgroundWarmupPausedUntil = Math.max(backgroundWarmupPausedUntil, new Date().getTime() + pauseMs);
    }

    function scheduleBackgroundWarmup(delay) {
        if (!BACKGROUND_WARMUP_ENABLED) { return; }
        if (backgroundWarmupTaskId || !backgroundWarmupQueue.length) { return; }
        $.global[BACKGROUND_WARMUP_TASK_NAME] = function () {
            backgroundWarmupTaskId = null;
            runBackgroundWarmupTick();
        };
        try {
            backgroundWarmupTaskId = app.scheduleTask(
                'if ($.global.' + BACKGROUND_WARMUP_TASK_NAME + ') { $.global.' + BACKGROUND_WARMUP_TASK_NAME + '(); }',
                typeof delay === 'number' ? delay : BACKGROUND_WARMUP_INTERVAL,
                false
            );
        } catch (warmErr) {
            try {
                if ($.global[BACKGROUND_WARMUP_TASK_NAME]) { $.global[BACKGROUND_WARMUP_TASK_NAME](); }
            } catch (warmRunErr) {}
        }
    }

    function stopBackgroundWarmupTask() {
        if (backgroundWarmupTaskId) {
            try { app.cancelTask(backgroundWarmupTaskId); } catch (cancelErr) {}
            backgroundWarmupTaskId = null;
        }
        try { delete $.global[BACKGROUND_WARMUP_TASK_NAME]; } catch (delErr) {}
    }

    function enqueueBackgroundWarmup(prodName, priority) {
        if (!BACKGROUND_WARMUP_ENABLED) { return; }
        if (!prodName) { return; }
        for (var i = 0; i < backgroundWarmupQueue.length; i++) {
            if (backgroundWarmupQueue[i] === prodName) { return; }
        }
        if (priority) {
            backgroundWarmupQueue.unshift(prodName);
        } else {
            backgroundWarmupQueue.push(prodName);
        }
        scheduleBackgroundWarmup(BACKGROUND_WARMUP_INTERVAL);
    }

    function isProductionWarm(prodName, productionObject, manifestSummary) {
        var cached = templatesCache[prodName];
        if (cached && cached.length && !cached.__pending) { return true; }
        return hasSnapshotForSignature(prodName, productionObject, manifestSummary);
    }

    function runBackgroundWarmupTick() {
        if (!BACKGROUND_WARMUP_ENABLED) { return; }
        if (!backgroundWarmupQueue.length) { stopBackgroundWarmupTask(); return; }
        if (!productions || !productions.length) { scheduleBackgroundWarmup(BACKGROUND_WARMUP_INTERVAL * 2); return; }
        var now = new Date().getTime();
        if (now < backgroundWarmupPausedUntil) {
            scheduleBackgroundWarmup(backgroundWarmupPausedUntil - now);
            return;
        }
        var processed = false;
        while (backgroundWarmupQueue.length > 0) {
            var prodName = backgroundWarmupQueue.shift();
            var prodObj = getProductionByName(prodName);
            if (!prodObj) { continue; }
            var manifestSummary = summarizeManifestForProduction(prodObj, getManifestSnapshot());
            if (isProductionWarm(prodName, prodObj, manifestSummary)) {
                continue;
            }
            safeLoadCache(prodObj);
            requestFullNormalization(prodName);
            processed = true;
            break;
        }
        if (!backgroundWarmupQueue.length) {
            stopBackgroundWarmupTask();
            return;
        }
        scheduleBackgroundWarmup(processed ? BACKGROUND_WARMUP_IDLE_DELAY : BACKGROUND_WARMUP_INTERVAL);
    }

    function removeFromBackgroundWarmup(prodName) {
        if (!prodName) { return; }
        for (var i = backgroundWarmupQueue.length - 1; i >= 0; i--) {
            if (backgroundWarmupQueue[i] === prodName) {
                backgroundWarmupQueue.splice(i, 1);
            }
        }
    }

    function notifyUserActivity(extraDelay) {
        pauseBackgroundWarmup(extraDelay || BACKGROUND_WARMUP_IDLE_DELAY);
    }

    function scheduleCacheNormalizationTask() {
        if (cacheNormalizationTaskId || !hasPendingNormalizationWork()) { return; }
        $.global[CACHE_NORMALIZE_TASK_NAME] = function () {
            cacheNormalizationTaskId = null;
            runCacheNormalizationChunk();
        };
        try {
            cacheNormalizationTaskId = app.scheduleTask(
                'if ($.global.' + CACHE_NORMALIZE_TASK_NAME + ') { $.global.' + CACHE_NORMALIZE_TASK_NAME + '(); }',
                20,
                false
            );
        } catch (cacheTaskErr) {
            try {
                if ($.global[CACHE_NORMALIZE_TASK_NAME]) { $.global[CACHE_NORMALIZE_TASK_NAME](); }
            } catch (cacheRunErr) {}
        }
    }

    function runCacheNormalizationChunk() {
        try { delete $.global[CACHE_NORMALIZE_TASK_NAME]; } catch (delErr) {}
        var job = pickNormalizationJob();
        if (!job) { return; }
        var budget = job.nodeBudget || CACHE_NORMALIZE_NODE_BUDGET;
        var processed = 0;
        try {
            while (job.remainingSlices && job.remainingSlices.length > 0 && processed < budget) {
                var slice = job.remainingSlices.shift();
                if (!slice) { continue; }
                var branchData = job.masterCacheData ? job.masterCacheData[slice.key] : null;
                if (!(branchData instanceof Array) || branchData.length === 0) {
                    processed++;
                    continue;
                }
                var portion = branchData.slice(slice.start, slice.end);
                var normalizedBranch = normalizeCacheEntries(portion);
                if (normalizedBranch && normalizedBranch.length) {
                    for (var i = 0; i < normalizedBranch.length; i++) {
                        job.aggregatedTree.push(normalizedBranch[i]);
                    }
                    processed += normalizedBranch.length;
                } else {
                    processed++;
                }
                if (job.desiredCount !== Number.MAX_VALUE && job.aggregatedTree.length >= job.desiredCount) {
                    break;
                }
            }
        } catch (normErr) {
            handleCacheNormalizationError(job, normErr);
            removeNormalizationJob(job);
            scheduleCacheNormalizationTask();
            return;
        }
        updateProductionLoadingStatus(job);
        var demandThreshold = (job.desiredCount === Number.MAX_VALUE) ? null : job.desiredCount;
        if (demandThreshold !== null && job.aggregatedTree.length >= demandThreshold) {
            if (job.lastSatisfiedDemand !== demandThreshold) {
                job.lastSatisfiedDemand = demandThreshold;
                requestActiveRefreshFor(job.prodName);
            }
        }
        maybePersistJobSnapshot(job, false);
        if (!job.remainingSlices || !job.remainingSlices.length) {
            finalizeCacheNormalizationJob(job);
            removeNormalizationJob(job);
        }
        if (hasPendingNormalizationWork()) {
            scheduleCacheNormalizationTask();
        }
    }

    function handleCacheNormalizationError(job, err) {
        if (!job) { return; }
        var prodName = job.prodName || 'desconhecido';
        var errMsg = 'Erro ao processar o cache de ' + prodName + ': ' + (err && err.message ? err.message : err);
        cacheErrorPlaceholder(prodName, errMsg);
        markProductionFailure(prodName, errMsg);
        logError(errMsg);
        notifyCacheIssue(errMsg);
        if (job.telemetry) {
            endTelemetrySpan(job.telemetry, { status: 'exception', prod: prodName });
        }
        purgeSnapshot(prodName, job.productionObject);
    }

    function finalizeCacheNormalizationJob(job) {
        if (!job || job.finalized) { return; }
        job.finalized = true;
        var prodName = job.prodName;
        var aggregatedTree = job.aggregatedTree || [];
        var productionObject = job.productionObject;
        if (!aggregatedTree.length) {
            var emptyMsg = 'Nenhum template valido encontrado para ' + prodName + '.';
            cacheErrorPlaceholder(prodName, emptyMsg);
            markProductionFailure(prodName, emptyMsg);
            logWarn(emptyMsg);
            notifyCacheIssue(emptyMsg);
            if (job.telemetry) {
                endTelemetrySpan(job.telemetry, { status: 'empty', prod: prodName });
            }
            return;
        }
        maybePersistJobSnapshot(job, true);
        templatesCache[prodName] = aggregatedTree;
        if (templatesCache[prodName].__error) { delete templatesCache[prodName].__error; }
        delete templatesCache[prodName].__pending;
        buildProductionIndex(prodName, aggregatedTree);
        var manifestSummary = job.manifestSummary || summarizeManifestForProduction(productionObject, getManifestSnapshot({ force: true }));
        var successMsg = manifestSummary ? formatManifestSummary(manifestSummary) : (aggregatedTree.length + (aggregatedTree.length === 1 ? ' item carregado' : ' itens carregados'));
        markProductionSuccess(prodName, successMsg);
        if (typeof job.prodIndex === 'number' && job.prodIndex > -1) {
            setProductionStatus(job.prodIndex, 'ok', successMsg);
        }
        logInfo('Cache carregado para ' + prodName + ' (' + aggregatedTree.length + ' itens)');
        if (job.telemetry) {
            endTelemetrySpan(job.telemetry, { status: 'ok', prod: prodName, items: aggregatedTree.length });
        }
        job.masterCacheData = null;
        job.remainingSlices = null;
        requestActiveRefreshFor(prodName);
        removeFromBackgroundWarmup(prodName);
    }

    function runCachePipelineWarmup() {
        var telemetry = startTelemetrySpan('pipelineWarmup');
        try {
            var systemSettingsFile = new File((typeof runtimeConfigPath !== 'undefined' ? runtimeConfigPath : scriptPreferencesPath) + "/System_Settings.json");
            var dadosConfigFile = new File(runtimeConfigPath + "/Dados_Config.json");
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
                    manifestSnapshot = (raw && raw.length) ? safeParseJSON(raw, {}, 'manifestSnapshot') : {};
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
        var chunkBudget = state.chunkSize || TREE_RENDER_CHUNK_SIZE;
        while (state.stack.length > 0 && iterations < chunkBudget) {
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
        if (!filePath || !isTemplatesWindowActive()) { return; }
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
        if (!isTemplatesWindowActive()) {
            previewTaskQueue = [];
            previewTaskId = null;
            return;
        }
        if (previewTaskId) { try { app.cancelTask(previewTaskId); } catch (cancelErr) {} previewTaskId = null; }
        $.global[previewTaskName] = function () {
            if (!isTemplatesWindowActive()) {
                previewTaskQueue = [];
                previewTaskId = null;
                try { delete $.global[previewTaskName]; } catch (delErr) {}
                return;
            }
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
        if (!isTemplatesWindowActive()) {
            previewTaskQueue = [];
            previewTaskId = null;
            return;
        }
        if (!previewTaskQueue.length) { previewTaskId = null; return; }
        var job = previewTaskQueue.shift();
        if (!job || !job.filePath) {
            schedulePreviewTask(25);
            return;
        }
        var telemetry = startTelemetrySpan('previewPipeline');
        try {
            var info = computePreviewInfo(job.filePath, job.templateName);
            storePreviewInfo(job.filePath, info);
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

    function storePreviewInfo(filePath, info) {
        if (!filePath || !info) { return; }
        previewInfoCache[filePath] = info;
        var existingIndex = -1;
        for (var i = 0; i < previewInfoOrder.length; i++) {
            if (previewInfoOrder[i] === filePath) { existingIndex = i; break; }
        }
        if (existingIndex > -1) {
            previewInfoOrder.splice(existingIndex, 1);
        }
        previewInfoOrder.push(filePath);
        while (previewInfoOrder.length > PREVIEW_CACHE_MAX) {
            var evictKey = previewInfoOrder.shift();
            if (evictKey && previewInfoCache[evictKey]) {
                delete previewInfoCache[evictKey];
            }
        }
    }

    function getPreviewInfo(filePath) {
        if (!filePath) { return null; }
        var info = previewInfoCache[filePath];
        if (info) {
            var idx = -1;
            for (var i = 0; i < previewInfoOrder.length; i++) {
                if (previewInfoOrder[i] === filePath) { idx = i; break; }
            }
            if (idx > -1) {
                previewInfoOrder.splice(idx, 1);
            }
            previewInfoOrder.push(filePath);
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
            manifestCacheData = (raw && raw.length) ? safeParseJSON(raw, {}, 'manifestCache') : {};
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

    function getManifestSnapshot(options) {
        var useForce = !!(options && options.force);
        var now = new Date().getTime();
        if (useForce) {
            if (forcedManifestSnapshot && (now - forcedManifestTimestamp) < MANIFEST_FORCE_BURST_TTL) {
                return forcedManifestSnapshot;
            }
            forcedManifestSnapshot = readCacheManifest(true);
            forcedManifestTimestamp = now;
            return forcedManifestSnapshot;
        }
        if (manifestCacheData && (now - manifestCacheTimestamp) < MANIFEST_REFRESH_INTERVAL) {
            return manifestCacheData;
        }
        return readCacheManifest(false);
    }

    function writeCacheManifestData(data) {
        var manifestFile = getManifestFileHandle();
        if (!manifestFile) { return false; }
        try {
            manifestFile.open('w');
            manifestFile.encoding = 'UTF-8';
            manifestFile.write(JSON.stringify(data, null, 2));
            manifestFile.close();
            manifestCacheData = data;
            manifestCacheTimestamp = new Date().getTime();
            return true;
        } catch (writeErr) {
            try { manifestFile.close(); } catch (closeErr) {}
            logWarn('Nao foi possivel salvar templates_cache_manifest.json: ' + writeErr);
            return false;
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
                if (entry.children && entry.children.length) {
                    walk(entry.children);
                }
            }
        }
        walk(treeData);
        return (hash >>> 0).toString(16);
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

    function getSnapshotFolder(createIfMissing) {
        if (!scriptPreferencesPath || typeof scriptPreferencesPath !== 'string') { return null; }
        var folder = new Folder(runtimeCachePath + '/gnews_snapshots');
        if (createIfMissing && !folder.exists) {
            try { folder.create(); } catch (folderErr) { return null; }
        }
        if (!folder.exists) { return null; }
        return folder;
    }

    function deriveSnapshotFileName(prodName, productionObject) {
        if (productionObject && productionObject.cacheFile) {
            return productionObject.cacheFile.replace(/\.[^\.]+$/i, '') + SNAPSHOT_FILE_EXTENSION;
        }
        var derived = prodName ? deriveCacheFileFromName(prodName) : null;
        if (derived) { return derived.replace(/\.[^\.]+$/i, '') + SNAPSHOT_FILE_EXTENSION; }
        var slug = slugifyProductionName(prodName || '');
        if (slug && slug.length) { return 'templates_' + slug + SNAPSHOT_FILE_EXTENSION; }
        return null;
    }

    function getSnapshotFileHandle(prodName, productionObject, ensureFolder) {
        var folder = getSnapshotFolder(ensureFolder);
        if (!folder) { return null; }
        var fileName = deriveSnapshotFileName(prodName, productionObject);
        if (!fileName) { return null; }
        return new File(folder.fullName + '/' + fileName);
    }

    function getSnapshotMetaHandle(prodName, productionObject, ensureFolder) {
        var folder = getSnapshotFolder(ensureFolder);
        if (!folder) { return null; }
        var baseName = deriveSnapshotFileName(prodName, productionObject);
        if (!baseName) { return null; }
        var metaName = baseName.replace(SNAPSHOT_FILE_EXTENSION, SNAPSHOT_META_EXTENSION);
        return new File(folder.fullName + '/' + metaName);
    }

    function computeSnapshotSignature(summary, productionObject) {
        if (!summary) { return null; }
        var parts = [
            summary.itemCount || 0,
            summary.metadataCount || 0,
            summary.paths ? summary.paths.length : 0,
            summary.lastScan || '',
            productionObject && productionObject.cacheFile ? productionObject.cacheFile : ''
        ];
        return parts.join('|');
    }

    function readSilentJsonFile(fileHandle) {
        if (!fileHandle || !fileHandle.exists) { return null; }
        try {
            fileHandle.open('r');
            fileHandle.encoding = 'UTF-8';
            var raw = fileHandle.read();
            fileHandle.close();
            if (!raw || !raw.length) { return null; }
            if (raw.charCodeAt(0) === 0xFEFF) { raw = raw.substring(1); }
            var contextLabel = fileHandle && fileHandle.fsName ? fileHandle.fsName : 'snapshotFile';
            return safeParseJSON(raw, null, contextLabel);
        } catch (readErr) {
            try { fileHandle.close(); } catch (closeErr) {}
            return null;
        }
    }

    function writeSilentJsonFile(fileHandle, dataObj) {
        if (!fileHandle) { return false; }
        var folder = fileHandle.parent;
        if (!folder.exists) {
            try { folder.create(); } catch (folderErr) { return false; }
        }
        var tempFile = new File(fileHandle.fullName + '.tmp');
        try {
            tempFile.open('w');
            tempFile.encoding = 'UTF-8';
            tempFile.write(JSON.stringify(dataObj));
            tempFile.close();
            if (fileHandle.exists) {
                try { fileHandle.remove(); } catch (removeErr) {}
            }
            tempFile.rename(fileHandle.name);
            return true;
        } catch (writeErr) {
            try { tempFile.close(); } catch (closeErr) {}
            try { tempFile.remove(); } catch (rmErr) {}
            return false;
        }
    }

    function purgeSnapshot(prodName, productionObject) {
        if (!productionObject && prodName && productions && productions.length) {
            var idx = getProductionIndexByName(prodName);
            if (idx > -1) { productionObject = productions[idx]; }
        }
        var fileHandle = getSnapshotFileHandle(prodName, productionObject, false);
        if (!fileHandle || !fileHandle.exists) { return; }
        try { fileHandle.remove(); } catch (purgeErr) {}
        var metaHandle = getSnapshotMetaHandle(prodName, productionObject, false);
        if (metaHandle && metaHandle.exists) {
            try { metaHandle.remove(); } catch (purgeMetaErr) {}
        }
        if (snapshotSignatureRegistry[prodName]) {
            delete snapshotSignatureRegistry[prodName];
        }
    }

    function readSnapshotMetadata(prodName, productionObject) {
        var metaHandle = getSnapshotMetaHandle(prodName, productionObject, false);
        if (!metaHandle || !metaHandle.exists) { return null; }
        return readSilentJsonFile(metaHandle);
    }

    function persistSnapshotMetadata(prodName, productionObject, meta) {
        if (!meta) { return false; }
        var metaHandle = getSnapshotMetaHandle(prodName, productionObject, true);
        if (!metaHandle) { return false; }
        return writeSilentJsonFile(metaHandle, meta);
    }

    function tryRestoreNormalizedSnapshot(prodName, productionObject, manifestSummary) {
        var signature = computeSnapshotSignature(manifestSummary, productionObject);
        if (!signature) { return null; }
        var fileHandle = getSnapshotFileHandle(prodName, productionObject, false);
        if (!fileHandle || !fileHandle.exists) { return null; }
        if (SNAPSHOT_MAX_AGE && fileHandle.modified) {
            var age = new Date().getTime() - fileHandle.modified.getTime();
            if (age > SNAPSHOT_MAX_AGE) {
                purgeSnapshot(prodName, productionObject);
                return null;
            }
        }
        var payload = readSilentJsonFile(fileHandle);
        if (!payload || !payload.meta || payload.meta.signature !== signature) {
            purgeSnapshot(prodName, productionObject);
            return null;
        }
        if (!payload.meta.complete) {
            return null;
        }
        snapshotSignatureRegistry[prodName] = payload.meta.signature;
        persistSnapshotMetadata(prodName, productionObject, payload.meta);
        if (!(payload.items instanceof Array) || !payload.items.length) {
            return null;
        }
        return payload.items;
    }

    function persistNormalizedSnapshot(prodName, productionObject, manifestSummary, items, isComplete) {
        if (!manifestSummary || !items || !items.length) { return false; }
        var signature = computeSnapshotSignature(manifestSummary, productionObject);
        if (!signature) { return false; }
        var fileHandle = getSnapshotFileHandle(prodName, productionObject, true);
        if (!fileHandle) { return false; }
        var payload = {
            meta: {
                prodName: prodName,
                signature: signature,
                generatedAt: new Date().getTime(),
                cacheFile: productionObject && productionObject.cacheFile ? productionObject.cacheFile : null,
                complete: !!isComplete
            },
            items: items
        };
        var writeOk = writeSilentJsonFile(fileHandle, payload);
        if (!writeOk) { return false; }
        persistSnapshotMetadata(prodName, productionObject, payload.meta);
        if (isComplete) {
            snapshotSignatureRegistry[prodName] = signature;
        }
        return true;
    }

    function maybePersistJobSnapshot(job, force) {
        if (!job || !job.manifestSummary) { return; }
        if (!job.aggregatedTree || !job.aggregatedTree.length) { return; }
        if (!force) {
            var lastCount = job.lastPersistCount || 0;
            if ((job.aggregatedTree.length - lastCount) < SNAPSHOT_WRITE_THRESHOLD) {
                return;
            }
        }
        var markComplete = !!(force && job.finalized);
        if (persistNormalizedSnapshot(job.prodName, job.productionObject, job.manifestSummary, job.aggregatedTree, markComplete)) {
            job.lastPersistCount = job.aggregatedTree.length;
        }
    }

    (function bootstrapSnapshotRegistry() {
        var folder = getSnapshotFolder(false);
        if (!folder || !folder.exists) { return; }
        var metaFiles;
        try {
            metaFiles = folder.getFiles(function (f) {
                return (f instanceof File) && f.name.match(/\.meta\.json$/i);
            });
        } catch (listErr) {
            return;
        }
        for (var i = 0; i < metaFiles.length; i++) {
            var meta = readSilentJsonFile(metaFiles[i]);
            if (!meta || !meta.prodName || !meta.signature) { continue; }
            snapshotSignatureRegistry[meta.prodName] = meta.signature;
        }
    })();

    function hasSnapshotForSignature(prodName, productionObject, manifestSummary) {
        if (!prodName) { return false; }
        var summary = manifestSummary || summarizeManifestForProduction(productionObject, getManifestSnapshot());
        if (!summary) { return false; }
        var signature = computeSnapshotSignature(summary, productionObject);
        if (!signature) { return false; }
        if (snapshotSignatureRegistry[prodName] === signature) { return true; }
        var meta = readSnapshotMetadata(prodName, productionObject);
        if (meta && meta.signature === signature && meta.complete) {
            snapshotSignatureRegistry[prodName] = signature;
            return true;
        }
        return false;
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
        var snapshot = manifestSnapshot || getManifestSnapshot();
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
        var content = '';
        try {
            file.open("r", "TEXT", "????");
            file.encoding = "UTF-8";
            content = file.read();
            file.close();
        } catch (e) {
            showThemedAlert("ERRO: Falha ao processar o arquivo JSON:\n" + file.fsName, 'Erro de leitura');
            return null;
        }
        if (!content || !content.length) { return null; }
        if (content.charCodeAt(0) === 0xFEFF) { content = content.substring(1); }
        var parsed = safeParseJSON(content, null, file.fsName || 'config');
        if (parsed === null) {
            showThemedAlert("ERRO: Conteúdo JSON inválido:\n" + file.fsName, 'Erro de leitura');
        }
        return parsed;
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
        var systemSettingsFile = new File((typeof runtimeConfigPath !== 'undefined' ? runtimeConfigPath : scriptPreferencesPath) + "/System_Settings.json");
        var dadosConfigFile = new File(runtimeConfigPath + "/Dados_Config.json");
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
        var systemSettingsFile = new File((typeof runtimeConfigPath !== 'undefined' ? runtimeConfigPath : scriptPreferencesPath) + "/System_Settings.json");
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
            var alertWin = new Window('palette', dialogTitle, undefined, { closeButton: true, borderless: false });
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
            okBtn.onClick = function () { alertWin.close(); };

            alertWin.center();
            alertWin.show();
        } catch (alertErr) {
            alert(message);
        }
    }

    function showThemedConfirm(message, title, okLabel, cancelLabel) {
        var dialogTitle = title || scriptName;
        var result = false;
        try {
            var dlg = new Window('dialog', dialogTitle, undefined, { closeButton: true });
            dlg.orientation = 'column';
            dlg.alignChildren = 'fill';
            dlg.spacing = 12;
            dlg.margins = 16;
            if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
                try { setBgColor(dlg, bgColor1); } catch (bgErr) {}
            }
            var msgTxt = dlg.add('statictext', undefined, message || '', { multiline: true });
            msgTxt.minimumSize.width = 360;
            if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
                try { setFgColor(msgTxt, normalColor1); } catch (fgErr) {}
            }
            var btnGrp = dlg.add('group');
            btnGrp.alignment = ['right', 'bottom'];
            btnGrp.spacing = 8;
            var okBtn = btnGrp.add('button', undefined, okLabel || 'OK', { name: 'ok' });
            var cancelBtn = btnGrp.add('button', undefined, cancelLabel || 'Cancelar', { name: 'cancel' });
            if (typeof setCtrlHighlight === 'function' && typeof highlightColor1 !== 'undefined' && typeof normalColor2 !== 'undefined') {
                try { setCtrlHighlight(okBtn, highlightColor1, normalColor2); } catch (setErr) {}
            }
            okBtn.onClick = function () { result = true; dlg.close(); };
            cancelBtn.onClick = function () { result = false; dlg.close(); };
            dlg.center();
            dlg.show();
        } catch (confirmErr) {
            result = confirm(message);
        }
        return result;
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
    prodDrop = prodGrp.add('dropdownlist', undefined, ['Carregando...']); prodDrop.alignment = ['fill', 'center']; prodDrop.enabled = false;
    var statusInfoGrp = vGrp1.add('group'); statusInfoGrp.alignment = ['fill', 'top']; statusInfoGrp.spacing = 6; statusInfoGrp.margins = [0, -4, 0, 4];
    var prodStatusLab = statusInfoGrp.add('statictext', undefined, ''); prodStatusLab.alignment = ['fill', 'top']; prodStatusLab.visible = false; setFgColor(prodStatusLab, (typeof normalColor2 !== 'undefined') ? normalColor2 : '#e6e6e6ff');
    var divProd; if (typeof themeDivider === 'function') { divProd = themeDivider(vGrp1); divProd.alignment = ['fill', 'center']; }
    var templatesHeaderGrp = vGrp1.add('group'); templatesHeaderGrp.alignment = 'fill'; templatesHeaderGrp.orientation = 'row';
    var templateLab = templatesHeaderGrp.add('statictext', undefined, 'BUSCA:'); templateLab.alignment = ['left', 'center']; setFgColor(templateLab, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF');
    var itemCounterLab = templatesHeaderGrp.add('statictext', undefined, '', { justify: 'left' }); itemCounterLab.alignment = ['fill', 'center']; setFgColor(itemCounterLab, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA');
    var networkModeChk = templatesHeaderGrp.add('checkbox', undefined, 'Carregar da rede'); networkModeChk.alignment = ['right', 'center']; networkModeChk.value = false; networkModeChk.enabled = false; setFgColor(networkModeChk, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF');
    var listGrp = vGrp1.add('group'); listGrp.orientation = 'column'; listGrp.spacing = 4; listGrp.alignment = ['fill', 'fill'];
    var placeholderText = '>>  Digite para Buscar...';
    var searchBox = listGrp.add('edittext', [0, 0, 320, 24], placeholderText); searchBox.isPlaceholderActive = true; searchBox.enabled = false; setFgColor(searchBox, (typeof monoColor0 !== 'undefined') ? monoColor0 : '#F2F2F2');
    var templateList = listGrp.add('listbox', [0, 0, 320, 390]); setFgColor(templateList, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA');
    var loadingGrp = listGrp.add('group'); loadingGrp.alignChildren = ['center', 'center']; loadingGrp.add('statictext', undefined, 'Carregando, por favor aguarde...'); loadingGrp.visible = true;
    
    var paginationGrp = vGrp1.add('group'); paginationGrp.orientation = 'row'; paginationGrp.alignment = 'fill'; paginationGrp.alignChildren = 'center'; paginationGrp.spacing = 10; paginationGrp.margins.top = 5;
    var prevBtn = paginationGrp.add('button', undefined, '<< Anterior'); prevBtn.preferredSize.width = 80;
    var pageInfo = paginationGrp.add('statictext', undefined, 'Pagina 1 de 1'); pageInfo.alignment = 'fill'; pageInfo.justify = 'center'; setFgColor(pageInfo, (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA');
    var nextBtn = paginationGrp.add('button', undefined, 'Proximo >>'); nextBtn.preferredSize.width = 80;
    paginationGrp.visible = false;

    var mainBtnGrp1 = vGrp1.add('group'); mainBtnGrp1.orientation = 'stack'; mainBtnGrp1.alignment = 'fill'; mainBtnGrp1.margins = [0, 8, 0, 0];
    var lBtnGrp1 = mainBtnGrp1.add('group'); lBtnGrp1.alignment = 'left'; lBtnGrp1.spacing = 16;
    var refreshBtn, openFldBtn;
    if (typeof themeIconButton === 'function' && typeof D9T_ATUALIZAR_ICON !== 'undefined') {
        refreshBtn = new themeIconButton(lBtnGrp1, { icon: D9T_ATUALIZAR_ICON, tips: ['Recarregar cache'] });
        openFldBtn = new themeIconButton(lBtnGrp1, { icon: D9T_PASTA_ICON, tips: ['Abrir pasta de templates'] });
    } else {
        refreshBtn = lBtnGrp1.add('button', undefined, 'Recarregar');
        openFldBtn = lBtnGrp1.add('button', undefined, 'Abrir pasta');
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
    function applyFixedSize(ctrl, width, height) {
        if (!ctrl || typeof width !== 'number' || typeof height !== 'number') { return; }
        var sizeArr = [width, height];
        ctrl.preferredSize = sizeArr;
        ctrl.minimumSize = sizeArr;
        ctrl.maximumSize = sizeArr;
        ctrl.size = sizeArr;
    }

    function enforceTemplateButtonSize(ctrl) {
        if (!ctrl) { return; }
        applyFixedSize(ctrl, TEMPLATE_BUTTON_SIZE.width, TEMPLATE_BUTTON_SIZE.height);
        ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
        ctrl.__buttonThemeOverrides.width = TEMPLATE_BUTTON_SIZE.width;
        ctrl.__buttonThemeOverrides.height = TEMPLATE_BUTTON_SIZE.height;
        var relock = function () { applyFixedSize(ctrl, TEMPLATE_BUTTON_SIZE.width, TEMPLATE_BUTTON_SIZE.height); };
        if (typeof ctrl.onDraw === 'function') {
            var prevDraw = ctrl.onDraw;
            ctrl.onDraw = function () { relock(); prevDraw.apply(this, arguments); };
        } else {
            ctrl.onDraw = relock;
        }
        if (typeof ctrl.addEventListener === 'function') {
            var events = ["mouseover","mouseout","mousedown","mouseup"];
            for (var i = 0; i < events.length; i++) {
                try { ctrl.addEventListener(events[i], relock); } catch (evtErr) {}
            }
        }
        if (typeof D9T_applyThemeToButtonControl === 'function') {
            try {
                var baseTheme = ctrl.__buttonThemeSource;
                if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') {
                    baseTheme = D9T_getActiveButtonTheme();
                }
                D9T_applyThemeToButtonControl(ctrl, baseTheme);
            } catch (themeErr) {}
        }
    }

    var rBtnGrp2 = vGrp2.add('group'); rBtnGrp2.alignment = 'right'; rBtnGrp2.spacing = 16;
    var openBtn, importBtn;
    if (typeof themeButton === 'function') {
        openBtn = new themeButton(rBtnGrp2, { labelTxt: 'abrir', width: TEMPLATE_BUTTON_SIZE.width, height: TEMPLATE_BUTTON_SIZE.height, tips: ['Abrir o projeto selecionado'] });
        importBtn = new themeButton(rBtnGrp2, { labelTxt: 'importar', width: TEMPLATE_BUTTON_SIZE.width, height: TEMPLATE_BUTTON_SIZE.height, textColor: (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E', buttonColor: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF', tips: ['Importar o template selecionado'] });
        if (openBtn && openBtn.label) { enforceTemplateButtonSize(openBtn.label); }
        if (importBtn && importBtn.label) { enforceTemplateButtonSize(importBtn.label); }
    } else {
        openBtn = rBtnGrp2.add('button', undefined, 'Abrir'); 
        importBtn = rBtnGrp2.add('button', undefined, 'Importar');
        applyFixedSize(openBtn, TEMPLATE_BUTTON_SIZE.width, TEMPLATE_BUTTON_SIZE.height);
        applyFixedSize(importBtn, TEMPLATE_BUTTON_SIZE.width, TEMPLATE_BUTTON_SIZE.height);
    }

    // =============================================================================
        // ===== FUNCOES E LOGICA DE EVENTOS (Completas) =====
    // =============================================================================
    var initializeUIAndData = function () {
        setLoadingState(true, 'Preparando categorias...');
        if (!loadCentralConfigs()) { showThemedAlert("Erro fatal: Nao foi possivel carregar os arquivos de configuracao.", 'Erro critico'); D9T_TEMPLATES_w.close(); return; }
        productions = GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.PRODUCTIONS;
        var templateSettings = (GNEWS_TEMPLATES_CONFIG.system && GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings) ? GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings : {};
        if (!templateSettings.gnews_templates) { templateSettings.gnews_templates = {}; }
        var runtimeTemplatePrefs = templateSettings.gnews_templates;
        if (runtimeTemplatePrefs.hasOwnProperty('lazyMetadata')) {
            lazyMetadataEnabled = runtimeTemplatePrefs.lazyMetadata !== false;
        } else {
            lazyMetadataEnabled = true;
        }
        forceNetworkLoading = runtimeTemplatePrefs.directNetworkMode === true;
        networkModeChk.value = forceNetworkLoading;
        networkModeChk.enabled = true;
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
        if (BACKGROUND_WARMUP_ENABLED) {
            backgroundWarmupQueue.length = 0;
            var manifestSnapshot = getManifestSnapshot();
            for (var warmIdx = 0; warmIdx < productions.length; warmIdx++) {
                var prodNameWarm = productions[warmIdx].name;
                var warmSummary = summarizeManifestForProduction(productions[warmIdx], manifestSnapshot);
                if (isProductionWarm(prodNameWarm, productions[warmIdx], warmSummary)) { continue; }
                backgroundWarmupQueue.push(prodNameWarm);
            }
            scheduleBackgroundWarmup(BACKGROUND_WARMUP_IDLE_DELAY);
        }
        prodDrop.selection = (lastIndex >= 0 && lastIndex < prodDrop.items.length) ? lastIndex : 0;
        hydrateProductionStatusesFromManifest();
        var requestedIndex = (prodDrop.selection && prodDrop.selection.index >= 0) ? prodDrop.selection.index : 0;
        var healthyIndex = pickDefaultProductionIndex(requestedIndex);
        if (healthyIndex !== requestedIndex && healthyIndex > -1) {
            prodDrop.selection = healthyIndex;
            GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates.lastProductionIndex = healthyIndex;
            if (productionItemCounts[requestedIndex] && productionItemCounts[requestedIndex] > DEFAULT_MAX_AUTO_ITEMS) {
                logInfo('Selecionado automaticamente "' + productions[healthyIndex].name + '" para agilizar o carregamento inicial.');
            } else {
                notifyCacheIssue("O ultimo cache selecionado apresentou erro e foi substituido por '" + productions[healthyIndex].name + "'.");
            }
        }
        var currentSelectionIndex = (prodDrop.selection && prodDrop.selection.index >= 0) ? prodDrop.selection.index : 0;
        var currentProduction = productions[currentSelectionIndex] || null;
        pendingPopulateProduction = currentProduction ? currentProduction.name : null;
        activeProductionName = currentProduction ? currentProduction.name : null;
        queueProductionPreload(currentSelectionIndex, 200);
        rebuildPrefetchQueue(currentSelectionIndex);
        schedulePrefetchCycle();
        updateProductionStatusLabel(prodDrop.selection ? prodDrop.selection.index : -1);
        vGrp2.visible = true; if (newDiv) newDiv.visible = true;
        D9T_TEMPLATES_w.layout.layout(true);
        currentPage = 0;
        filteredDataCache = [];
        templateList.removeAll();
        updateItemCounter(0);
        searchBox.active = false;
        searchBox.text = placeholderText;
        searchBox.isPlaceholderActive = true;
        updateArteInfo(null);
        prodDrop.enabled = true; searchBox.enabled = true;
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
        var productionObject = getProductionByName(prodName);
        if (productionObject) {
            var metadataFile = new File(runtimeCachePath + '/' + (bucket.metaFileName || getMetadataFileName(productionObject)));
            persistCookedMetadata(productionObject, metadataFile, sanitized, bucket.metaFileStamp);
        }
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
        purgeSnapshot(prodName);
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

    function getProductionByName(prodName) {
        var idx = getProductionIndexByName(prodName);
        if (idx === -1 || !productions) { return null; }
        return productions[idx];
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

    function updateProductionStatus(index, state, message) {
        setProductionStatus(index, state, message);
    }

    function isTemplatesWindowActive() {
        if (!D9T_TEMPLATES_w) { return false; }
        if (D9T_TEMPLATES_w instanceof Window) {
            try { return !!D9T_TEMPLATES_w.visible; }
            catch (visibilityErr) { return false; }
        }
        return true;
    }

    function isTemplatesUIReady() {
        if (!isTemplatesWindowActive()) { return false; }
        if (!prodDrop || !templateList) { return false; }
        return true;
    }

    function hydrateProductionStatusesFromManifest() {
        if (!productions || !productions.length) { return; }
        var manifestSnapshot = getManifestSnapshot();
        if (!manifestSnapshot) { return; }
        for (var idx = 0; idx < productions.length; idx++) {
            var summary = summarizeManifestForProduction(productions[idx], manifestSnapshot);
            if (!summary) { continue; }
            productionItemCounts[idx] = summary.itemCount || 0;
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
            'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
            'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
            'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c'
        };
        normalized = normalized.replace(/[áàâãäéèêëíìîïóòôõöúùûüç]/g, function(match) {
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
        if (!isTemplatesWindowActive()) { return; }
        var taskName = '__gnewsPreloadTask_' + index;
        pendingPreloadRegistry[index] = taskName;
        $.global[taskName] = function () {
            if (!isTemplatesWindowActive()) {
                pendingPreloadRegistry[index] = null;
                try { delete $.global[taskName]; } catch (delErr) {}
                return;
            }
            try {
                var prod = productions[index];
                if (prod) {
                    setProductionStatus(index, 'loading', 'Carregando ' + prod.name + '...');
                    if (!lazyMetadataEnabled) { safeLoadMetadata(prod); }
                    safeLoadCache(prod);
                }
            } catch (preloadErr) {
                logWarn('Falha ao processar preload da categoria #' + index + ': ' + preloadErr);
            }
            pendingPreloadRegistry[index] = null;
            try { delete $.global[taskName]; } catch (delErr) {}
        };
        var taskCode = 'if ($.global["' + taskName + '"]) { $.global["' + taskName + '"](); }';
        try {
            app.scheduleTask(taskCode, typeof delay === 'number' ? delay : 150, false);
        } catch (preloadScheduleErr) {
            try { $.global[taskName](); } catch (preloadRunErr) {}
        }
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

    function pickDefaultProductionIndex(preferredIndex) {
        var healthyIndex = ensureHealthySelection(preferredIndex);
        if (healthyIndex < 0) { healthyIndex = 0; }
        var currentCount = productionItemCounts[healthyIndex] || 0;
        if (currentCount && currentCount > DEFAULT_MAX_AUTO_ITEMS) {
            for (var i = 0; i < productionItemCounts.length; i++) {
                if (productionItemCounts[i] > 0 && productionItemCounts[i] <= DEFAULT_MAX_AUTO_ITEMS) {
                    return i;
                }
            }
        }
        return healthyIndex;
    }

    function getMetadataFileName(productionObject) {
        if (!productionObject) { return null; }
        if (productionObject.metadataFile) { return productionObject.metadataFile; }
        if (productionObject.cacheFile) { return productionObject.cacheFile.replace('_cache', '_metadata'); }
        return null;
    }

    function ensureCookedMetadataFolder() {
        var folder = new Folder(runtimeCachePath + '/cooked');
        if (!folder.exists) {
            try { folder.create(); } catch (folderErr) {}
        }
        return folder;
    }

    function getCookedMetadataFile(productionObject, ensureFolder) {
        var folder = ensureFolder ? ensureCookedMetadataFolder() : new Folder(runtimeCachePath + '/cooked');
        if (!folder.exists) { return null; }
        var baseName = getMetadataFileName(productionObject);
        if (!baseName) { return null; }
        var cookedName = baseName.replace(/\.json$/i, '') + '.cooked.json';
        return new File(folder.fullName + '/' + cookedName);
    }

    function tryLoadCookedMetadata(productionObject, metadataFile) {
        var cookedFile = getCookedMetadataFile(productionObject, false);
        if (!cookedFile || !cookedFile.exists) { return null; }
        var payload;
        try {
            cookedFile.open('r');
            cookedFile.encoding = 'UTF-8';
            var raw = cookedFile.read();
            cookedFile.close();
            payload = raw && raw.length ? safeParseJSON(raw, null, 'cookedMetadata') : null;
        } catch (cookErr) {
            try { cookedFile.close(); } catch (closeErr) {}
            payload = null;
        }
        if (!payload || !(payload.entries instanceof Array)) { return null; }
        var sourceStamp = payload.sourceModified || 0;
        var referenceStamp = 0;
        try {
            if (metadataFile && metadataFile.exists) {
                referenceStamp = metadataFile.modified ? metadataFile.modified.valueOf() : metadataFile.created.valueOf();
            }
        } catch (stampErr) {}
        if (referenceStamp && sourceStamp && referenceStamp > sourceStamp) {
            return null;
        }
        return payload;
    }

    function persistCookedMetadata(productionObject, metadataFile, sanitizedEntries, metaStamp) {
        if (!productionObject || !sanitizedEntries) { return; }
        var cookedFile = getCookedMetadataFile(productionObject, true);
        if (!cookedFile) { return; }
        var payload = {
            version: 1,
            sourceFile: getMetadataFileName(productionObject),
            sourceModified: metaStamp || (metadataFile && metadataFile.modified ? metadataFile.modified.valueOf() : null),
            entries: sanitizedEntries
        };
        try {
            cookedFile.open('w');
            cookedFile.encoding = 'UTF-8';
            cookedFile.write(JSON.stringify(payload));
            cookedFile.close();
        } catch (writeErr) {
            try { cookedFile.close(); } catch (closeErr) {}
        }
    }

    function loadMetadataInBackground(productionObject) {
        if (!productionObject) { return; }
        var prodName = productionObject.name;
        if (metadataCache[prodName]) { return; }
        var telemetry = startTelemetrySpan('loadMetadata:' + prodName);
        var metadataFileName = getMetadataFileName(productionObject);
        if (!metadataFileName) {
            metadataCache[prodName] = { raw: null, sanitized: [] };
            endTelemetrySpan(telemetry, { entries: 0, prod: prodName, status: 'noFilename' });
            return;
        }
        var metadataFile = new File(runtimeCachePath + '/' + metadataFileName);
        if (!metadataFile || !metadataFile.exists) {
            var derivedMetaName = deriveMetadataFileFromName(prodName);
            if (derivedMetaName && derivedMetaName !== metadataFileName) {
                var fallbackMeta = new File(runtimeCachePath + '/' + derivedMetaName);
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
        var cookedPayload = tryLoadCookedMetadata(productionObject, metadataFile);
        if (cookedPayload) {
            var cookedEntries = cookedPayload.entries || [];
            metadataCache[prodName] = {
                raw: null,
                orderedKeys: [],
                sanitized: cookedEntries.slice(0),
                metaFileName: metadataFileName,
                metaFileStamp: cookedPayload.sourceModified || 0
            };
            endTelemetrySpan(telemetry, { entries: cookedEntries.length, prod: prodName, status: 'cooked' });
            return;
        }
        var metadataData = readJsonFile(metadataFile);
        if (metadataData && typeof metadataData === 'object') {
            var orderedMetaKeys = getOrderedCacheKeysForProduction(productionObject, metadataData);
            metadataCache[prodName] = {
                raw: metadataData,
                orderedKeys: orderedMetaKeys.slice(0),
                sanitized: null,
                metaFileName: metadataFileName,
                metaFileStamp: (metadataFile.modified && metadataFile.modified.valueOf) ? metadataFile.modified.valueOf() : null
            };

            var countTaskName = '__gnewsMetaCount_' + prodName.replace(/\W/g, '_');
            var chunkState = {
                keys: orderedMetaKeys.slice(0),
                index: 0,
                total: 0,
                prod: prodName,
                telemetry: telemetry
            };

            function processMetadataChunk() {
                var iterations = 0;
                while (chunkState.index < chunkState.keys.length && iterations < 10) {
                    var currentKey = chunkState.keys[chunkState.index];
                    var entries = metadataData[currentKey];
                    if (entries instanceof Array) {
                        chunkState.total += entries.length;
                    }
                    chunkState.index++;
                    iterations++;
                }
                if (chunkState.index < chunkState.keys.length) {
                    try { app.scheduleTask(processorCode, 5, false); }
                    catch (chunkErr) {
                        $.writeln('[GNEWS_Templates] scheduleTask falhou ao contar metadados de ' + prodName + ': ' + chunkErr);
                        processMetadataChunk();
                    }
                } else {
                    endTelemetrySpan(chunkState.telemetry, { entries: chunkState.total, prod: chunkState.prod });
                    try { delete $.global[countTaskName]; } catch (delErr) {}
                }
            }

            var processorCode = 'if ($.global["' + countTaskName + '"]) { $.global["' + countTaskName + '"](); }';
            $.global[countTaskName] = function () { processMetadataChunk(); };
            try {
                app.scheduleTask(processorCode, 1, false);
            } catch (scheduleErr) {
                $.writeln('[GNEWS_Templates] scheduleTask falhou para ' + prodName + ': ' + scheduleErr);
                $.global[countTaskName]();
            }
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

    function scheduleMetadataLoad(productionObject) {
        if (!productionObject || !productionObject.name) { return; }
        var prodName = productionObject.name;
        if (metadataCache[prodName]) { return; }
        var taskKey = '__gnewsMetadataLoad_' + prodName.replace(/\W/g, '_');
        if ($.global[taskKey]) { return; }
        $.global[taskKey] = function () {
            try {
                safeLoadMetadata(productionObject);
            } catch (asyncErr) {
                logWarn('Falha ao carregar metadados (lazy) de ' + prodName + ': ' + asyncErr);
            }
            try { delete $.global[taskKey]; } catch (delErr) {}
        };
        var runner = 'if ($.global["' + taskKey + '"]) { $.global["' + taskKey + '"](); }';
        try {
            app.scheduleTask(runner, 50, false);
        } catch (scheduleErr) {
            logWarn('Fallback sincronizado ao carregar metadados de ' + prodName + ': ' + scheduleErr);
            try { $.global[taskKey](); } catch (fallbackErr) {
                logWarn('Falha no fallback de metadados para ' + prodName + ': ' + fallbackErr);
            }
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
        if (!isTemplatesUIReady()) { return; }
        var hasExistingResults = (templateList && templateList.items && templateList.items.length > 0);
        pausePrefetchCycle();
        notifyUserActivity();
        ensureActiveProductionBudgetForPage(currentPage);
        var startedLoading = false;
        if (!loadingGrp.visible) {
            setLoadingState(true, 'Atualizando resultados', hasExistingResults);
            startedLoading = true;
        }
        var completed = true;
        try {
            completed = performSearch(searchTerm) === true;
        } catch (searchErr) {
            completed = true;
            notifyCacheIssue('Erro ao atualizar a lista de templates: ' + (searchErr && searchErr.message ? searchErr.message : searchErr));
        }
        if (completed) {
            setLoadingState(false, null, hasExistingResults);
        }
        resumePrefetchCycle(PREFETCH_INTERVAL + 300);
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
                var normalizedSearchText = entry.__normalizedSearchText || normalizeSearchText(entry.text || '');
                entry.__normalizedSearchText = normalizedSearchText;
                sink.push({
                    item: entry,
                    parents: baseChain.slice(0),
                    searchText: normalizedSearchText
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
        resolveTotalPages(flatItems.length);
        var start = currentPage * itemsPerPage;
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
            mode: 'search',
            chunkSize: resolveDynamicTreeChunkSize(stack.length)
        };
        runTreeRenderChunk();
    }

    function scanProductionPaths(productionObject, progressUpdater, onComplete) {
        var paths = (productionObject && productionObject.paths) ? productionObject.paths : [];
        if (!paths || !paths.length) {
            if (typeof onComplete === 'function') { onComplete(null, 'Nenhum caminho configurado para esta producao.'); }
            return;
        }
        var allowedExtensions = ['.aep', '.aet'];
        var ignoreFolderNames = ['auto-save', 'old', 'adobe after effects auto-save', 'versoes antigas', 'backup', 'old versions', '__macosx'];
        var ignoreNameContains = ['auto-save', 'tmpaetoame'];
        var ignoreFileNames = ['thumbs.db'];
        function toLowerArray(arr) {
            for (var i = 0; i < arr.length; i++) { arr[i] = arr[i].toLowerCase(); }
            return arr;
        }
        toLowerArray(ignoreFolderNames);
        toLowerArray(ignoreFileNames);
        toLowerArray(ignoreNameContains);
        var masterCacheData = {};
        var metadataMap = {};
        var metadataList = [];
        var rootStats = {};
        var skippedFolders = [];
        var pending = [];
        var visited = {};
        var MAX_FOLDER_ITERATIONS_PER_CHUNK = 4;
        var MAX_ITEMS_PER_PASS = 40;
        var SLOW_FOLDER_THRESHOLD_MS = 2000;
        var slowFolderTracker = {};

        function decodePercentString(value) {
            if (typeof value !== 'string' || value === '') { return ''; }
            var result = value;
            if (result.indexOf('%') !== -1) {
                try { result = decodeURIComponent(result); } catch (decodeErr) {}
                try { result = Folder.decode(result); } catch (decodeErr2) {}
            }
            return result;
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

        function fileMatchesFilter(fileName) {
            if (!fileName || typeof fileName !== 'string') { return false; }
            if (!allowedExtensions.length) { return true; }
            var lower = fileName.toLowerCase();
            for (var i = 0; i < allowedExtensions.length; i++) {
                if (lower.indexOf(allowedExtensions[i]) !== -1) {
                    return true;
                }
            }
            return false;
        }

        function enqueueFolder(folder, targetArray, parents, rootKey) {
            if (!(folder instanceof Folder)) { return; }
            var folderKey = folder.fsName || folder.fullName || folder.absoluteURI || folder.displayName;
            if (!folderKey) { return; }
            if (visited[folderKey]) { return; }
            visited[folderKey] = true;
            pending.push({
                folder: folder,
                folderKey: folderKey,
                targetArray: targetArray,
                parents: parents ? parents.slice(0) : [],
                rootKey: rootKey,
                items: null,
                nextIndex: 0
            });
        }

        for (var p = 0; p < paths.length; p++) {
            var pathStr = paths[p];
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                skippedFolders.push(pathStr);
                continue;
            }
            var children = [];
            masterCacheData[pathStr] = children;
            metadataMap[pathStr] = [];
            rootStats[pathStr] = {
                itemCount: 0,
                metadataCount: 0,
                lastModified: folder.modified ? folder.modified.getTime() : null
            };
            enqueueFolder(folder, children, [], pathStr);
        }

        if (!pending.length) {
            if (typeof onComplete === 'function') {
                onComplete(null, 'Nenhum caminho valido encontrado para esta producao.');
            }
            return;
        }

        var taskName = '__gnewsScan_' + (new Date().getTime()) + '_' + Math.floor(Math.random() * 1000);

        function finalize(errorMessage) {
            try { delete $.global[taskName]; } catch (deleteErr) {}
            if (typeof onComplete === 'function') {
                if (errorMessage) {
                    onComplete(null, errorMessage);
                } else {
                    onComplete({
                        masterCache: masterCacheData,
                        metadataMap: metadataMap,
                        metadataList: metadataList,
                        rootStats: rootStats,
                        skipped: skippedFolders
                    }, null);
                }
            }
        }

        function processChunk() {
            if (progressUpdater && typeof progressUpdater === 'function') {
                progressUpdater('Escaneando caminhos... (' + (pending.length) + ' fila)');
            }
            var iterations = 0;
            while (pending.length > 0 && iterations < MAX_FOLDER_ITERATIONS_PER_CHUNK) {
                var entry = pending.pop();
                if (!entry || !(entry.folder instanceof Folder) || !entry.folder.exists) {
                    continue;
                }
                var folder = entry.folder;
                var targetArray = entry.targetArray;
                var parents = entry.parents || [];
                var rootKey = entry.rootKey;
                if (!entry.items) {
                    var startRead = $.hiresTimer;
                    try { entry.items = folder.getFiles(); } catch (fsErr) { entry.items = []; }
                    entry.nextIndex = 0;
                    var elapsedMs = ($.hiresTimer - startRead) / 1000;
                    if (elapsedMs > SLOW_FOLDER_THRESHOLD_MS) {
                        var count = (slowFolderTracker[entry.folderKey] || 0) + 1;
                        slowFolderTracker[entry.folderKey] = count;
                        if (count > 1) {
                            skippedFolders.push(folder.fsName || folder.displayName || entry.folderKey);
                            entry.items = [];
                        }
                    }
                }
                var items = entry.items || [];
                var processedInThisFolder = 0;
                while (entry.nextIndex < items.length) {
                    var item = items[entry.nextIndex++];
                    if (!item) { continue; }
                    if (item instanceof Folder) {
                        var rawName = item.name || item.displayName || item.fsName || '';
                        var folderLower = rawName.toLowerCase();
                        if (!folderLower) { folderLower = (item.fsName || '').toLowerCase(); }
                        if (shouldIgnoreFolder(folderLower)) { continue; }
                        var decodedFolderName = decodePercentString(rawName);
                        var node = { type: 'node', text: decodedFolderName, children: [] };
                        targetArray.push(node);
                        var nextParents = parents.slice(0);
                        nextParents.push(decodedFolderName);
                        enqueueFolder(item, node.children, nextParents, rootKey);
                    } else if (item instanceof File) {
                        var fileName = item.name || '';
                        var fileNameLower = fileName.toLowerCase();
                        if (shouldIgnoreFile(fileNameLower)) { continue; }
                        if (!fileMatchesFilter(fileName)) { continue; }
                        var decodedName = decodePercentString(fileName);
                        var decodedPath = decodePercentString(item.fsName);
                        var modDate = item.modified ? item.modified.toUTCString() : '';
                        var size = item.length || 0;
                        var entryData = {
                            type: 'item',
                            text: decodedName,
                            filePath: decodedPath,
                            modDate: modDate,
                            size: size
                        };
                        targetArray.push(entryData);
                        if (!metadataMap[rootKey]) { metadataMap[rootKey] = []; }
                        var metadataEntry = {
                            text: decodedName,
                            filePath: decodedPath,
                            parents: parents.slice(0),
                            modDate: modDate,
                            size: size
                        };
                        metadataMap[rootKey].push(metadataEntry);
                        metadataList.push(metadataEntry);
                        if (!rootStats[rootKey]) {
                            rootStats[rootKey] = { itemCount: 0, metadataCount: 0, lastModified: null };
                        }
                        rootStats[rootKey].itemCount++;
                        rootStats[rootKey].metadataCount++;
                    }
                    processedInThisFolder++;
                    if (processedInThisFolder >= MAX_ITEMS_PER_PASS) {
                        break;
                    }
                }
                if (entry.nextIndex < (entry.items || []).length) {
                    pending.push(entry);
                }
                iterations++;
            }
            if (!pending.length) {
                finalize(null);
                return;
            }
            try {
                $.global[taskName] = processChunk;
                app.scheduleTask('if ($.global["' + taskName + '"]) { $.global["' + taskName + '"](); }', 30, false);
            } catch (scheduleErr) {
                finalize(scheduleErr && scheduleErr.message ? scheduleErr.message : 'Falha ao agendar varredura de rede.');
            }
        }

        processChunk();
    }

    function persistCacheFromScan(productionObject, masterCacheData, metadataMap, rootStats) {
        try {
            var cacheFile = new File(runtimeCachePath + '/' + productionObject.cacheFile);
            cacheFile.open('w');
            cacheFile.encoding = 'UTF-8';
            cacheFile.write(JSON.stringify(masterCacheData, null, 2));
            cacheFile.close();
            var metadataFileName = productionObject.metadataFile || productionObject.cacheFile.replace('_cache', '_metadata');
            var metadataFile = new File(runtimeCachePath + '/' + metadataFileName);
            metadataFile.open('w');
            metadataFile.encoding = 'UTF-8';
            metadataFile.write(JSON.stringify(metadataMap, null, 2));
            metadataFile.close();
            productionObject.metadataFile = metadataFileName;
        } catch (writeErr) {
            logError('Falha ao salvar cache gerado da rede: ' + writeErr);
            return false;
        }
        var manifestData = readCacheManifest(true);
        var cacheFileName = productionObject.cacheFile;
        if (!manifestData[cacheFileName]) { manifestData[cacheFileName] = { file: cacheFileName, paths: {} }; }
        var manifestEntry = manifestData[cacheFileName];
        manifestEntry.paths = manifestEntry.paths || {};
        var nowUTC = new Date().toUTCString();
        for (var pathKey in masterCacheData) {
            if (!masterCacheData.hasOwnProperty(pathKey)) { continue; }
            var stats = rootStats[pathKey] || {};
            manifestEntry.paths[pathKey] = {
                lastModified: stats.lastModified ? new Date(stats.lastModified).toUTCString() : nowUTC,
                lastScan: nowUTC,
                itemCount: stats.itemCount || 0,
                metadataCount: stats.metadataCount || stats.itemCount || 0,
                cacheHash: computeTreeHash(masterCacheData[pathKey])
            };
        }
        writeCacheManifestData(manifestData);
        return true;
    }

    function startNetworkFallbackLoad(productionObject, telemetry, options) {
        options = options || {};
        var prodName = productionObject.name;
        var directMode = options.reason === 'forceDirect';
        var loadingMessage = directMode ? ('Carregando ' + prodName + ' da rede (modo direto)...') : ('Carregando ' + prodName + ' diretamente da rede...');
        setLoadingState(true, loadingMessage);
        scanProductionPaths(productionObject, function (statusText) {
            if (loadingGrp && loadingGrp.children && loadingGrp.children[0]) {
                loadingGrp.children[0].text = statusText;
            }
        }, function (result, errorMessage) {
            if (errorMessage || !result) {
                var errMsg = errorMessage || ('Nao foi possivel carregar dados para ' + prodName + '.');
                cacheErrorPlaceholder(prodName, errMsg);
                markProductionFailure(prodName, errMsg);
                logError(errMsg);
                setLoadingState(false);
                if (telemetry) { endTelemetrySpan(telemetry, { status: 'networkError', prod: prodName }); }
                return;
            }
            var aggregatedTree = [];
            var orderPaths = productionObject.paths || [];
            for (var i = 0; i < orderPaths.length; i++) {
                var key = orderPaths[i];
                var entries = result.masterCache[key];
                if (!entries || !entries.length) { continue; }
                for (var e = 0; e < entries.length; e++) {
                    aggregatedTree.push(entries[e]);
                }
            }
            if (!aggregatedTree.length) {
                var emptyMsg = 'Nao foi possivel localizar arquivos para ' + prodName + ' nos caminhos configurados.';
                cacheErrorPlaceholder(prodName, emptyMsg);
                markProductionFailure(prodName, emptyMsg);
                logWarn(emptyMsg);
                setLoadingState(false);
                if (telemetry) { endTelemetrySpan(telemetry, { status: 'networkEmpty', prod: prodName }); }
                return;
            }
            templatesCache[prodName] = aggregatedTree;
            if (templatesCache[prodName].__error) { delete templatesCache[prodName].__error; }
            delete templatesCache[prodName].__pending;
            metadataCache[prodName] = { raw: null, sanitized: result.metadataList };
            buildProductionIndex(prodName, aggregatedTree);
            var successMsg = aggregatedTree.length + (aggregatedTree.length === 1 ? ' item carregado da rede' : ' itens carregados da rede');
            markProductionSuccess(prodName, successMsg);
            logInfo('Carregado diretamente da rede: ' + prodName + ' (' + aggregatedTree.length + ' itens)');
            setLoadingState(false);
            requestActiveRefreshFor(prodName);
            if (telemetry) { endTelemetrySpan(telemetry, { status: 'network', prod: prodName, items: aggregatedTree.length }); }
            if (!options.skipPrompt) {
                var promptMsg = 'Deseja gerar o cache local para "' + prodName + '" e evitar novas leituras diretas?';
                if (showThemedConfirm(promptMsg, 'Gerar cache', 'Gerar cache', 'Agora nao')) {
                    var persisted = persistCacheFromScan(productionObject, result.masterCache, result.metadataMap, result.rootStats);
                    if (persisted) {
                        showThemedAlert('Cache gerado com sucesso para "' + prodName + '".', 'Gerar cache');
                    } else {
                        showThemedAlert('Nao foi possivel salvar o cache para "' + prodName + '".', 'Gerar cache');
                    }
                }
            }
        });
    }

    function loadCacheInBackground(productionObject) {
        var prodName = productionObject.name;
        ensureProductionFileReferences(productionObject, false);
        if ((templatesCache[prodName] && templatesCache[prodName].__error !== true) || !productionObject.cacheFile) return;
        var telemetry = startTelemetrySpan('loadCache:' + prodName);
        if (forceNetworkLoading) {
            startNetworkFallbackLoad(productionObject, telemetry, { skipPrompt: true, reason: 'forceDirect' });
            return;
        }
        var cacheFile = new File(runtimeCachePath + '/' + productionObject.cacheFile);
        if (!cacheFile || !cacheFile.exists) {
            var derivedCacheName = deriveCacheFileFromName(prodName);
            if (derivedCacheName && derivedCacheName !== productionObject.cacheFile) {
                var fallbackCache = new File(runtimeCachePath + '/' + derivedCacheName);
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
            logWarn(missingMsg + ' Tentando carregamento direto.');
            startNetworkFallbackLoad(productionObject, telemetry);
            return;
        }
        var manifestSummary = summarizeManifestForProduction(productionObject, getManifestSnapshot());
        var restoredSnapshot = tryRestoreNormalizedSnapshot(prodName, productionObject, manifestSummary);
        if (restoredSnapshot && restoredSnapshot.length) {
            templatesCache[prodName] = restoredSnapshot;
            if (templatesCache[prodName].__error) { delete templatesCache[prodName].__error; }
            delete templatesCache[prodName].__pending;
            buildProductionIndex(prodName, restoredSnapshot);
            var restoredMsg = manifestSummary ? formatManifestSummary(manifestSummary) : (restoredSnapshot.length + (restoredSnapshot.length === 1 ? ' item carregado' : ' itens carregados'));
            markProductionSuccess(prodName, restoredMsg);
            logInfo('Snapshot restaurado para ' + prodName + ' (' + restoredSnapshot.length + ' itens)');
            endTelemetrySpan(telemetry, { status: 'snapshot', prod: prodName, items: restoredSnapshot.length });
            return;
        }
        var masterCacheData = readJsonFile(cacheFile);
        if (!masterCacheData || typeof masterCacheData !== 'object') {
            var readMsg = 'Falha ao ler o cache de ' + prodName + '.';
            cacheErrorPlaceholder(prodName, readMsg);
            markProductionFailure(prodName, readMsg);
            logError(readMsg);
            notifyCacheIssue(readMsg);
            purgeSnapshot(prodName, productionObject);
            startNetworkFallbackLoad(productionObject, telemetry);
            return;
        }
        var orderedCacheKeys = getOrderedCacheKeysForProduction(productionObject, masterCacheData);
        if (!orderedCacheKeys.length) {
            for (var fallbackKey in masterCacheData) {
                if (masterCacheData.hasOwnProperty(fallbackKey)) {
                    pushUniqueValue(orderedCacheKeys, fallbackKey);
                }
            }
        }
        if (!orderedCacheKeys.length) {
            var emptyMsg = 'Nenhum template valido encontrado para ' + prodName + '.';
            cacheErrorPlaceholder(prodName, emptyMsg);
            markProductionFailure(prodName, emptyMsg);
            logWarn(emptyMsg);
            notifyCacheIssue(emptyMsg);
            endTelemetrySpan(telemetry, { status: 'empty', prod: prodName });
            purgeSnapshot(prodName, productionObject);
            return;
        }
        var sliceQueue = createCacheSliceQueue(masterCacheData, orderedCacheKeys, CACHE_BRANCH_SLICE_SIZE);
        if (!sliceQueue.length) {
            var emptySliceMsg = 'Nao ha dados suficientes para processar o cache de ' + prodName + '.';
            cacheErrorPlaceholder(prodName, emptySliceMsg);
            markProductionFailure(prodName, emptySliceMsg);
            logWarn(emptySliceMsg);
            notifyCacheIssue(emptySliceMsg);
            endTelemetrySpan(telemetry, { status: 'empty', prod: prodName });
            purgeSnapshot(prodName, productionObject);
            return;
        }
        var job = {
            prodName: prodName,
            prodIndex: getProductionIndexFromObject(productionObject),
            productionObject: productionObject,
            masterCacheData: masterCacheData,
            remainingSlices: sliceQueue,
            aggregatedTree: [],
            telemetry: telemetry,
            desiredCount: itemsPerPage,
            requestedCount: Math.max(itemsPerPage + CACHE_PREFETCH_PADDING, itemsPerPage),
            prefetchPadding: CACHE_PREFETCH_PADDING,
            lastSatisfiedDemand: 0,
            manifestSummary: manifestSummary,
            expectedTotal: (manifestSummary && manifestSummary.itemCount) ? manifestSummary.itemCount : null,
            nodeBudget: CACHE_NORMALIZE_NODE_BUDGET
        };
        templatesCache[prodName] = job.aggregatedTree;
        templatesCache[prodName].__pending = true;
        registerNormalizationJob(job);
        updateProductionStatus(job.prodIndex, 'loading', 'Carregando ' + prodName + '...');
        scheduleCacheNormalizationTask();
        return;
    }

    function startManualCacheRebuild(productionObject) {
        if (!productionObject || !productionObject.name) {
            showThemedAlert('Selecione uma producao valida antes de recriar o cache.', 'Recriar cache');
            return;
        }
        ensureProductionFileReferences(productionObject, false);
        var prodName = productionObject.name;
        var cacheFile = new File(runtimeCachePath + '/' + productionObject.cacheFile);
        if (!cacheFile || !cacheFile.exists) {
            showThemedAlert('O arquivo de cache para "' + prodName + '" nao foi encontrado.\nExecute a geracao de cache no configurador.', 'Recriar cache');
            return;
        }
        var masterCacheData = readJsonFile(cacheFile);
        if (!masterCacheData || typeof masterCacheData !== 'object') {
            showThemedAlert('Falha ao ler o cache existente de "' + prodName + '".', 'Recriar cache');
            return;
        }
        var orderedCacheKeys = getOrderedCacheKeysForProduction(productionObject, masterCacheData);
        if (!orderedCacheKeys.length) {
            showThemedAlert('Nenhum dado valido encontrado no cache de "' + prodName + '".', 'Recriar cache');
            return;
        }
        var sliceQueue = createCacheSliceQueue(masterCacheData, orderedCacheKeys, CACHE_BRANCH_SLICE_SIZE);
        if (!sliceQueue.length) {
            showThemedAlert('Nao ha dados suficientes para recriar o cache de "' + prodName + '".', 'Recriar cache');
            return;
        }
        var job = {
            prodName: prodName,
            prodIndex: getProductionIndexFromObject(productionObject),
            productionObject: productionObject,
            masterCacheData: masterCacheData,
            remainingSlices: sliceQueue,
            aggregatedTree: [],
            telemetry: startTelemetrySpan('manualRebuild:' + prodName),
            desiredCount: Number.MAX_VALUE,
            requestedCount: Number.MAX_VALUE,
            prefetchPadding: 0,
            manifestSummary: summarizeManifestForProduction(productionObject, getManifestSnapshot()),
            expectedTotal: null
        };
        templatesCache[prodName] = job.aggregatedTree;
        templatesCache[prodName].__pending = true;
        registerNormalizationJob(job);
        updateProductionStatus(job.prodIndex, 'loading', 'Recriando cache de ' + prodName + '...');
        scheduleCacheNormalizationTask();
        requestActiveRefreshFor(prodName);
    }

    function populateListPage(listBox, allItems) {
        listBox.removeAll();
        resolveTotalPages(allItems.length);
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

    function shouldVirtualizeChildren(count) {
        return typeof count === 'number' && count >= VIRTUAL_TREE_BUCKET_THRESHOLD;
    }

    function determineVirtualBucketSize(childCount) {
        if (!childCount || childCount <= 0) { return VIRTUAL_TREE_BUCKET_SIZE; }
        if (childCount > 2000) { return Math.max(200, Math.round(childCount / 12)); }
        if (childCount > 1000) { return Math.max(160, Math.round(childCount / 10)); }
        if (childCount > 600) { return Math.max(140, Math.round(childCount / 8)); }
        return VIRTUAL_TREE_BUCKET_SIZE;
    }

    function formatVirtualBucketLabel(start, end, total) {
        return 'Itens ' + (start + 1) + ' - ' + end + (total ? ' / ' + total : '');
    }

    function createVirtualBucketPlaceholders(treeNode, entryData) {
        if (!treeNode || !entryData || !entryData.children || !entryData.children.length) { return; }
        treeNode.removeAll();
        var total = entryData.children.length;
        var bucketSize = determineVirtualBucketSize(total);
        treeNode.__childState = 'virtualBucketsReady';
        treeNode.__virtualInfo = {
            entry: entryData,
            bucketSize: bucketSize,
            total: total
        };
        for (var start = 0; start < total; start += bucketSize) {
            var end = Math.min(total, start + bucketSize);
            var bucketNode = treeNode.add('node', formatVirtualBucketLabel(start, end, total));
            bucketNode.__childState = 'virtualBucketPending';
            bucketNode.__bucketRange = {
                entry: entryData,
                start: start,
                end: end
            };
            bucketNode.onExpand = function () { materializeBucketChildren(this); };
        }
    }

    function materializeBucketChildren(bucketNode) {
        if (!bucketNode || bucketNode.__childState !== 'virtualBucketPending') { return; }
        var range = bucketNode.__bucketRange;
        if (!range || !range.entry || !range.entry.children) {
            bucketNode.__childState = 'empty';
            return;
        }
        bucketNode.__childState = 'loading';
        bucketNode.removeAll();
        var children = range.entry.children;
        for (var i = range.start; i < range.end && i < children.length; i++) {
            var child = children[i];
            if (!child) { continue; }
            if (child.type === 'node') {
                createLazyTreeNode(bucketNode, child);
            } else if (child.type === 'item') {
                createLazyTreeItem(bucketNode, child);
            }
        }
        bucketNode.__childState = 'loaded';
        bucketNode.onExpand = null;
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
            if (shouldVirtualizeChildren(entryData.children.length)) {
                createVirtualBucketPlaceholders(node, entryData);
            } else {
                node.__childState = 'pending';
                node.__placeholder = node.add('item', '...');
            }
        } else {
            node.__childState = 'empty';
        }
        node.onExpand = function () {
            if (this.__childState === 'virtualBucketsReady') { return; }
            ensureNodeChildrenLoaded(this);
        };
        return node;
    }

    function ensureNodeChildrenLoaded(treeNode) {
        if (!treeNode) { return; }
        if (treeNode.__childState === 'virtualBucketPending') {
            materializeBucketChildren(treeNode);
            return;
        }
        if (treeNode.__childState !== 'pending' || !treeNode.__dataRef) { return; }
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
            mode: 'lazy',
            chunkSize: resolveDynamicTreeChunkSize(stack.length)
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

    function extractVersionFromContent(content) {
        if (!content) { return null; }
        var version = null;
        var creatorMatch = content.match(/<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i);
        var agentMatch = content.match(/<stEvt:softwareAgent>(.*?)<\/stEvt:softwareAgent>/i);
        var candidate = null;
        if (creatorMatch && creatorMatch[1]) { candidate = creatorMatch[1]; }
        else if (agentMatch && agentMatch[1]) { candidate = agentMatch[1]; }
        if (candidate) {
            version = candidate.replace(/^\s+|\s+$/g, '');
        } else {
            var genericMatch = content.match(/Adobe After Effects \d{2,4}\.\d/);
            if (genericMatch && genericMatch[0]) {
                version = genericMatch[0];
            }
        }
        if (version && version.indexOf("Photoshop") > -1) {
            version = version.replace("Photoshop", "After Effects");
        }
        if (!version) { return null; }
        if (version.match(/24\.\d/)) { return "After Effects 2024"; }
        if (version.match(/23\.\d/)) { return "After Effects 2023"; }
        if (version.match(/22\.\d/)) { return "After Effects 2022"; }
        if (version.match(/18\.\d/)) { return "After Effects 2021"; }
        if (version.match(/17\.\d/)) { return "After Effects 2020"; }
        return version;
    }

    function getAepVersion(aepFile) {
        if (!aepFile || !aepFile.exists) { return "N/A"; }
        var cacheKey = aepFile.fsName || aepFile.fullName || '';
        var modStamp = aepFile.modified ? aepFile.modified.getTime() : 0;
        if (cacheKey && previewVersionCache[cacheKey] && previewVersionCache[cacheKey].stamp === modStamp) {
            return previewVersionCache[cacheKey].version;
        }
        try {
            var CHUNK_BYTES = 65536; // 64 KB
            var MAX_CHUNKS = 2;
            aepFile.encoding = "BINARY";
            aepFile.open('r');
            var buffer = '';
            var version = null;
            var chunks = 0;
            while (!aepFile.eof && chunks < MAX_CHUNKS) {
                buffer += aepFile.read(CHUNK_BYTES);
                version = extractVersionFromContent(buffer);
                if (version) { break; }
                buffer = buffer.length > 1024 ? buffer.substr(buffer.length - 1024) : buffer;
                chunks++;
            }
            aepFile.close();
            if (!version) { version = "Desconhecida"; }
            if (cacheKey) {
                previewVersionCache[cacheKey] = { version: version, stamp: modStamp };
            }
            return version;
        } catch (e) {
            try { aepFile.close(); } catch (closeErr) {}
            return "Erro de leitura";
        }
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
            if (!isTemplatesWindowActive() || !loadingGrp || !loadingGrp.visible) {
                stopLoadingAnimation();
                return;
            }
            loadingAnimationFrame = (loadingAnimationFrame + 1) % 4;
            var dots = '';
            for (var i = 0; i < loadingAnimationFrame; i++) { dots += '.'; }
            loadingGrp.children[0].text = loadingAnimationBaseText + dots;
            try { loadingGrp.update(); } catch (updErr) {}
            try {
                loadingAnimationTaskId = app.scheduleTask('$.global.__gnewsLoadingAnimation()', 250, false);
            } catch (animErr) {
                stopLoadingAnimation();
            }
        };
        if (isTemplatesWindowActive()) {
            $.global.__gnewsLoadingAnimation();
        } else {
            try { delete $.global.__gnewsLoadingAnimation; } catch (animDelErr) {}
        }
    }

    function setLoadingState(isLoading, message, preserveList) {
        if (!isTemplatesWindowActive() || !loadingGrp || !templateList) { return; }
        loadingGrp.children[0].text = message || 'Carregando, por favor aguarde...';
        loadingGrp.visible = isLoading;
        if (!preserveList) {
            templateList.visible = !isLoading;
        }
        if (isLoading) {
            startLoadingAnimation(message || 'Carregando, por favor aguarde');
        } else {
            stopLoadingAnimation();
        }
    }
    
    function resolveTotalPages(totalItems) {
        if (!itemsPerPage || itemsPerPage <= 0) { itemsPerPage = 50; }
        if (!totalItems || totalItems <= 0) {
            currentPage = 0;
            return 0;
        }
        var totalPages = Math.ceil(totalItems / itemsPerPage);
        var maxIndex = Math.max(0, totalPages - 1);
        if (currentPage > maxIndex) { currentPage = maxIndex; }
        if (currentPage < 0) { currentPage = 0; }
        return totalPages;
    }

    function updatePaginationControls(totalItems) {
        var totalPages = resolveTotalPages(totalItems);
        if (totalPages <= 1) {
            paginationGrp.visible = false;
            pageInfo.text = totalItems ? "Pagina 1 de 1" : "Pagina 0 de 0";
            prevBtn.enabled = nextBtn.enabled = false;
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
        if (!isTemplatesUIReady()) { return false; }
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
        if (lazyMetadataEnabled) {
            scheduleMetadataLoad(productionObject);
        } else {
            safeLoadMetadata(productionObject);
        }
        var metadataItems = getSanitizedMetadataEntries(prodName);
        if (!metadataItems || !metadataItems.length) {
            requestAdditionalData(prodName, Math.max(itemsPerPage, 1));
            setProductionStatus(prodDrop.selection ? prodDrop.selection.index : -1, 'loading', 'Carregando ' + prodName + '...');
            if (!templateList || !templateList.items || !templateList.items.length) {
                templateList.removeAll();
            }
            updateItemCounter(templateList && templateList.items ? templateList.items.length : 0);
            setLoadingState(false, null, true);
            endTelemetrySpan(telemetry, { status: 'pendingLoad', prod: prodName });
            return false;
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



    function getSelectedFile() {
        return (templateList.selection && templateList.selection.filePath) ? new File(templateList.selection.filePath) : null;
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
    if (prodDrop) {
        prodDrop.onChange = function () {
            notifyUserActivity(BACKGROUND_WARMUP_IDLE_DELAY * 1.5);
            GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates.lastProductionIndex = this.selection.index;
            var selectedIndex = (this.selection) ? this.selection.index : -1;
            if (selectedIndex > -1 && productions[selectedIndex]) {
                pendingPopulateProduction = productions[selectedIndex].name;
                activeProductionName = productions[selectedIndex].name;
                setProductionStatus(selectedIndex, 'loading', 'Carregando ' + productions[selectedIndex].name + '...');
                queueProductionPreload(selectedIndex, 50);
                rebuildPrefetchQueue(selectedIndex);
                resumePrefetchCycle(PREFETCH_INTERVAL);
            } else {
                activeProductionName = null;
            }
            updateProductionStatusLabel(selectedIndex);
            saveSystemConfigs(); 
            currentPage = 0;
            safePerformSearch(searchBox.isPlaceholderActive ? "" : searchBox.text);
        };
    } else {
        $.writeln("[GNEWS_Templates] prodDrop undefined ao ligar eventos; ignorando onChange.");
    }
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
    networkModeChk.onClick = function () {
        notifyUserActivity(BACKGROUND_WARMUP_IDLE_DELAY * 1.5);
        forceNetworkLoading = this.value === true;
        if (GNEWS_TEMPLATES_CONFIG.system && GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings) {
            if (!GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates) {
                GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates = {};
            }
            GNEWS_TEMPLATES_CONFIG.system.TEMPLATES_Settings.gnews_templates.directNetworkMode = forceNetworkLoading;
            saveSystemConfigs();
        }
        for (var purgeIdx = 0; purgeIdx < productionBaseNames.length; purgeIdx++) {
            var purgeName = productionBaseNames[purgeIdx];
            if (!purgeName) { continue; }
            if (templatesCache.hasOwnProperty(purgeName)) { delete templatesCache[purgeName]; }
            if (metadataCache.hasOwnProperty(purgeName)) { delete metadataCache[purgeName]; }
            if (productionQuickIndex.hasOwnProperty(purgeName)) { delete productionQuickIndex[purgeName]; }
            if (productionCodeIndex.hasOwnProperty(purgeName)) { delete productionCodeIndex[purgeName]; }
        }
        var activeProduction = activeProductionName ? getProductionByName(activeProductionName) : null;
        if (activeProduction) {
            if (forceNetworkLoading) {
                startNetworkFallbackLoad(activeProduction, null, { skipPrompt: true, reason: 'directToggle' });
            } else {
                safeLoadCache(activeProduction);
            }
        }
        currentPage = 0;
        safePerformSearch(searchBox.isPlaceholderActive ? "" : searchBox.text);
    };
    
    prevBtn.onClick = function() {
        if (currentPage <= 0) { return; }
        currentPage--;
        notifyUserActivity();
        ensureActiveProductionBudgetForPage(currentPage);
        populateListPage(templateList, filteredDataCache);
        updatePaginationControls(filteredDataCache.length);
    };
    nextBtn.onClick = function() {
        var totalItems = filteredDataCache.length;
        var totalPages = resolveTotalPages(totalItems);
        if (!totalPages || currentPage >= totalPages - 1) { return; }
        currentPage++;
        notifyUserActivity();
        ensureActiveProductionBudgetForPage(currentPage);
        populateListPage(templateList, filteredDataCache);
        updatePaginationControls(filteredDataCache.length);
    };

    var handleManualRebuild = function () {
        notifyUserActivity(BACKGROUND_WARMUP_IDLE_DELAY * 2);
        if (!prodDrop || !prodDrop.selection || prodDrop.selection.index < 0) {
            showThemedAlert('Selecione uma producao antes de recriar o cache.', 'Recriar cache');
            return;
        }
        var selectedProduction = productions[prodDrop.selection.index];
        if (!selectedProduction) {
            showThemedAlert('Producao invalida.', 'Recriar cache');
            return;
        }
        startManualCacheRebuild(selectedProduction);
    };
    
    function showReloadOptionsDialog() {
        var dialogTitle = 'Recarregar Cache';
        var dlg = new Window('dialog', dialogTitle, undefined, { closeButton: true });
        dlg.orientation = 'column';
        dlg.alignChildren = 'fill';
        dlg.spacing = 12;
        dlg.margins = 16;
        if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
            try { setBgColor(dlg, bgColor1); } catch (bgErr) {}
        }
        var msg = dlg.add('statictext', undefined, 'Escolha o tipo de recarga:');
        if (typeof setFgColor === 'function' && typeof normalColor1 !== 'undefined') {
            try { setFgColor(msg, normalColor1); } catch (fgErr) {}
        }
        var btnGrp = dlg.add('group');
        btnGrp.alignment = 'fill';
        btnGrp.spacing = 10;
        var simpleBtn = btnGrp.add('button', undefined, 'Simples');
        var fullBtn = btnGrp.add('button', undefined, 'Completa');
        var cancelBtn = dlg.add('button', undefined, 'Cancelar', { name: 'cancel' });
        var result = null;
        simpleBtn.onClick = function () { result = 'simple'; dlg.close(); };
        fullBtn.onClick = function () { result = 'full'; dlg.close(); };
        cancelBtn.onClick = function () { result = null; dlg.close(); };
        dlg.center();
        dlg.show();
        return result;
    }

    var performSimpleReload = function () {
        notifyUserActivity(BACKGROUND_WARMUP_IDLE_DELAY * 2);
        resetSharedCaches();
        activeProductionName = null;
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
    var handleReloadAction = function () {
        var choice = showReloadOptionsDialog();
        if (!choice) { return; }
        if (choice === 'simple') {
            performSimpleReload();
            return;
        }
        notifyUserActivity(BACKGROUND_WARMUP_IDLE_DELAY * 2);
        if (!prodDrop || !prodDrop.selection || prodDrop.selection.index < 0) {
            showThemedAlert('Selecione uma producao antes de recriar o cache.', 'Recriar cache');
            return;
        }
        var selectedProduction = productions[prodDrop.selection.index];
        if (!selectedProduction) {
            showThemedAlert('Producao invalida.', 'Recriar cache');
            return;
        }
        var warnMsg = 'Esta operacao ira recalcular todo o cache de "' + selectedProduction.name + '".\nPode levar varios minutos e deixar o After Effects lento.\n\nDeseja continuar?';
        if (!confirm(warnMsg)) { return; }
        startManualCacheRebuild(selectedProduction);
        setLoadingState(true, 'Recriando cache de ' + selectedProduction.name + '...');
    };

    if (refreshBtn.leftClick) { refreshBtn.leftClick.onClick = handleReloadAction; } else { refreshBtn.onClick = handleReloadAction; }
    var openTemplatesFolder = function () {
        var selectedProduction = productions[prodDrop.selection.index];
        var folderToShow = new Folder(selectedProduction.paths[0]); 
        if (folderToShow.exists) { folderToShow.execute(); } else { showThemedAlert("O caminho nao foi encontrado:\n" + folderToShow.fsName, 'Aviso'); }
    };
    if (openFldBtn.leftClick) { openFldBtn.leftClick.onClick = openTemplatesFolder; } else { openFldBtn.onClick = openTemplatesFolder; }
    var onSelectionChange = function (selection) { updateArteInfo(selection); };
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
    templateList.onDoubleClick = function () { var selection = this.selection; if (selection && selection.filePath) { executeOpen(); } };
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

} // fecha d9TemplateDialog


