/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/*

---------------------------------------------------------------
> 🪟 UI dialog
---------------------------------------------------------------

*/

function d9ProdFoldersDialog(prodArray) {
	var scriptName = 'LISTA DE PRODUÇÕES';
	// var scriptVersion = scriptVersion;

	function addProductionLine(prodObj) {
		var nameTxt = prodObj.name;
		var pathTxt = prodObj.templatesPath;
		var iconImg = prodObj.icon;

		var prodGrp = prodMainGrp.add('group', undefined);
		prodGrp.orientation = 'column';
		prodGrp.alignChildren = ['left', 'center'];
		prodGrp.spacing = 8;

		var newDiv = themeDivider(prodGrp);
		newDiv.alignment = ['fill', 'center'];

		var prodDataGrp = prodGrp.add('group', undefined);
		prodDataGrp.orientation = 'row';
		prodDataGrp.alignChildren = ['left', 'center'];
		prodDataGrp.spacing = 8;

		var prodNameTxt = prodDataGrp.add('edittext', undefined, nameTxt);
		prodNameTxt.helpTip = 'nome que aparecerá no menu';
		prodNameTxt.preferredSize = [130, 24];

		var prodIconBtn = prodDataGrp.add('iconbutton', undefined, undefined, {
			style: 'toolbutton',
			prodIcon: prodObj.icon
		});

		try {
			prodIconBtn.image = eval(iconImg);
		} catch (err) {
			prodIconBtn.image = defaultProductionDataObj.PRODUCTIONS[0].icon;
		}

		prodIconBtn.helpTip = 'ícone, 24px x 24px, que aparecerá no menu (opcional)';
		prodIconBtn.preferredSize = [36, 36];

		var prodPathLab = prodDataGrp.add('statictext', undefined, pathTxt, {
			prodPath: prodObj.templatesPath,
			truncate: 'middle'
		});

		prodPathLab.helpTip = 'edite o caminho da pasta de templates:\n\n' + prodObj.templatesPath;
		prodPathLab.preferredSize = [400, 24];
		setCtrlHighlight(prodPathLab, normalColor2, highlightColor1); // Cor de destaque do texto

		// var deleteBtn = prodDataGrp.add('iconbutton', undefined, closeIcon.light, { style: 'toolbutton' });
		var deleteBtn = new themeIconButton(prodDataGrp, {
			icon: D9T_FECHAR_ICON,
			tips: [lClick + 'deletar produção']
		});

		// =======

		prodIconBtn.onClick = function () {
			var newIconFile = File.openDialog('selecione o ícone', '*.png', false);

			if (newIconFile != null) {
				this.properties.prodIcon = fileToBinary(newIconFile);
				this.image = newIconFile;
			}
			this.parent.layout.layout(true);
		};

		prodPathLab.addEventListener('mousedown', function () {
			var newTemplatesFolder = new Folder(this.properties.prodPath);
			var newTemplatesPath = newTemplatesFolder.selectDlg('selecione a pasta de templates'); // Abre a janela de seleção de pastas

			if (newTemplatesPath == null) return; // Se a janela foi cancelada, não faz nada

			this.properties.prodPath = newTemplatesPath.fullName;
			this.text = newTemplatesPath.fullName;
			this.helpTip = 'caminho da pasta de templates:\n\n' + newTemplatesPath.fullName;
		});

		deleteBtn.leftClick.onClick = function () {
			prodMainGrp.remove(this.parent.parent.parent.parent);
			D9T_CONFIG_w.layout.layout(true);
			D9T_CONFIG_w.layout.resize();
		};
	}

	// window...
	var D9T_CONFIG_w = new Window('dialog', scriptName + ' ' + scriptVersion);
	D9T_CONFIG_w.orientation = 'column';
	D9T_CONFIG_w.alignChildren = ['center', 'top'];
	D9T_CONFIG_w.spacing = 12;
	D9T_CONFIG_w.margins = 16;

	// ========

	// Cria um grupo para o cabeçalho da árvore de templates
	var headerGrp = D9T_CONFIG_w.add('group');
	headerGrp.alignment = 'fill'; // Ocupa todo o espaço disponível
	headerGrp.orientation = 'stack'; // Empilha os elementos verticalmente

	// Cria um grupo para o botão de informações
	var labGrp = headerGrp.add('group');
	labGrp.alignment = 'left'; // Alinhamento à esquerda

	// Cria um grupo para o botão de informações
	var infoGrp = headerGrp.add('group');
	infoGrp.alignment = 'right'; // Alinhamento à direita

	// Rótulo de preview
	var listLabTxt = labGrp.add('statictext', undefined, 'PRODUÇÕES:'); // Adiciona um texto estático
	setFgColor(listLabTxt, normalColor1); // Define a cor do texto

	// Cria o botão de informações
	// var infoBtn = infoGrp.add('iconbutton', undefined, D9T_INFO_ICON.light, { style: 'toolbutton' });
	// infoBtn.helpTip = 'ajuda | DOCS'; // Define a dica da ferramenta
	var infoBtn = new themeIconButton(infoGrp, {
		icon: D9T_INFO_ICON,
		tips: [lClick + 'ajuda | DOCS']
	});

	var prodMainGrp = D9T_CONFIG_w.add('group', undefined);
	prodMainGrp.orientation = 'column';
	prodMainGrp.spacing = 10;

	for (var u = 0; u < prodArray.length; u++) {
		try {
			addProductionLine(prodArray[u]);
			//
		} catch (err) {
			prodArray[u].icon = defaultProductionDataObj.PRODUCTIONS[0].icon;
			addProductionLine(prodArray[u]);
		}
	}

	// ========

	// Criação do grupo de botões principal
	var BtnGrp = D9T_CONFIG_w.add('group', undefined);
	BtnGrp.orientation = 'stack';
	BtnGrp.alignment = 'fill';
	BtnGrp.margins = [0, 32, 0, 0]; // Margens do grupo de botões (15 pixels em cima)

	// Grupo dos botões à esquerda
	var bGrp1 = BtnGrp.add('group');
	bGrp1.alignment = 'left'; // Alinha o subgrupo à esquerda

	// Grupo do botão à direita
	var bGrp2 = BtnGrp.add('group');
	bGrp2.alignment = 'right'; // Alinha o subgrupo à direita

	var prodImportBtn = new themeButton(bGrp1, {
		width: 80,
		height: 32,
		labelTxt: 'importar',
		tips: [lClick + 'importar uma lista de produções']
	});

	var prodExportBtn = new themeButton(bGrp1, {
		width: 80,
		height: 32,
		labelTxt: 'exportar',
		tips: [lClick + 'exportar a lista completa de produções']
	});

	var prodNewBtn = new themeButton(bGrp2, {
		width: 120,
		height: 32,
		labelTxt: '+ nova produção',
		tips: [lClick + 'criar nova produção']
	});

	var prodSaveBtn = new themeButton(bGrp2, {
		width: 120,
		height: 32,
		textColor: bgColor1,
		buttonColor: normalColor1,
		labelTxt: 'salvar lista',
		tips: [lClick + 'salvar a lista de produções']
	});

	setBgColor(D9T_CONFIG_w, bgColor1); // Cor de fundo da janela

	infoBtn.leftClick.onClick = function () {
		var siteUrl = ""
	};

	prodImportBtn.leftClick.onClick = function () {
		tempConfigFile = File.openDialog('selecione o ícone', '*.json', false);

		if (tempConfigFile == null || !(tempConfigFile instanceof File)) return;

		var tempArray = updateProdData(tempConfigFile);

		while (prodMainGrp.children.length > 0) {
			prodMainGrp.remove(prodMainGrp.children[0]);
		}

		for (var j = 0; j < tempArray.length; j++) {
			addProductionLine(tempArray[j]);
		}
		D9T_CONFIG_w.layout.layout(true);
		updateThemeButton(prodSaveBtn, true);
	};

	prodExportBtn.leftClick.onClick = function () {
		var tempConfigFile = File.saveDialog('salvar configuração', '*.json');

		if (tempConfigFile == null) return;

		try {
			var tempArray = [];

			for (var u = 0; u < prodMainGrp.children.length; u++) {
				var subGrp = prodMainGrp.children[u].children[1];

				var tempObj = {
					name: subGrp.children[0].text,
					icon: subGrp.children[1].properties.prodIcon,
					templatesPath: subGrp.children[2].properties.prodPath
				};

				tempArray.push(tempObj);
			}

			var configContent = JSON.stringify({ PRODUCTIONS: sortProdData(tempArray) }, null, '\t');
			saveTextFile(configContent, tempConfigFile.fullName);

			D9T_CONFIG_w.close();
		} catch (err) {
			alert(lol + '#D9T_014 - ' + err.message);
		}
	};

	prodNewBtn.leftClick.onClick = function () {
		try {
			addProductionLine(defaultProductionDataObj.PRODUCTIONS[0]);
		} catch (err) {
			alert(lol + '#D9T_013 - ' + err.message);
		}

		prodMainGrp.layout.layout(true);
		D9T_CONFIG_w.layout.layout(true);
	};

	prodSaveBtn.leftClick.onClick = function () {
		try {
			var tempArray = [];

			for (var u = 0; u < prodMainGrp.children.length; u++) {
				var subGrp = prodMainGrp.children[u].children[1];

				var tempObj = {
					name: subGrp.children[0].text,
					icon: subGrp.children[1].properties.prodIcon,
					templatesPath: subGrp.children[2].properties.prodPath
				};
				tempArray.push(tempObj);
			}

			configFile = saveProdData(sortProdData(tempArray));
			D9T_CONFIG_w.close();
		} catch (err) {
			alert(lol + '#D9T_016 - ' + err.message);
		}
	};

	D9T_CONFIG_w.show();
}
