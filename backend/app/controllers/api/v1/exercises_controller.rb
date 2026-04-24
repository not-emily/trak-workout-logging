module Api
  module V1
    class ExercisesController < ApplicationController
      include Authenticatable

      def index
        exercises = policy_scope(Exercise)
        exercises = exercises.with_kind(params[:kind]) if params[:kind].present?
        exercises = exercises.with_muscle_group(params[:muscle_group]) if params[:muscle_group].present?

        render json: { data: ExerciseSerializer.call_many(exercises) }
      end

      def update
        id = params[:id]
        exercise = Exercise.find_by(id: id)

        if exercise
          return unless authorize!(exercise, :update?)
        else
          exercise = Exercise.new(id: id)
        end

        exercise.assign_attributes(exercise_params)
        exercise.is_system = false
        exercise.owner_user = current_user

        if exercise.save
          render json: { data: ExerciseSerializer.call(exercise) }
        else
          render json: { error: "Validation failed", errors: exercise.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        exercise = Exercise.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if exercise.nil?
        return unless authorize!(exercise, :destroy?)

        exercise.destroy!
        head :no_content
      end

      private

      def exercise_params
        params.permit(:name, :kind, :instructions, :equipment, :level, muscle_groups: [])
      end
    end
  end
end
