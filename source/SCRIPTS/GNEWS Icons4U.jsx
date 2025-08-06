/********************************************************************************
 * Icon Browser v5.2 - Edição de Interatividade
 *
 * Autor: Gemini AI
 * Data: 31 de Julho de 2025
 *
 * MUDANÇAS (v5.2):
 * - CORRIGIDO (CRÍTICO): Refatorada a lógica de seleção e atualização da UI
 * para garantir que os cliques e duplo-cliques funcionem de forma confiável.
 * - FOCO: Estabilidade máxima na seleção e importação de ícones.
 ********************************************************************************/

(function() {

    // --- FUNÇÃO DE AJUDA ---
    function showIcons4UHelp() {
        var TARGET_HELP_WIDTH = 400; // Largura desejada para a janela de ajuda (ajuste conforme necessário)
        var MARGIN_SIZE = 15; // Tamanho das margens internas da janela principal
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5]; // Margens para cada seção de tópico dentro da aba (top, left, bottom, right)
        var TOPIC_SPACING = 5; // Espaçamento entre o título do tópico e o texto explicativo
        var TOPIC_TITLE_INDENT = 0; // Recuo para os títulos dos tópicos (ex: "▶ NORMALIZADORES")
        var SUBTOPIC_INDENT = 25; // Recuo para os subtópicos (ex: "  - Normalizar 100%:")

        var helpWin = new Window("palette", "Ajuda - Icon Browser", undefined, { closeButton: true });
        helpWin.orientation = "column";
        helpWin.alignChildren = ["fill", "fill"];
        helpWin.spacing = 10;
        helpWin.margins = MARGIN_SIZE;
        
        helpWin.preferredSize = [TARGET_HELP_WIDTH, 500]; // Ajuste a altura se o conteúdo for muito grande

        // Define o fundo da janela como preto
        if (typeof bgColor1 !== 'undefined' && typeof setBgColor !== 'undefined') {
            setBgColor(helpWin, bgColor1);
        } else {
            helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
        }

        // Painel para Título e Descrição Principal
        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column";
        headerPanel.alignChildren = ["fill", "top"]; // O headerPanel preenche a largura
        headerPanel.alignment = ["fill", "top"];
        headerPanel.spacing = 10;
        headerPanel.margins = 15; // Margens internas do painel de cabeçalho
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - ICON BROWSER");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"]; // Título centralizado
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            setFgColor(titleText, [1, 1, 1, 1]);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Ferramenta para navegar, filtrar e importar ícones SVG/PNG/AI/EPS para o After Effects. Permite gerenciar sua biblioteca de ícones.", {multiline: true});
        mainDescText.alignment = ["center", "center"]; // **CORRIGIDO: Removido 'fill' para centralizar melhor sem cortar.**
        mainDescText.preferredSize.height = 40; // Altura para 2-3 linhas
        if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(mainDescText, normalColor1);
        } else {
            setFgColor(mainDescText, [1, 1, 1, 1]);
        }
        // Calcular a largura para o mainDescText para evitar cortes.
        // Largura disponível: Largura da janela - (margens da janela * 2) - (margens do headerPanel * 2)
        mainDescText.preferredSize.width = TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (headerPanel.margins.left + headerPanel.margins.right);


        // TabbedPanel para Tópicos
        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"];
        topicsTabPanel.margins = 15;

        var allHelpTopics = [
            {
                tabName: "Navegação",
                topics: [
                    { title: "▶ BUSCAR", text: "Digite palavras-chave para filtrar ícones por nome ou tags." },
                    { title: "▶ CATEGORIA", text: "Selecione uma categoria para refinar a busca dos ícones." },
                    { title: "▶ ATUALIZAR", text: "Recarrega a lista de ícones, útil após modificações no arquivo de metadados ou pasta de ícones." },
                    { title: "▶ GRID DE ÍCONES", text: "Exibe os ícones carregados. Clique uma vez para selecionar e ver detalhes; Dê duplo-clique para importar diretamente." }
                ]
            },
            {
                tabName: "Importação",
                topics: [
                    { title: "▶ DETALHES DO ÍCONE", text: "Mostra uma pré-visualização maior e informações do ícone selecionado no grid." },
                    { title: "▶ BOTÃO IMPORTAR", text: "Importa o ícone selecionado para o projeto ativo no After Effects." }
                ]
            },
            {
                tabName: "Configuração",
                topics: [
                    { title: "▶ GERAR JSON", text: "Escaneia a 'Pasta Raiz de Ícones' e cria (ou sobrescreve) um arquivo JSON de metadados com os nomes dos arquivos. Use com cuidado!" },
                    { title: "▶ CONFIGURAR", text: "Define o 'Caminho Raiz dos Ícones' (a pasta onde seus arquivos de imagem estão) e o 'Caminho do Arquivo de Metadados' (o arquivo JSON que armazena os dados dos ícones)." },
                    { title: "▶ LIMPAR LOG", text: "Limpa a área de mensagens na parte inferior do painel." }
                ]
            }
        ];

        for (var s = 0; s < allHelpTopics.length; s++) {
            var currentTabSection = allHelpTopics[s];
            var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
            tab.orientation = "column";
            tab.alignChildren = ["fill", "top"];
            tab.spacing = 10; // Espaçamento entre os grupos de tópicos
            tab.margins = TOPIC_SECTION_MARGINS;

            for (var i = 0; i < currentTabSection.topics.length; i++) {
                var topic = currentTabSection.topics[i];
                var topicGrp = tab.add("group");
                topicGrp.orientation = "column";
                topicGrp.alignChildren = "fill"; // Grupo do tópico preenche a largura disponível
                topicGrp.spacing = TOPIC_SPACING;
                
                topicGrp.margins.left = (topic.title.indexOf("▶") === 0) ? TOPIC_TITLE_INDENT : SUBTOPIC_INDENT;

                var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                    setFgColor(topicTitle, highlightColor1);
                } else {
                    setFgColor(topicTitle, [0.83, 0, 0.23, 1]);
                }
                // Calcular largura do título do tópico:
                // Largura total da janela - (margens da helpWin * 2) - (margens do topicsTabPanel * 2) - (margens da tab * 2) - margem esquerda do topicGrp
                var topicContentWidth = TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left;
                topicTitle.preferredSize.width = topicContentWidth;


                if(topic.text !== ""){
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    // Largura do texto explicativo (mesmo cálculo do título do tópico)
                    topicText.preferredSize.width = topicContentWidth;
                    topicText.preferredSize.height = 50; // Altura para 3 linhas de texto (11pt * ~1.2 leading * 3 linhas = ~39.6, usar 36 para tentar ser mais compacto)
                    
                    if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                        setFgColor(topicText, normalColor1);
                    } else {
                        setFgColor(topicText, [1, 1, 1, 1]);
                    }
                }
            }
        }

        // Botão de fechar
        var closeBtnGrp = helpWin.add("group");
        closeBtnGrp.alignment = "center";
        closeBtnGrp.margins = [0, 10, 0, 0];
        var closeBtn = closeBtnGrp.add("button", undefined, "Fechar");
        closeBtn.onClick = function() {
            helpWin.close();
        };

        helpWin.layout.layout(true);
        helpWin.center();
        helpWin.show();
    }

    var SCRIPT_INFO = { name: "Icon Browser", version: "5.2 Interativo", settingsFile: "IconBrowser_v5_Settings.json" };
    var UI_CONFIG = {
        grid: { columns: 5, thumbSize: 90 },
        colors: { background: [0.18, 0.18, 0.18, 1], selection: [0.3, 0.5, 0.8, 1] }
    };
    var SUPPORTED_EXTENSIONS = /\.(png|jpg|jpeg|svg|ai|eps)$/i;
    var State = { settings: null, allIcons: [], filteredIcons: [], selectedIconData: null, selectedSlot: null };
    var UI = { elements: {}, gridSlots: [] }; 

    // =================================================================================
    // 2. LÓGICA DA APLICAÇÃO
    // =================================================================================
    var Logic = {
        loadSettings: function() { var settingsFile = new File(Folder.userData.fsName + "/" + SCRIPT_INFO.settingsFile); if (!settingsFile.exists) { UI.logMessage("Bem-vindo! Por favor, configure os caminhos.", false); return false; } try { settingsFile.open("r"); var content = settingsFile.read(); settingsFile.close(); State.settings = eval('(' + content + ')'); if (State.settings && State.settings.metadataPath) { UI.logMessage("Configurações carregadas.", false); return true; } } catch (e) { UI.logMessage("Arquivo de configurações corrompido.", true); } return false; },
        saveSettings: function(newSettings) { try { if(newSettings){ State.settings = newSettings; } if (!State.settings) return; var settingsFile = new File(Folder.userData.fsName + "/" + SCRIPT_INFO.settingsFile); settingsFile.open("w"); settingsFile.write(this.stringify(State.settings)); settingsFile.close(); } catch (e) { UI.logMessage("Falha ao salvar configurações: " + e.toString(), true); } },
        loadDatabase: function() { State.allIcons = []; if (!State.settings || !State.settings.metadataPath) { UI.logMessage("Caminho não configurado.", true); return; } try { var metadataFile = new File(State.settings.metadataPath); if (!metadataFile.exists) throw new Error("Arquivo de metadados não encontrado."); metadataFile.open("r"); var content = metadataFile.read(); metadataFile.close(); var rawData; try { rawData = eval('(' + content + ')'); } catch(e) { throw new Error("Seu arquivo JSON contém um erro de sintaxe."); } if (Object.prototype.toString.call(rawData) !== '[object Array]') throw new Error("JSON não é uma lista (array)."); for (var i = 0; i < rawData.length; i++) { try { var icon = rawData[i]; if (!icon || typeof icon !== 'object') { throw new Error("Entrada não é um objeto válido."); } if (!icon.nome || typeof icon.nome !== 'string') { throw new Error("Propriedade 'nome' ausente/inválida."); } if (!icon.arquivo || typeof icon.arquivo !== 'string') { throw new Error("Propriedade 'arquivo' ausente/inválida."); } icon.categoria = (typeof icon.categoria === 'string') ? icon.categoria : "Sem Categoria"; icon.tags = (Object.prototype.toString.call(icon.tags) === '[object Array]') ? icon.tags : []; State.allIcons.push(icon); } catch (e) { UI.logMessage("Erro ao processar item [" + i + "]: " + e.message, true); } } UI.logMessage(State.allIcons.length + " ícones carregados.", false); UI.populateCategoryList(); Logic.applyFilters(); } catch (e) { UI.logMessage("Erro ao carregar banco de dados: " + e.toString(), true); } },
        importIcon: function(iconData) { if (!iconData) { UI.logMessage("Tentativa de importar um ícone nulo.", true); return; } try { if (!app.project) throw new Error("Nenhum projeto aberto."); app.beginUndoGroup("Importar Ícone: " + iconData.nome); var iconFile = new File(State.settings.iconRootPath + "/" + iconData.arquivo); if (!iconFile.exists) throw new Error("Arquivo não encontrado: " + iconFile.fsName); var importOptions = new ImportOptions(); importOptions.file = iconFile; importOptions.sequence = false; if (/\.(ai|eps|svg)$/i.test(iconFile.name)) { importOptions.importAs = ImportAsType.COMPOSITION; } var importedItem = app.project.importFile(importOptions); if (importedItem) { importedItem.name = iconData.nome; UI.logMessage("Ícone '" + iconData.nome + "' importado.", false); } else { throw new Error("a importação falhou."); } app.endUndoGroup(); } catch (e) { UI.logMessage("Falha ao importar: " + e.toString(), true); if (app.undoInProgress) app.endUndoGroup(); } },
        generateJson: function() { try { if (!State.settings) throw new Error("Configure os caminhos primeiro."); if (!confirm("Isso irá substituir seu arquivo JSON atual. Deseja continuar?")) return; var iconFolder = new Folder(State.settings.iconRootPath); var files = iconFolder.getFiles(); var iconList = []; for (var i = 0; i < files.length; i++) { var file = files[i]; if (file instanceof File && file.name.match(SUPPORTED_EXTENSIONS)) { var nameWithoutExt = decodeURI(file.name).replace(SUPPORTED_EXTENSIONS, ''); iconList.push({ nome: nameWithoutExt.replace(/[-_]/g, ' '), arquivo: file.name, categoria: "Sem Categoria", tags: [] }); } } if (iconList.length === 0) throw new Error("Nenhum arquivo de imagem compatível encontrado."); var jsonString = this.stringify(iconList, true); var metadataFile = new File(State.settings.metadataPath); metadataFile.encoding = "UTF-8"; metadataFile.open("w"); metadataFile.write(jsonString); metadataFile.close(); UI.logMessage(iconList.length + " ícones escritos no JSON.", false); alert(iconList.length + " ícones adicionados ao seu arquivo JSON!"); this.loadDatabase(); } catch (e) { UI.logMessage("Erro ao gerar JSON: " + e.toString(), true); alert("Erro ao gerar JSON: " + e.toString()); } },
        applyFilters: function() { var searchTerm = UI.elements.searchBox.text.toLowerCase(); var selectedCategory = UI.elements.categoryList.selection ? UI.elements.categoryList.selection.text : "Todas"; State.filteredIcons = []; for (var i = 0; i < State.allIcons.length; i++) { var icon = State.allIcons[i]; var categoryMatch = (selectedCategory === "Todas" || icon.categoria === selectedCategory); if (!categoryMatch) continue; if (searchTerm === "" || icon.nome.toLowerCase().indexOf(searchTerm) > -1 || icon.tags.join(' ').toLowerCase().indexOf(searchTerm) > -1) { State.filteredIcons.push(icon); } } UI.renderGrid(); },
        stringify: function(obj, pretty) { var indent=pretty?"  ":""; var pad=pretty?"\n":""; function s(v,l) { var i=Array(l+1).join(indent),n=Array(l+2).join(indent); if(v===null)return"null"; if(typeof v !=='object'){return(typeof v==='string')?'"'+v.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"':String(v);} if(Object.prototype.toString.call(v)==='[object Array]'){var b=pad;for(var j=0;j<v.length;j++){b+=n+s(v[j],l+1)+(j<v.length-1?','+pad:'');}return'['+b+(b.length>0?pad+i:'')+']';} var b=pad,k=[]; for(var key in v){if(v.hasOwnProperty(key))k.push(key);} for(var j=0;j<k.length;j++){b+=n+'"'+k[j]+'": '+s(v[k[j]],l+1)+(j<k.length-1?','+pad:'');} return'{'+b+(b.length>0?pad+i:'')+'}';} return s(obj,0); }
    };

    // =================================================================================
    // 3. INTERFACE DO USUÁRIO (UI)
    // =================================================================================
    var UI = { // Re-declaração de UI aqui, certifique-se de que não haja outra global
        elements: {}, gridSlots: [],
        build: function() {
            var win = new Window("palette", SCRIPT_INFO.name + " v" + SCRIPT_INFO.version, undefined, { resizeable: true });
            win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 5; win.margins = 10;
            this.win = win;

            // Define o fundo da janela como preto
            win.graphics.backgroundColor = win.graphics.newBrush(
            win.graphics.BrushType.SOLID_COLOR,
            [0, 0, 0] // RGB para preto
            );
            
            // --- Grupo de Cabeçalho com Título e Botão de Ajuda ---
            var headerGroup = win.add("group");
            headerGroup.orientation = "row";
            headerGroup.alignChildren = ["fill", "center"];
            headerGroup.alignment = "fill";
            headerGroup.spacing = 10;
            headerGroup.margins = [0, 0, 0, 10]; // Margem inferior para separar do próximo painel

            var titleText = headerGroup.add("statictext", undefined, SCRIPT_INFO.name + " v" + SCRIPT_INFO.version);
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
            titleText.preferredSize.width = 0; // Faz com que o texto ocupe o espaço restante

            // Adiciona o botão de ajuda
            // O elemento helpBtn (ou helpBtnGroup) é adicionado diretamente ao headerGroup aqui.
            // Não é necessário um 'else' separado para adicionar 'helpBtn' pois ele já será criado e adicionado.
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
                var helpBtnGroup = headerGroup.add('group'); // Adiciona um grupo para o botão de ajuda DENTRO do headerGroup
                helpBtnGroup.alignment = ['right', 'center'];
                var helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
                helpBtn.leftClick.onClick = showIcons4UHelp; // Chama a função de ajuda
            } else {
                var helpBtn = headerGroup.add("button", undefined, "?"); // Adiciona o BOTÃO DENTRO do headerGroup
                helpBtn.preferredSize = [24, 24];
                helpBtn.helpTip = "Ajuda sobre " + SCRIPT_INFO.name;
                helpBtn.alignment = ['right', 'center'];
                helpBtn.onClick = showIcons4UHelp; // Chama a função de ajuda
            }
            // --- Fim do Grupo de Cabeçalho ---


            var controlsPanel = win.add("panel", undefined, "Controles");
            controlsPanel.orientation = "row"; controlsPanel.alignChildren = ["left", "center"];
            controlsPanel.add("statictext", undefined, "Buscar:");
            this.elements.searchBox = controlsPanel.add("edittext", undefined, ""); this.elements.searchBox.preferredSize.width = 150;
            controlsPanel.add("statictext", undefined, "Categoria:");
            this.elements.categoryList = controlsPanel.add("dropdownlist", undefined, ["Todas"]); this.elements.categoryList.selection = 0;
            this.elements.refreshBtn = controlsPanel.add("button", undefined, "Atualizar ↺");

            var gridPanel = win.add("panel", undefined, "Ícones");
            gridPanel.alignChildren = ["left", "top"]; gridPanel.alignment = ["fill", "fill"];
            this.elements.gridPanel = gridPanel;

            var detailsPanel = win.add("panel", undefined, "Detalhes do Ícone Selecionado");
            detailsPanel.orientation = "row"; detailsPanel.alignChildren = ["left", "center"];
            this.elements.detailsPanel = detailsPanel;
            this.elements.previewImage = detailsPanel.add("image", undefined); this.elements.previewImage.preferredSize = [100, 100];
            var detailsTextGroup = detailsPanel.add("group"); detailsTextGroup.orientation = "column"; detailsTextGroup.alignChildren = ["fill", "top"]; detailsTextGroup.alignment = ["fill", "center"];
            this.elements.nameText = detailsTextGroup.add("statictext", undefined, "Nome do Ícone", { font: "bold" });
            this.elements.detailsText = detailsTextGroup.add("statictext", undefined, "Detalhes...");
            this.elements.importBtn = detailsPanel.add("button", undefined, "Importar"); this.elements.importBtn.preferredSize.width = 100;
            detailsPanel.visible = false;

            var bottomPanel = win.add("panel", undefined, "Log e Configurações");
            bottomPanel.orientation = "row";
            this.elements.logArea = bottomPanel.add("edittext", undefined, "", { multiline: true, readonly: true }); this.elements.logArea.alignment = ["fill", "fill"];
            var settingsBtns = bottomPanel.add("group"); settingsBtns.orientation = "column";
            this.elements.generateJsonBtn = settingsBtns.add("button", undefined, "Gerar JSON");
            this.elements.settingsBtn = settingsBtns.add("button", undefined, "Configurar");
            this.elements.clearLogBtn = settingsBtns.add("button", undefined, "Limpar Log");
            
            this.createGridSlots();
        },
        
        createGridSlots: function() {
            while (this.elements.gridPanel.children.length > 0) { this.elements.gridPanel.remove(this.elements.gridPanel.children[0]); }
            this.gridSlots = [];
            var gridContent = this.elements.gridPanel.add("group"); gridContent.orientation = "row"; gridContent.alignChildren = ["left", "top"];
            var cols = UI_CONFIG.grid.columns;
            var columns = []; for (var c = 0; c < cols; c++) { columns[c] = gridContent.add('group'); columns[c].orientation = 'column'; }
            var numRows = 4;
            for (var i = 0; i < cols * numRows; i++) {
                var slot = columns[i % cols].add("group");
                slot.orientation = "column"; slot.spacing = 4; slot.margins = 5;
                var thumbSize = UI_CONFIG.grid.thumbSize;
                slot.preferredSize = [thumbSize + 10, thumbSize + 30];
                slot.graphics.backgroundColor = slot.graphics.newBrush(slot.graphics.BrushType.SOLID_COLOR, UI_CONFIG.colors.background);
                slot.thumb = slot.add("image"); slot.thumb.preferredSize = [thumbSize, thumbSize];
                slot.label = slot.add("statictext", undefined, "", { truncate: "end" }); slot.label.alignment = "center";

                // --- LÓGICA DE EVENTOS REFORÇADA ---
                var clickHandler = function() {
                    var clickedSlot = (this.type === 'group') ? this : this.parent;
                    if (clickedSlot.iconData) {
                        UI.updateDetailsPanel(clickedSlot.iconData, clickedSlot);
                    }
                };
                var dblClickHandler = function() {
                    var dblClickedSlot = (this.type === 'group') ? this : this.parent;
                    if (dblClickedSlot.iconData) {
                        // Primeiro, certifica-se de que o item está selecionado visualmente
                        UI.updateDetailsPanel(dblClickedSlot.iconData, dblClickedSlot);
                        // Em seguida, importa
                        Logic.importIcon(dblClickedSlot.iconData);
                    }
                };

                slot.onClick = clickHandler; slot.thumb.onClick = clickHandler; slot.label.onClick = clickHandler;
                slot.onDoubleClick = dblClickHandler; slot.thumb.onDoubleClick = dblClickHandler; slot.label.onDoubleClick = dblClickHandler;
                
                this.gridSlots.push(slot);
            }
        },

        renderGrid: function() { UI.logMessage(State.filteredIcons.length + " ícones encontrados."); for (var i = 0; i < this.gridSlots.length; i++) { var slot = this.gridSlots[i]; if (i < State.filteredIcons.length) { var icon = State.filteredIcons[i]; slot.iconData = icon; slot.visible = true; var thumbFile = new File(State.settings.iconRootPath + "/" + icon.arquivo); slot.thumb.image = thumbFile.exists ? thumbFile : null; slot.label.text = icon.nome; } else { slot.iconData = null; slot.visible = false; } } this.updateDetailsPanel(null, null); },
        updateDetailsPanel: function(iconData, slot) {
            State.selectedIconData = iconData;
            this.highlightSelection(slot);
            this.elements.detailsPanel.visible = !!iconData; // Mostra ou esconde o painel
            if (iconData) {
                var previewFile = new File(State.settings.iconRootPath + "/" + iconData.arquivo);
                this.elements.previewImage.image = previewFile.exists ? previewFile : null;
                this.elements.nameText.text = iconData.nome;
                this.elements.detailsText.text = "Arquivo: " + iconData.arquivo;
                this.elements.importBtn.enabled = true;
            } else {
                 this.elements.importBtn.enabled = false;
            }
            this.win.layout.layout(true); // Força o redesenho da UI
        },
        highlightSelection: function(selectedSlot) { if (State.selectedSlot) { State.selectedSlot.graphics.backgroundColor = State.selectedSlot.graphics.newBrush(State.selectedSlot.graphics.BrushType.SOLID_COLOR, UI_CONFIG.colors.background); } if (selectedSlot) { selectedSlot.graphics.backgroundColor = selectedSlot.graphics.newBrush(selectedSlot.graphics.BrushType.SOLID_COLOR, UI_CONFIG.colors.selection); } State.selectedSlot = selectedSlot; }, // Correção aqui: use selectedSlot.graphics.newBrush
        populateCategoryList: function() { var cats = {"Todas": true}; for(var i=0; i < State.allIcons.length; i++) cats[State.allIcons[i].categoria] = true; this.elements.categoryList.removeAll(); for(var c in cats) this.elements.categoryList.add('item', c); this.elements.categoryList.selection = 0; },
        logMessage: function(message, isError) { if(!this.elements.logArea){alert("Log:\n" + message); return;} var time = new Date().toTimeString().substr(0, 8); this.elements.logArea.text = time + " " + (isError ? "[ERRO] " : "[INFO] ") + message + "\n" + this.elements.logArea.text; },
        
        assignEventHandlers: function() {
            this.elements.searchBox.onChanging = function() { Logic.applyFilters(); };
            this.elements.categoryList.onChange = function() { Logic.applyFilters(); };
            this.elements.refreshBtn.onClick = function() { Logic.loadDatabase(); };
            this.elements.generateJsonBtn.onClick = function() { Logic.generateJson(); };
            this.elements.settingsBtn.onClick = function() {
                alert("Selecione:\n\n1. A PASTA com seus ícones.\n2. O local do seu arquivo de metadados.", "Configuração Manual");
                var iconRoot = Folder.selectDialog("1. Selecione a pasta com seus ícones"); if (!iconRoot) return;
                var metadataFile = File.saveDialog("2. Escolha onde salvar seu arquivo de metadados", "JSON:*.json"); if (!metadataFile) return;
                var newSettings = { iconRootPath: iconRoot.fsName, metadataPath: metadataFile.fsName };
                Logic.saveSettings(newSettings);
                UI.logMessage("Novas configurações definidas. Carregando...");
                Logic.loadDatabase();
            };
            this.elements.clearLogBtn.onClick = function() { UI.elements.logArea.text = ""; };
            this.elements.importBtn.onClick = function() { Logic.importIcon(State.selectedIconData); };
        }
    };

    var App = {
        run: function() {
            UI.build();
            UI.assignEventHandlers();
            if (Logic.loadSettings()) {
                Logic.loadDatabase();
            }
            UI.win.show();
        }
    };

    App.run();

})();