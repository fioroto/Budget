// ═══════════════════════════════════════════════════════
// STATE — Reactive state management
// ═══════════════════════════════════════════════════════

const State = (() => {
    const data = {
        config: { currency: 'BRL', locale: 'pt-BR', autoSaveSeconds: 30, createdAt: null },
        accounts: [],
        categories: [],
        transactions: [],
        budget: [],
    };

    const dirty = new Set();
    const listeners = new Map();

    function get(section) {
        return data[section];
    }

    function set(section, value) {
        data[section] = value;
        dirty.add(section);
        emit(section);
    }

    function update(section, fn) {
        fn(data[section]);
        dirty.add(section);
        emit(section);
    }

    function loadFromStorage(allData) {
        for (const [key, value] of Object.entries(allData)) {
            data[key] = value;
        }
        dirty.clear();
        emit('*');
    }

    function getDirty() {
        return dirty;
    }

    function getAll() {
        return data;
    }

    // Event system
    function on(event, callback) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(callback);
    }

    function off(event, callback) {
        if (!listeners.has(event)) return;
        const arr = listeners.get(event);
        const idx = arr.indexOf(callback);
        if (idx > -1) arr.splice(idx, 1);
    }

    function emit(event) {
        const specific = listeners.get(event) || [];
        const wildcard = listeners.get('*') || [];
        [...specific, ...wildcard].forEach(cb => cb(event, data[event]));
    }

    return { get, set, update, loadFromStorage, getDirty, getAll, on, off, emit };
})();
