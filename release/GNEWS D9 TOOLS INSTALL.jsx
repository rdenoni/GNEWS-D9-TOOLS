{
    // ============================================================================
    // CONFIGURAÇÕES GERAIS E DE REDE
    // ============================================================================
    var SCRIPT_INFO = {
        name: 'GNEWS D9 TOOLS INSTALADOR',
        version: 'v1.0 (Hybrid)',
        // ALTERE AQUI PARA OS SEUS LINKS REAIS
        REMOTE_BIN_URL: "https://raw.githubusercontent.com/SEU_USER/SEU_REPO/main/GND9T_SOURCE.jsxbin",
        REMOTE_BIN_NAME: "GND9T_SOURCE.jsxbin"
    };

    // ============================================================================
    // DADOS PADRÃO (DEFAULTS) - Para criar arquivos se não existirem
    // ============================================================================
    
    var default_Manifest = {
        "version": "1.0.0",
        "installedAt": new Date().toString(),
        "status": "fresh_install"
    };

    var default_UserPrefs = {
        "color": { "menu": { "light": "#3E50B4", "dark": "#8FF7A7" } },
        "folders": { "projPath": "~/Desktop" },
        "uiSettings": {
            "iconSize": [40, 40],
            "iconSpacing": 13,
            "activeButtonTheme": "classic",
            "buttonThemes": [
                { "id": "classic", "name": "Clássico", "width": 200, "height": 40, "background": "#2E343B", "textColor": "#FFFFFF" }
            ]
        },
        "themeColors": { "bgColor1": "#161616FF", "highlightColor1": "#FF0046FF" },
        "ignoreMissing": true,
        "devMode": false
    };

    var default_SystemSettings = {
        "COPYLINKS_Settings": { "configuracao": { "layout_geral": { "name_btn_width": 590 } } },
        "TEMPLATES_Settings": { "PRODUCTIONS": [], "gnews_templates": { "lastProductionIndex": 1 } },
        "LIBRARYLIVE_Settings": { "icon_root_paths": [], "tool_settings": {} }
    };

    var default_DadosConfig = {
        "ARTES_GNEWS": { "arte": [] },
        "PROGRAMACAO_GNEWS": { "programacao": [] },
        "EQUIPE_GNEWS": { "equipe": [] },
        "CAMINHOS_REDE": { "caminhos": [] }
    };

    // ============================================================================
    // INTERFACE E LÓGICA PRINCIPAL
    // ============================================================================

    function installerUi() {
        var pArray = [];
        var p = 0;
        var appOs = $.os.indexOf('Win') >= 0 ? 'Win' : 'Mac';
        var userPath = Folder.userData.fullName;
        var localAePath = '/Adobe/After Effects';
        var localScriptsPanelPath = '/Scripts/ScriptUI Panels';
        
        // Caminhos locais do instalador
        var installerFile = new File(decodeURI($.fileName));
        var installerFolder = installerFile.parent;
        var packageRoot = (installerFolder && installerFolder.parent) ? installerFolder.parent : installerFolder; // raiz do pacote (onde ficam source/runtime)
        var releaseFolder = installerFolder; // pasta atual do instalador (onde fica o .jsxbin)

        // Caminho de Destino Final (AppData)
        var deployRoot = new Folder(userPath + '/GND9TOOLS script');

        // Preferências AE
        var AE_prefSection = 'Main Pref Section';
        var AE_netConfigName = '"Allow Scripts to Write Files and Access Network"';
        var AE_prefName = 'Pref_SCRIPTING_FILE_NETWORK_SECURITY';

        var header = '\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x02\u008B\x00\x00\x01P\b\x02\x00\x00\x00X\u0099\u00A31\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03viTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin="\u00EF\u00BB\u00BF" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 9.1-c003 79.9690a87fc, 2025/03/06-20:50:16        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:OriginalDocumentID="xmp.did:50c0fae5-4911-5544-a4a7-73706b5b8009" xmpMM:DocumentID="xmp.did:E56B76606B4511F0AFE79EB082197432" xmpMM:InstanceID="xmp.iid:E56B765F6B4511F0AFE79EB082197432" xmp:CreatorTool="Adobe Photoshop 26.6 (Windows)"> <xmpMM:DerivedFrom stRef:instanceID="xmp.iid:06f4c72b-639b-7a45-a5a1-bc7a4e52dd0f" stRef:documentID="xmp.did:50c0fae5-4911-5544-a4a7-73706b5b8009"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>#^\u00A9\x07\x00\x00<\x10IDATx\u00DA\u00EC\u00DD\x07|\x1B\u00E5\u00E1\u00FF\u00F1\u00E7N\u0096mYV\u00F6\u00DE\u00D3!\u0083\u00ECEB\x18I\n\u00842\x13\x12~P\b\u00A3\u0085\u00B6\u0081\u00B0\t#e\u0093B\u0081\x16(I\u00FE-)\t\x04(\u00B3a\u0093\x042\u00C8\u00DE{;\u0083\u00EC\u00BDe[\u00B6,\u00DD\u00FD\u00EFb\u00C7\u00F1\u0090u\u008FdY\u0096\u009C\u00CF\u00FB\u00E5\x178\u00F6\u00E9\u00FC\u00E8\u0091\u00F4|\u00EF\u00B9{\u00EEy\x14\u00BF\u00D2S\x00\x00\u0080\x18\u00A3R\x05\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00\u00889\tT\x01*\u00F2\b\u00B1~\x1D\u00D1\u00A9\u00A5\u00B8\u00A0\u00A9\u00A8WC4\u00AA\u00ABUK\x15\t6\u00E3\u00E7\u008A\u00D7\u00A7\u009C\u00CE\x10\x07\u008E\u0089\u00BD\u0087\u00C4\u0086]b\u00E3Nm\u00FF!\u00AA\x0B\x00\t\r\u0094s0\x0F\u00EC%\u00AE\u00EC\u00E9\u00EF\u00D9.\u00A3c+]U,\u00B7W4=i\u00F3.\u00FB\u00CCeb\u00FARm\u00DE**\x10\u00C0\u00F9@\u00F1+=\u00A9\x05D)\u0098\u00AF\u00EA#z\u00B6\u00F5]s\u00B1\u00A7M\u00E3\u00B0w\u0092\u00B4\u00F3@\u00E2\u00D7s\u00C5\u009C5\u00DA\u00AC\u00A5T)\x00\x12\x1A(c6_\u00E4\x7F\u00FA\u008E\u00ACN\u00AD"\u00B8O\u00C7\u00FA\x1D\to}\u00AE}1\u0083\u00EA\x05@B\x03\u00A1gs\u0097\x0B\u00F4\x17~\u009Fqi\u0097r\u00DA\u00BFk\u00EA"\u00F1\u00CC\x7F\u00B4\u00AD\u00BB\u00A8j\x00$4 \u00F9\u00E6R\u00D4?\x0Fq\u00BF\u00F2\u00A7(\u00FC)\u00D7\u00DF>\u00D4_\u00FBT\u00F7\u00E5P\u00EB\x00Hh h\u00D7\u00B9o\'\u00EF\u00F8\u00C7r\u009A\u00D5\u008F\u00DA_L\u00DA}0\u00F1\u0096\x17\u00B4\u00F5[\u00A9|\x00$4PJ<\u00FF\u00DF\x15\u00EE\x7F\u008F\u00AA\u0090?\u00ED\u00FA\u00E3k\u00DA\u00A7?E\u00FBS\u0094\u00E2TZ4\x10\u00F5k\ng\u00B2\u00F0\u00F9Ef\u00B6\u00D8\u00B1_\u00DBsHh\u00BE\u00A8\x16\u00C3\u0096\u00A84\u00AD\'\x1A\u00D56\u008B\u0091d\x17\u00D9^\u00F3k\u00F7a}\u00CFa=7\u009B\u00B7e\u0098o\u00E6\u00EA\u00D5E\u00C3Z\u00A2VU\u00E1H\x12\u00C9\u0089\u00E6\u00EB\u009B\u0095-N\u00B8\u00C5\u00AF\x07\u00B5\x13\'\u00A8\x1F\u0090\u00D0\u0088\u00AB\x16m\u00D8o\u00DC\x13\u009E\u00A8\u00C0\x02\u00B8^~_{\u00FD\u00A3\u0090\u008B=\u00A4\u00BFhVO\u00F8\u008AfjB\u00828zJ\u00FC\u00B8D;r4\u00C0CZ7\x15\u00D7\u00F5\u00F5\x0F\u00EA\u00E3m\u00DB\u00D4\u0097\u00EA(\u00F6[\u00FB\u00A1\u00E3Ik\u00B7)\u00D3\u0097\u008A/\u00E7\u0094kS\u00AEvo\'\x06v\x17\u00BD\u00DAgwj\u0095[\u00B3j\u00C9\r\x12Nf$\u00A5\u00EFQ\u00D7n\x15?.\u00D6\u00E7\u00AC\t\u00E9Z\u0080\u0092\u00E8Pn\u00ED/\u008C\u00DD\u00FA\x02\x1Dm\u00D8l\u00E6\u00E1\u00C8\u00C2\r\u00DA\u00BA\u00F4\u00D0\u00CA\u00DC\u00A3\u00BD\u00E8\u00DD^';

        // ============================================================================
        // FUNÇÕES AUXILIARES DO SISTEMA
        // ============================================================================

        function netAccess() {
            return app.preferences.getPrefAsLong(AE_prefSection, AE_prefName);
        }

        function hexToRgb(hex) {
            if (hex == undefined) return [0.5, 0.5, 0.5];
            hex = hex.replace('#', '');
            var r = parseInt(hex.substring(0, 2), 16);
            var g = parseInt(hex.substring(2, 4), 16);
            var b = parseInt(hex.substring(4, 6), 16);
            return [r / 255, g / 255, b / 255];
        }

        function setFgColor(ctrl, hex) {
            var color = hexToRgb(hex);
            var pType = ctrl.graphics.PenType.SOLID_COLOR;
            ctrl.graphics.foregroundColor = ctrl.graphics.newPen(pType, color, 1);
        }

        function setCtrlHighlight(ctrl, normalColor1, highlightColor1) {
            setFgColor(ctrl, normalColor1);
            ctrl.addEventListener('mouseover', function () { setFgColor(ctrl, highlightColor1); });
            ctrl.addEventListener('mouseout', function () { setFgColor(ctrl, normalColor1); });
        }

        function applyThemeButton(btn) {
            if (!btn || !btn.graphics) return;
            var Brush = btn.graphics.BrushType;
            var Pen = btn.graphics.PenType;
            var normalBg = hexToRgb('#2E343B');
            var hoverBg = hexToRgb('#3A424C');
            var activeBg = hexToRgb('#FF0046');
            var textColor = hexToRgb('#FFFFFF');
            var borderColor = hexToRgb('#FF0046');
            var currentBg = normalBg;

            function redraw() {
                btn.notify('onDraw');
            }

            btn.onDraw = function () {
                var g = this.graphics;
                var w = this.size ? this.size[0] : this.bounds.width;
                var h = this.size ? this.size[1] : this.bounds.height;
                var path = g.newPath();
                path.rectPath(0, 0, w, h);
                g.fillPath(g.newBrush(Brush.SOLID_COLOR, currentBg), path);
                g.strokePath(g.newPen(Pen.SOLID_COLOR, borderColor, 1), path);
                g.foregroundColor = g.newPen(Pen.SOLID_COLOR, textColor, 1);
                g.drawString(this.text, 10, h / 2 + 4);
            };

            btn.addEventListener('mouseover', function () { currentBg = hoverBg; redraw(); });
            btn.addEventListener('mouseout', function () { currentBg = normalBg; redraw(); });
            btn.addEventListener('mousedown', function () { currentBg = activeBg; redraw(); });
            btn.addEventListener('mouseup', function () { currentBg = hoverBg; redraw(); });
        }

        function ensureFolder(targetFolder) {
            var folderRef = targetFolder instanceof Folder ? targetFolder : new Folder(targetFolder);
            if (!folderRef.exists) folderRef.create();
            return folderRef;
        }

        function normalizePath(pathStr) {
            return decodeURI(pathStr).replace(/\\/g, '/');
        }

        function copyFileTo(srcFile, destPath) {
            if (!(srcFile instanceof File) || !srcFile.exists) return false;
            var destFile = destPath instanceof File ? destPath : new File(destPath);
            var parentFolder = ensureFolder(destFile.parent);
            if (destFile.exists) destFile.remove();
            return srcFile.copy(destFile.fsName);
        }

        function copyFolderRecursive(srcFolder, destFolder) {
            if (!(srcFolder instanceof Folder)) return;
            ensureFolder(destFolder);
            var entries = srcFolder.getFiles();
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry instanceof Folder) {
                    if (entry.name.match(/^(\.git|\.vscode|logs|cache|node_modules)$/i)) continue;
                    copyFolderRecursive(entry, new Folder(destFolder.fullName + '/' + entry.name));
                } else if (entry instanceof File) {
                    if (entry.name.match(/^(\.gitignore)$/i)) continue;
                    copyFileTo(entry, destFolder.fullName + '/' + entry.name);
                }
            }
        }

        function saveTextFile(fileContent, filePath) {
            var newFile = new File(filePath);
            newFile.encoding = 'UTF-8';
            newFile.open('w');
            newFile.write(fileContent);
            newFile.close();
            return newFile;
        }

        // Cria imagem do header a partir da string binaria, com fallback seguro
        function createHeaderImage(winRef, headerData) {
            try {
                var tmpHeader = new File(Folder.temp.fullName + "/gnd9_installer_header.png");
                if (tmpHeader.exists) tmpHeader.remove();
                tmpHeader.encoding = "BINARY";
                tmpHeader.open("w");
                tmpHeader.write(headerData);
                tmpHeader.close();
                if (tmpHeader.exists) return winRef.add('image', undefined, tmpHeader);
            } catch (e) {
                // fallback handled below
            }
            return null;
        }

        // ============================================================================
        // FUNÇÕES DE DOWNLOAD E REDE (cURL)
        // ============================================================================

        function downloadFile(url, destPath) {
            var cmd = "";
            var safeDest = destPath.fsName;
            
            if (appOs == "Win") {
                // -L: redirects, -k: ignore SSL errors, --connect-timeout: timeout in seconds
                cmd = 'cmd /c curl -L -k --connect-timeout 20 "' + url + '" -o "' + safeDest + '"';
            } else {
                return false; // Mac não suportado neste script
            }

            app.system(cmd);
            var f = new File(destPath);
            return f.exists && f.length > 0;
        }

        // ============================================================================
        // LÓGICA DE INSTALAÇÃO E ESTRUTURAÇÃO
        // ============================================================================

        function ensureJsonFile(filePath, defaultContentObj) {
            var f = new File(filePath);
            if (!f.exists) {
                if (!f.parent.exists) f.parent.create();
                f.encoding = "UTF-8";
                f.open('w');
                try {
                    f.write(JSON.stringify(defaultContentObj, null, 4));
                } catch(e) {
                    f.write(defaultContentObj.toSource ? defaultContentObj.toSource() : "{}");
                }
                f.close();
                return true;
            }
            return false;
        }

        function manageRuntimeFolder(destRoot) {
            var destRuntime = new Folder(destRoot.fullName + "/runtime");
            var destConfig = new Folder(destRuntime.fullName + "/config");
            var destPrefs = new Folder(destRuntime.fullName + "/prefs");

            if (!destRuntime.exists) destRuntime.create();
            if (!destConfig.exists) destConfig.create();
            if (!destPrefs.exists) destPrefs.create();

            // Se o pacote local tiver a pasta runtime, copiamos o que tiver
            if (packageRoot) {
                var sourceRuntime = new Folder(packageRoot.fullName + "/runtime");
                if (sourceRuntime.exists) copyFolderRecursive(sourceRuntime, destRuntime);
            }

            // Garante arquivos essenciais se não existirem
            ensureJsonFile(destRuntime.fullName + "/manifest.json", default_Manifest);
            ensureJsonFile(destPrefs.fullName + "/User_Preferences.json", default_UserPrefs);
            ensureJsonFile(destConfig.fullName + "/System_Settings.json", default_SystemSettings);
            ensureJsonFile(destConfig.fullName + "/Dados_Config.json", default_DadosConfig);
        }

        function packageIsValid() {
            if (!(packageRoot instanceof Folder) || !packageRoot.exists) return false;
            // Validacao minima: deve ter source com conteudo e o script principal
            var mainFile = new File(packageRoot.fullName + '/GND9TOOLS.jsx');
            var sourceFolder = new Folder(packageRoot.fullName + '/source');
            return (mainFile.exists && sourceFolder.exists && sourceFolder.getFiles().length > 0);
        }

        function getLocalBinary() {
            // Procura binario empacotado ao lado do instalador
            var candidates = [
                new File(releaseFolder.fullName + '/GND9TOOLS_source.jsxbin'),
                new File(releaseFolder.fullName + '/' + SCRIPT_INFO.REMOTE_BIN_NAME)
            ];
            for (var i = 0; i < candidates.length; i++) {
                var bin = candidates[i];
                if (bin.exists && bin.length > 0) return bin;
            }
            return null;
        }

        function installScript() {
            if (appOs == 'Mac') return;

            ensureFolder(deployRoot);
            var targetSourceFolder = new Folder(deployRoot.fullName + "/source");
            if (!targetSourceFolder.exists) targetSourceFolder.create();

            // --- LOGICA HIBRIDA DE INSTALA??O ---
            var useBinary = false;
            var selectedBinName = null;
            var downloadSuccess = false;
            var localBinary = getLocalBinary();
            var hasLocalSource = packageIsValid();

            if (confirm("Gostaria de baixar a versao mais recente da nuvem (Recomendado)?\n\n[Sim] Baixa o binario compilado (.jsxbin).\n[Nao] Instala a versao local atual (codigo aberto).", false, "Tipo de Instalacao")) {
                
                progressLab.text = "Baixando atualizacao...";
                win.update();

                var tempBinFile = new File(Folder.temp.fullName + "/" + SCRIPT_INFO.REMOTE_BIN_NAME);
                downloadSuccess = downloadFile(SCRIPT_INFO.REMOTE_BIN_URL, tempBinFile);

                if (downloadSuccess) {
                    // Copia o binario baixado para o destino
                    tempBinFile.copy(targetSourceFolder.fullName + "/" + SCRIPT_INFO.REMOTE_BIN_NAME);
                    selectedBinName = SCRIPT_INFO.REMOTE_BIN_NAME;
                    useBinary = true;
                    
                    // Se estiver usando binario, ainda precisamos garantir que a pasta Runtime e resources existam
                    manageRuntimeFolder(deployRoot); 
                    
                    // Copiamos tamb?m a pasta 'source' local para garantir que bibliotecas de imagens/?cones estejam l?
                    // (O binario geralmente precisa de assets externos se n?o estiverem embedados)
                    if (hasLocalSource) {
                        copyFolderRecursive(new Folder(packageRoot.fullName + '/source'), targetSourceFolder);
                    }
                } else {
                    alert("Falha no download. Tentando instalacao local...");
                }
            }

            if (!useBinary) {
                if (!hasLocalSource && localBinary) {
                    progressLab.text = "Usando binario local do release...";
                    copyFileTo(localBinary, targetSourceFolder.fullName + "/" + localBinary.name);
                    selectedBinName = localBinary.name;
                    useBinary = true;

                    // Garante runtime mesmo em instalacao bin?ria local
                    manageRuntimeFolder(deployRoot);
                } else if (!hasLocalSource) {
                    alert("Pacote local incompleto e binario nao encontrado. Instalacao abortada.");
                    return;
                } else {
                    // Instalacao Local (Source Code)
                    progressLab.text = "Copiando arquivos locais...";

                    // Copia Script Principal
                    var mainScript = new File(packageRoot.fullName + '/GND9TOOLS.jsx');
                    if (mainScript.exists) mainScript.copy(deployRoot.fullName + '/GND9TOOLS.jsx');

                    // Copia Pasta Source
                    var localSource = new Folder(packageRoot.fullName + '/source');
                    copyFolderRecursive(localSource, targetSourceFolder);

                    // Gerencia Runtime
                    manageRuntimeFolder(deployRoot);
                }
            }

            // --- CRIA??O DOS LOADERS NO AE ---
            var localAeFolder = new Folder(userPath + localAePath);
            if (!localAeFolder.exists) {
                alert('Pasta do After Effects nao encontrada no caminho padrao.');
                return;
            }

            var vFolderArray = localAeFolder.getFiles();
            progressBar.maxvalue = vFolderArray.length + 1;
            
            try {
                for (var i = 0; i < vFolderArray.length; i++) {
                    var vFolder = vFolderArray[i];
                    if (!(vFolder instanceof Folder) || vFolder.name.match(/logs/i)) continue;

                    progressLab.text = "Configurando: " + (vFolder.displayName || vFolder.name);
                    progressBar.value++;
                    win.update();

                    var scriptPanelsPath = vFolder.fullName + localScriptsPanelPath;
                    var scriptPanelsFolder = new Folder(scriptPanelsPath);
                    if (!scriptPanelsFolder.exists) scriptPanelsFolder.create();

                    // Cria o codigo do Loader adequado
                    var deployPath = normalizePath(deployRoot.fullName);
                    var safePath = deployPath.replace(/'/g, "\\'");
                    var loaderCode = "";

                    if (useBinary) {
                        // Loader para Binario
                        var binName = selectedBinName || SCRIPT_INFO.REMOTE_BIN_NAME;
                        var binPath = safePath + "/source/" + binName;
                        loaderCode = 'try { $.evalFile(\"' + binPath + '\"); } catch(e) { alert(\"Erro ao carregar GND9TOOLS Binario:\\n\" + e.toString()); }';
                    } else {
                        // Loader para Source Aberto
                        var jsxPath = safePath + "/GND9TOOLS.jsx";
                        loaderCode = "try {\\n" +
                                     "    var scriptMainPath = '" + safePath + "/';\\n" +
                                     "    var scriptMainFile = new File('" + jsxPath + "');\\n" +
                                     "    if(scriptMainFile.exists) { $.evalFile(scriptMainFile); }\\n" +
                                     "    else { alert(\\\"GND9TOOLS.jsx nao encontrado em: \\\" + scriptMainPath); }\\n" +
                                     "} catch (err) { alert(\\\"Erro Loader:\\n\\\" + err.toString()); }";
                    }

                    saveTextFile(loaderCode, scriptPanelsFolder.fullName + '/GND9TOOLS.jsx');
                }
                progressLab.text = "Instalacao Concluida!";
                alert("Instalacao realizada com sucesso!\nReinicie o After Effects.");
            } catch (err) {
                progressLab.text = "Erro: " + err.message;
            }
        }

        // -----------------------------------------------------
        // FUNÇÕES DE REMOÇÃO E REPARO
        // -----------------------------------------------------

        function removeScript() {
            if (appOs == 'Mac') return;
            var localAeFolder = new Folder(userPath + localAePath);
            var vFolderArray = localAeFolder.getFiles();
            progressBar.maxvalue = vFolderArray.length;
            progressBar.value = 0;

            for (var i = 0; i < vFolderArray.length; i++) {
                var vFolder = vFolderArray[i];
                if (!(vFolder instanceof Folder)) continue;
                
                progressLab.text = "Limpando: " + vFolder.name;
                progressBar.value++;
                win.update();

                var scriptPanelsPath = vFolder.fullName + localScriptsPanelPath;
                var scriptPanelsFolder = new Folder(scriptPanelsPath);
                
                if (scriptPanelsFolder.exists) {
                    var files = scriptPanelsFolder.getFiles();
                    for (var j=0; j<files.length; j++) {
                        if (files[j].name.match(/GND9TOOLS\.jsx/i)) files[j].remove();
                    }
                }
            }
            progressLab.text = "Script removido.";
        }

        function repairScript() {
            removeScript();
            installScript();
        }

        // ============================================================================
        // CONSTRUÇÃO DA UI (WIZARD)
        // ============================================================================

        var win = new Window('window', SCRIPT_INFO.name + ' ' + SCRIPT_INFO.version, undefined, { closeButton: false });
        win.orientation = 'column';
        win.alignChildren = ['center', 'top'];
        win.spacing = 12;
        win.margins = 8;

        var headerImg = createHeaderImage(win, header);
        if (headerImg) {
            headerImg.alignment = 'fill';
            headerImg.preferredSize = [600, 140];
        } else {
            var headerPanel = win.add('panel', undefined, 'GNEWS D9 TOOLS');
            headerPanel.alignment = 'fill';
            headerPanel.preferredSize = [600, 120];
        }

        var mainGrp = win.add('group');
        mainGrp.alignment = 'fill';
        mainGrp.orientation = 'stack';

        // PÁGINA 0: Intro
        var pageGrp0 = mainGrp.add('group');
        pageGrp0.orientation = 'column';
        pageGrp0.alignment = 'fill';
        var page0Lab = pageGrp0.add('statictext', undefined, 'Bem-vindo ao instalador do GNEWS D9 TOOLS.\nVerificando requisitos de sistema...', { multiline: true });
        page0Lab.preferredSize = [284, 60];
        pArray.push(pageGrp0);

        // PÁGINA 1: Permissões
        var pageGrp1 = mainGrp.add('group');
        pageGrp1.orientation = 'column';
        pageGrp1.alignment = 'fill';
        pageGrp1.visible = false;
        var page1Lab = pageGrp1.add('statictext', undefined, '...', { multiline: true });
        page1Lab.preferredSize = [284, 60];
        var prefTxt = pageGrp1.add('statictext', undefined, 'Abrir preferencias de scripts');
        setCtrlHighlight(prefTxt, '#d4003cff', '#ff1759ff');
        prefTxt.addEventListener('click', function () { try { app.executeCommand(3131); } catch (e) {} page1Update(); });
        pArray.push(pageGrp1);

        function page1Update() {
            var accessOk = netAccess();
            page1Lab.text = accessOk ? 'Acesso a rede: OK!\nPermissao de escrita: OK!' : 'Habilite a opcao:\n"Allow Scripts to Write Files..."\nnas preferencias do After Effects.';
            nextBtn.enabled = accessOk;
            if (!accessOk && !page1Update._autoOpened) {
                page1Update._autoOpened = true;
                try { app.executeCommand(3131); } catch (e) {}
            }
        }

        }

