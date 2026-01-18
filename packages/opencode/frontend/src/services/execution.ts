/**
 * Execution Service - Real OpenCode SDK Integration
 * Manages task execution using OpenCode SDK sessions and prompts
 */

// Import from the monorepo SDK package via Vite alias
// @ts-ignore - Vite alias resolves this at build time
import { createOpencodeClient } from "@opencode-sdk/client"

// Types for execution
export interface TaskConfig {
  model: string
  prompt: string
  defaultPrompt: string
}

export interface ExecutionTask {
  id: string
  name: string
  description: string
  model: string
  customPrompt?: string
  complexity: string
  estimateMinutes: number
}

export interface ExecutionPlan {
  projectName: string
  description: string
  tasks: ExecutionTask[]
  phases: Array<{
    id: string
    name: string
    tasks: ExecutionTask[]
  }>
  totalEstimateMinutes: number
  estimatedCost: number
}

export interface TaskStatus {
  status: "queued" | "running" | "completed" | "failed"
  progress: number
  output?: string
  error?: string
  tokensUsed?: number
  cost?: number
  duration?: number
}

export interface ExecutionStatus {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  runningTasks: number
  queuedTasks: number
  progressPercentage: number
  isComplete: boolean
  tasks: Array<ExecutionTask & TaskStatus>
  totalTokensUsed: number
  totalCost: number
  totalDuration: number
}

export interface ExecutionEvent {
  type: 
    | "task_started" 
    | "task_progress" 
    | "task_completed" 
    | "task_failed" 
    | "execution_completed"
    | "log"
  taskId?: string
  message?: string
  logType?: "info" | "success" | "error" | "warning"
  output?: string
  error?: string
  tokensUsed?: number
  cost?: number
}

export interface AvailableModel {
  id: string
  name: string
  providerId: string
  providerName: string
  tier: "premium" | "standard" | "fast"
  available: boolean
  cost?: {
    input: number
    output: number
  }
}

export type ExecutionUpdateCallback = (status: ExecutionStatus, event: ExecutionEvent | null) => void

// Webhook/event handler type for failure escalation
export type FailureWebhookHandler = (event: EscalationEvent) => void | Promise<void>

export interface EscalationEvent {
  type: "task_failed" | "escalation_started" | "escalation_completed" | "escalation_failed"
  taskId: string
  taskName: string
  originalModel: string
  escalatedModel?: string
  escalationLevel: number
  maxEscalations: number
  error?: string
  failedOutput?: string
  prompt?: string
  timestamp: number
}

export interface EscalationConfig {
  enabled: boolean
  maxEscalations: number
  modelHierarchy: string[]
  webhookHandlers: FailureWebhookHandler[]
  includeFailedOutputInEscalation: boolean
}

// Default escalation configuration
// NOTE: modelHierarchy is empty - it will be populated dynamically from available models
const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  enabled: true,
  maxEscalations: 2,
  modelHierarchy: [], // Populated dynamically from fetchAvailableModels()
  webhookHandlers: [],
  includeFailedOutputInEscalation: true,
}

// Model tier mapping
const MODEL_TIERS: Record<string, "premium" | "standard" | "fast"> = {
  // OpenAI models
  "o3": "premium",
  "o1": "premium",
  "gpt-4o": "standard",
  "gpt-4.1": "standard",
  "gpt-4o-mini": "fast",
  "gpt-4.1-mini": "fast",
  // GitHub Copilot models
  "copilot-chat": "standard",
  // OpenCode Zen models
  "zen": "standard",
  // Google/Gemini models
  "gemini-2.5-pro": "premium",
  "gemini-2-pro": "premium",
  "gemini-pro": "standard",
  "gemini-2.5-flash": "fast",
  "gemini-2-flash": "fast",
  "gemini-flash": "fast",
  "gemini-3-flash-preview": "fast",
  // Anthropic models
  "claude-opus-4": "premium",
  "claude-sonnet-4": "standard",
  "claude-haiku-3": "fast",
}

/**
 * Infer model tier from model name when not in MODEL_TIERS
 */
function inferModelTier(modelId: string): "premium" | "standard" | "fast" {
  const id = modelId.toLowerCase()
  
  // Premium tier indicators
  if (id.includes("opus") || id.includes("pro") || id.includes("o3") || id.includes("o1") || id.includes("large")) {
    return "premium"
  }
  
  // Fast tier indicators
  if (id.includes("mini") || id.includes("flash") || id.includes("haiku") || id.includes("small") || id.includes("fast") || id.includes("nano")) {
    return "fast"
  }
  
  // Default to standard
  return "standard"
}

// Model display names
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // OpenAI models
  "o3": "OpenAI o3",
  "o1": "OpenAI o1",
  "gpt-4o": "GPT-4o",
  "gpt-4.1": "GPT-4.1",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  // GitHub Copilot models
  "copilot-chat": "GitHub Copilot",
  // OpenCode Zen models
  "zen": "OpenCode Zen",
}

// Provider display names
const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  github: "GitHub Copilot",
  "github-copilot": "GitHub Copilot",
  copilot: "GitHub Copilot",
  zen: "OpenCode Zen",
  opencode: "OpenCode",
  google: "Google",
  anthropic: "Anthropic",
}

// KNOWN VALID MODELS - Only these models should be assigned
// This prevents assignment of fake/invalid models like "gpt-5.2-codex"
const KNOWN_VALID_MODELS = new Set([
  // OpenAI
  "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
  "o1", "o1-mini", "o1-preview", "o3", "o3-mini",
  // Anthropic  
  "claude-opus-4", "claude-sonnet-4", "claude-sonnet-3.5", "claude-haiku-3", 
  "claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
  // Google
  "gemini-pro", "gemini-flash", "gemini-2-flash", "gemini-3-flash-preview", "gemini-1.5-pro", "gemini-1.5-flash",
  // GitHub Copilot
  "copilot-chat", "copilot",
  // OpenCode
  "zen", "zen-standard", "zen-fast",
])

/**
 * Validate model ID is a known valid model
 */
function isValidModel(modelId: string): boolean {
  // Check exact match first
  if (KNOWN_VALID_MODELS.has(modelId)) return true
  // Check if any known model is a prefix/suffix
  for (const known of KNOWN_VALID_MODELS) {
    if (modelId.includes(known) || known.includes(modelId)) return true
  }
  // Reject any unknown model with suspicious patterns
  if (modelId.includes("codex") && !modelId.includes("davinci")) {
    console.error(`[isValidModel] Rejecting suspicious model: ${modelId}`)
    return false
  }
  return true // Allow other models that pass basic validation
}

// Cached available models from SDK - populated on first fetch
let cachedAvailableModels: AvailableModel[] | null = null

/**
 * Get the best available model for a given complexity
 * Used for internal operations like prompt engineering and planning
 * Returns model config from cached available models
 */
async function getBestAvailableModelConfig(complexity: "fast" | "standard" | "premium" = "standard"): Promise<{ providerID: string; modelID: string }> {
  if (!cachedAvailableModels) {
    await fetchAvailableModels();
  }
  
  // Defensive null check after fetch attempt
  if (!cachedAvailableModels) {
    throw new Error("[getBestAvailableModelConfig] Failed to fetch available models.")
  }
  
  const available = cachedAvailableModels.filter(m => m.available)
  if (available.length === 0) {
    throw new Error("[getBestAvailableModelConfig] No available models configured.")
  }
  
  // Prefer well-known reliable models first (avoid experimental/preview models)
  const preferredModels = ["gpt-4o", "gpt-4.1", "claude-sonnet-4", "copilot-chat", "gpt-4o-mini", "gpt-4.1-mini"]
  for (const preferredId of preferredModels) {
    const match = available.find(m => m.id === preferredId || m.id.includes(preferredId))
    if (match) {
      console.log("[getBestAvailableModelConfig] Selected preferred model:", match.id, "from provider:", match.providerId)
      return { providerID: match.providerId, modelID: match.id }
    }
  }
  
  // Find best model for the requested tier, avoiding preview/experimental models
  const safeModels = available.filter(m => !m.id.includes("preview") && !m.id.includes("experimental"))
  const tierModels = safeModels.filter(m => m.tier === complexity)
  if (tierModels.length > 0) {
    const model = tierModels[0]!
    console.log("[getBestAvailableModelConfig] Selected tier model:", model.id, "from provider:", model.providerId)
    return { providerID: model.providerId, modelID: model.id }
  }
  
  // Fall back to any available model, preferring standard tier
  const standardModels = safeModels.filter(m => m.tier === "standard")
  if (standardModels.length > 0) {
    const model = standardModels[0]!
    console.log("[getBestAvailableModelConfig] Selected standard model:", model.id, "from provider:", model.providerId)
    return { providerID: model.providerId, modelID: model.id }
  }
  
  // Use first available non-preview model
  if (safeModels.length > 0) {
    const model = safeModels[0]!
    console.log("[getBestAvailableModelConfig] Selected safe fallback model:", model.id, "from provider:", model.providerId)
    return { providerID: model.providerId, modelID: model.id }
  }
  
  // Last resort: use any available model
  const model = available[0]!
  console.log("[getBestAvailableModelConfig] Selected last-resort model:", model.id, "from provider:", model.providerId)
  return { providerID: model.providerId, modelID: model.id }
}

/**
 * Get the OpenCode SDK client instance
 * Uses Vite proxy in development (empty baseUrl routes through proxy to localhost:4096)
 * Falls back to explicit localhost:4096 if VITE_OPENCODE_URL is not set
 */
function getClient(baseUrl?: string) {
  // Priority: explicit baseUrl > env var > empty string for Vite proxy
  const url = baseUrl || import.meta.env.VITE_OPENCODE_URL || "";
  console.log(`[SDK] Creating client with baseUrl: "${url || '(using Vite proxy)'}"`);
  return createOpencodeClient({ baseUrl: url })
}

/**
 * Fetch available models from the OpenCode SDK
 * Throws error if no models are available - never falls back to hardcoded lists
 */
