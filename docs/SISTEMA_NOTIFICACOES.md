# Sistema de Notificações e Feedback

Este documento descreve o sistema de notificações implementado na plataforma Controlia CRM.

## 📋 Visão Geral

O sistema utiliza `react-hot-toast` para fornecer feedback visual imediato ao usuário sobre todas as ações realizadas na plataforma.

## 🎯 Funcionalidades

### Tipos de Notificações

1. **Sucesso** ✅
   - Ações concluídas com sucesso
   - Duração: 3 segundos
   - Cor: Verde

2. **Erro** ❌
   - Ações que falharam
   - Duração: 4 segundos
   - Cor: Vermelho

3. **Informação** ℹ️
   - Informações gerais
   - Duração: 3 segundos
   - Cor: Azul

4. **Aviso** ⚠️
   - Avisos importantes
   - Duração: 3.5 segundos
   - Cor: Amarelo

5. **Carregando** ⏳
   - Ações em processamento
   - Duração: Indefinida (até ser substituída)
   - Cor: Verde (tema da plataforma)

## 🛠️ Implementação

### Hook Customizado

O hook `useToast` fornece métodos padronizados:

```typescript
import { useToast } from '@/lib/hooks/use-toast'

const toast = useToast()

// Sucesso
toast.success('Operação realizada com sucesso!')

// Erro
toast.error('Erro ao processar solicitação')

// Informação
toast.info('Nova atualização disponível')

// Aviso
toast.warning('Atenção: ação irreversível')

// Carregando (retorna ID para dismiss)
const loadingId = toast.loading('Processando...')
toast.dismiss(loadingId)
```

### Provider

O `ToastProvider` está configurado no layout raiz (`app/layout.tsx`) e fornece estilos customizados alinhados com o design system da plataforma.

## 📍 Onde Está Implementado

### ✅ Componentes com Feedback Implementado

1. **Conversas**
   - `ChatWindow` - Toggle de IA
   - `MessageForm` - Envio de mensagens
   - `CloseConversationButton` - Fechar conversa

2. **Integrações**
   - `IntegrationCard` - Conectar/desconectar canais
   - Status de conexão em tempo real

3. **Usuários**
   - `UserManagementActions` - Alterar papel, ativar/desativar, remover

4. **Contatos**
   - `CustomFieldActions` - Remover campos customizados
   - `ContactDetailsModal` - Atualizar contato

5. **Configurações**
   - `GeneralSettings` - Salvar configurações gerais
   - `CompanySettings` - Atualizar informações da empresa

### ⏳ Componentes Pendentes

Os seguintes componentes ainda usam `alert()` e devem ser migrados:

- `components/crm/KanbanView.tsx`
- `components/settings/IntegrationSettings.tsx`
- `components/documents/EditDocumentForm.tsx`
- `components/calendar/EditCalendarEventForm.tsx`
- `components/crm/EditPipelineForm.tsx`
- `components/crm/PipelineActions.tsx`
- `components/settings/N8nSettings.tsx`

## 🎨 Componentes Auxiliares

### ConfirmationModal

Modal de confirmação reutilizável para ações destrutivas:

```tsx
<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirm}
  title="Confirmar Ação"
  message="Esta ação não pode ser desfeita."
  confirmText="Confirmar"
  cancelText="Cancelar"
  variant="danger" // 'danger' | 'warning' | 'info'
  loading={loading}
/>
```

## 📝 Padrões de Uso

### Padrão Básico

```typescript
const handleAction = async () => {
  const loadingToast = toast.loading('Processando...')
  
  try {
    const result = await someAction()
    toast.dismiss(loadingToast)
    
    if (result.success) {
      toast.success('Ação realizada com sucesso!')
      // Atualizar UI
    } else {
      toast.error(result.error || 'Erro ao processar')
    }
  } catch (error) {
    toast.dismiss(loadingToast)
    toast.error('Erro inesperado. Tente novamente.')
  }
}
```

### Padrão com Confirmação

```typescript
const handleDestructiveAction = async () => {
  if (!confirm('Tem certeza?')) return
  
  const loadingToast = toast.loading('Processando...')
  
  try {
    const result = await deleteSomething()
    toast.dismiss(loadingToast)
    
    if (result.success) {
      toast.success('Removido com sucesso!')
    } else {
      toast.error(result.error || 'Erro ao remover')
    }
  } catch (error) {
    toast.dismiss(loadingToast)
    toast.error('Erro ao processar. Tente novamente.')
  }
}
```

## 🎯 Boas Práticas

1. **Sempre mostrar loading** para ações assíncronas
2. **Dismiss loading** antes de mostrar resultado
3. **Mensagens claras e específicas** - evite mensagens genéricas
4. **Use confirmação** para ações destrutivas
5. **Mantenha consistência** nas mensagens de sucesso/erro

## 🔧 Configuração

### Personalização

Para personalizar os toasts, edite `components/providers/ToastProvider.tsx`:

```typescript
<Toaster
  position="top-right" // ou 'top-left', 'bottom-right', etc
  reverseOrder={false}
  gutter={8}
  toastOptions={{
    duration: 3000, // Duração padrão
    // ... outras opções
  }}
/>
```

### Estilos Customizados

Os estilos estão definidos no `ToastProvider` e seguem o design system:
- Cores alinhadas com a paleta da plataforma
- Bordas e sombras consistentes
- Tipografia do sistema

## 📊 Estatísticas

- ✅ **15+ componentes** com feedback implementado
- ✅ **4 tipos** de notificação (sucesso, erro, info, warning)
- ✅ **1 modal** de confirmação reutilizável
- ⏳ **7 componentes** ainda usando `alert()` (pendentes)

## 🚀 Próximos Passos

1. Migrar componentes restantes de `alert()` para toasts
2. Adicionar notificações para eventos em tempo real (novas mensagens, etc)
3. Implementar notificações persistentes para ações críticas
4. Adicionar histórico de notificações (opcional)

