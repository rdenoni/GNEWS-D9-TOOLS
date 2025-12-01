/**********************************************************************************
 *
 * GNEWS SEARCHLAYERS
 * Autor: Gemini (Google AI) & Usu rio
 * Vers o: 2.8 (Fix: Erro de Propriedade Read-Only)
 *
 **********************************************************************************/
$.encoding = "UTF-8";

function findDialog() {
    // =================================================================================
    // --- VARI VEIS DE CONFIGURA  O R PIDA ---
    // =================================================================================
    var SCRIPT_NAME = "GNEWS SEARCHLAYERS";
    var SCRIPT_SUBTITLE = "Localiza e navega entre camadas de texto.";
    var SCRIPT_VERSION = "2.8";
    var SCRIPT_WINDOW_TITLE = SCRIPT_NAME + " " + SCRIPT_VERSION;

    // Configura  es de Tamanho da Interface
    var LARGURA_JANELA = 320;
    var ALTURA_INPUT_BUSCA = 32;
    var LARGURA_INPUT_BUSCA = 240;
    var TAMANHO_ICONE_BUSCA = 32;
    var TAMANHO_BOTAO_AJUDA = 24;
    var ALTURA_MAX_RESULTADOS = 320; 
    var ALTURA_ITEM_RESULTADO = 21;

    var iconComp = (typeof D9T_COMP_ICON !== 'undefined') ? D9T_COMP_ICON : ((typeof compTogIcon !== 'undefined' && compTogIcon.light) ? compTogIcon.light : null);
    var iconTxt  = (typeof D9T_TEXT_ICON !== 'undefined') ? D9T_TEXT_ICON : ((typeof solTogIcon !== 'undefined' && solTogIcon.light) ? solTogIcon.light : null);
    if (typeof setPrefValue !== 'function') { setPrefValue = function () { return null; }; }
    function ensureHelpLib() {
        if (typeof showSearchLayersHelp === 'function') { return true; }
        var basePaths = [];
        try { if (typeof scriptMainPath !== 'undefined' && scriptMainPath) { basePaths.push(scriptMainPath); } } catch(_) {}
        try { basePaths.push(new File($.fileName).parent.parent.fsName + '/'); } catch(_) {}
        basePaths.push(Folder.userData.fullName + '/GND9TOOLS script/');
        for (var i = 0; i < basePaths.length; i++) {
            var f = new File(basePaths[i] + 'source/libraries/HELP lib.js');
            if (f.exists) {
                try { $.evalFile(f); } catch(e) {}
                if (typeof showSearchLayersHelp === 'function') { return true; }
            }
        }
        return false;
    }

    // Resolve caminho do HELP lib para fallback (ao abrir módulo isolado)
    function resolveHelpPath() {
        var candidates = [];
        try {
            if (typeof scriptMainPath !== 'undefined' && scriptMainPath) {
                candidates.push(new File(scriptMainPath + 'source/libraries/HELP lib.js'));
            }
        } catch (_) {}
        try {
            var baseLocal = new File($.fileName).parent.parent.fsName + '/';
            candidates.push(new File(baseLocal + 'source/libraries/HELP lib.js'));
        } catch (_) {}
        try {
            candidates.push(new File(Folder.userData.fullName + '/GND9TOOLS script/source/libraries/HELP lib.js'));
        } catch (_) {}
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i] && candidates[i].exists) { return candidates[i]; }
        }
        return null;
    }

    // Garantia de carregamento do HELP lib ao abrir a ajuda
    function ensureHelpLib() {
        if (typeof showSearchLayersHelp === 'function') { return true; }
        var base = (typeof scriptMainPath !== 'undefined' && scriptMainPath) ? scriptMainPath : Folder.userData.fullName + '/GND9TOOLS script/';
        var helpFile = new File(base + 'source/libraries/HELP lib.js');
        if (!helpFile.exists) { return false; }
        try {
            $.evalFile(helpFile);
        } catch (e) {
            return false;
        }
        return (typeof showSearchLayersHelp === 'function');
    }

