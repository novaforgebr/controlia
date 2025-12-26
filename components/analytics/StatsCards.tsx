'use client'

interface StatsCardsProps {
  totalContacts: number
  totalConversations: number
  totalMessages: number
  activeConversations: number
  aiMessagesCount: number
}

export function StatsCards({
  totalContacts,
  totalConversations,
  totalMessages,
  activeConversations,
  aiMessagesCount,
}: StatsCardsProps) {
  const cards = [
    {
      title: 'Total de Contatos',
      value: totalContacts.toLocaleString('pt-BR'),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Conversas',
      value: totalConversations.toLocaleString('pt-BR'),
      subtitle: `${activeConversations} ativas`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'Mensagens',
      value: totalMessages.toLocaleString('pt-BR'),
      subtitle: `${aiMessagesCount} da IA`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Taxa de Resposta IA',
      value: totalMessages > 0 ? `${((aiMessagesCount / totalMessages) * 100).toFixed(1)}%` : '0%',
      subtitle: 'Automação ativa',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-[#039155] to-[#18B0BB]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-900 p-4 md:p-6 shadow-lg dark:shadow-gray-900/50 transition-transform hover:scale-105 border border-gray-200 dark:border-gray-800"
        >
          <div className={`absolute top-0 right-0 h-16 w-16 md:h-20 md:w-20 rounded-bl-full bg-gradient-to-br ${card.gradient} opacity-10`} />
          <div className="relative">
            <div className={`inline-flex rounded-lg bg-gradient-to-br ${card.gradient} p-2 md:p-3 text-white`}>
              {card.icon}
            </div>
            <div className="mt-3 md:mt-4">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
              <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              {card.subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

