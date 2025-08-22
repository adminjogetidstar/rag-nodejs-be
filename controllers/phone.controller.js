import { PhoneModel } from "../models/index.js";
import { decrypt, encrypt, hashValue } from "../utils/encryption_util.js";

const postPhone = async (req, res) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({
      success: false,
      message: "Name and number are required"
    });
  }

  const encryptedNumber = encrypt(number);
  const hashedNumber = hashValue(number);

  try {
    const existing = await PhoneModel.findOne({ where: { numberHash: hashedNumber } });

    if (existing) {
      return res.status(400).json({
        success: true,
        message: "Phone number already exists",
      });
    }

    const phone = await PhoneModel.create({ name, number: encryptedNumber, numberHash: hashedNumber });
    const data = {
      id: phone.id,
      name: phone.name,
      number: decrypt(phone.number),
      createdAt: phone.createdAt,
      updatedAt: phone.updatedAt,
      status: phone.status
    };

    return res.status(201).json({
      success: true,
      message: "Phone added successfully",
      data: data
    });
  } catch (err) {
    console.error("Error POST /phones", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

const putPhone = async (req, res) => {
  const { id, name, number, status } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Id are required"
    });
  }

  try {
    const existing = await PhoneModel.findOne({ where: { id: id } });

    if (!existing) {
      return res.status(404).json({
        success: true,
        message: "Id not found",
      });
    }


    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (number !== undefined) {
      updateData.number = encrypt(number);
      updateData.numberHash = hashValue(number);
    }
    if (status !== undefined) updateData.status = status;

    await PhoneModel.update(
      updateData, 
      { where: { id: id } }
    );

    const updatedPhone = await PhoneModel.findOne({ where: { id: id } });
    const data = {
      id: updatedPhone.id,
      name: updatedPhone.name,
      number: decrypt(updatedPhone.number),
      createdAt: updatedPhone.createdAt,
      updatedAt: updatedPhone.updatedAt,
      status: updatedPhone.status
    };
    return res.status(200).json({
      success: true,
      message: "Phone updated successfully",
      data: data
    });
  } catch (err) {
    console.error("Error PUT /phones", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

const getPhones = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const phones = await PhoneModel.findAll({
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit
    });

    const data = phones.map(phone => ({
      id: phone.id,
      name: phone.name,
      number: decrypt(phone.number),
      createdAt: phone.createdAt,
      updatedAt: phone.updatedAt,
      status: phone.status
    }));

    const totalCount = await PhoneModel.count();

    res.json({
      success: true,
      message: "List of whitelisted phones.",
      data: data,
      pagination: {
        currentPage: page,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error("Error during GET /phones:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const deletePhones = async (req, res) => {
  const { phoneIds } = req.body;

  if (!Array.isArray(phoneIds) || phoneIds.length === 0) {
    res.status(400).json({
      success: false,
      message: "phoneIds is required and must be a non-empty array"
    })
  }

  try {
    // Ambil data dari tables
    const phones = await PhoneModel.findAll({
      where: {
        id: phoneIds
      }
    });

    if (phones.length === 0) {
      res.status(404).json({
        success: false, message: 'No phones found with given IDs'
      });
    }

    // Hapus data dari tables
    await PhoneModel.destroy({
      where: {
        id: phoneIds
      }
    });

    res.json({
      success: true,
      message: 'Phones deleted successfully.',
      data: {
        deleted: phones.length 
      }
    });
  } catch (err) {
    console.error("Error during DELETE /phones:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

export {
  postPhone,
  putPhone,
  getPhones,
  deletePhones
}