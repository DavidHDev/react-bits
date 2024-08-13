import AnimatedContainerDemo from "../demo/Animations/AnimatedContainerDemo";
import BlobCursorDemo from "../demo/Animations/BlobCursorDemo";
import BlurTextDemo from "../demo/TextAnimations/BlurTextDemo";
import DockDemo from "../demo/Components/DockDemo";
import FadeDemo from "../demo/Animations/FadeDemo";
import FollowCursorDemo from "../demo/Animations/FollowCursorDemo";
import MagnetDemo from "../demo/Animations/MagnetDemo";
import MasonryDemo from "../demo/Components/MasonryDemo";
import SplitTextDemo from "../demo/TextAnimations/SplitTextDemo";
import StackDemo from "../demo/Components/StackDemo";
import WaveTextDemo from "../demo/TextAnimations/WaveTextDemo";
import ShinyTextDemo from "../demo/TextAnimations/ShinyTextDemo";
import GradientTextDemo from "../demo/TextAnimations/GradientTextDemo";
import SquaresDemo from "../demo/Backgrounds/SquaresDemo";
import CrosshairDemo from "../demo/Animations/CrosshairDemo";
import CountUpDemo from "../demo/TextAnimations/CountUpDemo";

export const componentMap = {
  'split-text': SplitTextDemo,
  'blur-text': BlurTextDemo,
  'blob-cursor': BlobCursorDemo,
  'wave-text': WaveTextDemo,
  'animated-container': AnimatedContainerDemo,
  'follow-cursor': FollowCursorDemo,
  'magnet': MagnetDemo,
  'fade': FadeDemo,
  'stack': StackDemo,
  'dock': DockDemo,
  'masonry': MasonryDemo,
  'shiny-text': ShinyTextDemo,
  'gradient-text': GradientTextDemo,
  'squares': SquaresDemo,
  'crosshair': CrosshairDemo,
  'count-up': CountUpDemo
  // Map other subcategories to their components here
};