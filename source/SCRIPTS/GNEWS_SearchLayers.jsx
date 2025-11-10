/**********************************************************************************
 *
 * GNEWS SEARCHLAYERS
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 2.6 (Padrão GNEWS com UI Clássica)
 *
 * MODULOS USADOS:
 * source/globals.js (para variáveis de tema e cores)
 * source/libraries/HELP lib.js (para a janela de ajuda)
 * source/layout/main_ui_functions.js (para o componente themeIconButton)
 * source/libraries/ICON lib.js (para os ícones da UI)
 *
 * ATUALIZAÇÃO:
 * - PADRONIZAÇÃO: O script foi reformatado para seguir o padrão dos outros
 * scripts GNEWS, com seção de configuração rápida e comentários didáticos.
 * - TÍTULOS E CORES: Título e subtítulo atualizados. O subtítulo agora
 * utiliza a cor de destaque global (vermelho).
 * - AJUDA NÃO-MODAL: A janela de ajuda foi alterada de 'dialog' para 'palette',
 * permitindo a interação com a janela principal enquanto a ajuda está aberta.
 * - CODIFICAÇÃO: Garantido o uso de $.encoding = "UTF-8".
 *
 **********************************************************************************/
$.encoding = "UTF-8";

function findDialog() {
	// =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// Aqui você pode ajustar facilmente a aparência e o comportamento do script.
	// =================================================================================
	var SCRIPT_NAME = "GNEWS SEARCHLAYERS";
	var SCRIPT_SUBTITLE = "Localiza e navega entre camadas de texto."; // ATUALIZADO
	var SCRIPT_VERSION = "2.6";
	var SCRIPT_WINDOW_TITLE = SCRIPT_NAME + " " + SCRIPT_VERSION;

	// Configurações de Tamanho da Interface
	var LARGURA_JANELA = 320;
	var ALTURA_INPUT_BUSCA = 32;
	var LARGURA_INPUT_BUSCA = 240;
	var TAMANHO_ICONE_BUSCA = 32;
	var TAMANHO_BOTAO_AJUDA = 24;
	var ALTURA_MAX_RESULTADOS = 320; // Altura máxima em pixels para a lista de resultados
	var ALTURA_ITEM_RESULTADO = 21;  // Altura de cada item na lista para cálculo dinâmico

	// =================================================================================
	// --- FUNÇÕES AUXILIARES DE TEMA (com fallback) ---
	// Funções para aplicar cores à interface. Incluídas localmente para garantir
    // que o script funcione mesmo se o 'globals.js' não for encontrado.
	// =================================================================================

	// Converte uma string de cor hexadecimal (ex: '#FF0000') para um array RGB normalizado (ex: [1, 0, 0])
	function hexToRgb(hex) {
		if (hex == undefined) return [Math.random(), Math.random(), Math.random()];
		hex = hex.replace('#', '');
		var r = parseInt(hex.substring(0, 2), 16);
		var g = parseInt(hex.substring(2, 4), 16);
		var b = parseInt(hex.substring(4, 6), 16);
		return [r / 255, g / 255, b / 255];
	}

	// Define a cor de fundo de um elemento da UI.
	function setBgColor(element, hexColor) {
		try {
			var color = (typeof bgColor1 !== 'undefined') ? hexToRgb(hexColor) : [0.1, 0.1, 0.1];
			var bType = element.graphics.BrushType.SOLID_COLOR;
			element.graphics.backgroundColor = element.graphics.newBrush(bType, color);
		} catch (e) { /* Falha silenciosa em caso de erro */ }
	}

	// Define a cor do texto/frente de um elemento da UI.
	function setFgColor(element, hexColor) {
		try {
			var color = (typeof normalColor1 !== 'undefined') ? hexToRgb(hexColor) : [0.9, 0.9, 0.9];
			var pType = element.graphics.PenType.SOLID_COLOR;
			element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1);
		} catch (e) { /* Falha silenciosa em caso de erro */ }
	}

	// =================================================================================
	// --- CONSTRUÇÃO DA INTERFACE GRÁFICA (UI) ---
	// =================================================================================

	// Cria a janela principal do tipo 'palette' (painel flutuante).
	var findW = new Window('palette', SCRIPT_WINDOW_TITLE);
	findW.spacing = 4;
	findW.margins = 0;
    findW.preferredSize.width = LARGURA_JANELA;

	// --- CABEÇALHO ---
	// Grupo que contém o título (subtítulo) da UI e o botão de ajuda.
	var headerGrp = findW.add("group");
	headerGrp.orientation = "row";
	headerGrp.alignChildren = ["fill", "center"];
	headerGrp.alignment = "fill";
	headerGrp.spacing = 10;
	headerGrp.margins = [8, 8, 8, 0];

	// Texto do subtítulo.
	var titleText = headerGrp.add("statictext", undefined, SCRIPT_SUBTITLE);
	titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
	// Aplica a cor de destaque (vermelho) vinda do tema global.
	setFgColor(titleText, (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003c');

	// --- BOTÃO DE AJUDA ---
	// Tenta criar um botão de ajuda com ícone; se falhar, cria um botão de texto padrão.
	var helpBtn;
	// O 'themeIconButton' é uma função customizada da biblioteca 'main_ui_functions.js'.
	if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
		var helpBtnGroup = headerGrp.add('group');
		helpBtnGroup.alignment = ['right', 'center'];
		helpBtn = new themeIconButton(helpBtnGroup, {
			icon: D9T_INFO_ICON,
			tips: [lClick + 'Ajuda']
		});
		// Associa a função de ajuda ao evento de clique.
		helpBtn.leftClick.onClick = function() { showFindHelp(); };
	} else {
		// Fallback para um botão de texto padrão '?' caso as bibliotecas de UI não estejam carregadas.
		helpBtn = headerGrp.add("button", undefined, "?");
		helpBtn.preferredSize = [TAMANHO_BOTAO_AJUDA, TAMANHO_BOTAO_AJUDA];
		helpBtn.helpTip = "Ajuda sobre a Busca de Camadas";
		helpBtn.alignment = ['right', 'center'];
		helpBtn.onClick = function() { showFindHelp(); };
	}

	// --- GRUPO PRINCIPAL DE BUSCA ---
	// Contém a caixa de texto para entrada e o botão para iniciar a busca.
	var searchMainGrp = findW.add('group');
	searchMainGrp.orientation = 'column';
	searchMainGrp.alignChildren = ['center', 'top'];

	var inputGrp = searchMainGrp.add('group');
	inputGrp.spacing = 8;
	inputGrp.margins = 8;

	// Campo de texto para o usuário digitar o termo de busca.
	var findEdTxt = inputGrp.add('edittext', [0, 0, LARGURA_INPUT_BUSCA, ALTURA_INPUT_BUSCA]);

	// Botão com ícone de lupa para iniciar a busca.
    var findBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_LENS_ICON !== 'undefined') {
        findBtn = new themeIconButton(inputGrp, {
            icon: D9T_LENS_ICON,
            tips: [lClick + 'Buscar']
        });
        // Ajusta o tamanho do grupo do ícone para ser um quadrado.
        try { findBtn.leftClick.parent.preferredSize = [TAMANHO_ICONE_BUSCA, TAMANHO_ICONE_BUSCA]; } catch (e) {}
    } else {
        // Fallback para um botão de texto simples.
        findBtn = { leftClick: inputGrp.add("button", undefined, "Buscar") };
    }


	// --- GRUPO DE OPÇÕES DE FILTRO ---
	// Contém as caixas de seleção (checkboxes) para refinar a busca.
	var optMainGrp = searchMainGrp.add('group');
	optMainGrp.spacing = 30;

	// Opção 1: Buscar apenas em camadas visíveis.
	var optGrp5 = optMainGrp.add('group');
	optGrp5.alignChildren = ['center', 'top'];
	optGrp5.spacing = 2;
	var optCkb5 = optGrp5.add('checkbox');
	optCkb5.value = false;
	var optIco5 = optGrp5.add('image', undefined, eyeOpenLabelIcon); // Ícone de olho.
	optCkb5.helpTip = optIco5.helpTip = '⦿  → apenas layers visíveis';

	// Opção 2: Diferenciar maiúsculas de minúsculas (case-sensitive).
	var optGrp1 = optMainGrp.add('group');
	optGrp1.alignChildren = ['center', 'top'];
	optGrp1.spacing = 2;
	var optCkb1 = optGrp1.add('checkbox');
	optCkb1.value = false;
	var optTxt1 = optGrp1.add('statictext', undefined, 'Tt');
	optCkb1.helpTip = optTxt1.helpTip = '⦿  → considerar maiúsculas e minúsculas';

	// Opção 3: Diferenciar acentuação.
	var optGrp2 = optMainGrp.add('group');
	optGrp2.alignChildren = ['center', 'top'];
	optGrp2.spacing = 2;
	var optCkb2 = optGrp2.add('checkbox');
	optCkb2.value = false;
	var optTxt2 = optGrp2.add('statictext', undefined, 'àê');
	optCkb2.helpTip = optTxt2.helpTip = '⦿  → considerar acentuação';

	// Opção 4: Inverter a busca (encontrar camadas que NÃO contêm o termo).
	var optGrp4 = optMainGrp.add('group');
	optGrp4.alignChildren = ['center', 'top'];
	optGrp4.spacing = 2;
	var optCkb4 = optGrp4.add('checkbox');
	optCkb4.value = false;
	var optTxt4 = optGrp4.add('statictext', undefined, '!=');
	optCkb4.helpTip = optTxt4.helpTip = '⦿  → apenas textos que NÃO possuem o termo buscado';

	// --- BARRA DE PROGRESSO E ÁRVORE DE RESULTADOS ---
	var findProgressBar = findW.add('progressbar', [0, 0, 280, 1], undefined);
	findProgressBar.value = 100; // Inicia cheia.

	// A 'treeview' é o componente que exibirá a lista de resultados hierárquica.
	// Começa invisível e com altura zero.
	var resultTree = findW.add('treeview', [0, 0, 320, 0]);
	resultTree.visible = false;

	// Aplica a cor de fundo principal do tema à janela.
	setBgColor(findW, (typeof bgColor1 !== 'undefined') ? bgColor1 : '#00040a');

	// =================================================================================
	// --- EVENTOS E LÓGICA DA INTERFACE ---
	// =================================================================================

	// Evento disparado quando a janela é exibida pela primeira vez.
	findW.onShow = function() {
		// Coloca o foco (cursor) no campo de texto para o usuário já poder digitar.
		findEdTxt.active = true;
	};

	// Define a mesma ação para o clique no botão de busca e para a tecla 'Enter' no campo de texto.
	findEdTxt.onEnterKey = findBtn.leftClick.onClick = function() {
		// Muda o título da janela para indicar que a busca está em progresso.
		findW.text = 'BUSCANDO...';
		// Esconde e recolhe a árvore de resultados de buscas anteriores.
		resultTree.visible = false;
		resultTree.size.height = 0;
		findW.layout.layout(true); // Força a UI a se redesenhar.

		var sKey = findEdTxt.text;
		// Validação: se o campo de busca estiver vazio ou não houver itens no projeto, interrompe.
		if (sKey == '' || app.project.numItems == 0) {
			findW.text = SCRIPT_WINDOW_TITLE; // Reseta o título da janela.
			alert("Por favor, digite um termo para buscar.");
			return;
		}

		// Cria um objeto para passar todas as opções de filtro para a função de busca.
		var optObj = {
			sKey: sKey,
			vis: optCkb5.value,
			matchCase: optCkb1.value,
			matchAccent: optCkb2.value,
			invert: optCkb4.value
		};

        // As funções 'getComps', 'buildTxtSearchTree' e 'expandNodes' são importadas
        // das bibliotecas ('FUNC lib.js' e 'treeView lib.js').
		var compsArray = getComps(); // Pega todas as comps do projeto.
		buildTxtSearchTree(resultTree, optObj, compsArray, findProgressBar); // Preenche a árvore com os resultados.
		var count = expandNodes(resultTree); // Expande os nós da árvore e retorna o número de resultados.

        // Atualiza o título da janela com base no resultado da busca.
		if (count < 1) {
			findW.text = 'SEM RESULTADOS... (っ °Д °;)っ';
		} else {
            resultTree.visible = true;
            // Ajusta a altura da árvore de resultados dinamicamente, até um limite máximo.
            var newHeight = Math.min(ALTURA_MAX_RESULTADOS, (count * ALTURA_ITEM_RESULTADO) + 5);
            resultTree.size.height = newHeight;
            findW.text = 'BUSCA CONCLUÍDA...  (o °▽ °)o☆';
        }
		findW.layout.layout(true); // Atualiza o layout da janela para mostrar a árvore.
	};

	// Evento disparado quando o usuário clica em um item na árvore de resultados.
	resultTree.onChange = function() {
		// Garante que algo foi realmente selecionado.
		if (!resultTree.selection) return;

		var comp = resultTree.selection.comp; // Obtém a composição associada ao item.
		var t = comp.time;
		var txtLayer;

		// Se o item selecionado for uma camada (tipo 'item') e não um nó de comp.
		if (resultTree.selection.type == 'item') {
			txtLayer = resultTree.selection.txtLayer; // Obtém a camada de texto.
			// Desseleciona todas as outras camadas na comp para focar na camada encontrada.
			for (var l = 1; l <= comp.numLayers; l++) {
				comp.layer(l).selected = false;
			}
			t = resultTree.selection.refTime; // Pega o tempo de referência (keyframe).
			comp.hideShyLayers = !txtLayer.shy; // Garante que a camada não esteja oculta por 'shy'.
			txtLayer.selected = true; // Seleciona a camada.
		}

		// Abre a composição no painel de visualização e move o indicador de tempo para o local relevante.
		comp.openInViewer();
		comp.time = t;
	};

	// Exibe a janela criada.
	findW.show();
}

