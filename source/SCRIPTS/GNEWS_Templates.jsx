// =============================================================================
// GNEWS TEMPLATES - VERSÃO COM INFO DA ARTE RESTAURADO
// =============================================================================

function d9TemplateDialog() {
	var scriptName = 'GNEWS TEMPLATES';
	var scriptVersion = '3.1'; // Versão incrementada
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

	// ===== LÓGICA DE DADOS DA ARTE (RESTAURADA) =====
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
	// =================================================

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
	
    // ===== ALTERAÇÃO DOS MENUS DE PRODUÇÃO =====
	var prodDropItems = ['JORNAIS', 'PROMO', 'PROGRAMAS', 'EVENTOS', 'MARKETING', 'BASE TEMÁTICA', 'ILUSTRAÇÕES'];
    var validProductions = [
        { name: 'JORNAIS', icon: 'D9T_TEMPPECAS_ICON', paths: [] }, // Renomeado
        { name: 'PROMO', icon: 'D9T_TBASE_ICON', paths: [] },      // Adicionado
        { name: 'PROGRAMAS', icon: 'D9T_TBASE_ICON', paths: [] },  // Adicionado
        { name: 'EVENTOS', icon: 'D9T_TBASE_ICON', paths: [] },    // Adicionado
        { name: 'MARKETING', icon: 'D9T_TBASE_ICON', paths: [] },  // Adicionado
        { name: 'BASE TEMÁTICA', icon: 'D9T_TBASE_ICON', paths: [] },
        { name: 'ILUSTRAÇÕES', icon: 'D9T_TILUSTRA_ICON', paths: [] }
    ];

    // Lógica para carregar os paths do arquivo de configuração, se existir
    if (typeof D9T_prodArray !== 'undefined' && D9T_prodArray && D9T_prodArray.length > 0) {
		if (D9T_prodArray.length === 1 && D9T_prodArray[0].pecasGraficas) {
            var configData = D9T_prodArray[0];
            // Mapeia os paths do config para os nomes corretos em validProductions
            for(var i=0; i < validProductions.length; i++){
                if(validProductions[i].name === 'JORNAIS') validProductions[i].paths = configData.pecasGraficas || [];
                if(validProductions[i].name === 'BASE TEMÁTICA') validProductions[i].paths = configData.baseTematica || [];
                if(validProductions[i].name === 'ILUSTRAÇÕES') validProductions[i].paths = configData.ilustracoes || [];
                // Adicione aqui os paths para os novos menus se eles estiverem no seu JSON
            }
        }
    }
    // ===============================================

	if (typeof populateMainIcons === 'function') {
		populateMainIcons(prodIconGrp, validProductions);
	}
	var prodDrop = prodGrp.add('dropdownlist', undefined, prodDropItems, {
		alignment: ['fill', 'center']
	});
	prodDrop.selection = 0;
	prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
	var divProd;
	if (typeof themeDivider === 'function') {
		divProd = themeDivider(vGrp1);
		divProd.alignment = ['fill', 'center'];
	}
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

    // ===== ALTERAÇÃO DA POSIÇÃO DO CHECKBOX =====
    // Grupo do checkbox foi movido para ANTES do searchBox
    var viewOptGrp = treeGrp.add('group');
    viewOptGrp.orientation = 'row';
    viewOptGrp.alignment = ['left', 'center'];
    var flatViewCheckbox = viewOptGrp.add('checkbox', undefined, 'Exibir em lista');
    setFgColor(flatViewCheckbox, normalColor1);
    flatViewCheckbox.helpTip = 'Marque para exibir todos os arquivos em uma lista plana, sem a hierarquia de pastas.';
    flatViewCheckbox.value = true; // Define o checkbox como MARCADO por padrão

	var searchBox = treeGrp.add('edittext', [0, 0, 320, 24], '');
	searchBox.text = placeholderText;
	searchBox.isPlaceholderActive = true;
	setFgColor(searchBox, monoColor0);
    // ==========================================

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

    // ===== BLOCO DE INFORMAÇÕES DA ARTE (RESTAURADO E CORRIGIDO) =====
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

    var infoRows = [{
        label: 'Nome da Arte:',
        value: '---'
    }, {
        label: 'Servidor Destino:',
        value: '---'
    }, {
        label: 'Última Atualização:',
        value: '---'
    }, {
        label: 'Versão:',
        value: '---'
    }];

    var infoLabels = [],
        infoValues = [];
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

    // ===== FUNÇÕES DE INFORMAÇÃO DA ARTE (RESTAURADAS) =====
    function getAepVersion(aepFile) {
        if (!aepFile || !aepFile.exists) { return "N/A"; }
        try {
            aepFile.encoding = "BINARY";
            aepFile.open('r');
            var fileContent = aepFile.read(4000000);
            aepFile.close();
            var version = "Adobe After Effects 2020";
            var lastCreatorToolIndex = fileContent.lastIndexOf("<xmp:CreatorTool>");
            var lastAgentIndex = fileContent.lastIndexOf("<stEvt:softwareAgent>");
            var searchIndex = -1;
            var regexToUse = null;
            if (lastCreatorToolIndex > lastAgentIndex) {
                searchIndex = lastCreatorToolIndex;
                regexToUse = /<xmp:CreatorTool>(.*?)<\/xmp:CreatorTool>/i;
            } else if (lastAgentIndex > -1) {
                searchIndex = lastAgentIndex;
                regexToUse = /<stEvt:softwareAgent>(.*?)<\/stEvt:softwareAgent>/i;
            }
            if (searchIndex > -1) {
                var match = regexToUse.exec(fileContent.substring(searchIndex));
                if (match && match[1]) {
                    version = match[1].replace(/^\s+|\s+$/g, '');
                }
            }
            if (version.indexOf("Photoshop") > -1) {
                version = version.replace("Photoshop", "After Effects");
            }
            if (version.indexOf("23.2") > -1) {
                version = "Adobe After Effects 2023";
            }
            return version;
        } catch (e) {
            return "Erro de leitura";
        }
    }

    function generateCodigoFromTemplate(templateName) {
        try {
            var name = (typeof deleteFileExt === 'function' ? deleteFileExt(templateName) : templateName.replace(/\.[^\.]+$/, '')).toUpperCase();
            var currentYear = new Date().getFullYear().toString();
            var cleanName = name.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            var words = cleanName.split(' ');
            var lettersOnly = cleanName.replace(/[^A-Z]/g, '');
            var codigo = '';
            if (words.length >= 3) {
                var firstTwoLetters = lettersOnly.substring(0, 2);
                var letterAfterFirstSpace = words[1].charAt(0);
                var letterAfterSecondSpace = words[2].charAt(0);
                codigo = firstTwoLetters + letterAfterFirstSpace + letterAfterSecondSpace + currentYear;
            } else if (words.length === 2) {
                var firstThreeLetters = lettersOnly.substring(0, 3);
                var letterAfterSpace = words[1].charAt(0);
                codigo = firstThreeLetters + letterAfterSpace + currentYear;
            } else {
                codigo = lettersOnly.substring(0, 4) + currentYear;
            }
            return codigo.toUpperCase();
        } catch (e) {
            return 'AUTO' + new Date().getFullYear();
        }
    }

    function determineServidorDestino(templateName, templatePath) {
        try {
            var name = templateName.toUpperCase();
            var path = templatePath ? templatePath.toUpperCase() : '';
            var fullText = name + ' ' + path;
            var ilhaTerms = ['PESQUISA', 'DATAFOLHA', 'QUAEST', 'IPEC', 'CREDITO', 'INSERT', 'ALPHA'];
            for (var i = 0; i < ilhaTerms.length; i++) {
                if (fullText.indexOf(ilhaTerms[i]) !== -1) return 'PARA ILHA';
            }
            var vizTerms = ['CABECALHO', 'QR CODE', 'VIRTUAL', 'TOTEM'];
            for (var i = 0; i < vizTerms.length; i++) {
                if (fullText.indexOf(vizTerms[i]) !== -1) return 'VIZ';
            }
            var magazineTerms = ['ESTUDIO I', 'ESTÚDIO I', 'STUDIO I', 'STÚDIO I', 'GLOBONEWS INTERNACIONAL', 'BALAIO'];
            for (var i = 0; i < magazineTerms.length; i++) {
                if (fullText.indexOf(magazineTerms[i]) !== -1) return 'PAM MAGAZINE';
            }
            return 'PAM HARDNEWS';
        } catch (e) {
            return 'ERRO';
        }
    }

    function updateArteInfo() {
        try {
            var selectedTemplate = templateTree.selection;
            if (selectedTemplate && selectedTemplate.type === 'item' && selectedTemplate.filePath) {
                var templateNameWithExt = selectedTemplate.text;
                var nomeDaArte = (typeof deleteFileExt === 'function' ? deleteFileExt(templateNameWithExt) : templateNameWithExt.replace(/\.[^\.]+$/, '')).toUpperCase();
                infoValues[0].text = nomeDaArte;
                var generatedCodigo = generateCodigoFromTemplate(templateNameWithExt);
                codigoTxt.text = generatedCodigo;
                var templatePath = selectedTemplate.filePath;
                var servidorDestino = determineServidorDestino(templateNameWithExt, templatePath);
                infoValues[1].text = servidorDestino;
                var modDate = new Date(selectedTemplate.modDate);
                var day = ('0' + modDate.getDate()).slice(-2);
                var month = ('0' + (modDate.getMonth() + 1)).slice(-2);
                var year = modDate.getFullYear();
                infoValues[2].text = day + '/' + month + '/' + year;
                var aepFile = new File(selectedTemplate.filePath);
                var aepVersion = getAepVersion(aepFile);
                infoValues[3].text = aepVersion;
            } else {
                codigoTxt.text = '';
                infoValues[0].text = '---';
                infoValues[1].text = '---';
                infoValues[2].text = '---';
                infoValues[3].text = '---';
            }
        } catch (e) {
            infoValues[0].text = 'Erro ao atualizar';
            infoValues[1].text = 'Erro';
            infoValues[2].text = 'Erro';
            infoValues[3].text = 'Erro';
        }
    }
    // =========================================================

	function loadCacheInBackground(prodName) {
		if (templatesCache[prodName]) return;
		var cacheFileName;
        // Mapeamento de nomes de produção para nomes de arquivo de cache
		switch (prodName) {
			case 'JORNAIS': cacheFileName = 'templates_pecas_cache.json'; break;
			case 'BASE TEMÁTICA': cacheFileName = 'templates_base_cache.json'; break;
			case 'ILUSTRAÇÕES': cacheFileName = 'templates_ilustra_cache.json'; break;
            // Para os novos, um padrão genérico
			default: cacheFileName = 'templates_' + prodName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json'; break;
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
				templatesCache[prodName] = [{ type: 'item', text: 'Erro ao ler o cache.' }];
			}
		} else {
			templatesCache[prodName] = [{ type: 'item', text: 'Cache para "' + prodName + '" não encontrado.' }];
		}
	}

    function populateTreeFromDataOptimized(treeNode, dataArray) {
        treeNode.visible = false;
        try {
            var batchSize = 50;
            var currentBatch = 0;
            function processBatch() {
                var endIndex = Math.min(currentBatch + batchSize, dataArray.length);
                for (var i = currentBatch; i < endIndex; i++) {
                    var itemData = dataArray[i];
                    if (itemData.type === 'node') {
                        var node = treeNode.add('node', itemData.text);
                        if (typeof D9T_FOLDER_AE_ICON !== 'undefined') { node.image = D9T_FOLDER_AE_ICON; }
                        if (itemData.children && itemData.children.length > 0) {
                            populateTreeFromDataOptimized(node, itemData.children);
                        }
                    } else if (itemData.type === 'item') {
                        var item = treeNode.add('item', itemData.text);
                        if (typeof D9T_AE_ICON !== 'undefined') { item.image = D9T_AE_ICON; }
                        item.filePath = itemData.filePath;
                        item.modDate = itemData.modDate;
                        item.size = itemData.size;
                    }
                }
                currentBatch = endIndex;
                if (currentBatch < dataArray.length) {
                    $.sleep(1);
                    processBatch();
                }
            }
            processBatch();
        } finally {
            treeNode.visible = true;
        }
    }

    function populateTreeFromList(treeNode, dataArray) {
        treeNode.visible = false;
        try {
            var flatList = flattenData(dataArray);

            var batchSize = 50;
            var currentBatch = 0;
            function processBatch() {
                var endIndex = Math.min(currentBatch + batchSize, flatList.length);
                for (var i = currentBatch; i < endIndex; i++) {
                    var itemData = flatList[i];
                    var item = treeNode.add('item', itemData.text);
                    if (typeof D9T_AE_ICON !== 'undefined') {
                        item.image = D9T_AE_ICON;
                    }
                    item.filePath = itemData.filePath;
                    item.modDate = itemData.modDate;
                    item.size = itemData.size;
                }
                currentBatch = endIndex;
                if (currentBatch < flatList.length) {
                    $.sleep(1);
                    processBatch();
                }
            }
            processBatch();
        } finally {
            treeNode.visible = true;
        }
    }

	function loadTemplatesFromCache() {
        var prodName = validProductions[prodDrop.selection.index].name;
        templateTree.removeAll();
        if (!templatesCache[prodName]) {
            setLoadingState(true, 'Carregando ' + prodName + '...');
            D9T_TEMPLATES_w.update();
            loadCacheInBackground(prodName);
            setLoadingState(false);
        }
        var data = templatesCache[prodName];
        if (data && data.length > 0) {
            if (flatViewCheckbox.value) {
                populateTreeFromList(templateTree, data);
            } else {
                populateTreeFromDataOptimized(templateTree, data);
                expandAllNodes(templateTree);
            }
        } else {
            templateTree.add('item', 'Nenhum item encontrado para "' + prodName + '".');
        }
        updateItemCounter();
    }
    
	function updateItemCounter() {
		var count = 0;
		function countItemsInNode(node) {
			var nodeCount = 0;
			if (!node.items) return 0;
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
        flatViewCheckbox.enabled = !isLoading;
	}

    function expandAllNodes(tree) {
        if (!tree || !tree.items) return;
        tree.visible = false;
        try {
            function expandRecursive(node) {
                for (var i = 0; i < node.items.length; i++) {
                    var item = node.items[i];
                    if (item.type === 'node') {
                        item.expanded = true;
                        if (item.items && item.items.length > 0) {
                            expandRecursive(item);
                        }
                    }
                }
            }
            expandRecursive(tree);
        } finally {
            tree.visible = true;
        }
    }
    
    function performSearch(searchTerm) {
        var prodName = validProductions[prodDrop.selection.index].name;
        var masterData = templatesCache[prodName];
        if (!masterData) return;
        templateTree.visible = false;
        try {
            templateTree.removeAll();
            if (searchTerm === '') {
                if (flatViewCheckbox.value) {
                    populateTreeFromList(templateTree, masterData);
                } else {
                    populateTreeFromDataOptimized(templateTree, masterData);
                }
            } else {
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
                if (flatViewCheckbox.value) {
                    populateTreeFromList(templateTree, filteredTreeData);
                } else {
                    populateTreeFromDataOptimized(templateTree, filteredTreeData);
                }
            }
            if (!flatViewCheckbox.value) {
                expandAllNodes(templateTree);
            }
        } finally {
            templateTree.visible = true;
        }
        updateItemCounter();
    }

	setBgColor(D9T_TEMPLATES_w, bgColor1);
    
    prodDrop.onChange = function () {
        var i = this.selection.index;
        if (typeof changeIcon === 'function') {
            changeIcon(i, prodIconGrp);
        }
        try {
            if (userConfigFile) {
                var userConfig = {};
                if (userConfigFile.exists) {
                    userConfigFile.open('r');
                    var configContent = userConfigFile.read();
                    userConfigFile.close();
                    if (configContent) { try { userConfig = JSON.parse(configContent); } catch (jsonError) { userConfig = {}; } }
                }
                if (!userConfig.gnews_templates) { userConfig.gnews_templates = {}; }
                userConfig.gnews_templates.lastProductionIndex = i;
                userConfigFile.open('w');
                userConfigFile.write(JSON.stringify(userConfig, null, '\t'));
                userConfigFile.close();
            }
        } catch (e) {}
        loadTemplatesFromCache();
    };

    flatViewCheckbox.onClick = function() {
        // Recarrega a visualização (árvore ou lista) ao clicar
        performSearch(searchBox.isPlaceholderActive ? '' : searchBox.text);
    };

    D9T_TEMPLATES_w.onShow = function () {
        extendedWidth = D9T_TEMPLATES_w.size.width;
        compactWidth = extendedWidth - 680;
        vGrp2.visible = true;
        if (newDiv) newDiv.visible = true;
        D9T_TEMPLATES_w.size.width = extendedWidth;
        setLoadingState(true, 'Preparando interface...');
        D9T_TEMPLATES_w.update();
        for (var i = 0; i < validProductions.length; i++) {
            loadCacheInBackground(validProductions[i].name);
        }
        setLoadingState(false);
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
        loadTemplatesFromCache();
        searchBox.active = true;
        updateArteInfo();
    };

	searchBox.onActivate = function() {
		if (this.isPlaceholderActive) {
			this.text = '';
			this.isPlaceholderActive = false;
			setFgColor(this, normalColor1);
		}
	};
	searchBox.onDeactivate = function() {
		if (this.text === '') {
			this.text = placeholderText;
			this.isPlaceholderActive = true;
			setFgColor(this, monoColor0);
			performSearch('');
		}
	};
	searchBox.onChanging = function() {
		if (!this.isPlaceholderActive) { performSearch(this.text); }
	};

	function handleRefresh() {
		templatesCache = {};
		setLoadingState(true, 'Recarregando cache...');
        D9T_TEMPLATES_w.update();
		try {
            for (var i = 0; i < validProductions.length; i++) {
                loadCacheInBackground(validProductions[i].name);
            }
            loadTemplatesFromCache();
		} catch (err) {
			alert("Ocorreu um erro ao recarregar: " + err.message);
		}
        setLoadingState(false);
	}
	if (refreshBtn && typeof refreshBtn.leftClick !== 'undefined') {
		refreshBtn.leftClick.onClick = handleRefresh;
	} else if (refreshBtn) {
		refreshBtn.onClick = handleRefresh;
	}

	if (openFldBtn && typeof openFldBtn.leftClick !== 'undefined') {
		openFldBtn.leftClick.onClick = function() { openTemplatesFolder(); };
	} else if (openFldBtn) {
		openFldBtn.onClick = function() { openTemplatesFolder(); };
	}

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
		if (availablePaths.length === 1) {
			openPath(availablePaths[0]);
		} else {
			var pathSelectionWin = new Window('dialog', 'Selecionar Pasta');
			pathSelectionWin.add('statictext', undefined, 'Escolha um caminho para abrir:');
			var list = pathSelectionWin.add('listbox', undefined, availablePaths);
			list.selection = 0;
			var btnGrp = pathSelectionWin.add('group');
			btnGrp.add('button', undefined, 'Cancelar', { name: 'cancel' });
			var okBtn = btnGrp.add('button', undefined, 'Abrir', { name: 'ok' });
			okBtn.onClick = function() {
				if (list.selection) {
					openPath(list.selection.text);
					pathSelectionWin.close();
				}
			};
			pathSelectionWin.show();
		}
	}

	templateTree.onChange = function () {
        if (this.selection != null && this.selection.type == 'node') {
            this.selection = null;
            return;
        }
        updateArteInfo();
        if (this.selection == null || !this.selection.filePath) {
            try { openBtn.enabled = false; importBtn.enabled = false; } catch (e) {}
            return;
        }
        projectFile = new File(this.selection.filePath);
        if (typeof this.selection.modDate !== 'undefined' && this.selection.modDate !== null) {
            var fileSize = (this.selection.size / (1024 * 1024)).toFixed(2) + ' MB';
            var modDate = new Date(this.selection.modDate);
            var formattedDate = ('0' + modDate.getDate()).slice(-2) + '/' + ('0' + (modDate.getMonth() + 1)).slice(-2) + '/' + modDate.getFullYear();
            this.selection.helpTip = 'Arquivo: ' + this.selection.text + '\nTamanho: ' + fileSize + '\nModificado em: ' + formattedDate;
        }

        // ===== LÓGICA DE PREVIEW ATUALIZADA =====
        var previewBaseName = (typeof deleteFileExt === 'function' ? deleteFileExt(projectFile.displayName) : projectFile.displayName.replace(/\.[^\.]+$/, ''));
        var previewBase = projectFile.path + '/' + previewBaseName;
        var foundPreview = false;

        // 1. Tenta encontrar o preview ao lado do arquivo
        previewFile = new File(previewBase + '_preview.png');
        if (previewFile.exists) {
            previewImg.image = previewFile;
            foundPreview = true;
        }
        
        // 2. Se não encontrar, procura na pasta _PREVIEWS
        if (!foundPreview) {
            var previewFolder = new Folder(projectFile.path + '/_PREVIEWS');
            if (previewFolder.exists) {
                // Tenta com sufixo _preview.png
                var previewInFolder = new File(previewFolder.fullName + '/' + previewBaseName + '_preview.png');
                if (previewInFolder.exists) {
                    previewImg.image = previewInFolder;
                    foundPreview = true;
                } else {
                    // Tenta com outros formatos de imagem (png, jpg)
                    var potentialPreviews = previewFolder.getFiles(previewBaseName + '.*');
                    for (var p = 0; p < potentialPreviews.length; p++) {
                        if (/\.(png|jpg|jpeg)$/i.test(potentialPreviews[p].name)) {
                            previewImg.image = potentialPreviews[p];
                            foundPreview = true;
                            break;
                        }
                    }
                }
            }
        }

        // 3. Se ainda não encontrou, usa a imagem padrão
        if (!foundPreview && typeof no_preview !== 'undefined') {
            previewImg.image = no_preview;
        }
        // ==========================================

        try { openBtn.enabled = true; importBtn.enabled = true; } catch (e) {}
    };

	codigoTxt.onChanging = function () {
        var codigo = this.text.trim().toUpperCase();
        if (codigo.length >= 3) {
            var arteInfo = getArteData(codigo);
            if (arteInfo) {
                infoValues[0].text = arteInfo.nome || '';
                infoValues[1].text = arteInfo.servidor || '';
                infoValues[2].text = arteInfo.ultima_atualizacao || '';
				infoValues[3].text = ''; // Versão não vem do JSON, limpa o campo
            } else {
                infoValues[0].text = '---';
                infoValues[1].text = '---';
                infoValues[2].text = '---';
				infoValues[3].text = '---';
            }
        }
    };

	templateTree.onActivate = function() {
		try { openBtn.enabled = true; importBtn.enabled = true; } catch (e) {}
	};
	templateTree.onDoubleClick = function() {
		if (this.selection != null && this.selection.filePath) { executeOpen(); }
	};

	if (openBtn && typeof openBtn.leftClick !== 'undefined') { openBtn.leftClick.onClick = function() { executeOpen(); }; } else if (openBtn) { openBtn.onClick = function() { executeOpen(); }; }
	if (importBtn && typeof importBtn.leftClick !== 'undefined') { importBtn.leftClick.onClick = function() { executeImport(); }; } else if (importBtn) { importBtn.onClick = function() { executeImport(); }; }

	function executeOpen() {
		if (templateTree.selection && templateTree.selection.filePath) {
			var fileToOpen = new File(templateTree.selection.filePath);
			if (fileToOpen.exists) {
				D9T_TEMPLATES_w.close();
				app.open(fileToOpen);
			} else { alert("Arquivo não encontrado."); }
		}
	}

	function executeImport() {
		if (!templateTree.selection || !templateTree.selection.filePath) { alert("Selecione um template."); return; }
		var fileToImport = new File(templateTree.selection.filePath);
		if (!fileToImport.exists) { alert("Arquivo não encontrado."); return; }
		try {
			app.project.bitsPerChannel = 8;
			app.project.expressionEngine = 'javascript-1.0';
			app.project.linearBlending = true;
			app.project.timeDisplayType = TimeDisplayType.TIMECODE;
			var importOptions = new ImportOptions(fileToImport);
			app.project.importFile(importOptions);
			var templateName = fileToImport.name.replace(/\.[^\.]+$/, '');
			logGNewsImport(templateName);
			alert("Template '" + templateName + "' importado com sucesso!");
			D9T_TEMPLATES_w.close();
		} catch (e) {
			alert("Erro ao importar template: " + e.message);
		}
	}

	function logGNewsImport(templateName) {
		try {
			var logFolder = new Folder(validProductions[prodDrop.selection.index].paths[0]);
			var logPath = logFolder.exists ? logFolder.fsName : scriptMainPath + 'source/logs';
			var logFile = new File(logPath + '/log padeiro.csv');
			var dt = new Date();
			var dateStr = ('0' + dt.getDate()).slice(-2) + '/' + ('0' + (dt.getMonth() + 1)).slice(-2) + '/' + dt.getFullYear();
			var timeStr = ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2);
			var logData = [templateName, '1', system.userName, dateStr, timeStr, codigoTxt.text.trim().toUpperCase(), infoValues[0].text, infoValues[1].text, ].join(',');
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
		} catch (err) {}
	}

	if (infoBtn && typeof infoBtn.leftClick !== 'undefined') { infoBtn.leftClick.onClick = function() { showHelpDialog(); }; } else if (infoBtn) { infoBtn.onClick = function() { showHelpDialog(); }; }
	function showHelpDialog() { /* ... implementação da ajuda ... */ }
	if (cancelBtn && typeof cancelBtn.leftClick !== 'undefined') { cancelBtn.leftClick.onClick = function() { D9T_TEMPLATES_w.close(); }; } else if (cancelBtn) { cancelBtn.onClick = function() { D9T_TEMPLATES_w.close(); }; }

	D9T_TEMPLATES_w.center();
	D9T_TEMPLATES_w.show();
}