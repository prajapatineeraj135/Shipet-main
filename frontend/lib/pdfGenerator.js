// Install required packages:
// npm install jspdf jspdf-autotable

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { toast } from "sonner";

applyPlugin(jsPDF);  // Attaches the autoTable method to jsPDF

export const generateInvoicePDF = (invoiceData) => {
    const {
        invoiceMetadata,
        adminDetails,
        billingDetails,
        transactions,
        summary,
        taxBreakdown
    } = invoiceData;

    // Create new PDF document
    const doc = new jsPDF();

    // Define colors
    const primaryColor = [41, 128, 185];     // Professional blue
    const secondaryColor = [52, 152, 219];   // Lighter blue
    const accentColor = [231, 76, 60];       // Red for important items
    const lightGray = [245, 245, 245];       // Light background
    const darkGray = [44, 62, 80];           // Dark text
    const borderColor = [189, 195, 199];     // Light border

    // Add header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');

    // Add decorative elements
    doc.setFillColor(...secondaryColor);
    doc.triangle(190, 0, 210, 0, 210, 20, 'F');

    // Title with white text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 15);

    // Invoice number in header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #${invoiceMetadata.invoiceNo}`, 14, 20);

    // Reset text color
    doc.setTextColor(...darkGray);

    // Company section with styled box
    doc.setFillColor(...lightGray);
    doc.roundedRect(10, 30, 95, 45, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(10, 30, 95, 45, 2, 2, 'S');

    // Company details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('FROM:', 14, 36);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.text(adminDetails.companyName, 14, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const companyDetails = [
        `GSTIN: ${adminDetails.gstNumber}`,
        adminDetails.address,
        `${adminDetails.city}, ${adminDetails.state} ${adminDetails.pincode}`,
        `Phone: ${adminDetails.phone}`,
        adminDetails.email
    ];

    let yPos = 46;
    companyDetails.forEach(line => {
        doc.text(line, 14, yPos);
        yPos += 4;
    });

    // Invoice details box
    doc.setFillColor(...lightGray);
    doc.roundedRect(110, 30, 85, 45, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(110, 30, 85, 45, 2, 2, 'S');

    // Invoice metadata
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.text('INVOICE DETAILS:', 114, 36);

    const invoiceDetails = [
        ['Invoice Date:', invoiceMetadata.invoiceDate],
        ['Invoice No:', invoiceMetadata.invoiceNo.toString()],
        ['Taxable Value:', `Rs. ${invoiceMetadata.taxableValue.toFixed(2)}`],
        ['Tax Amount:', `Rs. ${invoiceMetadata.tax.toFixed(2)}`],
        ['Total Amount:', `Rs. ${invoiceMetadata.invoiceValue.toFixed(2)}`]
    ];

    yPos = 42;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);

    invoiceDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, 114, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(value, 155, yPos);
        yPos += 4;
    });

    // Bill To section
    yPos = 85;
    doc.setFillColor(...lightGray);
    doc.roundedRect(10, yPos - 5, 185, 35, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(10, yPos - 5, 185, 35, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.text('BILL TO:', 14, yPos);

    if (billingDetails && billingDetails.companyName !== 'N/A') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.text(billingDetails.companyName.toUpperCase(), 14, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(billingDetails.billingAddress, 14, yPos + 12);
        doc.text(`${billingDetails.city}, ${billingDetails.state} ${billingDetails.pincode}`, 14, yPos + 16);
        doc.text(`GSTIN: ${billingDetails.gstNumber}`, 14, yPos + 20);
        doc.text(`PAN: ${billingDetails.panNumber}`, 14, yPos + 24);
    }

    // Main service table with enhanced styling
    yPos = 130;

    const serviceHeaders = [
        ['Service Description', 'Qty', 'Rate', 'Taxable Value', 'CGST %', 'CGST Rs.', 'SGST %', 'SGST Rs.', 'IGST %', 'IGST Rs.', 'Total Amount']
    ];

    const serviceData = [
        [
            'Logistics Service',
            transactions.length,
            `Rs. ${taxBreakdown.taxableValue.toFixed(2)}`,
            `Rs. ${taxBreakdown.taxableValue.toFixed(2)}`,
            '9.00%',
            `Rs. ${taxBreakdown.cgst?.amount?.toFixed(2) || '0.00'}`,
            '9.00%',
            `Rs. ${taxBreakdown.sgst?.amount?.toFixed(2) || '0.00'}`,
            '18.00%',
            `Rs. ${((taxBreakdown.taxableValue * 0.18) || 0).toFixed(2)}`,
            `Rs. ${taxBreakdown.totalAmount.toFixed(2)}`
        ]
    ];

    // Generate main service table
    doc.autoTable({
        startY: yPos,
        head: serviceHeaders,
        body: serviceData,
        theme: 'striped',
        styles: {
            fontSize: 7,
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: borderColor
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: darkGray,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 20 },
            1: { cellWidth: 15 },
            2: { cellWidth: 20 },
            3: { cellWidth: 18 },
            4: { cellWidth: 15 },
            5: { cellWidth: 15 },
            6: { cellWidth: 15 },
            7: { cellWidth: 15 },
            8: { cellWidth: 15 },
            9: { cellWidth: 15 },
            10: { cellWidth: 18, fontStyle: 'bold' }
        }
    });

    // Shipment details section
    yPos = doc.lastAutoTable.finalY + 15;

    // Section header
    doc.setFillColor(...primaryColor);
    doc.rect(10, yPos - 3, 185, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('SHIPMENT DETAILS', 14, yPos + 1);

    yPos += 10;

    const shipmentHeaders = [
        ['Shipment ID', 'AWB Number', 'Date', 'Weight (gm)', 'Billed Amount', 'Tax Amount']
    ];

    const shipmentData = transactions.map(tx => [
        tx.shipmentId,
        tx.awb,
        tx.date,
        tx.weight.toString(),
        `Rs. ${tx.taxableAmount.toFixed(2)}`,
        `Rs. ${tx.taxAmount.toFixed(2)}`
    ]);

    // Generate shipment details table
    doc.autoTable({
        startY: yPos,
        head: shipmentHeaders,
        body: shipmentData,
        theme: 'striped',
        styles: {
            fontSize: 7,
            cellPadding: 2.5,
            lineWidth: 0.1,
            lineColor: borderColor
        },
        headStyles: {
            fillColor: secondaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            textColor: darkGray,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [252, 252, 252]
        },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30, fontStyle: 'bold' },
            5: { cellWidth: 30, fontStyle: 'bold' }
        }
    });

    // Summary section
    const tableEndY = doc.lastAutoTable.finalY + 10;

    // Summary box
    doc.setFillColor(...lightGray);
    doc.roundedRect(130, tableEndY, 65, 30, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(130, tableEndY, 65, 30, 2, 2, 'S');

    // Summary details
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const summaryItems = [
        ['Subtotal:', `Rs. ${summary.totalTaxableValue.toFixed(2)}`],
        ['Tax (18%):', `Rs. ${summary.totalTaxAmount.toFixed(2)}`],
        ['Total Amount:', `Rs. ${summary.totalInvoiceValue.toFixed(2)}`]
    ];

    let summaryY = tableEndY + 6;
    summaryItems.forEach(([label, amount], index) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, 134, summaryY);

        if (index === summaryItems.length - 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...accentColor);
        } else {
            doc.setFont('helvetica', 'normal');
        }

        doc.text(amount, 185, summaryY, { align: 'right' });
        summaryY += 6;
        doc.setTextColor(...darkGray);
        doc.setFontSize(8);
    });

    // Terms and conditions
    const termsY = tableEndY + 45;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.text('TERMS & CONDITIONS:', 14, termsY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(7);
    const terms = [
        '• Payment is due within 30 days of invoice date',
        '• Late payments may incur additional charges',
        '• This is a computer-generated invoice and does not require physical signature'
    ];

    let termsYPos = termsY + 5;
    terms.forEach(term => {
        doc.text(term, 14, termsYPos);
        termsYPos += 4;
    });

    // Footer
    const footerY = 280;
    doc.setFillColor(...primaryColor);
    doc.rect(0, footerY, 210, 17, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 14, footerY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 14, footerY + 11);

    doc.text(`Page 1 of 1`, 185, footerY + 8, { align: 'right' });

    // Generate filename
    const filename = `invoice_${invoiceMetadata.invoiceNo}_${invoiceMetadata.month}_${invoiceMetadata.year}.pdf`;

    // Save the PDF
    doc.save(filename);

    return filename;
};