export async function fetchAvailableModels(baseUrl?: string): Promise<AvailableModel[]> {
  const client = getClient(baseUrl)
  const response = await client.provider.list()
  
  if (!response.data) {
    throw new Error("[ExecutionService] No provider data returned from OpenCode SDK")
  }

  const { all: providers, connected } = response.data
  const connectedSet = new Set(connected || [])
  const models: AvailableModel[] = []

  for (const provider of providers) {
    const isConnected = connectedSet.has(provider.id)
    
    for (const [modelId, modelInfo] of Object.entries(provider.models)) {
      const info = modelInfo as { name?: string; experimental?: boolean; cost?: { input: number; output: number } }
      models.push({
        id: modelId,
        name: MODEL_DISPLAY_NAMES[modelId] || info.name || modelId,
        providerId: provider.id,
        providerName: PROVIDER_NAMES[provider.id] || provider.name,
        tier: MODEL_TIERS[modelId] || inferModelTier(modelId),
        available: isConnected && !info.experimental,
        cost: info.cost ? {
          input: info.cost.input,
          output: info.cost.output,
        } : undefined,
      })
    }
  }

  // Filter to only available models
  const availableModels = models.filter(m => m.available)
  
  if (availableModels.length === 0) {
    throw new Error("[ExecutionService] No configured models available. Please configure at least one provider in OpenCode.")
  }
  
  // Log all available models for debugging
  console.log("[fetchAvailableModels] Available models:", availableModels.map(m => ({
    id: m.id,
    provider: m.providerId,
    tier: m.tier,
    valid: isValidModel(m.id)
  })))
  
  // Filter out invalid/fake models
  const validModels = availableModels.filter(m => {
    const valid = isValidModel(m.id)
    if (!valid) {
      console.warn(`[fetchAvailableModels] Filtering out invalid model: ${m.id}`)
    }
    return valid
  })
  
  if (validModels.length === 0) {
    throw new Error("[ExecutionService] No valid models available after filtering. Available models may be fake/invalid.")
  }

  // Sort by availability and tier
  const sorted = validModels.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1
    const tierOrder = { premium: 0, standard: 1, fast: 2 }
    return tierOrder[a.tier] - tierOrder[b.tier]
  })
  
  console.log("[fetchAvailableModels] Final valid model list:", sorted.map(m => m.id))
  
  // Update the cache
  cachedAvailableModels = sorted
  
  return sorted
}

/**
 * Get default models when SDK is not available
 * Returns empty array - we no longer provide hardcoded fallbacks
 * The system should always use models from fetchAvailableModels()
 */
function getDefaultModels(): AvailableModel[] {
  console.warn("[ExecutionService] getDefaultModels() called - this should not happen in normal operation")
  console.warn("[ExecutionService] Please ensure OpenCode SDK is connected and has configured providers")
  return []
}

/**
 * Map a model ID to full model configuration
 * Dynamically looks up the provider from cached available models
 * Prefers native providers (e.g., OpenAI for gpt-* models, not GitHub Copilot)
 */
function getModelConfig(modelName: string): { providerID: string; modelID: string } {
  // Look up from cached available models
  if (cachedAvailableModels) {
    // Find all models with this ID (might be available from multiple providers)
    const matchingModels = cachedAvailableModels.filter(m => m.id === modelName)
    
    if (matchingModels.length > 0) {
      // Prefer native provider for the model type
      const nativeProviderMap: Record<string, string[]> = {
        "gpt": ["openai"],
        "o1": ["openai"],
        "o3": ["openai"],
        "claude": ["anthropic"],
        "gemini": ["google"],
        "copilot": ["github", "github-copilot"],
        "zen": ["zen", "opencode"],
      }
      
      // Find native provider for this model
      for (const [prefix, nativeProviders] of Object.entries(nativeProviderMap)) {
        if (modelName.toLowerCase().startsWith(prefix)) {
          // Look for a model from the native provider
          const nativeModel = matchingModels.find(m => 
            nativeProviders.includes(m.providerId.toLowerCase())
          )
          if (nativeModel) {
            console.log(`[getModelConfig] Using native provider ${nativeModel.providerId} for ${modelName}`)
            return { providerID: nativeModel.providerId, modelID: nativeModel.id }
          }
        }
      }
      
      // No native provider found, use first available
      const model = matchingModels[0]!
      console.log(`[getModelConfig] Using provider ${model.providerId} for ${modelName}`)
      return { providerID: model.providerId, modelID: model.id }
    }
  }
  
  // If not in cache, try common provider prefixes as heuristic
  // This handles cases where models haven't been cached yet
  if (modelName.startsWith("gpt-") || modelName.startsWith("o1") || modelName.startsWith("o3")) {
    console.log(`[getModelConfig] Heuristic: Using OpenAI provider for ${modelName}`)
    return { providerID: "openai", modelID: modelName }
  }
  if (modelName.startsWith("claude")) {
    console.log(`[getModelConfig] Heuristic: Using Anthropic provider for ${modelName}`)
    return { providerID: "anthropic", modelID: modelName }
  }
  if (modelName.startsWith("gemini")) {
    console.log(`[getModelConfig] Heuristic: Using Google provider for ${modelName}`)
    return { providerID: "google", modelID: modelName }
  }
  if (modelName.includes("copilot")) {
    return { providerID: "github", modelID: modelName }
  }
  if (modelName === "zen" || modelName.startsWith("zen-")) {
    return { providerID: "zen", modelID: modelName }
  }
  
  // Last resort: assume the model ID contains provider info or just use as-is
  console.warn(`[getModelConfig] Model "${modelName}" not found in available models, using as-is with 'opencode' provider`)
  return { providerID: "opencode", modelID: modelName }
}

/**
 * Critical requirements appended to all prompts for production-ready code
 */
const CRITICAL_REQUIREMENTS = `
## CRITICAL REQUIREMENTS - READ CAREFULLY

### 🛡️ WORKSPACE BOUNDARY - ABSOLUTE SECURITY REQUIREMENT:
- **ONLY modify files within the current project directory**
- **NEVER navigate to parent directories (../) outside the project**
- **NEVER modify files in /home, /etc, /usr, or any system directories**
- **NEVER delete files outside the current project**
- **If you're unsure if a path is within the project, DO NOT modify it**
- **All file operations must use relative paths from project root**

### ⚠️ ABSOLUTE REQUIREMENTS (MUST FOLLOW):
1. **COMPLETE IMPLEMENTATION ONLY** - Every function, method, and component MUST be fully implemented
2. **NO STUBS OR PLACEHOLDERS** - NEVER write stub functions, TODO comments, "// implement later", or placeholder code
3. **NO PARTIAL IMPLEMENTATIONS** - Do not leave any functionality unimplemented
4. **PRODUCTION-READY CODE** - All code must be ready for immediate production deployment
5. **WORKING CODE ONLY** - Every line of code you write must actually work

### 🚫 EXPLICITLY FORBIDDEN (NEVER DO THESE):
- ❌ "// TODO: implement this"
- ❌ "throw new Error('Not implemented')"
- ❌ "pass  # placeholder"
- ❌ "/* stub */", "/* placeholder */"
- ❌ "return null // temporary"
- ❌ Functions that just log "not implemented"
- ❌ Empty function bodies
- ❌ Comments like "implement later", "add logic here", "finish this"
- ❌ Returning mock/fake data when real implementation is needed
- ❌ Modifying ANY file outside the current project directory
- ❌ Using rm -rf or mass delete operations
- ❌ Navigating to parent directories beyond the project root

### ✅ REQUIRED IN ALL CODE:
1. **Complete Error Handling** - Handle all error cases with proper try/catch, error types, and recovery
2. **Input Validation** - Validate all inputs with clear error messages
3. **Edge Cases** - Handle null, undefined, empty arrays, invalid types
4. **Type Safety** - Use proper types (TypeScript) or type hints (Python)
5. **Security** - Never expose secrets, validate user input, prevent injection attacks
6. **Logging** - Add appropriate logging for debugging and monitoring
7. **Documentation** - Include JSDoc/docstrings for public APIs
8. **Tests** - Write unit tests if the task involves testable logic

### Implementation Approach:
1. Read the entire task description carefully
2. Plan the complete solution before writing code
3. Implement ALL functionality - no shortcuts
4. Test your logic mentally before finalizing
5. Review for any missing pieces or stubs

### Output Format:
Provide the complete, working implementation with:
- All necessary imports
- All function implementations (fully working)
- All error handling
- All edge case handling
- Clear comments explaining complex logic
- Ready to copy-paste and run immediately

Remember: If you cannot fully implement something, explain why and provide the closest complete alternative. NEVER leave placeholder code.`

/**
 * Engineer an optimal prompt using Big Pickle model
 * Big Pickle specializes in creating task-specific, optimized prompts
 */
async function engineerPromptWithBigPickle(params: {
  originalIdea: string
  taskName: string
  taskDescription: string
  taskComplexity: string
  targetModel: string
  baseUrl?: string
}): Promise<string> {
  try {
    const client = getClient(params.baseUrl)
    
    // Create a session for Big Pickle prompt engineering
    const sessionResult = await client.session.create({
      body: {
        title: `Prompt Engineering: ${params.taskName.substring(0, 40)}`
      }
    })

    if (!sessionResult.data?.id) {
      console.warn("[BigPickle] Failed to create session, falling back to default prompt")
      return buildFallbackPrompt(params.taskName, params.taskDescription, params.originalIdea)
    }

    const sessionId = sessionResult.data.id

    // Use Big Pickle (or a capable model) to engineer the prompt
    const engineeringPrompt = `You are a prompt engineering expert specializing in creating optimal prompts for AI coding assistants.

Your task is to create a highly effective, detailed prompt that will guide an AI model to produce complete, production-ready code.

## Context

**Original Project Idea:**
${params.originalIdea}

**Specific Task to Complete:**
Task Name: ${params.taskName}
Task Description: ${params.taskDescription}

**Task Complexity:** ${params.taskComplexity}
**Target AI Model:** ${params.targetModel}

## Your Mission

Engineer an optimal prompt that:
1. Clearly defines the task scope and requirements
2. Provides specific technical guidance based on the complexity level
3. Includes relevant context from the original project idea
4. Is tailored to the target model's strengths
5. Emphasizes complete, working implementations (no stubs/TODOs)
6. Specifies expected output format and quality standards
7. Includes edge cases and error handling requirements

## Output Format

Provide ONLY the engineered prompt text that should be sent to the target model. Do not include any meta-commentary or explanations - just the optimized prompt itself.

The prompt should be comprehensive yet focused, guiding the AI to produce excellent, production-ready code.`

    // Use the best available standard-tier model for prompt engineering
    const modelConfig = await getBestAvailableModelConfig("standard")
    
    const response = await client.session.prompt({
      path: { id: sessionId },
      body: {
        model: modelConfig,
        parts: [{ type: "text" as const, text: engineeringPrompt }]
      }
    })

    const engineeredPrompt = extractResponseText(response)
    
    if (!engineeredPrompt || engineeredPrompt.trim().length < 100) {
      console.warn("[BigPickle] Received insufficient prompt, falling back to default")
      return buildFallbackPrompt(params.taskName, params.taskDescription, params.originalIdea)
    }

    console.log(`[BigPickle] Successfully engineered prompt for: ${params.taskName}`)
    return engineeredPrompt

  } catch (error) {
    console.error("[BigPickle] Prompt engineering failed:", error)
    return buildFallbackPrompt(params.taskName, params.taskDescription, params.originalIdea)
  }
}

