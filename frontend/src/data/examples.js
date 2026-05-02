export const EXAMPLES = [
  {
    id: 1,
    scenario: "Medical",
    language: "Indonesian",
    input: "You need further testing.",
    output: {
      literal: "You need further testing.",
      literalTranslated: "Anda perlu melakukan tes lebih lanjut.",
      context: "This could be serious. Don't delay your follow-up appointment.",
      contextTranslated: "Ini mungkin serius. Jangan tunda janji tindak lanjut Anda.",
      urgency: "high",
      tone: "Calm but cautious",
      emotion: "Concern",
      clarity: "Medium",
      whyExpanded: "Doctors use indirect language to avoid alarming patients immediately."
    }
  },
  {
    id: 2,
    scenario: "School",
    language: "Indonesian",
    input: "We should talk about your child's progress.",
    output: {
      literal: "We should discuss your child's academic performance.",
      literalTranslated: "Kami harus membahas kinerja akademik anak Anda.",
      context: "There may be academic or behavioral concerns we need to address.",
      contextTranslated: "Mungkin ada kekhawatiran akademis atau perilaku yang perlu kami tangani.",
      urgency: "moderate",
      tone: "Professional, neutral",
      emotion: "Concern",
      clarity: "Low",
      whyExpanded: "School staff use soft language to avoid sounding accusatory."
    }
  },
  {
    id: 3,
    scenario: "Legal",
    language: "Spanish",
    input: "We'll need to review your case more thoroughly.",
    output: {
      literal: "We must conduct a detailed examination of your case.",
      literalTranslated: "Tenemos que hacer un examen más detallado de su caso.",
      context: "This suggests there are complications or issues that require more investigation.",
      contextTranslated: "Esto sugiere que hay complicaciones o problemas que requieren más investigación.",
      urgency: "high",
      tone: "Formal, serious",
      emotion: "Uncertainty",
      clarity: "Medium",
      whyExpanded: "Legal professionals use formal language to maintain distance while signaling difficulty."
    }
  }
];