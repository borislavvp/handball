# Feature: Goalkeeper Stop – No Recovery Tracking

## Overview

Extend the goalkeeper stop event flow to track whether the defending team successfully recovered possession after a goalkeeper save.

This feature will allow coaches to distinguish between:
- Goalkeeper saves that resulted in possession recovery.
- Goalkeeper saves where the attacking team retained possession.

The information should be available both at player level and match level and included in reports.

---

## Motivation

Currently, a goalkeeper stop only records that a save occurred.

However, from an analytical perspective, not all saves have the same value:
- A save followed by possession recovery immediately ends the attack.
- A save without recovery allows the attacking team to continue possession and potentially create another scoring opportunity.

Tracking these situations provides a more accurate evaluation of defensive effectiveness and goalkeeper impact.

---

## UI Changes

### Goalkeeper Stop Dialog

When recording a goalkeeper stop, add a new checkbox option:

Label: NO RCV

Meaning:
- Checked → the ball was not recovered by the defending team after the save.
- Unchecked → possession was recovered after the save (current default behavior).

The checkbox should be displayed similarly to existing options such as:
- 1-1 Lost
- Fastbreak

---

## Player Selection Behavior

When NO RCV is checked:

### Highlighting

Player selection boxes should become active/highlighted using the same interaction pattern currently used for the 1-1 Lost workflow.

### Optional Player Assignment

Selecting a player is optional.

Two valid scenarios:

#### Scenario A – Player Selected

1. User checks NO RCV.
2. User selects a player.
3. User confirms the stop.

Result:
- Goalkeeper stop is recorded.
- Selected player receives a No Rebound statistic.

#### Scenario B – No Player Selected

1. User checks NO RCV.
2. User does not select a player.
3. User confirms the stop.

Result:
- Goalkeeper stop is recorded.
- Match-level no-recovery information is stored.
- No player receives a No Rebound statistic.

The Stop button must remain enabled and functional regardless of player selection.

---

## Player Statistics Changes

### New/Existing Statistic

Continue using:

No Rebound

Meaning:
- Player failed to secure possession after a goalkeeper save.

### Assignment Rule

Only assign the statistic when:
- NO RCV is checked.
- A player is explicitly selected.

### Remove Manual Stat Entry

The standalone No Rebound statistic option should be removed from the Player Statistics component.

Reason:
- This statistic should only be generated through the goalkeeper stop workflow.
- Prevents manual inconsistencies.

---

## Match-Level Statistics

Track an additional goalkeeper metric:

### Goalkeeper Stops Without Recovery

Definition:

Number of goalkeeper saves where:
- Save occurred.
- NO RCV was checked.

This metric is independent of whether a player was selected.

Example:

| Event | NO RCV | Player Selected | Counted |
|---------|---------|---------|---------|
| Save | No | N/A | Not counted |
| Save | Yes | Yes | Counted |
| Save | Yes | No | Counted |

---

## Match Page Display

Add a new goalkeeper statistic to the match statistics component.

Suggested label:

Stops Without Recovery

or

No Recovery Stops

Display alongside existing goalkeeper statistics.

Example:

- Saves: 12
- Save %: 34%
- Stops Without Recovery: 5

---

## PDF Report Changes

Add the new goalkeeper metric to the goalkeeper section of the match PDF report.

Suggested display:

### Goalkeeper Statistics

- Saves: 12
- Save %: 34%
- Goals Against: 23
- Stops Without Recovery: 5

This value should represent the total number of saves where possession was not recovered by the defending team.

---

## Data Model Requirements

### Goalkeeper Stop Event

Add a new boolean field:

ts noRecovery?: boolean 

Meaning:

- true → save occurred, possession not recovered.
- false or undefined → possession recovered.

### Player Statistic

Existing:

ts noRebound: number 

Increment only when:

ts goalkeeperStop.noRecovery === true && selectedPlayerId != null 

### Match Aggregate

Add aggregate counter:

ts goalkeeperStopsWithoutRecovery: number 

Increment whenever:

ts goalkeeperStop.noRecovery === true 

regardless of player selection.

---

## Acceptance Criteria

- NO RCV checkbox is available when recording goalkeeper stops.
- Checking NO RCV activates player selection highlighting.
- Player selection remains optional.
- Stop can be confirmed without selecting a player.
- Selected player receives a No Rebound statistic.
- Standalone No Rebound stat option is removed from the player stats component.
- Match aggregates track goalkeeper stops without recovery.
- Match page displays the new goalkeeper metric.
- PDF report displays the new goalkeeper metric.
- Existing goalkeeper stop functionality remains unchanged when NO RCV is not selected.