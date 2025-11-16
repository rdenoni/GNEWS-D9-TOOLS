/* eslint-disable no-undef */
/*
---------------------------------------------------------------
> treeView lib.js — versão modernizada
> Objetivo:
>   - Criar/atualizar árvores de ScriptUI em blocos pequenos,
>     prevenindo travamentos em listas grandes.
>   - Disponibilizar virtualização simples (bucket nodes)
>     para pastas com muitos itens.
>   - Manter compatibilidade com chamadas antigas
>     (buildTree, createHierarchy, populateTreeFromData, etc.).
---------------------------------------------------------------
*/

// ==========================
// CONFIGURAÇÕES PADRÃO
// ==========================
var TREEVIEW_RENDER_CHUNK_SIZE = 80;     // Quantos nós são inseridos por iteração
var TREEVIEW_RENDER_DELAY = 20;         // Delay (ms) entre blocos
var TREEVIEW_VIRTUAL_THRESHOLD = 150;   // Nº mínimo de filhos para ativar buckets
var TREEVIEW_VIRTUAL_BUCKET_SIZE = 120; // Tamanho base de cada bucket

// ==========================
// HELPERS INTERNOS
// ==========================
function cloneArray(arr) {
    if (!(arr instanceof Array)) { return []; }
    return arr.slice(0);
}

function normalizeOptions(options) {
    var opts = options || {};
    return {
        chunkSize: Math.max(10, opts.chunkSize || TREEVIEW_RENDER_CHUNK_SIZE),
        delay: typeof opts.delay === 'number' ? opts.delay : TREEVIEW_RENDER_DELAY,
        virtualThreshold: typeof opts.virtualThreshold === 'number'
            ? opts.virtualThreshold
            : TREEVIEW_VIRTUAL_THRESHOLD,
        virtualBucketSize: typeof opts.virtualBucketSize === 'number'
            ? opts.virtualBucketSize
            : TREEVIEW_VIRTUAL_BUCKET_SIZE,
        onComplete: typeof opts.onComplete === 'function' ? opts.onComplete : null
    };
}

function clearTreeControl(treeNode) {
    if (!treeNode || !treeNode.items) { return; }
    while (treeNode.items.length > 0) {
        treeNode.remove(treeNode.items[0]);
    }
}

function shouldVirtualizeBranch(count, options) {
    return count >= options.virtualThreshold;
}

function formatBucketLabel(startIndex, endIndex, total) {
    return 'Itens ' + (startIndex + 1) + ' - ' + endIndex + (total ? ' / ' + total : '');
}

function getBucketSize(total, options) {
    var base = options.virtualBucketSize;
    if (total > 2000) { return Math.max(base, Math.round(total / 14)); }
    if (total > 1200) { return Math.max(base, Math.round(total / 10)); }
    if (total > 800)  { return Math.max(base, Math.round(total / 8)); }
    return base;
}

function removeAllChildren(node) {
    if (!node || !node.items) { return; }
    while (node.items.length > 0) {
        node.items[0].remove();
    }
}

// ==========================
// RENDERIZAÇÃO CHUNKED
// ==========================
function scheduleTreeRender(state) {
    if (!state.stack.length) {
        if (state.taskName) {
            try { delete $.global[state.taskName]; } catch (delErr) {}
            state.taskName = null;
        }
        if (state.onComplete) {
            try { state.onComplete(); } catch (cbErr) {}
        }
        return;
    }

    state.taskName = state.taskName || ('__treeRenderTask_' + new Date().getTime());
    $.global[state.taskName] = function () {
        state.taskId = null;
        runTreeRenderChunk(state);
    };
    try {
        state.taskId = app.scheduleTask(
            'if ($.global["' + state.taskName + '"]) { $.global["' + state.taskName + '"](); }',
            state.delay,
            false
        );
    } catch (scheduleErr) {
        try {
            if ($.global[state.taskName]) { $.global[state.taskName](); }
        } catch (runErr) {}
    }
}

