'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import type { AIPrompt } from '@/lib/types/database'

interface PromptEditorProps {
  prompt?: AIPrompt | null
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: string } | void>
}

export function PromptEditor({ prompt, onSubmit }: PromptEditorProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: prompt?.name || '',
    description: prompt?.description || '',
    prompt_text: prompt?.prompt_text || '',
    system_prompt: prompt?.system_prompt || '',
    model: prompt?.model || 'gpt-4',
    temperature: prompt?.temperature?.toString() || '0.7',
    max_tokens: prompt?.max_tokens?.toString() || '1000',
    context_type: prompt?.context_type || '',
    channel: prompt?.channel || '',
    constraints: prompt?.constraints || '',
    is_active: prompt?.is_active ?? true,
    is_default: prompt?.is_default ?? false,
    allowed_actions: prompt?.allowed_actions || [],
    forbidden_actions: prompt?.forbidden_actions || [],
  })

  const [allowedActionsText, setAllowedActionsText] = useState(
    Array.isArray(formData.allowed_actions) ? formData.allowed_actions.join('\n') : ''
  )
  const [forbiddenActionsText, setForbiddenActionsText] = useState(
    Array.isArray(formData.forbidden_actions) ? formData.forbidden_actions.join('\n') : ''
  )

  const toast = useToast()

  // Atualizar estado quando prompt mudar
  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name || '',
        description: prompt.description || '',
        prompt_text: prompt.prompt_text || '',
        system_prompt: prompt.system_prompt || '',
        model: prompt.model || 'gpt-4',
        temperature: prompt.temperature?.toString() || '0.7',
        max_tokens: prompt.max_tokens?.toString() || '1000',
        context_type: prompt.context_type || '',
        channel: prompt.channel || '',
        constraints: prompt.constraints || '',
        is_active: prompt.is_active ?? true,
        is_default: prompt.is_default ?? false,
        allowed_actions: prompt.allowed_actions || [],
        forbidden_actions: prompt.forbidden_actions || [],
      })
      setAllowedActionsText(
        Array.isArray(prompt.allowed_actions) ? prompt.allowed_actions.join('\n') : ''
      )
      setForbiddenActionsText(
        Array.isArray(prompt.forbidden_actions) ? prompt.forbidden_actions.join('\n') : ''
      )
    }
  }, [prompt])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const form = new FormData()
      
      // Campos básicos
      form.append('name', formData.name)
      form.append('description', formData.description)
      form.append('prompt_text', formData.prompt_text)
      form.append('system_prompt', formData.system_prompt)
      form.append('model', formData.model)
      form.append('temperature', formData.temperature)
      form.append('max_tokens', formData.max_tokens)
      form.append('context_type', formData.context_type)
      form.append('channel', formData.channel)
      form.append('constraints', formData.constraints)
      form.append('is_active', formData.is_active.toString())
      form.append('is_default', formData.is_default.toString())

      // Arrays de ações
      const allowedActions = allowedActionsText
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
      form.append('allowed_actions', JSON.stringify(allowedActions))

      const forbiddenActions = forbiddenActionsText
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
      form.append('forbidden_actions', JSON.stringify(forbiddenActions))

      try {
        const result = await onSubmit(form)
        
        // Verificar o resultado retornado
        if (result) {
          if ('error' in result && result.error) {
            toast.error(result.error || 'Erro ao salvar prompt. Tente novamente.')
            return
          }
          if ('success' in result && result.success) {
            // Sucesso - o redirect será feito pela Server Action
            toast.success(prompt ? 'Prompt atualizado com sucesso!' : 'Prompt criado com sucesso!')
            return
          }
        }
        
        // Se não retornou resultado, pode ser que o redirect tenha acontecido
        // Não mostrar erro, apenas sucesso silencioso
        toast.success(prompt ? 'Prompt atualizado com sucesso!' : 'Prompt criado com sucesso!')
      } catch (error: any) {
        // Next.js redirect() lança uma exceção especial com digest 'NEXT_REDIRECT'
        // Se for um redirect, não é um erro real - é sucesso!
        if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message?.includes('NEXT_REDIRECT')) {
          // Redirect aconteceu, sucesso!
          toast.success(prompt ? 'Prompt atualizado com sucesso!' : 'Prompt criado com sucesso!')
          return
        }
        // Se for outro tipo de erro, mostrar
        console.error('Erro ao salvar prompt:', error)
        toast.error('Erro ao salvar prompt. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao salvar prompt:', error)
      toast.error('Erro ao salvar prompt. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white dark:bg-gray-900 p-6 shadow dark:shadow-gray-900/50">
      <div className="grid grid-cols-1 gap-6">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
          />
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descrição
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            placeholder="Descreva o propósito deste prompt..."
          />
        </div>

        {/* Contexto e Canal */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="context_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Contexto
            </label>
            <select
              id="context_type"
              value={formData.context_type}
              onChange={(e) => setFormData({ ...formData, context_type: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Selecione...</option>
              <option value="conversation">Conversa</option>
              <option value="contact">Contato</option>
              <option value="general">Geral</option>
            </select>
          </div>

          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Canal
            </label>
            <select
              id="channel"
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            >
              <option value="">Todos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
            </select>
          </div>
        </div>

        {/* Texto do Prompt */}
        <div>
          <label htmlFor="prompt_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Texto do Prompt <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <textarea
              id="prompt_text"
              value={formData.prompt_text}
              onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
              rows={12}
              required
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono leading-relaxed"
              placeholder="Ex: Você é um assistente virtual especializado em atendimento ao cliente..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use formatação de texto simples. Variáveis podem ser inseridas como {'{variável}'}.
            </p>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            System Prompt (Opcional)
          </label>
          <textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
            rows={6}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
            placeholder="Instruções do sistema que serão enviadas antes do prompt principal..."
          />
        </div>

        {/* Configurações do Modelo */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Modelo
            </label>
            <input
              type="text"
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>

          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Temperature (0-2)
            </label>
            <input
              type="number"
              id="temperature"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>

          <div>
            <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Tokens
            </label>
            <input
              type="number"
              id="max_tokens"
              min="1"
              value={formData.max_tokens}
              onChange={(e) => setFormData({ ...formData, max_tokens: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            />
          </div>
        </div>

        {/* Constraints */}
        <div>
          <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Restrições e Regras
          </label>
          <textarea
            id="constraints"
            value={formData.constraints}
            onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20"
            placeholder="Regras adicionais que a IA deve seguir..."
          />
        </div>

        {/* Ações Permitidas */}
        <div>
          <label htmlFor="allowed_actions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ações Permitidas (uma por linha)
          </label>
          <textarea
            id="allowed_actions"
            value={allowedActionsText}
            onChange={(e) => setAllowedActionsText(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
            placeholder="responder_mensagem&#10;buscar_informacao&#10;agendar_consulta"
          />
        </div>

        {/* Ações Proibidas */}
        <div>
          <label htmlFor="forbidden_actions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ações Proibidas (uma por linha)
          </label>
          <textarea
            id="forbidden_actions"
            value={forbiddenActionsText}
            onChange={(e) => setForbiddenActionsText(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20 font-mono"
            placeholder="deletar_conversa&#10;alterar_preco&#10;cancelar_pedido"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155] dark:bg-gray-800"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Ativo</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-700 text-[#039155] focus:ring-[#039155] dark:bg-gray-800"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Padrão</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-gray-200 dark:border-gray-800 pt-6">
        <a
          href={prompt ? `/ai/prompts/${prompt.id}` : '/ai/prompts'}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : prompt ? 'Atualizar Prompt' : 'Criar Prompt'}
        </button>
      </div>
    </form>
  )
}

