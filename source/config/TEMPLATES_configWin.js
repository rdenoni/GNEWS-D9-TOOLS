$.encoding = "UTF-8";

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// ADIÇÃO: Função para criar e gerenciar uma janela de status de progresso.
function createStatusWindow(title) {
    var win = new Window("palette", title, undefined, { closeButton: false });
    win.orientation = "column";
    win.alignChildren = "fill";
    win.preferredSize.width = 300;
    
    var textGroup = win.add("group");
    textGroup.alignment = "center";
    var statusLabel = textGroup.add("statictext", undefined, "Iniciando...");
    statusLabel.characters = 40;

    var progressGroup = win.add("group");
    progressGroup.alignment = "center";
    var progressLabel = progressGroup.add("statictext", undefined, "0 / 0");
    progressLabel.characters = 20;

    win.update = function(statusText, currentValue, maxValue) {
        if (statusText) {
            statusLabel.text = statusText;
        }
        if (currentValue !== undefined && maxValue !== undefined) {
            progressLabel.text = currentValue + " / " + maxValue;
        }
        win.layout.layout(true);
        win.update();
    };
    
    return win;
}


function countItemsInTree(nodes) {
    var count = 0;
    if (!nodes) return 0;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type === 'item') {
            count++;
        } else if (nodes[i].type === 'node' && nodes[i].children) {
            count += countItemsInTree(nodes[i].children);
        }
    }
    return count;
}

