/* =============================================================
 * D9T Preferences Manager
 * Centraliza leituras/escritas no User_Preferences.json
 * ============================================================= */
(function (global) {
    if (global.D9T_Preferences) { return; }

    function ensureLoaded() {
        if (typeof scriptPreferencesObj === 'undefined' || !scriptPreferencesObj) {
            if (typeof loadScriptPreferences === 'function') {
                loadScriptPreferences();
            } else {
                scriptPreferencesObj = (typeof defaultScriptPreferencesObj !== 'undefined')
                    ? JSON.parse(JSON.stringify(defaultScriptPreferencesObj))
                    : {};
            }
        }
        if (typeof scriptPreferencesObj.modulePreferences !== 'object') {
            scriptPreferencesObj.modulePreferences = {};
        }
    }

    function normalizePath(path) {
        return (typeof path === 'string') ? path.split('.') : [];
    }

    function safeKeys(obj) {
        if (!obj || typeof obj !== 'object') { return []; }
        if (typeof Object !== 'undefined' && typeof Object.keys === 'function') {
            return Object.keys(obj);
        }
        var arr = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) { arr.push(k); }
        }
        return arr;
    }

    function get(path, fallback) {
        ensureLoaded();
        if (!path) { return scriptPreferencesObj; }
        var segments = normalizePath(path);
        var cursor = scriptPreferencesObj;
        for (var i = 0; i < segments.length; i++) {
            var key = segments[i];
            if (!cursor || typeof cursor !== 'object' || !cursor.hasOwnProperty(key)) {
                return (typeof fallback !== 'undefined') ? fallback : null;
            }
            cursor = cursor[key];
        }
        return cursor;
    }

    function set(path, value, persist) {
        ensureLoaded();
        var segments = normalizePath(path);
        if (!segments.length) { return; }
        var cursor = scriptPreferencesObj;
        for (var i = 0; i < segments.length - 1; i++) {
            var seg = segments[i];
            if (typeof cursor[seg] !== 'object') {
                cursor[seg] = {};
            }
            cursor = cursor[seg];
        }
        cursor[segments[segments.length - 1]] = value;
        if (persist) { save(); }
    }

    function save() {
        ensureLoaded();
        if (typeof saveScriptPreferences === 'function') {
            try {
                if (typeof D9T_PREF_LOG === 'function') { D9T_PREF_LOG('prefs_manager.save -> saveScriptPreferences'); }
                else { try { $.writeln('[D9T_PREFS_TRACE] prefs_manager.save -> saveScriptPreferences'); } catch (e0) {} }
                saveScriptPreferences();
            } catch (e) {
                if (typeof D9T_PREF_LOG === 'function') { D9T_PREF_LOG('prefs_manager.save FAIL', e); }
                else { try { $.writeln('[D9T_PREFS_TRACE] prefs_manager.save FAIL :: ' + e); } catch (e1) {} }
            }
        }
    }

    function deepMerge(target, source) {
        if (!source || typeof source !== 'object') { return target; }
        var keys = safeKeys(source);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = source[key];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                deepMerge(target[key], value);
            } else {
                target[key] = value;
            }
        }
        return target;
    }

    function reloadFromDisk() {
        if (typeof loadScriptPreferences === 'function') {
            try { loadScriptPreferences(); }
            catch (err) {
                $.writeln('[prefs_manager] Falha ao recarregar preferências: ' + err);
            }
        }
        ensureLoaded();
        return scriptPreferencesObj;
    }

    function mergeAndSave(partialPrefs) {
        if (!partialPrefs || typeof partialPrefs !== 'object') { return; }
        ensureLoaded();
        deepMerge(scriptPreferencesObj, partialPrefs);
        save();
    }

    function updateThemeSettings(overrides, persist) {
        if (!overrides || typeof overrides !== 'object') { return; }
        ensureLoaded();
        scriptPreferencesObj.themeColors = scriptPreferencesObj.themeColors || {};
        deepMerge(scriptPreferencesObj.themeColors, overrides);
        if (typeof applyThemeColorOverrides === 'function') {
            try { applyThemeColorOverrides(scriptPreferencesObj.themeColors); } catch (err) {}
        }
        if (typeof D9T_REFRESH_THEME_COLORS === 'function') {
            try { D9T_REFRESH_THEME_COLORS(); } catch (refreshErr) {}
        }
        if (persist) { save(); }
    }

    function getModulePrefs(moduleName) {
        ensureLoaded();
        if (!scriptPreferencesObj.modulePreferences[moduleName]) {
            scriptPreferencesObj.modulePreferences[moduleName] = {};
        }
        return scriptPreferencesObj.modulePreferences[moduleName];
    }

    function setModulePref(moduleName, key, value, persist) {
        var prefs = getModulePrefs(moduleName);
        prefs[key] = value;
        if (persist) { save(); }
    }

    function getActiveThemeId() {
        return get('uiSettings.activeButtonTheme', null);
    }

    function setActiveThemeId(themeId, persist) {
        if (typeof themeId === 'string' && themeId.length) {
            set('uiSettings.activeButtonTheme', themeId, persist);
        }
    }

    global.D9T_Preferences = {
        ensureLoaded: ensureLoaded,
        getAll: function () { ensureLoaded(); return scriptPreferencesObj; },
        get: get,
        set: set,
        save: save,
        reload: reloadFromDisk,
        savePartial: mergeAndSave,
        updateThemeSettings: updateThemeSettings,
        getModulePrefs: getModulePrefs,
        setModulePref: setModulePref,
        getActiveThemeId: getActiveThemeId,
        setActiveThemeId: setActiveThemeId
    };

    if (!global.GND9API) {
        global.GND9API = {
            getPref: get,
            setPref: set,
            savePrefs: save,
            loadPrefs: reloadFromDisk,
            saveUserPrefs: mergeAndSave,
            updateTheme: updateThemeSettings,
            getActiveTheme: getActiveThemeId,
            setActiveTheme: setActiveThemeId
        };
    }
})(this);
