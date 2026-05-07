-- Permite leitura pública (autenticada) das preferências globais de gráfico (company_id IS NULL)
-- e mantém políticas existentes para preferências por empresa.
DROP POLICY IF EXISTS "ccp_select" ON public.company_chart_preferences;
CREATE POLICY "ccp_select" ON public.company_chart_preferences
FOR SELECT
USING (
  company_id IS NULL
  OR public.theme_can(auth.uid(), company_id, 'view'::text)
);

-- Apenas admin global pode escrever em preferências globais (company_id IS NULL).
DROP POLICY IF EXISTS "ccp_write" ON public.company_chart_preferences;
CREATE POLICY "ccp_write" ON public.company_chart_preferences
FOR ALL
USING (
  (company_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  OR public.theme_can(auth.uid(), company_id, 'manage_charts'::text)
  OR public.theme_can(auth.uid(), company_id, 'manage'::text)
)
WITH CHECK (
  (company_id IS NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  OR public.theme_can(auth.uid(), company_id, 'manage_charts'::text)
  OR public.theme_can(auth.uid(), company_id, 'manage'::text)
);