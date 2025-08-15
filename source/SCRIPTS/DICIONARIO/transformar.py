import json
from collections import defaultdict

def transformar_palavras_em_json(arquivo_entrada, arquivo_saida):
    """
    Lê palavras de um arquivo de texto, agrupa-as pela primeira letra
    e salva o resultado em um arquivo JSON.
    """
    palavras_por_letra = defaultdict(list)

    try:
        with open(arquivo_entrada, 'r', encoding='utf-8') as f:
            for linha in f:
                # Divide a linha em palavras e remove espaços extras
                palavras = linha.strip().split()
                for palavra in palavras:
                    if palavra:
                        primeira_letra = palavra[0].lower()
                        palavras_por_letra[primeira_letra].append(palavra)

        # Ordena as chaves (letras) em ordem alfabética
        dicionario_ordenado = dict(sorted(palavras_por_letra.items()))

        # Salva o dicionário ordenado em um arquivo JSON
        with open(arquivo_saida, 'w', encoding='utf-8') as f:
            json.dump(dicionario_ordenado, f, indent=2, ensure_ascii=False)

        print(f"Arquivo '{arquivo_saida}' criado com sucesso!")

    except FileNotFoundError:
        print(f"Erro: O arquivo '{arquivo_entrada}' não foi encontrado.")
    except Exception as e:
        print(f"Ocorreu um erro: {e}")

# Nome dos arquivos de entrada e saída
arquivo_palavras = 'palavras.txt'
arquivo_json_saida = 'resultado.json'

# Chama a função para executar a transformação
transformar_palavras_em_json(arquivo_palavras, arquivo_json_saida)