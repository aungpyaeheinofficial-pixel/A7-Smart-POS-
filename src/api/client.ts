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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      // Handle Zod validation errors with details
      if (error.error?.code === 'VALIDATION_ERROR' && error.error?.details) {
        const details = error.error.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
        errorMessage = `Validation failed: ${details}`;
      } else {
        errorMessage = error.error?.message || error.message || errorMessage;
      }
      console.error('API Error:', {
        url,
        status: response.status,
        error: error.error || error,
      });
    } catch (e) {
      // If response is not JSON, try to get text
      try {
        const text = await response.text();
        console.error('API Error (non-JSON):', {
          url,
          status: response.status,
          text,
        });
        errorMessage = text || errorMessage;
      } catch (textError) {
        console.error('API Error (no body):', {
          url,
          status: response.status,
        });
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Please check if the backend is running and CORS is configured correctly.`);
    }
    throw error;
  }
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
    // Filter out fields that shouldn't be sent to backend
    const { batches, id, branchId, createdAt, updatedAt, ...createData } = product;
    
    // Ensure price is a number
    if (createData.price !== undefined) {
      createData.price = Number(createData.price);
    }
    
    // Ensure stockLevel and minStockLevel are integers
    if (createData.stockLevel !== undefined) {
      createData.stockLevel = Math.floor(Number(createData.stockLevel));
    }
    if (createData.minStockLevel !== undefined) {
      createData.minStockLevel = Math.floor(Number(createData.minStockLevel));
    }
    
    // Handle empty image string
    if (createData.image === '') {
      createData.image = undefined;
    }
    
    return apiRequest<any>('/products', {
      method: 'POST',
      body: JSON.stringify(createData),
    });
  },

  updateProduct: async (id: string, product: any) => {
    // Filter out fields that shouldn't be sent to backend
    const { batches, branchId, createdAt, updatedAt, ...updateData } = product;
    
    // Ensure price is a number
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }
    
    // Ensure stockLevel and minStockLevel are integers
    if (updateData.stockLevel !== undefined) {
      updateData.stockLevel = Math.floor(Number(updateData.stockLevel));
    }
    if (updateData.minStockLevel !== undefined) {
      updateData.minStockLevel = Math.floor(Number(updateData.minStockLevel));
    }
    
    return apiRequest<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
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

