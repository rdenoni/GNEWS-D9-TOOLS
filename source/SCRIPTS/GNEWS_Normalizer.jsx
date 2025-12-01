$.encoding = "UTF-8";
/**********************************************************************************
 *
 * GNEWS Normalizer (Kit de Ferramentas - Normalizadores)
 * Autor: Gemini (Google AI) & Usuário
 * Versão: 18.6.0 (Revertido para a lógica de centralização especificada)
 *
 * MODULOS USADOS:
 * source/globals.js (para variáveis de tema e cores)
 * source/libraries/HELP lib.js (para a janela de ajuda)
 * source/layout/main_ui_functions.js (para o componente themeIconButton)
 * source/libraries/ICON lib.js (para o ícone de ajuda D9T_INFO_ICON)
 *
 * ATUALIZAÇÃO:
 * - REVERSÃO DE FUNÇÃO: A função 'Centralizar Objeto' foi revertida para
 * a versão anterior, conforme solicitado, que calcula os limites visuais
 * e aplica um deslocamento direto à posição da camada.
 * - ATUALIZAÇÃO UI: O subtítulo do script e o título do painel de
 * transformações foram atualizados conforme solicitado.
 *
 **********************************************************************************/

function launchNormalizerUI(thisObj) {
	// =================================================================================
	// --- VARIÁVEIS DE CONFIGURAÇÃO RÁPIDA ---
	// Aqui você pode ajustar facilmente a aparência e o comportamento do script.
	// =================================================================================
	var SCRIPT_NAME = "GNEWS NORMALIZER";
	var SCRIPT_SUBTITLE = "Normaliza propriedades e reposiciona"; // ATUALIZADO
	var SCRIPT_VERSION = "18.6";

	// Configurações de Tamanho da Interface
	var LARGURA_JANELA = 400; // Largura inicial da janela
	var LARGURA_BOTAO_TEMATICO = 200; // Ajuste rápido para a largura dos botões temáticos
	var ALTURA_BOTAO_TEMATICO = 40; // Ajuste rápido para a altura dos botões temáticos
	var LARGURA_BOTAO_PRINCIPAL = LARGURA_BOTAO_TEMATICO;
	var ALTURA_BOTAO_PRINCIPAL = ALTURA_BOTAO_TEMATICO;
	var ALTURA_PAINEL_STATUS = 40; // Altura da área de feedback de status
	var TAMANHO_BOTAO_AJUDA = 25; // Tamanho (largura e altura) do botão de interrogação

	// Configurações de Layout
	var MARGENS_JANELA = 16; // Espaçamento nas bordas da janela
	var ESPACAMENTO_ELEMENTOS = 10; // Espaçamento vertical entre os painéis
	var prefsApi = (typeof D9T_Preferences !== 'undefined') ? D9T_Preferences : null;
	var PREFS_KEY = "Normalizer";
	var defaultPrefs = { includeStrokeScale: true };
	var modulePrefs = prefsApi ? prefsApi.getModulePrefs(PREFS_KEY) : {};
	if (typeof modulePrefs !== 'object' || modulePrefs === null) { modulePrefs = {}; }
	function getPrefValue(key) {
		return modulePrefs.hasOwnProperty(key) ? modulePrefs[key] : defaultPrefs[key];
	}
	function setPrefValue(key, value, persist) {
		modulePrefs[key] = value;
		if (prefsApi) { prefsApi.setModulePref(PREFS_KEY, key, value, !!persist); }
	}


	// =================================================================================
	// --- FUNÇÕES AUXILIARES DE TEMA ---
	// Estas funções são utilitárias para manipular cores no formato hexadecimal
	// e aplicá-las aos elementos da interface gráfica do After Effects.
	// =================================================================================

	// Converte uma string de cor hexadecimal (ex: '#FF0000') para um array RGB normalizado (ex: [1, 0, 0])
	function hexToRgb(hex) {
		hex = hex.replace("#", "");
		var r = parseInt(hex.substring(0, 2), 16) / 255;
		var g = parseInt(hex.substring(2, 4), 16) / 255;
		var b = parseInt(hex.substring(4, 6), 16) / 255;
		return [r, g, b];
	}

	// Define a cor de fundo de um elemento da UI.
	function setBgColor(element, hexColor) {
		try {
			element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, hexToRgb(hexColor));
		} catch (e) { /* Ignora erros caso o elemento não suporte a propriedade */ }
	}

	// Define a cor do texto/frente de um elemento da UI.
	function setFgColor(element, hexColor) {
		try {
			element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, hexToRgb(hexColor), 1);
		} catch (e) { /* Ignora erros */ }
	}

	// =================================================================================
	// --- FUNÇÃO PRINCIPAL DA INTERFACE ---
	// Esta é a função que constrói e exibe a janela do script.
	// =================================================================================
	// Cria a janela. Se o script for executado como um painel encaixável ('Panel'), ele usa o painel existente.
	// Caso contrário, cria uma nova janela flutuante ('palette').
	var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", SCRIPT_NAME + " v" + SCRIPT_VERSION, undefined, { resizeable: false });
	if (pal === null) return; // Encerra o script se a janela não puder ser criada.

	// Define as propriedades básicas da janela (orientação, alinhamento, espaçamento e margens).
	pal.orientation = "column";
	pal.alignChildren = ["fill", "top"];
	pal.spacing = ESPACAMENTO_ELEMENTOS;
	pal.margins = MARGENS_JANELA;
	pal.preferredSize.width = LARGURA_JANELA;
	setBgColor(pal, bgColor1); // Usa a variável 'bgColor1' do arquivo 'globals.js' para a cor de fundo.

	// Função que será chamada ao clicar no botão de ajuda.
	function showHelp() {
		// Verifica se a função 'showNormalizerHelp' (do arquivo HELP lib.js) foi carregada.
		if (typeof showNormalizerHelp === 'function') {
			showNormalizerHelp(); // Chama a função para exibir a janela de ajuda específica deste módulo.
		} else {
			// Exibe um alerta se a biblioteca de ajuda não for encontrada.
			alert("A biblioteca de ajuda (HELP lib.js) não foi encontrada.");
		}
	}

	// --- CONSTRUÇÃO DA INTERFACE GRÁFICA (UI) ---
	// O cabeçalho usa um grupo 'stack' para permitir que o título fique à esquerda e o botão de ajuda à direita,
	// ocupando o mesmo espaço vertical.
	var headerGroup = pal.add("group");
	headerGroup.orientation = 'stack';
	headerGroup.alignment = 'fill';
	headerGroup.margins = [0, 0, 0, 10]; // Adiciona uma margem inferior para separar do resto do conteúdo.

		// Grupo para o tA-tulo (alinhado A esquerda).

	var titleGroup = headerGroup.add('group');
	titleGroup.alignment = 'left';
	var subtitleText = titleGroup.add("statictext", undefined, SCRIPT_SUBTITLE);
	subtitleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 13); // Define a fonte do subtA-tulo.
	setFgColor(subtitleText, highlightColor1); // Usa a cor de destaque global.


	// Grupo para o botão de ajuda (alinhado à direita).
	var helpBtn;
	var helpBtnGroup = headerGroup.add('group');
	helpBtnGroup.alignment = 'right';

	// Tenta criar um botão de ajuda estilizado usando a função 'themeIconButton' do 'main_ui_functions.js'.
	// Isso garante que o botão de ajuda seja visualmente consistente com o resto do GND9TOOLS.
	if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
		try {
			// Cria o botão com ícone e tooltip (dica de ajuda).
			helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
			helpBtn.leftClick.onClick = showHelp; // Associa a função de ajuda ao clique.
		} catch (e) {
			// Se a criação do botão estilizado falhar, cria um botão de texto simples como alternativa.
			helpBtn = helpBtnGroup.add("button", undefined, "?");
			helpBtn.preferredSize = [TAMANHO_BOTAO_AJUDA, TAMANHO_BOTAO_AJUDA];
			helpBtn.onClick = showHelp;
		}
	} else {
		// Alternativa caso as bibliotecas de UI não estejam disponíveis.
		helpBtn = helpBtnGroup.add("button", undefined, "?");
		helpBtn.preferredSize = [TAMANHO_BOTAO_AJUDA, TAMANHO_BOTAO_AJUDA];
		helpBtn.onClick = showHelp;
	}

	function applyFixedSize(target, width, height) {
		if (!target || typeof width !== 'number' || typeof height !== 'number') { return; }
		var sizeArr = [width, height];
		target.preferredSize = sizeArr;
		target.minimumSize = sizeArr;
		target.maximumSize = sizeArr;
		target.size = sizeArr;
	}

	function lockButtonSize(ctrl, width, height) {
		if (!ctrl) { return; }
		if (typeof width === 'number' && typeof height === 'number') {
			applyFixedSize(ctrl, width, height);
			if (ctrl.parent && ctrl.parent.type === "group") {
				applyFixedSize(ctrl.parent, width, height);
			}
		}
		ctrl.__buttonThemeOverrides = ctrl.__buttonThemeOverrides || {};
		if (typeof width === 'number') { ctrl.__buttonThemeOverrides.width = width; }
		if (typeof height === 'number') { ctrl.__buttonThemeOverrides.height = height; }
	}

	function enforceButtonSize(ctrl, width, height) {
		if (!ctrl) { return; }
		lockButtonSize(ctrl, width, height);
		if (typeof ctrl.onDraw === 'function') {
			var originalDraw = ctrl.onDraw;
			ctrl.onDraw = function() {
				lockButtonSize(this, width, height);
				originalDraw.apply(this, arguments);
			};
		} else {
			ctrl.onDraw = function() { lockButtonSize(this, width, height); };
		}
		if (typeof ctrl.addEventListener === 'function') {
			var relock = function() { lockButtonSize(this, width, height); };
			var evtNames = ["mouseover", "mouseout", "mousedown", "mouseup"];
			for (var e = 0; e < evtNames.length; e++) {
				try { ctrl.addEventListener(evtNames[e], relock); } catch (evtErr) {}
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

	function createThemedButton(parent, label, tip, options) {
		options = options || {};
		var targetWidth = (typeof options.width === 'number') ? options.width : LARGURA_BOTAO_PRINCIPAL;
		var targetHeight = (typeof options.height === 'number') ? options.height : ALTURA_BOTAO_PRINCIPAL;
		var buttonCtrl;
		if (typeof themeButton === 'function') {
			var cfg = { labelTxt: label };
			if (tip) { cfg.tips = [tip]; }
			if (options.width) { cfg.width = options.width; }
			if (options.height) { cfg.height = options.height; }
			buttonCtrl = new themeButton(parent, cfg).label;
		} else {
			buttonCtrl = parent.add("button", undefined, label);
			if (options.width) { buttonCtrl.preferredSize.width = options.width; }
			if (options.height) { buttonCtrl.preferredSize.height = options.height; }
		}
		if (buttonCtrl && tip) { buttonCtrl.helpTip = tip; }
		enforceButtonSize(buttonCtrl, targetWidth, targetHeight);
		return buttonCtrl;
	}


	// --- PAINÉIS E BOTÕES DE AÇÃO ---

	// Painel de Escala
	var scalePanel = pal.add("panel", undefined, "Escala");
	scalePanel.alignChildren = 'fill';
	setFgColor(scalePanel, monoColor1); // Cor do título do painel.
	var cbIncludeStrokeScale = scalePanel.add("checkbox", undefined, "Ajustar Largura do Stroke");
	cbIncludeStrokeScale.value = getPrefValue("includeStrokeScale");
	cbIncludeStrokeScale.helpTip = "Quando ativado, o stroke/contorno acompanha o novo valor de escala.";
	setFgColor(cbIncludeStrokeScale, monoColor1); // Cor do texto da checkbox.
	var normalizeScaleBtn = createThemedButton(scalePanel, " Normalizar Escala 100%", "Aplica escala 100% às layers selecionadas preservando proporções.", { width: LARGURA_BOTAO_PRINCIPAL });
	cbIncludeStrokeScale.onClick = function() { setPrefValue("includeStrokeScale", !!this.value, true); };

	// Painel de Âncora
	var anchorPanel = pal.add("panel", undefined, "Âncora");
	anchorPanel.alignChildren = 'fill';
	setFgColor(anchorPanel, monoColor1);
	var anchorBtnsGroup = anchorPanel.add("group");
	anchorBtnsGroup.orientation = "row";
	var normalizeAnchorBtn = createThemedButton(anchorBtnsGroup, " Normalizar Ancora", "Reposiciona o ponto de Âncora para o centro geométrico da layer.", { width: LARGURA_BOTAO_PRINCIPAL });
	var AnchorAlignBtn = createThemedButton(anchorBtnsGroup, " Centralizar Ancora", "Executa o comando nativo para centralizar o ponto de Âncora baseado no conteúdo.", { width: LARGURA_BOTAO_PRINCIPAL });

	// Painel de Posição
	var posPanel = pal.add("panel", undefined, "Posição");
	posPanel.alignChildren = 'fill';
	setFgColor(posPanel, monoColor1);
	var posGroup = posPanel.add("group");
	posGroup.orientation = "row";
	var positionZeroBtn = createThemedButton(posGroup, " Posição [0,0] via Âncora", "Move as layers para a origem (0,0) compensando pelo ponto de Âncora.", { width: LARGURA_BOTAO_PRINCIPAL });
	var centerObjectBtn = createThemedButton(posGroup, " Centralizar Objeto", "Centraliza visualmente as layers na composição atual.", { width: LARGURA_BOTAO_PRINCIPAL });

	// Painel de Rotação
	var rotPanel = pal.add("panel", undefined, "Rotação");
	rotPanel.alignChildren = 'fill';
	setFgColor(rotPanel, monoColor1);
	var rotBtnsGroup = rotPanel.add("group");
	rotBtnsGroup.orientation = "row";
	var normalizeRotBtn = createThemedButton(rotBtnsGroup, " Normalizar Rotação", "Zera valores de rotação mantendo a orientação atual.", { width: LARGURA_BOTAO_PRINCIPAL });
	var zeroRotationBtn = createThemedButton(rotBtnsGroup, " Resetar Rotação", "Define rotação em 0° sem ajustes adicionais.", { width: LARGURA_BOTAO_PRINCIPAL });

	// Painel para Resetar Propriedades
	var shapePanel = pal.add("panel", undefined, "Transformações");
	shapePanel.alignChildren = 'fill';
	setFgColor(shapePanel, monoColor1);
	var resetShapeTransformsBtn = createThemedButton(shapePanel, "Resetar Transformações", "Reinicia posição, escala e rotação de shapes/textos para valores padrão.", { width: LARGURA_BOTAO_PRINCIPAL });


	// Painel de Status (feedback para o usuário)
	var statusPanel = pal.add('panel', undefined, "Status");
	statusPanel.alignment = 'fill';
	setFgColor(statusPanel, monoColor1);
	var feedbackTxt = statusPanel.add("statictext", undefined, "Pronto.", { multiline: true });
	feedbackTxt.alignment = ['fill', 'center'];
	feedbackTxt.preferredSize.height = ALTURA_PAINEL_STATUS;
	setFgColor(feedbackTxt, normalColor1);
	feedbackTxt.helpTip = "Mensagens de status e erros aparecem aqui.";

	// Finaliza o layout da janela e define a função de redimensionamento.
	pal.layout.layout(true);
	pal.onResizing = pal.onResize = function() { this.layout.resize(); }

	// --- LÓGICA INTERNA E EVENTOS DOS BOTÕES ---

	// Função auxiliar para obter as camadas alvo (selecionadas ou todas).
	function getLayers(needsSelection) {
		var comp = app.project.activeItem;
		if (!comp || !(comp instanceof CompItem)) {
			feedbackTxt.text = "ERRO: Nenhuma composição ativa.";
			return null;
		}
		var layers = [];
		var sel = comp.selectedLayers;
		if (sel.length > 0) {
			for (var i = 0; i < sel.length; i++) layers.push(sel[i]);
		} else if (!needsSelection) {
			// Se a seleção não for obrigatória, pega todas as layers da comp.
			for (var i = 1; i <= comp.numLayers; i++) layers.push(comp.layer(i));
		} else {
			// Se a seleção for obrigatória e nada estiver selecionado, exibe erro.
			feedbackTxt.text = "ERRO: Selecione pelo menos uma camada.";
			return null;
		}
		return layers;
	}

	// Desseleciona todas as camadas da composição. Útil para operar em uma camada por vez.
	function deselectAllLayers(comp) {
		for (var i = 1; i <= comp.numLayers; i++) {
			comp.layer(i).selected = false;
		}
	}

	// Executa o comando nativo do After Effects para centralizar o ponto de âncora.
	function runAnchorAlignCommand() {
		var commandID = 0;
		// Tenta encontrar o comando em inglês e português para maior compatibilidade.
		try { commandID = app.findMenuCommandId("Center Anchor Point in Layer Content"); } catch (e) {}
		if (commandID === 0) { try { commandID = app.findMenuCommandId("Centralizar ponto de ancoragem no conteúdo da camada"); } catch (e) {} }
		if (commandID !== 0) {
			app.executeCommand(commandID);
			return true;
		}
		return false;
	}

	// Calcula os limites visuais (bounding box) de uma camada em um tempo específico.
	function getLayerBoundsAtTime(layer, time) {
		var rect;
		if ((layer instanceof TextLayer || layer instanceof ShapeLayer) && layer.sourceRectAtTime) {
			try { rect = layer.sourceRectAtTime(time, true); } catch (e) { rect = { top: 0, left: 0, width: 0, height: 0 }; }
		} else if (layer.source) {
			rect = { top: 0, left: 0, width: layer.source.width, height: layer.source.height };
		} else {
			return null;
		}
		if (rect.width <= 0 || rect.height <= 0) return null;
		var corners = [
			[rect.left, rect.top],
			[rect.left + rect.width, rect.top],
			[rect.left + rect.width, rect.top + rect.height],
			[rect.left, rect.top + rect.height]
		];
		var position = layer.transform.position.valueAtTime(time, false);
		var anchorPoint = layer.transform.anchorPoint.valueAtTime(time, false);
		var scale = layer.transform.scale.valueAtTime(time, false);
		var rotation = layer.transform.rotation.valueAtTime(time, false);
		var rad = -rotation * Math.PI / 180,
			cos = Math.cos(rad),
			sin = Math.sin(rad),
			sx = scale[0] / 100,
			sy = scale[1] / 100;
		var transformedCorners = [];
		for (var i = 0; i < 4; i++) {
			var corner = corners[i],
				x = corner[0] - anchorPoint[0],
				y = corner[1] - anchorPoint[1];
			x *= sx;
			y *= sy;
			var rotatedX = x * cos - y * sin,
				rotatedY = x * sin + y * cos;
			transformedCorners.push([rotatedX + position[0], rotatedY + position[1]]);
		}
		var minX = transformedCorners[0][0],
			maxX = transformedCorners[0][0],
			minY = transformedCorners[0][1],
			maxY = transformedCorners[0][1];
		for (var i = 1; i < 4; i++) {
			minX = Math.min(minX, transformedCorners[i][0]);
			maxX = Math.max(maxX, transformedCorners[i][0]);
			minY = Math.min(minY, transformedCorners[i][1]);
			maxY = Math.max(maxY, transformedCorners[i][1]);
		}
		return { left: minX, top: minY, right: maxX, bottom: maxY };
	}

	// Calcula os limites visuais combinados de múltiplas camadas.
	function calculateBounds(comp, layers) {
		var time = comp.time;
		var minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		var hasValidBounds = false;
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			if (!layer.enabled || (time < layer.inPoint || time > layer.outPoint)) continue;
			try {
				var layerBounds = getLayerBoundsAtTime(layer, time);
				if (layerBounds) {
					minX = Math.min(minX, layerBounds.left);
					minY = Math.min(minY, layerBounds.top);
					maxX = Math.max(maxX, layerBounds.right);
					maxY = Math.max(maxY, layerBounds.bottom);
					hasValidBounds = true;
				}
			} catch (e) {}
		}
		if (!hasValidBounds) return null;
		return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
	}


	// --- EVENTO: Clique no botão "Normalizar Escala 100%" ---
	normalizeScaleBtn.onClick = function() {
		var layers = getLayers(true);
		if (!layers) return;
		var comp = app.project.activeItem;
		app.beginUndoGroup("Normalizar Escala 100%");
		var c = 0;

		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			try {
				var scale = layer.transform.scale.value;
				if (scale[0] === 100 && scale[1] === 100) continue;

				if (layer instanceof TextLayer) {
					// Para camadas de texto, aplica a escala diretamente no tamanho da fonte e do stroke.
					var textProp = layer.property("Source Text");
					var textDoc = textProp.value;
					textDoc.fontSize *= (scale[0] / 100);
					if (cbIncludeStrokeScale.value && textDoc.applyStroke) {
						var avgS = (Math.abs(scale[0]) + Math.abs(scale[1])) / 200;
						if (avgS > 0) textDoc.strokeWidth *= avgS;
					}
					textProp.setValue(textDoc);
					layer.transform.scale.setValue([100, 100, 100]); // Reseta a escala da camada.
					c++;
				} else if (layer instanceof ShapeLayer) {
					// Para shape layers, transfere a escala da camada para a escala de cada grupo interno.
					for (var j = 1; j <= layer.property("Contents").numProperties; j++) {
						var group = layer.property("Contents").property(j);
						if (group.matchName === "ADBE Vector Group") {
							var gs = group.property("Transform").scale;
							gs.setValue([gs.value[0] * scale[0] / 100, gs.value[1] * scale[1] / 100]);
						}
					}
					layer.transform.scale.setValue([100, 100, 100]); // Reseta a escala da camada.
					c++;
				} else if (layer instanceof AVLayer) {
					// Para outras camadas (vídeos, imagens), a única forma segura é pré-compor.
					var layerIndex = layer.index;
					comp.layers.precompose([layerIndex], layer.name + " (Escala Normalizada)", true);
					c++;
				}
			} catch (e) {}
		}
		app.endUndoGroup();
		feedbackTxt.text = "Escala normalizada em " + c + " camada(s).";
	};

	// --- EVENTO: Clique no botão "Centralizar Objeto" ---
	centerObjectBtn.onClick = function() {
		var layers = getLayers(true);
		if (!layers) return;
		app.beginUndoGroup("Centralizar Objeto (Visual)");
		var c = 0;
		var comp = app.project.activeItem;
		if (!comp) return;
		var compCenter = [comp.width / 2, comp.height / 2];
	
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			try {
				// PASSO 1: Obter os limites visuais da camada diretamente no espaço da composição.
				// A função getLayerBoundsAtTime já considera escala, rotação, etc., sendo a forma mais robusta.
				var bounds = getLayerBoundsAtTime(layer, comp.time);
				if (!bounds) continue; // Pula a camada se não tiver limites visuais (ex: câmera).

				// PASSO 2: Calcular o centro visual atual da camada no espaço da composição.
				var visualCenterX = bounds.left + (bounds.right - bounds.left) / 2;
				var visualCenterY = bounds.top + (bounds.bottom - bounds.top) / 2;

				// PASSO 3: Calcular o vetor de deslocamento necessário para mover o centro visual para o centro da comp.
				var moveX = compCenter[0] - visualCenterX;
				var moveY = compCenter[1] - visualCenterY;

				// PASSO 4: Aplicar o deslocamento à posição atual da camada.
				var currentPos = layer.transform.position.value;
				var newPos = [currentPos[0] + moveX, currentPos[1] + moveY];

				// Mantém a posição Z se a camada for 3D.
				if (currentPos.length > 2) {
					newPos.push(currentPos[2] || 0); // Garante que o valor Z exista
				}

				layer.transform.position.setValue(newPos);
				c++;

			} catch (e) {
				// Ignora erros e continua para a próxima camada para evitar que o script pare.
			}
		}

		feedbackTxt.text = c + " camada(s) centralizada(s) visualmente.";
		app.endUndoGroup();
	};

	// --- EVENTO: Clique no botão "Posição [0,0] via Âncora" ---
	positionZeroBtn.onClick = function() {
		var layers = getLayers(true);
		if (!layers) return;

		app.beginUndoGroup("Zerar Posição via Ponto de Ancoragem");
		var c = 0;

		for (var i = 0; i < layers.length; i++) {
			var targetLayer = layers[i];
			try {
				// A lógica é mover a posição para [0,0,0] e compensar esse deslocamento no ponto de âncora.
				var originalPosition = targetLayer.transform.position.value;
				var originalAnchorPoint = targetLayer.transform.anchorPoint.value;

				var newAnchorPoint = [
					originalAnchorPoint[0] - originalPosition[0],
					originalAnchorPoint[1] - originalPosition[1]
				];

				// Adiciona o eixo Z se a camada for 3D.
				if (originalPosition.length > 2) {
					var originalAnchorZ = (originalAnchorPoint.length > 2) ? originalAnchorPoint[2] : 0;
					newAnchorPoint.push(originalAnchorZ - originalPosition[2]);
				}

				targetLayer.transform.position.setValue([0, 0, 0]);
				targetLayer.transform.anchorPoint.setValue(newAnchorPoint);
				c++;
			} catch (e) {}
		}

		app.endUndoGroup();
		feedbackTxt.text = "Posição de " + c + " camada(s) zerada via Âncora.";
	};


	// --- EVENTO: Clique no botão "Normalizar Rotação" ---
	normalizeRotBtn.onClick = function() {
		var comp = app.project.activeItem;
		var layers = getLayers(true);
		if (!layers) return;

		app.beginUndoGroup("Normalizar Rotação");
		
		var shapeLayers = [];
		var otherLayers = [];
		var otherLayerIndices = [];
		
		// Separa as camadas selecionadas em shape layers e outras.
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			if (layer.matchName === "ADBE Vector Layer") {
				shapeLayers.push(layer);
			} else {
				otherLayers.push(layer);
				otherLayerIndices.push(layer.index);
			}
		}

		var processedShapes = 0;
		if (shapeLayers.length > 0) {
			// Função recursiva para percorrer todos os grupos de uma shape layer.
			function traverse(propGroup, r) {
				for (var i = 1; i <= propGroup.numProperties; i++) {
					var prop = propGroup.property(i);
					if (prop.matchName === "ADBE Vector Group") {
						// Adiciona a rotação da camada à rotação do grupo.
						try { prop.property("Transform").rotation.setValue(prop.property("Transform").rotation.value + r); } catch (e) {}
						traverse(prop.property("Contents"), r); // Continua a busca em subgrupos.
					}
				}
			}
			// Para cada shape layer, transfere sua rotação para os grupos internos.
			for (var i = 0; i < shapeLayers.length; i++) {
				try {
					var r = shapeLayers[i].transform.rotation;
					var v = r.value;
					if (v !== 0) {
						traverse(shapeLayers[i].property("Contents"), v);
						r.setValue(0); // Zera a rotação da camada.
						processedShapes++;
					}
				} catch (e) {}
			}
		}

		var processedOthers = 0;
		// Para as outras camadas (vídeo, imagem, etc.), a única solução é pré-compor.
		if (otherLayerIndices.length > 0) {
			try {
				var bounds = calculateBounds(comp, otherLayers);
				if (!bounds) throw new Error("Não foi possível calcular os limites.");
				
				// Pré-compõe as camadas e ajusta o tamanho e posição da nova comp para
				// corresponder exatamente ao espaço visual que as camadas ocupavam.
				var newComp = comp.layers.precompose(otherLayerIndices, "Rot-Norm_Crop", true);
				var newCompLayer = comp.layer(otherLayerIndices[0]);

				newComp.width = Math.max(1, Math.ceil(bounds.width));
				newComp.height = Math.max(1, Math.ceil(bounds.height));
				var internalOffset = [-bounds.left, -bounds.top];
				for (var i = 1; i <= newComp.numLayers; i++) {
					var layerInPrecomp = newComp.layer(i);
					var prop = layerInPrecomp.transform.position;
					var oldVal = prop.value;
					prop.setValue([oldVal[0] + internalOffset[0], oldVal[1] + internalOffset[1], oldVal[2] || 0]);
				}
				
				var finalPosition = [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2];
				if(newCompLayer.transform.position.value.length > 2) {
					finalPosition.push(newCompLayer.transform.position.value[2]);
				}
				newCompLayer.transform.position.setValue(finalPosition);
				processedOthers = otherLayerIndices.length;
			} catch(e) { feedbackTxt.text = "ERRO: " + e.message; }
		}

		var totalProcessed = processedShapes + processedOthers;
		if(totalProcessed > 0) {
			feedbackTxt.text = "Rotação normalizada em " + totalProcessed + " camada(s).";
		} else {
			feedbackTxt.text = "Nenhuma camada com rotação selecionada.";
		}


		app.endUndoGroup();
	};


	// --- EVENTO: Clique no botão "Resetar Rotação" ---
	zeroRotationBtn.onClick = function() {
		app.beginUndoGroup("Zerar Rotação");
		var layers = getLayers(true);
		if (!layers) { app.endUndoGroup(); return; }
		var processedCount = 0;
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			try {
				if (layer.threeDLayer) {
					// Zera todas as propriedades de rotação e orientação para camadas 3D.
					layer.transform.xRotation.setValue(0);
					layer.transform.yRotation.setValue(0);
					layer.transform.zRotation.setValue(0);
					layer.transform.orientation.setValue([0, 0, 0]);
				} else {
					// Zera a rotação para camadas 2D.
					layer.transform.rotation.setValue(0);
				}
				processedCount++;
			} catch (e) {}
		}
		app.endUndoGroup();
		feedbackTxt.text = "Rotação zerada em " + processedCount + " camada(s).";
	};

	// --- EVENTO: Clique no botão "Normalizar Âncora" ---
	normalizeAnchorBtn.onClick = function() {
		app.beginUndoGroup("Zerar Anchor Point e Compensar Posição");
		var layers = getLayers(true);
		if (!layers) { app.endUndoGroup(); return; }
		var processedCount = 0;
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			if (layer.transform) {
				try {
					// Converte a posição do ponto de âncora (que queremos zerar) para as coordenadas da composição.
					var targetPosition = layer.toComp([0, 0, 0]);
					// Zera o ponto de âncora.
					layer.transform.anchorPoint.setValue([0, 0, 0]);
					// Define a posição da camada para o local onde o ponto de âncora estava, mantendo-a no lugar.
					layer.transform.position.setValue(targetPosition);
					processedCount++;
				} catch (e) {}
			}
		}
		feedbackTxt.text = "Âncora de " + processedCount + " camada(s) zerada e compensada.";
		app.endUndoGroup();
	};

	// --- EVENTO: Clique no botão "Centralizar Âncora" ---
	AnchorAlignBtn.onClick = function() {
		app.beginUndoGroup("Centralizar Âncora");
		var layers = getLayers(true);
		if (!layers) { app.endUndoGroup(); return; }
		var comp = app.project.activeItem;
		var processedCount = 0;
		var originalSelection = [];
		for (var i = 0; i < layers.length; i++) { originalSelection.push(layers[i]); }
		
		// O comando nativo só funciona em uma camada por vez.
		deselectAllLayers(comp);
		for (var i = 0; i < originalSelection.length; i++) {
			var layer = originalSelection[i];
			if (layer instanceof AVLayer || layer instanceof ShapeLayer || layer instanceof TextLayer) {
				try {
					layer.selected = true;
					if (runAnchorAlignCommand()) { processedCount++; }
					layer.selected = false;
				} catch (e) {}
			}
		}
		// Restaura a seleção original do usuário.
		for (var i = 0; i < originalSelection.length; i++) { originalSelection[i].selected = true; }
		feedbackTxt.text = "Âncora de " + processedCount + " camada(s) centralizada.";
		app.endUndoGroup();
	};

	// --- EVENTO: Clique no botão "Resetar Transformações" ---
	resetShapeTransformsBtn.onClick = function() {
		app.beginUndoGroup("Resetar Propriedades");
		var layers = getLayers(true);
		if (!layers) { app.endUndoGroup(); return; }
		var processedCount = 0;
		var comp = app.project.activeItem;

		// Função recursiva para resetar transformações dentro de todos os grupos de uma shape layer.
		function resetTransformRecursive(propGroup) {
			for (var i = 1; i <= propGroup.numProperties; i++) {
				var prop = propGroup.property(i);
				var matchName = prop.matchName;
				try {
					if (matchName === "ADBE Vector Group") {
						var transform = prop.property("Transform");
						transform.property("Anchor Point").setValue([0, 0]);
						transform.property("Position").setValue([0, 0]);
						transform.property("Scale").setValue([100, 100]);
						transform.property("Rotation").setValue(0);
						transform.property("Opacity").setValue(100);
						resetTransformRecursive(prop.property("Contents"));
					} else if (matchName === "ADBE Vector Shape - Rect") {
						// Reseta propriedades específicas de formas retangulares.
						prop.property("Size").setValue([100, 100]);
						prop.property("Position").setValue([0, 0]);
						prop.property("Roundness").setValue(0);
					} else if (matchName === "ADBE Vector Shape - Ellipse") {
						// Reseta propriedades específicas de elipses.
						prop.property("Size").setValue([100, 100]);
						prop.property("Position").setValue([0, 0]);
					}
				} catch (e) {}
			}
		}

		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			try {
				// **INÍCIO DA CORREÇÃO**
				// Primeiro, verifica se é uma Shape Layer para resetar o conteúdo interno.
				if (layer.matchName === "ADBE Vector Layer") {
					resetTransformRecursive(layer.property("Contents"));
				}

				// Em seguida, para QUALQUER camada que tenha a propriedade 'transform',
				// incluindo as Shape Layers que acabaram de ter seu conteúdo resetado,
				// reseta a transformação principal da camada.
				if (layer.property("transform")) {
					var transform = layer.transform;
					transform.anchorPoint.setValue([0, 0]);
					transform.position.setValue([comp.width / 2, comp.height / 2]);
					transform.scale.setValue([100, 100]);
					transform.opacity.setValue(100);
					if (transform.property("Rotation")) transform.rotation.setValue(0);
					if (layer.threeDLayer) {
						transform.xRotation.setValue(0);
						transform.yRotation.setValue(0);
						transform.orientation.setValue([0, 0, 0]);
					}
				}
				// **FIM DA CORREÇÃO**

				// Remove todos os Layer Styles.
				if (layer.property("Layer Styles")) {
					var layerStyles = layer.property("Layer Styles");
					while (layerStyles.numProperties > 0) {
						layerStyles.property(1).remove();
					}
				}
				// Remove o stroke de camadas de texto.
				if (layer.property("Source Text")) {
					var textProp = layer.property("Source Text");
					var textDoc = textProp.value;
					textDoc.applyStroke = false;
					textProp.setValue(textDoc);
				}
				processedCount++;
			} catch (e) {}
		}
		feedbackTxt.text = "Propriedades resetadas em " + processedCount + " camada(s).";
		app.endUndoGroup();
	};


	// Se a UI for uma janela flutuante, centraliza e exibe.
	if (pal instanceof Window) {
		pal.center();
		pal.show();
	}
}
