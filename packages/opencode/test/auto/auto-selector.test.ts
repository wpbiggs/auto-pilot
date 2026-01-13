import { test, expect } from "bun:test"
import { AutoSelector } from "../../src/auto/auto-selector"

test("fallback analysis works", async () => {
  const prompt = "Create a simple function to calculate factorial"

  const result = await AutoSelector.analyzeTask(prompt)

  expect(result).toBeDefined()
  expect(result.taskType).toBeOneOf([
    "coding",
    "exploration",
    "documentation",
    "planning",
    "debugging",
    "testing",
    "review",
  ])
  expect(result.complexity).toBeOneOf(["simple", "medium", "complex"])
  expect(result.requiresCode).toBeBoolean()
  expect(result.requiresResearch).toBeBoolean()
  expect(result.requiresMultipleSteps).toBeBoolean()
  expect(result.suggestedAgent).toBeString()
  expect(result.suggestedModel).toBeDefined()
  expect(result.confidence).toBeNumber()
  expect(result.confidence).toBeGreaterThanOrEqual(0)
  expect(result.confidence).toBeLessThanOrEqual(1)
})

test("identifies coding tasks", async () => {
  const codingPrompts = ["Create a new function", "Implement a class", "Add error handling"]

  for (const prompt of codingPrompts) {
    const result = await AutoSelector.analyzeTask(prompt)
    expect(result.taskType).toBe("coding")
    expect(result.requiresCode).toBe(true)
  }
})

test("identifies exploration tasks", async () => {
  const explorationPrompts = ["Find all API endpoints", "Explore codebase structure", "Search for database connections"]

  for (const prompt of explorationPrompts) {
    const result = await AutoSelector.analyzeTask(prompt)
    expect(["exploration", "review"]).toContain(result.taskType)
    expect(result.requiresResearch).toBe(true)
  }
})

test("determines complexity", async () => {
  const simplePrompt = "Add console.log to function"
  const complexPrompt =
    "Refactor entire authentication system with multi-provider support and implement comprehensive testing"

  const simpleResult = await AutoSelector.analyzeTask(simplePrompt)
  const complexResult = await AutoSelector.analyzeTask(complexPrompt)

  expect(simpleResult.complexity).toBe("simple")
  expect(complexResult.complexity).toBe("complex")
})
