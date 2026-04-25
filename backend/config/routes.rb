Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/signup", to: "auth#signup"
      post "auth/login", to: "auth#login"
      get "auth/me", to: "auth#me"

      resources :exercises, only: %i[index update destroy]
      resources :sessions, only: %i[index show update destroy]
      resources :session_exercises, only: %i[update destroy]
      resources :sets, only: %i[update destroy]
    end
  end
end
