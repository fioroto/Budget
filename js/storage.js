// ═══════════════════════════════════════════════════════
// STORAGE — File System Access API wrapper
// ═══════════════════════════════════════════════════════

const Storage = (() => {
    let directoryHandle = null;
    let autoSaveInterval = null;

    const FILES = ['config', 'accounts', 'categories', 'transactions', 'budget'];

    const DEFAULTS = {
        config: {
            currency: 'BRL',
            locale: 'pt-BR',
            autoSaveSeconds: 30,
            createdAt: null,
        },
        accounts: [],
        categories: [],
        transactions: [],
        budget: [],
    };

    async function openFolder() {
        try {
            directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            return directoryHandle;
        } catch (e) {
            if (e.name === 'AbortError') return null;
            throw e;
        }
    }

    function getFolderName() {
        return directoryHandle?.name || null;
    }

    function isOpen() {
        return directoryHandle !== null;
    }

    async function readFile(name) {
        if (!directoryHandle) throw new Error('No folder open');
        try {
            const fileHandle = await directoryHandle.getFileHandle(`${name}.json`);
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (e) {
            if (e.name === 'NotFoundError') {
                return DEFAULTS[name] !== undefined ? structuredClone(DEFAULTS[name]) : null;
            }
            throw e;
        }
    }

    async function writeFile(name, data) {
        if (!directoryHandle) throw new Error('No folder open');
        const fileHandle = await directoryHandle.getFileHandle(`${name}.json`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    }

    async function loadAll() {
        const result = {};
        for (const name of FILES) {
            result[name] = await readFile(name);
        }
        if (!result.config.createdAt) {
            result.config.createdAt = new Date().toISOString();
        }
        return result;
    }

    async function saveAll(stateData) {
        for (const name of FILES) {
            if (stateData[name] !== undefined) {
                await writeFile(name, stateData[name]);
            }
        }
    }

    async function saveDirty(stateData, dirtySet) {
        for (const name of dirtySet) {
            if (stateData[name] !== undefined) {
                await writeFile(name, stateData[name]);
            }
        }
        dirtySet.clear();
    }

    function startAutoSave(callback, intervalSeconds) {
        stopAutoSave();
        if (intervalSeconds <= 0) return;
        autoSaveInterval = setInterval(callback, intervalSeconds * 1000);
    }

    function stopAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
    }

    return {
        openFolder,
        getFolderName,
        isOpen,
        readFile,
        writeFile,
        loadAll,
        saveAll,
        saveDirty,
        startAutoSave,
        stopAutoSave,
    };
})();
