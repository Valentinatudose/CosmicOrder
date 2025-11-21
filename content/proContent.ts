import { Path, ProProgram } from '../types';

// The R.E.S.E.T. steps are now the foundation for our pro content.
const resetSteps = [
    { step: 1, title: "Recognition (Pattern Audit)", relationshipTheme: "Uncover the invisible beliefs running your relationships.", purposeTheme: "Identify the subconscious patterns holding you back from your purpose." },
    { step: 2, title: "Erasure (Subconscious Edit)", relationshipTheme: "Clear the core emotional wound and rewire your relational programming.", purposeTheme: "Neutralize past failures and limiting beliefs about your capabilities." },
    { step: 3, title: "Somatic Reboot (Embodied Shift)", relationshipTheme: "Transform how you feel in your body so confidence and calm become natural.", purposeTheme: "Generate the physical sensation of living your purpose with joy and impact." },
    { step: 4, title: "Empowerment (Mastery Phase)", relationshipTheme: "Gain relational discernment and secure communication tools.", purposeTheme: "Step into the confidence and certainty of the person who is already successful." },
    { step: 5, title: "Transformation (Completion)", relationshipTheme: "Embody your new blueprint for love that feels grounded and deeply aligned.", purposeTheme: "Solidify your new state of being, making your purposeful life an inevitable reality." },
];

export const proContent: Record<Path, ProProgram> = {
  [Path.Relationship]: {
    title: "The 5-Week Foundation for Embodied Love",
    steps: resetSteps.map(s => ({ step: s.step, title: s.title, theme: s.relationshipTheme })),
  },
  [Path.Purpose]: {
    title: "The 5-Week Foundation for Aligned Purpose",
    steps: resetSteps.map(s => ({ step: s.step, title: s.title, theme: s.purposeTheme })),
  },
};