/**
 * Fallback prompt builder when Big Pickle is unavailable
 */
function buildFallbackPrompt(taskName: string, taskDescription: string, projectContext: string): string {
  return `You are an expert senior software developer with extensive production experience. Complete the following task with FULL, PRODUCTION-READY implementation.

## Project Context
${projectContext}

## Task: ${taskName}

### Description
${taskDescription}`
}

/**
 * Phase-specific prompt strategies for different execution phases
 * Each phase has unique requirements and focus areas
 */
interface PhaseContext {
  phaseId: string
  phaseName: string
  phaseIndex: number
  totalPhases: number
  previousPhaseOutputs?: string[]
}

/**
 * Get phase-specific prompt enhancements based on the phase type
 */
function getPhaseSpecificGuidance(task: ExecutionTask, phaseContext?: PhaseContext): string {
  if (!phaseContext) {
    return ""
  }

  const phaseName = phaseContext.phaseName.toLowerCase()
  
  // Foundation/Setup phase
  if (phaseName.includes("foundation") || phaseName.includes("setup") || phaseName.includes("init")) {
    return `
## Phase-Specific Requirements: FOUNDATION PHASE

This is a FOUNDATION task that sets up the project infrastructure.

### Special Focus Areas:
1. **Project Structure** - Create a clean, scalable folder structure
2. **Dependencies** - Select appropriate, well-maintained packages
3. **Configuration** - Set up build tools, linting, and formatting
4. **Type Definitions** - Establish core types/interfaces that other phases will use
5. **Best Practices** - Follow industry standards for the chosen framework/language

### Output Expectations:
- Complete package.json or equivalent with all needed dependencies
- Configuration files (tsconfig, eslint, prettier, etc.)
- Basic folder structure with placeholder directories
- Core type definitions and interfaces
- README with setup instructions

### Critical for Downstream Tasks:
Subsequent phases depend on the structure you create. Ensure:
- Clear separation of concerns
- Consistent naming conventions
- Proper exports and module boundaries`
  }
  
  // Core Implementation phase
  if (phaseName.includes("core") || phaseName.includes("implementation") || phaseName.includes("feature")) {
    return `
## Phase-Specific Requirements: CORE IMPLEMENTATION PHASE

This is a CORE IMPLEMENTATION task building the main functionality.

### Special Focus Areas:
1. **Business Logic** - Implement complete, working business rules
2. **Data Flow** - Clear data transformation and state management
3. **Integration Points** - Well-defined interfaces for components to interact
4. **Error Boundaries** - Graceful error handling at component boundaries
5. **Performance** - Consider efficiency from the start

### Output Expectations:
- Fully functional feature implementation
- All helper functions fully implemented (NO stubs)
- Proper TypeScript types throughout
- Unit-testable code structure
- Clear separation between UI and logic

### Building on Foundation:
This phase uses the types and structure from the Foundation phase.
Ensure your implementation:
- Uses the established type definitions
- Follows the folder structure conventions
- Integrates with existing patterns`
  }
  
  // Integration phase
  if (phaseName.includes("integration") || phaseName.includes("connect")) {
    return `
## Phase-Specific Requirements: INTEGRATION PHASE

This is an INTEGRATION task connecting components together.

### Special Focus Areas:
1. **API Contracts** - Clear interfaces between components
2. **Data Transformation** - Convert data formats as needed
3. **Error Propagation** - Handle errors across boundaries
4. **State Synchronization** - Keep data consistent across components
5. **Testing Integration Points** - Verify connections work correctly

### Output Expectations:
- Working connections between all components
- Clear data flow documentation
- Error handling for all failure modes
- Integration tests where appropriate`
  }
  
  // Testing phase
  if (phaseName.includes("test") || phaseName.includes("quality")) {
    return `
## Phase-Specific Requirements: TESTING & QUALITY PHASE

This is a TESTING task ensuring code quality and correctness.

### Special Focus Areas:
1. **Test Coverage** - Cover critical paths and edge cases
2. **Unit Tests** - Test individual functions and components
3. **Integration Tests** - Test component interactions
4. **Error Cases** - Test failure scenarios
5. **Edge Cases** - Test boundary conditions

### Output Expectations:
- Complete test files with passing tests
- Test utilities and mocks as needed
- Clear test descriptions
- Coverage for happy path and error cases
- Setup and teardown properly handled`
  }
  
  // Polish/Documentation phase
  if (phaseName.includes("polish") || phaseName.includes("document") || phaseName.includes("finish")) {
    return `
## Phase-Specific Requirements: POLISH & DOCUMENTATION PHASE

This is a POLISH task finalizing the project.

### Special Focus Areas:
1. **Documentation** - Clear README and API docs
2. **Code Comments** - Document complex logic
3. **Error Messages** - User-friendly error text
4. **Edge Cases** - Handle remaining edge cases
5. **Cleanup** - Remove dead code and console logs

### Output Expectations:
- Comprehensive README with usage examples
- API documentation for public interfaces
- JSDoc/TSDoc comments on exported functions
- Consistent code formatting
- No TODO comments or placeholders remaining`
  }

  return ""
}

/**
 * Build the prompt for a task - Uses phase-aware prompt engineering
 * Creates tailored prompts based on task phase and context
 */
async function buildTaskPrompt(
  task: ExecutionTask, 
  projectDescription: string,
  options?: { 
    baseUrl?: string
    useBigPickle?: boolean
    phaseContext?: PhaseContext
  }
): Promise<string> {
  const useBigPickle = options?.useBigPickle ?? true
  
  // Get phase-specific guidance
  const phaseGuidance = getPhaseSpecificGuidance(task, options?.phaseContext)

  // If custom prompt is provided, use it directly with critical requirements
  if (task.customPrompt) {
    return `${task.customPrompt}${phaseGuidance}\n\n${CRITICAL_REQUIREMENTS}`
  }

  // Use Big Pickle to engineer an optimal prompt
  if (useBigPickle) {
    try {
      const engineeredPrompt = await engineerPromptWithBigPickle({
        originalIdea: projectDescription,
        taskName: task.name,
        taskDescription: task.description,
        taskComplexity: task.complexity,
        targetModel: task.model,
        baseUrl: options?.baseUrl,
      })

      return `${engineeredPrompt}${phaseGuidance}\n\n${CRITICAL_REQUIREMENTS}`
    } catch (error) {
      console.warn("[BuildTaskPrompt] Big Pickle failed, using fallback:", error)
    }
  }

  // Fallback to standard prompt with phase guidance
  const fallbackPrompt = buildFallbackPrompt(task.name, task.description, projectDescription)
  return `${fallbackPrompt}${phaseGuidance}\n\n${CRITICAL_REQUIREMENTS}`
}

/**
 * Build an escalation prompt when a task fails
 */
function buildEscalationPrompt(
  task: ExecutionTask,
  projectDescription: string,
  failedOutput: string,
  error: string,
  escalationLevel: number
): string {
  return `You are a SENIOR EXPERT developer called in to fix a failed task. A previous AI agent attempted this task but failed.

## Your Mission
Analyze the failure and provide a COMPLETE, WORKING solution. You have more capability than the previous agent - use it.

## Project Context
${projectDescription}

## Original Task: ${task.name}

### Description
${task.description}

## Previous Failure Analysis

### Error Message:
\`\`\`
${error}
\`\`\`

### Failed Attempt Output:
\`\`\`
${failedOutput || "No output was generated before failure"}
\`\`\`

### Escalation Level: ${escalationLevel} (higher = more critical, you are the expert backup)

## Your Responsibilities:

1. **Diagnose the Failure** - Understand exactly why the previous attempt failed
2. **Fix the Root Cause** - Don't just patch symptoms, fix the underlying issue
3. **Complete Implementation** - Provide the FULL working solution, not just fixes
4. **Add Robustness** - Make the solution more resilient than the original attempt

## CRITICAL REQUIREMENTS:

### ⚠️ ABSOLUTE REQUIREMENTS:
- You MUST succeed where the previous agent failed
- Provide COMPLETE, PRODUCTION-READY code
- NO stubs, NO TODOs, NO placeholders
- Handle ALL edge cases that might have caused the failure
- Add extra error handling and validation

### 🚫 EXPLICITLY FORBIDDEN:
- ❌ Returning the same broken code
- ❌ Any placeholder or stub code
- ❌ "TODO" or "implement later" comments
- ❌ Partial implementations
- ❌ Skipping error handling

### ✅ REQUIRED:
- Complete working implementation
- Comprehensive error handling
- Input validation
- Edge case handling
- Clear documentation

## Output:

Provide:
1. Brief analysis of what went wrong (2-3 sentences)
2. Complete, working solution
3. Explanation of how your solution prevents the original failure

Remember: You are the escalation expert. The previous attempt failed - you MUST provide a working solution.`
}

/**
 * Get the next model in the escalation hierarchy
 * Dynamically builds hierarchy from available models if not provided
 */
