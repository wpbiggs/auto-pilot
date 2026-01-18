export function defer<T extends () => void | Promise<void>>(
  fn: T,
): Disposable & AsyncDisposable {
  return {
    [Symbol.dispose]() {
      fn()
    },
    [Symbol.asyncDispose]() {
      return Promise.resolve(fn())
    },
  }
}
