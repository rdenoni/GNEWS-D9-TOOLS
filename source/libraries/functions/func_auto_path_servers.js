// func_auto_path_servers.js (VERSÃO FINAL - Lógica de detecção corrigida)

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
    function createRegExp(tag) {
        var escapedTag = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/_/g, '[\\s-]?');
        return new RegExp('\\b' + escapedTag + '\\b');
    }

    for (var i = 0; i < tagArray.length; i++) {
        var originalTag = tagArray[i];
        if (createRegExp(originalTag).test(compNameUpper)) {
            return originalTag;
        }
    }
    
    var compNameNormalizerd = compNameUpper.replace(/[\s-]/g, "");
    for (var j = 0; j < tagArray.length; j++) {
        var NormalizerdTag = tagArray[j].replace(/_/g, "");
        if (NormalizerdTag !== "" && compNameNormalizerd.indexOf(NormalizerdTag) > -1) {
            return tagArray[j];
        }
    }
    
    return null;
}


function regrasGNews(compName, caminhosData, programacaoData, debugMode) {
    var trace = [];
    function logTrace(msg) { if(debugMode) trace.push(msg); }
    var compNameUpper = compName.toUpperCase();
    var targetObject = null;
    var tags = getTags(programacaoData);
    var foundGNEWS = compNameUpper.indexOf("GNEWS") > -1;
    var pamMagazineInfo = null, pamHardnewsInfo = null, ilhaHardnewsInfo = null, ilhaMagazineInfo = null, ftpVizInfo = null, mxfArteInfo = null;

    for (var serverKey in caminhosData) {
        if (caminhosData.hasOwnProperty(serverKey)) {
            var serverItems = caminhosData[serverKey];
            for (var i = 0; i < serverItems.length; i++) {
                var item = serverItems[i];
                if (item.nome === "PAM MAGAZINE") { pamMagazineInfo = item; }
                else if (item.nome === "PAM HARDNEWS") { pamHardnewsInfo = item; }
                else if (item.nome === "PARA ILHA HARDNEWS") { ilhaHardnewsInfo = item; } // Corrigido para corresponder ao JSON
                else if (item.nome === "PARA ILHA MAGAZINE") { ilhaMagazineInfo = item; } // Corrigido para corresponder ao JSON
                else if (item.nome === "FTP VIZ") { ftpVizInfo = item; }
                else if (item.nome === "MXF ARTE") { mxfArteInfo = item; }
            }
        }
    }
    
    var foundProgramOrJornalTag = findTag(tags.programas, compNameUpper);
    var isJornal = findTag(tags.jornais, compNameUpper) !== null;
    var isArte = findTag(tags.artes, compNameUpper) !== null;
    var isPesquisa = findTag(tags.pesquisa, compNameUpper) !== null;
    var isVizGnews = findTag(tags.vizGnews, compNameUpper) !== null;
    var isPrograma = foundProgramOrJornalTag !== null;
    var isCabecalho = compNameUpper.indexOf("CABECALHO") > -1;
    var isPromo = compNameUpper.indexOf("PROMO") > -1;
    var subfolderForIlha = (foundProgramOrJornalTag) ? "\\" + foundProgramOrJornalTag : "";
    
    logTrace("--- Avaliando Regras GNEWS ---");
    if (foundGNEWS) {
        logTrace("Palavra 'GNEWS' encontrada. Verificando regras...");
        if (isCabecalho && ftpVizInfo) { 
            logTrace("Regra 'CABECALHO' ativada... SUCESSO!");
            targetObject = { nome: ftpVizInfo.nome, caminho: ftpVizInfo.caminho }; 
        }
        else if (isPromo && mxfArteInfo) { 
            logTrace("Regra 'PROMO' ativada... SUCESSO!");
            targetObject = { nome: mxfArteInfo.nome, caminho: mxfArteInfo.caminho }; 
        }
        else if (isVizGnews && ftpVizInfo) {
            logTrace("Regra 'VIZ GNEWS (QR/Virtual/Totem)' ativada... SUCESSO!");
            targetObject = { nome: ftpVizInfo.nome, caminho: ftpVizInfo.caminho };
        }
        else if (isPesquisa && pamHardnewsInfo && ilhaHardnewsInfo) { 
            logTrace("Regra 'PESQUISA' (Duplo Destino) ativada... SUCESSO!");
            targetObject = { 
                nome: "PAM HARDNEWS E PARA ILHA HARDNEWS", // CORRIGIDO
                caminho: pamHardnewsInfo.caminho + "\nE TAMBÉM:\n" + ilhaHardnewsInfo.caminho 
            }; 
        }
        else if (isJornal && isArte && ilhaHardnewsInfo) { 
            logTrace("Regra 'Jornal + Arte' ativada... SUCESSO!");
            targetObject = { nome: "PARA ILHA HARDNEWS", caminho: ilhaHardnewsInfo.caminho + "\\GNEWS" + subfolderForIlha }; 
        }
        else if (isPrograma && !isJornal && isArte && ilhaMagazineInfo) {
             logTrace("Regra 'Programa (não jornal) + Arte' ativada... SUCESSO!");
             targetObject = { nome: "PARA ILHA MAGAZINE", caminho: ilhaMagazineInfo.caminho + "\\GNEWS" + subfolderForIlha }; 
        }
        else if (isJornal && pamHardnewsInfo) { 
            logTrace("Regra 'Apenas Jornal' ativada... SUCESSO!");
            targetObject = { nome: pamHardnewsInfo.nome, caminho: pamHardnewsInfo.caminho }; 
        }
        else if (isPrograma && pamMagazineInfo) {
             logTrace("Regra 'Apenas Programa' ativada... SUCESSO!");
             targetObject = { nome: pamMagazineInfo.nome, caminho: pamMagazineInfo.caminho }; 
        } else {
            logTrace("Nenhuma regra específica da GNEWS correspondeu.");
        }
    } else {
        logTrace("Palavra 'GNEWS' não encontrada. Pulando regras GNEWS.");
    }
    
    if (debugMode) { return { result: targetObject, trace: trace }; } 
    else { return targetObject; }
}