function getEscalationModel(
  currentModel: string,
  escalationConfig: EscalationConfig
): string | null {
  let hierarchy = escalationConfig.modelHierarchy
  
  // If hierarchy is empty, build it dynamically from cached models
  if (hierarchy.length === 0 && cachedAvailableModels) {
    const available = cachedAvailableModels.filter(m => m.available)
    // Build hierarchy: fast -> standard -> premium
    const fastModels = available.filter(m => m.tier === "fast").map(m => m.id)
    const standardModels = available.filter(m => m.tier === "standard").map(m => m.id)
    const premiumModels = available.filter(m => m.tier === "premium").map(m => m.id)
    hierarchy = [...fastModels, ...standardModels, ...premiumModels]
  }
  
  if (hierarchy.length === 0) {
    console.warn("[getEscalationModel] No models in escalation hierarchy")
    return null
  }
  
  const currentIndex = hierarchy.findIndex(m => 
    m === currentModel || 
    currentModel.includes(m) || 
    m.includes(currentModel)
  )
  
  // If not found, return the first model after the current tier
  if (currentIndex === -1) {
    // Find a higher-tier model than whatever the current model might be
    // Default to returning the highest tier model available
    return hierarchy[hierarchy.length - 1] ?? null
  }
  
  // Return next higher tier model
  if (currentIndex < hierarchy.length - 1) {
    return hierarchy[currentIndex + 1] ?? null
  }
  
  // Already at highest tier
  return null
}

/**
 * Extract text content from SDK response
 */
function extractResponseText(response: any): string {
  if (typeof response === "string") return response
  if (response?.data?.parts) {
    return response.data.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || p.content || "")
      .join("\n")
  }
  if (response?.data?.content) return response.data.content
  if (response?.data?.text) return response.data.text
  if (response?.content) return response.content
  if (response?.text) return response.text
  if (Array.isArray(response?.data)) {
    return response.data
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || p.content)
      .join("\n")
  }
  return JSON.stringify(response, null, 2)
}

/**
 * Real Execution Service using OpenCode SDK
 * Supports failure escalation to more powerful models
 */
