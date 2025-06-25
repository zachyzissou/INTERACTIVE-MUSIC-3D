import { ObjectType } from '../config/objectTypes'
import { playNote, playChord, playBeat, startLoop } from './audio'

/**
 * Trigger a sound based on object type.
 */
export async function triggerSound(type: ObjectType, id: string): Promise<void> {
  if (type === 'note') {
    await playNote(id)
  } else if (type === 'chord') {
    await playChord(id)
  } else if (type === 'beat') {
    await playBeat(id)
  } else {
    await startLoop(id)
  }
}
