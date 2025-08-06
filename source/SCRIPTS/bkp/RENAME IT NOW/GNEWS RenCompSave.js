function GNEWS_RenCompSave_UI() {

    // --- LÓGICA ORIGINAL COMPLETA DO SCRIPT (INTACTA) ---

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

    function isUnicodeSupported() {
        var majorVersion = parseFloat(app.version);
        return majorVersion >= 23;
    }

    var unicodeIcons = {
        save: "\uD83D\uDCBE", create: "\u2728", capture: "\uD83D\uDD3D",
        copy: "\uD83D\uDCCB", undo: "\u21A9"
    };

    var names = ["Rafael", "Trovão", "Matheus", "Helena", "Ian", "Igor", "Fabio", "Gabriela", "Maria", "Gilson", "Amanda", "Barbara"];
    var tags = { "Rafael": "d9r", "Trovão": "rtr", "Matheus": "msr", "Helena": "hcr", "Ian": "iar", "Igor": "igr", "Fabio": "fjr", "Gabriela": "gpr", "Maria": "mar", "Gilson": "gsr", "Amanda": "arr", "Barbara": "brr" };
    var productions = ["Conexao", "EI", "Mais", "J10", "Inter"];
    var arts = ["Destaque", "Base Caracter", "Foto", "Mapa", "Perfil", "Frase", "Twitter", "Display", "Promo", "Let", "Creditos"];
    var versions = ["-----", "Arte 01", "Arte 02", "Arte 03", "Arte 04", "Arte 05", "Arte 06", "Arte 07", "Arte 08"];

    var defaultCompSettings = {
        width: 1920, height: 1080, pixelAspect: 1.0,
        duration: 10, frameRate: 29.97
    };

    var lastSavedPath = app.project && app.project.file ? app.project.file.parent.fsName : Folder.desktop.fsName;

    var lang = {
        "pt": {
            title: "RENOMEAR E SALVAR", name: "NOME:", prod: "PRODUÇÃO:", art: "TIPO:", alter: "CORREÇÃO:",
            desc: "DESCRIÇÃO:", version: "VERSÃO:", editor: "EDITOR:", capture: "CAPTURAR", save: "SALVAR",
            copy: "COPIAR", create: "CRIAR", rename: "RENOMEAR", undo: "DESFAZER",
            noComp: "Nenhuma composição selecionada!", noEditor: "O campo EDITOR é obrigatório!",
            renamed: "Composições renomeadas!", saved: "Projeto salvo como: ", saveCancelled: "Salvamento cancelado!",
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

    // --- INTERFACE GRÁFICA REDESENHADA ---
    var win = new Window("palette", lang[currentLang].title);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;
    
    setBgColor(win, bgColor1);

    var headerGrp = win.add('group');
    headerGrp.alignment = 'fill';
    headerGrp.orientation = 'stack';
    var title = headerGrp.add('statictext', undefined, 'Construtor de Nomes de Composição:');
    title.alignment = 'left';
    setFgColor(title, normalColor1);
    var helpGrp = headerGrp.add('group');
    helpGrp.alignment = 'right';
    var helpBtn = new themeIconButton(helpGrp, { 
        icon: D9T_INFO_ICON, 
        tips: [lClick + 'Ajuda'] 
    });

    var fieldsPanel = win.add("panel");
    fieldsPanel.alignChildren = "left";
    setFgColor(fieldsPanel, monoColor1);

    function createDropdown(parent, labelText, items, width) {
        var grp = parent.add("group");
        var label = grp.add("statictext", undefined, labelText);
        setFgColor(label, monoColor1);
        var ctrl = grp.add("dropdownlist", undefined, items);
        if (items && items.length > 0) ctrl.selection = 0;
        ctrl.preferredSize.width = width;
        return ctrl;
    }

    var row1 = fieldsPanel.add("group");
    var nameDrop = createDropdown(row1, lang[currentLang].name, names, 100);
    var prodDrop = createDropdown(row1, lang[currentLang].prod, productions, 100);
    
    var row2 = fieldsPanel.add("group");
    var artDrop = createDropdown(row2, lang[currentLang].art, arts, 100);
    var versionDrop = createDropdown(row2, lang[currentLang].version, versions, 100);

    var descGroup = fieldsPanel.add("group");
    descGroup.alignment = "fill";
    var descLabel = descGroup.add("statictext", undefined, lang[currentLang].desc);
    setFgColor(descLabel, monoColor1);
    var descInput = descGroup.add("edittext", undefined, "");
    descInput.alignment = "fill";

    var editorGroup = fieldsPanel.add("group");
    editorGroup.alignment = "fill";
    var editorLabel = editorGroup.add("statictext", undefined, lang[currentLang].editor);
    setFgColor(editorLabel, monoColor1);
    var editorInput = editorGroup.add("edittext", undefined, "");
    editorInput.alignment = "fill";

    var alterGroup = fieldsPanel.add("group");
    var alterLabel = alterGroup.add("statictext", undefined, lang[currentLang].alter);
    setFgColor(alterLabel, monoColor1);
    var alterCheck = alterGroup.add("checkbox", undefined, "");

    var previewPanel = win.add("panel", undefined, "Preview do Nome Final");
    previewPanel.alignChildren = "center";
    setFgColor(previewPanel, monoColor1);
    var previewText = previewPanel.add("statictext", [0,0,320,20], "");
    setFgColor(previewText, normalColor1);

    var mainBtnPanel = win.add("group");
    mainBtnPanel.alignment = "center";
    
    var buttonRow1 = mainBtnPanel.add("group");
    var buttonRow2 = mainBtnPanel.add("group");

    var renameBtn = new themeButton(buttonRow1, { width: 110, height: 32, labelTxt: lang[currentLang].rename, tips: ['Renomeia as comps selecionadas.']});
    var createBtn = new themeButton(buttonRow1, { width: 110, height: 32, labelTxt: lang[currentLang].create, tips: ['Cria uma nova comp com este nome.']});
    var captureBtn = new themeButton(buttonRow1, { width: 110, height: 32, labelTxt: lang[currentLang].capture, tips: ['Captura dados da comp selecionada.']});
    var copyBtn = new themeButton(buttonRow2, { width: 110, height: 32, labelTxt: lang[currentLang].copy, tips: ['Copia o nome da comp ativa.']});
    var undoBtn = new themeButton(buttonRow2, { width: 110, height: 32, labelTxt: lang[currentLang].undo, tips: ['Desfaz a última ação.']});
    var saveBtn = new themeButton(buttonRow2, { width: 110, height: 32, labelTxt: lang[currentLang].save, tips: ['Salva uma cópia do projeto com o nome gerado.'], textColor: bgColor1, buttonColor: normalColor1});

    // --- LÓGICA DE EVENTOS DA UI (INTACTA) ---
    function updatePreview() {
        var prodText = prodDrop.selection ? prodDrop.selection.text.toUpperCase() : "";
        var artText = artDrop.selection ? artDrop.selection.text.toUpperCase() : "";
        var versionText = (versionDrop.selection && versionDrop.selection.text !== "-----") ? " " + versionDrop.selection.text.toUpperCase() : "";
        var baseName = "GNEWS " + prodText + " " + artText;
        var descStr = descInput.text ? " " + descInput.text.toUpperCase() : "";
        var editorStr = editorInput.text ? " - " + editorInput.text.toUpperCase() : "";
        var alterStr = alterCheck.value ? " c" + getAlterationNumber(baseName + descStr) : "";
        previewText.text = baseName + descStr + versionText + editorStr + alterStr;
    }

    function onInputChange() {
        this.text = sanitizeInput(this.text);
        updatePreview();
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
    if (app.project.activeItem instanceof CompItem) { updateFieldsFromComp(); } else { updatePreview(); }

    captureBtn.leftClick.onClick = function() {
        if (!(app.project.activeItem instanceof CompItem)) { alert(lang[currentLang].noComp); return; }
        updateFieldsFromComp();
    };

    copyBtn.leftClick.onClick = function() {
        var activeItem = app.project.activeItem;
        if (activeItem && activeItem instanceof CompItem) {
            try {
                copyTextToClipboard(activeItem.name);
                alert(lang[currentLang].compNameCopied);
            } catch(e) {
                alert("Erro ao copiar. Verifique as permissões do script.\n" + e.toString());
            }
        } else {
            alert(lang[currentLang].noComp);
        }
    };
    
    createBtn.leftClick.onClick = function() {
        app.beginUndoGroup("Criar Nova Composição");
        try {
            updatePreview();
            var compName = previewText.text;
            if (compName === "" || compName.indexOf("GNEWS") === -1) {
                alert("Gere um nome válido antes de criar a composição."); return;
            }
            var newComp = app.project.items.addComp(compName, defaultCompSettings.width, defaultCompSettings.height, defaultCompSettings.pixelAspect, defaultCompSettings.duration, defaultCompSettings.frameRate);
            newComp.openInViewer();
            alert(lang[currentLang].compCreated);
        } catch(e) {
            alert("Erro ao criar composição: " + e.message);
        }
        app.endUndoGroup();
    };

    renameBtn.leftClick.onClick = function() {
        app.beginUndoGroup("Renomear Composições");
        try {
            var selectedComps = [];
            var selection = app.project.selection;
            for (var i = 0; i < selection.length; i++) {
                if (selection[i] instanceof CompItem) { selectedComps.push(selection[i]); }
            }
            if (selectedComps.length === 0) { throw new Error(lang[currentLang].noComp); }
            if (!editorInput.text) { throw new Error(lang[currentLang].noEditor); }
            updatePreview();
            var finalNameTemplate = previewText.text;
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
            alert(lang[currentLang].renamed);
        } catch (e) {
            alert("Erro: " + e.message);
        }
        app.endUndoGroup();
    };

    undoBtn.leftClick.onClick = function() {
        app.executeCommand(app.findMenuCommandId("Undo"));
    };

    saveBtn.leftClick.onClick = function() {
        if (!editorInput.text) { alert(lang[currentLang].noEditor); return; }
        updatePreview();
        var finalTagName = tags[names[nameDrop.selection.index]] || "";
        var projectName = (finalTagName ? finalTagName.toUpperCase() + " " : "") + previewText.text + ".aep";
        projectName = projectName.replace(/[\/\\:*?"<>|]/g, "_");
        var saveFile = File(lastSavedPath + "/" + projectName).saveDlg("Salvar Projeto Como");
        if (saveFile) {
            try {
                app.project.save(saveFile);
                lastSavedPath = saveFile.parent.fsName;
                alert(lang[currentLang].saved + saveFile.name);
            } catch (e) {
                alert("Erro ao salvar o projeto: " + e.toString());
            }
        } else {
            alert(lang[currentLang].saveCancelled);
        }
    };
    
    helpBtn.leftClick.onClick = function() {
        alert("RENOMEAR E SALVAR\n\nEsta é uma ferramenta completa para padronizar a nomeação de composições e salvar projetos.\n\n1. Preencha os campos para construir o nome da composição.\n2. Use 'Capturar' para preencher os campos com base na comp selecionada.\n3. Use 'Criar' para gerar uma nova comp com o nome do preview.\n4. Selecione comps no projeto e use 'Renomear'.\n5. Use 'Salvar' para salvar uma cópia do projeto com um nome padronizado.");
    };

    win.center();
    win.show();
}

if (app.project) {
    GNEWS_RenCompSave_UI();
} else {
    alert("Por favor, abra um projeto no After Effects primeiro.");
}