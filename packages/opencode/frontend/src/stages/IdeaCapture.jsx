/**
 * Stage 1: Idea Capture
 * Simple, focused input for the user's project idea
 */

import { useState } from "react"

export function IdeaCapture({ onSubmit }) {
  const [idea, setIdea] = useState("")
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")

  const handleSubmit = () => {
    const ideaText = idea.trim()
    if (ideaText.length > 0) {
      onSubmit(ideaText)
    }
  }

  const handleKeyDown = (e) => {
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
    } catch (error) {
      setImportError(error.message)
    } finally {
      setImporting(false)
    }
  }

  const handleImportLinear = async () => {
    setImporting(true)
    setImportError("")

    // Linear import would require API key setup
    alert("Linear integration coming soon! Please paste your issue content directly.")
    setImporting(false)
  }

  const isValid = idea.trim().length > 10

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">💡</div>
          <h1 className="text-4xl font-bold text-white">
            What do you want to build?
          </h1>
          <p className="text-lg text-gray-400">
            Describe your project idea in detail. The more context you provide,
            the better the AI can plan your execution.
          </p>
        </div>

        {/* Main Input */}
        <div className="space-y-4">
          <textarea
            className="w-full h-48 p-6 text-lg rounded-xl border-2 border-gray-700 
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       bg-gray-900 text-white placeholder-gray-500
                       resize-none transition-all duration-200"
            placeholder={`e.g., Build a real-time collaborative document editor with authentication, 
version history, and real-time cursor presence. It should support 
markdown formatting, code blocks with syntax highlighting, and 
allow users to share documents via links with different permission levels...`}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {idea.length} characters
              {idea.length < 50 && idea.length > 0 && " (try to add more detail)"}
            </span>
            <span className="text-gray-500">
              Press <kbd className="px-2 py-1 rounded bg-gray-800">⌘</kbd> +
              <kbd className="px-2 py-1 rounded bg-gray-800">Enter</kbd> to continue
            </span>
          </div>
        </div>

        {/* Import Options */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-gray-500">Or import from:</span>
          <button
            onClick={handleImportGitHub}
            disabled={importing}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 
                       disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>🐙</span>
            GitHub Issue
          </button>
          <button
            onClick={handleImportLinear}
            disabled={importing}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 
                       disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>📋</span>
            Linear
          </button>
        </div>

        {importError && (
          <div className="text-center text-red-500 text-sm">
            {importError}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`
              px-8 py-4 rounded-xl text-lg font-semibold
              transition-all duration-200 transform
              ${isValid
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg shadow-blue-500/25"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Continue to AI Planning →
          </button>
        </div>

        {/* Examples */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-500">Try these examples:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Build a REST API for a todo app with authentication",
              "Create a CLI tool for managing Docker containers",
              "Implement a real-time chat system with WebSockets",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setIdea(example)}
                className="px-3 py-1.5 rounded-full bg-gray-800/50 text-gray-400 text-sm
                           hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdeaCapture
