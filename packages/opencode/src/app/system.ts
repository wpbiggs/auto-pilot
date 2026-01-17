import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"

export namespace SystemData {
  export const ChangelogType = z.enum(["feature", "fix", "update"])
  export const NotificationType = z.enum(["update", "alert", "info"])

  export const Changelog = z
    .object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      type: ChangelogType,
      createdAt: z.number(),
    })
    .meta({ ref: "SystemChangelog" })

  export type Changelog = z.infer<typeof Changelog>

  export const Notification = z
    .object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      type: NotificationType,
      read: z.boolean(),
      createdAt: z.number(),
    })
    .meta({ ref: "SystemNotification" })

  export type Notification = z.infer<typeof Notification>

  export const Settings = z
    .object({
      agents: z.object({
        autoSelect: z.boolean(),
        defaultAgent: z.string(),
        analyzeAgent: z.string(),
      }),
      models: z.object({
        defaultModel: z.string(),
        analyzeModel: z.string(),
        selectableProviders: z.array(z.string()),
      }),
      notifications: z.object({
        updates: z.boolean(),
        errors: z.boolean(),
      }),
      security: z.object({
        share: z.boolean(),
      }),
      auth: z.object({
        requireApproval: z.boolean(),
      }),
    })
    .meta({ ref: "SystemSettings" })

  export type Settings = z.infer<typeof Settings>

  export const SettingsInput = Settings.partial()

  export const RateLimit = z
    .object({
      limit: z.number(),
      used: z.number(),
      resetAt: z.number(),
    })
    .meta({ ref: "SystemRateLimit" })

  export type RateLimit = z.infer<typeof RateLimit>

  export const LimitInput = RateLimit.partial()

  const changelogKey = (projectID: string) => ["app", "system", "changelog", projectID]
  const noticeKey = (projectID: string) => ["app", "system", "notification", projectID]
  const settingsKey = (projectID: string) => ["app", "system", "settings", projectID]
  const limitKey = (projectID: string) => ["app", "system", "limit", projectID]

  const defaults = (): Settings => ({
    agents: {
      autoSelect: true,
      defaultAgent: "build",
      analyzeAgent: "big-pickle",
    },
    models: {
      defaultModel: "openai:gpt-5-codex",
      analyzeModel: "openai:big-pickle",
      selectableProviders: ["openai", "github-copilot"],
    },
    notifications: {
      updates: true,
      errors: true,
    },
    security: {
      share: true,
    },
    auth: {
      requireApproval: false,
    },
  })

  const defaultLimit = (): RateLimit => ({
    limit: 10000,
    used: 0,
    resetAt: Date.now() + 1000 * 60 * 60 * 24,
  })

  const mergeSettings = (base: Settings, input?: Partial<Settings>): Settings => {
    if (!input) return base
    return {
      agents: {
        ...base.agents,
        ...input.agents,
      },
      models: {
        ...base.models,
        ...input.models,
      },
      notifications: {
        ...base.notifications,
        ...input.notifications,
      },
      security: {
        ...base.security,
        ...input.security,
      },
      auth: {
        ...base.auth,
        ...input.auth,
      },
    }
  }

  export async function listChangelog(projectID: string) {
    return Storage.read<Changelog[]>(changelogKey(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function addChangelog(
    projectID: string,
    input: { title: string; body: string; type: z.infer<typeof ChangelogType> },
  ) {
    const items = await listChangelog(projectID)
    const entry: Changelog = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      type: input.type,
      createdAt: Date.now(),
    }
    const next = [entry, ...items]
    await Storage.write(changelogKey(projectID), next)
    return entry
  }

  export async function removeChangelog(projectID: string, entryID: string) {
    const items = await listChangelog(projectID)
    const next = items.filter((item) => item.id !== entryID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "Changelog not found" })
    await Storage.write(changelogKey(projectID), next)
    return true
  }

  export async function listNotifications(projectID: string) {
    return Storage.read<Notification[]>(noticeKey(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function addNotification(
    projectID: string,
    input: { title: string; body: string; type: z.infer<typeof NotificationType> },
  ) {
    const items = await listNotifications(projectID)
    const entry: Notification = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      type: input.type,
      read: false,
      createdAt: Date.now(),
    }
    const next = [entry, ...items]
    await Storage.write(noticeKey(projectID), next)
    return entry
  }

  export async function dismissNotification(projectID: string, noteID: string) {
    const items = await listNotifications(projectID)
    const next = items.map((item) => (item.id === noteID ? { ...item, read: true } : item))
    const updated = next.find((item) => item.id === noteID)
    if (!updated) throw new Storage.NotFoundError({ message: "Notification not found" })
    await Storage.write(noticeKey(projectID), next)
    return updated
  }

  export async function getSettings(projectID: string) {
    const base = defaults()
    return Storage.read<Settings>(settingsKey(projectID))
      .then((value) => (value ? mergeSettings(base, value) : base))
      .catch(() => base)
  }

  export async function updateSettings(projectID: string, input: Partial<Settings>) {
    const current = await getSettings(projectID)
    const next = mergeSettings(current, input)
    await Storage.write(settingsKey(projectID), next)
    return next
  }

  export async function getLimit(projectID: string) {
    return Storage.read<RateLimit>(limitKey(projectID))
      .then((value) => value ?? defaultLimit())
      .catch(() => defaultLimit())
  }

  export async function updateLimit(projectID: string, input: Partial<RateLimit>) {
    const current = await getLimit(projectID)
    const next: RateLimit = {
      limit: input.limit ?? current.limit,
      used: input.used ?? current.used,
      resetAt: input.resetAt ?? current.resetAt,
    }
    await Storage.write(limitKey(projectID), next)
    return next
  }
}
