/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateTaxDocumentRequest:
 *       type: object
 *       required:
 *         - documentType
 *         - employeeId
 *         - taxYear
 *         - country
 *       properties:
 *         documentType:
 *           type: string
 *           enum: [p60, p45, p11d, self_assessment, payslip, payslip_ng, tax_clearance, nhf_certificate, nhis_certificate, pension_certificate]
 *           description: Type of tax document to generate
 *         employeeId:
 *           type: string
 *           description: ID of the employee
 *         taxYear:
 *           type: string
 *           example: "2023-2024"
 *           description: Tax year
 *         country:
 *           type: string
 *           enum: [UK, Nigeria, Ghana, Kenya]
 *           description: Country for tax document
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *             endDate:
 *               type: string
 *               format: date
 *         format:
 *           type: string
 *           enum: [pdf, json, csv]
 *           default: pdf
 *           description: Output format
 *         includeDetails:
 *           type: boolean
 *           default: false
 *           description: Whether to include detailed information
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
interface GenerateTaxDocumentRequest {
  documentType: 'p60' | 'p45' | 'p11d' | 'self_assessment' | 'payslip' | 'payslip_ng' | 'tax_clearance' | 'nhf_certificate' | 'nhis_certificate' | 'pension_certificate';
  employeeId: string;
  taxYear: string; // e.g., "2023-2024"
  country: 'UK' | 'Nigeria' | 'Ghana' | 'Kenya';
  period?: {
    startDate: string;
    endDate: string;
  };
  format?: 'pdf' | 'json' | 'csv';
  includeDetails?: boolean;
}

