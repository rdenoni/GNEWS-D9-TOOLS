(function(app) {
    // Garante que o script está rodando no After Effects e que há um projeto aberto
    if (!(app instanceof Application)) {
        alert("Este script precisa ser executado no After Effects.");
        return;
    }

    var project = app.project;
    if (!project) {
        alert("Abra um projeto no After Effects antes de executar este script.");
        return;
    }

    // --- Função para carregar e parsear um arquivo JSON ---
    /**
     * Carrega e parseia um arquivo JSON de um caminho especificado.
     * @param {string} filePath - O caminho completo para o arquivo JSON.
     * @returns {object|null} O objeto JavaScript parseado do JSON ou null se houver erro.
     */
    function loadJsonFile(filePath) {
        var file = new File(filePath);
        if (file.exists) {
            file.open("r");
            var content = file.read();
            file.close();

            try {
                return JSON.parse(content);
            } catch (e) {
                alert("Erro ao parsear o JSON do arquivo: " + filePath + "\\nErro: " + e.message);
                return null;
            }
        } else {
            alert("Arquivo JSON não encontrado: " + filePath);
            return null;
        }
    }

    // --- Definir os caminhos dos arquivos JSON (Ajuste se necessário) ---
    var scriptFolderPath = (new File($.fileName)).path;
    var jsonFilesRootPath = scriptFolderPath + "/../libraries/dados_json/";

    var caminhosGNewsJsonPath = jsonFilesRootPath + "DADOS_caminhos_gnews.json";
    var programacaoGNewsJsonPath = jsonFilesRootPath + "DADOS_programacao_gnews.json";

    var dadosCaminhosGNews = loadJsonFile(caminhosGNewsJsonPath);
    var dadosProgramacaoGNews = loadJsonFile(programacaoGNewsJsonPath);

    if (!dadosCaminhosGNews || !dadosProgramacaoGNews) {
        alert("Não foi possível carregar os dados JSON para GNEWS. Verifique os caminhos e o conteúdo dos arquivos.");
        return;
    }

    // --- Início do Bloco Desfazer ---
    app.beginUndoGroup("Executar Regras de Composição");

    var activeComp = app.project.activeItem;

    if (!activeComp || !(activeComp instanceof CompItem)) {
        alert("Por favor, selecione uma composição no painel 'Projeto' ou na linha do tempo.");
        app.endUndoGroup();
        return;
    }

    var compName = activeComp.name;
    alert("Nome da composição ativa: " + compName);

    // Lógica de decisão principal
    if (compName.includes("GNEWS")) {
        regrasGNews(activeComp, dadosCaminhosGNews, dadosProgramacaoGNews);
    } else if (compName.includes("FANT")) {
        regrasFant(activeComp, dadosCaminhosGNews);
    } else {
        alert("Nenhuma regra específica encontrada para a composição: " + compName);
    }

    app.endUndoGroup();
    alert("Processo de regras concluído!");

    // --- FUNÇÕES DE REGRAS ESPECÍFICAS ---

    /**
     * Função para aplicar regras específicas à composição "GNEWS".
     * Esta função verifica diferentes critérios no nome da composição
     * para determinar o caminho de saída apropriado, com a seguinte prioridade:
     * 1. FTP VIZ (GNEWS + CABECALHO [ + PROMO])
     * 2. MXF ARTE (GNEWS + PROMO)
     * 3. REGRA PESQUISA (GNEWS + Pesquisa)
     * 4. PARA ILHA HARDNEWS (GNEWS + Jornal + ArteIlha)
     * 5. PARA ILHA MAGAZINE (GNEWS + Qualquer Programa + ArteIlha)
     * 6. PAM HARDNEWS (GNEWS + Jornal)
     * 7. PAM MAGAZINE (GNEWS + Qualquer Programa)
     * @param {CompItem} comp - A composição GNEWS a ser manipulada.
     * @param {object} caminhosData - Dados dos caminhos (de DADOS_caminhos_gnews.json).
     * @param {object} programacaoData - Dados da programação (de DADOS_programacao_gnews.json).
     */
    function regrasGNews(comp, caminhosData, programacaoData) {
        alert("Executando REGRAS DA GNEWS para: " + comp.name);

        var compName = comp.name;
        var targetPath = null;
        var pathDescription = "";
        var foundProgramOrJornalTag = "";

        // --- Variáveis para controle das condições ---
        var foundGNEWS = compName.includes("GNEWS");
        var foundProgramTag = false;
        var foundJornalTag = false;
        var foundArteTag = false;
        var foundPesquisaTag = false;

        // Variáveis para as exceções
        var foundCabecalho = compName.includes("CABECALHO");
        var foundPromo = compName.includes("PROMO");


        // --- 1. Obter Caminhos Específicos dos dados carregados ---
        var pamMagazinePath = null;
        var pamHardnewsPath = null;
        var ilhaHardnewsPath = null;
        var ilhaMagazinePath = null;
        var ftpVizPath = null;
        var mxfArtePath = null;

        for (var serverKey in caminhosData) {
            if (caminhosData.hasOwnProperty(serverKey)) {
                var serverItems = caminhosData[serverKey];
                for (var i = 0; i < serverItems.length; i++) {
                    if (serverItems[i].nome === "PAM MAGAZINE") {
                        pamMagazinePath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "PAM HARDNEWS") {
                        pamHardnewsPath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "ILHA HARDNEWS") {
                        ilhaHardnewsPath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "ILHA MAGAZINE") {
                        ilhaMagazinePath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "FTP VIZ") {
                        ftpVizPath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "MXF ARTE") {
                        mxfArtePath = serverItems[i].caminho;
                    }
                }
            }
        }

        if (!pamMagazinePath || !pamHardnewsPath || !ilhaHardnewsPath || !ilhaMagazinePath || !ftpVizPath || !mxfArtePath) {
            alert("Um ou mais caminhos essenciais (PAM MAGAZINE, PAM HARDNEWS, ILHA HARDNEWS, ILHA MAGAZINE, FTP VIZ, MXF ARTE) não foram encontrados no DADOS_caminhos_gnews.json.");
            return;
        }

        // --- 2. Obter Tags de Programa e Jornal dos dados carregados ---
        var allGnewsProgramTags = [];
        var gnewsJornalTags = [];
        if (programacaoData && programacaoData.programacao_globonews) {
            for (var i = 0; i < programacaoData.programacao_globonews.length; i++) {
                var program = programacaoData.programacao_globonews[i];
                allGnewsProgramTags.push(program.tagName);
                if (program.tipo === "Jornal") {
                    gnewsJornalTags.push(program.tagName);
                }
            }
        } else {
            alert("Dados de programação GNEWS incompletos ou ausentes no DADOS_programacao_gnews.json.");
            return;
        }

        // --- 3. Definir Tags de Arte e Pesquisa (Hardcoded conforme sua especificação) ---
        var artesGnIlhaTags = ["CREDITO", "LETTERING", "LEGENDAS", "LOCALIZADORES", "INSERT", "ALPHA"];
        var pesquisaTags = ["pesquisa", "pesquisas", "Datafolha", "quaest", "ipsos", "ipec", "IBGE", "AP", "NORC", "genial"];

        // --- 4. Avaliar as Condições de Match no Nome da Composição ---
        for (var i = 0; i < allGnewsProgramTags.length; i++) {
            if (compName.includes(allGnewsProgramTags[i])) {
                foundProgramTag = true;
                foundProgramOrJornalTag = allGnewsProgramTags[i];
                break;
            }
        }

        for (var i = 0; i < gnewsJornalTags.length; i++) {
            if (compName.includes(gnewsJornalTags[i])) {
                foundJornalTag = true;
                foundProgramOrJornalTag = gnewsJornalTags[i];
                break;
            }
        }

        for (var i = 0; i < artesGnIlhaTags.length; i++) {
            if (compName.includes(artesGnIlhaTags[i])) {
                foundArteTag = true;
                break;
            }
        }

        for (var i = 0; i < pesquisaTags.length; i++) {
            if (compName.includes(pesquisaTags[i])) {
                foundPesquisaTag = true;
                break;
            }
        }

        var subfolderForIlha = (foundProgramOrJornalTag) ? "\\" + foundProgramOrJornalTag : "";

        // --- 5. Lógica de Decisão para o Caminho (com Prioridade) ---

        // PRIORIDADE MÁXIMA: EXCEÇÕES FTP VIZ (GNEWS)
        if (foundGNEWS && foundCabecalho) {
            targetPath = ftpVizPath;
            pathDescription = "FTP VIZ";
            if (foundPromo) {
                pathDescription += " (CABECALHO PROMO)";
            } else {
                pathDescription += " (CABECALHO)";
            }
            alert("EXCEÇÃO: Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
            return;
        }
        // PRÓXIMA PRIORIDADE: MXF ARTE (GNEWS + PROMO)
        else if (foundGNEWS && foundPromo) {
            targetPath = mxfArtePath;
            pathDescription = "MXF ARTE";
            alert("EXCEÇÃO: Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
            return;
        }
        // Próximas prioridades (mantidas):
        // REGRA PESQUISA
        else if (foundGNEWS && foundPesquisaTag) {
            var finalPamHardnewsPath = pamHardnewsPath;
            var finalIlhaHardnewsPath = ilhaHardnewsPath + "\\GNEWS" + subfolderForIlha;

            alert("REGRA PESQUISA ativada para '" + compName + "'.\\n" +
                  "Caminho 1: " + finalPamHardnewsPath + " (PAM HARDNEWS)\\n" +
                  "Caminho 2: " + finalIlhaHardnewsPath + " (PARA ILHA HARDNEWS)");
            targetPath = null;
            pathDescription = "Múltiplos caminhos de Pesquisa";
        }
        // PARA ILHA HARDNEWS
        else if (foundGNEWS && foundJornalTag && foundArteTag) {
            targetPath = ilhaHardnewsPath + "\\GNEWS" + subfolderForIlha;
            pathDescription = "PARA ILHA HARDNEWS";
        }
        // PARA ILHA MAGAZINE
        else if (foundGNEWS && foundProgramTag && foundArteTag) {
            targetPath = ilhaMagazinePath + "\\GNEWS" + subfolderForIlha;
            pathDescription = "PARA ILHA MAGAZINE";
        }
        // PAM HARDNEWS
        else if (foundGNEWS && foundJornalTag) {
            targetPath = pamHardnewsPath;
            pathDescription = "PAM HARDNEWS";
        }
        // PAM MAGAZINE
        else if (foundGNEWS && foundProgramTag) {
            targetPath = pamMagazinePath;
            pathDescription = "PAM MAGAZINE";
        }

        if (targetPath) {
            alert("Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
        } else if (!foundGNEWS || (!foundPesquisaTag && !foundProgramTag && !foundCabecalho && !foundPromo)) {
            var msg = "A composição '" + compName + "' não atende aos critérios para nenhum caminho GNEWS específico.\\n";
            if (!foundGNEWS) {
                msg += "- Não contém 'GNEWS' no nome.\\n";
            } else {
                msg += "- Não contém um tag de programa GNEWS, tag de pesquisa, 'CABECALHO' ou 'PROMO' para regras GNEWS.";
            }
            alert(msg);
        }

        alert("Regras da GNEWS aplicadas à " + comp.name);
    }

    /**
     * Função para aplicar regras específicas à composição "FANT".
     *
     * Regras:
     * 1. TV TouchScreen (FANT + TELAO TRANSPARENTE) - Nova exceção de maior prioridade
     * 2. FTP COOLUX (FANT + CHAMADAS + SAB)
     * 3. FTP VIZ (FANT + TELAO BAR / SELOS / CONFRONTOS ESCUDOS)
     * 4. Se "FANT" + fantEsp: Retorna caminho do FTP ESPORTE + "\FANTASTICO".
     * 5. Se "FANT" + ArtesFtIlha: Retorna caminho do PARA ILHA Magazine + "\FANT".
     * 6. Caso contrário (apenas "FANT"): Retorna caminho do PARA ILHA Magazine + "\FANT".
     *
     * @param {CompItem} comp - A composição a ser manipulada.
     * @param {object} caminhosData - Dados dos caminhos (usado para buscar caminhos base).
     */
    function regrasFant(comp, caminhosData) {
        alert("Executando REGRAS DO FANT para: " + comp.name);

        var compName = comp.name;
        var targetPath = null;
        var pathDescription = "";

        // --- Obter Caminhos Específicos dos dados carregados ---
        var ilhaMagazinePathForFant = null;
        var ftpEsportePath = null;
        var ftpVizPath = null;
        var ftpCooluxPath = null;
        // Não é necessário buscar 'TV TouchScreen' no JSON, pois a string é literal.


        for (var serverKey in caminhosData) {
            if (caminhosData.hasOwnProperty(serverKey)) {
                var serverItems = caminhosData[serverKey];
                for (var i = 0; i < serverItems.length; i++) {
                    if (serverItems[i].nome === "ILHA MAGAZINE") {
                        ilhaMagazinePathForFant = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "FTP ESPORTE") {
                        ftpEsportePath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "FTP VIZ") {
                        ftpVizPath = serverItems[i].caminho;
                    } else if (serverItems[i].nome === "FTP COLUX") {
                        ftpCooluxPath = serverItems[i].caminho;
                    }
                }
            }
        }

        if (!ilhaMagazinePathForFant) {
            alert("Caminho 'ILHA MAGAZINE' não encontrado nos dados de caminho para as regras FANT.");
            return;
        }
        if (!ftpEsportePath) {
            alert("Caminho 'FTP ESPORTE' não encontrado nos dados de caminho para as regras FANT.");
            return;
        }
        if (!ftpVizPath) {
             alert("Caminho 'FTP VIZ' não encontrado nos dados de caminho para as regras FANT.");
             return;
        }
        if (!ftpCooluxPath) {
             alert("Caminho 'FTP COOLUX' não encontrado nos dados de caminho para as regras FANT.");
             return;
        }


        // Definir ArtesFtIlha, fantEsp e novas tags de exceção para FTP VIZ e COOLUX (Fantástico)
        var artesFtIlhaTags = ["TARJA CONFRONTO", "CONFRONTO CAVALINHOS", "CORRIDA"];
        var fantEspTags = ["VINHETA CORRIDA", "VINHETA CORRIDA CAVALINHOS", "CAVALINHOS PATROCINADOS", "FIGURINHAS", "MOLDURAS FOGUETE", "MOLDURAS SKYPE"];
        var fantVizTags = ["TELAO BAR", "SELOS", "CONFRONTOS ESCUDOS"];
        var fantCooluxTags = ["CHAMADAS", "SAB"];
        // Nova tag para exceção TV TouchScreen
        var fantTvTouchScreenTag = "TELAO TRANSPARENTE";


        var foundArtesFtIlhaTag = false;
        var foundFantEspTag = false;
        var foundFantVizTag = false;
        var foundCooluxChamadas = compName.includes("CHAMADAS");
        var foundCooluxSab = compName.includes("SAB");
        var foundTvTouchScreenTag = compName.includes(fantTvTouchScreenTag); // Verifica "TELAO TRANSPARENTE"


        // Verificar tags de ArtesFtIlha
        for (var i = 0; i < artesFtIlhaTags.length; i++) {
            if (compName.includes(artesFtIlhaTags[i])) {
                foundArtesFtIlhaTag = true;
                break;
            }
        }

        // Verificar tags de fantEsp
        for (var i = 0; i < fantEspTags.length; i++) {
            if (compName.includes(fantEspTags[i])) {
                foundFantEspTag = true;
                break;
            }
        }

        // Verificar tags de fantViz
        for (var i = 0; i < fantVizTags.length; i++) {
            if (compName.includes(fantVizTags[i])) {
                foundFantVizTag = true;
                break;
            }
        }


        // Lógica de decisão para o Fantástico (com prioridade)

        // PRIORIDADE MÁXIMA: TV TouchScreen (FANT + TELAO TRANSPARENTE)
        if (compName.includes("FANT") && foundTvTouchScreenTag) {
            targetPath = "TV TouchScreen"; // String literal
            pathDescription = "TV TouchScreen";
            alert("EXCEÇÃO: Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
            return; // Sai da função, pois esta é a exceção de maior prioridade
        }
        // PRÓXIMA PRIORIDADE: FTP COOLUX (FANT + CHAMADAS + SAB)
        else if (compName.includes("FANT") && foundCooluxChamadas && foundCooluxSab) {
            targetPath = ftpCooluxPath;
            pathDescription = "FTP COOLUX (Fantástico - Chamadas Sábado)";
            alert("EXCEÇÃO: Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
            return;
        }
        // PRÓXIMA PRIORIDADE: FTP VIZ (FANT + TELAO BAR / SELOS / CONFRONTOS ESCUDOS)
        else if (compName.includes("FANT") && foundFantVizTag) {
            targetPath = ftpVizPath;
            pathDescription = "FTP VIZ (Fantástico)";
            alert("EXCEÇÃO: Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
            return;
        }
        // Prioridade 4: "FANT" + fantEsp
        else if (compName.includes("FANT") && foundFantEspTag) {
            targetPath = ftpEsportePath + "\\FANTASTICO";
            pathDescription = "FTP ESPORTE (Fantástico)";
        }
        // Prioridade 5: "FANT" + ArtesFtIlha
        else if (compName.includes("FANT") && foundArtesFtIlhaTag) {
            targetPath = ilhaMagazinePathForFant + "\\FANT";
            pathDescription = "PARA ILHA FANTÁSTICO (Arte Específica)";
        }
        // Prioridade 6: Apenas "FANT" (regra genérica de PARA ILHA)
        else if (compName.includes("FANT")) {
            targetPath = ilhaMagazinePathForFant + "\\FANT";
            pathDescription = "PARA ILHA FANTÁSTICO (Genérico)";
        }

        // Resultado
        if (targetPath) {
            alert("Caminho encontrado para a composição '" + compName + "':\\n" + targetPath + " (" + pathDescription + ")");
        } else {
            alert("A composição '" + compName + "' não atende aos critérios para nenhum caminho FANT específico.");
        }

        alert("Regras do FANT aplicadas.");
    }

})(app);