export function createExecutionService(
  plan: ExecutionPlan,
  onUpdate: ExecutionUpdateCallback,
  options?: {
    baseUrl?: string
    maxParallel?: number
    retryOnFailure?: boolean
    maxRetries?: number
    escalation?: Partial<EscalationConfig>
    onEscalation?: FailureWebhookHandler
  }
) {
  // Merge escalation config with defaults
  const escalationConfig: EscalationConfig = {
    ...DEFAULT_ESCALATION_CONFIG,
    ...options?.escalation,
    webhookHandlers: [
      ...DEFAULT_ESCALATION_CONFIG.webhookHandlers,
      ...(options?.onEscalation ? [options.onEscalation] : []),
      ...(options?.escalation?.webhookHandlers || []),
    ],
  }

  const config = {
    baseUrl: options?.baseUrl,
    maxParallel: options?.maxParallel || 1, // Default to sequential for safety
    retryOnFailure: options?.retryOnFailure ?? true,
    maxRetries: options?.maxRetries || 2,
    escalation: escalationConfig,
  }

  let running = true
  let paused = false
  let client: ReturnType<typeof getClient> | null = null
  
  const taskStates = new Map<string, TaskStatus>()
  const taskRetries = new Map<string, number>()
  const taskEscalations = new Map<string, number>() // Track escalation count per task
  const taskEscalationHistory = new Map<string, Array<{model: string, error: string, output: string}>>()
  
  // Track active task controllers for cancellation
  const activeControllers = new Map<string, AbortController>()
  const activeSessions = new Map<string, string>() // taskId -> sessionId for cancellation
  
  // Track completed/failed tasks to prevent re-execution
  const completedTasks = new Set<string>()
  const failedTasks = new Set<string>()
  const executingTasks = new Set<string>() // Prevent duplicate concurrent execution
  
  // Initialize all tasks as queued
  plan.tasks.forEach(task => {
    taskStates.set(task.id, { status: "queued", progress: 0 })
    taskRetries.set(task.id, 0)
    taskEscalations.set(task.id, 0)
    taskEscalationHistory.set(task.id, [])
  })

  // Metrics
  let totalTokensUsed = 0
  let totalCost = 0
  let totalDuration = 0

  const getStatus = (): ExecutionStatus => {
    const states = [...taskStates.entries()]
    const completed = states.filter(([, t]) => t.status === "completed").length
    const failed = states.filter(([, t]) => t.status === "failed").length
    const runningCount = states.filter(([, t]) => t.status === "running").length
    const queued = states.filter(([, t]) => t.status === "queued").length

    return {
      totalTasks: plan.tasks.length,
      completedTasks: completed,
      failedTasks: failed,
      runningTasks: runningCount,
      queuedTasks: queued,
      progressPercentage: Math.round((completed / plan.tasks.length) * 100),
      isComplete: completed + failed === plan.tasks.length,
      tasks: plan.tasks.map(t => ({
        ...t,
        ...taskStates.get(t.id)!
      })),
      totalTokensUsed,
      totalCost,
      totalDuration,
    }
  }

  const emitLog = (type: "info" | "success" | "error" | "warning", message: string) => {
    onUpdate(getStatus(), { type: "log", logType: type, message })
  }

  // Find phase context for a task
  const getPhaseContextForTask = (task: ExecutionTask): PhaseContext | undefined => {
    for (let i = 0; i < plan.phases.length; i++) {
      const phase = plan.phases[i]
      if (phase && phase.tasks.some(t => t.id === task.id)) {
        return {
          phaseId: phase.id,
          phaseName: phase.name,
          phaseIndex: i,
          totalPhases: plan.phases.length,
        }
      }
    }
    return undefined
  }

  const executeTask = async (task: ExecutionTask): Promise<void> => {
    // CRITICAL: Guard against duplicate execution
    if (completedTasks.has(task.id)) {
      console.warn(`[ExecutionService] Task ${task.id} already completed, skipping re-execution`)
      return
    }
    if (failedTasks.has(task.id)) {
      console.warn(`[ExecutionService] Task ${task.id} already failed permanently, skipping re-execution`)
      return
    }
    if (executingTasks.has(task.id)) {
      console.warn(`[ExecutionService] Task ${task.id} already executing, skipping duplicate execution`)
      return
    }
    
    // Mark task as currently executing
    executingTasks.add(task.id)
    console.log(`[ExecutionService] Starting task ${task.id}: ${task.name}`)
    
    const startTime = Date.now()
    
    // Create AbortController for this task
    const abortController = new AbortController()
    activeControllers.set(task.id, abortController)
    
    // Get phase context for tailored prompts
    const phaseContext = getPhaseContextForTask(task)
    
    try {
      // Update status to running
      taskStates.set(task.id, { status: "running", progress: 0 })
      onUpdate(getStatus(), { type: "task_started", taskId: task.id })
      emitLog("info", `Starting task: ${task.name}${phaseContext ? ` (Phase: ${phaseContext.phaseName})` : ""}`)

      // Initial progress - task initialization
      taskStates.set(task.id, { status: "running", progress: 10 })
      onUpdate(getStatus(), null)

      // Create a new session for this task
      const sessionResult = await client!.session.create({
        body: {
          title: `Auto: ${task.name.substring(0, 50)}`
        }
      })

      if (!sessionResult.data?.id) {
        throw new Error("Failed to create session")
      }

      const sessionId = sessionResult.data.id
      activeSessions.set(task.id, sessionId) // Store for cancellation
      
      // Check if aborted during session creation
      if (abortController.signal.aborted) {
        throw new Error("Task was cancelled during session creation")
      }
      
      emitLog("info", `Created session for: ${task.name}`)

      // Update progress
      taskStates.set(task.id, { status: "running", progress: 30 })
      onUpdate(getStatus(), null)

      // Get model configuration
      const modelConfig = getModelConfig(task.model)

      // Build the prompt with phase-aware context
      const prompt = await buildTaskPrompt(task, plan.description, { 
        baseUrl: config.baseUrl,
        phaseContext
      })

      // Execute via SDK session.prompt with timeout to prevent hanging
      console.log(`[ExecutionService] Executing task ${task.id} with model:`, modelConfig)
      emitLog("info", `Executing with ${modelConfig.modelID}...`)
      taskStates.set(task.id, { status: "running", progress: 50 })
      onUpdate(getStatus(), null)

      // Complexity-based timeout: simple=3min, medium=5min, complex=10min
      // Extended timeout for codex/o1/o3 models that can take longer
      const isSlowModel = modelConfig.modelID.includes("codex") || 
                          modelConfig.modelID.includes("o1") || 
                          modelConfig.modelID.includes("o3") ||
                          modelConfig.modelID.includes("opus")
      const TIMEOUT_BY_COMPLEXITY: Record<string, number> = {
        simple: isSlowModel ? 10 * 60 * 1000 : 3 * 60 * 1000,
        medium: isSlowModel ? 15 * 60 * 1000 : 5 * 60 * 1000,
        complex: isSlowModel ? 20 * 60 * 1000 : 10 * 60 * 1000,
      }
      const TASK_TIMEOUT_MS = TIMEOUT_BY_COMPLEXITY[task.complexity] || (isSlowModel ? 15 * 60 * 1000 : 5 * 60 * 1000)
      
      // Create a timeout that also triggers abort
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error(`[ExecutionService] Task ${task.id} timed out after ${TASK_TIMEOUT_MS / 1000}s`)
          abortController.abort()
          reject(new Error(`Task execution timed out after ${Math.round(TASK_TIMEOUT_MS / 60000)} minutes`))
        }, TASK_TIMEOUT_MS)
      })
      
      // Also reject on abort signal
      const abortPromise = new Promise<never>((_, reject) => {
        abortController.signal.addEventListener("abort", () => {
          reject(new Error("Task was cancelled"))
        })
      })

      try {
        const response = await Promise.race([
          client!.session.prompt({
            path: { id: sessionId },
            body: {
              model: modelConfig,
              parts: [{ type: "text" as const, text: prompt }]
            }
          }),
          timeoutPromise,
          abortPromise
        ])
        
        // Clear timeout on successful completion
        if (timeoutId) clearTimeout(timeoutId)

        // Extract output
        const output = extractResponseText(response)
        const duration = Date.now() - startTime
        
        // Estimate tokens and cost (rough estimation)
        const estimatedTokens = Math.round((prompt.length + output.length) / 4)
        const costPerToken = modelConfig.modelID.includes("opus") ? 0.015 / 1000 
          : modelConfig.modelID.includes("gpt-4o") && !modelConfig.modelID.includes("mini") ? 0.01 / 1000
          : 0.003 / 1000
        const estimatedCost = estimatedTokens * costPerToken

        // Update totals
        totalTokensUsed += estimatedTokens
        totalCost += estimatedCost
        totalDuration += duration

        // Update task status
        taskStates.set(task.id, {
          status: "completed",
          progress: 100,
          output: output.substring(0, 2000) + (output.length > 2000 ? "..." : ""),
          tokensUsed: estimatedTokens,
          cost: estimatedCost,
          duration,
        })
        
        // Mark as permanently completed - prevents re-execution
        completedTasks.add(task.id)
        executingTasks.delete(task.id)
        activeControllers.delete(task.id)
        activeSessions.delete(task.id)
        console.log(`[ExecutionService] Task ${task.id} completed successfully`)

        onUpdate(getStatus(), { 
          type: "task_completed", 
          taskId: task.id,
          output: output.substring(0, 500),
          tokensUsed: estimatedTokens,
          cost: estimatedCost,
        })
        emitLog("success", `Completed: ${task.name} (${Math.round(duration / 1000)}s)`)
        
      } catch (innerError: any) {
        // Clear timeout if it exists
        if (timeoutId) clearTimeout(timeoutId)
        // Re-throw to outer catch for retry/escalation handling
        throw innerError
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`[ExecutionService] Task ${task.id} failed:`, error)
      
      // Clean up controllers
      activeControllers.delete(task.id)
      activeSessions.delete(task.id)
      executingTasks.delete(task.id)
      
      const failedOutput = taskStates.get(task.id)?.output || ""
      const errorMessage = error.message || "Unknown error"
      
      // Check if this was a cancellation - don't retry cancelled tasks
      if (errorMessage.includes("cancelled") || abortController.signal.aborted) {
        emitLog("warning", `Task ${task.name} was cancelled`)
        taskStates.set(task.id, {
          status: "failed",
          progress: 0,
          error: "Task was cancelled",
          duration,
        })
        failedTasks.add(task.id)
        onUpdate(getStatus(), { 
          type: "task_failed", 
          taskId: task.id,
          error: "Task was cancelled",
        })
        return
      }
      
      // Record in escalation history
      const history = taskEscalationHistory.get(task.id) || []
      history.push({ model: task.model, error: errorMessage, output: failedOutput })
      taskEscalationHistory.set(task.id, history)
      
      // Check if should retry with same model first
      const retries = taskRetries.get(task.id) || 0
      console.log(`[ExecutionService] Task ${task.id} retry check: attempt ${retries + 1}/${config.maxRetries + 1}`)
      
      if (config.retryOnFailure && retries < config.maxRetries) {
        taskRetries.set(task.id, retries + 1)
        emitLog("warning", `Retrying ${task.name} (attempt ${retries + 2}/${config.maxRetries + 1})`)
        
        // Reset to queued for retry - but NOT executingTasks since we're calling executeTask
        taskStates.set(task.id, { status: "queued", progress: 0 })
        // executingTasks already deleted above, so recursive call will work
        await executeTask(task)
        return
      }
      
      // Check if escalation is enabled and possible
      const currentEscalations = taskEscalations.get(task.id) || 0
      const canEscalate = config.escalation.enabled && 
                          currentEscalations < config.escalation.maxEscalations

      if (canEscalate) {
        const escalatedModel = getEscalationModel(task.model, config.escalation)
        
        if (escalatedModel && escalatedModel !== task.model) {
          // Trigger escalation webhooks
          const escalationEvent: EscalationEvent = {
            type: "escalation_started",
            taskId: task.id,
            taskName: task.name,
            originalModel: task.model,
            escalatedModel,
            escalationLevel: currentEscalations + 1,
            maxEscalations: config.escalation.maxEscalations,
            error: errorMessage,
            failedOutput: config.escalation.includeFailedOutputInEscalation ? failedOutput : undefined,
            prompt: await buildTaskPrompt(task, plan.description, { baseUrl: config.baseUrl }),
            timestamp: Date.now(),
          }
          
          // Call all webhook handlers
          for (const handler of config.escalation.webhookHandlers) {
            try {
              await handler(escalationEvent)
            } catch (webhookError) {
              console.error("[ExecutionService] Webhook handler error:", webhookError)
            }
          }
          
          emitLog("warning", `⬆️ Escalating ${task.name} from ${task.model} to ${escalatedModel}`)
          
          // Update escalation tracking
          taskEscalations.set(task.id, currentEscalations + 1)
          taskRetries.set(task.id, 0) // Reset retries for new model
          
          // Execute with escalated model
          await executeEscalatedTask(task, escalatedModel, errorMessage, failedOutput, currentEscalations + 1)
          return
        }
      }

      // Mark as failed (no more escalations possible)
      taskStates.set(task.id, {
        status: "failed",
        progress: 0,
        error: errorMessage,
        duration,
      })
      
      // Mark as permanently failed - prevents re-execution
      failedTasks.add(task.id)
      console.log(`[ExecutionService] Task ${task.id} permanently failed after ${currentEscalations} escalations`)
      
      // Fire failure webhook
      const failureEvent: EscalationEvent = {
        type: "escalation_failed",
        taskId: task.id,
        taskName: task.name,
        originalModel: task.model,
        escalationLevel: currentEscalations,
        maxEscalations: config.escalation.maxEscalations,
        error: errorMessage,
        failedOutput,
        timestamp: Date.now(),
      }
      
      for (const handler of config.escalation.webhookHandlers) {
        try {
          await handler(failureEvent)
        } catch (webhookError) {
          console.error("[ExecutionService] Webhook handler error:", webhookError)
        }
      }

      onUpdate(getStatus(), { 
        type: "task_failed", 
        taskId: task.id,
        error: errorMessage,
      })
      emitLog("error", `Failed: ${task.name} - ${errorMessage} (after ${currentEscalations} escalations)`)
    }
  }

  /**
   * Execute a task with an escalated (more powerful) model
   */
  const executeEscalatedTask = async (
    task: ExecutionTask,
    escalatedModel: string,
    previousError: string,
    previousOutput: string,
    escalationLevel: number
  ): Promise<void> => {
    const startTime = Date.now()
    
    try {
      // Update status to running
      taskStates.set(task.id, { status: "running", progress: 0 })
      emitLog("info", `🔄 Escalation attempt ${escalationLevel}: ${task.name} with ${escalatedModel}`)

      // Create a new session for escalated task
      const sessionResult = await client!.session.create({
        body: {
          title: `Escalated: ${task.name.substring(0, 40)} (L${escalationLevel})`
        }
      })

      if (!sessionResult.data?.id) {
        throw new Error("Failed to create escalation session")
      }

      const sessionId = sessionResult.data.id
      
      // Update progress
      taskStates.set(task.id, { status: "running", progress: 30 })
      onUpdate(getStatus(), null)

      // Get escalated model configuration
      const modelConfig = getModelConfig(escalatedModel)

      // Build escalation prompt with failure context
      const prompt = buildEscalationPrompt(
        task, 
        plan.description, 
        previousOutput, 
        previousError,
        escalationLevel
      )

      // Execute via SDK session.prompt with timeout to prevent hanging
      emitLog("info", `Executing escalation with ${modelConfig.modelID}...`)
      taskStates.set(task.id, { status: "running", progress: 50 })
      onUpdate(getStatus(), null)

      // Wrap prompt call with timeout (5 minute timeout for escalated tasks)
      const ESCALATION_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Escalated task execution timed out after 5 minutes")), ESCALATION_TIMEOUT_MS)
      })

      const response = await Promise.race([
        client!.session.prompt({
          path: { id: sessionId },
          body: {
            model: modelConfig,
            parts: [{ type: "text" as const, text: prompt }]
          }
        }),
        timeoutPromise
      ])

      // Extract output
      const output = extractResponseText(response)
      const duration = Date.now() - startTime
      
      // Estimate tokens and cost
      const estimatedTokens = Math.round((prompt.length + output.length) / 4)
      const costPerToken = modelConfig.modelID.includes("opus") ? 0.015 / 1000 
        : modelConfig.modelID.includes("gpt-4o") && !modelConfig.modelID.includes("mini") ? 0.01 / 1000
        : 0.003 / 1000
      const estimatedCost = estimatedTokens * costPerToken

      // Update totals
      totalTokensUsed += estimatedTokens
      totalCost += estimatedCost
      totalDuration += duration

      // Update task status
      taskStates.set(task.id, {
        status: "completed",
        progress: 100,
        output: output.substring(0, 2000) + (output.length > 2000 ? "..." : ""),
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
        duration,
      })
      
      // Mark as permanently completed after successful escalation
      completedTasks.add(task.id)
      executingTasks.delete(task.id)
      console.log(`[ExecutionService] Task ${task.id} completed via escalation to ${escalatedModel}`)
      
      // Fire success webhook
      const successEvent: EscalationEvent = {
        type: "escalation_completed",
        taskId: task.id,
        taskName: task.name,
        originalModel: task.model,
        escalatedModel,
        escalationLevel,
        maxEscalations: config.escalation.maxEscalations,
        timestamp: Date.now(),
      }
      
      for (const handler of config.escalation.webhookHandlers) {
        try {
          await handler(successEvent)
        } catch (webhookError) {
          console.error("[ExecutionService] Webhook handler error:", webhookError)
        }
      }

      onUpdate(getStatus(), { 
        type: "task_completed", 
        taskId: task.id,
        output: output.substring(0, 500),
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
      })
      emitLog("success", `✅ Escalation succeeded: ${task.name} with ${escalatedModel} (${Math.round(duration / 1000)}s)`)

    } catch (error: any) {
      console.error(`[ExecutionService] Escalated task ${task.id} failed:`, error)
      
      // Record in history
      const history = taskEscalationHistory.get(task.id) || []
      history.push({ model: escalatedModel, error: error.message, output: "" })
      taskEscalationHistory.set(task.id, history)
      
      // Check if we can escalate further
      const currentEscalations = taskEscalations.get(task.id) || 0
      const canEscalateMore = currentEscalations < config.escalation.maxEscalations
      
      if (canEscalateMore) {
        const nextModel = getEscalationModel(escalatedModel, config.escalation)
        
        if (nextModel && nextModel !== escalatedModel) {
          emitLog("warning", `⬆️ Further escalating ${task.name} from ${escalatedModel} to ${nextModel}`)
          taskEscalations.set(task.id, currentEscalations + 1)
          await executeEscalatedTask(task, nextModel, error.message, previousOutput, currentEscalations + 1)
          return
        }
      }
      
      // No more escalations possible - mark as final failure
      const duration = Date.now() - startTime
      taskStates.set(task.id, {
        status: "failed",
        progress: 0,
        error: `Escalation failed: ${error.message}`,
        duration,
      })
      
      // Fire final failure webhook
      const failureEvent: EscalationEvent = {
        type: "escalation_failed",
        taskId: task.id,
        taskName: task.name,
        originalModel: task.model,
        escalatedModel,
        escalationLevel,
        maxEscalations: config.escalation.maxEscalations,
        error: error.message,
        timestamp: Date.now(),
      }
      
      for (const handler of config.escalation.webhookHandlers) {
        try {
          await handler(failureEvent)
        } catch (webhookError) {
          console.error("[ExecutionService] Webhook handler error:", webhookError)
        }
      }

      onUpdate(getStatus(), { 
        type: "task_failed", 
        taskId: task.id,
        error: error.message,
      })
      emitLog("error", `❌ Escalation failed: ${task.name} - ${error.message} (reached max escalation level)`)
    }
  }

  const execute = async () => {
    try {
      // Initialize SDK client
      client = getClient(config.baseUrl)
      emitLog("info", "Connected to OpenCode SDK")

      // Execute tasks sequentially (can be parallelized if needed)
      for (const task of plan.tasks) {
        if (!running) break

        // Wait if paused
        while (paused) {
          await new Promise(r => setTimeout(r, 100))
          if (!running) break
        }
        
        // Skip already completed or permanently failed tasks
        if (completedTasks.has(task.id)) {
          console.log(`[ExecutionService] Skipping completed task: ${task.id}`)
          continue
        }
        if (failedTasks.has(task.id)) {
          console.log(`[ExecutionService] Skipping permanently failed task: ${task.id}`)
          continue
        }

        await executeTask(task)
      }

      const status = getStatus()
      onUpdate(status, { type: "execution_completed" })
      emitLog("success", `Execution complete: ${status.completedTasks}/${status.totalTasks} tasks succeeded`)

    } catch (error: any) {
      console.error("[ExecutionService] Execution failed:", error)
      emitLog("error", `Execution failed: ${error.message}`)
    }
  }

  // Start execution
  execute()

  // Helper to cancel a specific task
  const cancelTask = (taskId: string) => {
    const controller = activeControllers.get(taskId)
    if (controller) {
      console.log(`[ExecutionService] Cancelling task: ${taskId}`)
      controller.abort()
      activeControllers.delete(taskId)
      activeSessions.delete(taskId)
    }
  }
  
  // Helper to cancel all active tasks
  const cancelAllTasks = () => {
    console.log(`[ExecutionService] Cancelling all ${activeControllers.size} active tasks`)
    for (const [taskId, controller] of activeControllers) {
      controller.abort()
      emitLog("warning", `Cancelled task: ${taskId}`)
    }
    activeControllers.clear()
    activeSessions.clear()
  }

  return {
    pause: () => {
      paused = true
      emitLog("warning", "Execution paused")
    },
    resume: () => {
      paused = false
      emitLog("info", "Execution resumed")
    },
    cancel: () => {
      running = false
      cancelAllTasks() // Abort all active tasks
      emitLog("warning", "Execution cancelled - all active tasks aborted")
    },
    cancelTask, // Expose for individual task cancellation
    isPaused: () => paused,
    getStatus,
  }
}

