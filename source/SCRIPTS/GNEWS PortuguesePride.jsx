/**********************************************************************************
 * Corretor Ortográfico para After Effects com Gemini API v2.4 (Lógica Síncrona)
 * * Funcionalidades:
 * - Lógica de chamada de API síncrona corrigida para garantir que todos os
 * layers sejam processados antes de exibir os resultados.
 * - Comunicação com a API mais robusta usando codificação Base64.
 * - Mensagens de erro e status aprimoradas.
 **********************************************************************************/

// Polyfill para JSON (ESSENCIAL)
if (typeof JSON !== "object") { JSON = {}; } (function () { function f(n) { return n < 10 ? "0" + n : n; } if (typeof Date.prototype.toJSON !== "function") { Date.prototype.toJSON = function () { return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null; }; String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function () { return this.valueOf(); }; } var cx, escapable, gap, indent, meta, rep; function quote(string) { escapable.lastIndex = 0; return escapable.test(string) ? '"' + string.replace(escapable, function (a) { var c = meta[a]; return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4); }) + '"' : '"' + string + '"'; } function str(key, holder) { var i, k, v, length, mind = gap, partial, value = holder[key]; if (value && typeof value === "object" && typeof value.toJSON === "function") { value = value.toJSON(key); } if (typeof rep === "function") { value = rep.call(holder, key, value); } switch (typeof value) { case "string": return quote(value); case "number": return isFinite(value) ? String(value) : "null"; case "boolean": case "null": return String(value); case "object": if (!value) { return "null"; } gap += indent; partial = []; if (Object.prototype.toString.apply(value) === "[object Array]") { length = value.length; for (i = 0; i < length; i += 1) { partial[i] = str(i, value) || "null"; } v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]"; gap = mind; return v; } if (rep && typeof rep === "object") { length = rep.length; for (i = 0; i < length; i += 1) { if (typeof rep[i] === "string") { k = rep[i]; v = str(k, value); if (v) { partial.push(quote(k) + (gap ? ": " : ":") + v); } } } } else { for (k in value) { if (Object.prototype.hasOwnProperty.call(value, k)) { v = str(k, value); if (v) { partial.push(quote(k) + (gap ? ": " : ":") + v); } } } } v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}"; gap = mind; return v; } } if (typeof JSON.stringify !== "function") { escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; meta = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", '"': '\\"', "\\": "\\\\" }; JSON.stringify = function (value, replacer, space) { var i; gap = ""; indent = ""; if (typeof space === "number") { for (i = 0; i < space; i += 1) { indent += " "; } } else if (typeof space === "string") { indent = space; } rep = replacer; if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) { throw new Error("JSON.stringify"); } return str("", { "": value }); }; } if (typeof JSON.parse !== "function") { cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; JSON.parse = function (text, reviver) { var j; function walk(holder, key) { var k, v, value = holder[key]; if (value && typeof value === "object") { for (k in value) { if (Object.prototype.hasOwnProperty.call(value, k)) { v = walk(value, k); if (v !== undefined) { value[k] = v; } else { delete value[k]; } } } } return reviver.call(holder, key, value); } text = String(text); cx.lastIndex = 0; if (cx.test(text)) { text = text.replace(cx, function (a) { return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4); }); } if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) { j = eval("(" + text + ")"); return typeof reviver === "function" ? walk({ "": j }, "") : j; } throw new SyntaxError("JSON.parse"); }; } }());

// Polyfill para btoa (codificação Base64) (ESSENCIAL)
var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function btoa(string) {
    string = String(string);
    var bitmap, a, b, c, result = "", i = 0, rest = string.length % 3;
    for (; i < string.length;) {
        if ((a = string.charCodeAt(i++)) > 255 || (b = string.charCodeAt(i++)) > 255 || (c = string.charCodeAt(i++)) > 255)
            throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");
        bitmap = (a << 16) | (b << 8) | c;
        result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63) + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
    }
    return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
};


(function (thisObj) {

    var geminiModel = "gemini-1.5-flash-latest";
    var apiKey = "AIzaSyB3PQ18ddzX1lQIInB0gYMiOE7s71Xv4LQ"; 

    var layerTextStates = {}; 

    function callGeminiAPI(textToCorrect, language) {
        var prompt;
        if (language === "Inglês") {
            prompt = "You are a professional English proofreader. Analyze the following text. Identify words with spelling errors. " +
                     "Respond ONLY with a raw JSON object in the format: " +
                     "{\"corrections\": [{\"word\": \"original_word\", \"suggestions\": [\"suggestion1\", \"suggestion2\"]}]} " +
                     "Do not use markdown formatting like ```json. If there are no errors, return {\"corrections\": []}. The text to analyze is: " +
                     JSON.stringify(textToCorrect);
        } else { 
            prompt = "Você é um revisor de texto profissional para o português do Brasil. Analise o texto a seguir. " +
                     "Identifique palavras com erros de ortografia. " +
                     "Responda APENAS com um objeto JSON bruto no formato: " +
                     "{\"corrections\": [{\"word\": \"palavra_errada\", \"suggestions\": [\"sugestao1\", \"sugestao2\"]}]} " +
                     "Não use formatação markdown como ```json. Se não houver erros, retorne {\"corrections\": []}. O texto para analisar é: " +
                     JSON.stringify(textToCorrect);
        }
        
        var requestBody = { "contents": [{ "parts": [{ "text": prompt }] }] };
        var bodyString = JSON.stringify(requestBody);
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModel + ':generateContent?key=' + apiKey;
        var command = "";

        // Codifica o corpo da requisição em Base64 para evitar problemas com caracteres especiais
        var base64Body = btoa(bodyString);

        if ($.os.indexOf("Windows") !== -1) {
            command = 'powershell -Command "$encodedBody = \'' + base64Body + '\'; $decodedBody = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encodedBody)); try { $response = Invoke-RestMethod -Uri \'' + url + '\' -Method Post -ContentType \'application/json\' -Body $decodedBody; ConvertTo-Json $response -Depth 10 } catch { Write-Error $_.Exception.Message; exit 1 }"';
        } else {
            command = "echo '" + base64Body + "' | base64 -d | curl -s -X POST -H \"Content-Type: application/json\" -d @- \"" + url + "\"";
        }
        
        var responseBody = system.callSystem(command);

        try {
            var jsonResponse = JSON.parse(responseBody);
            if (jsonResponse.candidates && jsonResponse.candidates.length > 0 && jsonResponse.candidates[0].content) {
                var geminiText = jsonResponse.candidates[0].content.parts[0].text;
                var cleanText = geminiText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
                return JSON.parse(cleanText);
            } else if (jsonResponse.error) {
                return { error: jsonResponse.error.message };
            } else {
                return { error: "Resposta inesperada da API. Resposta Bruta: " + responseBody};
            }
        } catch (e) {
            return { error: "Falha ao processar resposta da IA. Verifique sua chave de API e conexão. Resposta Bruta: " + responseBody };
        }
    }

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
            app.beginUndoGroup("Correção Ortográfica Gemini");
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
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Corretor Gemini (Navegação)", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 5;
        win.margins = 10;

        var optionsGroup = win.add("panel", undefined, "Opções");
        optionsGroup.orientation = 'row';
        optionsGroup.add("statictext", undefined, "Idioma da Correção:");
        var langDropdown = optionsGroup.add("dropdownlist", undefined, ["Português (Brasil)", "Inglês"]);
        langDropdown.selection = 0;

        var scanButton = win.add("button", undefined, "Verificar Composição Ativa");
        var statusText = win.add('statictext', undefined, 'Pronto para verificar.', { truncate: 'middle' });

        var resultsGroup = win.add("panel", undefined, "Erros Encontrados");
        resultsGroup.alignChildren = ["fill", "top"];
        resultsGroup.spacing = 5;

        var errorList = resultsGroup.add('listbox', undefined, [], { numberOfColumns: 2, showHeaders: true, columnTitles: ['Camada', 'Erro Encontrado'] });
        errorList.preferredSize = [400, 200];

        resultsGroup.add('statictext', undefined, 'Contexto (a palavra errada está entre <<< >>>):');
        var contextText = resultsGroup.add('edittext', undefined, '', { multiline: true, readonly: true });
        contextText.preferredSize = [400, 60];

        var navGroup = resultsGroup.add('group');
        navGroup.orientation = 'row';
        var prevBtn = navGroup.add('button', undefined, '<< Erro Anterior');
        var nextBtn = navGroup.add('button', undefined, 'Próximo Erro >>');

        var suggestionGroup = resultsGroup.add('group');
        suggestionGroup.orientation = 'row';
        suggestionGroup.alignment = 'left';
        suggestionGroup.add('statictext', undefined, 'Sugestões:');
        var suggestionDropdown = suggestionGroup.add('dropdownlist');
        suggestionDropdown.preferredSize.width = 180;
        var applyBtn = suggestionGroup.add('button', undefined, 'Corrigir esta palavra');

        var applyAllBtn = resultsGroup.add('button', undefined, 'APLICAR TODAS AS MUDANÇAS NO AFTER EFFECTS');

        scanButton.onClick = function () {
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
            var language = langDropdown.selection.text;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                layerTextStates[layer.id] = { layerObj: layer.layerObj, originalText: layer.text, currentText: layer.text };
                
                statusText.text = "Analisando camada " + (i + 1) + "/" + layers.length + ": '" + layer.name + "'";
                win.update();
                
                // Chamada Síncrona
                var response = callGeminiAPI(layer.text, language);

                if (response && response.corrections) {
                    for (var j = 0; j < response.corrections.length; j++) {
                        var c = response.corrections[j];
                        allCorrections.push({
                            layerId: layer.id,
                            layerName: layer.name,
                            word: c.word,
                            suggestions: c.suggestions || [c.word]
                        });
                    }
                } else if (response && response.error) {
                     allCorrections.push({
                        layerId: layer.id,
                        layerName: layer.name,
                        word: "ERRO DE API",
                        suggestions: [response.error.slice(0, 200) + "..."]
                    });
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
                var itemText = c.suggestions && c.suggestions.length > 0 ? ('"' + c.word + '" -> "' + c.suggestions[0] + '"') : '"' + c.word + '"';
                var item = errorList.add('item', c.layerName);
                item.subItems[0].text = itemText;
                item.correctionData = c;
            }
            if (errorList.items.length > 0) {
                errorList.selection = 0;
            }
            statusText.text = "Verificação concluída. " + corrections.length + " possíveis erros encontrados.";
        }

        function updateContext() {
            var selection = errorList.selection;
            if (!selection) {
                contextText.text = "";
                suggestionDropdown.removeAll();
                applyBtn.enabled = false;
                return;
            }

            var data = selection.correctionData;
            var fullText = layerTextStates[data.layerId].currentText;
            
            var wordEscaped = data.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var highlightedText = fullText.replace(new RegExp("(\\b" + wordEscaped + "\\b)", 'i'), '<<<$1>>>');
            contextText.text = highlightedText;
            
            suggestionDropdown.removeAll();
            if (data.suggestions) {
                for(var i=0; i<data.suggestions.length; i++){
                    suggestionDropdown.add('item', data.suggestions[i]);
                }
                suggestionDropdown.selection = 0;
            }
            applyBtn.enabled = data.word !== "ERRO DE API";
        }

        errorList.onChange = updateContext;

        nextBtn.onClick = function() {
            if (errorList.items.length > 0) {
                var newIndex = (errorList.selection ? errorList.selection.index : 0) + 1;
                if (newIndex >= errorList.items.length) newIndex = 0;
                errorList.selection = newIndex;
            }
        };
        prevBtn.onClick = function() {
            if (errorList.items.length > 0) {
                var newIndex = (errorList.selection ? errorList.selection.index : 0) - 1;
                if (newIndex < 0) newIndex = errorList.items.length - 1;
                errorList.selection = newIndex;
            }
        };
        
        applyBtn.onClick = function() {
            var selection = errorList.selection;
            if (!selection || !suggestionDropdown.selection) return;

            var data = selection.correctionData;
            var suggestion = suggestionDropdown.selection.text;
            var currentState = layerTextStates[data.layerId];
            
            var replaced = false;
            var regex = new RegExp("(\\b)" + data.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "(\\b)", "i");
            currentState.currentText = currentState.currentText.replace(regex, function(match, p1, p2) {
                if (!replaced) {
                    replaced = true;
                    return p1 + suggestion + p2;
                }
                return match;
            });

            var newIndex = selection.index;
            errorList.remove(selection);
            
            if(errorList.items.length > 0) {
                if (newIndex >= errorList.items.length) {
                    newIndex = errorList.items.length - 1;
                }
                errorList.selection = newIndex;
            } else {
                contextText.text = "Todas as correções foram aplicadas internamente. Clique em 'APLICAR' para salvar no AE.";
                suggestionDropdown.removeAll();
                applyBtn.enabled = false;
            }
            statusText.text = errorList.items.length + " erros restantes.";
        };

        applyAllBtn.onClick = function() {
            var layersToUpdate = {};
            for (var id in layerTextStates) {
                if (layerTextStates.hasOwnProperty(id) && layerTextStates[id].originalText !== layerTextStates[id].currentText) {
                    layersToUpdate[id] = layerTextStates[id];
                }
            }
            
            var count = 0;
            for(var id in layersToUpdate) {
                if (layersToUpdate.hasOwnProperty(id)) {
                    updateTextLayer(layersToUpdate[id].layerObj, layersToUpdate[id].currentText);
                    count++;
                }
            }
            
            if (count > 0) {
                alert(count + " camada(s) foram atualizadas no After Effects.");
            } else {
                alert("Nenhuma alteração pendente para aplicar.");
            }
            errorList.removeAll();
            statusText.text = "Alterações aplicadas com sucesso!";
            contextText.text = "";
        };

        if (win instanceof Window) { win.center(); win.show(); } else { win.layout.layout(true); }
    }

    createMainUI();

})(this);