/**
 * showFindHelp() - Janela de Ajuda para a Ferramenta de Busca de Camadas
 *
 * DESCRIÇÃO:
 * - Esta função cria e exibe uma janela de ajuda temática e NÃO-MODAL (palette).
 * - É aut contida, com suas próprias funções de cor, para funcionar mesmo que
 * as bibliotecas globais não carreguem corretamente.
 */
function showFindHelp() {
	// --- Configurações de Layout da Janela de Ajuda ---
	var TARGET_HELP_WIDTH = 450;
	var MARGIN_SIZE = 15;
	var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
	var TOPIC_SPACING = 5;

	// --- Funções de Cor Internas com Fallback ---
	function _hexToRgb(hex) {
		var defaultColor = [0.1, 0.1, 0.1];
        if (hex == undefined) return defaultColor;
		hex = hex.replace('#', '');
        if (hex.length < 6) return defaultColor;
		var r = parseInt(hex.substring(0, 2), 16) / 255;
		var g = parseInt(hex.substring(2, 4), 16) / 255;
		var b = parseInt(hex.substring(4, 6), 16) / 255;
		return [r, g, b, 1];
	}
	function _setBgColor(element, hexColor) {
		try {
            var color = (typeof bgColor1 !== 'undefined') ? _hexToRgb(bgColor1) : _hexToRgb(hexColor);
			element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color);
		} catch (e) {}
	}
	function _setFgColor(element, hexColor, defaultHex) {
		try {
            var color = _hexToRgb(hexColor || defaultHex);
			element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
		} catch (e) {}
	}

	// --- Construção da Janela ---
	// ATUALIZADO: Usando 'palette' para ser não-modal.
	var helpWin = new Window("palette", "Busca de Camadas - Ajuda", undefined, { closeButton: true });
	helpWin.orientation = "column";
	helpWin.alignChildren = ["fill", "fill"];
	helpWin.spacing = 10;
	helpWin.margins = MARGIN_SIZE;
	helpWin.preferredSize = [TARGET_HELP_WIDTH, -1]; // Largura fixa, altura automática.
	_setBgColor(helpWin, '#0B0D0E'); // Cor de fundo padrão.

	// Painel de cabeçalho.
	var headerPanel = helpWin.add("panel", undefined, "");
	headerPanel.alignChildren = ["fill", "top"];
	headerPanel.margins = 15;

	var titleText = headerPanel.add("statictext", undefined, "AJUDA - BUSCA DE CAMADAS");
	titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
	titleText.alignment = ["center", "center"];
	_setFgColor(titleText, (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003c'); // Cor de destaque.

	var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta localiza e navega entre camadas de texto em suas composições.", { multiline: true });
	_setFgColor(mainDescText, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#e6e6e6'); // Cor de texto normal.

	// Painel com abas (tabs) para organizar o conteúdo da ajuda.
	var topicsTabPanel = helpWin.add("tabbedpanel");
	topicsTabPanel.alignment = ["fill", "fill"];
	topicsTabPanel.margins = 15;

	// Estrutura de dados com todo o conteúdo da ajuda, separado por abas e tópicos.
	var allHelpTopics = [{
		tabName: "USO BÁSICO",
		topics: [{
			title: "▶ TERMO DE BUSCA:",
			text: "Digite o texto que deseja encontrar e pressione Enter ou clique no ícone de lupa. A busca será realizada em todas as camadas de texto do projeto."
		}, {
			title: "▶ NAVEGAR RESULTADOS:",
			text: "Clique no nome de uma composição na lista de resultados para expandir e ver as camadas de texto correspondentes. Clique em uma camada para selecioná-la e navegar até ela na timeline."
		}]
	}, {
		tabName: "OPÇÕES DE BUSCA",
		topics: [{
			title: "▶ APENAS VISÍVEIS (👁️):",
			text: "Se marcado, a busca considerará apenas camadas de texto que estão visíveis na Timeline (não ocultas por 'Shy' ou com o 'olho' desativado)."
		}, {
			title: "▶ MAIÚSCULAS/MINÚSCULAS (Tt):",
			text: "Se marcado, a busca diferenciará maiúsculas de minúsculas (ex: 'Texto' será diferente de 'texto')."
		}, {
			title: "▶ ACENTUAÇÃO (àê):",
			text: "Se marcado, a busca considerará a acentuação (ex: 'edição' será diferente de 'edicao')."
		}, {
			title: "▶ INVERTER BUSCA (!=):",
			text: "Se marcado, a busca retornará apenas as camadas de texto que NÃO contêm o termo buscado."
		}]
	}, {
		tabName: "RESULTADOS",
		topics: [{
			title: "▶ COMPOSIÇÕES:",
			text: "As composições que contêm camadas de texto com o termo de busca são listadas como itens principais. Elas podem ser expandidas para ver as camadas."
		}, {
			title: "▶ CAMADAS DE TEXTO:",
			text: "Cada item de camada na árvore mostra o conteúdo do texto. Ao clicar, a composição é aberta, a camada é selecionada e o indicador de tempo é ajustado."
		}]
	}];

	// Loop para construir dinamicamente as abas e o conteúdo a partir da estrutura de dados.
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

			var topicTitle = topicGrp.add("statictext", undefined, topic.title);
			topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
			_setFgColor(topicTitle, (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003c');

			if (topic.text !== "") {
				var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
				topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
				_setFgColor(topicText, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#e6e6e6');
			}
		}
	}

	// Botão para fechar a janela de ajuda.
	var closeBtnGrp = helpWin.add("group");
	closeBtnGrp.alignment = "center";
	closeBtnGrp.margins = [0, 10, 0, 0];
	var closeBtn = closeBtnGrp.add("button", undefined, "OK");
	closeBtn.onClick = function() { helpWin.close(); };

	// Finaliza o layout, centraliza e exibe a janela.
	helpWin.layout.layout(true);
	helpWin.center();
	helpWin.show();
}
