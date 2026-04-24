#!/usr/bin/env ruby
# Curate the trak exercise seed library from yuhonas/free-exercise-db.
#
# Fetches dist/exercises.json from free-exercise-db, filters to the
# allowlist of exercises below, transforms to trak's schema, and writes
# backend/lib/exercises_seed_data.json.
#
# Run: ruby scripts/curate_exercises.rb
# Output: backend/lib/exercises_seed_data.json
#
# Re-run any time to update. The seed file is vendored (committed) so
# deploys don't depend on GitHub being reachable.

require "json"
require "net/http"
require "uri"

SOURCE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
OUTPUT_PATH = File.expand_path("../backend/lib/exercises_seed_data.json", __dir__)

# Allowlist of exercises to seed, grouped by logical category.
# Key = source `name` (exact match, case-insensitive).
# Value = optional override for display_name. Nil keeps source name.
ALLOWLIST = {
  # ── Barbell strength ─────────────────────────────────────────────
  "Barbell Bench Press - Medium Grip" => "Barbell Bench Press",
  "Barbell Incline Bench Press - Medium Grip" => "Incline Barbell Bench Press",
  "Decline Barbell Bench Press" => nil,
  "Close-Grip Barbell Bench Press" => nil,
  "Barbell Squat" => "Barbell Back Squat",
  "Front Squat (Clean Grip)" => "Barbell Front Squat",
  "Barbell Deadlift" => "Deadlift",
  "Romanian Deadlift" => nil,
  "Sumo Deadlift" => nil,
  "Bent Over Barbell Row" => "Barbell Row",
  "Barbell Shoulder Press" => "Overhead Press",
  "Barbell Curl" => nil,
  "Barbell Shrug" => nil,
  "Barbell Lunge" => nil,
  "Power Clean" => nil,
  "Barbell Hip Thrust" => nil,

  # ── Dumbbell ─────────────────────────────────────────────────────
  "Dumbbell Bench Press" => nil,
  "Incline Dumbbell Press" => "Incline Dumbbell Bench Press",
  "Decline Dumbbell Bench Press" => nil,
  "Dumbbell Shoulder Press" => nil,
  "Arnold Dumbbell Press" => "Arnold Press",
  "One-Arm Dumbbell Row" => nil,
  "Dumbbell Bicep Curl" => nil,
  "Hammer Curls" => "Dumbbell Hammer Curl",
  "Concentration Curls" => "Concentration Curl",
  "Dumbbell Flyes" => "Dumbbell Fly",
  "Incline Dumbbell Flyes" => "Incline Dumbbell Fly",
  "Lying Dumbbell Tricep Extension" => nil,
  "Dumbbell Shrug" => nil,
  "Dumbbell Squat" => nil,
  "Dumbbell Lunges" => "Dumbbell Lunge",
  "Dumbbell Step Ups" => "Dumbbell Step-Up",
  "Front Dumbbell Raise" => "Dumbbell Front Raise",
  "Side Lateral Raise" => "Dumbbell Lateral Raise",

  # ── Machine / Cable ──────────────────────────────────────────────
  "Leg Press" => nil,
  "Leg Extensions" => "Leg Extension",
  "Lying Leg Curls" => "Lying Leg Curl",
  "Seated Leg Curl" => nil,
  "Hack Squat" => nil,
  "Standing Calf Raises" => "Standing Calf Raise",
  "Seated Calf Raise" => nil,
  "Machine Shoulder (Military) Press" => "Machine Shoulder Press",
  "Machine Bench Press" => nil,
  "Butterfly" => "Pec Deck",
  "Wide-Grip Lat Pulldown" => nil,
  "Close-Grip Front Lat Pulldown" => "Close-Grip Lat Pulldown",
  "Seated Cable Rows" => "Seated Cable Row",
  "Cable Crossover" => nil,
  "Triceps Pushdown" => "Cable Triceps Pushdown",
  "Cable Rope Overhead Triceps Extension" => "Overhead Cable Triceps Extension",
  "Standing Biceps Cable Curl" => "Cable Biceps Curl",
  "Face Pull" => nil,
  "Cable Crunch" => nil,
  "Thigh Abductor" => "Hip Abductor Machine",
  "Thigh Adductor" => "Hip Adductor Machine",

  # ── Bodyweight ───────────────────────────────────────────────────
  "Pushups" => "Push-Up",
  "Pullups" => "Pull-Up",
  "Chin-Up" => nil,
  "Bench Dips" => nil,
  "Dips - Triceps Version" => "Triceps Dips",
  "Bodyweight Squat" => nil,
  "Sit-Up" => nil,
  "Crunches" => "Crunch",
  "Plank" => nil,
  "Butt Lift (Bridge)" => "Glute Bridge",
  "Incline Push-Up" => nil,
  "Push-Up Wide" => "Wide Push-Up",
  "Incline Push-Up Close-Grip" => "Close-Grip Push-Up",
  "Reverse Crunch" => nil,
  "Side Bridge" => "Side Plank",

  # ── Cardio ───────────────────────────────────────────────────────
  "Running, Treadmill" => "Running",
  "Jogging, Treadmill" => "Jogging",
  "Walking, Treadmill" => "Walking",
  "Bicycling" => "Cycling",
  "Bicycling, Stationary" => "Stationary Cycling",
  "Rowing, Stationary" => "Rowing",
  "Elliptical Trainer" => nil,
  "Rope Jumping" => "Jump Rope",
  "Stairmaster" => nil,
}.freeze

# Map source category + equipment → trak's kind
def infer_kind(source)
  case source["category"]
  when "cardio"
    "cardio"
  when "strength", "powerlifting", "olympic weightlifting", "strongman"
    source["equipment"] == "body only" ? "bodyweight" : "strength"
  else
    "strength"
  end
end

# Normalize muscle group names: "upper back" → "upper_back"
def normalize_muscle(m)
  m.downcase.strip.gsub(/[\s\-]+/, "_")
end

# Transform a source exercise to trak's schema.
def transform(source, display_name)
  {
    seed_slug: source["id"].downcase,
    name: display_name || source["name"],
    kind: infer_kind(source),
    muscle_groups: (source["primaryMuscles"] + source["secondaryMuscles"]).map { |m| normalize_muscle(m) }.uniq,
    equipment: source["equipment"],
    level: source["level"],
    instructions: source["instructions"].join("\n"),
  }
end

# ─────────────────────────────────────────────────────────────────────

puts "Fetching #{SOURCE_URL}..."
raw = Net::HTTP.get(URI(SOURCE_URL))
source = JSON.parse(raw)
puts "  #{source.size} exercises in source"

by_name = source.each_with_object({}) { |e, h| h[e["name"].downcase] = e }

selected = []
missing = []
ALLOWLIST.each do |name, display_name|
  entry = by_name[name.downcase]
  if entry
    selected << transform(entry, display_name)
  else
    missing << name
  end
end

if missing.any?
  warn "⚠ #{missing.size} allowlisted names not found in source:"
  missing.each { |n| warn "    #{n}" }
end

# Sort by kind, then name — keeps the committed file diff-friendly
selected.sort_by! { |e| [e[:kind], e[:name]] }

File.write(OUTPUT_PATH, JSON.pretty_generate(selected) + "\n")
puts "\n✓ Wrote #{selected.size} exercises to #{OUTPUT_PATH}"
puts "  by kind: #{selected.group_by { |e| e[:kind] }.transform_values(&:size)}"
