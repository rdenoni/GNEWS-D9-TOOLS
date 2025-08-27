// ===========================================================================================
// GNEWS CopyLinks.jsx - VERSÃO COM CONTROLE DE LARGURA CORRIGIDO E HELP ATUALIZADO
// ===========================================================================================

(function() {
    // Presume que as funções e variáveis do tema (themeIconButton, D9T_INFO_ICON, etc.) estão disponíveis no escopo global
    var config = null;
    var isWindows = ($.os.indexOf("Windows") !== -1);
    var GNEWS_D9_TOOLS_ROOT = new File($.fileName).parent.parent.parent;

    // Funções de cor necessárias para o tema do botão de ajuda
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    // Definindo cores para consistência, se não vierem de um arquivo global
    var bgColor1 = '#0B0D0E'; // Cor de fundo principal
    var normalColor1 = '#C7C8CA'; // Cor de texto normal
    var highlightColor1 = '#E0003A'; // Cor de destaque para títulos de tópico

    // CARREGA CONFIG
    try {
        var scriptFile = new File($.fileName);
        var configPath = scriptFile.parent.parent.fsName + "/layout/COPYLINKS_config.json";
        var configFile = new File(configPath);
        if (configFile.exists) {
            configFile.open("r");
            var content = configFile.read();
            configFile.close();
            config = eval('(' + content + ')');
        } else {
            alert("JSON não encontrado: " + configPath);
            return;
        }
    } catch (e) { alert("Erro ao carregar JSON: " + e.toString()); return; }
    if (!config || !config.dados || !config.dados.grupos) { alert("JSON inválido"); return; }

    // Funções do Script
    function hasWriteAccess() { return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY"); }
    function copyText(text) { try { var tempFile = new File(Folder.temp.absoluteURI + "/gnews_copy_temp.txt"); tempFile.encoding = "UTF-8"; tempFile.open("w"); tempFile.write(text); tempFile.close(); var command = isWindows ? 'cmd.exe /c "clip < \\"' + tempFile.fsName + '\\""' : "pbcopy < " + tempFile.fsName; system.callSystem(command); $.sleep(50); tempFile.remove(); return true; } catch (e) { alert("Falha ao copiar para a área de transferência:\n" + e.toString()); return false; } }
    function openPath(path) { path = path.replace(/^\s+|\s+$/g, ''); var isPdf = path.toLowerCase().lastIndexOf(".pdf") === path.length - 4; var isRelative = path.indexOf(":") === -1 && path.indexOf("\\\\") !== 0 && path.indexOf("http") !== 0; if (isPdf && isRelative) { var cleanRelativePath = path.replace(/^[\\\/]+/, ""); var absolutePath = new File(GNEWS_D9_TOOLS_ROOT.fsName + "/" + cleanRelativePath); if (absolutePath.exists) { path = absolutePath.fsName; } else { alert("❌ PDF não encontrado:\n" + absolutePath.fsName); return; } } if (path.indexOf("http") === 0) { if (isWindows) { system.callSystem('cmd.exe /c "start ' + path + '"'); } else { system.callSystem('open "' + path + '"'); } return; } var file = new File(path); var folder = new Folder(path); if (file.exists) { if (isWindows) { system.callSystem('cmd.exe /c "start "" "' + file.fsName + '"'); } else { system.callSystem('open "' + file.fsName + '"'); } } else if (folder.exists) { folder.execute(); } else { alert("❌ Arquivo/pasta não encontrado:\n" + path); } }
    function addPin(path) { if (!isWindows) { alert("Acesso Rápido disponível apenas no Windows."); return false; } var targetPath = path; var file = new File(path); if (file.exists) { targetPath = file.parent.fsName; } var folder = new Folder(targetPath); if (!folder.exists) { alert("Pasta não existe: " + targetPath); return false; } try { var cmd = 'powershell.exe -Command "$s=New-Object -ComObject Shell.Application;$f=$s.Namespace(\'' + folder.fsName.replace(/\\/g, '\\\\') + '\');$f.Self.InvokeVerb(\'pintohome\')"'; return (system.callSystem(cmd) === 0); } catch (e) { return false; } }
    function getFileIcon(path) { if (path.indexOf("http") === 0) return "🌐"; if (path.indexOf("\\\\") === 0) return "🗄️"; var extension = ""; var lastDot = path.lastIndexOf("."); if (lastDot !== -1) { extension = path.substring(lastDot).toLowerCase(); } switch (extension) { case ".pdf": return "📄"; case ".exe": return "⚙️"; case ".doc": case ".docx": return "📝"; case ".xls": case ".xlsx": return "📊"; case ".ppt": case ".pptx": return "📊"; case ".jpg": case ".jpeg": case ".png": case ".gif": case ".bmp": return "🖼️"; case ".mp4": case ".avi": case ".mov": case ".mkv": return "🎬"; case ".mp3": case ".wav": case ".flac": return "🎵"; case ".txt": return "📄"; default: return "📁"; } }

    // CRIA INTERFACE
    var win = new Window("palette", "GNEWS CopyLinks");
    win.orientation = "column"; win.spacing = 10; win.margins = 15;
    setBgColor(win, bgColor1);

    var header = win.add("group");
    header.orientation = 'stack';
    header.alignment = 'fill';

    var mainHeaderItems = header.add('group');
    mainHeaderItems.alignment = 'left';
    var groupLabel = mainHeaderItems.add("statictext", undefined, "Grupo:");
    setFgColor(groupLabel, monoColor1);
    var grupos = config.dados.grupos;
    var groupNames = [];
    for (var i = 0; i < grupos.length; i++) { groupNames.push(grupos[i].titulo); }
    var dropdown = mainHeaderItems.add("dropdownlist", undefined, groupNames);
    dropdown.preferredSize.width = 300; dropdown.selection = 0;

    var helpGrp = header.add('group');
    helpGrp.alignment = 'right';
    var helpBtn = new themeIconButton(helpGrp, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
    
    // START - FUNÇÃO DE AJUDA REVISADA PARA PADRONIZAÇÃO
    helpBtn.leftClick.onClick = function() {
        var TARGET_HELP_WIDTH = 450;
        var MARGIN_SIZE = 15;
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
        var TOPIC_SPACING = 5;
        var TOPIC_TITLE_INDENT = 0;
        var SUBTOPIC_INDENT = 25;

        var helpWin = new Window("palette", "Ajuda - GNEWS CopyLinks", undefined, { closeButton: true });
        helpWin.orientation = "column";
        helpWin.alignChildren = ["fill", "fill"];
        helpWin.spacing = 10;
        helpWin.margins = MARGIN_SIZE;
        
        helpWin.preferredSize = [TARGET_HELP_WIDTH, 600];

        if (typeof bgColor1 !== 'undefined' && typeof setBgColor !== 'undefined') {
            setBgColor(helpWin, bgColor1);
        } else {
            helpWin.graphics.backgroundColor = helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR, [0.05, 0.04, 0.04, 1]);
        }

        var headerPanel = helpWin.add("panel", undefined, "");
        headerPanel.orientation = "column";
        headerPanel.alignChildren = ["fill", "top"];
        headerPanel.alignment = ["fill", "top"];
        headerPanel.spacing = 10;
        headerPanel.margins = 15;
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - GNEWS COPYLINKS");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Ferramenta para acesso rápido a links, pastas e arquivos importantes.", {multiline: true});
        mainDescText.alignment = ["fill", "fill"];
        mainDescText.preferredSize.height = 40;
        if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(mainDescText, normalColor1);
        } else {
            mainDescText.graphics.foregroundColor = mainDescText.graphics.newPen(mainDescText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var topicsTabPanel = helpWin.add("tabbedpanel");
        topicsTabPanel.alignment = ["fill", "fill"];
        topicsTabPanel.margins = 15;

        var allHelpTopics = [
            {
                tabName: "USO BÁSICO",
                topics: [
                    { title: "▶ SELEÇÃO DE GRUPO:", text: "Use o menu 'Grupo' no topo da janela para alternar entre diferentes conjuntos de links organizados." },
                    { title: "▶ BOTÕES DE LINK:", text: "Cada botão principal abre o link, pasta ou arquivo correspondente. O ícone ao lado do nome indica o tipo de destino (ex: 📄 para PDF, 📁 para pasta, 🌐 para web)." }
                ]
            },
            {
                tabName: "AÇÕES",
                topics: [
                    { title: "▶ ACESSO RÁPIDO (⭐):", text: "Disponível apenas no Windows. Adiciona a pasta do link ao 'Acesso Rápido' do Explorador de Arquivos para facilitar o acesso futuro. Visível apenas para links de pastas não-web." },
                    { title: "▶ COPIAR CAMINHO (📋):", text: "Copia o caminho completo (URL ou diretório) do link para a área de transferência. Necessita de permissão de 'Acesso a Rede' nas Preferências do After Effects." },
                    { title: "▶ CAMPO EDITÁVEL:", text: "O campo de texto ao lado dos botões permite visualizar e editar o caminho do link temporariamente. O ícone do botão principal se adapta à mudança de caminho para refletir o novo tipo de arquivo/pasta." }
                ]
            }
        ];

        for (var s = 0; s < allHelpTopics.length; s++) {
            var currentTabSection = allHelpTopics[s];
            var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
            tab.orientation = "column";
            tab.alignChildren = ["fill", "top"];
            tab.spacing = 10;
            tab.margins = TOPIC_SECTION_MARGINS;

            for (var i = 0; i < currentTabSection.topics.length; i++) {
                var topic = currentTabSection.topics[i];
                var topicGrp = tab.add("group");
                topicGrp.orientation = "column";
                topicGrp.alignChildren = "fill";
                topicGrp.spacing = TOPIC_SPACING;
                
                if (topic.title.indexOf("▶") === 0) {
                    topicGrp.margins.left = TOPIC_TITLE_INDENT;
                } else {
                    topicGrp.margins.left = SUBTOPIC_INDENT;
                }

                var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                    setFgColor(topicTitle, highlightColor1);
                } else {
                    topicTitle.graphics.foregroundColor = topicTitle.graphics.newPen(topicTitle.graphics.PenType.SOLID_COLOR, [0.83, 0, 0.23, 1], 1);
                }
                topicTitle.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);


                if(topic.text !== ""){
                    var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                    topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                    topicText.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);
                    topicText.preferredSize.height = 50;
                    
                    if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                        setFgColor(topicText, normalColor1);
                    } else {
                        topicText.graphics.foregroundColor = topicText.graphics.newPen(topicText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
                    }
                }
            }
        }

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
    };
    // END - FUNÇÃO DE AJUDA REVISADA PARA PADRONIZAÇÃO

    var content = win.add("group");
    content.orientation = "column"; content.spacing = 15;

    function updateContent(groupIndex) {
        while (content.children.length > 0) { content.remove(content.children[0]); }
        var layout = config.configuracao.layout_geral;
        var BTN_WIDTH = layout.btn_width || 40;
        var NAME_BTN_HEIGHT = layout.name_btn_height || 30;
        var NAME_BTN_WIDTH = layout.name_btn_width || 450;
        var BOTTOM_ROW_HEIGHT = layout.bottom_row_height || 25;
        var TEXT_WIDTH_NORMAL = layout.text_width_normal || 300;
        var TEXT_WIDTH_CATALOGOS = layout.text_width_catalogos || 590;
        
        var group = grupos[groupIndex];
        var isCatalogos = (group.titulo === "GRUPO CATÁLOGOS E GUIAS");

        for (var i = 0; i < group.links.length; i++) {
            var linkGroup = content.add("group");
            linkGroup.orientation = "column"; linkGroup.spacing = 5; linkGroup.alignChildren = "left";
            var link = group.links[i];
            var fileIcon = getFileIcon(link.caminho);

            var mainBtn = linkGroup.add("button", undefined, "  " + fileIcon + " " + link.nome);
            mainBtn.preferredSize.width = NAME_BTN_WIDTH; 
            mainBtn.preferredSize.height = NAME_BTN_HEIGHT;

            var controls = linkGroup.add("group");
            controls.orientation = "row"; controls.spacing = 5;
            
            var pinBtn = null;
            if (link.tipo === "folder" && link.caminho.indexOf("http") !== 0 && !isCatalogos) {
                pinBtn = controls.add("button", undefined, "⭐");
                pinBtn.preferredSize.width = BTN_WIDTH; pinBtn.preferredSize.height = BOTTOM_ROW_HEIGHT;
                pinBtn.helpTip = "Adicionar ao Acesso Rápido";
            } else if (!isCatalogos) {
                var spacer = controls.add("group");
                spacer.preferredSize.width = BTN_WIDTH; spacer.preferredSize.height = BOTTOM_ROW_HEIGHT;
            }
            
            var field = controls.add("edittext", undefined, link.caminho);
            field.enabled = true; 
            field.helpTip = "Caminho editável";
            field.preferredSize.height = BOTTOM_ROW_HEIGHT;

            if(isCatalogos) {
                field.preferredSize.width = TEXT_WIDTH_CATALOGOS;
            } else {
                field.preferredSize.width = TEXT_WIDTH_NORMAL;
            }

            var copyBtn = null;
            if (!isCatalogos) {
                copyBtn = controls.add("button", undefined, "📋");
                copyBtn.preferredSize.width = BTN_WIDTH; copyBtn.preferredSize.height = BOTTOM_ROW_HEIGHT;
                copyBtn.helpTip = "Copiar caminho";
            }

            (function(data, main, pin, copy, pathField) {
                main.onClick = function() { openPath(pathField.text); };
                if (pin) {
                    pin.onClick = function() {
                        if (addPin(pathField.text)) {
                            main.text = "✓ Adicionado!";
                            app.setTimeout(function() { main.text = "  " + getFileIcon(data.caminho) + " " + data.nome; }, 1500);
                        }
                    };
                }
                if (copy) {
                    copy.onClick = function() {
                        if (!hasWriteAccess()) { alert("ERRO: Ação de copiar requer permissão."); return; }
                        if (copyText(pathField.text)) {
                            main.text = "✓ Copiado!";
                            app.setTimeout(function() { main.text = "  " + getFileIcon(data.caminho) + " " + data.nome; }, 1500);
                        }
                    };
                }
                pathField.onChanging = function() {
                    var newIcon = getFileIcon(this.text);
                    main.text = "  " + newIcon + " " + data.nome;
                };
            })(link, mainBtn, pinBtn, copyBtn, field);
        }
        win.layout.layout(true);
        var groupLayout = config.configuracao.layout_grupos[group.titulo];
        if (groupLayout && groupLayout.altura) { win.size.height = groupLayout.altura; }
        else { win.size.height = 200 + (group.links.length * 85); }
    }
    dropdown.onChange = function() { if (this.selection) { updateContent(this.selection.index); } };
    updateContent(0);
    var layout = config.configuracao.layout_geral;
    var windowWidth = (layout.name_btn_width || 450) + 60;
    win.size.width = windowWidth;
    win.layout.layout(true);
    win.center();
    win.show();
})();