
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, Filter, RefreshCw, ShoppingCart, Activity, Package, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { useProductStore, useTransactionStore, useCustomerStore, useDistributionStore } from '../store';
import { Transaction, DistributionOrder } from '../types';
import { 
  format, subDays, startOfDay, endOfDay, differenceInDays, 
  startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, isWithinInterval, addMonths, subMonths, getDay,
  startOfYear, endOfYear, setMonth, setYear, addYears, subYears, getYear
} from 'date-fns';

interface DashboardMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  lowStockCount: number;
  totalCustomers: number;
  recentTransactions: Transaction[];
  chartData: any[];
  categoryData: any[];
}

// --- Custom Date Picker Component ---
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const CustomDateRangePicker = ({ 
  selected, 
  onSelect, 
  onCancel,
  onApply
}: { 
  selected: DateRange | undefined, 
  onSelect: (range: DateRange | undefined) => void,
  onCancel: () => void,
  onApply: () => void
}) => {
  const [mode, setMode] = useState<'days' | 'month' | 'year'>('days');
  const [viewDate, setViewDate] = useState(new Date()); // Controls the calendar view
  
  // Initialize view with currently selected date or today
  useEffect(() => {
    if (selected?.from) {
      setViewDate(selected.from);
    }
  }, []);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // --- DAYS LOGIC ---
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(viewDate),
      end: endOfMonth(viewDate),
    });
  }, [viewDate]);

  const startDay = getDay(startOfMonth(viewDate));

  const handleDayClick = (day: Date) => {
    if (!selected?.from || (selected.from && selected.to)) {
      onSelect({ from: day, to: undefined });
    } else {
      let newRange = { from: selected.from, to: day };
      if (day < selected.from) {
        newRange = { from: day, to: selected.from };
      }
      onSelect(newRange);
    }
  };

  // --- MONTH LOGIC ---
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleMonthClick = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex);
    const range = {
      from: startOfMonth(newDate),
      to: endOfMonth(newDate)
    };
    onSelect(range);
    setViewDate(newDate); // Update view to reflect year
  };

  // --- YEAR LOGIC ---
  const years = useMemo(() => {
    const currentYear = getYear(viewDate);
    const startYear = currentYear - 5;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [viewDate]);

  const handleYearClick = (year: number) => {
    const newDate = setYear(viewDate, year);
    const range = {
      from: startOfYear(newDate),
      to: endOfYear(newDate)
    };
    onSelect(range);
    setViewDate(newDate);
  };

  // --- NAVIGATION ---
  const handlePrev = () => {
    if (mode === 'days') setViewDate(subMonths(viewDate, 1));
    if (mode === 'month') setViewDate(subYears(viewDate, 1));
    if (mode === 'year') setViewDate(subYears(viewDate, 12));
  };

  const handleNext = () => {
    if (mode === 'days') setViewDate(addMonths(viewDate, 1));
    if (mode === 'month') setViewDate(addYears(viewDate, 1));
    if (mode === 'year') setViewDate(addYears(viewDate, 12));
  };

  // --- RENDER HELPERS ---
  const isSelectedDay = (day: Date) => {
    if (!selected?.from) return false;
    if (isSameDay(day, selected.from)) return true;
    if (selected.to && isSameDay(day, selected.to)) return true;
    return false;
  };

  const isInRangeDay = (day: Date) => {
    if (selected?.from && selected?.to) {
      return isWithinInterval(day, { start: selected.from, end: selected.to });
    }
    return false;
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 w-[320px] animate-in fade-in zoom-in-95 duration-200 flex flex-col">
      {/* Mode Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
        {(['days', 'month', 'year'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-lg transition-all ${
              mode === m 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-slate-800 text-sm">
          {mode === 'days' && format(viewDate, 'MMMM yyyy')}
          {mode === 'month' && format(viewDate, 'yyyy')}
          {mode === 'year' && `${years[0]} - ${years[years.length-1]}`}
        </span>
        <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid Content */}
      <div className="min-h-[240px]">
        {/* DAYS VIEW */}
        {mode === 'days' && (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const isSel = isSelectedDay(day);
              const inRange = isInRangeDay(day);
              const isRangeStart = selected?.from && isSameDay(day, selected.from);
              const isRangeEnd = selected?.to && isSameDay(day, selected.to);

              let bgClass = "hover:bg-slate-100 text-slate-700";
              if (isSel) bgClass = "bg-parami-500 text-white shadow-md shadow-parami-200 z-10";
              else if (inRange) bgClass = "bg-parami-50 text-parami-700";

              let roundedClass = "rounded-lg";
              if (inRange && !isSel) roundedClass = "rounded-none";
              if (isRangeStart && selected?.to) roundedClass = "rounded-l-lg rounded-r-none";
              if (isRangeEnd && selected?.from) roundedClass = "rounded-r-lg rounded-l-none";

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`h-8 w-full text-xs font-medium transition-all relative ${bgClass} ${roundedClass}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW */}
        {mode === 'month' && (
          <div className="grid grid-cols-3 gap-3">
            {months.map((m, idx) => {
              // Check if this month is selected (rough check based on start date)
              const isSelected = selected?.from && getYear(selected.from) === getYear(viewDate) && selected.from.getMonth() === idx && selected.to && selected.to.getMonth() === idx;
              
              return (
                <button
                  key={m}
                  onClick={() => handleMonthClick(idx)}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all ${
                    isSelected 
                    ? 'bg-parami-500 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}

        {/* YEAR VIEW */}
        {mode === 'year' && (
          <div className="grid grid-cols-3 gap-3">
            {years.map((y) => {
              const isSelected = selected?.from && getYear(selected.from) === y && selected?.to && getYear(selected.to) === y;
              
              return (
                <button
                  key={y}
                  onClick={() => handleYearClick(y)}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all ${
                    isSelected 
                    ? 'bg-parami-500 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
        <Button variant="ghost" className="text-xs h-8 px-3" onClick={onCancel}>Cancel</Button>
        <Button 
          variant="primary" 
          className="text-xs h-8 px-4 bg-parami-600 hover:bg-parami-700 shadow-lg shadow-parami-500/20"
          onClick={onApply}
          disabled={!selected?.from}
        >
          Apply Range
        </Button>
      </div>
    </div>
  );
};

// Helpers for Date Management
const getDateRange = (filter: 'Today' | 'Week' | 'Month' | 'Year' | 'Custom', customRange?: DateRange) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  
  // Previous period for trend calculation
  let prevStart = new Date(now);
  let prevEnd = new Date(now);

  // Default end of day for 'end'
  end.setHours(23, 59, 59, 999);

  if (filter === 'Today') {
    start.setHours(0, 0, 0, 0);
    
    // Previous: Yesterday
    prevStart.setDate(now.getDate() - 1);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setDate(now.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
  } else if (filter === 'Week') {
    // Start of current week (Sunday)
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    
    // Previous: Week before
    prevStart.setDate(start.getDate() - 7);
    prevEnd.setDate(start.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
  } else if (filter === 'Month') {
    // Start of current month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    
    // Previous: Month before
    prevStart.setMonth(now.getMonth() - 1);
    prevStart.setDate(1);
    prevEnd.setDate(0); // Last day of prev month
    prevEnd.setHours(23, 59, 59, 999);
  } else if (filter === 'Year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    
    prevStart.setFullYear(now.getFullYear() - 1);
    prevStart.setMonth(0, 1);
    prevEnd.setFullYear(now.getFullYear() - 1);
    prevEnd.setMonth(11, 31);
    prevEnd.setHours(23, 59, 59, 999);
  } else if (filter === 'Custom' && customRange?.from) {
    start = startOfDay(customRange.from);
    end = endOfDay(customRange.to || customRange.from);

    const diffDays = differenceInDays(end, start) + 1;
    
    prevEnd = subDays(start, 1);
    prevEnd = endOfDay(prevEnd);
    
    prevStart = subDays(start, diffDays);
    prevStart = startOfDay(prevStart);
  }

  return { start, end, prevStart, prevEnd };
};

const COLORS = ['#3B82F6', '#D7000F', '#10B981', '#F59E0B', '#8B5CF6'];

const StatCard = ({ title, value, subValue, trend, trendValue, icon: Icon, colorClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover border border-slate-200/60 group transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-').replace('100', '600')} />
      </div>
      {trendValue && (
          <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {trend === 'up' ? <ArrowUpRight size={10} className="mr-0.5"/> : <ArrowDownRight size={10} className="mr-0.5"/>}
              {trendValue}
          </span>
      )}
    </div>
    
    <div>
      <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase text-[10px]">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-1.5 font-medium">{subValue}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Connect to Real Stores
  const { products } = useProductStore();
  const { customers } = useCustomerStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { orders } = useDistributionStore();
  
  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions().catch(console.error);
  }, []);

  const [filterType, setFilterType] = useState<'Today' | 'Week' | 'Month' | 'Year' | 'Custom'>('Month');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Custom Date Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [tempCustomRange, setTempCustomRange] = useState<DateRange | undefined>(); // For inside the popover
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    revenueGrowth: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    recentTransactions: [],
    chartData: [],
    categoryData: []
  });

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const handleApplyCustomDate = () => {
    if (tempCustomRange?.from) {
      setCustomRange(tempCustomRange);
      setFilterType('Custom');
      setIsDatePickerOpen(false);
    }
  };

  const calculateMetrics = () => {
    setLoading(true);

    // Simulate Network Latency for "Real API" feel
    setTimeout(() => {
        const { start, end, prevStart, prevEnd } = getDateRange(filterType, customRange);
        
        // 1. Filter Transactions (POS & General Income)
        const currentTrans = transactions.filter(t => {
            const d = new Date(t.date);
            return t.type === 'INCOME' && d >= start && d <= end;
        });
        const prevTrans = transactions.filter(t => {
            const d = new Date(t.date);
            return t.type === 'INCOME' && d >= prevStart && d <= prevEnd;
        });

        // 2. Filter Distribution Orders (Delivered/Paid)
        const isCompletedOrder = (status: string) => ['DELIVERED', 'COMPLETED'].includes(status);
        
        const currentOrders = orders.filter(o => {
            const d = new Date(o.date);
            return isCompletedOrder(o.status) && d >= start && d <= end;
        });
        const prevOrders = orders.filter(o => {
            const d = new Date(o.date);
            return isCompletedOrder(o.status) && d >= prevStart && d <= prevEnd;
        });

        // 3. Calculate Totals
        const transRevenue = currentTrans.reduce((sum, t) => sum + t.amount, 0);
        const orderRevenue = currentOrders.reduce((sum, o) => sum + o.total, 0);
        const totalRevenue = transRevenue + orderRevenue;

        const prevTransRev = prevTrans.reduce((sum, t) => sum + t.amount, 0);
        const prevOrderRev = prevOrders.reduce((sum, o) => sum + o.total, 0);
        const prevTotalRevenue = prevTransRev + prevOrderRev;

        // 4. Trend Calculation
        const growth = prevTotalRevenue === 0 
            ? 100 
            : ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;

        // 5. Low Stock Logic
        // Default minStockLevel to 10 if undefined
        const lowStock = products.filter(p => p.stockLevel <= (p.minStockLevel || 10)).length;

        // 6. Total Customers
        const totalCust = customers.length;

        // 7. Chart Data Aggregation
        const chartMap = new Map<string, number>();
        // Determine label format based on range duration
        const diffDays = differenceInDays(end, start);
        let labelFormat = 'day';
        if (filterType === 'Today') labelFormat = 'hour';
        if (filterType === 'Year' || diffDays > 60) labelFormat = 'month';
        
        // Helper to populate chart keys
        const addToChart = (dateStr: string, amount: number) => {
            const date = new Date(dateStr);
            let key = '';
            
            if (labelFormat === 'hour') {
                key = date.getHours() + ':00';
            } else if (labelFormat === 'month') {
                key = date.toLocaleString('default', { month: 'short' });
            } else {
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            
            chartMap.set(key, (chartMap.get(key) || 0) + amount);
        };

        currentTrans.forEach(t => addToChart(t.date, t.amount));
        currentOrders.forEach(o => addToChart(o.date, o.total));

        // Convert map to array and sort
        const chartData = Array.from(chartMap, ([name, revenue]) => ({ name, revenue }));
        // Simple sort logic (imperfect for strings but sufficient for simple dates)
        // For production, would sort by underlying timestamp
        
        // 8. Top Categories Logic
        const categoryMap = new Map<string, number>();
        
        // From Transactions (POS usually logs as 'Sales' or specific category)
        currentTrans.forEach(t => {
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        });
        
        // From Distribution (Analyze Items)
        currentOrders.forEach(o => {
            o.itemsList.forEach(item => {
                // Try to find product category from name since DistItem doesn't store category
                const product = products.find(p => p.nameEn === item.name);
                const cat = product?.category || 'Wholesale';
                const amount = item.price * item.quantity;
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
            });
        });

        const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Update State
        setMetrics({
            totalRevenue,
            revenueGrowth: growth,
            lowStockCount: lowStock,
            totalCustomers: totalCust,
            recentTransactions: [...currentTrans].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
            chartData,
            categoryData
        });

        setLastUpdated(new Date());
        setLoading(false);
    }, 600);
  };

  // Re-calculate when filter or data changes
  useEffect(() => {
      calculateMetrics();
  }, [filterType, customRange, transactions, orders, products, customers]);


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm flex items-center gap-2 font-medium mt-1">
            Real-time business analytics
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
               Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 z-20">
           <div className="flex bg-slate-100/80 p-1 rounded-xl">
              {(['Today', 'Week', 'Month', 'Year'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    filterType === type 
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {type}
                </button>
              ))}
           </div>
           
           <div className="h-6 w-[1px] bg-slate-200 hidden md:block mx-1"></div>

           {/* Custom Date Picker Button & Popover */}
           <div className="relative" ref={datePickerRef}>
              <button
                 onClick={() => {
                   setTempCustomRange(customRange); // Reset temp to current applied
                   setIsDatePickerOpen(!isDatePickerOpen);
                 }}
                 className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                    filterType === 'Custom' || isDatePickerOpen
                    ? 'bg-parami-50 text-parami-600 border-parami-200 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                 }`}
              >
                 <Calendar size={14} />
                 {filterType === 'Custom' && customRange?.from ? (
                    <span>
                      {format(customRange.from, 'MMM d, yyyy')} 
                      {customRange.to && !isSameDay(customRange.from, customRange.to) && ` - ${format(customRange.to, 'MMM d, yyyy')}`}
                    </span>
                 ) : (
                    <span>Custom</span>
                 )}
              </button>

              {/* Popover */}
              {isDatePickerOpen && (
                 <div className="absolute top-full right-0 mt-2 z-50">
                    <CustomDateRangePicker 
                      selected={tempCustomRange} 
                      onSelect={setTempCustomRange}
                      onCancel={() => setIsDatePickerOpen(false)}
                      onApply={handleApplyCustomDate}
                    />
                 </div>
              )}
           </div>

           <Button variant="outline" onClick={calculateMetrics} disabled={loading} className="px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm text-slate-600 ml-1">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
           </Button>
        </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>)}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`${metrics.totalRevenue.toLocaleString()} MMK`} 
            subValue={`Based on ${filterType === 'Custom' ? 'Selected Range' : filterType} Sales`}
            trend={metrics.revenueGrowth >= 0 ? 'up' : 'down'} 
            trendValue={`${Math.abs(metrics.revenueGrowth).toFixed(1)}%`} 
            icon={TrendingUp} 
            colorClass="bg-emerald-100" 
            onClick={() => navigate('/finance')}
          />
          <StatCard 
            title="Low Stock Items" 
            value={metrics.lowStockCount} 
            subValue="Stock <= Min Level"
            trend="down" 
            icon={AlertTriangle} 
            colorClass="bg-amber-100"
            onClick={() => navigate('/inventory?filter=low_stock')}
          />
          <StatCard 
            title="Total Customers" 
            value={metrics.totalCustomers.toLocaleString()} 
            subValue="Registered Members"
            trend="up" 
            icon={Users} 
            colorClass="bg-purple-100" 
            onClick={() => navigate('/customers')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Revenue Analytics">
          <div className="h-[320px] w-full mt-4">
            {metrics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} tickFormatter={(value) => `${value/1000}k`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} MMK`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    itemStyle={{ color: '#3B82F6', fontWeight: 600, fontSize: '12px' }}
                    labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}
                    cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                  <Activity size={32} className="opacity-20 mb-2" />
                  <p>No revenue data for {filterType}</p>
               </div>
            )}
          </div>
        </Card>

        <Card title="Top Sales Categories">
          <div className="mt-4 h-[320px]">
            {metrics.categoryData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={metrics.categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', radius: 4}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Sales']}
                    />
                    <Bar dataKey="value" barSize={24} radius={[0, 6, 6, 0]}>
                      {metrics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                  <ShoppingCart size={32} className="opacity-20 mb-2" />
                  <p>No category data available</p>
               </div>
            )}
          </div>
        </Card>
      </div>
      
      <Card title="Recent Transactions (Last 5)" className="overflow-hidden border border-slate-200/60 shadow-card">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
               <tr>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Transaction ID</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Description</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Date</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Amount</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Category</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {metrics.recentTransactions.length > 0 ? (
                 metrics.recentTransactions.map((t) => (
                   <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                     <td className="px-6 py-4 font-mono text-slate-500 text-xs font-medium group-hover:text-slate-800 transition-colors">#{t.id}</td>
                     <td className="px-6 py-4 font-semibold text-slate-700">{t.description}</td>
                     <td className="px-6 py-4 text-slate-500 text-xs font-medium">{t.date}</td>
                     <td className={`px-6 py-4 font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                       {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-sm font-normal text-slate-400 ml-0.5">MMK</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                         {t.category}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button className="text-slate-400 hover:text-blue-600 text-xs font-bold hover:underline transition-colors">View</button>
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                       <div className="flex flex-col items-center justify-center">
                          <Activity size={40} className="opacity-10 mb-2" />
                          <p>No recent transactions found.</p>
                       </div>
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
         <div className="p-4 border-t border-slate-50 text-center bg-slate-50/50">
            <Button variant="ghost" onClick={() => navigate('/finance')} className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide">View All Transactions</Button>
         </div>
      </Card>
    </div>
  );
};

export default Dashboard;
