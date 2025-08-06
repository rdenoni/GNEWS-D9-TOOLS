/*
=====================================================================================
GNEWS TEMPLATE LOADER - Versão Standalone
Interface melhorada com persistência de configurações
Versão: 3.1 Enhanced UI
Autor: Designer GNEWS
Data: 2025

INSTRUÇÕES:
1. Salve este arquivo com extensão .jsx
2. Execute via File > Scripts > Run Script File
3. Configure a pasta de templates (será lembrada)
4. Navegue pelos templates e duplo-click para carregar
=====================================================================================
*/

// ==================== FUNÇÕES AUXILIARES ESSENCIAIS ====================

// Remove a extensão de um nome de arquivo
function deleteFileExt(str) {
    return str.replace(/\.[0-9a-z]+$/i, '');
}

// Obtém a extensão de um nome de arquivo
function getFileExt(str) {
    var match = str.match(/\.[0-9a-z]+$/i);
    return match ? match[0].toLowerCase() : '';
}

// Substitui caracteres especiais
String.prototype.replaceSpecialCharacters = function () {
    return this.replace(/\u00C0|\u00C1|\u00C2|\u00C3|\u00C4|[ÀÁÂÃÄ]/g, 'A')
        .replace(/\u00E0|\u00E1|\u00E2|\u00E3|\u00E4|[àáâãä]/g, 'a')
        .replace(/\u00C8|\u00C9|\u00CA|\u00CB|[ÈÉÊË]/g, 'E')
        .replace(/\u00E8|\u00E9|\u00EA|\u00EB|[èéêë]/g, 'e')
        .replace(/\u00CC|\u00CD|\u00CE|\u00CF|[ÍÍîï]/g, 'I')
        .replace(/\u00EC|\u00ED|\u00EE|\u00EF|[ííîï]/g, 'i')
        .replace(/\u00D2|\u00D3|\u00D4|\u00D5|\u00D6|[ÒÓÔÕÖ]/g, 'O')
        .replace(/\u00F2|\u00F3|\u00F4|\u00F5|\u00F6|[òóôõö]/g, 'o')
        .replace(/\u00D9|\u00DA|\u00DB|\u00DC|[ÙÚÛÜ]/g, 'U')
        .replace(/\u00F9|\u00FA|\u00FB|\u00FC|[ùúûü]/g, 'u')
        .replace(/Ç|\u00C7/g, 'C')
        .replace(/ç|\u00E7/g, 'c')
        .replace(/[^\w\s]/g, ' ')
        .replace(/[\s_]+/g, ' ')
        .trim();
};

// Trim polyfill
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/gm, '');
    };
}

// ==================== GERENCIAMENTO DE PREFERÊNCIAS ====================

function loadPreferences() {
    try {
        var prefsFile = new File(Folder.userData.fullName + '/GNEWS_TemplateLoader_Prefs.json');
        if (prefsFile.exists) {
            prefsFile.open('r');
            var content = prefsFile.read();
            prefsFile.close();
            return JSON.parse(content);
        }
    } catch (e) {}
    
    // Preferências padrão
    return {
        templatesPath: '~/Desktop/GNEWS_Templates',
        windowWidth: 900,
        windowHeight: 650
    };
}

function savePreferences(prefs) {
    try {
        var prefsFile = new File(Folder.userData.fullName + '/GNEWS_TemplateLoader_Prefs.json');
        prefsFile.open('w');
        prefsFile.write(JSON.stringify(prefs, null, 2));
        prefsFile.close();
        return true;
    } catch (e) {
        return false;
    }
}

// ==================== FUNÇÕES DE ÁRVORE ====================

// Remove pastas vazias da árvore
function cleanHierarchy(nodeTree) {
    var branches = nodeTree.items;
    
    for (var i = branches.length - 1; i >= 0; i--) {
        if (branches[i].type != 'node') continue;
        
        var wasEmpty = cleanHierarchy(branches[i]);
        
        if (wasEmpty) {
            nodeTree.remove(branches[i]);
        }
    }
    
    return nodeTree.items.length == 0 && nodeTree.parent != null;
}