function runTreeRenderChunk(state) {
    if (!state.stack.length) {
        scheduleTreeRender(state);
        return;
    }
    var iterations = 0;
    while (state.stack.length > 0 && iterations < state.chunkSize) {
        var current = state.stack.pop();
        renderTreeEntry(current.data, current.parent, state);
        iterations++;
    }
    if (!state.stack.length && state.taskName) {
        try { delete $.global[state.taskName]; } catch (cleanupErr) {}
        state.taskName = null;
    }
    scheduleTreeRender(state);
}

function renderTreeEntry(entry, parentNode, state) {
    if (!entry || !parentNode || typeof parentNode.add !== 'function') { return; }
    var node;
    if (entry.type === 'node') {
        node = parentNode.add('node', entry.text || entry.name || 'pasta');
        if (entry.image) { node.image = entry.image; }
        if (entry.icon) { node.icon = entry.icon; }
        node.__virtualOptions = state.options;
        node.__treeData = entry;
        var children = entry.children || [];
        if (children.length) {
            if (shouldVirtualizeBranch(children.length, state.options)) {
                createVirtualBuckets(node, children, state.options);
            } else {
                for (var i = children.length - 1; i >= 0; i--) {
                    state.stack.push({ data: children[i], parent: node });
                }
            }
        }
    } else if (entry.type === 'item') {
        node = parentNode.add('item', entry.text || entry.name || 'arquivo');
        if (entry.image) { node.image = entry.image; }
        node.filePath = entry.filePath || (entry.file ? entry.file.fsName : '');
        node.modDate = entry.modDate || null;
        node.size = entry.size || null;
        node.data = entry.data || entry.file || null;
    } else {
        parentNode.add('item', entry.text || entry.toString());
    }
}

function createVirtualBuckets(parentNode, children, options) {
    removeAllChildren(parentNode);
    parentNode.__virtualChildren = children;
    parentNode.__virtualOptions = options;
    parentNode.__childState = 'virtualBuckets';
    var bucketSize = getBucketSize(children.length, options);
    for (var start = 0; start < children.length; start += bucketSize) {
        var end = Math.min(children.length, start + bucketSize);
        var bucketNode = parentNode.add('node', formatBucketLabel(start, end, children.length));
        bucketNode.__bucketRange = { parent: parentNode, start: start, end: end };
        bucketNode.__virtualOptions = options;
        bucketNode.__childState = 'virtualBucketPending';
        bucketNode.onExpand = function () { materializeVirtualBucket(this); };
    }
    parentNode.onExpand = null;
}

function materializeVirtualBucket(bucketNode) {
    if (!bucketNode || bucketNode.__childState !== 'virtualBucketPending') { return; }
    var range = bucketNode.__bucketRange;
    if (!range || !range.parent || !range.parent.__virtualChildren) { return; }
    bucketNode.__childState = 'loading';
    removeAllChildren(bucketNode);
    var slice = range.parent.__virtualChildren.slice(range.start, range.end);
    populateTreeFromData(bucketNode, slice, range.parent.__virtualOptions || {});
    bucketNode.onExpand = null;
    bucketNode.__childState = 'loaded';
}

// ==========================
// API PRINCIPAL
// ==========================
function populateTreeFromData(treeNode, dataArray, options) {
    var renderData = (dataArray instanceof Array) ? dataArray : [];
    var normalizedOptions = normalizeOptions(options);
    clearTreeControl(treeNode);
    if (!renderData.length) {
        if (normalizedOptions.onComplete) {
            try { normalizedOptions.onComplete(); } catch (cbErr) {}
        }
        return;
    }
    var state = {
        stack: [],
        chunkSize: normalizedOptions.chunkSize,
        delay: normalizedOptions.delay,
        options: normalizedOptions,
        onComplete: normalizedOptions.onComplete,
        tree: treeNode,
        taskId: null,
        taskName: null
    };
    for (var i = renderData.length - 1; i >= 0; i--) {
        state.stack.push({ data: renderData[i], parent: treeNode });
    }
    runTreeRenderChunk(state);
}

