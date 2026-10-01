# Dive Lab — Interactive Scuba Diving Simulator

> This simulator uses simplified dive physics for education and experimentation.
> It must not be used as a replacement for certified dive training, a dive computer, or real dive planning.

## What is Dive Lab

Dive Lab is a browser-based **scuba diving training simulator**. It is not a game about exploring
reefs. It is a moving physics lab where you _feel_ how a dive works:

- Take a deep breath and, a few seconds later, you start to rise.
- Keep rising and the air in your BCD expands, so you rise faster and have to vent.
- As the tank empties it gets lighter, and you become more and more buoyant.
- Go deeper and the gas gauge falls faster.

You never set the depth directly. It comes only from buoyancy, drag and your inputs.

A complete dive follows the real-world flow:

```text
Dive Planner → Pre-Dive Check → Dive Simulator → Safety Stop / Ascent → Dive Log
```

Everything runs locally in the browser. There is no backend, account or database.

## Features

**Dive Planner** (`/planner`)

- Three dive sites: Racha Yai (30 m, salt), Racha Noi (40 m, salt), Training Pool (5 m, fresh).
- Max depth, bottom time, starting and reserve pressure, and SAC/RMV.
- Cylinders (AL80, Steel 12L, Steel 15L), exposure suits (none / 3 / 5 / 7 mm) and a weight slider (0–12 kg).
- A live plan summary: available gas, consumption at depth, gas-limited bottom time, predicted
  surfacing pressure and a gas budget bar.
- A weight check that recommends lead for your site, suit and cylinder.
- A BWRAF pre-dive check before you descend.

**Dive Simulator** (`/dive`)

- A dive computer HUD: depth, dive time, tank pressure, remaining gas, ascent rate with a bar
  graph, ambient pressure and status (Normal, Surface, Safety Stop, Low Gas, Turn, Reserve Gas,
  Fast Ascent, Dangerous Ascent, Out of Gas).
- A water column with depth and ATA rulers, the planned-depth line, the safety-stop band, and a
  diver whose BCD wing visibly inflates. Exhaled bubbles rise, dumped air streams out and the fins
  kick.
- Hold-to-act controls for BCD inflate/deflate, breathing (inhale/exhale) and finning, each with a
  keyboard shortcut.
- A live buoyancy breakdown (body, lungs, BCD, wetsuit, tank, tank gas, weights), net buoyancy and
  its trend.
- Alerts: ascent too fast (> 9 m/min), dangerous ascent (> 12 m/min), low gas (100 bar), turn
  (70 bar), reserve (your setting), out of gas, deeper than plan, planned time reached, on the
  bottom, and BCD venting. When nothing is wrong, a coaching hint shows the next step instead.
- A safety stop: when the dive went to 10 m or deeper, a 3:00 countdown runs only while you are
  within 4.5–5.5 m and pauses outside it.
- Two charts: depth over time and tank pressure over time.
- Pause (`P`), 1× / 2× / 4× speed and abort. The dive pauses automatically if you leave the page.

**Dive Log** (`/log`)

- Site, max depth, dive time, start and end pressure, gas used (including gas sent into the BCD),
  average depth, average SAC, max ascent rate and the safety stop result.
- Three simple ratings, each **Good / Needs Improvement / Unsafe** with the reasons: Buoyancy
  Control, Ascent Control and Gas Management.
- Dive profile and tank pressure charts.
- A logbook of your last 20 dives, kept in `localStorage`.

**Physics Lab** (`/physics`)

- **Pressure**: depth vs ambient pressure.
- **Gas Consumption**: surface vs actual consumption for any SAC and depth.
- **Buoyancy**: lungs, BCD, weight and depth sliders with a live breakdown and the air needed for
  neutral buoyancy.
- **BCD Expansion**: start at 30 m with 2 L, ascend to 0 m and watch Boyle's law (with the
  over-pressure valve at 12 L).
- **Tank Weight**: gas mass at 200 / 150 / 100 / 50 bar.

### Keyboard controls (Dive Simulator)

| Key       | Action             |
| --------- | ------------------ |
| `W`       | Inhale (hold)      |
| `S`       | Exhale (hold)      |
| `Space`   | Inflate BCD (hold) |
| `Shift`   | Deflate BCD (hold) |
| `↑` / `↓` | Fin up / down      |
| `P`       | Pause / resume     |

