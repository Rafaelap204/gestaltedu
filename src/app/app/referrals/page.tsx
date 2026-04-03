'use client'

import { useEffect, useState } from 'react'
import { Copy, Link2, Share2, MousePointerClick, ShoppingCart, Wallet, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/stores/toast-store'
import { getOrCreateReferralCodeAction, getReferralStatsAction } from '@/lib/actions/referral'
import { formatPrice } from '@/lib/utils/format'

interface ReferralStats {
  code: string
  link: string
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  pendingEarnings: number
  recentReferrals: Array<{
    date: string
    type: 'click' | 'conversion'
    amount?: number
  }>
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadReferralData() {
      try {
        // First ensure code exists
        const codeResult = await getOrCreateReferralCodeAction()
        if ('error' in codeResult) {
          toast.error('Erro', codeResult.error)
          setLoading(false)
          return
        }

        // Then get stats
        const statsResult = await getReferralStatsAction()
        if ('error' in statsResult) {
          toast.error('Erro', statsResult.error)
          setLoading(false)
          return
        }

        setStats(statsResult)
      } catch (error) {
        toast.error('Erro', 'Erro ao carregar dados de indicação')
      } finally {
        setLoading(false)
      }
    }

    loadReferralData()
  }, [])

  const handleCopyLink = async () => {
    if (!stats?.link) return

    try {
      await navigator.clipboard.writeText(stats.link)
      setCopied(true)
      toast.success('Link copiado!', 'O link de indicação foi copiado para a área de transferência.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro', 'Não foi possível copiar o link')
    }
  }

  const handleShareWhatsApp = () => {
    if (!stats?.link) return
    const text = encodeURIComponent(`Confira esta plataforma de cursos incrível! Use meu link: ${stats.link}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleShareTwitter = () => {
    if (!stats?.link) return
    const text = encodeURIComponent(`Confira esta plataforma de cursos incrível! Use meu link: ${stats.link}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-brand-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-brand-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-brand-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-gray-500">Erro ao carregar dados de indicação</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900">Programa de Indicação</h1>
        <p className="text-brand-gray-500 mt-1">
          Indique amigos e ganhe comissões sobre as compras realizadas
        </p>
      </div>

      {/* Referral Link Section */}
      <Card className="border-2 border-brand-orange">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-brand-orange" />
            <h2 className="text-lg font-semibold text-brand-gray-900">Seu Link de Indicação</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-brand-gray-50 border border-brand-gray-200 rounded-lg px-4 py-3 text-brand-gray-700 font-mono text-sm break-all">
              {stats.link}
            </div>
            <Button 
              onClick={handleCopyLink}
              variant={copied ? 'secondary' : 'primary'}
              className="shrink-0"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm text-brand-gray-500">Compartilhar:</span>
            <button
              onClick={handleShareWhatsApp}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              aria-label="Compartilhar no WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button
              onClick={handleShareTwitter}
              className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              aria-label="Compartilhar no Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-gray-500">Total de Cliques</p>
                <p className="text-2xl font-bold text-brand-gray-900 mt-1">{stats.totalClicks}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <MousePointerClick className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-gray-500">Conversões</p>
                <p className="text-2xl font-bold text-brand-gray-900 mt-1">{stats.totalConversions}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-gray-500">Ganhos Totais</p>
                <p className="text-2xl font-bold text-brand-orange mt-1">{formatPrice(stats.totalEarnings)}</p>
              </div>
              <div className="p-3 bg-brand-orange/10 rounded-lg">
                <Wallet className="w-6 h-6 text-brand-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-gray-500">Ganhos Pendentes</p>
                <p className="text-2xl font-bold text-brand-gray-900 mt-1">{formatPrice(stats.pendingEarnings)}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <HelpCircle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-gray-900">Como Funciona</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-brand-gray-900 mb-2">1. Compartilhe seu link</h3>
              <p className="text-sm text-brand-gray-500">
                Envie seu link de indicação para amigos e conhecidos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-brand-gray-900 mb-2">2. Amigo se cadastra e compra</h3>
              <p className="text-sm text-brand-gray-500">
                Quando alguém usa seu link e faz uma compra
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-brand-gray-900 mb-2">3. Você recebe comissão</h3>
              <p className="text-sm text-brand-gray-500">
                Ganhe uma porcentagem sobre o valor da compra
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats.recentReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-brand-gray-900">Atividade Recente</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Tipo</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-brand-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentReferrals.map((referral, index) => (
                    <tr key={index} className="border-b border-brand-gray-100 last:border-0">
                      <td className="py-3 px-4 text-sm text-brand-gray-700">{referral.date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          referral.type === 'click' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {referral.type === 'click' ? 'Clique' : 'Conversão'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-gray-700 text-right">
                        {referral.amount ? formatPrice(referral.amount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Section */}
      <Card className="bg-brand-gray-50 border-brand-gray-200">
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-gray-900">Regras do Programa</h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-brand-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-brand-orange mt-0.5">•</span>
              <span>O cookie de indicação é válido por <strong>30 dias</strong> após o primeiro clique</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-orange mt-0.5">•</span>
              <span>A comissão é calculada sobre o valor da compra realizada</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-orange mt-0.5">•</span>
              <span><strong>Anti-fraude:</strong> Você não pode usar seu próprio código de indicação</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-orange mt-0.5">•</span>
              <span>As comissões são pagas após a confirmação do pagamento do pedido</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-orange mt-0.5">•</span>
              <span>O valor exato da comissão pode variar de acordo com as regras de cada curso</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
