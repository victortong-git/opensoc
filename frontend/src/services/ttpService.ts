import api from './api';

export interface MitreTactic {
  id: string;
  mitreId: string;
  name: string;
  description: string;
  shortDescription?: string;
  url?: string;
  order: number;
  isActive: boolean;
  version?: string;
  lastUpdated?: string;
  aliases: string[];
  platforms: string[];
  dataSource: string;
  organizationId?: string;
  isTestData: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  techniques?: MitreTechnique[];
}

export interface MitreTechnique {
  id: string;
  mitreId: string;
  name: string;
  description: string;
  shortDescription?: string;
  tacticId: string;
  parentTechniqueId?: string;
  isSubTechnique: boolean;
  url?: string;
  killChainPhases: string[];
  platforms: string[];
  dataSources: string[];
  defenses: string[];
  permissions: string[];
  impactType: string[];
  networkRequirements: string[];
  remoteSupport: boolean;
  systemRequirements: string[];
  isActive: boolean;
  version?: string;
  lastUpdated?: string;
  aliases: string[];
  dataSource: string;
  organizationId?: string;
  isTestData: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  tactic?: MitreTactic;
  parentTechnique?: MitreTechnique;
  subTechniques?: MitreTechnique[];
  procedures?: MitreProcedure[];
}

export interface MitreProcedure {
  id: string;
  mitreId?: string;
  name: string;
  description: string;
  shortDescription?: string;
  techniqueId: string;
  threatActorId?: string;
  malwareFamily?: string;
  toolName?: string;
  platforms: string[];
  procedureSteps: any;
  commandsUsed: string[];
  artifactsCreated: string[];
  networkIndicators: string[];
  detectiveControls: string[];
  preventiveControls: string[];
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: number;
  complexity: 'low' | 'medium' | 'high';
  privileges: string[];
  dataSource: string;
  source?: string;
  url?: string;
  firstObserved?: string;
  lastObserved?: string;
  isActive: boolean;
  organizationId?: string;
  isTestData: boolean;
  tags: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  technique?: MitreTechnique;
  threatActor?: {
    id: string;
    name: string;
    aliases: string[];
  };
}

export interface TTProvides {
  overview: {
    totalTactics: number;
    totalTechniques: number;
    totalProcedures: number;
    customTactics: number;
    customTechniques: number;
    customProcedures: number;
  };
  platformDistribution: {
    platforms: string[];
    count: string;
  }[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  tacticId?: string;
  techniqueId?: string;
  threatActorId?: string;
  malwareFamily?: string;
  confidence?: string;
  severity?: string;
  complexity?: string;
  isActive?: string;
  dataSource?: string;
  platforms?: string;
  includeCustom?: string;
  isSubTechnique?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class TTProviderService {
  // MITRE TACTICS METHODS

  // Get all MITRE tactics
  async getMitreTactics(params: {
    search?: string;
    isActive?: string;
    dataSource?: string;
    includeCustom?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<MitreTactic[]>> {
    const response = await api.get('/ttp/tactics', { params });
    return response.data;
  }

  // Get single MITRE tactic by ID
  async getMitreTacticById(id: string): Promise<ApiResponse<MitreTactic>> {
    const response = await api.get(`/ttp/tactics/${id}`);
    return response.data;
  }

  // Create custom MITRE tactic
  async createMitreTactic(tacticData: Partial<MitreTactic>): Promise<ApiResponse<MitreTactic>> {
    const response = await api.post('/ttp/tactics', tacticData);
    return response.data;
  }

  // MITRE TECHNIQUES METHODS

  // Get all MITRE techniques with pagination
  async getMitreTechniques(params: PaginationParams = {}): Promise<PaginatedResponse<MitreTechnique>> {
    const response = await api.get('/ttp/techniques', { params });
    return response.data;
  }

  // Get single MITRE technique by ID
  async getMitreTechniqueById(id: string): Promise<ApiResponse<MitreTechnique>> {
    const response = await api.get(`/ttp/techniques/${id}`);
    return response.data;
  }

  // Create custom MITRE technique
  async createMitreTechnique(techniqueData: Partial<MitreTechnique>): Promise<ApiResponse<MitreTechnique>> {
    const response = await api.post('/ttp/techniques', techniqueData);
    return response.data;
  }

  // MITRE PROCEDURES METHODS

  // Get all MITRE procedures with pagination
  async getMitreProcedures(params: PaginationParams = {}): Promise<PaginatedResponse<MitreProcedure>> {
    const response = await api.get('/ttp/procedures', { params });
    return response.data;
  }

  // Get single MITRE procedure by ID
  async getMitreProcedureById(id: string): Promise<ApiResponse<MitreProcedure>> {
    const response = await api.get(`/ttp/procedures/${id}`);
    return response.data;
  }

  // Create MITRE procedure
  async createMitreProcedure(procedureData: Partial<MitreProcedure>): Promise<ApiResponse<MitreProcedure>> {
    const response = await api.post('/ttp/procedures', procedureData);
    return response.data;
  }

  // Update MITRE procedure
  async updateMitreProcedure(id: string, procedureData: Partial<MitreProcedure>): Promise<ApiResponse<MitreProcedure>> {
    const response = await api.put(`/ttp/procedures/${id}`, procedureData);
    return response.data;
  }

  // Delete MITRE procedure
  async deleteMitreProcedure(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/ttp/procedures/${id}`);
    return response.data;
  }

  // Get TTP statistics
  async getTTPStats(): Promise<ApiResponse<TTProvides>> {
    const response = await api.get('/ttp/stats');
    return response.data;
  }

  // Utility methods for getting structured MITRE ATT&CK data

  // Get complete MITRE ATT&CK framework structure
  async getMitreFramework(): Promise<ApiResponse<MitreTactic[]>> {
    const response = await api.get('/ttp/tactics', { 
      params: { 
        includeCustom: 'true',
        sortBy: 'order',
        sortOrder: 'asc'
      } 
    });
    return response.data;
  }

  // Get techniques for a specific tactic
  async getTechniquesByTactic(tacticId: string): Promise<ApiResponse<MitreTechnique[]>> {
    const response = await api.get('/ttp/techniques', { 
      params: { 
        tacticId,
        limit: 1000,
        sortBy: 'mitreId',
        sortOrder: 'asc'
      } 
    });
    return { success: true, data: response.data.data };
  }

  // Get procedures for a specific technique
  async getProceduresByTechnique(techniqueId: string): Promise<ApiResponse<MitreProcedure[]>> {
    const response = await api.get('/ttp/procedures', { 
      params: { 
        techniqueId,
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      } 
    });
    return { success: true, data: response.data.data };
  }

  // Search across all TTP data
  async searchTTP(searchTerm: string): Promise<{
    tactics: MitreTactic[];
    techniques: MitreTechnique[];
    procedures: MitreProcedure[];
  }> {
    const [tacticsResponse, techniquesResponse, proceduresResponse] = await Promise.all([
      api.get('/ttp/tactics', { params: { search: searchTerm, limit: 10 } }),
      api.get('/ttp/techniques', { params: { search: searchTerm, limit: 20 } }),
      api.get('/ttp/procedures', { params: { search: searchTerm, limit: 20 } }),
    ]);

    return {
      tactics: tacticsResponse.data.data,
      techniques: techniquesResponse.data.data,
      procedures: proceduresResponse.data.data,
    };
  }
}

export default new TTProviderService();