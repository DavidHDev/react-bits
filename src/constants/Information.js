/**
 * @typedef {'Animations' | 'Backgrounds' | 'Components' | 'TextAnimations' | 'Micro'} Category
 */
/**
 * The supported code/component variants for the registry system.
 *
 * @type {readonly ['JS-CSS', 'JS-TW', 'TS-CSS', 'TS-TW']}
 */
export const VARIANTS = ['JS-CSS', 'JS-TW', 'TS-CSS', 'TS-TW'];

/**
 * @typedef {'JS-CSS' | 'JS-TW' | 'TS-CSS' | 'TS-TW'} Variant
 */

/**
 * Type for all component metadata, including enforcement of the Category field.
 *
 * @typedef {Object} ComponentMetadata
 * @property {string} videoUrl
 * @property {string} description
 * @property {Category} category
 * @property {string} name
 * @property {string} docsUrl
 * @property {string[]} tags
 * @property {string} added
 * @property {{ date: string, note: string }[]} [updates]
 * @property {Variant[]} [variants]
 * @property {Record<string, any>} [meta]
 */

/**
 * @type {Record<string, ComponentMetadata>}
 */
export const componentMetadata = {

  //! Animations -------------------------------------------------------------------------------------------------------------------------------

  'Animations/AnimatedContent': {
    videoUrl: '/assets/video/animatedcontent.webm',
    description: 'Wrapper that animates its children in on scroll or mount, from any direction.',
    category: 'Animations',
    name: 'AnimatedContent',
    docsUrl: 'https://reactbits.dev/animations/animated-content',
    tags: [],
    added: '2025-01-05'
  },
  'Animations/BlobCursor': {
    videoUrl: '/assets/video/blobcursor.webm',
    description: 'Liquid metal blob cursor that stretches, sloshes and bursts into droplets, in chrome, jelly, pearl or ink.',
    category: 'Animations',
    name: 'BlobCursor',
    docsUrl: 'https://reactbits.dev/animations/blob-cursor',
    tags: [],
    added: '2024-08-06',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt as a smooth 3D liquid that stretches as it moves, with new looks, drips and a splashy click burst.'
      }
    ]
  },
  'Animations/ClickSpark': {
    videoUrl: '/assets/video/clickspark.webm',
    description: 'Creates particle spark bursts at click position.',
    category: 'Animations',
    name: 'ClickSpark',
    docsUrl: 'https://reactbits.dev/animations/click-spark',
    tags: [],
    added: '2025-01-16'
  },
  'Animations/Crosshair': {
    videoUrl: '/assets/video/crosshair.webm',
    description: 'Crosshair cursor with live coordinates that locks onto links and buttons and measures them.',
    category: 'Animations',
    name: 'Crosshair',
    docsUrl: 'https://reactbits.dev/animations/crosshair',
    tags: [],
    added: '2024-08-12',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt from scratch. It frames what you hover with measuring brackets, with new line styles and a click pulse.'
      }
    ]
  },
  'Animations/Cubes': {
    videoUrl: '/assets/video/cubes.webm',
    description: 'A grid of outlined 3D cubes that turn to face the cursor, spin when swept and ripple on click.',
    category: 'Animations',
    name: 'Cubes',
    docsUrl: 'https://reactbits.dev/animations/cubes',
    tags: [],
    added: '2025-06-17',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with springy cubes that face the cursor, spin when you sweep past and ripple on click, plus new edge styles, shading and depth.'
      }
    ]
  },
  'Animations/ElectricBorder': {
    videoUrl: '/assets/video/electricborder.webm',
    description: 'Jittery electric energy border with animated arcs, glow and adjustable intensity.',
    category: 'Animations',
    name: 'ElectricBorder',
    docsUrl: 'https://reactbits.dev/animations/electric-border',
    tags: [],
    added: '2025-08-21'
  },
  'Animations/FadeContent': {
    videoUrl: '/assets/video/fadecontent.webm',
    description: 'Simple directional fade / slide entrance / exit wrapper with threshold-based activation.',
    category: 'Animations',
    name: 'FadeContent',
    docsUrl: 'https://reactbits.dev/animations/fade-content',
    tags: [],
    added: '2024-08-07'
  },
  'Animations/GlareHover': {
    videoUrl: '/assets/video/glarehover.webm',
    description: 'A glossy light streak that sweeps across any element in the direction the cursor moves.',
    category: 'Animations',
    name: 'GlareHover',
    docsUrl: 'https://reactbits.dev/animations/glare-hover',
    tags: [],
    added: '2025-05-30',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with a more realistic glare that follows the cursor direction, a glinting edge and new shapes and modes.'
      }
    ]
  },
  'Animations/GradualBlur': {
    videoUrl: '/assets/video/gradualblur.webm',
    description: 'Progressively un-blurs content based on scroll or trigger creating a cinematic reveal.',
    category: 'Animations',
    name: 'GradualBlur',
    docsUrl: 'https://reactbits.dev/animations/gradual-blur',
    tags: [],
    added: '2025-08-26'
  },
  'Animations/CrystalizedBall': {
    videoUrl: '/assets/video/crystalizedball.webm',
    description: 'A glass ball with a crackling electric rim and glowing dust that swirls with the cursor.',
    category: 'Animations',
    name: 'CrystalizedBall',
    docsUrl: 'https://reactbits.dev/animations/crystalized-ball',
    tags: ['webgl', 'ogl', 'orb', 'electric', 'particles', 'glow', 'interactive'],
    added: '2026-10-06'
  },
  'Animations/ElectricLogo': {
    videoUrl: '/assets/video/electriclogo.webm',
    description: 'Turns any logo into a living lightning outline, with arcs that leap off its edges.',
    category: 'Animations',
    name: 'ElectricLogo',
    docsUrl: 'https://reactbits.dev/animations/electric-logo',
    tags: [],
    added: '2026-09-25',
    updates: [{ date: '2026-09-28', note: 'Added an onRender callback for capturing live frames and reflection effects.' }]
  },
  'Animations/DitherVeil': {
    videoUrl: '/assets/video/ditherveil.webm',
    description: 'A 1-bit dithered photo the cursor burns through to full colour, knitting back cell by cell.',
    category: 'Animations',
    name: 'DitherVeil',
    docsUrl: 'https://reactbits.dev/animations/dither-veil',
    tags: [],
    added: '2026-09-23'
  },
  'Animations/GlowCursor': {
    videoUrl: '/assets/video/glowcursor.webm',
    description: 'Light that pours from the cursor, drifts softly through the air and cools as it fades.',
    category: 'Animations',
    name: 'GlowCursor',
    docsUrl: 'https://reactbits.dev/animations/glow-cursor',
    tags: [],
    added: '2026-08-26',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt as light that pours from the cursor and drifts softly as it fades, with a burst on click and a light mode.'
      }
    ]
  },
  'Animations/GhostCursor': {
    videoUrl: '/assets/video/ghostcursor.webm',
    description: 'Semi-transparent ghost cursor that smoothly follows the real cursor with a trailing effect.',
    category: 'Animations',
    name: 'GhostCursor',
    docsUrl: 'https://reactbits.dev/animations/ghost-cursor',
    tags: [],
    added: '2025-10-27'
  },
  'Animations/ImageTrail': {
    videoUrl: '/assets/video/imagetrail.webm',
    description: 'Cursor-based image trail with several built-in variants.',
    category: 'Animations',
    name: 'ImageTrail',
    docsUrl: 'https://reactbits.dev/animations/image-trail',
    tags: [],
    added: '2025-01-30'
  },
  'Animations/LogoLoop': {
    videoUrl: '/assets/video/logoloop.webm',
    description: 'Continuously looping marquee of brand or tech logos with seamless repeat and hover pause.',
    category: 'Animations',
    name: 'LogoLoop',
    docsUrl: 'https://reactbits.dev/animations/logo-loop',
    tags: [],
    added: '2025-08-18'
  },
  'Animations/Magnet': {
    videoUrl: '/assets/video/magnet.webm',
    description: 'Elements magnetically ease toward the cursor then settle back with spring physics.',
    category: 'Animations',
    name: 'Magnet',
    docsUrl: 'https://reactbits.dev/animations/magnet',
    tags: [],
    added: '2024-08-08'
  },
  'Animations/MagnetLines': {
    videoUrl: '/assets/video/magnetlines.webm',
    description: 'Animated field lines bend toward the cursor.',
    category: 'Animations',
    name: 'MagnetLines',
    docsUrl: 'https://reactbits.dev/animations/magnet-lines',
    tags: [],
    added: '2025-01-03'
  },
  'Animations/MetaBalls': {
    videoUrl: '/assets/video/metaballs.webm',
    description: 'Liquid metaballs that merge, stretch and pinch apart, with a cursor blob that pushes through them.',
    category: 'Animations',
    name: 'MetaBalls',
    docsUrl: 'https://reactbits.dev/animations/meta-balls',
    tags: [],
    added: '2025-02-12',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt without dependencies. Blobs now cling, stretch and wobble as they merge, the cursor pushes through them, clicks splash them apart, and there are new outline, contour and lava lamp styles.'
      }
    ]
  },
  'Animations/Strands': {
    videoUrl: '/assets/video/strands.webm',
    description: 'Glowing ribbon-like strands that ripple and weave across a transparent canvas.',
    category: 'Animations',
    name: 'Strands',
    docsUrl: 'https://reactbits.dev/animations/strands',
    tags: [],
    added: '2026-06-10'
  },
  'Animations/MetallicPaint': {
    videoUrl: '/assets/video/metallicpaint.webm',
    description: "Liquid chrome that flows over your logo or text, adapted from Paper's Liquid Metal shader.",
    category: 'Animations',
    name: 'MetallicPaint',
    docsUrl: 'https://reactbits.dev/animations/metallic-paint',
    tags: [],
    added: '2025-02-22',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt as liquid metal with reflections that bend around the edges. It now paints text as well as logos, tilts with the cursor and pours in on load.'
      }
    ]
  },
  'Animations/Noise': {
    videoUrl: '/assets/video/noise.webm',
    description: 'Film grain overlay for photos and pages, from fine 35mm grain to dust, paper and TV static.',
    category: 'Animations',
    name: 'Noise',
    docsUrl: 'https://reactbits.dev/animations/noise',
    tags: [],
    added: '2025-01-06',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt to be much lighter, with film dust, scratches, scanlines and flicker for a real film look.'
      }
    ]
  },
  'Animations/PixelTrail': {
    videoUrl: '/assets/video/pixeltrail.webm',
    description: 'Glossy pixels melt into a fluid goo trail behind the cursor, with color shifts and drips.',
    category: 'Animations',
    name: 'PixelTrail',
    docsUrl: 'https://reactbits.dev/animations/pixel-trail',
    tags: [],
    added: '2025-02-01',
    updates: [
      {
        date: '2026-10-10',
        note: 'The same fluid trail, now crisp and glossy, with visible pixels, depth and glow. New options add color shifts, drips, sparkle, click bursts, dither and image reveals.'
      }
    ]
  },
  'Animations/PixelTransition': {
    videoUrl: '/assets/video/pixeltransition.webm',
    description: 'Retro pixel dissolve that covers a card in solid pixels, swaps the content underneath and clears again.',
    category: 'Animations',
    name: 'PixelTransition',
    docsUrl: 'https://reactbits.dev/animations/pixel-transition',
    tags: [],
    added: '2025-01-21',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt to stay smooth on quick hovers, with new reveal patterns, pixel shapes and a choppy retro mode.'
      }
    ]
  },
  'Animations/PixelSwap': {
    videoUrl: '/assets/video/pixelswap.webm',
    description: 'Pixel fragments assemble into a cover, swap the content underneath, then dissolve away.',
    category: 'Animations',
    name: 'PixelSwap',
    docsUrl: 'https://reactbits.dev/animations/pixel-swap',
    tags: [],
    added: '2026-08-12'
  },
  'Animations/Ribbons': {
    videoUrl: '/assets/video/ribbons.webm',
    description: 'Springy ribbons that trail the cursor, in lens, comet or even shapes with an optional wave.',
    category: 'Animations',
    name: 'Ribbons',
    docsUrl: 'https://reactbits.dev/animations/ribbons',
    tags: [],
    added: '2025-02-09',
    updates: [
      {
        date: '2026-10-10',
        note: 'Smoother, crisper ribbons that move the same at any frame rate. New shapes, a rolling wave, soft edges and more control over how they follow the cursor.'
      }
    ]
  },
  'Animations/ShapeBlur': {
    videoUrl: '/assets/video/shapeblur.webm',
    description: 'A crisp logo or shape that drifts out of focus under the pointer like a camera lens.',
    category: 'Animations',
    name: 'ShapeBlur',
    docsUrl: 'https://reactbits.dev/animations/shape-blur',
    tags: [],
    added: '2025-01-26',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt as a real lens blur that follows the cursor. Use any SVG or PNG as the shape, or switch to focus mode.'
      }
    ]
  },
  'Animations/SplashCursor': {
    videoUrl: '/assets/video/splashcursor.webm',
    description: 'Liquid splash burst at cursor with curling ripples and waves.',
    category: 'Animations',
    name: 'SplashCursor',
    docsUrl: 'https://reactbits.dev/animations/splash-cursor',
    tags: [],
    added: '2025-01-03'
  },
  'Animations/StarBorder': {
    videoUrl: '/assets/video/starborder.webm',
    description:
      'A twinkling star that travels the exact outline of any button, pill or card, trailing light and stardust.',
    category: 'Animations',
    name: 'StarBorder',
    docsUrl: 'https://reactbits.dev/animations/star-border',
    tags: [],
    added: '2024-08-18',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt from scratch. The star glides evenly around any shape with a soft trail, hover laps and a click pulse.'
      }
    ]
  },
  'Animations/StickerPeel': {
    videoUrl: '/assets/video/stickerpeel.webm',
    description: 'Sticker corner lift + peel interaction using 3D transform and shadow depth.',
    category: 'Animations',
    name: 'StickerPeel',
    docsUrl: 'https://reactbits.dev/animations/sticker-peel',
    tags: [],
    added: '2025-07-21'
  },
  'Animations/TargetCursor': {
    videoUrl: '/assets/video/targetcursor.webm',
    description: 'A reticle cursor whose corner brackets snap around targets, matching their shape.',
    category: 'Animations',
    name: 'TargetCursor',
    docsUrl: 'https://reactbits.dev/animations/target-cursor',
    tags: [],
    added: '2025-07-18',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt without dependencies. The brackets now follow rounded corners, react to clicks, show labels and can stay inside one area.'
      }
    ]
  },
  'Animations/LaserFlow': {
    videoUrl: '/assets/video/laserflow.webm',
    description: 'A beam of light that splashes onto your content and pours over its corners.',
    category: 'Animations',
    name: 'LaserFlow',
    docsUrl: 'https://reactbits.dev/animations/laser-flow',
    tags: [],
    added: '2025-09-09',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt as a waterfall of light that lands on your content, pours over its corners and can reveal your UI around the cursor.'
      }
    ]
  },
  'Animations/Antigravity': {
    videoUrl: '/assets/video/antigravity.webm',
    description: '3D antigravity particle field that repels from the cursor with smooth motion.',
    category: 'Animations',
    name: 'Antigravity',
    docsUrl: 'https://reactbits.dev/animations/antigravity',
    tags: [],
    added: '2025-12-08'
  },
  'Animations/OrbitImages': {
    videoUrl: '/assets/video/orbitimages.webm',
    description: 'SVG Path customizable orbiting images effect',
    category: 'Animations',
    name: 'OrbitImages',
    docsUrl: 'https://reactbits.dev/animations/orbit-images',
    tags: [],
    added: '2026-02-12'
  },
  'Animations/MagicRings': {
    videoUrl: '/assets/video/magicrings.webm',
    description: 'Interactive magic rings effect with customizable parameters.',
    category: 'Animations',
    name: 'MagicRings',
    docsUrl: 'https://reactbits.dev/animations/magic-rings',
    tags: [],
    added: '2026-03-11'
  },

  //! Text Animations -------------------------------------------------------------------------------------------------------------------------------

  'TextAnimations/AsciiText': {
    videoUrl: '/assets/video/asciitext.webm',
    description: 'Waving ASCII text that tilts toward the pointer, scrambles on hover and ripples on click.',
    category: 'TextAnimations',
    name: 'ASCIIText',
    docsUrl: 'https://reactbits.dev/text-animations/ascii-text',
    tags: [],
    added: '2025-01-20',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt so the layers never slip apart on load, with a scramble on hover, click ripples and custom characters.'
      }
    ]
  },
  'TextAnimations/BlurText': {
    videoUrl: '/assets/video/blurtext.webm',
    description: 'Text starts blurred then crisply resolves for a soft-focus reveal effect.',
    category: 'TextAnimations',
    name: 'BlurText',
    docsUrl: 'https://reactbits.dev/text-animations/blur-text',
    tags: [],
    added: '2024-08-06'
  },
  'TextAnimations/CircularText': {
    videoUrl: '/assets/video/circulartext.webm',
    description: 'Layouts characters around a circle with optional rotation animation.',
    category: 'TextAnimations',
    name: 'CircularText',
    docsUrl: 'https://reactbits.dev/text-animations/circular-text',
    tags: [],
    added: '2025-02-14'
  },
  'TextAnimations/CountUp': {
    videoUrl: '/assets/video/countup.webm',
    description: 'Animated number counter supporting formatting and decimals.',
    category: 'TextAnimations',
    name: 'CountUp',
    docsUrl: 'https://reactbits.dev/text-animations/count-up',
    tags: [],
    added: '2024-08-13'
  },
  'TextAnimations/CurvedLoop': {
    videoUrl: '/assets/video/curvedloop.webm',
    description: 'Flowing looping text path along a customizable curve with drag interaction.',
    category: 'TextAnimations',
    name: 'CurvedLoop',
    docsUrl: 'https://reactbits.dev/text-animations/curved-loop',
    tags: [],
    added: '2025-07-06'
  },
  'TextAnimations/DecryptedText': {
    videoUrl: '/assets/video/decryptedtext.webm',
    description: 'Hacker-style decryption cycling random glyphs until resolving to real text.',
    category: 'TextAnimations',
    name: 'DecryptedText',
    docsUrl: 'https://reactbits.dev/text-animations/decrypted-text',
    tags: [],
    added: '2025-01-06'
  },
  'TextAnimations/FallingText': {
    videoUrl: '/assets/video/fallingtext.webm',
    description: 'Characters fall with gravity + bounce creating a playful entrance.',
    category: 'TextAnimations',
    name: 'FallingText',
    docsUrl: 'https://reactbits.dev/text-animations/falling-text',
    tags: [],
    added: '2025-01-22'
  },
  'TextAnimations/FuzzyText': {
    videoUrl: '/assets/video/fuzzytext.webm',
    description: 'Vibrating fuzzy text with controllable hover intensity.',
    category: 'TextAnimations',
    name: 'FuzzyText',
    docsUrl: 'https://reactbits.dev/text-animations/fuzzy-text',
    tags: [],
    added: '2025-02-18'
  },
  'TextAnimations/GlitchText': {
    videoUrl: '/assets/video/glitchtext.webm',
    description: 'RGB split and distortion glitch effect with jitter effects.',
    category: 'TextAnimations',
    name: 'GlitchText',
    docsUrl: 'https://reactbits.dev/text-animations/glitch-text',
    tags: [],
    added: '2025-02-18'
  },
  'TextAnimations/GradientText': {
    videoUrl: '/assets/video/gradienttext.webm',
    description: 'Living gradients inside your text: a sliding sweep, a drifting mesh or a swinging conic fan.',
    category: 'TextAnimations',
    name: 'GradientText',
    docsUrl: 'https://reactbits.dev/text-animations/gradient-text',
    tags: [],
    added: '2024-08-12',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with new flow and conic styles, a soft glow and colors that drift toward the cursor.'
      }
    ]
  },
  'TextAnimations/RotatingText': {
    videoUrl: '/assets/video/rotatingtext.webm',
    description: 'Cycles through multiple phrases with 3D rotate / flip transitions.',
    category: 'TextAnimations',
    name: 'RotatingText',
    docsUrl: 'https://reactbits.dev/text-animations/rotating-text',
    tags: [],
    added: '2025-02-02'
  },
  'TextAnimations/ScrambledText': {
    videoUrl: '/assets/video/scrambledtext.webm',
    description: 'Detects cursor position and applies a distortion effect to text.',
    category: 'TextAnimations',
    name: 'ScrambledText',
    docsUrl: 'https://reactbits.dev/text-animations/scrambled-text',
    tags: [],
    added: '2025-05-23'
  },
  'TextAnimations/ScrollFloat': {
    videoUrl: '/assets/video/scrollfloat.webm',
    description: 'Text gently floats / parallax shifts on scroll.',
    category: 'TextAnimations',
    name: 'ScrollFloat',
    docsUrl: 'https://reactbits.dev/text-animations/scroll-float',
    tags: [],
    added: '2025-02-17'
  },
  'TextAnimations/ScrollReveal': {
    videoUrl: '/assets/video/scrollreveal.webm',
    description: 'Text gently unblurs and reveals on scroll.',
    category: 'TextAnimations',
    name: 'ScrollReveal',
    docsUrl: 'https://reactbits.dev/text-animations/scroll-reveal',
    tags: [],
    added: '2025-02-17'
  },
  'TextAnimations/ScrollVelocity': {
    videoUrl: '/assets/video/scrollvelocity.webm',
    description: "Text marquee animatio - speed and distortion scale with user's scroll velocity.",
    category: 'TextAnimations',
    name: 'ScrollVelocity',
    docsUrl: 'https://reactbits.dev/text-animations/scroll-velocity',
    tags: [],
    added: '2025-02-14'
  },
  'TextAnimations/ShinyText': {
    videoUrl: '/assets/video/shinytext.webm',
    description: 'A sheen of light that sweeps across text, from soft bands to chrome-like reflections.',
    category: 'TextAnimations',
    name: 'ShinyText',
    docsUrl: 'https://reactbits.dev/text-animations/shiny-text',
    tags: [],
    added: '2024-08-12',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with more control over the shine, a travelling glow and new ways to play it, like on hover or scroll.'
      }
    ]
  },
  'TextAnimations/SplitText': {
    videoUrl: '/assets/video/splittext.webm',
    description: 'Splits text into characters / words for staggered entrance animation.',
    category: 'TextAnimations',
    name: 'SplitText',
    docsUrl: 'https://reactbits.dev/text-animations/split-text',
    tags: [],
    added: '2024-08-06'
  },
  'TextAnimations/TextCursor': {
    videoUrl: '/assets/video/textcursor.webm',
    description: 'Text or emoji that trails your cursor as stamped copies, a following chain or a ribbon of letters.',
    category: 'TextAnimations',
    name: 'TextCursor',
    docsUrl: 'https://reactbits.dev/text-animations/text-cursor',
    tags: [],
    added: '2025-03-18',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with a smoother trail that pops in, tapers and pulls back when you stop, plus chain and ribbon modes.'
      }
    ]
  },
  'TextAnimations/TextPressure': {
    videoUrl: '/assets/video/textpressure.webm',
    description: 'Characters scale / warp interactively based on pointer pressure zone.',
    category: 'TextAnimations',
    name: 'TextPressure',
    docsUrl: 'https://reactbits.dev/text-animations/text-pressure',
    tags: [],
    added: '2025-01-17'
  },
  'TextAnimations/TextType': {
    videoUrl: '/assets/video/texttype.webm',
    description: 'Typewriter effect with blinking cursor and adjustable typing cadence.',
    category: 'TextAnimations',
    name: 'TextType',
    docsUrl: 'https://reactbits.dev/text-animations/text-type',
    tags: [],
    added: '2025-07-20'
  },
  'TextAnimations/TrueFocus': {
    videoUrl: '/assets/video/truefocus.webm',
    description: 'Applies dynamic blur / clarity based over a series of words in order.',
    category: 'TextAnimations',
    name: 'TrueFocus',
    docsUrl: 'https://reactbits.dev/text-animations/true-focus',
    tags: [],
    added: '2025-01-07'
  },
  'TextAnimations/VariableProximity': {
    videoUrl: '/assets/video/variableproximity.webm',
    description: 'Letter styling changes continuously with pointer distance mapping.',
    category: 'TextAnimations',
    name: 'VariableProximity',
    docsUrl: 'https://reactbits.dev/text-animations/variable-proximity',
    tags: [],
    added: '2025-01-07'
  },
  'TextAnimations/Shuffle': {
    videoUrl: '/assets/video/shuffle.webm',
    description: 'Animated text reveal where characters shuffle before settling.',
    category: 'TextAnimations',
    name: 'Shuffle',
    docsUrl: 'https://reactbits.dev/text-animations/shuffle',
    tags: [],
    added: '2025-09-06'
  },
  'TextAnimations/ParticleText': {
    videoUrl: '/assets/video/particletext.webm',
    description: 'Text assembles from drifting particles that scatter and reform on demand.',
    category: 'TextAnimations',
    name: 'ParticleText',
    docsUrl: 'https://reactbits.dev/text-animations/particle-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/SplitFlapText': {
    videoUrl: '/assets/video/splitflaptext.webm',
    description: 'Mechanical split-flap departure board that clacks through to each new phrase.',
    category: 'TextAnimations',
    name: 'SplitFlapText',
    docsUrl: 'https://reactbits.dev/text-animations/split-flap-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/WarpText': {
    videoUrl: '/assets/video/warptext.webm',
    description: 'WebGL warp that bends and refracts the text around the pointer.',
    category: 'TextAnimations',
    name: 'WarpText',
    docsUrl: 'https://reactbits.dev/text-animations/warp-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/TechText': {
    videoUrl: '/assets/video/techtext.webm',
    description: 'A wordmark whose letters turn into dashed vector paths under the cursor.',
    category: 'TextAnimations',
    name: 'TechText',
    docsUrl: 'https://reactbits.dev/text-animations/tech-text',
    tags: [],
    added: '2026-09-24'
  },
  'TextAnimations/StrokeText': {
    videoUrl: '/assets/video/stroketext.webm',
    description: 'Outlined letterforms draw themselves on, then flood with fill.',
    category: 'TextAnimations',
    name: 'StrokeText',
    docsUrl: 'https://reactbits.dev/text-animations/stroke-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/DepthText': {
    videoUrl: '/assets/video/depthtext.webm',
    description: 'Layered extruded type with parallax that shifts against the pointer.',
    category: 'TextAnimations',
    name: 'DepthText',
    docsUrl: 'https://reactbits.dev/text-animations/depth-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/FoldText': {
    videoUrl: '/assets/video/foldtext.webm',
    description: 'Lines unfold into place like creased paper opening flat.',
    category: 'TextAnimations',
    name: 'FoldText',
    docsUrl: 'https://reactbits.dev/text-animations/fold-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/EchoText': {
    videoUrl: '/assets/video/echotext.webm',
    description: 'Ghosted copies trail behind the text and settle into a single word.',
    category: 'TextAnimations',
    name: 'EchoText',
    docsUrl: 'https://reactbits.dev/text-animations/echo-text',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/MaskedHeading': {
    videoUrl: '/assets/video/maskedheading.webm',
    description: 'A headline with a drifting colour mesh or image showing through, revealed word by word.',
    category: 'TextAnimations',
    name: 'MaskedHeading',
    docsUrl: 'https://reactbits.dev/text-animations/masked-heading',
    tags: [],
    added: '2026-08-04'
  },
  'TextAnimations/TextLoop': {
    videoUrl: '/assets/video/textloop.webm',
    description: 'A seamless text marquee that flows along curved SVG paths.',
    category: 'TextAnimations',
    name: 'TextLoop',
    docsUrl: 'https://reactbits.dev/text-animations/text-loop',
    tags: [],
    added: '2026-08-04'
  },

  //! Components -------------------------------------------------------------------------------------------------------------------------------
  'Components/AnimatedList': {
    videoUrl: '/assets/video/animatedlist.webm',
    description: 'A scrolling list whose rows spring into view, with a gliding selection and arrow keys.',
    category: 'Components',
    name: 'AnimatedList',
    docsUrl: 'https://reactbits.dev/components/animated-list',
    tags: [],
    added: '2025-02-23',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt so rows spring in from the edge they scroll in from and the selection glides between them. Rows can now show icons, images and labels, in both themes.'
      }
    ]
  },
  'Components/BounceCards': {
    videoUrl: '/assets/video/bouncecards.webm',
    description: 'A fan of photo cards that bounce in, then spread apart and straighten the one you hover.',
    category: 'Components',
    name: 'BounceCards',
    docsUrl: 'https://reactbits.dev/components/bounce-cards',
    tags: [],
    added: '2025-01-02',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt on springs, so hovering no longer flickers. The fan is easier to shape and cards can now be clicked.'
      }
    ]
  },
  'Components/BubbleMenu': {
    videoUrl: '/assets/video/bubblemenu.webm',
    description: 'Floating circular expanding menu with staggered item reveal.',
    category: 'Components',
    name: 'BubbleMenu',
    docsUrl: 'https://reactbits.dev/components/bubble-menu',
    tags: [],
    added: '2025-08-22'
  },
  'Components/CardNav': {
    videoUrl: '/assets/video/cardnav.webm',
    description: 'Expandable navigation bar with card panels revealing nested links.',
    category: 'Components',
    name: 'CardNav',
    docsUrl: 'https://reactbits.dev/components/card-nav',
    tags: [],
    added: '2025-08-16'
  },
  'Components/CardSwap': {
    videoUrl: '/assets/video/cardswap.webm',
    description: 'A 3D stack of cards that sends the front card to the back on a timer, or when you fling it.',
    category: 'Components',
    name: 'CardSwap',
    docsUrl: 'https://reactbits.dev/components/card-swap',
    tags: [],
    added: '2025-06-02',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with springy swaps you can drag or fling, depth that follows the cursor, cleaner cards in both themes and a layout that fits any container.'
      }
    ]
  },
  'Components/Carousel': {
    videoUrl: '/assets/video/carousel.webm',
    description: 'Swipeable cards for feature tours, stories and galleries, with five transitions and an autoplay timer.',
    category: 'Components',
    name: 'Carousel',
    docsUrl: 'https://reactbits.dev/components/carousel',
    tags: [],
    added: '2025-02-13',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt with momentum swiping, five transitions, photo cards, an autoplay timer and a cleaner frame in both themes.'
      }
    ]
  },
  'Components/ChromaGrid': {
    videoUrl: '/assets/video/chromagrid.webm',
    description: 'A grid of grayscale photo cards where a spotlight follows the cursor and brings back color.',
    category: 'Components',
    name: 'ChromaGrid',
    docsUrl: 'https://reactbits.dev/components/chroma-grid',
    tags: [],
    added: '2025-05-30',
    updates: [
      {
        date: '2026-10-10',
        note: 'Redesigned with responsive cards in both themes, a smoother color spotlight and borders that light up near the cursor.'
      }
    ]
  },
  'Components/HoloCard': {
    videoUrl: '/assets/video/holocard.webm',
    description: 'Collectible trading card with a real holographic foil and glitter that sparkles as it tilts.',
    category: 'Components',
    name: 'HoloCard',
    docsUrl: 'https://reactbits.dev/components/holo-card',
    tags: [],
    added: '2026-10-08'
  },
  'Components/CircularCarousel': {
    videoUrl: '/assets/video/circularcarousel.webm',
    description: 'A 3D ring of images with bendable cards, momentum drag, snapping and click to focus.',
    category: 'Components',
    name: 'CircularCarousel',
    docsUrl: 'https://reactbits.dev/components/circular-carousel',
    tags: [],
    added: '2026-09-29'
  },
  'Components/FlexCarousel': {
    videoUrl: '/assets/video/flexcarousel.webm',
    description: 'An infinite image row that flows through invisible liquid glass at its edges.',
    category: 'Components',
    name: 'FlexCarousel',
    docsUrl: 'https://reactbits.dev/components/flex-carousel',
    tags: [],
    added: '2026-09-26'
  },
  'Components/DepthCarousel': {
    videoUrl: '/assets/video/depthcarousel.webm',
    description: 'Cards recede into depth on a 3D rail, with drag, keyboard and auto-advance.',
    category: 'Components',
    name: 'DepthCarousel',
    docsUrl: 'https://reactbits.dev/components/depth-carousel',
    tags: [],
    added: '2026-08-04'
  },
  'Components/AccordionGallery': {
    videoUrl: '/assets/video/accordiongallery.webm',
    description: 'Panels expand on hover or focus, revealing parallax imagery and captions.',
    category: 'Components',
    name: 'AccordionGallery',
    docsUrl: 'https://reactbits.dev/components/accordion-gallery',
    tags: [],
    added: '2026-08-04'
  },
  'Components/MorphSlider': {
    videoUrl: '/assets/video/morphslider.webm',
    description: 'WebGL slider that melts between images with a displacement transition.',
    category: 'Components',
    name: 'MorphSlider',
    docsUrl: 'https://reactbits.dev/components/morph-slider',
    tags: [],
    added: '2026-08-04'
  },
  'Components/DriftWall': {
    videoUrl: '/assets/video/driftwall.webm',
    description: 'An endless perspective wall of tiles drifting past, lifting on hover.',
    category: 'Components',
    name: 'DriftWall',
    docsUrl: 'https://reactbits.dev/components/drift-wall',
    tags: [],
    added: '2026-08-04'
  },
  'Components/CircularGallery': {
    videoUrl: '/assets/video/circulargallery.webm',
    description: 'Circular orbit gallery rotating images.',
    category: 'Components',
    name: 'CircularGallery',
    docsUrl: 'https://reactbits.dev/components/circular-gallery',
    tags: [],
    added: '2025-02-03'
  },
  'Components/Counter': {
    videoUrl: '/assets/video/counter.webm',
    description: 'Flexible animated counter supporting increments + easing.',
    category: 'Components',
    name: 'Counter',
    docsUrl: 'https://reactbits.dev/components/counter',
    tags: [],
    added: '2025-02-15'
  },
  'Components/DecayCard': {
    videoUrl: '/assets/video/decaycard.webm',
    description: 'An image card that tears and melts as the pointer moves, then pulls itself back together.',
    category: 'Components',
    name: 'DecayCard',
    docsUrl: 'https://reactbits.dev/components/decay-card',
    tags: [],
    added: '2024-08-20',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt to run smoother. The decay now shows at normal speeds, spreads evenly and frays gently when idle.'
      }
    ]
  },
  'Components/Dock': {
    videoUrl: '/assets/video/dock.webm',
    description: 'macOS style dock with smooth magnification, launch bounce, badges and context menus.',
    category: 'Components',
    name: 'Dock',
    docsUrl: 'https://reactbits.dev/components/dock',
    tags: [],
    added: '2024-08-08',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with smoother magnification, a right-click menu, badges, auto hide and placement on any edge.'
      }
    ]
  },
  'Components/DomeGallery': {
    videoUrl: '/assets/video/domegallery.webm',
    description: 'Immersive 3D dome gallery projecting images on a hemispheric surface.',
    category: 'Components',
    name: 'DomeGallery',
    docsUrl: 'https://reactbits.dev/components/dome-gallery',
    tags: [],
    added: '2025-08-29'
  },
  'Components/ElasticSlider': {
    videoUrl: '/assets/video/elasticslider.webm',
    description: 'Slider handle stretches elastically then snaps with spring physics.',
    category: 'Components',
    name: 'ElasticSlider',
    docsUrl: 'https://reactbits.dev/components/elastic-slider',
    tags: [],
    added: '2024-08-18'
  },
  'Components/FlowingMenu': {
    videoUrl: '/assets/video/flowingmenu.webm',
    description: 'Liquid flowing active indicator glides between menu items.',
    category: 'Components',
    name: 'FlowingMenu',
    docsUrl: 'https://reactbits.dev/components/flowing-menu',
    tags: [],
    added: '2025-01-31'
  },
  'Components/FluidGlass': {
    videoUrl: '/assets/video/fluidglass.webm',
    description: 'Glassmorphism container with animated liquid distortion refraction.',
    category: 'Components',
    name: 'FluidGlass',
    docsUrl: 'https://reactbits.dev/components/fluid-glass',
    tags: [],
    added: '2025-06-15'
  },
  'Components/FlyingPosters': {
    videoUrl: '/assets/video/flyingposters.webm',
    description: '3D posters that twist and flip as you scroll or drag through an endless column.',
    category: 'Components',
    name: 'FlyingPosters',
    docsUrl: 'https://reactbits.dev/components/flying-posters',
    tags: [],
    added: '2025-01-29',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt so it only scrolls when you use it, with optional columns and a camera you can pull back or push in.'
      }
    ]
  },
  'Components/Folder': {
    videoUrl: '/assets/video/folder.webm',
    description: 'Folder that drops its flap open or swings open like a book, with pages you can pick.',
    category: 'Components',
    name: 'Folder',
    docsUrl: 'https://reactbits.dev/components/folder',
    tags: [],
    added: '2025-02-28',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt from scratch. It can now also lie flat and open like a book, in solid, glass or matte, and its pages rise under the cursor.'
      }
    ]
  },
  'Components/GlassIcons': {
    videoUrl: '/assets/video/glassicons.webm',
    description: 'Liquid glass icons that bend the color behind them, for app grids, docks and social links.',
    category: 'Components',
    name: 'GlassIcons',
    docsUrl: 'https://reactbits.dev/components/glass-icons',
    tags: [],
    added: '2025-02-18',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt with real liquid glass that bends light at its edges, a smooth entrance, new card styles and presets.'
      }
    ]
  },
  'Components/GlassSurface': {
    videoUrl: '/assets/video/glasssurface.webm',
    description: 'Apple-style liquid glass that bends what is behind it, in a rounded panel or any logo shape.',
    category: 'Components',
    name: 'GlassSurface',
    docsUrl: 'https://reactbits.dev/components/glass-surface',
    tags: [],
    added: '2025-07-19',
    updates: [
      {
        date: '2026-10-10',
        note: 'Turn any SVG logo into glass, and get real refraction in Safari and Firefox by passing in the image behind it. The new demo glass follows your cursor and can be dragged.'
      }
    ]
  },
  'Components/GooeyNav': {
    videoUrl: '/assets/video/gooeynav.webm',
    description: 'A navigation bar whose active pill breaks into goo that flows over to the item you pick.',
    category: 'Components',
    name: 'GooeyNav',
    docsUrl: 'https://reactbits.dev/components/gooey-nav',
    tags: [],
    added: '2025-03-14',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt so the active pill melts into droplets that flow to the new item, with a light theme, icons and sizes.'
      }
    ]
  },
  'Components/InfiniteSpiral': {
    videoUrl: '/assets/video/infinitespiral.webm',
    description: 'An endlessly looping 3D helix of images with adjustable motion, depth and spacing.',
    category: 'Components',
    name: 'InfiniteSpiral',
    docsUrl: 'https://reactbits.dev/components/infinite-spiral',
    tags: [],
    added: '2026-08-29'
  },
  'Components/InfiniteMenu': {
    videoUrl: '/assets/video/infinitemenu.webm',
    description: 'A draggable sphere of image tiles that snaps the nearest one forward and shows its title.',
    category: 'Components',
    name: 'InfiniteMenu',
    docsUrl: 'https://reactbits.dev/components/infinite-menu',
    tags: [],
    added: '2025-01-28',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt to be lighter, with more ways to shape the tiles, autoplay, keyboard support and click to select.'
      }
    ]
  },
  'Components/Lanyard': {
    videoUrl: '/assets/video/lanyard.webm',
    description: 'Swinging 3D badge on a stretchy woven band that you can drag, throw or click to flip.',
    category: 'Components',
    name: 'Lanyard',
    docsUrl: 'https://reactbits.dev/components/lanyard',
    tags: [],
    added: '2025-02-15',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with no setup needed. Pass any image and the card swings with real momentum and flips on click.'
      }
    ]
  },
  'Components/MagicBento': {
    videoUrl: '/assets/video/magicbento.webm',
    description: 'Interactive bento grid tiles expand + animate with various options.',
    category: 'Components',
    name: 'MagicBento',
    docsUrl: 'https://reactbits.dev/components/magic-bento',
    tags: [],
    added: '2025-07-13'
  },
  'Components/Masonry': {
    videoUrl: '/assets/video/masonry.webm',
    description: 'Responsive masonry layout with animated reflow + gaps optimization.',
    category: 'Components',
    name: 'Masonry',
    docsUrl: 'https://reactbits.dev/components/masonry',
    tags: [],
    added: '2024-08-08'
  },
  'Components/ModelViewer': {
    videoUrl: '/assets/video/modelviewer.webm',
    description: 'A product-style 3D model viewer that frames itself and floats over a soft shadow.',
    category: 'Components',
    name: 'ModelViewer',
    docsUrl: 'https://reactbits.dev/components/model-viewer',
    tags: [],
    added: '2025-06-13',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with automatic framing, studio lighting, momentum dragging, intros and many new options. New demo models.'
      }
    ]
  },
  'Components/PillNav': {
    videoUrl: '/assets/video/pillnav.webm',
    description: 'Minimal pill nav with sliding active highlight + smooth easing.',
    category: 'Components',
    name: 'PillNav',
    docsUrl: 'https://reactbits.dev/components/pill-nav',
    tags: [],
    added: '2025-08-13'
  },
  'Components/PixelCard': {
    videoUrl: '/assets/video/pixelcard.webm',
    description: 'Card content revealed through pixel expansion transition.',
    category: 'Components',
    name: 'PixelCard',
    docsUrl: 'https://reactbits.dev/components/pixel-card',
    tags: [],
    added: '2025-01-20'
  },
  'Components/ProfileCard': {
    videoUrl: '/assets/video/profilecard.webm',
    description: 'A framed profile card that tilts toward the cursor, with holographic foil shining through a tiled pattern.',
    category: 'Components',
    name: 'ProfileCard',
    docsUrl: 'https://reactbits.dev/components/profile-card',
    tags: [],
    added: '2025-06-01',
    updates: [
      {
        date: '2026-10-10',
        note: 'Redesigned in the Carousel style, with smoother tilt, a light theme and holo that shows only through the pattern.'
      }
    ]
  },
  'Components/ScrollStack': {
    videoUrl: '/assets/video/scrollstack.webm',
    description: 'Cards pin and stack as you scroll, settling back into a dimmed deck with smooth, jitter-free motion.',
    category: 'Components',
    name: 'ScrollStack',
    docsUrl: 'https://reactbits.dev/components/scroll-stack',
    tags: [],
    added: '2025-07-15',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with native pinning that never jitters, its own smooth scrolling, snapping and new depth styles. The demo is now a minimal photo deck with presets.'
      }
    ]
  },
  'Components/SpotlightCard': {
    videoUrl: '/assets/video/spotlightcard.webm',
    description: 'Card lit by a soft spotlight that follows the pointer, catches its edge and reaches nearby cards.',
    category: 'Components',
    name: 'SpotlightCard',
    docsUrl: 'https://reactbits.dev/components/spotlight-card',
    tags: [],
    added: '2024-08-14',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with a smoother light that follows the cursor, glows along the edge and can be shared across a grid.'
      }
    ]
  },
  'Components/BorderGlow': {
    videoUrl: '/assets/video/borderglow.webm',
    description: 'Glowing mesh-gradient border that follows cursor direction and intensifies near edges.',
    category: 'Components',
    name: 'BorderGlow',
    docsUrl: 'https://reactbits.dev/components/border-glow',
    tags: [],
    added: '2026-03-17'
  },
  'Components/LineSidebar': {
    videoUrl: '/assets/video/linesidebar.webm',
    description: 'Static list navigation with a cursor-proximity effect that shifts and highlights nearby items.',
    category: 'Components',
    name: 'LineSidebar',
    docsUrl: 'https://reactbits.dev/components/line-sidebar',
    tags: [],
    added: '2026-07-07'
  },
  'Components/OptionWheel': {
    videoUrl: '/assets/video/optionwheel.webm',
    description: 'Curved option picker that spins with scroll, drag or arrow keys, tilting items away.',
    category: 'Components',
    name: 'OptionWheel',
    docsUrl: 'https://reactbits.dev/components/option-wheel',
    tags: [],
    added: '2026-07-14'
  },
  'Components/SpecularButton': {
    videoUrl: '/assets/video/specularbutton.webm',
    description: 'Glass button whose edge catches the light, with a highlight that glides toward the cursor.',
    category: 'Components',
    name: 'SpecularButton',
    docsUrl: 'https://reactbits.dev/components/specular-button',
    tags: [],
    added: '2026-07-14',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with a crisp glass edge whose light glides around the rim toward the cursor, rests softly when idle and flashes on press.'
      }
    ]
  },
  'Animations/ElasticMesh': {
    videoUrl: '/assets/video/elasticmesh.webm',
    description: 'Turns text or any logo into a puffy inflated shape you can press, poke and stretch like jelly.',
    category: 'Animations',
    name: 'ElasticMesh',
    docsUrl: 'https://reactbits.dev/animations/elastic-mesh',
    tags: [],
    added: '2026-08-04',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt as inflated, squishy type and logos that dent, stretch and snap back with a jiggle.'
      }
    ]
  },
  'Animations/RippleDistortion': {
    videoUrl: '/assets/video/rippledistortion.webm',
    description: 'Pointer-driven water displacement that warps content and leaves a decaying wake.',
    category: 'Animations',
    name: 'RippleDistortion',
    docsUrl: 'https://reactbits.dev/animations/ripple-distortion',
    tags: [],
    added: '2026-08-04'
  },
  'Animations/SwarmCursor': {
    videoUrl: '/assets/video/swarmcursor.webm',
    description: 'Flocking particle swarm that chases the pointer, jostles for space and drifts apart at rest.',
    category: 'Animations',
    name: 'SwarmCursor',
    docsUrl: 'https://reactbits.dev/animations/swarm-cursor',
    tags: [],
    added: '2026-08-04'
  },
  'Animations/HalftoneReveal': {
    videoUrl: '/assets/video/halftonereveal.webm',
    description: 'A halftone print of an image whose dots swell into the real photo under the cursor.',
    category: 'Animations',
    name: 'HalftoneReveal',
    docsUrl: 'https://reactbits.dev/animations/halftone-reveal',
    tags: [],
    added: '2026-08-04',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt as a print on the page in mono, duotone or full color, with dots that swell into the photo.'
      }
    ]
  },
  'Animations/ScrollExpand': {
    videoUrl: '/assets/video/scrollexpand.webm',
    description: 'A rounded media frame that grows to full bleed as it scrolls through the viewport.',
    category: 'Animations',
    name: 'ScrollExpand',
    docsUrl: 'https://reactbits.dev/animations/scroll-expand',
    tags: [],
    added: '2026-08-04'
  },
  'Animations/CursorGrid': {
    videoUrl: '/assets/video/cursorgrid.webm',
    description: 'Canvas grid whose cells light up around the cursor with configurable radius, falloff and click pulses.',
    category: 'Animations',
    name: 'CursorGrid',
    docsUrl: 'https://reactbits.dev/animations/cursor-grid',
    tags: [],
    added: '2026-07-14'
  },
  'Components/CurvedInput': {
    videoUrl: '/assets/video/curvedinput.webm',
    description: 'Arc-bent input bar with text, caret and submit button all following the curve.',
    category: 'Components',
    name: 'CurvedInput',
    docsUrl: 'https://reactbits.dev/components/curved-input',
    tags: [],
    added: '2026-07-12'
  },
  'Components/Stack': {
    videoUrl: '/assets/video/stack.webm',
    description: 'Pile of cards you can drag, flick or click through, with thrown cards tucking underneath.',
    category: 'Components',
    name: 'Stack',
    docsUrl: 'https://reactbits.dev/components/stack',
    tags: [],
    added: '2024-08-07',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt so cards never jump mid-drag. Throws carry momentum, with four new layouts and keyboard support.'
      }
    ]
  },
  'Components/Stepper': {
    videoUrl: '/assets/video/stepper.webm',
    description: 'A multi-step flow with a gliding step indicator, spring transitions and horizontal or vertical layouts.',
    category: 'Components',
    name: 'Stepper',
    docsUrl: 'https://reactbits.dev/components/stepper',
    tags: [],
    added: '2025-02-04',
    updates: [
      {
        date: '2026-10-10',
        note: 'Redesigned with a frosted panel in both themes and smoother transitions. Steps can now show titles, descriptions and icons, with dot, bar and vertical layouts.'
      }
    ]
  },
  'Components/TiltedCard': {
    videoUrl: '/assets/video/tiltedcard.webm',
    description: '3D perspective tilt card reacting to pointer.',
    category: 'Components',
    name: 'TiltedCard',
    docsUrl: 'https://reactbits.dev/components/tilted-card',
    tags: [],
    added: '2025-01-22'
  },
  'Components/StaggeredMenu': {
    videoUrl: '/assets/video/staggeredmenu.webm',
    description: 'Menu with staggered item animations and smooth transitions on open/close.',
    category: 'Components',
    name: 'StaggeredMenu',
    docsUrl: 'https://reactbits.dev/components/staggered-menu',
    tags: [],
    added: '2025-09-04'
  },
  'Components/ReflectiveCard': {
    videoUrl: '/assets/video/reflectivecard.webm',
    description: 'Card with dynamic webcam reflection and glare effects that respond to cursor movement.',
    category: 'Components',
    name: 'ReflectiveCard',
    docsUrl: 'https://reactbits.dev/components/reflective-card',
    tags: [],
    added: '2025-12-11'
  },

  //! Backgrounds -------------------------------------------------------------------------------------------------------------------------------
  'Backgrounds/PatternWaves': {
    videoUrl: '/assets/video/patternwaves.webm',
    description: 'A lit halftone surface of dots, lines or glyphs that moves like draped silk.',
    category: 'Backgrounds',
    name: 'PatternWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/pattern-waves',
    tags: ['webgl', 'ogl', 'halftone', 'pattern', 'waves', 'ascii', 'interactive', 'procedural'],
    added: '2026-09-30'
  },
  'Backgrounds/MicroSlats': {
    videoUrl: '/assets/video/microslats.webm',
    description: 'A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests.',
    category: 'Backgrounds',
    name: 'MicroSlats',
    docsUrl: 'https://reactbits.dev/backgrounds/micro-slats',
    tags: ['webgl', 'ogl', 'grid', 'waves', 'interactive', 'procedural'],
    added: '2026-09-27'
  },
  'Backgrounds/ShapeWaves': {
    videoUrl: '/assets/video/shapewaves.webm',
    description: 'A field of triangles, circles and squares that brighten and grow along rolling waves.',
    category: 'Backgrounds',
    name: 'ShapeWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/shape-waves',
    tags: ['webgpu', 'vgpu', 'grid', 'shapes', 'text', 'procedural'],
    added: '2026-09-15',
    updates: [{ date: '2026-10-06', note: 'Centered text cutouts using actual glyph bounds.' }]
  },
  'Backgrounds/AeroShards': {
    videoUrl: '/assets/video/aeroshards.webm',
    description: 'A GPU-driven wind sculpture of folded foil shards that responds to the pointer.',
    category: 'Backgrounds',
    name: 'AeroShards',
    docsUrl: 'https://reactbits.dev/backgrounds/aero-shards',
    tags: ['webgpu', 'vgpu', 'particles', 'procedural', 'post-processing', 'interactive'],
    added: '2026-08-31'
  },
  'Backgrounds/GhostFibers': {
    videoUrl: '/assets/video/ghostfibers.webm',
    description: 'A deep-blue recursive fiber field with luminous bands, radial twisting and soft atmospheric glow.',
    category: 'Backgrounds',
    name: 'GhostFibers',
    docsUrl: 'https://reactbits.dev/backgrounds/ghost-fibers',
    tags: [],
    added: '2026-08-29',
    updates: [
      {
        date: '2026-10-09',
        note: 'Sharper fibers with crisp cores and a cleaner glow, plus a light mode that matches the dark one.'
      }
    ]
  },
  'Backgrounds/Aurora': {
    videoUrl: '/assets/video/aurora.webm',
    description: 'Flowing aurora gradient background.',
    category: 'Backgrounds',
    name: 'Aurora',
    docsUrl: 'https://reactbits.dev/backgrounds/aurora',
    tags: [],
    added: '2025-02-05'
  },
  'Backgrounds/Balatro': {
    videoUrl: '/assets/video/balatro.webm',
    description: 'The balatro shader, fully customizalbe and interactive.',
    category: 'Backgrounds',
    name: 'Balatro',
    docsUrl: 'https://reactbits.dev/backgrounds/balatro',
    tags: [],
    added: '2025-02-16'
  },
  'Backgrounds/Ballpit': {
    videoUrl: '/assets/video/ballpit.webm',
    description: 'Physics ball pit simulation with bouncing colorful spheres.',
    category: 'Backgrounds',
    name: 'Ballpit',
    docsUrl: 'https://reactbits.dev/backgrounds/ballpit',
    tags: [],
    added: '2025-01-07'
  },
  'Backgrounds/Beams': {
    videoUrl: '/assets/video/beams.webm',
    description: 'Glossy ribbons that ripple in the dark and catch the light, which follows your cursor.',
    category: 'Backgrounds',
    name: 'Beams',
    docsUrl: 'https://reactbits.dev/backgrounds/beams',
    tags: [],
    added: '2025-05-27',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with brighter, glowing glints, a light that follows the cursor, a light theme and simpler controls, with no 3D library needed.'
      }
    ]
  },
  'Backgrounds/ColorBends': {
    videoUrl: '/assets/video/colorbends.webm',
    description: 'Vibrant color bends with smooth flowing animation.',
    category: 'Backgrounds',
    name: 'ColorBends',
    docsUrl: 'https://reactbits.dev/backgrounds/color-bends',
    tags: [],
    added: '2025-10-27'
  },
  'Backgrounds/CRTWarp': {
    videoUrl: '/assets/video/crtwarp.webm',
    description: 'Full-canvas CRT plasma with curved distortion, scanlines, bloom and pointer interaction.',
    category: 'Backgrounds',
    name: 'CRTWarp',
    docsUrl: 'https://reactbits.dev/backgrounds/crt-warp',
    tags: [],
    added: '2026-08-26'
  },
  'Backgrounds/DarkVeil': {
    videoUrl: '/assets/video/darkveil.webm',
    description: 'A silky veil of light that drifts in the dark and bends around the cursor.',
    category: 'Backgrounds',
    name: 'DarkVeil',
    docsUrl: 'https://reactbits.dev/backgrounds/dark-veil',
    tags: [],
    added: '2025-07-16',
    updates: [
      {
        date: '2026-10-10',
        note: 'Now reacts to the cursor, with a soft glow, any color and new shapes. Faster, and refined in light mode.'
      }
    ]
  },
  'Backgrounds/Dither': {
    videoUrl: '/assets/video/dither.webm',
    description: 'Retro dithered noise shader background.',
    category: 'Backgrounds',
    name: 'Dither',
    docsUrl: 'https://reactbits.dev/backgrounds/dither',
    tags: [],
    added: '2025-02-19'
  },
  'Backgrounds/DotField': {
    videoUrl: '/assets/video/dotfield.webm',
    description: 'Interactive dot grid with cursor bulge, glow, sparkle, and wave effects.',
    category: 'Backgrounds',
    name: 'DotField',
    docsUrl: 'https://reactbits.dev/backgrounds/dot-field',
    tags: [],
    added: '2026-04-14'
  },
  'Backgrounds/DotGrid': {
    videoUrl: '/assets/video/dotgrid.webm',
    description: 'A springy dot grid that the cursor flicks and drags through like jelly, with click shockwaves.',
    category: 'Backgrounds',
    name: 'DotGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/dot-grid',
    tags: [],
    added: '2025-05-23',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with springy physics, so the dots wobble back, streak as they move and pass ripples to their neighbours.'
      }
    ]
  },
  'Backgrounds/FaultyTerminal': {
    videoUrl: '/assets/video/faultyterminal.webm',
    description: 'Terminal CRT scanline squares effect with flicker + noise.',
    category: 'Backgrounds',
    name: 'FaultyTerminal',
    docsUrl: 'https://reactbits.dev/backgrounds/faulty-terminal',
    tags: [],
    added: '2025-07-23'
  },
  'Backgrounds/Galaxy': {
    videoUrl: '/assets/video/galaxy.webm',
    description: 'Parallax realistic starfield with pointer interactions.',
    category: 'Backgrounds',
    name: 'Galaxy',
    docsUrl: 'https://reactbits.dev/backgrounds/galaxy',
    tags: [],
    added: '2025-07-20'
  },
  'Backgrounds/GradientBlinds': {
    videoUrl: '/assets/video/gradientblinds.webm',
    description: 'Layered gradient blinds with spotlight and noise distortion.',
    category: 'Backgrounds',
    name: 'GradientBlinds',
    docsUrl: 'https://reactbits.dev/backgrounds/gradient-blinds',
    tags: [],
    added: '2025-08-23'
  },
  'Backgrounds/Lightfall': {
    videoUrl: '/assets/video/lightfall.webm',
    description: 'Colorful light streaks raining down a glowing tunnel with a cursor light.',
    category: 'Backgrounds',
    name: 'Lightfall',
    docsUrl: 'https://reactbits.dev/backgrounds/lightfall',
    tags: [],
    added: '2026-06-02'
  },
  'Backgrounds/Ferrofluid': {
    videoUrl: '/assets/video/ferrofluid.webm',
    description: 'A churning magnetic fluid traced by glowing contour lines, with a cursor magnet.',
    category: 'Backgrounds',
    name: 'Ferrofluid',
    docsUrl: 'https://reactbits.dev/backgrounds/ferrofluid',
    tags: [],
    added: '2026-06-02'
  },
  'Backgrounds/MoltenMetal': {
    videoUrl: '/assets/video/moltenmetal.webm',
    description: 'Swirling caustic plasma filaments with molten, white-hot cores.',
    category: 'Backgrounds',
    name: 'MoltenMetal',
    docsUrl: 'https://reactbits.dev/backgrounds/molten-metal',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/GradientWaves': {
    videoUrl: '/assets/video/gradientwaves.webm',
    description: 'Raymarched sine waves rolling toward a soft, hazy horizon.',
    category: 'Backgrounds',
    name: 'GradientWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/gradient-waves',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/WebThreads': {
    videoUrl: '/assets/video/webthreads.webm',
    description: 'Glowing sine threads woven through a luminous convergence point.',
    category: 'Backgrounds',
    name: 'WebThreads',
    docsUrl: 'https://reactbits.dev/backgrounds/web-threads',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/Topography': {
    videoUrl: '/assets/video/topography.webm',
    description: 'A living contour map with glowing, elevation-tinted lines.',
    category: 'Backgrounds',
    name: 'Topography',
    docsUrl: 'https://reactbits.dev/backgrounds/topography',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/LightTunnel': {
    videoUrl: '/assets/video/lighttunnel.webm',
    description: 'A radial fibre-optic tunnel with light pulses racing into depth.',
    category: 'Backgrounds',
    name: 'LightTunnel',
    docsUrl: 'https://reactbits.dev/backgrounds/light-tunnel',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/SlicedWaves': {
    videoUrl: '/assets/video/slicedwaves.webm',
    description: 'Waves of colored light sliced into glowing bars, seen in depth with a focus that follows the cursor.',
    category: 'Backgrounds',
    name: 'SlicedWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/sliced-waves',
    tags: [],
    added: '2026-08-04',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt as waves of light sliced into glowing bars, seen in depth with a focus that follows the cursor.'
      }
    ]
  },
  'Backgrounds/AcidSquares': {
    videoUrl: '/assets/video/acidsquares.webm',
    description: 'A crystalline corridor of stacked squares with rings of light travelling toward you.',
    category: 'Backgrounds',
    name: 'AcidSquares',
    docsUrl: 'https://reactbits.dev/backgrounds/acid-squares',
    tags: [],
    added: '2026-08-04',
    updates: [
      {
        date: '2026-10-09',
        note: 'Crisp glass edges, travelling rings of light and twinkling squares, plus a clean light mode.'
      }
    ]
  },
  'Backgrounds/Scanner': {
    videoUrl: '/assets/video/scanner.webm',
    description: 'Calm interference bands sweeping across the screen like an oscilloscope.',
    category: 'Backgrounds',
    name: 'Scanner',
    docsUrl: 'https://reactbits.dev/backgrounds/scanner',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/Grainient': {
    videoUrl: '/assets/video/grainient.webm',
    description: 'Grainy gradient swirls with soft wave distortion.',
    category: 'Backgrounds',
    name: 'Grainient',
    docsUrl: 'https://reactbits.dev/backgrounds/grainient',
    tags: [],
    added: '2026-02-03'
  },
  'Backgrounds/GridScan': {
    videoUrl: '/assets/video/gridscan.webm',
    description: 'Animated grid room 3D scan effect and cool interactions.',
    category: 'Backgrounds',
    name: 'GridScan',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-scan',
    tags: [],
    added: '2025-11-03'
  },
  'Backgrounds/GridDistortion': {
    videoUrl: '/assets/video/griddistortion.webm',
    description: 'Image background that breaks into a grid of blocks under the cursor and settles back into place.',
    category: 'Backgrounds',
    name: 'GridDistortion',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-distortion',
    tags: [],
    added: '2025-01-25',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt to be lighter. Images no longer stretch, and new modes range from crisp blocks to a liquid warp.'
      }
    ]
  },
  'Backgrounds/GridMotion': {
    videoUrl: '/assets/video/gridmotion.webm',
    description: 'A tilted wall of drifting tiles that slides with the pointer and lights up where it rests.',
    category: 'Backgrounds',
    name: 'GridMotion',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-motion',
    tags: [],
    added: '2024-08-18',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt to fit its container, with drift, parallax, a 3D tilt and a spotlight that follows the cursor.'
      }
    ]
  },
  'Backgrounds/Hyperspeed': {
    videoUrl: '/assets/video/hyperspeed.webm',
    description: 'Night highway of glowing light trails on a winding road that warps into hyperspace while you hold.',
    category: 'Backgrounds',
    name: 'Hyperspeed',
    docsUrl: 'https://reactbits.dev/backgrounds/hyperspeed',
    tags: [],
    added: '2024-08-14',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with a real glow and a transparent background. Every part of the road and lights is now customizable.'
      }
    ]
  },
  'Backgrounds/Iridescence': {
    videoUrl: '/assets/video/iridescence.webm',
    description: 'Liquid iridescent surface with shifting folds that you can stir with the cursor.',
    category: 'Backgrounds',
    name: 'Iridescence',
    docsUrl: 'https://reactbits.dev/backgrounds/iridescence',
    tags: [],
    added: '2025-02-05',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt with full control over color, folds and motion, a liquid stir under the cursor, a swirl on click and presets.'
      }
    ]
  },
  'Backgrounds/LetterGlitch': {
    videoUrl: '/assets/video/letterglitch.webm',
    description: 'Matrix style letter animation.',
    category: 'Backgrounds',
    name: 'LetterGlitch',
    docsUrl: 'https://reactbits.dev/backgrounds/letter-glitch',
    tags: [],
    added: '2025-01-24'
  },
  'Backgrounds/LightRays': {
    videoUrl: '/assets/video/lightrays.webm',
    description: 'Volumetric light rays/beams with customizable direction.',
    category: 'Backgrounds',
    name: 'LightRays',
    docsUrl: 'https://reactbits.dev/backgrounds/light-rays',
    tags: [],
    added: '2025-07-21'
  },
  'Backgrounds/Lightning': {
    videoUrl: '/assets/video/lightning.webm',
    description: 'Crackling, branching lightning that bends toward the cursor and strikes wherever you click.',
    category: 'Backgrounds',
    name: 'Lightning',
    docsUrl: 'https://reactbits.dev/backgrounds/lightning',
    tags: [],
    added: '2025-02-25',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with cleaner bolts that loop seamlessly, more options, a light mode, and strikes that land where you click.'
      }
    ]
  },
  'Backgrounds/LineWaves': {
    videoUrl: '/assets/video/linewaves.webm',
    description: 'Animated line wave pattern with colorful warped distortion.',
    category: 'Backgrounds',
    name: 'LineWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/line-waves',
    tags: [],
    added: '2026-03-17'
  },
  'Backgrounds/EvilEye': {
    videoUrl: '/assets/video/evileye.webm',
    description: 'Procedural evil eye shader with animated iris, slit pupil, and fiery outer glow.',
    category: 'Backgrounds',
    name: 'EvilEye',
    docsUrl: 'https://reactbits.dev/backgrounds/evil-eye',
    tags: [],
    added: '2026-03-17'
  },
  'Backgrounds/Radar': {
    videoUrl: '/assets/video/radar.webm',
    description: 'A radar scope whose sweep leaves a phosphor afterglow and picks up moving contacts.',
    category: 'Backgrounds',
    name: 'Radar',
    docsUrl: 'https://reactbits.dev/backgrounds/radar',
    tags: [],
    added: '2026-03-17',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt as a detailed radar scope with a glowing sweep, contacts that ping and fade, a sonar mode and a tilted floor view.'
      }
    ]
  },
  'Backgrounds/SoftAurora': {
    videoUrl: '/assets/video/softaurora.webm',
    description: 'Soft aurora borealis shader with 3D Perlin noise and cosine gradient palettes.',
    category: 'Backgrounds',
    name: 'SoftAurora',
    docsUrl: 'https://reactbits.dev/backgrounds/soft-aurora',
    tags: [],
    added: '2026-03-17'
  },
  'Backgrounds/LiquidChrome': {
    videoUrl: '/assets/video/liquidchrome.webm',
    description: 'Liquid metallic chrome shader with flowing reflective surface.',
    category: 'Backgrounds',
    name: 'LiquidChrome',
    docsUrl: 'https://reactbits.dev/backgrounds/liquid-chrome',
    tags: [],
    added: '2025-02-07'
  },
  'Backgrounds/Orb': {
    videoUrl: '/assets/video/orb.webm',
    description: 'Floating energy orb with customizable hover effect.',
    category: 'Backgrounds',
    name: 'Orb',
    docsUrl: 'https://reactbits.dev/backgrounds/orb',
    tags: [],
    added: '2025-02-07'
  },
  'Backgrounds/Particles': {
    videoUrl: '/assets/video/particles.webm',
    description: 'Configurable particle system.',
    category: 'Backgrounds',
    name: 'Particles',
    docsUrl: 'https://reactbits.dev/backgrounds/particles',
    tags: [],
    added: '2025-02-10'
  },
  'Backgrounds/PixelBlast': {
    videoUrl: '/assets/video/pixelblast.webm',
    description: 'Exploding pixel particle bursts with optional liquid postprocessing.',
    category: 'Backgrounds',
    name: 'PixelBlast',
    docsUrl: 'https://reactbits.dev/backgrounds/pixel-blast',
    tags: [],
    added: '2025-08-31'
  },
  'Backgrounds/Plasma': {
    videoUrl: '/assets/video/plasma.webm',
    description: 'Folds of satin light twisting slowly through the dark, turning to follow the cursor.',
    category: 'Backgrounds',
    name: 'Plasma',
    docsUrl: 'https://reactbits.dev/backgrounds/plasma',
    tags: [],
    added: '2025-08-18',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt as soft folds of satin light with bright highlights, a cursor that turns them in 3D and a new light mode.'
      }
    ]
  },
  'Backgrounds/PlasmaWave': {
    videoUrl: '/assets/video/plasmawave.webm',
    description: 'Two ribbons of plasma curling through each other, with soft glow and white-hot cores.',
    category: 'Backgrounds',
    name: 'PlasmaWave',
    docsUrl: 'https://reactbits.dev/backgrounds/plasma-wave',
    tags: [],
    added: '2026-04-14',
    updates: [
      {
        date: '2026-10-10',
        note: 'Smoother, faster plasma with soft glow, white-hot cores and a cursor that stirs it, plus a new light mode.'
      }
    ]
  },
  'Backgrounds/Prism': {
    videoUrl: '/assets/video/prism.webm',
    description: 'Rotating prism with configurable intensity, size, and colors.',
    category: 'Backgrounds',
    name: 'Prism',
    docsUrl: 'https://reactbits.dev/backgrounds/prism',
    tags: [],
    added: '2025-08-20'
  },
  'Backgrounds/PrismaticBurst': {
    videoUrl: '/assets/video/prismaticburst.webm',
    description: 'Burst of light rays with controllable color, distortion, amount.',
    category: 'Backgrounds',
    name: 'PrismaticBurst',
    docsUrl: 'https://reactbits.dev/backgrounds/prismatic-burst',
    tags: [],
    added: '2025-08-26'
  },
  'Backgrounds/RippleGrid': {
    videoUrl: '/assets/video/ripplegrid.webm',
    description: 'A crisp grid that ripples like water, bending and lighting up as waves pass through it.',
    category: 'Backgrounds',
    name: 'RippleGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/ripple-grid',
    tags: [],
    added: '2025-07-14',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with crisp lines, real traveling waves from the cursor and clicks, dot and cross styles, and a perspective floor.'
      }
    ]
  },
  'Backgrounds/Silk': {
    videoUrl: '/assets/video/silk.webm',
    description: 'Smooth waves background with soft lighting.',
    category: 'Backgrounds',
    name: 'Silk',
    docsUrl: 'https://reactbits.dev/backgrounds/silk',
    tags: [],
    added: '2025-05-22'
  },
  'Backgrounds/SideRays': {
    videoUrl: '/assets/video/siderays.webm',
    description: 'Animated light rays emanating from the side with customizable colors and speed.',
    category: 'Backgrounds',
    name: 'SideRays',
    docsUrl: 'https://reactbits.dev/backgrounds/side-rays',
    tags: [],
    added: '2026-06-02'
  },
  'Backgrounds/ShapeGrid': {
    videoUrl: '/assets/video/squares.webm',
    description: 'Animated grid with shape variants (square, hexagon, circle, triangle) + direction customization.',
    category: 'Backgrounds',
    name: 'ShapeGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/shape-grid',
    tags: [],
    added: '2026-03-15'
  },
  'Backgrounds/Threads': {
    videoUrl: '/assets/video/threads.webm',
    description: 'Flowing threads that fray apart and part around the cursor, from fine silk to contour lines.',
    category: 'Backgrounds',
    name: 'Threads',
    docsUrl: 'https://reactbits.dev/backgrounds/threads',
    tags: [],
    added: '2025-02-18',
    updates: [
      {
        date: '2026-10-09',
        note: 'Rebuilt to run several times faster, with presets, much more control over the threads and a cursor that parts them.'
      }
    ]
  },
  'Backgrounds/Waves': {
    videoUrl: '/assets/video/waves.webm',
    description: 'Layered lines that form smooth wave patterns with animation.',
    category: 'Backgrounds',
    name: 'Waves',
    docsUrl: 'https://reactbits.dev/backgrounds/waves',
    tags: [],
    added: '2025-01-03'
  },
  'Backgrounds/LiquidEther': {
    videoUrl: '/assets/video/liquidether.webm',
    description:
      'Interactive liquid shader with flowing distortion and customizable colors.',
    category: 'Backgrounds',
    name: 'LiquidEther',
    docsUrl: 'https://reactbits.dev/backgrounds/liquid-ether',
    tags: [],
    added: '2025-09-05'
  },
  'Backgrounds/FloatingLines': {
    videoUrl: '/assets/video/floatinglines.webm',
    description: '3D floating lines that react to cursor movement.',
    category: 'Backgrounds',
    name: 'FloatingLines',
    docsUrl: 'https://reactbits.dev/backgrounds/floating-lines',
    tags: [],
    added: '2025-11-14'
  },
  'Backgrounds/LightPillar': {
    videoUrl: '/assets/video/lightpillar.webm',
    description: 'Vertical pillar of light with glow effects.',
    category: 'Backgrounds',
    name: 'LightPillar',
    docsUrl: 'https://reactbits.dev/backgrounds/light-pillar',
    tags: [],
    added: '2025-12-03'
  },
  'Backgrounds/PixelSnow': {
    videoUrl: '/assets/video/pixelsnow.webm',
    description: 'Pixel-art snowflakes drifting down in layers of depth, brushed aside by the cursor.',
    category: 'Backgrounds',
    name: 'PixelSnow',
    docsUrl: 'https://reactbits.dev/backgrounds/pixel-snow',
    tags: [],
    added: '2025-12-20',
    updates: [
      {
        date: '2026-10-10',
        note: 'Rebuilt with crisp pixel-art flakes in layers of depth, a soft glow, wind and cursor play, snow that can pile up, and a light mode.'
      }
    ]
  },

  //! Micro ------------------------------------------------------------------------------------------------------------------------------------

  'Micro/SquishSwitch': {
    videoUrl: '/assets/video/squishswitch.webm',
    description: 'Switch whose thumb stretches with speed and squashes against the end when you flick it.',
    category: 'Micro',
    name: 'SquishSwitch',
    docsUrl: 'https://reactbits.dev/micro/squish-switch',
    tags: ['switch', 'toggle', 'spring', 'drag', 'gesture', 'form'],
    added: '2026-09-18'
  },
  'Micro/HoldButton': {
    videoUrl: '/assets/video/holdbutton.webm',
    description: 'Hold-to-confirm button whose liquid fill rises while pressed and snaps back if you let go.',
    category: 'Micro',
    name: 'HoldButton',
    docsUrl: 'https://reactbits.dev/micro/hold-button',
    tags: ['button', 'confirm', 'hold', 'press', 'destructive'],
    added: '2026-09-18'
  },
  'Micro/PeekRating': {
    videoUrl: '/assets/video/peekrating.webm',
    description: 'Star rating that lifts a wave of stars up to the pointer, then commits with a pop on click.',
    category: 'Micro',
    name: 'PeekRating',
    docsUrl: 'https://reactbits.dev/micro/peek-rating',
    tags: ['rating', 'stars', 'hover', 'preview', 'feedback', 'form'],
    added: '2026-09-18'
  },
  'Micro/SpringCheck': {
    videoUrl: '/assets/video/springcheck.webm',
    description: 'Checkbox row where one spring fills the box, draws the tick and strikes through the label.',
    category: 'Micro',
    name: 'SpringCheck',
    docsUrl: 'https://reactbits.dev/micro/spring-check',
    tags: ['checkbox', 'toggle', 'form', 'spring', 'press', 'strikethrough'],
    added: '2026-09-18'
  },
  'Micro/PulseHeart': {
    videoUrl: '/assets/video/pulseheart.webm',
    description: 'Like button that contracts to a dot, flips colour and pulses back as the count ticks over.',
    category: 'Micro',
    name: 'PulseHeart',
    docsUrl: 'https://reactbits.dev/micro/pulse-heart',
    tags: ['like', 'heart', 'button', 'reaction', 'counter', 'press'],
    added: '2026-09-18'
  },
  'Micro/RubberSegment': {
    videoUrl: '/assets/video/rubbersegment.webm',
    description: 'Segmented control whose rubber thumb stretches across the gap and squashes into place.',
    category: 'Micro',
    name: 'RubberSegment',
    docsUrl: 'https://reactbits.dev/micro/rubber-segment',
    tags: ['segmented', 'tabs', 'drag', 'spring', 'clip-path', 'radio'],
    added: '2026-09-18'
  },
  'Micro/SlideCommit': {
    videoUrl: '/assets/video/slidecommit.webm',
    description: 'Slide-to-confirm handle that spins while your action runs and unfurls into a done pill.',
    category: 'Micro',
    name: 'SlideCommit',
    docsUrl: 'https://reactbits.dev/micro/slide-commit',
    tags: ['slide', 'confirm', 'async', 'gesture', 'drag', 'button'],
    added: '2026-09-18'
  },
  'Micro/WarmTooltip': {
    videoUrl: '/assets/video/warmtooltip.webm',
    description: 'Tooltip group where the first label waits, then its siblings open instantly while warm.',
    category: 'Micro',
    name: 'WarmTooltip',
    docsUrl: 'https://reactbits.dev/micro/warm-tooltip',
    tags: ['tooltip', 'hover', 'toolbar', 'delay', 'group', 'label'],
    added: '2026-09-18'
  },
  'Micro/FuseButton': {
    videoUrl: '/assets/video/fusebutton.webm',
    description: 'Action button whose done state carries an undo on a burning fuse.',
    category: 'Micro',
    name: 'FuseButton',
    docsUrl: 'https://reactbits.dev/micro/fuse-button',
    tags: ['button', 'undo', 'confirm', 'timer', 'press', 'fuse'],
    added: '2026-09-18'
  },
  'Micro/ScrubField': {
    videoUrl: '/assets/video/scrubfield.webm',
    description: 'Number chip you drag to scrub, with rubber-band limits and click to type.',
    category: 'Micro',
    name: 'ScrubField',
    docsUrl: 'https://reactbits.dev/micro/scrub-field',
    tags: ['input', 'number', 'drag', 'scrub', 'form', 'inspector'],
    added: '2026-09-18'
  },
  'Micro/LatticeLoader': {
    videoUrl: '/assets/video/latticeloader.webm',
    description: 'Agent status row with a lattice of cells that brighten in a wave beside a live stopwatch.',
    category: 'Micro',
    name: 'LatticeLoader',
    docsUrl: 'https://reactbits.dev/micro/lattice-loader',
    tags: ['loader', 'status', 'ai', 'agent', 'timer', 'grid'],
    added: '2026-09-18'
  },
  'Micro/DodgeField': {
    videoUrl: '/assets/video/dodgefield.webm',
    description: 'Wrapper that makes any child dodge the pointer until it relents and glides home.',
    category: 'Micro',
    name: 'DodgeField',
    docsUrl: 'https://reactbits.dev/micro/dodge-field',
    tags: ['hover', 'pointer', 'playful', 'wrapper', 'button', 'magnet'],
    added: '2026-09-18'
  },
  'Micro/CodeSlots': {
    videoUrl: '/assets/video/codeslots.webm',
    description: 'One-time code input whose digits spring into their slots, with paste and SMS autofill.',
    category: 'Micro',
    name: 'CodeSlots',
    docsUrl: 'https://reactbits.dev/micro/code-slots',
    tags: ['input', 'otp', 'form', 'spring', 'code'],
    added: '2026-09-18'
  },
  'Micro/WakeSlider': {
    videoUrl: '/assets/video/wakeslider.webm',
    description: 'Thumbless range slider of thin bars where drag speed raises a wake behind the handle.',
    category: 'Micro',
    name: 'WakeSlider',
    docsUrl: 'https://reactbits.dev/micro/wake-slider',
    tags: ['slider', 'range', 'input', 'drag', 'bars', 'velocity'],
    added: '2026-09-18'
  },
  'Micro/CometDial': {
    videoUrl: '/assets/video/cometdial.webm',
    description: 'Tick-ring dial you flick by angle, with a comet that streaks behind the lit head.',
    category: 'Micro',
    name: 'CometDial',
    docsUrl: 'https://reactbits.dev/micro/comet-dial',
    tags: ['dial', 'knob', 'gauge', 'drag', 'spring', 'input'],
    added: '2026-09-18'
  },
  'Micro/JellyRadio': {
    videoUrl: '/assets/video/jellyradio.webm',
    description: 'Radio group of chips where the chosen one swells and barges its neighbours outward.',
    category: 'Micro',
    name: 'JellyRadio',
    docsUrl: 'https://reactbits.dev/micro/jelly-radio',
    tags: ['radio', 'select', 'chips', 'spring', 'form', 'segmented'],
    added: '2026-09-18'
  },
  'Micro/SwipeRow': {
    videoUrl: '/assets/video/swiperow.webm',
    description: 'List row that swipes open to reveal actions and deletes on a full swipe.',
    category: 'Micro',
    name: 'SwipeRow',
    docsUrl: 'https://reactbits.dev/micro/swipe-row',
    tags: ['swipe', 'list', 'gesture', 'delete', 'drag'],
    added: '2026-09-18'
  },
  'Micro/GlideSelect': {
    videoUrl: '/assets/video/glideselect.webm',
    description: 'Select chip whose menu pops from its corner and whose highlight glides between rows.',
    category: 'Micro',
    name: 'GlideSelect',
    docsUrl: 'https://reactbits.dev/micro/glide-select',
    tags: ['select', 'dropdown', 'menu', 'popover', 'hover', 'form', 'keyboard'],
    added: '2026-09-18'
  },
  'Micro/StatusMark': {
    videoUrl: '/assets/video/statusmark.webm',
    description: 'Agent task status glyph that morphs from an idle ring to a progress arc, then a check.',
    category: 'Micro',
    name: 'StatusMark',
    docsUrl: 'https://reactbits.dev/micro/status-mark',
    tags: ['status', 'progress', 'spinner', 'check', 'ai', 'agent', 'task', 'svg'],
    added: '2026-09-18'
  },
  'Micro/CallChip': {
    videoUrl: '/assets/video/callchip.webm',
    description: 'Tool-call chip whose fill wipes across as a live timer ticks, ending green or shaking red.',
    category: 'Micro',
    name: 'CallChip',
    docsUrl: 'https://reactbits.dev/micro/call-chip',
    tags: ['chip', 'status', 'ai', 'agent', 'tool-call', 'progress', 'timer'],
    added: '2026-09-18'
  },
  'Micro/BellToggle': {
    videoUrl: '/assets/video/belltoggle.webm',
    description: 'Pill toggle where a press rings the bell, crossfades the label and unfurls the pill.',
    category: 'Micro',
    name: 'BellToggle',
    docsUrl: 'https://reactbits.dev/micro/bell-toggle',
    tags: ['toggle', 'button', 'bell', 'notify', 'press', 'spring'],
    added: '2026-09-18'
  },
  'Micro/SlingButton': {
    videoUrl: '/assets/video/slingbutton.webm',
    description: 'Send button you pull back like a slingshot and release to fire.',
    category: 'Micro',
    name: 'SlingButton',
    docsUrl: 'https://reactbits.dev/micro/sling-button',
    tags: ['button', 'send', 'slingshot', 'drag', 'gesture', 'spring'],
    added: '2026-09-18'
  },
  'Micro/SwipeToast': {
    videoUrl: '/assets/video/swipetoast.webm',
    description: 'Toast that swipes down to dismiss and burns a thin fuse for its remaining time.',
    category: 'Micro',
    name: 'SwipeToast',
    docsUrl: 'https://reactbits.dev/micro/swipe-toast',
    tags: ['toast', 'notification', 'swipe', 'drag', 'timer', 'undo'],
    added: '2026-09-18'
  },
  'Micro/PromptBar': {
    videoUrl: '/assets/video/promptbar.webm',
    description: 'Chat composer with @ sources, / commands, a model picker, dictation and attachments.',
    category: 'Micro',
    name: 'PromptBar',
    docsUrl: 'https://reactbits.dev/micro/prompt-bar',
    tags: ['composer', 'prompt', 'chat', 'ai', 'input', 'send', 'stop', 'menu', 'mention', 'command'],
    added: '2026-09-18'
  },
  'Micro/SloshGauge': {
    videoUrl: '/assets/video/sloshgauge.webm',
    description: 'Tank gauge whose liquid chases the value, tilts as it moves and splashes when it fills.',
    category: 'Micro',
    name: 'SloshGauge',
    docsUrl: 'https://reactbits.dev/micro/slosh-gauge',
    tags: ['gauge', 'meter', 'progress', 'liquid', 'spring', 'physics', 'slider'],
    added: '2026-09-18'
  },
  'Micro/VoicePill': {
    videoUrl: '/assets/video/voicepill.webm',
    description: 'Mic button that swells into a capsule of live equalizer bars and a timer while recording.',
    category: 'Micro',
    name: 'VoicePill',
    docsUrl: 'https://reactbits.dev/micro/voice-pill',
    tags: ['mic', 'voice', 'dictation', 'equalizer', 'press', 'ai'],
    added: '2026-09-18'
  },
  'Micro/ThoughtLine': {
    videoUrl: '/assets/video/thoughtline.webm',
    description: 'Reasoning trace header with a live clock that folds its steps into one line when done.',
    category: 'Micro',
    name: 'ThoughtLine',
    docsUrl: 'https://reactbits.dev/micro/thought-line',
    tags: ['ai', 'agent', 'status', 'reasoning', 'timer', 'text', 'trace'],
    added: '2026-09-18'
  },
  'Micro/RefineFrame': {
    videoUrl: '/assets/video/refineframe.webm',
    description: 'Media frame that steps an image through generation stages without any layout shift.',
    category: 'Micro',
    name: 'RefineFrame',
    docsUrl: 'https://reactbits.dev/micro/refine-frame',
    tags: ['ai', 'image', 'generation', 'loading', 'progressive', 'media', 'status'],
    added: '2026-09-18'
  },
  'Micro/FolderFloat': {
    videoUrl: '/assets/video/folderfloat.webm',
    description: 'Folder whose notes spring out into a floating cloud when it opens on hover or press.',
    category: 'Micro',
    name: 'FolderFloat',
    docsUrl: 'https://reactbits.dev/micro/folder-float',
    tags: ['folder', 'menu', 'hover', 'select', 'float', 'spring', 'files'],
    added: '2026-09-18'
  },
  'Micro/BranchedMenu': {
    videoUrl: '/assets/video/branchedmenu.webm',
    description: 'Collapsible menu that branches each section from a trunk and traces a line to your pick.',
    category: 'Micro',
    name: 'BranchedMenu',
    docsUrl: 'https://reactbits.dev/micro/branched-menu',
    tags: ['menu', 'navigation', 'sidebar', 'tree', 'collapsible', 'line', 'active'],
    added: '2026-09-18'
  },
  'Micro/FlipCard': {
    videoUrl: '/assets/video/flipcard.webm',
    description: 'Two-faced card that flips in 3D on a click, drag or flick and settles on a spring.',
    category: 'Micro',
    name: 'FlipCard',
    docsUrl: 'https://reactbits.dev/micro/flip-card',
    tags: ['card', 'flip', '3d', 'tilt', 'drag', 'spring', 'hover', 'two-sided'],
    added: '2026-09-19'
  },
  'Micro/TearTicket': {
    videoUrl: '/assets/video/tearticket.webm',
    description: 'Ticket whose perforated stub tears off by hand, fibre by fibre, and drops away.',
    category: 'Micro',
    name: 'TearTicket',
    docsUrl: 'https://reactbits.dev/micro/tear-ticket',
    tags: ['ticket', 'tear', 'perforation', 'stub', 'coupon', 'pass', 'drag', 'parallax', 'tilt'],
    added: '2026-09-19'
  },
  'Micro/PaperCrumple': {
    videoUrl: '/assets/video/papercrumple.webm',
    description: 'An image that crumples into a textured 3D sheet while you hold and drag it.',
    category: 'Micro',
    name: 'PaperCrumple',
    docsUrl: 'https://reactbits.dev/micro/paper-crumple',
    tags: ['paper', 'crumple', '3d', 'three', 'image', 'drag', 'hold', 'fold', 'crease'],
    added: '2026-09-20'
  },
  'Micro/Shredder': {
    videoUrl: '/assets/video/shredder.webm',
    description: 'A list with a paper shredder at the bottom that cuts dragged rows into curling strips.',
    category: 'Micro',
    name: 'Shredder',
    docsUrl: 'https://reactbits.dev/micro/shredder',
    tags: ['shredder', 'delete', 'drag', 'list', 'strips', 'paper', 'physics', 'remove'],
    added: '2026-09-22'
  }
};

export default componentMetadata;
