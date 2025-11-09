import { jsPDF } from 'jspdf';

/**
 * PDF Generation Utility
 * 
 * Provides functions to generate PDF documents for various report types
 */

export interface PDFOptions {
  title: string;
  subtitle?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

/**
 * Generate a GDPR Compliance Report PDF
 */
export function generateGDPRCompliancePDF(data: any, options: PDFOptions = { title: 'GDPR Compliance Report' }): Uint8Array {
  const doc = new jsPDF();
  
  // Set document metadata
  doc.setProperties({
    title: options.title,
    subject: options.subject || 'GDPR Compliance Report',
    author: options.author || 'CribNosh Admin',
    keywords: options.keywords || 'GDPR, compliance, data protection',
  });

  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Subtitle
  if (options.subtitle) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, 105, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Generated date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Compliance Score
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Compliance Score', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const scoreColor = data.complianceScore >= 80 ? [0, 150, 0] : data.complianceScore >= 60 ? [255, 165, 0] : [255, 0, 0];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${data.complianceScore}%`, 20, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // Data Processing Section
  if (data.dataProcessing) {
    yPosition = addSection(doc, yPosition, 'Data Processing', [
      `Lawful Basis: ${data.dataProcessing.lawfulBasis?.length || 0} defined`,
      `Data Categories: ${data.dataProcessing.dataCategories?.length || 0} identified`,
      `Processing Purposes: ${data.dataProcessing.processingPurposes?.length || 0} defined`,
      `Retention Policies: ${data.dataProcessing.dataRetention?.length || 0} configured`,
    ]);
  }

  // User Rights Section
  if (data.userRights) {
    yPosition = addSection(doc, yPosition, 'User Rights', [
      `Right to Access: ${data.userRights.rightToAccess ? '✓' : '✗'}`,
      `Right to Rectification: ${data.userRights.rightToRectification ? '✓' : '✗'}`,
      `Right to Erasure: ${data.userRights.rightToErasure ? '✓' : '✗'}`,
      `Right to Portability: ${data.userRights.rightToPortability ? '✓' : '✗'}`,
      `Right to Restrict Processing: ${data.userRights.rightToRestrictProcessing ? '✓' : '✗'}`,
      `Right to Object: ${data.userRights.rightToObject ? '✓' : '✗'}`,
    ]);
  }

  // Data Protection Section
  if (data.dataProtection) {
    yPosition = addSection(doc, yPosition, 'Data Protection', [
      `Encryption: ${data.dataProtection.encryption ? '✓' : '✗'}`,
      `Access Controls: ${data.dataProtection.accessControls ? '✓' : '✗'}`,
      `Data Minimization: ${data.dataProtection.dataMinimization ? '✓' : '✗'}`,
      `Purpose Limitation: ${data.dataProtection.purposeLimitation ? '✓' : '✗'}`,
      `Storage Limitation: ${data.dataProtection.storageLimitation ? '✓' : '✗'}`,
      `Accuracy: ${data.dataProtection.accuracy ? '✓' : '✗'}`,
    ]);
  }

  // Issues Section
  if (data.issues && data.issues.length > 0) {
    yPosition = addSection(doc, yPosition, 'Compliance Issues', 
      data.issues.slice(0, 10).map((issue: any) => 
        `${issue.severity.toUpperCase()}: ${issue.title}`
      )
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate a Security Compliance Report PDF
 */
export function generateSecurityCompliancePDF(data: any, options: PDFOptions = { title: 'Security Compliance Report' }): Uint8Array {
  const doc = new jsPDF();
  
  doc.setProperties({
    title: options.title,
    subject: options.subject || 'Security Compliance Report',
    author: options.author || 'CribNosh Admin',
    keywords: options.keywords || 'Security, compliance, cybersecurity',
  });

  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 105, yPosition, { align: 'center' });
  yPosition += 10;

  if (options.subtitle) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, 105, yPosition, { align: 'center' });
    yPosition += 10;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Security Score
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Score', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const scoreColor = data.securityScore >= 80 ? [0, 150, 0] : data.securityScore >= 60 ? [255, 165, 0] : [255, 0, 0];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${data.securityScore}%`, 20, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // Authentication Section
  if (data.authentication) {
    yPosition = addSection(doc, yPosition, 'Authentication', [
      `Two-Factor Auth: ${data.authentication.twoFactorAuth ? '✓' : '✗'}`,
      `Password Policy: ${data.authentication.passwordPolicy ? '✓' : '✗'}`,
      `Session Management: ${data.authentication.sessionManagement ? '✓' : '✗'}`,
      `Account Lockout: ${data.authentication.accountLockout ? '✓' : '✗'}`,
      `Biometric Auth: ${data.authentication.biometricAuth ? '✓' : '✗'}`,
      `SSO Enabled: ${data.authentication.ssoEnabled ? '✓' : '✗'}`,
    ]);
  }

  // Vulnerabilities Section
  if (data.vulnerabilities && data.vulnerabilities.length > 0) {
    yPosition = addSection(doc, yPosition, 'Security Vulnerabilities', 
      data.vulnerabilities.slice(0, 10).map((vuln: any) => 
        `${vuln.severity.toUpperCase()}: ${vuln.title}`
      )
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate an Analytics Report PDF
 */
export function generateAnalyticsReportPDF(report: any, options: PDFOptions = { title: 'Analytics Report' }): Uint8Array {
  const doc = new jsPDF();
  
  doc.setProperties({
    title: options.title || report.name || 'Analytics Report',
    subject: options.subject || 'Analytics Report',
    author: options.author || 'CribNosh Admin',
    keywords: options.keywords || 'analytics, report, data',
  });

  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(report.name || options.title, 105, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${report.type}`, 20, yPosition);
  doc.text(`Status: ${report.status}`, 150, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated: ${report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Report Data
  if (report.data) {
    yPosition = addSection(doc, yPosition, 'Report Data', [
      JSON.stringify(report.data, null, 2).substring(0, 500) + '...',
    ]);
  }

  // Parameters
  if (report.parameters) {
    yPosition = addSection(doc, yPosition, 'Parameters', 
      Object.entries(report.parameters).map(([key, value]) => 
        `${key}: ${String(value)}`
      )
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate a Time Tracking Report PDF
 */
export function generateTimeTrackingReportPDF(report: any, options: PDFOptions = { title: 'Time Tracking Report' }): Uint8Array {
  const doc = new jsPDF();
  
  doc.setProperties({
    title: options.title || report.name || 'Time Tracking Report',
    subject: options.subject || 'Time Tracking Report',
    author: options.author || 'CribNosh Admin',
    keywords: options.keywords || 'time tracking, report',
  });

  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(report.name || options.title, 105, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${report.type}`, 20, yPosition);
  yPosition += 10;

  if (report.period) {
    doc.text(`Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated: ${report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Report Data
  if (report.data) {
    yPosition = addSection(doc, yPosition, 'Report Data', [
      JSON.stringify(report.data, null, 2).substring(0, 500) + '...',
    ]);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate a Tax Document PDF
 */
export function generateTaxDocumentPDF(document: any, options: PDFOptions = { title: 'Tax Document' }): Uint8Array {
  const doc = new jsPDF();
  
  doc.setProperties({
    title: options.title || `${document.documentType.toUpperCase()} - ${document.taxYear}`,
    subject: options.subject || 'Tax Document',
    author: options.author || 'CribNosh Payroll',
    keywords: options.keywords || 'tax, payroll, document',
  });

  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(document.documentType.toUpperCase(), 105, yPosition, { align: 'center' });
  yPosition += 8;
  
  doc.setFontSize(16);
  doc.text(`Tax Year ${document.taxYear}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Employee Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (document.employeeName) {
    doc.text(`Name: ${document.employeeName}`, 20, yPosition);
    yPosition += 7;
  }
  doc.text(`Employee ID: ${document.employeeId}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Generated: ${document.generatedAt ? new Date(document.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Summary Section
  if (document.summary) {
    yPosition = addSection(doc, yPosition, 'Summary', 
      Object.entries(document.summary).map(([key, value]) => 
        `${key}: ${String(value)}`
      )
    );
  }

  // Metadata
  if (document.metadata) {
    yPosition = addSection(doc, yPosition, 'Additional Information', 
      Object.entries(document.metadata).slice(0, 10).map(([key, value]) => 
        `${key}: ${String(value)}`
      )
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Helper function to add a section to the PDF
 */
function addSection(doc: jsPDF, yPosition: number, title: string, items: string[]): number {
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPosition);
  yPosition += 8;

  // Section items
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  for (const item of items) {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Split long lines
    const lines = doc.splitTextToSize(`• ${item}`, 170);
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 5 + 2;
  }

  yPosition += 5; // Add spacing after section
  return yPosition;
}

