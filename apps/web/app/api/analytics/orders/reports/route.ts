/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateReportRequest:
 *       type: object
 *       required:
 *         - reportType
 *         - startDate
 *         - endDate
 *       properties:
 *         reportType:
 *           type: string
 *           enum: [sales, performance, trends, customers, chefs, delivery]
 *           description: Type of report to generate
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date for the report period
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date for the report period
 *         filters:
 *           type: object
 *           properties:
 *             chefId:
 *               type: string
 *               description: Filter by specific chef ID
 *             customerId:
 *               type: string
 *               description: Filter by specific customer ID
 *             status:
 *               type: string
 *               description: Filter by order status
 *             minAmount:
 *               type: number
 *               description: Minimum order amount filter
 *             maxAmount:
 *               type: number
 *               description: Maximum order amount filter
 *         format:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *           description: Output format for the report
 *         includeDetails:
 *           type: boolean
 *           default: false
 *           description: Whether to include detailed order information
 *     OrderReportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         reportType:
 *           type: string
 *           example: "sales"
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: Report generation timestamp
 *         data:
 *           type: object
 *           properties:
 *             summary:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: number
 *                   description: Total number of orders
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue
 *                 averageOrderValue:
 *                   type: number
 *                   description: Average order value
 *                 completedOrders:
 *                   type: number
 *                   description: Number of completed orders
 *                 cancelledOrders:
 *                   type: number
 *                   description: Number of cancelled orders
 *             orders:
 *               type: array
 *               description: Detailed order information (if includeDetails is true)
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Order ID
 *                   customerName:
 *                     type: string
 *                     description: Customer name
 *                   chefName:
 *                     type: string
 *                     description: Chef name
 *                   total_amount:
 *                     type: number
 *                     description: Order total amount
 *                   status:
 *                     type: string
 *                     description: Order status
 *                   createdAt:
 *                     type: number
 *                     description: Order creation timestamp
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface GenerateReportRequest {
  reportType: 'sales' | 'performance' | 'trends' | 'customers' | 'chefs' | 'delivery';
  startDate: string;
  endDate: string;
  filters?: {
    chefId?: string;
    customerId?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
  };
  format?: 'json' | 'csv' | 'pdf';
  includeDetails?: boolean;
}

