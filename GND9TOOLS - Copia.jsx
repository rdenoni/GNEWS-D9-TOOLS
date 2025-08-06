// GNEWS D9 TOOLS INSTALL.jsx
// Instalador com tema vermelho D9 TOOLS

(function () {
    // Cores do tema D9 TOOLS (vermelho)
    var D9_RED_PRIMARY = [0.8, 0.2, 0.2, 1];      // Vermelho principal
    var D9_RED_HOVER = [1.0, 0.3, 0.3, 1];        // Vermelho hover (mais claro)
    var D9_RED_DARK = [0.6, 0.15, 0.15, 1];       // Vermelho escuro
    var D9_BG_DARK = [0.15, 0.15, 0.15, 1];       // Fundo escuro
    var D9_TEXT_WHITE = [1.0, 1.0, 1.0, 1];       // Texto branco
    var D9_TEXT_GRAY = [0.7, 0.7, 0.7, 1];        // Texto cinza claro

    function createInstaller() {
        // Janela principal
        var win = new Window("dialog", "GNEWS D9 TOOLS - Instalador");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 20;
        win.margins = 30;
        win.preferredSize.width = 500;
        
        // Aplicar tema escuro
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, D9_BG_DARK);

        // Header com logo/título
        var headerGroup = win.add("group");
        headerGroup.orientation = "column";
        headerGroup.alignChildren = ["center", "center"];
        headerGroup.spacing = 10;

        var titleText = headerGroup.add("statictext", undefined, "GNEWS D9 TOOLS");
        titleText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 24);
        titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, D9_RED_PRIMARY, 1);

        var subtitleText = headerGroup.add("statictext", undefined, "Instalador de Script para After Effects");
        subtitleText.graphics.font = ScriptUI.newFont("Arial", "REGULAR", 12);
        subtitleText.graphics.foregroundColor = subtitleText.graphics.newPen(subtitleText.graphics.PenType.SOLID_COLOR, D9_TEXT_GRAY, 1);

        // Separador
        var separator1 = win.add("panel");
        separator1.preferredSize.height = 2;
        separator1.graphics.backgroundColor = separator1.graphics.newBrush(separator1.graphics.BrushType.SOLID_COLOR, D9_RED_DARK);

        // Informações do script
        var infoGroup = win.add("group");
        infoGroup.orientation = "column";
        infoGroup.alignChildren = ["fill", "top"];
        infoGroup.spacing = 8;

        var versionText = infoGroup.add("statictext", undefined, "Versão: 1.68 | Build: D9TOOLS");
        versionText.graphics.foregroundColor = versionText.graphics.newPen(versionText.graphics.PenType.SOLID_COLOR, D9_TEXT_WHITE, 1);

        var descText = infoGroup.add("statictext", undefined, "Painel de automação para motion graphics e edição de vídeo.");
        descText.graphics.foregroundColor = descText.graphics.newPen(descText.graphics.PenType.SOLID_COLOR, D9_TEXT_GRAY, 1);

        // Status da instalação
        var statusGroup = win.add("group");
        statusGroup.orientation = "column";
        statusGroup.alignChildren = ["fill", "top"];
        statusGroup.spacing = 10;

        var statusText = statusGroup.add("statictext", undefined, "Clique em 'Instalar' para adicionar o script ao After Effects");
        statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, D9_TEXT_WHITE, 1);

        var progressBar = statusGroup.add("progressbar", undefined, 0, 100);
        progressBar.preferredSize.height = 8;
        progressBar.visible = false;

        // Separador
        var separator2 = win.add("panel");
        separator2.preferredSize.height = 2;
        separator2.graphics.backgroundColor = separator2.graphics.newBrush(separator2.graphics.BrushType.SOLID_COLOR, D9_RED_DARK);

        // Botões
        var buttonGroup = win.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignChildren = ["fill", "center"];
        buttonGroup.spacing = 15;

        // Botão Cancelar
        var cancelBtn = buttonGroup.add("button", undefined, "Cancelar");
        cancelBtn.preferredSize.width = 120;
        cancelBtn.preferredSize.height = 35;
        cancelBtn.graphics.backgroundColor = cancelBtn.graphics.newBrush(cancelBtn.graphics.BrushType.SOLID_COLOR, D9_BG_DARK);
        cancelBtn.graphics.foregroundColor = cancelBtn.graphics.newPen(cancelBtn.graphics.PenType.SOLID_COLOR, D9_TEXT_GRAY, 1);
        
        // Hover effect para botão cancelar
        cancelBtn.onDraw = function() {
            if (this.active) {
                this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, [0.3, 0.3, 0.3, 1]);
                this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, D9_TEXT_WHITE, 1);
            } else {
                this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, D9_BG_DARK);
                this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, D9_TEXT_GRAY, 1);
            }
        };

        // Botão Instalar
        var installBtn = buttonGroup.add("button", undefined, "Instalar");
        installBtn.preferredSize.width = 120;
        installBtn.preferredSize.height = 35;
        installBtn.graphics.backgroundColor = installBtn.graphics.newBrush(installBtn.graphics.BrushType.SOLID_COLOR, D9_RED_PRIMARY);
        installBtn.graphics.foregroundColor = installBtn.graphics.newPen(installBtn.graphics.PenType.SOLID_COLOR, D9_TEXT_WHITE, 1);

        // Hover effect para botão instalar
        installBtn.onDraw = function() {
            if (this.active) {
                this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, D9_RED_HOVER);
                this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, D9_TEXT_WHITE, 1);
            } else {
                this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, D9_RED_PRIMARY);
                this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, D9_TEXT_WHITE, 1);
            }
        };

        // Eventos dos botões
        cancelBtn.onClick = function() {
            win.close();
        };

        installBtn.onClick = function() {
            performInstallation();
        };

        // Função de instalação
        function performInstallation() {
            try {
                // Mostrar progress bar
                progressBar.visible = true;
                progressBar.value = 0;
                statusText.text = "Iniciando instalação...";
                statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, D9_RED_PRIMARY, 1);
                win.update();

                // Definir caminhos
                var scriptFile = File($.fileName);
                var scriptFolder = scriptFile.parent;
                var sourceFile;
                
                // Procurar pelo arquivo source
                if (File(scriptFolder + "/GND9TOOLS_source.jsxbin").exists) {
                    sourceFile = File(scriptFolder + "/GND9TOOLS_source.jsxbin");
                } else if (File(scriptFolder + "/O_PADEIRO_SOURCE.jsxbin").exists) {
                    sourceFile = File(scriptFolder + "/O_PADEIRO_SOURCE.jsxbin");
                } else {
                    throw new Error("Arquivo source não encontrado!");
                }

                progressBar.value = 20;
                statusText.text = "Verificando diretório de instalação...";
                win.update();

                // Diretório de destino
                var aeVersion = app.version.split(".")[0];
                var destFolder = new Folder(Folder.userData + "/Adobe/After Effects/" + aeVersion + ".0/Scripts/ScriptUI Panels");
                
                if (!destFolder.exists) {
                    destFolder.create();
                }

                progressBar.value = 40;
                statusText.text = "Copiando arquivos...";
                win.update();

                // Copiar arquivo principal
                var destFile = new File(destFolder + "/GND9TOOLS.jsx");
                if (destFile.exists) {
                    destFile.remove();
                }
                
                sourceFile.copy(destFile);

                progressBar.value = 70;
                statusText.text = "Verificando instalação...";
                win.update();

                // Verificar se foi instalado corretamente
                if (!destFile.exists) {
                    throw new Error("Falha ao copiar arquivo!");
                }

                progressBar.value = 100;
                statusText.text = "Instalação concluída com sucesso!";
                statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, [0.2, 0.8, 0.2, 1], 1); // Verde
                win.update();

                // Botão de finalizar
                installBtn.text = "Finalizar";
                installBtn.onClick = function() {
                    alert("GNEWS D9 TOOLS instalado com sucesso!\n\n" +
                          "Para usar:\n" +
                          "1. Reinicie o After Effects\n" +
                          "2. Vá em Window > GNEWS D9 TOOLS\n\n" +
                          "O painel estará disponível na interface.");
                    win.close();
                };

            } catch (err) {
                progressBar.visible = false;
                statusText.text = "Erro na instalação: " + err.message;
                statusText.graphics.foregroundColor = statusText.graphics.newPen(statusText.graphics.PenType.SOLID_COLOR, [0.8, 0.2, 0.2, 1],