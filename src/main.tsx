import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { RepoProvider } from './data/RepoContext'
import { createRepo } from './data/createRepo'
import './index.css'

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!)
  const repo = await createRepo()
  root.render(
    <StrictMode>
      {/* HashRouter：GitHub Pages 等靜態空間重新整理也不會 404 */}
      <HashRouter>
        <RepoProvider repo={repo}>
          <App />
        </RepoProvider>
      </HashRouter>
    </StrictMode>,
  )
}

void bootstrap()
