import { workOrdersAPI } from "@/lib/api-client"

/**
 * Get a specific work order by ID.
 * @param id - The work order ID
 * @returns The work order data
 */
export async function getWorkOrder(id: string | number) {
  if (!id) {
    throw new Error("getWorkOrder: id is required")
  }

  try {
    return await workOrdersAPI.getById(id)
  } catch (error) {
    console.error("Error getting work order:", error)
    throw error
  }
}
