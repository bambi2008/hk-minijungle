# AquaClick 2.0 Mobile Pod Platform Concept

## Core Leap

AquaClick 1.0 is a washable food-path feeder.

AquaClick 2.0 can become a platform:

> A mobile smart pod that docks with passive washable stations only when feeding, while the food-contact path remains circuit-free and fully washable.

This preserves the central AquaClick rule:

> Food touches no electronics. Electronics touch no food.

## Product Definition

The system has two product bodies:

### 1. Passive Food Station

The station stores and dispenses dry food but contains no electronics in the dirty food path.

Food-contact parts:
- Hopper
- Portioning rotor or wheel
- Outlet chute
- Bowl tray / bowl-contact frame
- Passive driven interface

Allowed in the food station:
- Passive mechanical rotor
- Bearings or bushings suitable for washing
- Detachable coupler insert
- Mechanical anti-jam geometry
- Mechanical latch and gasket features

Not allowed in the washable path:
- PCB
- Motor
- Battery
- Camera
- Sensor board
- Wire
- Electrical contact
- Charging contact
- Speaker / microphone
- Display / LED

### 2. Mobile Smart Pod

The pod carries intelligence and power.

Pod functions:
- Camera and cat observation
- Local compute / wireless communication
- Battery
- Drive motor
- Docking detection
- Optional speaker / microphone
- Optional interaction behaviors outside feeding

The pod is normally separate from the food station. It returns to dock only when feeding or inspecting the station.

## Why This Is Interesting

If reliable, this changes AquaClick from a single feeder into a modular household system.

One smart pod could theoretically serve:
- One food station
- Multiple food stations
- A water station
- A toy station
- A health observation point
- A litter-area observation point

The expensive electronics become mobile and reusable. The dirty stations stay cheap, passive, washable, and replaceable.

## The Main Engineering Problem

The decisive problem is not navigation in general.

The decisive problem is:

> Can the mobile pod dock with enough repeatability to transfer controlled mechanical energy into the passive food station?

This should not be solved by demanding high precision from the pod. It should be solved by designing the station to tolerate poor approach accuracy.

## Docking Principle

Do not design it like precision aerospace docking.

Design it like a forgiving mechanical capture system:

```text
coarse arrival
  -> mechanical funnel capture
    -> self-centering alignment
      -> soft lock
        -> floating drive engagement
          -> torque-limited dispensing
            -> disengage and back out
```

## Recommended Docking Architecture

### Stage 1: Coarse Arrival

The pod only needs to find the station entrance.

Acceptable approach error target:
- Lateral: +/- 30-50 mm
- Angle: +/- 15-25 degrees

Possible guidance aids:
- Camera recognition of a high-contrast docking mark
- IR beacon on the station entrance
- Magnetic field cue
- AprilTag / ArUco style marker
- Physical wall-following into the dock

For early prototypes, use the simplest reliable option: printed visual marker plus physical guide rails.

### Stage 2: Mechanical Capture

The food station should have a garage-like receiving mouth.

Features:
- Wide V-shaped side funnels
- Sloped floor ramp
- Rounded entrance lips
- Low-friction guide surfaces
- Hard stops at final position
- Elastomer bumpers
- Magnetic final pull-in only for the last few millimeters

The goal is that a mediocre pod approach still becomes a good mechanical pose.

### Stage 3: Pose Confirmation

Before dispensing, the pod must know it is seated.

Confirmation options:
- Pod-side microswitch
- Hall sensor with magnet in station dry-side dock area
- Motor current signature during gentle seating push
- Camera check of dock marker at final distance

For first proof, use at least two confirmations:
- Physical seated switch
- Hall/magnet or optical marker confirmation

### Stage 4: Floating Drive Coupling

Avoid rigid shaft-to-shaft insertion.

Use a forgiving coupling:
- Tapered entry socket
- Floating hex or D-drive head
- Spring-loaded axial travel
- Oldham-style lateral compliance
- Torque limiter / slip clutch

Initial tolerance target:
- Lateral misalignment after capture: +/- 2-3 mm
- Angular misalignment: +/- 3-5 degrees
- Axial insertion variance: +/- 2 mm

The pod should push in gently, confirm seating, then rotate slowly until the coupling finds engagement.

### Stage 5: Safe Dispensing

The pod drives the passive food mechanism only after dock lock.

Rules:
- Low-speed engagement first
- Current limit active
- Jam detection by motor current
- Reverse pulse if jam detected
- Max retry count
- Stop if coupling slips repeatedly
- No feeding if seated state is ambiguous

## Alternative Drive: Push Lever / Ratchet

If rotary coupling is still too fragile, use a larger-tolerance drive method:

