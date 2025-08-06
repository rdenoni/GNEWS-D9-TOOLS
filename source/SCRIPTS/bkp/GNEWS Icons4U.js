/********************************************************************************
 * Icon Browser v4.1 - Smart Path
 *
 * Autor: Gemini AI
 * Data: 30 de Julho de 2025
 *
 * MUDANÇAS (v4.1):
 * - NOVO (Principal): Lógica de detecção automática de caminhos. O script agora
 * tenta encontrar seus próprios arquivos de configuração e assets com base em sua
 * localização, eliminando a necessidade de configuração manual em ambientes
 * de pipeline conhecidos.
 * - NOVO: Seção de configuração no topo do script para ajustar facilmente
 * os caminhos relativos da detecção automática.
 ********************************************************************************/

(function() {

    // =================================================================================
    // 1. CONFIGURAÇÕES GLOBAIS E DE DETECÇÃO AUTOMÁTICA
    // =================================================================================

    // --- AJUSTE AQUI SE A SUA ESTRUTURA DE PASTAS FOR DIFERENTE ---
    var AUTO_DETECT_CONFIG = {
        jsonRelativePath: "../config/icons_config.json",
        iconsRelativePath: "../assets/icons" // Assumi esta pasta, ajuste se necessário
    };
    // ----------------------------------------------------------------

    var SCRIPT_INFO = { name: "Icon Browser", version: "4.1 SmartPath", settingsFile: "IconBrowser_v4_Settings.json" };
    var UI_CONFIG = { thumbSize: { min: 60, max: 150, defaultValue: 90 }, colors: { background: [0.18, 0.18, 0.18, 1], selection: [0.3, 0.5, 0.8, 1] } };
    var SUPPORTED_EXTENSIONS = /\.(png|jpg|jpeg|svg|ai|eps)$/i;
    var State = { settings: null, allIcons: [], filteredIcons: [], currentPage: 0, totalPages: 0, iconsPerPage: 15, selectedIconData: null, selectedSlot: null };
    var UI = { elements: {}, gridSlots: [] };

    // =================================================================================
    // 2. LÓGICA DA APLICAÇÃO (COM AUTO-DETECT)
    // =================================================================================
    var Logic = {
        
        autoDetectPaths: function() {
            try {
                UI.logMessage("Tentando detectar configuração automaticamente...");
                var scriptFile = new File($.fileName);
                var jsonFile = new File(scriptFile.path + "/" + AUTO_DETECT_CONFIG.jsonRelativePath);
                var iconFolder = new Folder(scriptFile.path + "/" + AUTO_DETECT_CONFIG.iconsRelativePath);

                if (jsonFile.exists && iconFolder.exists) {
                    State.settings = {
                        metadataPath: jsonFile.fsName,
                        iconRootPath: iconFolder.fsName
                    };
                    UI.logMessage("Sucesso! Configuração de pipeline encontrada.", false);
                    return true;
                }
            } catch(e) { /* Falha silenciosa, irá para o próximo método */ }
            UI.logMessage("Detecção automática falhou. Procurando por configurações salvas...", true);
            return false;
        },

        loadSettingsFromFile: function() {
            var settingsFile = new File(Folder.userData.fsName + "/" + SCRIPT_INFO.settingsFile);
            if (!settingsFile.exists) return false;
            try {
                settingsFile.open("r");
                var content = settingsFile.read();
                settingsFile.close();
                State.settings = eval('(' + content + ')');
                if (State.settings && State.settings.metadataPath) {
                    State.thumbWidth = State.settings.thumbWidth || UI_CONFIG.thumbSize.defaultValue;
                    UI.logMessage("Configurações do usuário carregadas.", false);
                    return true;
                }
            } catch (e) { UI.logMessage("Arquivo de configurações do usuário corrompido.", true); }
            return false;
        },

        saveSessionSettings: function() { /* ...código inalterado... */ if (!State.settings) return; try { var sessionState = { iconRootPath: State.settings.iconRootPath, metadataPath: State.settings.metadataPath, thumbWidth: State.thumbWidth, lastSearch: UI.elements.searchBox.text, lastCategory: UI.elements.categoryTree.selection ? UI.elements.categoryTree.selection.text : "Todas" }; var settingsFile = new File(Folder.userData.fsName + "/" + SCRIPT_INFO.settingsFile); settingsFile.open("w"); settingsFile.write(this.stringify(sessionState)); settingsFile.close(); } catch (e) { UI.logMessage("Falha ao salvar a sessão: " + e.toString(), true); } },
        loadDatabase: function() { /* ...código inalterado... */ State.allIcons = []; try { var metadataFile = new File(State.settings.metadataPath); if (!metadataFile.exists) throw new Error("Arquivo de metadados não encontrado em: " + State.settings.metadataPath); metadataFile.open("r"); var content = metadataFile.read(); metadataFile.close(); var rawData = eval('(' + content + ')'); if (Object.prototype.toString.call(rawData) !== '[object Array]') throw new Error("JSON não é uma lista (array)."); for (var i = 0; i < rawData.length; i++) { var icon = rawData[i]; if (icon && typeof icon === 'object' && typeof icon.nome === 'string' && icon.nome.trim() !== "" && typeof icon.arquivo === 'string' && icon.arquivo.trim() !== "") { icon.categoria = (typeof icon.categoria === 'string' && icon.categoria.trim() !== "") ? icon.categoria : "Sem Categoria"; icon.tags = (Object.prototype.toString.call(icon.tags) === '[object Array]') ? icon.tags : []; State.allIcons.push(icon); } else { UI.logMessage("Item inválido no índice [" + i + "] do JSON. Pulando.", true); } } UI.logMessage(State.allIcons.length + " ícones carregados com sucesso."); UI.populateCategoryTree(); this.applyFilters(); } catch (e) { UI.logMessage("Erro fatal ao carregar o banco de dados: " + e.toString(), true); } },
        generateJson: function() { /* ...código inalterado... */ try { if (!State.settings) throw new Error("Configure os caminhos primeiro."); if (!confirm("Isso irá substituir seu arquivo JSON atual com base nos arquivos da pasta. Deseja continuar?")) return; var iconFolder = new Folder(State.settings.iconRootPath); var files = iconFolder.getFiles(); var iconList = []; for (var i = 0; i < files.length; i++) { var file = files[i]; if (file instanceof File && file.name.match(SUPPORTED_EXTENSIONS)) { var nameWithoutExt = decodeURI(file.name).replace(SUPPORTED_EXTENSIONS, ''); iconList.push({ nome: nameWithoutExt.replace(/[-_]/g, ' '), arquivo: file.name, categoria: "Sem Categoria", tags: [] }); } } if (iconList.length === 0) throw new Error("Nenhum arquivo de imagem compatível encontrado."); var jsonString = this.stringify(iconList, true); var metadataFile = new File(State.settings.metadataPath); metadataFile.encoding = "UTF-8"; metadataFile.open("w"); metadataFile.write(jsonString); metadataFile.close(); UI.logMessage(iconList.length + " ícones escritos no JSON.", false); alert(iconList.length + " ícones adicionados ao seu arquivo JSON!"); this.loadDatabase(); } catch (e) { UI.logMessage("Erro ao gerar JSON: " + e.toString(), true); alert("Erro ao gerar JSON: " + e.toString()); } },
        applyFilters: function() { /* ...código inalterado... */ var searchTerm = UI.elements.searchBox.text.toLowerCase(); var selectedCategory = UI.elements.categoryTree.selection ? UI.elements.categoryTree.selection.text : "Todas"; State.filteredIcons = []; for (var i = 0; i < State.allIcons.length; i++) { var icon = State.allIcons[i]; var categoryMatch = (selectedCategory === "Todas" || icon.categoria === selectedCategory); if (!categoryMatch) continue; if (searchTerm === "" || icon.nome.toLowerCase().indexOf(searchTerm) > -1 || icon.tags.join(' ').toLowerCase().indexOf(searchTerm) > -1) { State.filteredIcons.push(icon); } } State.currentPage = 0; UI.renderGrid(); },
        importSelectedIcon: function() { /* ...código inalterado... */ if (!State.selectedIconData) return; try { if (!app.project) throw new Error("Nenhum projeto aberto."); app.beginUndoGroup("Importar Ícone: " + State.selectedIconData.nome); var iconFile = new File(State.settings.iconRootPath + "/" + State.selectedIconData.arquivo); if (!iconFile.exists) throw new Error("Arquivo não encontrado: " + iconFile.fsName); var importOptions = new ImportOptions(); importOptions.file = iconFile; importOptions.sequence = false; if (/\.(ai|eps|svg)$/i.test(iconFile.name)) { importOptions.importAs = ImportAsType.COMPOSITION; } var importedItem = app.project.importFile(importOptions); if (importedItem) { importedItem.name = State.selectedIconData.nome; UI.logMessage("Ícone '" + State.selectedIconData.nome + "' importado.", false); } else { throw new Error("a importação falhou."); } app.endUndoGroup(); } catch (e) { UI.logMessage("Falha ao importar: " + e.toString(), true); if(app.undoInProgress) app.endUndoGroup(); } },
        stringify: function(obj, pretty) { var indent=pretty?"  ":""; var pad=pretty?"\n":""; function s(v,l) { var i=Array(l+1).join(indent),n=Array(l+2).join(indent); if(v===null)return"null"; if(typeof v !=='object'){return(typeof v==='string')?'"'+v.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"':String(v);} if(Object.prototype.toString.call(v)==='[object Array]'){var b=pad;for(var j=0;j<v.length;j++){b+=n+s(v[j],l+1)+(j<v.length-1?','+pad:'');}return'['+b+(b.length>0?pad+i:'')+']';} var b=pad,k=[]; for(var key in v){if(v.hasOwnProperty(key))k.push(key);} for(var j=0;j<k.length;j++){b+=n+'"'+k[j]+'": '+s(v[k[j]],l+1)+(j<k.length-1?','+pad:'');} return'{'+b+(b.length>0?pad+i:'')+'}';} return s(obj,0); }
    };

    // =================================================================================
    // 3. INTERFACE DO USUÁRIO (UI)
    // =================================================================================
    var UI = {
        elements: {}, gridSlots: [],
        build: function() { /* ...código inalterado... */ var win = new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: true }); this.win = win; win.orientation = "row"; win.alignChildren = ["left", "top"]; win.margins = 10; win.spacing = 10; var leftPanel = win.add("group"); leftPanel.orientation = "column"; leftPanel.alignChildren = ["fill", "top"]; leftPanel.preferredSize.width = 200; var searchGroup = leftPanel.add("panel", undefined, "Busca"); searchGroup.alignChildren = "fill"; this.elements.searchBox = searchGroup.add("edittext", undefined, ""); var categoryGroup = leftPanel.add("panel", undefined, "Categorias"); categoryGroup.alignChildren = "fill"; this.elements.categoryTree = categoryGroup.add("treeview", [0,0,180,150], ["Todas"]); this.elements.categoryTree.selection = this.elements.categoryTree.items[0]; var viewGroup = leftPanel.add("panel", undefined, "Visualização"); viewGroup.alignChildren = "fill"; var sizeSliderGroup = viewGroup.add("group"); sizeSliderGroup.add("statictext", undefined, "Tamanho:"); this.elements.sizeSlider = sizeSliderGroup.add("slider", undefined, Config.UI.thumbSize.default, Config.UI.thumbSize.min, Config.UI.thumbSize.max); var actionsGroup = leftPanel.add("panel", undefined, "Ações"); actionsGroup.alignChildren = "fill"; this.elements.refreshBtn = actionsGroup.add("button", undefined, "Atualizar Biblioteca ↺"); this.elements.generateJsonBtn = actionsGroup.add("button", undefined, "Gerar JSON da Pasta..."); this.elements.settingsBtn = actionsGroup.add("button", undefined, "Configurar Manualmente..."); var logGroup = leftPanel.add("panel", undefined, "Log de Eventos"); logGroup.alignChildren = "fill"; logGroup.alignment = ["fill", "fill"]; this.elements.logArea = logGroup.add("edittext", undefined, "", { multiline: true, readonly: true }); this.elements.logArea.alignment = ["fill", "fill"]; var centerPanel = win.add("group"); centerPanel.orientation = "column"; centerPanel.alignChildren = ["fill", "top"]; centerPanel.alignment = ["fill", "fill"]; this.elements.gridPanel = centerPanel.add("panel"); this.elements.gridPanel.alignChildren = "fill"; this.elements.gridPanel.alignment = ["fill", "fill"]; var paginationGroup = centerPanel.add("group"); paginationGroup.alignment = "center"; this.elements.prevBtn = paginationGroup.add("button", undefined, "<"); this.elements.pageInfo = paginationGroup.add("statictext", undefined, "0 ícones"); this.elements.nextBtn = paginationGroup.add("button", undefined, ">"); var rightPanel = win.add("panel", undefined, "Detalhes"); rightPanel.preferredSize.width = 250; rightPanel.alignChildren = "fill"; this.elements.detailsPanel = rightPanel; this.elements.previewImage = rightPanel.add("image", undefined); this.elements.previewImage.preferredSize = [220, 220]; this.elements.nameText = rightPanel.add("statictext", undefined, "Nome do Ícone", { font: "bold" }); this.elements.detailsText = rightPanel.add("statictext", undefined, "Selecione um ícone...", { multiline: true }); this.elements.detailsText.preferredSize.height = 80; this.elements.importBtn = rightPanel.add("button", undefined, "Importar Ícone"); this.elements.detailsPanel.visible = false; },
        createGridSlots: function() { /* ...código inalterado... */ if (this.elements.gridContent) { this.elements.gridPanel.remove(this.elements.gridContent); } this.gridSlots = []; var panelWidth = this.elements.gridPanel.size.width - 20; if (panelWidth <= 0) panelWidth = 500; var cols = Math.max(1, Math.floor(panelWidth / (State.thumbWidth + 20))); var rows = 4; State.iconsPerPage = cols * rows; var gridContent = this.elements.gridPanel.add("group"); gridContent.orientation = "row"; this.elements.gridContent = gridContent; var columns = []; for (var c = 0; c < cols; c++) { columns[c] = gridContent.add('group'); columns[c].orientation = 'column'; } for (var i = 0; i < State.iconsPerPage; i++) { var slot = columns[i % cols].add("group", undefined, { name: "slot" }); slot.orientation = "column"; slot.spacing = 4; slot.margins = 5; var thumbSize = [State.thumbWidth, State.thumbWidth]; slot.preferredSize = [thumbSize[0] + 10, thumbSize[1] + 30]; slot.graphics.backgroundColor = slot.graphics.newBrush(slot.graphics.BrushType.SOLID_COLOR, Config.UI.colors.background); slot.thumb = slot.add("image", undefined, undefined, {name: "thumb"}); slot.thumb.preferredSize = thumbSize; slot.label = slot.add("statictext", undefined, "Nome", { name: "label", truncate: "end" }); slot.label.alignment = "center"; var selectionHandler = function() { UI.updateDetailsPanel(this.parent.iconData, this.parent); }; var importHandler = function() { Logic.importSelectedIcon(); }; slot.thumb.onClick = selectionHandler; slot.label.onClick = selectionHandler; slot.thumb.onDoubleClick = importHandler; slot.label.onDoubleClick = importHandler; this.gridSlots.push(slot); } this.win.layout.layout(true); },
        renderGrid: function() { /* ...código inalterado... */ State.totalPages = Math.ceil(State.filteredIcons.length / State.iconsPerPage); var startIndex = State.currentPage * State.iconsPerPage; for (var i = 0; i < this.gridSlots.length; i++) { var slot = this.gridSlots[i]; var iconIndex = startIndex + i; if (iconIndex < State.filteredIcons.length) { var icon = State.filteredIcons[iconIndex]; slot.iconData = icon; slot.visible = true; var thumbFile = new File(State.settings.iconRootPath + "/" + icon.arquivo); slot.thumb.image = thumbFile.exists ? thumbFile : null; slot.label.text = icon.nome; } else { slot.visible = false; slot.iconData = null; } } this.updatePaginationUI(); this.highlightSelection(null); },
        updateDetailsPanel: function(iconData, slot) { /* ...código inalterado... */ State.selectedIconData = iconData; this.highlightSelection(slot); if (iconData) { this.elements.detailsPanel.visible = true; var previewFile = new File(State.settings.iconRootPath + "/" + iconData.arquivo); this.elements.previewImage.image = previewFile.exists ? previewFile : null; this.elements.nameText.text = iconData.nome; this.elements.detailsText.text = "Arquivo: " + iconData.arquivo + "\nCategoria: " + iconData.categoria + "\nTags: " + iconData.tags.join(", "); this.elements.importBtn.enabled = true; } else { this.elements.detailsPanel.visible = false; this.elements.importBtn.enabled = false; } },
        highlightSelection: function(selectedSlot) { /* ...código inalterado... */ if (State.selectedSlot) { State.selectedSlot.graphics.backgroundColor = State.selectedSlot.graphics.newBrush(State.selectedSlot.graphics.BrushType.SOLID_COLOR, Config.UI.colors.background); } if (selectedSlot) { selectedSlot.graphics.backgroundColor = selectedSlot.graphics.newBrush(State.selectedSlot.graphics.BrushType.SOLID_COLOR, Config.UI.colors.selection); } State.selectedSlot = selectedSlot; this.win.layout.layout(true); },
        updatePaginationUI: function() { /* ...código inalterado... */ var total = State.filteredIcons.length; var pageInfoText = total + (total === 1 ? " ícone" : " ícones"); if (State.totalPages > 1) { pageInfoText += " | Pág " + (State.currentPage + 1) + "/" + State.totalPages; } this.elements.pageInfo.text = pageInfoText; this.elements.prevBtn.enabled = (State.currentPage > 0); this.elements.nextBtn.enabled = (State.currentPage < State.totalPages - 1); },
        populateCategoryTree: function() { /* ...código inalterado... */ var cats = {"Todas": true}; for(var i=0; i < State.allIcons.length; i++) cats[State.allIcons[i].categoria] = true; this.elements.categoryTree.removeAll(); var allNode = this.elements.categoryTree.add('item', 'Todas'); for(var c in cats) if(c !== "Todas") this.elements.categoryTree.add('item', c); this.elements.categoryTree.selection = allNode; if(State.settings && State.settings.lastCategory) for(var j=0; j<this.elements.categoryTree.items.length; j++) if(this.elements.categoryTree.items[j].text === State.settings.lastCategory) this.elements.categoryTree.selection = j; },
        logMessage: function(message, isError) { /* ...código inalterado... */ var time = new Date().toTimeString().substr(0, 8); this.elements.logArea.text = time + " " + (isError ? "[ERRO] " : "[INFO] ") + message + "\n" + this.elements.logArea.text; },
        assignEventHandlers: function() {
            this.win.onClose = function() { Logic.saveSessionSettings(); };
            this.elements.searchBox.onChanging = function() { Logic.applyFilters(); };
            this.elements.categoryTree.onChange = function() { Logic.applyFilters(); };
            this.elements.refreshBtn.onClick = function() { Logic.loadDatabase(); };
            this.elements.generateJsonBtn.onClick = function() { Logic.generateJson(); };
            this.elements.sizeSlider.onChange = function() { State.thumbWidth = this.value; UI.createGridSlots(); UI.renderGrid(); };
            this.elements.prevBtn.onClick = function() { if (State.currentPage > 0) { State.currentPage--; UI.renderGrid(); } };
            this.elements.nextBtn.onClick = function() { if (State.currentPage < State.totalPages - 1) { State.currentPage++; UI.renderGrid(); } };
            this.elements.importBtn.onClick = function() { Logic.importSelectedIcon(); };
            this.elements.settingsBtn.onClick = function() {
                alert("Você irá selecionar duas coisas:\n\n1. A PASTA que contém seus arquivos de ícone.\n2. O local e nome do seu arquivo de metadados (.json).", "Configuração Manual");
                var iconRoot = Folder.selectDialog("1. Selecione a pasta com seus arquivos de ícone");
                if (!iconRoot) return;
                var metadataFile = File.saveDialog("2. Escolha onde salvar seu arquivo de metadados", "JSON:*.json");
                if (!metadataFile) return;
                
                State.settings = { iconRootPath: iconRoot.fsName, metadataPath: metadataFile.fsName };
                Logic.saveSessionSettings(); // Salva a nova configuração manual
                Logic.loadDatabase();
            };
        }
    };


    // =================================================================================
    // 4. INICIALIZAÇÃO DA APLICAÇÃO
    // =================================================================================
    var App = {
        run: function() {
            UI.build();
            UI.assignEventHandlers();
            
            UI.win.onShow = function() {
                app.setTimeout(function() {
                    if (Logic.autoDetectPaths() || Logic.loadSettingsFromFile()) {
                        UI.createGridSlots();
                        Logic.loadDatabase();
                         // Restaura a última busca/categoria
                        if (State.settings.lastSearch) UI.elements.searchBox.text = State.settings.lastSearch;
                        UI.populateCategoryTree(); // Popula e TENTA restaurar a categoria
                        Logic.applyFilters();
                    } else {
                        UI.logMessage("Por favor, configure os caminhos manualmente.", false);
                    }
                }, 100);
            };
            UI.win.show();
        }
    };

    App.run();

})();