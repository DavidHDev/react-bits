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
  'masonry': MasonryDemo
  // Map other subcategories to their components here
};