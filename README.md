GND9TOOLS – Notas para Distribuição .jsxbin
===========================================

1. Persistência Centralizada
- Sempre carregue o helper `source/libraries/prefs_manager.js` (via `#include` em `GND9TOOLS.jsx`). Use `D9T_Preferences.get/set/savePartial/save` para ler/escrever preferências. Nunca grave JSON manualmente.
- Para atualizar cores/tema chame `D9T_Preferences.updateThemeSettings(overrides, true)`; demais módulos devem usar `D9T_Preferences.setModulePref(moduleId, key, value, true)`.

2. Arquivos Externos Obrigatórios
- `<scriptPreferencesPath>/User_Preferences.json` – valores práticos do usuário. Criado automaticamente com defaults.
- `<scriptPreferencesPath>/System_Settings.json` – configurações globais (CopyLinks, Templates, LibraryLive etc.).
- `<scriptPreferencesPath>/Dados_Config.json` – catálogos/coleções utilizados pelos módulos de templates e copylinks.
- `<scriptPreferencesPath>/cache/*` – manifestos e snapshots gerados em tempo de execução (não versionados, mas mantenha a pasta).
- `/source/layout/theme_api.js`, `/source/globals.js`, `/source/libraries` – devem acompanhar o binário para que includes relativos funcionem.
- Ícones/bitmaps usados no menu ficam em `/source/ICON lib.js` + assets referenciados; confirmar paths relativos a `scriptMainPath`.

3. Paths / Includes
- Tudo que usa `$.evalFile` ou `#include` precisa montar o caminho como `scriptMainPath + 'source/...'`. No `.jsxbin` `scriptMainPath` já aponta para a pasta principal (ver `initializeGlobalVariables`).
- Chamadas `system.callSystem` ou acessos a arquivos externos devem normalizar usando `File`/`Folder` + `.fsName`.

4. Fallbacks de UI
- Toda criação de `themeButton` ou `themeIconButton` deve ter alternativa ScriptUI nativa (já aplicado). Se o helper não existir, crie um botão padrão.
- Novos módulos precisam seguir o mesmo padrão de configuração rápida (exponha variáveis no topo e respeite `__buttonThemeOverrides.width` para evitar “saltos” no hover).

5. Checklist antes de exportar
- Executar um teste abrindo cada módulo para garantir que preferências são lidas sem alertas (logs irão para `console` via `$.writeln`).
- Confirmar que `User_Preferences.json`, `System_Settings.json`, `Dados_Config.json` e a pasta `cache/` acompanham o instalador/zip enviado ao usuário final.
