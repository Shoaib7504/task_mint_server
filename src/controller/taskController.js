import { prisma } from "../config/db.connect.js";

// GET /tasks - Public or worker task browse
export const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      status: "ACTIVE",
      requiredWorkers: { gt: 0 },
    };

    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (search && search.trim() !== "") {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { detail: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const validSortFields = ["payableAmount", "completionDate", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [sortField]: sortOrder.toLowerCase() === "asc" ? "asc" : "desc" };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              photoUrl: true,
            },
          },
          _count: {
            select: { submissions: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

// GET /tasks/featured - Latest / top reward active tasks for landing page
export const getFeaturedTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: "ACTIVE",
        requiredWorkers: { gt: 0 },
      },
      take: 6,
      orderBy: [{ payableAmount: "desc" }, { createdAt: "desc" }],
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching featured tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch featured tasks" });
  }
};

// GET /tasks/:id - Single task detail
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            photoUrl: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    res.status(500).json({ success: false, message: "Failed to fetch task" });
  }
};

// POST /tasks - Buyer create task (deducts coins)
export const createTask = async (req, res) => {
  try {
    const {
      title,
      detail,
      taskLink,
      taskUrl,
      requiredWorkers,
      payableAmount,
      completionDate,
      submissionInfo,
      imageUrl,
      category,
    } = req.body;

    const workers = Number(requiredWorkers);
    const amount = Number(payableAmount);

    if (!title || !detail || !workers || !amount || !completionDate || !submissionInfo) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for task creation",
      });
    }

    if (workers <= 0 || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Required workers and payable amount must be positive numbers",
      });
    }

    const totalCost = workers * amount;

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.coins < totalCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You need ${totalCost} coins but have ${user?.coins || 0} coins. Please purchase coins first.`,
      });
    }

    // Transaction: Deduct coins, create task, notify user
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct coins from buyer
      const updatedBuyer = await tx.user.update({
        where: { id: req.user.id },
        data: { coins: { decrement: totalCost } },
      });

      // 2. Create the task
      const newTask = await tx.task.create({
        data: {
          title,
          detail,
          taskLink: taskLink || taskUrl || null,
          requiredWorkers: workers,
          totalWorkers: workers,
          payableAmount: amount,
          completionDate: new Date(completionDate),
          submissionInfo,
          imageUrl: imageUrl || null,
          category: category || "General",
          buyerId: req.user.id,
        },
      });

      // 3. Create notification
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: "success",
          title: "Task Published",
          text: `"${title}" has been published. ${totalCost} coins were deducted from your balance.`,
        },
      });

      return { task: newTask, updatedCoins: updatedBuyer.coins };
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: result.task,
      remainingCoins: result.updatedCoins,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

// GET /tasks/buyer/my-tasks - List tasks created by current buyer
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { buyerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching buyer tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your tasks" });
  }
};

// PUT /tasks/:id - Update task details
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, submissionInfo, category, imageUrl, taskLink, taskUrl } = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.buyerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized to update this task" });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(detail && { detail }),
        ...(submissionInfo && { submissionInfo }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...((taskLink !== undefined || taskUrl !== undefined) && { taskLink: taskLink || taskUrl || null }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

// DELETE /tasks/:id - Delete task (Buyer refunds remaining slots, Admin deletes directly)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const isOwner = task.buyerId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this task" });
    }

    // If buyer deletes, refund remaining slots * payableAmount
    const refundCoins = isOwner ? task.requiredWorkers * task.payableAmount : 0;

    await prisma.$transaction(async (tx) => {
      if (refundCoins > 0) {
        await tx.user.update({
          where: { id: task.buyerId },
          data: { coins: { increment: refundCoins } },
        });

        await tx.notification.create({
          data: {
            userId: task.buyerId,
            type: "info",
            title: "Task Deleted & Coins Refunded",
            text: `"${task.title}" was deleted. ${refundCoins} unused coins refunded to your balance.`,
          },
        });
      }

      await tx.task.delete({ where: { id } });
    });

    res.status(200).json({
      success: true,
      message: isOwner && refundCoins > 0
        ? `Task deleted and ${refundCoins} coins refunded to your account`
        : "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};
