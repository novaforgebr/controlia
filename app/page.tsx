import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Controlia CRM - Plataforma SaaS de CRM Inteligente com IA',
  description: 'Centralize contatos, conversas, pagamentos e automações em uma única plataforma. CRM inteligente com controle total sobre dados e IA. Multi-tenant, seguro e escalável.',
  keywords: 'CRM, SaaS, automação, inteligência artificial, gestão de contatos, WhatsApp, n8n, multi-tenant',
  openGraph: {
    title: 'Controlia CRM - Plataforma SaaS de CRM Inteligente',
    description: 'CRM inteligente com controle total sobre dados e IA',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-2xl font-semibold text-gray-900">Controlia</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-[#039155] transition-colors">
                Funcionalidades
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-[#039155] transition-colors">
                Como Funciona
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#039155] transition-colors">
                Preços
              </a>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-[#039155] transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#039155]/25 hover:shadow-xl hover:shadow-[#039155]/30 transition-all"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#039155]/5 via-white to-[#18B0BB]/5" />
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle, #039155 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full border border-[#039155]/20 bg-[#039155]/10 px-4 py-2 text-sm font-medium text-[#039155] backdrop-blur-sm">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Novo: Integração com WhatsApp Business API
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              CRM Inteligente com
              <span className="block bg-gradient-to-r from-[#039155] via-[#18B0BB] to-[#039155] bg-clip-text text-transparent">
                Controle Total
              </span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-xl leading-8 text-gray-600">
              Centralize contatos, conversas, pagamentos e automações em uma única plataforma.
              Com inteligência artificial que você controla completamente. Seus dados, suas regras.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#039155] to-[#18B0BB] px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-[#039155]/30 transition-all hover:shadow-[#039155]/40 hover:scale-105"
              >
                <span className="relative z-10">Começar Grátis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#18B0BB] to-[#039155] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <Link
                href="#demo"
                className="rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-all hover:border-[#039155] hover:bg-gray-50"
              >
                Ver Demonstração
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="group">
                <div className="text-4xl font-bold text-[#039155]">99.9%</div>
                <div className="mt-2 text-sm font-medium text-gray-600">Uptime</div>
              </div>
              <div className="group">
                <div className="text-4xl font-bold text-[#18B0BB]">10k+</div>
                <div className="mt-2 text-sm font-medium text-gray-600">Empresas Ativas</div>
              </div>
              <div className="group">
                <div className="text-4xl font-bold text-[#EC5429]">1M+</div>
                <div className="mt-2 text-sm font-medium text-gray-600">Mensagens Processadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cards Animation */}
        <div className="absolute left-10 top-40 hidden animate-float lg:block">
          <div className="rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#039155] to-[#18B0BB]" />
              <div>
                <div className="font-semibold text-gray-900">João Silva</div>
                <div className="text-sm text-gray-500">Nova mensagem recebida</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-10 top-60 hidden animate-float-delayed lg:block">
          <div className="rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Conversas Ativas</div>
                <div className="text-2xl font-bold text-[#039155]">247</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#039155]/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-[#039155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Uma plataforma completa para gerenciar seu negócio com inteligência e controle total
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Feature Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#039155]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Gestão de Contatos</h3>
                <p className="mt-3 text-gray-600">
                  Organize leads, prospects e clientes com campos customizados, tags inteligentes e histórico completo de todas as interações.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#039155]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Campos personalizados ilimitados
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#039155]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Sistema de tags e categorização
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#039155]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Histórico completo de interações
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#18B0BB]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#18B0BB] to-[#039155]">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Conversas e Atendimento</h3>
                <p className="mt-3 text-gray-600">
                  Centralize todas as conversas do WhatsApp e outros canais. Visualize em tempo real, identifique origem e intervenha quando necessário.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#18B0BB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Integração WhatsApp Business
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#18B0BB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Monitoramento em tempo real
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#18B0BB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Identificação humano vs IA
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#EC5429]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#EC5429] to-[#039155]">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">IA Controlada</h3>
                <p className="mt-3 text-gray-600">
                  Agentes de IA que você controla completamente. Prompts versionados, logs detalhados, limites claros e transparência total.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#EC5429]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Prompts versionados e rastreáveis
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#EC5429]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Logs completos de decisões
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#EC5429]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Controle granular por contato
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#039155]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Automações Inteligentes</h3>
                <p className="mt-3 text-gray-600">
                  Integração com n8n para criar workflows poderosos. Pause, reative e monitore todas as automações em tempo real.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#039155]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Integração n8n nativa
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#039155]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Webhooks de entrada e saída
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#039155]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Logs de execução detalhados
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 5 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#18B0BB]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#18B0BB] to-[#039155]">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Monitoramento em Tempo Real</h3>
                <p className="mt-3 text-gray-600">
                  Acompanhe conversas ativas, identifique IA vs humano e tenha capacidade de intervenção manual quando necessário.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#18B0BB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Dashboard em tempo real
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#18B0BB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Intervenção manual instantânea
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#18B0BB]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Modo observador disponível
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 6 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#EC5429]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#EC5429] to-[#039155]">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Soberania de Dados</h3>
                <p className="mt-3 text-gray-600">
                  Multi-tenant com isolamento completo. Seus dados são seus. Auditoria completa de todas as ações, humanos e IA.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#EC5429]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Isolamento total por empresa
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#EC5429]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Row Level Security (RLS)
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-[#EC5429]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auditoria completa e imutável
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Como Funciona
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Três passos simples para transformar seu atendimento
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="relative">
                <div className="absolute left-0 top-0 -ml-4 -mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#039155] to-[#18B0BB] text-2xl font-bold text-white shadow-lg">
                  1
                </div>
                <div className="rounded-2xl bg-gray-50 p-8 pt-16">
                  <h3 className="text-xl font-semibold text-gray-900">Configure sua Empresa</h3>
                  <p className="mt-4 text-gray-600">
                    Crie sua conta gratuitamente e configure sua empresa em minutos. Sem necessidade de cartão de crédito.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 -ml-4 -mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#18B0BB] to-[#EC5429] text-2xl font-bold text-white shadow-lg">
                  2
                </div>
                <div className="rounded-2xl bg-gray-50 p-8 pt-16">
                  <h3 className="text-xl font-semibold text-gray-900">Conecte seus Canais</h3>
                  <p className="mt-4 text-gray-600">
                    Integre WhatsApp, email e outros canais. Configure automações e defina como a IA deve atuar.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 -ml-4 -mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#EC5429] to-[#039155] text-2xl font-bold text-white shadow-lg">
                  3
                </div>
                <div className="rounded-2xl bg-gray-50 p-8 pt-16">
                  <h3 className="text-xl font-semibold text-gray-900">Monitore e Controle</h3>
                  <p className="mt-4 text-gray-600">
                    Acompanhe tudo em tempo real, ajuste configurações e tenha controle total sobre cada interação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#039155] via-[#18B0BB] to-[#039155] py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Pronto para começar?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-white/90">
            Crie sua conta gratuitamente e comece a gerenciar seu negócio de forma inteligente hoje mesmo.
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-[#039155] shadow-2xl transition-all hover:scale-105 hover:shadow-3xl"
            >
              Criar Conta Grátis
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/80">
            Sem cartão de crédito • Setup em 5 minutos • Suporte incluído
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#039155] to-[#18B0BB]">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold">Controlia</span>
              </div>
              <p className="text-sm text-gray-400">
                Plataforma SaaS de CRM inteligente com controle total
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Produto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Empresa</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Suporte</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 Controlia CRM. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