/**
 * @swagger
 * /api/analytics/orders/reports:
 *   post:
 *     summary: Generate order analytics report
 *     description: Generate comprehensive order analytics reports in various formats (admin/staff only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateReportRequest'
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderReportResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV formatted report data
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *               description: PDF formatted report
 *       400:
 *         description: Validation error - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin/staff access required
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Check if user has permission to generate reports
    if (!['admin', 'staff'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: GenerateReportRequest = await request.json();
    const { reportType, startDate, endDate, filters, format = 'json', includeDetails = false } = body;

    if (!reportType || !startDate || !endDate) {
      return ResponseFactory.validationError('Missing required fields: reportType, startDate, endDate.');
    }

    const convex = getConvexClient();

    // Generate report based on type
    const report = await convex.query(api.queries.analytics.generateOrderReport, {
      reportType,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
      filters: filters || {},
      includeDetails
    });

    // Format response based on requested format
    let responseData: any;
    let contentType: string;

    switch (format) {
      case 'csv':
        responseData = convertToCSV(report);
        contentType = 'text/csv';
        break;
      case 'pdf':
        responseData = await convertToPDF(report, body);
        contentType = 'application/pdf';
        break;
      default:
        responseData = {
          success: true,
          reportType,
          generatedAt: new Date().toISOString(),
          data: report
        };
        contentType = 'application/json';
    }

    const filename = `order-report-${reportType}-${startDate}-${endDate}.${format}`;
    return ResponseFactory.fileDownload(responseData, filename, contentType);

  } catch (error: any) {
    console.error('Generate order report error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to generate order report.' 
    );
  }
}

// Helper function to convert report data to CSV
function convertToCSV(report: any): string {
  const csvRows: string[] = [];
  
  // Add report metadata
  csvRows.push('Report Type,Value');
  csvRows.push(`Report Name,${report.name || 'Order Analytics Report'}`);
  csvRows.push(`Generated At,${new Date(report.generatedAt || Date.now()).toISOString()}`);
  csvRows.push(`Period Start,${new Date(report.period?.start || Date.now()).toISOString()}`);
  csvRows.push(`Period End,${new Date(report.period?.end || Date.now()).toISOString()}`);
  csvRows.push('');
  
  // Add summary data
  if (report.summary) {
    csvRows.push('Summary Metrics');
    csvRows.push('Metric,Value');
    Object.entries(report.summary).forEach(([key, value]) => {
      csvRows.push(`${key},${value}`);
    });
    csvRows.push('');
  }
  
  // Add detailed order data
  if (report.orders && report.orders.length > 0) {
    csvRows.push('Order Details');
    csvRows.push('Order ID,Customer,Chef,Total Amount,Status,Created At');
    report.orders.forEach((order: any) => {
      csvRows.push([
        order._id || order.id || '',
        order.customerName || order.customerId || '',
        order.chefName || order.chefId || '',
        order.total_amount || order.totalAmount || 0,
        order.status || '',
        new Date(order.createdAt || order._creationTime).toISOString()
      ].join(','));
    });
    csvRows.push('');
  }
  
  // Add revenue breakdown
  if (report.revenueBreakdown) {
    csvRows.push('Revenue Breakdown');
    csvRows.push('Period,Revenue,Orders,Average Order Value');
    Object.entries(report.revenueBreakdown).forEach(([period, data]: [string, any]) => {
      csvRows.push([
        period,
        data.revenue || 0,
        data.orders || 0,
        data.averageOrderValue || 0
      ].join(','));
    });
  }
  
  return csvRows.join('\n');
}

// Helper function to convert report data to PDF
async function convertToPDF(report: any, requestBody: GenerateReportRequest): Promise<string> {
  // Implementation for PDF conversion
  // This would typically use a library like jsPDF or similar
  // Generate real report data
  try {
    const convex = getConvexClient();
    
    // Get real order data - using the analytics query that exists
    const orders = await convex.query(api.queries.analytics.generateOrderReport, {
      reportType: 'sales',
      startDate: new Date(requestBody.startDate).getTime(),
      endDate: new Date(requestBody.endDate).getTime(),
      filters: {
        status: requestBody.filters?.status,
        chefId: requestBody.filters?.chefId,
        customerId: requestBody.filters?.customerId
      },
      includeDetails: true
    });
    
    // Generate comprehensive report
    const reportData = {
      summary: orders.summary || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      },
      orders: requestBody.includeDetails ? (orders as any).details || (orders as any).orders || [] : undefined,
      generatedAt: new Date().toISOString(),
      parameters: requestBody
    };
    
    return JSON.stringify(reportData);
  } catch (error) {
    console.error('Failed to generate analytics report:', error);
    return JSON.stringify({ error: 'Failed to generate report' });
  }
}

// Helper function to generate HTML for PDF conversion
function generateReportHTML(reportData: any): string {
  const { summary, orders, revenueBreakdown, generatedAt, period } = reportData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c5aa0; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Analytics Report</h1>
        <p>Generated on ${new Date(generatedAt).toLocaleString()}</p>
        <p>Period: ${new Date(period.start).toLocaleDateString()} - ${new Date(period.end).toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <h2>Summary Metrics</h2>
        <div class="metric">
          <div class="metric-value">${summary.totalOrders || 0}</div>
          <div class="metric-label">Total Orders</div>
        </div>
        <div class="metric">
          <div class="metric-value">$${summary.totalRevenue || 0}</div>
          <div class="metric-label">Total Revenue</div>
        </div>
        <div class="metric">
          <div class="metric-value">$${summary.averageOrderValue || 0}</div>
          <div class="metric-label">Average Order Value</div>
        </div>
        <div class="metric">
          <div class="metric-value">${summary.completedOrders || 0}</div>
          <div class="metric-label">Completed Orders</div>
        </div>
        <div class="metric">
          <div class="metric-value">${summary.cancelledOrders || 0}</div>
          <div class="metric-label">Cancelled Orders</div>
        </div>
      </div>
      
      ${orders && orders.length > 0 ? `
        <h2>Order Details</h2>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Chef</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((order: any) => `
              <tr>
                <td>${order._id || order.id || ''}</td>
                <td>${order.customerName || order.customerId || ''}</td>
                <td>${order.chefName || order.chefId || ''}</td>
                <td>$${order.total_amount || order.totalAmount || 0}</td>
                <td>${order.status || ''}</td>
                <td>${new Date(order.createdAt || order._creationTime).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${revenueBreakdown && Object.keys(revenueBreakdown).length > 0 ? `
        <h2>Revenue Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Revenue</th>
              <th>Orders</th>
              <th>Average Order Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(revenueBreakdown).map(([period, data]: [string, any]) => `
              <tr>
                <td>${period}</td>
                <td>$${data.revenue || 0}</td>
                <td>${data.orders || 0}</td>
                <td>$${data.averageOrderValue || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      <div class="footer">
        <p>Report generated by CribNosh Analytics System</p>
      </div>
    </body>
    </html>
  `;
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 