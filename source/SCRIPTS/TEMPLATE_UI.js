/*
GNEWS - Script de Automação para After Effects
Desenvolvido para otimizar o workflow de produção jornalística
*/

(function() {
    // Verificar se o After Effects está disponível
    if (typeof app === 'undefined') {
        alert("Este script deve ser executado no Adobe After Effects");
        return;
    }

    // Interface principal
    function criarInterface() {
        var janela = new Window("dialog", "GNEWS - Automação de Produção");
        janela.orientation = "column";
        janela.alignChildren = ["fill", "top"];
        janela.spacing = 10;
        janela.margins = 16;

        // Header da emissora
        var headerPanel = janela.add("panel", undefined, "GNEWS - Sistema de Automação");
        headerPanel.orientation = "row";
        headerPanel.alignChildren = ["left", "center"];
        headerPanel.margins = 10;

        var logoText = headerPanel.add("statictext", undefined, "📺 GNEWS");
        logoText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);

        // Área de preview expandida
        var previewGroup = janela.add("group");
        previewGroup.orientation = "column";
        previewGroup.alignChildren = ["fill", "top"];
        
        var previewLabel = previewGroup.add("statictext", undefined, "Preview do Projeto:");
        previewLabel.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
        
        var previewPanel = previewGroup.add("panel");
        previewPanel.preferredSize.width = 500;
        previewPanel.preferredSize.height = 300;
        previewPanel.add("statictext", undefined, "Área de Preview Expandida\n\nComposições ativas serão exibidas aqui\ncom informações detalhadas do projeto");

        // Informações do projeto
        var infoGroup = janela.add("group");
        infoGroup.orientation = "column";
        infoGroup.alignChildren = ["fill", "top"];
        
        var infoPanel = infoGroup.add("panel", undefined, "Informações do Projeto");
        infoPanel.orientation = "column";
        infoPanel.alignChildren = ["fill", "top"];
        infoPanel.margins = 10;
        infoPanel.spacing = 8;

        // Código da arte
        var codigoGroup = infoPanel.add("group");
        codigoGroup.add("statictext", undefined, "Código da Arte:");
        var codigoText = codigoGroup.add("edittext", undefined, "");
        codigoText.preferredSize.width = 200;
        codigoText.text = obterCodigoProjeto();

        // Caminho para export
        var caminhoGroup = infoPanel.add("group");
        caminhoGroup.add("statictext", undefined, "Caminho Export:");
        var caminhoText = caminhoGroup.add("edittext", undefined, "");
        caminhoText.preferredSize.width = 350;
        caminhoText.text = obterCaminhoExport();

        // Última atualização
        var atualizacaoGroup = infoPanel.add("group");
        atualizacaoGroup.add("statictext", undefined, "Última Atualização:");
        var atualizacaoText = atualizacaoGroup.add("statictext", undefined, "");
        atualizacaoText.preferredSize.width = 200;
        atualizacaoText.text = obterUltimaAtualizacao();

        // Ferramentas de automação
        var ferramentasPanel = janela.add("panel", undefined, "Ferramentas de Automação");
        ferramentasPanel.orientation = "column";
        ferramentasPanel.alignChildren = ["fill", "top"];
        ferramentasPanel.margins = 10;

        // Botões de ação
        var botoesGroup1 = ferramentasPanel.add("group");
        var btnImportar = botoesGroup1.add("button", undefined, "📁 Importar Mídia");
        var btnProcessar = botoesGroup1.add("button", undefined, "⚙️ Processar Automático");
        var btnExportar = botoesGroup1.add("button", undefined, "📤 Exportar Final");

        var botoesGroup2 = ferramentasPanel.add("group");
        var btnTemplates = botoesGroup2.add("button", undefined, "📋 Aplicar Template");
        var btnLegendas = botoesGroup2.add("button", undefined, "💬 Gerar Legendas");
        var btnPreview = botoesGroup2.add("button", undefined, "▶️ Preview Rápido");

        // Status bar
        var statusGroup = janela.add("group");
        statusGroup.alignment = ["fill", "bottom"];
        var statusText = statusGroup.add("statictext", undefined, "Sistema GNEWS pronto para uso");
        statusText.graphics.font = ScriptUI.newFont("Arial", "ITALIC", 10);

        // Eventos dos botões
        btnImportar.onClick = function() {
            importarMidia();
            atualizarInterface();
        };

        btnProcessar.onClick = function() {
            processarAutomatico();
            statusText.text = "Processamento automático concluído";
        };

        btnExportar.onClick = function() {
            exportarProjeto();
            statusText.text = "Exportação iniciada";
        };

        btnTemplates.onClick = function() {
            aplicarTemplate();
            statusText.text = "Template aplicado com sucesso";
        };

        btnLegendas.onClick = function() {
            gerarLegendas();
            statusText.text = "Legendas processadas";
        };

        btnPreview.onClick = function() {
            previewRapido();
            statusText.text = "Preview gerado";
        };

        // Botões de controle
        var controlGroup = janela.add("group");
        controlGroup.alignment = ["fill", "bottom"];
        var btnAtualizar = controlGroup.add("button", undefined, "🔄 Atualizar Info");
        var btnFechar = controlGroup.add("button", undefined, "❌ Fechar");

        btnAtualizar.onClick = function() {
            codigoText.text = obterCodigoProjeto();
            caminhoText.text = obterCaminhoExport();
            atualizacaoText.text = obterUltimaAtualizacao();
            statusText.text = "Informações atualizadas";
        };

        btnFechar.onClick = function() {
            janela.close();
        };

        // Funções auxiliares locais
        function atualizarInterface() {
            codigoText.text = obterCodigoProjeto();
            caminhoText.text = obterCaminhoExport();
            atualizacaoText.text = obterUltimaAtualizacao();
        }

        return janela;
    }

    // Funções de automação específicas para GNEWS
    function obterCodigoProjeto() {
        if (app.project && app.project.file) {
            var nome = app.project.file.name;
            var codigo = nome.match(/GNEWS[\-_]?(\d{4,6})/i);
            return codigo ? "GNEWS-" + codigo[1] : "Sem código definido";
        }
        return "Projeto não salvo";
    }

    function obterCaminhoExport() {
        if (app.project && app.project.file) {
            var caminho = app.project.file.parent.fsName;
            return caminho + "/Export/";
        }
        return "Definir caminho de export";
    }

    function obterUltimaAtualizacao() {
        if (app.project && app.project.file) {
            var data = app.project.file.modified;
            return data.toLocaleDateString() + " " + data.toLocaleTimeString();
        }
        return "Não disponível";
    }

    function importarMidia() {
        app.beginUndoGroup("GNEWS - Importar Mídia");
        
        try {
            var arquivos = File.openDialog("Selecionar arquivos de mídia", "*.mov;*.mp4;*.avi;*.mxf;*.wav;*.aif", true);
            
            if (arquivos && arquivos.length > 0) {
                // Criar pasta organizada no projeto
                var pastaImportacao = app.project.items.addFolder("Importados_" + new Date().getTime());
                
                for (var i = 0; i < arquivos.length; i++) {
                    var novoItem = app.project.importFile(new ImportOptions(arquivos[i]));
                    novoItem.parentFolder = pastaImportacao;
                }
                
                alert("Importação concluída: " + arquivos.length + " arquivos importados");
            }
        } catch (e) {
            alert("Erro na importação: " + e.toString());
        }
        
        app.endUndoGroup();
    }

    function processarAutomatico() {
        app.beginUndoGroup("GNEWS - Processamento Automático");
        
        try {
            // Otimizar composições para broadcast
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof CompItem) {
                    // Configurações padrão GNEWS
                    item.frameRate = 29.97;
                    item.resolutionFactor = [1, 1];
                    
                    // Aplicar correções de cor padrão
                    aplicarCorrecoesPadrao(item);
                }
            }
            
            alert("Processamento automático concluído");
        } catch (e) {
            alert("Erro no processamento: " + e.toString());
        }
        
        app.endUndoGroup();
    }

    function aplicarCorrecoesPadrao(comp) {
        // Aplicar ajustes de cor padrão para broadcast
        if (comp.selectedLayers.length > 0) {
            var layer = comp.selectedLayers[0];
            var efeito = layer.Effects.addProperty("ADBE Color Balance 2");
            // Configurações específicas GNEWS podem ser adicionadas aqui
        }
    }

    function exportarProjeto() {
        if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            alert("Selecione uma composição para exportar");
            return;
        }

        app.beginUndoGroup("GNEWS - Exportar");
        
        try {
            var comp = app.project.activeItem;
            var renderQueue = app.project.renderQueue;
            
            var renderItem = renderQueue.items.add(comp);
            var outputModule = renderItem.outputModule(1);
            
            // Configurações de export para GNEWS
            var caminhoExport = obterCaminhoExport();
            var nomeArquivo = obterCodigoProjeto() + "_FINAL.mov";
            
            var arquivo = new File(caminhoExport + nomeArquivo);
            outputModule.file = arquivo;
            
            // Template de saída otimizado para broadcast
            try {
                outputModule.applyTemplate("Broadcast Features");
            } catch (e) {
                // Template padrão se não encontrar o específico
                outputModule.applyTemplate("Lossless");
            }
            
            alert("Exportação configurada. Pressione render na fila de renderização.");
        } catch (e) {
            alert("Erro na exportação: " + e.toString());
        }
        
        app.endUndoGroup();
    }

    function aplicarTemplate() {
        var templateFile = File.openDialog("Selecionar template GNEWS", "*.aet;*.aep");
        
        if (templateFile) {
            app.beginUndoGroup("GNEWS - Aplicar Template");
            
            try {
                // Importar template como composição
                var templateItem = app.project.importFile(new ImportOptions(templateFile));
                alert("Template aplicado: " + templateFile.name);
            } catch (e) {
                alert("Erro ao aplicar template: " + e.toString());
            }
            
            app.endUndoGroup();
        }
    }

    function gerarLegendas() {
        if (!app.project.activeItem) {
            alert("Selecione uma composição");
            return;
        }

        app.beginUndoGroup("GNEWS - Gerar Legendas");
        
        try {
            var comp = app.project.activeItem;
            var layerLegenda = comp.layers.addText("TEXTO DA LEGENDA");
            
            // Estilo padrão GNEWS para legendas
            var textProp = layerLegenda.property("Source Text");
            var textDocument = textProp.value;
            
            textDocument.fontSize = 24;
            textDocument.fillColor = [1, 1, 1]; // Branco
            textDocument.strokeColor = [0, 0, 0]; // Contorno preto
            textDocument.strokeWidth = 2;
            textDocument.font = "Arial-BoldMT";
            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
            
            textProp.setValue(textDocument);
            
            // Posicionar na parte inferior
            layerLegenda.transform.position.setValue([comp.width/2, comp.height - 80]);
            
            alert("Camada de legenda criada");
        } catch (e) {
            alert("Erro ao gerar legendas: " + e.toString());
        }
        
        app.endUndoGroup();
    }

    function previewRapido() {
        if (app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            comp.openInViewer();
            
            // Configurar preview otimizado
            app.activeViewer.setActive();
            
            alert("Preview configurado para composição: " + comp.name);
        } else {
            alert("Selecione uma composição para preview");
        }
    }

    // Inicializar interface
    var interfaceGNEWS = criarInterface();
    interfaceGNEWS.show();

})();