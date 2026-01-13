#!/usr/bin/env bun
import { AutoSelector } from "./src/auto/auto-selector"

async function demoAutoSelection() {
  console.log("🤖 OpenCode Auto-Claude Interface Demo")
  console.log("=====================================")
  console.log()

  const testTasks = [
    "Add a simple console.log statement",
    "Create a new API endpoint for user registration",
    "Explore the codebase to find all database connections",
    "Plan the architecture for a microservices system",
    "Debug the authentication flow",
    "Write unit tests for the user service",
  ]

  for (let i = 0; i < testTasks.length; i++) {
    const task = testTasks[i]
    console.log(`\n${i + 1}. Task: "${task}"`)
    console.log("-".repeat(50))

    try {
      const analysis = await AutoSelector.analyzeTask(task)

      console.log(`📋 Task Type: ${analysis.taskType}`)
      console.log(`🎯 Complexity: ${analysis.complexity}`)
      console.log(`🤖 Suggested Agent: ${analysis.suggestedAgent}`)
      console.log(`🧠 Suggested Model: ${analysis.suggestedModel.providerID}/${analysis.suggestedModel.modelID}`)
      console.log(`📊 Confidence: ${Math.round(analysis.confidence * 100)}%`)
      console.log(`💻 Requires Code: ${analysis.requiresCode ? "Yes" : "No"}`)
      console.log(`🔍 Requires Research: ${analysis.requiresResearch ? "Yes" : "No"}`)
      console.log(`🔄 Multiple Steps: ${analysis.requiresMultipleSteps ? "Yes" : "No"}`)
      console.log(`📝 Reasoning: ${analysis.suggestedModel.reasoning}`)
    } catch (error) {
      console.log(`❌ Error analyzing task: ${error.message}`)
      console.log("💡 This is expected in CI/demo environment without full API setup")
    }
  }

  console.log("\n✅ Auto-Selection Demo Complete!")
  console.log("\n📖 To use in OpenCode:")
  console.log("1. Enable in config: experimental.autoSelection.enabled = true")
  console.log("2. Use the auto tool instead of manual agent selection")
  console.log("3. Example: auto({ prompt: 'your task here' })")
}

demoAutoSelection().catch(console.error)
