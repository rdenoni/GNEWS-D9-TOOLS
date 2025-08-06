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
        #include 'source/SCRIPTS/TEMPLATE_UI.js';
        #include 'source/SCRIPTS/MAKER_UI.js';
        #include 'source/SCRIPTS/FOLDER_UI.js';
        #include 'source/SCRIPTS/FIND_UI.js';
        #include 'source/SCRIPTS/FIND_PROJ_UI.js';
        

    // ESTRUTURA DA UI ATUALIZADA E CORRIGIDA
    var D9T_mainGrpUiStructure = {
        pinGrp: {
            // A seção de pins superior está vazia de botões de ação
        },
        mainGrp: {
            section1: { // Grupo 1
                link: {
                    type: 'imageButton',
                    labelTxt: 'CopyLinks',
                    icon: D9T_LINKS_ICON,
                    tips: [
                        lClick + 'Executar GNEWS CopyLinks.jsx'
                    ]
                }
            },


            section2: { // Grupo 2
                

        buscar: {
                    type: 'imageButton',
                    labelTxt: 'Buscar',
                    icon: D9T_BUSCAR_ICON,
                    tips: [
                        lClick + 'Buscar em layers de texto',
                        rClick + 'Buscar por arquivos de projeto (.aep)'
                    ]
                },

                templates: {
                    type: 'imageButton',
                    labelTxt: 'Templates',
                    icon: D9T_TEMPLATES_ICON,
                    tips: [
                        lClick + 'Preencher templates',
                        rClick + 'Criar novo template'
                    ]
                }
            },

            section3: { // Grupo 3

                mailMaker: {
                    type: 'imageButton',
                    labelTxt: 'MailMaker',
                    icon: D9T_ORGANIZAR_ICON,
                    tips: [
                        'Cria Emails prontos.'                 
                    ]
                },

                layerOrganizer: {
                    type: 'imageButton',
                    labelTxt: 'LayerToLasy',
                    icon: D9T_DIRETORIOS_ICON, // Ícone temporário, pode ser trocado
                    tips: [
                        lClick + 'Organizador de Layers'
                    ]
                },
                renCompSave: {
                    type: 'imageButton',
                    labelTxt: 'RenCompSave',
                    icon: D9T_RENOMEAR_ICON, // Usando o ícone de Renomear
                    tips: [
                        lClick + 'Executar RenCompSave'
                    ]
                }
            },
            section4: { // Grupo 4


                killBoxText: {
                    type: 'imageButton',
                    labelTxt: 'KillBoxtext',
                    icon: D9T_FONTES_ICON, // Ícone temporário
                    tips: [
                        lClick + 'Executar KillBoxText'
                    ]
                },
                centerAnchor: {
                    type: 'imageButton',
                    labelTxt: 'CenterAnchor',
                    icon: D9T_PASTAS_ICON, // Ícone temporário
                    tips: [
                        lClick + 'Executar AutoCenter'
                    ]
                },
                colorChange: {
                    type: 'imageButton',
                    labelTxt: 'ColorChange',
                    icon: D9T_PASTAS_ICON, // Ícone temporário
                    tips: [
                        lClick + 'Executar ColorChange'
                    ]
                },
                NormalizeMyLife: {
                    type: 'imageButton',
                    labelTxt: 'NormalizeMyLife',
                    icon: D9T_PASTAS_ICON, // Ícone temporário
                    tips: [
                        lClick + 'Executar NormalizeMyLife'
                    ]
                },
                icons4U: {
                    type: 'imageButton',
                    labelTxt: 'Icons4U',
                    icon: D9T_BUSCAR_ICON, // Ícone temporário
                    tips: [
                        lClick + 'Procura icones no projeto',
                    ]
                },
                cropComp: {
                    type: 'imageButton',
                    labelTxt: 'CropComp',
                    icon: D9T_ATALHOS_ICON, // Ícone temporário
                    tips: [
                        lClick + 'Executar AutoCrop'
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
    
    if (!netAccess()) {
        alert('por favor, habilite a opção ' + AE_netConfigName + ' nas preferencias');
        app.executeCommand(3131);
        if (!netAccess()) {
            alert(lol + '#D9T_012 - sem acesso a rede...');
        }
    }
    
    if (!(GND9TOOLS_WINDOW instanceof Panel)) GND9TOOLS_WINDOW.show();

    return GND9TOOLS_WINDOW;
}

GND9TOOLS_UTL(this);