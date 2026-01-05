/**
 * API Client for Backend Communication
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://167.172.90.182:9000/api/v1';

/**
 * Get stored authentication token
 */
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Set authentication token
 */
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Make API request with authentication
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: 'Request failed', code: 'UNKNOWN_ERROR' },
    }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API Client Methods
 */
export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  getMe: async () => {
    return apiRequest<any>('/auth/me');
  },

  // Products
  getProducts: async () => {
    return apiRequest<any[]>('/products');
  },

  getProduct: async (id: string) => {
    return apiRequest<any>(`/products/${id}`);
  },

  createProduct: async (product: any) => {
    return apiRequest<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  updateProduct: async (id: string, product: any) => {
    return apiRequest<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    });
  },

  deleteProduct: async (id: string) => {
    return apiRequest<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Batches
  getBatches: async (productId: string) => {
    return apiRequest<any[]>(`/products/${productId}/batches`);
  },

  createBatch: async (productId: string, batch: any) => {
    return apiRequest<any>(`/products/${productId}/batches`, {
      method: 'POST',
      body: JSON.stringify(batch),
    });
  },

  // Customers
  getCustomers: async () => {
    return apiRequest<any[]>('/customers');
  },

  getCustomer: async (id: string) => {
    return apiRequest<any>(`/customers/${id}`);
  },

  createCustomer: async (customer: any) => {
    return apiRequest<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  updateCustomer: async (id: string, customer: any) => {
    return apiRequest<any>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customer),
    });
  },

  deleteCustomer: async (id: string) => {
    return apiRequest<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // Branches
  getBranches: async () => {
    return apiRequest<any[]>('/branches');
  },

  getBranch: async (id: string) => {
    return apiRequest<any>(`/branches/${id}`);
  },

  // Transactions
  getTransactions: async (params?: { type?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const queryString = query.toString();
    return apiRequest<any[]>(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  createTransaction: async (transaction: any) => {
    return apiRequest<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  // Expenses
  getExpenses: async () => {
    return apiRequest<any[]>('/expenses');
  },

  createExpense: async (expense: any) => {
    return apiRequest<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  updateExpense: async (id: string, expense: any) => {
    return apiRequest<any>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expense),
    });
  },

  deleteExpense: async (id: string) => {
    return apiRequest<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};

