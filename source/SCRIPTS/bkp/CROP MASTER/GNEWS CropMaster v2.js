/*
    Ferramenta: CropComp (Criar Comp a partir da Imagem)
    Descrição: Cria novas composições a partir de um ou mais itens de metragem selecionados,
               com centralização e redimensionamento automático para preencher a largura.
    Versão: 3.1 (Batch Enabled + Themed)
*/

function GNEWS_CropComp_UI() {

    // --- LÓGICA PRINCIPAL ATUALIZADA PARA PROCESSAR MÚLTIPLOS ITENS ---
    function createCompsFromSelection(width, height) {
        try {
            var selectedItems = app.project.selection;
            var createdCount = 0;
            var skippedCount = 0;

            if (selectedItems.length === 0) {
                alert("Nenhum item selecionado. Por favor, selecione uma ou mais metragens (imagens ou vídeos).");
                return false;
            }

            app.beginUndoGroup("CropComp: Criar Comps a partir da Seleção");

            for (var i = 0; i < selectedItems.length; i++) {
                var currentItem = selectedItems[i];

                if (!(currentItem instanceof FootageItem)) {
                    skippedCount++;
                    continue; // Pula para o próximo item se não for uma metragem válida
                }

                var compName = currentItem.name;
                var compDuration = 10;
                var compFrameRate = currentItem.frameRate > 0 ? currentItem.frameRate : 30;

                var newComp = app.project.items.addComp(compName, width, height, 1, compDuration, compFrameRate);
                var newLayer = newComp.layers.add(currentItem);

                var anchorPoint = [currentItem.width / 2, currentItem.height / 2];
                newLayer.property("Anchor Point").setValue(anchorPoint);

                var position = [newComp.width / 2, newComp.height / 2];
                newLayer.property("Position").setValue(position);

                var scaleFactor = (width / currentItem.width) * 100;
                newLayer.property("Scale").setValue([scaleFactor, scaleFactor]);

                createdCount++;
            }

            // Exibe um resumo da operação
            if (createdCount > 0 || skippedCount > 0) {
                alert("Processo finalizado!\n\nComposições criadas: " + createdCount + "\nItens ignorados (não eram metragens): " + skippedCount);
            } else {
                 alert("Nenhuma metragem válida foi encontrada na sua seleção.");
            }

            return true;

        } catch (e) {
            alert("Ocorreu um erro ao criar as composições:\n" + e.toString());
            return false;
        } finally {
            app.endUndoGroup();
        }
    }

    // --- INTERFACE GRÁFICA REDESENHADA COM O TEMA PADEIRO (E LÓGICA DE LOTE) ---
    function buildUI() {
        if (app.project.selection.length === 0) {
            alert("Por favor, selecione uma ou mais metragens (imagens ou vídeos) no painel de Projeto antes de usar o CropComp.");
            return;
        }

        var win = new Window("palette", "CropComp", undefined, { resizeable: false });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 15;

        // Assumindo que as variáveis e funções de tema (bgColor1, setBgColor, etc.) estão disponíveis no escopo.
        setBgColor(win, bgColor1);

        // --- Grupo do Título e Ajuda ---
        var headerGrp = win.add('group');
        headerGrp.alignment = 'fill';
        headerGrp.orientation = 'stack';
        var title = headerGrp.add('statictext', undefined, 'Criar Comp a partir da Imagem');
        title.alignment = 'left';
        setFgColor(title, normalColor1);
        var helpGrp = headerGrp.add('group');
        helpGrp.alignment = 'right';
        var helpBtn = new themeIconButton(helpGrp, { 
            icon: D9T_INFO_ICON, 
            tips: [lClick + 'Ajuda sobre o processo em lote'] 
        });

        // --- Grupo de Inputs (Largura e Altura) ---
        var inputGroup = win.add("group");
        inputGroup.orientation = "row";
        inputGroup.spacing = 10;
        inputGroup.alignChildren = ["left", "center"];

        var widthLabel = inputGroup.add("statictext", undefined, "Largura:");
        setFgColor(widthLabel, monoColor1);
        var widthInput = inputGroup.add("edittext", undefined, "1920");
        widthInput.preferredSize.width = 60;

        var heightLabel = inputGroup.add("statictext", undefined, "Altura:");
        setFgColor(heightLabel, monoColor1);
        var heightInput = inputGroup.add("edittext", undefined, "1080");
        heightInput.preferredSize.width = 60;

        // --- Grupo do Botão de Ação ---
        var buttonGroup = win.add("group");
        buttonGroup.alignment = ["center", "center"];
        
        var createBtnCtrl = new themeButton(buttonGroup, {
            labelTxt: "Criar Composições", // Texto atualizado para o plural
            width: 180,
            height: 34,
            tips: [lClick + "Executa a criação de comps para todos os itens selecionados."], // Dica atualizada
            buttonColor: monoColor3,
            textColor: monoColor1
        });

        // --- Lógica de Eventos da UI ---
        createBtnCtrl.leftClick.onClick = function () {
            var w = parseInt(widthInput.text);
            var h = parseInt(heightInput.text);

            if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
                alert("Por favor, insira valores numéricos válidos para Largura e Altura.");
                return;
            }
            if (createCompsFromSelection(w, h)) {
                win.close();
            }
        };

        helpBtn.leftClick.onClick = function() {
            alert("Ajuda - CropComp (Lote)\n\n1. Selecione UMA OU MAIS imagens/vídeos no painel de Projeto.\n2. Insira a Largura e Altura desejadas para as novas composições.\n3. Clique em 'Criar Composições'.\n\nUma nova composição será criada para cada item de metragem válido na sua seleção.");
        };

        win.onEnterKey = function() {
            createBtnCtrl.leftClick.notify();
        };

        win.center();
        win.show();
    }

    // Executa a função que constrói a UI
    buildUI();
}

// Executa o módulo principal da UI
GNEWS_CropComp_UI();