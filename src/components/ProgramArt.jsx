import { CATEGORIES } from '../constants.js'

const SCENES = {
  news: { icon: 'fa-solid fa-tower-broadcast', motif: 'NEWSROOM', shapes: ['desk', 'signal'] },
  reality: { icon: 'fa-solid fa-person-hiking', motif: 'UNSCRIPTED', shapes: ['sun', 'mountains'] },
  series: { icon: 'fa-solid fa-masks-theater', motif: 'ORIGINAL SERIES', shapes: ['spotlight', 'city'] },
  latenight: { icon: 'fa-solid fa-microphone-lines', motif: 'LATE NIGHT', shapes: ['moon', 'stage'] },
  sports: { icon: 'fa-solid fa-trophy', motif: 'LIVE SPORTS', shapes: ['field', 'score'] },
  family: { icon: 'fa-solid fa-house-chimney', motif: 'FAMILY', shapes: ['sun', 'house'] },
  kids: { icon: 'fa-solid fa-shapes', motif: 'KIDS', shapes: ['clouds', 'stars'] },
  contest: { icon: 'fa-solid fa-bullseye', motif: 'GAME SHOW', shapes: ['lights', 'podium'] },
  movie: { icon: 'fa-solid fa-film', motif: 'FEATURE PRESENTATION', shapes: ['spotlight', 'film'] },
}

function hashText(text = '') {
  let h = 7
  for (let i = 0; i < text.length; i++) h = Math.imul(h, 31) + text.charCodeAt(i) | 0
  return Math.abs(h)
}

export function ProgramArt({ program, compact = false, showTitle = true, style = {} }) {
  if (!program) return null
  const cat = CATEGORIES[program.categoryId] || CATEGORIES.movie
  const scene = SCENES[program.categoryId] || SCENES.movie
  const topic = cat?.topics?.find(t => t.id === program.topicId)
  const seed = hashText(program.name)
  const angle = 115 + (seed % 36)
  const accent = cat?.color || '#f0c14b'
  const iconSize = compact ? 22 : 34

  return (
    <div className={`program-art ${compact ? 'program-art-compact' : ''}`} style={{
      '--art-accent': accent,
      '--art-angle': `${angle}deg`,
      ...style,
    }}>
      <div className="program-art-grid" />
      <div className={`program-art-shape shape-${scene.shapes[0]}`} />
      <div className={`program-art-shape shape-${scene.shapes[1]}`} />
      <div className="program-art-vignette" />
      <div className="program-art-content">
        <div className="program-art-kicker">{topic?.label || scene.motif}</div>
        <i className={scene.icon} style={{ fontSize: iconSize }} />
        {showTitle && <div className="program-art-title">{program.name}</div>}
        <div className="program-art-network">A NETWORK ORIGINAL</div>
      </div>
    </div>
  )
}
