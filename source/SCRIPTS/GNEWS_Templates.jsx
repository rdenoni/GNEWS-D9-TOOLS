// =============================================================================
// GNEWS TEMPLATES - VERSÃO COM CARREGAMENTO INSTANTÂNEO RESTAURADO
// =============================================================================

function d9TemplateDialog() {
	var scriptName = 'GNEWS TEMPLATES';
	var scriptVersion = '3.3'; // Versão incrementada
	var compactWidth, extendedWidth;
	var fileFilter = ['.aep', '.aet'];
	var projectFile, previewFile, configFile, scriptFile, templateData;
	var newCompsArray = [],
		newOutputsArray = [];

	var lClick = (typeof lClick !== 'undefined') ? lClick : 'Clique: ';

	var cacheFolder = new Folder(scriptMainPath + 'source/cache');
	if (!cacheFolder.exists) cacheFolder.create();

	var templatesCache = {};
	var userConfigFile = null;
	try {
		var centralConfigFolder = new Folder(scriptMainPath + 'source/config');
		if (!centralConfigFolder.exists) centralConfigFolder.create();
		userConfigFile = new File(centralConfigFolder.fullName + '/TEMPLATES_config.json');
	} catch (e) {
		userConfigFile = null;
	}

	function filterExcludedFolders(dataArray) {
		var filteredArray = [];
		var excludedNames = ['Icones', 'Ilustracoes','Ilustracoes','Fotos para aberturas','Adobe After Effects Auto-Save','BAGUNCA ALHEIA','_OLD','backup','versoes anteriores','PARA_SCRIPT','_PREVIEWS','PARA_SCRIPT'];

		for (var i = 0; i < dataArray.length; i++) {
			var item = dataArray[i];
			if (item.type === 'node') {
				if (excludedNames.indexOf(item.text.toUpperCase().trim()) === -1) {
					var nodeCopy = JSON.parse(JSON.stringify(item)); 
					nodeCopy.children = filterExcludedFolders(item.children || []);
					if (nodeCopy.children.length > 0) {
						filteredArray.push(nodeCopy);
					}
				}
			} else {
				filteredArray.push(item);
			}
		}
		return filteredArray;
	}

	function getFlatFileList(dataArray) {
		var flatList = [];
		function traverse(nodes) {
			for (var i = 0; i < nodes.length; i++) {
				var item = nodes[i];
				if (item.type === 'item') {
					flatList.push(item);
				} else if (item.type === 'node' && item.children) {
					traverse(item.children);
				}
			}
		}
		traverse(dataArray);
		return flatList;
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
	var prodDropItems = [];
	var validProductions = [];
	if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray && D9T_prodArray.length > 0) {
		if (D9T_prodArray.length === 1 && D9T_prodArray[0].pecasGraficas) {
			var configData = D9T_prodArray[0];
			validProductions = [{ name: 'PEÇAS GRÁFICAS', icon: 'D9T_TEMPPECAS_ICON', paths: configData.pecasGraficas || [] }, { name: 'BASE TEMÁTICA', icon: 'D9T_TBASE_ICON', paths: configData.baseTematica || [] }, { name: 'ILUSTRAÇÕES', icon: 'D9T_TILUSTRA_ICON', paths: configData.ilustracoes || [] }, ];
			prodDropItems = ['PEÇAS GRÁFICAS', 'BASE TEMÁTICA', 'ILUSTRAÇÕES'];
		}
	}
	if (validProductions.length === 0) {
		validProductions = [{ name: 'PEÇAS GRÁFICAS', icon: 'D9T_TEMPPECAS_ICON', paths: [] }, { name: 'BASE TEMÁTICA', icon: 'D9T_TBASE_ICON', paths: [] }, { name: 'ILUSTRAÇÕES', icon: 'D9T_TILUSTRA_ICON', paths: [] }, ];
		prodDropItems = ['PEÇAS GRÁFICAS', 'BASE TEMÁTICA', 'ILUSTRAÇÕES'];
	}
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

	var templatesHeaderGrp = vGrp1.add('group');
	templatesHeaderGrp.alignment = 'fill';
	templatesHeaderGrp.orientation = 'stack';
	var leftHeaderGrp = templatesHeaderGrp.add('group');
	leftHeaderGrp.alignment = 'left';
	var rightHeaderGrp = templatesHeaderGrp.add('group');
	rightHeaderGrp.alignment = 'right';
	rightHeaderGrp.spacing = 10;
	var templateLab = leftHeaderGrp.add('statictext', undefined, 'BUSCA:');
	setFgColor(templateLab, normalColor1);
	var flatViewCheckbox = rightHeaderGrp.add('checkbox', undefined, 'Exibir em lista');
	setFgColor(flatViewCheckbox, normalColor1);
	flatViewCheckbox.helpTip = 'Exibe todos os templates em uma única lista, sem pastas.';
	var itemCounterLab = rightHeaderGrp.add('statictext', undefined, '', { justify: 'right' });
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
	var mainBtnGrp1 = vGrp1.add('group');
	mainBtnGrp1.orientation = 'stack';
	mainBtnGrp1.alignment = 'fill';
	mainBtnGrp1.margins = [0, 8, 0, 0];
	var lBtnGrp1 = mainBtnGrp1.add('group');
	lBtnGrp1.alignment = 'left';
	lBtnGrp1.spacing = 16;
	var refreshBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_ATUALIZAR_ICON !== 'undefined') {
		refreshBtn = new themeIconButton(lBtnGrp1, { icon: D9T_ATUALIZAR_ICON, tips: [lClick + 'Recarregar templates do cache'] });
	} else {
		refreshBtn = lBtnGrp1.add('button', undefined, 'Atualizar');
		refreshBtn.helpTip = 'Recarregar templates do cache';
	}
	var openFldBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_PASTA_ICON !== 'undefined') {
		openFldBtn = new themeIconButton(lBtnGrp1, { icon: D9T_PASTA_ICON, tips: [lClick + 'abrir pasta de templates'] });
	} else {
		openFldBtn = lBtnGrp1.add('button', undefined, 'Abrir');
		openFldBtn.helpTip = 'abrir pasta de templates';
	}
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

    // ===== BLOCO DE INFORMAÇÕES DA ARTE =====
	var infoArteMainGrp = vGrp2.add('group');
	infoArteMainGrp.alignment = ['left', 'top'];
	infoArteMainGrp.spacing = 12;
	var arteInfoGrp = infoArteMainGrp.add('group');
	arteInfoGrp.orientation = 'column';
	arteInfoGrp.alignment = ['left', 'top'];
	arteInfoGrp.alignChildren = 'left';
	var arteHeaderGrp = arteInfoGrp.add('group');
	arteHeaderGrp.alignment = 'fill';
	arteHeaderGrp.orientation = 'stack';
	var arteLabGrp = arteHeaderGrp.add('group');
	arteLabGrp.alignment = 'left';
	var arteLab = arteLabGrp.add('statictext', undefined, 'INFORMAÇÕES DA ARTE:');
	setFgColor(arteLab, normalColor1);
	var codigoGrp = arteInfoGrp.add('group');
	codigoGrp.orientation = 'row';
	codigoGrp.alignChildren = ['left', 'center'];
	codigoGrp.spacing = 8;
	codigoGrp.margins = [0, 8, 0, 0];
	var codigoLab = codigoGrp.add('statictext', undefined, 'Código:');
	codigoLab.preferredSize.width = 60;
	setFgColor(codigoLab, monoColor0);
	var codigoTxt = codigoGrp.add('edittext', [0, 0, 120, 24], '');
	codigoTxt.helpTip = 'Digite o codigo da arte (ex: GNVZ036)';
	var infoRows = [{ label: 'Nome da Arte:', value: '---' }, { label: 'Servidor Destino:', value: '---' }, { label: 'Última Atualização:', value: '---' }, { label: 'Versão:', value: '---' }];
	var infoLabels = [], infoValues = [];
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
    // ===================================================================

	var rBtnGrp2 = vGrp2.add('group');
	rBtnGrp2.alignment = 'right';
	rBtnGrp2.spacing = 16;
	var openBtn;
	if (typeof themeButton === 'function') {
		openBtn = new themeButton(rBtnGrp2, { width: 120, height: 32, labelTxt: 'abrir', tips: [lClick + 'abrir o projeto selecionado'] });
	} else {
		openBtn = rBtnGrp2.add('button', undefined, 'Abrir');
		openBtn.helpTip = 'abrir o projeto selecionado';
		openBtn.preferredSize = [120, 32];
	}
	var importBtn;
	if (typeof themeButton === 'function') {
		importBtn = new themeButton(rBtnGrp2, { width: 120, height: 32, textColor: bgColor1, buttonColor: normalColor1, labelTxt: 'importar', tips: [lClick + 'importar o template selecionado'] });
	} else {
		importBtn = rBtnGrp2.add('button', undefined, 'Importar');
		importBtn.helpTip = 'importar o template selecionado';
		importBtn.preferredSize = [120, 32];
	}

    // ===== FUNÇÕES DE INFORMAÇÃO DA ARTE =====
    function getAepVersion(aepFile) {
        if (!aepFile || !aepFile.exists) { return "N/A"; }
        try {
            aepFile.encoding = "BINARY"; aepFile.open('r'); var fileContent = aepFile.read(4000000); aepFile.close();
            var version = "Adobe After Effects 2020";
            var lastCreatorToolIndex = fileContent.lastIndexOf("<xmp:CreatorTool>"); var lastAgentIndex = fileContent.lastIndexOf("<stEvt:softwareAgent>");
            var searchIndex = -1; var regexToUse = null;
            if (lastCreatorToolIndex > lastAgentIndex) { searchIndex = lastCreatorToolIndex; regexToUse = /<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i; } else if (lastAgentIndex > -1) { searchIndex = lastAgentIndex; regexToUse = /<stEvt:softwareAgent>(.*?)<\/stEvt:softwareAgent>/i; }
            if (searchIndex > -1) { var match = regexToUse.exec(fileContent.substring(searchIndex)); if (match && match[1]) { version = match[1].replace(/^\s+|\s+$/g, ''); } }
            if (version.indexOf("Photoshop") > -1) { version = version.replace("Photoshop", "After Effects"); }
            if (version.indexOf("23.2") > -1) { version = "Adobe After Effects 2023"; }
            return version;
        } catch (e) { return "Erro de leitura"; }
    }
    function generateCodigoFromTemplate(templateName) {
        try {
            var name = (typeof deleteFileExt === 'function' ? deleteFileExt(templateName) : templateName.replace(/\.[^\.]+$/, '')).toUpperCase();
            var currentYear = new Date().getFullYear().toString();
            var cleanName = name.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            var words = cleanName.split(' '); var lettersOnly = cleanName.replace(/[^A-Z]/g, ''); var codigo = '';
            if (words.length >= 3) { var firstTwoLetters = lettersOnly.substring(0, 2); var letterAfterFirstSpace = words[1].charAt(0); var letterAfterSecondSpace = words[2].charAt(0); codigo = firstTwoLetters + letterAfterFirstSpace + letterAfterSecondSpace + currentYear;
            } else if (words.length === 2) { var firstThreeLetters = lettersOnly.substring(0, 3); var letterAfterSpace = words[1].charAt(0); codigo = firstThreeLetters + letterAfterSpace + currentYear;
            } else { codigo = lettersOnly.substring(0, 4) + currentYear; }
            return codigo.toUpperCase();
        } catch (e) { return 'AUTO' + new Date().getFullYear(); }
    }
    function determineServidorDestino(templateName, templatePath) {
        try {
            var name = templateName.toUpperCase(); var path = templatePath ? templatePath.toUpperCase() : ''; var fullText = name + ' ' + path;
            var ilhaTerms = ['PESQUISA', 'DATAFOLHA', 'QUAEST', 'IPEC', 'CREDITO', 'INSERT', 'ALPHA']; for (var i = 0; i < ilhaTerms.length; i++) { if (fullText.indexOf(ilhaTerms[i]) !== -1) return 'PARA ILHA'; }
            var vizTerms = ['CABECALHO', 'QR CODE', 'VIRTUAL', 'TOTEM']; for (var i = 0; i < vizTerms.length; i++) { if (fullText.indexOf(vizTerms[i]) !== -1) return 'VIZ'; }
            var magazineTerms = ['ESTUDIO I', 'ESTÚDIO I', 'STUDIO I', 'STÚDIO I', 'GLOBONEWS INTERNACIONAL', 'BALAIO']; for (var i = 0; i < magazineTerms.length; i++) { if (fullText.indexOf(magazineTerms[i]) !== -1) return 'PAM MAGAZINE'; }
            return 'PAM HARDNEWS';
        } catch (e) { return 'ERRO'; }
    }
    function updateArteInfo() {
        try {
            var selectedTemplate = templateTree.selection;
            if (selectedTemplate && selectedTemplate.type === 'item' && selectedTemplate.filePath) {
                var templateNameWithExt = selectedTemplate.text;
                var nomeDaArte = (typeof deleteFileExt === 'function' ? deleteFileExt(templateNameWithExt) : templateNameWithExt.replace(/\.[^\.]+$/, '')).toUpperCase(); infoValues[0].text = nomeDaArte;
                var generatedCodigo = generateCodigoFromTemplate(templateNameWithExt); codigoTxt.text = generatedCodigo;
                var templatePath = selectedTemplate.filePath; var servidorDestino = determineServidorDestino(templateNameWithExt, templatePath); infoValues[1].text = servidorDestino;
                var modDate = new Date(selectedTemplate.modDate); var day = ('0' + modDate.getDate()).slice(-2); var month = ('0' + (modDate.getMonth() + 1)).slice(-2); var year = modDate.getFullYear(); infoValues[2].text = day + '/' + month + '/' + year;
                var aepFile = new File(selectedTemplate.filePath); var aepVersion = getAepVersion(aepFile); infoValues[3].text = aepVersion;
            } else {
                codigoTxt.text = ''; infoValues[0].text = '---'; infoValues[1].text = '---'; infoValues[2].text = '---'; infoValues[3].text = '---';
            }
        } catch (e) { infoValues[0].text = 'Erro ao atualizar'; infoValues[1].text = 'Erro'; infoValues[2].text = 'Erro'; infoValues[3].text = 'Erro'; }
    }
    // =========================================================

	function loadCacheInBackground(prodName) {
		if (templatesCache[prodName]) return;
		var cacheFileName;
		switch (prodName) {
			case 'PEÇAS GRÁFICAS': cacheFileName = 'templates_pecas_cache.json'; break;
			case 'BASE TEMÁTICA': cacheFileName = 'templates_base_cache.json'; break;
			case 'ILUSTRAÇÕES': cacheFileName = 'templates_ilustra_cache.json'; break;
			default: cacheFileName = prodName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json'; break;
		}
		var templatesCacheFile = new File(cacheFolder.fullName + '/' + cacheFileName);
		if (templatesCacheFile.exists) {
			try {
				templatesCacheFile.open('r'); var cacheContent = templatesCacheFile.read(); templatesCacheFile.close();
				var masterCacheData = JSON.parse(cacheContent); var combinedTreeData = [];
				for (var path in masterCacheData) { if (masterCacheData.hasOwnProperty(path)) { combinedTreeData = combinedTreeData.concat(masterCacheData[path]); } }
				templatesCache[prodName] = combinedTreeData;
			} catch (e) { templatesCache[prodName] = [{ type: 'item', text: 'Erro ao ler o cache.' }]; }
		} else { templatesCache[prodName] = [{ type: 'item', text: 'Cache não encontrado.' }]; }
	}

	// ✅ ===== FUNÇÃO DE CARREGAMENTO CORRIGIDA PARA SER INSTANTÂNEA =====
	function loadTemplatesFromCache() {
		var prodName = validProductions[prodDrop.selection.index].name;

		// Restaura a lógica da versão antiga: só mostra "Carregando" se o cache não estiver na memória.
		if (!templatesCache[prodName]) {
			setLoadingState(true, 'Carregando ' + prodName + '...');
			D9T_TEMPLATES_w.update();
			loadCacheInBackground(prodName); // Carrega do disco
			setLoadingState(false);
		}
		
		templateTree.removeAll();
		var data = templatesCache[prodName];
		var finalData = data;

		if (prodName === 'PEÇAS GRÁFICAS' && data) {
			finalData = filterExcludedFolders(data);
		}
		if (flatViewCheckbox.value && finalData) {
			finalData = getFlatFileList(finalData);
			finalData.sort(function(a, b) { return a.text.localeCompare(b.text); });
		}
		if (finalData && finalData.length > 0) {
			// Usamos a função populateTreeFromData normal, pois a otimizada está causando problemas
			populateTreeFromData(templateTree, finalData); 
			if (!flatViewCheckbox.value) {
				expandAllNodes(templateTree);
			}
		} else {
			templateTree.add('item', 'Nenhum item encontrado para esta categoria.');
		}
		updateItemCounter();
	}
    
	function updateItemCounter() {
		var count = 0;
		function countItemsInNode(node) {
			var nodeCount = 0; if (!node.items) return 0;
			for (var i = 0; i < node.items.length; i++) {
				var item = node.items[i];
				if (item.type === 'item') { nodeCount++; } else if (item.type === 'node') { nodeCount += countItemsInNode(item); }
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

    function expandAllNodes(tree) {
		if (!tree || !tree.items) return;
		function expandRecursive(node) {
			for (var i = 0; i < node.items.length; i++) {
				var item = node.items[i];
				if (item.type === 'node') {
					item.expanded = true;
					if (item.items && item.items.length > 0) { expandRecursive(item); }
				}
			}
		}
		expandRecursive(tree);
	}
    
    function performSearch(searchTerm) {
        var prodName = validProductions[prodDrop.selection.index].name;
        var masterData = templatesCache[prodName];
        if (!masterData) return;
        templateTree.removeAll();
        var dataToProcess = masterData;
        if (prodName === 'PEÇAS GRÁFICAS' && dataToProcess) {
            dataToProcess = filterExcludedFolders(dataToProcess);
        }
        if (flatViewCheckbox.value) {
            dataToProcess = getFlatFileList(dataToProcess);
        }
        if (searchTerm === '') {
            populateTreeFromData(templateTree, dataToProcess);
        } else {
            var searchTermUpper = searchTerm.toUpperCase();
            var cleanSearchTerm = (typeof String.prototype.replaceSpecialCharacters === 'function') ? searchTermUpper.replaceSpecialCharacters() : searchTermUpper;
            var filteredItems = [];
            var itemsToSearch = flatViewCheckbox.value ? dataToProcess : getFlatFileList(dataToProcess);
            for(var i = 0; i < itemsToSearch.length; i++) {
                var item = itemsToSearch[i];
                var itemText = item.text.toUpperCase();
                if (typeof String.prototype.replaceSpecialCharacters === 'function') {
                    itemText = itemText.replaceSpecialCharacters();
                }
                if (itemText.indexOf(cleanSearchTerm) !== -1) {
                    filteredItems.push(item);
                }
            }
            populateTreeFromData(templateTree, filteredItems);
        }
        if (!flatViewCheckbox.value) { expandAllNodes(templateTree); }
        updateItemCounter();
    }

	setBgColor(D9T_TEMPLATES_w, bgColor1);
    
	flatViewCheckbox.onClick = function() {
		loadTemplatesFromCache();
	};

    prodDrop.onChange = function () {
        var i = this.selection.index;
        if (typeof changeIcon === 'function') { changeIcon(i, prodIconGrp); }
        try {
            if (userConfigFile) {
                var userConfig = {};
                if (userConfigFile.exists) {
                    userConfigFile.open('r'); var configContent = userConfigFile.read(); userConfigFile.close();
                    if (configContent) { try { userConfig = JSON.parse(configContent); } catch (jsonError) { userConfig = {}; } }
                }
                if (!userConfig.gnews_templates) { userConfig.gnews_templates = {}; }
                userConfig.gnews_templates.lastProductionIndex = i;
                userConfigFile.open('w'); userConfigFile.write(JSON.stringify(userConfig, null, '\t')); userConfigFile.close();
            }
        } catch (e) {}
        loadTemplatesFromCache();
    };

    D9T_TEMPLATES_w.onShow = function () {
        extendedWidth = D9T_TEMPLATES_w.size.width; compactWidth = extendedWidth - 680;
        vGrp2.visible = true; if (newDiv) newDiv.visible = true; D9T_TEMPLATES_w.size.width = extendedWidth;
		flatViewCheckbox.value = true;
        setLoadingState(true, 'Preparando interface...'); D9T_TEMPLATES_w.update();
        for (var i = 0; i < validProductions.length; i++) { loadCacheInBackground(validProductions[i].name); }
        setLoadingState(false);
        try {
            if (userConfigFile && userConfigFile.exists) {
                userConfigFile.open('r'); var configContent = userConfigFile.read(); userConfigFile.close();
                if (configContent && configContent.trim() !== '') {
                    var centralConfig = JSON.parse(configContent);
                    if (centralConfig.gnews_templates && typeof centralConfig.gnews_templates.lastProductionIndex !== 'undefined') {
                        var lastIndex = parseInt(centralConfig.gnews_templates.lastProductionIndex);
                        if (!isNaN(lastIndex) && lastIndex >= 0 && lastIndex < prodDrop.items.length) { prodDrop.selection = lastIndex; }
                    }
                }
            }
        } catch (e) {}
        loadTemplatesFromCache();
        searchBox.active = true;
        updateArteInfo(); 
    };

	searchBox.onActivate = function() {
		if (this.isPlaceholderActive) { this.text = ''; this.isPlaceholderActive = false; setFgColor(this, normalColor1); }
	};
	searchBox.onDeactivate = function() {
		if (this.text === '') { this.text = placeholderText; this.isPlaceholderActive = true; setFgColor(this, monoColor0); performSearch(''); }
	};
	searchBox.onChanging = function() {
		if (!this.isPlaceholderActive) { performSearch(this.text); }
	};

	function handleRefresh() {
		templatesCache = {};
		setLoadingState(true, 'Recarregando cache...'); D9T_TEMPLATES_w.update();
		try {
            for (var i = 0; i < validProductions.length; i++) { loadCacheInBackground(validProductions[i].name); }
            loadTemplatesFromCache();
		} catch (err) { alert("Ocorreu um erro ao recarregar: " + err.message); }
        setLoadingState(false);
	}
	if (refreshBtn && typeof refreshBtn.leftClick !== 'undefined') { refreshBtn.leftClick.onClick = handleRefresh; } else if (refreshBtn) { refreshBtn.onClick = handleRefresh; }
	if (openFldBtn && typeof openFldBtn.leftClick !== 'undefined') { openFldBtn.leftClick.onClick = function() { openTemplatesFolder(); }; } else if (openFldBtn) { openFldBtn.onClick = function() { openTemplatesFolder(); }; }

	function openTemplatesFolder() {
		if (!prodDrop.selection) { alert("Nenhuma produção selecionada."); return; }
		var selectedProduction = validProductions[prodDrop.selection.index];
		var availablePaths = selectedProduction.paths;
		if (!availablePaths || availablePaths.length === 0) { alert("Nenhum caminho configurado para a produção '" + selectedProduction.name + "'."); return; }
		function openPath(pathString) {
			var folderToShow = new Folder(pathString);
			if (!folderToShow.exists) { alert("A pasta ('" + folderToShow.fsName + "') não foi encontrada."); return; }
			folderToShow.execute();
		}
		if (availablePaths.length === 1) { openPath(availablePaths[0]);
		} else {
			var pathSelectionWin = new Window('dialog', 'Selecionar Pasta');
			pathSelectionWin.add('statictext', undefined, 'Escolha um caminho para abrir:');
			var list = pathSelectionWin.add('listbox', undefined, availablePaths);
			list.selection = 0;
			var btnGrp = pathSelectionWin.add('group');
			btnGrp.add('button', undefined, 'Cancelar', { name: 'cancel' });
			var okBtn = btnGrp.add('button', undefined, 'Abrir', { name: 'ok' });
			okBtn.onClick = function() { if (list.selection) { openPath(list.selection.text); pathSelectionWin.close(); } };
			pathSelectionWin.show();
		}
	}

	templateTree.onChange = function () {
        if (this.selection != null && this.selection.type == 'node') { this.selection = null; return; }
        updateArteInfo();
        if (this.selection == null || !this.selection.filePath) { try { openBtn.enabled = false; importBtn.enabled = false; } catch (e) {} return; }
        projectFile = new File(this.selection.filePath);
        if (typeof this.selection.modDate !== 'undefined' && this.selection.modDate !== null) {
            var fileSize = (this.selection.size / (1024 * 1024)).toFixed(2) + ' MB';
            var modDate = new Date(this.selection.modDate);
            var formattedDate = ('0' + modDate.getDate()).slice(-2) + '/' + ('0' + (modDate.getMonth() + 1)).slice(-2) + '/' + modDate.getFullYear();
            this.selection.helpTip = 'Arquivo: ' + this.selection.text + '\nTamanho: ' + fileSize + '\nModificado em: ' + formattedDate;
        }
        var previewBase = projectFile.path + '/' + (typeof deleteFileExt === 'function' ? deleteFileExt(projectFile.displayName) : projectFile.displayName.replace(/\.[^\.]+$/, ''));
        previewFile = new File(previewBase + '_preview.png');
        if (previewFile.exists) { previewImg.image = previewFile; } else { if (typeof no_preview !== 'undefined') { previewImg.image = no_preview; } }
        try { openBtn.enabled = true; importBtn.enabled = true; } catch (e) {}
    };
	codigoTxt.onChanging = function () {
        var codigo = this.text.trim().toUpperCase();
        if (codigo.length >= 3) {
            var arteInfo = getArteData(codigo);
            if (arteInfo) {
                infoValues[0].text = arteInfo.nome || ''; infoValues[1].text = arteInfo.servidor || ''; infoValues[2].text = arteInfo.ultima_atualizacao || ''; infoValues[3].text = ''; 
            } else {
                infoValues[0].text = '---'; infoValues[1].text = '---'; infoValues[2].text = '---'; infoValues[3].text = '---';
            }
        }
    };

	templateTree.onActivate = function() { try { openBtn.enabled = true; importBtn.enabled = true; } catch (e) {} };
	templateTree.onDoubleClick = function() { if (this.selection != null && this.selection.filePath) { executeOpen(); } };
	if (openBtn && typeof openBtn.leftClick !== 'undefined') { openBtn.leftClick.onClick = function() { executeOpen(); }; } else if (openBtn) { openBtn.onClick = function() { executeOpen(); }; }
	if (importBtn && typeof importBtn.leftClick !== 'undefined') { importBtn.leftClick.onClick = function() { executeImport(); }; } else if (importBtn) { importBtn.onClick = function() { executeImport(); }; }

	function executeOpen() {
		if (templateTree.selection && templateTree.selection.filePath) {
			var fileToOpen = new File(templateTree.selection.filePath);
			if (fileToOpen.exists) { D9T_TEMPLATES_w.close(); app.open(fileToOpen); } else { alert("Arquivo não encontrado."); }
		}
	}
	function executeImport() {
		if (!templateTree.selection || !templateTree.selection.filePath) { alert("Selecione um template."); return; }
		var fileToImport = new File(templateTree.selection.filePath);
		if (!fileToImport.exists) { alert("Arquivo não encontrado."); return; }
		try {
			app.project.bitsPerChannel = 8; app.project.expressionEngine = 'javascript-1.0'; app.project.linearBlending = true; app.project.timeDisplayType = TimeDisplayType.TIMECODE;
			var importOptions = new ImportOptions(fileToImport); app.project.importFile(importOptions);
			var templateName = fileToImport.name.replace(/\.[^\.]+$/, '');
			logGNewsImport(templateName);
			alert("Template '" + templateName + "' importado com sucesso!");
			D9T_TEMPLATES_w.close();
		} catch (e) { alert("Erro ao importar template: " + e.message); }
	}
	function logGNewsImport(templateName) {
		try {
			var logFolder = new Folder(validProductions[prodDrop.selection.index].paths[0]);
			var logPath = logFolder.exists ? logFolder.fsName : scriptMainPath + 'source/logs';
			var logFile = new File(logPath + '/log padeiro.csv');
			var dt = new Date(); var dateStr = ('0' + dt.getDate()).slice(-2) + '/' + ('0' + (dt.getMonth() + 1)).slice(-2) + '/' + dt.getFullYear();
			var timeStr = ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2);
			var logData = [templateName, '1', system.userName, dateStr, timeStr, codigoTxt.text.trim().toUpperCase(), infoValues[0].text, infoValues[1].text, ].join(',');
			if (typeof saveLogData === 'function') {
				saveLogData(logFile, logData);
			} else {
				if (!logFile.exists) {
					logFile.open('w'); logFile.writeln('Template,Quantidade,Designer,Data,Hora,Codigo_Arte,Nome_Arte,Servidor_Destino'); logFile.close();
				}
				logFile.open('a'); logFile.writeln(logData); logFile.close();
			}
			if (typeof sendToWebhookWithCurl === 'function') {
				var webhookURL = "";
				var webData = { template: templateName, quantidade: 1, designer: system.userName, codigo_arte: codigoTxt.text.trim().toUpperCase(), nome_arte: infoValues[0].text, servidor_destino: infoValues[1].text };
				sendToWebhookWithCurl(webData, webhookURL);
			}
		} catch (err) {}
	}

if (infoBtn && typeof infoBtn.leftClick !== 'undefined') {
    infoBtn.leftClick.onClick = function () { showTemplatesHelp(); };
} else if (infoBtn) {
    infoBtn.onClick = function () { showTemplatesHelp(); };
}
	if (cancelBtn && typeof cancelBtn.leftClick !== 'undefined') { cancelBtn.leftClick.onClick = function() { D9T_TEMPLATES_w.close(); }; } else if (cancelBtn) { cancelBtn.onClick = function() { D9T_TEMPLATES_w.close(); }; }

	D9T_TEMPLATES_w.center();
	D9T_TEMPLATES_w.show();
}