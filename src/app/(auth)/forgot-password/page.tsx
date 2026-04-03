"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";

// Force dynamic rendering to avoid prerendering issues with Supabase client
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Create client inside handler to avoid build-time issues
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError("Erro ao enviar email de recuperação");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ocorreu um erro ao enviar o email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-brand-black">
              Email enviado
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-center">
            <p className="mb-2">
              Enviamos um link de recuperação para <strong>{email}</strong>
            </p>
            <p className="text-sm">Verifique sua caixa de entrada e siga as instruções.</p>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-brand-gray-600">
              Não recebeu o email?{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
              >
                Tentar novamente
              </button>
            </p>
            <Link
              href="/login"
              className="block text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-brand-black">
            Recuperar senha
          </h2>
          <p className="mt-1 text-sm text-brand-gray-600">
            Digite seu email para receber o link de recuperação
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

          <Button type="submit" loading={loading} className="w-full">
            Enviar link de recuperação
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
          >
            Voltar para o login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
