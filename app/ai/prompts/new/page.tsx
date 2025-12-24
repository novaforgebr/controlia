import { createAIPrompt } from '@/app/actions/ai-prompts'
import { redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PromptEditor } from '@/components/ai/PromptEditor'

export default function NewAIPromptPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createAIPrompt(formData)
    if (result.success) {
      redirect('/ai/prompts')
    }
    // Se chegou aqui, houve erro - retornar para o componente tratar
    return result
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'IA', href: '/ai' },
            { label: 'Prompts', href: '/ai/prompts' },
            { label: 'Novo Prompt' },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Novo Prompt de IA</h1>
          <p className="mt-2 text-gray-600">Crie um novo prompt para inteligência artificial</p>
        </div>

        <PromptEditor onSubmit={handleSubmit} />
      </div>
    </ProtectedLayout>
  )
}
