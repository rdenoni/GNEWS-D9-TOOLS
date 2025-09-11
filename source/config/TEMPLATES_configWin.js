$.encoding = "UTF-8";

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function createStatusWindow(title) {
    var win = new Window("palette", title, undefined, { closeButton: false });
    win.orientation = "column"; win.alignChildren = "fill"; win.preferredSize.width = 350;
    var statusLabel = win.add("statictext", undefined, "Iniciando...");
    statusLabel.characters = 50;
    var progressLabel = win.add("statictext", undefined, "0 arquivos processados");
    progressLabel.characters = 50; progressLabel.alignment = "center";
    win.update = function(statusText, count) {
        if (statusText) statusLabel.text = statusText;
        if (count !== undefined) progressLabel.text = count + " arquivos processados";
        win.layout.layout(true);
        if (win.visible) win.update();
    };
    return win;
}

function countItemsInTree(nodes) {
    var count = 0; if (!nodes) return 0;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'item') { count++; } 
        else if (nodes[i].type === 'node' && nodes[i].children) { count += countItemsInTree(nodes[i].children); }
    }
    return count;
}

function getFolderStructureAsData(rootFolder, fileFilter, categoryName, progress) {
    if (!rootFolder.exists) return [];
    var allItems = null;
    try { allItems = rootFolder.getFiles(); } catch (e) { writeLn("Aviso: Não foi possível ler o conteúdo da pasta (verifique permissões): " + decodeURI(rootFolder.fsName)); return []; }
    if (allItems === null) { writeLn("Aviso: O conteúdo da pasta retornou nulo (pode estar vazia ou inacessível): " + decodeURI(rootFolder.fsName)); return []; }
    var folders = []; var files = [];
    var jornaisExclusions = [ 'ICONES', 'ILUSTRACOES', 'FOTOS PARA ABERTURAS', 'BAGUNCA ALHEIA', '_OLD', 'BACKUP', 'VERSOES ANTERIORES', 'PARA_SCRIPT', '_PREVIEWS', '_BASES_TEMATICAS', 'TESTE', 'REFERENCIAS', 'OLD' ];
    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        if (item instanceof Folder) {
            var upperCaseDisplayName = item.displayName.toUpperCase();
            if (upperCaseDisplayName === "ADOBE AFTER EFFECTS AUTO-SAVE" || upperCaseDisplayName.slice(-4) === '_AME') continue;
            if (categoryName === 'JORNAIS' && jornaisExclusions.indexOf(upperCaseDisplayName) > -1) continue;
            
            if (progress && progress.win) {
                progress.win.update("Escaneando: " + item.displayName, progress.count);
            }
            
            var subItems = getFolderStructureAsData(item, fileFilter, categoryName, progress);
            if (subItems.length > 0) { folders.push({ type: 'node', text: item.displayName, children: subItems }); }
        } else if (item instanceof File) {
            if (item.displayName.toLowerCase().indexOf("auto-save") > -1 || item.displayName.slice(0, 7) === 'tmpAEto') continue;
            var fileExt = item.name.substr(item.name.lastIndexOf('.')).toLowerCase();
            if (fileFilter.indexOf(fileExt) > -1) {
                files.push({ type: 'item', text: item.displayName, filePath: item.fsName, size: item.length, modDate: item.modified.toUTCString() });
                if (progress) {
                    progress.count++;
                    if (progress.win && progress.count % 20 === 0) {
                        progress.win.update("Escaneando: " + rootFolder.displayName, progress.count);
                    }
                }
            }
        }
    }
    folders.sort(function(a, b) { return a.text.localeCompare(b.text); });
    files.sort(function(a, b) { return a.text.localeCompare(b.text); });
    return folders.concat(files);
}

