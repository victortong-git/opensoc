// Investigation workflow types for structured threat hunting procedures
export interface InvestigationPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedDuration: string;
  procedures: InvestigationProcedure[];
}

export interface InvestigationProcedure {
  id: string;
  title: string;
  description: string;
  type: 'collection' | 'analysis' | 'validation' | 'documentation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredTools: string[];
  expectedOutputs: string[];
  dependencies: string[];
  timeEstimate: string;
  steps: ProcedureStep[];
  validationCriteria: string[];
  deliverables: string[];
}

export interface ProcedureStep {
  id: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
  toolsUsed: string[];
  notes?: string;
  completed: boolean;
}

export interface InvestigationWorkflow {
  id: string;
  name: string;
  description: string;
  huntType: string;
  phases: InvestigationPhase[];
  totalEstimatedDuration: string;
  createdAt: string;
  updatedAt: string;
}