export function defer<T extends () => void | Promise<void>>(
  fn: T,
): Disposable {
  return {
    [Symbol.dispose]() {
      fn()
    },
  }
}
