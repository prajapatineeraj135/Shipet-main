// Print utility function
export function printLabels(labels: any, format = "thermal") {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Popup blocked! Please allow popups and try again.");
    return;
  }

  const printContent =
    format === "thermal"
      ? generateThermalPrintContent(labels)
      : generateA4PrintContent(labels);

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
}

function generateThermalPrintContent(labels: any) {
  const labelsHtml = labels
    .map(
      (label: any, index: any) => `
    <div class="thermal-label" style="
      width: 4in; height: 6in; padding: 0.15in; font-family: Arial, sans-serif;
      font-size: 11px; border: 2px solid #000; margin: 0;
      ${index < labels.length - 1 ? "page-break-after: always;" : ""}
      box-sizing: border-box; background-color: white;
      display: flex; flex-direction: column;
    ">
      <!-- Barcode Section -->
      <div style="text-align: center; margin-bottom: 12px;">
      <div style="font-size: 20px; font-weight: bold; color: #0066cc; margin-bottom: 8px;">
          Shipet🚚
        </div>
        ${
          label.barcodeImageUrl
            ? `<img crossorigin="anonymous" src="/api/barcode?imageUrl=${encodeURIComponent(
                label.barcodeImageUrl
              )}" alt="Barcode" style="max-width: 100%; height: 50px; margin-bottom: 8px;" />`
            : `<div style="height: 50px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background-color: white; margin-bottom: 8px;">
            <svg width="280" height="40" style="background-color: white;">
              ${Array.from({ length: 50 })
                .map(
                  (_, i) =>
                    `<rect x="${i * 5 + 10}" y="5" width="${
                      Math.random() > 0.5 ? 2 : 1
                    }" height="30" fill="#000" />`
                )
                .join("")}
            </svg>
          </div>`
        }
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 2px;">
          AWB: ${label.awb}
        </div>
      </div>
      
      <!-- Courier Name -->
      <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; letter-spacing: 1px;">
        ${label.courierName}
      </div>
      
      <!-- Shipment Details -->
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div><strong>Shipment ID:</strong></div><div>${
            label.shipmentId || label.id || "N/A"
          }</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div><strong>Parcel Type:</strong></div><div>${label.parcelType}</div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <div><strong>Consignee Mobile:</strong></div><div>${
            label.consigneeMobile
          }</div>
        </div>
      </div>
      
      <!-- Consignee Address -->
      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 6px;">Consignee Address:</div>
        <div style="border: 1px solid #000; padding: 8px; min-height: 60px; line-height: 1.3; font-size: 10px;">
          ${label.consigneeAddress}
        </div>
      </div>
      
      <!-- Return Address -->
      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 6px;">Return Address:</div>
        <div style="font-size: 9px; line-height: 1.2; color: #333;">
          ${label.returnAddress}
        </div>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: auto; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
        <div style="font-size: 8px; color: #666;">
          Best Shipping Service By https://shipet.in
        </div>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Thermal Labels</title>
      <style>
        @page { margin: 0; size: 4in 6in; }
        body { margin: 0; padding: 0; }
        @media print {
          .thermal-label { page-break-after: always; }
          .thermal-label:last-child { page-break-after: auto; }
        }
      </style>
    </head>
    <body>${labelsHtml}</body>
    </html>
  `;
}

function generateA4PrintContent(labels: any) {
  const pages = [];
  for (let i = 0; i < labels.length; i += 4) {
    pages.push(labels.slice(i, i + 4));
  }

  const pagesHtml = pages
    .map(
      (pageLabels, pageIndex) => `
    <div class="a4-page" style="
      width: 8.27in;
      height: 11.69in;
      padding: 0.2in;
      margin: 0;
      ${pageIndex < pages.length - 1 ? "page-break-after: always;" : ""}
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 0.1in;
      box-sizing: border-box;
      background: white;
    ">
      ${pageLabels
        .map(
          (label: any) => `
        <div style="
          width: 100%; 
          height: 100%; 
          max-width: 3.8in; 
          max-height: 5.5in; 
          padding: 0.1in; 
          font-family: Arial, sans-serif;
          font-size: 9px; 
          border: 1px solid #000; 
          margin: 0;
          box-sizing: border-box; 
          background-color: white;
          display: flex; 
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Barcode Section -->
          <div style="text-align: center; margin-bottom: 8px;">
            <div style="font-size: 14px; font-weight: bold; color: #0066cc; margin-bottom: 4px;">
              Shipet🚚
            </div>
            ${
              label.barcodeImageUrl
                ? `<img crossorigin="anonymous" src="/api/barcode?imageUrl=${encodeURIComponent(
                    label.barcodeImageUrl
                  )}" alt="Barcode" style="max-width: 100%; height: 35px; margin-bottom: 4px;" />`
                : `<div style="height: 35px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background-color: white; margin-bottom: 4px;">
                <svg width="200" height="30" style="background-color: white;">
                  ${Array.from({ length: 40 })
                    .map(
                      (_, i) =>
                        `<rect x="${i * 4 + 10}" y="3" width="${
                          Math.random() > 0.5 ? 2 : 1
                        }" height="24" fill="#000" />`
                    )
                    .join("")}
                </svg>
              </div>`
            }
            <div style="font-size: 8px; font-weight: bold; letter-spacing: 1px;">
              AWB: ${label.awb}
            </div>
          </div>
          
          <!-- Courier Name -->
          <div style="text-align: center; font-size: 12px; font-weight: bold; margin-bottom: 8px; letter-spacing: 0.5px;">
            ${label.courierName}
          </div>
          
          <!-- Shipment Details -->
          <div style="margin-bottom: 8px; font-size: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <div><strong>Shipment ID:</strong></div><div>${
                label.shipmentId || label.id || "N/A"
              }</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <div><strong>Parcel Type:</strong></div><div>${
                label.parcelType
              }</div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <div><strong>Consignee Mobile:</strong></div><div>${
                label.consigneeMobile
              }</div>
            </div>
          </div>
          
          <!-- Consignee Address -->
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 3px; font-size: 8px;">Consignee Address:</div>
            <div style="border: 1px solid #000; padding: 4px; min-height: 40px; line-height: 1.2; font-size: 7px; word-wrap: break-word;">
              ${label.consigneeAddress}
            </div>
          </div>
          
          <!-- Return Address -->
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 3px; font-size: 8px;">Return Address:</div>
            <div style="font-size: 6px; line-height: 1.1; color: #333; word-wrap: break-word;">
              ${label.returnAddress}
            </div>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: auto; text-align: center; border-top: 1px solid #ccc; padding-top: 4px;">
            <div style="font-size: 6px; color: #666;">
              Best Shipping Service By https://shipet.in
            </div>
          </div>
        </div>
      `
        )
        .join("")}
      ${
        pageLabels.length < 4
          ? Array.from({ length: 4 - pageLabels.length })
              .map(
                () =>
                  `<div style="border: 1px dashed #ccc; width: 100%; height: 100%; max-width: 3.8in; max-height: 5.5in;"></div>`
              )
              .join("")
          : ""
      }
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>A4 Labels</title>
      <style>
        @page { 
          margin: 0; 
          size: A4 portrait; 
        }
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Arial, sans-serif;
        }
        @media print {
          .a4-page { 
            page-break-after: always; 
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .a4-page:last-child { 
            page-break-after: auto; 
          }
        }
      </style>
    </head>
    <body>${pagesHtml}</body>
    </html>
  `;
}
