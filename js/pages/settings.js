// ═══════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════

const SettingsPage = (() => {
  function render(container) {
    const config = State.get('config') || {};
    const autoSave = config.autoSaveSeconds || 0;
    const isDark = (config.theme || 'dark') === 'dark';
    const fc = Models.formatCurrency;

    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <h1 class="page-title">Configurações</h1>
          <button class="btn btn-primary" id="btn-save-now">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar Agora
          </button>
        </div>

        <div class="card mb-xl">
          <div class="settings-section">
            <h3>Aparência</h3>
            <div class="setting-row">
              <div>
                <div class="setting-label">Tema</div>
                <div class="setting-description">Alterna entre o modo escuro e o modo claro</div>
              </div>
              <label class="theme-toggle" id="theme-toggle-label" title="${isDark ? 'Mudar para claro' : 'Mudar para escuro'}">
                <input type="checkbox" id="setting-theme" ${isDark ? '' : 'checked'}>
                <span class="theme-toggle-track">
                  <span class="theme-toggle-thumb">
                    ${isDark
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      }
                  </span>
                </span>
                <span class="theme-toggle-label-text">${isDark ? 'Escuro' : 'Claro'}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="card mb-xl">
          <div class="settings-section">
            <h3>Auto-save</h3>
            <div class="setting-row">
              <div>
                <div class="setting-label">Intervalo de salvamento automático</div>
                <div class="setting-description">Salva automaticamente as alterações no intervalo configurado</div>
              </div>
              <select class="form-select" id="setting-autosave" style="width:auto;">
                <option value="0" ${autoSave === 0 ? 'selected' : ''}>Desligado</option>
                <option value="10" ${autoSave === 10 ? 'selected' : ''}>10 segundos</option>
                <option value="30" ${autoSave === 30 ? 'selected' : ''}>30 segundos</option>
                <option value="60" ${autoSave === 60 ? 'selected' : ''}>1 minuto</option>
                <option value="120" ${autoSave === 120 ? 'selected' : ''}>2 minutos</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card mb-xl">
          <div class="settings-section">
            <h3>Moeda</h3>
            <div class="setting-row">
              <div>
                <div class="setting-label">Moeda padrão</div>
                <div class="setting-description">Define o formato de exibição dos valores</div>
              </div>
              <select class="form-select" id="setting-currency" style="width:auto;">
                <option value="BRL" ${config.currency === 'BRL' ? 'selected' : ''}>Real (R$)</option>
                <option value="USD" ${config.currency === 'USD' ? 'selected' : ''}>Dólar (US$)</option>
                <option value="EUR" ${config.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card mb-xl">
          <div class="settings-section">
            <h3>Backup</h3>
            <div class="setting-row">
              <div>
                <div class="setting-label">Exportar backup completo</div>
                <div class="setting-description">Baixa todos os dados em um único arquivo JSON</div>
              </div>
              <button class="btn btn-secondary" id="btn-export">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar
              </button>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-label">Importar backup</div>
                <div class="setting-description">Restaura dados de um arquivo de backup. <strong style="color:var(--danger);">Substitui todos os dados atuais!</strong></div>
              </div>
              <label class="btn btn-secondary" style="cursor:pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Importar
                <input type="file" accept=".json" id="btn-import" style="display:none;">
              </label>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="settings-section">
            <h3>Informações</h3>
            <div class="setting-row">
              <div class="setting-label">Pasta de dados</div>
              <span style="font-size:0.85rem;color:var(--text-secondary);">${Storage.getFolderName() || '—'}</span>
            </div>
            <div class="setting-row">
              <div class="setting-label">Criado em</div>
              <span style="font-size:0.85rem;color:var(--text-secondary);">${config.createdAt ? Models.formatDate(config.createdAt) : '—'}</span>
            </div>
            <div class="setting-row">
              <div class="setting-label">Transações</div>
              <span style="font-size:0.85rem;color:var(--text-secondary);">${(State.get('transactions') || []).length}</span>
            </div>
            <div class="setting-row">
              <div class="setting-label">Categorias</div>
              <span style="font-size:0.85rem;color:var(--text-secondary);">${(State.get('categories') || []).flatMap(g => g.categories || []).length}</span>
            </div>
            <div class="setting-row">
              <div class="setting-label">Contas</div>
              <span style="font-size:0.85rem;color:var(--text-secondary);">${(State.get('accounts') || []).length}</span>
            </div>
          </div>
        </div>
      </div>`;

    // Event listeners
    container.querySelector('#setting-theme').addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'light' : 'dark';
      State.update('config', c => { c.theme = newTheme; });
      App.applyTheme(newTheme);
      App.toast(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} ativado`, 'success');
      // Re-render to update the icon and label
      render(container);
    });

    container.querySelector('#setting-autosave').addEventListener('change', (e) => {
      const seconds = parseInt(e.target.value);
      State.update('config', c => { c.autoSaveSeconds = seconds; });
      App.setupAutoSave();
      App.toast(`Auto-save: ${seconds > 0 ? seconds + 's' : 'desligado'}`, 'success');
    });

    container.querySelector('#setting-currency').addEventListener('change', (e) => {
      State.update('config', c => { c.currency = e.target.value; });
      App.toast('Moeda atualizada', 'success');
    });

    container.querySelector('#btn-save-now').addEventListener('click', () => App.saveNow());

    container.querySelector('#btn-export').addEventListener('click', () => {
      const data = State.getAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-backup-${Models.todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      App.toast('Backup exportado!', 'success');
    });

    container.querySelector('#btn-import').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      App.confirm('Importar backup substituirá TODOS os dados atuais. Continuar?', () => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            State.loadFromStorage(data);
            App.saveNow();
            render(container);
            App.toast('Backup restaurado!', 'success');
          } catch (err) {
            App.toast('Erro ao ler arquivo: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });
    });
  }

  return { render };
})();
