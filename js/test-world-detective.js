/**
 * Detective Mystery Test World: "The Midnight Murder"
 * A noir detective story set in a 1940s mansion
 */

export function generateDetectiveWorld() {
  return {
    metadata: {
      title: 'The Midnight Murder',
      author: 'Somnium Test Worlds',
      version: '1.0',
      description:
        'A classic noir mystery. Someone has been murdered at the Blackwood Estate, and you must find the killer before they strike again.',
      theme: 'detective_noir',
      mockData: true,
    },

    settings: {
      startingRoom: 'driveway',
      maxScore: 500,
      timeLimit: 0,
    },

    rooms: [
      {
        id: 'driveway',
        name: 'Mansion Driveway',
        description:
          "Rain pounds the gravel driveway of Blackwood Estate. The imposing Victorian mansion looms before you, windows dark except for a single light in the study. Your '47 Packard sits behind you, engine ticking as it cools. The front door is slightly ajar.",
        graphics: {
          backgroundColor: '#000000',
          primitives: [
            // Rainy sky
            {
              type: 'rect',
              x: 0,
              y: 0,
              width: 320,
              height: 100,
              color: '#000000',
              filled: true,
            },
            // Mansion
            {
              type: 'rect',
              x: 60,
              y: 80,
              width: 200,
              height: 120,
              color: '#555555',
              filled: true,
            },
            // Windows (dark)
            { type: 'rect', x: 80, y: 100, width: 20, height: 25, color: '#0000AA', filled: true },
            { type: 'rect', x: 120, y: 100, width: 20, height: 25, color: '#0000AA', filled: true },
            { type: 'rect', x: 180, y: 100, width: 20, height: 25, color: '#FFFF55', filled: true }, // Lit window
            { type: 'rect', x: 220, y: 100, width: 20, height: 25, color: '#0000AA', filled: true },
            // Door
            { type: 'rect', x: 145, y: 155, width: 30, height: 45, color: '#AA5500', filled: true },
            // Car
            { type: 'rect', x: 10, y: 160, width: 40, height: 25, color: '#000000', filled: true },
            { type: 'circle', x: 20, y: 185, radius: 5, color: '#555555', filled: true },
            { type: 'circle', x: 40, y: 185, radius: 5, color: '#555555', filled: true },
          ],
        },
        exits: {
          north: { room: 'foyer', blocked: false },
        },
        objects: ['packard', 'gate', 'rain'],
        items: ['flashlight'],
        npcs: [],
      },

      {
        id: 'foyer',
        name: 'Grand Foyer',
        description:
          'A chandelier casts shadows across the marble floor. A grand staircase leads up to the second floor. Doors lead east to the study, west to the library, and north to the dining room. The air smells of expensive cigars and gunpowder.',
        graphics: {
          backgroundColor: '#000000',
          primitives: [
            // Floor
            { type: 'rect', x: 0, y: 140, width: 320, height: 60, color: '#AAAAAA', filled: true },
            // Staircase
            { type: 'polygon', points: [[160, 140], [220, 140], [220, 100]], color: '#AA5500', filled: true },
            { type: 'line', x1: 160, y1: 140, x2: 160, y2: 100, color: '#555555' },
            { type: 'line', x1: 170, y1: 135, x2: 170, y2: 105, color: '#555555' },
            { type: 'line', x1: 180, y1: 130, x2: 180, y2: 110, color: '#555555' },
            // Chandelier
            { type: 'circle', x: 160, y: 40, radius: 15, color: '#FFFF55', filled: true },
            { type: 'line', x1: 160, y1: 25, x2: 160, y2: 10, color: '#AA5500' },
            // Blood stain (subtle)
            { type: 'circle', x: 100, y: 170, radius: 8, color: '#AA0000', filled: true },
          ],
        },
        exits: {
          south: { room: 'driveway', blocked: false },
          east: { room: 'study', blocked: false },
          west: { room: 'library', blocked: false },
          north: { room: 'dining_room', blocked: false },
          up: { room: 'upstairs_hall', blocked: false },
        },
        objects: ['chandelier', 'blood_stain', 'marble_floor'],
        items: ['cigarette_butt'],
        npcs: [],
      },

      {
        id: 'study',
        name: "Victim's Study",
        description:
          'The body of Marcus Blackwood lies slumped over his mahogany desk, a bullet wound in his back. Papers are scattered everywhere. A wall safe stands open and empty. The smell of gunpowder is strongest here.',
        graphics: {
          backgroundColor: '#0000AA',
          primitives: [
            // Desk
            { type: 'rect', x: 100, y: 120, width: 120, height: 60, color: '#AA5500', filled: true },
            // Body (slumped)
            { type: 'ellipse', x: 160, y: 130, radiusX: 20, radiusY: 15, color: '#555555', filled: true },
            // Papers scattered
            { type: 'rect', x: 130, y: 150, width: 15, height: 10, color: '#FFFFFF', filled: true },
            { type: 'rect', x: 170, y: 145, width: 12, height: 8, color: '#FFFFFF', filled: true },
            // Wall safe
            { type: 'rect', x: 240, y: 80, width: 40, height: 40, color: '#555555', filled: true },
            { type: 'rect', x: 250, y: 90, width: 20, height: 20, color: '#000000', filled: true },
            // Window
            { type: 'rect', x: 20, y: 60, width: 50, height: 60, color: '#000000', filled: true },
          ],
        },
        exits: {
          west: { room: 'foyer', blocked: false },
        },
        objects: ['body', 'desk', 'safe', 'window_study'],
        items: ['bullet_casing', 'threatening_letter', 'insurance_policy'],
        npcs: [],
      },

      {
        id: 'library',
        name: 'Library',
        description:
          'Floor-to-ceiling bookshelves line the walls. A fire crackles in the fireplace, but the room feels cold. Someone has been searching through the books recently - several volumes lie open on the reading table.',
        graphics: {
          backgroundColor: '#AA0000',
          primitives: [
            // Bookshelves
            { type: 'rect', x: 10, y: 40, width: 60, height: 140, color: '#AA5500', filled: true },
            { type: 'rect', x: 250, y: 40, width: 60, height: 140, color: '#AA5500', filled: true },
            // Books (lines)
            { type: 'line', x1: 15, y1: 60, x2: 65, y2: 60, color: '#FFFF55' },
            { type: 'line', x1: 15, y1: 80, x2: 65, y2: 80, color: '#FFFF55' },
            { type: 'line', x1: 15, y1: 100, x2: 65, y2: 100, color: '#FFFF55' },
            // Fireplace
            { type: 'rect', x: 130, y: 80, width: 60, height: 70, color: '#555555', filled: true },
            { type: 'polygon', points: [[130, 80], [160, 60], [190, 80]], color: '#555555', filled: true },
            // Fire
            { type: 'polygon', points: [[145, 130], [160, 110], [175, 130]], color: '#FF5555', filled: true },
            // Table
            { type: 'rect', x: 120, y: 160, width: 80, height: 30, color: '#AA5500', filled: true },
          ],
        },
        exits: {
          east: { room: 'foyer', blocked: false },
        },
        objects: ['fireplace', 'bookshelves', 'reading_table'],
        items: ['burned_letter', 'bookmark', 'rare_book'],
        npcs: ['butler'],
      },

      {
        id: 'dining_room',
        name: 'Dining Room',
        description:
          'A long dining table is set for dinner, but the meal was never served. Six place settings remain untouched. Wine glasses still contain red wine. A servants door leads west to the kitchen.',
        graphics: {
          backgroundColor: '#AA00AA',
          primitives: [
            // Table
            { type: 'rect', x: 60, y: 100, width: 200, height: 80, color: '#AA5500', filled: true },
            // Chairs (simplified)
            { type: 'rect', x: 50, y: 110, width: 15, height: 30, color: '#AA5500', filled: true },
            { type: 'rect', x: 255, y: 110, width: 15, height: 30, color: '#AA5500', filled: true },
            // Place settings
            { type: 'circle', x: 100, y: 130, radius: 5, color: '#FFFFFF', filled: true },
            { type: 'circle', x: 140, y: 130, radius: 5, color: '#FFFFFF', filled: true },
            { type: 'circle', x: 180, y: 130, radius: 5, color: '#FFFFFF', filled: true },
            { type: 'circle', x: 220, y: 130, radius: 5, color: '#FFFFFF', filled: true },
            // Wine glasses
            { type: 'line', x1: 110, y1: 125, x2: 110, y2: 135, color: '#AA0000' },
            { type: 'line', x1: 150, y1: 125, x2: 150, y2: 135, color: '#AA0000' },
          ],
        },
        exits: {
          south: { room: 'foyer', blocked: false },
          west: { room: 'kitchen', blocked: false },
        },
        objects: ['dining_table', 'place_settings'],
        items: ['wine_glass', 'dinner_invitation'],
        npcs: [],
      },

      {
        id: 'kitchen',
        name: 'Kitchen',
        description:
          "The cook's domain is immaculate except for a broken wine bottle on the floor. A knife is missing from the knife block. The back door is locked from the inside.",
        graphics: {
          backgroundColor: '#00AAAA',
          primitives: [
            // Counter
            { type: 'rect', x: 200, y: 100, width: 100, height: 40, color: '#AAAAAA', filled: true },
            // Knife block
            { type: 'rect', x: 240, y: 90, width: 20, height: 10, color: '#AA5500', filled: true },
            // Knives (vertical lines)
            { type: 'line', x1: 245, y1: 85, x2: 245, y2: 90, color: '#AAAAAA' },
            { type: 'line', x1: 250, y1: 85, x2: 250, y2: 90, color: '#AAAAAA' },
            // Missing knife (gap)
            // Broken glass
            { type: 'polygon', points: [[80, 160], [90, 170], [85, 175]], color: '#55FFFF', filled: true },
            { type: 'polygon', points: [[75, 165], [80, 175], [70, 173]], color: '#55FFFF', filled: true },
            // Stove
            { type: 'rect', x: 20, y: 110, width: 60, height: 50, color: '#555555', filled: true },
          ],
        },
        exits: {
          east: { room: 'dining_room', blocked: false },
        },
        objects: ['knife_block', 'broken_bottle', 'back_door', 'stove'],
        items: ['kitchen_knife', 'glass_shard'],
        npcs: ['cook'],
      },

      {
        id: 'upstairs_hall',
        name: 'Upstairs Hallway',
        description:
          'A dimly lit corridor with three bedroom doors. The carpet shows recent muddy footprints leading from the stairs to the master bedroom. A portrait of the Blackwood family hangs on the wall.',
        graphics: {
          backgroundColor: '#AA0000',
          primitives: [
            // Hallway
            { type: 'rect', x: 0, y: 120, width: 320, height: 80, color: '#555555', filled: true },
            // Doors
            { type: 'rect', x: 50, y: 130, width: 30, height: 50, color: '#AA5500', filled: true },
            { type: 'rect', x: 145, y: 130, width: 30, height: 50, color: '#AA5500', filled: true },
            { type: 'rect', x: 240, y: 130, width: 30, height: 50, color: '#AA5500', filled: true },
            // Portrait
            { type: 'rect', x: 130, y: 60, width: 60, height: 80, color: '#AA5500', filled: true },
            // Muddy footprints
            { type: 'ellipse', x: 160, y: 150, radiusX: 5, radiusY: 8, color: '#AA5500', filled: true },
            { type: 'ellipse', x: 175, y: 155, radiusX: 5, radiusY: 8, color: '#AA5500', filled: true },
          ],
        },
        exits: {
          down: { room: 'foyer', blocked: false },
          west: { room: 'master_bedroom', blocked: false },
          north: { room: 'guest_room', blocked: false },
          east: { room: 'servants_quarters', blocked: false },
        },
        objects: ['portrait', 'muddy_footprints'],
        items: [],
        npcs: [],
      },

      {
        id: 'master_bedroom',
        name: 'Master Bedroom',
        description:
          "Marcus Blackwood's bedroom is in disarray. The bed is unmade, dresser drawers hang open, and a jewelry box has been ransacked. A photograph on the nightstand shows Marcus with a younger woman - not his wife.",
        graphics: {
          backgroundColor: '#AA00AA',
          primitives: [
            // Bed
            { type: 'rect', x: 180, y: 100, width: 100, height: 80, color: '#AA0000', filled: true },
            { type: 'rect', x: 180, y: 90, width: 100, height: 10, color: '#AA5500', filled: true },
            // Dresser (open drawers)
            { type: 'rect', x: 20, y: 120, width: 60, height: 60, color: '#AA5500', filled: true },
            { type: 'rect', x: 25, y: 130, width: 50, height: 15, color: '#555555', filled: true },
            { type: 'rect', x: 25, y: 150, width: 50, height: 15, color: '#555555', filled: true },
            // Nightstand
            { type: 'rect', x: 140, y: 140, width: 30, height: 40, color: '#AA5500', filled: true },
            // Photo (small rectangle)
            { type: 'rect', x: 145, y: 135, width: 20, height: 15, color: '#FFFFFF', filled: true },
          ],
        },
        exits: {
          east: { room: 'upstairs_hall', blocked: false },
        },
        objects: ['bed', 'dresser', 'jewelry_box'],
        items: ['photograph', 'love_letter', 'empty_jewelry_box'],
        npcs: [],
      },

      {
        id: 'guest_room',
        name: 'Guest Bedroom',
        description:
          "Someone has been staying here recently - the bed is made but there's a suitcase on the floor. A wet raincoat hangs on the door. Muddy shoes sit by the bed.",
        graphics: {
          backgroundColor: '#0000AA',
          primitives: [
            // Bed (made)
            { type: 'rect', x: 200, y: 120, width: 100, height: 60, color: '#00AAAA', filled: true },
            { type: 'rect', x: 200, y: 110, width: 100, height: 10, color: '#AA5500', filled: true },
            // Suitcase
            { type: 'rect', x: 100, y: 160, width: 40, height: 25, color: '#AA5500', filled: true },
            // Raincoat on door
            { type: 'polygon', points: [[30, 100], [50, 100], [45, 150], [35, 150]], color: '#555555', filled: true },
            // Shoes
            { type: 'ellipse', x: 230, y: 180, radiusX: 10, radiusY: 5, color: '#AA5500', filled: true },
            { type: 'ellipse', x: 250, y: 180, radiusX: 10, radiusY: 5, color: '#AA5500', filled: true },
          ],
        },
        exits: {
          south: { room: 'upstairs_hall', blocked: false },
        },
        objects: ['guest_bed', 'suitcase_obj', 'raincoat', 'muddy_shoes'],
        items: ['train_ticket', 'muddy_shoes_item'],
        npcs: ['mysterious_guest'],
      },

      {
        id: 'servants_quarters',
        name: "Servant's Room",
        description:
          'A small, sparse room. The butler sleeps here. A uniform hangs neatly in the closet. On the desk is a ledger showing the household finances - someone has been embezzling.',
        graphics: {
          backgroundColor: '#555555',
          primitives: [
            // Simple bed
            { type: 'rect', x: 200, y: 140, width: 80, height: 50, color: '#AAAAAA', filled: true },
            // Desk
            { type: 'rect', x: 50, y: 130, width: 60, height: 40, color: '#AA5500', filled: true },
            // Ledger (open book)
            { type: 'rect', x: 60, y: 125, width: 40, height: 20, color: '#FFFFFF', filled: true },
            // Closet
            { type: 'rect', x: 10, y: 80, width: 30, height: 80, color: '#AA5500', filled: true },
            // Uniform
            { type: 'polygon', points: [[20, 90], [25, 90], [25, 140], [20, 140]], color: '#000000', filled: true },
          ],
        },
        exits: {
          west: { room: 'upstairs_hall', blocked: false },
        },
        objects: ['servants_bed', 'desk_servants', 'ledger', 'closet'],
        items: ['financial_ledger', 'servants_diary'],
        npcs: [],
      },
    ],

    objects: [
      {
        id: 'packard',
        name: "detective's car",
        description: "Your trusty '47 Packard. She's seen better days, but she's never let you down.",
        state: 'parked',
        canExamine: true,
        canEnter: true,
      },
      {
        id: 'body',
        name: "Marcus Blackwood's body",
        description:
          'Male, mid-50s, single gunshot wound to the back. Time of death approximately two hours ago. No signs of struggle.',
        state: 'examined',
        canExamine: true,
        requiresItem: 'magnifying_glass',
      },
      {
        id: 'safe',
        name: 'wall safe',
        description: 'A combination safe, now standing open and empty. No signs of forced entry.',
        state: 'open',
        canExamine: true,
        containedItems: [],
      },
      {
        id: 'blood_stain',
        name: 'blood stain',
        description: 'A fresh blood stain on the marble. Drag marks lead from here to the study.',
        state: 'fresh',
        canExamine: true,
      },
      {
        id: 'portrait',
        name: 'family portrait',
        description:
          'The Blackwood family from ten years ago: Marcus, his wife Eleanor, and their son Victor. Victor looks angry in the photograph.',
        state: 'hanging',
        canExamine: true,
      },
      {
        id: 'muddy_footprints',
        name: 'muddy footprints',
        description: 'Size 10 mens dress shoes. The mud is still wet. These are recent.',
        state: 'fresh',
        canExamine: true,
      },
    ],

    items: [
      {
        id: 'flashlight',
        name: 'flashlight',
        description: 'Your police-issue flashlight. Heavy enough to double as a weapon.',
        weight: 1,
        size: 2,
        value: 20,
        takeable: true,
        isLight: true,
      },
      {
        id: 'bullet_casing',
        name: 'bullet casing',
        description: '.38 caliber. Still warm.',
        weight: 0.05,
        size: 1,
        value: 50,
        takeable: true,
        isEvidence: true,
      },
      {
        id: 'threatening_letter',
        name: 'threatening letter',
        description:
          "A typed letter: 'Pay what you owe or you'll pay with your life.' No signature.",
        weight: 0.1,
        size: 1,
        value: 100,
        takeable: true,
        canRead: true,
        isEvidence: true,
      },
      {
        id: 'insurance_policy',
        name: 'insurance policy',
        description:
          "Life insurance for $500,000. Beneficiary: Eleanor Blackwood. Policy taken out three months ago.",
        weight: 0.1,
        size: 1,
        value: 150,
        takeable: true,
        canRead: true,
        isEvidence: true,
      },
      {
        id: 'burned_letter',
        name: 'partially burned letter',
        description:
          "Charred paper from the fireplace. Readable fragments: '...meet me at midnight...nobody can know...'",
        weight: 0.05,
        size: 1,
        value: 100,
        takeable: true,
        canRead: true,
        isEvidence: true,
      },
      {
        id: 'photograph',
        name: 'photograph',
        description: 'Marcus with a young woman, laughing. Written on the back: "To my love, forever - V."',
        weight: 0.1,
        size: 1,
        value: 150,
        takeable: true,
        isEvidence: true,
      },
      {
        id: 'love_letter',
        name: 'love letter',
        description: 'A passionate letter to Marcus from someone signed only "V". The handwriting is elegant.',
        weight: 0.05,
        size: 1,
        value: 100,
        takeable: true,
        canRead: true,
        isEvidence: true,
      },
      {
        id: 'train_ticket',
        name: 'train ticket',
        description: 'One-way ticket from Chicago, arriving this evening. Passenger name: Victoria Sterling.',
        weight: 0.05,
        size: 1,
        value: 75,
        takeable: true,
        isEvidence: true,
      },
      {
        id: 'financial_ledger',
        name: 'financial ledger',
        description:
          'Household accounts. Someone has been systematically embezzling $500 per month for the past year.',
        weight: 1,
        size: 3,
        value: 200,
        takeable: true,
        canRead: true,
        isEvidence: true,
      },
      {
        id: 'wine_glass',
        name: 'wine glass',
        description: 'Half-full glass of red wine. Lipstick mark on the rim.',
        weight: 0.3,
        size: 2,
        value: 25,
        takeable: true,
        isEvidence: true,
      },
      {
        id: 'kitchen_knife',
        name: 'kitchen knife',
        description: 'An 8-inch chefs knife. The blade has been recently cleaned, but theres blood in the handle grooves.',
        weight: 0.5,
        size: 2,
        value: 50,
        takeable: true,
        isEvidence: true,
      },
    ],

    npcs: [
      {
        id: 'butler',
        name: 'James the Butler',
        description:
          'An elderly man in an immaculate black suit. His hands shake slightly as he speaks.',
        location: 'library',
        mood: 'nervous',
        relationship: 0,
        dialogue: {
          greeting:
            "Good evening, detective. I... I found Mr. Blackwood at 9 PM. It was terrible.",
          default:
            "I've served the Blackwood family for thirty years. I would never...",
          topics: {
            murder:
              "I heard a gunshot around 8:45 PM. When I went to investigate, the study door was locked from the inside.",
            family:
              "Mrs. Blackwood was at her sister's tonight. Master Victor... he and his father had a terrible argument yesterday.",
            safe:
              "Only Mr. Blackwood knew the combination. Well, and possibly Master Victor.",
            embezzling:
              "I... I don't know what you mean, detective. (He's clearly lying)",
          },
        },
        trading: {
          accepts: ['cigarette_butt'],
          offers: ['servants_diary'],
          requiresRelationship: 50,
        },
      },
      {
        id: 'cook',
        name: 'Mrs. Henderson',
        description: 'A stout woman in her 60s, covered in flour. She seems genuinely distraught.',
        location: 'kitchen',
        mood: 'upset',
        relationship: 20,
        dialogue: {
          greeting: "Oh detective, this is just awful! Who would do such a thing?",
          default: "I've been preparing dinner all evening. I didn't hear anything unusual.",
          topics: {
            murder:
              "I was in the kitchen from 6 PM onwards. The serving bell never rang, so I knew something was wrong.",
            knife:
              "That's my best chefs knife! I noticed it was missing around 8:30 PM. I thought I'd misplaced it.",
            family:
              "Mrs. Blackwood is a saint. Mr. Blackwood, though... he had his secrets.",
            victoria:
              "A young woman arrived this afternoon. Very pretty. Mr. Blackwood seemed flustered when she arrived.",
          },
        },
      },
      {
        id: 'mysterious_guest',
        name: 'Victoria Sterling',
        description:
          'A beautiful woman in her late 20s, wearing an expensive red dress. Her eyes are red from crying.',
        location: 'guest_room',
        mood: 'grieving',
        relationship: -20,
        dialogue: {
          greeting:
            "Who are you? Did Eleanor send you? I... I loved Marcus.",
          default:
            "I don't have to tell you anything. I have rights!",
          topics: {
            murder:
              "I was here in my room. I heard the gunshot but... I was too scared to investigate.",
            marcus:
              "We were in love. He was going to leave Eleanor and marry me. We were going to run away together.",
            safe:
              "Marcus said he was keeping money in the safe for our new life together. $50,000.",
            evening:
              "I arrived at 7 PM. Marcus and I had dinner plans, but he said he had to deal with something first. That was the last time I saw him alive.",
          },
        },
      },
    ],

    puzzles: [
      {
        id: 'solve_murder',
        name: 'Identify the Killer',
        description: 'Gather evidence and determine who killed Marcus Blackwood.',
        type: 'multi_step',
        steps: [
          {
            description: 'Examine the crime scene',
            completed: false,
            requiredItems: [],
            requiredActions: ['examine body', 'examine safe', 'examine blood_stain'],
          },
          {
            description: 'Interview all suspects',
            completed: false,
            requiredActions: ['talk to butler', 'talk to cook', 'talk to mysterious_guest'],
          },
          {
            description: 'Find the murder weapon',
            completed: false,
            requiredItems: ['kitchen_knife'],
          },
          {
            description: 'Piece together the motive',
            completed: false,
            requiredItems: ['insurance_policy', 'financial_ledger', 'photograph'],
          },
        ],
        hints: [
          'The butler knew about the embezzlement and needed money.',
          'Victoria knew the safe combination from Marcus.',
          'Check who had access to the kitchen knife.',
          "The muddy footprints match the butler's shoes.",
        ],
        rewards: {
          score: 500,
          achievement: 'ace_detective',
        },
        consequences: {
          failure: 'The killer escapes justice.',
        },
      },
    ],

    achievements: [
      {
        id: 'ace_detective',
        name: 'Ace Detective',
        description: 'Solve the murder of Marcus Blackwood',
        points: 200,
        icon: '🕵️',
      },
      {
        id: 'evidence_collector',
        name: 'Evidence Collector',
        description: 'Collect all pieces of evidence',
        points: 100,
        icon: '📋',
      },
      {
        id: 'smooth_talker',
        name: 'Smooth Talker',
        description: 'Get all suspects to reveal their secrets',
        points: 150,
        icon: '🗣️',
      },
    ],

    endings: [
      {
        id: 'butler_arrested',
        name: 'Justice Served',
        description:
          'You present your evidence to the police. James the butler is arrested for murder and embezzlement. He confesses: desperate after being caught embezzling, he killed Marcus when confronted about the missing money.',
        requiredScore: 400,
        requiredItems: ['financial_ledger', 'kitchen_knife', 'muddy_shoes_item'],
        message:
          "The butler breaks down and confesses. Case closed. Another day, another solved mystery in this rain-soaked city.",
      },
      {
        id: 'wrong_suspect',
        name: 'Wrongful Arrest',
        description:
          'You arrest the wrong person. Victoria is taken into custody, but later evidence proves her innocence. The real killer is never found.',
        requiredScore: 200,
        message:
          "You got it wrong, detective. The butler skipped town the next day. This one's going to haunt you.",
      },
    ],
  };
}
