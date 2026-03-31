import Supplier from '../models/Supplier.js';

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin/Manager
export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({});
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private/Admin/Manager
export const createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, gstNumber, status } = req.body;

    const supplier = new Supplier({
      name,
      contactPerson,
      phone,
      email,
      address,
      gstNumber,
      status
    });

    const createdSupplier = await supplier.save();
    res.status(201).json(createdSupplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin/Manager
export const updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, gstNumber, status } = req.body;

    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      supplier.name = name || supplier.name;
      supplier.contactPerson = contactPerson || supplier.contactPerson;
      supplier.phone = phone || supplier.phone;
      supplier.email = email || supplier.email;
      supplier.address = address || supplier.address;
      supplier.gstNumber = gstNumber || supplier.gstNumber;
      supplier.status = status || supplier.status;

      const updatedSupplier = await supplier.save();
      res.json(updatedSupplier);
    } else {
      res.status(404);
      throw new Error('Supplier not found');
    }
  } catch (error) {
    next(error);
  }
};
