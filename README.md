# SayWhat
**Translate words. Understand meaning.**
 
🔗 [**Live Demo**](https://slang-sense--megumifir.replit.app/) 💻 [**GitHub**](https://github.com/rojanjn/HuskyHacks-2026) ⭐ [**Devpost**](https://devpost.com/software/dualvoice)

---

## Inspiration

Imagine you're sitting in a doctor’s office.

The doctor says: *“We need to do some further testing.”*

You hear the words, but what you really need to know is:
- Is this routine?
- Is this urgent?
- Should I be worried?

For many immigrant families, this uncertainty is constant.

Across the United States, over **15 million people** live in households where English is not the primary language. In critical moments—medical appointments, school meetings, legal consultations—language barriers don’t just slow communication. They distort decision-making.

Even when translation exists, one problem remains:

> Literal meaning is not enough to make informed decisions.

People need context: tone, intent, urgency, and cultural nuance.

SayWhat was built to close that gap.

---

## What It Does

SayWhat is an AI-assisted translation layer that goes beyond literal translation by adding **decision-relevant context**.

Each phrase is analyzed across multiple dimensions:

- **Literal Meaning** — direct translation of the original phrase  
- **Contextual Meaning** — what the phrase implies in real-world usage  
- **Tone Analysis** — neutral, urgent, cautious, formal, etc.  
- **Cultural Interpretation** — how intent changes across contexts  
- **Natural Equivalent** — fluent phrasing in the target language  
- **Slang & Indirect Language Breakdown** — idioms and implied meaning explained clearly  

Additional features:
- Voice input for real-time conversation capture  
- Context modes: Medical, Legal, Education, Business, Casual  
- Structured output designed for fast scanning in high-pressure situations  

Example:

> “We’ll monitor it.”

Becomes:
- Doctors are currently not diagnosing a serious issue, but want to observe changes over time.
- This usually indicates caution rather than immediate concern.
- Follow-up may be required depending on symptoms.

The goal is not just translation. It is clarity under uncertainty.

---

## How We Built It

**Frontend:** React 19 + Vite + Tailwind CSS + Framer Motion  
Designed as a structured, information-dense interface optimized for rapid comprehension in time-sensitive contexts.

The UI uses a dual-panel layout:
- Left: raw input and translation
- Right: layered contextual analysis (structured, scannable breakdown)

This design prioritizes decision speed over visual simplicity, ensuring users can extract meaning quickly in high-pressure environments.

**Backend:** Express 5 + TypeScript REST API with typed route handlers and clean separation between transport and business logic.

**AI:** Google Gemini API — prompted to return structured JSON with six consistent fields. Significant prompt engineering was required to ensure stable contextual interpretation across medical, legal, and educational domains.

**Database:** PostgreSQL via Drizzle ORM for translation history and example phrase storage.

**Voice:** Web Speech API for browser-native voice input with real-time recording state.

---

## Challenges

Designing for real-world decision-making pressure required more than readability. Users often operate in environments like hospitals or schools where cognitive load is already high. The interface needed to surface meaning hierarchy instantly, without requiring exploration.

Another challenge was contextual accuracy. The same phrase can carry different implications depending on domain (medical vs. casual vs. legal). Ensuring the model consistently adjusted interpretation without introducing false urgency required iterative prompt engineering.

---

## Accomplishments

- A structured translation system that separates literal meaning from implied intent
- A UI optimized for rapid comprehension in high-pressure environments
- Context-aware AI outputs tuned for medical, legal, and educational domains
- Full-stack implementation completed within a hackathon timeline

---

## What We Learned

Translation systems fail not at language conversion, but at decision support.

The critical gap is not “what was said”, but:
- what it implies  
- what urgency it carries  
- what action it suggests  

Building for this required treating language as a decision system, not a linguistic system.

---

## What's Next

- Real-time conversational mode for live interpretation during appointments
- Confidence and urgency scoring for clearer decision guidance
- Offline-first support for low-connectivity environments
- Integration with healthcare and education systems as a communication layer, not just a tool

The hackathon version validates the concept. The next step is infrastructure-level adoption.

---

## Built With

`react` `typescript` `express` `google-gemini` `postgresql` `drizzle-orm` `tailwindcss` `framer-motion` `vite` `pnpm` `web-speech-api`
