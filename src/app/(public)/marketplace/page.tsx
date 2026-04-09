import { Suspense } from "react";
import Link from "next/link";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CourseCard } from "@/components/courses/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";

interface MarketplacePageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    level?: string;
    price?: string;
  }>;
}

const categories = [
  { value: "", label: "Todas as categorias" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "negocios", label: "Negócios" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "idiomas", label: "Idiomas" },
  { value: "desenvolvimento-pessoal", label: "Desenvolvimento Pessoal" },
];

const levels = [
  { value: "", label: "Todos os níveis" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const priceRanges = [
  { value: "", label: "Todos os preços" },
  { value: "free", label: "Gratuito" },
  { value: "under-50", label: "Até R$ 50" },
  { value: "under-100", label: "Até R$ 100" },
  { value: "over-100", label: "Acima de R$ 100" },
];

async function CoursesList({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const level = params.level || "";
  const price = params.price || "";

  const supabase = await createClient();
  
  let query = supabase
    .from('courses')
    .select('*, profiles!courses_teacher_id_fkey(name)')
    .eq('status', 'published')
    .limit(20);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (level) {
    query = query.eq('level', level);
  }

  // Price filters
  if (price === "free") {
    query = query.eq('price', 0);
  } else if (price === "under-50") {
    query = query.gt('price', 0).lte('price', 50);
  } else if (price === "under-100") {
    query = query.gt('price', 0).lte('price', 100);
  } else if (price === "over-100") {
    query = query.gt('price', 100);
  }

  const { data: courses, error } = await query;

  if (error) {
    console.error("Error fetching courses:", error);
    return (
      <EmptyState
        iconName="Filter"
        title="Erro ao carregar cursos"
        description="Não foi possível carregar os cursos. Tente novamente mais tarde."
      />
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        iconName="Search"
        title="Nenhum curso encontrado"
        description="Tente ajustar os filtros ou buscar por outros termos."
        action={
          <Link href="/marketplace">
            <Button variant="outline">Limpar Filtros</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          slug={course.slug}
          thumbnailUrl={course.thumbnail_url}
          teacherName={course.profiles?.name}
          price={course.price}
          shortDescription={course.short_description}
          variant="recommendation"
        />
      ))}
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-brand-gray-200 shadow-sm overflow-hidden">
          <div className="aspect-video bg-brand-gray-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-brand-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-brand-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-brand-gray-200 rounded animate-pulse w-full" />
            <div className="pt-3 border-t border-brand-gray-100">
              <div className="h-6 bg-brand-gray-200 rounded animate-pulse w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const level = params.level || "";
  const price = params.price || "";

  const hasFilters = search || category || level || price;

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-brand-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
            Marketplace de Cursos
          </h1>
          <p className="text-brand-gray-600">
            Encontre o curso perfeito para você
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm p-6 mb-8">
          <form className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-gray-400" />
              <Input
                type="text"
                name="search"
                placeholder="Buscar cursos..."
                defaultValue={search}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select 
                name="category" 
                defaultValue={category}
                options={categories}
              />

              <Select 
                name="level" 
                defaultValue={level}
                options={levels}
              />

              <Select 
                name="price" 
                defaultValue={price}
                options={priceRanges}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                {hasFilters && (
                  <Link href="/marketplace">
                    <Button type="button" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-brand-gray-500">Filtros ativos:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-orange-light text-brand-orange text-sm">
                Busca: {search}
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-orange-light text-brand-orange text-sm">
                {categories.find(c => c.value === category)?.label}
              </span>
            )}
            {level && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-orange-light text-brand-orange text-sm">
                {levels.find(l => l.value === level)?.label}
              </span>
            )}
            {price && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-orange-light text-brand-orange text-sm">
                {priceRanges.find(p => p.value === price)?.label}
              </span>
            )}
          </div>
        )}

        {/* Courses Grid */}
        <Suspense fallback={<CoursesSkeleton />}>
          <CoursesList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
