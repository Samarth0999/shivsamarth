import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format currency
const formatInr = (amount) => {
  return 'Rs. ' + Number(amount || 0).toLocaleString('en-IN');
};

// 1. Export Fees Collection Report PDF
export function exportFeesCollectionPDF(data, metadata = {}) {
  const doc = new jsPDF('p', 'pt', 'a4');
  const primaryColor = [30, 41, 59]; // slate-800
  const accentColor = [37, 99, 235]; // blue-600

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 595.28, 70, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata.schoolName || 'APEX PRO DRIVING ACADEMY', 40, 32);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL FEES COLLECTION REPORT', 40, 50);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 420, 50);

  // Filter & Summary info
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Branch: ${metadata.branchName || 'All Branches'}`, 40, 95);
  doc.text(`Period: ${data.date_range?.start || 'All'} to ${data.date_range?.end || 'All'}`, 240, 95);
  doc.text(`Total Collections: ${formatInr(data.total_collection)}`, 420, 95);

  // Mode breakdown box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, 110, 515, 30, 4, 4, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const modes = Object.entries(data.mode_breakdown || {})
    .map(([mode, amt]) => `${mode}: ${formatInr(amt)}`)
    .join('   |   ');
  doc.text(modes || 'No collections recorded', 50, 128);

  // Table
  const tableRows = (data.records || []).map((row, idx) => [
    idx + 1,
    row.receipt_no,
    row.payment_date,
    row.student_name,
    row.enroll_id,
    row.payment_mode,
    formatInr(row.amount),
    row.collected_by_name || 'Staff'
  ]);

  autoTable(doc, {
    startY: 155,
    head: [['#', 'Receipt No', 'Date', 'Student Name', 'Enroll ID', 'Mode', 'Amount', 'Collected By']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: 33 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 }
  });

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - Confidential Financial Document`, 40, 820);
  }

  doc.save(`Fees_Collection_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 2. Export Pending Fees & Defaulters Report PDF
export function exportDefaultersPDF(data, metadata = {}) {
  const doc = new jsPDF('p', 'pt', 'a4');
  const primaryColor = [185, 28, 28]; // red-700
  const headerBg = [30, 41, 59];

  // Header
  doc.setFillColor(...headerBg);
  doc.rect(0, 0, 595.28, 70, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata.schoolName || 'APEX PRO DRIVING ACADEMY', 40, 32);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('PENDING FEES & DEFAULTERS RISK REPORT', 40, 50);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 420, 50);

  // Summary box
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Branch: ${metadata.branchName || 'All Branches'}`, 40, 95);
  doc.text(`Total Defaulters: ${data.total_defaulters}`, 240, 95);
  doc.text(`Total Pending: ${formatInr(data.total_pending_amount)}`, 400, 95);

  // Risk Pill summary
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(40, 110, 515, 30, 4, 4, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  const riskTxt = `HIGH RISK: ${data.risk_summary?.high_risk || 0}   |   MEDIUM RISK: ${data.risk_summary?.medium_risk || 0}   |   LOW RISK: ${data.risk_summary?.low_risk || 0}`;
  doc.text(riskTxt, 50, 128);

  const tableRows = (data.records || []).map((row, idx) => [
    idx + 1,
    row.enroll_id,
    row.student_name,
    row.student_phone,
    `${row.days_completed}/${row.total_course_days}`,
    row.is_day_10_warning ? 'DAY 10 FLAG' : `${row.remaining_days}d left`,
    row.risk_level,
    formatInr(row.net_total_fee),
    formatInr(row.pending_balance)
  ]);

  autoTable(doc, {
    startY: 155,
    head: [['#', 'Enroll ID', 'Student Name', 'Phone', 'Days Done', 'Status', 'Risk', 'Net Fee', 'Pending']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: 33 },
    alternateRowStyles: { fillColor: [255, 245, 245] },
    margin: { left: 40, right: 40 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - Driving School Fee Recovery Report`, 40, 820);
  }

  doc.save(`Pending_Fees_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 3. Export Operational Expenses Report PDF
export function exportExpensesPDF(data, metadata = {}) {
  const doc = new jsPDF('p', 'pt', 'a4');
  const accentColor = [15, 118, 110]; // teal-700
  const headerBg = [30, 41, 59];

  doc.setFillColor(...headerBg);
  doc.rect(0, 0, 595.28, 70, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata.schoolName || 'APEX PRO DRIVING ACADEMY', 40, 32);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('OPERATIONAL EXPENSES REPORT', 40, 50);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 420, 50);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Branch: ${metadata.branchName || 'All Branches'}`, 40, 95);
  doc.text(`Total Entries: ${data.total_entries}`, 240, 95);
  doc.text(`Total Expenses: ${formatInr(data.total_expenses)}`, 400, 95);

  const tableRows = (data.records || []).map((row, idx) => [
    idx + 1,
    row.date,
    row.category,
    row.vehicle_reg ? `${row.vehicle_model} (${row.vehicle_reg})` : 'General / Office',
    row.payment_mode,
    row.receipt_ref || '-',
    formatInr(row.amount),
    row.logged_by_name || 'Staff'
  ]);

  autoTable(doc, {
    startY: 120,
    head: [['#', 'Date', 'Category', 'Vehicle / Tag', 'Mode', 'Receipt Ref', 'Amount', 'Logged By']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: 33 },
    margin: { left: 40, right: 40 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - Internal Expense Audit`, 40, 820);
  }

  doc.save(`Expenses_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 4. Export Student Admission & Fee Receipt Slip PDF
export function exportStudentReceiptPDF(student, payment, metadata = {}) {
  const doc = new jsPDF('p', 'pt', 'a5'); // A5 receipt format
  const headerBg = [30, 41, 59];

  doc.setFillColor(...headerBg);
  doc.rect(0, 0, 420, 60, 'F');

  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata.schoolName || 'APEX PRO DRIVING ACADEMY', 25, 28);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 25, 46);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${payment.receipt_no}`, 25, 85);
  doc.text(`Date: ${payment.payment_date || new Date().toISOString().split('T')[0]}`, 260, 85);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Enroll ID: ${student.enroll_id}`, 25, 105);
  doc.text(`Student Name: ${student.name}`, 25, 122);
  doc.text(`Contact: ${student.phone}`, 25, 139);
  doc.text(`Branch: ${student.branch_name || 'Main Branch'}`, 260, 105);
  doc.text(`Course: ${student.course_name || 'Car Driving Package'}`, 25, 156);

  // Financial summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(25, 175, 370, 95, 4, 4, 'F');

  doc.setFont('helvetica', 'normal');
  doc.text('Course Base Fee:', 40, 195);
  doc.text(formatInr(student.base_fee), 320, 195);

  doc.text('Discount Authorized:', 40, 212);
  doc.text(`- ${formatInr(student.discount_given)}`, 320, 212);

  doc.setFont('helvetica', 'bold');
  doc.text('Net Total Fee:', 40, 230);
  doc.text(formatInr(student.net_total_fee), 320, 230);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`Amount Paid (${payment.payment_mode}):`, 40, 250);
  doc.text(formatInr(payment.amount), 320, 250);

  doc.setTextColor(185, 28, 28);
  doc.text('Remaining Balance:', 40, 265);
  doc.text(formatInr(student.pending_balance), 320, 265);

  // Notes & Signatures
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('* Keep this receipt safe. Full balance clearance required before RTO driving test scheduling.', 25, 290);

  doc.setDrawColor(203, 213, 225);
  doc.line(250, 360, 380, 360);
  doc.text('Authorized Signature & Seal', 255, 372);

  doc.save(`Receipt_${payment.receipt_no}.pdf`);
}
