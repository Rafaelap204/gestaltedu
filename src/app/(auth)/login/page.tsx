"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";

// Force dynamic rendering to avoid prerendering issues with Supabase client
export const dynamic = "force-dynamic";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/app";
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Email ou senha incorretos");
        return;
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', signInData.user.id)
        .single()

      const userRole = profile?.role || 'student'

      // Determine redirect based on role or use provided redirect param
      let targetRedirect = redirect
      if (redirect === '/app') {
        // Only use role-based redirect if no specific redirect was provided
        switch (userRole) {
          case 'admin':
            targetRedirect = '/admin'
            break
          case 'teacher':
            targetRedirect = '/teacher'
            break
          default:
            targetRedirect = '/app'
        }
      }

      // Redirect on success
      router.push(targetRedirect);
      router.refresh();
    } catch {
      setError("Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-brand-black">Entrar</h2>
          <p className="mt-1 text-sm text-brand-gray-600">
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-brand-orange hover:text-brand-orange-hover transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-brand-gray-600">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <div className="h-8 w-32 bg-brand-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-48 bg-brand-gray-200 rounded animate-pulse mx-auto mt-2" />
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-brand-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-brand-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-brand-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-bold text-brand-black">
            Gestalt <span className="text-brand-orange">EDU</span>
          </h1>
        </Link>
        <p className="mt-2 text-brand-gray-600 text-sm">
          Plataforma de ensino online
        </p>
      </div>

      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
