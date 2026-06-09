export function calculateSavingsGoalProgress(goal, contributions = []) {
  const targetAmount = Number(goal.targetAmount || 0);
  const startingAmount = Number(goal.currentAmount || 0);
  const contributed = contributions.reduce(
    (total, contribution) => total + Number(contribution.amount || 0),
    0
  );
  const currentAmount = startingAmount + contributed;
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

  return {
    targetAmount,
    currentAmount,
    contributed,
    remaining,
    progress,
    isComplete: remaining === 0,
  };
}

export function buildGoalFundingPlan(goal, monthlyCapacity, today = new Date()) {
  const progress = calculateSavingsGoalProgress(goal);
  const capacity = Number(monthlyCapacity || 0);
  const deadline = goal.deadline ? new Date(goal.deadline) : null;

  if (capacity <= 0 && progress.remaining > 0) {
    return {
      ...progress,
      monthlyRequired: null,
      projectedCompletionDate: null,
      status: "blocked",
      monthsRemaining: deadline ? monthsBetween(today, deadline) : null,
    };
  }

  const projectedMonths = progress.remaining === 0 ? 0 : Math.ceil(progress.remaining / capacity);
  const projectedCompletionDate = addMonths(today, projectedMonths);
  const monthsRemaining = deadline ? monthsBetween(today, deadline) : null;
  const monthlyRequired =
    deadline && monthsRemaining > 0 ? progress.remaining / monthsRemaining : capacity;

  return {
    ...progress,
    monthlyRequired,
    projectedCompletionDate,
    monthsRemaining,
    status: getGoalStatus(progress, projectedMonths, monthsRemaining),
  };
}

export function prioritizeGoals(goals, monthlyCapacity, today = new Date()) {
  return goals
    .map((goal) => ({
      ...goal,
      plan: buildGoalFundingPlan(goal, monthlyCapacity, today),
      urgency: calculateGoalUrgency(goal, today),
    }))
    .sort((first, second) => second.urgency - first.urgency);
}

function calculateGoalUrgency(goal, today) {
  const progress = calculateSavingsGoalProgress(goal);
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const deadlineScore = deadline ? Math.max(0, 24 - monthsBetween(today, deadline)) : 0;
  const gapScore = progress.targetAmount > 0 ? (progress.remaining / progress.targetAmount) * 10 : 0;
  const priorityScore = Number(goal.priority || 1) * 5;

  return deadlineScore + gapScore + priorityScore;
}

function getGoalStatus(progress, projectedMonths, monthsRemaining) {
  if (progress.isComplete) return "complete";
  if (monthsRemaining === null) return "on-track";
  if (projectedMonths <= monthsRemaining) return "on-track";
  if (projectedMonths <= monthsRemaining + 2) return "at-risk";
  return "off-track";
}

function monthsBetween(start, end) {
  const yearDiff = end.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = end.getUTCMonth() - start.getUTCMonth();
  return Math.max(yearDiff * 12 + monthDiff, 0);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
