# Arquivos para Remover

## Documentação Duplicada/Obsoleta

Mantendo apenas:
- README.md
- docs/ARCHITECTURE.md
- docs/FLUXO_COMPLETO_MENSAGENS.md
- docs/CORRECOES_FINAIS.md
- docs/RESUMO_FINAL.md
- docs/CONFIGURACAO_WEBHOOKS_COMPLETA.md

Removendo (duplicados/obsoletos):
- docs/ANALISE_RESULTADOS_SCRIPTS.md
- docs/ARQUITETURA_INTEGRACAO_COMPLETA.md
- docs/ATUALIZACAO_NEXT_15.md
- docs/CHAT_OMNICHANNEL_IMPLEMENTACAO.md
- docs/CHECKLIST_RESPOSTAS.md
- docs/CONFIGURACAO_WEBHOOK_TELEGRAM.md
- docs/CONFIGURAR_AUTENTICACAO_N8N_HEADER_AUTH.md
- docs/CONFIGURAR_N8N_SECRET.md
- docs/CONFIGURAR_SECRET_WEBHOOK_N8N.md
- docs/CONFIGURAR_WEBHOOK_SEU_WORKFLOW.md
- docs/CORRECAO_ERRO_403_N8N.md
- docs/CORRECAO_FLUXO_TELEGRAM.md
- docs/CORRECAO_MENSAGENS_TELEGRAM_NAO_APARECEM.md
- docs/CORRIGIR_ENVIO_N8N.md
- docs/CORRIGIR_MENSAGENS_NAO_APARECEM.md
- docs/CORRIGIR_MENSAGENS_USUARIO.md
- docs/CORRIGIR_SECRET_N8N_403.md
- docs/CORRIGIR_SECRET_N8N.md
- docs/CORRIGIR_WEBHOOK_TELEGRAM_NAO_CHAMADO.md
- docs/CORRIGIR_WEBHOOK_TELEGRAM.md
- docs/CRIAR_BUCKET_FILES.md
- docs/DARK_MODE_IMPLEMENTATION.md
- docs/DIAGNOSTICAR_ENVIO_N8N.md
- docs/DIAGNOSTICAR_MENSAGENS_NAO_SALVAS.md
- docs/DIAGNOSTICO_MENSAGENS_TELEGRAM.md
- docs/ENVIO_EMAIL_CONVITES.md
- docs/FIX_RLS_RECURSION.md
- docs/FLUXOS_N8N_CHAT_OMNICHANNEL.md
- docs/GUIA_COMPLETO_INTEGRACAO_N8N.md
- docs/GUIA_RAPIDO_N8N_AUTENTICACAO.md
- docs/INFORMACOES_EXTRAIDAS_AUTOMATICAMENTE.md
- docs/INTEGRACAO_N8N_SELFHOSTED.md
- docs/INTEGRACAO_N8N.md
- docs/PASSO_A_PASSO_INTEGRACAO_N8N.md
- docs/PENDENCIAS_CHAT_OMNICHANNEL.md
- docs/PROBLEMA_RESOLVIDO_WEBHOOK_TELEGRAM.md
- docs/PROXIMOS_PASSOS_IMPLEMENTADOS.md
- docs/RESUMO_ATUALIZACAO_NEXT_15.md
- docs/RESUMO_CONFIGURACAO_WEBHOOKS.md
- docs/RESUMO_CORRECAO_TELEGRAM.md
- docs/RESUMO_IMPLEMENTACAO_NOTIFICACOES.md
- docs/RESUMO_PROBLEMA_MENSAGENS_TELEGRAM.md
- docs/RESUMO_SOLUCAO_MENSAGENS_INBOUND.md
- docs/REVISAO_COMPLETA_FLUXO_MENSAGENS.md
- docs/REVISAO_COMPLETA_MENSAGENS_INBOUND.md
- docs/SISTEMA_NOTIFICACOES.md
- docs/SOLUCAO_DEFINITIVA_ENVIO_N8N.md
- docs/SOLUCAO_DEFINITIVA_N8N.md
- docs/SOLUCAO_FINAL_403_N8N.md
- docs/SOLUCAO_FINAL_SECRET_403.md
- docs/SOLUCAO_FINAL_SECRET_N8N_HEADER.md
- docs/SOLUCAO_FINAL_SECRET_N8N.md
- docs/SOLUCAO_MENSAGENS_INBOUND_NAO_APARECEM.md
- docs/SOLUCAO_MENSAGENS_NAO_SALVAS.md
- docs/SOLUCAO_URGENTE_HEADER_AUTH.md
- docs/TESTAR_INTEGRACAO_N8N.md
- docs/TESTE_WEBHOOK_TELEGRAM.md
- docs/VALIDACAO_FLUXO_TELEGRAM.md

