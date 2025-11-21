import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Screen, Path, Archetype, VisionData, VisionBuilderInputs, Meditation, User } from './types';
import { quizQuestions } from './content/quizContent';
import { archetypeContent } from './content/archetypeContent';
import { dailyPractices } from './content/dailyPractices';
import { meditations } from './content/meditationContent';
import { tripwireProduct } from './content/tripwireContent';
import { proContent } from './content/proContent';
import { apiService } from './services/apiService';
import { geminiService } from './services/geminiService';
import { LockClosedIcon, CheckCircleIcon, SparklesIcon } from './components/icons';

// --- Audio Helper Functions ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const sampleRate = 24000;
  const numChannels = 1;
  
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}


// Reusable Components
const ScreenWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900 text-slate-100 ${className}`}>
        <div className="w-full max-w-md mx-auto animate-fadeIn">
            {children}
        </div>
    </div>
);

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className = '', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const PrimaryButton = (props: React.ComponentProps<typeof Button>) => (
    <Button {...props} className={`bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-500/50 ${props.className}`} />
);

const SecondaryButton = (props: React.ComponentProps<typeof Button>) => (
    <Button {...props} className={`bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/20 ${props.className}`} />
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h1 className="text-3xl sm:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">{children}</h1>
);

const Subtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-center text-lg text-slate-400 mb-8">{children}</p>
);

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 ${className}`}>
    {children}
  </div>
);

// --- New Auth Screens ---

const AuthForm: React.FC<{
  title: string;
  subtitle: string;
  buttonText: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  switchText: string;
  onSwitch: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ title, subtitle, buttonText, onSubmit, switchText, onSwitch, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <ScreenWrapper>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
          aria-label="Email Address"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
          aria-label="Password"
          required
          minLength={6}
        />
        {error && <p className="text-red-400 text-center">{error}</p>}
        <PrimaryButton onClick={() => {}} disabled={isLoading}>
          {isLoading ? 'Loading...' : buttonText}
        </PrimaryButton>
      </form>
      <button onClick={onSwitch} className="text-slate-400 mt-6 hover:text-slate-200 transition-colors">
        {switchText}
      </button>
    </ScreenWrapper>
  );
};

// Screen Components

const PathSelectionScreen: React.FC<{ onSelectPath: (path: Path) => void }> = ({ onSelectPath }) => (
    <ScreenWrapper>
        <SparklesIcon className="w-16 h-16 mx-auto text-purple-400 mb-4" />
        <Title>Cosmic Order 2.0</Title>
        <Subtitle>Align with your deepest desires. What journey calls to you today?</Subtitle>
        <div className="space-y-4">
            <PrimaryButton onClick={() => onSelectPath(Path.Relationship)}>Manifest an Ideal Relationship</PrimaryButton>
            <PrimaryButton onClick={() => onSelectPath(Path.Purpose)}>Discover Your Life Purpose</PrimaryButton>
        </div>
    </ScreenWrapper>
);

const ThemedWelcomeScreen: React.FC<{ path: Path; onNext: () => void }> = ({ path, onNext }) => {
    const welcomeTitle = path === Path.Relationship ? "Welcome, Architect of Love" : "Welcome, Pioneer of Purpose";
    const orderGoneWrong = path === Path.Relationship
        ? "ordered 'dream relationship' from the universe, but got 'another emotionally unavailable partner' instead"
        : "ordered 'fulfilling life purpose' but got 'more burnout and confusion'";
    const mainText = `Ever feel like you ${orderGoneWrong}? It's not bad luck; it's a mix-up in the cosmic kitchen. Your subconscious has an old recipe filled with outdated ingredients (like limiting beliefs). This app helps you write a new, crystal-clear recipe. Our job is to help you send that recipe to the kitchen, then trust the chef to bring you exactly what you crave, without calling them every five minutes.`;

    return (
        <ScreenWrapper>
            <Title>{welcomeTitle}</Title>
            <p className="text-center text-slate-300 text-lg mt-4 mb-8">{mainText}</p>
            <PrimaryButton onClick={onNext}>Start the Diagnosis</PrimaryButton>
        </ScreenWrapper>
    );
};

const ProcessIntroScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <ScreenWrapper>
        <Title>What's In Your Current Recipe?</Title>
        <Subtitle>To create your perfect meal, we first need to see what hidden patterns (or 'surprise ingredients') might be in your current subconscious recipe.</Subtitle>
        <p className="text-center text-slate-300 text-lg mb-8">The next 3 simple questions will reveal your core creative strength and your biggest block to manifestation.</p>
        <PrimaryButton onClick={onNext}>Begin Quiz</PrimaryButton>
    </ScreenWrapper>
);

const QuizScreen: React.FC<{ onQuizComplete: (archetype: Archetype) => void }> = ({ onQuizComplete }) => {
    const [step, setStep] = useState(0);
    const [scores, setScores] = useState<Record<Archetype, number>>({
        [Archetype.HopefulDreamer]: 0,
        [Archetype.HesitantProtector]: 0,
        [Archetype.LogicalRealist]: 0,
    });

    const handleAnswer = (archetype: Archetype) => {
        const newScores: Record<Archetype, number> = { ...scores, [archetype]: scores[archetype] + 1 };
        setScores(newScores);

        if (step < quizQuestions.length - 1) {
            setStep(step + 1);
        } else {
            const maxScore = Math.max(...Object.values(newScores));
            const finalArchetype = (Object.keys(newScores) as Archetype[]).find(
                (key) => newScores[key] === maxScore
            )!;
            onQuizComplete(finalArchetype);
        }
    };

    return (
        <ScreenWrapper>
            <Subtitle>Question {step + 1} of {quizQuestions.length}</Subtitle>
            <h2 className="text-2xl font-semibold text-center text-slate-100 mb-8">{quizQuestions[step].question}</h2>
            <div className="space-y-4">
                {quizQuestions[step].options.map((option, index) => (
                    <SecondaryButton key={index} onClick={() => handleAnswer(option.archetype)}>
                        {option.text}
                    </SecondaryButton>
                ))}
            </div>
        </ScreenWrapper>
    );
};

const QuizResultScreen: React.FC<{ archetype: Archetype; onNext: () => void }> = ({ archetype, onNext }) => {
    const content = archetypeContent[archetype];
    return (
        <ScreenWrapper>
            <Subtitle>Your Manifestation Archetype is</Subtitle>
            <Title>{content.title}</Title>
            <Card className="my-8">
                <p className="mb-4 text-lg">{content.description}</p>
                <p className="font-semibold text-purple-400">Your Core Block:</p>
                <p className="mb-4">{content.coreBlock}</p>
                <p className="font-semibold text-cyan-400">How This App Helps:</p>
                <p>{content.appSolution}</p>
            </Card>
            <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        </ScreenWrapper>
    );
};

const TripwireOfferScreen: React.FC<{ onAccept: () => void; onDecline: () => void }> = ({ onAccept, onDecline }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAccept = async () => {
        setIsLoading(true);
        const { success } = await apiService.processStripePayment(7, 'one-time');
        if (success) {
            onAccept();
        } else {
            alert("Payment failed. Please try again.");
            setIsLoading(false);
        }
    };
    
    return (
        <ScreenWrapper>
            <Title>One-Time Offer!</Title>
            <Subtitle>Supercharge your journey for just $7.</Subtitle>
            <Card>
                <p className="text-xl font-bold text-cyan-400 mb-2">{tripwireProduct.pdf.title}</p>
                <p className="mb-4">{tripwireProduct.pdf.content}</p>
                <p className="text-xl font-bold text-cyan-400 mb-2">{tripwireProduct.meditation.title}</p>
                <p>{tripwireProduct.meditation.script}</p>
            </Card>
            <div className="mt-8 space-y-4">
                <PrimaryButton onClick={handleAccept} disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Yes! Upgrade Me for $7'}
                </PrimaryButton>
                <SecondaryButton onClick={onDecline}>No thanks, take me to my vision</SecondaryButton>
            </div>
        </ScreenWrapper>
    );
};

const TripwireSuccessScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const handleDownload = async (productId: string) => {
        const link = await apiService.getSecureDownloadLink(productId);
        window.open(link, '_blank');
    };

    return (
        <ScreenWrapper>
            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <Title>Purchase Successful!</Title>
            <Subtitle>Access your materials below, then proceed to create your vision.</Subtitle>
            <div className="w-full space-y-4">
                <SecondaryButton onClick={() => handleDownload('archetype-pdf')}>Download Deep-Dive PDF</SecondaryButton>
                <SecondaryButton onClick={() => handleDownload('state-shift-audio')}>Download 'State Shift' Audio</SecondaryButton>
                <PrimaryButton onClick={onNext}>Continue to Create My Vision</PrimaryButton>
            </div>
        </ScreenWrapper>
    );
};

