interface SearchResult {
  id: string;
  entityType: string;
  title: string;
  description: string;
  status?: string;
  severity?: number;
  type?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  searchMeta?: {
    entityType: string;
    searchType: string;
    relevanceScore: number;
    combinedScore?: number;
    keywordScore?: number;
    vectorScore?: number;
    distance?: number;
  };
  // For quick search responses
  relevanceScore?: number;
  // Entity-specific fields
  sourceSystem?: string;
  assetName?: string;
  asset?: { name: string; type: string };
  assignedUser?: { firstName: string; lastName: string };
  primaryAsset?: { name: string; type: string };
  ipAddress?: string;
  hostname?: string;
  tags?: string[];
  confidence?: number;
  creator?: { firstName: string; lastName: string };
}

interface SearchResponse {
  success: boolean;
  data: {
    results: Record<string, {
      items: SearchResult[];
      count: number;
      hasMore: boolean;
    }>;
    query: string;
    searchType: string;
    entities: string[];
    totalItems: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface QuickSearchResponse {
  success: boolean;
  data: {
    results: Record<string, SearchResult[]>;
    query: string;
    searchType: string;
    totalItems: number;
    hasMore: boolean;
  };
}

interface SearchSuggestion {
  text: string;
  entityType: string;
  field: string;
}

interface SuggestionsResponse {
  success: boolean;
  data: {
    suggestions: SearchSuggestion[];
  };
}

interface SearchOptions {
  query: string;
  searchType?: 'keyword' | 'vector' | 'hybrid';
  entities?: string[];
  limit?: number;
  offset?: number;
}

class SearchService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Perform a full search across all entities
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    return this.makeRequest<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Perform a quick search for navbar dropdown
   */
  async quickSearch(
    query: string,
    searchType: 'keyword' | 'vector' | 'hybrid' = 'hybrid',
    limit: number = 5
  ): Promise<QuickSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      type: searchType,
      limit: limit.toString(),
    });

    return this.makeRequest<QuickSearchResponse>(`/search/quick?${params.toString()}`);
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string, limit: number = 5): Promise<SuggestionsResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    return this.makeRequest<SuggestionsResponse>(`/search/suggestions?${params.toString()}`);
  }

  /**
   * Format entity type display name
   */
  getEntityDisplayName(entityType: string): string {
    switch (entityType) {
      case 'alerts':
        return 'Alerts';
      case 'incidents':
        return 'Incidents';
      case 'assets':
        return 'Assets';
      case 'iocs':
        return 'Threat Intelligence';
      case 'playbooks':
        return 'Playbooks';
      default:
        return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    }
  }

  /**
   * Get icon class for entity type
   */
  getEntityIcon(entityType: string): string {
    switch (entityType) {
      case 'alerts':
        return 'AlertTriangle';
      case 'incidents':
        return 'Shield';
      case 'assets':
        return 'Server';
      case 'iocs':
        return 'Eye';
      case 'playbooks':
        return 'BookOpen';
      default:
        return 'FileText';
    }
  }

  /**
   * Get route path for entity
   */
  getEntityRoute(entityType: string, id: string): string {
    switch (entityType) {
      case 'alerts':
        return `/alerts/${id}`;
      case 'incidents':
        return `/incidents/${id}`;
      case 'assets':
        return `/assets/${id}`;
      case 'iocs':
        return `/threat-intel/iocs/${id}`;
      case 'playbooks':
        return `/playbooks/${id}`;
      default:
        return `/${entityType}/${id}`;
    }
  }

  /**
   * Format search relevance score as percentage
   */
  formatRelevanceScore(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  /**
   * Get severity color class
   */
  getSeverityColor(severity?: number): string {
    if (!severity) return 'text-slate-500';
    
    switch (severity) {
      case 5:
        return 'text-red-500';
      case 4:
        return 'text-orange-500';
      case 3:
        return 'text-yellow-500';
      case 2:
        return 'text-blue-500';
      case 1:
        return 'text-green-500';
      default:
        return 'text-slate-500';
    }
  }

  /**
   * Get status color class
   */
  getStatusColor(status?: string): string {
    if (!status) return 'text-slate-500';
    
    switch (status.toLowerCase()) {
      case 'new':
      case 'open':
        return 'text-blue-500';
      case 'investigating':
      case 'in_progress':
        return 'text-yellow-500';
      case 'resolved':
      case 'closed':
        return 'text-green-500';
      case 'false_positive':
        return 'text-slate-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  }
}

export default new SearchService();
export type { SearchResult, SearchResponse, QuickSearchResponse, SearchSuggestion, SearchOptions };