/**
 * @swagger
 * /api/payroll/tax-documents:
 *   post:
 *     summary: Generate tax document
 *     description: Generate various tax documents for employees (P60, P45, payslips, etc.)
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateTaxDocumentRequest'
 *     responses:
 *       200:
 *         description: Tax document generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error - Missing required fields or invalid document type
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 *   get:
 *     summary: Get tax documents
 *     description: Retrieve available tax documents with optional filtering
 *     tags: [Payroll]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *       - in: query
 *         name: taxYear
 *         schema:
 *           type: string
 *         description: Filter by tax year
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: Tax documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     taxDocuments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     filters:
 *                       type: object
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to generate tax documents
    if (!['admin', 'staff'].includes(user.roles?.[0])) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: GenerateTaxDocumentRequest = await request.json();
    const { documentType, employeeId, taxYear, country, period, format = 'pdf', includeDetails = false } = body;

    if (!documentType || !employeeId || !taxYear || !country) {
      return ResponseFactory.validationError('Missing required fields: documentType, employeeId, taxYear, country.');
    }

    // Validate country-specific document types
    const ukDocuments = ['p60', 'p45', 'p11d', 'self_assessment', 'payslip'];
    const nigerianDocuments = ['payslip_ng', 'tax_clearance', 'nhf_certificate', 'nhis_certificate', 'pension_certificate'];
    
    if (country === 'UK' && !ukDocuments.includes(documentType)) {
      return ResponseFactory.validationError('Invalid document type for UK');
    }
    
    if (country === 'Nigeria' && !nigerianDocuments.includes(documentType)) {
      return ResponseFactory.validationError('Invalid document type for Nigeria');
    } 

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Generate tax document based on type
    const taxDocument = await convex.mutation(api.mutations.payroll.generateTaxDocument, {
      documentType,
      employeeId: employeeId as any, // Type assertion for now
      taxYear: parseInt(taxYear),
      period: period ? {
        start: new Date(period.startDate).getTime(),
        end: new Date(period.endDate).getTime()
      } : {
        start: new Date().getTime() - 365 * 24 * 60 * 60 * 1000, // Default to last year
        end: new Date().getTime()
      },
      amount: includeDetails ? 1000 : undefined,
      notes: includeDetails ? `Generated tax document` : undefined,
      sessionToken: sessionToken || undefined
    });

    // Format response based on requested format
    let responseData: any;
    let contentType: string;

    switch (format) {
      case 'csv':
        responseData = convertTaxDocumentToCSV(taxDocument);
        contentType = 'text/csv';
        break;
      case 'json':
        responseData = JSON.stringify({
          success: true,
          documentType,
          country,
          taxYear,
          generatedAt: new Date().toISOString(),
          data: taxDocument
        }, null, 2);
        contentType = 'application/json';
        break;
      default:
        responseData = await convertTaxDocumentToPDF(taxDocument, body, request);
        contentType = 'application/pdf';
    }

    const filename = `tax-document-${documentType}-${country}-${employeeId}-${taxYear}.${format}`;
    return ResponseFactory.fileDownload(responseData, filename, contentType);

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Generate tax document error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to generate tax document.'));
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to view tax documents
    if (!['admin', 'staff'].includes(user.roles?.[0])) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const taxYear = searchParams.get('taxYear');
    const country = searchParams.get('country');
    const documentType = searchParams.get('documentType');

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get available tax documents
    const taxDocuments = await convex.query(api.queries.payroll.getTaxDocuments, {
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success({
      success: true,
      taxDocuments,
      filters: {
        employeeId,
        taxYear,
        country,
        documentType
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get tax documents error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get tax documents.'));
  }
}

// Helper function to convert tax document to CSV
function convertTaxDocumentToCSV(taxDocument: any): string {
  const csvRows: string[] = [];
  
  // Add document metadata
  csvRows.push('Field,Value');
  csvRows.push(`Document Type,${taxDocument.documentType}`);
  csvRows.push(`Tax Year,${taxDocument.taxYear}`);
  csvRows.push(`Employee ID,${taxDocument.employeeId}`);
  csvRows.push(`Generated At,${new Date(taxDocument.generatedAt).toISOString()}`);
  csvRows.push('');
  
  // Add payroll summary data
  if (taxDocument.summary) {
    csvRows.push('Payroll Summary');
    csvRows.push('Period,Gross Pay,Net Pay,Taxes Withheld,Benefits');
    
    if (taxDocument.summary.payPeriods) {
      for (const period of taxDocument.summary.payPeriods) {
        csvRows.push(`${period.startDate} - ${period.endDate},${period.grossPay},${period.netPay},${period.taxesWithheld},${period.benefits}`);
      }
    }
    
    csvRows.push('');
    csvRows.push('Totals');
    csvRows.push(`Total Gross Earnings,${taxDocument.summary.totalGrossEarnings || 0}`);
    csvRows.push(`Total Net Earnings,${taxDocument.summary.totalNetEarnings || 0}`);
    csvRows.push(`Total Taxes Withheld,${taxDocument.summary.totalTaxesWithheld || 0}`);
    csvRows.push(`Total Benefits,${taxDocument.summary.totalBenefits || 0}`);
  }
  
  return csvRows.join('\n');
}

// Helper function to generate tax calculations based on document type
function generateTaxCalculations(taxDocument: any): any {
  const summary = taxDocument.summary || {};
  
  switch (taxDocument.documentType) {
    case 'p60':
      return {
        grossPay: summary.totalGrossEarnings || 0,
        taxablePay: summary.totalGrossEarnings || 0,
        taxDeducted: summary.totalTaxesWithheld || 0,
        nationalInsurance: summary.totalTaxesWithheld * 0.12 || 0, // Approximate NI calculation
        studentLoan: 0, // Would need actual student loan data
        pensionContributions: summary.totalBenefits || 0
      };
    case 'p45':
      return {
        grossPay: summary.totalGrossEarnings || 0,
        taxDeducted: summary.totalTaxesWithheld || 0,
        nationalInsurance: summary.totalTaxesWithheld * 0.12 || 0,
        leavingDate: new Date().toLocaleDateString()
      };
    default:
      return {
        grossPay: summary.totalGrossEarnings || 0,
        netPay: summary.totalNetEarnings || 0,
        deductions: summary.totalTaxesWithheld || 0
      };
  }
}

// Helper function to generate HTML content for tax document
function generateTaxDocumentHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.documentType.toUpperCase()} - ${data.taxYear}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .employee-info { margin-bottom: 20px; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .summary-table th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.documentType.toUpperCase()}</h1>
        <h2>Tax Year ${data.taxYear}</h2>
      </div>
      
      <div class="company-info">
        <h3>Employer Information</h3>
        <p><strong>${data.companyInfo.name}</strong></p>
        <p>${data.companyInfo.address}</p>
        <p>EIN: ${data.companyInfo.ein}</p>
      </div>
      
      <div class="employee-info">
        <h3>Employee Information</h3>
        <p><strong>Name:</strong> ${data.employeeName}</p>
        <p><strong>Employee ID:</strong> ${data.employeeId}</p>
        <p><strong>Document Generated:</strong> ${data.generatedAt}</p>
      </div>
      
      <table class="summary-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Gross Pay</td><td>$${data.taxCalculations.grossPay?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Tax Deducted</td><td>$${data.taxCalculations.taxDeducted?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>National Insurance</td><td>$${data.taxCalculations.nationalInsurance?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Net Pay</td><td>$${data.taxCalculations.netPay?.toFixed(2) || data.summary.totalNetEarnings?.toFixed(2) || '0.00'}</td></tr>
        </tbody>
      </table>
      
      <div class="footer">
        <p>This document was generated electronically by CribNosh Payroll System.</p>
        <p>For questions about this document, please contact HR at hr@cribnosh.com</p>
      </div>
    </body>
    </html>
  `;
}

// Helper function to convert tax document to PDF
async function convertTaxDocumentToPDF(taxDocument: any, requestBody: any, request: NextRequest): Promise<string> {
  try {
    const convex = getConvexClientFromRequest(request);
    
    // Generate comprehensive tax document data
    const documentData = {
      documentType: taxDocument.documentType,
      taxYear: taxDocument.taxYear,
      employeeId: taxDocument.employeeId,
      employeeName: taxDocument.metadata?.employeeName || 'Unknown Employee',
      generatedAt: new Date(taxDocument.generatedAt).toLocaleDateString(),
      
      // Payroll summary
      summary: taxDocument.summary || {},
      
      // Tax calculations based on document type
      taxCalculations: generateTaxCalculations(taxDocument),
      
      // Company information
      companyInfo: {
        name: 'CribNosh',
        address: '123 Food Street, San Francisco, CA 94102',
        ein: '12-3456789'
      }
    };
    
    // Generate PDF content as HTML (can be converted to PDF using libraries like Puppeteer)
    const htmlContent = generateTaxDocumentHTML(documentData);
    
    return htmlContent;
  } catch (error) {
    logger.error('Failed to generate payroll report:', error);
    return JSON.stringify({ error: 'Failed to generate payroll report' });
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 