> The pod pushes a mechanical lever or ratchet on the station, and the station converts repeated strokes into measured food portions.

Advantages:
- Much larger docking tolerance
- Easier visible safety
- Less precise shaft alignment
- Food station remains passive

Tradeoffs:
- Slower feeding
- More noise
- Harder dose accuracy
- More wear on pawl/ratchet parts
- Less elegant product story

This should be kept as Plan B, not the first hero mechanism.

## Product Modes

### Normal Idle

Pod is away from station or parked in a charging area.

Food station remains passive and closed.

### Cat Observation

Pod can patrol or reposition to observe the cat, but this is optional and should not be required for feeding reliability.

### Feeding

1. Schedule triggers locally.
2. Pod navigates to food station.
3. Pod enters docking funnel.
4. Station mechanically captures and centers pod.
5. Pod confirms seated state.
6. Floating drive engages.
7. Pod rotates passive dispenser.
8. Pod verifies output by camera and/or motor signature.
9. Pod disengages.
10. Pod exits or remains docked.

### Failure

If pod cannot dock:
- Retry with slow approach.
- Notify user.
- Do not attempt blind dispensing.

If food jams:
- Reverse pulse.
- Retry.
- Stop after limit.
- Notify user.

## MVP Prototype Path

Do not build full autonomy first.

Build the risk down in this order:

### Prototype A: Manual Dock + Motorized Pod

Goal:
- Validate coupling, capture geometry, torque transfer, jam behavior.

Setup:
- Human places pod near dock.
- Pod drives itself slowly into V-guide.
- Floating coupler engages passive rotor.
- Food dispenses.

Pass line:
- 100 docking attempts from varied starting offsets.
- 95 successful mechanical captures.
- 90 successful drive engagements.
- No unsafe half-engaged feeding.

### Prototype B: Short-Range Self Dock

Goal:
- Validate visual/IR guidance plus mechanical funnel.

Setup:
- Pod starts within 0.5-1.0 m.
- It finds the station, enters the funnel, docks, feeds.

Pass line:
- 50 runs across lighting and floor conditions.
- >= 90% successful dock/feed cycle.
- Failures are recoverable without user rescue.

### Prototype C: Full Feeding Cycle

Goal:
- Validate schedule-to-feed reliability.

Setup:
- Pod starts from its usual idle/charging position.
- It performs the full scheduled feeding cycle.

Pass line:
- 7-day test.
- 2-4 feed cycles per day.
- No missed feeding caused by dock ambiguity.
- All failures notify user and leave station safe.

## Key Product Risks

| Risk | Why It Matters | First Control |
|---|---|---|
| Docking misalignment | Product fails at its central promise | V-funnel + floating coupler |
| Cat interference | Cat may block or attack pod during docking | Slow speed, bump sensing, retry logic |
| Feeding delay | Cat expects food on time | Keep fallback manual feed path |
| Battery depletion | Pod may not return for feeding | Local battery reserve threshold |
| Dirty station creep | Food residue may enter dock interface | Raised dry-side coupler and labyrinth geometry |
| User trust | Moving pod may feel unreliable | Clear status, visible docking behavior, fail-safe feeding rules |
| Cost | Mobility can overwhelm value | Validate dock first before full navigation stack |

## Relationship To AquaClick 1.0

This should not replace 1.0 immediately.

Recommended portfolio:
- 1.0: fixed dry-base feeder with removable washable cassette.
- 2.0 concept: mobile smart pod + passive washable stations.

The 2.0 concept can borrow from 1.0:
- Same washable food cassette geometry
- Same passive rotor principles
- Same no-electronics dirty path rule
- Same cleaning promise

The difference is where the motor and intelligence live:
- 1.0: motor stays in fixed dry base.
- 2.0: motor moves into mobile smart pod and docks only when needed.

## Design Direction

The visual should communicate:
- The pod is smart, mobile, dry, and reusable.
- The station is passive, clean, washable, and calm.
- Docking is guided by a generous garage, not fragile precision.
- The food cassette can still be removed without touching electronics.

Avoid:
- Looking like a robot vacuum plus a normal feeder pasted together.
- Making the pod look required for cleaning.
- Making the food station look electronic.
- Hiding the docking mouth so much that users cannot understand reliability.

## Next Decision

The next concrete decision is the drive interface:

1. Floating rotary coupling: better story, better dosing potential, higher alignment risk.
2. Push lever / ratchet: more tolerant, less elegant, lower dosing precision.
3. Hybrid: rotary coupling as hero, lever fallback for early prototypes.

Current recommendation:

> Start with floating rotary coupling, but prototype the push-ratchet fallback in parallel with low fidelity parts.
