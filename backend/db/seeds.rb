# Idempotent seeds. Safe to run on every deploy.
#
# Curated from yuhonas/free-exercise-db via scripts/curate_exercises.rb.
# To update the library, edit scripts/curate_exercises.rb, re-run it,
# commit the regenerated JSON, and re-deploy.

require "json"

exercise_seed_path = Rails.root.join("lib", "exercises_seed_data.json")
seed_data = JSON.parse(File.read(exercise_seed_path))

puts "Seeding #{seed_data.size} system exercises..."

created = 0
updated = 0

seed_data.each do |attrs|
  exercise = Exercise.find_or_initialize_by(seed_slug: attrs["seed_slug"])
  was_new = exercise.new_record?

  exercise.assign_attributes(
    name: attrs["name"],
    kind: attrs["kind"],
    muscle_groups: attrs["muscle_groups"],
    equipment: attrs["equipment"],
    level: attrs["level"],
    instructions: attrs["instructions"],
    is_system: true,
    owner_user_id: nil,
  )

  if exercise.changed?
    exercise.save!
    was_new ? created += 1 : updated += 1
  end
end

puts "  ✓ Created: #{created}, Updated: #{updated}, Unchanged: #{seed_data.size - created - updated}"
