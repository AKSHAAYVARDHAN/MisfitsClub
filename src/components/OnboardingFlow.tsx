import React, { useState, useEffect } from 'react';
import { ConnectionIntent, MeetArchetype, UserProfile } from '../types';
import { authService } from '../services/authService';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Search, 
  Plus, 
  X, 
  MapPin, 
  Globe, 
  Compass,
  CheckCircle2
} from 'lucide-react';

interface OnboardingFlowProps {
  currentUser: UserProfile;
  onComplete: (user: UserProfile) => void;
  onCancel?: () => void;
}

const STEP_1_INTENTS: { intent: ConnectionIntent; emoji: string; desc: string }[] = [
  { intent: 'Build Together', emoji: '🚀', desc: 'I want to create something with someone.' },
  { intent: 'Exchange Ideas', emoji: '💡', desc: 'I want to discuss ideas and perspectives.' },
  { intent: 'Collaborate', emoji: '🧩', desc: 'I want people to work on something with me.' },
  { intent: 'Learn Together', emoji: '🧠', desc: 'I want to learn or explore something with someone.' },
  { intent: 'Find a Co-founder', emoji: '🤝', desc: 'I want someone serious to build with.' },
  { intent: 'Find a Mentor', emoji: '🌱', desc: 'I want guidance from someone with experience.' },
  { intent: 'Just Talk', emoji: '💬', desc: 'I simply want a good conversation.' },
];

const STEP_2_ARCHETYPES: { archetype: MeetArchetype; emoji: string }[] = [
  { archetype: 'Anyone worldwide', emoji: '🌎' },
  { archetype: 'Students', emoji: '🎓' },
  { archetype: 'Builders', emoji: '🧑‍💻' },
  { archetype: 'Creatives', emoji: '🎨' },
  { archetype: 'Researchers', emoji: '🔬' },
  { archetype: 'Entrepreneurs', emoji: '🚀' },
  { archetype: 'Anyone interesting', emoji: '✨' },
];

