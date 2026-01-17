import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"

export namespace Integrations {
  export const GitHubType = z.enum(["issue", "pull"])
  export const GitLabType = z.enum(["issue", "merge"])

  export const GitHubItem = z
    .object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      url: z.string(),
      repo: z.string(),
      kind: GitHubType,
      createdAt: z.number(),
    })
    .meta({ ref: "GitHubItem" })

  export const GitLabItem = z
    .object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      url: z.string(),
      repo: z.string(),
      kind: GitLabType,
      createdAt: z.number(),
    })
    .meta({ ref: "GitLabItem" })

  export const LinearItem = z
    .object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      url: z.string(),
      team: z.string(),
      createdAt: z.number(),
    })
    .meta({ ref: "LinearItem" })

  export const Config = z
    .object({
      github: z
        .object({
          token: z.string().optional(),
          repo: z.string().optional(),
        })
        .optional(),
      gitlab: z
        .object({
          token: z.string().optional(),
          host: z.string().optional(),
          project: z.string().optional(),
        })
        .optional(),
      linear: z
        .object({
          token: z.string().optional(),
          team: z.string().optional(),
        })
        .optional(),
    })
    .meta({ ref: "IntegrationConfig" })

  export type GitHubItem = z.infer<typeof GitHubItem>
  export type GitLabItem = z.infer<typeof GitLabItem>
  export type LinearItem = z.infer<typeof LinearItem>
  export type Config = z.infer<typeof Config>

  export const GitHubCreate = z.object({
    title: z.string(),
    status: z.string(),
    url: z.string(),
    repo: z.string(),
    kind: GitHubType,
  })

  export const GitLabCreate = z.object({
    title: z.string(),
    status: z.string(),
    url: z.string(),
    repo: z.string(),
    kind: GitLabType,
  })

  export const LinearCreate = z.object({
    title: z.string(),
    status: z.string(),
    url: z.string(),
    team: z.string(),
  })

  export const ConfigInput = Config.partial()

  const githubKey = (projectID: string) => ["app", "integrations", "github", projectID]
  const gitlabKey = (projectID: string) => ["app", "integrations", "gitlab", projectID]
  const linearKey = (projectID: string) => ["app", "integrations", "linear", projectID]
  const configKey = (projectID: string) => ["app", "integrations", "config", projectID]

  const defaults = (): Config => ({
    github: { token: "", repo: "" },
    gitlab: { token: "", host: "https://gitlab.com", project: "" },
    linear: { token: "", team: "" },
  })

  export async function getConfig(projectID: string) {
    return Storage.read<Config>(configKey(projectID))
      .then((value) => value ?? defaults())
      .catch(() => defaults())
  }

  export async function updateConfig(projectID: string, input: Partial<Config>) {
    const current = await getConfig(projectID)
    const next: Config = {
      github: { ...current.github, ...input.github },
      gitlab: { ...current.gitlab, ...input.gitlab },
      linear: { ...current.linear, ...input.linear },
    }
    await Storage.write(configKey(projectID), next)
    return next
  }

  export async function listGitHub(projectID: string) {
    return Storage.read<GitHubItem[]>(githubKey(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function addGitHub(projectID: string, input: z.infer<typeof GitHubCreate>) {
    const items = await listGitHub(projectID)
    const entry: GitHubItem = {
      id: randomUUID(),
      title: input.title,
      status: input.status,
      url: input.url,
      repo: input.repo,
      kind: input.kind,
      createdAt: Date.now(),
    }
    const next = [entry, ...items]
    await Storage.write(githubKey(projectID), next)
    return entry
  }

  export async function removeGitHub(projectID: string, itemID: string) {
    const items = await listGitHub(projectID)
    const next = items.filter((item) => item.id !== itemID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "GitHub item not found" })
    await Storage.write(githubKey(projectID), next)
    return true
  }

  export async function listGitLab(projectID: string) {
    return Storage.read<GitLabItem[]>(gitlabKey(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function addGitLab(projectID: string, input: z.infer<typeof GitLabCreate>) {
    const items = await listGitLab(projectID)
    const entry: GitLabItem = {
      id: randomUUID(),
      title: input.title,
      status: input.status,
      url: input.url,
      repo: input.repo,
      kind: input.kind,
      createdAt: Date.now(),
    }
    const next = [entry, ...items]
    await Storage.write(gitlabKey(projectID), next)
    return entry
  }

  export async function removeGitLab(projectID: string, itemID: string) {
    const items = await listGitLab(projectID)
    const next = items.filter((item) => item.id !== itemID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "GitLab item not found" })
    await Storage.write(gitlabKey(projectID), next)
    return true
  }

  export async function listLinear(projectID: string) {
    return Storage.read<LinearItem[]>(linearKey(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function addLinear(projectID: string, input: z.infer<typeof LinearCreate>) {
    const items = await listLinear(projectID)
    const entry: LinearItem = {
      id: randomUUID(),
      title: input.title,
      status: input.status,
      url: input.url,
      team: input.team,
      createdAt: Date.now(),
    }
    const next = [entry, ...items]
    await Storage.write(linearKey(projectID), next)
    return entry
  }

  export async function removeLinear(projectID: string, itemID: string) {
    const items = await listLinear(projectID)
    const next = items.filter((item) => item.id !== itemID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "Linear item not found" })
    await Storage.write(linearKey(projectID), next)
    return true
  }

  export async function syncGitHub(projectID: string) {
    const config = await getConfig(projectID)
    const repo = config.github?.repo?.trim() ?? ""
    const token = config.github?.token?.trim() ?? ""
    if (!repo) return listGitHub(projectID)

    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    const url = `https://api.github.com/repos/${repo}/issues?state=all&per_page=50`
    const response = await fetch(url, { headers })
    if (!response.ok) throw new Error("Failed to sync GitHub")
    const data = (await response.json()) as Array<Record<string, any>>

    const items = data.map((item) => {
      const kind = item.pull_request ? "pull" : "issue"
      return {
        id: `${item.id}`,
        title: item.title ?? "",
        status: item.state ?? "",
        url: item.html_url ?? "",
        repo,
        kind,
        createdAt: new Date(item.created_at ?? Date.now()).getTime(),
      }
    }) satisfies GitHubItem[]

    await Storage.write(githubKey(projectID), items)
    return items
  }

  export async function syncGitLab(projectID: string) {
    const config = await getConfig(projectID)
    const host = config.gitlab?.host?.trim() || "https://gitlab.com"
    const project = config.gitlab?.project?.trim() ?? ""
    const token = config.gitlab?.token?.trim() ?? ""
    if (!project) return listGitLab(projectID)

    const headers: Record<string, string> = token ? { "PRIVATE-TOKEN": token } : {}
    const encoded = encodeURIComponent(project)
    const issueUrl = `${host}/api/v4/projects/${encoded}/issues?per_page=50`
    const mergeUrl = `${host}/api/v4/projects/${encoded}/merge_requests?per_page=50`

    const issueRes = await fetch(issueUrl, { headers })
    if (!issueRes.ok) throw new Error("Failed to sync GitLab issues")
    const issueData = (await issueRes.json()) as Array<Record<string, any>>

    const mergeRes = await fetch(mergeUrl, { headers })
    if (!mergeRes.ok) throw new Error("Failed to sync GitLab merge requests")
    const mergeData = (await mergeRes.json()) as Array<Record<string, any>>

    const issueItems = issueData.map((item) => ({
      id: `issue-${item.id}`,
      title: item.title ?? "",
      status: item.state ?? "",
      url: item.web_url ?? "",
      repo: project,
      kind: "issue" as const,
      createdAt: new Date(item.created_at ?? Date.now()).getTime(),
    }))

    const mergeItems = mergeData.map((item) => ({
      id: `merge-${item.id}`,
      title: item.title ?? "",
      status: item.state ?? "",
      url: item.web_url ?? "",
      repo: project,
      kind: "merge" as const,
      createdAt: new Date(item.created_at ?? Date.now()).getTime(),
    }))

    const items = [...mergeItems, ...issueItems]
    await Storage.write(gitlabKey(projectID), items)
    return items
  }

  export async function syncLinear(projectID: string) {
    const config = await getConfig(projectID)
    const token = config.linear?.token?.trim() ?? ""
    if (!token) return listLinear(projectID)

    const query = {
      query:
        "query Issues($first: Int!) { issues(first: $first) { nodes { id title url state { name } team { name } createdAt } } }",
      variables: { first: 50 },
    }

    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    })
    if (!response.ok) throw new Error("Failed to sync Linear")
    const data = (await response.json()) as { data?: { issues?: { nodes?: Array<Record<string, any>> } } }
    const nodes = data.data?.issues?.nodes ?? []

    const items = nodes.map((item) => ({
      id: item.id,
      title: item.title ?? "",
      status: item.state?.name ?? "",
      url: item.url ?? "",
      team: item.team?.name ?? "",
      createdAt: new Date(item.createdAt ?? Date.now()).getTime(),
    }))

    await Storage.write(linearKey(projectID), items)
    return items
  }
}
