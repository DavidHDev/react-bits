import { useEffect, useRef } from 'react';
import Orb from '../../../tools/sound-lab/components/Orb';
import { createPlayer } from '../../../tools/sound-lab/engine/player';
import petal from '../../../sounds/js/petal';

const player = createPlayer();
const SOUND = { id: 'petal', recipe: petal };
const TUNE = { volume: -4 };

const canPlay = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;

export default function SoundPreview() {
  const ref = useRef(null);

  useEffect(() => {
    const card = ref.current?.closest('.ln-tools-card');
    if (!card) return undefined;
    player.preload(SOUND, TUNE);
    const enter = event => {
      if (event.pointerType !== 'mouse' || !canPlay()) return;
      player.play(SOUND, TUNE).catch(() => null);
    };
    card.addEventListener('pointerenter', enter);
    return () => card.removeEventListener('pointerenter', enter);
  }, []);

  return (
    <div className="ln-tools-orb" ref={ref}>
      <Orb player={player} />
    </div>
  );
}
