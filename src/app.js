const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');
const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');
const { insertCompany, patchCompany, getCompanyData, pool } = require('./sql/CRUD');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

// create our Express app
const app = express();
const sessionStore = new PgSession({
  pool, // Use the same PostgreSQL pool that you are using for your queries
  tableName: 'session', // Optional, the default table name is 'session'
});
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secure secret for signing session IDs
    store: sessionStore, // Use PostgreSQL session store
    resave: false, // Don't force session save if not modified
    saveUninitialized: false, // Don't save empty sessions
    cookie: {
      secure: false, // Set this to true in production (when using HTTPS)
      httpOnly: true, // Ensures the cookie is sent only over HTTP(S)
      maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days session expiration
    },
  })
);

app.use(
  cors({
    origin: ['https://ireme-software.vercel.app', 'http://localhost:3000'], // Allow only these domains
    credentials: true, // Allow credentials (cookies, authorization headers)
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(fileUpload());

// Define a POST route to insert a new company
app.post('/api/insert-company', async (req, res) => {
  try {
    const companyData = {
      adminID: req.body.adminID,
      company_name: req.body.company_name,
      company_logo: req.files ? req.files.company_logo.data : null, // Check if there's a file uploaded
      company_address: req.body.company_address,
      country: req.body.country,
      email: req.body.email,
      phone_number: req.body.phone_number,
      tax_number: req.body.tax_number,
      vat_number: req.body.vat_number,
      reg_number: req.body.reg_number || null,
      bank_account: req.body.bank_account || null,
    };
    console.log(companyData);

    // Call the insertCompany function
    await insertCompany(companyData);

    // Send a success response
    res.status(201).json({
      success: true,
      message: 'Company created successfully!',
    });
  } catch (error) {
    console.error('Error inserting company:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company',
    });
  }
});
// Define a PATCH route to update a company partially
app.patch('/api/update-company/:companyID', async (req, res) => {
  try {
    const companyID = req.params.companyID; // Get company ID from the URL
    const adminID = req.body.adminID; // Get adminID from the request body

    const companyData = {
      company_name: req.body.company_name || null,
      company_logo: req.files ? req.files.company_logo.data : null, // Check if there's a file uploaded
      company_address: req.body.company_address || null,
      country: req.body.country || null,
      email: req.body.email || null,
      phone_number: req.body.phone_number || null,
      tax_number: req.body.tax_number || null,
      vat_number: req.body.vat_number || null,
      reg_number: req.body.reg_number || null,
      bank_account: req.body.bank_account || null,
    };

    // Call the patchCompany function
    await patchCompany(companyID, adminID, companyData);

    // Send a success response
    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company',
      error: error.message,
    });
  }
});
// Modify the API route to accept adminID via query params
app.get('/api/company', async (req, res) => {
  try {
    const adminID = req.query.adminID; // Get adminID from query params

    // Call the getCompanyData function
    const companyData = await getCompanyData(adminID);

    // Send the company data as the response
    res.status(200).json({ company: companyData });
  } catch (error) {
    console.error('Error fetching company data:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching company data, refresh the page!',
      error: error.message,
    });
  }
});

// Other API routes
const setup = require('./controllers/coreControllers/setup');
app.post('/setup', setup);
app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

// 404 error handler
app.use(errorHandlers.notFound);

// Production error handler
app.use(errorHandlers.productionErrors);

module.exports = app;
