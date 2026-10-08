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
    description: 'Wrapper that animates any children on scroll or mount with configurable direction, distance, duration, easing and disappear options.',
    category: 'Animations',
    name: 'AnimatedContent',
    docsUrl: 'https://reactbits.dev/animations/animated-content',
    tags: [],
    added: '2025-01-05'
  },
  'Animations/BlobCursor': {
    videoUrl: '/assets/video/blobcursor.webm',
    description: 'Organic blob cursor that smoothly follows the pointer with inertia and elastic morphing.',
    category: 'Animations',
    name: 'BlobCursor',
    docsUrl: 'https://reactbits.dev/animations/blob-cursor',
    tags: [],
    added: '2024-08-06'
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
    description: 'Custom crosshair cursor with tracking, and link hover effects.',
    category: 'Animations',
    name: 'Crosshair',
    docsUrl: 'https://reactbits.dev/animations/crosshair',
    tags: [],
    added: '2024-08-12'
  },
  'Animations/Cubes': {
    videoUrl: '/assets/video/cubes.webm',
    description: '3D rotating cube cluster. Supports auto-rotation or hover interaction.',
    category: 'Animations',
    name: 'Cubes',
    docsUrl: 'https://reactbits.dev/animations/cubes',
    tags: [],
    added: '2025-06-17'
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
    description: 'Adds a realistic moving glare highlight on hover over any element.',
    category: 'Animations',
    name: 'GlareHover',
    docsUrl: 'https://reactbits.dev/animations/glare-hover',
    tags: [],
    added: '2025-05-30'
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
    description:
      'A glass ball held together by a crackling electric rim, with a bowl of glowing dust inside that swirls in the cursor wake, shakes on click and lights up on mount, all from one color.',
    category: 'Animations',
    name: 'CrystalizedBall',
    docsUrl: 'https://reactbits.dev/animations/crystalized-ball',
    tags: ['webgl', 'ogl', 'orb', 'electric', 'particles', 'glow', 'interactive'],
    added: '2026-10-06'
  },
  'Animations/ElectricLogo': {
    videoUrl: '/assets/video/electriclogo.webm',
    description:
      'Turns any SVG or PNG into a living lightning outline, with flowing strands, arcs that leap off the edges and a charge that follows the cursor.',
    category: 'Animations',
    name: 'ElectricLogo',
    docsUrl: 'https://reactbits.dev/animations/electric-logo',
    tags: [],
    added: '2026-09-25',
    updates: [{ date: '2026-09-28', note: 'Added an onRender callback for capturing live frames and reflection effects.' }]
  },
  'Animations/DitherVeil': {
    videoUrl: '/assets/video/ditherveil.webm',
    description:
      'A photo printed as a 1-bit dither that the cursor burns through to full colour, leaving a trail that knits back cell by cell.',
    category: 'Animations',
    name: 'DitherVeil',
    docsUrl: 'https://reactbits.dev/animations/dither-veil',
    tags: [],
    added: '2026-09-23'
  },
  'Animations/GlowCursor': {
    videoUrl: '/assets/video/glowcursor.webm',
    description: 'Shader-powered light trail that smoothly follows the pointer with customizable glow, color, taper and pulse.',
    category: 'Animations',
    name: 'GlowCursor',
    docsUrl: 'https://reactbits.dev/animations/glow-cursor',
    tags: [],
    added: '2026-08-26'
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
    description: 'Liquid metaball blobs that merge and separate with smooth implicit surface animation.',
    category: 'Animations',
    name: 'MetaBalls',
    docsUrl: 'https://reactbits.dev/animations/meta-balls',
    tags: [],
    added: '2025-02-12'
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
    description: 'Liquid metallic paint shader which can be applied to SVG elements.',
    category: 'Animations',
    name: 'MetallicPaint',
    docsUrl: 'https://reactbits.dev/animations/metallic-paint',
    tags: [],
    added: '2025-02-22'
  },
  'Animations/Noise': {
    videoUrl: '/assets/video/noise.webm',
    description: 'Animated film grain / noise overlay adding subtle texture and motion.',
    category: 'Animations',
    name: 'Noise',
    docsUrl: 'https://reactbits.dev/animations/noise',
    tags: [],
    added: '2025-01-06'
  },
  'Animations/PixelTrail': {
    videoUrl: '/assets/video/pixeltrail.webm',
    description: 'Pixelated cursor trail emitting fading squares with retro digital feel.',
    category: 'Animations',
    name: 'PixelTrail',
    docsUrl: 'https://reactbits.dev/animations/pixel-trail',
    tags: [],
    added: '2025-02-01'
  },
  'Animations/PixelTransition': {
    videoUrl: '/assets/video/pixeltransition.webm',
    description: 'Pixel dissolve transition for content reveal on hover.',
    category: 'Animations',
    name: 'PixelTransition',
    docsUrl: 'https://reactbits.dev/animations/pixel-transition',
    tags: [],
    added: '2025-01-21'
  },
  'Animations/PixelSwap': {
    videoUrl: '/assets/video/pixelswap.webm',
    description: 'Pixel fragments assemble into a full cover, swap arbitrary content, then dissolve away with reversible colors and triggers.',
    category: 'Animations',
    name: 'PixelSwap',
    docsUrl: 'https://reactbits.dev/animations/pixel-swap',
    tags: [],
    added: '2026-08-12'
  },
  'Animations/Ribbons': {
    videoUrl: '/assets/video/ribbons.webm',
    description: 'Flowing responsive ribbons/cursor trail driven by physics and pointer motion.',
    category: 'Animations',
    name: 'Ribbons',
    docsUrl: 'https://reactbits.dev/animations/ribbons',
    tags: [],
    added: '2025-02-09'
  },
  'Animations/ShapeBlur': {
    videoUrl: '/assets/video/shapeblur.webm',
    description: 'Morphing blurred geometric shape. The effect occurs on hover.',
    category: 'Animations',
    name: 'ShapeBlur',
    docsUrl: 'https://reactbits.dev/animations/shape-blur',
    tags: [],
    added: '2025-01-26'
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
    description: 'Animated star / sparkle border orbiting content with twinkle pulses.',
    category: 'Animations',
    name: 'StarBorder',
    docsUrl: 'https://reactbits.dev/animations/star-border',
    tags: [],
    added: '2024-08-18'
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
    description: 'A cursor follow animation with 4 corners that lock onto targets.',
    category: 'Animations',
    name: 'TargetCursor',
    docsUrl: 'https://reactbits.dev/animations/target-cursor',
    tags: [],
    added: '2025-07-18'
  },
  'Animations/LaserFlow': {
    videoUrl: '/assets/video/laserflow.webm',
    description: 'Dynamic laser light that flows onto a surface, customizable effect.',
    category: 'Animations',
    name: 'LaserFlow',
    docsUrl: 'https://reactbits.dev/animations/laser-flow',
    tags: [],
    added: '2025-09-09'
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
    description: 'Renders text with an animated ASCII background for a retro feel.',
    category: 'TextAnimations',
    name: 'ASCIIText',
    docsUrl: 'https://reactbits.dev/text-animations/ascii-text',
    tags: [],
    added: '2025-01-20'
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
    description: 'Animated gradient sweep across live text with speed and color control.',
    category: 'TextAnimations',
    name: 'GradientText',
    docsUrl: 'https://reactbits.dev/text-animations/gradient-text',
    tags: [],
    added: '2024-08-12'
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
    description: 'Metallic sheen sweeps across text producing a reflective highlight.',
    category: 'TextAnimations',
    name: 'ShinyText',
    docsUrl: 'https://reactbits.dev/text-animations/shiny-text',
    tags: [],
    added: '2024-08-12'
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
    description: 'Make any text element follow your cursor, leaving a trail of copies behind it.',
    category: 'TextAnimations',
    name: 'TextCursor',
    docsUrl: 'https://reactbits.dev/text-animations/text-cursor',
    tags: [],
    added: '2025-03-18'
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
    description:
      'A wordmark whose letters turn into dashed vector paths under the cursor. Grab any letter to drag it off the baseline and it springs back home.',
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
    description: 'A large headline with a drifting colour mesh or image showing through the glyphs, revealed word by word.',
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
    description: 'List items enter with staggered motion variants for polished reveals.',
    category: 'Components',
    name: 'AnimatedList',
    docsUrl: 'https://reactbits.dev/components/animated-list',
    tags: [],
    added: '2025-02-23'
  },
  'Components/BounceCards': {
    videoUrl: '/assets/video/bouncecards.webm',
    description: 'Cards bounce that bounce in on mount.',
    category: 'Components',
    name: 'BounceCards',
    docsUrl: 'https://reactbits.dev/components/bounce-cards',
    tags: [],
    added: '2025-01-02'
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
    description: 'Cards animate position swapping with smooth layout transitions.',
    category: 'Components',
    name: 'CardSwap',
    docsUrl: 'https://reactbits.dev/components/card-swap',
    tags: [],
    added: '2025-06-02'
  },
  'Components/Carousel': {
    videoUrl: '/assets/video/carousel.webm',
    description: 'Responsive carousel with touch gestures, looping and transitions.',
    category: 'Components',
    name: 'Carousel',
    docsUrl: 'https://reactbits.dev/components/carousel',
    tags: [],
    added: '2025-02-13'
  },
  'Components/ChromaGrid': {
    videoUrl: '/assets/video/chromagrid.webm',
    description: 'A responsive grid of grayscale tiles. Hovering the grid reaveals their colors.',
    category: 'Components',
    name: 'ChromaGrid',
    docsUrl: 'https://reactbits.dev/components/chroma-grid',
    tags: [],
    added: '2025-05-30'
  },
  'Components/CircularCarousel': {
    videoUrl: '/assets/video/circularcarousel.webm',
    description:
      'A 3D ring of images with four layouts, bendable cards, depth fade, momentum drag, snapping and click to focus.',
    category: 'Components',
    name: 'CircularCarousel',
    docsUrl: 'https://reactbits.dev/components/circular-carousel',
    tags: [],
    added: '2026-09-29'
  },
  'Components/FlexCarousel': {
    videoUrl: '/assets/video/flexcarousel.webm',
    description:
      'An infinite image row that flows through invisible liquid glass at its edges, with four bend presets, five entrances, a speed squeeze and click to focus.',
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
    description: 'Hover parallax effect that disintegrates the content of a card.',
    category: 'Components',
    name: 'DecayCard',
    docsUrl: 'https://reactbits.dev/components/decay-card',
    tags: [],
    added: '2024-08-20'
  },
  'Components/Dock': {
    videoUrl: '/assets/video/dock.webm',
    description: 'macOS style magnifying dock with proximity scaling of icons.',
    category: 'Components',
    name: 'Dock',
    docsUrl: 'https://reactbits.dev/components/dock',
    tags: [],
    added: '2024-08-08'
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
    description: '3D posters rotate on scroll infinitely.',
    category: 'Components',
    name: 'FlyingPosters',
    docsUrl: 'https://reactbits.dev/components/flying-posters',
    tags: [],
    added: '2025-01-29'
  },
  'Components/Folder': {
    videoUrl: '/assets/video/folder.webm',
    description: 'Interactive folder opens to reveal nested content smooth motion.',
    category: 'Components',
    name: 'Folder',
    docsUrl: 'https://reactbits.dev/components/folder',
    tags: [],
    added: '2025-02-28'
  },
  'Components/GlassIcons': {
    videoUrl: '/assets/video/glassicons.webm',
    description: 'Icon set styled with frosted glass blur.',
    category: 'Components',
    name: 'GlassIcons',
    docsUrl: 'https://reactbits.dev/components/glass-icons',
    tags: [],
    added: '2025-02-18'
  },
  'Components/GlassSurface': {
    videoUrl: '/assets/video/glasssurface.webm',
    description: 'Advanced Apple-style glass surface with real-time distortion + lighting.',
    category: 'Components',
    name: 'GlassSurface',
    docsUrl: 'https://reactbits.dev/components/glass-surface',
    tags: [],
    added: '2025-07-19'
  },
  'Components/GooeyNav': {
    videoUrl: '/assets/video/gooeynav.webm',
    description: 'Navigation indicator morphs with gooey blob transitions between items.',
    category: 'Components',
    name: 'GooeyNav',
    docsUrl: 'https://reactbits.dev/components/gooey-nav',
    tags: [],
    added: '2025-03-14'
  },
  'Components/InfiniteSpiral': {
    videoUrl: '/assets/video/infinitespiral.webm',
    description: 'An endlessly looping 3D helix of images with customizable motion, depth, spacing and interaction.',
    category: 'Components',
    name: 'InfiniteSpiral',
    docsUrl: 'https://reactbits.dev/components/infinite-spiral',
    tags: [],
    added: '2026-08-29'
  },
  'Components/InfiniteMenu': {
    videoUrl: '/assets/video/infinitemenu.webm',
    description: 'Horizontally looping menu effect that scrolls endlessly with seamless wrap.',
    category: 'Components',
    name: 'InfiniteMenu',
    docsUrl: 'https://reactbits.dev/components/infinite-menu',
    tags: [],
    added: '2025-01-28'
  },
  'Components/Lanyard': {
    videoUrl: '/assets/video/lanyard.webm',
    description:
      'Swinging 3D badge on a stretchy woven band. Print any image on the front, back and band, then drag, stretch, throw or click to flip it.',
    category: 'Components',
    name: 'Lanyard',
    docsUrl: 'https://reactbits.dev/components/lanyard',
    tags: [],
    added: '2025-02-15',
    updates: [
      {
        date: '2026-10-08',
        note: 'Rebuilt with three as the only dependency and no model, texture or config setup. Pass any image for the front, back and band. The card swings with real momentum, the woven band stretches and slingshots it back, a click flips it over, and a new holographic finish adds a sparkling foil.'
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
    description: 'Three.js model viewer with orbit controls and lighting presets.',
    category: 'Components',
    name: 'ModelViewer',
    docsUrl: 'https://reactbits.dev/components/model-viewer',
    tags: [],
    added: '2025-06-13'
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
    description: 'Animated profile card glare with 3D hover effect.',
    category: 'Components',
    name: 'ProfileCard',
    docsUrl: 'https://reactbits.dev/components/profile-card',
    tags: [],
    added: '2025-06-01'
  },
  'Components/ScrollStack': {
    videoUrl: '/assets/video/scrollstack.webm',
    description: 'Overlapping card stack reveals on scroll with depth layering.',
    category: 'Components',
    name: 'ScrollStack',
    docsUrl: 'https://reactbits.dev/components/scroll-stack',
    tags: [],
    added: '2025-07-15'
  },
  'Components/SpotlightCard': {
    videoUrl: '/assets/video/spotlightcard.webm',
    description: 'Dynamic spotlight follows cursor casting gradient illumination.',
    category: 'Components',
    name: 'SpotlightCard',
    docsUrl: 'https://reactbits.dev/components/spotlight-card',
    tags: [],
    added: '2024-08-14'
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
    description: 'Curved option picker that spins via scroll, drag, or arrow keys, fading and tilting items away from the selection.',
    category: 'Components',
    name: 'OptionWheel',
    docsUrl: 'https://reactbits.dev/components/option-wheel',
    tags: [],
    added: '2026-07-14'
  },
  'Components/SpecularButton': {
    videoUrl: '/assets/video/specularbutton.webm',
    description: 'Glass button with a shader-driven specular rim light that sweeps around the edge and follows the cursor.',
    category: 'Components',
    name: 'SpecularButton',
    docsUrl: 'https://reactbits.dev/components/specular-button',
    tags: [],
    added: '2026-07-14'
  },
  'Animations/ElasticMesh': {
    videoUrl: '/assets/video/elasticmesh.webm',
    description: 'Spring-mesh surface that stretches under the pointer and settles back with damped physics.',
    category: 'Animations',
    name: 'ElasticMesh',
    docsUrl: 'https://reactbits.dev/animations/elastic-mesh',
    tags: [],
    added: '2026-08-04'
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
    description: 'Print-style halftone dot matrix that resolves into sharp content around the cursor.',
    category: 'Animations',
    name: 'HalftoneReveal',
    docsUrl: 'https://reactbits.dev/animations/halftone-reveal',
    tags: [],
    added: '2026-08-04'
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
    description: 'Layered stack with swipe animations, autoplay and smooth transitions.',
    category: 'Components',
    name: 'Stack',
    docsUrl: 'https://reactbits.dev/components/stack',
    tags: [],
    added: '2024-08-07'
  },
  'Components/Stepper': {
    videoUrl: '/assets/video/stepper.webm',
    description: 'Animated multi-step progress indicator with active state transitions.',
    category: 'Components',
    name: 'Stepper',
    docsUrl: 'https://reactbits.dev/components/stepper',
    tags: [],
    added: '2025-02-04'
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
    description:
      'A lit halftone surface of dots, lines, crosses or glyphs that moves like draped silk, rolling swells or ripples, with six presets, one-color theming and a cursor that sends ripples through it.',
    category: 'Backgrounds',
    name: 'PatternWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/pattern-waves',
    tags: ['webgl', 'ogl', 'halftone', 'pattern', 'waves', 'ascii', 'interactive', 'procedural'],
    added: '2026-09-30'
  },
  'Backgrounds/MicroSlats': {
    videoUrl: '/assets/video/microslats.webm',
    description:
      'A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests, four presets, a real fluid the cursor stirs and an intro that rolls in from the horizon.',
    category: 'Backgrounds',
    name: 'MicroSlats',
    docsUrl: 'https://reactbits.dev/backgrounds/micro-slats',
    tags: ['webgl', 'ogl', 'grid', 'waves', 'interactive', 'procedural'],
    added: '2026-09-27'
  },
  'Backgrounds/ShapeWaves': {
    videoUrl: '/assets/video/shapewaves.webm',
    description:
      'A WebGPU field of triangles, circles and squares that brighten and grow along rolling waves, with an optional text cutout the waves flow around.',
    category: 'Backgrounds',
    name: 'ShapeWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/shape-waves',
    tags: ['webgpu', 'vgpu', 'grid', 'shapes', 'text', 'procedural'],
    added: '2026-09-15',
    updates: [{ date: '2026-10-06', note: 'Centered text cutouts using actual glyph bounds.' }]
  },
  'Backgrounds/AeroShards': {
    videoUrl: '/assets/video/aeroshards.webm',
    description: 'A GPU-driven wind sculpture of folded foil shards with crisp detail, content-safe placements, and responsive pointer interactions.',
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
    added: '2026-08-29'
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
    description: 'Crossing animated ribbons with customizable properties.',
    category: 'Backgrounds',
    name: 'Beams',
    docsUrl: 'https://reactbits.dev/backgrounds/beams',
    tags: [],
    added: '2025-05-27'
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
    description: 'Subtle dark background with a smooth animation and postprocessing.',
    category: 'Backgrounds',
    name: 'DarkVeil',
    docsUrl: 'https://reactbits.dev/backgrounds/dark-veil',
    tags: [],
    added: '2025-07-16'
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
    description: 'Animated dot grid with cursor interactions.',
    category: 'Backgrounds',
    name: 'DotGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/dot-grid',
    tags: [],
    added: '2025-05-23'
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
    description: 'A grid of soft glowing bars rippling like a slatted equalizer.',
    category: 'Backgrounds',
    name: 'SlicedWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/sliced-waves',
    tags: [],
    added: '2026-08-04'
  },
  'Backgrounds/AcidSquares': {
    videoUrl: '/assets/video/acidsquares.webm',
    description: 'A crystalline corridor of stacked squares receding into depth.',
    category: 'Backgrounds',
    name: 'AcidSquares',
    docsUrl: 'https://reactbits.dev/backgrounds/acid-squares',
    tags: [],
    added: '2026-08-04'
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
    description: 'Warped grid mesh distorts smoothly reacting to cursor.',
    category: 'Backgrounds',
    name: 'GridDistortion',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-distortion',
    tags: [],
    added: '2025-01-25'
  },
  'Backgrounds/GridMotion': {
    videoUrl: '/assets/video/gridmotion.webm',
    description: 'Perspective moving grid lines based on cusror position.',
    category: 'Backgrounds',
    name: 'GridMotion',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-motion',
    tags: [],
    added: '2024-08-18'
  },
  'Backgrounds/Hyperspeed': {
    videoUrl: '/assets/video/hyperspeed.webm',
    description: 'Animated lines continuously moving to simulate hyperspace travel on click hold.',
    category: 'Backgrounds',
    name: 'Hyperspeed',
    docsUrl: 'https://reactbits.dev/backgrounds/hyperspeed',
    tags: [],
    added: '2024-08-14'
  },
  'Backgrounds/Iridescence': {
    videoUrl: '/assets/video/iridescence.webm',
    description: 'Slick iridescent shader with shifting waves.',
    category: 'Backgrounds',
    name: 'Iridescence',
    docsUrl: 'https://reactbits.dev/backgrounds/iridescence',
    tags: [],
    added: '2025-02-05'
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
    description: 'Procedural lightning bolts with branching and glow flicker.',
    category: 'Backgrounds',
    name: 'Lightning',
    docsUrl: 'https://reactbits.dev/backgrounds/lightning',
    tags: [],
    added: '2025-02-25'
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
    description: 'Radar sweep effect with concentric rings, radial spokes, and a rotating beam.',
    category: 'Backgrounds',
    name: 'Radar',
    docsUrl: 'https://reactbits.dev/backgrounds/radar',
    tags: [],
    added: '2026-03-17'
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
    description: 'Organic plasma gradients swirl + morph with smooth turbulence.',
    category: 'Backgrounds',
    name: 'Plasma',
    docsUrl: 'https://reactbits.dev/backgrounds/plasma',
    tags: [],
    added: '2025-08-18'
  },
  'Backgrounds/PlasmaWave': {
    videoUrl: '/assets/video/plasmawave.webm',
    description: 'Raymarched plasma waves with dual-wave interference and OGL.',
    category: 'Backgrounds',
    name: 'PlasmaWave',
    docsUrl: 'https://reactbits.dev/backgrounds/plasma-wave',
    tags: [],
    added: '2026-04-14'
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
    description: 'A grid that continuously animates with a ripple effect.',
    category: 'Backgrounds',
    name: 'RippleGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/ripple-grid',
    tags: [],
    added: '2025-07-14'
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
    description: 'Animated pattern of lines forming a fabric-like motion.',
    category: 'Backgrounds',
    name: 'Threads',
    docsUrl: 'https://reactbits.dev/backgrounds/threads',
    tags: [],
    added: '2025-02-18'
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
    description: 'Falling pixelated snow effect with customizable density and speed.',
    category: 'Backgrounds',
    name: 'PixelSnow',
    docsUrl: 'https://reactbits.dev/backgrounds/pixel-snow',
    tags: [],
    added: '2025-12-20'
  },

  //! Micro ------------------------------------------------------------------------------------------------------------------------------------

  'Micro/SquishSwitch': {
    videoUrl: '/assets/video/squishswitch.webm',
    description:
      'Drag-scrubbable switch whose thumb stretches by how fast it moves, flips at the midpoint and squashes against the track end on a flick.',
    category: 'Micro',
    name: 'SquishSwitch',
    docsUrl: 'https://reactbits.dev/micro/squish-switch',
    tags: ['switch', 'toggle', 'spring', 'drag', 'gesture', 'form'],
    added: '2026-09-18'
  },
  'Micro/HoldButton': {
    videoUrl: '/assets/video/holdbutton.webm',
    description:
      'Hold-to-confirm button whose liquid fill rises while pressed, snaps back on an early release and swaps its label through a blur when the hold completes.',
    category: 'Micro',
    name: 'HoldButton',
    docsUrl: 'https://reactbits.dev/micro/hold-button',
    tags: ['button', 'confirm', 'hold', 'press', 'destructive'],
    added: '2026-09-18'
  },
  'Micro/PeekRating': {
    videoUrl: '/assets/video/peekrating.webm',
    description:
      'Star rating you can try before you commit: sweeping the row lifts a trailing wave of stars up to the pointer while a tip hops along with the label; a click commits with a pop.',
    category: 'Micro',
    name: 'PeekRating',
    docsUrl: 'https://reactbits.dev/micro/peek-rating',
    tags: ['rating', 'stars', 'hover', 'preview', 'feedback', 'form'],
    added: '2026-09-18'
  },
  'Micro/SpringCheck': {
    videoUrl: '/assets/video/springcheck.webm',
    description:
      'Checkbox row where a single spring fills the box, draws the tick, strikes the label and dims the words in one press.',
    category: 'Micro',
    name: 'SpringCheck',
    docsUrl: 'https://reactbits.dev/micro/spring-check',
    tags: ['checkbox', 'toggle', 'form', 'spring', 'press', 'strikethrough'],
    added: '2026-09-18'
  },
  'Micro/PulseHeart': {
    videoUrl: '/assets/video/pulseheart.webm',
    description:
      'Like button that contracts to a dot, flips colour at its smallest frame and pulses back while the count swaps one glyph.',
    category: 'Micro',
    name: 'PulseHeart',
    docsUrl: 'https://reactbits.dev/micro/pulse-heart',
    tags: ['like', 'heart', 'button', 'reaction', 'counter', 'press'],
    added: '2026-09-18'
  },
  'Micro/RubberSegment': {
    videoUrl: '/assets/video/rubbersegment.webm',
    description:
      'Segmented control with a rubber thumb: taps stretch it across the gap and squash it onto the target, and you can grab, drag and flick it between slots.',
    category: 'Micro',
    name: 'RubberSegment',
    docsUrl: 'https://reactbits.dev/micro/rubber-segment',
    tags: ['segmented', 'tabs', 'drag', 'spring', 'clip-path', 'radio'],
    added: '2026-09-18'
  },
  'Micro/SlideCommit': {
    videoUrl: '/assets/video/slidecommit.webm',
    description:
      'Slide-to-confirm handle that plants with a spinner while your action runs, unfurls into a done pill on success and springs home with a squash and shake on failure.',
    category: 'Micro',
    name: 'SlideCommit',
    docsUrl: 'https://reactbits.dev/micro/slide-commit',
    tags: ['slide', 'confirm', 'async', 'gesture', 'drag', 'button'],
    added: '2026-09-18'
  },
  'Micro/WarmTooltip': {
    videoUrl: '/assets/video/warmtooltip.webm',
    description:
      'Tooltip group with one shared delay: the first label waits and pops from its trigger, then siblings open instantly while the group is warm, with an optional velocity lean.',
    category: 'Micro',
    name: 'WarmTooltip',
    docsUrl: 'https://reactbits.dev/micro/warm-tooltip',
    tags: ['tooltip', 'hover', 'toolbar', 'delay', 'group', 'label'],
    added: '2026-09-18'
  },
  'Micro/FuseButton': {
    videoUrl: '/assets/video/fusebutton.webm',
    description:
      'Action button whose done state carries its own undo on a burning fuse: press, the label crossfades to Undo, a hairline burns for the undo window, and Undo or Escape runs it back.',
    category: 'Micro',
    name: 'FuseButton',
    docsUrl: 'https://reactbits.dev/micro/fuse-button',
    tags: ['button', 'undo', 'confirm', 'timer', 'press', 'fuse'],
    added: '2026-09-18'
  },
  'Micro/ScrubField': {
    videoUrl: '/assets/video/scrubfield.webm',
    description:
      'Number chip you drag to scrub: the value follows the hand, pushes past the range on a rubber band, and a click without moving opens it for typing.',
    category: 'Micro',
    name: 'ScrubField',
    docsUrl: 'https://reactbits.dev/micro/scrub-field',
    tags: ['input', 'number', 'drag', 'scrub', 'form', 'inspector'],
    added: '2026-09-18'
  },
  'Micro/LatticeLoader': {
    videoUrl: '/assets/video/latticeloader.webm',
    description:
      'Inline agent-status row: a 3x3 or 4x4 lattice whose cells brighten in a phase-offset wave beside a verb and a live stopwatch, resolving into a check or a cross when the task ends.',
    category: 'Micro',
    name: 'LatticeLoader',
    docsUrl: 'https://reactbits.dev/micro/lattice-loader',
    tags: ['loader', 'status', 'ai', 'agent', 'timer', 'grid'],
    added: '2026-09-18'
  },
  'Micro/DodgeField': {
    videoUrl: '/assets/video/dodgefield.webm',
    description:
      'Wrapper that makes any child flee the pointer inside a bounded field, dodges once per approach, then relents after a few tries and glides home.',
    category: 'Micro',
    name: 'DodgeField',
    docsUrl: 'https://reactbits.dev/micro/dodge-field',
    tags: ['hover', 'pointer', 'playful', 'wrapper', 'button', 'magnet'],
    added: '2026-09-18'
  },
  'Micro/CodeSlots': {
    videoUrl: '/assets/video/codeslots.webm',
    description:
      'One-time-code input where a hidden overlay input owns focus, paste and SMS autofill while each slot lands its digit on one spring: the fill swells from the centre, the digit rises and the caret glides; a wrong code drains the slots in a cascade, a right one merges them into a single accent wash.',
    category: 'Micro',
    name: 'CodeSlots',
    docsUrl: 'https://reactbits.dev/micro/code-slots',
    tags: ['input', 'otp', 'form', 'spring', 'code'],
    added: '2026-09-18'
  },
  'Micro/WakeSlider': {
    videoUrl: '/assets/video/wakeslider.webm',
    description:
      'Range slider drawn as thin bars with no thumb: drag speed raises a wake that trails behind the handle and flattens again at rest.',
    category: 'Micro',
    name: 'WakeSlider',
    docsUrl: 'https://reactbits.dev/micro/wake-slider',
    tags: ['slider', 'range', 'input', 'drag', 'bars', 'velocity'],
    added: '2026-09-18'
  },
  'Micro/CometDial': {
    videoUrl: '/assets/video/cometdial.webm',
    description:
      'Tick-ring dial you flick by angle: the reading launches on a spring and a velocity-driven comet streaks behind the lit head, trailing the direction of travel and vanishing at rest.',
    category: 'Micro',
    name: 'CometDial',
    docsUrl: 'https://reactbits.dev/micro/comet-dial',
    tags: ['dial', 'knob', 'gauge', 'drag', 'spring', 'input'],
    added: '2026-09-18'
  },
  'Micro/JellyRadio': {
    videoUrl: '/assets/video/jellyradio.webm',
    description:
      'Radio group of labelled chips where the chosen one swells wide-then-tall on two springs and barges its neighbours outward with a travelling stagger, so a selection reads as a force moving through the row.',
    category: 'Micro',
    name: 'JellyRadio',
    docsUrl: 'https://reactbits.dev/micro/jelly-radio',
    tags: ['radio', 'select', 'chips', 'spring', 'form', 'segmented'],
    added: '2026-09-18'
  },
  'Micro/SwipeRow': {
    videoUrl: '/assets/video/swiperow.webm',
    description:
      'List row that swipes open to reveal actions, snaps by flick velocity, and deletes on a full swipe that stretches the action colour across the row.',
    category: 'Micro',
    name: 'SwipeRow',
    docsUrl: 'https://reactbits.dev/micro/swipe-row',
    tags: ['swipe', 'list', 'gesture', 'delete', 'drag'],
    added: '2026-09-18'
  },
  'Micro/GlideSelect': {
    videoUrl: '/assets/video/glideselect.webm',
    description:
      'Select chip whose menu pops out of its own corner and whose single hover highlight glides between rows, remembering where you left it so re-entry slides from there instead of blinking in.',
    category: 'Micro',
    name: 'GlideSelect',
    docsUrl: 'https://reactbits.dev/micro/glide-select',
    tags: ['select', 'dropdown', 'menu', 'popover', 'hover', 'form', 'keyboard'],
    added: '2026-09-18'
  },
  'Micro/StatusMark': {
    videoUrl: '/assets/video/statusmark.webm',
    description:
      'A 20px status glyph for agent task lists that morphs in place from a dashed idle ring to a spinning or real-progress arc, then draws a check or a cross, with an optional label strike.',
    category: 'Micro',
    name: 'StatusMark',
    docsUrl: 'https://reactbits.dev/micro/status-mark',
    tags: ['status', 'progress', 'spinner', 'check', 'ai', 'agent', 'task', 'svg'],
    added: '2026-09-18'
  },
  'Micro/CallChip': {
    videoUrl: '/assets/video/callchip.webm',
    description:
      'Inline tool-call chip whose fill wipes across while a live ms counter ticks, completing with a green wash on success or stopping short and shaking red with a retry glyph on error.',
    category: 'Micro',
    name: 'CallChip',
    docsUrl: 'https://reactbits.dev/micro/call-chip',
    tags: ['chip', 'status', 'ai', 'agent', 'tool-call', 'progress', 'timer'],
    added: '2026-09-18'
  },
  'Micro/BellToggle': {
    videoUrl: '/assets/video/belltoggle.webm',
    description:
      'Pill toggle that answers a press at three tempos: the bell rings on damped keyframes, the label blur-crossfades, and the pill unfurls to the longer label through a clip-path on a critically damped spring. The pressed state is the receipt.',
    category: 'Micro',
    name: 'BellToggle',
    docsUrl: 'https://reactbits.dev/micro/bell-toggle',
    tags: ['toggle', 'button', 'bell', 'notify', 'press', 'spring'],
    added: '2026-09-18'
  },
  'Micro/SlingButton': {
    videoUrl: '/assets/video/slingbutton.webm',
    description:
      'Send button you pull back like a slingshot: the band stretches, a power arc arms it, and releasing fires the action with the flick\'s velocity.',
    category: 'Micro',
    name: 'SlingButton',
    docsUrl: 'https://reactbits.dev/micro/sling-button',
    tags: ['button', 'send', 'slingshot', 'drag', 'gesture', 'spring'],
    added: '2026-09-18'
  },
  'Micro/SwipeToast': {
    videoUrl: '/assets/video/swipetoast.webm',
    description:
      'Single toast that rises through its bottom edge, swipes down to dismiss on a flick or a distance, and burns a thin fuse for exactly its remaining time; hover pauses it and an inline mode keeps it inside any container.',
    category: 'Micro',
    name: 'SwipeToast',
    docsUrl: 'https://reactbits.dev/micro/swipe-toast',
    tags: ['toast', 'notification', 'swipe', 'drag', 'timer', 'undo'],
    added: '2026-09-18'
  },
  'Micro/PromptBar': {
    videoUrl: '/assets/video/promptbar.webm',
    description:
      'Chat composer with an @ sources menu, a / commands menu, a model picker, dictation and attachments, whose send tile charges to ink the moment there is something to send and morphs its arrow into a stop square while busy.',
    category: 'Micro',
    name: 'PromptBar',
    docsUrl: 'https://reactbits.dev/micro/prompt-bar',
    tags: ['composer', 'prompt', 'chat', 'ai', 'input', 'send', 'stop', 'menu', 'mention', 'command'],
    added: '2026-09-18'
  },
  'Micro/SloshGauge': {
    videoUrl: '/assets/video/sloshgauge.webm',
    description:
      'Tank gauge whose liquid chases the value with mass, tilts with its own speed and splashes against the top when it slams full; optionally a vertical slider.',
    category: 'Micro',
    name: 'SloshGauge',
    docsUrl: 'https://reactbits.dev/micro/slosh-gauge',
    tags: ['gauge', 'meter', 'progress', 'liquid', 'spring', 'physics', 'slider'],
    added: '2026-09-18'
  },
  'Micro/VoicePill': {
    videoUrl: '/assets/video/voicepill.webm',
    description:
      'Mic button that swells into a tinted capsule of level-driven equalizer bars and an elapsed clock while held or toggled, then relaxes back into the mic on release; simulated voice by default, real microphone as an opt-in.',
    category: 'Micro',
    name: 'VoicePill',
    docsUrl: 'https://reactbits.dev/micro/voice-pill',
    tags: ['mic', 'voice', 'dictation', 'equalizer', 'press', 'ai'],
    added: '2026-09-18'
  },
  'Micro/ThoughtLine': {
    videoUrl: '/assets/video/thoughtline.webm',
    description:
      'Reasoning-trace header: a glyph and a label breathe beside a live clock while steps appear beneath, then the line settles on one beat into "Thought for 4.2s" through a blur crossfade and the trace folds into it.',
    category: 'Micro',
    name: 'ThoughtLine',
    docsUrl: 'https://reactbits.dev/micro/thought-line',
    tags: ['ai', 'agent', 'status', 'reasoning', 'timer', 'text', 'trace'],
    added: '2026-09-18'
  },
  'Micro/RefineFrame': {
    videoUrl: '/assets/video/refineframe.webm',
    description:
      'Reserved-aspect frame that walks any media through queued, generating, refining and complete without layout shift: each stage is one blur, saturate, scale and opacity tween, a soft band sweeps while it works, a chip reports the stage, and an error dims the picture behind a retry pill.',
    category: 'Micro',
    name: 'RefineFrame',
    docsUrl: 'https://reactbits.dev/micro/refine-frame',
    tags: ['ai', 'image', 'generation', 'loading', 'progressive', 'media', 'status'],
    added: '2026-09-18'
  },
  'Micro/FolderFloat': {
    videoUrl: '/assets/video/folderfloat.webm',
    description:
      'Folder that opens on hover or press: the flap tilts toward you, a paper edge rises, and its notes spring out from behind the flap into a floating cloud to pick from, then sink back when the folder closes.',
    category: 'Micro',
    name: 'FolderFloat',
    docsUrl: 'https://reactbits.dev/micro/folder-float',
    tags: ['folder', 'menu', 'hover', 'select', 'float', 'spring', 'files'],
    added: '2026-09-18'
  },
  'Micro/BranchedMenu': {
    videoUrl: '/assets/video/branchedmenu.webm',
    description:
      'Collapsible menu whose sections unfold into a trunk with a curved branch to each child, and an accent line that travels down the trunk and around the curve to whatever you pick, while a marker glides to the open section.',
    category: 'Micro',
    name: 'BranchedMenu',
    docsUrl: 'https://reactbits.dev/micro/branched-menu',
    tags: ['menu', 'navigation', 'sidebar', 'tree', 'collapsible', 'line', 'active'],
    added: '2026-09-18'
  },
  'Micro/FlipCard': {
    videoUrl: '/assets/video/flipcard.webm',
    description:
      'Two-faced card that flips in 3D on a click, a drag or a flick, settling on a spring that carries your release velocity, with an optional cursor tilt, a sheen that follows the pointer and a shadow that narrows as it turns edge on.',
    category: 'Micro',
    name: 'FlipCard',
    docsUrl: 'https://reactbits.dev/micro/flip-card',
    tags: ['card', 'flip', '3d', 'tilt', 'drag', 'spring', 'hover', 'two-sided'],
    added: '2026-09-19'
  },
  'Micro/TearTicket': {
    videoUrl: '/assets/video/tearticket.webm',
    description:
      'Ticket whose perforated stub tears off by hand: paper bridges stretch into fibres and snap one by one from the far end, the torn edges are jagged and fit each other, the freed stub dangles and drops, and the body is stamped as used. The artwork tilts in 3D with parallax on hover.',
    category: 'Micro',
    name: 'TearTicket',
    docsUrl: 'https://reactbits.dev/micro/tear-ticket',
    tags: ['ticket', 'tear', 'perforation', 'stub', 'coupon', 'pass', 'drag', 'parallax', 'tilt'],
    added: '2026-09-19'
  },
  'Micro/PaperCrumple': {
    videoUrl: '/assets/video/papercrumple.webm',
    description:
      'An image that crumples into a textured 3D sheet while held and follows the grabbed point as you drag. Release it as a crumpled ball, unfold it flat, or leave the paper creased, with customizable folds, paper grain, lighting and shadows.',
    category: 'Micro',
    name: 'PaperCrumple',
    docsUrl: 'https://reactbits.dev/micro/paper-crumple',
    tags: ['paper', 'crumple', '3d', 'three', 'image', 'drag', 'hold', 'fold', 'crease'],
    added: '2026-09-20'
  },
  'Micro/Shredder': {
    videoUrl: '/assets/video/shredder.webm',
    description:
      'A list with a paper shredder at the bottom. Drag a row into the slit and the rollers tug it in, pull it through and cut it into strips that curl out underneath, tumble away and fade out. The rest of the list settles down on a spring and the shredded item is handed to you to delete.',
    category: 'Micro',
    name: 'Shredder',
    docsUrl: 'https://reactbits.dev/micro/shredder',
    tags: ['shredder', 'delete', 'drag', 'list', 'strips', 'paper', 'physics', 'remove'],
    added: '2026-09-22'
  }
};

export default componentMetadata;
