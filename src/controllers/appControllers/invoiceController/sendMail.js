const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const read = require('../invoiceController/email-read');
const InvoiceEmail = require('../../../email/invoice');

// Function to send customer invoice
const mail = async (req, res) => {
  // const { sender, customerEmail, attachmentPath } = req.body;
  const { id } = req.body;
  req.body.id = id;
  const invoiceData = await read(req, res);
  if (!invoiceData.success) {
    console.log(invoiceData.message);
    return res.status(404).json({
      success: false,
      result: null,
      message: invoiceData.message || 'Invoice data not found',
    });
  }
  // Add code to fetch the company details using
  // createdBy

  // Extract data from the invoice for email customization
  const invoiceResult = invoiceData;
  const createdBy = invoiceResult.createdBy?.name || 'Ireme Software';
  const customerEmail = invoiceResult.client.email || 'support@schoolie.co.rw';
  const title = `Invoice from ${createdBy}`;
  const emailHtml = ReactDOMServer.renderToStaticMarkup(
    <InvoiceEmail
      sender={sender}
      invoiceDate={invoiceData.expiredDate}
      invoiceId={id}
      billedTo={invoiceData.client.name}
      amount={invoiceData.total}
      products={invoiceData.items}
    />
  );

  // Create Nodemailer transport object using your SMTP server details
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Example using Gmail
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your email password or app password
    },
  });

  // Define the mail options including the HTML template and attachment
  let mailOptions = {
    from: `"${sender}" <${process.env.SMTP_USER}>`, // Sender's email
    to: customerEmail, // Recipient email
    subject: title, // Email subject
    html: emailHtml, // HTML email content with the sender dynamically replaced
  };

  try {
    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    // Return success response
    return res.status(200).json({
      success: true,
      result: info,
      message: 'Invoice sent successfully!',
    });
  } catch (err) {
    console.error('Error sending email:', err);

    // Return error response
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error sending invoice.',
    });
  }
};

module.exports = mail;
