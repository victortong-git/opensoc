// const puppeteer = require('puppeteer'); // Temporarily disabled
const { formatDistanceToNow } = require('date-fns');

// Mock puppeteer for testing
const puppeteer = {
  launch: () => Promise.resolve({
    newPage: () => Promise.resolve({
      setContent: () => Promise.resolve(),
      pdf: () => Promise.resolve(Buffer.from('PDF content placeholder')),
      close: () => Promise.resolve()
    }),
    close: () => Promise.resolve()
  })
};

class PDFGenerationService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF for a playbook
   */
  async generatePlaybookPDF(alert, playbook, user) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Generate HTML content for the playbook
      const htmlContent = this.generatePlaybookHTML(alert, playbook, user);
      
      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin: 0 15mm;">
            <span>OpenSOC Security Playbook - ${playbook.name}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin: 0 15mm;">
            <span>Generated on ${new Date().toLocaleDateString()} | Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate HTML template for playbook PDF
   */
  generatePlaybookHTML(alert, playbook, user) {
    const steps = playbook.steps || [];
    const metadata = playbook.metadata || {};
    const aiMeta = metadata.aiGenerationMetadata || {};
    
    const severityColors = {
      1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444', 5: '#dc2626'
    };

    const priorityColors = {
      'critical': '#dc2626',
      'high': '#ef4444', 
      'medium': '#f59e0b',
      'low': '#10b981'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${playbook.name} - Security Playbook</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: none;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          border-bottom: 3px solid #059669;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #059669;
          margin: 0 0 10px 0;
        }
        .subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }
        .alert-context {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .context-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 15px 0;
          color: #374151;
        }
        .context-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .context-item {
          display: flex;
          flex-direction: column;
        }
        .context-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .context-value {
          font-size: 14px;
          color: #374151;
        }
        .severity-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          background: ${severityColors[alert.severity] || '#6b7280'};
        }
        .playbook-meta {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        .steps-section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 20px 0;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .step {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .step-header {
          background: #f9fafb;
          padding: 15px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .step-number {
          display: inline-block;
          background: #059669;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 14px;
          font-weight: 600;
          margin-right: 10px;
        }
        .step-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          display: inline;
        }
        .step-priority {
          float: right;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }
        .step-body {
          padding: 20px;
        }
        .step-description {
          margin-bottom: 15px;
          color: #4b5563;
        }
        .tools-section, .commands-section {
          margin-top: 15px;
        }
        .subsection-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .tool-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 2px 4px 2px 0;
        }
        .command-block {
          background: #1f2937;
          color: #10b981;
          padding: 10px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 4px 0;
          word-break: break-all;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        .generation-info {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          margin-top: 20px;
          font-size: 12px;
        }
        @media print {
          .step { page-break-inside: avoid; }
          .step-header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1 class="title">${playbook.name}</h1>
        <p class="subtitle">${playbook.description}</p>
      </div>

      <!-- Alert Context -->
      <div class="alert-context">
        <h2 class="context-title">Source Alert Context</h2>
        <div class="context-grid">
          <div class="context-item">
            <span class="context-label">Alert Title</span>
            <span class="context-value">${alert.title}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Severity</span>
            <span class="context-value">
              <span class="severity-badge">Level ${alert.severity}</span>
            </span>
          </div>
          <div class="context-item">
            <span class="context-label">Asset</span>
            <span class="context-value">${alert.assetName || 'N/A'}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Event Time</span>
            <span class="context-value">${alert.eventTime ? new Date(alert.eventTime).toLocaleString() : 'N/A'}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Security Event Type</span>
            <span class="context-value">${alert.securityEventType || 'Pending'}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Source System</span>
            <span class="context-value">${alert.sourceSystem || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Playbook Metadata -->
      <div class="playbook-meta">
        <h2 class="context-title">Playbook Information</h2>
        <div class="meta-grid">
          <div class="context-item">
            <span class="context-label">Category</span>
            <span class="context-value">${playbook.category}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Type</span>
            <span class="context-value">${playbook.playbookType.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Estimated Time</span>
            <span class="context-value">${aiMeta.estimatedTime || 'Variable'}</span>
          </div>
          <div class="context-item">
            <span class="context-label">Total Steps</span>
            <span class="context-value">${steps.length}</span>
          </div>
        </div>

        ${aiMeta.prerequisites && aiMeta.prerequisites.length > 0 ? `
        <div style="margin-top: 15px;">
          <span class="context-label">Prerequisites</span>
          <ul style="margin: 5px 0 0 20px; color: #374151;">
            ${aiMeta.prerequisites.map(prereq => `<li>${prereq}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>

      <!-- Steps Section -->
      <div class="steps-section">
        <h2 class="section-title">Playbook Steps</h2>
        
        ${steps.map((step, index) => `
        <div class="step">
          <div class="step-header">
            <span class="step-number">${index + 1}</span>
            <span class="step-title">${step.title}</span>
            ${step.priority ? `<span class="step-priority" style="background: ${priorityColors[step.priority] || '#6b7280'}">${step.priority.toUpperCase()}</span>` : ''}
          </div>
          <div class="step-body">
            <div class="step-description">${step.description}</div>
            
            ${step.expectedTime ? `
            <div style="margin-bottom: 10px;">
              <strong>Expected Time:</strong> ${step.expectedTime}
            </div>
            ` : ''}

            ${step.tools && step.tools.length > 0 ? `
            <div class="tools-section">
              <div class="subsection-title">Required Tools</div>
              <div>
                ${step.tools.map(tool => `<span class="tool-badge">${tool}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            ${step.commands && step.commands.length > 0 ? `
            <div class="commands-section">
              <div class="subsection-title">Commands</div>
              ${step.commands.map(command => `<div class="command-block">${command}</div>`).join('')}
            </div>
            ` : ''}
          </div>
        </div>
        `).join('')}
      </div>

      <!-- Success Criteria -->
      ${aiMeta.successCriteria && aiMeta.successCriteria.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 class="section-title">Success Criteria</h2>
        <ul style="margin: 0 0 0 20px; color: #374151;">
          ${aiMeta.successCriteria.map(criteria => `<li>${criteria}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Legal Considerations (for investigation playbooks) -->
      ${aiMeta.legalConsiderations && aiMeta.legalConsiderations.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 class="section-title">Legal Considerations</h2>
        <ul style="margin: 0 0 0 20px; color: #374151;">
          ${aiMeta.legalConsiderations.map(consideration => `<li>${consideration}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <div class="generation-info">
          <strong>Document Generation Information</strong><br>
          Generated by: ${user.firstName ? `${user.firstName} ${user.lastName}` : user.username}<br>
          Generated on: ${new Date().toLocaleString()}<br>
          Source Alert ID: ${alert.id}<br>
          Playbook ID: ${playbook.id}
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate filename for the PDF download
   */
  generateFilename(alert, playbook) {
    const playbookType = playbook.playbookType.replace('_', '-');
    const alertTitle = alert.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `${playbookType}-playbook-${alertTitle}-${timestamp}.pdf`;
  }
}

module.exports = new PDFGenerationService();