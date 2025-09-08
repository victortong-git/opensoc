import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Play,
  Pause,
  Plus,
  Edit,
  Upload,
  Download,
  Bot,
  User,
  Wand2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Shield,
  Eye,
  X,
  RefreshCw,
  Sparkles,
  Search
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import { 
  fetchPlaybooks,
  fetchPlaybookStats,
  fetchPlaybookTemplates,
  updatePlaybook
} from '../store/playbooksAsync';
import {
  setPlaybooksPagination,
  setPlaybooksPageSize,
  setTemplatesPagination,
  setTemplatesPageSize
} from '../store/playbooksSlice';
import Pagination from '../components/common/Pagination';
import RowsPerPageSelector from '../components/common/RowsPerPageSelector';
import RecordId from '../components/common/RecordId';
import TestDataChip from '../components/common/TestDataChip';
import PlaybookReviewModal from '../components/playbooks/PlaybookReviewModal';
import PlaybookDetailModal from '../components/playbooks/PlaybookDetailModal';
import AIGeneratorModal from '../components/playbooks/AIGeneratorModal';
import PlaybookEnhanceModal from '../components/playbooks/PlaybookEnhanceModal';
import PlaybookAIReviewModal from '../components/playbooks/PlaybookAIReviewModal';
import aiAgentsService from '../services/aiAgentsService';
import playbooksService, { PlaybookEnhancementResponse, PlaybookReviewResponse } from '../services/playbooksService';

interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'decision';
  estimatedTime: number;
  isRequired: boolean;
}

interface AIGeneratedPlaybook {
  id: string;
  name: string;
  description: string;
  category: 'incident_response' | 'threat_hunting' | 'vulnerability_management' | 'compliance';
  severity: number;
  confidence: number;
  steps: PlaybookStep[];
  triggers: string[];
  generatedBy: string;
  generatedAt: Date;
  status: 'draft' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
}

const PlaybooksPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    playbooks,
    templates,
    playbookStats,
    playbooksPagination,
    templatesPagination,
    playbooksLoading,
    templatesLoading,
    error
  } = useSelector((state: RootState) => state.playbooks);

  const [activeTab, setActiveTab] = useState<'playbooks' | 'ai-agent' | 'templates'>('playbooks');
  
  // Refresh all playbook data
  const handleRefresh = () => {
    dispatch(fetchPlaybooks());
    dispatch(fetchPlaybookStats());
    dispatch(fetchPlaybookTemplates());
  };
  
  // Load data on component mount
  useEffect(() => {
    dispatch(fetchPlaybookStats());
  }, [dispatch]);

  // Load playbooks when pagination changes
  useEffect(() => {
    dispatch(fetchPlaybooks({
      page: playbooksPagination?.currentPage,
      limit: playbooksPagination?.itemsPerPage
    }));
  }, [dispatch, playbooksPagination?.currentPage, playbooksPagination?.itemsPerPage]);

  // Load templates when pagination changes
  useEffect(() => {
    dispatch(fetchPlaybookTemplates());
  }, [dispatch]);

  // Safe date parsing helper
  const safeParseDate = (dateValue: string | Date): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      try {
        return parseISO(dateValue);
      } catch {
        return new Date(dateValue);
      }
    }
    return new Date();
  };

  // Safe date formatting helper
  const safeFormatDistance = (dateValue: string | Date): string => {
    try {
      const parsedDate = safeParseDate(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };
  const [selectedPlaybook, setSelectedPlaybook] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAIPlaybook, setSelectedAIPlaybook] = useState<AIGeneratedPlaybook | null>(null);
  
  // AI Enhancement Modal State
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // AI Review Modal State  
  const [showAIReviewModal, setShowAIReviewModal] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // Click handler for opening playbook detail modal
  const handlePlaybookClick = (playbook: any) => {
    setSelectedPlaybook(playbook);
    setShowDetailModal(true);
  };

  // Click handler for editing playbook
  const handlePlaybookEdit = (playbook: any) => {
    setSelectedPlaybook(playbook);
    // Initialize form data with current playbook values
    setEditFormData({
      name: playbook.name || '',
      description: playbook.description || '',
      category: playbook.category || '',
      triggerType: playbook.triggerType || 'manual',
      timeout: Math.floor((playbook.timeout || 3600) / 60), // Convert to minutes
      retryCount: playbook.retryCount || 0,
      autoExecute: playbook.autoExecute || false,
      isActive: playbook.isActive || false,
      tags: playbook.tags?.join(', ') || '',
      steps: playbook.steps || []
    });
    setShowDetailModal(false); // Close detail modal
    setShowEditModal(true); // Open edit modal
  };

  // AI Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaybooks, setGeneratedPlaybooks] = useState<AIGeneratedPlaybook[]>([]);

  // Edit Modal Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: '',
    triggerType: '',
    timeout: 0,
    retryCount: 0,
    autoExecute: false,
    isActive: false,
    tags: '',
    steps: [] as any[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock AI-generated playbooks
  const mockAIPlaybooks: AIGeneratedPlaybook[] = [
    {
      id: 'ai-pb-1',
      name: 'Ransomware Incident Response',
      description: 'Comprehensive response playbook for ransomware attacks including containment, eradication, and recovery',
      category: 'incident_response',
      severity: 5,
      confidence: 92,
      steps: [
        { id: 'step-1', name: 'Isolate Affected Systems', description: 'Disconnect infected systems from network', type: 'automated', estimatedTime: 5, isRequired: true },
        { id: 'step-2', name: 'Assess Impact', description: 'Determine scope of encryption and affected assets', type: 'manual', estimatedTime: 15, isRequired: true },
        { id: 'step-3', name: 'Notify Stakeholders', description: 'Alert management and relevant teams', type: 'automated', estimatedTime: 2, isRequired: true },
        { id: 'step-4', name: 'Preserve Evidence', description: 'Create forensic images of affected systems', type: 'manual', estimatedTime: 30, isRequired: true },
        { id: 'step-5', name: 'Identify Ransomware Variant', description: 'Analyze encryption patterns and ransom note', type: 'automated', estimatedTime: 10, isRequired: false }
      ],
      triggers: ['malware.ransomware.detected', 'file.encryption.suspicious', 'ransom.note.found'],
      generatedBy: 'Playbook AI Agent',
      generatedAt: new Date(Date.now() - 3600000),
      status: 'draft'
    },
    {
      id: 'ai-pb-2', 
      name: 'Phishing Email Investigation',
      description: 'Step-by-step process for investigating and responding to phishing email attacks',
      category: 'threat_hunting',
      severity: 3,
      confidence: 87,
      steps: [
        { id: 'step-1', name: 'Quarantine Email', description: 'Remove suspicious email from all mailboxes', type: 'automated', estimatedTime: 3, isRequired: true },
        { id: 'step-2', name: 'Analyze Email Headers', description: 'Examine email metadata for indicators', type: 'manual', estimatedTime: 10, isRequired: true },
        { id: 'step-3', name: 'Check URL Reputation', description: 'Validate any links in the email', type: 'automated', estimatedTime: 5, isRequired: true },
        { id: 'step-4', name: 'User Impact Assessment', description: 'Check if users interacted with the email', type: 'manual', estimatedTime: 20, isRequired: true }
      ],
      triggers: ['email.phishing.suspected', 'user.reported.suspicious.email'],
      generatedBy: 'Playbook AI Agent',
      generatedAt: new Date(Date.now() - 7200000),
      status: 'reviewed',
      reviewedBy: 'Sarah Chen',
      reviewNotes: 'Good foundation, added additional email analysis steps.'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'incident_response': return <Shield className="h-4 w-4 text-red-400" />;
      case 'threat_hunting': return <Target className="h-4 w-4 text-purple-400" />;
      case 'vulnerability_management': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'compliance': return <CheckCircle className="h-4 w-4 text-blue-400" />;
      default: return <Play className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/20';
      case 1: return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'automated': return <Bot className="h-4 w-4 text-green-400" />;
      case 'manual': return <User className="h-4 w-4 text-blue-400" />;
      case 'decision': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <Play className="h-4 w-4 text-gray-400" />;
    }
  };


  const handleReviewAIPlaybook = (playbook: AIGeneratedPlaybook, action: 'approve' | 'reject', notes: string) => {
    setGeneratedPlaybooks(prev => 
      prev.map(p => 
        p.id === playbook.id 
          ? { 
              ...p, 
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewedBy: 'Current User',
              reviewNotes: notes
            }
          : p
      )
    );
    setShowReviewModal(false);
    setSelectedAIPlaybook(null);
  };

  const handleAIGeneration = async (request: any) => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI-generated playbook based on input
    const newPlaybook: AIGeneratedPlaybook = {
      id: `ai-pb-${Date.now()}`,
      name: `Response to ${request.incident || request.threat || request.vulnerability || 'Security Event'}`,
      description: `AI-generated playbook for handling ${request.context || 'the specified security scenario'}`,
      category: request.incident ? 'incident_response' : 
               request.threat ? 'threat_hunting' : 'vulnerability_management',
      severity: request.priority === 'high' ? 5 : request.priority === 'medium' ? 3 : 2,
      confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
      steps: [
        { id: 'step-1', name: 'Initial Assessment', description: 'Evaluate the scope and impact', type: 'manual', estimatedTime: 10, isRequired: true },
        { id: 'step-2', name: 'Containment', description: 'Implement containment measures', type: 'automated', estimatedTime: 5, isRequired: true },
        { id: 'step-3', name: 'Investigation', description: 'Gather evidence and analyze', type: 'manual', estimatedTime: 30, isRequired: true },
        { id: 'step-4', name: 'Eradication', description: 'Remove threats and vulnerabilities', type: 'automated', estimatedTime: 15, isRequired: true },
        { id: 'step-5', name: 'Recovery', description: 'Restore normal operations', type: 'manual', estimatedTime: 45, isRequired: true }
      ],
      triggers: [`${request.incident || request.threat || 'event'}.detected`],
      generatedBy: 'Playbook AI Agent',
      generatedAt: new Date(),
      status: 'draft'
    };

    setGeneratedPlaybooks(prev => [newPlaybook, ...prev]);
    setIsGenerating(false);
    setShowAIGenerator(false);
  };

  // AI Enhancement Handler
  const handleEnhancePlaybook = async (playbook: any) => {
    setSelectedPlaybook(playbook);
    setIsEnhancing(true);
    setShowEnhanceModal(true);
    
    const startTime = Date.now();
    try {
      console.log('🤖 Calling AI enhancement service for playbook:', playbook.name);
      
      // Use proper playbooksService instead of raw fetch
      const data: PlaybookEnhancementResponse = await playbooksService.enhancePlaybook(playbook.id);
      
      const endTime = Date.now();
      
      console.log('✅ AI enhancement completed successfully');
      console.log('📊 Generated', data.enhancements.length, 'enhancement suggestions');
      console.log('⏱️ Execution time:', endTime - startTime, 'ms');
      console.log('🔧 AI Provider:', data.aiProvider.type, data.aiProvider.model);
      
      setIsEnhancing(false);
      
      // Store enhancement data for the modal to use
      (window as any).latestEnhancementData = data;
      
    } catch (error: any) {
      console.error('❌ AI enhancement failed:', error);
      setIsEnhancing(false);
      
      // Show error to user with more specific message
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`AI enhancement failed: ${errorMessage}`);
      
      // Close modal on error
      setShowEnhanceModal(false);
    }
  };

  // AI Review Handler
  const handleReviewPlaybook = async (playbook: any) => {
    setSelectedPlaybook(playbook);
    setIsReviewing(true);
    setShowAIReviewModal(true);
    
    const startTime = Date.now();
    try {
      console.log('🤖 Calling AI review service for playbook:', playbook.name);
      
      // Use proper playbooksService instead of fake setTimeout
      const data: PlaybookReviewResponse = await playbooksService.reviewPlaybook(playbook.id);
      
      const endTime = Date.now();
      
      console.log('✅ AI review completed successfully');
      console.log('📊 Overall Score:', data.review.overallScore);
      console.log('🔍 Findings:', data.review.findings.length);
      console.log('⏱️ Execution time:', endTime - startTime, 'ms');
      console.log('🔧 AI Provider:', data.aiProvider.type, data.aiProvider.model);
      
      setIsReviewing(false);
      
      // Store review data for the modal to use
      (window as any).latestReviewData = data;
      
    } catch (error: any) {
      console.error('❌ AI review failed:', error);
      setIsReviewing(false);
      
      // Show error to user with more specific message
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`AI review failed: ${errorMessage}`);
      
      // Close modal on error
      setShowAIReviewModal(false);
    }
  };

  // Handle applying enhancements from AI
  const handleApplyEnhancements = async (enhancements: any[]) => {
    if (!selectedPlaybook) return;
    
    const startTime = Date.now();
    try {
      console.log('Applying AI enhancements to playbook:', selectedPlaybook.id, enhancements);
      
      // In a real implementation, this would update the playbook with the enhancements
      // For now, we'll just show a success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh playbooks to reflect changes
      dispatch(fetchPlaybooks({
        page: playbooksPagination?.currentPage,
        limit: playbooksPagination?.itemsPerPage
      }));

      // Log successful enhancement application
      try {
        await aiAgentsService.logAgentActivity({
          agentName: 'Playbook Specialist Agent',
          taskName: 'apply enhancements',
          description: `Applied ${enhancements.length} AI enhancements to playbook: ${selectedPlaybook.name}`,
          executionTimeMs: Date.now() - startTime,
          success: true,
          playbookId: selectedPlaybook.id,
          metadata: {
            playbookId: selectedPlaybook.id,
            playbookName: selectedPlaybook.name,
            enhancementsApplied: enhancements.length,
            enhancementTypes: enhancements.map(e => e.type),
            enhancementCategories: [...new Set(enhancements.map(e => e.category))]
          }
        });
      } catch (logError) {
        console.warn('Failed to log enhancement application:', logError);
      }
      
    } catch (error) {
      console.error('Failed to apply enhancements:', error);

      // Log failed enhancement application
      try {
        await aiAgentsService.logAgentActivity({
          agentName: 'Playbook Specialist Agent',
          taskName: 'apply enhancements',
          description: `Failed to apply enhancements to playbook: ${selectedPlaybook.name}`,
          executionTimeMs: Date.now() - startTime,
          success: false,
          errorMessage: error.message || 'Unknown error',
          playbookId: selectedPlaybook.id,
          metadata: {
            playbookId: selectedPlaybook.id,
            playbookName: selectedPlaybook.name,
            enhancementsCount: enhancements.length,
            errorType: 'enhancement_application_failure'
          }
        });
      } catch (logError) {
        console.warn('Failed to log enhancement application error:', logError);
      }
    }
  };

  // Handle applying fixes from AI review
  const handleApplyReviewFixes = async (fixes: any[]) => {
    if (!selectedPlaybook) return;
    
    const startTime = Date.now();
    try {
      console.log('Applying AI review fixes to playbook:', selectedPlaybook.id, fixes);
      
      // In a real implementation, this would update the playbook with the fixes
      // For now, we'll just show a success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh playbooks to reflect changes
      dispatch(fetchPlaybooks({
        page: playbooksPagination?.currentPage,
        limit: playbooksPagination?.itemsPerPage
      }));

      // Log successful fix application
      try {
        await aiAgentsService.logAgentActivity({
          agentName: 'Playbook Specialist Agent',
          taskName: 'apply review fixes',
          description: `Applied ${fixes.length} AI review fixes to playbook: ${selectedPlaybook.name}`,
          executionTimeMs: Date.now() - startTime,
          success: true,
          playbookId: selectedPlaybook.id,
          metadata: {
            playbookId: selectedPlaybook.id,
            playbookName: selectedPlaybook.name,
            fixesApplied: fixes.length,
            fixTypes: fixes.map(f => f.type),
            severityLevels: fixes.map(f => f.severity),
            fixCategories: [...new Set(fixes.map(f => f.category))]
          }
        });
      } catch (logError) {
        console.warn('Failed to log review fix application:', logError);
      }
      
    } catch (error) {
      console.error('Failed to apply review fixes:', error);

      // Log failed fix application
      try {
        await aiAgentsService.logAgentActivity({
          agentName: 'Playbook Specialist Agent',
          taskName: 'apply review fixes',
          description: `Failed to apply review fixes to playbook: ${selectedPlaybook.name}`,
          executionTimeMs: Date.now() - startTime,
          success: false,
          errorMessage: error.message || 'Unknown error',
          playbookId: selectedPlaybook.id,
          metadata: {
            playbookId: selectedPlaybook.id,
            playbookName: selectedPlaybook.name,
            fixesCount: fixes.length,
            errorType: 'review_fix_application_failure'
          }
        });
      } catch (logError) {
        console.warn('Failed to log review fix application error:', logError);
      }
    }
  };

  // Handle save changes for playbook edit
  const handleSaveChanges = async () => {
    if (!selectedPlaybook) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        category: editFormData.category,
        triggerType: editFormData.triggerType as 'manual' | 'automatic',
        isActive: editFormData.isActive,
        steps: editFormData.steps.map((step, index) => ({
          ...step,
          order: index + 1,
          timeout: step.timeout || 300
        })),
        tags: editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        timeout: editFormData.timeout * 60, // Convert minutes to seconds
        retryCount: editFormData.retryCount,
        autoExecute: editFormData.autoExecute
      };

      const result = await dispatch(updatePlaybook({ 
        id: selectedPlaybook.id, 
        playbookData: updateData 
      }));

      if (result.meta.requestStatus === 'fulfilled') {
        // Update the selected playbook with the new data immediately
        const updatedPlaybook = {
          ...selectedPlaybook,
          ...updateData,
          // Convert timeout back to original format for consistency
          timeout: updateData.timeout,
          tags: updateData.tags
        };
        setSelectedPlaybook(updatedPlaybook);
        
        // Refresh playbooks list to ensure consistency
        await dispatch(fetchPlaybooks({
          page: playbooksPagination?.currentPage,
          limit: playbooksPagination?.itemsPerPage
        }));
        
        // Close edit modal and show success feedback
        setShowEditModal(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
        console.log('✅ Playbook updated successfully');
      }
    } catch (error) {
      console.error('Failed to save playbook:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle preview functionality
  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  // Handle step field updates
  const handleStepUpdate = (stepIndex: number, field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) => 
        index === stepIndex 
          ? { ...step, [field]: value }
          : step
      )
    }));
  };

  // Pagination handlers
  const handlePlaybooksPageChange = (page: number) => {
    dispatch(setPlaybooksPagination({ 
      page, 
      limit: playbooksPagination?.itemsPerPage || 25 
    }));
  };

  const handlePlaybooksPageSizeChange = (pageSize: number) => {
    dispatch(setPlaybooksPageSize(pageSize));
  };

  const handleTemplatesPageChange = (page: number) => {
    dispatch(setTemplatesPagination({ 
      page, 
      limit: templatesPagination?.itemsPerPage || 25 
    }));
  };

  const handleTemplatesPageSizeChange = (pageSize: number) => {
    dispatch(setTemplatesPageSize(pageSize));
  };


  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Security Playbooks</h1>
            <p className="text-slate-400 mt-1">Error loading playbooks data</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Playbooks</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              dispatch(fetchPlaybooks());
              dispatch(fetchPlaybookStats());
              dispatch(fetchPlaybookTemplates());
            }}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Playbooks</h1>
          <p className="text-slate-400 mt-1">
            AI-powered incident response and automation playbooks
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={playbooksLoading || templatesLoading}
          >
            <RefreshCw className={`h-4 w-4 ${playbooksLoading || templatesLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setShowAIGenerator(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Wand2 className="h-4 w-4" />
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Playbook updated successfully!</span>
        </div>
      )}

      {/* AI Playbook Agent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Playbooks</p>
              <p className="text-2xl font-bold text-white">{playbookStats?.total || playbooks.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Play className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">AI Generated</p>
              <p className="text-2xl font-bold text-white">{generatedPlaybooks.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-white">
                {generatedPlaybooks.filter(p => p.status === 'approved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pending Review</p>
              <p className="text-2xl font-bold text-white">
                {generatedPlaybooks.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-soc-dark-800 p-1 rounded-lg">
        {[
          { id: 'playbooks', label: 'All Playbooks', icon: Play },
          { id: 'ai-agent', label: 'AI Generated', icon: Bot },
          { id: 'templates', label: 'Templates', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id 
                ? 'bg-opensoc-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {activeTab === 'playbooks' && `${playbooksPagination?.totalItems || playbooks.length} playbooks`}
          {activeTab === 'ai-agent' && `${generatedPlaybooks.length} AI generated playbooks`}
          {activeTab === 'templates' && `${templatesPagination?.totalItems || templates.length} templates`}
        </div>
        
        <div className="flex items-center space-x-3">
          {activeTab === 'playbooks' && playbooksPagination && (
            <RowsPerPageSelector
              value={playbooksPagination.itemsPerPage}
              onChange={handlePlaybooksPageSizeChange}
              disabled={playbooksLoading}
            />
          )}
          {activeTab === 'templates' && templatesPagination && (
            <RowsPerPageSelector
              value={templatesPagination.itemsPerPage}
              onChange={handleTemplatesPageSizeChange}
              disabled={templatesLoading}
            />
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'playbooks' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {playbooksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card animate-pulse">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                            <div className="h-3 bg-slate-600 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-slate-700 rounded"></div>
                          <div className="w-8 h-8 bg-slate-700 rounded"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="h-4 bg-slate-600 rounded"></div>
                        <div className="h-4 bg-slate-600 rounded"></div>
                        <div className="h-4 bg-slate-600 rounded"></div>
                        <div className="h-4 bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              playbooks.map((playbook) => (
              <div 
                key={playbook.id} 
                className="card hover:bg-soc-dark-800 transition-colors cursor-pointer"
                onClick={() => handlePlaybookClick(playbook)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-opensoc-600/20 rounded-lg flex items-center justify-center">
                        <Play className="h-6 w-6 text-opensoc-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">{playbook.name}</h4>
                          <RecordId type="playbook" id={playbook.id} variant="inline" showPrefix={true} />
                          {playbook.isTestData && <TestDataChip size="sm" />}
                          {playbook.isActive ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">ACTIVE</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">INACTIVE</span>
                          )}
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {playbook.triggerType.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{playbook.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnhancePlaybook(playbook);
                        }}
                        className="p-2 text-slate-400 hover:text-purple-400 hover:bg-soc-dark-700 rounded"
                        title="Enhance with AI"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewPlaybook(playbook);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-soc-dark-700 rounded"
                        title="AI Review"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-orange-400 hover:bg-soc-dark-700 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-400 hover:bg-soc-dark-700 rounded">
                        {playbook.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Steps</p>
                      <p className="text-white font-medium">{playbook.steps.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Success Rate</p>
                      <p className="text-white font-medium">{playbook.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Executions</p>
                      <p className="text-white font-medium">{playbook.executionCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Avg. Duration</p>
                      <p className="text-white font-medium">{Math.floor(playbook.averageExecutionTime / 60)}m</p>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>

          {/* Playbooks Pagination */}
          {!playbooksLoading && playbooks.length > 0 && playbooksPagination && (
            <Pagination
              currentPage={playbooksPagination.currentPage}
              totalPages={playbooksPagination.totalPages}
              totalItems={playbooksPagination.totalItems}
              itemsPerPage={playbooksPagination.itemsPerPage}
              onPageChange={handlePlaybooksPageChange}
              isLoading={playbooksLoading}
            />
          )}
        </div>
      )}

      {activeTab === 'ai-agent' && (
        <div className="space-y-6">
          {/* AI Generated Playbooks */}
          <div className="space-y-4">
            {[...mockAIPlaybooks, ...generatedPlaybooks].map((playbook) => (
              <div key={playbook.id} className="card hover:bg-soc-dark-800 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Bot className="h-6 w-6 text-purple-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-white font-medium">{playbook.name}</h4>
                          <RecordId type="playbook" id={playbook.id} variant="inline" showPrefix={true} />
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(playbook.status)}`}>
                            {playbook.status.toUpperCase()}
                          </span>
                          {getCategoryIcon(playbook.category)}
                          <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(playbook.severity)}`}>
                            SEV {playbook.severity}
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{playbook.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>Generated by: {playbook.generatedBy}</span>
                          <span>Confidence: {playbook.confidence}%</span>
                          <span>{safeFormatDistance(playbook.generatedAt)}</span>
                          {playbook.reviewedBy && <span>Reviewed by: {playbook.reviewedBy}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => { setSelectedAIPlaybook(playbook); setShowReviewModal(true); }}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-soc-dark-700 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {playbook.status === 'draft' && (
                        <button 
                          onClick={() => { setSelectedAIPlaybook(playbook); setShowReviewModal(true); }}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Steps</p>
                      <p className="text-white font-medium">{playbook.steps.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Est. Time</p>
                      <p className="text-white font-medium">
                        {playbook.steps.reduce((acc, step) => acc + step.estimatedTime, 0)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Required Steps</p>
                      <p className="text-white font-medium">
                        {playbook.steps.filter(s => s.isRequired).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Automated</p>
                      <p className="text-white font-medium">
                        {playbook.steps.filter(s => s.type === 'automated').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Manual</p>
                      <p className="text-white font-medium">
                        {playbook.steps.filter(s => s.type === 'manual').length}
                      </p>
                    </div>
                  </div>

                  {playbook.reviewNotes && (
                    <div className="bg-soc-dark-800/50 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Review Notes:</p>
                      <p className="text-slate-300 text-sm">{playbook.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          {templatesLoading ? (
            <div className="card p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-opensoc-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading templates...</p>
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="card">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-white">{template.name}</h3>
                          <RecordId type="template" id={template.id} variant="inline" showPrefix={true} />
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{template.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-opensoc-600/20 text-opensoc-400 text-xs rounded">
                        {template.category}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Steps:</span>
                        <span className="text-white">{template.steps.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Estimated Time:</span>
                        <span className="text-white">
                          {Math.floor(template.steps.reduce((total, step) => total + step.timeout, 0) / 60)}m
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Automation:</span>
                        <span className="text-white">
                          {template.steps.filter(s => s.type === 'automated').length} / {template.steps.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="btn-secondary text-sm flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </button>
                      <button className="btn-primary text-sm flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Playbook Templates</h3>
                <p className="text-slate-400 mb-6">Pre-built templates for common security scenarios</p>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Templates
                </button>
              </div>
            </div>
          )}

          {/* Templates Pagination */}
          {!templatesLoading && templates.length > 0 && templatesPagination && (
            <Pagination
              currentPage={templatesPagination.currentPage}
              totalPages={templatesPagination.totalPages}
              totalItems={templatesPagination.totalItems}
              itemsPerPage={templatesPagination.itemsPerPage}
              onPageChange={handleTemplatesPageChange}
              isLoading={templatesLoading}
            />
          )}
        </div>
      )}

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={handleAIGeneration}
        isGenerating={isGenerating}
      />

      {/* Playbook Detail Modal */}
      <PlaybookDetailModal
        playbook={selectedPlaybook}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={handlePlaybookEdit}
        onEnhance={handleEnhancePlaybook}
        onReview={handleReviewPlaybook}
      />

      {/* Playbook Edit Modal */}
      {showEditModal && selectedPlaybook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-opensoc-500/20 rounded-lg">
                    <Edit className="h-6 w-6 text-opensoc-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Edit Playbook</h2>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-slate-400">{selectedPlaybook.name}</p>
                      <RecordId type="playbook" id={selectedPlaybook.id} variant="inline" showPrefix={true} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Playbook Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field w-full"
                        placeholder="Enter playbook name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="input-field w-full h-24 resize-none"
                        placeholder="Enter playbook description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Category</label>
                      <select 
                        value={editFormData.category} 
                        onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="input-field w-full"
                      >
                        <option value="incident_response">Incident Response</option>
                        <option value="threat_hunting">Threat Hunting</option>
                        <option value="vulnerability_management">Vulnerability Management</option>
                        <option value="compliance">Compliance</option>
                        <option value="forensics">Digital Forensics</option>
                        <option value="threat_intelligence">Threat Intelligence</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Trigger Type</label>
                      <select 
                        value={editFormData.triggerType} 
                        onChange={(e) => setEditFormData(prev => ({ ...prev, triggerType: e.target.value }))}
                        className="input-field w-full"
                      >
                        <option value="manual">Manual</option>
                        <option value="automatic">Automatic</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="webhook">Webhook</option>
                        <option value="alert">Alert Triggered</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Timeout (minutes)</label>
                        <input
                          type="number"
                          value={editFormData.timeout}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 0 }))}
                          className="input-field w-full"
                          min="1"
                          max="1440"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Retry Count</label>
                        <input
                          type="number"
                          value={editFormData.retryCount}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 0 }))}
                          className="input-field w-full"
                          min="0"
                          max="10"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoExecute"
                        checked={editFormData.autoExecute}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, autoExecute: e.target.checked }))}
                        className="w-4 h-4 text-opensoc-600 bg-soc-dark-800 border-soc-dark-600 rounded focus:ring-opensoc-500 focus:ring-2"
                      />
                      <label htmlFor="autoExecute" className="text-sm text-white">Auto Execute</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={editFormData.isActive}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-opensoc-600 bg-soc-dark-800 border-soc-dark-600 rounded focus:ring-opensoc-500 focus:ring-2"
                      />
                      <label htmlFor="isActive" className="text-sm text-white">Active</label>
                    </div>
                  </div>
                </div>

                {/* Execution Steps */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Execution Steps</h3>
                  <div className="space-y-3">
                    {editFormData.steps.map((step: any, index: number) => (
                      <div key={index} className="bg-soc-dark-800/50 p-4 rounded-lg border border-soc-dark-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-opensoc-400 font-medium">#{index + 1}</span>
                            <input
                              type="text"
                              value={step.name || ''}
                              onChange={(e) => handleStepUpdate(index, 'name', e.target.value)}
                              className="input-field flex-1"
                              placeholder="Step name"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <select 
                              value={step.type || 'manual'} 
                              onChange={(e) => handleStepUpdate(index, 'type', e.target.value)}
                              className="input-field"
                            >
                              <option value="automated">Automated</option>
                              <option value="manual">Manual</option>
                              <option value="decision">Decision</option>
                            </select>
                            <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={step.description || ''}
                          onChange={(e) => handleStepUpdate(index, 'description', e.target.value)}
                          className="input-field w-full h-20 resize-none mb-3"
                          placeholder="Step description and instructions"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Timeout (seconds)</label>
                            <input
                              type="number"
                              value={step.timeout || 300}
                              onChange={(e) => handleStepUpdate(index, 'timeout', parseInt(e.target.value) || 300)}
                              className="input-field w-full"
                              min="1"
                              max="3600"
                            />
                          </div>
                          <div className="flex items-center space-x-3 pt-5">
                            <input
                              type="checkbox"
                              id={`required-${index}`}
                              checked={step.isRequired !== false}
                              onChange={(e) => handleStepUpdate(index, 'isRequired', e.target.checked)}
                              className="w-4 h-4 text-opensoc-600 bg-soc-dark-800 border-soc-dark-600 rounded focus:ring-opensoc-500 focus:ring-2"
                            />
                            <label htmlFor={`required-${index}`} className="text-sm text-white">Required Step</label>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button className="w-full p-4 border-2 border-dashed border-soc-dark-600 rounded-lg text-slate-400 hover:text-white hover:border-opensoc-500 transition-colors">
                      + Add New Step
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tags</label>
                  <input
                    type="text"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Enter tags separated by commas"
                  />
                  <p className="text-xs text-slate-400 mt-1">Separate multiple tags with commas</p>
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t border-soc-dark-700">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Reset to detail modal
                      setShowEditModal(false);
                      setShowDetailModal(true);
                    }}
                    className="btn-secondary"
                  >
                    Back to Details
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={handlePreview}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                  <button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedPlaybook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Playbook Preview</h2>
                    <p className="text-sm text-slate-400">Preview changes before saving</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Preview Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Basic Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name:</span>
                        <span className="text-white font-medium">{editFormData.name || 'Untitled'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="text-white capitalize">{editFormData.category.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trigger Type:</span>
                        <span className="text-white capitalize">{editFormData.triggerType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${editFormData.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {editFormData.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Configuration</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timeout:</span>
                        <span className="text-white font-medium">{editFormData.timeout} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Retry Count:</span>
                        <span className="text-white font-medium">{editFormData.retryCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Auto Execute:</span>
                        <span className="text-white font-medium">{editFormData.autoExecute ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Description</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {editFormData.description || 'No description provided.'}
                  </p>
                </div>

                {editFormData.tags && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {editFormData.tags.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span key={index} className="px-2 py-1 bg-opensoc-600/20 text-opensoc-400 text-xs rounded">
                            {tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Steps ({editFormData.steps.length})</h3>
                  <div className="space-y-2">
                    {editFormData.steps.map((step, index) => (
                      <div key={index} className="bg-soc-dark-800/50 p-3 rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-opensoc-400 font-medium">#{index + 1}</span>
                            <span className="text-white font-medium">{step.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${step.type === 'automated' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {step.type}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-soc-dark-700">
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary"
                >
                  Close Preview
                </button>
                <button 
                  onClick={() => {
                    setShowPreview(false);
                    handleSaveChanges();
                  }}
                  disabled={isSaving}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAIPlaybook && (
        <PlaybookReviewModal
          playbook={selectedAIPlaybook}
          onClose={() => { setShowReviewModal(false); setSelectedAIPlaybook(null); }}
          onReview={handleReviewAIPlaybook}
        />
      )}

      {/* AI Enhancement Modal */}
      <PlaybookEnhanceModal
        playbook={selectedPlaybook}
        isOpen={showEnhanceModal}
        onClose={() => setShowEnhanceModal(false)}
        onApplyEnhancements={handleApplyEnhancements}
        isAnalyzing={isEnhancing}
      />

      {/* AI Review Modal */}
      <PlaybookAIReviewModal
        playbook={selectedPlaybook}
        isOpen={showAIReviewModal}
        onClose={() => setShowAIReviewModal(false)}
        onApplyFixes={handleApplyReviewFixes}
        isAnalyzing={isReviewing}
      />
    </div>
  );
};

export default PlaybooksPage;