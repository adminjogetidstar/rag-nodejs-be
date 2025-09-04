import { RoleModel, UserModel, UserRoleModel } from "../models/index.js";
import { decrypt } from "../utils/encryption_util.js";

const putUser = async (req, res) => {
  const { userId, roleId, chat } = req.body;

  if (!userId || !roleId || !chat) {
    return res.status(400).json({
      success: false,
      message: "userId, roleId, and chat are required"
    });
  }

  try {
    const existing = await UserModel.findOne({ where: { id: userId } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User Id not found",
      });
    }


    const updateData = {};
    if (userId !== undefined) updateData.userId = userId;
    if (roleId !== undefined) updateData.roleId = roleId;

    const updateDataUser = {}
    if (chat !== undefined) updateDataUser.chat = chat;

    await UserModel.update(
      updateDataUser,
      {  where: { id: userId } }
    )

    await UserRoleModel.update(
      updateData, 
      { where: { userId: userId } }
    );

    const user = await UserModel.findOne({ where: { id: userId } });
    const userRole = await UserRoleModel.findOne({ where: { userId: userId } });
    const role = await RoleModel.findOne({ where: { id: userRole.roleId } });
    const data = {
      userId: user.id,
      email: decrypt(user.email),
      name: user.name,
      roleId: userRole.roleId,
      role: role.name,
      chat: user.chat,
      createdAt: userRole.createdAt,
      updatedAt: userRole.updatedAt
    }
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data
    });
  } catch (err) {
    console.error("Error PUT /users", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const users = await UserModel.findAll({
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: limit,
      include: {
        model: UserRoleModel,
        include: RoleModel
      }
    });

    const data = users.map(user => {
      return {
        userId: user.id,
        email: decrypt(user.email),
        name: user.name,
        roleId: user.UserRole.roleId,
        role: user.UserRole.Role.name,
        chat: user.chat,
        createdAt: user.UserRole.createdAt,
        updatedAt: user.UserRole.updatedAt
      };
    })

    const totalCount = await UserModel.count();

    res.json({
      success: true,
      message: "List of users",
      data,
      pagination: {
        currentPage: page,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error("Error during GET /users:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

const deleteUsers = async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json({
      success: false,
      message: "userIds is required and must be a non-empty array"
    })
  }

  try {
    // Ambil data dari tables
    const users = await UserModel.findAll({
      where: {
        id: userIds
      }
    });

    if (users.length === 0) {
      res.status(404).json({
        success: false, message: 'No users found with given IDs'
      });
    }

    // Hapus data dari tables
    await UserRoleModel.destroy({
      where: {
        userId: userIds
      }
    });
    await UserModel.destroy({
      where: {
        id: userIds
      }
    });

    res.json({
      success: true,
      message: 'Users deleted successfully.',
      data: {
        deleted: users.length 
      }
    });
  } catch (err) {
    console.error("Error during DELETE /users:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
}

export {
  putUser,
  getUsers,
  deleteUsers
}