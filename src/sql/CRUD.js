const { Pool } = require('pg');

// Assuming you have a connection pool set up, for example:
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT, // Default port for PostgreSQL
});

async function insertCompany(companyData) {
  const sql = `INSERT INTO companies 
    (adminID, company_name, company_logo, company_address, country, email, phone_number, tax_number, vat_number, reg_number, bank_account) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;

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

  try {
    // Use the pool to execute the query
    const result = await pool.query(sql, values);

    // The result object will contain the newly inserted row's ID
    const insertedCompanyId = result.rows[0].id;
    console.log('Company inserted successfully with ID:', insertedCompanyId);
  } catch (err) {
    console.error('Error inserting company data:', err);
  }
}

async function patchCompany(companyID, adminID, companyData) {
  try {
    // Step 1: Verify the adminID from the database
    const verifySql = `SELECT adminID FROM companies WHERE id = $1`;
    const verifyResult = await pool.query(verifySql, [companyID]);

    if (verifyResult.rows.length === 0) {
      throw new Error('Company not found');
    }

    const storedAdminID = verifyResult.rows[0].adminid;

    // Convert the incoming adminID to an integer
    if (storedAdminID !== adminID) {
      throw new Error('Unauthorized: You are not allowed to update this company');
    }

    // Step 2: Dynamically construct the SQL update query based on provided fields
    let updateFields = [];
    let updateValues = [];

    // Check which fields are provided and add them to the query
    if (companyData.company_name) {
      updateFields.push('company_name = $' + (updateFields.length + 1));
      updateValues.push(companyData.company_name);
    }
    if (companyData.company_logo) {
      updateFields.push('company_logo = $' + (updateFields.length + 1));
      updateValues.push(companyData.company_logo);
    }
    if (companyData.company_address) {
      updateFields.push('company_address = $' + (updateFields.length + 1));
      updateValues.push(companyData.company_address);
    }
    if (companyData.country) {
      updateFields.push('country = $' + (updateFields.length + 1));
      updateValues.push(companyData.country);
    }
    if (companyData.email) {
      updateFields.push('email = $' + (updateFields.length + 1));
      updateValues.push(companyData.email);
    }
    if (companyData.phone_number) {
      updateFields.push('phone_number = $' + (updateFields.length + 1));
      updateValues.push(companyData.phone_number);
    }
    if (companyData.tax_number) {
      updateFields.push('tax_number = $' + (updateFields.length + 1));
      updateValues.push(companyData.tax_number);
    }
    if (companyData.vat_number) {
      updateFields.push('vat_number = $' + (updateFields.length + 1));
      updateValues.push(companyData.vat_number);
    }
    if (companyData.reg_number) {
      updateFields.push('reg_number = $' + (updateFields.length + 1));
      updateValues.push(companyData.reg_number);
    }
    if (companyData.bank_account) {
      updateFields.push('bank_account = $' + (updateFields.length + 1));
      updateValues.push(companyData.bank_account);
    }

    // If no fields to update, return early
    if (updateFields.length === 0) {
      throw new Error('No fields provided to update');
    }

    // Add the company ID for the WHERE clause
    updateValues.push(companyID);

    // Construct the SQL update query
    const updateSql = `UPDATE companies SET ${updateFields.join(', ')} WHERE id = $${
      updateFields.length + 1
    }`;

    // Execute the update query
    const updateResult = await pool.query(updateSql, updateValues);

    // Optionally, update the local storage

    return updateResult;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
}
async function getCompanyData(adminID) {
  // Corrected SQL query to match the case of the "adminid" column
  const sql = 'SELECT * FROM companies WHERE "adminid" = $1';

  try {
    // Execute the query using the PostgreSQL pool
    const result = await pool.query(sql, [adminID]);

    if (result.rows.length === 0) {
      console.warn(`No company found for adminID: ${adminID}`);
      return null; // Gracefully resolve with null
    }

    // Return the company data
    return result.rows[0];
  } catch (err) {
    console.error('Error fetching company data:', err);
    return null; // Return null on error
  }
}

module.exports = { insertCompany, patchCompany, getCompanyData, pool };
