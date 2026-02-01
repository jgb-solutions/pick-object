export type SelectShape<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? SelectShape<U> | true
    : T[K] extends object
      ? SelectShape<T[K]> | true
      : true
}

export type Selected<T, S> = {
  [K in keyof S & keyof T]:
    S[K] extends true
      ? T[K]
      : T[K] extends (infer U)[]
        ? S[K] extends object
          ? Selected<U, S[K]>[]
          : never
        : T[K] extends object
          ? S[K] extends object
            ? Selected<T[K], S[K]>
            : never
          : never
}

export function pick<T, S extends SelectShape<T>>(
  data: T,
  selection: S
): Selected<T, S> {
  // ultra-fast exit
  if (!data || !selection) return {} as any

  // allocate once
  const out: any = {}

  for (const key in selection) {
    const rule = selection[key]
    if (rule == null) continue

    const value = (data as any)[key]
    if (value == null) continue

    // hot path: true
    if (rule === true) {
      out[key] = value
      continue
    }

    // array path
    if (Array.isArray(value)) {
      const len = value.length
      if (len === 0) {
        out[key] = value
        continue
      }

      const arr = new Array(len)
      for (let i = 0; i < len; i++) {
        arr[i] = pick(value[i], rule as any)
      }

      out[key] = arr
      continue
    }

    // object path
    if (typeof value === 'object') {
      out[key] = pick(value, rule as any)
    }
  }

  return out
}
