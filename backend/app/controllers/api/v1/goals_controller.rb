module Api
  module V1
    class GoalsController < ApplicationController
      include Authenticatable

      def index
        goals = policy_scope(Goal)
        render json: { data: GoalSerializer.call_many(goals) }
      end

      def update
        id = params[:id]
        goal = Goal.find_by(id: id)

        if goal
          return unless authorize!(goal, :update?)
        else
          goal = Goal.new(id: id)
        end

        goal.assign_attributes(goal_params)
        goal.user = current_user

        if goal.save
          render json: { data: GoalSerializer.call(goal) }
        else
          render json: { error: "Validation failed", errors: goal.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        goal = Goal.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if goal.nil?
        return unless authorize!(goal, :destroy?)

        goal.destroy!
        head :no_content
      end

      private

      def goal_params
        params.permit(
          :name,
          :target_type,
          :exercise_id,
          :metric,
          :target_value,
          :start_value,
          :unit,
          :direction,
          :target_date,
          :achieved_at,
        )
      end
    end
  end
end
