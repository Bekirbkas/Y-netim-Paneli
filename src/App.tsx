import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Settings, 
  Sun, 
  Moon,
  PlusCircle,
  Pencil,
  Save,
  X,
  Menu,
  LayoutDashboard,
  Receipt,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Resident, IncomeCategory, IncomeRecord, Expense } from './types';

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income_list' | 'income_table' | 'expense_list' | 'expense_table' | 'residents'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number>(1); // Default to 'Aidat'
  const [selectedYear] = useState(2026);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'income' | 'expense', id: number } | null>(null);

  useEffect(() => {
    fetchData();
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
      if (json.categories.length > 0 && !selectedCategory) {
        setSelectedCategory(json.categories[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeUpdate = async (residentId: number, month: number, amount: number, status: 'paid' | 'exempt' | 'pending', categoryId?: number) => {
    try {
      await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: residentId,
          category_id: categoryId || selectedCategory,
          month,
          year: selectedYear,
          amount,
          status
        })
      });
      fetchData();
    } catch (err) {
      console.error('Error updating income:', err);
    }
  };

  const totals = useMemo(() => {
    if (!data) return { income: 0, expenses: 0, balance: 0 };
    const incomeTotal = data.incomeRecords.reduce((sum, rec) => sum + (rec.status === 'paid' ? rec.amount : 0), 0) + data.carryover;
    const expenseTotal = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      income: incomeTotal,
      expenses: expenseTotal,
      balance: incomeTotal - expenseTotal
    };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950 overflow-hidden">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Wallet size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Hasan Apartmanı</h1>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar pr-2">
            <NavItem 
              icon={<LayoutDashboard size={18} />} 
              label="Panel" 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            />
            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gelir Yönetimi</div>
            <NavItem 
              icon={<Plus size={18} />} 
              label="Gelirler" 
              active={activeTab === 'income_list'} 
              onClick={() => { setActiveTab('income_list'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Receipt size={18} />} 
              label="Gelir Çizelgesi" 
              active={activeTab === 'income_table'} 
              onClick={() => { setActiveTab('income_table'); setIsSidebarOpen(false); }} 
            />
            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gider Yönetimi</div>
            <NavItem 
              icon={<TrendingDown size={18} />} 
              label="Giderler" 
              active={activeTab === 'expense_list'} 
              onClick={() => { setActiveTab('expense_list'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Receipt size={18} />} 
              label="Gider Çizelgesi" 
              active={activeTab === 'expense_table'} 
              onClick={() => { setActiveTab('expense_table'); setIsSidebarOpen(false); }} 
            />
            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Yönetim</div>
            <NavItem 
              icon={<Users size={18} />} 
              label="Sakinler" 
              active={activeTab === 'residents'} 
              onClick={() => { setActiveTab('residents'); setIsSidebarOpen(false); }} 
            />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen p-4 md:p-8 w-full max-w-full overflow-x-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-2xl font-bold tracking-tight">
                {activeTab === 'dashboard' && 'Genel Bakış'}
                {activeTab === 'income_list' && 'Gelir Kayıtları'}
                {activeTab === 'income_table' && 'Gelir Çizelgesi'}
                {activeTab === 'expense_list' && 'Gider Kayıtları'}
                {activeTab === 'expense_table' && 'Gider Çizelgesi'}
                {activeTab === 'residents' && 'Apartman Sakinleri'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Hoş geldiniz, yönetici.</p>
            </div>
            {/* Mobile Title */}
            <div className="lg:hidden">
              <h2 className="text-lg font-bold truncate max-w-[150px]">
                {activeTab === 'dashboard' && 'Panel'}
                {activeTab === 'income_list' && 'Gelirler'}
                {activeTab === 'income_table' && 'G. Çizelge'}
                {activeTab === 'expense_list' && 'Giderler'}
                {activeTab === 'expense_table' && 'H. Çizelge'}
                {activeTab === 'residents' && 'Sakinler'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              title={darkMode ? "Aydınlık Mod" : "Karanlık Mod"}
            >
              {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-zinc-600" />}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard data={data} totals={totals} />}
        {activeTab === 'income_list' && (
          <IncomeList 
            data={data} 
            onAdd={() => { setEditingIncome(null); setShowIncomeModal(true); }}
            onEdit={(rec) => { setEditingIncome(rec); setShowIncomeModal(true); }}
          />
        )}
        {activeTab === 'income_table' && (
          <IncomeTable 
            data={data} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory}
            onUpdate={handleIncomeUpdate}
            onAddCategory={() => setShowCategoryModal(true)}
          />
        )}
        {activeTab === 'expense_list' && (
          <ExpenseList 
            expenses={data.expenses} 
            onEdit={(exp) => {
              setEditingExpense(exp);
              setShowExpenseModal(true);
            }}
          />
        )}
        {activeTab === 'expense_table' && (
          <ExpenseTable expenses={data.expenses} />
        )}
        {activeTab === 'residents' && (
          <ResidentList 
            residents={data.residents} 
            onUpdate={async (id, name) => {
              await fetch(`/api/resident/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              fetchData();
            }}
          />
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showIncomeModal && (
          <IncomeModal 
            data={data}
            income={editingIncome}
            onClose={() => { setShowIncomeModal(false); setEditingIncome(null); }}
            onSave={async (payload) => {
              // Update selected category to the one being saved so it reflects in the table
              if (payload.category_id) {
                setSelectedCategory(payload.category_id);
              }
              
              // Handle multiple months if it's a range
              if (payload.months) {
                const amountPerMonth = payload.amount / payload.months.length;
                for (const month of payload.months) {
                  await handleIncomeUpdate(payload.resident_id, month, amountPerMonth, 'paid', payload.category_id);
                }
              } else {
                await handleIncomeUpdate(payload.resident_id, payload.month, payload.amount, payload.status, payload.category_id);
              }
              setShowIncomeModal(false);
              setEditingIncome(null);
            }}
            onAddCategory={() => setShowCategoryModal(true)}
            onDelete={(id) => setShowDeleteConfirm({ type: 'income', id })}
          />
        )}
        {showExpenseModal && (
          <ExpenseModal 
            expense={editingExpense}
            onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }} 
            onSave={async (exp) => {
              const url = editingExpense ? `/api/expense/${editingExpense.id}` : '/api/expense';
              const method = editingExpense ? 'PUT' : 'POST';
              await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exp)
              });
              fetchData();
              setShowExpenseModal(false);
              setEditingExpense(null);
            }} 
            onDelete={(id) => setShowDeleteConfirm({ type: 'expense', id })}
          />
        )}
        {showDeleteConfirm && (
          <DeleteConfirmModal 
            type={showDeleteConfirm.type}
            onClose={() => setShowDeleteConfirm(null)}
            onConfirm={async () => {
              const url = showDeleteConfirm.type === 'expense' 
                ? `/api/expense/${showDeleteConfirm.id}` 
                : `/api/income/${showDeleteConfirm.id}`;
              
              await fetch(url, { method: 'DELETE' });
              fetchData();
              setShowDeleteConfirm(null);
              setShowExpenseModal(false);
              setShowIncomeModal(false);
              setEditingExpense(null);
              setEditingIncome(null);
            }}
          />
        )}
        {showCategoryModal && (
          <CategoryModal 
            onClose={() => setShowCategoryModal(false)} 
            onSave={async (name) => {
              await fetch('/api/income-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              fetchData();
              setShowCategoryModal(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function Dashboard({ data, totals }: { data: AppData, totals: any }) {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Toplam Gelir" 
          value={`₺${totals.income.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-500" />} 
          color="emerald"
        />
        <StatCard 
          title="Toplam Gider" 
          value={`₺${totals.expenses.toLocaleString()}`} 
          icon={<TrendingDown className="text-rose-500" />} 
          color="rose"
        />
        <StatCard 
          title="Kalan Bakiye" 
          value={`₺${totals.balance.toLocaleString()}`} 
          icon={<Wallet className="text-blue-500" />} 
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Expenses */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Son Giderler</h3>
            <button className="text-emerald-500 text-sm font-semibold hover:underline">Tümünü Gör</button>
          </div>
          <div className="space-y-4">
            {data.expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="font-bold text-sm">{exp.description}</p>
                  <p className="text-xs text-zinc-500">{new Date(exp.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <span className="font-bold text-rose-500">-₺{exp.amount.toLocaleString()}</span>
              </div>
            ))}
            {data.expenses.length === 0 && <p className="text-center text-zinc-500 py-4">Henüz gider kaydı yok.</p>}
          </div>
        </div>

        {/* Carryover Info */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Settings size={32} />
          </div>
          <h3 className="text-lg font-bold mb-2">Geçen Yıldan Devir</h3>
          <p className="text-3xl font-black text-blue-500 mb-2">₺{data.carryover.toLocaleString()}</p>
          <p className="text-sm text-zinc-500 max-w-xs">Bu miktar 2025 yılından aktarılan net bakiyedir ve toplam gelire dahil edilmiştir.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
    </motion.div>
  );
}

function IncomeTable({ data, selectedCategory, setSelectedCategory, onUpdate, onAddCategory }: { 
  data: AppData, 
  selectedCategory: number, 
  setSelectedCategory: (id: number) => void,
  onUpdate: (resId: number, month: number, amount: number, status: 'paid' | 'exempt' | 'pending') => void,
  onAddCategory: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar flex-nowrap w-full">
          <div className="flex items-center gap-2 flex-nowrap">
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat.id ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                {cat.name}
              </button>
            ))}
            <button 
              onClick={onAddCategory}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-emerald-500 transition-colors flex-shrink-0"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[40px] md:w-auto">Daire</th>
                <th className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase sticky left-[40px] md:left-[60px] bg-zinc-50 dark:bg-zinc-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[90px] md:w-auto">Sakin</th>
                {MONTHS.map((m) => (
                  <th key={m} className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase text-center min-w-[100px] md:min-w-[100px]">{m}</th>
                ))}
                <th className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase text-right min-w-[80px] md:w-auto">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {data.residents.map((res) => {
                const resRecords = data.incomeRecords.filter(r => r.resident_id === res.id && r.category_id === selectedCategory);
                const total = resRecords.reduce((sum, r) => sum + (r.status === 'paid' ? r.amount : 0), 0);
                
                return (
                  <tr key={res.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-2 md:p-4 font-bold text-xs md:text-sm sticky left-0 bg-white dark:bg-zinc-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{res.apartment_no}</td>
                    <td className="p-2 md:p-4 text-xs md:text-sm font-semibold sticky left-[40px] md:left-[60px] bg-white dark:bg-zinc-900 z-10 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] overflow-hidden text-ellipsis">{res.name}</td>
                    {MONTHS.map((_, idx) => {
                      const monthIdx = idx + 1;
                      const record = resRecords.find(r => r.month === monthIdx);
                      return (
                        <td key={idx} className="p-1 md:p-2 text-center min-w-[100px] md:min-w-[100px]">
                          <IncomeCell 
                            record={record} 
                            onUpdate={(amount, status) => onUpdate(res.id, monthIdx, amount, status)} 
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 md:p-4 text-right font-black text-emerald-500 text-xs md:text-sm">₺{total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IncomeCell({ record, onUpdate }: { record?: IncomeRecord, onUpdate: (amount: number, status: 'paid' | 'exempt' | 'pending') => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(record?.amount?.toString() || '');

  const getStatusColor = () => {
    if (record?.status === 'paid') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (record?.status === 'exempt') return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
    return 'bg-zinc-50 text-zinc-300 dark:bg-zinc-800/20 dark:text-zinc-700';
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 min-w-[80px]">
        <input 
          autoFocus
          type="number" 
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full p-1 text-xs border rounded dark:bg-zinc-800 dark:border-zinc-700"
          placeholder="Tutar"
        />
        <div className="flex gap-1">
          <button onClick={() => { onUpdate(parseFloat(val) || 0, 'paid'); setIsEditing(false); }} className="flex-1 bg-emerald-500 text-white text-[10px] py-1 rounded">Öde</button>
          <button onClick={() => { onUpdate(0, 'exempt'); setIsEditing(false); }} className="flex-1 bg-zinc-500 text-white text-[10px] py-1 rounded">Muaf</button>
          <button onClick={() => setIsEditing(false)} className="p-1 bg-rose-500 text-white rounded"><X size={10} /></button>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsEditing(true)}
      className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${getStatusColor()}`}
    >
      {record?.status === 'paid' ? `₺${record.amount}` : record?.status === 'exempt' ? 'MUAF' : '-'}
    </button>
  );
}

function IncomeList({ data, onAdd, onEdit }: { data: AppData, onAdd: () => void, onEdit: (rec: IncomeRecord) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Gelir Kayıtları</h3>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
        >
          <PlusCircle size={20} />
          Gelir Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.incomeRecords.filter(r => r.status === 'paid').sort((a, b) => b.id - a.id).map((rec) => {
          const resident = data.residents.find(r => r.id === rec.resident_id);
          const category = data.categories.find(c => c.id === rec.category_id);
          return (
            <div key={rec.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 className="font-bold">{resident?.name} - Daire {resident?.apartment_no}</h4>
                  <p className="text-xs text-zinc-500">{category?.name} | {MONTHS[rec.month - 1]} {rec.year}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-lg font-black text-emerald-500">₺{rec.amount.toLocaleString()}</span>
                <button 
                  onClick={() => onEdit(rec)}
                  className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
                >
                  <Pencil size={20} />
                </button>
              </div>
            </div>
          );
        })}
        {data.incomeRecords.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-500 font-medium">Henüz bir gelir kaydı bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpenseList({ expenses, onEdit }: { expenses: Expense[], onEdit: (exp: Expense) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Gider Kayıtları</h3>
        <button 
          onClick={() => onEdit(null as any)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>Gider Ekle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {expenses.map((exp) => (
          <div key={exp.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <h4 className="font-bold">{exp.description}</h4>
                <p className="text-xs text-zinc-500">{new Date(exp.date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-lg font-black text-rose-500">₺{exp.amount.toLocaleString()}</span>
              <button 
                onClick={() => onEdit(exp)}
                className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
              >
                <Pencil size={20} />
              </button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-500 font-medium">Henüz bir gider kaydı bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function IncomeModal({ data, income, onClose, onSave, onAddCategory, onDelete }: { 
  data: AppData, 
  income: IncomeRecord | null, 
  onClose: () => void, 
  onSave: (payload: any) => void,
  onAddCategory: () => void,
  onDelete: (id: number) => void
}) {
  const [residentId, setResidentId] = useState(income?.resident_id?.toString() || '');
  const [categoryId, setCategoryId] = useState(income?.category_id?.toString() || data.categories[0]?.id.toString());
  const [amount, setAmount] = useState(income?.amount?.toString() || '');
  const [month, setMonth] = useState(income?.month || new Date().getMonth() + 1);
  const [endMonth, setEndMonth] = useState(income?.month || new Date().getMonth() + 1);
  const [isRange, setIsRange] = useState(false);

  const selectedCategoryName = data.categories.find(c => c.id.toString() === categoryId)?.name;
  const isAidat = selectedCategoryName === 'Aidat';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">{income ? 'Geliri Düzenle' : 'Yeni Gelir Ekle'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Gelir Sebebi</label>
              <select 
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
              >
                {data.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={onAddCategory}
              className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-emerald-500 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Sakin Seçin</label>
            <select 
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seçiniz...</option>
              {data.residents.map(res => (
                <option key={res.id} value={res.id}>Daire {res.apartment_no} - {res.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tutar (₺)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Ay</label>
              <select 
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {isAidat && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  checked={isRange}
                  onChange={(e) => setIsRange(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Tarih Aralığı Seç (Toplu Ödeme)</span>
              </label>
              
              {isRange && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Başlangıç Ayı</label>
                    <select 
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border-none text-sm"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Bitiş Ayı</label>
                    <select 
                      value={endMonth}
                      onChange={(e) => setEndMonth(parseInt(e.target.value))}
                      className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border-none text-sm"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
          {income && (
            <button 
              onClick={() => onDelete(income.id)}
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <Trash2 size={24} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            İptal
          </button>
          <button 
            onClick={() => {
              const payload: any = {
                resident_id: parseInt(residentId),
                category_id: parseInt(categoryId),
                amount: parseFloat(amount),
                status: 'paid'
              };
              
              if (isAidat && isRange) {
                const months = [];
                for (let i = month; i <= endMonth; i++) months.push(i);
                payload.months = months;
              } else {
                payload.month = month;
              }
              
              onSave(payload);
            }}
            disabled={!residentId || !amount}
            className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {income ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const descriptions = useMemo(() => Array.from(new Set(expenses.map(e => e.description))), [expenses]);
  
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px] md:w-auto">Harcama Nedeni</th>
              {MONTHS.map((m) => (
                <th key={m} className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase text-center min-w-[100px] md:min-w-[100px]">{m}</th>
              ))}
              <th className="p-2 md:p-4 text-[10px] md:text-xs font-bold text-zinc-500 uppercase text-right min-w-[80px] md:w-auto">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {descriptions.map((desc) => {
              const descExpenses = expenses.filter(e => e.description === desc);
              const total = descExpenses.reduce((sum, e) => sum + e.amount, 0);
              
              return (
                <tr key={desc} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-2 md:p-4 text-xs md:text-sm font-semibold sticky left-0 bg-white dark:bg-zinc-900 z-10 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] overflow-hidden text-ellipsis">{desc}</td>
                  {MONTHS.map((_, idx) => {
                    const monthIdx = idx + 1;
                    const monthTotal = descExpenses
                      .filter(e => new Date(e.date).getMonth() + 1 === monthIdx)
                      .reduce((sum, e) => sum + e.amount, 0);
                    
                    return (
                      <td key={idx} className="p-1 md:p-2 text-center text-[10px] md:text-sm font-medium text-rose-500 min-w-[100px] md:min-w-[100px]">
                        {monthTotal > 0 ? `₺${monthTotal.toLocaleString()}` : '-'}
                      </td>
                    );
                  })}
                  <td className="p-2 md:p-4 text-right font-black text-rose-600 text-xs md:text-sm">₺{total.toLocaleString()}</td>
                </tr>
              );
            })}
            {descriptions.length === 0 && (
              <tr>
                <td colSpan={14} className="p-8 text-center text-zinc-500">Gider çizelgesi için veri bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResidentList({ residents, onUpdate }: { residents: Resident[], onUpdate: (id: number, name: string) => Promise<void> }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (res: Resident) => {
    setEditingId(res.id);
    setEditName(res.name);
  };

  const handleSave = async (id: number) => {
    await onUpdate(id, editName);
    setEditingId(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Daire No</th>
            <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Sakin Adı Soyadı</th>
            <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((res) => (
            <tr key={res.id} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="p-4 font-bold">{res.apartment_no}</td>
              <td className="p-4 font-medium">
                {editingId === res.id ? (
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-emerald-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  res.name
                )}
              </td>
              <td className="p-4 text-right">
                {editingId === res.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleSave(res.id)}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleEdit(res)}
                    className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpenseModal({ expense, onClose, onSave, onDelete }: { expense: Expense | null, onClose: () => void, onSave: (exp: any) => void, onDelete: (id: number) => void }) {
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">{expense ? 'Gideri Düzenle' : 'Yeni Gider Ekle'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Açıklama</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Örn: Elektrik Faturası"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tutar (₺)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tarih</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
          {expense && (
            <button 
              onClick={() => onDelete(expense.id)}
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <Trash2 size={24} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            İptal
          </button>
          <button 
            onClick={() => onSave({ description, amount: parseFloat(amount), date })}
            className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {expense ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ onClose, onConfirm, type }: { onClose: () => void, onConfirm: () => void, type: 'income' | 'expense' }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Emin misiniz?</h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            Bu işlem geri alınamaz. Bu {type === 'income' ? 'gelir' : 'gider'} kaydı kalıcı olarak silinecektir.
          </p>
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Vazgeç
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Evet, Sil
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CategoryModal({ onClose, onSave }: { onClose: () => void, onSave: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">Yeni Kategori Ekle</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Kategori Adı</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Örn: Yakıt Gideri"
            autoFocus
          />
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            İptal
          </button>
          <button 
            onClick={() => onSave(name)}
            className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Ekle
          </button>
        </div>
      </motion.div>
    </div>
  );
}
