/***************************************************************************************************
 * Corretor Ortográfico para After Effects v6.0 (Ferramenta Profissional)
 *
 * ESTA VERSÃO REQUER O ARQUIVO 'lista_de_palavras_data.jsx' PARA FUNCCIONAR.
 *
 * * NOVAS FUNCIONALIDADES:
 * - Dicionário Pessoal: Adiciona palavras a um 'dicionario_pessoal.txt' para serem ignoradas no futuro.
 * - Ações em Massa: Botões "Corrigir Todas" e "Ignorar Todas" para agilizar o fluxo de trabalho.
 * - Capitalização Inteligente: A correção respeita o formato da palavra original (MAIÚSCULAS, Capitalizada, etc.).
 * - Interface Reorganizada para acomodar as novas funcionalidades.
 ***************************************************************************************************/

//@include "lista_de_palavras_data.jsx";


(function (thisObj) {

    var dictionarySet = null;
    var personalDictFile = new File(new File($.fileName).path + "/dicionario_pessoal.txt");

    function loadDictionary() {
        // Carrega o dicionário principal
        if (typeof DICTIONARY_DATA !== "undefined") {
            dictionarySet = DICTIONARY_DATA;
        } else {
            alert("ERRO: O arquivo 'lista_de_palavras_data.jsx' não foi encontrado!\n\nCertifique-se de que ele está na mesma pasta que este script.");
            return false;
        }

        // Carrega e mescla o dicionário pessoal
        if (personalDictFile.exists) {
            personalDictFile.open("r");
            var personalWords = personalDictFile.read().split("\n");
            personalDictFile.close();
            for (var i = 0; i < personalWords.length; i++) {
                var word = personalWords[i].trim().toLowerCase();
                if (word) {
                    dictionarySet[word] = true;
                }
            }
        }
        return true;
    }

    function addWordToPersonalDictionary(word) {
        var cleanWord = word.trim().toLowerCase();
        if (!cleanWord) return;

        try {
            // Adiciona a palavra ao dicionário em memória para uso imediato
            dictionarySet[cleanWord] = true;
            
            // Adiciona a palavra ao arquivo .txt para uso futuro
            personalDictFile.open("a"); // 'a' para 'append' (adicionar ao final)
            personalDictFile.encoding = "UTF-8";
            personalDictFile.writeln(cleanWord);
            personalDictFile.close();

        } catch(e) {
            alert("Não foi possível salvar no dicionário pessoal. Verifique as permissões da pasta.\nErro: " + e.toString());
        }
    }
    
    function applyCapitalization(originalWord, newWord) {
        var isUpperCase = originalWord === originalWord.toUpperCase();
        var isCapitalized = originalWord.charAt(0) === originalWord.charAt(0).toUpperCase() && originalWord.slice(1) === originalWord.slice(1).toLowerCase();

        if (isUpperCase) {
            return newWord.toUpperCase();
        }
        if (isCapitalized) {
            return newWord.charAt(0).toUpperCase() + newWord.slice(1).toLowerCase();
        }
        return newWord.toLowerCase();
    }


    function checkSpellingLocally(textToCheck) {
        var cleanedText = textToCheck.toLowerCase();
        var words = cleanedText.replace(/[^a-z0-9\u00C0-\u00FF\s]/g, " ").split(/\s+/);
        
        var corrections = [];
        var foundWords = {};

        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (word && isNaN(word)) {
                if (!foundWords[word] && !dictionarySet[word]) {
                    corrections.push({ word: word });
                    foundWords[word] = true;
                }
            }
        }
        return { "corrections": corrections };
    }


    var layerTextStates = {};

    function getTextLayersFromComp() {
        var layersData = [];
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer instanceof TextLayer && layer.text && layer.text.sourceText && layer.text.sourceText.value.text.replace(/\s/g, '') !== '') {
                    layersData.push({
                        layerObj: layer,
                        id: layer.id.toString(),
                        name: layer.name,
                        text: layer.text.sourceText.value.text
                    });
                }
            }
        }
        return layersData;
    }

    function updateTextLayer(layerObj, newText) {
        try {
            app.beginUndoGroup("Correção Ortográfica");
            var textProp = layerObj.property("Source Text");
            if (textProp) {
                var textDocument = textProp.value;
                textDocument.text = newText;
                textProp.setValue(textDocument);
            }
        } catch (e) {
            alert("Erro ao atualizar camada: " + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function createMainUI() {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Corretor Ortográfico v6.0", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 5;
        win.margins = 10;
        
        var scanButton = win.add("button", undefined, "Verificar Composição Ativa");
        var statusText = win.add('statictext', undefined, 'Dicionário pronto. Clique para verificar.', { truncate: 'middle' });

        var resultsGroup = win.add("panel", undefined, "Erros Encontrados");
        resultsGroup.alignChildren = ["fill", "top"];
        resultsGroup.spacing = 5;

        var errorList = resultsGroup.add('listbox', undefined, [], { numberOfColumns: 2, showHeaders: true, columnTitles: ['Camada', 'Erro Encontrado'] });
        errorList.preferredSize = [400, 200];

        resultsGroup.add('statictext', undefined, 'Contexto (palavra errada entre <<< >>>):');
        var contextText = resultsGroup.add('edittext', undefined, '', { multiline: true, readonly: true });
        contextText.preferredSize = [400, 60];

        var navGroup = resultsGroup.add('group');
        navGroup.orientation = 'row';
        var prevBtn = navGroup.add('button', undefined, '<< Anterior');
        var nextBtn = navGroup.add('button', undefined, 'Próximo >>');
        navGroup.add('statictext', undefined, ' | ');
        var addToDictBtn = navGroup.add('button', undefined, 'Adicionar ao Dicionário');
        var ignoreAllBtn = navGroup.add('button', undefined, 'Ignorar Todas');

        var suggestionGroup = resultsGroup.add('panel', undefined, 'Ações de Correção');
        suggestionGroup.orientation = 'row';
        suggestionGroup.alignment = 'left';
        suggestionGroup.add('statictext', undefined, 'Corrigir para:');
        var suggestionInput = suggestionGroup.add('edittext', undefined, '');
        suggestionInput.preferredSize.width = 160;
        var applyBtn = suggestionGroup.add('button', undefined, 'Corrigir');
        var applyAllBtn = suggestionGroup.add('button', undefined, 'Corrigir Todas');

        var finalApplyBtn = win.add('button', undefined, 'APLICAR TODAS AS MUDANÇAS NO AFTER EFFECTS');

        scanButton.onClick = function () {
            if (!dictionarySet) {
                if (!loadDictionary()) return;
            }
            
            statusText.text = "Iniciando verificação...";
            win.update();
            var layers = getTextLayersFromComp();
            if (layers.length === 0) {
                statusText.text = "Nenhuma camada de texto encontrada.";
                return;
            }

            errorList.removeAll();
            layerTextStates = {};
            var allCorrections = [];

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                layerTextStates[layer.id] = { layerObj: layer.layerObj, originalText: layer.text, currentText: layer.text };
                
                var originalWords = layer.text.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s]/g, " ").split(/\s+/);
                var lowerCaseWords = layer.text.toLowerCase().replace(/[^a-z0-9\u00C0-\u00FF\s]/g, " ").split(/\s+/);
                
                var foundWords = {};
                for(var j = 0; j < lowerCaseWords.length; j++) {
                    var lw = lowerCaseWords[j];
                    if (lw && isNaN(lw) && !foundWords[lw] && !dictionarySet[lw]) {
                         allCorrections.push({
                            layerId: layer.id,
                            layerName: layer.name,
                            word: originalWords[j] // Salva a palavra com a capitalização original
                        });
                        foundWords[lw] = true;
                    }
                }
            }
            populateErrorList(allCorrections);
        };
        
        function populateErrorList(corrections) {
            errorList.removeAll();
            if (corrections.length === 0) {
                statusText.text = "Verificação concluída. Nenhum erro encontrado.";
                contextText.text = "";
                return;
            }
            
            for (var i = 0; i < corrections.length; i++) {
                var c = corrections[i];
                var item = errorList.add('item', c.layerName);
                item.subItems[0].text = '"' + c.word + '"';
                item.correctionData = c;
            }
            if (errorList.items.length > 0) errorList.selection = 0;
            statusText.text = "Verificação concluída. " + corrections.length + " possíveis erros encontrados.";
        }

        function updateContext() {
            var selection = errorList.selection;
            if (!selection) {
                contextText.text = "";
                suggestionInput.text = "";
                applyBtn.enabled = false;
                applyAllBtn.enabled = false;
                addToDictBtn.enabled = false;
                ignoreAllBtn.enabled = false;
                return;
            }

            var data = selection.correctionData;
            var fullText = layerTextStates[data.layerId].currentText;
            var wordEscaped = data.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var highlightedText = fullText.replace(new RegExp("(\\b" + wordEscaped + "\\b)", 'g'), '<<<$1>>>');
            contextText.text = highlightedText;
            
            suggestionInput.text = data.word.toLowerCase();
            applyBtn.enabled = true;
            applyAllBtn.enabled = true;
            addToDictBtn.enabled = true;
            ignoreAllBtn.enabled = true;
        }

        errorList.onChange = updateContext;
        
        prevBtn.onClick = function() {
            if (errorList.items.length > 0) {
                var newIndex = (errorList.selection ? errorList.selection.index : 0) - 1;
                if (newIndex < 0) newIndex = errorList.items.length - 1;
                errorList.selection = newIndex;
            }
        };
        nextBtn.onClick = function() {
            if (errorList.items.length > 0) {
                var newIndex = (errorList.selection ? errorList.selection.index : 0) + 1;
                if (newIndex >= errorList.items.length) newIndex = 0;
                errorList.selection = newIndex;
            }
        };
        
        addToDictBtn.onClick = function() {
            var selection = errorList.selection;
            if (!selection) return;
            var wordToAdd = selection.correctionData.word;
            addWordToPersonalDictionary(wordToAdd);
            alert("'" + wordToAdd + "' foi adicionada ao seu dicionário pessoal.");
            ignoreAllBtn.onClick(); // Reutiliza a função de ignorar para remover da lista
        };

        ignoreAllBtn.onClick = function() {
            var selection = errorList.selection;
            if (!selection) return;
            var wordToRemove = selection.correctionData.word.toLowerCase();
            
            for(var i = errorList.items.length - 1; i >= 0; i--) {
                if (errorList.items[i].correctionData.word.toLowerCase() === wordToRemove) {
                    errorList.remove(i);
                }
            }
            statusText.text = errorList.items.length + " erros restantes.";
        };


        function correctWord(isGlobal) {
            var selection = errorList.selection;
            if (!selection || suggestionInput.text === "") return;

            var data = selection.correctionData;
            var originalWord = data.word;
            var suggestion = suggestionInput.text;

            if (isGlobal) {
                // CORRIGIR TODAS
                var wordToRemove = originalWord.toLowerCase();
                for (var id in layerTextStates) {
                    var currentState = layerTextStates[id];
                    var textWords = currentState.currentText.split(/(\s+)/);
                    var newText = "";
                    for(var i=0; i<textWords.length; i++) {
                        var currentWord = textWords[i];
                        if (currentWord.toLowerCase() === wordToRemove) {
                             newText += applyCapitalization(currentWord, suggestion);
                        } else {
                            newText += currentWord;
                        }
                    }
                    currentState.currentText = newText;
                }
                ignoreAllBtn.onClick(); // Remove todas as instâncias da lista

            } else {
                // CORRIGIR APENAS UMA
                var currentState = layerTextStates[data.layerId];
                var correctedWord = applyCapitalization(originalWord, suggestion);
                var wordEscaped = originalWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var regex = new RegExp("(\\b" + wordEscaped + "\\b)");
                
                currentState.currentText = currentState.currentText.replace(regex, correctedWord);
                errorList.remove(selection.index);
            }
            
            if(errorList.items.length > 0) {
                errorList.selection = 0;
            } else {
                contextText.text = "Todas as correções foram aplicadas internamente.";
            }
            statusText.text = errorList.items.length + " erros restantes.";
        }
        
        applyBtn.onClick = function() { correctWord(false); };
        applyAllBtn.onClick = function() { correctWord(true); };


        finalApplyBtn.onClick = function() {
            var count = 0;
            for(var id in layerTextStates) {
                if (layerTextStates[id].originalText !== layerTextStates[id].currentText) {
                    updateTextLayer(layerTextStates[id].layerObj, layerTextStates[id].currentText);
                    count++;
                }
            }
            
            var msg = count > 0 ? count + " camada(s) foram atualizadas." : "Nenhuma alteração pendente para aplicar.";
            alert(msg);

            errorList.removeAll();
            statusText.text = "Alterações aplicadas com sucesso!";
            contextText.text = "";
        };

        if (win instanceof Window) { win.center(); win.show(); } else { win.layout.layout(true); }
    }

    createMainUI();

})(this);