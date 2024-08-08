import AnimatedContainerDemo from "../demo/AnimatedContainerDemo";
import BlobCursorDemo from "../demo/BlobCursorDemo";
import BlurTextDemo from "../demo/BlurTextDemo";
import FadeDemo from "../demo/FadeDemo";
import FollowCursorDemo from "../demo/FollowCursorDemo";
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
  'fade': FadeDemo,
  'stack': StackDemo
  // Map other subcategories to their components here
};