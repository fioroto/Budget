// ═══════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════

const DashboardPage = (() => {
    function render(container) {
        const accounts = State.get('accounts') || [];
        const categories = State.get('categories') || [];
        const transactions = State.get('transactions') || [];
        const budgetEntries = State.get('budget') || [];

        const kpis = Models.calcDashboardKPIs(accounts, categories, transactions, budgetEntries);
        const fc = Models.formatCurrency;

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Visão geral das suas finanças</p>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="flex items-center justify-between">
              <span class="kpi-label">Patrimônio Líquido</span>
              <div style="width:36px;height:36px;background:var(--accent-light);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--accent);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
            </div>
            <p class="kpi-value ${kpis.netWorth >= 0 ? 'text-accent' : 'text-danger'}">${fc(kpis.netWorth)}</p>
            <p class="kpi-detail">${kpis.totalAccounts} conta(s) ativa(s)</p>
          </div>

          <div class="kpi-card">
            <div class="flex items-center justify-between">
              <span class="kpi-label">A Orçar</span>
              <div style="width:36px;height:36px;background:${kpis.toBeBudgeted >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)'};border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:${kpis.toBeBudgeted >= 0 ? 'var(--success)' : 'var(--danger)'};">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
            </div>
            <p class="kpi-value ${kpis.toBeBudgeted >= 0 ? 'text-accent' : 'text-danger'}">${fc(kpis.toBeBudgeted)}</p>
            <p class="kpi-detail">Disponível para orçamentar</p>
          </div>

          <div class="kpi-card">
            <div class="flex items-center justify-between">
              <span class="kpi-label">Receitas do Mês</span>
              <div style="width:36px;height:36px;background:var(--success-bg);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--success);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
            </div>
            <p class="kpi-value text-accent">${fc(kpis.monthlyIncome)}</p>
            <p class="kpi-detail">${kpis.incomeCount} transação(ões)</p>
          </div>

          <div class="kpi-card">
            <div class="flex items-center justify-between">
              <span class="kpi-label">Gastos do Mês</span>
              <div style="width:36px;height:36px;background:var(--danger-bg);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--danger);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
              </div>
            </div>
            <p class="kpi-value text-danger">${fc(kpis.monthlyExpenses)}</p>
            <p class="kpi-detail">${kpis.expenseCount} transação(ões)</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg);margin-bottom:var(--space-xl);">
          <!-- Budget vs Actual -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom:var(--space-lg);">Orçado vs. Gasto</h3>
            <div id="dashboard-budget-chart">
              ${renderBudgetBars(kpis.spendingByGroup)}
            </div>
          </div>

          <!-- Spending Distribution -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom:var(--space-lg);">Distribuição de Gastos</h3>
            <div id="dashboard-donut" style="display:flex;align-items:center;gap:var(--space-xl);">
              ${renderDonutChart(kpis.spendingByGroup)}
            </div>
          </div>
        </div>

        <!-- Bottom Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg);">
          <!-- Account Summary -->
          ${kpis.accountSummaries.length > 0 ? `
          <div class="card">
            <h3 class="card-title" style="margin-bottom:var(--space-lg);">Resumo por Tipo de Conta</h3>
            <div>
              ${kpis.accountSummaries.map(s => `
                <div style="display:flex;justify-content:space-between;padding:var(--space-sm) 0;border-bottom:1px solid var(--border);">
                  <span style="font-size:0.85rem;color:var(--text-secondary);">${s.accountType}</span>
                  <span class="mono ${s.balance >= 0 ? '' : 'text-danger'}" style="font-size:0.85rem;">${fc(s.balance)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Recent Transactions -->
          <div class="card" style="${kpis.accountSummaries.length === 0 ? 'grid-column:1/-1;' : ''}">
            <h3 class="card-title" style="margin-bottom:var(--space-lg);">Atividade Recente</h3>
            ${kpis.recentTransactions.length > 0 ? `
              <div>
                ${kpis.recentTransactions.map(t => `
                  <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--border);">
                    <div class="transaction-type-icon ${t.amount >= 0 ? 'income' : 'expense'}">
                      ${t.amount >= 0 ? '↑' : '↓'}
                    </div>
                    <div style="flex:1;min-width:0;">
                      <p style="font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.payee || t.categoryName || 'Sem descrição'}</p>
                      <p style="font-size:0.75rem;color:var(--text-muted);">${t.accountName ? t.accountName + ' • ' : ''}${Models.formatDate(t.date)}</p>
                    </div>
                    <span class="mono" style="font-size:0.85rem;color:${t.amount >= 0 ? 'var(--accent)' : 'var(--text-primary)'};">${fc(t.amount)}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state" style="padding:var(--space-xl);">
                <p style="font-size:0.85rem;">Nenhuma transação recente</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    }

    function renderBudgetBars(spendingByGroup) {
        if (spendingByGroup.length === 0) {
            return '<div class="empty-state"><p>Nenhum gasto registrado este mês</p></div>';
        }
        const colors = ['#0d9488', '#0891b2', '#10b981', '#f59e0b', '#ef4444'];
        return `<div style="display:flex;flex-direction:column;gap:var(--space-md);">
      ${spendingByGroup.map((g, i) => `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:0.8rem;color:var(--text-secondary);">${g.groupName}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${Models.formatCurrency(g.spent)} / ${Models.formatCurrency(g.budgeted)}</span>
          </div>
          <div style="height:10px;background:rgba(255,255,255,0.04);border-radius:5px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(g.percentUsed, 100)}%;background:${g.percentUsed > 100 ? '#ef4444' : g.percentUsed > 80 ? '#f59e0b' : colors[i % colors.length]};border-radius:5px;transition:width 0.5s ease;"></div>
          </div>
          ${g.percentUsed > 100 ? `<p style="font-size:0.7rem;color:var(--danger);margin-top:2px;">Excedido em ${Models.formatCurrency(g.spent - g.budgeted)}</p>` : ''}
        </div>
      `).join('')}
    </div>`;
    }

    function renderDonutChart(spendingByGroup) {
        const total = spendingByGroup.reduce((s, g) => s + g.spent, 0);
        if (total === 0) {
            return '<div class="empty-state" style="width:100%;"><p>Nenhum gasto para exibir</p></div>';
        }
        const colors = ['#0d9488', '#0891b2', '#10b981', '#0f766e', '#134e4a'];
        let offset = 0;
        const circles = spendingByGroup.map((g, i) => {
            const pct = (g.spent / total) * 100;
            const circle = `<circle cx="18" cy="18" r="15.5" fill="none" stroke="${colors[i % colors.length]}" stroke-width="3" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${-offset}" />`;
            offset += pct;
            return circle;
        }).join('');

        const legend = spendingByGroup.map((g, i) => `
      <div style="display:flex;align-items:center;gap:var(--space-sm);">
        <div style="width:10px;height:10px;background:${colors[i % colors.length]};border-radius:2px;flex-shrink:0;"></div>
        <span style="font-size:0.8rem;color:var(--text-secondary);flex:1;">${g.groupName}</span>
        <span style="font-size:0.8rem;font-family:var(--font-mono);font-weight:300;">${((g.spent / total) * 100).toFixed(0)}%</span>
      </div>
    `).join('');

        return `
      <div style="position:relative;width:120px;height:120px;flex-shrink:0;">
        <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg);">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" stroke-width="3"/>
          ${circles}
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;">
          <div>
            <p style="font-size:0.65rem;color:var(--text-muted);">Total</p>
            <p style="font-size:0.75rem;font-weight:300;">${Models.formatCurrency(total)}</p>
          </div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-sm);">
        ${legend}
      </div>
    `;
    }

    return { render };
})();
