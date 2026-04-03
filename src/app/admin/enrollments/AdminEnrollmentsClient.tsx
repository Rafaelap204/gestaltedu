"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/admin/DataTable";
import { cancelEnrollmentAction } from "@/lib/actions/admin";
import { Search, XCircle, AlertTriangle, GraduationCap } from "lucide-react";

// Format date to Brazilian format
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR');
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'cancelled' | 'completed';
  started_at: string;
  completed_at: string | null;
  profiles?: { name: string; email?: string };
  courses?: { title: string };
}

interface Course {
  id: string;
  title: string;
}

interface AdminEnrollmentsClientProps {
  initialEnrollments: Enrollment[];
  courses: Course[];
}

export function AdminEnrollmentsClient({ initialEnrollments, courses }: AdminEnrollmentsClientProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  
  // Modal states
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const studentName = enrollment.profiles?.name?.toLowerCase() || '';
    const courseTitle = enrollment.courses?.title?.toLowerCase() || '';
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || 
                         courseTitle.includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || enrollment.course_id === courseFilter;
    const matchesStatus = statusFilter === "all" || enrollment.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Handle cancel enrollment
  const handleCancelEnrollment = async () => {
    if (!selectedEnrollment) return;
    
    startTransition(async () => {
      const result = await cancelEnrollmentAction(selectedEnrollment.id);
      if ('success' in result) {
        setEnrollments(enrollments.map(e => 
          e.id === selectedEnrollment.id ? { ...e, status: 'cancelled' } : e
        ));
        setIsCancelModalOpen(false);
        setSelectedEnrollment(null);
      }
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativa</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelada</Badge>;
      case 'completed':
        return <Badge variant="info">Concluída</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Open cancel modal
  const openCancelModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsCancelModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      key: 'student',
      header: 'Aluno',
      render: (enrollment: Enrollment) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange font-semibold text-sm">
            <GraduationCap size={16} />
          </div>
          <div>
            <p className="font-medium text-brand-gray-900">{enrollment.profiles?.name || 'Desconhecido'}</p>
            <p className="text-xs text-brand-gray-500">{enrollment.profiles?.email || ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Curso',
      render: (enrollment: Enrollment) => (
        <p className="font-medium text-brand-gray-900 max-w-xs truncate">
          {enrollment.courses?.title || 'Curso Desconhecido'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (enrollment: Enrollment) => getStatusBadge(enrollment.status),
    },
    {
      key: 'started',
      header: 'Iniciado em',
      render: (enrollment: Enrollment) => formatDate(enrollment.started_at),
    },
    {
      key: 'completed',
      header: 'Concluído em',
      render: (enrollment: Enrollment) => formatDate(enrollment.completed_at),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (enrollment: Enrollment) => (
        enrollment.status === 'active' ? (
          <button
            onClick={() => openCancelModal(enrollment)}
            disabled={isPending}
            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
            title="Cancelar matrícula"
          >
            <XCircle size={16} />
          </button>
        ) : (
          <span className="text-brand-gray-400 text-sm">-</span>
        )
      ),
    },
  ];

  const courseOptions = [
    { value: 'all', label: 'Todos os cursos' },
    ...courses.map(c => ({ value: c.id, label: c.title }))
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativa' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'completed', label: 'Concluída' },
  ];

  // Stats
  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const cancelledCount = enrollments.filter(e => e.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Matrículas</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Gerencie as matrículas dos alunos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-sm text-brand-gray-500">Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
            <p className="text-sm text-brand-gray-500">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
            <p className="text-sm text-brand-gray-500">Canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-400" size={18} />
              <Input
                placeholder="Buscar por aluno ou curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={courseOptions}
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <DataTable
        columns={columns}
        data={filteredEnrollments}
        keyExtractor={(enrollment) => enrollment.id}
        loading={false}
        emptyMessage="Nenhuma matrícula encontrada"
        emptyDescription="Tente ajustar os filtros de busca"
      />

      {/* Cancel Enrollment Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Matrícula"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCancelEnrollment}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Processando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        }
      >
        {selectedEnrollment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <p className="font-medium text-red-900">Atenção!</p>
                <p className="text-sm text-red-700">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="p-4 bg-brand-gray-50 rounded-lg space-y-2">
              <div>
                <span className="text-sm text-brand-gray-500">Aluno:</span>
                <p className="font-medium text-brand-gray-900">
                  {selectedEnrollment.profiles?.name || 'Desconhecido'}
                </p>
              </div>
              <div>
                <span className="text-sm text-brand-gray-500">Curso:</span>
                <p className="font-medium text-brand-gray-900">
                  {selectedEnrollment.courses?.title || 'Desconhecido'}
                </p>
              </div>
              <div>
                <span className="text-sm text-brand-gray-500">Iniciado em:</span>
                <p className="font-medium text-brand-gray-900">
                  {formatDate(selectedEnrollment.started_at)}
                </p>
              </div>
            </div>
            <p className="text-sm text-brand-gray-600">
              O aluno perderá acesso imediato ao curso. Esta ação não gera reembolso automático.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
