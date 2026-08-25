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
  X,
  Camera,
  GraduationCap,
  Briefcase,
  Code
} from 'lucide-react';
import { CURATED_INTERESTS_LIST } from '../data/mockData';

interface ProfileViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenOnboarding: () => void;
  onExplore: () => void;
  onSignOut?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onOpenOnboarding,
  onExplore,
  onSignOut,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(currentUser.name);
  const [photoUrl, setPhotoUrl] = useState<string>(currentUser.profilePhoto || currentUser.avatarUrl || PRESET_AVATARS[0]);
  const [location, setLocation] = useState<string>(currentUser.location || 'Worldwide');
  const [role, setRole] = useState<string>(currentUser.role || 'Explorer & Builder');
  const [bio, setBio] = useState<string>(currentUser.bio || '');
  const [college, setCollege] = useState<string>(currentUser.college || '');
  const [department, setDepartment] = useState<string>(currentUser.department || '');
  const [year, setYear] = useState<string>(currentUser.year || '');
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [newSkill, setNewSkill] = useState<string>('');
  const [building, setBuilding] = useState<string>(currentUser.building || '');
  const [learning, setLearning] = useState<string>(currentUser.learning || '');
  const [openQuestion, setOpenQuestion] = useState<string>(currentUser.openQuestion || '');
  const [website, setWebsite] = useState<string>(currentUser.links?.website || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests || ['AI', 'DESIGN', 'PHILOSOPHY']);
  const [selectedIntents, setSelectedIntents] = useState<ConnectionIntent[]>(currentUser.intents || ['Exchange Ideas', 'Just Talk']);

  const allIntents: ConnectionIntent[] = [
    'Build Together',
    'Exchange Ideas',
    'Collaborate',
    'Learn Together',
    'Find a Co-founder',
    'Find a Mentor',
    'Just Talk',
  ];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (clean && !skills.includes(clean) && skills.length < 20) {
      setSkills([...skills, clean]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      profilePhoto: photoUrl,
      avatarUrl: photoUrl,
      location,
      role,
      bio: bio.trim(),
      college: college.trim(),
      department: department.trim(),
      year: year.trim(),
      skills,
      building: building.trim(),
      learning: learning.trim(),
      openQuestion: openQuestion.trim(),
      interests: selectedInterests,
      intents: selectedIntents,
      updatedAt: new Date().toISOString(),
      links: {
        ...currentUser.links,
        website: website.trim() || undefined,
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
          <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold block mb-1">
            MEMBER PASSPORT
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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-[#F5F5F0]/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative group">
              <img
                src={photoUrl || currentUser.profilePhoto || currentUser.avatarUrl || PRESET_AVATARS[0]}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-[#F5F5F0]/10 shadow-lg"
              />
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2 max-w-sm">
                  <div>
                    <label className="text-[9px] uppercase font-mono-code text-[#969696] tracking-widest block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1.5 text-base font-editorial text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono-code text-[#969696] tracking-widest block mb-1">
                      Photo URL
                    </label>
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Category / Archetype"
                      className="w-1/2 border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-1/2 border border-[#F5F5F0]/10 bg-[#0B0B0C] px-3 py-1 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F5F0] font-light">
                    {currentUser.name}
                  </h2>
                  <p className="text-[10px] text-[#969696] uppercase tracking-widest mt-1">
                    {currentUser.location || 'Worldwide'} · {currentUser.roleEmoji || '✨'} {currentUser.role}
                  </p>
                  <p className="text-[10px] text-[#969696] uppercase tracking-widest mt-1">
                    Member since {currentUser.joinedDate || '2026'} · {currentUser.email}
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
              <div className="flex flex-wrap gap-1 max-w-xs justify-start sm:justify-end">
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
                {(currentUser.intents || ['Exchange Ideas', 'Just Talk']).map((intent) => (
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

        {/* Academic / College Foundation */}
        <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-5">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-[#D4FF3F]" />
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold">
              Academic Background & Affiliation
            </span>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] uppercase font-mono-code text-[#969696] tracking-widest block mb-1">
                  College / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Stanford University or IIT Madras"
                  className="w-full border border-[#F5F5F0]/10 bg-[#151516] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-mono-code text-[#969696] tracking-widest block mb-1">
                  Department / Major
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science / Design"
                  className="w-full border border-[#F5F5F0]/10 bg-[#151516] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-mono-code text-[#969696] tracking-widest block mb-1">
                  Graduation / Year
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. Class of 2026 or 3rd Year"
                  className="w-full border border-[#F5F5F0]/10 bg-[#151516] px-3 py-2 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#969696] block text-[9px] uppercase tracking-wider">College</span>
                <span className="text-[#F5F5F0] font-medium">{currentUser.college || 'Independent Scholar'}</span>
              </div>
              <div>
                <span className="text-[#969696] block text-[9px] uppercase tracking-wider">Department</span>
                <span className="text-[#F5F5F0] font-medium">{currentUser.department || 'Multidisciplinary'}</span>
              </div>
              <div>
                <span className="text-[#969696] block text-[9px] uppercase tracking-wider">Year</span>
                <span className="text-[#F5F5F0] font-medium">{currentUser.year || 'Lifelong Learner'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="border border-[#F5F5F0]/10 bg-[#0B0B0C] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-[#D4FF3F]" />
            <span className="text-[10px] text-[#D4FF3F] uppercase tracking-widest font-mono-code font-bold">
              Core Skills & Craft
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-[#151516] text-[#D4FF3F] border border-[#D4FF3F]/40 px-2.5 py-1 text-xs font-mono-code uppercase"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#D4FF3F] hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g., TypeScript, UI Design, Rust)..."
                  className="flex-1 border border-[#F5F5F0]/10 bg-[#151516] px-3 py-1.5 text-xs text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#D4FF3F] text-[#0B0B0C] px-3 py-1.5 text-xs font-bold uppercase tracking-wider font-mono-code"
                >
                  Add
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentUser.skills && Array.isArray(currentUser.skills) && currentUser.skills.length > 0 ? (
                (currentUser.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-mono-code text-[#D4FF3F] bg-[#151516] border border-[#D4FF3F]/30 px-3 py-1 uppercase"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#969696] italic">No skills listed yet</span>
              )}
            </div>
          )}
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
              placeholder="Tell others what drives your curiosity and experiments..."
              className="w-full border border-[#F5F5F0]/10 bg-[#0B0B0C] p-4 text-xs sm:text-sm text-[#F5F5F0] focus:border-[#D4FF3F] focus:outline-none leading-relaxed"
            />
          ) : (
            <p className="font-sans-clean text-base text-[#969696] leading-relaxed">
              {currentUser.bio || 'Exploring ideas at the intersection of craft, systems, and creative thought.'}
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
              {(currentUser.interests || []).map((interest) => (
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

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenOnboarding}
              className="text-[10px] text-[#969696] uppercase tracking-widest font-bold hover:text-[#D4FF3F] transition-colors"
            >
              Update Onboarding
            </button>
            {onSignOut && (
              <button
                id="profile-sign-out-btn"
                onClick={onSignOut}
                className="text-[10px] text-red-400/80 hover:text-red-400 uppercase tracking-widest font-mono-code font-bold transition-colors border border-red-500/20 px-3 py-1.5 hover:border-red-500/40"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

