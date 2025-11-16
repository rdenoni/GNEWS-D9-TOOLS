/**********************************************************************************
 *
 * GNEWS LayerOrder v4.5.1 - ORGANIZADOR AUTOMÁTICO DE CAMADAS
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 4.5.1
 *
 * DESCRIÇÃO:
 * Este script fornece uma interface para automatizar a organização de camadas
 * na composição ativa do After Effects. Permite renomear, colorir, reordenar
 * e limpar camadas com base em regras pré-definidas.
 *
 * MODULOS USADOS:
 * - source/globals.js (para variáveis de tema e cores globais)
 * - source/libraries/HELP lib.js (para a janela de ajuda 'showLayerOrderHelp')
 * - source/libraries/JSON lib.js (para a função JSON.parse() ao carregar configs)
 * - source/layout/main_ui_functions.js (para os componentes 'themeIconButton' e 'themeButton')
 *
 * ATUALIZAÇÕES (v4.5.1):
 * - CORREÇÃO DA COR DO BOTÃO: Corrigida a chamada da função 'createActionButton'.
 * O botão "ORGANIZAR" agora usa as cores padrão (base branca), em vez das
 * cores personalizadas (base vermelha), espelhando o botão "CONVERTER" do
 * GNEWS_TextBox.jsx.
 *
 * ATUALIZAÇÕES (v4.5.0):
 * - PADRONIZAÇÃO DE BOTÃO: Substituído o botão 'ORGANIZAR' para usar a função
 * 'createActionButton' do GNEWS_TextBox.
 * - AJUSTES DE JANELA: A largura da janela foi aumentada para 300px e o
 * redimensionamento pelo usuário foi bloqueado (resizeable: false).
 * - ARQUITETURA (v4.3): A função de ajuda foi movida para 'HELP lib.js'.
 *
 **********************************************************************************/

// Garante que o script seja lido com a codificação correta para acentos.
$.encoding = "UTF-8";

