# Upsert-by-UUID helper for idempotent writes from the offline sync queue.
#
# Clients generate UUIDs for every record and PUT to the resource endpoint.
# The same PUT can arrive multiple times (retries, queue drains) and must
# produce the same final state. The parent_check proc verifies that any
# referenced parent record belongs to the current user.
module Syncable
  extend ActiveSupport::Concern

  def upsert_by_uuid(model, params, parent_check: nil)
    id = params[:id] || params["id"] || (raise ArgumentError, "Missing id for upsert")

    record = model.find_by(id: id) || model.new(id: id)
    record.assign_attributes(params.except(:id))

    if parent_check && !parent_check.call(record)
      return :not_visible
    end

    record.save
    record
  end
end
