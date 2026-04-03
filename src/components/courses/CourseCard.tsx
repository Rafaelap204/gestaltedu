"use client";

import Link from "next/link";
import { Play, BookOpen, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

interface CourseCardProps {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  teacherName: string | null;
  progressPct?: number;
  totalLessons?: number;
  completedLessons?: number;
  variant?: "progress" | "recommendation" | "completed";
  price?: number;
  shortDescription?: string | null;
}

export function CourseCard({
  id,
  title,
  slug,
  thumbnailUrl,
  teacherName,
  progressPct = 0,
  totalLessons = 0,
  completedLessons = 0,
  variant = "progress",
  price,
  shortDescription,
}: CourseCardProps) {
  const isCompleted = progressPct >= 100;

  const formatPrice = (price: number): string => {
    if (price === 0) return "Gratuito";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Card hoverable className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video bg-brand-gray-200 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-gray-100">
            <BookOpen size={48} className="text-brand-gray-400" />
          </div>
        )}
        
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge variant="success">Conclu�do</Badge>
          </div>
        )}

        {variant === "progress" && !isCompleted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="w-14 h-14 rounded-full bg-brand-orange flex items-center justify-center">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="flex-1 flex flex-col p-4">
        <h3 className="font-semibold text-brand-gray-900 mb-1 line-clamp-2">
          {title}
        </h3>

        {teacherName && (
          <div className="flex items-center gap-1 text-sm text-brand-gray-500 mb-3">
            <User size={14} />
            <span>{teacherName}</span>
          </div>
        )}

        {variant === "recommendation" && shortDescription && (
          <p className="text-sm text-brand-gray-500 mb-3 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {(variant === "progress" || variant === "completed") && (
          <div className="mt-auto">
            <ProgressBar
              progress={progressPct}
              size="sm"
              showPercentage={false}
              className="mb-2"
            />
            <p className="text-xs text-brand-gray-500">
              {completedLessons} de {totalLessons} aulas conclu�das
            </p>
          </div>
        )}

        {variant === "recommendation" && price !== undefined && (
          <div className="mt-auto pt-3">
            <p className="text-lg font-bold text-brand-gray-900">
              {formatPrice(price)}
            </p>
          </div>
        )}

        <div className="mt-4">
          {variant === "progress" && (
            <Button
              asChild
              variant={isCompleted ? "secondary" : "primary"}
              size="sm"
              className="w-full"
            >
              <Link href={`/app/courses/${slug}`}>
                {isCompleted ? "Rever Curso" : "Continuar"}
              </Link>
            </Button>
          )}

          {variant === "completed" && (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Link href={`/app/courses/${slug}`}>
                Rever Curso
              </Link>
            </Button>
          )}

          {variant === "recommendation" && (
            <Button
              asChild
              variant="primary"
              size="sm"
              className="w-full"
            >
              <Link href={`/courses/${slug}`}>
                Ver Detalhes
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

