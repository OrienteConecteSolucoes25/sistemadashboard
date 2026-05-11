-- Flag por empresa: exibir ou ocultar a marca "ERP OCS / Oriente Conecte Soluções".
-- Quando false, a UI mostra "Sistema dashboard" no lugar.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS show_ocs_brand boolean NOT NULL DEFAULT true;

-- Por padrão, ocultar marca para a empresa "Nova Corrente"
UPDATE public.companies SET show_ocs_brand = false WHERE nome = 'Nova Corrente';