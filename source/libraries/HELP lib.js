// ==========================================================
// HELP lib.js - Biblioteca de Funções de Ajuda
// ==========================================================

function showTemplatesHelp() {
    // Tenta usar as cores globais, se disponíveis, com fallbacks
    var currentBgColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E';
    var currentNormalColor = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#C7C8CA';
    var currentHighlightColor = (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#E0003A';
    
    // Funções de cor locais para garantir que a janela funcione de forma independente
    function hexToRgb(hex) { if (hex == undefined) return [0.5, 0.5, 0.5]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16) / 255; var g = parseInt(hex.substring(2, 4), 16) / 255; var b = parseInt(hex.substring(4, 6), 16) / 255; return [r, g, b]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

    var TARGET_HELP_WIDTH = 450,
        MARGIN_SIZE = 15,
        TOPIC_SECTION_MARGINS = [10, 5, 10, 5],
        TOPIC_SPACING = 5,
        TOPIC_TITLE_INDENT = 0,
        SUBTOPIC_INDENT = 25;
        
    var helpWin = new Window("dialog", "GNEWS TEMPLATES - Ajuda", undefined, { closeButton: true });
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
    
    var titleText = headerPanel.add("statictext", undefined, "AJUDA - GNEWS TEMPLATES");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
    titleText.alignment = ["center", "center"];
    setFgColor(titleText, currentHighlightColor);
    
    var mainDescText = headerPanel.add("statictext", undefined, "Gerencie e preencha templates GNEWS com informações automáticas das artes.", { multiline: true });
    mainDescText.alignment = ["fill", "fill"];
    mainDescText.preferredSize.height = 40;
    setFgColor(mainDescText, currentNormalColor);
    
    var topicsTabPanel = helpWin.add("tabbedpanel");
    topicsTabPanel.alignment = ["fill", "fill"];
    topicsTabPanel.margins = 15;
    
    var allHelpTopics = [
        {
            tabName: "VISÃO GERAL",
            topics: [
                { title: "▶ SELEÇÃO DE TEMPLATE:", text: "Navegue pela árvore à esquerda para selecionar um template (.aep ou .aet). O preview aumentado e informações da arte GNEWS aparecerão à direita." },
                { title: "▶ PREVIEW AUMENTADO:", text: "Visualização maior dos templates para melhor análise visual antes do processamento." },
                { title: "▶ ATUALIZAR LISTA (🔄):", text: "Recarrega a lista de templates na árvore." },
                { title: "▶ ABRIR PASTA (📁):", text: "Abre o diretório onde os templates estão armazenados." }
            ]
        },
        {
            tabName: "INFORMAÇÕES GNEWS",
            topics: [
                { title: "▶ CÓDIGO:", text: "Digite o código da arte GNEWS (ex: GNVZ036). As informações são carregadas automaticamente do banco de dados." },
                { title: "▶ NOME DA ARTE:", text: "Exibido automaticamente baseado no código informado." },
                { title: "▶ SERVIDOR DESTINO:", text: "Servidor de destino da arte, carregado automaticamente (ex: FTP VIZ, PAM HARDNEWS)." },
                { title: "▶ ÚLTIMA ATUALIZAÇÃO:", text: "Data da última modificação/processamento da arte." }
            ]
        },
        {
            tabName: "PROCESSAMENTO",
            topics: [
                { title: "▶ IMPORTAR:", text: "Importa o template diretamente para o projeto e registra informações GNEWS no log." },
                { title: "▶ SEM ORGANIZAÇÃO AUTOMÁTICA:", text: "O projeto não é mais organizado automaticamente, mantendo a estrutura original." },
                { title: "▶ SEM METADADOS XMP:", text: "Metadados XMP não são mais adicionados automaticamente." },
                { title: "▶ SEM FILA DE RENDER:", text: "Sistema de fila de renderização foi removido para fluxo mais direto." },
                { title: "▶ LOG GNEWS:", text: "Registra informações específicas GNEWS incluindo código da arte, nome e servidor destino." }
            ]
        },
        {
            tabName: "ATALHOS",
            topics: [
                { title: "▶ DUPLO CLIQUE:", text: "Duplo clique em um template importa diretamente sem processamento de texto, mantendo a estrutura original." }
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
            
            topicGrp.margins.left = (topic.title.indexOf("▶") === 0) ? TOPIC_TITLE_INDENT : SUBTOPIC_INDENT;
            
            var topicTitle = topicGrp.add("statictext", undefined, topic.title);
            topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
            setFgColor(topicTitle, currentHighlightColor);
            
            if (topic.text !== "") {
                var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                topicText.preferredSize.height = 50;
                setFgColor(topicText, currentNormalColor);
            }
        }
    }
    
    var closeBtnGrp = helpWin.add("group");
    closeBtnGrp.alignment = "center";
    closeBtnGrp.margins = [0, 10, 0, 0];
    var closeBtn = closeBtnGrp.add("button", undefined, "OK");
    closeBtn.onClick = function () { helpWin.close(); };
    
    helpWin.layout.layout(true);
    helpWin.center();
    helpWin.show();
}