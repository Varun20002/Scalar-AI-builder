import kb from './scaler.json'

export interface KBSnippet {
  id: string
  text: string
  relevance_tags: string[]
}

function buildSnippets(): KBSnippet[] {
  const snippets: KBSnippet[] = []

  for (const prog of kb.programs) {
    snippets.push({
      id: `prog-${prog.id}-overview`,
      text: `Program: ${prog.name} (${prog.duration}, ${prog.price_display}). ${prog.tagline}`,
      relevance_tags: ['program', 'overview', prog.id, 'cost', 'duration'],
    })

    for (const mod of prog.curriculum_modules || []) {
      snippets.push({
        id: `${prog.id}-${mod.id}`,
        text: `[${prog.name}] Module: ${mod.name} (${'duration' in mod ? mod.duration : 'included'}). Topics: ${mod.topics.join('; ')}. AI angle: ${mod.ai_angle || 'integrated throughout'}.`,
        relevance_tags: ['curriculum', 'module', prog.id, mod.name.toLowerCase(), mod.ai_angle || ''],
      })
    }

    for (const inst of prog.key_instructors || []) {
      snippets.push({
        id: `${prog.id}-${inst.id}`,
        text: `[${prog.name}] Instructor: ${inst.name} (${inst.role}). Teaches: ${inst.teaches}. Background: ${inst.background} Rating: ${inst.rating}/5.`,
        relevance_tags: ['instructor', 'mentor', 'practitioner', prog.id, inst.name.toLowerCase()],
      })
    }

    for (const proj of prog.projects || []) {
      snippets.push({
        id: `${prog.id}-${proj.id}`,
        text: `[${prog.name}] Project: ${proj.name}. Stack: ${proj.stack.join(', ')}. AI feature: ${proj.ai_feature}`,
        relevance_tags: ['project', 'portfolio', prog.id],
      })
    }

    if (prog.outcomes) {
      snippets.push({
        id: `${prog.id}-outcomes`,
        text: `[${prog.name}] Target roles: ${prog.outcomes.job_roles_targeted.join(', ')}. ${prog.outcomes.placement_support}. ${'market_context' in prog.outcomes ? (prog.outcomes as {market_context?: string}).market_context ?? '' : ''}`,
        relevance_tags: ['outcomes', 'placement', 'salary', 'jobs', prog.id],
      })
    }
  }

  for (const obj of kb.common_objections) {
    snippets.push({
      id: `obj-${obj.id}`,
      text: `Objection: "${obj.objection}" — Handle: ${obj.grounded_handle}`,
      relevance_tags: ['objection', 'handle', ...obj.tags],
    })
  }

  for (const diff of kb.platform_differentiators) {
    snippets.push({
      id: `diff-${diff.id}`,
      text: `Differentiator: ${diff.claim}. ${diff.detail}`,
      relevance_tags: ['differentiator', 'why scaler', diff.id],
    })
  }

  for (const ctx of kb.market_context) {
    snippets.push({
      id: `ctx-${ctx.id}`,
      text: `Market context: ${ctx.claim} (Source: ${ctx.source})`,
      relevance_tags: ['market', 'jobs', 'ai growth', ctx.id],
    })
  }

  return snippets
}

const ALL_SNIPPETS = buildSnippets()

export function retrieveSnippets(query: string, topK = 6): KBSnippet[] {
  const queryLower = query.toLowerCase()
  const queryTerms = queryLower
    .split(/\s+/)
    .filter((t) => t.length > 3)

  const scored = ALL_SNIPPETS.map((snippet) => {
    const textLower = snippet.text.toLowerCase()
    const tagsLower = snippet.relevance_tags.join(' ').toLowerCase()
    let score = 0

    for (const term of queryTerms) {
      if (textLower.includes(term)) score += 2
      if (tagsLower.includes(term)) score += 3
    }

    // Boost objection snippets if query mentions objection-related terms
    if (
      snippet.id.startsWith('obj-') &&
      (queryLower.includes('objection') || queryLower.includes('concern') || queryLower.includes('question'))
    ) {
      score += 2
    }

    return { snippet, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.snippet)
}

export function retrieveByPersonaType(
  personaType: 'engineer' | 'senior' | 'student',
  topK = 8
): KBSnippet[] {
  const queries: Record<typeof personaType, string> = {
    engineer: 'software engineer product company switch AI engineering LLM RAG agents salary TCS service',
    senior: 'senior engineer google advanced cohort instructor practitioners production systems',
    student: 'student placement guarantee job financing entrance test government job',
  }
  return retrieveSnippets(queries[personaType], topK)
}

export function getAllObjectionSnippets(): KBSnippet[] {
  return ALL_SNIPPETS.filter((s) => s.id.startsWith('obj-'))
}

export type { KBSnippet as default }
