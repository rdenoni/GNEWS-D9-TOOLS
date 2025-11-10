/**********************************************************************************
 *
 * GNEWS LibraryLive Config
 *
 **********************************************************************************/

$.encoding = "UTF-8";

function launchLibraryLiveConfigWinUI() {

    // =================================================================================
    // --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
    // =================================================================================
    var JANELA_TITULO = "Configurações - LibraryLive";
    var TEXTO_BOTAO_ADD = "+ Adicionar Caminho";
    var TEXTO_BOTAO_CACHE = "Gerar Cache";
    var TEXTO_BOTAO_CANCEL = "Cancelar";
    var TEXTO_BOTAO_SAVE = "Salvar";

    // =================================================================================
    // --- FUNÇÕES AUXILIARES DE TEMA E UI ---
    // =================================================================================
    function hexToRgb(hex) { if(!hex) return [0,0,0,1]; hex = hex.replace('#', ''); return [parseInt(hex.substring(0,2), 16)/255, parseInt(hex.substring(2,4), 16)/255, parseInt(hex.substring(4,6), 16)/255, 1]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color.slice(0,3)); } catch (e) {} }
    function setFgColor(element, colorArray) { try { element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, colorArray, 1); } catch (e) {} }
    function addClickHandler(element, handler) { if (!element) return; if (element.leftClick) { element.leftClick.onClick = handler; } else { element.onClick = handler; } }

    // =================================================================================
    // --- LÓGICA DE STATUS E GERAÇÃO DE CACHE ---
    // =================================================================================
    var COLORS = { success: hexToRgb(successColor), error: hexToRgb(highlightColor1), warning: hexToRgb(warningColor), info: [0.2, 0.6, 0.9], neutral: hexToRgb(normalColor1) };
    var isCancelled = false;
    var ui = {};

    function updateStatus(message, type) {
        if (!ui.statusText) return;
        var color = COLORS[type] || COLORS.neutral;
        ui.statusText.text = message;
        setFgColor(ui.statusText, color);
    }
    
    function scanFolder(folder, category, extensionRegex) {
        var items = [];
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            if (isCancelled) break;
            var file = files[i];
            if (file instanceof File && extensionRegex.test(file.name)) {
                var modifiedDate = new Date(0);
                try { if (file.modified instanceof Date) { modifiedDate = file.modified; } } catch (e) {}
                items.push({
                    nome: decodeURI(file.name).replace(/\.[^.]+$/, "").replace(/[-_]/g, ' '),
                    fullPath: file.fsName,
                    categoria: category,
                    modified: modifiedDate,
                    size: file.length
                });
            }
        }
        return items;
    }
    
    function runCacheProcess(pathList, cacheFile, extensionRegex, assetType) {
        if (cacheFile.exists) {
            updateStatus("Cache de " + assetType + " já existe. Pulando.", "info");
            win.update();
            return;
        }
        var allItems = [];
        updateStatus("Iniciando escaneamento de " + assetType + "...", "info");
        win.update(); 
        for (var i = 0; i < pathList.length; i++) {
            if (isCancelled) break;
            var currentPath = pathList[i];
            if (currentPath && currentPath.replace(/\s/g, '') !== '') {
                var testFolder = new Folder(currentPath);
                if (testFolder.exists) {
                    updateStatus("Escaneando: " + testFolder.name, "info");
                    win.update();
                    allItems = allItems.concat(scanFolder(testFolder, "Raiz", extensionRegex));
                    var subFolders = testFolder.getFiles(function (f) { return f instanceof Folder; });
                    for (var j = 0; j < subFolders.length; j++) {
                        if (isCancelled) break;
                        updateStatus("Escaneando subpasta: " + subFolders[j].name, "info");
                        win.update();
                        allItems = allItems.concat(scanFolder(subFolders[j], subFolders[j].name, extensionRegex));
                    }
                }
            }
        }
        if (!isCancelled && allItems.length > 0) {
            try {
                updateStatus("Salvando cache de " + assetType + "...", "info");
                win.update();
                cacheFile.encoding = "UTF-8";
                cacheFile.open("w");
                cacheFile.write(allItems.toSource());
                cacheFile.close();
            } catch (e) {
                updateStatus("Erro ao salvar cache de " + assetType + ": " + e.toString(), "error");
            }
        }
    }
    
    function startCacheGeneration() {
        isCancelled = false;
        ui.generateCacheBtn.enabled = false;
        ui.okBtn.enabled = false;
        ui.cancelBtn.visible = true;
        try {
            var paths = collectPathsFromUI();
            var cacheFolder = new Folder(scriptMainPath + "/cache/");
            if (!cacheFolder.exists) cacheFolder.create();
            var iconCacheFile = new File(cacheFolder.fsName + "/libraryLive_Icons_Cache.json");
            var imageCacheFile = new File(cacheFolder.fsName + "/libraryLive_Images_Cache.json");
            runCacheProcess(paths.icon_root_paths, iconCacheFile, /\.png$/i, "Ícones");
            if (isCancelled) {
                updateStatus("Geração de cache cancelada.", "warning");
            } else {
                runCacheProcess(paths.image_root_paths, imageCacheFile, /\.(png|jpg|jpeg)$/i, "Imagens");
            }
            if (!isCancelled) {
                updateStatus("Geração de cache concluída.", "success");
            }
        } catch(e) {
            updateStatus("ERRO: " + e.toString(), "error");
        } finally {
            isCancelled = false;
            ui.generateCacheBtn.enabled = true;
            ui.okBtn.enabled = true;
            ui.cancelBtn.visible = false;
        }
    }

    // =================================================================================
    // --- LÓGICA DE CONFIGURAÇÃO CENTRALIZADA ---
    // =================================================================================
    var SYSTEM_SETTINGS_FILE = new File(scriptMainPath + '/System_Settings.json');

    function loadSystemSettings() {
        if (SYSTEM_SETTINGS_FILE.exists) {
            try {
                SYSTEM_SETTINGS_FILE.open('r');
                var content = SYSTEM_SETTINGS_FILE.read();
                SYSTEM_SETTINGS_FILE.close();
                return JSON.parse(content);
            } catch (e) {
                alert("Erro ao ler System_Settings.json:\n" + e.toString());
                return null;
            }
        }
        alert("Arquivo System_Settings.json não encontrado:\n" + SYSTEM_SETTINGS_FILE.fsName);
        return null;
    }
    
    function saveSystemSettings(settingsObject) {
        try {
            SYSTEM_SETTINGS_FILE.open('w');
            // ATUALIZADO: Salva o objeto inteiro com indentação para manter a formatação
            SYSTEM_SETTINGS_FILE.write(JSON.stringify(settingsObject, null, 2));
            SYSTEM_SETTINGS_FILE.close();
            return true;
        } catch (e) {
            alert("Erro ao salvar System_Settings.json:\n" + e.toString());
            return false;
        }
    }

    // =================================================================================
    // --- CONSTRUÇÃO DA JANELA ---
    // =================================================================================
    var systemSettings = loadSystemSettings();
    if (!systemSettings) return;

    var libraryLiveSettings = systemSettings.LIBRARYLIVE_Settings || { icon_root_paths: [""], image_root_paths: [""] };

    var win = new Window("palette", JANELA_TITULO);
    setBgColor(win, bgColor1);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 15;
    win.margins = 15;

    function addPathLine(parent, path) {
        var group = parent.add("group");
        group.orientation = "row";
        group.alignChildren = ["left", "center"];
        group.spacing = 5;
        var browseBtn = new themeIconButton(group, { icon: D9T_PASTA_ICON, tips: ["Selecionar pasta"] });
        var pathText = group.add("edittext", undefined, path || "");
        pathText.preferredSize.width = 380;
        var deleteBtn = new themeIconButton(group, { icon: D9T_FECHAR_ICON, tips: ["Remover este caminho"] });
        addClickHandler(browseBtn, function() {
            var f = Folder.selectDialog("Selecione a pasta");
            if (f) pathText.text = f.fsName;
        });
        addClickHandler(deleteBtn, function() {
            parent.remove(group);
            win.layout.layout(true);
        });
    }

    var iconsPanel = win.add("panel", undefined, "Pastas de Ícones (todas as válidas serão usadas)");
    setFgColor(iconsPanel, hexToRgb(normalColor1));
    iconsPanel.alignChildren = ["fill", "top"];
    var iconListGroup = iconsPanel.add("group");
    iconListGroup.orientation = "column";
    iconListGroup.spacing = 5;
    var addIconBtn = iconsPanel.add("button", undefined, TEXTO_BOTAO_ADD);
    addIconBtn.alignment = "right";
    addIconBtn.onClick = function() { addPathLine(iconListGroup, ""); win.layout.layout(true); };
    for (var i = 0; i < libraryLiveSettings.icon_root_paths.length; i++) {
        addPathLine(iconListGroup, libraryLiveSettings.icon_root_paths[i]);
    }
    
    var imagesPanel = win.add("panel", undefined, "Pastas de Imagens (todas as válidas serão usadas)");
    setFgColor(imagesPanel, hexToRgb(normalColor1));
    imagesPanel.alignChildren = ["fill", "top"];
    var imageListGroup = imagesPanel.add("group");
    imageListGroup.orientation = "column";
    imageListGroup.spacing = 5;
    var addImageBtn = imagesPanel.add("button", undefined, TEXTO_BOTAO_ADD);
    addImageBtn.alignment = "right";
    addImageBtn.onClick = function() { addPathLine(imageListGroup, ""); win.layout.layout(true); };
    for (var j = 0; j < libraryLiveSettings.image_root_paths.length; j++) {
        addPathLine(imageListGroup, libraryLiveSettings.image_root_paths[j]);
    }
    
    var actionBtnGroup = win.add("group");
    actionBtnGroup.orientation = "row";
    actionBtnGroup.alignment = "right";
    ui.generateCacheBtn = actionBtnGroup.add("button", undefined, TEXTO_BOTAO_CACHE);
    ui.cancelBtn = actionBtnGroup.add("button", undefined, TEXTO_BOTAO_CANCEL);
    ui.cancelBtn.visible = false;
    ui.okBtn = actionBtnGroup.add("button", undefined, TEXTO_BOTAO_SAVE);
    
    var statusPanel = win.add("panel", undefined, "Status");
    statusPanel.alignment = 'fill';
    statusPanel.margins = 10;
    ui.statusText = statusPanel.add('statictext', undefined, 'Pronto.', { truncate: 'end' });
    ui.statusText.alignment = 'fill';
    updateStatus("Pronto.", "neutral");

    function collectPathsFromUI() {
        var iconPaths = [];
        for (var i = 0; i < iconListGroup.children.length; i++) {
            var path = iconListGroup.children[i].children[1].text; 
            if (path && path.replace(/\s/g, '') !== '') iconPaths.push(path);
        }
        var imagePaths = [];
        for (var j = 0; j < imageListGroup.children.length; j++) {
            var path = imageListGroup.children[j].children[1].text;
            if (path && path.replace(/\s/g, '') !== '') imagePaths.push(path);
        }
        return { icon_root_paths: iconPaths, image_root_paths: imagePaths };
    }

    ui.okBtn.onClick = function() {
        var currentSettings = loadSystemSettings();
        if (!currentSettings) {
             updateStatus("Falha ao ler o arquivo de configuração para salvar.", "error");
             return;
        }
        
        var pathsFromUI = collectPathsFromUI();
        
        // ATUALIZADO: Garante que a chave existe antes de atribuir
        if (!currentSettings.LIBRARYLIVE_Settings) {
            currentSettings.LIBRARYLIVE_Settings = {};
        }
        
        // Modifica apenas a parte relevante do objeto de configurações
        currentSettings.LIBRARYLIVE_Settings.icon_root_paths = pathsFromUI.icon_root_paths;
        currentSettings.LIBRARYLIVE_Settings.image_root_paths = pathsFromUI.image_root_paths;
        
        if (saveSystemSettings(currentSettings)) {
            updateStatus("Configurações salvas. É necessário reabrir o LibraryLive.", "success");
            win.close();
        } else {
            updateStatus("Falha ao salvar o arquivo de configuração.", "error");
        }
    };
    
    ui.generateCacheBtn.onClick = startCacheGeneration;
    ui.cancelBtn.onClick = function() { isCancelled = true; };
    
    win.layout.layout(true);
    win.center();
    win.show();
}