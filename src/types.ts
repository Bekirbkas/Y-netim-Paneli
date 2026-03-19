export interface Resident {
  id: number;
  apartment_no: string;
  name: string;
}

export interface IncomeCategory {
  id: number;
  name: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface IncomeRecord {
  id: number;
  resident_id: number;
  category_id: number;
  month: number;
  year: number;
  amount: number;
  status: 'paid' | 'exempt' | 'pending';
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
}

export interface AppData {
  residents: Resident[];
  categories: IncomeCategory[];
  expenseCategories: ExpenseCategory[];
  incomeRecords: IncomeRecord[];
  expenses: Expense[];
  carryover: number;
}
