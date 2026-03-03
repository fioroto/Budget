// ═══════════════════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════════════════

const ReportsPage = (() => {
    let startDate = '', endDate = '';

    function init() {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
    }
    init();

    function render(container) {
        const transactions = State.get('transactions') || [];
        const categories = State.get('categories') || [];
        const allCats = categories.flatMap(g => (g.categories || []).map(c => ({ ...c, groupName: g.name })));
        const fc = Models.formatCurrency;

        // Filter by date range and group by month
        const filtered = transactions.filter(t => {
            if (t.type === 'Transfer') return false;
            if (startDate && t.date < startDate) return false;
            if (endDate && t.date > endDate) return false;
            return true;
        });

        const monthlyData = {};
        const catNames = new Set();
        filtered.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[key]) monthlyData[key] = { key, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), income: 0, expenses: 0, byCat: {} };
            if (t.amount >= 0) monthlyData[key].income += t.amount;
            else {
                monthlyData[key].expenses += Math.abs(t.amount);
                const catName = allCats.find(c => c.id === t.categoryId)?.name || 'Sem Categoria';
                catNames.add(catName);
                monthlyData[key].byCat[catName] = (monthlyData[key].byCat[catName] || 0) + Math.abs(t.amount);
            }
        });

        const months = Object.values(monthlyData).sort((a, b) => a.key.localeCompare(b.key));
        const maxExpense = Math.max(...months.map(m => m.expenses), 1);
        const maxIncome = Math.max(...months.map(m => m.income), 1);
        const colors = ['#0d9488', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#e11d48'];
        const catList = [...catNames];

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Relatórios</h1>
            <p class="page-subtitle">Análise de gastos e receitas ao longo do tempo</p>
          </div>
          <div class="flex gap-sm items-center">
            <input type="date" class="form-input" id="report-start" value="${startDate}" style="width:auto;">
            <span style="color:var(--text-muted);">—</span>
            <input type="date" class="form-input" id="report-end" value="${endDate}" style="width:auto;">
          </div>
        </div>

        <!-- Expenses bar chart -->
        <div class="card mb-xl">
          <h3 class="card-title" style="margin-bottom:var(--space-xl);">Gastos por Categoria</h3>
          ${months.length > 0 ? renderStackedBars(months, catList, colors, maxExpense, fc) : '<div class="empty-state"><p>Nenhum dado para o período</p></div>'}
          ${catList.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:var(--space-md);margin-top:var(--space-lg);">${catList.map((c, i) => `<div class="flex items-center gap-sm"><div style="width:10px;height:10px;border-radius:2px;background:${colors[i % colors.length]};"></div><span style="font-size:0.75rem;color:var(--text-secondary);">${c}</span></div>`).join('')}</div>` : ''}
        </div>

        <!-- Income bar chart -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom:var(--space-xl);">Receitas</h3>
          ${months.length > 0 ? renderIncomeBars(months, maxIncome, fc) : '<div class="empty-state"><p>Nenhum dado</p></div>'}
        </div>
      </div>`;

        container.querySelector('#report-start').addEventListener('change', e => { startDate = e.target.value; render(container); });
        container.querySelector('#report-end').addEventListener('change', e => { endDate = e.target.value; render(container); });
    }

    function renderStackedBars(months, catList, colors, max, fc) {
        const barW = Math.max(30, Math.min(60, 600 / months.length));
        const h = 280;
        return `<div style="display:flex;align-items:flex-end;gap:8px;height:${h}px;padding-bottom:24px;position:relative;border-bottom:1px solid var(--border);">
      ${months.map(m => {
            let y = 0;
            const segments = catList.map((cat, ci) => {
                const val = m.byCat[cat] || 0;
                const segH = max > 0 ? (val / max) * (h - 24) : 0;
                const seg = `<div title="${cat}: ${fc(val)}" style="width:100%;height:${segH}px;background:${colors[ci % colors.length]};"></div>`;
                y += segH;
                return seg;
            }).reverse().join('');
            return `<div style="flex:1;max-width:${barW}px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;">
          <div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;border-radius:3px 3px 0 0;overflow:hidden;">${segments}</div>
          <span style="font-size:0.65rem;color:var(--text-muted);margin-top:6px;white-space:nowrap;">${m.label}</span>
        </div>`;
        }).join('')}
    </div>`;
    }

    function renderIncomeBars(months, max, fc) {
        const h = 200;
        return `<div style="display:flex;align-items:flex-end;gap:8px;height:${h}px;padding-bottom:24px;border-bottom:1px solid var(--border);">
      ${months.map(m => {
            const barH = max > 0 ? (m.income / max) * (h - 24) : 0;
            return `<div style="flex:1;max-width:60px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;">
          <div title="${fc(m.income)}" style="width:100%;height:${barH}px;background:#10b981;border-radius:3px 3px 0 0;min-height:${m.income > 0 ? 2 : 0}px;"></div>
          <span style="font-size:0.65rem;color:var(--text-muted);margin-top:6px;white-space:nowrap;">${m.label}</span>
        </div>`;
        }).join('')}
    </div>`;
    }

    return { render };
})();
