// ADICIONADO: Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/*

---------------------------------------------------------------
# globais
---------------------------------------------------------------

*/

// Determina o sistema operacional atual
var appOs = $.os.indexOf('Win') >= 0 ? 'Win' : 'Mac';

// Versão do After Effects
var appV = parseInt(app.buildName.substring(0, 2));
var appFullV = app.buildName.split(/x/i)[0];

// Cores do Style Guide GNEWS
var bgColor1 = '#161616ff';
var bgColor2 = '#1b1b1bff';
var divColor1 = '#1d1d1fff';
var divColor2 = '#080808ff';
var monoColor0 = '#F2F2F2';
var monoColor1 = '#C7C8CA';
var monoColor2 = '#302b2bff';
var monoColor3 = '#1a1919ff';
var normalColor1 = '#ffffffff';
var normalColor2 = '#E6E6E6FF';
var highlightColor1 = '#FF0046FF';
var highlightColor2 = '#f1f1f1ff';
var successColor = '#97e341ff'; // Verde para sucesso
var warningColor = '#fba524ff'; // Laranja para aviso

// Preferências de scripts e expressões
var AE_prefName = 'Pref_SCRIPTING_FILE_NETWORK_SECURITY';
var AE_prefSection = 'Main Pref Section';
var AE_netConfigName = '"Allow Scripts to Write Files and Access Network"';


// --------------------- Preferências ---------------------

var userPath = Folder.userData.fullName;
var AEPreferencesPath = userPath + '/Adobe/After Effects/' + appFullV;

// Caminhos para as preferências do script e pasta temporária
var scriptPreferencesPath = Folder.userData.fullName + '/GND9TOOLS script';
var scriptPreferencesFolder = new Folder(scriptPreferencesPath);
if (!scriptPreferencesFolder.exists) scriptPreferencesFolder.create();

var tempPath = scriptPreferencesPath + '/temp';
var tempFolder = new Folder(tempPath);
if (!tempFolder.exists) tempFolder.create();

var templatesLocalPath = scriptPreferencesPath + '/templates';
var templatesLocalFolder = new Folder(templatesLocalPath);
if (!templatesLocalFolder.exists) templatesLocalFolder.create();



// Objeto com a lista inicial de produções
var defaultProductionDataObj = {
	PRODUCTIONS: [
		{
			name: 'Ω PASTA LOCAL',
			icon: localPc,
			templatesPath: templatesLocalPath
		}
	]
};

// Dados das produções
var D9T_prodArray = (typeof TEMPLATES_CONFIG !== 'undefined' && TEMPLATES_CONFIG.PRODUCTIONS) ? 
                    TEMPLATES_CONFIG.PRODUCTIONS : 
                    defaultProductionDataObj.PRODUCTIONS;

// Caminho da pasta de templates
var templatesPath = D9T_prodArray[0].templatesPath;
var templatesFolder = new Folder(D9T_prodArray[0].templatesPath);



// --------------------- Strings e Mensagens ---------------------

// Emojis e mensagens (opcional)
var lol = 'Σ(っ °Д °;)っ        ';
var relax = 'ヽ(✿ﾟ▽ﾟ)ノ        ';

var lClick = '◖  →  ';
var rClick = '   →  ';
var dClick = '◖◖ →  ';



var globalSeparator = ' - ';

// 'uiObj' armazena os controles da interface, grupos seus respectivos arrays
var D9T_ui = {
	iconButtonArray: [],
	imageButtonArray: [],
	sectionGrpArray: [],
	divArray: []
};

// Objeto para armazenar as preferências carregadas do arquivo JSON
var scriptPreferencesObj = {};

