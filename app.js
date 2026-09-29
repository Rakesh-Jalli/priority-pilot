const state = {
  tasks: [
    {
      title: "Stabilize checkout flow",
      owner: "Product + Engineering",
      impact: 5,
      urgency: 5,
      effort: 4,
    },
    {
      title: "Respond to top support tickets",
      owner: "Customer Success",
      impact: 4,
      urgency: 4,
      effort: 2,
    },
    {
      title: "Prepare launch update",
      owner: "Marketing",
      impact: 3,
      urgency: 3,
      effort: 2,
    },
  ],
};

const elements = {
  taskList: document.getElementById("task-list"),
  insights: document.getElementById("insights"),
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskOwner: document.getElementById("task-owner"),
  taskImpact: document.getElementById("task-impact"),
  taskUrgency: document.getElementById("task-urgency"),
  taskEffort: document.getElementById("task-effort"),
  taskPreview: document.getElementById("task-preview"),
  impactWeight: document.getElementById("impact-weight"),
  urgencyWeight: document.getElementById("urgency-weight"),
  effortWeight: document.getElementById("effort-weight"),
  impactWeightValue: document.getElementById("impact-weight-value"),
  urgencyWeightValue: document.getElementById("urgency-weight-value"),
  effortWeightValue: document.getElementById("effort-weight-value"),
  topScore: document.getElementById("top-score"),
  topTitle: document.getElementById("top-title"),
  topWhy: document.getElementById("top-why"),
  planCount: document.getElementById("plan-count"),
  highPriorityCount: document.getElementById("high-priority-count"),
  focusHours: document.getElementById("focus-hours"),
  balancedCount: document.getElementById("balanced-count"),
  loadDemo: document.getElementById("load-demo"),
  clearBoard: document.getElementById("clear-board"),
  jumpToBuilder: document.getElementById("jump-to-builder"),
  template: document.getElementById("task-template"),
};

const defaultWeights = {
  impact: Number(elements.impactWeight.value),
  urgency: Number(elements.urgencyWeight.value),
  effort: Number(elements.effortWeight.value),
};

function scoreTask(task) {
  const impactWeight = Number(elements.impactWeight.value);
  const urgencyWeight = Number(elements.urgencyWeight.value);
  const effortWeight = Number(elements.effortWeight.value);
  const rawScore = task.impact * impactWeight + task.urgency * urgencyWeight - task.effort * effortWeight;
  return Math.max(0, Math.round(rawScore * 10));
}

function riskLabel(task) {
  const urgencyBias = task.urgency + task.impact - task.effort;
  if (urgencyBias >= 8) return "Critical";
  if (urgencyBias >= 6) return "High";
  if (urgencyBias >= 4) return "Balanced";
  return "Low";
}

function effortEstimate(task) {
  const minutes = Math.max(20, task.effort * 25 + task.impact * 10);
  return `${Math.round(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ""}`.trim();
}

function sortedTasks() {
  return [...state.tasks]
    .map((task) => ({ ...task, score: scoreTask(task) }))
    .sort((left, right) => right.score - left.score);
}

function renderSummary(tasks) {
  const topTask = tasks[0];
  const highPriority = tasks.filter((task) => task.score >= 220).length;
  const balanced = tasks.filter((task) => task.score >= 140 && task.score < 220).length;
  const totalFocusMinutes = tasks.reduce((total, task) => total + task.effort * 25 + task.impact * 10, 0);

  elements.planCount.textContent = `${tasks.length} tasks`;
  elements.highPriorityCount.textContent = String(highPriority);
  elements.balancedCount.textContent = String(balanced);
  elements.focusHours.textContent = `${Math.max(1, Math.round(totalFocusMinutes / 60))}h`;

  if (!topTask) {
    elements.topScore.textContent = "0";
    elements.topTitle.textContent = "Add a task to see the recommendation";
    elements.topWhy.textContent = "The strongest task will appear here once the board has data.";
    return;
  }

  elements.topScore.textContent = String(topTask.score);
  elements.topTitle.textContent = topTask.title;
  elements.topWhy.textContent = `${topTask.owner || "Unassigned"} should start here because the task combines ${riskLabel(topTask).toLowerCase()} urgency with the best score-to-effort ratio.`;
}

