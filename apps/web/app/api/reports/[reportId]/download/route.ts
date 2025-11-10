import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api/response-factory';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';
import { generateAnalyticsReportPDF } from '@/lib/utils/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/reports/[reportId]/download
 * 
 * Downloads an analytics report
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    // Verify admin authentication
    await getAuthenticatedAdmin(request);
    
    const { reportId } = await params;
    
    if (!reportId) {
      return ResponseFactory.validationError('Report ID is required');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get report data
    const reports = await convex.query(api.queries.analytics.getReports, {
      sessionToken: sessionToken || undefined
    });

    const report = reports?.find((r: any) => r._id === reportId);

    if (!report) {
      return ResponseFactory.notFound('Report not found');
    }

    // Generate PDF content using jsPDF
    const pdfBuffer = generateAnalyticsReportPDF(report, {
      title: report.name || 'Analytics Report',
      subtitle: `Type: ${report.type}`,
      author: 'CribNosh Admin',
      subject: 'Analytics Report',
    });

    const filename = `${report.name?.replace(/[^a-z0-9]/gi, '_') || 'report'}-${reportId}.pdf`;
    
    return ResponseFactory.fileDownload(
      Buffer.from(pdfBuffer),
      filename,
      'application/pdf'
    );
  } catch (error: unknown) {
    logger.error('Error downloading analytics report:', error);
    return ResponseFactory.internalError('Failed to download report');
  }
}


export const GET = withAPIMiddleware(handleGET);