// PÁGINA 2: Opções
        var pageGrp2 = mainGrp.add('group');
        pageGrp2.orientation = 'column';
        pageGrp2.alignment = 'fill';
        pageGrp2.visible = false;
        
        var rdoGrp = pageGrp2.add('group');
        rdoGrp.orientation = 'row';
        var installRdo = rdoGrp.add('radiobutton', undefined, 'Instalar');
        installRdo.value = true;
        var repairRdo = rdoGrp.add('radiobutton', undefined, 'Reparar');
        var removeRdo = rdoGrp.add('radiobutton', undefined, 'Remover');
        
        var pathTxt = pageGrp2.add('statictext', undefined, "Origem: " + (packageIsValid() ? "Local Detectado" : "Apenas Download"), { truncate: 'middle' });
        pathTxt.preferredSize = [284, 20];
        pArray.push(pageGrp2);

        // PÁGINA 3: Conclusão
        var pageGrp3 = mainGrp.add('group');
        pageGrp3.orientation = 'column';
        pageGrp3.visible = false;
        var page3Lab = pageGrp3.add('statictext', undefined, 'Processo finalizado.\nClique em concluir.', { multiline: true });
        page3Lab.preferredSize = [284, 60];
        pArray.push(pageGrp3);

        // RODAPÉ: Progresso e Botões
        var progressGrp = win.add('group');
        progressGrp.orientation = 'column';
        var progressLab = progressGrp.add('statictext', undefined, '');
        progressLab.preferredSize = [284, 18];
        var progressBar = progressGrp.add('progressbar', undefined, 0, 100);
        progressBar.preferredSize = [300, 2];

        var btnGrp = win.add('group');
        btnGrp.alignment = 'fill';
        var cancelBtn = btnGrp.add('button', undefined, 'Cancelar');
        var backBtn = btnGrp.add('button', undefined, 'Anterior');
        backBtn.enabled = false;
        var nextBtn = btnGrp.add('button', undefined, 'Comecar');
        cancelBtn.enabled = true;


        // NAVEGAÇÃO
        function setPage(dir) {
            pArray[p].visible = false;
            p += dir;
            if (p < 0) p = 0;
            if (p >= pArray.length) p = pArray.length - 1;
            
            pArray[p].visible = true;
            backBtn.enabled = (p > 0);
            backBtn.visible = (p > 0);
            
            if (p === 0) nextBtn.enabled = true;
            if (p === 1) { page1Update(); }
            if (p === 2) nextBtn.enabled = true; // Sempre true pois agora temos download
            
            cancelBtn.enabled = (p < 3);
            nextBtn.text = (p < 3) ? 'Próximo' : 'Concluir';
            if (p === 3) { nextBtn.enabled = true; cancelBtn.visible = false; backBtn.visible = false; }
        }

        cancelBtn.onClick = function() { win.close(); };
        backBtn.onClick = function() { setPage(-1); };
        nextBtn.onClick = function() {
            if (p === 2) {
                // Executa a ação
                setPage(1); // Vai para pag 3
                if (installRdo.value) installScript();
                else if (repairRdo.value) repairScript();
                else if (removeRdo.value) removeScript();
            } else if (p === 3) {
                win.close();
            } else {
                setPage(1);
            }
        };

        win.show();
    }

    installerUi();
}
