import { prisma } from "../config/db.connect.js";

// GET /dashboard/buyer-stats
export const getBuyerDashboardStats = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const [
      buyer,
      totalTasks,
      pendingSubmissionsCount,
      payments,
      pendingReviews,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: buyerId }, select: { coins: true } }),
      prisma.task.count({ where: { buyerId } }),
      prisma.submission.count({ where: { buyerId, status: "PENDING" } }),
      prisma.payment.findMany({
        where: { buyerId },
        select: { amount: true, coins: true },
      }),
      prisma.submission.findMany({
        where: { buyerId, status: "PENDING" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          worker: { select: { fullName: true, photoUrl: true, email: true } },
          task: { select: { title: true, payableAmount: true } },
        },
      }),
    ]);

    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPurchasedCoins = payments.reduce((acc, p) => acc + (p.coins || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        pendingReviewCount: pendingSubmissionsCount,
        totalPaymentDollars: totalPaid,
        totalPurchasedCoins,
        availableCoins: buyer?.coins || 0,
      },
      pendingReviews,
    });
  } catch (error) {
    console.error("Error fetching buyer dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch buyer stats" });
  }
};

// GET /dashboard/worker-stats
export const getWorkerDashboardStats = async (req, res) => {
  try {
    const workerId = req.user.id;

    const [
      worker,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      recentApproved,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: workerId }, select: { coins: true } }),
      prisma.submission.count({ where: { workerId } }),
      prisma.submission.count({ where: { workerId, status: "PENDING" } }),
      prisma.submission.findMany({
        where: { workerId, status: "APPROVED" },
        select: { payableAmount: true },
      }),
      prisma.submission.findMany({
        where: { workerId, status: "APPROVED" },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          task: {
            select: {
              title: true,
              payableAmount: true,
              buyer: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    const totalEarnedCoins = approvedSubmissions.reduce(
      (acc, s) => acc + (s.payableAmount || 0),
      0
    );

    res.status(200).json({
      success: true,
      stats: {
        totalSubmissions,
        pendingSubmissions,
        totalEarnedCoins,
        totalEarnedDollars: parseFloat((totalEarnedCoins / 20).toFixed(2)),
        availableCoins: worker?.coins || 0,
        availableDollars: parseFloat(((worker?.coins || 0) / 20).toFixed(2)),
      },
      recentApproved,
    });
  } catch (error) {
    console.error("Error fetching worker dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch worker stats" });
  }
};

// GET /dashboard/admin-stats
export const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalWorkers,
      totalBuyers,
      allUsers,
      totalPayments,
      pendingWithdrawals,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "WORKER" } }),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.findMany({ select: { coins: true } }),
      prisma.payment.findMany({ select: { amount: true } }),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          coins: true,
          createdAt: true,
        },
      }),
    ]);

    const totalAvailableCoins = allUsers.reduce((sum, u) => sum + (u.coins || 0), 0);
    const totalPaymentsAmount = totalPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalWorkers,
        totalBuyers,
        totalAvailableCoins,
        totalPaymentsAmount,
        pendingWithdrawals,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin stats" });
  }
};