export const downloadInvoicePDF = (invoiceData) => {
    try {
        const filename = generateInvoicePDF(invoiceData);
        toast.success(`Invoice PDF generated: ${filename}`);
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try again.');
        return false;
    }
};

/**
 * Generate and return PDF as blob for server-side usage
 */
export const generateInvoicePDFBlob = (invoiceData) => {
    const {
        invoiceMetadata,
        adminDetails,
        billingDetails,
        transactions,
        summary,
        taxBreakdown
    } = invoiceData;

    const doc = new jsPDF();

    // Define colors (same as main function)
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 152, 219];
    const accentColor = [231, 76, 60];
    const lightGray = [245, 245, 245];
    const darkGray = [44, 62, 80];
    const borderColor = [189, 195, 199];

    // Add header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');

    // Add decorative elements
    doc.setFillColor(...secondaryColor);
    doc.triangle(190, 0, 210, 0, 210, 20, 'F');

    // Title with white text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #${invoiceMetadata.invoiceNo}`, 14, 20);

    // Reset text color
    doc.setTextColor(...darkGray);

    // Company section with styled box
    doc.setFillColor(...lightGray);
    doc.roundedRect(10, 30, 95, 45, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(10, 30, 95, 45, 2, 2, 'S');

    // Company details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('FROM:', 14, 36);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.text(adminDetails.companyName, 14, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const companyDetails = [
        `GSTIN: ${adminDetails.gstNumber}`,
        adminDetails.address,
        `${adminDetails.city}, ${adminDetails.state} ${adminDetails.pincode}`,
        `Phone: ${adminDetails.phone}`,
        adminDetails.email
    ];

    let yPos = 46;
    companyDetails.forEach(line => {
        doc.text(line, 14, yPos);
        yPos += 4;
    });

    // Invoice details box
    doc.setFillColor(...lightGray);
    doc.roundedRect(110, 30, 85, 45, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(110, 30, 85, 45, 2, 2, 'S');

    // Invoice metadata
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.text('INVOICE DETAILS:', 114, 36);

    const invoiceDetails = [
        ['Invoice Date:', invoiceMetadata.invoiceDate],
        ['Invoice No:', invoiceMetadata.invoiceNo.toString()],
        ['Taxable Value:', `Rs. ${invoiceMetadata.taxableValue.toFixed(2)}`],
        ['Tax Amount:', `Rs. ${invoiceMetadata.tax.toFixed(2)}`],
        ['Total Amount:', `Rs. ${invoiceMetadata.invoiceValue.toFixed(2)}`]
    ];

    yPos = 42;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);

    invoiceDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, 114, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(value, 155, yPos);
        yPos += 4;
    });

    // Bill To section
    yPos = 85;
    doc.setFillColor(...lightGray);
    doc.roundedRect(10, yPos - 5, 185, 35, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(10, yPos - 5, 185, 35, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.text('BILL TO:', 14, yPos);

    if (billingDetails && billingDetails.companyName !== 'N/A') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.text(billingDetails.companyName.toUpperCase(), 14, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(billingDetails.billingAddress, 14, yPos + 12);
        doc.text(`${billingDetails.city}, ${billingDetails.state} ${billingDetails.pincode}`, 14, yPos + 16);
        doc.text(`GSTIN: ${billingDetails.gstNumber}`, 14, yPos + 20);
        doc.text(`PAN: ${billingDetails.panNumber}`, 14, yPos + 24);
    }

    // Service table
    yPos = 130;

    const serviceHeaders = [
        ['Service Description', 'Qty', 'Rate', 'Taxable Value', 'CGST %', 'CGST Rs.', 'SGST %', 'SGST Rs.', 'IGST %', 'IGST Rs.', 'Total Amount']
    ];

    const serviceData = [
        [
            'Logistics Service',
            transactions.length
                `Rs. ${taxBreakdown.taxableValue.toFixed(2)}`,
            `Rs. ${taxBreakdown.taxableValue.toFixed(2)}`,
            '9.00%',
            `Rs. ${taxBreakdown.cgst?.amount?.toFixed(2) || '0.00'}`,
            '9.00%',
            `Rs. ${taxBreakdown.sgst?.amount?.toFixed(2) || '0.00'}`,
            '18.00%',
            `Rs. ${((taxBreakdown.taxableValue * 0.18) || 0).toFixed(2)}`,
            `Rs. ${taxBreakdown.totalAmount.toFixed(2)}`
        ]
    ];

    doc.autoTable({
        startY: yPos,
        head: serviceHeaders,
        body: serviceData,
        theme: 'striped',
        styles: {
            fontSize: 7,
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: borderColor
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: darkGray,
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 30 },
            11: { fontStyle: 'bold' }
        }
    });

    // Shipment details
    yPos = doc.lastAutoTable.finalY + 15;

    doc.setFillColor(...primaryColor);
    doc.rect(10, yPos - 3, 185, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('SHIPMENT DETAILS', 14, yPos + 1);

    yPos += 5;

    const shipmentHeaders = [
        ['Shipment ID', 'AWB Number', 'Date', 'Weight (gm)', 'Billed Amount', 'Tax Amount']
    ];

    const shipmentData = transactions.map(tx => [
        tx.shipmentId,
        tx.awb,
        tx.date,
        tx.weight.toString(),
        `Rs. ${tx.taxableAmount.toFixed(2)}`,
        `Rs. ${tx.taxAmount.toFixed(2)}`
    ]);

    doc.autoTable({
        startY: yPos,
        head: shipmentHeaders,
        body: shipmentData,
        theme: 'striped',
        styles: {
            fontSize: 7,
            cellPadding: 2.5,
            lineWidth: 0.1,
            lineColor: borderColor
        },
        headStyles: {
            fillColor: secondaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            textColor: darkGray,
            halign: 'center'
        },
        columnStyles: {
            1: { cellWidth: 35, halign: 'left' },
            7: { fontStyle: 'bold' },
            8: { fontStyle: 'bold' }
        }
    });

    // Summary section
    const tableEndY = doc.lastAutoTable.finalY + 10;
    const totalBilled = summary.totalTaxableValue + 500;
    const totalTax = summary.totalTaxAmount + 90;

    doc.setFillColor(...lightGray);
    doc.roundedRect(130, tableEndY, 65, 30, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(130, tableEndY, 65, 30, 2, 2, 'S');

    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const summaryItems = [
        ['Subtotal:', `Rs. ${totalBilled.toFixed(2)}`],
        ['Tax (18%):', `Rs. ${totalTax.toFixed(2)}`],
        ['Total Amount:', `Rs. ${(totalBilled + totalTax).toFixed(2)}`]
    ];

    let summaryY = tableEndY + 6;
    summaryItems.forEach(([label, amount], index) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, 134, summaryY);

        if (index === summaryItems.length - 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...accentColor);
        } else {
            doc.setFont('helvetica', 'normal');
        }

        doc.text(amount, 185, summaryY, { align: 'right' });
        summaryY += 6;
        doc.setTextColor(...darkGray);
        doc.setFontSize(8);
    });

    // Footer
    const footerY = 280;
    doc.setFillColor(...primaryColor);
    doc.rect(0, footerY, 210, 17, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('This is a computer generated invoice and does not require signature.', 14, footerY + 8);

    // Return as blob
    return doc.output('blob');
};

/**
 * Preview PDF in new window instead of downloading
 */
export const previewInvoicePDF = (invoiceData) => {
    try {
        const blob = generateInvoicePDFBlob(invoiceData);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        return true;
    } catch (error) {
        console.error('Error previewing PDF:', error);
        alert('Failed to preview PDF. Please try again.');
        return false;
    }
};