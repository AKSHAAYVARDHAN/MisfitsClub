import React, { useState } from 'react';
import { ConnectionIntent, MeetArchetype, UserProfile } from '../types';
import { CURATED_INTERESTS_LIST } from '../data/mockData';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Plus, 
  X, 
  Eye, 
  Compass, 
  HelpCircle 
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (user: UserProfile) => void;
  initialUser?: UserProfile | null;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialUser,
}) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Intents (max 3)
  const [selectedIntents, setSelectedIntents] = useState<ConnectionIntent[]>(
    initialUser?.intents || ['Exchange Ideas', 'Build Together']
  );

  // Step 2: Who would you like to meet (multi-select)
  const [selectedArchetypes, setSelectedArchetypes] = useState<MeetArchetype[]>(
    initialUser?.archetypesToMeet || ['Builders', 'Creatives', 'Anyone interesting']
  );

  // Step 3: Interests & Curiosity Tags
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialUser?.interests || ['AI', 'Philosophy', 'Design', 'Technology']
  );
  const [customInterestInput, setCustomInterestInput] = useState<string>('');

  // Step 4: Personal details & natural bio
  const [name, setName] = useState<string>(initialUser?.name || 'Taylor Vance');
  const [location, setLocation] = useState<string>(initialUser?.location || 'Kyoto / Remote');
  const [role, setRole] = useState<string>(initialUser?.role || 'Indie Maker & Sound Designer');
  const [roleEmoji, setRoleEmoji] = useState<string>(initialUser?.roleEmoji || '✨');
  const [bio, setBio] = useState<string>(
    initialUser?.bio ||
      'I build experimental audio interfaces and research how spatial acoustics influence creative flow state. Seeking thoughtful discussions on sound, cognition, and intentional tech.'
  );
  const [building, setBuilding] = useState<string>(
    initialUser?.building || 'A small browser synthesizer that turns weather data into ambient chords.'
  );
  const [learning, setLearning] = useState<string>(
    initialUser?.learning || 'Analog electronics and Japanese woodwork.'
  );
  const [openQuestion, setOpenQuestion] = useState<string>(
    initialUser?.openQuestion || 'Why does working with physical tools feel so much more restorative than working on screens?'
  );
  const [website, setWebsite] = useState<string>(initialUser?.links?.website || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialUser?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );

  if (!isOpen) return null;

  // Toggle intents with max 3 constraint
  const toggleIntent = (intent: ConnectionIntent) => {
    if (selectedIntents.includes(intent)) {
      setSelectedIntents(selectedIntents.filter((i) => i !== intent));
    } else {
      if (selectedIntents.length < 3) {
        setSelectedIntents([...selectedIntents, intent]);
      }
    }
  };

  // Toggle archetypes
  const toggleArchetype = (archetype: MeetArchetype) => {
    if (selectedArchetypes.includes(archetype)) {
      if (selectedArchetypes.length > 1) {
        setSelectedArchetypes(selectedArchetypes.filter((a) => a !== archetype));
      }
    } else {
      setSelectedArchetypes([...selectedArchetypes, archetype]);
    }
  };

  // Toggle interest
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Add custom interest
  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInterestInput.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests([...selectedInterests, trimmed]);
      setCustomInterestInput('');
    }
  };

  const handleFinish = () => {
    const newUser: UserProfile = {
      id: initialUser?.id || `user-${Date.now()}`,
      name: name || 'Curious Member',
      handle: `@${(name || 'curious').toLowerCase().replace(/\s+/g, '')}`,
      location: location || 'Earth',
      country: 'Global',
      role: role || 'Explorer',
      roleEmoji: roleEmoji || '✨',
      tagline: building ? `Building: ${building}` : 'Curious mind exploring the world',
      bio: bio || 'Here to exchange ideas and meet remarkable minds.',
      curiousAbout: [
        openQuestion || 'Exploring how curiosity guides human creativity',
        learning ? `Learning ${learning}` : 'Exploring interdisciplinary knowledge',
      ],
      building,
      learning,
      openQuestion,
      interests: selectedInterests.length ? selectedInterests : ['Ideas', 'Technology', 'Art'],
      intents: selectedIntents.length ? selectedIntents : ['Exchange Ideas', 'Just Talk'],
      archetypesToMeet: selectedArchetypes,
      avatarUrl,
      links: {
        website: website || undefined,
      },
      isOnline: true,
      joinedDate: 'August 2026',
    };

    onComplete(newUser);
  };

  const allIntentsWithEmojis: { intent: ConnectionIntent; emoji: string; desc: string }[] = [
    { intent: 'Build Together', emoji: '🚀', desc: 'Side-projects, code, hardware, crafts, prototypes' },
    { intent: 'Exchange Ideas', emoji: '💡', desc: 'Testing theses, sharing rabbit holes, philosophy' },
    { intent: 'Collaborate', emoji: '🧩', desc: 'Interdisciplinary merging of unique skills' },
    { intent: 'Learn Together', emoji: '🧠', desc: 'Reading papers, studying subjects, joint accountability' },
    { intent: 'Find a Co-founder', emoji: '🤝', desc: 'Meeting an obsession-aligned partner organically' },
    { intent: 'Find a Mentor', emoji: '🌱', desc: 'Seeking guidance from thoughtful practitioners' },
    { intent: 'Just Talk', emoji: '💬', desc: 'Calm, genuine, wandering human conversations' },
  ];

  const allArchetypesWithEmojis: { archetype: MeetArchetype; emoji: string }[] = [
    { archetype: 'Anyone worldwide', emoji: '🌎' },
    { archetype: 'Students', emoji: '🎓' },
    { archetype: 'Builders', emoji: '🧑‍💻' },
    { archetype: 'Creatives', emoji: '🎨' },
    { archetype: 'Researchers', emoji: '🔬' },
    { archetype: 'Entrepreneurs', emoji: '🚀' },
    { archetype: 'Anyone interesting', emoji: '✨' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0C]/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      <div className="relative w-full max-w-3xl border border-[#F5F5F0]/10 bg-[#151516] p-6 sm:p-10 shadow-2xl my-8 text-[#F5F5F0]">
        
        {/* Top Progress bar and close */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F5F5F0]/10">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-lg text-[#F5F5F0]">
              MISFITS CLUB
            </span>
            <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold">
              Step {step} of 5
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`h-1 transition-all ${
                    s === step
                      ? 'w-6 bg-[#D4FF3F]'
                      : s < step
                      ? 'w-3 bg-[#F5F5F0]'
                      : 'w-3 bg-[#F5F5F0]/20'
                  }`}
                />
              ))}
            </div>

            <button
              id="onboarding-close-btn"
              onClick={onClose}
              className="p-1.5 text-[#969696] hover:text-[#F5F5F0] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STEP 1: WHAT BRINGS YOU HERE */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                Intentions
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                What brings you here?
              </h2>
              <p className="text-sm text-[#969696] mt-2">
                Select up to 3 core intents. These define how you wish to connect with people.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {allIntentsWithEmojis.map(({ intent, emoji, desc }) => {
                const isSelected = selectedIntents.includes(intent);
                return (
                  <button
                    key={intent}
                    id={`onboard-intent-${intent.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleIntent(intent)}
                    className={`flex items-start gap-3.5 p-4 border text-left transition-all ${
                      isSelected
                        ? 'border-[#D4FF3F] bg-[#0B0B0C] text-[#F5F5F0]'
                        : 'border-[#F5F5F0]/10 bg-[#0B0B0C] text-[#969696] hover:border-[#D4FF3F]/40 hover:text-[#F5F5F0]'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold uppercase tracking-wider text-[#F5F5F0]">
                          {intent}
                        </span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#969696] mt-1 leading-snug">
                        {desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F0]/10">
              <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold">
                {selectedIntents.length} of 3 selected
              </span>
              <button
                id="onboard-step1-next"
                disabled={selectedIntents.length === 0}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-[#F5F5F0] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#D4FF3F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WHO WOULD YOU LIKE TO MEET */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                Audience
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                Who would you like to meet?
              </h2>
              <p className="text-sm text-[#969696] mt-2">
                Choose the kinds of minds you'd feel excited to talk to. Multiple selections allowed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {allArchetypesWithEmojis.map(({ archetype, emoji }) => {
                const isSelected = selectedArchetypes.includes(archetype);
                return (
                  <button
                    key={archetype}
                    id={`onboard-archetype-${archetype.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleArchetype(archetype)}
                    className={`flex items-center justify-between p-4 border text-left transition-all ${
                      isSelected
                        ? 'border-[#D4FF3F] bg-[#0B0B0C] text-[#F5F5F0]'
                        : 'border-[#F5F5F0]/10 bg-[#0B0B0C] text-[#969696] hover:border-[#D4FF3F]/40 hover:text-[#F5F5F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{emoji}</span>
                      <span className="text-sm font-bold uppercase tracking-wider text-[#F5F5F0]">
                        {archetype}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center bg-[#D4FF3F] text-[#0B0B0C] text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F0]/10">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                id="onboard-step2-next"
                disabled={selectedArchetypes.length === 0}
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-[#F5F5F0] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#D4FF3F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHAT ARE YOU CURIOUS ABOUT */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                Interests & Rabbit Holes
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                What are you curious about?
              </h2>
              <p className="text-sm text-[#969696] mt-2">
                Select from popular topics or type your own custom obsessions.
              </p>
            </div>

            {/* Custom tag add */}
            <form onSubmit={handleAddCustomInterest} className="flex gap-2 mb-6">
              <input
                id="custom-interest-input"
                type="text"
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                placeholder="Type a custom interest (e.g., Synthesizers, Mycelium, Epistemology)..."
                className="flex-1 border border-[#F5F5F0]/10 bg-[#0B0B0C] px-4 py-2.5 text-xs text-[#F5F5F0] placeholder-[#969696]/60 focus:border-[#D4FF3F] focus:outline-none"
              />
              <button
                type="submit"
                id="add-custom-interest-btn"
                className="flex items-center gap-1.5 border border-[#F5F5F0]/10 bg-[#0B0B0C] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#F5F5F0] hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span>Add</span>
              </button>
            </form>

            {/* Selected tags */}
            {selectedInterests.length > 0 && (
              <div className="mb-5 p-3 bg-[#0B0B0C] border border-[#F5F5F0]/10">
                <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2">
                  Your selected interests ({selectedInterests.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className="group flex items-center gap-1.5 bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 px-2.5 py-1 text-xs text-[#D4FF3F] uppercase tracking-wider font-bold"
                    >
                      <span>{interest}</span>
                      <X className="w-3 h-3 text-[#D4FF3F] group-hover:text-[#F5F5F0]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Curated list */}
            <div className="mb-8">
              <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2.5">
                Suggested topics:
              </span>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {CURATED_INTERESTS_LIST.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-[#D4FF3F] text-[#0B0B0C]'
                          : 'bg-[#0B0B0C] text-[#969696] border border-[#F5F5F0]/10 hover:border-[#D4FF3F] hover:text-[#F5F5F0]'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F0]/10">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                id="onboard-step3-next"
                disabled={selectedInterests.length === 0}
                onClick={() => setStep(4)}
                className="flex items-center gap-2 bg-[#F5F5F0] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#D4FF3F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: TELL PEOPLE ABOUT YOU */}
        {step === 4 && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                Human Profile
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                Tell people a little about you.
              </h2>
              <p className="text-sm text-[#969696] mt-2">
                Write naturally. Think of this as a relaxed dinner conversation rather than a resume.
              </p>
            </div>

            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-1">
              
              {/* Name & Location & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    Your Name
                  </label>
                  <input
                    id="user-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    Location / Timezone
                  </label>
                  <input
                    id="user-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Berlin, Germany"
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    Category / Archetype
                  </label>
                  <input
                    id="user-role-input"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Visual Storyteller"
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio Text Area */}
              <div>
                <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                  What are you currently curious about, building, learning, or thinking about?
                </label>
                <textarea
                  id="user-bio-input"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people what genuinely excites you right now..."
                  className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] p-3.5 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Building & Learning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    What I'm Building (optional)
                  </label>
                  <input
                    id="user-building-input"
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. An AI sound compiler"
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    What I'm Learning (optional)
                  </label>
                  <input
                    id="user-learning-input"
                    type="text"
                    value={learning}
                    onChange={(e) => setLearning(e.target.value)}
                    placeholder="e.g. Embedded microcontrollers & Latin"
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Open Question */}
              <div>
                <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                  An Open Question you're pondering
                </label>
                <input
                  id="user-question-input"
                  type="text"
                  value={openQuestion}
                  onChange={(e) => setOpenQuestion(e.target.value)}
                  placeholder="e.g. Why did we settle on monospace text files for software?"
                  className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>

              {/* Avatar Url & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    id="user-avatar-input"
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                    Personal Website / Link (optional)
                  </label>
                  <input
                    id="user-website-input"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yoursite.xyz"
                    className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3.5 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F0]/10">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                id="onboard-step4-next"
                disabled={!name.trim() || !bio.trim()}
                onClick={() => setStep(5)}
                className="flex items-center gap-2 bg-[#F5F5F0] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#D4FF3F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Preview Profile</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PROFILE PREVIEW */}
        {step === 5 && (
          <div>
            <div className="mb-6">
              <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                Final Step
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                How other Misfits will see you
              </h2>
              <p className="text-sm text-[#969696] mt-2">
                This is your human discovery card. You can update it anytime in your settings.
              </p>
            </div>

            {/* Profile Card Preview */}
            <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-6 sm:p-8 mb-8 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover border border-[#F5F5F0]/10"
                  />
                  <div>
                    <h3 className="font-editorial text-2xl font-light text-[#F5F5F0]">
                      {name}
                    </h3>
                    <p className="text-[10px] text-[#969696] uppercase tracking-widest mt-0.5">
                      {location} · {roleEmoji} {role}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                  {selectedIntents.map((intent) => (
                    <span
                      key={intent}
                      className="text-[10px] font-bold text-[#D4FF3F] border border-[#D4FF3F]/30 px-2.5 py-0.5 uppercase tracking-wider"
                    >
                      {intent}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#969696] leading-relaxed mb-6 font-sans-clean">
                {bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {building && (
                  <div className="border border-[#F5F5F0]/10 bg-[#151516] p-3.5">
                    <span className="text-[10px] text-[#D4FF3F] font-bold uppercase tracking-widest block mb-1">
                      🔨 What I'm building
                    </span>
                    <p className="text-xs text-[#F5F5F0]/90 leading-relaxed">{building}</p>
                  </div>
                )}

                {openQuestion && (
                  <div className="border border-[#F5F5F0]/10 bg-[#151516] p-3.5">
                    <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-1">
                      ❓ Open Question
                    </span>
                    <p className="text-xs text-[#F5F5F0] italic leading-relaxed">“{openQuestion}”</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2">
                  Interests
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] text-[#969696] bg-[#151516] px-2.5 py-1 border border-[#F5F5F0]/5 uppercase"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F0]/10">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#969696] hover:text-[#F5F5F0] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>

              <button
                id="enter-misfits-club-btn"
                onClick={handleFinish}
                className="flex items-center gap-2 bg-[#D4FF3F] px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#F5F5F0] transition-all"
              >
                <span>Enter Misfits Club</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
