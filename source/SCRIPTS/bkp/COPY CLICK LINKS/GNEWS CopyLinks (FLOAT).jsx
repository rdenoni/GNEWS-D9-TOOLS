(function() {
    // =============================================================================
    // --- FUNÇÕES PRINCIPAIS E DE UTILIDADE ---
    // =============================================================================

    /**
     * Carrega e analisa o arquivo de configuração JSON.
     * @returns {Object|null} Retorna o objeto de configuração se for bem-sucedido, ou null em caso de erro.
     */
    function loadConfig() {
        var scriptFile = new File($.fileName);

        // --- IMPORTANTE ---
        // O caminho foi ajustado. Agora o script espera que o arquivo de configuração
        // esteja em uma pasta chamada "layout", que é "irmã" da pasta pai do script.
        // Exemplo da estrutura de pastas esperada:
        // └── source/
        //     ├── layout/
        //     │   └── COPYLINKS_config.json  <-- ARQUIVO DE CONFIGURAÇÃO AQUI
        //     └── scripts/
        //         └── seu_script.jsx         <-- SEU SCRIPT AQUI
        var configPath = scriptFile.parent.parent.fsName + "/layout/COPYLINKS_config.json";
        
        var configFile = new File(configPath);

        if (configFile.exists) {
            try {
                configFile.open("r");
                var content = configFile.read();
                configFile.close();
                return eval('(' + content + ')');
            } catch (e) {
                alert("Erro de formatação no arquivo COPYLINKS_config.json.\n\nErro: " + e.toString());
                return null;
            }
        } else {
            alert("Arquivo 'COPYLINKS_config.json' não encontrado no caminho esperado:\n\n" + new File(configPath).fsName);
            return null;
        }
    }

    // (O restante do script permanece o mesmo...)

    var isWindows = $.os.indexOf("Windows") !== -1;

    function copyToClipboard(textToCopy) {
        var tempFile = new File(Folder.temp.absoluteURI + "/tempClipboard.txt");
        tempFile.open("w");
        tempFile.write(textToCopy);
        tempFile.close();
        try {
            if (isWindows) { system.callSystem('cmd.exe /c "clip < "' + tempFile.fsName + '"'); } 
            else { system.callSystem("pbcopy < " + tempFile.fsName); }
        } catch (e) { alert("Falha ao copiar: " + e); } 
        finally { tempFile.remove(); }
    }

    function openURL(url) {
        try {
            if (isWindows) { system.callSystem('cmd.exe /c "start ' + url + '"'); } 
            else { system.callSystem('open "' + url + '"'); }
        } catch (e) { alert("Não foi possível abrir a URL: " + e); }
    }

    function openFolder(path) {
        if (path === "CAMINHO NÃO DEFINIDO") { alert("Este caminho ainda não foi configurado no arquivo JSON."); return; }
        var folder = new Folder(path);
        if (folder.exists) { folder.execute(); } 
        else { alert("Não foi possível encontrar a pasta:\n" + path); }
    }

    function addToQuickAccess(path) {
        if (!isWindows || path === "CAMINHO NÃO DEFINIDO") { return false; }
        var folder = new Folder(path);
        if (!folder.exists) { return false; }
        try {
            var cmd = 'powershell -command "$qa = New-Object -ComObject shell.application; $qa.Namespace(\'' + folder.fsName + '\').Self.InvokeVerb(\'pintohome\')"';
            system.callSystem(cmd);
            return true;
        } catch (e) { return false; }
    }
    
    function showFeedback(textField, originalText, feedbackText) {
        textField.text = feedbackText;
        app.setTimeout(function() { textField.text = originalText; }, 1200);
    }

    function populateTabContent(tabContainer, linksArray, groupTitle) {
        var layoutGeral = configData.configuracao.layout_geral || {};

        var BTN_WIDTH = layoutGeral.btn_width || 35;
        var NAME_BTN_HEIGHT = layoutGeral.name_btn_height || 35;
        var BOTTOM_ROW_HEIGHT = layoutGeral.bottom_row_height || 25;
        var TEXT_WIDTH_NORMAL = layoutGeral.text_width_normal || 480;
        var TEXT_WIDTH_CATALOGOS = layoutGeral.text_width_catalogos || 560;
        
        var isCatalogosTab = (groupTitle === "Grupo Catalogos");

        tabContainer.orientation = "column";
        tabContainer.alignChildren = 'fill';
        tabContainer.spacing = 10;
        tabContainer.margins = 15;

        for (var i = 0; i < linksArray.length; i++) {
            (function(linkItem) {
                var itemContainer = tabContainer.add("panel");
                itemContainer.orientation = 'column';
                itemContainer.alignChildren = 'fill';
                itemContainer.spacing = 5;
                itemContainer.margins = 10;

                var nameButton = itemContainer.add('button', undefined, linkItem.nome);
                nameButton.preferredSize.height = NAME_BTN_HEIGHT; 
                nameButton.helpTip = (linkItem.tipo === 'web' ? "🌐 Abrir link: " : "📁 Abrir pasta: ") + linkItem.caminho;
                
                nameButton.onClick = function() {
                    if (linkItem.tipo === 'web' || linkItem.caminho.match(/^http/)) { openURL(linkItem.caminho); } 
                    else { openFolder(linkItem.caminho); }
                };

                var bottomRow = itemContainer.add("group {orientation: 'row', spacing: 5, alignChildren: ['left', 'center']}");
                
                if (linkItem.tipo === 'folder' && !linkItem.caminho.match(/^http/) && isWindows) {
                    var quickAccessBtn = bottomRow.add('button', undefined, '⭐');
                    quickAccessBtn.preferredSize.width = BTN_WIDTH;
                    quickAccessBtn.preferredSize.height = BOTTOM_ROW_HEIGHT;
                    quickAccessBtn.helpTip = "Adicionar ao Acesso Rápido";
                    quickAccessBtn.onClick = function() {
                        if (addToQuickAccess(linkItem.caminho)) { showFeedback(pathText, linkItem.caminho, "✅ Adicionado!"); }
                    };
                } else if (!isCatalogosTab) { 
                    var placeholder = bottomRow.add('statictext', undefined, '');
                    placeholder.preferredSize.width = BTN_WIDTH;
                    placeholder.preferredSize.height = BOTTOM_ROW_HEIGHT;
                }

                var pathText = bottomRow.add("edittext", undefined, linkItem.caminho, { readonly: true });
                pathText.helpTip = "Caminho completo";
                pathText.preferredSize.height = BOTTOM_ROW_HEIGHT;

                if (isCatalogosTab) {
                    pathText.preferredSize.width = TEXT_WIDTH_CATALOGOS;
                } else {
                    pathText.preferredSize.width = TEXT_WIDTH_NORMAL;
                }

                if (!isCatalogosTab) {
                    var copyBtn = bottomRow.add('button', undefined, '📋');
                    copyBtn.preferredSize.width = BTN_WIDTH;
                    copyBtn.preferredSize.height = BOTTOM_ROW_HEIGHT;
                    copyBtn.helpTip = "Copiar caminho";
                    copyBtn.onClick = function() {
                        copyToClipboard(linkItem.caminho);
                        showFeedback(pathText, linkItem.caminho, "✅ Copiado!");
                    };
                }
            })(linksArray[i]);
        }
    }

    var configData = loadConfig();
    if (!configData) { return; }

    var win = new Window("palette", "GNEWS CopyLinks", undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 10;
    
    var headerGrp = win.add('group {orientation: "row", alignment: "fill"}');
    headerGrp.add('statictext', undefined, 'GNEWS CopyLinks');
    headerGrp.add('group').alignment = 'fill';
    var helpBtn = headerGrp.add('button', undefined, '?');
    helpBtn.preferredSize.width = 30;
    helpBtn.onClick = function() {
        alert("COMO USAR O GNEWS COPYLINKS\n\n• Use as abas para navegar.\n• Clique no nome para abrir o link/pasta.\n• Use '⭐' para fixar pastas no Acesso Rápido (Windows).\n• Use '📋' para copiar o caminho.");
    };

    var tabbedPanel = win.add("tabbedpanel");
    tabbedPanel.alignChildren = ["fill", "fill"];
    tabbedPanel.alignment = 'fill';
    
    var grupos = configData.dados.grupos;
    for (var i = 0; i < grupos.length; i++) {
        var grupo = grupos[i];
        var newTab = tabbedPanel.add("tab", undefined, grupo.titulo);
        populateTabContent(newTab, grupo.links, grupo.titulo);
    }
    
    if (tabbedPanel.children.length > 0) {
        tabbedPanel.selection = 0;
    }

    win.layout.layout(true);

    function adjustWindowHeight() {
        if (!tabbedPanel.selection) return;

        var selectedTab = tabbedPanel.selection;
        var groupLayout = configData.configuracao.layout_grupos[selectedTab.text];

        if (groupLayout && groupLayout.altura) {
            win.size.height = groupLayout.altura;
        }
    }
    
    tabbedPanel.onChange = function() {
        adjustWindowHeight();
    };
    
    win.onShow = function() {
        win.minimumSize.width = win.maximumSize.width = win.size.width;
        adjustWindowHeight();
    };
    
    win.onResizing = function() {
        var groupLayout = configData.configuracao.layout_grupos[tabbedPanel.selection.text];
        if (groupLayout && groupLayout.altura && this.size.height !== groupLayout.altura) {
            this.size.height = groupLayout.altura;
        }
    };

    win.center();
    win.show();
})();