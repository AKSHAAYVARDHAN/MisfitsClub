import React, { useState } from 'react';
import { UserProfile, ConnectionIntent } from '../types';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Edit3, 
  Save, 
  ExternalLink, 
  Compass, 
  Globe2, 
  Calendar,
  Check,
  Plus,
  X
} from 'lucide-react';
import { CURATED_INTERESTS_LIST } from '../data/mockData';

interface ProfileViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenOnboarding: () => void;
  onExplore: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onOpenOnboarding,
  onExplore,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(currentUser.name);
  const [location, setLocation] = useState<string>(currentUser.location);
  const [role, setRole] = useState<string>(currentUser.role);
  const [bio, setBio] = useState<string>(currentUser.bio);
  const [building, setBuilding] = useState<string>(currentUser.building || '');
  const [learning, setLearning] = useState<string>(currentUser.learning || '');
  const [openQuestion, setOpenQuestion] = useState<string>(currentUser.openQuestion || '');
  const [website, setWebsite] = useState<string>(currentUser.links?.website || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests);
  const [selectedIntents, setSelectedIntents] = useState<ConnectionIntent[]>(currentUser.intents);
  const [customInterest, setCustomInterest] = useState<string>('');

  const allIntents: ConnectionIntent[] = [
    'Build Together',
    'Exchange Ideas',
    'Collaborate',
    'Learn Together',
    'Find a Co-founder',
    'Find a Mentor',
    'Just Talk',
  ];

  const handleSave = () => {
    const updated: UserProfile = {
      ...currentUser,
      name,
      location,
      role,
      bio,
      building,
      learning,
      openQuestion,
      interests: selectedInterests,
      intents: selectedIntents,
      links: {
        ...currentUser.links,
        website: website || undefined,
      },
    };

    onUpdateProfile(updated);
    setIsEditing(false);
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const toggleIntent = (intent: ConnectionIntent) => {
    if (selectedIntents.includes(intent)) {
      setSelectedIntents(selectedIntents.filter((i) => i !== intent));
    } else {
      if (selectedIntents.length < 3) {
        setSelectedIntents([...selectedIntents, intent]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F5F5F0] py-8 px-4 sm:px-8 lg:px-12 max-w-4xl mx-auto pb-24 selection:bg-[#D4FF3F] selection:text-[#0B0B0C]">
      
      {/* Top Banner and Edit Button */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#F5F5F0]/10">
        <div>
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-bold block mb-1">
            Human Identity
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F5F0] font-light">
            Your Misfits Profile
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <button
              id="save-profile-btn"
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#D4FF3F] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#0B0B0C] hover:bg-[#F5F5F0] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              id="edit-profile-btn"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 border border-[#F5F5F0]/10 bg-[#151516] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#F5F5F0] hover:border-[#D4FF3F] hover:text-[#D4FF3F] transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#D4FF3F]" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Card Container */}
      <div className="border border-[#F5F5F0]/10 bg-[#151516] p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Header: Photo, Name, Location */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-[#F5F5F0]/10">
          <div className="flex items-center gap-5">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-[#F5F5F0]/10 shadow-lg"
            />

            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1.5 text-base font-editorial text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Category / Archetype"
                    className="block border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="block border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                    {currentUser.name}
                  </h2>
                  <p className="text-[10px] text-[#969696] uppercase tracking-widest mt-1">
                    {currentUser.location} · {currentUser.roleEmoji} {currentUser.role}
                  </p>
                  <p className="text-[10px] text-[#969696] uppercase tracking-widest mt-1">
                    Member since {currentUser.joinedDate || '2026'} · {currentUser.handle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Connection Intents */}
          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold">
              Core Intentions
            </span>
            {isEditing ? (
              <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                {allIntents.map((intent) => {
                  const isSel = selectedIntents.includes(intent);
                  return (
                    <button
                      key={intent}
                      onClick={() => toggleIntent(intent)}
                      className={`text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider border transition-colors ${
                        isSel
                          ? 'border-[#D4FF3F] bg-[#D4FF3F] text-[#0B0B0C]'
                          : 'border-[#F5F5F0]/10 bg-[#0B0B0C] text-[#969696]'
                      }`}
                    >
                      {intent}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap sm:flex-col gap-1.5 sm:items-end">
                {currentUser.intents.map((intent) => (
                  <span
                    key={intent}
                    className="text-[10px] font-bold text-[#D4FF3F] border border-[#D4FF3F]/30 px-3 py-1 uppercase tracking-wider"
                  >
                    {intent}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio / Personal Statement */}
        <div>
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-bold block mb-2">
            About Me & Current Thinking
          </span>
          {isEditing ? (
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] p-4 text-xs sm:text-sm text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none leading-relaxed"
            />
          ) : (
            <p className="font-sans-clean text-base text-[#969696] leading-relaxed">
              {currentUser.bio}
            </p>
          )}
        </div>

        {/* Grid: What I'm building & What I'm learning */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-5">
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-bold block mb-2">
              🔨 What I'm Building
            </span>
            {isEditing ? (
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="What project or tool are you making?"
                className="w-full border border-[#F5F5F0]/10 bg-[#151516] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
              />
            ) : (
              <p className="text-sm text-[#F5F5F0]/90 leading-relaxed">
                {currentUser.building || 'Exploring ideas & prototypes'}
              </p>
            )}
          </div>

          <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-5">
            <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2">
              🧠 What I'm Learning
            </span>
            {isEditing ? (
              <input
                type="text"
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                placeholder="What subject or skill are you learning?"
                className="w-full border border-[#F5F5F0]/10 bg-[#151516] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
              />
            ) : (
              <p className="text-sm text-[#F5F5F0]/90 leading-relaxed">
                {currentUser.learning || 'Diving into rare rabbit holes'}
              </p>
            )}
          </div>
        </div>

        {/* Open Question */}
        <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-5">
          <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2">
            ❓ Open Question I'm Pondering
          </span>
          {isEditing ? (
            <input
              type="text"
              value={openQuestion}
              onChange={(e) => setOpenQuestion(e.target.value)}
              placeholder="What question is keeping you awake?"
              className="w-full border border-[#F5F5F0]/10 bg-[#151516] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
            />
          ) : (
            <p className="font-editorial text-xl sm:text-2xl italic text-[#F5F5F0] leading-relaxed font-light">
              “{currentUser.openQuestion || 'How do we preserve human texture in an algorithmic world?'}”
            </p>
          )}
        </div>

        {/* Interests */}
        <div>
          <span className="text-[10px] text-[#969696] uppercase tracking-widest font-bold block mb-2.5">
            Interests & Subjects
          </span>
          {isEditing ? (
            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className="flex items-center gap-1 text-xs text-[#D4FF3F] bg-[#D4FF3F]/10 border border-[#D4FF3F]/40 px-2.5 py-1 uppercase tracking-wider font-bold"
                  >
                    <span>{interest}</span>
                    <X className="w-3 h-3 text-[#D4FF3F]" />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-[#F5F5F0]/10 bg-[#0B0B0C]">
                {CURATED_INTERESTS_LIST.map((interest) => {
                  const isSel = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider transition-colors ${
                        isSel
                          ? 'bg-[#D4FF3F] text-[#0B0B0C]'
                          : 'bg-[#151516] text-[#969696] border border-[#F5F5F0]/5 hover:border-[#D4FF3F] hover:text-[#F5F5F0]'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {currentUser.interests.map((interest) => (
                <span
                  key={interest}
                  className="text-[10px] text-[#969696] bg-[#0B0B0C] px-3 py-1 border border-[#F5F5F0]/5 uppercase"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="pt-6 border-t border-[#F5F5F0]/10 flex flex-wrap items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-4 text-[#969696]">
            {currentUser.links?.website && (
              <a
                href={currentUser.links.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#F5F5F0] hover:text-[#D4FF3F] transition-colors"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {currentUser.links?.github && (
              <span className="text-[#969696]">{currentUser.links.github}</span>
            )}
            {currentUser.links?.substack && (
              <span className="text-[#969696]">{currentUser.links.substack}</span>
            )}
          </div>

          <button
            onClick={onOpenOnboarding}
            className="text-[10px] text-[#969696] uppercase tracking-widest font-bold hover:text-[#D4FF3F] transition-colors"
          >
            Restart Profile Flow
          </button>
        </div>

      </div>
    </div>
  );
};
