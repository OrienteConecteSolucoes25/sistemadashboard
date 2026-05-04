// STUB do Robozinho IA. A edge function `robozinho-edit` não foi portada.
// Esta versão preserva a API mas sempre retorna patch vazio com mensagem de "não disponível".
// Para reativar, criar a edge function e substituir as chamadas abaixo.

export interface RobozinhoField {
  key: string; label?: string; type?: "text"|"number"|"date"|"boolean"|"enum"; enum?: string[];
}

export interface RobozinhoResponse {
  patch: Record<string, unknown>;
  explanation: string;
  plano?: Record<string, unknown> | null;
  model?: string;
  error?: string;
}

export async function askRobozinho(_args: {
  entidade: string; entidadeId?: string;
  registroAtual: Record<string, unknown>;
  prompt: string; schema: RobozinhoField[];
  modo?: "dados" | "estrutura";
}): Promise<RobozinhoResponse> {
  return {
    patch: {},
    explanation: "Robozinho IA ainda não disponível neste ambiente. Configure a edge function 'robozinho-edit' para ativar.",
  };
}

export async function logRobozinhoAplicado(_args: {
  entidade: string; entidadeId?: string;
  registroAtual: Record<string, unknown>;
  prompt: string; schema: RobozinhoField[];
  patchAplicado: Record<string, unknown>;
  modo?: "dados" | "estrutura";
}): Promise<void> {
  // no-op
}
