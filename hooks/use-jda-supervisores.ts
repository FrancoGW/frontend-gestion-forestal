import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export function useJdaSupervisores() {
  const { user } = useAuth()
  const [supervisores, setSupervisores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSupervisores() {
      if (!user || !user._id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/jefes_de_area/${user._id}`)
        let data
        try {
          data = await res.json()
        } catch (jsonErr) {
          setError("La respuesta del servidor no es JSON válido. ¿El endpoint existe?")
          setLoading(false)
          return
        }
        console.log("Jefe de área recibido:", data)
        setSupervisores(data.supervisoresAsignados || [])
      } catch (err: any) {
        setError(err.message || "Error al cargar supervisores")
      } finally {
        setLoading(false)
      }
    }
    fetchSupervisores()
  }, [user])

  return { supervisores, loading, error }
} 