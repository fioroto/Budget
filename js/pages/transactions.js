// ═══════════════════════════════════════════════════════
// TRANSACTIONS PAGE
// ═══════════════════════════════════════════════════════

const TransactionsPage = (() => {
    let filters = { search: '', categoryId: '', accountId: '', startDate: '', endDate: '', sortBy: 'date', sortDir: 'desc' };
    let currentPage = 1;
    const pageSize = 50;

    function render(container) {
        const transactions = State.get('transactions') || [];
        const categories = State.get('categories') || [];
        const accounts = State.get('accounts') || [];
        const allCats = categories.flatMap(g => (g.categories || []).map(c => ({ ...c, groupName: g.name })));
        const fc = Models.formatCurrency;

        let filtered = applyFilters(transactions);
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentPage = Math.min(currentPage, totalPages);
        const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        const hasAccounts = accounts.length > 0;

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Transações</h1>
            <p class="page-subtitle">${filtered.length} transação(ões)</p>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary" id="btn-import-csv">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importar CSV
            </button>
            <button class="btn btn-primary" id="btn-new-tx">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nova Transação
            </button>
          </div>
        </div>
        <div class="filters-bar">
          <input type="text" class="form-input" placeholder="Buscar..." value="${filters.search}" id="filter-search" style="min-width:200px;">
          <input type="date" class="form-input" value="${filters.startDate}" id="filter-start">
          <input type="date" class="form-input" value="${filters.endDate}" id="filter-end">
          <select class="form-select" id="filter-category">
            <option value="">Todas categorias</option>
            ${categories.map(g => `<optgroup label="${g.name}">${(g.categories || []).map(c => `<option value="${c.id}" ${filters.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</optgroup>`).join('')}
          </select>
          ${hasAccounts ? `<select class="form-select" id="filter-account"><option value="">Todas contas</option>${accounts.filter(a => a.isActive).map(a => `<option value="${a.id}" ${filters.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select>` : ''}
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <table class="data-table"><thead><tr>
            <th data-sort="date" style="width:100px;">Data</th><th data-sort="payee">Descrição</th><th>Categoria</th>
            ${hasAccounts ? '<th>Conta</th>' : ''}<th class="text-right" data-sort="amount" style="width:130px;">Valor</th><th style="width:60px;"></th>
          </tr></thead><tbody>
            ${pageItems.length > 0 ? pageItems.map(t => renderRow(t, allCats, accounts, hasAccounts, fc)).join('') :
                `<tr><td colspan="${hasAccounts ? 6 : 5}" style="text-align:center;padding:var(--space-3xl);color:var(--text-muted);">Nenhuma transação</td></tr>`}
          </tbody></table>
        </div>
        ${totalPages > 1 ? `<div class="pagination"><button class="btn btn-ghost" id="page-prev" ${currentPage <= 1 ? 'disabled' : ''}>← Anterior</button><span class="page-info">Página ${currentPage} de ${totalPages}</span><button class="btn btn-ghost" id="page-next" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima →</button></div>` : ''}
      </div>`;
        setupListeners(container);
    }

    function renderRow(t, allCats, accounts, hasAccounts, fc) {
        const cat = allCats.find(c => c.id === t.categoryId);
        const acc = accounts.find(a => a.id === t.accountId);
        const cls = t.type === 'Transfer' ? 'transfer' : (t.amount >= 0 ? 'income' : 'expense');
        const icon = t.type === 'Transfer' ? '⇄' : (t.amount >= 0 ? '↑' : '↓');
        return `<tr>
      <td class="mono">${Models.formatDate(t.date)}</td>
      <td><div style="display:flex;align-items:center;gap:var(--space-sm);"><span class="transaction-type-icon ${cls}" style="width:24px;height:24px;font-size:0.7rem;">${icon}</span><div><div style="color:var(--text-primary);font-size:0.85rem;">${t.payee || '—'}</div>${t.memo ? `<div style="font-size:0.7rem;color:var(--text-muted);">${t.memo}</div>` : ''}</div></div></td>
      <td style="font-size:0.8rem;">${cat ? cat.name : '<span style="color:var(--text-muted)">—</span>'}</td>
      ${hasAccounts ? `<td style="font-size:0.8rem;">${acc ? acc.name : '<span style="color:var(--text-muted)">—</span>'}</td>` : ''}
      <td class="text-right mono" style="color:${t.amount >= 0 ? 'var(--success)' : 'var(--text-primary)'};">${fc(t.amount)}</td>
      <td><div class="flex gap-sm"><button class="btn-icon" data-edit-tx="${t.id}" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn-icon danger" data-delete-tx="${t.id}" title="Excluir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td></tr>`;
    }

    function applyFilters(transactions) {
        let f = [...transactions];
        if (filters.search) { const s = filters.search.toLowerCase(); f = f.filter(t => (t.payee || '').toLowerCase().includes(s) || (t.memo || '').toLowerCase().includes(s)); }
        if (filters.categoryId) f = f.filter(t => t.categoryId === filters.categoryId);
        if (filters.accountId) f = f.filter(t => t.accountId === filters.accountId);
        if (filters.startDate) f = f.filter(t => t.date >= filters.startDate);
        if (filters.endDate) f = f.filter(t => t.date <= filters.endDate);
        f.sort((a, b) => {
            let va, vb;
            switch (filters.sortBy) { case 'amount': va = a.amount; vb = b.amount; break; case 'payee': va = (a.payee || '').toLowerCase(); vb = (b.payee || '').toLowerCase(); break; default: va = a.date; vb = b.date; }
            return filters.sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
        });
        return f;
    }

    function setupListeners(container) {
        const bind = (id, ev, fn) => { const el = container.querySelector('#' + id); if (el) el.addEventListener(ev, fn); };
        bind('filter-search', 'input', e => { filters.search = e.target.value; currentPage = 1; render(container); });
        bind('filter-start', 'change', e => { filters.startDate = e.target.value; currentPage = 1; render(container); });
        bind('filter-end', 'change', e => { filters.endDate = e.target.value; currentPage = 1; render(container); });
        bind('filter-category', 'change', e => { filters.categoryId = e.target.value; currentPage = 1; render(container); });
        bind('filter-account', 'change', e => { filters.accountId = e.target.value; currentPage = 1; render(container); });
        container.querySelectorAll('th[data-sort]').forEach(th => th.addEventListener('click', () => { if (filters.sortBy === th.dataset.sort) filters.sortDir = filters.sortDir === 'asc' ? 'desc' : 'asc'; else { filters.sortBy = th.dataset.sort; filters.sortDir = th.dataset.sort === 'date' ? 'desc' : 'asc'; } render(container); }));
        bind('page-prev', 'click', () => { currentPage--; render(container); });
        bind('page-next', 'click', () => { currentPage++; render(container); });
        bind('btn-new-tx', 'click', () => showTxModal(null, container));
        bind('btn-import-csv', 'click', () => showCSVModal(container));
        container.querySelectorAll('[data-edit-tx]').forEach(b => b.addEventListener('click', () => { const tx = (State.get('transactions') || []).find(t => t.id === b.dataset.editTx); if (tx) showTxModal(tx, container); }));
        container.querySelectorAll('[data-delete-tx]').forEach(b => b.addEventListener('click', () => {
            App.confirm('Excluir esta transação?', () => { State.update('transactions', txs => { const tx = txs.find(t => t.id === b.dataset.deleteTx); if (tx?.transferPairId) { const pi = txs.findIndex(t => t.id === tx.transferPairId); if (pi > -1) txs.splice(pi, 1); } const i = txs.findIndex(t => t.id === b.dataset.deleteTx); if (i > -1) txs.splice(i, 1); }); render(container); });
        }));
    }

    function showTxModal(editTx, container) {
        const cats = State.get('categories') || [];
        const accs = State.get('accounts') || [];
        const isEdit = !!editTx;
        const hasAccs = accs.length > 0;
        const body = `
      <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="tx-type" ${isEdit ? 'disabled' : ''}><option value="Expense">Despesa</option><option value="Income">Receita</option>${hasAccs ? '<option value="Transfer">Transferência</option>' : ''}</select></div>
      <div id="tx-transfer-fields" class="hidden"><div class="form-row"><div class="form-group"><label class="form-label">De</label><select class="form-select" id="tx-from"><option value="">Selecione</option>${accs.filter(a => a.isActive).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Para</label><select class="form-select" id="tx-to"><option value="">Selecione</option>${accs.filter(a => a.isActive).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="tx-date" value="${editTx?.date || Models.todayISO()}"></div><div class="form-group"><label class="form-label">Valor</label><input type="number" class="form-input" id="tx-amount" step="0.01" placeholder="0,00" value="${editTx ? Math.abs(editTx.amount) : ''}"></div></div>
      <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-input" id="tx-payee" placeholder="Ex: Supermercado" value="${editTx?.payee || ''}"></div>
      <div class="form-row"><div class="form-group" id="tx-cat-g"><label class="form-label">Categoria</label><select class="form-select" id="tx-cat"><option value="">Sem categoria</option>${cats.map(g => `<optgroup label="${g.name}">${(g.categories || []).map(c => `<option value="${c.id}" ${editTx?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</optgroup>`).join('')}</select></div>${hasAccs ? `<div class="form-group" id="tx-acc-g"><label class="form-label">Conta</label><select class="form-select" id="tx-acc"><option value="">Sem conta</option>${accs.filter(a => a.isActive).map(a => `<option value="${a.id}" ${editTx?.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div>` : ''}</div>
      <div class="form-group"><label class="form-label">Memo</label><input type="text" class="form-input" id="tx-memo" value="${editTx?.memo || ''}" placeholder="Observação"></div>`;

        const overlay = App.showModal(isEdit ? 'Editar Transação' : 'Nova Transação', body, (m) => {
            const type = m.querySelector('#tx-type').value;
            if (type === 'Transfer') {
                const from = m.querySelector('#tx-from').value, to = m.querySelector('#tx-to').value;
                if (!from || !to || from === to) { App.toast('Selecione duas contas diferentes', 'error'); return; }
                const [o, i] = Models.createTransfer({ fromAccountId: from, toAccountId: to, date: m.querySelector('#tx-date').value, amount: parseFloat(m.querySelector('#tx-amount').value) || 0, memo: m.querySelector('#tx-memo').value });
                State.update('transactions', txs => { txs.push(o, i); });
            } else {
                const raw = parseFloat(m.querySelector('#tx-amount').value) || 0;
                const amt = type === 'Expense' ? -Math.abs(raw) : Math.abs(raw);
                const data = { date: m.querySelector('#tx-date').value, amount: amt, payee: m.querySelector('#tx-payee').value, categoryId: m.querySelector('#tx-cat').value || null, accountId: m.querySelector('#tx-acc')?.value || null, memo: m.querySelector('#tx-memo').value, type };
                if (isEdit) { State.update('transactions', txs => { const t = txs.find(x => x.id === editTx.id); if (t) Object.assign(t, data); }); }
                else { State.update('transactions', txs => txs.push(Models.createTransaction(data))); }
            }
            render(container);
            App.toast(isEdit ? 'Atualizada!' : 'Criada!', 'success');
        });
        if (editTx) overlay.querySelector('#tx-type').value = editTx.type;
        const toggle = () => { const isT = overlay.querySelector('#tx-type').value === 'Transfer'; overlay.querySelector('#tx-transfer-fields').classList.toggle('hidden', !isT); const ag = overlay.querySelector('#tx-acc-g'); if (ag) ag.classList.toggle('hidden', isT); const cg = overlay.querySelector('#tx-cat-g'); if (cg) cg.classList.toggle('hidden', isT); };
        overlay.querySelector('#tx-type').addEventListener('change', toggle);
        toggle();
    }

    function showCSVModal(container) {
        const accs = State.get('accounts') || [];
        const body = `<div class="form-group"><label class="form-label">Arquivo CSV</label><input type="file" class="form-input" id="csv-file" accept=".csv,.tsv,.txt" style="padding:var(--space-sm);"></div>
      <div class="form-group"><label class="form-label">Separador</label><select class="form-select" id="csv-sep"><option value=",">Vírgula</option><option value=";">Ponto e vírgula</option><option value="\t">Tab</option></select></div>
      ${accs.length > 0 ? `<div class="form-group"><label class="form-label">Conta</label><select class="form-select" id="csv-acc"><option value="">Sem conta</option>${accs.filter(a => a.isActive).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div>` : ''}
      <p style="font-size:0.75rem;color:var(--text-muted);">CSV com colunas: data, descrição, valor (cabeçalho na 1ª linha)</p>`;
        App.showModal('Importar CSV', body, (m) => {
            const file = m.querySelector('#csv-file').files[0];
            if (!file) { App.toast('Selecione um arquivo', 'error'); return; }
            const sep = m.querySelector('#csv-sep').value;
            const accId = m.querySelector('#csv-acc')?.value || null;
            const reader = new FileReader();
            reader.onload = (e) => {
                const lines = e.target.result.split('\n').filter(l => l.trim());
                if (lines.length < 2) { App.toast('Arquivo vazio', 'error'); return; }
                const hdr = lines[0].split(sep).map(h => h.trim().toLowerCase());
                const di = hdr.findIndex(h => h.includes('data') || h.includes('date'));
                const pi = hdr.findIndex(h => h.includes('desc') || h.includes('payee') || h.includes('memo'));
                const ai = hdr.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('value'));
                if (di === -1 || ai === -1) { App.toast('Colunas data/valor não encontradas', 'error'); return; }
                let count = 0;
                State.update('transactions', txs => {
                    for (let i = 1; i < lines.length; i++) {
                        const c = lines[i].split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
                        if (c.length <= Math.max(di, ai)) continue;
                        const amt = parseFloat(c[ai].replace(/[^\d.,-]/g, '').replace(',', '.'));
                        if (isNaN(amt)) continue;
                        let dt = c[di]; if (dt.includes('/')) { const p = dt.split('/'); if (p[2]?.length === 4) dt = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`; }
                        txs.push(Models.createTransaction({ accountId: accId, date: dt, amount: amt, payee: pi >= 0 ? c[pi] : '', type: amt >= 0 ? 'Income' : 'Expense' }));
                        count++;
                    }
                });
                render(container);
                App.toast(`${count} transações importadas!`, 'success');
            };
            reader.readAsText(file, 'UTF-8');
        }, 'Importar');
    }

    return { render };
})();
