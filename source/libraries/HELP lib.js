// ==========================================================
// HELP lib.js - Biblioteca de Funções de Ajuda
// ==========================================================

function showCopyLinksHelp() {
    // Funções de cor locais para garantir que a janela funcione mesmo se as globais não estiverem carregadas
    function hexToRgb(hex) { if (hex == undefined) return [0.5, 0.5, 0.5]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16) / 255; var g = parseInt(hex.substring(2, 4), 16) / 255; var b = parseInt(hex.substring(4, 6), 16) / 255; return [r, g, b]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    // Tenta usar as cores globais, se disponíveis
    var currentBgColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E';
    var currentNormalColor = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#C7C8CA';
    var currentHighlightColor = (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#E0003A';

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
    setBgColor(helpWin, currentBgColor);

    var headerPanel = helpWin.add("panel", undefined, "");
    headerPanel.orientation = "column";
    headerPanel.alignChildren = ["fill", "top"];
    headerPanel.alignment = ["fill", "top"];
    headerPanel.spacing = 10;
    headerPanel.margins = 15;
    
    var titleText = headerPanel.add("statictext", undefined, "AJUDA - GNEWS COPYLINKS");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
    titleText.alignment = ["center", "center"];
    setFgColor(titleText, currentHighlightColor);

    var mainDescText = headerPanel.add("statictext", undefined, "Ferramenta para acesso rápido a links, pastas e arquivos importantes.", {multiline: true});
    mainDescText.alignment = ["fill", "fill"];
    mainDescText.preferredSize.height = 40;
    setFgColor(mainDescText, currentNormalColor);

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
            setFgColor(topicTitle, currentHighlightColor);
            topicTitle.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);

            if(topic.text !== ""){
                var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                topicText.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);
                topicText.preferredSize.height = 50;
                setFgColor(topicText, currentNormalColor);
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
}

// ==========================================================
// Adicione outras funções de ajuda aqui, se necessário
// Exemplo:
// function showOutraFerramentaHelp() { ... }
// ==========================================================