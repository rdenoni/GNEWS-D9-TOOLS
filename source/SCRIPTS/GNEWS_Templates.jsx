/*

---------------------------------------------------------------
> 🪟 UI dialogs
---------------------------------------------------------------

*/

function d9TemplateDialog() {
	var scriptName = 'GNEWS TEMPLATES';
	var compactWidth, extendedWidth;
	var fileFilter = ['.aep', '.aet'];
	var projectFile, previewFile, configFile, scriptFile, templateData;
	var newCompsArray = [], newOutputsArray = [];
	
    // --- ALTERADO: Aponta para a nova pasta de cache centralizada ---
    var cacheFolder = new Folder(scriptMainPath + 'source/cache');
    if (!cacheFolder.exists) cacheFolder.create();
    
    // --- NOVO: Variável para manter o cache em memória e evitar releituras do disco ---
    var templatesCache = {};

	var userConfigFile = null;
	try {
		var centralConfigFolder = new Folder(scriptMainPath + 'source/config');
		if (!centralConfigFolder.exists) centralConfigFolder.create();
		userConfigFile = new File(centralConfigFolder.fullName + '/TEMPLATES_config.json');
	} catch (e) { userConfigFile = null; }

	var artesData = null;
	try {
		var artesDataFile = new File(scriptMainPath + 'source/libraries/dados_json/DADOS_artes_gnews.json');
		if (artesDataFile.exists) {
			artesDataFile.open('r');
			artesData = JSON.parse(artesDataFile.read());
			artesDataFile.close();
		}
	} catch (err) {}

	function getArteData(codigo) { if (!artesData || !artesData.artes_codificadas) return null; for (var i = 0; i < artesData.artes_codificadas.length; i++) { if (artesData.artes_codificadas[i].codigo === codigo) return artesData.artes_codificadas[i]; } return null; }

	var bgColor1 = '#0B0D0E', normalColor1 = '#C7C8CA', monoColor0 = '#686F75', monoColor1 = '#9CA0A5', monoColor2 = '#302b2bff', normalColor2 = '#ffffffff', highlightColor1 = '#E0003A';
	function hexToRgb(hex) { if (hex == undefined) return [Math.random(), Math.random(), Math.random()]; hex = hex.replace('#', ''); var r = parseInt(hex.substring(0, 2), 16); var g = parseInt(hex.substring(2, 4), 16); var b = parseInt(hex.substring(4, 6), 16); return [r / 255, g / 255, b / 255]; }
	function setBgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var bType = element.graphics.BrushType.SOLID_COLOR; element.graphics.backgroundColor = element.graphics.newBrush(bType, color); } catch (e) { } }
	function setFgColor(element, hexColor) { try { var color = hexToRgb(hexColor); var pType = element.graphics.PenType.SOLID_COLOR; element.graphics.foregroundColor = element.graphics.newPen(pType, color, 1); } catch (e) { } }

	var D9T_TEMPLATES_w = new Window('palette', scriptName + ' ' + scriptVersion);
	D9T_TEMPLATES_w.orientation = 'column';
	D9T_TEMPLATES_w.alignChildren = ['fill', 'top'];
	D9T_TEMPLATES_w.spacing = 0;
	var topHeaderGrp = D9T_TEMPLATES_w.add('group');
	topHeaderGrp.orientation = 'row';
	topHeaderGrp.alignment = ['fill', 'top'];
	topHeaderGrp.margins = [0, 5, 10, 0];
	var titlePlaceholder = topHeaderGrp.add('statictext', undefined, '');
	titlePlaceholder.alignment = ['fill', 'center'];
	var helpBtnGrp = topHeaderGrp.add('group');
	helpBtnGrp.alignment = ['right', 'center'];
	var infoBtn;
	if (typeof themeIconButton === 'function' && typeof D9T_INFO_ICON !== 'undefined') { infoBtn = new themeIconButton(helpBtnGrp, { icon: D9T_INFO_ICON, tips: [lClick + 'ajuda | DOCS'] }); } else { infoBtn = helpBtnGrp.add('button', undefined, '?'); infoBtn.helpTip = 'ajuda | DOCS'; infoBtn.preferredSize = [24, 24]; }
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
	var cancelBtn = new themeButton(optBtnMainGrpL, { width: 80, height: 32, labelTxt: 'cancelar', tips: [lClick + 'cancelar operação'] });
	var optBtnMainGrpR = optBtnMainGrp.add('group');
	optBtnMainGrpR.alignment = 'right';
	optBtnMainGrpR.spacing = 16;
	var nextBtn = new themeButton(optBtnMainGrpR, { width: 100, height: 32, textColor: bgColor1, buttonColor: normalColor1, labelTxt: 'continuar', tips: [lClick + 'continuar processo'] });
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
			validProductions = [
				{ name: 'PEÇAS GRÁFICAS', icon: 'D9T_PECAS_ICON', paths: configData.pecasGraficas || [] },
				{ name: 'BASE TEMÁTICA', icon: 'D9T_BASE_ICON', paths: configData.baseTematica || [] },
				{ name: 'ILUSTRAÇÕES', icon: 'D9T_ILUS_ICON', paths: configData.ilustracoes || [] }
			];
			prodDropItems = ['PEÇAS GRÁFICAS', 'BASE TEMÁTICA', 'ILUSTRAÇÕES'];
		}
	}
	if (typeof populateMainIcons === 'function') { populateMainIcons(prodIconGrp, validProductions); }
	var prodDrop = prodGrp.add('dropdownlist', undefined, prodDropItems);
	prodDrop.selection = 0;
	prodDrop.alignment = ['fill', 'center'];
	prodDrop.helpTip = "PRODUÇÃO SELECIONADA";
	var divProd; if (typeof themeDivider === 'function') { divProd = themeDivider(vGrp1); divProd.alignment = ['fill', 'center']; }
	var templatesHeaderGrp = vGrp1.add('group');
	templatesHeaderGrp.alignment = 'fill';
	var templateLab = templatesHeaderGrp.add('statictext', undefined, 'BUSCA:');
	setFgColor(templateLab, normalColor1);
	var treeGrp = vGrp1.add('group');
	treeGrp.orientation = 'column';
	treeGrp.spacing = 4;
	var placeholderText = '⌕  Digite para Buscar...';
	var searchBox = treeGrp.add('edittext', [0, 0, 320, 24], '');
	searchBox.text = placeholderText;
	setFgColor(searchBox, monoColor0);
	var templateTree = treeGrp.add('treeview', [0, 0, 320, 420]);
	setFgColor(templateTree, monoColor1);
	var mainBtnGrp1 = vGrp1.add('group');
	mainBtnGrp1.orientation = 'stack';
	mainBtnGrp1.alignment = 'fill';
	mainBtnGrp1.margins = [0, 8, 0, 0];
	var lBtnGrp1 = mainBtnGrp1.add('group');
	lBtnGrp1.alignment = 'left';
	lBtnGrp1.spacing = 16;
	var refreshBtn; if (typeof themeIconButton === 'function' && typeof D9T_ATUALIZAR_ICON !== 'undefined') { refreshBtn = new themeIconButton(lBtnGrp1, { icon: D9T_ATUALIZAR_ICON, tips: [lClick + 'Recarregar templates do cache'] }); } else { refreshBtn = lBtnGrp1.add('button', undefined, 'Atualizar'); refreshBtn.helpTip = 'Recarregar templates do cache'; }
	var openFldBtn; if (typeof themeIconButton === 'function' && typeof D9T_PASTA_ICON !== 'undefined') { openFldBtn = new themeIconButton(lBtnGrp1, { icon: D9T_PASTA_ICON, tips: [lClick + 'abrir pasta de templates'] }); } else { openFldBtn = lBtnGrp1.add('button', undefined, 'Abrir'); openFldBtn.helpTip = 'abrir pasta de templates'; }

	// --- FUNÇÃO DE CARREGAMENTO DE CACHE TOTALMENTE REFEITA ---
    function loadTemplatesFromCache(forceReload) {
        templateTree.removeAll();
        var selectedProduction = validProductions[prodDrop.selection.index];
        var prodName = selectedProduction.name;

        // Se não for forçado, tenta carregar da memória primeiro
        if (!forceReload && templatesCache[prodName]) {
            if (templatesCache[prodName].length > 0) {
                populateTreeFromData(templateTree, templatesCache[prodName]);
                expandAllNodes(templateTree);
            } else {
                templateTree.add('item', 'Cache vazio. Nenhum arquivo .aep/.aet foi encontrado.').enabled = false;
            }
            return;
        }

        // Feedback visual de carregamento
        var loadingItem = templateTree.add('item', 'Carregando cache...');
        loadingItem.enabled = false;
        D9T_TEMPLATES_w.update();

        var cacheFileName = prodName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_cache.json';
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
                templateTree.removeAll();

                if (combinedTreeData.length > 0) {
                    populateTreeFromData(templateTree, combinedTreeData);
                    expandAllNodes(templateTree);
                } else {
                    templateTree.add('item', 'Cache vazio. Nenhum arquivo .aep/.aet foi encontrado.').enabled = false;
                    templateTree.add('item', "Use 'Configurações' > 'Testar' para gerar o cache.").enabled = false;
                }
            } catch (e) {
                templateTree.removeAll();
                templateTree.add('item', 'Erro ao ler o cache. Tente recriá-lo.').enabled = false;
                templateTree.add('item', "Vá em 'Configurações' > 'Testar'.").enabled = false;
            }
        } else {
            templateTree.removeAll();
            templateTree.add('item', 'Cache de templates não encontrado.').enabled = false;
            templateTree.add('item', "Vá em 'Configurações' e use o botão").enabled = false;
            templateTree.add('item', "'Testar e Gerar Cache' para criá-lo.").enabled = false;
        }
    }
    
    function expandAllNodes(tree) { if (!tree || !tree.items) return; for (var i = 0; i < tree.items.length; i++) { var item = tree.items[i]; if (item.type === 'node') { item.expanded = true; if (item.items && item.items.length > 0) { expandAllNodes(item); } } } }
	
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
	var previewImg; if (typeof no_preview !== 'undefined') { previewImg = previewGrp.add('image', [0, 0, 600, 338], no_preview); } else { previewImg = previewGrp.add('image', [0, 0, 600, 338]); }
	var newDiv; if (typeof themeDivider === 'function') { newDiv = themeDivider(vGrp2); newDiv.alignment = ['fill', 'center']; }
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
	var codigoTxt = codigoGrp.add('edittext', [0, 0, 120, 24], 'GNVZ036');
	codigoTxt.helpTip = 'Digite o código da arte (ex: GNVZ036)';
	var infoRows = [ { label: 'Nome da Arte:', value: '---' }, { label: 'Servidor Destino:', value: '---' }, { label: 'Última Atualização:', value: new Date().toLocaleDateString('pt-BR') }];
	var infoLabels = [], infoValues = [];
	for (var r = 0; r < infoRows.length; r++) { var infoRow = arteInfoGrp.add('group'); infoRow.orientation = 'row'; infoRow.alignChildren = ['left', 'center']; infoRow.spacing = 8; infoRow.margins = [0, 2, 0, 0]; var label = infoRow.add('statictext', undefined, infoRows[r].label); label.preferredSize.width = 100; setFgColor(label, monoColor0); infoLabels.push(label); var value = infoRow.add('statictext', undefined, infoRows[r].value); value.preferredSize.width = 180; setFgColor(value, normalColor2); infoValues.push(value); }
	function updateArteInfo() { try { var codigo = codigoTxt.text.trim().toUpperCase(); var arteData = getArteData(codigo); if (arteData) { infoValues[0].text = arteData.arte || '---'; infoValues[1].text = arteData.servidor_destino || '---'; infoValues[2].text = new Date().toLocaleDateString('pt-BR'); } else { infoValues[0].text = codigo ? 'Código não encontrado' : '---'; infoValues[1].text = '---'; infoValues[2].text = '---'; } } catch (e) { infoValues[0].text = 'Erro ao carregar'; infoValues[1].text = '---'; infoValues[2].text = '---'; } }
	codigoTxt.onChanging = function () { try { updateArteInfo(); } catch (e) {} };
	var mainBtnGrp2 = vGrp2.add('group');
	mainBtnGrp2.orientation = 'stack';
	mainBtnGrp2.alignment = 'fill';
	var rBtnGrp2 = mainBtnGrp2.add('group');
	rBtnGrp2.alignment = 'right';
	rBtnGrp2.spacing = 16;
	var importBtn; if (typeof themeButton === 'function') { importBtn = new themeButton(rBtnGrp2, { width: 120, height: 32, textColor: bgColor1, buttonColor: normalColor1, labelTxt: 'importar', tips: [lClick + 'importar o template selecionado'] }); } else { importBtn = rBtnGrp2.add('button', undefined, 'Importar'); importBtn.helpTip = 'importar o template selecionado'; importBtn.preferredSize = [120, 32]; }
	setBgColor(D9T_TEMPLATES_w, bgColor1);
	
	prodDrop.onChange = function () {
		var i = this.selection.index;
		if (typeof changeIcon === 'function') { changeIcon(i, prodIconGrp); }
		try { if (userConfigFile) { var userConfig = {}; if (userConfigFile.exists) { userConfigFile.open('r'); var configContent = userConfigFile.read(); userConfigFile.close(); if (configContent) { try { userConfig = JSON.parse(configContent); } catch (jsonError) { userConfig = {}; } } } if (!userConfig.gnews_templates) { userConfig.gnews_templates = {}; } userConfig.gnews_templates.lastProductionIndex = i; userConfigFile.open('w'); userConfigFile.write(JSON.stringify(userConfig, null, '\t')); userConfigFile.close(); } } catch (e) {}
		loadTemplatesFromCache(false);
	};
	D9T_TEMPLATES_w.onShow = function () {
		extendedWidth = D9T_TEMPLATES_w.size.width; 
		compactWidth = extendedWidth - 680; 
		vGrp2.visible = true;
		if (newDiv) newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;
		try { if (userConfigFile && userConfigFile.exists) { userConfigFile.open('r'); var configContent = userConfigFile.read(); userConfigFile.close(); if (configContent && configContent.trim() !== '') { var centralConfig = JSON.parse(configContent); if (centralConfig.gnews_templates && typeof centralConfig.gnews_templates.lastProductionIndex !== 'undefined') { var lastIndex = parseInt(centralConfig.gnews_templates.lastProductionIndex); if (!isNaN(lastIndex) && lastIndex >= 0 && lastIndex < prodDrop.items.length) { prodDrop.selection = lastIndex; } } } } } catch (e) {}
		prodDrop.onChange(); 
		searchBox.active = true;
		updateArteInfo();
	};
	searchBox.onFocus = function () { if (this.text === placeholderText) { this.text = ''; setFgColor(this, normalColor1); } };
	searchBox.onBlur = function () { if (this.text.trim() === '') { this.text = placeholderText; setFgColor(this, monoColor0); } };
	searchBox.onEnterKey = function () { templateLab.active = true; templateTree.active = true; };
	
    searchBox.onChanging = function () {
        loadTemplatesFromCache(false);
        D9T_TEMPLATES_w.update();
        if (this.text.trim() === '' || this.text === placeholderText) {
            return;
        }
        try {
            var searchTerm = this.text.trim().toUpperCase();
            if (typeof String.prototype.replaceSpecialCharacters === 'function') { searchTerm = searchTerm.replaceSpecialCharacters(); }
            var items = findItem(templateTree, [], searchTerm);
            if (items.length == 0) return;
            for (var n = 0; n < items.length; n++) {
                var s = items[n];
                if (s.type == 'node') s.expanded = true;
                var p = s.parent;
                while (p && p.constructor.name != 'TreeView') {
                    p.expanded = true;
                    p = p.parent;
                }
            }
        } catch (e) {}
    };

	// --- FUNÇÃO CORRIGIDA PARA LER O CAMINHO DO ARQUIVO CORRETAMENTE ---
    templateTree.onChange = function () {
		if (this.selection == null || this.selection.type == 'node' || this.selection.file == null) {
			if(importBtn) importBtn.enabled = false;
			return;
		}
		
		projectFile = new File(this.selection.file);
		
		var templateBase = projectFile.path + '/' + (typeof deleteFileExt === 'function' ? deleteFileExt(projectFile.displayName) : projectFile.displayName.replace(/\.[^\.]+$/, ''));
		previewFile = new File(templateBase + '_preview.png');
		configFile = new File(templateBase + '_config.json');
		scriptFile = new File(templateBase + '_script.js');
		
		if (this.selection.size !== undefined && this.selection.modDate !== undefined) {
			var fileSize = (this.selection.size / (1024*1024)).toFixed(2) + ' MB';
			var modDate = new Date(this.selection.modDate).toLocaleString('pt-BR');
			this.selection.helpTip = 'Arquivo: ' + this.selection.text + '\nTamanho: ' + fileSize + '\nModificado em: ' + modDate;
		}
		
		if (previewFile.exists) { previewImg.image = previewFile; } else { if (typeof no_preview !== 'undefined') { previewImg.image = no_preview; } }
		vGrp2.visible = true;
		if (newDiv) newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;
		try { if (configFile.exists) { var JSONContent; if (typeof readFileContent === 'function') { JSONContent = readFileContent(configFile); } else { configFile.open('r'); JSONContent = configFile.read(); configFile.close(); } templateData = JSON.parse(JSONContent); if (typeof defaultTemplateConfigObj !== 'undefined') { for (var o in defaultTemplateConfigObj) { if (templateData.hasOwnProperty(o)) continue; templateData[o] = defaultTemplateConfigObj[o]; } } } } catch (err) { alert((typeof lol !== 'undefined' ? lol : '') + '#D9T_017 - config inválido!'); return; }
		if (typeof importBtn !== 'undefined') { importBtn.enabled = true; }
	};

	templateTree.onActivate = function () { if (typeof importBtn !== 'undefined') { importBtn.enabled = true; } };
	if (importBtn && typeof importBtn.leftClick !== 'undefined') { importBtn.leftClick.onClick = function () { executeImport(); }; } else if (importBtn) { importBtn.onClick = function () { executeImport(); }; }
	function executeImport() {
		if (!projectFile || !projectFile.exists) return;
		templatesMainGrp.visible = false; optionsMainGrp.visible = true; D9T_TEMPLATES_w.size = [compactWidth, 60]; D9T_TEMPLATES_w.text = 'IMPORTANDO TEMPLATE...'; infoHeaderLab.text = 'projeto:  ' + projectFile.displayName; D9T_TEMPLATES_w.update(); D9T_TEMPLATES_w.center();
		app.project.bitsPerChannel = 8; app.project.expressionEngine = 'javascript-1.0'; app.project.linearBlending = true; app.project.timeDisplayType = TimeDisplayType.TIMECODE;
		try { var IO = new ImportOptions(projectFile); app.project.importFile(IO); } catch (err) { alert((typeof lol !== 'undefined' ? lol : '') + '#D9T_018 - ' + err.message); templatesMainGrp.visible = true; optionsMainGrp.visible = false; D9T_TEMPLATES_w.size.width = extendedWidth; D9T_TEMPLATES_w.text = scriptName + ' ' + scriptVersion; return; }
		D9T_TEMPLATES_w.text = 'REGISTRANDO LOG...'; infoHeaderLab.text = 'TEMPLATE IMPORTADO COM SUCESSO!'; progressBar.value = 0; D9T_TEMPLATES_w.update();
		try { var logFolder = new Folder(validProductions[prodDrop.selection.index].paths[0]); var logPath = logFolder.exists ? logFolder.fsName : projectFile.path; var logFile = new File(logPath + '/log padeiro.csv'); var dt = new Date(); var y = dt.getFullYear(); var m = dt.getMonth() + 1; var d = dt.getDate(); var hr = dt.getHours(); var mi = dt.getMinutes(); if (m < 10) m = '0' + m; if (d < 10) d = '0' + d; if (hr < 10) hr = '0' + hr; if (mi < 10) mi = '0' + mi; var dateStr = [d, m, y].join('/'); var timeStr = hr + ':' + mi; var templateName = projectFile.displayName.replace(/\.[^\.]+$/, ''); var logData = [templateName, '1', system.userName, dateStr, timeStr, codigoTxt.text.trim().toUpperCase(), infoValues[0].text, infoValues[1].text].join(','); if (typeof saveLogData === 'function') { saveLogData(logFile, logData); } else { if (!logFile.exists) { logFile.open('w'); logFile.writeln('Template,Quantidade,Designer,Data,Hora,Codigo_Arte,Nome_Arte,Servidor_Destino'); logFile.close(); } logFile.open('a'); logFile.writeln(logData); logFile.close(); } if (typeof sendToWebhookWithCurl === 'function') { var webhookURL = ""; var webData = { template: templateName, quantidade: 1, designer: system.userName, codigo_arte: codigoTxt.text.trim().toUpperCase(), nome_arte: infoValues[0].text, servidor_destino: infoValues[1].text }; sendToWebhookWithCurl(webData, webhookURL); } } catch (err) { }
		D9T_TEMPLATES_w.text = 'IMPORTAÇÃO CONCLUÍDA'; infoHeaderLab.text = 'TEMPLATE IMPORTADO COM SUCESSO!'; D9T_TEMPLATES_w.size = [compactWidth, 100]; optBtnMainGrp.visible = true;
	}
	if (nextBtn && typeof nextBtn.leftClick !== 'undefined') { nextBtn.leftClick.onClick = function () { D9T_TEMPLATES_w.close(); }; } else if (nextBtn) { nextBtn.onClick = function () { D9T_TEMPLATES_w.close(); }; }
	if (cancelBtn && typeof cancelBtn.leftClick !== 'undefined') { cancelBtn.leftClick.onClick = function () { D9T_TEMPLATES_w.close(); }; } else if (cancelBtn) { cancelBtn.onClick = function () { D9T_TEMPLATES_w.close(); }; }
	D9T_TEMPLATES_w.onClose = function () { if (!scriptFile || !scriptFile.exists) return; try { scriptFile.open('r'); eval(scriptFile.read()); scriptFile.close(); } catch (err) { alert((typeof lol !== 'undefined' ? lol : '') + '#D9T_021 - ' + err.message); } };
	templateTree.onDoubleClick = function () { if (this.selection == null || this.selection.file == null) return; if (!projectFile || !projectFile.exists) return; try { var IO = new ImportOptions(projectFile); app.project.importFile(IO); D9T_TEMPLATES_w.close(); } catch (err) { alert((typeof lol !== 'undefined' ? lol : '') + '#D9T_022 - ' + err.message); } };
	
    if (refreshBtn && typeof refreshBtn.leftClick !== 'undefined') { refreshBtn.leftClick.onClick = function () { loadTemplatesFromCache(true); }; } else if (refreshBtn) { refreshBtn.onClick = function () { loadTemplatesFromCache(true); }; }
	
    if (openFldBtn && typeof openFldBtn.leftClick !== 'undefined') { openFldBtn.leftClick.onClick = function () { openTemplatesFolder(); }; } else if (openFldBtn) { openFldBtn.onClick = function () { openTemplatesFolder(); }; }
	function openTemplatesFolder() { var folderToShow = new Folder(validProductions[prodDrop.selection.index].paths[0]); if (!folderToShow.exists) { alert("A pasta configurada ('" + folderToShow.fsName + "') não foi encontrada ou está inacessível."); return; } if (system.osName.indexOf('Windows') !== -1) { system.callSystem('explorer "' + folderToShow.fsName + '"'); } else { system.callSystem('open "' + folderToShow.fsName + '"'); } }
	if (infoBtn && typeof infoBtn.leftClick !== 'undefined') { infoBtn.leftClick.onClick = function () { showHelpDialog(); }; } else if (infoBtn) { infoBtn.onClick = function () { showHelpDialog(); }; }
	function showHelpDialog() {
		var TARGET_HELP_WIDTH=450,MARGIN_SIZE=15,TOPIC_SECTION_MARGINS=[10,5,10,5],TOPIC_SPACING=5,TOPIC_TITLE_INDENT=0,SUBTOPIC_INDENT=25;
		var helpWin=new Window("dialog",scriptName+" - Ajuda",undefined,{closeButton:true});helpWin.orientation="column";helpWin.alignChildren=["fill","fill"];helpWin.spacing=10;helpWin.margins=MARGIN_SIZE;helpWin.preferredSize=[TARGET_HELP_WIDTH,600];
		if(typeof bgColor1!=='undefined'&&typeof setBgColor!=='undefined'){setBgColor(helpWin,bgColor1);}else{helpWin.graphics.backgroundColor=helpWin.graphics.newBrush(helpWin.graphics.BrushType.SOLID_COLOR,[0.05,0.04,0.04,1]);}
		var headerPanel=helpWin.add("panel",undefined,"");headerPanel.orientation="column";headerPanel.alignChildren=["fill","top"];headerPanel.alignment=["fill","top"];headerPanel.spacing=10;headerPanel.margins=15;
		var titleText=headerPanel.add("statictext",undefined,"AJUDA - GNEWS TEMPLATES");titleText.graphics.font=ScriptUI.newFont("Arial","Bold",16);titleText.alignment=["center","center"];if(typeof normalColor1!=='undefined'&&typeof highlightColor1!=='undefined'&&typeof setFgColor!=='undefined'){setFgColor(titleText,highlightColor1);}else{titleText.graphics.foregroundColor=titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR,[1,1,1,1],1);}
		var mainDescText=headerPanel.add("statictext",undefined,"Gerencie e preencha templates GNEWS com informações automáticas das artes.",{multiline:true});mainDescText.alignment=["fill","fill"];mainDescText.preferredSize.height=40;if(typeof normalColor1!=='undefined'&&typeof setFgColor!=='undefined'){setFgColor(mainDescText,normalColor1);}else{mainDescText.graphics.foregroundColor=mainDescText.graphics.newPen(mainDescText.graphics.PenType.SOLID_COLOR,[1,1,1,1],1);}
		var topicsTabPanel=helpWin.add("tabbedpanel");topicsTabPanel.alignment=["fill","fill"];topicsTabPanel.margins=15;
		var allHelpTopics=[{tabName:"VISÃO GERAL",topics:[{title:"▶ SELEÇÃO DE TEMPLATE:",text:"Navegue pela árvore à esquerda para selecionar um template (.aep ou .aet). O preview aumentado e informações da arte GNEWS aparecerão à direita."},{title:"▶ PREVIEW AUMENTADO:",text:"Visualização maior dos templates para melhor análise visual antes do processamento."},{title:"▶ ATUALIZAR LISTA (🔄):",text:"Recarrega a lista de templates na árvore."},{title:"▶ ABRIR PASTA (📁):",text:"Abre o diretório onde os templates estão armazenados."}]},{tabName:"INFORMAÇÕES GNEWS",topics:[{title:"▶ CÓDIGO DA ARTE:",text:"Digite o código da arte GNEWS (ex: GNVZ036). As informações são carregadas automaticamente do banco de dados."},{title:"▶ NOME DA ARTE:",text:"Exibido automaticamente baseado no código informado."},{title:"▶ SERVIDOR DESTINO:",text:"Servidor de destino da arte, carregado automaticamente (ex: FTP VIZ, PAM HARDNEWS)."},{title:"▶ ÚLTIMA ATUALIZAÇÃO:",text:"Data da última modificação/processamento da arte."}]},{tabName:"PROCESSAMENTO",topics:[{title:"▶ IMPORTAR:",text:"Importa o template diretamente para o projeto e registra informações GNEWS no log."},{title:"▶ SEM ORGANIZAÇÃO AUTOMÁTICA:",text:"O projeto não é mais organizado automaticamente, mantendo a estrutura original."},{title:"▶ SEM METADADOS XMP:",text:"Metadados XMP não são mais adicionados automaticamente."},{title:"▶ SEM FILA DE RENDER:",text:"Sistema de fila de renderização foi removido para fluxo mais direto."},{title:"▶ LOG GNEWS:",text:"Registra informações específicas GNEWS incluindo código da arte, nome e servidor destino."}]},{tabName:"ATALHOS",topics:[{title:"▶ DUPLO CLIQUE:",text:"Duplo clique em um template importa diretamente sem processamento de texto, mantendo a estrutura original."}]}];
		for(var s=0;s<allHelpTopics.length;s++){var currentTabSection=allHelpTopics[s];var tab=topicsTabPanel.add("tab",undefined,currentTabSection.tabName);tab.orientation="column";tab.alignChildren=["fill","top"];tab.spacing=10;tab.margins=TOPIC_SECTION_MARGINS;for(var i=0;i<currentTabSection.topics.length;i++){var topic=currentTabSection.topics[i];var topicGrp=tab.add("group");topicGrp.orientation="column";topicGrp.alignChildren="fill";topicGrp.spacing=TOPIC_SPACING;if(topic.title.indexOf("▶")===0){topicGrp.margins.left=TOPIC_TITLE_INDENT;}else{topicGrp.margins.left=SUBTOPIC_INDENT;}var topicTitle=topicGrp.add("statictext",undefined,topic.title);topicTitle.graphics.font=ScriptUI.newFont("Arial","Bold",12);if(typeof highlightColor1!=='undefined'&&typeof setFgColor!=='undefined'){setFgColor(topicTitle,highlightColor1);}else{topicTitle.graphics.foregroundColor=topicTitle.graphics.newPen(topicTitle.graphics.PenType.SOLID_COLOR,[0.83,0,0.23,1],1);}topicTitle.preferredSize.width=(TARGET_HELP_WIDTH-(MARGIN_SIZE*2)-(topicsTabPanel.margins.left+topicsTabPanel.margins.right)-(tab.margins.left+tab.margins.right)-topicGrp.margins.left);if(topic.text!==""){var topicText=topicGrp.add("statictext",undefined,topic.text,{multiline:true});topicText.graphics.font=ScriptUI.newFont("Arial","Regular",11);topicText.preferredSize.width=(TARGET_HELP_WIDTH-(MARGIN_SIZE*2)-(topicsTabPanel.margins.left+topicsTabPanel.margins.right)-(tab.margins.left+tab.margins.right)-topicGrp.margins.left);topicText.preferredSize.height=50;if(typeof normalColor1!=='undefined'&&typeof setFgColor!=='undefined'){setFgColor(topicText,normalColor1);}else{topicText.graphics.foregroundColor=topicText.graphics.newPen(topicText.graphics.PenType.SOLID_COLOR,[1,1,1,1],1);}}}}
		var closeBtnGrp=helpWin.add("group");closeBtnGrp.alignment="center";closeBtnGrp.margins=[0,10,0,0];var closeBtn=closeBtnGrp.add("button",undefined,"OK");closeBtn.onClick=function(){helpWin.close();};helpWin.layout.layout(true);helpWin.center();helpWin.show();
	}

	D9T_TEMPLATES_w.show();
}