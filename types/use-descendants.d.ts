// The `use-descendants` package (a transitive dependency of Geist's menu and
// filter-menu components) ships no type declarations. This ambient declaration
// mirrors its public surface so the starter type-checks cleanly without
// modifying the vendored Geist package.
declare module "use-descendants" {
  import type { Context, MutableRefObject } from "react"

  export type ItemOptions<E extends HTMLElement = HTMLElement, T = unknown> = T & {
    element: E
    _internalId?: string
  }

  export interface Descendants<E extends HTMLElement, O> {
    ref: MutableRefObject<E | null>
    list: MutableRefObject<O[]>
    map: MutableRefObject<Record<string, O>>
    force: (value: unknown) => void
  }

  export function useDescendants<E extends HTMLElement = HTMLElement, O = unknown>(): Descendants<E, O>

  export function useDescendant<E extends HTMLElement = HTMLElement, T = unknown>(
    context: Context<unknown>,
    options?: T,
  ): { index: number; ref: MutableRefObject<E | null>; id: string | undefined }

  export function createDescendants<T = unknown>(): Context<T>

  export const useIsomorphicLayoutEffect: typeof import("react").useEffect
}
