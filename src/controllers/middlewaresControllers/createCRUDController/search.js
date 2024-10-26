const search = async (Model, req, res) => {
  const adminId = req.admin._id; // Get the admin's ID from the request

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : ['name'];
  const fields = { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }

  try {
    let results = await Model.find({
      ...fields,
      createdBy: adminId, // Add the createdBy filter here
      removed: false, // Keep the removed filter
    })
    .limit(20)
    .exec();

    if (results.length >= 1) {
      return res.status(200).json({
        success: true,
        result: results,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(202).json({
        success: false,
        result: [],
        message: 'No document found by this request',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while searching for documents',
      error: error.message,
    });
  }
};

module.exports = search;

