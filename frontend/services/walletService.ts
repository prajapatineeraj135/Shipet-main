import { apiClient } from "./apiClient";

function buildQueryParams(params: Record<string, any>): string {
  const query = new URLSearchParams(params).toString();
  return query ? `?${query}` : "";
}

type WalletData = any;
type WalletTransactionData = any;

export const walletService = {
  // Get wallet statistics
  async getWalletStats(): Promise<WalletData> {
    try {
      const response = await apiClient.get<WalletData>("/wallet/stats");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch wallet stats:", error);
      throw error; // Let UI handle further if needed
    }
  },

  // Get wallet balance
  async getBalance(): Promise<WalletData> {
    try {
      const response = await apiClient.get<WalletData>("/wallet/balance");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      throw error;
    }
  },

  // Get all wallet transactions (with filters)
  async getTransactions(params = {}): Promise<WalletTransactionData[]> {
    try {
      const query = buildQueryParams(params);
      const response = await apiClient.get<WalletTransactionData[]>(
        `/wallet/transactions${query}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch wallet transactions:", error);
      throw error;
    }
  },

  // Get specific transaction by ID
  async getTransactionById(
    transactionId: string
  ): Promise<WalletTransactionData> {
    try {
      const response = await apiClient.get<WalletTransactionData>(
        `/wallet/transactions/${transactionId}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      throw error;
    }
  },

  // Recharge wallet
  async rechargeWallet(amount: number): Promise<WalletData> {
    try {
      const response = await apiClient.post<WalletData>("/wallet/recharge", {
        amount,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to recharge wallet:", error);
      throw error;
    }
  },

  // Debit wallet
  async debitWallet(payload: any): Promise<WalletData> {
    try {
      const response = await apiClient.post<WalletData>(
        "/wallet/debit",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Failed to debit wallet:", error);
      throw error;
    }
  },

  // Refund to wallet
  async refundToWallet(payload: any): Promise<WalletData> {
    try {
      const response = await apiClient.post<WalletData>(
        "/wallet/refund",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Failed to refund to wallet:", error);
      throw error;
    }
  },

  // Export wallet transactions
  async exportTransactions(
    month: any,
    year: any
  ): Promise<WalletTransactionData> {
    try {
      const response = await apiClient.post<WalletTransactionData>(
        `/wallet/export`,
        { month, year }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to export transactions:", error);
      throw error;
    }
  },

  // Check sufficient balance
  async checkSufficientBalance(requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance();
      return balance.balance >= requiredAmount;
    } catch (error) {
      console.error("Check balance error:", error);
      return false; // safe fallback
    }
  },
};
