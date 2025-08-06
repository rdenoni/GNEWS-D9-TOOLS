/*
  Script para Adobe After Effects: Buscador de Arquivos AEP com Filtro
  Autor: Gemini (Google AI)
  Versão: 2.0

  Descrição:
  Este script cria uma janela que permite ao usuário especificar uma pasta,
  buscar recursivamente por todos os arquivos .aep, e opcionalmente
  filtrar os resultados pelo nome do arquivo.
*/

(function aepFinderV2() {

    // Função principal que constrói e exibe a UI
    function buildUI() {
        var win = new Window("palette", "Buscador de Arquivos AEP", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 15;

        // --- GRUPO DE PASTA ---
        var folderGroup = win.add("group", undefined, { name: "folderGroup" });
        folderGroup.orientation = "row";
        folderGroup.alignChildren = ["left", "center"];
        folderGroup.spacing = 10;
        folderGroup.margins = 0;

        folderGroup.add("statictext", undefined, "Pasta:");
        var pathEditText = folderGroup.add("edittext", undefined, "");
        pathEditText.helpTip = "Digite o caminho da pasta ou use o botão para selecionar";
        pathEditText.preferredSize.width = 300;

        // Botão para selecionar pasta com símbolo Unicode (U+1F4C1 📁)
        var browseBtn = folderGroup.add("button", undefined, "📁");
        browseBtn.helpTip = "Selecionar pasta...";
        browseBtn.preferredSize.width = 40;
        
        // --- GRUPO DE FILTRO POR NOME ---
        var filterGroup = win.add("group", undefined, { name: "filterGroup" });
        filterGroup.orientation = "row";
        filterGroup.alignChildren = ["left", "center"];
        filterGroup.spacing = 10;
        filterGroup.margins = 0;
        
        filterGroup.add("statictext", undefined, "Filtrar por nome:");
        var filterEditText = filterGroup.add("edittext", undefined, "");
        filterEditText.helpTip = "Deixe em branco para encontrar todos os arquivos .aep";
        filterEditText.preferredSize.width = 300;

        // --- BOTÃO DE BUSCA ---
        var searchBtn = win.add("button", undefined, "Buscar");
        searchBtn.alignment = "fill";

        // --- ÁREA DE RESULTADOS ---
        var resultsGroup = win.add("panel", undefined, "Resultados Encontrados");
        resultsGroup.orientation = "column";
        resultsGroup.alignChildren = "fill";
        resultsGroup.margins = 10;

        var resultsList = resultsGroup.add("listbox", undefined, [], {
            numberOfColumns: 1,
            showHeaders: false,
            multiselect: false
        });
        resultsList.preferredSize.height = 300;

        // --- LÓGICA DOS BOTÕES E EVENTOS ---

        browseBtn.onClick = function() {
            var selectedFolder = Folder.selectDialog("Por favor, selecione a pasta para a busca");
            if (selectedFolder) {
                pathEditText.text = selectedFolder.fsName;
            }
        };

        searchBtn.onClick = function() {
            var rootPath = pathEditText.text;
            if (!rootPath || !Folder(rootPath).exists) {
                alert("O caminho especificado não é uma pasta válida. Por favor, corrija ou selecione uma pasta.", "Erro");
                return;
            }

            resultsList.removeAll();
            win.update(); 

            var foundFiles = [];
            var rootFolder = new Folder(rootPath);
            var filterText = filterEditText.text; // Pega o texto do filtro

            // Inicia a busca recursiva, passando o texto do filtro
            searchForAEPs(rootFolder, foundFiles, filterText);

            if (foundFiles.length === 0) {
                resultsList.add("item", "Nenhum arquivo .aep correspondente encontrado.");
            } else {
                for (var i = 0; i < foundFiles.length; i++) {
                    resultsList.add("item", decodeURI(foundFiles[i].fsName));
                }
            }
        };
        
        resultsList.onDoubleClick = function() {
            if (resultsList.selection) {
                var fileToOpen = new File(resultsList.selection.text);
                if (fileToOpen.exists) {
                    app.open(fileToOpen);
                } else {
                    alert("O arquivo não pode ser encontrado no caminho especificado.", "Erro ao Abrir");
                }
            }
        };

        // --- FUNÇÃO DE BUSCA RECURSIVA ATUALIZADA ---
        function searchForAEPs(currentFolder, fileArray, filterText) {
            var filesAndFolders = currentFolder.getFiles();
            for (var i = 0; i < filesAndFolders.length; i++) {
                var currentItem = filesAndFolders[i];
                if (currentItem instanceof Folder) {
                    // Se for uma pasta, chama a função novamente, passando o filtro adiante
                    searchForAEPs(currentItem, fileArray, filterText);

                } else if (currentItem instanceof File) {
                    var fileName = currentItem.name;
                    // Condição 1: Verifica se é um arquivo .aep (case-insensitive)
                    var isAEP = fileName.match(/\.aep$/i);
                    
                    // Condição 2: Verifica se o nome corresponde ao filtro (case-insensitive)
                    // Se o filtro estiver vazio, a condição será verdadeira para qualquer nome.
                    var nameMatches = (filterText.replace(/\s/g, '') === "") || (fileName.toLowerCase().indexOf(filterText.toLowerCase()) !== -1);

                    // Se ambas as condições forem verdadeiras, adiciona à lista
                    if (isAEP && nameMatches) {
                        fileArray.push(currentItem);
                    }
                }
            }
        }
        
        win.layout.layout(true);
        win.onResizing = win.onResize = function() { this.layout.resize(); };
        win.center();
        win.show();
    }
    
    buildUI();

})();