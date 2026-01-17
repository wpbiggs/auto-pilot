/**
 * useCodebaseAnalysis Hook
 * 
 * Analyzes selected files/folders and builds a comprehensive
 * context for the AI planning stage.
 */

import { createSignal, createResource } from "solid-js"
import type { OpencodeClient } from "@opencode-ai/sdk"
import type { 
  CodebaseAnalysis, 
  FileAnalysis, 
  TechStackInfo, 
  DependencyInfo,
  CodeMetrics,
  ProjectStructure,
  GitInfo
} from "../types/codebase"
import type { SelectedFile, CodebaseContext } from "../components/codebase-selector"

// Language detection by extension
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript (React)",
  js: "JavaScript",
  jsx: "JavaScript (React)",
  py: "Python",
  rs: "Rust",
  go: "Go",
  java: "Java",
  kt: "Kotlin",
  swift: "Swift",
  rb: "Ruby",
  php: "PHP",
  cs: "C#",
  cpp: "C++",
  c: "C",
  h: "C/C++ Header",
  hpp: "C++ Header",
  vue: "Vue",
  svelte: "Svelte",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  md: "Markdown",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  dockerfile: "Docker",
}

// Config file patterns
const CONFIG_PATTERNS: Record<string, string> = {
  "package.json": "package.json",
  "tsconfig.json": "tsconfig",
  "tsconfig.*.json": "tsconfig",
  "vite.config.*": "vite",
  "next.config.*": "next",
  "webpack.config.*": "webpack",
  "rollup.config.*": "rollup",
  "docker-compose.*": "docker",
  "Dockerfile": "docker",
  ".eslintrc*": "eslint",
  ".prettierrc*": "prettier",
  "jest.config.*": "jest",
  "vitest.config.*": "vitest",
}

