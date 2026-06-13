import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 * Usado por shadcn/ui y componentes propios.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
