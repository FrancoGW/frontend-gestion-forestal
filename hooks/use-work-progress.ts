"use client"

import { useState, useEffect } from "react"

interface WorkProgress {
  tasksCompleted: number
  totalTasks: number
  percentageComplete: number
  lastUpdated: string
}

const useWorkProgress = (apiUrl: string) => {
  const [workProgress, setWorkProgress] = useState<WorkProgress | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkProgress = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch work progress. Status: ${response.status}`)
        }

        const data: WorkProgress = await response.json()
        setWorkProgress(data)
      } catch (error: any) {
        console.error("Error fetching work progress:", error)
        setError("Failed to load work progress from the server.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkProgress()
  }, [apiUrl])

  return { workProgress, isLoading, error }
}

export default useWorkProgress
