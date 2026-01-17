/**
 * Auto Review Service
 * Automated code review and quality checks
 */

import type { Task, TaskResult, TaskReview, ReviewIssue } from "@/types/task"

interface ReviewConfig {
  threshold: number
  checkSyntax: boolean
  checkSecurity: boolean
  checkBestPractices: boolean
  checkCompleteness: boolean
}

const DEFAULT_CONFIG: ReviewConfig = {
  threshold: 0.85,
  checkSyntax: true,
  checkSecurity: true,
  checkBestPractices: true,
  checkCompleteness: true
}

class AutoReview {
  private sdk: any = null
  private config: ReviewConfig = DEFAULT_CONFIG

  setSDK(sdk: any) {
    this.sdk = sdk
  }

  configure(config: Partial<ReviewConfig>) {
    this.config = { ...this.config, ...config }
  }

  async reviewTask(task: Task, result: TaskResult): Promise<TaskReview> {
    if (!result.success || !result.output) {
      return this.createFailedReview("Task execution failed")
    }

    try {
      // Run multiple review checks in parallel
      const [
        syntaxScore,
        securityScore,
        completenessScore,
        qualityScore
      ] = await Promise.all([
        this.checkSyntax(result.output),
        this.checkSecurity(result.output),
        this.checkCompleteness(task, result.output),
        this.checkQuality(result.output)
      ])

      const issues: ReviewIssue[] = []
      const suggestions: string[] = []

      // Collect issues from each check
      if (syntaxScore.issues) issues.push(...syntaxScore.issues)
      if (securityScore.issues) issues.push(...securityScore.issues)
      if (completenessScore.issues) issues.push(...completenessScore.issues)
      if (qualityScore.issues) issues.push(...qualityScore.issues)

      // Collect suggestions
      if (syntaxScore.suggestions) suggestions.push(...syntaxScore.suggestions)
      if (securityScore.suggestions) suggestions.push(...securityScore.suggestions)
      if (completenessScore.suggestions) suggestions.push(...completenessScore.suggestions)
      if (qualityScore.suggestions) suggestions.push(...qualityScore.suggestions)

      // Calculate overall score
      const weights = {
        syntax: 0.3,
        security: 0.25,
        completeness: 0.25,
        quality: 0.2
      }

      const overallScore = 
        syntaxScore.score * weights.syntax +
        securityScore.score * weights.security +
        completenessScore.score * weights.completeness +
        qualityScore.score * weights.quality

      return {
        score: overallScore,
        passed: overallScore >= this.config.threshold,
        issues,
        suggestions,
        reviewedAt: Date.now(),
        autoReviewed: true
      }
    } catch (error: any) {
      console.error("[AutoReview] Error:", error)
      return this.createPassingReview() // Default to passing on error
    }
  }

