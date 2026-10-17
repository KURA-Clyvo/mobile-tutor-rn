import { apiClient } from './api/client';
import type { CatalogoLojaRaw, CategoriaLoja } from '../types/loja';

// GET /api/v1/loja/catalogo — autenticado (JWT). Devolve o envelope CRU do Java: o `aviso` vem da API e a tela o mostra.
// ÂNCORA (regra 11): backend-tutor-java 98fb53e, loja/bff/api/LojaCatalogoController.java:23,35-51 (params categoria opcional,
// page 0..10000 default 0, size 1..50 default 20), conferida em 2026-10-17. O prefixo `/api` é o context-path do Java (mesmo
// padrão de pets.service.ts: '/api/v1/tutor/pets').
// Reproduz: git -C D:/FIAP/KURA/backend-tutor-java show 98fb53e:src/main/java/br/com/clyvo/kura/tutor/loja/bff/api/LojaCatalogoController.java | sed -n '23p;35,51p'
export const listarCatalogo = (params?: { categoria?: CategoriaLoja; page?: number; size?: number }) =>
  apiClient.get<CatalogoLojaRaw>('/api/v1/loja/catalogo', { params }).then(r => r.data);
