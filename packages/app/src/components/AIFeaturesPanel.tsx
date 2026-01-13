import { createSignal, For, Show, createMemo } from "solid-js"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Switch } from "./ui/switch"
import { Slider } from "./ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import {
  Settings,
  Brain,
  Zap,
  Shield,
  Database,
  Globe,
  Cpu,
  MemoryStick,
  Network,
  Lock,
  Eye,
  Save,
  RotateCcw,
  Play,
  Pause,
  RefreshCw,
} from "lucide-solid"

interface AIConfig {
  id: string
  name: string
  provider: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  topK: number
  frequencyPenalty: number
  presencePenalty: number
  systemPrompt: string
  enabled: boolean
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  costLimit: {
    maxCostPerDay: number
    currentCost: number
  }
  capabilities: {
    textGeneration: boolean
    codeGeneration: boolean
    analysis: boolean
    translation: boolean
    summarization: boolean
  }
  safety: {
    contentFilter: boolean
    personalDataProtection: boolean
    auditLogging: boolean
  }
}

interface AISession {
  id: string
  configId: string
  startTime: Date
  endTime?: Date
  tokensUsed: number
  cost: number
  requests: number
  status: "active" | "completed" | "failed" | "paused"
  performance: {
    averageLatency: number
    successRate: number
    errorRate: number
  }
}

