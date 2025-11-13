import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TelegramLogo } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/LanguageContext"

export function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer className="relative border-t border-border/50 bg-gradient-to-br from-background via-card/30 to-background py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">SYNTRIX</h3>
            <p className="text-sm text-muted-foreground">
              {t.footer.tagline}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t.footer.socialMedia}</h4>
            <div className="flex gap-4">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground transition-all">
                  <TelegramLogo size={20} weight="fill" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        <Separator className="my-8" />
        
        <motion.div 
          className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>{t.footer.copyright}</p>
          <div className="flex gap-6">
            <motion.a 
              href="#" 
              className="hover:text-primary transition-colors"
              whileHover={{ y: -2 }}
            >
              {t.footer.privacyPolicy}
            </motion.a>
            <motion.a 
              href="#" 
              className="hover:text-primary transition-colors"
              whileHover={{ y: -2 }}
            >
              {t.footer.termsOfUse}
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}