import { realpathSync, existsSync } from "fs"
import { exists } from "fs/promises"
import { dirname, join, relative, isAbsolute } from "path"

export namespace Filesystem {
  /**
   * On Windows, normalize a path to its canonical casing using the filesystem.
   * This is needed because Windows paths are case-insensitive but LSP servers
   * may return paths with different casing than what we send them.
   */
  export function normalizePath(p: string): string {
    if (process.platform !== "win32") return p
    try {
      return realpathSync.native(p)
    } catch {
      return p
    }
  }
  export function overlaps(a: string, b: string) {
    const relA = relative(a, b)
    const relB = relative(b, a)
    return !relA || !relA.startsWith("..") || !relB || !relB.startsWith("..")
  }

  export function contains(parent: string, child: string) {
    try {
      // Resolve the parent path to its canonical form
      const realParent = existsSync(parent) ? realpathSync(parent) : parent

      // Resolve the child path to its physical location
      let realChild = child
      if (existsSync(child)) {
        realChild = realpathSync(child)
      } else {
        // If child doesn't exist, resolve its closest existing ancestor
        // to detect if we are traversing out via a symlinked directory.
        let current = child
        while (current !== "." && current !== "/") {
          const dir = dirname(current)
          if (dir === current) break
          if (existsSync(dir)) {
            const realDir = realpathSync(dir)
            const suffix = relative(dir, child)
            realChild = join(realDir, suffix)
            break
          }
          current = dir
        }
      }

      const rel = relative(realParent, realChild)
      return !rel.startsWith("..") && !isAbsolute(rel)
    } catch {
      return false
    }
  }

  export async function findUp(target: string, start: string, stop?: string) {
    let current = start
    const result = []
    while (true) {
      const search = join(current, target)
      if (await exists(search).catch(() => false)) result.push(search)
      if (stop === current) break
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
    return result
  }

  export async function* up(options: { targets: string[]; start: string; stop?: string }) {
    const { targets, start, stop } = options
    let current = start
    while (true) {
      for (const target of targets) {
        const search = join(current, target)
        if (await exists(search).catch(() => false)) yield search
      }
      if (stop === current) break
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
  }

  export async function globUp(pattern: string, start: string, stop?: string) {
    let current = start
    const result = []
    while (true) {
      try {
        const glob = new Bun.Glob(pattern)
        for await (const match of glob.scan({
          cwd: current,
          absolute: true,
          onlyFiles: true,
          followSymlinks: true,
          dot: true,
        })) {
          result.push(match)
        }
      } catch {
        // Skip invalid glob patterns
      }
      if (stop === current) break
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
    return result
  }
}
