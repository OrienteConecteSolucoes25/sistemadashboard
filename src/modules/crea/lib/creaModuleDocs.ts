/** Documentação estruturada do módulo CREA — alimenta o assistente de IA. */
export const CREA_MODULE_DOCS = `
MÓDULO CREA & ART — VISÃO GERAL

Este módulo do ERP OCS centraliza toda a documentação técnica junto aos CREAs (Conselhos Regionais de Engenharia e Agronomia) e ao Confea.

SUB-ABAS PRINCIPAIS:

1. Dashboard — KPIs do módulo: total de ARTs, protocolos abertos, certidões vencendo (30 dias), CATs solicitadas/emitidas, baixas pendentes, prazos críticos.

2. ARTs (Anotação de Responsabilidade Técnica) — Cadastro de ARTs por número, UF, contratante, contratado, escopo, status. Status possíveis: nao_iniciada, em_emissao, emitida, paga, registrada, baixada, cancelada. Datas operacionais (rascunho, envio para validação, validada, emissão, pagamento, baixa) são preenchidas em uma aba lateral ao clicar no número da ART.

3. Protocolos — Solicitações abertas junto a um CREA (registro, visto, baixa, recurso, alteração cadastral). Status: aberto, em_exigencia, deferido, indeferido, arquivado.

4. CATs (Certidão de Acervo Técnico) — Tipos: com/sem registro de atestado, em andamento, concluída.

5. Certidões — Tipos diversos (registro, regularidade, negativa, acervo, RT, especial). Possuem validade que dispara alerta no Dashboard.

6. Baixas — Baixa de ART, RT, vínculo, por conclusão, substituição ou encerramento contratual.

7. Tratativas — Histórico de comunicação com CREA, engenheiros e empresas. Canais: e-mail, telefone, WhatsApp, portal, presencial.

8. Prazos — Centraliza todos os prazos críticos do módulo (emissão de CAT, baixa, exigência, recurso, validade de certidão).

9. Responsáveis Técnicos (RTs) — Cadastro de RTs vinculados às empresas com setor, modalidade, datas de início/fim de vínculo.

10. Engenheiros — Cadastro geral de engenheiros (nome, CREA, UF, modalidade, título).

11. Empresas e CREAs — Vínculo empresa × CREA por UF (registro, visto, validade).

12. Documentações — Documentos exigidos por escopo/UF (modelos, validade, obrigatoriedade).

13. Normas e Regras — Base de DN, PL, resoluções do Confea/CREA. Alimenta o Assistente de IA.

14. Links Oficiais — Portais de cada UF com URLs principais e de serviços.

15. Credenciais — Logins/senhas dos portais CREA. Senhas cifradas (AES) com chave-mestra. Revelação exige motivo e fica auditada (auto-hide 30s).

16. Auditoria — Log dedicado de criação, edição, exclusão, importação, exportação, revelação de senha.

17. Assistente IA — Responde sobre o próprio módulo (esta documentação) e sobre normas cadastradas em "Normas e Regras". Cita fontes [n] e nunca inventa norma.

18. Admin — Gerenciamento de papéis (crea_admin, crea_analista, crea_responsavel_tecnico, crea_auditor, crea_visualizador), permissões, chave-mestra e flags de integrações.

PADRÕES OPERACIONAIS:

- Toda exclusão é SOFT DELETE com motivo, registrada na auditoria.
- Importação/exportação adaptativa: colunas desconhecidas são preservadas em um campo JSONB "data" e reaparecem na exportação.
- Anexos: qualquer formulário aceita anexar documentos (bucket "crea-attachments" privado).

FLAGS DE INTEGRAÇÃO (todas DESLIGADAS por padrão):
scraping, rpa_portais, assinatura_digital, confea_api_oficial, ia_externa_paga, revelar_senha_sem_motivo. Ativações exigem migration manual e ficam visíveis no Admin.
`;
