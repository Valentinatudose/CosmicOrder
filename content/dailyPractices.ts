import { Archetype, DailyPractice } from '../types';

export const dailyPractices: Record<Archetype, DailyPractice> = {
  [Archetype.HopefulDreamer]: {
    title: "Grounded Action",
    description: "Today, we bridge the gap between your beautiful dream and physical reality. This practice is about taking one small, tangible step.",
    journalPrompt: "What is the smallest, easiest physical action I can take today that aligns with my vision? (e.g., sending one email, a 5-minute research session, tidying a specific space)",
    tasks: [
      "Tidy your workspace for 5 minutes to create space for your new reality.",
      "Send one email or text message related to your goal.",
      "Spend 10 minutes researching a single aspect of your vision.",
      "Write down the top 3 priorities for the week that align with your goal.",
      "Go for a 15-minute walk and pay attention to the physical sensations of your feet on the ground."
    ]
  },
  [Archetype.HesitantProtector]: {
    title: "Safe to Receive",
    description: "Your focus today is on creating a feeling of safety and worthiness. We are teaching your nervous system that it is safe to have what you want.",
    journalPrompt: "Describe a time in the past, no matter how small, when something wonderful and unexpected happened. What did it feel like to receive it?",
    tasks: [
      "When someone gives you a compliment today, simply say 'Thank you' without deflecting.",
      "Buy yourself a small, beautiful thing just because (a coffee, a flower, a nice pen).",
      "Let someone help you with something small, like holding a door open or carrying something.",
      "Spend 5 minutes listening to your favorite uplifting song, doing nothing else but receiving the music.",
      "Consciously notice 3 beautiful things on your way to work or while running an errand."
    ]
  },
  [Archetype.LogicalRealist]: {
    title: "Embodied Goal",
    description: "Let's move beyond the plan and into the feeling. This practice connects your logical goal with the emotional energy that will magnetize it.",
    journalPrompt: "If your goal was already achieved, how would you feel in your body right now? Describe the physical sensations of success, relief, and joy.",
    tasks: [
      "Set a timer for 2 minutes, close your eyes, and just feel the emotion of your goal already being real.",
      "Put on a song that represents the feeling of your success and dance or move to it for its full duration.",
      "Write a short 'thank you' note to the universe as if your desire has already manifested.",
      "Look in the mirror and say your vision headline out loud with a genuine smile.",
      "Before starting a task, take 3 deep breaths and imagine infusing the task with the energy of your fulfilled vision."
    ]
  },
};