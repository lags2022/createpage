import * as React from "react"
import { motion } from "motion/react"
import { Lightbulb, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GeneratingLoaderProps {
  message?: string
  messages?: string[]
  onCancel?: () => void
  loopIntervalMs?: number
}

export function GeneratingLoader({
  message = "Generando tu aplicación...",
  messages,
  onCancel,
  loopIntervalMs = 1800,
}: GeneratingLoaderProps) {
  const [dots, setDots] = React.useState(".")
  const phrases = messages && messages.length > 0 ? messages : [
    "Analizando tu idea",
    "Diseñando componentes",
    "Armando UI",
    "Aplicando estilos",
    "Puliendo detalles",
  ]
  const [phraseIndex, setPhraseIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".")
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  React.useEffect(() => {
    const t = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length)
    }, loopIntervalMs)
    return () => clearInterval(t)
  }, [phrases.length, loopIntervalMs])

  return (
    <div className="relative flex min-h-[400px] items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-background/90 to-secondary/5 shadow-sm">
      {onCancel && (
        <div className="absolute right-3 top-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onCancel}
            aria-label="Cancelar generación"
            title="Cancelar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        </div>
      )}
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        {/* Icono principal animado */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 0 0 rgba(0,0,0,0)",
                "0 2px 16px 0 rgba(0,0,0,0.06)",
                "0 0 0 0 rgba(0,0,0,0)",
              ],
            }}
            transition={{
              scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Lightbulb className="size-8" />
          </motion.div>
          
          {/* Partículas flotantes */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-primary/40"
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 0,
                scale: 0.5
              }}
              animate={{
                x: [0, 20 + i * 15, -10 - i * 10, 0],
                y: [0, -20 - i * 10, -30 + i * 5, 0],
                opacity: [0, 0.8, 0.4, 0],
                scale: [0.5, 1, 0.8, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
              style={{
                top: `${-10 + i * 5}%`,
                left: `${45 + i * 10}%`,
              }}
            >
              <Sparkles className="size-4" />
            </motion.div>
          ))}
        </motion.div>

        {/* Texto principal */}
        <div className="space-y-3">
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.h1
              className="text-2xl font-bold tracking-tight"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/60%) 50%, hsl(var(--primary)) 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              StartNow
            </motion.h1>
            <motion.div
              className="text-primary"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="size-6" />
            </motion.div>
          </motion.div>

          <motion.p
            className="text-muted-foreground"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {message}
            <motion.span
              className="inline-block w-8 text-left"
              key={dots}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {dots}
            </motion.span>
          </motion.p>
        </div>

        {/* Barra de progreso animada */}
        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="h-2 overflow-hidden rounded-full bg-primary/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: ["0%", "70%", "100%", "0%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.4, 0.8, 1]
              }}
            />
          </div>
        </motion.div>

        {/* Mensajes cíclicos */}
        <motion.div
          className="min-h-4 text-center text-xs text-muted-foreground/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {phrases[phraseIndex]}
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
