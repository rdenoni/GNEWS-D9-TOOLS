import json
import tkinter as tk
from tkinter import filedialog, messagebox
import time

def create_dictionary_file():
    """
    Abre uma janela para selecionar um arquivo JSON, processa-o e cria
    um arquivo .jsx otimizado com os dados do dicionário.
    """
    # Esconde a janela principal do Tkinter
    root = tk.Tk()
    root.withdraw()

    # Pede ao usuário para selecionar o arquivo JSON
    json_path = filedialog.askopenfilename(
        title="Selecione o arquivo 'lista_de_palavras.json'",
        filetypes=[("JSON files", "*.json")]
    )

    if not json_path:
        messagebox.showinfo("Cancelado", "Nenhum arquivo selecionado. Operação cancelada.")
        return

    try:
        # Lê e processa o arquivo JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if 'palavras' not in data or not isinstance(data['palavras'], list):
            messagebox.showerror("Erro", "O arquivo JSON é inválido ou não contém a chave 'palavras'.")
            return

        words = data['palavras']
        total_words = len(words)
        
        # Constrói o conteúdo do arquivo .jsx
        output_lines = []
        output_lines.append("var DICTIONARY_DATA = {")

        for i, word in enumerate(words):
            # Limpa e formata a palavra para ser uma chave de objeto JS válida
            clean_word = str(word).strip().lower().replace('"', '\\"')
            if clean_word:
                # Adiciona a vírgula no final de todas as linhas, exceto a última
                line_end = "," if i < total_words - 1 else ""
                output_lines.append(f'    "{clean_word}": true{line_end}')

        output_lines.append("};")

        output_content = "\n".join(output_lines)
        
        # Salva o arquivo .jsx na mesma pasta do JSON
        output_path = json_path.replace('.json', '_data.jsx')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output_content)

        messagebox.showinfo(
            "Sucesso!",
            f"O arquivo 'dicionario_data.jsx' foi criado com sucesso!\n\n"
            f"Total de palavras processadas: {total_words}\n"
            f"Salvo em: {output_path}"
        )

    except Exception as e:
        messagebox.showerror("Erro", f"Ocorreu um erro ao processar o arquivo:\n{e}")

if __name__ == "__main__":
    create_dictionary_file()