// Define os valores padrão das preferências do usuário.
var defaultScriptPreferencesObj = {
	color: {
		menu: {
			light: '#3E50B4',
			dark: '#8FF7A7'
		},
		controls: {
			light: '#BF3A48',
			dark: '#DA6877'
		},
		animation: {
			light: '#CB6259',
			dark: '#B7B5E4 '
		},
		tools: {
			light: '#6EA57D',
			dark: '#E2EE96'
		},
		effects: {
			light: '#D68A69',
			dark: '#ACCDEC'
		},
		text: {
			light: '#C2B6A3',
			dark: '#F4E76E'
		},
		brand: {
			light: '#3F3F58',
			dark: '#BBBBBD'
		},
		project: {
			light: '#00B5C2',
			dark: '#7CC6FE'
		},
		shortcuts: {
			light: '#CD4548',
			dark: '#FFB398'
		},
		app: {
			light: '#6639B6',
			dark: '#FFAFB7'
		},
		dev: {
			light: '#202020',
			dark: '#F4FAFF'
		}
	},
	labels: [
		'#F44336',
		'#E81D62',
		'#9B26AF',
		'#6639B6',
		'#3E50B4',
		'#02A8F3',
		'#00BBD3',
		'#009587',
		'#8AC249',
		'#CCDB38',
		'#FEEA3A',
		'#FE9700',
		'#FF5722',
		'#785447',
		'#9D9D9D',
		'#5F7C8A'
	],
	folders: {
		// Caminho padrão para a pasta do projeto
		projPath: '~/Desktop'
	},
	uiSettings: {
		iconSize: [36, 36],
		iconSpacing: 20,
		labelSpacing: 8,
		compactIconSize: [28, 28],
		compactIconSpacing: 12
	},
	selection: {
		// Preferências de seleção (tipos de camadas null e adjustment, modo de projeto)
		nullType: 0, // Tipo de camada null padrão (0: shape layer, 1: null layer)
		adjType: 0, // Tipo de camada de ajuste padrão (0: shape layer, 1: adjustment layer)
		projectMode: 0 // Modo de projeto padrão (0: legado, 1: customizado)
	},
	themeColors: {
		bgColor1: bgColor1,
		bgColor2: bgColor2,
		divColor1: divColor1,
		monoColor0: monoColor0,
		monoColor1: monoColor1,
		monoColor2: monoColor2,
		monoColor3: monoColor3,
		normalColor1: normalColor1,
		normalColor2: normalColor2,
		highlightColor1: highlightColor1
	},
	ignoreMissing: true, // Ignorar arquivos ausentes (padrão: não)
	devMode: false, // Modo de desenvolvedor (padrão: não)
	homeOffice: false, // Modo home office (padrão: não)
	iconTheme: 'dark' // Tema de ícones (padrão: escuro)
};

// Carrega as preferências do usuário a partir do arquivo 'User_Preferences.json' ou usa os valores padrão.
function loadScriptPreferences() {
	// Tenta carregar o arquivo de preferências
	var tempFile = new File(scriptPreferencesPath + '/User_Preferences.json');

	// Se o arquivo existir, tenta ler seu conteúdo
	if (tempFile.exists) {
		var tempFileContent = readFileContent(tempFile); // Lê o conteúdo do arquivo JSON

		try {
			scriptPreferencesObj = JSON.parse(tempFileContent); // Converte o conteúdo JSON para um objeto JavaScript
			//
		} catch (err) {
			// Exibe um alerta se houver erro ao carregar o JSON
			alert('Falha ao carregar as preferências... ' + lol + '\n' + err.message);
		}
	}

	// Preenche as preferências com os valores padrão, caso não existam
	for (var o in defaultScriptPreferencesObj) {
		if (!scriptPreferencesObj.hasOwnProperty(o))
			scriptPreferencesObj[o] = defaultScriptPreferencesObj[o];
	}
	if (!scriptPreferencesObj.themeColors) {
		scriptPreferencesObj.themeColors = {};
	}
	for (var tc in defaultScriptPreferencesObj.themeColors) {
		if (!scriptPreferencesObj.themeColors.hasOwnProperty(tc)) {
			scriptPreferencesObj.themeColors[tc] = defaultScriptPreferencesObj.themeColors[tc];
		}
	}
	applyThemeColorOverrides(scriptPreferencesObj.themeColors);
	iconTheme = scriptPreferencesObj.iconTheme; // Define o tema de ícones

	if (!scriptPreferencesObj.uiSettings) {
		scriptPreferencesObj.uiSettings = JSON.parse(JSON.stringify(defaultScriptPreferencesObj.uiSettings));
	}
	if (typeof scriptPreferencesObj.uiSettings.labelSpacing !== 'number') {
		scriptPreferencesObj.uiSettings.labelSpacing = defaultScriptPreferencesObj.uiSettings.labelSpacing;
	}
	if (!scriptPreferencesObj.uiSettings.compactIconSize) {
		scriptPreferencesObj.uiSettings.compactIconSize = defaultScriptPreferencesObj.uiSettings.compactIconSize.slice(0);
	}
	if (typeof scriptPreferencesObj.uiSettings.compactIconSpacing !== 'number') {
		scriptPreferencesObj.uiSettings.compactIconSpacing = defaultScriptPreferencesObj.uiSettings.compactIconSpacing;
	}

	// Define as preferências de seleção (nullType, adjType, projectMode)
	for (var s in defaultScriptPreferencesObj.selection) {
		if (!scriptPreferencesObj.selection.hasOwnProperty(s))
			scriptPreferencesObj.selection[s] = defaultScriptPreferencesObj.selection[s];
	}

	// Define variáveis globais com base nas preferências carregadas
	projectMode = scriptPreferencesObj.selection.projectMode;
	projPath = scriptPreferencesObj.folders.projPath;
	nullType = scriptPreferencesObj.selection.nullType;
	adjType = scriptPreferencesObj.selection.adjType;

	ignoreMissing = scriptPreferencesObj.ignoreMissing; // Ignora footage ausente
	homeOffice = scriptPreferencesObj.homeOffice; // Modo home office
	devMode = scriptPreferencesObj.devMode; // Modo de desenvolvedor
}

