# Keyboard Shortcuts — Manual Smoke Test Plan

This document is the manual verification matrix for the keyboard-shortcut feature in
`pages/matches/active.vue`. Run through it once on a real device (or with a Bluetooth
keyboard attached to the tablet) before shipping.

## Setup

- App running locally (`pnpm dev`).
- At least 7 field players + 1 GK in the active team (for `Shift+1..0` coverage).
- Active match started (timer can be paused).
- Open the browser devtools console — failed shortcuts log `[keymap] action for X threw`.

## Discoverability

| # | Action | Expected |
|---|---|---|
| D-1 | Hold `Shift` | Every player tile shows `⇧1`..`⇧0`; the provoke/extra-defense/main-grid buttons all show their chips. |
| D-2 | Release `Shift` | All chips disappear. |
| D-3 | Hold `Ctrl` | Goal SVG shows `⌃0..9` over the 12 cells; shooting area zones show `⌃L/W/B/C/R/T`; shooting card (if open) shows `⌃F/I/O/G/M/H/A`. |
| D-4 | Release `Ctrl` | All Ctrl chips disappear. |
| D-5 | Type into the Defense `<select>` (focus it first) | No shortcut fires while focused. |
| D-6 | Type into a player edit field on the home screen | No shortcut fires (focus guard). |

## L1 — Always-on

| # | Combo | Action | Verify |
|---|---|---|---|
| L1-1 | `Space` | Play/pause match timer | Header play/pause icon flips; `match.playing` toggles; `playing` event POSTs. |
| L1-2 | `Space` again | Pauses back to play state. | Same checks in reverse. |
| L1-3 | `Esc` while provoke sub-menu is open | Sub-menu closes; player stays selected. | `provokesOpenned === false`. |
| L1-4 | `Esc` while a goal target is picked but no area | Target clears; area clears; `selection.clearSelection()` fires. | `shootingTarget === null`, `shootingArea === null`. |
| L1-5 | `Esc` with a player selected but no shot in progress | Player deselected. | `selection.player === null`. |
| L1-6 | `Esc` with no selection | No-op (idempotent). | Nothing changes. |

## L2 — `Shift+key` (player pick + non-shot stats)

### Player selection

| # | Combo | Verify |
|---|---|---|
| L2-1 | `Shift+1` | First player (roster order, GK-first) is selected. Their tile gets the emerald-900 selected style. |
| L2-2 | `Shift+0` | Tenth player (or last) is selected. |
| L2-3 | `Shift+1` again on the same player | No crash. Player stays selected. (Press `Esc` to deselect.) |
| L2-4 | `Shift+1` on a slot with no player | Silent no-op. |
| L2-5 | Reorder two players via drag, then `Shift+1` | New first player is selected (chip order matches visual order). |

### Non-shot stats (select a player first)

| # | Combo | Action | Verify |
|---|---|---|---|
| L2-6 | `Shift+D` | Defense | `defense` stat increments; tile flash positive-emerald; `/api/stats` POST/PUT. |
| L2-7 | `Shift+E` | Extra defense | `defensex2` increments; flash. |
| L2-8 | `Shift+S` | Steal | `steal` increments; flash. |
| L2-9 | `Shift+B` | Block (also adds opponent 2-min) | `block` increments; opponent's `twoMinutesAway` gets a slot. |
| L2-10 | `Shift+L` | Lost ball | `lostball` increments; flash. |
| L2-11 | `Shift+K` | Penalty made | `penaltymade` increments. |
| L2-12 | `Shift+N` | No rebound | `norebound` increments. |
| L2-13 | `Shift+2` (no provoke open) | 2 minutes | `twominutes` increments; `twoMinutesHome` gets player id; 2-min countdown chip appears. |
| L2-14 | `Shift+Y` | Yellow card | `yellowcard` increments; yellow card chip appears. |
| L2-15 | `Shift+R` | Red card | `redcard` increments. |
| L2-16 | `Shift+U` | Blue card | `bluecard` increments. |
| L2-17 | Each of L2-6..L2-16 with **no** player selected | Toast: "Please select a player first". |

### Provoke sub-menu

| # | Combo | Action | Verify |
|---|---|---|---|
| L2-18 | `Shift+P` (no player selected) | Sub-menu opens; toast prompts to select player. |
| L2-19 | `Shift+P` with a player selected, no shot in progress | Sub-menu opens, sub-menu chips `⇧Y/R/U/2/7` appear on the 5 inner buttons. |
| L2-20 | `Shift+P` with a shot target already picked | Shot clears first; then sub-menu opens. |
| L2-21 | `Shift+P` again | Sub-menu closes. |
| L2-22 | `Shift+P` → `Shift+Y` (player selected) | `provokeCard` increments; sub-menu auto-closes; no opponent 2-min. |
| L2-23 | `Shift+P` → `Shift+R` | `provokeCard` increments; sub-menu auto-closes; opponent 2-min added. |
| L2-24 | `Shift+P` → `Shift+U` | `provokeCard` increments; sub-menu auto-closes; opponent 2-min added. |
| L2-25 | `Shift+P` → `Shift+2` | `provokeTwoMin` increments; sub-menu auto-closes; opponent 2-min added. |
| L2-26 | `Shift+P` → `Shift+7` | `provokePenalty` increments; sub-menu auto-closes. |
| L2-27 | `Shift+P` → `Esc` | Sub-menu closes; no stat increments. |
| L2-28 | Inside sub-menu, `Shift+D` (not a sub-menu key) | Defense fires; sub-menu auto-closes (since the action is run). |

