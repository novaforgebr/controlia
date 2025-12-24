# Implementação do Modo Escuro

Este documento descreve a implementação do modo escuro (dark mode) na plataforma Controlia CRM.

## ✅ Componentes Implementados

### 1. Sistema Base
- ✅ `lib/hooks/use-theme.ts` - Hook para gerenciar tema
- ✅ `components/providers/ThemeProvider.tsx` - Provider do tema
- ✅ `components/ui/ThemeToggle.tsx` - Componente toggle
- ✅ `tailwind.config.ts` - Configurado com `darkMode: 'class'`
- ✅ `app/globals.css` - Variáveis CSS para dark mode
- ✅ `app/layout.tsx` - ThemeProvider integrado

### 2. Componentes de Layout
- ✅ `components/layout/Sidebar.tsx` - Sidebar com dark mode
- ✅ `components/layout/SidebarLayout.tsx` - Layout com dark mode e ThemeToggle no header
- ✅ `components/ui/Select.tsx` - Select padronizado com dark mode e seta customizada

## 📋 Padrão de Classes Dark Mode

### Cores Principais

```tsx
// Backgrounds
bg-white dark:bg-gray-900
bg-gray-50 dark:bg-gray-950
bg-gray-100 dark:bg-gray-800

// Textos
text-gray-900 dark:text-gray-100
text-gray-700 dark:text-gray-300
text-gray-600 dark:text-gray-400
text-gray-500 dark:text-gray-500

// Bordas
border-gray-200 dark:border-gray-800
border-gray-300 dark:border-gray-700

// Hover states
hover:bg-gray-100 dark:hover:bg-gray-800
hover:text-gray-900 dark:hover:text-gray-100
```

### Exemplo de Componente

```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
  <h2 className="text-gray-900 dark:text-gray-100 font-semibold">
    Título
  </h2>
  <p className="text-gray-600 dark:text-gray-400">
    Descrição
  </p>
</div>
```

## 🔄 Componentes que Precisam Atualização

### Páginas Principais
- [ ] `app/dashboard/page.tsx`
- [ ] `app/contacts/page.tsx`
- [ ] `app/conversations/page.tsx`
- [ ] `app/users/page.tsx`
- [ ] `app/ai/page.tsx`
- [ ] `app/crm/page.tsx`
- [ ] `app/settings/page.tsx`

### Componentes de UI
- [ ] `components/ui/Button.tsx` (se existir)
- [ ] `components/ui/Input.tsx` (se existir)
- [ ] `components/ui/Card.tsx` (se existir)
- [ ] `components/ui/Modal.tsx` (se existir)

### Componentes de Módulos
- [ ] `components/contacts/*`
- [ ] `components/conversations/*`
- [ ] `components/ai/*`
- [ ] `components/crm/*`
- [ ] `components/settings/*`
- [ ] `components/integrations/*`

## 🎨 Select Component - Padrão

O componente `Select` foi atualizado com:
- ✅ Seta customizada posicionada corretamente
- ✅ Estilos para dark mode
- ✅ Transições suaves
- ✅ Estados de foco e erro

### Uso

```tsx
import { Select } from '@/components/ui/Select'

<Select
  label="Escolha uma opção"
  id="select-example"
  className="w-full"
>
  <option value="">Selecione...</option>
  <option value="1">Opção 1</option>
  <option value="2">Opção 2</option>
</Select>
```

## 🚀 Como Aplicar Dark Mode em Novos Componentes

1. **Identifique elementos que precisam de dark mode:**
   - Backgrounds (`bg-*`)
   - Textos (`text-*`)
   - Bordas (`border-*`)
   - Shadows (geralmente não precisam mudar)

2. **Adicione classes dark:**
   ```tsx
   // Antes
   className="bg-white text-gray-900 border-gray-200"
   
   // Depois
   className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800"
   ```

3. **Mantenha consistência:**
   - Use as mesmas cores em componentes similares
   - Siga o padrão estabelecido

## 📝 Checklist de Atualização

Para cada componente:

- [ ] Backgrounds atualizados
- [ ] Textos atualizados
- [ ] Bordas atualizadas
- [ ] Estados hover/focus atualizados
- [ ] Estados disabled atualizados
- [ ] Testado em modo claro
- [ ] Testado em modo escuro

## 🔍 Localização do Toggle

O toggle de tema está localizado no header do `SidebarLayout`, ao lado do nome da empresa e botão de sair.

## 💡 Dicas

1. **Gradientes:** Mantenha os gradientes da marca (`from-[#039155] to-[#18B0BB]`) em ambos os modos
2. **Contraste:** Garanta contraste adequado em ambos os modos
3. **Transições:** Use `transition-colors` para transições suaves
4. **Testes:** Teste sempre em ambos os modos antes de finalizar

## 🐛 Troubleshooting

### Tema não está aplicando
- Verifique se `ThemeProvider` está no `layout.tsx`
- Verifique se `darkMode: 'class'` está no `tailwind.config.ts`
- Verifique se a classe `dark` está sendo adicionada ao `<html>`

### Flash de conteúdo não estilizado
- O `ThemeProvider` já previne isso com o estado `mounted`
- Se persistir, verifique a ordem de carregamento dos scripts

