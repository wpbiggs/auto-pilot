import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"
import { resolver } from "hono-openapi"
import z from "zod"
import { errors } from "./error"
import { Kanban } from "../app/kanban"
import { Roadmap } from "../app/roadmap"
import { Ideation } from "../app/ideation"
import { ContextData } from "../app/context"
import { Insights } from "../app/insights"
import { SystemData } from "../app/system"
import { Integrations } from "../app/integrations"
import { reviewSignal } from "../app/kanban-review"
import { Instance } from "../project/instance"

export const AppRoute = new Hono()
  .get(
    "/kanban",
    describeRoute({
      summary: "List kanban tasks",
      description: "Retrieve kanban tasks for the current project.",
      operationId: "app.kanban.list",
      responses: {
        200: {
          description: "Kanban tasks",
          content: { "application/json": { schema: resolver(Kanban.Info.array()) } },
        },
      },
    }),
    async (c) => {
      const tasks = await Kanban.list(Instance.project.id)
      return c.json(tasks)
    },
  )
  .post(
    "/kanban",
    describeRoute({
      summary: "Create kanban task",
      description: "Create a kanban task for the current project.",
      operationId: "app.kanban.create",
      responses: {
        200: {
          description: "Created task",
          content: { "application/json": { schema: resolver(Kanban.Info) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Kanban.Create),
    async (c) => {
      const body = c.req.valid("json")
      const task = await Kanban.create(Instance.project.id, body)
      return c.json(task)
    },
  )
  .patch(
    "/kanban/:taskID",
    describeRoute({
      summary: "Update kanban task",
      description: "Update an existing kanban task.",
      operationId: "app.kanban.update",
      responses: {
        200: {
          description: "Updated task",
          content: { "application/json": { schema: resolver(Kanban.Info) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ taskID: z.string() })),
    validator("json", Kanban.Update),
    async (c) => {
      const taskID = c.req.valid("param").taskID
      const body = c.req.valid("json")
      const task = await Kanban.update(Instance.project.id, taskID, body)
      return c.json(task)
    },
  )
  .post(
    "/kanban/:taskID/signal",
    describeRoute({
      summary: "Signal task completion",
      description: "Signal that an agent completed work on a task and trigger model review.",
      operationId: "app.kanban.signal",
      responses: {
        200: {
          description: "Review result",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  task: Kanban.Info,
                  review: z.object({
                    status: z.enum(["approved", "revise"]),
                    notes: z.string(),
                    prompt: z.string().optional(),
                  }),
                }),
              ),
            },
          },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ taskID: z.string() })),
    validator("json", Kanban.Signal),
    async (c) => {
      const taskID = c.req.valid("param").taskID
      const body = c.req.valid("json")
      const result = await reviewSignal(Instance.project.id, taskID, body)
      return c.json(result)
    },
  )
  .post(
    "/kanban/:taskID/human",
    describeRoute({
      summary: "Human review action",
      description: "Move a task to done or back to in-progress with notes.",
      operationId: "app.kanban.human",
      responses: {
        200: {
          description: "Updated task",
          content: { "application/json": { schema: resolver(Kanban.Info) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ taskID: z.string() })),
    validator("json", Kanban.HumanAction),
    async (c) => {
      const taskID = c.req.valid("param").taskID
      const body = c.req.valid("json")
      const task = await Kanban.humanAction(Instance.project.id, taskID, body)
      return c.json(task)
    },
  )
  .delete(
    "/kanban/:taskID",
    describeRoute({
      summary: "Delete kanban task",
      description: "Remove a kanban task.",
      operationId: "app.kanban.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ taskID: z.string() })),
    async (c) => {
      const taskID = c.req.valid("param").taskID
      await Kanban.remove(Instance.project.id, taskID)
      return c.json(true)
    },
  )
  .get(
    "/roadmap",
    describeRoute({
      summary: "Get roadmap",
      description: "Retrieve the product roadmap for the current project.",
      operationId: "app.roadmap.get",
      responses: {
        200: {
          description: "Roadmap",
          content: { "application/json": { schema: resolver(Roadmap.Info) } },
        },
      },
    }),
    async (c) => {
      const roadmap = await Roadmap.get(Instance.project.id)
      return c.json(roadmap)
    },
  )
  .post(
    "/roadmap",
    describeRoute({
      summary: "Create roadmap feature",
      description: "Add a new feature to the roadmap.",
      operationId: "app.roadmap.create",
      responses: {
        200: {
          description: "Created feature",
          content: { "application/json": { schema: resolver(Roadmap.Feature) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Roadmap.Create),
    async (c) => {
      const body = c.req.valid("json")
      const feature = await Roadmap.create(Instance.project.id, body)
      return c.json(feature)
    },
  )
  .patch(
    "/roadmap/:featureID",
    describeRoute({
      summary: "Update roadmap feature",
      description: "Update a roadmap feature.",
      operationId: "app.roadmap.update",
      responses: {
        200: {
          description: "Updated feature",
          content: { "application/json": { schema: resolver(Roadmap.Feature) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ featureID: z.string() })),
    validator("json", Roadmap.Update),
    async (c) => {
      const featureID = c.req.valid("param").featureID
      const body = c.req.valid("json")
      const feature = await Roadmap.update(Instance.project.id, featureID, body)
      return c.json(feature)
    },
  )
  .delete(
    "/roadmap/:featureID",
    describeRoute({
      summary: "Delete roadmap feature",
      description: "Remove a roadmap feature.",
      operationId: "app.roadmap.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ featureID: z.string() })),
    async (c) => {
      const featureID = c.req.valid("param").featureID
      await Roadmap.remove(Instance.project.id, featureID)
      return c.json(true)
    },
  )
  .get(
    "/roadmap/export",
    describeRoute({
      summary: "Export roadmap",
      description: "Export roadmap data in JSON, CSV, or Markdown.",
      operationId: "app.roadmap.export",
      responses: {
        200: {
          description: "Exported roadmap",
          content: { "application/json": { schema: resolver(z.string()) } },
        },
      },
    }),
    validator("query", z.object({ format: z.enum(["json", "csv", "md"]).optional() })),
    async (c) => {
      const format = c.req.valid("query").format ?? "json"
      const roadmap = await Roadmap.get(Instance.project.id)

      if (format === "json") return c.json(roadmap)

      const rows = roadmap.features.map(
        (feature) => `${feature.title},${feature.phase},${feature.status},${feature.owner}`,
      )

      if (format === "csv") {
        const output = ["title,phase,status,owner", ...rows].join("\n")
        return c.text(output)
      }

      const markdown = [
        `# Roadmap`,
        ``,
        ...roadmap.phases.map((phase) => {
          const items = roadmap.features.filter((feature) => feature.phase === phase)
          const entries = items.map((feature) => `- ${feature.title} (${feature.status}) — ${feature.owner}`)
          return [`## ${phase}`, ...entries, ``].join("\n")
        }),
      ].join("\n")
      return c.text(markdown)
    },
  )
  .get(
    "/ideation",
    describeRoute({
      summary: "List ideas",
      description: "Retrieve ideation ideas for the current project.",
      operationId: "app.ideation.list",
      responses: {
        200: {
          description: "Ideas",
          content: { "application/json": { schema: resolver(Ideation.Idea.array()) } },
        },
      },
    }),
    async (c) => {
      const ideas = await Ideation.list(Instance.project.id)
      return c.json(ideas)
    },
  )
  .post(
    "/ideation",
    describeRoute({
      summary: "Create idea",
      description: "Create an ideation entry.",
      operationId: "app.ideation.create",
      responses: {
        200: {
          description: "Created idea",
          content: { "application/json": { schema: resolver(Ideation.Idea) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Ideation.Create),
    async (c) => {
      const body = c.req.valid("json")
      const idea = await Ideation.create(Instance.project.id, body)
      return c.json(idea)
    },
  )
  .patch(
    "/ideation/:ideaID",
    describeRoute({
      summary: "Update idea",
      description: "Update an idea.",
      operationId: "app.ideation.update",
      responses: {
        200: {
          description: "Updated idea",
          content: { "application/json": { schema: resolver(Ideation.Idea) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ ideaID: z.string() })),
    validator("json", Ideation.Update),
    async (c) => {
      const ideaID = c.req.valid("param").ideaID
      const body = c.req.valid("json")
      const idea = await Ideation.update(Instance.project.id, ideaID, body)
      return c.json(idea)
    },
  )
  .post(
    "/ideation/:ideaID/convert",
    describeRoute({
      summary: "Convert idea",
      description: "Convert an idea into a kanban task.",
      operationId: "app.ideation.convert",
      responses: {
        200: {
          description: "Converted",
          content: {
            "application/json": {
              schema: resolver(z.object({ idea: Ideation.Idea, task: Kanban.Info })),
            },
          },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ ideaID: z.string() })),
    async (c) => {
      const ideaID = c.req.valid("param").ideaID
      const result = await Ideation.convert(Instance.project.id, ideaID)
      return c.json(result)
    },
  )
  .delete(
    "/ideation/:ideaID",
    describeRoute({
      summary: "Delete idea",
      description: "Remove an idea.",
      operationId: "app.ideation.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ ideaID: z.string() })),
    async (c) => {
      const ideaID = c.req.valid("param").ideaID
      await Ideation.remove(Instance.project.id, ideaID)
      return c.json(true)
    },
  )
  .get(
    "/context/index",
    describeRoute({
      summary: "Get context index",
      description: "Search project index and return matching files/dirs.",
      operationId: "app.context.index",
      responses: {
        200: {
          description: "Index results",
          content: { "application/json": { schema: resolver(z.array(z.string())) } },
        },
      },
    }),
    validator("query", z.object({ query: z.string().optional() })),
    async (c) => {
      const query = c.req.valid("query").query
      const items = await ContextData.index(query)
      return c.json(items)
    },
  )
  .get(
    "/context/memories",
    describeRoute({
      summary: "List memories",
      description: "Retrieve stored context memories.",
      operationId: "app.context.memories",
      responses: {
        200: {
          description: "Memories",
          content: { "application/json": { schema: resolver(ContextData.Memory.array()) } },
        },
      },
    }),
    validator("query", z.object({ query: z.string().optional() })),
    async (c) => {
      const query = c.req.valid("query").query
      const memories = await ContextData.list(Instance.project.id, query)
      return c.json(memories)
    },
  )
  .post(
    "/context/memories",
    describeRoute({
      summary: "Create memory",
      description: "Create a context memory entry.",
      operationId: "app.context.create",
      responses: {
        200: {
          description: "Memory",
          content: { "application/json": { schema: resolver(ContextData.Memory) } },
        },
        ...errors(400),
      },
    }),
    validator("json", ContextData.Create),
    async (c) => {
      const body = c.req.valid("json")
      const memory = await ContextData.create(Instance.project.id, body)
      return c.json(memory)
    },
  )
  .delete(
    "/context/memories/:memoryID",
    describeRoute({
      summary: "Delete memory",
      description: "Remove a context memory entry.",
      operationId: "app.context.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ memoryID: z.string() })),
    async (c) => {
      const memoryID = c.req.valid("param").memoryID
      await ContextData.remove(Instance.project.id, memoryID)
      return c.json(true)
    },
  )
  .get(
    "/insights/competitors",
    describeRoute({
      summary: "List competitors",
      description: "Retrieve competitor notes for insights.",
      operationId: "app.insights.competitors",
      responses: {
        200: {
          description: "Competitors",
          content: { "application/json": { schema: resolver(Insights.Competitor.array()) } },
        },
      },
    }),
    async (c) => {
      const items = await Insights.list(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/insights/competitors",
    describeRoute({
      summary: "Create competitor",
      description: "Create a competitor note.",
      operationId: "app.insights.create",
      responses: {
        200: {
          description: "Competitor",
          content: { "application/json": { schema: resolver(Insights.Competitor) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Insights.Create),
    async (c) => {
      const body = c.req.valid("json")
      const item = await Insights.create(Instance.project.id, body)
      return c.json(item)
    },
  )
  .delete(
    "/insights/competitors/:competitorID",
    describeRoute({
      summary: "Delete competitor",
      description: "Remove a competitor note.",
      operationId: "app.insights.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ competitorID: z.string() })),
    async (c) => {
      const competitorID = c.req.valid("param").competitorID
      await Insights.remove(Instance.project.id, competitorID)
      return c.json(true)
    },
  )
  .get(
    "/system/changelog",
    describeRoute({
      summary: "List changelog entries",
      description: "Retrieve changelog entries for the current project.",
      operationId: "app.system.changelog",
      responses: {
        200: {
          description: "Changelog",
          content: { "application/json": { schema: resolver(SystemData.Changelog.array()) } },
        },
      },
    }),
    async (c) => {
      const items = await SystemData.listChangelog(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/system/changelog",
    describeRoute({
      summary: "Create changelog entry",
      description: "Add a changelog entry.",
      operationId: "app.system.changelog.create",
      responses: {
        200: {
          description: "Changelog entry",
          content: { "application/json": { schema: resolver(SystemData.Changelog) } },
        },
        ...errors(400),
      },
    }),
    validator("json", z.object({ title: z.string(), body: z.string(), type: SystemData.ChangelogType })),
    async (c) => {
      const body = c.req.valid("json")
      const item = await SystemData.addChangelog(Instance.project.id, body)
      return c.json(item)
    },
  )
  .delete(
    "/system/changelog/:entryID",
    describeRoute({
      summary: "Delete changelog entry",
      description: "Remove a changelog entry.",
      operationId: "app.system.changelog.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ entryID: z.string() })),
    async (c) => {
      const entryID = c.req.valid("param").entryID
      await SystemData.removeChangelog(Instance.project.id, entryID)
      return c.json(true)
    },
  )
  .get(
    "/system/notifications",
    describeRoute({
      summary: "List notifications",
      description: "Retrieve system notifications.",
      operationId: "app.system.notifications",
      responses: {
        200: {
          description: "Notifications",
          content: { "application/json": { schema: resolver(SystemData.Notification.array()) } },
        },
      },
    }),
    async (c) => {
      const items = await SystemData.listNotifications(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/system/notifications",
    describeRoute({
      summary: "Create notification",
      description: "Create a system notification.",
      operationId: "app.system.notifications.create",
      responses: {
        200: {
          description: "Notification",
          content: { "application/json": { schema: resolver(SystemData.Notification) } },
        },
        ...errors(400),
      },
    }),
    validator("json", z.object({ title: z.string(), body: z.string(), type: SystemData.NotificationType })),
    async (c) => {
      const body = c.req.valid("json")
      const item = await SystemData.addNotification(Instance.project.id, body)
      return c.json(item)
    },
  )
  .patch(
    "/system/notifications/:noteID",
    describeRoute({
      summary: "Dismiss notification",
      description: "Mark a notification as read.",
      operationId: "app.system.notifications.dismiss",
      responses: {
        200: {
          description: "Notification",
          content: { "application/json": { schema: resolver(SystemData.Notification) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ noteID: z.string() })),
    async (c) => {
      const noteID = c.req.valid("param").noteID
      const item = await SystemData.dismissNotification(Instance.project.id, noteID)
      return c.json(item)
    },
  )
  .get(
    "/system/settings",
    describeRoute({
      summary: "Get system settings",
      description: "Retrieve system settings for the current project.",
      operationId: "app.system.settings",
      responses: {
        200: {
          description: "Settings",
          content: { "application/json": { schema: resolver(SystemData.Settings) } },
        },
      },
    }),
    async (c) => {
      const settings = await SystemData.getSettings(Instance.project.id)
      return c.json(settings)
    },
  )
  .patch(
    "/system/settings",
    describeRoute({
      summary: "Update system settings",
      description: "Update system settings for the current project.",
      operationId: "app.system.settings.update",
      responses: {
        200: {
          description: "Settings",
          content: { "application/json": { schema: resolver(SystemData.Settings) } },
        },
        ...errors(400),
      },
    }),
    validator("json", SystemData.SettingsInput),
    async (c) => {
      const body = c.req.valid("json")
      const settings = await SystemData.updateSettings(Instance.project.id, body)
      return c.json(settings)
    },
  )
  .get(
    "/system/limit",
    describeRoute({
      summary: "Get rate limit",
      description: "Retrieve current rate limit info.",
      operationId: "app.system.limit",
      responses: {
        200: {
          description: "Rate limit",
          content: { "application/json": { schema: resolver(SystemData.RateLimit) } },
        },
      },
    }),
    async (c) => {
      const limit = await SystemData.getLimit(Instance.project.id)
      return c.json(limit)
    },
  )
  .patch(
    "/system/limit",
    describeRoute({
      summary: "Update rate limit",
      description: "Update stored rate limit info.",
      operationId: "app.system.limit.update",
      responses: {
        200: {
          description: "Rate limit",
          content: { "application/json": { schema: resolver(SystemData.RateLimit) } },
        },
        ...errors(400),
      },
    }),
    validator("json", SystemData.LimitInput),
    async (c) => {
      const body = c.req.valid("json")
      const limit = await SystemData.updateLimit(Instance.project.id, body)
      return c.json(limit)
    },
  )
  .get(
    "/integrations/github",
    describeRoute({
      summary: "List GitHub items",
      description: "Retrieve stored GitHub issues and PRs.",
      operationId: "app.integrations.github.list",
      responses: {
        200: {
          description: "GitHub items",
          content: { "application/json": { schema: resolver(Integrations.GitHubItem.array()) } },
        },
      },
    }),
    async (c) => {
      const items = await Integrations.listGitHub(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/integrations/github",
    describeRoute({
      summary: "Create GitHub item",
      description: "Create a stored GitHub issue/PR entry.",
      operationId: "app.integrations.github.create",
      responses: {
        200: {
          description: "GitHub item",
          content: { "application/json": { schema: resolver(Integrations.GitHubItem) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Integrations.GitHubCreate),
    async (c) => {
      const body = c.req.valid("json")
      const item = await Integrations.addGitHub(Instance.project.id, body)
      return c.json(item)
    },
  )
  .delete(
    "/integrations/github/:itemID",
    describeRoute({
      summary: "Delete GitHub item",
      description: "Remove a GitHub entry.",
      operationId: "app.integrations.github.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ itemID: z.string() })),
    async (c) => {
      const itemID = c.req.valid("param").itemID
      await Integrations.removeGitHub(Instance.project.id, itemID)
      return c.json(true)
    },
  )
  .get(
    "/integrations/gitlab",
    describeRoute({
      summary: "List GitLab items",
      description: "Retrieve stored GitLab issues and merge requests.",
      operationId: "app.integrations.gitlab.list",
      responses: {
        200: {
          description: "GitLab items",
          content: { "application/json": { schema: resolver(Integrations.GitLabItem.array()) } },
        },
      },
    }),
    async (c) => {
      const items = await Integrations.listGitLab(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/integrations/gitlab",
    describeRoute({
      summary: "Create GitLab item",
      description: "Create a stored GitLab issue/MR entry.",
      operationId: "app.integrations.gitlab.create",
      responses: {
        200: {
          description: "GitLab item",
          content: { "application/json": { schema: resolver(Integrations.GitLabItem) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Integrations.GitLabCreate),
    async (c) => {
      const body = c.req.valid("json")
      const item = await Integrations.addGitLab(Instance.project.id, body)
      return c.json(item)
    },
  )
  .delete(
    "/integrations/gitlab/:itemID",
    describeRoute({
      summary: "Delete GitLab item",
      description: "Remove a GitLab entry.",
      operationId: "app.integrations.gitlab.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ itemID: z.string() })),
    async (c) => {
      const itemID = c.req.valid("param").itemID
      await Integrations.removeGitLab(Instance.project.id, itemID)
      return c.json(true)
    },
  )
  .get(
    "/integrations/linear",
    describeRoute({
      summary: "List Linear items",
      description: "Retrieve stored Linear tasks.",
      operationId: "app.integrations.linear.list",
      responses: {
        200: {
          description: "Linear items",
          content: { "application/json": { schema: resolver(Integrations.LinearItem.array()) } },
        },
      },
    }),
    async (c) => {
      const items = await Integrations.listLinear(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/integrations/linear",
    describeRoute({
      summary: "Create Linear item",
      description: "Create a stored Linear issue entry.",
      operationId: "app.integrations.linear.create",
      responses: {
        200: {
          description: "Linear item",
          content: { "application/json": { schema: resolver(Integrations.LinearItem) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Integrations.LinearCreate),
    async (c) => {
      const body = c.req.valid("json")
      const item = await Integrations.addLinear(Instance.project.id, body)
      return c.json(item)
    },
  )
  .delete(
    "/integrations/linear/:itemID",
    describeRoute({
      summary: "Delete Linear item",
      description: "Remove a Linear entry.",
      operationId: "app.integrations.linear.remove",
      responses: {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: resolver(z.boolean()) } },
        },
        ...errors(400, 404),
      },
    }),
    validator("param", z.object({ itemID: z.string() })),
    async (c) => {
      const itemID = c.req.valid("param").itemID
      await Integrations.removeLinear(Instance.project.id, itemID)
      return c.json(true)
    },
  )
  .get(
    "/integrations/config",
    describeRoute({
      summary: "Get integration config",
      description: "Retrieve integration connection settings.",
      operationId: "app.integrations.config",
      responses: {
        200: {
          description: "Config",
          content: { "application/json": { schema: resolver(Integrations.Config) } },
        },
      },
    }),
    async (c) => {
      const config = await Integrations.getConfig(Instance.project.id)
      return c.json(config)
    },
  )
  .patch(
    "/integrations/config",
    describeRoute({
      summary: "Update integration config",
      description: "Update integration tokens and repository settings.",
      operationId: "app.integrations.config.update",
      responses: {
        200: {
          description: "Config",
          content: { "application/json": { schema: resolver(Integrations.Config) } },
        },
        ...errors(400),
      },
    }),
    validator("json", Integrations.ConfigInput),
    async (c) => {
      const body = c.req.valid("json")
      const config = await Integrations.updateConfig(Instance.project.id, body)
      return c.json(config)
    },
  )
  .post(
    "/integrations/github/sync",
    describeRoute({
      summary: "Sync GitHub",
      description: "Sync GitHub issues and PRs.",
      operationId: "app.integrations.github.sync",
      responses: {
        200: {
          description: "GitHub items",
          content: { "application/json": { schema: resolver(Integrations.GitHubItem.array()) } },
        },
        ...errors(400),
      },
    }),
    async (c) => {
      const items = await Integrations.syncGitHub(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/integrations/gitlab/sync",
    describeRoute({
      summary: "Sync GitLab",
      description: "Sync GitLab issues and merge requests.",
      operationId: "app.integrations.gitlab.sync",
      responses: {
        200: {
          description: "GitLab items",
          content: { "application/json": { schema: resolver(Integrations.GitLabItem.array()) } },
        },
        ...errors(400),
      },
    }),
    async (c) => {
      const items = await Integrations.syncGitLab(Instance.project.id)
      return c.json(items)
    },
  )
  .post(
    "/integrations/linear/sync",
    describeRoute({
      summary: "Sync Linear",
      description: "Sync Linear issues.",
      operationId: "app.integrations.linear.sync",
      responses: {
        200: {
          description: "Linear items",
          content: { "application/json": { schema: resolver(Integrations.LinearItem.array()) } },
        },
        ...errors(400),
      },
    }),
    async (c) => {
      const items = await Integrations.syncLinear(Instance.project.id)
      return c.json(items)
    },
  )
