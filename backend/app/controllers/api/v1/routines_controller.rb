module Api
  module V1
    class RoutinesController < ApplicationController
      include Authenticatable

      def index
        routines = policy_scope(Routine)
        render json: { data: RoutineSerializer.call_many(routines) }
      end

      def show
        routine = Routine.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if routine.nil?
        return unless authorize!(routine, :show?)

        render json: { data: RoutineSerializer.call(routine, include_exercises: true) }
      end

      def update
        id = params[:id]
        routine = Routine.find_by(id: id)

        if routine
          return unless authorize!(routine, :update?)
        else
          routine = Routine.new(id: id)
        end

        routine.assign_attributes(routine_params)
        routine.user = current_user

        if routine.save
          render json: { data: RoutineSerializer.call(routine, include_exercises: true) }
        else
          render json: { error: "Validation failed", errors: routine.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        routine = Routine.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if routine.nil?
        return unless authorize!(routine, :destroy?)

        routine.destroy!
        head :no_content
      end

      private

      def routine_params
        params.permit(:name, :description, :position)
      end
    end
  end
end
