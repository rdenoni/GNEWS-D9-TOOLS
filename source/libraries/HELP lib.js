// ==========================================================
// HELP lib.js - v5.7 - Correção de Escopo Global
//
// DESCRIÇÃO:
// Biblioteca central de ajuda para o GND9TOOLS.
// Contém o construtor de janelas e os textos de todos os módulos.
//
// ATUALIZAÇÃO v5.7:
// - Alterado o fechamento da IIFE para ($.global) para garantir
//   que as funções sejam acessíveis por scripts externos.
// - Corrigido aninhamento incorreto entre showCopyLinksHelp e SearchLayers.
// ==========================================================

$.encoding = "UTF-8";

(function(thisObj) {

    // =================================================================================
    // --- CONSTRUTOR DE JANELA DE AJUDA UNIVERSAL ---
    // =================================================================================

    function createHelpWindow(windowTitle, headerTitle, description, topicsData) {
        try {
            // --- Tema Padrão com Fallback ---
            var theme = {
                bgColor: (typeof bgColor1 !== 'undefined') ? bgColor1 : '#0B0D0E',
                normalColor: (typeof monoColor1 !== 'undefined') ? monoColor1 : '#C7C8CA',
                highlightColor: (typeof highlightColor1 !== 'undefined') ? highlightColor1 : '#d4003cff',
                fontTitle: ScriptUI.newFont("Arial", "Bold", 16),
                fontTopicTitle: ScriptUI.newFont("Arial", "Bold", 12),
                fontTopicText: ScriptUI.newFont("Arial", "Regular", 11),
                windowWidth: 500,
                margins: 15,
                spacing: 10,
                tabMargins: [10, 15, 10, 10]
            };

            // --- Funções de Cor Internas com Fallback ---
            var _hexToRgb = (typeof hexToRgb !== 'undefined') ? hexToRgb : function(hex) {
                if (typeof hex !== 'string' || hex === "") return [0, 0, 0];
                hex = hex.replace("#", "");
                var r = parseInt(hex.substring(0, 2), 16) / 255;
                var g = parseInt(hex.substring(2, 4), 16) / 255;
                var b = parseInt(hex.substring(4, 6), 16) / 255;
                return [r, g, b];
            };
            var _setBgColor = (typeof setBgColor !== 'undefined') ? setBgColor : function(element, hexColor) {
                try {
                    var color = _hexToRgb(hexColor);
                    element.graphics.backgroundColor = element.graphics.newBrush(element.graphics.BrushType.SOLID_COLOR, color);
                } catch (e) {}
            };
            var _setFgColor = (typeof setFgColor !== 'undefined') ? setFgColor : function(element, hexColor) {
                try {
                    var color = _hexToRgb(hexColor);
                    element.graphics.foregroundColor = element.graphics.newPen(element.graphics.PenType.SOLID_COLOR, color, 1);
                } catch (e) {}
            };
            
            // --- Construção da Janela ---
            var helpWin = new Window("palette", windowTitle, undefined, { closeButton: true });
            helpWin.orientation = "column";
            helpWin.alignChildren = ["fill", "fill"];
            helpWin.spacing = theme.spacing;
            helpWin.margins = theme.margins;
            helpWin.preferredSize.width = theme.windowWidth;

            var headerPanel = helpWin.add("panel", undefined, "");
            headerPanel.alignment = 'fill';
            headerPanel.margins = theme.margins;
            headerPanel.alignChildren = 'left';

            var titleText = headerPanel.add("statictext", undefined, headerTitle);
            var descText = headerPanel.add("statictext", undefined, description, { multiline: true });
            
            // Define a largura do subtítulo para preencher o painel
            descText.preferredSize.width = theme.windowWidth - (theme.margins * 4);
            descText.preferredSize.height = 40;
            
            var topicsTabPanel = helpWin.add("tabbedpanel");
            topicsTabPanel.alignment = ["fill", "fill"];

            var elementsToStyle = [];

            var textBlockWidth = theme.windowWidth - (theme.margins * 2) - (theme.tabMargins[0] + theme.tabMargins[2]) - 20;

            for (var s = 0; s < topicsData.length; s++) {
                var tab = topicsTabPanel.add("tab", undefined, topicsData[s].tabName.toUpperCase());
                tab.margins = theme.tabMargins;
                tab.alignChildren = 'left';
                for (var i = 0; i < topicsData[s].topics.length; i++) {
                    var topic = topicsData[s].topics[i];
                    var topicGrp = tab.add("group");
                    topicGrp.orientation = "column";
                    topicGrp.alignChildren = "fill";
                    topicGrp.spacing = 3;
                    var topicTitle = topicGrp.add("statictext", undefined, topic.title);
                    elementsToStyle.push({element: topicTitle, font: theme.fontTopicTitle, color: theme.highlightColor});

                    if (topic.text && topic.text !== "") {
                        var topicText = topicGrp.add("statictext", undefined, topic.text, { multiline: true });
                        topicText.preferredSize.width = textBlockWidth;
                        elementsToStyle.push({element: topicText, font: theme.fontTopicText, color: theme.normalColor});
                    }
                }
            }
            
            var closeBtn = helpWin.add("button", undefined, "Fechar", {name: "ok"});
            closeBtn.alignment = "center";
            closeBtn.onClick = function() { helpWin.close(); };

            helpWin.onShow = function() {
                _setBgColor(this, theme.bgColor);
                
                titleText.graphics.font = theme.fontTitle;
                _setFgColor(titleText, theme.highlightColor);

                descText.graphics.font = theme.fontTopicText;
                _setFgColor(descText, theme.normalColor);

                for (var i = 0; i < elementsToStyle.length; i++) {
                    var styleInfo = elementsToStyle[i];
                    styleInfo.element.graphics.font = styleInfo.font;
                    _setFgColor(styleInfo.element, styleInfo.color);
                }
                try { this.active = true; } catch (focusErr) {}
                try {
                    if (typeof this.bringToFront === 'function') { this.bringToFront(); }
                } catch (focusErr2) {}
            };

            helpWin.center();
            helpWin.show();
            try { helpWin.active = true; } catch (focusErr3) {}
            try {
                if (typeof helpWin.bringToFront === 'function') { helpWin.bringToFront(); }
            } catch (focusErr4) {}

        } catch (e) {
            alert("Erro ao criar a janela de ajuda para '" + windowTitle + "':\n" + e.toString());
        }
    }

    // =================================================================================
    // --- FUNÇÕES PÚBLICAS (Atalhos que fornecem o conteúdo) ---
    // =================================================================================

    thisObj.showTemplatesHelp = function() {
        var windowTitle = "Ajuda - GNEWS Templates";
        var headerTitle = "AJUDA - GNEWS TEMPLATES";
        var description = "Gerencie e preencha templates GNEWS com informações automáticas das artes.";
        var topicsData = [
            {
                tabName: "VISÃO GERAL",
                topics: [
                    { title: "▶ SELEÇÃO DE TEMPLATE:", text: "Navegue pela árvore à esquerda para selecionar um template (.aep ou .aet). O preview aumentado e informações da arte GNEWS aparecerão à direita." },
                    { title: "▶ PREVIEW AUMENTADO:", text: "Visualização maior dos templates para melhor análise visual antes do processamento." },
                    { title: "▶ ATUALIZAR LISTA (🔄):", text: "Recarrega a lista de templates na árvore." },
                    { title: "▶ ABRIR PASTA (📁):", text: "Abre o diretório onde os templates estão armazenados." },
                ]
            },
            {
                tabName: "INFORMAÇÕES GNEWS",
                topics: [
                    { title: "▶ CÓDIGO:", text: "Digite o código da arte GNEWS (ex: GNVZ036). As informações são carregadas automaticamente do banco de dados." },
                    { title: "▶ NOME DA ARTE:", text: "Exibido automaticamente baseado no código informado." },
                    { title: "▶ SERVIDOR DESTINO:", text: "Servidor de destino da arte, carregado automaticamente (ex: FTP VIZ, PAM HARDNEWS)." },
                    { title: "▶ ÚLTIMA ATUALIZAÇÃO:", text: "Data da última modificação/processamento da arte." },
                ]
            },
            {
                tabName: "PROCESSAMENTO",
                topics: [
                    { title: "▶ IMPORTAR:", text: "Importa o template diretamente para o projeto e registra informações GNEWS no log." },
                    { title: "▶ LOG GNEWS:", text: "Registra informações específicas GNEWS incluindo código da arte, nome e servidor destino." },
                ]
            },
            {
                tabName: "ATALHOS",
                topics: [
                    { title: "▶ DUPLO CLIQUE:", text: "Duplo clique em um template importa diretamente sem processamento de texto." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showCopyLinksHelp = function() {
        var windowTitle = "Ajuda - GNEWS CopyLinks";
        var headerTitle = "AJUDA - GNEWS COPYLINKS";
        var description = "Ferramenta para acesso rápido a links, pastas e arquivos importantes.";
        var topicsData = [
            {
                tabName: "USO BÁSICO",
                topics: [
                    { title: "▶ SELEÇÃO DE GRUPO:", text: "Use o menu 'Grupo' no topo da janela para alternar entre diferentes conjuntos de links organizados." },
                    { title: "▶ BOTÕES DE LINK:", text: "Cada botão principal abre o link, pasta ou arquivo correspondente. O ícone ao lado do nome indica o tipo de destino (ex: 📄 para PDF, 📁 para pasta, 🌐 para web)." },
                ]
            },
            {
                tabName: "AÇÕES",
                topics: [
                    { title: "▶ ACESSO RÁPIDO (⭐):", text: "Disponível apenas no Windows. Adiciona a pasta do link ao 'Acesso Rápido' do Explorador de Arquivos para facilitar o acesso futuro. Visível apenas para links de pastas não-web." },
                    { title: "▶ COPIAR CAMINHO (📋):", text: "Copia o caminho completo (URL ou diretório) do link para a área de transferência. Necessita de permissão de 'Acesso a Rede' nas Preferências do After Effects." },
                    { title: "▶ CAMPO EDITÁVEL:", text: "O campo de texto ao lado dos botões permite visualizar e editar o caminho do link temporariamente. O ícone do botão principal se adapta à mudança de caminho para refletir o novo tipo de arquivo/pasta." },
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    // Ajuda para GNEWS SearchLayers
    thisObj.showSearchLayersHelp = function() {
        var windowTitle = "Ajuda - GNEWS SearchLayers";
        var headerTitle = "AJUDA - BUSCA DE CAMADAS";
        var description = "Localiza camadas de texto em comps com filtros de visibilidade, maiusculas e acentuacao.";
        var topicsData = [
            {
                tabName: "USO BASICO",
                topics: [
                    { title: " ▶ TERMO DE BUSCA:", text: "Digite o texto e pressione Enter ou clique na lupa. A busca percorre camadas de texto das comps." },
                    { title: " ▶ NAVEGAR RESULTADOS:", text: "Clique no nome da comp para expandir. Clique em uma camada para seleciona-la e ir ao tempo correspondente." }
                ]
            },
            {
                tabName: "OPCOES",
                topics: [
                    { title: " ▶ APENAS VISIVEIS (olho):", text: "Considera apenas camadas com o 'olho' ativo e nao shy ocultas." },
                    { title: " ▶ MAIUSCULAS/minusculas (Tt):", text: "Se marcado, diferencia maiusculas/minusculas." },
                    { title: " ▶ ACENTOS (AA):", text: "Se marcado, considera acentuacao; se desmarcado, normaliza sem acentos." },
                    { title: " ▶ INVERTER (!=):", text: "Retorna camadas que nao contem o termo digitado." }
                ]
            },
            {
                tabName: "RESULTADOS",
                topics: [
                    { title: " ▶ EXPANDIR LISTA:", text: "Cada comp listada tem as camadas que casaram com o termo." },
                    { title: " ▶ SELECIONAR CAMADA:", text: "Ao clicar, a camada e selecionada, shy e revelado e o tempo da comp e ajustado." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showAnchorAlignHelp = function() {
        var windowTitle = "Ajuda - AnchorAlign";
        var headerTitle = "AJUDA - ANCHORALIGN";
        var description = "Esta ferramenta ajusta o ponto de âncora de camadas ou grupos de shape layers.";
        var topicsData = [
            {
                tabName: "ÂNCORA",
                topics: [
                    { title: "▶ REPOSICIONAR ÂNCORA:", text: "Clique nos botões de grid para mover o ponto de âncora para uma das 9 posições padrão (cantos, meios, centro) do item selecionado. A posição da camada é automaticamente ajustada para compensar a mudança." }
                ]
            },
            {
                tabName: "OPÇÕES",
                topics: [
                    { title: "▶ Considerar máscaras nos limites:", text: "Se marcado, o cálculo da área visível da camada levará em conta as máscaras aplicadas. Se desmarcado, ele usará os limites originais da camada." },
                    { title: "▶ Ignorar camadas bloqueadas:", text: "Não processa camadas que estão bloqueadas no painel Timeline. Recomendado para evitar alterações acidentais." },
                    { title: "▶ Ignorar camadas com animação:", text: "Não processa camadas que possuem keyframes ou expressões na propriedade 'Transform'. Isso evita problemas com animações complexas que dependem da posição ou ponto de âncora atual." }
                ]
            },
            {
                tabName: "SELEÇÃO",
                topics: [
                    { title: "▶ SELEÇÃO AUTOMÁTICA:", text: "A ferramenta tenta adivinhar o que você quer ajustar com base na seleção:\n  - Propriedades de grupo de shape (Transform Group ou Vector Group).\n  - Camadas selecionadas na Timeline.\n  - Se nenhuma camada estiver selecionada, todas as camadas na comp ativa.\n  - Se comps estiverem selecionadas no Projeto, todas as camadas dessas comps." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showRenamerHelp = function() {
        var windowTitle = "Ajuda - GNEWS Renamer";
        var headerTitle = "AJUDA - RENOMEAR, SALVAR E ORGANIZAR";
        var description = "Esta ferramenta padroniza nomes de comps, salva projetos e organiza arquivos.";
        var topicsData = [
            {
                tabName: "CONSTRUTOR E AÇÕES",
                topics: [
                    { title: "▶ CONSTRUTOR DE NOMES:", text: "Use os menus e campos para gerar um nome padronizado. O resultado aparece no painel de preview." },
                    { title: "▶ BOTÕES DE AÇÃO:", text: "" },
                    { title: "  - Capturar:", text: "Preenche os campos com base na composição selecionada no projeto." },
                    { title: "  - Criar:", text: "Cria uma nova composição vazia utilizando o nome gerado." },
                    { title: "  - Renomear:", text: "Aplica o nome gerado a todas as composições que estiverem selecionadas." },
                    { title: "  - Copiar:", text: "Copia o nome da composição atualmente ativa para a área de transferência." },
                    { title: "  - Salvar:", text: "Salva uma cópia do projeto (.aep) com um nome padronizado, incluindo a tag do seu nome." }
                ]
            },
            {
                tabName: "ORGANIZADOR",
                topics: [
                    { title: "▶ ORGANIZAR PROJETO:", text: "1. Reduz o projeto (remove itens não utilizados).\n2. Reorganiza todos os arquivos restantes do projeto em pastas padrão (COMPS, PRECOMPS, ARQUIVOS, etc)." },
                    { title: "  - Regra de Proteção:", text: "Composições cujo nome começa com 'GNEWS' ou as que estiverem selecionadas no painel 'Projeto' serão mantidas na raiz para evitar pré-composição acidental." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showMailMakerHelp = function() {
        var windowTitle = "Ajuda - GNEWS MailMaker";
        var headerTitle = "AJUDA - GNEWS MAILMAKER";
        var description = "Automatiza a criação de e-mails para envio de artes, capturando informações do projeto e permitindo personalização rápida.";
        var topicsData = [
            {
                tabName: "USO BÁSICO",
                topics: [
                    { title: "▶ CAPTURAR COMPOSIÇÃO:", text: "Selecione uma ou mais composições no painel de Projeto e clique em 'Capturar'. O nome da(s) comp(s) e o nome do editor (se detectado no nome) serão preenchidos automaticamente." },
                    { title: "▶ PERSONALIZAÇÃO:", text: "Use os menus 'Saudação', 'Despedida' e 'Emoji' para customizar o início e o fim do seu e-mail. Suas escolhas são salvas automaticamente." },
                    { title: "▶ TEMPLATES DE MENSAGEM:", text: "Escolha um template de mensagem no menu 'Template'. Você pode editar o texto livremente no campo de descrição; ao fazer isso, o template mudará para 'Personalizado'." },
                    { title: "▶ PRÉ-VISUALIZAÇÃO:", text: "O painel à direita mostra em tempo real como seu e-mail ficará."}
                ]
            },
            {
                tabName: "AÇÕES E DESTINO",
                topics: [
                    { title: "▶ BOTÕES DE AÇÃO:", text: "" },
                    { title: "  - Capturar:", text: "Captura as composições selecionadas na timeline ou no painel de projeto." },
                    { title: "  - Detectar:", text: "Captura a comp e tenta adivinhar o destino correto baseado em regras de nomenclatura." },
                    { title: "  - Preview:", text: "Renderiza e salva um frame (PNG) da(s) comp(s) capturada(s) em uma pasta '_PREVIEWS' para verificação rápida. Abre a pasta ao finalizar." },
                    { title: "  - Copiar:", text: "Copia todo o texto do painel de pré-visualização para a área de transferência, pronto para colar no seu e-mail." },
                    { title: "▶ CONFIGURAÇÃO DE DESTINO:", text: "Selecione um 'Preset de Destino' na lista para preencher o caminho automaticamente, ou preencha os campos 'Destino Manual' e 'Caminho Manual' se necessário."}
                ]
            },
            {
                tabName: "OPÇÕES AVANÇADAS",
                topics: [
                    { title: "▶ OPÇÕES DE VISUALIZAÇÃO:", text: "" },
                    { title: "  - Caminho:", text: "Marque esta caixa para incluir o caminho completo do servidor na mensagem do e-mail. Desmarque para mostrar apenas o nome do destino." },
                    { title: "  - Dados para Equipe:", text: "Marque esta caixa para adicionar um bloco de informações técnicas no final do e-mail, contendo o caminho do projeto salvo e os caminhos de saída de render do Render Queue e Media Encoder." },
                    { title: "▶ REQUISITO DE PERMISSÃO:", text: "As funções 'Copiar' e 'Preview' precisam de permissão para acessar a rede e escrever arquivos. Se solicitado, habilite a opção 'Allow Scripts to Write Files and Access Network' nas preferências do After Effects (Edit > Preferences > Scripting & Expressions)."}
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showLibraryLiveHelp = function() {
        var windowTitle = "Ajuda - LibraryLive";
        var headerTitle = "AJUDA - LIBRARYLIVE";
        var description = "Esta ferramenta permite navegar, buscar e importar mídias (ícones e imagens) diretamente para o seu projeto.";
        var topicsData = [
            {
                tabName: "FUNCIONALIDADES",
                topics: [
                    { title: "▶ Navegação e Visualização", text: "Use o menu 'Pasta' para alternar entre a visualização de 'Icones' (quadrados) e 'Imagens' (16:9). A grade e o painel de preview se ajustarão automaticamente." },
                    { title: "▶ Importar um Item (Duplo-Clique)", text: "Dê um duplo-clique em qualquer item para importá-lo para o seu projeto atual. Se uma composição estiver aberta, o item será adicionado como uma nova camada no centro." },
                    { title: "▶ Ver Detalhes (Clique Simples)", text: "Clique uma vez em um item para selecioná-lo. Isso exibirá uma pré-visualização maior e informações detalhadas como nome, tipo, tamanho e data no painel 'Detalhes' à direita." },
                    { title: "▶ Paginação", text: "Use as setas ◄ e ► abaixo da grade para navegar entre as páginas de resultados." }
                ] 
            },
            { 
                tabName: "BUSCA E CONFIGURAÇÃO", 
                topics: [
                    { title: "▶ Busca e Filtros", text: "Digite no campo 'Buscar' para filtrar os itens por nome. Use os menus 'Categoria' e 'Ordenar por' para refinar ainda mais os resultados." },
                    { title: "▶ Botão de Atualizar (↻)", text: "Clique neste botão para forçar o script a re-escanear suas pastas de origem. Use isso se você adicionou, removeu ou renomeou arquivos enquanto o painel estava aberto." },
                    { title: "▶ Definindo as Pastas", text: "IMPORTANTE: Para configurar quais pastas usar para 'Icones' e 'Imagens', clique com o BOTÃO DIREITO no ícone da ferramenta 'LibraryLive' na sua barra principal GND9TOOLS." }
                ] 
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showFinderProjectHelp = function() {
        var windowTitle = "Ajuda - Find Projects";
        var headerTitle = "AJUDA - FIND PROJECTS";
        var description = "Esta ferramenta busca arquivos de projeto do After Effects (.aep, .aet) em diretórios especificados.";
        var topicsData = [
            {
                tabName: "USO BÁSICO",
                topics: [
                    { title: "▶ SELECIONAR PASTA:", text: "Use o menu 'Presets' para selecionar pastas comuns ou clique no ícone de pasta (📁) para escolher um 'Caminho Personalizado'. O caminho 'DIA DIA' é carregado automaticamente com a data atual." },
                    { title: "▶ BUSCAR:", text: "Digite um termo no campo de busca e pressione Enter. Deixe o campo em branco para encontrar todos os projetos na pasta selecionada." },
                    { title: "▶ RESULTADOS:", text: "Os resultados são agrupados por pasta. Dê um duplo-clique em um projeto para abri-lo." }
                ]
            },
            {
                tabName: "FUNCIONALIDADES",
                topics: [
                    { title: "▶ BUSCA RECURSIVA:", text: "A busca é feita na pasta selecionada e em todas as suas subpastas." },
                    { title: "▶ ORDENAÇÃO:", text: "Clique nos cabeçalhos 'Nome' ou 'Data' para ordenar os resultados. 'Nome & Data' ordena primeiro pela data mais recente e depois por nome." },
                    { title: "▶ CANCELAR BUSCA:", text: "Durante uma busca demorada, um botão 'Cancelar' aparecerá para interromper o processo." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showTextBoxHelp = function() {
        var windowTitle = "Ajuda - GNEWS TextBox";
        var headerTitle = "AJUDA - GNEWS TextBox";
        var description = "Converte camadas de texto 'Box Text' para 'Point Text', mantendo a posição visual exata, quebras de linha automáticas e formatação.";
        var topicsData = [
            {
                tabName: "MODOS DE CONVERSÃO",
                topics: [
                    { title: "▶ MODO: INTEIRO", text: "Converte para uma única camada Point Text com quebras de linha." },
                    { title: "▶ MODO: POR LINHA", text: "Cria uma camada de texto separada para cada linha." },
                    { title: "▶ MODO: POR PALAVRA", text: "Cria uma camada de texto separada para cada palavra." },
                    { title: "▶ MODO: POR LETRA", text: "Cria uma camada de texto para cada caractere (intensivo)." }
                ]
            },
            {
                tabName: "RECURSOS AVANÇADOS",
                topics: [
                    { title: "✓ Mantém a posição visual exata, mesmo com a camada escalonada ou rotacionada." },
                    { title: "✓ Respeita as quebras de linha automáticas geradas pela caixa de texto (Box Text)." },
                    { title: "✓ Preserva o alinhamento do parágrafo (Esquerda, Centro, Direita)." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showNormalizerHelp = function() {
        var windowTitle = "Ajuda - Normalizadores";
        var headerTitle = "AJUDA - NORMALIZADORES";
        var description = "Esta ferramenta oferece um conjunto de funções para normalizar as propriedades de transformação das camadas.";
        var topicsData = [
            {
                tabName: "FUNÇÕES",
                topics: [
                    { title: "▶ Escala 100%:", text: "Ajusta a escala de camadas para 100%. Para Textos/Shapes, a escala é incorporada. Para outras, cria uma pré-comp." },
                    { title: "▶ Centralizar Âncora:", text: "Move o Ponto de Âncora para o centro geométrico da camada, mantendo a posição visual." },
                    { title: "▶ Âncora [0,0]:", text: "Move o ponto de âncora para a posição [0,0] da camada, mantendo a posição visual." },
                    { title: "▶ Centralizar Objeto:", text: "Move as camadas selecionadas para o centro exato da composição." },
                    { title: "▶ Posição [0,0] (via Âncora):", text: "Move a posição para [0,0], compensando no Ponto de Âncora. AVISO: Quebra o comportamento de Rotação e Escala." },
                    { title: "▶ Resetar Rotação:", text: "Define a Rotação (e Orientação em 3D) para 0." },
                    { title: "▶ Normalizar Rotação:", text: "Para Shapes, transfere a rotação para os grupos internos. Para outras, pré-compõe." },
                    { title: "▶ Resetar Transformações:", text: "Função universal que reseta transformações, Layer Styles e Stroke de Texto." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showColorChangeHelp = function() {
        var windowTitle = "Ajuda - Change Color";
        var headerTitle = "AJUDA - CHANGE COLOR";
        var description = "Ferramenta para alterar cores em composições do After Effects.";
        var topicsData = [
            {
                tabName: "ANÁLISE E SELEÇÃO",
                topics: [
                    { title: "▶ 1. ANÁLISE", text: "Verifica as composições selecionadas no painel de Projeto para identificar os tipos de camadas e efeitos que contêm cores (alvos de cor)." },
                    { title: "▶ 2. SELEÇÃO DE COR", text: "" },
                    { title: "  - PREVIEW:", text: "Mostra a cor selecionada. Clique no quadrado para abrir o seletor de cores do sistema." },
                    { title: "  - HEX:", text: "Campo para digitar um código hexadecimal de cor (ex.: #FF00FF)." },
                    { title: "  - PRESETS:", text: "Dropdown com uma lista de cores predefinidas." }
                ]
            },
            {
                tabName: "AÇÃO",
                topics: [
                    { title: "▶ 3. AÇÃO", text: "" },
                    { title: "  - SELECIONE O TIPO:", text: "Dropdown preenchido após a análise, mostrando os tipos de alvos de cor encontrados (ex: 'Camada Sólida', 'Texto - Preenchimento')." },
                    { title: "  - APLICAR COR:", text: "Botão para aplicar a cor selecionada ao tipo de alvo escolhido." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showLayerOrderHelp = function() {
        var windowTitle = "Ajuda - GNEWS LayerOrder";
        var headerTitle = "AJUDA - GNEWS LAYERORDER";
        var description = "Ferramenta para organizar, nomear e colorir camadas na timeline de forma padronizada.";
        var topicsData = [
            {
                tabName: "FUNCIONALIDADES",
                topics: [
                    { title: "▶ ORGANIZAR CAMADAS:", text: "Clique no botão principal da ferramenta para aplicar os prefixos de nome e as cores de rótulo definidas nas configurações para todas as camadas da composição ativa." },
                    { title: "▶ SELEÇÃO:", text: "Se houver camadas selecionadas, a organização será aplicada apenas a elas. Se não houver nenhuma seleção, a ferramenta processará todas as camadas da composição." }
                ]
            },
            {
                tabName: "CONFIGURAÇÕES",
                topics: [
                    { title: "▶ ACESSO ÀS CONFIGURAÇÕES:", text: "Para definir os prefixos (ex: 'Txt_', 'Shp_') e as cores para cada tipo de camada, clique com o botão direito no ícone da ferramenta 'LayerOrder' na barra principal." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.showCropCompHelp = function() {
        var windowTitle = "Ajuda - CropComp";
        var headerTitle = "AJUDA - CROPCOMP";
        var description = "Ferramenta para pré-composição, criação e redimensionamento inteligente de composições.";
        var topicsData = [
            {
                tabName: "CROP INTELIGENTE",
                topics: [
                    { title: "▶ FUNCIONALIDADE", text: "Pré-compõe camadas baseado em seus limites visuais. A redução de borda é automática para layers com Stroke. Efeitos são sempre movidos para a pré-comp." },
                    { title: "▶ NOME DO CROP", text: "Define o nome da nova pré-comp. O nome da camada selecionada é sugerido." },
                    { title: "▶ REVELAR NO PROJETO", text: "Seleciona e abre a nova pré-comp na timeline." }
                ]
            },
            {
                tabName: "TRANSFORMAR FOOTAGE",
                topics: [
                    { title: "▶ FUNCIONALIDADE", text: "Cria uma nova comp para cada footage selecionado no painel de Projeto, com opções de escala automática." }
                ]
            },
            {
                tabName: "REDIMENSIONAR",
                topics: [
                    { title: "▶ FUNCIONALIDADE", text: "Redimensiona comps existentes (selecionadas no projeto ou a comp ativa), com opção de escalar o conteúdo para ajustar ao novo tamanho." }
                ]
            }
        ];
        createHelpWindow(windowTitle, headerTitle, description, topicsData);
    };

    thisObj.getActionMenuHelpData = function () {
        return [
            {
                tabName: "CONFIGURACOES",
                topics: [
                    { title: "Alterar cores globais", text: "Abre o modulo de cores (ColorChange) para personalizar bgColor, highlight e paletas do GND9TOOLS." },
                    { title: "Configuracao de usuarios", text: "Atalho para o arquivo User_Preferences.json, onde ficam preferencas do usuario e caminhos personalizados." },
                    { title: "Configuracao de sistema", text: "Abre System_Settings.json (producoes, caches e parametros compartilhados)." },
                    { title: "Biblioteca de dados", text: "Atalho para Dados_Config.json para editar bibliotecas utilizadas pelos modulos." }
                ]
            },
            {
                tabName: "FERRAMENTAS",
                topics: [
                    { title: "Atualizar script (GitHub)", text: "Executa git pull no diretorio principal para trazer novas versoes do repositório." },
                    { title: "Configurar icones", text: "Abre o painel de ajuste (largura, altura e espacamentos dos modulos principais)." }
                ]
            }
        ];
    };

    thisObj.showActionMenuHelp = function () {
        var data = (typeof thisObj.getActionMenuHelpData === 'function') ? thisObj.getActionMenuHelpData() : [];
        createHelpWindow(
            "Acoes rapidas - Ajuda",
            "Painel de Acoes Rapidas",
            "Resumo das opcoes disponiveis para ajustes globais, configuracoes e manutencao do GND9TOOLS.",
            data
        );
    };
    
})($.global);