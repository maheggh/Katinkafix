import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";
import k from "./assets/k.jpg";
import "./App.css";

const VICTORY_LINES = {
  fix: [
    "Katinka just fixed reality itself.",
    "Emergency solved. Confidence now illegal.",
    "Another fix landed. Deadlines are trembling.",
    "Katinka pressed fix so hard the bugs apologized."
  ],
  challenge: [
    "Challenge accepted. Universe notified.",
    "That challenge never stood a chance.",
    "Bragging rights unlocked and fully deserved.",
    "Challenge crushed with style and suspicious ease."
  ],
  focus: [
    "Focus session complete. Brain gains acquired.",
    "Deep work mode successful. Distractions defeated.",
    "Pomodoro finished. Productivity just did a backflip.",
    "Focus victory: chaos reduced, power increased."
  ],
  achievement: [
    "Achievement unlocked. Crowd goes absolutely wild.",
    "New badge earned. Respect levels rising.",
    "Milestone reached. Confetti legally required.",
    "Legend status updated in real time."
  ]
};

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");
  const DEFAULT_ENERGY = 10;
  const COMBO_WINDOW_MS = 90000;
  const GODMODE_STREAK = 5;
  const [intensity, setIntensity] = useState(5);
  const [weather, setWeather] = useState("cloudy");
  const [loadingFix, setLoadingFix] = useState(false);
  const [applyingFix, setApplyingFix] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [fixPlan, setFixPlan] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [energy, setEnergy] = useState(DEFAULT_ENERGY);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastFixDate, setLastFixDate] = useState("");
  const [lastFixAt, setLastFixAt] = useState(null);
  const [history, setHistory] = useState([]);
  const [fixesCount, setFixesCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboChain, setComboChain] = useState(0);
  const [insight, setInsight] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(15);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(15 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusCompleted, setFocusCompleted] = useState(0);
  const [error, setError] = useState("");
  const [victoryModal, setVictoryModal] = useState(null);
  const [confettiOn, setConfettiOn] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState(420);
  const [lastVictoryLine, setLastVictoryLine] = useState("No wins yet. Katinka is plotting.");
  const [arcadeBurst, setArcadeBurst] = useState(null);
  const [screenShake, setScreenShake] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [comboClock, setComboClock] = useState(Date.now());
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720
  });

  const timeoutRefs = useRef([]);
  const unlockedIdsRef = useRef([]);
  const audioContextRef = useRef(null);

  const queueTimeout = useCallback((callback, ms) => {
    const id = setTimeout(callback, ms);
    timeoutRefs.current.push(id);
  }, []);

  const clearQueuedTimeouts = useCallback(() => {
    timeoutRefs.current.forEach((id) => clearTimeout(id));
    timeoutRefs.current = [];
  }, []);

  const pickVictoryLine = useCallback((category) => {
    const lines = VICTORY_LINES[category] ?? VICTORY_LINES.fix;
    return lines[Math.floor(Math.random() * lines.length)];
  }, []);

  const playArcadeSound = useCallback(
    (category = "fix") => {
      if (!soundEnabled || typeof window === "undefined") return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const tones = {
        fix: [220, 329.63, 440],
        challenge: [261.63, 329.63, 523.25],
        focus: [174.61, 220, 293.66],
        achievement: [392, 523.25, 783.99]
      };

      const sequence = tones[category] ?? tones.fix;
      const now = ctx.currentTime;

      sequence.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = category === "achievement" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
        gain.gain.setValueAtTime(0.0001, now + index * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.16);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + index * 0.09);
        oscillator.stop(now + index * 0.09 + 0.18);
      });
    },
    [soundEnabled]
  );

  const triggerCelebration = useCallback(
    ({
      title,
      subtitle,
      category = "fix",
      line,
      burstText = "KATINKA POWER",
      burstTone = "power",
      pieces = 420,
      shake = false
    }) => {
      const nextLine = line ?? pickVictoryLine(category);
      setLastVictoryLine(nextLine);
      setVictoryModal({ title, subtitle, line: nextLine });
      setConfettiPieces(pieces);
      setConfettiOn(true);
      setArcadeBurst({ text: burstText, tone: burstTone });

      if (shake) {
        setScreenShake(true);
        queueTimeout(() => setScreenShake(false), 450);
      }

      playArcadeSound(category);

      queueTimeout(() => {
        setArcadeBurst(null);
      }, 1100);

      queueTimeout(() => {
        setConfettiOn(false);
      }, 4200);
    },
    [pickVictoryLine, playArcadeSound, queueTimeout]
  );

  const closeVictoryModal = useCallback(() => {
    setVictoryModal(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("katinka-lab-state");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setEnergy(parsed.energy ?? DEFAULT_ENERGY);
      setScore(parsed.score ?? 0);
      setStreak(parsed.streak ?? 0);
      setLastFixDate(parsed.lastFixDate ?? "");
      setLastFixAt(parsed.lastFixAt ?? null);
      setHistory(parsed.history ?? []);
      setFixesCount(parsed.fixesCount ?? 0);
      setComboMultiplier(parsed.comboMultiplier ?? 1);
      setComboChain(parsed.comboChain ?? 0);
      setFocusCompleted(parsed.focusCompleted ?? 0);
    } catch {
      setError("Could not restore previous progress.");
    }
  }, [DEFAULT_ENERGY]);

  useEffect(() => {
    localStorage.setItem(
      "katinka-lab-state",
      JSON.stringify({
        energy,
        score,
        streak,
        lastFixDate,
        lastFixAt,
        history,
        fixesCount,
        comboMultiplier,
        comboChain,
        focusCompleted
      })
    );
  }, [
    energy,
    score,
    streak,
    lastFixDate,
    lastFixAt,
    history,
    fixesCount,
    comboMultiplier,
    comboChain,
    focusCompleted
  ]);

  useEffect(() => {
    const onResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => clearQueuedTimeouts, [clearQueuedTimeouts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setComboClock(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastFixAt || comboChain <= 1) return;
    const elapsed = comboClock - lastFixAt;
    if (elapsed < COMBO_WINDOW_MS) return;

    setComboChain(0);
    setComboMultiplier(1);
    setLastFixAt(null);
    triggerCelebration({
      title: "Combo Dropped",
      subtitle: "Window missed — multiplier reset to x1.0",
      category: "challenge",
      burstText: "CHAIN BREAK",
      burstTone: "challenge",
      pieces: 220
    });
  }, [comboClock, lastFixAt, comboChain, triggerCelebration]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    setFocusSecondsLeft(focusMinutes * 60);
  }, [focusMinutes]);

  useEffect(() => {
    if (!focusRunning) return undefined;
    const timer = setInterval(() => {
      setFocusSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);

  useEffect(() => {
    if (focusSecondsLeft !== 0 || !focusRunning) return;
    setFocusRunning(false);
    setFocusCompleted((prev) => prev + 1);
    setScore((prev) => prev + 30);
    setEnergy((prev) => Math.min(100, prev + 8));
    triggerCelebration({
      title: "Focus Mission Complete",
      subtitle: "+30 score • +8 energy",
      category: "focus",
      burstText: "FOCUS KO",
      burstTone: "focus",
      pieces: 360
    });
  }, [focusRunning, focusSecondsLeft, triggerCelebration]);

  const fetchIntel = useCallback(async () => {
    setLoadingIntel(true);
    setError("");
    try {
      const [insightResponse, forecastResponse] = await Promise.all([
        fetch(`${API_BASE}/insight`),
        fetch(`${API_BASE}/forecast?days=7`)
      ]);
      if (!insightResponse.ok || !forecastResponse.ok) {
        throw new Error("Intel endpoints unavailable");
      }
      const insightData = await insightResponse.json();
      const forecastData = await forecastResponse.json();
      setInsight(insightData);
      setForecast(forecastData);
    } catch {
      setError("Could not fetch intelligence feed.");
    } finally {
      setLoadingIntel(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchIntel();
  }, [fetchIntel]);

  const energyStatus = useMemo(() => {
    if (energy >= 80) return "Legendary";
    if (energy >= 60) return "Stable";
    if (energy >= 40) return "Recovering";
    return "Critical";
  }, [energy]);

  const badge = useMemo(() => {
    if (score >= 400) return "Quantum Fixmaster";
    if (score >= 250) return "Katinka Whisperer";
    if (score >= 140) return "Fix Architect";
    if (score >= 60) return "Momentum Builder";
    return "Apprentice";
  }, [score]);

  const achievements = useMemo(() => {
    return [
      {
        id: "first-fix",
        title: "First Contact",
        unlocked: fixesCount >= 1
      },
      {
        id: "streak-3",
        title: "3-Day Momentum",
        unlocked: streak >= 3
      },
      {
        id: "score-200",
        title: "Score Hunter",
        unlocked: score >= 200
      },
      {
        id: "combo-3",
        title: "Combo Crafter",
        unlocked: comboMultiplier >= 3
      },
      {
        id: "focus-2",
        title: "Deep Work Pilot",
        unlocked: focusCompleted >= 2
      }
    ];
  }, [fixesCount, streak, score, comboMultiplier, focusCompleted]);

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const unlockedIds = useMemo(
    () => achievements.filter((item) => item.unlocked).map((item) => item.id),
    [achievements]
  );

  useEffect(() => {
    if (unlockedIdsRef.current.length === 0) {
      unlockedIdsRef.current = unlockedIds;
      return;
    }

    const newUnlocks = unlockedIds.filter((id) => !unlockedIdsRef.current.includes(id));
    if (newUnlocks.length > 0) {
      const unlockedAchievement = achievements.find((item) => item.id === newUnlocks[0]);
      triggerCelebration({
        title: "Achievement Unlocked",
        subtitle: unlockedAchievement ? unlockedAchievement.title : "New achievement",
        category: "achievement",
        burstText: "NEW BADGE",
        burstTone: "legend",
        pieces: 620,
        shake: true
      });
    }

    unlockedIdsRef.current = unlockedIds;
  }, [achievements, unlockedIds, triggerCelebration]);

  const forecastBars = useMemo(() => {
    if (!forecast?.trend) return [];
    return forecast.trend.map((point) => ({
      ...point,
      height: `${Math.max(12, point.energy)}%`
    }));
  }, [forecast]);

  const focusTime = useMemo(() => {
    const minutes = Math.floor(focusSecondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (focusSecondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [focusSecondsLeft]);

  const katinkaMoodLine = useMemo(() => {
    if (energy >= 85) return "Katinka is operating at superhero settings. Physics is nervous.";
    if (energy >= 65) return "Katinka is strong. Productivity tools are asking for mercy.";
    if (energy >= 45) return "Katinka is warming up. Stand back and secure loose objects.";
    return "Katinka is low energy, but still stronger than most deadlines.";
  }, [energy]);

  const comboTimeLeftMs = useMemo(() => {
    if (!lastFixAt || comboChain <= 0) return COMBO_WINDOW_MS;
    const remaining = COMBO_WINDOW_MS - (comboClock - lastFixAt);
    return Math.max(0, remaining);
  }, [comboClock, lastFixAt, comboChain]);

  const comboSecondsLeft = Math.ceil(comboTimeLeftMs / 1000);
  const comboHot = comboChain >= 3;

  async function runFixEngine() {
    setLoadingFix(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/fix?intensity=${intensity}&weather=${weather}`
      );
      if (!response.ok) throw new Error("Fix engine unavailable");
      const data = await response.json();
      setFixPlan(data);
      setLastVictoryLine("Fix plan ready. Run the steps, then confirm completion.");

      triggerCelebration({
        title: "Fix Plan Generated",
        subtitle: "Katinka is not fixed yet — complete the plan to apply rewards.",
        category: "focus",
        burstText: "PLAN READY",
        burstTone: "focus",
        pieces: 260
      });
    } catch {
      setError("Could not connect to backend. Is server running on :8080?");
    } finally {
      setLoadingFix(false);
    }
  }

  function completeFixPlan() {
    if (!fixPlan || applyingFix) return;
    setApplyingFix(true);

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isSameDay = lastFixDate === today;
    const continuedStreak = lastFixDate === yesterday;

    let nextStreak = streak;
    if (!isSameDay) {
      nextStreak = continuedStreak ? streak + 1 : 1;
      setStreak(nextStreak);
      setLastFixDate(today);
    }

    const gainedEnergy = Math.min(100, energy + fixPlan.energyGain);
    const now = Date.now();
    const inComboWindow = Boolean(lastFixAt) && now - lastFixAt <= COMBO_WINDOW_MS;
    const nextComboChain = inComboWindow ? comboChain + 1 : 1;
    const nextMultiplier = Math.min(5, Number((1 + (nextComboChain - 1) * 0.4).toFixed(1)));

    const scoreGain = Math.floor(
      (fixPlan.confidence + fixPlan.energyGain + nextStreak * 3) * nextMultiplier
    );

    setEnergy(gainedEnergy);
    setScore((prev) => prev + scoreGain);
    setFixesCount((prev) => prev + 1);
    setComboChain(nextComboChain);
    setComboMultiplier(nextMultiplier);
    setLastFixAt(now);

    setHistory((prev) => {
      const next = [
        {
          id: fixPlan.id,
          mood: fixPlan.mood,
          confidence: fixPlan.confidence,
          energyGain: fixPlan.energyGain,
          at: new Date().toLocaleTimeString()
        },
        ...prev
      ];
      return next.slice(0, 10);
    });

    triggerCelebration({
      title: scoreGain > 160 ? "ULTRA FIX SUCCESS" : "Katinka Fixed",
      subtitle: `+${scoreGain} score • +${fixPlan.energyGain} energy`,
      category: "fix",
      burstText: scoreGain > 160 ? "ULTRA FIX" : "POWER UP",
      burstTone: scoreGain > 160 ? "legend" : "power",
      pieces: scoreGain > 160 ? 760 : 460,
      shake: scoreGain > 160
    });

    if (nextComboChain >= GODMODE_STREAK) {
      const godmodeBonus = 120;
      setScore((prev) => prev + godmodeBonus);
      triggerCelebration({
        title: "GODMODE ACTIVATED",
        subtitle: `Perfect ${nextComboChain}x chain • +${godmodeBonus} bonus score`,
        category: "achievement",
        burstText: "GODMODE",
        burstTone: "legend",
        pieces: 900,
        shake: true
      });
    }

    setFixPlan(null);
    setApplyingFix(false);
  }

  async function getChallenge() {
    setLoadingChallenge(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/challenge`);
      if (!response.ok) throw new Error("Challenge service unavailable");
      const data = await response.json();
      setChallenge(data);
      setChallengeAccepted(false);
    } catch {
      setError("Could not load a challenge right now.");
    } finally {
      setLoadingChallenge(false);
    }
  }

  function acceptChallenge() {
    if (!challenge) return;
    setChallengeAccepted(true);
    setScore((prev) => prev + Math.floor(challenge.reward * comboMultiplier));
    setEnergy((prev) => Math.min(100, prev + Math.floor(challenge.reward / 4)));
    triggerCelebration({
      title: "Challenge Accepted",
      subtitle: `+${Math.floor(challenge.reward * comboMultiplier)} score boost`,
      category: "challenge",
      burstText: "CHALLENGE SMASHED",
      burstTone: "challenge",
      pieces: 520
    });
  }

  function startFocusSession() {
    if (focusSecondsLeft === 0) {
      setFocusSecondsLeft(focusMinutes * 60);
    }
    setFocusRunning(true);
  }

  function pauseFocusSession() {
    setFocusRunning(false);
  }

  function resetFocusSession() {
    setFocusRunning(false);
    setFocusSecondsLeft(focusMinutes * 60);
  }

  function randomizeMode() {
    const randomIntensity = Math.floor(Math.random() * 10) + 1;
    const weatherModes = ["sunny", "cloudy", "rainy", "stormy"];
    const randomWeather = weatherModes[Math.floor(Math.random() * weatherModes.length)];
    setIntensity(randomIntensity);
    setWeather(randomWeather);
    setComboMultiplier((prev) => Math.min(5, Number((prev + 0.3).toFixed(1))));
  }

  function resetProgress() {
    setFixPlan(null);
    setApplyingFix(false);
    setChallenge(null);
    setChallengeAccepted(false);
    setEnergy(DEFAULT_ENERGY);
    setScore(0);
    setStreak(0);
    setLastFixDate("");
    setLastFixAt(null);
    setHistory([]);
    setError("");
    setFixesCount(0);
    setComboMultiplier(1);
    setComboChain(0);
    setInsight(null);
    setForecast(null);
    setFocusMinutes(15);
    setFocusSecondsLeft(15 * 60);
    setFocusRunning(false);
    setFocusCompleted(0);
    setArcadeBurst(null);
    setScreenShake(false);
    setLastVictoryLine("No wins yet. Katinka is plotting.");
    clearQueuedTimeouts();
    localStorage.removeItem("katinka-lab-state");
  }

  return (
    <div className={`app-shell min-h-screen w-full bg-slate-900 text-slate-100 px-2 py-2 ${screenShake ? "screen-shake" : ""}`}>
      {confettiOn && (
        <Confetti
          width={viewportSize.width}
          height={viewportSize.height}
          numberOfPieces={confettiPieces}
          recycle={false}
          gravity={0.18}
        />
      )}

      {arcadeBurst && (
        <div className="arcade-burst-wrap" aria-hidden="true">
          <div className={`arcade-burst ${arcadeBurst.tone}`}>{arcadeBurst.text}</div>
        </div>
      )}

      {victoryModal && (
        <div className="victory-overlay">
          <div className="victory-modal">
            <div className="victory-badge">🏆 VICTORY</div>
            <h3 className="victory-title">{victoryModal.title}</h3>
            <p className="victory-line">{victoryModal.line}</p>
            <p className="victory-subtitle">{victoryModal.subtitle}</p>
            <button className="action-btn primary mt-2" onClick={closeVictoryModal}>
              Continue Dominating
            </button>
          </div>
        </div>
      )}

      <div className="arcade-cabinet mx-auto max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Katinka Repair Lab: Chaos Edition ⚡
        </h1>
        <div className="arcade-marquee mt-2">ARCADE MODE: BANANAS • COMBO BONUSES • CONFETTI CHAOS • SOUND ON</div>
        <p className="mt-1 text-slate-300 text-sm">
          Science, vibes, and questionable decisions — all in service of a legendary Katinka comeback.
        </p>

        <div className="hero-zone mt-4">
          <div className="hero-photo-shell">
            <img src={k} alt="Katinka" className="katinka-photo hero-photo" />
          </div>
          <p className="hero-caption">Main character energy detected. Side characters, remain calm.</p>
          <p className="victory-ticker">✨ {lastVictoryLine}</p>
          <button
            className="action-btn mt-1"
            onClick={() => setSoundEnabled((prev) => !prev)}
          >
            {soundEnabled ? "🔊 Arcade Sound On" : "🔇 Arcade Sound Off"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <div className="glass-card">
            <div className="label">Energy</div>
            <div className="value">{energy}%</div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${energy}%` }} />
            </div>
            <div className="sub">{energyStatus}</div>
          </div>

          <div className="glass-card">
            <div className="label">Score</div>
            <div className="value">{score}</div>
            <div className="sub">Badge: {badge}</div>
          </div>

          <div className="glass-card">
            <div className="label">Streak</div>
            <div className="value">{streak} day{streak === 1 ? "" : "s"}</div>
            <div className="sub">Keep fixing daily</div>
          </div>

          <div className="glass-card">
            <div className="label">Combo</div>
            <div className="value">x{comboMultiplier.toFixed(1)}</div>
            <div className="sub">Chain: {comboChain} • {comboSecondsLeft}s left</div>
            <div className={`combo-meter ${comboHot ? "hot" : ""}`}>
              <div
                className="combo-meter-fill"
                style={{ width: `${Math.max(6, (comboTimeLeftMs / COMBO_WINDOW_MS) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="panel md:col-span-2">
            <h2 className="text-xl font-bold">Repair Engine</h2>
            <p className="text-slate-300 text-sm mt-1">{katinkaMoodLine}</p>

            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <label className="field">
                <span>Intensity: {intensity}/10</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(event) => setIntensity(Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>Weather modifier</span>
                <select
                  value={weather}
                  onChange={(event) => setWeather(event.target.value)}
                >
                  <option value="sunny">Sunny</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rainy">Rainy</option>
                  <option value="stormy">Stormy</option>
                </select>
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              <button
                className="action-btn primary mega-fix-btn"
                onClick={runFixEngine}
                disabled={loadingFix || Boolean(fixPlan)}
              >
                {loadingFix ? "UNLEASHING POWER..." : fixPlan ? "PLAN READY ✓" : "💪 FIX KATINKA NOW 💪"}
              </button>
              <button className="action-btn" onClick={getChallenge} disabled={loadingChallenge}>
                {loadingChallenge ? "Loading..." : "Get Daily Challenge"}
              </button>
              <button className="action-btn" onClick={randomizeMode}>
                Chaos Mode (Do Not Press, Obviously)
              </button>
              <button className="action-btn danger" onClick={resetProgress}>
                Reset Lab
              </button>
            </div>

            {error && <div className="mt-3 error">{error}</div>}

            {fixPlan && (
              <div className="result-box mt-2">
                <div className="font-semibold text-lg">{fixPlan.summary}</div>
                <div className="text-xs text-slate-300 mt-1">
                  Katinka is <strong>not fixed yet</strong>. Complete the steps below, then confirm.
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                  <span>Confidence: {fixPlan.confidence}%</span>
                  <span>Mood: {fixPlan.mood}</span>
                  <span>ETA: {fixPlan.etaMinutes} min</span>
                  <span>Boost: +{fixPlan.energyGain} energy</span>
                </div>
                <ul className="mt-3 list-disc list-inside text-slate-200">
                  {fixPlan.actions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <button
                  className="action-btn primary mt-2"
                  onClick={completeFixPlan}
                  disabled={applyingFix}
                >
                  {applyingFix ? "Applying..." : "✅ Mark Fix Completed"}
                </button>
              </div>
            )}
          </div>

          <div className="panel">
            <h2 className="text-xl font-bold">Challenge</h2>
            {!challenge && <p className="text-slate-300 mt-2">No active challenge.</p>}
            {challenge && (
              <div className="mt-3">
                <p className="font-medium">{challenge.challenge}</p>
                <p className="text-sm text-slate-300 mt-2">
                  Reward: +{challenge.reward} score • Deadline: {challenge.deadlineHours}h • Bragging rights: priceless
                </p>
                <button
                  className="action-btn primary mt-3"
                  onClick={acceptChallenge}
                  disabled={challengeAccepted}
                >
                  {challengeAccepted ? "Accepted ✅" : "Accept Challenge"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="panel mt-4">
          <h2 className="text-xl font-bold">Focus Mission</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-3 items-end">
            <label className="field">
              <span>Session Length: {focusMinutes} min</span>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={focusMinutes}
                onChange={(event) => setFocusMinutes(Number(event.target.value))}
                disabled={focusRunning}
              />
            </label>
            <div className="timer-display">{focusTime}</div>
            <div className="flex gap-2 flex-wrap">
              <button className="action-btn primary" onClick={startFocusSession}>
                Start
              </button>
              <button className="action-btn" onClick={pauseFocusSession}>
                Pause
              </button>
              <button className="action-btn" onClick={resetFocusSession}>
                Reset
              </button>
            </div>
          </div>
          <p className="text-slate-300 mt-2 text-sm">
            Completed sessions: {focusCompleted} • Each completion grants +30 score, +8 energy, and dramatic personal growth.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="panel md:col-span-2">
            <h2 className="text-xl font-bold">Intelligence Feed</h2>
            {loadingIntel && <p className="text-sky-300 mt-2 text-sm">Refreshing intelligence...</p>}
            {!insight && <p className="text-slate-300 mt-2">No insight loaded yet.</p>}
            {insight && (
              <div className="mt-3 text-sm text-slate-200 space-y-2">
                <p>Sweet spot intensity: {insight.intensitySweetSpot}/10</p>
                <p>Best working window: {insight.bestWindow}</p>
                <p>
                  Best weather: {insight.strongestWeather} • Risk weather: {insight.weakestWeather}
                </p>
                <p className="text-sky-300">Tip: {insight.coachingTip}</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h2 className="text-xl font-bold">Achievements</h2>
            <p className="text-sm text-slate-300 mt-2">
              Unlocked {unlockedCount}/{achievements.length}
            </p>
            <div className="mt-3 space-y-2">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className={`achievement ${item.unlocked ? "unlocked" : "locked"}`}
                >
                  {item.unlocked ? "✅" : "🔒"} {item.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel mt-4">
          <h2 className="text-xl font-bold">7-Day Forecast</h2>
          {!forecast && <p className="text-slate-300 mt-2">No forecast loaded yet.</p>}
          {forecast && (
            <>
              <p className="text-slate-300 mt-2 text-sm">
                Avg energy: {forecast.averageEnergy}% • {forecast.recommendation} Also yes, Katinka still carries this whole app.
              </p>
              <div className="forecast-chart mt-4">
                {forecastBars.map((point) => (
                  <div key={`day-${point.day}`} className="forecast-col">
                    <div className="forecast-bar" style={{ height: point.height }} />
                    <div className="forecast-day">D{point.day}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="panel mt-4">
          <h2 className="text-xl font-bold">Recent Fixes</h2>
          {history.length === 0 && (
            <p className="text-slate-300 mt-2">No runs yet. Start the engine to populate history.</p>
          )}
          {history.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-300">
                  <tr>
                    <th className="py-2">Time</th>
                    <th className="py-2">Mood</th>
                    <th className="py-2">Confidence</th>
                    <th className="py-2">Energy Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="border-t border-white/10">
                      <td className="py-2">{entry.at}</td>
                      <td className="py-2">{entry.mood}</td>
                      <td className="py-2">{entry.confidence}%</td>
                      <td className="py-2">+{entry.energyGain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
