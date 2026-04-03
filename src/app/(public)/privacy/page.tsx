import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | Gestalt EDU",
  description: "Política de privacidade da plataforma Gestalt EDU",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-brand-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-brand-gray-900 mb-8">
            Política de Privacidade
          </h1>

          <div className="prose prose-brand-gray max-w-none">
            <p className="text-brand-gray-600 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                1. Introdução
              </h2>
              <p className="text-brand-gray-600 mb-4">
                A Gestalt EDU valoriza sua privacidade e está comprometida em 
                proteger suas informações pessoais. Esta política descreve como 
                coletamos, usamos e protegemos seus dados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                2. Informações que Coletamos
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Coletamos as seguintes informações:
              </p>
              <ul className="list-disc list-inside text-brand-gray-600 mb-4 space-y-2">
                <li>Informações de cadastro (nome, e-mail, senha)</li>
                <li>Informações de perfil (foto, biografia)</li>
                <li>Dados de pagamento (processados de forma segura)</li>
                <li>Histórico de cursos e progresso</li>
                <li>Dados de uso da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                3. Como Usamos suas Informações
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside text-brand-gray-600 mb-4 space-y-2">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar pagamentos e transações</li>
                <li>Enviar comunicações sobre cursos e atualizações</li>
                <li>Personalizar sua experiência de aprendizado</li>
                <li>Garantir a segurança da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                4. Compartilhamento de Dados
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Não vendemos suas informações pessoais. Compartilhamos dados apenas 
                com:
              </p>
              <ul className="list-disc list-inside text-brand-gray-600 mb-4 space-y-2">
                <li>Processadores de pagamento (para transações seguras)</li>
                <li>Professores (apenas informações necessárias para o curso)</li>
                <li>Autoridades legais (quando exigido por lei)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                5. Segurança dos Dados
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Implementamos medidas de segurança técnicas e organizacionais para 
                proteger suas informações contra acesso não autorizado, alteração, 
                divulgação ou destruição.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                6. Seus Direitos
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Você tem o direito de:
              </p>
              <ul className="list-disc list-inside text-brand-gray-600 mb-4 space-y-2">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir informações incorretas</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Exportar seus dados</li>
                <li>Optar por não receber comunicações de marketing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                7. Cookies e Tecnologias Similares
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Usamos cookies para melhorar sua experiência, lembrar preferências 
                e analisar o uso da plataforma. Você pode gerenciar as preferências 
                de cookies nas configurações do seu navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                8. Alterações na Política
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Podemos atualizar esta política periodicamente. Notificaremos sobre 
                mudanças significativas através do e-mail cadastrado ou na própria 
                plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                9. Contato
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Para questões sobre privacidade, entre em contato:
              </p>
              <p className="text-brand-gray-600">
                E-mail: privacidade@gestaltedu.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
