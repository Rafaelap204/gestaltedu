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
  changeUserRoleAction, 
  blockUserAction, 
  unblockUserAction,
  createUserAction,
  enrollUserInCoursesAction
} from "@/lib/actions/admin";
import { Search, Shield, UserX, UserCheck, AlertTriangle, Plus, BookOpen, CheckSquare, Square } from "lucide-react";
import type { UserRole } from "@/types/database";

// Format date to Brazilian format
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

interface User {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: UserRole;
  created_at: string;
  avatar_url?: string;
}

interface Course {
  id: string;
  title: string;
}

interface AdminUsersClientProps {
  initialUsers: User[];
  courses: Course[];
}

export function AdminUsersClient({ initialUsers, courses }: AdminUsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('student');
  
  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [enrollInCourses, setEnrollInCourses] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [createError, setCreateError] = useState('');

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    startTransition(async () => {
      const result = await changeUserRoleAction(selectedUser.id, newRole);
      if ('success' in result) {
        setUsers(users.map(u => 
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        ));
        setIsRoleModalOpen(false);
        setSelectedUser(null);
      }
    });
  };

  // Handle block/unblock
  const handleBlockToggle = async () => {
    if (!selectedUser) return;
    
    startTransition(async () => {
      // For now, we'll just show the modal - actual block functionality
      // would require a 'blocked' column in the database
      setIsBlockModalOpen(false);
      setSelectedUser(null);
    });
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="error">Admin</Badge>;
      case 'teacher':
        return <Badge variant="info">Professor</Badge>;
      case 'student':
        return <Badge variant="success">Aluno</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Open role modal
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  // Open block modal
  const openBlockModal = (user: User) => {
    setSelectedUser(user);
    setIsBlockModalOpen(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserName('');
    setNewUserRole('student');
    setEnrollInCourses(false);
    setSelectedCourses([]);
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  // Open enroll modal
  const openEnrollModal = (user: User) => {
    setSelectedUser(user);
    setSelectedCourses([]);
    setIsEnrollModalOpen(true);
  };

  // Handle create user
  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) {
      setCreateError('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (newUserPassword.length < 6) {
      setCreateError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    startTransition(async () => {
      const result = await createUserAction(
        newUserEmail.trim(),
        newUserPassword,
        newUserName.trim(),
        newUserRole
      );
      
      if ('error' in result) {
        setCreateError(result.error);
      } else {
        // Matricular em cursos se selecionado
        if (enrollInCourses && selectedCourses.length > 0) {
          await enrollUserInCoursesAction(result.userId, selectedCourses);
        }
        
        // Adicionar usuário à lista local
        const newUser: User = {
          id: result.profileId,
          user_id: result.userId,
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          created_at: new Date().toISOString(),
        };
        setUsers([newUser, ...users]);
        setIsCreateModalOpen(false);
      }
    });
  };

  // Handle enroll user in courses
  const handleEnrollUser = async () => {
    if (!selectedUser) return;
    
    startTransition(async () => {
      // Usar selectedUser.id (profile ID) não user_id (auth ID)
      // Pois a tabela enrollments referencia profiles(id)
      const result = await enrollUserInCoursesAction(selectedUser.id, selectedCourses);
      
      if ('error' in result) {
        alert(result.error);
      } else {
        setIsEnrollModalOpen(false);
        setSelectedUser(null);
        setSelectedCourses([]);
        
        if (result.message) {
          alert(result.message);
        } else if (result.enrolled.length > 0) {
          alert(`Matriculado em ${result.enrolled.length} curso(s) com sucesso!`);
        } else if (result.errors.length > 0) {
          alert('Erros ao matricular:\n' + result.errors.join('\n'));
        } else {
          alert('Nenhum curso foi matriculado.');
        }
      }
    });
  };

  // Toggle course selection
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange font-semibold text-sm">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-brand-gray-900">{user.name || 'Sem nome'}</p>
            <p className="text-xs text-brand-gray-500">{user.email || user.user_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => getRoleBadge(user.role),
    },
    {
      key: 'created',
      header: 'Criado em',
      render: (user: User) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openRoleModal(user)}
            disabled={isPending}
            className="p-2 bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200 rounded-lg transition-colors"
            title="Alterar role"
          >
            <Shield size={16} />
          </button>
          <button
            onClick={() => openEnrollModal(user)}
            disabled={isPending}
            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
            title="Matricular em cursos"
          >
            <BookOpen size={16} />
          </button>
          <button
            onClick={() => openBlockModal(user)}
            disabled={isPending}
            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
            title="Bloquear usuário"
          >
            <UserX size={16} />
          </button>
        </div>
      ),
    },
  ];

  const roleOptions = [
    { value: 'all', label: 'Todos os roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Professor' },
    { value: 'student', label: 'Aluno' },
  ];

  const changeRoleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'teacher', label: 'Professor' },
    { value: 'student', label: 'Aluno' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Usuários</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Gerencie usuários e permissões da plataforma
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={16} className="mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-400" size={18} />
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        loading={false}
        emptyMessage="Nenhum usuário encontrado"
        emptyDescription="Tente ajustar os filtros de busca"
      />

      {/* Role Change Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Alterar Role do Usuário"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleRoleChange}
              disabled={isPending}
            >
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-brand-gray-50 rounded-lg">
              <p className="text-sm text-brand-gray-500">Usuário</p>
              <p className="font-medium text-brand-gray-900">{selectedUser.name || 'Sem nome'}</p>
              <p className="text-sm text-brand-gray-600">{selectedUser.email || selectedUser.user_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-2">
                Novo Role
              </label>
              <Select
                options={changeRoleOptions}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Alterar o role de um usuário pode afetar seu acesso à plataforma. 
                Certifique-se de que esta ação é necessária.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Block User Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Bloquear Usuário"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsBlockModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleBlockToggle}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Processando...' : 'Bloquear Usuário'}
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <UserX size={24} className="text-red-600" />
              <div>
                <p className="font-medium text-red-900">Atenção!</p>
                <p className="text-sm text-red-700">
                  Você está prestes a bloquear o usuário <strong>{selectedUser.name || 'Sem nome'}</strong>.
                </p>
              </div>
            </div>
            <p className="text-sm text-brand-gray-600">
              Usuários bloqueados não poderão fazer login na plataforma até que sejam desbloqueados.
              Esta ação pode ser revertida posteriormente.
            </p>
          </div>
        )}
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Adicionar Novo Usuário"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateUser}
              disabled={isPending}
            >
              {isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{createError}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-2">
              Nome Completo *
            </label>
            <Input
              placeholder="Digite o nome do usuário"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-2">
              E-mail *
            </label>
            <Input
              type="email"
              placeholder="usuario@email.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-2">
              Senha *
            </label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
            <p className="text-xs text-brand-gray-500 mt-1">
              A senha deve ter pelo menos 6 caracteres
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-2">
              Role *
            </label>
            <Select
              options={[
                { value: 'student', label: 'Aluno' },
                { value: 'teacher', label: 'Professor' },
                { value: 'admin', label: 'Administrador' },
              ]}
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
            />
          </div>
          
          <div className="border-t border-brand-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enrollInCourses}
                onChange={(e) => setEnrollInCourses(e.target.checked)}
                className="w-4 h-4 text-brand-orange border-brand-gray-300 rounded focus:ring-brand-orange"
              />
              <span className="text-sm font-medium text-brand-gray-700">
                Matricular em cursos (acesso gratuito)
              </span>
            </label>
          </div>
          
          {enrollInCourses && (
            <div className="bg-brand-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-brand-gray-700 mb-3">
                Selecione os cursos:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {courses.length === 0 ? (
                  <p className="text-sm text-brand-gray-500">Nenhum curso disponível</p>
                ) : (
                  courses.map((course) => (
                    <label
                      key={course.id}
                      onClick={() => toggleCourseSelection(course.id)}
                      className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                    >
                      {selectedCourses.includes(course.id) ? (
                        <CheckSquare size={18} className="text-brand-orange" />
                      ) : (
                        <Square size={18} className="text-brand-gray-400" />
                      )}
                      <span className="text-sm text-brand-gray-700">{course.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Enroll User Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Matricular em Cursos"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsEnrollModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEnrollUser}
              disabled={isPending || selectedCourses.length === 0}
            >
              {isPending ? 'Matriculando...' : `Matricular em ${selectedCourses.length} curso(s)`}
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-brand-gray-50 rounded-lg">
              <p className="text-sm text-brand-gray-500">Usuário</p>
              <p className="font-medium text-brand-gray-900">{selectedUser.name || 'Sem nome'}</p>
              <p className="text-sm text-brand-gray-600">{selectedUser.email || selectedUser.user_id}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-3">
                Selecione os cursos para matricular:
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {courses.length === 0 ? (
                  <p className="text-sm text-brand-gray-500">Nenhum curso disponível</p>
                ) : (
                  courses.map((course) => (
                    <label
                      key={course.id}
                      onClick={() => toggleCourseSelection(course.id)}
                      className="flex items-center gap-3 p-3 bg-brand-gray-50 hover:bg-brand-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      {selectedCourses.includes(course.id) ? (
                        <CheckSquare size={20} className="text-brand-orange" />
                      ) : (
                        <Square size={20} className="text-brand-gray-400" />
                      )}
                      <span className="text-sm text-brand-gray-700">{course.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
