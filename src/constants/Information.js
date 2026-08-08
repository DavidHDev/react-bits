/**
 * @typedef {'Animations' | 'Backgrounds' | 'Components' | 'TextAnimations'} Category
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
    tags: []
  },
  'Animations/BlobCursor': {
    videoUrl: '/assets/video/blobcursor.webm',
    description: 'Organic blob cursor that smoothly follows the pointer with inertia and elastic morphing.',
    category: 'Animations',
    name: 'BlobCursor',
    docsUrl: 'https://reactbits.dev/animations/blob-cursor',
    tags: []
  },
  'Animations/ClickSpark': {
    videoUrl: '/assets/video/clickspark.webm',
    description: 'Creates particle spark bursts at click position.',
    category: 'Animations',
    name: 'ClickSpark',
    docsUrl: 'https://reactbits.dev/animations/click-spark',
    tags: []
  },
  'Animations/Crosshair': {
    videoUrl: '/assets/video/crosshair.webm',
    description: 'Custom crosshair cursor with tracking, and link hover effects.',
    category: 'Animations',
    name: 'Crosshair',
    docsUrl: 'https://reactbits.dev/animations/crosshair',
    tags: []
  },
  'Animations/Cubes': {
    videoUrl: '/assets/video/cubes.webm',
    description: '3D rotating cube cluster. Supports auto-rotation or hover interaction.',
    category: 'Animations',
    name: 'Cubes',
    docsUrl: 'https://reactbits.dev/animations/cubes',
    tags: []
  },
  'Animations/ElectricBorder': {
    videoUrl: '/assets/video/electricborder.webm',
    description: 'Jittery electric energy border with animated arcs, glow and adjustable intensity.',
    category: 'Animations',
    name: 'ElectricBorder',
    docsUrl: 'https://reactbits.dev/animations/electric-border',
    tags: []
  },
  'Animations/FadeContent': {
    videoUrl: '/assets/video/fadecontent.webm',
    description: 'Simple directional fade / slide entrance / exit wrapper with threshold-based activation.',
    category: 'Animations',
    name: 'FadeContent',
    docsUrl: 'https://reactbits.dev/animations/fade-content',
    tags: []
  },
  'Animations/GlareHover': {
    videoUrl: '/assets/video/glarehover.webm',
    description: 'Adds a realistic moving glare highlight on hover over any element.',
    category: 'Animations',
    name: 'GlareHover',
    docsUrl: 'https://reactbits.dev/animations/glare-hover',
    tags: []
  },
  'Animations/GradualBlur': {
    videoUrl: '/assets/video/gradualblur.webm',
    description: 'Progressively un-blurs content based on scroll or trigger creating a cinematic reveal.',
    category: 'Animations',
    name: 'GradualBlur',
    docsUrl: 'https://reactbits.dev/animations/gradual-blur',
    tags: []
  },
  'Animations/GhostCursor': {
    videoUrl: '/assets/video/ghostcursor.webm',
    description: 'Semi-transparent ghost cursor that smoothly follows the real cursor with a trailing effect.',
    category: 'Animations',
    name: 'GhostCursor',
    docsUrl: 'https://reactbits.dev/animations/ghost-cursor',
    tags: []
  },
  'Animations/ImageTrail': {
    videoUrl: '/assets/video/imagetrail.webm',
    description: 'Cursor-based image trail with several built-in variants.',
    category: 'Animations',
    name: 'ImageTrail',
    docsUrl: 'https://reactbits.dev/animations/image-trail',
    tags: []
  },
  'Animations/LogoLoop': {
    videoUrl: '/assets/video/logoloop.webm',
    description: 'Continuously looping marquee of brand or tech logos with seamless repeat and hover pause.',
    category: 'Animations',
    name: 'LogoLoop',
    docsUrl: 'https://reactbits.dev/animations/logo-loop',
    tags: []
  },
  'Animations/Magnet': {
    videoUrl: '/assets/video/magnet.webm',
    description: 'Elements magnetically ease toward the cursor then settle back with spring physics.',
    category: 'Animations',
    name: 'Magnet',
    docsUrl: 'https://reactbits.dev/animations/magnet',
    tags: []
  },
  'Animations/MagnetLines': {
    videoUrl: '/assets/video/magnetlines.webm',
    description: 'Animated field lines bend toward the cursor.',
    category: 'Animations',
    name: 'MagnetLines',
    docsUrl: 'https://reactbits.dev/animations/magnet-lines',
    tags: []
  },
  'Animations/MetaBalls': {
    videoUrl: '/assets/video/metaballs.webm',
    description: 'Liquid metaball blobs that merge and separate with smooth implicit surface animation.',
    category: 'Animations',
    name: 'MetaBalls',
    docsUrl: 'https://reactbits.dev/animations/meta-balls',
    tags: []
  },
  'Animations/Strands': {
    videoUrl: '/assets/video/strands.webm',
    description: 'Glowing ribbon-like strands that ripple and weave across a transparent canvas.',
    category: 'Animations',
    name: 'Strands',
    docsUrl: 'https://reactbits.dev/animations/strands',
    tags: []
  },
  'Animations/MetallicPaint': {
    videoUrl: '/assets/video/metallicpaint.webm',
    description: 'Liquid metallic paint shader which can be applied to SVG elements.',
    category: 'Animations',
    name: 'MetallicPaint',
    docsUrl: 'https://reactbits.dev/animations/metallic-paint',
    tags: []
  },
  'Animations/Noise': {
    videoUrl: '/assets/video/noise.webm',
    description: 'Animated film grain / noise overlay adding subtle texture and motion.',
    category: 'Animations',
    name: 'Noise',
    docsUrl: 'https://reactbits.dev/animations/noise',
    tags: []
  },
  'Animations/PixelTrail': {
    videoUrl: '/assets/video/pixeltrail.webm',
    description: 'Pixelated cursor trail emitting fading squares with retro digital feel.',
    category: 'Animations',
    name: 'PixelTrail',
    docsUrl: 'https://reactbits.dev/animations/pixel-trail',
    tags: []
  },
  'Animations/PixelTransition': {
    videoUrl: '/assets/video/pixeltransition.webm',
    description: 'Pixel dissolve transition for content reveal on hover.',
    category: 'Animations',
    name: 'PixelTransition',
    docsUrl: 'https://reactbits.dev/animations/pixel-transition',
    tags: []
  },
  'Animations/Ribbons': {
    videoUrl: '/assets/video/ribbons.webm',
    description: 'Flowing responsive ribbons/cursor trail driven by physics and pointer motion.',
    category: 'Animations',
    name: 'Ribbons',
    docsUrl: 'https://reactbits.dev/animations/ribbons',
    tags: []
  },
  'Animations/ShapeBlur': {
    videoUrl: '/assets/video/shapeblur.webm',
    description: 'Morphing blurred geometric shape. The effect occurs on hover.',
    category: 'Animations',
    name: 'ShapeBlur',
    docsUrl: 'https://reactbits.dev/animations/shape-blur',
    tags: []
  },
  'Animations/SplashCursor': {
    videoUrl: '/assets/video/splashcursor.webm',
    description: 'Liquid splash burst at cursor with curling ripples and waves.',
    category: 'Animations',
    name: 'SplashCursor',
    docsUrl: 'https://reactbits.dev/animations/splash-cursor',
    tags: []
  },
  'Animations/StarBorder': {
    videoUrl: '/assets/video/starborder.webm',
    description: 'Animated star / sparkle border orbiting content with twinkle pulses.',
    category: 'Animations',
    name: 'StarBorder',
    docsUrl: 'https://reactbits.dev/animations/star-border',
    tags: []
  },
  'Animations/StickerPeel': {
    videoUrl: '/assets/video/stickerpeel.webm',
    description: 'Sticker corner lift + peel interaction using 3D transform and shadow depth.',
    category: 'Animations',
    name: 'StickerPeel',
    docsUrl: 'https://reactbits.dev/animations/sticker-peel',
    tags: []
  },
  'Animations/TargetCursor': {
    videoUrl: '/assets/video/targetcursor.webm',
    description: 'A cursor follow animation with 4 corners that lock onto targets.',
    category: 'Animations',
    name: 'TargetCursor',
    docsUrl: 'https://reactbits.dev/animations/target-cursor',
    tags: []
  },
  'Animations/LaserFlow': {
    videoUrl: '/assets/video/laserflow.webm',
    description: 'Dynamic laser light that flows onto a surface, customizable effect.',
    category: 'Animations',
    name: 'LaserFlow',
    docsUrl: 'https://reactbits.dev/animations/laser-flow',
    tags: []
  },
  'Animations/Antigravity': {
    videoUrl: '/assets/video/antigravity.webm',
    description: '3D antigravity particle field that repels from the cursor with smooth motion.',
    category: 'Animations',
    name: 'Antigravity',
    docsUrl: 'https://reactbits.dev/animations/antigravity',
    tags: []
  },
  'Animations/OrbitImages': {
    videoUrl: '/assets/video/orbitimages.webm',
    description: 'SVG Path customizable orbiting images effect',
    category: 'Animations',
    name: 'OrbitImages',
    docsUrl: 'https://reactbits.dev/animations/orbit-images',
    tags: []
  },
  'Animations/MagicRings': {
    videoUrl: '/assets/video/magicrings.webm',
    description: 'Interactive magic rings effect with customizable parameters.',
    category: 'Animations',
    name: 'MagicRings',
    docsUrl: 'https://reactbits.dev/animations/magic-rings',
    tags: []
  },

  //! Text Animations -------------------------------------------------------------------------------------------------------------------------------

  'TextAnimations/AsciiText': {
    videoUrl: '/assets/video/asciitext.webm',
    description: 'Renders text with an animated ASCII background for a retro feel.',
    category: 'TextAnimations',
    name: 'ASCIIText',
    docsUrl: 'https://reactbits.dev/text-animations/ascii-text',
    tags: []
  },
  'TextAnimations/BlurText': {
    videoUrl: '/assets/video/blurtext.webm',
    description: 'Text starts blurred then crisply resolves for a soft-focus reveal effect.',
    category: 'TextAnimations',
    name: 'BlurText',
    docsUrl: 'https://reactbits.dev/text-animations/blur-text',
    tags: []
  },
  'TextAnimations/CircularText': {
    videoUrl: '/assets/video/circulartext.webm',
    description: 'Layouts characters around a circle with optional rotation animation.',
    category: 'TextAnimations',
    name: 'CircularText',
    docsUrl: 'https://reactbits.dev/text-animations/circular-text',
    tags: []
  },
  'TextAnimations/CountUp': {
    videoUrl: '/assets/video/countup.webm',
    description: 'Animated number counter supporting formatting and decimals.',
    category: 'TextAnimations',
    name: 'CountUp',
    docsUrl: 'https://reactbits.dev/text-animations/count-up',
    tags: []
  },
  'TextAnimations/CurvedLoop': {
    videoUrl: '/assets/video/curvedloop.webm',
    description: 'Flowing looping text path along a customizable curve with drag interaction.',
    category: 'TextAnimations',
    name: 'CurvedLoop',
    docsUrl: 'https://reactbits.dev/text-animations/curved-loop',
    tags: []
  },
  'TextAnimations/DecryptedText': {
    videoUrl: '/assets/video/decryptedtext.webm',
    description: 'Hacker-style decryption cycling random glyphs until resolving to real text.',
    category: 'TextAnimations',
    name: 'DecryptedText',
    docsUrl: 'https://reactbits.dev/text-animations/decrypted-text',
    tags: []
  },
  'TextAnimations/FallingText': {
    videoUrl: '/assets/video/fallingtext.webm',
    description: 'Characters fall with gravity + bounce creating a playful entrance.',
    category: 'TextAnimations',
    name: 'FallingText',
    docsUrl: 'https://reactbits.dev/text-animations/falling-text',
    tags: []
  },
  'TextAnimations/FuzzyText': {
    videoUrl: '/assets/video/fuzzytext.webm',
    description: 'Vibrating fuzzy text with controllable hover intensity.',
    category: 'TextAnimations',
    name: 'FuzzyText',
    docsUrl: 'https://reactbits.dev/text-animations/fuzzy-text',
    tags: []
  },
  'TextAnimations/GlitchText': {
    videoUrl: '/assets/video/glitchtext.webm',
    description: 'RGB split and distortion glitch effect with jitter effects.',
    category: 'TextAnimations',
    name: 'GlitchText',
    docsUrl: 'https://reactbits.dev/text-animations/glitch-text',
    tags: []
  },
  'TextAnimations/GradientText': {
    videoUrl: '/assets/video/gradienttext.webm',
    description: 'Animated gradient sweep across live text with speed and color control.',
    category: 'TextAnimations',
    name: 'GradientText',
    docsUrl: 'https://reactbits.dev/text-animations/gradient-text',
    tags: []
  },
  'TextAnimations/RotatingText': {
    videoUrl: '/assets/video/rotatingtext.webm',
    description: 'Cycles through multiple phrases with 3D rotate / flip transitions.',
    category: 'TextAnimations',
    name: 'RotatingText',
    docsUrl: 'https://reactbits.dev/text-animations/rotating-text',
    tags: []
  },
  'TextAnimations/ScrambledText': {
    videoUrl: '/assets/video/scrambledtext.webm',
    description: 'Detects cursor position and applies a distortion effect to text.',
    category: 'TextAnimations',
    name: 'ScrambledText',
    docsUrl: 'https://reactbits.dev/text-animations/scrambled-text',
    tags: []
  },
  'TextAnimations/ScrollFloat': {
    videoUrl: '/assets/video/scrollfloat.webm',
    description: 'Text gently floats / parallax shifts on scroll.',
    category: 'TextAnimations',
    name: 'ScrollFloat',
    docsUrl: 'https://reactbits.dev/text-animations/scroll-float',
    tags: []
  },
  'TextAnimations/ScrollReveal': {
    videoUrl: '/assets/video/scrollreveal.webm',
    description: 'Text gently unblurs and reveals on scroll.',
    category: 'TextAnimations',
    name: 'ScrollReveal',
    docsUrl: 'https://reactbits.dev/text-animations/scroll-reveal',
    tags: []
  },
  'TextAnimations/ScrollVelocity': {
    videoUrl: '/assets/video/scrollvelocity.webm',
    description: "Text marquee animatio - speed and distortion scale with user's scroll velocity.",
    category: 'TextAnimations',
    name: 'ScrollVelocity',
    docsUrl: 'https://reactbits.dev/text-animations/scroll-velocity',
    tags: []
  },
  'TextAnimations/ShinyText': {
    videoUrl: '/assets/video/shinytext.webm',
    description: 'Metallic sheen sweeps across text producing a reflective highlight.',
    category: 'TextAnimations',
    name: 'ShinyText',
    docsUrl: 'https://reactbits.dev/text-animations/shiny-text',
    tags: []
  },
  'TextAnimations/SplitText': {
    videoUrl: '/assets/video/splittext.webm',
    description: 'Splits text into characters / words for staggered entrance animation.',
    category: 'TextAnimations',
    name: 'SplitText',
    docsUrl: 'https://reactbits.dev/text-animations/split-text',
    tags: []
  },
  'TextAnimations/TextCursor': {
    videoUrl: '/assets/video/textcursor.webm',
    description: 'Make any text element follow your cursor, leaving a trail of copies behind it.',
    category: 'TextAnimations',
    name: 'TextCursor',
    docsUrl: 'https://reactbits.dev/text-animations/text-cursor',
    tags: []
  },
  'TextAnimations/TextPressure': {
    videoUrl: '/assets/video/textpressure.webm',
    description: 'Characters scale / warp interactively based on pointer pressure zone.',
    category: 'TextAnimations',
    name: 'TextPressure',
    docsUrl: 'https://reactbits.dev/text-animations/text-pressure',
    tags: []
  },
  'TextAnimations/TextType': {
    videoUrl: '/assets/video/texttype.webm',
    description: 'Typewriter effect with blinking cursor and adjustable typing cadence.',
    category: 'TextAnimations',
    name: 'TextType',
    docsUrl: 'https://reactbits.dev/text-animations/text-type',
    tags: []
  },
  'TextAnimations/TrueFocus': {
    videoUrl: '/assets/video/truefocus.webm',
    description: 'Applies dynamic blur / clarity based over a series of words in order.',
    category: 'TextAnimations',
    name: 'TrueFocus',
    docsUrl: 'https://reactbits.dev/text-animations/true-focus',
    tags: []
  },
  'TextAnimations/VariableProximity': {
    videoUrl: '/assets/video/variableproximity.webm',
    description: 'Letter styling changes continuously with pointer distance mapping.',
    category: 'TextAnimations',
    name: 'VariableProximity',
    docsUrl: 'https://reactbits.dev/text-animations/variable-proximity',
    tags: []
  },
  'TextAnimations/Shuffle': {
    videoUrl: '/assets/video/shuffle.webm',
    description: 'Animated text reveal where characters shuffle before settling.',
    category: 'TextAnimations',
    name: 'Shuffle',
    docsUrl: 'https://reactbits.dev/text-animations/shuffle',
    tags: []
  },
  'TextAnimations/ParticleText': {
    videoUrl: '/assets/video/particletext.webm',
    description: 'Text assembles from drifting particles that scatter and reform on demand.',
    category: 'TextAnimations',
    name: 'ParticleText',
    docsUrl: 'https://reactbits.dev/text-animations/particle-text',
    tags: []
  },
  'TextAnimations/SplitFlapText': {
    videoUrl: '/assets/video/splitflaptext.webm',
    description: 'Mechanical split-flap departure board that clacks through to each new phrase.',
    category: 'TextAnimations',
    name: 'SplitFlapText',
    docsUrl: 'https://reactbits.dev/text-animations/split-flap-text',
    tags: []
  },
  'TextAnimations/WarpText': {
    videoUrl: '/assets/video/warptext.webm',
    description: 'WebGL warp that bends and refracts the text around the pointer.',
    category: 'TextAnimations',
    name: 'WarpText',
    docsUrl: 'https://reactbits.dev/text-animations/warp-text',
    tags: []
  },
  'TextAnimations/StrokeText': {
    videoUrl: '/assets/video/stroketext.webm',
    description: 'Outlined letterforms draw themselves on, then flood with fill.',
    category: 'TextAnimations',
    name: 'StrokeText',
    docsUrl: 'https://reactbits.dev/text-animations/stroke-text',
    tags: []
  },
  'TextAnimations/DepthText': {
    videoUrl: '/assets/video/depthtext.webm',
    description: 'Layered extruded type with parallax that shifts against the pointer.',
    category: 'TextAnimations',
    name: 'DepthText',
    docsUrl: 'https://reactbits.dev/text-animations/depth-text',
    tags: []
  },
  'TextAnimations/FoldText': {
    videoUrl: '/assets/video/foldtext.webm',
    description: 'Lines unfold into place like creased paper opening flat.',
    category: 'TextAnimations',
    name: 'FoldText',
    docsUrl: 'https://reactbits.dev/text-animations/fold-text',
    tags: []
  },
  'TextAnimations/EchoText': {
    videoUrl: '/assets/video/echotext.webm',
    description: 'Ghosted copies trail behind the text and settle into a single word.',
    category: 'TextAnimations',
    name: 'EchoText',
    docsUrl: 'https://reactbits.dev/text-animations/echo-text',
    tags: []
  },
  'TextAnimations/MaskedHeading': {
    videoUrl: '/assets/video/maskedheading.webm',
    description: 'A large headline with a drifting colour mesh or image showing through the glyphs, revealed word by word.',
    category: 'TextAnimations',
    name: 'MaskedHeading',
    docsUrl: 'https://reactbits.dev/text-animations/masked-heading',
    tags: []
  },
  'TextAnimations/TextLoop': {
    videoUrl: '/assets/video/textloop.webm',
    description: 'A seamless text marquee that flows along curved SVG paths.',
    category: 'TextAnimations',
    name: 'TextLoop',
    docsUrl: 'https://reactbits.dev/text-animations/text-loop',
    tags: []
  },

  //! Components -------------------------------------------------------------------------------------------------------------------------------
  'Components/AnimatedList': {
    videoUrl: '/assets/video/animatedlist.webm',
    description: 'List items enter with staggered motion variants for polished reveals.',
    category: 'Components',
    name: 'AnimatedList',
    docsUrl: 'https://reactbits.dev/components/animated-list',
    tags: []
  },
  'Components/BounceCards': {
    videoUrl: '/assets/video/bouncecards.webm',
    description: 'Cards bounce that bounce in on mount.',
    category: 'Components',
    name: 'BounceCards',
    docsUrl: 'https://reactbits.dev/components/bounce-cards',
    tags: []
  },
  'Components/BubbleMenu': {
    videoUrl: '/assets/video/bubblemenu.webm',
    description: 'Floating circular expanding menu with staggered item reveal.',
    category: 'Components',
    name: 'BubbleMenu',
    docsUrl: 'https://reactbits.dev/components/bubble-menu',
    tags: []
  },
  'Components/CardNav': {
    videoUrl: '/assets/video/cardnav.webm',
    description: 'Expandable navigation bar with card panels revealing nested links.',
    category: 'Components',
    name: 'CardNav',
    docsUrl: 'https://reactbits.dev/components/card-nav',
    tags: []
  },
  'Components/CardSwap': {
    videoUrl: '/assets/video/cardswap.webm',
    description: 'Cards animate position swapping with smooth layout transitions.',
    category: 'Components',
    name: 'CardSwap',
    docsUrl: 'https://reactbits.dev/components/card-swap',
    tags: []
  },
  'Components/Carousel': {
    videoUrl: '/assets/video/carousel.webm',
    description: 'Responsive carousel with touch gestures, looping and transitions.',
    category: 'Components',
    name: 'Carousel',
    docsUrl: 'https://reactbits.dev/components/carousel',
    tags: []
  },
  'Components/ChromaGrid': {
    videoUrl: '/assets/video/chromagrid.webm',
    description: 'A responsive grid of grayscale tiles. Hovering the grid reaveals their colors.',
    category: 'Components',
    name: 'ChromaGrid',
    docsUrl: 'https://reactbits.dev/components/chroma-grid',
    tags: []
  },
  'Components/DepthCarousel': {
    videoUrl: '/assets/video/depthcarousel.webm',
    description: 'Cards recede into depth on a 3D rail, with drag, keyboard and auto-advance.',
    category: 'Components',
    name: 'DepthCarousel',
    docsUrl: 'https://reactbits.dev/components/depth-carousel',
    tags: []
  },
  'Components/AccordionGallery': {
    videoUrl: '/assets/video/accordiongallery.webm',
    description: 'Panels expand on hover or focus, revealing parallax imagery and captions.',
    category: 'Components',
    name: 'AccordionGallery',
    docsUrl: 'https://reactbits.dev/components/accordion-gallery',
    tags: []
  },
  'Components/MorphSlider': {
    videoUrl: '/assets/video/morphslider.webm',
    description: 'WebGL slider that melts between images with a displacement transition.',
    category: 'Components',
    name: 'MorphSlider',
    docsUrl: 'https://reactbits.dev/components/morph-slider',
    tags: []
  },
  'Components/DriftWall': {
    videoUrl: '/assets/video/driftwall.webm',
    description: 'An endless perspective wall of tiles drifting past, lifting on hover.',
    category: 'Components',
    name: 'DriftWall',
    docsUrl: 'https://reactbits.dev/components/drift-wall',
    tags: []
  },
  'Components/CircularGallery': {
    videoUrl: '/assets/video/circulargallery.webm',
    description: 'Circular orbit gallery rotating images.',
    category: 'Components',
    name: 'CircularGallery',
    docsUrl: 'https://reactbits.dev/components/circular-gallery',
    tags: []
  },
  'Components/Counter': {
    videoUrl: '/assets/video/counter.webm',
    description: 'Flexible animated counter supporting increments + easing.',
    category: 'Components',
    name: 'Counter',
    docsUrl: 'https://reactbits.dev/components/counter',
    tags: []
  },
  'Components/DecayCard': {
    videoUrl: '/assets/video/decaycard.webm',
    description: 'Hover parallax effect that disintegrates the content of a card.',
    category: 'Components',
    name: 'DecayCard',
    docsUrl: 'https://reactbits.dev/components/decay-card',
    tags: []
  },
  'Components/Dock': {
    videoUrl: '/assets/video/dock.webm',
    description: 'macOS style magnifying dock with proximity scaling of icons.',
    category: 'Components',
    name: 'Dock',
    docsUrl: 'https://reactbits.dev/components/dock',
    tags: []
  },
  'Components/DomeGallery': {
    videoUrl: '/assets/video/domegallery.webm',
    description: 'Immersive 3D dome gallery projecting images on a hemispheric surface.',
    category: 'Components',
    name: 'DomeGallery',
    docsUrl: 'https://reactbits.dev/components/dome-gallery',
    tags: []
  },
  'Components/ElasticSlider': {
    videoUrl: '/assets/video/elasticslider.webm',
    description: 'Slider handle stretches elastically then snaps with spring physics.',
    category: 'Components',
    name: 'ElasticSlider',
    docsUrl: 'https://reactbits.dev/components/elastic-slider',
    tags: []
  },
  'Components/FlowingMenu': {
    videoUrl: '/assets/video/flowingmenu.webm',
    description: 'Liquid flowing active indicator glides between menu items.',
    category: 'Components',
    name: 'FlowingMenu',
    docsUrl: 'https://reactbits.dev/components/flowing-menu',
    tags: []
  },
  'Components/FluidGlass': {
    videoUrl: '/assets/video/fluidglass.webm',
    description: 'Glassmorphism container with animated liquid distortion refraction.',
    category: 'Components',
    name: 'FluidGlass',
    docsUrl: 'https://reactbits.dev/components/fluid-glass',
    tags: []
  },
  'Components/FlyingPosters': {
    videoUrl: '/assets/video/flyingposters.webm',
    description: '3D posters rotate on scroll infinitely.',
    category: 'Components',
    name: 'FlyingPosters',
    docsUrl: 'https://reactbits.dev/components/flying-posters',
    tags: []
  },
  'Components/Folder': {
    videoUrl: '/assets/video/folder.webm',
    description: 'Interactive folder opens to reveal nested content smooth motion.',
    category: 'Components',
    name: 'Folder',
    docsUrl: 'https://reactbits.dev/components/folder',
    tags: []
  },
  'Components/GlassIcons': {
    videoUrl: '/assets/video/glassicons.webm',
    description: 'Icon set styled with frosted glass blur.',
    category: 'Components',
    name: 'GlassIcons',
    docsUrl: 'https://reactbits.dev/components/glass-icons',
    tags: []
  },
  'Components/GlassSurface': {
    videoUrl: '/assets/video/glasssurface.webm',
    description: 'Advanced Apple-style glass surface with real-time distortion + lighting.',
    category: 'Components',
    name: 'GlassSurface',
    docsUrl: 'https://reactbits.dev/components/glass-surface',
    tags: []
  },
  'Components/GooeyNav': {
    videoUrl: '/assets/video/gooeynav.webm',
    description: 'Navigation indicator morphs with gooey blob transitions between items.',
    category: 'Components',
    name: 'GooeyNav',
    docsUrl: 'https://reactbits.dev/components/gooey-nav',
    tags: []
  },
  'Components/InfiniteMenu': {
    videoUrl: '/assets/video/infinitemenu.webm',
    description: 'Horizontally looping menu effect that scrolls endlessly with seamless wrap.',
    category: 'Components',
    name: 'InfiniteMenu',
    docsUrl: 'https://reactbits.dev/components/infinite-menu',
    tags: []
  },
  'Components/Lanyard': {
    videoUrl: '/assets/video/lanyard.webm',
    description: 'Swinging 3D lanyard / badge card with realistic inertial motion.',
    category: 'Components',
    name: 'Lanyard',
    docsUrl: 'https://reactbits.dev/components/lanyard',
    tags: []
  },
  'Components/MagicBento': {
    videoUrl: '/assets/video/magicbento.webm',
    description: 'Interactive bento grid tiles expand + animate with various options.',
    category: 'Components',
    name: 'MagicBento',
    docsUrl: 'https://reactbits.dev/components/magic-bento',
    tags: []
  },
  'Components/Masonry': {
    videoUrl: '/assets/video/masonry.webm',
    description: 'Responsive masonry layout with animated reflow + gaps optimization.',
    category: 'Components',
    name: 'Masonry',
    docsUrl: 'https://reactbits.dev/components/masonry',
    tags: []
  },
  'Components/ModelViewer': {
    videoUrl: '/assets/video/modelviewer.webm',
    description: 'Three.js model viewer with orbit controls and lighting presets.',
    category: 'Components',
    name: 'ModelViewer',
    docsUrl: 'https://reactbits.dev/components/model-viewer',
    tags: []
  },
  'Components/PillNav': {
    videoUrl: '/assets/video/pillnav.webm',
    description: 'Minimal pill nav with sliding active highlight + smooth easing.',
    category: 'Components',
    name: 'PillNav',
    docsUrl: 'https://reactbits.dev/components/pill-nav',
    tags: []
  },
  'Components/PixelCard': {
    videoUrl: '/assets/video/pixelcard.webm',
    description: 'Card content revealed through pixel expansion transition.',
    category: 'Components',
    name: 'PixelCard',
    docsUrl: 'https://reactbits.dev/components/pixel-card',
    tags: []
  },
  'Components/ProfileCard': {
    videoUrl: '/assets/video/profilecard.webm',
    description: 'Animated profile card glare with 3D hover effect.',
    category: 'Components',
    name: 'ProfileCard',
    docsUrl: 'https://reactbits.dev/components/profile-card',
    tags: []
  },
  'Components/ScrollStack': {
    videoUrl: '/assets/video/scrollstack.webm',
    description: 'Overlapping card stack reveals on scroll with depth layering.',
    category: 'Components',
    name: 'ScrollStack',
    docsUrl: 'https://reactbits.dev/components/scroll-stack',
    tags: []
  },
  'Components/SpotlightCard': {
    videoUrl: '/assets/video/spotlightcard.webm',
    description: 'Dynamic spotlight follows cursor casting gradient illumination.',
    category: 'Components',
    name: 'SpotlightCard',
    docsUrl: 'https://reactbits.dev/components/spotlight-card',
    tags: []
  },
  'Components/BorderGlow': {
    videoUrl: '/assets/video/borderglow.webm',
    description: 'Glowing mesh-gradient border that follows cursor direction and intensifies near edges.',
    category: 'Components',
    name: 'BorderGlow',
    docsUrl: 'https://reactbits.dev/components/border-glow',
    tags: []
  },
  'Components/LineSidebar': {
    videoUrl: '/assets/video/linesidebar.webm',
    description: 'Static list navigation with a cursor-proximity effect that shifts and highlights nearby items.',
    category: 'Components',
    name: 'LineSidebar',
    docsUrl: 'https://reactbits.dev/components/line-sidebar',
    tags: []
  },
  'Components/OptionWheel': {
    videoUrl: '/assets/video/optionwheel.webm',
    description: 'Curved option picker that spins via scroll, drag, or arrow keys, fading and tilting items away from the selection.',
    category: 'Components',
    name: 'OptionWheel',
    docsUrl: 'https://reactbits.dev/components/option-wheel',
    tags: []
  },
  'Components/SpecularButton': {
    videoUrl: '/assets/video/specularbutton.webm',
    description: 'Glass button with a shader-driven specular rim light that sweeps around the edge and follows the cursor.',
    category: 'Components',
    name: 'SpecularButton',
    docsUrl: 'https://reactbits.dev/components/specular-button',
    tags: []
  },
  'Animations/ElasticMesh': {
    videoUrl: '/assets/video/elasticmesh.webm',
    description: 'Spring-mesh surface that stretches under the pointer and settles back with damped physics.',
    category: 'Animations',
    name: 'ElasticMesh',
    docsUrl: 'https://reactbits.dev/animations/elastic-mesh',
    tags: []
  },
  'Animations/RippleDistortion': {
    videoUrl: '/assets/video/rippledistortion.webm',
    description: 'Pointer-driven water displacement that warps content and leaves a decaying wake.',
    category: 'Animations',
    name: 'RippleDistortion',
    docsUrl: 'https://reactbits.dev/animations/ripple-distortion',
    tags: []
  },
  'Animations/SwarmCursor': {
    videoUrl: '/assets/video/swarmcursor.webm',
    description: 'Flocking particle swarm that chases the pointer, jostles for space and drifts apart at rest.',
    category: 'Animations',
    name: 'SwarmCursor',
    docsUrl: 'https://reactbits.dev/animations/swarm-cursor',
    tags: []
  },
  'Animations/HalftoneReveal': {
    videoUrl: '/assets/video/halftonereveal.webm',
    description: 'Print-style halftone dot matrix that resolves into sharp content around the cursor.',
    category: 'Animations',
    name: 'HalftoneReveal',
    docsUrl: 'https://reactbits.dev/animations/halftone-reveal',
    tags: []
  },
  'Animations/ScrollExpand': {
    videoUrl: '/assets/video/scrollexpand.webm',
    description: 'A rounded media frame that grows to full bleed as it scrolls through the viewport.',
    category: 'Animations',
    name: 'ScrollExpand',
    docsUrl: 'https://reactbits.dev/animations/scroll-expand',
    tags: []
  },
  'Animations/CursorGrid': {
    videoUrl: '/assets/video/cursorgrid.webm',
    description: 'Canvas grid whose cells light up around the cursor with configurable radius, falloff and click pulses.',
    category: 'Animations',
    name: 'CursorGrid',
    docsUrl: 'https://reactbits.dev/animations/cursor-grid',
    tags: []
  },
  'Components/CurvedInput': {
    videoUrl: '/assets/video/curvedinput.webm',
    description: 'Arc-bent input bar with text, caret and submit button all following the curve.',
    category: 'Components',
    name: 'CurvedInput',
    docsUrl: 'https://reactbits.dev/components/curved-input',
    tags: []
  },
  'Components/Stack': {
    videoUrl: '/assets/video/stack.webm',
    description: 'Layered stack with swipe animations, autoplay and smooth transitions.',
    category: 'Components',
    name: 'Stack',
    docsUrl: 'https://reactbits.dev/components/stack',
    tags: []
  },
  'Components/Stepper': {
    videoUrl: '/assets/video/stepper.webm',
    description: 'Animated multi-step progress indicator with active state transitions.',
    category: 'Components',
    name: 'Stepper',
    docsUrl: 'https://reactbits.dev/components/stepper',
    tags: []
  },
  'Components/TiltedCard': {
    videoUrl: '/assets/video/tiltedcard.webm',
    description: '3D perspective tilt card reacting to pointer.',
    category: 'Components',
    name: 'TiltedCard',
    docsUrl: 'https://reactbits.dev/components/tilted-card',
    tags: []
  },
  'Components/StaggeredMenu': {
    videoUrl: '/assets/video/staggeredmenu.webm',
    description: 'Menu with staggered item animations and smooth transitions on open/close.',
    category: 'Components',
    name: 'StaggeredMenu',
    docsUrl: 'https://reactbits.dev/components/staggered-menu',
    tags: []
  },
  'Components/ReflectiveCard': {
    videoUrl: '/assets/video/reflectivecard.webm',
    description: 'Card with dynamic webcam reflection and glare effects that respond to cursor movement.',
    category: 'Components',
    name: 'ReflectiveCard',
    docsUrl: 'https://reactbits.dev/components/reflective-card',
    tags: []
  },

  //! Backgrounds -------------------------------------------------------------------------------------------------------------------------------
  'Backgrounds/WaveBackground': {
    videoUrl: '',
    description: 'Interactive 3D canvas grid wave background with customizable colors and physics.',
    category: 'Backgrounds',
    name: 'WaveBackground',
    docsUrl: 'https://reactbits.dev/backgrounds/wave-background',
    tags: []
  },
  'Backgrounds/Aurora': {
    videoUrl: '/assets/video/aurora.webm',
    description: 'Flowing aurora gradient background.',
    category: 'Backgrounds',
    name: 'Aurora',
    docsUrl: 'https://reactbits.dev/backgrounds/aurora',
    tags: []
  },
  'Backgrounds/Balatro': {
    videoUrl: '/assets/video/balatro.webm',
    description: 'The balatro shader, fully customizalbe and interactive.',
    category: 'Backgrounds',
    name: 'Balatro',
    docsUrl: 'https://reactbits.dev/backgrounds/balatro',
    tags: []
  },
  'Backgrounds/Ballpit': {
    videoUrl: '/assets/video/ballpit.webm',
    description: 'Physics ball pit simulation with bouncing colorful spheres.',
    category: 'Backgrounds',
    name: 'Ballpit',
    docsUrl: 'https://reactbits.dev/backgrounds/ballpit',
    tags: []
  },
  'Backgrounds/Beams': {
    videoUrl: '/assets/video/beams.webm',
    description: 'Crossing animated ribbons with customizable properties.',
    category: 'Backgrounds',
    name: 'Beams',
    docsUrl: 'https://reactbits.dev/backgrounds/beams',
    tags: []
  },
  'Backgrounds/ColorBends': {
    videoUrl: '/assets/video/colorbends.webm',
    description: 'Vibrant color bends with smooth flowing animation.',
    category: 'Backgrounds',
    name: 'ColorBends',
    docsUrl: 'https://reactbits.dev/backgrounds/color-bends',
    tags: []
  },
  'Backgrounds/DarkVeil': {
    videoUrl: '/assets/video/darkveil.webm',
    description: 'Subtle dark background with a smooth animation and postprocessing.',
    category: 'Backgrounds',
    name: 'DarkVeil',
    docsUrl: 'https://reactbits.dev/backgrounds/dark-veil',
    tags: []
  },
  'Backgrounds/Dither': {
    videoUrl: '/assets/video/dither.webm',
    description: 'Retro dithered noise shader background.',
    category: 'Backgrounds',
    name: 'Dither',
    docsUrl: 'https://reactbits.dev/backgrounds/dither',
    tags: []
  },
  'Backgrounds/DotField': {
    videoUrl: '/assets/video/dotfield.webm',
    description: 'Interactive dot grid with cursor bulge, glow, sparkle, and wave effects.',
    category: 'Backgrounds',
    name: 'DotField',
    docsUrl: 'https://reactbits.dev/backgrounds/dot-field',
    tags: []
  },
  'Backgrounds/DotGrid': {
    videoUrl: '/assets/video/dotgrid.webm',
    description: 'Animated dot grid with cursor interactions.',
    category: 'Backgrounds',
    name: 'DotGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/dot-grid',
    tags: []
  },
  'Backgrounds/FaultyTerminal': {
    videoUrl: '/assets/video/faultyterminal.webm',
    description: 'Terminal CRT scanline squares effect with flicker + noise.',
    category: 'Backgrounds',
    name: 'FaultyTerminal',
    docsUrl: 'https://reactbits.dev/backgrounds/faulty-terminal',
    tags: []
  },
  'Backgrounds/Galaxy': {
    videoUrl: '/assets/video/galaxy.webm',
    description: 'Parallax realistic starfield with pointer interactions.',
    category: 'Backgrounds',
    name: 'Galaxy',
    docsUrl: 'https://reactbits.dev/backgrounds/galaxy',
    tags: []
  },
  'Backgrounds/GradientBlinds': {
    videoUrl: '/assets/video/gradientblinds.webm',
    description: 'Layered gradient blinds with spotlight and noise distortion.',
    category: 'Backgrounds',
    name: 'GradientBlinds',
    docsUrl: 'https://reactbits.dev/backgrounds/gradient-blinds',
    tags: []
  },
  'Backgrounds/Lightfall': {
    videoUrl: '/assets/video/lightfall.webm',
    description: 'Colorful light streaks raining down a glowing tunnel with a cursor light.',
    category: 'Backgrounds',
    name: 'Lightfall',
    docsUrl: 'https://reactbits.dev/backgrounds/lightfall',
    tags: []
  },
  'Backgrounds/Ferrofluid': {
    videoUrl: '/assets/video/ferrofluid.webm',
    description: 'A churning magnetic fluid traced by glowing contour lines, with a cursor magnet.',
    category: 'Backgrounds',
    name: 'Ferrofluid',
    docsUrl: 'https://reactbits.dev/backgrounds/ferrofluid',
    tags: []
  },
  'Backgrounds/MoltenMetal': {
    videoUrl: '/assets/video/moltenmetal.webm',
    description: 'Swirling caustic plasma filaments with molten, white-hot cores.',
    category: 'Backgrounds',
    name: 'MoltenMetal',
    docsUrl: 'https://reactbits.dev/backgrounds/molten-metal',
    tags: []
  },
  'Backgrounds/GradientWaves': {
    videoUrl: '/assets/video/gradientwaves.webm',
    description: 'Raymarched sine waves rolling toward a soft, hazy horizon.',
    category: 'Backgrounds',
    name: 'GradientWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/gradient-waves',
    tags: []
  },
  'Backgrounds/WebThreads': {
    videoUrl: '/assets/video/webthreads.webm',
    description: 'Glowing sine threads woven through a luminous convergence point.',
    category: 'Backgrounds',
    name: 'WebThreads',
    docsUrl: 'https://reactbits.dev/backgrounds/web-threads',
    tags: []
  },
  'Backgrounds/Topography': {
    videoUrl: '/assets/video/topography.webm',
    description: 'A living contour map with glowing, elevation-tinted lines.',
    category: 'Backgrounds',
    name: 'Topography',
    docsUrl: 'https://reactbits.dev/backgrounds/topography',
    tags: []
  },
  'Backgrounds/LightTunnel': {
    videoUrl: '/assets/video/lighttunnel.webm',
    description: 'A radial fibre-optic tunnel with light pulses racing into depth.',
    category: 'Backgrounds',
    name: 'LightTunnel',
    docsUrl: 'https://reactbits.dev/backgrounds/light-tunnel',
    tags: []
  },
  'Backgrounds/SlicedWaves': {
    videoUrl: '/assets/video/slicedwaves.webm',
    description: 'A grid of soft glowing bars rippling like a slatted equalizer.',
    category: 'Backgrounds',
    name: 'SlicedWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/sliced-waves',
    tags: []
  },
  'Backgrounds/AcidSquares': {
    videoUrl: '/assets/video/acidsquares.webm',
    description: 'A crystalline corridor of stacked squares receding into depth.',
    category: 'Backgrounds',
    name: 'AcidSquares',
    docsUrl: 'https://reactbits.dev/backgrounds/acid-squares',
    tags: []
  },
  'Backgrounds/Scanner': {
    videoUrl: '/assets/video/scanner.webm',
    description: 'Calm interference bands sweeping across the screen like an oscilloscope.',
    category: 'Backgrounds',
    name: 'Scanner',
    docsUrl: 'https://reactbits.dev/backgrounds/scanner',
    tags: []
  },
  'Backgrounds/Grainient': {
    videoUrl: '/assets/video/grainient.webm',
    description: 'Grainy gradient swirls with soft wave distortion.',
    category: 'Backgrounds',
    name: 'Grainient',
    docsUrl: 'https://reactbits.dev/backgrounds/grainient',
    tags: []
  },
  'Backgrounds/GridScan': {
    videoUrl: '/assets/video/gridscan.webm',
    description: 'Animated grid room 3D scan effect and cool interactions.',
    category: 'Backgrounds',
    name: 'GridScan',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-scan',
    tags: []
  },
  'Backgrounds/GridDistortion': {
    videoUrl: '/assets/video/griddistortion.webm',
    description: 'Warped grid mesh distorts smoothly reacting to cursor.',
    category: 'Backgrounds',
    name: 'GridDistortion',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-distortion',
    tags: []
  },
  'Backgrounds/GridMotion': {
    videoUrl: '/assets/video/gridmotion.webm',
    description: 'Perspective moving grid lines based on cusror position.',
    category: 'Backgrounds',
    name: 'GridMotion',
    docsUrl: 'https://reactbits.dev/backgrounds/grid-motion',
    tags: []
  },
  'Backgrounds/Hyperspeed': {
    videoUrl: '/assets/video/hyperspeed.webm',
    description: 'Animated lines continuously moving to simulate hyperspace travel on click hold.',
    category: 'Backgrounds',
    name: 'Hyperspeed',
    docsUrl: 'https://reactbits.dev/backgrounds/hyperspeed',
    tags: []
  },
  'Backgrounds/Iridescence': {
    videoUrl: '/assets/video/iridescence.webm',
    description: 'Slick iridescent shader with shifting waves.',
    category: 'Backgrounds',
    name: 'Iridescence',
    docsUrl: 'https://reactbits.dev/backgrounds/iridescence',
    tags: []
  },
  'Backgrounds/LetterGlitch': {
    videoUrl: '/assets/video/letterglitch.webm',
    description: 'Matrix style letter animation.',
    category: 'Backgrounds',
    name: 'LetterGlitch',
    docsUrl: 'https://reactbits.dev/backgrounds/letter-glitch',
    tags: []
  },
  'Backgrounds/LightRays': {
    videoUrl: '/assets/video/lightrays.webm',
    description: 'Volumetric light rays/beams with customizable direction.',
    category: 'Backgrounds',
    name: 'LightRays',
    docsUrl: 'https://reactbits.dev/backgrounds/light-rays',
    tags: []
  },
  'Backgrounds/Lightning': {
    videoUrl: '/assets/video/lightning.webm',
    description: 'Procedural lightning bolts with branching and glow flicker.',
    category: 'Backgrounds',
    name: 'Lightning',
    docsUrl: 'https://reactbits.dev/backgrounds/lightning',
    tags: []
  },
  'Backgrounds/LineWaves': {
    videoUrl: '/assets/video/linewaves.webm',
    description: 'Animated line wave pattern with colorful warped distortion.',
    category: 'Backgrounds',
    name: 'LineWaves',
    docsUrl: 'https://reactbits.dev/backgrounds/line-waves',
    tags: []
  },
  'Backgrounds/EvilEye': {
    videoUrl: '/assets/video/evileye.webm',
    description: 'Procedural evil eye shader with animated iris, slit pupil, and fiery outer glow.',
    category: 'Backgrounds',
    name: 'EvilEye',
    docsUrl: 'https://reactbits.dev/backgrounds/evil-eye',
    tags: []
  },
  'Backgrounds/Radar': {
    videoUrl: '/assets/video/radar.webm',
    description: 'Radar sweep effect with concentric rings, radial spokes, and a rotating beam.',
    category: 'Backgrounds',
    name: 'Radar',
    docsUrl: 'https://reactbits.dev/backgrounds/radar',
    tags: []
  },
  'Backgrounds/SoftAurora': {
    videoUrl: '/assets/video/softaurora.webm',
    description: 'Soft aurora borealis shader with 3D Perlin noise and cosine gradient palettes.',
    category: 'Backgrounds',
    name: 'SoftAurora',
    docsUrl: 'https://reactbits.dev/backgrounds/soft-aurora',
    tags: []
  },
  'Backgrounds/LiquidChrome': {
    videoUrl: '/assets/video/liquidchrome.webm',
    description: 'Liquid metallic chrome shader with flowing reflective surface.',
    category: 'Backgrounds',
    name: 'LiquidChrome',
    docsUrl: 'https://reactbits.dev/backgrounds/liquid-chrome',
    tags: []
  },
  'Backgrounds/Orb': {
    videoUrl: '/assets/video/orb.webm',
    description: 'Floating energy orb with customizable hover effect.',
    category: 'Backgrounds',
    name: 'Orb',
    docsUrl: 'https://reactbits.dev/backgrounds/orb',
    tags: []
  },
  'Backgrounds/Particles': {
    videoUrl: '/assets/video/particles.webm',
    description: 'Configurable particle system.',
    category: 'Backgrounds',
    name: 'Particles',
    docsUrl: 'https://reactbits.dev/backgrounds/particles',
    tags: []
  },
  'Backgrounds/PixelBlast': {
    videoUrl: '/assets/video/pixelblast.webm',
    description: 'Exploding pixel particle bursts with optional liquid postprocessing.',
    category: 'Backgrounds',
    name: 'PixelBlast',
    docsUrl: 'https://reactbits.dev/backgrounds/pixel-blast',
    tags: []
  },
  'Backgrounds/Plasma': {
    videoUrl: '/assets/video/plasma.webm',
    description: 'Organic plasma gradients swirl + morph with smooth turbulence.',
    category: 'Backgrounds',
    name: 'Plasma',
    docsUrl: 'https://reactbits.dev/backgrounds/plasma',
    tags: []
  },
  'Backgrounds/PlasmaWave': {
    videoUrl: '/assets/video/plasmawave.webm',
    description: 'Raymarched plasma waves with dual-wave interference and OGL.',
    category: 'Backgrounds',
    name: 'PlasmaWave',
    docsUrl: 'https://reactbits.dev/backgrounds/plasma-wave',
    tags: []
  },
  'Backgrounds/Prism': {
    videoUrl: '/assets/video/prism.webm',
    description: 'Rotating prism with configurable intensity, size, and colors.',
    category: 'Backgrounds',
    name: 'Prism',
    docsUrl: 'https://reactbits.dev/backgrounds/prism',
    tags: []
  },
  'Backgrounds/PrismaticBurst': {
    videoUrl: '/assets/video/prismaticburst.webm',
    description: 'Burst of light rays with controllable color, distortion, amount.',
    category: 'Backgrounds',
    name: 'PrismaticBurst',
    docsUrl: 'https://reactbits.dev/backgrounds/prismatic-burst',
    tags: []
  },
  'Backgrounds/RippleGrid': {
    videoUrl: '/assets/video/ripplegrid.webm',
    description: 'A grid that continuously animates with a ripple effect.',
    category: 'Backgrounds',
    name: 'RippleGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/ripple-grid',
    tags: []
  },
  'Backgrounds/Silk': {
    videoUrl: '/assets/video/silk.webm',
    description: 'Smooth waves background with soft lighting.',
    category: 'Backgrounds',
    name: 'Silk',
    docsUrl: 'https://reactbits.dev/backgrounds/silk',
    tags: []
  },
  'Backgrounds/SideRays': {
    videoUrl: '/assets/video/siderays.webm',
    description: 'Animated light rays emanating from the side with customizable colors and speed.',
    category: 'Backgrounds',
    name: 'SideRays',
    docsUrl: 'https://reactbits.dev/backgrounds/side-rays',
    tags: []
  },
  'Backgrounds/ShapeGrid': {
    videoUrl: '/assets/video/squares.webm',
    description: 'Animated grid with shape variants (square, hexagon, circle, triangle) + direction customization.',
    category: 'Backgrounds',
    name: 'ShapeGrid',
    docsUrl: 'https://reactbits.dev/backgrounds/shape-grid',
    tags: []
  },
  'Backgrounds/Threads': {
    videoUrl: '/assets/video/threads.webm',
    description: 'Animated pattern of lines forming a fabric-like motion.',
    category: 'Backgrounds',
    name: 'Threads',
    docsUrl: 'https://reactbits.dev/backgrounds/threads',
    tags: []
  },
  'Backgrounds/Waves': {
    videoUrl: '/assets/video/waves.webm',
    description: 'Layered lines that form smooth wave patterns with animation.',
    category: 'Backgrounds',
    name: 'Waves',
    docsUrl: 'https://reactbits.dev/backgrounds/waves',
    tags: []
  },
  'Backgrounds/LiquidEther': {
    videoUrl: '/assets/video/liquidether.webm',
    description:
      'Interactive liquid shader with flowing distortion and customizable colors.',
    category: 'Backgrounds',
    name: 'LiquidEther',
    docsUrl: 'https://reactbits.dev/backgrounds/liquid-ether',
    tags: []
  },
  'Backgrounds/FloatingLines': {
    videoUrl: '/assets/video/floatinglines.webm',
    description: '3D floating lines that react to cursor movement.',
    category: 'Backgrounds',
    name: 'FloatingLines',
    docsUrl: 'https://reactbits.dev/backgrounds/floating-lines',
    tags: []
  },
  'Backgrounds/LightPillar': {
    videoUrl: '/assets/video/lightpillar.webm',
    description: 'Vertical pillar of light with glow effects.',
    category: 'Backgrounds',
    name: 'LightPillar',
    docsUrl: 'https://reactbits.dev/backgrounds/light-pillar',
    tags: []
  },
  'Backgrounds/PixelSnow': {
    videoUrl: '/assets/video/pixelsnow.webm',
    description: 'Falling pixelated snow effect with customizable density and speed.',
    category: 'Backgrounds',
    name: 'PixelSnow',
    docsUrl: 'https://reactbits.dev/backgrounds/pixel-snow',
    tags: []
  }
};

export default componentMetadata;