/**
 * Offline Execution Service - SDK Not Available
 * Provides clear feedback when SDK is not connected
 * This is NOT a mock - it handles the real case of SDK unavailability
 */
export function createOfflineExecutionService(
  plan: ExecutionPlan,
  onUpdate: ExecutionUpdateCallback
) {
  let running = true
  let paused = false
  const taskStates = new Map<string, TaskStatus>()

  // Initialize all tasks as queued
  plan.tasks.forEach(task => {
    taskStates.set(task.id, { status: "queued", progress: 0 })
  })

  const getStatus = (): ExecutionStatus => {
    const completed = [...taskStates.values()].filter(t => t.status === "completed").length
    const failed = [...taskStates.values()].filter(t => t.status === "failed").length
    const runningCount = [...taskStates.values()].filter(t => t.status === "running").length
    const queued = [...taskStates.values()].filter(t => t.status === "queued").length

    return {
      totalTasks: plan.tasks.length,
      completedTasks: completed,
      failedTasks: failed,
      runningTasks: runningCount,
      queuedTasks: queued,
      progressPercentage: Math.round((completed / plan.tasks.length) * 100),
      isComplete: completed + failed === plan.tasks.length,
      tasks: plan.tasks.map(t => ({
        ...t,
        ...taskStates.get(t.id)!
      })),
      totalTokensUsed: 0,
      totalCost: 0,
      totalDuration: 0,
    }
  }

  const executeOffline = async () => {
    onUpdate(getStatus(), { 
      type: "log", 
      logType: "warning", 
      message: "⚠️ OpenCode SDK is not connected. Cannot execute tasks." 
    })
    
    onUpdate(getStatus(), { 
      type: "log", 
      logType: "info", 
      message: "Please ensure the OpenCode server is running at the configured URL." 
    })
    
    onUpdate(getStatus(), { 
      type: "log", 
      logType: "info", 
      message: "Run 'opencode serve' or 'bun dev' in the opencode package to start the server." 
    })

    // Mark all tasks as failed with helpful message
    for (const task of plan.tasks) {
      if (!running) break

      while (paused) {
        await new Promise(r => setTimeout(r, 100))
        if (!running) break
      }

      // Small delay between tasks for UI feedback
      await new Promise(r => setTimeout(r, 500))

      taskStates.set(task.id, {
        status: "failed",
        progress: 0,
        error: "SDK not connected - start the OpenCode server to execute this task",
      })

      onUpdate(getStatus(), {
        type: "task_failed",
        taskId: task.id,
        error: "SDK not connected"
      })
    }

    onUpdate(getStatus(), { type: "execution_completed" })
    onUpdate(getStatus(), { 
      type: "log", 
      logType: "error", 
      message: "Execution failed - SDK connection required. Please start the OpenCode server and try again." 
    })
  }

  // Start offline handling
  executeOffline()

  return {
    pause: () => { 
      paused = true 
      onUpdate(getStatus(), { type: "log", logType: "info", message: "Execution paused" })
    },
    resume: () => { 
      paused = false 
      onUpdate(getStatus(), { type: "log", logType: "info", message: "Execution resumed" })
    },
    cancel: () => { 
      running = false 
      onUpdate(getStatus(), { type: "log", logType: "warning", message: "Execution cancelled" })
    },
    isPaused: () => paused,
    getStatus,
  }
}

// Keep the old name as an alias for backward compatibility
export const createMockExecutionService = createOfflineExecutionService

/**
 * Check if OpenCode SDK is available
 * Uses the /config endpoint which is lightweight and always available
 */
export async function checkSDKConnection(baseUrl?: string): Promise<boolean> {
  try {
    console.log("[SDK] Checking SDK connection...")
    const client = getClient(baseUrl)
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 5000)
    })
    
    // Use config.get() - lightweight endpoint that's always available
    const response = await Promise.race([
      client.config.get(),
      timeoutPromise
    ])
    
    const isConnected = response.data !== undefined
    console.log(`[SDK] Connection check result: ${isConnected ? "CONNECTED" : "NOT CONNECTED"}`)
    return isConnected
  } catch (error: any) {
    console.warn("[SDK] Connection check failed:", error.message || error)
    return false
  }
}

/**
 * Get cached available models or fetch from SDK
 * Throws error if models cannot be fetched - never falls back to hardcoded lists
 */
export async function getAvailableModelsFromSDK(baseUrl?: string): Promise<AvailableModel[]> {
  if (cachedAvailableModels) {
    return cachedAvailableModels
  }
  
  const models = await fetchAvailableModels(baseUrl)
  const availableOnly = models.filter(m => m.available)
  
  if (availableOnly.length === 0) {
    throw new Error("[getAvailableModelsFromSDK] No configured models available. Please configure at least one provider in OpenCode.")
  }
  
  cachedAvailableModels = models
  console.log(`[SDK] Cached ${availableOnly.length} available models:`, availableOnly.map(m => m.id))
  return models
}

/**
 * Clear the model cache (useful when reconnecting)
 */
export function clearModelCache() {
  cachedAvailableModels = null
}

/**
 * Complexity scoring based on task description heuristics
 */
function scoreComplexity(description: string): { complexity: string; estimateMinutes: number } {
  const lowerDesc = description.toLowerCase()
  
  // Complex indicators
  const complexIndicators = [
    "authentication", "security", "encryption", "oauth", "jwt",
    "database", "migration", "schema", "orm", "transaction",
    "real-time", "websocket", "streaming", "cache", "redis",
    "deployment", "ci/cd", "docker", "kubernetes", "infrastructure",
    "payment", "billing", "subscription", "integration", "api",
    "machine learning", "ai", "neural", "algorithm", "optimization"
  ]
  
  // Medium indicators
  const mediumIndicators = [
    "component", "form", "validation", "state", "context",
    "routing", "navigation", "layout", "responsive", "styling",
    "testing", "unit test", "integration test", "e2e",
    "error handling", "logging", "monitoring", "analytics"
  ]
  
  // Simple indicators
  const simpleIndicators = [
    "setup", "config", "initialize", "boilerplate", "scaffold",
    "rename", "refactor", "cleanup", "documentation", "readme",
    "types", "interface", "constant", "utility", "helper"
  ]
  
  let complexScore = 0
  let mediumScore = 0
  let simpleScore = 0
  
  for (const indicator of complexIndicators) {
    if (lowerDesc.includes(indicator)) complexScore++
  }
  for (const indicator of mediumIndicators) {
    if (lowerDesc.includes(indicator)) mediumScore++
  }
  for (const indicator of simpleIndicators) {
    if (lowerDesc.includes(indicator)) simpleScore++
  }
  
  // Determine complexity
  if (complexScore >= 2 || (complexScore >= 1 && lowerDesc.length > 300)) {
    return { complexity: "complex", estimateMinutes: 30 }
  } else if (complexScore >= 1 || mediumScore >= 2) {
    return { complexity: "medium", estimateMinutes: 20 }
  } else if (mediumScore >= 1) {
    return { complexity: "medium", estimateMinutes: 15 }
  } else if (simpleScore >= 1 || lowerDesc.length < 100) {
    return { complexity: "simple", estimateMinutes: 10 }
  }
  
  return { complexity: "medium", estimateMinutes: 15 }
}

