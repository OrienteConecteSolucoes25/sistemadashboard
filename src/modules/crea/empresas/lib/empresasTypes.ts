export const UFS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export type Empresa = {
  id: string;
  company_id: string;
  nome_fantasia: string;
  razao_social: string | null;
  endereco_completo: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  cnpj: string | null;
  created_at: string;
  updated_at: string;
};

export const PLANILHA_HEADERS_EMPRESA = [
  "Nome fantasia",
  "Nome/Razão Social",
  "Endereço Completo",
  "Cidade",
  "UF",
  "CEP",
  "CNPJ",
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_");

const HEADER_TO_FIELD: Record<string, keyof Empresa | null> = {
  nome_fantasia: "nome_fantasia",
  fantasia: "nome_fantasia",
  "nome/razao_social": "razao_social",
  razao_social: "razao_social",
  razao: "razao_social",
  endereco_completo: "endereco_completo",
  endereco: "endereco_completo",
  cidade: "cidade",
  municipio: "cidade",
  uf: "uf",
  estado: "uf",
  cep: "cep",
  cnpj: "cnpj",
};

export function headerToField(h: string): keyof Empresa | null {
  return HEADER_TO_FIELD[norm(String(h ?? "").replace(/\.$/, ""))] ?? null;
}

export const maskCnpj = (v: string | null | undefined) => {
  const d = String(v ?? "").replace(/\D/g, "").slice(0, 14);
  if (!d) return "";
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const maskCep = (v: string | null | undefined) => {
  const d = String(v ?? "").replace(/\D/g, "").slice(0, 8);
  if (!d) return "";
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
};
