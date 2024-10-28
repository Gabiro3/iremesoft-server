const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const read = require('./email-read');
const { getCompanyData } = require('../../../sql/CRUD');

// Function to send customer invoice
const mail = async (req, res) => {
  // Get the invoice ID passed as part of the request body.
  const { id } = req.body;
  req.body.id = id; // Pass the invoice ID to fetch invoice data from our database
  const invoiceData = await read(req, res);
  const companyData = await getCompanyData(req.admin._id.toString());
  if (!invoiceData) {
    console.log(invoiceData.message);
    return res.status(404).json({
      success: false,
      result: null,
      message: invoiceData.message || 'Invoice data not found',
    });
  }
  if (!companyData) {
    console.log(invoiceData.message);
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Company Details not set! First set your company details in the Settings tab.',
    });
  }
  console.log(invoiceData);
  console.log(companyData);

  // Extract data from the invoice for email customization
  const invoiceResult = invoiceData;
  const sender = companyData.company_name;
  const companyName = companyData.company_name;
  const companyAddress = companyData.company_address;
  const companyBankAccount = companyData.bank_account;
  const companyEmail = companyData.email;
  const createdBy = companyData.company_name || 'Ireme Software';
  const customerEmail = invoiceResult.client.email || 'support@schoolie.co.rw';
  const title = `Invoice from ${createdBy}`;

  // Read the HTML template from the 'email/index.html' directory located outside the current directory
  const htmlTemplatePath = path.join(__dirname, '../../../email/index.html');
  let htmlTemplate;
  try {
    htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');
  } catch (err) {
    console.error('Error reading HTML template:', err);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error reading email template.',
    });
  }

  // Replace the {{sender}} placeholder with the actual sender's name
  htmlTemplate = htmlTemplate.replace('{{sender}}', sender);
  htmlTemplate = htmlTemplate.replace('{{company_email}}', companyEmail);
  htmlTemplate = htmlTemplate.replace('{{invoice_date}}', invoiceResult.expiredDate);
  htmlTemplate = htmlTemplate.replace('{{invoice_id}}', invoiceResult._id);
  htmlTemplate = htmlTemplate.replace('{{invoice_status}}', invoiceResult.status);
  htmlTemplate = htmlTemplate.replace('{{client_name}}', invoiceResult.client.name);
  htmlTemplate = htmlTemplate.replace('{{client_email}}', invoiceResult.client.email);
  htmlTemplate = htmlTemplate.replace('{{client_phone}}', invoiceResult.client.phone);
  htmlTemplate = htmlTemplate.replace('{{client_address}}', invoiceResult.client.address);
  htmlTemplate = htmlTemplate.replace('{{total}}', invoiceResult.total);
  htmlTemplate = htmlTemplate.replace('{{logo_url}}', process.env.FRONTEND_PUBLIC_APP_URL);
  let itemsHTML = '';
  invoiceData.items.forEach((item) => {
    itemsHTML += `
      <tr>
        <td data-id="__react-email-column" style="padding-left:22px">
          <p style="font-size:12px;line-height:1.4;margin:0;font-weight:600;padding:0">${item.itemName}</p>
          <p style="font-size:12px;line-height:1.4;margin:0;color:rgb(102,102,102);padding:0">${item.description}</p>
          <p style="font-size:12px;line-height:1.4;margin:0;color:rgb(102,102,102);padding:0">Quantity: ${item.quantity}</p>
        </td>
        <td align="right" data-id="__react-email-column" style="display:table-cell;padding:0px 20px 0px 0px;width:100px;vertical-align:top">
          <p style="font-size:12px;line-height:24px;margin:0;font-weight:600"> Rwf ${item.price}</p>
          <p style="font-size:12px;line-height:24px;margin:0;font-weight:600">Tax:  ${item.tax}</p>
          <p style="font-size:12px;line-height:24px;margin:0;font-weight:600">Total: Rwf ${item.total}</p>
        </td>
      </tr>`;
  });
  htmlTemplate = htmlTemplate.replace('{{items}}', itemsHTML);
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
    html: htmlTemplate, // HTML email content with the sender dynamically replaced
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
