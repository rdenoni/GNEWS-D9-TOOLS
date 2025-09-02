/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// --- NOVA FUNÇÃO OTIMIZADA E CORRIGIDA PARA LER A ESTRUTURA DE PASTAS ---
/**
 * Scaneia recursivamente uma pasta e retorna uma estrutura de dados para o TreeView.
 * - Pastas são listadas primeiro, depois arquivos, ambos em ordem alfabética.
 * - Ignora pastas "Adobe After Effects Auto-Save".
 * - Lida silenciosamente com pastas inacessíveis.
 * - Inclui tamanho e data de modificação para arquivos.
 * @param {Folder} rootFolder A pasta raiz para iniciar o escaneamento.
 * @param {Array} fileFilter Uma lista de extensões de arquivo permitidas (ex: ['.aep', '.aet']).
 * @returns {Array} Uma matriz de objetos representando a estrutura de arquivos e pastas.
 */
function getFolderStructureAsData(rootFolder, fileFilter) {
    if (!rootFolder.exists) return [];
    var allItems;
    try {
        allItems = rootFolder.getFiles();
        if (allItems === null) return []; // Lida com pastas inacessíveis/vazias
    } catch (e) {
        return []; // Falha silenciosa para pastas sem permissão
    }

    var folders = [];
    var files = [];

    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        if (item instanceof Folder) {
            // Requisito: Ignorar pastas de Auto-Save
            if (item.displayName === "Adobe After Effects Auto-Save") {
                continue;
            }
            var subItems = getFolderStructureAsData(item, fileFilter);
            if (subItems.length > 0) {
                folders.push({
                    type: 'node',
                    text: item.displayName,
                    items: subItems
                });
            }
        } else if (item instanceof File) {
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
                    // --- CORREÇÃO APLICADA AQUI ---
                    // Armazena o caminho do arquivo como string (texto) em vez de um objeto.
                    file: item.fsName,
                    size: item.length, // Requisito: tamanho do arquivo
                    modDate: item.modified.toUTCString() // Requisito: data de modificação
                });
            }
        }
    }

    // Requisito: Ordenar pastas e arquivos alfabeticamente
    folders.sort(function(a, b) { return a.text.localeCompare(b.text); });
    files.sort(function(a, b) { return a.text.localeCompare(b.text); });

    // Requisito: Pastas primeiro, depois arquivos
    return folders.concat(files);
}


function d9ProdFoldersDialog() {
    var scriptName = 'CONFIGURAÇÃO DE CAMINHOS';
    
    // --- ALTERADO: Aponta para a nova pasta de cache centralizada ---
    var cacheFolder = new Folder(scriptMainPath + 'source/cache');
    if (!cacheFolder.exists) cacheFolder.create();
    var fileFilter = ['.aep', '.aet'];

    var categorias = [
        { nome: 'PEÇAS GRÁFICAS', key: 'pecasGraficas', caminhos: [] },
        { nome: 'BASE TEMÁTICA', key: 'baseTematica', caminhos: [] },
        { nome: 'ILUSTRAÇÕES', key: 'ilustracoes', caminhos: [] }
    ];
    
    try {
        if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray.length > 0) {
            var prodData = D9T_prodArray[0];
            categorias[0].caminhos = prodData.pecasGraficas || [prodData.templatesPath || Folder.desktop.fullName];
            categorias[1].caminhos = prodData.baseTematica || [Folder.desktop.fullName];
            categorias[2].caminhos = prodData.ilustracoes || [Folder.desktop.fullName];
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
        
        // --- LÓGICA DE GERAR CACHE TOTALMENTE REFEITA ---
        testBtn.onClick = function() {
            var pathStr = pathLab.properties.pathValue;
            alert("Iniciando teste e criação de cache para:\n" + pathStr + "\n\nSe o After Effects travar, este caminho está inacessível. Será necessário forçar o encerramento.");
            
            var folder = new Folder(pathStr);
            if (!folder.exists) {
                 setFgColor(pathLab, '#DC143C'); // Vermelho
                 alert("Falha! O caminho não existe ou está inacessível.");
                 return;
            }

            try {
                var treeData = getFolderStructureAsData(folder, fileFilter);

                var cacheFileName = categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json';
                var cacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);

                var masterCacheData = {};
                if (cacheFile.exists) {
                    try {
                        cacheFile.open('r');
                        masterCacheData = JSON.parse(cacheFile.read());
                        cacheFile.close();
                    } catch(e) { masterCacheData = {}; }
                }

                masterCacheData[pathStr] = treeData;

                cacheFile.open('w');
                cacheFile.write(JSON.stringify(masterCacheData, null, 2));
                cacheFile.close();
                
                setFgColor(pathLab, '#2E8B57'); // Verde
                alert("Sucesso! Cache para '" + categoryName + "' foi atualizado.\n" + (treeData.length > 0 ? "Encontrados arquivos compatíveis." : "Aviso: Nenhum arquivo .aep/.aet encontrado neste caminho."));

            } catch (e) {
                setFgColor(pathLab, '#DC143C'); // Vermelho
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
    
    function collectConfigData() {
        var pecasGraficas = [], baseTematica = [], ilustracoes = [];
        var allCatGrps = mainGrp.children;
        for (var c = 0; c < allCatGrps.length; c++) {
            if (allCatGrps[c] instanceof Group && allCatGrps[c].children.length > 0 && allCatGrps[c].children[0] instanceof StaticText && allCatGrps[c].children[0].text.indexOf(':') > -1) {
                var catName = allCatGrps[c].children[0].text.replace(':', '');
                var pathsGrp = allCatGrps[c+1];
                var caminhos = [];
                if (pathsGrp && pathsGrp.children) {
                    for(var i = 0; i < pathsGrp.children.length; i++){
                        caminhos.push(pathsGrp.children[i].children[1].properties.pathValue);
                    }
                }
                if (catName === 'PEÇAS GRÁFICAS') pecasGraficas = caminhos;
                else if (catName === 'BASE TEMÁTICA') baseTematica = caminhos;
                else if (catName === 'ILUSTRAÇÕES') ilustracoes = caminhos;
            }
        }
        return { name: 'Configuração de Caminhos', icon: '', templatesPath: pecasGraficas[0] || '', pecasGraficas: pecasGraficas, baseTematica: baseTematica, ilustracoes: ilustracoes };
    }
    
    D9T_CONFIG_w.show();
}