// func_auto_path_servers.js (VERSÃO CORRIGIDA PARA EXTENDSCRIPT ES3)

function loadJsonFileForAutoPath(filePath) { /* ... */ }

function regrasGNews(compName, caminhosData, programacaoData) {
    $.writeln("regrasGNews: Analisando comp: " + compName);

    var targetPath = null;
    var foundProgramOrJornalTag = "";

    var foundGNEWS = compName.indexOf("GNEWS") > -1;
    var foundProgramTag = false;
    var foundJornalTag = false;
    var foundArteTag = false;
    var foundPesquisaTag = false;
    var foundCabecalho = compName.indexOf("CABECALHO") > -1;
    var foundPromo = compName.indexOf("PROMO") > -1;

    var pamMagazinePath = null, pamHardnewsPath = null, ilhaHardnewsPath = null, ilhaMagazinePath = null, ftpVizPath = null, mxfArtePath = null, ftpEsportePath = null, ftpCooluxPath = null;

    for (var serverKey in caminhosData) {
        if (caminhosData.hasOwnProperty(serverKey)) {
            var serverItems = caminhosData[serverKey];
            for (var i = 0; i < serverItems.length; i++) {
                if (serverItems[i].nome === "PAM MAGAZINE") { pamMagazinePath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "PAM HARDNEWS") { pamHardnewsPath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "ILHA HARDNEWS") { ilhaHardnewsPath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "ILHA MAGAZINE") { ilhaMagazinePath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "FTP VIZ") { ftpVizPath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "MXF ARTE") { mxfArtePath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "FTP ESPORTE") { ftpEsportePath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "FTP COLUX") { ftpCooluxPath = serverItems[i].caminho; }
            }
        }
    }

    if (!pamMagazinePath || !pamHardnewsPath || !ilhaHardnewsPath || !ilhaMagazinePath || !ftpVizPath || !mxfArtePath) {
        $.writeln("regrasGNews: ERRO: Um ou mais caminhos GNEWS essenciais não foram encontrados no DADOS_caminhos_gnews.json.");
        return null;
    }

    var allGnewsProgramTags = [], gnewsJornalTags = [];
    if (programacaoData && programacaoData.programacao_globonews) {
        for (var i = 0; i < programacaoData.programacao_globonews.length; i++) {
            var program = programacaoData.programacao_globonews[i];
            allGnewsProgramTags.push(program.tagName);
            if (program.tipo === "Jornal") { gnewsJornalTags.push(program.tagName); }
        }
    } else {
        $.writeln("regrasGNews: ERRO: Dados de programação GNEWS incompletos ou ausentes.");
        return null;
    }

    var artesGnIlhaTags = ["CREDITO", "LETTERING", "LEGENDAS", "LOCALIZADORES", "INSERT", "ALPHA"];
    var pesquisaTags = ["pesquisa", "pesquisas", "Datafolha", "quaest", "ipsos", "ipec", "IBGE", "AP", "NORC", "genial"];

    for (var i = 0; i < allGnewsProgramTags.length; i++) {
        if (compName.indexOf(allGnewsProgramTags[i]) > -1) {
            foundProgramTag = true;
            foundProgramOrJornalTag = allGnewsProgramTags[i];
            break;
        }
    }
    for (var i = 0; i < gnewsJornalTags.length; i++) {
        if (compName.indexOf(gnewsJornalTags[i]) > -1) {
            foundJornalTag = true;
            foundProgramOrJornalTag = gnewsJornalTags[i];
            break;
        }
    }
    for (var i = 0; i < artesGnIlhaTags.length; i++) {
        if (compName.indexOf(artesGnIlhaTags[i]) > -1) {
            foundArteTag = true;
            break;
        }
    }
    for (var i = 0; i < pesquisaTags.length; i++) {
        if (compName.indexOf(pesquisaTags[i]) > -1) {
            foundPesquisaTag = true;
            break;
        }
    }

    var subfolderForIlha = (foundProgramOrJornalTag) ? "\\" + foundProgramOrJornalTag : "";

    if (foundGNEWS && foundCabecalho) { targetPath = ftpVizPath; }
    else if (foundGNEWS && foundPromo) { targetPath = mxfArtePath; }
    else if (foundGNEWS && foundPesquisaTag) { targetPath = pamHardnewsPath; }
    else if (foundGNEWS && foundJornalTag && foundArteTag) { targetPath = ilhaHardnewsPath + "\\GNEWS" + subfolderForIlha; }
    else if (foundGNEWS && foundProgramTag && foundArteTag) { targetPath = ilhaMagazinePath + "\\GNEWS" + subfolderForIlha; }
    else if (foundGNEWS && foundJornalTag) { targetPath = pamHardnewsPath; }
    else if (foundGNEWS && foundProgramTag) { targetPath = pamMagazinePath; }

    return targetPath;
}

