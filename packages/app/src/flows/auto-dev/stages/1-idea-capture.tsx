/**
 * Stage 1: Idea Capture
 * Simple, focused input for the user's project idea
 */

import { createSignal, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"

interface IdeaCaptureProps {
  onSubmit: (idea: string) => void
}

export function IdeaCapture(props: IdeaCaptureProps) {
  const [idea, setIdea] = createSignal("")
  const [importing, setImporting] = createSignal(false)
  const [importError, setImportError] = createSignal("")

  const handleSubmit = () => {
    const ideaText = idea().trim()
    if (ideaText.length > 0) {
      props.onSubmit(ideaText)
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

        {/* Main Input */}
        <div class="space-y-4">
          <textarea
            class="w-full h-48 p-6 text-lg rounded-xl border-2 border-border-default 
                   focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
                   bg-background-secondary text-text-default placeholder-text-weak
                   resize-none transition-all duration-200"
            placeholder="e.g., Build a real-time collaborative document editor with authentication, 
version history, and real-time cursor presence. It should support 
markdown formatting, code blocks with syntax highlighting, and 
allow users to share documents via links with different permission levels..."
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
        </div>
      </div>
    </div>
  )
}
