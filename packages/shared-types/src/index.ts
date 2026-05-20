// Tipos compartilhados entre web e api.
// O scope @kainos/shared-types é importável de qualquer workspace.
// Adicione aqui apenas tipos genuinamente compartilhados — DTOs de domínio
// devem viver no workspace do app que os define.

export const SHARED_TYPES_PACKAGE_VERSION = '0.1.0';

// Role do User. Espelha o enum gerado pelo Prisma na API, mas declarado
// como string literal aqui pra que o web possa importar sem depender de
// @prisma/client. Mantém objeto-as-const pra preservar uso `Role.ADMIN`.
export type Role = 'USER' | 'ADMIN';
export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const satisfies Record<string, Role>;

// Resposta padrão de erro da API (consumida pelo web em apiFetch).
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Resposta do endpoint GET /api/v1/me — perfil do usuário autenticado.
export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
}

// Paginação cursor-based padrão.
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}