function regrasFant(compName, caminhosData) {
    var targetPath = null;
    var ilhaMagazinePathForFant = null, ftpEsportePath = null, ftpVizPath = null, ftpCooluxPath = null;

    for (var serverKey in caminhosData) {
        if (caminhosData.hasOwnProperty(serverKey)) {
            var serverItems = caminhosData[serverKey];
            for (var i = 0; i < serverItems.length; i++) {
                if (serverItems[i].nome === "ILHA MAGAZINE") { ilhaMagazinePathForFant = serverItems[i].caminho; }
                else if (serverItems[i].nome === "FTP ESPORTE") { ftpEsportePath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "FTP VIZ") { ftpVizPath = serverItems[i].caminho; }
                else if (serverItems[i].nome === "FTP COLUX") { ftpCooluxPath = serverItems[i].caminho; }
            }
        }
    }
    
    if (!ilhaMagazinePathForFant || !ftpEsportePath || !ftpVizPath || !ftpCooluxPath) {
        $.writeln("regrasFant: ERRO: Um ou mais caminhos FANT essenciais não foram encontrados.");
        return null;
    }

    var artesFtIlhaTags = ["TARJA CONFRONTO", "CONFRONTO CAVALINHOS", "CORRIDA"];
    var fantEspTags = ["VINHETA CORRIDA", "VINHETA CORRIDA CAVALINHOS", "CAVALINHOS PATROCINADOS", "FIGURINHAS", "MOLDURAS FOGUETE", "MOLDURAS SKYPE"];
    var fantVizTags = ["TELAO BAR", "SELOS", "CONFRONTOS ESCUDOS"];
    var fantTvTouchScreenTag = "TELAO TRANSPARENTE";

    var foundArtesFtIlhaTag = false, foundFantEspTag = false, foundFantVizTag = false;
    var foundCooluxChamadas = compName.indexOf("CHAMADAS") > -1;
    var foundCooluxSab = compName.indexOf("SAB") > -1;
    var foundTvTouchScreenTag = compName.indexOf(fantTvTouchScreenTag) > -1;

    for (var i = 0; i < artesFtIlhaTags.length; i++) { if (compName.indexOf(artesFtIlhaTags[i]) > -1) { foundArtesFtIlhaTag = true; break; } }
    for (var i = 0; i < fantEspTags.length; i++) { if (compName.indexOf(fantEspTags[i]) > -1) { foundFantEspTag = true; break; } }
    for (var i = 0; i < fantVizTags.length; i++) { if (compName.indexOf(fantVizTags[i]) > -1) { foundFantVizTag = true; break; } }

    if (compName.indexOf("FANT") > -1 && foundTvTouchScreenTag) { targetPath = "TV TouchScreen"; }
    else if (compName.indexOf("FANT") > -1 && foundCooluxChamadas && foundCooluxSab) { targetPath = ftpCooluxPath; }
    else if (compName.indexOf("FANT") > -1 && foundFantVizTag) { targetPath = ftpVizPath; }
    else if (compName.indexOf("FANT") > -1 && foundFantEspTag) { targetPath = ftpEsportePath + "\\FANTASTICO"; }
    else if (compName.indexOf("FANT") > -1 && foundArtesFtIlhaTag) { targetPath = ilhaMagazinePathForFant + "\\FANT"; }
    else if (compName.indexOf("FANT") > -1) { targetPath = ilhaMagazinePathForFant + "\\FANT"; }

    return targetPath;
}

if (typeof $.global.MailMakerAutoPath === 'undefined') {
    $.global.MailMakerAutoPath = {};
}
$.global.MailMakerAutoPath.regrasGNews = regrasGNews;
$.global.MailMakerAutoPath.regrasFant = regrasFant;
$.global.MailMakerAutoPath.loadJsonFile = loadJsonFileForAutoPath;