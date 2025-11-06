'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ScreenshotMetadata } from '@/lib/types/test-result'
import { formatTimestamp } from '@/lib/utils/date'

interface ScreenshotGalleryProps {
  screenshots: ScreenshotMetadata[]
  sessionId: string
}

export default function ScreenshotGallery({ screenshots, sessionId }: ScreenshotGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ScreenshotMetadata | null>(null)

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No screenshots available</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {screenshots.map((screenshot) => {
          const isBaseline = screenshot.label === 'baseline'
          const isEnd = screenshot.label === 'end'
          const imageUrl = `/api/sessions/${sessionId}/screenshots/${screenshot.filename}`

          return (
            <button
              key={screenshot.filename}
              onClick={() => setSelectedImage(screenshot)}
              className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-light-blue/50 transition-all duration-200"
            >
              <div className="aspect-video relative bg-dark-navy">
                <Image
                  src={imageUrl}
                  alt={screenshot.label}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-dark-navy/90 border-t border-light-blue/20">
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    variant={isBaseline || isEnd ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {isBaseline ? 'Baseline' : isEnd ? 'Final' : `Action ${screenshot.stepIndex}`}
                  </Badge>
                  <span className="text-xs text-white/60">
                    {new Date(screenshot.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-white/80 truncate">
                  {screenshot.filename}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl">
          {selectedImage && (
            <>
              <DialogTitle className="text-light-blue">
                {selectedImage.label === 'baseline' ? 'Baseline' : 
                 selectedImage.label === 'end' ? 'Final Screenshot' : 
                 `Action ${selectedImage.stepIndex}`}
              </DialogTitle>
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-dark-navy rounded-lg overflow-hidden">
                  <Image
                    src={`/api/sessions/${sessionId}/screenshots/${selectedImage.filename}`}
                    alt={selectedImage.label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 80vw"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Filename:</span>
                    <span className="text-white ml-2">{selectedImage.filename}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Timestamp:</span>
                    <span className="text-white ml-2">{formatTimestamp(selectedImage.timestamp)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

