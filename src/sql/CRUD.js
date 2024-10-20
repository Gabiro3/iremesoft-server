const mysql = require('mysql');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost', // Replace with your DB host
  user: 'gabiro', // Replace with your DB user
  password: '', // Replace with your DB password
  database: 'ireme_software', // Replace with your DB name
});

// Function to insert new company data
function insertCompany(companyData) {
  const sql = `INSERT INTO companies 
    (adminID, company_name, company_logo, company_address, country, email, phone_number, tax_number, vat_number, reg_number, bank_account) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    companyData.adminID,
    companyData.company_name,
    companyData.company_logo, // Pass the logo as a buffer or base64 string
    companyData.company_address,
    companyData.country,
    companyData.email,
    companyData.phone_number,
    companyData.tax_number,
    companyData.vat_number,
    companyData.reg_number,
    companyData.bank_account,
  ];

  // Use the existing connection to insert the data
  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting company data:', err);
      return;
    }
  });
}

function patchCompany(companyID, adminID, companyData) {
  return new Promise((resolve, reject) => {
    // Step 1: Verify the adminID from the database
    const verifySql = `SELECT adminID FROM companies WHERE id = ?`;
    connection.query(verifySql, [companyID], (err, results) => {
      if (err) {
        return reject(err);
      }

      if (results.length === 0) {
        return reject(new Error('Company not found'));
      }

      const storedAdminID = results[0].adminID;
      // Convert the incoming adminID to an integer

      if (storedAdminID !== parseInt(adminID, 10)) {
        return reject(new Error('Unauthorized: You are not allowed to update this company'));
      }

      // Step 3: Dynamically construct the SQL update query based on provided fields
      let updateFields = [];
      let updateValues = [];

      // Check which fields are provided and add them to the query
      if (companyData.company_name) {
        updateFields.push('company_name = ?');
        updateValues.push(companyData.company_name);
      }
      if (companyData.company_logo) {
        updateFields.push('company_logo = ?');
        updateValues.push(companyData.company_logo);
      }
      if (companyData.company_address) {
        updateFields.push('company_address = ?');
        updateValues.push(companyData.company_address);
      }
      if (companyData.country) {
        updateFields.push('country = ?');
        updateValues.push(companyData.country);
      }
      if (companyData.email) {
        updateFields.push('email = ?');
        updateValues.push(companyData.email);
      }
      if (companyData.phone_number) {
        updateFields.push('phone_number = ?');
        updateValues.push(companyData.phone_number);
      }
      if (companyData.tax_number) {
        updateFields.push('tax_number = ?');
        updateValues.push(companyData.tax_number);
      }
      if (companyData.vat_number) {
        updateFields.push('vat_number = ?');
        updateValues.push(companyData.vat_number);
      }
      if (companyData.reg_number) {
        updateFields.push('reg_number = ?');
        updateValues.push(companyData.reg_number);
      }
      if (companyData.bank_account) {
        updateFields.push('bank_account = ?');
        updateValues.push(companyData.bank_account);
      }

      // Add the company ID for the WHERE clause
      updateValues.push(companyID);

      // If no fields to update, return early
      if (updateFields.length === 0) {
        return reject(new Error('No fields provided to update'));
      }

      // Construct the SQL update query
      const updateSql = `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`;

      // Execute the update query
      connection.query(updateSql, updateValues, (err, result) => {
        if (err) {
          return reject(err);
        }
        try {
          const existingCompanyData = JSON.parse(localStorage.getItem('companyData'));

          // Update only the fields that were changed
          const updatedCompanyData = { ...existingCompanyData, ...companyData };

          // Store the updated company data in localStorage
          localStorage.setItem('companyData', JSON.stringify(updatedCompanyData));

          resolve(result); // Resolve the promise with the result of the database update
        } catch (storageError) {
          return reject(new Error('Failed to update local storage: ' + storageError.message));
        }
        resolve(result);
      });
    });
  });
}
function getCompanyData(adminID) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM companies WHERE adminID = ?';

    connection.query(sql, [adminID], (err, results) => {
      if (err) {
        console.error('Error fetching company data:', err);
        return resolve(null);
      }

      if (results.length === 0) {
        // No company data found, return null instead of rejecting
        console.warn(`No company found for adminID: ${adminID}`);
        return resolve(null); // Gracefully resolve with null
      }

      // Resolve with the company data
      resolve(results[0]);
    });
  });
}

module.exports = { insertCompany, patchCompany, getCompanyData, connection };
