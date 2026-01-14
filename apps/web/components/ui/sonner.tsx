"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system", resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Use resolvedTheme which is the actual theme being used
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group !z-[999999]"
      toastOptions={{
        classNames: {
          toast: "!bg-white dark:!bg-gray-900 !text-gray-900 dark:!text-gray-100 !border !border-gray-200 dark:!border-gray-800 !shadow-lg !z-[999999]",
          success: "!bg-green-50 dark:!bg-green-900/20 !text-green-900 dark:!text-green-100 !border-green-200 dark:!border-green-800",
          error: "!bg-red-50 dark:!bg-red-900/20 !text-red-900 dark:!text-red-100 !border-red-200 dark:!border-red-800",
          info: "!bg-blue-50 dark:!bg-blue-900/20 !text-blue-900 dark:!text-blue-100 !border-blue-200 dark:!border-blue-800",
          warning: "!bg-yellow-50 dark:!bg-yellow-900/20 !text-yellow-900 dark:!text-yellow-100 !border-yellow-200 dark:!border-yellow-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
