
INSERT INTO public.acl_permissions_catalog (key, module, resource, action, label, description, ordem) VALUES
  ('visao_geral.acessar',   'visao_geral',   'modulo', 'acessar', 'Visão Geral — Acessar',   'Acessa a página de visão geral', 50),
  ('pixel_office.acessar',  'pixel_office',  'modulo', 'acessar', 'Soluções-Verso — Acessar','Acessa o escritório virtual', 60),
  ('jarbas.acessar',        'jarbas',        'modulo', 'acessar', 'Jarbas — Acessar',        'Acessa o assistente Jarbas', 70),
  ('ti.acessar',            'ti',            'modulo', 'acessar', 'TI & Suporte — Acessar',  'Acessa o módulo de TI e suporte', 80),
  ('compliance.acessar',    'compliance',    'modulo', 'acessar', 'Compliance — Acessar',    'Acessa o módulo de Compliance', 90)
ON CONFLICT (key) DO NOTHING;
