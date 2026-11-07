import type { ApiResponse, Paginated } from "@/Redex/types/Types"

export function unwrapResult<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "result" in (res as object)) {
    const r = res as ApiResponse<T>
    if (r.result !== undefined) return r.result
  }
  if (res && typeof res === "object" && "data" in (res as object)) {
    const r = res as ApiResponse<T>
    if (r.data !== undefined) return r.data as T
  }
  return res as T
}

export function unwrapList<T>(res: ApiResponse<Paginated<T> | T[]> | Paginated<T> | T[]): T[] {
  const raw = unwrapResult(res as ApiResponse<Paginated<T> | T[]>)
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object" && Array.isArray((raw as Paginated<T>).items)) {
    return (raw as Paginated<T>).items
  }
  return []
}

export function unwrapPaginated<T>(
  res: ApiResponse<Paginated<T>> | Paginated<T>
): Paginated<T> {
  const raw = unwrapResult(res as ApiResponse<Paginated<T>>)
  if (raw && typeof raw === "object" && Array.isArray((raw as Paginated<T>).items)) {
    return raw as Paginated<T>
  }
  return {
    items: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  }
}
