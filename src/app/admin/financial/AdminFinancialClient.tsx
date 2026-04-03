"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/admin/DataTable";
import { 
  approveWithdrawAction, 
  rejectWithdrawAction 
} from "@/lib/actions/admin";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";

// Format currency to Brazilian Real
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format date to Brazilian format
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface Summary {
  totalGMV: number;
  platformRevenue: number;
  pendingPayouts: number;
  failedWebhooks: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  profiles?: { name: string };
  description?: string;
}

interface WithdrawRequest {
  id: string;
  teacher_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  notes?: string;
  created_at: string;
  profiles?: { name: string; email?: string };
}

interface WebhookEvent {
  id: string;
  event_type: string;
  provider: string;
  processed_at: string | null;
  created_at: string;
}

interface AdminFinancialClientProps {
  summary: Summary;
  initialTransactions: Transaction[];
  initialWithdrawRequests: WithdrawRequest[];
  initialWebhookEvents: WebhookEvent[];
}

export function AdminFinancialClient({
  summary,
  initialTransactions,
  initialWithdrawRequests,
  initialWebhookEvents
}: AdminFinancialClientProps) {
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(initialWithdrawRequests);
  const [webhookEvents] = useState<WebhookEvent[]>(initialWebhookEvents);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  
  // Modal states
  const [selectedWithdraw, setSelectedWithdraw] = useState<WithdrawRequest | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    return transactionTypeFilter === "all" || t.type === transactionTypeFilter;
  });

  // Handle approve withdraw
  const handleApproveWithdraw = async () => {
    if (!selectedWithdraw) return;
    
    startTransition(async () => {
      const result = await approveWithdrawAction(selectedWithdraw.id);
      if ('success' in result) {
        setWithdrawRequests(withdrawRequests.map(w => 
          w.id === selectedWithdraw.id ? { ...w, status: 'completed' } : w
        ));
        setIsApproveModalOpen(false);
        setSelectedWithdraw(null);
      }
    });
  };

  // Handle reject withdraw
  const handleRejectWithdraw = async () => {
    if (!selectedWithdraw) return;
    
    startTransition(async () => {
      const result = await rejectWithdrawAction(selectedWithdraw.id);
      if ('success' in result) {
        setWithdrawRequests(withdrawRequests.map(w => 
          w.id === selectedWithdraw.id ? { ...w, status: 'rejected' } : w
        ));
        setIsRejectModalOpen(false);
        setSelectedWithdraw(null);
      }
    });
  };

  // Get transaction type badge
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return <Badge variant="success">Venda</Badge>;
      case 'payout':
        return <Badge variant="info">Pagamento</Badge>;
      case 'commission':
        return <Badge variant="warning">Comissão</Badge>;
      case 'refund':
        return <Badge variant="error">Reembolso</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge variant="success">Concluído</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'failed':
      case 'rejected':
        return <Badge variant="error">Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Open approve modal
  const openApproveModal = (withdraw: WithdrawRequest) => {
    setSelectedWithdraw(withdraw);
    setIsApproveModalOpen(true);
  };

  // Open reject modal
  const openRejectModal = (withdraw: WithdrawRequest) => {
    setSelectedWithdraw(withdraw);
    setIsRejectModalOpen(true);
  };

  // Transaction columns
  const transactionColumns = [
    {
      key: 'type',
      header: 'Tipo',
      render: (t: Transaction) => getTransactionTypeBadge(t.type),
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (t: Transaction) => (
        <span className="font-semibold text-brand-gray-900">
          {formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Usuário',
      render: (t: Transaction) => t.profiles?.name || 'Sistema',
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Transaction) => getStatusBadge(t.status),
    },
    {
      key: 'date',
      header: 'Data',
      render: (t: Transaction) => formatDate(t.created_at),
    },
  ];

  // Withdraw columns
  const withdrawColumns = [
    {
      key: 'teacher',
      header: 'Professor',
      render: (w: WithdrawRequest) => (
        <div>
          <p className="font-medium text-brand-gray-900">{w.profiles?.name || 'Desconhecido'}</p>
          <p className="text-xs text-brand-gray-500">{w.profiles?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (w: WithdrawRequest) => (
        <span className="font-semibold text-brand-gray-900">
          {formatCurrency(w.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w: WithdrawRequest) => getStatusBadge(w.status),
    },
    {
      key: 'date',
      header: 'Solicitado em',
      render: (w: WithdrawRequest) => formatDate(w.created_at),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (w: WithdrawRequest) => (
        w.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openApproveModal(w)}
              disabled={isPending}
              className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
              title="Aprovar saque"
            >
              <CheckCircle size={16} />
            </button>
            <button
              onClick={() => openRejectModal(w)}
              disabled={isPending}
              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
              title="Rejeitar saque"
            >
              <XCircle size={16} />
            </button>
          </div>
        ) : (
          <span className="text-brand-gray-400 text-sm">-</span>
        )
      ),
    },
  ];

  // Webhook columns
  const webhookColumns = [
    {
      key: 'event_type',
      header: 'Evento',
      render: (w: WebhookEvent) => (
        <span className="font-mono text-sm">{w.event_type}</span>
      ),
    },
    {
      key: 'provider',
      header: 'Provedor',
      render: (w: WebhookEvent) => <Badge variant="default">{w.provider}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (w: WebhookEvent) => (
        w.processed_at ? (
          <Badge variant="success">Processado</Badge>
        ) : (
          <Badge variant="warning">Pendente</Badge>
        )
      ),
    },
    {
      key: 'date',
      header: 'Recebido em',
      render: (w: WebhookEvent) => formatDate(w.created_at),
    },
  ];

  const transactionTypeOptions = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'sale', label: 'Venda' },
    { value: 'payout', label: 'Pagamento' },
    { value: 'commission', label: 'Comissão' },
    { value: 'refund', label: 'Reembolso' },
  ];

  // Pending withdraws count
  const pendingWithdraws = withdrawRequests.filter(w => w.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Financeiro</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Gestão financeira da plataforma
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-brand-gray-500">GMV Total</p>
                <p className="text-2xl font-bold text-brand-gray-900">{formatCurrency(summary.totalGMV)}</p>
              </div>
              <div className="p-3 bg-brand-orange-light rounded-lg">
                <DollarSign size={20} className="text-brand-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-brand-gray-500">Receita Plataforma</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.platformRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-brand-gray-500">Saques Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.pendingPayouts)}</p>
                <p className="text-xs text-brand-gray-500">{pendingWithdraws.length} solicitações</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-brand-gray-500">Webhooks Falhos</p>
                <p className="text-2xl font-bold text-red-600">{summary.failedWebhooks}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle size={20} className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-gray-900">Transações</h2>
          <div className="w-48">
            <Select
              options={transactionTypeOptions}
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={transactionColumns}
            data={filteredTransactions}
            keyExtractor={(t) => t.id}
            emptyMessage="Nenhuma transação encontrada"
          />
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdraw Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-gray-900">Solicitações de Saque</h2>
            {pendingWithdraws.length > 0 && (
              <Badge variant="warning">{pendingWithdraws.length} pendentes</Badge>
            )}
          </CardHeader>
          <CardContent>
            <DataTable
              columns={withdrawColumns}
              data={withdrawRequests}
              keyExtractor={(w) => w.id}
              emptyMessage="Nenhuma solicitação de saque"
            />
          </CardContent>
        </Card>

        {/* Webhook Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-gray-900">Eventos Webhook</h2>
            <div className="p-2 bg-brand-gray-100 rounded-lg">
              <RefreshCw size={16} className="text-brand-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={webhookColumns}
              data={webhookEvents}
              keyExtractor={(w) => w.id}
              emptyMessage="Nenhum evento webhook"
            />
          </CardContent>
        </Card>
      </div>

      {/* Approve Withdraw Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Aprovar Saque"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsApproveModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApproveWithdraw}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Processando...' : 'Aprovar Saque'}
            </Button>
          </div>
        }
      >
        {selectedWithdraw && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">Confirmar aprovação</p>
              <p className="text-sm text-green-700">
                O valor será transferido para o professor.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-gray-500">Professor:</span>
                <span className="font-medium">{selectedWithdraw.profiles?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray-500">Valor:</span>
                <span className="font-bold text-lg">{formatCurrency(selectedWithdraw.amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Withdraw Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Rejeitar Saque"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleRejectWithdraw}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Processando...' : 'Rejeitar Saque'}
            </Button>
          </div>
        }
      >
        {selectedWithdraw && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="font-medium text-red-900">Atenção!</p>
              <p className="text-sm text-red-700">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-gray-500">Professor:</span>
                <span className="font-medium">{selectedWithdraw.profiles?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray-500">Valor:</span>
                <span className="font-bold text-lg">{formatCurrency(selectedWithdraw.amount)}</span>
              </div>
            </div>
            <p className="text-sm text-brand-gray-600">
              O professor será notificado sobre a rejeição.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