function launchLayerOrderUI(thisObj) {
	// =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// =================================================================================
	var SCRIPT_NAME = "GNEWS LayerOrder"; // Nome do script
	var SCRIPT_VERSION = "4.5.1";
	var JANELA_TITULO = SCRIPT_NAME + " v" + SCRIPT_VERSION; // Título principal da janela
	var SCRIPT_SUBTITLE = "Organizador de Camadas"; // Subtítulo exibido na UI
	var DEBUG_MODE = true; // Ativa logs no console para depuração.

	// --- Configurações de Tamanho ---
	var LARGURA_JANELA_PADRAO = 300; // Largura da janela aumentada
	var LARGURA_BOTAO_ORGANIZAR = 260; // Largura ajustada para a nova janela
	var ALTURA_BOTAO_ORGANIZAR = 40;
	var LARGURA_BOTAO_AJUDA = 25; // Tamanho do botão de ajuda

	// As variáveis de CORES (bgColor1, normalColor1, etc.) são carregadas
	// globalmente pelo script principal 'GND9TOOLS.jsx'.

	// =================================================================================
	// --- FUNÇÕES AUXILIARES DE TEMA E ARQUIVOS ---
	// =================================================================================

	// Converte um código hexadecimal de cor em um array RGB normalizado (0-1).
	function hexToRgb(hex) {
		if (typeof hex !== 'string') return [0.1, 0.1, 0.1];
		hex = hex.replace("#", "");
		var r = parseInt(hex.substring(0, 2), 16) / 255;
		var g = parseInt(hex.substring(2, 4), 16) / 255;
		var b = parseInt(hex.substring(4, 6), 16) / 255;
		return [r, g, b];
	}

	// Define a cor de fundo de um elemento da UI.
	function setBgColor(element, hexColor) {
		try {
			if (typeof hexColor !== 'undefined') {
				element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, hexToRgb(hexColor));
			}
		} catch (e) {} // Falha silenciosamente se o elemento não suportar.
	}

	// Define a cor de primeiro plano (texto/borda) de um elemento da UI.
	function setFgColor(element, hexColor) {
		try {
			if (typeof hexColor !== 'undefined') {
				element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, hexToRgb(hexColor), 1);
			}
		} catch (e) {} // Falha silenciosamente.
	}

	// Exibe um alerta padronizado com o tema do script.
	function themedAlert(title, message) {
		var d = new Window("dialog", title);
		d.orientation = "column";
		d.alignChildren = ["center", "center"];
		d.spacing = 10;
		d.margins = 15;
		setBgColor(d, typeof bgColor1 != 'undefined' ? bgColor1 : '#282828');
		var m = d.add('group');
		m.orientation = 'column';
		var l = message.split('\n');
		for (var i = 0; i < l.length; i++) {
			var t = m.add('statictext', undefined, l[i]);
			setFgColor(t, typeof normalColor1 != 'undefined' ? normalColor1 : '#FFFFFF');
		}
		var b = d.add("button", undefined, "OK", { name: 'ok' });
		b.size = [100, 25];
		d.center();
		d.show();
	}

	// Função para registrar mensagens de depuração no console.
	function debugLog(message) {
		if (DEBUG_MODE) {
			$.writeln("[DEBUG LayerOrder] " + message);
		}
	}

	// Carrega a configuração (prefixos, cores, idioma) a partir de um arquivo JSON.
	function loadConfig() {
		var configFile = new File(Folder.userData.fsName + "/organizer_config.json");
		
		var defaultConfig = {
			language: "PT",
			prefixes: { ShapeLayer: "Shp_", TextLayer: "Txt_", SolidLayer: "Sld_", AdjustmentLayer: "Ajust_", CompItem: "Comp_", CameraLayer: "Cam_", NullLayer: "Null_", VideoLayer: "Vid_", ImageLayer: "Img_" },
			layerColorIndices: { ShapeLayer: 8, TextLayer: 1, SolidLayer: 14, AdjustmentLayer: 2, CompItem: 12, CameraLayer: 2, NullLayer: 2, VideoLayer: 14, ImageLayer: 11 }
		};

		if (configFile.exists) {
			try {
				configFile.open("r");
				var config = JSON.parse(configFile.read());
				configFile.close();
				return config;
			} catch (e) {
				debugLog("Erro ao ler organizer_config.json: " + e.toString());
				return defaultConfig;
			}
		} else {
			debugLog("Arquivo organizer_config.json não encontrado. Usando configurações padrão.");
			return defaultConfig;
		}
	}

	// Carrega a configuração no início do script.
	var config = loadConfig();

	// Mapeia os tipos de status para as cores globais.
	var STATUS_COLORS = {
		success: (typeof successColor !== 'undefined') ? successColor : '#8AC249',
		error: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003c',
		warning: (typeof warningColor !== 'undefined') ? warningColor : '#FE9700',
		info: (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF',
		neutral: (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA'
	};

	// Define a cor do texto de um elemento da UI (usado para o status).
	function setStatusColor(element, hexColor) {
		try {
			if (element && element.graphics && typeof hexToRgb === 'function') {
				element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, hexToRgb(hexColor), 1);
			}
		} catch (e) {
			debugLog("Erro ao definir cor do status: " + e.toString());
		}
	}

	// Busca textos na biblioteca de strings interna com base no idioma carregado.
	function getLocalizedString(key) {
		var strings = {
			PT: {
				windowTitle: "Auto Layer Organizer v" + SCRIPT_VERSION,
				automateBtn: "\u2728 ORGANIZAR",
				organizeBtnTip: "Executa as ações de organização selecionadas na composição ativa.",
				helpBtnTip: "Ajuda sobre o Auto Layer Organizer",
				helpBtnShortTip: "Ajuda",
				optionsPanel: "Opções",
				applyColorsCheck: "Aplicar cores",
				applyColorsTip: "Aplica um esquema de cores pré-definido às camadas com base no seu tipo.",
				renameLayersCheck: "Renomear camadas",
				renameLayersTip: "Renomeia as camadas adicionando um prefixo padrão (ex: Shp_, Txt_).",
				reorderLayersCheck: "Reordenar por tipo",
				reorderLayersTip: "Agrupa as camadas por tipo, mantendo a ordem temporal original dentro de cada grupo.",
				reorderByTimeCheck: "Reordenar por tempo",
				reorderByTimeTip: "Organiza as camadas de modo que as que começam mais tarde na timeline fiquem no topo.",
				deleteHiddenCheck: "Deletar ocultas",
				deleteHiddenTip: "Remove permanentemente todas as camadas com a visibilidade desativada (olho desligado).",
				statusReady: "Pronto para uso...",
				statusStarting: "Iniciando...",
				statusNoComp: "ERRO: Nenhuma comp selecionada!",
				statusCompFound: "Comp encontrada: ",
				statusSearchingHidden: "Buscando ocultas...",
				statusDeletingHidden: "Excluindo camadas ocultas...",
				statusNoHiddenToDelete: "Nenhuma oculta para deletar.",
				statusCheckingExpressions: "Verificando expressões...",
				statusReordering: "Reordenando...",
				statusCompleted: "Concluído!\nTotal: {0} | Visíveis: {1}\nShapes: {2} | Textos: {3} | Sólidos: {4}\nAjustes: {5} | Comps: {6} | Câmeras: {7}",
				statusActions: "\nAções: ",
				statusRenamed: "Renomeadas: {0}",
				statusColored: "Coloridas: {0}",
				statusDeleted: "Deletadas: {0}",
				statusReorderedAction: "Reordenadas: {0}",
				statusIndexCancelled: "Reordenação parcial (índice)",
				statusError: "ERRO: ",
				statusNoActions: "Nenhuma ação selecionada!",
				reasonIndex: "Expressão com referência a índice",
				reasonLinked: "Vínculo com outra camada (parent, track matte ou máscara)",
				reasonLocked: "Camada bloqueada"
			},
			EN: { /* ... Versões em inglês (omitidas por brevidade) ... */ }
		};
		var lang = config.language || "PT";
		return strings[lang][key] || key;
	}


	// =================================================================================
	// --- LÓGICA PRINCIPAL DO SCRIPT ---
	// =================================================================================

	// Escapa caracteres especiais para uso em Expressões Regulares (RegEx).
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// Retorna recursivamente todas as propriedades de um objeto (camada, efeito, etc.).
	function getAllProperties(obj, props) {
		props = props || [];
		if (obj.numProperties > 0) {
			for (var i = 1; i <= obj.numProperties; i++) {
				try {
					var prop = obj.property(i);
					props.push(prop);
					if (prop.numProperties > 0) {
						getAllProperties(prop, props);
					}
				} catch (e) {
					debugLog("Erro ao acessar propriedade " + i + ": " + e.toString());
				}
			}
		}
		return props;
	}

	// Verifica se uma expressão faz referência a uma camada específica por nome ou índice.
	function expressionReferencesLayer(expression, layer) {
		try {
			if (!expression || expression === "") return false;
			var layerNamePattern = new RegExp('(thisComp\\.layer\\("?' + escapeRegExp(layer.name) + '"?\\)|comp\\(\\s*"?' + escapeRegExp(layer.name) + '"?\\s*\\))', 'i');
			var layerIndexPattern = new RegExp('(thisComp\\.layer\\(' + layer.index + '\\)|comp\\(\\s*' + layer.index + '\\s*\\))', 'i');
			return layerNamePattern.test(expression) || layerIndexPattern.test(expression);
		} catch (e) {
			return false;
		}
	}

	// Verifica se uma camada possui qualquer expressão que dependa de índice de camada (ex: layer(1)).
	function hasIndexDependentExpressions(layer) {
		var props = getAllProperties(layer);
		for (var i = 0; i < props.length; i++) {
			var prop = props[i];
			if (prop.canSetExpression && prop.expression !== "" && /(thisComp\s*\.\s*layer\s*\(\s*\d+\s*\)|comp\s*\(\s*\d+\s*\))/i.test(prop.expression)) {
				return true;
			}
		}
		return false;
	}

	// Helper para encontrar o índice de um valor em um array.
	function findIndex(array, value) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] === value) return i;
		}
		return -1;
	}

	// Define a cor do rótulo de uma camada.
	function setLayerColor(layer, colorIndex) {
		try {
			layer.label = colorIndex;
			return true;
		} catch (e) {
			return false;
		}
	}

	// Variável de referência para o texto de status, definida na construção da UI.
	var statusText = null;

	// Atualiza a mensagem e a cor do texto de status na UI.
	function updateStatus(messageOrKey, type, params) {
		if (!statusText) return;
		var text = getLocalizedString(messageOrKey);
		if (params) {
			for (var i = 0; i < params.length; i++) {
				text = text.replace("{" + i + "}", params[i]);
			}
		}
		var color = STATUS_COLORS[type] || STATUS_COLORS.neutral;
		statusText.text = text;
		setStatusColor(statusText, color);
		if (type === "success") {
			app.setTimeout(function () {
				if (statusText && statusText.text === text) {
					statusText.text = getLocalizedString("statusReady");
					setStatusColor(statusText, STATUS_COLORS.neutral);
				}
			}, 5000);
		}
	}

	// Verifica se uma camada está vinculada (parentesco, track matte, máscaras, ou referenciada em expressões).
	function isLayerLinked(comp, layer) {
		for (var i = 1; i <= comp.numLayers; i++) {
			var otherLayer = comp.layer(i);
			if (otherLayer !== layer && otherLayer.parent === layer) {
				return true;
			}
		}
		if (layer.property("ADBE Mask Parade") && layer.property("ADBE Mask Parade").numProperties > 0) {
			return true;
		}
		for (var j = 1; j <= comp.numLayers; j++) {
			var otherLayerWithExpr = comp.layer(j);
			var props = getAllProperties(otherLayerWithExpr);
			for (var k = 0; k < props.length; k++) {
				var prop = props[k];
				if (prop.canSetExpression && prop.expression !== "" && expressionReferencesLayer(prop.expression, layer)) {
					return true;
				}
			}
		}
		return false;
	}

	// Funções robustas para identificar tipos de camada.
	function isTextLayer(layer) { try { return layer.property("ADBE Text Properties") !== null; } catch (e) { return false; } }
	function isShapeLayer(layer) { try { return layer.property("ADBE Root Vectors Group") !== null; } catch (e) { return false; } }
	function isSolidLayer(layer) {
		try {
			if(layer.matchName === "ADBE Solid Source") return true;
			if (layer.source && layer.source.typeName == "Solid" && !layer.adjustmentLayer) return true;
			if (layer.source && layer.source.mainSource && layer.source.mainSource.color && !layer.adjustmentLayer) return true;
			return false;
		} catch (e) {
			return false;
		}
	}

	// Limpa o nome da camada, removendo prefixos antigos e duplicados antes de adicionar o novo.
	function cleanLayerName(name, prefix) {
		if (!name) return "";
		var allPrefixes = [];
		for (var key in config.prefixes) {
			allPrefixes.push(config.prefixes[key]);
		}
		var cleanName = name;
		for (var i = 0; i < allPrefixes.length; i++) {
			var prefixPattern = new RegExp("^(" + escapeRegExp(allPrefixes[i]) + ")+", "gi");
			cleanName = cleanName.replace(prefixPattern, "");
		}
		cleanName = cleanName.replace(/^_+/, "").replace(/__+/g, "_").trim();
		if (cleanName === "" || cleanName === "_") {
			cleanName = "Layer";
		}
		return prefix + cleanName;
	}

	// =================================================================================
	// --- OBJETO PRINCIPAL E CONSTRUTOR DE UI ---
	// =================================================================================
	
	var LayersOrganizer = {
		ui: {}, // Armazena referências aos elementos da UI.
		layerTypeOrder: ["AdjustmentLayer", "CameraLayer", "NullLayer", "TextLayer", "ShapeLayer",
						 "SolidLayer", "ImageLayer", "CompItem", "VideoLayer"],
		isProcessing: false,

		// Função principal que executa todas as ações selecionadas.
		executeOrganize: function() {
			var self = this;
			if (self.isProcessing) return;

			if (!self.ui.applyColorsCheck.value && !self.ui.renameLayersCheck.value && !self.ui.reorderLayersCheck.value &&
				!self.ui.reorderByTimeCheck.value && !self.ui.deleteHiddenCheck.value) {
				updateStatus("statusNoActions", "warning");
				return;
			}

			self.isProcessing = true;
			updateStatus("statusStarting", "info");
			if (self.ui.organizeBtn.leftClick) self.ui.organizeBtn.leftClick.enabled = false;
			else self.ui.organizeBtn.enabled = false;
			if (self.ui.helpBtn.leftClick) self.ui.helpBtn.leftClick.enabled = false;
			else self.ui.helpBtn.enabled = false;

			app.beginUndoGroup("Auto Layer Organize");

			try {
				var comp = app.project.activeItem;
				if (!comp || !(comp instanceof CompItem)) {
					updateStatus("statusNoComp", "error");
					return;
				}

				updateStatus("statusCompFound", "info", [comp.name]);

				// Se houver camadas selecionadas, o script atuará apenas nelas.
				// Se não houver camadas selecionadas, o script atuará em TODAS as camadas da COMPOSIÇÃO ATIVA.
				var selectedLayers = comp.selectedLayers;
				var processOnlySelected = selectedLayers && selectedLayers.length > 0;

				var stats = { renamed: 0, colored: 0, deleted: 0, reordered: 0, shapes: 0, texts: 0, solids: 0, adjustments: 0, comps: 0, cameras: 0, nulls: 0, images: 0, videos: 0, skippedIndexDependent: 0 };
				var skippedLayers = [];

				// --- 1. DELETAR CAMADAS OCULTAS ---
				if (self.ui.deleteHiddenCheck.value && !processOnlySelected) {
					updateStatus("statusSearchingHidden", "info");
					for (var i = comp.numLayers; i >= 1; i--) {
						var layer = comp.layer(i);
						if (!layer.enabled) { 
							if (isLayerLinked(comp, layer)) {
								skippedLayers.push({ reason: getLocalizedString("reasonLinked") });
							} else {
								var wasLocked = layer.locked;
								if (wasLocked) layer.locked = false;
								layer.remove();
								stats.deleted++;
								if (wasLocked) layer.locked = true;
							}
						}
					}
					if (stats.deleted === 0) updateStatus("statusNoHiddenToDelete", "info");
				}

				// --- 2. PROCESSAR CAMADAS (RENOMEAR E COLORIR) ---
				var layersToProcess = processOnlySelected ? selectedLayers : comp.layers;
				var layerInfos = [];

				var totalLayers = layersToProcess.length;
				for (var i = 0; i < totalLayers; i++) {
					var layer = processOnlySelected ? layersToProcess[i] : layersToProcess[i + 1];
					if (!layer) continue;
					var layerType = "Unknown", prefix = "";

					if (layer instanceof CameraLayer) { layerType = "CameraLayer"; stats.cameras++; prefix = config.prefixes.CameraLayer; }
					else if (layer.nullLayer) { layerType = "NullLayer"; stats.nulls++; prefix = config.prefixes.NullLayer; }
					else if (layer.adjustmentLayer) { layerType = "AdjustmentLayer"; stats.adjustments++; prefix = config.prefixes.AdjustmentLayer; }
					else if (isTextLayer(layer)) { layerType = "TextLayer"; stats.texts++; prefix = config.prefixes.TextLayer; }
					else if (isShapeLayer(layer)) { layerType = "ShapeLayer"; stats.shapes++; prefix = config.prefixes.ShapeLayer; }
					else if (isSolidLayer(layer)) { layerType = "SolidLayer"; stats.solids++; prefix = config.prefixes.SolidLayer; }
					else if (layer.source instanceof CompItem) { layerType = "CompItem"; stats.comps++; prefix = config.prefixes.CompItem; }
					else if (layer.source && layer.source.file) {
						if (/\.(psd|ai|jpg|jpeg|png|gif)$/i.test(layer.source.file.name)) { layerType = "ImageLayer"; stats.images++; prefix = config.prefixes.ImageLayer; }
						else if (/\.(mov|mp4|avi|mkv)$/i.test(layer.source.file.name)) { layerType = "VideoLayer"; stats.videos++; prefix = config.prefixes.VideoLayer; }
					}

					if (layerType !== "Unknown") {
						if (self.ui.renameLayersCheck.value && !layer.locked) {
							var newName = cleanLayerName(layer.name, prefix);
							if (layer.name !== newName) { layer.name = newName; stats.renamed++; }
						} else if (layer.locked) {
							skippedLayers.push({ reason: getLocalizedString("reasonLocked") });
						}
						if (self.ui.applyColorsCheck.value && config.layerColorIndices[layerType]) {
							if (setLayerColor(layer, config.layerColorIndices[layerType])) { stats.colored++; }
						}
					}
					layerInfos.push({ layer: layer, type: layerType, index: layer.index, startTime: layer.startTime });
				}

				// --- 3. REORDENAR CAMADAS ---
				if ((self.ui.reorderLayersCheck.value || self.ui.reorderByTimeCheck.value) && !processOnlySelected) {
					updateStatus("statusCheckingExpressions", "info");
					var layersToReorder = [];
					for (var k = 0; k < layerInfos.length; k++) {
						if (hasIndexDependentExpressions(layerInfos[k].layer)) {
							stats.skippedIndexDependent++;
							skippedLayers.push({ reason: getLocalizedString("reasonIndex") });
						} else {
							layersToReorder.push(layerInfos[k]);
						}
					}

					if (layersToReorder.length > 0) {
						updateStatus("statusReordering", "info");
						if (self.ui.reorderLayersCheck.value) {
							layersToReorder.sort(function(a, b) { var typeIndexA = findIndex(self.layerTypeOrder, a.type); var typeIndexB = findIndex(self.layerTypeOrder, b.type); if (typeIndexA === typeIndexB) return a.startTime - b.startTime; return typeIndexA - typeIndexB; });
							for (var m = layersToReorder.length - 1; m >= 0; m--) { layersToReorder[m].layer.moveToBeginning(); }
						} 
						else if (self.ui.reorderByTimeCheck.value) {
							layersToReorder.sort(function(a, b) { return b.startTime - a.startTime; });
							layersToReorder[0].layer.moveToBeginning();
							for (var n = 1; n < layersToReorder.length; n++) { layersToReorder[n].layer.moveAfter(layersToReorder[n - 1].layer); }
						}
						stats.reordered = layersToReorder.length;
					}
				}

				// --- 4. EXIBIR FEEDBACK FINAL ---
				var statusMessage = getLocalizedString("statusCompleted")
					.replace("{0}", comp.numLayers).replace("{1}", comp.numLayers) 
					.replace("{2}", stats.shapes).replace("{3}", stats.texts).replace("{4}", stats.solids)
					.replace("{5}", stats.adjustments).replace("{6}", stats.comps).replace("{7}", stats.cameras);

				var actions = [];
				if (stats.renamed > 0) actions.push(getLocalizedString("statusRenamed").replace("{0}", stats.renamed));
				if (stats.colored > 0) actions.push(getLocalizedString("statusColored").replace("{0}", stats.colored));
				if (stats.deleted > 0) actions.push(getLocalizedString("statusDeleted").replace("{0}", stats.deleted));
				if (stats.reordered > 0) actions.push(getLocalizedString("statusReorderedAction").replace("{0}", stats.reordered));
				if (stats.skippedIndexDependent > 0) actions.push(getLocalizedString("statusIndexCancelled"));

				if (actions.length > 0) {
					statusMessage += getLocalizedString("statusActions") + actions.join("  •  ");
				}
				updateStatus(statusMessage, "success");

			} catch (err) {
				updateStatus(getLocalizedString("statusError") + err.toString(), "error");
			} finally {
				self.isProcessing = false;
				if (self.ui.organizeBtn.leftClick) self.ui.organizeBtn.leftClick.enabled = true;
				else self.ui.organizeBtn.enabled = true;
				if (self.ui.helpBtn.leftClick) self.ui.helpBtn.leftClick.enabled = true;
				else self.ui.helpBtn.enabled = true;
				app.endUndoGroup();
			}
		},

		// --- FUNÇÃO DE CRIAR BOTÃO (Padrão GNEWS_TextBox.jsx) ---
		//
		createActionButton: function(parent, label, tip, colorOptions) {
			function applyFixedSize(target) {
				if (!target) { return; }
				var sizeArr = [LARGURA_BOTAO_ORGANIZAR, ALTURA_BOTAO_ORGANIZAR];
				target.preferredSize = sizeArr;
				target.minimumSize = sizeArr;
				target.maximumSize = sizeArr;
				target.size = sizeArr;
			}

			function enforceThemeButtonSize(ctrl) {
				if (!ctrl) { return; }
				applyFixedSize(ctrl);
				ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
				ctrl.__buttonThemeOverrides.width = LARGURA_BOTAO_ORGANIZAR;
				ctrl.__buttonThemeOverrides.height = ALTURA_BOTAO_ORGANIZAR;
				var relock = function () { applyFixedSize(ctrl); };
				if (typeof ctrl.onDraw === 'function') {
					var prevDraw = ctrl.onDraw;
					ctrl.onDraw = function () { relock(); prevDraw.apply(this, arguments); };
				} else {
					ctrl.onDraw = relock;
				}
				if (typeof ctrl.addEventListener === 'function') {
					var events = ["mouseover", "mouseout", "mousedown", "mouseup"];
					for (var i = 0; i < events.length; i++) {
						try { ctrl.addEventListener(events[i], relock); } catch (evtErr) {}
					}
				}
				if (typeof D9T_applyThemeToButtonControl === 'function') {
					try {
						var baseTheme = ctrl.__buttonThemeSource;
						if (!baseTheme && typeof D9T_getActiveButtonTheme === 'function') {
							baseTheme = D9T_getActiveButtonTheme();
						}
						D9T_applyThemeToButtonControl(ctrl, baseTheme);
					} catch (themeErr) {}
				}
			}

			// Define cores padrão baseadas nas variáveis globais
			var btnBgColor = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#DDDDDD'; // Base Branca
			var btnTextColor = (typeof bgColor1 !== 'undefined') ? bgColor1 : '#000000'; // Texto Preto
			var hoverBg = (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#D4003C'; // Hover Vermelho
			var hoverText = (typeof normalColor1 !== 'undefined') ? normalColor1 : '#FFFFFF'; // Texto Hover Branco
	
			if (colorOptions) {
				if (colorOptions.bg) btnBgColor = colorOptions.bg;
				if (colorOptions.text) btnTextColor = colorOptions.text;
				if (colorOptions.hoverBg) hoverBg = colorOptions.hoverBg;
				if (colorOptions.hoverText) hoverText = colorOptions.hoverText;
			}
	
			var buttonObj;
	
			if (typeof themeButton === 'function') {
				var cfg = {
					labelTxt: label,
					tips: [tip],
					width: LARGURA_BOTAO_ORGANIZAR,
					height: ALTURA_BOTAO_ORGANIZAR
				};
				if (btnTextColor) { cfg.textColor = btnTextColor; }
				if (btnBgColor) { cfg.buttonColor = btnBgColor; }
				buttonObj = new themeButton(parent, cfg);
				if (buttonObj && buttonObj.label) {
					enforceThemeButtonSize(buttonObj.label);
				}
			} else {
				buttonObj = parent.add('button', undefined, label);
				applyFixedSize(buttonObj);
				buttonObj.helpTip = tip;
			}
			return buttonObj;
		},

		// Helper para atribuir cliques
		assignClick: function(buttonObj, clickFunction) {
			if (buttonObj && buttonObj.leftClick) {
				buttonObj.leftClick.onClick = clickFunction; 
			} 
			else if (buttonObj) {
				buttonObj.onClick = clickFunction; 
			}
		},

		// Constrói a interface gráfica do script.
		buildUI: function(thisObj) {
			var self = this;
			var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
			var modulePrefKey = "LayerOrder";
			var defaultOptions = {
				applyColors: true,
				renameLayers: true,
				reorderByType: true,
				reorderByTime: false,
				deleteHidden: false
			};
			var modulePrefs = prefsApi ? prefsApi.getModulePrefs(modulePrefKey) : {};
			if (typeof modulePrefs !== 'object' || modulePrefs === null) { modulePrefs = {}; }
			function optionValue(key) {
				return modulePrefs.hasOwnProperty(key) ? modulePrefs[key] : defaultOptions[key];
			}
			function persistOption(key, value) {
				modulePrefs[key] = value;
				if (prefsApi) { prefsApi.setModulePref(modulePrefKey, key, value, true); }
			}
			
			// --- JANELA PRINCIPAL ---
			// Bloqueia o redimensionamento
			self.ui.win = (thisObj instanceof Panel) ? thisObj : new Window("palette", JANELA_TITULO, undefined, {resizeable: false});
			self.ui.win.orientation = "column";
			self.ui.win.spacing = 10;
			self.ui.win.margins = 15;
			self.ui.win.preferredSize.width = LARGURA_JANELA_PADRAO;
			if (typeof setBgColor === 'function' && typeof bgColor1 !== 'undefined') {
				setBgColor(self.ui.win, bgColor1);
			}
			
			// --- CABEÇALHO (TÍTULO E AJUDA) [Padrão GNEWS_CopyLinks.jsx] ---
			var headerStackGrp = self.ui.win.add('group');
			headerStackGrp.orientation = 'stack';
			headerStackGrp.alignment = 'fill';
			
			var titleGroup = headerStackGrp.add('group');
			titleGroup.alignment = 'left';
			var titleText = titleGroup.add("statictext", undefined, SCRIPT_SUBTITLE);
			if (typeof setFgColor === 'function' && typeof highlightColor1 !== 'undefined') {
				setFgColor(titleText, highlightColor1);
			}

			var helpBtnGroup = headerStackGrp.add('group');
			helpBtnGroup.alignment = 'right';
			if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
				self.ui.helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + getLocalizedString("helpBtnShortTip")] });
			} else {
				self.ui.helpBtn = helpBtnGroup.add("button", undefined, "?");
				self.ui.helpBtn.preferredSize = [LARGURA_BOTAO_AJUDA, LARGURA_BOTAO_AJUDA];
				self.ui.helpBtn.helpTip = getLocalizedString("helpBtnTip");
			}
			
			// --- PAINEL DE OPÇÕES (CHECKBOXES) ---
			self.ui.optionsPanel = self.ui.win.add("panel", undefined, getLocalizedString("optionsPanel"));
			self.ui.optionsPanel.orientation = "column";
			self.ui.optionsPanel.alignment = ["fill", "top"];
			self.ui.optionsPanel.alignChildren = ["left", "top"];
			self.ui.optionsPanel.margins = 15;
			self.ui.optionsPanel.spacing = 8;
			if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') {
				setFgColor(self.ui.optionsPanel, monoColor1);
			}
			
			self.ui.applyColorsCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("applyColorsCheck"));
			self.ui.applyColorsCheck.helpTip = getLocalizedString("applyColorsTip");
			self.ui.applyColorsCheck.value = optionValue("applyColors");
			self.ui.renameLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("renameLayersCheck"));
			self.ui.renameLayersCheck.helpTip = getLocalizedString("renameLayersTip");
			self.ui.renameLayersCheck.value = optionValue("renameLayers");
			self.ui.reorderLayersCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderLayersCheck"));
			self.ui.reorderLayersCheck.helpTip = getLocalizedString("reorderLayersTip");
			self.ui.reorderLayersCheck.value = optionValue("reorderByType");
			self.ui.reorderByTimeCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("reorderByTimeCheck"));
			self.ui.reorderByTimeCheck.helpTip = getLocalizedString("reorderByTimeTip");
			self.ui.reorderByTimeCheck.value = optionValue("reorderByTime");
			self.ui.deleteHiddenCheck = self.ui.optionsPanel.add("checkbox", undefined, getLocalizedString("deleteHiddenCheck"));
			self.ui.deleteHiddenCheck.helpTip = getLocalizedString("deleteHiddenTip");
			self.ui.deleteHiddenCheck.value = optionValue("deleteHidden");
			
			var allChecks = [self.ui.applyColorsCheck, self.ui.renameLayersCheck, self.ui.reorderLayersCheck, self.ui.reorderByTimeCheck, self.ui.deleteHiddenCheck];
			if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') {
				for (var i = 0; i < allChecks.length; i++) {
					setFgColor(allChecks[i], monoColor1);
				}
			}
			
			self.ui.applyColorsCheck.onClick = function() { persistOption("applyColors", !!this.value); };
			self.ui.renameLayersCheck.onClick = function() { persistOption("renameLayers", !!this.value); };
			self.ui.deleteHiddenCheck.onClick = function() { persistOption("deleteHidden", !!this.value); };
			self.ui.reorderLayersCheck.onClick = function() {
				if (this.value) {
					self.ui.reorderByTimeCheck.value = false;
					persistOption("reorderByTime", false);
				}
				persistOption("reorderByType", !!this.value);
			};
			self.ui.reorderByTimeCheck.onClick = function() {
				if (this.value) {
					self.ui.reorderLayersCheck.value = false;
					persistOption("reorderByType", false);
				}
				persistOption("reorderByTime", !!this.value);
			};
			
			// --- BOTÃO DE AÇÃO PRINCIPAL (Padrão TextBox) ---
			var mainBtnPanel = self.ui.win.add("group");
			mainBtnPanel.orientation = "row";
			mainBtnPanel.alignment = ["fill", "fill"];
			// Centraliza o botão dentro do grupo
			mainBtnPanel.alignChildren = "center";
			
			// *** CORREÇÃO APLICADA AQUI ***
			// Chama a função SEM passar o objeto de cor customizada.
			// Isso fará com que a função use os padrões internos (base branca)
			//.
			self.ui.organizeBtn = self.createActionButton(mainBtnPanel, getLocalizedString("automateBtn"), getLocalizedString("organizeBtnTip"));
			
			// --- PAINEL DE STATUS ---
			var statusPanel = self.ui.win.add("panel", undefined, "Status");
			statusPanel.alignment = "fill";
			statusPanel.margins = 10;
			if (typeof setFgColor === 'function' && typeof monoColor1 !== 'undefined') {
				setFgColor(statusPanel, monoColor1);
			}
			statusText = statusPanel.add("statictext", [0,0, LARGURA_JANELA_PADRAO - 60, 40], getLocalizedString("statusReady"), {multiline: true});
			statusText.alignment = ['fill', 'fill'];
			
			// =================================================================================
			// --- EVENTOS DA INTERFACE ---
			// =================================================================================
			
			// Atribui clique ao botão principal
			self.assignClick(self.ui.organizeBtn, function() { self.executeOrganize(); });

			// Define a função de ajuda
			function showHelp() {
				if (typeof showLayerOrderHelp === 'function') {
					showLayerOrderHelp();
				} else {
					themedAlert("Erro de Módulo", "A biblioteca de ajuda (HELP lib.js) não foi encontrada.");
				}
			}
			
			// Atribui clique ao botão de ajuda
			self.assignClick(self.ui.helpBtn, showHelp);

			// --- Finalização da UI ---
			if (self.ui.win instanceof Window) {
				self.ui.win.center();
				self.ui.win.show();
			} else {
				self.ui.win.layout.layout(true);
			}
		}
	};

	// Inicia a construção da UI.
	LayersOrganizer.buildUI(thisObj);
}