export function useCodebaseAnalysis(sdk: OpencodeClient) {
  const [analyzing, setAnalyzing] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const [error, setError] = createSignal<string | null>(null)

  /**
   * Analyze selected files and build codebase context
   */
  async function analyzeCodebase(
    context: CodebaseContext
  ): Promise<CodebaseAnalysis | null> {
    setAnalyzing(true)
    setProgress(0)
    setError(null)

    try {
      const { selectedFiles, rootPath } = context
      
      // Step 1: Collect all files to analyze
      setProgress(10)
      const allFiles = await collectFiles(sdk, selectedFiles)
      
      // Step 2: Analyze each file
      setProgress(30)
      const analyzedFiles = await analyzeFiles(sdk, allFiles)
      
      // Step 3: Detect tech stack
      setProgress(50)
      const techStack = await detectTechStack(sdk, analyzedFiles)
      
      // Step 4: Parse dependencies
      setProgress(60)
      const { dependencies, devDependencies } = await parseDependencies(sdk)
      
      // Step 5: Analyze project structure
      setProgress(70)
      const structure = analyzeStructure(allFiles, rootPath)
      
      // Step 6: Calculate metrics
      setProgress(80)
      const metrics = calculateMetrics(analyzedFiles)
      
      // Step 7: Get git info
      setProgress(90)
      const git = await getGitInfo(sdk)
      
      setProgress(100)
      
      // Build project name from root path
      const projectName = rootPath.split("/").pop() || "project"
      
      return {
        projectName,
        rootPath,
        techStack,
        structure,
        selectedFiles,
        analyzedFiles,
        dependencies,
        devDependencies,
        metrics,
        git
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze codebase")
      return null
    } finally {
      setAnalyzing(false)
    }
  }

  return {
    analyzeCodebase,
    analyzing,
    progress,
    error
  }
}

/**
 * Collect all files from selected paths (expanding directories)
 */
async function collectFiles(
  sdk: OpencodeClient,
  selectedFiles: SelectedFile[]
): Promise<SelectedFile[]> {
  const allFiles: SelectedFile[] = []
  
  for (const selected of selectedFiles) {
    if (selected.type === "file") {
      allFiles.push(selected)
    } else {
      // Expand directory
      try {
        const contents = await sdk.file.list({ path: selected.path })
        
        if (contents.data) {
          for (const item of contents.data) {
            allFiles.push({
              path: item.path,
              type: item.type,
              name: item.name
            })
            
            // Recursively expand subdirectories (limit depth)
            if (item.type === "directory" && !item.ignored) {
              const subContents = await sdk.file.list({ path: item.path })
              if (subContents.data) {
                for (const subItem of subContents.data) {
                  allFiles.push({
                    path: subItem.path,
                    type: subItem.type,
                    name: subItem.name
                  })
                }
              }
            }
          }
        }
      } catch {
        // Skip on error
      }
    }
  }
  
  return allFiles
}

/**
 * Analyze individual files
 */
async function analyzeFiles(
  sdk: OpencodeClient,
  files: SelectedFile[]
): Promise<FileAnalysis[]> {
  const analyzed: FileAnalysis[] = []
  
  for (const file of files) {
    if (file.type !== "file") continue
    
    const ext = file.name.split(".").pop()?.toLowerCase()
    const language = ext ? EXTENSION_TO_LANGUAGE[ext] : undefined
    
    const analysis: FileAnalysis = {
      path: file.path,
      type: file.type,
      name: file.name,
      extension: ext,
      language
    }
    
    // Try to read file content for deeper analysis
    try {
      const content = await sdk.file.read({ path: file.path })
      
      if (content.data?.type === "text") {
        const text = content.data.content
        analysis.lineCount = text.split("\n").length
        
        // Parse exports/imports for JS/TS files
        if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
          analysis.exports = extractExports(text)
          analysis.imports = extractImports(text)
          analysis.functions = extractFunctions(text)
          analysis.classes = extractClasses(text)
        }
        
        // Parse config files
        if (file.name === "package.json") {
          try {
            analysis.configType = "package.json"
            analysis.configData = JSON.parse(text)
          } catch {}
        }
      }
    } catch {
      // Skip content analysis on error
    }
    
    analyzed.push(analysis)
  }
  
  return analyzed
}

/**
 * Detect technology stack from analyzed files
 */
