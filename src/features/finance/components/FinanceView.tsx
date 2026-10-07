import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  FinAccount,
  FinCategory,
  FinTransaction,
  FinBudget,
  SavingsGoal,
  RecurringRule,
} from '../../../db/schema';
import {
  formatMoney,
  formatSignedMoney,
  toMinorUnits,
  CurrencyCode,
} from '../domain/money';
import { summarize } from '../domain/aggregations';
import { budgetUsage } from '../domain/budgets';
import { goalProgress } from '../domain/goals';
import {
  Wallet,
  Building,
  Plus,
  PieChart,
  Target,
  Repeat,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const FinanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'accounts' | 'transactions' | 'budgets' | 'goals' | 'recurring'
  >('overview');

  // Modals state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // Live queries
  const accounts = useLiveQuery(() => db.finAccounts.toArray()) || [];
  const categories = useLiveQuery(() => db.finCategories.toArray()) || [];
  const transactions = useLiveQuery(() => db.finTransactions.orderBy('occurredAt').reverse().toArray()) || [];
  const budgets = useLiveQuery(() => db.finBudgets.toArray()) || [];
  const goals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const recurring = useLiveQuery(() => db.recurringRules.toArray()) || [];

  // Current month date range for overview & budgets
  const now = new Date();
  const monthStartIso = startOfMonth(now).toISOString();
  const monthEndIso = endOfMonth(now).toISOString();

  const currentMonthTransactions = transactions.filter(
    (t) => t.occurredAt >= monthStartIso && t.occurredAt <= monthEndIso
  );

  const summary = summarize(
    currentMonthTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amountMinor: t.amountMinor,
      currency: t.currency,
      categoryId: t.categoryId,
      occurredAt: t.occurredAt,
    })),
    startOfMonth(now),
    endOfMonth(now)
  );

  const totalNetWorthMinor = accounts.reduce((acc, a) => acc + (a.openingBalanceMinor || 0), 0);

  // Forms state
  const [accountForm, setAccountForm] = useState({
    name: '',
    kind: 'bank' as FinAccount['kind'],
    currency: 'INR' as CurrencyCode,
    balance: '0',
  });

  const [transactionForm, setTransactionForm] = useState({
    accountId: '',
    type: 'expense' as FinTransaction['type'],
    amount: '',
    currency: 'INR' as CurrencyCode,
    categoryId: '',
    merchant: '',
    notes: '',
    occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const [budgetForm, setBudgetForm] = useState({
    categoryId: '',
    amount: '',
    periodKind: 'month' as FinBudget['periodKind'],
    currency: 'INR' as CurrencyCode,
  });

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    currency: 'INR' as CurrencyCode,
    targetDate: format(new Date(Date.now() + 180 * 86400000), 'yyyy-MM-dd'),
  });

  // Actions
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name) return;
    const newAccount: FinAccount = {
      id: `acc-${Date.now()}`,
      name: accountForm.name,
      kind: accountForm.kind,
      currency: accountForm.currency,
      openingBalanceMinor: toMinorUnits(parseFloat(accountForm.balance) || 0),
      iconKey: 'wallet',
      isLiability: accountForm.kind === 'credit_card',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.finAccounts.add(newAccount);
    setShowAddAccountModal(false);
    setAccountForm({ name: '', kind: 'bank', currency: 'INR', balance: '0' });
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(transactionForm.amount);
    if (isNaN(amountVal) || amountVal <= 0 || !transactionForm.accountId) return;

    const minor = toMinorUnits(amountVal);
    const newTx: FinTransaction = {
      id: `tx-${Date.now()}`,
      accountId: transactionForm.accountId,
      type: transactionForm.type,
      amountMinor: minor,
      currency: transactionForm.currency,
      categoryId: transactionForm.categoryId || undefined,
      merchant: transactionForm.merchant || undefined,
      notes: transactionForm.notes || undefined,
      tags: [],
      occurredAt: new Date(transactionForm.occurredAt).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.finTransactions.add(newTx);

    // Update account opening balance minor for display
    const acc = await db.finAccounts.get(transactionForm.accountId);
    if (acc) {
      const delta = transactionForm.type === 'income' ? minor : -minor;
      await db.finAccounts.update(acc.id, {
        openingBalanceMinor: acc.openingBalanceMinor + delta,
        updatedAt: new Date().toISOString(),
      });
    }

    setShowAddTransactionModal(false);
    setTransactionForm({
      accountId: accounts[0]?.id || '',
      type: 'expense',
      amount: '',
      currency: 'INR',
      categoryId: '',
      merchant: '',
      notes: '',
      occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitVal = parseFloat(budgetForm.amount);
    if (isNaN(limitVal) || limitVal <= 0 || !budgetForm.categoryId) return;

    const newB: FinBudget = {
      id: `bud-${Date.now()}`,
      categoryId: budgetForm.categoryId,
      periodKind: budgetForm.periodKind,
      limitMinor: toMinorUnits(limitVal),
      currency: budgetForm.currency,
      rollover: false,
      alertAtPercent: [80, 100],
    };
    await db.finBudgets.add(newB);
    setShowAddBudgetModal(false);
    setBudgetForm({ categoryId: '', amount: '', periodKind: 'month', currency: 'INR' });
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(goalForm.targetAmount);
    if (isNaN(targetVal) || targetVal <= 0 || !goalForm.name) return;

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: goalForm.name,
      iconKey: 'target',
      targetMinor: toMinorUnits(targetVal),
      currentMinor: toMinorUnits(parseFloat(goalForm.currentAmount) || 0),
      currency: goalForm.currency,
      targetDate: goalForm.targetDate,
      contributions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.savingsGoals.add(newGoal);
    setShowAddGoalModal(false);
    setGoalForm({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      currency: 'INR',
      targetDate: format(new Date(Date.now() + 180 * 86400000), 'yyyy-MM-dd'),
    });
  };

  const handleDeleteTransaction = async (tx: FinTransaction) => {
    await db.finTransactions.delete(tx.id);
    const acc = await db.finAccounts.get(tx.accountId);
    if (acc) {
      const delta = tx.type === 'income' ? -tx.amountMinor : tx.amountMinor;
      await db.finAccounts.update(acc.id, {
        openingBalanceMinor: acc.openingBalanceMinor + delta,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="view-container" style={{ padding: '1.5rem', color: 'var(--text-primary)' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wallet style={{ color: 'var(--accent-primary)' }} /> Personal Finance & Wealth
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Track accounts, budget allocations, recurring bills, and long-term savings goals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (accounts.length > 0) setTransactionForm((prev) => ({ ...prev, accountId: accounts[0].id }));
              setShowAddTransactionModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)' }}
          >
            <Plus size={18} /> New Transaction
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddAccountModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)' }}
          >
            <Building size={18} /> Add Account
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(13, 34, 26, 0.75)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Net Worth</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8', marginTop: '0.35rem' }}>
            {formatMoney(totalNetWorthMinor, 'INR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across {accounts.length} active account(s)</span>
        </div>

        <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(13, 34, 26, 0.75)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Income</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399', marginTop: '0.35rem' }}>
            {formatMoney(summary.incomeMinor, 'INR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current month</span>
        </div>

        <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(13, 34, 26, 0.75)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Expenses</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F87171', marginTop: '0.35rem' }}>
            {formatMoney(summary.expensesMinor, 'INR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current month</span>
        </div>

        <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(13, 34, 26, 0.75)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Savings Rate</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: summary.savingsRate >= 20 ? '#34D399' : '#FBBF24', marginTop: '0.35rem' }}>
            {summary.savingsRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net: {formatMoney(summary.savingsMinor, 'INR')}</span>
        </div>
      </div>

      {/* Finance Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'accounts', label: 'Accounts', icon: Building },
          { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
          { id: 'budgets', label: 'Budgets', icon: DollarSign },
          { id: 'goals', label: 'Savings Goals', icon: Target },
          { id: 'recurring', label: 'Recurring Rules', icon: Repeat },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Activity */}
          <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No transactions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {transactions.slice(0, 7).map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: t.type === 'income' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: t.type === 'income' ? '#34D399' : '#F87171',
                          }}
                        >
                          {t.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.merchant || cat?.name || 'Uncategorized'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {format(new Date(t.occurredAt), 'MMM dd, HH:mm')} • {cat?.name || 'General'}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: t.type === 'income' ? '#34D399' : t.type === 'expense' ? '#F87171' : 'var(--text-primary)',
                        }}
                      >
                        {formatSignedMoney(t.type === 'expense' ? -t.amountMinor : t.amountMinor, t.currency as CurrencyCode)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Savings Goals Summary */}
          <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Active Savings Goals</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddGoalModal(true)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> New Goal
              </button>
            </div>
            {goals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No savings goals created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {goals.map((g) => {
                  const targetDateObj = g.targetDate ? new Date(g.targetDate) : undefined;
                  const prog = goalProgress(g.currentMinor, g.targetMinor, targetDateObj);
                  return (
                    <div key={g.id} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>{g.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {formatMoney(g.currentMinor, g.currency as CurrencyCode)} / {formatMoney(g.targetMinor, g.currency as CurrencyCode)}
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prog.percent}%`, background: 'linear-gradient(90deg, #34D399, #38BDF8)', borderRadius: '4px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        <span>{prog.percent}% reached</span>
                        <span>Required: {formatMoney(prog.requiredMonthlyMinor, g.currency as CurrencyCode)}/mo</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {accounts.map((acc) => (
              <div key={acc.id} className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{acc.kind}</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.2rem 0' }}>{acc.name}</h3>
                  </div>
                  <Building size={24} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8', marginTop: '1rem' }}>
                  {formatMoney(acc.openingBalanceMinor, acc.currency as CurrencyCode)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Updated {format(new Date(acc.updatedAt), 'MMM dd, yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Transaction History</h3>
            <button className="btn btn-primary" onClick={() => setShowAddTransactionModal(true)}>
              <Plus size={16} /> Add Transaction
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Merchant / Desc</th>
                <th style={{ padding: '0.75rem' }}>Account</th>
                <th style={{ padding: '0.75rem' }}>Amount</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const acc = accounts.find((a) => a.id === t.accountId);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {format(new Date(t.occurredAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: t.type === 'income' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                          color: t.type === 'income' ? '#34D399' : '#F87171',
                        }}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.merchant || t.description || '—'}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{acc?.name || '—'}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: t.type === 'income' ? '#34D399' : '#F87171' }}>
                      {formatSignedMoney(t.type === 'expense' ? -t.amountMinor : t.amountMinor, t.currency as CurrencyCode)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteTransaction(t)}
                        style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. BUDGETS TAB */}
      {activeTab === 'budgets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Category Spending Budgets</h3>
            <button className="btn btn-primary" onClick={() => setShowAddBudgetModal(true)}>
              <Plus size={16} /> Create Budget
            </button>
          </div>
          {budgets.length === 0 ? (
            <div className="liquid-panel" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No monthly budgets defined. Set up spending caps for your expense categories.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {budgets.map((b) => {
                const cat = categories.find((c) => c.id === b.categoryId);
                const spent = currentMonthTransactions
                  .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
                  .reduce((acc, t) => acc + t.amountMinor, 0);

                const usage = budgetUsage(b.limitMinor, spent);
                const color = usage.state === 'ok' ? '#34D399' : usage.state === 'warn' ? '#FBBF24' : '#F87171';

                return (
                  <div key={b.id} className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cat?.name || 'Category'}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {b.periodKind}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color, marginBottom: '0.75rem' }}>
                      {formatMoney(spent, b.currency as CurrencyCode)} / {formatMoney(b.limitMinor, b.currency as CurrencyCode)}
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(usage.percent, 100)}%`, background: color, borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <span>{usage.percent}% used</span>
                      <span>{usage.state === 'over' ? `Over by ${formatMoney(Math.abs(usage.remainingMinor), b.currency as CurrencyCode)}` : `${formatMoney(usage.remainingMinor, b.currency as CurrencyCode)} left`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. GOALS TAB */}
      {activeTab === 'goals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Savings & Investment Goals</h3>
            <button className="btn btn-primary" onClick={() => setShowAddGoalModal(true)}>
              <Plus size={16} /> New Goal
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {goals.map((g) => {
              const targetDateObj = g.targetDate ? new Date(g.targetDate) : undefined;
              const prog = goalProgress(g.currentMinor, g.targetMinor, targetDateObj);
              return (
                <div key={g.id} className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{g.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {g.targetDate}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34D399', marginBottom: '0.75rem' }}>
                    {formatMoney(g.currentMinor, g.currency as CurrencyCode)} / {formatMoney(g.targetMinor, g.currency as CurrencyCode)}
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${prog.percent}%`, background: 'linear-gradient(90deg, #34D399, #38BDF8)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <span>{prog.percent}% completed</span>
                    <span>Monthly target: {formatMoney(prog.requiredMonthlyMinor, g.currency as CurrencyCode)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. RECURRING RULES TAB */}
      {activeTab === 'recurring' && (
        <div className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Subscriptions & Recurring Payments</h3>
          {recurring.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No recurring rules created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recurring.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.description}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Rule: {r.rrule} • Starts: {r.startDate}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F87171' }}>
                    {formatMoney(r.amountMinor, r.currency as CurrencyCode)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="liquid-panel" style={{ width: '400px', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: '#0D221A' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 700 }}>Add Financial Account</h3>
            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account Name</label>
                <input
                  type="text"
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. HDFC Savings Bank"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type</label>
                  <select
                    value={accountForm.kind}
                    onChange={(e) => setAccountForm({ ...accountForm, kind: e.target.value as any })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#0D221A', border: '1px solid var(--border-color)', color: '#FFF' }}
                  >
                    <option value="bank">Bank Account</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="wallet">Digital Wallet</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Currency</label>
                  <select
                    value={accountForm.currency}
                    onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value as any })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#0D221A', border: '1px solid var(--border-color)', color: '#FFF' }}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAccountModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="liquid-panel" style={{ width: '440px', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: '#0D221A' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 700 }}>Record Transaction</h3>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type</label>
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as any })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#0D221A', border: '1px solid var(--border-color)', color: '#FFF' }}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account</label>
                  <select
                    value={transactionForm.accountId}
                    onChange={(e) => setTransactionForm({ ...transactionForm, accountId: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: '#0D221A', border: '1px solid var(--border-color)', color: '#FFF' }}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Merchant / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy, Amazon, Salary"
                  value={transactionForm.merchant}
                  onChange={(e) => setTransactionForm({ ...transactionForm, merchant: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTransactionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