// Otimiza a hierarquia combinando pastas com apenas uma subpasta
function optimizeHierarchy(nodeTree) {
    var branches = nodeTree.items;
    
    for (var i = branches.length - 1; i >= 0; i--) {
        if (branches[i].type != 'node') continue;
        
        if (branches[i].items.length > 1) {
            optimizeHierarchy(branches[i]);
        } else {
            if (branches[i].items.length == 1 && branches[i].items[0].type == 'node') {
                var subfolder = branches[i].items[0];
                branches[i].text += ' / ' + subfolder.text;
                
                while (subfolder.items.length > 0) {
                    var item = subfolder.items[0];
                    try {
                        var newItem = branches[i].add(item.type, item.text);
                        newItem.file = item.file;
                        subfolder.remove(0);
                    } catch (err) {}
                }
                nodeTree.remove(subfolder);
            }
        }
    }
}

// Cria a hierarquia de arquivos e pastas
function createHierarchy(array, node, fileTypes) {
    for (var n = 0; n < array.length; n++) {
        var nodeName = array[n].displayName;
        
        if (array[n] instanceof Folder) {
            var subArray = array[n].getFiles();
            
            if (subArray.length > 0) {
                var nodeItem = node.add('node', nodeName);
                createHierarchy(subArray, nodeItem, fileTypes);
            }
        } else {
            try {
                if (fileTypes.indexOf(getFileExt(nodeName)) >= 0) {
                    var templateItem = node.add('item', nodeName);
                    templateItem.file = array[n];
                }
            } catch (err) {}
        }
    }
}

// Constrói a árvore de templates
function buildTree(folder, tree, fileTypes) {
    if (tree.items.length > 0) {
        tree.remove(tree.items[0]);
    }
    
    var folderContentArray = folder.getFiles();
    var folderNode = tree.add('node', folder.displayName);
    
    createHierarchy(folderContentArray, folderNode, fileTypes);
    cleanHierarchy(tree);
    optimizeHierarchy(tree);
}

// Encontra itens na árvore baseado no texto de busca
function findItem(nodeTree, list, searchTxt) {
    var branches = nodeTree.items;
    
    for (var i = 0; i < branches.length; i++) {
        if (branches[i].type == 'node') findItem(branches[i], list, searchTxt);
        
        if (branches[i].text
            .trim()
            .toUpperCase()
            .replaceSpecialCharacters()
            .match(searchTxt)) {
            list.push(branches[i]);
        }
    }
    
    return list;
}

// ==================== FUNÇÃO PARA ABRIR PASTA ====================

function openFolder(path) {
    try {
        var folder = new Folder(path);
        if (folder.exists) {
            folder.execute();
        }
    } catch (e) {
        alert('Erro ao abrir pasta: ' + e.message);
    }
}

// ==================== FUNÇÕES DE UI MELHORADA ====================

function createStyledButton(parent, text, width, height) {
    var btn = parent.add('button', undefined, text);
    if (width) btn.preferredSize.width = width;
    if (height) btn.preferredSize.height = height;
    btn.graphics.font = ScriptUI.newFont('Arial', 'Regular', 11);
    return btn;
}

function createStyledText(parent, text, bold) {
    var txt = parent.add('statictext', undefined, text);
    if (bold) {
        txt.graphics.font = ScriptUI.newFont('Arial', 'Bold', 12);
    } else {
        txt.graphics.font = ScriptUI.newFont('Arial', 'Regular', 11);
    }
    return txt;
}

function createInfoPanel(parent, title) {
    var panel = parent.add('panel', undefined, title);
    panel.orientation = 'column';
    panel.alignChildren = 'fill';
    panel.margins = 15;
    return panel;
}

// ==================== FUNÇÃO PRINCIPAL ====================

