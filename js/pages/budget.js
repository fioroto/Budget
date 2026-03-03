// ═══════════════════════════════════════════════════════
// BUDGET PAGE
// ═══════════════════════════════════════════════════════

const BudgetPage = (() => {
    let year, month;
    let editingCategoryId = null;
    let expandedGroups = new Set();

    function init() {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
    }
    init();

    function render(container) {
        const categories = State.get('categories') || [];
        const transactions = State.get('transactions') || [];
        const budgetEntries = State.get('budget') || [];
        const summary = Models.calcBudgetSummary(year, month, categories, transactions, budgetEntries);
        const fc = Models.formatCurrency;

        if (expandedGroups.size === 0 && summary.groups.length > 0) {
            summary.groups.forEach(g => expandedGroups.add(g.groupId));
        }

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <div class="month-navigator">
            <button class="btn btn-ghost" id="budget-prev">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="month-display">${Models.getMonthName(month)} ${year}</div>
            <button class="btn btn-ghost" id="budget-next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="to-be-budgeted ${summary.toBeBudgeted >= 0 ? 'positive' : 'negative'}">
            <div class="label">A Orçar</div>
            <div class="value ${summary.toBeBudgeted >= 0 ? 'text-accent' : 'text-danger'}">${fc(summary.toBeBudgeted)}</div>
          </div>
        </div>

        <!-- Column Headers -->
        <div class="budget-group-header" style="background:var(--bg-card);border-bottom:2px solid var(--border);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);cursor:default;">
          <div>Categoria</div>
          <div style="text-align:right;">Orçado</div>
          <div style="text-align:right;">Atividade</div>
          <div style="text-align:right;">Disponível</div>
        </div>

        <!-- Groups -->
        <div id="budget-groups" style="margin-top:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md);">
          ${summary.groups.map((group, gi) => renderGroup(group, gi, fc)).join('')}
        </div>

        <!-- Footer Totals -->
        <div class="budget-group-header" style="margin-top:var(--space-xl);background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);">
          <div style="font-weight:600;">Total</div>
          <div class="mono" style="text-align:right;font-weight:300;">${fc(summary.totalBudgeted)}</div>
          <div class="mono" style="text-align:right;font-weight:300;">${fc(summary.totalActivity)}</div>
          <div class="mono text-accent" style="text-align:right;font-weight:300;">${fc(summary.totalAvailable)}</div>
        </div>
      </div>
    `;

        // Event listeners
        container.querySelector('#budget-prev').addEventListener('click', () => { prevMonth(); render(container); });
        container.querySelector('#budget-next').addEventListener('click', () => { nextMonth(); render(container); });

        // Group toggles
        container.querySelectorAll('[data-toggle-group]').forEach(el => {
            el.addEventListener('click', () => {
                const gid = el.dataset.toggleGroup;
                if (expandedGroups.has(gid)) expandedGroups.delete(gid);
                else expandedGroups.add(gid);
                render(container);
            });
        });

        // Budget cell clicks for editing
        container.querySelectorAll('[data-budget-edit]').forEach(el => {
            el.addEventListener('click', () => {
                editingCategoryId = el.dataset.budgetEdit;
                render(container);
            });
        });

        // Budget input
        container.querySelectorAll('.budget-input').forEach(input => {
            input.focus();
            input.addEventListener('blur', () => { saveBudgetValue(input); render(container); });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { saveBudgetValue(input); render(container); }
                if (e.key === 'Escape') { editingCategoryId = null; render(container); }
            });
        });
    }

    function renderGroup(group, gi, fc) {
        const isExpanded = expandedGroups.has(group.groupId);
        const totalBudgeted = group.categories.reduce((s, c) => s + c.budgeted, 0);
        const totalActivity = group.categories.reduce((s, c) => s + c.activity, 0);
        const totalAvailable = group.categories.reduce((s, c) => s + c.available, 0);

        return `
      <div class="group-container" style="animation:slideIn 300ms ease;animation-delay:${gi * 0.04}s;animation-fill-mode:backwards;">
        <div class="budget-group-header" data-toggle-group="${group.groupId}">
          <div class="group-name">
            <svg class="chevron ${isExpanded ? 'expanded' : 'collapsed'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            ${group.groupName}
            ${group.isSystem ? '<span class="badge badge-accent">Sistema</span>' : ''}
          </div>
          <div class="mono" style="text-align:right;font-size:0.85rem;color:var(--text-muted);">${fc(totalBudgeted)}</div>
          <div class="mono" style="text-align:right;font-size:0.85rem;color:var(--text-muted);">${fc(totalActivity)}</div>
          <div class="mono" style="text-align:right;font-size:0.85rem;font-weight:500;color:${totalAvailable >= 0 ? 'var(--accent)' : 'var(--danger)'};">${fc(totalAvailable)}</div>
        </div>
        ${isExpanded ? `
          <div class="group-body">
            ${group.categories.map(cat => renderCategoryRow(cat, fc)).join('')}
          </div>
        ` : ''}
      </div>
    `;
    }

    function renderCategoryRow(cat, fc) {
        const isEditing = editingCategoryId === cat.categoryId;
        const isCreditCard = !!cat.linkedCreditCardAccountId;

        return `
      <div class="budget-category-row">
        <div class="category-name">
          ${cat.categoryName}
          ${isCreditCard ? '<span class="badge badge-info" style="margin-left:6px;">💳</span>' : ''}
        </div>
        <div style="text-align:right;">
          ${isEditing ? `
            <input type="number" class="budget-input" data-cat-id="${cat.categoryId}"
              value="${cat.budgeted === 0 ? '' : cat.budgeted}" placeholder="0,00" step="0.01" />
          ` : `
            <div class="budget-value ${cat.budgeted === 0 ? 'zero' : ''}" data-budget-edit="${cat.categoryId}">
              ${fc(cat.budgeted)}
            </div>
          `}
        </div>
        <div class="mono" style="text-align:right;font-size:0.85rem;font-weight:300;color:${cat.activity < 0 ? 'var(--text-muted)' : 'var(--success)'};">
          ${fc(cat.activity)}
        </div>
        <div class="mono" style="text-align:right;font-size:0.85rem;font-weight:300;color:${cat.available > 0 ? 'var(--success)' : cat.available < 0 ? 'var(--danger)' : 'var(--text-muted)'};">
          ${fc(cat.available)}
        </div>
      </div>
    `;
    }

    function saveBudgetValue(input) {
        const catId = input.dataset.catId;
        const value = parseFloat(input.value) || 0;
        editingCategoryId = null;

        State.update('budget', entries => {
            const existing = entries.find(e => e.categoryId === catId && e.year === year && e.month === month);
            if (existing) {
                existing.budgeted = value;
            } else {
                entries.push(Models.createBudgetEntry({ categoryId: catId, year, month, budgeted: value }));
            }
        });
    }

    function prevMonth() {
        if (month === 1) { month = 12; year--; } else { month--; }
    }

    function nextMonth() {
        if (month === 12) { month = 1; year++; } else { month++; }
    }

    return { render };
})();
