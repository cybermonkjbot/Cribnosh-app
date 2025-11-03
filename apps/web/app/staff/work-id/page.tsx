"use client";
import { GlassCard } from '@/components/ui/glass-card';
import { api } from '@/convex/_generated/api';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useQuery } from 'convex/react';
import { ArrowLeft, Badge, Download, Printer, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

declare module 'qrcode';

export default function WorkIdPage() {
  const { staff, loading } = useStaffAuth();
  const staffId = staff?.email || null;
  const workId = useQuery(api.queries.staff.getWorkIdByUser, 
    staffId ? { userId: staffId as any } : "skip"
  );
  const [printMode, setPrintMode] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const qrRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (workId && workId.qrCode) {
      import('qrcode').then((mod) => {
        const QRCode = mod.default || mod;
        QRCode.toDataURL(workId.qrCode, { width: 160 }, (err: Error | null, url: string) => {
          if (!err) setQrUrl(url);
        });
      });
    }
  }, [workId]);

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const handleDownload = async () => {
    if (!workId) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [320, 500] });
    doc.setFillColor('#fff8f1');
    doc.rect(0, 0, 320, 500, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CribNosh Work ID', 160, 40, { align: 'center' });
    if (workId.photoUrl) {
      doc.addImage(workId.photoUrl, 'JPEG', 120, 60, 80, 80, undefined, 'FAST');
    }
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${workId.name}`, 30, 170);
    doc.text(`Position: ${workId.position}`, 30, 195);
    doc.text(`Department: ${workId.department}`, 30, 220);
    doc.text(`Employee ID: ${workId.employeeId}`, 30, 245);
    doc.text(`Work ID: ${workId.workIdNumber}`, 30, 270);
    doc.text(`Status: ${workId.status}`, 30, 295);
    doc.text(`Issued: ${new Date(workId.issuedAt).toLocaleDateString()}`, 30, 320);
    doc.text(`Expires: ${new Date(workId.expiresAt).toLocaleDateString()}`, 30, 345);
    if (qrUrl) {
      doc.addImage(qrUrl, 'PNG', 110, 370, 100, 100);
    }
    doc.setFontSize(10);
    doc.setTextColor('#888');
    doc.text('Scan QR code to verify', 160, 485, { align: 'center' });
    doc.save(`WorkID-${workId.workIdNumber}.pdf`);
  };

  const handleRequestWorkId = () => {
    alert('Request Work ID feature coming soon!');
  };

  if (loading || !staffId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center text-gray-500 font-satoshi">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${printMode ? 'print:bg-white' : ''}`}> 
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/staff/portal" className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-asgard text-gray-900">Your Work ID</h1>
          </div>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-8">
        {workId ? (
          <GlassCard className="p-8 relative">
            <div className="flex flex-col items-center">
              {workId.photoUrl && (
                <img src={workId.photoUrl} alt="Staff Photo" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-amber-200" />
              )}
              <h2 className="text-2xl font-asgard text-gray-900 mb-1">{workId.name}</h2>
              <div className="text-sm font-satoshi text-gray-700 mb-2">{workId.position} &bull; {workId.department}</div>
              <div className="flex flex-col items-center mb-4">
                <span className="text-xs font-satoshi text-gray-500">Employee ID: <span className="font-medium text-gray-900">{workId.employeeId}</span></span>
                <span className="text-xs font-satoshi text-gray-500">Work ID: <span className="font-medium text-gray-900">{workId.workIdNumber}</span></span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="w-5 h-5 text-amber-600" />
                <span className={`text-xs font-satoshi px-2 py-1 rounded ${workId.status === 'active' ? 'bg-green-100 text-green-700' : workId.status === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>{workId.status.charAt(0).toUpperCase() + workId.status.slice(1)}</span>
              </div>
              <div className="flex flex-col items-center mb-4">
                <span className="text-xs font-satoshi text-gray-500">Issued: <span className="font-medium text-gray-900">{new Date(workId.issuedAt).toLocaleDateString()}</span></span>
                <span className="text-xs font-satoshi text-gray-500">Expires: <span className="font-medium text-gray-900">{new Date(workId.expiresAt).toLocaleDateString()}</span></span>
              </div>
              <div className="flex flex-col items-center mb-4">
                {qrUrl ? (
                  <img ref={qrRef} src={qrUrl} alt="QR Code" className="w-32 h-32 mb-2" />
                ) : (
                  <QrCode className="w-16 h-16 text-amber-600 mb-2" />
                )}
                <span className="text-xs font-satoshi text-gray-500">Scan for verification</span>
              </div>
              <div className="flex gap-4 mt-4 print:hidden">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg font-satoshi hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-label="Print Work ID"
                >
                  <Printer className="w-5 h-5 mr-2" /> Print
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-satoshi hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Download Work ID as PDF"
                >
                  <Download className="w-5 h-5 mr-2" /> Download
                </button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-8 text-center">
            <h2 className="text-xl font-asgard text-gray-900 mb-2">No Work ID Found</h2>
            <p className="text-gray-700 font-satoshi mb-4">You do not have a digital Work ID yet. If you believe this is an error, please contact HR or request one below.</p>
            <button
              onClick={handleRequestWorkId}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg font-satoshi hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Request Work ID"
            >
              <Badge className="w-5 h-5 mr-2" /> Request Work ID
            </button>
          </GlassCard>
        )}
      </div>
    </div>
  );
} 