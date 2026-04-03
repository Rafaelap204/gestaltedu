import { 
  getAdminFinancialSummary, 
  getAdminTransactions, 
  getAdminWithdrawRequests, 
  getWebhookEvents 
} from "@/lib/queries/admin";
import { AdminFinancialClient } from "./AdminFinancialClient";

export default async function AdminFinancialPage() {
  const [summary, transactions, withdrawRequests, webhookEvents] = await Promise.all([
    getAdminFinancialSummary(),
    getAdminTransactions(),
    getAdminWithdrawRequests(),
    getWebhookEvents()
  ]);
  
  return (
    <AdminFinancialClient 
      summary={summary}
      initialTransactions={transactions}
      initialWithdrawRequests={withdrawRequests}
      initialWebhookEvents={webhookEvents}
    />
  );
}
