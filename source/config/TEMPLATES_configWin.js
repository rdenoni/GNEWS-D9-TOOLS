/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

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

// ALTERAÇÃO: A função agora aceita 'categoryName' para aplicar regras específicas.
function getFolderStructureAsData(rootFolder, fileFilter, categoryName) {
    if (!rootFolder.exists) return [];
    var allItems;
    try {
        allItems = rootFolder.getFiles();
        if (allItems === null) return [];
    } catch (e) {
        return [];
    }

    var folders = [];
    var files = [];

    // ALTERAÇÃO: Lista de pastas a serem ignoradas especificamente para JORNAIS.
    var jornaisExclusions = [
        'Icones', 'Ilustracoes', 'Fotos para aberturas', 'BAGUNCA ALHEIA',
        '_OLD', 'backup', 'versoes anteriores', 'PARA_SCRIPT', '_PREVIEWS'
    ];

    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        if (item instanceof Folder) {
            // Regra Geral: Ignorar pastas de Auto-Save e _AME.
            if (item.displayName === "Adobe After Effects Auto-Save" || item.displayName.slice(-4).toUpperCase() === '_AME') {
                continue;
            }

            // ALTERAÇÃO: Aplicar regras de exclusão específicas para a categoria 'JORNAIS'.
            if (categoryName === 'JORNAIS') {
                var isExcluded = false;
                for (var ex = 0; ex < jornaisExclusions.length; ex++) {
                    if (item.displayName === jornaisExclusions[ex]) {
                        isExcluded = true;
                        break;
                    }
                }
                if (isExcluded) {
                    continue; // Pula para o próximo item se a pasta estiver na lista de exclusão.
                }
            }
            
            // ALTERAÇÃO: Passa 'categoryName' na chamada recursiva.
            var subItems = getFolderStructureAsData(item, fileFilter, categoryName);
            if (subItems.length > 0) {
                folders.push({
                    type: 'node',
                    text: item.displayName,
                    children: subItems
                });
            }
        } else if (item instanceof File) {
            if (item.displayName.toLowerCase().indexOf("auto-save") > -1 || item.displayName.slice(0, 7) === 'tmpAEto') {
                continue;
            }
            var fileExt = item.name.substr(item.name.lastIndexOf('.')).toLowerCase();
            var isAllowed = false;
            for (var j = 0; j < fileFilter.length; j++) {
                if (fileExt === fileFilter[j]) {
                    isAllowed = true;
                    break;
                }
            }
            if (isAllowed) {
                files.push({
                    type: 'item',
                    text: item.displayName,
                    filePath: item.fsName,
                    size: item.length,
                    modDate: item.modified.toUTCString()
                });
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

    // ALTERAÇÃO: Atualização da lista de categorias para corresponder à janela principal.
    var categorias = [
        { nome: 'JORNAIS', key: 'jornais', caminhos: [] },
        { nome: 'PROMO', key: 'promo', caminhos: [] },
        { nome: 'PROGRAMAS', key: 'programas', caminhos: [] },
        { nome: 'EVENTOS', key: 'eventos', caminhos: [] },
        { nome: 'MARKETING', key: 'marketing', caminhos: [] },
        { nome: 'BASE TEMÁTICA', key: 'baseTematica', caminhos: [] },
        { nome: 'ILUSTRAÇÕES', key: 'ilustracoes', caminhos: [] }
    ];
    
    try {
        if (typeof prodArray !== 'undefined' && prodArray.length > 0) {
            var prodData = prodArray[0];
            // Mapeia os caminhos salvos para as categorias corretas.
            for (var i = 0; i < categorias.length; i++) {
                var catKey = categorias[i].key;
                // Renomeia a chave antiga 'pecasGraficas' para 'jornais' para manter compatibilidade.
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
        var pathLineGrp = parentGrp.add('group', undefined);
        pathLineGrp.orientation = 'row';
        pathLineGrp.alignChildren = ['left', 'center'];
        pathLineGrp.spacing = 4;
        
        var openBtn;
        try { openBtn = new themeIconButton(pathLineGrp, { icon: D9T_PASTA_ICON, tips: [lClick + 'selecionar pasta'] }); } catch (e) { openBtn = pathLineGrp.add('button', undefined, '📁'); openBtn.preferredSize = [24, 24]; openBtn.helpTip = 'selecionar pasta'; }
        
        var pathLab = pathLineGrp.add('statictext', undefined, pathTxt, { pathValue: pathTxt, truncate: 'middle' });
        pathLab.helpTip = 'caminho da pasta:\n\n' + pathTxt;
        pathLab.preferredSize = [350, 24];
        try { setCtrlHighlight(pathLab, normalColor2, highlightColor1); } catch (e) {}
        
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
                try { setFgColor(pathLab, normalColor2); } catch(e){}
            }
        });
        
        testBtn.onClick = function() {
            var pathStr = pathLab.properties.pathValue;
            alert("Iniciando teste e criação de cache para:\n" + pathStr);
            
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                 setFgColor(pathLab, '#DC143C');
                 alert("Falha! O caminho não existe ou está inacessível.");
                 return;
            }

            try {
                // ALTERAÇÃO: Passa o nome da categoria para a função de geração de cache.
                var treeData = getFolderStructureAsData(folder, fileFilter, categoryName);
                var newCount = countItemsInTree(treeData);

                var cacheFileName;
                // ALTERAÇÃO: Nomes dos arquivos de cache atualizados para as novas categorias.
                switch (categoryName) {
                    case 'JORNAIS':
                        cacheFileName = 'templates_jornais_cache.json'; // Nome antigo 'pecas' atualizado
                        break;
                    case 'PROMO':
                        cacheFileName = 'templates_promo_cache.json';
                        break;
                    case 'PROGRAMAS':
                        cacheFileName = 'templates_programas_cache.json';
                        break;
                    case 'EVENTOS':
                        cacheFileName = 'templates_eventos_cache.json';
                        break;
                    case 'MARKETING':
                        cacheFileName = 'templates_marketing_cache.json';
                        break;
                    case 'BASE TEMÁTICA':
                        cacheFileName = 'templates_base_cache.json';
                        break;
                    case 'ILUSTRAÇÕES':
                        cacheFileName = 'templates_ilustra_cache.json';
                        break;
                    default:
                        cacheFileName = 'templates_' + categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json';
                        break;
                }
                
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

                masterCacheData[pathStr] = treeData;

                cacheFile.open('w');
                cacheFile.write(JSON.stringify(masterCacheData, null, 2));
                cacheFile.close();
                
                setFgColor(pathLab, '#2E8B57');
                var feedbackMsg = "Sucesso! Cache para '" + categoryName + "' foi atualizado.\n\n" +
                                  "Total de " + newCount + " arquivos encontrados neste caminho.\n" +
                                  "(Contagem anterior: " + oldCount + " arquivos)";
                alert(feedbackMsg);

            } catch (e) {
                setFgColor(pathLab, '#DC143C');
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
    
    setupButtonClick(saveBtn, function () {
        try {
            var configData = collectConfigData();
            if (typeof saveProdData === 'function') {
                saveProdData([configData]);
            }
            if (typeof D9T_prodArray !== 'undefined') {
                D9T_prodArray = [configData];
            }
            alert('Configuração salva com sucesso!\n\nUse o botão "Atualizar" (🔄) na janela de Templates para recarregar do cache.');
            D9T_CONFIG_w.close();
        } catch (err) { alert('Erro ao salvar: ' + err.message); }
    });
    
    // ALTERAÇÃO: Função atualizada para coletar os dados das novas categorias.
    function collectConfigData() {
        var configOutput = {};
        var allCatGrps = mainGrp.children;

        for (var c = 0; c < allCatGrps.length; c++) {
            // Verifica se o grupo é um cabeçalho de categoria.
            if (allCatGrps[c] instanceof Group && allCatGrps[c].children.length > 0 && allCatGrps[c].children[0] instanceof StaticText && allCatGrps[c].children[0].text.indexOf(':') > -1) {
                var catName = allCatGrps[c].children[0].text.replace(':', '');
                var pathsGrp = allCatGrps[c + 1];
                var caminhos = [];

                if (pathsGrp && pathsGrp.children) {
                    for (var i = 0; i < pathsGrp.children.length; i++) {
                        caminhos.push(pathsGrp.children[i].children[1].properties.pathValue);
                    }
                }
                
                // Encontra a chave correspondente ao nome da categoria.
                for (var k = 0; k < categorias.length; k++) {
                    if (categorias[k].nome === catName) {
                        configOutput[categorias[k].key] = caminhos;
                        break;
                    }
                }
            }
        }
        
        configOutput.name = 'Configuração de Caminhos';
        configOutput.icon = '';
        // Mantém a compatibilidade com a chave antiga 'templatesPath'.
        configOutput.templatesPath = configOutput.jornais ? configOutput.jornais[0] : '';

        return configOutput;
    }
    
    D9T_CONFIG_w.show();
}