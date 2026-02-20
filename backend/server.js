const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8080;

const cors = require('cors');
app.use(cors());
app.use(express.json());

const moods = [
  {
    key: 'overworked',
    label: 'Overworked',
    weight: 20,
    actions: [
      'Take a 15-minute reset walk',
      'Close all tabs except the most important task',
      'Do 10 deep breaths before the next task'
    ]
  },
  {
    key: 'sleepy',
    label: 'Sleepy',
    weight: 16,
    actions: [
      'Drink a glass of water and stretch for 2 minutes',
      'Get coffee and a quick sunlight break',
      'Do one tiny task to rebuild momentum'
    ]
  },
  {
    key: 'stressed',
    label: 'Stressed',
    weight: 18,
    actions: [
      'Write down the top 3 worries and one action each',
      'Switch to focus mode for 25 minutes',
      'Play calm music and silence notifications'
    ]
  },
  {
    key: 'social',
    label: 'Needs Human Energy',
    weight: 12,
    actions: [
      'Send a kind message to a friend',
      'Hug Martin',
      'Plan a mini social break for later today'
    ]
  },
  {
    key: 'restless',
    label: 'Restless',
    weight: 15,
    actions: [
      'Do 20 squats and reset posture',
      'Go for a short walk without your phone',
      'Put on one high-energy song and move'
    ]
  },
  {
    key: 'dreamy',
    label: 'Dreamy',
    weight: 9,
    actions: [
      'Plan vacation ideas for 5 minutes',
      'Write one fun thing to do this weekend',
      'Watch a movie trailer and pick one for tonight'
    ]
  },
  {
    key: 'balanced',
    label: 'Balanced',
    weight: 10,
    actions: [
      'Keep momentum: finish one meaningful task',
      'Celebrate with your favorite snack',
      'Capture what is working in a quick note'
    ]
  }
];

const weatherBoost = {
  sunny: 6,
  cloudy: 2,
  rainy: -3,
  stormy: -7
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedMoodPick() {
  const totalWeight = moods.reduce((sum, mood) => sum + mood.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const mood of moods) {
    roll -= mood.weight;
    if (roll <= 0) return mood;
  }
  return moods[moods.length - 1];
}

function buildFixPlan(intensity, weather = 'cloudy') {
  const mood = weightedMoodPick();
  const clampedIntensity = Math.max(1, Math.min(10, Number(intensity) || 5));
  const weatherDelta = weatherBoost[weather] ?? 0;
  const baseConfidence = randomBetween(62, 88);
  const confidence = Math.max(40, Math.min(99, baseConfidence + weatherDelta - clampedIntensity));

  const actionCount = clampedIntensity >= 8 ? 3 : clampedIntensity >= 4 ? 2 : 1;
  const shuffled = [...mood.actions].sort(() => Math.random() - 0.5);
  const selectedActions = shuffled.slice(0, actionCount);

  const etaMinutes = randomBetween(8, 30) + clampedIntensity * 2;
  const energyGain = randomBetween(5, 18) + Math.floor((confidence - 50) / 4);

  return {
    id: `fix-${Date.now()}-${randomBetween(100, 999)}`,
    mood: mood.label,
    confidence,
    intensity: clampedIntensity,
    weather,
    etaMinutes,
    energyGain,
    actions: selectedActions,
    summary: `Katinka is ${mood.label.toLowerCase()} today. Estimated recovery in ${etaMinutes} minutes.`
  };
}

function buildForecast(days = 7) {
  const entries = [];
  let baseEnergy = randomBetween(42, 68);

  for (let index = 0; index < days; index += 1) {
    const dayShift = randomBetween(-8, 11);
    baseEnergy = Math.max(25, Math.min(100, baseEnergy + dayShift));
    entries.push({
      day: index + 1,
      energy: baseEnergy,
      confidence: Math.max(35, Math.min(98, randomBetween(48, 92) + Math.floor((baseEnergy - 50) / 3)))
    });
  }

  const averageEnergy = Math.round(
    entries.reduce((sum, point) => sum + point.energy, 0) / entries.length
  );

  return {
    days,
    averageEnergy,
    trend: entries,
    recommendation:
      averageEnergy >= 65
        ? 'Momentum is strong. Maintain daily fix sessions and short recovery breaks.'
        : 'Recovery is inconsistent. Prioritize low-intensity consistency over heroic bursts.'
  };
}

function buildInsight() {
  const impactByWeather = {
    sunny: randomBetween(6, 14),
    cloudy: randomBetween(1, 8),
    rainy: randomBetween(-7, 3),
    stormy: randomBetween(-12, 0)
  };

  const strongestWeather = Object.keys(impactByWeather).sort(
    (left, right) => impactByWeather[right] - impactByWeather[left]
  )[0];

  const weakestWeather = Object.keys(impactByWeather).sort(
    (left, right) => impactByWeather[left] - impactByWeather[right]
  )[0];

  return {
    intensitySweetSpot: randomBetween(4, 7),
    weatherImpact: impactByWeather,
    bestWindow: `${randomBetween(8, 11)}:00-${randomBetween(14, 18)}:00`,
    strongestWeather,
    weakestWeather,
    coachingTip:
      strongestWeather === 'sunny'
        ? 'On sunny days, schedule your hardest task right after your fix plan.'
        : 'When weather is rough, lower intensity and stack easier wins early.'
  };
}

app.get('/fix', (req, res) => {
  const { intensity = 5, weather = 'cloudy' } = req.query;
  const plan = buildFixPlan(intensity, String(weather).toLowerCase());
  res.json(plan);
});

app.get('/challenge', (req, res) => {
  const challengeList = [
    'Complete two focus sessions of 25 minutes',
    'Take a no-phone walk and log your mood',
    'Drink water 4 times before dinner',
    'Replace 30 minutes of doomscrolling with reading',
    'Plan a mini reward for the evening'
  ];

  const challenge = challengeList[randomBetween(0, challengeList.length - 1)];
  const reward = randomBetween(10, 35);

  res.json({
    challenge,
    reward,
    deadlineHours: randomBetween(3, 10)
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/insight', (req, res) => {
  res.json(buildInsight());
});

app.get('/forecast', (req, res) => {
  const days = Math.max(3, Math.min(14, Number(req.query.days) || 7));
  res.json(buildForecast(days));
});

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      app: 'Fix Katinka Engine',
      version: '2.0.0',
      endpoints: ['/fix', '/challenge', '/insight', '/forecast', '/health']
    });
  });
}

app.listen(port, () => { 
  console.log(`Backend server listening at http://localhost:${port}`);
});

