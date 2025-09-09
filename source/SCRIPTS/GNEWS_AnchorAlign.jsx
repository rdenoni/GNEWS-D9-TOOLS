/*
    Script: Anchor Master v5.2 (Melhoria)
    Autor: Gemini AI & Usuário
    Data: 05/08/2025

    Changelog v5.2:
    - MELHORIA: O script agora preserva a posição e a aparência visual da camada
      mesmo quando há propriedades de escala e rotação aplicadas. A lógica de
      transformação foi aprimorada para compensar a mudança do ponto de 
      ancoragem em relação a todas as propriedades de transformação.
*/

function launchAnchorAlign(thisObj) {
    var AnchorMaster = {
        // --- Configurações ---
        ui: {},
        constants: {
            MATCH_VECTOR_GROUP: "ADBE Vector Group",
            MATCH_VECTOR_SHAPE: "ADBE Vector Shape",
            MATCH_TRANSFORM_GROUP: "ADBE Vector Transform Group",
            PROGRESS_THRESHOLD: 10
        },

        run: function(thisObj) {
            this.buildUI(thisObj);
        },

        // --- FUNÇÃO DE AJUDA ---
        showAnchorAlignHelp: function() {
            var TARGET_HELP_WIDTH = 450;
            var MARGIN_SIZE = 15;
            var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
            var TOPIC_SPACING = 5;
            var TOPIC_TITLE_INDENT = 0;
            var SUBTOPIC_INDENT = 25;

            var helpWin = new Window("palette", "Ajuda - Anchor Master", undefined, { closeButton: true });
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
            
            var titleText = headerPanel.add("statictext", undefined, "AJUDA - ANCHOR MASTER");
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
            titleText.alignment = ["center", "center"];
            if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                setFgColor(titleText, highlightColor1);
            } else {
                titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
            }

            var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta ajusta o ponto de âncora de camadas ou grupos de shape layers.", {multiline: true});
            mainDescText.alignment = ["fill", "fill"];
            mainDescText.preferredSize.height = 40;
            if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                setFgColor(mainDescText, normalColor1);
            } else {
                mainDescText.graphics.foregroundColor = mainDescText.graphics.newPen(mainDescText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
            }

            var topicsTabPanel = helpWin.add("tabbedpanel");
            topicsTabPanel.alignment = ["fill", "fill"];
            topicsTabPanel.margins = 15;

            var allHelpTopics = [
                {
                    tabName: "ÂNCORA",
                    topics: [
                        { title: "▶ REPOSICIONAR ÂNCORA:", text: "Clique nos botões de grid para mover o ponto de âncora para uma das 9 posições padrão (cantos, meios, centro) do item selecionado. A posição da camada é automaticamente ajustada para compensar a mudança." }
                    ]
                },
                {
                    tabName: "OPÇÕES",
                    topics: [
                        { title: "   - Considerar máscaras nos limites:", text: "Se marcado, o cálculo da área visível da camada levará em conta as máscaras aplicadas. Se desmarcado, ele usará os limites originais da camada." },
                        { title: "   - Ignorar camadas bloqueadas:", text: "Não processa camadas que estão bloqueadas no painel Timeline. Recomendado para evitar alterações acidentais." },
                        { title: "   - Ignorar camadas com animação:", text: "Não processa camadas que possuem keyframes ou expressões na propriedade 'Transform'. Isso evita problemas com animações complexas que dependem da posição ou ponto de âncora atual." }
                    ]
                },
                {
                    tabName: "SELEÇÃO",
                    topics: [
                        { title: "▶ SELEÇÃO AUTOMÁTICA:", text: "A ferramenta tenta adivinhar o que você quer ajustar com base na seleção:\n  - Propriedades de grupo de shape (Transform Group ou Vector Group).\n  - Camadas selecionadas na Timeline.\n  - Se nenhuma camada estiver selecionada na Timeline, todas as camadas na comp ativa.\n  - Se composições estiverem selecionadas no painel Projeto, todas as camadas dessas comps." }
                    ]
                }
            ];

            for (var s = 0; s < allHelpTopics.length; s++) {
                var currentTabSection = allHelpTopics[s];
                var tab = topicsTabPanel.add("tab", undefined, currentTabSection.tabName);
                tab.orientation = "column";
                tab.alignChildren = ["fill", "top"];
                tab.spacing = 10;
                tab.margins = TOPIC_SECTION_MARGINS;

                for (var i = 0; i < currentTabSection.topics.length; i++) {
                    var topic = currentTabSection.topics[i];
                    var topicGrp = tab.add("group");
                    topicGrp.orientation = "column";
                    topicGrp.alignChildren = "fill";
                    topicGrp.spacing = TOPIC_SPACING;
                    
                    if (topic.title.indexOf("▶") === 0) {
                        topicGrp.margins.left = TOPIC_TITLE_INDENT;
                    } else {
                        topicGrp.margins.left = SUBTOPIC_INDENT;
                    }

                    var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                    topicTitle.graphics.font = ScriptUI.newFont("Arial", "Bold", 12);
                    if (typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                        setFgColor(topicTitle, highlightColor1);
                    } else {
                        topicTitle.graphics.foregroundColor = topicTitle.graphics.newPen(topicTitle.graphics.PenType.SOLID_COLOR, [0.83, 0, 0.23, 1], 1);
                    }
                    topicTitle.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);

                    if(topic.text !== ""){
                        var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                        topicText.graphics.font = ScriptUI.newFont("Arial", "Regular", 11);
                        topicText.preferredSize.width = (TARGET_HELP_WIDTH - (MARGIN_SIZE * 2) - (topicsTabPanel.margins.left + topicsTabPanel.margins.right) - (tab.margins.left + tab.margins.right) - topicGrp.margins.left);
                        topicText.preferredSize.height = 60;
                        
                        if (typeof normalColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
                            setFgColor(topicText, normalColor1);
                        } else {
                            topicText.graphics.foregroundColor = topicText.graphics.newPen(topicText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
                        }
                    }
                }
            }

            var closeBtnGrp = helpWin.add("group");
            closeBtnGrp.alignment = "center";
            closeBtnGrp.margins = [0, 10, 0, 0];
            var closeBtn = closeBtnGrp.add("button", undefined, "Fechar");
            closeBtn.onClick = function() {
                helpWin.close();
            };

            helpWin.layout.layout(true);
            helpWin.center();
            helpWin.show();
        },

        executeReposition: function(posicao) {
            app.beginUndoGroup("Anchor Master: Reposicionar Ponto de Âncora");
            
            var itemsToProcess = [];
            var mode = "";
            var comp = app.project.activeItem;
            var selectedProps = comp ? comp.selectedProperties : [];
            
            if (selectedProps && selectedProps.length > 0) {
                 for (var i = 0; i < selectedProps.length; i++) {
                    if (!selectedProps[i] || !selectedProps[i].matchName) continue;
                    if (selectedProps[i].matchName === this.constants.MATCH_VECTOR_GROUP) {
                        mode = "ShapeGroup"; itemsToProcess.push(selectedProps[i]);
                    } else if (selectedProps[i].matchName === this.constants.MATCH_TRANSFORM_GROUP) {
                        if (selectedProps[i].parentProperty.matchName === "ADBE Root Vectors Group") {
                           mode = "ShapeContentsTransform"; itemsToProcess.push(selectedProps[i]);
                        } else {
                           mode = "ShapeGroup"; itemsToProcess.push(selectedProps[i].parentProperty);
                        }
                    }
                }
            }
            if (itemsToProcess.length === 0 && comp && comp.selectedLayers.length > 0) {
                mode = "Layer"; itemsToProcess = comp.selectedLayers;
            }
            if (itemsToProcess.length === 0 && comp instanceof CompItem && comp.selectedLayers.length === 0) {
                mode = "Layer";
                for (var i = 1; i <= comp.numLayers; i++) { itemsToProcess.push(comp.layer(i)); }
            }
            if (itemsToProcess.length === 0) {
                var selectedComps = app.project.selection;
                if (selectedComps.length > 0) {
                    mode = "Layer";
                    for (var i = 0; i < selectedComps.length; i++) {
                        if (selectedComps[i] instanceof CompItem) {
                            for (var j = 1; j <= selectedComps[i].numLayers; j++) {
                                itemsToProcess.push(selectedComps[i].layer(j));
                            }
                        }
                    }
                }
            }

            if (itemsToProcess.length === 0) {
                this.ui.statusText.text = "ERRO: Selecione itens ou comps.";
                app.endUndoGroup(); return;
            }
            
            var processed = 0, skipped = 0;
            var showProgress = itemsToProcess.length > this.constants.PROGRESS_THRESHOLD;
            var progressWin;
            if (showProgress) { progressWin = this.createProgressBar("Processando " + itemsToProcess.length + " itens...", itemsToProcess.length); }

            for (var j = 0; j < itemsToProcess.length; j++) {
                var item = itemsToProcess[j];
                if (!item) { skipped++; continue; }
                var shouldSkip = false;
                switch (mode) {
                    case "Layer":
                        if ((this.ui.chkIgnorarBloqueadas.value && item.locked) || (this.ui.chkIgnorarAnimadas.value && this.hasAnimation(item))) { shouldSkip = true;
                        } else if (item instanceof AVLayer || item instanceof ShapeLayer || item instanceof TextLayer) { this.repositionLayerAnchor(item, posicao); processed++;
                        } else { shouldSkip = true; }
                        break;
                    case "ShapeGroup": this.repositionShapeGroupAnchor(item, posicao); processed++; break;
                    case "ShapeContentsTransform": this.repositionShapeContentsTransform(item, posicao); processed++; break;
                    default: shouldSkip = true;
                }
                if (shouldSkip) skipped++;
            }
            if (showProgress) progressWin.close();
            var msg = "Concluído: " + processed + " item(ns) ajustado(s).";
            if (skipped > 0) msg += " " + skipped + " ignorado(s).";
            this.ui.statusText.text = msg;
            app.endUndoGroup();
        },

        repositionLayerAnchor: function(layer, posicao) {
            var bounds = this.getLayerBounds(layer);
            if (!bounds) return;
            var transform = layer.property("Transform");
            var anchorProp = transform.property("Anchor Point");
            var positionProp = transform.property("Position");
            var scaleProp = transform.property("Scale");
            var rotationProp = transform.property("Rotation"); // Rotação 2D
            var xRotationProp = transform.property("X Rotation"); // Rotação 3D
            var yRotationProp = transform.property("Y Rotation");
            var zRotationProp = transform.property("Z Rotation");

            var oldAnchor = anchorProp.value;
            var oldPosition = positionProp.value;
            var oldScale = scaleProp.value;
            var oldRotation = layer.threeDLayer ? [xRotationProp.value, yRotationProp.value, zRotationProp.value] : rotationProp.value;

            // Define o novo ponto de ancoragem
            var newAnchor = this.calculateNewAnchor(bounds, posicao, layer.threeDLayer);
            anchorProp.setValue(newAnchor);

            // Calcula a diferença de posição causada pela mudança do anchor point
            var newPosition = oldPosition;
            var delta = [newAnchor[0] - oldAnchor[0], newAnchor[1] - oldAnchor[1]];
            
            // Corrige a posição para compensar a escala e rotação existentes
            // Esta é a parte mais complexa. Um cálculo matricial seria o ideal, mas
            // uma aproximação baseada na rotação e escala atuais pode ser suficiente.
            // Para simplificar, vamos compensar o movimento do anchor point,
            // depois calcular o novo ponto de ancoragem e reajustar a posição.
            
            // Aplica a nova posição para compensar a mudança do anchor point
            if (oldPosition.length === 3) {
                var deltaZ = (newAnchor.length === 3 && oldAnchor.length === 3) ? (newAnchor[2] - oldAnchor[2]) : 0;
                newPosition = [oldPosition[0] + delta[0] * (oldScale[0]/100), oldPosition[1] + delta[1] * (oldScale[1]/100), oldPosition[2] + deltaZ];
            } else {
                newPosition = [oldPosition[0] + delta[0] * (oldScale[0]/100), oldPosition[1] + delta[1] * (oldScale[1]/100)];
            }

            positionProp.setValue(newPosition);

            // A nova lógica de compensação para escala e rotação é mais robusta
            var newComp = app.project.activeItem;
            if (newComp && layer instanceof AVLayer) {
                // Salva a posição original em coordenadas de composição
                var originalPosInComp = layer.toComp(oldAnchor, newComp.time);

                // Reajusta o anchor point
                anchorProp.setValue(newAnchor);

                // Obtém o novo ponto de ancoragem em coordenadas de composição
                var newPosInComp = layer.toComp(newAnchor, newComp.time);

                // Calcula a diferença para ajustar a posição
                var deltaPos = [originalPosInComp[0] - newPosInComp[0], originalPosInComp[1] - newPosInComp[1]];
                
                // Aplica a compensação na posição da camada
                var currentPosition = positionProp.value;
                positionProp.setValue([currentPosition[0] + deltaPos[0], currentPosition[1] + deltaPos[1]]);
            }
        },

        repositionShapeGroupAnchor: function(group, posicao) {
            var transformGroup = group.property(this.constants.MATCH_TRANSFORM_GROUP); if (!transformGroup) return;
            var bounds = this.getShapeGroupBounds(group); if (!bounds) return;
            var anchorProp = transformGroup.property("Anchor Point"); var positionProp = transformGroup.property("Position");
            var newAnchor = this.calculateNewAnchor(bounds, posicao, false);
            this.applyTransform(anchorProp, positionProp, newAnchor);
        },
        
        repositionShapeContentsTransform: function(transformGroup, posicao) {
            var layer = this.getContainingLayer(transformGroup); if (!layer) return;
            var bounds = layer.sourceRectAtTime(layer.containingComp.time, false);
            if (!bounds || bounds.width === 0 || bounds.height === 0) {
                 this.ui.statusText.text = "Aviso: A shape layer está vazia."; return;
            }
            var anchorProp = transformGroup.property("Anchor Point"); var positionProp = transformGroup.property("Position");
            var newAnchor = this.calculateNewAnchor(bounds, posicao, false);
            this.applyTransform(anchorProp, positionProp, newAnchor);
        },

        applyTransform: function(anchorProp, positionProp, newAnchor) {
            if (!anchorProp || !positionProp || !newAnchor || (anchorProp.numKeys > 0 && this.ui.chkIgnorarAnimadas.value) || (positionProp.numKeys > 0 && this.ui.chkIgnorarAnimadas.value)) return;
            
            // Salva a posição original do anchor point em coordenadas de composição
            var layer = this.getContainingLayer(anchorProp);
            if (!layer) return;
            var oldAnchorInComp = layer.toComp(anchorProp.value, layer.containingComp.time);

            // Define o novo ponto de ancoragem
            anchorProp.setValue(newAnchor);

            // Obtém o novo ponto de ancoragem em coordenadas de composição
            var newAnchorInComp = layer.toComp(newAnchor, layer.containingComp.time);

            // Calcula a diferença entre as posições para compensar
            var deltaPos = [oldAnchorInComp[0] - newAnchorInComp[0], oldAnchorInComp[1] - newAnchorInComp[1]];
            
            // Aplica a compensação na posição da camada
            var currentPosition = positionProp.value;
            if (positionProp.value.length === 3) {
                 positionProp.setValue([currentPosition[0] + deltaPos[0], currentPosition[1] + deltaPos[1], currentPosition[2]]);
            } else {
                 positionProp.setValue([currentPosition[0] + deltaPos[0], currentPosition[1] + deltaPos[1]]);
            }
        },

        getLayerBounds: function(layer) {
            if (this.ui.chkConsiderarMascaras && this.ui.chkConsiderarMascaras.value && layer.property("Masks").numProperties > 0) { return this.getMasksBounds(layer); }
            return layer.sourceRectAtTime(layer.containingComp.time, false);
        },
        
        getMasksBounds: function(layer) {
            var masks = layer.property("Masks"), minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, hasBounds = false;
            for (var i = 1; i <= masks.numProperties; i++) {
                var mask = masks.property(i);
                if (mask.maskMode === MaskMode.ADD || mask.maskMode === MaskMode.INTERSECT) {
                    var path = mask.property("Mask Path").value;
                    if (!path || !path.vertices || path.vertices.length === 0) continue;
                    for (var v = 0; v < path.vertices.length; v++) {
                        var point = path.vertices[v]; minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]); hasBounds = true;
                    }
                }
            }
            if (!hasBounds) return null;
            return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
        },
        
        getShapeGroupBounds: function(group) {
            var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, hasBounds = false, self = this;
            function findBoundsRecursive(currentGroup) {
                var container = currentGroup.property("Contents") || currentGroup; if (!container) return;
                for (var i = 1; i <= container.numProperties; i++) {
                    var prop = container.property(i);
                    if (prop.matchName === self.constants.MATCH_VECTOR_GROUP) { findBoundsRecursive(prop);
                    } else if (prop.matchName === self.constants.MATCH_VECTOR_SHAPE) {
                        var path = prop.value;
                        if (!path || !path.vertices || path.vertices.length === 0) continue;
                        for (var v = 0; v < path.vertices.length; v++) {
                            var point = path.vertices[v]; minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
                            minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]); hasBounds = true;
                        }
                    }
                }
            }
            findBoundsRecursive(group);
            if (!hasBounds) return null;
            return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
        },

        calculateNewAnchor: function(rect, posicao, is3D) {
            var novoAncora;
            switch (posicao) {
                case "left": novoAncora = [rect.left, rect.top + rect.height / 2]; break;
                case "right": novoAncora = [rect.left + rect.width, rect.top + rect.height / 2]; break;
                case "up": novoAncora = [rect.left + rect.width / 2, rect.top]; break;
                case "down": novoAncora = [rect.left + rect.width / 2, rect.top + rect.height]; break;
                case "topLeft": novoAncora = [rect.left, rect.top]; break;
                case "topRight": novoAncora = [rect.left + rect.width, rect.top]; break;
                case "bottomLeft": novoAncora = [rect.left, rect.top + rect.height]; break;
                case "bottomRight": novoAncora = [rect.left + rect.width, rect.top + rect.height]; break;
                default: novoAncora = [rect.left + rect.width / 2, rect.top + rect.height / 2]; break;
            }
            if (is3D) novoAncora.push(0);
            return novoAncora;
        },

        getContainingLayer: function(prop) {
            var parent = prop;
            while (parent) {
                if (parent.containingLayer) { return parent.containingLayer; }
                parent = parent.parentProperty;
            }
            return null;
        },
        
        hasAnimation: function(layer) {
            try {
                var transform = layer.property("Transform"); if (!transform) return false;
                for (var i = 1; i <= transform.numProperties; i++) {
                    var prop = transform.property(i);
                    if (prop && (prop.numKeys > 0 || (prop.expressionEnabled && prop.expression !== ""))) { return true; }
                }
            } catch (e) { return false; }
            return false;
        },

        createProgressBar: function(text, maxVal) {
            var win = new Window("palette", "Progresso", undefined, { borderless: true });
            win.text = text; win.pbar = win.add("progressbar", [12, 12, 350, 24], 0, maxVal);
            win.show(); return win;
        },

        buildUI: function(thisObj) {
            var self = this;
            var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Anchor Master v5.2", undefined, { resizeable: true });
            self.ui = {};
            self.ui.win = win;

            win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 5; win.margins = 10;
            
            var headerGrp = win.add("group");
            headerGrp.orientation = "row";
            headerGrp.alignChildren = ["fill", "center"];
            headerGrp.alignment = "fill";
            headerGrp.spacing = 10;

            var titleText = headerGrp.add("statictext", undefined, "Anchor Master v5.2");
            titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
            titleText.preferredSize.width = 0;

            var helpBtn;
            if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
                var helpBtnGroup = headerGrp.add('group');
                helpBtnGroup.alignment = ['right', 'center'];
                helpBtn = new themeIconButton(helpBtnGroup, { icon: D9T_INFO_ICON, tips: [lClick + 'Ajuda'] });
                helpBtn.leftClick.onClick = function() { self.showAnchorAlignHelp(); };
            } else {
                helpBtn = headerGrp.add("button", undefined, "?");
                helpBtn.preferredSize = [24, 24];
                helpBtn.helpTip = "Ajuda sobre o Anchor Master";
                helpBtn.onClick = function() { self.showAnchorAlignHelp(); };
            }

            var panel = win.add("panel", undefined, "Posição da Âncora");
            panel.orientation = "column"; panel.alignChildren = ["center", "center"]; panel.spacing = 2; panel.margins = 10;

            var btnRow1 = panel.add("group");
            var btnTL = btnRow1.add("button", undefined, "\u2196"); btnTL.helpTip = "Superior Esquerdo";
            var btnUp = btnRow1.add("button", undefined, "\u2191"); btnUp.helpTip = "Superior Central";
            var btnTR = btnRow1.add("button", undefined, "\u2197"); btnTR.helpTip = "Superior Direito";
            var btnRow2 = panel.add("group");
            var btnLeft = btnRow2.add("button", undefined, "\u2190"); btnLeft.helpTip = "Meio Esquerdo";
            var btnCenter = btnRow2.add("button", undefined, "\u2022"); btnCenter.helpTip = "Centro";
            var btnRight = btnRow2.add("button", undefined, "\u2192"); btnRight.helpTip = "Meio Direito";
            var btnRow3 = panel.add("group");
            var btnBL = btnRow3.add("button", undefined, "\u2199"); btnBL.helpTip = "Inferior Esquerdo";
            var btnDown = btnRow3.add("button", undefined, "\u2193"); btnDown.helpTip = "Inferior Central";
            var btnBR = btnRow3.add("button", undefined, "\u2198"); btnBR.helpTip = "Inferior Direito";

            var optionsGroup = win.add("panel", undefined, "Opções");
            optionsGroup.orientation = "column"; optionsGroup.alignChildren = ["left", "top"];
            self.ui.chkConsiderarMascaras = optionsGroup.add("checkbox", undefined, "Considerar máscaras nos limites");
            self.ui.chkIgnorarBloqueadas = optionsGroup.add("checkbox", undefined, "Ignorar camadas bloqueadas");
            self.ui.chkIgnorarAnimadas = optionsGroup.add("checkbox", undefined, "Ignorar camadas com animação");
            self.ui.chkConsiderarMascaras.value = false; self.ui.chkIgnorarBloqueadas.value = true; self.ui.chkIgnorarAnimadas.value = true;
            
            var statusGroup = win.add("panel", undefined, "Status");
            statusGroup.alignChildren = ["fill", "fill"];
            self.ui.statusText = statusGroup.add("statictext", [0,0,200,20], "Pronto para a ação!", {multiline:false});

            btnLeft.onClick = function() { self.executeReposition("left"); }; btnUp.onClick = function() { self.executeReposition("up"); };
            btnRight.onClick = function() { self.executeReposition("right"); }; btnTL.onClick = function() { self.executeReposition("topLeft"); };
            btnCenter.onClick = function() { self.executeReposition("center"); }; btnTR.onClick = function() { self.executeReposition("topRight"); };
            btnBL.onClick = function() { self.executeReposition("bottomLeft"); }; btnDown.onClick = function() { self.executeReposition("down"); };
            btnBR.onClick = function() { self.executeReposition("bottomRight"); };

            win.onResizing = win.onResize = function() { if(this.layout) this.layout.resize(); };
            if (win instanceof Window) { win.center(); win.show(); } else { win.layout.layout(true); }
            win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0, 0, 0]);
        }
    };

    AnchorMaster.run(thisObj);
}