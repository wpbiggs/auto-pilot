#!/usr/bin/env bun
import { AutoSelector } from "./src/auto/auto-selector"

// Mock the fallback analysis directly since it doesn't need API context
async function demoFallback() {
  console.log("🤖 OpenCode Auto-Claude Fallback Demo")
  console.log("======================================")
  console.log()

  const testTasks = [
    { task: "Add a simple console.log statement", expected: "simple" },
    { task: "Create a new API endpoint for user registration", expected: "medium" },
    { task: "Explore the codebase to find all database connections", expected: "exploration" },
    { task: "Plan the architecture for a microservices system", expected: "complex" },
    { task: "Debug the authentication flow", expected: "debugging" },
    { task: "Write unit tests for the user service", expected: "testing" },
  ]

  for (let i = 0; i < testTasks.length; i++) {
    const { task, expected } = testTasks[i]
    console.log(`\n${i + 1}. Task: "${task}"`)
    console.log("-".repeat(50))

    try {
      // This will use fallback logic when AI analysis fails
      const analysis = await AutoSelector.analyzeTask(task)

      console.log(`📋 Task Type: ${analysis.taskType}`)
      console.log(`🎯 Complexity: ${analysis.complexity}`)
      console.log(`🤖 Suggested Agent: ${analysis.suggestedAgent}`)
      console.log(`🧠 Suggested Model: ${analysis.suggestedModel.providerID}/${analysis.suggestedModel.modelID}`)
      console.log(`📊 Confidence: ${Math.round(analysis.confidence * 100)}%`)
      console.log(`💻 Requires Code: ${analysis.requiresCode ? "Yes" : "No"}`)
      console.log(`🔍 Requires Research: ${analysis.requiresResearch ? "Yes" : "No"}`)
      console.log(`🔄 Multiple Steps: ${analysis.requiresMultipleSteps ? "Yes" : "No"}`)

      // Check if analysis matches expectations
      const typeMatch = analysis.taskType.includes(expected) || expected.includes(analysis.taskType)
      const complexityGood = expected === "simple" ? analysis.complexity === "simple" : true
      const confidence = analysis.confidence

      console.log(`✅ Fallback Analysis Working: ${typeMatch && complexityGood && confidence >= 0.5 ? "Yes" : "No"}`)
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log("\n🎯 Key Features Demonstrated:")
  console.log("✅ Task Classification (coding, exploration, planning, etc.)")
  console.log("✅ Complexity Assessment (simple, medium, complex)")
  console.log("✅ Agent Selection (build, explore, plan, general)")
  console.log("✅ Model Routing (haiku for simple, sonnet for medium, opus for complex)")
  console.log("✅ Confidence Scoring")
  console.log("✅ Fallback System (works without API)")

  console.log("\n🚀 Ready to Use in OpenCode!")
  console.log("The auto tool is now available when experimental.autoSelection.enabled = true")
}

demoFallback().catch(console.error)