async function detectTechStack(
  sdk: OpencodeClient,
  files: FileAnalysis[]
): Promise<TechStackInfo> {
  const languages = new Set<string>()
  const frameworks = new Set<string>()
  const tools = new Set<string>()
  
  let primaryLanguage = "JavaScript"
  let framework: string | undefined
  let packageManager: TechStackInfo["packageManager"]
  let buildTool: string | undefined
  let testingFramework: string | undefined
  let uiLibrary: string | undefined
  
  // Detect from file extensions
  const langCounts: Record<string, number> = {}
  for (const file of files) {
    if (file.language) {
      languages.add(file.language)
      langCounts[file.language] = (langCounts[file.language] || 0) + 1
    }
  }
  
  // Find primary language
  let maxCount = 0
  for (const [lang, count] of Object.entries(langCounts)) {
    if (count > maxCount) {
      maxCount = count
      primaryLanguage = lang
    }
  }
  
  // Detect from package.json
  const packageJson = files.find(f => f.name === "package.json")?.configData
  if (packageJson) {
    packageManager = "npm"
    
    const deps = { 
      ...packageJson.dependencies, 
      ...packageJson.devDependencies 
    }
    
    // Framework detection
    if (deps["next"]) { frameworks.add("Next.js"); framework = "Next.js" }
    if (deps["react"]) { frameworks.add("React"); uiLibrary = "React" }
    if (deps["vue"]) { frameworks.add("Vue"); uiLibrary = "Vue" }
    if (deps["svelte"]) { frameworks.add("Svelte"); uiLibrary = "Svelte" }
    if (deps["solid-js"]) { frameworks.add("SolidJS"); uiLibrary = "SolidJS" }
    if (deps["angular"]) { frameworks.add("Angular"); uiLibrary = "Angular" }
    if (deps["express"]) frameworks.add("Express")
    if (deps["fastify"]) frameworks.add("Fastify")
    if (deps["hono"]) frameworks.add("Hono")
    if (deps["@nestjs/core"]) frameworks.add("NestJS")
    
    // Build tools
    if (deps["vite"]) { tools.add("Vite"); buildTool = "Vite" }
    if (deps["webpack"]) { tools.add("Webpack"); buildTool = "Webpack" }
    if (deps["rollup"]) { tools.add("Rollup"); buildTool = "Rollup" }
    if (deps["esbuild"]) tools.add("esbuild")
    if (deps["turbo"]) tools.add("Turborepo")
    
    // Testing
    if (deps["jest"]) { tools.add("Jest"); testingFramework = "Jest" }
    if (deps["vitest"]) { tools.add("Vitest"); testingFramework = "Vitest" }
    if (deps["mocha"]) { tools.add("Mocha"); testingFramework = "Mocha" }
    if (deps["playwright"]) tools.add("Playwright")
    if (deps["cypress"]) tools.add("Cypress")
    
    // UI libraries
    if (deps["tailwindcss"]) tools.add("Tailwind CSS")
    if (deps["@chakra-ui/react"]) tools.add("Chakra UI")
    if (deps["@mui/material"]) tools.add("Material UI")
    
    // Other tools
    if (deps["typescript"]) languages.add("TypeScript")
    if (deps["eslint"]) tools.add("ESLint")
    if (deps["prettier"]) tools.add("Prettier")
  }
  
  // Check for lock files to detect package manager
  try {
    await sdk.file.read({ path: "bun.lockb" })
    packageManager = "bun"
  } catch {}
  try {
    await sdk.file.read({ path: "pnpm-lock.yaml" })
    packageManager = "pnpm"
  } catch {}
  try {
    await sdk.file.read({ path: "yarn.lock" })
    packageManager = "yarn"
  } catch {}
  
  return {
    primaryLanguage,
    framework,
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    tools: Array.from(tools),
    packageManager,
    buildTool,
    testingFramework,
    uiLibrary
  }
}

/**
 * Parse dependencies from package.json
 */
async function parseDependencies(
  sdk: OpencodeClient
): Promise<{ dependencies: DependencyInfo[], devDependencies: DependencyInfo[] }> {
  const dependencies: DependencyInfo[] = []
  const devDependencies: DependencyInfo[] = []
  
  try {
    const result = await sdk.file.read({ path: "package.json" })
    
    if (result.data?.type === "text") {
      const pkg = JSON.parse(result.data.content)
      
      for (const [name, version] of Object.entries(pkg.dependencies || {})) {
        dependencies.push({
          name,
          version: version as string,
          type: "production"
        })
      }
      
      for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
        devDependencies.push({
          name,
          version: version as string,
          type: "development"
        })
      }
    }
  } catch {
    // No package.json
  }
  
  return { dependencies, devDependencies }
}

/**
 * Analyze project structure
 */
function analyzeStructure(
  files: SelectedFile[],
  rootPath: string
): ProjectStructure {
  const directories: ProjectStructure["directories"] = {}
  const configFiles: string[] = []
  const mainEntryPoints: string[] = []
  
  for (const file of files) {
    // Detect standard directories
    if (file.path.startsWith("src/") || file.path === "src") {
      directories.src = "src"
    }
    if (file.path.startsWith("test/") || file.path.startsWith("tests/") || 
        file.path.startsWith("__tests__/")) {
      directories.tests = file.path.split("/")[0]
    }
    if (file.path.startsWith("docs/")) {
      directories.docs = "docs"
    }
    if (file.path.startsWith("public/")) {
      directories.public = "public"
    }
    if (file.path.startsWith("dist/") || file.path.startsWith("build/")) {
      directories.dist = file.path.split("/")[0]
    }
    
    // Detect config files
    for (const pattern of Object.keys(CONFIG_PATTERNS)) {
      if (file.name.match(pattern.replace("*", ".*"))) {
        configFiles.push(file.path)
      }
    }
    
    // Detect entry points
    if (["index.ts", "index.js", "main.ts", "main.js", "app.ts", "app.js", 
         "index.tsx", "index.jsx", "main.tsx", "main.jsx"].includes(file.name)) {
      mainEntryPoints.push(file.path)
    }
  }
  
  return {
    rootPath,
    mainEntryPoints,
    directories,
    configFiles,
    ignoredPaths: ["node_modules", ".git", "dist", "build", ".next"]
  }
}