/**
 * Track model usage for diversity - rotate through available models
 */
const modelUsageCounter = new Map<string, number>()
let modelAssignmentIndex = 0 // Global index for true round-robin

/**
 * Get the next model in rotation from a list, promoting diversity
 * Uses a simple round-robin approach combined with usage tracking
 */
function getNextModelInRotation(models: AvailableModel[]): AvailableModel {
  if (models.length === 0) throw new Error("No models provided")
  if (models.length === 1) return models[0]!
  
  // Simple round-robin: use global index to rotate through models
  const index = modelAssignmentIndex % models.length
  modelAssignmentIndex++
  
  console.log(`[getNextModelInRotation] Selecting index ${index} from ${models.length} models: ${models.map(m => m.id).join(', ')}`)
  
  return models[index]!
}

/**
 * Get the least-used model from a list, promoting diversity
 * Fallback method using usage counter
 */
function getLeastUsedModel(models: AvailableModel[]): AvailableModel {
  if (models.length === 0) throw new Error("No models provided")
  if (models.length === 1) return models[0]!
  
  // Sort by usage count (ascending), then by name for determinism
  const sorted = [...models].sort((a, b) => {
    const usageA = modelUsageCounter.get(a.id) || 0
    const usageB = modelUsageCounter.get(b.id) || 0
    if (usageA !== usageB) return usageA - usageB
    return a.id.localeCompare(b.id)
  })
  
  return sorted[0]!
}

/**
 * Prefer native provider models over proxied ones
 * E.g., prefer OpenAI's gpt-4o over GitHub Copilot's gpt-4o
 */
function preferNativeProvider(models: AvailableModel[]): AvailableModel[] {
  // Map model IDs to their "native" provider
  const nativeProviders: Record<string, string[]> = {
    "gpt": ["openai"],
    "o1": ["openai"],
    "o3": ["openai"],
    "claude": ["anthropic"],
    "gemini": ["google"],
    "copilot": ["github", "github-copilot"],
    "zen": ["zen", "opencode"],
  }
  
  return models.map(model => {
    // Find native provider for this model type
    for (const [prefix, providers] of Object.entries(nativeProviders)) {
      if (model.id.toLowerCase().startsWith(prefix)) {
        // Check if current provider is native
        if (!providers.includes(model.providerId.toLowerCase())) {
          // Not native - mark with lower priority by returning with modified tier
          // This is a soft preference, not a hard filter
          return { ...model, _isProxy: true }
        }
      }
    }
    return { ...model, _isProxy: false }
  }).sort((a, b) => {
    // Sort non-proxy models first
    const aProxy = (a as any)._isProxy ? 1 : 0
    const bProxy = (b as any)._isProxy ? 1 : 0
    return aProxy - bProxy
  }) as AvailableModel[]
}

/**
 * Assign optimal model based on task complexity and available models
 * Dynamically selects from actually available/configured models
 * Uses rotation to spread load across models for diversity
 * Throws error if no models are available - never falls back to hardcoded lists
 */
function assignOptimalModel(complexity: string, availableModels?: AvailableModel[]): string {
  const models = availableModels || cachedAvailableModels || []
  const available = models.filter(m => m.available)
  
  // Debug logging
  console.log(`[assignOptimalModel] Complexity: ${complexity}, Available models: ${available.length}`)
  
  // If no available models, throw error - don't use hardcoded fallbacks
  if (available.length === 0) {
    throw new Error(
      "[assignOptimalModel] No models available. " +
      "Please connect to OpenCode SDK and ensure at least one provider is configured. " +
      "Run fetchAvailableModels() first to populate the model cache."
    )
  }
  
  // DON'T filter by native provider - just use all available models for diversity
  // The preferNativeProvider was causing us to filter down to only 1-2 models
  
  // Find models by tier from ALL available (not filtered)
  const premiumModels = available.filter(m => m.tier === "premium")
  const standardModels = available.filter(m => m.tier === "standard")
  const fastModels = available.filter(m => m.tier === "fast")
  
  console.log(`[assignOptimalModel] Available: ${available.length} total`)
  console.log(`[assignOptimalModel] By tier - Premium: ${premiumModels.length}, Standard: ${standardModels.length}, Fast: ${fastModels.length}`)
  console.log(`[assignOptimalModel] All models:`, available.map(m => `${m.id} (${m.providerId})`).join(', '))
  
  let selectedModel: AvailableModel
  
  // Use round-robin rotation to spread across models
  switch (complexity) {
    case "complex":
      // For complex tasks: prefer premium, then standard
      if (premiumModels.length > 0) selectedModel = getNextModelInRotation(premiumModels)
      else if (standardModels.length > 0) selectedModel = getNextModelInRotation(standardModels)
      else if (fastModels.length > 0) selectedModel = getNextModelInRotation(fastModels)
      else selectedModel = getNextModelInRotation(available)
      break
    case "medium":
      // For medium tasks: prefer standard, then fast
      if (standardModels.length > 0) selectedModel = getNextModelInRotation(standardModels)
      else if (fastModels.length > 0) selectedModel = getNextModelInRotation(fastModels)
      else if (premiumModels.length > 0) selectedModel = getNextModelInRotation(premiumModels)
      else selectedModel = getNextModelInRotation(available)
      break
    case "simple":
      // For simple tasks: prefer fast (cost-efficient)
      if (fastModels.length > 0) selectedModel = getNextModelInRotation(fastModels)
      else if (standardModels.length > 0) selectedModel = getNextModelInRotation(standardModels)
      else if (premiumModels.length > 0) selectedModel = getNextModelInRotation(premiumModels)
      else selectedModel = getNextModelInRotation(available)
      break
    default:
      // Default: rotate through all available
      selectedModel = getNextModelInRotation(available)
  }
  
  // Validate selected model is a known valid model
  if (!isValidModel(selectedModel.id)) {
    console.error(`[assignOptimalModel] Selected invalid model: ${selectedModel.id}, finding alternative`)
    // Find first valid model with rotation
    const validModels = available.filter(m => isValidModel(m.id))
    if (validModels.length > 0) {
      selectedModel = getNextModelInRotation(validModels)
    }
  }
  
  // Increment usage counter for tracking
  modelUsageCounter.set(selectedModel.id, (modelUsageCounter.get(selectedModel.id) || 0) + 1)
  
  console.log(`[assignOptimalModel] ✓ Selected: ${selectedModel.id} (provider: ${selectedModel.providerId}) for complexity: ${complexity}`)
  
  return selectedModel.id
}

/**
 * Parse AI-generated plan from text response
 */
