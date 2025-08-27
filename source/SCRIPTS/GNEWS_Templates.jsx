/*

---------------------------------------------------------------
> 🪟 UI dialogs
---------------------------------------------------------------

*/

// Interface de templates GNEWS
function d9TemplateDialog() {
	// Título da janela
	var scriptName = 'GNEWS TEMPLATES';

	var compactWidth; // Largura da janela sem a pré-visualização
	var extendedWidth; // Largura da janela com a pré-visualização
	var fileFilter = ['.aep', '.aet']; // Extensões de template permitidas
	var hasInputData = false; // Indica se há dados de input
	var hasInputLayers = false; // Template possui layers editáveis

	// Arquivos do template
	var projectFile;
	var previewFile;
	var configFile;
	var scriptFile;

	// Dados da configuração template
	var templateData;

	// Arrays acessíveis a um script externo
	var inputTextArray = []; // Array com os textos de input
	var newCompsArray = []; // Array de templates criados
	var newOutputsArray = []; // Array de módulos individuais de saída

	// ✅ VARIÁVEIS PARA INPUT REMOVIDAS
	var hasInputData = false; // Removido mas mantido para compatibilidade
	var hasInputLayers = false; // Removido mas mantido para compatibilidade

	// Carrega dados das artes GNEWS
	var artesData = null;
	try {
		var artesDataFile = new File(scriptMainPath + 'source/libraries/dados_json/DADOS_artes_gnews.json');
		if (artesDataFile.exists) {
			artesDataFile.open('r');
			var artesDataContent = artesDataFile.read();
			artesDataFile.close();
			artesData = JSON.parse(artesDataContent);
		}
	} catch (err) {
		// Falha silenciosa se não conseguir carregar dados das artes
	}

	// Função para Finders dados da arte pelo código
	function getArteData(codigo) {
		if (!artesData || !artesData.artes_codificadas) return null;
		
		for (var i = 0; i < artesData.artes_codificadas.length; i++) {
			if (artesData.artes_codificadas[i].codigo === codigo) {
				return artesData.artes_codificadas[i];
			}
		}
		return null;
	}

    // Definindo cores para consistência, se não vierem de um arquivo global
    var bgColor1 = '#0B0D0E'; // Cor de fundo principal
    var normalColor1 = '#C7C8CA'; // Cor de texto normal
	var monoColor0 = '#686F75'; // Cor cinza para o placeholder
	var monoColor2 = '#302b2bff';
	var normalColor2 = '#ffffffff';
    var highlightColor1 = '#E0003A'; // Cor de destaque para títulos de tópico
    // Funções de cor necessárias para o tema
    function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
    function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) {} }
    function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) {} }

	// Janela principal - ✅ PALETTE para não bloquear cliques
	var D9T_TEMPLATES_w = new Window('palette', scriptName + ' ' + scriptVersion);

	// Grupo principal
	var mainGrp = D9T_TEMPLATES_w.add('group');
	mainGrp.orientation = 'stack';

	// Grupo de opções e progresso
	var optionsMainGrp = mainGrp.add('group');
	optionsMainGrp.orientation = 'column';
	optionsMainGrp.spacing = 12;
	optionsMainGrp.alignment = ['left', 'top'];
	optionsMainGrp.visible = false;

	// Rótulo de informações
	var infoHeaderLab = optionsMainGrp.add('statictext', [0, 0, 320, 18]);
	setFgColor(infoHeaderLab, normalColor1); // Define a cor do texto
	// Barra de progresso
	var progressBar = optionsMainGrp.add('progressbar', [0, 0, 320, 1]);

	var optBtnMainGrp = optionsMainGrp.add('group');
	optBtnMainGrp.orientation = 'stack';
	optBtnMainGrp.alignment = 'fill';
	optBtnMainGrp.margins = [0, 32, 0, 0];
	optBtnMainGrp.visible = false;

	var optBtnMainGrpL = optBtnMainGrp.add('group');
	optBtnMainGrpL.alignment = 'left';
	optBtnMainGrpL.spacing = 16;

	// Botão de cancelar
	var cancelBtn = new themeButton(optBtnMainGrpL, {
		width: 80,
		height: 32,
		labelTxt: 'cancelar',
		tips: [lClick + 'cancelar operação']
	});

	var optBtnMainGrpR = optBtnMainGrp.add('group');
	optBtnMainGrpR.alignment = 'right';
	optBtnMainGrpR.spacing = 16;

	// Botão de continuar
	var nextBtn = new themeButton(optBtnMainGrpR, {
		width: 100,
		height: 32,
		textColor: bgColor1,
		buttonColor: normalColor1,
		labelTxt: 'continuar',
		tips: [lClick + 'continuar processo']
	});

	// ----------------------------------------------------------------------------

	// Grupo da interface de templates
	var templatesMainGrp = mainGrp.add('group');
	templatesMainGrp.spacing = 12;

	// Grupo vertical esquerdo
	var vGrp1 = templatesMainGrp.add('group');
	vGrp1.orientation = 'column';
	vGrp1.alignment = ['center', 'top'];
	vGrp1.alignChildren = 'left';
	vGrp1.spacing = 12;

	// Grupo vertical direito
	var vGrp2 = templatesMainGrp.add('group');
	vGrp2.orientation = 'column';
	vGrp2.alignment = ['center', 'top'];
	vGrp2.alignChildren = 'left';
	vGrp2.spacing = 12;
	vGrp2.visible = false;

	// ----------------------------------------------------------------------------
	// --- INÍCIO DA ADIÇÃO DO DROPDOWN DE PRODUÇÃO ---

	var prodHeaderGrp = vGrp1.add('group');
    prodHeaderGrp.alignment = 'fill';
    prodHeaderGrp.orientation = 'stack';
    var prodLab = prodHeaderGrp.add('statictext', undefined, 'PRODUÇÃO:');
    setFgColor(prodLab, normalColor1);
    
    var prodGrp = vGrp1.add('group');
    prodGrp.spacing = 4;
    prodGrp.alignment = 'fill';
    
    var prodIconGrp = prodGrp.add('group');
    prodIconGrp.orientation = 'stack';
    populateMainIcons(prodIconGrp);
    
    var prodDrop = prodGrp.add('dropdownlist', undefined, getProdNames(D9T_prodArray));
    prodDrop.selection = 0;
    prodDrop.alignment = ['fill', 'center'];
    prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
    
    var divProd = themeDivider(vGrp1);
    divProd.alignment = ['fill', 'center'];

	// --- FIM DA ADIÇÃO DO DROPDOWN DE PRODUÇÃO ---
	// ----------------------------------------------------------------------------


	// Grupo para o cabeçalho da busca
	var templatesHeaderGrp = vGrp1.add('group');
	templatesHeaderGrp.alignment = 'fill';
	templatesHeaderGrp.orientation = 'stack';

	// Grupo do rótulo da seção BUSCA
	var templateLabGrp = templatesHeaderGrp.add('group');
	templateLabGrp.alignment = 'left';

	// Cria o rótulo 'BUSCA:'
	var templateLab = templateLabGrp.add('statictext', undefined, 'BUSCA:');
	setFgColor(templateLab, normalColor1); // Define a cor do rótulo

	// Cria um grupo para o botão de informações
	var infoGrp = templatesHeaderGrp.add('group');
	infoGrp.alignment = ['right', 'center'];

	// Botão de ajuda
	var infoBtn = new themeIconButton(infoGrp, {
		icon: D9T_INFO_ICON,
		tips: [lClick + 'ajuda | DOCS']
	});

	// Grupo da árvore de templates
	var treeGrp = vGrp1.add('group');
	treeGrp.orientation = 'column';
	treeGrp.spacing = 4;
	
	var placeholderText = '⌕  Digite para Finders...';
	
	// Cria a caixa de pesquisa
	var searchBox = treeGrp.add('edittext', [0, 0, 320, 24], '');
	searchBox.text = placeholderText;
	setFgColor(searchBox, monoColor0); // Cor cinza para o placeholder
	
	// Cria a árvore de templates
	var templateTree = treeGrp.add('treeview', [0, 0, 320, 420]); // Altura ajustada
	setFgColor(templateTree, monoColor2);
	buildTree(templatesFolder, templateTree, fileFilter); // Cria a árvore de templates

	// Grupo principal de botões
	var mainBtnGrp1 = vGrp1.add('group');
	mainBtnGrp1.orientation = 'stack';
	mainBtnGrp1.alignment = 'fill';
	mainBtnGrp1.margins = [0, 8, 0, 0];
	

	// Grupo de botões esquerdo
	var lBtnGrp1 = mainBtnGrp1.add('group');
	lBtnGrp1.alignment = 'left';
	lBtnGrp1.spacing = 16;
	// Botão de atualizar
	var refreshBtn = new themeIconButton(lBtnGrp1, {
		icon: D9T_ATUALIZAR_ICON,
		tips: [lClick + 'atualizar lista de templates']
	});
	// Botão de abrir pasta
	var openFldBtn = new themeIconButton(lBtnGrp1, {
		icon: D9T_PASTA_ICON,
		tips: [lClick + 'abrir pasta de templates']
	});

	//---------------------------------------------------------

	// Grupo para o cabeçalho
	var previewHeaderGrp = vGrp2.add('group');
	previewHeaderGrp.alignment = 'fill';
	previewHeaderGrp.orientation = 'stack';

	// Grupo do rótulo da seção PREVIEW
	var previewLabGrp = previewHeaderGrp.add('group');
	previewLabGrp.alignment = 'left';

	// Rótulo PREVIEW
	var previewLab = previewLabGrp.add('statictext', undefined, 'PREVIEW:');
	setFgColor(previewLab, normalColor1); // Define a cor do texto

	// Grupo da imagem preview
	var previewGrp = vGrp2.add('group');
	previewGrp.orientation = 'column';
	previewGrp.alignChildren = 'left';

	// ✅ PREVIEW AUMENTADO - de [440, 250] para [600, 338]
	var previewImg = previewGrp.add('image', [0, 0, 600, 338], no_preview);

	// ----------------------------------------------------------------------------

	// Divisor horizontal
	var newDiv = themeDivider(vGrp2);
	newDiv.alignment = ['fill', 'center'];

	// ----------------------------------------------------------------------------

	// ✅ SEÇÃO DE INFORMAÇÕES DA ARTE GNEWS (substituindo dicas e input)
	var infoArteMainGrp = vGrp2.add('group');
	infoArteMainGrp.alignment = ['left', 'top'];
	infoArteMainGrp.spacing = 12;

	// ✅ CAMPO INPUT REMOVIDO - apenas informações da arte
	var arteInfoGrp = infoArteMainGrp.add('group');
	arteInfoGrp.orientation = 'column';
	arteInfoGrp.alignment = ['left', 'top'];
	arteInfoGrp.alignChildren = 'left';

	// ----------------------------------------------------------------------------

	// Cabeçalho da seção INFORMAÇÕES DA ARTE
	var arteHeaderGrp = arteInfoGrp.add('group');
	arteHeaderGrp.alignment = 'fill';
	arteHeaderGrp.orientation = 'stack';

	var arteLabGrp = arteHeaderGrp.add('group');
	arteLabGrp.alignment = 'left';

	var arteLab = arteLabGrp.add('statictext', undefined, 'INFORMAÇÕES DA ARTE:');
	setFgColor(arteLab, normalColor1);

	// Campo para código da arte
	var codigoGrp = arteInfoGrp.add('group');
	codigoGrp.orientation = 'row';
	codigoGrp.alignChildren = ['left', 'center'];
	codigoGrp.spacing = 8;
	codigoGrp.margins = [0, 8, 0, 0];

	var codigoLab = codigoGrp.add('statictext', undefined, 'Código:');
	codigoLab.preferredSize.width = 60;
	setFgColor(codigoLab, monoColor0);

	var codigoTxt = codigoGrp.add('edittext', [0, 0, 120, 24], 'GNVZ036');
	codigoTxt.helpTip = 'Digite o código da arte (ex: GNVZ036)';

	// Informações carregadas automaticamente
	var infoRows = [
		{ label: 'Nome da Arte:', value: '---' },
		{ label: 'Servidor Destino:', value: '---' },
		{ label: 'Última Atualização:', value: new Date().toLocaleDateString('pt-BR') }
	];

	var infoLabels = [];
	var infoValues = [];

	for (var r = 0; r < infoRows.length; r++) {
		var infoRow = arteInfoGrp.add('group');
		infoRow.orientation = 'row';
		infoRow.alignChildren = ['left', 'center'];
		infoRow.spacing = 8;
		infoRow.margins = [0, 2, 0, 0];

		var label = infoRow.add('statictext', undefined, infoRows[r].label);
		label.preferredSize.width = 100;
		setFgColor(label, monoColor0);
		infoLabels.push(label);

		var value = infoRow.add('statictext', undefined, infoRows[r].value);
		value.preferredSize.width = 180;
		setFgColor(value, normalColor2);
		infoValues.push(value);
	}

	// Função para atualizar informações da arte
	function updateArteInfo() {
		try {
			var codigo = codigoTxt.text.trim().toUpperCase();
			var arteData = getArteData(codigo);
			
			if (arteData) {
				infoValues[0].text = arteData.arte || '---';
				infoValues[1].text = arteData.servidor_destino || '---';
				infoValues[2].text = new Date().toLocaleDateString('pt-BR');
			} else {
				infoValues[0].text = codigo ? 'Código não encontrado' : '---';
				infoValues[1].text = '---';
				infoValues[2].text = '---';
			}
		} catch (e) {
			infoValues[0].text = 'Erro ao carregar';
			infoValues[1].text = '---';
			infoValues[2].text = '---';
		}
	}

	// Event listener para o campo de código
	codigoTxt.onChanging = function() {
		try {
			updateArteInfo();
		} catch (e) {
			// Falha silenciosa
		}
	};

	// ----------------------------------------------------------------------------

	// Grupo principal de botões direito
	var mainBtnGrp2 = vGrp2.add('group');
	mainBtnGrp2.orientation = 'stack';
	mainBtnGrp2.alignment = 'fill';

	// ✅ SEM BOTÃO OUTPUT - apenas botão importar centralizado
	var rBtnGrp2 = mainBtnGrp2.add('group');
	rBtnGrp2.alignment = 'right';
	rBtnGrp2.spacing = 16;

	// ✅ BOTÃO SIMPLIFICADO - apenas importar template (sem input)
	var importBtn = new themeButton(rBtnGrp2, {
		width: 120,
		height: 32,
		textColor: bgColor1,
		buttonColor: normalColor1,
		labelTxt: 'importar',
		tips: [lClick + 'importar o template selecionado']
	});

	setBgColor(D9T_TEMPLATES_w, bgColor1); // Define a cor de fundo da janela

	//---------------------------------------------------------
	// --- INÍCIO DA ADIÇÃO DOS EVENTOS ---
	//---------------------------------------------------------
	
	prodDrop.onChange = function () {
		var i = this.selection.index;
		changeIcon(i, prodIconGrp); // Atualiza o ícone da produção
		
		// Atualiza as variáveis globais de caminho
		templatesPath = D9T_prodArray[i].templatesPath;
		templatesFolder = new Folder(D9T_prodArray[i].templatesPath);
		
		if (!templatesFolder.exists) {
			alert(lol + "#D9T_002 - pasta de templates não localizada...");
			return;
		}
		
		// Reconstrói a árvore com o novo caminho e expande os nós
		buildTree(templatesFolder, templateTree, fileFilter);
		templateTree.expanded = true;
		var branches = templateTree.items;
		for (var b = 0; b < branches.length; b++) {
			if (branches[b].type == 'node') {
				branches[b].expanded = true;
			}
		}
	};

	D9T_TEMPLATES_w.onShow = function () {
		// Expande a raiz da árvore de templates
		templateTree.expanded = true;

		// Expande as pastas de nível 1
		var branches = templateTree.items;

		for (var i = 0; i < branches.length; i++) {
			var s = branches[i];

			if (s.type == 'node') s.expanded = true;
		}

		// Calcula e armazena as dimensões da janela
		extendedWidth = D9T_TEMPLATES_w.size.width; // Com preview
		compactWidth = extendedWidth - 680; // Sem preview (ajustado para preview maior)

		// ✅ ABRE DIRETO NO TAMANHO TOTAL - mostra a área de preview imediatamente
		vGrp2.visible = true;
		newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;

		// Foco na caixa de pesquisa
		searchBox.active = true;

		// Inicializa informações da arte
		updateArteInfo();
	};

	searchBox.onFocus = function() {
		if (this.text === placeholderText) {
			this.text = '';
			setFgColor(this, normalColor1); // Muda para a cor de texto normal
		}
	};

	searchBox.onBlur = function() {
		if (this.text.trim() === '') {
			this.text = placeholderText;
			setFgColor(this, monoColor0); // Volta para a cor do placeholder
		}
	};

	searchBox.onEnterKey = function () {
		templateLab.active = true;
		templateTree.active = true;
	};
	
	searchBox.onChanging = function () {
		// Aborta se a pesquisa estiver vazia ou for o placeholder
		if (this.text.trim() === '' || this.text === placeholderText) {
			buildTree(templatesFolder, templateTree, fileFilter); // Reconstrói a árvore completa se o campo estiver vazio
			return;
		}
		
		try {
			// Formatação do texto de pesquisa
			var searchTerm = this.text.trim().toUpperCase().replaceSpecialCharacters();

			// Atualiza a árvore de templates
			buildTree(templatesFolder, templateTree, fileFilter);

			// Encontra os itens na árvore
			var items = findItem(templateTree, [], searchTerm);

			// Aborta se nenhum item for encontrado
			if (items.length == 0) return;

			// Expande as pastas para mostrar os resultados da pesquisa
			for (var n = 0; n < items.length; n++) {
				var s = items[n];

				if (s.type == 'node') s.expanded = true;

				// Expande as pastas do item até a raiz
				while (s.parent.constructor.name != 'TreeView') {
					s.parent.expanded = true;
					s = s.parent;
				}
			}
		} catch(e) {
			// falha silenciosa para não interromper a digitação
		}
	};
	
	templateTree.onChange = function () {
		// Pastas na árvore não devem ser selecionáveis
		if (this.selection != null && this.selection.type == 'node') this.selection = null;

		// Caso nenhum template seja selecionado
		if (this.selection == null) {
			// ✅ MANTÉM TAMANHO TOTAL mesmo sem seleção
			return;
		}

		// arquivo de projeto do template
		projectFile = this.selection.file;

		// Base do nome dos arquivos template --> caminho do projeto/nome do template
		var templateBase = projectFile.path + '/' + deleteFileExt(projectFile.displayName);

		// Criação dos objetos File para os arquivos do template
		previewFile = new File(templateBase + '_preview.png');
		configFile = new File(templateBase + '_config.json');
		scriptFile = new File(templateBase + '_script.js');

		if (previewFile.exists) {
			previewImg.image = previewFile;
		} else {
			previewImg.image = no_preview;
		}

		// Mostra a área de preview
		vGrp2.visible = true;
		newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;

		// Preenche o conteúdo da área de preview
		try {
			hasInputLayers = false;

			// Checagem do arquivo de configuração
			if (configFile.exists) {
				var JSONContent = readFileContent(configFile);
				templateData = JSON.parse(JSONContent);

				// Verifica as configurações
				for (var o in defaultTemplateConfigObj) {
					if (templateData.hasOwnProperty(o)) continue;
					templateData[o] = defaultTemplateConfigObj[o];
				}

				// Verifica os layers editáveis
				hasInputLayers = templateData.inputLayers != null;
			}
		} catch (err) {
			alert(lol + '#D9T_017 - esse template não tem um arquivo de configuração válido!');
			return;
		}

		// ✅ SEM CAMPO INPUT - botão sempre habilitado
		if (typeof importBtn !== 'undefined') {
			importBtn.enabled = true;
		}
	};

	templateTree.onActivate = function () {
		// ✅ SEM CAMPO INPUT - sem verificação de dados
		if (typeof importBtn !== 'undefined') {
			importBtn.enabled = true;
		}
	};
	
	importBtn.leftClick.onClick = function () {
		// ✅ IMPORTAÇÃO DIRETA - sem verificação de input
		if (!projectFile || !projectFile.exists) return; // Aborta se o arquivo do template não existir

		// Preparação da Interface para o processamento
		templatesMainGrp.visible = false;
		optionsMainGrp.visible = true;
		D9T_TEMPLATES_w.size = [compactWidth, 60];
		D9T_TEMPLATES_w.text = 'IMPORTANDO TEMPLATE...';
		infoHeaderLab.text = 'projeto:  ' + projectFile.displayName;
		D9T_TEMPLATES_w.update();
		D9T_TEMPLATES_w.center();

		// Define configurações do projeto
		app.project.bitsPerChannel = 8;
		app.project.expressionEngine = 'javascript-1.0';
		app.project.linearBlending = true;
		app.project.timeDisplayType = TimeDisplayType.TIMECODE;

		// Importação do arquivo de projeto
		try {
			var IO = new ImportOptions(projectFile);
			app.project.importFile(IO);
		} catch (err) {
			alert(lol + '#D9T_018 - ' + err.message);
			// Reverte a UI em caso de falha na importação
			templatesMainGrp.visible = true;
			optionsMainGrp.visible = false;
			D9T_TEMPLATES_w.size.width = extendedWidth;
			D9T_TEMPLATES_w.text = scriptName + ' ' + scriptVersion;
			return;
		}

		// Atualização da interface de progresso
		D9T_TEMPLATES_w.text = 'REGISTRANDO LOG...';
		infoHeaderLab.text = 'TEMPLATE IMPORTADO COM SUCESSO!';
		progressBar.value = 0;
		D9T_TEMPLATES_w.update();

		// ✅ LOG SIMPLIFICADO - apenas importação
		try {
			var logFile = new File(templatesPath + '/log padeiro.csv');

			var dt = new Date();
			var y = dt.getFullYear();
			var m = dt.getMonth() + 1;
			var d = dt.getDate();
			var hr = dt.getHours();
			var mi = dt.getMinutes();

			if (m < 10) m = '0' + m;
			if (d < 10) d = '0' + d;
			if (hr < 10) hr = '0' + hr;
			if (mi < 10) mi = '0' + mi;

			var dateStr = [d, m, y].join('/');
			var timeStr = hr + ':' + mi;

			// Log de importação GNEWS
			var templateName = projectFile.displayName.replace(/\.[^\.]+$/, '');
			var logData = [
				templateName,
				'1',
				system.userName,
				dateStr,
				timeStr,
				codigoTxt.text.trim().toUpperCase(),
				infoValues[0].text,
				infoValues[1].text
			].join(',');

			saveLogData(logFile, logData);

			// Webhook para importação
			var webhookURL = "";
			var webData = {
				template: templateName,
				quantidade: 1,
				designer: system.userName,
				codigo_arte: codigoTxt.text.trim().toUpperCase(),
				nome_arte: infoValues[0].text,
				servidor_destino: infoValues[1].text
			};
			sendToWebhookWithCurl(webData, webhookURL);
		} catch (err) {
			// Falha silenciosa no log.
		}

		D9T_TEMPLATES_w.text = 'IMPORTAÇÃO CONCLUÍDA';
		infoHeaderLab.text = 'TEMPLATE IMPORTADO COM SUCESSO!';
		D9T_TEMPLATES_w.size = [compactWidth, 100];
		optBtnMainGrp.visible = true;
	};
	
	nextBtn.leftClick.onClick = function () {
		// ✅ REMOVIDO: Sistema de fila de renderização
		D9T_TEMPLATES_w.close();
	};

	cancelBtn.leftClick.onClick = function () {
		D9T_TEMPLATES_w.close();
	};

	D9T_TEMPLATES_w.onClose = function () {
		// Execução de Script Personalizado (se houver)
		if (!scriptFile || !scriptFile.exists) return;
		
		try {
			scriptFile.open('r');
			eval(scriptFile.read());
			scriptFile.close();
		} catch (err) {
			alert(lol + '#D9T_021 - ' + err.message);
		}
	};

	templateTree.onDoubleClick = function () {
		if (!projectFile || !projectFile.exists) return;
		try {
			// Tentar importar o template
			var IO = new ImportOptions(projectFile);
			app.project.importFile(IO);
			D9T_TEMPLATES_w.close(); // Fecha a janela e dispara o onClose para o script externo
		} catch (err) {
			alert(lol + '#D9T_022 - ' + err.message);
		}
	};
	
	refreshBtn.leftClick.onClick = function () {
		buildTree(templatesFolder, templateTree, fileFilter);

		templateTree.expanded = true;

		var branches = templateTree.items;

		for (var i = 0; i < branches.length; i++) {
			if (branches[i].type == 'node') {
				branches[i].expanded = true;
			}
		}
	};

	openFldBtn.leftClick.onClick = function () {
		if (!templatesFolder.exists) {
			templatesFolder.create();
		}
		openFolder(templatesPath);
	};

    infoBtn.leftClick.onClick = function() {
        var TARGET_HELP_WIDTH = 450;
        var MARGIN_SIZE = 15;
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
        var TOPIC_SPACING = 5;
        var TOPIC_TITLE_INDENT = 0;
        var SUBTOPIC_INDENT = 25;

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
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - GNEWS TEMPLATES");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Gerencie e preencha templates GNEWS com informações automáticas das artes.", {multiline: true});
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
                    { title: "▶ CÓDIGO DA ARTE:", text: "Digite o código da arte GNEWS (ex: GNVZ036). As informações são carregadas automaticamente do banco de dados." },
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
        helpWin.show();
    };

	// Exibe a janela
	D9T_TEMPLATES_w.show();
}