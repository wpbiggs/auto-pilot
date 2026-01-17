/**
 * Stage 1: Idea Capture
 * Simple, focused input for the user's project idea
 * Now with codebase integration for existing projects
 */

import { createSignal, Show, For } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { CodebaseSelector, type CodebaseContext } from "../components/codebase-selector"
import type { CodebaseMode } from "../types/codebase"

export interface IdeaCaptureResult {
  idea: string
  mode: CodebaseMode
  codebaseContext?: CodebaseContext
}

interface IdeaCaptureProps {
  onSubmit: (result: IdeaCaptureResult) => void
}

export function IdeaCapture(props: IdeaCaptureProps) {
  const [idea, setIdea] = createSignal("")
  const [importing, setImporting] = createSignal(false)
  const [importError, setImportError] = createSignal("")
  const [mode, setMode] = createSignal<CodebaseMode>("new-project")
  const [codebaseContext, setCodebaseContext] = createSignal<CodebaseContext | undefined>()

  const handleSubmit = () => {
    const ideaText = idea().trim()
    if (ideaText.length > 0) {
      props.onSubmit({
        idea: ideaText,
        mode: mode(),
        codebaseContext: codebaseContext()
      })
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  const handleImportGitHub = async () => {
    setImporting(true)
    setImportError("")
    
    const issueUrl = prompt("Enter GitHub Issue URL:")
    if (!issueUrl) {
      setImporting(false)
      return
    }

    try {
      // Parse GitHub URL: https://github.com/owner/repo/issues/123
      const match = issueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/)
      if (!match) {
        throw new Error("Invalid GitHub issue URL")
      }

      const [, owner, repo, issueNumber] = match
      
      // Fetch issue via GitHub API
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch issue")
      }

      const issue = await response.json()
      setIdea(`${issue.title}\n\n${issue.body || ""}`)
    } catch (error: any) {
      setImportError(error.message)
    } finally {
      setImporting(false)
    }
  }

  const handleImportLinear = async () => {
    setImporting(true)
    setImportError("")
    
    // Linear import would require API key setup
    // For now, show a placeholder
    alert("Linear integration coming soon! Please paste your issue content directly.")
    setImporting(false)
  }

  const isValid = () => idea().trim().length > 10

  const handleCodebaseChange = (context: CodebaseContext) => {
    setCodebaseContext(context)
    // Auto-switch to appropriate mode when codebase is selected
    if (context.selectedFiles.length > 0 && mode() === "new-project") {
      setMode("add-features")
    }
  }

  const MODE_OPTIONS: { value: CodebaseMode; label: string; icon: string; description: string }[] = [
    { value: "new-project", label: "New Project", icon: "✨", description: "Start from scratch" },
    { value: "add-features", label: "Add Features", icon: "➕", description: "Add to existing code" },
    { value: "refactor", label: "Refactor", icon: "🔄", description: "Improve existing code" },
    { value: "fix-bugs", label: "Fix Bugs", icon: "🐛", description: "Fix issues" },
    { value: "migrate", label: "Migrate", icon: "🚀", description: "Upgrade technology" },
    { value: "test", label: "Add Tests", icon: "🧪", description: "Improve test coverage" },
  ]

  return (
    <div class="stage-container flex flex-col items-center justify-center min-h-[80vh] p-8">
      <div class="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div class="text-center space-y-4">
          <div class="text-6xl mb-4">💡</div>
          <h1 class="text-4xl font-bold text-text-default">
            What do you want to build?
          </h1>
          <p class="text-lg text-text-weak">
            Describe your project idea in detail. The more context you provide, 
            the better the AI can plan your execution.
          </p>
        </div>

        {/* Mode Selector */}
        <div class="space-y-3">
          <label class="text-sm font-medium text-text-default">Project Mode</label>
          <div class="grid grid-cols-3 gap-3">
            <For each={MODE_OPTIONS}>
              {(option) => (
                <button
                  class={`p-4 rounded-xl border-2 transition-all text-left
                          ${mode() === option.value 
                            ? "border-accent-primary bg-accent-primary/10" 
                            : "border-border-default bg-background-secondary hover:border-accent-primary/50"
                          }`}
                  onClick={() => setMode(option.value)}
                >
                  <div class="text-2xl mb-2">{option.icon}</div>
                  <div class="font-medium text-text-default">{option.label}</div>
                  <div class="text-xs text-text-weak">{option.description}</div>
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Codebase Selector (shown for non-new-project modes) */}
        <Show when={mode() !== "new-project"}>
          <CodebaseSelector 
            onSelectionChange={handleCodebaseChange}
            initialSelection={codebaseContext()?.selectedFiles}
          />
        </Show>

        {/* Context Summary (when codebase is selected) */}
        <Show when={codebaseContext()?.selectedFiles?.length}>
          <div class="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div class="flex items-center gap-2 text-green-400 mb-2">
              <Icon name="circle-check" class="h-5 w-5" />
              <span class="font-medium">Codebase Context Ready</span>
            </div>
            <div class="text-sm text-text-weak">
              {codebaseContext()?.selectedFiles.length} files/folders selected
              {codebaseContext()?.detectedTechStack?.length ? (
                <span> • Tech: {codebaseContext()?.detectedTechStack?.join(", ")}</span>
              ) : null}
            </div>
          </div>
        </Show>

        {/* Main Input */}
        <div class="space-y-4">
          <textarea
            class="w-full h-48 p-6 text-lg rounded-xl border-2 border-border-default 
                   focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
                   bg-background-secondary text-text-default placeholder-text-weak
                   resize-none transition-all duration-200"
            placeholder={mode() === "new-project" 
              ? `e.g., Build a real-time collaborative document editor with authentication, 
version history, and real-time cursor presence...`
              : mode() === "add-features"
              ? `e.g., Add a user authentication system with OAuth support, 
password reset functionality, and session management...`
              : mode() === "refactor"
              ? `e.g., Refactor the data layer to use a repository pattern,
improve error handling, and add better TypeScript types...`
              : mode() === "fix-bugs"
              ? `e.g., Fix the race condition in the websocket handler,
the memory leak in the cache system, and the UI flickering on mobile...`
              : mode() === "migrate"
              ? `e.g., Migrate from React class components to hooks,
upgrade to Next.js 14, and switch from REST to GraphQL...`
              : `e.g., Add unit tests for the auth module,
integration tests for the API endpoints, and E2E tests for checkout flow...`
            }
            value={idea()}
            onInput={(e) => setIdea(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-weak">
              {idea().length} characters
              {idea().length < 50 && idea().length > 0 && " (try to add more detail)"}
            </span>
            <span class="text-text-weak">
              Press <kbd class="px-2 py-1 rounded bg-background-tertiary">⌘</kbd> + 
              <kbd class="px-2 py-1 rounded bg-background-tertiary">Enter</kbd> to continue
            </span>
          </div>
        </div>

        {/* Import Options */}
        <div class="flex items-center justify-center gap-4">
          <span class="text-text-weak">Or import from:</span>
          <Button
            variant="secondary"
            size="small"
            onClick={handleImportGitHub}
            disabled={importing()}
          >
            <Icon name="github" class="mr-2 h-4 w-4" />
            GitHub Issue
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleImportLinear}
            disabled={importing()}
          >
            <Icon name="checklist" class="mr-2 h-4 w-4" />
            Linear
          </Button>
        </div>

        <Show when={importError()}>
          <div class="text-center text-red-500 text-sm">
            {importError()}
          </div>
        </Show>

        {/* Submit Button */}
        <div class="flex justify-center pt-4">
          <Button
            variant="primary"
            size="large"
            onClick={handleSubmit}
            disabled={!isValid()}
            class="px-12 py-4 text-lg font-semibold"
          >
            Continue with AI Analysis
            <Icon name="chevron-right" class="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Tips */}
        <div class="mt-12 p-6 rounded-xl bg-background-secondary border border-border-default">
          <h3 class="font-semibold text-text-default mb-3">
            💡 Tips for better results:
          </h3>
          <Show when={mode() === "new-project"} fallback={
            <ul class="space-y-2 text-text-weak text-sm">
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Select the files/folders the AI should analyze and modify
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Be specific about what changes you want and why
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Mention any patterns or conventions to follow
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Include any constraints (backwards compatibility, performance, etc.)
              </li>
            </ul>
          }>
            <ul class="space-y-2 text-text-weak text-sm">
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Be specific about features you want (authentication, real-time sync, etc.)
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Mention technology preferences if any (React, Node.js, PostgreSQL)
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Describe the user experience you're aiming for
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-primary">•</span>
                Include any constraints (mobile-first, offline support, etc.)
              </li>
            </ul>
          </Show>
        </div>
      </div>
    </div>
  )
}