function buildHierarchyData(folder, fileTypes) {
    var root = [];
    if (!folder || !(folder instanceof Folder)) { return root; }
    var allowed = null;
    if (fileTypes instanceof Array && fileTypes.length) {
        allowed = [];
        for (var i = 0; i < fileTypes.length; i++) {
            allowed.push(String(fileTypes[i]).toLowerCase());
        }
    }
    var stack = [{ folder: folder, parent: root }];
    while (stack.length > 0) {
        var current = stack.pop();
        var entries = [];
        try { entries = current.folder.getFiles(); } catch (fsErr) { entries = []; }
        for (var idx = 0; idx < entries.length; idx++) {
            var entry = entries[idx];
            if (entry instanceof Folder) {
                var folderNode = {
                    type: 'node',
                    text: entry.displayName || entry.name,
                    children: []
                };
                current.parent.push(folderNode);
                stack.push({ folder: entry, parent: folderNode.children });
            } else {
                var entryName = entry.displayName || entry.name;
                var ext = entryName && entryName.indexOf('.') > -1
                    ? entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase()
                    : '';
                if (allowed && allowed.length && allowed.indexOf(ext) === -1) { continue; }
                current.parent.push({
                    type: 'item',
                    text: entryName,
                    file: entry,
                    filePath: entry.fsName,
                    modDate: entry.modified ? entry.modified.toUTCString() : null,
                    size: entry.length || entry.length === 0 ? entry.length : null
                });
            }
        }
    }
    return root;
}

function buildTree(folder, treeControl, fileTypes, options) {
    var hierarchyData = buildHierarchyData(folder, fileTypes);
    populateTreeFromData(treeControl, hierarchyData, options);
}

function createHierarchy(array, node, fileTypes, options) {
    if (!(array instanceof Array)) { return; }
    var descriptors = [];
    for (var i = 0; i < array.length; i++) {
        var entry = array[i];
        if (entry instanceof Folder) {
            descriptors.push({
                type: 'node',
                text: entry.displayName || entry.name,
                children: buildHierarchyData(entry, fileTypes)
            });
        } else {
            descriptors.push({
                type: 'item',
                text: entry.displayName || entry.name,
                file: entry,
                filePath: entry.fsName
            });
        }
    }
    populateTreeFromData(node, descriptors, options);
}

// ==========================
// UTILITÁRIOS LEGADOS
// ==========================
function cleanHierarchy(nodeTree) {
    if (!nodeTree || !nodeTree.items) { return false; }
    var branches = nodeTree.items;
    for (var i = branches.length - 1; i >= 0; i--) {
        if (branches[i].type === 'node') {
            var wasEmpty = cleanHierarchy(branches[i]);
            if (wasEmpty) { nodeTree.remove(branches[i]); }
        }
    }
    return nodeTree.items.length === 0 && nodeTree.parent != null;
}

function optimizeHierarchy(nodeTree) {
    if (!nodeTree || !nodeTree.items) { return; }
    var branches = nodeTree.items;
    for (var i = branches.length - 1; i >= 0; i--) {
        var branch = branches[i];
        if (!branch || branch.type !== 'node') { continue; }
        if (branch.items.length > 1) {
            optimizeHierarchy(branch);
        } else if (
            branch.items.length === 1 &&
            branch.items[0].type === 'node'
        ) {
            var subfolder = branch.items[0];
            branch.text += ' / ' + subfolder.text;
            while (subfolder.items.length > 0) {
                var child = subfolder.items[0];
                try {
                    var cloned = branch.add(child.type, child.text);
                    cloned.image = child.image;
                    cloned.file = child.file;
                } catch (cloneErr) {}
                subfolder.remove(child);
            }
            nodeTree.remove(subfolder);
        }
    }
}

