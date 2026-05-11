import { AnimatePresence, motion } from 'framer-motion'
import { Image, X } from 'lucide-react'
import { useState } from 'react'

interface ScreenshotViewerProps {
  image: string
  title: string
}

const ScreenshotViewer = ({ image, title }: ScreenshotViewerProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="group aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-right"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <img
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          src={image}
          alt={title}
        />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="w-full max-w-4xl rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Image className="h-5 w-5 text-sky-500" />
                <h3 className="text-lg font-black">{title}</h3>
              </div>
              <img className="max-h-[78vh] w-full rounded-2xl object-contain" src={image} alt={title} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default ScreenshotViewer
