export interface AppTask {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'database' | 'ui' | 'logic' | 'feature';
  status: 'todo' | 'in-progress' | 'done';
  morsels: string[]; // Small actionable steps
}

export interface Artifact {
  title: string;
  file: string;
  code: string;
  language: string;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface DataColumn {
  name: string;
  type: string;
  description: string;
  isPrimary?: boolean;
  isNotNull?: boolean;
  default?: string;
}

export interface DataModel {
  name: string;
  description: string;
  columns: DataColumn[];
}

export interface AppPlan {
  name: string;
  tagline: string;
  description: string;
  tasks: AppTask[];
  schema: DataModel[];
  screens: {
    name: string;
    path: string;
    description: string;
    components: string[];
  }[];
  architecture: string;
  artifacts: Artifact[];
  style?: 'minimal' | 'brutalist' | 'modern' | 'glassmorphism';
  dependencies?: string[];
}
