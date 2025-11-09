"use client"

import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"

type LogoutButtonProps = ComponentProps<typeof Button>

export function LogoutButton({ children, onClick, ...props }: LogoutButtonProps) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClick?.()
    router.push("/auth/login")
  }

  return (
    <Button onClick={logout} {...props}>
      {children ?? "Logout"}
    </Button>
  )
}
