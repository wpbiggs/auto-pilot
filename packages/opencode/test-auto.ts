#!/usr/bin/env bun

// Test script for the auto interface
import { AutoTaskTool } from "./src/auto/auto-interface"
import { Config } from "./src/config/config"

async function testAutoInterface() {
  console.log("🧪 Testing OpenCode Auto Interface...")

  try {
    // Get the config to ensure auto-selection is enabled
    const config = await Config.get()

    if (!config.experimental?.autoSelection?.enabled) {
      console.error("❌ Auto-selection is not enabled in config")
      process.exit(1)
    }

    console.log("✅ Auto-selection is enabled")
    console.log(`📊 Confidence threshold: ${config.experimental.autoSelection.confidence}`)
    console.log(`🔄 Parallel threshold: ${config.experimental.autoSelection.parallelThreshold}`)
    console.log(`🚀 Max parallel tasks: ${config.experimental.autoSelection.maxParallelTasks}`)

    // Create mock context
    const mockCtx = {
      sessionID: "test-session",
      userID: "test-user",
    }

    // Test different task types
    const testTasks = [
      {
        prompt: "Add a simple console.log statement",
        expectedType: "coding",
        expectedComplexity: "simple",
      },
      {
        prompt: "Explore the codebase structure and identify authentication patterns",
        expectedType: "exploration",
        expectedComplexity: "medium",
      },
      {
        prompt:
          "Design and implement a complete microservices architecture with API gateway, authentication service, and database migration system",
        expectedType: "planning",
        expectedComplexity: "complex",
      },
    ]

    console.log("\n🎯 Testing task analysis...")

    for (const task of testTasks) {
      console.log(`\n📝 Task: "${task.prompt}"`)

      try {
        // This would normally call the auto tool, but we'll test the selection logic directly
        const { AutoSelector } = await import("./src/auto/auto-selector")
        const selection = await AutoSelector.getAutoSelection(task.prompt)

        console.log(`✅ Analyzed successfully:`)
        console.log(`   🎯 Type: ${selection.analysis.taskType}`)
        console.log(`   📊 Complexity: ${selection.analysis.complexity}`)
        console.log(`   🤖 Agent: ${selection.agent}`)
        console.log(`   🧠 Model: ${selection.model.providerID}/${selection.model.modelID}`)
        console.log(`   📈 Confidence: ${(selection.analysis.confidence * 100).toFixed(1)}%`)

        // Check if it matches expectations
        if (selection.analysis.taskType === task.expectedType) {
          console.log(`   ✅ Task type matches expected: ${task.expectedType}`)
        } else {
          console.log(`   ⚠️  Task type mismatch: expected ${task.expectedType}, got ${selection.analysis.taskType}`)
        }

        if (selection.analysis.complexity === task.expectedComplexity) {
          console.log(`   ✅ Complexity matches expected: ${task.expectedComplexity}`)
        } else {
          console.log(
            `   ⚠️  Complexity mismatch: expected ${task.expectedComplexity}, got ${selection.analysis.complexity}`,
          )
        }
      } catch (error) {
        console.error(`   ❌ Analysis failed: ${error.message}`)
      }
    }

    console.log("\n🎉 Auto interface test completed!")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the test
testAutoInterface().catch(console.error)
