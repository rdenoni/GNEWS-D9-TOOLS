/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function GND9TOOLS_UTL(thisObj) {
    // Declaração da versão do script 'O Padeiro'
    var scriptName = 'GN D9 TOOLS';
    var scriptVersion = 'v1'; // Versão incrementada

    try {
        scriptMainPath = scriptMainPath;
    
  } catch (err) {
        var startMsg = 'você instalou o arquivo ".jsxbin"!\
o script funcionará normalmente, mas você não terá:\n\
    - atualizações automáticas\
    - lista inicial de produções com templates\
    - novos recursos e correções de bugs.';
        alert(startMsg);
        scriptMainPath = Folder.userData.fullName + '/GND9TOOLS script/';
    }

        #include 'source/libraries/JSON lib.js';
        #include 'source/libraries/PROT lib.js';
        #include 'source/libraries/ICON lib.js';
        
        #include 'source/globals.js';

        #include 'source/libraries/FUNC lib.js';

        #include 'source/libraries/functions/web lib.js';
        #include 'source/libraries/functions/color lib.js';
        #include 'source/libraries/functions/ctrl anim lib.js';
        #include 'source/libraries/functions/file system lib.js';
        #include 'source/libraries/functions/layers lib.js';
        #include 'source/libraries/functions/math num lib.js';
        #include 'source/libraries/functions/string lib.js';
        #include 'source/libraries/functions/treeView lib.js';
        #include 'source/libraries/functions/metadata lib.js';

        // utilidades com interface
        #include 'source/layout/UI_FUNC.js';
        
        // CORRIGIDO: Inclui GNEWS_Templates primeiro
        #include 'source/SCRIPTS/GNEWS_Templates.jsx';
        
        //#include 'source/SCRIPTS/MAKER_UI.js';
        #include 'source/config/Templates_configWin.js';
        #include 'source/SCRIPTS/GNEWS_SearchLayers.jsx';
        #include 'source/SCRIPTS/GNEWS_FinderProject.jsx';
        

    
    var D9T_mainGrpUiStructure = {
        pinGrp: {
            // A seção de pins superior está vazia de botões de ação
        },
        mainGrp: {
            section1: { 
                link: {
                    type: 'imageButton',
                    labelTxt: 'CopyLinks',
                    icon: D9T_LINKS_ICON,
                    tips: [
                        lClick + 'Acesso rápido a pastas na rede e favoritar caminhos'
                    ]
                }
            },


            section2: { 
                

        Finders: {
                    type: 'imageButton',
                    labelTxt: 'Finders',
                    icon: D9T_FINDERS_ICON,
                    tips: [
                        lClick + 'Buscar em layers de texto',
                        rClick + 'Buscar por arquivos de projeto'
                    ]
                },

                templates: {
                    type: 'imageButton',
                    labelTxt: 'Templates',
                    icon: D9T_TEMPLATES_ICON,
                    tips: [
                        lClick + 'Acessa projetos de Templates, ilustrações e base temáticas ',
                        rClick + 'Configurações de lista de produções'
                       
                    ]
                },
                LibraryLive: {
                    type: 'imageButton',
                    labelTxt: 'LibraryLive',
                    icon: D9T_LIBRARY_ICON,
                    tips: [
                        lClick + 'Biblioteca de icones e imagens',
                        rClick + 'Configurações dos caminhos'
                    ]
                },
            },

            section3: {

                Renamer: {
                    type: 'imageButton',
                    labelTxt: 'Renamer',
                    icon: D9T_RENAMER_ICON, 
                    tips: [
                        lClick + 'Renomei comp, salva e organiza projeto.'
                    ]
                },
            


                MailMaker: {
                    type: 'imageButton',
                    labelTxt: 'MailMaker',
                    icon: D9T_MAIL_ICON,
                    tips: [
                        'Cria Emails prontos.'                 
                    ]
                },

                LayerOrder: {
                    type: 'imageButton',
                    labelTxt: 'LayerToLasy',
                    icon: D9T_LAYERS_ICON, 
                    tips: [
                        lClick + 'Organizada Layers',
                        rClick + 'Janela de configurações'
                    ]
                },
},

            section4: { // Grupo 4


                TextBox: {
                    type: 'imageButton',
                    labelTxt: 'TextBox',
                    icon: D9T_TEXT_ICON,
                    tips: [
                        lClick + 'Converte BoxLayers em LayerTexts, também separa texto em linhas, palavras e letras.'
                    ]
                },
                AnchorAlign: {
                    type: 'imageButton',
                    labelTxt: 'AnchorAlign',
                    icon: D9T_ANCHOR_ICON, 
                    tips: [
                        lClick + 'Alinhar a âncora em qualquer posição do box de uma layer'
                    ]
                },
                colorChange: {
                    type: 'imageButton',
                    labelTxt: 'ColorChange',
                    icon: D9T_COLOR_ICON, 
                    tips: [
                        lClick + 'Troca a cor de multiplas layers filtradas na comp'
                    ]
                },
                Normalizer: {
                    type: 'imageButton',
                    labelTxt: 'Normalizer',
                    icon: D9T_NORMALIZER_ICON, 
                    tips: [
                        lClick + 'Normaliza tamanho, rotação, posição e âncora'
                    ]
                },

                cropComp: {
                    type: 'imageButton',
                    labelTxt: 'CropComp',
                    icon: D9T_CROP_ICON, 
                    tips: [
                        lClick + 'Cropa um comp pelas extremidades de uma ou mais layers, cria multiplas comps com footages selecionados'
                    ]
                }
            }
        }
    };

    function D9T_WINDOW(thisObj) {
        D9T_ui.window = thisObj;
        if (!(thisObj instanceof Panel)) D9T_ui.window = new Window('palette', scriptName + ' ' + scriptVersion);
        D9T_BUILD_UI(D9T_mainGrpUiStructure, D9T_ui);
        return D9T_ui.window;
    }
    
    var GND9TOOLS_WINDOW = D9T_WINDOW(thisObj);
    
    // CORRIGIDO: Verificação mais robusta de acesso à rede
    if (!netAccess()) {
        alert('Por favor, habilite a opção "' + AE_netConfigName + '" nas preferências.\n\nMenu: Edit > Preferences > Scripting & Expressions\nMarque "Allow Scripts to Write Files and Access Network"');
        try {
            app.executeCommand(3131); // Abre preferências
        } catch (e) {
            // Falha silenciosa se não conseguir abrir preferências
        }
        
        // Verificação final
        if (!netAccess()) {
            alert(lol + '#D9T_012 - Script funcionará com funcionalidades limitadas devido à falta de acesso à rede.');
        }
    }
    
    if (!(GND9TOOLS_WINDOW instanceof Panel)) GND9TOOLS_WINDOW.show();

    return GND9TOOLS_WINDOW;
}

// CORRIGIDO: Chama a função principal e trata erros
try {
    GND9TOOLS_UTL(this);
} catch (error) {
    alert('Erro ao carregar GND9TOOLS:\n\n' + error.toString() + 
          '\n\nVerifique se todos os arquivos estão no local correto:\n' + 
          '- GNEWS_Templates.jsx deve estar em: source/SCRIPTS/\n' +
          '- Todas as bibliotecas devem estar presentes');
}