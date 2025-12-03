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

// Agendador seguro (para hosts sem scheduleTask)
(function () {
    function D9T_safeSchedule(code, delay, repeat) {
        try {
            if (typeof app !== "undefined" && app && typeof app.scheduleTask === "function") {
                return app.scheduleTask(code, delay || 10, repeat === true);
            }
        } catch (schedErr) {}
        try { $.eval(code); } catch (evalErr) {}
        return null;
    }
    $.global.D9T_safeSchedule = D9T_safeSchedule;
    try {
        if (typeof app !== "undefined" && app && typeof app.scheduleTask !== "function") {
            app.scheduleTask = D9T_safeSchedule;
        }
    } catch (patchErr) {}
})();

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

// Pasta de runtime (manifestos, prefs e caches leves)
var runtimePath = scriptPreferencesPath + '/runtime';
var runtimeFolder = new Folder(runtimePath);
if (!runtimeFolder.exists) runtimeFolder.create();

var runtimePrefsPath = runtimePath + '/prefs';
var runtimePrefsFolder = new Folder(runtimePrefsPath);
if (!runtimePrefsFolder.exists) runtimePrefsFolder.create();

var runtimeConfigPath = runtimePath + '/config';
var runtimeConfigFolder = new Folder(runtimeConfigPath);
if (!runtimeConfigFolder.exists) runtimeConfigFolder.create();

var runtimeIconsPath = runtimePath + '/icons';
var runtimeIconsFolder = new Folder(runtimeIconsPath);
if (!runtimeIconsFolder.exists) runtimeIconsFolder.create();

var runtimeCachePath = runtimePath + '/cache';
var runtimeCacheFolder = new Folder(runtimeCachePath);
if (!runtimeCacheFolder.exists) runtimeCacheFolder.create();

// Caminho do arquivo principal de prefer ncias
var userPrefsFilePath = runtimePrefsFolder.fsName + '/User_Preferences.json';

// Manifesto leve de runtime
var runtimeManifestPath = runtimePath + '/manifest.json';

// Configura  es auxiliares e caches globais
var runtimeLogsPath = runtimePath + '/logs';
var runtimeLogsFolder = new Folder(runtimeLogsPath);
if (!runtimeLogsFolder.exists) runtimeLogsFolder.create();

var runtimeTempPath = runtimePath + '/temp';
var runtimeTempFolder = new Folder(runtimeTempPath);
if (!runtimeTempFolder.exists) runtimeTempFolder.create();

var runtimeConfigMainPath = runtimeConfigPath + '/config.json';
var runtimeDadosConfigPath = runtimeConfigPath + '/Dados_Config.json';

