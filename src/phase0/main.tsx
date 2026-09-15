import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { VerifyPage } from './VerifyPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VerifyPage />
  </StrictMode>,
)
