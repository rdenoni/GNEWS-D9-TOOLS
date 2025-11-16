/**********************************************************************************
 * func_auto_path_servers.js
 * Versão: 2.0.1 (Correção de Caminho)
 *
 * DESCRIÇÃO:
 * - CORREÇÃO (v2.0.1): Corrigido o caminho de carregamento do arquivo JSON
 * central, adicionando a barra "/" que faltava.
 * - ARQUITETURA (v2.0): Script refatorado para ler dados do 'Dados_Config.json'.
 *
 **********************************************************************************/

(function(thisObj) {

    // Função auxiliar para ler e parsear arquivos JSON.
    function readJsonFile(filePath) {
        var file = new File(filePath);
        if (!file.exists) { throw new Error("Arquivo de configuração não encontrado: " + file.fsName); }
        try {
            file.open("r");
            var content = file.read();
            file.close();
            return JSON.parse(content);
        } catch (e) {
            throw new Error("Erro ao ler ou processar o arquivo JSON: " + file.fsName + "\n" + e.toString());
        }
    }

    // Função para carregar e preparar todos os dados necessários dos arquivos centralizados.
    function loadServerPathData() {
        if (typeof scriptMainPath === 'undefined' || scriptMainPath === null) {
            throw new Error("A variável global 'scriptMainPath' não foi encontrada.");
        }
        
        // CORREÇÃO: Adicionada a "/" antes do nome do arquivo.
        var dadosConfigData = readJsonFile(scriptMainPath + "/Dados_Config.json");

        if (!dadosConfigData.CAMIMHOS_REDE) throw new Error("Objeto 'CAMIMHOS_REDE' não encontrado em Dados_Config.json.");
        if (!dadosConfigData.PROGRAMACAO_GNEWS || !dadosConfigData.PROGRAMACAO_GNEWS.programacao) throw new Error("Objeto 'PROGRAMACAO_GNEWS' não encontrado ou malformado em Dados_Config.json.");

        // Retorna os dados no formato que as funções antigas esperam, para minimizar alterações.
        return {
            caminhosData: dadosConfigData.CAMIMHOS_REDE,
            programacaoData: { programacao_globonews: dadosConfigData.PROGRAMACAO_GNEWS.programacao }
        };
    }
    
    function getTags(programacaoData) {
        var allGnewsProgramTags = [], gnewsJornalTags = [];
        if (programacaoData && programacaoData.programacao_globonews) {
            for (var i = 0; i < programacaoData.programacao_globonews.length; i++) {
                var program = programacaoData.programacao_globonews[i];
                allGnewsProgramTags.push(program.tagName);
                if (program.tipo === "Jornal") { gnewsJornalTags.push(program.tagName); }
            }
        }
        return {
            programas: allGnewsProgramTags,
            jornais: gnewsJornalTags,
            artes: ["CREDITO", "CREDITOS", "LETTERING", "LEGENDAS", "LOCALIZADORES", "INSERT", "ALPHA"],
            pesquisa: ["PESQUISA", "DATAFOLHA", "QUAEST", "IPSOS", "IPEC", "IBGE", "AP", "NORC", "GENIAL"],
            vizGnews: ["QR CODE", "VIRTUAL", "TOTEM"],
            artesFant: ["TARJACONFRONTO", "CONFRONTOCAVALINHOS", "CORRIDA"],
            espFant: ["VINHETACORRIDA", "VINHETACORRIDACAVALINHOS", "CAVALINHOSPATROCINADOS", "FIGURINHAS", "MOLDURASFOGUETE", "MOLDURASSKYPE"],
            vizFant: ["TELAOBAR", "SELOS", "CONFRONTOSESCUDOS"],
            touchFant: "TELAOTRANSPARENTE"
        };
    }

    function findTag(tagArray, compNameUpper) {
        function createRegExp(tag) { var escapedTag = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/_/g, '[\\s-]?'); return new RegExp('\\b' + escapedTag + '\\b'); }
        for (var i = 0; i < tagArray.length; i++) { if (createRegExp(tagArray[i]).test(compNameUpper)) return tagArray[i]; }
        var compNameNormalized = compNameUpper.replace(/[\s-]/g, "");
        for (var j = 0; j < tagArray.length; j++) { var normalizedTag = tagArray[j].replace(/_/g, ""); if (normalizedTag !== "" && compNameNormalized.indexOf(normalizedTag) > -1) return tagArray[j]; }
        return null;
    }

    function regrasGNews(compName, caminhosData, programacaoData, debugMode) {
        var trace = []; function logTrace(msg) { if(debugMode) trace.push(msg); }
        var compNameUpper = compName.toUpperCase(); var targetObject = null; var tags = getTags(programacaoData);
        var pamMagazineInfo=null, pamHardnewsInfo=null, ilhaHardnewsInfo=null, ilhaMagazineInfo=null, ftpVizInfo=null, mxfArteInfo=null;
        for (var serverKey in caminhosData) { if (caminhosData.hasOwnProperty(serverKey)) { var serverItems=caminhosData[serverKey]; for (var i=0;i<serverItems.length;i++){ var item=serverItems[i]; if(item.nome==="PAM MAGAZINE"){pamMagazineInfo=item;}else if(item.nome==="PAM HARDNEWS"){pamHardnewsInfo=item;}else if(item.nome==="PARA ILHA HARDNEWS"){ilhaHardnewsInfo=item;}else if(item.nome==="PARA ILHA MAGAZINE"){ilhaMagazineInfo=item;}else if(item.nome==="FTP VIZ"){ftpVizInfo=item;}else if(item.nome==="MXF ARTE"){mxfArteInfo=item;} } } }
        var foundProgramOrJornalTag = findTag(tags.programas, compNameUpper); var isJornal = findTag(tags.jornais, compNameUpper) !== null; var isArte = findTag(tags.artes, compNameUpper) !== null; var isPesquisa = findTag(tags.pesquisa, compNameUpper) !== null; var isVizGnews = findTag(tags.vizGnews, compNameUpper) !== null; var isPrograma = foundProgramOrJornalTag !== null; var isCabecalho = compNameUpper.indexOf("CABECALHO") > -1; var isPromo = compNameUpper.indexOf("PROMO") > -1;
        var subfolderForIlha = (foundProgramOrJornalTag) ? "\\" + foundProgramOrJornalTag : "";
        logTrace("--- Avaliando Regras GNEWS ---");
        if (compNameUpper.indexOf("GNEWS") > -1) {
            logTrace("Palavra 'GNEWS' encontrada.");
            if (isCabecalho && ftpVizInfo) { targetObject = { nome: ftpVizInfo.nome, caminho: ftpVizInfo.caminho }; }
            else if (isPromo && mxfArteInfo) { targetObject = { nome: mxfArteInfo.nome, caminho: mxfArteInfo.caminho }; }
            else if (isVizGnews && ftpVizInfo) { targetObject = { nome: ftpVizInfo.nome, caminho: ftpVizInfo.caminho }; }
            else if (isPesquisa && pamHardnewsInfo && ilhaHardnewsInfo) { targetObject = { nome: "PAM HARDNEWS E PARA ILHA HARDNEWS", caminho: pamHardnewsInfo.caminho + "\nE TAMBÉM:\n" + ilhaHardnewsInfo.caminho }; }
            else if (isJornal && isArte && ilhaHardnewsInfo) { targetObject = { nome: "PARA ILHA HARDNEWS", caminho: ilhaHardnewsInfo.caminho + "\\GNEWS" + subfolderForIlha }; }
            else if (isPrograma && !isJornal && isArte && ilhaMagazineInfo) { targetObject = { nome: "PARA ILHA MAGAZINE", caminho: ilhaMagazineInfo.caminho + "\\GNEWS" + subfolderForIlha }; }
            else if (isJornal && pamHardnewsInfo) { targetObject = { nome: pamHardnewsInfo.nome, caminho: pamHardnewsInfo.caminho }; }
            else if (isPrograma && pamMagazineInfo) { targetObject = { nome: pamMagazineInfo.nome, caminho: pamMagazineInfo.caminho }; }
        }
        if (debugMode) { return { result: targetObject, trace: trace }; } else { return targetObject; }
    }

    function regrasFant(compName, caminhosData, programacaoData, debugMode) {
        var trace = []; function logTrace(msg) { if(debugMode) trace.push(msg); }
        var compNameUpper = compName.toUpperCase(); var targetObject = null; var tags = getTags(programacaoData);
        logTrace("--- Avaliando Regras FANT ---");
        if (compNameUpper.indexOf("FANT") === -1) { if(debugMode) return {result:null,trace:trace}; return null; }
        var ilhaMagazineInfo=null, ftpEsporteInfo=null, ftpVizInfo=null, ftpCooluxInfo=null;
        for (var serverKey in caminhosData) { if (caminhosData.hasOwnProperty(serverKey)) { var serverItems=caminhosData[serverKey]; for (var i=0;i<serverItems.length;i++){ var item=serverItems[i]; if(item.nome==="ILHA MAGAZINE"){ilhaMagazineInfo=item;}else if(item.nome==="FTP ESPORTE"){ftpEsporteInfo=item;}else if(item.nome==="FTP VIZ"){ftpVizInfo=item;}else if(item.nome==="FTP COLUX"){ftpCooluxInfo=item;} } } }
        var foundArtesFtIlhaTag = findTag(tags.artesFant, compNameUpper); var foundFantEspTag = findTag(tags.espFant, compNameUpper); var foundFantVizTag = findTag(tags.vizFant, compNameUpper);
        var foundTvTouchScreenTag = compNameUpper.replace(/[\s_-]/g, "").indexOf(tags.touchFant) > -1;
        if (foundTvTouchScreenTag) { targetObject = { nome: "TV TouchScreen", caminho: "Não aplicável - verificar com produção" }; }
        else if (compNameUpper.indexOf("CHAMADAS") > -1 && compNameUpper.indexOf("SAB") > -1 && ftpCooluxInfo) { targetObject = { nome: ftpCooluxInfo.nome, caminho: ftpCooluxInfo.caminho }; }
        else if (foundFantVizTag && ftpVizInfo) { targetObject = { nome: ftpVizInfo.nome, caminho: ftpVizInfo.caminho }; }
        else if (foundFantEspTag && ftpEsporteInfo) { targetObject = { nome: ftpEsporteInfo.nome, caminho: ftpEsporteInfo.caminho + "\\FANTASTICO" }; }
        else if (foundArtesFtIlhaTag && ilhaMagazineInfo) { targetObject = { nome: "PARA ILHA FANTÁSTICO", caminho: ilhaMagazineInfo.caminho + "\\FANT" }; }
        else if (ilhaMagazineInfo) { targetObject = { nome: "PARA ILHA FANTÁSTICO", caminho: ilhaMagazineInfo.caminho + "\\FANT" }; }
        if (debugMode) { return { result: targetObject, trace: trace }; } else { return targetObject; }
    }

    function autoGetPath(compName, debugMode) {
        debugMode = debugMode || false;
        try {
            var data = loadServerPathData();
            var result = null;
            var gnewsResult = regrasGNews(compName, data.caminhosData, data.programacaoData, debugMode);
            result = debugMode ? gnewsResult.result : gnewsResult;
            if (result === null) {
                var fantResult = regrasFant(compName, data.caminhosData, data.programacaoData, debugMode);
                result = debugMode ? fantResult.result : fantResult;
            }
            return result;
        } catch (e) {
            alert("Erro em autoGetPath:\n" + e.toString());
            return null;
        }
    }

    $.global.autoGetPath = autoGetPath;

})(this);