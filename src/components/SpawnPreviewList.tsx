import React from 'react'
import { useSpawnPreviews } from '../store/useSpawnPreviews'
import SpawnPreview from './SpawnPreview'

const SpawnPreviewList: React.FC = () => {
  const previews = useSpawnPreviews((s) => s.previews)
  const remove = useSpawnPreviews((s) => s.remove)

  return (
    <>
      {previews.map((p) => (
        <SpawnPreview key={p.id} id={p.id} type={p.type} onComplete={() => remove(p.id)} />
      ))}
    </>
  )
}

export default SpawnPreviewList
