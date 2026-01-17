/**
 * CodebaseSelector Component
 * 
 * Allows users to browse and select files/folders from their existing codebase
 * for the AI to analyze and work with.
 */

import { createSignal, createEffect, For, Show, onMount } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import type { FileNode } from "@opencode-ai/sdk"
import { useGlobalSDK } from "@/context/global-sdk"

export interface SelectedFile {
  path: string
  type: "file" | "directory"
  name: string
}

export interface CodebaseContext {
  selectedFiles: SelectedFile[]
  rootPath: string
  projectType?: string
  detectedTechStack?: string[]
  fileStats?: {
    totalFiles: number
    totalDirectories: number
    languages: { [key: string]: number }
  }
}

interface CodebaseSelectorProps {
  onSelectionChange: (context: CodebaseContext) => void
  initialSelection?: SelectedFile[]
}

export function CodebaseSelector(props: CodebaseSelectorProps) {
  const sdk = useGlobalSDK()
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [currentPath, setCurrentPath] = createSignal("")
  const [files, setFiles] = createSignal<FileNode[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")
  const [selectedFiles, setSelectedFiles] = createSignal<SelectedFile[]>(props.initialSelection ?? [])
  const [searchQuery, setSearchQuery] = createSignal("")
  const [searchResults, setSearchResults] = createSignal<string[]>([])
  const [analyzing, setAnalyzing] = createSignal(false)
  const [rootPath, setRootPath] = createSignal("")
  const [techStack, setTechStack] = createSignal<string[]>([])

  // Load root directory on mount
  onMount(async () => {
    await loadDirectory("")
    await detectProjectInfo()
  })

  // Load directory contents
  const loadDirectory = async (path: string) => {
    setLoading(true)
    setError("")
    
    try {
      const result = await sdk.client.file.list({ path: path || "." })
      
      if (result.data) {
        // Sort: directories first, then files, alphabetically
        const sorted = [...result.data].sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })
        setFiles(sorted)
        setCurrentPath(path)
        
        // Store root path on first load
        if (!rootPath() && result.data.length > 0) {
          const firstFile = result.data[0]
          // Extract root from absolute path
          const absPath = firstFile.absolute
          const relativePath = firstFile.path
          if (absPath.endsWith(relativePath)) {
            setRootPath(absPath.slice(0, -relativePath.length).replace(/\/$/, ""))
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load directory")
    } finally {
      setLoading(false)
    }
  }

  // Detect project type and tech stack
  const detectProjectInfo = async () => {
    try {
      // Check for common config files
      const configChecks = [
        { file: "package.json", tech: ["Node.js", "JavaScript/TypeScript"] },
        { file: "tsconfig.json", tech: ["TypeScript"] },
        { file: "pyproject.toml", tech: ["Python"] },
        { file: "requirements.txt", tech: ["Python"] },
        { file: "Cargo.toml", tech: ["Rust"] },
        { file: "go.mod", tech: ["Go"] },
        { file: "pom.xml", tech: ["Java", "Maven"] },
        { file: "build.gradle", tech: ["Java", "Gradle"] },
        { file: "Gemfile", tech: ["Ruby"] },
        { file: "composer.json", tech: ["PHP"] },
        { file: "next.config.js", tech: ["Next.js", "React"] },
        { file: "next.config.mjs", tech: ["Next.js", "React"] },
        { file: "vite.config.ts", tech: ["Vite"] },
        { file: "tailwind.config.js", tech: ["Tailwind CSS"] },
        { file: "docker-compose.yml", tech: ["Docker"] },
        { file: "Dockerfile", tech: ["Docker"] },
      ]

      const detectedTech = new Set<string>()

      for (const check of configChecks) {
        try {
          const result = await sdk.client.file.read({ path: check.file })
          if (result.data) {
            check.tech.forEach(t => detectedTech.add(t))
          }
        } catch {
          // File doesn't exist, skip
        }
      }

      setTechStack(Array.from(detectedTech))
    } catch (err) {
      console.error("Failed to detect project info:", err)
    }
  }

  // Search files
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const result = await sdk.client.find.files({ query, dirs: true })
      
      if (result.data) {
        setSearchResults(result.data.slice(0, 20))
      }
    } catch (err) {
      console.error("Search failed:", err)
    }
  }

  // Toggle file/folder selection
  const toggleSelection = (file: FileNode) => {
    const current = selectedFiles()
    const exists = current.find(f => f.path === file.path)
    
    if (exists) {
      setSelectedFiles(current.filter(f => f.path !== file.path))
    } else {
      setSelectedFiles([...current, {
        path: file.path,
        type: file.type,
        name: file.name
      }])
    }
  }

  // Add from search result
  const addFromSearch = (path: string) => {
    const isDir = path.endsWith("/") || !path.includes(".")
    const name = path.split("/").pop() || path
    
    const current = selectedFiles()
    if (!current.find(f => f.path === path)) {
      setSelectedFiles([...current, {
        path,
        type: isDir ? "directory" : "file",
        name
      }])
    }
    setSearchQuery("")
    setSearchResults([])
  }

  // Navigate to directory
  const navigateTo = (path: string) => {
    loadDirectory(path)
  }

  // Go up one directory
  const goUp = () => {
    const parts = currentPath().split("/").filter(Boolean)
    parts.pop()
    loadDirectory(parts.join("/"))
  }

  // Analyze selected codebase
  const analyzeCodebase = async () => {
    setAnalyzing(true)
    
    try {
      // Count files and detect languages
      const languages: { [key: string]: number } = {}
      let totalFiles = 0
      let totalDirs = 0
      
      for (const selected of selectedFiles()) {
        if (selected.type === "directory") {
          totalDirs++
          // For directories, list contents recursively (simplified)
          try {
            const contents = await sdk.client.file.list({ path: selected.path })
            if (contents.data) {
              for (const item of contents.data) {
                if (item.type === "file") {
                  totalFiles++
                  const ext = item.name.split(".").pop()?.toLowerCase() || "unknown"
                  languages[ext] = (languages[ext] || 0) + 1
                }
              }
            }
          } catch {
            // Skip on error
          }
        } else {
          totalFiles++
          const ext = selected.name.split(".").pop()?.toLowerCase() || "unknown"
          languages[ext] = (languages[ext] || 0) + 1
        }
      }

      // Emit context
      props.onSelectionChange({
        selectedFiles: selectedFiles(),
        rootPath: rootPath(),
        detectedTechStack: techStack(),
        fileStats: {
          totalFiles,
          totalDirectories: totalDirs,
          languages
        }
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Effect to notify parent of selection changes
  createEffect(() => {
    const selection = selectedFiles()
    if (selection.length > 0) {
      props.onSelectionChange({
        selectedFiles: selection,
        rootPath: rootPath(),
        detectedTechStack: techStack()
      })
    }
  })

  const isSelected = (path: string) => {
    return selectedFiles().some(f => f.path === path)
  }

  const breadcrumbs = () => {
    const parts = currentPath().split("/").filter(Boolean)
    return [{ name: "Root", path: "" }, ...parts.map((name, i) => ({
      name,
      path: parts.slice(0, i + 1).join("/")
    }))]
  }

  return (
    <div class="codebase-selector rounded-xl border border-border-default bg-background-secondary overflow-hidden">
      {/* Header */}
      <button
        class="w-full px-6 py-4 flex items-center justify-between hover:bg-background-tertiary transition-colors"
        onClick={() => setIsExpanded(!isExpanded())}
      >
        <div class="flex items-center gap-3">
          <Icon name="folder-add-left" class="h-5 w-5 text-accent-primary" />
          <span class="font-semibold text-text-default">
            Work with Existing Codebase
          </span>
          <Show when={selectedFiles().length > 0}>
            <span class="px-2 py-0.5 text-xs rounded-full bg-accent-primary/20 text-accent-primary">
              {selectedFiles().length} selected
            </span>
          </Show>
        </div>
        <Icon 
          name={isExpanded() ? "chevron-down" : "chevron-right"} 
          class="h-5 w-5 text-text-weak"
        />
      </button>

      {/* Expanded Content */}
      <Show when={isExpanded()}>
        <div class="border-t border-border-default">
          {/* Tech Stack Detection */}
          <Show when={techStack().length > 0}>
            <div class="px-6 py-3 bg-background-tertiary/50 border-b border-border-default">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs text-text-weak">Detected:</span>
                <For each={techStack()}>
                  {(tech) => (
                    <span class="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                      {tech}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Search */}
          <div class="px-6 py-3 border-b border-border-default">
            <div class="relative">
              <Icon name="magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-weak" />
              <input
                type="text"
                placeholder="Search files and folders..."
                class="w-full pl-10 pr-4 py-2 rounded-lg bg-background-primary border border-border-default
                       text-text-default placeholder-text-weak focus:border-accent-primary focus:ring-1 
                       focus:ring-accent-primary/20 outline-none transition-all"
                value={searchQuery()}
                onInput={(e) => handleSearch(e.currentTarget.value)}
              />
            </div>
            
            {/* Search Results */}
            <Show when={searchResults().length > 0}>
              <div class="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border-default bg-background-primary">
                <For each={searchResults()}>
                  {(path) => (
                    <button
                      class="w-full px-3 py-2 text-left text-sm hover:bg-background-element flex items-center gap-2"
                      onClick={() => addFromSearch(path)}
                    >
                      <Icon name="folder" class="h-4 w-4 text-text-weak" />
                      <span class="text-text-default truncate">{path}</span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>

          {/* Breadcrumbs */}
          <div class="px-6 py-2 flex items-center gap-1 text-sm overflow-x-auto">
            <For each={breadcrumbs()}>
              {(crumb, index) => (
                <>
                  <Show when={index() > 0}>
                    <Icon name="chevron-right" class="h-3 w-3 text-text-weak" />
                  </Show>
                  <button
                    class="hover:text-accent-primary text-text-weak hover:underline whitespace-nowrap"
                    onClick={() => navigateTo(crumb.path)}
                  >
                    {crumb.name}
                  </button>
                </>
              )}
            </For>
          </div>

          {/* File Browser */}
          <div class="px-6 py-3 max-h-64 overflow-y-auto">
            <Show when={loading()}>
              <div class="flex items-center justify-center py-8">
                <Spinner class="h-6 w-6 text-accent-primary" />
              </div>
            </Show>

            <Show when={error()}>
              <div class="text-center py-4 text-red-500 text-sm">
                {error()}
              </div>
            </Show>

            <Show when={!loading() && !error()}>
              {/* Go up button */}
              <Show when={currentPath()}>
                <button
                  class="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-background-element text-text-weak"
                  onClick={goUp}
                >
                  <Icon name="arrow-up" class="h-4 w-4" />
                  <span class="text-sm">..</span>
                </button>
              </Show>

              <For each={files()}>
                {(file) => (
                  <div class="flex items-center gap-2">
                    <button
                      class={`flex-1 px-3 py-2 flex items-center gap-3 rounded-lg transition-colors
                              ${isSelected(file.path) 
                                ? "bg-accent-primary/10 border border-accent-primary/30" 
                                : "hover:bg-background-element"
                              }
                              ${file.ignored ? "opacity-50" : ""}`}
                      onClick={() => toggleSelection(file)}
                    >
                      <div class={`w-4 h-4 rounded border flex items-center justify-center
                                  ${isSelected(file.path) 
                                    ? "bg-accent-primary border-accent-primary" 
                                    : "border-border-default"
                                  }`}>
                        <Show when={isSelected(file.path)}>
                          <Icon name="check" class="h-3 w-3 text-white" />
                        </Show>
                      </div>
                      <FileIcon node={file} class="h-4 w-4" />
                      <span class={`text-sm ${file.ignored ? "text-text-weak" : "text-text-default"}`}>
                        {file.name}
                      </span>
                    </button>
                    
                    <Show when={file.type === "directory"}>
                      <button
                        class="p-2 rounded-lg hover:bg-background-element text-text-weak"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigateTo(file.path)
                        }}
                        title="Browse into directory"
                      >
                        <Icon name="chevron-right" class="h-4 w-4" />
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </Show>
          </div>

          {/* Selected Files Summary */}
          <Show when={selectedFiles().length > 0}>
            <div class="px-6 py-3 border-t border-border-default bg-background-tertiary/30">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-text-default">
                  Selected ({selectedFiles().length})
                </span>
                <button
                  class="text-xs text-red-400 hover:text-red-300"
                  onClick={() => setSelectedFiles([])}
                >
                  Clear all
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <For each={selectedFiles()}>
                  {(file) => (
                    <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-background-element text-sm">
                      <Icon name="folder" class="h-3 w-3 text-text-weak" />
                      <span class="text-text-default truncate max-w-[150px]">{file.name}</span>
                      <button
                        class="ml-1 text-text-weak hover:text-red-400"
                        onClick={() => setSelectedFiles(selectedFiles().filter(f => f.path !== file.path))}
                      >
                        <Icon name="close" class="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Quick Actions */}
          <div class="px-6 py-4 border-t border-border-default flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  // Select all visible files
                  const allFiles = files().map(f => ({
                    path: f.path,
                    type: f.type,
                    name: f.name
                  }))
                  setSelectedFiles(allFiles)
                }}
              >
                Select All Visible
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  // Select just src folder if exists
                  const srcFolder = files().find(f => f.name === "src" && f.type === "directory")
                  if (srcFolder) {
                    setSelectedFiles([{
                      path: srcFolder.path,
                      type: srcFolder.type,
                      name: srcFolder.name
                    }])
                  }
                }}
              >
                Select /src
              </Button>
            </div>
            
            <Button
              variant="primary"
              size="small"
              onClick={analyzeCodebase}
              disabled={selectedFiles().length === 0 || analyzing()}
            >
              <Show when={analyzing()} fallback="Analyze Selection">
                <Spinner class="h-4 w-4 mr-2" />
                Analyzing...
              </Show>
            </Button>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default CodebaseSelector
