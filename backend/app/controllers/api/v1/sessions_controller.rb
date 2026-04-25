module Api
  module V1
    class SessionsController < ApplicationController
      include Authenticatable

      def index
        sessions = policy_scope(Session)
        render json: { data: SessionSerializer.call_many(sessions) }
      end

      def show
        session = Session.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if session.nil?
        return unless authorize!(session, :show?)

        render json: { data: SessionSerializer.call(session, include_nested: true) }
      end

      def update
        id = params[:id]
        session = Session.find_by(id: id)

        if session
          return unless authorize!(session, :update?)
        else
          session = Session.new(id: id)
        end

        session.assign_attributes(session_params)
        session.user = current_user

        if session.save
          render json: { data: SessionSerializer.call(session, include_nested: true) }
        else
          render json: { error: "Validation failed", errors: session.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        session = Session.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if session.nil?
        return unless authorize!(session, :destroy?)

        session.destroy!
        head :no_content
      end

      private

      def session_params
        params.permit(:name, :started_at, :ended_at, :notes, :routine_id)
      end
    end
  end
end
