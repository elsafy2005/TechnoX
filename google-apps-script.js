// =====================================================
//   TechnoX — Google Apps Script
//   انسخ الكود ده كله وحطه في Apps Script
// =====================================================

const OWNER_EMAIL = "technox7778@gmail.com";  // ← جيميلك

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // ── أضف عناوين الأعمدة لو الشيت فاضي ──
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "التاريخ والوقت",
        "نوع الطلب",
        "الاسم",
        "رقم الهاتف",
        "التفاصيل",
        "الإجمالي / الخدمة",
        "ملاحظات"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e00000").setFontColor("#ffffff");
    }

    // ── احفظ البيانات في الشيت ──
    sheet.appendRow([
      new Date().toLocaleString("ar-EG"),
      data.type    || "—",
      data.name    || "—",
      data.phone   || "—",
      data.details || "—",
      data.total   || "—",
      data.notes   || "—"
    ]);

    // ── ابعت إيميل إشعار ──
    GmailApp.sendEmail(
      OWNER_EMAIL,
      data.subject || "🔔 إشعار جديد — TechnoX",
      data.body    || "(لا يوجد تفاصيل)",
      { name: "TechnoX Store 🛒" }
    );

    // ── رد بنجاح ──
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// للتأكد إن السكريبت شغال
function doGet() {
  return ContentService
    .createTextOutput("✅ TechnoX Apps Script — شغال!")
    .setMimeType(ContentService.MimeType.TEXT);
}
