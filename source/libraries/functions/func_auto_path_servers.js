// func_auto_path_servers.js

function loadJsonFileForAutoPath(filePath) { /* ... (código existente) ... */ }

function regrasGNews(compName, caminhosData, programacaoData) {
    $.writeln("regrasGNews: Analisando comp: " + compName); //

    var targetPath = null;
    var foundProgramOrJornalTag = "";

    var foundGNEWS = compName.includes("GNEWS") > -1;
    var foundProgramTag = false;
    var foundJornalTag = false;
    var foundArteTag = false;
    var foundPesquisaTag = false;

    var foundCabecalho = compName.includes("CABECALHO");
    var foundPromo = compName.includes("PROMO");

    // --- 1. Obter Caminhos Específicos dos dados carregados ---
    var pamMagazinePath = null;
    var pamHardnewsPath = null;
    var ilhaHardnewsPath = null;
    var ilhaMagazinePath = null;
    var ftpVizPath = null;
    var mxfArtePath = null;
    var ftpEsportePath = null;
    var ftpCooluxPath = null;

    for (var serverKey in caminhosData) { //
        if (caminhosData.hasOwnProperty(serverKey)) { //
            var serverItems = caminhosData[serverKey]; //
            for (var i = 0; i < serverItems.length; i++) { //
                if (serverItems[i].nome === "PAM MAGAZINE") { pamMagazinePath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "PAM HARDNEWS") { pamHardnewsPath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "ILHA HARDNEWS") { ilhaHardnewsPath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "ILHA MAGAZINE") { ilhaMagazinePath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "FTP VIZ") { ftpVizPath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "MXF ARTE") { mxfArtePath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "FTP ESPORTE") { ftpEsportePath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "FTP COLUX") { ftpCooluxPath = serverItems[i].caminho; } //
            }
        }
    }

    if (!pamMagazinePath || !pamHardnewsPath || !ilhaHardnewsPath || !ilhaMagazinePath || !ftpVizPath || !mxfArtePath) {
        $.writeln("regrasGNews: ERRO: Um ou mais caminhos GNEWS essenciais não foram encontrados no DADOS_caminhos_gnews.json."); //
        return null;
    }

    // --- 2. Obter Tags de Programa e Jornal dos dados carregados ---
    var allGnewsProgramTags = [];
    var gnewsJornalTags = [];
    if (programacaoData && programacaoData.programacao_globonews) { //
        for (var i = 0; i < programacaoData.programacao_globonews.length; i++) { //
            var program = programacaoData.programacao_globonews[i]; //
            allGnewsProgramTags.push(program.tagName); //
            if (program.tipo === "Jornal") { //
                gnewsJornalTags.push(program.tagName); //
            }
        }
    } else {
        $.writeln("regrasGNews: ERRO: Dados de programação GNEWS incompletos ou ausentes no DADOS_programacao_gnews.json."); //
        return null;
    }

    // --- 3. Definir Tags de Arte e Pesquisa ---
    var artesGnIlhaTags = ["CREDITO", "LETTERING", "LEGENDAS", "LOCALIZADORES", "INSERT", "ALPHA"];
    var pesquisaTags = ["pesquisa", "pesquisas", "Datafolha", "quaest", "ipsos", "ipec", "IBGE", "AP", "NORC", "genial"];

    // --- 4. Avaliar as Condições de Match no Nome da Composição ---
    for (var i = 0; i < allGnewsProgramTags.length; i++) {
        if (compName.includes(allGnewsProgramTags[i])) {
            foundProgramTag = true;
            foundProgramOrJornalTag = allGnewsProgramTags[i];
            $.writeln("regrasGNews: Tag de programa/jornal encontrada: " + allGnewsProgramTags[i]);
            break;
        }
    }
    for (var i = 0; i < gnewsJornalTags.length; i++) {
        if (compName.includes(gnewsJornalTags[i])) {
            foundJornalTag = true;
            foundProgramOrJornalTag = gnewsJornalTags[i];
            $.writeln("regrasGNews: Tag de jornal específica encontrada: " + gnewsJornalTags[i]);
            break;
        }
    }
    for (var i = 0; i < artesGnIlhaTags.length; i++) {
        if (compName.includes(artesGnIlhaTags[i])) {
            foundArteTag = true;
            $.writeln("regrasGNews: Tag de arte encontrada: " + artesGnIlhaTags[i]);
            break;
        }
    }
    for (var i = 0; i < pesquisaTags.length; i++) {
        if (compName.includes(pesquisaTags[i])) {
            foundPesquisaTag = true;
            $.writeln("regrasGNews: Tag de pesquisa encontrada: " + pesquisaTags[i]);
            break;
        }
    }

    var subfolderForIlha = (foundProgramOrJornalTag) ? "\\" + foundProgramOrJornalTag : "";

    // --- 5. Lógica de Decisão para o Caminho (com Prioridade) ---
    if (foundGNEWS && foundCabecalho) {
        targetPath = ftpVizPath;
        $.writeln("regrasGNews: Regra 'FTP VIZ (CABECALHO)' ativada. Caminho: " + targetPath);
    } else if (foundGNEWS && foundPromo) {
        targetPath = mxfArtePath;
        $.writeln("regrasGNews: Regra 'MXF ARTE (PROMO)' ativada. Caminho: " + targetPath);
    } else if (foundGNEWS && foundPesquisaTag) {
        targetPath = pamHardnewsPath; // Escolhido como padrão para Pesquisa, conforme discussão anterior
        $.writeln("regrasGNews: Regra 'Pesquisa' ativada. Caminho: " + targetPath);
    } else if (foundGNEWS && foundJornalTag && foundArteTag) {
        targetPath = ilhaHardnewsPath + "\\GNEWS" + subfolderForIlha;
        $.writeln("regrasGNews: Regra 'ILHA HARDNEWS (Jornal + Arte)' ativada. Caminho: " + targetPath);
    } else if (foundGNEWS && foundProgramTag && foundArteTag) {
        targetPath = ilhaMagazinePath + "\\GNEWS" + subfolderForIlha;
        $.writeln("regrasGNews: Regra 'ILHA MAGAZINE (Programa + Arte)' ativada. Caminho: " + targetPath);
    } else if (foundGNEWS && foundJornalTag) {
        targetPath = pamHardnewsPath;
        $.writeln("regrasGNews: Regra 'PAM HARDNEWS (Jornal)' ativada. Caminho: " + targetPath);
    } else if (foundGNEWS && foundProgramTag) {
        targetPath = pamMagazinePath;
        $.writeln("regrasGNews: Regra 'PAM MAGAZINE (Programa)' ativada. Caminho: " + targetPath);
    }

    if (!targetPath) {
        $.writeln("regrasGNews: Nenhum caminho específico GNEWS encontrado para: " + compName);
    }
    return targetPath;
}