function d9ProdFoldersDialog(prodArray) {
    var scriptName = 'CONFIGURAÇÃO DE CAMINHOS';
    var cacheFolder = new Folder(scriptMainPath + 'source/cache');
    if (!cacheFolder.exists) cacheFolder.create();
    var fileFilter = ['.aep', '.aet'];
    
    var categorias = [
        { nome: 'JORNAIS',       key: 'jornais',       caminhos: [] }, 
        { nome: 'PROMO',         key: 'promo',         caminhos: [] },
        { nome: 'PROGRAMAS',     key: 'programas',     caminhos: [] }, 
        { nome: 'EVENTOS',       key: 'eventos',       caminhos: [] },
        { nome: 'MARKETING',     key: 'marketing',     caminhos: [] }, 
        { nome: 'BASE TEMÁTICA', key: 'basetematica',  caminhos: [] },
        // CORREÇÃO: Chave padronizada para "ilustracoes" sem acentos.
        { nome: 'ILUSTRAÇÕES',   key: 'ilustracoes',   caminhos: [] }
    ];

    try {
        if (typeof prodArray !== 'undefined' && prodArray.length > 0 && prodArray[0]) {
            var prodData = prodArray[0];
            for (var i = 0; i < categorias.length; i++) {
                var cat = categorias[i];
                if (cat.key === 'jornais' && prodData['pecasGraficas']) {
                     cat.caminhos = prodData['pecasGraficas'] || [Folder.desktop.fullName];
                } else if (prodData[cat.key] && prodData[cat.key].length > 0) {
                    cat.caminhos = prodData[cat.key];
                } else {
                    cat.caminhos = [Folder.desktop.fullName];
                }
            }
        } else { throw new Error("Dados de produção inválidos"); }
    } catch (e) {
        var desktopPath = Folder.desktop.fullName;
        for (var j = 0; j < categorias.length; j++) { categorias[j].caminhos = [desktopPath]; }
    }
    var D9T_CONFIG_w = new Window('dialog', scriptName + ' v1.1'); // Versão incrementada
    D9T_CONFIG_w.orientation = 'column'; D9T_CONFIG_w.alignChildren = ['center', 'top']; D9T_CONFIG_w.spacing = 12; D9T_CONFIG_w.margins = 16;
    var headerGrp = D9T_CONFIG_w.add('group');
    headerGrp.alignment = 'fill'; headerGrp.orientation = 'row';
    var listLabTxt = headerGrp.add('statictext', undefined, 'CONFIGURAÇÃO DE CAMINHOS:');
    try { setFgColor(listLabTxt, normalColor1); } catch (e) {}
    var mainGrp = D9T_CONFIG_w.add('group', undefined);
    mainGrp.orientation = 'column'; mainGrp.spacing = 16;
    var pathLabsToCheck = [];

    function getCacheFileName(categoryName) {
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
    function checkPathValidity(pathStr) {
        var folder = new Folder(pathStr);
        return folder.exists;
    }

    for (var c = 0; c < categorias.length; c++) {
        var categoria = categorias[c];
        var newDiv;
        try { newDiv = themeDivider(mainGrp); newDiv.alignment = ['fill', 'center']; } catch (e) { newDiv = mainGrp.add('panel'); newDiv.alignment = ['fill', 'center']; newDiv.preferredSize.height = 1; }
        var catHeaderGrp = mainGrp.add('group', undefined);
        catHeaderGrp.alignment = ['fill', 'center']; catHeaderGrp.spacing = 8;
        var catLab = catHeaderGrp.add('statictext', undefined, categoria.nome + ':');
        catLab.preferredSize.width = 150;
        try { setFgColor(catLab, normalColor1); } catch (e) {}
        var catAddBtn;
        try { catAddBtn = new themeIconButton(catHeaderGrp, { icon: D9T_MAIS_ICON, tips: [lClick + 'adicionar caminho'] }); } catch (e) { catAddBtn = catHeaderGrp.add('button', undefined, '+'); catAddBtn.preferredSize = [24, 24]; catAddBtn.helpTip = 'adicionar caminho'; }
        var catPathsGrp = mainGrp.add('group', undefined);
        catPathsGrp.orientation = 'column'; catPathsGrp.alignChildren = 'fill'; catPathsGrp.spacing = 4; catPathsGrp.margins = [20, 0, 0, 0];
        (function(grp, cat) {
            cat.uiGroup = grp;
            for (var p = 0; p < cat.caminhos.length; p++) {
                addPathLine(grp, cat.caminhos[p], cat.nome);
            }
            function setupButtonClick(btn, func) { if (btn.leftClick) { btn.leftClick.onClick = func; } else { btn.onClick = func; } }
            setupButtonClick(catAddBtn, function() {
                addPathLine(grp, Folder.desktop.fullName, cat.nome);
                D9T_CONFIG_w.layout.layout(true);
            });
        })(catPathsGrp, categoria);
    }
    
    function movePath(pathLineGrp, direction) {
        var parent = pathLineGrp.parent;
        var children = [];
        for (var i = 0; i < parent.children.length; i++) { children.push(parent.children[i]); }
        var index = -1;
        for (var j = 0; j < children.length; j++) { if (children[j] === pathLineGrp) { index = j; break; } }
        if (index === -1) return;
        if (direction === 'up' && index > 0) {
            var temp = children[index];
            children[index] = children[index - 1];
            children[index - 1] = temp;
        } else if (direction === 'down' && index < children.length - 1) {
            var temp = children[index];
            children[index] = children[index + 1];
            children[index + 1] = temp;
        } else { return; }
        while (parent.children.length > 0) { parent.remove(parent.children[0]); }
        for (var k = 0; k < children.length; k++) { parent.add(children[k]); }
        parent.layout.layout(true);
    }
    
    function addPathLine(parentGrp, pathTxt, categoryName) {
        var pathLineGrp = parentGrp.add('group', undefined);
        pathLineGrp.orientation = 'row'; pathLineGrp.alignChildren = ['left', 'center']; pathLineGrp.spacing = 4;
        var openBtn;
        try { openBtn = new themeIconButton(pathLineGrp, { icon: D9T_PASTA_ICON, tips: [lClick + 'selecionar pasta'] }); } catch (e) { openBtn = pathLineGrp.add('button', undefined, '📁'); openBtn.preferredSize = [24, 24]; openBtn.helpTip = 'selecionar pasta'; }
        var pathLab = pathLineGrp.add('statictext', undefined, pathTxt, { pathValue: pathTxt, truncate: 'middle' });
        pathLab.helpTip = 'caminho da pasta:\n\n' + pathTxt;
        pathLab.preferredSize = [350, 24];
        try { setFgColor(pathLab, normalColor2); } catch (e) {}
        pathLabsToCheck.push(pathLab);
        var upBtn = pathLineGrp.add('button', undefined, '▲'); upBtn.preferredSize = [24, 24]; upBtn.helpTip = "Mover para cima";
        var downBtn = pathLineGrp.add('button', undefined, '▼'); downBtn.preferredSize = [24, 24]; downBtn.helpTip = "Mover para baixo";
        var testBtn = pathLineGrp.add('button', undefined, '✓'); testBtn.preferredSize = [24, 24]; testBtn.helpTip = "Testar caminho";
        var cacheBtn = pathLineGrp.add('button', undefined, '☁'); cacheBtn.preferredSize = [24, 24]; cacheBtn.helpTip = "Gerar Cache";
        var deletePathBtn;
        try { deletePathBtn = new themeIconButton(pathLineGrp, { icon: D9T_FECHAR_ICON, tips: [lClick + 'deletar caminho'] }); } catch (e) { deletePathBtn = pathLineGrp.add('button', undefined, 'X'); deletePathBtn.preferredSize = [24, 24]; deletePathBtn.helpTip = 'deletar caminho'; }
        function setupButtonClick(btn, func) { if (btn.leftClick) { btn.leftClick.onClick = func; } else { btn.onClick = func; } }
        setupButtonClick(openBtn, function () {
            var newFolder = Folder.selectDialog('selecione a pasta');
            if (newFolder) {
                pathLab.properties.pathValue = newFolder.fullName;
                pathLab.text = newFolder.fullName;
                pathLab.helpTip = newFolder.fullName;
                try { setFgColor(pathLab, 'red'); } catch(e){}
            }
        });
        upBtn.onClick = function() { movePath(pathLineGrp, 'up'); };
        downBtn.onClick = function() { movePath(pathLineGrp, 'down'); };
        testBtn.onClick = function() {
            var isValid = checkPathValidity(pathLab.properties.pathValue);
            setFgColor(pathLab, isValid ? normalColor2 : 'red');
            alert(isValid ? "Caminho válido e acessível." : "Caminho inválido ou inacessível.");
        };
        cacheBtn.onClick = function() {
            var pathStr = pathLab.properties.pathValue;
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                 setFgColor(pathLab, 'red');
                 alert("Falha! O caminho não existe ou está inacessível.");
                 return;
            }
            var statusWin = createStatusWindow("Gerando Cache...");
            statusWin.show();
            statusWin.update("Iniciando escaneamento...");
            var progress = { count: 0, win: statusWin };
            try {
                var treeData = getFolderStructureAsData(folder, fileFilter, categoryName, progress);
                var newCount = progress.count;
                statusWin.update("Salvando arquivo de cache...", newCount);
                var cacheFileName = getCacheFileName(categoryName);
                var cacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);
                var masterCacheData = {};
                if (cacheFile.exists) {
                    try { cacheFile.open('r'); var content = cacheFile.read(); if(content) masterCacheData = JSON.parse(content); cacheFile.close(); } catch(e) { masterCacheData = {}; }
                }
                if (masterCacheData === null || typeof masterCacheData !== 'object') { masterCacheData = {}; }
                masterCacheData[pathStr] = treeData;
                cacheFile.open('w'); cacheFile.write(JSON.stringify(masterCacheData, null, 2)); cacheFile.close();
                setFgColor(pathLab, '#2E8B57');
                alert("Sucesso! Cache para '" + categoryName + "' foi atualizado.\n\n" + newCount + " arquivos encontrados.");
            } catch (e) {
                setFgColor(pathLab, 'red');
                alert("Erro crítico ao gerar o cache:\n" + e.message);
            } finally {
                statusWin.close();
            }
        };
        setupButtonClick(deletePathBtn, function () {
            if (parentGrp.children.length > 1) {
                parentGrp.remove(pathLineGrp);
                D9T_CONFIG_w.layout.layout(true);
            } else { alert('Cada categoria deve ter pelo menos um caminho.'); }
        });
    }
    var BtnGrp = D9T_CONFIG_w.add('group', undefined);
    BtnGrp.orientation = 'stack'; BtnGrp.alignment = 'fill'; BtnGrp.margins = [0, 32, 0, 0];
    var bGrp1 = BtnGrp.add('group'); bGrp1.alignment = 'left';
    var bGrp2 = BtnGrp.add('group'); bGrp2.alignment = 'right';
    function createButton(parent, config) { var btn; try { btn = new themeButton(parent, config); } catch (e) { btn = parent.add('button', undefined, config.labelTxt); btn.preferredSize = [config.width, config.height]; btn.helpTip = config.tips[0] || ''; } return btn; }
    var importBtn = createButton(bGrp1, { width: 80, height: 32, labelTxt: 'importar', tips: ['importar configuração'] });
    var exportBtn = createButton(bGrp1, { width: 80, height: 32, labelTxt: 'exportar', tips: ['exportar configuração'] });
    var saveBtn = createButton(bGrp2, { width: 120, height: 32, labelTxt: 'salvar', tips: ['salvar configuração'] });
    try { setBgColor(D9T_CONFIG_w, bgColor1); } catch (e) {}
    D9T_CONFIG_w.onShow = function() {
        for (var i = 0; i < pathLabsToCheck.length; i++) {
            var pathLab = pathLabsToCheck[i];
            var isValid = checkPathValidity(pathLab.properties.pathValue);
            setFgColor(pathLab, isValid ? normalColor2 : 'red');
        }
    };
    function setupButtonClick(btn, func) { if (btn.leftClick) { btn.leftClick.onClick = func; } else { btn.onClick = func; } }
    function saveProdData(dataToSave) {
        var configFile = new File(scriptMainPath + 'source/config/TEMPLATES_config.json');
        try {
            configFile.encoding = "UTF-8"; configFile.open('w');
            var configContainer = { "PRODUCTIONS": [dataToSave] };
            configFile.write(JSON.stringify(configContainer, null, 2));
            configFile.close();
            return true;
        } catch (e) { alert("Erro ao salvar o arquivo de configuração:\n" + e.message); return false; }
    }
    function repopulateUI(configData) {
        pathLabsToCheck = [];
        for (var i = 0; i < categorias.length; i++) {
            var cat = categorias[i];
            var paths = configData[cat.key] || [];
            while (cat.uiGroup.children.length > 0) { cat.uiGroup.remove(cat.uiGroup.children[0]); }
            for (var p = 0; p < paths.length; p++) { addPathLine(cat.uiGroup, paths[p], cat.nome); }
        }
        D9T_CONFIG_w.layout.layout(true);
        D9T_CONFIG_w.onShow();
    }
    setupButtonClick(saveBtn, function () {
        try {
            var configData = collectConfigData();
            if (saveProdData(configData)) {
                 if (typeof D9T_prodArray !== 'undefined') { D9T_prodArray = [configData]; }
                alert('Configuração salva com sucesso!\n\nUse o botão "Atualizar" (🔄) na janela de Templates para aplicar as mudanças.');
                D9T_CONFIG_w.close();
            }
        } catch (err) { alert('Erro ao coletar dados para salvar: ' + err.message); }
    });
    setupButtonClick(exportBtn, function() {
        var configData = collectConfigData();
        var saveFile = File.saveDialog("Salvar configuração como...", "D9T_Templates_Config_*.json");
        if (saveFile) {
            try {
                saveFile.encoding = "UTF-8"; saveFile.open('w'); saveFile.write(JSON.stringify(configData, null, 2)); saveFile.close();
                alert("Configuração exportada com sucesso para:\n" + decodeURI(saveFile.fsName));
            } catch (e) { alert("Erro ao exportar o arquivo:\n" + e.message); }
        }
    });
    setupButtonClick(importBtn, function() {
        var configFile = File.openDialog("Selecione um arquivo de configuração (.json)", "*.json");
        if (configFile) {
            try {
                configFile.encoding = "UTF-8"; configFile.open('r'); var content = configFile.read(); configFile.close();
                if (!content) { alert("Erro: O arquivo de configuração está vazio."); return; }
                var rawData = JSON.parse(content);
                var importedData = rawData;
                if (rawData.PRODUCTIONS && rawData.PRODUCTIONS[0]) {
                    importedData = rawData.PRODUCTIONS[0];
                }
                repopulateUI(importedData);
                alert("Configuração importada com sucesso!");
            } catch (e) { alert("Erro ao importar o arquivo de configuração:\n" + e.message); }
        }
    });
    function collectConfigData() {
        var configOutput = {};
        for (var i = 0; i < categorias.length; i++) {
            var cat = categorias[i];
            var caminhos = [];
            if (cat.uiGroup && cat.uiGroup.children) {
                for(var j = 0; j < cat.uiGroup.children.length; j++){
                    caminhos.push(cat.uiGroup.children[j].children[1].properties.pathValue);
                }
            }
            configOutput[cat.key] = caminhos;
        }
        configOutput.name = 'Configuração GNEWS';
        configOutput.templatesPath = configOutput.jornais && configOutput.jornais.length > 0 ? configOutput.jornais[0] : '';
        return configOutput;
    }
    D9T_CONFIG_w.center();
    D9T_CONFIG_w.show();
}