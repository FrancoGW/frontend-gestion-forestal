import { avancesTrabajoAPI } from "@/lib/api-client"

/**
 * Create a new work progress entry.
 * @param data - The work progress data to create
 * @returns The created work progress record
 */
export async function createWorkProgress(data: any) {
  if (!data) {
    throw new Error("createWorkProgress: data is required")
  }

  try {
    return await avancesTrabajoAPI.create(data)
  } catch (error) {
    console.error("Error creating work progress:", error)
    throw error
  }
}
