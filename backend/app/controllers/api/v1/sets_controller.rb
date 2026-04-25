module Api
  module V1
    class SetsController < ApplicationController
      include Authenticatable

      def update
        id = params[:id]
        set = WorkoutSet.find_by(id: id)

        if set
          return unless authorize!(set, :update?)
        else
          set = WorkoutSet.new(id: id)
        end

        set.assign_attributes(set_params)

        # Verify the referenced session_exercise belongs to current_user
        parent_se = set.session_exercise
        if parent_se.nil? || parent_se.session.user_id != current_user.id
          return render json: { error: "Resource not found" }, status: :not_found
        end

        if set.save
          render json: { data: WorkoutSetSerializer.call(set) }
        else
          render json: { error: "Validation failed", errors: set.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        set = WorkoutSet.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if set.nil?
        return unless authorize!(set, :destroy?)

        set.destroy!
        head :no_content
      end

      private

      def set_params
        params.permit(
          :session_exercise_id, :position, :reps, :weight_lb,
          :duration_seconds, :distance_meters, :rpe, :is_warmup,
          :completed_at, :notes
        )
      end
    end
  end
end
