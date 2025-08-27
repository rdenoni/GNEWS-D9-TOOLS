/*
================================================================================
GNEWS TEMPLATES CONFIG MANAGER - COMPATÍVEL COM AFTER EFFECTS
Sistema de configuração baseado em JSON para caminhos de templates
================================================================================
*/

// Configurações principais
var SCRIPT_NAME = 'GNEWS TEMPLATES';
var CONFIG_FILE_NAME = 'gnews_templates_config.json';

// Função auxiliar para formatar data (compatível com AE)
function formatDateForAE(date) {
    function pad(num) {
        return (num < 10 ? '0' : '') + num;
    }
    
    return date.getFullYear() + '-' +
           pad(date.getMonth() + 1) + '-' +
           pad(date.getDate()) + 'T' +
           pad(date.getHours()) + ':' +
           pad(date.getMinutes()) + ':' +
           pad(date.getSeconds()) + '.000Z';
}

// Objeto principal para gerenciar configurações
var GNewsConfigManager = {
    
    // Configuração padrão
    defaultConfig: {
        "version": "1.0",
        "lastUpdated": null,
        "templatePaths": [
            {
                "id": "local",
                "name": "TEMPLATES LOCAL",
                "description": "Templates salvos localmente",
                "path": "",
                "enabled": true,
                "isDefault": true
            },
            {
                "id": "servidor_rj",
                "name": "SERVIDOR RJ",
                "description": "Templates do servidor Rio de Janeiro",
                "path": "//10.228.183.165/VFX/imagem/drive_l/templates",
                "enabled": true,
                "isDefault": false
            },
            {
                "id": "servidor_sp",
                "name": "SERVIDOR SP",
                "description": "Templates do servidor São Paulo", 
                "path": "//10.193.48.13/promo_ber/BACKUP/templates",
                "enabled": true,
                "isDefault": false
            }
        ],
        "settings": {
            "autoRefresh": true,
            "showHiddenFiles": false,
            "defaultPath": "local",
            "maxRecentPaths": 5
        }
    },

    // Caminho do arquivo de configuração
    getConfigPath: function() {
        var scriptPreferencesPath = Folder.userData.fullName + '/GNEWS D9 TOOLS script';
        var scriptPreferencesFolder = new Folder(scriptPreferencesPath);
        if (!scriptPreferencesFolder.exists) {
            scriptPreferencesFolder.create();
        }
        return scriptPreferencesPath + '/' + CONFIG_FILE_NAME;
    },

    // Carregar configurações do arquivo JSON
    loadConfig: function() {
        var configFile = new File(this.getConfigPath());
        
        if (!configFile.exists) {
            // Se não existe, criar com configuração padrão
            this.saveConfig(this.defaultConfig);
            return this.defaultConfig;
        }

        try {
            configFile.open('r');
            var configData = configFile.read();
            configFile.close();
            
            var config = JSON.parse(configData);
            
            // Validar e mesclar com configuração padrão se necessário
            config = this.validateAndMergeConfig(config);
            
            return config;
        } catch (error) {
            alert('Erro ao carregar configuração: ' + error.toString() + 
                  '\nUsando configuração padrão.');
            return this.defaultConfig;
        }
    },

    // Salvar configurações no arquivo JSON - CORRIGIDO PARA AE
    saveConfig: function(config) {
        try {
            // Usar função compatível com After Effects
            config.lastUpdated = formatDateForAE(new Date());
            
            var configFile = new File(this.getConfigPath());
            configFile.open('w');
            configFile.write(JSON.stringify(config, null, 2));
            configFile.close();
            
            return true;
        } catch (error) {
            alert('Erro ao salvar configuração: ' + error.toString());
            return false;
        }
    },

    // Validar e mesclar configuração carregada com padrão
    validateAndMergeConfig: function(loadedConfig) {
        // Criar cópia da configuração padrão
        var config = {};
        for (var key in this.defaultConfig) {
            if (this.defaultConfig.hasOwnProperty(key)) {
                if (typeof this.defaultConfig[key] === 'object' && this.defaultConfig[key] !== null) {
                    config[key] = {};
                    for (var subKey in this.defaultConfig[key]) {
                        if (this.defaultConfig[key].hasOwnProperty(subKey)) {
                            config[key][subKey] = this.defaultConfig[key][subKey];
                        }
                    }
                } else {
                    config[key] = this.defaultConfig[key];
                }
            }
        }
        
        // Mesclar dados carregados
        if (loadedConfig.templatePaths && loadedConfig.templatePaths.length > 0) {
            config.templatePaths = loadedConfig.templatePaths;
        }
        
        if (loadedConfig.settings) {
            for (var settingsKey in loadedConfig.settings) {
                if (loadedConfig.settings.hasOwnProperty(settingsKey)) {
                    config.settings[settingsKey] = loadedConfig.settings[settingsKey];
                }
            }
        }
        
        if (loadedConfig.version) {
            config.version = loadedConfig.version;
        }
        
        return config;
    },

    // Obter todos os caminhos habilitados
    getEnabledPaths: function() {
        var config = this.loadConfig();
        var enabledPaths = [];
        
        for (var i = 0; i < config.templatePaths.length; i++) {
            var pathConfig = config.templatePaths[i];
            if (pathConfig.enabled) {
                enabledPaths.push(pathConfig);
            }
        }
        
        return enabledPaths;
    },

    // Obter caminho padrão
    getDefaultPath: function() {
        var config = this.loadConfig();
        var defaultId = config.settings.defaultPath;
        
        for (var i = 0; i < config.templatePaths.length; i++) {
            var pathConfig = config.templatePaths[i];
            if (pathConfig.id === defaultId && pathConfig.enabled) {
                return pathConfig;
            }
        }
        
        // Se não encontrar, retornar o primeiro habilitado
        var enabledPaths = this.getEnabledPaths();
        return enabledPaths.length > 0 ? enabledPaths[0] : null;
    },

    // Adicionar novo caminho
    addPath: function(pathData) {
        var config = this.loadConfig();
        
        // Gerar ID único se não fornecido
        if (!pathData.id) {
            pathData.id = 'path_' + new Date().getTime();
        }
        
        // Configurações padrão para novo caminho
        var newPath = {
            id: pathData.id,
            name: pathData.name || 'Novo Caminho',
            description: pathData.description || '',
            path: pathData.path || '',
            enabled: pathData.enabled !== false,
            isDefault: false
        };
        
        config.templatePaths.push(newPath);
        
        if (this.saveConfig(config)) {
            return newPath;
        }
        
        return null;
    },

    // Remover caminho
    removePath: function(pathId) {
        var config = this.loadConfig();
        
        for (var i = 0; i < config.templatePaths.length; i++) {
            if (config.templatePaths[i].id === pathId) {
                config.templatePaths.splice(i, 1);
                return this.saveConfig(config);
            }
        }
        
        return false;
    },

    // Atualizar caminho existente
    updatePath: function(pathId, updateData) {
        var config = this.loadConfig();
        
        for (var i = 0; i < config.templatePaths.length; i++) {
            if (config.templatePaths[i].id === pathId) {
                var pathConfig = config.templatePaths[i];
                
                for (var key in updateData) {
                    if (updateData.hasOwnProperty(key)) {
                        pathConfig[key] = updateData[key];
                    }
                }
                
                return this.saveConfig(config);
            }
        }
        
        return false;
    },

    // Definir caminho padrão
    setDefaultPath: function(pathId) {
        var config = this.loadConfig();
        config.settings.defaultPath = pathId;
        return this.saveConfig(config);
    },

    // Obter configurações do aplicativo
    getSettings: function() {
        var config = this.loadConfig();
        return config.settings;
    },

    // Atualizar configurações
    updateSettings: function(newSettings) {
        var config = this.loadConfig();
        
        for (var key in newSettings) {
            if (newSettings.hasOwnProperty(key)) {
                config.settings[key] = newSettings[key];
            }
        }
        
        return this.saveConfig(config);
    },

    // Criar interface de configuração SIMPLIFICADA
    showConfigDialog: function() {
        var dialog = new Window('dialog', 'GNEWS Templates - Configurações');
        dialog.orientation = 'column';
        dialog.alignChildren = ['fill', 'top'];
        dialog.spacing = 10;
        dialog.margins = 16;
        dialog.preferredSize.width = 400;

        // Lista de caminhos
        var pathsGroup = dialog.add('group');
        pathsGroup.orientation = 'column';
        pathsGroup.alignChildren = 'fill';
        
        var pathsLabel = pathsGroup.add('statictext', undefined, 'Caminhos de Templates:');
        pathsLabel.graphics.font = ScriptUI.newFont('Arial', 'Bold', 12);
        
        var pathsList = pathsGroup.add('listbox');
        pathsList.preferredSize.height = 120;
        pathsList.preferredSize.width = 380;
        
        // Botões de ação
        var buttonsGroup = dialog.add('group');
        buttonsGroup.orientation = 'row';
        buttonsGroup.alignment = 'center';
        
        var addBtn = buttonsGroup.add('button', undefined, 'Adicionar');
        var removeBtn = buttonsGroup.add('button', undefined, 'Remover');
        var defaultBtn = buttonsGroup.add('button', undefined, 'Definir Padrão');
        
        // Botões de controle
        var controlGroup = dialog.add('group');
        controlGroup.orientation = 'row';
        controlGroup.alignment = 'center';
        
        var cancelBtn = controlGroup.add('button', undefined, 'Cancelar');
        var okBtn = controlGroup.add('button', undefined, 'OK');
        
        // Função para atualizar lista
        function updatePathsList() {
            pathsList.removeAll();
            var config = GNewsConfigManager.loadConfig();
            
            for (var i = 0; i < config.templatePaths.length; i++) {
                var pathConfig = config.templatePaths[i];
                var itemText = pathConfig.name;
                if (!pathConfig.enabled) itemText += ' (Desabilitado)';
                if (pathConfig.id === config.settings.defaultPath) itemText += ' [Padrão]';
                
                var item = pathsList.add('item', itemText);
                item.pathData = pathConfig;
            }
        }
        
        updatePathsList();
        
        // Event handlers
        addBtn.onClick = function() {
            // Diálogo simples de adição
            var newPathDialog = new Window('dialog', 'Adicionar Caminho');
            newPathDialog.orientation = 'column';
            newPathDialog.spacing = 10;
            newPathDialog.margins = 16;
            
            var nameGroup = newPathDialog.add('group');
            nameGroup.add('statictext', undefined, 'Nome:');
            var nameEdit = nameGroup.add('edittext', undefined, 'Novo Servidor');
            nameEdit.preferredSize.width = 200;
            
            var pathGroup = newPathDialog.add('group');
            pathGroup.add('statictext', undefined, 'Caminho:');
            var pathEdit = pathGroup.add('edittext', undefined, '//servidor/pasta');
            pathEdit.preferredSize.width = 200;
            
            var buttonGroup = newPathDialog.add('group');
            var cancelAddBtn = buttonGroup.add('button', undefined, 'Cancelar');
            var okAddBtn = buttonGroup.add('button', undefined, 'OK');
            
            cancelAddBtn.onClick = function() { newPathDialog.close(); };
            okAddBtn.onClick = function() {
                if (nameEdit.text && pathEdit.text) {
                    GNewsConfigManager.addPath({
                        name: nameEdit.text,
                        path: pathEdit.text,
                        description: 'Adicionado pelo usuário'
                    });
                    updatePathsList();
                    newPathDialog.close();
                }
            };
            
            newPathDialog.show();
        };
        
        removeBtn.onClick = function() {
            if (pathsList.selection && pathsList.selection.pathData) {
                if (confirm('Remover caminho "' + pathsList.selection.pathData.name + '"?')) {
                    GNewsConfigManager.removePath(pathsList.selection.pathData.id);
                    updatePathsList();
                }
            }
        };
        
        defaultBtn.onClick = function() {
            if (pathsList.selection && pathsList.selection.pathData) {
                GNewsConfigManager.setDefaultPath(pathsList.selection.pathData.id);
                updatePathsList();
            }
        };
        
        cancelBtn.onClick = function() {
            dialog.close();
        };
        
        okBtn.onClick = function() {
            dialog.close();
        };
        
        return dialog.show();
    }
};

// Função para compatibilidade com o sistema antigo
function getCompatibilityProdArray() {
    if (typeof GNewsConfigManager !== 'undefined') {
        var currentPath = GNewsConfigManager.getDefaultPath();
        if (currentPath) {
            return [{
                name: currentPath.name,
                templatesPath: currentPath.path || templatesLocalPath,
                icon: localPc || 'fallback'
            }];
        }
    }
    
    return [{
        name: 'TEMPLATES LOCAL',
        templatesPath: templatesLocalPath,
        icon: localPc || 'fallback'
    }];
}