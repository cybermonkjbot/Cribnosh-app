import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { ResponseFactory } from '@/lib/api/response-factory';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { generateTaxDocumentPDF } from '@/lib/utils/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payroll/tax-documents/[documentId]/download
 * 
 * Downloads a tax document PDF
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
): Promise<NextResponse> {
  try {
    // Verify admin authentication
    await getAuthenticatedAdmin(request);
    
    const { documentId } = await params;
    
    if (!documentId) {
      return ResponseFactory.validationError('Document ID is required');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get tax document data
    const taxDocuments = await convex.query(api.queries.payroll.getTaxDocuments, {
      sessionToken: sessionToken || undefined
    });

    const document = taxDocuments?.find((d: any) => d._id === documentId);

    if (!document) {
      return ResponseFactory.notFound('Tax document not found');
    }

    // Generate PDF content using jsPDF
    const pdfBuffer = generateTaxDocumentPDF(document, {
      title: `${document.documentType.toUpperCase()} - ${document.taxYear}`,
      subtitle: document.metadata?.employeeName || 'Tax Document',
      author: 'CribNosh Payroll',
      subject: 'Tax Document',
    });

    const filename = `${document.documentType}-${document.taxYear}-${document.metadata?.employeeName?.replace(/[^a-z0-9]/gi, '_') || 'employee'}.pdf`;
    
    return ResponseFactory.fileDownload(
      Buffer.from(pdfBuffer),
      filename,
      'application/pdf'
    );
  } catch (error: unknown) {
    logger.error('Error downloading tax document:', error);
    return ResponseFactory.internalError('Failed to download tax document');
  }
}


export const GET = withAPIMiddleware(withErrorHandling(handleGET));