Every action also has an on-screen button (mouse, touch, or `Enter` on a focused button).

## Tech Stack

- **Node.js** (≥ 22.12) and **npm**
- **React 19** + **TypeScript** (strict) + **Vite 8**
- **Tailwind CSS v4** + **shadcn/ui** (Radix) + **lucide-react**
- **Zustand** (state, with `persist` for the plan and logbook)
- **React Router** (data router with lazily loaded pages)
- **Recharts** (via the shadcn chart wrapper)
- **Vitest** (unit tests), **ESLint** + **Prettier**

## How to Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm test           # run the unit tests once (Vitest)
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
npm run lint       # ESLint
npm run format     # Prettier
```

## Architecture

```text
src/
├── app/router.tsx            # routes; every page except Home is lazy-loaded
├── pages/                    # HomePage, PlannerPage, DivePage, PhysicsPage, DiveLogPage
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── common/               # SliderField, StatTile, BuoyancyBars, NetBuoyancyReadout, …
│   ├── layout/               # AppLayout, TopNav, ActiveDiveIndicator
│   ├── home/  planner/  dive/  log/  physics/
├── hooks/                    # use-simulation-loop, use-dive-keyboard, use-pause-dive-offscreen
├── lib/
│   ├── physics/              # pure physics engine (see below)
│   ├── dive-plan.ts          # defaults, limits, gas plan, weight check, pre-dive checklist
│   ├── dive-status.ts        # alerts, dive computer status, coaching hints
│   ├── dive-log.ts           # dive log + skill assessments
│   └── format.ts             # number / time formatting
├── store/dive-store.ts       # Zustand store (useDiveStore)
├── types/dive.ts             # domain types
└── data/                     # dive sites, cylinders, exposure suits, labels
```

### Data flow

```text
Planner ──updatePlan()──▶ useDiveStore.plan (persisted)
Begin Dive ──startDive()──▶ resolveDiveSetup(plan) → createInitialSimulation(setup)
requestAnimationFrame ──tick(dt)──▶ stepSimulation(state, controls, setup, dt × speed)   ← pure
React components ◀── select slices of the store and render
End Dive ──endDive()──▶ createDiveLog(state, setup) → logs (persisted)                   ← pure
```

- **All physics lives in `src/lib/physics/` as pure functions.** `stepSimulation` takes a state
  and returns a new one, so the whole engine is unit-testable without a browser.
- The loop uses `requestAnimationFrame` but all physics uses the real frame delta. Each frame is
  split into fixed 50 ms sub-steps, so results do not depend on the frame rate.
- The setup (site, cylinder, suit, plan) is frozen when the dive starts. Editing the plan never
  changes a dive in progress.
- Charts subscribe only to the sample array, which grows every 2 s of dive time. They re-render
  rarely while the HUD updates every frame.
- Constants (rates, thresholds, drag coefficients) are named in `lib/physics/constants.ts`.

## Physics Model

All formulas are deliberately simple. The goal is believable trends, not scientific accuracy.

| Quantity          | Model                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Ambient pressure  | `P = depth / 10 + 1` ATA (salt and fresh water alike)                                 |
| Gas consumption   | `SAC × P × workload` L/min — workload ×1.5 while finning                              |
| Tank gas          | `liters = cylinder volume × bar`; `bar = liters / volume`, never below 0              |
| Tank gas mass     | `liters × 0.001225 kg/L` — an AL80 at 200 bar holds 2.7 kg of air                     |
| Tank buoyancy     | `empty-cylinder buoyancy − gas mass` (AL80 empty +2.0 kg, steel tanks negative)       |
| BCD (Boyle's law) | `V₂ = V₁ · P₁ / P₂` every sub-step; capped at 12 L by the over-pressure valve         |
| BCD inflation     | +1 L/s at depth, drawing `1 L × P` surface liters from the tank; deflate −1.5 L/s     |
| Wetsuit           | `surface buoyancy / P^0.35` (3 mm +2 kg, 5 mm +3.5 kg, 7 mm +5 kg at the surface)     |
| Lungs             | `(volume − 3.5 L)` kg; 2.5–5.5 L; drifts back to normal at 0.25 L/s when released     |
| Breathing cycle   | ±0.25 L every 5 s on top of the lung volume (bubbles on each exhale)                  |
| Body              | `80 L × water density − 81.5 kg` → +0.5 kg in salt water, −1.5 kg in fresh water      |
| Net buoyancy      | `body + lungs + BCD + wetsuit + cylinder + gas − weights` (1 L displaced ≈ 1 kg)      |
| Vertical motion   | `a = 0.06·F − 0.25·v − 0.8·v·\|v\|`, semi-implicit Euler, stops at surface and seabed |

With this drag, a steady +1 kg settles at about 9.5 m/min, +2 kg at about 16 m/min and +3 kg at
about 21 m/min. It takes a few seconds to build up, so one breath never launches the diver.

Neutral buoyancy is **unstable**, as in real diving. Rise a little and the BCD and suit expand,
so you rise faster. Sink a little and they compress. Gas use slowly lightens the tank, so a
diver who does nothing drifts upward. Controlled ascents, venting and hovering have to be learned.

**Planning helpers**

- **Gas plan:** a square profile at max depth, plus a 9 m/min ascent and a 3 min stop at 5 m when
  the plan goes to 10 m or deeper.
- **Weight check:** neutral at 5 m with only the reserve left in the tank, an empty BCD and normal
  breathing.

**Dive log ratings**

| Skill            | Unsafe                                           | Needs Improvement                                           |
| ---------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| Buoyancy Control | > 3 m below plan, or a runaway ascent ≥ 18 m/min | > 1 m below plan, ≥ 3 yo-yo reversals (> 3 m), seabed touch |
| Ascent Control   | ≥ 3 s faster than 12 m/min                       | ≥ 5 s faster than 9 m/min, or the safety stop was skipped   |
| Gas Management   | ran out of gas                                   | surfaced below the reserve pressure                         |

The average SAC counts only breathing gas, not gas sent into the BCD.

## Testing

`npm test` runs 97 unit tests (Vitest, Node environment) covering:

- pressure (0/10/20/30/40 m = 1–5 ATA), gas consumption (SAC 16 @ 20 m ≈ 48 L/min), tank
  pressure and gas mass, wetsuit compression, Boyle's law, BCD controls and venting, lungs, and
  the buoyancy components
- motion: damping, terminal velocity, and the surface and seabed limits
- ascent-rate classes, gas levels, and the safety stop timer (runs only in the band, pauses
  outside it)
- the five acceptance scenarios at simulation level: gas at 20 m, runaway ascent, ASCENT TOO
  FAST, the safety stop, and a lighter tank making the diver more buoyant
- frame-rate independence
- the gas plan, weight check and plan issues; dive log assessments; and the store's dive
  lifecycle

## Known Limitations

- **No decompression model.** No NDL, tissue loading, deco stops, narcosis or oxygen toxicity.
- Pressure uses 10 m per ATA in both salt and fresh water. BCD and lung lift use 1 L ≈ 1 kg
  regardless of water density.
- The wetsuit compresses along an empirical curve, with no lasting (time-dependent) compression.
- The diver's body is generic: there is no mass or size input, no trim, and no horizontal
  movement. Site current is shown but not simulated.
- Breath-holding is not modelled as dangerous (no lung over-expansion injury), and there is no
  weight ditching.
- 2× and 4× speed also speed up the response to BCD and breathing inputs, which makes control
  harder.
- The logbook lives only in this browser's `localStorage`.
- Desktop first (≥ 1280 px). 768 px is supported, but phones are not optimised.

## Roadmap

- Decompression: NDL display and a Bühlmann ZHL-16C model with deco stops
- Nitrox (EANx) with MOD and ppO₂ warnings
- A diver profile (body mass and volume) and trim
- Currents and horizontal navigation
- Weight ditching and out-of-gas drills (buddy breathing, CESA)
- Audio: breathing, bubbles and computer alarms
- Exporting logs (JSON/CSV) and repeat dives with surface intervals
- Guided training scenarios
- Richer visuals (a later phase could add Three.js)
- A touch-first mobile layout

## Disclaimer

Dive Lab is an educational toy built on simplified physics. Always dive within your training and
certification, with a buddy, a real dive computer and a proper dive plan.
