import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/LanguageContext"

export function FAQ() {
  const { t } = useLanguage()

  const faqs = [
    {
      question: t.faq.questions.q5.question,
      answer: t.faq.questions.q5.answer
    },
    {
      question: t.faq.questions.q6.question,
      answer: t.faq.questions.q6.answer
    },
    {
      question: t.faq.questions.q4.question,
      answer: t.faq.questions.q4.answer
    },
    {
      question: t.faq.questions.q1.question,
      answer: t.faq.questions.q1.answer
    },
    {
      question: t.faq.questions.q2.question,
      answer: t.faq.questions.q2.answer
    },
    {
      question: t.faq.questions.q3.question,
      answer: t.faq.questions.q3.answer
    }
  ]

  return (
    <section className="relative py-20 lg:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            {t.faq.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.faq.subtitle}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg border px-6"
              >
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}