function renderInsights(tasks) {
  if (!tasks.length) {
    elements.insights.innerHTML = '<div class="empty-state">No tasks yet. Load the demo or create your own backlog to generate a plan.</div>';
    return;
  }

  const topTask = tasks[0];
  const secondTask = tasks[1];
  const planText = tasks
    .slice(0, 3)
    .map((task, index) => `${index + 1}. ${task.title}`)
    .join(" ");

  const cards = [
    `Start with <strong>${topTask.title}</strong>. It has the highest score at <strong>${topTask.score}</strong> and is the clearest next action.`,
    secondTask
      ? `The fallback task is <strong>${secondTask.title}</strong>. It keeps momentum without losing focus if the top item gets blocked.`
      : "Add another task to make the prioritization engine more useful.",
    `This board is ranking <strong>${tasks.length}</strong> tasks. The top three next steps are: ${planText}.`,
  ];

  elements.insights.innerHTML = cards.map((text) => `<div class="insight">${text}</div>`).join("");
}

function renderTasks() {
  const tasks = sortedTasks();
  elements.taskList.innerHTML = "";

  if (!tasks.length) {
    elements.taskList.innerHTML = '<div class="empty-state">No tasks on the board. Use the form above or load the demo backlog.</div>';
    renderSummary([]);
    renderInsights([]);
    return;
  }

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    const node = elements.template.content.cloneNode(true);
    const card = node.querySelector(".task-card");
    node.querySelector(".task-owner").textContent = task.owner || "Unassigned";
    node.querySelector(".task-title").textContent = task.title;
    node.querySelector(".task-score").textContent = `${task.score}`;
    node.querySelector(".task-summary").textContent = `${riskLabel(task)} priority with ${effortEstimate(task)} estimated effort.`;
    const metricNodes = node.querySelectorAll(".task-metrics span");
    metricNodes[0].textContent = `Impact ${task.impact}`;
    metricNodes[1].textContent = `Urgency ${task.urgency}`;
    metricNodes[2].textContent = `Effort ${task.effort}`;

    if (task.score === tasks[0].score) {
      card.style.outline = "2px solid rgba(126, 232, 250, 0.38)";
      card.style.boxShadow = "0 20px 50px rgba(126, 232, 250, 0.1)";
    }

    fragment.appendChild(node);
  });

  elements.taskList.appendChild(fragment);
  renderSummary(tasks);
  renderInsights(tasks);
}

function updatePreview() {
  const previewTask = {
    title: elements.taskTitle.value || "Untitled task",
    impact: Number(elements.taskImpact.value),
    urgency: Number(elements.taskUrgency.value),
    effort: Number(elements.taskEffort.value),
  };
  elements.taskPreview.textContent = `Preview score: ${scoreTask(previewTask)}`;
}

function syncWeightLabels() {
  elements.impactWeightValue.textContent = elements.impactWeight.value;
  elements.urgencyWeightValue.textContent = elements.urgencyWeight.value;
  elements.effortWeightValue.textContent = elements.effortWeight.value;
}

function setDemoTasks() {
  state.tasks = [
    {
      title: "Stabilize checkout flow",
      owner: "Product + Engineering",
      impact: 5,
      urgency: 5,
      effort: 4,
    },
    {
      title: "Respond to top support tickets",
      owner: "Customer Success",
      impact: 4,
      urgency: 4,
      effort: 2,
    },
    {
      title: "Prepare launch update",
      owner: "Marketing",
      impact: 3,
      urgency: 3,
      effort: 2,
    },
    {
      title: "Clean up analytics dashboard",
      owner: "Data",
      impact: 2,
      urgency: 2,
      effort: 1,
    },
  ];
  renderTasks();
}

function resetBoard() {
  state.tasks = [];
  renderTasks();
}

function seedPreviewDefaults() {
  elements.taskImpact.value = "3";
  elements.taskUrgency.value = "3";
  elements.taskEffort.value = "3";
  updatePreview();
}

function attachEvents() {
  [elements.impactWeight, elements.urgencyWeight, elements.effortWeight].forEach((input) => {
    input.addEventListener("input", () => {
      syncWeightLabels();
      renderTasks();
    });
  });

  [elements.taskTitle, elements.taskOwner, elements.taskImpact, elements.taskUrgency, elements.taskEffort].forEach((input) => {
    input.addEventListener("input", updatePreview);
  });

  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.taskTitle.value.trim();
    if (!title) return;

    state.tasks.push({
      title,
      owner: elements.taskOwner.value.trim(),
      impact: Number(elements.taskImpact.value),
      urgency: Number(elements.taskUrgency.value),
      effort: Number(elements.taskEffort.value),
    });

    elements.taskForm.reset();
    seedPreviewDefaults();
    renderTasks();
  });

  elements.loadDemo.addEventListener("click", setDemoTasks);
  elements.clearBoard.addEventListener("click", resetBoard);
  elements.jumpToBuilder.addEventListener("click", () => {
    document.getElementById("builder").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

syncWeightLabels();
attachEvents();
seedPreviewDefaults();
renderTasks();
