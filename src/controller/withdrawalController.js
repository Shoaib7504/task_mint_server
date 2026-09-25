import { prisma } from "../config/db.connect.js";

// POST /withdrawals - Worker requests withdrawal
export const createWithdrawal = async (req, res) => {
  try {
    const { coins, paymentMethod, accountNumber } = req.body;

    const coinCount = Number(coins);
    if (!coinCount || coinCount < 200) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is 200 coins ($10.00)",
      });
    }

    if (!paymentMethod || !accountNumber || !accountNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Payment method and account number are required",
      });
    }

    // Check worker coin balance
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.coins < coinCount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You have ${user?.coins || 0} coins, but requested ${coinCount}.`,
      });
    }

    const dollarAmount = parseFloat((coinCount / 20).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct coins from worker
      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: { coins: { decrement: coinCount } },
      });

      // 2. Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          workerId: req.user.id,
          coins: coinCount,
          amount: dollarAmount,
          paymentMethod,
          accountNumber: accountNumber.trim(),
          status: "PENDING",
        },
      });

      // 3. Notify worker
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: "info",
          title: "Withdrawal Requested",
          text: `Your withdrawal request of $${dollarAmount.toFixed(2)} (${coinCount} coins) via ${paymentMethod} is pending admin review.`,
        },
      });

      return { withdrawal, remainingCoins: updatedUser.coins };
    });

    res.status(201).json({
      success: true,
      message: `Withdrawal request for $${dollarAmount.toFixed(2)} submitted successfully`,
      withdrawal: result.withdrawal,
      remainingCoins: result.remainingCoins,
    });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res.status(500).json({ success: false, message: "Failed to create withdrawal request" });
  }
};

// GET /withdrawals/my-withdrawals - Worker's withdrawal history
export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { workerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error("Error fetching worker withdrawals:", error);
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
};

// GET /withdrawals/all - Admin view of all withdrawals
export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            email: true,
            coins: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error("Error fetching all withdrawals:", error);
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
};

// PATCH /withdrawals/:id/approve - Admin approve withdrawal payout
export const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { worker: true },
    });

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status.toLowerCase()}`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      await tx.notification.create({
        data: {
          userId: withdrawal.workerId,
          type: "success",
          title: "Withdrawal Approved & Sent!",
          text: `$${withdrawal.amount.toFixed(2)} has been sent to your ${withdrawal.paymentMethod} account (${withdrawal.accountNumber}).`,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: `Withdrawal of $${withdrawal.amount.toFixed(2)} approved successfully`,
    });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res.status(500).json({ success: false, message: "Failed to approve withdrawal" });
  }
};
