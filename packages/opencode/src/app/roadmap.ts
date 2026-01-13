import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"

export namespace Roadmap {
  export const Status = z.enum(["planned", "in_progress", "done"])

  export const Feature = z
    .object({
      id: z.string(),
      title: z.string(),
      phase: z.string(),
      status: Status,
      owner: z.string(),
      createdAt: z.number(),
      updatedAt: z.number(),
    })
    .meta({ ref: "RoadmapFeature" })

  export type Feature = z.infer<typeof Feature>

  export const Info = z
    .object({
      phases: z.array(z.string()),
      features: z.array(Feature),
    })
    .meta({ ref: "Roadmap" })

  export type Info = z.infer<typeof Info>

  export const Create = z.object({
    title: z.string(),
    phase: z.string(),
    owner: z.string().optional(),
  })

  export const Update = z.object({
    title: z.string().optional(),
    phase: z.string().optional(),
    status: Status.optional(),
    owner: z.string().optional(),
  })

  const key = (projectID: string) => ["app", "roadmap", projectID]

  const defaults = (): Info => ({
    phases: ["Foundation", "MVP", "Scale"],
    features: [],
  })

  export async function get(projectID: string) {
    return Storage.read<Info>(key(projectID))
      .then((value) => value ?? defaults())
      .catch(() => defaults())
  }

  export async function create(projectID: string, input: z.infer<typeof Create>) {
    const roadmap = await get(projectID)
    const now = Date.now()
    const feature: Feature = {
      id: randomUUID(),
      title: input.title,
      phase: input.phase,
      status: "planned",
      owner: input.owner ?? "Auto",
      createdAt: now,
      updatedAt: now,
    }
    const next = {
      ...roadmap,
      features: [feature, ...roadmap.features],
    }
    await Storage.write(key(projectID), next)
    return feature
  }

  export async function update(projectID: string, featureID: string, input: z.infer<typeof Update>) {
    const roadmap = await get(projectID)
    const now = Date.now()
    const features = roadmap.features.map((feature) => {
      if (feature.id !== featureID) return feature
      return {
        ...feature,
        title: input.title ?? feature.title,
        phase: input.phase ?? feature.phase,
        status: input.status ?? feature.status,
        owner: input.owner ?? feature.owner,
        updatedAt: now,
      }
    })

    const updated = features.find((feature) => feature.id === featureID)
    if (!updated) throw new Storage.NotFoundError({ message: "Feature not found" })

    const next = { ...roadmap, features }
    await Storage.write(key(projectID), next)
    return updated
  }

  export async function remove(projectID: string, featureID: string) {
    const roadmap = await get(projectID)
    const features = roadmap.features.filter((feature) => feature.id !== featureID)
    if (features.length === roadmap.features.length) {
      throw new Storage.NotFoundError({ message: "Feature not found" })
    }
    const next = { ...roadmap, features }
    await Storage.write(key(projectID), next)
    return true
  }
}
