/**
 * Demo world generator for showcasing all Somnium features
 * This creates "The Enchanted Manor" - a complete mini-adventure
 */

export function generateDemoWorld() {
  return {
    metadata: {
      title: 'The Enchanted Manor',
      author: 'Somnium Demo',
      version: '1.0',
      description: 'A showcase adventure demonstrating all engine features',
    },

    settings: {
      startingRoom: 'manor_entrance',
      maxScore: 300,
      timeLimit: 0, // No time limit
    },

    rooms: [
      {
        id: 'manor_entrance',
        name: 'Manor Entrance',
        description:
          'You stand before an imposing Gothic manor. Gargoyles leer down from the corners of the building, and dead ivy clings to the weathered stone walls. The heavy oak door is closed, with an ornate brass keyhole. A path leads north into the dark forest.',
        graphics: {
          background: { type: 'fill', color: 4 }, // Dark blue sky
          elements: [
            {
              type: 'rectangle',
              x: 50,
              y: 100,
              width: 220,
              height: 100,
              color: 8,
              filled: true,
            }, // Manor
            {
              type: 'rectangle',
              x: 140,
              y: 140,
              width: 40,
              height: 60,
              color: 6,
              filled: true,
            }, // Door
            {
              type: 'circle',
              x: 160,
              y: 170,
              radius: 3,
              color: 14,
              filled: true,
            }, // Keyhole
            {
              type: 'polygon',
              points: [
                [50, 100],
                [160, 60],
                [270, 100],
              ],
              color: 2,
              filled: true,
            }, // Roof
          ],
        },
        exits: {
          north: { room: 'dark_forest', blocked: false },
          east: { room: 'garden', blocked: false },
        },
        objects: ['front_door', 'gargoyle', 'doormat'],
        items: [],
        npcs: [],
      },

      {
        id: 'garden',
        name: 'Overgrown Garden',
        description:
          'What was once a beautiful garden is now a tangle of thorns and weeds. A rusty garden shed leans precariously in one corner. Among the overgrowth, you spot a well with a rope and bucket.',
        graphics: {
          background: { type: 'fill', color: 10 }, // Green
          elements: [
            {
              type: 'rectangle',
              x: 200,
              y: 120,
              width: 60,
              height: 80,
              color: 6,
              filled: true,
            }, // Shed
            {
              type: 'circle',
              x: 100,
              y: 150,
              radius: 20,
              color: 8,
              filled: false,
            }, // Well
            { type: 'line', x1: 100, y1: 130, x2: 100, y2: 150, color: 6 }, // Rope
          ],
        },
        exits: {
          west: { room: 'manor_entrance', blocked: false },
        },
        objects: ['shed', 'well', 'thorns'],
        items: ['rusty_key', 'garden_shears'],
        npcs: [],
      },

      {
        id: 'dark_forest',
        name: 'Dark Forest Path',
        description:
          'Twisted trees form a canopy overhead, blocking most of the light. The path splits here - west leads deeper into the forest, while a faint trail leads east back toward the manor.',
        graphics: {
          background: { type: 'fill', color: 0 }, // Black
          elements: [
            {
              type: 'rectangle',
              x: 0,
              y: 140,
              width: 320,
              height: 60,
              color: 6,
              filled: true,
            }, // Ground
            {
              type: 'polygon',
              points: [
                [50, 40],
                [30, 140],
                [70, 140],
              ],
              color: 2,
              filled: true,
            }, // Tree 1
            {
              type: 'polygon',
              points: [
                [150, 20],
                [130, 140],
                [170, 140],
              ],
              color: 2,
              filled: true,
            }, // Tree 2
            {
              type: 'polygon',
              points: [
                [250, 30],
                [230, 140],
                [270, 140],
              ],
              color: 2,
              filled: true,
            }, // Tree 3
          ],
        },
        exits: {
          south: { room: 'manor_entrance', blocked: false },
          west: { room: 'hermit_clearing', blocked: false },
        },
        objects: ['trees', 'mushrooms'],
        items: ['glowing_mushroom'],
        npcs: ['forest_spirit'],
      },

      {
        id: 'hermit_clearing',
        name: "Hermit's Clearing",
        description:
          'A small clearing in the forest contains a ramshackle hut. Smoke rises from a crooked chimney, and strange symbols are carved into the trees surrounding the clearing.',
        graphics: {
          background: { type: 'fill', color: 1 }, // Dark blue
          elements: [
            {
              type: 'rectangle',
              x: 120,
              y: 100,
              width: 80,
              height: 70,
              color: 6,
              filled: true,
            }, // Hut
            {
              type: 'polygon',
              points: [
                [120, 100],
                [160, 70],
                [200, 100],
              ],
              color: 4,
              filled: true,
            }, // Roof
            { type: 'line', x1: 160, y1: 70, x2: 160, y2: 50, color: 8 }, // Smoke
          ],
        },
        exits: {
          east: { room: 'dark_forest', blocked: false },
        },
        objects: ['hut', 'symbols'],
        items: [],
        npcs: ['hermit'],
      },

      {
        id: 'manor_foyer',
        name: 'Manor Foyer',
        description:
          'The foyer is covered in dust and cobwebs. A grand staircase curves upward into darkness. Faded portraits line the walls, their eyes seeming to follow you. Doors lead to the east and west.',
        graphics: {
          background: { type: 'fill', color: 6 }, // Brown
          elements: [
            {
              type: 'rectangle',
              x: 100,
              y: 50,
              width: 120,
              height: 150,
              color: 8,
              filled: false,
            }, // Staircase
            {
              type: 'rectangle',
              x: 20,
              y: 80,
              width: 40,
              height: 60,
              color: 4,
              filled: true,
            }, // Portrait 1
            {
              type: 'rectangle',
              x: 260,
              y: 80,
              width: 40,
              height: 60,
              color: 4,
              filled: true,
            }, // Portrait 2
          ],
        },
        exits: {
          south: { room: 'manor_entrance', blocked: false },
          east: { room: 'library', blocked: false },
          west: { room: 'dining_room', blocked: false },
          up: {
            room: 'upper_hallway',
            blocked: true,
            lockedMessage: 'The stairs creak ominously and seem unsafe.',
          },
        },
        objects: ['staircase', 'portraits', 'chandelier'],
        items: ['silver_coin'],
        npcs: [],
      },

      {
        id: 'library',
        name: 'Dusty Library',
        description:
          'Floor-to-ceiling bookshelves line the walls, filled with moldering tomes. A large desk sits in the center of the room, covered in papers. One bookshelf seems slightly askew.',
        graphics: {
          background: { type: 'fill', color: 6 },
          elements: [
            {
              type: 'rectangle',
              x: 0,
              y: 40,
              width: 60,
              height: 140,
              color: 4,
              filled: true,
            }, // Bookshelf 1
            {
              type: 'rectangle',
              x: 260,
              y: 40,
              width: 60,
              height: 140,
              color: 4,
              filled: true,
            }, // Bookshelf 2
            {
              type: 'rectangle',
              x: 120,
              y: 100,
              width: 80,
              height: 60,
              color: 6,
              filled: true,
            }, // Desk
          ],
        },
        exits: {
          west: { room: 'manor_foyer', blocked: false },
        },
        objects: ['desk', 'bookshelf', 'secret_bookshelf'],
        items: ['ancient_tome', 'magnifying_glass'],
        npcs: [],
      },

      {
        id: 'secret_room',
        name: 'Secret Study',
        description:
          'This hidden room contains arcane equipment and mystical artifacts. A glowing orb sits on a pedestal in the center. Strange energies crackle in the air.',
        graphics: {
          background: { type: 'fill', color: 5 }, // Magenta
          elements: [
            {
              type: 'circle',
              x: 160,
              y: 100,
              radius: 30,
              color: 15,
              filled: true,
            }, // Glowing orb
            {
              type: 'rectangle',
              x: 140,
              y: 120,
              width: 40,
              height: 40,
              color: 8,
              filled: true,
            }, // Pedestal
          ],
        },
        exits: {
          east: { room: 'library', blocked: false },
        },
        objects: ['pedestal', 'magical_circle'],
        items: ['crystal_key', 'spell_scroll'],
        npcs: [],
      },

      {
        id: 'dining_room',
        name: 'Grand Dining Room',
        description:
          'A long table dominates this room, set with tarnished silverware and cracked china. Cobwebs drape from the chandelier like party streamers. A door to the north leads to what appears to be a kitchen.',
        graphics: {
          background: { type: 'fill', color: 6 },
          elements: [
            {
              type: 'rectangle',
              x: 60,
              y: 100,
              width: 200,
              height: 60,
              color: 4,
              filled: true,
            }, // Table
            {
              type: 'circle',
              x: 160,
              y: 50,
              radius: 20,
              color: 14,
              filled: false,
            }, // Chandelier
          ],
        },
        exits: {
          east: { room: 'manor_foyer', blocked: false },
          north: { room: 'kitchen', blocked: false },
        },
        objects: ['dining_table', 'chandelier', 'china_cabinet'],
        items: ['silver_fork'],
        npcs: ['ghost_butler'],
      },

      {
        id: 'kitchen',
        name: 'Abandoned Kitchen',
        description:
          'Rusted pots and pans hang from hooks on the walls. The old wood stove is cold and dark. A pantry door stands slightly ajar, and you can make out shelves inside.',
        graphics: {
          background: { type: 'fill', color: 8 },
          elements: [
            {
              type: 'rectangle',
              x: 200,
              y: 80,
              width: 80,
              height: 100,
              color: 0,
              filled: true,
            }, // Stove
            {
              type: 'rectangle',
              x: 40,
              y: 100,
              width: 60,
              height: 80,
              color: 6,
              filled: true,
            }, // Pantry
          ],
        },
        exits: {
          south: { room: 'dining_room', blocked: false },
        },
        objects: ['stove', 'pantry', 'pots'],
        items: ['cookbook', 'dried_herbs'],
        npcs: [],
      },

      {
        id: 'upper_hallway',
        name: 'Upper Hallway',
        description:
          'The upstairs hallway stretches in both directions. Doors line the walls, most of them locked. At the far end, you see a door with strange symbols glowing faintly.',
        graphics: {
          background: { type: 'fill', color: 4 },
          elements: [
            {
              type: 'rectangle',
              x: 40,
              y: 80,
              width: 40,
              height: 80,
              color: 6,
              filled: true,
            }, // Door 1
            {
              type: 'rectangle',
              x: 140,
              y: 80,
              width: 40,
              height: 80,
              color: 6,
              filled: true,
            }, // Door 2
            {
              type: 'rectangle',
              x: 240,
              y: 80,
              width: 40,
              height: 80,
              color: 6,
              filled: true,
            }, // Door 3 (glowing)
          ],
        },
        exits: {
          down: { room: 'manor_foyer', blocked: false },
          east: {
            room: 'master_bedroom',
            blocked: true,
            lockedMessage: 'This door requires a crystal key.',
          },
        },
        objects: ['glowing_door', 'paintings'],
        items: [],
        npcs: [],
      },

      {
        id: 'master_bedroom',
        name: 'Master Bedroom',
        description:
          'This opulent bedroom has been preserved in time. A four-poster bed dominates the room, and a jewelry box sits on the vanity. Through the window, you see the full moon illuminating the grounds.',
        graphics: {
          background: { type: 'fill', color: 1 },
          elements: [
            {
              type: 'rectangle',
              x: 80,
              y: 100,
              width: 160,
              height: 80,
              color: 12,
              filled: true,
            }, // Bed
            {
              type: 'circle',
              x: 260,
              y: 60,
              radius: 20,
              color: 15,
              filled: true,
            }, // Moon in window
          ],
        },
        exits: {
          west: { room: 'upper_hallway', blocked: false },
        },
        objects: ['bed', 'vanity', 'jewelry_box'],
        items: ['golden_amulet'],
        npcs: [],
      },
    ],

    items: [
      {
        id: 'rusty_key',
        name: 'rusty key',
        description:
          'An old iron key, covered in rust. It might still work in a lock.',
        weight: 0.1,
        size: 1,
        value: 5,
        canTake: true,
        canWear: false,
        canOpen: ['front_door'],
      },

      {
        id: 'garden_shears',
        name: 'garden shears',
        description: 'Heavy-duty pruning shears. Still sharp despite the rust.',
        weight: 1,
        size: 3,
        value: 10,
        canTake: true,
        canWear: false,
        canCut: ['thorns', 'vines'],
      },

      {
        id: 'glowing_mushroom',
        name: 'glowing mushroom',
        description:
          'This mushroom emits a soft, ethereal light. It might be magical.',
        weight: 0.2,
        size: 1,
        value: 20,
        canTake: true,
        canWear: false,
        isLight: true,
      },

      {
        id: 'ancient_tome',
        name: 'ancient tome',
        description:
          'A leather-bound book filled with arcane knowledge. The text shifts as you read it.',
        weight: 2,
        size: 4,
        value: 50,
        canTake: true,
        canRead: true,
        text: 'The tome speaks of binding spirits and opening paths between worlds. A diagram shows the placement of three artifacts: an amulet, a crystal, and a mushroom.',
      },

      {
        id: 'crystal_key',
        name: 'crystal key',
        description:
          'A key carved from pure crystal. It pulses with inner light.',
        weight: 0.3,
        size: 1,
        value: 100,
        canTake: true,
        canOpen: ['glowing_door'],
      },

      {
        id: 'golden_amulet',
        name: 'golden amulet',
        description:
          'An ornate amulet on a golden chain. Ancient symbols are engraved on its surface.',
        weight: 0.5,
        size: 2,
        value: 200,
        canTake: true,
        canWear: true,
        wearSlot: 'neck',
      },

      {
        id: 'silver_coin',
        name: 'silver coin',
        description:
          'An old silver coin bearing the image of a long-dead noble.',
        weight: 0.05,
        size: 1,
        value: 25,
        canTake: true,
      },

      {
        id: 'magnifying_glass',
        name: 'magnifying glass',
        description:
          'A brass-handled magnifying glass. Perfect for examining small details.',
        weight: 0.3,
        size: 2,
        value: 30,
        canTake: true,
        canUse: true,
      },

      {
        id: 'spell_scroll',
        name: 'spell scroll',
        description: 'A scroll containing a spell of revelation. One use only.',
        weight: 0.1,
        size: 1,
        value: 75,
        canTake: true,
        canRead: true,
        consumable: true,
      },

      {
        id: 'silver_fork',
        name: 'silver fork',
        description: 'A tarnished silver fork from the dining set.',
        weight: 0.2,
        size: 1,
        value: 15,
        canTake: true,
      },

      {
        id: 'cookbook',
        name: 'cookbook',
        description:
          '"Mystical Recipes for the Discerning Sorcerer" - contains some unusual recipes.',
        weight: 1,
        size: 3,
        value: 20,
        canTake: true,
        canRead: true,
      },

      {
        id: 'dried_herbs',
        name: 'dried herbs',
        description: 'A bundle of dried herbs. They smell vaguely magical.',
        weight: 0.1,
        size: 1,
        value: 10,
        canTake: true,
      },
    ],

    objects: [
      {
        id: 'front_door',
        name: 'heavy oak door',
        description:
          'A massive door made of ancient oak, reinforced with iron bands. A brass keyhole gleams in the center.',
        canTake: false,
        canOpen: true,
        isOpen: false,
        isLocked: true,
        requiredKey: 'rusty_key',
        onOpen: {
          message:
            'The rusty key turns with difficulty, and the door creaks open.',
          enableExit: {
            room: 'manor_entrance',
            direction: 'south',
            target: 'manor_foyer',
          },
        },
      },

      {
        id: 'doormat',
        name: 'doormat',
        description:
          "A worn doormat that says 'Welcome' in faded letters. It looks like it hasn't been moved in years.",
        canTake: false,
        canMove: true,
        hiddenUnder: 'brass_key',
      },

      {
        id: 'secret_bookshelf',
        name: 'bookshelf',
        description:
          'This bookshelf seems slightly out of alignment with the others. Some of the books look fake.',
        canTake: false,
        canMove: true,
        isSecret: true,
        onMove: {
          message: 'The bookshelf swings aside, revealing a hidden room!',
          enableExit: {
            room: 'library',
            direction: 'west',
            target: 'secret_room',
          },
        },
      },

      {
        id: 'jewelry_box',
        name: 'jewelry box',
        description:
          'An ornate box with mother-of-pearl inlay. It has a small keyhole.',
        canTake: false,
        isContainer: true,
        isLocked: false,
        capacity: 5,
        contains: ['golden_amulet', 'ruby_ring'],
      },

      {
        id: 'well',
        name: 'well',
        description:
          'A stone well with a wooden bucket on a rope. You can hear water far below.',
        canTake: false,
        canUse: true,
        onUse: {
          message: 'You lower the bucket and draw up fresh water.',
          giveItem: 'water_bucket',
        },
      },
    ],

    npcs: [
      {
        id: 'hermit',
        name: 'Old Hermit',
        description:
          'A wizened old man with a long grey beard and piercing blue eyes. He wears tattered robes covered in mystical symbols.',
        startingRoom: 'hermit_clearing',
        inventory: ['magic_powder', 'healing_potion'],
        initialRelationship: 0,
        trades: true,
        tradeRules: {
          requires: ['glowing_mushroom'],
          offers: ['magic_powder'],
        },
        dialogues: [
          {
            greeting:
              "The hermit eyes you suspiciously. 'What brings you to my forest, stranger?'",
            root: 'intro',
            nodes: {
              intro: {
                text: "I don't get many visitors. Are you seeking the manor's secrets?",
                options: [
                  {
                    id: 'manor',
                    text: 'Tell me about the manor.',
                    response:
                      'Ah, the Blackwood Manor. Once home to a powerful sorcerer. They say his greatest treasure still lies within, but the place is cursed.',
                    nextNode: 'curse',
                  },
                  {
                    id: 'trade',
                    text: 'Do you have anything to trade?',
                    response:
                      "Perhaps... I'm always looking for rare mushrooms from the forest. Bring me a glowing one, and I'll share something useful.",
                    effects: [
                      {
                        type: 'SET_FLAG',
                        flag: 'hermitWantsMushroom',
                        value: true,
                      },
                    ],
                  },
                  {
                    id: 'leave',
                    text: 'I should go.',
                    response:
                      'Be careful in these woods. Not everything is as it seems.',
                    endsConversation: true,
                  },
                ],
              },
              curse: {
                text: 'The sorcerer bound his soul to the manor. Some say he still walks its halls as a ghost.',
                options: [
                  {
                    id: 'ghost',
                    text: 'How can I deal with ghosts?',
                    response:
                      'Ghosts are drawn to objects from their past. Find something meaningful to them, and you might gain their favor.',
                    effects: [
                      {
                        type: 'SET_FLAG',
                        flag: 'knowsAboutGhosts',
                        value: true,
                      },
                    ],
                  },
                  {
                    id: 'back',
                    text: 'Tell me more about the manor.',
                    nextNode: 'intro',
                  },
                ],
              },
            },
          },
        ],
      },

      {
        id: 'ghost_butler',
        name: 'Ghostly Butler',
        description:
          'A translucent figure in formal attire. Despite being a ghost, he maintains an air of dignity and propriety.',
        startingRoom: 'dining_room',
        isGhost: true,
        initialRelationship: -20,
        dialogues: [
          {
            condition: { type: 'hasItem', item: 'silver_fork' },
            greeting:
              "The ghost's eyes light up. 'Is that... silverware from the master's collection?'",
            root: 'has_fork',
            nodes: {
              has_fork: {
                text: "I haven't seen a properly set table in decades. Would you return that fork to its rightful place?",
                options: [
                  {
                    id: 'give_fork',
                    text: 'Here, take the fork.',
                    response:
                      "Wonderful! The master would be pleased. Let me repay your kindness. The stairs are safe now - I've stabilized them with my spectral energy.",
                    effects: [
                      { type: 'TAKE_ITEM', item: 'silver_fork' },
                      { type: 'CHANGE_RELATIONSHIP', amount: 50 },
                      {
                        type: 'ENABLE_EXIT',
                        room: 'manor_foyer',
                        direction: 'up',
                        state: 'open',
                      },
                    ],
                    endsConversation: true,
                  },
                  {
                    id: 'keep_fork',
                    text: "I think I'll keep it.",
                    response:
                      'How disappointing. The younger generation has no respect for tradition.',
                    effects: [{ type: 'CHANGE_RELATIONSHIP', amount: -10 }],
                    endsConversation: true,
                  },
                ],
              },
            },
          },
          {
            greeting:
              "A ghostly butler materializes before you. 'The dining room is not ready for guests,' he says stiffly.",
            root: 'default',
            nodes: {
              default: {
                text: 'This manor has fallen into such disrepair. In my day, everything was pristine.',
                options: [
                  {
                    id: 'manor',
                    text: 'What happened to the manor?',
                    response:
                      'The master conducted his final experiment in the upper chambers. After that night, we all... changed. I remain to serve, even in death.',
                  },
                  {
                    id: 'help',
                    text: 'Can I help somehow?',
                    response:
                      'If you could find any of the silverware and return it to its proper place, I would be grateful. I do miss the old elegance.',
                    effects: [
                      {
                        type: 'SET_FLAG',
                        flag: 'butlerWantsSilverware',
                        value: true,
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },

      {
        id: 'forest_spirit',
        name: 'Forest Spirit',
        description:
          'A wispy, ethereal being that seems to be made of mist and moonlight. It flickers in and out of visibility.',
        startingRoom: 'dark_forest',
        isSpirit: true,
        initialRelationship: 0,
        dialogues: [
          {
            greeting:
              "A whispering voice fills your mind: 'Mortal... why do you disturb our woods?'",
            root: 'intro',
            nodes: {
              intro: {
                text: "The forest remembers all who pass through. You seek the manor's treasure, but are you worthy?",
                options: [
                  {
                    id: 'worthy',
                    text: 'How can I prove myself worthy?',
                    response:
                      'Three artifacts of power must be united: the golden amulet of the master, the crystal key of binding, and the glowing essence of the forest itself.',
                    effects: [
                      {
                        type: 'SET_FLAG',
                        flag: 'knowsAboutArtifacts',
                        value: true,
                      },
                    ],
                  },
                  {
                    id: 'spirit',
                    text: 'What are you?',
                    response:
                      "I am what remains of the forest's magic, bound here by the sorcerer's spells. I cannot leave, but I can guide those who respect nature.",
                  },
                ],
              },
            },
          },
        ],
      },
    ],

    puzzles: [
      {
        id: 'manor_entrance_puzzle',
        name: 'Opening the Manor',
        description: 'The front door of the manor needs to be unlocked',
        trigger: { verb: 'use', item: 'rusty_key', target: 'front_door' },
        solution: { item: 'rusty_key', target: 'front_door' },
        reward: {
          type: 'ENABLE_EXIT',
          room: 'manor_entrance',
          direction: 'south',
          target: 'manor_foyer',
        },
        hints: [
          'The door needs a key. Have you searched the grounds?',
          'Try looking in places where someone might hide a spare key.',
          'The garden shed might have useful tools or keys.',
        ],
        points: 25,
        successMessage:
          'The rusty key turns in the lock with a satisfying click. The manor is now open!',
      },

      {
        id: 'three_artifacts_puzzle',
        name: "The Sorcerer's Ritual",
        description:
          "Unite three artifacts to unlock the manor's greatest secret",
        multiStep: true,
        steps: [
          {
            trigger: { verb: 'put', item: 'golden_amulet', target: 'pedestal' },
            solution: { item: 'golden_amulet', target: 'pedestal' },
            successMessage:
              'The amulet begins to glow as you place it on the pedestal.',
            hint: 'The amulet belongs on the pedestal in the secret room.',
          },
          {
            trigger: { verb: 'put', item: 'crystal_key', target: 'pedestal' },
            solution: { item: 'crystal_key', target: 'pedestal' },
            successMessage:
              "The crystal key resonates with the amulet's energy.",
            hint: 'Add the crystal key to the pedestal.',
          },
          {
            trigger: {
              verb: 'put',
              item: 'glowing_mushroom',
              target: 'pedestal',
            },
            solution: { item: 'glowing_mushroom', target: 'pedestal' },
            successMessage:
              'As you add the mushroom, all three artifacts merge in a blinding flash of light!',
            hint: "The forest's essence completes the trinity.",
          },
        ],
        reward: {
          type: 'GIVE_ITEM',
          item: 'orb_of_mastery',
        },
        completionFlag: 'ritualComplete',
        points: 100,
        successMessage:
          "The artifacts merge into the Orb of Mastery! You have unlocked the sorcerer's greatest treasure!",
      },

      {
        id: 'secret_room_puzzle',
        name: 'Finding the Secret Room',
        description: 'Discover the hidden study behind the bookshelf',
        trigger: { verb: 'move', target: 'bookshelf' },
        conditions: [{ type: 'hasItem', item: 'magnifying_glass' }],
        solution: { verb: 'move', target: 'bookshelf' },
        reward: {
          type: 'ENABLE_EXIT',
          room: 'library',
          direction: 'west',
          target: 'secret_room',
        },
        hints: [
          'One of the bookshelves seems different from the others.',
          'You might need a tool to examine things more closely.',
          'The magnifying glass could reveal hidden details.',
        ],
        points: 50,
      },
    ],

    events: [
      {
        id: 'game_start',
        triggers: [{ type: 'GAME_START' }],
        actions: [
          {
            type: 'SHOW_MESSAGE',
            message:
              "Welcome to the Enchanted Manor! Type 'help' for commands.",
          },
          { type: 'PLAY_SOUND', sound: 'mysterious_theme' },
        ],
      },

      {
        id: 'enter_manor',
        triggers: [{ type: 'ENTER_ROOM', room: 'manor_foyer' }],
        oneTime: true,
        actions: [
          {
            type: 'SHOW_MESSAGE',
            message: 'As you step inside, the door slams shut behind you!',
          },
          { type: 'PLAY_SOUND', sound: 'door_slam' },
          { type: 'UPDATE_SCORE', amount: 10 },
        ],
      },

      {
        id: 'find_secret_room',
        triggers: [{ type: 'ENTER_ROOM', room: 'secret_room' }],
        oneTime: true,
        actions: [
          {
            type: 'SHOW_MESSAGE',
            message: "You've discovered the sorcerer's secret study!",
          },
          { type: 'UPDATE_SCORE', amount: 25 },
          { type: 'SET_FLAG', flag: 'foundSecretRoom', value: true },
        ],
      },
    ],

    achievements: [
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Visit every room in the manor',
        condition: { type: 'ROOMS_VISITED', count: 11 },
        points: 50,
      },
      {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Collect at least 10 items',
        condition: { type: 'ITEMS_COLLECTED', count: 10 },
        points: 25,
      },
      {
        id: 'ghost_whisperer',
        name: 'Ghost Whisperer',
        description: 'Successfully help the ghost butler',
        condition: { type: 'hasFlag', flag: 'helpedButler' },
        points: 30,
      },
      {
        id: 'master_sorcerer',
        name: 'Master Sorcerer',
        description: 'Complete the three artifacts ritual',
        condition: { type: 'hasFlag', flag: 'ritualComplete' },
        points: 100,
      },
    ],

    endings: [
      {
        id: 'true_ending',
        name: 'Master of the Manor',
        condition: {
          type: 'AND',
          conditions: [
            { type: 'hasItem', item: 'orb_of_mastery' },
            { type: 'scoreGreaterThan', value: 200 },
          ],
        },
        message:
          "With the Orb of Mastery in hand, you have inherited the sorcerer's power and become the new master of the Enchanted Manor. The spirits bow to your will, and untold magical secrets are now yours to command!",
        achievement: 'true_master',
      },
      {
        id: 'good_ending',
        name: 'Successful Explorer',
        condition: { type: 'scoreGreaterThan', value: 150 },
        message:
          "You've uncovered many of the manor's secrets and earned the respect of its ghostly inhabitants. While the greatest treasure eludes you, you leave with valuable knowledge and experience.",
        achievement: 'successful_explorer',
      },
      {
        id: 'neutral_ending',
        name: 'Manor Survivor',
        condition: { type: 'hasFlag', flag: 'triedToLeave' },
        message:
          "You decide the manor's mysteries are too dangerous to pursue further. You leave with your life intact, but can't help wondering what treasures you left behind.",
        achievement: 'cautious_survivor',
      },
    ],

    music: {
      themes: {
        mysterious: {
          tempo: 80,
          key: 'Am',
          mood: 'mysterious',
          instruments: ['strings', 'flute', 'harp'],
        },
        danger: {
          tempo: 120,
          key: 'Dm',
          mood: 'tense',
          instruments: ['brass', 'percussion', 'strings'],
        },
        discovery: {
          tempo: 100,
          key: 'C',
          mood: 'wonderous',
          instruments: ['bells', 'strings', 'choir'],
        },
      },
      roomThemes: {
        manor_entrance: 'mysterious',
        dark_forest: 'danger',
        secret_room: 'discovery',
      },
    },
  };
}
