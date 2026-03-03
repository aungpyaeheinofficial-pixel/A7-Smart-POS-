
import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { useFinanceStore, useTransactionStore } from '../store';
import {
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp,
  Wallet, Plus, Trash2, X, Search, FileText, Check, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { Expense, Transaction } from '../types';

const CHART_COLORS = ['#0060CE', '#D7000F', '#10B981', '#F59E0B'];

// ─── Zero-dependency CSV Export (opens in Excel) ────────────────────────────
const exportTransactionsToCSV = (transactions: Transaction[], filter: string) => {
  const filtered = transactions.filter(t =>
    filter === 'ALL' ? true : t.type === filter
  );

  const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Payment Method', 'Amount (MMK)'];
  const rows = filtered.map(t => [
    t.id,
    t.date,
    t.type,
    t.category,
    `"${t.description.replace(/"/g, '""')}"`,
    t.paymentMethod || '-',
    t.amount
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const label = filter === 'ALL' ? 'All' : filter === 'INCOME' ? 'Income' : 'Expense';
  a.href = url;
  a.download = `Transactions_${label}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Currency Display Toggle ────────────────────────────────────────────────
type CurrencyMode = 'MMK' | 'M';

const formatCurrency = (amount: number, mode: CurrencyMode): string => {
  if (mode === 'M') {
    return `${(amount / 1_000_000).toFixed(2)} M`;
  }
  return `${amount.toLocaleString()} MMK`;
};

const CurrencyToggle = ({ mode, onChange }: { mode: CurrencyMode; onChange: (m: CurrencyMode) => void }) => (
  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
    {(['MMK', 'M'] as CurrencyMode[]).map((m) => (
      <button
        key={m}
        onClick={() => onChange(m)}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${mode === m
          ? 'bg-white text-slate-800 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
          }`}
      >
        {m === 'MMK' ? 'Ks / MMK' : 'M (Million)'}
      </button>
    ))}
  </div>
);

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, subValue, icon: Icon, type = 'neutral', onClick, isActive }: any) => {
  const styles: any = {
    positive: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    negative: 'bg-rose-50 border-rose-100 text-rose-900',
    neutral: 'bg-white border-slate-200 text-slate-900',
    highlight: 'bg-gradient-to-br from-a7 to-a7-dark text-white border-a7'
  };

  const iconStyles: any = {
    positive: 'bg-emerald-100 text-emerald-600',
    negative: 'bg-rose-100 text-rose-600',
    neutral: 'bg-slate-100 text-slate-600',
    highlight: 'bg-white/20 text-white'
  };

  const isGrowthPositive = subValue?.includes('+');
  const isGrowthNegative = subValue?.includes('-');

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border shadow-sm ${styles[type]} transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${isActive ? 'ring-2 ring-offset-2 ring-a7/50' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className={`text-sm font-medium ${type === 'highlight' ? 'text-white/80' : 'text-slate-500'}`}>{title}</p>
          <h3 className="text-xl font-bold mt-1 break-all leading-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconStyles[type]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className={`text-xs flex items-center gap-1 ${type === 'highlight' ? 'text-white/90' : (isGrowthPositive ? 'text-emerald-600' : isGrowthNegative ? 'text-red-600' : 'text-slate-500')}`}>
        {isGrowthPositive ? <TrendingUp size={12} /> : isGrowthNegative ? <TrendingUp size={12} className="rotate-180" /> : null}
        {subValue}
      </p>
    </div>
  );
};



