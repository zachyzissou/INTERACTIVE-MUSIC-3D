// src/components/SpawnMenu.tsx
import React from 'react'
import styles from '../styles/spawnMenu.module.css'
import { ObjectType } from '../store/useObjects'
import { useObjects } from '../store/useObjects'

// Minimal flush UI menu to spawn new musical spheres
type SpawnMenuProps = {}

const SpawnMenu: React.FC<SpawnMenuProps> = () => {
  const spawn = useObjects((state) => state.spawn)
  return (
    <div className={styles.spawnMenu}>
      <button className={styles.spawnButton} onClick={() => spawn('note' as ObjectType)}>
        Note
      </button>
      <button className={styles.spawnButton} onClick={() => spawn('chord' as ObjectType)}>
        Chord
      </button>
      <button className={styles.spawnButton} onClick={() => spawn('beat' as ObjectType)}>
        Beat
      </button>
    </div>
  )
}

export default SpawnMenu
