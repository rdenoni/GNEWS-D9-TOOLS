// =============================================================================
// GNEWS TEMPLATES - VERSÃO OTIMIZADA
// Solução para problema de carregamento lento ao trocar produções
// =============================================================================

function d9TemplateDialog() {
	var scriptName = 'GNEWS TEMPLATES';
	var scriptVersion = '2.7'; // Versão otimizada
	var compactWidth, extendedWidth;
	var fileFilter = ['.aep', '.aet'];
	var projectFile, previewFile, configFile, scriptFile, templateData;
	var newCompsArray = [],
		newOutputsArray = [];

	// Verificação de segurança para variáveis que podem não estar definidas
	var lClick = (typeof lClick !== 'undefined') ? lClick : 'Clique: ';

	var cacheFolder = new Folder(scriptMainPath + 'source/cache');
	if (!cacheFolder.exists) cacheFolder.create();

	// =========================================================================
	// SISTEMA DE CACHE OTIMIZADO - CARREGAMENTO ÚNICO NA INICIALIZAÇÃO
	// =========================================================================
	var templatesCache = {};
	var allCachesLoaded = false;
	var globalLoadingInProgress = false;

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
	// SISTEMA DE LOADING OTIMIZADO
	// =========================================================================
	function setGlobalLoadingState(isLoading, message, progress) {
		if (isLoading) {
			loadingGrp.children[0].text = message || 'Carregando, por favor aguarde...';
			if (progress !== undefined && loadingGrp.children[1]) {
				loadingGrp.children[1].text = progress;
			}
			loadingGrp.visible = true;
			templateTree.visible = false;
			searchBox.enabled = false;
			prodDrop.enabled = false;
			
			// Desabilita todos os botões durante o loading global
			try {
				if (refreshBtn.leftClick) refreshBtn.leftClick.enabled = false;
				else refreshBtn.enabled = false;
				if (openFldBtn.leftClick) openFldBtn.leftClick.enabled = false;
				else openFldBtn.enabled = false;
			} catch (e) {}
		} else {
			loadingGrp.visible = false;
			templateTree.visible = true;
			searchBox.enabled = true;
			prodDrop.enabled = true;
			
			// Reabilita os botões
			try {
				if (refreshBtn.leftClick) refreshBtn.leftClick.enabled = true;
				else refreshBtn.enabled = true;
				if (openFldBtn.leftClick) openFldBtn.leftClick.enabled = true;
				else openFldBtn.enabled = true;
			} catch (e) {}
		}
	}

	// =========================================================================
	// CARREGAMENTO OTIMIZADO DE TODOS OS CACHES
	// =========================================================================
	function loadAllCachesInBackground() {
		if (globalLoadingInProgress || allCachesLoaded) return;
		
		globalLoadingInProgress = true;
		setGlobalLoadingState(true, 'Inicializando sistema...', '');
		D9T_TEMPLATES_w.update();

		var totalProductions = validProductions.length;
		var loadedCount = 0;

		for (var i = 0; i < validProductions.length; i++) {
			var prodName = validProductions[i].name;
			
			// Atualiza o progresso
			loadedCount++;
			var progressText = 'Carregando ' + prodName + '... (' + loadedCount + '/' + totalProductions + ')';
			setGlobalLoadingState(true, progressText);
			D9T_TEMPLATES_w.update();

			// Carrega o cache individual
			loadSingleCache(prodName);
		}

		// Finaliza o processo
		allCachesLoaded = true;
		globalLoadingInProgress = false;
		setGlobalLoadingState(false);
		
		// Carrega a produção selecionada inicialmente
		loadTemplatesFromCache();
	}

	function loadSingleCache(prodName) {
		if (templatesCache[prodName]) return; // Já carregado

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
	// FUNÇÃO DE CARREGAMENTO OTIMIZADA - AGORA INSTANTÂNEA
	// =========================================================================
	function loadTemplatesFromCache() {
		if (!allCachesLoaded) {
			setGlobalLoadingState(true, 'Cache ainda não carregado...');
			return;
		}

		var prodName = validProductions[prodDrop.selection.index].name;
		var data = templatesCache[prodName];

		templateTree.removeAll();

		if (data && data.length > 0) {
			populateTreeFromData(templateTree, data);
			expandAllNodes(templateTree);
		} else {
			templateTree.add('item', 'Nenhum item encontrado para esta categoria.');
		}

		updateItemCounter();
	}

	function populateTreeFromData(treeNode, dataArray) {
		for (var i = 0; i < dataArray.length; i++) {
			var itemData = dataArray[i];
			if (itemData.type === 'node') {
				var node = treeNode.add('node', itemData.text);
				if (typeof D9T_FOLDER_AE_ICON !== 'undefined') {
					node.image = D9T_FOLDER_AE_ICON;
				}
				if (itemData.children && itemData.children.length > 0) {
					populateTreeFromData(node, itemData.children);
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

	// =========================================================================
	// INTERFACE DO USUÁRIO
	// =========================================================================
	var D9T_TEMPLATES_w = new Window('palette', scriptName + ' ' + scriptVersion);
	
	// Header superior
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
		infoBtn.helpTip = 'ajuda';
		infoBtn.preferredSize = [32, 32];
	}

	// Layout principal
	var hGrp = D9T_TEMPLATES_w.add('group');
	hGrp.spacing = 10;
	var vGrp1 = hGrp.add('group');
	vGrp1.orientation = 'column';
	vGrp1.spacing = 8;
	vGrp1.alignment = ['fill', 'fill'];
	
	var vGrp2 = hGrp.add('group');
	vGrp2.orientation = 'column';
	vGrp2.spacing = 8;
	vGrp2.alignment = ['fill', 'fill'];

	// Seção de produção
	var prodGrp = vGrp1.add('group');
	prodGrp.alignment = 'fill';
	prodGrp.spacing = 8;
	
	var prodIconGrp;
	if (typeof changeIcon === 'function') {
		prodIconGrp = prodGrp.add('group');
		prodIconGrp.alignment = ['left', 'center'];
		prodIconGrp.preferredSize = [32, 32];
	}
	
	var validProductions = [
		{ name: 'PEÇAS GRÁFICAS', iconIndex: 0 },
		{ name: 'BASE TEMÁTICA', iconIndex: 1 },
		{ name: 'ILUSTRAÇÕES', iconIndex: 2 }
	];
	
	var prodDropItems = [];
	for (var p = 0; p < validProductions.length; p++) {
		prodDropItems.push(validProductions[p].name);
	}
	
	var prodDrop = prodGrp.add('dropdownlist', undefined, prodDropItems, { alignment: ['fill', 'center'] });
	prodDrop.selection = 0;
	prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
	
	var divProd;
	if (typeof themeDivider === 'function') {
		divProd = themeDivider(vGrp1);
		divProd.alignment = ['fill', 'center'];
	}

	// Seção de busca e árvore
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
	
	// =========================================================================
	// LOADING GROUP APRIMORADO
	// =========================================================================
	var loadingGrp = treeContainerGrp.add('group');
	loadingGrp.orientation = 'column';
	loadingGrp.alignChildren = ['center', 'center'];
	loadingGrp.spacing = 10;
	
	// Texto principal de loading
	var loadingText = loadingGrp.add('statictext', undefined, 'Carregando, por favor aguarde...');
	setFgColor(loadingText, normalColor1);
	
	// Texto de progresso
	var progressText = loadingGrp.add('statictext', undefined, '');
	setFgColor(progressText, monoColor0);
	progressText.characters = 40;
	
	loadingGrp.visible = false;

	// Botões de ação
	var mainBtnGrp1 = vGrp1.add('group');
	mainBtnGrp1.alignment = 'fill';
	mainBtnGrp1.spacing = 8;
	
	var refreshBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_REFRESH_ICON !== 'undefined') {
		refreshBtn = new themeIconButton(mainBtnGrp1, {
			icon: D9T_REFRESH_ICON,
			tips: [lClick + 'atualizar lista de templates']
		});
	} else {
		refreshBtn = mainBtnGrp1.add('button', undefined, '🔄');
		refreshBtn.helpTip = 'atualizar lista de templates';
		refreshBtn.preferredSize = [32, 32];
	}
	
	var openFldBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_FOLDER_ICON !== 'undefined') {
		openFldBtn = new themeIconButton(mainBtnGrp1, {
			icon: D9T_FOLDER_ICON,
			tips: [lClick + 'abrir pasta de templates']
		});
	} else {
		openFldBtn = mainBtnGrp1.add('button', undefined, '📁');
		openFldBtn.helpTip = 'abrir pasta de templates';
		openFldBtn.preferredSize = [32, 32];
	}

	// Seção de preview (lado direito)
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

	// Seção de informações GNEWS
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

	// Botões finais
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
	// FUNÇÕES DE UTILIDADE
	// =========================================================================
	function updateItemCounter() {
		if (!templateTree || !templateTree.items) {
			itemCounterLab.text = '0 itens';
			return;
		}
		
		var count = 0;
		function countItems(tree) {
			if (!tree || !tree.items) return;
			for (var i = 0; i < tree.items.length; i++) {
				var item = tree.items[i];
				if (item.type === 'item') {
					count++;
				} else if (item.type === 'node') {
					countItems(item);
				}
			}
		}
		
		countItems(templateTree);
		itemCounterLab.text = count + (count === 1 ? ' item' : ' itens');
	}

	function performSearch(searchTerm) {
		if (!allCachesLoaded) return;
		
		var prodName = validProductions[prodDrop.selection.index].name;
		var masterData = templatesCache[prodName];

		if (!masterData) return;

		if (searchTerm === '') {
			templateTree.removeAll();
			populateTreeFromData(templateTree, masterData);
			expandAllNodes(templateTree);
			updateItemCounter();
			return;
		}

		var searchTermUpper = searchTerm.toUpperCase();
		var cleanSearchTerm = searchTermUpper;
		if (typeof String.prototype.replaceSpecialCharacters === 'function') {
			cleanSearchTerm = searchTermUpper.replaceSpecialCharacters();
		}

		function filterData(data) {
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
					var filteredChildren = filterData(item.children);
					if (nodeText.indexOf(cleanSearchTerm) !== -1 || filteredChildren.length > 0) {
						var nodeCopy = JSON.parse(JSON.stringify(item));
						nodeCopy.children = filteredChildren;
						filteredList.push(nodeCopy);
					}
				}
			}
			return filteredList;
		}

		var filteredTreeData = filterData(masterData);

		templateTree.removeAll();
		populateTreeFromData(templateTree, filteredTreeData);
		expandAllNodes(templateTree);
		updateItemCounter();
	}

	// =========================================================================
	// EVENTOS DA INTERFACE
	// =========================================================================
	
	// Configurar tema
	setBgColor(D9T_TEMPLATES_w, bgColor1);

	// =========================================================================
	// EVENTO OTIMIZADO DO DROPDOWN - AGORA INSTANTÂNEO
	// =========================================================================
	prodDrop.onChange = function () {
		if (!allCachesLoaded) {
			setGlobalLoadingState(true, 'Aguarde o carregamento inicial...');
			return;
		}

		var i = this.selection.index;
		
		// Atualiza ícone se disponível
		if (typeof changeIcon === 'function') {
			changeIcon(i, prodIconGrp);
		}
		
		// Salva configuração do usuário
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
		
		// Carrega templates instantaneamente (cache já está em memória)
		loadTemplatesFromCache();
	};

	// =========================================================================
	// EVENTO ONSHOW OTIMIZADO
	// =========================================================================
	D9T_TEMPLATES_w.onShow = function () {
		extendedWidth = D9T_TEMPLATES_w.size.width;
		compactWidth = extendedWidth - 680;
		vGrp2.visible = true;
		if (newDiv) newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;

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

		// Inicia carregamento de todos os caches (apenas uma vez)
		if (!allCachesLoaded && !globalLoadingInProgress) {
			loadAllCachesInBackground();
		} else if (allCachesLoaded) {
			// Se já está carregado, mostra os templates imediatamente
			loadTemplatesFromCache();
		}
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
				performSearch('');
			}
		}
	};

	searchBox.onChanging = function () {
		if (!this.isPlaceholderActive && allCachesLoaded) {
			performSearch(this.text);
		}
	};

	// =========================================================================
	// EVENTOS DOS BOTÕES
	// =========================================================================
	
	// Botão de refresh
	if (refreshBtn && typeof refreshBtn.leftClick !== 'undefined') {
		refreshBtn.leftClick.onClick = function () {
			// Reset do cache e recarregamento
			templatesCache = {};
			allCachesLoaded = false;
			globalLoadingInProgress = false;
			loadAllCachesInBackground();
		};
	} else if (refreshBtn) {
		refreshBtn.onClick = function () {
			templatesCache = {};
			allCachesLoaded = false;
			globalLoadingInProgress = false;
			loadAllCachesInBackground();
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

		// Aqui você implementaria a lógica para abrir a pasta baseada na produção
		var prodName = validProductions[prodDrop.selection.index].name;
		alert("Abrir pasta para: " + prodName);
	}

	// =========================================================================
	// EVENTOS DA ÁRVORE DE TEMPLATES
	// =========================================================================
	templateTree.onChange = function () {
		if (this.selection && this.selection.filePath) {
			// Atualiza preview se disponível
			// updatePreview(this.selection.filePath);
			
			// Limpa informações GNEWS
			for (var i = 0; i < infoValues.length; i++) {
				infoValues[i].text = '';
			}
			codigoTxt.text = '';
		}
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
			var newProject = app.open(templateFile);
			if (newProject) {
				alert("Template aberto com sucesso!");
			}
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
		
		try {
			// Importa o template para o projeto atual
			var importOptions = new ImportOptions(templateFile);
			var importedProject = app.project.importFile(importOptions);
			
			if (importedProject) {
				// Log GNEWS se houver código
				var templateName = templateFile.name.replace(/\.[^\.]+$/, '');
				logGNewsImport(templateName);
				
				alert("Template importado com sucesso!");
				D9T_TEMPLATES_w.close();
			}
		} catch (e) {
			alert("Erro ao importar template:\n" + e.message);
		}
	}

	function logGNewsImport(templateName) {
		try {
			var logFile = new File(scriptMainPath + 'source/logs/gnews_templates_log.csv');
			var currentDate = new Date();
			var dateStr = currentDate.getFullYear() + '-' + 
						  String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
						  String(currentDate.getDate()).padStart(2, '0');
			var timeStr = String(currentDate.getHours()).padStart(2, '0') + ':' + 
						  String(currentDate.getMinutes()).padStart(2, '0') + ':' + 
						  String(currentDate.getSeconds()).padStart(2, '0');
			
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
			MARGIN_SIZE = 15;
		
		var helpWin = new Window("dialog", scriptName + " - Ajuda", undefined, { closeButton: true });
		helpWin.orientation = "column";
		helpWin.alignChildren = ["fill", "fill"];
		helpWin.spacing = 10;
		helpWin.margins = MARGIN_SIZE;
		helpWin.preferredSize = [TARGET_HELP_WIDTH, 600];
		
		setBgColor(helpWin, bgColor1);
		
		var headerPanel = helpWin.add("panel", undefined, "");
		headerPanel.orientation = "column";
		headerPanel.alignChildren = ["fill", "top"];
		headerPanel.alignment = ["fill", "top"];
		headerPanel.spacing = 10;
		headerPanel.margins = 15;
		
		var titleText = headerPanel.add("statictext", undefined, "AJUDA - GNEWS TEMPLATES");
		titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
		titleText.alignment = ["center", "center"];
		setFgColor(titleText, highlightColor1);
		
		var mainDescText = headerPanel.add("statictext", undefined, "Gerencie e preencha templates GNEWS com informações automáticas das artes.", { multiline: true });
		mainDescText.alignment = ["fill", "fill"];
		mainDescText.preferredSize.height = 40;
		setFgColor(mainDescText, normalColor1);

		var contentPanel = helpWin.add("panel", undefined, "");
		contentPanel.orientation = "column";
		contentPanel.alignChildren = ["fill", "fill"];
		contentPanel.alignment = ["fill", "fill"];
		contentPanel.spacing = 10;
		contentPanel.margins = 15;

		var helpContent = [
			"▶ OTIMIZAÇÕES DA VERSÃO 2.7:",
			"• Carregamento único de todos os caches na inicialização",
			"• Troca instantânea entre produções sem lentidão",
			"• Interface de loading aprimorada com progresso",
			"• Cache mantido em memória para máxima performance",
			"",
			"▶ SELEÇÃO DE TEMPLATE:",
			"Navegue pela árvore à esquerda para selecionar um template (.aep ou .aet).",
			"",
			"▶ BUSCA RÁPIDA:",
			"Digite no campo de busca para filtrar templates instantaneamente.",
			"",
			"▶ CÓDIGO GNEWS:",
			"Digite o código da arte (ex: GNVZ036) para carregar informações automáticas.",
			"",
			"▶ AÇÕES:",
			"• Duplo clique: Abre o template diretamente",
			"• Botão Abrir: Abre o template selecionado",
			"• Botão Importar: Importa para o projeto atual",
			"• 🔄 Atualizar: Recarrega todos os caches",
			"• 📁 Pasta: Abre o diretório de templates"
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
	// INICIALIZAÇÃO E EXIBIÇÃO
	// =========================================================================
	
	// Define tamanhos da janela
	D9T_TEMPLATES_w.preferredSize = [1000, 600];
	D9T_TEMPLATES_w.center();
	
	D9T_TEMPLATES_w.show();
}