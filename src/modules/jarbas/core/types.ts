export type JarbasModule = 
  | "engineering" 
  | "finance" 
  | "hr" 
  | "legal" 
  | "ti" 
  | "projects" 
  | "os" 
  | "crea" 
  | "communication"
  | "marketplace"
  | "ocs_guard";

export type Severity = "low" | "medium" | "high" | "critical";

export interface JarbasEvent {
  id: string;
  module: JarbasModule;
  type: string;
  title: string;
  description: string;
  severity: Severity;
  timestamp: string;
  metadata?: any;
}

export interface JarbasInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  module: JarbasModule;
  confidence: number;
}

export interface JarbasAlert {
  id: string;
  module: JarbasModule;
  message: string;
  severity: Severity;
  actionRequired: boolean;
  status: "pending" | "resolved" | "ignored";
}
