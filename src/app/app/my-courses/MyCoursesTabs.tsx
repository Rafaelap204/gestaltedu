"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { CourseCard } from "@/components/courses/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { EnrollmentWithCourse } from "@/lib/queries/student";

interface MyCoursesTabsProps {
  activeEnrollments: EnrollmentWithCourse[];
  completedEnrollments: EnrollmentWithCourse[];
}

type TabType = "active" | "completed";

export function MyCoursesTabs({
  activeEnrollments,
  completedEnrollments,
}: MyCoursesTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const tabs = [
    {
      id: "active" as TabType,
      label: "Em Andamento",
      icon: Clock,
      count: activeEnrollments.length,
    },
    {
      id: "completed" as TabType,
      label: "Concluídos",
      icon: CheckCircle,
      count: completedEnrollments.length,
    },
  ];

  const currentEnrollments =
    activeTab === "active" ? activeEnrollments : completedEnrollments;

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-brand-gray-200 mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 pb-4 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-brand-orange"
                    : "text-brand-gray-500 hover:text-brand-gray-700"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-brand-orange-light text-brand-orange"
                      : "bg-brand-gray-100 text-brand-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {currentEnrollments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={
              activeTab === "active"
                ? "Nenhum curso em andamento"
                : "Nenhum curso concluído"
            }
            description={
              activeTab === "active"
                ? "Você ainda não começou nenhum curso. Explore nosso marketplace para encontrar cursos interessantes."
                : "Complete as aulas dos seus cursos em andamento para vê-los aqui."
            }
            action={
              <Link href={activeTab === "active" ? "/marketplace" : "/app/my-courses"}>
                <Button variant="primary">
                  {activeTab === "active"
                    ? "Explorar Cursos"
                    : "Ver Cursos em Andamento"}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentEnrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                id={enrollment.course.id}
                title={enrollment.course.title}
                slug={enrollment.course.slug}
                thumbnailUrl={enrollment.course.thumbnail_url}
                teacherName={enrollment.course.teacher?.name ?? null}
                progressPct={enrollment.progress.progressPct}
                totalLessons={enrollment.progress.totalLessons}
                completedLessons={enrollment.progress.completedLessons}
                variant={activeTab === "completed" ? "completed" : "progress"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