// Chama a função para carregar as preferências ao iniciar o script
// loadScriptPreferences();

function applyThemeColorOverrides(overrides) {
	if (!overrides) { return; }
	function useOverride(key, fallback) {
		var value = overrides.hasOwnProperty(key) ? overrides[key] : fallback;
		return (typeof value === 'string' && value.length >= 4) ? value : fallback;
	}
	bgColor1 = useOverride('bgColor1', bgColor1);
	bgColor2 = useOverride('bgColor2', bgColor2);
	divColor1 = useOverride('divColor1', divColor1);
	monoColor0 = useOverride('monoColor0', monoColor0);
	monoColor1 = useOverride('monoColor1', monoColor1);
	monoColor2 = useOverride('monoColor2', monoColor2);
	monoColor3 = useOverride('monoColor3', monoColor3);
	normalColor1 = useOverride('normalColor1', normalColor1);
	normalColor2 = useOverride('normalColor2', normalColor2);
	highlightColor1 = useOverride('highlightColor1', highlightColor1);
}

// Objeto que armazena as propriedades padrão dos templates do Padeiro
var defaultTemplateConfigObj = {
	configName: 'NOME DA CONFIGURAÇÃO',
	exemple: 'INFORMAÇÃO 1\nINFORMAÇÃO 2',
	tip: 'coloque aqui as instruções de preenchimento deste template.\nex:\
\ndigite o texto em 1 ou 2 linhas.\
\nuse a quebra de linha para separar INFORMAÇÃO 1 e INFORMAÇÃO 2.\
\nuse 1 linha vazia para criar mais de 1 versão do mesmo template.',

	compName: 'COMP TEMPLATE',
	prefix: 'TARJA',
	refTime: 2,
	separator: '\n',
	textCase: 'upperCase',
	inputLayers: [],

	importPath: '~/Downloads',
	outputPath: ['~/Desktop']
};

// Define um objeto com as cores e nomes dos rótulos do After Effects (codificados).
var labelsObj = {
	l1: {
		color: 'ÿñ=;', // FF F44336 (Vermelho)
		name: 'red'
	},
	l2: {
		color: 'ÿç\u0013c', // FF E81D62 (Rosa)
		name: 'pink'
	},
	l3: {
		color: 'ÿš(®', // FF 9B26AF (Roxo)
		name: 'purple'
	},
	l4: {
		color: 'ÿd<³', // FF 6639B6 (Roxo Escuro)
		name: 'deep purple'
	},
	l5: {
		color: 'ÿ?Q³', // FF 3E50B4 (Indigo)
		name: 'indigo'
	},
	l6: {
		color: 'ÿ)–ï', // FF 02A8F3 (Azul)
		name: 'blue'
	},
	l7: {
		color: 'ÿ\u001b©ñ', // FF 00BBD3 (Azul Claro)
		name: 'light blue'
	},
	l8: {
		color: 'ÿ\u001e¼Ó', // FF 009587 (Ciano)
		name: 'cyan'
	},
	l9: {
		color: 'ÿ\u0016–ˆ', // FF 8AC249 (Verde Azulado)
		name: 'teal'
	},
	l10: {
		color: 'ÿO¯T', // FF CCDB38 (Verde)
		name: 'green'
	},
	l11: {
		color: 'ÿŒÃQ', // FF FEEA3A (Verde Claro)
		name: 'light green'
	},
	l12: {
		color: 'ÿÌÚG', // FF FE9700 (Lima)
		name: 'lime'
	},
	l13: {
		color: 'ÿýéL', // FF FF5722 (Amarelo)
		name: 'yellow'
	},
	l14: {
		color: 'ÿû¿+', // FF 785447 (Âmbar)
		name: 'amber'
	},
	l15: {
		color: 'ÿý–#', // FF 9D9D9D (Laranja)
		name: 'orange'
	},
	l16: {
		color: 'ÿûS-', // FF 5F7C8A (Laranja Escuro)
		name: 'deep orange'
	}
};

$.writeln("=== GLOBALS.JS CARREGADO ===");
$.writeln("normalColor1: " + (typeof normalColor1) + " = " + normalColor1);
$.writeln("bgColor1: " + (typeof bgColor1) + " = " + bgColor1);
$.writeln("setFgColor: " + (typeof setFgColor));
$.writeln("setBgColor: " + (typeof setBgColor));
