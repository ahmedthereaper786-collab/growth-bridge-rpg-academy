// GROWTH BRIDGE RPG ACADEMY
// Local demo version

const STORAGE_KEY = "growthBridgeAcademy";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  name: "Adventurer",
  avatar: "🛡️",
  xp: 0,
  coins: 0,
  tasks: [],
  adoptedPet: "",
  petEmoji: "",
  weeklyWinner: "",
  monthlyWinner: "",
  achievements: [],
  awards: [],
  levels: [
    "Level 1 - Maths",
    "Level 2 - Science",
    "Level 3 - Social",
    "Level 4 - English",
    "Boss Level 5",
    "Level 6 - Maths",
    "Level 7 - Science",
    "Level 8 - Social",
    "Level 9 - Malayalam",
    "Boss Level 10",
    "Level 11 - Maths",
    "Level 12 - Science",
    "Level 13 - Social",
    "Boss Level 14",
    "Master Level",
    "Final Revision Arc",
    "Final Battle"
  ]
};

let selectedAvatar = data.avatar;
let leaderboardPeriod = "week";

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateDashboard();
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Loading screen

let loading = 0;

const loadingTimer = setInterval(() => {
  loading += 2;
  document.getElementById("loadingBar").style.width = loading + "%";
  document.getElementById("loadingPercent").textContent = loading + "%";

  if (loading >= 100) {
    clearInterval(loadingTimer);

    setTimeout(() => {
      document.getElementById("loadingScreen").classList.add("hidden");
      document.getElementById("app").classList.remove("hidden");
      updateDashboard();
      renderTasks();
    }, 400);
  }
}, 35);

// Navigation

function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(screenName);

  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (screenName === "missions") renderTasks();
  if (screenName === "progress") updateDashboard();
  if (screenName === "community") renderLeaderboard();
  if (screenName === "ambassadors") renderAwards();
}

// Tasks and missions

function addTask() {
  const input = document.getElementById("taskInput");
  const category = document.getElementById("taskCategory").value;
  const points = Number(document.getElementById("taskPoints").value);

  const title = input.value.trim();

  if (!title) {
    alert("Please enter a mission name.");
    return;
  }

  if (!Number.isFinite(points) || points < 1 || points > 50) {
    alert("Enter a valid AP value between 1 and 50.");
    return;
  }

  data.tasks.push({
    id: Date.now(),
    title,
    category,
    points,
    evidence: "",
    completed: false,
    date: new Date().toISOString()
  });

  input.value = "";
  saveData();
  renderTasks();
}

function completeTask(id) {
  const task = data.tasks.find(item => item.id === id);

  if (!task || task.completed) return;

  const evidence = prompt(
    "Enter evidence of completion (for example: notebook page, exercise or recall result):"
  );

  if (evidence === null || !evidence.trim()) {
    alert("Please enter evidence before claiming completion.");
    return;
  }

  task.completed = true;
  task.evidence = evidence.trim();
  task.completedAt = new Date().toISOString();

  const earned = Math.min(task.points, getRemainingDailyAP());

  task.earnedAP = earned;
  data.xp += earned;
  data.coins += Math.floor(earned / 5);

  saveData();
  renderTasks();
  checkAchievements();

  alert("Mission completed! You earned " + earned + " AP.");
}

function deleteTask(id) {
  if (!confirm("Delete this mission?")) return;

  data.tasks = data.tasks.filter(task => task.id !== id);
  saveData();
  renderTasks();
}

function renderTasks() {
  const active = document.getElementById("activeTasks");
  const completed = document.getElementById("completedTasks");

  if (!active || !completed) return;

  const pending = data.tasks.filter(task => !task.completed);
  const finished = data.tasks.filter(task => task.completed);

  active.innerHTML = pending.length
    ? pending.map(task => `
      <div class="task">
        <div class="task-info">
          <strong>${safeText(task.title)}</strong>
          <small>${safeText(task.category)} · ${task.points} possible AP</small>
        </div>
        <div class="task-actions">
          <button onclick="completeTask(${task.id})">Complete</button>
          <button class="secondary" onclick="deleteTask(${task.id})">Delete</button>
        </div>
      </div>
    `).join("")
    : "<p class='muted'>No active missions. Add a new one!</p>";

  completed.innerHTML = finished.length
    ? finished.map(task => `
      <div class="task done">
        <div class="task-info">
          <strong>✓ ${safeText(task.title)}</strong>
          <small>${safeText(task.category)} · ${task.earnedAP || 0} AP earned</small>
          <small>Evidence: ${safeText(task.evidence || "")}</small>
        </div>
      </div>
    `).join("")
    : "<p class='muted'>Completed missions will appear here.</p>";
}

// AP calculations

function startOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getTodayTasks() {
  const today = startOfDay();

  return data.tasks.filter(task =>
    task.completed &&
    task.completedAt &&
    startOfDay(new Date(task.completedAt)).getTime() === today.getTime()
  );
}

function getTodayAP() {
  return getTodayTasks().reduce(
    (total, task) => total + (task.earnedAP || 0), 0
  );
}

function getRemainingDailyAP() {
  const today = new Date().getDay();
  const isHoliday = today === 0;
  const maximum = isHoliday ? 150 : 100;

  return Math.max(0, maximum - getTodayAP());
}

