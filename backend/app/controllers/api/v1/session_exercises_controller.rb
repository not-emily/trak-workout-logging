module Api
  module V1
    class SessionExercisesController < ApplicationController
      include Authenticatable

      def update
        id = params[:id]
        session_exercise = SessionExercise.find_by(id: id)

        if session_exercise
          return unless authorize!(session_exercise, :update?)
        else
          session_exercise = SessionExercise.new(id: id)
        end

        session_exercise.assign_attributes(session_exercise_params)

        # Verify the referenced session belongs to current_user
        parent_session = session_exercise.session
        if parent_session.nil? || parent_session.user_id != current_user.id
          return render json: { error: "Resource not found" }, status: :not_found
        end

        if session_exercise.save
          render json: { data: SessionExerciseSerializer.call(session_exercise, include_sets: true) }
        else
          render json: { error: "Validation failed", errors: session_exercise.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        session_exercise = SessionExercise.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if session_exercise.nil?
        return unless authorize!(session_exercise, :destroy?)

        session_exercise.destroy!
        head :no_content
      end

      private

      def session_exercise_params
        params.permit(:session_id, :exercise_id, :position, :notes)
      end
    end
  end
end
