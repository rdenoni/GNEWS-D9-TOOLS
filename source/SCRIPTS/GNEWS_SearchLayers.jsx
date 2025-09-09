/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/*

---------------------------------------------------------------
> 🪟 UI dialogs
---------------------------------------------------------------

*/

function findDialog() {
	var scriptName = 'BUSCA';
	var scriptVersion = 'v2.3';

    // Definindo cores para consistência, se não vierem de um arquivo global
    // Presumindo que estas cores são definidas em 'globals.js' ou similar,
    // mas as definimos aqui como fallback caso não estejam disponíveis
    var bgColor1 = '#0B0D0E'; // Cor de fundo principal
    var normalColor1 = '#C7C8CA'; // Cor de texto normal
    var highlightColor1 = '#E0003A'; // Cor de destaque para títulos de tópico
    // Funções de cor necessárias para o tema
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }


	var findW = new Window('palette', scriptName + ' ' + scriptVersion);
	findW.spacing = 4;
	findW.margins = 0;

	//---------------------------------------------------------
    // Cabeçalho com título e botão de ajuda
    var headerGrp = findW.add("group");
    headerGrp.orientation = "row";
    headerGrp.alignChildren = ["fill", "center"];
    headerGrp.alignment = "fill";
    headerGrp.spacing = 10;
    headerGrp.margins = [8, 8, 8, 0]; // Margens para o cabeçalho

    var titleText = headerGrp.add("statictext", undefined, "BUSCA DE CAMADAS");
    titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
    titleText.preferredSize.width = 0; // Faz com que o texto ocupe o espaço restante
    setFgColor(titleText, normalColor1); // Definir cor do título

    var helpBtn;
    // START: Criação do botão de ajuda com fallback robusto
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
        var helpBtnGroup = headerGrp.add('group');
        helpBtnGroup.alignment = ['right', 'center'];
        helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
        // Atribui o evento de clique para o themeIconButton
        helpBtn.leftClick.onClick = showFindHelp;
    } else {
        // Fallback para botão padrão se themeIconButton não estiver disponível
        helpBtn = headerGrp.add("button", undefined, "?");
        helpBtn.preferredSize = [24, 24];
        helpBtn.helpTip = "Ajuda sobre a Busca de Camadas";
        helpBtn.alignment = ['right', 'center'];
        // Atribui o evento de clique para o botão padrão
        helpBtn.onClick = showFindHelp;
    }
    // END: Criação do botão de ajuda

	//---------------------------------------------------------

	var searchMainGrp = findW.add('group');
	searchMainGrp.orientation = 'column';
	searchMainGrp.alignChildren = ['center', 'top'];

	var inputGrp = searchMainGrp.add('group');
	inputGrp.spacing = 8;
	inputGrp.margins = 8; // Manter margens internas

	var findEdTxt = inputGrp.add('edittext', [0, 0, 240, 32]);

	var findBtn = new themeIconButton(inputGrp, {
		icon: D9T_LENS_ICON,
		tips: [lClick + 'Finders']
	});
	
	// --- INÍCIO DA CORREÇÃO DEFINITIVA ---
	// A função themeIconButton retorna um objeto que tem os botões de clique.
	// O 'parent' do botão de clique é o grupo que contém o ícone.
	// É este grupo que precisa ser redimensionado.
	try {
		findBtn.leftClick.parent.preferredSize = [32, 32];
	} catch(e) {
		// Ignora se a estrutura do botão for diferente e falhar.
	}
	// --- FIM DA CORREÇÃO DEFINITIVA ---


	//---------------------------------------------------------

	var optMainGrp = searchMainGrp.add('group');
	optMainGrp.spacing = 30;

	var optGrp5 = optMainGrp.add('group');
	optGrp5.alignChildren = ['center', 'top'];
	optGrp5.spacing = 2;

	var optCkb5 = optGrp5.add('checkbox');
	optCkb5.value = false;

	var optIco5 = optGrp5.add('image', undefined, eyeOpenLabelIcon);
	optCkb5.helpTip = optIco5.helpTip = '⦿  → apenas layers visíveis';

	//---------------------------------------------------------

	var optGrp1 = optMainGrp.add('group');
	optGrp1.alignChildren = ['center', 'top'];
	optGrp1.spacing = 2;

	var optCkb1 = optGrp1.add('checkbox');
	optCkb1.value = false;

	var optTxt1 = optGrp1.add('statictext', undefined, 'Tt');
	optCkb1.helpTip = optTxt1.helpTip = '⦿  → considerar maiúsculas e minúsculas';

	//---------------------------------------------------------

	var optGrp2 = optMainGrp.add('group');
	optGrp2.alignChildren = ['center', 'top'];
	optGrp2.spacing = 2;

	var optCkb2 = optGrp2.add('checkbox');
	optCkb2.value = false;

	var optTxt2 = optGrp2.add('statictext', undefined, 'àê');
	optCkb2.helpTip = optTxt2.helpTip = '⦿  → considerar acentuação';

	//---------------------------------------------------------

	var optGrp4 = optMainGrp.add('group');
	optGrp4.alignChildren = ['center', 'top'];
	optGrp4.spacing = 2;

	var optCkb4 = optGrp4.add('checkbox');
	optCkb4.value = false;

	var optTxt4 = optGrp4.add('statictext', undefined, '!=');
	optCkb4.helpTip = optTxt4.helpTip = '⦿  → apenas textos que NÃO possuem o termo buscado';

	var findProgressBar = findW.add('progressbar', [0, 0, 280, 1], undefined);
	findProgressBar.value = 100;

	var resultTree = findW.add('treeview', [0, 0, 320, 0]);
	resultTree.visible = false;

	setBgColor(findW, bgColor1);

	//---------------------------------------------------------
	findW.onShow = function () {
		findEdTxt.active = true;
	};

	findEdTxt.onEnterKey = findBtn.leftClick.onClick = function () {
		findW.text = 'BUSCANDO...';
		resultTree.visible = false;
		resultTree.size.height = 0;
		findW.layout.layout(true);

		var sKey = findEdTxt.text;
		if (sKey == '' || app.project.numItems == 0) {
			findW.text = 'BUSCAR...';
			return;
		}
		var optObj = {
			sKey: sKey,
			vis: optCkb5.value,
			matchCase: optCkb1.value,
			matchAccent: optCkb2.value,
			invert: optCkb4.value
		};
		var compsArray = getComps();
		buildTxtSearchTree(resultTree, optObj, compsArray, findProgressBar);
		var count = expandNodes(resultTree);

		if (count < 1) {
			findW.text = 'SEM MATCHES... (っ °Д °;)っ';
			return;
		}
		resultTree.visible = true;
		resultTree.size.height = count >= 16 ? 320 : count * 21 + 5;
		findW.text = 'BUSCA CONCLUÍDA...  (o °▽ °)o☆';
		findW.layout.layout(true);
	};

	//---------------------------------------------------------

	resultTree.onChange = function () {
		var comp = resultTree.selection.comp;
		var t = comp.time;
		var txtLayer;

		if (resultTree.selection.type == 'item') {
			txtLayer = resultTree.selection.txtLayer;

			for (var l = 1; l <= comp.numLayers; l++) {
				comp.layer(l).selected = false;
			}

			t = resultTree.selection.refTime;
			comp.hideShyLayers = !txtLayer.shy;
			txtLayer.selected = true;
		}
		comp.openInViewer();
		comp.time = t;
	};

	//---------------------------------------------------------

    // START - FUNÇÃO DE AJUDA PADRONIZADA (showFindHelp)
    function showFindHelp() {
        var TARGET_HELP_WIDTH = 450;
        var MARGIN_SIZE = 15;
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
        var TOPIC_SPACING = 5;
        var TOPIC_TITLE_INDENT = 0;
        var SUBTOPIC_INDENT = 25;

        // Alterado de 'palette' para 'dialog' para torná-la modal e garantir foco
        var helpWin = new Window("dialog", scriptName + " - Ajuda", undefined, { closeButton: true });
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
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - BUSCA DE CAMADAS");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta localiza e navega entre camadas de texto em suas composições.", {multiline: true});
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
                    { title: "▶ TERMO DE BUSCA:", text: "Procura em todas as camadas de texto do projeto." },
                    { title: "▶ NAVEGAR RESULTADOS:", text: "Clique em uma composição para expandir e ver as camadas de texto correspondentes. Dê um clique duplo em uma camada para ser direcionado para layer." }
                ]
            },
            {
                tabName: "OPÇÕES DE BUSCA",
                topics: [
                    { title: "▶ APENAS VISÍVEIS (👁️):", text: "Se marcado, a busca considerará apenas camadas de texto que estão visíveis na Timeline (não ocultas por Shy ou desativadas)." },
                    { title: "▶ MAIÚSCULAS/MINÚSCULAS (Tt):", text: "Se marcado, a busca diferenciará maiúsculas de minúsculas (ex: 'Texto' será diferente de 'texto')." },
                    { title: "▶ ACENTUAÇÃO (àê):", text: "Se marcado, a busca considerará a acentuação (ex: 'edição' será diferente de 'edicao')." },
                    { title: "▶ INVERTER BUSCA (!=):", text: "Se marcado, a busca retornará apenas as camadas de texto que NÃO contêm o termo buscado." }
                ]
            },
            {
                tabName: "RESULTADOS",
                topics: [
                    { title: "▶ COMPOSIÇÕES:", text: "As composições que contêm camadas de texto com o termo de busca são listadas como itens principais na árvore de resultados. Elas podem ser expandidas para ver as camadas de texto específicas." },
                    { title: "▶ CAMADAS DE TEXTO:", text: "Cada item de camada de texto na árvore mostra o conteúdo do texto. Ao dar um clique duplo, a composição é aberta, a camada é selecionada e o CTI é ajustado para a primeira ocorrência do texto (se aplicável)." }
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
        var closeBtn = closeBtnGrp.add("button", undefined, "OK");
        closeBtn.onClick = function() {
            helpWin.close();
        };

        helpWin.layout.layout(true);
        helpWin.center();
        helpWin.show(); // Abre a janela como modal
    };
    // END - FUNÇÃO DE AJUDA PADRONIZADA

	findW.show();
}