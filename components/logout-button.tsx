"use client"

import type { ComponentProps, MouseEvent } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"

type LogoutButtonProps = ComponentProps<typeof Button>

export function LogoutButton({ children, onClick, ...props }: LogoutButtonProps) {
  const router = useRouter()

  const logout = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) {
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Button onClick={logout} {...props}>
      {children ?? "Logout"}
    </Button>
  )
}