export default function AIFeaturesPanel() {
  const [configs, setConfigs] = createSignal<AIConfig[]>([
    {
      id: "1",
      name: "Primary Assistant",
      provider: "OpenAI",
      model: "gpt-4-turbo",
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      systemPrompt: "You are a helpful AI assistant specializing in software development and code analysis.",
      enabled: true,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 90000,
      },
      costLimit: {
        maxCostPerDay: 50,
        currentCost: 12.45,
      },
      capabilities: {
        textGeneration: true,
        codeGeneration: true,
        analysis: true,
        translation: false,
        summarization: true,
      },
      safety: {
        contentFilter: true,
        personalDataProtection: true,
        auditLogging: true,
      },
    },
    {
      id: "2",
      name: "Code Specialist",
      provider: "Anthropic",
      model: "claude-3-sonnet",
      maxTokens: 8192,
      temperature: 0.3,
      topP: 0.8,
      topK: 30,
      frequencyPenalty: 0.2,
      presencePenalty: 0.0,
      systemPrompt: "You are an expert software engineer focused on code quality, optimization, and best practices.",
      enabled: true,
      rateLimit: {
        requestsPerMinute: 30,
        tokensPerMinute: 100000,
      },
      costLimit: {
        maxCostPerDay: 25,
        currentCost: 8.3,
      },
      capabilities: {
        textGeneration: true,
        codeGeneration: true,
        analysis: true,
        translation: false,
        summarization: false,
      },
      safety: {
        contentFilter: true,
        personalDataProtection: true,
        auditLogging: true,
      },
    },
  ])

  const [sessions, setSessions] = createSignal<AISession[]>([
    {
      id: "1",
      configId: "1",
      startTime: new Date(Date.now() - 3600000),
      tokensUsed: 1250,
      cost: 0.045,
      requests: 12,
      status: "active",
      performance: {
        averageLatency: 1200,
        successRate: 95.5,
        errorRate: 4.5,
      },
    },
  ])

  const [activeConfig, setActiveConfig] = createSignal<string>("1")
  const [isMonitoring, setIsMonitoring] = createSignal(true)

  const currentConfig = () => configs().find((c) => c.id === activeConfig())

  const activeSessions = () => sessions().filter((s) => s.status === "active")

  const dailyStats = createMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return sessions()
      .filter((session) => session.startTime >= today)
      .reduce(
        (stats, session) => ({
          totalCost: stats.totalCost + session.cost,
          totalTokens: stats.totalTokens + session.tokensUsed,
          totalRequests: stats.totalRequests + session.requests,
          averageLatency: (stats.averageLatency + session.performance.averageLatency) / 2,
        }),
        {
          totalCost: 0,
          totalTokens: 0,
          totalRequests: 0,
          averageLatency: 0,
        },
      )
  })

  const updateConfig = (configId: string, updates: Partial<AIConfig>) => {
    setConfigs((prev) => prev.map((config) => (config.id === configId ? { ...config, ...updates } : config)))
  }

  const toggleConfig = (configId: string) => {
    setConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, enabled: !config.enabled } : config)),
    )
  }

  const createNewConfig = () => {
    const newConfig: AIConfig = {
      id: Date.now().toString(),
      name: `AI Configuration ${configs().length + 1}`,
      provider: "OpenAI",
      model: "gpt-3.5-turbo",
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemPrompt: "You are a helpful AI assistant.",
      enabled: false,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 90000,
      },
      costLimit: {
        maxCostPerDay: 10,
        currentCost: 0,
      },
      capabilities: {
        textGeneration: true,
        codeGeneration: false,
        analysis: false,
        translation: false,
        summarization: true,
      },
      safety: {
        contentFilter: true,
        personalDataProtection: true,
        auditLogging: true,
      },
    }

    setConfigs((prev) => [...prev, newConfig])
    setActiveConfig(newConfig.id)
  }

  const testConfig = async (configId: string) => {
    // Simulate API test
    const testSession: AISession = {
      id: Date.now().toString(),
      configId,
      startTime: new Date(),
      endTime: new Date(),
      tokensUsed: 25,
      cost: 0.0005,
      requests: 1,
      status: "completed",
      performance: {
        averageLatency: 850,
        successRate: 100,
        errorRate: 0,
      },
    }

    setSessions((prev) => [...prev, testSession])
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "OpenAI":
        return "🤖"
      case "Anthropic":
        return "🧠"
      case "Google":
        return "🔍"
      case "Azure":
        return "☁️"
      default:
        return "⚡"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100"
      case "completed":
        return "text-blue-600 bg-blue-100"
      case "failed":
        return "text-red-600 bg-red-100"
      case "paused":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div class="flex h-full bg-background">
      {/* Sidebar */}
      <div class="w-80 border-r border-border bg-muted/30 p-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Cpu class="size-5" />
            AI Configurations
          </h2>
          <Button size="sm" onClick={createNewConfig}>
            <Plus class="size-4" />
          </Button>
        </div>

        <div class="space-y-2">
          <For each={configs()}>
            {(config) => (
              <div
                class={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeConfig() === config.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted"
                }`}
                onClick={() => setActiveConfig(config.id)}
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{getProviderIcon(config.provider)}</span>
                      <h3 class="font-medium text-sm">{config.name}</h3>
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                      {config.provider} • {config.model}
                    </p>
                  </div>
                  <div class={`w-2 h-2 rounded-full ${config.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                </div>
                <div class="flex items-center justify-between mt-2">
                  <Badge variant={config.enabled ? "default" : "secondary"} class="text-xs">
                    {config.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Switch checked={config.enabled} onChange={() => toggleConfig(config.id)} size="sm" />
                </div>
              </div>
            )}
          </For>
        </div>

        <div class="mt-6 p-3 bg-card rounded-lg border">
          <h3 class="font-medium text-sm mb-2 flex items-center gap-2">
            <Activity class="size-4" />
            Daily Statistics
          </h3>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Cost:</span>
              <span>${dailyStats().totalCost.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Tokens:</span>
              <span>{dailyStats().totalTokens.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Requests:</span>
              <span>{dailyStats().totalRequests}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Avg Latency:</span>
              <span>{dailyStats().averageLatency.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="flex-1 flex flex-col">
        <div class="border-b border-border bg-card p-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">{currentConfig()?.name}</h1>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => testConfig(activeConfig())}>
                <Play class="size-4 mr-2" />
                Test
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsMonitoring(!isMonitoring())}>
                {isMonitoring() ? <Pause class="size-4" /> : <Eye class="size-4" />}
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea class="flex-1">
          <div class="p-6">
            <Tabs defaultValue="settings" class="w-full">
              <TabsList class="grid w-full grid-cols-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                <TabsTrigger value="safety">Safety</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" class="space-y-6">
                <Card class="p-6">
                  <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings class="size-5" />
                    Basic Configuration
                  </h3>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm font-medium">Name</label>
                      <Input
                        value={currentConfig()?.name || ""}
                        onInput={(e) => updateConfig(activeConfig(), { name: e.currentTarget.value })}
                      />
                    </div>

                    <div>
                      <label class="text-sm font-medium">Provider</label>
                      <Select
                        value={currentConfig()?.provider || ""}
                        onChange={(value) => updateConfig(activeConfig(), { provider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OpenAI">OpenAI</SelectItem>
                          <SelectItem value="Anthropic">Anthropic</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Azure">Azure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label class="text-sm font-medium">Model</label>
                      <Input
                        value={currentConfig()?.model || ""}
                        onInput={(e) => updateConfig(activeConfig(), { model: e.currentTarget.value })}
                      />
                    </div>

                    <div>
                      <label class="text-sm font-medium">Max Tokens</label>
                      <Input
                        type="number"
                        value={currentConfig()?.maxTokens || 0}
                        onInput={(e) => updateConfig(activeConfig(), { maxTokens: parseInt(e.currentTarget.value) })}
                      />
                    </div>
                  </div>

                  <div class="mt-6">
                    <label class="text-sm font-medium">System Prompt</label>
                    <Textarea
                      value={currentConfig()?.systemPrompt || ""}
                      onInput={(e) => updateConfig(activeConfig(), { systemPrompt: e.currentTarget.value })}
                      class="mt-1"
                      rows={3}
                    />
                  </div>

                  <div class="mt-6 space-y-4">
                    <div>
                      <label class="text-sm font-medium">Temperature: {currentConfig()?.temperature}</label>
                      <Slider
                        value={[currentConfig()?.temperature || 0]}
                        onChange={(value) => updateConfig(activeConfig(), { temperature: value[0] })}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div>
                      <label class="text-sm font-medium">Top P: {currentConfig()?.topP}</label>
                      <Slider
                        value={[currentConfig()?.topP || 0]}
                        onChange={(value) => updateConfig(activeConfig(), { topP: value[0] })}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>

                    <div>
                      <label class="text-sm font-medium">Top K: {currentConfig()?.topK}</label>
                      <Slider
                        value={[currentConfig()?.topK || 0]}
                        onChange={(value) => updateConfig(activeConfig(), { topK: value[0] })}
                        min={1}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="performance" class="space-y-6">
                <Card class="p-6">
                  <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap class="size-5" />
                    Performance Settings
                  </h3>

                  <div class="grid grid-cols-2 gap-6">
                    <div>
                      <h4 class="font-medium mb-3">Rate Limits</h4>
                      <div class="space-y-3">
                        <div>
                          <label class="text-sm font-medium">Requests per Minute</label>
                          <Input
                            type="number"
                            value={currentConfig()?.rateLimit.requestsPerMinute || 0}
                            onInput={(e) =>
                              updateConfig(activeConfig(), {
                                rateLimit: {
                                  ...currentConfig()!.rateLimit,
                                  requestsPerMinute: parseInt(e.currentTarget.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label class="text-sm font-medium">Tokens per Minute</label>
                          <Input
                            type="number"
                            value={currentConfig()?.rateLimit.tokensPerMinute || 0}
                            onInput={(e) =>
                              updateConfig(activeConfig(), {
                                rateLimit: {
                                  ...currentConfig()!.rateLimit,
                                  tokensPerMinute: parseInt(e.currentTarget.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 class="font-medium mb-3">Cost Limits</h4>
                      <div class="space-y-3">
                        <div>
                          <label class="text-sm font-medium">Max Cost per Day ($)</label>
                          <Input
                            type="number"
                            value={currentConfig()?.costLimit.maxCostPerDay || 0}
                            onInput={(e) =>
                              updateConfig(activeConfig(), {
                                costLimit: {
                                  ...currentConfig()!.costLimit,
                                  maxCostPerDay: parseFloat(e.currentTarget.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label class="text-sm font-medium">Current Cost ($)</label>
                          <Input
                            type="number"
                            value={currentConfig()?.costLimit.currentCost || 0}
                            readonly
                            class="bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6">
                    <h4 class="font-medium mb-3">Active Sessions</h4>
                    <div class="space-y-2">
                      <For each={activeSessions()}>
                        {(session) => (
                          <div class="p-3 bg-muted rounded-lg">
                            <div class="flex items-center justify-between">
                              <div>
                                <span class="text-sm font-medium">Session {session.id.slice(-6)}</span>
                                <span class="text-xs text-muted-foreground ml-2">
                                  Started {session.startTime.toLocaleTimeString()}
                                </span>
                              </div>
                              <Badge class={getStatusColor(session.status)}>{session.status}</Badge>
                            </div>
                            <div class="grid grid-cols-3 gap-2 mt-2 text-xs">
                              <div>
                                <span class="text-muted-foreground">Tokens:</span> {session.tokensUsed}
                              </div>
                              <div>
                                <span class="text-muted-foreground">Cost:</span> ${session.cost.toFixed(3)}
                              </div>
                              <div>
                                <span class="text-muted-foreground">Latency:</span> {session.performance.averageLatency}
                                ms
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="capabilities" class="space-y-6">
                <Card class="p-6">
                  <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain class="size-5" />
                    AI Capabilities
                  </h3>

                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Text Generation</h4>
                        <p class="text-sm text-muted-foreground">Generate human-like text responses</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.capabilities.textGeneration || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            capabilities: {
                              ...currentConfig()!.capabilities,
                              textGeneration: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Code Generation</h4>
                        <p class="text-sm text-muted-foreground">Write and analyze code snippets</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.capabilities.codeGeneration || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            capabilities: {
                              ...currentConfig()!.capabilities,
                              codeGeneration: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Analysis</h4>
                        <p class="text-sm text-muted-foreground">Analyze data and provide insights</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.capabilities.analysis || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            capabilities: {
                              ...currentConfig()!.capabilities,
                              analysis: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Translation</h4>
                        <p class="text-sm text-muted-foreground">Translate between languages</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.capabilities.translation || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            capabilities: {
                              ...currentConfig()!.capabilities,
                              translation: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Summarization</h4>
                        <p class="text-sm text-muted-foreground">Summarize long content</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.capabilities.summarization || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            capabilities: {
                              ...currentConfig()!.capabilities,
                              summarization: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="safety" class="space-y-6">
                <Card class="p-6">
                  <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield class="size-5" />
                    Safety & Privacy
                  </h3>

                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Content Filter</h4>
                        <p class="text-sm text-muted-foreground">Filter inappropriate or harmful content</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.safety.contentFilter || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            safety: {
                              ...currentConfig()!.safety,
                              contentFilter: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Personal Data Protection</h4>
                        <p class="text-sm text-muted-foreground">Protect sensitive personal information</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.safety.personalDataProtection || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            safety: {
                              ...currentConfig()!.safety,
                              personalDataProtection: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">Audit Logging</h4>
                        <p class="text-sm text-muted-foreground">Log all AI interactions for audit purposes</p>
                      </div>
                      <Switch
                        checked={currentConfig()?.safety.auditLogging || false}
                        onChange={(checked) =>
                          updateConfig(activeConfig(), {
                            safety: {
                              ...currentConfig()!.safety,
                              auditLogging: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 class="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <Lock class="size-4" />
                      Security Notice
                    </h4>
                    <p class="text-sm text-yellow-700">
                      Ensure your API keys are stored securely and never exposed in client-side code. Consider using
                      environment variables or a secure key management service.
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
