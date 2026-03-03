// ═══════════════════════════════════════════════════════
// CATEGORIES PAGE
// ═══════════════════════════════════════════════════════

const CategoriesPage = (() => {
    let expandedGroups = new Set();

    function render(container) {
        const categories = State.get('categories') || [];
        const accounts = State.get('accounts') || [];
        const creditCards = accounts.filter(a => a.type === 'CreditCard' && a.isActive);

        if (expandedGroups.size === 0) categories.forEach(g => expandedGroups.add(g.id));

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <h1 class="page-title">Categorias</h1>
          <button class="btn btn-primary" id="btn-new-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Grupo
          </button>
        </div>
        <div id="categories-list">
          ${categories.length > 0 ? categories.map((g, i) => renderGroup(g, i, creditCards)).join('') : `
            <div class="empty-state"><p>Nenhuma categoria. Clique em "Novo Grupo" para começar.</p></div>`}
        </div>
      </div>`;
        setupListeners(container, creditCards);
    }

    function renderGroup(group, i, creditCards) {
        const isExp = expandedGroups.has(group.id);
        return `
      <div class="group-container" style="animation:slideIn 300ms ease;animation-delay:${i * 0.04}s;animation-fill-mode:backwards;">
        <div class="group-header" data-toggle="${group.id}">
          <div class="group-title">
            <svg width="16" height="16" class="chevron ${isExp ? 'expanded' : 'collapsed'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent);transition:transform 150ms;${isExp ? '' : 'transform:rotate(-90deg);'}"><polyline points="6 9 12 15 18 9"/></svg>
            <span>${group.name}</span>
            ${group.isSystem ? '<span class="badge badge-accent">Sistema</span>' : ''}
          </div>
          <div class="flex gap-sm">
            <button class="btn-icon" data-add-cat="${group.id}" title="Adicionar categoria" style="color:var(--accent);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
            ${!group.isSystem ? `<button class="btn-icon danger" data-delete-group="${group.id}" title="Excluir grupo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>` : ''}
          </div>
        </div>
        ${isExp ? `<div class="group-body">
          ${(group.categories || []).map(c => `
            <div class="group-item">
              <div class="flex items-center gap-sm">
                <span class="item-name">${c.name}</span>
                ${c.linkedCreditCardAccountId ? '<span class="badge badge-info">💳 Cartão</span>' : ''}
                ${c.isSystem ? '<span class="badge" style="background:var(--bg-card);color:var(--text-muted);font-size:0.65rem;">Sistema</span>' : ''}
              </div>
              ${!c.isSystem ? `<button class="btn-icon danger" data-delete-cat="${c.id}" data-group-id="${group.id}" title="Excluir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>` : ''}
            </div>`).join('')}
          ${(group.categories || []).length === 0 ? '<div class="group-item" style="color:var(--text-muted);font-style:italic;font-size:0.8rem;">Nenhuma categoria neste grupo</div>' : ''}
        </div>` : ''}
      </div>`;
    }

    function setupListeners(container, creditCards) {
        container.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => {
            const id = el.dataset.toggle;
            expandedGroups.has(id) ? expandedGroups.delete(id) : expandedGroups.add(id);
            render(container);
        }));

        container.querySelector('#btn-new-group')?.addEventListener('click', () => {
            App.showModal('Novo Grupo', '<div class="form-group"><label class="form-label">Nome do Grupo</label><input type="text" class="form-input" id="group-name" autofocus required></div>', (m) => {
                const name = m.querySelector('#group-name').value.trim();
                if (!name) { App.toast('Nome obrigatório', 'error'); return; }
                State.update('categories', cats => cats.push(Models.createCategoryGroup({ name })));
                render(container);
                App.toast('Grupo criado!', 'success');
            }, 'Criar');
        });

        container.querySelectorAll('[data-add-cat]').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const groupId = btn.dataset.addCat;
            const ccOptions = creditCards.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
            App.showModal('Nova Categoria', `
        <div class="form-group"><label class="form-label">Nome</label><input type="text" class="form-input" id="cat-name" autofocus required></div>
        ${creditCards.length > 0 ? `<div class="form-group"><label class="form-label">Vincular a Cartão de Crédito</label><select class="form-select" id="cat-cc"><option value="">Nenhum (categoria normal)</option>${ccOptions}</select></div>` : ''}
      `, (m) => {
                const name = m.querySelector('#cat-name').value.trim();
                if (!name) { App.toast('Nome obrigatório', 'error'); return; }
                const linkedCC = m.querySelector('#cat-cc')?.value || null;
                State.update('categories', cats => {
                    const group = cats.find(g => g.id === groupId);
                    if (group) {
                        if (!group.categories) group.categories = [];
                        group.categories.push(Models.createCategory({ groupId, name, linkedCreditCardAccountId: linkedCC }));
                    }
                });
                render(container);
                App.toast('Categoria criada!', 'success');
            }, 'Criar');
        }));

        container.querySelectorAll('[data-delete-group]').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            App.confirm('Excluir este grupo e todas as categorias?', () => {
                State.update('categories', cats => { const i = cats.findIndex(g => g.id === btn.dataset.deleteGroup); if (i > -1) cats.splice(i, 1); });
                render(container);
            });
        }));

        container.querySelectorAll('[data-delete-cat]').forEach(btn => btn.addEventListener('click', () => {
            App.confirm('Excluir esta categoria?', () => {
                State.update('categories', cats => {
                    const group = cats.find(g => g.id === btn.dataset.groupId);
                    if (group?.categories) { const i = group.categories.findIndex(c => c.id === btn.dataset.deleteCat); if (i > -1) group.categories.splice(i, 1); }
                });
                render(container);
            });
        }));
    }

    return { render };
})();
