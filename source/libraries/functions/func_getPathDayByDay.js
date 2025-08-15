/*
  Função para gerar um caminho de diretório dinâmico baseado na data atual,
  para ser usada dentro do Adobe After Effects.
*/
function getPathDayByDay() {

    // 1. Caminho Fixo
    // Em ExtendScript/JavaScript, a barra invertida "\" precisa ser "escapada".
    // Por isso, usamos duas barras: "\\"
    var caminhoFixo = "T:\\JORNALISMO\\GLOBONEWS\\DIARIOS\\RJ\\2025";

    // 2. Mapeamento dos meses conforme sua regra específica
    // Usamos um objeto JavaScript, que é o equivalente ao dicionário Python.
    var mapaMeses = {
        1: "01_JAN",  // Janeiro
        2: "02_FEV",  // Fevereiro
        3: "03_MAR",  // Março
        4: "04_ABR", // Abril
        5: "05_MAI", // Maio
        6: "06_JUN", // Junho
        7: "07_JUL", // Julho
        8: "08_AGO", // Agosto
        9: "09_SET", // Setembro
        10: "10_OUT", // Outubro
        11: "11_NOV", // Novembro
        12: "12_DEZ" // Dezembro
    };

    // 3. Obter a data atual do sistema
    var dataHoje = new Date();

    // 4. Obter o caminho dinâmico para o mês
    // IMPORTANTE: .getMonth() em JavaScript retorna o mês de 0 a 11.
    // Por isso, somamos 1 para alinhar com o nosso mapa (1 a 12).
    var numeroMesAtual = dataHoje.getMonth() + 1;
    var caminhoMesDinamico = mapaMeses[numeroMesAtual];

    // 5. Obter o caminho dinâmico para o dia (com zero à esquerda)
    var dia = dataHoje.getDate();
    var caminhoDiaDinamico = (dia < 10) ? "0" + dia : dia.toString();

    // 6. Combinar tudo para formar o caminho final usando o separador "\\"
    var caminhoFinal = caminhoFixo + "\\" + caminhoMesDinamico + "\\" + caminhoDiaDinamico + "\\";

    return caminhoFinal;
}


// --- Exemplo de como usar a função e mostrar o resultado em um alerta ---
// A chamada da função também foi atualizada para o novo nome.
//var caminhoGerado = getPathDayByDay();
//alert("O caminho gerado para hoje é:\n" + caminhoGerado);