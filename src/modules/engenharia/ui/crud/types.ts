export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "boolean";

export type FieldSchema = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  /** show in table list (default true if not set) */
  inList?: boolean;
  /** width hint for form (full row) */
  full?: boolean;
  placeholder?: string;
};

export type CrudConfig = {
  table: string;
  title: string;
  description?: string;
  fields: FieldSchema[];
  /** keys used in search filter */
  searchKeys?: string[];
  /** order column (default created_at desc) */
  orderBy?: { column: string; ascending?: boolean };
};