function getFolderStructureAsData(rootFolder, fileFilter, categoryName, progress) {
    if (!rootFolder.exists) return [];
    var allItems = null;

    try {
        allItems = rootFolder.getFiles();
    } catch (e) {
        writeLn("Aviso: Não foi possível ler o conteúdo da pasta (verifique permissões): " + decodeURI(rootFolder.fsName));
        return [];
    }

    if (allItems === null) {
        writeLn("Aviso: O conteúdo da pasta retornou nulo (pode estar vazia ou inacessível): " + decodeURI(rootFolder.fsName));
        return [];
    }

    var folders = [];
    var files = [];
    var jornaisExclusions = ['Icones', 'Ilustracoes', 'Fotos para aberturas', 'BAGUNCA ALHEIA', '_OLD', 'backup', 'versoes anteriores', 'PARA_SCRIPT', '_PREVIEWS'];

    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        if (item instanceof Folder) {
            if (item.displayName === "Adobe After Effects Auto-Save" || item.displayName.slice(-4).toUpperCase() === '_AME') continue;
            if (categoryName === 'JORNAIS' && jornaisExclusions.indexOf(item.displayName) > -1) continue;
            
            var subItems = getFolderStructureAsData(item, fileFilter, categoryName, progress);
            if (subItems.length > 0) {
                folders.push({ type: 'node', text: item.displayName, children: subItems });
            }
        } else if (item instanceof File) {
            if (item.displayName.toLowerCase().indexOf("auto-save") > -1 || item.displayName.slice(0, 7) === 'tmpAEto') continue;
            
            var fileExt = item.name.substr(item.name.lastIndexOf('.')).toLowerCase();
            if (fileFilter.indexOf(fileExt) > -1) {
                files.push({ type: 'item', text: item.displayName, filePath: item.fsName, size: item.length, modDate: item.modified.toUTCString() });
                // ALTERAÇÃO: Atualiza o contador de progresso
                if (progress) {
                    progress.count++;
                    if (progress.win && progress.count % 10 === 0) { // Atualiza a cada 10 arquivos para não sobrecarregar
                        progress.win.update("Processando arquivos...", progress.count, "?");
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
        { nome: 'JORNAIS', key: 'jornais', caminhos: [] },
        { nome: 'PROMO', key: 'promo', caminhos: [] },
        { nome: 'PROGRAMAS', key: 'programas', caminhos: [] },
        { nome: 'EVENTOS', key: 'eventos', caminhos: [] },
        { nome: 'MARKETING', key: 'marketing', caminhos: [] },
        { nome: 'BASE TEMÁTICA', key: 'baseTematica', caminhos: [] },
        { nome: 'ILUSTRAÇÕES', key: 'ilustracoes', caminhos: [] }
    ];
    
    // ... (resto da função d9ProdFoldersDialog, sem alterações na lógica de carregar categorias)
    try {
        if (typeof prodArray !== 'undefined' && prodArray.length > 0) {
            var prodData = prodArray[0];
            for (var i = 0; i < categorias.length; i++) {
                var catKey = categorias[i].key;
                if (catKey === 'jornais' && prodData['pecasGraficas']) {
                     categorias[i].caminhos = prodData['pecasGraficas'];
                } else if (prodData[catKey] && prodData[catKey].length > 0) {
                    categorias[i].caminhos = prodData[catKey];
                } else {
                    categorias[i].caminhos = [Folder.desktop.fullName];
                }
            }
        } else {
            var desktopPath = Folder.desktop.fullName;
            for (var i = 0; i < categorias.length; i++) {
                categorias[i].caminhos = [desktopPath];
            }
        }
    } catch (e) {
        var desktopPath = Folder.desktop.fullName;
        for (var i = 0; i < categorias.length; i++) {
            categorias[i].caminhos = [desktopPath];
        }
    }
    
    var D9T_CONFIG_w = new Window('dialog', scriptName + (typeof scriptVersion !== 'undefined' ? ' ' + scriptVersion : ''));
    D9T_CONFIG_w.orientation = 'column';
    D9T_CONFIG_w.alignChildren = ['center', 'top'];
    D9T_CONFIG_w.spacing = 12;
    D9T_CONFIG_w.margins = 16;
    
    var headerGrp = D9T_CONFIG_w.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'row';
    
    var listLabTxt = headerGrp.add('statictext', undefined, 'CONFIGURAÇÃO DE CAMINHOS:');
    try { setFgColor(listLabTxt, normalColor1); } catch (e) {}
    
    var mainGrp = D9T_CONFIG_w.add('group', undefined);
    mainGrp.orientation = 'column';
    mainGrp.spacing = 16;

    // ADIÇÃO: Função auxiliar para obter o nome do arquivo de cache.
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

    // ADIÇÃO: Função para verificar o status de um caminho (online e com cache).
    function checkPathStatus(pathStr, categoryName) {
        var folder = new Folder(pathStr);
        if (!folder.exists) {
            return 'red'; // Pasta não existe
        }
        var cacheFile = new File(cacheFolder.fullName + '/' + getCacheFileName(categoryName));
        if (!cacheFile.exists) {
            return 'red'; // Arquivo de cache não existe
        }
        try {
            cacheFile.open('r');
            var content = cacheFile.read();
            cacheFile.close();
            var cacheData = JSON.parse(content);
            if (cacheData && cacheData.hasOwnProperty(pathStr)) {
                return '#2E8B57'; // Verde: Caminho existe no cache
            }
        } catch (e) {
            return 'red'; // Erro ao ler o cache
        }
        return 'red'; // Caminho não encontrado no cache
    }

    for (var c = 0; c < categorias.length; c++) {
        var categoria = categorias[c];
        var newDiv;
        try { newDiv = themeDivider(mainGrp); newDiv.alignment = ['fill', 'center']; } catch (e) { newDiv = mainGrp.add('panel'); newDiv.alignment = ['fill', 'center']; newDiv.preferredSize.height = 1; }
        
        var catHeaderGrp = mainGrp.add('group', undefined);
        catHeaderGrp.alignment = ['fill', 'center'];
        catHeaderGrp.spacing = 8;
        
        var catLab = catHeaderGrp.add('statictext', undefined, categoria.nome + ':');
        catLab.preferredSize.width = 150;
        try { setFgColor(catLab, normalColor1); } catch (e) {}
        
        var catAddBtn;
        try { catAddBtn = new themeIconButton(catHeaderGrp, { icon: D9T_MAIS_ICON, tips: [lClick + 'adicionar caminho'] }); } catch (e) { catAddBtn = catHeaderGrp.add('button', undefined, '+'); catAddBtn.preferredSize = [24, 24]; catAddBtn.helpTip = 'adicionar caminho'; }
        
        var catPathsGrp = mainGrp.add('group', undefined);
        catPathsGrp.orientation = 'column';
        catPathsGrp.alignChildren = 'fill';
        catPathsGrp.spacing = 4;
        catPathsGrp.margins = [20, 0, 0, 0];
        
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
    
    function addPathLine(parentGrp, pathTxt, categoryName) {
        // ... (criação dos botões da linha) ...
        var pathLineGrp = parentGrp.add('group', undefined);
        pathLineGrp.orientation = 'row';
        pathLineGrp.alignChildren = ['left', 'center'];
        pathLineGrp.spacing = 4;
        
        var openBtn;
        try { openBtn = new themeIconButton(pathLineGrp, { icon: D9T_PASTA_ICON, tips: [lClick + 'selecionar pasta'] }); } catch (e) { openBtn = pathLineGrp.add('button', undefined, '📁'); openBtn.preferredSize = [24, 24]; openBtn.helpTip = 'selecionar pasta'; }
        
        var pathLab = pathLineGrp.add('statictext', undefined, pathTxt, { pathValue: pathTxt, truncate: 'middle' });
        pathLab.helpTip = 'caminho da pasta:\n\n' + pathTxt;
        pathLab.preferredSize = [350, 24];

        // ALTERAÇÃO: Define a cor inicial do caminho com base no seu status.
        var initialColor = checkPathStatus(pathTxt, categoryName);
        try { setFgColor(pathLab, initialColor); } catch (e) {}
        
        var testBtn = pathLineGrp.add('button', undefined, 'Testar e Gerar Cache');
        testBtn.preferredSize = [120, 24];
        
        var deletePathBtn;
        try { deletePathBtn = new themeIconButton(pathLineGrp, { icon: D9T_FECHAR_ICON, tips: [lClick + 'deletar caminho'] }); } catch (e) { deletePathBtn = pathLineGrp.add('button', undefined, 'X'); deletePathBtn.preferredSize = [24, 24]; deletePathBtn.helpTip = 'deletar caminho'; }
        
        function setupButtonClick(btn, func) { if (btn.leftClick) { btn.leftClick.onClick = func; } else { btn.onClick = func; } }
        
        setupButtonClick(openBtn, function () {
            var newFolder = Folder.selectDialog('selecione a pasta');
            if (newFolder) {
                pathLab.properties.pathValue = newFolder.fullName;
                pathLab.text = newFolder.fullName;
                pathLab.helpTip = newFolder.fullName;
                // Ao mudar, a cor fica vermelha indicando que precisa gerar cache
                try { setFgColor(pathLab, 'red'); } catch(e){}
            }
        });
        
        testBtn.onClick = function() {
            var pathStr = pathLab.properties.pathValue;
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                 setFgColor(pathLab, 'red');
                 alert("Falha! O caminho não existe ou está inacessível.");
                 return;
            }

            // ALTERAÇÃO: Usa a janela de status durante a geração do cache.
            var statusWin = createStatusWindow("Gerando Cache...");
            statusWin.show();
            var progress = { count: 0, win: statusWin };

            try {
                statusWin.update("Lendo estrutura de pastas...");
                var treeData = getFolderStructureAsData(folder, fileFilter, categoryName, progress);
                var newCount = progress.count;

                statusWin.update("Salvando arquivo de cache...");
                var cacheFileName = getCacheFileName(categoryName);
                var cacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);
                var masterCacheData = {};
                var oldCount = 0;
                if (cacheFile.exists) {
                    try {
                        cacheFile.open('r');
                        masterCacheData = JSON.parse(cacheFile.read());
                        cacheFile.close();
                        if (masterCacheData[pathStr]) {
                            oldCount = countItemsInTree(masterCacheData[pathStr]);
                        }
                    } catch(e) { masterCacheData = {}; }
                }
                if (masterCacheData === null || typeof masterCacheData !== 'object') {
                    masterCacheData = {};
                }
                masterCacheData[pathStr] = treeData;
                cacheFile.open('w');
                cacheFile.write(JSON.stringify(masterCacheData, null, 2));
                cacheFile.close();
                
                statusWin.close();
                setFgColor(pathLab, '#2E8B57'); // Verde
                alert("Sucesso! Cache para '" + categoryName + "' foi atualizado.\n\n" +
                      "Total de " + newCount + " arquivos encontrados.");

            } catch (e) {
                statusWin.close();
                setFgColor(pathLab, 'red');
                alert("Erro crítico ao testar o caminho:\n" + e.message);
            }
        };
        
        setupButtonClick(deletePathBtn, function () {
            if (parentGrp.children.length > 1) {
                parentGrp.remove(pathLineGrp);
                D9T_CONFIG_w.layout.layout(true);
            } else { alert('Cada categoria deve ter pelo menos um caminho.'); }
        });
    }
    
    // ... (Resto do arquivo, incluindo botões Salvar/Importar/Exportar, permanece o mesmo)
    var BtnGrp = D9T_CONFIG_w.add('group', undefined);
    BtnGrp.orientation = 'stack';
    BtnGrp.alignment = 'fill';
    BtnGrp.margins = [0, 32, 0, 0];
    var bGrp1 = BtnGrp.add('group');
    bGrp1.alignment = 'left';
    var bGrp2 = BtnGrp.add('group');
    bGrp2.alignment = 'right';
    function createButton(parent, config) { var btn; try { btn = new themeButton(parent, config); } catch (e) { btn = parent.add('button', undefined, config.labelTxt); btn.preferredSize = [config.width, config.height]; btn.helpTip = config.tips[0] || ''; } return btn; }
    var importBtn = createButton(bGrp1, { width: 80, height: 32, labelTxt: 'importar', tips: ['importar configuração'] });
    var exportBtn = createButton(bGrp1, { width: 80, height: 32, labelTxt: 'exportar', tips: ['exportar configuração'] });
    var saveBtn = createButton(bGrp2, { width: 120, height: 32, labelTxt: 'salvar', tips: ['salvar configuração'] });
    try { setBgColor(D9T_CONFIG_w, bgColor1); } catch (e) {}
    
    function setupButtonClick(btn, func) { if (btn.leftClick) { btn.leftClick.onClick = func; } else { btn.onClick = func; } }
    
    function saveProdData(dataToSave) {
        var configFile = new File(scriptMainPath + 'source/config/TEMPLATES_config.json');
        try {
            configFile.encoding = "UTF-8";
            configFile.open('w');
            var configContainer = { "PRODUCTIONS": [dataToSave] };
            configFile.write(JSON.stringify(configContainer, null, 2));
            configFile.close();
            return true;
        } catch (e) {
            alert("Erro ao salvar o arquivo de configuração:\n" + e.message);
            return false;
        }
    }

    function repopulateUI(configData) {
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
    }
    
    setupButtonClick(saveBtn, function () {
        try {
            var configData = collectConfigData();
            if (saveProdData(configData)) {
                 if (typeof D9T_prodArray !== 'undefined') {
                    D9T_prodArray = [configData];
                }
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
                saveFile.encoding = "UTF-8";
                saveFile.open('w');
                saveFile.write(JSON.stringify(configData, null, 2));
                saveFile.close();
                alert("Configuração exportada com sucesso para:\n" + saveFile.fsName);
            } catch (e) {
                alert("Erro ao exportar o arquivo:\n" + e.message);
            }
        }
    });

    setupButtonClick(importBtn, function() {
        var configFile = File.openDialog("Selecione um arquivo de configuração (.json)", "*.json");
        if (configFile) {
            try {
                configFile.encoding = "UTF-8";
                configFile.open('r');
                var content = configFile.read();
                configFile.close();
                var importedData = JSON.parse(content);
                repopulateUI(importedData);
                alert("Configuração importada com sucesso!");
            } catch (e) {
                alert("Erro ao importar o arquivo de configuração:\n" + e.message);
            }
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
        configOutput.icon = '';
        configOutput.templatesPath = configOutput.jornais ? configOutput.jornais[0] : '';

        return configOutput;
    }
    
    D9T_CONFIG_w.show();
}