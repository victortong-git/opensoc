/**
 * MITRE ATT&CK AI Analysis Parser
 * Parses structured AI responses into organized sections for better UI rendering
 */

export interface MitreAnalysisSection {
  id: string;
  title: string;
  content: string;
  type: 'mapping' | 'assessment' | 'detection' | 'mitigation' | 'iocs' | 'other';
  icon: string;
  color: string;
}

export interface ParsedMitreAnalysis {
  sections: MitreAnalysisSection[];
  summary: string;
  techniques: string[];
  originalText?: string; // Store the original AI response text
  metadata: {
    model?: string;
    processingTime?: number;
    confidence?: string;
  };
}

/**
 * Parse AI analysis response into structured sections
 */
export function parseMitreAnalysis(
  aiResponse: any,
  rawContent: string
): ParsedMitreAnalysis {
  const sections: MitreAnalysisSection[] = [];
  const techniques: string[] = [];
  
  // Extract content from different possible response structures
  const content = aiResponse?.data?.analysis || 
                 aiResponse?.data?.content || 
                 aiResponse?.analysis || 
                 aiResponse?.content || 
                 rawContent || 
                 '';

  // Split content by markdown headers
  const headerPattern = /^##\s*(\d+\.?\s*)?(.+?)$/gm;
  const parts = content.split(headerPattern);
  
  let currentSection = '';
  let sectionTitle = '';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]?.trim();
    if (!part) continue;
    
    // Check if this part is a section title
    if (i % 3 === 2) { // Every third part after split is a title
      sectionTitle = part;
      currentSection = '';
    } else if (i % 3 === 0 && sectionTitle) { // Content part
      currentSection = part;
      
      if (sectionTitle && currentSection) {
        const section = createSection(sectionTitle, currentSection);
        sections.push(section);
        
        // Extract technique IDs (T1xxx format)
        const techniqueMatches = currentSection.match(/T\d{4}(?:\.\d{3})?/g);
        if (techniqueMatches) {
          techniques.push(...techniqueMatches);
        }
      }
    }
  }
  
  // If no sections found, try alternative parsing methods
  if (sections.length === 0 && content) {
    console.debug('🔍 No sections found with ## headers, trying alternative parsing...');
    
    // Try parsing with different header formats
    const altHeaderPattern = /^#\s*(.+?)$/gm;
    const altParts = content.split(altHeaderPattern);
    
    console.debug('📝 Alternative header parsing found', altParts.length, 'parts');
    
    if (altParts.length > 2) {
      // Found single # headers
      for (let i = 1; i < altParts.length; i += 2) {
        const title = altParts[i]?.trim();
        const sectionContent = altParts[i + 1]?.trim();
        if (title && sectionContent) {
          sections.push(createSection(title, sectionContent));
          
          // Extract technique IDs
          const techniqueMatches = sectionContent.match(/T\d{4}(?:\.\d{3})?/g);
          if (techniqueMatches) {
            techniques.push(...techniqueMatches);
          }
        }
      }
    } else {
      // Try parsing by looking for numbered sections
      const numberedPattern = /^(\d+\.)\s*(.+?)(?=\n\d+\.|\n*$)/gms;
      const numberedMatches = content.match(numberedPattern);
      
      if (numberedMatches && numberedMatches.length > 1) {
        numberedMatches.forEach((match, index) => {
          const lines = match.trim().split('\n');
          const title = lines[0]?.replace(/^\d+\.\s*/, '').trim();
          const sectionContent = lines.slice(1).join('\n').trim();
          
          if (title && sectionContent) {
            sections.push(createSection(title, sectionContent));
            
            // Extract technique IDs
            const techniqueMatches = sectionContent.match(/T\d{4}(?:\.\d{3})?/g);
            if (techniqueMatches) {
              techniques.push(...techniqueMatches);
            }
          }
        });
      } else {
        // Split content into logical paragraphs and create default sections
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        if (paragraphs.length > 1) {
          paragraphs.forEach((paragraph, index) => {
            const title = extractTitleFromParagraph(paragraph) || `Analysis Section ${index + 1}`;
            sections.push({
              id: `section-${index}`,
              title: title,
              content: paragraph.trim(),
              type: determineSectionType(paragraph),
              icon: getSectionIcon(determineSectionType(paragraph)),
              color: getSectionColor(determineSectionType(paragraph))
            });
            
            // Extract technique IDs
            const techniqueMatches = paragraph.match(/T\d{4}(?:\.\d{3})?/g);
            if (techniqueMatches) {
              techniques.push(...techniqueMatches);
            }
          });
        } else {
          // Try parsing based on ** bold headers (common AI format)
          console.debug('🔍 Trying bold header parsing...');
          const boldHeaderPattern = /^\*\*(\d+\.\s*[^*]+)\*\*/gm;
          const boldMatches = [...content.matchAll(boldHeaderPattern)];
          
          if (boldMatches.length > 0) {
            console.debug('📝 Found', boldMatches.length, 'bold headers');
            
            const seenContent = new Set<string>();
            
            for (let i = 0; i < boldMatches.length; i++) {
              const currentMatch = boldMatches[i];
              const nextMatch = boldMatches[i + 1];
              
              const title = currentMatch[1].replace(/^\d+\.\s*/, '').trim();
              const startIndex = currentMatch.index! + currentMatch[0].length;
              const endIndex = nextMatch ? nextMatch.index! : content.length;
              
              const sectionContent = content.substring(startIndex, endIndex).trim();
              
              // Skip duplicate or very similar content
              const contentHash = sectionContent.substring(0, 200).toLowerCase().replace(/\s+/g, ' ');
              if (seenContent.has(contentHash)) {
                console.debug(`🔄 Skipping duplicate section content: "${title}"`);
                continue;
              }
              seenContent.add(contentHash);
              
              // Skip sections that are too short or repetitive
              if (!title || !sectionContent || sectionContent.length < 20) {
                continue;
              }
              
              // Skip sections with repetitive patterns that might be errors
              if (sectionContent.includes('Not relevant') && sectionContent.length < 100) {
                console.debug(`🚫 Skipping repetitive content section: "${title}"`);
                continue;
              }
              
              const section = createSection(title, sectionContent);
              sections.push(section);
              console.debug(`➕ Added section: "${title}" (${sectionContent.length} chars)`);
              
              // Extract technique IDs
              const techniqueMatches = sectionContent.match(/T\d{4}(?:\.\d{3})?/g);
              if (techniqueMatches) {
                techniques.push(...techniqueMatches);
              }
            }
          } else {
            // Final fallback: single section with all content  
            console.debug('📝 Using fallback: single section with all content');
            sections.push({
              id: 'analysis',
              title: 'MITRE ATT&CK Analysis',
              content: content,
              type: 'mapping',
              icon: '🎯',
              color: 'purple'
            });
            
            // Extract technique IDs from entire content
            const techniqueMatches = content.match(/T\d{4}(?:\.\d{3})?/g);
            if (techniqueMatches) {
              techniques.push(...techniqueMatches);
            }
          }
        }
      }
    }
  }
  
  // Generate summary (first 200 chars or first paragraph)
  const summary = extractSummary(content);
  
  // Extract metadata
  const metadata = {
    model: aiResponse?.data?.model || aiResponse?.model || 'AI Provider',
    processingTime: aiResponse?.execution_time_ms || aiResponse?.data?.generation_time_ms || 0,
    confidence: extractConfidence(content)
  };
  
  return {
    sections,
    summary,
    techniques: [...new Set(techniques)], // Remove duplicates
    metadata
  };
}

