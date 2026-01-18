/**
 * Project Preview Stage
 * Displays the generated project with file browser and live preview
 */

import { useState, useEffect } from "react"

export function ProjectPreviewStage({ plan, idea, executionResult, onNewProject, onBack }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [files, setFiles] = useState([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildOutput, setBuildOutput] = useState("")
  const [previewUrl, setPreviewUrl] = useState(null)

  // Extract files from execution result
  useEffect(() => {
    if (executionResult?.files) {
      setFiles(executionResult.files)
      if (executionResult.files.length > 0) {
        setSelectedFile(executionResult.files[0])
      }
    } else if (plan?.tasks) {
      // Generate mock files from tasks for demo
      const mockFiles = plan.tasks.map((task, i) => ({
        path: `src/${task.name.toLowerCase().replace(/\s+/g, "-")}.ts`,
        content: `// ${task.name}\n// ${task.description}\n\nexport function ${task.name.replace(/\s+/g, "")}() {\n  // Implementation\n}\n`,
        language: "typescript",
      }))
      mockFiles.unshift({
        path: "README.md",
        content: `# ${plan.projectName || "Generated Project"}\n\n${idea}\n\n## Tasks Completed\n\n${plan.tasks.map(t => `- ${t.name}: ${t.description}`).join("\n")}\n`,
        language: "markdown",
      })
      setFiles(mockFiles)
      setSelectedFile(mockFiles[0])
    }
  }, [executionResult, plan, idea])

  const handleBuildProject = async () => {
    setIsBuilding(true)
    setBuildOutput("Building project...\n")
    
    // Simulate build process
    await new Promise(r => setTimeout(r, 1000))
    setBuildOutput(prev => prev + "Installing dependencies...\n")
    await new Promise(r => setTimeout(r, 1500))
    setBuildOutput(prev => prev + "Compiling TypeScript...\n")
    await new Promise(r => setTimeout(r, 1000))
    setBuildOutput(prev => prev + "Bundling assets...\n")
    await new Promise(r => setTimeout(r, 500))
    setBuildOutput(prev => prev + "\n✅ Build complete!\n")
    setBuildOutput(prev => prev + "Preview available at http://localhost:3001\n")
    
    setPreviewUrl("http://localhost:3001")
    setIsBuilding(false)
  }

  const getLanguageColor = (lang) => {
    const colors = {
      typescript: "text-blue-400",
      javascript: "text-yellow-400",
      markdown: "text-gray-400",
      json: "text-green-400",
      css: "text-pink-400",
      html: "text-orange-400",
    }
    return colors[lang] || "text-gray-400"
  }

  const getFileIcon = (path) => {
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "📘"
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "📒"
    if (path.endsWith(".md")) return "📝"
    if (path.endsWith(".json")) return "📋"
    if (path.endsWith(".css")) return "🎨"
    if (path.endsWith(".html")) return "🌐"
    return "📄"
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          🎉 Project Generated!
        </h1>
        <p className="text-gray-400">
          {plan?.projectName || "Your project"} is ready. Browse the generated files and preview your project.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{files.length}</div>
          <div className="text-sm text-gray-400">Files Generated</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{plan?.tasks?.length || 0}</div>
          <div className="text-sm text-gray-400">Tasks Completed</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-green-400">100%</div>
          <div className="text-sm text-gray-400">Success Rate</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{plan?.totalEstimateMinutes || 0}m</div>
          <div className="text-sm text-gray-400">Time Saved</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* File Browser */}
        <div className="col-span-3 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700 bg-gray-800/80">
            <h3 className="text-sm font-semibold text-white">📁 Files</h3>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {files.map((file, i) => (
              <button
                key={i}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  selectedFile?.path === file.path
                    ? "bg-blue-600/30 text-blue-400"
                    : "text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                <span>{getFileIcon(file.path)}</span>
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="col-span-6 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700 bg-gray-800/80 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {selectedFile && (
                <>
                  <span>{getFileIcon(selectedFile.path)}</span>
                  <span>{selectedFile.path}</span>
                </>
              )}
            </h3>
            {selectedFile && (
              <span className={`text-xs ${getLanguageColor(selectedFile.language)}`}>
                {selectedFile.language}
              </span>
            )}
          </div>
          <div className="p-4 max-h-96 overflow-auto">
            {selectedFile ? (
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {selectedFile.content}
              </pre>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Select a file to view its contents
              </div>
            )}
          </div>
        </div>

        {/* Actions & Preview */}
        <div className="col-span-3 space-y-4">
          {/* Build Button */}
          <button
            onClick={handleBuildProject}
            disabled={isBuilding}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
              isBuilding
                ? "bg-gray-600 cursor-wait"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25"
            }`}
          >
            {isBuilding ? "🔄 Building..." : "🚀 Build & Preview"}
          </button>

          {/* Build Output */}
          {buildOutput && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-3">
              <div className="text-xs text-gray-500 mb-2">Build Output</div>
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {buildOutput}
              </pre>
            </div>
          )}

          {/* Preview Link */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-blue-600 text-white text-center font-semibold hover:bg-blue-500 transition-colors"
            >
              🌐 Open Preview
            </a>
          )}

          {/* Download Button */}
          <button className="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors">
            📥 Download Project
          </button>

          {/* New Project Button */}
          <button
            onClick={onNewProject}
            className="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
          >
            ✨ Start New Project
          </button>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Execution
        </button>
      </div>
    </div>
  )
}

export default ProjectPreviewStage
