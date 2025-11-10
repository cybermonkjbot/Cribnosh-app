import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api/response-factory';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';
import { generateGDPRCompliancePDF } from '@/lib/utils/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/compliance/reports/[...path]
 * 
 * Downloads a GDPR compliance report PDF
 * Matches: /api/compliance/reports/compliance-report-{timestamp}.pdf
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    // Verify admin authentication
    await getAuthenticatedAdmin(request);
    
    const { path } = await params;
    const reportId = path?.[0]?.replace('.pdf', '') || 'compliance-report';
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get GDPR compliance data
    const gdprData = await convex.query(api.queries.compliance.getGDPRCompliance, {
      sessionToken: sessionToken || undefined
    });

    if (!gdprData) {
      return ResponseFactory.notFound('Compliance data not found');
    }

    // Generate PDF content using jsPDF
    const pdfBuffer = generateGDPRCompliancePDF(gdprData, {
      title: 'GDPR Compliance Report',
      subtitle: `Report ID: ${reportId}`,
      author: 'CribNosh Admin',
      subject: 'GDPR Compliance Assessment',
    });

    const filename = `gdpr-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    return ResponseFactory.fileDownload(
      Buffer.from(pdfBuffer),
      filename,
      'application/pdf'
    );
  } catch (error: unknown) {
    logger.error('Error generating compliance report:', error);
    return ResponseFactory.internalError('Failed to generate compliance report');
  }
}


export const GET = withAPIMiddleware(handleGET);

