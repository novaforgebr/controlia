import { getAIPrompt, updateAIPrompt } from '@/app/actions/ai-prompts'
import { notFound, redirect } from 'next/navigation'
import ProtectedLayout from '@/app/layout-protected'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PromptEditor } from '@/components/ai/PromptEditor'

export default async function EditAIPromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prompt = await getAIPrompt(id)

  if (!prompt) {
    notFound()
  }

  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await updateAIPrompt(id, formData)
    if (result.success) {
      redirect(`/ai/prompts/${id}`)
    }
    // Retornar o resultado para o componente verificar
    return result
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-4 md:py-8 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <Breadcrumb
            items={[
              { label: 'IA', href: '/ai' },
              { label: 'Prompts', href: '/ai/prompts' },
              { label: prompt.name, href: `/ai/prompts/${prompt.id}` },
              { label: 'Editar' },
            ]}
          />
        </div>
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Editar Prompt de IA</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">Atualize as informações do prompt</p>
        </div>

        <PromptEditor prompt={prompt} onSubmit={handleSubmit} />
      </div>
    </ProtectedLayout>
  )
}