// Wrappers p/ API pública de preferências
function D9T_loadUserPrefs() {
    try { return (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences.getAll() : null; } catch (e) { return null; }
}
function D9T_saveUserPrefs(obj) {
    try { if (typeof D9T_Preferences !== 'undefined' && obj) { D9T_Preferences.setAll(obj); return true; } } catch (e) {}
    return false;
}
function D9T_getModulePrefs(key, defVal) {
    try {
        if (typeof D9T_Preferences !== 'undefined') {
            var v = D9T_Preferences.getModulePrefs(key);
            return (v === undefined || v === null) ? defVal : v;
        }
    } catch (e) {}
    return defVal;
}
function D9T_setModulePrefs(key, val, persist) {
    try {
        if (typeof D9T_Preferences !== 'undefined') {
            D9T_Preferences.setModulePrefs(key, val, !!persist);
            return true;
        }
    } catch (e) {}
    return false;
}

var tempPath = scriptPreferencesPath + '/temp';
var tempFolder = new Folder(tempPath);
if (!tempFolder.exists) tempFolder.create();

var scriptLogsPath = runtimeLogsPath;
var scriptLogsFolder = new Folder(runtimeLogsPath);
if (!scriptLogsFolder.exists) scriptLogsFolder.create();

// Evita ReferenceError caso os ícones base (ICON lib) ainda não tenham sido carregados
if (typeof localPc === 'undefined') {
	localPc = (typeof LOGO_IMG !== 'undefined') ? LOGO_IMG : "";
}

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
var lol = '🤯  ';
var relax = '😌  ';

var lClick = '👈 ';
var rClick = '👉 ';
var dClick = '🖱️🖱️ ';



var globalSeparator = ' - ';

// 'uiObj' armazena os controles da interface, grupos seus respectivos arrays
var D9T_ui = {
	iconButtonArray: [],
	imageButtonArray: [],
	sectionGrpArray: [],
	divArray: []
};

// Manifesto de runtime: armazena um snapshot leve das prefer ncias para o bin rio ler
// mesmo quando outros arquivos estiverem empacotados.
function D9T_UPDATE_RUNTIME_MANIFEST(snapshot) {
	try {
		if (!runtimeFolder || !runtimeFolder.exists) {
			runtimeFolder = new Folder(runtimePath);
			if (!runtimeFolder.exists) runtimeFolder.create();
		}

		var manifestFile = new File(runtimeManifestPath);
		var payload = snapshot || {};

		// Informa  es sobre o arquivo de prefer ncias principal
		var prefsFile = new File(userPrefsFilePath);
		if (prefsFile.exists) {
			payload.userPrefs = {
				path: prefsFile.fsName,
				size: prefsFile.length,
				modified: prefsFile.modified
			};
		} else {
			payload.userPrefs = { path: prefsFile.fsName, missing: true };
		}

		// Snapshot r pido das configura  es atuais carregadas em mem ria
		if (typeof scriptPreferencesObj !== 'undefined' && scriptPreferencesObj) {
			payload.uiSettings = scriptPreferencesObj.uiSettings || {};
			payload.color = scriptPreferencesObj.color || {};
		}

		manifestFile.encoding = "UTF-8";
		manifestFile.open('w');
		manifestFile.write(JSON.stringify(payload, null, 2));
		manifestFile.close();
	} catch (manifestErr) {
		// Falha silenciosa para n o quebrar o bin rio; logamos se o logger existir
		try { if (typeof D9T_logError === 'function') D9T_logError('runtime manifest fail: ' + manifestErr); } catch (e) {}
	}
}
$.global.D9T_UPDATE_RUNTIME_MANIFEST = D9T_UPDATE_RUNTIME_MANIFEST;

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
		compactIconSpacing: 12,
		buttonThemes: [
			{
				id: "classic",
				name: "Clássico",
				width: 130,
				height: 40,
				cornerRadius: 8,
				background: "#2E343B",
				hoverBackground: "#4E5560",
				textColor: "#FFFFFF",
				hoverTextColor: "#FFFFFF",
				labelOffset: 0,
				labelOffsetX: 0,
				labelFontSize: 10,
				textTransform: "uppercase"
			},
			{
				id: "destacado",
				name: "Destacado",
				width: 132,
				height: 38,
				cornerRadius: 20,
				background: "#FF5722",
				hoverBackground: "#FF7043",
				textColor: "#FFFFFF",
				hoverTextColor: "#FFFFFF",
				labelOffset: 0,
				labelOffsetX: 0,
				labelFontSize: 15,
				textTransform: "none"
			},
			{
				id: "minimal",
				name: "Minimal",
				width: 110,
				height: 32,
				cornerRadius: 8,
				background: "#F2F2F2",
				hoverBackground: "#E0E0E0",
				textColor: "#1F1F1F",
				hoverTextColor: "#1F1F1F",
				labelOffset: 0,
				labelOffsetX: 0,
				labelFontSize: 13,
				textTransform: "none"
			}
		],
		activeButtonTheme: "classic"
	},
	moduleSettings: {
		hiddenKeys: []
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

function clonePreferenceValue(value) {
	if (value === null || typeof value !== 'object') { return value; }
	if (value instanceof Array) {
		var arrCopy = [];
		for (var i = 0; i < value.length; i++) {
			arrCopy[i] = clonePreferenceValue(value[i]);
		}
		return arrCopy;
	}
	var clone = {};
	for (var key in value) {
		if (value.hasOwnProperty(key)) {
			clone[key] = clonePreferenceValue(value[key]);
		}
	}
	return clone;
}

function deepMergePreferences(target, source) {
	if (!source || typeof source !== 'object') { return target; }
	for (var key in source) {
		if (!source.hasOwnProperty(key)) { continue; }
		var srcVal = source[key];
		var isObject = srcVal && typeof srcVal === 'object';
		var isArray = srcVal instanceof Array;
		if (isObject && !isArray) {
			if (!target[key] || typeof target[key] !== 'object' || (target[key] instanceof Array)) {
				target[key] = {};
			}
			deepMergePreferences(target[key], srcVal);
		} else if (isArray) {
			target[key] = srcVal.slice(0);
		} else {
			target[key] = srcVal;
		}
	}
	return target;
}

function logPreferenceIssue(message, error) {
	var prefix = '[GND9 Prefs] ';
	if (error && error.message) {
		$.writeln(prefix + message + ' :: ' + error.message);
	} else if (error) {
		$.writeln(prefix + message + ' :: ' + error);
	} else {
		$.writeln(prefix + message);
	}
}

// Carrega as preferências do usuário a partir do arquivo 'User_Preferences.json' ou usa os valores padrão.
function loadScriptPreferences() {
	// Novo caminho (runtime/prefs); fallback para legado no diretório raiz
	var tempFile = new File(userPrefsFilePath);
	if (!tempFile.exists) {
		var legacy = new File((new Folder(scriptPreferencesPath)).fsName + '/User_Preferences.json');
		if (legacy.exists) { tempFile = legacy; }
	}
	var loadedPrefs = {};

	if (tempFile.exists) {
		var tempFileContent = '';
		try {
			tempFileContent = readFileContent(tempFile) || '';
		} catch (readErr) {
			logPreferenceIssue('Falha ao ler User_Preferences.json', readErr);
		}

		if (tempFileContent && tempFileContent.length) {
			try {
				loadedPrefs = JSON.parse(tempFileContent);
			} catch (parseErr) {
				logPreferenceIssue('JSON inválido em User_Preferences.json', parseErr);
				loadedPrefs = {};
			}
		}
	} else {
		logPreferenceIssue('User_Preferences.json não encontrado, aplicando valores padrão.');
	}

	scriptPreferencesObj = clonePreferenceValue(defaultScriptPreferencesObj);
	deepMergePreferences(scriptPreferencesObj, loadedPrefs);

	if (!scriptPreferencesObj.themeColors || typeof scriptPreferencesObj.themeColors !== 'object') {
		scriptPreferencesObj.themeColors = clonePreferenceValue(defaultScriptPreferencesObj.themeColors);
	}
	applyThemeColorOverrides(scriptPreferencesObj.themeColors);
	iconTheme = scriptPreferencesObj.iconTheme || defaultScriptPreferencesObj.iconTheme;

	if (!scriptPreferencesObj.uiSettings) {
		scriptPreferencesObj.uiSettings = clonePreferenceValue(defaultScriptPreferencesObj.uiSettings);
	}
	if (typeof scriptPreferencesObj.uiSettings.labelSpacing !== 'number') {
		scriptPreferencesObj.uiSettings.labelSpacing = defaultScriptPreferencesObj.uiSettings.labelSpacing;
	}
	if (!(scriptPreferencesObj.uiSettings.compactIconSize instanceof Array)) {
		scriptPreferencesObj.uiSettings.compactIconSize = defaultScriptPreferencesObj.uiSettings.compactIconSize.slice(0);
	}
	if (typeof scriptPreferencesObj.uiSettings.compactIconSpacing !== 'number') {
		scriptPreferencesObj.uiSettings.compactIconSpacing = defaultScriptPreferencesObj.uiSettings.compactIconSpacing;
	}
	// Garantia de integridade dos temas de botões
	if (!(scriptPreferencesObj.uiSettings.buttonThemes instanceof Array) || !scriptPreferencesObj.uiSettings.buttonThemes.length) {
		scriptPreferencesObj.uiSettings.buttonThemes = JSON.parse(JSON.stringify(defaultScriptPreferencesObj.uiSettings.buttonThemes));
	}
	if (!scriptPreferencesObj.uiSettings.activeButtonTheme) {
		scriptPreferencesObj.uiSettings.activeButtonTheme = defaultScriptPreferencesObj.uiSettings.activeButtonTheme;
	}
	if (!(scriptPreferencesObj.uiSettings.buttonThemes instanceof Array) || !scriptPreferencesObj.uiSettings.buttonThemes.length) {
		scriptPreferencesObj.uiSettings.buttonThemes = JSON.parse(JSON.stringify(defaultScriptPreferencesObj.uiSettings.buttonThemes));
	}
	if (!scriptPreferencesObj.uiSettings.activeButtonTheme) {
		scriptPreferencesObj.uiSettings.activeButtonTheme = defaultScriptPreferencesObj.uiSettings.activeButtonTheme;
	}
	if (!scriptPreferencesObj.moduleSettings || typeof scriptPreferencesObj.moduleSettings !== 'object') {
		scriptPreferencesObj.moduleSettings = { hiddenKeys: [] };
	} else if (!(scriptPreferencesObj.moduleSettings.hiddenKeys instanceof Array)) {
		scriptPreferencesObj.moduleSettings.hiddenKeys = [];
	}
	// Trace de estado carregado
	try {
		var uiSt = scriptPreferencesObj.uiSettings || {};
		var cThemes = (uiSt.buttonThemes && uiSt.buttonThemes.length) ? uiSt.buttonThemes.length : 0;
		var activeId = uiSt.activeButtonTheme || "none";
		if (typeof D9T_PREF_LOG === "function") {
			D9T_PREF_LOG("loadScriptPreferences done | themes=" + cThemes + " | active=" + activeId + " | file=" + tempFile.fsName);
		}
	} catch (traceErr) {}

	for (var s in defaultScriptPreferencesObj.selection) {
		if (defaultScriptPreferencesObj.selection.hasOwnProperty(s) && !scriptPreferencesObj.selection.hasOwnProperty(s)) {
			scriptPreferencesObj.selection[s] = defaultScriptPreferencesObj.selection[s];
		}
	}

	projectMode = scriptPreferencesObj.selection.projectMode;
	projPath = scriptPreferencesObj.folders.projPath;
	nullType = scriptPreferencesObj.selection.nullType;
	adjType = scriptPreferencesObj.selection.adjType;

	ignoreMissing = scriptPreferencesObj.ignoreMissing;
	homeOffice = scriptPreferencesObj.homeOffice;
	devMode = scriptPreferencesObj.devMode;

	// Atualiza manifesto de runtime com snapshot carregado
	try {
		if (typeof D9T_UPDATE_RUNTIME_MANIFEST === "function") {
			D9T_UPDATE_RUNTIME_MANIFEST({
				loadedAt: new Date(),
				source: tempFile.fsName,
				uiSettings: scriptPreferencesObj.uiSettings || {},
				color: scriptPreferencesObj.color || {}
			});
		}
	} catch (manifestLoadErr) {
		try { $.writeln("[D9T_PREFS_TRACE] runtime manifest load update fail :: " + manifestLoadErr); } catch (loadLogErr) {}
	}

	return scriptPreferencesObj;
}

function D9T_sanitizeLogName(name) {
	var base = (name && name.length) ? ('' + name) : 'gnd9tools';
	base = base.toLowerCase().replace(/[^a-z0-9_\-]+/g, '_');
	if (!base || !base.length) { base = 'gnd9tools'; }
	return base;
}

function D9T_appendLogEntry(moduleName, level, message) {
	var logFile = null;
	try {
		var logBase = (runtimeLogsPath && runtimeLogsPath.length) ? runtimeLogsPath : scriptLogsPath;
		if (!logBase) { return; }
		var safeName = D9T_sanitizeLogName(moduleName);
		logFile = new File(logBase + '/' + safeName + '.log');
		var stamp = new Date().toUTCString();
		var line = '[' + stamp + '][' + (level || 'INFO') + '] ' + (message || '');
		if (logFile.open('a')) {
			logFile.encoding = 'UTF-8';
			logFile.write(line + '\n');
			logFile.close();
		}
	} catch (logErr) {
		try { logFile.close(); } catch (closeErr) {}
	}
}

function D9T_logInfo(moduleName, message) { D9T_appendLogEntry(moduleName, 'INFO', message); }
function D9T_logWarn(moduleName, message) { D9T_appendLogEntry(moduleName, 'WARN', message); }
function D9T_logError(moduleName, message) { D9T_appendLogEntry(moduleName, 'ERROR', message); }
if (!$.global.D9T_Logger) {
	$.global.D9T_Logger = {
		info: D9T_logInfo,
		warn: D9T_logWarn,
		error: D9T_logError,
		write: D9T_appendLogEntry
	};
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
	l1:  { color: '#F44336FF', name: 'red' },
	l2:  { color: '#E81D62FF', name: 'pink' },
	l3:  { color: '#9B26AFFF', name: 'purple' },
	l4:  { color: '#6639B6FF', name: 'deep purple' },
	l5:  { color: '#3E50B4FF', name: 'indigo' },
	l6:  { color: '#02A8F3FF', name: 'blue' },
	l7:  { color: '#00BBD3FF', name: 'light blue' },
	l8:  { color: '#009587FF', name: 'cyan' },
	l9:  { color: '#8AC249FF', name: 'teal' },
	l10: { color: '#CCDB38FF', name: 'green' },
	l11: { color: '#FEEA3AFF', name: 'light green' },
	l12: { color: '#FE9700FF', name: 'lime' },
	l13: { color: '#FF5722FF', name: 'yellow' },
	l14: { color: '#785447FF', name: 'amber' },
	l15: { color: '#9D9D9DFF', name: 'orange' },
	l16: { color: '#5F7C8AFF', name: 'deep orange' }
};
