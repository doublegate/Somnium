/**
 * Space Station Thriller Test World: "Station Erebus"
 * A sci-fi thriller on a failing space station
 */

export function generateSpaceStationWorld() {
  return {
    metadata: {
      title: 'Station Erebus',
      author: 'Somnium Test Worlds',
      version: '1.0',
      description:
        'Something has gone terribly wrong aboard Station Erebus. Life support is failing, the crew is missing, and you have 24 hours to prevent total system failure.',
      theme: 'sci_fi_thriller',
      mockData: true,
    },

    settings: {
      startingRoom: 'docking_bay',
      maxScore: 600,
      timeLimit: 0,
    },

    rooms: [
      {
        id: 'docking_bay',
        name: 'Docking Bay Alpha',
        description:
          'Your shuttle sits in the magnetic clamps, its running lights the only illumination in the cavernous bay. The station is running on emergency power - red lights pulse slowly. The airlock to the main corridor is open, but the door beyond is sealed.',
        graphics: {
          backgroundColor: '#000000',
          primitives: [
            // Your shuttle
            { type: 'polygon', points: [[50, 140], [120, 120], [120, 160], [50, 180]], color: '#AAAAAA', filled: true },
            { type: 'circle', x: 65, y: 145, radius: 3, color: '#55FF55', filled: true }, // Running light
            { type: 'circle', x: 65, y: 165, radius: 3, color: '#FF5555', filled: true }, // Warning light
            // Docking clamps
            { type: 'rect', x: 45, y: 180, width: 10, height: 20, color: '#FFFF55', filled: true },
            { type: 'rect', x: 115, y: 180, width: 10, height: 20, color: '#FFFF55', filled: true },
            // Station walls
            { type: 'rect', x: 0, y: 0, width: 10, height: 200, color: '#555555', filled: true },
            { type: 'rect', x: 310, y: 0, width: 10, height: 200, color: '#555555', filled: true },
            { type: 'rect', x: 0, y: 0, width: 320, height: 10, color: '#555555', filled: true },
            { type: 'rect', x: 0, y: 190, width: 320, height: 10, color: '#555555', filled: true },
            // Airlock door
            { type: 'rect', x: 250, y: 80, width: 50, height: 80, color: '#00AAAA', filled: true },
            // Emergency lights
            { type: 'circle', x: 30, y: 20, radius: 5, color: '#FF5555', filled: true },
            { type: 'circle', x: 290, y: 20, radius: 5, color: '#FF5555', filled: true },
          ],
        },
        exits: {
          east: { room: 'main_corridor', blocked: false },
        },
        objects: ['shuttle', 'airlock', 'emergency_lights'],
        items: ['pressure_suit', 'emergency_beacon'],
        npcs: [],
      },

      {
        id: 'main_corridor',
        name: 'Main Corridor',
        description:
          'A long corridor with sealed doors on both sides. Condensation drips from the ceiling - temperature control is failing. Warning klaxons echo in the distance. Doors lead north to the bridge, south to engineering, and west to the crew quarters.',
        graphics: {
          backgroundColor: '#000000',
          primitives: [
            // Corridor perspective
            { type: 'polygon', points: [[80, 50], [240, 50], [280, 100], [40, 100]], color: '#555555', filled: true },
            { type: 'polygon', points: [[80, 150], [240, 150], [280, 100], [40, 100]], color: '#555555', filled: true },
            // Floor panels
            { type: 'rect', x: 60, y: 140, width: 40, height: 10, color: '#AAAAAA', filled: true },
            { type: 'rect', x: 110, y: 140, width: 40, height: 10, color: '#AAAAAA', filled: true },
            { type: 'rect', x: 160, y: 140, width: 40, height: 10, color: '#AAAAAA', filled: true },
            // Doors (north, south, west)
            { type: 'rect', x: 140, y: 60, width: 40, height: 30, color: '#00AAAA', filled: true }, // North
            { type: 'rect', x: 140, y: 160, width: 40, height: 30, color: '#AA0000', filled: true }, // South (red - danger)
            { type: 'rect', x: 20, y: 90, width: 30, height: 40, color: '#00AAAA', filled: true }, // West
            // Sparks/damage
            { type: 'line', x1: 200, y1: 60, x2: 205, y2: 55, color: '#FFFF55' },
            { type: 'line', x1: 202, y1: 58, x2: 208, y2: 60, color: '#FFFF55' },
            // Water drips
            { type: 'circle', x: 100, y: 55, radius: 2, color: '#55FFFF', filled: true },
            { type: 'circle', x: 180, y: 58, radius: 2, color: '#55FFFF', filled: true },
          ],
        },
        exits: {
          north: { room: 'bridge', blocked: false },
          south: { room: 'engineering', blocked: false },
          west: { room: 'crew_quarters', blocked: false },
          east: { room: 'medical_bay', blocked: false },
        },
        objects: ['damaged_panel', 'water_leak', 'warning_klaxon'],
        items: ['access_card'],
        npcs: [],
      },

      {
        id: 'bridge',
        name: 'Command Bridge',
        description:
          'The nerve center of Station Erebus. Most console screens are dark or showing error messages. The captains chair is empty, coffee cup still steaming. The main viewscreen shows Earth slowly rotating below - so close, yet impossibly far.',
        graphics: {
          backgroundColor: '#0000AA',
          primitives: [
            // Viewscreen showing Earth
            { type: 'rect', x: 60, y: 30, width: 200, height: 80, color: '#000000', filled: true },
            { type: 'circle', x: 160, y: 70, radius: 30, color: '#0000AA', filled: true }, // Earth
            { type: 'circle', x: 170, y: 65, radius: 8, color: '#55FF55', filled: true }, // Landmass
            { type: 'circle', x: 150, y: 75, radius: 12, color: '#55FF55', filled: true }, // Landmass
            // Captain's chair
            { type: 'rect', x: 140, y: 140, width: 40, height: 40, color: '#AA0000', filled: true },
            { type: 'rect', x: 135, y: 130, width: 50, height: 10, color: '#AA0000', filled: true },
            // Coffee cup
            { type: 'rect', x: 195, y: 155, width: 8, height: 10, color: '#AA5500', filled: true },
            // Consoles
            { type: 'rect', x: 20, y: 120, width: 80, height: 40, color: '#555555', filled: true },
            { type: 'rect', x: 220, y: 120, width: 80, height: 40, color: '#555555', filled: true },
            // Console screens (some red errors)
            { type: 'rect', x: 30, y: 125, width: 60, height: 25, color: '#FF5555', filled: true },
            { type: 'rect', x: 230, y: 125, width: 60, height: 25, color: '#FF5555', filled: true },
          ],
        },
        exits: {
          south: { room: 'main_corridor', blocked: false },
        },
        objects: ['viewscreen', 'captains_chair', 'navigation_console', 'communications_console'],
        items: ['captains_log', 'coffee_cup', 'command_override'],
        npcs: [],
      },

      {
        id: 'engineering',
        name: 'Engineering Bay',
        description:
          'The heart of the station is dying. The reactor core temperature is rising - currently at 87% of critical. Coolant pipes are ruptured. Tool kits lie scattered as if the engineers fled in panic. A countdown timer on the main console shows 24 hours until core breach.',
        graphics: {
          backgroundColor: '#AA0000',
          primitives: [
            // Reactor core (glowing hot)
            { type: 'circle', x: 160, y: 100, radius: 40, color: '#FF5555', filled: true },
            { type: 'circle', x: 160, y: 100, radius: 30, color: '#FFFF55', filled: true },
            { type: 'circle', x: 160, y: 100, radius: 20, color: '#FFFFFF', filled: true },
            // Warning bars around reactor
            { type: 'rect', x: 100, y: 85, width: 10, height: 30, color: '#FFFF55', filled: true },
            { type: 'rect', x: 210, y: 85, width: 10, height: 30, color: '#FFFF55', filled: true },
            { type: 'rect', x: 145, y: 60, width: 30, height: 10, color: '#FFFF55', filled: true },
            { type: 'rect', x: 145, y: 130, width: 30, height: 10, color: '#FFFF55', filled: true },
            // Ruptured coolant pipes
            { type: 'rect', x: 50, y: 50, width: 40, height: 5, color: '#00AAAA', filled: true },
            { type: 'polygon', points: [[90, 50], [95, 45], [95, 55]], color: '#00AAAA', filled: true }, // Break
            // Console with countdown
            { type: 'rect', x: 240, y: 140, width: 60, height: 40, color: '#555555', filled: true },
            { type: 'rect', x: 245, y: 145, width: 50, height: 25, color: '#FF5555', filled: true },
            // Scattered tools
            { type: 'polygon', points: [[20, 170], [35, 165], [30, 175]], color: '#AAAAAA', filled: true },
            { type: 'rect', x: 270, y: 180, width: 15, height: 5, color: '#AAAAAA', filled: true },
          ],
        },
        exits: {
          north: { room: 'main_corridor', blocked: false },
        },
        objects: ['reactor_core', 'coolant_pipes', 'countdown_timer', 'tools'],
        items: ['repair_kit', 'coolant_canister', 'radiation_badge'],
        npcs: [],
      },

      {
        id: 'crew_quarters',
        name: 'Crew Quarters',
        description:
          'Six bunks, all empty. Personal effects scattered everywhere as if the crew left in a hurry. One bunk has claw marks on the sheets. A tablet on the floor shows security footage - something moved through here, but the footage is corrupted.',
        graphics: {
          backgroundColor: '#555555',
          primitives: [
            // Bunks (3 visible)
            { type: 'rect', x: 20, y: 80, width: 60, height: 30, color: '#00AAAA', filled: true },
            { type: 'rect', x: 20, y: 120, width: 60, height: 30, color: '#00AAAA', filled: true },
            { type: 'rect', x: 240, y: 80, width: 60, height: 30, color: '#00AAAA', filled: true },
            { type: 'rect', x: 240, y: 120, width: 60, height: 30, color: '#00AAAA', filled: true },
            // Claw marks (dark lines on one bunk)
            { type: 'line', x1: 245, y1: 125, x2: 255, y2: 145, color: '#000000' },
            { type: 'line', x1: 250, y1: 125, x2: 260, y2: 145, color: '#000000' },
            { type: 'line', x1: 255, y1: 125, x2: 265, y2: 145, color: '#000000' },
            // Scattered items
            { type: 'rect', x: 100, y: 150, width: 15, height: 10, color: '#FFFFFF', filled: true }, // Tablet
            { type: 'circle', x: 180, y: 165, radius: 8, color: '#AA5500', filled: true }, // Boot
            // Lockers
            { type: 'rect', x: 140, y: 60, width: 40, height: 100, color: '#555555', filled: true },
          ],
        },
        exits: {
          east: { room: 'main_corridor', blocked: false },
        },
        objects: ['bunks', 'claw_marks', 'lockers'],
        items: ['crew_tablet', 'personal_photo', 'encrypted_datapad'],
        npcs: [],
      },

      {
        id: 'medical_bay',
        name: 'Medical Bay',
        description:
          'The medical bay is a disaster. Surgical tools are scattered across the floor. An operating table has restraints - one is broken. Blood spatters lead to the ventilation shaft. A medical scanner chirps - detecting multiple life signs, but they're not human.',
        graphics: {
          backgroundColor: '#FFFFFF',
          primitives: [
            // Operating table
            { type: 'rect', x: 120, y: 100, width: 80, height: 40, color: '#AAAAAA', filled: true },
            // Broken restraint
            { type: 'line', x1: 125, y1: 105, x2: 135, y2: 95, color: '#555555' },
            { type: 'line', x1: 135, y1: 105, x2: 145, y2: 95, color: '#555555' },
            // Blood trail
            { type: 'ellipse', x: 160, y: 145, radiusX: 5, radiusY: 3, color: '#AA0000', filled: true },
            { type: 'ellipse', x: 175, y: 150, radiusX: 4, radiusY: 3, color: '#AA0000', filled: true },
            { type: 'ellipse', x: 190, y: 155, radiusX: 3, radiusY: 2, color: '#AA0000', filled: true },
            // Ventilation shaft (open)
            { type: 'rect', x: 200, y: 30, width: 60, height: 40, color: '#000000', filled: true },
            { type: 'line', x1: 210, y1: 35, x2: 210, y2: 65, color: '#555555' },
            { type: 'line', x1: 220, y1: 35, x2: 220, y2: 65, color: '#555555' },
            { type: 'line', x1: 230, y1: 35, x2: 230, y2: 65, color: '#555555' },
            { type: 'line', x1: 240, y1: 35, x2: 240, y2: 65, color: '#555555' },
            { type: 'line', x1: 250, y1: 35, x2: 250, y2: 65, color: '#555555' },
            // Medical scanner
            { type: 'rect', x: 30, y: 80, width: 40, height: 60, color: '#00AAAA', filled: true },
            { type: 'rect', x: 35, y: 85, width: 30, height: 40, color: '#55FF55', filled: true },
            // Scattered surgical tools
            { type: 'line', x1: 90, y1: 160, x2: 100, y2: 165, color: '#AAAAAA' },
            { type: 'circle', x: 110, y: 170, radius: 3, color: '#AAAAAA', filled: true },
          ],
        },
        exits: {
          west: { room: 'main_corridor', blocked: false },
          north: { room: 'laboratory', blocked: true, requiresItem: 'access_card' },
        },
        objects: ['operating_table', 'ventilation_shaft', 'medical_scanner', 'blood_trail'],
        items: ['scalpel', 'medical_report', 'sedative'],
        npcs: [],
      },

      {
        id: 'laboratory',
        name: 'Research Laboratory',
        description:
          'This lab was studying something. Containment pods line the walls - all empty, glass shattered from the inside. Research notes describe "specimen retrieval" from an asteroid. The final log entry: "It got out. God help us all."',
        graphics: {
          backgroundColor: '#00AA00',
          primitives: [
            // Containment pods (broken)
            { type: 'rect', x: 30, y: 60, width: 40, height: 80, color: '#00AAAA', filled: true },
            { type: 'polygon', points: [[35, 90], [50, 75], [65, 90], [35, 90]], color: '#55FFFF', filled: true }, // Shattered glass
            { type: 'polygon', points: [[40, 100], [55, 110], [45, 115]], color: '#55FFFF', filled: true },

            { type: 'rect', x: 90, y: 60, width: 40, height: 80, color: '#00AAAA', filled: true },
            { type: 'polygon', points: [[95, 85], [110, 70], [125, 85]], color: '#55FFFF', filled: true },

            { type: 'rect', x: 190, y: 60, width: 40, height: 80, color: '#00AAAA', filled: true },
            { type: 'polygon', points: [[195, 95], [210, 80], [220, 100]], color: '#55FFFF', filled: true },

            { type: 'rect', x: 250, y: 60, width: 40, height: 80, color: '#00AAAA', filled: true },
            { type: 'polygon', points: [[255, 88], [270, 75], [280, 92]], color: '#55FFFF', filled: true },

            // Research terminal
            { type: 'rect', x: 130, y: 130, width: 60, height: 50, color: '#555555', filled: true },
            { type: 'rect', x: 135, y: 135, width: 50, height: 35, color: '#FF5555', filled: true },

            // Microscope
            { type: 'rect', x: 150, y: 100, width: 20, height: 25, color: '#AAAAAA', filled: true },
            { type: 'circle', x: 160, y: 95, radius: 5, color: '#55FFFF', filled: true },

            // Slime trail (creature evidence)
            { type: 'polygon', points: [[70, 140], [120, 155], [90, 165], [60, 150]], color: '#55FF55', filled: true },
          ],
        },
        exits: {
          south: { room: 'medical_bay', blocked: false },
        },
        objects: ['containment_pods', 'research_terminal', 'microscope', 'slime_trail'],
        items: ['research_notes', 'asteroid_sample', 'containment_key'],
        npcs: [],
      },

      {
        id: 'cargo_hold',
        name: 'Cargo Hold',
        description:
          'Massive cargo containers are stacked to the ceiling. Most are sealed, but one is open - it came from the asteroid mining operation. Inside is a nest of some kind, organic material mixed with station supplies. Something large made this its home.',
        graphics: {
          backgroundColor: '#555555',
          primitives: [
            // Cargo containers
            { type: 'rect', x: 20, y: 40, width: 60, height: 80, color: '#AA5500', filled: true },
            { type: 'rect', x: 90, y: 40, width: 60, height: 80, color: '#AA5500', filled: true },
            { type: 'rect', x: 160, y: 40, width: 60, height: 80, color: '#AA5500', filled: true },
            // Open container with nest
            { type: 'rect', x: 230, y: 40, width: 70, height: 100, color: '#AA5500', filled: true },
            { type: 'rect', x: 235, y: 45, width: 60, height: 90, color: '#000000', filled: true }, // Open interior
            // Nest materials (organic)
            { type: 'polygon', points: [[240, 120], [260, 100], [280, 115], [270, 130]], color: '#55FF55', filled: true },
            { type: 'polygon', points: [[245, 110], [255, 95], [265, 108]], color: '#00AA00', filled: true },
            // Scattered supplies
            { type: 'rect', x: 120, y: 140, width: 20, height: 15, color: '#AAAAAA', filled: true },
            { type: 'rect', x: 180, y: 155, width: 15, height: 20, color: '#AAAAAA', filled: true },
            // Claw marks on containers
            { type: 'line', x1: 25, y1: 50, x2: 35, y2: 70, color: '#000000' },
            { type: 'line', x1: 30, y1: 50, x2: 40, y2: 70, color: '#000000' },
            { type: 'line', x1: 35, y1: 50, x2: 45, y2: 70, color: '#000000' },
          ],
        },
        exits: {
          north: { room: 'main_corridor', blocked: true, requiresItem: 'cargo_keycard' },
        },
        objects: ['cargo_containers', 'alien_nest', 'claw_marks_cargo'],
        items: ['cargo_manifest', 'mining_equipment', 'emergency_flare'],
        npcs: ['alien_creature'],
      },
    ],

    objects: [
      {
        id: 'shuttle',
        name: 'escape shuttle',
        description: 'Your only way off this station. Fuel for one trip - either to Earth or deep space.',
        state: 'docked',
        canEnter: true,
        canExamine: true,
      },
      {
        id: 'reactor_core',
        name: 'reactor core',
        description: 'Temperature: 87% of critical. Rising at 2% per hour. Core breach in 24 hours.',
        state: 'critical',
        canExamine: true,
        canRepair: true,
        requiresItem: 'coolant_canister',
      },
      {
        id: 'countdown_timer',
        name: 'countdown display',
        description: 'Large red numbers: 24:00:00 and counting down.',
        state: 'active',
        canExamine: true,
      },
      {
        id: 'medical_scanner',
        name: 'medical scanner',
        description: 'Detecting 3 non-human life signs. Moving through ventilation system. Size: approximately 2 meters.',
        state: 'active',
        canExamine: true,
        canUse: true,
      },
      {
        id: 'ventilation_shaft',
        name: 'ventilation shaft',
        description: 'The grate has been torn off from the inside. You can hear movement in the ducts.',
        state: 'open',
        canExamine: true,
        canEnter: false,
      },
      {
        id: 'containment_pods',
        name: 'containment pods',
        description: '4 reinforced glass containment chambers. All shattered from within. Whatever was inside is very strong.',
        state: 'broken',
        canExamine: true,
      },
      {
        id: 'alien_nest',
        name: 'organic nest',
        description: 'A twisted mass of station materials and alien secretions. Eggs? Larval pods? Nothing good.',
        state: 'active',
        canExamine: true,
        requiresItem: 'emergency_flare',
      },
    ],

    items: [
      {
        id: 'pressure_suit',
        name: 'EVA suit',
        description: 'Emergency spacewalk suit. Allows survival in vacuum for 2 hours.',
        weight: 15,
        size: 20,
        value: 500,
        takeable: true,
        canWear: true,
        wearSlot: 'body',
      },
      {
        id: 'emergency_beacon',
        name: 'distress beacon',
        description: 'Sends emergency signal to Earth. Help will arrive in 48 hours - if you survive that long.',
        weight: 2,
        size: 3,
        value: 300,
        takeable: true,
        canActivate: true,
      },
      {
        id: 'access_card',
        name: 'security keycard',
        description: 'Level 3 clearance. Opens most doors on the station.',
        weight: 0.1,
        size: 1,
        value: 100,
        takeable: true,
        opensDoorsTo: ['laboratory'],
      },
      {
        id: 'captains_log',
        name: "captain's log",
        description:
          'Final entry: "The mining team brought back something from Asteroid K-872. Dr. Reeves wants to study it. Against regulations, but what could go wrong?"',
        weight: 0.2,
        size: 1,
        value: 200,
        takeable: true,
        canRead: true,
      },
      {
        id: 'repair_kit',
        name: 'engineering toolkit',
        description: 'Standard station repair equipment. Might fix the coolant system.',
        weight: 5,
        size: 8,
        value: 150,
        takeable: true,
        canRepairWith: ['coolant_pipes'],
      },
      {
        id: 'coolant_canister',
        name: 'coolant canister',
        description: 'Emergency reactor coolant. Enough for one emergency injection.',
        weight: 10,
        size: 10,
        value: 400,
        takeable: true,
        canUseOn: ['reactor_core'],
      },
      {
        id: 'medical_report',
        name: 'medical analysis',
        description:
          'DNA analysis of organism: silicon-based, exoskeleton, acidic blood. Extremely aggressive. Weakness: extreme cold.',
        weight: 0.2,
        size: 1,
        value: 300,
        takeable: true,
        canRead: true,
      },
      {
        id: 'research_notes',
        name: 'research log',
        description:
          'Dr. Reeves notes: "Specimen shows remarkable adaptability. Three have hatched. They learn incredibly fast. Note: DO NOT approach without sedation ready."',
        weight: 0.3,
        size: 2,
        value: 250,
        takeable: true,
        canRead: true,
      },
      {
        id: 'sedative',
        name: 'heavy sedative',
        description: 'Medical tranquilizer. Powerful enough to drop a horse - or an alien creature.',
        weight: 0.5,
        size: 2,
        value: 200,
        takeable: true,
        canUseOn: ['alien_creature'],
      },
      {
        id: 'emergency_flare',
        name: 'signal flare',
        description: 'Burns at 3000 degrees. Designed for space rescue, but might work as a weapon.',
        weight: 1,
        size: 3,
        value: 150,
        takeable: true,
        canUseOn: ['alien_nest', 'alien_creature'],
      },
      {
        id: 'command_override',
        name: 'command codes',
        description: 'Emergency override codes. Can trigger station self-destruct or emergency systems.',
        weight: 0.1,
        size: 1,
        value: 500,
        takeable: true,
        canActivate: true,
      },
    ],

    npcs: [
      {
        id: 'alien_creature',
        name: 'Unknown Organism',
        description:
          'A nightmare made flesh. Two meters tall, exoskeleton like black glass, too many limbs. It turns toward you, sensing movement...',
        location: 'cargo_hold',
        mood: 'hostile',
        relationship: -100,
        dialogue: {
          greeting: '*screeching sound*',
          default: '*The creature hisses and moves closer*',
          topics: {},
        },
        combatStats: {
          health: 100,
          damage: 50,
          weakness: 'extreme_cold',
          resistances: ['physical'],
        },
      },
    ],

    puzzles: [
      {
        id: 'repair_reactor',
        name: 'Prevent Core Breach',
        description: 'Repair the reactor cooling system before meltdown.',
        type: 'multi_step',
        steps: [
          {
            description: 'Locate coolant canister',
            completed: false,
            requiredItems: ['coolant_canister'],
          },
          {
            description: 'Repair coolant pipes',
            completed: false,
            requiredItems: ['repair_kit'],
            requiredActions: ['use repair_kit on coolant_pipes'],
          },
          {
            description: 'Inject emergency coolant',
            completed: false,
            requiredActions: ['use coolant_canister on reactor_core'],
          },
        ],
        hints: [
          'The engineering bay has everything you need.',
          'Fix the pipes before adding coolant.',
          'Check the cargo hold for supplies.',
        ],
        rewards: {
          score: 300,
          achievement: 'crisis_averted',
        },
      },
      {
        id: 'eliminate_threat',
        name: 'Eliminate the Creatures',
        description: 'Deal with the alien organisms before they multiply.',
        type: 'multi_step',
        steps: [
          {
            description: 'Research the creature weakness',
            completed: false,
            requiredItems: ['medical_report', 'research_notes'],
          },
          {
            description: 'Destroy the nest',
            completed: false,
            requiredActions: ['use emergency_flare on alien_nest'],
          },
          {
            description: 'Neutralize remaining specimens',
            completed: false,
            requiredActions: ['use sedative on alien_creature'],
          },
        ],
        hints: [
          'Read the medical report carefully.',
          'Fire might work on the organic nest.',
          'The medical bay should have sedatives.',
        ],
        rewards: {
          score: 300,
          achievement: 'exterminator',
        },
      },
    ],

    achievements: [
      {
        id: 'crisis_averted',
        name: 'Crisis Averted',
        description: 'Prevent reactor meltdown',
        points: 200,
        icon: '⚛️',
      },
      {
        id: 'exterminator',
        name: 'Exterminator',
        description: 'Eliminate all alien threats',
        points: 250,
        icon: '👾',
      },
      {
        id: 'survivor',
        name: 'Sole Survivor',
        description: 'Escape Station Erebus alive',
        points: 150,
        icon: '🚀',
      },
      {
        id: 'scientist',
        name: 'Dedicated Scientist',
        description: 'Collect all research data',
        points: 100,
        icon: '🔬',
      },
    ],

    endings: [
      {
        id: 'escape_success',
        name: 'Narrow Escape',
        description:
          'You board your shuttle as the reactor reaches critical. The station explodes behind you as you accelerate toward Earth. The nightmare is over - for now.',
        requiredScore: 500,
        requiredItems: ['emergency_beacon'],
        message:
          'As Earth grows larger in your viewscreen, you send the warning: "Never return to Asteroid K-872. Some things should stay buried in space."',
      },
      {
        id: 'hero_ending',
        name: 'Against All Odds',
        description:
          'You repaired the reactor, eliminated the threat, and saved the station. Rescue arrives in 48 hours. You did the impossible.',
        requiredScore: 600,
        message:
          'Station Erebus limps back to life. The creatures are contained. You saved everyone who might have come here. Humanity owes you a debt it will never know about.',
      },
      {
        id: 'sacrifice_ending',
        name: 'Ultimate Sacrifice',
        description:
          'You activate the self-destruct, staying aboard to ensure nothing escapes. The creatures must not reach Earth.',
        requiredScore: 300,
        requiredItems: ['command_override'],
        message:
          'The station vanishes in a brilliant flash. No one will ever know what you did here, but Earth is safe. That has to be enough.',
      },
      {
        id: 'failure_ending',
        name: 'Total System Failure',
        description:
          'The reactor breaches. The station disintegrates. You, the creatures, everything - lost to the void.',
        requiredScore: 0,
        message:
          'Debris rains down on Earths atmosphere, burning up on entry. Almost everything. Almost...',
      },
    ],
  };
}
