import { useState, useEffect } from 'react'

export type EstadoSupervision = 'pendiente_revision' | 'aprobado' | 'rechazado'

export interface SupervisionState {
  avanceId: string
  supervisorId: string
  estado: EstadoSupervision
  fechaRevision?: Date
  observaciones?: string
  periodo: string
}

export interface PeriodoFechas {
  desde: Date
  hasta: Date
  nombre: string
}

export function useSupervisionState(supervisorId: string) {
  const [estadosSupervision, setEstadosSupervision] = useState<Map<string, SupervisionState>>(new Map())
  const [loading, setLoading] = useState(false)
  const storageKey = supervisorId ? `supervision_state_${supervisorId}` : null

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setEstadosSupervision(new Map())
      return
    }

    try {
      const storedData = window.localStorage.getItem(storageKey)
      if (!storedData) {
        setEstadosSupervision(new Map())
        return
      }

      const parsed: SupervisionState[] = JSON.parse(storedData)
      const map = new Map<string, SupervisionState>()

      parsed.forEach((state) => {
        map.set(state.avanceId, {
          ...state,
          fechaRevision: state.fechaRevision ? new Date(state.fechaRevision) : undefined,
        })
      })

      setEstadosSupervision(map)
    } catch (error) {
      console.error('Error al cargar estados de supervisión almacenados:', error)
      setEstadosSupervision(new Map())
    }
  }, [storageKey])

  // Función para obtener el período actual (15 a 15)
  const getPeriodoActual = (): PeriodoFechas => {
    const hoy = new Date()
    const dia = hoy.getDate()
    
    if (dia >= 15) {
      // Período actual: 15 del mes actual al 15 del siguiente
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 15)
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15)
      return {
        desde,
        hasta,
        nombre: `Período Actual (${desde.toLocaleDateString('es-AR')} - ${hasta.toLocaleDateString('es-AR')})`
      }
    } else {
      // Período actual: 15 del mes anterior al 15 del actual
      const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15)
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 15)
      return {
        desde,
        hasta,
        nombre: `Período Actual (${desde.toLocaleDateString('es-AR')} - ${hasta.toLocaleDateString('es-AR')})`
      }
    }
  }

  // Función para obtener períodos disponibles
  const getPeriodosDisponibles = (): PeriodoFechas[] => {
    const actual = getPeriodoActual()
    const anterior = {
      desde: new Date(actual.desde.getFullYear(), actual.desde.getMonth() - 1, 15),
      hasta: new Date(actual.desde),
      nombre: `Período Anterior (${new Date(actual.desde.getFullYear(), actual.desde.getMonth() - 1, 15).toLocaleDateString('es-AR')} - ${actual.desde.toLocaleDateString('es-AR')})`
    }
    const siguiente = {
      desde: new Date(actual.hasta),
      hasta: new Date(actual.hasta.getFullYear(), actual.hasta.getMonth() + 1, 15),
      nombre: `Período Siguiente (${actual.hasta.toLocaleDateString('es-AR')} - ${new Date(actual.hasta.getFullYear(), actual.hasta.getMonth() + 1, 15).toLocaleDateString('es-AR')})`
    }
    
    return [anterior, actual, siguiente]
  }

  // Función para obtener el estado de supervisión de un avance
  const getEstadoSupervision = (avanceId: string): EstadoSupervision => {
    const estado = estadosSupervision.get(avanceId)
    return estado?.estado || 'pendiente_revision'
  }

  // Función para obtener el texto legible del estado
  const getEstadoSupervisionTexto = (estado: EstadoSupervision): string => {
    switch (estado) {
      case 'pendiente_revision':
        return 'Pendiente'
      case 'aprobado':
        return 'Aprobado'
      case 'rechazado':
        return 'Rechazado'
      default:
        return 'Pendiente'
    }
  }

  // Función para marcar el estado de supervisión
  const marcarEstadoSupervision = async (
    avanceId: string, 
    estado: EstadoSupervision, 
    observaciones?: string
  ) => {
    setLoading(true)
    try {
      const periodoActual = getPeriodoActual()
      const periodoString = `${periodoActual.desde.toISOString().split('T')[0]}_${periodoActual.hasta.toISOString().split('T')[0]}`
      
      const nuevoEstado: SupervisionState = {
        avanceId,
        supervisorId,
        estado,
        fechaRevision: new Date(),
        observaciones,
        periodo: periodoString
      }

      // Guardar en estado local y en almacenamiento persistente
      setEstadosSupervision(prev => {
        const updated = new Map(prev)
        updated.set(avanceId, nuevoEstado)

        if (storageKey && typeof window !== 'undefined') {
          const serializable = Array.from(updated.values()).map((state) => ({
            ...state,
            fechaRevision: state.fechaRevision ? state.fechaRevision.toISOString() : undefined,
          }))
          window.localStorage.setItem(storageKey, JSON.stringify(serializable))
        }

        return updated
      })

      // TODO: Aquí se guardaría en la base de datos
      // await saveSupervisionState(nuevoEstado)
      
      console.log('Estado de supervisión guardado:', nuevoEstado)
    } catch (error) {
      console.error('Error al guardar estado de supervisión:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener avances pendientes de revisión
  const getAvancesPendientes = (): string[] => {
    const pendientes: string[] = []
    estadosSupervision.forEach((estado, avanceId) => {
      if (estado.estado === 'pendiente_revision') {
        pendientes.push(avanceId)
      }
    })
    return pendientes
  }

  // Función para obtener avances aprobados
  const getAvancesAprobados = (): string[] => {
    const aprobados: string[] = []
    estadosSupervision.forEach((estado, avanceId) => {
      if (estado.estado === 'aprobado') {
        aprobados.push(avanceId)
      }
    })
    return aprobados
  }

  // Función para obtener avances rechazados
  const getAvancesRechazados = (): string[] => {
    const rechazados: string[] = []
    estadosSupervision.forEach((estado, avanceId) => {
      if (estado.estado === 'rechazado') {
        rechazados.push(avanceId)
      }
    })
    return rechazados
  }

  return {
    estadosSupervision,
    loading,
    getPeriodoActual,
    getPeriodosDisponibles,
    getEstadoSupervision,
    getEstadoSupervisionTexto,
    marcarEstadoSupervision,
    getAvancesPendientes,
    getAvancesAprobados,
    getAvancesRechazados
  }
} 