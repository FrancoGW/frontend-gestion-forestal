export interface MiembroCuadrilla {
  id: string
  nombre: string
  apellido: string
  dni: string
  rol: string
  telefono?: string
  email?: string
  fechaIngreso: string
}

export interface Cuadrilla {
  id: string
  nombre: string
  proveedorId: string
  proveedorNombre: string
  responsable: string
  miembros: MiembroCuadrilla[]
  vehiculos: string[]
  equipamiento: string[]
  activa: boolean
  fechaCreacion: string
  ultimaActualizacion: string
}
