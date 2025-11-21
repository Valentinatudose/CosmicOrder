import { Archetype, QuizQuestion } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    question: "When you think about your biggest desire, what's your immediate, gut-level feeling?",
    options: [
      { text: "Excitement and possibility. I can almost feel it happening!", archetype: Archetype.HopefulDreamer },
      { text: "A mix of hope and anxiety. I want it, but I'm scared of being disappointed.", archetype: Archetype.HesitantProtector },
      { text: "I focus on the practical steps. Feelings are secondary to a solid plan.", archetype: Archetype.LogicalRealist },
    ],
  },
  {
    question: "A past attempt to achieve a similar goal didn't work out. How do you interpret that experience?",
    options: [
      { text: "It just wasn't the right time or the right approach. The universe has a better plan for me.", archetype: Archetype.HopefulDreamer },
      { text: "It proves that I need to be more careful and protect myself from getting hurt again.", archetype: Archetype.HesitantProtector },
      { text: "I analyze what went wrong, identify the flawed variables, and create a more efficient strategy for next time.", archetype: Archetype.LogicalRealist },
    ],
  },
  {
    question: "How do you typically make important life decisions?",
    options: [
      { text: "I follow my intuition and signs from the universe. If it feels right, it is right.", archetype: Archetype.HopefulDreamer },
      { text: "I weigh the pros and cons, but ultimately my fear of making the wrong choice can be paralyzing.", archetype: Archetype.HesitantProtector },
      { text: "With data. I research, create spreadsheets, and make a logical choice based on evidence.", archetype: Archetype.LogicalRealist },
    ],
  },
];