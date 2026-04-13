import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const generateInvoice = (order: any, profile: any) => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [37, 99, 235]; // blue-600
  const textColor = [55, 65, 81]; // gray-700
  const lightGray = [243, 244, 246]; // gray-100

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ProxyMama', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', 170, 25);

  // Invoice Details
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  
  const invoiceDate = format(new Date(), 'MMM dd, yyyy');
  const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  doc.text(`Invoice Number: ${invoiceNumber}`, 14, 50);
  doc.text(`Date: ${invoiceDate}`, 14, 56);
  
  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(profile.displayName || 'Customer', 14, 76);
  doc.text(profile.email, 14, 82);
  if (profile.address) doc.text(profile.address, 14, 88);

  // Table
  const tableData = [
    [
      '1',
      order.planTitle || 'Proxy Subscription',
      `৳${(order.amount || 0).toFixed(2)}`,
      `৳${(order.amount || 0).toFixed(2)}`
    ]
  ];

  if (order.proxyDetails) {
    tableData.push(['', `Proxy: ${order.proxyDetails}`, '', '']);
  }

  (doc as any).autoTable({
    startY: 100,
    head: [['Qty', 'Description', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      textColor: textColor,
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 140, finalY + 15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`৳${(order.amount || 0).toFixed(2)}`, 170, finalY + 15);

  // Footer
  doc.setTextColor(156, 163, 175); // gray-400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('ProxyMama - Premium Proxy Services', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`ProxyMama-Invoice-${invoiceNumber}.pdf`);
};
