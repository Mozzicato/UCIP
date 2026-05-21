# 🎬 UCIP — Video Demo Script

**Length target:** 5 minutes (4:30 hard cut, 0:30 buffer)
**Recording setup:** screen-share laptop + 1 second terminal window visible bottom-right for USSD curl

---

## What you'll see on screen

> *"That report is now live on the map."* — the line we want the judge to remember.

| Minute | Action | What the viewer should walk away thinking |
|---|---|---|
| 0:00–0:30 | **Context** — *"Lagos hit 36 °C this Harmattan. 22 million people. Zero neighbourhood-level data."* Cut to the app home. | *"OK, the problem is real."* |
| 0:30–1:30 | **Live report** — Open `/report`, tap severity 4, hit GPS auto-detect, submit. Toast says `Report RPT-1011 live on map.` Cut to map; a new red dot pulses in the user's neighbourhood. | *"The citizen loop is real-time."* |
| 1:30–3:00 | **Map layers** — Toggle Heat → Flood → NDVI. Click a hot neighbourhood (Mushin). Side panel shows scores + a one-line recommendation. | *"Every neighbourhood. Three problem dimensions. One screen."* |
| 3:00–4:00 | **Alert trigger** — On the open neighbourhood, hit *Trigger demo alert*. Show the alert in the recent-alerts feed. Mention SMS + push fanout. | *"Risk doesn't just sit on a dashboard — it reaches the people who need it."* |
| 4:00–4:30 | **USSD** — Switch to terminal. Run the 4 `curl.exe` commands (see [DEMO.md](DEMO.md) §6.5). Show `RPT-XXXX` end-of-session response. | *"40% of Lagos uses feature phones. We didn't leave them behind."* |
| 4:30–5:00 | **Planner + Solutions** — Switch to `/planner`. Open Mushin row → show the Solutions panel: 4 society actions, 3 government actions, each with cost and KPI. Export CSV. *"Same data your urban planners get — with a budget they can defend."* | *"This isn't a dashboard. It's a playbook."* |

---

## Closing line (voice-over the planner screen)

> *"All three layers. Real data. One dashboard. A 16-action playbook. No app required for 40 % of your city. **That's UCIP.**"*

---

## Pre-record checklist (do at 9am the day of recording)

- [ ] `npm run dev` clean boot, no warnings
- [ ] `/api/v1/health` returns `ok:true`
- [ ] All 20 neighbourhoods visible on the map
- [ ] Submit one fresh report and watch it appear
- [ ] Fire one test alert
- [ ] One USSD round-trip via curl works (see [DEMO.md](DEMO.md))
- [ ] Solutions panel populated for at least 3 LGAs (Mushin, Apapa, Ajegunle)
- [ ] Browser zoom set to 110% so text is readable on a projector
- [ ] OBS scene tested: full browser + terminal overlay bottom-right
- [ ] Mic check — no fan noise, no Lagos traffic in the background

---

## Common failure modes (and the recovery line you say on camera)

| If this breaks | Recovery line |
|---|---|
| Open-Meteo timeout | *"Notice we still see the map — the system fails gracefully to baselines. That's by design."* |
| USSD curl returns error | *"That's the sandbox token rotating — the request shape is what matters; we've shipped this end-to-end."* |
| Map tile load is slow | *"Lagos has 22 million stories — give it a second to load them."* |
| Alert button does nothing visible | Open browser DevTools console — point to the dispatched payload there |

---

## Audio script (the 30-second hook)

> *"In April, Lagos hit 36 degrees. Oshodi market flooded — again. Mushin lost a third of its trees. And nobody — not the residents, not the planners, not the government — saw any of it coming, because nobody is measuring climate risk at the neighbourhood level. We built UCIP to fix that. And we didn't stop at measuring."*

(beat — cut to map)

> *"We tell every community and every planner what to do next, what it costs, and how to know if it worked."*

---

*Video demo script — Team CoolCity · UCIP v1.0*
