module Api
  module V1
    class RoutineExercisesController < ApplicationController
      include Authenticatable

      def update
        id = params[:id]
        routine_exercise = RoutineExercise.find_by(id: id)

        if routine_exercise
          return unless authorize!(routine_exercise, :update?)
        else
          routine_exercise = RoutineExercise.new(id: id)
        end

        routine_exercise.assign_attributes(routine_exercise_params)

        # Verify the referenced routine belongs to current_user
        parent_routine = routine_exercise.routine
        if parent_routine.nil? || parent_routine.user_id != current_user.id
          return render json: { error: "Resource not found" }, status: :not_found
        end

        if routine_exercise.save
          render json: { data: RoutineExerciseSerializer.call(routine_exercise) }
        else
          render json: { error: "Validation failed", errors: routine_exercise.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        re = RoutineExercise.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if re.nil?
        return unless authorize!(re, :destroy?)

        re.destroy!
        head :no_content
      end

      private

      def routine_exercise_params
        params.permit(
          :routine_id, :exercise_id, :position,
          :planned_sets, :planned_reps, :planned_weight_lb,
          :planned_duration_seconds, :planned_distance_meters,
          :notes
        )
      end
    end
  end
end