## L3 — `Ctrl+key` (shot flow)

### Target selection (3x3 grid + 3 out zones)

| # | Combo | Verify |
|---|---|---|
| L3-1 | Select a field player, then `Ctrl+1` | Top-left cell highlighted green; shooting card appears. |
| L3-2 | `Ctrl+5` | Middle cell (the standard 6m CB9 target). |
| L3-3 | `Ctrl+9` | Bottom-right cell. |
| L3-4 | `Ctrl+0` | Out-top cell (above crossbar). |
| L3-5 | `Ctrl+-` | Out-left cell. |
| L3-6 | `Ctrl+=` | Out-right cell. |
| L3-7 | `Ctrl+1` with no player selected | Toast: "Please select a player first". |
| L3-8 | Re-pick a target while one is already selected | New target replaces old. |

### Shooting area

| # | Combo | Verify |
|---|---|---|
| L3-9 | `Ctrl+L` | LW zone selected (green). |
| L3-10 | `Ctrl+W` | RW zone selected. |
| L3-11 | `Ctrl+B` (first press) | LB9 zone selected. |
| L3-12 | `Ctrl+B` (second press) | LB6 zone selected (toggled). |
| L3-13 | `Ctrl+B` (third press) | Back to LB9. |
| L3-14 | `Ctrl+C` | CB9 / CB6 toggling. |
| L3-15 | `Ctrl+R` | RB9 / RB6 toggling. |
| L3-16 | `Ctrl+T` | 7M zone selected (rectangle pill). |

### Shot toggles + confirm

| # | Combo | Verify |
|---|---|---|
| L3-17 | With target+area picked (field player), `Ctrl+I` | 1-1 WON toggle flips on; chip stays lit. |
| L3-18 | `Ctrl+F` | FASTBREAK toggle flips. |
| L3-19 | `Ctrl+G` (with player, target, area, 1-1 WON on) | Goal recorded; `match.score++`; `1on1win` increments; assist credits still apply; shooting card clears. |
| L3-20 | `Ctrl+M` (with player, target, area) | Miss recorded; shot row created; no score change. |
| L3-21 | `Ctrl+G` with no player | Toast: "Please select a player first". |
| L3-22 | `Ctrl+G` with no area | Toast: "Pick shooting area and target". |
| L3-23 | GK selected, target+area picked, `Ctrl+O` | 1-1 LOST toggle flips; user must click a field player to assign as mistake player before `Ctrl+A` confirms. |
| L3-24 | GK selected, `Ctrl+H` | Save recorded; `gksave` increments; tile pulse animation. |
| L3-25 | GK selected, `Ctrl+A` | Goal-against recorded; `gkmiss` increments; `opponentScore++`. |
| L3-26 | Field player selected, `Ctrl+H` | No-op (chip not on the STOP button). |
| L3-27 | Field player selected, `Ctrl+O` | No-op. |
| L3-28 | Hold key (auto-repeat) | Action fires once — no spam of `defense` 30 times. |

## End-to-end shot (one-key muscle-memory flow)

| # | Flow | Expected result |
|---|---|---|
| E2E-1 | `Shift+3` (pick slot 3) → `Ctrl+5` (center) → `Ctrl+C` (CB9) → `Ctrl+I` (1-1 won) → `Ctrl+G` | Goal recorded, score++, 1on1win++, shot row saved, selection clears, next player is preselectable. |
| E2E-2 | `Shift+7` → `Ctrl+2` (top-middle) → `Ctrl+B` (LB9) → `Ctrl+F` (fastbreak) → `Ctrl+G` | Goal recorded with fastbreak flag; downstream assist+1on1win still works. |
| E2E-3 | GK tile click → `Ctrl+1` → `Ctrl+C` → `Ctrl+H` | Save recorded. |
| E2E-4 | `Shift+P` → `Shift+R` (during a possession) | Provoke red card; opponent 2-min added. |

## Edge cases

| # | Scenario | Expected |
|---|---|---|
| EC-1 | Refresh the page mid-match | Player order, reorder, and all stat state restore from localStorage. Keymap still works. |
| EC-2 | Open the Defense `<select>` dropdown with `Enter`, then press `Shift+D` | Defense select handles focus; Shift+D does not fire (focus guard). |
| EC-3 | Browser zoom via `Ctrl+0`/`Ctrl+-`/`Ctrl+=` outside the match view | Default browser behavior preserved (we only override our registered combos). |
| EC-4 | Press `Shift+P` then `Esc` quickly | Sub-menu closes; no stat. |
| EC-5 | Tab to a `<button>` (defense system) and press `Space` | Browser-default button activation happens (focus guard returns the event to default behavior, our handler short-circuits because the focused element is not an editable target — but `Space` activates the focused button). |
| EC-6 | Hold modifier, press a non-registered key (e.g. `Shift+Q`) | Nothing happens (silent no-op). |
| EC-7 | Open post-match editor (`TimedEventEditor.vue`) and press shortcuts | Shortcuts are not registered in that view (out of scope for v1). No interference. |

## Pass criteria

- All rows above pass.
- No `[keymap] action for X threw` errors in console.
- No Vue warnings about `v-if` or undefined refs in dev tools.
- After a 5-minute continuous test session, the keymap registry has only the combos the page registered (no leak between page mounts).
