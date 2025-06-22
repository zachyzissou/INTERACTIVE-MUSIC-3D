import { ObjectType } from '../config/objectTypes'
import { playNote, playChord, playBeat, startLoop } from './audio'

/**
 * Trigger a sound based on object type.
 */
export function triggerSound(type: ObjectType, id: string): void {
  if (type === 'note') {
    playNote(id)
  } else if (type === 'chord') {
    playChord(id)
  } else if (type === 'beat') {
    playBeat(id)
  } else {
    startLoop(id)
  }
}