function parsePlanFromResponse(response: string, projectIdea: string): ExecutionPlan {
  const lines = response.split("\n")
  const tasks: ExecutionTask[] = []
  const phases: ExecutionPlan["phases"] = []
  
  let currentPhase: { id: string; name: string; tasks: ExecutionTask[] } | null = null
  let taskCounter = 0
  let phaseCounter = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect phase headers (## Phase: or ### Phase: or **Phase:)
    const phaseMatch = trimmed.match(/^(?:#{1,3}\s*)?(?:\*\*)?Phase\s*\d*:?\s*(.+?)(?:\*\*)?$/i)
    if (phaseMatch && phaseMatch[1]) {
      if (currentPhase && currentPhase.tasks.length > 0) {
        phases.push(currentPhase)
      }
      phaseCounter++
      currentPhase = {
        id: `phase-${phaseCounter}`,
        name: phaseMatch[1].replace(/\*\*/g, "").trim(),
        tasks: []
      }
      continue
    }
    
    // Detect task entries (- Task: or * Task: or numbered list)
    const taskMatch = trimmed.match(/^(?:[-*]|\d+\.)\s*(?:\*\*)?(.+?)(?:\*\*)?:\s*(.+)$/i)
    if (taskMatch && taskMatch[1] && taskMatch[2]) {
      taskCounter++
      const taskName = taskMatch[1].replace(/\*\*/g, "").trim()
      const taskDescription = taskMatch[2].trim()
      
      const { complexity, estimateMinutes } = scoreComplexity(taskDescription)
      const model = assignOptimalModel(complexity)
      
      const task: ExecutionTask = {
        id: `task-${taskCounter}`,
        name: taskName,
        description: taskDescription,
        model,
        complexity,
        estimateMinutes
      }
      
      tasks.push(task)
      if (currentPhase) {
        currentPhase.tasks.push(task)
      }
      continue
    }
    
    // Detect simple task entries (just a bullet point with description)
    const simpleTaskMatch = trimmed.match(/^(?:[-*]|\d+\.)\s*(?:\*\*)?(.{10,})(?:\*\*)?$/)
    if (simpleTaskMatch && simpleTaskMatch[1] && !trimmed.toLowerCase().includes("phase")) {
      taskCounter++
      const taskDescription = simpleTaskMatch[1].replace(/\*\*/g, "").trim()
      
      // Generate a task name from the first few words
      const words = taskDescription.split(/\s+/).slice(0, 4)
      const taskName = words.join(" ") + (words.length < taskDescription.split(/\s+/).length ? "..." : "")
      
      const { complexity, estimateMinutes } = scoreComplexity(taskDescription)
      const model = assignOptimalModel(complexity)
      
      const task: ExecutionTask = {
        id: `task-${taskCounter}`,
        name: taskName,
        description: taskDescription,
        model,
        complexity,
        estimateMinutes
      }
      
      tasks.push(task)
      if (currentPhase) {
        currentPhase.tasks.push(task)
      }
    }
  }
  
  // Push last phase
  if (currentPhase && currentPhase.tasks.length > 0) {
    phases.push(currentPhase)
  }
  
  // If no phases were detected, create default phases
  if (phases.length === 0 && tasks.length > 0) {
    const tasksPerPhase = Math.ceil(tasks.length / 3)
    const phaseNames: string[] = ["Foundation", "Core Implementation", "Polish & Testing"]
    
    for (let i = 0; i < 3 && i * tasksPerPhase < tasks.length; i++) {
      phases.push({
        id: `phase-${i + 1}`,
        name: phaseNames[i] ?? `Phase ${i + 1}`,
        tasks: tasks.slice(i * tasksPerPhase, (i + 1) * tasksPerPhase)
      })
    }
  }
  
  // Calculate totals
  const totalEstimateMinutes = tasks.reduce((sum, t) => sum + t.estimateMinutes, 0)
  const estimatedCost = tasks.reduce((sum, t) => {
    const costPerMinute = t.model.includes("opus") ? 0.02 
      : t.model.includes("sonnet") ? 0.01 
      : 0.005
    return sum + (t.estimateMinutes * costPerMinute)
  }, 0)
  
  // Generate project name from idea
  const words = projectIdea.split(/\s+/).slice(0, 4)
  const projectName = words.join(" ") + " Project"
  
  return {
    projectName,
    description: projectIdea,
    tasks,
    phases,
    totalEstimateMinutes,
    estimatedCost
  }
}

/**
 * Analyze project idea and generate execution plan using OpenCode SDK
 * This is the real implementation that calls the AI to generate a plan
 */
export async function analyzeAndPlanWithSDK(
  projectIdea: string,
  baseUrl?: string
): Promise<ExecutionPlan> {
  const client = getClient(baseUrl)
  
  // Create a planning session
  const sessionResult = await client.session.create({
    body: {
      title: `Planning: ${projectIdea.substring(0, 50)}`
    }
  })
  
  if (!sessionResult.data?.id) {
    throw new Error("Failed to create planning session")
  }
  
  const sessionId = sessionResult.data.id
  
  // Generate the planning prompt
  const planningPrompt = `You are an expert software architect and project planner. Analyze the following project idea and create a detailed execution plan.

## Project Idea:
${projectIdea}

## Your Task:
Create a comprehensive execution plan that breaks down this project into manageable tasks organized in phases.

## Output Format:
Provide the plan in the following format:

### Phase 1: Foundation
- **Task Name 1**: Description of what this task accomplishes
- **Task Name 2**: Description of what this task accomplishes

### Phase 2: Core Implementation
- **Task Name 3**: Description of what this task accomplishes
- **Task Name 4**: Description of what this task accomplishes

### Phase 3: Integration & Testing
- **Task Name 5**: Description of what this task accomplishes
- **Task Name 6**: Description of what this task accomplishes

### Phase 4: Polish & Deployment
- **Task Name 7**: Description of what this task accomplishes

## Guidelines:
1. Create 3-5 phases depending on project complexity
2. Each phase should have 2-5 focused tasks
3. Tasks should be atomic and achievable by an AI agent in one session
4. Order tasks logically - dependencies should come before dependent tasks
5. Task names should be concise but descriptive
6. Task descriptions should clearly explain the expected outcome
7. Consider: setup, core features, data handling, error handling, testing, documentation

Generate a realistic and actionable plan that an AI coding assistant can execute.`

  // Fetch available models from SDK before model selection
  await fetchAvailableModels();
  // Use the best available standard-tier model for plan generation
  const modelConfig = await getBestAvailableModelConfig("standard")
  
  // Call the SDK to generate the plan
  console.log("[analyzeAndPlanWithSDK] Using model config:", modelConfig)
  const response = await client.session.prompt({
    path: { id: sessionId },
    body: {
      model: modelConfig,
      parts: [{ type: "text" as const, text: planningPrompt }]
    }
  })
  
  console.log("[analyzeAndPlanWithSDK] Raw response:", JSON.stringify(response, null, 2))
  const responseText = extractResponseText(response)
  console.log("[analyzeAndPlanWithSDK] Extracted text length:", responseText?.length, "content preview:", responseText?.slice(0, 200))
  
  if (!responseText || responseText.length < 100) {
    console.error("[analyzeAndPlanWithSDK] Insufficient response. Full response:", response)
    throw new Error("AI returned an insufficient plan response")
  }
  
  // Parse the response into a structured plan
  const plan = parsePlanFromResponse(responseText, projectIdea)
  
  // Validate the plan has enough content
  if (plan.tasks.length < 2) {
    throw new Error("AI generated insufficient tasks. Please try a more detailed project description.")
  }
  
  return plan
}

/**
 * Generate a fallback plan when SDK is not available
 * This creates a reasonable plan structure based on heuristics
 * Uses dynamic model selection from cached available models
 */
export function generateFallbackPlan(projectIdea: string, availableModels?: AvailableModel[]): ExecutionPlan {
  const words = projectIdea.toLowerCase().split(/\s+/)
  const projectName = projectIdea.split(/\s+/).slice(0, 4).join(" ") + " Project"
  
  // Use passed models or cached models
  const models = availableModels || cachedAvailableModels || undefined
  
  // Helper to create a task with dynamic model assignment
  const createTask = (
    id: number,
    name: string, 
    description: string, 
    complexity: "simple" | "medium" | "complex",
    estimateMinutes: number
  ): ExecutionTask => ({
    id: `task-${id}`,
    name,
    description,
    model: assignOptimalModel(complexity, models),
    complexity,
    estimateMinutes
  })
  
  // Detect project type from keywords
  const isWeb = words.some(w => ["web", "website", "app", "application", "frontend", "react", "vue", "angular"].includes(w))
  const isApi = words.some(w => ["api", "backend", "server", "rest", "graphql", "endpoint"].includes(w))
  const isData = words.some(w => ["data", "database", "analytics", "dashboard", "visualization"].includes(w))
  const isMobile = words.some(w => ["mobile", "ios", "android", "react-native", "flutter"].includes(w))
  const isCli = words.some(w => ["cli", "command", "terminal", "tool", "script", "automation"].includes(w))
  
  const tasks: ExecutionTask[] = []
  const phases: ExecutionPlan["phases"] = []
  let taskId = 0
  
  // Phase 1: Foundation
  const foundationTasks: ExecutionTask[] = [
    createTask(++taskId, "Project Setup", 
      `Initialize project structure with appropriate build tools, dependencies, and configuration for: ${projectIdea}`,
      "simple", 10),
    createTask(++taskId, "Core Architecture",
      `Design and implement the core architecture patterns, folder structure, and foundational types/interfaces for the project`,
      "medium", 20)
  ]
  
  phases.push({ id: "phase-1", name: "Foundation", tasks: foundationTasks })
  tasks.push(...foundationTasks)
  
  // Phase 2: Core Features (contextual)
  const coreTasks: ExecutionTask[] = []
  
  if (isWeb || isMobile) {
    coreTasks.push(createTask(++taskId, "UI Components",
      "Build reusable UI components with proper styling, accessibility, and responsive design",
      "medium", 25))
    coreTasks.push(createTask(++taskId, "State Management",
      "Implement state management solution with actions, reducers, and side effect handling",
      "medium", 20))
  }
  
  if (isApi) {
    coreTasks.push(createTask(++taskId, "API Endpoints",
      "Create RESTful API endpoints with proper routing, validation, and error handling",
      "medium", 25))
    coreTasks.push(createTask(++taskId, "Authentication",
      "Implement secure authentication system with JWT, session management, and authorization",
      "complex", 30))
  }
  
  if (isData) {
    coreTasks.push(createTask(++taskId, "Data Models",
      "Define database schema, models, and data access layer with proper relationships",
      "medium", 20))
    coreTasks.push(createTask(++taskId, "Data Processing",
      "Implement data processing pipelines, transformations, and aggregations",
      "complex", 30))
  }
  
  if (isCli) {
    coreTasks.push(createTask(++taskId, "CLI Interface",
      "Build command-line interface with argument parsing, help text, and subcommands",
      "medium", 20))
    coreTasks.push(createTask(++taskId, "Core Logic",
      "Implement the main business logic and core functionality of the tool",
      "complex", 30))
  }
  
  // Default core tasks if no specific type detected
  if (coreTasks.length === 0) {
    coreTasks.push(createTask(++taskId, "Main Feature Implementation",
      `Implement the primary functionality described in: ${projectIdea}`,
      "complex", 30))
    coreTasks.push(createTask(++taskId, "Data Layer",
      "Set up data models, storage, and data access patterns",
      "medium", 20))
  }
  
  phases.push({ id: "phase-2", name: "Core Features", tasks: coreTasks })
  tasks.push(...coreTasks)
  
  // Phase 3: Polish & Testing
  const polishTasks: ExecutionTask[] = [
    createTask(++taskId, "Error Handling",
      "Add comprehensive error handling, input validation, and user-friendly error messages",
      "simple", 15),
    createTask(++taskId, "Testing Suite",
      "Write unit tests and integration tests for critical functionality",
      "medium", 25),
    createTask(++taskId, "Documentation",
      "Create README, API documentation, and inline code documentation",
      "simple", 10)
  ]
  
  phases.push({ id: "phase-3", name: "Polish & Testing", tasks: polishTasks })
  tasks.push(...polishTasks)
  
  // Calculate totals
  const totalEstimateMinutes = tasks.reduce((sum, t) => sum + t.estimateMinutes, 0)
  const estimatedCost = tasks.reduce((sum, t) => {
    const costPerMinute = t.model.includes("opus") ? 0.02 
      : t.model.includes("sonnet") ? 0.01 
      : 0.005
    return sum + (t.estimateMinutes * costPerMinute)
  }, 0)
  
  return {
    projectName,
    description: projectIdea,
    tasks,
    phases,
    totalEstimateMinutes,
    estimatedCost
  }
}
