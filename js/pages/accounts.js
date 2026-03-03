// ═══════════════════════════════════════════════════════
// ACCOUNTS PAGE
// ═══════════════════════════════════════════════════════

const AccountsPage = (() => {
    function render(container) {
        const accounts = State.get('accounts') || [];
        const transactions = State.get('transactions') || [];
        const withBalance = Models.calcAllAccountBalances(accounts, transactions);
        const fc = Models.formatCurrency;
        const totalBalance = withBalance.filter(a => a.isActive).reduce((s, a) => s + a.currentBalance, 0);

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Contas</h1>
            <p class="page-subtitle">${accounts.filter(a => a.isActive).length} conta(s) ativa(s) • Saldo total: <span class="mono ${totalBalance >= 0 ? 'text-accent' : 'text-danger'}">${fc(totalBalance)}</span></p>
          </div>
          <button class="btn btn-primary" id="btn-new-acc">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova Conta
          </button>
        </div>
        ${withBalance.length > 0 ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-lg);">
            ${withBalance.map(a => renderAccountCard(a, fc)).join('')}
          </div>
        ` : `<div class="empty-state"><p>Nenhuma conta cadastrada. As contas são opcionais — transações funcionam sem elas.</p></div>`}
      </div>`;
        container.querySelector('#btn-new-acc')?.addEventListener('click', () => showAccModal(null, container));
        container.querySelectorAll('[data-edit-acc]').forEach(b => b.addEventListener('click', () => { const a = accounts.find(x => x.id === b.dataset.editAcc); if (a) showAccModal(a, container); }));
        container.querySelectorAll('[data-delete-acc]').forEach(b => b.addEventListener('click', () => {
            App.confirm('Excluir esta conta?', () => { State.update('accounts', as => { const i = as.findIndex(x => x.id === b.dataset.deleteAcc); if (i > -1) as.splice(i, 1); }); render(container); });
        }));
    }

    function renderAccountCard(a, fc) {
        const typeLabel = Models.AccountTypeLabels[a.type] || a.type;
        const isCC = a.type === 'CreditCard';
        return `
      <div class="card" style="position:relative;">
        <div class="flex items-center justify-between" style="margin-bottom:var(--space-md);">
          <div>
            <h3 style="font-size:1rem;font-weight:600;">${a.name}</h3>
            <span class="badge ${isCC ? 'badge-info' : 'badge-accent'}" style="margin-top:4px;">${typeLabel}</span>
            ${a.isOffBudget ? '<span class="badge badge-warning" style="margin-left:4px;">Off-budget</span>' : ''}
            ${!a.isActive ? '<span class="badge badge-danger" style="margin-left:4px;">Inativa</span>' : ''}
          </div>
          <div class="flex gap-sm">
            <button class="btn-icon" data-edit-acc="${a.id}" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon danger" data-delete-acc="${a.id}" title="Excluir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </div>
        <p class="mono" style="font-size:1.4rem;font-weight:300;color:${a.currentBalance >= 0 ? 'var(--accent)' : 'var(--danger)'};">${fc(a.currentBalance)}</p>
        ${isCC ? `<div style="margin-top:var(--space-sm);font-size:0.75rem;color:var(--text-muted);">Limite: ${fc(a.creditLimit || 0)} • Fecha dia ${a.closingDay} • Vence dia ${a.dueDay}</div>` : ''}
        <div style="margin-top:var(--space-xs);font-size:0.7rem;color:var(--text-muted);">Saldo inicial: ${fc(a.initialBalance)}</div>
      </div>`;
    }

    function showAccModal(edit, container) {
        const isEdit = !!edit;
        const types = Object.entries(Models.AccountTypeLabels).map(([k, v]) => `<option value="${k}" ${edit?.type === k ? 'selected' : ''}>${v}</option>`).join('');
        const body = `
      <div class="form-group"><label class="form-label">Nome</label><input type="text" class="form-input" id="acc-name" value="${edit?.name || ''}" autofocus required></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="acc-type">${types}</select></div>
        <div class="form-group"><label class="form-label">Saldo Inicial</label><input type="number" class="form-input" id="acc-balance" step="0.01" value="${edit?.initialBalance || 0}"></div>
      </div>
      <div id="cc-fields" class="${edit?.type !== 'CreditCard' ? 'hidden' : ''}">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Limite</label><input type="number" class="form-input" id="acc-limit" step="0.01" value="${edit?.creditLimit || 0}"></div>
          <div class="form-group"><label class="form-label">Dia Fechamento</label><input type="number" class="form-input" id="acc-closing" min="1" max="31" value="${edit?.closingDay || 1}"></div>
        </div>
        <div class="form-group"><label class="form-label">Dia Vencimento</label><input type="number" class="form-input" id="acc-due" min="1" max="31" value="${edit?.dueDay || 10}"></div>
      </div>
      <div class="form-group"><label class="form-checkbox"><input type="checkbox" id="acc-offbudget" ${edit?.isOffBudget ? 'checked' : ''}> Off-budget (ex: investimento)</label></div>`;
        const ov = App.showModal(isEdit ? 'Editar Conta' : 'Nova Conta', body, (m) => {
            const data = { name: m.querySelector('#acc-name').value.trim(), type: m.querySelector('#acc-type').value, initialBalance: parseFloat(m.querySelector('#acc-balance').value) || 0, isOffBudget: m.querySelector('#acc-offbudget').checked, creditLimit: parseFloat(m.querySelector('#acc-limit').value) || 0, closingDay: parseInt(m.querySelector('#acc-closing').value) || 1, dueDay: parseInt(m.querySelector('#acc-due').value) || 10 };
            if (!data.name) { App.toast('Nome obrigatório', 'error'); return; }
            if (isEdit) { State.update('accounts', as => { const a = as.find(x => x.id === edit.id); if (a) Object.assign(a, data); }); }
            else { State.update('accounts', as => as.push(Models.createAccount(data))); }
            render(container);
            App.toast(isEdit ? 'Conta atualizada!' : 'Conta criada!', 'success');
        }, isEdit ? 'Salvar' : 'Criar');
        ov.querySelector('#acc-type').addEventListener('change', (e) => { ov.querySelector('#cc-fields').classList.toggle('hidden', e.target.value !== 'CreditCard'); });
    }

    return { render };
})();
