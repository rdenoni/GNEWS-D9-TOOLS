// ===========================================================================================
// GNEWS CopyLinks.jsx - v2.3 | 2024-06-10
// ===========================================================================================

function launchCopyLinks() {

    var config = null;
    var isWindows = ($.os.indexOf("Windows") !== -1);
    var GNEWS_D9_TOOLS_ROOT = new File($.fileName).parent.parent.parent;

    // Funções de cor internas para garantir a funcionalidade do tema
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    // CARREGA CONFIG
    try {
        var scriptFile = new File($.fileName);
        var configPath = scriptFile.parent.parent.fsName + "/config/COPYLINKS_config.json";
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

    // CRIA INTERFACE
    var win = new Window("palette", "GNEWS CopyLinks");
    win.orientation = "column"; win.spacing = 10; win.margins = 15;
    setBgColor(win, bgColor1);

    // *** CABEÇALHO REESTRUTURADO PARA ALINHAMENTO CORRETO ***

    // --- LINHA 1: Contém o subtítulo (esquerda) e o botão de ajuda (direita) ---
    var line1Grp = win.add("group");
    line1Grp.orientation = 'stack';
    line1Grp.alignment = 'fill'; // Faz o grupo ocupar toda a largura para o 'stack' funcionar

    var subtitleGrp = line1Grp.add('group');
    subtitleGrp.alignment = 'left';
    var subtitle = subtitleGrp.add("statictext", undefined, "Acesso Rápido:");
    setFgColor(subtitle, monoColor1);

    var helpGrp = line1Grp.add('group');
    helpGrp.alignment = 'right';
    var helpBtn = new themeIconButton(helpGrp, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
    
    // --- LINHA 2: Contém o texto "Grupo:" e o dropdown, alinhados à esquerda ---
    var line2Grp = win.add("group");
    line2Grp.orientation = 'row';
    line2Grp.alignment = 'left';

    var groupLabel = line2Grp.add("statictext", undefined, "Grupo:");
    setFgColor(groupLabel, monoColor1);
    var grupos = config.dados.grupos;
    var groupNames = [];
    for (var i = 0; i < grupos.length; i++) { groupNames.push(grupos[i].titulo); }
    var dropdown = line2Grp.add("dropdownlist", undefined, groupNames);
    dropdown.preferredSize.width = 300;
    dropdown.selection = 0;

    // *** FIM DA REESTRUTURAÇÃO ***

    helpBtn.leftClick.onClick = function() {
        if (typeof showCopyLinksHelp === 'function') {
            showCopyLinksHelp();
        } else {
            alert("Biblioteca de ajuda (HELP lib.js) não foi encontrada.");
        }
    };

    var content = win.add("group");
    content.orientation = "column"; content.spacing = 15;

    function updateContent(groupIndex) {
        while (content.children.length > 0) { content.remove(content.children[0]); }
        var layout = config.configuracao.layout_geral;
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

            var pinBtnIcon = null;
            if (!isCatalogos && isWindows && link.tipo === "folder" && link.caminho.indexOf("http") !== 0) {
                 pinBtnIcon = new themeIconButton(controls, {
                    icon: D9T_ATALHO_ICON,
                    tips: [lClick + 'Adicionar ao Acesso Rápido']
                    
                });
            } else {
                 var spacer = controls.add('group');
                 spacer.preferredSize.width = 30;
            }
            
            var field = controls.add("edittext", undefined, link.caminho);
            field.enabled = true; 
            field.helpTip = "Caminho editável";
            field.preferredSize.height = BOTTOM_ROW_HEIGHT;

            if(isCatalogos) {
                field.preferredSize.width = TEXT_WIDTH_CATALOGOS + 35;
            } else {
                field.preferredSize.width = TEXT_WIDTH_NORMAL;
            }

            var copyBtnIcon = null;
            if (!isCatalogos) {
                 copyBtnIcon = new themeIconButton(controls, {
                    icon: D9T_COPY_ICON,
                    tips: [lClick + 'Copiar caminho']
                    
                });
            }
            
            (function(data, main, copyIcon, pinIcon, pathField) {
                main.onClick = function() { openPath(pathField.text); };
                
                if (copyIcon) {
                    copyIcon.leftClick.onClick = function() {
                        if (!hasWriteAccess()) { alert("ERRO: Ação de copiar requer permissão."); return; }
                        if (copyText(pathField.text)) {
                            main.text = "✓ Copiado!";
                            app.setTimeout(function() { main.text = "  " + getFileIcon(data.caminho) + " " + data.nome; }, 1500);
                        }
                    };
                }
                
                if (pinIcon) {
                    pinIcon.leftClick.onClick = function() {
                        if (addPin(pathField.text)) {
                            main.text = "✓ Adicionado!";
                            app.setTimeout(function() { main.text = "  " + getFileIcon(data.caminho) + " " + data.nome; }, 1500);
                        }
                    };
                }

                pathField.onChanging = function() {
                    var newIcon = getFileIcon(this.text);
                    main.text = "  " + newIcon + " " + data.nome;
                };
            })(link, mainBtn, copyBtnIcon, pinBtnIcon, field);
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
}