module Api
  module V1
    class BodyMeasurementsController < ApplicationController
      include Authenticatable

      def index
        measurements = policy_scope(BodyMeasurement)
        render json: { data: BodyMeasurementSerializer.call_many(measurements) }
      end

      def update
        id = params[:id]
        measurement = BodyMeasurement.find_by(id: id)

        if measurement
          return unless authorize!(measurement, :update?)
        else
          measurement = BodyMeasurement.new(id: id)
        end

        measurement.assign_attributes(measurement_params)
        measurement.user = current_user

        if measurement.save
          render json: { data: BodyMeasurementSerializer.call(measurement) }
        else
          render json: { error: "Validation failed", errors: measurement.errors.as_json }, status: :unprocessable_entity
        end
      end

      def destroy
        measurement = BodyMeasurement.find_by(id: params[:id])
        return render json: { error: "Resource not found" }, status: :not_found if measurement.nil?
        return unless authorize!(measurement, :destroy?)

        measurement.destroy!
        head :no_content
      end

      private

      def measurement_params
        params.permit(:metric, :value, :unit, :recorded_at, :notes)
      end
    end
  end
end
