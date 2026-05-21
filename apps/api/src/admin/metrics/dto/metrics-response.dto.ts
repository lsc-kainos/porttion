// Esqueleto mínimo de métricas para o template. Cada projeto deve
// estender com métricas de domínio (documentos, mensagens, billing etc.).

export interface UserMetrics {
  total: number;
  new30d: number;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface MetricsResponseDto {
  users: UserMetrics;
  exampleQueue: QueueMetrics;
  generatedAt: string;
}
