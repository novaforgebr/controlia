'use client'

import { useState } from 'react'

interface IntegrationTutorialModalProps {
  integration: 'whatsapp' | 'telegram' | 'email'
  isOpen: boolean
  onClose: () => void
}

const tutorials = {
  whatsapp: {
    title: 'Como configurar WhatsApp',
    steps: [
      {
        title: '1. Escolha um provedor de WhatsApp Business API',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Você precisa de um provedor que ofereça WhatsApp Business API. Algumas opções populares:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li><strong>Evolution API</strong> - Solução open-source e popular</li>
              <li><strong>Twilio</strong> - Solução comercial robusta</li>
              <li><strong>360dialog</strong> - Solução focada em WhatsApp</li>
              <li><strong>ChatAPI</strong> - Alternativa acessível</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Recomendação:</strong> Para começar, a Evolution API é uma boa opção por ser gratuita e open-source.
            </p>
          </div>
        ),
      },
      {
        title: '2. Configure sua instância do provedor',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Após escolher o provedor, você precisará:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li>Criar uma conta no provedor escolhido</li>
              <li>Configurar uma instância (instance) do WhatsApp</li>
              <li>Conectar seu número de WhatsApp à instância</li>
              <li>Obter as credenciais de API</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Dica:</strong> A maioria dos provedores oferece documentação detalhada e suporte para configuração inicial.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: '3. Obtenha a API URL',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              A API URL é o endpoint base da API do seu provedor. Exemplos:
            </p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs">
              <div className="text-gray-600">Evolution API:</div>
              <div className="text-gray-900">https://seu-servidor.com:8080</div>
              <div className="text-gray-600 mt-2">Twilio:</div>
              <div className="text-gray-900">https://api.twilio.com</div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Onde encontrar:</strong> Geralmente está na documentação do provedor ou no painel de administração.
            </p>
          </div>
        ),
      },
      {
        title: '4. Obtenha a API Key',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              A API Key é uma chave de autenticação única fornecida pelo provedor. Ela pode ser:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li>Uma string alfanumérica longa</li>
              <li>Um token JWT</li>
              <li>Uma combinação de usuário e senha</li>
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Importante:</strong> Mantenha sua API Key segura e nunca a compartilhe publicamente. Ela dá acesso total à sua conta.
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Onde encontrar:</strong> No painel do provedor, geralmente em &quot;Configurações&quot;, &quot;API&quot; ou &quot;Credenciais&quot;.
            </p>
          </div>
        ),
      },
      {
        title: '5. Configure o Webhook Secret',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              O Webhook Secret é usado para validar que as requisições realmente vêm do seu provedor. É uma string secreta que você define.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600 mb-2">Você pode gerar um secret seguro usando:</p>
              <div className="font-mono text-xs text-gray-900">
                openssl rand -hex 32
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Importante:</strong> Use o mesmo secret aqui e na configuração do webhook no seu provedor.
            </p>
          </div>
        ),
      },
      {
        title: '6. Configure o webhook no provedor',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Após preencher os campos acima, você precisa configurar o webhook no painel do seu provedor:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li>Acesse as configurações de webhook do provedor</li>
              <li>Configure a URL: <code className="bg-gray-100 px-1 rounded">https://seu-dominio.com/api/webhooks/whatsapp</code></li>
              <li>Configure o secret (mesmo valor que você colocou acima)</li>
              <li>Salve as configurações</li>
            </ul>
            <div className="mt-3 p-3 bg-green-50 rounded-md">
              <p className="text-xs text-green-800">
                <strong>Teste:</strong> Envie uma mensagem de teste para seu número do WhatsApp. Ela deve aparecer no sistema!
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  telegram: {
    title: 'Como configurar Telegram',
    steps: [
      {
        title: '1. Crie um bot no Telegram',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Para criar um bot, você precisa conversar com o <strong>@BotFather</strong> no Telegram:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li>Abra o Telegram e procure por <code className="bg-gray-100 px-1 rounded">@BotFather</code></li>
              <li>Inicie uma conversa e envie o comando <code className="bg-gray-100 px-1 rounded">/newbot</code></li>
              <li>Siga as instruções para escolher um nome e username para seu bot</li>
              <li>O BotFather retornará um <strong>Bot Token</strong> - guarde este token!</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Exemplo de token:</strong> <code className="bg-blue-100 px-1 rounded">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>
              </p>
            </div>
          </div>
        ),
      },
      {
        title: '2. Obtenha o Bot Token',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              O Bot Token é fornecido pelo BotFather após criar o bot. Ele tem o formato:
            </p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs text-gray-900">
              &lt;bot_id&gt;:&lt;token_secreto&gt;
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Onde encontrar:</strong> Na mensagem do BotFather após criar o bot, ou use o comando <code className="bg-gray-100 px-1 rounded">/token</code> no chat com o BotFather.
            </p>
            <div className="mt-3 p-3 bg-yellow-50 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Segurança:</strong> Mantenha este token seguro. Com ele, qualquer pessoa pode controlar seu bot.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: '3. Configure a Webhook URL',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              A Webhook URL é o endpoint público onde o Telegram enviará as mensagens recebidas pelo bot:
            </p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs text-gray-900">
              https://seu-dominio.com/api/webhooks/telegram
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Importante:</strong> Esta URL deve ser acessível publicamente na internet (não pode ser localhost).
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Dica:</strong> Se estiver em desenvolvimento, use ferramentas como ngrok para expor seu servidor local.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: '4. Configure o Webhook Secret',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              O Webhook Secret é uma string secreta que você define para validar as requisições:
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600 mb-2">Gere um secret seguro:</p>
              <div className="font-mono text-xs text-gray-900">
                openssl rand -hex 32
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Use uma string aleatória e segura. Este valor será usado para validar que as requisições realmente vêm do Telegram.
            </p>
          </div>
        ),
      },
      {
        title: '5. Configure o webhook no Telegram',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Após preencher os campos acima, configure o webhook usando a API do Telegram:
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600 mb-2">Faça uma requisição HTTP GET ou POST:</p>
              <div className="font-mono text-xs text-gray-900 break-all">
                https://api.telegram.org/bot&lt;SEU_BOT_TOKEN&gt;/setWebhook?url=&lt;SUA_WEBHOOK_URL&gt;
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Exemplo:</strong>
            </p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs text-gray-900 break-all">
              https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook?url=https://seu-dominio.com/api/webhooks/telegram
            </div>
            <div className="mt-3 p-3 bg-green-50 rounded-md">
              <p className="text-xs text-green-800">
                <strong>Teste:</strong> Envie uma mensagem para seu bot no Telegram. Ela deve aparecer no sistema!
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  email: {
    title: 'Como configurar Email (SMTP)',
    steps: [
      {
        title: '1. Escolha um provedor de email',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Você pode usar qualquer provedor que ofereça SMTP. Algumas opções:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li><strong>Gmail</strong> - smtp.gmail.com (porta 587)</li>
              <li><strong>Outlook/Hotmail</strong> - smtp-mail.outlook.com (porta 587)</li>
              <li><strong>SendGrid</strong> - smtp.sendgrid.net (porta 587)</li>
              <li><strong>Mailgun</strong> - smtp.mailgun.org (porta 587)</li>
              <li><strong>Amazon SES</strong> - email-smtp.region.amazonaws.com (porta 587)</li>
              <li><strong>Servidor próprio</strong> - Use o hostname do seu servidor</li>
            </ul>
          </div>
        ),
      },
      {
        title: '2. Obtenha o SMTP Host',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              O SMTP Host é o endereço do servidor de email. Exemplos comuns:
            </p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs space-y-1">
              <div className="text-gray-900">Gmail: smtp.gmail.com</div>
              <div className="text-gray-900">Outlook: smtp-mail.outlook.com</div>
              <div className="text-gray-900">SendGrid: smtp.sendgrid.net</div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Onde encontrar:</strong> Na documentação do seu provedor de email, geralmente em &quot;Configurações SMTP&quot; ou &quot;Configurações de envio&quot;.
            </p>
          </div>
        ),
      },
      {
        title: '3. Configure a Porta',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              A porta padrão para SMTP com TLS é <strong>587</strong>. Outras opções:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li><strong>587</strong> - TLS (recomendado, mais seguro)</li>
              <li><strong>465</strong> - SSL (antigo, ainda usado por alguns)</li>
              <li><strong>25</strong> - Sem criptografia (não recomendado)</li>
            </ul>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Recomendação:</strong> Use a porta 587 com TLS para maior segurança.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: '4. Escolha o tipo de segurança',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Escolha o tipo de criptografia:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li><strong>TLS</strong> - Transport Layer Security (recomendado, porta 587)</li>
              <li><strong>SSL</strong> - Secure Sockets Layer (antigo, porta 465)</li>
              <li><strong>Nenhum</strong> - Sem criptografia (não recomendado)</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Recomendação:</strong> Use TLS sempre que possível para proteger suas credenciais.
            </p>
          </div>
        ),
      },
      {
        title: '5. Configure usuário e senha',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Use as credenciais da sua conta de email:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li><strong>Usuário:</strong> Seu endereço de email completo (ex: seuemail@gmail.com)</li>
              <li><strong>Senha:</strong> Sua senha de email ou uma senha de aplicativo</li>
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Gmail:</strong> Se usar autenticação de dois fatores, você precisará criar uma &quot;Senha de App&quot; nas configurações da sua conta Google.
              </p>
            </div>
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Dica:</strong> Para maior segurança, use senhas de aplicativo específicas em vez da senha principal da conta.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: '6. Teste a configuração',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Após salvar as configurações, teste enviando um email:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-2">
              <li>Salve as configurações acima</li>
              <li>Use a funcionalidade de envio de email do sistema</li>
              <li>Verifique se o email foi recebido</li>
              <li>Verifique os logs em caso de erro</li>
            </ol>
            <div className="mt-3 p-3 bg-green-50 rounded-md">
              <p className="text-xs text-green-800">
                <strong>Sucesso:</strong> Se o email foi enviado e recebido, sua configuração está correta!
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
}

export function IntegrationTutorialModal({ integration, isOpen, onClose }: IntegrationTutorialModalProps) {
  if (!isOpen) return null

  const tutorial = tutorials[integration]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{tutorial.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            <div className="space-y-6">
              {tutorial.steps.map((step, index) => (
                <div key={index} className="border-l-4 border-[#039155] pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <div className="text-gray-600">
                    {step.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Entendi, fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