## Scripts SQL Temporários

Mantendo apenas:
- supabase/schema.sql
- supabase/migrations/*.sql
- supabase/configurar-automacoes-final.sql
- supabase/verificar-e-corrigir-automacoes.sql
- supabase/testar-mensagens-conversa.sql

Removendo (temporários/já executados):
- supabase/add-calendar-events-table.sql
- supabase/add-custom-fields-table.sql
- supabase/add-n8n-secret-to-webhook.sql
- supabase/add-pipelines-table.sql
- supabase/atualizar-automacao-com-secret-url.sql
- supabase/check-automations.sql
- supabase/check-inbound-messages.sql
- supabase/cleanup-test-data.sql
- supabase/corrigir-automacao-secret.sql
- supabase/corrigir-company-id-mensagens-inbound.sql
- supabase/corrigir-rls-messages-para-leitura.sql
- supabase/corrigir-sql-automacao.sql
- supabase/corrigir-visibilidade-mensagens.sql
- supabase/create-automation-example.sql
- supabase/create-files-bucket-policies-only.sql
- supabase/create-files-bucket-simple.sql
- supabase/create-files-bucket.sql
- supabase/desabilitar-auto-disable-ia.sql
- supabase/diagnose-n8n-integration.sql
- supabase/diagnose-webhook-issues.sql
- supabase/diagnosticar-mensagens-inbound-nao-aparecem.sql
- supabase/diagnosticar-mensagens-nao-aparecem.sql
- supabase/diagnosticar-mensagens-telegram.sql
- supabase/fix-audit-logs-rls.sql
- supabase/fix-companies-rls-for-webhooks.sql
- supabase/fix-companies-rls-v2.sql
- supabase/fix-companies-rls.sql
- supabase/fix-message-directions.sql
- supabase/fix-messages-rls-for-service-role.sql
- supabase/fix-rls-recursion.sql
- supabase/fix-user-profiles-rls.sql
- supabase/garantir-mensagem-salva-antes-n8n.sql
- supabase/make-company-id-optional.sql
- supabase/remover-secret-url-agora.sql
- supabase/remover-secret-url-usar-header-auth.sql
- supabase/solucao-mensagens-inbound-nao-aparecem.sql
- supabase/testar-visibilidade-mensagens.sql
- supabase/verificar-automacoes-ativas.sql
- supabase/verificar-mensagens-inbound-recentes.sql
- supabase/verificar-mensagens-nao-aparecem.sql
- supabase/verificar-mensagens-usuario.sql
- supabase/verificar-rls-messages.sql
- supabase/verificar-rls-policies-messages.sql
- supabase/verificar-secret-correto.sql
- supabase/verificar-webhook-telegram-chamado.sql
- supabase/verificar-webhook-telegram-configurado.sql
- supabase/verify-telegram-settings.sql

## Scripts TypeScript

Mantendo:
- scripts/configurar-webhooks-completo.ts
- scripts/corrigir-automacoes-automatico.ts
- scripts/testar-fluxo-completo.ts

Removendo (duplicados/obsoletos):
- scripts/debug-mensagens.ts
- scripts/reconfigure-webhooks.ts
- scripts/test-telegram-flow.ts
- scripts/update-next.sh
- scripts/verificar-webhook-telegram.sh
- scripts/verify-setup.ts

