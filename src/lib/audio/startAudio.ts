import { startAudioContext, playSpawnSound } from '../audio'
import { useAudioEngine } from '../../store/useAudioEngine'

export async function startAudio() {
  await startAudioContext()
  useAudioEngine.getState().setAudioReady(true)
  await playSpawnSound()
}
