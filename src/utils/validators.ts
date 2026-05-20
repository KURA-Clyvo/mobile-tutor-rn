import { z } from 'zod';

export const loginSchema = z.object({
  dsEmail: z.string().email('E-mail inválido').min(1, 'E-mail obrigatório'),
  dsSenha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  nmTutor:        z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  dsEmail:        z.string().email('E-mail inválido'),
  dsSenha:        z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  dsSenhaConfirm: z.string(),
  dsTelefone:     z.string().min(10, 'Telefone inválido'),
}).refine(d => d.dsSenha === d.dsSenhaConfirm, {
  message: 'As senhas não coincidem',
  path: ['dsSenhaConfirm'],
});

export type LoginFormData    = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
