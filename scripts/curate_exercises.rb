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

  # ── Machine ──────────────────────────────────────────────────────
  "Leg Press" => nil,
  "Leg Extensions" => "Leg Extension",
  "Lying Leg Curls" => "Lying Leg Curl",
  "Seated Leg Curl" => nil,
  "Standing Leg Curl" => nil,
  "Hack Squat" => nil,
  "Standing Calf Raises" => "Standing Calf Raise",
  "Seated Calf Raise" => nil,
  "Calf Press On The Leg Press Machine" => "Leg Press Calf Raise",
  "Machine Shoulder (Military) Press" => "Machine Shoulder Press",
  "Machine Bench Press" => nil,
  "Butterfly" => "Pec Deck",
  "Reverse Machine Flyes" => "Reverse Pec Deck",
  "Leverage Chest Press" => "Seated Machine Chest Press",
  "Leverage Incline Chest Press" => "Machine Incline Chest Press",
  "Leverage Decline Chest Press" => "Machine Decline Chest Press",
  "Leverage High Row" => "Machine High Row",
  "Leverage Iso Row" => "Iso-Lateral Row Machine",
  "Lying T-Bar Row" => "T-Bar Row",
  "Leverage Shrug" => "Machine Shrug",
  "Machine Bicep Curl" => nil,
  "Machine Preacher Curls" => "Machine Preacher Curl",
  "Machine Triceps Extension" => nil,
  "Dip Machine" => nil,
  "Ab Crunch Machine" => nil,
  "Glute Ham Raise" => nil,
  "Reverse Hyperextension" => nil,
  "Thigh Abductor" => "Hip Abductor Machine",
  "Thigh Adductor" => "Hip Adductor Machine",

  # ── Smith machine ────────────────────────────────────────────────
  "Smith Machine Squat" => nil,
  "Smith Machine Bench Press" => nil,
  "Smith Machine Incline Bench Press" => nil,
  "Smith Machine Bent Over Row" => nil,
  "Smith Machine Overhead Shoulder Press" => "Smith Machine Overhead Press",
  "Smith Machine Stiff-Legged Deadlift" => nil,
  "Smith Machine Calf Raise" => nil,

  # ── Cable ────────────────────────────────────────────────────────
  "Wide-Grip Lat Pulldown" => nil,
  "Close-Grip Front Lat Pulldown" => "Close-Grip Lat Pulldown",
  "V-Bar Pulldown" => nil,
  "Underhand Cable Pulldowns" => "Underhand Lat Pulldown",
  "One Arm Lat Pulldown" => "Single-Arm Lat Pulldown",
  "Straight-Arm Pulldown" => "Straight-Arm Cable Pulldown",
  "Seated Cable Rows" => "Seated Cable Row",
  "Seated One-arm Cable Pulley Rows" => "Single-Arm Cable Row",
  "Cable Crossover" => nil,
  "Low Cable Crossover" => nil,
  "Incline Cable Flye" => "Incline Cable Fly",
  "Cable Chest Press" => nil,
  "Triceps Pushdown" => "Cable Triceps Pushdown",
  "Triceps Pushdown - Rope Attachment" => "Rope Triceps Pushdown",
  "Reverse Grip Triceps Pushdown" => nil,
  "Cable Rope Overhead Triceps Extension" => "Overhead Cable Triceps Extension",
  "Standing Biceps Cable Curl" => "Cable Biceps Curl",
  "Cable Hammer Curls - Rope Attachment" => "Cable Rope Hammer Curl",
  "Cable Preacher Curl" => nil,
  "Cable Shoulder Press" => nil,
  "Standing Low-Pulley Deltoid Raise" => "Cable Lateral Raise",
  "Cable Rear Delt Fly" => nil,
  "Face Pull" => nil,
  "Cable Shrugs" => "Cable Shrug",
  "Upright Cable Row" => "Cable Upright Row",
  "One-Legged Cable Kickback" => "Cable Glute Kickback",
  "Pull Through" => "Cable Pull-Through",
  "Cable Crunch" => nil,
  "Pallof Press" => nil,
  "Standing Cable Wood Chop" => "Cable Wood Chop",
  "Cable Russian Twists" => "Cable Russian Twist",

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
  "Russian Twist" => nil,
  "Oblique Crunches" => "Oblique Crunch",

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

# Real gym equipment that free-exercise-db simply doesn't have an entry for.
# Hand-written directly in trak's schema and merged into the output.
#
# `seed_slug` MUST be prefixed `trak_` — source slugs come from the upstream
# `id` field, so the prefix guarantees these can never collide with one (and
# never get clobbered if upstream later adds the same exercise under its own id).
#
# Add to this list rather than editing the generated JSON — the JSON is
# overwritten on every run of this script.
EXTRAS = [
  {
    seed_slug: "trak_rotary_torso_machine",
    name: "Rotary Torso Machine",
    kind: "strength",
    muscle_groups: ["abdominals"],
    equipment: "machine",
    level: "beginner",
    instructions: [
      "Sit upright in the machine with your feet flat on the platform and your thighs secured under the pads. Set the seat so your torso starts square to the weight stack.",
      "Grip the handles and brace your core. Keep your hips and legs locked in place — the rotation comes from your trunk, not your lower body.",
      "Exhale and rotate your torso smoothly to one side as far as your range of motion comfortably allows. Pause briefly at the end of the movement.",
      "Inhale and return under control to the starting position. Complete all reps on one side, then reset the machine for the other side.",
    ].join("\n"),
  },
].freeze

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

selected.concat(EXTRAS)
puts "  + #{EXTRAS.size} hand-written extras"

# A duplicate seed_slug would make seeding non-deterministic — the last
# write for that slug wins. Fail loudly instead.
dupes = selected.group_by { |e| e[:seed_slug] }.select { |_, v| v.size > 1 }.keys
abort "✗ Duplicate seed_slug(s): #{dupes.join(', ')}" if dupes.any?

# Sort by kind, then name — keeps the committed file diff-friendly
selected.sort_by! { |e| [e[:kind], e[:name]] }

File.write(OUTPUT_PATH, JSON.pretty_generate(selected) + "\n")
puts "\n✓ Wrote #{selected.size} exercises to #{OUTPUT_PATH}"
puts "  by kind: #{selected.group_by { |e| e[:kind] }.transform_values(&:size)}"