function regrasFant(compName, caminhosData, programacaoData, debugMode) {
    var trace = [];
    function logTrace(msg) { if(debugMode) trace.push(msg); }
    var compNameUpper = compName.toUpperCase();
    var compNameNormalizerd = compNameUpper.replace(/[\s_-]/g, "");
    var targetObject = null;
    var tags = getTags(programacaoData);
    logTrace("--- Avaliando Regras FANT ---");
    if (compNameUpper.indexOf("FANT") === -1) {
        logTrace("Palavra 'FANT' não encontrada. Pulando regras FANT.");
        if (debugMode) { return { result: null, trace: trace }; }
        return null;
    }
    logTrace("Palavra 'FANT' encontrada. Verificando regras...");
    var ilhaMagazineInfo = null, ftpEsporteInfo = null, ftpVizInfo = null, ftpCooluxInfo = null;
    for (var serverKey in caminhosData) {
        if (caminhosData.hasOwnProperty(serverKey)) {
            var serverItems = caminhosData[serverKey];
            for (var i = 0; i < serverItems.length; i++) {
                var item = serverItems[i];
                if (item.nome === "ILHA MAGAZINE") { ilhaMagazineInfo = item; }
                else if (item.nome === "FTP ESPORTE") { ftpEsporteInfo = item; }
                else if (item.nome === "FTP VIZ") { ftpVizInfo = item; }
                else if (item.nome === "FTP COLUX") { ftpCooluxInfo = item; }
            }
        }
    }
    
    var foundArtesFtIlhaTag = findTag(tags.artesFant, compNameUpper);
    var foundFantEspTag = findTag(tags.espFant, compNameUpper);
    var foundFantVizTag = findTag(tags.vizFant, compNameUpper);
    var foundCooluxChamadas = compNameUpper.indexOf("CHAMADAS") > -1;
    var foundCooluxSab = compNameUpper.indexOf("SAB") > -1;
    var foundTvTouchScreenTag = compNameNormalizerd.indexOf(tags.touchFant) > -1;

    if (foundTvTouchScreenTag) {
        logTrace("Regra 'TV TouchScreen' ativada... SUCESSO!");
        targetObject = { nome: "TV TouchScreen", caminho: "Não aplicável - verificar com produção" };
    }
    else if (foundCooluxChamadas && foundCooluxSab && ftpCooluxInfo) {
        logTrace("Regra 'FTP COOLUX (Chamadas Sábado)' ativada... SUCESSO!");
        targetObject = { nome: ftpCooluxInfo.nome, caminho: ftpCooluxInfo.caminho };
    }
    else if (foundFantVizTag && ftpVizInfo) {
        logTrace("Regra 'FTP VIZ (Fantástico)' ativada... SUCESSO!");
        targetObject = { nome: ftpVizInfo.nome, caminho: ftpVizInfo.caminho };
    }
    else if (foundFantEspTag && ftpEsporteInfo) {
        logTrace("Regra 'FTP ESPORTE (Fantástico)' ativada... SUCESSO!");
        targetObject = { nome: ftpEsporteInfo.nome, caminho: ftpEsporteInfo.caminho + "\\FANTASTICO" };
    }
    else if (foundArtesFtIlhaTag && ilhaMagazineInfo) {
        logTrace("Regra 'ILHA MAGAZINE (Arte Específica)' ativada... SUCESSO!");
        targetObject = { nome: "PARA ILHA FANTÁSTICO", caminho: ilhaMagazineInfo.caminho + "\\FANT" };
    }
    else if (ilhaMagazineInfo) {
        logTrace("Regra 'ILHA MAGAZINE (Genérico)' ativada... SUCESSO!");
        targetObject = { nome: "PARA ILHA FANTÁSTICO", caminho: ilhaMagazineInfo.caminho + "\\FANT" };
    } else {
        logTrace("Nenhuma regra específica do FANT correspondeu.");
    }
    if (debugMode) { return { result: targetObject, trace: trace }; } 
    else { return targetObject; }
}

$.global.MailMakerAutoPath = {};
$.global.MailMakerAutoPath.regrasGNews = regrasGNews;
$.global.MailMakerAutoPath.regrasFant = regrasFant;
$.global.MailMakerAutoPath.getTags = getTags;