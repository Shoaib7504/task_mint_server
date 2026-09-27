import { prisma } from "../config/db.connect.js";

// POST /role-requests  — Worker submits a request to become a buyer
export const submitRoleRequest = async (req, res) => {
  try {
    const workerId = req.user.id;

    if (req.user.role !== "WORKER") {
      return res.status(403).json({
        success: false,
        message: "Only workers can request to become a buyer.",
      });
    }

    const existing = await prisma.roleRequest.findFirst({
      where: { userId: workerId, status: "PENDING" },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request. Please wait for admin review.",
      });
    }

    const { note } = req.body;

    const roleRequest = await prisma.roleRequest.create({
      data: {
        userId: workerId,
        note: note?.trim() || null,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "ROLE_REQUEST",
          title: "New Buyer Role Request",
          text: `Worker ${req.user?.fullName || req.user?.email || "User"} has requested to become a buyer.`,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: "Your request has been submitted. Admin will review it shortly.",
      roleRequest,
    });
  } catch (error) {
    console.error("submitRoleRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to submit request." });
  }
};

// GET /role-requests/my  — Worker checks their own latest request
export const getMyRoleRequest = async (req, res) => {
  try {
    const request = await prisma.roleRequest.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, request });
  } catch (error) {
    console.error("getMyRoleRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch request." });
  }
};

// GET /role-requests  — Admin lists all requests
export const getAllRoleRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = {};
    if (status && status !== "ALL") where.status = status.toUpperCase();

    const [requests, total] = await Promise.all([
      prisma.roleRequest.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, photoUrl: true, coins: true, createdAt: true },
          },
        },
      }),
      prisma.roleRequest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      requests,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / take) || 1 },
    });
  } catch (error) {
    console.error("getAllRoleRequests error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch requests." });
  }
};

// PATCH /role-requests/:id  — Admin approves or rejects
export const resolveRoleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: "status must be APPROVED or REJECTED." });
    }

    const roleRequest = await prisma.roleRequest.findUnique({ where: { id }, include: { user: true } });
    if (!roleRequest) return res.status(404).json({ success: false, message: "Request not found." });
    if (roleRequest.status !== "PENDING")
      return res.status(409).json({ success: false, message: "This request has already been resolved." });

    const newStatus = status.toUpperCase();

    await prisma.$transaction(async (tx) => {
      await tx.roleRequest.update({ where: { id }, data: { status: newStatus } });
      if (newStatus === "APPROVED") {
        await tx.user.update({ where: { id: roleRequest.userId }, data: { role: "BUYER" } });
      }
      await tx.notification.create({
        data: {
          userId: roleRequest.userId,
          type: "ROLE_REQUEST_RESOLVED",
          title: newStatus === "APPROVED" ? "Role Upgrade Approved" : "Role Request Rejected",
          text: newStatus === "APPROVED"
            ? "Congratulations! Your request to become a Buyer has been approved. You can now post tasks."
            : "Your request to become a Buyer was not approved at this time.",
        },
      });
    });

    res.status(200).json({ success: true, message: `Request ${newStatus.toLowerCase()} successfully.` });
  } catch (error) {
    console.error("resolveRoleRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve request." });
  }
};