/**
 * Create a structured section from title and content
 */
function createSection(title: string, content: string): MitreAnalysisSection {
  const normalizedTitle = title.toLowerCase();
  
  let type: MitreAnalysisSection['type'] = 'other';
  let icon = '📄';
  let color = 'gray';
  
  if (normalizedTitle.includes('mitre') || normalizedTitle.includes('mapping') || normalizedTitle.includes('att&ck')) {
    type = 'mapping';
    icon = '🎯';
    color = 'purple';
  } else if (normalizedTitle.includes('threat') || normalizedTitle.includes('assessment') || normalizedTitle.includes('risk')) {
    type = 'assessment';
    icon = '⚠️';
    color = 'red';
  } else if (normalizedTitle.includes('detection') || normalizedTitle.includes('monitoring') || normalizedTitle.includes('hunt')) {
    type = 'detection';
    icon = '🔍';
    color = 'blue';
  } else if (normalizedTitle.includes('mitigation') || normalizedTitle.includes('prevention') || normalizedTitle.includes('defense')) {
    type = 'mitigation';
    icon = '🛡️';
    color = 'green';
  } else if (normalizedTitle.includes('ioc') || normalizedTitle.includes('indicator') || normalizedTitle.includes('artifact')) {
    type = 'iocs';
    icon = '🔬';
    color = 'orange';
  }
  
  return {
    id: generateSectionId(title),
    title: cleanTitle(title),
    content: content.trim(),
    type,
    icon,
    color
  };
}

/**
 * Generate a URL-safe ID from section title
 */
function generateSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Clean up section title
 */
function cleanTitle(title: string): string {
  return title
    .replace(/^\d+\.?\s*/, '') // Remove leading numbers
    .replace(/\*\*/g, '') // Remove markdown bold
    .trim();
}