function buildTxtSearchTree(tree, obj, compArray, progressBar) {
    // Mantido praticamente igual ao legado; esta função trabalha diretamente em ScriptUI.
    var sKey = obj.sKey; var vis = obj.vis; var matchCase = obj.matchCase; var matchAccent = obj.matchAccent; var invert = !obj.invert;
    if (!matchCase) sKey = sKey.toLowerCase();
    if (!matchAccent && typeof sKey.replaceSpecialCharacters === 'function') {
        sKey = sKey.replaceSpecialCharacters();
    }
    while (tree.items.length > 0) { tree.remove(tree.items[0]); }
    progressBar.maxvalue = compArray.length;
    progressBar.value = 0;
    for (var i = 0; i < compArray.length; i++) {
        try {
            var comp = compArray[i];
            var compName = limitNameSize(comp.name, 45);
            var compItem = tree.add('node', compName);
            if (typeof compTogIcon !== 'undefined') {
                compItem.image = compTogIcon.light;
            }
            compItem.comp = comp;
            for (var l = 1; l <= comp.numLayers; l++) {
                var txtLayer = comp.layer(l);
                if (!(txtLayer instanceof TextLayer)) continue;
                if (vis && !txtLayer.enabled) continue;
                var matchResult = false;
                var doc = txtLayer.property('ADBE Text Properties').property('ADBE Text Document');
                var refTime = comp.duration < 1 ? 0 : txtLayer.inPoint + (txtLayer.outPoint - txtLayer.inPoint) / 2;
                var layerName = '#' + txtLayer.index + '  ' + limitNameSize(txtLayer.name, 35);
                if (refTime > comp.duration) refTime = comp.duration - comp.frameDuration;
                if (doc.expression !== '') comp.time = refTime;
                var sTxt = getTextLayerContent(txtLayer);
                if (doc.value.allCaps) sTxt = sTxt.toUpperCase();
                if (!matchCase) sTxt = sTxt.toLowerCase();
                if (!matchAccent && typeof sTxt.replaceSpecialCharacters === 'function') {
                    sTxt = sTxt.replaceSpecialCharacters();
                }
                if (sTxt.match(sKey)) matchResult = true;
                if (matchResult !== invert) continue;
                var txtItem = compItem.add('item', layerName);
                txtItem.comp = comp;
                txtItem.refTime = comp.time;
                txtItem.txtLayer = txtLayer;
                if (doc.numKeys > 0) {
                    compItem.remove(txtItem);
                    for (var k = 1; k <= doc.numKeys; k++) {
                        comp.time = doc.keyTime(k);
                        sTxt = getTextLayerContent(txtLayer);
                        if (doc.value.allCaps) sTxt = sTxt.toUpperCase();
                        if (!matchCase) sTxt = sTxt.toLowerCase();
                        if (!matchAccent && typeof sTxt.replaceSpecialCharacters === 'function') {
                            sTxt = sTxt.replaceSpecialCharacters();
                        }
                        if (sTxt.match(sKey)) matchResult = true;
                        if (matchResult !== invert) continue;
                        var txtItemTimed = compItem.add('item', layerName);
                        txtItemTimed.comp = comp;
                        txtItemTimed.refTime = comp.time;
                        txtItemTimed.txtLayer = txtLayer;
                    }
                }
            }
            progressBar.value++;
        } catch (err) {
            alert(lol + '#FND_019 - comp: ' + comp.name + '\n' + err.message);
        }
    }
    cleanHierarchy(tree);
}

function expandNodes(nodeTree) {
    var count = 0;
    if (!nodeTree || !nodeTree.items) { return count; }
    var branches = nodeTree.items;
    nodeTree.expanded = true;
    for (var i = 0; i < branches.length; i++) {
        if (branches[i].type === 'node') count += expandNodes(branches[i]);
        count++;
    }
    return count;
}

function findItem(nodeTree, list, searchTxt) {
    if (!nodeTree || !nodeTree.items) { return list || []; }
    var resultList = list || [];
    var branches = nodeTree.items;
    for (var i = 0; i < branches.length; i++) {
        if (branches[i].type === 'node') { findItem(branches[i], resultList, searchTxt); }
        var text = branches[i].text || '';
        if (typeof text.replaceSpecialCharacters === 'function') {
            text = text.replaceSpecialCharacters();
        }
        if (text.trim().toUpperCase().match(searchTxt)) {
            resultList.push(branches[i]);
        }
    }
    return resultList;
}

// Mantida apenas para compatibilidade.
function flattenData(dataArray) {
    var flatList = [];
    if (!(dataArray instanceof Array)) { return flatList; }
    var nodesToProcess = dataArray.slice(0);
    while (nodesToProcess.length > 0) {
        var node = nodesToProcess.pop();
        if (!node) { continue; }
        if (node.type === 'item') {
            flatList.push(node);
        } else if (node.type === 'node' && node.children) {
            for (var i = node.children.length - 1; i >= 0; i--) {
                nodesToProcess.push(node.children[i]);
            }
        }
    }
    return flatList.reverse();
}
