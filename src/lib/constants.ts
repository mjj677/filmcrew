/** Predefined skills — refine this list as needed */
export const PREDEFINED_SKILLS = [
  // Camera & Lighting
  "Cinematography",
  "Camera Operation",
  "Lighting",
  "Gaffer",
  "Grip",
  "Steadicam",
  "Drone Operation",

  // Direction & Production
  "Directing",
  "Producing",
  "Line Producing",
  "Production Management",
  "Assistant Directing",
  "Script Supervision",

  // Post-Production
  "Editing",
  "Color Grading",
  "VFX",
  "Motion Graphics",
  "Compositing",
  "Rotoscoping",

  // Sound
  "Sound Design",
  "Sound Mixing",
  "Boom Operation",
  "Foley",
  "Music Composition",
  "Music Supervision",
  "ADR",

  // Art & Design
  "Production Design",
  "Art Direction",
  "Set Design",
  "Set Decoration",
  "Props",
  "Scenic Painting",

  // Wardrobe & Makeup
  "Costume Design",
  "Wardrobe",
  "Hair & Makeup",
  "SFX Makeup",

  // Writing
  "Screenwriting",
  "Script Editing",
  "Story Development",

  // Performance
  "Acting",
  "Stunt Coordination",
  "Choreography",
  "Voice Acting",

  // Other
  "Location Scouting",
  "Casting",
  "Unit Photography",
  "DIT",
  "Catering",
  "Transport",
] as const;

export const POSITIONS = [
  "Director",
  "Producer",
  "Cinematographer",
  "Editor",
  "Sound Designer",
  "Production Designer",
  "Writer",
  "Actor",
  "Gaffer",
  "Grip",
  "1st AD",
  "2nd AD",
  "Line Producer",
  "Production Manager",
  "Production Coordinator",
  "Camera Operator",
  "1st AC",
  "2nd AC",
  "DIT",
  "Colorist",
  "VFX Artist",
  "Motion Graphics Artist",
  "Composer",
  "Sound Mixer",
  "Boom Operator",
  "Art Director",
  "Set Designer",
  "Prop Master",
  "Costume Designer",
  "Hair & Makeup Artist",
  "SFX Makeup Artist",
  "Stunt Coordinator",
  "Casting Director",
  "Location Manager",
  "Script Supervisor",
  "Unit Photographer",
  "Other",
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available", color: "bg-emerald-500" },
  { value: "busy", label: "Busy", color: "bg-amber-500" },
  { value: "not_looking", label: "Not looking", color: "bg-stone-400" },
] as const;

export const EXPERIENCE_RANGES = [
  { value: 0, label: "Less than 1 year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5 years" },
  { value: 6, label: "6 years" },
  { value: 7, label: "7 years" },
  { value: 10, label: "10+ years" },
  { value: 15, label: "15+ years" },
  { value: 20, label: "20+ years" },
] as const;