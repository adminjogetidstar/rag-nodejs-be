import { RoleModel } from "../models/index.js";

const postRole = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name are required"
    });
  }

  try {
    const existing = await RoleModel.findOne({ where: { name: name } });

    if (existing) {
      return res.status(400).json({
        success: true,
        message: "Role already exists",
      });
    }

    const role = await RoleModel.create({ name });

    return res.status(201).json({
      success: true,
      message: "Role added successfully",
      data: role
    });
  } catch (err) {
    console.error("Error POST /roles", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

const putRole = async (req, res) => {
  const { id, name, status } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Id are required"
    });
  }

  try {
    const existing = await RoleModel.findOne({ where: { id: id } });

    if (!existing) {
      return res.status(404).json({
        success: true,
        message: "Id not found",
      });
    }


    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;

    await RoleModel.update(
      updateData, 
      { where: { id: id } }
    );

    const updatedRole = await RoleModel.findOne({ where: { id: id } });
    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole
    });
  } catch (err) {
    console.error("Error PUT /roles", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

const getRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }

    const roles = await RoleModel.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit
    });

    const totalCount = await RoleModel.count({
      where: whereCondition
    });

    res.json({
      success: true,
      message: "List of roles",
      data: roles,
      pagination: {
        currentPage: page,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error("Error during GET /roles:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

export {
  postRole,
  putRole,
  getRoles,
}