function d9TemplateDialog() {
    // Carregar preferências
    var prefs = loadPreferences();
    
    // Configurações
    var scriptName = 'GNEWS TEMPLATE LOADER';
    var scriptVersion = '3.1';
    var fileFilter = ['.aep', '.aet'];
    
    var templatesPath = prefs.templatesPath;
    var templatesFolder = new Folder(templatesPath);
    
    // Criar pasta se não existir
    if (!templatesFolder.exists) {
        templatesFolder.create();
    }
    
    // Variáveis para preview
    var compactWidth, extendedWidth;
    var projectFile, previewFile, configFile;
    var templateData;
    
    // ==================== JANELA PRINCIPAL MELHORADA ====================
    
    var mainWindow = new Window('dialog', scriptName + ' v' + scriptVersion);
    mainWindow.orientation = 'row';
    mainWindow.spacing = 15;
    mainWindow.margins = 20;
    mainWindow.preferredSize.width = prefs.windowWidth;
    mainWindow.preferredSize.height = prefs.windowHeight;
    
    // ==================== PAINEL ESQUERDO - NAVEGAÇÃO ====================
    
    var leftPanel = createInfoPanel(mainWindow, 'Navegação de Templates');
    leftPanel.preferredSize.width = 380;
    
    // Header com configurações
    var headerGroup = leftPanel.add('group');
    headerGroup.orientation = 'row';
    headerGroup.alignment = 'fill';
    
    var pathGroup = headerGroup.add('group');
    pathGroup.orientation = 'column';
    pathGroup.alignChildren = 'fill';
    
    createStyledText(pathGroup, 'Pasta atual:', true);
    var pathLabel = createStyledText(pathGroup, decodeURI(templatesFolder.fullName));
    pathLabel.characters = 45;
    pathLabel.helpTip = decodeURI(templatesFolder.fullName);
    
    var configBtn = createStyledButton(headerGroup, 'Configurar', 80, 30);
    configBtn.alignment = 'right';
    
    // Busca melhorada
    var searchGroup = leftPanel.add('group');
    searchGroup.orientation = 'row';
    searchGroup.alignment = 'fill';
    searchGroup.spacing = 8;
    
    createStyledText(searchGroup, 'Buscar:');
    var searchBox = searchGroup.add('edittext');
    searchBox.alignment = 'fill';
    searchBox.preferredSize.width = 280;
    searchBox.helpTip = 'Digite para buscar templates em tempo real';
    
    // Árvore de templates com scroll
    var treeGroup = leftPanel.add('group');
    treeGroup.orientation = 'column';
    treeGroup.alignment = 'fill';
    
    var templateTree = treeGroup.add('treeview');
    templateTree.alignment = 'fill';
    templateTree.preferredSize.height = 400;
    buildTree(templatesFolder, templateTree, fileFilter);
    
    // Botões de ação
    var buttonGroup = leftPanel.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignment = 'center';
    buttonGroup.spacing = 10;
    
    var refreshBtn = createStyledButton(buttonGroup, '🔄 Atualizar', 90, 35);
    var openFolderBtn = createStyledButton(buttonGroup, '📁 Abrir', 90, 35);
    
    // Status
    var statusGroup = leftPanel.add('group');
    statusGroup.alignment = 'fill';
    var statusText = createStyledText(statusGroup, 'Selecione um template para ver detalhes');
    statusText.alignment = 'center';
    
    // ==================== PAINEL DIREITO - PREVIEW E INFORMAÇÕES ====================
    
    var rightPanel = createInfoPanel(mainWindow, 'Preview e Informações');
    rightPanel.preferredSize.width = 480;
    rightPanel.visible = false;
    
    // Preview maior
    var previewGroup = rightPanel.add('group');
    previewGroup.orientation = 'column';
    previewGroup.alignChildren = 'center';
    
    createStyledText(previewGroup, 'Preview:', true);
    
    var previewContainer = previewGroup.add('group');
    previewContainer.orientation = 'stack';
    previewContainer.alignment = 'center';
    
    var previewImg = previewContainer.add('image');
    previewImg.preferredSize.width = 440;
    previewImg.preferredSize.height = 280;
    
    var noPreviewPanel = previewContainer.add('panel');
    noPreviewPanel.preferredSize.width = 440;
    noPreviewPanel.preferredSize.height = 280;
    noPreviewPanel.alignment = 'fill';
    
    var noPreviewGroup = noPreviewPanel.add('group');
    noPreviewGroup.orientation = 'column';
    noPreviewGroup.alignment = 'center';
    noPreviewGroup.spacing = 10;
    
    var noPreviewIcon = createStyledText(noPreviewGroup, '🖼️');
    noPreviewIcon.graphics.font = ScriptUI.newFont('Arial', 'Regular', 48);
    var noPreviewText = createStyledText(noPreviewGroup, 'Nenhum preview disponível');
    
    // Informações do template (não selecionável)
    var infoGroup = rightPanel.add('group');
    infoGroup.orientation = 'column';
    infoGroup.alignment = 'fill';
    infoGroup.spacing = 10;
    
    createStyledText(infoGroup, 'Informações do Template:', true);
    
    // Container com scroll para as informações
    var infoPanel = infoGroup.add('panel');
    infoPanel.alignment = 'fill';
    infoPanel.preferredSize.height = 200;
    infoPanel.margins = 10;
    
    var infoText = infoPanel.add('statictext', undefined, 'Selecione um template para ver as informações', {multiline: true});
    infoText.alignment = 'fill';
    infoText.graphics.font = ScriptUI.newFont('Arial', 'Regular', 10);
    
    // ==================== EVENTOS DA INTERFACE ====================
    
    var selectedTemplate = null;
    
    // Configuração inicial da janela
    mainWindow.onShow = function () {
        previewImg.visible = false;
        noPreviewPanel.visible = true;
        
        templateTree.expanded = true;
        var branches = templateTree.items;
        for (var i = 0; i < branches.length; i++) {
            if (branches[i].type == 'node') branches[i].expanded = true;
        }
        
        extendedWidth = prefs.windowWidth;
        compactWidth = 420;
        
        rightPanel.visible = false;
        mainWindow.preferredSize.width = compactWidth;
        
        searchBox.active = true;
    };
    
    // Salvar preferências ao fechar
    mainWindow.onClose = function () {
        prefs.templatesPath = templatesPath;
        prefs.windowWidth = mainWindow.size.width;
        prefs.windowHeight = mainWindow.size.height;
        savePreferences(prefs);
    };
    
    // Busca em tempo real
    searchBox.onChanging = function () {
        if (this.text.trim() == '') {
            buildTree(templatesFolder, templateTree, fileFilter);
            templateTree.expanded = true;
            var branches = templateTree.items;
            for (var i = 0; i < branches.length; i++) {
                if (branches[i].type == 'node') branches[i].expanded = true;
            }
            statusText.text = 'Mostrando todos os templates';
            return;
        }
        
        var searchText = this.text.trim().toUpperCase().replaceSpecialCharacters();
        
        buildTree(templatesFolder, templateTree, fileFilter);
        
        var items = findItem(templateTree, [], searchText);
        
        if (items.length == 0) {
            statusText.text = 'Nenhum template encontrado para: "' + this.text + '"';
            return;
        }
        
        statusText.text = 'Encontrados ' + items.length + ' template(s)';
        
        for (var n = 0; n < items.length; n++) {
            var s = items[n];
            
            if (s.type == 'node') s.expanded = true;
            
            while (s.parent && s.parent.constructor.name != 'TreeView') {
                s.parent.expanded = true;
                s = s.parent;
            }
        }
    };
    
    // Seleção na árvore
    templateTree.onChange = function () {
        if (this.selection != null && this.selection.type == 'node') this.selection = null;
        
        if (this.selection == null) {
            rightPanel.visible = false;
            mainWindow.preferredSize.width = compactWidth;
            selectedTemplate = null;
            statusText.text = 'Selecione um template para ver detalhes';
            return;
        }
        
        selectedTemplate = this.selection;
        projectFile = this.selection.file;
        
        var templateBase = projectFile.path + '/' + deleteFileExt(projectFile.displayName);
        
        previewFile = new File(templateBase + '_preview.png');
        configFile = new File(templateBase + '_config.json');
        
        // Atualizar preview
        if (previewFile.exists) {
            try {
                previewImg.image = previewFile;
                previewImg.visible = true;
                noPreviewPanel.visible = false;
            } catch (e) {
                previewImg.visible = false;
                noPreviewPanel.visible = true;
            }
        } else {
            previewImg.visible = false;
            noPreviewPanel.visible = true;
        }
        
        // Atualizar informações
        var infoContent = [];
        infoContent.push('📄 ARQUIVO: ' + decodeURI(projectFile.name));
        infoContent.push('📁 LOCALIZAÇÃO: ' + decodeURI(projectFile.path));
        
        try {
            var fileStats = 'Tamanho: ' + Math.round(projectFile.length / 1024) + ' KB';
            if (projectFile.modified) {
                fileStats += '\nModificado: ' + projectFile.modified.toLocaleDateString();
            }
            infoContent.push('📊 DETALHES: ' + fileStats);
        } catch (e) {}
        
        // Ler configurações se existir
        if (configFile.exists) {
            try {
                configFile.open('r');
                var JSONContent = configFile.read();
                configFile.close();
                
                templateData = JSON.parse(JSONContent);
                
                if (templateData.configName) {
                    infoContent.push('🏷️ NOME: ' + templateData.configName);
                }
                
                if (templateData.tip) {
                    infoContent.push('💡 INSTRUÇÕES: ' + templateData.tip);
                }
                
                if (templateData.exemple) {
                    infoContent.push('📝 EXEMPLO: ' + templateData.exemple);
                }
                
                if (templateData.compName) {
                    infoContent.push('🎬 COMPOSIÇÃO: ' + templateData.compName);
                }
                
            } catch (jsonErr) {
                infoContent.push('⚠️ CONFIGURAÇÃO: Arquivo de configuração encontrado mas não pôde ser lido');
            }
        } else {
            infoContent.push('ℹ️ TIPO: Template simples (sem configurações especiais)');
            infoContent.push('💡 INSTRUÇÕES: Duplo-click ou use o botão "Importar" para carregar no projeto');
        }
        
        infoText.text = infoContent.join('\n\n');
        
        rightPanel.visible = true;
        mainWindow.preferredSize.width = extendedWidth;
        statusText.text = 'Template selecionado: ' + decodeURI(projectFile.name);
    };
    
    // Duplo-click para importar
    templateTree.onDoubleClick = function () {
        importTemplate();
    };
    
    // Função de importar template
    function importTemplate() {
        try {
            if (!selectedTemplate || !projectFile || !projectFile.exists) {
                alert('⚠️ Template não encontrado ou inválido!');
                return;
            }
            
            var IO = new ImportOptions(projectFile);
            app.project.importFile(IO);
            
            alert('✅ Template importado com sucesso!\n\n📄 ' + decodeURI(projectFile.name));
            mainWindow.close();
            
        } catch (err) {
            alert('❌ Erro ao importar template:\n\n' + err.message);
        }
    }
    
    // Eventos dos botões
    configBtn.onClick = function () {
        var folder = Folder.selectDialog('Selecione a pasta de templates:', templatesPath);
        if (folder) {
            templatesPath = folder.fullName;
            templatesFolder = folder;
            pathLabel.text = decodeURI(folder.fullName);
            pathLabel.helpTip = decodeURI(folder.fullName);
            
            buildTree(templatesFolder, templateTree, fileFilter);
            
            templateTree.expanded = true;
            var branches = templateTree.items;
            for (var i = 0; i < branches.length; i++) {
                if (branches[i].type == 'node') branches[i].expanded = true;
            }
            
            statusText.text = 'Pasta de templates atualizada';
        }
    };
    
    refreshBtn.onClick = function () {
        buildTree(templatesFolder, templateTree, fileFilter);
        
        templateTree.expanded = true;
        var branches = templateTree.items;
        for (var i = 0; i < branches.length; i++) {
            if (branches[i].type == 'node') branches[i].expanded = true;
        }
        
        statusText.text = 'Lista de templates atualizada';
    };
    
    openFolderBtn.onClick = function () {
        if (!templatesFolder.exists) {
            templatesFolder.create();
        }
        openFolder(templatesPath);
    };
    
    // Exibir janela
    mainWindow.show();
}

// ==================== INICIALIZAÇÃO ====================

function main() {
    try {
        if (!(app instanceof Application) || !app.project) {
            alert('❌ Este script deve ser executado no Adobe After Effects!');
            return;
        }
        
        d9TemplateDialog();
        
    } catch (e) {
        alert('💥 Erro fatal:\n\n' + e.message);
    }
}

// Executar
main();