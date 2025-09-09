/***************************************************
 * GNEWS Renamer.jsx
 * Versão: 7.6 - CORRIGIDO PARA PAINEL GND9TOOLS
 ***************************************************/

function createRenamerUI(thisObj) {

    // =======================================================================
    // ETAPA 1: CARREGAMENTO DE DADOS EXTERNOS (COM VERIFICAÇÕES REFORÇADAS)
    // =======================================================================

    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) {
            alert("Erro fatal: Arquivo JSON não encontrado em:\n" + filePath);
            return null;
        }
        try {
            file.open("r");
            var content = file.read();
            file.close();
            
            if (typeof JSON !== 'undefined' && typeof JSON.parse === 'function') {
                return JSON.parse(content);
            } else {
                return eval('(' + content + ')');
            }
        } catch (e) {
            alert("Erro ao ler ou parsear o arquivo JSON:\n" + filePath + "\n\n" + e.toString());
            return null;
        }
    }

    function loadAllData() {
        try {
            if (typeof scriptMainPath === 'undefined' || scriptMainPath === null) {
                throw new Error("Variável global 'scriptMainPath' não encontrada. Execute a partir do painel 'GND9 TOOLS'.");
            }

            var configFilePath = new File(scriptMainPath + "source/config/MORNING_config.json");
            var configData = readJsonFile(configFilePath.fsName);
            if (!configData) throw new Error("Não foi possível carregar ou ler o MORNING_config.json.");
            if (!configData.data_paths) throw new Error("A chave 'data_paths' não foi encontrada no MORNING_config.json.");

            var sourceFolder = new Folder(scriptMainPath + "source/");

            if (!configData.data_paths.names) throw new Error("'data_paths.names' não definido no config.");
            var equipeDataPath = new File(sourceFolder.fsName + "/" + configData.data_paths.names.replace("../", ""));
            var equipeData = readJsonFile(equipeDataPath.fsName);
            if (!equipeData || !equipeData.equipe) throw new Error("Não foi possível carregar ou ler DADOS_equipe_gnews.json.");
            
            var namesList = [];
            var tagsMap = {};
            for (var i = 0; i < equipeData.equipe.length; i++) {
                var membro = equipeData.equipe[i];
                namesList.push(membro.apelido);
                tagsMap[membro.apelido] = membro.tag;
            }

            if (!configData.data_paths.productions) throw new Error("'data_paths.productions' não definido no config.");
            var programacaoDataPath = new File(sourceFolder.fsName + "/" + configData.data_paths.productions.replace("../", ""));
            var programacaoData = readJsonFile(programacaoDataPath.fsName);
            if (!programacaoData || !programacaoData.programacao_globonews) throw new Error("Não foi possível carregar ou ler DADOS_programacao_gnews.json.");
            
            var productionsList = [];
            for (var i = 0; i < programacaoData.programacao_globonews.length; i++) {
                var programa = programacaoData.programacao_globonews[i];
                if (programa && programa.tagName) {
                    var tagNameFormatted = programa.tagName.replace(/_/g, ' ').toLowerCase();
                    productionsList.push(tagNameFormatted.replace(/\b\w/g, function(l){ return l.toUpperCase(); }));
                }
            }

            if (!configData.data_paths.arts) throw new Error("'data_paths.arts' não definido no config.");
            var artesDataPath = new File(sourceFolder.fsName + "/" + configData.data_paths.arts.replace("../", ""));
            var artesData = readJsonFile(artesDataPath.fsName);
            if (!artesData) throw new Error("Não foi possível carregar ou ler DADOS_artes_gnews.json.");
            
            var artsList = [];
            if (artesData.artes_codificadas) {
                var tempArtes = {};
                for (var i = 0; i < artesData.artes_codificadas.length; i++) {
                    var arte_obj = artesData.artes_codificadas[i];
                    if (arte_obj && arte_obj.arte && !tempArtes[arte_obj.arte]) {
                        artsList.push(arte_obj.arte);
                        tempArtes[arte_obj.arte] = true;
                    }
                }
                artsList.sort();
            } else if (artesData.Artes) {
                artsList = artesData.Artes;
            } else {
                 throw new Error("Nenhuma chave válida ('artes_codificadas' ou 'Artes') encontrada no DADOS_artes_gnews.json.");
            }
            
            if (!configData.inline_data || !configData.inline_data.versions) throw new Error("'inline_data.versions' não definido no config.");
            var versionsList = configData.inline_data.versions;

            return {
                names: namesList,
                tags: tagsMap,
                productions: productionsList,
                arts: artsList,
                versions: versionsList,
                programacaoRaw: programacaoData
            };

        } catch (e) {
            var errorMessage = "Ocorreu um erro crítico durante o carregamento dos dados:\n" + e.toString();
            $.writeln(errorMessage);
            alert(errorMessage);
            return null;
        }
    }

    var loadedData = loadAllData();
    if (!loadedData) {
        return;
    }

    var names = loadedData.names;
    var tags = loadedData.tags;
    var productions = loadedData.productions;
    var arts = loadedData.arts;
    var versions = loadedData.versions;
    var programacaoData = loadedData.programacaoRaw;

    // =======================================================================
    // ENHANCED UNICODE SUPPORT DETECTION
    // =======================================================================
    
    function getAfterEffectsVersionInfo() {
        var version = parseFloat(app.version);
        var versionYear = null;
        var supportsUnicode = false;
        var recommendedFont = "Arial Unicode MS";
        var fallbackFont = "Arial";
        
        if (version >= 24.0) {
            versionYear = 2024;
            supportsUnicode = true;
            recommendedFont = "Segoe UI Emoji";
        } else if (version >= 23.0) {
            versionYear = 2023;
            supportsUnicode = true;
            recommendedFont = "Arial Unicode MS";
        } else if (version >= 22.0) {
            versionYear = 2022;
            supportsUnicode = true;
            recommendedFont = "Arial Unicode MS";
        } else if (version >= 18.0) {
            versionYear = 2021;
            supportsUnicode = true;
            recommendedFont = "Arial Unicode MS";
        } else if (version >= 17.0) {
            versionYear = 2020;
            supportsUnicode = false;
            recommendedFont = "Arial";
        } else {
            versionYear = "Legacy";
            supportsUnicode = false;
            recommendedFont = "Arial";
        }
        
        return {
            version: version,
            year: versionYear,
            supportsUnicode: supportsUnicode,
            recommendedFont: recommendedFont,
            fallbackFont: fallbackFont
        };
    }

    function isUnicodeSupported() {
        var versionInfo = getAfterEffectsVersionInfo();
        
        if (versionInfo.supportsUnicode) {
            try {
                var testWin = new Window("dialog");
                var testText = testWin.add("statictext", undefined, "\uD83D\uDCBE");
                
                try {
                    testText.graphics.font = ScriptUI.newFont(versionInfo.recommendedFont, "Regular", 12);
                } catch(e) {
                    try {
                        testText.graphics.font = ScriptUI.newFont(versionInfo.fallbackFont, "Regular", 12);
                    } catch(e2) {
                        testWin.close();
                        return false;
                    }
                }
                
                testWin.close();
                return true;
                
            } catch(e) {
                $.writeln("Unicode test failed: " + e.toString());
                return false;
            }
        }
        
        return false;
    }

    function setUnicodeFont(element) {
        var versionInfo = getAfterEffectsVersionInfo();
        
        if (versionInfo.supportsUnicode) {
            try {
                element.graphics.font = ScriptUI.newFont(versionInfo.recommendedFont, "Regular", 12);
            } catch(e1) {
                try {
                    if (versionInfo.recommendedFont !== "Arial Unicode MS") {
                        element.graphics.font = ScriptUI.newFont("Arial Unicode MS", "Regular", 12);
                    } else {
                        element.graphics.font = ScriptUI.newFont("Segoe UI", "Regular", 12);
                    }
                } catch(e2) {
                    try {
                        element.graphics.font = ScriptUI.newFont(versionInfo.fallbackFont, "Regular", 12);
                    } catch(e3) {
                        $.writeln("Warning: Could not set Unicode font, using system default");
                    }
                }
            }
        }
    }

    var unicodeIcons = {
        save: "\uD83D\uDCBE",
        create: "\u2728",
        capture: "\uD83D\uDD3D",
        copy: "\uD83D\uDCCB",
        organize: "\uD83D\uDCE5"
    };

    var fallbackIcons = {
        save: "[SAVE]",
        create: "[NEW]", 
        capture: "[GET]",
        copy: "[COPY]",
        organize: "[ORG]"
    };

    function getIcon(iconName) {
        var versionInfo = getAfterEffectsVersionInfo();
        
        if (versionInfo.supportsUnicode && isUnicodeSupported()) {
            return unicodeIcons[iconName] || fallbackIcons[iconName] || "";
        } else {
            return fallbackIcons[iconName] || "";
        }
    }

    // =======================================================================
    // FUNÇÃO PARA DEFINIR VALORES PADRÃO NA ABERTURA
    // =======================================================================
    function setDefaultValuesWithTimeLogic() {
        descInput.text = "";
        editorInput.text = "";
        alterCheck.value = false;

        for (var i = 0; i < nameDrop.items.length; i++) {
            if (nameDrop.items[i].text.toLowerCase() === "d9") {
                nameDrop.selection = i;
                break;
            }
        }

        for (var i = 0; i < artDrop.items.length; i++) {
            if (artDrop.items[i].text.toLowerCase() === "base caracter") {
                artDrop.selection = i;
                break;
            }
        }
        
        versionDrop.selection = 0;

        function isDayInSchedule(scheduleString, currentDay) {
            var s = scheduleString.toLowerCase();
            
            if (s.indexOf("diariamente") > -1 || s.indexOf("segunda a domingo") > -1) {
                return true;
            }
            if (s.indexOf("segunda a sexta") > -1) {
                return ["seg", "ter", "qua", "qui", "sex"].indexOf(currentDay) > -1;
            }
            if (s.indexOf("sábados e domingos") > -1) {
                return ["sab", "dom"].indexOf(currentDay) > -1;
            }
            if (s.indexOf("segunda") > -1) return currentDay === "seg";
            if (s.indexOf("terça") > -1) return currentDay === "ter";
            if (s.indexOf("quarta") > -1) return currentDay === "qua";
            if (s.indexOf("quinta") > -1) return currentDay === "qui";
            if (s.indexOf("sexta") > -1) return currentDay === "sex";
            if (s.indexOf("sábado") > -1) return currentDay === "sab";
            if (s.indexOf("domingo") > -1) return currentDay === "dom";

            return false;
        }

        try {
            var now = new Date();
            var dayMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
            var currentDay = dayMap[now.getDay()];
            var currentTime = pad(now.getHours()) + ":" + pad(now.getMinutes());
            var productionFound = false;

            for (var i = 0; i < programacaoData.programacao_globonews.length; i++) {
                var programa = programacaoData.programacao_globonews[i];
                
                if (programa.horario && programa.dias_exibicao) {
                    var timeParts = programa.horario.split(" - ");
                    var startTime = timeParts[0];
                    var endTime = timeParts[1];

                    if (isDayInSchedule(programa.dias_exibicao, currentDay)) {
                        if (currentTime >= startTime && currentTime < endTime) {
                            var tagNameFormatted = programa.tagName.replace(/_/g, ' ').toLowerCase();
                            var productionName = tagNameFormatted.replace(/\b\w/g, function(l){ return l.toUpperCase(); });
                            
                            for (var p = 0; p < prodDrop.items.length; p++) {
                                if (prodDrop.items[p].text === productionName) {
                                    prodDrop.selection = p;
                                    productionFound = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if(productionFound) break;
            }
            if(!productionFound) {
                prodDrop.selection = 0;
            }
        } catch(e){
             prodDrop.selection = 0;
             $.writeln("ERRO CRÍTICO na função de horário: " + e.toString());
        }
    }
        
    // =======================================================================
    // LÓGICA E UI DO SCRIPT
    // =======================================================================
        
    function copyTextToClipboard(textToCopy) {
        var cmd_win = 'cmd.exe /c cmd.exe /c "echo ' + textToCopy + ' | clip"';
        var cmd_mac = 'echo "' + textToCopy + '" | pbcopy';
        if ($.os.indexOf("Windows") !== -1) {
            system.callSystem(cmd_win);
        } else {
            system.callSystem(cmd_mac);
        }
    }

    function pad(num) {
        var s = String(num);
        while (s.length < 2) { s = "0" + s; }
        return s;
    }

    var defaultCompSettings = {
        width: 1920, height: 1080, pixelAspect: 1.0,
        duration: 10, frameRate: 29.97
    };

    var lastSavedPath;

    try {
        if (typeof scriptMainPath === 'undefined' || scriptMainPath === null) {
            throw new Error("A variável global 'scriptMainPath' não foi definida.");
        }
        var getPathScriptFile = new File(scriptMainPath + "source/libraries/functions/func_getPathDayByDay.js");

        if (getPathScriptFile.exists) {
            getPathScriptFile.open('r');
            var scriptContent = getPathScriptFile.read();
            getPathScriptFile.close();
            eval(scriptContent);

            var dynamicPath = getPathDayByDay();
            lastSavedPath = dynamicPath;
            $.writeln("Caminho dinâmico padrão para salvar definido como: " + lastSavedPath);

        } else {
            throw new Error("Arquivo 'func_getPathDayByDay.js' não encontrado.");
        }
    } catch(e) {
        $.writeln("AVISO: Falha ao obter o caminho dinâmico. Usando o caminho padrão do projeto. Erro: " + e.toString());
        lastSavedPath = app.project && app.project.file ? app.project.file.parent.fsName : Folder.desktop.fsName;
    }
        
    var lang = {
        "pt": {
            title: "GNEWS RENAMER", name: "NOME:", prod: "PRODUÇÃO:", art: "TIPO:", alter: "CORREÇÃO:",
            desc: "DESCRIÇÃO:", version: "VERSÃO:", editor: "EDITOR:", capture: "CAPTURAR", save: "SALVAR",
            copy: "COPIAR", create: "CRIAR", rename: "RENOMEAR",
            noComp: "Nenhuma composição selecionada!", noEditor: "O campo EDITOR é obrigatório!",
            renamed: "Composições renomeadas!", saved: "Projeto salvo como: ", saveCancelled: "Salvamento cancelado.",
            compNameCopied: "Nome da composição copiado!", compCreated: "Composição criada com sucesso!"
        }
    };
    var currentLang = "pt";

    function getAlterationNumber(compName) {
        if (!compName) return "01";
        var comps = app.project.items;
        var maxNum = 0;
        for (var i = 1; i <= comps.length; i++) {
            if (comps[i] instanceof CompItem && comps[i].name.toUpperCase().indexOf(compName.toUpperCase()) !== -1) {
                var match = comps[i].name.match(/C(\d+)/i);
                if (match && parseInt(match[1], 10) > maxNum) {
                    maxNum = parseInt(match[1], 10);
                }
            }
        }
        return pad(maxNum + 1);
    }

    function parseCompName(compName, currentValues) {
        var result = JSON.parse(JSON.stringify(currentValues));
        if (!compName) return result;
        result.alter = false;
        var nameUpper = compName.toUpperCase();
        var mainPart = nameUpper;
        var editorPart = "";
        if (nameUpper.indexOf(" - ") > -1) {
            var parts = nameUpper.split(" - ");
            mainPart = parts.shift().trim();
            editorPart = parts.join(" - ").trim();
        }
        if (editorPart) {
            var alterMatch = editorPart.match(/C(\d+)/i);
            if (alterMatch) {
                result.alter = true;
                editorPart = editorPart.replace(alterMatch[0], "").trim();
            }
            result.editor = editorPart;
        }
        var foundKeywords = [];
        for (var nameKey in tags) {
            if (tags.hasOwnProperty(nameKey)) {
                var tagValue = tags[nameKey].toUpperCase();
                if (mainPart.indexOf(tagValue) > -1) {
                    var nameIndex = names.indexOf(nameKey);
                    if (nameIndex > -1) {
                        result.name = nameIndex;
                        foundKeywords.push(tagValue);
                        break;
                    }
                }
            }
        }
        for (var i = 0; i < productions.length; i++) {
            if (mainPart.indexOf(productions[i].toUpperCase()) > -1) {
                result.prod = i;
                foundKeywords.push(productions[i].toUpperCase());
                break;
            }
        }
        for (var i = 0; i < arts.length; i++) {
            if (mainPart.indexOf(arts[i].toUpperCase()) > -1) {
                result.art = i;
                foundKeywords.push(arts[i].toUpperCase());
                break;
            }
        }
        var versionMatch = mainPart.match(/ARTE\s?(\d+)/i);
        if (versionMatch) {
            var num = parseInt(versionMatch[1], 10);
            var formattedVersion = "Arte " + pad(num);
            for (var i = 1; i < versions.length; i++) {
                if (versions[i] === formattedVersion) {
                    result.version = i;
                    foundKeywords.push(versionMatch[0]);
                    break;
                }
            }
        }
        var tempDesc = mainPart.replace("GNEWS", "").trim();
        for (var i = 0; i < foundKeywords.length; i++) {
            tempDesc = tempDesc.replace(foundKeywords[i], "");
        }
        result.desc = tempDesc.replace(/\s+/g, ' ').trim();
        return result;
    }

    function sanitizeInput(text) {
        return text.replace(/[\/\\:*?"<>|]/g, "");
    }

    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", lang[currentLang].title, undefined, { resizeable: false });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 5;
    win.margins = 15;
    
    // As funções de tema foram removidas para garantir a compatibilidade,
    // já que elas dependem de outras bibliotecas.
    // setBgColor(win, bgColor1);

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    var title = headerGrp.add('statictext', undefined, 'Construtor de Nomes:');
    title.alignment = 'left';
    // setFgColor(title, normalColor1);
    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    var helpBtn = helpGrp.add('button', undefined, '?');
    helpBtn.preferredSize = [25, 25];

    var fieldsPanel = win.add("panel");
    fieldsPanel.orientation = "column";
    fieldsPanel.alignChildren = ["left", "top"];
    fieldsPanel.alignment = 'center';
    fieldsPanel.spacing = 12;
    fieldsPanel.margins = 12;
    // setFgColor(fieldsPanel, monoColor1);

    function createDropdown(parent, labelText, items, width) {
        var grp = parent.add("group");
        var label = grp.add("statictext", undefined, labelText);
        // setFgColor(label, monoColor1);
        var ctrl = grp.add("dropdownlist", undefined, items);
        if (items && items.length > 0) ctrl.selection = 0;
        ctrl.preferredSize.width = width;
        return ctrl;
    }

    var row1 = fieldsPanel.add("group");
    row1.orientation = "row";
    var nameDrop = createDropdown(row1, lang[currentLang].name, names, 80);
    var prodDrop = createDropdown(row1, lang[currentLang].prod, productions, 80);
    
    var row2 = fieldsPanel.add("group");
    row2.orientation = "row";
    var artDrop = createDropdown(row2, lang[currentLang].art, arts, 90);
    var versionDrop = createDropdown(row2, lang[currentLang].version, versions, 97);

    var descGroup = fieldsPanel.add("group");
    descGroup.alignment = "fill";
    var descLabel = descGroup.add("statictext", undefined, lang[currentLang].desc);
    // setFgColor(descLabel, monoColor1);
    var descInput = descGroup.add("edittext", undefined, "");
    descInput.alignment = "fill";
    descInput.preferredSize.width = 218;

    var editorGroup = fieldsPanel.add("group");
    editorGroup.alignment = "fill";
    var editorLabel = editorGroup.add("statictext", undefined, lang[currentLang].editor);
    // setFgColor(editorLabel, monoColor1);
    var editorInput = editorGroup.add("edittext", undefined, "");
    editorInput.alignment = "fill";
    editorInput.preferredSize.width = 238;

    var alterGroup = fieldsPanel.add("group");
    var alterLabel = alterGroup.add("statictext", undefined, lang[currentLang].alter);
    // setFgColor(alterLabel, monoColor1);
    var alterCheck = alterGroup.add("checkbox", undefined, "");

    var previewContainerGroup = win.add("group");
    previewContainerGroup.alignment = "center";
    
    var previewPanel = previewContainerGroup.add("panel");
    previewPanel.preferredSize.height = 40;
    previewPanel.alignChildren = ["center", "center"];
    previewPanel.margins = 2;
    // setFgColor(previewPanel, monoColor1);
    var previewText = previewPanel.add("statictext", undefined, "");
    previewText.preferredSize.width = 309;
    // setFgColor(previewText, normalColor1);
    
    var mainBtnPanel = win.add("group");
    mainBtnPanel.orientation = "column";
    mainBtnPanel.alignment = "center";
    mainBtnPanel.spacing = 5;

    var buttonRow1 = mainBtnPanel.add("group");
    var buttonRow2 = mainBtnPanel.add("group");
    
    var supportsUnicode = isUnicodeSupported();
    var btnWidth = 100;
    var btnHeight = 30;

    var renameBtn = buttonRow1.add('button', undefined, (supportsUnicode ? getIcon("save") + "  " : "") + lang[currentLang].rename);
    renameBtn.size = [btnWidth, btnHeight];
    var createBtn = buttonRow1.add('button', undefined, (supportsUnicode ? getIcon("create") + "  " : "") + lang[currentLang].create);
    createBtn.size = [btnWidth, btnHeight];
    var captureBtn = buttonRow1.add('button', undefined, (supportsUnicode ? getIcon("capture") + "  " : "") + lang[currentLang].capture);
    captureBtn.size = [btnWidth, btnHeight];
    
    var copyBtn = buttonRow2.add('button', undefined, (supportsUnicode ? getIcon("copy") + "  " : "") + lang[currentLang].copy);
    copyBtn.size = [btnWidth, btnHeight];
    var organizeBtn = buttonRow2.add('button', undefined, (supportsUnicode ? getIcon("organize") + "  " : "") + "ORGANIZAR");
    organizeBtn.size = [btnWidth, btnHeight];
    var saveBtn = buttonRow2.add('button', undefined, (supportsUnicode ? getIcon("save") + "  " : "") + lang[currentLang].save);
    saveBtn.size = [btnWidth, btnHeight];

    function updateStatusText(message) {
        previewText.text = message;
    }

    function removeAccents(str) {
        if (!str) return "";
        var com_acento = "áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ";
        var sem_acento = "aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN";
        var novastr="";
        for(var i=0; i<str.length; i++) {
            var troca=false;
            for (var j=0; j<com_acento.length; j++) {
                if (str.substr(i,1)==com_acento.substr(j,1)) {
                    novastr+=sem_acento.substr(j,1);
                    troca=true;
                    break;
                }
            }
            if (troca==false) {
                novastr+=str.substr(i,1);
            }
        }
        return novastr;
    }

    function onInputChange() {
        this.text = sanitizeInput(this.text);
        updatePreview();
    }

    function updatePreview() {
        var prodText = prodDrop.selection ? prodDrop.selection.text.toUpperCase() : "";
        var artText = artDrop.selection ? artDrop.selection.text.toUpperCase() : "";
        var versionText = (versionDrop.selection && versionDrop.selection.text !== "Nenhuma") ? " " + versionDrop.selection.text.toUpperCase() : "";
        var baseName = "GNEWS " + prodText + " " + artText;
        var descStr = descInput.text ? " " + descInput.text.toUpperCase() : "";
        var editorStr = editorInput.text ? " - " + editorInput.text.toUpperCase() : "";
        
        var compNameForAlterationCheck = baseName + descStr;
        var alterStr = alterCheck.value ? " c" + getAlterationNumber(compNameForAlterationCheck) : "";
        
        updateStatusText(baseName + descStr + versionText + editorStr + alterStr);
    }

    nameDrop.onChange = prodDrop.onChange = artDrop.onChange = versionDrop.onChange = updatePreview;
    descInput.onChanging = onInputChange;
    editorInput.onChanging = onInputChange;
    alterCheck.onClick = updatePreview;

    function getCurrentUIValues() {
        return {
            name: nameDrop.selection.index, prod: prodDrop.selection.index, art: artDrop.selection.index,
            desc: descInput.text, version: versionDrop.selection.index, editor: editorInput.text, alter: alterCheck.value
        };
    }

    function updateFieldsFromComp() {
        var activeComp = app.project.activeItem;
        if (activeComp instanceof CompItem) {
            var currentValues = getCurrentUIValues();
            var parsed = parseCompName(activeComp.name, currentValues);
            if(parsed){
                if (parsed.name >= 0) nameDrop.selection = parsed.name;
                if (parsed.prod >= 0) prodDrop.selection = parsed.prod;
                if (parsed.art >= 0) artDrop.selection = parsed.art;
                descInput.text = parsed.desc;
                if (parsed.version >= 0) versionDrop.selection = parsed.version;
                editorInput.text = parsed.editor;
                alterCheck.value = parsed.alter;
                updatePreview();
            }
        }
    }
    
    captureBtn.onClick = function() {
        if (!(app.project.activeItem instanceof CompItem)) { updateStatusText(lang[currentLang].noComp); return; }
        updateFieldsFromComp();
    };

    copyBtn.onClick = function() {
        var activeItem = app.project.activeItem;
        if (activeItem && activeItem instanceof CompItem) {
            try {
                copyTextToClipboard(activeItem.name);
                updateStatusText(lang[currentLang].compNameCopied);
            } catch(e) {
                updateStatusText("Erro ao copiar: " + e.toString());
            }
        } else {
            updateStatusText(lang[currentLang].noComp);
        }
    };
    
    createBtn.onClick = function() {
        app.beginUndoGroup("Criar Nova Composição");
        try {
            updatePreview();
            var compName = previewText.text;
            if (compName === "" || compName.indexOf("GNEWS") === -1) {
                updateStatusText("Gere um nome válido antes de criar a composição."); return;
            }
            
            compName = removeAccents(compName);

            app.project.items.addComp(compName, defaultCompSettings.width, defaultCompSettings.height, defaultCompSettings.pixelAspect, defaultCompSettings.duration, defaultCompSettings.frameRate);
            updateStatusText(lang[currentLang].compCreated);
        } catch(e) {
            updateStatusText("Erro ao criar: " + e.message);
        }
        app.endUndoGroup();
    };

    renameBtn.onClick = function() {
        app.beginUndoGroup("Renomear Composições");
        try {
            var selectedComps = [];
            var selection = app.project.selection;
            for (var i = 0; i < selection.length; i++) {
                if (selection[i] instanceof CompItem) { selectedComps.push(selection[i]); }
            }
            if (selectedComps.length === 0) { throw new Error(lang[currentLang].noComp); }
            
            updatePreview();
            var finalNameTemplate = previewText.text;
            finalNameTemplate = removeAccents(finalNameTemplate);

            for (var i = 0; i < selectedComps.length; i++) {
                var compName = finalNameTemplate;
                if (alterCheck.value && selectedComps.length > 1) {
                    var baseNameForAlter = "GNEWS " + (prodDrop.selection ? prodDrop.selection.text.toUpperCase() : "");
                    var descStrForAlter = descInput.text ? " " + descInput.text.toUpperCase() : "";
                    var alterNum = parseInt(getAlterationNumber(baseNameForAlter + descStrForAlter), 10) + i;
                    var alterStr = " c" + pad(alterNum);
                    compName = compName.replace(/ c\d+$/, "") + alterStr;
                }
                selectedComps[i].name = compName;
            }
            updateStatusText(lang[currentLang].renamed);
        } catch (e) {
            updateStatusText("Erro: " + e.message);
        }
        app.endUndoGroup();
    };
    
    organizeBtn.onClick = function() {
        if (!app.project) {
            updateStatusText("Por favor, abra um projeto.");
            return;
        }
    
        app.beginUndoGroup("Organizar Projeto");
        try {
            updateStatusText("Analisando o projeto...");
            
            function isGnewsNamedComp(comp) {
                if (!(comp instanceof CompItem)) return false;
                return (comp.name.toUpperCase().indexOf("GNEWS ") === 0);
            }

            var compsToProtect_ids = {};
            var selection = app.project.selection;
            if (selection.length > 0) {
                for (var j = 0; j < selection.length; j++) {
                    if (selection[j] instanceof CompItem) {
                        compsToProtect_ids[selection[j].id] = true;
                    }
                }
            } else {
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (isGnewsNamedComp(item)) {
                        compsToProtect_ids[item.id] = true;
                    }
                }
            }
    
            function getOrCreateFolder(name, parent) {
                if (parent === undefined) { parent = app.project.rootFolder; }
                for (var i = 1; i <= parent.numItems; i++) {
                    if (parent.item(i) instanceof FolderItem && parent.item(i).name === name) {
                        return parent.item(i);
                    }
                }
                return parent.items.addFolder(name);
            }
            
            updateStatusText("Reduzindo projeto...");
            app.executeCommand(app.findMenuCommandId("Reduce Project"));
            
            var folders = {};
            var arquivosFolder = getOrCreateFolder('03 ARQUIVOS');
            
            var itemsMovedCount = 0;
            var imageExtensions = [".png", ".jpg", ".jpeg", ".psd", ".ai", ".eps", ".tiff", "tga", ".exr"];
    
            updateStatusText("Organizando itens...");
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                
                if (item instanceof FolderItem) continue;
                
                if (compsToProtect_ids[item.id]) {
                    if (item.parentFolder !== app.project.rootFolder) {
                        item.parentFolder = app.project.rootFolder;
                    }
                    continue;
                }
                
                var moved = false;
                if (item instanceof CompItem) {
                    if (item.usedIn.length > 0) {
                        if (!folders.precomps) folders.precomps = getOrCreateFolder('02 PRECOMPS');
                        item.parentFolder = folders.precomps;
                    } else {
                        if (!folders.comps) folders.comps = getOrCreateFolder('01 COMPS');
                        item.parentFolder = folders.comps;
                    }
                    moved = true;
                } else if (item instanceof FootageItem) {
                    if (item.footageMissing) {
                        if (!folders.missing) folders.missing = getOrCreateFolder('04 !MISSING');
                        item.parentFolder = folders.missing;
                    } else if (item.mainSource instanceof SolidSource) {
                        if (!folders.solids) folders.solids = getOrCreateFolder('SOLIDOS', arquivosFolder);
                        item.parentFolder = folders.solids;
                    } else if (item.hasAudio && !item.hasVideo) {
                        if (!folders.audio) folders.audio = getOrCreateFolder('AUDIO', arquivosFolder);
                        item.parentFolder = folders.audio;
                    } else {
                        var isImage = false;
                        for (var j = 0; j < imageExtensions.length; j++) {
                            if (item.name.toLowerCase().indexOf(imageExtensions[j]) > -1) {
                                isImage = true;
                                break;
                            }
                        }
                        if (isImage) {
                            if (!folders.images) folders.images = getOrCreateFolder('IMAGENS', arquivosFolder);
                            item.parentFolder = folders.images;
                        } else {
                            if (!folders.video) folders.video = getOrCreateFolder('VIDEO', arquivosFolder);
                            item.parentFolder = folders.video;
                        }
                    }
                    moved = true;
                }
                if (moved) itemsMovedCount++;
            }

            updateStatusText("Limpando pastas vazias...");
            for(var i = app.project.numItems; i >= 1; i--) {
                var item = app.project.item(i);
                if(item instanceof FolderItem && item.numItems === 0) {
                    try{ item.remove(); } catch(e){}
                }
            }
            
            if (itemsMovedCount > 0) {
                updateStatusText("Organizado! " + itemsMovedCount + " itens movidos.");
            } else {
                updateStatusText("Projeto reduzido. Nada a reorganizar.");
            }
    
        } catch (e) {
            updateStatusText("Erro: " + e.toString());
        } finally {
            app.endUndoGroup();
        }
    };

    saveBtn.onClick = function() {
        updatePreview();
        var finalTagName = tags[names[nameDrop.selection.index]] || "";
        
        var cleanPreviewText = removeAccents(previewText.text);
        
        var projectName = (finalTagName ? finalTagName + " " : "") + cleanPreviewText + ".aep";
        projectName = projectName.replace(/[\/\\:*?"<>|]/g, "_");
        
        var saveFile = File(lastSavedPath + "/" + projectName).saveDlg("Salvar Projeto Como");
        if (saveFile) {
            try {
                app.project.save(saveFile);
                lastSavedPath = saveFile.parent.fsName;
                updateStatusText(lang[currentLang].saved + saveFile.name);
            } catch (e) {
                updateStatusText("Erro ao salvar: " + e.toString());
            }
        } else {
            updateStatusText(lang[currentLang].saveCancelled);
        }
    };
    
    helpBtn.onClick = function() {
        var TARGET_HELP_WIDTH = 450;
        var MARGIN_SIZE = 15;
        var TOPIC_SECTION_MARGINS = [10, 5, 10, 5];
        var TOPIC_SPACING = 5;
        var TOPIC_TITLE_INDENT = 0;
        var SUBTOPIC_INDENT = 25;

        var helpWin = new Window("palette", "Ajuda - GNEWS Tools", undefined, { closeButton: true });
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
        
        var titleText = headerPanel.add("statictext", undefined, "AJUDA - RENOMEAR, SALVAR E ORGANIZAR");
        titleText.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);
        titleText.alignment = ["center", "center"];
        if (typeof normalColor1 !== 'undefined' && typeof highlightColor1 !== 'undefined' && typeof setFgColor !== 'undefined') {
            setFgColor(titleText, highlightColor1);
        } else {
            titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [1, 1, 1, 1], 1);
        }

        var mainDescText = headerPanel.add("statictext", undefined, "Esta ferramenta padroniza nomes de comps, salva projetos e organiza arquivos.", {multiline: true});
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
                tabName: "CONSTRUTOR E AÇÕES",
                topics: [
                    { title: "▶ CONSTRUTOR DE NOMES:", text: "Use os menus e campos para gerar um nome padronizado. O resultado aparece no painel de status." },
                    { title: "▶ BOTÕES DE AÇÃO:", text: ""},
                    { title: "  - Capturar:", text: "Preenche os campos com base na composição selecionada no projeto." },
                    { title: "  - Criar:", text: "Cria uma nova composição vazia utilizando o nome gerado." },
                    { title: "  - Renamer:", text: "Aplica o nome gerado a todas as composições que estiverem selecionadas." },
                    { title: "  - Copiar:", text: "Copia o nome da composição atualmente ativa para a área de transferência." },
                    { title: "  - Salvar:", text: "Salva uma cópia do projeto (.aep) com um nome padronizado, incluindo a tag do seu nome." }
                ]
            },
            {
                tabName: "ORGANIZADOR",
                topics: [
                    { title: "▶ ORGANIZAR PROJETO:", text: "1. Reduz o projeto.\n2. Reorganiza todos os arquivos do projeto." },
                    { title: "  - Regra de Proteção:", text: "Composições cujo nome começa com 'GNEWS' ou as que estiverem selecionadas no pain painel 'Projeto' serão mantidas na raiz para evitar pré-composição acidental." }
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
                    topicText.preferredSize.height = 50;
                    
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
    };
    
    // Simplificando as chamadas de botão para evitar erros com a biblioteca de tema
    renameBtn.onClick = renameBtn.onClick || function() {}; // Prevenção de erro
    createBtn.onClick = createBtn.onClick || function() {};
    captureBtn.onClick = captureBtn.onClick || function() {};
    copyBtn.onClick = copyBtn.onClick || function() {};
    organizeBtn.onClick = organizeBtn.onClick || function() {};
    saveBtn.onClick = saveBtn.onClick || function() {};

    if (win instanceof Window) {
        win.center();
        win.show();
    }
    
    // O código de inicialização só roda se a janela for autônoma
    if (!(thisObj instanceof Panel)) {
        setDefaultValuesWithTimeLogic();
        updatePreview();
        var activeItemOnInit = app.project.activeItem;
        if (activeItemOnInit && activeItemOnInit instanceof CompItem) {
            updateFieldsFromComp();
        }
    }
}