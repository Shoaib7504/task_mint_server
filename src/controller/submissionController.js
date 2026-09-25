import { prisma } from "../config/db.connect.js";

// POST /submissions - Worker submits task proof
export const createSubmission = async (req, res) => {
  try {
    const { taskId, submissionDetails } = req.body;

    if (!taskId || !submissionDetails || !submissionDetails.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task ID and submission details are required",
      });
    }

    // 1. Check task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { buyer: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.status !== "ACTIVE" || task.requiredWorkers <= 0) {
      return res.status(400).json({
        success: false,
        message: "This task is no longer accepting submissions",
      });
    }

    if (task.buyerId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot submit to your own task",
      });
    }

    // 2. Check if worker already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        taskId,
        workerId: req.user.id,
      },
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted proof for this task",
      });
    }

    // 3. Create submission and decrement slot
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          taskId,
          workerId: req.user.id,
          buyerId: task.buyerId,
          submissionDetails: submissionDetails.trim(),
          payableAmount: task.payableAmount,
          status: "PENDING",
        },
      });

      const updatedRemaining = task.requiredWorkers - 1;
      await tx.task.update({
        where: { id: taskId },
        data: {
          requiredWorkers: updatedRemaining,
          status: updatedRemaining === 0 ? "COMPLETED" : "ACTIVE",
        },
      });

      // Notify buyer
      await tx.notification.create({
        data: {
          userId: task.buyerId,
          type: "info",
          title: "New Task Submission",
          text: `${req.user.fullName || "A worker"} submitted proof for "${task.title}".`,
        },
      });

      // Notify worker
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: "success",
          title: "Submission Sent",
          text: `Your proof for "${task.title}" has been submitted for review.`,
        },
      });

      return submission;
    });

    res.status(201).json({
      success: true,
      message: "Submission sent successfully",
      submission: result,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ success: false, message: "Failed to submit task proof" });
  }
};

// GET /submissions/my-submissions - List worker's submissions
export const getMySubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = { workerId: req.user.id };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              payableAmount: true,
              buyer: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      submissions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching worker submissions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch submissions" });
  }
};

// GET /submissions/buyer/reviews - Submissions pending buyer review
export const getBuyerReviews = async (req, res) => {
  try {
    const { status = "PENDING" } = req.query;
    const where = { buyerId: req.user.id };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            email: true,
            photoUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            payableAmount: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error("Error fetching buyer reviews:", error);
    res.status(500).json({ success: false, message: "Failed to fetch submissions to review" });
  }
};

// PATCH /submissions/:id/approve - Buyer approves submission
export const approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { task: true, worker: true },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (submission.buyerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to review this submission" });
    }

    if (submission.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Submission has already been ${submission.status.toLowerCase()}`,
      });
    }

    // Transaction: Approve and credit worker
    await prisma.$transaction(async (tx) => {
      // 1. Update submission status
      await tx.submission.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      // 2. Add coins to worker
      await tx.user.update({
        where: { id: submission.workerId },
        data: { coins: { increment: submission.payableAmount } },
      });

      // 3. Notify worker
      await tx.notification.create({
        data: {
          userId: submission.workerId,
          type: "success",
          title: "Submission Approved!",
          text: `You earned ${submission.payableAmount} coins for "${submission.task.title}".`,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: `Submission approved and ${submission.payableAmount} coins sent to worker`,
    });
  } catch (error) {
    console.error("Error approving submission:", error);
    res.status(500).json({ success: false, message: "Failed to approve submission" });
  }
};

// PATCH /submissions/:id/reject - Buyer rejects submission
export const rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (submission.buyerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to review this submission" });
    }

    if (submission.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Submission has already been ${submission.status.toLowerCase()}`,
      });
    }

    // Transaction: Reject and reopen slot
    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.submission.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      // 2. Re-open 1 worker slot on the task
      await tx.task.update({
        where: { id: submission.taskId },
        data: {
          requiredWorkers: { increment: 1 },
          status: "ACTIVE",
        },
      });

      // 3. Notify worker
      await tx.notification.create({
        data: {
          userId: submission.workerId,
          type: "danger",
          title: "Submission Rejected",
          text: `Your submission for "${submission.task.title}" was rejected by the buyer.`,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "Submission rejected and 1 task slot reopened",
    });
  } catch (error) {
    console.error("Error rejecting submission:", error);
    res.status(500).json({ success: false, message: "Failed to reject submission" });
  }
};