function regrasFant(compName, caminhosData) {
    $.writeln("regrasFant: Analisando comp: " + compName); //

    var targetPath = null;

    var ilhaMagazinePathForFant = null;
    var ftpEsportePath = null;
    var ftpVizPath = null;
    var ftpCooluxPath = null;

    for (var serverKey in caminhosData) { //
        if (caminhosData.hasOwnProperty(serverKey)) { //
            var serverItems = caminhosData[serverKey]; //
            for (var i = 0; i < serverItems.length; i++) { //
                if (serverItems[i].nome === "ILHA MAGAZINE") { ilhaMagazinePathForFant = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "FTP ESPORTE") { ftpEsportePath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "FTP VIZ") { ftpVizPath = serverItems[i].caminho; } //
                else if (serverItems[i].nome === "FTP COLUX") { ftpCooluxPath = serverItems[i].caminho; } //
            }
        }
    }

    if (!ilhaMagazinePathForFant || !ftpEsportePath || !ftpVizPath || !ftpCooluxPath) {
        $.writeln("regrasFant: ERRO: Um ou mais caminhos FANT essenciais não foram encontrados no DADOS_caminhos_gnews.json."); //
        return null;
    }

    var artesFtIlhaTags = ["TARJA CONFRONTO", "CONFRONTO CAVALINHOS", "CORRIDA"];
    var fantEspTags = ["VINHETA CORRIDA", "VINHETA CORRIDA CAVALINHOS", "CAVALINHOS PATROCINADOS", "FIGURINHAS", "MOLDURAS FOGUETE", "MOLDURAS SKYPE"];
    var fantVizTags = ["TELAO BAR", "SELOS", "CONFRONTOS ESCUDOS"];
    var fantCooluxTags = ["CHAMADAS", "SAB"];
    var fantTvTouchScreenTag = "TELAO TRANSPARENTE";

    var foundArtesFtIlhaTag = false;
    var foundFantEspTag = false;
    var foundFantVizTag = false;
    var foundCooluxChamadas = compName.includes("CHAMADAS");
    var foundCooluxSab = compName.includes("SAB");
    var foundTvTouchScreenTag = compName.includes(fantTvTouchScreenTag);

    for (var i = 0; i < artesFtIlhaTags.length; i++) {
        if (compName.includes(artesFtIlhaTags[i])) {
            foundArtesFtIlhaTag = true;
            $.writeln("regrasFant: Tag de arte FANT encontrada: " + artesFtIlhaTags[i]);
            break;
        }
    }
    for (var i = 0; i < fantEspTags.length; i++) {
        if (compName.includes(fantEspTags[i])) {
            foundFantEspTag = true;
            $.writeln("regrasFant: Tag FANT especial encontrada: " + fantEspTags[i]);
            break;
        }
    }
    for (var i = 0; i < fantVizTags.length; i++) {
        if (compName.includes(fantVizTags[i])) {
            foundFantVizTag = true;
            $.writeln("regrasFant: Tag FANT VIZ encontrada: " + fantVizTags[i]);
            break;
        }
    }

    if (compName.includes("FANT") && foundTvTouchScreenTag) {
        targetPath = "TV TouchScreen";
        $.writeln("regrasFant: Regra 'TV TouchScreen' ativada. Caminho: " + targetPath);
    } else if (compName.includes("FANT") && foundCooluxChamadas && foundCooluxSab) {
        targetPath = ftpCooluxPath;
        $.writeln("regrasFant: Regra 'FTP COOLUX (Chamadas Sábado)' ativada. Caminho: " + targetPath);
    } else if (compName.includes("FANT") && foundFantVizTag) {
        targetPath = ftpVizPath;
        $.writeln("regrasFant: Regra 'FTP VIZ (Fantástico)' ativada. Caminho: " + targetPath);
    } else if (compName.includes("FANT") && foundFantEspTag) {
        targetPath = ftpEsportePath + "\\FANTASTICO";
        $.writeln("regrasFant: Regra 'FTP ESPORTE (Fantástico)' ativada. Caminho: " + targetPath);
    } else if (compName.includes("FANT") && foundArtesFtIlhaTag) {
        targetPath = ilhaMagazinePathForFant + "\\FANT";
        $.writeln("regrasFant: Regra 'PARA ILHA FANTÁSTICO (Arte Específica)' ativada. Caminho: " + targetPath);
    } else if (compName.includes("FANT")) {
        targetPath = ilhaMagazinePathForFant + "\\FANT";
        $.writeln("regrasFant: Regra 'PARA ILHA FANTÁSTICO (Genérico)' ativada. Caminho: " + targetPath);
    }

    if (!targetPath) {
        $.writeln("regrasFant: Nenhum caminho específico FANT encontrado para: " + compName);
    }
    return targetPath;
}

if (typeof $.global.MailMakerAutoPath === 'undefined') {
    $.global.MailMakerAutoPath = {};
}
$.global.MailMakerAutoPath.regrasGNews = regrasGNews;
$.global.MailMakerAutoPath.regrasFant = regrasFant;
$.global.MailMakerAutoPath.loadJsonFile = loadJsonFileForAutoPath;