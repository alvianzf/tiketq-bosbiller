const FerryBookingDAO = require('./db/dao/FerryBookingDAO');
const { generateFerryTicketPDF } = require('./services/ferryPdfService');
const { generateInvoicePDF } = require('./services/invoiceService');
const { sendFerryBookingEmail } = require('./services/emailService');
const fs = require('fs');
const path = require('path');

async function testWorkflow() {
  console.log("=== TiketQ Ferry Integration Test Workflow ===");

  const bookingGuid = `test-guid-${Date.now()}`;
  const testEmail = "alvianzf@gmail.com"; // Test recipient email

  try {
    // 1. Find or create terminals locally
    const originTerminal = await FerryBookingDAO.findOrCreateTerminal(
      "HFC",
      "HarbourFront Centre Terminal",
      "Singapore",
      "Singapore"
    );
    const destTerminal = await FerryBookingDAO.findOrCreateTerminal(
      "BTC",
      "Batam Center Terminal",
      "Batam",
      "Indonesia"
    );

    console.log("✔ Mapped terminals successfully:", originTerminal.code, "→", destTerminal.code);

    // 2. Create a mock FerryBooking record in the local database
    const booking = await FerryBookingDAO.createBooking({
      bookingNo: bookingGuid,
      nominal: "700000",
      basePrice: 700000,
      serviceFee: 0,
      totalSales: 700000,
      departureDate: new Date(),
      returnDate: null,
      originId: originTerminal.id,
      destinationId: destTerminal.id,
      email: testEmail,
      mobile_number: "+628123456789",
      passengers: [
        {
          title: "Mr",
          firstName: "Andi",
          lastName: "Pratama",
          passportNumber: "A12345678",
          nationality: "Indonesia",
          dateOfBirth: "1990-05-25"
        },
        {
          title: "Mrs",
          firstName: "Siti",
          lastName: "Aminah",
          passportNumber: "B87654321",
          nationality: "Indonesia",
          dateOfBirth: "1992-08-12"
        }
      ]
    });

    console.log("✔ Created database FerryBooking & Transaction with PENDING status:");
    console.log(`  - Booking No (Guid): ${booking.bookingNo}`);
    console.log(`  - Nominal Total Sales: ${booking.totalSales}`);
    console.log(`  - Passengers count: ${booking.passengers.length}`);

    // 3. Simulate payment capture / settlement via DAO
    console.log("\nSimulating Midtrans Paid Webhook payment status update...");
    const updatedBooking = await FerryBookingDAO.updatePaymentStatusByNo(bookingGuid, true);
    
    console.log("✔ Successfully updated status to PAID!");
    console.log(`  - FerryBooking status: ${updatedBooking.status}`);
    console.log(`  - Associated Transaction status: ${updatedBooking.transaction?.status}`);

    // Populate mock voucherCodeIds
    console.log("\nPopulating mock passenger voucher GUIDs...");
    if (updatedBooking.passengers && updatedBooking.passengers.length > 0) {
      for (let i = 0; i < updatedBooking.passengers.length; i++) {
        const passenger = updatedBooking.passengers[i];
        const mockVoucherId = `mock-voucher-id-pax-${i}-${Date.now()}`;
        await FerryBookingDAO.updatePassengerVoucher(passenger.id, mockVoucherId);
        passenger.voucherCodeId = mockVoucherId;
        console.log(`  - Passenger ${i + 1}: ${passenger.firstName} → ${mockVoucherId}`);
      }
    }

    // 4. Generate PDFs
    console.log("\nGenerating highly aesthetic Ferry E-Ticket PDF...");
    const pdfBuffer = await generateFerryTicketPDF(updatedBooking);
    fs.writeFileSync(path.join(__dirname, 'test_ferry_ticket.pdf'), pdfBuffer);
    console.log("✔ Saved test_ferry_ticket.pdf locally!");

    console.log("Generating professional Invoice PDF...");
    const invoiceBuffer = await generateInvoicePDF(updatedBooking);
    fs.writeFileSync(path.join(__dirname, 'test_ferry_invoice.pdf'), invoiceBuffer);
    console.log("✔ Saved test_ferry_invoice.pdf locally!");

    // 5. Send Email
    console.log(`\nDispatching confirmation email to ${testEmail}...`);
    const emailResult = await sendFerryBookingEmail(updatedBooking, pdfBuffer, invoiceBuffer);
    console.log("✔ Email dispatched successfully! Response info:", emailResult);

    console.log("\n=== Integration Test Workflow Completed Successfully! ===");
    process.exit(0);
  } catch (error) {
    console.error("❌ Workflow failed with error:", error);
    process.exit(1);
  }
}

testWorkflow();
