// Updated read function in Invoice model
const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');

const read = async (req, res) => {
  const { id } = req.body; // Get id from req.body

  try {
    // Find document by id
    const result = await Model.findOne({ _id: id, removed: false })
      .populate('createdBy', 'name')
      .exec();

    // Return success response with result
    return result;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
};

module.exports = read;
