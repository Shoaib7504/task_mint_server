import { prisma } from "../config/db.connect.js";

// GET /notifications - User notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// PATCH /notifications/read-all - Mark all user notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};

// PATCH /notifications/:id/read - Mark one notification as read
export const markOneAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Failed to update notification" });
  }
};