const VisionBuilderScreen: React.FC<{ path: Path; onVisionCreate: (vision: VisionData) => void }> = ({ path, onVisionCreate }) => {
    const [step, setStep] = useState(0);
    const [inputs, setInputs] = useState<VisionBuilderInputs>({
      values: '',
      lifestyle: '',
      work: '',
      community: '',
      fun: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Crafting your vision...");
    const [error, setError] = useState<string | null>(null);
    const MIN_CHARS = 15;

    const [isIdeasLoading, setIsIdeasLoading] = useState(false);
    const [ideas, setIdeas] = useState<string[]>([]);

    const loadingMessages = useMemo(() => [
        "Consulting the cosmic blueprint...",
        "Preparing the ingredients...",
        "Aligning energetic frequencies...",
        "Placing your order with the universe...",
    ], []);

    const questions = useMemo(() => path === Path.Relationship ? [
        { key: 'values' as const, title: "Shared Values", subtitle: "Start with 'My partner and I...' and compose a sentence that describes your shared values and how they are demonstrated in your relationship." },
        { key: 'lifestyle' as const, title: "Lifestyle", subtitle: "Start with 'We live...' and compose a sentence that describes your home environment and lifestyle in your vision." },
        { key: 'work' as const, title: "Work", subtitle: "Start with 'Our work...' and describe the role of work or career in your vision of your life and relationship." },
        { key: 'community' as const, title: "Family", subtitle: "Start with 'Our family...' and compose a sentence that summarizes your family configuration and the role of family in your vision." },
        { key: 'fun' as const, title: "Fun", subtitle: "Start with 'We enjoy...' and list the interests and activities that are important for you to share with your partner." },
    ] : [
        { key: 'values' as const, title: "Core Values", subtitle: "Start with 'My purpose is rooted in...' and describe the core values that drive you." },
        { key: 'lifestyle' as const, title: "Environment & Lifestyle", subtitle: "Start with 'I work and live...' and describe the environment that supports your purpose." },
        { key: 'work' as const, title: "Daily Work", subtitle: "Start with 'My daily work...' and describe the activities that fulfill your purpose." },
        { key: 'community' as const, title: "Impact & Community", subtitle: "Start with 'My work impacts...' and describe how you contribute to your community or the world." },
        { key: 'fun' as const, title: "Joy & Fulfillment", subtitle: "Start with 'I find joy in...' and list the things that bring you fulfillment in your work." },
    ], [path]);
    
    const currentQuestion = questions[step];

    const handleInputChange = (key: keyof VisionBuilderInputs, value: string) => {
        setInputs(currentInputs => ({ ...currentInputs, [key]: value }));
    };

    const handleNext = () => {
        setIdeas([]); // Clear ideas when moving to the next step
        setStep(s => Math.min(s + 1, questions.length));
    };
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        let messageIndex = 0;
        const intervalId = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2000);

        try {
            const visionData = await geminiService.generateVision(inputs, path);
            onVisionCreate(visionData);
        } catch(err) {
            setError("There was an issue creating your vision. Please try again.");
        } finally {
            clearInterval(intervalId);
            setIsLoading(false);
        }
    };

    const handleSparkIdeas = async () => {
        setIsIdeasLoading(true);
        setIdeas([]);
        try {
            const generatedIdeas = await geminiService.generateVisionIdeas(path, currentQuestion.title, currentQuestion.subtitle);
            setIdeas(generatedIdeas);
        } catch (err) {
            console.error("Failed to generate ideas", err);
        } finally {
            setIsIdeasLoading(false);
        }
    };
    
    const isCurrentStepValid = inputs[currentQuestion.key].length >= MIN_CHARS;

    return (
        <ScreenWrapper>
            <Subtitle>Step {step + 1} of {questions.length}</Subtitle>
            <Title>{currentQuestion.title}</Title>
            <p className="text-center text-slate-400 mb-8">{currentQuestion.subtitle}</p>
            
             <textarea
                value={inputs[currentQuestion.key]}
                onChange={(e) => handleInputChange(currentQuestion.key, e.target.value)}
                placeholder="Be specific and heartfelt..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                aria-label={currentQuestion.title}
            />
            <p className={`text-xs text-right mt-1 ${isCurrentStepValid ? 'text-green-400' : 'text-slate-500'}`}>
                ({inputs[currentQuestion.key].length}/{MIN_CHARS})
            </p>

            <div className="mt-4 w-full">
                <SecondaryButton onClick={handleSparkIdeas} disabled={isIdeasLoading}>
                    {isIdeasLoading ? 'Sparking...' : '✨ Spark Ideas'}
                </SecondaryButton>
            </div>

            {isIdeasLoading && <p className="text-center mt-4 text-purple-400 animate-pulse">Generating inspiration...</p>}

            {ideas.length > 0 && (
                <Card className="mt-4 text-left">
                    <p className="font-semibold text-purple-400 mb-2">Feeling stuck? Click an idea to use it:</p>
                    <ul className="space-y-2">
                        {ideas.map((idea, index) => (
                             <li key={index}>
                                <button
                                    onClick={() => handleInputChange(currentQuestion.key, idea)}
                                    className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    aria-label={`Use idea: ${idea}`}
                                >
                                    {idea}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
            
            <div className="mt-8 w-full">
            {isLoading ? (
                <div className="text-center"><p className="text-lg text-purple-400 animate-pulse">{loadingMessage}</p></div>
            ) : (
                <>
                {error && <p className="text-center text-red-400 mb-4">{error}</p>}
                {step < questions.length - 1 ? (
                    <PrimaryButton onClick={handleNext} disabled={!isCurrentStepValid}>Next</PrimaryButton>
                ) : (
                    <PrimaryButton onClick={handleGenerate} disabled={!isCurrentStepValid}>Generate My Vision</PrimaryButton>
                )}
                </>
            )}
            </div>
        </ScreenWrapper>
    );
};

const VisionRevealScreen: React.FC<{ visionData: VisionData; onSave: (vision: VisionData) => void }> = ({ visionData, onSave }) => {
    const [editedStatement, setEditedStatement] = useState(visionData.statement);
    const [copyButtonText, setCopyButtonText] = useState("Copy to Clipboard");

    const handleSave = () => {
      onSave({ ...visionData, statement: editedStatement });
    };

    const handleCopy = () => {
        const fullText = `${visionData.headline}\n\n${editedStatement}`;
        navigator.clipboard.writeText(fullText);
        setCopyButtonText("Copied!");
        setTimeout(() => setCopyButtonText("Copy to Clipboard"), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>My Vision</title></head><body><h1>${visionData.headline}</h1><p>${editedStatement.replace(/\n/g, '<br>')}</p></body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <ScreenWrapper>
            <Title>{visionData.headline}</Title>
            <p className="text-center text-slate-400 mb-4">Here is your proposed vision. Read it, feel it, and adjust it below to make it truly your own.</p>
            <Card className="my-8">
                <textarea
                    value={editedStatement}
                    onChange={(e) => setEditedStatement(e.target.value)}
                    className="w-full h-48 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                    aria-label="Editable Vision Statement"
                />
            </Card>
            <div className="space-y-4">
                <PrimaryButton onClick={handleSave}>Start Manifesting Your Vision!</PrimaryButton>
                <div className="flex space-x-4">
                    <SecondaryButton onClick={handleCopy}>{copyButtonText}</SecondaryButton>
                    <SecondaryButton onClick={handlePrint}>Print Vision</SecondaryButton>
                </div>
            </div>
        </ScreenWrapper>
    );
};

const DashboardScreen: React.FC<{ user: User; onGoToReprogramming: () => void; onLogout: () => void; }> = ({ user, onGoToReprogramming, onLogout }) => {
    const { archetype, visionData } = user;
    const [dailyInsight, setDailyInsight] = useState("Generating your daily insight...");
    const [dailyTask, setDailyTask] = useState("Generating your personal task...");
    const [gratitudeText, setGratitudeText] = useState('');
    
    const practice = useMemo(() => archetype ? dailyPractices[archetype] : null, [archetype]);

    useEffect(() => {
        if (archetype && visionData && practice) {
            const fetchDailyContent = async () => {
                setDailyInsight(await geminiService.generateDailyInsight(archetype, visionData.headline));
                setDailyTask(await geminiService.generateDailyTask(archetype, visionData.headline, practice));
            };
            fetchDailyContent();
        }
    }, [archetype, visionData, practice]);

    if (!archetype || !visionData || !practice) return null;

    return (
        <ScreenWrapper className="justify-start pt-12">
            <Title>{visionData.headline}</Title>
            
            <div className="w-full space-y-4 mt-6">
                <Card><p className="font-semibold text-purple-400 mb-2">✨ Daily Insight</p><p>{dailyInsight}</p></Card>
                <Card><p className="font-semibold text-cyan-400 mb-2">{practice.title}</p><p>{dailyTask}</p></Card>
                <Card>
                    <p className="font-semibold text-purple-400 mb-2">Gratitude Practice</p>
                    <textarea value={gratitudeText} onChange={(e) => setGratitudeText(e.target.value)} placeholder="Today, I am grateful for..."
                        className="w-full h-24 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"/>
                </Card>
                
                {!user.isPro && (
                  <Card>
                    <p className="font-semibold text-purple-400 mb-2">Supercharge Your Delivery</p>
                    <p className="text-sm text-slate-400 mb-4">Your new order is placed, but the cosmic kitchen may still take a while to update the pantry (your subconscious). This can slow things down.</p>
                    <PrimaryButton onClick={onGoToReprogramming}>Speed Up My Delivery</PrimaryButton>
                  </Card>
                )}
                {user.isPro && (
                  <Card>
                    <p className="font-semibold text-purple-400 mb-2">Reprogramming Suite</p>
                    <p className="text-sm text-slate-400 mb-4">Continue your mastery journey with the hypnotic meditations.</p>
                    <PrimaryButton onClick={onGoToReprogramming}>Go to Meditations</PrimaryButton>
                  </Card>
                )}

                <SecondaryButton onClick={onLogout} className="mt-4">Log Out</SecondaryButton>
            </div>
        </ScreenWrapper>
    );
};

const ReprogrammingIntroScreen: React.FC<{ path: Path, onNext: () => void; }> = ({ path, onNext }) => {
    const program = proContent[path];
    return (
        <ScreenWrapper>
            <Title>The Fastest Path to Your Vision</Title>
            <Subtitle>You've created the blueprint. Now, let's build the reality.</Subtitle>
             <p className="text-center text-slate-300 text-lg mb-8">The <span className="font-bold text-cyan-400">{program.title}</span> is a guided, 5-week journey to systematically rewire your subconscious, eliminate your specific blocks, and transform you into an energetic match for your desire.</p>
            <PrimaryButton onClick={onNext}>Unlock the Mastery Program</PrimaryButton>
        </ScreenWrapper>
    );
};

const MeditationsScreen: React.FC<{ isPro: boolean; onSelectMeditation: (meditation: Meditation) => void; onUpgrade: () => void; onBack: () => void; }> = ({ isPro, onSelectMeditation, onUpgrade, onBack }) => {
    return (
        <ScreenWrapper>
            <Title>The Hypnotic Meditation Suite</Title>
            <Subtitle>Select a meditation to begin reprogramming.</Subtitle>
            <div className="space-y-4">
                {meditations.map(meditation => (
                    <div key={meditation.id} className="relative">
                        <button onClick={() => (meditation.isFree || isPro) && onSelectMeditation(meditation)} disabled={!meditation.isFree && !isPro}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-left transition-all duration-300 disabled:opacity-60 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <h3 className="text-lg font-semibold text-slate-100">{meditation.title}</h3>
                            <p className="text-sm text-slate-400">{meditation.description}</p>
                        </button>
                        {!meditation.isFree && !isPro && (
                            <div className="absolute inset-0 bg-slate-800/80 rounded-lg flex items-center justify-center">
                                <button onClick={onUpgrade} className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700">
                                    <LockClosedIcon className="w-5 h-5" /><span>Upgrade to Unlock</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <SecondaryButton onClick={onBack} className="mt-8">Back to Dashboard</SecondaryButton>
        </ScreenWrapper>
    );
};

const PaywallScreen: React.FC<{ onPurchase: (plan: 'monthly' | 'yearly') => void, onDecline: () => void }> = ({ onPurchase, onDecline }) => {
    const [isLoading, setIsLoading] = useState<'monthly' | 'yearly' | null>(null);

    const handlePurchase = async (plan: 'monthly' | 'yearly') => {
        setIsLoading(plan);
        const amount = plan === 'monthly' ? 9.99 : 59.99;
        const { success } = await apiService.processStripePayment(amount, 'subscription', plan);
        if (success) onPurchase(plan);
        else { alert("Payment failed."); setIsLoading(null); }
    };

    return (
        <ScreenWrapper>
            <Title>Claim Your Seat at the Chef's Table</Title>
            <Subtitle>Upgrade to Pro and unlock the complete toolkit to make your vision your reality.</Subtitle>
            <Card className="text-left space-y-3">
                <h4 className="text-xl font-semibold text-center mb-4">What you unlock with Pro:</h4>
                <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <p><span className="font-semibold text-slate-100">The 5-Week Guided Mastery Program:</span> A daily, step-by-step journey to transform into an energetic match for your desires.</p>
                </div>
                 <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <p><span className="font-semibold text-slate-100">Full Access to the Hypnotic Meditation Suite:</span> Unlock all 5 guided sessions (Recognition, Erasure, Somatic Reboot, Empowerment, Transformation) to rewire your subconscious.</p>
                </div>
                 <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <p><span className="font-semibold text-slate-100">Bonus Personalized Audios:</span> Receive exclusive audios on mastering the Law of Assumption and Living in the End, tailored to your vision.</p>
                </div>
            </Card>

            <div className="mt-8 w-full space-y-4">
                 <button onClick={() => handlePurchase('monthly')} disabled={!!isLoading} className="w-full border-2 border-purple-500 rounded-lg p-4 text-left hover:bg-purple-500/20 transition-all disabled:opacity-50">
                    <p className="text-lg font-semibold">Start My Transformation</p>
                    <p className="text-2xl font-bold">$9.99 <span className="text-base font-normal text-slate-400">/ month</span></p>
                </button>
                 <button onClick={() => handlePurchase('yearly')} disabled={!!isLoading} className="w-full border-2 border-cyan-400 rounded-lg p-4 text-left hover:bg-cyan-500/20 transition-all relative disabled:opacity-50">
                    <p className="absolute -top-3 right-4 bg-cyan-400 text-slate-900 px-2 py-0.5 rounded-full text-xs font-bold">SAVE 50%</p>
                    <p className="text-lg font-semibold">Commit to Mastery</p>
                    <p className="text-2xl font-bold">$59.99 <span className="text-base font-normal text-slate-400">/ year</span></p>
                </button>
            </div>
            <button onClick={onDecline} className="text-slate-500 mt-6 hover:text-slate-300 transition-colors">Maybe later</button>
        </ScreenWrapper>
    );
};

const TrialEndScreen: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
    <ScreenWrapper>
        <Title>Ready for an Upgrade in Speed?</Title>
        <Subtitle>You've been manifesting for 14 days. The free path is powerful, but the Pro tools are designed to accelerate your results.</Subtitle>
        <Card className="text-center">
            <p className="text-lg text-slate-300 mt-4">
                Feel like your vision is manifesting too slowly? The Hypnotic Meditation Suite in Pro is your cosmic express lane, clearing subconscious blocks to bring your desires to you with greater speed and ease.
            </p>
        </Card>
        <div className="mt-8 w-full">
            <PrimaryButton onClick={onUpgrade}>Access Speedy Delivery Now</PrimaryButton>
        </div>
    </ScreenWrapper>
);

const MeditationPlayerScreen: React.FC<{ meditation: Meditation; onBack: () => void }> = ({ meditation, onBack }) => {
    const [audioData, setAudioData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        const generateAudio = async () => {
            try {
                const data = await geminiService.generateMeditationAudio(meditation.script);
                setAudioData(data);
            } catch (err) { setError("Could not generate audio."); } 
            finally { setIsLoading(false); }
        };
        generateAudio();
        return () => {
          if (audioSourceRef.current) audioSourceRef.current.stop();
          if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
        };
    }, [meditation.script]);

    const handlePlayPause = async () => {
        if (!audioData) return;
        if (isPlaying && audioSourceRef.current) {
            audioSourceRef.current.stop();
            setIsPlaying(false);
        } else {
            try {
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const audioContext = audioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(audioData), audioContext);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.onended = () => setIsPlaying(false);
                source.start(0);
                audioSourceRef.current = source;
                setIsPlaying(true);
            } catch (err) { setError("Could not play audio."); }
        }
    };
    
    return (
        <ScreenWrapper>
            <Title>{meditation.title}</Title>
            <Card className="my-8">
                {isLoading && <p className="text-center text-purple-400 animate-pulse">Generating your guided meditation...</p>}
                {error && <p className="text-center text-red-400">{error}</p>}
                {audioData && !error && (
                    <div className="flex justify-center">
                        <button onClick={handlePlayPause} className="bg-purple-600 text-white rounded-full p-4 hover:bg-purple-700">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">{isPlaying ? <path d="M5 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" /> : <path d="M5 5.5A1.5 1.5 0 016.5 4h.334a1.5 1.5 0 011.415.922l4.253 8.506A1.5 1.5 0 0111.084 15H6.5A1.5 1.5 0 015 13.5v-8z" />}</svg>
                        </button>
                    </div>
                )}
            </Card>
            <SecondaryButton onClick={onBack}>Back to Meditations</SecondaryButton>
        </ScreenWrapper>
    );
};


// Main App Component
const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [screen, setScreen] = useState<Screen>(Screen.Login);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const user = await apiService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
                if (user.visionData) {
                    navigateToDashboard(user);
                } else if (user.path) {
                    setScreen(Screen.Welcome);
                } else {
                    setScreen(Screen.PathSelection);
                }
            } else {
                setScreen(Screen.Register);
            }
            setIsLoading(false);
        };
        checkUser();
    }, []);

    const saveUser = useCallback(async (user: User) => {
        await apiService.saveUser(user);
        setCurrentUser(user);
    }, []);

    const handleLogin = async (email: string, password: string) => {
        setIsLoading(true);
        setAuthError(null);
        const res = await apiService.login(email, password);
        if (res.success && res.user) {
            setCurrentUser(res.user);
            if (res.user.visionData) navigateToDashboard(res.user);
            else if (res.user.path) setScreen(Screen.Welcome);
            else setScreen(Screen.PathSelection);
        } else {
            setAuthError(res.error || 'Login failed.');
        }
        setIsLoading(false);
    };

    const handleRegister = async (email: string, password: string) => {
        setIsLoading(true);
        setAuthError(null);
        const res = await apiService.register(email, password);
        if (res.success && res.user) {
            setCurrentUser(res.user);
            setScreen(Screen.PathSelection);
        } else {
            setAuthError(res.error || 'Registration failed.');
        }
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await apiService.logout();
        setCurrentUser(null);
        setScreen(Screen.Login);
    };

    const handlePathSelect = (path: Path) => {
        if (!currentUser) return;
        saveUser({ ...currentUser, path });
        setScreen(Screen.Welcome);
    };

    const handleQuizComplete = (archetype: Archetype) => {
        if (!currentUser) return;
        saveUser({ ...currentUser, archetype });
        setScreen(Screen.QuizResult);
    };

    const handleVisionCreate = (visionData: VisionData) => {
        if (!currentUser) return;
        const isFirstVision = !currentUser.firstUseDate;
        saveUser({
          ...currentUser,
          visionData,
          ...(isFirstVision && { firstUseDate: new Date().toISOString() }),
        });
        setScreen(Screen.VisionReveal);
    };
    
    const handlePurchase = (plan: 'monthly' | 'yearly') => {
        if (!currentUser) return;
        saveUser({ ...currentUser, isPro: true });
        setScreen(Screen.Meditations); // After purchase, go to the meditations screen
    };

    const navigateToDashboard = (user: User) => {
        const now = new Date();
        if (user.firstUseDate && !user.isPro) {
            const fourteenDays = 14 * 24 * 60 * 60 * 1000;
            const firstUse = new Date(user.firstUseDate);
            const lastPrompt = user.lastUpgradePromptDate ? new Date(user.lastUpgradePromptDate) : new Date(0);
            
            if (now.getTime() - firstUse.getTime() > fourteenDays && now.getTime() - lastPrompt.getTime() > fourteenDays) {
                 saveUser({ ...user, lastUpgradePromptDate: now.toISOString() });
                 setScreen(Screen.TrialEnd);
                 return;
            }
        }
        setScreen(Screen.Dashboard);
    };
    
    if (isLoading) return <ScreenWrapper><p>Loading...</p></ScreenWrapper>;

    const renderScreen = () => {
        if (!currentUser) {
            switch (screen) {
                case Screen.Login: return <AuthForm title="Welcome Back" subtitle="Log in to continue your journey." buttonText="Log In" onSubmit={handleLogin} switchText="Don't have an account? Register" onSwitch={() => setScreen(Screen.Register)} isLoading={isLoading} error={authError} />;
                case Screen.Register: return <AuthForm title="Join Cosmic Order" subtitle="Create your account to begin." buttonText="Register" onSubmit={handleRegister} switchText="Already have an account? Log In" onSwitch={() => setScreen(Screen.Login)} isLoading={isLoading} error={authError} />;
                default: return <AuthForm title="Join Cosmic Order" subtitle="Create your account to begin." buttonText="Register" onSubmit={handleRegister} switchText="Already have an account? Log In" onSwitch={() => setScreen(Screen.Login)} isLoading={isLoading} error={authError} />;
            }
        }

        const { path, archetype, visionData, isPro } = currentUser;

        switch (screen) {
            case Screen.PathSelection: return <PathSelectionScreen onSelectPath={handlePathSelect} />;
            case Screen.Welcome:
                if (!path) return <PathSelectionScreen onSelectPath={handlePathSelect} />;
                return <ThemedWelcomeScreen path={path} onNext={() => setScreen(Screen.ProcessIntro)} />;
            case Screen.ProcessIntro: return <ProcessIntroScreen onNext={() => setScreen(Screen.Quiz)} />;
            case Screen.Quiz: return <QuizScreen onQuizComplete={handleQuizComplete} />;
            case Screen.QuizResult:
                if (!archetype) return <ProcessIntroScreen onNext={() => setScreen(Screen.Quiz)} />;
                return <QuizResultScreen archetype={archetype} onNext={() => setScreen(Screen.TripwireOffer)} />;
            case Screen.TripwireOffer:
                 return <TripwireOfferScreen onAccept={() => setScreen(Screen.TripwireSuccess)} onDecline={() => setScreen(Screen.VisionBuilder)} />;
            case Screen.TripwireSuccess: return <TripwireSuccessScreen onNext={() => setScreen(Screen.VisionBuilder)} />;
            case Screen.VisionBuilder:
                if (!path) return <PathSelectionScreen onSelectPath={handlePathSelect} />;
                return <VisionBuilderScreen path={path} onVisionCreate={handleVisionCreate} />;
            case Screen.VisionReveal:
                if (!visionData) return <PathSelectionScreen onSelectPath={handlePathSelect} />;
                return <VisionRevealScreen visionData={visionData} onSave={(vd) => { saveUser({...currentUser, visionData: vd }); navigateToDashboard(currentUser); }} />;
            case Screen.Dashboard:
                 return <DashboardScreen 
                    user={currentUser} 
                    onGoToReprogramming={() => {
                        // THIS IS THE CORRECTED LOGIC
                        if (currentUser.isPro) {
                            setScreen(Screen.Meditations);
                        } else {
                            setScreen(Screen.ReprogrammingIntro);
                        }
                    }} 
                    onLogout={handleLogout} 
                />;
            case Screen.ReprogrammingIntro:
                 if (!path) return <PathSelectionScreen onSelectPath={handlePathSelect} />;
                 // THIS IS THE CORRECTED LOGIC
                 return <ReprogrammingIntroScreen path={path} onNext={() => setScreen(Screen.Paywall)} />;
            case Screen.Meditations:
                return <MeditationsScreen isPro={isPro} onSelectMeditation={(m) => {setSelectedMeditation(m); setScreen(Screen.MeditationPlayer);}} onUpgrade={() => setScreen(Screen.Paywall)} onBack={() => navigateToDashboard(currentUser)} />;
            case Screen.Paywall:
                return <PaywallScreen onPurchase={handlePurchase} onDecline={() => navigateToDashboard(currentUser)} />;
             case Screen.TrialEnd:
                return <TrialEndScreen onUpgrade={() => setScreen(Screen.Paywall)} />;
            case Screen.MeditationPlayer:
                if (!selectedMeditation) return <MeditationsScreen isPro={isPro} onSelectMeditation={(m) => setSelectedMeditation(m)} onUpgrade={() => setScreen(Screen.Paywall)} onBack={() => navigateToDashboard(currentUser)} />;
                return <MeditationPlayerScreen meditation={selectedMeditation} onBack={() => {setSelectedMeditation(null); setScreen(Screen.Meditations);}} />;
            default:
                if (visionData) return <DashboardScreen user={currentUser} onGoToReprogramming={() => isPro ? setScreen(Screen.Meditations) : setScreen(Screen.ReprogrammingIntro)} onLogout={handleLogout} />;
                if (path) return <ThemedWelcomeScreen path={path} onNext={() => setScreen(Screen.ProcessIntro)} />;
                return <PathSelectionScreen onSelectPath={handlePathSelect} />;
        }
    };

    return <>{renderScreen()}</>;
};

export default App;