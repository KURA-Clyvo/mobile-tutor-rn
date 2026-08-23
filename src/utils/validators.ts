import { z } from 'zod';

export const loginSchema = z.object({
  dsEmail: z.email('E-mail inválido').min(1, 'E-mail obrigatório'),
  dsSenha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  nmTutor:        z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  dsEmail:        z.email('E-mail inválido'),
  dsSenha:        z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  dsSenhaConfirm: z.string(),
  dsTelefone:     z.string().min(10, 'Telefone inválido'),
  // TASK-61: consentimento LGPD real no registro. Lembretes é obrigatório (bloqueia
  // submit no cliente); teleorientação é opcional, sem validação.
  aceiteLembretes:      z.boolean(),
  aceiteTeleorientacao: z.boolean(),
}).refine(d => d.dsSenha === d.dsSenhaConfirm, {
  message: 'As senhas não coincidem',
  path: ['dsSenhaConfirm'],
}).refine(d => d.aceiteLembretes === true, {
  message: 'É necessário aceitar os lembretes de vacina e consulta para continuar',
  path: ['aceiteLembretes'],
});

export type LoginFormData    = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
