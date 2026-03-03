// ═══════════════════════════════════════════════════════
// APP — Main application controller
// ═══════════════════════════════════════════════════════

const App = (() => {
    let currentPage = 'dashboard';
    let isSaving = false;

    const pages = {
        dashboard: DashboardPage,
        budget: BudgetPage,
        transactions: TransactionsPage,
        categories: CategoriesPage,
        accounts: AccountsPage,
        reports: ReportsPage,
        settings: SettingsPage,
    };

    function init() {
        applyTheme(localStorage.getItem('theme') || 'dark');
        setupNavigation();
        showWelcomeScreen();
    }

    function setupNavigation() {
        document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!Storage.isOpen()) {
                    toast('Abra uma pasta primeiro', 'info');
                    return;
                }
                navigateTo(btn.dataset.page);
            });
        });
    }

    function navigateTo(page) {
        currentPage = page;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navBtn = document.querySelector(`[data-page="${page}"]`);
        if (navBtn) navBtn.classList.add('active');
        renderCurrentPage();
    }

    function renderCurrentPage() {
        const container = document.getElementById('main-content');
        const pageRenderer = pages[currentPage];
        if (pageRenderer) {
            container.innerHTML = '';
            pageRenderer.render(container);
        }
    }

    function showWelcomeScreen() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
      <div class="welcome-screen animate-fade-in">
        <h1 class="welcome-title">Orçamento Pessoal</h1>
        <p class="welcome-subtitle">
          Selecione uma pasta no seu computador para armazenar seus dados financeiros.
          Se já possui dados salvos, selecione a mesma pasta para carregá-los.
        </p>
        <button class="btn btn-primary btn-lg" id="btn-open-folder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Abrir Pasta
        </button>
        <p style="margin-top: 16px; font-size: 0.75rem; color: var(--text-muted);">
          Requer um navegador compatível com File System Access API (Chrome, Edge)
        </p>
      </div>
    `;
        document.getElementById('btn-open-folder').addEventListener('click', handleOpenFolder);
    }

    async function handleOpenFolder() {
        try {
            const handle = await Storage.openFolder();
            if (!handle) return;

            document.getElementById('folder-name').textContent = Storage.getFolderName();

            const allData = await Storage.loadAll();
            State.loadFromStorage(allData);

            // Apply saved theme preference
            const savedTheme = (State.get('config') || {}).theme || 'dark';
            applyTheme(savedTheme);

            setupAutoSave();
            navigateTo('dashboard');
            toast('Pasta carregada com sucesso!', 'success');
        } catch (e) {
            console.error('Error opening folder:', e);
            toast('Erro ao abrir pasta: ' + e.message, 'error');
        }
    }

    function setupAutoSave() {
        const config = State.get('config');
        const seconds = config.autoSaveSeconds || 0;

        Storage.stopAutoSave();
        updateAutoSaveIndicator(seconds);

        if (seconds > 0) {
            Storage.startAutoSave(() => performSave(), seconds);
        }
    }

    async function performSave() {
        const dirtySet = State.getDirty();
        if (dirtySet.size === 0) return;

        isSaving = true;
        const dot = document.getElementById('autosave-dot');
        if (dot) dot.classList.add('saving');

        try {
            await Storage.saveDirty(State.getAll(), dirtySet);
        } catch (e) {
            console.error('Auto-save error:', e);
            toast('Erro ao salvar: ' + e.message, 'error');
        } finally {
            isSaving = false;
            if (dot) dot.classList.remove('saving');
        }
    }

    async function saveNow() {
        try {
            await Storage.saveAll(State.getAll());
            State.getDirty().clear();
            toast('Dados salvos com sucesso!', 'success');
        } catch (e) {
            toast('Erro ao salvar: ' + e.message, 'error');
        }
    }

    function updateAutoSaveIndicator(seconds) {
        const dot = document.getElementById('autosave-dot');
        const text = document.getElementById('autosave-text');
        if (!dot || !text) return;

        if (seconds > 0) {
            dot.className = 'autosave-dot';
            text.textContent = `Auto-save: ${seconds}s`;
        } else {
            dot.className = 'autosave-dot off';
            text.textContent = 'Auto-save desligado';
        }
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.setAttribute('data-theme', 'light');
        } else {
            document.body.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', theme);
    }

    // Toast notifications
    function toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(40px)';
            el.style.transition = 'all 300ms ease';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    // Utility: create modal
    function showModal(title, bodyHTML, onSave, saveLabel = 'Salvar') {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
      <div class="modal animate-fade-in">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" id="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="modal-save">${saveLabel}</button>
        </div>
      </div>
    `;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#modal-close').addEventListener('click', close);
        overlay.querySelector('#modal-cancel').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        overlay.querySelector('#modal-save').addEventListener('click', () => {
            if (onSave) onSave(overlay);
            close();
        });

        return overlay;
    }

    // Utility: confirm dialog
    function confirm(message, onConfirm) {
        showModal('Confirmação', `<p style="color: var(--text-secondary)">${message}</p>`, onConfirm, 'Confirmar');
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        navigateTo,
        renderCurrentPage,
        handleOpenFolder,
        setupAutoSave,
        saveNow,
        performSave,
        toast,
        showModal,
        confirm,
        applyTheme,
        getCurrentPage: () => currentPage,
    };
})();
