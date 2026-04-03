"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/admin/DataTable";
import { 
  toggleCourseFeatureAction, 
  toggleCoursePublishAction 
} from "@/lib/actions/admin";
import { Search, Star, Eye, EyeOff, ExternalLink } from "lucide-react";

// Format currency to Brazilian Real
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format date to Brazilian format
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

interface Course {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  featured: boolean;
  created_at: string;
  profiles?: { name: string };
  enrollments?: { count: number }[];
}

interface AdminCoursesClientProps {
  initialCourses: Course[];
}

export function AdminCoursesClient({ initialCourses }: AdminCoursesClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle toggle featured
  const handleToggleFeatured = async (courseId: string, currentFeatured: boolean) => {
    startTransition(async () => {
      const result = await toggleCourseFeatureAction(courseId, !currentFeatured);
      if ('success' in result) {
        setCourses(courses.map(c => 
          c.id === courseId ? { ...c, featured: !currentFeatured } : c
        ));
      }
    });
  };

  // Handle toggle publish
  const handleTogglePublish = async (courseId: string, currentStatus: string) => {
    const newPublish = currentStatus !== 'published';
    startTransition(async () => {
      const result = await toggleCoursePublishAction(courseId, newPublish);
      if ('success' in result) {
        setCourses(courses.map(c => 
          c.id === courseId ? { ...c, status: newPublish ? 'published' : 'draft' } : c
        ));
      }
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Publicado</Badge>;
      case 'draft':
        return <Badge variant="default">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="error">Arquivado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Table columns
  const columns = [
    {
      key: 'title',
      header: 'Título',
      render: (course: Course) => (
        <div>
          <p className="font-medium text-brand-gray-900">{course.title}</p>
          <p className="text-xs text-brand-gray-500">/{course.slug}</p>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Professor',
      render: (course: Course) => course.profiles?.name || 'Desconhecido',
    },
    {
      key: 'status',
      header: 'Status',
      render: (course: Course) => getStatusBadge(course.status),
    },
    {
      key: 'price',
      header: 'Preço',
      render: (course: Course) => formatCurrency(course.price),
    },
    {
      key: 'featured',
      header: 'Destaque',
      render: (course: Course) => (
        <button
          onClick={() => handleToggleFeatured(course.id, course.featured)}
          disabled={isPending}
          className={`p-2 rounded-lg transition-colors ${
            course.featured 
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
              : 'bg-brand-gray-100 text-brand-gray-400 hover:bg-brand-gray-200'
          }`}
        >
          <Star size={16} fill={course.featured ? 'currentColor' : 'none'} />
        </button>
      ),
    },
    {
      key: 'enrollments',
      header: 'Matrículas',
      render: (course: Course) => course.enrollments?.[0]?.count || 0,
    },
    {
      key: 'created',
      header: 'Criado em',
      render: (course: Course) => formatDate(course.created_at),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (course: Course) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTogglePublish(course.id, course.status)}
            disabled={isPending}
            className={`p-2 rounded-lg transition-colors ${
              course.status === 'published'
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200'
            }`}
            title={course.status === 'published' ? 'Despublicar' : 'Publicar'}
          >
            {course.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={() => {
              setSelectedCourse(course);
              setIsDetailModalOpen(true);
            }}
            className="p-2 bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200 rounded-lg transition-colors"
            title="Ver detalhes"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'published', label: 'Publicado' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'archived', label: 'Arquivado' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Cursos</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Gerencie todos os cursos da plataforma
          </p>
        </div>
        <Button variant="primary">
          <ExternalLink size={16} className="mr-2" />
          Novo Curso
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-400" size={18} />
              <Input
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <DataTable
        columns={columns}
        data={filteredCourses}
        keyExtractor={(course) => course.id}
        loading={false}
        emptyMessage="Nenhum curso encontrado"
        emptyDescription="Tente ajustar os filtros ou criar um novo curso"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalhes do Curso"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
            Fechar
          </Button>
        }
      >
        {selectedCourse && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-gray-500">Título</label>
              <p className="text-brand-gray-900">{selectedCourse.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-gray-500">Slug</label>
                <p className="text-brand-gray-900">{selectedCourse.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedCourse.status)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-gray-500">Preço</label>
                <p className="text-brand-gray-900">{formatCurrency(selectedCourse.price)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-gray-500">Destaque</label>
                <p className="text-brand-gray-900">
                  {selectedCourse.featured ? 'Sim' : 'Não'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-gray-500">Criado em</label>
              <p className="text-brand-gray-900">{formatDate(selectedCourse.created_at)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
