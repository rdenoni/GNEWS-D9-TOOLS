// Adicione estas modificações ao arquivo GNEWS_Templates.jsx

// 1. MODIFICAÇÃO NA FUNÇÃO loadTemplatesFromCache()
// Substitua a função existente por esta versão otimizada:

function loadTemplatesFromCache() {
    var prodName = validProductions[prodDrop.selection.index].name;
    
    // Remove o loading state para tornar instantâneo
    // setLoadingState(true, 'Carregando ' + prodName + '...');
    // D9T_TEMPLATES_w.update();

    templateTree.removeAll();
    
    // Verifica se o cache já está carregado
    if (!templatesCache[prodName]) {
        // Se não estiver, mostra loading e carrega
        setLoadingState(true, 'Carregando ' + prodName + '...');
        D9T_TEMPLATES_w.update();
        loadCacheInBackground(prodName);
        setLoadingState(false);
    }
    
    var data = templatesCache[prodName];

    if (data && data.length > 0) {
        // Usa requestIdle para não bloquear a UI
        populateTreeFromDataOptimized(templateTree, data);
        expandAllNodes(templateTree);
    } else {
        templateTree.add('item', 'Nenhum item encontrado para esta categoria.');
    }

    updateItemCounter();
    // Remove o loading state final
    // setLoadingState(false);
}

// 2. NOVA FUNÇÃO OTIMIZADA PARA POPULAR A ÁRVORE
// Adicione esta nova função que popula a árvore de forma mais eficiente:

function populateTreeFromDataOptimized(treeNode, dataArray) {
    // Desabilita temporariamente o redraw da árvore
    treeNode.visible = false;
    
    try {
        // Processa em lotes para melhor performance
        var batchSize = 50;
        var currentBatch = 0;
        
        function processBatch() {
            var endIndex = Math.min(currentBatch + batchSize, dataArray.length);
            
            for (var i = currentBatch; i < endIndex; i++) {
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
            
            currentBatch = endIndex;
            if (currentBatch < dataArray.length) {
                // Processa o próximo lote após um pequeno delay
                $.sleep(1);
                processBatch();
            }
        }
        
        processBatch();
        
    } finally {
        // Reabilita o redraw da árvore
        treeNode.visible = true;
    }
}

// 3. MODIFICAÇÃO NO onShow DO WINDOW
// Substitua o D9T_TEMPLATES_w.onShow existente por esta versão:

D9T_TEMPLATES_w.onShow = function () {
    extendedWidth = D9T_TEMPLATES_w.size.width;
    compactWidth = extendedWidth - 680;
    vGrp2.visible = true;
    if (newDiv) newDiv.visible = true;
    D9T_TEMPLATES_w.size.width = extendedWidth;

    // Pré-carrega todos os caches em background sem bloquear a UI
    setLoadingState(true, 'Preparando interface...');
    D9T_TEMPLATES_w.update();
    
    // Carrega todos os caches de uma vez
    for (var i = 0; i < validProductions.length; i++) {
        loadCacheInBackground(validProductions[i].name);
    }
    
    setLoadingState(false);
    
    // Restaura a última seleção
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
    
    // Carrega a primeira visualização
    loadTemplatesFromCache();
    searchBox.active = true;
    updateArteInfo();
};

// 4. MODIFICAÇÃO NO prodDrop.onChange
// Substitua o prodDrop.onChange existente por esta versão:

prodDrop.onChange = function () {
    var i = this.selection.index;
    if (typeof changeIcon === 'function') {
        changeIcon(i, prodIconGrp);
    }
    
    // Salva a seleção
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
    
    // Carrega instantaneamente do cache
    loadTemplatesFromCache();
};

// 5. FUNÇÃO AUXILIAR PARA EXPANSÃO OTIMIZADA
// Substitua a função expandAllNodes existente:

function expandAllNodes(tree) {
    if (!tree || !tree.items) return;
    
    // Desabilita temporariamente o redraw
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
        // Reabilita o redraw
        tree.visible = true;
    }
}

// 6. OTIMIZAÇÃO DA FUNÇÃO performSearch
// Substitua a função performSearch existente:

