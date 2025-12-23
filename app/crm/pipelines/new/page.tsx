import ProtectedLayout from '@/app/layout-protected'
import { NewPipelineForm } from '@/components/crm/NewPipelineForm'

export default function NewPipelinePage() {
  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a
            href="/crm/pipelines"
            className="text-sm font-medium text-gray-600 hover:text-[#039155] transition-colors"
          >
            ← Voltar para pipelines
          </a>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Novo Pipeline</h1>
          <p className="mt-2 text-sm text-gray-600">Crie um novo pipeline de vendas</p>
        </div>

        <NewPipelineForm />
      </div>
    </ProtectedLayout>
  )
}