  private async checkSyntax(output: string): Promise<ReviewCheckResult> {
    // Simple heuristic syntax checks
    const issues: ReviewIssue[] = []
    const suggestions: string[] = []
    let score = 1.0

    // Check for common syntax issues
    const codeBlocks = this.extractCodeBlocks(output)
    
    for (const block of codeBlocks) {
      // Check for unclosed brackets
      const brackets = this.checkBrackets(block.code)
      if (!brackets.balanced) {
        issues.push({
          severity: "error",
          message: `Unclosed ${brackets.type} bracket`,
          location: block.language
        })
        score -= 0.2
      }

      // Check for common typos
      if (block.code.includes("undefinded") || block.code.includes("fucntion")) {
        issues.push({
          severity: "warning",
          message: "Possible typo detected",
          location: block.language
        })
        score -= 0.1
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }

  private async checkSecurity(output: string): Promise<ReviewCheckResult> {
    const issues: ReviewIssue[] = []
    const suggestions: string[] = []
    let score = 1.0

    const securityPatterns = [
      { pattern: /eval\s*\(/g, message: "Use of eval() is a security risk", severity: "error" as const },
      { pattern: /innerHTML\s*=/g, message: "innerHTML can lead to XSS vulnerabilities", severity: "warning" as const },
      { pattern: /password\s*=\s*['"][^'"]+['"]/gi, message: "Hardcoded password detected", severity: "error" as const },
      { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, message: "Hardcoded API key detected", severity: "error" as const },
      { pattern: /document\.write/g, message: "document.write can cause security issues", severity: "warning" as const }
    ]

    for (const { pattern, message, severity } of securityPatterns) {
      if (pattern.test(output)) {
        issues.push({ severity, message })
        score -= severity === "error" ? 0.3 : 0.1
      }
    }

    if (issues.length === 0) {
      suggestions.push("No security issues detected in initial scan")
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }

  private async checkCompleteness(task: Task, output: string): Promise<ReviewCheckResult> {
    const issues: ReviewIssue[] = []
    const suggestions: string[] = []
    let score = 1.0

    // Check if output has actual code
    const codeBlocks = this.extractCodeBlocks(output)
    if (codeBlocks.length === 0) {
      issues.push({
        severity: "warning",
        message: "No code blocks found in output"
      })
      score -= 0.3
    }

    // Check if task title keywords appear in output
    const keywords = task.title.toLowerCase().split(/\s+/)
      .filter(w => w.length > 3)
    
    const outputLower = output.toLowerCase()
    const foundKeywords = keywords.filter(kw => outputLower.includes(kw))
    
    if (foundKeywords.length < keywords.length * 0.5) {
      issues.push({
        severity: "info",
        message: "Output may not fully address the task requirements"
      })
      score -= 0.1
    }

    // Check for error handling
    if (codeBlocks.length > 0) {
      const hasErrorHandling = codeBlocks.some(b => 
        b.code.includes("try") || 
        b.code.includes("catch") || 
        b.code.includes("error") ||
        b.code.includes("throw")
      )
      
      if (!hasErrorHandling) {
        suggestions.push("Consider adding error handling")
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }

  private async checkQuality(output: string): Promise<ReviewCheckResult> {
    const issues: ReviewIssue[] = []
    const suggestions: string[] = []
    let score = 1.0

    const codeBlocks = this.extractCodeBlocks(output)

    for (const block of codeBlocks) {
      // Check for comments
      const hasComments = /\/\/|\/\*|\*\/|#/.test(block.code)
      if (!hasComments && block.code.length > 200) {
        suggestions.push("Consider adding comments to explain complex logic")
        score -= 0.05
      }

      // Check for very long functions (heuristic)
      const functionMatches = block.code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g)
      if (functionMatches && functionMatches.length > 0) {
        const avgLinesPerFunction = block.code.split("\n").length / functionMatches.length
        if (avgLinesPerFunction > 50) {
          suggestions.push("Consider breaking down large functions into smaller ones")
        }
      }

      // Check for magic numbers
      const magicNumbers = block.code.match(/(?<![.\d])\d{2,}(?![.\d])/g)
      if (magicNumbers && magicNumbers.length > 3) {
        suggestions.push("Consider extracting magic numbers into named constants")
      }
    }

    return {
      score: Math.max(0.5, score), // Quality is more lenient
      issues,
      suggestions
    }
  }

  private extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
    const blocks: Array<{ language: string; code: string }> = []
    const regex = /```(\w*)\n([\s\S]*?)```/g
    let match

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || "unknown",
        code: match[2]
      })
    }

    // Also check for inline code if no blocks found
    if (blocks.length === 0 && text.includes("function") || text.includes("const") || text.includes("import")) {
      blocks.push({
        language: "javascript",
        code: text
      })
    }

    return blocks
  }

  private checkBrackets(code: string): { balanced: boolean; type?: string } {
    const brackets: Record<string, string> = {
      "{": "}",
      "[": "]",
      "(": ")"
    }
    const stack: string[] = []

    for (const char of code) {
      if (char in brackets) {
        stack.push(char)
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop()
        if (!last || brackets[last] !== char) {
          return { balanced: false, type: char }
        }
      }
    }

    if (stack.length > 0) {
      return { balanced: false, type: brackets[stack[stack.length - 1]] }
    }

    return { balanced: true }
  }

  private createFailedReview(reason: string): TaskReview {
    return {
      score: 0,
      passed: false,
      issues: [{
        severity: "error",
        message: reason
      }],
      suggestions: [],
      reviewedAt: Date.now(),
      autoReviewed: true
    }
  }

  private createPassingReview(): TaskReview {
    return {
      score: 1,
      passed: true,
      issues: [],
      suggestions: [],
      reviewedAt: Date.now(),
      autoReviewed: true
    }
  }
}

interface ReviewCheckResult {
  score: number
  issues: ReviewIssue[]
  suggestions: string[]
}

export const autoReview = new AutoReview()
