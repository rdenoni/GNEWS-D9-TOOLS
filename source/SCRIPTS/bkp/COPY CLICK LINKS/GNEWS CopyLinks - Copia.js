
(function () {

    // --- FUNÇÕES AUXILIARES (LÓGICA) ---

    function loadConfig() {
        var scriptFile = new File($.fileName);
        var configPath = scriptFile.parent.fsName + "/links_config.json";
        var configFile = new File(configPath);
        if (configFile.exists) {
            configFile.open("r"); var content = configFile.read(); configFile.close();
            try { return eval('(' + content + ')'); }
            catch (e) { alert("Erro de formatação no arquivo links_config.json.\n\nErro: " + e.toString()); return null; }
        } else {
            alert("Arquivo 'links_config.json' não encontrado na mesma pasta do script:\n\n" + scriptFile.parent.fsName);
            return null;
        }
    }

    var isWindows = $.os.indexOf("Windows") !== -1;

    function copyToClipboard(textToCopy) { /* ...função sem alterações... */
        var tempFile = new File(Folder.temp.absoluteURI + "/tempClipboard.txt");
        tempFile.open("w"); tempFile.write(textToCopy); tempFile.close();
        try {
            if (isWindows) { system.callSystem('cmd.exe /c "clip < "' + tempFile.fsName + '"'); }
            else { system.callSystem("pbcopy < " + tempFile.fsName); }
        } catch (e) { alert("Falha ao copiar: " + e); }
        finally { tempFile.remove(); }
    }
    function openURL(url) { /* ...função sem alterações... */
        try {
            if (isWindows) { system.callSystem('cmd.exe /c "start ' + url + '"'); }
            else { system.callSystem('open "' + url + '"'); }
        } catch (e) { alert("Não foi possível abrir a URL: " + e); }
    }
    function openFolder(path) { /* ...função sem alterações... */
        if (path === "CAMINHO NÃO DEFINIDO") { alert("Este caminho ainda não foi configurado no arquivo JSON."); return; }
        var folder = new Folder(path);
        if (folder.exists) { folder.execute(); }
        else { alert("Não foi possível encontrar a pasta:\n" + path); }
    }
    function showFeedback(textField, originalText, feedbackText) { /* ...função sem alterações... */
        textField.text = feedbackText;
        app.setTimeout(function() { textField.text = originalText; }, 1200);
    }
    
    // --- FUNÇÃO PARA POPULAR O CONTEÚDO DE UMA ABA ---

    function populateTabContent(tabContainer, linksArray, groupTitle) {
        tabContainer.orientation = "column";
        tabContainer.alignChildren = 'fill';
        tabContainer.spacing = 10;
        tabContainer.margins = 15;

        for (var i = 0; i < linksArray.length; i++) {
            (function(linkItem) {
                var buttonSize = [32, 24]; 

                var itemContainer = tabContainer.add("group {orientation: 'column', spacing: 3, alignChildren: 'fill'}");

                var topRow = itemContainer.add("group {orientation: 'row', spacing: 5, alignChildren: ['left', 'center']}");
                
                // --- NOVA LÓGICA DE ÍCONE ---
                var iconGlyph;
                // 1. Define o ícone padrão baseado no tipo (link ou pasta)
                if (linkItem.icon === 'web' || linkItem.tipo === 'web') {
                    iconGlyph = '🔗';
                } else {
                    iconGlyph = '📁';
                }
                
                // 2. Se o grupo for "Grupo Acessos" E o ícone for de pasta, troca pelo ícone de rede.
                if (groupTitle === "Grupo Acessos" && iconGlyph === '📁') {
                    iconGlyph = '🌐';
                }
                
                var openBtn = topRow.add("button", undefined, iconGlyph);
                openBtn.helpTip = linkItem.tipo === 'web' ? "Abrir link" : "Abrir pasta";
                openBtn.preferredSize = buttonSize;
                openBtn.maximumSize = buttonSize;
                openBtn.onClick = function() {
                    if (linkItem.tipo === 'web') { openURL(linkItem.caminho); } else { openFolder(linkItem.caminho); }
                };
                
                var nameLabel = topRow.add("statictext", undefined, linkItem.nome);
                nameLabel.alignment = ["fill", "center"];

                var bottomRow = itemContainer.add("group {orientation: 'row', spacing: 5, alignChildren: ['fill', 'center']}");
                
                var copyBtn = bottomRow.add("button", undefined, "📋");
                copyBtn.helpTip = "Copiar caminho";
                copyBtn.preferredSize = buttonSize;
                copyBtn.maximumSize = buttonSize;

                var pathText = bottomRow.add("edittext", undefined, linkItem.caminho, { readonly: true });
                pathText.helpTip = linkItem.caminho;
                pathText.alignment = 'fill';

                copyBtn.onClick = function() {
                    copyToClipboard(linkItem.caminho);
                    showFeedback(pathText, linkItem.caminho, "Copiado!");
                };
                
                if (i < linksArray.length - 1) {
                    tabContainer.add("panel {preferredSize:[-1, 1]}");
                }
            })(linksArray[i]);
        }
    }

    // --- INÍCIO DA EXECUÇÃO DO SCRIPT ---

    var configData = loadConfig();
    var win;

    if (configData) {
        win = new Window("palette", "CopyLinks", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "fill"]; 
        
        var tabbedPanel = win.add("tabbedpanel");
        tabbedPanel.alignChildren = ["fill", "fill"];
        tabbedPanel.margins = 5;

        for (var i = 0; i < configData.grupos.length; i++) {
            var grupo = configData.grupos[i];
            var newTab = tabbedPanel.add("tab", undefined, grupo.titulo);
            // Passa o título do grupo para a função que constrói o conteúdo
            populateTabContent(newTab, grupo.links, grupo.titulo);
        }

        if (tabbedPanel.children.length > 0) {
            tabbedPanel.selection = 0; 
        }

        win.onResizing = win.onResize = function () { this.layout.resize(); }
        win.layout.layout(true);
        win.center();
        win.show();
    }
})();