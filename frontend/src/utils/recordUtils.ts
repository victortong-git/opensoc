/**
 * Utility functions for record identification and display
 */

// Record type prefixes
export const RECORD_PREFIXES = {
  alert: 'ALT',
  incident: 'INC', 
  asset: 'AST',
  ioc: 'IOC',
  threat_actor: 'TA',
  campaign: 'CAM',
  playbook: 'PB',
  template: 'TPL',
  user: 'USR',
  notification: 'NOT'
} as const;

export type RecordType = keyof typeof RECORD_PREFIXES;

/**
 * Extract short ID from UUID (first 8 characters)
 */
export const getShortId = (id: string): string => {
  if (!id) return 'N/A';
  return id.substring(0, 8).toUpperCase();
};

/**
 * Format record ID with prefix and short UUID
 */
export const formatRecordId = (type: RecordType, id: string): string => {
  if (!id) return 'N/A';
  const prefix = RECORD_PREFIXES[type];
  const shortId = getShortId(id);
  return `${prefix}-${shortId}`;
};

/**
 * Format display ID for tables and cards
 */
export const formatDisplayId = (type: RecordType, id: string, showPrefix: boolean = true): string => {
  if (!id) return 'N/A';
  
  if (showPrefix) {
    return formatRecordId(type, id);
  }
  
  return getShortId(id);
};

/**
 * Copy text to clipboard with success feedback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Show temporary success message for copy operations
 */
export const showCopySuccess = (message: string = 'Copied to clipboard!'): void => {
  // Create temporary notification
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
  
  document.body.appendChild(notification);
  
  // Remove after 2 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
};

/**
 * Handle record ID copy with user feedback
 */
export const handleRecordIdCopy = async (type: RecordType, id: string): Promise<void> => {
  const fullId = id;
  const displayId = formatRecordId(type, id);
  
  const success = await copyToClipboard(fullId);
  
  if (success) {
    showCopySuccess(`${displayId} copied to clipboard!`);
  } else {
    console.error('Failed to copy record ID');
  }
};

/**
 * Check if a string matches a record ID pattern
 */
export const isRecordIdPattern = (searchTerm: string): boolean => {
  if (!searchTerm) return false;
  
  // Check for pattern like ALT-12345678 or just 12345678
  const prefixPattern = /^(ALT|INC|AST|IOC|TA|CAM|PB|TPL|USR|NOT)-[A-F0-9]{8}$/i;
  const shortIdPattern = /^[A-F0-9]{8,}$/i;
  
  return prefixPattern.test(searchTerm) || shortIdPattern.test(searchTerm);
};

/**
 * Extract UUID from search term if it matches record ID pattern
 */
export const extractUuidFromSearchTerm = (searchTerm: string, allRecords: Array<{id: string}>): string | null => {
  if (!isRecordIdPattern(searchTerm)) return null;
  
  // Remove prefix if present
  const cleanTerm = searchTerm.replace(/^(ALT|INC|AST|IOC|TA|CAM|PB|TPL|USR|NOT)-/i, '').toUpperCase();
  
  // Find matching record by short ID
  const matchingRecord = allRecords.find(record => 
    record.id.substring(0, 8).toUpperCase() === cleanTerm
  );
  
  return matchingRecord?.id || null;
};

/**
 * Get record type from ID prefix
 */
export const getRecordTypeFromPrefix = (prefix: string): RecordType | null => {
  const upperPrefix = prefix.toUpperCase();
  
  for (const [type, typePrefix] of Object.entries(RECORD_PREFIXES)) {
    if (typePrefix === upperPrefix) {
      return type as RecordType;
    }
  }
  
  return null;
};

/**
 * Validate UUID format
 */
export const isValidUuid = (id: string): boolean => {
  if (!id) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Generate sequential display number (for future use if needed)
 */
export const generateSequentialNumber = (type: RecordType, index: number): string => {
  const prefix = RECORD_PREFIXES[type];
  const paddedNumber = String(index + 1).padStart(3, '0');
  return `${prefix}-${paddedNumber}`;
};