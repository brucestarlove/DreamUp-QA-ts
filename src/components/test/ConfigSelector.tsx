'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ConfigSelectorProps {
  value: string
  onSelect: (value: string) => void
}

export default function ConfigSelector({ value, onSelect }: ConfigSelectorProps) {
  const [configs, setConfigs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/configs')
      const data = await response.json()
      setConfigs(data.configs || [])
    } catch (error) {
      console.error('Failed to fetch configs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={value} onValueChange={onSelect} disabled={loading}>
      <SelectTrigger className="bg-dark-navy border-light-blue/20">
        <SelectValue placeholder={loading ? "Loading..." : "Select config"} />
      </SelectTrigger>
      <SelectContent>
        {configs.map((config) => (
          <SelectItem key={config} value={config}>
            {config.replace('.json', '')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