/**
 * Calculate code metrics
 */
function calculateMetrics(files: FileAnalysis[]): CodeMetrics {
  let totalFiles = 0
  let totalDirectories = 0
  let totalLines = 0
  const filesByExtension: Record<string, number> = {}
  const linesByExtension: Record<string, number> = {}
  let sourceFiles = 0
  let configFiles = 0
  let testFiles = 0
  let docFiles = 0
  
  const sourceExts = ["ts", "tsx", "js", "jsx", "py", "rs", "go", "java", "rb", "php"]
  const configExts = ["json", "yaml", "yml", "toml", "xml"]
  const testPatterns = ["test.", "spec.", ".test.", ".spec.", "__test__"]
  const docExts = ["md", "mdx", "txt", "rst"]
  
  for (const file of files) {
    if (file.type === "directory") {
      totalDirectories++
      continue
    }
    
    totalFiles++
    
    const ext = file.extension || "other"
    filesByExtension[ext] = (filesByExtension[ext] || 0) + 1
    
    if (file.lineCount) {
      totalLines += file.lineCount
      linesByExtension[ext] = (linesByExtension[ext] || 0) + file.lineCount
    }
    
    // Categorize files
    if (testPatterns.some(p => file.name.includes(p))) {
      testFiles++
    } else if (docExts.includes(ext)) {
      docFiles++
    } else if (configExts.includes(ext)) {
      configFiles++
    } else if (sourceExts.includes(ext)) {
      sourceFiles++
    }
  }
  
  return {
    totalFiles,
    totalDirectories,
    totalLines,
    filesByExtension,
    linesByExtension,
    sourceFiles,
    configFiles,
    testFiles,
    docFiles
  }
}

/**
 * Get git repository info
 */
async function getGitInfo(sdk: OpencodeClient): Promise<GitInfo | undefined> {
  try {
    const vcs = await sdk.vcs.get()
    
    if (vcs.data) {
      return {
        isRepo: true,
        branch: vcs.data.branch
      }
    }
  } catch {
    // Not a git repo or error
  }
  
  return { isRepo: false }
}

// Helper functions for code parsing

function extractExports(code: string): string[] {
  const exports: string[] = []
  const patterns = [
    /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g,
    /export\s*\{\s*([^}]+)\s*\}/g
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match[1]) {
        exports.push(...match[1].split(",").map(s => s.trim().split(" ")[0]))
      }
    }
  }
  
  return exports.filter(Boolean).slice(0, 20)
}

function extractImports(code: string): string[] {
  const imports: string[] = []
  const pattern = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g
  
  let match
  while ((match = pattern.exec(code)) !== null) {
    if (match[1]) {
      imports.push(match[1])
    }
  }
  
  return imports.slice(0, 30)
}

function extractFunctions(code: string): string[] {
  const functions: string[] = []
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/g
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match[1]) {
        functions.push(match[1])
      }
    }
  }
  
  return functions.slice(0, 30)
}

function extractClasses(code: string): string[] {
  const classes: string[] = []
  const pattern = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g
  
  let match
  while ((match = pattern.exec(code)) !== null) {
    if (match[1]) {
      classes.push(match[1])
    }
  }
  
  return classes.slice(0, 20)
}
