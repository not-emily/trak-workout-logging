module Api
  module V1
    class AuthController < ApplicationController
      include Authenticatable

      skip_before_action :authenticate_user!, only: %i[signup login]

      def signup
        user = User.new(signup_params)
        if user.save
          render json: { data: { token: self.class.issue_token(user), user: UserSerializer.call(user) } }, status: :created
        else
          render json: { error: "Validation failed", errors: user.errors.as_json }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by("LOWER(email) = ?", params[:email].to_s.strip.downcase)
        if user&.authenticate(params[:password])
          render json: { data: { token: self.class.issue_token(user), user: UserSerializer.call(user) } }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def me
        render json: { data: UserSerializer.call(current_user) }
      end

      private

      def signup_params
        params.permit(:email, :password, :name)
      end
    end
  end
end