function getWeekAP() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return data.tasks
    .filter(task =>
      task.completed &&
      task.completedAt &&
      new Date(task.completedAt) >= monday
    )
    .reduce((sum, task) => sum + (task.earnedAP || 0), 0);
}

// Dashboard

function updateDashboard() {
  const today = getTodayAP();
  const weekly = getWeekAP();

  const values = {
    xp: data.xp,
    coins: data.coins,
    todayStat: today,
    progressToday: today,
    weeklyAP: weekly,
    progressXP: data.xp,
    progressCoins: data.coins,
    achievementStat: data.achievements.length
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  document.getElementById("playerName").textContent = data.name;
  document.getElementById("levelStat").textContent =
    Math.floor(data.xp / 100) + 1;

  const weeklyPercent = Math.min(100, weekly / 750 * 100);
  document.getElementById("weeklyBar").style.width = weeklyPercent + "%";

  let message = "Keep going! Complete your missions.";

  if (weekly >= 750) message = "Perfect weekly AP performance!";
  else if (weekly >= 600) message = "Normal performance band.";
  else if (weekly >= 400) message = "Recovery test and corrections required.";
  else if (weekly > 0) message = "Intensive recovery band: revise weak topics.";

  document.getElementById("weeklyMessage").textContent = message;

  const journey = document.getElementById("levelJourney");

  journey.innerHTML = data.levels.map((level, index) => `
    <div class="achievement">
      ${index + 1}. ${safeText(level)}
      <span>${index === 0 ? "CURRENT" : "LOCKED"}</span>
    </div>
  `).join("");
}

// Achievements

function unlockAchievement(name) {
  if (data.achievements.includes(name)) return;

  data.achievements.push(name);
  saveData();

  const list = document.getElementById("unlockedAchievements");

  if (list) {
    list.innerHTML = data.achievements.map(item =>
      `<div class="achievement">🏆 ${safeText(item)}</div>`
    ).join("");
  }
}

function checkAchievements() {
  const completedCount = data.tasks.filter(task => task.completed).length;

  if (completedCount >= 1) {
    unlockAchievement("First Mission");
  }

  const studyCount = data.tasks.filter(task =>
    task.completed && task.category === "Study"
  ).length;

  if (studyCount >= 10) {
    unlockAchievement("Study Champion");
  }
}

function renderAchievements() {
  const list = document.getElementById("unlockedAchievements");

  if (!list) return;

  list.innerHTML = data.achievements.length
    ? data.achievements.map(item =>
        `<div class="achievement">🏆 ${safeText(item)}</div>`
      ).join("")
    : "No achievements unlocked yet.";
}

// Leaderboard demo

function setLeaderboard(period) {
  leaderboardPeriod = period;
  renderLeaderboard();
}

function renderLeaderboard() {
  const board = document.getElementById("leaderboard");

  if (!board) return;

  const score = leaderboardPeriod === "week"
    ? getWeekAP()
    : data.xp;

  const members = [
    { name: data.name, score },
    { name: "Classmate 1", score: 0 },
    { name: "Classmate 2", score: 0 }
  ];

  members.sort((a, b) => b.score - a.score);

  board.innerHTML = members.map((member, index) => `
    <div class="rank-row">
      <span>${index + 1}. ${safeText(member.name)}</span>
      <strong>${member.score} ${leaderboardPeriod === "week" ? "AP" : "XP"}</strong>
    </div>
  `).join("");
}

// Character

function chooseAvatar(avatar) {
  selectedAvatar = avatar;
  document.getElementById("avatarPreview").textContent = avatar;
}

function saveCharacter() {
  const name = document.getElementById("nameInput").value.trim();

  if (name) data.name = name;

  data.avatar = selectedAvatar;
  document.getElementById("playerName").textContent = data.name;

  saveData();
  alert("Character saved!");
}

// Animals

function adoptAnimal(name, emoji) {
  data.adoptedPet = name;
  data.petEmoji = emoji;

  document.getElementById("petDisplay").textContent =
    emoji + " Your companion: " + name;

  saveData();
  alert("You adopted " + name + "!");
}

// Ambassador awards

function renderAwards() {
  document.getElementById("weeklyWinner").textContent =
    data.weeklyWinner || "Not announced";

  document.getElementById("monthlyWinner").textContent =
    data.monthlyWinner || "Not announced";

  document.getElementById("tokenStatus").textContent =
    data.awards.length
      ? "👑 Ambassador token collected!"
      : "🔒 Not yet collected";
}

// Settings and backup

function exportData() {
  const file = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "growth-bridge-backup.json";
  link.click();

  URL.revokeObjectURL(url);
}

function resetData() {
  if (!confirm("Are you sure? This will erase your local academy progress.")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

// Restore saved content

function restoreSavedContent() {
  document.getElementById("playerName").textContent = data.name;
  document.getElementById("avatarPreview").textContent = data.avatar;
  document.getElementById("nameInput").value = data.name;

  if (data.adoptedPet) {
    document.getElementById("petDisplay").textContent =
      data.petEmoji + " Your companion: " + data.adoptedPet;
  }

  renderTasks();
  renderAchievements();
  renderAwards();
  updateDashboard();
}

restoreSavedContent();
