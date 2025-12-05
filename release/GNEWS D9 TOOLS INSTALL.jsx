{
    // ============================================================================
    // 1. CONFIGURAÇÕES E DADOS PADRÃO
    // ============================================================================
    var SCRIPT_INFO = {
        name: 'GNEWS D9 TOOLS',
        version: 'v3.5 ThemedUI',
        // CREDENCIAIS GITHUB
        GH_USER: "rdenoni",
        GH_REPO: "GNEWS-D9-TOOLS",
        GH_BRANCH: "main",
        GH_TOKEN: "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", 
        BIN_NAME: "GND9TOOLS_source.jsxbin"
    };

    SCRIPT_INFO.DOWNLOAD_URL = "https://raw.githubusercontent.com/" + SCRIPT_INFO.GH_USER + "/" + SCRIPT_INFO.GH_REPO + "/" + SCRIPT_INFO.GH_BRANCH + "/" + SCRIPT_INFO.BIN_NAME;

    var UI_COLORS = {
        BG: [0.09, 0.09, 0.09],       // #161616
        PANEL: [0.13, 0.13, 0.13],    
        TEXT_MAIN: [0.78, 0.78, 0.79],
        TEXT_TITLE: [1, 1, 1],        
        ACCENT: [1, 0, 0.27],         
        SUCCESS: [0.59, 0.89, 0.25],
        ERROR: [1, 0.2, 0.2],
        WARNING: [0.98, 0.65, 0.14]
    };

    var header = '\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x02\u008B\x00\x00\x01P\b\x02\x00\x00\x00X\u0099\u00A31\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03viTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin="\u00EF\u00BB\u00BF" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 9.1-c003 79.9690a87fc, 2025/03/06-20:50:16        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:OriginalDocumentID="xmp.did:50c0fae5-4911-5544-a4a7-73706b5b8009" xmpMM:DocumentID="xmp.did:E56B76606B4511F0AFE79EB082197432" xmpMM:InstanceID="xmp.iid:E56B765F6B4511F0AFE79EB082197432" xmp:CreatorTool="Adobe Photoshop 26.6 (Windows)"> <xmpMM:DerivedFrom stRef:instanceID="xmp.iid:06f4c72b-639b-7a45-a5a1-bc7a4e52dd0f" stRef:documentID="xmp.did:50c0fae5-4911-5544-a4a7-73706b5b8009"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>#^\u00A9\x07\x00\x00<\x10IDATx\u00DA\u00EC\u00DD\x07|\x1B\u00E5\u00E1\u00FF\u00F1\u00E7N\u0096mYV\u00F6\u00DE\u00D3!\u0083\u00ECEB\x18I\n\u00842\x13\x12~P\b\u00A3\u0085\u00B6\u0081\u00B0\t#e\u0093B\u0081\x16(I\u00FE-)\t\x04(\u00B3a\u0093\x042\u00C8\u00DE{;\u0083\u00EC\u00BDe[\u00B6,\u00DD\u00FD\u00EFb\u00C7\u00F1\u0090u\u008FdY\u0096\u009C\u00CF\u00FB\u00E5\x178\u00F6\u00E9\u00FC\u00E8\u0091\u00F4|\u00EF\u00B9{\u00EEy\x14\u00BF\u00D2S\x00\x00\u0080\x18\u00A3R\x05\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00 \u00A1\x01\x00\x00\t\r\x00\x00\t\r\x00\x00Hh\x00\x00Hh\x00\x00@B\x03\x00@B\x03\x00\x00\x12\x1A\x00\x00\u0090\u00D0\x00\x00\u0090\u00D0\x00\x00\u0080\u0084\x06\x00\u0080\u0084\x06\x00\x00$4\x00\x00$4\x00\x00\u00889\tT\x01*\u00F2\b\u00B1~\x1D\u00D1\u00A9\u00A5\u00B8\u00A0\u00A9\u00A8WC4\u00AA\u00ABUK\x15\t6\u00E3\u00E7\u008A\u00D7\u00A7\u009C\u00CE\x10\x07\u008E\u0089\u00BD\u0087\u00C4\u0086]b\u00E3Nm\u00FF!\u00AA\x0B\x00\t\r\u0094s0\x0F\u00EC%\u00AE\u00EC\u00E9\u00EF\u00D9.\u00A3c+]U,\u00B7W4=i\u00F3.\u00FB\u00CCeb\u00FARm\u00DE**\x10\u00C0\u00F9@\u00F1+=\u00A9\x05D)\u0098\u00AF\u00EA#z\u00B6\u00F5]s\u00B1\u00A7M\u00E3\u00B0w\u0092\u00B4\u00F3@\u00E2\u00D7s\u00C5\u009C5\u00DA\u00AC\u00A5T)\x00\x12\x1A(c6_\u00E4\x7F\u00FA\u008E\u00ACN\u00AD"\u00B8O\u00C7\u00FA\x1D\to}\u00AE}1\u0083\u00EA\x05@B\x03\u00A1gs\u0097\x0B\u00F4\x17~\u009Fqi\u0097r\u00DA\u00BFk\u00EA"\u00F1\u00CC\x7F\u00B4\u00AD\u00BB\u00A8j\x00$4 \u00F9\u00E6R\u00D4?\x0Fq\u00BF\u00F2\u00A7(\u00FC)\u00D7\u00DF>\u00D4_\u00FBT\u00F7\u00E5P\u00EB\x00Hh h\u00D7\u00B9o\'\u00EF\u00F8\u00C7r\u009A\u00D5\u008F\u00DA_L\u00DA}0\u00F1\u0096\x17\u00B4\u00F5[\u00A9|\x00$4PJ<\u00FF\u00DF\x15\u00EE\x7F\u008F\u00AA\u0090?\u00ED\u00FA\u00E3k\u00DA\u00A7?E\u00FBS\u0094\u00E2TZ4\x10\u00F5k\ng\u00B2\u00F0\u00F9Ef\u00B6\u00D8\u00B1_\u00DBsHh\u00BE\u00A8\x16\u00C3\u0096\u00A84\u00AD\'\x1A\u00D56\u008B\u0091d\x17\u00D9^\u00F3k\u00F7a}\u00CFa=7\u009B\u00B7e\u0098o\u00E6\u00EA\u00D5E\u00C3Z\u00A2VU\u00E1H\x12\u00C9\u0089\u00E6\u00EB\u009B\u0095-N\u00B8\u00C5\u00AF\x07\u00B5\x13\'\u00A8\x1F\u0090\u00D0\u0088\u00AB\x16m\u00D8o\u00DC\x13\u009E\u00A8\u00C0\x02\u00B8^~_{\u00FD\u00A3\u0090\u008B=\u00A4\u00BFhVO\u00F8\u008AfjB\u00828zJ\u00FC\u00B8D;r4\u00C0CZ7\x15\u00D7\u00F5\u00F5\x0F\u00EA\u00E3m\u00DB\u00D4\u0097\u00EA(\u00F6[\u00FB\u00A1\u00E3Ik\u00B7)\u00D3\u0097\u008A/\u00E7\u0094kS\u00AEvo\'\x06v\x17\u00BD\u00DAgwj\u0095[\u00B3j\u00C9\r\x12Nf$\u00A5\u00EFQ\u00D7n\x15?.\u00D6\u00E7\u00AC\t\u00E9Z\u0080\u0092\u00E8Pn\u00ED/\u008C\u00DD\u00FA\x02\x1Dm\u00D8l\u00E6\u00E1\u00C8\u00C2\r\u00DA\u00BA\u00F4\u00D0\u00CA\u00DC\u00A3\u00BD\u00E8\u00DD^';

    // OBJETOS PADRÃO DO RUNTIME
    var default_Manifest = { "version": "3.5.0", "installedAt": new Date().toString(), "status": "fresh_install" };
    
    var default_UserPrefs = {
        "color": {
            "menu": { "light": "#3E50B4", "dark": "#8FF7A7" },
            "controls": { "light": "#BF3A48", "dark": "#DA6877" },
            "animation": { "light": "#CB6259", "dark": "#B7B5E4 " },
            "tools": { "light": "#6EA57D", "dark": "#E2EE96" },
            "effects": { "light": "#D68A69", "dark": "#ACCDEC" },
            "text": { "light": "#C2B6A3", "dark": "#F4E76E" },
            "brand": { "light": "#3F3F58", "dark": "#BBBBBD" },
            "project": { "light": "#00B5C2", "dark": "#7CC6FE" },
            "shortcuts": { "light": "#CD4548", "dark": "#FFB398" },
            "app": { "light": "#6639B6", "dark": "#FFAFB7" },
            "dev": { "light": "#202020", "dark": "#F4FAFF" }
        },
        "labels": [
            "#F44336", "#E81D62", "#9B26AF", "#6639B6",
            "#3E50B4", "#02A8F3", "#00BBD3", "#009587",
            "#8AC249", "#CCDB38", "#FEEA3A", "#FE9700",
            "#FF5722", "#785447", "#9D9D9D", "#5F7C8A"
        ],
        "folders": { "projPath": "~/Desktop" },
        "uiSettings": {
            "iconSize": [30, 30],
            "iconSpacing": 1,
            "labelSpacing": 3,
            "compactIconSize": [28, 28],
            "compactIconSpacing": 28,
            "buttonThemes": [
                {
                    "id": "classic", "name": "Cl ssico", "width": 200, "height": 40, "cornerRadius": 8,
                    "background": "#2E343B", "hoverBackground": "#4E5560",
                    "textColor": "#FFFFFF", "hoverTextColor": "#FFFFFF",
                    "labelOffset": -18, "labelOffsetX": 0, "labelFontSize": 10, "textTransform": "uppercase"
                },
                {
                    "id": "destacado", "name": "Destacado", "width": 200, "height": 40, "cornerRadius": 8,
                    "background": "#FF2243", "hoverBackground": "#E00139",
                    "textColor": "#FFFFFF", "hoverTextColor": "#FFFFFF",
                    "labelOffset": -18, "labelOffsetX": 0, "labelFontSize": 10, "textTransform": "none"
                },
                {
                    "id": "minimal", "name": "Minimal", "width": 200, "height": 40, "cornerRadius": 8,
                    "background": "#EFEFEF", "hoverBackground": "#DBDBDB",
                    "textColor": "#1F1F1F", "hoverTextColor": "#1F1F1F",
                    "labelOffset": -18, "labelOffsetX": 0, "labelFontSize": 10, "textTransform": "none"
                }
            ],
            "activeButtonTheme": "classic",
            "verticalIconSize": [30, 30],
            "verticalIconSpacing": 25,
            "showLabels": true,
            "iconOnlySpacing": 50
        },
        "moduleSettings": { "hiddenKeys": [] },
        "selection": { "nullType": 0, "adjType": 0, "projectMode": 0 },
        "themeColors": {
            "bgColor1": "#161616FF",
            "bgColor2": "#1B1B1BFF",
            "divColor1": "#2F2F33",
            "monoColor0": "#F2F2F2",
            "monoColor1": "#C7C8CA",
            "monoColor2": "#5F5F67",
            "monoColor3": "#1A1919FF",
            "normalColor1": "#FFFFFFFF",
            "normalColor2": "#E6E6E6FF",
            "highlightColor1": "#FF0046FF"
        },
        "ignoreMissing": true,
        "devMode": false,
        "homeOffice": false,
        "iconTheme": "dark"
    };

    var default_SystemSettings = {
        "deployment": { "mode": "local", "network_root": "", "local_root": "~/AppData/Roaming/GND9TOOLS script/" },
        "COPYLINKS_Settings": {
            "configuracao": {
                "layout_grupos": {
                    "HARDNEWS SP": { "altura": 230 },
                    "SAO PAULO": { "altura": 310 },
                    "FANTASTICO": { "altura": 590 },
                    "IP MAQUINAS": { "altura": 590 },
                    "RIO DE JANEIRO": { "altura": 590 },
                    "ESPORTE": { "altura": 230 },
                    "GUIAS": { "altura": 310 },
                    "HARDNEWS RJ": { "altura": 590 },
                    "PROGRAMAS RJ": { "altura": 230 },
                    "PROMO": { "altura": 590 },
                    "CATALOGOS": { "altura": 550 },
                    "PROGRAMAS SP": { "altura": 310 }
                },
                "layout_geral": {
                    "name_btn_width": 590,
                    "text_width_normal": 460,
                    "btn_width": 0,
                    "name_btn_height": 42,
                    "bottom_row_height": 24
                }
            }
        },
        "TEMPLATES_Settings": {
            "PRODUCTIONS": [
                { "name": "JORNAIS", "icon": "D9T_TEMPPECAS_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/JORNAIS/_PECAS_GRAFICAS"], "cacheFile": "templates_jornais_cache.json", "metadataFile": "templates_jornais_metadata.json" },
                { "name": "ILUSTRACOES", "icon": "D9T_TILUSTRA_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/JORNAIS/_PECAS_GRAFICAS/Ilustracoes"], "cacheFile": "templates_ilustracoes_cache.json", "metadataFile": "templates_ilustracoes_metadata.json" },
                { "name": "BASE TEMATICA", "icon": "D9T_TBASE_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/JORNAIS/_PECAS_GRAFICAS/Bases caracter/_BASES_TEMATICAS"], "cacheFile": "templates_basetematica_cache.json", "metadataFile": "templates_basetematica_metadata.json" },
                { "name": "PROGRAMAS", "icon": "D9T_PROGRAMAS_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/PROGRAMAS"], "cacheFile": "templates_programas_cache.json", "metadataFile": "templates_programas_metadata.json" },
                { "name": "EVENTOS", "icon": "D9T_EVENTOS_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/EVENTOS"], "cacheFile": "templates_eventos_cache.json", "metadataFile": "templates_eventos_metadata.json" },
                { "name": "MARKETING", "icon": "D9T_MARKETING_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/MARKETING"], "cacheFile": "templates_marketing_cache.json", "metadataFile": "templates_marketing_metadata.json" },
                { "name": "PROMO", "icon": "D9T_PROMO_ICON", "paths": ["/t/JORNALISMO/GLOBONEWS/PROMO"], "cacheFile": "templates_promo_cache.json", "metadataFile": "templates_promo_metadata.json" }
            ],
            "gnews_templates": { "lastProductionIndex": 0, "directNetworkMode": false }
        },
        "LIBRARYLIVE_Settings": {
            "icon_root_paths": ["D:\\PROJETOS\\SCRIPTS AFTER\\files\\ICONS", "T:\\UTILIDADES\\ICONES"],
            "image_root_paths": ["D:\\PROJETOS\\SCRIPTS AFTER\\files\\IMAGENS", "T:\\UTILIDADES\\IMAGENS E VIDEOS AUTORIZADOS"],
            "tool_settings": {
                "LibraryLive": {
                    "icon_root_paths": ["D:\\PROJETOS\\SCRIPTS AFTER\\files\\ICONS", "T:\\UTILIDADES\\ICONES"],
                    "image_root_paths": ["D:\\PROJETOS\\SCRIPTS AFTER\\files\\IMAGENS", "T:\\UTILIDADES\\IMAGENS E VIDEOS AUTORIZADOS"]
                }
            }
        }
    };

    var default_DadosConfig = { "ARTES_GNEWS": { "arte": [] }, "PROGRAMACAO_GNEWS": { "programacao": [] }, "EQUIPE_GNEWS": { "equipe": [] }, "CAMINHOS_REDE": { "caminhos": [] } };

    // ============================================================================
    // 2. FUNÇÕES AUXILIARES
    // ============================================================================
    var appOs = $.os.indexOf('Win') >= 0 ? 'Win' : 'Mac';
    var userPath = Folder.userData.fullName;

    function netAccess() {
        return app.preferences.getPrefAsLong('Main Pref Section', 'Pref_SCRIPTING_FILE_NETWORK_SECURITY') === 1;
    }

    function ensureFolder(path) {
        var folderObj = (path instanceof Folder) ? path : new Folder(path);
        if (!folderObj.exists) {
            if (folderObj.parent && !folderObj.parent.exists) {
                ensureFolder(folderObj.parent);
            }
            folderObj.create();
        }
        return folderObj;
    }

    function ensureJsonFile(filePath, defaultContentObj) {
        var f = new File(filePath);
        ensureFolder(f.parent);
        if (!f.exists) {
            f.encoding = "UTF-8";
            if(f.open('w')) {
                try { 
                    f.write(JSON.stringify(defaultContentObj, null, 4)); 
                } catch(e) { 
                    f.write(defaultContentObj.toSource ? defaultContentObj.toSource() : "{}"); 
                }
                f.close();
            }
        }
    }

    function copyFolderRecursive(src, dest) {
        if (!src instanceof Folder || !src.exists) return;
        ensureFolder(dest);
        var files = src.getFiles();
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f instanceof Folder) {
                if (!f.name.match(/^(\.git|\.vscode|logs|node_modules)$/i)) {
                    copyFolderRecursive(f, new Folder(dest.fullName + "/" + f.name));
                }
            } else {
                f.copy(dest.fullName + "/" + f.name);
            }
        }
    }

    function manageRuntimeFolder(destRoot, possiblePackageRoot) {
        var destRuntime = new Folder(destRoot.fullName + "/runtime");
        var destConfig = new Folder(destRuntime.fullName + "/config");
        var destPrefs = new Folder(destRuntime.fullName + "/prefs");

        if (possiblePackageRoot) {
            var sourceRuntime = new Folder(possiblePackageRoot.fullName + "/runtime");
            if (sourceRuntime.exists) {
                try { copyFolderRecursive(sourceRuntime, destRuntime); } catch(e){}
            }
        }

        ensureFolder(destRuntime);
        ensureFolder(destConfig);
        ensureFolder(destPrefs);

        ensureJsonFile(destRuntime.fullName + "/manifest.json", default_Manifest);
        ensureJsonFile(destPrefs.fullName + "/User_Preferences.json", default_UserPrefs);
        ensureJsonFile(destConfig.fullName + "/System_Settings.json", default_SystemSettings);
        ensureJsonFile(destConfig.fullName + "/Dados_Config.json", default_DadosConfig);
    }

    function seedCacheFromNetwork(installerLocation, localRuntimePath) {
        var networkCache = new Folder(installerLocation.fullName + "/cache_server");
        var localCache = new Folder(localRuntimePath.fullName + "/cache");
        if (networkCache.exists) {
            ensureFolder(localCache);
            copyFolderRecursive(networkCache, localCache);
            return true;
        }
        return false;
    }

    function downloadFile(url, destPath) {
        if (appOs !== "Win") return false;
        var headerCmd = "";
        if (SCRIPT_INFO.GH_TOKEN) { headerCmd = '-H "Authorization: token ' + SCRIPT_INFO.GH_TOKEN + '" '; }
        var cmd = 'cmd /c curl ' + headerCmd + '-L -k --connect-timeout 15 "' + url + '" -o "' + destPath.fsName + '"';
        app.system(cmd);
        var f = new File(destPath);
        return f.exists && f.length > 100;
    }

    function saveLoader(path, code) {
        var f = new File(path);
        ensureFolder(f.parent);
        f.encoding = "UTF-8";
        f.open('w');
        f.write(code);
        f.close();
    }
    
    function normalizePath(path) { return decodeURI(path).replace(/\\/g, '/'); }

    // FUNÇÃO PARA ALERTA CUSTOMIZADO
    function showThemedAlert(title, message, type) {
        var dlg = new Window("dialog", title);
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 15;
        dlg.margins = 20;
        dlg.graphics.backgroundColor = dlg.graphics.newBrush(dlg.graphics.BrushType.SOLID_COLOR, UI_COLORS.BG);

        var titleGrp = dlg.add("group");
        titleGrp.alignment = ["fill", "top"];
        titleGrp.spacing = 10;
        
        var iconColor = (type === "error") ? UI_COLORS.ERROR : (type === "success" ? UI_COLORS.SUCCESS : UI_COLORS.WARNING);
        var strip = titleGrp.add("panel");
        strip.preferredSize = [6, 40];
        strip.graphics.backgroundColor = strip.graphics.newBrush(strip.graphics.BrushType.SOLID_COLOR, iconColor);

        var textGrp = titleGrp.add("group");
        textGrp.orientation = "column";
        textGrp.alignChildren = ["left", "center"];
        textGrp.spacing = 4;

        var titleText = textGrp.add("statictext", undefined, title);
        titleText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);
        titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_TITLE, 1);

        var msgText = textGrp.add("statictext", undefined, message, {multiline: true});
        msgText.graphics.foregroundColor = msgText.graphics.newPen(msgText.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_MAIN, 1);
        msgText.preferredSize.width = 350;

        var btnGrp = dlg.add("group");
        btnGrp.alignment = ["right", "bottom"];
        var okBtn = btnGrp.add("button", undefined, "OK");
        okBtn.onClick = function() { dlg.close(); };

        dlg.center();
        dlg.show();
    }

    // FUNÇÃO PARA CONFIRMAÇÃO CUSTOMIZADA (Substitui o confirm nativo)
    function showThemedConfirm(title, message) {
        var result = false;
        var dlg = new Window("dialog", title);
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 15;
        dlg.margins = 20;
        dlg.graphics.backgroundColor = dlg.graphics.newBrush(dlg.graphics.BrushType.SOLID_COLOR, UI_COLORS.BG);

        var titleGrp = dlg.add("group");
        titleGrp.alignment = ["fill", "top"];
        titleGrp.spacing = 10;
        
        var strip = titleGrp.add("panel");
        strip.preferredSize = [6, 40];
        strip.graphics.backgroundColor = strip.graphics.newBrush(strip.graphics.BrushType.SOLID_COLOR, UI_COLORS.ACCENT);

        var textGrp = titleGrp.add("group");
        textGrp.orientation = "column";
        textGrp.alignChildren = ["left", "center"];
        textGrp.spacing = 4;

        var titleText = textGrp.add("statictext", undefined, title);
        titleText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);
        titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_TITLE, 1);

        var msgText = textGrp.add("statictext", undefined, message, {multiline: true});
        msgText.graphics.foregroundColor = msgText.graphics.newPen(msgText.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_MAIN, 1);
        msgText.preferredSize.width = 350;

        var btnGrp = dlg.add("group");
        btnGrp.alignment = ["right", "bottom"];
        var noBtn = btnGrp.add("button", undefined, "Não");
        var yesBtn = btnGrp.add("button", undefined, "Sim");
        
        noBtn.onClick = function() { result = false; dlg.close(); };
        yesBtn.onClick = function() { result = true; dlg.close(); };
        
        dlg.center();
        dlg.show();
        return result;
    }

    // ============================================================================
    // 3. INTERFACE GRÁFICA (UI/UX)
    // ============================================================================

    function buildUI() {
        var win = new Window('palette', SCRIPT_INFO.name + " Setup", undefined, { closeButton: true });
        win.orientation = 'column';
        win.alignChildren = ['fill', 'top'];
        win.spacing = 0;
        win.margins = 0;
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, UI_COLORS.BG);

        // HEADER
        var headerContainer = win.add('group');
        headerContainer.orientation = 'column';
        headerContainer.alignChildren = ['center', 'center']; 
        headerContainer.alignment = ['fill', 'top'];
        headerContainer.margins = 0;
        headerContainer.spacing = 0;
        headerContainer.preferredSize = [600, 150]; 
        
        try {
            var imgFile = File.decode(header);
            var img = headerContainer.add('image', undefined, imgFile);
            img.alignment = ['center', 'center'];
        } catch(e) { }

        var div = win.add('group');
        div.preferredSize = [-1, 2];
        div.alignment = ['fill', 'top'];
        div.graphics.backgroundColor = div.graphics.newBrush(div.graphics.BrushType.SOLID_COLOR, UI_COLORS.ACCENT);

        // STACK
        var contentGrp = win.add('group');
        contentGrp.orientation = 'stack';
        contentGrp.alignment = ['fill', 'fill'];
        contentGrp.margins = 30;
        contentGrp.preferredSize = [450, 200];

        function addTitle(parent, text) {
            var t = parent.add('statictext', undefined, text);
            t.graphics.font = ScriptUI.newFont("Arial", "BOLD", 18);
            t.graphics.foregroundColor = t.graphics.newPen(t.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_TITLE, 1);
            return t;
        }
        function addDesc(parent, text) {
            var t = parent.add('statictext', undefined, text, {multiline: true});
            t.graphics.foregroundColor = t.graphics.newPen(t.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_MAIN, 1);
            t.preferredSize.width = 400;
            return t;
        }

        // PÁGINA 0: BEM-VINDO
        var p0 = contentGrp.add('group');
        p0.orientation = 'column'; p0.alignChildren = ['left', 'top'];
        addTitle(p0, "Instalação Automatizada");
        addDesc(p0, "\nBem-vindo ao GNEWS D9 TOOLS.\n\nEste assistente configurará automaticamente o ambiente ideal para o seu computador.");

        // PÁGINA 1: PERMISSÕES
        var p1 = contentGrp.add('group');
        p1.orientation = 'column'; p1.alignChildren = ['left', 'top']; p1.visible = false;
        addTitle(p1, "Permissões Pendentes");
        var p1Desc = addDesc(p1, "\nO script requer acesso à rede.\n\n1. Clique em 'Abrir Preferências' abaixo.\n2. Marque 'Allow Scripts to Write Files'\n3. Clique em OK e tente avançar.");
        
        var btnCheck = p1.add('button', undefined, "Abrir Preferências e Verificar");
        btnCheck.size = [250, 30];
        
        btnCheck.onClick = function() { 
            showThemedAlert("Ação Necessária", "A janela de preferências do After Effects será aberta.\n\nLocalize a opção 'Allow Scripts to Write Files and Access Network' e marque-a.\n\nEm seguida, clique em OK na janela de preferências para continuar.", "warning");
            
            btnCheck.text = "Aguardando fechamento...";
            btnCheck.enabled = false;
            win.update();

            try { app.executeCommand(3131); } catch(e) { 
                showThemedAlert("Erro", "Não foi possível abrir as preferências automaticamente.\nVá manualmente em Edit > Preferences > Scripting", "error"); 
            }
            
            btnCheck.enabled = true;

            if(netAccess()) { 
                btnCheck.text = "Permissão Concedida!";
                win.update();
                $.sleep(200);
                step++; 
                updateView(); 
            } else { 
                btnCheck.text = "Verificar Novamente";
                showThemedAlert("Atenção", "A permissão AINDA não foi detectada.\n\nVocê deve marcar a caixa e clicar em OK na janela de preferências para prosseguir.", "error");
            }
        };

        // PÁGINA 2: MODO AUTOMÁTICO
        var p2 = contentGrp.add('group');
        p2.orientation = 'column'; p2.alignChildren = ['left', 'top']; p2.visible = false;
        var lblModeTitle = addTitle(p2, "Configuração Detectada");
        var lblModeInfo = addDesc(p2, "Analisando...");
        lblModeInfo.graphics.font = ScriptUI.newFont("Arial", "BOLD", 14);
        var lblModeDetail = addDesc(p2, "");
        var chkCloud = p2.add('checkbox', undefined, " Baixar versão mais recente");
        chkCloud.value = true;
        chkCloud.graphics.foregroundColor = chkCloud.graphics.newPen(chkCloud.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_TITLE, 1);

        // PÁGINA 3: PROGRESSO / ERRO
        var p3 = contentGrp.add('group');
        p3.orientation = 'column'; p3.alignChildren = ['center', 'center']; p3.visible = false;
        var statusLbl = addTitle(p3, "Aguarde...");
        statusLbl.alignment = 'center';
        statusLbl.preferredSize.width = 400; statusLbl.justify = 'center';
        var progressBar = p3.add('progressbar', undefined, 0, 100);
        progressBar.preferredSize = [400, 6];
        var logLbl = p3.add('statictext', undefined, "Inicializando...", {multiline: true});
        logLbl.preferredSize = [400, 60];
        logLbl.justify = 'center';
        logLbl.graphics.foregroundColor = logLbl.graphics.newPen(logLbl.graphics.PenType.SOLID_COLOR, UI_COLORS.TEXT_MAIN, 1);

        // RODAPÉ
        var footer = win.add('group');
        footer.orientation = 'row'; footer.alignment = ['fill', 'bottom']; footer.margins = 20;
        var btnCancel = footer.add('button', undefined, "Cancelar");
        var spacer = footer.add('group'); spacer.alignment = ['fill', 'fill'];
        var btnNext = footer.add('button', undefined, "Iniciar");
        btnNext.preferredSize = [120, 35];

        // ============================================================================
        // 4. LÓGICA DE FLUXO E PACKAGE ROOT
        // ============================================================================
        
        var step = 0;
        var pages = [p0, p1, p2, p3];
        var installerFile = new File(decodeURI($.fileName));
        var isNetwork = (installerFile.fsName.indexOf("C:") === -1) && (installerFile.fsName.indexOf("Users") === -1);

        function updateView() {
            for(var i=0; i<pages.length; i++) pages[i].visible = false;
            
            if (step === 1 && netAccess()) { step++; }
            
            pages[step].visible = true;
            
            if (step === 0) {
                btnNext.visible = true;
                btnNext.text = "Próximo";
            }
            else if (step === 1) {
                btnNext.visible = false; 
            }
            else if (step === 2) {
                btnNext.visible = true;
                if (isNetwork) {
                    lblModeInfo.text = "MÓDULO DE REDE (ESTÚDIO)";
                    lblModeInfo.graphics.foregroundColor = lblModeInfo.graphics.newPen(lblModeInfo.graphics.PenType.SOLID_COLOR, UI_COLORS.WARNING, 1);
                    lblModeDetail.text = "\nO script será vinculado ao servidor.\nAtualizações automáticas.\nCache importado localmente.";
                    chkCloud.visible = false;
                } else {
                    lblModeInfo.text = "INSTALAÇÃO LOCAL (HOME)";
                    lblModeInfo.graphics.foregroundColor = lblModeInfo.graphics.newPen(lblModeInfo.graphics.PenType.SOLID_COLOR, UI_COLORS.SUCCESS, 1);
                    lblModeDetail.text = "\nCopia arquivos para o seu computador.\nFunciona offline.\nCache e arquivos no disco local.";
                    chkCloud.visible = true;
                }
                btnNext.text = "Instalar";
            } 
            else if (step === 3) {
                btnNext.enabled = false;
                btnCancel.enabled = true; 
                try { win.update(); } catch(e){}
                app.scheduleTask('runInstallWrapper()', 200, false);
            }
        }

        $.global.runInstallWrapper = function() { runInstallProcess(); };

        btnNext.onClick = function() { step++; updateView(); };
        btnCancel.onClick = function() { win.close(); };

        function handleInstallError(msg, err) {
            statusLbl.text = "Falha na Instalação";
            statusLbl.graphics.foregroundColor = statusLbl.graphics.newPen(statusLbl.graphics.PenType.SOLID_COLOR, UI_COLORS.ERROR, 1);
            var detail = err ? ("\n" + err.toString()) : "";
            logLbl.text = msg + detail;
            progressBar.value = 0;
            btnCancel.text = "Fechar";
            btnCancel.enabled = true;
            btnNext.visible = false;
            try { win.update(); } catch(e){}
            showThemedAlert("Erro Crítico", msg + detail, "error");
        }

        function safeUpdate(val, msg) {
            try {
                if (val !== null) progressBar.value = val;
                if (msg) statusLbl.text = msg;
                win.update();
            } catch(e) {}
        }

        function runInstallProcess() {
            try {
                if (!netAccess()) {
                    throw new Error("Permissão de escrita perdida. A instalação não pode continuar.");
                }

                var packageRoot = installerFile.parent;
                if (!new Folder(packageRoot.fullName + "/runtime").exists && !new Folder(packageRoot.fullName + "/source").exists) {
                    if (packageRoot.parent && (new Folder(packageRoot.parent.fullName + "/runtime").exists || new Folder(packageRoot.parent.fullName + "/source").exists)) {
                        packageRoot = packageRoot.parent;
                    }
                }

                var deployRoot = new Folder(userPath + '/GND9TOOLS script');
                var aeScriptsPath = new Folder(Folder.userData.fullName + "/Adobe/After Effects");

                safeUpdate(10, "Configurando...");
                try {
                    ensureFolder(deployRoot.fullName);
                    manageRuntimeFolder(deployRoot, packageRoot); 
                } catch(e) { throw new Error("Erro ao criar pastas de preferência: " + e.message); }
                
                safeUpdate(30, "Otimizando Cache...");
                try {
                    if (seedCacheFromNetwork(packageRoot, new Folder(deployRoot.fullName + "/runtime"))) {
                        logLbl.text = "Cache importado.";
                    }
                } catch(e) {}

                safeUpdate(50, "Instalando Arquivos...");
                
                var masterPath = "";
                if (isNetwork) {
                    masterPath = normalizePath(packageRoot.fullName);
                } else {
                    masterPath = normalizePath(deployRoot.fullName);
                    var targetSource = new Folder(deployRoot.fullName + "/source");
                    ensureFolder(targetSource);

                    var downloaded = false;
                    if (chkCloud.value) {
                        logLbl.text = "Baixando...";
                        safeUpdate(null, null);
                        try {
                            var tempBin = new File(Folder.temp.fullName + "/" + SCRIPT_INFO.BIN_NAME);
                            if (downloadFile(SCRIPT_INFO.DOWNLOAD_URL, tempBin)) {
                                tempBin.copy(targetSource.fullName + "/" + SCRIPT_INFO.BIN_NAME);
                                downloaded = true;
                                if (new Folder(packageRoot.fullName + "/source").exists) {
                                    copyFolderRecursive(new Folder(packageRoot.fullName + "/source"), targetSource);
                                }
                            }
                        } catch(e) { logLbl.text = "Download falhou, usando local..."; }
                    }

                    if (!downloaded) {
                        logLbl.text = "Copiando local...";
                        safeUpdate(null, null);
                        
                        var localJsx = new File(packageRoot.fullName + "/GND9TOOLS.jsx");
                        var localBin = new File(packageRoot.fullName + "/" + SCRIPT_INFO.BIN_NAME);

                        if (localJsx.exists) {
                             localJsx.copy(deployRoot.fullName + "/GND9TOOLS.jsx");
                             copyFolderRecursive(new Folder(packageRoot.fullName + "/source"), targetSource);
                        } else if (localBin.exists) {
                             localBin.copy(targetSource.fullName + "/" + SCRIPT_INFO.BIN_NAME);
                             if (new Folder(packageRoot.fullName + "/source").exists) {
                                 copyFolderRecursive(new Folder(packageRoot.fullName + "/source"), targetSource);
                             }
                        } else {
                             var flatBin = new File(installerFile.parent.fullName + "/" + SCRIPT_INFO.BIN_NAME);
                             if (flatBin.exists) {
                                 flatBin.copy(targetSource.fullName + "/" + SCRIPT_INFO.BIN_NAME);
                             } else {
                                 logLbl.text = "Aviso: Script principal não encontrado.";
                             }
                        }
                    }
                }
                
                safeUpdate(80, "Registrando...");
                var versions = aeScriptsPath.getFiles();
                var installedCount = 0;
                
                if (versions) {
                    for (var j=0; j<versions.length; j++) {
                        if (versions[j] instanceof Folder && !versions[j].name.match(/logs/i)) {
                            var panelsDir = new Folder(versions[j].fullName + "/Scripts/ScriptUI Panels");
                            if (!panelsDir.exists) panelsDir.create();

                            var safePath = masterPath.replace(/'/g, "\\'");
                            var binName = SCRIPT_INFO.BIN_NAME;
                            
                            var loaderCode = "try {\n";
                            loaderCode += "    var p = '" + safePath + "';\n";
                            loaderCode += "    var fBin = new File(p + '/source/" + binName + "');\n";
                            loaderCode += "    var fJsx = new File(p + '/GND9TOOLS.jsx');\n";
                            loaderCode += "    if(fBin.exists) { $.evalFile(fBin); }\n";
                            loaderCode += "    else if(fJsx.exists) { $.evalFile(fJsx); }\n";
                            loaderCode += "    else { alert('GND9T Link Error: Script principal nao encontrado em ' + p); }\n";
                            loaderCode += "} catch(e) { alert('GND9T Loader Error: ' + e.toString()); }";

                            saveLoader(panelsDir.fullName + "/GND9TOOLS.jsx", loaderCode);
                            installedCount++;
                        }
                    }
                }
                
                var sysSet = new File(deployRoot.fullName + "/runtime/config/System_Settings.json");
                if(sysSet.exists) {
                    try {
                        sysSet.open('r'); var c = JSON.parse(sysSet.read()); sysSet.close();
                        c.deployment = { mode: isNetwork ? "network" : "local", root: masterPath };
                        sysSet.open('w'); sysSet.write(JSON.stringify(c, null, 4)); sysSet.close();
                    } catch(e){}
                }

                progressBar.value = 100;
                statusLbl.text = "Sucesso!";
                statusLbl.graphics.foregroundColor = statusLbl.graphics.newPen(statusLbl.graphics.PenType.SOLID_COLOR, UI_COLORS.SUCCESS, 1);
                logLbl.text = "Instalado em " + installedCount + " versões.";
                
                btnCancel.text = "Concluir";
                btnCancel.enabled = true;
                btnNext.visible = false;
                
                safeUpdate(null, null);
                $.sleep(200); 
                
                // JANELA CUSTOMIZADA DE PERGUNTA FINAL
                var runNow = showThemedConfirm("Instalação Concluída", "GND9TOOLS instalado com sucesso!\n\nDeseja iniciar a ferramenta agora?\n(Nota: Abrirá flutuante nesta sessão)");
                win.close();

                if (runNow) {
                    var runFile = new File(masterPath + "/GND9TOOLS.jsx");
                    if (!runFile.exists) runFile = new File(masterPath + "/source/" + SCRIPT_INFO.BIN_NAME);
                    
                    if (runFile.exists) {
                        $.evalFile(runFile);
                    } else {
                        showThemedAlert("Erro", "Não foi possível localizar o script instalado para execução automática.", "error");
                    }
                }

            } catch(err) {
                handleInstallError("Erro crítico durante a instalação.", err);
            }
        }

        updateView();
        win.center();
        win.show();
    }

    buildUI();
}
