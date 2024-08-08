import AnimatedContainerDemo from "../demo/AnimatedContainerDemo";
import BlobCursorDemo from "../demo/BlobCursorDemo";
import BlurTextDemo from "../demo/BlurTextDemo";
import DockDemo from "../demo/DockDemo";
import FadeDemo from "../demo/FadeDemo";
import FollowCursorDemo from "../demo/FollowCursorDemo";
import MagnetDemo from "../demo/MagnetDemo";
import SplitTextDemo from "../demo/SplitTextDemo";
import StackDemo from "../demo/StackDemo";
import WaveTextDemo from "../demo/WaveTextDemo";

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
  'dock': DockDemo
  // Map other subcategories to their components here
};