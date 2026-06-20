import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({ where: { role: "customer" } });
  const plans = await p.plan.findMany({ where: { name: { not: "Free" } } });

  if (users.length === 0) {
    console.log("No customer users found. Skipping.");
    return;
  }

  const existing = await p.payment.count();
  if (existing > 0) {
    console.log(`Payments already exist (${existing}). Skipping seed.`);
    return;
  }

  const statuses = ["pending", "completed", "failed", "refunded"];
  const reviewStatuses = ["pending", "approved", "rejected", "flagged"];
  const priorities = ["low", "normal", "high", "urgent"];
  const methods = ["paypal", "stripe", "crypto", "bank_transfer", "cashapp"];

  const payments: any[] = [];

  for (let i = 0; i < 25; i++) {
    const user = users[i % users.length];
    const plan = plans[i % plans.length];
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const reviewedAt =
      Math.random() > 0.4
        ? new Date(createdAt.getTime() + Math.floor(Math.random() * 86400000 * 3))
        : null;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const reviewStatus = reviewedAt
      ? ["approved", "rejected", "flagged"][Math.floor(Math.random() * 3)]
      : "pending";
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    payments.push({
      userId: user.id,
      planId: plan.id,
      amount: plan.price,
      currency: "USD",
      status,
      reviewStatus,
      priority,
      method: methods[Math.floor(Math.random() * methods.length)],
      transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
      description: `Payment for ${plan.name} plan`,
      reviewedAt,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // Add some edge cases
  const firstUser = users[0];
  payments.push({
    userId: firstUser.id,
    planId: plans[0].id,
    amount: 9999.99,
    currency: "USD",
    status: "pending",
    reviewStatus: "flagged",
    priority: "urgent",
    method: "crypto",
    transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
    description: "Suspicious large payment - possible fraud",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  });
  payments.push({
    userId: firstUser.id,
    planId: plans[plans.length - 1].id,
    amount: 0.01,
    currency: "USD",
    status: "completed",
    reviewStatus: "approved",
    priority: "low",
    method: "cashapp",
    transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
    description: "Test payment - $0.01",
    reviewedAt: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 3600000),
  });

  await p.payment.createMany({ data: payments });
  console.log(`Seeded ${payments.length} test payments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
