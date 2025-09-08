import React, { useState } from 'react';
import { Tag, Edit2, Check, X, Plus, AlertCircle } from 'lucide-react';

interface EventTag {
  tag: string;
  category: 'technical' | 'behavioral' | 'contextual' | 'correlation' | 'general';
  confidence: number;
  reasoning?: string;
}

interface EventTagsComponentProps {
  tags: EventTag[];
  confidence?: number;
  generatedAt?: string;
  isEditable?: boolean;
  onTagsUpdate?: (tags: EventTag[]) => void;
  loading?: boolean;
}

const EventTagsComponent: React.FC<EventTagsComponentProps> = ({
  tags = [],
  confidence,
  generatedAt,
  isEditable = false,
  onTagsUpdate,
  loading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTags, setEditableTags] = useState<EventTag[]>(tags);
  const [newTag, setNewTag] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<EventTag['category']>('general');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'behavioral':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'contextual':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'correlation':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-400';
    if (conf >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const tag: EventTag = {
      tag: newTag.toLowerCase().replace(/\s+/g, '-'),
      category: newTagCategory,
      confidence: 0.9, // Default high confidence for manually added tags
      reasoning: 'Manually added by admin'
    };

    const updatedTags = [...editableTags, tag];
    setEditableTags(updatedTags);
    setNewTag('');
  };

  const handleRemoveTag = (index: number) => {
    const updatedTags = editableTags.filter((_, i) => i !== index);
    setEditableTags(updatedTags);
  };

  const handleSave = () => {
    onTagsUpdate?.(editableTags);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableTags(tags);
    setIsEditing(false);
    setNewTag('');
  };

  if (loading) {
    return (
      <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Tag className="h-5 w-5 text-opensoc-400 animate-pulse" />
          <span className="text-lg font-medium text-white">Event Tags</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-opensoc-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-opensoc-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-opensoc-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        <p className="text-slate-400 text-sm">AI Generating tags</p>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-slate-400" />
            <span className="text-lg font-medium text-white">Event Tags</span>
          </div>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No tags available</p>
          <p className="text-slate-500 text-xs">Use AI Classification to generate contextual tags</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-opensoc-400" />
          <span className="text-lg font-medium text-white">Event Tags</span>
          {confidence && (
            <span className={`text-xs px-2 py-1 rounded border ${getConfidenceColor(confidence / 100)} bg-opacity-20`}>
              {Math.round(confidence)}% confidence
            </span>
          )}
        </div>
        
        {isEditable && (
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-sm px-3 py-1 flex items-center space-x-1"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit Tags</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className="btn-primary text-sm px-3 py-1 flex items-center space-x-1"
                >
                  <Check className="h-3 w-3" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-secondary text-sm px-3 py-1 flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags Display */}
      <div className="space-y-3">
        {/* Existing Tags */}
        <div className="flex flex-wrap gap-2">
          {(isEditing ? editableTags : tags).map((eventTag, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg border text-sm ${getCategoryColor(eventTag.category)}`}
              title={eventTag.reasoning || `${eventTag.category} tag with ${Math.round(eventTag.confidence * 100)}% confidence`}
            >
              <span className="font-medium">{eventTag.tag}</span>
              <span className="text-xs opacity-75">({eventTag.category})</span>
              <span className={`text-xs font-mono ${getConfidenceColor(eventTag.confidence)}`}>
                {Math.round(eventTag.confidence * 100)}%
              </span>
              {isEditing && (
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Tag (Edit Mode) */}
        {isEditing && (
          <div className="border-t border-soc-dark-700 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter new tag"
                className="flex-1 bg-soc-dark-900 border border-soc-dark-700 rounded px-2 py-1 text-white text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <select
                value={newTagCategory}
                onChange={(e) => setNewTagCategory(e.target.value as EventTag['category'])}
                className="bg-soc-dark-900 border border-soc-dark-700 rounded px-2 py-1 text-white text-sm"
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="contextual">Contextual</option>
                <option value="correlation">Correlation</option>
              </select>
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="btn-primary text-sm px-3 py-1 flex items-center space-x-1 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        {generatedAt && (
          <div className="text-xs text-slate-500 border-t border-soc-dark-700 pt-2">
            Tags generated: {new Date(generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTagsComponent;