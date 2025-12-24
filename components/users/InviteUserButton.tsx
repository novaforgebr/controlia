'use client'

import { useState } from 'react'
import { InviteUserModal } from './InviteUserModal'

export function InviteUserButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="rounded-md bg-gradient-to-r from-[#039155] to-[#18B0BB] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
      >
        + Convidar Usuário
      </button>
      <InviteUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

