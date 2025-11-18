## Tailwind Configuration Required

This component uses **Tailwind CSS utility classes** exclusively. No separate CSS file is needed.

Ensure your `tailwind.config.js` includes:
- Basic utilities (width, height, positioning, etc.)
- Shadow utilities
- Border radius utilities
- Gradient utilities

## Example Usage

```jsx
import Masonry from './Masonry';

const items = [
  {
    id: '1',
    img: 'https://example.com/image1.jpg',
    height: 300,
    url: 'https://example.com'
  },
  // ...more items
];

export default function MasonryDemo() {
  return (
    <div className="w-full h-screen">
      <Masonry items={items} />
    </div>
  );
}
```

## Props

- `items` - Array of objects with `id`, `img`, `height`, `url`
- `ease` - GSAP easing function (default: 'power3.out')
- `duration` - Animation duration in seconds (default: 0.6)
- `stagger` - Delay between item animations in seconds (default: 0.05)
- `animateFrom` - Initial animation direction: 'top', 'bottom', 'left', 'right', 'center', 'random' (default: 'bottom')
- `scaleOnHover` - Scale items on hover (default: true)
- `hoverScale` - Scale value on hover (default: 0.95)
- `blurToFocus` - Blur animation on load (default: true)
- `colorShiftOnHover` - Color gradient overlay on hover (default: false)