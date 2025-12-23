'use client'

import { useState } from 'react'
import { updateUserRole, toggleUserStatus, removeUser } from '@/app/actions/users'
import { useRouter } from 'next/navigation'

interface UserManagementActionsProps {
  companyUserId: string
  currentRole: string
  isActive: boolean
}

export function UserManagementActions({
  companyUserId,
  currentRole,
  isActive,
}: UserManagementActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const router = useRouter()

  const handleRoleChange = async (newRole: string) => {
    setLoading(true)
    const result = await updateUserRole(companyUserId, newRole)
    setLoading(false)
    setShowRoleMenu(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Erro ao atualizar papel')
    }
  }

  const handleToggleStatus = async () => {
    setLoading(true)
    const result = await toggleUserStatus(companyUserId, !isActive)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Erro ao atualizar status')
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    const result = await removeUser(companyUserId)
    setLoading(false)
    setShowRemoveConfirm(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Erro ao remover usuário')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Menu de papel */}
      <div className="relative">
        <button
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Alterar Papel
        </button>
        {showRoleMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowRoleMenu(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={() => handleRoleChange('admin')}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Administrador
                </button>
                <button
                  onClick={() => handleRoleChange('operator')}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Operador
                </button>
                <button
                  onClick={() => handleRoleChange('observer')}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Observador
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toggle status */}
      <button
        onClick={handleToggleStatus}
        disabled={loading}
        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
      >
        {isActive ? 'Desativar' : 'Ativar'}
      </button>

      {/* Remover */}
      <button
        onClick={() => setShowRemoveConfirm(true)}
        disabled={loading}
        className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
      >
        Remover
      </button>

      {/* Confirmação de remoção */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar Remoção</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tem certeza que deseja remover este usuário da empresa?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