/**
 * Extract summary from content
 */
function extractSummary(content: string): string {
  // Try to find the first paragraph or first 200 characters
  const paragraphs = content.split('\n\n');
  const firstParagraph = paragraphs.find(p => p.trim().length > 50);
  
  if (firstParagraph && firstParagraph.length <= 300) {
    return firstParagraph.trim();
  }
  
  // Fallback to first 200 characters
  const summary = content.substring(0, 200).trim();
  const lastSpace = summary.lastIndexOf(' ');
  return lastSpace > 100 ? summary.substring(0, lastSpace) + '...' : summary + '...';
}

/**
 * Extract confidence level from content
 */
function extractConfidence(content: string): string {
  const confidenceMatches = content.match(/confidence[:\s]*(high|medium|low|[\d.]+)/i);
  if (confidenceMatches) {
    return confidenceMatches[1];
  }
  
  // Look for other indicators
  if (content.includes('highly confident') || content.includes('very likely')) {
    return 'high';
  } else if (content.includes('moderate') || content.includes('likely')) {
    return 'medium';
  } else if (content.includes('low confidence') || content.includes('possible')) {
    return 'low';
  }
  
  return 'unknown';
}

/**
 * Extract technique IDs and create clickable links
 */
export function extractTechniqueIds(content: string): { id: string; name?: string }[] {
  const techniquePattern = /T\d{4}(?:\.\d{3})?(?:\s*-?\s*([^,\n\|]+))?/g;
  const matches = [];
  let match;
  
  while ((match = techniquePattern.exec(content)) !== null) {
    matches.push({
      id: match[0].split(/\s*-?\s*/)[0], // Extract just the ID part
      name: match[1]?.trim() || undefined
    });
  }
  
  return matches;
}

/**
 * Extract a title from the first line of a paragraph
 */
function extractTitleFromParagraph(paragraph: string): string | null {
  const firstLine = paragraph.split('\n')[0].trim();
  
  // Look for section-like indicators
  if (firstLine.match(/^(Relevant|MITRE|Tactics|Detection|Hunting|Confidence|False|Recommended)/i)) {
    return firstLine.replace(/[*:]/g, '').trim();
  }
  
  // Look for numbered sections
  if (firstLine.match(/^\d+\./)) {
    return firstLine.replace(/^\d+\.\s*/, '').trim();
  }
  
  // If first line is short and looks like a title
  if (firstLine.length < 80 && firstLine.match(/^[A-Z]/)) {
    return firstLine;
  }
  
  return null;
}

/**
 * Determine section type from content
 */
function determineSectionType(content: string): MitreAnalysisSection['type'] {
  const lower = content.toLowerCase();
  
  if (lower.includes('technique') || lower.includes('mitre') || lower.includes('att&ck') || lower.includes('mapping')) {
    return 'mapping';
  } else if (lower.includes('detection') || lower.includes('hunting') || lower.includes('query') || lower.includes('monitor')) {
    return 'detection';
  } else if (lower.includes('confidence') || lower.includes('assessment') || lower.includes('risk')) {
    return 'assessment';
  } else if (lower.includes('mitigation') || lower.includes('prevention') || lower.includes('defense')) {
    return 'mitigation';
  } else if (lower.includes('ioc') || lower.includes('indicator') || lower.includes('artifact')) {
    return 'iocs';
  }
  
  return 'other';
}

/**
 * Get icon for section type
 */
function getSectionIcon(type: MitreAnalysisSection['type']): string {
  switch (type) {
    case 'mapping': return '🎯';
    case 'detection': return '🔍';
    case 'assessment': return '⚠️';
    case 'mitigation': return '🛡️';
    case 'iocs': return '🔬';
    default: return '📄';
  }
}

/**
 * Get color for section type
 */
function getSectionColor(type: MitreAnalysisSection['type']): string {
  switch (type) {
    case 'mapping': return 'purple';
    case 'detection': return 'blue';
    case 'assessment': return 'red';
    case 'mitigation': return 'green';
    case 'iocs': return 'orange';
    default: return 'gray';
  }
}

/**
 * Format content for better readability
 */
export function formatMitreContent(content: string): string {
  return content
    // Enhance technique IDs with markup for styling
    .replace(/T\d{4}(?:\.\d{3})?/g, '<mark class="technique-id">$&</mark>')
    // Enhance severity indicators
    .replace(/(high|critical|severe)/gi, '<mark class="severity-high">$1</mark>')
    .replace(/(medium|moderate)/gi, '<mark class="severity-medium">$1</mark>')
    .replace(/(low|minimal)/gi, '<mark class="severity-low">$1</mark>')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}