'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ConfigSelector from '@/components/test/ConfigSelector'

interface TopBarProps {
  onRunTest: (config: any) => void
}

export default function TopBar({ onRunTest }: TopBarProps) {
  const [gameUrl, setGameUrl] = useState('')
  const [selectedConfig, setSelectedConfig] = useState('')
  const [enableLLM, setEnableLLM] = useState(false)
  const [model, setModel] = useState('gpt-4o-mini')
  const [headed, setHeaded] = useState(false)
  const [retries, setRetries] = useState('3')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRunTest = async () => {
    if (!gameUrl) {
      setError('Please enter a game URL')
      return
    }

    const testConfig = {
      gameUrl,
      config: selectedConfig,
      llm: enableLLM,
      model,
      headed,
      retries: parseInt(retries),
    }

    try {
      const response = await fetch('/api/test/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Test execution not yet implemented')
      } else {
        onRunTest(testConfig)
        setError(null)
      }
    } catch (err) {
      setError('Failed to start test')
    }
  }

  return (
    <div className="h-[180px] bg-gradient-deepspace border-b border-light-blue/20 shadow-elevated">
      <div className="h-full px-6 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <Image
              src="/starscape-star.png"
              alt="Starscape Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard | DreamUp Browser Game QA Pipeline</h1>
            <p className="text-sm text-white/60">AI-Powered Browser Game Testing</p>
          </div>
        </div>

        {/* Test Execution Section */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            {showForm ? 'Hide' : 'Configure Test'}
          </Button>
          
          {!showForm && (
            <Button
              onClick={handleRunTest}
              className="gap-2"
              disabled={!gameUrl}
            >
              <Play className="w-4 h-4" />
              Run Test
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Form */}
      {showForm && (
        <div className="px-6 pb-4 border-t border-light-blue/10 pt-4 bg-dark-navy/30">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2">
              <label className="text-sm text-white/80 mb-2 block">Game URL</label>
              <Input
                placeholder="https://example.com/game"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                className="bg-dark-navy border-light-blue/20"
              />
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">Config File</label>
              <ConfigSelector
                value={selectedConfig}
                onSelect={setSelectedConfig}
              />
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-dark-navy border-light-blue/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-white/80">Enable LLM</label>
              <Switch checked={enableLLM} onCheckedChange={setEnableLLM} />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-white/80">Headed Mode</label>
              <Switch checked={headed} onCheckedChange={setHeaded} />
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">Retries</label>
              <Input
                type="number"
                value={retries}
                onChange={(e) => setRetries(e.target.value)}
                className="bg-dark-navy border-light-blue/20"
                min="0"
                max="10"
              />
            </div>

            <Button onClick={handleRunTest} className="gap-2">
              <Play className="w-4 h-4" />
              Run Test
            </Button>
          </div>

          {error && (
            <Alert className="mt-4 bg-destructive/10 border-destructive/50">
              <AlertDescription className="text-white">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}