// ─── Main Component ───────────────────────────────────────────────────────────
const Finance = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'expenses' | 'payables' | 'receivables'>('overview');
  const [transactionFilter, setTransactionFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('MMK');
  const [searchQuery, setSearchQuery] = useState('');

  const { transactions } = useTransactionStore();
  const { expenses, payables, receivables, addExpense, removeExpense, markPayablePaid, markReceivableCollected } = useFinanceStore();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Utilities', amount: 0, date: new Date().toISOString().split('T')[0], description: '', status: 'PENDING'
  });

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    addExpense({
      ...newExpense,
      id: `ex-${Date.now()}`,
      branchId: ''
    } as Expense);
    setIsExpenseModalOpen(false);
    setNewExpense({ category: 'Utilities', amount: 0, date: new Date().toISOString().split('T')[0], description: '', status: 'PENDING' });
  };

  // Tab interaction handlers
  const handleRevenueClick = () => { setActiveTab('transactions'); setTransactionFilter('INCOME'); };
  const handleExpenseClick = () => setActiveTab('expenses');
  const handleProfitClick = () => setActiveTab('overview');
  const handlePayableClick = () => setActiveTab('payables');
  const handleReceivableClick = () => setActiveTab('receivables');

  // Financial Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const isInRange = (dateStr: string, start: Date, end: Date) => {
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    const currentRevenue = transactions
      .filter(t => t.type === 'INCOME' && isInRange(t.date, currentMonthStart, now))
      .reduce((sum, t) => sum + t.amount, 0);
    const prevRevenue = transactions
      .filter(t => t.type === 'INCOME' && isInRange(t.date, prevMonthStart, prevMonthEnd))
      .reduce((sum, t) => sum + t.amount, 0);
    const revenueGrowth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

    const currentExpenses = expenses
      .filter(e => isInRange(e.date, currentMonthStart, now))
      .reduce((sum, e) => sum + e.amount, 0);
    const prevExpenses = expenses
      .filter(e => isInRange(e.date, prevMonthStart, prevMonthEnd))
      .reduce((sum, e) => sum + e.amount, 0);
    const expenseGrowth = prevExpenses === 0 ? 100 : ((currentExpenses - prevExpenses) / prevExpenses) * 100;

    const totalRevenue = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    return { totalRevenue, totalExpenses, netProfit, margin, revenueGrowth: revenueGrowth.toFixed(1), expenseGrowth: expenseGrowth.toFixed(1) };
  }, [transactions, expenses]);

  // Chart Data
  const cashFlowData = [
    { name: 'Week 1', income: 4500000, expense: 2100000 },
    { name: 'Week 2', income: 3800000, expense: 1800000 },
    { name: 'Week 3', income: 5200000, expense: 2400000 },
    { name: 'Week 4', income: 4100000, expense: 1900000 },
  ];
  const paymentMixData = [
    { name: 'Cash', value: 65 },
    { name: 'KBZ Pay', value: 25 },
    { name: 'Wave Money', value: 10 },
  ];

  // Filtered + searched transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = transactionFilter === 'ALL' || t.type === transactionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Finance &amp; Accounting
            <span className="text-base font-normal text-slate-400 font-mm ml-2">ငွေစာရင်းဆိုင်ရာ</span>
          </h1>
          <p className="text-slate-500 text-sm">Financial health overview, expenses, and ledger.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto">
          {['overview', 'transactions', 'expenses', 'payables', 'receivables'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab as any); if (tab === 'transactions') setTransactionFilter('ALL'); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards + Currency Toggle ─── */}
      <div className="space-y-3">
        {/* Currency toggle bar — appears above KPI cards in overview */}
        {activeTab === 'overview' && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Display currency:</span>
            <CurrencyToggle mode={currencyMode} onChange={setCurrencyMode} />
            <span className="text-xs text-slate-400 italic">
              {currencyMode === 'M' ? '1 M = 1,000,000 MMK (Kyats)' : 'Showing full MMK (Kyat) values'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue, currencyMode)}
            subValue={`${Number(stats.revenueGrowth) >= 0 ? '+' : ''}${stats.revenueGrowth}% vs last mo`}
            icon={DollarSign}
            type="positive"
            isActive={activeTab === 'transactions' && transactionFilter === 'INCOME'}
            onClick={handleRevenueClick}
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(stats.totalExpenses, currencyMode)}
            subValue={`${Number(stats.expenseGrowth) >= 0 ? '+' : ''}${stats.expenseGrowth}% vs last mo`}
            icon={Wallet}
            type="negative"
            isActive={activeTab === 'expenses'}
            onClick={handleExpenseClick}
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency(stats.netProfit, currencyMode)}
            subValue={`${stats.margin}% Margin`}
            icon={TrendingUp}
            type="highlight"
            isActive={activeTab === 'overview'}
            onClick={handleProfitClick}
          />
          <KPICard
            title="Accounts Payable"
            value={formatCurrency(payables.reduce((acc, p) => acc + p.amount, 0), currencyMode)}
            subValue={`${payables.length} Invoices`}
            icon={ArrowDownRight}
            type="neutral"
            isActive={activeTab === 'payables'}
            onClick={handlePayableClick}
          />
          <KPICard
            title="Accounts Receivable"
            value={formatCurrency(receivables.reduce((acc, r) => acc + r.amount, 0), currencyMode)}
            subValue={`${receivables.length} Pending`}
            icon={ArrowUpRight}
            type="neutral"
            isActive={activeTab === 'receivables'}
            onClick={handleReceivableClick}
          />
        </div>
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Cash Flow Chart */}
          <Card className="lg:col-span-2 min-h-[400px]" title="Cash Flow (Last 30 Days)">
            <div style={{ width: '100%', height: 320 }} className="mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip
                    formatter={(val: number) => [`${val.toLocaleString()} MMK`, '']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area name="Income" type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area name="Expense" type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  <Legend iconType="circle" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Payment Mix */}
          <Card title="Payment Methods">
            <div style={{ width: '100%', height: 320 }} className="mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={paymentMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TRANSACTIONS TAB ─── */}
      {activeTab === 'transactions' && (
        <Card title="All Transactions" className="animate-in slide-in-from-right-4 duration-300">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTransactionFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${transactionFilter === f
                    ? f === 'ALL' ? 'bg-slate-800 text-white border-slate-800'
                      : f === 'INCOME' ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {f === 'ALL' ? 'All' : f === 'INCOME' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-a7"
                />
              </div>
              {/* ✅ WORKING EXPORT BUTTON */}
              <button
                onClick={() => exportTransactionsToCSV(transactions, transactionFilter)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all duration-200 active:scale-95"
                title="Download as CSV (opens in Excel)"
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount (MMK)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{t.id}</td>
                    <td className="px-6 py-4 text-slate-600">{t.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{t.description}</td>
                    <td className="px-6 py-4"><Badge variant="neutral">{t.category}</Badge></td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">MMK</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-right">
              {filteredTransactions.length} record(s) — click <span className="font-semibold text-emerald-600">Export Excel</span> to download as .xlsx
            </div>
          )}
        </Card>
      )}

      {/* ─── EXPENSES TAB ─── */}
      {activeTab === 'expenses' && (
        <Card
          title="Operational Expenses"
          className="animate-in slide-in-from-right-4 duration-300"
          action={<Button variant="primary" onClick={() => setIsExpenseModalOpen(true)}><Plus size={16} /> Add Expense</Button>}
        >
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount (MMK)</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length > 0 ? expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600">{e.date}</td>
                    <td className="px-6 py-4"><Badge variant="neutral">{e.category}</Badge></td>
                    <td className="px-6 py-4 font-medium text-slate-800">{e.description}</td>
                    <td className="px-6 py-4">
                      <Badge variant={e.status === 'PAID' ? 'success' : 'warning'}>{e.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{e.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">MMK</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeExpense(e.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No expenses recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── PAYABLES TAB ─── */}
      {activeTab === 'payables' && (
        <Card title="Accounts Payable (Suppliers)" className="animate-in slide-in-from-right-4 duration-300">
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount Due</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payables.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{p.invoiceNo}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.supplierName}</td>
                    <td className="px-6 py-4 text-slate-600">{p.dueDate}</td>
                    <td className="px-6 py-4">
                      <Badge variant={p.status === 'OVERDUE' ? 'danger' : p.status === 'DUE_SOON' ? 'warning' : 'neutral'}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{p.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">MMK</span></td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => markPayablePaid(p.id)}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 mx-auto transition-colors"
                      >
                        <Check size={14} /> Mark Paid
                      </button>
                    </td>
                  </tr>
                ))}
                {payables.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No pending payables</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── RECEIVABLES TAB ─── */}
      {activeTab === 'receivables' && (
        <Card title="Accounts Receivable (Customers)" className="animate-in slide-in-from-right-4 duration-300">
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Order Ref</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount Due</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{r.orderId}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{r.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">{r.dueDate}</td>
                    <td className="px-6 py-4">
                      <Badge variant={r.status === 'OVERDUE' ? 'danger' : 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{r.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">MMK</span></td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => markReceivableCollected(r.id)}
                        className="bg-a7/10 text-a7 hover:bg-a7/20 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 mx-auto transition-colors"
                      >
                        <Check size={14} /> Collect
                      </button>
                    </td>
                  </tr>
                ))}
                {receivables.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No pending receivables</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── Add Expense Modal ─── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-800">Record Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <Input value={newExpense.description} onChange={(e: any) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="e.g. Shop Rent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (MMK)</label>
                  <Input type="number" value={newExpense.amount} onChange={(e: any) => setNewExpense({ ...newExpense, amount: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    <option>Utilities</option>
                    <option>Rent</option>
                    <option>Salary</option>
                    <option>Maintenance</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <Input type="date" value={newExpense.date} onChange={(e: any) => setNewExpense({ ...newExpense, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={newExpense.status === 'PAID'} onChange={() => setNewExpense({ ...newExpense, status: 'PAID' })} />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={newExpense.status === 'PENDING'} onChange={() => setNewExpense({ ...newExpense, status: 'PENDING' })} />
                    <span>Pending</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={handleAddExpense}>Save Expense</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
