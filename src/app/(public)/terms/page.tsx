import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso | Gestalt EDU",
  description: "Termos de uso da plataforma Gestalt EDU",
};

export default function TermsPage() {
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
            Termos de Uso
          </h1>

          <div className="prose prose-brand-gray max-w-none">
            <p className="text-brand-gray-600 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                1. Aceitação dos Termos
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Ao acessar e usar a plataforma Gestalt EDU, você concorda em cumprir 
                e estar vinculado a estes Termos de Uso. Se você não concordar com 
                qualquer parte destes termos, não poderá usar nossos serviços.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                2. Descrição do Serviço
              </h2>
              <p className="text-brand-gray-600 mb-4">
                A Gestalt EDU é uma plataforma de ensino online que conecta alunos 
                a professores e cursos. Oferecemos uma variedade de cursos em 
                diferentes áreas do conhecimento, acessíveis mediante pagamento 
                ou gratuitamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                3. Cadastro e Conta
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Para usar nossos serviços, você precisa criar uma conta fornecendo 
                informações precisas e completas. Você é responsável por manter a 
                confidencialidade de sua senha e por todas as atividades que 
                ocorrerem em sua conta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                4. Compras e Reembolsos
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Ao comprar um curso, você recebe acesso vitalício ao conteúdo, 
                sujeito a estes termos. Oferecemos garantia de reembolso de 7 dias 
                para cursos que não tenham sido concluídos em mais de 30%.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                5. Propriedade Intelectual
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Todo o conteúdo disponível na plataforma, incluindo vídeos, textos, 
                imagens e materiais, é protegido por direitos autorais. O acesso 
                concedido é apenas para uso pessoal e não comercial.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                6. Conduta do Usuário
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Os usuários devem usar a plataforma de forma respeitosa e ética. 
                É proibido compartilhar credenciais, distribuir conteúdo ilegalmente, 
                ou prejudicar outros usuários.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                7. Alterações nos Termos
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Reservamos o direito de modificar estes termos a qualquer momento. 
                As alterações entram em vigor imediatamente após a publicação. 
                O uso continuado da plataforma constitui aceitação dos termos 
                modificados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
                8. Contato
              </h2>
              <p className="text-brand-gray-600 mb-4">
                Para dúvidas sobre estes termos, entre em contato conosco pelo 
                e-mail: suporte@gestaltedu.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
