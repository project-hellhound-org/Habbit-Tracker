import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, FinanceTransaction, FinanceAccount, FinanceBudget, FinanceSavingsGoal } from '../db/schema';
import { Plus, Trash2, Edit3, DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, PiggyBank, PieChart, Tag as TagIcon, CreditCard, Landmark, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const FinanceView: React.FC = () => {
  const accounts = useLiveQuery(() => db.financeAccounts.toArray()) || [];
  const transactions = useLiveQuery(() => db.financeTransactions.toArray()) || [];
  const budgets = useLiveQuery(() => db.financeBudgets.toArray()) || [];
  const savingsGoals = useLiveQuery(() => db.financeSavingsGoals.toArray()) || [];

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'budgets' | 'savings'>('overview');
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly' | 'yearly' | 'all'>('monthly');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<FinanceTransaction | null>(null);

  const [txType, setTxType] = useState<'income' | 'expense' | 'transfer' | 'refund' | 'adjustment'>('expense');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txAccountId, setTxAccountId] = useState('');
  const [txToAccountId, setTxToAccountId] = useState('');
  const [txCategory, setTxCategory] = useState('General');
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [txMerchant, setTxMerchant] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txTagsInput, setTxTagsInput] = useState('');

  // Account Modal
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'cash' | 'bank' | 'upi' | 'credit_card' | 'savings' | 'investment'>('bank');
  const [accBalance, setAccBalance] = useState<number | ''>('');

  // Budget Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budCategory, setBudCategory] = useState('');
  const [budLimit, setBudLimit] = useState<number | ''>('');

  // Savings Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState<number | ''>('');
  const [goalCurrent, setGoalCurrent] = useState<number | ''>('');

  // Handle default account initialization
  const defaultAccountId = accounts.length > 0 ? accounts[0].id : '';

  // Calculate totals derived from transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  const totalAccountBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Quick transaction save
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || typeof txAmount !== 'number' || !txAccountId) return;

    const tags = txTagsInput
      ? txTagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const txData = {
      type: txType,
      amount: txAmount,
      accountId: txAccountId,
      toAccountId: txType === 'transfer' ? txToAccountId : undefined,
      category: txCategory.trim() || 'General',
      date: txDate,
      merchant: txMerchant.trim(),
      description: txDescription.trim(),
      tags,
      createdAt: new Date().toISOString(),
    };

    if (txToEdit) {
      await db.financeTransactions.update(txToEdit.id, txData);
    } else {
      await db.financeTransactions.add({
        id: `tx-${Date.now()}`,
        ...txData,
      });

      // Update account balance
      const account = accounts.find((a) => a.id === txAccountId);
      if (account) {
        let newBal = account.balance;
        if (txType === 'expense') newBal -= txAmount;
        if (txType === 'income') newBal += txAmount;
        if (txType === 'refund') newBal += txAmount;
        if (txType === 'transfer') newBal -= txAmount;
        await db.financeAccounts.update(account.id, { balance: newBal });
      }

      if (txType === 'transfer' && txToAccountId) {
        const toAccount = accounts.find((a) => a.id === txToAccountId);
        if (toAccount) {
          await db.financeAccounts.update(toAccount.id, { balance: toAccount.balance + txAmount });
        }
      }
    }

    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = async (tx: FinanceTransaction) => {
    if (confirm('Delete this transaction?')) {
      await db.financeTransactions.delete(tx.id);
    }
  };

  // Add Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    await db.financeAccounts.add({
      id: `acc-${Date.now()}`,
      name: accName.trim(),
      type: accType,
      balance: typeof accBalance === 'number' ? accBalance : 0,
      currency: 'USD',
      createdAt: new Date().toISOString(),
    });

    setIsAccModalOpen(false);
    setAccName('');
    setAccBalance('');
  };

  // Add Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budCategory.trim() || typeof budLimit !== 'number') return;

    await db.financeBudgets.add({
      id: `bud-${Date.now()}`,
      category: budCategory.trim(),
      amountLimit: budLimit,
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });

    setIsBudgetModalOpen(false);
    setBudCategory('');
    setBudLimit('');
  };

  // Add Savings Goal
  const handleSaveSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || typeof goalTarget !== 'number') return;

    await db.financeSavingsGoals.add({
      id: `sg-${Date.now()}`,
      title: goalTitle.trim(),
      targetAmount: goalTarget,
      currentAmount: typeof goalCurrent === 'number' ? goalCurrent : 0,
    });

    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('');
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Financial Operating Subsystem</h1>
          <p className="view-header-subtitle">
            Track income, expenses, account balances, category budgets, and savings goals with double-entry precision.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setTxToEdit(null);
            setTxAmount('');
            setTxAccountId(defaultAccountId);
            setTxCategory('General');
            setTxMerchant('');
            setTxDescription('');
            setTxTagsInput('');
            setIsTxModalOpen(true);
          }}
        >
          <Plus size={16} /> Record Transaction
        </button>
      </div>

      {/* Primary Financial Overview Stat Cards */}
      <div className="stat-badge-grid">
        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>NET BALANCE</span>
            <Wallet size={18} />
          </div>
          <div className="hero-stat-number">${totalAccountBalance.toLocaleString()}</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Across {accounts.length} active accounts</span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TOTAL INCOME</span>
            <ArrowUpRight size={18} />
          </div>
          <div className="hero-stat-number" style={{ color: '#4ade80' }}>
            +${totalIncome.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Inflow revenue</span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TOTAL EXPENSES</span>
            <ArrowDownLeft size={18} />
          </div>
          <div className="hero-stat-number" style={{ color: '#ef4444' }}>
            -${totalExpenses.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Outflow spending</span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>NET CASH FLOW</span>
            <DollarSign size={18} />
          </div>
          <div className="hero-stat-number" style={{ color: netCashFlow >= 0 ? 'var(--accent-secondary)' : '#ef4444' }}>
            {netCashFlow >= 0 ? `+$${netCashFlow.toLocaleString()}` : `-$${Math.abs(netCashFlow).toLocaleString()}`}
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Net period surplus</span>
        </div>
      </div>

      {/* Finance Module Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'accounts', label: 'Accounts' },
          { id: 'budgets', label: 'Budgets' },
          { id: 'savings', label: 'Savings Goals' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview / Cashflow */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="liquid-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
              Accounts Breakdown
            </h3>
            {accounts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No accounts configured. Switch to Accounts tab to add your bank, cash, or credit accounts.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {accounts.map((acc) => (
                  <div key={acc.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</span>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-secondary)' }}>{acc.type}</span>
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${acc.balance.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions List */}
          <div className="liquid-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
              Recent Cash Flows & Activity
            </h3>
            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No financial transactions logged yet. Click Record Transaction above.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} style={{ color: '#4ade80' }} /> : <ArrowDownLeft size={18} style={{ color: '#ef4444' }} />}
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.merchant || tx.category}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.date} • {tx.category}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: tx.type === 'income' ? '#4ade80' : '#ef4444' }}>
                      {tx.type === 'income' ? `+$${tx.amount.toLocaleString()}` : `-$${tx.amount.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Full Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="liquid-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
            Authoritative Transactions Log
          </h3>
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No transactions found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Type</th>
                    <th style={{ padding: '0.75rem' }}>Category / Merchant</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{tx.date}</td>
                      <td style={{ padding: '0.75rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: tx.type === 'income' ? '#4ade80' : '#ef4444' }}>
                        {tx.type}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tx.merchant ? `${tx.merchant} (${tx.category})` : tx.category}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: tx.type === 'income' ? '#4ade80' : '#ef4444' }}>
                        {tx.type === 'income' ? `+$${tx.amount.toLocaleString()}` : `-$${tx.amount.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button className="btn btn-danger btn-icon" onClick={() => handleDeleteTransaction(tx)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Accounts Management */}
      {activeTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setIsAccModalOpen(true)}>
              <Plus size={16} /> Add Financial Account
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {accounts.map((acc) => (
              <div key={acc.id} className="liquid-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{acc.name}</h4>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(82, 118, 83, 0.2)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    {acc.type}
                  </span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                  ${acc.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Budgets */}
      {activeTab === 'budgets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setIsBudgetModalOpen(true)}>
              <Plus size={16} /> Create Category Budget
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {budgets.map((b) => {
              const spent = transactions
                .filter((t) => t.category.toLowerCase() === b.category.toLowerCase() && t.type === 'expense')
                .reduce((acc, curr) => acc + curr.amount, 0);
              const pct = Math.min(100, Math.round((spent / b.amountLimit) * 100));

              return (
                <div key={b.id} className="liquid-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>{b.category}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.period}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Spent: <strong>${spent.toLocaleString()}</strong></span>
                    <span>Limit: <strong>${b.amountLimit.toLocaleString()}</strong></span>
                  </div>
                  <div className="progress-bar-track" style={{ height: '7px' }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct > 90 ? '#ef4444' : 'var(--accent-primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Savings Goals */}
      {activeTab === 'savings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setIsGoalModalOpen(true)}>
              <Plus size={16} /> Create Savings Goal
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {savingsGoals.map((sg) => {
              const pct = Math.min(100, Math.round((sg.currentAmount / sg.targetAmount) * 100));
              return (
                <div key={sg.id} className="liquid-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>{sg.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Saved: <strong>${sg.currentAmount.toLocaleString()}</strong></span>
                    <span>Target: <strong>${sg.targetAmount.toLocaleString()}</strong></span>
                  </div>
                  <div className="progress-bar-track" style={{ height: '7px' }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Record Transaction Modal */}
      {isTxModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsTxModalOpen(false)}
        >
          <div
            className="liquid-panel"
            style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', background: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>Record Financial Transaction</h3>
            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={txType} onChange={(e) => setTxType(e.target.value as any)}>
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                    <option value="transfer">Transfer</option>
                    <option value="refund">Refund (+)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Account *</label>
                  <select className="form-select" value={txAccountId} onChange={(e) => setTxAccountId(e.target.value)}>
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Food, Salary, Subscriptions..."
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Merchant / Payee</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Amazon, Employer, Grocery..."
                    value={txMerchant}
                    onChange={(e) => setTxMerchant(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional details..."
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTxModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setIsAccModalOpen(false)}>
          <div className="liquid-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--bg-secondary)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>Add Financial Account</h3>
            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Account Name *</label>
                <input type="text" className="form-input" required placeholder="e.g. Chase Checking, HDFC Bank, Cash..." value={accName} onChange={(e) => setAccName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type *</label>
                <select className="form-select" value={accType} onChange={(e) => setAccType(e.target.value as any)}>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI Wallet</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="savings">Savings Account</option>
                  <option value="investment">Investment Portfolio</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Balance ($) *</label>
                <input type="number" step="0.01" className="form-input" required placeholder="0.00" value={accBalance} onChange={(e) => setAccBalance(e.target.value ? parseFloat(e.target.value) : '')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAccModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setIsBudgetModalOpen(false)}>
          <div className="liquid-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--bg-secondary)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>Create Category Budget</h3>
            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input type="text" className="form-input" required placeholder="e.g. Dining, Shopping, Subscriptions..." value={budCategory} onChange={(e) => setBudCategory(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Limit ($) *</label>
                <input type="number" step="0.01" className="form-input" required placeholder="500.00" value={budLimit} onChange={(e) => setBudLimit(e.target.value ? parseFloat(e.target.value) : '')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBudgetModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Savings Goal Modal */}
      {isGoalModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setIsGoalModalOpen(false)}>
          <div className="liquid-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--bg-secondary)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>Create Savings Goal</h3>
            <form onSubmit={handleSaveSavingsGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input type="text" className="form-input" required placeholder="e.g. Emergency Fund, Laptop Upgrade..." value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Target Amount ($) *</label>
                <input type="number" step="0.01" className="form-input" required placeholder="1000.00" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value ? parseFloat(e.target.value) : '')} />
              </div>
              <div className="form-group">
                <label className="form-label">Currently Saved ($)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value ? parseFloat(e.target.value) : '')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsGoalModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