const CURATED_INTERESTS: string[] = [
  'AI', 'STARTUPS', 'TECHNOLOGY', 'MOVIES', 'SCIENCE', 'DESIGN', 
  'MUSIC', 'GAMING', 'PHILOSOPHY', 'BOOKS', 'SPACE', 'PSYCHOLOGY', 
  'BUSINESS', 'WRITING', 'PHOTOGRAPHY', 'ROBOTICS', 'FILMMAKING', 
  'SPORTS', 'TRAVEL', 'HISTORY'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  currentUser,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load draft or initial profile data
  const draft = authService.getOnboardingDraft(currentUser.id);

  // Step 1: Intents (max 3)
  const [selectedIntents, setSelectedIntents] = useState<ConnectionIntent[]>(
    draft?.intents || currentUser.intents || ['Exchange Ideas', 'Just Talk']
  );

  // Step 2: Who to meet (default 'Anyone worldwide')
  const [selectedArchetypes, setSelectedArchetypes] = useState<MeetArchetype[]>(
    draft?.archetypesToMeet || currentUser.archetypesToMeet || ['Anyone worldwide']
  );

  // Step 3: Interests (min 3, max 12)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    draft?.interests || currentUser.interests || ['AI', 'DESIGN', 'PHILOSOPHY']
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');

  // Step 4: About you & Location
  const [city, setCity] = useState<string>(draft?.city || currentUser.city || 'Berlin');
  const [country, setCountry] = useState<string>(draft?.country || currentUser.country || 'Germany');
  const [college, setCollege] = useState<string>(draft?.college || currentUser.college || '');
  const [department, setDepartment] = useState<string>(draft?.department || currentUser.department || '');
  const [year, setYear] = useState<string>(draft?.year || currentUser.year || '');
  const [skills, setSkills] = useState<string[]>(draft?.skills || currentUser.skills || ['DESIGN', 'IDEATION']);
  const [skillInput, setSkillInput] = useState<string>('');
  const [bio, setBio] = useState<string>(
    draft?.bio || currentUser.bio || 
    'Currently exploring how visual storytelling and artificial intelligence can turn complex mental models into intuitive tools.'
  );
  const [building, setBuilding] = useState<string>(
    draft?.building || currentUser.building || ''
  );
  const [openQuestion, setOpenQuestion] = useState<string>(
    draft?.openQuestion || currentUser.openQuestion || ''
  );

  // Save draft whenever state changes
  useEffect(() => {
    authService.saveOnboardingDraft(currentUser.id, {
      intents: selectedIntents,
      archetypesToMeet: selectedArchetypes,
      interests: selectedInterests,
      city,
      country,
      college,
      department,
      year,
      skills,
      location: `${city}, ${country}`,
      bio,
      building,
      openQuestion,
    });
  }, [currentUser.id, selectedIntents, selectedArchetypes, selectedInterests, city, country, college, department, year, skills, bio, building, openQuestion]);

  // Step 1 toggle
  const toggleIntent = (intent: ConnectionIntent) => {
    if (selectedIntents.includes(intent)) {
      if (selectedIntents.length > 1) {
        setSelectedIntents(selectedIntents.filter((i) => i !== intent));
      }
    } else {
      if (selectedIntents.length < 3) {
        setSelectedIntents([...selectedIntents, intent]);
      }
    }
  };

  // Step 2 toggle
  const toggleArchetype = (archetype: MeetArchetype) => {
    if (selectedArchetypes.includes(archetype)) {
      if (selectedArchetypes.length > 1) {
        setSelectedArchetypes(selectedArchetypes.filter((a) => a !== archetype));
      }
    } else {
      setSelectedArchetypes([...selectedArchetypes, archetype]);
    }
  };

  // Step 3 toggle
  const toggleInterest = (interest: string) => {
    const upper = interest.toUpperCase();
    if (selectedInterests.includes(upper)) {
      if (selectedInterests.length > 3) {
        setSelectedInterests(selectedInterests.filter((i) => i !== upper));
      }
    } else {
      if (selectedInterests.length < 12) {
        setSelectedInterests([...selectedInterests, upper]);
      }
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim().toUpperCase();
    if (clean && !selectedInterests.includes(clean) && selectedInterests.length < 12) {
      setSelectedInterests([...selectedInterests, clean]);
      setCustomInput('');
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = skillInput.trim().toUpperCase();
    if (clean && !skills.includes(clean) && skills.length < 15) {
      setSkills([...skills, clean]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Final submit
  const handleCompleteAll = async () => {
    setIsSaving(true);
    const locationString = city && country ? `${city}, ${country}` : city || country || 'Earth';
    const roleFallback = selectedArchetypes.includes('Builders')
      ? 'Builder & Explorer'
      : selectedArchetypes.includes('Creatives')
      ? 'Visual Storyteller'
      : 'Curious Mind';

    const finalProfile: UserProfile = {
      ...currentUser,
      location: locationString,
      city,
      country,
      college: college.trim() || undefined,
      department: department.trim() || undefined,
      year: year.trim() || undefined,
      skills,
      bio: bio.trim(),
      building: building.trim() || undefined,
      openQuestion: openQuestion.trim() || undefined,
      intents: selectedIntents,
      archetypesToMeet: selectedArchetypes,
      interests: selectedInterests,
      curiousAbout: selectedInterests.slice(0, 4),
      role: currentUser.role || roleFallback,
      roleEmoji: currentUser.roleEmoji || '✨',
      tagline: building.trim() ? `Building: ${building.trim()}` : `Exploring ${selectedInterests.slice(0, 2).join(' & ')}`,
      onboardingCompleted: true,
    };

    const saved = await authService.saveOnboarding(currentUser.id, finalProfile);
    setIsSaving(false);
    onComplete(saved);
  };

  // Filtered interests for search
  const filteredInterests = CURATED_INTERESTS.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[88vh] flex flex-col justify-between max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-[#080808] text-[#F2F2ED] selection:bg-[#D4FF3F] selection:text-[#080808]">
      
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
          <span className="text-xs font-mono-code uppercase tracking-widest text-[#F2F2ED] font-bold">
            PROFILE ONBOARDING
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono-code text-[#D4FF3F] tracking-widest font-bold">
            {step <= 4 ? `0${step} / 04` : 'PREVIEW'}
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-[#8A8A8A] hover:text-[#F2F2ED] uppercase tracking-wider font-mono-code"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* Main Step Container */}
      <div className="flex-1 flex flex-col justify-center">

        {/* ================= STEP 01: WHAT BRINGS YOU HERE ================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-1.5">
                STEP 01
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
                WHAT BRINGS YOU HERE?
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean">
                “Choose up to three.”
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {STEP_1_INTENTS.map(({ intent, emoji, desc }) => {
                const isSelected = selectedIntents.includes(intent);
                return (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => toggleIntent(intent)}
                    className={`p-4 text-left border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#141414] border-[#D4FF3F] text-[#F2F2ED]'
                        : 'bg-[#101010] border-[#242424] text-[#8A8A8A] hover:border-[#383838] hover:text-[#F2F2ED]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#F2F2ED]">
                        {emoji} {intent}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#8A8A8A] font-sans-clean leading-relaxed">
                      “{desc}”
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 text-[11px] font-mono-code text-[#8A8A8A]">
              <span>Selected: {selectedIntents.length} / 3</span>
              {selectedIntents.length === 3 && (
                <span className="text-[#D4FF3F]">Max 3 reached</span>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 02: WHO WOULD YOU LIKE TO MEET ================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-1.5">
                STEP 02
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
                WHO WOULD YOU LIKE TO MEET?
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean">
                “Your people can be anywhere.”
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {STEP_2_ARCHETYPES.map(({ archetype, emoji }) => {
                const isSelected = selectedArchetypes.includes(archetype);
                return (
                  <button
                    key={archetype}
                    type="button"
                    onClick={() => toggleArchetype(archetype)}
                    className={`p-4 text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#141414] border-[#D4FF3F] text-[#F2F2ED]'
                        : 'bg-[#101010] border-[#242424] text-[#8A8A8A] hover:border-[#383838] hover:text-[#F2F2ED]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{emoji}</span>
                      <span className="text-xs font-mono-code font-bold uppercase tracking-wider">
                        {archetype}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-[#8A8A8A] font-sans-clean pt-1">
              Select one or multiple types of people you'd enjoy having in-depth conversations with.
            </p>
          </div>
        )}

        {/* ================= STEP 03: WHAT ARE YOU CURIOUS ABOUT ================= */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-1.5">
                STEP 03
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
                WHAT ARE YOU CURIOUS ABOUT?
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean">
                “Choose a few things you could talk about for hours.” (Minimum 3, maximum 12)
              </p>
            </div>

            {/* Search & Custom Interest Input */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics (e.g. AI, Space, Movies)..."
                  className="w-full bg-[#101010] border border-[#242424] pl-9 pr-4 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/50 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>

              <form onSubmit={handleAddCustomInterest} className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Add custom topic..."
                  className="bg-[#101010] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/50 focus:border-[#D4FF3F] focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-3.5 bg-[#181818] border border-[#242424] text-xs font-mono-code hover:border-[#D4FF3F] disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Selected Pills */}
            <div className="p-3 bg-[#0E0E0E] border border-[#202020] min-h-[48px] flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono-code uppercase text-[#8A8A8A] mr-1">
                SELECTED ({selectedInterests.length}/12):
              </span>
              {selectedInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className="inline-flex items-center gap-1 bg-[#141414] border border-[#D4FF3F]/50 text-[#D4FF3F] px-2.5 py-1 text-[10px] font-mono-code uppercase hover:border-red-400 hover:text-red-400 transition-colors"
                >
                  <span>{interest}</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>

            {/* Curated Grid */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto">
              {filteredInterests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider border transition-colors ${
                      isSelected
                        ? 'bg-[#181818] border-[#D4FF3F] text-[#D4FF3F]'
                        : 'bg-[#101010] border-[#242424] text-[#8A8A8A] hover:border-[#383838] hover:text-[#F2F2ED]'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 04: TELL US ABOUT YOURSELF ================= */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-1.5">
                STEP 04
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
                TELL US A LITTLE ABOUT YOU.
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean">
                “Not your resume. Just you.”
              </p>
            </div>

            {/* Approximate Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin or Chennai"
                  className="w-full bg-[#101010] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/50 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Germany or India"
                  className="w-full bg-[#101010] border border-[#242424] px-4 py-3 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/50 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
            </div>

            {/* Academic & College Background */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  College / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. MIT or IIT"
                  className="w-full bg-[#101010] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Department / Major
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-[#101010] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Year / Cohort
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2026 / 3rd Year"
                  className="w-full bg-[#101010] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
            </div>

            {/* Skills & Superpowers */}
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                Skills & Superpowers
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 bg-[#151516] text-[#D4FF3F] border border-[#D4FF3F]/30 px-2.5 py-1 text-xs font-mono-code uppercase"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#D4FF3F] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add skill (e.g. REACT, PYTHON, FIGMA, SYSTEMS)..."
                  className="flex-1 bg-[#101010] border border-[#242424] px-3.5 py-2 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-[#D4FF3F] text-[#080808] px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono-code hover:bg-white transition-colors"
                >
                  ADD
                </button>
              </div>
            </div>

            {/* Large Natural Writing Area */}
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                What are you currently curious about, building, learning, or thinking about?
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Currently obsessed with AI, building small things that probably don't need to exist, and trying to understand why people love movies that make them uncomfortable."
                className="w-full bg-[#101010] border border-[#242424] p-4 text-xs sm:text-sm text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none font-sans-clean leading-relaxed resize-none"
              />
            </div>

            {/* Optional Building / Open Question */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Currently Building (Optional)
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="A micro synth, a photography book..."
                  className="w-full bg-[#101010] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] mb-1.5">
                  Open Question on Your Mind (Optional)
                </label>
                <input
                  type="text"
                  value={openQuestion}
                  onChange={(e) => setOpenQuestion(e.target.value)}
                  placeholder="What makes a physical book feel timeless?"
                  className="w-full bg-[#101010] border border-[#242424] px-3.5 py-2.5 text-xs text-[#F2F2ED] placeholder-[#8A8A8A]/40 focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 05: PROFILE PREVIEW ================= */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-1.5">
                PROFILE PREVIEW
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#F2F2ED] font-light tracking-tight mb-2">
                YOUR MISFITS CLUB PASSPORT.
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8A8A] font-sans-clean">
                This is how other curious minds will discover and connect with you.
              </p>
            </div>

            {/* Generated Member Card */}
            <div className="bg-[#0B0B0B] border border-[#242424] p-6 sm:p-8 relative shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start gap-4 pb-6 border-b border-[#202020]">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded-sm border border-[#242424]"
                />
                <div>
                  <h3 className="font-editorial text-2xl text-[#F2F2ED] font-light tracking-tight">
                    {currentUser.name}
                  </h3>
                  <p className="text-xs text-[#8A8A8A] font-mono-code uppercase tracking-wider mt-0.5">
                    {city}, {country}
                  </p>
                  <p className="text-xs text-[#F2F2ED]/90 font-sans-clean italic mt-2.5 max-w-lg leading-relaxed">
                    “{bio}”
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-left">
                <div>
                  <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2 font-bold">
                    CURIOUS ABOUT
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInterests.slice(0, 5).map((interest) => (
                      <span
                        key={interest}
                        className="text-[9px] font-mono-code text-[#F2F2ED] bg-[#141414] border border-[#242424] px-2 py-0.5 uppercase"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2 font-bold">
                    HERE FOR
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIntents.map((intent) => (
                      <span
                        key={intent}
                        className="text-[9px] font-mono-code text-[#D4FF3F] bg-[#141414] border border-[#D4FF3F]/30 px-2 py-0.5 uppercase"
                      >
                        {intent}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#8A8A8A] block mb-2 font-bold">
                    LOOKING TO MEET
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArchetypes.map((archetype) => (
                      <span
                        key={archetype}
                        className="text-[9px] font-mono-code text-[#8A8A8A] bg-[#141414] border border-[#242424] px-2 py-0.5 uppercase"
                      >
                        {archetype}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Step Actions */}
      <div className="pt-8 mt-8 border-t border-[#242424] flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-wider text-[#8A8A8A] hover:text-[#F2F2ED] transition-colors px-3 py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK</span>
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            id={`onboarding-step-${step}-continue-btn`}
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={step === 3 && selectedInterests.length < 3}
            className="bg-[#D4FF3F] text-[#080808] px-6 py-3 text-xs font-bold font-mono-code uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors flex items-center gap-2 shadow-md disabled:opacity-40"
          >
            <span>CONTINUE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            id="onboarding-enter-misfits-btn"
            type="button"
            onClick={handleCompleteAll}
            disabled={isSaving}
            className="bg-[#D4FF3F] text-[#080808] px-8 py-3.5 text-xs font-bold font-mono-code uppercase tracking-widest hover:bg-[#F2F2ED] transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <span>{isSaving ? 'CONFIGURING YOUR ORB...' : 'ENTER MISFITS CLUB →'}</span>
          </button>
        )}
      </div>

    </div>
  );
};
