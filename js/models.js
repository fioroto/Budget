// ═══════════════════════════════════════════════════════
// MODELS — Data creation, validation, calculations
// ═══════════════════════════════════════════════════════

const Models = (() => {
    // ── Account Types ──
    const AccountType = {
        Checking: 'Checking',
        Savings: 'Savings',
        Cash: 'Cash',
        CreditCard: 'CreditCard',
        Investment: 'Investment',
        Other: 'Other',
    };

    const AccountTypeLabels = {
        Checking: 'Corrente',
        Savings: 'Poupança',
        Cash: 'Dinheiro',
        CreditCard: 'Cartão de Crédito',
        Investment: 'Investimento',
        Other: 'Outro',
    };

    const TransactionType = {
        Expense: 'Expense',
        Income: 'Income',
        Transfer: 'Transfer',
    };

    // ── Factories ──

    function createAccount({ name, type = AccountType.Checking, initialBalance = 0, isOffBudget = false, creditLimit, closingDay, dueDay }) {
        return {
            id: crypto.randomUUID(),
            name,
            type,
            initialBalance: Number(initialBalance) || 0,
            isActive: true,
            isOffBudget,
            creditLimit: type === AccountType.CreditCard ? (Number(creditLimit) || 0) : undefined,
            closingDay: type === AccountType.CreditCard ? (Number(closingDay) || 1) : undefined,
            dueDay: type === AccountType.CreditCard ? (Number(dueDay) || 10) : undefined,
            createdAt: new Date().toISOString(),
        };
    }

    function createCategoryGroup({ name }) {
        return {
            id: crypto.randomUUID(),
            name,
            sortOrder: 0,
            isSystem: false,
            createdAt: new Date().toISOString(),
        };
    }

    function createCategory({ groupId, name, linkedCreditCardAccountId }) {
        return {
            id: crypto.randomUUID(),
            groupId,
            name,
            sortOrder: 0,
            isHidden: false,
            isSystem: false,
            linkedCreditCardAccountId: linkedCreditCardAccountId || null,
            createdAt: new Date().toISOString(),
        };
    }

    function createTransaction({ accountId, categoryId, date, amount, payee, memo, type = TransactionType.Expense, transferPairId, transferAccountId }) {
        return {
            id: crypto.randomUUID(),
            accountId: accountId || null,
            categoryId: categoryId || null,
            date,
            amount: Number(amount) || 0,
            payee: payee || '',
            memo: memo || '',
            type,
            transferPairId: transferPairId || null,
            transferAccountId: transferAccountId || null,
            createdAt: new Date().toISOString(),
        };
    }

    function createTransfer({ fromAccountId, toAccountId, date, amount, memo }) {
        const pairId = crypto.randomUUID();
        const outgoing = createTransaction({
            accountId: fromAccountId,
            date,
            amount: -Math.abs(Number(amount)),
            payee: 'Transferência',
            memo,
            type: TransactionType.Transfer,
            transferPairId: pairId,
            transferAccountId: toAccountId,
        });
        const incoming = createTransaction({
            accountId: toAccountId,
            date,
            amount: Math.abs(Number(amount)),
            payee: 'Transferência',
            memo,
            type: TransactionType.Transfer,
            transferPairId: pairId,
            transferAccountId: fromAccountId,
        });
        outgoing.transferPairId = incoming.id;
        incoming.transferPairId = outgoing.id;
        return [outgoing, incoming];
    }

    function createBudgetEntry({ categoryId, year, month, budgeted }) {
        return {
            id: crypto.randomUUID(),
            categoryId,
            year: Number(year),
            month: Number(month),
            budgeted: Number(budgeted) || 0,
        };
    }

    // ── Calculations ──

    function calcAccountBalance(accountId, accounts, transactions) {
        const account = accounts.find(a => a.id === accountId);
        if (!account) return 0;
        const txTotal = transactions
            .filter(t => t.accountId === accountId)
            .reduce((sum, t) => sum + t.amount, 0);
        return account.initialBalance + txTotal;
    }

    function calcAllAccountBalances(accounts, transactions) {
        return accounts.map(a => ({
            ...a,
            currentBalance: calcAccountBalance(a.id, accounts, transactions),
        }));
    }

    function getTransactionsForMonth(transactions, year, month) {
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        });
    }

    function calcBudgetSummary(year, month, categories, transactions, budgetEntries) {
        const monthTx = getTransactionsForMonth(transactions, year, month)
            .filter(t => t.type !== TransactionType.Transfer);

        const allCategories = categories.flatMap(g => g.categories || []);

        // Flatten budget entries
        const entriesMap = {};
        budgetEntries.forEach(e => {
            if (e.year === year && e.month === month) {
                entriesMap[e.categoryId] = e.budgeted;
            }
        });

        // Calculate cumulative available (from all previous months)
        const allPrevEntries = budgetEntries.filter(e =>
            e.year < year || (e.year === year && e.month < month)
        );
        const allPrevTx = transactions.filter(t => {
            if (t.type === TransactionType.Transfer) return false;
            const d = new Date(t.date);
            return d.getFullYear() < year || (d.getFullYear() === year && (d.getMonth() + 1) < month);
        });

        const prevBudgetedByCat = {};
        allPrevEntries.forEach(e => {
            prevBudgetedByCat[e.categoryId] = (prevBudgetedByCat[e.categoryId] || 0) + e.budgeted;
        });
        const prevActivityByCat = {};
        allPrevTx.forEach(t => {
            if (t.categoryId) {
                prevActivityByCat[t.categoryId] = (prevActivityByCat[t.categoryId] || 0) + t.amount;
            }
        });

        const groups = categories.map(group => {
            const cats = (group.categories || []).map(cat => {
                const budgeted = entriesMap[cat.id] || 0;
                const activity = monthTx
                    .filter(t => t.categoryId === cat.id)
                    .reduce((sum, t) => sum + t.amount, 0);
                const prevBudgeted = prevBudgetedByCat[cat.id] || 0;
                const prevActivity = prevActivityByCat[cat.id] || 0;
                const carryover = prevBudgeted + prevActivity;
                const available = Math.max(carryover, 0) + budgeted + activity;

                return {
                    categoryId: cat.id,
                    categoryName: cat.name,
                    linkedCreditCardAccountId: cat.linkedCreditCardAccountId,
                    budgeted,
                    activity,
                    available,
                };
            });

            return {
                groupId: group.id,
                groupName: group.name,
                isSystem: group.isSystem,
                categories: cats,
            };
        });

        const totalBudgeted = groups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.budgeted, 0), 0);
        const totalActivity = groups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.activity, 0), 0);
        const totalAvailable = groups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.available, 0), 0);

        // To be budgeted = total income (not categorized + income type) - total budgeted across all time
        const totalIncome = transactions
            .filter(t => {
                if (t.type === TransactionType.Transfer) return false;
                const d = new Date(t.date);
                return d.getFullYear() < year || (d.getFullYear() === year && (d.getMonth() + 1) <= month);
            })
            .filter(t => t.amount > 0)
            .reduce((s, t) => s + t.amount, 0);
        const totalBudgetedAllTime = budgetEntries
            .filter(e => e.year < year || (e.year === year && e.month <= month))
            .reduce((s, e) => s + e.budgeted, 0);
        const toBeBudgeted = totalIncome - totalBudgetedAllTime;

        return { year, month, groups, totalBudgeted, totalActivity, totalAvailable, toBeBudgeted };
    }

    function calcDashboardKPIs(accounts, categories, transactions, budgetEntries) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const accountsWithBalance = calcAllAccountBalances(accounts, transactions);
        const netWorth = accountsWithBalance
            .filter(a => a.isActive)
            .reduce((s, a) => s + a.currentBalance, 0);

        const monthTx = getTransactionsForMonth(transactions, year, month)
            .filter(t => t.type !== TransactionType.Transfer);
        const monthlyIncome = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const monthlyExpenses = Math.abs(monthTx.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
        const incomeCount = monthTx.filter(t => t.amount > 0).length;
        const expenseCount = monthTx.filter(t => t.amount < 0).length;

        const budgetSummary = calcBudgetSummary(year, month, categories, transactions, budgetEntries);

        // Spending by group
        const spendingByGroup = budgetSummary.groups
            .map(g => {
                const budgeted = g.categories.reduce((s, c) => s + c.budgeted, 0);
                const spent = Math.abs(g.categories.reduce((s, c) => s + Math.min(c.activity, 0), 0));
                return {
                    groupName: g.groupName,
                    budgeted,
                    spent,
                    percentUsed: budgeted > 0 ? (spent / budgeted) * 100 : 0,
                };
            })
            .filter(g => g.spent > 0 || g.budgeted > 0);

        // Recent transactions
        const recentTransactions = [...transactions]
            .filter(t => t.type !== TransactionType.Transfer)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8)
            .map(t => {
                const cat = categories.flatMap(g => g.categories || []).find(c => c.id === t.categoryId);
                const acc = accounts.find(a => a.id === t.accountId);
                return {
                    id: t.id,
                    accountName: acc?.name || '',
                    categoryName: cat?.name || null,
                    date: t.date,
                    amount: t.amount,
                    payee: t.payee,
                };
            });

        // Account summaries by type
        const accountSummaries = [];
        const grouped = {};
        accountsWithBalance.filter(a => a.isActive).forEach(a => {
            const label = AccountTypeLabels[a.type] || a.type;
            if (!grouped[label]) grouped[label] = 0;
            grouped[label] += a.currentBalance;
        });
        for (const [type, balance] of Object.entries(grouped)) {
            accountSummaries.push({ accountType: type, balance });
        }

        return {
            netWorth,
            toBeBudgeted: budgetSummary.toBeBudgeted,
            monthlyIncome,
            monthlyExpenses,
            totalAccounts: accounts.filter(a => a.isActive).length,
            incomeCount,
            expenseCount,
            spendingByGroup,
            accountSummaries,
            recentTransactions,
        };
    }

    // ── Formatting ──

    function formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    }

    function formatDate(dateStr, locale = 'pt-BR') {
        return new Date(dateStr).toLocaleDateString(locale);
    }

    function getMonthName(month, locale = 'pt-BR') {
        return new Date(2024, month - 1).toLocaleDateString(locale, { month: 'long' });
    }

    function todayISO() {
        return new Date().toISOString().split('T')[0];
    }

    return {
        AccountType,
        AccountTypeLabels,
        TransactionType,
        createAccount,
        createCategoryGroup,
        createCategory,
        createTransaction,
        createTransfer,
        createBudgetEntry,
        calcAccountBalance,
        calcAllAccountBalances,
        getTransactionsForMonth,
        calcBudgetSummary,
        calcDashboardKPIs,
        formatCurrency,
        formatDate,
        getMonthName,
        todayISO,
    };
})();