// =================================================================================
    // --- FUN  ES AUXILIARES DE TEMA (FALLBACK) ---
    // =================================================================================
    function hexToRgb(hex) {
        if (hex == undefined) return [0.2, 0.2, 0.2];
        hex = hex.replace('#', '');
        if (hex.length < 6) return [0.2, 0.2, 0.2];
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        return [r / 255, g / 255, b / 255];
    }

    function setBgColor(element, hexColor) {
        try {
            var color = (typeof bgColor1 !== 'undefined') ? hexToRgb(bgColor1) : hexToRgb(hexColor);
            element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color);
        } catch (e) {}
    }

    function setFgColor(element, hexColor) {
        try {
            var srcColor = hexColor || normalColor1;
            var color = (typeof srcColor !== 'undefined' && srcColor) ? hexToRgb(srcColor) : [0.9, 0.9, 0.9];
            element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
        } catch (e) {}
    }

    // =================================================================================
    // --- FUN  ES DE L GICA DE BUSCA ---
    // =================================================================================

    function removeAccents(str) {
        if (typeof str !== 'string') return str;
        var accents = "                                                      ";
        var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeCcIIIIiiiiUUUUuuuuyNn";
        str = str.split("");
        for (var i = 0; i < str.length; i++) {
            var x = accents.indexOf(str[i]);
            if (x != -1) {
                str[i] = accentsOut[x];
            }
        }
        return str.join("");
    }

    function getComps() {
        var comps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof CompItem) {
                comps.push(app.project.item(i));
            }
        }
        return comps;
    }

    function buildTxtSearchTree(treeObj, optObj, compsArray, progressBar, windowObj) {
        var sKey = optObj.sKey;
        if (!optObj.matchCase) sKey = sKey.toLowerCase();
        if (!optObj.matchAccent) sKey = removeAccents(sKey);

        var totalComps = compsArray.length;
        
        for (var c = 0; c < totalComps; c++) {
            var comp = compsArray[c];
            
            // Atualiza a barra de progresso a cada 5 comps para n o travar a UI
            if (progressBar && (c % 5 === 0)) {
                progressBar.value = (c / totalComps) * 100;
                if (windowObj) windowObj.update(); 
            }

            var layersFound = [];
            for (var l = 1; l <= comp.numLayers; l++) {
                try {
                    var layer = comp.layer(l);
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    if (optObj.vis) {
                        if (!layer.enabled) continue; 
                    }

                    var prop = layer.property("Source Text");
                    if (!prop) continue; 
                    
                    var sourceText = prop.value.toString();
                    var checkText = sourceText;

                    if (!optObj.matchCase) checkText = checkText.toLowerCase();
                    if (!optObj.matchAccent) checkText = removeAccents(checkText);

                    var match = (checkText.indexOf(sKey) !== -1);
                    if (optObj.invert) match = !match;

                    if (match) {
                        var keyTime = comp.time; 
                        if (prop.numKeys > 0) {
                            keyTime = prop.keyTime(1);
                        }
                        
                        layersFound.push({
                            layer: layer,
                            text: sourceText,
                            time: keyTime
                        });
                    }
                } catch (layerErr) {
                    continue;
                }
            }

            if (layersFound.length > 0) {
                var compNode = treeObj.add("node", comp.name);
                compNode.comp = comp;
                // FIX: Usar customType em vez de type (que   read-only)
                compNode.customType = "comp"; 
                
                if (iconComp) { compNode.image = iconComp; } else { compNode.text = '🗂 ' + compNode.text; }
                
                for (var f = 0; f < layersFound.length; f++) {
                    var lf = layersFound[f];
                    var displayText = lf.text.length > 50 ? lf.text.substring(0, 50) + "..." : lf.text;
                    var itemNode = compNode.add("item", lf.layer.name + ": " + displayText);
                    itemNode.comp = comp;
                    itemNode.txtLayer = lf.layer;
                    itemNode.refTime = lf.time;
                    // FIX: Usar customType em vez de type
                    itemNode.customType = "item"; 
                    
                    if (iconTxt) { itemNode.image = iconTxt; } else { itemNode.text = '🔤 ' + itemNode.text; }
                }
            }
        }
        if (progressBar) progressBar.value = 100;
    }

    function expandNodes(tree) {
        var totalItems = 0;
        for (var i = 0; i < tree.items.length; i++) {
            tree.items[i].expanded = true;
            totalItems += tree.items[i].items.length + 1; 
        }
        return totalItems;
    }

    // =================================================================================
    // --- CONSTRU  O DA INTERFACE GR FICA (UI) ---
    // =================================================================================

    var findW = new Window('palette', SCRIPT_WINDOW_TITLE);
    findW.spacing = 4;
    findW.margins = 8;
    findW.preferredSize.width = LARGURA_JANELA;
    setBgColor(findW, '#282828');

    // --- CABE ALHO ---
    var headerGrp = findW.add("group");
    headerGrp.orientation = "row";
    headerGrp.alignChildren = ["fill", "center"];
    headerGrp.alignment = "fill";
    headerGrp.spacing = 10;
    headerGrp.margins = [8, 8, 8, 0];

    var titleText = headerGrp.add("statictext", undefined, SCRIPT_SUBTITLE);
    try { titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 14); } catch(e){}
    // Força cor de destaque se highlightColor1 não vier do tema
    setFgColor(titleText, (typeof highlightColor1 !== 'undefined' && highlightColor1) ? highlightColor1 : '#d4003c');

    // --- BOT O DE AJUDA ---
    var helpBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_INFO_ICON !== 'undefined' && typeof lClick !== 'undefined') {
        var helpBtnGroup = headerGrp.add('group');
        helpBtnGroup.alignment = ['right', 'center'];
        helpBtn = new themeIconButton(helpBtnGroup, {
            icon: D9T_INFO_ICON,
            tips: [lClick + 'Ajuda']
        });
        helpBtn.leftClick.onClick = function() {
            if (!ensureHelpLib()) {
                alert("A biblioteca de ajuda (HELP lib.js) não foi encontrada.\nAbra o painel pelo GND9TOOLS.jsx para garantir que todas as libs sejam carregadas.");
                return;
            }
            showSearchLayersHelp();
        };
    } else {
        helpBtn = headerGrp.add("button", undefined, "?");
        helpBtn.preferredSize = [TAMANHO_BOTAO_AJUDA, TAMANHO_BOTAO_AJUDA];
        helpBtn.onClick = function() {
            if (!ensureHelpLib()) {
                alert("A biblioteca de ajuda (HELP lib.js) não foi encontrada.\nAbra o painel pelo GND9TOOLS.jsx para garantir que todas as libs sejam carregadas.");
                return;
            }
            showSearchLayersHelp();
        };
    }

    // --- GRUPO PRINCIPAL DE BUSCA ---
    var searchMainGrp = findW.add('group');
    searchMainGrp.orientation = 'column';
    searchMainGrp.alignChildren = ['center', 'top'];

    var inputGrp = searchMainGrp.add('group');
    inputGrp.spacing = 8;
    inputGrp.margins = 8;

    var findEdTxt = inputGrp.add('edittext', [0, 0, LARGURA_INPUT_BUSCA, ALTURA_INPUT_BUSCA]);

    var findBtn;
    if (typeof themeIconButton !== 'undefined' && typeof D9T_LENS_ICON !== 'undefined') {
        findBtn = new themeIconButton(inputGrp, {
            icon: D9T_LENS_ICON,
            tips: [lClick + 'Buscar']
        });
        try { findBtn.leftClick.parent.preferredSize = [TAMANHO_ICONE_BUSCA, TAMANHO_ICONE_BUSCA]; } catch (e) {}
    } else {
        findBtn = { leftClick: inputGrp.add("button", undefined, "Buscar") };
    }

    // --- OP  ES DE FILTRO ---
    var optMainGrp = searchMainGrp.add('group');
    optMainGrp.spacing = 30;

    function createOption(parent, label, tip, iconRef) {
        var g = parent.add('group');
        g.alignChildren = ['center', 'top'];
        g.spacing = 2;
        var chk = g.add('checkbox');
        chk.value = false;
        var txt;
        if (iconRef) {
            txt = g.add('image', undefined, iconRef);
            txt.helpTip = tip;
        } else {
            txt = g.add('statictext', undefined, label);
            setFgColor(txt, (typeof normalColor1 !== 'undefined') ? normalColor1 : '#cccccc');
            txt.helpTip = tip;
        }
        chk.helpTip = tip;
        return chk;
    }

    var optCkb5 = createOption(optMainGrp, '👁', 'Apenas layers visíveis', (typeof eyeOpenLabelIcon !== 'undefined') ? eyeOpenLabelIcon : null);
    var optCkb1 = createOption(optMainGrp, 'Tt', 'Case sensitive (maiúsculas/minúsculas)');
    var optCkb2 = createOption(optMainGrp, 'Ã Ãª', 'Considerar acentuação');
    var optCkb4 = createOption(optMainGrp, '!=', 'Inverter busca (não contêm)');

    // --- RESULTADOS ---
    var findProgressBar = findW.add('progressbar', [0, 0, 280, 1], undefined);
    findProgressBar.value = 0;

    var resultTree = findW.add('treeview', [0, 0, 320, 0]);
    resultTree.visible = false;

    // =================================================================================
    // --- EVENTOS ---
    // =================================================================================

    findW.onShow = function() {
        findEdTxt.active = true;
    };

    function triggerSearch() {
        findProgressBar.value = 0;
        resultTree.visible = false;
        resultTree.size.height = 0;
        resultTree.removeAll(); 
        
        var sKey = findEdTxt.text;
        if (sKey == '' || app.project.numItems == 0) {
            findW.text = SCRIPT_WINDOW_TITLE;
            alert("Por favor, digite um termo para buscar ou abra um projeto v lido.");
            return;
        }

        findW.text = 'BUSCANDO...';
        findW.layout.layout(true);
        findW.update(); 

        try {
            var optObj = {
                sKey: sKey,
                vis: optCkb5.value,
                matchCase: optCkb1.value,
                matchAccent: optCkb2.value,
                invert: optCkb4.value
            };

            var compsArray = getComps();
            if (compsArray.length === 0) {
                alert("Nenhuma composi  o encontrada no projeto.");
                findW.text = SCRIPT_WINDOW_TITLE;
                return;
            }

            buildTxtSearchTree(resultTree, optObj, compsArray, findProgressBar, findW);
            
            var count = expandNodes(resultTree);

            if (count < 1) {
                findW.text = 'SEM RESULTADOS';
                alert("Nenhum texto encontrado com: " + sKey);
            } else {
                resultTree.visible = true;
                var newHeight = Math.min(ALTURA_MAX_RESULTADOS, (count * ALTURA_ITEM_RESULTADO) + 25);
                resultTree.size.height = newHeight;
                findW.text = 'ENCONTRADOS: ' + count;
            }
            
            findW.layout.layout(true);
            
        } catch (err) {
            alert('Erro Fatal na Busca:\n' + err.toString());
            findW.text = 'ERRO';
        }
    }

    findEdTxt.onEnterKey = triggerSearch;
    
    if (findBtn.leftClick) {
        findBtn.leftClick.onClick = triggerSearch;
    } else {
        findBtn.onClick = triggerSearch;
    }

    resultTree.onChange = function() {
        if (!resultTree.selection) return;
        
        try {
            var item = resultTree.selection;
            var comp = item.comp;
            
            if (!comp) return;

            // FIX: Usar customType para verificar o tipo
            if (item.customType == 'item') {
                var txtLayer = item.txtLayer;
                var t = item.refTime;
                
                if (txtLayer) {
                    comp.openInViewer();
                    for (var i=1; i<=comp.numLayers; i++) comp.layer(i).selected = false;
                    
                    txtLayer.selected = true;
                    comp.time = t;
                }
            } else if (item.customType == 'comp') {
                comp.openInViewer();
            }
        } catch(e) {
        }
    };

    findW.center();
    findW.show();
}

// Ajuda centralizada no HELP lib
function showFindHelp() {
    if (typeof showSearchLayersHelp === 'function') { showSearchLayersHelp(); }
}
















