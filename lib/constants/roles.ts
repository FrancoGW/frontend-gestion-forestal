/**
 * Roles del sistema. Centralizado para APIs, auth y admin.
 * Incluye subgerente (por encima de jefes de área en la jerarquía).
 */
export const ROLES_VALIDOS = [
  "admin",
  "subgerente",
  "jda",
  "supervisor",
  "provider",
] as const;

export type UserRol = (typeof ROLES_VALIDOS)[number];

/** Roles que se pueden crear/editar desde el panel Admin > Usuarios */
export const ROLES_GESTIONABLES_ADMIN = [
  "admin",
  "subgerente",
  "supervisor",
  "provider",
] as const;

export type RolGestionableAdmin = (typeof ROLES_GESTIONABLES_ADMIN)[number];

export function isRolGestionableAdmin(rol: string): rol is RolGestionableAdmin {
  return ROLES_GESTIONABLES_ADMIN.includes(rol as RolGestionableAdmin);
}

export function isRolValido(rol: string): rol is UserRol {
  return ROLES_VALIDOS.includes(rol as UserRol);
}

/** Etiquetas para mostrar en UI */
export const ROL_LABEL: Record<UserRol, string> = {
  admin: "Administrador",
  subgerente: "Subgerente",
  jda: "Jefe de Área",
  supervisor: "Supervisor",
  provider: "Proveedor",
};
