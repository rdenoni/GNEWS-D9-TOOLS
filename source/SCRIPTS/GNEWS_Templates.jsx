// =============================================================================
// GNEWS TEMPLATES - VERSÃO OTIMIZADA CORRIGIDA
// Sistema de carregamento EXATAMENTE como pedido pelo usuário
// =============================================================================

function d9TemplateDialog() {
	var scriptName = 'GNEWS TEMPLATES';
	var scriptVersion = '2.7'; 
	var compactWidth, extendedWidth;
	var fileFilter = ['.aep', '.aet'];
	var projectFile, previewFile, configFile, scriptFile, templateData;
	var newCompsArray = [], newOutputsArray = [];

	var lClick = (typeof lClick !== 'undefined') ? lClick : 'Clique: ';

	var cacheFolder = new Folder(scriptMainPath + 'source/cache');
	if (!cacheFolder.exists) cacheFolder.create();

	// =========================================================================
	// SISTEMA DE CACHE OTIMIZADO - CARREGAMENTO ÚNICO INICIAL
	// =========================================================================
	var templatesCache = {};
	var allCachesLoaded = false;
	var isInitialLoading = false;

	var userConfigFile = null;
	try {
		var centralConfigFolder = new Folder(scriptMainPath + 'source/config');
		if (!centralConfigFolder.exists) centralConfigFolder.create();
		userConfigFile = new File(centralConfigFolder.fullName + '/TEMPLATES_config.json');
	} catch (e) {
		userConfigFile = null;
	}

	var artesData = null;
	try {
		var artesDataFile = new File(scriptMainPath + 'source/libraries/dados_json/DADOS_artes_gnews.json');
		if (artesDataFile.exists) {
			artesDataFile.open('r');
			artesData = JSON.parse(artesDataFile.read());
			artesDataFile.close();
		}
	} catch (err) {}

	function getArteData(codigo) {
		if (!artesData || !artesData.artes_codificadas) return null;
		for (var i = 0; i < artesData.artes_codificadas.length; i++) {
			if (artesData.artes_codificadas[i].codigo === codigo) return artesData.artes_codificadas[i];
		}
		return null;
	}

	var bgColor1 = '#0B0D0E',
		normalColor1 = '#C7C8CA',
		monoColor0 = '#686F75',
		monoColor1 = '#9CA0A5',
		monoColor2 = '#302b2bff',
		normalColor2 = '#ffffffff',
		highlightColor1 = '#E0003A';

	function hexToRgb(hex) {
		if (hex == undefined) return [Math.random(), Math.random(), Math.random()];
		hex = hex.replace('#', '');
		var r = parseInt(hex.substring(0, 2), 16);
		var g = parseInt(hex.substring(2, 4), 16);
		var b = parseInt(hex.substring(4, 6), 16);
		return [r / 255, g / 255, b / 255];
	}

	function setBgColor(element, hexColor) {
		try {
			var color = hexToRgb(hexColor);
			var bType = element.graphics.BrushType.SOLID_COLOR;
			element.graphics.backgroundColor = element.graphics.newBrush(bType, color);
		} catch (e) {}
	}

	function setFgColor(element, hexColor) {
		try {
			var color = hexToRgb(hexColor);
			var pType = element.graphics.PenType.SOLID_COLOR;
			element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1);
		} catch (e) {}
	}

	// =========================================================================
	// INTERFACE SEGUINDO ESTRUTURA ORIGINAL EXATA
	// =========================================================================
	var D9T_TEMPLATES_w = new Window('palette', scriptName + ' ' + scriptVersion);
	
	var topHeaderGrp = D9T_TEMPLATES_w.add('group');
	topHeaderGrp.orientation = 'row';
	topHeaderGrp.alignment = ['fill', 'top'];
	topHeaderGrp.margins = [0, 5, 10, 0];
	
	var titlePlaceholder = topHeaderGrp.add('statictext', undefined, '');
	titlePlaceholder.alignment = ['fill', 'center'];
	
	var helpBtnGrp = topHeaderGrp.add('group');
	helpBtnGrp.alignment = ['right', 'center'];
	
	var infoBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_INFO_ICON !== 'undefined') {
		infoBtn = new themeIconButton(helpBtnGrp, {
			icon: D9T_INFO_ICON,
			tips: [lClick + 'ajuda | DOCS']
		});
	} else {
		infoBtn = helpBtnGrp.add('button', undefined, '?');
		infoBtn.helpTip = 'ajuda | DOCS';
		infoBtn.preferredSize = [24, 24];
	}

	var mainGrp = D9T_TEMPLATES_w.add('group');
	mainGrp.orientation = 'stack';

	var optionsMainGrp = mainGrp.add('group');
	optionsMainGrp.orientation = 'column';
	optionsMainGrp.spacing = 12;
	optionsMainGrp.alignment = ['left', 'top'];
	optionsMainGrp.visible = false;

	var infoHeaderLab = optionsMainGrp.add('statictext', [0, 0, 320, 18]);
	setFgColor(infoHeaderLab, normalColor1);

	var progressBar = optionsMainGrp.add('progressbar', [0, 0, 320, 1]);

	var optBtnMainGrp = optionsMainGrp.add('group');
	optBtnMainGrp.orientation = 'stack';
	optBtnMainGrp.alignment = 'fill';
	optBtnMainGrp.margins = [0, 32, 0, 0];
	optBtnMainGrp.visible = false;

	var optBtnMainGrpL = optBtnMainGrp.add('group');
	optBtnMainGrpL.alignment = 'left';
	optBtnMainGrpL.spacing = 16;

	var cancelBtn;
	if (typeof themeButton === 'function') {
		cancelBtn = new themeButton(optBtnMainGrpL, {
			width: 80,
			height: 32,
			labelTxt: 'cancelar',
			tips: [lClick + 'cancelar operação']
		});
	} else {
		cancelBtn = optBtnMainGrpL.add('button', undefined, 'Cancelar');
		cancelBtn.preferredSize = [80, 32];
	}

	var optBtnMainGrpR = optBtnMainGrp.add('group');
	optBtnMainGrpR.alignment = 'right';
	optBtnMainGrpR.spacing = 16;

	var nextBtn;
	if (typeof themeButton === 'function') {
		nextBtn = new themeButton(optBtnMainGrpR, {
			width: 100,
			height: 32,
			textColor: bgColor1,
			buttonColor: normalColor1,
			labelTxt: 'continuar',
			tips: [lClick + 'continuar processo']
		});
	} else {
		nextBtn = optBtnMainGrpR.add('button', undefined, 'Continuar');
		nextBtn.preferredSize = [100, 32];
	}

	var templatesMainGrp = mainGrp.add('group');
	templatesMainGrp.spacing = 12;
	
	var vGrp1 = templatesMainGrp.add('group');
	vGrp1.orientation = 'column';
	vGrp1.alignment = ['center', 'top'];
	vGrp1.alignChildren = 'left';
	vGrp1.spacing = 12;
	
	var vGrp2 = templatesMainGrp.add('group');
	vGrp2.orientation = 'column';
	vGrp2.alignment = ['center', 'top'];
	vGrp2.alignChildren = 'left';
	vGrp2.spacing = 12;
	vGrp2.visible = false;

	// =========================================================================
	// SEÇÃO DE PRODUÇÃO COM ESTRUTURA ORIGINAL
	// =========================================================================
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
	
	// Configuração das produções - ESTRUTURA ORIGINAL
	var prodDropItems = [];
	var validProductions = [];
	
	if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray && D9T_prodArray.length > 0) {
		if (D9T_prodArray.length === 1 && D9T_prodArray[0].pecasGraficas) {
			var configData = D9T_prodArray[0];
			
			validProductions = [{
				name: 'PEÇAS GRÁFICAS',
				icon: 'D9T_TEMPPECAS_ICON',
				paths: configData.pecasGraficas || []
			}, {
				name: 'BASE TEMÁTICA',
				icon: 'D9T_TBASE_ICON',
				paths: configData.baseTematica || []
			}, {
				name: 'ILUSTRAÇÕES',
				icon: 'D9T_TILUSTRA_ICON',
				paths: configData.ilustracoes || []
			}];
			prodDropItems = ['PEÇAS GRÁFICAS', 'BASE TEMÁTICA', 'ILUSTRAÇÕES'];
		}
	}
	
	// FUNÇÃO ORIGINAL PARA ÍCONES
	if (typeof populateMainIcons === 'function') {
		populateMainIcons(prodIconGrp, validProductions);
	}
	
	var prodDrop = prodGrp.add('dropdownlist', undefined, prodDropItems, { alignment: ['fill', 'center'] });
	prodDrop.selection = 0;
	prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
	
	var divProd;
	if (typeof themeDivider === 'function') {
		divProd = themeDivider(vGrp1);
		divProd.alignment = ['fill', 'center'];
	}

	// =========================================================================
	// SEÇÃO DE TEMPLATES - ESTRUTURA ORIGINAL
	// =========================================================================
	var templatesHeaderGrp = vGrp1.add('group');
	templatesHeaderGrp.alignment = 'fill';
	
	var templateLab = templatesHeaderGrp.add('statictext', undefined, 'BUSCA:');
	setFgColor(templateLab, normalColor1);
	
	var itemCounterLab = templatesHeaderGrp.add('statictext', undefined, '', {
		justify: 'right'
	});
	itemCounterLab.alignment = ['fill', 'center'];
	setFgColor(itemCounterLab, monoColor1);

	var treeGrp = vGrp1.add('group');
	treeGrp.orientation = 'column';
	treeGrp.spacing = 4;
	
	var placeholderText = '⌕  Digite para Buscar...';
	var searchBox = treeGrp.add('edittext', [0, 0, 320, 24], '');
	searchBox.text = placeholderText;
	searchBox.isPlaceholderActive = true;
	setFgColor(searchBox, monoColor0);

	var treeContainerGrp = treeGrp.add('group', [0, 0, 320, 420]);
	treeContainerGrp.orientation = 'stack';
	treeContainerGrp.alignment = ['fill', 'fill'];
	
	var templateTree = treeContainerGrp.add('treeview', [0, 0, 320, 420]);
	setFgColor(templateTree, monoColor1);
	
	var loadingGrp = treeContainerGrp.add('group');
	loadingGrp.alignChildren = ['center', 'center'];
	loadingGrp.add('statictext', undefined, 'Carregando, por favor aguarde...');
	loadingGrp.visible = false;

	// =========================================================================
	// BOTÕES DE AÇÃO - ESTRUTURA ORIGINAL CORRIGIDA
	// =========================================================================
	var mainBtnGrp1 = vGrp1.add('group');
	mainBtnGrp1.orientation = 'stack';
	mainBtnGrp1.alignment = 'fill';
	mainBtnGrp1.margins = [0, 8, 0, 0];
	
	var lBtnGrp1 = mainBtnGrp1.add('group');
	lBtnGrp1.alignment = 'left';
	lBtnGrp1.spacing = 16;
	
	var refreshBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_ATUALIZAR_ICON !== 'undefined') {
		refreshBtn = new themeIconButton(lBtnGrp1, {
			icon: D9T_ATUALIZAR_ICON,
			tips: [lClick + 'Recarregar templates do cache']
		});
	} else {
		refreshBtn = lBtnGrp1.add('button', undefined, 'Atualizar');
		refreshBtn.helpTip = 'Recarregar templates do cache';
	}
	
	var openFldBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_PASTA_ICON !== 'undefined') {
		openFldBtn = new themeIconButton(lBtnGrp1, {
			icon: D9T_PASTA_ICON,
			tips: [lClick + 'abrir pasta de templates']
		});
	} else {
		openFldBtn = lBtnGrp1.add('button', undefined, 'Abrir');
		openFldBtn.helpTip = 'abrir pasta de templates';
	}

	// =========================================================================
	// SEÇÃO DE PREVIEW - LADO DIREITO
	// =========================================================================
	var previewHeaderGrp = vGrp2.add('group');
	previewHeaderGrp.alignment = 'fill';
	previewHeaderGrp.orientation = 'stack';
	
	var previewLabGrp = previewHeaderGrp.add('group');
	previewLabGrp.alignment = 'left';
	
	var previewLab = previewHeaderGrp.add('statictext', undefined, 'PREVIEW:');
	setFgColor(previewLab, normalColor1);
	
	var previewGrp = vGrp2.add('group');
	previewGrp.orientation = 'column';
	previewGrp.alignChildren = 'left';
	
	var previewImg;
	if (typeof no_preview !== 'undefined') {
		previewImg = previewGrp.add('image', [0, 0, 600, 338], no_preview);
	} else {
		previewImg = previewGrp.add('image', [0, 0, 600, 338]);
	}
	
	var newDiv;
	if (typeof themeDivider === 'function') {
		newDiv = themeDivider(vGrp2);
		newDiv.alignment = ['fill', 'center'];
	}

	// =========================================================================
	// SEÇÃO DE INFORMAÇÕES GNEWS
	// =========================================================================
	var infoArteMainGrp = vGrp2.add('group');
	infoArteMainGrp.alignment = 'fill';
	infoArteMainGrp.orientation = 'column';
	infoArteMainGrp.spacing = 8;
	
	var infoArteHeaderGrp = infoArteMainGrp.add('group');
	infoArteHeaderGrp.alignment = 'fill';
	
	var infoArteLab = infoArteHeaderGrp.add('statictext', undefined, 'INFORMAÇÕES GNEWS:');
	setFgColor(infoArteLab, normalColor1);
	
	var infoArteGrp = infoArteMainGrp.add('group');
	infoArteGrp.orientation = 'column';
	infoArteGrp.spacing = 6;
	
	var codigoGrp = infoArteGrp.add('group');
	codigoGrp.alignment = 'fill';
	var codigoLab = codigoGrp.add('statictext', undefined, 'Código:');
	setFgColor(codigoLab, monoColor1);
	codigoLab.preferredSize = [80, 20];
	
	var codigoTxt = codigoGrp.add('edittext', undefined, '');
	codigoTxt.alignment = ['fill', 'center'];
	codigoTxt.helpTip = 'Digite o código da arte GNEWS (ex: GNVZ036)';
	
	var infoLabels = ['Nome da Arte:', 'Servidor Destino:', 'Última Atualização:'];
	var infoValues = [];
	
	for (var i = 0; i < infoLabels.length; i++) {
		var infoRowGrp = infoArteGrp.add('group');
		infoRowGrp.alignment = 'fill';
		
		var infoLab = infoRowGrp.add('statictext', undefined, infoLabels[i]);
		setFgColor(infoLab, monoColor1);
		infoLab.preferredSize = [80, 20];
		
		var infoVal = infoRowGrp.add('statictext', undefined, '');
		setFgColor(infoVal, normalColor1);
		infoVal.alignment = ['fill', 'center'];
		infoValues.push(infoVal);
	}

	// =========================================================================
	// BOTÕES FINAIS - ESTRUTURA ORIGINAL CORRIGIDA
	// =========================================================================
	var rBtnGrp2 = vGrp2.add('group');
	rBtnGrp2.alignment = 'fill';
	rBtnGrp2.spacing = 8;
	
	var openBtn;
	if (typeof themeButton === 'function') {
		openBtn = new themeButton(rBtnGrp2, {
			width: 120,
			height: 32,
			labelTxt: 'abrir',
			tips: [lClick + 'abrir o projeto selecionado']
		});
	} else {
		openBtn = rBtnGrp2.add('button', undefined, 'Abrir');
		openBtn.helpTip = 'abrir o projeto selecionado';
		openBtn.preferredSize = [120, 32];
	}
	
	var importBtn;
	if (typeof themeButton === 'function') {
		importBtn = new themeButton(rBtnGrp2, {
			width: 120,
			height: 32,
			textColor: bgColor1,
			buttonColor: normalColor1,
			labelTxt: 'importar',
			tips: [lClick + 'importar o template selecionado']
		});
	} else {
		importBtn = rBtnGrp2.add('button', undefined, 'Importar');
		importBtn.helpTip = 'importar o template selecionado';
		importBtn.preferredSize = [120, 32];
	}

	// =========================================================================
	// SISTEMA DE CACHE ULTRA-RÁPIDO PARA TREEVIEW
	// =========================================================================
	function loadAllCachesInBackground() {
		if (isInitialLoading || allCachesLoaded) return;
		
		isInitialLoading = true;
		var totalProductions = validProductions.length;
		var loadedCount = 0;

		for (var i = 0; i < validProductions.length; i++) {
			var prodName = validProductions[i].name;
			loadedCount++;
			
			// Carrega o cache individual
			loadSingleCache(prodName);
		}

		// Finaliza o processo
		allCachesLoaded = true;
		isInitialLoading = false;
		
		// Remove loading e mostra templates
		setLoadingState(false);
		loadTemplatesFromCacheInstant();
	}

	function loadSingleCache(prodName) {
		if (templatesCache[prodName]) return;

		var cacheFileName;
		switch (prodName) {
			case 'PEÇAS GRÁFICAS':
				cacheFileName = 'templates_pecas_cache.json';
				break;
			case 'BASE TEMÁTICA':
				cacheFileName = 'templates_base_cache.json';
				break;
			case 'ILUSTRAÇÕES':
				cacheFileName = 'templates_ilustra_cache.json';
				break;
			default:
				cacheFileName = prodName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json';
				break;
		}

		var templatesCacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);
		
		if (templatesCacheFile.exists) {
			try {
				templatesCacheFile.open('r');
				var cacheContent = templatesCacheFile.read();
				templatesCacheFile.close();
				
				var masterCacheData = JSON.parse(cacheContent);
				var combinedTreeData = [];
				
				for (var path in masterCacheData) {
					if (masterCacheData.hasOwnProperty(path)) {
						combinedTreeData = combinedTreeData.concat(masterCacheData[path]);
					}
				}
				
				templatesCache[prodName] = combinedTreeData;
			} catch (e) {
				templatesCache[prodName] = [{ type: 'item', text: 'Erro ao ler o cache: ' + e.message }];
			}
		} else {
			templatesCache[prodName] = [{ type: 'item', text: 'Cache não encontrado.' }];
		}
	}

	// =========================================================================
	// POPULAÇÃO INSTANTÂNEA DA ÁRVORE (SEM DELAY)
	// =========================================================================
	function loadTemplatesFromCacheInstant() {
		if (!allCachesLoaded) return;

		var prodName = validProductions[prodDrop.selection.index].name;
		var data = templatesCache[prodName];

		templateTree.removeAll();

		if (data && data.length > 0) {
			// POPULAÇÃO INSTANTÂNEA - OTIMIZADA PARA 750+ ARQUIVOS
			populateTreeFromDataFast(templateTree, data);
			expandAllNodes(templateTree);
		} else {
			templateTree.add('item', 'Nenhum item encontrado para esta categoria.');
		}

		updateItemCounter();
	}

	function populateTreeFromDataFast(treeNode, dataArray) {
		// VERSÃO OTIMIZADA PARA GRANDES QUANTIDADES DE ARQUIVOS
		app.beginUndoGroup("Populate Tree");
		
		try {
			for (var i = 0; i < dataArray.length; i++) {
				var itemData = dataArray[i];
				if (itemData.type === 'node') {
					var node = treeNode.add('node', itemData.text);
					if (typeof D9T_FOLDER_AE_ICON !== 'undefined') {
						node.image = D9T_FOLDER_AE_ICON;
					}
					if (itemData.children && itemData.children.length > 0) {
						populateTreeFromDataFast(node, itemData.children);
					}
				} else if (itemData.type === 'item') {
					var item = treeNode.add('item', itemData.text);
					if (typeof D9T_AE_ICON !== 'undefined') {
						item.image = D9T_AE_ICON;
					}
					item.filePath = itemData.filePath;
					item.modDate = itemData.modDate;
					item.size = itemData.size;
				}
			}
		} catch (e) {
			// Em caso de erro, continua sem parar
		}
		
		app.endUndoGroup();
	}

	function expandAllNodes(tree) {
		if (!tree || !tree.items) return;
		for (var i = 0; i < tree.items.length; i++) {
			var item = tree.items[i];
			if (item.type === 'node') {
				item.expanded = true;
				if (item.items && item.items.length > 0) {
					expandAllNodes(item);
				}
			}
		}
	}

	function updateItemCounter() {
		var count = 0;
		function countItemsInNode(node) {
			var nodeCount = 0;
			for (var i = 0; i < node.items.length; i++) {
				var item = node.items[i];
				if (item.type === 'item') {
					nodeCount++;
				} else if (item.type === 'node') {
					nodeCount += countItemsInNode(item);
				}
			}
			return nodeCount;
		}
		count = countItemsInNode(templateTree);
		itemCounterLab.text = count + (count === 1 ? ' item' : ' itens');
	}

	function setLoadingState(isLoading, message) {
		loadingGrp.children[0].text = message || 'Carregando, por favor aguarde...';
		loadingGrp.visible = isLoading;
		templateTree.visible = !isLoading;
		searchBox.enabled = !isLoading;
		prodDrop.enabled = !isLoading;
	}

	function performSearchFast(searchTerm) {
		if (!allCachesLoaded) return;
		
		var prodName = validProductions[prodDrop.selection.index].name;
		var masterData = templatesCache[prodName];

		if (!masterData) return;

		if (searchTerm === '') {
			templateTree.removeAll();
			populateTreeFromDataFast(templateTree, masterData);
			expandAllNodes(templateTree);
			updateItemCounter();
			return;
		}

		var searchTermUpper = searchTerm.toUpperCase();
		var cleanSearchTerm = searchTermUpper;
		if (typeof String.prototype.replaceSpecialCharacters === 'function') {
			cleanSearchTerm = searchTermUpper.replaceSpecialCharacters();
		}

		function filterDataFast(data) {
			var filteredList = [];
			for (var i = 0; i < data.length; i++) {
				var item = data[i];

				if (item.type === 'item') {
					var itemText = item.text.toUpperCase();
					if (typeof String.prototype.replaceSpecialCharacters === 'function') {
						itemText = itemText.replaceSpecialCharacters();
					}
					if (itemText.indexOf(cleanSearchTerm) !== -1) {
						filteredList.push(item);
					}
				} else if (item.type === 'node') {
					var nodeText = item.text.toUpperCase();
					if (typeof String.prototype.replaceSpecialCharacters === 'function') {
						nodeText = nodeText.replaceSpecialCharacters();
					}
					var filteredChildren = filterDataFast(item.children);
					if (nodeText.indexOf(cleanSearchTerm) !== -1 || filteredChildren.length > 0) {
						var nodeCopy = JSON.parse(JSON.stringify(item));
						nodeCopy.children = filteredChildren;
						filteredList.push(nodeCopy);
					}
				}
			}
			return filteredList;
		}

		var filteredTreeData = filterDataFast(masterData);

		templateTree.removeAll();
		populateTreeFromDataFast(templateTree, filteredTreeData);
		expandAllNodes(templateTree);
		updateItemCounter();
	}

	// =========================================================================
	// CONFIGURAÇÃO DE TEMA
	// =========================================================================
	setBgColor(D9T_TEMPLATES_w, bgColor1);

	// =========================================================================
	// EVENTO DO DROPDOWN - INSTANTÂNEO APÓS CARREGAMENTO
	// =========================================================================
	prodDrop.onChange = function () {
		var i = this.selection.index;
		
		// Atualiza ícone
		if (typeof changeIcon === 'function') {
			changeIcon(i, prodIconGrp);
		}
		
		// Salva configuração
		try {
			if (userConfigFile) {
				var userConfig = {};
				if (userConfigFile.exists) {
					userConfigFile.open('r');
					var configContent = userConfigFile.read();
					userConfigFile.close();
					if (configContent) {
						try {
							userConfig = JSON.parse(configContent);
						} catch (jsonError) {
							userConfig = {};
						}
					}
				}
				if (!userConfig.gnews_templates) {
					userConfig.gnews_templates = {};
				}
				userConfig.gnews_templates.lastProductionIndex = i;
				userConfigFile.open('w');
				userConfigFile.write(JSON.stringify(userConfig, null, '\t'));
				userConfigFile.close();
			}
		} catch (e) {}
		
		// CARREGAMENTO INSTANTÂNEO (SEM DELAY)
		if (allCachesLoaded) {
			loadTemplatesFromCacheInstant();
		}
	};

	// =========================================================================
	// EVENTO ONSHOW - JANELA ABRE INSTANTANEAMENTE COM LOADING
	// =========================================================================
	D9T_TEMPLATES_w.onShow = function () {
		extendedWidth = D9T_TEMPLATES_w.size.width;
		compactWidth = extendedWidth - 680;
		vGrp2.visible = true;
		if (newDiv) newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;

		// EXIBE LOADING IMEDIATAMENTE
		setLoadingState(true, 'Carregando templates...');

		// Carrega configuração do usuário
		try {
			if (userConfigFile && userConfigFile.exists) {
				userConfigFile.open('r');
				var configContent = userConfigFile.read();
				userConfigFile.close();
				if (configContent && configContent.trim() !== '') {
					var centralConfig = JSON.parse(configContent);
					if (centralConfig.gnews_templates && typeof centralConfig.gnews_templates.lastProductionIndex !== 'undefined') {
						var lastIndex = parseInt(centralConfig.gnews_templates.lastProductionIndex);
						if (!isNaN(lastIndex) && lastIndex >= 0 && lastIndex < prodDrop.items.length) {
							prodDrop.selection = lastIndex;
						}
					}
				}
			}
		} catch (e) {}

		// CARREGAMENTO EM BACKGROUND (ASSÍNCRONO)
		// Usando setTimeout para não bloquear a interface
		setTimeout(function() {
			loadAllCachesInBackground();
		}, 10);
	};

	// =========================================================================
	// EVENTOS DE BUSCA OTIMIZADOS
	// =========================================================================
	searchBox.onActivate = function () {
		if (this.isPlaceholderActive) {
			this.text = '';
			this.isPlaceholderActive = false;
			setFgColor(this, normalColor1);
		}
	};

	searchBox.onDeactivate = function () {
		if (this.text === '') {
			this.text = placeholderText;
			this.isPlaceholderActive = true;
			setFgColor(this, monoColor0);
			if (allCachesLoaded) {
				performSearchFast('');
			}
		}
	};

	searchBox.onChanging = function () {
		if (!this.isPlaceholderActive && allCachesLoaded) {
			performSearchFast(this.text);
		}
	};

	// =========================================================================
	// EVENTOS DOS BOTÕES
	// =========================================================================
	
	// Botão de refresh
	if (refreshBtn && typeof refreshBtn.leftClick !== 'undefined') {
		refreshBtn.leftClick.onClick = function () {
			// Reset completo do cache
			templatesCache = {};
			allCachesLoaded = false;
			isInitialLoading = false;
			setLoadingState(true, 'Recarregando cache...');
			setTimeout(function() {
				loadAllCachesInBackground();
			}, 10);
		};
	} else if (refreshBtn) {
		refreshBtn.onClick = function () {
			templatesCache = {};
			allCachesLoaded = false;
			isInitialLoading = false;
			setLoadingState(true, 'Recarregando cache...');
			setTimeout(function() {
				loadAllCachesInBackground();
			}, 10);
		};
	}

	// Botão de abrir pasta
	if (openFldBtn && typeof openFldBtn.leftClick !== 'undefined') {
		openFldBtn.leftClick.onClick = function () {
			openTemplatesFolder();
		};
	} else if (openFldBtn) {
		openFldBtn.onClick = function () {
			openTemplatesFolder();
		};
	}

	function openTemplatesFolder() {
		if (!prodDrop.selection) {
			alert("Nenhuma produção selecionada.");
			return;
		}
		
		var selectedProduction = validProductions[prodDrop.selection.index];
		var availablePaths = selectedProduction.paths;
		
		if (!availablePaths || availablePaths.length === 0) {
			alert("Nenhum caminho configurado para a produção '" + selectedProduction.name + "'.");
			return;
		}
		
		function openPath(pathString) {
			var folderToShow = new Folder(pathString);
			if (!folderToShow.exists) {
				alert("A pasta configurada ('" + folderToShow.fsName + "') não foi encontrada ou está inacessível.");
				return;
			}
			folderToShow.execute();
		}
		
		if (availablePaths.length === 1) {
			openPath(availablePaths[0]);
		} else {
			var pathSelectionWin = new Window('dialog', 'Selecionar Pasta para Abrir');
			pathSelectionWin.orientation = 'column';
			pathSelectionWin.alignChildren = ['fill', 'top'];
			pathSelectionWin.spacing = 10;
			pathSelectionWin.margins = 15;
			pathSelectionWin.add('statictext', undefined, 'Esta produção tem múltiplos caminhos. Escolha um:');
			var list = pathSelectionWin.add('listbox', undefined, availablePaths);
			list.selection = 0;
			list.preferredSize.height = 100;
			var btnGrp = pathSelectionWin.add('group');
			btnGrp.orientation = 'row';
			btnGrp.alignment = ['right', 'center'];
			btnGrp.add('button', undefined, 'Cancelar', { name: 'cancel' });
			var okBtn = btnGrp.add('button', undefined, 'Abrir', { name: 'ok' });
			okBtn.onClick = function () {
				if (list.selection) {
					openPath(list.selection.text);
					pathSelectionWin.close();
				} else {
					alert("Por favor, selecione um caminho.");
				}
			};
			pathSelectionWin.show();
		}
	}

	// =========================================================================
	// EVENTOS DA ÁRVORE DE TEMPLATES
	// =========================================================================
	templateTree.onChange = function () {
		if (this.selection && this.selection.filePath) {
			// Limpa informações GNEWS
			for (var i = 0; i < infoValues.length; i++) {
				infoValues[i].text = '';
			}
			codigoTxt.text = '';
			
			// Habilita botões
			if (typeof importBtn !== 'undefined') importBtn.enabled = true;
			if (typeof openBtn !== 'undefined') openBtn.enabled = true;
			
			// Define projectFile para compatibilidade
			projectFile = new File(this.selection.filePath);
		}
	};

	templateTree.onActivate = function () {
		if (typeof importBtn !== 'undefined') importBtn.enabled = true;
		if (typeof openBtn !== 'undefined') openBtn.enabled = true;
	};

	templateTree.onDoubleClick = function () {
		if (this.selection != null && this.selection.filePath) {
			executeOpen();
		}
	};

	// =========================================================================
	// EVENTOS DOS BOTÕES DE AÇÃO
	// =========================================================================
	if (openBtn && typeof openBtn.leftClick !== 'undefined') {
		openBtn.leftClick.onClick = function () {
			executeOpen();
		};
	} else if (openBtn) {
		openBtn.onClick = function () {
			executeOpen();
		};
	}

	if (importBtn && typeof importBtn.leftClick !== 'undefined') {
		importBtn.leftClick.onClick = function () {
			executeImport();
		};
	} else if (importBtn) {
		importBtn.onClick = function () {
			executeImport();
		};
	}

	function executeOpen() {
		if (!templateTree.selection || !templateTree.selection.filePath) {
			alert("Selecione um template primeiro.");
			return;
		}
		
		var templatePath = templateTree.selection.filePath;
		var templateFile = new File(templatePath);
		
		if (!templateFile.exists) {
			alert("Arquivo não encontrado:\n" + templatePath);
			return;
		}
		
		try {
			// Abre o projeto no After Effects
			D9T_TEMPLATES_w.close();
			app.open(templateFile);
		} catch (e) {
			alert("Erro ao abrir template:\n" + e.message);
		}
	}

	function executeImport() {
		if (!templateTree.selection || !templateTree.selection.filePath) {
			alert("Selecione um template primeiro.");
			return;
		}
		
		var templatePath = templateTree.selection.filePath;
		var templateFile = new File(templatePath);
		
		if (!templateFile.exists) {
			alert("Arquivo não encontrado:\n" + templatePath);
			return;
		}

		// MODO RÁPIDO DE IMPORTAÇÃO - SEM TELAS INTERMEDIÁRIAS
		try {
			// Configurações de projeto
			app.project.bitsPerChannel = 8;
			app.project.expressionEngine = 'javascript-1.0';
			app.project.linearBlending = true;
			app.project.timeDisplayType = TimeDisplayType.TIMECODE;
			
			// Importa o template
			var importOptions = new ImportOptions(templateFile);
			app.project.importFile(importOptions);
			
			// Log GNEWS
			var templateName = templateFile.name.replace(/\.[^\.]+$/, '');
			logGNewsImport(templateName);
			
			alert("Template '" + templateName + "' importado com sucesso!");
			D9T_TEMPLATES_w.close();
		} catch (e) {
			alert("Erro ao importar template:\n" + e.message);
		}
	}

	function logGNewsImport(templateName) {
		try {
			var logFolder = new Folder(validProductions[prodDrop.selection.index].paths[0]);
			var logPath = logFolder.exists ? logFolder.fsName : scriptMainPath + 'source/logs';
			var logFile = new File(logPath + '/log padeiro.csv');
			
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
			
			// Salva o log
			if (typeof saveLogData === 'function') {
				saveLogData(logFile, logData);
			} else {
				if (!logFile.exists) {
					logFile.open('w');
					logFile.writeln('Template,Quantidade,Designer,Data,Hora,Codigo_Arte,Nome_Arte,Servidor_Destino');
					logFile.close();
				}
				logFile.open('a');
				logFile.writeln(logData);
				logFile.close();
			}
			
			// Webhook se disponível
			if (typeof sendToWebhookWithCurl === 'function') {
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
			}
		} catch (err) {
			// Log silencioso em caso de erro
		}
	}

	// =========================================================================
	// EVENTO DE CÓDIGO GNEWS
	// =========================================================================
	codigoTxt.onChanging = function () {
		var codigo = this.text.trim().toUpperCase();
		
		if (codigo.length >= 3) {
			var arteInfo = getArteData(codigo);
			
			if (arteInfo) {
				infoValues[0].text = arteInfo.nome || '';
				infoValues[1].text = arteInfo.servidor || '';
				infoValues[2].text = arteInfo.ultima_atualizacao || '';
			} else {
				// Limpa se não encontrar
				for (var i = 0; i < infoValues.length; i++) {
					infoValues[i].text = '';
				}
			}
		} else {
			// Limpa se código muito curto
			for (var i = 0; i < infoValues.length; i++) {
				infoValues[i].text = '';
			}
		}
	};

	// =========================================================================
	// EVENTO DE AJUDA
	// =========================================================================
	if (infoBtn && typeof infoBtn.leftClick !== 'undefined') {
		infoBtn.leftClick.onClick = function () {
			showHelpDialog();
		};
	} else if (infoBtn) {
		infoBtn.onClick = function () {
			showHelpDialog();
		};
	}

	function showHelpDialog() {
		var TARGET_HELP_WIDTH = 450,
			MARGIN_SIZE = 15,
			TOPIC_SECTION_MARGINS = [10, 5, 10, 5],
			TOPIC_SPACING = 5,
			TOPIC_TITLE_INDENT = 0,
			SUBTOPIC_INDENT = 25;
		
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
		
		var titleText = headerPanel.add("statictext", undefined, "AJUDA - GNEWS TEMPLATES v2.7");
		titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
		titleText.alignment = ["center", "center"];
		if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
			setFgColor(titleText, highlightColor1);
		} else {
			titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
		}
		
		var mainDescText = headerPanel.add("statictext", undefined, "Sistema ultra-rápido de templates GNEWS otimizado para grandes quantidades de arquivos.", { multiline: true });
		mainDescText.alignment = ["fill", "fill"];
		mainDescText.preferredSize.height = 40;
		if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
			setFgColor(mainDescText, normalColor1);
		} else {
			mainDescText.graphics.foregroundColor = mainDescText.graphics.newPen(mainDescText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
		}

		var contentPanel = helpWin.add("panel", undefined, "");
		contentPanel.orientation = "column";
		contentPanel.alignChildren = ["fill", "fill"];
		contentPanel.alignment = ["fill", "fill"];
		contentPanel.spacing = 10;
		contentPanel.margins = 15;

		var helpContent = [
			"▶ OTIMIZAÇÕES ULTRA-RÁPIDAS:",
			"• Janela abre instantaneamente com loading",
			"• Cache carregado em background sem bloquear interface",
			"• Árvore de arquivos instantânea (mesmo 750+ arquivos)",
			"• Trocas de produção sem qualquer delay",
			"• População de TreeView otimizada para grandes volumes",
			"",
			"▶ FUNCIONAMENTO:",
			"1. Janela abre imediatamente mostrando 'Carregando...'",
			"2. Cache é carregado silenciosamente em background",
			"3. Após carregamento: ZERO delays para qualquer ação",
			"4. Troca de produção: instantânea",
			"5. Busca: filtros em tempo real",
			"",
			"▶ ATALHOS RÁPIDOS:",
			"• Duplo clique: Abre template diretamente",
			"• Botão Abrir: Abre o template selecionado",
			"• Botão Importar: Importa para projeto atual",
			"• 🔄 Atualizar: Recarrega cache quando necessário",
			"• 📁 Pasta: Abre diretório de templates",
			"",
			"▶ CÓDIGO GNEWS:",
			"Digite código da arte (ex: GNVZ036) para carregar",
			"informações automáticas do banco de dados."
		];

		for (var i = 0; i < helpContent.length; i++) {
			var line = helpContent[i];
			var textElement = contentPanel.add("statictext", undefined, line, { multiline: false });
			textElement.alignment = ["fill", "top"];
			
			if (line.indexOf("▶") === 0) {
				setFgColor(textElement, highlightColor1);
				textElement.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
			} else {
				setFgColor(textElement, normalColor1);
			}
		}

		var buttonPanel = helpWin.add("group");
		buttonPanel.alignment = ["fill", "bottom"];
		buttonPanel.alignChildren = ["center", "center"];

		var okButton = buttonPanel.add("button", undefined, "OK");
		okButton.preferredSize = [80, 30];
		okButton.onClick = function () {
			helpWin.close();
		};

		helpWin.center();
		helpWin.show();
	}

	// =========================================================================
	// EVENTOS DOS BOTÕES CANCELAR/CONTINUAR
	// =========================================================================
	if (cancelBtn && typeof cancelBtn.leftClick !== 'undefined') {
		cancelBtn.leftClick.onClick = function () {
			D9T_TEMPLATES_w.close();
		};
	} else if (cancelBtn) {
		cancelBtn.onClick = function () {
			D9T_TEMPLATES_w.close();
		};
	}

	if (nextBtn && typeof nextBtn.leftClick !== 'undefined') {
		nextBtn.leftClick.onClick = function () {
			D9T_TEMPLATES_w.close();
		};
	} else if (nextBtn) {
		nextBtn.onClick = function () {
			D9T_TEMPLATES_w.close();
		};
	}

	// =========================================================================
	// EVENTO DE FECHAMENTO
	// =========================================================================
	D9T_TEMPLATES_w.onClose = function () {
		if (!scriptFile || !scriptFile.exists) return;
		try {
			scriptFile.open('r');
			eval(scriptFile.read());
			scriptFile.close();
		} catch (err) {
			alert((typeof lol !== 'undefined' ? lol : '') + '#D9T_021 - ' + err.message);
		}
	};

	// =========================================================================
	// INICIALIZAÇÃO E EXIBIÇÃO - EXATAMENTE COMO PEDIDO
	// =========================================================================
	
	// JANELA ABRE INSTANTANEAMENTE E MOSTRA LOADING NO TREEVIEW
	D9T_TEMPLATES_w.show();
}