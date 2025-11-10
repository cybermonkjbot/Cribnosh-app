import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api/response-factory';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';
import { generateSecurityCompliancePDF } from '@/lib/utils/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/security/reports/[...path]
 * 
 * Downloads a security compliance report PDF
 * Matches: /api/security/reports/security-report-{timestamp}.pdf
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    // Verify admin authentication
    await getAuthenticatedAdmin(request);
    
    const { path } = await params;
    const reportId = path?.[0]?.replace('.pdf', '') || 'security-report';
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get security compliance data
    const securityData = await convex.query(api.queries.compliance.getSecurityCompliance, {
      sessionToken: sessionToken || undefined
    });

    if (!securityData) {
      return ResponseFactory.notFound('Security compliance data not found');
    }

    // Generate PDF content using jsPDF
    const pdfBuffer = generateSecurityCompliancePDF(securityData, {
      title: 'Security Compliance Report',
      subtitle: `Report ID: ${reportId}`,
      author: 'CribNosh Admin',
      subject: 'Security Compliance Assessment',
    });

    const filename = `security-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    return ResponseFactory.fileDownload(
      Buffer.from(pdfBuffer),
      filename,
      'application/pdf'
    );
  } catch (error: unknown) {
    logger.error('Error generating security report:', error);
    return ResponseFactory.internalError('Failed to generate security report');
  }
}


export const GET = withAPIMiddleware(handleGET);

