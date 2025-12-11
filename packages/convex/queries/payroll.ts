import { requireStaff } from '../utils/auth';
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

export const getTaxDocuments = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const documents = await ctx.db
      .query('taxDocuments')
      .order('desc')
      .collect();

    return documents.map(doc => ({
      _id: doc._id,
      employeeId: doc.employeeId,
      documentType: doc.documentType,
      status: doc.status,
      generatedAt: doc.generatedAt,
      taxYear: doc.taxYear,
      fileUrl: doc.fileUrl,
      metadata: doc.metadata,
      createdAt: doc._creationTime
    }));
  },
});

export const getTaxDocumentTemplates = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    return [
      {
        id: 'w2',
        name: 'W-2 Form',
        description: 'Wage and Tax Statement',
        category: 'Federal',
        required: true,
        dueDate: 'January 31st'
      },
      {
        id: '1099',
        name: '1099-MISC',
        description: 'Miscellaneous Income',
        category: 'Federal',
        required: false,
        dueDate: 'January 31st'
      },
      {
        id: 'state_tax',
        name: 'State Tax Form',
        description: 'State Income Tax Document',
        category: 'State',
        required: true,
        dueDate: 'January 31st'
      },
      {
        id: 'local_tax',
        name: 'Local Tax Form',
        description: 'Local Income Tax Document',
        category: 'Local',
        required: false,
        dueDate: 'January 31st'
      }
    ];
  },
});

export const getPayrollStats = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const documents = await ctx.db.query('taxDocuments').collect();
    const employees = await ctx.db.query('users').filter(q => q.eq(q.field('status'), 'active')).collect();
    
    const currentYear = new Date().getFullYear();
    const currentYearDocs = documents.filter(doc => doc.taxYear === currentYear);
    
    return {
      totalDocuments: documents.length,
      currentYearDocuments: currentYearDocs.length,
      totalEmployees: employees.length,
      documentsByStatus: {
        generated: currentYearDocs.filter(doc => doc.status === 'generated').length,
        sent: currentYearDocs.filter(doc => doc.status === 'sent').length,
        downloaded: currentYearDocs.filter(doc => doc.status === 'downloaded').length
      },
      documentsByType: {
        p60: currentYearDocs.filter(doc => doc.documentType === 'p60').length,
        p45: currentYearDocs.filter(doc => doc.documentType === 'p45').length,
        p11d: currentYearDocs.filter(doc => doc.documentType === 'p11d').length,
        selfAssessment: currentYearDocs.filter(doc => doc.documentType === 'self_assessment').length,
        payslip: currentYearDocs.filter(doc => doc.documentType === 'payslip').length,
        payslipNg: currentYearDocs.filter(doc => doc.documentType === 'payslip_ng').length,
        taxClearance: currentYearDocs.filter(doc => doc.documentType === 'tax_clearance').length,
        nhfCertificate: currentYearDocs.filter(doc => doc.documentType === 'nhf_certificate').length,
        nhisCertificate: currentYearDocs.filter(doc => doc.documentType === 'nhis_certificate').length,
        pensionCertificate: currentYearDocs.filter(doc => doc.documentType === 'pension_certificate').length
      },
      documentsByCountry: {} // Country field not available in current schema
    };
  },
});

export const getEmployeePayrollHistory = query({
  args: { employeeId: v.id('users') },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query('taxDocuments')
      .filter(q => q.eq(q.field('employeeId'), args.employeeId))
      .order('desc')
      .collect();

    return documents.map(doc => ({
      _id: doc._id,
      documentType: doc.documentType,
      status: doc.status,
      generatedAt: doc.generatedAt,
      taxYear: doc.taxYear,
      fileUrl: doc.fileUrl
    }));
  },
});

export const getPayrollReports = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    employeeId: v.optional(v.id('users')),
    documentType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('taxDocuments');
    
    if (args.employeeId) {
      query = query.filter(q => q.eq(q.field('employeeId'), args.employeeId));
    }
    
    if (args.documentType) {
      query = query.filter(q => q.eq(q.field('documentType'), args.documentType));
    }
    
    if (args.startDate) {
      query = query.filter(q => q.gte(q.field('generatedAt'), args.startDate!));
    }
    
    if (args.endDate) {
      query = query.filter(q => q.lte(q.field('generatedAt'), args.endDate!));
    }
    
    const documents = await query.order('desc').collect();
    
    return {
      documents: documents.map(doc => ({
        _id: doc._id,
        employeeId: doc.employeeId,
        documentType: doc.documentType,
        status: doc.status,
        generatedAt: doc.generatedAt,
        taxYear: doc.taxYear,
        fileUrl: doc.fileUrl
      })),
      summary: {
        totalDocuments: documents.length,
        byStatus: documents.reduce((acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byType: documents.reduce((acc, doc) => {
          acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCountry: {} // Country field not available in current schema
      }
    };
  },
});