const Car = require('../models/cars');

exports.getCars = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }

    const cars = await Car.find(filter);
    return res.json(cars);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

