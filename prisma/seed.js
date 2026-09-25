import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/config/db.connect.js";

async function main() {
  console.log("Seeding database with demo data...");

  // Clear existing data in correct dependency order
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      fullName: "Alex Rivera (Admin)",
      email: "admin@taskmint.com",
      password: hashedPassword,
      role: "ADMIN",
      coins: 5000,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Create Buyer
  const buyer = await prisma.user.create({
    data: {
      fullName: "Sarah Jenkins",
      email: "buyer@taskmint.com",
      password: hashedPassword,
      role: "BUYER",
      coins: 1250,
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Create Workers
  const worker1 = await prisma.user.create({
    data: {
      fullName: "David Chen",
      email: "worker1@taskmint.com",
      password: hashedPassword,
      role: "WORKER",
      coins: 680,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      fullName: "Elena Rostova",
      email: "worker2@taskmint.com",
      password: hashedPassword,
      role: "WORKER",
      coins: 430,
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  });

  const worker3 = await prisma.user.create({
    data: {
      fullName: "Marcus Johnson",
      email: "worker3@taskmint.com",
      password: hashedPassword,
      role: "WORKER",
      coins: 290,
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 4. Create Payments for Buyer
  await prisma.payment.createMany({
    data: [
      {
        transactionId: "TXN-DEMO-001",
        buyerId: buyer.id,
        coins: 1000,
        amount: 50.0,
        cardLast4: "4242",
        status: "COMPLETED",
      },
      {
        transactionId: "TXN-DEMO-002",
        buyerId: buyer.id,
        coins: 500,
        amount: 25.0,
        cardLast4: "1881",
        status: "COMPLETED",
      },
    ],
  });

  // 5. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: "Test Mobile App Onboarding Flow",
      detail:
        "Download our beta Android/iOS app from TestFlight/Play Beta, complete the onboarding questionnaire, and verify all screens render properly on your device resolution.",
      requiredWorkers: 15,
      totalWorkers: 20,
      payableAmount: 45,
      completionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      submissionInfo: "Provide screenshot of the final completion screen and device model/OS version.",
      imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&auto=format&fit=crop&q=80",
      taskLink: "https://testflight.apple.com/join/taskmint-demo",
      category: "Testing",
      buyerId: buyer.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Subscribe to Tech Channel & Leave Constructive Feedback",
      detail:
        "Watch our latest 8-minute tutorial video about Next.js 15, subscribe to the channel, and leave a genuine, constructive comment about the performance tips discussed.",
      requiredWorkers: 28,
      totalWorkers: 30,
      payableAmount: 25,
      completionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      submissionInfo: "Screenshot of the subscription button clicked and link or screenshot of your posted comment.",
      imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80",
      taskLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Social Media",
      buyerId: buyer.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Consumer Shopping Habits Survey (5 Mins)",
      detail:
        "Complete our brief 12-question Google Form regarding grocery shopping delivery preferences and mobile checkout frequency.",
      requiredWorkers: 40,
      totalWorkers: 50,
      payableAmount: 30,
      completionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      submissionInfo: "Paste your submission confirmation code provided on the final Google Form screen.",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
      taskLink: "https://forms.gle/demo-survey-123",
      category: "Surveys",
      buyerId: buyer.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Review SaaS Landing Page Copy & Grammar",
      detail:
        "Read our upcoming landing page copy (approx 1,200 words) and list any grammatical errors, unnatural phrasing, or unclear call-to-actions.",
      requiredWorkers: 8,
      totalWorkers: 10,
      payableAmount: 60,
      completionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      submissionInfo: "Submit a bulleted list or Google Doc link with your feedback and annotations.",
      imageUrl: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=600&auto=format&fit=crop&q=80",
      taskLink: "https://taskmint.com/draft-copy",
      category: "Content",
      buyerId: buyer.id,
    },
  });

  // 6. Submissions
  await prisma.submission.create({
    data: {
      taskId: task1.id,
      workerId: worker1.id,
      buyerId: buyer.id,
      submissionDetails: "Tested on Samsung Galaxy S23, Android 14. Screenshots uploaded to: https://drive.google.com/test-screenshots-1. App ran smoothly with no crashes.",
      payableAmount: task1.payableAmount,
      status: "PENDING",
    },
  });

  await prisma.submission.create({
    data: {
      taskId: task2.id,
      workerId: worker2.id,
      buyerId: buyer.id,
      submissionDetails: "Subscribed and commented under username @elena_dev: 'Great breakdown of Server Actions vs Route Handlers!'",
      payableAmount: task2.payableAmount,
      status: "APPROVED",
    },
  });

  // 7. Withdrawals
  await prisma.withdrawal.create({
    data: {
      workerId: worker1.id,
      coins: 200,
      amount: 10.0,
      paymentMethod: "PayPal",
      accountNumber: "david.chen@example.com",
      status: "PENDING",
    },
  });

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: buyer.id,
        type: "info",
        title: "New Submission Received",
        text: "David Chen submitted proof for 'Test Mobile App Onboarding Flow'.",
      },
      {
        userId: buyer.id,
        type: "success",
        title: "Welcome to TaskMint",
        text: "Welcome Sarah! Your buyer account has been initialized with bonus coins.",
      },
      {
        userId: worker1.id,
        type: "info",
        title: "Withdrawal Pending",
        text: "Your withdrawal of $10.00 is currently under review by our administration.",
      },
      {
        userId: worker2.id,
        type: "success",
        title: "Submission Approved",
        text: "Your submission for 'Subscribe to Tech Channel' was approved! 25 coins credited.",
      },
    ],
  });

  console.log("Seeding finished successfully!");
  console.log("Demo credentials:");
  console.log("Admin:  admin@taskmint.com  / password123");
  console.log("Buyer:  buyer@taskmint.com  / password123");
  console.log("Worker: worker1@taskmint.com / password123");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
