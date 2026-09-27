import { prisma } from "../config/db.connect.js";
import bcrypt from "bcrypt";

// GET /users/top-workers - Public top 6 workers with most coins
export const getTopWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: {
        role: "WORKER",
        status: "ACTIVE",
      },
      take: 6,
      orderBy: { coins: "desc" },
      select: {
        id: true,
        fullName: true,
        photoUrl: true,
        coins: true,
        _count: {
          select: {
            submissions: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, workers });
  } catch (error) {
    console.error("Error fetching top workers:", error);
    res.status(500).json({ success: false, message: "Failed to fetch top workers" });
  }
};

// GET /users/platform-stats - Public landing page stats
export const getPlatformStats = async (req, res) => {
  try {
    const [workersCount, buyersCount, tasksCount, completedWithdrawals] = await Promise.all([
      prisma.user.count({ where: { role: "WORKER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "BUYER", status: "ACTIVE" } }),
      prisma.task.count(),
      prisma.withdrawal.findMany({
        where: { status: "APPROVED" },
        select: { amount: true },
      }),
    ]);

    const totalPayouts = completedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalWorkers: workersCount,
        totalBuyers: buyersCount,
        totalTasks: tasksCount,
        totalPayouts: Math.round(totalPayouts),
      },
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch platform stats" });
  }
};

// GET /users - Admin list all users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};

    if (role && role !== "ALL") {
      where.role = role.toUpperCase();
    }

    if (search && search.trim() !== "") {
      where.OR = [
        { fullName: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          coins: true,
          photoUrl: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// PATCH /users/:id/role - Admin update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["WORKER", "BUYER", "ADMIN"];
    if (!role || !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        coins: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role.toUpperCase()}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};

// DELETE /users/:id - Admin delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own admin account" });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};


// PATCH /users/profile - Authenticated user updates their own profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, name, photoUrl, password, currentPassword } = req.body;

    const dataToUpdate = {};
    const resolvedName = fullName || name;
    if (resolvedName && resolvedName.trim() !== "") {
      dataToUpdate.fullName = resolvedName.trim();
    }

    if (photoUrl !== undefined) {
      dataToUpdate.photoUrl = photoUrl ? photoUrl.trim() : null;
    }

    // Optional password update
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }

      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (currentUser?.password) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: "Current password is required to change password" });
        }
        const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: "Current password does not match" });
        }
      }

      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        coins: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: { ...updatedUser, name: updatedUser.fullName },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
