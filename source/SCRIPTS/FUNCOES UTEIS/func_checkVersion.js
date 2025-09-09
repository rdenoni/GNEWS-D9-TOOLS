// --- Início do Script IdentificarVersao.jsx ---
function IdentificarVersaoAEP() {
    // Pede ao usuário para selecionar um arquivo .aep
    var aepFile = File.openDialog("Selecione um arquivo .aep para identificar a versão", "*.aep", false);
    
    // Cancela se nenhum arquivo for selecionado
    if (!aepFile) {
        return;
    }

    // Função interna para obter a versão do arquivo
    function getAepVersion(file) {
        if (!file || !file.exists) {
            return "Arquivo não encontrado.";
        }
        try {
            file.encoding = "BINARY";
            file.open('r');
            var fileContent = file.read(200000); // Lê os primeiros 200KB
            file.close();

            // Tenta encontrar o padrão principal (CreatorTool)
            var regex1 = /<xmp:CreatorTool>Adobe After Effects ([\d\.]+)/i;
            var match = fileContent.match(regex1);
            if (match && match[1]) {
                return match[1]; // Retorna a versão (ex: "2025" ou "24.1.1")
            }

            // Se não encontrou, tenta um padrão de backup (softwareAgent)
            var regex2 = /<stEvt:softwareAgent>Adobe After Effects ([\d\.]+)/i;
            match = fileContent.match(regex2);
            if (match && match[1]) {
                return match[1];
            }

            // Se realmente não encontrou nenhum dos padrões
            return null;

        } catch (e) {
            // Em caso de erro na leitura
            return "Erro de leitura";
        }
    }

    // Executa a função e prepara o alerta final
    var versaoEncontrada = getAepVersion(aepFile);

    if (versaoEncontrada && versaoEncontrada !== "Erro de leitura") {
        alert("Versão do After Effects identificada: " + versaoEncontrada);
    } else if (versaoEncontrada === "Erro de leitura") {
        alert("Ocorreu um erro ao tentar ler o arquivo.");
    } else {
        alert("Não foi possível identificar a versão do After Effects no arquivo selecionado.");
    }
}

// Executa a função principal do script
IdentificarVersaoAEP();
// --- Fim do Script IdentificarVersao.jsx ---