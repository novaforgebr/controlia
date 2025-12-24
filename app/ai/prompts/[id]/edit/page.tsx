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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'IA', href: '/ai' },
            { label: 'Prompts', href: '/ai/prompts' },
            { label: prompt.name, href: `/ai/prompts/${prompt.id}` },
            { label: 'Editar' },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Prompt de IA</h1>
          <p className="mt-2 text-gray-600">Atualize as informações do prompt</p>
        </div>

        <PromptEditor prompt={prompt} onSubmit={handleSubmit} />
      </div>
    </ProtectedLayout>
  )
}

