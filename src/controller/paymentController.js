import { prisma } from "../config/db.connect.js";

// POST /payments/fake-checkout - Buyer instant mock payment & coin credit
export const fakeCheckout = async (req, res) => {
  try {
    const { coins, amount, cardLast4 = "4242" } = req.body;

    const coinCount = Number(coins);
    const dollarAmount = Number(amount);

    if (!coinCount || coinCount <= 0 || !dollarAmount || dollarAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid coin package or amount",
      });
    }

    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Credit coins to buyer
      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          coins: { increment: coinCount },
        },
      });

      // 2. Create payment record
      const payment = await tx.payment.create({
        data: {
          transactionId,
          buyerId: req.user.id,
          coins: coinCount,
          amount: dollarAmount,
          cardLast4: String(cardLast4).slice(-4),
          status: "COMPLETED",
        },
      });

      // 3. Create notification
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: "success",
          title: "Payment Successful",
          text: `Payment of $${dollarAmount.toFixed(2)} confirmed! ${coinCount.toLocaleString()} coins have been added to your balance.`,
        },
      });

      return { payment, coins: updatedUser.coins };
    });

    res.status(200).json({
      success: true,
      message: `Payment confirmed! ${coinCount.toLocaleString()} coins added.`,
      payment: result.payment,
      currentCoins: result.coins,
    });
  } catch (error) {
    console.error("Error processing fake checkout:", error);
    res.status(500).json({ success: false, message: "Payment processing failed" });
  }
};

// GET /payments/history - Buyer payment records
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { buyerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment history" });
  }
};