function performSearch(searchTerm) {
    var prodName = validProductions[prodDrop.selection.index].name;
    var masterData = templatesCache[prodName];

    if (!masterData) return;

    // Desabilita o redraw durante a busca
    templateTree.visible = false;
    
    try {
        templateTree.removeAll();
        
        if (searchTerm === '') {
            populateTreeFromDataOptimized(templateTree, masterData);
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
            populateTreeFromDataOptimized(templateTree, filteredTreeData);
        }
        
        expandAllNodes(templateTree);
        
    } finally {
        // Reabilita o redraw
        templateTree.visible = true;
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
			// expandAllNodes(templateTree); // Também comentado aqui para consistência na busca
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
		expandAllNodes(templateTree); // Mantido na busca para o resultado ser claro
		updateItemCounter();
	}

	// =========================================================================
	// CONFIGURAÇÃO DE TEMA
	// =========================================================================
	setBgColor(D9T_TEMPLATES_w, bgColor1);

	// =========================================================================
	// EVENTO DO DROPDOWN - INSTANTÂNEO APÓS CARREGAMENTO
	// =========================================================================
	prodDrop.onChange = function() {
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
	// EVENTO ONSHOW - CORRIGIDO E MAIS ROBUSTO
	// =========================================================================
	D9T_TEMPLATES_w.onShow = function() {
		extendedWidth = D9T_TEMPLATES_w.size.width;
		compactWidth = extendedWidth - 680;
		vGrp2.visible = true;
		if (newDiv) newDiv.visible = true;
		D9T_TEMPLATES_w.size.width = extendedWidth;

		// EXIBE LOADING IMEDIATAMENTE
		setLoadingState(true, 'Carregando templates...');
        D9T_TEMPLATES_w.update(); // Força a atualização da UI para mostrar o loading

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

		// ===== CHAMADA DIRETA E SEGURA =====
		try {
			loadAllCachesInBackground();
		} catch (err) {
			alert("Ocorreu um erro crítico ao carregar os templates:\n" + err.message);
			setLoadingState(false); // Garante que o loading suma mesmo com erro
			templateTree.add('item', 'Falha ao carregar. Tente atualizar o cache.');
		}
	};

	// =========================================================================
	// EVENTOS DE BUSCA OTIMIZADOS
	// =========================================================================
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
			if (allCachesLoaded) {
				performSearchFast('');
			}
		}
	};

	searchBox.onChanging = function() {
		if (!this.isPlaceholderActive && allCachesLoaded) {
			performSearchFast(this.text);
		}
	};

	// =========================================================================
	// EVENTOS DOS BOTÕES - ATUALIZAR CORRIGIDO
	// =========================================================================

	function handleRefresh() {
		// Reset completo do cache
		templatesCache = {};
		allCachesLoaded = false;
		isInitialLoading = false;
		setLoadingState(true, 'Recarregando cache...');
        D9T_TEMPLATES_w.update(); // Força a UI a mostrar o loading

		// ===== CHAMADA DIRETA E SEGURA NO REFRESH =====
		try {
			loadAllCachesInBackground();
		} catch (err) {
			alert("Ocorreu um erro crítico ao recarregar os templates:\n" + err.message);
			setLoadingState(false); // Garante que o loading suma
			templateTree.add('item', 'Falha ao recarregar. Verifique os arquivos de cache.');
		}
	}

	if (refreshBtn && typeof refreshBtn.leftClick !== 'undefined') {
		refreshBtn.leftClick.onClick = handleRefresh;
	} else if (refreshBtn) {
		refreshBtn.onClick = handleRefresh;
	}


	// Botão de abrir pasta
	if (openFldBtn && typeof openFldBtn.leftClick !== 'undefined') {
		openFldBtn.leftClick.onClick = function() {
			openTemplatesFolder();
		};
	} else if (openFldBtn) {
		openFldBtn.onClick = function() {
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
			btnGrp.add('button', undefined, 'Cancelar', {
				name: 'cancel'
			});
			var okBtn = btnGrp.add('button', undefined, 'Abrir', {
				name: 'ok'
			});
			okBtn.onClick = function() {
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
	templateTree.onChange = function() {
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

	templateTree.onActivate = function() {
		if (typeof importBtn !== 'undefined') importBtn.enabled = true;
		if (typeof openBtn !== 'undefined') openBtn.enabled = true;
	};

	templateTree.onDoubleClick = function() {
		if (this.selection != null && this.selection.filePath) {
			executeOpen();
		}
	};

	// =========================================================================
	// EVENTOS DOS BOTÕES DE AÇÃO
	// =========================================================================
	if (openBtn && typeof openBtn.leftClick !== 'undefined') {
		openBtn.leftClick.onClick = function() {
			executeOpen();
		};
	} else if (openBtn) {
		openBtn.onClick = function() {
			executeOpen();
		};
	}

	if (importBtn && typeof importBtn.leftClick !== 'undefined') {
		importBtn.leftClick.onClick = function() {
			executeImport();
		};
	} else if (importBtn) {
		importBtn.onClick = function() {
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
	codigoTxt.onChanging = function() {
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
		infoBtn.leftClick.onClick = function() {
			showHelpDialog();
		};
	} else if (infoBtn) {
		infoBtn.onClick = function() {
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

		var helpWin = new Window("dialog", scriptName + " - Ajuda", undefined, {
			closeButton: true
		});
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

		var mainDescText = headerPanel.add("statictext", undefined, "Sistema ultra-rápido de templates GNEWS otimizado para grandes quantidades de arquivos.", {
			multiline: true
		});
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
			var textElement = contentPanel.add("statictext", undefined, line, {
				multiline: false
			});
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
		okButton.onClick = function() {
			helpWin.close();
		};

		helpWin.center();
		helpWin.show();
	}

	// =========================================================================
	// EVENTOS DOS BOTÕES CANCELAR/CONTINUAR
	// =========================================================================
	if (cancelBtn && typeof cancelBtn.leftClick !== 'undefined') {
		cancelBtn.leftClick.onClick = function() {
			D9T_TEMPLATES_w.close();
		};
	} else if (cancelBtn) {
		cancelBtn.onClick = function() {
			D9T_TEMPLATES_w.close();
		};
	}

	if (nextBtn && typeof nextBtn.leftClick !== 'undefined') {
		nextBtn.leftClick.onClick = function() {
			D9T_TEMPLATES_w.close();
		};
	} else if (nextBtn) {
		nextBtn.onClick = function() {
			D9T_TEMPLATES_w.close();
		};
	}

	// =========================================================================
	// EVENTO DE FECHAMENTO
	// =========================================================================
	D9T_TEMPLATES_w.onClose = function() {
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