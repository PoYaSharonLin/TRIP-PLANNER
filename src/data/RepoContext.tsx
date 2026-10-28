import { createContext, useContext } from 'react'
import type { Repo } from './repo'

const RepoContext = createContext<Repo | null>(null)

export function RepoProvider({
  repo,
  children,
}: {
  repo: Repo
  children: React.ReactNode
}) {
  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>
}

export function useRepo(): Repo {
  const repo = useContext(RepoContext)
  if (!repo) throw new Error('useRepo must be used within RepoProvider')
  return repo
}
