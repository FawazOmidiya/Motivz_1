// Music genres used throughout the app (matching event filtering)
export const MUSIC_GENRES = [
  "HipHop",
  "Pop",
  "Soul",
  "Rap",
  "House",
  "Latin",
  "EDM",
  "Jazz",
  "Country",
  "Blues",
  "DanceHall",
  "Afrobeats",
  "Top 40",
  "Amapiano",
  "90's",
  "2000's",
  "2010's",
  "R&B",
] as const;

// Crowd preferences for nightlife
export const CROWD_PREFERENCES = [
  "Diverse",
  "Young (18-30)",
  "Professional (30-45)",
  "Mixed Ages",
  "LGBTQ+",
  "Local",
  "Student",
  "Black",
  "Asian",
  "Latinx",
] as const;

// Nightlife goals and activities
export const NIGHTLIFE_GOALS = [
  "Dance",
  "Meet New People",
  "Date",
  "Network",
  "Celebrate",
  "Relax",
  "Party",
  "Socialize",
] as const;

// Dress code options
export const DRESS_CODE_OPTIONS = [
  "Casual",
  "Smart Casual",
  "Dressy",
  "Formal",
  "Trendy",
  "Comfortable",
] as const;

// Budget options
export const BUDGET_OPTIONS = [
  "Budget",
  "Moderate",
  "Upscale",
  "Premium",
] as const;

// Drinking preferences
export const DRINKING_OPTIONS = [
  "Non-drinker",
  "Light",
  "Moderate",
  "Heavy",
] as const;

// Smoking preferences
export const SMOKING_OPTIONS = [
  "Non-smoker",
  "Occasional",
  "Regular",
  "Vape",
] as const;

// Type definitions for better TypeScript support
export type MusicGenre = (typeof MUSIC_GENRES)[number];
export type CrowdPreference = (typeof CROWD_PREFERENCES)[number];
export type NightlifeGoal = (typeof NIGHTLIFE_GOALS)[number];
export type DressCodeOption = (typeof DRESS_CODE_OPTIONS)[number];
export type BudgetOption = (typeof BUDGET_OPTIONS)[number];
export type DrinkingOption = (typeof DRINKING_OPTIONS)[number];
export type SmokingOption = (typeof SMOKING_OPTIONS)[number];
